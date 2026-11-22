/**
 * Plane-geometry helpers used by the `geo` widget and by lesson checks.
 * Points are { x, y } objects.
 */

export const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);

export const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Interior angle at vertex `v` between rays v→a and v→c, in degrees (0–180). */
export function angleDeg(a, v, c) {
  const ux = a.x - v.x;
  const uy = a.y - v.y;
  const wx = c.x - v.x;
  const wy = c.y - v.y;
  const d = Math.hypot(ux, uy) * Math.hypot(wx, wy);
  if (!d) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, (ux * wx + uy * wy) / d))) * 180) / Math.PI;
}

/** Signed area of a polygon (positive when counter-clockwise). */
export function signedArea(pts) {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    sum += p.x * q.y - q.x * p.y;
  }
  return sum / 2;
}

export const polygonArea = (pts) => Math.abs(signedArea(pts));

export function perimeter(pts) {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) sum += dist(pts[i], pts[(i + 1) % pts.length]);
  return sum;
}

/** Slope of the line through a and b (Infinity for vertical lines). */
export const slopeOf = (a, b) => (b.x === a.x ? Infinity : (b.y - a.y) / (b.x - a.x));

/** Foot of the perpendicular from p onto line ab. */
export function project(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (!len2) return { x: a.x, y: a.y };
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  return { x: a.x + t * dx, y: a.y + t * dy };
}

/** Rotate point p around centre c by `deg` degrees (counter-clockwise). */
export function rotate(p, c, deg) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * cos - dy * sin, y: c.y + dx * sin + dy * cos };
}

/** Intersection of lines ab and cd, or null if parallel. */
export function intersect(a, b, c, d) {
  const den = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x);
  if (Math.abs(den) < 1e-12) return null;
  const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / den;
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) };
}

export const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
