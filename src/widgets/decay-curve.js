/**
 * decay-curve — things that arrive in a burst and wear off with a half-life:
 * caffeine after each cup, stress hormones after each alarm. Every event adds
 * its own curve; the widget draws the total. The learner drags the events
 * along the time axis, adds or removes them, and (optionally) changes the
 * half-life, and reads what is left at a marked moment.
 *
 * {
 *   type: 'decay-curve',
 *   from: 6, to: 26,              // the time axis (26 = 02:00 the next day when `clock` is true)
 *   clock: true,                  // true: the axis is hours of the day, labelled 06:00, 08:00 …; false: plain numbers
 *   xTick: 2, xUnit: 'min',       // spacing of the labels; unit written after the last number when clock is false
 *   yMax: 220, yTick: 50, unit: 'mg', yLabel: 'caffeine in the body',
 *   curves: [                     // one or more substances; every event feeds all of them
 *     { id: 'caffeine', label: 'caffeine', color: 'orange', halfLife: 5, rise: 0, gain: 1 },
 *   ],                            // rise 0: the whole amount arrives at once; rise > 0: it builds up with that time constant
 *   events: [{ t: 15, amount: 100 }],
 *   eventName: 'coffee',          // what one event is called (labels and buttons)
 *   edit: 'move',                 // 'move' (drag the events) | 'add' (drag, add and remove) | 'none'
 *   amount: 100, maxEvents: 4,    // add: the size of a new event and how many there may be
 *   snap: 0.5, minT: 6, maxT: 23, // dragging: step and limits
 *   halfLife: { min: 3, max: 8, step: 1, label: 'half-life', unit: 'h' },   // optional slider for curve 0
 *   marker: { t: 23, label: 'bedtime' },      // a marked moment; the state says what is left then
 *   line: { y: 25, label: '25 mg' },          // a dashed level; the state says how long curve `watch` stays above it
 *   watch: 0,                     // which curve the facts in the state describe
 * }
 *
 * State: { events: [{ t, amount }], count, halfLife, atMarker, peak, above, clearAt }
 *   events    sorted by time
 *   halfLife  of the watched curve
 *   atMarker  level of the watched curve at the marker (one decimal; null without a marker)
 *   peak      its highest level in the window (one decimal)
 *   above     how long it stays above the line, in the units of the time axis (to the nearest tenth; 0 without a line)
 *   clearAt   the last moment in the window at which it is above the line (null if never)
 *
 * setState accepts { events: [{ t, amount }], halfLife }.
 *
 * The model: after an event of size A, a curve with half-life h and no rise time is A·gain·(1/2)^(Δt/h).
 * With a rise time r it is A·gain·(e^(−Δt/d) − e^(−Δt/r)), scaled so that its peak is A·gain, where
 * d = h / ln 2. Several events simply add. Real bodies are messier: caffeine takes half an hour or more
 * to be absorbed, and half-lives differ widely between people.
 */
