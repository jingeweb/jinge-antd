import { onMount, onUnmount, ref, watch } from 'jinge';

import { loadHighlight } from '../highlights';

export function CodeBlock(props: { code: string; language?: string; className?: string }) {
  const root = ref<HTMLDivElement>();
  let version = 0;
  function update() {
    const element = root.value;
    if (!element) return;
    const current = ++version;
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = props.code;
    pre.append(code);
    element.replaceChildren(pre);
    void loadHighlight(props.code, props.language ?? 'tsx')?.then(
      (html) => {
        // Only build-generated, escaped syntax highlighting HTML enters this path.
        if (current === version && root.value === element) element.innerHTML = html;
      },
      (error) => console.error('Unable to load code highlighting', error),
    );
  }
  onMount(update);
  watch(props, 'code', update);
  watch(props, 'language', update);
  onUnmount(() => {
    version++;
  });
  return (
    <div
      ref={root}
      className={`code-highlight ${props.className ?? ''}`}
      data-language={props.language ?? 'tsx'}
    />
  );
}
