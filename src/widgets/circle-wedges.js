/**
 * circle-wedges — cut a circle into equal wedges and rearrange them, point up,
 * point down, point up… into a row. With more wedges the row gets closer and
 * closer to a rectangle whose height is the radius and whose width is half
 * the circumference. That is where the area formula π × r × r comes from.
 *
 * The top half of the circle (orange rim) ends up along the top edge of the
 * row, the bottom half (blue rim) along the bottom edge.
 *
 * {
 *   type: 'circle-wedges',
 *   n: 8,                              // number of wedges (must be one of `counts`)
 *   counts: [4, 6, 8, 12, 16, 24, 36, 48],   // the choices offered by the "wedges" slider (even numbers)
 *   t: 0,                              // 0 = circle … 1 = wedges laid out in a row
 *   countSlider: true,                 // show the slider for the number of wedges
 *   slider: true,                      // show the "rearrange" slider
 *   labels: { height: 'radius', width: 'half the circumference' },
 *                                      // captions for the row's height and width once it is laid out
 *                                      // (default: none, so the learner can work them out; false also hides them)
 * }
 *
 * State: { n, t, flat }
 *   flat — true when the wedges are fully laid out in a row (t = 1)
 *
 * A solution only needs e.g. { n: 24, t: 1 }.
 */
import { frame, sliderRow, hue, s, clamp, tidy } from './kit.js';

const W = 560;
const H = 292;
const R = 96;
const CX = W / 2;
const CY = 136;
const LIFT = 46;   // on the way, the two halves move apart by this much so that the wedges do not collide
const DEFAULT_COUNTS = [4, 6, 8, 12, 16, 24, 36, 48];

