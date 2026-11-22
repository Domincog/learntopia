/**
 * risk-array — one crowd, two ways of telling the same story. A field of dots
 * (100, 1,000 or 10,000 people) shows how many are affected without some
 * exposure or treatment, and how many with it. Underneath, the difference is
 * spelled out both ways: as a relative change ("50% more") and as an absolute
 * one ("10 more in every 1,000"). With `factors`, the multiplier comes from
 * switches instead of a slider, to show how risk factors combine.
 *
 * {
 *   type: 'risk-array',
 *   n: 1000,                       // people in the crowd: 100, 1000 or 10000
 *   base: 20,                      // how many of them are affected WITHOUT the exposure (whole people)
 *   rr: 1.5,                       // relative risk WITH it: 2 doubles the risk, 0.5 halves it
 *   baseRange: [1, 100, 1],        // optional slider for `base`: [min, max, step]
 *   rrRange: [0.5, 3, 0.25],       // optional slider for `rr`
 *   factors: [                     // instead of `rr`: switches whose multipliers are multiplied together
 *     { id: 'smoking', label: 'Smokes', mult: 2, on: false },
 *   ],
 *   cap: 0.95,                     // the affected share never goes above this
 *   scatter: false,                // true: affected people are spread over the crowd (default for 10,000) instead of leading it
 *   words: {
 *     people: 'people',            // "in every 1,000 people"
 *     without: 'Without it',       // names of the two situations
 *     with: 'With it',
 *     base: 'affected either way', // legend entries
 *     extra: 'affected because of it',
 *     fewer: 'spared by it',
 *     rest: 'not affected',
 *     baseLabel: 'affected without it', rrLabel: 'relative risk',   // slider captions
 *     measure: 'the risk',         // what is being multiplied: "3 times the risk", or "3 times the chance" for a good outcome
 *   },
 *   good: false,                   // true: the outcome is a welcome one (a success, a recovery): green instead of red
 *   sentence: true,                // the two-line summary under the picture
 *   static: false,
 * }
 *
 * State: { n, base, rr, withCount, extra, absolute, relative, nnt, on }
 *   withCount — people affected with the exposure: round(base × rr), at most n × cap
 *   extra     — withCount − base: positive for a harm, negative for a benefit
 *   absolute  — extra / n: the absolute change in risk, as a share (0.01 = one percentage point)
 *   relative  — withCount / base − 1 in whole people: +0.5 is "50% more", −0.25 is "25% fewer"
 *   nnt       — n / |extra|: how many people must be exposed (or treated) for one of them to be affected
 *               (or spared); null when extra is 0
 *   on        — ids of the factors that are switched on (empty without `factors`)
 *
 * setState accepts { base, rr, on: [ids] }.
 *
 * Squares are people affected either way, ringed circles the extra ones, hollow
 * rings the ones who are spared: shape carries the meaning as well as colour.
 */
import { frame, sliderRow, hue, s, h, clamp, mdInline, formatNumber, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('risk-array', `
  .widget-risk-array .ra-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s1) var(--s4); font-size: var(--fs-sm); font-weight: 700; min-height: 1.6em; }
  .widget-risk-array .ra-key { display: inline-flex; align-items: center; gap: 0.4rem; }
  .widget-risk-array .ra-key svg { flex: none; width: 16px; height: 16px; }
  .widget-risk-array .ra-key b { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  .widget-risk-array .ra-says { display: grid; gap: 2px; text-align: center; padding: var(--s2) var(--s3); border: var(--bw) dashed var(--hair); border-radius: var(--r); font-size: var(--fs-md); line-height: 1.4; }
  .widget-risk-array .ra-says span:first-child { color: var(--ink-2); }
  .widget-risk-array .ra-factors { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-risk-array .ra-factor { min-height: 40px; padding: 0.3rem 0.8rem; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--surface); color: var(--ink); font: inherit; font-size: var(--fs-sm); font-weight: 700; cursor: pointer; }
  .widget-risk-array .ra-factor[aria-pressed='true'] { background: var(--orange-soft); border-color: var(--orange); box-shadow: 0 0 0 1px var(--orange); }
  .widget-risk-array .ra-factor small { font-family: var(--font-mono); font-weight: 700; color: var(--ink-2); margin-left: 0.35rem; }
  .widget-risk-array .ra-factor:disabled { cursor: default; opacity: 0.75; }
`);

const LAYOUT = { 100: [20, 5], 1000: [40, 25], 10000: [125, 80] };
const W = 560;
const PAD = 16;

const KINDS = {
  base: { fill: hue('red'), stroke: 'var(--ink)', sw: 2, square: true },
  extra: { fill: hue('orange'), stroke: 'var(--ink)', sw: 2, square: false },
  fewer: { fill: 'var(--surface)', stroke: hue('green'), sw: 2.5, square: false },
  rest: { fill: hue('gray', 'soft'), stroke: hue('gray'), sw: 1, square: false },
};

function swatch(kind, kinds = KINDS) {
  const k = kinds[kind];
  const size = kind === 'rest' ? 8 : 11;
  return s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' },
    s('rect', { x: 8 - size / 2, y: 8 - size / 2, width: size, height: size, rx: k.square ? 2 : size / 2, fill: k.fill, stroke: k.stroke, 'stroke-width': Math.min(k.sw, 2) }));
}

