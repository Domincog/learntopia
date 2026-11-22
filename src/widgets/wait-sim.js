/**
 * wait-sim — how long until…? Runs a waiting experiment again and again and
 * piles the waiting times up in a chart, with their running average. Three
 * kinds of wait:
 *
 *   'first'      tries until the first success (rolls until a six)
 *   'collector'  boxes opened until every one of n toys has turned up
 *   'birthday'   people entering a room until two of them share a birthday
 *
 * {
 *   type: 'wait-sim',
 *   kind: 'first',
 *   p: 1 / 6,                  // 'first': chance of success at each try
 *   n: 6,                      // 'collector': how many different toys · 'birthday': days in the year (default 365)
 *   after: 0,                  // 'first': only waits longer than this many tries count, measured from that point on
 *   dice: false,               // 'first': show the tries of the latest wait as die faces (success = six; use with p = 1/6)
 *   words: { tries: 'rolls', one: 'roll', run: 'Roll until a six', axis: 'rolls needed for the first six' },
 *   buttons: [1, 10, 100],     // waits per button
 *   max: 5000,                 // most waits the chart holds
 *   cap: 30,                   // the last bar of the chart collects every wait of this length or more
 *   theory: false,             // mark the exact expected wait with a dashed line
 * }
 *
 * State: { kind, trials, mean, longest, shortest, counts, last, expected, discarded }
 *   trials   — waits recorded so far · mean — their average length (0 before the first)
 *   counts   — counts[k] = waits that lasted exactly k tries; the last entry collects the long ones
 *   last     — length of the latest wait (null before the first)
 *   expected — the exact expected wait, for explanations
 *   discarded — with `after`: waits that ended too early to be counted
 *
 * setState({ trials: 200 }) clears the chart and runs that many waits. Every result is random (env.rng):
 * write checks about `trials`, never about `mean` or `counts`.
 */
