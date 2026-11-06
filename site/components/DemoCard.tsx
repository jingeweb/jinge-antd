import { Dynamic, t, vm } from 'jinge';

import type { Demo } from '../data/types';

import { CodeBlock } from './CodeBlock';

export function DemoCard(props: { demo: Demo }) {
  const state = vm({ expanded: false, copy: t('复制代码') });
  async function copy() {
    if (!navigator.clipboard) {
      state.copy = t('请展开源码后手动复制');
      return;
    }
    try {
      await navigator.clipboard.writeText(props.demo.source);
      state.copy = t('已复制');
    } catch {
      state.copy = t('复制失败，请手动复制');
    }
  }
  return (
    <section className="demo-card" id={props.demo.id}>
      <div className="demo-preview">
        <Dynamic fc={props.demo.render} />
      </div>
      <div className="demo-caption">
        <h3>{props.demo.title}</h3>
        <p>{props.demo.description}</p>
        <div className="demo-tools">
          <button
            type="button"
            aria-expanded={state.expanded}
            on:click={() => {
              state.expanded = !state.expanded;
            }}
          >
            {state.expanded ? t('收起代码') : t('查看代码')}
          </button>
          <button type="button" on:click={copy}>
            {state.copy}
          </button>
        </div>
      </div>
      {state.expanded && (
        <CodeBlock code={props.demo.source} language="tsx" className="demo-source" />
      )}
    </section>
  );
}
