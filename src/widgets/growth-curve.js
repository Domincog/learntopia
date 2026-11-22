/**
 * growth-curve — money over time, one line per plan. Each line grows by a
 * yearly rate (compound, or simple for comparison), may receive a payment every
 * year, may lose a yearly fee, and may be shown in today's money. Sliders set
 * the horizon and any named parameter, so one widget serves for compound
 * interest, the two savers, the drag of a fee and the bite of inflation.
 *
 * {
 *   type: 'growth-curve',
 *   years: 30,                          // the horizon shown at the start
 *   yearsRange: [1, 40, 1],             // optional slider for the horizon: [min, max, step]
 *   params: {                           // optional sliders; a series may use a parameter's name wherever it takes a number
 *     rate: { value: 7, min: 0, max: 12, step: 0.5, label: 'yearly rate', unit: '%', color: 'green' },
 *   },
 *   series: [
 *     { id: 'compound', label: 'Compound', color: 'green', start: 1000, rate: 'rate' },
 *     { id: 'simple', label: 'Simple', color: 'gray', start: 1000, rate: 'rate', simple: true, dashed: true },
 *     { id: 'aiko', label: 'Aiko', color: 'violet', start: 0, pay: 2000, from: 0, to: 10, rate: 'rate' },   // pays in at the start of years 0…9
 *     { id: 'net', label: 'After the fee', color: 'orange', start: 10000, rate: 6, fee: 'fee' },             // grows by (rate − fee) each year
 *     { id: 'real', label: 'In today’s money', color: 'blue', start: 1000, rate: 2, deflate: 'inflation' }, // divided by (1 + inflation)^years
 *   ],
 *   gap: ['compound', 'simple'],        // optional readout: the first minus the second at the horizon
 *   xStart: 0, xLabel: 'years',         // the axis may count from an age instead: xStart: 25, xLabel: 'age'
 *   yMax: 16000,                        // top of the scale (it stretches when a line would leave the picture)
 *   currency: '$',
 *   note: '…',                          // the assumptions, shown under the chart (a default is supplied)
 *   static: false,
 * }
 *
 * State: { years, <each parameter>, values, paidIn, gap, kept, doubled }
 *   values   { id: value at the horizon }, to the cent
 *   paidIn   { id: start + all payments made up to the horizon }
 *   gap      values[gap[0]] − values[gap[1]] (0 without `gap`);  kept = values[gap[1]] as a percentage of values[gap[0]], one decimal
 *   doubled  { id: the first whole year at which the line is at least twice its start, or null } (lines with a start, within the slider's range)
 * setState accepts { years, <parameter>: value }.
 *
 * The model: interest is added once a year at a constant rate; payments go in at the start of a year. No tax,
 * and no fee unless a `fee` is given. Rates are examples: nothing here is a forecast.
 */
import { frame, plane, drawAxes, sliderRow, readout, hue, s, h, clamp, clipTo, niceStep, addStyles } from './kit.js';

const W = 560;
const H = 300;

addStyles('growth-curve', `
  .widget-growth-curve .gc-end { font-family: var(--font-body); font-weight: 800; font-size: 13px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-growth-curve .gc-end { font-size: 17px; } }
`);

/** Value of one plan after `t` whole years. Numbers are plain: rate, fee and inflation in per cent. */
export function planValue({ start = 0, rate = 0, fee = 0, pay = 0, from = 0, to = Infinity, simple = false, inflation = 0 }, t) {
  let v;
  if (simple) v = start * (1 + (rate / 100) * t);
  else {
    v = start;
    for (let y = 0; y < t; y++) {
      if (pay && y >= from && y < to) v += pay;
      v *= 1 + (rate - fee) / 100;
    }
  }
  return inflation ? v / (1 + inflation / 100) ** t : v;
}

const commas = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const shortMoney = (cur) => (v) => (v >= 1e6 ? `${cur}${Math.round(v / 1e4) / 100}M` : v >= 1000 ? `${cur}${Math.round(v / 100) / 10}k` : `${cur}${Math.round(v)}`);

