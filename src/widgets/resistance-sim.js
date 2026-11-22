/**
 * resistance-sim — natural selection in a population of bacteria. Most are
 * killed by an antibiotic; a few carry a gene that lets them survive it. The
 * learner gives a course of the antibiotic, lets the survivors multiply back,
 * and watches the resistant share climb. A stacked bar chart keeps the
 * history, one bar per step.
 *
 * {
 *   type: 'resistance-sim',
 *   capacity: 200,          // how many bacteria the place holds when full (20 dots per row)
 *   resistant: 2,           // how many of them are resistant at the start
 *   kill: 0.9,              // share of the ordinary bacteria that one course kills
 *   killResistant: 0.1,     // share of the resistant ones that it kills
 *   maxSteps: 12,           // courses and regrowths allowed before the buttons stop
 *   words: { place: 'Bacteria in the gut', dose: 'Give a course of antibiotic', grow: 'Let them multiply' },
 *   static: false,
 * }
 *
 * State: { susceptible, resistant, total, share, doses, grows, log, full }
 *   share — resistant / total (0 when no bacteria are left)
 *   doses, grows — how many courses and how many regrowths so far
 *   log   — the steps so far, in order: 'dose' or 'grow'
 *   full  — the population is back at capacity
 *
 * The counts are exact, not random (only which dot dies or divides is drawn with env.rng):
 *   a course:    susceptible → round(susceptible × (1 − kill)),  resistant → round(resistant × (1 − killResistant))
 *   regrowth:    the survivors multiply in proportion until the place is full again:
 *                resistant → round(resistant × capacity / total),  susceptible → capacity − resistant
 *
 * setState({ log: ['dose', 'grow', …] }) replays those steps from the start.
 *
 * What the model leaves out: new mutations and genes passed between bacteria (which is how the first
 * resistant cells arise), the immune system, and any cost of carrying a resistance gene.
 */
