import './style.scss';
import { For, type JNode, type WithEvents, type WithSlots, cx } from 'jinge';

import { navigationHref, navigationRel } from '../_util/navigation';
export type BreadcrumbItem = {
  key: string;
  label: string;
  href?: string;
  target?: '_self' | '_blank' | '_parent' | '_top';
  rel?: string;
  disabled?: boolean;
  separator?: string;
} & WithSlots<{ label?: JNode; icon?: JNode }>;
export type BreadcrumbProps = {
  items: BreadcrumbItem[];
  separator?: string;
  ariaLabel?: string;
  className?: string;
  style?: string;
} & WithSlots<{ separator?: JNode }> &
  WithEvents<{ click?(item: BreadcrumbItem, event: MouseEvent): void }>;
function disabled(item: BreadcrumbItem) {
  return !!item.disabled || (item.href !== undefined && navigationHref(item.href) === undefined);
}
function separator(item: string | undefined, global: string | undefined) {
  return item ?? global ?? '/';
}
export function Breadcrumb(props: BreadcrumbProps) {
  return (
    <nav
      aria-label={props.ariaLabel ?? '面包屑'}
      className={cx('ja-breadcrumb', props.className)}
      style={props.style}
    >
      <ol>
        <For loop={props.items} key="key">
          {(each) => (
            <li>
              {each.data['slot:icon'] && (
                <span className="ja-breadcrumb-icon" aria-hidden="true">
                  {each.data['slot:icon']}
                </span>
              )}
              {each.index === props.items.length - 1 ? (
                <span
                  aria-current="page"
                  aria-disabled={each.data.disabled || undefined}
                  className="ja-breadcrumb-current"
                >
                  {each.data['slot:label'] ?? each.data.label}
                </span>
              ) : each.data.href !== undefined && !disabled(each.data) ? (
                <a
                  href={navigationHref(each.data.href)}
                  target={each.data.target}
                  rel={navigationRel(each.data.target, each.data.rel)}
                  aria-label={each.data.label}
                  on:click={(event) => props['on:click']?.(each.data, event)}
                >
                  {each.data['slot:label'] ?? each.data.label}
                </a>
              ) : (
                <span aria-disabled={disabled(each.data) || undefined}>
                  {each.data['slot:label'] ?? each.data.label}
                </span>
              )}
              {each.index < props.items.length - 1 && (
                <span className="ja-breadcrumb-separator" aria-hidden="true">
                  {props['slot:separator'] ?? separator(each.data.separator, props.separator)}
                </span>
              )}
            </li>
          )}
        </For>
      </ol>
    </nav>
  );
}
