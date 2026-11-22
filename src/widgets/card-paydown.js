/**
 * card-paydown — paying off a credit-card balance, month by month. The chart
 * shows the balance falling under two plans: paying only the minimum the card
 * asks for (dashed), and paying a fixed amount the learner chooses. Readouts
 * give the time it takes and what the interest comes to.
 *
 * {
 *   type: 'card-paydown',
 *   balance: 2000,                  // what is owed at the start; nothing more is spent on the card
 *   apr: 18,                        // yearly rate in per cent; each month balance × apr / 12 is added
 *   minPct: 2.5, minFloor: 25,      // the minimum payment: this share of what is owed, but at least the floor
 *   mode: 'min',                    // which plan is selected at the start: 'min' or 'fixed'
 *   payment: 100,                   // the fixed monthly payment at the start
 *   paymentRange: [30, 400, 10],    // its slider: [min, max, step]
 *   fixedOnly: false,               // true: no switch and no minimum-only line; the fixed plan is always the selected one
 *   currency: '$',
 *   static: false,
 * }
 *
 * State: { mode, payment, months, interest, paid, cleared, min }
 *   months, interest, paid   for the selected plan: months until nothing is owed, total interest, total paid
 *                            (months is null, the sums 0, when the payment never covers the interest)
 *   cleared                  the selected plan pays the debt off
 *   min                      { months, interest, paid } for the minimum-only plan, whatever is selected
 * setState accepts { mode, payment }.
 *
 * The model: interest is added once a month at apr ÷ 12 on what is owed, rounded to the cent; then the payment
 * is taken. No new spending, no fees, no missed payments, a rate that never changes. Real cards differ in how
 * they set the minimum and count the days.
 */
