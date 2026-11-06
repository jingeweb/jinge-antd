import { type JNode, type WithChildren, type WithEvents, cx, vm, watch } from 'jinge';

import { AntDesignLeftOutlined, AntDesignRightOutlined } from '../_icon';
import './style.scss';
export type LayoutPartProps = { className?: string; style?: string } & WithChildren<JNode>;
export type LayoutProps = LayoutPartProps & { hasSider?: boolean };
export function Layout(props: LayoutProps) {
  return (
    <div
      className={cx('ja-layout', props.hasSider && 'has-sider', props.className)}
      style={props.style}
    >
      {props.children}
    </div>
  );
}
export function LayoutHeader(props: LayoutPartProps) {
  return (
    <header className={cx('ja-layout-header', props.className)} style={props.style}>
      {props.children}
    </header>
  );
}
export function Content(props: LayoutPartProps) {
  return (
    <section className={cx('ja-layout-content', props.className)} style={props.style}>
      {props.children}
    </section>
  );
}
export function LayoutFooter(props: LayoutPartProps) {
  return (
    <footer className={cx('ja-layout-footer', props.className)} style={props.style}>
      {props.children}
    </footer>
  );
}
export type SiderProps = LayoutPartProps & {
  width?: number | string;
  collapsedWidth?: number | string;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  collapsible?: boolean;
  ariaLabel?: string;
} & WithEvents<{ collapse?: (collapsed: boolean) => void }>;
function widthStyle(width: number | string) {
  return typeof width === 'number' ? `${Number.isFinite(width) ? Math.max(0, width) : 0}px` : width;
}
export function Sider(props: SiderProps) {
  const controlled = props.collapsed !== undefined;
  const state = vm({ collapsed: props.collapsed ?? props.defaultCollapsed ?? false });
  watch(props, 'collapsed', (value) => {
    if (controlled) state.collapsed = !!value;
  });
  return (
    <aside
      className={cx('ja-layout-sider', state.collapsed && 'collapsed', props.className)}
      aria-label={props.ariaLabel ?? '侧边栏'}
      style={`width:${widthStyle(state.collapsed ? (props.collapsedWidth ?? 80) : (props.width ?? 200))};${props.style ?? ''}`}
    >
      <div className="ja-layout-sider-content">{props.children}</div>
      {props.collapsible && (
        <button
          type="button"
          className="ja-layout-sider-trigger"
          aria-expanded={!state.collapsed}
          aria-label={state.collapsed ? '展开侧边栏' : '收起侧边栏'}
          on:click={() => {
            const next = !state.collapsed;
            if (!controlled) state.collapsed = next;
            props['on:collapse']?.(next);
          }}
        >
          <span aria-hidden="true">
            {state.collapsed ? <AntDesignRightOutlined /> : <AntDesignLeftOutlined />}
          </span>
        </button>
      )}
    </aside>
  );
}
