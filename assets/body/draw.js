/**
 * Geometry for the body-map artwork. No DOM: everything here also runs in Node (the unit tests use it).
 *
 * The artwork is drawn in code. A structure is a list of PARTS, and a part is a chain of cubic Bézier
 * segments worked out from a handful of points:
 *
 *   blob([[x, y], …])            a closed, smooth outline through the points (a point [x, y, 1] is a sharp corner)
 *   oval(cx, cy, rx, ry, deg)    an ellipse
 *   box(x, y, w, h, r)           a rounded rectangle
 *   tube([[x, y], …], width)     an open smooth line with a thickness: vessels, the gut, long bones, ribs
 *   loop([[x, y], …], width)     the same, closed into a ring
 *   ink([[x, y], …])             a thin line drawn on top of its structure (folds, fibres, joints); never hit-tested
 *
 * Parts can be moved about before they are built: flip(parts, cx), shift(parts, dx, dy), turn(parts, deg, ox, oy),
 * grow(parts, k, ox, oy) and pair(parts, cx, nearSide, farSide), which returns the parts plus their mirror image,
 * each tagged with the side of the body it is on.
 *
 * A part is { k: 'fill' | 'tube' | 'ink', c: [x0, y0, x1, y1, x2, y2, x3, y3, …one row of 8 per segment], w, side, tone }.
 * pathOf(part) gives the SVG path, flat(part) a polyline along it, and the hit-testing helpers work on those.
 */

const r1 = (v) => { const r = Math.round(v * 10) / 10; return Object.is(r, -0) ? 0 : r; };

/** Smooth chain of cubic segments through points. Handles are scaled by the length of their own chord, so uneven spacing does not loop. */
function spline(pts, closed, s = 0.34) {
  const n = pts.length;
  const c = [];
  if (n < 2) return c;
  const at = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const dir = (i) => {
    const p = at(i);
    if (p[2]) return [0, 0];
    const a = at(i - 1);
    const b = at(i + 1);
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    return [dx / len, dy / len];
  };
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p = at(i);
    const q = at(i + 1);
    const chord = Math.hypot(q[0] - p[0], q[1] - p[1]);
    const d0 = dir(i);
    const d1 = dir(i + 1);
    c.push(p[0], p[1], p[0] + d0[0] * chord * s, p[1] + d0[1] * chord * s, q[0] - d1[0] * chord * s, q[1] - d1[1] * chord * s, q[0], q[1]);
  }
  return c;
}

/** A closed smooth shape through the points. */
export function blob(pts, opts = {}) {
  return { k: 'fill', c: spline(pts, true, opts.s), ...strip(opts) };
}

/** An open smooth line with a thickness. */
export function tube(pts, w = 6, opts = {}) {
  return { k: 'tube', c: spline(pts, false, opts.s), w, ...strip(opts) };
}

/** A closed smooth line with a thickness (a membrane, a ring). */
export function loop(pts, w = 6, opts = {}) {
  return { k: 'tube', c: spline(pts, true, opts.s), w, ...strip(opts) };
}

/** A thin detail line, drawn in ink on top of the structure it belongs to. */
export function ink(pts, opts = {}) {
  return { k: 'ink', c: spline(pts, false, opts.s), w: opts.w || 0, ...strip(opts) };
}

/** The outline of a filled part as a detail line (an eye socket, a fold). */
export const rim = (part) => ({ ...part, k: 'ink', w: 0 });

function strip(opts) {
  const out = {};
  if (opts.side) out.side = opts.side;
  if (opts.tone) out.tone = opts.tone;
  return out;
}

const KAPPA = 0.5522848;
/** An ellipse, turned by `deg` degrees (clockwise on screen). */
export function oval(cx, cy, rx, ry = rx, deg = 0, opts = {}) {
  const kx = rx * KAPPA;
  const ky = ry * KAPPA;
  const c = [
    rx, 0, rx, ky, kx, ry, 0, ry,
    0, ry, -kx, ry, -rx, ky, -rx, 0,
    -rx, 0, -rx, -ky, -kx, -ry, 0, -ry,
    0, -ry, kx, -ry, rx, -ky, rx, 0,
  ];
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  for (let i = 0; i < c.length; i += 2) {
    const x = c[i];
    const y = c[i + 1];
    c[i] = cx + x * cos - y * sin;
    c[i + 1] = cy + x * sin + y * cos;
  }
  return { k: 'fill', c, ...strip(opts) };
}

