import {
  type WithExpose,
  cx,
  expose,
  onMount,
  onUnmount,
  ref,
  registerEvent,
  uid,
  vm,
  watch,
} from 'jinge';

import type { InputConfig, TextAreaConfig, PasswordConfig, TextAreaHandle } from './common';

import { AntDesignCloseOutlined } from '../_icon';

type FieldConfig = InputConfig &
  Pick<TextAreaConfig, 'rows' | 'autoSize' | 'resize'> &
  Pick<PasswordConfig, 'visible' | 'defaultVisible' | 'visibilityToggle' | 'on:visibleChange'>;
function text(value: string | null | undefined) {
  return value ?? '';
}
function describedBy(
  description: string | undefined,
  showCount: boolean | undefined,
  countId: string,
) {
  return [description, showCount ? countId : undefined].filter(Boolean).join(' ') || undefined;
}
function countText(value: string, max: number | undefined) {
  return max === undefined ? `${value.length}` : `${value.length} / ${max}`;
}

export function TextField(
  props: {
    kind: 'input' | 'textarea' | 'password';
    config: FieldConfig;
  } & WithExpose<TextAreaHandle>,
) {
  // Keep the stable VM object itself, rather than snapshotting any scalar field.
  const config = props.config;
  const controlled = config.value !== undefined;
  const visibilityControlled = config.visible !== undefined;
  const initial = text(config.defaultValue);
  const state = vm({
    value: controlled ? text(config.value) : initial,
    visible: config.visible ?? config.defaultVisible ?? false,
  });
  const inputElement = ref<HTMLInputElement>();
  const textareaElement = ref<HTMLTextAreaElement>();
  function getElement() {
    return textareaElement.value ?? inputElement.value;
  }
  const internalId = `ja-input-${uid()}`,
    countId = `ja-input-count-${uid()}`;
  let composing = false,
    compositionCommit: string | undefined,
    disposed = false;
  let frame = 0,
    resetFrame = 0,
    selectionFrame = 0,
    hadAutoSize = false;
  let stopResize: (() => void) | undefined, stopReset: (() => void) | undefined;
  let ownerForm: HTMLFormElement | null | undefined;
  function setText(value: string) {
    state.value = value;
    const field = getElement();
    if (field && field.value !== value) field.value = value;
  }
  function resize() {
    const field = getElement();
    if (props.kind !== 'textarea' || !field || disposed) return;
    if (!config.autoSize) {
      if (hadAutoSize) {
        field.style.height = '';
        field.style.overflowY = '';
      }
      hadAutoSize = false;
      return;
    }
    hadAutoSize = true;
    if (!field.clientWidth) return;
    const style = getComputedStyle(field);
    const line = Number.parseFloat(style.lineHeight) || 20;
    const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
    const border =
      Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);
    const options = typeof config.autoSize === 'object' ? config.autoSize : {};
    const minRows = Number.isFinite(options.minRows)
      ? Math.max(1, Math.floor(options.minRows!))
      : 1;
    const maxRows = Number.isFinite(options.maxRows)
      ? Math.max(minRows, Math.floor(options.maxRows!))
      : Infinity;
    field.style.height = '0px';
    const content = field.scrollHeight + border;
    const maximum = maxRows * line + padding + border;
    field.style.height = `${Math.max(minRows * line + padding + border, Math.min(maximum, content))}px`;
    field.style.overflowY = content > maximum ? 'auto' : 'hidden';
  }
  function bindForm() {
    const form = getElement()?.form;
    if (form === ownerForm) return;
    stopReset?.();
    ownerForm = form;
    stopReset = form
      ? registerEvent(form, 'reset', (event) => {
          cancelAnimationFrame(resetFrame);
          resetFrame = requestAnimationFrame(() => {
            resetFrame = 0;
            if (disposed || event.defaultPrevented) return;
            composing = false;
            compositionCommit = undefined;
            setText(controlled ? text(config.value) : initial);
            resize();
          });
        })
      : undefined;
  }
  function schedule() {
    if (disposed) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (disposed) return;
      if (controlled && !composing) setText(text(config.value));
      bindForm();
      resize();
    });
  }
  function publish(value: string, event: Event) {
    setText(value);
    config['on:change']?.(value, event);
    schedule();
  }
  function handleInput(event: Event) {
    cancelAnimationFrame(selectionFrame);
    selectionFrame = 0;
    if (config.disabled || config.readOnly) {
      setText(state.value);
      return;
    }
    const value = getElement()!.value;
    config['on:input']?.(event);
    if (composing || (event as InputEvent).isComposing) {
      setText(value);
      resize();
      return;
    }
    if (compositionCommit !== undefined && value === compositionCommit) {
      compositionCommit = undefined;
      schedule();
      return;
    }
    compositionCommit = undefined;
    publish(value, event);
  }
  function syncObserver() {
    stopResize?.();
    stopResize = undefined;
    const field = getElement();
    if (
      disposed ||
      props.kind !== 'textarea' ||
      !config.autoSize ||
      !field ||
      !window.ResizeObserver
    )
      return;
    let active = true,
      width = -1;
    const observer = new window.ResizeObserver((entries) => {
      if (!active || disposed) return;
      const next = entries[0]?.contentRect.width;
      if (next !== undefined && next !== width) {
        width = next;
        resize();
      }
    });
    observer.observe(field);
    stopResize = () => {
      active = false;
      observer.disconnect();
    };
  }
  watch(config, 'value', (value) => {
    if (controlled && !composing && !disposed) {
      if (compositionCommit !== undefined) compositionCommit = text(value);
      setText(text(value));
      schedule();
    }
  });
  watch(config, 'visible', (value) => {
    if (visibilityControlled) state.visible = !!value;
  });
  watch(
    config,
    'autoSize',
    () => {
      syncObserver();
      schedule();
    },
    { deep: true },
  );
  watch(config, 'form', schedule);
  onMount(() => {
    const field = getElement()!;
    field.defaultValue = state.value;
    const stops = [
      registerEvent(field, 'input', handleInput),
      registerEvent(field, 'compositionstart', () => {
        if (!config.disabled && !config.readOnly) {
          composing = true;
          compositionCommit = undefined;
        }
      }),
      registerEvent(field, 'compositionend', (event) => {
        if (!composing) return;
        composing = false;
        if (config.disabled || config.readOnly) {
          setText(controlled ? text(config.value) : state.value);
          return;
        }
        compositionCommit = field.value;
        publish(field.value, event);
      }),
      registerEvent(field, 'focus', (event) => config['on:focus']?.(event)),
      registerEvent(field, 'blur', (event) => {
        if (controlled && !composing) setText(text(config.value));
        config['on:blur']?.(event);
      }),
      registerEvent(field, 'keydown', (event) => {
        if (
          !config.disabled &&
          !config.readOnly &&
          event.key === 'Enter' &&
          !composing &&
          !event.isComposing &&
          event.keyCode !== 229
        )
          config['on:pressEnter']?.(event);
      }),
    ];
    bindForm();
    syncObserver();
    resize();
    schedule();
    if (config.autoFocus && !config.disabled) field.focus();
    return () => {
      for (const stop of stops) stop();
    };
  });
  onUnmount(() => {
    disposed = true;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(resetFrame);
    cancelAnimationFrame(selectionFrame);
    stopResize?.();
    stopReset?.();
  });
  expose({
    focus: (options?: FocusOptions) => getElement()?.focus(options),
    blur: () => getElement()?.blur(),
    select: () => getElement()?.select(),
    resize,
  });
  function clear(event: MouseEvent) {
    if (config.disabled || config.readOnly) return;
    composing = false;
    compositionCommit = undefined;
    publish('', event);
    config['on:clear']?.(event);
    getElement()?.focus();
  }
  function toggleVisibility() {
    if (config.disabled) return;
    const field = getElement() as HTMLInputElement;
    const start = field.selectionStart,
      end = field.selectionEnd,
      focused = document.activeElement === field;
    const next = !state.visible;
    if (!visibilityControlled) state.visible = next;
    config['on:visibleChange']?.(next);
    schedule();
    cancelAnimationFrame(selectionFrame);
    if (focused)
      selectionFrame = requestAnimationFrame(() => {
        selectionFrame = 0;
        if (!disposed && document.activeElement === field && start !== null && end !== null)
          field.setSelectionRange(start, end);
      });
  }
  return (
    <span
      className={cx(
        'ja-input-field',
        props.kind === 'textarea' && 'ja-textarea-field',
        config.size ?? 'md',
        config.status,
        config.allowClear && 'clearable',
        config.disabled && 'disabled',
        config.noRoundedL && 'no-rounded-l',
        config.noRoundedR && 'no-rounded-r',
        config.className,
      )}
      style={config.style}
    >
      {(config.prefix || config['slot:prefix']) && (
        <span className="ja-input-prefix">{config['slot:prefix'] ?? config.prefix}</span>
      )}
      {props.kind === 'textarea' ? (
        <textarea
          ref={textareaElement}
          className={cx('ja-input ja-textarea-element', config.size ?? 'md')}
          id={config.id ?? internalId}
          name={config.name}
          form={config.form}
          autoComplete={config.autoComplete ?? ''}
          value={state.value}
          placeholder={config.placeholder}
          disabled={config.disabled}
          readOnly={config.readOnly}
          required={config.required}
          maxLength={config.maxLength}
          minLength={config.minLength}
          rows={config.rows ?? 3}
          tabIndex={config.tabIndex}
          aria-label={config.ariaLabel}
          aria-labelledby={config.ariaLabelledby}
          aria-describedby={describedBy(config.ariaDescribedby, config.showCount, countId)}
          aria-invalid={config.ariaInvalid ?? (config.status === 'error' ? true : undefined)}
          style={`resize:${config.autoSize ? 'none' : (config.resize ?? 'vertical')}`}
        />
      ) : (
        <input
          ref={inputElement}
          className={cx(
            'ja-input',
            config.size ?? 'md',
            config.noRoundedL && 'no-rounded-l',
            config.noRoundedR && 'no-rounded-r',
          )}
          type={props.kind === 'password' ? (state.visible ? 'text' : 'password') : config.type}
          id={config.id ?? internalId}
          name={config.name}
          form={config.form}
          autoComplete={config.autoComplete ?? ''}
          value={state.value}
          placeholder={config.placeholder}
          disabled={config.disabled}
          readOnly={config.readOnly}
          required={config.required}
          maxLength={config.maxLength}
          minLength={config.minLength}
          tabIndex={config.tabIndex}
          pattern={config.pattern}
          inputMode={config.inputMode}
          aria-label={config.ariaLabel}
          aria-labelledby={config.ariaLabelledby}
          aria-describedby={describedBy(config.ariaDescribedby, config.showCount, countId)}
          aria-invalid={config.ariaInvalid ?? (config.status === 'error' ? true : undefined)}
        />
      )}
      {config.allowClear && state.value.length > 0 && !config.disabled && !config.readOnly && (
        <button
          type="button"
          className="ja-input-clear"
          aria-label={config.clearLabel ?? '清空输入'}
          on:mouseDown={(event) => event.preventDefault()}
          on:click={clear}
        >
          <AntDesignCloseOutlined />
        </button>
      )}
      {(config.suffix || config['slot:suffix']) && (
        <span className="ja-input-suffix">{config['slot:suffix'] ?? config.suffix}</span>
      )}
      {props.kind === 'password' && config.visibilityToggle !== false && (
        <button
          type="button"
          className="ja-input-visibility"
          disabled={config.disabled}
          aria-label={state.visible ? '隐藏密码' : '显示密码'}
          aria-pressed={state.visible}
          aria-controls={config.id ?? internalId}
          on:mouseDown={(event) => event.preventDefault()}
          on:click={toggleVisibility}
        >
          {state.visible ? '隐藏' : '显示'}
        </button>
      )}
      {config.showCount && (
        <span className="ja-input-count" id={countId}>
          {countText(state.value, config.maxLength)}
        </span>
      )}
    </span>
  );
}