import { frame, button, readout, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 236;
const COLS = 20;
const PITCH = 14;
const GX = 12;
const GY = 34;
const CX0 = 336;
const CX1 = 548;
const CY0 = 40;
const CY1 = 178;

addStyles('resistance-sim', `
  .widget-resistance-sim .rs-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s1) var(--s4); font-size: var(--fs-sm); font-weight: 700; }
  .widget-resistance-sim .rs-key { display: inline-flex; align-items: center; gap: 0.4rem; }
  .widget-resistance-sim .rs-key svg { flex: none; width: 16px; height: 16px; }
  .widget-resistance-sim .rs-key b { font-family: var(--font-mono); font-variant-numeric: tabular-nums; }
  .widget-resistance-sim .rs-note { min-height: 1.4em; margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); }
`);

const LOOK = {
  0: { size: 4, rx: 2, fill: 'var(--hair)', stroke: 'none', sw: 0 },
  1: { size: 9, rx: 4.5, fill: hue('teal'), stroke: 'var(--edge-strong)', sw: 1 },
  2: { size: 10, rx: 2, fill: hue('orange'), stroke: 'var(--ink)', sw: 2 },
};

function swatch(kind) {
  const k = LOOK[kind];
  return s('svg', { viewBox: '0 0 16 16', 'aria-hidden': 'true' },
    s('rect', { x: 8 - k.size / 2, y: 8 - k.size / 2, width: k.size, height: k.size, rx: k.rx, fill: k.fill, stroke: k.stroke, 'stroke-width': k.sw }));
}

/** One course of antibiotic, in whole bacteria. */
export const afterDose = ({ susceptible, resistant }, kill = 0.9, killResistant = 0.1) => ({
  // tidy() first: 25 × (1 − 0.9) is 2.4999999999999996 in floating point, and must round like 2.5
  susceptible: Math.round(tidy(susceptible * (1 - kill))),
  resistant: Math.round(tidy(resistant * (1 - killResistant))),
});
/** The survivors multiply in proportion until the place is full. */
export function afterGrowth({ susceptible, resistant }, capacity = 200) {
  const total = susceptible + resistant;
  if (!total) return { susceptible: 0, resistant: 0 };
  const r = susceptible === 0 ? capacity : Math.round((resistant * capacity) / total);
  return { susceptible: capacity - r, resistant: r };
}

export default function create(spec, env) {
  const cap = clamp(Math.round(spec.capacity || 200), 40, 300);
  const rows = Math.ceil(cap / COLS);
  const startR = clamp(Math.round(spec.resistant != null ? spec.resistant : 2), 0, cap);
  const kill = clamp(spec.kill != null ? spec.kill : 0.9, 0, 1);
  const killR = clamp(spec.killResistant != null ? spec.killResistant : 0.1, 0, 1);
  const maxSteps = clamp(Math.round(spec.maxSteps || 12), 2, 14);
  const isStatic = !!spec.static || !!env.compact;
  const words = { place: 'Bacteria in the gut', dose: 'Give a course of antibiotic', grow: 'Let them multiply', ...(spec.words || {}) };
  let readOnly = !!env.readOnly;

  let cells;            // 0 empty · 1 ordinary · 2 resistant, one per dot
  let pop;              // { susceptible, resistant }
  let log;
  let history;          // the population after each step, the start included

  function start() {
    cells = new Uint8Array(cap).fill(1);
    const order = env.rng.shuffle(Array.from({ length: cap }, (_, i) => i));
    for (let i = 0; i < startR; i++) cells[order[i]] = 2;
    pop = { susceptible: cap - startR, resistant: startR };
    log = [];
    history = [{ ...pop }];
  }

  /** Make the dots agree with the counts: remove or add bacteria of each kind at random places. */
  function settle(next) {
    for (const [kind, key] of [[1, 'susceptible'], [2, 'resistant']]) {
      const have = [];
      for (let i = 0; i < cap; i++) if (cells[i] === kind) have.push(i);
      if (have.length > next[key]) {
        const gone = env.rng.shuffle(have).slice(0, have.length - next[key]);
        for (const i of gone) cells[i] = 0;
      }
    }
    for (const [kind, key] of [[2, 'resistant'], [1, 'susceptible']]) {
      let have = 0;
      const free = [];
      for (let i = 0; i < cap; i++) { if (cells[i] === kind) have++; else if (cells[i] === 0) free.push(i); }
      if (have < next[key]) {
        const born = env.rng.shuffle(free).slice(0, next[key] - have);
        for (const i of born) cells[i] = kind;
      }
    }
    pop = { ...next };
  }

  function apply(step) {
    const total = pop.susceptible + pop.resistant;
    if (log.length >= maxSteps || total === 0) return false;
    if (step === 'grow' && total === cap) return false;
    settle(step === 'dose' ? afterDose(pop, kill, killR) : afterGrowth(pop, cap));
    log.push(step);
    history.push({ ...pop });
    return true;
  }

  /* ------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A population of bacteria and a chart of how it changes' });
  const { svg } = fr;
  svg.appendChild(s('text.axis-label', { x: GX, y: 20 }, words.place));
  svg.appendChild(s('text.axis-label', { x: CX0, y: 20 }, 'After each step'));
  const dots = [];
  for (let i = 0; i < cap; i++) { const el = s('rect'); dots.push(el); svg.appendChild(el); }
  svg.appendChild(s('line', { x1: CX0, x2: CX1, y1: CY1, y2: CY1, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  const gBars = s('g');
  svg.appendChild(gBars);
  svg.appendChild(s('text.tick-label', { x: CX0, y: H - 8 }, 'A: antibiotic   M: multiply'));

  const roShare = readout('resistant', { color: 'orange' });
  const note = h('p.rs-note', { 'aria-live': 'polite' });
  const legend = h('div.rs-legend');
  let doseBtn = null;
  let growBtn = null;
  let resetBtn = null;

  function describe() {
    const total = pop.susceptible + pop.resistant;
    if (!total) return 'No bacteria are left.';
    return `${pop.resistant} of ${total} bacteria are resistant: ${formatNumber((pop.resistant / total) * 100, 0)}%.`;
  }

  function render() {
    for (let i = 0; i < cap; i++) {
      const k = LOOK[cells[i]];
      const el = dots[i];
      el.setAttribute('x', GX + (i % COLS) * PITCH + (PITCH - k.size) / 2);
      el.setAttribute('y', GY + Math.floor(i / COLS) * PITCH + (PITCH - k.size) / 2);
      el.setAttribute('width', k.size); el.setAttribute('height', k.size); el.setAttribute('rx', k.rx);
      el.setAttribute('fill', k.fill); el.setAttribute('stroke', k.stroke); el.setAttribute('stroke-width', k.sw);
    }
    while (gBars.firstChild) gBars.removeChild(gBars.firstChild);
    const slots = maxSteps + 1;
    const bw = (CX1 - CX0) / slots;
    history.forEach((p, i) => {
      const x = CX0 + i * bw + 1.5;
      const hr = (p.resistant / cap) * (CY1 - CY0);
      const hs = (p.susceptible / cap) * (CY1 - CY0);
      if (hs > 0) gBars.appendChild(s('rect', { x, y: CY1 - hr - hs, width: bw - 3, height: hs, fill: hue('teal'), stroke: 'var(--edge-strong)', 'stroke-width': 1 }));
      if (hr > 0) gBars.appendChild(s('rect', { x, y: CY1 - hr, width: bw - 3, height: hr, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
      if (i > 0) gBars.appendChild(s('text.tick-label', { x: x + (bw - 3) / 2, y: CY1 + 16, 'text-anchor': 'middle' }, log[i - 1] === 'dose' ? 'A' : 'M'));
    });
    const total = pop.susceptible + pop.resistant;
    roShare.set(total ? `${formatNumber((pop.resistant / total) * 100, 0)}%` : '—');
    legend.replaceChildren(
      h('span.rs-key', swatch(1), 'killed by the antibiotic: ', h('b', String(pop.susceptible))),
      h('span.rs-key', swatch(2), 'resistant: ', h('b', String(pop.resistant))));
    note.textContent = log.length >= maxSteps ? 'That is as far as this model goes. Start again to try another path.' : '';
    svg.setAttribute('aria-label', `${spec.alt || 'A population of bacteria and a chart of how it changes'}. ${describe()} Courses of antibiotic so far: ${log.filter((x) => x === 'dose').length}.`);
    const stuck = readOnly || log.length >= maxSteps || total === 0;
    if (doseBtn) doseBtn.disabled = stuck;
    if (growBtn) growBtn.disabled = stuck || total === cap;
    if (resetBtn) resetBtn.disabled = readOnly || !log.length;
  }

  function getState() {
    const total = pop.susceptible + pop.resistant;
    return {
      susceptible: pop.susceptible, resistant: pop.resistant, total,
      share: total ? pop.resistant / total : 0,
      doses: log.filter((x) => x === 'dose').length,
      grows: log.filter((x) => x === 'grow').length,
      log: log.slice(),
      full: total === cap,
    };
  }

  const act = (step) => {
    if (readOnly || !apply(step)) return;
    play(step === 'dose' ? 'pop' : 'tap');
    render();
    env.announce(describe());
    env.onChange(getState());
  };

  start();
  if (!isStatic) {
    fr.readouts.appendChild(roShare.el);
    doseBtn = button(words.dose, () => act('dose'), { variant: 'primary' });
    growBtn = button(words.grow, () => act('grow'));
    resetBtn = button('Start again', () => { if (readOnly) return; start(); render(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(doseBtn, growBtn, resetBtn);
    fr.el.insertBefore(legend, fr.readouts);
    fr.el.appendChild(note);
  } else {
    for (const step of Array.isArray(spec.log) ? spec.log : []) apply(step);
    if (!env.compact) fr.el.appendChild(legend);
  }
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.log)) return;
      start();
      for (const step of next.log) apply(step === 'dose' ? 'dose' : 'grow');
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      render();
    },
  };
}

export const examples = [
  { title: 'resistance-sim — a few resistant bacteria among many', spec: { type: 'resistance-sim' } },
  { title: 'resistance-sim — none to begin with', spec: { type: 'resistance-sim', resistant: 0 } },
  { title: 'resistance-sim — after three courses (picture)', spec: { type: 'resistance-sim', static: true, log: ['dose', 'grow', 'dose', 'grow', 'dose', 'grow'] } },
];