/** A rounded rectangle. */
export function box(x, y, w, h, r = 0, opts = {}) {
  const rr = Math.min(r, w / 2, h / 2);
  const k = rr * (1 - KAPPA);
  const c = [];
  const lineTo = (x0, y0, x1, y1) => c.push(x0, y0, x0 + (x1 - x0) / 3, y0 + (y1 - y0) / 3, x0 + ((x1 - x0) * 2) / 3, y0 + ((y1 - y0) * 2) / 3, x1, y1);
  lineTo(x + rr, y, x + w - rr, y);
  c.push(x + w - rr, y, x + w - k, y, x + w, y + k, x + w, y + rr);
  lineTo(x + w, y + rr, x + w, y + h - rr);
  c.push(x + w, y + h - rr, x + w, y + h - k, x + w - k, y + h, x + w - rr, y + h);
  lineTo(x + w - rr, y + h, x + rr, y + h);
  c.push(x + rr, y + h, x + k, y + h, x, y + h - k, x, y + h - rr);
  lineTo(x, y + h - rr, x, y + rr);
  c.push(x, y + rr, x, y + k, x + k, y, x + rr, y);
  return { k: 'fill', c, ...strip(opts) };
}

/* ------------------------------------------------------------- transforms */

const list = (parts) => (Array.isArray(parts) ? parts : [parts]);
function mapped(parts, fn, widthFactor = 1) {
  return list(parts).map((p) => {
    const c = new Array(p.c.length);
    for (let i = 0; i < p.c.length; i += 2) { const q = fn(p.c[i], p.c[i + 1]); c[i] = q[0]; c[i + 1] = q[1]; }
    return { ...p, c, w: p.w ? p.w * widthFactor : p.w };
  });
}
/** Mirror image about the vertical line x = cx. */
export const flip = (parts, cx) => mapped(parts, (x, y) => [2 * cx - x, y]);
export const shift = (parts, dx, dy) => mapped(parts, (x, y) => [x + dx, y + dy]);
export function turn(parts, deg, ox = 0, oy = 0) {
  const a = (deg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return mapped(parts, (x, y) => [ox + (x - ox) * cos - (y - oy) * sin, oy + (x - ox) * sin + (y - oy) * cos]);
}
export const grow = (parts, k, ox = 0, oy = 0, ky = k) => mapped(parts, (x, y) => [ox + (x - ox) * k, oy + (y - oy) * ky], Math.sqrt(Math.abs(k * ky)));
export const sided = (parts, side) => list(parts).map((p) => ({ ...p, side }));
export const toned = (parts, tone) => list(parts).map((p) => ({ ...p, tone }));
/** The parts as drawn (tagged `near`) and their mirror image about x = cx (tagged `far`). */
export const pair = (parts, cx, near = 'right', far = 'left') => [...sided(parts, near), ...sided(flip(parts, cx), far)];

/* ------------------------------------------------------------------ build */

/** SVG path data of a part. */
export function pathOf(part) {
  let c = part.c;
  if (!c.length) return '';
  if (part.k === 'fill') {
    // every filled outline runs the same way round, so that overlapping pieces of one structure merge instead of cutting holes
    let area = 0;
    for (let i = 0; i < c.length; i += 8) area += c[i] * c[i + 7] - c[i + 6] * c[i + 1];
    if (area < 0) {
      const back = [];
      for (let i = c.length - 8; i >= 0; i -= 8) back.push(c[i + 6], c[i + 7], c[i + 4], c[i + 5], c[i + 2], c[i + 3], c[i], c[i + 1]);
      c = back;
    }
  }
  let d = `M${r1(c[0])} ${r1(c[1])}`;
  for (let i = 0; i < c.length; i += 8) d += `C${r1(c[i + 2])} ${r1(c[i + 3])} ${r1(c[i + 4])} ${r1(c[i + 5])} ${r1(c[i + 6])} ${r1(c[i + 7])}`;
  return part.k === 'fill' ? `${d}Z` : d;
}

/** Points along a part: [[x, y], …]. Closed parts do not repeat the first point. */
export function flat(part, per = 6) {
  const c = part.c;
  const out = [];
  if (!c.length) return out;
  out.push([c[0], c[1]]);
  for (let i = 0; i < c.length; i += 8) {
    for (let k = 1; k <= per; k++) {
      const t = k / per;
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const e = 3 * u * t * t;
      const f = t * t * t;
      out.push([a * c[i] + b * c[i + 2] + e * c[i + 4] + f * c[i + 6], a * c[i + 1] + b * c[i + 3] + e * c[i + 5] + f * c[i + 7]]);
    }
  }
  if (part.k === 'fill') out.pop();
  return out;
}

/** [x0, y0, x1, y1] round a list of points (and, optionally, an earlier box). */
export function boxOf(pts, into = null) {
  const b = into || [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of pts) { if (p[0] < b[0]) b[0] = p[0]; if (p[1] < b[1]) b[1] = p[1]; if (p[0] > b[2]) b[2] = p[0]; if (p[1] > b[3]) b[3] = p[1]; }
  return b;
}

/* ------------------------------------------------------------ hit testing */

/** Is (x, y) inside the closed polygon? (even-odd rule) */
export function inPolygon(poly, x, y) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

/** Distance from (x, y) to the segment a–b. */
export function distToSegment(x, y, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((x - a[0]) * dx + (y - a[1]) * dy) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
}

/** Distance from (x, y) to a polyline (closed: the last point joins the first). */
export function distToLine(pts, x, y, closed = false) {
  let best = Infinity;
  const n = pts.length;
  if (n === 1) return Math.hypot(x - pts[0][0], y - pts[0][1]);
  for (let i = closed ? 0 : 1; i < n; i++) {
    const d = distToSegment(x, y, pts[(i + n - 1) % n], pts[i]);
    if (d < best) best = d;
  }
  return best;
}

/**
 * How far (x, y) is from a built part: 0 inside a filled part or within the thickness of a tube, otherwise the
 * distance to its edge. A built part is { k, pts, w, box }.
 */
export function distToPart(bp, x, y) {
  if (bp.k === 'fill') return inPolygon(bp.pts, x, y) ? 0 : distToLine(bp.pts, x, y, true);
  return Math.max(0, distToLine(bp.pts, x, y) - bp.w / 2);
}

/** Total length of a polyline. */
export function lengthOf(pts) {
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return total;
}

/** The point a share t (0–1) of the way along a polyline, and the direction of travel there (degrees). */
export function pointAlong(pts, t) {
  const total = lengthOf(pts);
  if (!pts.length) return { x: 0, y: 0, deg: 0 };
  let want = Math.max(0, Math.min(1, t)) * total;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (want <= seg || i === pts.length - 1) {
      const u = seg ? Math.min(1, want / seg) : 0;
      return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, deg: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI };
    }
    want -= seg;
  }
  return { x: pts[0][0], y: pts[0][1], deg: 0 };
}

