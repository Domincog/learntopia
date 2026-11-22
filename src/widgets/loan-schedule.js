/**
 * loan-schedule — an instalment loan repaid in equal monthly payments. One bar
 * for each year of the loan shows how that year's payments divide between
 * interest and paying off the debt itself. The learner stretches or shortens
 * the term and sees the payment fall as the total cost rises.
 *
 * {
 *   type: 'loan-schedule',
 *   amount: 12000,                  // the sum borrowed
 *   apr: 8,                         // yearly rate in per cent, charged monthly on what is still owed (apr ÷ 12)
 *   years: 5,                       // the term at the start
 *   yearsRange: [1, 10, 1],         // optional slider for the term
 *   aprRange: [2, 12, 0.5],         // optional slider for the rate
 *   currency: '$',
 *   static: false,
 * }
 *
 * State: { years, apr, payment, totalInterest, totalPaid, firstInterest, firstPrincipal, yearly }
 *   payment          the level monthly payment, to the cent
 *   totalInterest    all interest over the term (payment × months − amount, with the unrounded payment), to the cent
 *   totalPaid        amount + totalInterest
 *   firstInterest, firstPrincipal   how the very first payment divides
 *   yearly           [{ interest, principal }] for each year of the term
 * setState accepts { years, apr }.
 *
 * The model: a fixed rate, level payments at the end of each month, no fees, no early repayment.
 * Payment = amount × m ÷ (1 − (1 + m)^−n) with m the monthly rate and n the number of months.
 */
import { frame, sliderRow, readout, hue, s, h, clamp, niceStep, ticks, addStyles } from './kit.js';

const W = 560;
const H = 270;
const PAD = { l: 56, r: 14, t: 18, b: 36 };
let seq = 0;

addStyles('loan-schedule', `
  .widget-loan-schedule .ls-key { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 14px; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-loan-schedule .ls-key i { display: inline-block; width: 12px; height: 12px; margin-right: 5px; border: 1.5px solid var(--edge-strong); border-radius: 3px; vertical-align: -1px; }
`);

/** The schedule of a level-payment loan. */
export function loanFacts(amount, apr, months) {
  const m = apr / 1200;
  const payment = m === 0 ? amount / months : (amount * m) / (1 - (1 + m) ** -months);
  let owed = amount;
  const yearly = [];
  let firstInterest = 0;
  for (let k = 0; k < months; k++) {
    const interest = owed * m;
    const principal = payment - interest;
    if (k === 0) firstInterest = interest;
    owed -= principal;
    const y = Math.floor(k / 12);
    if (!yearly[y]) yearly[y] = { interest: 0, principal: 0 };
    yearly[y].interest += interest;
    yearly[y].principal += principal;
  }
  const r2 = (v) => Math.round(v * 100) / 100;
  const totalInterest = r2(payment * months - amount);
  return {
    payment: r2(payment), totalInterest, totalPaid: r2(amount + totalInterest),
    firstInterest: r2(firstInterest), firstPrincipal: r2(payment - firstInterest),
    yearly: yearly.map((y) => ({ interest: r2(y.interest), principal: r2(y.principal) })),
  };
}

