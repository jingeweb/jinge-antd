# 现有 Floating 是否足够：复核结论

结论：作为 PC 中台、固定定位到当前页面 body 的基础，现有实现够用，已沿用并补齐本轮常用交互和边界，没有引入 @floating-ui/dom。

## 可复用部分

- common.ts：四方向/对齐、offset、交叉轴基础约束、上下/左右翻转、安全通道几何。
- autoupdate.ts：不是只监听 window.resize 的简易实现；已移植 Floating UI 的祖先滚动/resize、ResizeObserver、IntersectionObserver 布局移动监测与清理机制。
- safe-polygon.ts：通用点在多边形/矩形内判断，可继续使用。
- floating.tsx：保留 Jinge VM、Portal 与公开生命周期，重整受控状态、事件和资源管理；Transition 改为普通条件挂载，原因见 F04。

## 增强前实际验证

普通定位：trigger=(100,100,80,30)、content=(120,60)、viewport=(800,600)、bottom、offset=10，得到 x=80,y=140，符合预期。

底部不足翻转：trigger=(100,550,80,30)，其余同上，得到 x=80,y=480，符合上翻预期。

已证实的边界问题：

1. 左侧不足时翻转到右侧只检查 x2<=W，未计入浮层宽度。trigger=(10,80,20,20)、content=(280,60)、viewport=(300,300)、left-start，得到 x=40，右边界=320。两侧都不足时还需要明确 best-fit/平移/尺寸约束策略。
2. 超大内容没有可用高度/宽度与滚动策略。trigger=(50,50,30,20)、content=(400,400)、viewport=(300,200)、top，得到 x=0,y=-360，顶部不可操作。
3. 重新执行现有 R07/R08：卸载后的延迟回调、hover 提前离开取消，均实际失败。
4. Chrome 重新执行 R13：滚动页面后鼠标进入浮层会关闭，实际失败。原因可追溯至 pageX/pageY 与 getBoundingClientRect 视口坐标混用。

上述探针现已加入持久化测试；R07/R08/R13 保留原断言并转绿。

## 本轮已补齐

- 完整 12 个 placement（补充 left）、翻转边界、视口安全边距、不可完全容纳时的最大尺寸和滚动。
- 坐标统一使用当前视口坐标；页面/祖先滚动、内容尺寸变化持续跟随。
- 从 mount 起监听 hover 离开，处理延迟打开/关闭取消、重新进入、卸载清理；显示重入之前清理旧监听/observer，不能覆盖并丢失清理函数。
- click 切换、focus 触发、ESC、outside pointer，以及受控/非受控模式一致的事件通知。
- placement/offset 等动态参数更新与清理，明确单元素触发器契约。
- 快速进入/关闭、祖先滚动、超大内容和尺寸变化、安全通道、嵌套 Portal、顶层 ESC、焦点恢复均有真实浏览器测试；另有事件/observer/延迟任务清理的普通测试。
- 焦点、层级和状态由 Jinge 组件库实现；仅引入定位算法库也不会自动解决这些问题。

Tooltip、Popover、Popconfirm 已接入，Select 移除重复打开逻辑并修复值传递/清空；每组有普通测试，浮层与提示组件有专门 e2e。Modal/Drawer 已接入同一逻辑 Portal 祖先关系；浏览器验证弹窗内 Popover 可输入、Tab 可回到弹窗、Escape 先关闭浮层，新增普通测试确保下层迟开的浮层不抢上层 Escape。

框架 Transition 的快速进入后关闭遗留节点已独立复现为 F04；本轮保留 CSS 入场动画，关闭直接卸载。暂不提供离场动画及旧 enterClass/leaveClass，未复制框架内部状态机。

## 暂不扩展

跨 iframe 定位、任意自定义定位容器、body 变换后的特殊包含块、虚拟锚点与复杂 inline 文本锚点不纳入首轮承诺。常见触发器祖先 transform 不应一概判为不支持：在 body 固定定位方案中，getBoundingClientRect 已反映触发器的变换；具体边界以真实测试为准。

## 依赖决策

D01 保留为未来备选；当前建议先增强现有实现。只有在新增的实际场景证明维护成本明显超出本轮范围时，再以具体复现和收益向用户提出依赖申请。未安装任何新依赖，未修改 Jinge/Compiler。
