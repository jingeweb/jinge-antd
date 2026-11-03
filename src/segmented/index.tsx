import './style.scss';
import { For, cx, uid, watch } from 'jinge';

import {
  type ChoiceGroupBase,
  type ChoiceOption,
  type ChoiceValue,
  type SelectionProps,
  useChoiceGroup,
} from '../_util/choice-group';
import { Radio } from '../radio';

export type SegmentedOption<T extends ChoiceValue = ChoiceValue> = ChoiceOption<T>;
export type SegmentedProps<T extends ChoiceValue = ChoiceValue> = ChoiceGroupBase<T> &
  SelectionProps<T | undefined> & { block?: boolean; required?: boolean };
export function Segmented<T extends ChoiceValue>(props: SegmentedProps<T>) {
  const controlled = props.value !== undefined;
  const { state, element, change, sync } = useChoiceGroup<T | undefined>(props, (value) => {
    if (
      value !== null &&
      value !== undefined &&
      props.options.some((item) => item.value === value && !item.disabled)
    )
      return value;
    return controlled ? undefined : props.options.find((item) => !item.disabled)?.value;
  });
  const name = `ja-segmented-${uid()}`;
  watch(props, 'options', sync, { deep: true });
  function select(value: T, checked: boolean, event: Event) {
    if (
      !checked ||
      props.disabled ||
      state.value === value ||
      props.options.find((item) => item.value === value)?.disabled
    )
      return;
    change(value, event);
  }
  return (
    <fieldset
      ref={element}
      role="radiogroup"
      id={props.id}
      form={props.form}
      disabled={props.disabled}
      aria-label={props.ariaLabel}
      aria-labelledby={props.ariaLabelledby}
      aria-describedby={props.ariaDescribedby}
      aria-invalid={props.ariaInvalid}
      className={cx(
        'ja-segmented',
        props.direction ?? 'horizontal',
        props.size ?? 'md',
        props.block && 'block',
        props.className,
      )}
      style={props.style}
    >
      {props.legend && <legend>{props.legend}</legend>}
      <div className="ja-segmented-options">
        <For loop={props.options} key="value">
          {(each) => (
            <Radio
              id={each.data.id}
              name={props.name ?? name}
              form={props.form}
              value={each.data.value}
              checked={state.value === each.data.value}
              disabled={props.disabled || each.data.disabled}
              required={props.required}
              size={props.size}
              variant="button"
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
