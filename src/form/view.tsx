import './style.scss';
import {
  type JNode,
  type WithEvents,
  type WithExpose,
  type WithOptChildren,
  context,
  cx,
  expose,
  onMount,
  onUnmount,
  ref,
  registerEvent,
  uid,
} from 'jinge';

import {
  type FormErrors,
  type FormInstance,
  type FormName,
  type FormPresentation,
  FORM_PRESENTATION,
} from './common';
import { Controller, type ControllerProps } from './controller';
export type FormHandle = { submit(): void; reset(): void };
export type FormProps<T extends object, Output = T> = FormPresentation & {
  form: FormInstance<T, Output>;
  id?: string;
  name?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  className?: string;
  style?: string;
} & WithOptChildren<JNode> &
  WithExpose<FormHandle> &
  WithEvents<{
    finish?(data: Output): unknown;
    finishFailed?(errors: FormErrors<T>): void;
    error?(error: unknown): void;
    reset?(event: Event): void;
  }>;
function width(value: string | number | undefined) {
  return typeof value === 'number' ? `${value}px` : (value ?? '140px');
}
function message(formError?: string, submitError?: string) {
  return formError ?? submitError ?? '';
}
export function Form<T extends object, Output = T>(props: FormProps<T, Output>) {
  context<FormPresentation>(FORM_PRESENTATION, props);
  const element = ref<HTMLFormElement>();
  // A form instance is stable for the lifetime of this Form, while its status is a VM.
  const form = props.form,
    status = form.status;
  let disposed = false;
  onMount(() => {
    const stops = [
      registerEvent(element.value!, 'submit', (event) => {
        event.preventDefault();
        if (props.disabled) return;
        void form.submit(
          (data) => props['on:finish']?.(data),
          (errors) => {
            if (!disposed) props['on:finishFailed']?.(errors);
          },
          (error) => {
            if (!disposed) props['on:error']?.(error);
          },
        );
      }),
      registerEvent(element.value!, 'reset', (event) => {
        props['on:reset']?.(event);
        queueMicrotask(() => {
          if (!disposed && !event.defaultPrevented) form.reset();
        });
      }),
    ];
    return () => {
      for (const stop of stops) stop();
    };
  });
  onUnmount(() => {
    disposed = true;
    form.cancelPending();
  });
  expose({ submit: () => element.value?.requestSubmit(), reset: () => element.value?.reset() });
  return (
    <form
      ref={element}
      noValidate
      id={props.id}
      name={props.name}
      aria-label={props.ariaLabel}
      aria-labelledby={props.ariaLabelledby}
      aria-busy={status.submitting || status.validating}
      className={cx('ja-form', props.layout ?? 'vertical', props.size ?? 'md', props.className)}
      style={`${props.style ?? ''};--ja-form-label-width:${width(props.labelWidth)}`}
    >
      <fieldset
        className="ja-form-content"
        disabled={props.disabled || (props.disabledWhileSubmitting !== false && status.submitting)}
      >
        {props.children}
      </fieldset>
      {(status.formError || status.submitError) && (
        <div className="ja-form-summary" role="alert">
          {message(status.formError, status.submitError)}
        </div>
      )}
    </form>
  );
}
export type FormFieldProps<T extends object, P extends FormName<T>> = ControllerProps<T, P> & {
  label?: string;
  help?: string;
  layout?: FormPresentation['layout'];
  className?: string;
  style?: string;
};
function descriptions(first?: string, second?: string) {
  return [first, second].filter(Boolean).join(' ') || undefined;
}
export function FormField<T extends object, P extends FormName<T>>(props: FormFieldProps<T, P>) {
  const presentation = context<FormPresentation | undefined>(FORM_PRESENTATION);
  const id = props.id ?? `ja-field-${uid()}`,
    errorId = `${id}-error`,
    helpId = `${id}-help`;
  return (
    <Controller
      name={props.name}
      control={props.control}
      id={id}
      disabled={props.disabled}
      required={props.required}
      size={props.size}
      preserve={props.preserve}
      dependencies={props.dependencies}
      validateTrigger={props.validateTrigger}
      descriptionId={descriptions(props.descriptionId, props.help ? helpId : undefined)}
      errorId={errorId}
      focus={props.focus}
    >
      {(field) => (
        <div
          className={cx(
            'ja-form-field',
            props.layout ?? presentation?.layout ?? 'vertical',
            field.invalid && 'invalid',
            field.disabled && 'disabled',
            props.className,
          )}
          style={props.style}
        >
          {props.label && (
            <div className="ja-form-label">
              {field.required && presentation?.requiredMark !== false && (
                <span aria-hidden="true" className="ja-form-required">
                  *{' '}
                </span>
              )}
              <label htmlFor={field.id}>{props.label}</label>
            </div>
          )}
          <div className="ja-form-field-body">
            <div className="ja-form-control">{props.children({ ...field })}</div>
            {props.help && (
              <div id={helpId} className="ja-form-help">
                {props.help}
              </div>
            )}
            {field.error && (
              <div id={errorId} className="ja-form-error" role="alert">
                {field.error}
              </div>
            )}
            {field.validating && (
              <span className="ja-form-validating" role="status">
                校验中…
              </span>
            )}
          </div>
        </div>
      )}
    </Controller>
  );
}