const commas = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function create(spec, env) {
  const cur = spec.currency || '$';
  const amount = spec.amount || 12000;
  const isStatic = !!spec.static || !!env.compact;
  const yRange = !isStatic && Array.isArray(spec.yearsRange) ? spec.yearsRange : null;
  const aRange = !isStatic && Array.isArray(spec.aprRange) ? spec.aprRange : null;
  const maxYears = yRange ? yRange[1] : spec.years || 5;
  let years = clamp(spec.years || 5, yRange ? yRange[0] : 1, maxYears);
  let apr = spec.apr != null ? spec.apr : 8;
  let readOnly = !!env.readOnly;
  const money = (v, d = 0) => (d ? `${cur}${commas(Math.floor(v))}.${String(Math.round((v - Math.floor(v)) * 100)).padStart(2, '0')}` : `${cur}${commas(v)}`);

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A loan, year by year' });
  const { svg } = fr;
  const pid = `ls-hatch-${++seq}`;
  svg.appendChild(s('defs', null, s('pattern', { id: pid, width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
    s('rect', { width: 8, height: 8, fill: hue('orange') }), s('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: 'var(--ink)', 'stroke-width': 2, opacity: 0.35 }))));
  const g = s('g');
  svg.appendChild(g);

  const roPay = readout('monthly payment', { color: 'blue' });
  const roInt = readout('interest in total', { color: 'orange' });
  const roAll = readout('paid in total');
  fr.readouts.append(roPay.el, roInt.el, roAll.el);
  const line = h('p.w-hint', { 'aria-live': 'polite' });
  const sliders = {};
  if (!isStatic) {
    const key = h('div.ls-key');
    key.innerHTML = `<span><i style="background:${hue('orange')}"></i>interest (hatched)</span><span><i style="background:${hue('blue')}"></i>paying off the debt</span>`;
    fr.el.insertBefore(key, fr.readouts);
    if (yRange) {
      sliders.years = sliderRow({ label: 'repaid over', min: yRange[0], max: yRange[1], step: yRange[2] || 1, value: years, color: 'blue', format: (v) => `${v} year${v === 1 ? '' : 's'}`, onInput: (v) => { if (readOnly) return; years = v; render(); env.onChange(getState()); } });
      fr.controls.appendChild(sliders.years.el);
    }
    if (aRange) {
      sliders.apr = sliderRow({ label: 'interest rate', min: aRange[0], max: aRange[1], step: aRange[2] || 0.5, value: apr, color: 'orange', unit: '%', onInput: (v) => { if (readOnly) return; apr = v; render(); env.onChange(getState()); } });
      fr.controls.appendChild(sliders.apr.el);
    }
  }
  if (!env.compact) fr.el.appendChild(line);

  const getState = () => ({ years, apr, ...loanFacts(amount, apr, years * 12) });
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  function render() {
    const f = loanFacts(amount, apr, years * 12);
    clear(g);
    const top = Math.max(...f.yearly.map((y) => y.interest + y.principal)) * 1.08;
    const x0 = PAD.l;
    const x1 = W - PAD.r;
    const y0 = PAD.t;
    const y1 = H - PAD.b;
    const sy = (v) => y1 - (v / top) * (y1 - y0);
    const step = niceStep(top, 4);
    for (const v of ticks(0, top, step)) {
      g.appendChild(s('line.grid-line', { x1: x0, x2: x1, y1: sy(v), y2: sy(v) }));
      g.appendChild(s('text.tick-label', { x: x0 - 7, y: sy(v) + 4, 'text-anchor': 'end' }, v >= 1000 ? `${cur}${Math.round(v / 100) / 10}k` : `${cur}${v}`));
    }
    const slot = (x1 - x0) / maxYears;
    const bw = Math.min(46, slot * 0.72);
    f.yearly.forEach((y, i) => {
      const cx = x0 + slot * (i + 0.5);
      const yi = sy(y.interest);
      const yt = sy(y.interest + y.principal);
      g.appendChild(s('rect', { x: cx - bw / 2, y: yt, width: bw, height: yi - yt, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      g.appendChild(s('rect', { x: cx - bw / 2, y: yi, width: bw, height: y1 - yi, fill: `url(#${pid})`, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      if (maxYears <= 12 || (i + 1) % 5 === 0 || i === 0) g.appendChild(s('text.tick-label', { x: cx, y: y1 + 16, 'text-anchor': 'middle' }, String(i + 1)));
    });
    g.appendChild(s('line.axis-line', { x1: x0, x2: x1, y1, y2: y1 }));
    g.appendChild(s('text.axis-label', { x: x1, y: H - 4, 'text-anchor': 'end' }, 'year of the loan'));
    g.appendChild(s('text.axis-label', { x: x0 + 6, y: y0 - 4, 'text-anchor': 'start' }, 'paid in that year'));
    roPay.set(money(f.payment, 2));
    roInt.set(money(f.totalInterest));
    roAll.set(money(f.totalPaid));
    line.textContent = `First payment: ${money(f.firstInterest, 2)} of interest, ${money(f.firstPrincipal, 2)} off the debt. A fixed rate, no fees.`;
    svg.setAttribute('aria-label', `${spec.alt || 'A loan, year by year'}. ${cur}${commas(amount)} at ${apr} per cent over ${years} years: ${money(f.payment, 2)} a month, ${money(f.totalInterest)} of interest in total. In the first year ${money(f.yearly[0].interest)} of the payments is interest; in the last year ${money(f.yearly[f.yearly.length - 1].interest)}.`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.years === 'number') { years = clamp(Math.round(next.years), yRange ? yRange[0] : 1, maxYears); if (sliders.years) sliders.years.set(years); }
      if (typeof next.apr === 'number') { apr = aRange ? clamp(next.apr, aRange[0], aRange[1]) : next.apr; if (sliders.apr) sliders.apr.set(apr); }
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); for (const k in sliders) sliders[k].setDisabled(readOnly); },
  };
}

export const examples = [
  { title: 'loan-schedule — stretch the term', spec: { type: 'loan-schedule', amount: 12000, apr: 8, years: 3, yearsRange: [1, 10, 1] } },
  { title: 'loan-schedule — a long home loan', spec: { type: 'loan-schedule', amount: 200000, apr: 5, years: 25, static: true } },
];
