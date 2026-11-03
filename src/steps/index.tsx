import './style.scss';
import { For, type JNode, type WithEvents, type WithPropSlot, type WithSlots, cx } from 'jinge';
export type StepStatus = 'wait' | 'process' | 'finish' | 'error';
export type StepItem = {
  key: string | number;
  description?: string;
  disabled?: boolean;
  status?: StepStatus;
} & WithPropSlot<'title', JNode> &
  WithSlots<{ description?: JNode; icon?: JNode }>;
export type StepsProps = {
  items: StepItem[];
  current?: number;
  status?: StepStatus;
  direction?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
  responsive?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: string;
} & WithEvents<{ change?(index: number): void }>;
function stepStatus(
  item: StepItem,
  index: number,
  current = 0,
  status: StepStatus = 'process',
): StepStatus {
  return item.status ?? (index < current ? 'finish' : index === current ? status : 'wait');
}
function symbol(status: StepStatus, index: number) {
  return status === 'finish' ? '✓' : status === 'error' ? '×' : `${index + 1}`;
}
function statusText(status: StepStatus) {
  return { wait: '未开始', process: '进行中', finish: '已完成', error: '错误' }[status];
}
function StepBody(props: { item: StepItem; index: number; status: StepStatus }) {
  return (
    <>
      <span className="ja-step-icon" aria-hidden="true">
        {props.item['slot:icon'] ?? symbol(props.status, props.index)}
      </span>
      <span className="ja-step-text">
        <span className="ja-step-title">{props.item['slot:title'] ?? props.item.title}</span>
        <span className="ja-step-status">{statusText(props.status)}</span>
        <span className="ja-step-description">
          {props.item['slot:description'] ?? props.item.description}
        </span>
      </span>
    </>
  );
}
export function Steps(props: StepsProps) {
  function select(index: number, item: StepItem) {
    if (!props.disabled && !item.disabled && index !== (props.current ?? 0))
      props['on:change']?.(index);
  }
  return (
    <ol
      aria-label={props.ariaLabel ?? '步骤'}
      className={cx(
        'ja-steps',
        props.direction ?? 'horizontal',
        props.size ?? 'md',
        props.responsive !== false && 'responsive',
        props.className,
      )}
      style={props.style}
    >
      <For loop={props.items} key="key">
        {(each) => (
          <li
            aria-current={each.index === (props.current ?? 0) ? 'step' : undefined}
            className={cx(
              'ja-step',
              stepStatus(each.data, each.index, props.current, props.status),
              (props.disabled || each.data.disabled) && 'disabled',
            )}
          >
            {props['on:change'] ? (
              <button
                type="button"
                className="ja-step-body"
                disabled={props.disabled || each.data.disabled}
                on:click={() => select(each.index, each.data)}
              >
                <StepBody
                  item={each.data}
                  index={each.index}
                  status={stepStatus(each.data, each.index, props.current, props.status)}
                />
              </button>
            ) : (
              <div className="ja-step-body">
                <StepBody
                  item={each.data}
                  index={each.index}
                  status={stepStatus(each.data, each.index, props.current, props.status)}
                />
              </div>
            )}
          </li>
        )}
      </For>
    </ol>
  );
}
