/**
 * reaction-timer — a simple reaction-time experiment. The pad says "Wait…",
 * then, after a random pause, changes colour, shape and wording ("Tap now!").
 * The time from the change to the learner's tap is one measurement. After a
 * few goes the widget shows each time, the average, and where the average sits
 * beside the range that is typical for a simple reaction to something seen.
 *
 * A learner who cannot or does not want to do the experiment can press
 * "Show sample results", which fills in a set of typical measurements (marked
 * as a sample), so a step never depends on doing it.
 *
 * {
 *   type: 'reaction-timer',
 *   rounds: 5,                 // measurements to take (3 to 8)
 *   typical: [200, 300],       // the band drawn on the results chart, in milliseconds
 *   sample: [262, 241, 255, 233, 248],   // what "Show sample results" fills in
 * }
 *
 * State: { done, times, mean, best, falseStarts, sample }
 *   times        every measurement so far, in milliseconds
 *   mean, best   average and quickest of them (null before the first)
 *   falseStarts  taps that came before the signal (not counted as measurements)
 *   sample       true when the results are the built-in sample, not the learner's own
 * Use `check: (s) => s.done`. setState({ done: true }) shows the sample results;
 * setState({ times: [...] }) shows those.
 *
 * The clock is the measurement here, never a deadline. Timing in a browser is
 * only good to a few hundredths of a second (screen refresh, touch delay), which
 * the results text says.
 */
import { h, cx, addStyles, icon, clamp } from './kit.js';
import { play } from '../core/audio.js';

addStyles('reaction-timer', `
  .widget-reaction-timer { gap: var(--s3); padding: var(--s4); border: var(--bw) solid var(--edge); border-radius: var(--r-lg); background: var(--surface); text-align: center; }
  .widget-reaction-timer .rt-count { font-size: var(--fs-xs); font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); }
  .widget-reaction-timer .rt-stage { display: grid; gap: var(--s3); justify-items: center; }
  .widget-reaction-timer .rt-pad { width: min(260px, 100%); min-height: 150px; display: grid; place-items: center; gap: 4px; padding: var(--s4); border: var(--bw) solid var(--edge-strong); border-radius: var(--r-xl); background: var(--sunken); color: var(--ink); font: inherit; font-size: var(--fs-xl); font-weight: 800; box-shadow: 0 4px 0 var(--edge-strong); touch-action: manipulation; user-select: none; -webkit-user-select: none; }
  .widget-reaction-timer .rt-pad small { display: block; font-size: var(--fs-sm); font-weight: 600; color: var(--ink-2); }
  .widget-reaction-timer .rt-pad.is-wait { background: var(--red-soft); border-style: dashed; }
  .widget-reaction-timer .rt-pad.is-go { background: var(--green); color: var(--on-color); border-radius: 999px; }
  .widget-reaction-timer .rt-pad.is-go small { color: var(--on-color); }
  .widget-reaction-timer .rt-pad:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
  .widget-reaction-timer .rt-times { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; min-height: 28px; }
  .widget-reaction-timer .rt-time { padding: 2px 10px; border: var(--bw) solid var(--hair); border-radius: 999px; background: var(--paper); font-family: var(--font-mono); font-size: var(--fs-sm); font-weight: 700; }
  .widget-reaction-timer .rt-skip { background: none; border: 0; padding: 4px 8px; font: inherit; font-size: var(--fs-sm); font-weight: 700; color: var(--blue-text); text-decoration: underline; cursor: pointer; }
  .widget-reaction-timer .rt-scale { position: relative; width: min(420px, 100%); height: 46px; margin-top: var(--s2); }
  .widget-reaction-timer .rt-track { position: absolute; left: 0; right: 0; top: 16px; height: 14px; border: var(--bw) solid var(--edge); border-radius: 999px; background: var(--sunken); }
  .widget-reaction-timer .rt-band { position: absolute; top: 16px; height: 14px; background: var(--blue-soft); border-left: 2px solid var(--blue); border-right: 2px solid var(--blue); }
  .widget-reaction-timer .rt-mark { position: absolute; top: 8px; width: 4px; height: 30px; margin-left: -2px; border-radius: 2px; background: var(--ink); }
  .widget-reaction-timer .rt-tick { position: absolute; top: 32px; transform: translateX(-50%); font-size: var(--fs-xs); font-weight: 700; color: var(--ink-3); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .widget-reaction-timer .rt-tick.is-last { transform: translateX(-100%); }
  .widget-reaction-timer .rt-verdict { margin: 0; font-size: var(--fs-lg); text-wrap: balance; }
  .widget-reaction-timer .rt-note { margin: 0; font-size: var(--fs-sm); color: var(--ink-2); text-wrap: balance; }
`);

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const SCALE = [100, 500];     // the results scale, in ms

