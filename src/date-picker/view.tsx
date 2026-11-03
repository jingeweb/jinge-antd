import {
  type JNode,
  type WithSlots,
  type WithChildren,
  cx,
  onMount,
  ref,
  registerEvent,
} from 'jinge';

import type { PickerProps } from './common';
import type { PickerControl } from './use-picker';

import { Floating } from '../floating';
function PickerPopup<T>(props: { control: PickerControl<T> } & WithChildren<JNode>) {
  const control = props.control;
  onMount(() => registerEvent(control.popup.value!, 'focusout', control.blur));
  return (
    <div className="ja-picker-panel" ref={control.popup} on:keyDown={control.popupKey}>
      {props.children}
    </div>
  );
}
function serialized<T>(control: PickerControl<T>, value: T | null) {
  return value ? control.codec.serialize(value) : '';
}
export function PickerView<T>(
  props: {
    config: PickerProps<T>;
    control: PickerControl<T>;
    kind: 'date' | 'time' | 'range';
  } & WithSlots<{ panel: JNode }>,
) {
  const config = props.config,
    control = props.control,
    state = control.state;
  const hidden = ref<HTMLInputElement>();
  return (
    <>
      <Floating
        id={control.id}
        role="dialog"
        ariaLabel={
          props.kind === 'time' ? '选择时间' : props.kind === 'range' ? '选择日期范围' : '选择日期'
        }
        zIndex={control.layer}
        open={state.open}
        disabled={config.disabled || config.readOnly || !control.supported}
        triggerMethod="none"
        placement="bottom-start"
        offset={4}
        returnFocus={false}
        autoFocus={false}
        className="ja-picker-popup"
        on:openChange={control.request}
        slot:trigger={
          <span
            ref={control.root}
            className={cx(
              'ja-picker',
              config.size ?? 'md',
              config.status,
              state.invalid && 'error',
              config.disabled && 'disabled',
              config.className,
            )}
            style={config.style}
          >
            <input
              className="ja-picker-input"
              ref={control.input}
              id={config.id}
              type="text"
              value={state.text}
              disabled={config.disabled || !control.supported}
              readOnly={config.readOnly}
              required={config.required}
              form={config.form}
              placeholder={config.placeholder ?? (props.kind === 'time' ? '选择时间' : '选择日期')}
              aria-label={config.ariaLabel}
              aria-labelledby={config.ariaLabelledby}
              aria-describedby={config.ariaDescribedby}
              aria-invalid={
                config.ariaInvalid || state.invalid || config.status === 'error' ? true : undefined
              }
              role="combobox"
              aria-required={config.required}
              aria-haspopup="dialog"
              aria-expanded={state.open}
              aria-controls={state.open ? control.id : undefined}
              on:input={control.edit}
              on:keyDown={control.inputKey}
              on:click={(event) => control.request(true, event)}
            />
            {config.allowClear && state.value && (
              <button
                type="button"
                aria-label={props.kind === 'time' ? '清空时间' : '清空日期'}
                className="ja-picker-clear"
                disabled={config.disabled || config.readOnly}
                on:mouseDown={(event) => event.preventDefault()}
                on:click={(event) => control.choose(null, event)}
              >
                ×
              </button>
            )}
            <button
              type="button"
              tabIndex={-1}
              aria-label={
                props.kind === 'time'
                  ? '打开时间选择'
                  : props.kind === 'range'
                    ? '打开范围选择'
                    : '打开日期选择'
              }
              className="ja-picker-trigger"
              disabled={config.disabled || config.readOnly || !control.supported}
              on:click={(event) => {
                control.request(!state.open, event);
                control.focusPanel();
              }}
            >
              ▦
            </button>
            <input
              ref={hidden}
              type="hidden"
              name={config.name}
              form={config.form}
              value={serialized(control, state.value)}
              disabled={config.disabled}
            />
          </span>
        }
      >
        <PickerPopup control={control}>{props['slot:panel']}</PickerPopup>
      </Floating>
      {!control.supported && (
        <span role="alert" className="ja-picker-unsupported">
          当前浏览器不支持原生 Temporal，日期和时间选择不可用。
        </span>
      )}
    </>
  );
}
