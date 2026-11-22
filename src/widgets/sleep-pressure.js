/**
 * sleep-pressure — the two-process model of sleep. Sleep pressure builds up
 * for every hour awake and drains away during sleep; the body clock adds an
 * alerting signal that is strongest in the early evening and weakest before
 * dawn. How sleepy a person feels is the gap between the two. The learner
 * moves bedtimes, wake-up times and naps and reads the curves.
 *
 * {
 *   type: 'sleep-pressure',
 *   from: 7, to: 41,            // the time window, in hours counted from midnight of the first day (41 = 17:00 on day 2)
 *   s0: 0.09,                   // sleep pressure at the left edge, from 0 to 1 (0.09 is a rested morning, 0.62 a normal bedtime)
 *   blocks: [                   // periods of sleep, in the same hours
 *     { id: 'nap', start: 18, end: 19.5, label: 'nap' },
 *     { id: 'night', start: 23, end: 31 },
 *   ],
 *   sliders: [                  // what the learner may change; each moves one number of one block
 *     { block: 'nap', edge: 'move', min: 12, max: 20, step: 0.5, label: 'nap starts at' },    // edge: 'start' | 'end' | 'move' | 'length'
 *     { block: 'nap', edge: 'length', min: 0, max: 2, step: 0.25, label: 'nap lasts' },
 *   ],
 *   clock: true,                // draw the body clock's alerting signal and shade the gap (the sleepiness)
 *   cursor: 12,                 // a draggable time marker that reads the curves (omit for none)
 *   bed: 'night',               // the block whose start is "bedtime" in the state (default: the last block)
 *   line: 62,                   // a dashed reference level of pressure (0 to 100), with `lineLabel`
 *   lineLabel: 'usual bedtime level',
 *   tick: 3,                    // hours between labels on the time axis
 * }
 *
 * State: { blocks: { id: { start, end, length } }, bedPressure, wakePressure, cursor, clock, asleep, pressure, alerting, sleepiness, worst: { t, clock, sleepiness } }
 *   bedPressure / wakePressure  sleep pressure (0 to 100, one decimal) at the start and at the end of the `bed` block
 *   cursor, clock               where the time marker stands (hours, and as "05:30")
 *   pressure, sleepiness        at the marker: pressure (0 to 100) and pressure minus the clock's alerting signal
 *   worst                       the moment of greatest sleepiness while awake in the window (to the nearest quarter of an hour)
 *
 * setState accepts { blocks: { id: { start, end } }, cursor }.
 *
 * The model (Borbély's two-process model, 1982, with the usual textbook constants): awake, pressure S rises
 * towards 1 with a time constant of 18.2 h; asleep, it decays with a time constant of 4.2 h. The clock's
 * alerting signal is 0.3·cos(2π(t − 17)/24): strongest at 17:00, weakest at 05:00. Sleepiness = S − signal.
 * A deliberately simple picture: it leaves out sleep inertia on waking, the afternoon dip, caffeine,
 * light, and the large differences between people.
 */
