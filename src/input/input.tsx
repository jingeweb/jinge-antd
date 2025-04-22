
import {
  type JClipboardEvent,
  type JFormEvent,
  type JNode,
  type WithEvents,
  type WithSlots,
  cx,
  isUndefined,
  vm,
  watch,
} from 'jinge';

export function Input(
  props: {
    className?: string;
    disabled?: boolean;
    placeholder?: string;
    value?: string;
    size?: 'sm' | 'lg' | 'md';
    prefix?: string;
    suffix?: string;
    addonBefore?: string;
    addonAfter?: string;
  } & WithSlots<{
    prefix?: JNode;
    suffix?: JNode;
    addonBefore?: JNode;
    addonAfter?: JNode;
  }> & WithEvents<{
    change?: (value: string, evt: JFormEvent<HTMLInputElement>) => void;
    blur?: (evt: JClipboardEvent<HTMLInputElement>) => void;
    focus?: (evt: JClipboardEvent<HTMLInputElement>) => void;
  }>,
) {
  const notCtrl = isUndefined(props.value);
  const hasDeco = !!props.prefix || !!props.suffix || !!props.addonBefore || !!props.addonAfter || !!props['slot:prefix'] || !!props['slot:suffix'] || !!props['slot:addonBefore'] || !!props['slot:addonAfter'];

  const state = vm({
    value: props.value ?? '',
  });

  watch(props, 'value', (v) => {
    state.value = v ?? '';
  });

  return hasDeco ? <div className={ }>

  </div> : (
    <input
      className={cx('ja-input', props.size ?? 'md', props.className, props.disabled && 'disabled')}
      placeholder={props.placeholder}
      disabled={props.disabled}
      value={state.value}
      on:input={(evt) => {
        const v = evt.target.value;
        if (notCtrl) {
          state.value = v;
        }

        props['on:change']?.(v, evt);
      }}
      on:blur={props['on:blur']}
      on:focus={props['on:focus']}
    />
  );
}
