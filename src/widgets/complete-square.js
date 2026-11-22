/**
 * complete-square — completing the square as a picture. x² + bx is a square
 * of side x with a b-by-x rectangle next to it. Cut the rectangle into two
 * strips of width b/2, move one of them underneath, and the shape is almost a
 * square of side x + b/2. What is missing is the small corner: (b/2)² unit
 * squares. The learner makes the cut, then fills the corner.
 *
 * {
 *   type: 'complete-square',
 *   b: 6,               // the picture is x² + bx; b is a positive whole number (even, if the corner is to be filled square by square)
 *   split: false,       // true: start with the rectangle already cut and moved
 *   added: 0,           // unit squares in the corner at the start
 *   max: 13,            // the most squares that can be added (default: 4 more than the corner holds)
 *   bRange: [2, 10],    // optional: a slider that changes b in steps of 2
 *   filled: false,      // pictures only: draw the corner complete, as one block
 *   static: false,      // true: picture only
 * }
 *
 * State: { b, half, split, added, needed, extra, complete }
 *   half      b/2: the width of each strip and the side of the corner
 *   needed    half²: the unit squares the corner holds
 *   extra     squares added beyond `needed` (they do not fit, and are drawn beside the picture)
 *   complete  split, and exactly `needed` squares added: the shape is a full square of side x + half
 *
 * setState accepts { b, split, added }.
 *
 * As in area-model, the length drawn for x is not a whole number of units,
 * so that the picture does not suggest a particular value of x.
 */
