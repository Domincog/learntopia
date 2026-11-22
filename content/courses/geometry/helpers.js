/**
 * Figure builders shared by the geometry lessons.
 *
 * Each function returns a widget spec (a static `geo` or `svg` figure), so a
 * generated problem can draw a diagram that matches its own numbers:
 *
 *   figure: raysFigure({ rays: [0, 50, 180], arcs: [{ between: [0, 1], label: '50°' }] })
 */

const D2R = Math.PI / 180;
const r3 = (v) => Math.round(v * 1000) / 1000;

/** Point at distance `len` from `o` in direction `deg` (anticlockwise from "east"). */
export const pol = (o, len, deg) => ({ x: r3(o.x + len * Math.cos(deg * D2R)), y: r3(o.y + len * Math.sin(deg * D2R)) });

/** An angle in TeX: deg(40) -> "40^\circ" (for use inside $…$). */
export const deg = (v) => `${v}^\\circ`;

/**
 * A `constrain` function for a draggable geo point: keeps it on the circle of
 * radius `radius` around `o`, between the directions `lo` and `hi` (degrees),
 * snapped to multiples of `step` degrees so that angles read as whole numbers.
 */
export function onArc(o, radius, lo = 10, hi = 170, step = 5) {
  return (p) => {
    let a = Math.atan2(p.y - o.y, p.x - o.x) / D2R;
    if (a < -90) a = 180; // dragged below the line on the left-hand side
    a = Math.min(hi, Math.max(lo, Math.round(a / step) * step));
    return pol(o, radius, a);
  };
}

/**
 * Rays from one point, with labelled angle arcs between pairs of rays.
 *
 *   rays: [0, 50, 180]                       directions in degrees (or { deg, len, color })
 *   arcs: [{ between: [0, 1], label: '50°', color: 'orange' }]
 */
export function raysFigure({ rays, arcs = [], origin = [5, 1.1], len = 3.9, x = [0, 10], y = [0, 4.6], height = 250, alt }) {
  const O = { x: origin[0], y: origin[1] };
  const points = { O: { x: O.x, y: O.y, label: false, r: 4 } };
  const shapes = [];
  rays.forEach((ray, i) => {
    const d = typeof ray === 'number' ? { deg: ray } : ray;
    points[`R${i}`] = { ...pol(O, d.len || len, d.deg), hidden: true };
    shapes.push({ kind: 'segment', pts: ['O', `R${i}`], color: d.color });
  });
  for (const arc of arcs) {
    shapes.push({ kind: 'angle', pts: [`R${arc.between[0]}`, 'O', `R${arc.between[1]}`], label: arc.label, color: arc.color || 'orange', r: arc.r || 34 });
  }
  return { type: 'geo', x, y, height, points, shapes, alt };
}

/**
 * Two straight lines crossing. `a` is the angle between "east" and the second
 * line; `labels` are the four angles, anticlockwise starting from that one
 * (so labels[0] and labels[2] are vertically opposite). Use null to leave an
 * angle unmarked.
 */
export function crossFigure({ a = 40, labels = [], colors = ['orange', 'green', 'orange', 'green'], radii = [], height = 280, alt }) {
  // keep the slanted line inside the frame however steep it is
  const slant = Math.min(3.4, 2.15 / Math.abs(Math.sin(a * D2R)));
  const rays = [0, { deg: a, len: slant }, 180, { deg: 180 + a, len: slant }];
  const arcs = [];
  labels.forEach((label, i) => {
    if (label == null) return;
    arcs.push({ between: [i, (i + 1) % 4], label, color: colors[i], r: radii[i] });
  });
  return raysFigure({ rays, arcs, origin: [5, 2.6], len: 3.4, x: [1.2, 8.8], y: [0.3, 4.9], height, alt });
}

const CORNERS = {
  UR: ['right', 'up'],
  UL: ['up', 'left'],
  LL: ['left', 'down'],
  LR: ['down', 'right'],
};

/**
 * Two parallel horizontal lines cut by a transversal that makes angle `a`
 * with them. `marks` label angles at the two crossings:
 *
 *   marks: [{ at: 'bottom', pos: 'UR', label: '65°' }, { at: 'top', pos: 'LL', label: '?', color: 'green' }]
 *
 * pos is the corner of the crossing: UR (upper right), UL, LL, LR.
 */
