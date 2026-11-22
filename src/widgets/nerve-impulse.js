/**
 * nerve-impulse — one nerve cell, a stimulus of adjustable strength, and a
 * recorder on its long fibre (axon). Below the threshold nothing travels.
 * At or above it, impulses set off down the axon, and every impulse is the
 * same size: a stronger stimulus sends MORE impulses per second, never bigger
 * ones ("all or nothing"). A fatty myelin sheath can be switched on, which
 * makes each impulse travel far faster without changing its size.
 *
 * {
 *   type: 'nerve-impulse',
 *   strength: 2,              // stimulus strength at the start, 0 to 10
 *   threshold: 4,             // strengths below this set off no impulse
 *   myelin: false,            // is the axon wrapped in myelin at the start?
 *   myelinToggle: true,       // show the switch for the myelin sheath
 *   speeds: { bare: 1, myelin: 100 },   // metres per second without and with myelin
 *   static: false,            // true: a picture without controls
 * }
 *
 * State: { strength, myelin, fired, rate, size, travel, runs, tried, sawBelow, sawAbove, sawBoth }
 *   fired     the current setting, once stimulated, sets off impulses
 *   rate      impulses per second at the current strength (0 below the threshold)
 *   size      size of each impulse in millivolts: 100 when it fires, 0 when it does not
 *   travel    milliseconds an impulse needs for one metre of this axon
 *   runs      how often "Stimulate" has been pressed
 *   tried     every distinct setting that was stimulated: { strength, myelin, fired, rate }
 *   sawBelow  a stimulus below the threshold has been tried
 *   sawAbove  how many different strengths at or above the threshold have been tried
 *   sawBoth   an impulse has been sent both with and without myelin
 *
 * setState({ strength, myelin, tried }) restores a setting; `tried` may list earlier
 * runs by { strength, myelin } alone. Without `tried`, the setting itself counts as run.
 *
 * The model: rate = 20 + 30 × (strength − threshold) impulses per second at or above
 * the threshold, and none below it. Real neurons differ in their numbers but follow
 * the same rule. Real impulses are about a tenth of a volt (100 mV) from trough to peak.
 */