import { frame, sliderRow, button, hue, s, h, clamp, formatNumber, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 420;
const H = 330;
const PAD_L = 44;
const PAD_T = 40;
const PAD_R = 14;
const PAD_B = 12;
const X_UNITS = 4.4; // the drawn length of x, in units

addStyles('complete-square', `
  .widget-complete-square .cs-line { display: grid; gap: 2px; justify-items: center; text-align: center; min-height: 3em; align-content: center; font-size: var(--fs-md); }
  .widget-complete-square .cs-line small { color: var(--ink-2); font-size: var(--fs-sm); font-weight: 700; }
  .widget-complete-square .cs-line small.is-done { color: var(--green-text); }
  .widget-complete-square .cs-line small.is-over { color: var(--red-text); }
  .widget-complete-square .w-slider.is-waiting { opacity: 0.45; }
`);

const tex = (v) => formatNumber(v, 2).replace('−', '-');

export default function create(spec, env) {
  const isStatic = !!spec.static || env.compact;
  const range = Array.isArray(spec.bRange) ? [Math.max(2, Math.round(spec.bRange[0])), Math.round(spec.bRange[1])] : null;
  let b = Math.max(1, Math.round(spec.b != null ? spec.b : 6));
  if (range) b = clamp(b, range[0], range[1]);
  const bMax = range ? range[1] : b;
  let split = !!spec.split || !!spec.filled;
  let added = Math.max(0, Math.round(spec.added || 0));
  let readOnly = !!env.readOnly;
  const cells = () => b % 2 === 0;                                   // can the corner be filled with whole unit squares?
  const needed = () => (b / 2) * (b / 2);
  const maxAdd = () => (spec.max != null ? Math.round(spec.max) : needed() + 4);

  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, maxWidth: 460, label: spec.alt || 'A square and a rectangle being rearranged into a larger square' });
  const { svg } = fr;
  // one scale for every setting: the uncut rectangle is the widest thing that has to fit
  const k = Math.min((W - PAD_L - PAD_R) / (X_UNITS + bMax), (H - PAD_T - PAD_B) / (X_UNITS + bMax / 2));
  const xs = X_UNITS * k;
  const g = s('g');
  svg.appendChild(g);
  const line = h('div.cs-line', { 'aria-live': 'polite' });
  if (!env.compact) fr.el.insertBefore(line, fr.readouts);

  function getState() {
    const need = needed();
    const filled = spec.filled ? need : added;
    return { b, half: b / 2, split, added: filled, needed: need, extra: Math.max(0, filled - need), complete: split && filled === need };
  }

  const label = (text, x, y, cls = 'fig-label', extra = {}) => s('text', { class: cls, x, y, 'text-anchor': 'middle', ...extra }, text);
  const part = (x, y, w, hh, color) => s('rect', { x, y, width: w, height: hh, fill: hue(color, 'soft'), stroke: hue(color), 'stroke-width': 2, 'stroke-linejoin': 'round' });
  const stripLabel = (n, x, y) => {
    const t = s('text', { class: 'fig-label', x, y, 'text-anchor': 'middle' });
    if (n !== 1) t.append(s('tspan', {}, formatNumber(n, 2)));
    t.append(s('tspan', { class: 'fig-math' }, 'x'));
    return t;
  };
  const squareLabel = (x, y) => {
    const t = s('text', { class: 'fig-label-lg', x, y, 'text-anchor': 'middle' });
    t.append(s('tspan', { class: 'fig-math' }, 'x'), s('tspan', { dy: -8, 'font-size': 13, 'font-weight': 600 }, '2'));
    return t;
  };

  function draw() {
    const st = getState();
    const half = b / 2;
    const hw = half * k;
    g.replaceChildren();
    if (!split) {
      // a square and one long rectangle
      const ox = PAD_L + (W - PAD_L - PAD_R - (X_UNITS + b) * k) / 2;
      const oy = PAD_T + (H - PAD_T - PAD_B - xs) / 2;
      g.appendChild(part(ox, oy, xs, xs, 'blue'));
      g.appendChild(part(ox + xs, oy, b * k, xs, 'orange'));
      let d = '';
      for (let i = 1; i < b; i++) d += `M${(ox + xs + i * k).toFixed(1)} ${oy}v${xs.toFixed(1)}`;
      if (d) g.appendChild(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1, opacity: 0.28 }));
      // the place of the cut (broken in the middle, where the label of the rectangle sits)
      const cutX = ox + xs + hw;
      const cut = { x1: cutX, x2: cutX, stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' };
      g.appendChild(s('line', { ...cut, y1: oy + 4, y2: oy + xs / 2 - 18 }));
      g.appendChild(s('line', { ...cut, y1: oy + xs / 2 + 18, y2: oy + xs + 10 }));
      g.appendChild(s('rect', { x: ox, y: oy, width: xs + b * k, height: xs, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      g.appendChild(label('x', ox + xs / 2, oy - 14, 'fig-label fig-math'));
      g.appendChild(label(String(b), ox + xs + (b * k) / 2, oy - 14, 'fig-label', { style: `fill:${hue('orange', 'text')}` }));
      g.appendChild(label('x', ox - 18, oy + xs / 2 + 5, 'fig-label fig-math'));
      g.appendChild(squareLabel(ox + xs / 2, oy + xs / 2 + 7));
      g.appendChild(stripLabel(b, ox + xs + (b * k) / 2, oy + xs / 2 + 5));
    } else {
      const side = xs + hw;
      const ox = PAD_L + (W - PAD_L - PAD_R - (X_UNITS + bMax) * k) / 2 + ((bMax - b) * k) / 4;
      const oy = PAD_T + (H - PAD_T - PAD_B - side) / 2;
      g.appendChild(part(ox, oy, xs, xs, 'blue'));
      g.appendChild(part(ox + xs, oy, hw, xs, 'orange'));
      g.appendChild(part(ox, oy + xs, xs, hw, 'violet'));
      let d = '';
      for (let i = 1; i < half; i++) d += `M${(ox + xs + i * k).toFixed(1)} ${oy}v${xs.toFixed(1)}M${ox} ${(oy + xs + i * k).toFixed(1)}h${xs.toFixed(1)}`;
      if (d) g.appendChild(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1, opacity: 0.28 }));
      // the corner
      const cx0 = ox + xs;
      const cy0 = oy + xs;
      if (spec.filled || !cells()) {
        if (spec.filled) g.appendChild(part(cx0, cy0, hw, hw, 'green'));
        g.appendChild(label(spec.filled ? formatNumber(st.needed, 2) : '?', cx0 + hw / 2, cy0 + hw / 2 + 6, 'fig-label'));
      } else {
        for (let i = 0; i < st.needed; i++) {
          const col = i % half;
          const row = Math.floor(i / half);
          const on = i < added;
          g.appendChild(s('rect', {
            x: cx0 + col * k + (on ? 0 : 2), y: cy0 + row * k + (on ? 0 : 2), width: k - (on ? 0 : 4), height: k - (on ? 0 : 4), rx: on ? 0 : 3,
            fill: on ? hue('green', 'soft') : 'none', stroke: on ? hue('green') : 'var(--ink-3)', 'stroke-width': on ? 2 : 1.5, 'stroke-dasharray': on ? null : '4 4',
          }));
        }
        // squares that do not fit wait beside the corner
        for (let i = 0; i < st.extra; i++) {
          const col = i % Math.max(1, Math.floor((bMax - half) || 1));
          const row = Math.floor(i / Math.max(1, Math.floor((bMax - half) || 1)));
          g.appendChild(s('rect', { x: cx0 + hw + 10 + col * (k + 3), y: cy0 + row * (k + 3), width: k, height: k, fill: hue('red', 'soft'), stroke: hue('red'), 'stroke-width': 2 }));
        }
      }
      g.appendChild(s('path', { d: `M${cx0 + hw} ${oy} H${ox} V${cy0 + hw} `, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      g.appendChild(s('path', { d: `M${cx0 + hw} ${oy} V${cy0 + hw} H${ox}`, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': st.complete ? null : '7 7' }));
      g.appendChild(label('x', ox + xs / 2, oy - 14, 'fig-label fig-math'));
      g.appendChild(label(formatNumber(half, 2), cx0 + hw / 2, oy - 14, 'fig-label', { style: `fill:${hue('orange', 'text')}` }));
      g.appendChild(label('x', ox - 18, oy + xs / 2 + 5, 'fig-label fig-math'));
      g.appendChild(label(formatNumber(half, 2), ox - 20, cy0 + hw / 2 + 5, 'fig-label', { style: `fill:${hue('violet', 'text')}` }));
      g.appendChild(squareLabel(ox + xs / 2, oy + xs / 2 + 7));
      g.appendChild(stripLabel(half, cx0 + hw / 2, oy + xs / 2 + 5));
      g.appendChild(stripLabel(half, ox + xs / 2, cy0 + hw / 2 + 5));
    }

    // the working line
    const bx = `${b === 1 ? '' : b}x`;
    const rows = [];
    if (!split) {
      rows.push(h('span', { html: mdInline(`$x^2 + \\orange{${bx}}$`) }));
      rows.push(h('small', { html: mdInline('a square and one rectangle') }));
    } else if (st.complete) {
      rows.push(h('span', { html: mdInline(`$x^2 + ${bx} + \\green{${tex(st.needed)}} = (x + ${tex(st.half)})^2$`) }));
      rows.push(h('small.is-done', { html: mdInline(`a full square with side $x + ${tex(st.half)}$`) }));
    } else {
      rows.push(h('span', { html: mdInline(`$x^2 + \\orange{${tex(st.half)}x} + \\violet{${tex(st.half)}x}${st.added > 0 ? ` + \\green{${st.added}}` : ''}$`) }));
      rows.push(st.extra > 0
        ? h('small.is-over', { html: mdInline(`${st.extra} ${st.extra === 1 ? 'square does' : 'squares do'} not fit in the corner`) })
        : h('small', { html: mdInline('almost a square: the corner is not full') }));
    }
    line.replaceChildren(...rows);
    svg.setAttribute('aria-label', !split
      ? `A square of side x next to a rectangle ${b} wide and x tall.`
      : `A square of side x with a strip ${formatNumber(st.half, 2)} wide on its right and another below it. The corner holds ${formatNumber(st.needed, 2)} unit squares; ${st.added} ${st.added === 1 ? 'is' : 'are'} filled in.${st.complete ? ' The shape is a complete square.' : ''}`);
    paint();
  }

  /* --------------------------------------------------------------- controls */
  let addRow = null;
  let bRow = null;
  let cutBtn = null;
  function paint() {
    if (cutBtn) cutBtn.lastChild.textContent = split ? 'Put the rectangle back' : 'Cut the rectangle in half';
    if (addRow) {
      addRow.input.max = String(maxAdd());
      addRow.set(Math.min(added, maxAdd()));
      addRow.setDisabled(readOnly || !split || !cells());
      addRow.el.classList.toggle('is-waiting', !split || !cells());       // nothing to fill before the cut
    }
  }
  if (!isStatic) {
    cutBtn = button('Cut the rectangle in half', () => {
      if (readOnly) return;
      split = !split;
      if (!split) added = 0;
      play('drop');
      draw();
      env.onChange(getState());
    }, { icon: 'move' });
    // the cut comes before the filling, so its button comes before the slider
    cutBtn.style.justifySelf = 'center';
    fr.controls.appendChild(cutBtn);
    addRow = sliderRow({
      label: 'unit squares added', min: 0, max: maxAdd(), step: 1, value: added, color: 'green',
      onInput: (v) => { if (readOnly || !split) return; added = v; play('tap'); draw(); env.onChange(getState()); },
    });
    fr.controls.appendChild(addRow.el);
    if (range) {
      bRow = sliderRow({
        label: 'rectangle: $b$', min: range[0], max: range[1], step: 2, value: b, color: 'orange',
        onInput: (v) => { if (readOnly) return; b = v; added = Math.min(added, maxAdd()); play('tap'); draw(); env.onChange(getState()); },
      });
      fr.controls.appendChild(bRow.el);
    }
  }
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.b != null) { b = Math.max(1, Math.round(next.b)); if (range) b = clamp(b, range[0], range[1]); if (bRow) bRow.set(b); }
      if (next.split != null) split = !!next.split;
      if (next.added != null) added = clamp(Math.round(next.added), 0, maxAdd());
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (cutBtn) cutBtn.disabled = readOnly;
      if (bRow) bRow.setDisabled(readOnly);
      paint();
    },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'complete-square — cut, move, fill the corner', spec: { type: 'complete-square', b: 6 } },
  { title: 'complete-square — with a slider for b', spec: { type: 'complete-square', b: 4, split: true, bRange: [2, 10] } },
  { title: 'complete-square — a finished picture', spec: { type: 'complete-square', b: 8, filled: true, static: true } },
];
