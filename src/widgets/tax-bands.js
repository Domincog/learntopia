/**
 * tax-bands — income tax charged slice by slice. Yearly income runs along a bar
 * that is cut into bands; inside each band the share of every dollar taken in
 * tax is shaded from the bottom, so the shaded AREA is the tax bill. The learner
 * slides the income and sees that crossing a band line changes only what
 * happens to the dollars beyond it.
 *
 * {
 *   type: 'tax-bands',
 *   bands: [                        // in order; the last one has upTo: null
 *     { upTo: 10000, rate: 0 }, { upTo: 40000, rate: 0.2 }, { upTo: 80000, rate: 0.3 }, { upTo: null, rate: 0.4 },
 *   ],
 *   income: 30000,                  // where the slider starts
 *   max: 120000, step: 1000,        // the slider's range
 *   compare: 39000,                 // optional: a second, fixed income marked "before"
 *   benefit: { amount: 2400, until: 30000, label: 'housing benefit' },   // optional: a payment that stops dead above a threshold
 *   currency: '$',
 *   static: false,                  // true: a picture without the slider
 * }
 *
 * State: { income, tax, net, marginal, average, perBand, benefit, pocket }
 *   tax, net   income tax on the whole income, and income − tax
 *   marginal   the rate on the next dollar earned, in per cent (an income exactly on a band line is in the band above)
 *   average    tax ÷ income, in per cent, to two decimals (0 for no income)
 *   perBand    tax charged inside each band
 *   benefit    the benefit received at this income (0 without a `benefit` spec); pocket = net + benefit
 * setState accepts { income }.
 *
 * The model: one tax, one person, a whole year. Real systems add social contributions, allowances,
 * credits and benefits that are withdrawn as income rises; the `benefit` option shows the simplest such case.
 */
import { frame, sliderRow, readout, hue, s, clamp, addStyles } from './kit.js';

const W = 560;
let seq = 0;
const H = 250;
const X0 = 22;
const X1 = 540;
const Y0 = 46;      // top of the bar: 100% of each dollar
const Y1 = 176;     // bottom of the bar

addStyles('tax-bands', `
  .widget-tax-bands .tb-rate { font-family: var(--font-body); font-weight: 800; font-size: 15px; fill: var(--ink); }
  .widget-tax-bands .tb-mark { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  .widget-tax-bands .tb-key { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 14px; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-tax-bands .tb-key i { display: inline-block; width: 12px; height: 12px; margin-right: 5px; border: 1.5px solid var(--edge-strong); border-radius: 3px; vertical-align: -1px; }
  @media (max-width: 520px) { .widget-tax-bands .tb-rate { font-size: 19px; } .widget-tax-bands .tb-mark { font-size: 17px; } }
`);

/** Tax on a yearly income, band by band. Returns { tax, perBand, marginal }. */
export function taxFor(income, bands) {
  let from = 0;
  let tax = 0;
  let marginal = bands.length ? bands[bands.length - 1].rate : 0;
  let found = false;
  const perBand = bands.map((b) => {
    const to = b.upTo == null ? Infinity : b.upTo;
    const part = Math.max(0, Math.min(income, to) - from) * b.rate;
    if (!found && income < to) { marginal = b.rate; found = true; }
    from = to;
    tax += part;
    return Math.round(part * 100) / 100;
  });
  return { tax: Math.round(tax * 100) / 100, perBand, marginal };
}

const commas = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const short = (v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v));

