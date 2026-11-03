import { vmRaw } from 'jinge';

import type { UploadProps, UploadRequestOptions } from './common';

/** Multipart transport; callers can replace it with an AbortSignal-aware custom request. */
export function uploadRequest(
  options: UploadRequestOptions,
  config: UploadProps,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!options.action) {
      reject(new Error('请配置 action 或 customRequest'));
      return;
    }
    const xhr = new XMLHttpRequest();
    const cleanup = () => {
      options.signal.removeEventListener('abort', abort);
      xhr.onload = xhr.onerror = xhr.ontimeout = xhr.onabort = null;
      xhr.upload.onprogress = null;
    };
    const fail = (error: Error) => {
      cleanup();
      reject(error);
    };
    const abort = () => {
      xhr.abort();
      fail(new Error('上传已取消'));
    };
    if (options.signal.aborted) {
      reject(new Error('上传已取消'));
      return;
    }
    try {
      xhr.open(config.method ?? 'POST', options.action);
      xhr.withCredentials = !!config.withCredentials;
      xhr.timeout = config.timeout ?? 0;
      for (const [name, value] of Object.entries(config.headers ?? {}))
        xhr.setRequestHeader(name, value);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0)
          options.onProgress((event.loaded / event.total) * 100);
      };
      xhr.onerror = () => fail(new Error('网络错误'));
      xhr.ontimeout = () => fail(new Error('上传超时'));
      xhr.onabort = () => fail(new Error('上传已取消'));
      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          fail(new Error(`上传失败 (${xhr.status})`));
          return;
        }
        const text = xhr.responseText;
        let result: unknown = text;
        try {
          result = JSON.parse(text);
        } catch {
          /* Non-JSON responses remain text. */
        }
        cleanup();
        resolve(result);
      };
      const body = new FormData();
      for (const [name, value] of Object.entries(config.data ?? {}))
        body.append(name, typeof value === 'string' ? value : vmRaw(value));
      body.append(options.filename, options.file, options.file.name);
      options.signal.addEventListener('abort', abort, { once: true });
      xhr.send(body);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}
