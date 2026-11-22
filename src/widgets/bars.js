/**
 * bars — bar chart (single or grouped series). Static by default; with
 * `adjust: true` the learner drags the bars, which is great for
 * "sketch your prediction, then see the data" steps.
 *
 * Simple form:
 *   { type: 'bars', data: [{ label: 'Mon', value: 3, color: 'blue' }, …], yMax: 10, unit: '%' }
 *
 * Grouped form:
 *   {
 *     type: 'bars',
 *     categories: ['After 5 minutes', 'After 1 week'],
 *     series: [
 *       { name: 'Re-read', color: 'gray', values: [80, 40] },
 *       { name: 'Self-test', color: 'orange', values: [70, 60] },
 *     ],
 *     yMax: 100, yStep: 20, yLabel: '% remembered', unit: '%',
 *     adjust: true,          // or [1] to make only series 1 draggable
 *     step: 5,               // snap for dragging
 *     showValues: true,
 *   }
 *
 * State: { values: [[…series 0…], [… series 1 …]] }   (simple form: one inner array)
 * Each bar is also keyboard-adjustable (focus it, ↑ / ↓).
 */
import { frame, plane, hue, s, h, clamp, snapTo, tidy, niceStep, ticks, formatNumber, svgPoint } from './kit.js';

export default function create(spec, env) {
  const simple = Array.isArray(spec.data);
  const categories = simple ? spec.data.map((d) => d.label) : (spec.categories || []);
  const series = simple
    ? [{ name: '', color: null, values: spec.data.map((d) => d.value) }]
    : (spec.series || []).map((sr) => ({ ...sr, values: sr.values.slice() }));
  const values = series.map((sr) => sr.values.slice());
  const colorOf = (si, ci) => (simple ? (spec.data[ci].color || spec.color || 'blue') : (series[si].color || 'blue'));
  const adjustable = (si) => spec.adjust === true || (Array.isArray(spec.adjust) && spec.adjust.includes(si));
  let readOnly = !!env.readOnly;

  const width = spec.width || 560;
  const height = spec.height || (env.compact ? 220 : 320);
  const all = values.flat();
  const yMin = Math.min(0, spec.yMin != null ? spec.yMin : Math.min(...all, 0));
  const rawMax = spec.yMax != null ? spec.yMax : Math.max(...all, 1);
  const yStep = spec.yStep || niceStep(rawMax - yMin, 5);
  const yMax = spec.yMax != null ? spec.yMax : Math.ceil(rawMax / yStep) * yStep;
  const fr = frame({ width, height, compact: env.compact, plain: spec.plain !== false, label: spec.alt || 'Bar chart' });
  const { svg } = fr;
  const pl = plane({ x: [0, categories.length], y: [yMin, yMax], width, height, pad: { l: spec.yLabel ? 56 : 44, r: 12, t: 26, b: 40 } });
  const unit = spec.unit || '';
  const fmt = (v) => formatNumber(v, spec.digits != null ? spec.digits : 1) + (/^[%°]/.test(unit) ? unit : unit ? ` ${unit}` : '');

  /* axes */
  for (const v of ticks(yMin, yMax, yStep)) {
    svg.appendChild(s('line.grid-line', { x1: pl.left, x2: pl.right, y1: pl.sy(v), y2: pl.sy(v) }));
    svg.appendChild(s('text.tick-label', { x: pl.left - 8, y: pl.sy(v) + 4, 'text-anchor': 'end' }, formatNumber(v, 4)));
  }
  if (spec.yLabel) svg.appendChild(s('text.axis-label', { x: 14, y: (pl.top + pl.bottom) / 2, 'text-anchor': 'middle', transform: `rotate(-90 14 ${(pl.top + pl.bottom) / 2})` }, spec.yLabel));
  categories.forEach((label, ci) => {
    const lines = String(label).split('\n');
    lines.forEach((line, li) => svg.appendChild(s('text.tick-label', { x: pl.sx(ci + 0.5), y: pl.bottom + 18 + li * 14, 'text-anchor': 'middle', style: 'font-size:13px;font-weight:700' }, line)));
  });

  /* bars */
  const groupW = pl.kx * 0.72;
  const barW = Math.min(64, groupW / series.length);
  const bars = [];
  const gBars = s('g');
  svg.appendChild(gBars);
  svg.appendChild(s('line.axis-line', { x1: pl.left, x2: pl.right, y1: pl.sy(0), y2: pl.sy(0) }));

  series.forEach((sr, si) => {
    categories.forEach((_, ci) => {
      const x = pl.sx(ci + 0.5) - (barW * series.length) / 2 + si * barW;
      const rect = s('rect', { x: x + 2, width: barW - 4, rx: 5, fill: hue(colorOf(si, ci)), stroke: 'var(--ink)', 'stroke-width': 2.5 });
      const label = s('text.fig-label-sm', { x: x + barW / 2, 'text-anchor': 'middle' });
      const g = s('g', rect, label);
      const rec = { si, ci, rect, label, g, x };
      if (adjustable(si)) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'slider');
        g.setAttribute('aria-label', `${sr.name ? sr.name + ', ' : ''}${categories[ci]}`.replace(/\n/g, ' '));
        g.classList.add('w-bar-adjust');
        g.dataset.keys = 'own';
        rec.grip = s('rect', { x: x + barW / 2 - 13, width: 26, height: 7, rx: 3.5, fill: 'var(--surface)', stroke: 'var(--ink)', 'stroke-width': 2 });
        rec.hit = s('rect', { x, y: pl.top, width: barW, height: pl.ih, fill: 'transparent', style: 'cursor:ns-resize;touch-action:none' });
        g.append(rec.grip, rec.hit);
        const setFromEvent = (ev) => {
          if (readOnly) return;
          const p = svgPoint(svg, ev);
          const v = tidy(clamp(snapTo(pl.uy(p.y), spec.step || yStep / 4), yMin, yMax));
          if (v === values[si][ci]) return;
          values[si][ci] = v;
          paint(rec);
          env.onChange(getState());
        };
        let dragging = false;
        rec.hit.addEventListener('pointerdown', (ev) => { if (readOnly) return; dragging = true; try { rec.hit.setPointerCapture(ev.pointerId); } catch { /* ignore */ } setFromEvent(ev); ev.preventDefault(); });
        rec.hit.addEventListener('pointermove', (ev) => { if (dragging) setFromEvent(ev); });
        const stop = () => { dragging = false; };
        rec.hit.addEventListener('pointerup', stop);
        rec.hit.addEventListener('pointercancel', stop);
        g.addEventListener('keydown', (ev) => {
          if (readOnly) return;
          const st = (spec.step || yStep / 4) * (ev.shiftKey ? 5 : 1);
          let v = values[si][ci];
          if (ev.key === 'ArrowUp' || ev.key === 'ArrowRight') v += st;
          else if (ev.key === 'ArrowDown' || ev.key === 'ArrowLeft') v -= st;
          else return;
          ev.preventDefault();
          values[si][ci] = tidy(clamp(v, yMin, yMax));
          paint(rec);
          env.onChange(getState());
        });
      }
      bars.push(rec);
      gBars.appendChild(g);
    });
  });

  function paint(rec) {
    const v = values[rec.si][rec.ci];
    const y = pl.sy(Math.max(v, 0));
    const hgt = Math.max(1.5, Math.abs(pl.sy(v) - pl.sy(0)));
    rec.rect.setAttribute('y', y);
    rec.rect.setAttribute('height', hgt);
    rec.label.setAttribute('y', (v >= 0 ? y : y + hgt + 16) - 7);
    rec.label.textContent = spec.showValues === false ? '' : fmt(v);
    if (rec.grip) rec.grip.setAttribute('y', pl.sy(v) - 3.5);
    rec.g.setAttribute('aria-valuetext', fmt(v));
  }

  /* legend */
  if (!simple && series.some((sr) => sr.name) && !env.compact) {
    fr.el.insertBefore(h('div.w-legend', series.map((sr) => h('span.w-legend-item',
      h('i', { style: { background: hue(sr.color || 'blue') } }), sr.name))), fr.canvas);
  }

  const getState = () => ({ values: values.map((row) => row.slice()) });
  bars.forEach(paint);
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || !Array.isArray(next.values)) return;
      next.values.forEach((row, si) => { if (values[si] && Array.isArray(row)) row.forEach((v, ci) => { if (typeof v === 'number' && ci < values[si].length) values[si][ci] = v; }); });
      bars.forEach(paint);
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); },
  };
}
