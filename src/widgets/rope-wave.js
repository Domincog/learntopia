/**
 * rope-wave — shake one end of a long rope (or push and pull a long spring)
 * and watch the disturbance travel while every piece of the medium stays where
 * it is: a marked bead only moves up and down (or to and fro). A ruler under
 * the rope lets the learner measure the wavelength; a stopwatch times a single
 * pulse over 12 m.
 *
 * {
 *   type: 'rope-wave',
 *   kind: 'transverse',           // 'transverse': a rope · 'longitudinal': a long spring, squeezed and stretched along its length
 *   wave: 'continuous',           // 'continuous': the hand keeps shaking · 'pulse': one flick, timed to the flag at the far end
 *   freq: 1,                      // shakes per second (Hz), continuous waves
 *   freqRange: [0.5, 4, 0.5],     // optional slider [min, max, step]
 *   amp: 20,                      // amplitude in centimetres (how hard the hand shakes)
 *   ampRange: [10, 30, 10],
 *   flick: 0.5,                   // pulse only: how long the flick lasts (s); a quicker flick makes a narrower pulse
 *   flickRange: [0.25, 0.75, 0.25],
 *   speed: 4,                     // wave speed along the rope (m/s): set by the rope, never by the hand
 *   ropes: [2, 4, 6],             // optional: buttons to swap the rope for a looser or tighter one (their wave speeds, m/s)
 *   ropeNames: ['loose', 'firm', 'tight'],
 *   length: 12,                   // metres of rope in view
 *   bead: 6,                      // where the marked bead sits (m from the hand); false for none
 *   readouts: [],                 // any of 'wavelength', 'speed', 'period', 'frequency'
 *   timeScale: 0.5,               // the animation runs in slow motion at this fraction of real time
 *   crestAt: 0,                   // static or frozen pictures put a crest this far from the hand (m)
 *   static: false,                // true: a frozen picture of the steady wave, without controls
 * }
 *
 * State: { freq, amp, flick, speed, wavelength, period, frozen, sent, travelTime, pulses }
 *   wavelength — speed ÷ frequency (m);  period — 1 ÷ frequency (s)
 *   frozen     — the learner has frozen the picture
 *   sent       — a pulse with the current settings has been sent
 *   travelTime — time a pulse takes to cover the rope in view: length ÷ speed (s)
 *   pulses     — every pulse sent so far: [{ amp, flick, speed, travelTime }]
 * The facts always describe the current settings; they do not wait for the animation.
 *
 * setState({ freq, amp, flick, speed, pulses }) sets the controls (and, for a pulse, shows it arrived).
 *
 * The model is exact. A steady wave is y(x, t) = A·sin(2π·f·(t − x/v)): each
 * point copies what the hand did x/v seconds earlier. A pulse is one smooth
 * hump, A·sin²(π·u/w) for 0 < u < w, where u = v·t − x and w = v × (flick
 * time). The medium does not disperse or damp, so the shape never changes.
 */
