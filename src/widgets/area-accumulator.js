/**
 * area-accumulator — sweep a boundary along a curve and watch the area pile up.
 * The top panel shows a curve f with the area under it shaded from a fixed
 * start up to a movable x. The bottom panel plots that running total, A(x).
 * The height of f at x (orange bar, top) and the slope of A at x (orange
 * tangent, bottom) are shown side by side: they are always the same number —
 * the fundamental theorem of calculus, in a picture.
 *
 * {
 *   type: 'area-accumulator',
 *   fn: '0.5x + 1',            // the curve f, an expression in x
 *   x: [0, 6], y: [0, 5],      // window of the top panel
 *   ay: [0, 16],               // range of the bottom panel (automatic if omitted)
 *   xStep: 1, yStep: 1, ayStep: 4,   // tick spacing (automatic if omitted)
 *   from: 0,                   // the area is measured from here (default: left edge)
 *   start: 1,                  // where the boundary starts
 *   snap: 0.5,                 // the boundary snaps to multiples of this (0: smooth)
 *   labels: { f: 'speed (m/s)', A: 'distance so far (m)' },          // panel titles
 *   words: { area: 'area so far', height: 'height of f', slope: 'slope of A',     // readout names
 *            heightTag: 'height', slopeTag: 'slope' },                            // short tags drawn in the figure
 *   digits: 2,                 // decimals shown in the readouts
 *   tangent: true,             // draw the tangent to A and show its slope
 *   slice: 0.25,               // also outline the next thin slice of this width (0: none)
 *   reveal: false,             // true: show the whole of A from the start
 *   static: false,             // true: picture only, nothing to drag
 * }
 *
 * State: { x, area, height, slope, reached, coverage, done }
 *   x        — where the boundary is
 *   area     — the area under f from `from` to x (parts below the axis count as negative)
 *   height   — f(x)
 *   slope    — the slope of A at x, measured numerically from A itself
 *   reached  — the furthest right the boundary has been
 *   coverage — fraction (0–1) of the range swept so far; done — coverage ≥ 0.95
 * setState also accepts { swept: true } to mark the whole range as swept.
 */
import { frame, plane, drawAxes, handle, readout, fnPath, svgPoint, niceStep, hue, s, clamp, snapTo, tidy, formatNumber, addStyles } from './kit.js';
import { compile } from '../core/mathexpr.js';

addStyles('area-accumulator', `
  .widget-area-accumulator .aa-hit { cursor: ew-resize; }
  .widget-area-accumulator.is-readonly .aa-hit { cursor: default; }
`);

const W = 560;
const H = 498;
const TOP = { t: 26, b: 240 };
const BOT = { t: 290, b: 474 };
const PAD_L = 46;
const PAD_R = 16;
const GRID = 1200;

let clipSeq = 0;

