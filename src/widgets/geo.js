/**
 * geo — dynamic geometry: draggable points with shapes and live measurements
 * that follow them. Equal scale on both axes, so angles and circles are true.
 *
 * {
 *   type: 'geo',
 *   x: [0, 10], y: [0, 7],            // visible region (maths units)
 *   grid: true, axes: false,
 *   points: {
 *     A: { x: 1, y: 1, drag: true, snap: 0.5, color: 'orange' },       // label defaults to the id
 *     B: { x: 8, y: 1, drag: true },
 *     C: { x: 4, y: 6, drag: true, circle: ['O', 3] },                 // constrained to a circle
 *     D: { x: 2, y: 2, drag: true, segment: ['A', 'B'] },              // constrained to segment AB
 *     E: { x: 2, y: 2, drag: true, constrain: (p, P) => ({ x: p.x, y: 3 }) },
 *     M: { derive: (P) => ({ x: (P.A.x + P.B.x) / 2, y: (P.A.y + P.B.y) / 2 }), label: 'M' },
 *     O: { x: 5, y: 3, label: false, hidden: true },
 *   },
 *   shapes: [
 *     { kind: 'polygon', pts: ['A', 'B', 'C'], color: 'blue' },        // fill: false for outline only
 *     { kind: 'segment', pts: ['A', 'B'], label: 'length' },           // or label: 'c', dashed: true
 *     { kind: 'line', pts: ['A', 'B'] }, { kind: 'ray', pts: ['A', 'B'] }, { kind: 'vector', pts: ['A', 'B'] },
 *     { kind: 'circle', center: 'O', through: 'C' },                   // or r: 3
 *     { kind: 'angle', pts: ['B', 'A', 'C'], label: 'deg' },           // angle at the middle point; or label: 'α'
 *     { kind: 'right', pts: ['B', 'A', 'C'] },                         // right-angle marker at A
 *     { kind: 'square', pts: ['A', 'B'], color: 'green', label: 'area' }, // square built on AB; flip: true for the other side
 *     { kind: 'text', at: 'A', text: 'start', dx: 0, dy: -14 },
 *   ],
 *   readouts: [{ label: 'Angle sum', value: (g) => g.angle('B','A','C') + g.angle('A','B','C') + g.angle('A','C','B'), digits: 0, unit: '°' }],
 * }
 *
 * Readout functions get g = { P, dist(a,b), angle(a,vertex,c), area(...ids), perimeter(...ids), slope(a,b) }.
 * State: { A: { x, y }, B: { x, y } } — the draggable points.
 */
import { frame, handle, readout, hue, s, clamp, snapTo, tidy, formatNumber, niceStep, ticks, arrowMarker } from './kit.js';
import { dist, angleDeg, polygonArea, perimeter, slopeOf, project } from '../core/geom.js';

