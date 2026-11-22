/**
 * area-model — a rectangle whose sides are (x + a) and (x + b), cut into four
 * parts: x², a·x, b·x and a·b. A picture of what multiplying two brackets
 * means, and (run backwards) of factoring: find the two numbers whose sum is
 * the middle coefficient and whose product is the last term.
 *
 * {
 *   type: 'area-model',
 *   a: 2, b: 3,          // the sides are x + a (across) and x + b (down); whole numbers, 0 or more
 *   range: [0, 6],       // slider range for both numbers
 *   total: true,         // show the collected line under the picture: (x + 2)(x + 3) = x² + 5x + 6
 *   parts: true,         // label the four parts inside the picture
 *   target: [7, 12],     // optional: show "Goal: x² + 7x + 12" above the working line
 *   static: false,       // true: a picture without sliders
 * }
 *
 * State: { a, b, sum, product }
 *   sum      a + b: how many x-strips there are in total (the coefficient of x)
 *   product  a × b: how many unit squares fill the corner (the constant term)
 *
 * setState accepts { a, b }.
 *
 * The length drawn for x is deliberately not a whole number of units, so that
 * the picture does not suggest a particular value of x.
 */
import { frame, sliderRow, hue, s, h, clamp, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

const W = 392;
const H = 372;
const PAD_L = 52;
const PAD_T = 46;
const PAD_R = 18;
const PAD_B = 14;
const X_UNITS = 4.4; // the drawn length of x, in units

addStyles('area-model', `
  .widget-area-model .am-line { display: grid; gap: 2px; justify-items: center; text-align: center; min-height: 2.9em; align-content: center; font-size: var(--fs-md); }
  .widget-area-model .am-goal { color: var(--ink-2); font-size: var(--fs-sm); font-weight: 700; }
  .widget-area-model .am-goal.is-met { color: var(--green-text); }
`);

/** "x" or "x + 3": one side of the rectangle as TeX. */
const side = (n) => (n === 0 ? 'x' : `x + ${n}`);

/** x² + sx + p with tidy terms, as TeX. */
export function quadTex(sum, product) {
  const mid = sum === 0 ? '' : sum === 1 ? ' + x' : ` + ${sum}x`;
  return `x^2${mid}${product === 0 ? '' : ` + ${product}`}`;
}

export default function create(spec, env) {
  const [lo, hi] = Array.isArray(spec.range) ? spec.range.map((v) => Math.max(0, Math.round(v))) : [0, 6];
  const isStatic = !!spec.static || env.compact;
  const showParts = spec.parts !== false;
  const showTotal = spec.total !== false;
  const target = Array.isArray(spec.target) ? spec.target : null;
  let a = clamp(Math.round(spec.a != null ? spec.a : 2), lo, hi);
  let b = clamp(Math.round(spec.b != null ? spec.b : 3), lo, hi);
  let readOnly = !!env.readOnly;

  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, maxWidth: 430, label: spec.alt || 'A rectangle cut into four parts' });
  const { svg } = fr;
  // One scale for every setting, so that the x-square stays the same size while the strips grow.
  const k = Math.min((W - PAD_L - PAD_R) / (X_UNITS + hi), (H - PAD_T - PAD_B) / (X_UNITS + hi));
  const xs = X_UNITS * k;
  const g = s('g');
  svg.appendChild(g);

  const line = h('div.am-line');
  if (!env.compact && (showTotal || target)) fr.el.insertBefore(line, fr.readouts);

  const getState = () => ({ a, b, sum: a + b, product: a * b });

  const label = (text, x, y, cls = 'fig-label', extra = {}) => s('text', { class: cls, x, y, 'text-anchor': 'middle', ...extra }, text);

  function draw() {
    // centred both ways, so the room to grow is shared out evenly around the rectangle
    const ox = PAD_L + (W - PAD_L - PAD_R - (X_UNITS + a) * k) / 2;
    const oy = PAD_T + (H - PAD_T - PAD_B - (X_UNITS + b) * k) / 2;
    const aw = a * k;
    const bh = b * k;
    g.replaceChildren();
    const part = (x, y, w, hh, color) => s('rect', { x, y, width: w, height: hh, fill: hue(color, 'soft'), stroke: hue(color), 'stroke-width': 2, 'stroke-linejoin': 'round' });
    // the four parts
    g.appendChild(part(ox, oy, xs, xs, 'blue'));
    if (a > 0) g.appendChild(part(ox + xs, oy, aw, xs, 'orange'));
    if (b > 0) g.appendChild(part(ox, oy + xs, xs, bh, 'violet'));
    if (a > 0 && b > 0) g.appendChild(part(ox + xs, oy + xs, aw, bh, 'green'));
    // unit lines: each strip is one x, each small square in the corner is 1
    let d = '';
    for (let i = 1; i < a; i++) d += `M${(ox + xs + i * k).toFixed(1)} ${oy}v${(xs + bh).toFixed(1)}`;
    for (let j = 1; j < b; j++) d += `M${ox} ${(oy + xs + j * k).toFixed(1)}h${(xs + aw).toFixed(1)}`;
    if (d) g.appendChild(s('path', { d, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1, opacity: 0.28 }));
    g.appendChild(s('rect', { x: ox, y: oy, width: xs + aw, height: xs + bh, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    // side lengths
    g.appendChild(label('x', ox + xs / 2, oy - 14, 'fig-label fig-math'));
    if (a > 0) g.appendChild(label(String(a), ox + xs + aw / 2, oy - 14, 'fig-label text-orange'));
    g.appendChild(label('x', ox - 18, oy + xs / 2 + 5, 'fig-label fig-math'));
    if (b > 0) g.appendChild(label(String(b), ox - 18, oy + xs + bh / 2 + 5, 'fig-label text-violet'));
    // what each part is worth
    if (showParts) {
      const sq = s('text', { class: 'fig-label-lg', x: ox + xs / 2, y: oy + xs / 2 + 7, 'text-anchor': 'middle' });
      sq.append(s('tspan', { class: 'fig-math' }, 'x'), s('tspan', { dy: -8, 'font-size': 13, 'font-weight': 600 }, '2'));
      g.appendChild(sq);
      const strip = (n, x, y) => {
        const t = s('text', { class: 'fig-label', x, y, 'text-anchor': 'middle' });
        if (n > 1) t.append(s('tspan', {}, String(n)));
        t.append(s('tspan', { class: 'fig-math' }, 'x'));
        return t;
      };
      if (a > 0) g.appendChild(strip(a, ox + xs + aw / 2, oy + xs / 2 + 5));
      if (b > 0) g.appendChild(strip(b, ox + xs / 2, oy + xs + bh / 2 + 5));
      if (a > 0 && b > 0) g.appendChild(label(String(a * b), ox + xs + aw / 2, oy + xs + bh / 2 + 5));
    }

    const sum = a + b;
    const product = a * b;
    const rows = [];
    if (target) {
      const met = sum === target[0] && product === target[1];
      rows.push(h('span', { class: `am-goal${met ? ' is-met' : ''}`, html: mdInline(`Goal: $${quadTex(target[0], target[1])}$`) }));
    }
    if (showTotal) {
      const pieces = ['x^2', a > 0 ? `\\orange{${a === 1 ? '' : a}x}` : null, b > 0 ? `\\violet{${b === 1 ? '' : b}x}` : null, product > 0 ? `\\green{${product}}` : null].filter(Boolean);
      const expanded = pieces.length > 2 ? `${pieces.join(' + ')} = ` : '';
      rows.push(h('span', { html: mdInline(`$(${side(a)})(${side(b)}) = ${expanded}${quadTex(sum, product)}$`) }));
    }
    line.replaceChildren(...rows);
    const names = ['x squared', a > 0 ? `${a} x` : null, b > 0 ? `${b} x` : null, product > 0 ? String(product) : null].filter(Boolean);
    svg.setAttribute('aria-label', `A rectangle x plus ${a} wide and x plus ${b} tall, cut into ${names.length === 1 ? 'one part' : `${names.length} parts`}: ${names.join(', ')}.`);
  }

  let aRow = null;
  let bRow = null;
  if (!isStatic) {
    const row = (name, color, value, set) => sliderRow({
      label: name, min: lo, max: hi, step: 1, value, color,
      onInput: (v) => { if (readOnly) return; set(v); play('tap'); draw(); env.onChange(getState()); },
    });
    aRow = row('across: $x\\,+$', 'orange', a, (v) => { a = v; });
    bRow = row('down: $x\\,+$', 'violet', b, (v) => { b = v; });
    fr.controls.append(aRow.el, bRow.el);
  }
  draw();

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.a != null) { a = clamp(Math.round(next.a), lo, hi); if (aRow) aRow.set(a); }
      if (next.b != null) { b = clamp(Math.round(next.b), lo, hi); if (bRow) bRow.set(b); }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (aRow) aRow.setDisabled(readOnly);
      if (bRow) bRow.setDisabled(readOnly);
    },
  };
}

export const examples = [
  { title: 'Multiply two brackets', spec: { type: 'area-model', a: 2, b: 3 } },
  { title: 'Factor towards a goal', spec: { type: 'area-model', a: 1, b: 1, target: [7, 12] } },
  { title: 'A square: (x + 3)²', spec: { type: 'area-model', a: 3, b: 3, static: true } },
];
