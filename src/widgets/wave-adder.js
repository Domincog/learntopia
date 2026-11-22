/**
 * wave-adder — two waves in the same place, and their sum. Where waves
 * overlap, the medium moves by the sum of what each wave alone would do.
 * Three views of that one rule:
 *
 *   mode: 'pulses'  two humps run towards each other along a rope, pass
 *                   through each other and carry on unchanged
 *   mode: 'waves'   two steady waves of the same wavelength; slide one along
 *                   and the sum grows (crests on crests) or vanishes (crests on troughs)
 *   mode: 'beats'   two notes of slightly different frequency, drawn against
 *                   time; their sum swells and fades |fA − fB| times a second
 *
 * {
 *   type: 'wave-adder',
 *   mode: 'waves',
 *
 *   // pulses
 *   heightA: 20, heightB: 20,     // heights in cm; B can be flipped into a trough with the buttons
 *   flip: false,                  // start with B upside down
 *   flipToggle: true,             // let the learner flip B
 *
 *   // waves
 *   ampA: 20, ampB: 20,           // amplitudes in cm
 *   ampBRange: [0, 20, 5],        // optional slider for B's amplitude
 *   shift: 0,                     // how far B is slid along, in wavelengths (0 … 1)
 *   shiftStep: 0.125,
 *
 *   // beats
 *   freqA: 10, freqB: 12,         // Hz
 *   freqBRange: [6, 14, 1],       // slider for B's frequency
 *   seconds: 2,                   // length of the time axis
 *   envelope: true,               // outline the swelling and fading of the sum
 *
 *   readouts: true,               // show the number that goes with the mode (see State)
 *   static: false,
 * }
 *
 * State
 *   pulses: { mode, time, flip, mid, played, playedUp, playedFlipped }
 *     time — seconds since the pulses set off (they meet at 2 s and have swapped sides at 4 s)
 *     mid  — displacement of the rope at the meeting point right now (cm)
 *     played — the current arrangement has been played to the end; playedUp / playedFlipped — each arrangement has
 *   waves:  { mode, shift, ampA, ampB, sumAmp }      sumAmp — amplitude of the sum (cm)
 *   beats:  { mode, freqA, freqB, beat }             beat — beats per second, |freqA − freqB|
 *
 * setState accepts the same fields (for pulses: { flip, time, playedUp, playedFlipped }).
 * Everything is computed from exact formulas; nothing depends on frame timing.
 */