export function parallelsFigure({ a = 60, marks = [], height = 300, alt }) {
  const yLow = 1.6;
  const yTop = 4.4;
  const run = (yTop - yLow) / Math.tan(a * D2R);
  const X = { x: r3(5 - run / 2), y: yLow };
  const D = { x: r3(5 + run / 2), y: yTop };
  const points = {
    X: { ...X, hidden: true },
    D: { ...D, hidden: true },
    Xleft: { x: 0.5, y: yLow, hidden: true }, Xright: { x: 9.5, y: yLow, hidden: true },
    Dleft: { x: 0.5, y: yTop, hidden: true }, Dright: { x: 9.5, y: yTop, hidden: true },
    Tdown: { ...pol(X, 1.25, a + 180), hidden: true },
    Tup: { ...pol(D, 1.25, a), hidden: true },
  };
  const shapes = [
    { kind: 'segment', pts: ['Xleft', 'Xright'], color: 'blue' },
    { kind: 'segment', pts: ['Dleft', 'Dright'], color: 'blue' },
    { kind: 'segment', pts: ['Tdown', 'Tup'] },
  ];
  for (const m of marks) {
    const v = m.at === 'top' ? 'D' : 'X';
    const ends = {
      right: `${v}right`, left: `${v}left`,
      up: v === 'D' ? 'Tup' : 'D',
      down: v === 'D' ? 'X' : 'Tdown',
    };
    const [p, q] = CORNERS[m.pos];
    shapes.push({ kind: 'angle', pts: [ends[p], v, ends[q]], label: m.label, color: m.color || 'orange', r: m.r || 30 });
  }
  return { type: 'geo', x: [0, 10], y: [0, 6], height, points, shapes, alt };
}

/**
 * A triangle drawn from its angles (degrees, A at bottom left, B at bottom
 * right, C on top).
 *
 *   labels:  ['52°', '71°', '?']   text for the angle at A, B, C ('right' draws a right-angle mark, null draws nothing)
 *   sides:   ['5 cm', null, null]  text along AB, BC, CA
 *   letters: true                  show the vertex names
 *   extend:  1.6                   continue side BC past C by this many units, to a point D
 *   outside: '?'                   label for the outside angle at C between CA and CD (needs `extend`)
 */
