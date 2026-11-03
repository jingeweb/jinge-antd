import type { JNode, WithEvents, WithExpose, WithOptChildren } from 'jinge';
export type UploadStatus = 'ready' | 'uploading' | 'done' | 'error' | 'canceled';
export interface UploadFile {
  uid: string;
  name: string;
  status: UploadStatus;
  size?: number;
  type?: string;
  percent?: number;
  originFile?: File;
  response?: unknown;
  error?: string;
  url?: string;
}
export type UploadChangeType =
  | 'select'
  | 'start'
  | 'progress'
  | 'success'
  | 'error'
  | 'cancel'
  | 'remove';
export type UploadRejectReason = 'accept' | 'size' | 'count' | 'beforeUpload';
export interface UploadRequestOptions {
  file: File;
  filename: string;
  action?: string;
  signal: AbortSignal;
  onProgress(this: void, percent: number): void;
}
export type UploadHandle = {
  focus(options?: FocusOptions): void;
  blur(): void;
  open(): void;
  start(uid?: string): void;
  cancel(uid?: string): void;
  remove(uid: string): Promise<boolean>;
};
export type UploadProps = {
  fileList?: UploadFile[];
  defaultFileList?: UploadFile[];
  autoUpload?: boolean;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
  maxCount?: number;
  concurrency?: number;
  disabled?: boolean;
  drag?: boolean;
  showUploadList?: boolean;
  action?: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  name?: string;
  headers?: Record<string, string>;
  data?: Record<string, string | Blob>;
  withCredentials?: boolean;
  timeout?: number;
  customRequest?(this: void, options: UploadRequestOptions): Promise<unknown>;
  beforeUpload?(this: void, file: File, batch: File[]): boolean | Promise<boolean>;
  beforeRemove?(this: void, file: UploadFile): boolean | Promise<boolean>;
  id?: string;
  form?: string;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: string;
} & WithOptChildren<JNode> &
  WithExpose<UploadHandle> &
  WithEvents<{
    change?(files: UploadFile[], info: { file: UploadFile; type: UploadChangeType }): void;
    reject?(file: File, reason: UploadRejectReason, error?: unknown): void;
    preview?(file: UploadFile, event: MouseEvent): void;
    focus?(event: FocusEvent): void;
    blur?(event: FocusEvent): void;
  }>;