import { frame, button, readout, niceStep, ticks, hue, s, h, cx, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('wait-sim', `
  .widget-wait-sim .ws-tape { display: flex; align-items: center; gap: var(--s2); min-height: 38px; min-width: 0; overflow: hidden; }
  .widget-wait-sim .ws-chips {
    flex: 1; min-width: 0; display: flex; justify-content: flex-end; gap: 3px; overflow: hidden;
    /* on a narrow screen the oldest tries run off the left edge: let them fade out instead of being cut in half */
    -webkit-mask-image: linear-gradient(to right, transparent, #000 22px); mask-image: linear-gradient(to right, transparent, #000 22px);
  }
  .widget-wait-sim .ws-chips svg { width: 26px; height: 26px; display: block; flex: none; }
  .widget-wait-sim .ws-chip {
    flex: none; display: grid; place-items: center; min-width: 26px; height: 28px; padding: 0 4px;
    border: var(--bw) solid var(--hair); border-radius: 8px; background: var(--surface); color: var(--ink-2);
    font-weight: 800; font-size: var(--fs-sm); font-variant-numeric: tabular-nums;
  }
  .widget-wait-sim .ws-chip.is-hit { border-color: var(--edge-strong); background: var(--orange); color: #1D1B26; }
  .widget-wait-sim .ws-chip.is-new { border-color: var(--edge); background: var(--teal-soft); color: var(--ink); }
  .widget-wait-sim .ws-result { flex: none; font-weight: 800; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .widget-wait-sim .ws-empty { flex: 1; text-align: center; color: var(--ink-3); font-size: var(--fs-sm); }
`);

const PIP_AT = [[8, 8], [22, 8], [8, 15], [15, 15], [22, 15], [8, 22], [22, 22]];
const PIPS = { 1: [3], 2: [0, 6], 3: [0, 3, 6], 4: [0, 1, 5, 6], 5: [0, 1, 3, 5, 6], 6: [0, 1, 2, 4, 5, 6] };
function dieFace(n) {
  const svg = s('svg', { viewBox: '0 0 30 30', role: 'img', 'aria-label': `die showing ${n}` },
    s('rect', { x: 2, y: 2, width: 26, height: 26, rx: 6, fill: n === 6 ? hue('orange') : 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  for (const i of PIPS[n]) svg.appendChild(s('circle', { cx: PIP_AT[i][0], cy: PIP_AT[i][1], r: 2.7, fill: n === 6 ? '#1D1B26' : 'var(--ink)' }));
  return svg;
}

const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** Exact expected number of people until two share one of `days` equally likely birthdays. */
export function expectedBirthdayWait(days) {
  let none = 1;     // chance that the first k people all differ
  let e = 0;
  for (let k = 0; k <= days; k++) { e += none; none *= (days - k) / days; }
  return e;
}
/** Exact expected number of boxes until all n equally likely toys have turned up: n(1 + 1/2 + … + 1/n). */
export function expectedCollectorWait(n) {
  let t = 0;
  for (let i = 1; i <= n; i++) t += n / i;
  return t;
}

export default function create(spec, env) {
  const kind = ['collector', 'birthday'].includes(spec.kind) ? spec.kind : 'first';
  const p = clamp(spec.p != null ? Number(spec.p) : 1 / 6, 0.001, 1);
  const n = Math.max(2, Math.round(spec.n || (kind === 'birthday' ? 365 : 6)));
  const after = kind === 'first' && spec.after > 0 ? Math.round(spec.after) : 0;
  const dice = kind === 'first' && !!spec.dice;
  const max = clamp(Math.round(spec.max || 5000), 10, 50000);
  const defaults = {
    first: { tries: 'tries', one: 'try', run: 'Run', axis: after ? `tries needed after the first ${after}` : 'tries needed for the first success' },
    collector: { tries: 'boxes', one: 'box', run: 'Collect a set', axis: `boxes opened to collect all ${n}` },
    birthday: { tries: 'people', one: 'person', run: 'Fill a room', axis: 'people in the room at the first shared birthday' },
  }[kind];
  const words = { ...defaults, ...(spec.words || {}) };
  const expected = kind === 'first' ? 1 / p : kind === 'collector' ? expectedCollectorWait(n) : expectedBirthdayWait(n);
  const first = kind === 'collector' ? n : kind === 'birthday' ? 2 : 1;          // the shortest possible wait
  const cap = Math.max(first + 4, Math.round(spec.cap || Math.ceil(expected * 4)));
  let readOnly = !!env.readOnly;

  /* ---------------------------------------------------------------- model */
  let counts = new Array(cap + 1).fill(0);
  let trials = 0;
  let total = 0;
  let longest = 0;
  let shortest = 0;
  let last = null;
  let lastSeq = null;       // what happened in the latest wait, for the tape
  let discarded = 0;

  function oneWait() {
    if (kind === 'collector') {
      const seen = new Set();
      const seq = [];
      while (seen.size < n) { const toy = env.rng.int(1, n); seq.push({ v: toy, fresh: !seen.has(toy) }); seen.add(toy); }
      return { wait: seq.length, seq };
    }
    if (kind === 'birthday') {
      const seen = new Map();
      for (let k = 1; ; k++) {
        const day = env.rng.int(1, n);
        if (seen.has(day)) return { wait: k, seq: { with: seen.get(day), day } };
        seen.set(day, k);
      }
    }
    for (;;) {
      const seq = [];
      let k = 0;
      for (;;) {
        k++;
        const hit = env.rng.next() < p;
        seq.push(dice ? (hit ? 6 : env.rng.int(1, 5)) : hit);
        if (hit) break;
      }
      if (k > after) return { wait: k - after, seq: seq.slice(after), skipped: after };
      discarded++;
    }
  }
  function simulate(k) {
    for (let i = 0; i < k && trials < max; i++) {
      const res = oneWait();
      counts[Math.min(cap, res.wait)] += 1;
      trials += 1;
      total += res.wait;
      longest = Math.max(longest, res.wait);
      shortest = trials === 1 ? res.wait : Math.min(shortest, res.wait);
      last = res.wait;
      lastSeq = res.seq;
    }
  }
  function wipe() {
    counts = new Array(cap + 1).fill(0);
    trials = 0; total = 0; longest = 0; shortest = 0; last = null; lastSeq = null; discarded = 0;
  }
  const getState = () => ({
    kind, trials, mean: trials ? total / trials : 0, longest, shortest, counts: counts.slice(), last,
    expected: Math.round(expected * 1e6) / 1e6, discarded,
  });

  /* --------------------------------------------------------------- layout */
  const W = 560;
  const H = env.compact ? 230 : 280;
  const box = { l: 44, r: W - 14, t: 26, b: H - 48 };
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Chart of waiting times' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const slots = cap - first + 1;
  const slot = (box.r - box.l) / slots;
  const sx = (k) => box.l + (k - first + 0.5) * slot;      // centre of the bar for a wait of k
  const sxAt = (v) => box.l + (clamp(v, first - 0.5, cap + 0.5) - first + 0.5) * slot;

  const chips = h('div.ws-chips', { 'aria-hidden': 'true' });
  const result = h('span.ws-result');
  const emptyNote = h('div.ws-empty', `The latest wait appears here.`);
  const tape = h('div.ws-tape', { 'aria-live': 'polite' }, emptyNote, chips, result);
  if (!env.compact && !spec.static) fr.el.insertBefore(tape, fr.canvas);

  const roTrials = readout('waits', { digits: 0 });
  const roMean = readout(`average wait`, { color: 'orange' });
  const roLongest = readout('longest', { digits: 0 });
  let runButtons = [];
  let resetBtn = null;
  const note = h('p.w-hint');
  if (!env.compact && !spec.static) {
    fr.readouts.append(roTrials.el, roMean.el, roLongest.el);
    const sizes = (Array.isArray(spec.buttons) && spec.buttons.length ? spec.buttons : [1, 10, 100]).filter((k) => k > 0 && k <= max);
    runButtons = sizes.map((k, i) => button(k === 1 ? words.run : `${fmtInt(k)} more`, () => run(k), { icon: i === 0 ? 'play' : null, variant: i === sizes.length - 1 ? 'primary' : '' }));
    resetBtn = button('Start again', () => restart(), { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(...runButtons, resetBtn);
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------------- draw */
  function drawTape() {
    chips.replaceChildren();
    emptyNote.hidden = last != null;
    if (last == null) { result.textContent = ''; return; }
    const SHOW = 12;
    if (kind === 'birthday') {
      result.textContent = `Person ${last} shares a birthday with person ${lastSeq.with}: a match after ${last} ${words.tries}.`;
      result.style.whiteSpace = 'normal';
      return;
    }
    const seq = lastSeq;
    if (seq.length > SHOW) chips.appendChild(h('span.ws-chip', '…'));
    for (const item of seq.slice(-SHOW)) {
      if (kind === 'collector') chips.appendChild(h('span', { class: cx('ws-chip', item.fresh && 'is-new') }, String(item.v)));
      else if (dice) chips.appendChild(dieFace(item));
      else chips.appendChild(h('span', { class: cx('ws-chip', item && 'is-hit') }, item ? '✓' : '✗'));
    }
    result.textContent = `= ${last} ${last === 1 ? words.one : words.tries}${after ? ` after the first ${after}` : ''}`;
  }

  function draw() {
    g.replaceChildren();
    const top = Math.max(...counts);
    const yStep = Math.max(1, niceStep(Math.max(8, top * 1.1), 4));
    const yTop = Math.ceil(Math.max(8, top * 1.08) / yStep) * yStep;
    const sy = (v) => box.b - (v / yTop) * (box.b - box.t);
    for (const v of ticks(0, yTop, yStep)) {
      g.appendChild(s('line.grid-line', { x1: box.l, x2: box.r, y1: sy(v), y2: sy(v) }));
      g.appendChild(s('text.tick-label', { x: box.l - 6, y: sy(v) + 4, 'text-anchor': 'end' }, fmtInt(v)));
    }
    const bw = clamp(slot * 0.8, 1.5, 40);
    for (let k = first; k <= cap; k++) {
      if (!counts[k]) continue;
      const y = sy(counts[k]);
      g.appendChild(s('rect', { x: sx(k) - bw / 2, y, width: bw, height: Math.max(1.5, box.b - y), rx: Math.min(3, bw / 4), fill: hue(k === cap ? 'violet' : 'blue'), stroke: 'var(--ink)', 'stroke-width': bw > 12 ? 2.5 : 1.5 }));
    }
    g.appendChild(s('line.axis-line', { x1: box.l, x2: box.r, y1: box.b, y2: box.b }));
    const xStep = Math.max(1, niceStep(slots, Math.min(7, slots)));
    const labelled = new Set(ticks(first, cap - 1, xStep).filter((k) => k - first >= xStep * 0.6));
    labelled.add(first);
    for (const k of labelled) {
      if (cap - k < xStep * 0.6) continue;      // leave room for the "30+" label
      g.appendChild(s('text.tick-label', { x: sx(k), y: box.b + 17, 'text-anchor': 'middle' }, String(k)));
    }
    g.appendChild(s('text.tick-label', { x: sx(cap), y: box.b + 17, 'text-anchor': 'middle', style: 'font-weight:800' }, `${cap}+`));
    g.appendChild(s('text.axis-label', { x: (box.l + box.r) / 2, y: H - 8, 'text-anchor': 'middle' }, words.axis));
    if (spec.theory) {
      const x = sxAt(expected);
      g.appendChild(s('line', { x1: x, x2: x, y1: box.t - 2, y2: box.b, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '5 5' }));
    }
    if (trials) {
      const mean = total / trials;
      const x = sxAt(mean);
      g.appendChild(s('line', { x1: x, x2: x, y1: box.t - 2, y2: box.b, stroke: hue('orange'), 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
      g.appendChild(s('text.fig-label-sm', { x: clamp(x, box.l + 50, box.r - 50), y: box.t - 9, 'text-anchor': 'middle', class: 'text-orange' }, `average ${mean.toFixed(mean < 100 ? 1 : 0)}`));
    }
    roTrials.set(fmtInt(trials));
    roMean.set(trials ? (total / trials).toFixed(2) : '—');
    roLongest.set(trials ? fmtInt(longest) : '—');
    drawTape();
    sync();
    svg.setAttribute('aria-label', trials
      ? `${fmtInt(trials)} waits recorded. Average ${(total / trials).toFixed(1)} ${words.tries}; shortest ${shortest}, longest ${longest}.`
      : `${spec.alt || 'Chart of waiting times'}. Nothing recorded yet.`);
  }

  function sync() {
    const full = trials >= max;
    for (const b of runButtons) b.disabled = readOnly || full;
    if (resetBtn) resetBtn.disabled = readOnly || trials === 0;
    note.textContent = full ? 'The chart is full. Start again for a fresh run.' : '';
  }

  function run(k) {
    if (readOnly || trials >= max) return;
    const before = trials;
    simulate(k);
    play(k === 1 ? 'tap' : 'tick');
    draw();
    env.announce(trials - before === 1 ? `${last} ${last === 1 ? words.one : words.tries}.` : `${fmtInt(trials)} waits. Average ${(total / trials).toFixed(1)} ${words.tries}.`);
    env.onChange(getState());
  }

  function restart() {
    if (readOnly || !trials) return;
    wipe();
    play('pop');
    draw();
    env.onChange(getState());
  }

  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(to) {
      if (!to || !(to.trials >= 0)) return;
      wipe();
      simulate(Math.min(max, Math.round(to.trials)));
      draw();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); sync(); },
  };
}

export const examples = [
  { title: 'wait-sim — rolls until the first six', spec: { type: 'wait-sim', kind: 'first', p: 1 / 6, dice: true, cap: 30, words: { tries: 'rolls', one: 'roll', run: 'Roll until a six', axis: 'rolls needed for the first six' } } },
  { title: 'wait-sim — boxes until all six toys', spec: { type: 'wait-sim', kind: 'collector', n: 6, cap: 40, theory: true } },
  { title: 'wait-sim — people until a shared birthday', spec: { type: 'wait-sim', kind: 'birthday', cap: 70, buttons: [1, 10, 100] } },
];
