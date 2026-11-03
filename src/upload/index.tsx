import './style.scss';
import {
  For,
  cx,
  expose,
  onMount,
  onUnmount,
  ref,
  registerEvent,
  uid,
  vm,
  vmIgnore,
  vmRaw,
  watch,
} from 'jinge';

import type { UploadChangeType, UploadFile, UploadProps, UploadRequestOptions } from './common';

import { uploadRequest } from './request';
export type * from './common';

function snapshot(files: UploadFile[] | undefined): UploadFile[] {
  const keys = new Set<string>();
  return (files ?? [])
    .filter((file) => {
      if (keys.has(file.uid)) return false;
      keys.add(file.uid);
      return true;
    })
    .map((file) => ({
      ...file,
      originFile: file.originFile ? vmIgnore(vmRaw(file.originFile)) : undefined,
    }));
}
function accepts(file: File, accept: string | undefined) {
  if (!accept?.trim()) return true;
  return accept.split(',').some((rule) => {
    const value = rule.trim().toLowerCase(),
      type = file.type.toLowerCase();
    if (!value) return false;
    if (value.startsWith('.')) return file.name.toLowerCase().endsWith(value);
    return value.endsWith('/*') ? type.startsWith(value.slice(0, -1)) : type === value;
  });
}
function safeUrl(url: string | undefined) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, document.baseURI);
    return ['https:', 'http:', 'blob:'].includes(parsed.protocol) ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}
function statusText(file: UploadFile) {
  return {
    ready: '待上传',
    uploading: '上传中',
    done: '上传完成',
    error: '上传失败',
    canceled: '已取消',
  }[file.status];
}
function errorText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
function retryable(file: UploadFile) {
  return !!file.originFile && (file.status === 'error' || file.status === 'canceled');
}
function canStart(file: UploadFile) {
  return !!file.originFile && file.status === 'ready';
}

