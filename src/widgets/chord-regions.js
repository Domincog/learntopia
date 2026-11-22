/**
 * chord-regions — points on a circle, every pair joined by a straight chord,
 * and the regions the chords cut the circle into. The learner counts the
 * regions by tapping them (each one is numbered as it is counted), which is
 * how the famous pattern 1, 2, 4, 8, 16 … is seen to break at 31.
 *
 * {
 *   type: 'chord-regions',
 *   n: 4,                 // number of points, 1 to 7
 *   nRange: [1, 5],       // optional: adds a slider so the learner can change the number of points
 *   count: 'tap',         // 'tap'  the learner taps each region to count it (default)
 *                         // 'auto' the number of regions is shown, nothing to tap
 *                         // 'none' picture only, no number
 *   regular: false,       // true: evenly spaced points. With six of them three chords meet
 *                         // in the centre and one region is lost (30 instead of 31).
 *   static: false,        // true: no slider and nothing to tap (count is then 'auto' unless 'none')
 * }
 *
 * The points are placed so that no three chords pass through one point
 * inside the circle (unless `regular` is set), which gives the largest
 * possible number of regions: 1, 2, 4, 8, 16, 31, 57.
 *
 * State: { n, regions, chords, counted, marked, complete }
 *   regions   how many regions there really are
 *   chords    how many chords are drawn: n(n - 1)/2
 *   marked    the regions the learner has counted, in the order they were tapped (indices)
 *   counted   how many that is
 *   complete  every region has been counted
 *
 * setState accepts { n, marked: [0, 3] } or { n, counted: 'all' }.
 */
import { frame, sliderRow, readout, button, hue, s, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('chord-regions', `
  .widget-chord-regions .cr-region { cursor: pointer; outline: none; transition: fill 0.12s ease; }
  .widget-chord-regions .cr-region:focus-visible { stroke: var(--focus); stroke-width: 5; }
  .widget-chord-regions.is-readonly .cr-region, .widget-chord-regions .cr-region.is-fixed { cursor: default; }
  .widget-chord-regions .cr-num { pointer-events: none; font-size: 12px; }
`);

const EPS = 1e-7;
const SIZE = 420;
const C0 = SIZE / 2;
const R = 186;
const TINTS = ['blue', 'orange', 'green', 'violet', 'teal', 'pink', 'yellow'];

/**
 * Angles (degrees, anticlockwise from the right) for n points with no three chords through one
 * inner point. Up to five points any positions will do, so they are evenly spaced; the six-point
 * layout was searched for by a script to make its smallest region as large as possible.
 */
const LAYOUTS = {
  1: [90],
  2: [200, 340],
  3: [90, 210, 330],
  4: [45, 135, 225, 315],
  5: [90, 162, 234, 306, 18],
  6: [10, 64, 124, 177, 249, 302],
  7: [90, 141.4, 192.9, 244.3, 295.7, 347.1, 38.6],
};

/** The points of a layout in drawing coordinates, in order round the circle. */
export function layoutPoints(n, regular = false) {
  const deg = regular ? Array.from({ length: n }, (_, i) => 90 + (i * 360) / n) : LAYOUTS[n];
  return deg.slice().sort((a, b) => a - b).map((d) => {
    const t = (d * Math.PI) / 180;
    return { x: C0 + R * Math.cos(t), y: C0 - R * Math.sin(t), t };
  });
}

function polyArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) { const p = poly[i]; const q = poly[(i + 1) % poly.length]; a += p.x * q.y - q.x * p.y; }
  return Math.abs(a) / 2;
}

/** Split a convex polygon along the line through a and b; null when the line does not cut it. */
function splitPolygon(poly, a, b) {
  const side = poly.map((p) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x));
  if (side.every((v) => v >= -EPS) || side.every((v) => v <= EPS)) return null;
  const left = [];
  const right = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const sp = side[i];
    const sq = side[(i + 1) % poly.length];
    if (sp >= -EPS) left.push(p);
    if (sp <= EPS) right.push(p);
    if ((sp > EPS && sq < -EPS) || (sp < -EPS && sq > EPS)) {
      const k = sp / (sp - sq);
      const m = { x: p.x + k * (q.x - p.x), y: p.y + k * (q.y - p.y) };
      left.push(m);
      right.push(m);
    }
  }
  return polyArea(left) > 1e-6 && polyArea(right) > 1e-6 ? [left, right] : null;
}

