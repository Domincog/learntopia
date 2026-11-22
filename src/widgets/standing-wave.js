/**
 * standing-wave — a string clamped at both ends. Only waves that are zero at
 * both clamps can last on it, which happens exactly when a whole number of
 * half-wavelengths fits into the string. Those patterns are the fundamental
 * and its harmonics.
 *
 *   mode: 'fit'        slide the wavelength and see whether the wave gets back
 *                      to zero at the far clamp. When it does, the pattern is
 *                      shown vibrating, with its nodes marked.
 *   mode: 'harmonics'  choose the number of loops (and perhaps the length of
 *                      the string) and read off wavelength and frequency.
 *
 * {
 *   type: 'standing-wave',
 *   mode: 'fit',
 *   length: 1.2,                 // length of the string between the clamps (m)
 *   lengthRange: [0.4, 1.2, 0.2],   // harmonics mode: optional slider (a finger on a fret shortens the string)
 *   wavelength: 2,               // fit mode: starting wavelength (m)
 *   wavelengthRange: [0.4, 2.4, 0.1],
 *   n: 1,                        // harmonics mode: number of loops (half-wavelengths)
 *   nRange: [1, 6],              // harmonics mode: optional slider
 *   speed: 264,                  // wave speed along the string (m/s); set by its tension and weight, not by the pattern
 *   readouts: ['wavelength', 'frequency'],   // harmonics mode: which numbers to show
 *   caption: true,               // the line above the string ("3 loops: 3 half-wavelengths fit exactly"); false to leave the counting to the learner
 *   static: false,
 * }
 *
 * State (fit):       { mode, length, wavelength, halves, fits, n, found }
 *   halves — how many half-wavelengths lie along the string, 2·length ÷ wavelength
 *   fits   — that is a whole number (the wave is zero at both clamps);  n — that number, or null
 *   found  — every fitting wavelength the learner has landed on so far (largest first)
 * State (harmonics): { mode, length, n, wavelength, frequency, fundamental }
 *   wavelength = 2·length ÷ n;  frequency = speed ÷ wavelength;  fundamental = speed ÷ (2·length)
 *
 * setState accepts { wavelength, found } or { n, length }.
 */
import { frame, sliderRow, readout, loop, hue, s, h, clamp, tidy, addStyles, formatNumber } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

const W = 560;
const H = 220;
const XL = 56;
const XR = 504;
const MID = 104;
const AMP = 46;

addStyles('standing-wave', `
  .widget-standing-wave .sw-tag { font-family: var(--font-body); font-weight: 800; font-size: 13px; paint-order: stroke; stroke: var(--surface); stroke-width: 4px; stroke-linejoin: round; }
  @media (max-width: 520px) { .widget-standing-wave .sw-tag { font-size: 17px; } }
`);

