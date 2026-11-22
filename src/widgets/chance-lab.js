/**
 * chance-lab — a chance experiment the learner runs themselves: flip a coin,
 * roll dice or spin a spinner 1, 10, 100, 1000… times. A bar chart shows how
 * often each outcome has come up; a line shows the running share of one
 * outcome wobbling at first and then settling toward its true probability
 * (the law of large numbers). The horizontal axis of the line chart is
 * logarithmic (1, 10, 100, 1000…), so the early wobble stays visible.
 *
 * {
 *   type: 'chance-lab',
 *   kind: 'coin',                  // 'coin' · 'die' · 'dice-sum' (two dice, totals 2–12) · 'dice-event' · 'spinner'
 *   dice: 4,                       // dice-event: how many dice are rolled per trial (1–6)
 *   event: (faces) => faces.includes(6),      // dice-event: does this roll count as a success?
 *   labels: ['At least one six', 'No six'],   // dice-event: names for success and failure
 *   outcomes: [{ label: 'Red', p: 1, color: 'red' }, { label: 'Blue', p: 3, color: 'blue' }],   // spinner: sections (p is a weight)
 *   track: 'Heads',                // outcome whose running share is plotted: its label, or its index (default: the first)
 *   trackLabel: 'heads',           // how to name it in the readouts
 *   target: true,                  // show the true probability: dashed line on the line chart, tick marks on the bars
 *   bars: true, line: true,        // which of the two charts to show
 *   buttons: [1, 10, 100, 1000],   // how many trials each button runs
 *   max: 10000,                    // cap on trials, and the right-hand end of the line chart
 *   streak: 5,                     // optional: also record what follows `streak` tracked outcomes in a row
 *   verb: 'Play', unit: 'rounds', one: 'round',   // optional wording: button verb, plural and singular name of a trial
 *                                  // (defaults: Flip / flips / flip for a coin, Roll / rolls / roll for dice, Spin / spins / spin)
 * }
 *
 * State: { trials, counts: [one per outcome], tracked, share, mode, runs, streak: { length, seen, repeats, share } }
 *   tracked — how often the tracked outcome came up; share = tracked / trials (0 before the first trial)
 *   mode    — label of the most frequent outcome so far (null before the first trial)
 *   runs    — experiments started so far ("Start again" begins a new one; the old line stays as a grey ghost)
 *   streak  — only with `streak`: `seen` trials came straight after `length` tracked outcomes in a row,
 *             and in `repeats` of those the tracked outcome came up yet again (share = repeats / seen)
 *
 * setState({ trials: 200 }) re-runs the experiment for that many trials ({ runs: 3, trials: 10 } also works), so
 * a lesson's `solution` only needs a number of trials. Results are random: write checks about `trials`, never about counts.
 */
