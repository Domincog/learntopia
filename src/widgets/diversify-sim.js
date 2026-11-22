/**
 * diversify-sim — one year in the life of 200 investors. Each holds the same
 * number of randomly chosen companies, in equal amounts. Every company's
 * return is the market's return that year plus its own good or bad luck. The
 * chart shows how the 200 investors fared. With one company each, they are
 * scattered far and wide; with many, they huddle round the market — and the
 * whole huddle still jumps up and down from year to year with the market.
 *
 * {
 *   type: 'diversify-sim',
 *   options: [1, 4, 25, 100],       // the numbers of companies the learner can choose
 *   n: 1,                           // the choice at the start
 *   market: { mean: 6, sd: 15 },    // the market's yearly return in per cent: average and typical swing
 *   specific: 30,                   // the typical swing of one company's own luck, in percentage points
 *   investors: 200,
 *   static: false,
 * }
 *
 * State: { n, years, market, best, worst, spread, specific, marketSd, seen }
 *   years     years run with the current number of companies (0 after a change)
 *   market    the market's return in the last year run, in per cent, one decimal (null before the first year)
 *   best, worst, spread   the luckiest and unluckiest investor that year, and the standard deviation across investors
 *   specific  the swing left from company luck with n companies: the single-company swing ÷ √n, two decimals
 *   marketSd  the market's swing, which no number of companies removes
 *   seen      the numbers of companies for which at least one year has been run, in ascending order
 * setState accepts { n, years }: `years` runs that many fresh years (default 1 when only n is given).
 *
 * The model: returns are drawn from bell curves; companies' own luck is independent from one company to the
 * next; every holding is the same size; no costs. Real returns have fatter tails, and companies in one
 * industry or country share some of their luck, so real portfolios need more holdings than this for the same effect.
 */