export function triangleFigure({
  angles, labels = [], sides = [], colors = ['orange', 'green', 'violet'], letters = false,
  extend = 0, outside = null, height = 270, alt,
}) {
  const [a, b] = angles;
  const c = 180 - a - b;
  // unit base, then fit to the canvas
  const ac = Math.sin(b * D2R) / Math.sin(c * D2R);
  const raw = { A: { x: 0, y: 0 }, B: { x: 1, y: 0 }, C: { x: ac * Math.cos(a * D2R), y: ac * Math.sin(a * D2R) } };
  const boxW = 7.6;
  const boxH = 3.9;
  const fit = (pts) => {
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const k = Math.min(boxW / (Math.max(...xs) - Math.min(...xs)), boxH / (Math.max(...ys) - Math.min(...ys)));
    return { k, ox: 5 - (k * (Math.max(...xs) + Math.min(...xs))) / 2, oy: 2.75 - (k * (Math.max(...ys) + Math.min(...ys))) / 2 };
  };
  let frame = fit(Object.values(raw));
  if (extend) {
    // leave room for the extension of BC beyond C (its length is given in canvas units)
    const len = Math.hypot(raw.C.x - 1, raw.C.y) || 1;
    const far = (extend * 1.15) / frame.k;
    frame = fit([...Object.values(raw), { x: raw.C.x + ((raw.C.x - 1) / len) * far, y: raw.C.y + (raw.C.y / len) * far }]);
  }
  const { k, ox, oy } = frame;
  const at = (p) => ({ x: r3(ox + p.x * k), y: r3(oy + p.y * k) });
  const vertex = (id) => (letters ? { ...at(raw[id]), r: 3 } : { ...at(raw[id]), label: false, r: 0.1 });
  const points = { A: vertex('A'), B: vertex('B'), C: vertex('C') };
  const shapes = [{ kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' }];
  if (extend) {
    const C = at(raw.C);
    const B = at(raw.B);
    const len = Math.hypot(C.x - B.x, C.y - B.y) || 1;
    points.D = { x: r3(C.x + ((C.x - B.x) / len) * extend), y: r3(C.y + ((C.y - B.y) / len) * extend), ...(letters ? { r: 3 } : { label: false, r: 0.1 }) };
    shapes.push({ kind: 'segment', pts: ['C', 'D'], color: 'blue', dashed: true });
    if (outside != null) shapes.push({ kind: 'angle', pts: ['A', 'C', 'D'], label: outside, color: 'pink', r: 30 });
  }
  const corner = [['B', 'A', 'C'], ['A', 'B', 'C'], ['A', 'C', 'B']];
  labels.forEach((label, i) => {
    if (label == null) return;
    if (label === 'right') shapes.push({ kind: 'right', pts: corner[i] });
    else shapes.push({ kind: 'angle', pts: corner[i], label, color: colors[i], r: 30 });
  });
  const edge = [['A', 'B'], ['B', 'C'], ['C', 'A']];
  sides.forEach((label, i) => {
    if (label == null) return;
    // geo centres the text on a point `offset` px from the side: long labels need pushing out further
    shapes.push({ kind: 'segment', pts: edge[i], color: 'blue', label, offset: i === 0 ? 17 : 15 + 5.5 * String(label).length });
  });
  return { type: 'geo', x: [0, 10], y: [0, 5.5], height, points, shapes, alt };
}

/**
 * Shapes drawn on a grid of unit squares (a static picture).
 *
 *   gridFigure({ cols: 18, rows: 6, shapes: [{ pts: [[1, 1], [7, 1], [7, 5], [1, 5]], color: 'blue' }],
 *                labels: [{ at: [4, 3], text: 'A', size: 'lg' }] })
 *
 * Coordinates are in squares, measured from the bottom-left corner of the grid.
 */
export function gridFigure({ cols, rows, cell = 30, shapes = [], labels = [], maxWidth, alt }) {
  const w = cols * cell;
  const h = rows * cell;
  const px = ([x, y]) => `${r3(x * cell)},${r3((rows - y) * cell)}`;
  let lines = '';
  for (let i = 0; i <= cols; i++) lines += `M${i * cell} 0V${h}`;
  for (let j = 0; j <= rows; j++) lines += `M0 ${j * cell}H${w}`;
  let content = `<path class="stroke-hair fill-none" stroke-width="1.5" d="${lines}"/>`;
  for (const sh of shapes) {
    const color = sh.color || 'blue';
    content += `<polygon class="fill-${color}-soft stroke-${color}" fill-opacity="0.82" stroke-width="3" stroke-linejoin="round" points="${sh.pts.map(px).join(' ')}"${sh.dashed ? ' stroke-dasharray="7 6"' : ''}/>`;
  }
  for (const lb of labels) {
    const cls = `fig-label${lb.size ? `-${lb.size}` : ''}`;
    const fill = lb.color ? ` style="fill:var(--${lb.color}-text)"` : '';
    content += `<text class="${cls}"${fill} x="${r3(lb.at[0] * cell)}" y="${r3((rows - lb.at[1]) * cell)}" text-anchor="middle" dominant-baseline="middle">${lb.text}</text>`;
  }
  return { type: 'svg', viewBox: `-2 -2 ${w + 4} ${h + 4}`, maxWidth: maxWidth || Math.min(560, w + 4), alt, content };
}

/**
 * A right-angled triangle with labelled sides. `a` is the horizontal leg and
 * `b` the vertical one (only their proportions matter for the drawing).
 *
 *   labels: ['3 cm', '4 cm', '?']   text along the horizontal leg, the vertical leg and the hypotenuse (null: none)
 *   flip: true                      put the right angle at the bottom right instead of the bottom left
 */
export function rightTriangleFigure({ a, b, labels = [], flip = false, height = 260, alt }) {
  // never draw it thinner than about 1 : 3.5, or the labels collide
  const ratio = Math.min(3.5, Math.max(1 / 3.5, a / b));
  const k = Math.min(6.6 / ratio, 3.7);
  const w = ratio * k;
  const h = k;
  const x0 = 5 - w / 2;
  const y0 = 2.75 - h / 2;
  const corner = { x: r3(flip ? x0 + w : x0), y: r3(y0) };
  const points = {
    C: { ...corner, label: false, r: 0.1 },
    A: { x: r3(flip ? x0 : x0 + w), y: r3(y0), label: false, r: 0.1 },
    B: { x: corner.x, y: r3(y0 + h), label: false, r: 0.1 },
  };
  const shapes = [{ kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' }, { kind: 'right', pts: ['A', 'C', 'B'] }];
  [['C', 'A'], ['B', 'C'], ['A', 'B']].forEach((pts, i) => {
    if (labels[i] == null) return;
    // geo centres the text on a point `offset` px from the side: beside a vertical side, long labels need more room
    const len = String(labels[i]).length;
    shapes.push({ kind: 'segment', pts, color: 'blue', label: labels[i], offset: i === 0 ? 17 : i === 1 ? 15 + 5.5 * len : 14 + 4 * len });
  });
  return { type: 'geo', x: [0, 10], y: [0, 5.5], height, points, shapes, alt };
}

/**
 * A circle with its diameter or radius drawn in and labelled (a static picture).
 *
 *   circleFigure({ show: 'diameter', label: '70 cm' })     show: 'diameter' | 'radius'
 */
export function circleFigure({ show = 'diameter', label = '', alt }) {
  const cx = 180;
  const cy = 92;
  const rad = 76;
  const line = show === 'radius'
    ? `<path class="stroke-teal fill-none" stroke-width="4" stroke-linecap="round" d="M${cx} ${cy} H${cx + rad}"/>`
    : `<path class="stroke-teal fill-none" stroke-width="4" stroke-linecap="round" d="M${cx - rad} ${cy} H${cx + rad}"/>`;
  const lx = show === 'radius' ? cx + rad / 2 : cx;
  return {
    type: 'svg', viewBox: '0 0 360 184', maxWidth: 340, alt,
    content:
      `<circle class="fill-blue-soft stroke-ink" stroke-width="3" cx="${cx}" cy="${cy}" r="${rad}"/>` +
      line +
      `<circle class="fill-ink" cx="${cx}" cy="${cy}" r="4.5"/>` +
      `<text class="fig-label" x="${lx}" y="${cy - 13}" text-anchor="middle">${label}</text>`,
  };
}
