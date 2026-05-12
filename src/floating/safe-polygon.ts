import { type Point } from './common';

export function isPointInPolygon(x: number, y: number, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x,
      yi = polygon[i].y;
    const xj = polygon[j].x,
      yj = polygon[j].y;

    // 检查点是否在边的 y 范围之间，且交点在点右侧
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}

export function isPointInPolygon2(x: number, y: number, points: Point[]): boolean {
  const [p0, p1] = points;
  return !(x < p0.x || x > p1.x || y < p0.y || y > p1.y);
}
