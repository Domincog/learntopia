/**
 * inflation-clock — what rising prices do to a fixed sum of money. A dial counts
 * the years; beside it a hundred squares stand for what the money bought at the
 * start, and they empty one by one as prices rise. The learner turns the clock
 * forward by slider or lets it run, and can change the yearly rate of inflation.
 *
 * {
 *   type: 'inflation-clock',
 *   amount: 100,                    // the sum of money that sits still
 *   rate: 3,                        // yearly inflation in per cent
 *   rateRange: [0, 10, 0.5],        // optional slider for the rate: [min, max, step] (not below 0)
 *   years: 0,                       // where the clock starts
 *   maxYears: 40,
 *   currency: '$',
 *   static: false,
 * }
 *
 * State: { rate, years, power, price, halved, ran }
 *   power   what the amount buys after `years`, in the money of year 0: amount ÷ (1 + rate)^years, to the cent
 *   price   what a basket that cost `amount` in year 0 costs now: amount × (1 + rate)^years, to the cent
 *   halved  power is at most half of the amount
 *   ran     the clock has been moved or run by the learner
 * setState accepts { rate, years }.
 *
 * The model: one steady rate of inflation, every year, for every kind of goods. Real inflation changes from
 * year to year and differs between households, because no two buy the same basket.
 */
