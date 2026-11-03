# Upload 首轮交付

支持 PC 中台常见附件流程：选择或拖放文件，类型/大小/数量及异步校验，自动或手动发送，查看进度，取消/重试，受控列表与表单保存。没有增加依赖，也没有修改 Jinge/Compiler。

## 组件与传输契约

`Upload`、`UploadProps`、`UploadFile`、`UploadRequestOptions`、`UploadHandle`、`UploadStatus`、`UploadChangeType`、`UploadRejectReason` 均从库入口导出。公共 API 与可运行示例见 site 的 Upload 页。

- 初始化 `fileList` 非 undefined 为受控，否则使用 `defaultFileList` 快照；模式固定。每项 uid 唯一稳定。状态为 ready/uploading/done/error/canceled。
- `on:change(files, {file,type})` 返回新列表/记录，type 为 select/start/progress/success/error/cancel/remove。受控父级应写回完整列表；拒绝新项不会发送，外部删除在途项会中止。拒绝移除请求则保留传输。
- 服务器已有记录可不提供 originFile，直接展示状态及安全 URL；重新上传须有原生 File。外部提供 uploading 只表示展示状态，不会凭空恢复请求。
- accept 支持扩展名、精确 MIME 与 MIME 通配；同时校验拖放。maxSize 单位字节，maxCount 包含所有已有项，超额拒绝而非自动替换。单次多选须设置 multiple。
- beforeUpload 按选择顺序校验，返回 false 或抛出/拒绝则不加入。多个选择批次排队；重置、禁用、卸载使旧校验过期。手动上传使用 autoUpload=false，不借用返回 false 暂存文件。
- 默认并发 3；自定义正整数 concurrency。完成或取消释放名额，失败/取消不自动重试。cancel 保留 canceled 记录，remove 才删除；beforeRemove 可异步否决，并防重复移除。

默认请求使用原生 XMLHttpRequest + FormData，支持 action、POST/PUT/PATCH、文件字段 name、额外文本/Blob data、headers、凭证及毫秒 timeout。2xx 成功，JSON 响应解析后保存为 response，否则保留文本；不猜测后端文件 URL。缺失 action/customRequest 显示明确失败，避免假上传成功。不要手动设置 multipart Content-Type。

customRequest 接收 file、filename、action、signal、onProgress 并返回 Promise。业务需要监听 AbortSignal 停止网络/计时器等资源；组件会忽略已取消、移除、重置或卸载后旧任务的结果。每次重试使用独立任务与信号，旧进度和完成结果不能覆盖新任务。

## 表单与可访问性

原生 button 触发选择器，支持 Enter/Space、focus/blur 及公开 ref，所有操作按钮 type=button。拖放状态不依赖鼠标点击路径。文件列表、进度条、错误信息和操作按钮有文本/可访问名称；长文件名可换行。

`name` 表示上传请求的字段，内部 file input 没有宿主表单 name，不把队列伪装成普通原生文件字段。`form` 可关联原生 reset；未取消的 reset 中止请求/校验并恢复默认快照或受控父值，不发送 change。FormField 绑定 fileList，并把 change 的第一个参数传给字段回调；业务保存服务端 response/id/url 等明确数据。

File 通过公开 `vmRaw`/`vmIgnore` 保持身份和原生方法，额外 Blob data 在传输前使用 `vmRaw`。这使用现有框架提供的非响应式对象入口，不增加框架补丁或读取私有内部字段。

## 范围与证据

首轮为文字列表和业务提供的预览回调/安全外链。图片墙/本地缩略图、图片编辑、目录/粘贴、文件转换、拖动排序、分片/断点续传、云存储 SDK 暂缓。客户端校验是交互辅助，服务端仍需执行自身校验。

新增 16 项普通、7 项组件 e2e、2 项站点 e2e，另有公开类型正反例。测试覆盖原生文件选择器/拖放、真实 XHR multipart 与 Blob 数据、HTTP 失败重试、取消/受控拒绝/并发、异步校验与卸载、原生 reset 及 Form 保存。站点示例只本地模拟传输，避免示例向外部服务发送文件；源码直接读取示例文件，截图 test/.results/upload.png 已目视检查。

能力取舍参考官方组件文档：[Ant Design Upload](https://ant.design/components/upload/)、[Element Plus Upload](https://element-plus.org/en-US/component/upload.html)。选择常用附件流程，沿用 Jinge 的事件、插槽和 ref 方式。
