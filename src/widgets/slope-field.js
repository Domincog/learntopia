/**
 * slope-field — a differential equation as a picture. The rule dy/dt = F(t, y)
 * gives a slope at every point; the widget draws that slope as a little dash
 * on a grid of points. A solution is a curve that follows the dashes, and the
 * point it starts from decides which one you get.
 *
 * Two ways to use it:
 *   · drag the start point and watch the solution through it change;
 *   · walk along the dashes yourself with Euler's method: each press of
 *     "Take a step" goes in a straight line, in the direction of the dash
 *     under your feet, for a time h. Smaller steps stay closer to the true curve.
 *
 * Nothing is random: the same spec and the same moves always give the same picture.
 *
 * {
 *   type: 'slope-field',
 *   rule: '0.5*y',               // dy/dt, as an expression in t and y
 *   t: [0, 6], y: [0, 10],       // the window
 *   tStep: 1, yStep: 2,          // spacing of the numbers on the axes (automatic if omitted)
 *   grid: [0.5, 1],              // spacing of the dashes across and up (automatic if omitted)
 *   tLabel: 't', yLabel: 'y',    // names of the axes
 *   start: { t: 0, y: 1 },       // where the solution starts
 *   drag: 'y',                   // how the start point may be moved: 'y' (up and down), 'ty' (anywhere) or false
 *                                //   (default: 'y', or false when `euler` is given)
 *   snap: [0.5, 0.25],           // the start point snaps to these steps in t and y (one number: both)
 *   curve: true,                 // draw the solution through the start point
 *   family: [1, 2, 4],           // also draw, faintly, the solutions that start at these heights (at start.t)
 *   hlines: [{ y: 20, label: 'room', color: 'green' }],   // level reference lines
 *   target: { t: 4, y: 7.39, tol: 0.3 },   // a ring for the solution curve to pass through
 *   euler: {                     // adds Euler's method
 *     sizes: [1, 0.5, 0.25],     //   the step sizes on offer
 *     h: 1,                      //   the step size at the start
 *     to: 4,                     //   walk until t reaches this (start.t + a whole number of steps of every size)
 *     truth: 'done',             //   show the true curve: true (always), false (never) or 'done' (once a walk is complete)
 *   },
 *   digits: 2,                   // decimals in the readouts
 *   static: false,
 * }
 *
 * State: { start: { t, y }, slope, end, starts }
 *   slope    the slope the rule gives at the start point
 *   end      the height of the solution curve at the right-hand edge of the window (or at target.t, with a target)
 *   starts   every start height tried so far (sorted)
 * with a target, also: { hit, miss }
 *   miss     how far above (+) or below (−) the centre of the ring the curve passes;  hit: |miss| ≤ tol
 * with euler, also: { h, n, t, y, path, exact, error, done }
 *   h, n     the step size and the number of steps taken
 *   t, y     where the walk has got to;  path: every point of the walk, as [t, y]
 *   exact    the height of the true solution at that t;  error = y − exact
 *   done     the walk has reached `to`
 *
 * setState accepts { start: { t, y }, h, n }: it moves the start, sets the step size and takes n steps.
 */
import { frame, plane, drawAxes, handle, sliderRow, readout, button, clipTo, hue, s, clamp, snapTo, tidy, formatNumber, ticks, niceStep, svgPoint, addStyles } from './kit.js';
import { compile } from '../core/mathexpr.js';

addStyles('slope-field', `
  .widget-slope-field .sf-hit { cursor: crosshair; }
  .widget-slope-field.is-readonly .sf-hit { cursor: default; }
`);

