/**
 * plot — function grapher with sliders, draggable points and calculus aids.
 *
 * {
 *   type: 'plot',
 *   x: [-5, 5], y: [-5, 5],               // window
 *   xLabel: 'x', yLabel: 'y', xStep, yStep, grid: true,
 *   tickLabels: true,                      // false: no numbers on the axes; 'x' or 'y': numbers on that axis only
 *   xFormat: 'pi',                         // tick labels as multiples of π (use with xStep: Math.PI / 2); or a function (value) => text. yFormat likewise.
 *   params: {                              // each becomes a slider and a variable
 *     m: { min: -3, max: 3, step: 0.5, value: 1, label: 'slope $m$', color: 'blue' },
 *   },
 *   fns: [                                 // curves; expressions may use x and any param
 *     { expr: 'm*x + b', color: 'blue', label: 'y = mx + b' },
 *     { expr: '2x - 1', color: 'gray', dashed: true },
 *   ],
 *   points: [                              // draggable points join the state
 *     { id: 'P', x: 1, y: 2, drag: 'xy', snap: 1, color: 'orange', label: 'P', coords: true },
 *     { id: 'T', x: 'a', on: 0 },          // fixed to curve 0 at x = a (not draggable)
 *     { id: 'S', x: 1, on: 0, drag: 'x' }, // slides along curve 0
 *   ],
 *   segments: [{ from: 'P', to: [0, 0], color: 'ink', dashed: true }],
 *   vlines: [{ x: 'a', color: 'gray', dashed: true }], hlines: [{ y: 2 }],
 *   areas: [{ fn: 0, from: 0, to: 'b', color: 'blue' }],
 *   riemann: [{ fn: 0, from: 0, to: 4, n: 'n', mode: 'left', color: 'orange' }],
 *   tangents: [{ fn: 0, at: 'a', color: 'orange' }],
 *   secants: [{ fn: 0, from: 'a', to: 'a + h', color: 'violet' }],
 *   labels: [{ x: 2, y: 3, text: 'peak', color: 'ink' }],
 *   readouts: [{ label: 'slope', expr: 'd0(a)', digits: 2 }],
 * }
 *
 * Expressions may use: x, every param, the coordinates of draggable points
 * as `Px` / `Py` (point id + x or y), and the helper functions
 *   f0(x), f1(x)…  value of curve 0, 1…
 *   d0(x), d1(x)…  its slope (numerical derivative)
 *   I0(a, b)…      its integral from a to b
 *   R0()…          the sum of riemann[0]
 *
 * State (what `check(state)` receives): { m: 1, b: 0, P: { x: 1, y: 2 } }
 */
import { frame, plane, drawAxes, handle, sliderRow, readout, fnPath, clipTo, hue, s, clamp, snapTo, tidy, formatNumber } from './kit.js';
import { compile } from '../core/mathexpr.js';

/** A tick value as a multiple of π: 1.5708 -> "π/2", -3.1416 -> "−π", 6.2832 -> "2π". */
export function piTick(v) {
  const k = v / Math.PI;
  if (Math.abs(k) < 1e-5) return '0';
  for (const d of [1, 2, 3, 4, 6, 12]) {
    const n = Math.round(k * d);
    // loose enough for a snapped point's x, which is rounded to six decimals
    if (Math.abs(k * d - n) < 1e-5) return `${n < 0 ? '−' : ''}${Math.abs(n) === 1 ? '' : Math.abs(n)}π${d === 1 ? '' : `/${d}`}`;
  }
  return formatNumber(v, 2);
}
const tickFormat = (f) => (f === 'pi' ? piTick : typeof f === 'function' ? f : undefined);

