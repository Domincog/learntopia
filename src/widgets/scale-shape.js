/**
 * scale-shape — enlarge a shape by a scale factor and watch what multiplies.
 *
 * Flat shapes are made of unit squares. In the enlarged copy every unit
 * square of the original becomes a k × k block, so lengths are multiplied by
 * k but the area by k². With shape: 'cube' the same idea is shown in 3-D:
 * a cube built from k × k × k unit cubes, so the volume is multiplied by k³.
 *
 * {
 *   type: 'scale-shape',
 *   shape: 'L',               // 'L' | 'T' | 'square' | 'rect' | 'cube'
 *   cols: 3, rows: 2,         // size of the rectangle when shape is 'rect'
 *   cells: [[0, 0], [1, 0]],  // or: your own shape, as a list of unit squares [column, row] (row 0 is the bottom)
 *   k: 1,                     // scale factor
 *   min: 1, max: 4, step: 1,  // range of the scale-factor slider
 *   slider: true,
 *   readouts: ['lengths', 'squares', 'area'],
 *       // flat shapes: 'lengths' (×k), 'width', 'height', 'perimeter', 'squares' (unit squares in the copy), 'area' (×k²)
 *       // cube:        'lengths' (×k), 'faces' (×k²), 'cubes' (unit cubes in the copy), 'volume' (×k³)
 * }
 *
 * State: { k, lengthFactor, areaFactor, volumeFactor, width, height, perimeter, area, cubes }
 *   width, height, perimeter, area — measurements of the enlarged flat shape (in units and unit squares);
 *                                    for the cube, width and height are its edge and the other two are null
 *   cubes — number of unit cubes in the enlarged cube (k³); for flat shapes it is null
 *
 * A solution only needs { k: 3 }.
 */
import { frame, sliderRow, readout, hue, s, clamp, tidy, snapTo, formatNumber } from './kit.js';

