/**
 * training-sim — two small models of how a body answers to training, each
 * drawn as a curve the learner shapes.
 *
 * mode 'recovery' (days): stress → recovery → adaptation. The learner taps
 * days on a three-week calendar to place hard sessions. Each session knocks
 * capacity down (fatigue); as the fatigue clears, capacity climbs back and a
 * little beyond where it was; with no further training the extra fades.
 * Sessions too close together start from the dip, sessions too far apart
 * start from scratch.
 *
 * mode 'overload' (weeks): progressive overload. Sixteen weeks in four blocks;
 * for each block the learner chooses rest, the same load as before, or a load
 * that goes up as strength does. The curve shows strength, split into what
 * the nervous system has learned and what the muscle has grown.
 *
 * {
 *   type: 'training-sim',
 *   mode: 'recovery',            // 'recovery' | 'overload'
 *
 *   // recovery
 *   days: [1],                   // days (1…horizon) with a hard session, placed at the start of the day
 *   horizon: 21,                 // 14 or 21
 *   lock: [1],                   // days the learner cannot change
 *   max: null,                   // most sessions allowed (null: no limit)
 *
 *   // overload
 *   plan: ['same', 'same', 'same', 'same'],   // one of 'rest' | 'same' | 'up' for each four-week block
 *   lockPlan: [0],               // blocks the learner cannot change
 *   split: true,                 // show the two parts of the gain (nerve learning, muscle growth)
 *
 *   static: false,               // true: a picture without controls
 *   note: true,                  // false: no sentence under the chart (for a question that asks the learner to read the curve)
 * }
 *
 * State (recovery): { mode, days, sessions, end, gain, peak, peakDay, low, longestRun, longestGap, tried }
 *   end        — capacity at the end of the last day (start = 100), one decimal
 *   gain       — end − 100
 *   peak, low  — highest and lowest capacity reached;  peakDay — when the peak comes, in days from the start
 *   longestRun — most session days in a row;  longestGap — most days in a row without a session between sessions
 *   tried      — how many different schedules the learner has looked at
 * State (overload): { mode, plan, end, gain, peak, neural, muscle, lastBlock, tried, seen }
 *   end        — strength at week 16 (start = 100), one decimal;  peak — highest reached
 *   neural, muscle — the two parts of the gain at week 16
 *   lastBlock  — change of strength over the last block
 *   seen       — the plans looked at so far, each as a string such as 'same,same,up,rest'
 *
 * setState({ days }) or setState({ plan, seen }) restores a state.
 *
 * The models are cartoons with made-up units, exported as `recover` and
 * `overload` so that lessons and tests can use the same numbers.
 * Recovery: a session adds 12 points of fatigue, which fades with a time
 * constant of 1.2 days, and earns a gain of 10 × (1 − fatigue before the
 * session ÷ 9) points, delivered over about a day; gains fade with a time
 * constant of 5 days. It leaves out that easy sessions need far less recovery
 * than hard ones, that fitter people recover faster, and that heart, muscle,
 * tendon and bone adapt at very different speeds.
 * Overload: each week of training with a load of at least 60% of current
 * strength adds to nerve learning (fast, up to 20 points) and to muscle
 * growth (slow, up to 40 points); the stimulus shrinks as strength outgrows a
 * fixed load. Without training, muscle is lost faster than skill.
 */