import { frame, sliderRow, button, readout, loop, hue, s, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 236;
const CX = 112;
const CY = 124;
const R = 74;
const GX = 262;     // the grid of a hundred squares
const GY = 46;
const CELL = 17;

addStyles('inflation-clock', `
  .widget-inflation-clock .ic-year { font-family: var(--font-display); font-weight: 800; font-size: 34px; fill: var(--ink); }
  .widget-inflation-clock .ic-small { font-family: var(--font-body); font-weight: 700; font-size: 13px; fill: var(--ink-2); }
  @media (max-width: 520px) { .widget-inflation-clock .ic-small { font-size: 17px; } }
`);

/** Buying power and price level after t years at a yearly inflation rate (%). */
export function inflate(amount, ratePct, years) {
  const f = (1 + ratePct / 100) ** years;
  return { power: Math.round((amount / f) * 100) / 100, price: Math.round(amount * f * 100) / 100 };
}

const commas = (v, d = 2) => { const [w, p] = v.toFixed(d).split('.'); return w.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (p ? `.${p}` : ''); };

export default function create(spec, env) {
  const cur = spec.currency || '$';
  const amount = spec.amount || 100;
  const maxYears = spec.maxYears || 40;
  const isStatic = !!spec.static || !!env.compact;
  const range = !isStatic && Array.isArray(spec.rateRange) ? spec.rateRange : null;
  let rate = Math.max(0, spec.rate != null ? spec.rate : 3);
  let years = clamp(spec.years || 0, 0, maxYears);
  let ran = false;
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Inflation clock' });
  const { svg } = fr;

  // the dial
  svg.appendChild(s('circle', { cx: CX, cy: CY, r: R, fill: 'var(--surface)', stroke: 'var(--hair)', 'stroke-width': 12 }));
  const arc = s('path', { fill: 'none', stroke: hue('orange'), 'stroke-width': 12, 'stroke-linecap': 'round' });
  svg.appendChild(arc);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 2 * Math.PI;
    svg.appendChild(s('line', { x1: CX + Math.sin(a) * (R + 10), y1: CY - Math.cos(a) * (R + 10), x2: CX + Math.sin(a) * (R + 16), y2: CY - Math.cos(a) * (R + 16), stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
  }
  svg.appendChild(s('text.ic-small', { x: CX, y: CY - 22, 'text-anchor': 'middle' }, 'year'));
  const yearText = s('text.ic-year', { x: CX, y: CY + 16, 'text-anchor': 'middle' }, '0');
  const rateText = s('text.ic-small', { x: CX, y: CY + 40, 'text-anchor': 'middle' }, '');
  svg.append(yearText, rateText);

  // the hundred squares
  const title = s('text.ic-small', { x: GX, y: GY - 14, 'text-anchor': 'start' }, '');
  svg.appendChild(title);
  const cells = [];
  for (let i = 0; i < 100; i++) {
    const c = s('rect', { x: GX + (i % 10) * CELL, y: GY + Math.floor(i / 10) * CELL, width: CELL - 3, height: CELL - 3, rx: 3, 'stroke-width': 1.5 });
    cells.push(c);
    svg.appendChild(c);
  }
  const side = s('text.ic-small', { x: GX + 10 * CELL + 12, y: GY + 16, 'text-anchor': 'start' }, '');
  const side2 = s('text.ic-small', { x: GX + 10 * CELL + 12, y: GY + 34, 'text-anchor': 'start' }, '');
  svg.append(side, side2);

  const roPower = readout(`${cur}${amount} now buys what`, { color: 'teal' });
  const roPrice = readout(`a ${cur}${amount} basket now costs`, { color: 'orange' });
  fr.readouts.append(roPower.el, roPrice.el);

  let yearSlider = null;
  let rateSlider = null;
  let goBtn = null;
  let acc = 0;
  const anim = loop((dt) => {
    acc += dt;
    if (acc < 0.22) return;
    acc = 0;
    years = Math.min(maxYears, years + 1);
    if (yearSlider) yearSlider.set(years);
    render();
    if (years >= maxYears) { anim.stop(); play('tick'); env.announce(describe()); env.onChange(getState()); render(); }
  });

  if (!isStatic) {
    yearSlider = sliderRow({ label: 'years gone by', min: 0, max: maxYears, step: 1, value: years, color: 'orange', onInput: (v) => { if (readOnly) return; anim.stop(); years = v; ran = true; render(); env.onChange(getState()); } });
    fr.controls.appendChild(yearSlider.el);
    if (range) {
      rateSlider = sliderRow({ label: 'inflation a year', min: Math.max(0, range[0]), max: range[1], step: range[2] || 0.5, value: rate, color: 'red', unit: '%', onInput: (v) => { if (readOnly) return; rate = v; ran = true; render(); env.onChange(getState()); } });
      fr.controls.appendChild(rateSlider.el);
    }
    goBtn = button('Run the clock', () => {
      if (readOnly) return;
      ran = true;
      if (anim.running) { anim.stop(); render(); env.onChange(getState()); return; }
      if (years >= maxYears) years = 0;
      if (reducedMotion()) { years = maxYears; if (yearSlider) yearSlider.set(years); render(); env.onChange(getState()); return; }
      acc = 0;
      anim.start();
      render();
    }, { icon: 'play', variant: 'primary' });
    fr.buttons.appendChild(goBtn);
  }

  const facts = () => { const f = inflate(amount, rate, years); return { rate, years, power: f.power, price: f.price, halved: f.power <= amount / 2, ran }; };
  const getState = () => facts();
  const describe = () => { const f = facts(); return `After ${years} years at ${rate} per cent, ${cur}${amount} buys what ${cur}${commas(f.power)} bought at the start.`; };

  function render() {
    const f = facts();
    const frac = years / maxYears;
    if (frac <= 0) arc.setAttribute('d', '');
    else if (frac >= 1) arc.setAttribute('d', `M${CX} ${CY - R}A${R} ${R} 0 1 1 ${CX - 0.01} ${CY - R}`);
    else {
      const a = frac * 2 * Math.PI;
      arc.setAttribute('d', `M${CX} ${CY - R}A${R} ${R} 0 ${frac > 0.5 ? 1 : 0} 1 ${(CX + Math.sin(a) * R).toFixed(2)} ${(CY - Math.cos(a) * R).toFixed(2)}`);
    }
    yearText.textContent = String(years);
    rateText.textContent = `prices +${rate}% a year`;
    const full = Math.round((f.power / amount) * 100);
    cells.forEach((c, i) => {
      const on = i < full;
      c.setAttribute('fill', on ? hue('teal') : 'none');
      c.setAttribute('stroke', on ? 'var(--ink)' : 'var(--hair)');
    });
    title.textContent = `What ${cur}${amount} still buys`;
    side.textContent = `${full} of 100`;
    side2.textContent = 'squares left';
    roPower.set(`${cur}${commas(f.power)} did`);
    roPrice.set(`${cur}${commas(f.price)}`);
    if (goBtn) { goBtn.lastChild.textContent = anim.running ? 'Pause' : years >= maxYears ? 'Run again' : 'Run the clock'; goBtn.disabled = readOnly; }
    svg.setAttribute('aria-label', `${spec.alt || 'Inflation clock'}. ${describe()} A basket that cost ${cur}${amount} now costs ${cur}${commas(f.price)}.`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (typeof next.rate === 'number') { rate = range ? clamp(next.rate, Math.max(0, range[0]), range[1]) : Math.max(0, next.rate); if (rateSlider) rateSlider.set(rate); }
      if (typeof next.years === 'number') { years = clamp(Math.round(next.years), 0, maxYears); if (yearSlider) yearSlider.set(years); }
      ran = true;
      render();
    },
    setReadOnly(v) { readOnly = !!v; if (readOnly) anim.stop(); fr.el.classList.toggle('is-readonly', readOnly); if (yearSlider) yearSlider.setDisabled(readOnly); if (rateSlider) rateSlider.setDisabled(readOnly); render(); },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'inflation-clock — 3% a year', spec: { type: 'inflation-clock', rate: 3, years: 20 } },
  { title: 'inflation-clock — choose the rate', spec: { type: 'inflation-clock', rate: 6, rateRange: [0, 10, 0.5], years: 0 } },
];
