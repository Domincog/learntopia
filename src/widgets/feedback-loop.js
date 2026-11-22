/**
 * feedback-loop — negative feedback as something to tune. A person steps into the cold (or starts to
 * work hard in the heat) and their core temperature begins to drift. The learner sets how strongly the
 * body responds and how long the response takes to act, presses Run, and watches an hour of core
 * temperature being drawn: drifting away with no response, held near the set point with a good one,
 * swinging back and forth when a strong response arrives late.
 *
 * {
 *   type: 'feedback-loop',
 *   scenario: 'cold',     // 'cold' (the body loses heat; the response is shivering and narrowed skin vessels)
 *                         // | 'heat' (the body gains heat; the response is sweating and widened skin vessels)
 *   gain: 0,              // strength of the response: 0 none · 1 weak · 2 medium · 3 strong
 *   delay: 0,             // minutes before the response acts: 0, 2, 5 or 10
 *   controls: ['gain', 'delay'],   // which sliders to show
 *   static: false,
 * }
 *
 * State: { scenario, gain, gainName, delay, ran, lowest, highest, final, inRange, settled, swings, runs, tried }
 *   ran       the current settings have been run (everything below describes that run; before it they are null/false)
 *   lowest, highest, final   core temperature over the hour, in °C (two decimals)
 *   inRange   it never left the band 36.5 to 37.5 °C
 *   settled   during the last quarter of an hour it moved by no more than 0.1 °C
 *   swings    how many times it turned round after moving more than 0.1 °C
 *   runs      how many runs so far;  tried — the settings of each run so far: [{ gain, delay }]
 *
 * setState accepts { gain, delay } (shows the finished run) and optionally { tried: [{ gain, delay }] }.
 *
 * The model. Core temperature T starts at the set point of 37 °C. The surroundings push it away at a
 * steady 0.04 °C a minute (an exaggeration, so that an hour is enough to see what happens). The response
 * pushes back in proportion to how far the temperature was from the set point `delay` minutes ago:
 *     dT/dt = drift + k · (37 − T(t − delay)),   k = 0, 0.04, 0.12 or 0.32 per minute, response limited to ±0.3 °C a minute
 * A proportional response always leaves a small offset (drift ÷ k), and a strong response that arrives
 * late overshoots: both are real features of feedback systems. Left out: real bodies respond with several
 * effectors at once (blood flow, sweat or shivering, behaviour), sense temperature in the skin as well as
 * in the core, and are far slower to cool or warm than this model.
 */