export function Upload(props: UploadProps) {
  const controlled = props.fileList !== undefined,
    initial = snapshot(props.defaultFileList);
  const state = vm({
    files: snapshot(controlled ? props.fileList : initial),
    dragging: false,
    checking: false,
    removing: [] as string[],
  });
  const trigger = ref<HTMLButtonElement>(),
    input = ref<HTMLInputElement>();
  type Task = { controller: AbortController; file: File };
  const tasks = new Map<string, Task>(),
    attempted = new Map<string, File>();
  let disposed = false,
    generation = 0,
    queued = false,
    dragDepth = 0,
    frame = 0;
  let selection = Promise.resolve();
  let ownerForm: HTMLFormElement | null | undefined, stopReset: (() => void) | undefined;
  const pendingRemove = new Map<string, object>();
  function current(id: string) {
    return state.files.find((file) => file.uid === id);
  }
  function halt(id: string) {
    const task = tasks.get(id);
    if (task) {
      tasks.delete(id);
      task.controller.abort();
    }
  }
  function stopAll() {
    for (const id of tasks.keys()) halt(id);
    attempted.clear();
  }
  function schedule() {
    if (queued || disposed) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (!disposed) pump();
    });
  }
  function sync() {
    if (disposed) return;
    if (controlled) state.files = snapshot(props.fileList);
    for (const [id, task] of tasks) if (current(id)?.originFile !== task.file) halt(id);
    for (const [id, file] of attempted) if (current(id)?.originFile !== file) attempted.delete(id);
    schedule();
  }
  function publish(files: UploadFile[], file: UploadFile, type: UploadChangeType) {
    if (disposed) return;
    if (!controlled) state.files = snapshot(files);
    try {
      props['on:change']?.(snapshot(files), { file: snapshot([file])[0], type });
    } finally {
      sync();
    }
  }
  function patch(id: string, changes: Partial<UploadFile>, type: UploadChangeType) {
    const file = current(id);
    if (!file || disposed) return;
    const next = { ...file, ...changes };
    publish(
      state.files.map((item) => (item.uid === id ? next : item)),
      next,
      type,
    );
  }
  function live(id: string, task: Task) {
    return !disposed && tasks.get(id) === task && current(id)?.originFile === task.file;
  }
  function run(file: UploadFile) {
    const raw = file.originFile;
    if (!raw || tasks.has(file.uid) || disposed) return;
    const id = file.uid,
      task = { controller: new AbortController(), file: raw };
    attempted.set(id, raw);
    tasks.set(id, task);
    patch(id, { status: 'uploading', percent: 0, error: undefined, response: undefined }, 'start');
    if (!live(id, task)) {
      halt(id);
      schedule();
      return;
    }
    const options: UploadRequestOptions = {
      file: raw,
      filename: props.name ?? 'file',
      action: props.action,
      signal: task.controller.signal,
      onProgress(percent) {
        if (!live(id, task) || !Number.isFinite(percent)) return;
        patch(id, { percent: Math.min(100, Math.max(0, percent)) }, 'progress');
      },
    };
    let request: Promise<unknown>;
    try {
      request = props.customRequest ? props.customRequest(options) : uploadRequest(options, props);
    } catch (error) {
      request = Promise.reject(error);
    }
    void Promise.resolve(request).then(
      (response) => {
        if (!live(id, task)) return;
        tasks.delete(id);
        patch(id, { status: 'done', percent: 100, response, error: undefined }, 'success');
        schedule();
      },
      (error: unknown) => {
        if (!live(id, task)) return;
        tasks.delete(id);
        patch(id, { status: 'error', error: errorText(error) }, 'error');
        schedule();
      },
    );
  }
  const manual = new Set<string>();
  function pump() {
    const limit =
      Number.isInteger(props.concurrency) && props.concurrency! > 0 ? props.concurrency! : 3;
    if (props.disabled) return;
    for (const file of state.files) {
      if (tasks.size >= limit) break;
      if (!file.originFile || attempted.get(file.uid) === file.originFile || tasks.has(file.uid))
        continue;
      if (file.status !== 'ready' || (props.autoUpload === false && !manual.has(file.uid)))
        continue;
      manual.delete(file.uid);
      run(file);
    }
  }
  function start(id?: string) {
    if (props.disabled || disposed) return;
    for (const file of state.files) {
      if (id !== undefined && file.uid !== id) continue;
      if (!file.originFile || tasks.has(file.uid) || file.status === 'done') continue;
      attempted.delete(file.uid);
      manual.add(file.uid);
      if (file.status !== 'ready')
        patch(file.uid, { status: 'ready', error: undefined, percent: 0 }, 'select');
    }
    schedule();
  }
  function cancel(id?: string) {
    if (props.disabled || disposed) return;
    for (const file of state.files) {
      if (id !== undefined && file.uid !== id) continue;
      if (!file.originFile || !['uploading', 'ready'].includes(file.status)) continue;
      halt(file.uid);
      manual.delete(file.uid);
      attempted.set(file.uid, file.originFile);
      patch(file.uid, { status: 'canceled' }, 'cancel');
    }
    schedule();
  }
  async function remove(id: string) {
    const file = current(id);
    if (!file || props.disabled || disposed || pendingRemove.has(id)) return false;
    const token = {},
      epoch = generation;
    pendingRemove.set(id, token);
    state.removing = [...pendingRemove.keys()];
    try {
      if ((await props.beforeRemove?.(snapshot([file])[0])) === false) return false;
      if (
        disposed ||
        props.disabled ||
        epoch !== generation ||
        current(id)?.originFile !== file.originFile ||
        current(id)?.name !== file.name
      )
        return false;
      const latest = current(id);
      if (!latest) return false;
      // The controlled owner can veto by retaining the row; abort only after acceptance.
      publish(
        state.files.filter((item) => item.uid !== id),
        latest,
        'remove',
      );
      if (!current(id)) {
        halt(id);
        attempted.delete(id);
        manual.delete(id);
        schedule();
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      if (pendingRemove.get(id) === token) pendingRemove.delete(id);
      if (!disposed) state.removing = [...pendingRemove.keys()];
    }
  }
  function enqueue(files: File[]) {
    if (props.disabled || disposed) return;
    const epoch = generation,
      batch = files.map((file) => vmIgnore(vmRaw(file)));
    selection = selection.then(async () => {
      if (disposed || epoch !== generation) return;
      state.checking = true;
      try {
        for (let index = 0; index < batch.length; index++) {
          if (disposed || props.disabled || epoch !== generation) return;
          const file = batch[index];
          let reason: 'accept' | 'size' | 'count' | 'beforeUpload' | undefined;
          if (!accepts(file, props.accept)) reason = 'accept';
          else if (props.maxSize !== undefined && file.size > Math.max(0, props.maxSize))
            reason = 'size';
          else if (
            (!props.multiple && index > 0) ||
            (props.maxCount !== undefined && state.files.length >= Math.max(0, props.maxCount))
          )
            reason = 'count';
          if (reason) {
            props['on:reject']?.(file, reason);
            continue;
          }
          let valid: boolean | undefined, error: unknown;
          try {
            valid = await props.beforeUpload?.(file, [...batch]);
          } catch (caught) {
            valid = false;
            error = caught;
          }
          if (disposed || props.disabled || epoch !== generation) return;
          if (valid === false) {
            props['on:reject']?.(file, 'beforeUpload', error);
            continue;
          }
          // Check count again after the asynchronous validator; an external list may have changed.
          if (props.maxCount !== undefined && state.files.length >= Math.max(0, props.maxCount)) {
            props['on:reject']?.(file, 'count');
            continue;
          }
          const item: UploadFile = {
            uid: `ja-upload-${uid()}`,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'ready',
            originFile: file,
            percent: 0,
          };
          publish([...state.files, item], item, 'select');
        }
      } finally {
        if (!disposed && epoch === generation) state.checking = false;
      }
    });
  }
  function choose(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const files = Array.from(element.files ?? []);
    element.value = '';
    enqueue(files);
  }
  function open() {
    if (!props.disabled && !disposed) input.value?.click();
  }
  function drag(event: DragEvent, entering: boolean) {
    if (!props.drag || props.disabled) return;
    if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth + (entering ? 1 : -1));
    state.dragging = dragDepth > 0;
  }
  function drop(event: DragEvent) {
    if (!props.drag) return;
    event.preventDefault();
    dragDepth = 0;
    state.dragging = false;
    if (!props.disabled) enqueue(Array.from(event.dataTransfer?.files ?? []));
  }
  function reset() {
    generation++;
    stopAll();
    manual.clear();
    pendingRemove.clear();
    state.removing = [];
    state.checking = false;
    selection = Promise.resolve();
    if (input.value) input.value.value = '';
    state.files = snapshot(controlled ? props.fileList : initial);
  }
  function bindForm() {
    const form = input.value?.form;
    if (ownerForm === form) return;
    stopReset?.();
    ownerForm = form;
    stopReset = form
      ? registerEvent(form, 'reset', (event) => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => {
            frame = 0;
            if (!disposed && !event.defaultPrevented) reset();
          });
        })
      : undefined;
  }
  watch(props, 'fileList', sync, { deep: true });
  watch(props, 'autoUpload', schedule);
  watch(props, 'concurrency', schedule);
  watch(props, 'disabled', () => {
    generation++;
    selection = Promise.resolve();
    pendingRemove.clear();
    state.removing = [];
    state.checking = false;
    state.dragging = false;
    dragDepth = 0;
    schedule();
  });
  watch(props, 'form', bindForm);
  let stopFocus: (() => void) | undefined, stopBlur: (() => void) | undefined;
  onMount(() => {
    if (trigger.value) {
      stopFocus = registerEvent(trigger.value, 'focus', (event) => props['on:focus']?.(event));
      stopBlur = registerEvent(trigger.value, 'blur', (event) => props['on:blur']?.(event));
    }
    bindForm();
    schedule();
  });
  onUnmount(() => {
    disposed = true;
    generation++;
    stopAll();
    pendingRemove.clear();
    stopReset?.();
    stopFocus?.();
    stopBlur?.();
    cancelAnimationFrame(frame);
  });
  expose({
    focus: (options?: FocusOptions) => trigger.value?.focus(options),
    blur: () => trigger.value?.blur(),
    open,
    start,
    cancel,
    remove,
  });
  return (
    <div
      className={cx('ja-upload', props.size ?? 'md', props.disabled && 'disabled', props.className)}
      style={props.style}
    >
      <input
        ref={input}
        type="file"
        className="ja-upload-input"
        tabIndex={-1}
        aria-hidden="true"
        disabled={props.disabled}
        multiple={props.multiple}
        accept={props.accept}
        form={props.form}
        on:change={choose}
      />
      <button
        ref={trigger}
        type="button"
        id={props.id}
        className={cx('ja-upload-trigger', props.drag && 'drag', state.dragging && 'dragging')}
        disabled={props.disabled}
        aria-label={props.ariaLabel ?? '选择文件'}
        aria-labelledby={props.ariaLabelledby}
        aria-describedby={props.ariaDescribedby}
        aria-busy={state.checking || undefined}
        on:click={open}
        on:dragEnter={(event) => drag(event, true)}
        on:dragLeave={(event) => drag(event, false)}
        on:dragOver={(event) => {
          if (props.drag) {
            event.preventDefault();
            if (event.dataTransfer)
              event.dataTransfer.dropEffect = props.disabled ? 'none' : 'copy';
          }
        }}
        on:drop={drop}
      >
        {props.children ?? '选择文件'}
      </button>
      {state.checking && (
        <span role="status" className="ja-upload-checking">
          正在校验文件…
        </span>
      )}
      {props.showUploadList !== false && (
        <ul className="ja-upload-list" aria-label="文件列表">
          <For loop={state.files} key="uid">
            {(each) => (
              <li className={cx('ja-upload-item', each.data.status)}>
                <div className="ja-upload-details">
                  {safeUrl(each.data.url) ? (
                    <a
                      className="ja-upload-name"
                      href={safeUrl(each.data.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {each.data.name}
                    </a>
                  ) : (
                    <span className="ja-upload-name">{each.data.name}</span>
                  )}
                  <span className="ja-upload-status">{statusText(each.data)}</span>
                  {each.data.status === 'uploading' && (
                    <progress
                      aria-label={`上传进度 ${each.data.name}`}
                      max={100}
                      value={each.data.percent ?? 0}
                    />
                  )}
                  {each.data.status === 'error' && (
                    <span className="ja-upload-error" role="alert">
                      {each.data.error ?? '上传失败'}
                    </span>
                  )}
                </div>
                <div className="ja-upload-actions">
                  {props['on:preview'] && (
                    <button
                      type="button"
                      disabled={props.disabled}
                      aria-label={`预览 ${each.data.name}`}
                      on:click={(event) => props['on:preview']?.(snapshot([each.data])[0], event)}
                    >
                      预览
                    </button>
                  )}
                  {canStart(each.data) && (
                    <button
                      type="button"
                      disabled={props.disabled}
                      aria-label={`上传 ${each.data.name}`}
                      on:click={() => start(each.data.uid)}
                    >
                      上传
                    </button>
                  )}
                  {each.data.status === 'uploading' && (
                    <button
                      type="button"
                      disabled={props.disabled}
                      aria-label={`取消 ${each.data.name}`}
                      on:click={() => cancel(each.data.uid)}
                    >
                      取消
                    </button>
                  )}
                  {retryable(each.data) && (
                    <button
                      type="button"
                      disabled={props.disabled}
                      aria-label={`重试 ${each.data.name}`}
                      on:click={() => start(each.data.uid)}
                    >
                      重试
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={props.disabled || removing(state.removing, each.data.uid)}
                    aria-label={`移除 ${each.data.name}`}
                    on:click={() => {
                      void remove(each.data.uid);
                    }}
                  >
                    移除
                  </button>
                </div>
              </li>
            )}
          </For>
        </ul>
      )}
    </div>
  );
}
function removing(ids: string[], id: string) {
  return ids.includes(id);
}
