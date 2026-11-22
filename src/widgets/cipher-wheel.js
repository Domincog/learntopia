/**
 * cipher-wheel — a Caesar cipher you can turn. The outer ring is the plain
 * alphabet; the inner ring is the same alphabet rotated by the key. Under it,
 * a message is encoded or decoded live as the key changes, so a secret can be
 * cracked by simply trying keys — or by spotting its most common letter.
 *
 * {
 *   type: 'cipher-wheel',
 *   text: 'DWWDFN DW GDZQ',   // the message fed in (shown in capitals; anything that is not a letter passes through)
 *   mode: 'decode',           // 'decode': move every letter BACK by the key (read a secret)
 *                             // 'encode': move every letter FORWARD by the key (make a secret)
 *   shift: 0,                 // starting key, 0–25
 *   editable: false,          // true: the learner can type their own message
 *   top: 0,                   // show the k most common letters of the message as a clue (0 = hide)
 *   wheel: true,              // false: no rings, just the key slider and the text
 *   static: false,            // true: picture only (for figures)
 * }
 *
 * The key can be changed with the slider, by dragging the inner ring, or with
 * the arrow keys while the ring has focus.
 *
 * State: { mode, shift, input, output, top }
 *   shift  — the key, 0–25
 *   input  — the message fed in (capitals);  output — the message after shifting
 *   top    — the most common letters of the input: [{ letter: 'H', count: 9 }, …] (at most 5)
 *
 * setState accepts { shift } (and { text } when editable).
 */
import { frame, sliderRow, hue, s, h, clamp, addStyles } from './kit.js';
import { reducedMotion } from '../core/dom.js';
import { play } from '../core/audio.js';

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const W = 380;
const C = 190;          // centre
const R_OUT = 163;      // radius of the plain letters
const R_IN = 125;       // radius of the code letters
const BAND = 38;        // thickness of a ring
const STEP = 360 / 26;

addStyles('cipher-wheel', `
  /* only the inner ring is dragged; a finger anywhere else on the wheel may still scroll the page */
  .widget-cipher-wheel .w-canvas svg { touch-action: manipulation; }
  .widget-cipher-wheel .cw-drag { cursor: grab; outline: none; }
  .widget-cipher-wheel .cw-drag:active { cursor: grabbing; }
  .widget-cipher-wheel .cw-drag:focus-visible + .cw-focus { opacity: 1; }
  .widget-cipher-wheel .cw-focus { opacity: 0; pointer-events: none; }
  .widget-cipher-wheel.is-readonly .cw-drag { cursor: default; pointer-events: none; }
  .widget-cipher-wheel .cw-letter { font-family: var(--font-body); font-weight: 800; font-size: 17px; stroke: none; pointer-events: none; }
  .widget-cipher-wheel .cw-key { font-family: var(--font-display); font-variation-settings: 'SOFT' 100; font-weight: 800; font-size: 64px; fill: var(--ink); stroke: none; }
  .widget-cipher-wheel .cw-panel {
    border: var(--bw) solid var(--edge);
    border-radius: var(--r-lg);
    background: var(--surface);
    overflow: hidden;
  }
  .widget-cipher-wheel .cw-row { padding: var(--s2) var(--s4) var(--s3); }
  .widget-cipher-wheel .cw-row + .cw-row { border-top: var(--bw) dashed var(--hair); }
  .widget-cipher-wheel .cw-row.is-out { background: var(--yellow-soft); }
  .widget-cipher-wheel .cw-text {
    font-family: var(--font-mono); font-variant-ligatures: none;
    font-size: 1.05rem; font-weight: 700; letter-spacing: 0.06em; line-height: 1.5;
    overflow-wrap: anywhere; white-space: pre-wrap;
    min-height: 1.5em;
  }
  .widget-cipher-wheel .cw-text.is-code { color: var(--violet-text); }
  .widget-cipher-wheel .cw-input {
    width: 100%; min-height: 44px;
    padding: 0.3rem 0.6rem; margin-top: 2px;
    border: var(--bw) solid var(--edge); border-radius: 10px;
    background: var(--surface); color: var(--ink);
    font-family: var(--font-mono); font-size: 1.05rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
  }
  .widget-cipher-wheel .cw-input:focus { outline: none; border-color: var(--focus); box-shadow: 0 0 0 3px rgba(63, 140, 255, 0.3); }
  .widget-cipher-wheel .cw-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2); font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-cipher-wheel .cw-chip {
    display: inline-flex; align-items: baseline; gap: 0.3rem;
    padding: 0.15rem 0.6rem;
    border: var(--bw) solid var(--violet); border-radius: 999px;
    background: var(--violet-soft); color: var(--ink);
    font-family: var(--font-mono); font-weight: 800;
  }
  .widget-cipher-wheel .cw-chip small { font-family: var(--font-body); font-weight: 700; color: var(--ink-2); }
  @media (max-width: 520px) { .widget-cipher-wheel .cw-letter { font-size: 19px; } }
`);