import { frame, sliderRow, button, readout, loop, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const X0 = 44;          // the hand
const X1 = 536;         // the far end of the rope in view
const TAU = Math.PI * 2;

addStyles('rope-wave', `
  .widget-rope-wave .w-buttons { align-items: center; }
  .widget-rope-wave .rw-tag { font-family: var(--font-body); font-weight: 800; font-size: 13px; fill: var(--ink-2); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-rope-wave .rw-tag { font-size: 17px; } }
`);

export default function create(spec, env) {
  const kind = spec.kind === 'longitudinal' ? 'longitudinal' : 'transverse';
  const pulseMode = spec.wave === 'pulse';
  const isStatic = !!spec.static || !!env.compact;
  const L = spec.length || 12;
  const k = (X1 - X0) / L;                                   // px per metre
  const timeScale = spec.timeScale || 0.5;
  const ropes = !isStatic && Array.isArray(spec.ropes) ? spec.ropes : null;
  const ropeNames = spec.ropeNames || ['loose', 'firm', 'tight'];
  const ranges = {
    freq: !isStatic && !pulseMode && Array.isArray(spec.freqRange) ? spec.freqRange : null,
    amp: !isStatic && Array.isArray(spec.ampRange) ? spec.ampRange : null,
    flick: !isStatic && pulseMode && Array.isArray(spec.flickRange) ? spec.flickRange : null,
  };
  const beadAt = spec.bead === false || pulseMode ? null : (spec.bead != null ? spec.bead : 6);
  const wanted = Array.isArray(spec.readouts) ? spec.readouts : [];

  let freq = spec.freq != null ? spec.freq : 1;
  let amp = spec.amp != null ? spec.amp : 20;
  let flick = spec.flick != null ? spec.flick : 0.5;
  let speed = spec.speed != null ? spec.speed : 4;
  let t = 0;                    // simulated seconds
  let frozen = false;
  let sent = false;             // pulse mode: the current settings have been sent
  let pulses = [];
  let readOnly = !!env.readOnly;

  const H = kind === 'transverse' ? 232 : 190;
  const MID = kind === 'transverse' ? 100 : 78;
  const RULER = H - 40;
  const X = (m) => X0 + m * k;
  const ampPx = () => amp * 2.2;                             // drawn taller than life so that it can be seen
  /** A time at which the steady wave has a crest `crestAt` metres from the hand. */
  const crestTime = (after = 0) => {
    const base = (spec.crestAt || 0) / speed + 0.25 / freq;
    const n = Math.max(0, Math.ceil((after - base) * freq - 1e-9));
    return base + n / freq;
  };

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A wave travelling along a rope' });
  const { svg } = fr;

  // ruler
  svg.appendChild(s('line', { x1: X0, x2: X1, y1: RULER, y2: RULER, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
  for (let m = 0; m <= L; m++) {
    const major = m % 2 === 0;
    svg.appendChild(s('line', { x1: X(m), x2: X(m), y1: RULER, y2: RULER + (major ? 9 : 6), stroke: 'var(--ink)', 'stroke-width': major ? 2 : 1.5, 'stroke-linecap': 'round' }));
    svg.appendChild(s('line.grid-line', { x1: X(m), x2: X(m), y1: 14, y2: RULER }));
    if (major) svg.appendChild(s('text.tick-label', { x: X(m), y: RULER + 25, 'text-anchor': 'middle' }, m === L ? `${m} m` : String(m)));
  }
  const gTrack = s('g');
  const gMedium = s('g');
  const gMarks = s('g');
  svg.append(gTrack, gMedium, gMarks);
  const rope = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const hand = s('g', s('rect', { x: -15, y: -11, width: 22, height: 22, rx: 8, fill: hue('yellow', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  const bead = s('circle', { r: 8, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2.5 });
  if (kind === 'transverse') svg.appendChild(rope);
  svg.appendChild(hand);
  if (beadAt != null && kind === 'transverse') svg.appendChild(bead);
  if (pulseMode) {
    const fx = X(L);
    svg.appendChild(s('line', { x1: fx, x2: fx, y1: MID + 30, y2: MID - 44, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
    svg.appendChild(s('path', { d: `M${fx} ${MID - 44}L${fx - 17} ${MID - 37}L${fx} ${MID - 30}Z`, fill: hue('green'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  }

  /* ----------------------------------------------------------- the model */
  const width = () => speed * flick;                           // length of a pulse (m)
  /** Displacement (as a fraction of the amplitude) of the point x metres from the hand. */
  function shape(x, time) {
    if (pulseMode) {
      const u = speed * time - x;
      const w = width();
      return u > 0 && u < w ? Math.sin((Math.PI * u) / w) ** 2 : 0;
    }
    return Math.sin(TAU * freq * (time - x / speed));
  }
  const travelTime = () => L / speed;
  /** Pulse mode: the run ends when the top of the hump reaches the flag. */
  const pulseEnd = () => (L + width() / 2) / speed;

  /* ------------------------------------------------------------ controls */
  const ro = {};
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const sliders = {};
  const ropeBtns = [];
  let goBtn = null;
  const restart = () => {
    anim.stop();
    sent = false;
    if (pulseMode) t = 0;
    note.textContent = '';
    if (!pulseMode && !frozen && !reducedMotion()) anim.start();
    if (!pulseMode && (frozen || reducedMotion())) t = crestTime(t);
    render();
    env.onChange(getState());
  };
  if (!isStatic) {
    const labels = { wavelength: 'wavelength', speed: 'wave speed', period: 'period', frequency: 'frequency', clock: 'time to the flag' };
    for (const key of wanted) { ro[key] = readout(labels[key] || key, {}); fr.readouts.appendChild(ro[key].el); }
    if (pulseMode) { ro.clock = readout(labels.clock, { color: 'blue' }); fr.readouts.appendChild(ro.clock.el); }
    const add = (key, label, unit, color, get, put) => {
      if (!ranges[key]) return;
      const [lo, hi, st] = ranges[key];
      sliders[key] = sliderRow({ label, min: lo, max: hi, step: st || 1, value: clamp(get(), lo, hi), color, unit, onInput: (v) => { if (readOnly) return; put(v); restart(); } });
      fr.controls.appendChild(sliders[key].el);
    };
    add('freq', pulseMode ? 'frequency' : 'frequency (shakes per second)', 'Hz', 'violet', () => freq, (v) => { freq = v; });
    add('amp', pulseMode ? 'size of the flick' : 'amplitude', 'cm', 'teal', () => amp, (v) => { amp = v; });
    add('flick', 'time the flick takes', 's', 'violet', () => flick, (v) => { flick = v; });
    if (ropes) {
      const seg = h('div.segmented', { role: 'group', 'aria-label': 'Which rope' });
      ropes.forEach((v, i) => {
        const b = h('button', { type: 'button', 'aria-pressed': String(speed === v) }, `${ropeNames[i] || v} rope`);
        b.addEventListener('click', () => { if (readOnly || speed === v) return; speed = v; play('select'); restart(); });
        ropeBtns.push({ b, v });
        seg.appendChild(b);
      });
      fr.buttons.appendChild(seg);
    }
    if (pulseMode) {
      goBtn = button('Send a pulse', () => send(true), { icon: 'play', variant: 'primary' });
    } else {
      goBtn = button('Freeze', () => {
        if (readOnly) return;
        frozen = !frozen;
        play('tap');
        if (frozen) { anim.stop(); t = crestTime(t); } else if (!reducedMotion()) anim.start();
        render();
        env.onChange(getState());
      }, { icon: 'pause' });
    }
    fr.buttons.appendChild(goBtn);
    fr.el.appendChild(note);
  }

  /* ----------------------------------------------------------- animation */
  let notifyAtEnd = false;
  const anim = loop((dt) => {
    t += dt * timeScale;
    if (pulseMode && t >= pulseEnd()) { anim.stop(); arrive(notifyAtEnd); return; }
    render();
  });

  function describe() {
    return `The pulse covers the ${formatNumber(L, 0)} m to the flag in ${formatNumber(travelTime(), 2)} s: ${formatNumber(speed, 1)} m/s.`;
  }
  function arrive(notify) {
    sent = true;
    t = pulseEnd();
    render();
    note.textContent = describe();
    if (notify) { play('pop'); env.announce(note.textContent); env.onChange(getState()); }
  }
  function send(count) {
    if (count && readOnly) return;
    anim.stop();
    t = 0;
    sent = true;
    note.textContent = '';
    if (count) pulses.push({ amp, flick, speed, travelTime: tidy(travelTime(), 4) });
    if (reducedMotion()) { arrive(count); return; }
    notifyAtEnd = count;
    render();
    anim.start();
  }

  /* -------------------------------------------------------------- render */
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };

  function render() {
    const A = ampPx();
    clear(gMedium); clear(gTrack); clear(gMarks);
    if (kind === 'transverse') {
      let d = '';
      const n = 240;
      for (let i = 0; i <= n; i++) {
        const x = (L * i) / n;
        d += `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${(MID - A * shape(x, t)).toFixed(1)}`;
      }
      rope.setAttribute('d', d);
      hand.setAttribute('transform', `translate(${X0} ${(MID - A * shape(0, t)).toFixed(1)})`);
      if (beadAt != null) {
        // the bead's whole range of motion: straight up and down
        gTrack.appendChild(s('line', { x1: X(beadAt), x2: X(beadAt), y1: MID - A - 4, y2: MID + A + 4, stroke: hue('orange'), 'stroke-width': 2.5, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }));
        bead.setAttribute('cx', X(beadAt));
        bead.setAttribute('cy', MID - A * shape(beadAt, t));
      }
      if (!pulseMode && (frozen || isStatic || reducedMotion())) {
        // mark the crests so that their spacing can be read off the ruler
        const lambda = speed / freq;
        for (let xc = (spec.crestAt || 0) % lambda; xc <= L + 1e-9; xc += lambda) {
          gMarks.appendChild(s('line', { x1: X(xc), x2: X(xc), y1: MID - A, y2: RULER, stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 4' }));
          gMarks.appendChild(s('circle', { cx: X(xc), cy: MID - A, r: 4, fill: 'var(--ink)' }));
        }
      }
    } else {
      // a long spring drawn as coils; each coil is displaced along the spring
      const lambda = speed / freq;
      const Ax = Math.min(0.34, 0.11 * lambda) * (amp / 20);
      const coils = Math.round(L * 4);
      for (let i = 0; i <= coils; i++) {
        const x = (L * i) / coils;
        const px = X(x) + Ax * k * shape(x, t);
        const marked = beadAt != null && Math.abs(x - beadAt) < 1e-9;
        gMedium.appendChild(s('line', { x1: px, x2: px, y1: MID - 30, y2: MID + 30, stroke: marked ? hue('orange') : hue('blue'), 'stroke-width': marked ? 5 : 2.5, 'stroke-linecap': 'round' }));
        if (marked) {
          gTrack.appendChild(s('line', { x1: X(x) - Ax * k - 3, x2: X(x) + Ax * k + 3, y1: MID + 42, y2: MID + 42, stroke: hue('orange'), 'stroke-width': 2.5, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }));
          gTrack.appendChild(s('circle', { cx: px, cy: MID + 42, r: 5, fill: hue('orange'), stroke: 'var(--ink)', 'stroke-width': 2 }));
        }
      }
      hand.setAttribute('transform', `translate(${(X0 - 12 + Ax * k * shape(0, t)).toFixed(1)} ${MID})`);
    }

    const lambda = speed / freq;
    if (ro.wavelength) ro.wavelength.set(`${formatNumber(lambda, 2)} m`);
    if (ro.speed) ro.speed.set(`${formatNumber(speed, 1)} m/s`);
    if (ro.period) ro.period.set(`${formatNumber(1 / freq, 2)} s`);
    if (ro.frequency) ro.frequency.set(`${formatNumber(freq, 2)} Hz`);
    if (ro.clock) {
      const since = t - width() / (2 * speed);                // the clock starts as the top of the hump leaves the hand
      ro.clock.set(sent && !anim.running ? `${formatNumber(travelTime(), 2)} s` : anim.running ? `${formatNumber(clamp(since, 0, travelTime()), 1)} s` : '—');
    }
    for (const { b, v } of ropeBtns) { b.setAttribute('aria-pressed', String(speed === v)); b.disabled = readOnly; }
    if (goBtn) {
      goBtn.lastChild.textContent = pulseMode ? (sent && !anim.running ? 'Send another' : 'Send a pulse') : (frozen ? 'Let it run' : 'Freeze');
      goBtn.disabled = readOnly;
    }
    if (!isStatic) {
      svg.setAttribute('aria-label', pulseMode
        ? `${spec.alt || 'A pulse travelling along a rope'}. Wave speed on this rope ${formatNumber(speed, 1)} metres per second.${sent && !anim.running ? ` ${describe()}` : ''}`
        : `${spec.alt || 'A wave travelling along a rope'}. Frequency ${formatNumber(freq, 2)} hertz, amplitude ${formatNumber(amp, 0)} centimetres. Crests are ${formatNumber(lambda, 2)} metres apart.`);
    }
  }

  function getState() {
    return {
      freq, amp, flick, speed,
      wavelength: tidy(speed / freq, 4),
      period: tidy(1 / freq, 4),
      frozen,
      sent,
      travelTime: tidy(travelTime(), 4),
      pulses: pulses.map((p) => ({ ...p })),
    };
  }

  if (!pulseMode) t = crestTime(L / speed);
  render();
  if (!isStatic && !pulseMode && !reducedMotion()) anim.start();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      const put = (key, value, apply) => {
        if (typeof value !== 'number') return;
        const v = ranges[key] ? clamp(value, ranges[key][0], ranges[key][1]) : value;
        apply(v);
        if (sliders[key]) sliders[key].set(v);
      };
      put('freq', next.freq, (v) => { freq = v; });
      put('amp', next.amp, (v) => { amp = v; });
      put('flick', next.flick, (v) => { flick = v; });
      if (typeof next.speed === 'number' && (!ropes || ropes.includes(next.speed))) speed = next.speed;
      if (typeof next.frozen === 'boolean') frozen = next.frozen;
      if (pulseMode) {
        if (Array.isArray(next.pulses)) pulses = next.pulses.map((p) => { const sp = p.speed != null ? p.speed : speed; return { amp: p.amp != null ? p.amp : amp, flick: p.flick != null ? p.flick : flick, speed: sp, travelTime: tidy(L / sp, 4) }; });
        if (next.sent === false) { sent = false; t = 0; render(); return; }
        const last = pulses[pulses.length - 1];
        if (!last || last.amp !== amp || last.flick !== flick || last.speed !== speed) pulses.push({ amp, flick, speed, travelTime: tidy(travelTime(), 4) });
        arrive(false);
        return;
      }
      t = crestTime(L / speed);
      render();
      if (!frozen && !isStatic && !reducedMotion()) anim.start();
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliders) sliders[key].setDisabled(readOnly);
      render();
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'rope-wave — the wave travels, the bead does not', spec: { type: 'rope-wave', freq: 1, freqRange: [0.5, 4, 0.5], ampRange: [10, 30, 10], readouts: ['wavelength'] } },
  { title: 'rope-wave — a push-pull wave on a long spring', spec: { type: 'rope-wave', kind: 'longitudinal', freq: 1, freqRange: [0.5, 2, 0.5] } },
  { title: 'rope-wave — time one pulse', spec: { type: 'rope-wave', wave: 'pulse', ampRange: [10, 30, 10], flickRange: [0.25, 0.75, 0.25], ropes: [2, 4, 6] } },
];
