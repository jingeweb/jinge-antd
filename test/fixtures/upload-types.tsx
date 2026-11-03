import { ref } from 'jinge';

import { Upload, type UploadFile, type UploadProps } from '../../src';
export function UploadTypes() {
  const handle = ref<typeof Upload>();
  // @ts-expect-error transport must return a promise so completion and errors are observable.
  const invalidRequest: UploadProps = { customRequest: () => undefined };
  // @ts-expect-error raw files are not upload records with stable uid and status.
  const invalidFiles: UploadProps = { fileList: [new File([], 'a.txt')] };
  // @ts-expect-error statuses form a closed set.
  const invalidStatus: UploadFile = { uid: 'x', name: 'x', status: 'finished' };
  void invalidRequest;
  void invalidFiles;
  void invalidStatus;
  return (
    <Upload
      ref={handle}
      customRequest={async (options) => {
        const file: File = options.file,
          signal: AbortSignal = options.signal;
        options.onProgress(50);
        void file;
        void signal;
        return { id: 1 };
      }}
      on:change={(files, info) => {
        const expected: UploadFile[] = files;
        void expected;
        void info.type;
      }}
    />
  );
}
