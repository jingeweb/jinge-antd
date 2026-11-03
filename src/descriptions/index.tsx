import './style.scss';
import { For, type JNode, type WithPropSlot, type WithSlots, cx, uid } from 'jinge';

export type DescriptionsBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type DescriptionsColumns = number | Partial<Record<DescriptionsBreakpoint, number>>;
export type DescriptionItem = {
  key: string;
  content?: string | number | null;
  span?: number | 'filled';
} & WithPropSlot<'label', JNode> &
  WithSlots<{ content?: JNode }>;
export type DescriptionsProps = {
  items: DescriptionItem[];
  title?: string;
  ariaLabel?: string;
  column?: DescriptionsColumns;
  layout?: 'horizontal' | 'vertical';
  colon?: boolean;
  bordered?: boolean;
  size?: 'sm' | 'md' | 'lg';
  emptyText?: string;
  className?: string;
  style?: string;
} & WithSlots<{ title?: JNode; extra?: JNode }>;
function bound(value: number) {
  return Number.isFinite(value) ? Math.max(1, Math.min(6, Math.floor(value))) : 1;
}
function columnStyle(column: DescriptionsColumns = { xs: 1, sm: 2, lg: 3 }) {
  const breakpoints: DescriptionsBreakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
  let previous = 1;
  return breakpoints
    .map((key) => {
      previous =
        typeof column === 'number'
          ? bound(column)
          : column[key] !== undefined
            ? bound(column[key])
            : previous;
      return `--ja-descriptions-cols-${key}:${previous}`;
    })
    .join(';');
}
function spanStyle(span: DescriptionItem['span']) {
  return `--ja-descriptions-span:${typeof span === 'number' ? bound(span) : 1}`;
}
function contentValue(value: DescriptionItem['content'], emptyText: string | undefined) {
  return value ?? emptyText ?? '—';
}
export function Descriptions(props: DescriptionsProps) {
  const titleId = `ja-descriptions-title-${uid()}`;
  return (
    <section
      className={cx(
        'ja-descriptions',
        props.layout ?? 'horizontal',
        props.size ?? 'md',
        props.bordered && 'bordered',
        props.className,
      )}
      style={`${props.style ?? ''};${columnStyle(props.column)}`}
      aria-labelledby={props.title || props['slot:title'] ? titleId : undefined}
      aria-label={props.title || props['slot:title'] ? undefined : props.ariaLabel}
    >
      {(props.title || props['slot:title'] || props['slot:extra']) && (
        <header className="ja-descriptions-header">
          {(props.title || props['slot:title']) && (
            <div className="ja-descriptions-title" id={titleId}>
              {props['slot:title'] ? props['slot:title'] : <h3>{props.title}</h3>}
            </div>
          )}
          {props['slot:extra'] && (
            <div className="ja-descriptions-extra">{props['slot:extra']}</div>
          )}
        </header>
      )}
      <dl className="ja-descriptions-list">
        <For loop={props.items} key="key">
          {(each) => (
            <div
              className={cx('ja-descriptions-item', each.data.span === 'filled' && 'filled')}
              style={spanStyle(each.data.span)}
            >
              <dt
                className={cx(
                  'ja-descriptions-label',
                  props.layout !== 'vertical' && props.colon !== false && 'colon',
                )}
              >
                {each.data['slot:label'] ?? each.data.label}
              </dt>
              <dd className="ja-descriptions-value">
                {each.data['slot:content'] ?? contentValue(each.data.content, props.emptyText)}
              </dd>
            </div>
          )}
        </For>
      </dl>
    </section>
  );
}
