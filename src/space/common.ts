export type SpacingSize = 'sm' | 'md' | 'lg' | number;
export type Spacing = SpacingSize | [SpacingSize, SpacingSize];
const sizes = { sm: 8, md: 16, lg: 24 };
function pixels(value: SpacingSize) {
  const number = typeof value === 'number' ? value : sizes[value];
  return `${Number.isFinite(number) ? Math.max(0, number) : 0}px`;
}
export function spacingStyle(value: Spacing = 'sm') {
  return Array.isArray(value) ? `${pixels(value[0])} ${pixels(value[1])}` : pixels(value);
}
