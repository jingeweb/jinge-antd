import { ref, vm } from 'jinge';
import {
  Button,
  Form,
  FormField,
  Space,
  Upload,
  useForm,
  type UploadFile,
  type UploadRequestOptions,
  type UploadRejectReason,
} from 'jinge-antd';
import { z } from 'zod';

// Local simulation only: replace with action or your own request in an application.
function createRequest() {
  const attempts = new Map<string, number>();
  return (options: UploadRequestOptions): Promise<unknown> => {
    const attempt = (attempts.get(options.file.name) ?? 0) + 1;
    attempts.set(options.file.name, attempt);
    return new Promise((resolve, reject) => {
      let percent = 0;
      const abort = () => {
        window.clearInterval(timer);
        reject(new Error('已取消'));
      };
      const timer = window.setInterval(() => {
        percent += 20;
        options.onProgress(percent);
        if (percent < 100) return;
        window.clearInterval(timer);
        options.signal.removeEventListener('abort', abort);
        if (options.file.name.startsWith('fail') && attempt === 1)
          reject(new Error('模拟失败，请重试'));
        else resolve({ id: options.file.name });
      }, 120);
      options.signal.addEventListener('abort', abort, { once: true });
      if (options.signal.aborted) abort();
    });
  };
}
function rejectionText(reason: UploadRejectReason) {
  return {
    accept: '不支持的文件类型',
    size: '文件超过 1 MiB',
    count: '最多添加三个附件',
    beforeUpload: '文件校验未通过',
  }[reason];
}
export function UploadExample() {
  const state = vm({ files: [] as UploadFile[], message: '尚未选择文件', disabled: false });
  const request = createRequest();
  return (
    <Space direction="vertical" align="stretch" style="width:100%">
      <Upload
        fileList={state.files}
        multiple
        drag
        accept=".txt,.csv"
        maxSize={1048576}
        maxCount={3}
        concurrency={2}
        ariaLabel="报表附件"
        disabled={state.disabled}
        customRequest={request}
        on:change={(files) => {
          state.files = files;
        }}
        on:reject={(file, reason) => {
          state.message = `${file.name} 未加入：${rejectionText(reason)}`;
        }}
      >
        点击选择或将 TXT / CSV 文件拖到这里
      </Upload>
      <Button
        on:click={() => {
          state.disabled = !state.disabled;
        }}
      >
        切换上传禁用
      </Button>
      <output>{state.message}</output>
    </Space>
  );
}
export function UploadFormExample() {
  const uploader = ref<typeof Upload>();
  const form = useForm(
    z.object({
      files: z
        .array(z.custom<UploadFile>())
        .min(1, '请添加附件')
        .refine((files) => files.every((file) => file.status === 'done'), '请先完成全部附件上传'),
    }),
    { defaultValues: { files: [] as UploadFile[] } },
  );
  const state = vm({ saved: '尚未保存' }),
    request = createRequest();
  return (
    <Form
      form={form}
      on:finish={(values) => {
        state.saved = values.files.map((file) => file.name).join('、');
      }}
    >
      <FormField name="files" control={form.control} label="审核附件" required>
        {(field) => (
          <Upload
            ref={(handle) => {
              uploader.value = handle;
              field.ref(handle);
            }}
            id={field.id}
            fileList={field.value ?? []}
            autoUpload={false}
            multiple
            maxCount={3}
            disabled={field.disabled}
            ariaDescribedby={field.ariaDescribedby}
            ariaLabel="审核附件"
            customRequest={request}
            on:change={(files) => field['on:change'](files)}
            on:blur={field['on:blur']}
          >
            选择待上传附件
          </Upload>
        )}
      </FormField>
      <Space wrap>
        <Button on:click={() => uploader.value?.start()}>开始上传附件</Button>
        <Button htmlType="submit" type="primary">
          保存附件
        </Button>
        <Button htmlType="reset">重置附件</Button>
      </Space>
      <output>保存结果：{state.saved}</output>
    </Form>
  );
}