export default function create(spec, env) {
  const interactive = !env.compact;
  const counts = (Array.isArray(spec.counts) && spec.counts.length ? spec.counts : DEFAULT_COUNTS)
    .map((v) => Math.max(4, Math.round(v / 2) * 2)).sort((p, q) => p - q);
  const nearest = (v) => counts.reduce((best, c) => (Math.abs(c - v) < Math.abs(best - v) ? c : best), counts[0]);
  let n = nearest(Number(spec.n) || 8);
  let t = clamp(Number(spec.t) || 0, 0, 1);
  let readOnly = !!env.readOnly;
  let wasFlat = false;
  const captions = spec.labels && typeof spec.labels === 'object' ? spec.labels : {};

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A circle cut into wedges' });
  const { svg } = fr;

  const ghost = s('circle', { cx: CX, cy: CY, r: R, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '5 6' });
  const gWedges = s('g');
  const gNotes = s('g');
  svg.append(ghost, gWedges, gNotes);

  let wedges = []; // { g, from: { angle }, to: { x, y, angle } }

  function build() {
    while (gWedges.firstChild) gWedges.removeChild(gWedges.firstChild);
    wedges = [];
    const half = Math.PI / n;                // half the angle of one wedge
    const hw = R * Math.sin(half);           // half the width of a wedge
    const hh = R * Math.cos(half);           // height of the row
    const left = CX - ((n + 1) * hw) / 2;
    const yTop = CY - hh / 2;
    const yBottom = CY + hh / 2;
    // a wedge whose point is at the origin and which opens along the +x axis
    const x1 = (R * Math.cos(half)).toFixed(2);
    const y1 = (R * Math.sin(half)).toFixed(2);
    const body = `M0 0 L${x1} -${y1} A${R} ${R} 0 0 1 ${x1} ${y1} Z`;
    const rim = `M${x1} -${y1} A${R} ${R} 0 0 1 ${x1} ${y1}`;
    const thin = n > 24 ? 1 : 1.5;
    for (let k = 0; k < n; k++) {
      const up = k % 2 === 0;               // point at the bottom, rim along the top
      const j = Math.floor(k / 2);          // position among the up (or down) wedges, left to right
      const i = n / 2 - 1 - j;              // which wedge of its half-circle (0 = rightmost)
      const color = up ? 'orange' : 'blue';
      const g = s('g',
        s('path', { d: body, fill: hue(color, 'soft'), stroke: 'var(--ink)', 'stroke-width': thin, 'stroke-linejoin': 'round' }),
        s('path', { d: rim, fill: 'none', stroke: hue(color), 'stroke-width': 4.5 }));
      gWedges.appendChild(g);
      wedges.push({
        g,
        up,
        from: (up ? -1 : 1) * (2 * i + 1) * (180 / n),
        to: { x: left + (k + 1) * hw, y: up ? yBottom : yTop, angle: up ? -90 : 90 },
      });
    }
    notes(left, hw, yTop, yBottom, R - hh);
  }

  /** Captions for the height and width of the row (only shown once it is nearly laid out). */
  function notes(left, hw, yTop, yBottom, bulge) {
    while (gNotes.firstChild) gNotes.removeChild(gNotes.firstChild);
    if (spec.labels === false || (!captions.height && !captions.width)) return;
    const ink = { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' };
    if (captions.height) {
      const x = left - 16;
      gNotes.appendChild(s('path', { d: `M${x} ${yTop} V${yBottom} M${x - 5} ${yTop} h10 M${x - 5} ${yBottom} h10`, ...ink }));
      gNotes.appendChild(s('text.fig-label', { x: x - 9, y: CY, 'text-anchor': 'end', 'dominant-baseline': 'middle' }, captions.height));
    }
    if (captions.width) {
      const y = yBottom + bulge + 16; // clear of the curved rims, which bulge below the row
      const xa = left + hw;
      const xb = left + (n + 1) * hw;
      gNotes.appendChild(s('path', { d: `M${xa} ${y} H${xb} M${xa} ${y - 5} v10 M${xb} ${y - 5} v10`, ...ink }));
      gNotes.appendChild(s('text.fig-label', { x: (xa + xb) / 2, y: y + 19, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, captions.width));
    }
  }

  function place() {
    const lift = LIFT * Math.sin(Math.PI * t);
    for (const w of wedges) {
      const x = CX + (w.to.x - CX) * t;
      const y = CY + (w.to.y - CY) * t + (w.up ? -lift : lift);
      const angle = w.from + (w.to.angle - w.from) * t;
      w.g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${angle.toFixed(2)})`);
    }
    ghost.setAttribute('opacity', clamp(t * 4, 0, 1));
    gNotes.setAttribute('opacity', clamp((t - 0.8) * 5, 0, 1));
    const flat = t >= 0.995;
    svg.setAttribute('aria-label', `A circle cut into ${n} equal wedges. ` + (flat
      ? 'The wedges are laid out in a row, pointing up and down in turn. The row is as tall as the radius and as wide as half the circumference.'
      : t > 0 ? 'The wedges are moving out of the circle into a row.' : 'The wedges are still together as a circle.'));
    if (flat && !wasFlat) env.announce(`${n} wedges laid out in a row. The row is as tall as the radius and as wide as half the circumference.`);
    wasFlat = flat;
  }

  /* ----------------------------------------------------------- controls */
  const countRow = spec.countSlider !== false && interactive && counts.length > 1 ? sliderRow({
    label: 'Wedges', min: 0, max: counts.length - 1, step: 1, value: counts.indexOf(n), color: 'blue',
    format: (v) => String(counts[v]),
    onInput: (v) => {
      if (readOnly) return;
      n = counts[clamp(Math.round(v), 0, counts.length - 1)];
      build();
      place();
      env.onChange(getState());
    },
  }) : null;
  const moveRow = spec.slider !== false && interactive ? sliderRow({
    label: 'Rearrange', min: 0, max: 1, step: 0.01, value: t, color: 'orange',
    format: (v) => (v >= 0.995 ? 'done' : `${Math.round(v * 100)}%`),
    onInput: (v) => {
      if (readOnly) return;
      t = clamp(v, 0, 1);
      place();
      env.onChange(getState());
    },
  }) : null;
  if (countRow) fr.controls.appendChild(countRow.el);
  if (moveRow) fr.controls.appendChild(moveRow.el);

  const getState = () => ({ n, t: tidy(t, 3), flat: t >= 0.995 });

  build();
  place();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Number.isFinite(next.n)) { n = nearest(next.n); if (countRow) countRow.set(counts.indexOf(n)); build(); }
      if (typeof next.t === 'number') t = clamp(next.t, 0, 1);
      else if (next.flat === true) t = 1;
      if (moveRow) moveRow.set(t);
      place();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (countRow) countRow.setDisabled(readOnly);
      if (moveRow) moveRow.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'circle-wedges — rearrange the wedges, then use more of them', spec: { type: 'circle-wedges', n: 8 } },
  { title: 'circle-wedges — 36 wedges laid out, with captions', spec: { type: 'circle-wedges', n: 36, t: 1, labels: { height: 'radius', width: 'half the circumference' } } },
];
