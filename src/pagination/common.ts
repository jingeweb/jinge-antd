export function positiveInteger(value: number | undefined, fallback = 10) {
  return value !== undefined && Number.isFinite(value) && value >= 1
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value))
    : fallback;
}
export function itemTotal(value = 0) {
  return Number.isFinite(value)
    ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value)))
    : 0;
}
export function pageCount(total: number, size: number) {
  return Math.max(1, Math.ceil(itemTotal(total) / positiveInteger(size)));
}
export function clampPage(page: number | undefined, total: number, size: number) {
  return Math.min(positiveInteger(page, 1), pageCount(total, size));
}
export function sizeOptions(options: number[] | undefined, current: number) {
  return [
    ...new Set(
      [current, ...(options ?? [10, 20, 50, 100])].filter(
        (value) => Number.isSafeInteger(value) && value > 0,
      ),
    ),
  ].sort((a, b) => a - b);
}
export function pageItems(current: number, count: number) {
  const pages = new Set([1, count]);
  for (let page = Math.max(1, current - 2); page <= Math.min(count, current + 2); page++)
    pages.add(page);
  if (current <= 4) for (let page = 1; page <= Math.min(5, count); page++) pages.add(page);
  if (current >= count - 3)
    for (let page = Math.max(1, count - 4); page <= count; page++) pages.add(page);
  const result: { key: string; page: number; jump?: 'previous' | 'next' }[] = [];
  let previous = 0;
  for (const page of [...pages].sort((a, b) => a - b)) {
    if (page - previous === 2) result.push({ key: `${page - 1}`, page: page - 1 });
    else if (page - previous > 2)
      result.push({
        key: `gap-${page}`,
        page: Math.max(1, Math.min(count, current + (page < current ? -5 : 5))),
        jump: page < current ? 'previous' : 'next',
      });
    result.push({ key: `${page}`, page });
    previous = page;
  }
  return result;
}