export default function create(spec, env) {
  const mode = spec.mode === 'harmonics' ? 'harmonics' : 'fit';
  const isStatic = !!spec.static || !!env.compact;
  const speed = spec.speed || 264;
  const lengthRange = !isStatic && mode === 'harmonics' && Array.isArray(spec.lengthRange) ? spec.lengthRange : null;
  const nRange = !isStatic && mode === 'harmonics' && Array.isArray(spec.nRange) ? spec.nRange : null;
  const wlRange = mode === 'fit' ? (Array.isArray(spec.wavelengthRange) ? spec.wavelengthRange : [0.4, 2.4, 0.1]) : null;
  const maxLength = lengthRange ? lengthRange[1] : (spec.length || 1.2);

  let length = spec.length || 1.2;
  let wavelength = spec.wavelength != null ? spec.wavelength : 2;
  let n = spec.n || 1;
  let found = [];
  let clock = 0;
  let readOnly = !!env.readOnly;

  const k = (XR - XL) / maxLength;                 // px per metre
  const X = (m) => XL + m * k;
  const halves = () => (2 * length) / wavelength;
  const fits = () => Math.abs(halves() - Math.round(halves())) < 1e-6 && Math.round(halves()) >= 1;
  const loops = () => (mode === 'fit' ? (fits() ? Math.round(halves()) : null) : n);
  const lambda = () => (mode === 'fit' ? wavelength : (2 * length) / n);

  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A string clamped at both ends' });
  const { svg } = fr;
  // a ruler under the string
  const RULER = H - 34;
  svg.appendChild(s('line', { x1: XL, x2: X(maxLength), y1: RULER, y2: RULER, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' }));
  const tenths = Math.floor(maxLength * 10 + 1e-9);
  const every = maxLength <= 1 ? 2 : 4;                 // label every 0.2 m on a short string, every 0.4 m on a long one
  const lastLabel = Math.floor(tenths / every) * every;
  for (let i = 0; i <= tenths; i++) {
    const m = i / 10;
    const major = i % 2 === 0;
    svg.appendChild(s('line', { x1: X(m), x2: X(m), y1: RULER, y2: RULER + (major ? 8 : 5), stroke: 'var(--ink)', 'stroke-width': 1.5, 'stroke-linecap': 'round' }));
    if (i % every === 0) svg.appendChild(s('text.tick-label', { x: X(m), y: RULER + 23, 'text-anchor': 'middle' }, i === lastLabel ? `${formatNumber(m, 1)} m` : formatNumber(m, 1)));
  }
  const rest = s('line', { stroke: 'var(--hair)', 'stroke-width': 2, 'stroke-dasharray': '4 6', y1: MID, y2: MID, x1: XL });
  const envA = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 2, 'stroke-dasharray': '4 5', opacity: 0.75 });
  const envB = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 2, 'stroke-dasharray': '4 5', opacity: 0.75 });
  const string = s('path', { fill: 'none', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const gMarks = s('g');
  const clampL = s('rect', { x: XL - 9, y: MID - 22, width: 9, height: 44, rx: 3, fill: 'var(--ink-2)' });
  const clampR = s('rect', { y: MID - 22, width: 9, height: 44, rx: 3, fill: 'var(--ink-2)' });
  svg.append(rest, envA, envB, string, gMarks, clampL, clampR);

  /* ------------------------------------------------------------ controls */
  const ro = {};
  const note = h('p.w-hint', { 'aria-live': 'polite' });
  const sliders = {};
  const anim = loop((dt) => { clock += dt; render(); });
  const moving = () => !isStatic && !reducedMotion() && loops() != null;
  const sync = () => { if (moving()) anim.start(); else anim.stop(); };

  function getState() {
    if (mode === 'fit') {
      return { mode, length, wavelength, halves: tidy(halves(), 4), fits: fits(), n: loops(), found: found.slice() };
    }
    return { mode, length, n, wavelength: tidy(lambda(), 4), frequency: tidy(speed / lambda(), 2), fundamental: tidy(speed / (2 * length), 2) };
  }
  const remember = () => { if (mode === 'fit' && fits() && !found.includes(wavelength)) { found.push(wavelength); found.sort((a, b) => b - a); } };

  if (!isStatic) {
    if (mode === 'fit') {
      ro.halves = readout('half-wavelengths along the string', {});
      fr.readouts.appendChild(ro.halves.el);
      const [lo, hi, st] = wlRange;
      wavelength = clamp(wavelength, lo, hi);
      sliders.wavelength = sliderRow({ label: 'wavelength', min: lo, max: hi, step: st || 0.1, value: wavelength, color: 'blue', unit: 'm', onInput: (v) => { if (readOnly) return; wavelength = tidy(v, 4); remember(); if (fits()) play('pop'); render(); sync(); env.onChange(getState()); } });
      fr.controls.appendChild(sliders.wavelength.el);
    } else {
      const wanted = Array.isArray(spec.readouts) ? spec.readouts : ['wavelength', 'frequency'];
      if (wanted.includes('wavelength')) { ro.wavelength = readout('wavelength', {}); fr.readouts.appendChild(ro.wavelength.el); }
      if (wanted.includes('frequency')) { ro.frequency = readout('frequency', { color: 'blue' }); fr.readouts.appendChild(ro.frequency.el); }
      if (nRange) {
        n = clamp(n, nRange[0], nRange[1]);
        sliders.n = sliderRow({ label: 'loops', min: nRange[0], max: nRange[1], step: 1, value: n, color: 'blue', onInput: (v) => { if (readOnly) return; n = v; play('tap'); render(); env.onChange(getState()); } });
        fr.controls.appendChild(sliders.n.el);
      }
      if (lengthRange) {
        length = clamp(length, lengthRange[0], lengthRange[1]);
        sliders.length = sliderRow({ label: 'length of string', min: lengthRange[0], max: lengthRange[1], step: lengthRange[2] || 0.1, value: length, color: 'violet', unit: 'm', onInput: (v) => { if (readOnly) return; length = tidy(v, 4); play('tap'); render(); env.onChange(getState()); } });
        fr.controls.appendChild(sliders.length.el);
      }
    }
    fr.el.appendChild(note);
  }

  /* -------------------------------------------------------------- render */
  const clear = (node) => { while (node.firstChild) node.removeChild(node.firstChild); };
  const path = (f) => {
    let d = '';
    const N = 240;
    for (let i = 0; i <= N; i++) {
      const x = (length * i) / N;
      d += `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${(MID - f(x)).toFixed(1)}`;
    }
    return d;
  };

  function render() {
    const xr = X(length);
    rest.setAttribute('x2', xr);
    clampR.setAttribute('x', xr);
    clear(gMarks);
    const count = loops();
    const lam = lambda();
    const shape = (x) => Math.sin((2 * Math.PI * x) / lam);
    if (count != null) {
      // a pattern that lasts: the string swings between the two dashed outlines
      const swing = moving() ? Math.cos(clock * 5.2) : 1;
      string.setAttribute('d', path((x) => AMP * shape(x) * swing));
      string.setAttribute('stroke', hue('blue'));
      string.removeAttribute('stroke-dasharray');
      envA.setAttribute('d', path((x) => AMP * shape(x)));
      envB.setAttribute('d', path((x) => -AMP * shape(x)));
      for (let i = 0; i <= count; i++) gMarks.appendChild(s('circle', { cx: X((i * length) / count), cy: MID, r: 5, fill: 'var(--ink)' }));
      if (count <= 6 && spec.caption !== false) gMarks.appendChild(s('text.sw-tag', { x: clamp((XL + xr) / 2, 120, W - 120), y: 22, 'text-anchor': 'middle', style: `fill:${hue('blue', 'text')}` }, `${count} ${count === 1 ? 'loop' : 'loops'}: ${count} half-wavelength${count === 1 ? '' : 's'} fit${count === 1 ? 's' : ''} exactly`));
    } else {
      // this wave does not come back to zero at the far clamp
      string.setAttribute('d', path((x) => AMP * shape(x)));
      string.setAttribute('stroke', hue('gray'));
      string.setAttribute('stroke-dasharray', '9 7');
      envA.setAttribute('d', '');
      envB.setAttribute('d', '');
      const yEnd = MID - AMP * shape(length);
      gMarks.appendChild(s('line', { x1: xr, x2: xr, y1: MID, y2: yEnd, stroke: hue('red'), 'stroke-width': 3, 'stroke-linecap': 'round' }));
      gMarks.appendChild(s('circle', { cx: xr, cy: yEnd, r: 6, fill: hue('red'), stroke: 'var(--ink)', 'stroke-width': 2 }));
      gMarks.appendChild(s('text.sw-tag', { x: clamp((XL + xr) / 2, 120, W - 120), y: 22, 'text-anchor': 'middle', style: `fill:${hue('red', 'text')}` }, 'Does not fit: the far end is clamped, but this wave is not at zero there'));
    }
    if (ro.halves) ro.halves.set(formatNumber(halves(), 2));
    if (ro.wavelength) ro.wavelength.set(`${formatNumber(lam, 2)} m`);
    if (ro.frequency) ro.frequency.set(`${formatNumber(speed / lam, 0)} Hz`);
    if (!isStatic) {
      svg.setAttribute('aria-label', mode === 'fit'
        ? `${spec.alt || 'A string clamped at both ends'}, ${formatNumber(length, 2)} metres long. A wave of wavelength ${formatNumber(wavelength, 2)} metres puts ${formatNumber(halves(), 2)} half-wavelengths along it: ${fits() ? 'it fits' : 'it does not fit'}.`
        : `${spec.alt || 'A string clamped at both ends'}, ${formatNumber(length, 2)} metres long, vibrating in ${n} ${n === 1 ? 'loop' : 'loops'}. Wavelength ${formatNumber(lam, 2)} metres, frequency ${formatNumber(speed / lam, 0)} hertz.`);
    }
  }

  remember();
  render();
  sync();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (mode === 'fit') {
        if (Array.isArray(next.found)) found = next.found.filter((v) => Math.abs((2 * length) / v - Math.round((2 * length) / v)) < 1e-6).sort((a, b) => b - a);
        if (typeof next.wavelength === 'number') { wavelength = clamp(next.wavelength, wlRange[0], wlRange[1]); if (sliders.wavelength) sliders.wavelength.set(wavelength); }
        remember();
      } else {
        if (typeof next.n === 'number') { n = nRange ? clamp(Math.round(next.n), nRange[0], nRange[1]) : Math.round(next.n); if (sliders.n) sliders.n.set(n); }
        if (typeof next.length === 'number') { length = lengthRange ? clamp(next.length, lengthRange[0], lengthRange[1]) : next.length; if (sliders.length) sliders.length.set(length); }
      }
      render();
      sync();
    },
    setReadOnly(val) {
      readOnly = !!val;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliders) sliders[key].setDisabled(readOnly);
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  { title: 'standing-wave — which wavelengths fit?', spec: { type: 'standing-wave', mode: 'fit', length: 1.2, wavelength: 2 } },
  { title: 'standing-wave — harmonics of a string', spec: { type: 'standing-wave', mode: 'harmonics', length: 1.2, n: 2, nRange: [1, 6], lengthRange: [0.4, 1.2, 0.2] } },
];
