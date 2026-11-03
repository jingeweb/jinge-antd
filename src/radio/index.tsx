import './style.scss';
import { For, type JNode, type WithOptChildren, cx, expose, uid, watch } from 'jinge';

import { type CheckableProps, checkableLabel, useChecked } from '../_util/checkable';
import {
  type ChoiceGroupBase,
  type ChoiceValue,
  type SelectionProps,
  useChoiceGroup,
} from '../_util/choice-group';
export type RadioProps = CheckableProps & {
  label?: string;
  variant?: 'default' | 'button';
} & WithOptChildren<JNode>;
export function Radio(props: RadioProps) {
  const { state, element } = useChecked(props);
  expose({
    focus: (options?: FocusOptions) => element.value?.focus(options),
    blur: () => element.value?.blur(),
  });
  return (
    <label
      className={cx(
        'ja-choice ja-radio',
        props.variant,
        props.size ?? 'md',
        props.disabled && 'disabled',
        props.className,
      )}
      style={props.style}
    >
      <input
        ref={element}
        type="radio"
        checked={state.checked}
        disabled={props.disabled}
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
      />
      <span className="ja-choice-label">{props.children ?? checkableLabel(props.label)}</span>
    </label>
  );
}
export type RadioGroupProps<T extends ChoiceValue = ChoiceValue> = ChoiceGroupBase<T> &
  SelectionProps<T | undefined> & { required?: boolean; variant?: 'default' | 'button' };
function normalize<T extends ChoiceValue>(
  value: T | null | undefined,
  options: ChoiceGroupBase<T>['options'],
) {
  return value !== null && value !== undefined && options.some((option) => option.value === value)
    ? value
    : undefined;
}
export function RadioGroup<T extends ChoiceValue>(props: RadioGroupProps<T>) {
  const { state, element, change, sync } = useChoiceGroup<T | undefined>(props, (value) =>
    normalize(value, props.options),
  );
  const name = `ja-radio-${uid()}`;
  watch(props, 'options', sync, { deep: true });
  function select(value: T, checked: boolean, event: Event) {
    if (
      !checked ||
      props.disabled ||
      props.options.find((option) => option.value === value)?.disabled
    )
      return;
    change(value, event);
  }
  return (
    <fieldset
      role="radiogroup"
      ref={element}
      id={props.id}
      form={props.form}
      disabled={props.disabled}
      className={cx(
        'ja-choice-group ja-radio-group',
        props.direction ?? 'horizontal',
        props.variant,
        props.className,
      )}
      style={props.style}
      aria-label={props.ariaLabel}
      aria-labelledby={props.ariaLabelledby}
      aria-describedby={props.ariaDescribedby}
      aria-invalid={props.ariaInvalid}
    >
      {props.legend && <legend>{props.legend}</legend>}
      <div className="ja-choice-options">
        <For loop={props.options} key="value">
          {(each) => (
            <Radio
              id={each.data.id}
              name={props.name ?? name}
              form={props.form}
              value={each.data.value}
              checked={state.value === each.data.value}
              disabled={props.disabled || each.data.disabled}
              size={props.size}
              required={props.required}
              variant={props.variant}
              on:change={(checked, event) => select(each.data.value, checked, event)}
            >
              {each.data['slot:label'] ?? each.data.label}
            </Radio>
          )}
        </For>
      </div>
    </fieldset>
  );
}
