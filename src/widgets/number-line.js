/**
 * number-line — a number line with draggable points, fixed marks, shaded
 * ranges and "hop" arrows.
 *
 * {
 *   type: 'number-line',
 *   min: -10, max: 10,
 *   step: 1,                    // handles snap to multiples of this
 *   tick: 1, major: 5,          // minor tick spacing / labelled tick spacing (auto if omitted)
 *   points: [{ id: 'a', value: 0, drag: true, color: 'orange', label: 'a', showValue: true }],
 *   marks:  [{ value: 3.5, label: '3.5', color: 'blue' }],
 *   ranges: [{ from: 'a', to: 10, color: 'blue', openFrom: true }],   // ends: numbers or point ids
 *   hops:   [{ from: 2, to: 5, label: '+3', color: 'green' }],        // arcs above the line
 * }
 *
 * State: { a: 0 }  — one number per draggable point.
 */
import { frame, handle, hue, s, clamp, snapTo, tidy, niceStep, ticks, formatNumber } from './kit.js';

export default function create(spec, env) {
  const min = spec.min != null ? spec.min : 0;
  const max = spec.max != null ? spec.max : 10;
  const hops = spec.hops || [];
  const width = spec.width || 560;
  const height = spec.height || (hops.length ? 150 : 110);
  const padX = 34;
  const y0 = height - 48;
  const fr = frame({ width, height, plain: true, compact: env.compact, label: spec.alt || 'Number line' });
  const { svg } = fr;
  const sx = (v) => padX + ((v - min) / (max - min)) * (width - 2 * padX);
  const ux = (px) => min + ((px - padX) / (width - 2 * padX)) * (max - min);
  let readOnly = !!env.readOnly;

  const pointDefs = (spec.points || []).map((p, i) => ({ id: `p${i}`, ...p }));
  const state = {};
  for (const p of pointDefs) state[p.id] = Number(p.value) || 0;
  const valueOf = (ref) => (typeof ref === 'number' ? ref : state[ref]);

  /* static: line, ticks, labels */
  const major = spec.major || niceStep(max - min, 10);
  const minor = spec.tick || (spec.step && (max - min) / spec.step <= 40 ? spec.step : major / (major % 2 === 0 || major >= 5 ? 5 : 2));
  const fmt = spec.format || ((v) => formatNumber(v, 4));
  const gRange = s('g');
  svg.appendChild(gRange);
  svg.appendChild(s('line.axis-line', { x1: padX - 18, x2: width - padX + 18, y1: y0, y2: y0, 'stroke-width': 3, 'stroke-linecap': 'round' }));
  svg.appendChild(s('path', { d: `M${padX - 18} ${y0} l8 -6 M${padX - 18} ${y0} l8 6 M${width - padX + 18} ${y0} l-8 -6 M${width - padX + 18} ${y0} l-8 6`, class: 'axis-line', fill: 'none', 'stroke-linecap': 'round' }));
  if ((max - min) / minor <= 100) {
    for (const v of ticks(min, max, minor)) svg.appendChild(s('line.axis-line', { x1: sx(v), x2: sx(v), y1: y0 - 6, y2: y0 + 6, 'stroke-width': 1.5 }));
  }
  for (const v of ticks(min, max, major)) {
    svg.appendChild(s('line.axis-line', { x1: sx(v), x2: sx(v), y1: y0 - 10, y2: y0 + 10 }));
    svg.appendChild(s('text.tick-label', { x: sx(v), y: y0 + 28, 'text-anchor': 'middle', style: 'font-size:13px' }, fmt(v)));
  }

  /* hops */
  for (const hop of hops) {
    const a = sx(hop.from);
    const b = sx(hop.to);
    const lift = Math.min(60, 22 + Math.abs(b - a) * 0.28);
    const color = hue(hop.color || 'green');
    svg.appendChild(s('path', { d: `M${a} ${y0 - 12} Q${(a + b) / 2} ${y0 - 12 - lift * 1.6} ${b} ${y0 - 12}`, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    const dir = b >= a ? 1 : -1;
    svg.appendChild(s('path', { d: `M${b} ${y0 - 12} l${-9 * dir} ${-3} M${b} ${y0 - 12} l${-3 * dir} ${-10}`, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    if (hop.label) svg.appendChild(s('text.fig-label', { x: (a + b) / 2, y: y0 - 18 - lift * 0.8, 'text-anchor': 'middle', style: `fill:${hue(hop.color || 'green', 'text')}` }, hop.label));
  }

  /* marks */
  for (const m of spec.marks || []) {
    svg.appendChild(s('circle', { cx: sx(m.value), cy: y0, r: 7, fill: m.hollow ? 'var(--surface)' : hue(m.color || 'blue'), stroke: m.hollow ? hue(m.color || 'blue') : 'var(--edge-strong)', 'stroke-width': m.hollow ? 3 : 2 }));
    if (m.label) svg.appendChild(s('text.fig-label', { x: sx(m.value), y: y0 - 16, 'text-anchor': 'middle', style: `fill:${hue(m.color || 'blue', 'text')}` }, m.label));
  }

  /* ranges (dynamic) */
  const ranges = (spec.ranges || []).map((r) => {
    const line = s('line', { stroke: hue(r.color || 'blue'), 'stroke-width': 9, 'stroke-linecap': 'butt', opacity: 0.55, y1: y0, y2: y0 });
    const capA = s('circle', { cy: y0, r: 7, 'stroke-width': 3, stroke: hue(r.color || 'blue') });
    const capB = s('circle', { cy: y0, r: 7, 'stroke-width': 3, stroke: hue(r.color || 'blue') });
    gRange.append(line, capA, capB);
    return { r, line, capA, capB };
  });

  /* points */
  const gPts = s('g');
  svg.appendChild(gPts);
  const points = pointDefs.map((p) => {
    const rec = { def: p };
    rec.label = s('text.fig-label', { 'text-anchor': 'middle', style: `fill:${hue(p.color || 'orange', 'text')}` });
    gPts.appendChild(rec.label);
    if (p.drag !== false) {
      rec.handle = handle(svg, {
        color: p.color || 'orange',
        r: 11,
        label: p.label ? `Point ${p.label}` : 'Point on the number line',
        keyStep: Math.max(3, (spec.step || (max - min) / 50) * ((width - 2 * padX) / (max - min))),
        onMove: (px) => {
          if (readOnly) return;
          const v = tidy(clamp(snapTo(ux(px), spec.step), p.min != null ? p.min : min, p.max != null ? p.max : max));
          if (v === state[p.id]) return;
          state[p.id] = v;
          render();
          env.onChange(getState());
        },
      });
      gPts.appendChild(rec.handle.el);
    } else {
      rec.dot = s('circle', { cy: y0, r: 8, fill: hue(p.color || 'orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 });
      gPts.appendChild(rec.dot);
    }
    return rec;
  });

  function render() {
    for (const { r, line, capA, capB } of ranges) {
      const from = r.from == null ? min - (max - min) : valueOf(r.from);
      const to = r.to == null ? max + (max - min) : valueOf(r.to);
      line.setAttribute('x1', clamp(sx(from), padX - 16, width - padX + 16));
      line.setAttribute('x2', clamp(sx(to), padX - 16, width - padX + 16));
      const cap = (el, v, open, show) => {
        el.setAttribute('visibility', show ? 'visible' : 'hidden');
        el.setAttribute('cx', sx(v));
        el.setAttribute('fill', open ? 'var(--surface)' : hue(r.color || 'blue'));
      };
      cap(capA, from, r.openFrom, r.from != null && typeof r.from === 'number');
      cap(capB, to, r.openTo, r.to != null && typeof r.to === 'number');
    }
    for (const rec of points) {
      const v = state[rec.def.id];
      const px = sx(v);
      if (rec.handle) { rec.handle.set(px, y0); rec.handle.setLabel(fmt(v)); } else rec.dot.setAttribute('cx', px);
      rec.label.setAttribute('x', px);
      rec.label.setAttribute('y', y0 - 20);
      const showValue = rec.def.showValue !== false;
      rec.label.textContent = rec.def.label ? (showValue ? `${rec.def.label} = ${fmt(v)}` : rec.def.label) : (showValue ? fmt(v) : '');
    }
  }

  const getState = () => ({ ...state });
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      for (const p of pointDefs) if (typeof next[p.id] === 'number') state[p.id] = next[p.id];
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const rec of points) if (rec.handle) rec.handle.setEnabled(!readOnly);
    },
    destroy() { for (const rec of points) if (rec.handle) rec.handle.destroy(); },
  };
}
