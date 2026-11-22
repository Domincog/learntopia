/**
 * cpr-rhythm — a pace trainer for chest compressions. A lamp blinks at the
 * guideline pace (a visual metronome, so it works with the sound off); the
 * learner taps a large pad, or presses Space or Enter, once per compression.
 * A gauge shows their own pace against the 100 to 120 a minute band.
 *
 * It trains the pace only. Depth, hand position and letting the chest come
 * back up cannot be practised on a screen: that is what a manikin is for.
 *
 * {
 *   type: 'cpr-rhythm',
 *   bpm: 110,              // pace of the lamp, per minute
 *   target: [100, 120],    // the band drawn on the gauge
 *   count: 30,             // compressions in one round
 *   guide: 'on',           // 'on': the lamp blinks throughout · 'fade': it stops after `fadeAfter` taps · 'off': no lamp
 *   fadeAfter: 8,
 *   sound: false,          // start with the tick sound on (the learner can switch it; needs the app's sound setting)
 * }
 *
 * State: { taps, rate, inRange, done }
 *   taps     compressions counted in this round (a gap of more than 2.5 s starts the round again)
 *   rate     the learner's pace per minute, averaged from the third tap on (null until four taps), rounded
 *   inRange  rate lies inside `target`
 *   done     taps has reached `count`
 * setState({ taps: 30, rate: 110 }) shows a finished round at that pace.
 */
