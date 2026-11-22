/**
 * plate-builder — divide a plate between food groups, an eighth at a time.
 *
 * A round plate cut into equal slices. The learner gives slices to food groups with + and − buttons and the
 * plate is redrawn. It is a tool for describing proportions ("half the plate is vegetables and fruit"), used
 * to predict and then compare with the plates that national food guides draw. It makes no judgement itself.
 *
 * {
 *   type: 'plate-builder',
 *   groups: [                                   // in the order they are drawn round the plate
 *     { id: 'veg', name: 'Vegetables and fruit', color: 'green' },
 *     { id: 'grain', name: 'Whole grains', color: 'yellow' },
 *     { id: 'protein', name: 'Protein foods', color: 'violet' },
 *   ],
 *   slices: 8,                                  // how many equal slices the plate has
 *   parts: { veg: 2, grain: 3, protein: 3 },    // slices each group has at the start (the rest are empty)
 *   static: false,
 * }
 *
 * State: { parts, filled, empty, slices, share }
 *   parts  — { id: slices given to that group }
 *   filled — slices given out;  empty — slices left;  slices — the total
 *   share  — { id: fraction of the plate, e.g. 0.5 }
 *
 * setState({ parts: { veg: 4, grain: 2, protein: 2 } }).
 */
import { frame, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 360;
const H = 300;
const CX = W / 2;
const CY = H / 2;
const R = 122;

addStyles('plate-builder', `
  .widget-plate-builder .pb-rows { display: grid; gap: 6px; }
  .widget-plate-builder .pb-row { display: grid; grid-template-columns: 18px minmax(0, 1fr) 40px 3.2em 40px; align-items: center; gap: 8px; font-size: var(--fs-sm); font-weight: 700; }
  .widget-plate-builder .pb-key { width: 16px; height: 16px; border: 2px solid var(--ink); border-radius: 4px; }
  .widget-plate-builder .pb-count { text-align: center; font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  .widget-plate-builder .pb-btn { width: 40px; height: 40px; border: var(--bw) solid var(--edge); border-radius: 50%; background: var(--surface); color: var(--ink); font: inherit; font-size: 1.2rem; font-weight: 800; line-height: 1; cursor: pointer; }
  .widget-plate-builder .pb-btn:disabled { opacity: 0.35; cursor: default; }
  .widget-plate-builder .pb-frac { font-family: var(--font-body); font-size: 17px; font-weight: 800; fill: #1D1B26; pointer-events: none; }
  .widget-plate-builder .pb-left { text-align: center; font-size: var(--fs-sm); color: var(--ink-2); min-height: 1.4em; }
`);

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
/** "1/2", "3/8", "all" for n slices out of total. */
export function fraction(n, total) {
  if (n === total) return 'all';
  const g = gcd(n, total) || 1;
  return `${n / g}/${total / g}`;
}

export default function create(spec, env) {
  const groups = Array.isArray(spec.groups) && spec.groups.length ? spec.groups : [
    { id: 'veg', name: 'Vegetables and fruit', color: 'green' },
    { id: 'grain', name: 'Whole grains', color: 'yellow' },
    { id: 'protein', name: 'Protein foods', color: 'violet' },
  ];
  const slices = clamp(Math.round(spec.slices || 8), 2, 12);
  const isStatic = !!spec.static || !!env.compact;
  let readOnly = !!env.readOnly;
  const parts = {};
  const load = (src) => {
    let left = slices;
    for (const g of groups) { parts[g.id] = clamp(Math.round((src && src[g.id]) || 0), 0, left); left -= parts[g.id]; }
  };
  load(spec.parts);

  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, maxWidth: 380, label: spec.alt || 'A plate divided between food groups' });
  const { svg } = fr;
  const gPlate = s('g');
  svg.appendChild(gPlate);
  const filled = () => groups.reduce((t, g) => t + parts[g.id], 0);

  const rows = {};
  const left = h('div.pb-left', { 'aria-live': 'polite' });
  if (!isStatic) {
    const box = h('div.pb-rows');
    for (const g of groups) {
      const key = h('span.pb-key');
      key.style.background = hue(g.color);
      const count = h('span.pb-count');
      const minus = h('button.pb-btn', { type: 'button', 'aria-label': `One slice less for ${g.name}` }, '−');
      const plus = h('button.pb-btn', { type: 'button', 'aria-label': `One slice more for ${g.name}` }, '+');
      const change = (d) => {
        if (readOnly) return;
        const next = parts[g.id] + d;
        if (next < 0 || (d > 0 && filled() >= slices)) return;
        parts[g.id] = next;
        play('tap');
        render();
        env.announce(`${g.name}: ${describeShare(g.id)} of the plate`);
        env.onChange(getState());
      };
      minus.addEventListener('click', () => change(-1));
      plus.addEventListener('click', () => change(1));
      rows[g.id] = { count, minus, plus };
      box.appendChild(h('div.pb-row', key, h('span', g.name), minus, count, plus));
    }
    fr.el.append(box, left);
  }

  const describeShare = (id) => (parts[id] === 0 ? 'none' : fraction(parts[id], slices));
  const pt = (a, r = R) => [CX + r * Math.sin(a), CY - r * Math.cos(a)];
  function wedge(from, to) {
    const a0 = (from / slices) * 2 * Math.PI;
    const a1 = (to / slices) * 2 * Math.PI;
    if (to - from >= slices) return `M${CX} ${CY - R}A${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R}Z`;
    const [x0, y0] = pt(a0);
    const [x1, y1] = pt(a1);
    return `M${CX} ${CY}L${x0.toFixed(1)} ${y0.toFixed(1)}A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z`;
  }

  function render() {
    while (gPlate.firstChild) gPlate.removeChild(gPlate.firstChild);
    gPlate.appendChild(s('circle', { cx: CX, cy: CY, r: R + 14, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 3 }));
    gPlate.appendChild(s('circle', { cx: CX, cy: CY, r: R, fill: 'var(--sunken)', stroke: 'var(--hair)', 'stroke-width': 2 }));
    let at = 0;
    for (const g of groups) {
      const n = parts[g.id];
      if (n > 0) {
        gPlate.appendChild(s('path', { d: wedge(at, at + n), fill: hue(g.color), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
        const mid = ((at + n / 2) / slices) * 2 * Math.PI;
        const [lx, ly] = n >= slices ? [CX, CY] : pt(mid, R * 0.6);
        gPlate.appendChild(s('text.pb-frac', { x: lx, y: ly + 6, 'text-anchor': 'middle' }, fraction(n, slices)));
      }
      at += n;
    }
    // slice marks, so that an eighth can be seen as an eighth
    for (let i = 0; i < slices; i++) {
      const [x, y] = pt((i / slices) * 2 * Math.PI);
      gPlate.appendChild(s('line', { x1: CX, y1: CY, x2: x, y2: y, stroke: 'var(--ink)', 'stroke-width': 1, opacity: 0.28 }));
    }
    const used = filled();
    for (const g of groups) {
      const row = rows[g.id];
      if (!row) continue;
      row.count.textContent = `${parts[g.id]}/${slices}`;
      row.minus.disabled = readOnly || parts[g.id] === 0;
      row.plus.disabled = readOnly || used >= slices;
    }
    left.textContent = used < slices ? `${slices - used} of ${slices} slices still empty` : 'The plate is full.';
    svg.setAttribute('aria-label', `${spec.alt || 'A plate divided between food groups'}. ${groups.map((g) => `${g.name}: ${describeShare(g.id)}`).join('; ')}.${used < slices ? ` ${slices - used} of ${slices} slices empty.` : ''}`);
  }

  function getState() {
    const share = {};
    for (const g of groups) share[g.id] = parts[g.id] / slices;
    const used = filled();
    return { parts: { ...parts }, filled: used, empty: slices - used, slices, share };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (next && next.parts) { load(next.parts); render(); }
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      render();
    },
  };
}

export const examples = [
  { title: 'plate-builder — share out a plate', spec: { type: 'plate-builder', parts: { veg: 2, grain: 3, protein: 3 } } },
  { title: 'plate-builder — a finished plate', spec: { type: 'plate-builder', parts: { veg: 4, grain: 2, protein: 2 }, static: true } },
];
