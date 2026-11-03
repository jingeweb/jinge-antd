/** Snapshot only plain records, arrays and dates; immutable files/other instances keep identity. */
export function cloneValue<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return Array.from(value, (item) => cloneValue(item)) as T;
  if (
    value &&
    typeof value === 'object' &&
    Object.prototype.toString.call(value) === '[object Object]'
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneValue(item)]),
    ) as T;
  }
  return value;
}
export function equalValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
  if (typeof Temporal !== 'undefined') {
    if (
      typeof Temporal.PlainDate === 'function' &&
      left instanceof Temporal.PlainDate &&
      right instanceof Temporal.PlainDate
    )
      return left.equals(right);
    if (
      typeof Temporal.PlainTime === 'function' &&
      left instanceof Temporal.PlainTime &&
      right instanceof Temporal.PlainTime
    )
      return left.equals(right);
  }
  if (!left || !right || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => equalValue(value, right[index]))
    );
  }
  if (
    Object.prototype.toString.call(left) !== '[object Object]' ||
    Object.prototype.toString.call(right) !== '[object Object]'
  )
    return false;
  const first = Object.keys(left),
    second = Object.keys(right);
  return (
    first.length === second.length &&
    first.every(
      (key) =>
        Object.hasOwn(right, key) &&
        equalValue((left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key]),
    )
  );
}
export function formKeys<T extends object>(value: T) {
  return Object.keys(value) as Extract<keyof T, string>[];
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