export default function create(spec, env) {
  const width = spec.width || 560;
  const height = spec.height || (env.compact ? 320 : 380);
  const fr = frame({ width, height, compact: env.compact, label: spec.alt || 'Graph' });
  const pl = plane({ x: spec.x || [-5, 5], y: spec.y || [-5, 5], width, height, pad: spec.pad });
  let readOnly = !!env.readOnly;

  /* ------------------------------------------------------------ model */
  const paramDefs = spec.params || {};
  const paramNames = Object.keys(paramDefs);
  const pointDefs = (spec.points || []).map((p, i) => ({ id: `p${i}`, ...p }));
  const dragPoints = pointDefs.filter((p) => p.drag);
  const state = {};
  for (const name of paramNames) {
    const def = paramDefs[name];
    state[name] = def.value != null ? def.value : def.min;
  }

  const vars = ['x', ...paramNames];
  for (const p of dragPoints) vars.push(`${p.id}x`, `${p.id}y`);
  const scope = { x: 0 };
  const fnDefs = spec.fns || [];
  const curves = [];
  const helpers = {};

  const syncScope = () => {
    for (const name of paramNames) scope[name] = state[name];
    for (const p of dragPoints) { scope[`${p.id}x`] = state[p.id].x; scope[`${p.id}y`] = state[p.id].y; }
  };
  const evalCurve = (i, x) => {
    const saved = scope.x;
    scope.x = x;
    let y;
    try { y = curves[i](scope); } catch { y = NaN; }
    scope.x = saved;
    return y;
  };
  const slope = (i, x) => {
    const hh = (pl.x1 - pl.x0) * 1e-4;
    return (evalCurve(i, x + hh) - evalCurve(i, x - hh)) / (2 * hh);
  };
  const integral = (i, a, b) => {
    const n = 200; // Simpson's rule
    const step = (b - a) / n;
    let sum = evalCurve(i, a) + evalCurve(i, b);
    for (let k = 1; k < n; k++) sum += evalCurve(i, a + k * step) * (k % 2 ? 4 : 2);
    return (sum * step) / 3;
  };

  const riemannDefs = spec.riemann || [];
  const riemannSums = riemannDefs.map(() => 0);
  fnDefs.forEach((_, i) => {
    helpers[`f${i}`] = (x) => evalCurve(i, x);
    helpers[`d${i}`] = (x) => slope(i, x);
    helpers[`I${i}`] = (a, b) => integral(i, a, b);
  });
  riemannDefs.forEach((_, i) => { helpers[`R${i}`] = () => riemannSums[i]; });

  /** Compile a number | expression string | function into (scope) => number. */
  const ex = (src) => {
    if (typeof src === 'number') return () => src;
    if (typeof src === 'function') return () => src({ ...getState() });
    return compile(String(src), { vars, fns: helpers });
  };
  const safe = (fn) => { try { return fn(scope); } catch { return NaN; } };

  for (const def of fnDefs) curves.push(compile(def.expr, { vars, fns: helpers }));

  // initial positions of draggable points (need the scope for points on curves)
  for (const p of dragPoints) state[p.id] = { x: Number(p.x) || 0, y: Number(p.y) || 0 };
  syncScope();
  for (const p of dragPoints) if (p.on != null) state[p.id].y = tidy(evalCurve(p.on, state[p.id].x));
  syncScope();

  /* ------------------------------------------------------------ layers */
  const { svg } = fr;
  const clip = clipTo(svg, pl);
  const axes = drawAxes(pl, {
    grid: spec.grid !== false, axes: spec.axes !== false, labels: true,   // axis names (xLabel, yLabel) stay when the numbers are switched off
    xTicks: spec.tickLabels !== false && spec.tickLabels !== 'y', yTicks: spec.tickLabels !== false && spec.tickLabels !== 'x',
    xStep: spec.xStep, yStep: spec.yStep, xLabel: spec.xLabel, yLabel: spec.yLabel,
    xFormat: tickFormat(spec.xFormat), yFormat: tickFormat(spec.yFormat),
  });
  svg.appendChild(axes);
  const gArea = s('g', { 'clip-path': clip });
  const gCurve = s('g', { 'clip-path': clip });
  const gDecor = s('g', { 'clip-path': clip });
  const gPoints = s('g');
  const gLabels = s('g');
  const gHandles = s('g');
  // Tick numbers and axis names are lifted above the curves (their halo keeps them readable), so a
  // curve that crosses the axis at a tick, as sine does at every multiple of π, does not hide them.
  const gTicks = s('g');
  for (const t of Array.from(axes.querySelectorAll('text'))) gTicks.appendChild(t);
  svg.append(gArea, gCurve, gDecor, gTicks, gPoints, gLabels, gHandles);

  const areaDefs = (spec.areas || []).map((a) => ({ ...a, from: ex(a.from), to: ex(a.to), el: s('path', { fill: hue(a.color || 'blue', 'soft'), stroke: 'none', opacity: 0.85 }) }));
  areaDefs.forEach((a) => gArea.appendChild(a.el));
  const rieEls = riemannDefs.map((r) => ({ ...r, from: ex(r.from), to: ex(r.to), n: ex(r.n), g: s('g') }));
  rieEls.forEach((r) => gArea.appendChild(r.g));

  const curveEls = fnDefs.map((def) => {
    const el = s('path', {
      fill: 'none', stroke: hue(def.color || 'blue'), 'stroke-width': def.width || 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      'stroke-dasharray': def.dashed ? '7 7' : null, opacity: def.opacity != null ? def.opacity : null,
    });
    gCurve.appendChild(el);
    return { def, el, from: def.from != null ? ex(def.from) : null, to: def.to != null ? ex(def.to) : null };
  });

  const lineEl = (o, w = 2.5) => s('line', { stroke: hue(o.color || 'ink-2'), 'stroke-width': o.width || w, 'stroke-linecap': 'round', 'stroke-dasharray': o.dashed ? '6 6' : null });
  const vlines = (spec.vlines || []).map((v) => ({ x: ex(v.x), el: lineEl(v, 2) }));
  const hlines = (spec.hlines || []).map((v) => ({ y: ex(v.y), el: lineEl(v, 2) }));
  const tangents = (spec.tangents || []).map((t) => ({ ...t, at: ex(t.at), el: lineEl({ color: t.color || 'orange', width: 3 }), dot: s('circle', { r: 5, fill: hue(t.color || 'orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }) }));
  const secants = (spec.secants || []).map((t) => ({ ...t, from: ex(t.from), to: ex(t.to), el: lineEl({ color: t.color || 'violet', width: 3 }), d1: s('circle', { r: 5, fill: hue(t.color || 'violet'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }), d2: s('circle', { r: 5, fill: hue(t.color || 'violet'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }) }));
  const endpoint = (e) => (Array.isArray(e) ? { x: ex(e[0]), y: ex(e[1]) } : { ref: e });
  const segments = (spec.segments || []).map((g) => ({ a: endpoint(g.from), b: endpoint(g.to), el: lineEl(g) }));
  [...vlines, ...hlines, ...segments, ...tangents, ...secants].forEach((o) => gDecor.appendChild(o.el));
  tangents.forEach((t) => gDecor.appendChild(t.dot));
  secants.forEach((t) => { gDecor.appendChild(t.d1); gDecor.appendChild(t.d2); });

  const textEl = (o) => s('text.fig-label', { 'text-anchor': o.anchor || 'start', style: o.color ? `fill:${hue(o.color, 'text')}` : null });
  const labels = (spec.labels || []).map((l) => {
    const el = textEl(l);
    el.textContent = l.text;
    gLabels.appendChild(el);
    return { x: ex(l.x), y: ex(l.y), el, dx: l.dx || 0, dy: l.dy || 0 };
  });

  const points = pointDefs.map((p) => {
    const rec = { def: p, label: null, dot: null, handle: null };
    if (p.label || p.coords) { rec.label = textEl({ color: p.color }); gLabels.appendChild(rec.label); }
    if (p.drag) {
      const step = Array.isArray(p.snap) ? p.snap : [p.snap, p.snap];
      rec.handle = handle(svg, {
        color: p.color || 'orange',
        label: p.label ? `Point ${p.label}` : 'Draggable point',
        keyStep: Math.max(4, (step[0] || (pl.x1 - pl.x0) / 40) * pl.kx),
        onMove: (px, py) => {
          if (readOnly) return;
          const cur = state[p.id];
          let nx = p.drag === 'y' ? cur.x : clamp(snapTo(pl.ux(px), step[0]), p.xMin != null ? p.xMin : pl.x0, p.xMax != null ? p.xMax : pl.x1);
          let ny = p.drag === 'x' ? cur.y : clamp(snapTo(pl.uy(py), step[1]), p.yMin != null ? p.yMin : pl.y0, p.yMax != null ? p.yMax : pl.y1);
          nx = tidy(nx);
          ny = tidy(ny);
          if (p.on != null) { syncScope(); ny = tidy(evalCurve(p.on, nx)); if (!Number.isFinite(ny)) return; }
          if (nx === cur.x && ny === cur.y) return;
          state[p.id] = { x: nx, y: ny };
          render();
          env.onChange(getState());
        },
      });
      gHandles.appendChild(rec.handle.el);
    } else {
      rec.x = ex(p.x != null ? p.x : 0);
      rec.y = p.on != null ? null : ex(p.y != null ? p.y : 0);
      rec.dot = s('circle', { r: p.r || 6, fill: p.hollow ? 'var(--surface)' : hue(p.color || 'ink'), stroke: p.hollow ? hue(p.color || 'ink') : 'var(--edge-strong)', 'stroke-width': p.hollow ? 3 : 2 });
      gPoints.appendChild(rec.dot);
    }
    return rec;
  });

  /* ---------------------------------------------------------- controls */
  const sliders = {};
  for (const name of paramNames) {
    const def = paramDefs[name];
    if (def.hidden) continue;
    sliders[name] = sliderRow({
      label: def.label || `$${name}$`, min: def.min, max: def.max, step: def.step || 1, value: state[name], color: def.color || 'blue', unit: def.unit || '',
      onInput: (v) => { state[name] = v; render(); env.onChange(getState()); },
    });
    if (readOnly) sliders[name].setDisabled(true);
    if (!env.compact) fr.controls.appendChild(sliders[name].el);
  }
  const readouts = (spec.readouts || []).map((r) => {
    const ro = readout(r.label, { digits: r.digits != null ? r.digits : 2, color: r.color, unit: r.unit });
    if (!env.compact) fr.readouts.appendChild(ro.el);
    const api = { f: evalCurve, slope, integral, riemann: (i = 0) => riemannSums[i] };
    return { ro, get: typeof r.value === 'function' ? () => r.value(getState(), api) : ex(r.expr) };
  });

  /* ------------------------------------------------------------ render */
  const pointPos = (id) => {
    const rec = points.find((p) => p.def.id === id);
    if (!rec) return { x: NaN, y: NaN };
    if (rec.def.drag) return state[id];
    const x = safe(rec.x);
    return { x, y: rec.def.on != null ? evalCurve(rec.def.on, x) : safe(rec.y) };
  };
  const setLine = (el, x1, y1, x2, y2) => {
    const ok = [x1, y1, x2, y2].every(Number.isFinite);
    el.setAttribute('visibility', ok ? 'visible' : 'hidden');
    if (ok) { el.setAttribute('x1', pl.sx(x1)); el.setAttribute('y1', pl.sy(y1)); el.setAttribute('x2', pl.sx(x2)); el.setAttribute('y2', pl.sy(y2)); }
  };
  const setDot = (el, x, y) => {
    const ok = Number.isFinite(x) && Number.isFinite(y);
    el.setAttribute('visibility', ok ? 'visible' : 'hidden');
    if (ok) { el.setAttribute('cx', pl.sx(x)); el.setAttribute('cy', pl.sy(y)); }
  };

  function render() {
    syncScope();

    curveEls.forEach((c, i) => {
      c.el.setAttribute('d', fnPath((x) => evalCurve(i, x), pl, {
        from: c.from ? safe(c.from) : pl.x0, to: c.to ? safe(c.to) : pl.x1,
      }));
    });

    for (const a of areaDefs) {
      const lo = clamp(safe(a.from), pl.x0, pl.x1);
      const hi = clamp(safe(a.to), pl.x0, pl.x1);
      if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo === hi) { a.el.setAttribute('d', ''); continue; }
      const from = Math.min(lo, hi);
      const to = Math.max(lo, hi);
      const base = a.baseline || 0;
      let d = `M${pl.sx(from)} ${pl.sy(base)}`;
      const n = 120;
      for (let k = 0; k <= n; k++) {
        const x = from + ((to - from) * k) / n;
        const y = evalCurve(a.fn || 0, x);
        if (Number.isFinite(y)) d += `L${pl.sx(x).toFixed(2)} ${pl.sy(y).toFixed(2)}`;
      }
      a.el.setAttribute('d', `${d}L${pl.sx(to)} ${pl.sy(base)}Z`);
    }

    rieEls.forEach((r, idx) => {
      while (r.g.firstChild) r.g.removeChild(r.g.firstChild);
      const a = safe(r.from);
      const b = safe(r.to);
      const n = Math.max(1, Math.min(400, Math.round(safe(r.n))));
      if (![a, b, n].every(Number.isFinite) || a === b) { riemannSums[idx] = 0; return; }
      const dx = (b - a) / n;
      let sum = 0;
      for (let k = 0; k < n; k++) {
        const xl = a + k * dx;
        const xs = r.mode === 'right' ? xl + dx : r.mode === 'mid' ? xl + dx / 2 : xl;
        const y = evalCurve(r.fn || 0, xs);
        if (!Number.isFinite(y)) continue;
        sum += y * dx;
        const top = Math.min(pl.sy(y), pl.sy(0));
        r.g.appendChild(s('rect', {
          x: pl.sx(Math.min(xl, xl + dx)), y: top, width: Math.abs(dx) * pl.kx, height: Math.abs(pl.sy(y) - pl.sy(0)),
          fill: hue(r.color || 'orange', 'soft'), stroke: hue(r.color || 'orange'), 'stroke-width': n > 60 ? 0.5 : 1.5,
        }));
      }
      riemannSums[idx] = sum;
    });

    for (const v of vlines) { const x = safe(v.x); setLine(v.el, x, pl.y0, x, pl.y1); }
    for (const v of hlines) { const y = safe(v.y); setLine(v.el, pl.x0, y, pl.x1, y); }
    for (const g of segments) {
      const a = g.a.ref ? pointPos(g.a.ref) : { x: safe(g.a.x), y: safe(g.a.y) };
      const b = g.b.ref ? pointPos(g.b.ref) : { x: safe(g.b.x), y: safe(g.b.y) };
      setLine(g.el, a.x, a.y, b.x, b.y);
    }
    for (const t of tangents) {
      const a = safe(t.at);
      const y = evalCurve(t.fn || 0, a);
      const m = slope(t.fn || 0, a);
      const half = t.length ? t.length / 2 : (pl.x1 - pl.x0);
      setLine(t.el, a - half, y - m * half, a + half, y + m * half);
      setDot(t.dot, a, y);
    }
    for (const t of secants) {
      const a = safe(t.from);
      const b = safe(t.to);
      const ya = evalCurve(t.fn || 0, a);
      const yb = evalCurve(t.fn || 0, b);
      setDot(t.d1, a, ya);
      setDot(t.d2, b, yb);
      if (Math.abs(b - a) < 1e-9) { t.el.setAttribute('visibility', 'hidden'); continue; }
      const m = (yb - ya) / (b - a);
      const span = pl.x1 - pl.x0;
      setLine(t.el, a - span, ya - m * span, a + span, ya + m * span);
    }

    for (const rec of points) {
      const pos = pointPos(rec.def.id);
      if (rec.handle) {
        rec.handle.set(pl.sx(pos.x), pl.sy(pos.y));
        rec.handle.setLabel(`x ${formatNumber(pos.x, 2)}, y ${formatNumber(pos.y, 2)}`);
      } else setDot(rec.dot, pos.x, pos.y);
      if (rec.label) {
        const ok = Number.isFinite(pos.x) && Number.isFinite(pos.y);
        rec.label.setAttribute('visibility', ok ? 'visible' : 'hidden');
        if (ok) {
          const px = pl.sx(pos.x);
          const py = pl.sy(pos.y);
          const right = px < pl.right - 90;
          rec.label.setAttribute('x', px + (right ? 14 : -14));
          rec.label.setAttribute('y', py - 12 < pl.top + 12 ? py + 24 : py - 12);
          rec.label.setAttribute('text-anchor', right ? 'start' : 'end');
          const coords = `(${formatNumber(pos.x, 2)}, ${formatNumber(pos.y, 2)})`;
          rec.label.textContent = rec.def.coords ? (rec.def.label ? `${rec.def.label} ${coords}` : coords) : rec.def.label;
        }
      }
    }
    for (const l of labels) { l.el.setAttribute('x', pl.sx(safe(l.x)) + l.dx); l.el.setAttribute('y', pl.sy(safe(l.y)) + l.dy); }
    for (const r of readouts) {
      let v;
      try { v = r.get(scope); } catch { v = NaN; }
      r.ro.set(typeof v === 'number' && !Number.isFinite(v) ? '—' : v);
    }
  }

  function getState() {
    const out = {};
    for (const name of paramNames) out[name] = state[name];
    for (const p of dragPoints) out[p.id] = { x: state[p.id].x, y: state[p.id].y };
    return out;
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      for (const name of paramNames) {
        if (typeof next[name] === 'number') { state[name] = next[name]; if (sliders[name]) sliders[name].set(next[name]); }
      }
      for (const p of dragPoints) {
        if (next[p.id] && typeof next[p.id].x === 'number') state[p.id] = { x: next[p.id].x, y: typeof next[p.id].y === 'number' ? next[p.id].y : state[p.id].y };
      }
      syncScope();
      for (const p of dragPoints) if (p.on != null) state[p.id].y = tidy(evalCurve(p.on, state[p.id].x));
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const name in sliders) sliders[name].setDisabled(readOnly);
      for (const rec of points) if (rec.handle) rec.handle.setEnabled(!readOnly);
    },
    destroy() { for (const rec of points) if (rec.handle) rec.handle.destroy(); },
  };
}