import { frame, button, readout, hue, s, h, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 240;
const X0 = 24;
const X1 = 536;
const Y0 = 30;
const Y1 = 190;
const LO = -70;
const HI = 90;
const BIN = 4;

addStyles('diversify-sim', `
  .widget-diversify-sim .ds-pick { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); font-size: var(--fs-sm); font-weight: 700; }
  .widget-diversify-sim .ds-pick button[aria-pressed='true'] { background: var(--blue-soft); box-shadow: inset 0 0 0 2px var(--blue); }
  .widget-diversify-sim .ds-line { text-align: center; min-height: 2.6em; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-diversify-sim .ds-tag { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-diversify-sim .ds-tag { font-size: 17px; } }
`);

/** The swing (standard deviation) left from company-specific luck when n equal, independent holdings are combined. */
export const specificRisk = (single, n) => Math.round((single / Math.sqrt(n)) * 100) / 100;

const signed = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}%`;

export default function create(spec, env) {
  const options = Array.isArray(spec.options) && spec.options.length ? spec.options : [1, 4, 25, 100];
  const mkt = { mean: 6, sd: 15, ...(spec.market || {}) };
  const single = spec.specific || 30;
  const count = spec.investors || 200;
  const isStatic = !!spec.static || !!env.compact;
  let n = options.includes(spec.n) ? spec.n : options[0];
  let years = 0;
  let result = null;          // { market, values }
  const seen = new Set();
  let readOnly = !!env.readOnly;

  // a draw from a bell curve (Box–Muller), using the lesson's seeded generator
  const gauss = () => { let u = env.rng.float(); if (u < 1e-12) u = 1e-12; return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * env.rng.float()); };

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'How 200 investors fared in one year' });
  const { svg } = fr;
  const sx = (v) => X0 + ((Math.max(LO, Math.min(HI, v)) - LO) / (HI - LO)) * (X1 - X0);
  svg.appendChild(s('line.axis-line', { x1: X0, x2: X1, y1: Y1, y2: Y1 }));
  for (let v = -60; v <= 80; v += 20) {
    svg.appendChild(s('line', { x1: sx(v), x2: sx(v), y1: Y1, y2: Y1 + 5, stroke: 'var(--ink)', 'stroke-width': 2 }));
    svg.appendChild(s('text.tick-label', { x: sx(v), y: Y1 + 20, 'text-anchor': 'middle' }, `${v > 0 ? '+' : ''}${v}%`));
  }
  svg.appendChild(s('line', { x1: sx(0), x2: sx(0), y1: Y0, y2: Y1, stroke: 'var(--hair)', 'stroke-width': 2 }));
  svg.appendChild(s('text.axis-label', { x: X1, y: H - 6, 'text-anchor': 'end' }, 'return on the investor’s money this year'));
  const gBars = s('g');
  const gMkt = s('g');
  svg.append(gBars, gMkt);

  const roMkt = readout('market this year');
  const roWorst = readout('unluckiest investor', { color: 'red' });
  const roBest = readout('luckiest', { color: 'green' });
  const roSpec = readout('swing from company luck', { color: 'blue' });
  fr.readouts.append(roMkt.el, roWorst.el, roBest.el, roSpec.el);
  const line = h('p.ds-line', { 'aria-live': 'polite' });
  const pickBtns = new Map();
  let goBtn = null;
  if (!isStatic) {
    const wrap = h('div.ds-pick', { role: 'group', 'aria-label': 'Companies held by each investor' }, h('span', 'Each investor holds'));
    for (const opt of options) {
      const b = button(`${opt} ${opt === 1 ? 'company' : 'companies'}`, () => { if (readOnly) return; n = opt; years = 0; result = null; play('select'); render(); env.onChange(getState()); });
      b.setAttribute('aria-pressed', 'false');
      pickBtns.set(opt, b);
      wrap.appendChild(b);
    }
    fr.el.insertBefore(wrap, fr.readouts);
    goBtn = button('Run a year', () => { if (readOnly) return; oneYear(); render(); play('tick'); env.announce(line.textContent); env.onChange(getState()); }, { icon: 'play', variant: 'primary' });
    fr.buttons.appendChild(goBtn);
  }
  if (!env.compact) fr.el.insertBefore(line, fr.readouts);

  function oneYear() {
    const market = Math.max(-60, mkt.mean + mkt.sd * gauss());
    const sd = single / Math.sqrt(n);
    const values = [];
    for (let i = 0; i < count; i++) values.push(Math.max(-100, market + sd * gauss()));
    result = { market, values };
    years++;
    seen.add(n);
  }

  function getState() {
    let best = null;
    let worst = null;
    let spread = null;
    if (result) {
      best = Math.round(Math.max(...result.values) * 10) / 10;
      worst = Math.round(Math.min(...result.values) * 10) / 10;
      const mean = result.values.reduce((a, b) => a + b, 0) / count;
      spread = Math.round(Math.sqrt(result.values.reduce((a, b) => a + (b - mean) ** 2, 0) / count) * 10) / 10;
    }
    return { n, years, market: result ? Math.round(result.market * 10) / 10 : null, best, worst, spread, specific: specificRisk(single, n), marketSd: mkt.sd, seen: [...seen].sort((a, b) => a - b) };
  }

  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  function render() {
    const f = getState();
    clear(gBars); clear(gMkt);
    for (const [opt, b] of pickBtns) { b.setAttribute('aria-pressed', String(opt === n)); b.disabled = readOnly; }
    if (goBtn) { goBtn.disabled = readOnly; goBtn.lastChild.textContent = years ? 'Run another year' : 'Run a year'; }
    if (result) {
      const bins = new Array((HI - LO) / BIN).fill(0);
      for (const v of result.values) bins[Math.max(0, Math.min(bins.length - 1, Math.floor((v - LO) / BIN)))]++;
      const top = Math.max(...bins, 12);
      bins.forEach((c, i) => {
        if (!c) return;
        const x = sx(LO + i * BIN);
        const w = sx(LO + (i + 1) * BIN) - x;
        const ht = (c / top) * (Y1 - Y0 - 6);
        gBars.appendChild(s('rect', { x: x + 1, y: Y1 - ht, width: w - 2, height: ht, rx: 2, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      });
      const xm = sx(result.market);
      gMkt.appendChild(s('line', { x1: xm, x2: xm, y1: Y0 - 8, y2: Y1, stroke: hue('orange'), 'stroke-width': 3, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' }));
      gMkt.appendChild(s('text.ds-tag', { x: xm > W - 130 ? xm - 8 : xm + 8, y: Y0 - 12, 'text-anchor': xm > W - 130 ? 'end' : 'start' }, `the market: ${signed(f.market)}`));
      roMkt.set(signed(f.market));
      roWorst.set(signed(f.worst));
      roBest.set(signed(f.best));
      line.textContent = `Year ${years} with ${n} ${n === 1 ? 'company' : 'companies'} each: the market made ${signed(f.market)}; the 200 investors ended between ${signed(f.worst)} and ${signed(f.best)}.`;
    } else {
      gMkt.appendChild(s('text.fig-label-sm', { x: W / 2, y: (Y0 + Y1) / 2, 'text-anchor': 'middle' }, 'Press “Run a year”: each bar will count investors'));
      roMkt.set('—'); roWorst.set('—'); roBest.set('—');
      line.textContent = `200 investors, each holding ${n} ${n === 1 ? 'company' : 'companies'} chosen at random.`;
    }
    roSpec.set(`±${f.specific} points`);
    svg.setAttribute('aria-label', `${spec.alt || 'How 200 investors fared in one year'}. ${line.textContent} Swing left from company luck: about ${f.specific} points; the market's own swing, about ${mkt.sd} points, remains.`);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.seen)) for (const v of next.seen) if (options.includes(v)) seen.add(v);
      if (options.includes(next.n)) { n = next.n; years = 0; result = null; }
      const runs = typeof next.years === 'number' ? next.years : options.includes(next.n) ? 1 : 0;
      for (let k = 0; k < Math.min(50, runs); k++) oneYear();
      render();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); },
  };
}

export const examples = [
  { title: 'diversify-sim — one company or many', spec: { type: 'diversify-sim', options: [1, 4, 25, 100], n: 1 } },
];