export default function create(spec, env) {
  const rounds = clamp(Math.round(spec.rounds || 5), 3, 8);
  const typical = Array.isArray(spec.typical) ? spec.typical : [200, 300];
  const sampleTimes = (Array.isArray(spec.sample) ? spec.sample : [262, 241, 255, 233, 248]).slice(0, rounds);

  let readOnly = !!env.readOnly;
  let times = [];
  let falseStarts = 0;
  let sample = false;
  let phase = 'idle';          // idle | wait | go | done
  let timer = 0;
  let shownAt = 0;

  const count = h('div.rt-count');
  const stage = h('div.rt-stage');
  const el = h('div.w-frame', count, stage);

  const mean = () => (times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null);
  const getState = () => ({ done: phase === 'done', times: times.slice(), mean: mean(), best: times.length ? Math.min(...times) : null, falseStarts, sample });

  const chips = () => h('div.rt-times', { role: 'group', 'aria-label': 'Times so far' }, times.map((t) => h('span.rt-time', `${t} ms`)));

  function skipLink() {
    const skip = h('button.rt-skip', { type: 'button' }, 'Show sample results instead');
    skip.addEventListener('click', () => { if (readOnly) return; showSample(); env.onChange(getState()); });
    return skip;
  }

  function drawPad(message = '') {
    clearTimeout(timer);
    count.textContent = `Go ${Math.min(times.length + 1, rounds)} of ${rounds}`;
    const pad = h('button', { type: 'button', class: cx('rt-pad', phase === 'wait' && 'is-wait', phase === 'go' && 'is-go') });
    pad.dataset.keys = 'own';
    if (phase === 'idle') pad.append(times.length ? 'Next go' : 'Start', h('small', 'Press here (or Space) to begin'));
    else if (phase === 'wait') pad.append('Wait…', h('small', 'Tap the moment this changes'));
    else pad.append('Tap now!', h('small', 'as fast as you can'));
    pad.addEventListener('pointerdown', (ev) => { if (ev.button > 0) return; ev.preventDefault(); press(); });
    pad.addEventListener('keydown', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); ev.stopPropagation(); if (!ev.repeat) press(); } });
    pad.addEventListener('click', (ev) => ev.preventDefault());
    const note = h('p.rt-note', { 'aria-live': 'polite' }, message);
    stage.replaceChildren(pad, note, chips(), skipLink());
    if (phase !== 'idle' || times.length || falseStarts) pad.focus({ preventScroll: true });
  }

  function press() {
    if (readOnly) return;
    if (phase === 'idle') {
      phase = 'wait';
      drawPad();
      const pause = 1500 + env.rng.float(0, 2500);
      timer = setTimeout(() => { phase = 'go'; drawPad(); shownAt = now(); env.announce('Tap now'); }, pause);
    } else if (phase === 'wait') {
      falseStarts++;
      phase = 'idle';
      play('wrong');
      drawPad('Too soon: that was before the signal. Have another go.');
      env.onChange(getState());
    } else if (phase === 'go') {
      const t = Math.max(1, Math.round(now() - shownAt));
      times.push(t);
      sample = false;
      play('tap');
      if (times.length >= rounds) { phase = 'done'; drawResults(); } else { phase = 'idle'; drawPad(`${t} ms.`); }
      env.onChange(getState());
    }
  }

  function showSample() {
    clearTimeout(timer);
    times = sampleTimes.slice();
    sample = true;
    phase = 'done';
    drawResults();
  }

  function drawResults() {
    clearTimeout(timer);
    count.textContent = sample ? 'Sample results' : 'Your results';
    const m = mean();
    const pos = (ms) => `${clamp(((ms - SCALE[0]) / (SCALE[1] - SCALE[0])) * 100, 0, 100)}%`;
    const scale = h('div.rt-scale', { role: 'img', 'aria-label': `A scale from ${SCALE[0]} to ${SCALE[1]} milliseconds. The typical range, ${typical[0]} to ${typical[1]}, is shaded. The average here is ${m}.` },
      h('div.rt-track'),
      h('div.rt-band', { style: { left: pos(typical[0]), width: `${((typical[1] - typical[0]) / (SCALE[1] - SCALE[0])) * 100}%` } }),
      h('div.rt-mark', { style: { left: pos(m) } }),
      ...[100, 200, 300, 400, 500].map((v) => h('span', { class: cx('rt-tick', v === 500 && 'is-last'), style: { left: pos(v) } }, v === 500 ? '500 ms' : String(v))));
    const again = h('button.btn.btn-sm.btn-ghost', { type: 'button' }, icon('reset', 16), sample ? 'Try it myself' : 'Start again');
    again.addEventListener('click', () => { if (readOnly) return; times = []; falseStarts = 0; sample = false; phase = 'idle'; drawPad(); env.onChange(getState()); });
    stage.replaceChildren(...[
      chips(),
      h('p.rt-verdict', sample ? 'Sample average: ' : 'Your average: ', h('strong', `${m} ms`), ` (about ${(m / 1000).toFixed(2)} of a second)`),
      scale,
      h('p.rt-note', `The shaded band, ${typical[0]} to ${typical[1]} ms, is typical for reacting to something you see. A screen and a finger add a few hundredths of a second of their own, and times vary with age, tiredness and practice: this is a demonstration, not a test of you.`),
      again,
    ]);
  }

  drawPad();

  return {
    el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.times) && next.times.length) {
        times = next.times.map((t) => Math.round(t));
        sample = !!next.sample;
        falseStarts = next.falseStarts || 0;
        if (times.length >= rounds || next.done) { phase = 'done'; drawResults(); } else { phase = 'idle'; drawPad(); }
      } else if (next.done) showSample();
    },
    setReadOnly(v) { readOnly = !!v; el.classList.toggle('is-readonly', readOnly); if (readOnly) clearTimeout(timer); },
    destroy() { clearTimeout(timer); },
  };
}

export const examples = [
  { title: 'reaction-timer — five goes', spec: { type: 'reaction-timer' } },
  { title: 'reaction-timer — three goes', spec: { type: 'reaction-timer', rounds: 3 } },
];