export default function create(spec, env) {
  const cur = spec.currency || '$';
  const isStatic = !!spec.static || !!env.compact;
  const range = !isStatic && Array.isArray(spec.yearsRange) ? spec.yearsRange : null;
  const maxYears = range ? range[1] : spec.years || 30;
  const xStart = spec.xStart || 0;
  const series = (spec.series || []).map((x, i) => ({ id: `s${i}`, label: `Plan ${i + 1}`, color: ['green', 'blue', 'orange', 'violet'][i % 4], ...x }));
  const params = {};
  const meta = spec.params || {};
  for (const key of Object.keys(meta)) params[key] = meta[key].value != null ? meta[key].value : meta[key].min || 0;
  let years = clamp(spec.years != null ? spec.years : maxYears, range ? range[0] : 0, maxYears);
  let readOnly = !!env.readOnly;

  /** Whole dollars, or dollars and cents for sums under 100. */
  const amount = (v) => (Math.abs(v) < 100 && Math.round(v * 100) % 100 !== 0 ? `${cur}${v.toFixed(2)}` : `${cur}${commas(v)}`);
  const num = (v, fallback = 0) => (typeof v === 'string' ? (params[v] != null ? params[v] : fallback) : v != null ? v : fallback);
  const plan = (x) => ({ start: num(x.start), rate: num(x.rate), fee: num(x.fee), pay: num(x.pay), from: num(x.from), to: x.to == null ? Infinity : num(x.to), simple: !!x.simple, inflation: num(x.deflate) });
  const valueAt = (x, t) => planValue(plan(x), t);
  let baseTop = spec.yMax || 0;
  if (!baseTop) for (const x of series) baseTop = Math.max(baseTop, valueAt(x, maxYears) * 1.06);
  if (!(baseTop > 0)) baseTop = 100;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Money over time' });
  const { svg } = fr;
  const gAxes = s('g');
  const gLines = s('g');
  const gEnds = s('g');
  svg.append(gAxes, gLines, gEnds);
  const pad = { l: 62, r: 18, t: 16, b: 34 };
  let clip = null;

  const ro = {};
  for (const x of series) { ro[x.id] = readout(x.label, { color: x.color }); fr.readouts.appendChild(ro[x.id].el); }
  const roGap = Array.isArray(spec.gap) ? readout('difference') : null;
  if (roGap) fr.readouts.appendChild(roGap.el);

  const sliders = {};
  let yearSlider = null;
  if (!isStatic) {
    if (range) {
      yearSlider = sliderRow({ label: spec.xLabel === 'age' ? 'age' : 'years', min: range[0], max: range[1], step: range[2] || 1, value: years, color: 'blue', format: (v) => (spec.xLabel === 'age' ? String(v + xStart) : `${v}`), onInput: (v) => { if (readOnly) return; years = v; render(); env.onChange(getState()); } });
      fr.controls.appendChild(yearSlider.el);
    }
    for (const key of Object.keys(meta)) {
      const m = meta[key];
      sliders[key] = sliderRow({ label: m.label || key, min: m.min, max: m.max, step: m.step || 1, value: params[key], color: m.color || 'green', unit: m.unit || '', onInput: (v) => { if (readOnly) return; params[key] = v; render(); env.onChange(getState()); } });
      fr.controls.appendChild(sliders[key].el);
    }
  }
  if (!env.compact) fr.el.appendChild(h('p.w-hint', spec.note || 'A constant example rate, added once a year. No tax or fees. Not a forecast.'));

  function facts() {
    const values = {};
    const paidIn = {};
    const doubled = {};
    for (const x of series) {
      const p = plan(x);
      values[x.id] = Math.round(valueAt(x, years) * 100) / 100;
      let pays = 0;
      if (p.pay && !p.simple) for (let y = 0; y < years; y++) if (y >= p.from && y < p.to) pays += p.pay;
      paidIn[x.id] = p.start + pays;
      doubled[x.id] = null;
      if (p.start > 0) for (let t = 1; t <= maxYears; t++) if (valueAt(x, t) >= 2 * p.start - 1e-9) { doubled[x.id] = t; break; }
    }
    let gap = 0;
    let kept = 0;
    if (roGap) {
      gap = Math.round((values[spec.gap[0]] - values[spec.gap[1]]) * 100) / 100;
      kept = values[spec.gap[0]] ? Math.round((values[spec.gap[1]] / values[spec.gap[0]]) * 1000) / 10 : 0;
    }
    return { years, ...params, values, paidIn, gap, kept, doubled };
  }
  const getState = () => facts();
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  function render() {
    const f = facts();
    // the scale is fixed (so that a slider visibly bends the lines) and stretches only when a line would leave the picture
    let top = baseTop;
    for (const x of series) top = Math.max(top, valueAt(x, years) * 1.06);
    const pl = plane({ x: [0, maxYears], y: [0, top], width: W, height: H, pad });
    clear(gAxes); clear(gLines); clear(gEnds);
    gAxes.appendChild(drawAxes(pl, { xStep: niceStep(maxYears, 8), yStep: niceStep(top, 5), xFormat: (v) => String(v + xStart), yFormat: shortMoney(cur), xLabel: spec.xLabel || 'years' }));
    if (!clip) clip = clipTo(svg, pl);
    gLines.setAttribute('clip-path', clip);
    const ends = [];
    for (const x of series) {
      let d = '';
      for (let t = 0; t <= years; t++) d += `${t ? 'L' : 'M'}${pl.sx(t).toFixed(1)} ${pl.sy(valueAt(x, t)).toFixed(1)}`;
      gLines.appendChild(s('path', { d, fill: 'none', stroke: hue(x.color), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': x.dashed ? '2 8' : null }));
      ends.push({ x, px: pl.sx(years), py: clamp(pl.sy(f.values[x.id]), pl.top, pl.bottom), v: f.values[x.id] });
    }
    // end dots and labels, kept apart from one another
    ends.sort((a, b) => a.py - b.py);
    let last = -Infinity;
    for (const e of ends) { e.ly = Math.max(e.py - 5, last + 16, pl.top + 12); last = e.ly; }
    let floor = pl.bottom - 5;
    for (let i = ends.length - 1; i >= 0; i--) { ends[i].ly = Math.min(ends[i].ly, floor); floor = ends[i].ly - 16; }
    for (const e of ends) {
      gEnds.appendChild(s('circle', { cx: e.px, cy: e.py, r: 5.5, fill: hue(e.x.color), stroke: 'var(--ink)', 'stroke-width': 2 }));
      const left = e.px > W - 190;
      gEnds.appendChild(s('text.gc-end', { x: left ? e.px - 10 : e.px + 10, y: e.ly, 'text-anchor': left ? 'end' : 'start', fill: hue(e.x.color, 'text') }, `${e.x.label} ${amount(e.v)}`));
    }
    for (const x of series) ro[x.id].set(amount(f.values[x.id]));
    if (roGap) roGap.set(amount(Math.abs(f.gap)));
    svg.setAttribute('aria-label', `${spec.alt || 'Money over time'}. After ${years} years: ${series.map((x) => `${x.label} ${amount(f.values[x.id])}`).join(', ')}.`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.years === 'number') { years = clamp(next.years, range ? range[0] : 0, maxYears); if (yearSlider) yearSlider.set(years); }
      for (const key of Object.keys(meta)) {
        if (typeof next[key] !== 'number') continue;
        params[key] = clamp(next[key], meta[key].min, meta[key].max);
        if (sliders[key]) sliders[key].set(params[key]);
      }
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); if (yearSlider) yearSlider.setDisabled(readOnly); for (const k in sliders) sliders[k].setDisabled(readOnly); },
  };
}

export const examples = [
  {
    title: 'growth-curve — simple against compound',
    spec: {
      type: 'growth-curve', years: 20, yearsRange: [1, 40, 1], gap: ['compound', 'simple'],
      params: { rate: { value: 7, min: 0, max: 12, step: 0.5, label: 'yearly rate', unit: '%' } },
      series: [{ id: 'compound', label: 'Compound', color: 'green', start: 1000, rate: 'rate' }, { id: 'simple', label: 'Simple', color: 'gray', start: 1000, rate: 'rate', simple: true, dashed: true }],
    },
  },
  {
    title: 'growth-curve — what a yearly fee takes',
    spec: {
      type: 'growth-curve', years: 30, yearsRange: [5, 40, 1], gap: ['gross', 'net'],
      params: { fee: { value: 1, min: 0, max: 2, step: 0.1, label: 'yearly fee', unit: '%', color: 'orange' } },
      series: [{ id: 'gross', label: 'No fee', color: 'green', start: 10000, rate: 6 }, { id: 'net', label: 'After the fee', color: 'orange', start: 10000, rate: 6, fee: 'fee' }],
    },
  },
];