/** A smooth open path through way-points, for flows: { d, pts }. */
export function route(points, s = 0.3) {
  const part = { k: 'tube', c: spline(points, false, s) };
  return { d: pathOf(part), pts: flat(part, 8) };
}

/* ------------------------------------------------------------- structures */

/**
 * Build one structure of a view from its parts: path strings (made once), polylines for hit testing, a bounding
 * box, sample points inside it and a point for its label.
 *   → { id, parts: [{ k, pts, w, box, side }], fills: [{ tone, d }], tubes: [{ w, tone, d }], inks, box, samples: [[x, y, side]], at, atSide, sides }
 * A part's `tone` is the name of a theme colour ('surface', 'ink', 'red-soft' …) for a detail that should not take the
 * colour of its structure: the pupil of an eye, the blood inside a chamber of the heart.
 */
export function buildShape(def) {
  const parts = [];
  const fills = new Map();
  let inks = '';
  const tubes = new Map();
  const bb = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of def.parts) {
    const d = pathOf(p);
    if (p.k === 'ink') { inks += d; continue; }
    const pts = flat(p, p.k === 'fill' ? 5 : 6);
    const half = p.k === 'tube' ? p.w / 2 : 0;
    const pb = boxOf(pts);
    const own = [pb[0] - half, pb[1] - half, pb[2] + half, pb[3] + half];
    boxOf([[own[0], own[1]], [own[2], own[3]]], bb);
    parts.push({ k: p.k, pts, w: p.w || 0, box: own, side: p.side || null });
    const group = p.k === 'fill' ? fills : tubes;
    const key = p.k === 'fill' ? p.tone || '' : `${r1(p.w)}|${p.tone || ''}`;
    if (!group.has(key)) group.set(key, { w: p.w || 0, tone: p.tone || null, d: '' });
    group.get(key).d += d;
  }
  const sides = Array.from(new Set(parts.map((p) => p.side).filter(Boolean)));
  const shape = {
    id: def.id, parts, fills: Array.from(fills.values()), tubes: Array.from(tubes.values()), inks, box: bb,
    size: Math.max(bb[2] - bb[0], bb[3] - bb[1]), small: Math.min(bb[2] - bb[0], bb[3] - bb[1]),
    sides, line: parts.length > 0 && parts.every((p) => p.k !== 'fill'),
    opts: def,
  };
  // sample points and label points are worked out the first time they are asked for: most structures of a drawing
  // are never shown in a given figure
  let samples = null;
  let at = def.at ? def.at.slice(0, 2) : null;
  let atSide = null;
  Object.defineProperty(shape, 'samples', { enumerable: true, get() { return samples || (samples = samplePoints(parts)); } });
  Object.defineProperty(shape, 'at', { enumerable: true, get() { return at || (at = centreOf(shape, null)); } });
  Object.defineProperty(shape, 'atSide', {
    enumerable: true,
    get() {
      if (!atSide) { atSide = {}; for (const side of sides) atSide[side] = def.atSide && def.atSide[side] ? def.atSide[side] : centreOf(shape, side); }
      return atSide;
    },
  });
  return shape;
}