import { frame, sliderRow, button, readout, loop, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const X0 = 40;
const X1 = 540;
const TAU = Math.PI * 2;
const FRACTIONS = { 0: '0', 0.125: '⅛', 0.25: '¼', 0.375: '⅜', 0.5: '½', 0.625: '⅝', 0.75: '¾', 0.875: '⅞', 1: '1' };

addStyles('wave-adder', `
  .widget-wave-adder .w-buttons { align-items: center; }
  .widget-wave-adder .wa-tag { font-family: var(--font-body); font-weight: 800; font-size: 14px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-wave-adder .wa-tag { font-size: 18px; } }
`);

export default function create(spec, env) {
  const mode = ['pulses', 'waves', 'beats'].includes(spec.mode) ? spec.mode : 'waves';
  const isStatic = !!spec.static || !!env.compact;
  const showReadouts = spec.readouts !== false && !isStatic;
  let readOnly = !!env.readOnly;

  const H = mode === 'pulses' ? 236 : 286;
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'Two waves and their sum' });
  const { svg } = fr;
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  const line = (color, width = 3, dash = null) => s('path', { fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': dash });
  /** Path for y = f(u) with u running from 0 to `span` across the picture. */
  const trace = (f, span, mid, scale, n = 500) => {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const u = (span * i) / n;
      d += `${i ? 'L' : 'M'}${(X0 + ((X1 - X0) * i) / n).toFixed(1)} ${(mid - scale * f(u)).toFixed(1)}`;
    }
    return d;
  };
  const tag = (x, y, text, color, anchor = 'start') => s('text.wa-tag', { x, y, 'text-anchor': anchor, style: `fill:${color}` }, text);

  let api;

  /* ============================================================== pulses */
  if (mode === 'pulses') {
    const L = 12;                 // metres of rope
    const V = 2;                  // m/s
    const WIDTH = 2.4;            // metres
    const END = 4;                // seconds
    const MID = 118;
    const SCALE = 2.1;            // px per cm
    const hA = spec.heightA != null ? spec.heightA : 20;
    const hB0 = Math.abs(spec.heightB != null ? spec.heightB : 20);
    const canFlip = spec.flipToggle !== false && !isStatic;
    let flip = !!spec.flip;
    let t = isStatic && spec.time != null ? spec.time : 0;
    let done = { up: false, flipped: false };
    const X = (m) => X0 + (m / L) * (X1 - X0);
    const hump = (u) => (Math.abs(u) < WIDTH / 2 ? Math.cos((Math.PI * u) / WIDTH) ** 2 : 0);
    const a = (x, time) => hA * hump(x - (2 + V * time));
    const b = (x, time) => (flip ? -1 : 1) * hB0 * hump(x - (10 - V * time));

    svg.appendChild(s('line', { x1: X0, x2: X1, y1: MID, y2: MID, stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '4 6' }));
    svg.appendChild(s('line', { x1: X(6), x2: X(6), y1: 18, y2: H - 34, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 5' }));
    for (const x of [X0, X1]) svg.appendChild(s('rect', { x: x - 5, y: MID - 16, width: 10, height: 32, rx: 3, fill: 'var(--ink-2)' }));
    const fillA = s('path', { fill: hue('blue', 'soft'), stroke: hue('blue'), 'stroke-width': 2, 'stroke-dasharray': '5 5' });
    const fillB = s('path', { fill: hue('orange', 'soft'), stroke: hue('orange'), 'stroke-width': 2, 'stroke-dasharray': '5 5' });
    const rope = line('var(--ink)', 4);
    const dot = s('circle', { r: 6, fill: hue('violet'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
    const gTags = s('g');
    svg.append(fillA, fillB, rope, dot, gTags);
    svg.appendChild(s('text.tick-label', { x: X(6), y: H - 14, 'text-anchor': 'middle' }, 'meeting point'));

    const roMid = readout('rope at the meeting point', { color: 'violet' });
    let slider = null;
    let playBtn = null;
    const flipBtns = [];
    const anim = loop((dt) => {
      t = Math.min(END, t + dt * 0.8);
      if (t >= END) { anim.stop(); finished(true); return; }
      render();
    });
    const finished = (notify) => {
      t = END;
      done[flip ? 'flipped' : 'up'] = true;
      render();
      note.textContent = 'Both pulses arrive on the far side with the shape and size they set off with.';
      if (notify) { play('tick'); env.announce(note.textContent); env.onChange(getState()); }
    };
    const getState = () => ({ mode, time: tidy(t, 2), flip, mid: tidy(a(6, t) + b(6, t), 2), played: done[flip ? 'flipped' : 'up'], playedUp: done.up, playedFlipped: done.flipped });

    function render() {
      const closed = (f) => `${trace((u) => f(u, t), L, MID, SCALE, 360)}L${X1} ${MID}L${X0} ${MID}Z`;
      fillA.setAttribute('d', closed(a));
      fillB.setAttribute('d', closed(b));
      rope.setAttribute('d', trace((u) => a(u, t) + b(u, t), L, MID, SCALE, 360));
      const mid = a(6, t) + b(6, t);
      dot.setAttribute('cx', X(6));
      dot.setAttribute('cy', MID - SCALE * mid);
      clear(gTags);
      const xa = 2 + V * t;
      const xb = 10 - V * t;
      const apart = Math.abs(xa - xb) > 1.3;
      gTags.appendChild(tag(X(xa) - (apart ? 0 : 26), MID - SCALE * hA - 10, 'A', hue('blue', 'text'), 'middle'));
      gTags.appendChild(tag(X(xb) + (apart ? 0 : 26), flip ? MID + SCALE * hB0 + 22 : MID - SCALE * hB0 - 10, 'B', hue('orange', 'text'), 'middle'));
      roMid.set(`${formatNumber(mid, 0)} cm`);
      if (slider) slider.set(Math.round(t * 20) / 20);
      if (playBtn) { playBtn.lastChild.textContent = t >= END ? 'Play again' : 'Play'; playBtn.disabled = readOnly; }
      for (const { el, value } of flipBtns) { el.setAttribute('aria-pressed', String(flip === value)); el.disabled = readOnly; }
      if (!isStatic) svg.setAttribute('aria-label', `${spec.alt || 'Two pulses on a rope'}. Pulse A is a crest ${hA} centimetres high, moving right. Pulse B is a ${flip ? 'trough' : 'crest'} of ${hB0} centimetres, moving left. After ${formatNumber(t, 1)} seconds the rope at the meeting point is displaced ${formatNumber(mid, 0)} centimetres.`);
    }

    if (!isStatic) {
      if (showReadouts) fr.readouts.appendChild(roMid.el);
      slider = sliderRow({ label: 'time', min: 0, max: END, step: 0.05, value: t, color: 'violet', unit: 's', onInput: (v) => { if (readOnly) return; anim.stop(); t = v; note.textContent = ''; if (t >= END) done[flip ? 'flipped' : 'up'] = true; render(); env.onChange(getState()); } });
      fr.controls.appendChild(slider.el);
      if (canFlip) {
        const seg = h('div.segmented', { role: 'group', 'aria-label': 'Pulse B' });
        [['B is a crest', false], ['B is a trough', true]].forEach(([text, value]) => {
          const el = h('button', { type: 'button' }, text);
          el.addEventListener('click', () => { if (readOnly || flip === value) return; anim.stop(); flip = value; t = 0; note.textContent = ''; play('select'); render(); env.onChange(getState()); });
          flipBtns.push({ el, value });
          seg.appendChild(el);
        });
        fr.buttons.appendChild(seg);
      }
      playBtn = button('Play', () => {
        if (readOnly) return;
        anim.stop();
        t = 0;
        note.textContent = '';
        if (reducedMotion()) { finished(true); return; }
        render();
        anim.start();
      }, { icon: 'play', variant: 'primary' });
      fr.buttons.appendChild(playBtn);
      fr.el.appendChild(note);
    }
    render();
    api = {
      getState,
      setState(next) {
        if (!next) return;
        anim.stop();
        if (typeof next.flip === 'boolean') flip = next.flip;
        if (next.playedUp != null) done.up = !!next.playedUp;
        if (next.playedFlipped != null) done.flipped = !!next.playedFlipped;
        t = typeof next.time === 'number' ? clamp(next.time, 0, END) : (done.up || done.flipped ? END : t);
        if (t >= END) done[flip ? 'flipped' : 'up'] = true;
        render();
      },
      setReadOnly() { if (slider) slider.setDisabled(readOnly); render(); },
      destroy() { anim.stop(); },
    };
  }

  /* =============================================================== waves */
  if (mode === 'waves') {
    const LAMBDAS = 3;            // wavelengths across the picture
    const ampA = spec.ampA != null ? spec.ampA : 20;
    let ampB = spec.ampB != null ? spec.ampB : 20;
    let shift = spec.shift || 0;
    const step = spec.shiftStep || 0.125;
    const ampRange = !isStatic && Array.isArray(spec.ampBRange) ? spec.ampBRange : null;
    const ROW = [44, 110, 214];
    const SMALL = 1.25;           // px per cm in the two upper rows
    const BIG = 1.5;              // px per cm in the sum row
    const fa = (u) => ampA * Math.sin(TAU * u);
    const fb = (u) => ampB * Math.sin(TAU * (u - shift));
    const sumAmp = () => Math.sqrt(Math.max(0, ampA * ampA + ampB * ampB + 2 * ampA * ampB * Math.cos(TAU * shift)));

    for (const y of ROW) svg.appendChild(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '4 6' }));
    const gGuides = s('g');
    const pa = line(hue('blue'), 3.5);
    const pb = line(hue('orange'), 3.5);
    const ps = line(hue('violet'), 4.5);
    svg.append(gGuides, pa, pb, ps);
    svg.appendChild(tag(8, ROW[0] + 5, 'A', hue('blue', 'text')));
    svg.appendChild(tag(8, ROW[1] + 5, 'B', hue('orange', 'text')));
    svg.appendChild(tag(4, ROW[2] + 5, 'A+B', hue('violet', 'text')));
    for (let i = 0; i < LAMBDAS; i++) {
      const xc = X0 + ((i + 0.25) / LAMBDAS) * (X1 - X0);                 // the crests of A
      gGuides.appendChild(s('line', { x1: xc, x2: xc, y1: ROW[0] - 30, y2: H - 10, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 5' }));
    }
    const roSum = readout('amplitude of A + B', { color: 'violet' });
    const sliders = {};
    const getState = () => ({ mode, shift, ampA, ampB, sumAmp: tidy(sumAmp(), 4) });
    const render = () => {
      pa.setAttribute('d', trace(fa, LAMBDAS, ROW[0], SMALL));
      pb.setAttribute('d', trace(fb, LAMBDAS, ROW[1], SMALL));
      ps.setAttribute('d', trace((u) => fa(u) + fb(u), LAMBDAS, ROW[2], BIG));
      roSum.set(`${formatNumber(sumAmp(), 1)} cm`);
      if (!isStatic) svg.setAttribute('aria-label', `${spec.alt || 'Two waves and their sum'}. Wave A has amplitude ${ampA} centimetres, wave B ${ampB} centimetres. B is slid along by ${formatNumber(shift, 3)} of a wavelength. Their sum has amplitude ${formatNumber(sumAmp(), 1)} centimetres.`);
    };
    if (!isStatic) {
      if (showReadouts) fr.readouts.appendChild(roSum.el);
      sliders.shift = sliderRow({
        label: 'slide B along by', min: 0, max: 1, step, value: shift, color: 'orange',
        format: (v) => `${FRACTIONS[v] != null ? FRACTIONS[v] : formatNumber(v, 3)} wavelength`,
        onInput: (v) => { if (readOnly) return; shift = v; play('tap'); render(); env.onChange(getState()); },
      });
      fr.controls.appendChild(sliders.shift.el);
      if (ampRange) {
        ampB = clamp(ampB, ampRange[0], ampRange[1]);
        sliders.ampB = sliderRow({ label: 'amplitude of B', min: ampRange[0], max: ampRange[1], step: ampRange[2] || 5, value: ampB, color: 'orange', unit: 'cm', onInput: (v) => { if (readOnly) return; ampB = v; play('tap'); render(); env.onChange(getState()); } });
        fr.controls.appendChild(sliders.ampB.el);
      }
    }
    render();
    api = {
      getState,
      setState(next) {
        if (!next) return;
        if (typeof next.shift === 'number') { shift = clamp(next.shift, 0, 1); if (sliders.shift) sliders.shift.set(shift); }
        if (typeof next.ampB === 'number') { ampB = ampRange ? clamp(next.ampB, ampRange[0], ampRange[1]) : next.ampB; if (sliders.ampB) sliders.ampB.set(ampB); }
        render();
      },
      setReadOnly() { for (const key in sliders) sliders[key].setDisabled(readOnly); },
      destroy() {},
    };
  }

  /* =============================================================== beats */
  if (mode === 'beats') {
    const seconds = spec.seconds || 2;
    const freqA = spec.freqA != null ? spec.freqA : 10;
    let freqB = spec.freqB != null ? spec.freqB : 12;
    const range = !isStatic && Array.isArray(spec.freqBRange) ? spec.freqBRange : null;
    const ROW = [38, 96, 196];
    const fa = (u) => Math.sin(TAU * freqA * u);
    const fb = (u) => Math.sin(TAU * freqB * u);
    const tx = (sec) => X0 + (sec / seconds) * (X1 - X0);

    for (const y of ROW) svg.appendChild(s('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '4 6' }));
    for (let sec = 0; sec <= seconds + 1e-9; sec += 0.5) {
      const whole = Math.abs(sec - Math.round(sec)) < 1e-9;
      svg.appendChild(s('line', { x1: tx(sec), x2: tx(sec), y1: whole ? 12 : H - 38, y2: H - 30, stroke: whole ? 'var(--ink-3)' : 'var(--ink)', 'stroke-width': 1.5, 'stroke-dasharray': whole ? '3 5' : null }));
      if (whole) svg.appendChild(s('text.tick-label', { x: tx(sec), y: H - 12, 'text-anchor': 'middle' }, `${sec} s`));
    }
    svg.appendChild(s('line', { x1: X0, x2: X1, y1: H - 30, y2: H - 30, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
    const pa = line(hue('blue'), 2.5);
    const pb = line(hue('orange'), 2.5);
    const envTop = line(hue('violet'), 2, '5 5');
    const envBottom = line(hue('violet'), 2, '5 5');
    const ps = line(hue('violet'), 2.5);
    svg.append(pa, pb, ps, envTop, envBottom);
    svg.appendChild(tag(8, ROW[0] + 5, 'A', hue('blue', 'text')));
    svg.appendChild(tag(8, ROW[1] + 5, 'B', hue('orange', 'text')));
    svg.appendChild(tag(4, ROW[2] + 5, 'A+B', hue('violet', 'text')));
    const roA = readout('A', { color: 'blue' });
    const roBeat = readout('swells per second', { color: 'violet' });
    let slider = null;
    const getState = () => ({ mode, freqA, freqB, beat: tidy(Math.abs(freqA - freqB), 4) });
    const render = () => {
      pa.setAttribute('d', trace(fa, seconds, ROW[0], 20, 900));
      pb.setAttribute('d', trace(fb, seconds, ROW[1], 20, 900));
      ps.setAttribute('d', trace((u) => fa(u) + fb(u), seconds, ROW[2], 24, 1200));
      const env2 = (u) => 2 * Math.abs(Math.cos(Math.PI * (freqA - freqB) * u));
      const show = spec.envelope !== false;
      envTop.setAttribute('d', show ? trace(env2, seconds, ROW[2], 24, 400) : '');
      envBottom.setAttribute('d', show ? trace((u) => -env2(u), seconds, ROW[2], 24, 400) : '');
      roA.set(`${formatNumber(freqA, 1)} Hz`);
      roBeat.set(formatNumber(Math.abs(freqA - freqB), 1));
      if (!isStatic) svg.setAttribute('aria-label', `${spec.alt || 'Two notes and their sum, drawn against time'}. Note A is ${freqA} hertz, note B is ${freqB} hertz. Their sum swells and fades ${formatNumber(Math.abs(freqA - freqB), 1)} times a second.`);
    };
    if (!isStatic) {
      fr.readouts.appendChild(roA.el);
      if (showReadouts) fr.readouts.appendChild(roBeat.el);
      if (range) {
        freqB = clamp(freqB, range[0], range[1]);
        slider = sliderRow({ label: 'frequency of B', min: range[0], max: range[1], step: range[2] || 1, value: freqB, color: 'orange', unit: 'Hz', onInput: (v) => { if (readOnly) return; freqB = v; play('tap'); render(); env.onChange(getState()); } });
        fr.controls.appendChild(slider.el);
      }
    }
    render();
    api = {
      getState,
      setState(next) {
        if (!next) return;
        if (typeof next.freqB === 'number') { freqB = range ? clamp(next.freqB, range[0], range[1]) : next.freqB; if (slider) slider.set(freqB); }
        render();
      },
      setReadOnly() { if (slider) slider.setDisabled(readOnly); },
      destroy() {},
    };
  }

  if (readOnly) fr.el.classList.add('is-readonly');
  return {
    el: fr.el,
    getState: api.getState,
    setState: api.setState,
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      api.setReadOnly();
    },
    destroy: api.destroy,
  };
}

export const examples = [
  { title: 'wave-adder — two pulses meet', spec: { type: 'wave-adder', mode: 'pulses' } },
  { title: 'wave-adder — slide one wave along the other', spec: { type: 'wave-adder', mode: 'waves', shift: 0.25, ampBRange: [0, 20, 5] } },
  { title: 'wave-adder — beats', spec: { type: 'wave-adder', mode: 'beats', freqA: 10, freqB: 12, freqBRange: [6, 14, 1] } },
];
