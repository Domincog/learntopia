/**
 * area-cut — find an area by cutting and rearranging, on a grid of unit squares.
 *
 *   parallelogram  a triangle is cut off one end and slid to the other: a rectangle
 *   triangle       a copy makes half a turn about the midpoint of a side: a parallelogram
 *   trapezium      the same trick: two copies make a parallelogram (alias: 'trapezoid')
 *
 * {
 *   type: 'area-cut',
 *   shape: 'parallelogram',     // 'parallelogram' | 'triangle' | 'trapezium'
 *   base: 6, height: 4,         // in grid squares
 *   lean: 2,                    // how far the top is pushed to the right of the bottom-left corner
 *   top: 3,                     // trapezium only: length of the top side
 *   t: 0,                       // 0 = the original shape … 1 = the piece (or copy) has fully moved
 *   slider: true,               // show the slider that moves the piece
 *   leanSlider: false,          // show a slider that changes `lean` from 0 to `maxLean`
 *   maxLean: 4, leanStep: 0.5,
 *   cut: true,                  // parallelogram: show the cut-off triangle as a separate piece
 *   grid: true,                 // draw the unit squares
 *   unit: 'cm',                 // optional unit for the default labels and the readouts
 *   labels: { base: '6 cm', height: '4 cm', side: '5 cm', top: '3 cm' },
 *                               // text of the measurements; defaults are the numbers for base, height (and top),
 *                               // nothing for the slanted side; false hides one
 *   readouts: ['base', 'height', 'area'],   // any of: base, height, side, perimeter, area (default: none)
 *   height_px: 300,             // canvas height (default depends on the shape)
 * }
 *
 * State: { shape, base, height, lean, top, t, done, area, perimeter, side }
 *   done      — true when the piece has arrived (t = 1)
 *   area      — area of the original shape
 *   side      — length of the slanted left side
 *
 * A solution only needs the essentials: { t: 1 } or { lean: 3 }.
 *
 * The travelling piece can be moved with the slider, by dragging the orange
 * dot on it, or from the keyboard (focus the dot, then use the arrow keys).
 */
import { frame, handle, sliderRow, readout, hue, s, clamp, tidy, formatNumber } from './kit.js';

const W = 560;
const KINDS = { parallelogram: 'parallelogram', triangle: 'triangle', trapezium: 'trapezium', trapezoid: 'trapezium' };
let seq = 0; // unique ids for clip paths

function outline(kind, b, h, lean, top) {
  if (kind === 'triangle') return [[0, 0], [b, 0], [lean, h]];
  if (kind === 'trapezium') return [[0, 0], [b, 0], [lean + top, h], [lean, h]];
  return [[0, 0], [b, 0], [b + lean, h], [lean, h]];
}

/** Rotate (x, y) clockwise about (cx, cy) by `turn` × 180° (turn = 1 is half a turn). */
function swing([x, y], [cx, cy], turn) {
  const a = -Math.PI * turn;
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
}