import { frame, loop, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 156;
const G0 = 60;         // the gauge shows 60 to 160 a minute
const G1 = 160;
const GX0 = 170;
const GX1 = 540;
const GY = 88;
const GAP_RESET = 2500;

addStyles('cpr-rhythm', `
  .widget-cpr-rhythm .cr-pad {
    min-height: 92px; display: grid; place-items: center; gap: 2px; padding: var(--s3); text-align: center;
    border: var(--bw) solid var(--edge-strong); border-radius: var(--r-lg); background: var(--blue-soft); color: var(--ink);
    font-weight: 800; font-size: var(--fs-lg); cursor: pointer; user-select: none; -webkit-user-select: none; touch-action: manipulation;
    box-shadow: 0 4px 0 var(--edge-strong);
  }
  .widget-cpr-rhythm .cr-pad small { font-weight: 600; font-size: var(--fs-sm); color: var(--ink-2); }
  .widget-cpr-rhythm .cr-pad.is-down { transform: translateY(3px); box-shadow: 0 1px 0 var(--edge-strong); background: var(--blue); color: #1D1B26; }
  .widget-cpr-rhythm .cr-pad.is-down small { color: #1D1B26; }
  .widget-cpr-rhythm .cr-pad:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  .widget-cpr-rhythm .cr-pad[aria-disabled="true"] { cursor: default; background: var(--sunken); box-shadow: none; transform: none; }
  .widget-cpr-rhythm .cr-status { margin: 0; text-align: center; font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); min-height: 2.6em; text-wrap: balance; }
  .widget-cpr-rhythm .cr-row { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s2); }
  .widget-cpr-rhythm .cr-opt {
    min-height: 40px; padding: 0.35rem 0.8rem; border: var(--bw) solid var(--hair); border-radius: 999px; background: var(--surface); color: var(--ink);
    font-weight: 700; font-size: var(--fs-sm); cursor: pointer; user-select: none; -webkit-user-select: none; display: inline-flex; align-items: center;
  }
  .widget-cpr-rhythm .cr-opt:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-cpr-rhythm .cr-opt[aria-checked="true"] { border-color: var(--blue); background: var(--blue-soft); }
  .widget-cpr-rhythm.is-readonly .cr-opt { display: none; }
`);

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/** Pace per minute from tap times in milliseconds, ignoring the first two taps (finding the beat). Exported for the course tests. */
export function paceOf(times) {
  if (!Array.isArray(times) || times.length < 4) return null;
  const from = 2;
  const span = times[times.length - 1] - times[from];
  return span > 0 ? (60000 * (times.length - 1 - from)) / span : null;
}

export default function create(spec, env) {
  const target = Array.isArray(spec.target) && spec.target.length === 2 ? spec.target.map(Number) : [100, 120];
  const bpm = clamp(Number(spec.bpm) || 110, 60, 160);
  const count = clamp(Math.round(spec.count || 30), 8, 120);
  const guide = ['on', 'fade', 'off'].includes(spec.guide) ? spec.guide : 'on';
  const fadeAfter = clamp(Math.round(spec.fadeAfter || 8), 2, count - 1);
  const period = 60000 / bpm;
  let readOnly = !!env.readOnly;
  let soundOn = !!spec.sound;
  let times = [];            // tap times of this round (ms)
  let shownRate = null;      // a rate set through setState()
  let shownTaps = null;
  let restarted = false;     // the last tap came after a long gap and started the count again
  let lastPointer = -1e9;
  let lastBeat = -1;
  let downTimer = 0;
  const t0 = nowMs();

  const fr = frame({ width: W, height: H, plain: true, label: spec.alt || 'A pace lamp and a gauge of compressions per minute' });
  const svg = fr.svg;
  // the lamp
  const halo = s('circle', { cx: 82, cy: 70, r: 52, fill: 'var(--red-soft)' });
  const lamp = s('circle', { cx: 82, cy: 70, r: 36, fill: 'var(--red)', stroke: 'var(--ink)', 'stroke-width': 2.5 });
  const lampText = s('text.fig-label', { x: 82, y: 76, 'text-anchor': 'middle', fill: '#1D1B26', stroke: 'none' }, 'push');
  lampText.style.stroke = 'none';
  const lampNote = s('text.fig-label-sm', { x: 82, y: 150, 'text-anchor': 'middle' }, `${bpm} a minute`);
  svg.append(halo, lamp, lampText, lampNote);
  // the gauge
  const gx = (v) => GX0 + ((clamp(v, G0, G1) - G0) / (G1 - G0)) * (GX1 - GX0);
  svg.appendChild(s('rect', { x: GX0, y: GY - 11, width: GX1 - GX0, height: 22, rx: 11, fill: 'var(--sunken)', stroke: 'var(--hair)', 'stroke-width': 1.5 }));
  svg.appendChild(s('rect', { x: gx(target[0]), y: GY - 11, width: gx(target[1]) - gx(target[0]), height: 22, fill: 'var(--green-soft)', stroke: 'var(--green)', 'stroke-width': 2 }));
  svg.appendChild(s('text.fig-label-sm', { x: (gx(target[0]) + gx(target[1])) / 2, y: GY - 38, 'text-anchor': 'middle', fill: 'var(--green-text)' }, `${target[0]} to ${target[1]}`));
  for (let v = G0; v <= G1; v += 20) {
    svg.appendChild(s('line', { x1: gx(v), x2: gx(v), y1: GY + 11, y2: GY + 18, stroke: 'var(--ink-3)', 'stroke-width': 1.5 }));
    svg.appendChild(s('text.tick-label', { x: gx(v), y: GY + 34, 'text-anchor': 'middle' }, String(v)));
  }
  svg.appendChild(s('text.tick-label', { x: GX1, y: GY + 54, 'text-anchor': 'end' }, 'compressions a minute'));
  svg.appendChild(s('text.tick-label', { x: GX0, y: GY - 38, 'text-anchor': 'start' }, 'slower'));
  svg.appendChild(s('text.tick-label', { x: GX1, y: GY - 38, 'text-anchor': 'end' }, 'faster'));
  const marker = s('g', { style: 'display:none' },
    s('path', { d: 'M0 -14 L8 -27 L-8 -27 Z', fill: 'var(--ink)' }),
    s('line', { x1: 0, x2: 0, y1: -13, y2: 13, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  svg.appendChild(marker);

  const pad = h('div.cr-pad', { role: 'button', tabindex: '0', 'aria-label': 'Compression pad: tap, or press Space or Enter, once for each compression' },
    h('span', 'Push here'), h('small', 'tap, or press Space or Enter'));
  pad.dataset.keys = 'own';
  const status = h('p.cr-status', { 'aria-live': 'off' });
  const again = h('div.cr-opt', { role: 'button', tabindex: '0' }, 'Start again');
  again.dataset.keys = 'own';
  const sound = h('div.cr-opt', { role: 'switch', tabindex: '0', 'aria-checked': String(soundOn) }, 'Tick sound');
  sound.dataset.keys = 'own';
  fr.el.append(pad, status, h('div.cr-row', again, guide === 'off' ? null : sound));

  const taps = () => (shownTaps != null ? shownTaps : times.length);
  const rateNow = () => {
    if (shownRate != null) return shownRate;
    const v = paceOf(times);
    return v == null ? null : Math.round(v);
  };
  const liveRate = () => {                       // the last eight intervals: what the gauge follows while tapping
    if (shownRate != null) return shownRate;
    if (times.length < 4) return null;
    const recent = times.slice(-9);
    return (60000 * (recent.length - 1)) / (recent[recent.length - 1] - recent[0]);
  };
  const getState = () => {
    const rate = rateNow();
    return { taps: taps(), rate, inRange: rate != null && rate >= target[0] && rate <= target[1], done: taps() >= count };
  };
  const lampVisible = () => guide === 'on' || (guide === 'fade' && taps() < fadeAfter);

  function verdict(rate) {
    if (rate < target[0]) return `about ${rate} a minute: a little slow. Push slightly faster.`;
    if (rate > target[1]) return `about ${rate} a minute: a little fast. Ease off slightly, so that each push can be deep enough.`;
    return `about ${rate} a minute: inside the ${target[0]} to ${target[1]} band.`;
  }

  function render() {
    const st = getState();
    const live = liveRate();
    if (live != null) { marker.style.display = ''; marker.setAttribute('transform', `translate(${gx(live).toFixed(1)} ${GY})`); } else marker.style.display = 'none';
    pad.setAttribute('aria-disabled', String(readOnly || st.done));
    pad.setAttribute('tabindex', readOnly || st.done ? '-1' : '0');
    pad.firstChild.textContent = st.done ? `${count} compressions done` : st.taps ? `${st.taps} of ${count}` : 'Push here';
    if (st.done) status.textContent = `${count} compressions at ${verdict(st.rate)}`;
    else if (restarted && st.taps <= 1) status.textContent = 'A long pause: the count has started again. In real CPR, keep pauses as short as you can.';
    else if (!st.taps) status.textContent = lampVisible() ? 'Tap once each time the lamp blinks.' : `No lamp this time: tap at the pace you remember, ${count} times.`;
    else if (st.rate == null) status.textContent = 'Keep going…';
    else status.textContent = `Your pace: ${verdict(st.rate)}`;
    const show = lampVisible() && !st.done && !readOnly;
    for (const el of [halo, lamp, lampText]) el.style.visibility = lampVisible() ? '' : 'hidden';
    lampNote.textContent = lampVisible() ? `lamp: ${bpm} a minute` : 'lamp off';
    if (!show) { lamp.style.opacity = lampVisible() ? '0.3' : ''; halo.style.opacity = '0'; }
    sound.setAttribute('aria-checked', String(soundOn));
    sound.textContent = soundOn ? 'Tick sound: on' : 'Tick sound: off';
    svg.setAttribute('aria-label', `${spec.alt || 'Pace trainer.'} ${st.taps} of ${count} compressions${st.rate != null ? `, ${verdict(st.rate)}` : '.'}`);
  }

  const anim = loop(() => {
    const st = getState();
    if (st.done || readOnly || !lampVisible()) { anim.stop(); render(); return; }
    const phase = ((nowMs() - t0) % period) / period;
    const beat = Math.floor((nowMs() - t0) / period);
    if (beat !== lastBeat) { lastBeat = beat; if (soundOn) play('tick'); }
    const on = phase < 0.22;
    lamp.style.opacity = on ? '1' : '0.3';
    halo.style.opacity = on ? '0.9' : '0';
    if (!reducedMotion()) lamp.setAttribute('r', (36 - 5 * Math.max(0, 1 - phase / 0.22)).toFixed(1));
  });
  const ensureLoop = () => { if (!anim.running && !readOnly && !getState().done && lampVisible()) anim.start(); };

  function tap() {
    if (readOnly || getState().done) return;
    const now = nowMs();
    shownRate = null; shownTaps = null;
    restarted = times.length > 0 && now - times[times.length - 1] > GAP_RESET;
    if (restarted) times = [];
    times.push(now);
    play('tap');
    pad.classList.add('is-down');
    clearTimeout(downTimer);
    downTimer = setTimeout(() => pad.classList.remove('is-down'), 110);
    const st = getState();
    render();
    if (st.done) env.announce(status.textContent);
    env.onChange(st);
  }
  function reset() {
    if (readOnly) return;
    times = []; shownRate = null; shownTaps = null; restarted = false;
    render();
    ensureLoop();
    env.onChange(getState());
  }

  pad.addEventListener('pointerdown', (ev) => { if (ev.button > 0) return; lastPointer = nowMs(); tap(); });
  pad.addEventListener('click', () => { if (nowMs() - lastPointer > 700) tap(); });   // activation without a pointer (assistive technology)
  pad.addEventListener('keydown', (ev) => {
    if (ev.key !== ' ' && ev.key !== 'Enter') return;
    ev.preventDefault();
    ev.stopPropagation();
    if (!ev.repeat) { lastPointer = nowMs(); tap(); }
  });
  const onKey = (fn) => (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); ev.stopPropagation(); fn(); } };
  again.addEventListener('click', reset);
  again.addEventListener('keydown', onKey(reset));
  const flipSound = () => { soundOn = !soundOn; render(); };
  sound.addEventListener('click', flipSound);
  sound.addEventListener('keydown', onKey(flipSound));

  render();
  ensureLoop();
  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      times = [];
      restarted = false;
      shownTaps = next.taps != null ? clamp(Math.round(next.taps), 0, count) : count;
      shownRate = next.rate != null ? Math.round(Number(next.rate)) : null;
      if (shownTaps === 0) { shownTaps = null; shownRate = null; }
      render();
      ensureLoop();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); render(); ensureLoop(); },
    destroy() { anim.stop(); clearTimeout(downTimer); },
  };
}

export const examples = [
  { title: 'cpr-rhythm — follow the lamp', spec: { type: 'cpr-rhythm', bpm: 110, count: 30 } },
  { title: 'cpr-rhythm — the lamp fades out', spec: { type: 'cpr-rhythm', bpm: 110, count: 30, guide: 'fade' } },
];