/**
 * Every region of the circle, for points given in order round it. Each region is
 * { d, cx, cy }: an SVG path and a point well inside it (for its number).
 * Regions inside the polygon of the points are convex polygons; between each side of
 * that polygon and the circle lies one more region with a curved edge.
 */
export function regionsOf(pts) {
  const n = pts.length;
  const f = (v) => v.toFixed(1);
  if (n <= 1) return [{ d: `M${f(C0 - R)} ${f(C0)}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0Z`, cx: C0, cy: C0 }];
  const out = [];
  if (n >= 3) {
    let faces = [pts.map((p) => ({ x: p.x, y: p.y }))];
    for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue; // that pair is a side of the polygon, not a diagonal
      const next = [];
      for (const face of faces) {
        const parts = splitPolygon(face, pts[i], pts[j]);
        if (parts) next.push(...parts); else next.push(face);
      }
      faces = next;
    }
    for (const face of faces) {
      const cx = face.reduce((t, p) => t + p.x, 0) / face.length;
      const cy = face.reduce((t, p) => t + p.y, 0) / face.length;
      out.push({ d: `M${face.map((p) => `${f(p.x)} ${f(p.y)}`).join('L')}Z`, cx, cy });
    }
  }
  // the regions between a side and the circle (for two points: the two halves either side of the one chord)
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    let span = b.t - a.t;
    if (span <= 0) span += Math.PI * 2;
    const mid = a.t + span / 2;
    const chordMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const arcMid = { x: C0 + R * Math.cos(mid), y: C0 - R * Math.sin(mid) };
    out.push({
      d: `M${f(a.x)} ${f(a.y)}A${R} ${R} 0 ${span > Math.PI ? 1 : 0} 0 ${f(b.x)} ${f(b.y)}Z`,
      cx: (chordMid.x + arcMid.x) / 2, cy: (chordMid.y + arcMid.y) / 2,
    });
  }
  return out;
}

/** How many regions n points give: by building them. (The formula is 1 + C(n,2) + C(n,4).) */
export const regionCount = (n, regular = false) => regionsOf(layoutPoints(n, regular)).length;