export default function create(spec, env) {
  const [x0, x1] = spec.x || [0, 6];
  const yRange = spec.y || [0, 5];
  const from = spec.from != null ? spec.from : x0;
  const f = compile(spec.fn || '0.5x + 1', { vars: ['x'] });
  const fy = (x) => { try { return f({ x }); } catch { return NaN; } };
  const snap = spec.snap || 0;
  const isStatic = !!spec.static || !!env.compact;
  const labels = { f: 'the curve f', A: 'area so far, A', ...(spec.labels || {}) };
  const words = { area: 'area so far', height: 'height of $f$', slope: 'slope of $A$', heightTag: 'height', slopeTag: 'slope', ...(spec.words || {}) };
  const showTangent = spec.tangent !== false;
  const digits = spec.digits != null ? spec.digits : 2;
  const sliceW = spec.slice || 0;
  let readOnly = !!env.readOnly;

  /* ------------------------------------------------------- the integral */
  /** Area under f from p to q (Simpson's rule). */
  const integral = (p, q, n = 200) => {
    if (p === q) return 0;
    const step = (q - p) / n;
    let sum = fy(p) + fy(q);
    for (let k = 1; k < n; k++) sum += fy(p + k * step) * (k % 2 ? 4 : 2);
    return (sum * step) / 3;
  };
  // running total on a fine grid, for drawing A
  const gx = (i) => from + ((x1 - from) * i) / GRID;
  const cum = new Float64Array(GRID + 1);
  for (let i = 1; i <= GRID; i++) {
    const p = gx(i - 1);
    const q = gx(i);
    cum[i] = cum[i - 1] + ((q - p) / 6) * (fy(p) + 4 * fy((p + q) / 2) + fy(q));
  }
  const area = (v) => integral(from, v);
  const delta = (x1 - x0) / 400;
  const slopeOfA = (v) => (area(v + delta) - area(v - delta)) / (2 * delta);

  let ayRange = spec.ay;
  if (!ayRange) {
    let lo = 0;
    let hi = 0;
    for (let i = 0; i <= GRID; i++) { lo = Math.min(lo, cum[i]); hi = Math.max(hi, cum[i]); }
    const step = niceStep(hi - lo || 1, 4);
    ayRange = [lo < 0 ? Math.floor(lo / step - 0.1) * step : 0, Math.ceil(hi / step + 0.1) * step];
  }

  /* ------------------------------------------------------------- model */
  const fit = (v) => tidy(clamp(snap ? snapTo(v, snap) : v, from, x1));
  let x = fit(spec.start != null ? spec.start : from + (x1 - from) * 0.25);
  let reached = spec.reveal ? x1 : x;

  /* ------------------------------------------------------------ layers */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A curve with the area under it, and a graph of the running total' });
  const { svg } = fr;
  const top = plane({ x: [x0, x1], y: yRange, width: W, height: H, pad: { l: PAD_L, r: PAD_R, t: TOP.t, b: H - TOP.b } });
  const bot = plane({ x: [x0, x1], y: ayRange, width: W, height: H, pad: { l: PAD_L, r: PAD_R, t: BOT.t, b: H - BOT.b } });
  const defs = s('defs');
  const clipTop = `aa-clip-${++clipSeq}`;
  const clipBot = `aa-clip-${++clipSeq}`;
  defs.append(
    s('clipPath', { id: clipTop }, s('rect', { x: top.left, y: top.top, width: top.iw, height: top.ih })),
    s('clipPath', { id: clipBot }, s('rect', { x: bot.left, y: bot.top, width: bot.iw, height: bot.ih })),
  );
  svg.appendChild(defs);

  const gArea = s('g', { 'clip-path': `url(#${clipTop})`, 'pointer-events': 'none' });
  const areaPos = s('path', { fill: hue('green', 'soft'), stroke: 'none' });
  const areaNeg = s('path', { fill: hue('red', 'soft'), stroke: 'none' });
  const slice = s('rect', { fill: hue('orange', 'soft'), stroke: hue('orange'), 'stroke-width': 2, 'stroke-dasharray': '5 4' });
  gArea.append(areaPos, areaNeg, slice);
  svg.appendChild(gArea);

  const xStep = spec.xStep || niceStep(x1 - x0, 6.5);
  svg.appendChild(drawAxes(top, { xStep, yStep: spec.yStep }));
  svg.appendChild(drawAxes(bot, { xStep, yStep: spec.ayStep }));
  svg.appendChild(s('text.fig-label', { x: top.left, y: TOP.t - 9, style: `fill:${hue('blue', 'text')}` }, labels.f));
  svg.appendChild(s('text.fig-label', { x: bot.left, y: BOT.t - 9, style: `fill:${hue('green', 'text')}` }, labels.A));

  const hitTop = s('rect.aa-hit', { x: top.left, y: top.top, width: top.iw, height: top.ih, fill: 'transparent' });
  const hitBot = s('rect.aa-hit', { x: bot.left, y: bot.top, width: bot.iw, height: bot.ih, fill: 'transparent' });
  const gTop = s('g', { 'clip-path': `url(#${clipTop})`, 'pointer-events': 'none' });
  const gBot = s('g', { 'clip-path': `url(#${clipBot})`, 'pointer-events': 'none' });
  const gOver = s('g', { 'pointer-events': 'none' });
  const gHandles = s('g');
  svg.append(hitTop, hitBot, gTop, gBot, gOver, gHandles);

  const curve = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', d: fnPath(fy, top) });
  const heightBar = s('line', { stroke: hue('orange'), 'stroke-width': 5, 'stroke-linecap': 'round' });
  gTop.append(curve, heightBar);

  const ghost = s('path', { fill: 'none', stroke: hue('gray'), 'stroke-width': 2.5, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' });
  const trail = s('path', { fill: 'none', stroke: hue('green'), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const totalBar = s('line', { stroke: hue('green'), 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.45 });
  const tangent = s('line', { stroke: hue('orange'), 'stroke-width': 3.5, 'stroke-linecap': 'round' });
  gBot.append(ghost, totalBar, trail, tangent);

  const guide = s('line', { stroke: 'var(--ink-3)', 'stroke-width': 1.5, 'stroke-dasharray': '3 5', 'stroke-linecap': 'round' });
  const nowDot = s('circle', { r: 7, fill: hue('green'), stroke: 'var(--edge-strong)', 'stroke-width': 2 });
  const fixedDot = isStatic ? s('circle', { r: 7, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }) : null;
  const heightTag = s('text.fig-label-sm', { style: `fill:${hue('orange', 'text')}` });
  const slopeTag = s('text.fig-label-sm', { style: `fill:${hue('orange', 'text')}` });
  gOver.append(guide, heightTag, slopeTag, nowDot);
  if (fixedDot) gOver.appendChild(fixedDot);

  /* ----------------------------------------------------------- controls */
  const roArea = readout(words.area, { digits, color: 'green' });
  const roHeight = readout(words.height, { digits, color: 'orange' });
  const roSlope = readout(words.slope, { digits, color: 'orange' });
  if (!env.compact) {
    fr.readouts.append(roArea.el, roHeight.el);
    if (showTangent) fr.readouts.appendChild(roSlope.el);
  }

  function moveTo(v) {
    if (readOnly) return;
    const next = fit(v);
    if (next === x) return;
    x = next;
    reached = Math.max(reached, x);
    render();
    env.onChange(getState());
  }

  const hd = isStatic ? null : handle(svg, {
    color: 'orange',
    label: 'Right-hand edge of the area',
    keyStep: Math.max(4, (snap || (x1 - x0) / 60) * top.kx),
    onMove: (px) => moveTo(top.ux(px)),
  });
  if (hd) gHandles.appendChild(hd.el);

  // drag or tap anywhere in either panel to move the boundary
  if (!isStatic) {
    for (const hit of [hitTop, hitBot]) {
      let active = null;
      hit.addEventListener('pointerdown', (ev) => {
        if (readOnly || ev.button > 0) return;
        active = ev.pointerId;
        try { hit.setPointerCapture(ev.pointerId); } catch { /* ignore */ }
        moveTo(top.ux(svgPoint(svg, ev).x));
        ev.preventDefault();
      });
      hit.addEventListener('pointermove', (ev) => { if (active === ev.pointerId) moveTo(top.ux(svgPoint(svg, ev).x)); });
      const end = (ev) => {
        if (active !== ev.pointerId) return;
        active = null;
        try { hit.releasePointerCapture(ev.pointerId); } catch { /* ignore */ }
      };
      hit.addEventListener('pointerup', end);
      hit.addEventListener('pointercancel', end);
    }
  }

  /* ------------------------------------------------------------- render */
  const setLine = (el, xa, ya, xb, yb) => { el.setAttribute('x1', xa); el.setAttribute('y1', ya); el.setAttribute('x2', xb); el.setAttribute('y2', yb); };
  const show = (el, on) => el.setAttribute('visibility', on ? 'visible' : 'hidden');

  /** Path for A on the grid, from the start to maths coordinate `to`. */
  function totalPath(to) {
    const last = clamp(Math.round(((to - from) / (x1 - from)) * GRID), 0, GRID);
    let d = '';
    const stride = 5;
    for (let i = 0; i <= last; i += stride) d += `${i ? 'L' : 'M'}${bot.sx(gx(i)).toFixed(2)} ${bot.sy(cum[i]).toFixed(2)}`;
    if (last % stride) d += `L${bot.sx(gx(last)).toFixed(2)} ${bot.sy(cum[last]).toFixed(2)}`;
    return last ? d : '';
  }
  ghost.setAttribute('d', totalPath(x1));
  show(ghost, !!spec.reveal);

  function render() {
    const y = fy(x);
    const a = area(x);
    const px = top.sx(x);

    // shaded area: above the axis it adds (green), below it subtracts (red)
    let pos = `M${top.sx(from)} ${top.sy(0)}`;
    let neg = pos;
    const n = Math.max(2, Math.ceil(((x - from) / (x1 - from)) * 160));
    for (let k = 0; k <= n; k++) {
      const v = from + ((x - from) * k) / n;
      const val = fy(v);
      if (!Number.isFinite(val)) continue;
      pos += `L${top.sx(v).toFixed(2)} ${top.sy(Math.max(val, 0)).toFixed(2)}`;
      neg += `L${top.sx(v).toFixed(2)} ${top.sy(Math.min(val, 0)).toFixed(2)}`;
    }
    areaPos.setAttribute('d', x > from ? `${pos}L${px} ${top.sy(0)}Z` : '');
    areaNeg.setAttribute('d', x > from ? `${neg}L${px} ${top.sy(0)}Z` : '');
    setLine(heightBar, px, top.sy(0), px, top.sy(y));

    const sliceOn = sliceW > 0 && x + sliceW <= x1 + 1e-9;
    show(slice, sliceOn);
    if (sliceOn) {
      slice.setAttribute('x', px);
      slice.setAttribute('width', sliceW * top.kx);
      slice.setAttribute('y', Math.min(top.sy(y), top.sy(0)));
      slice.setAttribute('height', Math.abs(top.sy(y) - top.sy(0)));
    }

    // running total
    trail.setAttribute('d', totalPath(reached));
    const qy = bot.sy(a);
    const inRange = a >= ayRange[0] - 1e-9 && a <= ayRange[1] + 1e-9;
    setLine(totalBar, px, bot.sy(clamp(0, ayRange[0], ayRange[1])), px, qy);
    nowDot.setAttribute('cx', px);
    nowDot.setAttribute('cy', qy);
    show(nowDot, inRange);
    let m = slopeOfA(x);
    if (Math.abs(m - y) < 2e-3) m = y;       // equal in exact arithmetic; hide numerical fuzz
    if (showTangent) {
      const ux = bot.kx;
      const uy = -m * bot.ky;
      const len = Math.hypot(ux, uy) || 1;
      setLine(tangent, px - (ux / len) * 62, qy - (uy / len) * 62, px + (ux / len) * 62, qy + (uy / len) * 62);
    }
    show(tangent, showTangent && inRange);
    setLine(guide, px, clamp(top.sy(y), top.top, top.bottom), px, inRange ? qy : bot.top);

    // the two numbers the widget is about, written next to the things they measure
    const roomRight = px < top.right - 96;
    const barMid = (top.sy(0) + clamp(top.sy(y), top.top, top.bottom)) / 2;
    heightTag.textContent = `${words.heightTag} ${formatNumber(y, digits)}`;
    heightTag.setAttribute('text-anchor', roomRight ? 'start' : 'end');
    heightTag.setAttribute('x', px + (roomRight ? 10 : -10));
    heightTag.setAttribute('y', barMid + 4);
    show(heightTag, Math.abs(top.sy(y) - top.sy(0)) >= 20);
    slopeTag.textContent = `${words.slopeTag} ${formatNumber(m, digits)}`;
    slopeTag.setAttribute('text-anchor', roomRight ? 'start' : 'end');
    slopeTag.setAttribute('x', px + (roomRight ? 12 : -12));
    slopeTag.setAttribute('y', clamp(qy + (m >= 0 === roomRight ? 20 : -12), bot.top + 12, bot.bottom - 5));
    show(slopeTag, showTangent && inRange);

    if (hd) { hd.set(px, clamp(top.sy(y), top.top, top.bottom)); hd.setLabel(`x ${formatNumber(x, 2)}, area so far ${formatNumber(a, 2)}`); }
    if (fixedDot) { fixedDot.setAttribute('cx', px); fixedDot.setAttribute('cy', top.sy(y)); }

    roArea.set(tidy(a, 4));
    roHeight.set(tidy(y, 4));
    roSlope.set(tidy(m, 4));
    svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}Boundary at x = ${formatNumber(x, 2)}. Area so far ${formatNumber(a, 2)}. `
      + `Height of the curve here ${formatNumber(y, 2)}; slope of the running total here ${formatNumber(m, 2)}.`);
  }

  function getState() {
    const coverage = tidy(clamp((reached - from) / (x1 - from), 0, 1), 3);
    return {
      x,
      area: tidy(area(x), 4),
      height: tidy(fy(x), 4),
      slope: tidy(slopeOfA(x), 4),
      reached,
      coverage,
      done: coverage >= 0.95,
    };
  }

  render();
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.x === 'number') x = fit(next.x);
      if (typeof next.reached === 'number') reached = clamp(next.reached, from, x1);
      if (next.swept || next.done) reached = x1;
      reached = Math.max(reached, x);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hd) hd.setEnabled(!readOnly);
    },
    destroy() { if (hd) hd.destroy(); },
  };
}

// Shown in the gallery at #/dev/widgets and mounted by the smoke test.
export const examples = [
  { title: 'area-accumulator — the slope of the running total is the height of the curve', spec: { type: 'area-accumulator', fn: '2 + sin(x)', x: [0, 6], y: [0, 4], ay: [0, 16], ayStep: 4, start: 1 } },
  { title: 'area-accumulator — area below the axis subtracts', spec: { type: 'area-accumulator', fn: '3 - x', x: [0, 6], y: [-3, 3], start: 2, labels: { f: 'velocity (m/s)', A: 'position (m)' } } },
];