import { frame, handle, sliderRow, readout, button, hue, s, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';

const W = 600;
const H = 300;
const PL = 46;
const PR = 28;
const PT = 26;
const PB = 44;

addStyles('decay-curve', `
  .widget-decay-curve .dc-value { font-family: var(--font-body); font-size: 13px; font-weight: 800; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @container wcanvas (max-width: 470px) { .widget-decay-curve .dc-value { font-size: 18px; } }
`);

const clockText = (hours) => {
  const total = Math.round((((hours % 24) + 24) % 24) * 60) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

/** The response of one curve, dt after an event of size 1 (0 before the event). */
export function kernel(dt, halfLife, rise = 0) {
  if (dt < 0) return 0;
  if (!(rise > 0)) return Math.pow(0.5, dt / halfLife);
  const d = halfLife / Math.LN2;
  if (Math.abs(d - rise) < 1e-9) return (dt / d) * Math.exp(1 - dt / d);
  const tp = ((rise * d) / (d - rise)) * Math.log(d / rise);
  const norm = Math.exp(-tp / d) - Math.exp(-tp / rise);
  return (Math.exp(-dt / d) - Math.exp(-dt / rise)) / norm;
}

export default function create(spec, env) {
  const from = spec.from != null ? spec.from : 0;
  const to = spec.to != null ? spec.to : from + 24;
  const isClock = spec.clock !== false;
  const snap = spec.snap || 0.5;
  const minT = spec.minT != null ? spec.minT : from;
  const maxT = spec.maxT != null ? spec.maxT : to;
  const curves = (spec.curves && spec.curves.length ? spec.curves : [{ id: 'level', label: 'level', color: 'orange', halfLife: 5 }]).map((c) => ({ rise: 0, gain: 1, color: 'orange', ...c }));
  const watch = clamp(spec.watch || 0, 0, curves.length - 1);
  const unit = spec.unit || '';
  const name = spec.eventName || 'event';
  const edit = env.compact || spec.static ? 'none' : (spec.edit || 'move');
  const maxEvents = spec.maxEvents || 4;
  const amount = spec.amount != null ? spec.amount : 100;
  let events = (spec.events || []).map((e) => ({ t: e.t, amount: e.amount != null ? e.amount : amount }));
  const initial = events.map((e) => ({ ...e }));
  let readOnly = !!env.readOnly;

  const autoMax = () => Math.max(...curves.map((c) => c.gain)) * amount * Math.max(1, Math.min(maxEvents, 3)) * 0.75;
  const yMax = spec.yMax || autoMax();
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A level that rises with each event and wears off' });
  const { svg } = fr;
  const iw = W - PL - PR;
  const ih = H - PT - PB;
  const sx = (t) => PL + ((t - from) / (to - from)) * iw;
  const sy = (v) => PT + (1 - clamp(v / yMax, 0, 1.04)) * ih;
  const timeText = (t) => (isClock ? clockText(t) : `${formatNumber(t, 1)}${spec.xUnit ? ` ${spec.xUnit}` : ''}`);

  const level = (ci, t) => { const c = curves[ci]; let v = 0; for (const e of events) v += e.amount * c.gain * kernel(t - e.t, c.halfLife, c.rise); return v; };

  function facts() {
    const stepT = (to - from) / 1200;
    let peak = 0;
    let above = 0;
    let clearAt = null;
    const lineY = spec.line ? spec.line.y : null;
    for (let i = 0; i <= 1200; i++) {
      const t = from + i * stepT;
      const v = level(watch, t);
      if (v > peak) peak = v;
      if (lineY != null && v > lineY) { above += stepT; clearAt = t; }
    }
    return { peak, above, clearAt };
  }
  function getState() {
    const f = facts();
    return {
      events: events.slice().sort((a, b) => a.t - b.t).map((e) => ({ t: e.t, amount: e.amount })),
      count: events.length,
      halfLife: curves[watch].halfLife,
      atMarker: spec.marker ? tidy(level(watch, spec.marker.t), 1) : null,
      peak: tidy(f.peak, 1),
      above: tidy(Math.round(f.above * 10) / 10, 1),
      clearAt: f.clearAt == null ? null : tidy(Math.round(f.clearAt / snap) * snap, 2),
    };
  }

  /* -------------------------------------------------------------- drawing */
  const gBack = s('g');
  const gCurves = s('g');
  const gFront = s('g');
  const gHandles = s('g');
  svg.append(gBack, gCurves, gFront, gHandles);
  const roMarker = spec.marker ? readout(`at ${spec.marker.label || timeText(spec.marker.t)}`, { color: curves[watch].color }) : null;
  const roAbove = spec.line && spec.showAbove ? readout(`above ${spec.line.label || 'the line'}`, { color: curves[watch].color }) : null;
  let handles = [];
  let addBtn = null;
  let removeBtn = null;
  let hlRow = null;

  function drawStatic() {
    while (gBack.firstChild) gBack.removeChild(gBack.firstChild);
    const yTick = spec.yTick || yMax / 4;
    for (let v = 0; v <= yMax + 1e-9; v += yTick) {
      gBack.appendChild(s('line.grid-line', { x1: PL, x2: W - PR, y1: sy(v), y2: sy(v) }));
      gBack.appendChild(s('text.tick-label', { x: PL - 6, y: sy(v) + 4, 'text-anchor': 'end' }, formatNumber(v, 1)));
    }
    const xTick = spec.xTick || (to - from) / 8;
    for (let t = Math.ceil(from / xTick) * xTick; t <= to + 1e-9; t += xTick) {
      gBack.appendChild(s('line', { x1: sx(t), x2: sx(t), y1: H - PB, y2: H - PB + 5, stroke: 'var(--ink)', 'stroke-width': 2 }));
      gBack.appendChild(s('text.tick-label', { x: t >= to - 1e-9 ? W - 4 : sx(t), y: H - PB + 34, 'text-anchor': t >= to - 1e-9 ? 'end' : 'middle' }, isClock ? clockText(t) : (t >= to - 1e-9 && spec.xUnit ? `${formatNumber(t, 1)} ${spec.xUnit}` : formatNumber(t, 1))));
    }
    gBack.appendChild(s('line', { x1: PL, x2: W - PR, y1: H - PB, y2: H - PB, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    gBack.appendChild(s('line', { x1: PL, x2: PL, y1: PT, y2: H - PB, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    if (spec.yLabel) gBack.appendChild(s('text.axis-label', { x: PL + 8, y: PT - 10, 'text-anchor': 'start' }, `${spec.yLabel}${unit ? ` (${unit})` : ''}`));
    if (spec.line) {
      gBack.appendChild(s('line', { x1: PL, x2: W - PR, y1: sy(spec.line.y), y2: sy(spec.line.y), stroke: hue('green'), 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }));
      gBack.appendChild(s('text', { class: 'fig-label-sm text-green', x: W - PR - 4, y: sy(spec.line.y) - 6, 'text-anchor': 'end' }, spec.line.label || ''));
    }
    if (spec.marker) {
      const x = sx(spec.marker.t);
      gBack.appendChild(s('line', { x1: x, x2: x, y1: PT - 6, y2: H - PB, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round' }));
      gBack.appendChild(s('text.fig-label-sm', { x, y: PT - 10, 'text-anchor': x > W - 70 ? 'end' : 'middle' }, spec.marker.label || timeText(spec.marker.t)));
    }
  }

  function render() {
    while (gCurves.firstChild) gCurves.removeChild(gCurves.firstChild);
    while (gFront.firstChild) gFront.removeChild(gFront.firstChild);
    const n = 300;
    curves.forEach((c, ci) => {
      // sample points, plus a point just before and one at every event that arrives all at once (a sharp step)
      const ts = [];
      for (let i = 0; i <= n; i++) ts.push(from + ((to - from) * i) / n);
      if (!(c.rise > 0)) for (const e of events) if (e.t > from && e.t < to) ts.push(e.t - 1e-7, e.t);
      ts.sort((a, b) => a - b);
      const d = ts.map((t, i) => `${i ? 'L' : 'M'}${sx(t).toFixed(1)} ${sy(level(ci, t)).toFixed(1)}`).join('');
      if (curves.length === 1) gCurves.appendChild(s('path', { d: `${d}L${sx(to).toFixed(1)} ${sy(0)}L${sx(from).toFixed(1)} ${sy(0)}Z`, fill: hue(c.color, 'soft'), stroke: 'none', opacity: 0.8 }));
      gCurves.appendChild(s('path', { d, fill: 'none', stroke: hue(c.color), 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': ci === 1 ? '9 5' : null }));
    });
    // a legend when there is more than one curve
    if (curves.length > 1) {
      let lx = W - PR - 6;
      curves.slice().reverse().forEach((c, k) => {
        const ci = curves.length - 1 - k;
        const text = s('text', { class: `fig-label-sm text-${c.color}`, x: lx, y: PT + 12, 'text-anchor': 'end' }, c.label);
        gFront.appendChild(text);
        const width = c.label.length * 7 + 8;
        gFront.appendChild(s('line', { x1: lx - width - 26, x2: lx - width, y1: PT + 8, y2: PT + 8, stroke: hue(c.color), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-dasharray': ci === 1 ? '9 5' : null }));
        lx -= width + 44;
      });
    }
    const st = getState();
    if (spec.marker) {
      const x = sx(spec.marker.t);
      const v = level(watch, spec.marker.t);
      gFront.appendChild(s('circle', { cx: x, cy: sy(v), r: 6, fill: hue(curves[watch].color), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      gFront.appendChild(s('text', { class: `dc-value text-${curves[watch].color}`, x: x - 10, y: sy(v) - 10, 'text-anchor': 'end' }, `${formatNumber(st.atMarker, 1)}${unit ? ` ${unit}` : ''}`));
      roMarker.set(`${formatNumber(st.atMarker, 1)}${unit ? ` ${unit}` : ''}`);
    }
    if (roAbove) roAbove.set(`${formatNumber(st.above, 1)}${isClock ? ' h' : spec.xUnit ? ` ${spec.xUnit}` : ''}`);
    events.forEach((e, i) => {
      const hd = handles[i];
      if (hd) { hd.set(sx(e.t), H - PB); hd.setLabel(`${name} at ${timeText(e.t)}`); }
      else gFront.appendChild(s('path', { d: `M${sx(e.t)} ${H - PB}l-7 12h14z`, fill: hue(curves[0].color), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    });
    if (addBtn) addBtn.disabled = readOnly || events.length >= maxEvents;
    if (removeBtn) removeBtn.disabled = readOnly || events.length === 0;
    const list = st.events.map((e) => timeText(e.t)).join(', ');
    svg.setAttribute('aria-label', `${spec.alt || 'A level that rises with each event and wears off'}. ${st.count ? `${st.count} ${name}${st.count === 1 ? '' : 's'}: ${list}.` : `No ${name} yet.`}${spec.marker ? ` At ${spec.marker.label || timeText(spec.marker.t)}: ${formatNumber(st.atMarker, 1)}${unit ? ` ${unit}` : ''}.` : ''}`);
  }

  function buildHandles() {
    for (const hd of handles) { hd.destroy(); if (hd.el.parentNode) hd.el.parentNode.removeChild(hd.el); }
    handles = [];
    if (edit === 'none') return;
    events.forEach((e) => {
      const hd = handle(svg, {
        x: sx(e.t), y: H - PB, r: 10, color: curves[0].color, shape: 'square', keyStep: (snap / (to - from)) * iw, label: name,
        onMove(x) {
          if (readOnly) return;
          const next = clamp(Math.round((from + ((x - PL) / iw) * (to - from)) / snap) * snap, minT, maxT);
          if (next === e.t) return;
          e.t = tidy(next, 4);
          play('tick');
          render();
          env.onChange(getState());
        },
      });
      handles.push(hd);
      gHandles.appendChild(hd.el);
    });
  }

  if (edit !== 'none') {
    if (spec.halfLife) {
      const def = spec.halfLife;
      hlRow = sliderRow({
        label: def.label || 'half-life', min: def.min, max: def.max, step: def.step || 1, value: curves[0].halfLife, unit: def.unit || '', color: curves[0].color,
        onInput: (v) => { if (readOnly) return; curves[0].halfLife = v; play('tap'); render(); env.onChange(getState()); },
      });
      fr.controls.appendChild(hlRow.el);
    }
    if (edit === 'add') {
      addBtn = button(`Add ${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`, () => {
        if (readOnly || events.length >= maxEvents) return;
        const last = events.length ? Math.max(...events.map((e) => e.t)) : minT - (spec.addGap || 2);
        events.push({ t: clamp(Math.round((last + (spec.addGap || 2)) / snap) * snap, minT, maxT), amount });
        play('pop');
        buildHandles();
        render();
        env.onChange(getState());
      }, { icon: 'plus', variant: 'primary' });
      removeBtn = button('Remove one', () => {
        if (readOnly || !events.length) return;
        let k = 0;
        events.forEach((e, i) => { if (e.t >= events[k].t) k = i; });
        events.splice(k, 1);
        play('tap');
        buildHandles();
        render();
        env.onChange(getState());
      }, { variant: 'ghost' });
      fr.buttons.append(addBtn, removeBtn);
    }
  }
  if (!env.compact) { if (roMarker) fr.readouts.appendChild(roMarker.el); if (roAbove) fr.readouts.appendChild(roAbove.el); }
  drawStatic();
  buildHandles();
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.halfLife === 'number') { curves[0].halfLife = next.halfLife; if (hlRow) hlRow.set(next.halfLife); }
      if (Array.isArray(next.events)) {
        events = next.events.map((e) => ({ t: e.t, amount: e.amount != null ? e.amount : amount }));
        buildHandles();
      } else if (next.reset) { events = initial.map((e) => ({ ...e })); buildHandles(); }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const hd of handles) hd.setEnabled(!readOnly);
      if (hlRow) hlRow.setDisabled(readOnly);
      render();
    },
    destroy() { for (const hd of handles) hd.destroy(); },
  };
}

export const examples = [
  { title: 'decay-curve — an afternoon coffee', spec: { type: 'decay-curve', from: 6, to: 26, xTick: 2, yMax: 200, yTick: 50, unit: 'mg', yLabel: 'caffeine in the body', curves: [{ id: 'caffeine', label: 'caffeine', color: 'orange', halfLife: 5 }], events: [{ t: 15, amount: 100 }], eventName: 'coffee', edit: 'add', amount: 100, minT: 6, maxT: 23, halfLife: { min: 3, max: 8, step: 1, label: 'half-life', unit: 'h' }, marker: { t: 23, label: 'bedtime 23:00' }, line: { y: 25, label: '25 mg' } } },
  { title: 'decay-curve — stress hormones after an alarm', spec: { type: 'decay-curve', clock: false, from: 0, to: 240, xTick: 30, xUnit: 'min', yMax: 160, yTick: 50, yLabel: 'above resting level', curves: [{ id: 'adrenaline', label: 'adrenaline', color: 'red', halfLife: 4, rise: 0.5 }, { id: 'cortisol', label: 'cortisol', color: 'blue', halfLife: 25, rise: 12 }], events: [{ t: 20, amount: 100 }], eventName: 'alarm', edit: 'add', amount: 100, snap: 5, minT: 0, maxT: 200, addGap: 30, watch: 1, line: { y: 20, label: 'near resting' } } },
];
