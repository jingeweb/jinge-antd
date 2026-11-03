import './style.scss';
import {
  type JNode,
  type WithOptChildren,
  type WithSlots,
  cx,
  onMount,
  onUnmount,
  ref,
  vm,
  watch,
} from 'jinge';
export type SpinProps = {
  spinning?: boolean;
  delay?: number;
  size?: 'sm' | 'md' | 'lg';
  tip?: string;
  ariaLabel?: string;
  className?: string;
  style?: string;
} & WithOptChildren<JNode> &
  WithSlots<{ indicator?: JNode; tip?: JNode }>;
function delayMs(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) ? Math.max(0, value) : 0;
}
function Dots() {
  return (
    <span className="ja-spin-dots">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
export function Spin(props: SpinProps) {
  const content = ref<HTMLDivElement>();
  const state = vm({ visible: props.spinning !== false && delayMs(props.delay) === 0 });
  let mounted = false,
    disposed = false,
    timer = 0;
  function clear() {
    window.clearTimeout(timer);
    timer = 0;
  }
  function sync() {
    clear();
    if (disposed) return;
    if (props.spinning !== false) content.value?.setAttribute('inert', '');
    else content.value?.removeAttribute('inert');
    if (props.spinning === false) {
      state.visible = false;
      return;
    }
    if (state.visible) return;
    const delay = delayMs(props.delay);
    if (!delay) state.visible = true;
    else if (mounted)
      timer = window.setTimeout(() => {
        timer = 0;
        if (!disposed && props.spinning !== false) state.visible = true;
      }, delay);
  }
  watch(props, 'spinning', sync);
  watch(props, 'delay', sync);
  onMount(() => {
    mounted = true;
    sync();
  });
  onUnmount(() => {
    disposed = true;
    clear();
  });
  return (
    <div
      className={cx(
        'ja-spin',
        props.size ?? 'md',
        !!props['slot:default'] && 'with-content',
        state.visible && 'spinning',
        props.className,
      )}
      style={props.style}
      aria-busy={props.spinning !== false ? 'true' : undefined}
    >
      {props['slot:default'] && (
        <div className="ja-spin-content" ref={content}>
          {props.children}
        </div>
      )}
      {state.visible && (
        <div
          className="ja-spin-status"
          role="status"
          aria-label={props.ariaLabel ?? props.tip ?? '加载中'}
        >
          <span className="ja-spin-indicator" aria-hidden="true">
            {props['slot:indicator'] ? props['slot:indicator'] : <Dots />}
          </span>
          {(props.tip || props['slot:tip']) && (
            <div className="ja-spin-tip">{props['slot:tip'] ?? props.tip}</div>
          )}
        </div>
      )}
    </div>
  );
}
