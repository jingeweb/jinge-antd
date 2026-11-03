import type { ComponentDoc } from './types';

import { UploadExample, UploadFormExample } from '../demos/upload';
// oxlint-disable-next-line import/default -- Vite ?raw provides a default string export.
import source from '../demos/upload.tsx?raw';
export const uploadDoc: ComponentDoc = {
  id: 'upload',
  name: 'Upload',
  title: '上传',
  category: '数据录入',
  status: 'ready',
  description: '文件选择和拖放、异步校验、受控列表、手动或自动上传、进度与取消重试。',
  demos: [
    {
      id: 'upload-basic',
      title: '报表附件与拖放',
      description:
        'TXT/CSV、单文件不超过 1 MiB，最多三项，并发两项。此处模拟上传，不发送到外部服务；以 fail 开头的文件首次失败，可重试。',
      render: UploadExample,
      source,
    },
    {
      id: 'upload-form',
      title: '手动上传与 Form',
      description:
        '选文件后点击开始上传，全部完成后才可保存。FormField 将文件列表绑定到业务字段，重置清空列表并取消请求。示例同样使用本地模拟请求。',
      render: UploadFormExample,
      source,
    },
  ],
  api: [
    {
      name: 'fileList / defaultFileList',
      type: 'UploadFile[]',
      default: '[]',
      description:
        '初始化 fileList 非 undefined 时受控，控制模式固定。稳定且唯一的 uid 标识文件。默认列表做快照，不修改传入记录。受控父级必须在 change 中写回列表；拒绝新文件时不会发送请求，外部删除在途文件会取消请求。',
    },
    {
      name: 'UploadFile',
      type: '{ uid, name, status, originFile?, size?, type?, percent?, response?, error?, url? }',
      description:
        'status 为 ready/uploading/done/error/canceled。服务器已有文件可以不带 originFile；只有有原始 File 的记录可上传或重试。response 保存请求结果，组件不猜测后端 URL 字段。',
    },
    {
      name: 'on:change',
      type: '(files: UploadFile[], info: {file, type}) => void',
      description:
        '选择、开始、进度、成功、失败、取消、移除时发出快照。type 为 select/start/progress/success/error/cancel/remove；取消保留 canceled 项，移除才删除。',
    },
    {
      name: 'multiple / accept / maxSize / maxCount',
      type: 'boolean / string / number / number',
      description:
        '默认单次只选一个；accept 同时用于原生选择器和扩展名/MIME 校验，大小以字节计，数量包含现有全部记录。超额项拒绝，不替换旧文件。未指定数量或大小则不限制。客户端校验不替代服务端校验。',
    },
    {
      name: 'beforeUpload / on:reject',
      type: '(file: File, batch: File[]) => boolean | Promise<boolean> / (file, reason, error?) => void',
      description:
        '逐项按选择顺序校验。beforeUpload 返回 false 或抛出/拒绝时不加入列表；异步校验期间可继续选择，批次排队处理。reason 为 accept/size/count/beforeUpload。手动上传请用 autoUpload=false。',
    },
    {
      name: 'autoUpload / concurrency',
      type: 'boolean / number',
      default: 'true / 3',
      description:
        '自动发送 ready 文件；否则使用单项上传按钮或公开 start。正整数并发数，其余回退 3。取消或完成释放名额；error/canceled 不自动重试。',
    },
    {
      name: 'action / method / name',
      type: 'string / POST | PUT | PATCH / string',
      default: '— / POST / file',
      description:
        '默认 XHR 使用 multipart FormData；name 是文件字段名。未配置 action/customRequest 时文件进入失败状态并显示配置提示。',
    },
    {
      name: 'headers / data / withCredentials / timeout',
      type: 'Record<string,string> / Record<string,string | Blob> / boolean / number',
      default: '— / — / false / 0',
      description:
        '默认 XHR 的额外请求头、表单字段、凭证和毫秒超时。不要手动设置 multipart Content-Type，浏览器生成 boundary。2xx 成功，JSON 结果解析为值，其他响应保留文本。',
    },
    {
      name: 'customRequest',
      type: '(options: UploadRequestOptions) => Promise<unknown>',
      description:
        '替换 XHR，接收 file、filename、action、signal、onProgress(percent)。Promise 完成/拒绝驱动成功/失败；必须自行响应 AbortSignal 停止实际传输。组件仍会忽略取消/移除后的迟到结果，进度限制在 0–100。',
    },
    {
      name: 'beforeRemove',
      type: '(file: UploadFile) => boolean | Promise<boolean>',
      description:
        '返回 false 或拒绝则保留；等待期间防止重复请求移除。受控父级保留记录也可拒绝移除，只有接受删除才取消在途请求。',
    },
    {
      name: 'drag / children / showUploadList',
      type: 'boolean / JNode / boolean',
      default: 'false / 选择文件 / true',
      description:
        '拖放区、触发按钮内容和列表显示开关。children 是按钮内容，不嵌入另一个可交互控件。默认文字列表，不自动生成本地图片预览。',
    },
    {
      name: 'url / on:preview',
      type: 'UploadFile.url / (file,event) => void',
      description:
        '有效 http/https/blob URL 显示安全外链；其余显示文本。preview 提供独立预览按钮，由业务打开详情或图片。',
    },
    {
      name: 'disabled / size / className / style',
      type: 'boolean / sm | md | lg / string / string',
      default: 'false / md / — / —',
      description:
        '禁用选择/拖放/手动操作；已开始请求继续上报进度。应用取消应使用 cancel。自定义类名/样式作用于外层。',
    },
    {
      name: 'id / form / ariaLabel / ariaLabelledby / ariaDescribedby',
      type: 'string',
      description:
        'id 指向原生触发按钮，可关联 label；form 关联原生 reset。内部 file input 不参加宿主表单的文件提交，附件使用组件传输结果或业务字段保存。',
    },
    {
      name: 'ref',
      type: '{ focus(options?), blur(), open(), start(uid?), cancel(uid?), remove(uid): Promise<boolean> }',
      description:
        '不传 uid 时 start/cancel 操作全部可处理文件；open 打开选择器，需用户激活。Form reset 恢复默认快照（受控恢复父值），取消请求/校验，不发送 change。卸载同样取消请求并隔离迟到结果。',
    },
    {
      name: 'on:focus / on:blur',
      type: '(event: FocusEvent) => void',
      description: '原生触发按钮事件，可与 FormField 触碰/校验绑定。',
    },
  ],
  notes: [
    '能力范围参考 Ant Design 和 Element Plus 的 Upload：先支持中台常用文字列表、自动/手动上传及请求生命周期。目录上传、粘贴、图片墙/裁剪、文件转换、排序、分片/断点续传、云 SDK 暂缓。',
    '受控父级需写回每次 change 的完整列表，包含状态与进度。外部传入 uploading 只展示状态，不代表组件持有或恢复该请求；恢复传输请重新添加原始 File 为 ready 或使用 start。',
    '原始 File 使用公开 vmRaw/vmIgnore 保持浏览器原生内部槽；没有修改 Jinge、读取私有宿主或新增依赖。普通 JSON 元数据仍响应式。',
    '自定义请求负责实际中止资源，组件负责 AbortSignal 和迟到结果隔离；移除/重置/卸载均可触发取消。beforeUpload 校验任务无法强制终止，但过期结果不会加入列表。',
    '默认传输使用 XMLHttpRequest 和 FormData，字段及响应结构由业务约定。示例只模拟传输，不会把选择的文件发送给外部服务。',
  ],
};