export default function create(spec, env) {
  const kind = KINDS[spec.shape] || 'parallelogram';
  const b = Number(spec.base) > 0 ? Number(spec.base) : 6;
  const h = Number(spec.height) > 0 ? Number(spec.height) : 4;
  const top = kind === 'trapezium' ? (Number(spec.top) > 0 ? Number(spec.top) : Math.max(1, b - 3)) : 0;
  const leanLimit = kind === 'parallelogram' ? b : Infinity;
  const maxLean = spec.leanSlider ? clamp(spec.maxLean != null ? Number(spec.maxLean) : 4, 0, leanLimit) : null;
  const interactive = !env.compact;
  const showSlider = spec.slider !== false && interactive;
  const showLean = !!spec.leanSlider && interactive;
  const cut = kind === 'parallelogram' && spec.cut !== false;
  const unit = spec.unit ? String(spec.unit) : '';
  const labelSpec = spec.labels === false ? { base: false, height: false, top: false } : (spec.labels || {});
  const withUnit = (v) => formatNumber(v, 2) + (unit ? ` ${unit}` : '');

  let lean = clamp(Number(spec.lean) || 0, 0, maxLean != null ? maxLean : leanLimit);
  let t = clamp(Number(spec.t) || 0, 0, 1);
  let readOnly = !!env.readOnly;
  let wasDone = false;

  /* -------------------------------------------------------- fit to canvas */
  const pivotOf = (ln) => {
    const o = outline(kind, b, h, ln, top);
    return [(o[1][0] + o[2][0]) / 2, (o[1][1] + o[2][1]) / 2];
  };
  const box = { x0: 0, x1: 0, y0: 0, y1: h };
  for (const ln of (maxLean != null ? [0, maxLean] : [lean])) {
    const o = outline(kind, b, h, ln, top);
    const pts = o.slice();
    if (kind !== 'parallelogram') {
      for (let k = 0; k <= 24; k++) for (const p of o) pts.push(swing(p, pivotOf(ln), k / 24));
    }
    for (const [x, y] of pts) {
      box.x0 = Math.min(box.x0, x); box.x1 = Math.max(box.x1, x);
      box.y0 = Math.min(box.y0, y); box.y1 = Math.max(box.y1, y);
    }
  }
  const pad = { l: 26, r: 26, t: 24, b: 34 };
  const H = spec.height_px || (kind === 'parallelogram' ? 290 : 340);
  const U = Math.min((W - pad.l - pad.r) / (box.x1 - box.x0), (H - pad.t - pad.b) / (box.y1 - box.y0), 48);
  const originX = (W - U * (box.x1 - box.x0)) / 2 - U * box.x0;
  const originY = pad.t + (H - pad.t - pad.b + U * (box.y1 - box.y0)) / 2 + U * box.y0;
  const X = (x) => originX + x * U;
  const Y = (y) => originY - y * U;
  const pts = (list) => list.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ');

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || `A ${kind} on a grid` });
  const { svg } = fr;

  /* ------------------------------------------------------------ drawing */
  if (spec.grid !== false) {
    const g = s('g');
    for (let i = Math.floor(-originX / U); X(i) <= W; i++) g.appendChild(s('line.grid-line', { x1: X(i), x2: X(i), y1: 0, y2: H }));
    for (let j = Math.floor((originY - H) / U); Y(j) >= 0; j++) g.appendChild(s('line.grid-line', { y1: Y(j), y2: Y(j), x1: 0, x2: W }));
    svg.appendChild(g);
  }
  const gPieces = s('g');
  const gMarks = s('g');
  svg.append(gPieces, gMarks);

  let moving = null; // { g, pivot } — the piece that travels
  let ghost = null;  // dashed outline of where the cut-off triangle came from

  function piece(list, color) {
    const id = `area-cut-clip-${++seq}`;
    const g = s('g');
    g.appendChild(s('polygon', { points: pts(list), fill: hue(color, 'soft'), stroke: 'none' }));
    if (spec.grid !== false) {
      const xs = list.map((p) => p[0]);
      const ys = list.map((p) => p[1]);
      let d = '';
      for (let i = Math.ceil(Math.min(...xs)); i <= Math.floor(Math.max(...xs)); i++) d += `M${X(i).toFixed(1)} ${Y(Math.min(...ys)).toFixed(1)}V${Y(Math.max(...ys)).toFixed(1)}`;
      for (let j = Math.ceil(Math.min(...ys)); j <= Math.floor(Math.max(...ys)); j++) d += `M${X(Math.min(...xs)).toFixed(1)} ${Y(j).toFixed(1)}H${X(Math.max(...xs)).toFixed(1)}`;
      g.appendChild(s('clipPath', { id }, s('polygon', { points: pts(list) })));
      g.appendChild(s('path', { d, fill: 'none', stroke: hue(color), 'stroke-opacity': 0.55, 'stroke-width': 1.2, 'clip-path': `url(#${id})` }));
    }
    g.appendChild(s('polygon', { points: pts(list), fill: 'none', stroke: hue(color), 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    return g;
  }

  function build() {
    while (gPieces.firstChild) gPieces.removeChild(gPieces.firstChild);
    moving = null;
    ghost = null;
    const o = outline(kind, b, h, lean, top);
    if (kind === 'parallelogram') {
      if (cut && lean > 0) {
        const corner = [[0, 0], [lean, 0], [lean, h]];
        ghost = s('polygon', { points: pts(corner), fill: 'none', stroke: hue('orange'), 'stroke-width': 2, 'stroke-dasharray': '5 6', 'stroke-linejoin': 'round' });
        gPieces.append(ghost, piece([[lean, 0], [b, 0], [b + lean, h], [lean, h]], 'blue'));
        moving = { g: piece(corner, 'orange') };
        gPieces.appendChild(moving.g);
      } else {
        gPieces.appendChild(piece(o, 'blue'));
      }
    } else {
      // the copy starts hidden underneath the original and swings out
      moving = { g: piece(o, 'orange'), pivot: pivotOf(lean) };
      gPieces.append(moving.g, piece(o, 'blue'));
    }
  }

  /* measurement marks: rebuilt on every change (they are few) */
  const text = (x, y, str, attrs = {}) => s('text.fig-label', { x: x.toFixed(1), y: y.toFixed(1), 'text-anchor': 'middle', 'dominant-baseline': 'middle', ...attrs }, str);
  const labelText = (key, fallback) => (labelSpec[key] === false ? null : labelSpec[key] != null ? String(labelSpec[key]) : fallback);

  function marks() {
    while (gMarks.firstChild) gMarks.removeChild(gMarks.firstChild);
    if (spec.labels === false && !cut) return;
    const baseLabel = labelText('base', withUnit(b));
    const heightLabel = labelText('height', withUnit(h));
    const topLabel = kind === 'trapezium' ? labelText('top', withUnit(top)) : null;
    const sideLabel = labelSpec.side ? String(labelSpec.side) : null;
    const arrive = clamp((t - 0.85) / 0.15, 0, 1);

    // the height: a dashed line straight up from the base, with a right-angle mark
    const hx = lean;
    if (heightLabel || (cut && lean > 0)) {
      gMarks.appendChild(s('line', { x1: X(hx), x2: X(hx), y1: Y(0), y2: Y(h), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' }));
      const q = clamp(U * 0.3, 8, 11);
      const dir = kind === 'triangle' && lean > b / 2 ? -1 : 1;
      gMarks.appendChild(s('path', { d: `M${X(hx) + dir * q} ${Y(0)} v${-q} h${-dir * q}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2 }));
      if (heightLabel) {
        // beside the dashed line if the shape is wide enough there, otherwise outside the shape
        const need = 16 + 9 * heightLabel.length;
        const room = kind === 'triangle' ? (dir > 0 ? (b - lean) / 2 : lean / 2) * U : Infinity;
        if (room >= need) gMarks.appendChild(text(X(hx) + dir * 12, Y(h / 2), heightLabel, { 'text-anchor': dir > 0 ? 'start' : 'end' }));
        else gMarks.appendChild(text(dir > 0 ? X((b + lean) / 2) + 12 : X(lean / 2) - 12, Y(h / 2), heightLabel, { 'text-anchor': dir > 0 ? 'start' : 'end' }));
      }
    }
    if (baseLabel) {
      const shift = kind === 'parallelogram' && cut ? lean * t : 0;
      gMarks.appendChild(text(X(b / 2 + shift), Y(0) + 19, baseLabel));
    }
    if (topLabel) gMarks.appendChild(text(X(lean + top / 2), Y(h) - 15, topLabel));
    if (sideLabel && t < 0.5) {
      const fade = 1 - clamp(t * 4, 0, 1);
      gMarks.appendChild(text(X(lean / 2) - 12, Y(h / 2), sideLabel, { 'text-anchor': 'end', opacity: fade }));
    }
    if (kind === 'trapezium' && arrive > 0) {
      // the copy's top side lands on the base line, and its base on the top line
      if (topLabel) gMarks.appendChild(text(X(b + top / 2), Y(0) + 19, topLabel, { opacity: arrive, style: `fill:${hue('orange', 'text')}` }));
      if (baseLabel) gMarks.appendChild(text(X(lean + top + b / 2), Y(h) - 15, baseLabel, { opacity: arrive, style: `fill:${hue('orange', 'text')}` }));
    }
  }

  /* ----------------------------------------------------------- controls */
  const side = () => Math.hypot(lean, h);
  const perimeter = () => {
    if (kind === 'triangle') return b + side() + Math.hypot(b - lean, h);
    if (kind === 'trapezium') return b + top + side() + Math.hypot(b - lean - top, h);
    return 2 * (b + side());
  };
  const area = kind === 'parallelogram' ? b * h : kind === 'triangle' ? (b * h) / 2 : ((b + top) * h) / 2;
  const READOUTS = {
    base: ['base', () => b, unit],
    height: ['height', () => h, unit],
    side: ['slanted side', side, unit],
    perimeter: ['perimeter', perimeter, unit],
    area: ['area', () => area, unit ? `${unit}²` : 'squares'],
  };
  const shown = (Array.isArray(spec.readouts) ? spec.readouts : []).filter((key) => READOUTS[key]).map((key) => {
    const [label, value, u] = READOUTS[key];
    const ro = readout(label, { digits: 2, unit: u });
    if (interactive) fr.readouts.appendChild(ro.el);
    return { ro, value };
  });

  const moveSlider = showSlider ? sliderRow({
    label: kind === 'parallelogram' ? 'Slide the piece' : 'Turn the copy',
    min: 0, max: 1, step: 0.01, value: t, color: 'orange',
    format: (v) => (v >= 0.995 ? 'done' : `${Math.round(v * 100)}%`),
    onInput: (v) => {
      if (readOnly) return;
      t = clamp(v, 0, 1);
      place();
      env.onChange(getState());
    },
  }) : null;

  /* the same move by direct manipulation: a grip on the travelling piece */
  // where the grip sits on the piece before it moves (maths coordinates)
  const gripHome = () => {
    if (kind === 'parallelogram') return [(2 * lean) / 3, h / 3];
    const o = outline(kind, b, h, lean, top);
    return [o.reduce((sum, p) => sum + p[0], 0) / o.length, o.reduce((sum, p) => sum + p[1], 0) / o.length];
  };
  const moveTo = (v) => {
    let next = clamp(v, 0, 1);
    if (next > 0.97) next = 1;
    if (next < 0.03) next = 0;
    if (moveSlider) moveSlider.set(next);
    if (next === t) { place(); return; }
    t = next;
    place();
    env.onChange(getState());
  };
  const grip = showSlider ? handle(svg, {
    color: 'orange', r: 9, keyStep: 1,
    label: kind === 'parallelogram' ? 'The cut-off triangle. Drag it, or use the arrow keys.' : 'The copy. Drag it round, or use the arrow keys.',
    onMove: (hx, hy, ev) => {
      if (readOnly || !moving) return;
      if (ev && ev.type === 'keydown') { // arrow keys: a twentieth of the way per press
        const dir = ev.key === 'ArrowRight' || ev.key === 'ArrowUp' ? 1 : -1;
        moveTo(Math.round((t + dir * 0.05 * (ev.shiftKey ? 2 : 1)) * 100) / 100);
        return;
      }
      const [gx, gy] = gripHome();
      if (kind === 'parallelogram') { moveTo((hx - X(gx)) / (b * U)); return; }
      // swinging: the clockwise angle (on screen) from the grip's starting direction, seen from the pivot
      const px = X(moving.pivot[0]);
      const py = Y(moving.pivot[1]);
      const v0 = { x: X(gx) - px, y: Y(gy) - py };
      const v = { x: hx - px, y: hy - py };
      let angle = Math.atan2(v0.x * v.y - v0.y * v.x, v0.x * v.x + v0.y * v.y);
      if (angle < 0) angle = t > 0.5 ? angle + 2 * Math.PI : 0; // past half a turn, or behind the start
      moveTo(angle / Math.PI);
    },
  }) : null;
  if (grip) svg.appendChild(grip.el);
  const leanSlider = showLean ? sliderRow({
    label: 'Lean', min: 0, max: maxLean, step: spec.leanStep || 0.5, value: lean, color: 'blue',
    onInput: (v) => {
      if (readOnly) return;
      lean = clamp(v, 0, maxLean);
      build();
      place();
      env.onChange(getState());
    },
  }) : null;
  if (leanSlider) fr.controls.appendChild(leanSlider.el);
  if (moveSlider) fr.controls.appendChild(moveSlider.el);

  /* -------------------------------------------------------------- place */
  function place() {
    if (moving) {
      if (kind === 'parallelogram') moving.g.setAttribute('transform', `translate(${(b * t * U).toFixed(2)} 0)`);
      else moving.g.setAttribute('transform', `rotate(${(180 * t).toFixed(2)} ${X(moving.pivot[0]).toFixed(1)} ${Y(moving.pivot[1]).toFixed(1)})`);
    }
    if (ghost) ghost.setAttribute('opacity', clamp(t * 6, 0, 1));
    if (grip) {
      grip.el.style.display = moving ? '' : 'none';
      if (moving) {
        const home = gripHome();
        const [gx, gy] = kind === 'parallelogram' ? [home[0] + b * t, home[1]] : swing(home, moving.pivot, t);
        grip.set(X(gx), Y(gy));
        grip.setLabel(t >= 0.995 ? 'in place' : `${Math.round(t * 100)} percent of the way`);
      }
    }
    marks();
    for (const { ro, value } of shown) ro.set(value());
    const done = t >= 0.995;
    const result = kind === 'parallelogram' ? `a rectangle ${formatNumber(b, 2)} wide and ${formatNumber(h, 2)} tall` : `a parallelogram with base ${formatNumber(kind === 'trapezium' ? b + top : b, 2)} and height ${formatNumber(h, 2)}`;
    const what = kind === 'parallelogram'
      ? `A parallelogram with base ${formatNumber(b, 2)} and height ${formatNumber(h, 2)}, leaning ${formatNumber(lean, 2)} to the right.`
      : kind === 'triangle' ? `A triangle with base ${formatNumber(b, 2)} and height ${formatNumber(h, 2)}.`
        : `A trapezium with parallel sides ${formatNumber(b, 2)} and ${formatNumber(top, 2)}, and height ${formatNumber(h, 2)}.`;
    svg.setAttribute('aria-label', `${what}${done && moving ? ` Rearranged, it makes ${result}.` : ''}`);
    if (done && !wasDone && moving) env.announce(`The pieces now make ${result}.`);
    wasDone = done;
  }

  function getState() {
    return {
      shape: kind, base: b, height: h, lean: tidy(lean, 3), top,
      t: tidy(t, 3), done: t >= 0.995,
      area, perimeter: tidy(perimeter(), 3), side: tidy(side(), 3),
    };
  }

  build();
  place();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.lean === 'number' && maxLean != null) { lean = clamp(next.lean, 0, maxLean); if (leanSlider) leanSlider.set(lean); build(); }
      if (typeof next.t === 'number') t = clamp(next.t, 0, 1);
      else if (next.done === true) t = 1;
      if (moveSlider) moveSlider.set(t);
      place();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (moveSlider) moveSlider.setDisabled(readOnly);
      if (leanSlider) leanSlider.setDisabled(readOnly);
      if (grip) grip.setEnabled(!readOnly);
    },
    destroy() { if (grip) grip.destroy(); },
  };
}

export const examples = [
  { title: 'area-cut — slide the cut-off triangle: a parallelogram becomes a rectangle', spec: { type: 'area-cut', shape: 'parallelogram', base: 6, height: 4, lean: 2, readouts: ['base', 'height', 'area'] } },
  { title: 'area-cut — two copies of a triangle make a parallelogram', spec: { type: 'area-cut', shape: 'triangle', base: 6, height: 4, lean: 2 } },
  { title: 'area-cut — lean a parallelogram: longer sides, same area', spec: { type: 'area-cut', shape: 'parallelogram', base: 5, height: 4, lean: 1, cut: false, slider: false, leanSlider: true, maxLean: 5, readouts: ['perimeter', 'area'] } },
  { title: 'area-cut — two copies of a trapezium', spec: { type: 'area-cut', shape: 'trapezium', base: 7, top: 3, height: 4, lean: 2 } },
];