export default function create(spec, env) {
  const bands = Array.isArray(spec.bands) && spec.bands.length ? spec.bands : [{ upTo: null, rate: 0.2 }];
  const cur = spec.currency || '$';
  const max = spec.max || 120000;
  const step = spec.step || 1000;
  const isStatic = !!spec.static || !!env.compact;
  const benefit = spec.benefit && spec.benefit.amount ? spec.benefit : null;
  let income = clamp(spec.income != null ? spec.income : 30000, 0, max);
  let readOnly = !!env.readOnly;

  const HH = benefit ? H : H - 38;
  const fr = frame({ width: W, height: HH, compact: env.compact, label: spec.alt || 'Income tax bands' });
  const { svg } = fr;
  const sx = (v) => X0 + (Math.min(v, max) / max) * (X1 - X0);
  const money = (v) => `${cur}${commas(v)}`;

  // hatching for the tax area, so that it does not rely on colour alone
  const pid = `tb-hatch-${++seq}`;
  svg.appendChild(s('defs', null, s('pattern', { id: pid, width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
    s('rect', { width: 8, height: 8, fill: hue('orange') }), s('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: 'var(--ink)', 'stroke-width': 2, opacity: 0.35 }))));

  const gFill = s('g');
  const gFrame = s('g');
  const gMarks = s('g');
  svg.append(gFill, gFrame, gMarks);

  // the fixed parts: band outlines, rates, thresholds
  let from = 0;
  bands.forEach((b, i) => {
    const to = b.upTo == null ? max : Math.min(b.upTo, max);
    if (to <= from) return;
    const xa = sx(from);
    const xb = sx(to);
    gFrame.appendChild(s('rect', { x: xa, y: Y0, width: xb - xa, height: Y1 - Y0, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    gFrame.appendChild(s('text.tb-rate', { x: (xa + xb) / 2, y: Y0 - 8, 'text-anchor': 'middle' }, `${Math.round(b.rate * 1000) / 10}%`));
    if (i > 0) gFrame.appendChild(s('text.tick-label', { x: xa, y: Y1 + 17, 'text-anchor': 'middle' }, `${cur}${short(from)}`));
    from = to;
  });
  gFrame.appendChild(s('text.tick-label', { x: X0, y: Y1 + 17, 'text-anchor': 'start' }, `${cur}0`));
  gFrame.appendChild(s('text.axis-label', { x: X1, y: HH - 8, 'text-anchor': 'end' }, 'yearly income'));
  gFrame.appendChild(s('text.axis-label', { x: X0, y: 16, 'text-anchor': 'start' }, 'tax rate on each slice'));
  if (benefit) {
    const xb = sx(benefit.until);
    gFrame.appendChild(s('rect', { x: X0, y: Y1 + 26, width: xb - X0, height: 14, rx: 4, fill: hue('teal', 'soft'), stroke: hue('teal'), 'stroke-width': 2 }));
    gFrame.appendChild(s('text.fig-label-sm', { x: X0 + 6, y: Y1 + 54, 'text-anchor': 'start' }, `${benefit.label || 'benefit'}: ${money(benefit.amount)} a year, up to ${money(benefit.until)}`));
  }

  const roTax = readout('income tax', { color: 'orange' });
  const roNet = readout('take-home', { color: 'green' });
  const roMarg = readout('on the next dollar');
  const roAvg = readout('on average');
  const roPocket = benefit ? readout('pay + benefit', { color: 'teal' }) : null;
  fr.readouts.append(roTax.el, roNet.el, roMarg.el, roAvg.el);
  if (roPocket) fr.readouts.appendChild(roPocket.el);

  let slider = null;
  if (!isStatic) {
    slider = sliderRow({ label: 'yearly income', min: 0, max, step, value: income, color: 'blue', format: (v) => money(v), onInput: (v) => { if (readOnly) return; income = v; render(); env.onChange(getState()); } });
    fr.controls.appendChild(slider.el);
    const key = document.createElement('div');
    key.className = 'tb-key';
    key.innerHTML = `<span><i style="background:${hue('orange')}"></i>taken in tax (hatched)</span><span><i style="background:${hue('green', 'soft')}"></i>kept</span>`;
    fr.el.insertBefore(key, fr.readouts);
  }

  function facts() {
    const t = taxFor(income, bands);
    const got = benefit && income <= benefit.until ? benefit.amount : 0;
    const net = Math.round((income - t.tax) * 100) / 100;
    return { income, tax: t.tax, net, marginal: Math.round(t.marginal * 1000) / 10, average: income > 0 ? Math.round((t.tax / income) * 10000) / 100 : 0, perBand: t.perBand, benefit: got, pocket: net + got };
  }
  const getState = () => facts();

  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  function marker(v, label, color, dashed, up) {
    const x = sx(v);
    gMarks.appendChild(s('line', { x1: x, x2: x, y1: Y0 - 2, y2: Y1 + 4, stroke: hue(color), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': dashed ? '5 6' : null }));
    const anchor = x > W - 120 ? 'end' : x < 110 ? 'start' : 'middle';
    gMarks.appendChild(s('text.tb-mark', { x: anchor === 'end' ? x - 6 : anchor === 'start' ? x + 6 : x, y: up ? Y0 + 16 : Y1 - 8, 'text-anchor': anchor }, label));
  }

  function render() {
    const f = facts();
    clear(gFill);
    clear(gMarks);
    let lo = 0;
    for (const b of bands) {
      const to = b.upTo == null ? max : Math.min(b.upTo, max);
      const hi = Math.min(income, to);
      if (hi > lo) {
        const xa = sx(lo);
        const w = sx(hi) - xa;
        const th = (Y1 - Y0) * b.rate;
        gFill.appendChild(s('rect', { x: xa, y: Y0, width: w, height: Y1 - Y0 - th, fill: hue('green', 'soft') }));
        if (th > 0) gFill.appendChild(s('rect', { x: xa, y: Y1 - th, width: w, height: th, fill: `url(#${pid})` }));
      }
      lo = to;
      if (lo >= max) break;
    }
    if (spec.compare != null) marker(spec.compare, `before: ${money(spec.compare)}`, 'violet', true, true);
    marker(income, money(income), 'blue', false, false);
    roTax.set(money(f.tax));
    roNet.set(money(f.net));
    roMarg.set(`${f.marginal}%`);
    roAvg.set(`${f.average}%`);
    if (roPocket) roPocket.set(money(f.pocket));
    svg.setAttribute('aria-label', `${spec.alt || 'Income tax bands'}. Income ${money(income)}: tax ${money(f.tax)}, take-home ${money(f.net)}; the next dollar is taxed at ${f.marginal} per cent, the average rate is ${f.average} per cent.${benefit ? ` Benefit received: ${money(f.benefit)}.` : ''}`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || typeof next.income !== 'number') return;
      income = clamp(next.income, 0, max);
      if (slider) slider.set(income);
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); if (slider) slider.setDisabled(readOnly); },
  };
}

const BANDS = [{ upTo: 10000, rate: 0 }, { upTo: 40000, rate: 0.2 }, { upTo: 80000, rate: 0.3 }, { upTo: null, rate: 0.4 }];

export const examples = [
  { title: 'tax-bands — slide the income', spec: { type: 'tax-bands', bands: BANDS, income: 50000, max: 120000 } },
  { title: 'tax-bands — a benefit that stops at a threshold', spec: { type: 'tax-bands', bands: BANDS, income: 30000, max: 60000, step: 500, benefit: { amount: 2400, until: 30000, label: 'housing benefit' } } },
];