export default function create(spec, env) {
  const width = spec.width || 560;
  const height = spec.height || (env.compact ? 300 : 380);
  const fr = frame({ width, height, compact: env.compact, label: spec.alt || 'Geometry figure' });
  const { svg } = fr;
  const [x0, x1] = spec.x || [0, 10];
  const [y0, y1] = spec.y || [0, 7];
  const pad = spec.axes ? 30 : 14;
  const k = Math.min((width - 2 * pad) / (x1 - x0), (height - 2 * pad) / (y1 - y0));
  const ox = (width - k * (x1 - x0)) / 2;
  const oy = (height - k * (y1 - y0)) / 2;
  const sx = (v) => ox + (v - x0) * k;
  const sy = (v) => oy + (y1 - v) * k;
  const ux = (px) => x0 + (px - ox) / k;
  const uy = (py) => y1 - (py - oy) / k;
  let readOnly = !!env.readOnly;

  /* ------------------------------------------------------------ points */
  const defs = spec.points || {};
  const ids = Object.keys(defs);
  const free = {};
  for (const id of ids) if (!defs[id].derive) free[id] = { x: Number(defs[id].x) || 0, y: Number(defs[id].y) || 0 };
  const P = {};
  function resolve() {
    for (const id of ids) {
      const def = defs[id];
      if (def.derive) {
        let pt;
        try { pt = def.derive(P); } catch { pt = null; }
        P[id] = pt && Number.isFinite(pt.x) && Number.isFinite(pt.y) ? { x: pt.x, y: pt.y } : { x: NaN, y: NaN };
      } else P[id] = free[id];
    }
  }
  function constrain(id, pt) {
    const def = defs[id];
    let p = { x: pt.x, y: pt.y };
    const snap = Array.isArray(def.snap) ? def.snap : [def.snap, def.snap];
    p.x = snapTo(p.x, snap[0]);
    p.y = snapTo(p.y, snap[1]);
    if (def.lockX) p.x = free[id].x;
    if (def.lockY) p.y = free[id].y;
    if (def.circle) {
      const c = P[def.circle[0]];
      const r = def.circle[1];
      const d = Math.hypot(p.x - c.x, p.y - c.y) || 1;
      p = { x: c.x + ((p.x - c.x) / d) * r, y: c.y + ((p.y - c.y) / d) * r };
    }
    if (def.segment) {
      const a = P[def.segment[0]];
      const b = P[def.segment[1]];
      const f = project(p, a, b);
      const t = Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? (f.x - a.x) / (b.x - a.x) : (f.y - a.y) / ((b.y - a.y) || 1);
      const tt = clamp(t, 0, 1);
      p = { x: a.x + tt * (b.x - a.x), y: a.y + tt * (b.y - a.y) };
    }
    if (typeof def.constrain === 'function') {
      const out = def.constrain(p, P);
      if (out) p = { x: out.x, y: out.y };
    }
    p.x = tidy(clamp(p.x, x0, x1));
    p.y = tidy(clamp(p.y, y0, y1));
    return p;
  }

  /* -------------------------------------------------------- background */
  if (spec.grid) {
    const step = spec.gridStep || niceStep(x1 - x0, 10);
    const g = s('g');
    for (const v of ticks(x0, x1, step)) g.appendChild(s('line.grid-line', { x1: sx(v), x2: sx(v), y1: sy(y0), y2: sy(y1) }));
    for (const v of ticks(y0, y1, step)) g.appendChild(s('line.grid-line', { y1: sy(v), y2: sy(v), x1: sx(x0), x2: sx(x1) }));
    svg.appendChild(g);
  }
  if (spec.axes) {
    const g = s('g');
    const ay = y0 <= 0 && y1 >= 0 ? sy(0) : sy(y0);
    const ax = x0 <= 0 && x1 >= 0 ? sx(0) : sx(x0);
    g.appendChild(s('line.axis-line', { x1: sx(x0), x2: sx(x1), y1: ay, y2: ay }));
    g.appendChild(s('line.axis-line', { y1: sy(y0), y2: sy(y1), x1: ax, x2: ax }));
    const step = spec.gridStep || niceStep(x1 - x0, 10);
    for (const v of ticks(x0, x1, step)) if (v !== 0) g.appendChild(s('text.tick-label', { x: sx(v), y: ay + 16, 'text-anchor': 'middle' }, formatNumber(v, 4)));
    for (const v of ticks(y0, y1, step)) if (v !== 0) g.appendChild(s('text.tick-label', { x: ax - 7, y: sy(v) + 4, 'text-anchor': 'end' }, formatNumber(v, 4)));
    svg.appendChild(g);
  }

  /* ------------------------------------------------------------ shapes */
  const gShapes = s('g');
  const gLabels = s('g');
  const gDots = s('g');
  const gHandles = s('g');
  svg.append(gShapes, gDots, gLabels, gHandles);
  const updaters = [];
  const px = (id) => ({ x: sx(P[id].x), y: sy(P[id].y) });
  const ok = (...pts) => pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  const strokeOf = (sh, fallback = 'ink') => hue(sh.color || fallback);
  const mkText = (sh, cls = 'fig-label') => {
    const el = s(`text.${cls}`, { 'text-anchor': 'middle', 'dominant-baseline': 'middle', style: sh.color ? `fill:${hue(sh.color, 'text')}` : null });
    gLabels.appendChild(el);
    return el;
  };
  const digitsOf = (sh) => (sh.digits != null ? sh.digits : 1);

  for (const sh of spec.shapes || []) {
    const pts = sh.pts || [];
    switch (sh.kind) {
      case 'polygon': {
        const el = s('polygon', { fill: sh.fill === false ? 'none' : hue(sh.color || 'blue', 'soft'), 'fill-opacity': sh.opacity != null ? sh.opacity : 0.75, stroke: strokeOf(sh, 'blue'), 'stroke-width': sh.width || 3, 'stroke-linejoin': 'round', 'stroke-dasharray': sh.dashed ? '6 6' : null });
        gShapes.appendChild(el);
        updaters.push(() => { const q = pts.map(px); el.setAttribute('points', ok(...q) ? q.map((p) => `${p.x},${p.y}`).join(' ') : ''); });
        break;
      }
      case 'segment': case 'line': case 'ray': case 'vector': {
        const el = s('line', { stroke: strokeOf(sh), 'stroke-width': sh.width || 3, 'stroke-linecap': 'round', 'stroke-dasharray': sh.dashed ? '6 6' : null });
        if (sh.kind === 'vector') el.setAttribute('marker-end', arrowMarker(svg, sh.color || 'ink'));
        gShapes.appendChild(el);
        const label = sh.label ? mkText(sh, 'fig-label') : null;
        updaters.push(() => {
          const a = px(pts[0]);
          const b = px(pts[1]);
          if (!ok(a, b)) { el.setAttribute('visibility', 'hidden'); if (label) label.textContent = ''; return; }
          el.setAttribute('visibility', 'visible');
          let p = a;
          let q = b;
          if (sh.kind === 'line' || sh.kind === 'ray') {
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const far = width + height;
            q = { x: b.x + (dx / len) * far, y: b.y + (dy / len) * far };
            if (sh.kind === 'line') p = { x: a.x - (dx / len) * far, y: a.y - (dy / len) * far };
          }
          el.setAttribute('x1', p.x); el.setAttribute('y1', p.y); el.setAttribute('x2', q.x); el.setAttribute('y2', q.y);
          if (label) {
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            // push the label off the segment, away from the figure's centre
            let nx = -dy / len;
            let ny = dx / len;
            const c = centroidPx();
            if ((mx + nx * 10 - c.x) ** 2 + (my + ny * 10 - c.y) ** 2 < (mx - nx * 10 - c.x) ** 2 + (my - ny * 10 - c.y) ** 2) { nx = -nx; ny = -ny; }
            label.setAttribute('x', mx + nx * (sh.offset || 16));
            label.setAttribute('y', my + ny * (sh.offset || 16));
            label.textContent = sh.label === 'length' ? formatNumber(dist(P[pts[0]], P[pts[1]]), digitsOf(sh))
              : typeof sh.label === 'function' ? String(sh.label(api)) : sh.label;
          }
        });
        break;
      }
      case 'circle': {
        const el = s('circle', { fill: sh.fill ? hue(sh.color || 'blue', 'soft') : 'none', 'fill-opacity': 0.6, stroke: strokeOf(sh, 'blue'), 'stroke-width': sh.width || 3, 'stroke-dasharray': sh.dashed ? '6 6' : null });
        gShapes.appendChild(el);
        updaters.push(() => {
          const c = px(sh.center);
          const r = sh.through ? dist(P[sh.center], P[sh.through]) : (typeof sh.r === 'function' ? sh.r(P) : sh.r);
          if (!ok(c) || !Number.isFinite(r)) { el.setAttribute('visibility', 'hidden'); return; }
          el.setAttribute('visibility', 'visible');
          el.setAttribute('cx', c.x); el.setAttribute('cy', c.y); el.setAttribute('r', Math.max(0, r * k));
        });
        break;
      }
      case 'angle': {
        const el = s('path', { fill: hue(sh.color || 'orange', 'soft'), 'fill-opacity': 0.9, stroke: strokeOf(sh, 'orange'), 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
        gShapes.appendChild(el);
        const label = sh.label ? mkText({ color: sh.color || 'orange' }, 'fig-label') : null;
        const r = sh.r || 30;
        updaters.push(() => {
          const a = px(pts[0]);
          const v = px(pts[1]);
          const c = px(pts[2]);
          if (!ok(a, v, c)) { el.setAttribute('d', ''); if (label) label.textContent = ''; return; }
          const a1 = Math.atan2(a.y - v.y, a.x - v.x);
          const a2 = Math.atan2(c.y - v.y, c.x - v.x);
          let delta = a2 - a1;
          while (delta > Math.PI) delta -= 2 * Math.PI;
          while (delta < -Math.PI) delta += 2 * Math.PI;
          const p1 = { x: v.x + r * Math.cos(a1), y: v.y + r * Math.sin(a1) };
          const p2 = { x: v.x + r * Math.cos(a2), y: v.y + r * Math.sin(a2) };
          el.setAttribute('d', `M${v.x} ${v.y} L${p1.x} ${p1.y} A${r} ${r} 0 0 ${delta > 0 ? 1 : 0} ${p2.x} ${p2.y} Z`);
          if (label) {
            const mid = a1 + delta / 2;
            const deg = angleDeg(P[pts[0]], P[pts[1]], P[pts[2]]);
            const lr = r + (deg < 35 ? 26 : 18);
            label.setAttribute('x', v.x + lr * Math.cos(mid));
            label.setAttribute('y', v.y + lr * Math.sin(mid));
            label.textContent = sh.label === 'deg' ? `${formatNumber(deg, sh.digits != null ? sh.digits : 0)}°` : sh.label;
          }
        });
        break;
      }
      case 'right': {
        const el = s('path', { fill: 'none', stroke: strokeOf(sh), 'stroke-width': 2.5, 'stroke-linejoin': 'round' });
        gShapes.appendChild(el);
        const size = sh.size || 16;
        updaters.push(() => {
          const a = px(pts[0]);
          const v = px(pts[1]);
          const c = px(pts[2]);
          if (!ok(a, v, c)) { el.setAttribute('d', ''); return; }
          const u = { x: a.x - v.x, y: a.y - v.y };
          const w = { x: c.x - v.x, y: c.y - v.y };
          const lu = Math.hypot(u.x, u.y) || 1;
          const lw = Math.hypot(w.x, w.y) || 1;
          const p1 = { x: v.x + (u.x / lu) * size, y: v.y + (u.y / lu) * size };
          const p3 = { x: v.x + (w.x / lw) * size, y: v.y + (w.y / lw) * size };
          const p2 = { x: p1.x + (w.x / lw) * size, y: p1.y + (w.y / lw) * size };
          el.setAttribute('d', `M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y}`);
        });
        break;
      }
      case 'square': {
        const el = s('polygon', { fill: hue(sh.color || 'green', 'soft'), 'fill-opacity': 0.8, stroke: strokeOf(sh, 'green'), 'stroke-width': 3, 'stroke-linejoin': 'round' });
        gShapes.appendChild(el);
        const label = sh.label ? mkText({ color: sh.color || 'green' }, 'fig-label') : null;
        updaters.push(() => {
          const A = P[pts[0]];
          const B = P[pts[1]];
          if (!ok(A, B)) { el.setAttribute('points', ''); if (label) label.textContent = ''; return; }
          const dx = B.x - A.x;
          const dy = B.y - A.y;
          const sign = sh.flip ? -1 : 1;
          const n = { x: dy * sign, y: -dx * sign };
          const corners = [A, B, { x: B.x + n.x, y: B.y + n.y }, { x: A.x + n.x, y: A.y + n.y }];
          el.setAttribute('points', corners.map((p) => `${sx(p.x)},${sy(p.y)}`).join(' '));
          if (label) {
            label.setAttribute('x', sx((A.x + B.x + n.x) / 2));
            label.setAttribute('y', sy((A.y + B.y + n.y) / 2));
            const area = dx * dx + dy * dy;
            label.textContent = sh.label === 'area' ? formatNumber(area, digitsOf(sh)) : typeof sh.label === 'function' ? String(sh.label(api)) : sh.label;
          }
        });
        break;
      }
      case 'text': {
        const el = mkText(sh, sh.small ? 'fig-label-sm' : 'fig-label');
        updaters.push(() => {
          const at = typeof sh.at === 'string' ? P[sh.at] : { x: sh.at[0], y: sh.at[1] };
          if (!ok(at)) { el.textContent = ''; return; }
          el.setAttribute('x', sx(at.x) + (sh.dx || 0));
          el.setAttribute('y', sy(at.y) + (sh.dy || 0));
          el.textContent = typeof sh.text === 'function' ? String(sh.text(api)) : sh.text;
        });
        break;
      }
      default:
        console.warn(`[geo] unknown shape kind "${sh.kind}"`);
    }
  }

  /* ------------------------------------------------- point dots, labels */
  const centroidPx = () => {
    let cx = 0;
    let cy = 0;
    let n = 0;
    for (const id of ids) {
      if (defs[id].hidden || !Number.isFinite(P[id].x)) continue;
      cx += sx(P[id].x); cy += sy(P[id].y); n++;
    }
    return n ? { x: cx / n, y: cy / n } : { x: width / 2, y: height / 2 };
  };

  const pointEls = ids.map((id) => {
    const def = defs[id];
    const rec = { id, def };
    if (def.hidden) return rec;
    const labelText = def.label === false ? '' : (def.label != null ? def.label : id);
    if (labelText) { rec.label = s('text.fig-label.fig-math', { 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, labelText); gLabels.appendChild(rec.label); }
    if (def.drag && !def.derive) {
      rec.handle = handle(svg, {
        color: def.color || 'orange',
        label: `Point ${labelText || id}`,
        keyStep: Math.max(4, ((Array.isArray(def.snap) ? def.snap[0] : def.snap) || (x1 - x0) / 40) * k),
        onMove: (hx, hy) => {
          if (readOnly) return;
          const next = constrain(id, { x: ux(hx), y: uy(hy) });
          if (next.x === free[id].x && next.y === free[id].y) return;
          free[id] = next;
          render();
          env.onChange(getState());
        },
      });
      gHandles.appendChild(rec.handle.el);
    } else {
      rec.dot = s('circle', { r: def.r || 5, fill: hue(def.color || 'ink'), stroke: 'var(--surface)', 'stroke-width': 1.5 });
      gDots.appendChild(rec.dot);
    }
    return rec;
  });

  /* ---------------------------------------------------------- readouts */
  const P_ = (id) => P[id];
  const api = {
    P,
    dist: (a, b) => dist(P_(a), P_(b)),
    angle: (a, v, c) => angleDeg(P_(a), P_(v), P_(c)),
    area: (...list) => polygonArea(list.map(P_)),
    perimeter: (...list) => perimeter(list.map(P_)),
    slope: (a, b) => slopeOf(P_(a), P_(b)),
  };
  const readouts = (spec.readouts || []).map((r) => {
    const ro = readout(r.label, { digits: r.digits != null ? r.digits : 1, unit: r.unit, color: r.color });
    if (!env.compact) fr.readouts.appendChild(ro.el);
    return { r, ro };
  });

  function render() {
    resolve();
    for (const fn of updaters) fn();
    const c = centroidPx();
    for (const rec of pointEls) {
      if (rec.def.hidden) continue;
      const p = P[rec.id];
      const visible = Number.isFinite(p.x) && Number.isFinite(p.y);
      const hx = sx(p.x);
      const hy = sy(p.y);
      if (rec.handle) { rec.handle.set(hx, hy); rec.handle.setLabel(`${formatNumber(p.x, 1)}, ${formatNumber(p.y, 1)}`); }
      if (rec.dot) { rec.dot.setAttribute('visibility', visible ? 'visible' : 'hidden'); if (visible) { rec.dot.setAttribute('cx', hx); rec.dot.setAttribute('cy', hy); } }
      if (rec.label) {
        let dx = hx - c.x;
        let dy = hy - c.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) { dx = 0; dy = -1; } else { dx /= len; dy /= len; }
        const off = rec.handle ? 24 : 16;
        rec.label.setAttribute('visibility', visible ? 'visible' : 'hidden');
        if (visible) { // a point that does not exist right now keeps its label where it last was, hidden
          rec.label.setAttribute('x', clamp(hx + dx * off + (rec.def.dx || 0), 10, width - 10));
          rec.label.setAttribute('y', clamp(hy + dy * off + (rec.def.dy || 0), 12, height - 10));
        }
      }
    }
    for (const { r, ro } of readouts) {
      let v;
      try { v = r.value(api); } catch { v = NaN; }
      ro.set(typeof v === 'number' && !Number.isFinite(v) ? '—' : v);
    }
  }

  function getState() {
    const out = {};
    for (const id of ids) if (defs[id].drag && !defs[id].derive) out[id] = { x: free[id].x, y: free[id].y };
    return out;
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      for (const id of ids) {
        if (free[id] && next[id] && Number.isFinite(next[id].x) && Number.isFinite(next[id].y)) free[id] = { x: next[id].x, y: next[id].y };
      }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const rec of pointEls) if (rec.handle) rec.handle.setEnabled(!readOnly);
    },
    destroy() { for (const rec of pointEls) if (rec.handle) rec.handle.destroy(); },
  };
}