import { frame, handle, sliderRow, readout, hue, s, h, clamp, tidy, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 600;
const H = 300;
const PL = 44;
const PR = 14;
const PT = 30;
const PB = 34;
export const TAU_WAKE = 18.2;
export const TAU_SLEEP = 4.2;
export const CLOCK_AMP = 0.3;
export const CLOCK_PEAK = 17;
const CLOCK_MID = 0.45;       // where the alerting curve is drawn

addStyles('sleep-pressure', `
  .widget-sleep-pressure .sp-note { text-align: center; font-size: var(--fs-sm); min-height: 1.5em; margin: 0; color: var(--ink-2); }
  .widget-sleep-pressure .sp-note b { color: var(--ink); }
  .widget-sleep-pressure .sp-asleep { font-family: var(--font-body); font-size: 12px; font-weight: 800; fill: var(--violet-text); }
  @container wcanvas (max-width: 470px) { .widget-sleep-pressure .sp-asleep { font-size: 16px; } }
`);

const clockText = (hours) => {
  const total = Math.round((((hours % 24) + 24) % 24) * 60) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const durationText = (hours) => {
  const m = Math.round(hours * 60);
  if (m < 60) return `${m} min`;
  return m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`;
};
export const alerting = (t) => CLOCK_AMP * Math.cos((2 * Math.PI * (t - CLOCK_PEAK)) / 24);

export default function create(spec, env) {
  const from = spec.from != null ? spec.from : 7;
  const to = spec.to != null ? spec.to : from + 24;
  const s0 = spec.s0 != null ? spec.s0 : 0.09;
  const blocks = (spec.blocks || []).map((b) => ({ ...b }));
  const byId = (id) => blocks.find((b) => b.id === id);
  const bedBlock = () => byId(spec.bed) || blocks[blocks.length - 1] || null;
  const showClock = !!spec.clock;
  const isStatic = !!spec.static || !!env.compact;
  let cursor = spec.cursor != null && !isStatic ? clamp(spec.cursor, from, to) : null;
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Sleep pressure over time' });
  const { svg } = fr;
  const iw = W - PL - PR;
  const ih = H - PT - PB;
  const sx = (t) => PL + ((t - from) / (to - from)) * iw;
  const sy = (v) => PT + (1 - v / 1.1) * ih;

  /* ------------------------------------------------------------ the model */
  const sorted = () => blocks.filter((b) => b.end > b.start).slice().sort((a, b) => a.start - b.start);
  const asleepAt = (t) => sorted().some((b) => t >= b.start && t < b.end);
  /** Pressure at time t: piecewise exponentials from the left edge. */
  function pressureAt(t) {
    let S = s0;
    let u = from;
    for (const b of sorted()) {
      if (b.end <= from) continue;
      const a = Math.max(b.start, from);
      if (t <= a) break;
      S = 1 - (1 - S) * Math.exp(-(a - u) / TAU_WAKE);       // awake until the block starts
      const e = Math.min(b.end, t);
      S *= Math.exp(-(e - a) / TAU_SLEEP);                    // asleep
      u = e;
      if (t <= b.end) return S;
    }
    return 1 - (1 - S) * Math.exp(-(Math.max(t, u) - u) / TAU_WAKE);
  }
  const sleepinessAt = (t) => pressureAt(t) - alerting(t);
  function worst() {
    let best = null;
    for (let t = from; t <= to + 1e-9; t += 0.25) {
      if (asleepAt(t)) continue;
      const v = sleepinessAt(t);
      if (!best || v > best.v + 1e-12) best = { t, v };
    }
    return best ? { t: best.t, clock: clockText(best.t), sleepiness: Math.round(best.v * 100) } : null;
  }
  function getState() {
    const out = { blocks: {} };
    for (const b of blocks) out.blocks[b.id] = { start: b.start, end: b.end, length: tidy(b.end - b.start, 4) };
    const bed = bedBlock();
    out.bedPressure = bed ? tidy(pressureAt(bed.start) * 100, 1) : null;
    out.wakePressure = bed ? tidy(pressureAt(bed.end) * 100, 1) : null;
    if (cursor != null) {
      out.cursor = cursor;
      out.clock = clockText(cursor);
      out.asleep = asleepAt(cursor);
      out.pressure = Math.round(pressureAt(cursor) * 100);
      out.alerting = Math.round(alerting(cursor) * 100);
      out.sleepiness = Math.round(sleepinessAt(cursor) * 100);
    }
    out.worst = worst();
    return out;
  }

  /* -------------------------------------------------------------- drawing */
  const gBack = s('g');
  const gCurves = s('g');
  const gFront = s('g');
  svg.append(gBack, gCurves, gFront);
  const note = h('p.sp-note', { 'aria-live': 'polite' });
  const roBed = readout(spec.bedLabel || 'pressure at bedtime', { color: 'blue', digits: 0 });
  const rows = [];
  let hd = null;

  if (cursor != null) {
    hd = handle(svg, {
      x: sx(cursor), y: H - PB, r: 10, color: 'orange', label: 'Time marker', keyStep: (0.5 / (to - from)) * iw,
      onMove(x) {
        if (readOnly) return;
        const next = clamp(Math.round((from + ((x - PL) / iw) * (to - from)) * 2) / 2, from, to);
        if (next === cursor) return;
        cursor = next;
        play('tick');
        render();
        env.onChange(getState());
      },
    });
  }

  function render() {
    for (const g of [gBack, gCurves, gFront]) while (g.firstChild) g.removeChild(g.firstChild);
    // sleep blocks
    for (const b of sorted()) {
      const x1 = sx(clamp(b.start, from, to));
      const x2 = sx(clamp(b.end, from, to));
      if (x2 - x1 < 0.5) continue;
      gBack.appendChild(s('rect', { x: x1, y: PT, width: x2 - x1, height: ih, fill: hue('violet', 'soft') }));
      if (x2 - x1 > 34) gBack.appendChild(s('text.sp-asleep', { x: (x1 + x2) / 2, y: PT + 13, 'text-anchor': 'middle' }, b.label || 'asleep'));
    }
    // axes
    for (let v = 0; v <= 100; v += 25) {
      gBack.appendChild(s('line.grid-line', { x1: PL, x2: W - PR, y1: sy(v / 100), y2: sy(v / 100) }));
      gBack.appendChild(s('text.tick-label', { x: PL - 6, y: sy(v / 100) + 4, 'text-anchor': 'end' }, String(v)));
    }
    const tick = spec.tick || 3;
    for (let t = Math.ceil(from / tick) * tick; t <= to + 1e-9; t += tick) {
      gBack.appendChild(s('line', { x1: sx(t), x2: sx(t), y1: H - PB, y2: H - PB + 5, stroke: 'var(--ink)', 'stroke-width': 2 }));
      gBack.appendChild(s('text.tick-label', { x: sx(t), y: H - PB + 19, 'text-anchor': 'middle' }, clockText(t)));
      if (t % 24 === 0 && t > from) gBack.appendChild(s('line', { x1: sx(t), x2: sx(t), y1: PT, y2: H - PB, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '2 5' }));
    }
    gBack.appendChild(s('line', { x1: PL, x2: W - PR, y1: H - PB, y2: H - PB, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    gBack.appendChild(s('line', { x1: PL, x2: PL, y1: PT, y2: H - PB, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    if (spec.line != null) {
      gBack.appendChild(s('line', { x1: PL, x2: W - PR, y1: sy(spec.line / 100), y2: sy(spec.line / 100), stroke: hue('green'), 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }));
      gBack.appendChild(s('text', { class: 'fig-label-sm text-green', x: W - PR - 4, y: sy(spec.line / 100) - 6, 'text-anchor': 'end' }, spec.lineLabel || `level ${spec.line}`));
    }
    // curves
    const n = 240;
    let dS = '';
    let dC = '';
    let gap = '';
    for (let i = 0; i <= n; i++) {
      const t = from + ((to - from) * i) / n;
      const S = pressureAt(t);
      dS += `${i ? 'L' : 'M'}${sx(t).toFixed(1)} ${sy(S).toFixed(1)}`;
      if (showClock) {
        const c = CLOCK_MID + alerting(t);
        dC += `${i ? 'L' : 'M'}${sx(t).toFixed(1)} ${sy(c).toFixed(1)}`;
        if (!asleepAt(t) && S > c && i % 3 === 0) gap += `M${sx(t).toFixed(1)} ${sy(S).toFixed(1)}V${sy(c).toFixed(1)}`;
      }
    }
    if (gap) gCurves.appendChild(s('path', { d: gap, fill: 'none', stroke: hue('red'), 'stroke-width': 2, opacity: 0.35 }));
    if (showClock) {
      gCurves.appendChild(s('path', { d: dC, fill: 'none', stroke: hue('orange'), 'stroke-width': 3, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }));
      gCurves.appendChild(s('text', { class: 'fig-label-sm text-orange', x: sx(CLOCK_PEAK + (from > CLOCK_PEAK ? 24 : 0)), y: sy(CLOCK_MID + CLOCK_AMP) - 12, 'text-anchor': 'middle' }, "clock's alerting signal"));
    }
    gCurves.appendChild(s('path', { d: dS, fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    gCurves.appendChild(s('text', { class: 'fig-label-sm text-blue', x: PL + 8, y: PT - 10, 'text-anchor': 'start' }, 'sleep pressure (0 to 100)'));

    const st = getState();
    const bed = bedBlock();
    if (bed && bed.start >= from && bed.start <= to) {
      const bx = sx(bed.start);
      const by = sy(pressureAt(bed.start));
      gFront.appendChild(s('circle', { cx: bx, cy: by, r: 6, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      gFront.appendChild(s('text', { class: 'fig-label text-blue', x: clamp(bx - 10, PL + 30, W - PR - 30), y: by - 12, 'text-anchor': 'end' }, String(Math.round(st.bedPressure))));
      roBed.set(`${Math.round(st.bedPressure)} at ${clockText(bed.start)}`);
    }
    if (cursor != null) {
      const x = sx(cursor);
      gFront.appendChild(s('line', { x1: x, x2: x, y1: PT, y2: H - PB, stroke: hue('orange'), 'stroke-width': 2.5 }));
      gFront.appendChild(s('circle', { cx: x, cy: sy(pressureAt(cursor)), r: 5.5, fill: hue('blue'), stroke: 'var(--ink)', 'stroke-width': 2 }));
      if (showClock) gFront.appendChild(s('circle', { cx: x, cy: sy(CLOCK_MID + alerting(cursor)), r: 5.5, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2 }));
      gFront.appendChild(hd.el);
      hd.set(x, H - PB);
      hd.setLabel(`${st.clock}: pressure ${st.pressure}${showClock ? `, sleepiness ${st.sleepiness}` : ''}`);
      note.innerHTML = '';
      note.append(h('b', `${st.clock}: `), st.asleep ? `asleep, pressure ${st.pressure}` : `pressure ${st.pressure}${showClock ? `, alerting signal ${st.alerting > 0 ? '+' : st.alerting < 0 ? '−' : ''}${Math.abs(st.alerting)}, ` : ''}`, !st.asleep && showClock ? h('b', `sleepiness ${st.sleepiness}`) : '');
    }
    svg.setAttribute('aria-label', `${spec.alt || 'Sleep pressure over time'}.${bed ? ` Pressure at ${clockText(bed.start)}, when sleep starts: ${Math.round(st.bedPressure)} out of 100.` : ''}${cursor != null ? ` Marker at ${st.clock}: pressure ${st.pressure}${showClock ? `, sleepiness ${st.sleepiness}` : ''}.` : ''}`);
  }

  if (!isStatic) {
    if (cursor != null) fr.el.insertBefore(note, fr.readouts);
    if (bedBlock() && spec.bedReadout !== false) fr.readouts.appendChild(roBed.el);
    for (const def of spec.sliders || []) {
      const b = byId(def.block);
      if (!b) continue;
      const value = def.edge === 'length' ? b.end - b.start : def.edge === 'end' ? b.end : b.start;
      const row = sliderRow({
        label: def.label || def.edge, min: def.min, max: def.max, step: def.step || 0.5, value, color: def.color || 'violet',
        format: def.edge === 'length' ? durationText : clockText,
        onInput: (v) => {
          if (readOnly) return;
          if (def.edge === 'length') b.end = b.start + v;
          else if (def.edge === 'end') b.end = v;
          else if (def.edge === 'move') { const len = b.end - b.start; b.start = v; b.end = v + len; }
          else b.start = v;
          play('tap');
          render();
          env.onChange(getState());
        },
      });
      rows.push({ def, row });
      fr.controls.appendChild(row.el);
    }
  }
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.blocks) {
        for (const id of Object.keys(next.blocks)) {
          const b = byId(id);
          if (!b) continue;
          const nb = next.blocks[id];
          if (typeof nb.start === 'number') b.start = nb.start;
          if (typeof nb.end === 'number') b.end = nb.end;
          else if (typeof nb.length === 'number') b.end = b.start + nb.length;
        }
        for (const { def, row } of rows) {
          const b = byId(def.block);
          row.set(def.edge === 'length' ? b.end - b.start : def.edge === 'end' ? b.end : b.start);
        }
      }
      if (typeof next.cursor === 'number' && cursor != null) cursor = clamp(next.cursor, from, to);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const { row } of rows) row.setDisabled(readOnly);
      if (hd) hd.setEnabled(!readOnly);
    },
    destroy() { if (hd) hd.destroy(); },
  };
}

export const examples = [
  { title: 'sleep-pressure — a night without sleep', spec: { type: 'sleep-pressure', from: 7, to: 41, s0: 0.09, clock: true, cursor: 12, tick: 3 } },
  { title: 'sleep-pressure — where to put a nap', spec: { type: 'sleep-pressure', from: 7, to: 31, s0: 0.09, blocks: [{ id: 'nap', start: 18, end: 19.5, label: 'nap' }, { id: 'night', start: 23, end: 31 }], sliders: [{ block: 'nap', edge: 'move', min: 12, max: 20, step: 0.5, label: 'nap starts at' }, { block: 'nap', edge: 'length', min: 0, max: 2, step: 0.25, label: 'nap lasts' }], line: 58, lineLabel: 'falls asleep easily' } },
];
