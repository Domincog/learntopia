/**
 * slide-rule — multiplying by adding lengths. Two copies of the same scale,
 * marked 1, 2, 4, 8 … so that every step to the right multiplies by the base.
 * The upper strip slides. Put its 1 above a number a on the fixed scale and
 * look under its mark b: the number there is a × b, because the two lengths
 * (the logarithms of a and of b) have been added. This is how slide rules
 * worked, and it is the product rule for logarithms as a picture.
 *
 * {
 *   type: 'slide-rule',
 *   base: 2,            // every step multiplies by this
 *   steps: 8,           // the fixed scale runs from 1 to base^steps
 *   shift: 0,           // steps the strip has been slid to the right at the start
 *   read: 3,            // the strip mark that is read, as a number of steps (3 means the mark base^3)
 *   lockRead: false,    // true: no slider for the mark that is read
 *   showSteps: true,    // add the count of steps to the working line: "2 steps + 3 steps = 5 steps"
 *   static: false,      // true: picture only
 * }
 *
 * State: { shift, read, a, b, product, onScale }
 *   a        the number on the fixed scale under the strip's 1  (base^shift)
 *   b        the strip mark being read                         (base^read)
 *   product  a × b: the number on the fixed scale under that mark
 *   onScale  false when that mark has slid past the end of the fixed scale
 *
 * setState accepts { shift, read }.
 */