import { frame, button, readout, loop, hue, s, h, cx, clamp, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('chance-lab', `
  .widget-chance-lab .cl-tape { display: flex; align-items: center; gap: var(--s3); min-height: 38px; min-width: 0; overflow: hidden; }
  .widget-chance-lab .cl-roll { display: flex; align-items: center; gap: 3px; flex: none; }
  .widget-chance-lab .cl-roll svg { width: 26px; height: 26px; display: block; }
  .widget-chance-lab .cl-roll span { margin-left: 4px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .widget-chance-lab .cl-chips { flex: 1; min-width: 0; display: flex; justify-content: flex-end; gap: 4px; overflow: hidden; }
  .widget-chance-lab .cl-chip {
    flex: none; display: grid; place-items: center;
    min-width: 28px; height: 30px; padding: 0 5px;
    border: var(--bw) solid var(--hair); border-radius: 8px;
    background: var(--accent-soft); color: var(--accent-text);
    font-weight: 800; font-size: var(--fs-sm); font-variant-numeric: tabular-nums;
  }
  .widget-chance-lab .cl-chip.is-last { border-color: var(--edge-strong); background: var(--accent); color: #1D1B26; }
  .widget-chance-lab .cl-empty { flex: 1; text-align: center; color: var(--ink-3); font-size: var(--fs-sm); }
  .widget-chance-lab .cl-streak { text-align: center; padding: var(--s2) var(--s3); border: var(--bw) dashed var(--hair); border-radius: var(--r); }
  .widget-chance-lab.is-readonly .w-buttons { opacity: 0.5; pointer-events: none; }
`);

const PIP_AT = [[8, 8], [22, 8], [8, 15], [15, 15], [22, 15], [8, 22], [22, 22]];
const PIPS = { 1: [3], 2: [0, 6], 3: [0, 3, 6], 4: [0, 1, 5, 6], 5: [0, 1, 3, 5, 6], 6: [0, 1, 2, 4, 5, 6] };
function dieFace(n, color = 'violet') {
  const svg = s('svg', { viewBox: '0 0 30 30', role: 'img', 'aria-label': `die showing ${n}` },
    s('rect', { x: 2, y: 2, width: 26, height: 26, rx: 6, fill: hue(color, 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  for (const i of PIPS[n]) svg.appendChild(s('circle', { cx: PIP_AT[i][0], cy: PIP_AT[i][1], r: 2.7, fill: 'var(--ink)' }));
  return svg;
}

const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const fmtPct = (p, digits = 1) => `${(p * 100).toFixed(digits)}%`;

/** Describe the experiment: its outcomes and how to run one trial. */
function setup(spec, rng) {
  const kind = spec.kind || 'coin';
  let faces = null; // dice shown for the latest trial
  const d6 = () => rng.int(1, 6);
  if (kind === 'die') {
    return {
      outcomes: [1, 2, 3, 4, 5, 6].map((k) => ({ label: String(k), short: String(k), p: 1 / 6, color: 'violet' })),
      roll: () => d6() - 1, faces: () => null, verb: 'Roll', unit: 'rolls', one: 'roll',
    };
  }
  if (kind === 'dice-sum') {
    return {
      outcomes: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((t) => ({ label: String(t), short: String(t), p: (6 - Math.abs(7 - t)) / 36, color: 'violet' })),
      roll: () => { faces = [d6(), d6()]; return faces[0] + faces[1] - 2; },
      faces: () => faces, total: true, verb: 'Roll', unit: 'rolls', one: 'roll',
    };
  }
  if (kind === 'dice-event') {
    const n = clamp(Math.round(spec.dice || 2), 1, 6);
    const event = typeof spec.event === 'function' ? spec.event : (f) => f.includes(6);
    // exact probability, by listing every one of the 6^n equally likely rolls
    let hits = 0;
    const all = Math.pow(6, n);
    for (let code = 0; code < all; code++) {
      const f = [];
      for (let i = 0, c = code; i < n; i++, c = Math.floor(c / 6)) f.push((c % 6) + 1);
      if (event(f)) hits++;
    }
    const names = spec.labels || ['Yes', 'No'];
    return {
      outcomes: [
        { label: names[0], short: '✓', p: hits / all, color: 'green' },
        { label: names[1], short: '✗', p: 1 - hits / all, color: 'gray' },
      ],
      roll: () => { faces = Array.from({ length: n }, d6); return event(faces) ? 0 : 1; },
      faces: () => faces, verb: 'Roll', unit: 'rolls', one: 'roll',
    };
  }
  if (kind === 'spinner') {
    const list = (spec.outcomes || []).filter((o) => o && o.p > 0);
    const sum = list.reduce((t, o) => t + o.p, 0) || 1;
    const outcomes = list.map((o, i) => ({ label: String(o.label), short: String(o.short || o.label).slice(0, 3), p: o.p / sum, color: o.color || ['blue', 'orange', 'green', 'violet', 'pink', 'teal'][i % 6] }));
    return {
      outcomes,
      roll: () => { let u = rng.next(); for (let i = 0; i < outcomes.length; i++) { u -= outcomes[i].p; if (u < 0) return i; } return outcomes.length - 1; },
      faces: () => null, verb: 'Spin', unit: 'spins', one: 'spin',
    };
  }
  return {
    outcomes: [{ label: 'Heads', short: 'H', p: 0.5, color: 'blue' }, { label: 'Tails', short: 'T', p: 0.5, color: 'orange' }],
    roll: () => (rng.next() < 0.5 ? 0 : 1), faces: () => null, verb: 'Flip', unit: 'flips', one: 'flip',
  };
}

export default function create(spec, env) {
  const cfg = setup(spec, env.rng);
  for (const word of ['verb', 'unit', 'one']) if (typeof spec[word] === 'string' && spec[word]) cfg[word] = spec[word];
  const outcomes = cfg.outcomes;
  const n = outcomes.length;
  const max = clamp(Math.round(spec.max || 10000), 10, 200000);
  const showBars = spec.bars !== false;
  const showLine = spec.line !== false;
  const target = spec.target !== false;
  const streakLen = spec.streak > 0 ? Math.round(spec.streak) : 0;
  let trackIdx = outcomes.findIndex((o) => o.label === String(spec.track));
  if (trackIdx < 0) trackIdx = Number.isInteger(spec.track) && spec.track >= 0 && spec.track < n ? spec.track : 0;
  if (spec.track != null && n > 2) outcomes[trackIdx].color = 'orange';
  const tracked = outcomes[trackIdx];
  const trackLabel = spec.trackLabel || tracked.label.toLowerCase();
  let readOnly = !!env.readOnly;

  /* ---------------------------------------------------------------- model */
  const results = new Uint8Array(max);      // outcome index of every trial
  const cum = new Uint32Array(max + 1);     // tracked outcomes among the first i trials
  let counts = new Array(n).fill(0);
  let trials = 0;
  let runs = 1;
  let runLen = 0;                           // tracked outcomes in a row, up to now
  let seen = 0;
  let repeats = 0;
  let ghosts = [];                          // line paths of earlier runs
  let shown = 0;                            // trials drawn so far (lags behind while animating)
  let shownCounts = new Array(n).fill(0);

  function simulate(k) {
    for (let i = 0; i < k && trials < max; i++) {
      const o = cfg.roll();
      const hit = o === trackIdx;
      results[trials] = o;
      counts[o] += 1;
      if (streakLen && runLen >= streakLen) { seen += 1; if (hit) repeats += 1; }
      runLen = hit ? runLen + 1 : 0;
      trials += 1;
      cum[trials] = cum[trials - 1] + (hit ? 1 : 0);
    }
  }
  function wipe() {
    counts = new Array(n).fill(0);
    shownCounts = new Array(n).fill(0);
    trials = 0; shown = 0; runLen = 0; seen = 0; repeats = 0;
  }
  function advance(to) {
    for (let i = shown; i < to; i++) shownCounts[results[i]] += 1;
    shown = to;
  }

  /* --------------------------------------------------------------- layout */
  const W = 560;
  // Text in a figure is drawn larger on phones (see widgets.css), so the margins leave room for that.
  const barsBox = { l: 56, r: W - 14, t: 26, b: showLine ? 136 : 206 };   // taller when the bars are the only chart
  const lineTop = showBars ? 204 : 34;
  const lineBox = { l: 56, r: W - 58, t: lineTop, b: lineTop + (env.compact ? 110 : 140) };
  const H = showLine ? lineBox.b + 54 : barsBox.b + 32;
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Chance experiment' });
  const { svg } = fr;

  /* bars */
  const pMax = Math.max(...outcomes.map((o) => o.p));
  const barTop = pMax <= 0.2 ? 0.3 : pMax <= 0.4 ? 0.5 : 1;
  const by = (p) => barsBox.b - (clamp(p, 0, barTop) / barTop) * (barsBox.b - barsBox.t);
  const slot = (barsBox.r - barsBox.l) / n;
  const barW = Math.min(64, slot * 0.72);
  const barEls = [];
  if (showBars) {
    for (const v of barTop === 0.3 ? [0, 0.1, 0.2, 0.3] : [0, barTop / 2, barTop]) {
      svg.appendChild(s('line.grid-line', { x1: barsBox.l, x2: barsBox.r, y1: by(v), y2: by(v) }));
      svg.appendChild(s('text.tick-label', { x: barsBox.l - 7, y: by(v) + 4, 'text-anchor': 'end' }, `${Math.round(v * 100)}%`));
    }
    outcomes.forEach((o, i) => {
      const x = barsBox.l + slot * (i + 0.5);
      const rect = s('rect', { x: x - barW / 2, width: barW, rx: Math.min(5, barW / 4), fill: hue(o.color), stroke: 'var(--ink)', 'stroke-width': 2.5 });
      const label = s('text.fig-label-sm', { x, 'text-anchor': 'middle' });
      svg.append(rect, label);
      if (target) svg.appendChild(s('line', { x1: x - barW / 2 - 5, x2: x + barW / 2 + 5, y1: by(o.p), y2: by(o.p), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
      svg.appendChild(s('text.tick-label', { x, y: barsBox.b + 19, 'text-anchor': 'middle', style: 'font-weight:800;fill:var(--ink-2)' }, n > 6 ? o.short : o.label));
      barEls.push({ rect, label });
    });
    svg.appendChild(s('line.axis-line', { x1: barsBox.l, x2: barsBox.r, y1: barsBox.b, y2: barsBox.b }));
  }

  /* running share */
  const lineMax = tracked.p <= 0.25 ? 0.5 : 1;
  const decades = Math.log10(max);
  const lx = (i) => lineBox.l + (Math.log10(Math.max(1, i)) / decades) * (lineBox.r - lineBox.l);
  const ly = (p) => lineBox.b - (clamp(p, 0, lineMax) / lineMax) * (lineBox.b - lineBox.t);
  const gGhosts = s('g');
  const path = s('path', { fill: 'none', stroke: hue(tracked.color), 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  const dot = s('circle', { r: 6, fill: hue(tracked.color), stroke: 'var(--edge-strong)', 'stroke-width': 2.5, visibility: 'hidden' });
  if (showLine) {
    for (const v of [0, 0.25, 0.5, 0.75, 1].map((f) => f * lineMax)) {
      svg.appendChild(s('line.grid-line', { x1: lineBox.l, x2: lineBox.r, y1: ly(v), y2: ly(v) }));
      if ((v * 4) % (2 * lineMax) === 0) svg.appendChild(s('text.tick-label', { x: lineBox.l - 7, y: ly(v) + 4, 'text-anchor': 'end' }, `${Math.round(v * 100)}%`));
    }
    for (let k = 0; k <= Math.floor(decades + 1e-9); k++) {
      const x = lx(Math.pow(10, k));
      svg.appendChild(s('line.grid-line', { x1: x, x2: x, y1: lineBox.t, y2: lineBox.b }));
      svg.appendChild(s('text.tick-label', { x, y: lineBox.b + 19, 'text-anchor': 'middle' }, fmtInt(Math.pow(10, k))));
    }
    svg.appendChild(s('text.axis-label', { x: lineBox.l, y: lineBox.t - 11 }, `Share of ${trackLabel} so far${target ? ' (dashed: true chance)' : ''}`));
    svg.appendChild(s('text.axis-label', { x: (lineBox.l + lineBox.r) / 2, y: lineBox.b + 43, 'text-anchor': 'middle' }, `number of ${cfg.unit}`));
    svg.appendChild(s('line.axis-line', { x1: lineBox.l, x2: lineBox.r, y1: lineBox.b, y2: lineBox.b }));
    svg.appendChild(s('line.axis-line', { x1: lineBox.l, x2: lineBox.l, y1: lineBox.t, y2: lineBox.b }));
    if (target) {
      // the true probability: a dashed line, named at its right-hand end
      svg.appendChild(s('line', { x1: lineBox.l, x2: lineBox.r + 4, y1: ly(tracked.p), y2: ly(tracked.p), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
      svg.appendChild(s('text.tick-label', { x: lineBox.r + 8, y: ly(tracked.p) + 4, style: 'font-weight:800;fill:var(--ink)' }, fmtPct(tracked.p, Math.abs(tracked.p * 100 - Math.round(tracked.p * 100)) < 1e-9 ? 0 : 1)));
    }
    svg.append(gGhosts, path, dot);
  }

  const next = (i) => (i < 300 ? i + 1 : Math.ceil(i * 1.012));
  function pathTo(m) {
    let d = '';
    let last = 0;
    for (let i = 1; i <= m; i = next(i)) { d += `${d ? 'L' : 'M'}${lx(i).toFixed(1)} ${ly(cum[i] / i).toFixed(1)}`; last = i; }
    if (m > 0 && last !== m) d += `L${lx(m).toFixed(1)} ${ly(cum[m] / m).toFixed(1)}`;
    return d;
  }

  /* --------------------------------------------------------------- chrome */
  const roll = h('div.cl-roll');
  const chips = h('div.cl-chips', { 'aria-hidden': 'true' });
  const empty = h('div.cl-empty', `Results appear here as you ${cfg.verb.toLowerCase()}.`);
  const tape = h('div.cl-tape', roll, empty, chips);
  if (!env.compact) fr.el.insertBefore(tape, fr.canvas);

  const roTrials = readout(cfg.unit, { digits: 0 });
  const roTracked = readout(trackLabel, { digits: 0, color: tracked.color });
  const roShare = readout(`share of ${trackLabel}`, { color: tracked.color });
  const roMode = readout('most common so far');
  if (!env.compact) {
    fr.readouts.appendChild(roTrials.el);
    if (showLine) fr.readouts.append(roTracked.el, roShare.el);
    else fr.readouts.appendChild(roMode.el);
  }
  const streakEl = h('div.cl-streak', { 'aria-live': 'polite' });
  if (streakLen && !env.compact) fr.el.insertBefore(streakEl, fr.controls);

  const sizes = (Array.isArray(spec.buttons) && spec.buttons.length ? spec.buttons : [1, 10, 100, 1000]).filter((k) => k > 0 && k <= max);
  const runButtons = sizes.map((k, i) => button(`${cfg.verb} ${fmtInt(k)}`, () => run(k), { icon: i === 0 ? 'dice' : null, variant: i === sizes.length - 1 ? 'primary' : '' }));
  const resetBtn = button('Start again', () => restart(), { icon: 'reset', variant: 'ghost' });
  const note = h('p.w-hint');
  if (!env.compact && !spec.static) {
    fr.buttons.append(...runButtons, resetBtn);
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------------- draw */
  function mode() {
    if (!shown) return null;
    let best = 0;
    for (let i = 1; i < n; i++) if (shownCounts[i] > shownCounts[best]) best = i;
    return outcomes[best].label;
  }

  function draw() {
    const digits = n > 6 || shown < 20 ? 0 : 1;
    barEls.forEach(({ rect, label }, i) => {
      const p = shown ? shownCounts[i] / shown : 0;
      const y = by(p);
      rect.setAttribute('y', y);
      rect.setAttribute('height', Math.max(1.5, barsBox.b - y));
      label.setAttribute('y', Math.max(y - 6, 12));
      label.textContent = shown ? fmtPct(p, digits) : '';
    });
    if (showLine) {
      path.setAttribute('d', pathTo(shown));
      dot.setAttribute('visibility', shown ? 'visible' : 'hidden');
      if (shown) { dot.setAttribute('cx', lx(shown)); dot.setAttribute('cy', ly(cum[shown] / shown)); }
    }
    const share = shown ? cum[shown] / shown : 0;
    roTrials.set(fmtInt(shown));
    roTracked.set(fmtInt(cum[shown]));
    roShare.set(shown ? fmtPct(share) : '—');
    roMode.set(mode() == null ? '—' : mode());

    // the tape: the latest dice (if any) and the most recent results
    const from = Math.max(0, shown - 16);
    chips.replaceChildren();
    for (let i = from; i < shown; i++) {
      const o = outcomes[results[i]];
      chips.appendChild(h('span', { class: cx('cl-chip', `hue-${o.color}`, i === shown - 1 && 'is-last') }, o.short));
    }
    empty.hidden = shown > 0;
    roll.replaceChildren();
    const faces = shown === trials && trials > 0 ? cfg.faces() : null;
    if (faces) {
      for (const f of faces) roll.appendChild(dieFace(f));
      if (cfg.total) roll.appendChild(h('span', `= ${faces[0] + faces[1]}`));
    }

    if (streakLen) {
      const what = `${streakLen} ${trackLabel} in a row`;
      streakEl.innerHTML = mdInline(seen
        ? `After **${what}** (seen ${fmtInt(seen)} ${seen === 1 ? 'time' : 'times'}), the next ${cfg.one} was ${trackLabel} **${fmtInt(repeats)}** ${repeats === 1 ? 'time' : 'times'}: **${fmtPct(repeats / seen, seen >= 200 ? 1 : 0)}**`
        : `Waiting for the first run of **${what}**…`);
    }
    sync();
    svg.setAttribute('aria-label', shown
      ? `${fmtInt(shown)} ${cfg.unit}. ${outcomes.map((o, i) => `${o.label}: ${fmtPct(shownCounts[i] / shown, 0)}`).join(', ')}.`
      : `${spec.alt || 'Chance experiment'}. No ${cfg.unit} yet.`);
  }

  /** Button states follow the model at once, even while the drawing is still catching up. */
  function sync() {
    const full = trials >= max;
    for (const b of runButtons) b.disabled = readOnly || full;
    resetBtn.disabled = readOnly || trials === 0;
    note.textContent = full ? `That is as many ${cfg.unit} as this lab can hold. Start again for a fresh run.` : '';
  }

  const anim = loop(() => {
    const gap = trials - shown;
    if (gap <= 0) { anim.stop(); return; }
    advance(shown + Math.max(1, Math.ceil(gap * 0.14)));
    draw();
  });

  /* -------------------------------------------------------------- actions */
  function run(k) {
    if (readOnly || trials >= max) return;
    const before = trials;
    simulate(k);
    play(k === 1 ? 'tap' : 'tick');
    if (reducedMotion() || trials - before <= 1) { anim.stop(); advance(trials); draw(); } else { sync(); anim.start(); }
    if (trials - before === 1) env.announce(`${outcomes[results[trials - 1]].label}.`);
    else env.announce(`${fmtInt(trials)} ${cfg.unit}: ${fmtPct(cum[trials] / trials)} ${trackLabel}.`);
    env.onChange(getState());
  }

  function ghost() {
    if (!trials || !showLine) return;
    ghosts.push(pathTo(trials));
    ghosts = ghosts.slice(-4);
    gGhosts.replaceChildren(...ghosts.map((d) => s('path', { d, fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-linejoin': 'round', opacity: 0.45 })));
  }

  function restart() {
    if (readOnly || !trials) return;
    anim.stop();
    ghost();
    wipe();
    runs += 1;
    play('pop');
    draw();
    env.onChange(getState());
  }

  function getState() {
    let best = null;
    if (trials) { best = 0; for (let i = 1; i < n; i++) if (counts[i] > counts[best]) best = i; }
    const state = {
      trials,
      counts: counts.slice(),
      tracked: cum[trials],
      share: trials ? cum[trials] / trials : 0,
      mode: best == null ? null : outcomes[best].label,
      runs,
    };
    if (streakLen) state.streak = { length: streakLen, seen, repeats, share: seen ? repeats / seen : 0 };
    return state;
  }

  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(to) {
      if (!to || !(to.trials >= 0)) return;
      anim.stop();
      const k = Math.min(max, Math.round(to.trials));
      ghosts = [];
      gGhosts.replaceChildren();
      wipe();
      runs = 1;
      for (let i = 1; i < Math.max(1, Math.round(to.runs || 1)); i++) { simulate(k); ghost(); wipe(); runs += 1; }
      simulate(k);
      advance(trials);
      draw();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); draw(); },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'chance-lab — a fair coin: the share of heads settles toward 50%', spec: { type: 'chance-lab', kind: 'coin', track: 'Heads' } },
  { title: 'chance-lab — two dice: which total comes up most? (bars only)', spec: { type: 'chance-lab', kind: 'dice-sum', line: false, target: false, buttons: [1, 10, 100] } },
  { title: 'chance-lab — at least one six in four rolls', spec: { type: 'chance-lab', kind: 'dice-event', dice: 4, event: (f) => f.includes(6), labels: ['At least one six', 'No six'], trackLabel: 'at least one six', bars: false, target: false } },
  { title: 'chance-lab — does a streak change the next flip?', spec: { type: 'chance-lab', kind: 'coin', track: 'Heads', streak: 3, bars: false, buttons: [100, 1000, 10000], max: 100000 } },
];
