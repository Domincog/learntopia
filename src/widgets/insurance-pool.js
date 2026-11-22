/**
 * insurance-pool — a thousand households, each with a small chance of a
 * ruinous loss in any year. Every household pays a premium into a pool; the
 * pool pays the losses of the few who are hit. The learner runs year after year
 * and watches who is hit (it changes every time) and how the pool's income and
 * payouts compare (which hardly changes at all).
 *
 * {
 *   type: 'insurance-pool',
 *   households: 1000,
 *   chance: 0.01,                   // each household's chance of the loss in one year
 *   loss: 100000,                   // the size of the loss
 *   premium: 1200,                  // what each household pays into the pool per year
 *   premiumRange: [500, 2000, 50],  // optional slider for the premium
 *   excess: 0,                      // the first part of a loss that the household bears itself
 *   what: 'house fire',             // the name of the loss
 *   currency: '$',
 *   static: false,
 * }
 *
 * State: { premium, excess, years, hits, totalHits, avgHits, paidIn, paidOut, balance, expected, margin }
 *   years      how many years have been run;  hits  households hit in the last year run
 *   totalHits, avgHits   over all years run (avgHits to one decimal; 0 before the first year)
 *   paidIn, paidOut, balance   the pool over all years run: premiums, claims, and the difference
 *   expected   the expected claim per household per year: chance × (loss − excess)
 *   margin     premium − expected: what is left per household for costs, reserves and profit (negative: the pool runs dry)
 * setState accepts { premium, years }: `years` re-runs that many fresh years.
 *
 * The model: every household has the same chance, the losses are independent of one another (no flood that
 * hits a whole town at once), every loss is the same size, and the insurer has no costs. Real insurers face
 * all four complications.
 */