import { frame, sliderRow, button, readout, loop, hue, s, h, clamp, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 290;
const AX0 = 132;      // axon start and end
const AX1 = 508;
const AY = 62;
const TX0 = 70;       // trace panel
const TX1 = 540;
const TY0 = 150;      // top of a full impulse
const TY1 = 250;      // resting level
const WINDOW = 0.1;   // seconds shown on the trace

addStyles('nerve-impulse', `
  .widget-nerve-impulse .ni-switch { display: flex; align-items: center; justify-content: center; gap: var(--s2); font-weight: 700; font-size: var(--fs-sm); min-height: 40px; }
  .widget-nerve-impulse .ni-switch input { width: 22px; height: 22px; accent-color: var(--violet); }
`);

export default function create(spec, env) {
  const threshold = spec.threshold != null ? spec.threshold : 4;
  const speeds = { bare: 1, myelin: 100, ...(spec.speeds || {}) };
  const isStatic = !!spec.static || !!env.compact;
  let strength = clamp(spec.strength != null ? spec.strength : 2, 0, 10);
  let myelin = !!spec.myelin;
  let readOnly = !!env.readOnly;
  let shown = isStatic;      // the trace for the current setting is on screen
  let runs = 0;
  let tried = [];
  let pulse = -1;            // position of the travelling dot, 0 to 1 (-1: none)

  const rateOf = (v) => (v < threshold ? 0 : 20 + 30 * (v - threshold));
  const travelOf = (m) => Math.round(1000 / (m ? speeds.myelin : speeds.bare));

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A nerve cell with a stimulus and a recording of its impulses' });
  const { svg } = fr;

  /* the cell */
  const gCell = s('g');
  const gSheath = s('g');
  const gTrace = s('g');
  const dot = s('circle', { r: 8, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5, visibility: 'hidden' });
  const arrow = s('path', { fill: 'none', stroke: hue('red'), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  svg.append(gCell, gSheath, dot, arrow, gTrace);

  // dendrites, cell body, axon, end knobs
  const ink = { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' };
  for (const d of ['M96 62 L62 34', 'M96 62 L58 62', 'M96 62 L62 92', 'M70 40 L60 22', 'M70 86 L58 104', 'M72 41 L50 40', 'M70 85 L48 86']) gCell.appendChild(s('path', { d, ...ink }));
  gCell.appendChild(s('line', { x1: 118, y1: AY, x2: AX1, y2: AY, ...ink, 'stroke-width': 4 }));
  for (const d of [`M${AX1} ${AY} L${AX1 + 24} ${AY - 20}`, `M${AX1} ${AY} L${AX1 + 28} ${AY}`, `M${AX1} ${AY} L${AX1 + 24} ${AY + 20}`]) gCell.appendChild(s('path', { d, ...ink }));
  for (const [x, y] of [[AX1 + 26, AY - 22], [AX1 + 31, AY], [AX1 + 26, AY + 22]]) gCell.appendChild(s('circle', { cx: x, cy: y, r: 5, fill: 'var(--ink)' }));
  gCell.appendChild(s('circle', { cx: 104, cy: AY, r: 20, fill: hue('violet', 'soft'), stroke: 'var(--ink)', 'stroke-width': 3 }));
  gCell.appendChild(s('circle', { cx: 104, cy: AY, r: 6, fill: hue('violet') }));
  gCell.appendChild(s('text.fig-label-sm', { x: 104, y: 112, 'text-anchor': 'middle' }, 'cell body'));
  gCell.appendChild(s('text.fig-label-sm', { x: (AX0 + AX1) / 2, y: 112, 'text-anchor': 'middle' }, 'axon (drawn far too short)'));
  gCell.appendChild(s('text.fig-label-sm', { x: 8, y: 130, 'text-anchor': 'start' }, 'stimulus'));

  // the recorder's axes
  svg.appendChild(s('line', { x1: TX0, x2: TX0, y1: TY0 - 12, y2: TY1 + 6, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  svg.appendChild(s('line', { x1: TX0, x2: TX1, y1: TY1 + 6, y2: TY1 + 6, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  svg.appendChild(s('text.tick-label', { x: TX0 - 8, y: TY0 + 4, 'text-anchor': 'end' }, '100 mV'));
  svg.appendChild(s('text.tick-label', { x: TX0 - 8, y: TY1 + 4, 'text-anchor': 'end' }, 'rest'));
  svg.appendChild(s('text.tick-label', { x: TX1, y: TY1 + 24, 'text-anchor': 'end' }, 'a tenth of a second'));
  svg.appendChild(s('text.axis-label', { x: TX0 + 8, y: TY0 - 14 }, 'recorded on the axon'));

  const roRate = readout('impulses a second', { digits: 0, color: 'blue' });
  const roSize = readout('size of each', { color: 'orange' });
  const roTravel = readout('time for 1 m', { color: 'violet' });
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  let row = null;
  let box = null;
  let goBtn = null;

  const fired = () => shown && strength >= threshold;
  const key = (t) => `${t.strength}|${t.myelin ? 1 : 0}`;

  function getState() {
    const above = new Set(tried.filter((t) => t.fired).map((t) => t.strength));
    return {
      strength, myelin, fired: fired(),
      rate: rateOf(strength),
      size: strength >= threshold ? 100 : 0,
      travel: travelOf(myelin),
      runs,
      tried: tried.map((t) => ({ ...t })),
      sawBelow: tried.some((t) => !t.fired),
      sawAbove: above.size,
      sawBoth: tried.some((t) => t.fired && t.myelin) && tried.some((t) => t.fired && !t.myelin),
    };
  }

  function drawSheath() {
    gSheath.replaceChildren();
    if (!myelin) return;
    const n = 6;
    const gap = 9;
    const seg = (AX1 - AX0 - 10 - gap * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      gSheath.appendChild(s('rect', { x: AX0 + 4 + i * (seg + gap), y: AY - 11, width: seg, height: 22, rx: 11, fill: hue('yellow', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
    }
    gSheath.appendChild(s('text.fig-label-sm', { x: (AX0 + AX1) / 2, y: AY - 20, 'text-anchor': 'middle' }, 'myelin sheath, with gaps'));
  }

  function render() {
    drawSheath();
    // the stimulus: a thicker arrow for a stronger one
    const w = 2 + strength * 0.9;
    arrow.setAttribute('d', strength > 0 ? `M8 ${AY} H${48 - w} M${38 - w} ${AY - 9 - w / 2} L${50 - w / 2} ${AY} L${38 - w} ${AY + 9 + w / 2}` : '');
    arrow.setAttribute('stroke-width', w);
    // the trace
    gTrace.replaceChildren();
    const thY = TY1 - (TY1 - TY0) * 0.3;
    gTrace.appendChild(s('line', { x1: TX0, x2: TX1, y1: thY, y2: thY, stroke: hue('red'), 'stroke-width': 2, 'stroke-dasharray': '5 6' }));
    gTrace.appendChild(s('text.tick-label', { x: TX1, y: thY - 6, 'text-anchor': 'end' }, 'threshold'));
    let d = `M${TX0} ${TY1}`;
    const rate = rateOf(strength);
    if (shown && rate > 0) {
      const n = Math.round(rate * WINDOW);
      const step = (TX1 - TX0 - 16) / n;
      for (let i = 0; i < n; i++) {
        const x = TX0 + 12 + i * step;
        d += `H${x.toFixed(1)}L${(x + 3).toFixed(1)} ${TY0}L${(x + 6).toFixed(1)} ${TY1 + 4}L${(x + 8).toFixed(1)} ${TY1}`;
      }
    } else if (shown && strength > 0) {
      // a bump that stays under the threshold and dies away
      const top = TY1 - (TY1 - thY) * (strength / threshold) * 0.85;
      d += `H${TX0 + 14}Q${TX0 + 26} ${top.toFixed(1)} ${TX0 + 44} ${TY1}`;
    }
    d += `H${TX1}`;
    gTrace.appendChild(s('path', { d, fill: 'none', stroke: hue('blue'), 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    if (!shown) gTrace.appendChild(s('text.fig-label', { x: (TX0 + TX1) / 2, y: (TY0 + TY1) / 2 + 10, 'text-anchor': 'middle' }, 'Press Stimulate'));

    dot.setAttribute('visibility', pulse >= 0 ? 'visible' : 'hidden');
    if (pulse >= 0) { dot.setAttribute('cx', AX0 + (AX1 - AX0) * pulse); dot.setAttribute('cy', AY); }

    roRate.set(shown ? rate : '—');
    roSize.set(shown ? (rate > 0 ? '100 mV' : 'none') : '—');
    roTravel.set(`${travelOf(myelin)} ms`);
    if (goBtn) goBtn.disabled = readOnly;
    const what = !shown ? 'Not stimulated yet.' : rate > 0
      ? `It fires: ${rate} impulses a second, each 100 millivolts. An impulse needs ${travelOf(myelin)} milliseconds for one metre.`
      : 'Below the threshold: no impulse travels.';
    svg.setAttribute('aria-label', `${spec.alt || 'A nerve cell with a stimulus and a recording of its impulses'}. Stimulus strength ${strength} of 10, ${myelin ? 'with' : 'without'} a myelin sheath. ${what}`);
  }

  const anim = loop((dt) => {
    pulse += dt / (myelin ? 0.3 : 1.8);
    if (pulse >= 1) { pulse = -1; anim.stop(); }
    render();
  });

  function record() {
    const run = { strength, myelin, fired: strength >= threshold, rate: rateOf(strength) };
    if (!tried.some((t) => key(t) === key(run))) tried.push(run);
  }

  function stimulate() {
    if (readOnly) return;
    runs++;
    shown = true;
    record();
    anim.stop();
    pulse = -1;
    const rate = rateOf(strength);
    note.textContent = rate > 0
      ? `Fired: ${rate} impulses a second, every one the same size.`
      : (strength > 0 ? 'A small flicker at the cell body, then nothing. No impulse travels.' : 'No stimulus, no impulse.');
    play(rate > 0 ? 'tick' : 'tap');
    env.announce(note.textContent);
    if (rate > 0 && !reducedMotion()) { pulse = 0; anim.start(); }
    render();
    env.onChange(getState());
  }

  if (!isStatic) {
    fr.readouts.append(roRate.el, roSize.el, roTravel.el);
    row = sliderRow({ label: 'stimulus strength', min: 0, max: 10, step: 1, value: strength, color: 'red', onInput: (v) => { if (readOnly) return; strength = v; shown = false; anim.stop(); pulse = -1; note.textContent = ''; render(); env.onChange(getState()); } });
    fr.controls.appendChild(row.el);
    if (spec.myelinToggle !== false) {
      box = h('input', { type: 'checkbox', checked: myelin });
      box.dataset.keys = 'own';
      box.addEventListener('change', () => { if (readOnly) { box.checked = myelin; return; } myelin = box.checked; shown = false; anim.stop(); pulse = -1; note.textContent = ''; render(); env.onChange(getState()); });
      fr.controls.appendChild(h('label.ni-switch', box, 'wrap the axon in a myelin sheath'));
    }
    goBtn = button('Stimulate', stimulate, { icon: 'play', variant: 'primary' });
    fr.buttons.appendChild(goBtn);
    fr.el.appendChild(note);
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      pulse = -1;
      if (typeof next.strength === 'number') { strength = clamp(Math.round(next.strength), 0, 10); if (row) row.set(strength); }
      if (typeof next.myelin === 'boolean') { myelin = next.myelin; if (box) box.checked = myelin; }
      if (Array.isArray(next.tried)) {
        tried = [];
        for (const t of next.tried) {
          const run = { strength: t.strength, myelin: !!t.myelin, fired: t.strength >= threshold, rate: rateOf(t.strength) };
          if (!tried.some((u) => key(u) === key(run))) tried.push(run);
        }
        runs = Math.max(runs, tried.length);
      }
      shown = true;
      record();
      runs = Math.max(runs, 1);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (row) row.setDisabled(readOnly);
      if (box) box.disabled = readOnly;
      render();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'nerve-impulse — all or nothing', spec: { type: 'nerve-impulse', strength: 2 } },
  { title: 'nerve-impulse — a myelinated axon, firing', spec: { type: 'nerve-impulse', strength: 7, myelin: true, static: true } },
];