export default function create(spec, env) {
  const isStatic = !!spec.static || env.compact;
  const mode = isStatic ? (spec.count === 'none' ? 'none' : 'auto') : ['tap', 'auto', 'none'].includes(spec.count) ? spec.count : 'tap';
  const range = Array.isArray(spec.nRange) && !isStatic ? [clamp(Math.round(spec.nRange[0]), 1, 7), clamp(Math.round(spec.nRange[1]), 1, 7)] : null;
  let n = clamp(Math.round(spec.n || 4), range ? range[0] : 1, range ? range[1] : 7);
  let readOnly = !!env.readOnly;
  let regions = [];
  let marked = []; // region indices in the order they were counted

  const fr = frame({ width: SIZE, height: SIZE, plain: true, compact: env.compact, maxWidth: 440, label: spec.alt || 'Points on a circle joined by chords' });
  const { svg } = fr;
  const gRegions = s('g');
  const gLines = s('g', { 'pointer-events': 'none' });
  const gNums = s('g', { 'pointer-events': 'none' });
  const gPoints = s('g', { 'pointer-events': 'none' });
  svg.append(gRegions, gLines, gNums, gPoints);

  const roPoints = readout('points', { digits: 0 });
  const roChords = readout('chords', { digits: 0 });
  const roCount = readout(mode === 'tap' ? 'regions counted' : 'regions', { digits: 0, color: 'orange' });
  if (!env.compact) {
    fr.readouts.append(roPoints.el, roChords.el);
    if (mode !== 'none') fr.readouts.appendChild(roCount.el);
  }

  const getState = () => ({ n, regions: regions.length, chords: (n * (n - 1)) / 2, counted: marked.length, marked: marked.slice(), complete: marked.length === regions.length });

  function paint() {
    const order = new Map(marked.map((id, k) => [id, k + 1]));
    gNums.replaceChildren();
    regions.forEach((reg, id) => {
      const k = order.get(id);
      reg.el.setAttribute('fill', k ? hue(TINTS[id % TINTS.length], 'soft') : 'var(--surface)');
      if (mode === 'tap') {
        reg.el.setAttribute('aria-pressed', String(!!k));
        reg.el.setAttribute('aria-label', k ? `Region counted as number ${k}` : 'Region, not counted yet');
      }
      if (k) gNums.appendChild(s('text', { class: 'fig-label-sm cr-num', x: reg.cx, y: reg.cy + 4, 'text-anchor': 'middle' }, String(k)));
    });
    roPoints.set(n);
    roChords.set((n * (n - 1)) / 2);
    roCount.set(mode === 'tap' ? marked.length : regions.length);
    if (clearBtn) clearBtn.disabled = readOnly || !marked.length;
    const base = `${n} point${n === 1 ? '' : 's'} on a circle, joined by ${(n * (n - 1)) / 2} chord${n === 2 ? '' : 's'}.`;
    svg.setAttribute('aria-label', mode === 'tap' ? `${base} You have counted ${marked.length} region${marked.length === 1 ? '' : 's'}.` : mode === 'auto' ? `${base} The circle is cut into ${regions.length} region${regions.length === 1 ? '' : 's'}.` : base);
  }

  function toggle(id) {
    if (readOnly || mode !== 'tap') return;
    const at = marked.indexOf(id);
    if (at >= 0) marked.splice(at, 1); else marked.push(id);
    play(at >= 0 ? 'pop' : 'tap');
    paint();
    env.announce(`${marked.length} region${marked.length === 1 ? '' : 's'} counted.`);
    env.onChange(getState());
  }

  function build() {
    const pts = layoutPoints(n, !!spec.regular);
    regions = regionsOf(pts);
    marked = [];
    gRegions.replaceChildren();
    regions.forEach((reg, id) => {
      const el = s('path', { d: reg.d, class: mode === 'tap' ? 'cr-region' : 'cr-region is-fixed', stroke: 'none' });
      if (mode === 'tap') {
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.dataset.keys = 'own';
        el.addEventListener('click', () => toggle(id));
        el.addEventListener('keydown', (ev) => {
          if (ev.key !== 'Enter' && ev.key !== ' ') return;
          ev.preventDefault();
          ev.stopPropagation();
          toggle(id);
        });
      }
      reg.el = el;
      gRegions.appendChild(el);
    });
    gLines.replaceChildren(s('circle', { cx: C0, cy: C0, r: R, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3 }));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      gLines.appendChild(s('line', { x1: pts[i].x, y1: pts[i].y, x2: pts[j].x, y2: pts[j].y, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
    }
    gPoints.replaceChildren(...pts.map((p) => s('circle', { cx: p.x, cy: p.y, r: 8, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 })));
  }

  let slider = null;
  let clearBtn = null;
  if (range && range[1] > range[0]) {
    slider = sliderRow({
      label: 'points', min: range[0], max: range[1], step: 1, value: n, color: 'orange',
      onInput: (v) => { if (readOnly || v === n) return; n = v; play('tap'); build(); paint(); env.onChange(getState()); },
    });
    fr.controls.appendChild(slider.el);
  }
  if (mode === 'tap') {
    clearBtn = button('Start again', () => { if (readOnly || !marked.length) return; marked = []; paint(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.appendChild(clearBtn);
  }
  build();
  paint();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.n != null && Math.round(next.n) !== n) {
        n = clamp(Math.round(next.n), range ? range[0] : 1, range ? range[1] : 7);
        if (slider) slider.set(n);
        build();
      }
      if (next.counted === 'all') marked = regions.map((_, id) => id);
      else if (Array.isArray(next.marked)) marked = next.marked.filter((id, k, all) => Number.isInteger(id) && id >= 0 && id < regions.length && all.indexOf(id) === k);
      paint();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      for (const reg of regions) if (mode === 'tap') reg.el.setAttribute('tabindex', readOnly ? '-1' : '0');
      paint();
    },
  };
}

export const examples = [
  { title: 'chord-regions — count the regions of six points', spec: { type: 'chord-regions', n: 6 } },
  { title: 'chord-regions — one to five points, counted for you', spec: { type: 'chord-regions', n: 3, nRange: [1, 5], count: 'auto' } },
  { title: 'chord-regions — six evenly spaced points lose a region', spec: { type: 'chord-regions', n: 6, regular: true, static: true } },
];