import { frame, plane, button, readout, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

const W = 560;
const H = 250;

/* ------------------------------------------------------------------ models */

const REC = { hit: 12, clear: 1.2, earn: 10, tooTired: 9, deliver: 1, fade: 5, dt: 1 / 16 };

/**
 * Capacity over time for hard sessions at the start of the given days.
 * @returns {{ t: number[], level: number[], end, gain, peak, peakDay, low, sessions, longestRun, longestGap }}
 */
export function recover(days, horizon = 21) {
  const list = [...new Set((days || []).map((d) => Math.round(d)).filter((d) => d >= 1 && d <= horizon))].sort((a, b) => a - b);
  const at = new Set(list.map((d) => d - 1));
  const n = Math.round(horizon / REC.dt);
  const t = [];
  const level = [];
  let fitness = 100;
  let fatigue = 0;
  let pending = 0;
  let peak = -Infinity;
  let low = Infinity;
  let peakDay = 0;
  for (let i = 0; i <= n; i++) {
    const time = i * REC.dt;
    if (i < n && Number.isInteger(time) && at.has(time)) {
      pending += REC.earn * (1 - fatigue / REC.tooTired);
      fatigue += REC.hit;
    }
    const value = fitness - fatigue;
    t.push(time);
    level.push(value);
    if (value > peak + 1e-9) { peak = value; peakDay = time; }
    if (value < low) low = value;
    // one step of the three slow processes
    const release = pending * (1 - Math.exp(-REC.dt / REC.deliver));
    pending -= release;
    fitness = 100 + (fitness - 100) * Math.exp(-REC.dt / REC.fade) + release;
    fatigue *= Math.exp(-REC.dt / REC.clear);
  }
  let longestRun = 0;
  let longestGap = 0;
  let run = 0;
  for (let i = 0; i < list.length; i++) {
    run = i > 0 && list[i] === list[i - 1] + 1 ? run + 1 : 1;
    longestRun = Math.max(longestRun, run);
    if (i > 0) longestGap = Math.max(longestGap, list[i] - list[i - 1] - 1);
  }
  const end = level[level.length - 1];
  return {
    t, level, days: list, sessions: list.length,
    end: tidy(end, 1), gain: tidy(end - 100, 1), peak: tidy(peak, 1), peakDay: tidy(peakDay, 1), low: tidy(low, 1),
    longestRun, longestGap,
  };
}

const OVER = { start: 75, floor: 0.6, band: 0.15, neuralMax: 20, neuralRate: 0.3, muscleMax: 40, muscleRate: 0.05, neuralLoss: 0.04, muscleLoss: 0.1, block: 4 };
export const PLAN_KINDS = ['rest', 'same', 'up'];

/**
 * Strength week by week for a plan of four-week blocks.
 * @param {string[]} plan one of 'rest' | 'same' | 'up' per block
 * @returns {{ weeks: { neural, muscle, total }[], end, gain, peak, neural, muscle, lastBlock }}
 */
export function overload(plan) {
  const blocks = (plan || []).map((k) => (PLAN_KINDS.includes(k) ? k : 'same'));
  let neural = 0;
  let muscle = 0;
  let load = OVER.start;
  const weeks = [{ neural: 0, muscle: 0, total: 100 }];
  for (const kind of blocks) {
    for (let w = 0; w < OVER.block; w++) {
      const strength = 100 + neural + muscle;
      if (kind === 'rest') {
        neural -= OVER.neuralLoss * neural;
        muscle -= OVER.muscleLoss * muscle;
      } else {
        if (kind === 'up') load = Math.max(load, 0.75 * strength);
        const stimulus = clamp((load / strength - OVER.floor) / OVER.band, 0, 1);
        neural += OVER.neuralRate * stimulus * (OVER.neuralMax - neural);
        muscle += OVER.muscleRate * stimulus * (OVER.muscleMax - muscle);
      }
      weeks.push({ neural, muscle, total: 100 + neural + muscle });
    }
  }
  const last = weeks[weeks.length - 1];
  const before = weeks[Math.max(0, weeks.length - 1 - OVER.block)];
  return {
    weeks, plan: blocks,
    end: tidy(last.total, 1), gain: tidy(last.total - 100, 1), peak: tidy(Math.max(...weeks.map((w) => w.total)), 1),
    neural: tidy(last.neural, 1), muscle: tidy(last.muscle, 1), lastBlock: tidy(last.total - before.total, 1),
  };
}

/* ------------------------------------------------------------------ styles */

addStyles('training-sim', `
  .widget-training-sim .ts-cal { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; width: 100%; max-width: 520px; justify-self: center; }
  .widget-training-sim .ts-day {
    min-height: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1;
    border: var(--bw) solid var(--edge); border-radius: var(--r-sm); background: var(--surface); color: var(--ink-2);
    font-size: var(--fs-sm); font-weight: 700; font-variant-numeric: tabular-nums; cursor: pointer; user-select: none; -webkit-user-select: none;
  }
  .widget-training-sim .ts-day b { display: block; height: 10px; width: 10px; margin-top: 3px; border-radius: 50%; border: 2px solid transparent; }
  .widget-training-sim .ts-day[aria-pressed="true"] { background: var(--orange-soft); border-color: var(--orange); color: var(--ink); box-shadow: inset 0 0 0 1px var(--orange); }
  .widget-training-sim .ts-day[aria-pressed="true"] b { background: var(--orange); border-color: var(--ink); }
  .widget-training-sim .ts-day[aria-disabled="true"] { cursor: default; border-style: dashed; }
  .widget-training-sim .ts-day:focus-visible, .widget-training-sim .ts-opt:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-training-sim.is-readonly .ts-day, .widget-training-sim.is-readonly .ts-opt { cursor: default; }
  .widget-training-sim .ts-plan { display: grid; gap: 6px; width: 100%; max-width: 540px; justify-self: center; }
  .widget-training-sim .ts-block { display: grid; grid-template-columns: 5.6em repeat(3, minmax(0, 1fr)); gap: 4px; align-items: center; font-size: var(--fs-sm); font-weight: 700; }
  .widget-training-sim .ts-opt {
    min-height: 40px; padding: 0.25rem 0.3rem; display: flex; align-items: center; justify-content: center; text-align: center; line-height: 1.15;
    border: var(--bw) solid var(--edge); border-radius: var(--r-sm); background: var(--surface); color: var(--ink-2); cursor: pointer; user-select: none; -webkit-user-select: none;
  }
  .widget-training-sim .ts-opt[aria-checked="true"] { background: var(--blue-soft); border-color: var(--blue); color: var(--ink); box-shadow: inset 0 0 0 1px var(--blue); }
  .widget-training-sim .ts-opt[aria-disabled="true"] { cursor: default; border-style: dashed; }
  .widget-training-sim .ts-note { margin: 0; text-align: center; font-size: var(--fs-sm); color: var(--ink-2); min-height: 2.5em; text-wrap: balance; }
  .widget-training-sim .ts-key { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px var(--s4); font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-training-sim .ts-key i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; border: 1.5px solid var(--edge-strong); margin-right: 5px; vertical-align: -1px; }
`);

const KIND_LABEL = { rest: 'No training', same: 'Same load', up: 'Load goes up' };
const KIND_SHORT = { rest: 'rest', same: 'same load', up: 'load goes up' };

export default function create(spec, env) {
  const mode = spec.mode === 'overload' ? 'overload' : 'recovery';
  const isStatic = !!spec.static || !!env.compact;
  let readOnly = !!env.readOnly;
  const horizon = spec.horizon === 14 ? 14 : 21;
  const lock = new Set(Array.isArray(spec.lock) ? spec.lock : []);
  const lockPlan = new Set(Array.isArray(spec.lockPlan) ? spec.lockPlan : []);
  const maxSessions = Number.isFinite(spec.max) ? spec.max : null;
  const showSplit = spec.split !== false;
  let days = (Array.isArray(spec.days) ? spec.days : []).filter((d) => d >= 1 && d <= horizon);
  let plan = (Array.isArray(spec.plan) && spec.plan.length === 4 ? spec.plan : ['same', 'same', 'same', 'same']).map((k) => (PLAN_KINDS.includes(k) ? k : 'same'));
  const seen = [];        // signatures of the schedules or plans looked at

  const label = spec.alt || (mode === 'recovery' ? 'Capacity over three weeks of training' : 'Strength over sixteen weeks of training');
  const fr = frame({ width: W, height: H, compact: env.compact, label });
  const { svg } = fr;
  const pl = mode === 'recovery'
    ? plane({ x: [0, horizon], y: [75, 120], width: W, height: H, pad: { l: 44, r: 18, t: 16, b: 32 } })
    : plane({ x: [0, 16], y: [95, 150], width: W, height: H, pad: { l: 44, r: 18, t: 16, b: 32 } });

  /* ------------------------------------------------------------ the axes */
  const gGrid = s('g');
  svg.appendChild(gGrid);
  const yTicks = mode === 'recovery' ? [80, 90, 100, 110, 120] : [100, 110, 120, 130, 140, 150];
  for (const v of yTicks) {
    gGrid.appendChild(s('line.grid-line', { x1: pl.left, x2: pl.right, y1: pl.sy(v), y2: pl.sy(v) }));
    gGrid.appendChild(s('text.tick-label', { x: pl.left - 7, y: pl.sy(v) + 4, 'text-anchor': 'end' }, String(v)));
  }
  if (mode === 'recovery') {
    for (let d = 0; d <= horizon; d += 7) gGrid.appendChild(s('line.grid-line', { x1: pl.sx(d), x2: pl.sx(d), y1: pl.top, y2: pl.bottom }));
    // each day has a slot: a session is placed at its left edge (the morning); every other slot carries its number
    for (let d = 1; d <= horizon; d++) {
      gGrid.appendChild(s('line', { x1: pl.sx(d), x2: pl.sx(d), y1: pl.bottom, y2: pl.bottom + 4, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
      if (d % 2) gGrid.appendChild(s('text.tick-label', { x: pl.sx(d - 0.5), y: pl.bottom + 20, 'text-anchor': 'middle' }, String(d)));
    }
  } else {
    for (let w = 0; w <= 16; w += 4) {
      gGrid.appendChild(s('line.grid-line', { x1: pl.sx(w), x2: pl.sx(w), y1: pl.top, y2: pl.bottom }));
      gGrid.appendChild(s('text.tick-label', { x: pl.sx(w), y: pl.bottom + 20, 'text-anchor': w === 0 ? 'start' : w === 16 ? 'end' : 'middle' }, w === 0 ? 'start' : `week ${w}`));
    }
  }
  svg.appendChild(s('line.axis-line', { x1: pl.left, x2: pl.left, y1: pl.top, y2: pl.bottom }));
  svg.appendChild(s('line.axis-line', { x1: pl.left, x2: pl.right, y1: pl.bottom, y2: pl.bottom }));
  svg.appendChild(s('text.axis-label', { x: pl.left + 8, y: pl.top + 10 }, mode === 'recovery' ? 'capacity (start = 100), day by day' : 'strength (start = 100)'));
  const base = s('line', { x1: pl.left, x2: pl.right, y1: pl.sy(100), y2: pl.sy(100), stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '6 6' });
  svg.appendChild(base);
  const gAreas = s('g');
  const gMarks = s('g');
  const curve = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const endDot = s('circle', { r: 6, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
  const endLabel = s('text.fig-label', { 'text-anchor': 'end' });
  const gBlocks = s('g');
  svg.append(gAreas, gMarks, curve, gBlocks, endDot, endLabel);

  /* ------------------------------------------------------------ controls */
  const note = h('p.ts-note', { 'aria-live': 'polite' });
  const roA = readout(mode === 'recovery' ? 'sessions' : 'week 16', { digits: 0 });
  const roB = readout(mode === 'recovery' ? 'at the end' : 'change in the last block', { digits: 0 });
  const dayEls = new Map();
  const optEls = [];
  let clearBtn = null;

  const sig = () => (mode === 'recovery' ? days.slice().sort((a, b) => a - b).join(',') : plan.join(','));
  const remember = () => { const k = sig(); if (!seen.includes(k)) { seen.push(k); if (seen.length > 40) seen.shift(); } };
  const changed = () => { remember(); render(); env.onChange(getState()); };

  if (!isStatic) {
    fr.readouts.append(roA.el, roB.el);
    if (mode === 'recovery') {
      const cal = h('div.ts-cal', { role: 'group', 'aria-label': 'Training days: press a day to add or remove a hard session' });
      for (let d = 1; d <= horizon; d++) {
        const el = h('div.ts-day', { role: 'button', tabindex: '0', 'aria-pressed': 'false', 'aria-label': `Day ${d}` }, String(d), h('b'));
        el.dataset.keys = 'own';
        if (lock.has(d)) el.setAttribute('aria-disabled', 'true');
        const toggle = () => {
          if (readOnly || lock.has(d)) return;
          if (days.includes(d)) days = days.filter((x) => x !== d);
          else {
            if (maxSessions != null && days.length >= maxSessions) { note.textContent = `This plan allows ${maxSessions} sessions. Remove one to move it.`; env.announce(note.textContent); return; }
            days = [...days, d];
          }
          play('tap');
          changed();
        };
        el.addEventListener('click', toggle);
        el.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggle(); return; }
          const move = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[ev.key];
          if (move) { const to = dayEls.get(d + move); if (to) { ev.preventDefault(); to.focus(); } }
        });
        dayEls.set(d, el);
        cal.appendChild(el);
      }
      fr.el.insertBefore(cal, fr.readouts);
      clearBtn = button('Clear', () => { if (readOnly) return; days = days.filter((d) => lock.has(d)); changed(); }, { icon: 'reset', variant: 'ghost' });
      fr.buttons.appendChild(clearBtn);
    } else {
      const wrap = h('div.ts-plan');
      plan.forEach((_, b) => {
        const row = h('div.ts-block', { role: 'radiogroup', 'aria-label': `Weeks ${b * 4 + 1} to ${b * 4 + 4}` }, h('span', `Weeks ${b * 4 + 1}–${b * 4 + 4}`));
        optEls[b] = {};
        for (const kind of PLAN_KINDS) {
          const el = h('div.ts-opt', { role: 'radio', tabindex: '0', 'aria-checked': 'false' }, KIND_LABEL[kind]);
          el.dataset.keys = 'own';
          if (lockPlan.has(b)) el.setAttribute('aria-disabled', 'true');
          const choose = () => {
            if (readOnly || lockPlan.has(b) || plan[b] === kind) return;
            plan = plan.map((k, i) => (i === b ? kind : k));
            play('select');
            changed();
          };
          el.addEventListener('click', choose);
          el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); choose(); } });
          optEls[b][kind] = el;
          row.appendChild(el);
        }
        wrap.appendChild(row);
      });
      fr.el.insertBefore(wrap, fr.readouts);
    }
  }
  if (mode === 'overload' && showSplit && !env.compact) {
    const sw = (color) => { const i = h('i'); i.style.background = hue(color, 'soft'); i.style.borderColor = hue(color); return i; };
    fr.el.insertBefore(h('div.ts-key', h('span', sw('violet'), 'nerve learning'), h('span', sw('orange'), 'muscle growth')), fr.readouts);
  }
  if (!env.compact && spec.note !== false) fr.el.appendChild(note);

  /* -------------------------------------------------------------- render */
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  const path = (xs, ys) => xs.map((x, i) => `${i ? 'L' : 'M'}${pl.sx(x).toFixed(1)} ${pl.sy(clamp(ys[i], pl.y0, pl.y1)).toFixed(1)}`).join('');
  const whole = (v) => formatNumber(Math.round(v), 0);

  function describeRecovery(r) {
    if (!r.sessions) return 'No training: capacity stays where it started.';
    if (r.sessions === 1) return `One session: a dip, then a peak of ${whole(r.peak)} about ${whole(r.peakDay - (r.days[0] - 1))} days later, then the gain fades.`;
    if (r.gain >= 6) return `Well spaced: each session lands as the last one is paying off. Capacity ends at ${whole(r.end)}.`;
    if (r.longestRun >= 4 && r.gain < 2) return `Sessions on ${r.longestRun} days running: each one starts in the dip of the last. Capacity ends at ${whole(r.end)}.`;
    if (r.gain < 2) return `Capacity ends at ${whole(r.end)}: hardly above the start.`;
    return `Capacity ends at ${whole(r.end)}.`;
  }
  function describeOverload(o) {
    const last = o.plan[3];
    if (o.plan.every((k) => k === 'rest')) return 'No training: strength stays where it started.';
    if (last === 'rest') return `Without training, strength drifts back down: ${whole(o.end)} at week 16.`;
    if (o.lastBlock < 1.5) return `Strength has levelled off at ${whole(o.end)}: the load no longer asks for more.`;
    return `Still rising in the last block: ${whole(o.end)} at week 16.`;
  }

  function render() {
    clear(gAreas);
    clear(gMarks);
    clear(gBlocks);
    if (mode === 'recovery') {
      const r = recover(days, horizon);
      curve.setAttribute('d', path(r.t, r.level));
      for (const d of r.days) {
        const x = pl.sx(d - 1);
        gMarks.appendChild(s('line', { x1: x, x2: x, y1: pl.bottom, y2: pl.top + 4, stroke: hue('orange'), 'stroke-width': 2, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }));
        gMarks.appendChild(s('path', { d: `M${x - 6} ${pl.bottom + 1}L${x + 6} ${pl.bottom + 1}L${x} ${pl.bottom - 10}Z`, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
      }
      const ex = pl.sx(horizon);
      const ey = pl.sy(clamp(r.end, pl.y0, pl.y1));
      endDot.setAttribute('cx', ex); endDot.setAttribute('cy', ey);
      endLabel.setAttribute('x', ex - 10); endLabel.setAttribute('y', ey - 12 < pl.top + 14 ? ey + 22 : ey - 12);
      endLabel.textContent = whole(r.end);
      roA.set(String(r.sessions));
      roB.set(whole(r.end));
      for (const [d, el] of dayEls) el.setAttribute('aria-pressed', String(r.days.includes(d)));
      if (clearBtn) clearBtn.disabled = readOnly || !days.some((d) => !lock.has(d));
      note.textContent = describeRecovery(r);
      svg.setAttribute('aria-label', `${label}. ${r.sessions ? `Hard sessions on day${r.sessions === 1 ? '' : 's'} ${r.days.join(', ')}.` : 'No sessions.'} Capacity starts at 100, dips as low as ${whole(r.low)}, peaks at ${whole(r.peak)} and ends at ${whole(r.end)}.`);
    } else {
      const o = overload(plan);
      const xs = o.weeks.map((_, i) => i);
      if (showSplit) {
        const lower = o.weeks.map((w) => 100 + w.neural);
        const up = (ys) => xs.map((x, i) => `${i ? 'L' : 'M'}${pl.sx(x).toFixed(1)} ${pl.sy(ys[i]).toFixed(1)}`).join('');
        const down = (ys) => xs.slice().reverse().map((x) => `L${pl.sx(x).toFixed(1)} ${pl.sy(ys[x]).toFixed(1)}`).join('');
        gAreas.appendChild(s('path', { d: `${up(lower)}${down(xs.map(() => 100))}Z`, fill: hue('violet', 'soft'), stroke: hue('violet'), 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
        gAreas.appendChild(s('path', { d: `${up(o.weeks.map((w) => w.total))}${down(lower)}Z`, fill: hue('orange', 'soft'), stroke: hue('orange'), 'stroke-width': 1.5, 'stroke-linejoin': 'round' }));
      }
      curve.setAttribute('d', path(xs, o.weeks.map((w) => w.total)));
      o.plan.forEach((kind, b) => {
        gBlocks.appendChild(s('text.fig-label-sm', { x: pl.sx(b * 4 + 2), y: pl.bottom - 8, 'text-anchor': 'middle' }, KIND_SHORT[kind]));
        for (const k of PLAN_KINDS) if (optEls[b]) optEls[b][k].setAttribute('aria-checked', String(k === kind));
      });
      const ex = pl.sx(16);
      const ey = pl.sy(o.end);
      endDot.setAttribute('cx', ex); endDot.setAttribute('cy', ey);
      endLabel.setAttribute('x', ex - 10); endLabel.setAttribute('y', ey - 12);
      endLabel.textContent = whole(o.end);
      roA.set(whole(o.end));
      roB.set(`${o.lastBlock >= 0.5 ? '+' : ''}${whole(o.lastBlock)}`);
      note.textContent = describeOverload(o);
      svg.setAttribute('aria-label', `${label}. Plan: ${o.plan.map((k, b) => `weeks ${b * 4 + 1} to ${b * 4 + 4} ${KIND_SHORT[k]}`).join('; ')}. Strength starts at 100 and is ${whole(o.end)} at week 16${showSplit ? `: ${whole(o.neural)} points from nerve learning and ${whole(o.muscle)} from muscle growth` : ''}.`);
    }
  }

  function getState() {
    if (mode === 'recovery') {
      const r = recover(days, horizon);
      return { mode, days: r.days, sessions: r.sessions, end: r.end, gain: r.gain, peak: r.peak, peakDay: r.peakDay, low: r.low, longestRun: r.longestRun, longestGap: r.longestGap, tried: seen.length };
    }
    const o = overload(plan);
    return { mode, plan: o.plan, end: o.end, gain: o.gain, peak: o.peak, neural: o.neural, muscle: o.muscle, lastBlock: o.lastBlock, tried: seen.length, seen: seen.slice() };
  }

  remember();
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'recovery' && Array.isArray(next.days)) days = [...new Set([...next.days.filter((d) => d >= 1 && d <= horizon), ...[...lock].filter((d) => (Array.isArray(spec.days) ? spec.days : []).includes(d))])];
      if (mode === 'overload') {
        if (Array.isArray(next.seen)) for (const k of next.seen) if (typeof k === 'string' && !seen.includes(k)) seen.push(k);
        if (Array.isArray(next.plan) && next.plan.length === 4) plan = next.plan.map((k) => (PLAN_KINDS.includes(k) ? k : 'same'));
      }
      remember();
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const el of dayEls.values()) el.setAttribute('tabindex', readOnly ? '-1' : '0');
      for (const row of optEls) for (const k of Object.keys(row || {})) row[k].setAttribute('tabindex', readOnly ? '-1' : '0');
      if (clearBtn) clearBtn.disabled = readOnly || !days.some((d) => !lock.has(d));
    },
  };
}

export const examples = [
  { title: 'training-sim — one hard session', spec: { type: 'training-sim', mode: 'recovery', days: [1] } },
  { title: 'training-sim — place the sessions', spec: { type: 'training-sim', mode: 'recovery', days: [1, 4, 7, 10, 13, 16, 19] } },
  { title: 'training-sim — progressive overload', spec: { type: 'training-sim', mode: 'overload', plan: ['same', 'same', 'up', 'rest'] } },
];