const mod = (v, m) => ((v % m) + m) % m;
const shiftText = (text, k) => text.replace(/[A-Z]/g, (c) => ABC[mod(c.charCodeAt(0) - 65 + k, 26)]);
const clean = (text) => String(text == null ? '' : text).toUpperCase();

function commonest(text, limit = 5) {
  const counts = new Map();
  for (const c of text) if (c >= 'A' && c <= 'Z') counts.set(c, (counts.get(c) || 0) + 1);
  return Array.from(counts, ([letter, count]) => ({ letter, count }))
    .sort((p, q) => q.count - p.count || (p.letter < q.letter ? -1 : 1))
    .slice(0, limit);
}

export default function create(spec, env) {
  const mode = spec.mode === 'encode' ? 'encode' : 'decode';
  const interactive = !env.compact && !spec.static;
  const showWheel = spec.wheel !== false;
  const editable = !!spec.editable && interactive;
  const topCount = clamp(Math.round(spec.top || 0), 0, 5);
  let text = clean(spec.text != null ? spec.text : 'HELLO');
  let shift = mod(Math.round(spec.shift || 0), 26);
  let shown = shift;     // where the inner ring is drawn (glides towards `shift`)
  let readOnly = !!env.readOnly;
  let raf = 0;
  let drag = null;

  const fr = frame({ width: W, height: W, plain: true, compact: env.compact, maxWidth: spec.maxWidth || 400, label: spec.alt || 'Cipher wheel' });
  const { svg } = fr;
  if (!showWheel) fr.canvas.hidden = true;

  /* -------------------------------------------------------------- wheel */
  const polar = (deg, r) => { const a = ((deg - 90) * Math.PI) / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  svg.appendChild(s('circle', { cx: C, cy: C, r: R_OUT, fill: 'none', stroke: 'var(--surface)', 'stroke-width': BAND }));
  svg.appendChild(s('circle', { cx: C, cy: C, r: R_IN, fill: 'none', stroke: hue('violet', 'soft'), 'stroke-width': BAND }));
  svg.appendChild(s('circle', { cx: C, cy: C, r: R_IN - BAND / 2, fill: 'var(--surface)' }));
  for (const r of [R_OUT + BAND / 2, R_OUT - BAND / 2, R_IN - BAND / 2]) {
    svg.appendChild(s('circle', { cx: C, cy: C, r, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5 }));
  }
  const outer = [];
  const inner = [];
  for (let i = 0; i < 26; i++) {
    const [x, y] = polar(i * STEP, R_OUT);
    const o = s('text.cw-letter', { x, y: y + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: 'var(--ink)' }, ABC[i]);
    const c = s('text.cw-letter', { 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: hue('violet', 'text') }, ABC[i]);
    outer.push(o);
    inner.push(c);
    svg.append(o, c);
  }
  // the window at the top: plain A and the letter it turns into
  svg.appendChild(s('rect', { x: C - 18, y: C - R_OUT - BAND / 2 - 4, width: 36, height: 2 * BAND + 8, rx: 12, fill: 'none', stroke: hue('orange'), 'stroke-width': 4 }));
  svg.appendChild(s('text.fig-label-sm', { x: C, y: C - 44, 'text-anchor': 'middle', style: 'stroke:none;fill:var(--ink-3);letter-spacing:0.08em' }, 'KEY'));
  const keyText = s('text.cw-key', { x: C, y: C + 4, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
  const pairText = s('text.fig-label', { x: C, y: C + 56, 'text-anchor': 'middle', style: 'stroke:none' });
  svg.append(keyText, pairText);
  // what the pointer and the keyboard grab: the inner ring
  const grab = s('circle.cw-drag', { cx: C, cy: C, r: R_IN, fill: 'none', stroke: 'transparent', 'stroke-width': BAND, 'pointer-events': 'stroke' });
  const focusRing = s('circle.cw-focus', { cx: C, cy: C, r: R_IN, fill: 'none', stroke: 'var(--focus)', 'stroke-width': 4, 'stroke-dasharray': '10 7' });
  svg.append(grab, focusRing);

  function place() {
    for (let i = 0; i < 26; i++) {
      const [x, y] = polar((i - shown) * STEP, R_IN);
      inner[i].setAttribute('x', x.toFixed(2));
      inner[i].setAttribute('y', (y + 1).toFixed(2));
    }
  }

  function glide(instant) {
    cancelAnimationFrame(raf);
    // go the short way round
    let target = shift;
    while (target - shown > 13) target -= 26;
    while (shown - target > 13) target += 26;
    if (instant || reducedMotion() || Math.abs(target - shown) < 0.01) { shown = shift; place(); return; }
    const from = shown;
    const t0 = performance.now();
    const duration = Math.min(420, 120 + 60 * Math.abs(target - from));
    const step = (now) => {
      const u = Math.min(1, (now - t0) / duration);
      shown = from + (target - from) * (1 - Math.pow(1 - u, 3));
      if (u >= 1) shown = shift;
      place();
      if (u < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  /* --------------------------------------------------------------- text */
  const inLabel = h('div.eyebrow');
  const outLabel = h('div.eyebrow');
  const inText = h('div.cw-text');
  const outText = h('div.cw-text');
  (mode === 'decode' ? inText : outText).classList.add('is-code');
  const field = editable ? h('input.cw-input', { type: 'text', maxlength: 40, value: text, autocomplete: 'off', autocapitalize: 'characters', autocorrect: 'off', spellcheck: false, 'aria-label': 'Your message' }) : null;
  if (field) {
    field.dataset.keys = 'own';
    field.addEventListener('input', () => {
      if (readOnly) { field.value = text; return; }
      text = clean(field.value);
      write();
      env.onChange(getState());
    });
  }
  const panel = h('div.cw-panel',
    h('div.cw-row', inLabel, field || inText),
    h('div.cw-row.is-out', { 'aria-live': 'polite' }, outLabel, outText),
  );
  const topRow = h('div.cw-top');

  const output = () => shiftText(text, mode === 'decode' ? -shift : shift);

  function write() {
    const places = shift === 1 ? '1 place' : `${shift} places`;
    inLabel.textContent = mode === 'decode' ? 'Secret message' : (editable ? 'Your message' : 'Plain message');
    outLabel.textContent = shift === 0
      ? 'Key 0: nothing moves'
      : mode === 'decode' ? `Key ${shift}: every letter moved back ${places}` : `Key ${shift}: every letter moved forward ${places}`;
    inText.textContent = text;
    outText.textContent = output() || ' ';
    keyText.textContent = String(shift);
    pairText.textContent = `A → ${ABC[shift]}`;
    grab.setAttribute('aria-valuenow', String(shift));
    grab.setAttribute('aria-valuetext', `key ${shift}: A becomes ${ABC[shift]}`);
    if (topCount) {
      const list = commonest(text, topCount);
      topRow.replaceChildren(h('span', mode === 'decode' ? 'Most common letters in the secret:' : 'Most common letters:'),
        ...list.map(({ letter, count }) => h('span.cw-chip', letter, h('small', `× ${count}`))));
    }
    svg.setAttribute('aria-label', `Cipher wheel set to key ${shift}: plain A lines up with ${ABC[shift]}, B with ${ABC[mod(shift + 1, 26)]}, and so on.`);
  }

  /* ----------------------------------------------------------- controls */
  let slider = null;

  function setShift(v, notify, instant) {
    const next = mod(Math.round(v), 26);
    if (next === shift) return;
    shift = next;
    if (slider && slider.value !== shift) slider.set(shift);
    write();
    if (!drag) glide(instant);
    if (notify) { play('tick'); env.onChange(getState()); }
  }

  if (interactive) {
    slider = sliderRow({
      label: 'key', min: 0, max: 25, step: 1, value: shift, color: 'violet',
      onInput: (v) => { if (readOnly) { slider.set(shift); return; } setShift(v, true, false); },
    });
    fr.controls.appendChild(slider.el);

    const pointerAngle = (ev) => {
      const m = svg.getScreenCTM();
      if (!m) return 0;
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const p = pt.matrixTransform(m.inverse());
      return (Math.atan2(p.y - C, p.x - C) * 180) / Math.PI;
    };
    grab.setAttribute('tabindex', '0');
    grab.setAttribute('role', 'slider');
    grab.setAttribute('aria-label', 'Inner ring. Drag it, or use the arrow keys, to change the key.');
    grab.setAttribute('aria-valuemin', '0');
    grab.setAttribute('aria-valuemax', '25');
    grab.dataset.keys = 'own';
    // Browsers ignore `touch-action` on shapes inside an SVG, so a finger that starts on the ring
    // is kept from scrolling the page the direct way. Touches anywhere else still scroll.
    grab.addEventListener('touchstart', (ev) => { if (!readOnly) ev.preventDefault(); }, { passive: false });
    grab.addEventListener('pointerdown', (ev) => {
      if (readOnly || ev.button > 0) return;
      cancelAnimationFrame(raf);
      drag = { id: ev.pointerId, last: pointerAngle(ev) };
      try { grab.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
      ev.preventDefault();
    });
    grab.addEventListener('pointermove', (ev) => {
      if (!drag || ev.pointerId !== drag.id) return;
      const now = pointerAngle(ev);
      let delta = now - drag.last;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      drag.last = now;
      shown -= delta / STEP;          // the ring follows the finger…
      place();
      setShift(shown, true, true);    // …and the key is the nearest whole step
      ev.preventDefault();
    });
    const release = (ev) => {
      if (!drag || ev.pointerId !== drag.id) return;
      drag = null;
      try { grab.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      glide(false);                   // settle on the nearest letter
    };
    grab.addEventListener('pointerup', release);
    grab.addEventListener('pointercancel', release);
    grab.addEventListener('keydown', (ev) => {
      if (readOnly) return;
      let d = 0;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') d = 1;
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') d = -1;
      else return;
      ev.preventDefault();
      ev.stopPropagation();
      setShift(shift + d, true, false);
    });
  }

  if (!env.compact) {
    if (topCount) fr.el.appendChild(topRow); // the clue sits between the key slider and the text it helps to read
    fr.el.appendChild(panel);
  }

  const getState = () => ({ mode, shift, input: text, output: output(), top: commonest(text) });

  write();
  place();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.text != null && editable) { text = clean(next.text); field.value = text; }
      if (next.shift != null) shift = mod(Math.round(next.shift), 26);
      if (slider) slider.set(shift);
      write();
      glide(true);
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      if (field) field.readOnly = readOnly;
      if (interactive) grab.setAttribute('tabindex', readOnly ? '-1' : '0');
    },
    destroy() { cancelAnimationFrame(raf); },
  };
}

export const examples = [
  { title: 'cipher-wheel — turn the wheel until the message makes sense', spec: { type: 'cipher-wheel', text: 'DWWDFN DW GDZQ', mode: 'decode', top: 3 } },
  { title: 'cipher-wheel — write your own secret', spec: { type: 'cipher-wheel', text: 'HELLO', mode: 'encode', shift: 3, editable: true } },
];
