import './style.scss';
import { For, type WithEvents, cx, onMount, onUnmount, ref, registerEvent, vm, watch } from 'jinge';

import { clampPage, itemTotal, pageCount, pageItems, positiveInteger, sizeOptions } from './common';
export type PaginationProps = {
  total?: number;
  current?: number;
  defaultCurrent?: number;
  pageSize?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: boolean;
  simple?: boolean;
  hideOnSinglePage?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md';
  ariaLabel?: string;
  className?: string;
  style?: string;
} & WithEvents<{
  change?(current: number, pageSize: number): void;
  pageSizeChange?(pageSize: number): void;
}>;
export function Pagination(props: PaginationProps) {
  const controlledPage = props.current !== undefined,
    controlledSize = props.pageSize !== undefined;
  const state = vm({
    current: 1,
    size: positiveInteger(props.pageSize ?? props.defaultPageSize),
    draft: '',
  });
  state.current = clampPage(props.current ?? props.defaultCurrent, props.total ?? 0, state.size);
  const select = ref<HTMLSelectElement>();
  const root = ref<HTMLElement>();
  let stopReset: (() => void) | undefined;
  let frame = 0,
    disposed = false;
  function sync() {
    if (controlledSize) state.size = positiveInteger(props.pageSize);
    state.current = clampPage(
      controlledPage ? props.current : state.current,
      props.total ?? 0,
      state.size,
    );
    if (select.value) select.value.value = `${state.size}`;
  }
  watch(props, 'total', sync);
  watch(props, 'current', sync);
  watch(props, 'pageSize', sync);
  function change(page: number, size = state.size) {
    if (props.disabled) return;
    const next = clampPage(page, props.total ?? 0, size);
    if (next === state.current && size === state.size) return;
    const sizeChanged = size !== state.size;
    if (!controlledSize) state.size = size;
    if (!controlledPage) state.current = next;
    if (sizeChanged) props['on:pageSizeChange']?.(size);
    props['on:change']?.(next, size);
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!disposed) sync();
    });
  }
  function jump(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (event.isComposing) return;
      const draft = (event.currentTarget as HTMLInputElement).value;
      if (/^\d+$/.test(draft) && Number(draft) > 0) change(Number(draft));
      state.draft = '';
    } else if (event.key === 'Escape') state.draft = '';
  }
  onMount(() => {
    const form = root.value?.closest('form');
    if (form)
      stopReset = registerEvent(form, 'reset', () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          frame = 0;
          if (!disposed) sync();
        });
      });
  });
  onUnmount(() => {
    disposed = true;
    cancelAnimationFrame(frame);
    stopReset?.();
  });
  return (
    <nav
      ref={root}
      aria-label={props.ariaLabel ?? '分页'}
      className={cx('ja-pagination', props.size ?? 'md', props.className)}
      style={props.style}
      hidden={
        props.hideOnSinglePage && pageCount(props.total ?? 0, state.size) <= 1 ? true : undefined
      }
    >
      {props.showTotal && (
        <span className="ja-pagination-total">共 {itemTotal(props.total)} 条</span>
      )}
      <button
        type="button"
        aria-label="上一页"
        disabled={props.disabled || state.current <= 1}
        on:click={() => change(state.current - 1)}
      >
        ‹
      </button>
      {props.simple ? (
        <span className="ja-pagination-simple" aria-live="polite">
          {state.current} / {pageCount(props.total ?? 0, state.size)}
        </span>
      ) : (
        <For loop={pageItems(state.current, pageCount(props.total ?? 0, state.size))} key="key">
          {(each) => (
            <button
              type="button"
              aria-label={
                each.data.jump
                  ? each.data.jump === 'previous'
                    ? '向前跳 5 页'
                    : '向后跳 5 页'
                  : `第 ${each.data.page} 页`
              }
              aria-current={
                !each.data.jump && each.data.page === state.current ? 'page' : undefined
              }
              disabled={props.disabled}
              on:click={() => change(each.data.page)}
            >
              {each.data.jump ? '•••' : each.data.page}
            </button>
          )}
        </For>
      )}
      <button
        type="button"
        aria-label="下一页"
        disabled={props.disabled || state.current >= pageCount(props.total ?? 0, state.size)}
        on:click={() => change(state.current + 1)}
      >
        ›
      </button>
      {props.showSizeChanger && (
        <select
          aria-label="每页条数"
          ref={select}
          value={`${state.size}`}
          disabled={props.disabled}
          on:change={(event) =>
            change(1, positiveInteger(Number((event.target as HTMLSelectElement).value)))
          }
        >
          <For loop={sizeOptions(props.pageSizeOptions, state.size)}>
            {(each) => <option value={`${each.data}`}>{each.data} 条/页</option>}
          </For>
        </select>
      )}
      {props.showQuickJumper && (
        <label className="ja-pagination-jumper">
          跳至{' '}
          <input
            aria-label="跳转页码"
            inputMode="numeric"
            value={state.draft}
            disabled={props.disabled}
            on:input={(event) => {
              state.draft = (event.target as HTMLInputElement).value;
            }}
            on:keyDown={jump}
            on:blur={() => {
              state.draft = '';
            }}
          />{' '}
          页
        </label>
      )}
    </nav>
  );
}
