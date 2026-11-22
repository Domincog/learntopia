/**
 * power-factors — powers written out in full, so that the rules for exponents
 * can be read off a picture instead of being memorised. Every tile is one
 * factor. Three pictures, chosen with `op`:
 *
 *   'times'  xᵐ · xⁿ      two groups of tiles in one row: count them all (m + n)
 *   'over'   xᵐ / xⁿ      a fraction: each tile below cancels one above (m − n).
 *                         With equal rows everything cancels (x⁰ = 1); with more
 *                         below than above, tiles are left under the bar (x⁻ᵏ = 1/xᵏ)
 *   'power'  (xᵐ)ⁿ        n groups of m tiles (m × n)
 *
 * {
 *   type: 'power-factors',
 *   op: 'times',
 *   m: 3, n: 4,            // the two exponents
 *   mRange: [1, 6],        // slider ranges (for 'power' the defaults are [1, 4] and [1, 3])
 *   nRange: [1, 6],
 *   base: 'x',             // the letter or number on every tile
 *   rule: true,            // the working line under the picture: true shows the rule at work (x³ · x⁴ = x³⁺⁴ = x⁷),
 *                          // 'short' only the two ends (x³ · x⁴ = x⁷), false no line at all
 *   static: false,         // true: picture only, no sliders
 * }
 *
 * State: { op, m, n, exponent, top, bottom, cancelled }
 *   exponent   what the rule gives: m + n, m − n or m × n
 *   top        tiles left above the bar after cancelling (for 'times' and 'power': all the tiles)
 *   bottom     tiles left below the bar after cancelling ('over' only, otherwise 0)
 *   cancelled  pairs struck out ('over' only, otherwise 0)
 *
 * setState accepts { m, n }.
 */