import { frame, sliderRow, button, readout, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 232;
const COLS = 50;

addStyles('insurance-pool', `
  .widget-insurance-pool .ip-line { text-align: center; min-height: 2.6em; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
`);

const commas = (v) => String(Math.round(Math.abs(v))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Expected claim per household per year. */
export const expectedClaim = (chance, loss, excess = 0) => Math.round(chance * Math.max(0, loss - excess) * 100) / 100;

export default function create(spec, env) {
  const cur = spec.currency || '$';
  const n = spec.households || 1000;
  const chance = spec.chance != null ? spec.chance : 0.01;
  const loss = spec.loss || 100000;
  const excess = spec.excess || 0;
  const what = spec.what || 'loss';
  const isStatic = !!spec.static || !!env.compact;
  const range = !isStatic && Array.isArray(spec.premiumRange) ? spec.premiumRange : null;
  let premium = spec.premium != null ? spec.premium : 1200;
  let years = 0;
  let totalHits = 0;
  let last = [];            // indices hit in the last year
  let paidIn = 0;
  let paidOut = 0;
  let readOnly = !!env.readOnly;
  const money = (v) => `${v < 0 ? '−' : ''}${cur}${commas(v)}`;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A pool of insured households' });
  const { svg } = fr;
  const rows = Math.ceil(n / COLS);
  const cell = Math.min((W - 40) / COLS, (H - 24) / rows);
  const x0 = (W - cell * COLS) / 2;
  const y0 = (H - cell * rows) / 2;
  const dots = [];
  for (let i = 0; i < n; i++) {
    const d = s('circle', { cx: x0 + (i % COLS + 0.5) * cell, cy: y0 + (Math.floor(i / COLS) + 0.5) * cell, r: cell * 0.3 });
    dots.push(d);
    svg.appendChild(d);
  }

  const roHits = readout('hit this year', { color: 'red' });
  const roIn = readout('premiums in');
  const roOut = readout('claims paid');
  const roBal = readout('pool, all years', { color: 'teal' });
  fr.readouts.append(roHits.el, roIn.el, roOut.el, roBal.el);
  const line = h('p.ip-line', { 'aria-live': 'polite' });
  let slider = null;
  const btns = [];
  if (!isStatic) {
    if (range) {
      slider = sliderRow({ label: 'premium a year', min: range[0], max: range[1], step: range[2] || 50, value: premium, color: 'blue', format: (v) => money(v), onInput: (v) => { if (readOnly) return; premium = v; reset(); render(); env.onChange(getState()); } });
      fr.controls.appendChild(slider.el);
    }
    btns.push(button('Run a year', () => run(1, true), { icon: 'play', variant: 'primary' }));
    btns.push(button('Run 10 years', () => run(10, true), { icon: 'play' }));
    btns.push(button('Start again', () => { if (readOnly) return; reset(); render(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' }));
    fr.buttons.append(...btns);
  }
  if (!env.compact) fr.el.insertBefore(line, fr.readouts);

  function reset() { years = 0; totalHits = 0; last = []; paidIn = 0; paidOut = 0; }
  function oneYear() {
    last = [];
    for (let i = 0; i < n; i++) if (env.rng.bool(chance)) last.push(i);
    years++;
    totalHits += last.length;
    paidIn += n * premium;
    paidOut += last.length * Math.max(0, loss - excess);
  }
  function run(count, notify) {
    if (notify && readOnly) return;
    for (let k = 0; k < count; k++) oneYear();
    render();
    if (notify) { play('tick'); env.announce(line.textContent); env.onChange(getState()); }
  }

  function getState() {
    const expected = expectedClaim(chance, loss, excess);
    return { premium, excess, years, hits: last.length, totalHits, avgHits: years ? Math.round((totalHits / years) * 10) / 10 : 0, paidIn, paidOut, balance: paidIn - paidOut, expected, margin: premium - expected };
  }

  function render() {
    const hit = new Set(last);
    dots.forEach((d, i) => {
      const on = hit.has(i);
      d.setAttribute('fill', on ? hue('red') : hue('blue', 'soft'));
      d.setAttribute('stroke', on ? 'var(--ink)' : hue('blue'));
      d.setAttribute('stroke-width', on ? 2 : 1);
      d.setAttribute('r', on ? cell * 0.48 : cell * 0.3);
    });
    const f = getState();
    roHits.set(years ? `${f.hits} of ${commas(n)}` : '—');
    roIn.set(years ? money(n * premium) : '—');
    roOut.set(years ? money(f.hits * Math.max(0, loss - excess)) : '—');
    roBal.set(years ? money(f.balance) : '—');
    line.textContent = years
      ? `Year ${years}: ${f.hits} household${f.hits === 1 ? '' : 's'} had a ${what}${excess ? ` and each bears the first ${money(excess)}` : ''}. Average so far: ${f.avgHits} a year. Every household paid ${money(premium)}.`
      : `Each dot is a household. Each has a ${Math.round(chance * 1000) / 10}% chance of a ${what} costing ${money(loss)} in any year, and pays ${money(premium)} a year into the pool.`;
    for (const b of btns) b.disabled = readOnly;
    svg.setAttribute('aria-label', `${spec.alt || 'A pool of insured households'}. ${line.textContent}`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.premium === 'number') { premium = range ? clamp(next.premium, range[0], range[1]) : next.premium; if (slider) slider.set(premium); reset(); }
      if (typeof next.years === 'number') { reset(); for (let k = 0; k < Math.min(200, next.years); k++) oneYear(); }
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); if (slider) slider.setDisabled(readOnly); render(); },
  };
}

export const examples = [
  { title: 'insurance-pool — a thousand households', spec: { type: 'insurance-pool', households: 1000, chance: 0.01, loss: 100000, premium: 1200, what: 'house fire' } },
  { title: 'insurance-pool — find the break-even premium', spec: { type: 'insurance-pool', households: 1000, chance: 0.01, loss: 100000, premium: 600, premiumRange: [500, 2000, 50], what: 'house fire' } },
];
