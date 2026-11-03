import type { Point } from './common';

export function isPointInPolygon(x: number, y: number, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    const cross = (x - a.x) * (b.y - a.y) - (y - a.y) * (b.x - a.x);
    if (
      Math.abs(cross) < 0.001 &&
      x >= Math.min(a.x, b.x) &&
      x <= Math.max(a.x, b.x) &&
      y >= Math.min(a.y, b.y) &&
      y <= Math.max(a.y, b.y)
    )
      return true;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
export function isPointInPolygon2(x: number, y: number, points: Point[]): boolean {
  if (points.length < 2) return false;
  const [a, b] = points;
  return x >= a.x && x <= b.x && y >= a.y && y <= b.y;
}