/** Points spread over the inside of a structure: [[x, y, side], …], about forty of them, and at least one in every part. */
function samplePoints(parts) {
  const out = [];
  let area = 0;
  let length = 0;
  for (const p of parts) {
    if (p.k === 'fill') area += (p.box[2] - p.box[0]) * (p.box[3] - p.box[1]);
    else length += lengthOf(p.pts);
  }
  const step = Math.max(2.5, Math.sqrt(area / 40));
  const stride = Math.max(5, length / 36);
  for (const p of parts) {
    if (p.k === 'fill') {
      const before = out.length;
      const w = p.box[2] - p.box[0];
      const h = p.box[3] - p.box[1];
      const nx = Math.max(1, Math.round(w / step));
      const ny = Math.max(1, Math.round(h / step));
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          const x = p.box[0] + ((i + 0.5) * w) / nx;
          const y = p.box[1] + ((j + 0.5) * h) / ny;
          if (inPolygon(p.pts, x, y)) out.push([x, y, p.side]);
        }
      }
      if (out.length === before) out.push([(p.box[0] + p.box[2]) / 2, (p.box[1] + p.box[3]) / 2, p.side]);
    } else {
      const n = Math.max(1, Math.min(24, Math.round(lengthOf(p.pts) / stride)));
      for (let i = 0; i <= n; i++) { const q = pointAlong(p.pts, i / n); out.push([q.x, q.y, p.side]); }
    }
  }
  return out;
}

/** A point well inside the structure (or one side of it): the sample point farthest from every edge. */
function centreOf(shape, side) {
  let best = null;
  let bestScore = -Infinity;
  const mine = shape.parts.filter((p) => !side || p.side === side);
  const pool = shape.samples.filter((q) => !side || q[2] === side);
  if (!pool.length || !mine.length) return [(shape.box[0] + shape.box[2]) / 2, (shape.box[1] + shape.box[3]) / 2];
  // the middle of the biggest part pulls a little, so that long shapes are labelled near their middle
  let big = mine[0];
  for (const p of mine) if ((p.box[2] - p.box[0]) * (p.box[3] - p.box[1]) > (big.box[2] - big.box[0]) * (big.box[3] - big.box[1])) big = p;
  const mx = (big.box[0] + big.box[2]) / 2;
  const my = (big.box[1] + big.box[3]) / 2;
  const span = Math.max(1, Math.hypot(big.box[2] - big.box[0], big.box[3] - big.box[1]));
  for (const q of pool) {
    let edge = 0;
    for (const p of mine) {
      if (p.k !== 'fill' || q[0] < p.box[0] || q[0] > p.box[2] || q[1] < p.box[1] || q[1] > p.box[3]) continue;
      if (inPolygon(p.pts, q[0], q[1])) edge = Math.max(edge, distToLine(p.pts, q[0], q[1], true));
    }
    const score = edge - (Math.hypot(q[0] - mx, q[1] - my) / span) * (big.k === 'fill' ? 6 : 60);
    if (score > bestScore) { bestScore = score; best = q; }
  }
  return [r1(best[0]), r1(best[1])];
}

/** Is (x, y) on the structure? `reach` widens it by that many units all round. */
export function onShape(shape, x, y, reach = 0) {
  const b = shape.box;
  if (x < b[0] - reach || x > b[2] + reach || y < b[1] - reach || y > b[3] + reach) return false;
  for (const p of shape.parts) {
    if (x < p.box[0] - reach || x > p.box[2] + reach || y < p.box[1] - reach || y > p.box[3] + reach) continue;
    if (distToPart(p, x, y) <= reach) return true;
  }
  return false;
}

/** Distance from (x, y) to the structure (0 on it), and the side of the part that is nearest. */
export function nearShape(shape, x, y) {
  let best = Infinity;
  let side = null;
  for (const p of shape.parts) {
    const d = distToPart(p, x, y);
    if (d < best) { best = d; side = p.side; }
  }
  return { d: best, side };
}