import { frame, sliderRow, hue, s, h, clamp, mdInline, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('power-factors', `
  .widget-power-factors .pf-line { display: grid; gap: 4px; justify-items: center; text-align: center; min-height: 3.6em; align-content: center; font-size: var(--fs-md); }
  .widget-power-factors .pf-line small { color: var(--ink-2); font-size: var(--fs-sm); font-weight: 700; }
`);

const W = 460;

export default function create(spec, env) {
  const op = ['times', 'over', 'power'].includes(spec.op) ? spec.op : 'times';
  const base = String(spec.base != null ? spec.base : 'x');
  const isLetter = /^[a-zA-Z]$/.test(base);
  const isStatic = !!spec.static || env.compact;
  const defaults = op === 'power' ? [[1, 4], [1, 3]] : [[1, 6], [1, 6]];
  const range = (r, d) => (Array.isArray(r) ? [Math.max(0, Math.round(r[0])), Math.round(r[1])] : d);
  const [mLo, mHi] = range(spec.mRange, defaults[0]);
  const [nLo, nHi] = range(spec.nRange, defaults[1]);
  let m = clamp(Math.round(spec.m != null ? spec.m : 3), mLo, mHi);
  let n = clamp(Math.round(spec.n != null ? spec.n : 2), nLo, nHi);
  let readOnly = !!env.readOnly;

  const H = op === 'over' ? 134 : 140;
  const fr = frame({ width: W, height: H, plain: true, compact: env.compact, label: spec.alt || 'Powers written out as factors' });
  const { svg } = fr;
  const g = s('g');
  svg.appendChild(g);
  const line = h('div.pf-line', { 'aria-live': 'polite' });
  if (!env.compact && spec.rule !== false) fr.el.insertBefore(line, fr.readouts);

  function getState() {
    if (op === 'times') return { op, m, n, exponent: m + n, top: m + n, bottom: 0, cancelled: 0 };
    if (op === 'power') return { op, m, n, exponent: m * n, top: m * n, bottom: 0, cancelled: 0 };
    const cancelled = Math.min(m, n);
    return { op, m, n, exponent: m - n, top: m - cancelled, bottom: n - cancelled, cancelled };
  }

  /* ---------------------------------------------------------------- drawing */
  function tile(x, y, size, color, struck) {
    const out = s('g', struck ? { opacity: 0.45 } : null);
    out.appendChild(s('rect', { x, y, width: size, height: size, rx: 8, fill: hue(color, 'soft'), stroke: hue(color), 'stroke-width': 2.5 }));
    const letter = Math.round(size * (isLetter ? 0.6 : 0.46));
    out.appendChild(s('text', { class: isLetter ? 'fig-label-lg fig-math' : 'fig-label-lg', x: x + size / 2, y: y + size / 2 + letter * 0.3, 'text-anchor': 'middle', style: `font-size:${letter}px` }, base));
    const wrap = s('g');
    wrap.appendChild(out);
    if (struck) wrap.appendChild(s('line', { x1: x + 5, y1: y + size - 5, x2: x + size - 5, y2: y + 5, stroke: hue('red'), 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
    return wrap;
  }
  /** A square bracket lying under a run of tiles, with a caption below it. */
  function under(x1, x2, y, parts, color) {
    const out = s('g');
    out.appendChild(s('path', { d: `M${x1} ${y} v6 H${x2} v-6`, fill: 'none', stroke: color ? hue(color) : 'var(--ink-2)', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    const t = s('text', { class: 'fig-label', x: (x1 + x2) / 2, y: y + 27, 'text-anchor': 'middle', style: color ? `fill:${hue(color, 'text')}` : null });
    for (const p of parts) t.appendChild(typeof p === 'string' ? s('tspan', {}, p) : p);
    out.appendChild(t);
    return out;
  }
  /** "x³" as text pieces for an SVG label. */
  const powerParts = (k) => [s('tspan', isLetter ? { class: 'fig-math', 'font-size': 21 } : {}, base), s('tspan', { dy: -8, 'font-size': 13, 'font-weight': 600 }, String(k)), s('tspan', { dy: 8 }, '')];

  function drawRow(groups) {
    // groups: [{ count, color }] laid out in one row with a dot between them
    const total = groups.reduce((t, gr) => t + gr.count, 0);
    const gap = 5;
    const dot = 20;
    // tiles are as large as the row allows, up to a comfortable size
    const T = Math.min(46, Math.floor((W - 16 - (groups.length - 1) * dot - Math.max(0, total - groups.length) * gap) / Math.max(total, 1)));
    const width = total * T + Math.max(0, total - groups.length) * gap + (groups.length - 1) * dot;
    let x = (W - width) / 2;
    const y = 8;
    const first = x;
    groups.forEach((gr, i) => {
      const start = x;
      for (let k = 0; k < gr.count; k++) { g.appendChild(tile(x, y, T, gr.color)); x += T + (k < gr.count - 1 ? gap : 0); }
      g.appendChild(under(start + 2, x - 2, y + T + 6, powerParts(gr.count), gr.color));
      if (i < groups.length - 1) { g.appendChild(s('circle', { cx: x + dot / 2, cy: y + T / 2, r: 3.2, fill: 'var(--ink)' })); x += dot; }
    });
    g.appendChild(under(first + 2, x - 2, y + T + 46, [`${total} ${total === 1 ? 'factor' : 'factors'} in all`]));
  }

  function drawFraction() {
    const gap = 7;
    const longest = Math.max(m, n, 1);
    const T = Math.min(46, Math.floor((W - 36 - (longest - 1) * gap) / longest));
    const width = longest * T + (longest - 1) * gap;
    const x0 = (W - width) / 2;
    const yTop = 8;
    const yBar = yTop + T + 11;
    const yBot = yBar + 11;
    const cancelled = Math.min(m, n);
    const row = (count, y, color) => {
      if (count === 0) { g.appendChild(s('text', { class: 'fig-label-lg', x: x0 + T / 2, y: y + T / 2 + 7, 'text-anchor': 'middle' }, '1')); return; }
      for (let k = 0; k < count; k++) g.appendChild(tile(x0 + k * (T + gap), y, T, color, k < cancelled));
    };
    row(m, yTop, 'blue');
    g.appendChild(s('line', { x1: x0 - 10, x2: x0 + width + 10, y1: yBar, y2: yBar, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' }));
    row(n, yBot, 'orange');
  }

  const P = (k) => `${base}^{${k}}`;
  const short = spec.rule === 'short';
  function describe() {
    const st = getState();
    if (op === 'times') {
      line.replaceChildren(h('span', { html: mdInline(`$\\blue{${P(m)}} \\cdot \\orange{${P(n)}} = ${short ? '' : `${base}^{\\blue{${m}} + \\orange{${n}}} = `}${P(m + n)}$`) }));
      svg.setAttribute('aria-label', `${m} factors of ${base}, times ${n} factors of ${base}: ${m + n} factors in all.`);
    } else if (op === 'power') {
      line.replaceChildren(h('span', { html: mdInline(`$(${P(m)})^{${n}} = ${short ? '' : `${base}^{${m} \\times ${n}} = `}${P(m * n)}$`) }));
      svg.setAttribute('aria-label', `${n} ${n === 1 ? 'group' : 'groups'} of ${m} ${m === 1 ? 'factor' : 'factors'} of ${base}: ${m * n} factors in all.`);
    } else {
      const left = st.top > 0 ? (st.top === 1 ? base : P(st.top)) : st.bottom === 0 ? '1' : `\\dfrac{1}{${st.bottom === 1 ? base : P(st.bottom)}}`;
      if (short) line.replaceChildren(h('span', { html: mdInline(`$\\dfrac{\\blue{${P(m)}}}{\\orange{${P(n)}}} = ${left}$`) }));
      else line.replaceChildren(
        h('span', { html: mdInline(`$\\dfrac{\\blue{${P(m)}}}{\\orange{${P(n)}}} = ${base}^{\\blue{${m}} - \\orange{${n}}} = ${P(m - n)}$`) }),
        h('small', { html: mdInline(`left after cancelling: $\\;${left}$`) }),
      );
      const rest = st.top > 0 ? `${st.top} left on top` : st.bottom > 0 ? `${st.bottom} left below the bar` : 'nothing left: the fraction is 1';
      svg.setAttribute('aria-label', `A fraction with ${m} factors of ${base} on top and ${n} below. ${st.cancelled} ${st.cancelled === 1 ? 'pair cancels' : 'pairs cancel'}, ${rest}.`);
    }
  }

  function draw() {
    g.replaceChildren();
    if (op === 'times') drawRow([{ count: m, color: 'blue' }, { count: n, color: 'orange' }]);
    else if (op === 'power') drawRow(Array.from({ length: n }, (_, i) => ({ count: m, color: i % 2 ? 'orange' : 'blue' })));
    else drawFraction();
    describe();
  }

  /* --------------------------------------------------------------- controls */
  let mRow = null;
  let nRow = null;
  if (!isStatic) {
    const names = op === 'times' ? ['first power', 'second power'] : op === 'over' ? ['on top', 'below'] : ['in each group', 'groups'];
    const row = (label, lo, hi, value, color, set) => sliderRow({
      label, min: lo, max: hi, step: 1, value, color,
      onInput: (v) => { if (readOnly) return; set(v); play('tap'); draw(); env.onChange(getState()); },
    });
    mRow = row(names[0], mLo, mHi, m, 'blue', (v) => { m = v; });
    nRow = row(names[1], nLo, nHi, n, 'orange', (v) => { n = v; });
    fr.controls.append(mRow.el, nRow.el);
  }
  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.m != null) { m = clamp(Math.round(next.m), mLo, mHi); if (mRow) mRow.set(m); }
      if (next.n != null) { n = clamp(Math.round(next.n), nLo, nHi); if (nRow) nRow.set(n); }
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (mRow) mRow.setDisabled(readOnly);
      if (nRow) nRow.setDisabled(readOnly);
    },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'power-factors — multiplying powers', spec: { type: 'power-factors', op: 'times', m: 3, n: 4 } },
  { title: 'power-factors — dividing powers', spec: { type: 'power-factors', op: 'over', m: 5, n: 2, mRange: [0, 6], nRange: [1, 6] } },
  { title: 'power-factors — a power of a power', spec: { type: 'power-factors', op: 'power', m: 2, n: 3 } },
];