const grouped = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** The counts a risk-array shows for a baseline count, a relative risk and a crowd size. */
export function riskCounts(n, base, rr, cap = 0.95) {
  const withCount = clamp(Math.round(base * rr), 0, Math.floor(n * cap));
  const extra = withCount - base;
  return { withCount, extra, absolute: extra / n, relative: base ? withCount / base - 1 : 0, nnt: extra ? n / Math.abs(extra) : null };
}

export default function create(spec, env) {
  const n = LAYOUT[spec.n] ? spec.n : 1000;
  const [cols, rows] = LAYOUT[n];
  const cap = clamp(spec.cap || 0.95, 0.05, 1);
  const interactive = !env.compact && !spec.static;
  const factors = Array.isArray(spec.factors) ? spec.factors.map((f) => ({ ...f })) : null;
  const words = {
    people: 'people', without: 'Without it', with: 'With it',
    base: 'affected either way', extra: 'affected because of it', fewer: 'spared by it', rest: 'not affected',
    baseLabel: 'affected without it', rrLabel: 'relative risk', measure: 'the risk',
    ...(spec.words || {}),
  };
  const baseRange = interactive && Array.isArray(spec.baseRange) ? spec.baseRange : null;
  const rrRange = interactive && !factors && Array.isArray(spec.rrRange) ? spec.rrRange : null;
  let base = clamp(Math.round(spec.base != null ? spec.base : 20), 0, Math.floor(n * cap));
  let rr = factors ? 1 : Math.max(0, spec.rr != null ? spec.rr : 1.5);
  let readOnly = !!env.readOnly;
  const kinds = spec.good
    ? { ...KINDS, base: { ...KINDS.base, fill: hue('green') }, extra: { ...KINDS.extra, fill: hue('teal') }, fewer: { ...KINDS.fewer, stroke: hue('red') } }
    : KINDS;

  const pitch = (W - 2 * PAD) / cols;
  const dot = pitch * (n === 10000 ? 0.62 : 0.66);
  const H = Math.round(rows * pitch + 2 * PAD);
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A crowd of dots' });
  const scatter = spec.scatter != null ? !!spec.scatter : n === 10000;
  const order = scatter ? env.rng.shuffle(Array.from({ length: n }, (_, i) => i)) : null;
  const at = (i) => {
    const cell = order ? order[i] : i;
    return [PAD + (cell % cols) * pitch + pitch / 2, PAD + Math.floor(cell / cols) * pitch + pitch / 2];
  };

  // Everybody, drawn once as a single path; the affected people are drawn on top.
  let d = '';
  const rad = dot / 2;
  for (let i = 0; i < n; i++) {
    const x = PAD + (i % cols) * pitch + pitch / 2;
    const y = PAD + Math.floor(i / cols) * pitch + pitch / 2;
    d += `M${(x - rad).toFixed(1)} ${y.toFixed(1)}a${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 0 ${dot.toFixed(2)} 0a${rad.toFixed(2)} ${rad.toFixed(2)} 0 1 0 ${(-dot).toFixed(2)} 0`;
  }
  fr.svg.appendChild(s('path', { d, fill: KINDS.rest.fill, stroke: n === 10000 ? 'none' : KINDS.rest.stroke, 'stroke-width': n === 100 ? 1.5 : 1 }));
  const gMarks = s('g');
  fr.svg.appendChild(gMarks);

  const legend = h('div.ra-legend');
  const says = h('div.ra-says', { 'aria-live': 'polite' });
  fr.el.insertBefore(legend, fr.readouts);
  if (spec.sentence !== false && !env.compact) fr.el.insertBefore(says, fr.readouts);

  const currentRr = () => (factors ? factors.reduce((m, f) => (f.on ? m * f.mult : m), 1) : rr);
  const tally = () => riskCounts(n, base, currentRr(), cap);

  function getState() {
    const t = tally();
    return { n, base, rr: Math.round(currentRr() * 1e6) / 1e6, ...t, on: factors ? factors.filter((f) => f.on).map((f) => f.id) : [] };
  }

  const times = (v) => `${formatNumber(v, 2)}×`;
  function relativeText(t) {
    if (!base || !t.extra) return 'no change';
    const pct = Math.abs(t.relative) * 100;
    const shown = formatNumber(pct, pct < 10 ? 1 : 0);
    if (t.extra > 0) return t.relative >= 1 && Number.isInteger(t.withCount / base) ? `${t.withCount / base} times ${words.measure} (${shown}% more)` : `${shown}% more`;
    return `${shown}% less`;
  }

  function update() {
    const t = tally();
    while (gMarks.firstChild) gMarks.removeChild(gMarks.firstChild);
    const both = Math.min(base, t.withCount);
    const top = Math.max(base, t.withCount);
    const size = Math.max(dot * 1.25, n === 10000 ? 7 : 0);
    for (let i = 0; i < top; i++) {
      const kind = i < both ? 'base' : t.extra > 0 ? 'extra' : 'fewer';
      const k = kinds[kind];
      const [x, y] = at(i);
      gMarks.appendChild(s('rect', { x: x - size / 2, y: y - size / 2, width: size, height: size, rx: k.square ? Math.min(3, size / 5) : size / 2, fill: k.fill, stroke: k.stroke, 'stroke-width': Math.min(k.sw, size / 4) }));
    }
    const key = (kind, label, count) => h('span.ra-key', swatch(kind, kinds), `${label}: `, h('b', grouped(count)));
    const keys = [key('base', words.base, both)];
    if (t.extra > 0) keys.push(key('extra', words.extra, t.extra));
    if (t.extra < 0) keys.push(key('fewer', words.fewer, -t.extra));
    keys.push(key('rest', words.rest, n - top));
    legend.replaceChildren(...keys);

    const per = `in every ${grouped(n)} ${words.people}`;
    const line1 = `${words.without}: **${grouped(base)}** ${per}. ${words.with}: **${grouped(t.withCount)}** ${per}.`;
    let line2;
    if (!t.extra) line2 = 'In whole people, that is **no difference**.';
    else {
      const more = t.extra > 0 ? 'more' : 'fewer';
      const points = Math.abs(t.absolute) * 100;
      line2 = `Relative: **${relativeText(t)}**. Absolute: **${grouped(Math.abs(t.extra))} ${more} in ${grouped(n)}** (${formatNumber(points, points < 1 ? 2 : 1)} percentage point${points === 1 ? '' : 's'}).`;
    }
    says.replaceChildren(h('span', { html: mdInline(line1) }), h('span', { html: mdInline(line2) }));
    fr.svg.setAttribute('aria-label', `${spec.alt || 'A crowd of dots'}. ${words.without}: ${base} in ${n} ${words.people}. ${words.with}: ${t.withCount} in ${n}.`);
    for (const f of factors || []) if (f.btn) f.btn.setAttribute('aria-pressed', String(!!f.on));
  }

  /* ------------------------------------------------------------ controls */
  fr.el.insertBefore(fr.controls, fr.canvas);   // sliders above the picture, so the dots stay in view on a phone
  let baseRow = null;
  let rrRow = null;
  if (baseRange) {
    const [lo, hi, st] = baseRange;
    base = clamp(base, lo, hi);
    baseRow = sliderRow({
      label: words.baseLabel, min: lo, max: hi, step: st || 1, value: base, color: 'red', format: (v) => `${grouped(v)} in ${grouped(n)}`,
      onInput: (v) => { if (readOnly) return; base = Math.round(v); update(); env.onChange(getState()); },
    });
    fr.controls.appendChild(baseRow.el);
  }
  if (rrRange) {
    const [lo, hi, st] = rrRange;
    rr = clamp(rr, lo, hi);
    rrRow = sliderRow({
      label: words.rrLabel, min: lo, max: hi, step: st || 0.25, value: rr, color: 'orange', format: times,
      onInput: (v) => { if (readOnly) return; rr = v; update(); env.onChange(getState()); },
    });
    fr.controls.appendChild(rrRow.el);
  }
  if (factors && interactive) {
    const wrap = h('div.ra-factors', { role: 'group', 'aria-label': 'Risk factors' });
    for (const f of factors) {
      f.btn = h('button.ra-factor', { type: 'button', 'aria-pressed': String(!!f.on) }, f.label, h('small', times(f.mult)));
      f.btn.addEventListener('click', () => {
        if (readOnly) return;
        f.on = !f.on;
        play('select');
        update();
        env.onChange(getState());
      });
      wrap.appendChild(f.btn);
    }
    fr.el.insertBefore(wrap, fr.canvas);
  }

  update();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.base === 'number') { base = clamp(Math.round(next.base), 0, Math.floor(n * cap)); if (baseRow) baseRow.set(base); }
      if (typeof next.rr === 'number' && !factors) { rr = Math.max(0, next.rr); if (rrRow) rrRow.set(rr); }
      if (Array.isArray(next.on) && factors) for (const f of factors) f.on = next.on.includes(f.id);
      update();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (baseRow) baseRow.setDisabled(readOnly);
      if (rrRow) rrRow.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'risk-array — "50% more" of a small risk', spec: { type: 'risk-array', n: 1000, base: 20, rr: 1.5, baseRange: [1, 200, 1], rrRange: [0.5, 3, 0.25] } },
  { title: 'risk-array — one in ten thousand, doubled', spec: { type: 'risk-array', n: 10000, base: 1, rr: 2, static: true } },
  {
    title: 'risk-array — risk factors multiply',
    spec: {
      type: 'risk-array', n: 100, base: 4,
      factors: [{ id: 'smoking', label: 'Smokes', mult: 2 }, { id: 'bp', label: 'High blood pressure', mult: 2 }, { id: 'diabetes', label: 'Diabetes', mult: 2 }],
      words: { people: 'people like this', without: 'With none of these', with: 'With the ones switched on' },
    },
  },
];
