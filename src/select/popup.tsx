import { For, cx, type JNode, type WithSlots, type WithEvents } from 'jinge';

import { type ComboState, type SelectValue, type SelectOption, includesValue } from './common';

export function ComboList<T extends SelectValue>(
  props: {
    state: ComboState<T>;
    values: T[];
    loading?: boolean;
    loadingText?: string;
    emptyText?: string;
  } & WithSlots<{ option?: (props: { option: SelectOption<T> }) => JNode }> &
    WithEvents<{ choose(option: SelectOption<T>, event: Event): void }>,
) {
  // A stable VM supplied by the owner; subscribing directly avoids the F08 nested-props gap.
  const state = props.state;
  return (
    <>
      {props.loading ? (
        <div role="status" className="ja-select-empty">
          {props.loadingText ?? '加载中…'}
        </div>
      ) : state.rows.length === 0 ? (
        <div role="status" className="ja-select-empty">
          {props.emptyText ?? '暂无选项'}
        </div>
      ) : (
        <For loop={state.groups} key="key">
          {(group) => (
            <div
              role={group.data.label ? 'group' : 'presentation'}
              aria-label={group.data.label}
              className="ja-select-group"
            >
              {group.data.label && (
                <div className="ja-select-group-label" aria-hidden="true">
                  {group.data.label}
                </div>
              )}
              <For loop={group.data.rows} key="value">
                {(row) => (
                  <div
                    role="option"
                    id={row.data.id}
                    aria-label={row.data.label}
                    aria-selected={includesValue(props.values, row.data.value)}
                    aria-disabled={row.data.disabled}
                    className={cx(
                      'ja-select-option ja-menu-item',
                      includesValue(props.values, row.data.value) && 'ja-active',
                      state.active === row.data.id && 'highlighted',
                      row.data.disabled && 'disabled',
                    )}
                    on:mouseDown={(event) => event.preventDefault()}
                    on:click={(event) => {
                      if (!row.data.disabled && !props.loading) props['on:choose'](row.data, event);
                    }}
                  >
                    {props['slot:option'] ? (
                      props['slot:option']({ option: row.data })
                    ) : (
                      <span>{row.data.label}</span>
                    )}
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
      )}
    </>
  );
}
