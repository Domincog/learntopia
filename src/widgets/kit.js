/**
 * Widget toolkit: the shared building blocks for interactive figures.
 * Using these keeps widgets visually consistent, theme-aware, touch-friendly
 * and keyboard-accessible without each one re-inventing the basics.
 *
 *   frame()      standard container: SVG canvas + readouts + controls
 *   plane()      maths-coordinates <-> SVG-pixels mapping
 *   drawAxes()   grid, axes and tick labels for a plane
 *   handle()     a draggable (and arrow-key movable) point
 *   sliderRow()  labelled slider with a live value
 *   readout()    labelled live number
 *   button()     small button for widget controls
 *   loop()       requestAnimationFrame loop with dt
 *   fnPath()     SVG path for y = f(x), breaking at discontinuities
 *   hue()        CSS variable for a palette colour
 *   addStyles()  attach widget-specific CSS from inside the widget module
 *
 * Colours: always pass palette names ('blue', 'orange', …) and resolve them
 * with hue(); never hard-code hex values — themes depend on it.
 */
import { h, s, cx, clamp } from '../core/dom.js';
import { formatNumber } from '../core/mathexpr.js';
import { mdInline, mdText } from '../core/markdown.js';
import { icon } from '../ui/icon.js';

export { h, s, cx, clamp, formatNumber, mdInline, icon };

export const HUES = ['blue', 'red', 'green', 'orange', 'violet', 'teal', 'pink', 'yellow', 'gray'];

/**
 * CSS colour for a palette name.
 *   hue('blue')          vivid   -> var(--blue)
 *   hue('blue', 'soft')  tint    -> var(--blue-soft)
 *   hue('blue', 'text')  legible -> var(--blue-text)
 * Also accepts 'ink', 'ink-2', 'ink-3', 'surface', 'paper', 'hair'.
 */
export function hue(name = 'blue', kind = '') {
  if (!HUES.includes(name)) return `var(--${name})`;
  return `var(--${name}${kind ? '-' + kind : ''})`;
}

/**
 * Standard widget container.
 * @returns {{ el, svg, canvas, controls, readouts, buttons, width, height }}
 *   Append SVG content to `svg`, sliders to `controls`, readouts to
 *   `readouts`, action buttons to `buttons`. Empty areas collapse.
 */
export function frame({ width = 560, height = 360, wide = false, compact = false, plain = false, label = null, maxWidth = null } = {}) {
  const svg = s('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': label });
  const canvas = h('div', { class: cx('w-canvas', plain && 'is-plain') }, svg);
  const readouts = h('div.w-readouts');
  const controls = h('div.w-controls');
  const buttons = h('div.w-buttons');
  const el = h('div', { class: cx('w-frame', wide && 'is-wide', compact && 'is-compact', !compact && 'w-fit') }, canvas, readouts, controls, buttons);
  // The stylesheet uses the drawing's proportions to keep it inside the height of the screen.
  el.style.setProperty('--w-aspect', String(Math.round((width / height) * 1000) / 1000));
  if (maxWidth) el.style.setProperty('--w-max', typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth);
  return { el, svg, canvas, controls, readouts, buttons, width, height };
}

/**
 * Coordinate system: maps maths coordinates to SVG pixels and back.
 *   const pl = plane({ x: [-5, 5], y: [-2, 8], width: 560, height: 360 });
 *   pl.sx(2), pl.sy(3)   -> pixel position of the point (2, 3)
 *   pl.ux(px), pl.uy(py) -> maths coordinates of a pixel
 */
