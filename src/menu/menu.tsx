import { For, cx, expose, onMount, ref, uid } from 'jinge';

import { navigationHref, navigationRel } from '../_util/navigation';
import { Floating } from '../floating';
import {
  type MenuOption,
  type MenuProps,
  type MenuValue,
  menuChildren,
  menuLabel,
  menuOpen,
} from './common';
import { type MenuController, useMenu } from './use-menu';
export type { MenuOption, MenuProps, MenuValue, MenuHandle } from './common';

function entryDisabled(disabled: boolean, href?: string) {
  return disabled || (href !== undefined && navigationHref(href) === undefined);
}
function MenuEntry<T extends MenuValue>(props: {
  option: MenuOption<T>;
  owner: MenuController<T>;
  disabled: boolean;
  submenuId: string;
}) {
  const state = props.owner.state;
  const button = ref<HTMLButtonElement>(),
    anchor = ref<HTMLAnchorElement>();
  onMount(() => props.owner.attach(props.option.value, () => anchor.value ?? button.value));
  return (
    <>
      {props.option.href !== undefined && !menuChildren(props.option.children) ? (
        <a
          ref={anchor}
          role="menuitem"
          className={cx(
            'ja-menu-item',
            state.value === props.option.value && 'ja-active',
            props.option.danger && 'danger',
            entryDisabled(props.disabled, props.option.href) && 'disabled',
          )}
          href={
            entryDisabled(props.disabled, props.option.href)
              ? undefined
              : navigationHref(props.option.href)
          }
          target={props.option.target}
          rel={navigationRel(props.option.target, props.option.rel)}
          aria-label={props.option.ariaLabel}
          aria-disabled={entryDisabled(props.disabled, props.option.href) || undefined}
          aria-current={state.value === props.option.value ? 'page' : undefined}
          tabIndex={
            !entryDisabled(props.disabled, props.option.href) && state.active === props.option.value
              ? 0
              : -1
          }
          on:focus={() => {
            if (!entryDisabled(props.disabled, props.option.href))
              state.active = props.option.value;
          }}
          on:keyDown={(event) => props.owner.key(props.option.value, event)}
          on:click={(event) => props.owner.activate(props.option.value, event)}
        >
          {props.option['slot:icon'] && (
            <span className="ja-menu-icon" aria-hidden="true">
              {props.option['slot:icon']}
            </span>
          )}
          <span className="ja-menu-item-label">
            {props.option['slot:label'] ?? menuLabel(props.option)}
          </span>
        </a>
      ) : (
        <button
          ref={button}
          type="button"
          role="menuitem"
          disabled={entryDisabled(props.disabled, props.option.href)}
          className={cx(
            'ja-menu-item',
            state.value === props.option.value && 'ja-active',
            props.option.danger && 'danger',
          )}
          aria-label={props.option.ariaLabel}
          aria-current={
            !menuChildren(props.option.children) && state.value === props.option.value
              ? 'page'
              : undefined
          }
          aria-haspopup={menuChildren(props.option.children) ? 'menu' : undefined}
          aria-expanded={
            menuChildren(props.option.children)
              ? menuOpen(state.open, props.option.value)
              : undefined
          }
          aria-controls={
            menuChildren(props.option.children) && menuOpen(state.open, props.option.value)
              ? props.submenuId
              : undefined
          }
          tabIndex={
            !entryDisabled(props.disabled, props.option.href) && state.active === props.option.value
              ? 0
              : -1
          }
          on:focus={() => {
            if (!entryDisabled(props.disabled, props.option.href))
              state.active = props.option.value;
          }}
          on:keyDown={(event) => props.owner.key(props.option.value, event)}
          on:click={(event) => props.owner.activate(props.option.value, event)}
        >
          {props.option['slot:icon'] && (
            <span className="ja-menu-icon" aria-hidden="true">
              {props.option['slot:icon']}
            </span>
          )}
          <span className="ja-menu-item-label">
            {props.option['slot:label'] ?? menuLabel(props.option)}
          </span>
          {menuChildren(props.option.children) && (
            <span className="ja-menu-arrow" aria-hidden="true" />
          )}
        </button>
      )}
    </>
  );
}
function MenuNode<T extends MenuValue>(props: {
  option: MenuOption<T>;
  owner: MenuController<T>;
  disabled: boolean;
  depth: number;
}) {
  const state = props.owner.state,
    id = `ja-submenu-${uid()}`;
  return (
    <>
      {props.option.type === 'divider' ? (
        <li role="separator" className="ja-menu-divider" />
      ) : props.option.type === 'group' ? (
        <li role="presentation" className="ja-menu-group">
          <div className="ja-menu-group-label">
            {props.option['slot:label'] ?? menuLabel(props.option)}
          </div>
          <ul role="group" aria-label={menuLabel(props.option)}>
            <MenuBranch
              items={props.option.children ?? []}
              owner={props.owner}
              disabled={props.disabled || props.option.disabled || state.disabled}
              depth={props.depth}
            />
          </ul>
        </li>
      ) : (
        <li
          role="presentation"
          className={cx('ja-menu-node', menuOpen(state.open, props.option.value) && 'open')}
        >
          {props.owner.mode === 'horizontal' && menuChildren(props.option.children) ? (
            <Floating
              id={id}
              role="menu"
              ariaLabel={menuLabel(props.option)}
              zIndex={props.owner.layer + props.depth}
              open={menuOpen(state.open, props.option.value)}
              disabled={props.disabled || props.option.disabled || state.disabled}
              triggerMethod="none"
              placement={props.depth === 0 ? 'bottom-start' : 'right-start'}
              offset={4}
              className="ja-menu-popup"
              on:openChange={(open, event) => props.owner.open(props.option.value, open, event)}
              slot:trigger={
                <MenuEntry
                  option={props.option}
                  owner={props.owner}
                  disabled={props.disabled || !!props.option.disabled || state.disabled}
                  submenuId={id}
                />
              }
            >
              <ul role="presentation">
                <MenuBranch
                  items={props.option.children ?? []}
                  owner={props.owner}
                  disabled={props.disabled || props.option.disabled || state.disabled}
                  depth={props.depth + 1}
                />
              </ul>
            </Floating>
          ) : (
            <>
              <MenuEntry
                option={props.option}
                owner={props.owner}
                disabled={props.disabled || !!props.option.disabled || state.disabled}
                submenuId={id}
              />
              {menuChildren(props.option.children) && (
                <ul
                  role="menu"
                  aria-label={menuLabel(props.option)}
                  id={id}
                  hidden={!menuOpen(state.open, props.option.value)}
                  className="ja-menu-submenu"
                >
                  <MenuBranch
                    items={props.option.children ?? []}
                    owner={props.owner}
                    disabled={props.disabled || props.option.disabled || state.disabled}
                    depth={props.depth + 1}
                  />
                </ul>
              )}
            </>
          )}
        </li>
      )}
    </>
  );
}
function MenuBranch<T extends MenuValue>(props: {
  items: MenuOption<T>[];
  owner: MenuController<T>;
  disabled?: boolean;
  depth: number;
}) {
  return (
    <For loop={props.items} key="value">
      {(each) => (
        <MenuNode
          option={each.data}
          owner={props.owner}
          disabled={!!props.disabled}
          depth={props.depth}
        />
      )}
    </For>
  );
}
export function Menu<T extends MenuValue>(props: MenuProps<T>) {
  const root = ref<HTMLUListElement>();
  const owner = useMenu(props, () => root.value),
    state = owner.state;
  expose({
    focus: (edge?: 'first' | 'last') => {
      const available = owner.visible();
      owner.focus(
        (edge === 'last'
          ? available.at(-1)
          : edge === 'first'
            ? available[0]
            : (available.find((entry) => entry.option.value === state.active) ?? available[0])
        )?.option.value,
      );
    },
  });
  return (
    <div className={cx('ja-menu', owner.mode, props.className)} style={props.style}>
      <ul
        on:keyDown={(event) => {
          if (event.target === root.value && (event.key === 'Tab' || event.key === 'Escape'))
            props['on:dismiss']?.(event);
        }}
        ref={root}
        role={props.rootRole ?? (props.mode === 'horizontal' ? 'menubar' : 'menu')}
        aria-label={props.rootRole === 'presentation' ? undefined : (props.ariaLabel ?? '菜单')}
        aria-orientation={
          props.rootRole === 'presentation'
            ? undefined
            : props.mode === 'horizontal'
              ? 'horizontal'
              : 'vertical'
        }
        aria-disabled={state.disabled || undefined}
        tabIndex={state.active === undefined && !state.disabled ? 0 : -1}
      >
        <MenuBranch items={props.options} owner={owner} depth={0} />
        {props.options.length === 0 && (
          <li role="presentation" className="ja-menu-empty">
            <span role="status">{props.emptyText ?? '暂无菜单'}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
