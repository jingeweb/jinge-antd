import { createRequire } from 'node:module';
const ts = createRequire(import.meta.resolve('jinge-compiler'))('@typescript/typescript6');
export function sourceStrings(
  source,
  file,
  translate = (value) => value,
  { preserveDefaults = false } = {},
) {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const edits = [],
    strings = new Set();
  function replace(node, key, format) {
    if (!/\p{Script=Han}/u.test(key)) return;
    strings.add(key);
    edits.push({ start: node.getStart(tree), end: node.end, value: format(translate(key)) });
  }
  function visit(node) {
    // API default values describe the library, whose own text is not localized yet.
    if (preserveDefaults && ts.isPropertyAssignment(node) && node.name.getText(tree) === 'default')
      return;
    if (ts.isJsxText(node)) {
      replace(
        node,
        node.getText(tree).replace(/\s+/g, ' ').trim(),
        (value) => `{${JSON.stringify(value)}}`,
      );
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      replace(node, node.text, (value) =>
        ts.isJsxAttribute(node.parent) ? `{${JSON.stringify(value)}}` : JSON.stringify(value),
      );
    } else if (ts.isTemplateExpression(node)) {
      const key =
        node.head.text +
        node.templateSpans.map((span, index) => `{${index}}` + span.literal.text).join('');
      replace(
        node,
        key,
        (value) =>
          '`' +
          value
            .replaceAll('`', '\\`')
            .replaceAll('$', '\\$')
            .replace(
              /\{(\d+)\}/g,
              (_, index) => '${' + node.templateSpans[Number(index)].expression.getText(tree) + '}',
            ) +
          '`',
      );
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return {
    strings: [...strings],
    source: edits
      .sort((a, b) => b.start - a.start)
      .reduce(
        (text, edit) => text.slice(0, edit.start) + edit.value + text.slice(edit.end),
        source,
      ),
  };
}
