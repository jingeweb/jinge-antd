export function navigationHref(href?: string) {
  if (href === undefined) return undefined;
  const value = href.trim();
  const scheme = value
    // oxlint-disable-next-line no-control-regex -- Compare URL schemes after stripping ASCII controls/spaces.
    .replace(/[\u0000-\u0020]/g, '')
    .match(/^([a-z][a-z\d+.-]*):/i)?.[1]
    ?.toLowerCase();
  return scheme && !['http', 'https', 'mailto', 'tel'].includes(scheme) ? undefined : value;
}
export function navigationRel(target?: string, rel?: string) {
  return target === '_blank'
    ? [...new Set([...(rel?.split(/\s+/).filter(Boolean) ?? []), 'noopener', 'noreferrer'])].join(
        ' ',
      )
    : rel;
}
