import type { z } from 'zod';

import { vm, vmWatch } from 'jinge';

import type {
  FieldState,
  FormControl,
  FormErrors,
  FormFieldRegisterOptions,
  FormInstance,
  FormName,
  FormOptions,
  FormStatus,
  FormValidateResult,
} from './common';

import { cloneValue, equalValue, errorMessage, formKeys } from './value';
export type {
  FieldState,
  FormControl,
  FormErrors,
  FormFieldRegisterOptions,
  FormInstance,
  FormName,
  FormOptions,
  FormStatus,
  FormValidateResult,
} from './common';

export function useForm<S extends z.ZodType<object, object>>(
  schema: S,
  options?: FormOptions<z.input<S>>,
): FormInstance<z.input<S>, z.output<S>> {
  type T = z.input<S>;
  type Output = z.output<S>;
  type Name = FormName<T>;
  let baseline = cloneValue<Partial<T>>(options?.defaultValues ?? {});
  const formState = vm<Partial<T>>(cloneValue(baseline));
  const formErrors = vm<FormErrors<T>>({});
  const status = vm<FormStatus>({
    validated: false,
    validating: false,
    submitting: false,
    dirty: false,
    touched: false,
    submitCount: 0,
  });
  const metadata = new Map<Name, FieldState>();
  const registrations = new Map<Name, Set<FormFieldRegisterOptions<T>>>();
  const subscriptions = new Set<() => void>();
  const latest = new Map<Name, number>(),
    running = new Map<Name, number>();
  let revision = 0,
    sequence = 0,
    latestFull = 0,
    runningFull = 0,
    submitVersion = 0,
    disposed = false;
  let observed = cloneValue(formState),
    activeSubmit: Promise<boolean> | undefined;
  function getFieldState(name: Name) {
    let state = metadata.get(name);
    if (!state) {
      state = vm<FieldState>({
        touched: false,
        dirty: !equalValue(formState[name], baseline[name]),
        validating: false,
      });
      metadata.set(name, state);
    }
    return state;
  }
  function busy() {
    status.validating = !!runningFull || running.size > 0;
  }
  function invalidate() {
    revision++;
    latestFull = ++sequence;
    runningFull = 0;
    running.clear();
    for (const state of metadata.values()) state.validating = false;
    busy();
  }
  function updateDirty() {
    status.dirty = !equalValue(formState, baseline);
    for (const [name, state] of metadata)
      state.dirty = !equalValue(formState[name], baseline[name]);
  }
  function refresh() {
    const next = cloneValue(formState);
    if (!equalValue(observed, next)) {
      observed = next;
      invalidate();
      updateDirty();
    }
  }
  function writeError(name: Name, error?: string) {
    formErrors[name] = error;
    getFieldState(name).error = error;
  }
  function current(snapshot: Partial<T>, version: number) {
    refresh();
    return !disposed && revision === version && equalValue(snapshot, formState);
  }
  async function parse(
    snapshot: Partial<T>,
  ): Promise<{ errors: FormErrors<T>; formError?: string; data?: Output }> {
    try {
      const result = await schema.safeParseAsync(snapshot);
      if (result.success) return { errors: {}, data: result.data };
      const errors: FormErrors<T> = {};
      let formError: string | undefined;
      for (const issue of result.error.issues) {
        const name = issue.path[0];
        if (typeof name === 'string') {
          const key = name as Name;
          errors[key] ??= issue.message;
        } else formError ??= issue.message;
      }
      return { errors, formError };
    } catch (error) {
      return { errors: {}, formError: errorMessage(error) };
    }
  }
  async function validate(): Promise<FormValidateResult<T, Output>> {
    refresh();
    if (disposed) return [{}, undefined, { outOfDate: true }];
    status.validated = true;
    const snapshot = cloneValue(formState),
      version = revision,
      token = ++sequence;
    latestFull = token;
    runningFull = token;
    // Whole-form validation supersedes older field runs without waiting for them.
    running.clear();
    for (const state of metadata.values()) state.validating = false;
    busy();
    const result = await parse(snapshot);
    if (
      !current(snapshot, version) ||
      latestFull !== token ||
      [...latest.values()].some((value) => value > token)
    ) {
      if (runningFull === token) {
        runningFull = 0;
        busy();
      }
      return [{}, undefined, { outOfDate: true }];
    }
    runningFull = 0;
    busy();
    status.formError = result.formError;
    const names = new Set([
      ...formKeys(formErrors),
      ...formKeys(result.errors),
      ...metadata.keys(),
    ]);
    for (const name of names) writeError(name, result.errors[name]);
    return result.data !== undefined ? [undefined, result.data] : [result.errors];
  }
  async function validateField(name: Name) {
    refresh();
    if (disposed) return formErrors[name];
    const snapshot = cloneValue(formState),
      version = revision,
      token = ++sequence;
    latest.set(name, token);
    running.set(name, token);
    getFieldState(name).validating = true;
    busy();
    const result = await parse(snapshot);
    if (current(snapshot, version) && latest.get(name) === token && token > latestFull) {
      writeError(name, result.errors[name]);
      status.formError = result.formError;
    }
    if (running.get(name) === token) {
      running.delete(name);
      getFieldState(name).validating = false;
      busy();
    }
    return formErrors[name];
  }
  function dependentFields(changed: Name[]) {
    for (const [name, entries] of registrations) {
      if (changed.includes(name) || !(status.validated || getFieldState(name).touched)) continue;
      if (
        [...entries].some((entry) =>
          entry.dependencies?.some((dependency) => changed.includes(dependency)),
        )
      )
        void validateField(name);
    }
  }
  async function setField<P extends Name>(name: P, value: T[P] | undefined, validate = false) {
    if (disposed) return;
    formState[name] = cloneValue(value);
    refresh();
    dependentFields([name]);
    if (validate) await validateField(name);
  }
  async function setFields(values: Partial<T>, validateAll = false) {
    if (disposed) return;
    const changed = formKeys(values);
    for (const name of changed) formState[name] = cloneValue(values[name]);
    refresh();
    dependentFields(changed);
    if (validateAll) await validate();
  }
  function touch(name: Name) {
    getFieldState(name).touched = true;
    status.touched = true;
  }
  function registerField(name: Name, entry: FormFieldRegisterOptions<T> = {}) {
    let entries = registrations.get(name);
    if (!entries) {
      entries = new Set();
      registrations.set(name, entries);
    }
    entries.add(entry);
    getFieldState(name);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      entries.delete(entry);
      if (entries.size) return;
      registrations.delete(name);
      latest.set(name, ++sequence);
      running.delete(name);
      getFieldState(name).validating = false;
      busy();
      if (entry.preserve === false) {
        delete formState[name];
        refresh();
        writeError(name, undefined);
        getFieldState(name).touched = false;
        status.touched = [...metadata.values()].some((state) => state.touched);
      }
    };
  }
  function focusField(name: Name) {
    for (const entry of registrations.get(name) ?? [])
      if (entry.focus) {
        entry.focus();
        return true;
      }
    return false;
  }
  function cancelPending() {
    submitVersion++;
    activeSubmit = undefined;
    status.submitting = false;
    invalidate();
  }
  function reset(values?: Partial<T>) {
    if (disposed) return;
    cancelPending();
    if (values !== undefined) baseline = cloneValue(values);
    for (const name of formKeys(formState)) delete formState[name];
    for (const name of formKeys(baseline)) formState[name] = cloneValue(baseline[name]);
    observed = cloneValue(formState);
    for (const name of formKeys(formErrors)) writeError(name, undefined);
    for (const state of metadata.values()) {
      state.touched = false;
      state.dirty = false;
      state.validating = false;
      state.error = undefined;
    }
    status.validated = false;
    status.dirty = false;
    status.touched = false;
    status.submitCount = 0;
    status.formError = undefined;
    status.submitError = undefined;
  }
  function clearErrors(names?: Name[]) {
    invalidate();
    for (const name of names ?? formKeys(formErrors)) writeError(name, undefined);
    if (!names) {
      status.formError = undefined;
      status.submitError = undefined;
    }
  }
  function setError(name: Name, error?: string) {
    latest.set(name, ++sequence);
    running.delete(name);
    getFieldState(name).validating = false;
    writeError(name, error);
    busy();
  }
  function submit(
    finish: (data: Output) => unknown,
    invalid?: (errors: FormErrors<T>) => void,
    onError?: (error: unknown) => void,
  ) {
    if (disposed) return Promise.resolve(false);
    if (activeSubmit) return activeSubmit;
    const token = ++submitVersion;
    status.submitting = true;
    status.submitError = undefined;
    status.submitCount++;
    activeSubmit = (async () => {
      try {
        const result = await validate();
        if (disposed || token !== submitVersion || result[2]?.outOfDate) return false;
        if (result[0] !== undefined) {
          for (const name of registrations.keys()) if (result[0][name] && focusField(name)) break;
          invalid?.(result[0]);
          return false;
        }
        const data = result[1];
        if (data === undefined) return false;
        await finish(data);
        return !disposed && token === submitVersion;
      } catch (error) {
        if (!disposed && token === submitVersion) {
          status.submitError = errorMessage(error);
          try {
            onError?.(error);
          } catch (listenerError) {
            status.submitError = errorMessage(listenerError);
          }
        }
        return false;
      } finally {
        if (token === submitVersion) {
          status.submitting = false;
          activeSubmit = undefined;
        }
      }
    })();
    return activeSubmit;
  }
  function subscribe(create: () => () => void) {
    if (disposed) return () => {};
    const stop = create();
    let active = true;
    const unsubscribe = () => {
      if (!active) return;
      active = false;
      subscriptions.delete(unsubscribe);
      stop();
    };
    subscriptions.add(unsubscribe);
    return unsubscribe;
  }
  const stop = vmWatch(formState, refresh);
  const control: FormControl<T> = {
    get validated() {
      return status.validated;
    },
    status,
    getField: (name) => formState[name],
    getFieldState,
    validateField,
    setField,
    touch,
    registerField,
    watchField: (name, callback) =>
      subscribe(() =>
        vmWatch(formState, [name], () => callback(formState[name]), { immediate: true }),
      ),
    watchFieldState: (name, callback) =>
      subscribe(() => vmWatch(getFieldState(name), callback, { immediate: true })),
    reportError: (error) => {
      if (!disposed) status.formError = errorMessage(error);
    },
  };
  return {
    formState,
    formErrors,
    status,
    control,
    validate,
    validateField,
    setField,
    setFields,
    setError,
    clearErrors,
    reset,
    focusField,
    submit,
    cancelPending,
    dispose() {
      if (disposed) return;
      cancelPending();
      disposed = true;
      stop();
      for (const unsubscribe of subscriptions) unsubscribe();
      registrations.clear();
    },
  };
}
