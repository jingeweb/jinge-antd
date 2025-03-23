import {
  type JClipboardEvent,
  type JFormEvent,
  type JNode,
  type WithChildren,
  type WithEvents,
  vm,
} from 'jinge';
import type { ZodObject, ZodRawShape, z } from 'zod';

export interface FormOptions<T extends object> {
  defaultValues?: T;
}

export interface FormFieldRegisterOptions {}
export type FormValidateResult<T extends object> =
  | [Record<keyof T, string | undefined>]
  | [undefined, T];
export interface FormControl<T extends object> {
  validated: boolean;
  validateField: (prop: keyof T) => Promise<string | undefined>;
  setField: <P extends keyof T>(props: P, value: T[P], validate?: boolean) => void;
}
export interface FormInstance<T extends object> {
  validate: () => Promise<FormValidateResult<T>>;
  validateField: (prop: keyof T) => Promise<string | undefined>;
  setField: <P extends keyof T>(props: P, value: T[P], validate?: boolean) => void;
  formErrors: Record<keyof T, string | undefined>;
  formState: Partial<T>;
  control: FormControl<T>;
}

export function useForm<S extends ZodObject<ZodRawShape>>(schema: S, options?: z.infer<S>) {
  type T = z.infer<S>;
  const formState = vm(options?.defaultValues ?? {});
  const formErrors = vm({}) as Record<keyof T, string | undefined>;
  const propSchemas = new Map<keyof T, ZodObject<ZodRawShape>>();
  const control = {
    validated: false,
    validateField,
    setField,
  };
  async function validate() {
    control.validated = true;
    const res = await schema.safeParseAsync(formState);
    Object.keys(formErrors).forEach((k: keyof T) => {
      formErrors[k] = undefined;
    });
    if (res.error?.errors.length) {
      const errors: Record<string, unknown> = {};
      res.error!.errors.forEach((err) => {
        const prop = err.path[0];
        errors[prop] = err.message;
        formErrors[prop as keyof T] = err.message;
      });
      return [errors] as FormValidateResult<T>;
    } else {
      return [undefined, res.data] as FormValidateResult<T>;
    }
  }

  async function validateField(prop: keyof T) {
    let s = propSchemas.get(prop);
    if (!s) {
      s = schema.pick({ [prop as string]: true });
      propSchemas.set(prop, s);
    }
    const res = await s.safeParseAsync(formState);
    if (res.error?.errors?.length) {
      formErrors[prop] = res.error?.errors[0].message;
    } else {
      formErrors[prop] = undefined;
    }
    return formErrors[prop];
  }

  async function setField<P extends keyof T>(prop: P, value: T[P], validate = false) {
    formState[prop] = value;
    if (validate) {
      await validateField(prop);
    }
  }

  return {
    validateField,
    setField,
    validate,
    formErrors,
    formState,
    control,
  } as FormInstance<T>;
}

export function Controller<T extends object, P extends keyof T>(
  props: {
    name: P;
    control: FormControl<T>;
  } & WithChildren<
    (
      fieldProps: WithEvents<{
        change: (evt: JFormEvent<HTMLInputElement>) => void;
        blur: (evt: JClipboardEvent<HTMLInputElement>) => void;
      }>,
    ) => JNode
  >,
) {
  let touched = false;
  const { control, name } = props;

  return (
    <>
      {props.children({
        'on:change': (evt) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control.setField(name, (evt.target.value ?? '') as any, control.validated || touched);
        },
        'on:blur': () => {
          touched = true;
          void control.validateField(props.name);
        },
      })}
    </>
  );
}