import { frame, plane, drawAxes, sliderRow, readout, hue, s, h, clamp, niceStep, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 270;

addStyles('card-paydown', `
  .widget-card-paydown .cp-modes { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-card-paydown .cp-mode { min-height: 40px; padding: 0.35rem 0.9rem; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--surface); color: var(--ink); font: inherit; font-size: var(--fs-sm); font-weight: 800; cursor: pointer; }
  .widget-card-paydown .cp-mode[aria-pressed='true'] { background: var(--blue-soft); box-shadow: inset 0 0 0 2px var(--blue); }
  .widget-card-paydown .cp-mode:disabled { cursor: default; opacity: 0.75; }
  .widget-card-paydown .cp-tag { font-family: var(--font-body); font-weight: 800; font-size: 13px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-card-paydown .cp-tag { font-size: 17px; } }
`);

const cents = (v) => Math.round(v * 100) / 100;

/**
 * Follow a card balance down. `pay` is 'min' or a fixed monthly amount.
 * Returns { months, interest, paid, cleared, path } where path[m] is what is owed after m payments.
 */
export function cardPlan({ balance, apr, minPct = 2.5, minFloor = 25 }, pay, cap = 1200) {
  let owed = balance;
  let interest = 0;
  let paid = 0;
  const path = [owed];
  while (owed > 0.005 && path.length <= cap) {
    const add = cents((owed * apr) / 1200);
    const due = owed + add;
    const want = pay === 'min' ? Math.max(minFloor, cents((due * minPct) / 100)) : pay;
    const p = Math.min(due, want);
    if (pay !== 'min' && p <= add && due > p) return { months: null, interest: 0, paid: 0, cleared: false, path: [balance] };
    owed = cents(due - p);
    interest += add;
    paid += p;
    path.push(owed);
  }
  return { months: path.length - 1, interest: cents(interest), paid: cents(paid), cleared: owed <= 0.005, path };
}

const commas = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** 128 -> "10 years 8 months" */
export const span = (months) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} year${y === 1 ? '' : 's'}` : '', m || !y ? `${m} month${m === 1 ? '' : 's'}` : ''].filter(Boolean).join(' ');
};

export default function create(spec, env) {
  const cur = spec.currency || '$';
  const card = { balance: spec.balance || 2000, apr: spec.apr != null ? spec.apr : 18, minPct: spec.minPct != null ? spec.minPct : 2.5, minFloor: spec.minFloor != null ? spec.minFloor : 25 };
  const isStatic = !!spec.static || !!env.compact;
  const range = Array.isArray(spec.paymentRange) ? spec.paymentRange : [30, 400, 10];
  const fixedOnly = !!spec.fixedOnly;
  let mode = fixedOnly || spec.mode === 'fixed' ? 'fixed' : 'min';
  let payment = clamp(spec.payment != null ? spec.payment : 100, range[0], range[1]);
  let readOnly = !!env.readOnly;
  const money = (v) => `${cur}${commas(v)}`;

  const minPlan = cardPlan(card, 'min');
  const xMax = Math.max(12, Math.ceil(Math.min(minPlan.months, 360) / 12) * 12);
  const pl = plane({ x: [0, xMax], y: [0, card.balance * 1.08], width: W, height: H, pad: { l: 54, r: 16, t: 14, b: 36 } });

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Paying off a card balance' });
  const { svg } = fr;
  svg.appendChild(drawAxes(pl, { xStep: xMax > 72 ? 24 : 12, yStep: niceStep(card.balance, 4), xFormat: (v) => (v % 12 === 0 ? `${v / 12}` : ''), yFormat: (v) => (v >= 1000 ? `${cur}${Math.round(v / 100) / 10}k` : `${cur}${v}`), xLabel: 'years', yLabel: 'still owed' }));
  const pathOf = (plan) => plan.path.map((v, m) => `${m ? 'L' : 'M'}${pl.sx(Math.min(m, xMax)).toFixed(1)} ${pl.sy(v).toFixed(1)}`).join('');
  const minLine = s('path', { d: pathOf(minPlan), fill: 'none', stroke: hue('red'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': '3 8' });
  const fixLine = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const minTag = s('text.cp-tag', { 'text-anchor': 'start', fill: hue('red', 'text') }, 'minimum only');
  const fixTag = s('text.cp-tag', { 'text-anchor': 'start', fill: hue('blue', 'text') }, '');
  const mid = minPlan.path[Math.floor(minPlan.months * 0.6)] || 0;
  minTag.setAttribute('x', pl.sx(Math.min(minPlan.months * 0.6, xMax * 0.7)) + 8);
  minTag.setAttribute('y', pl.sy(mid) - 9);
  if (!fixedOnly) svg.append(minLine, minTag);   // the minimum-only plan is the reference line, unless the step is about a fixed payment alone
  svg.append(fixLine, fixTag);

  const roTime = readout('debt-free after', { color: 'blue' });
  const roInt = readout('interest paid', { color: 'orange' });
  const roPaid = readout('paid in total');
  fr.readouts.append(roTime.el, roInt.el, roPaid.el);

  let slider = null;
  const modeBtns = {};
  if (!isStatic) {
    if (!fixedOnly) {
      const wrap = h('div.cp-modes', { role: 'group', 'aria-label': 'Payment plan' });
      for (const [id, label] of [['min', 'Pay the minimum'], ['fixed', 'Pay a fixed amount']]) {
        const b = h('button.cp-mode', { type: 'button', 'aria-pressed': 'false' }, label);
        b.dataset.keys = 'own';
        b.addEventListener('click', () => { if (readOnly) return; mode = id; play('select'); render(); env.onChange(getState()); });
        modeBtns[id] = b;
        wrap.appendChild(b);
      }
      fr.el.insertBefore(wrap, fr.controls);
    }
    slider = sliderRow({ label: 'fixed payment a month', min: range[0], max: range[1], step: range[2] || 10, value: payment, color: 'blue', format: (v) => money(v), onInput: (v) => { if (readOnly) return; payment = v; mode = 'fixed'; render(); env.onChange(getState()); } });
    fr.controls.appendChild(slider.el);
    fr.el.appendChild(h('p.w-hint', `Interest is added each month: one twelfth of ${card.apr}% a year, on what is owed.${fixedOnly ? '' : ` The minimum is ${card.minPct}% of what is owed, at least ${money(card.minFloor)}.`} No new spending, no fees.`));
  }

  const current = () => (mode === 'min' ? minPlan : cardPlan(card, payment));
  function getState() {
    const p = current();
    return { mode, payment, months: p.months, interest: p.interest, paid: p.paid, cleared: p.cleared, min: { months: minPlan.months, interest: minPlan.interest, paid: minPlan.paid } };
  }

  function render() {
    const p = current();
    for (const id in modeBtns) modeBtns[id].setAttribute('aria-pressed', String(id === mode));
    if (mode === 'fixed' && p.cleared) {
      fixLine.setAttribute('d', pathOf(p));
      const at = Math.floor(p.months / 2);
      fixTag.textContent = `${money(payment)} a month`;
      fixTag.setAttribute('x', pl.sx(Math.min(at, xMax)) + 10);
      fixTag.setAttribute('y', pl.sy(p.path[at]) - 6);
      fixTag.setAttribute('visibility', pl.sx(Math.min(at, xMax)) < W - 150 ? 'visible' : 'hidden');
    } else {
      fixLine.setAttribute('d', '');
      fixTag.textContent = '';
    }
    if (p.cleared) {
      roTime.set(span(p.months));
      roInt.set(money(p.interest));
      roPaid.set(money(p.paid));
    } else {
      roTime.set('never');
      roInt.set('more each month');
      roPaid.set('no end');
    }
    svg.setAttribute('aria-label', `${spec.alt || 'Paying off a card balance'}. ${mode === 'min' ? 'Paying the minimum' : `Paying ${money(payment)} a month`}: ${p.cleared ? `debt-free after ${span(p.months)}, ${money(p.interest)} of interest, ${money(p.paid)} paid in total` : 'the payment does not cover the interest, so the debt never ends'}.`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.payment === 'number') { payment = clamp(next.payment, range[0], range[1]); if (slider) slider.set(payment); if (!next.mode) mode = 'fixed'; }
      if (next.mode === 'min' && !fixedOnly) mode = 'min';
      if (next.mode === 'fixed') mode = 'fixed';
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); if (slider) slider.setDisabled(readOnly); },
  };
}

export const examples = [
  { title: 'card-paydown — the minimum against a fixed payment', spec: { type: 'card-paydown', balance: 2000, apr: 18, minPct: 2.5, minFloor: 25, payment: 100 } },
];
