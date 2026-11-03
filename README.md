# Jinge Antd

面向 PC 中台系统的 Jinge 组件库。实现范围、逐组件能力和交付顺序见 [ROADMAP](docs/ROADMAP.md)；遇到的框架边界见 [FRAMEWORK-GAPS](docs/FRAMEWORK-GAPS.md)。组件仍在分批建设，以文档站的“已交付”标记为准。

## 开发文档站

```sh
pnpm install
pnpm dev-site
```

站点在 `site/`，只包含组件目录、搜索、交互示例、源码和 API 文档。示例从同一个 TSX 文件运行并通过 `?raw` 展示源码。`pnpm build-site` 构建到 `dist-site/`；`pnpm preview-site` 预览构建结果。

## 使用组件

```tsx
import { Button } from 'jinge-antd';
import 'jinge-antd/style.css';

export function Actions() {
  return (
    <Button type="primary" on:click={() => console.log('save')}>
      保存
    </Button>
  );
}
```

项目使用 Jinge 编译器编译 TSX；组件事件、插槽与 ref 遵循 Jinge API。已有 API 的变更记录见 [MIGRATIONS](docs/MIGRATIONS.md)。

## 验证

```sh
pnpm test:components  # 全部正常行为、基础组件和文档站测试
pnpm test:site        # 文档站真实浏览器测试
pnpm test:regressions # 19 项初始问题回归，修复后保留用例
pnpm test:verify      # 根据 open/fixed 清单核验当前分批交付基线
pnpm lint
pnpm build
```

尚未修复的回归会使 `pnpm test` 返回非零；不会用 skip 或反向断言将缺陷算作通过。详细测试结构与限制见 [test/README](test/README.md)。

新增外部依赖需先确认；评估记录见 [DEPENDENCIES](docs/DEPENDENCIES.md)。