export function plane({ x = [-5, 5], y = [-5, 5], width = 560, height = 360, pad = {} } = {}) {
  const p = { l: 40, r: 16, t: 16, b: 34, ...pad };
  const [x0, x1] = x;
  const [y0, y1] = y;
  const iw = width - p.l - p.r;
  const ih = height - p.t - p.b;
  return {
    x0, x1, y0, y1, width, height, pad: p, iw, ih,
    sx: (v) => p.l + ((v - x0) / (x1 - x0)) * iw,
    sy: (v) => p.t + (1 - (v - y0) / (y1 - y0)) * ih,
    ux: (px) => x0 + ((px - p.l) / iw) * (x1 - x0),
    uy: (py) => y0 + (1 - (py - p.t) / ih) * (y1 - y0),
    /** pixels per unit */
    kx: iw / (x1 - x0),
    ky: ih / (y1 - y0),
    left: p.l, right: width - p.r, top: p.t, bottom: height - p.b,
  };
}

/** A "nice" step (1, 2, 5 × 10^k) giving roughly `target` divisions of `span`. */
export function niceStep(span, target = 8) {
  const raw = Math.abs(span) / target;
  if (!(raw > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * pow;
}

/** Multiples of `step` within [lo, hi]. */
export function ticks(lo, hi, step) {
  const out = [];
  const start = Math.ceil(lo / step - 1e-9);
  const end = Math.floor(hi / step + 1e-9);
  for (let i = start; i <= end; i++) out.push(Math.round(i * step * 1e9) / 1e9);
  return out;
}

const tickText = (v) => formatNumber(v, 6);

/**
 * Grid lines, axes and tick labels for a plane. Returns an SVG <g>.
 * Axes sit at 0 when 0 is in range, otherwise on the left/bottom edge.
 * @param {object} [o] { grid, axes, labels, xStep, yStep, xLabel, yLabel, xFormat, yFormat, box }
 */
export function drawAxes(pl, o = {}) {
  const { grid = true, axes = true, labels = true, box = false } = o;
  const xStep = o.xStep || niceStep(pl.x1 - pl.x0, pl.iw / 55);
  const yStep = o.yStep || niceStep(pl.y1 - pl.y0, pl.ih / 45);
  const xf = o.xFormat || tickText;
  const yf = o.yFormat || tickText;
  const g = s('g.w-axes');
  const axisY = pl.y0 <= 0 && pl.y1 >= 0 ? pl.sy(0) : pl.bottom; // where the x-axis is drawn
  const axisX = pl.x0 <= 0 && pl.x1 >= 0 ? pl.sx(0) : pl.left;   // where the y-axis is drawn
  const xs = ticks(pl.x0, pl.x1, xStep);
  const ys = ticks(pl.y0, pl.y1, yStep);

  if (grid) {
    for (const v of xs) g.appendChild(s('line.grid-line', { x1: pl.sx(v), x2: pl.sx(v), y1: pl.top, y2: pl.bottom }));
    for (const v of ys) g.appendChild(s('line.grid-line', { y1: pl.sy(v), y2: pl.sy(v), x1: pl.left, x2: pl.right }));
  }
  if (box) g.appendChild(s('rect', { x: pl.left, y: pl.top, width: pl.iw, height: pl.ih, fill: 'none', class: 'grid-line' }));
  if (axes) {
    g.appendChild(s('line.axis-line', { x1: pl.left, x2: pl.right, y1: axisY, y2: axisY }));
    g.appendChild(s('line.axis-line', { y1: pl.top, y2: pl.bottom, x1: axisX, x2: axisX }));
  }
  if (labels) {
    const xOnEdge = axisY > pl.bottom - 1;
    for (const v of o.xTicks === false ? [] : xs) {
      if (Math.abs(v) < 1e-12 && !xOnEdge && axisX > pl.left + 1) continue; // origin label is drawn once, by the y loop
      g.appendChild(s('text.tick-label', { x: pl.sx(v), y: Math.min(axisY + 16, pl.height - 6), 'text-anchor': 'middle' }, xf(v)));
    }
    for (const v of o.yTicks === false ? [] : ys) {
      const atOrigin = Math.abs(v) < 1e-12 && axisX > pl.left + 1;
      if (atOrigin && xOnEdge && o.xTicks !== false) continue; // the x loop has already written this 0, right beside it
      g.appendChild(s('text.tick-label', {
        x: Math.max(axisX - 7, 12), y: pl.sy(v) + (atOrigin ? 15 : 4), 'text-anchor': 'end',
      }, yf(v)));
    }
    if (o.xLabel) g.appendChild(s('text.axis-label', { x: pl.right, y: axisY - 8, 'text-anchor': 'end' }, o.xLabel));
    if (o.yLabel) g.appendChild(s('text.axis-label', { x: axisX + 8, y: pl.top + 10, 'text-anchor': 'start' }, o.yLabel));
  }
  return g;
}

/** Convert a pointer event to SVG user-space coordinates. */
export function svgPoint(svg, ev) {
  const m = svg.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX;
  pt.y = ev.clientY;
  const out = pt.matrixTransform(m.inverse());
  return { x: out.x, y: out.y };
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * A draggable point. The *owner* decides where it may go:
 *
 *   const hd = handle(svg, {
 *     x: 100, y: 80, color: 'orange', label: 'Point P',
 *     onMove(x, y) {            // requested position in SVG pixels
 *       model.p = snap(x, y);   // update your model, constrain as you like
 *       render();               // …and call hd.set(px, py) from render()
 *     },
 *     onEnd() {},
 *   });
 *   parent.appendChild(hd.el);
 *
 * Arrow keys move it by `keyStep` pixels (Shift = ×5), so every draggable
 * thing is also usable from the keyboard.
 */
export function handle(svg, opts) {
  const { r = 10, color = 'blue', label = 'Draggable point', keyStep = 10, onMove = () => {}, onEnd = () => {}, shape = 'circle' } = opts;
  let x = opts.x || 0;
  let y = opts.y || 0;
  let enabled = true;
  let drag = null;

  const dot = shape === 'square'
    ? s('rect.w-handle-dot', { x: -r, y: -r, width: 2 * r, height: 2 * r, rx: 3, fill: hue(color), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 })
    : s('circle.w-handle-dot', { r, fill: hue(color), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 });
  const g = s('g.w-handle', { tabindex: '0', role: 'slider', 'aria-label': label, 'aria-valuemin': 0, 'aria-valuemax': 100 },
    s('circle.w-handle-halo', { r: r + 13, fill: hue(color) }),
    s('circle', { r: Math.max(r + 12, 22), fill: 'transparent' }), // generous touch target
    dot,
  );
  // A handle makes its SVG interactive, so the SVG can no longer be a plain picture.
  if (svg.getAttribute('role') === 'img') svg.setAttribute('role', 'group');
  let ownText = null; // set by the owner through setLabel(); otherwise we describe the position
  const place = () => {
    g.setAttribute('transform', `translate(${x} ${y})`);
    const box = svg.viewBox && svg.viewBox.baseVal;
    const w = (box && box.width) || 100;
    const ht = (box && box.height) || 100;
    const across = Math.round(clamp01(x / w) * 100);
    const up = Math.round(clamp01(1 - y / ht) * 100);
    g.setAttribute('aria-valuenow', across);
    g.setAttribute('aria-valuetext', ownText != null ? ownText : `${across}% across, ${up}% up`);
  };
  place();

  const down = (ev) => {
    if (!enabled || ev.button > 0) return;
    const p = svgPoint(svg, ev);
    drag = { id: ev.pointerId, ox: x - p.x, oy: y - p.y };
    g.classList.add('is-dragging');
    try { g.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
    ev.preventDefault();
  };
  const move = (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    const p = svgPoint(svg, ev);
    onMove(p.x + drag.ox, p.y + drag.oy, ev);
    ev.preventDefault();
  };
  const up = (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    drag = null;
    g.classList.remove('is-dragging');
    try { g.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
    onEnd();
  };
  const key = (ev) => {
    if (!enabled) return;
    const step = keyStep * (ev.shiftKey ? 5 : 1);
    let dx = 0;
    let dy = 0;
    if (ev.key === 'ArrowLeft') dx = -step;
    else if (ev.key === 'ArrowRight') dx = step;
    else if (ev.key === 'ArrowUp') dy = -step;
    else if (ev.key === 'ArrowDown') dy = step;
    else return;
    ev.preventDefault();
    ev.stopPropagation();
    onMove(x + dx, y + dy, ev);
    onEnd();
  };
  g.addEventListener('pointerdown', down);
  g.addEventListener('pointermove', move);
  g.addEventListener('pointerup', up);
  g.addEventListener('pointercancel', up);
  g.addEventListener('keydown', key);
  g.dataset.keys = 'own';

  return {
    el: g,
    set(nx, ny) { x = nx; y = ny; place(); },
    get: () => ({ x, y }),
    /** What a screen reader says for the current position, e.g. "(2, 3)" or "day 12". */
    setLabel(text) { ownText = text == null ? null : String(text); place(); },
    setEnabled(v) { enabled = !!v; g.setAttribute('tabindex', enabled ? '0' : '-1'); g.style.pointerEvents = enabled ? '' : 'none'; },
    setColor(c) { dot.setAttribute('fill', hue(c)); },
    destroy() {
      g.removeEventListener('pointerdown', down);
      g.removeEventListener('pointermove', move);
      g.removeEventListener('pointerup', up);
      g.removeEventListener('pointercancel', up);
      g.removeEventListener('keydown', key);
    },
  };
}

/** Units like ° and % hug the number; words get a space. */
const unitSuffix = (unit) => (!unit ? '' : /^[°%′″]/.test(unit) ? unit : ` ${unit}`);

/**
 * Labelled slider row.
 *   const row = sliderRow({ label: 'slope $m$', min: -3, max: 3, step: 0.5, value: 1, color: 'blue', onInput: (v) => … });
 *   controls.appendChild(row.el);  row.set(2);  row.value
 */
export function sliderRow({ label = '', min = 0, max = 10, step = 1, value = 0, color = 'blue', digits = null, format = null, unit = '', onInput = () => {} }) {
  const d = digits != null ? digits : Math.max(0, (String(step).split('.')[1] || '').length);
  const fmt = format || ((v) => formatNumber(v, d) + unitSuffix(unit));
  const input = h('input.range', { type: 'range', min, max, step, value, 'aria-label': mdText(label) || 'Slider' });
  input.dataset.keys = 'own';
  const val = h('span.w-slider-value');
  const el = h('label', { class: `w-slider hue-${color}` }, h('span.w-slider-label', { html: mdInline(label) }), input, val);
  const paint = () => {
    const v = Number(input.value);
    input.style.setProperty('--fill', `${((v - min) / (max - min)) * 100}%`);
    val.textContent = fmt(v);
  };
  input.addEventListener('input', () => { paint(); onInput(Number(input.value)); });
  paint();
  return {
    el,
    input,
    get value() { return Number(input.value); },
    set(v) { input.value = v; paint(); },
    setDisabled(v) { input.disabled = !!v; },
  };
}

/**
 * Live readout pill: `const ro = readout('slope'); ro.set(1.5);`
 * `set` accepts a number (formatted to `digits`) or a string.
 */
export function readout(label, { digits = 2, color = null, unit = '' } = {}) {
  const value = h('b');
  const el = h('span', { class: cx('w-readout', color && `hue-${color}`) }, h('span', { html: mdInline(label) }), value);
  if (color) value.style.color = hue(color, 'text');
  return {
    el,
    set(v) { value.textContent = (typeof v === 'number' ? formatNumber(v, digits) : String(v)) + unitSuffix(unit); },
  };
}

/** Small control button: button('Roll', onClick, { icon: 'dice', variant: 'primary' }) */
export function button(text, onClick, { icon: ic = null, variant = '', title = null } = {}) {
  const el = h('button', { type: 'button', class: cx('btn btn-sm', variant && `btn-${variant}`), title }, ic ? icon(ic, 16) : null, text);
  el.addEventListener('click', (ev) => { ev.preventDefault(); onClick(ev); });
  return el;
}

/**
 * Animation loop. `fn(dt, t)` gets seconds since the last frame (capped) and
 * total seconds. Always stop it in your widget's destroy().
 */
export function loop(fn) {
  let id = 0;
  let last = 0;
  let total = 0;
  let running = false;
  const tick = (now) => {
    if (!running) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    total += dt;
    fn(dt, total);
    if (running) id = requestAnimationFrame(tick);
  };
  return {
    start() { if (running) return; running = true; last = 0; id = requestAnimationFrame(tick); },
    stop() { running = false; cancelAnimationFrame(id); },
    reset() { total = 0; },
    get running() { return running; },
  };
}

/**
 * SVG path data for y = f(x) across a plane. Breaks the path where f is
 * undefined or jumps (asymptotes) instead of drawing a false vertical line.
 */
export function fnPath(f, pl, { from = pl.x0, to = pl.x1, samples = 280 } = {}) {
  const a = Math.max(from, pl.x0);
  const b = Math.min(to, pl.x1);
  if (!(b > a)) return '';
  const span = pl.y1 - pl.y0;
  const lo = pl.y0 - span * 2;
  const hi = pl.y1 + span * 2;
  let d = '';
  let pen = false;
  let prevY = null;
  for (let i = 0; i <= samples; i++) {
    const x = a + ((b - a) * i) / samples;
    let y;
    try { y = f(x); } catch { y = NaN; }
    if (!Number.isFinite(y)) { pen = false; prevY = null; continue; }
    if (prevY !== null && Math.abs(y - prevY) > span * 3) pen = false; // likely an asymptote
    const yc = clamp(y, lo, hi);
    d += `${pen ? 'L' : 'M'}${pl.sx(x).toFixed(2)} ${pl.sy(yc).toFixed(2)}`;
    pen = true;
    prevY = y;
  }
  return d;
}

/** Add a <clipPath> for the plot area of a plane; returns the url(#…) reference. */
let clipSeq = 0;
export function clipTo(svg, pl) {
  const id = `w-clip-${++clipSeq}`;
  let defs = svg.querySelector('defs');
  if (!defs) { defs = s('defs'); svg.insertBefore(defs, svg.firstChild); }
  defs.appendChild(s('clipPath', { id }, s('rect', { x: pl.left, y: pl.top, width: pl.iw, height: pl.ih })));
  return `url(#${id})`;
}

/** Add an arrowhead marker in a palette colour; returns the url(#…) reference. */
export function arrowMarker(svg, color = 'ink', size = 7) {
  const id = `w-arrow-${++clipSeq}`;
  let defs = svg.querySelector('defs');
  if (!defs) { defs = s('defs'); svg.insertBefore(defs, svg.firstChild); }
  defs.appendChild(s('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: size, markerHeight: size, orient: 'auto-start-reverse' },
    s('path', { d: 'M0 0 L10 5 L0 10 Z', fill: hue(color) })));
  return `url(#${id})`;
}

/**
 * Add a widget's own CSS to the page (once). Keeps a widget self-contained
 * in a single file:
 *
 *   addStyles('my-widget', `
 *     .widget-my-widget .token { border: var(--bw) solid var(--edge); }
 *   `);
 *
 * Prefix every selector with your widget's root class (.widget-<type> is
 * added to the root element automatically) and use the design tokens
 * (var(--…)), never raw colours, so the widget follows light and dark themes.
 */
const injected = new Set();
export function addStyles(id, css) {
  if (injected.has(id) || typeof document === 'undefined') return;
  injected.add(id);
  const el = document.createElement('style');
  el.dataset.widget = id;
  el.textContent = css;
  document.head.appendChild(el);
}

/** Snap a value to a grid step (no-op when step is falsy). */
export const snapTo = (v, step) => (step ? Math.round(v / step) * step : v);

/** Round away floating-point fuzz. */
export const tidy = (v, places = 6) => { const p = Math.pow(10, places); const r = Math.round(v * p) / p; return Object.is(r, -0) ? 0 : r; };
