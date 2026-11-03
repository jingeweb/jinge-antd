import './style.scss';
import { type JNode, type WithOptChildren, cx, expose } from 'jinge';

import { type CheckableProps, checkableLabel, useChecked } from '../_util/checkable';

export type SwitchProps = CheckableProps & {
  label?: string;
  checkedLabel?: string;
  uncheckedLabel?: string;
  loading?: boolean;
} & WithOptChildren<JNode>;

export function Switch(props: SwitchProps) {
  const { state, element } = useChecked(props, () => !!props.loading, true);
  expose({
    focus: (options?: FocusOptions) => element.value?.focus(options),
    blur: () => element.value?.blur(),
  });
  return (
    <label
      className={cx(
        'ja-switch',
        props.size ?? 'md',
        state.checked && 'checked',
        (props.disabled || props.loading) && 'disabled',
        props.loading && 'loading',
        props.className,
      )}
      style={props.style}
    >
      <input
        ref={element}
        type="checkbox"
        role="switch"
        checked={state.checked}
        disabled={props.disabled || props.loading}
        required={props.required}
        id={props.id}
        name={props.name}
        value={props.value ?? 'on'}
        form={props.form}
        tabIndex={props.tabIndex}
        aria-label={props.ariaLabel}
        aria-labelledby={props.ariaLabelledby}
        aria-describedby={props.ariaDescribedby}
        aria-invalid={props.ariaInvalid}
        aria-checked={state.checked}
        aria-busy={props.loading}
      />
      <span className="ja-switch-track" aria-hidden="true">
        <span className="ja-switch-handle">
          {props.loading && <span className="ja-switch-spinner" />}
        </span>
        <span className="ja-switch-caption">
          {state.checked ? (props.checkedLabel ?? '') : (props.uncheckedLabel ?? '')}
        </span>
      </span>
      <span className="ja-switch-label">{props.children ?? checkableLabel(props.label)}</span>
    </label>
  );
}