const W = 560;
const H = 400;

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const digits = spec.digits != null ? spec.digits : 2;
  const [t0, t1] = spec.t || [0, 6];
  const [y0, y1] = spec.y || [0, 10];
  const ruleFn = compile(String(spec.rule || 'y'), { vars: ['t', 'y'] });
  const F = (t, y) => { try { return ruleFn({ t, y }); } catch { return NaN; } };
  const eu = spec.euler && typeof spec.euler === 'object' ? spec.euler : null;
  const sizes = eu ? (Array.isArray(eu.sizes) && eu.sizes.length ? eu.sizes.map(Number) : [eu.h || 1]) : [];
  const target = spec.target && typeof spec.target === 'object' ? { tol: 0.25, ...spec.target } : null;
  const dragMode = isStatic ? false : (spec.drag !== undefined ? spec.drag : (eu ? false : 'y'));
  const snaps = Array.isArray(spec.snap) ? spec.snap : [spec.snap || 0, spec.snap || 0];
  const showCurve = spec.curve !== false;
  let readOnly = !!env.readOnly;

  const fitStart = (t, y) => ({
    t: tidy(clamp(snapTo(t, snaps[0]), t0, t1)),
    y: tidy(clamp(snapTo(y, snaps[1]), y0, y1)),
  });
  let start = fitStart(spec.start && spec.start.t != null ? spec.start.t : t0, spec.start && spec.start.y != null ? spec.start.y : (y0 + y1) / 2);
  const starts = new Set([start.y]);
  let hIndex = eu ? Math.max(0, sizes.indexOf(eu.h != null ? Number(eu.h) : sizes[0])) : 0;
  const walkTo = eu ? (eu.to != null ? Number(eu.to) : t1) : t1;
  let path = [[start.t, start.y]];

  /* ----------------------------------------------------------- the maths */
  const span = y1 - y0;
  /** One classical Runge–Kutta step: accurate enough, at this step size, to stand in for the true solution. */
  const rk4 = (t, y, dt) => {
    const k1 = F(t, y);
    const k2 = F(t + dt / 2, y + (dt / 2) * k1);
    const k3 = F(t + dt / 2, y + (dt / 2) * k2);
    const k4 = F(t + dt, y + dt * k3);
    return y + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  };
  /** The solution through (ta, ya), sampled from ta to tb (either direction). Stops where it leaves the picture for good. */
  function trace(ta, ya, tb) {
    const n = Math.max(2, Math.ceil((Math.abs(tb - ta) / (t1 - t0)) * 400));
    const dt = (tb - ta) / n;
    const pts = [[ta, ya]];
    let y = ya;
    for (let i = 0; i < n; i++) {
      y = rk4(ta + i * dt, y, dt);
      if (!Number.isFinite(y) || y > y1 + 4 * span || y < y0 - 4 * span) break;
      pts.push([ta + (i + 1) * dt, y]);
    }
    return pts;
  }
  /** Height at time T of the solution through (ta, ya); NaN if it cannot be followed that far. */
  function solutionAt(ta, ya, T) {
    if (Math.abs(T - ta) < 1e-12) return ya;
    const n = Math.max(8, Math.ceil((Math.abs(T - ta) / (t1 - t0)) * 800));
    const dt = (T - ta) / n;
    let y = ya;
    for (let i = 0; i < n; i++) { y = rk4(ta + i * dt, y, dt); if (!Number.isFinite(y)) return NaN; }
    return y;
  }

  const walkDone = () => path[path.length - 1][0] >= walkTo - 1e-9;
  function takeStep() {
    if (!eu || walkDone()) return false;
    const [t, y] = path[path.length - 1];
    const h = sizes[hIndex];
    const next = y + h * F(t, y);
    if (!Number.isFinite(next)) return false;
    path.push([tidy(t + h, 9), tidy(next, 9)]);
    return true;
  }
  const resetWalk = () => { path = [[start.t, start.y]]; };

  function getState() {
    const out = { start: { t: start.t, y: start.y }, slope: tidy(F(start.t, start.y), 4), starts: Array.from(starts).sort((a, b) => a - b) };
    const endT = target ? target.t : t1;
    out.end = tidy(solutionAt(start.t, start.y, endT), 4);
    if (target) { out.miss = tidy(out.end - target.y, 4); out.hit = Math.abs(out.miss) <= target.tol + 1e-9; }
    if (eu) {
      const [t, y] = path[path.length - 1];
      const exact = solutionAt(start.t, start.y, t);
      Object.assign(out, { h: sizes[hIndex], n: path.length - 1, t: tidy(t, 6), y: tidy(y, 6), path: path.map(([a, b]) => [tidy(a, 6), tidy(b, 6)]), exact: tidy(exact, 6), error: tidy(y - exact, 6), done: walkDone() });
    }
    return out;
  }

  /* -------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A field of slopes with a solution curve' });
  const { svg } = fr;
  const pl = plane({ x: [t0, t1], y: [y0, y1], width: W, height: H, pad: { l: 46, r: 18, t: 18, b: 36 } });
  const clip = clipTo(svg, pl);
  svg.appendChild(drawAxes(pl, { xStep: spec.tStep, yStep: spec.yStep, xLabel: spec.tLabel, yLabel: spec.yLabel }));

  // the dashes
  const gt = (spec.grid && spec.grid[0]) || niceStep(t1 - t0, 13);
  const gy = (spec.grid && spec.grid[1]) || niceStep(y1 - y0, 10);
  const half = 0.31 * Math.min(gt * pl.kx, gy * pl.ky);
  const gDash = s('g', { 'clip-path': clip, stroke: 'var(--ink-3)', 'stroke-width': 2, 'stroke-linecap': 'round', opacity: 0.85 });
  for (const tv of ticks(t0, t1, gt)) {
    for (const yv of ticks(y0, y1, gy)) {
      const m = F(tv, yv);
      if (!Number.isFinite(m)) continue;
      const dx = pl.kx;
      const dy = -m * pl.ky;
      const len = Math.hypot(dx, dy) || 1;
      const cx = pl.sx(tv);
      const cy = pl.sy(yv);
      gDash.appendChild(s('line', { x1: cx - (dx / len) * half, y1: cy - (dy / len) * half, x2: cx + (dx / len) * half, y2: cy + (dy / len) * half }));
    }
  }
  svg.appendChild(gDash);

  const gLines = s('g', { 'clip-path': clip });
  const gCurves = s('g', { 'clip-path': clip, 'pointer-events': 'none' });
  const gOver = s('g', { 'pointer-events': 'none' });
  const hit = s('rect.sf-hit', { x: pl.left, y: pl.top, width: pl.iw, height: pl.ih, fill: 'transparent' });
  svg.append(gLines, hit, gCurves, gOver);

  for (const line of spec.hlines || []) {
    const color = line.color || 'green';
    gLines.appendChild(s('line', { x1: pl.left, x2: pl.right, y1: pl.sy(line.y), y2: pl.sy(line.y), stroke: hue(color), 'stroke-width': 2.5, 'stroke-dasharray': '7 6', 'stroke-linecap': 'round' }));
    if (line.label) gOver.appendChild(s('text', { class: `fig-label text-${color}`, x: pl.right - 6, y: pl.sy(line.y) - 8, 'text-anchor': 'end' }, line.label));
  }
  const pathOf = (pts) => pts.map(([t, y], i) => `${i ? 'L' : 'M'}${pl.sx(t).toFixed(2)} ${pl.sy(clamp(y, y0 - 2 * span, y1 + 2 * span)).toFixed(2)}`).join('');
  const curveLine = (color, width, opacity = 1) => s('path', { fill: 'none', stroke: hue(color), 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity });
  for (const fy of spec.family || []) {
    const el = curveLine('blue', 2.5, 0.45);
    el.setAttribute('d', pathOf([...trace(start.t, fy, t0).reverse(), ...trace(start.t, fy, t1).slice(1)]));
    gCurves.appendChild(el);
  }
  const solution = curveLine('blue', 3.5);
  const walk = curveLine('orange', 3.5);
  const preview = s('line', { stroke: hue('orange'), 'stroke-width': 2.5, 'stroke-dasharray': '5 6', 'stroke-linecap': 'round', opacity: 0.8 });
  const gDots = s('g');
  gCurves.append(solution, preview, walk, gDots);
  const ring = target ? s('circle', { cx: pl.sx(target.t), cy: pl.sy(target.y), r: 12, 'stroke-width': 3.5 }) : null;
  if (ring) gOver.appendChild(ring);
  const startDot = dragMode ? null : s('circle', { r: 7, fill: hue('blue'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 });
  if (startDot) gOver.appendChild(startDot);
  const walker = eu ? s('circle', { r: 8, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }) : null;
  if (walker) gOver.appendChild(walker);

  /* ------------------------------------------------------------- controls */
  const outs = {};
  const addOut = (key, label, color) => { if (isStatic) return; outs[key] = readout(label, { digits, color }); fr.readouts.appendChild(outs[key].el); };
  if (eu) {
    addOut('t', `$${spec.tLabel && spec.tLabel.length <= 2 ? spec.tLabel : 't'}$`);
    addOut('y', 'your steps', 'orange');
    addOut('slope', 'slope here');
    if (eu.truth !== false) { addOut('exact', 'true curve', 'blue'); }
  } else {
    addOut('start', 'start');
    addOut('slope', 'slope at the start');
  }

  let hd = null;
  let sizeRow = null;
  let stepBtn = null;
  let resetBtn = null;

  function moveStart(t, y) {
    if (readOnly || !dragMode) return;
    const next = fitStart(dragMode === 'ty' ? t : start.t, y);
    if (next.t === start.t && next.y === start.y) return;
    start = next;
    starts.add(start.y);
    resetWalk();
    render();
    env.onChange(getState());
  }

  if (dragMode) {
    hd = handle(svg, {
      color: 'blue', label: 'Start point',
      keyStep: Math.max(4, (snaps[1] || (y1 - y0) / 40) * pl.ky),
      onMove: (px, py) => moveStart(pl.ux(px), pl.uy(py)),
    });
    svg.appendChild(hd.el);
    hit.addEventListener('pointerdown', (ev) => {
      if (readOnly || ev.button > 0) return;
      const p = svgPoint(svg, ev);
      moveStart(pl.ux(p.x), pl.uy(p.y));
    });
  }
  if (eu && !isStatic) {
    if (sizes.length > 1) {
      sizeRow = sliderRow({
        label: 'step size $h$', min: 0, max: sizes.length - 1, step: 1, value: hIndex, color: 'orange', format: (i) => formatNumber(sizes[Math.round(i)], 4),
        onInput: (i) => { if (readOnly) return; hIndex = clamp(Math.round(i), 0, sizes.length - 1); resetWalk(); render(); env.onChange(getState()); },
      });
      fr.controls.appendChild(sizeRow.el);
    }
    stepBtn = button('Take a step', () => { if (readOnly) return; if (takeStep()) { render(); env.onChange(getState()); } }, { variant: 'primary' });
    resetBtn = button('Start again', () => { if (readOnly) return; resetWalk(); render(); env.onChange(getState()); });
    fr.buttons.append(stepBtn, resetBtn);
  }

  function render() {
    const full = [...trace(start.t, start.y, t0).reverse(), ...trace(start.t, start.y, t1).slice(1)];
    const done = eu ? walkDone() : false;
    const truthOn = eu ? (eu.truth === true || (eu.truth === 'done' && done) || (eu.truth === undefined && done)) : showCurve;
    solution.setAttribute('d', truthOn ? pathOf(full) : '');
    if (hd) { hd.set(pl.sx(start.t), pl.sy(start.y)); hd.setLabel(`start at t ${formatNumber(start.t, 2)}, y ${formatNumber(start.y, 2)}`); }
    if (startDot) { startDot.setAttribute('cx', pl.sx(start.t)); startDot.setAttribute('cy', pl.sy(start.y)); }
    const state = getState();
    if (ring) {
      ring.setAttribute('stroke', hue(state.hit ? 'green' : 'pink'));
      ring.setAttribute('fill', state.hit ? hue('green', 'soft') : 'none');
    }
    if (eu) {
      const [t, y] = path[path.length - 1];
      walk.setAttribute('d', path.length > 1 ? pathOf(path) : '');
      gDots.replaceChildren(...path.slice(0, -1).map(([a, b]) => s('circle', { cx: pl.sx(a), cy: pl.sy(b), r: 4.5, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 1.5 })));
      walker.setAttribute('cx', pl.sx(t));
      walker.setAttribute('cy', pl.sy(clamp(y, y0 - span, y1 + span)));
      const m = F(t, y);
      const h = sizes[hIndex];
      if (!done && Number.isFinite(m)) {
        preview.setAttribute('visibility', 'visible');
        preview.setAttribute('x1', pl.sx(t)); preview.setAttribute('y1', pl.sy(y));
        preview.setAttribute('x2', pl.sx(t + h)); preview.setAttribute('y2', pl.sy(y + h * m));
      } else preview.setAttribute('visibility', 'hidden');
      if (outs.t) outs.t.set(tidy(t, 4));
      if (outs.y) outs.y.set(tidy(y, 4));
      if (outs.slope) outs.slope.set(done ? '—' : tidy(m, 4));
      if (outs.exact) outs.exact.set(truthOn ? tidy(state.exact, 4) : '?');
      if (stepBtn) stepBtn.disabled = done || readOnly;
    } else {
      preview.setAttribute('visibility', 'hidden');
      if (outs.start) outs.start.set(`(${formatNumber(start.t, 2)}, ${formatNumber(start.y, 2)})`);
      if (outs.slope) outs.slope.set(state.slope);
    }
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Start at t = ${formatNumber(start.t, 2)}, y = ${formatNumber(start.y, 2)}, where the slope is ${formatNumber(state.slope, 2)}.`
      + (eu ? ` ${state.n} ${state.n === 1 ? 'step' : 'steps'} of size ${formatNumber(state.h, 3)} taken: now at t = ${formatNumber(state.t, 2)}, y = ${formatNumber(state.y, 2)}.` : ` The solution reaches ${formatNumber(state.end, 2)} at t = ${formatNumber(target ? target.t : t1, 2)}.`)
      + (target ? (state.hit ? ' It passes through the ring.' : ` It passes ${formatNumber(Math.abs(state.miss), 2)} ${state.miss > 0 ? 'above' : 'below'} the ring.`) : ''));
  }

  render();
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.start && typeof next.start === 'object') {
        start = fitStart(typeof next.start.t === 'number' ? next.start.t : start.t, typeof next.start.y === 'number' ? next.start.y : start.y);
        starts.add(start.y);
      }
      if (Array.isArray(next.starts)) for (const v of next.starts) if (typeof v === 'number') starts.add(v);
      if (eu && typeof next.h === 'number') {
        let best = 0;
        sizes.forEach((v, i) => { if (Math.abs(v - next.h) < Math.abs(sizes[best] - next.h)) best = i; });
        hIndex = best;
        if (sizeRow) sizeRow.set(hIndex);
      }
      resetWalk();
      if (eu && typeof next.n === 'number') for (let i = 0; i < next.n; i++) if (!takeStep()) break;
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (hd) hd.setEnabled(!readOnly);
      if (sizeRow) sizeRow.setDisabled(readOnly);
      if (stepBtn) stepBtn.disabled = readOnly || walkDone();
      if (resetBtn) resetBtn.disabled = readOnly;
    },
    destroy() { if (hd) hd.destroy(); },
  };
}

export const examples = [
  { title: 'slope-field — growth in proportion: drag the start', spec: { type: 'slope-field', rule: '0.5*y', t: [0, 6], y: [0, 10], tStep: 1, yStep: 2, grid: [0.5, 1], start: { t: 0, y: 1 }, snap: [0, 0.25], target: { t: 4, y: 7.39, tol: 0.3 } } },
  { title: 'slope-field — Euler steps along dy/dt = y', spec: { type: 'slope-field', rule: 'y', t: [0, 1.1], y: [0, 3], tStep: 0.25, yStep: 0.5, grid: [0.125, 0.25], start: { t: 0, y: 1 }, euler: { sizes: [0.5, 0.25, 0.125], h: 0.5, to: 1, truth: true } } },
  { title: 'slope-field — cooling towards room temperature', spec: { type: 'slope-field', rule: '-0.05*(y - 20)', t: [0, 60], y: [0, 100], tStep: 10, yStep: 20, grid: [5, 10], tLabel: 'minutes', yLabel: '°C', start: { t: 0, y: 90 }, snap: [0, 5], hlines: [{ y: 20, label: 'room: 20 °C', color: 'green' }] } },
];
