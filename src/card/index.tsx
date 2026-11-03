import './style.scss';
import { type JNode, type WithOptChildren, type WithSlots, cx, uid } from 'jinge';

export type CardProps = {
  title?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  bordered?: boolean;
  hoverable?: boolean;
  loading?: boolean;
  loadingText?: string;
  className?: string;
  style?: string;
} & WithOptChildren<JNode> &
  WithSlots<{ title?: JNode; extra?: JNode; cover?: JNode; actions?: JNode }>;

export function Card(props: CardProps) {
  const titleId = `ja-card-title-${uid()}`;
  return (
    <section
      className={cx(
        'ja-card',
        props.size ?? 'md',
        props.bordered === false && 'borderless',
        props.hoverable && 'hoverable',
        props.className,
      )}
      style={props.style}
      aria-labelledby={props.title || props['slot:title'] ? titleId : undefined}
      aria-label={props.title || props['slot:title'] ? undefined : props.ariaLabel}
      aria-busy={props.loading ? 'true' : undefined}
    >
      {(props.title || props['slot:title'] || props['slot:extra']) && (
        <header className="ja-card-header">
          {(props.title || props['slot:title']) && (
            <div className="ja-card-title" id={titleId}>
              {props['slot:title'] ? props['slot:title'] : <h3>{props.title}</h3>}
            </div>
          )}
          {props['slot:extra'] && <div className="ja-card-extra">{props['slot:extra']}</div>}
        </header>
      )}
      {props['slot:cover'] && <div className="ja-card-cover">{props['slot:cover']}</div>}
      {props.loading && (
        <div className="ja-card-loading" role="status" aria-label={props.loadingText ?? '加载中'}>
          <i />
          <i />
          <i />
        </div>
      )}
      <div className="ja-card-body" hidden={props.loading ? true : undefined}>
        {props['slot:default'] && props.children}
      </div>
      {props['slot:actions'] && (
        <footer className="ja-card-actions">{props['slot:actions']}</footer>
      )}
    </section>
  );
}