const W = 560;
const H = 380;
const PRESETS = {
  L: [[0, 0], [1, 0], [0, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  square: [[0, 0]],
};
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;

export default function create(spec, env) {
  const interactive = !env.compact;
  const solid = spec.shape === 'cube';
  const min = spec.min != null ? Number(spec.min) : 1;
  const max = Math.max(min, spec.max != null ? Number(spec.max) : 4);
  const step = spec.step || 1;
  let k = clamp(Number(spec.k) || min, min, max);
  let readOnly = !!env.readOnly;

  let cells = Array.isArray(spec.cells) && spec.cells.length ? spec.cells.map(([c, r]) => [Math.round(c), Math.round(r)]) : PRESETS[spec.shape] || null;
  if (!cells) {
    cells = [];
    const cols = Math.max(1, Math.round(spec.cols || 3));
    const rows = Math.max(1, Math.round(spec.rows || 2));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push([c, r]);
  }
  const has = new Set(cells.map(([c, r]) => `${c},${r}`));
  const cw = Math.max(...cells.map((p) => p[0])) + 1;
  const ch = Math.max(...cells.map((p) => p[1])) + 1;
  // outside edges of the shape, each as [c0, r0, c1, r1] in unit coordinates
  const edges = [];
  for (const [c, r] of cells) {
    if (!has.has(`${c},${r - 1}`)) edges.push([c, r, c + 1, r]);
    if (!has.has(`${c},${r + 1}`)) edges.push([c, r + 1, c + 1, r + 1]);
    if (!has.has(`${c - 1},${r}`)) edges.push([c, r, c, r + 1]);
    if (!has.has(`${c + 1},${r}`)) edges.push([c + 1, r, c + 1, r + 1]);
  }
  const bottomRun = cells.filter(([, r]) => r === 0).length;          // squares along the bottom row
  const leftRun = cells.filter(([c]) => c === 0).length;              // squares up the left-hand column

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A shape and an enlarged copy of it' });
  const { svg } = fr;
  const gFig = s('g');
  svg.appendChild(gFig);
  const add = (el) => { gFig.appendChild(el); return el; };
  const label = (x, y, str, attrs = {}) => add(s('text.fig-label', { x: x.toFixed(1), y: y.toFixed(1), 'text-anchor': 'middle', 'dominant-baseline': 'middle', ...attrs }, str));
  const small = (x, y, str, attrs = {}) => add(s('text.fig-label-sm', { x: x.toFixed(1), y: y.toFixed(1), 'text-anchor': 'middle', 'dominant-baseline': 'middle', ...attrs }, str));

  /* -------------------------------------------------------- flat shapes */
  const pad = { l: 34, r: 30, t: 22, b: 48 };
  const gap = 50;
  const u = Math.min((W - pad.l - pad.r - gap) / (cw * (1 + max)), (H - pad.t - pad.b) / (ch * max), 46);
  const base = H - pad.b;

  function drawFlat(x0, f, isCopy) {
    const size = f * u;
    for (const [c, r] of cells) {
      const first = c === cells[0][0] && r === cells[0][1];
      const color = first ? 'orange' : 'blue';
      const x = x0 + c * size;
      const y = base - (r + 1) * size;
      add(s('rect', { x, y, width: size, height: size, fill: hue(color, 'soft') }));
      // the unit squares inside this block
      let d = '';
      for (let i = 1; i * u < size - 0.5; i++) d += `M${(x + i * u).toFixed(1)} ${y.toFixed(1)}v${size.toFixed(1)}M${x.toFixed(1)} ${(y + size - i * u).toFixed(1)}h${size.toFixed(1)}`;
      if (d) add(s('path', { d, fill: 'none', stroke: hue(color), 'stroke-width': 1.2, 'stroke-opacity': 0.7 }));
      add(s('rect', { x, y, width: size, height: size, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-opacity': 0.55 }));
      if (isCopy && first && Number.isInteger(f) && f >= 2 && size >= 96) small(x + size / 2, y + size / 2, `${f} × ${f} = ${f * f}`, { style: `fill:${hue('orange', 'text')}` });
    }
    let outline = '';
    for (const [c0, r0, c1, r1] of edges) outline += `M${(x0 + c0 * size).toFixed(1)} ${(base - r0 * size).toFixed(1)}L${(x0 + c1 * size).toFixed(1)} ${(base - r1 * size).toFixed(1)}`;
    add(s('path', { d: outline, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    // length of the bottom edge and of the left-hand edge
    label(x0 + (bottomRun * size) / 2, base + 16, formatNumber(bottomRun * f, 2));
    label(x0 - 9, base - (leftRun * size) / 2, formatNumber(leftRun * f, 2), { 'text-anchor': 'end' });
  }

  /* --------------------------------------------------------------- cube */
  const e = Math.min((H - 30 - pad.b) / (2 * max), (W - 60 - gap) / (2 * COS * (1 + max)), 40);

  function drawCube(fx, f) {
    const P = (a, b, c) => [fx + (b - a) * e * COS, base - (a + b) * e * SIN - c * e]; // a: steps to the left, b: to the right, c: up
    const quad = (pts, fill, opacity) => add(s('polygon', { points: pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' '), fill, 'fill-opacity': opacity, stroke: 'var(--ink)', 'stroke-width': 1.2, 'stroke-opacity': 0.6, 'stroke-linejoin': 'round' }));
    const n = Math.ceil(f - 1e-9);
    const span = (i) => [Math.min(i, f), Math.min(i + 1, f)];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const [i0, i1] = span(i);
        const [j0, j1] = span(j);
        // is this little face part of the unit cube at the top front corner?
        const topCorner = i === 0 && j === 0;
        const sideCorner = i === 0 && j === n - 1;
        const tint = (corner) => hue(corner ? 'orange' : 'blue');
        quad([P(i0, 0, j0), P(i1, 0, j0), P(i1, 0, j1), P(i0, 0, j1)], tint(sideCorner), 0.42);     // left face
        quad([P(0, i0, j0), P(0, i1, j0), P(0, i1, j1), P(0, i0, j1)], tint(sideCorner), 0.68);     // right face
        quad([P(i0, j0, f), P(i1, j0, f), P(i1, j1, f), P(i0, j1, f)], tint(topCorner), 0.2);       // top face
      }
    }
    const path = (pts) => add(s('path', { d: `M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    path([P(0, 0, 0), P(f, 0, 0), P(f, 0, f), P(f, f, f), P(0, f, f), P(0, f, 0), P(0, 0, 0)]);
    path([P(0, 0, 0), P(0, 0, f), P(f, 0, f)]);
    path([P(0, 0, f), P(0, f, f)]);
    const mid = P(0, f / 2, 0);
    label(mid[0] + 9, mid[1] + 15, formatNumber(f, 2));
  }

  /* ----------------------------------------------------------- readouts */
  const perimeterUnits = edges.length;
  const AVAILABLE = solid ? {
    lengths: ['every edge', () => `×${formatNumber(k, 2)}`],
    faces: ['each face', () => `×${formatNumber(k * k, 2)}`],
    cubes: ['unit cubes', () => formatNumber(k * k * k, 2)],
    volume: ['volume', () => `×${formatNumber(k * k * k, 2)}`],
  } : {
    lengths: ['every length', () => `×${formatNumber(k, 2)}`],
    width: ['width', () => formatNumber(cw * k, 2)],
    height: ['height', () => formatNumber(ch * k, 2)],
    perimeter: ['perimeter', () => formatNumber(perimeterUnits * k, 2)],
    squares: ['unit squares', () => formatNumber(cells.length * k * k, 2)],
    area: ['area', () => `×${formatNumber(k * k, 2)}`],
  };
  const wanted = Array.isArray(spec.readouts) ? spec.readouts : (solid ? ['lengths', 'cubes', 'volume'] : ['lengths', 'squares', 'area']);
  const shown = wanted.filter((key) => AVAILABLE[key]).map((key) => {
    const ro = readout(AVAILABLE[key][0], { color: key === 'lengths' ? 'teal' : key === 'area' || key === 'volume' ? 'orange' : null });
    if (interactive) fr.readouts.appendChild(ro.el);
    return { ro, value: AVAILABLE[key][1] };
  });

  const slider = spec.slider !== false && interactive && max > min ? sliderRow({
    label: 'Scale factor', min, max, step, value: k, color: 'teal',
    format: (v) => `×${formatNumber(v, 2)}`,
    onInput: (v) => {
      if (readOnly) return;
      k = clamp(v, min, max);
      render();
      env.onChange(getState());
    },
  }) : null;
  if (slider) fr.controls.appendChild(slider.el);

  /* ------------------------------------------------------------- render */
  function render() {
    while (gFig.firstChild) gFig.removeChild(gFig.firstChild);
    if (solid) {
      const total = 2 * COS * e * (1 + max) + gap;
      const left = (W - total) / 2;
      const fx1 = left + COS * e;                         // front edge of the original
      const fx2 = left + 2 * COS * e + gap + COS * e * max;   // front edge of the copy (room for the largest size)
      drawCube(fx1, 1);
      drawCube(fx2, k);
      small(fx1, base + 30, 'original');
      small(fx2, base + 30, `scale factor ${formatNumber(k, 2)}`);
    } else {
      const total = cw * u * (1 + max) + gap;
      const left = Math.max(pad.l, (W - total) / 2);
      const x2 = left + cw * u + gap;
      drawFlat(left, 1, false);
      drawFlat(x2, k, true);
      small(left + (cw * u) / 2, base + 36, 'original');
      small(x2 + (cw * u * k) / 2, base + 36, `scale factor ${formatNumber(k, 2)}`);
    }
    for (const { ro, value } of shown) ro.set(value());
    svg.setAttribute('aria-label', solid
      ? `A unit cube and a copy enlarged by a scale factor of ${formatNumber(k, 2)}. Every edge is ${formatNumber(k, 2)} times as long and the copy is made of ${formatNumber(k * k * k, 2)} unit cubes.`
      : `A shape made of ${cells.length} unit squares and a copy enlarged by a scale factor of ${formatNumber(k, 2)}. Every length is ${formatNumber(k, 2)} times as long and the copy covers ${formatNumber(cells.length * k * k, 2)} unit squares.`);
  }

  function getState() {
    return {
      k: tidy(k, 3),
      lengthFactor: tidy(k, 3),
      areaFactor: tidy(k * k, 3),
      volumeFactor: tidy(k * k * k, 3),
      width: solid ? tidy(k, 3) : tidy(cw * k, 3),
      height: solid ? tidy(k, 3) : tidy(ch * k, 3),
      perimeter: solid ? null : tidy(perimeterUnits * k, 3),
      area: solid ? null : tidy(cells.length * k * k, 3),
      cubes: solid ? tidy(k * k * k, 3) : null,
    };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Number.isFinite(next.k)) return;
      k = clamp(snapTo(next.k, step), min, max);
      if (slider) slider.set(k);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'scale-shape — every unit square becomes a k × k block', spec: { type: 'scale-shape', shape: 'L', k: 2 } },
  { title: 'scale-shape — a cube: volume grows fastest', spec: { type: 'scale-shape', shape: 'cube', k: 3 } },
];