import { frame, sliderRow, hue, s, h, clamp, svgPoint, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('slide-rule', `
  .widget-slide-rule .sr-line { display: grid; gap: 2px; justify-items: center; text-align: center; min-height: 3em; align-content: center; font-size: var(--fs-md); }
  .widget-slide-rule .sr-line small { color: var(--ink-2); font-size: var(--fs-sm); font-weight: 700; }
  .widget-slide-rule .sr-strip { cursor: grab; touch-action: none; }
  .widget-slide-rule .sr-strip:active { cursor: grabbing; }
  .widget-slide-rule.is-readonly .sr-strip { cursor: default; pointer-events: none; }
`);

const W = 560;
const H = 196;
const LEFT = 44;
let clipSeq = 0;

export default function create(spec, env) {
  const base = spec.base || 2;
  const steps = clamp(Math.round(spec.steps || 8), 3, 12);
  const isStatic = !!spec.static || env.compact;
  let shift = clamp(Math.round(spec.shift || 0), 0, steps);
  let read = clamp(Math.round(spec.read != null ? spec.read : 3), 0, steps);
  let readOnly = !!env.readOnly;

  const stepW = (W - 2 * LEFT) / steps;
  const xAt = (k) => LEFT + k * stepW;
  const value = (k) => Math.pow(base, k);
  const Y = { stripTop: 34, stripBottom: 92, fixedTop: 98, fixedBottom: 156 };

  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, label: spec.alt || 'A slide rule with two scales' });
  const { svg } = fr;
  const clipId = `sr-clip-${++clipSeq}`;
  svg.appendChild(s('defs', {}, s('clipPath', { id: clipId }, s('rect', { x: 2, y: 0, width: W - 4, height: H }))));
  const gFixed = s('g');
  const gStrip = s('g.sr-strip', { 'clip-path': `url(#${clipId})` });
  const gCursor = s('g', { 'clip-path': `url(#${clipId})`, 'pointer-events': 'none' });
  svg.append(gFixed, gStrip, gCursor);

  const line = h('div.sr-line', { 'aria-live': 'polite' });
  if (!env.compact) fr.el.insertBefore(line, fr.readouts);

  const getState = () => ({ shift, read, a: value(shift), b: value(read), product: value(shift + read), onScale: shift + read <= steps });

  /** A scale mark: "8", or "10⁵" once the plain number would be too long to fit. */
  function markLabel(k, x, y, extra = {}) {
    const v = value(k);
    const t = s('text', { class: 'fig-label', x, y, 'text-anchor': 'middle', ...extra });
    if (String(v).length <= 4) t.textContent = String(v);
    else t.append(s('tspan', {}, String(base)), s('tspan', { dy: -6, 'font-size': 12 }, String(k)));
    return t;
  }

  // the fixed scale never changes
  gFixed.appendChild(s('rect', { x: LEFT - 30, y: Y.fixedTop, width: W - 2 * LEFT + 60, height: Y.fixedBottom - Y.fixedTop, rx: 10, fill: 'var(--surface)', stroke: 'var(--edge)', 'stroke-width': 2.5 }));
  for (let k = 0; k <= steps; k++) {
    gFixed.appendChild(s('line', { x1: xAt(k), x2: xAt(k), y1: Y.fixedTop, y2: Y.fixedTop + 14, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
    gFixed.appendChild(markLabel(k, xAt(k), Y.fixedTop + 38, { style: 'stroke:none' }));
  }
  const caption = (text, y) => s('text', { class: 'fig-label-sm', x: LEFT - 26, y, style: 'fill:var(--ink-2)' }, text);
  gFixed.appendChild(caption(`fixed scale: each step to the right is × ${base}`, Y.fixedBottom + 20));
  gFixed.appendChild(caption('sliding strip: a copy of the same scale', Y.stripTop - 10));

  function draw() {
    const st = getState();
    gStrip.replaceChildren();
    const x0 = xAt(shift);
    gStrip.appendChild(s('rect', { x: x0 - 30, y: Y.stripTop, width: W - 2 * LEFT + 60, height: Y.stripBottom - Y.stripTop, rx: 10, fill: hue('blue', 'soft'), stroke: hue('blue'), 'stroke-width': 2.5 }));
    for (let j = 0; j <= steps; j++) {
      const x = xAt(shift + j);
      gStrip.appendChild(s('line', { x1: x, x2: x, y1: Y.stripBottom - 14, y2: Y.stripBottom, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
      gStrip.appendChild(markLabel(j, x, Y.stripBottom - 24, { style: 'stroke:none' }));
    }

    gCursor.replaceChildren();
    // where the strip's 1 points
    gCursor.appendChild(s('rect', { x: x0 - 21, y: Y.stripTop + 5, width: 42, height: Y.fixedBottom - Y.stripTop - 10, rx: 9, fill: 'none', stroke: hue('orange'), 'stroke-width': 3.5 }));
    // the mark that is read
    const xr = xAt(shift + read);
    if (read > 0) gCursor.appendChild(s('rect', { x: xr - 21, y: Y.stripTop + 5, width: 42, height: Y.fixedBottom - Y.stripTop - 10, rx: 9, fill: 'none', stroke: hue('violet'), 'stroke-width': 3.5, 'stroke-dasharray': st.onScale ? null : '6 6' }));

    const rows = [];
    if (st.onScale) {
      rows.push(h('span', { html: mdInline(`The strip's 1 sits above $\\orange{${st.a}}$. Under its $\\violet{${st.b}}$ you read $\\mathbf{${st.product}}$.`) }));
      if (spec.showSteps !== false) rows.push(h('small', { html: mdInline(`${shift} ${shift === 1 ? 'step' : 'steps'} + ${read} ${read === 1 ? 'step' : 'steps'} = ${shift + read} ${shift + read === 1 ? 'step' : 'steps'}, and $\\;${st.a} \\times ${st.b} = ${st.product}$`) }));
    } else {
      rows.push(h('span', { html: mdInline(`The strip's 1 sits above $\\orange{${st.a}}$. Its $\\violet{${st.b}}$ has slid past the end of the fixed scale.`) }));
      if (spec.showSteps !== false) rows.push(h('small', { html: mdInline(`${shift} + ${read} = ${shift + read} steps, but the fixed scale has only ${steps}`) }));
    }
    line.replaceChildren(...rows);
    svg.setAttribute('aria-label', `A slide rule. The strip's 1 is above ${st.a} on the fixed scale. ${st.onScale ? `Under the strip's ${st.b} is ${st.product}.` : `The strip's ${st.b} is past the end of the fixed scale.`}`);
  }

  /* --------------------------------------------------------------- controls */
  let shiftRow = null;
  let readRow = null;
  const setShift = (v) => {
    const nv = clamp(Math.round(v), 0, steps);
    if (nv === shift) return;
    shift = nv;
    if (shiftRow) shiftRow.set(shift);
    play('tick');
    draw();
    env.onChange(getState());
  };
  if (!isStatic) {
    shiftRow = sliderRow({
      label: 'strip\'s 1 above', min: 0, max: steps, step: 1, value: shift, color: 'orange', format: (v) => String(value(v)),
      onInput: (v) => { if (readOnly) return; shift = v; play('tick'); draw(); env.onChange(getState()); },
    });
    fr.controls.appendChild(shiftRow.el);
    if (!spec.lockRead) {
      readRow = sliderRow({
        label: 'read under', min: 0, max: steps, step: 1, value: read, color: 'violet', format: (v) => String(value(v)),
        onInput: (v) => { if (readOnly) return; read = v; play('tap'); draw(); env.onChange(getState()); },
      });
      fr.controls.appendChild(readRow.el);
    }
    // the strip can also be dragged directly
    let drag = null;
    gStrip.addEventListener('pointerdown', (ev) => {
      if (readOnly || ev.button > 0) return;
      drag = { id: ev.pointerId, x: svgPoint(svg, ev).x, shift };
      try { gStrip.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
      ev.preventDefault();
    });
    gStrip.addEventListener('pointermove', (ev) => {
      if (!drag || ev.pointerId !== drag.id) return;
      setShift(drag.shift + (svgPoint(svg, ev).x - drag.x) / stepW);
    });
    const end = (ev) => { if (drag && ev.pointerId === drag.id) drag = null; };
    gStrip.addEventListener('pointerup', end);
    gStrip.addEventListener('pointercancel', end);
  }
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.shift != null) { shift = clamp(Math.round(next.shift), 0, steps); if (shiftRow) shiftRow.set(shift); }
      if (next.read != null) { read = clamp(Math.round(next.read), 0, steps); if (readRow) readRow.set(read); }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (shiftRow) shiftRow.setDisabled(readOnly);
      if (readRow) readRow.setDisabled(readOnly);
    },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'slide-rule — multiply by sliding (powers of 2)', spec: { type: 'slide-rule', base: 2, steps: 8, shift: 2, read: 3 } },
  { title: 'slide-rule — powers of 10', spec: { type: 'slide-rule', base: 10, steps: 6, shift: 1, read: 2 } },
];
