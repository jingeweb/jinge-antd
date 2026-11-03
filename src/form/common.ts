export type FormName<T extends object> = Extract<keyof T, string>;
export type FormErrors<T extends object> = Partial<Record<FormName<T>, string>>;
export type FieldState = { touched: boolean; dirty: boolean; validating: boolean; error?: string };
export type FormStatus = {
  validated: boolean;
  validating: boolean;
  submitting: boolean;
  dirty: boolean;
  touched: boolean;
  submitCount: number;
  formError?: string;
  submitError?: string;
};
export type FormValidateResult<T extends object, Output = T> =
  | [FormErrors<T>, undefined?, { outOfDate: true }?]
  | [undefined, Output];
export type FormFieldRegisterOptions<T extends object = object> = {
  preserve?: boolean;
  dependencies?: FormName<T>[];
  focus?: () => void;
};
export type FormOptions<T extends object> = { defaultValues?: Partial<T> };
export interface FormControl<T extends object> {
  readonly validated: boolean;
  readonly status: FormStatus;
  getField<P extends FormName<T>>(name: P): T[P] | undefined;
  getFieldState(name: FormName<T>): FieldState;
  validateField(name: FormName<T>): Promise<string | undefined>;
  setField<P extends FormName<T>>(
    name: P,
    value: T[P] | undefined,
    validate?: boolean,
  ): Promise<void>;
  touch(name: FormName<T>): void;
  registerField(name: FormName<T>, options?: FormFieldRegisterOptions<T>): () => void;
  watchField<P extends FormName<T>>(
    name: P,
    callback: (value: T[P] | undefined) => void,
  ): () => void;
  watchFieldState(name: FormName<T>, callback: (state: FieldState) => void): () => void;
  reportError(error: unknown): void;
}
export interface FormInstance<T extends object, Output = T> {
  formState: Partial<T>;
  formErrors: FormErrors<T>;
  status: FormStatus;
  control: FormControl<T>;
  validate(): Promise<FormValidateResult<T, Output>>;
  validateField(name: FormName<T>): Promise<string | undefined>;
  setField<P extends FormName<T>>(
    name: P,
    value: T[P] | undefined,
    validate?: boolean,
  ): Promise<void>;
  setFields(values: Partial<T>, validate?: boolean): Promise<void>;
  setError(name: FormName<T>, error?: string): void;
  clearErrors(names?: FormName<T>[]): void;
  reset(values?: Partial<T>): void;
  focusField(name: FormName<T>): boolean;
  submit(
    finish: (data: Output) => unknown,
    invalid?: (errors: FormErrors<T>) => void,
    error?: (error: unknown) => void,
  ): Promise<boolean>;
  cancelPending(): void;
  dispose(): void;
}
export type FormPresentation = {
  layout?: 'horizontal' | 'vertical' | 'inline';
  disabled?: boolean;
  disabledWhileSubmitting?: boolean;
  size?: 'sm' | 'md' | 'lg';
  labelWidth?: string | number;
  requiredMark?: boolean;
};
export const FORM_PRESENTATION = Symbol('ja-form-presentation');
