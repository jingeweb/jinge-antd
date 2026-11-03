import './style.scss';
import { For, type JNode, type WithOptChildren, cx, expose, watch } from 'jinge';

import { type CheckableProps, checkableLabel, useChecked } from '../_util/checkable';
import {
  type ChoiceGroupBase,
  type ChoiceValue,
  type SelectionProps,
  useChoiceGroup,
} from '../_util/choice-group';
export type { CheckableHandle } from '../_util/checkable';
export type { ChoiceOption, ChoiceValue } from '../_util/choice-group';
export type CheckboxProps = CheckableProps & {
  label?: string;
  indeterminate?: boolean;
} & WithOptChildren<JNode>;

export function Checkbox(props: CheckboxProps) {
  const { state, element } = useChecked(props);
  expose({
    focus: (options?: FocusOptions) => element.value?.focus(options),
    blur: () => element.value?.blur(),
  });
  return (
    <label
      className={cx(
        'ja-choice ja-checkbox',
        props.size ?? 'md',
        props.disabled && 'disabled',
        props.className,
      )}
      style={props.style}
    >
      <input
        ref={element}
        type="checkbox"
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
        aria-checked={props.indeterminate ? 'mixed' : state.checked}
      />
      <span className="ja-choice-label">{props.children ?? checkableLabel(props.label)}</span>
    </label>
  );
}
export type CheckboxGroupProps<T extends ChoiceValue = ChoiceValue> = ChoiceGroupBase<T> &
  SelectionProps<T[]>;
function selected<T extends ChoiceValue>(values: T[], value: T) {
  return values.includes(value);
}
function normalize<T extends ChoiceValue>(
  values: T[] | null | undefined,
  options: ChoiceGroupBase<T>['options'],
) {
  const available = new Set(options.map((option) => option.value));
  return [...new Set(values ?? [])].filter((value) => available.has(value));
}
export function CheckboxGroup<T extends ChoiceValue>(props: CheckboxGroupProps<T>) {
  const { state, element, change, sync } = useChoiceGroup(props, (values) =>
    normalize(values, props.options),
  );
  watch(props, 'options', sync, { deep: true });
  function toggle(value: T, checked: boolean, event: Event) {
    if (props.disabled || props.options.find((option) => option.value === value)?.disabled) return;
    change(checked ? [...state.value, value] : state.value.filter((item) => item !== value), event);
  }
  return (
    <fieldset
      ref={element}
      id={props.id}
      form={props.form}
      disabled={props.disabled}
      className={cx('ja-choice-group', props.direction ?? 'horizontal', props.className)}
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
            <Checkbox
              id={each.data.id}
              name={props.name}
              form={props.form}
              value={each.data.value}
              checked={selected(state.value, each.data.value)}
              disabled={props.disabled || each.data.disabled}
              size={props.size}
              on:change={(checked, event) => toggle(each.data.value, checked, event)}
            >
              {each.data['slot:label'] ?? each.data.label}
            </Checkbox>
          )}
        </For>
      </div>
    </fieldset>
  );
}
