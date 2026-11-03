# Tree 与 Cascader 首轮交付

这两个组件完成既定阶段 6 的剩余范围，面向中小规模中台层级数据；没有新增依赖或修改 Jinge/Compiler。站点提供四组真实交互示例、同源源码和公开 API。

## Tree

TreeNode 使用全树唯一的 string/有限 number key、必需 label、可选 children/disabled/disableCheckbox/selectable/isLeaf。0 与字符串 0 是不同键。循环、重复键等错误配置明确报错。节点顺序变化保留同 key 的渲染节点。

展开、选择、勾选各有独立 controlled/default 数组，初始化是否传入相应属性决定控制模式，之后保持固定。默认值做快照。受控父级可拒绝请求，需要接受时写回事件中的 keys。defaultExpandAll 只作用于初始化已有分支，不无限加载后代。

- 单选和无需修饰键的多选独立于勾选。
- checkable 支持关联全选/半选；checkStrictly 切换独立勾选。关联结果按深度优先顺序返回全部已知完整勾选 key，半选独立放在信息中。未知 key 保留等待数据。
- disabled 节点禁止整个子树，disableCheckbox 只禁止自身勾选并打断关联，后代仍可独立勾选。这些边界不计入上级全选/半选汇总，父级输入的已勾选禁用值保留。
- 已勾选的懒父级会把勾选传递给随后加载的可用后代；数据加载本身不触发新的 check 请求。
- filter 匹配已知 label，保留匹配项和祖先，只为显示匹配路径展开祖先。清空恢复用户展开状态。过滤命中懒节点名称不会自动发起加载；明确展开才加载。
- 标题使用组件级稳定 slot:title，label 仍用于搜索和可访问名称。

树使用 tree/treeitem、显式层级/位置/数量、展开/选中/checked/mixed/busy 语义与单一 Tab 停靠点。上下遍历可见可用节点，左右展开/进入/收起/回父级，Home/End 定位首末，Enter 选择，Space 勾选或选择，字符前缀定位。focus(key?) 定位可见节点。外部收起或移除焦点项时回最近可见祖先，延迟恢复不能夺取后来移到外部的焦点。

Tree 不是原生表单字段；通过 keys 事件绑定业务字段。首轮不含拖动、虚拟化、大树增量算法、连线和任意节点动态渲染函数。

## Cascader

CascaderOption 使用 value/label/children/disabled/isLeaf。value 为 string/有限 number，同级唯一；不同父级可重复，完整路径区分节点。首轮为单一路径：CascaderValue 为 `(string | number)[]`，空值统一 null。

value/defaultValue、open/defaultOpen 分别遵循初始化固定控制模式，默认值为快照。只在提交可选项或清空时发 change(value, options, event)，浏览、搜索、加载不提交。默认选叶子；changeOnSelect 允许点击中间层提交并继续浏览。方向键导航始终不提交。外部未知路径保留，选项到达后补全标签；打开有已知懒祖先的选中路径会加载该祖先。

showSearch 搜索已加载节点的完整标签路径，空格分词均须匹配；changeOnSelect 开启时也包含中间层。搜索不自动遍历网络，不提供远程搜索。IME 期间忽略 Enter 选择，结束后报告一次搜索。关闭/取消丢弃浏览和搜索草稿。

combobox 控制单个 listbox，列是命名 group，选项按完整路径命名。焦点留在触发器，通过 aria-activedescendant 标记活动选项。上下/Home/End 在当前列移动并跳过禁用项，右进入下级或加载，左返回上级，Enter 选择，Escape 仅关闭当前浮层，Tab 自然离开。与 Modal 的层级和 Escape 协作已验证；窄屏列在浮层内部横向滚动。

原生表单通过隐藏字段把路径序列化为 JSON 数组，保留数字类型和特殊字符，空值为空字符串。必填校验聚焦可见触发器。reset 恢复默认快照或受控父值，不发 change。disabled 排除原生提交，只读保留值但禁止操作。FormField 绑定原生路径数组，将 change 的第一个参数传给字段回调。

首轮暂缓多选级联、悬浮展开、字段别名、虚拟化、远程搜索及节点级动态插槽。多节点选择优先使用 Tree 勾选。

## 异步加载共同契约

无 children 且 isLeaf=false，并提供 loadData 时为懒节点。loadData(node, {signal}) 返回子节点数组，不要求修改父数据。组件按稳定标识和节点对象缓存、同节点请求去重。空数组成为叶子；失败保留可重试状态，不自动循环请求。空错误消息使用明确回退文本；无效子节点（如重复 key）回滚缓存并显示可重试错误。

替换节点对象、移除节点、显式提供 children、取消懒标记/loader 或卸载会中止旧请求，旧结果不能写入新节点。折叠/关闭允许请求继续完成缓存，不强制重开或选择。loader 应响应 AbortSignal 清理实际资源；组件也会隔离忽略取消的迟到结果。

数据遍历、缓存、失效和键校验放在普通 `.ts` 模块。F14 是当前 compiler 把 TSX 普通回调返回的业务 node.children 错当插槽的缺陷；没有访问框架私有内部或强制重绘，层级能力通过常规数据模块实现。任意 TSX children 数据返回写法的统一支持留待框架讨论。

## 验证与参考

新增 30 项普通测试（Tree 17、Cascader 13）、12 项浏览器测试、4 项站点测试，并有公开类型正反例。两组件首批各 10 项普通测试均先确认失败，再实现转绿。截图 `test/.results/tree.png`、`cascader.png` 已目视检查。

独立 F14 探针保留正确行为断言并真实失败。当前框架探针为 F04/F05/F07/F08/F09/F11/F12/F14 共 8 项，不混入正常组件及 R01–R19 回归。

组件能力参考官方 [Ant Design Tree](https://ant.design/components/tree/)、[Cascader](https://ant.design/components/cascader/)、[Element Plus Tree](https://element-plus.org/en-US/component/tree.html)，树键盘与语义参考 [WAI-ARIA Tree View Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)。本轮没有实现拖动、虚拟化或复制它们的全部 API。