import { frame, sliderRow, button, loop, hue, s, h, clamp, tidy, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

export const GAINS = [
  { name: 'none', k: 0 },
  { name: 'weak', k: 0.04 },
  { name: 'medium', k: 0.12 },
  { name: 'strong', k: 0.32 },
];
export const DELAYS = [0, 2, 5, 10];
export const SET_POINT = 37;
export const BAND = [36.5, 37.5];
const DRIFT = 0.04;       // °C per minute
const LIMIT = 0.3;        // the strongest response, °C per minute
const MINUTES = 60;
const DT = 0.05;

/** One hour of core temperature: { xs: samples every DT minutes, lowest, highest, final, inRange, settled, swings }. */
export function simulate({ scenario = 'cold', gain = 0, delay = 0 } = {}) {
  const k = GAINS[clamp(Math.round(gain), 0, GAINS.length - 1)].k;
  const drift = scenario === 'heat' ? DRIFT : -DRIFT;
  const n = Math.round(MINUTES / DT);
  const xs = [SET_POINT];
  for (let i = 0; i < n; i++) {
    const j = Math.round((i * DT - delay) / DT);
    const felt = j < 0 ? SET_POINT : xs[j];
    const response = clamp(k * (SET_POINT - felt), -LIMIT, LIMIT);
    xs.push(xs[i] + (drift + response) * DT);
  }
  const lowest = Math.min(...xs);
  const highest = Math.max(...xs);
  const tail = xs.slice(n - Math.round(15 / DT));
  let swings = 0;
  let lastTurn = xs[0];
  let dir = 0;
  for (let i = 1; i < xs.length; i++) {
    const d = Math.sign(xs[i] - xs[i - 1]);
    if (d && dir && d !== dir) {
      if (Math.abs(xs[i - 1] - lastTurn) > 0.1) swings++;
      lastTurn = xs[i - 1];
    }
    if (d) dir = d;
  }
  return {
    xs,
    lowest: tidy(lowest, 2), highest: tidy(highest, 2), final: tidy(xs[n], 2),
    inRange: lowest >= BAND[0] - 1e-9 && highest <= BAND[1] + 1e-9,
    settled: Math.max(...tail) - Math.min(...tail) <= 0.1,
    swings,
  };
}

const W = 560;
const H = 270;
const PX0 = 58;
const PX1 = 540;
const PY0 = 18;
const PY1 = 226;

addStyles('feedback-loop', `
  .widget-feedback-loop .fl-band-label { font-size: 12px; font-weight: 700; fill: var(--green-text); }
  .widget-feedback-loop .fl-end { font-family: var(--font-mono); font-size: 13px; font-weight: 700; }
  @container wcanvas (max-width: 470px) {
    .widget-feedback-loop .fl-band-label { font-size: 15px; }
    .widget-feedback-loop .fl-end { font-size: 16px; }
  }
`);

export default function create(spec, env) {
  const scenario = spec.scenario === 'heat' ? 'heat' : 'cold';
  const isStatic = !!spec.static || !!env.compact;
  const show = new Set(Array.isArray(spec.controls) ? spec.controls : ['gain', 'delay']);
  let gain = clamp(Math.round(spec.gain || 0), 0, GAINS.length - 1);
  let delay = DELAYS.includes(spec.delay) ? spec.delay : 0;
  let ran = !!spec.static && spec.show !== 'start';
  let tried = [];
  let shownUpTo = MINUTES;      // minutes of the current run that have been drawn
  let readOnly = !!env.readOnly;
  const response = scenario === 'cold' ? 'shivering' : 'sweating';

  const [y0, y1] = scenario === 'cold' ? [34.4, 37.8] : [36.2, 39.6];
  const sx = (t) => PX0 + (t / MINUTES) * (PX1 - PX0);
  const sy = (v) => PY1 - ((clamp(v, y0, y1) - y0) / (y1 - y0)) * (PY1 - PY0);

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A graph of core body temperature over one hour' });
  const { svg } = fr;
  // the plot, drawn once
  svg.appendChild(s('rect', { x: PX0, y: sy(BAND[1]), width: PX1 - PX0, height: sy(BAND[0]) - sy(BAND[1]), fill: hue('green', 'soft') }));
  for (let v = Math.ceil(y0); v <= y1; v++) {
    svg.appendChild(s('line.grid-line', { x1: PX0, x2: PX1, y1: sy(v), y2: sy(v) }));
    svg.appendChild(s('text.tick-label', { x: PX0 - 8, y: sy(v) + 4, 'text-anchor': 'end' }, `${v} °C`));
  }
  for (let t = 0; t <= MINUTES; t += 10) {
    svg.appendChild(s('line.grid-line', { x1: sx(t), x2: sx(t), y1: PY0, y2: PY1 }));
    svg.appendChild(s('text.tick-label', { x: sx(t), y: PY1 + 18, 'text-anchor': 'middle' }, t === MINUTES ? '60 min' : String(t)));
  }
  svg.appendChild(s('line', { x1: PX0, x2: PX1, y1: sy(SET_POINT), y2: sy(SET_POINT), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '6 6' }));
  svg.appendChild(s('text.fl-band-label', { x: PX1 - 6, y: sy(BAND[1]) + 14, 'text-anchor': 'end' }, 'healthy range'));
  svg.appendChild(s('text.fig-label-sm', { x: PX0 + 6, y: sy(SET_POINT) - 6 }, 'set point 37 °C'));
  svg.appendChild(s('path', { d: `M${PX0} ${PY0}V${PY1}H${PX1}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  svg.appendChild(s('text.axis-label', { x: PX1, y: H - 6, 'text-anchor': 'end' }, scenario === 'cold' ? 'minutes after stepping out into the cold' : 'minutes after starting hard work in the heat'));
  const gOld = s('g');
  const curve = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const endDot = s('circle', { r: 5.5, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5, visibility: 'hidden' });
  const endLabel = s('text.fig-label.fl-end', { 'text-anchor': 'end' }, '');
  svg.append(gOld, curve, endDot, endLabel);

  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const pathOf = (xs, upTo) => {
    let d = '';
    const last = Math.round(upTo / DT);
    for (let i = 0; i <= last; i += 4) d += `${i ? 'L' : 'M'}${sx(i * DT).toFixed(1)} ${sy(xs[i]).toFixed(1)}`;
    return d;
  };

  function describe(r) {
    const off = Math.abs(r.final - SET_POINT);
    if (!GAINS[gain].k) return `With no response, the temperature simply drifts: ${r.final} °C after an hour.`;
    if (!r.settled) return `The temperature keeps swinging, between ${r.lowest} and ${r.highest} °C. The ${response} arrives too late for its strength and overshoots.`;
    if (!r.inRange) {
      const out = r.final < BAND[0] || r.final > BAND[1];
      return out
        ? `The temperature levels off at ${r.final} °C, outside the healthy range: the response is too weak to hold it.`
        : `The temperature ends at ${r.final} °C, but on the way it left the healthy range (it went ${scenario === 'cold' ? `as low as ${r.lowest}` : `as high as ${r.highest}`} °C): the response came too late.`;
    }
    return `The temperature levels off at ${r.final} °C, ${off.toFixed(2)} °C from the set point${r.swings ? ', after overshooting once or twice' : ''}.`;
  }

  function getState() {
    const r = ran ? simulate({ scenario, gain, delay }) : null;
    return {
      scenario, gain, gainName: GAINS[gain].name, delay, ran,
      lowest: r ? r.lowest : null, highest: r ? r.highest : null, final: r ? r.final : null,
      inRange: r ? r.inRange : false, settled: r ? r.settled : false, swings: r ? r.swings : 0,
      runs: tried.length, tried: tried.map((t) => ({ ...t })),
    };
  }

  let runBtn = null;
  function render() {
    gOld.replaceChildren();
    // earlier runs stay on the graph, faintly, so that settings can be compared
    for (const t of tried.slice(-4)) {
      if (ran && t.gain === gain && t.delay === delay) continue;
      gOld.appendChild(s('path', { d: pathOf(simulate({ scenario, gain: t.gain, delay: t.delay }).xs, MINUTES), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-dasharray': '2 5', 'stroke-linecap': 'round' }));
    }
    if (ran) {
      const r = simulate({ scenario, gain, delay });
      curve.setAttribute('d', pathOf(r.xs, shownUpTo));
      const done = shownUpTo >= MINUTES - 1e-9;
      const i = Math.round(shownUpTo / DT);
      endDot.setAttribute('cx', sx(shownUpTo));
      endDot.setAttribute('cy', sy(r.xs[i]));
      endDot.setAttribute('visibility', 'visible');
      endLabel.textContent = done ? `${r.final} °C` : '';
      endLabel.setAttribute('x', PX1 - 10);
      endLabel.setAttribute('y', clamp(sy(r.final) + (sy(r.final) < (PY0 + PY1) / 2 ? 22 : -12), PY0 + 14, PY1 - 8));
      note.textContent = done ? describe(r) : '';
    } else {
      curve.setAttribute('d', '');
      endDot.setAttribute('visibility', 'hidden');
      endLabel.textContent = '';
      note.textContent = isStatic ? '' : 'Press Run to see the next hour.';
    }
    if (runBtn) { runBtn.disabled = readOnly || anim.running; runBtn.lastChild.textContent = ran ? 'Run again' : 'Run'; }
    const st = getState();
    svg.setAttribute('aria-label', `${spec.alt || 'A graph of core body temperature over one hour'}. Response: ${GAINS[gain].name}; delay ${delay} minutes. ${ran && shownUpTo >= MINUTES ? describe(simulate({ scenario, gain, delay })) : 'Not run yet.'}${st.runs ? ` Runs so far: ${st.runs}.` : ''}`);
  }

  const anim = loop((dt) => {
    shownUpTo = Math.min(MINUTES, shownUpTo + dt * 24);     // an hour in two and a half seconds
    if (shownUpTo >= MINUTES) { anim.stop(); finish(true); return; }
    render();
  });

  function finish(notify) {
    shownUpTo = MINUTES;
    ran = true;
    render();
    if (notify) { play('tick'); env.announce(note.textContent); env.onChange(getState()); }
  }

  function run() {
    if (readOnly || anim.running) return;
    ran = true;
    if (!tried.some((t) => t.gain === gain && t.delay === delay)) tried.push({ gain, delay });
    if (reducedMotion()) { finish(true); return; }
    shownUpTo = 0;
    render();
    anim.start();
    render();
  }

  const rows = {};
  const changed = () => { anim.stop(); ran = false; shownUpTo = MINUTES; render(); env.onChange(getState()); };
  if (!isStatic) {
    if (show.has('gain')) {
      rows.gain = sliderRow({ label: `strength of the response (${response})`, min: 0, max: GAINS.length - 1, step: 1, value: gain, color: 'red', format: (v) => GAINS[v].name, onInput: (v) => { if (readOnly) return; gain = v; rows.gain.input.setAttribute('aria-valuetext', GAINS[v].name); changed(); } });
      rows.gain.input.setAttribute('aria-valuetext', GAINS[gain].name);
      fr.controls.appendChild(rows.gain.el);
    }
    if (show.has('delay')) {
      rows.delay = sliderRow({ label: 'delay before it acts', min: 0, max: DELAYS.length - 1, step: 1, value: DELAYS.indexOf(delay), color: 'violet', format: (v) => (DELAYS[v] ? `${DELAYS[v]} min` : 'none'), onInput: (v) => { if (readOnly) return; delay = DELAYS[v]; rows.delay.input.setAttribute('aria-valuetext', DELAYS[v] ? `${DELAYS[v]} minutes` : 'none'); changed(); } });
      rows.delay.input.setAttribute('aria-valuetext', delay ? `${delay} minutes` : 'none');
      fr.controls.appendChild(rows.delay.el);
    }
    runBtn = button('Run', run, { icon: 'play', variant: 'primary' });
    fr.buttons.appendChild(runBtn);
  }
  if (!env.compact) fr.el.insertBefore(note, fr.readouts);
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      if (typeof next.gain === 'number') { gain = clamp(Math.round(next.gain), 0, GAINS.length - 1); if (rows.gain) { rows.gain.set(gain); rows.gain.input.setAttribute('aria-valuetext', GAINS[gain].name); } }
      if (DELAYS.includes(next.delay)) { delay = next.delay; if (rows.delay) { rows.delay.set(DELAYS.indexOf(delay)); rows.delay.input.setAttribute('aria-valuetext', delay ? `${delay} minutes` : 'none'); } }
      if (Array.isArray(next.tried)) tried = next.tried.filter((t) => t && GAINS[t.gain] && DELAYS.includes(t.delay)).map((t) => ({ gain: t.gain, delay: t.delay }));
      if (next.ran === false) { ran = false; render(); return; }
      if (!tried.some((t) => t.gain === gain && t.delay === delay)) tried.push({ gain, delay });
      finish(false);
    },
    setReadOnly(v) {
      readOnly = !!v;
      if (readOnly && anim.running) { anim.stop(); finish(false); }
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const k of Object.keys(rows)) rows[k].setDisabled(readOnly);
      render();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'feedback-loop — hold the temperature steady in the cold', spec: { type: 'feedback-loop', scenario: 'cold', gain: 1, delay: 5 } },
  { title: 'feedback-loop — a strong response that arrives late', spec: { type: 'feedback-loop', scenario: 'heat', gain: 3, delay: 5, static: true } },
];
