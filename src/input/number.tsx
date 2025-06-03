import './style.scss';

import {
  type JClipboardEvent,
  type JFormEvent,
  type WithEvents,
  cx,
  vm,
  watch,
} from 'jinge';

export function InputNumber(
  props: {
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    size?: 'sm' | 'md' | 'lg',
    noRoundedR?: boolean;
    noRoundedL?: boolean;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
  } & WithEvents<{
    change?: (value: number, evt: JFormEvent<HTMLInputElement>) => void;
    blur?: (evt: JClipboardEvent<HTMLInputElement>) => void;
  }>,
) {
  // const notCtrl = isUndefined(props.value);
  const state = vm({

    strval: `${props.value ?? ''}`,
  });

  watch(props, 'value', (v) => {
    state.strval = `${v ?? ''}`;
  });

  return (
    <input
      type='number'
      className={cx('ja-input ja-input-number', props.noRoundedR && 'no-rounded-r', props.noRoundedL && 'no-rounded-l', props.size ?? 'md', props.className, props.disabled && 'disabled')}
      placeholder={props.placeholder}
      disabled={props.disabled}
      value={state.strval}
      min={props.min}
      max={props.max}
      step={props.step ?? 1}
      on:input={(evt) => {
        const v = evt.target.value;
        state.strval = v;
        const nv = Number(v);
        if (!isNaN(nv)) {
          props['on:change']?.(nv, evt);
        }

      }}
      on:blur={props['on:blur']}
    />
  );
}
