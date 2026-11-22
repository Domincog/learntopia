/**
 * axis-trick — bend a chart's axes and watch its story change.
 *
 * Two modes:
 *
 * 'baseline' — a bar chart whose value axis need not start at zero. Raising
 * the start of the axis turns a small difference into a dramatic one.
 *
 *   {
 *     type: 'axis-trick', mode: 'baseline',
 *     data: [{ label: 'Brand A', value: 96, color: 'gray' }, { label: 'Brand B', value: 98, color: 'pink' }],
 *     top: 100,          // top of the value axis
 *     base: 95,          // where the axis starts
 *     maxBase: 95,       // furthest the slider goes (default: just below the smallest value)
 *     step: 1,           // slider step
 *     locked: false,     // true: no slider, a fixed picture
 *     unit: '%', yLabel: 'satisfied customers',
 *   }
 *   State: { base, looks, truly, heights }
 *     looks — how many times taller the tallest bar is DRAWN than the shortest (null if the shortest has no height left)
 *     truly — how many times larger its value really is
 *
 * 'window' — a line chart over time of which the learner chooses the start
 * and end. Any long series contains short stretches that tell the opposite story.
 *
 *   {
 *     type: 'axis-trick', mode: 'window',
 *     start: 2000, values: [520, 505, …],   // one value per year from `start`
 *     from: 2000, to: 2024,                  // the window shown at first
 *     minSpan: 1,                            // fewest years a window may cover
 *     locked: false,                         // true: no handles, a fixed picture
 *     zero: false,                           // true: value axis always starts at 0 (default: zoom to the window)
 *     yLabel: 'burglaries', unit: '',
 *   }
 *   State: { from, to, span, first, last, change, percent, full }
 *     first, last — values at the two ends of the window · change = last − first
 *     percent     — change as a percentage of `first` · full: the window covers the whole series
 *
 * setState accepts { base } or { from, to }.
 */
import { frame, handle, sliderRow, readout, hue, s, clamp, snapTo, tidy, formatNumber, niceStep, ticks, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('axis-trick', `
  @media (max-width: 520px) { .widget-axis-trick .w-canvas .fig-label { font-size: 16px; } .widget-axis-trick .w-canvas .fig-label-sm { font-size: 13px; } }
`);

const empty = (g) => { while (g.firstChild) g.removeChild(g.firstChild); };

/* ------------------------------------------------------------------ bars */
function baseline(spec, env) {
  const compact = !!env.compact;
  const phone = !compact && typeof matchMedia === 'function' && matchMedia('(max-width: 520px)').matches;
  const data = (spec.data || []).map((d) => ({ label: String(d.label), value: Number(d.value), color: d.color || 'blue' }));
  const values = data.map((d) => d.value);
  const low = Math.min(...values);
  const high = Math.max(...values);
  const top = spec.top != null ? spec.top : Math.ceil(high / 10) * 10;
  const step = spec.step || 1;
  const maxBase = spec.maxBase != null ? spec.maxBase : Math.floor((low - step) / step) * step;
  const unit = spec.unit || '';
  const withUnit = (v) => `${formatNumber(v, 2)}${unit}`;
  let base = clamp(spec.base || 0, 0, maxBase);
  let readOnly = !!env.readOnly;
  const locked = !!spec.locked || compact;

  const W = compact ? 300 : phone ? 440 : 560;
  const H = spec.height || (compact ? 180 : phone ? 300 : 310);
  const pad = compact ? { l: 34, r: 8, t: 20, b: 26 } : { l: spec.yLabel ? 66 : 50, r: 16, t: 30, b: 40 };
  const left = pad.l;
  const right = W - pad.r;
  const yTop = pad.t;
  const yBottom = H - pad.b;
  const fr = frame({ width: W, height: H, compact, plain: compact, label: spec.alt || 'Bar chart' });
  const { svg } = fr;
  const gGrid = s('g');
  const gBars = s('g');
  svg.append(gGrid, gBars);
  if (spec.yLabel && !compact) {
    const my = (yTop + yBottom) / 2;
    svg.appendChild(s('text.axis-label', { x: 16, y: my, 'text-anchor': 'middle', transform: `rotate(-90 16 ${my})` }, spec.yLabel));
  }
  const slot = (right - left) / data.length;
  const barW = Math.min(compact ? 54 : 96, slot * 0.56);
  data.forEach((d, i) => {
    svg.appendChild(s(compact ? 'text.tick-label' : 'text.fig-label', { x: left + slot * (i + 0.5), y: yBottom + (compact ? 16 : 24), 'text-anchor': 'middle' }, d.label));
  });

  const roLooks = readout('as drawn', {});
  const roTruly = readout('in truth', {});
  if (!compact && spec.readouts !== false) fr.readouts.append(roLooks.el, roTruly.el);

  let row = null;
  if (!locked) {
    row = sliderRow({
      label: 'axis starts at', min: 0, max: maxBase, step, value: base, color: 'pink',
      format: (v) => withUnit(v),
      onInput: (v) => { if (readOnly) return; base = v; play('tick'); draw(); env.onChange(getState()); },
    });
    fr.controls.appendChild(row.el);
  }

  function getState() {
    const heights = values.map((v) => tidy(v - base));
    const shortest = Math.min(...heights);
    return {
      base,
      heights,
      looks: shortest > 0 ? tidy(Math.max(...heights) / shortest, 4) : null,
      truly: low > 0 ? tidy(high / low, 4) : null,
    };
  }

  function draw() {
    const st = getState();
    const sy = (v) => yBottom - ((v - base) / (top - base)) * (yBottom - yTop);
    empty(gGrid);
    const yStep = niceStep(top - base, compact ? 3 : 5);
    const marks = ticks(base, top, yStep);
    if (marks[0] !== base) marks.unshift(base);
    for (const v of marks) {
      if (v !== base && sy(v) > yBottom - 13) continue;                 // too close to the bottom label
      gGrid.appendChild(s('line.grid-line', { x1: left, x2: right, y1: sy(v), y2: sy(v) }));
      gGrid.appendChild(s('text.tick-label', {
        x: left - 8, y: sy(v) + 4, 'text-anchor': 'end',
        style: v === base && base > 0 ? `fill:${hue('red', 'text')};font-weight:800` : null,
      }, formatNumber(v, 2)));
    }
    gGrid.appendChild(s('line.axis-line', { x1: left, x2: left, y1: yTop, y2: yBottom }));
    if (base > 0) {
      // a small zigzag: the honest way to mark an axis that does not start at zero
      const y = yBottom - 12;
      gGrid.appendChild(s('path', { d: `M${left} ${y + 9} l-5 -3 l10 -4 l-10 -4 l5 -3`, fill: 'none', stroke: 'var(--surface)', 'stroke-width': 7 }));
      gGrid.appendChild(s('path', { d: `M${left} ${y + 9} l-5 -3 l10 -4 l-10 -4 l5 -3`, fill: 'none', stroke: hue('red'), 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    }
    empty(gBars);
    data.forEach((d, i) => {
      const x = left + slot * (i + 0.5) - barW / 2;
      const y = sy(d.value);
      gBars.appendChild(s('rect', { x, y, width: barW, height: Math.max(1, yBottom - y), rx: 5, fill: hue(d.color), stroke: 'var(--ink)', 'stroke-width': 2.5 }));
      gBars.appendChild(s('text.fig-label', { x: x + barW / 2, y: y - 8, 'text-anchor': 'middle' }, withUnit(d.value)));
    });
    gBars.appendChild(s('line.axis-line', { x1: left, x2: right, y1: yBottom, y2: yBottom }));

    const tall = data[values.indexOf(high)].label;
    const short = data[values.indexOf(low)].label;
    roLooks.set(st.looks == null ? `${short} has no bar left at all` : `${tall} looks ${formatNumber(st.looks, 2)}× as tall`);
    roTruly.set(st.truly == null ? '—' : `${formatNumber(st.truly, 2)}× as large`);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Bar chart: ${data.map((d) => `${d.label} ${withUnit(d.value)}`).join(', ')}. The axis starts at ${withUnit(base)}, so the ${tall} bar is drawn ${st.looks == null ? 'infinitely many' : formatNumber(st.looks, 1)} times as tall as the ${short} bar.`);
  }

  draw();
  if (readOnly) fr.el.classList.add('is-readonly');
  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next || typeof next.base !== 'number') return;
      base = tidy(clamp(snapTo(next.base, step), 0, maxBase));
      if (row) row.set(base);
      draw();
    },
    setReadOnly(v) { readOnly = !!v; fr.el.classList.toggle('is-readonly', readOnly); if (row) row.setDisabled(readOnly); },
  };
}

/* ---------------------------------------------------------------- window */
function timeWindow(spec, env) {
  const compact = !!env.compact;
  const phone = !compact && typeof matchMedia === 'function' && matchMedia('(max-width: 520px)').matches;
  const values = (spec.values || []).map(Number);
  const start = spec.start || 0;
  const end = start + values.length - 1;
  const minSpan = Math.max(1, spec.minSpan || 1);
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const locked = !!spec.locked || compact;
  let from = clamp(spec.from != null ? spec.from : start, start, end - minSpan);
  let to = clamp(spec.to != null ? spec.to : end, from + minSpan, end);
  let readOnly = !!env.readOnly;
  const at = (year) => values[year - start];

  const W = compact ? 300 : phone ? 440 : 560;
  const mainH = compact ? 150 : phone ? 220 : 230;
  const strip = locked ? 0 : 92;                    // overview strip with the two handles
  const H = mainH + 34 + strip;
  const pad = { l: compact ? 36 : spec.yLabel ? 66 : 52, r: compact ? 22 : 26, t: compact ? 14 : 26 };
  const left = pad.l;
  const right = W - pad.r;
  const yTop = pad.t;
  const yBottom = mainH;
  const fr = frame({ width: W, height: H, compact, plain: compact, label: spec.alt || 'Line chart' });
  const { svg } = fr;
  const gMain = s('g');
  svg.appendChild(gMain);
  if (spec.yLabel && !compact) {
    const my = (yTop + yBottom) / 2;
    svg.appendChild(s('text.axis-label', { x: 16, y: my, 'text-anchor': 'middle', transform: `rotate(-90 16 ${my})` }, spec.yLabel));
  }

  // overview strip: the whole series, with the chosen window highlighted
  const oTop = mainH + 50;
  const oBottom = oTop + 40;
  const ox = (year) => left + ((year - start) / (end - start)) * (right - left);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const oy = (v) => oBottom - ((v - lo) / (hi - lo || 1)) * (oBottom - oTop);
  const shade = s('rect', { y: oTop - 6, height: oBottom - oTop + 12, rx: 6, fill: hue('pink', 'soft'), stroke: hue('pink'), 'stroke-width': 2 });
  const handles = {};
  if (!locked) {
    svg.appendChild(shade);
    svg.appendChild(s('path', {
      d: values.map((v, i) => `${i ? 'L' : 'M'}${ox(start + i).toFixed(1)} ${oy(v).toFixed(1)}`).join(''),
      fill: 'none', stroke: 'var(--ink-2)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
    }));
    svg.appendChild(s('text.tick-label', { x: left, y: oBottom + 30, 'text-anchor': 'start' }, String(start)));
    svg.appendChild(s('text.tick-label', { x: right, y: oBottom + 30, 'text-anchor': 'end' }, String(end)));
    svg.appendChild(s('text.axis-label', { x: (left + right) / 2, y: oBottom + 30, 'text-anchor': 'middle' }, 'drag the handles'));
    for (const key of ['from', 'to']) {
      handles[key] = handle(svg, {
        r: 10, color: 'pink', label: key === 'from' ? 'First year of the window' : 'Last year of the window', keyStep: (right - left) / (end - start),
        onMove: (px) => {
          if (readOnly) return;
          const year = Math.round(start + ((px - left) / (right - left)) * (end - start));
          const next = key === 'from' ? clamp(year, start, to - minSpan) : clamp(year, from + minSpan, end);
          if (next === (key === 'from' ? from : to)) return;
          if (key === 'from') from = next; else to = next;
          play('tick');
          draw();
          env.onChange(getState());
        },
      });
      svg.appendChild(handles[key].el);
    }
  }

  const roSpan = readout('window', {});
  const roChange = readout('change', {});
  if (!compact) fr.readouts.append(roSpan.el, roChange.el);

  function getState() {
    const first = at(from);
    const last = at(to);
    return {
      from, to, span: to - from, first, last,
      change: tidy(last - first),
      percent: first ? tidy(((last - first) / first) * 100, 2) : 0,
      full: from === start && to === end,
    };
  }

  function draw() {
    const st = getState();
    const shown = [];
    for (let year = from; year <= to; year++) shown.push([year, at(year)]);
    let y0 = spec.zero ? 0 : Math.min(...shown.map((p) => p[1]));
    let y1 = Math.max(...shown.map((p) => p[1]));
    const room = Math.max((y1 - y0) * 0.18, (hi - lo) * 0.02, 1);
    if (!spec.zero) y0 -= room;
    y1 += room;
    const yStep = niceStep(y1 - y0, compact ? 3 : 4);
    y0 = spec.zero ? 0 : Math.floor(y0 / yStep) * yStep;
    y1 = Math.ceil(y1 / yStep) * yStep;
    const sx = (year) => left + ((year - from) / (to - from)) * (right - left);
    const sy = (v) => yBottom - ((v - y0) / (y1 - y0)) * (yBottom - yTop);

    empty(gMain);
    for (const v of ticks(y0, y1, yStep)) {
      gMain.appendChild(s('line.grid-line', { x1: left, x2: right, y1: sy(v), y2: sy(v) }));
      gMain.appendChild(s('text.tick-label', { x: left - 8, y: sy(v) + 4, 'text-anchor': 'end' }, formatNumber(v, 1)));
    }
    gMain.appendChild(s('line.axis-line', { x1: left, x2: right, y1: yBottom, y2: yBottom }));
    const span = to - from;
    const every = span <= (phone || compact ? 6 : 10) ? 1 : span <= (phone || compact ? 12 : 20) ? 2 : 5;
    for (let year = from; year <= to; year++) {
      if ((year - from) % every && year !== to) continue;
      if (year !== to && (to - year) < every && every > 1) continue;      // keep the last label clear of its neighbour
      gMain.appendChild(s('line.axis-line', { x1: sx(year), x2: sx(year), y1: yBottom, y2: yBottom + 5, 'stroke-width': 1.5 }));
      gMain.appendChild(s('text.tick-label', { x: sx(year), y: yBottom + 20, 'text-anchor': 'middle' }, String(year)));
    }
    gMain.appendChild(s('path', {
      d: shown.map((p, i) => `${i ? 'L' : 'M'}${sx(p[0]).toFixed(1)} ${sy(p[1]).toFixed(1)}`).join(''),
      fill: 'none', stroke: hue('blue'), 'stroke-width': compact ? 3 : 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round',
    }));
    if (span <= 30 && !compact) for (const p of shown.slice(1, -1)) gMain.appendChild(s('circle', { cx: sx(p[0]), cy: sy(p[1]), r: 3.5, fill: hue('blue'), stroke: 'var(--edge-strong)', 'stroke-width': 1.5 }));
    for (const [year, v, anchor] of [[from, st.first, 'start'], [to, st.last, 'end']]) {
      gMain.appendChild(s('circle', { cx: sx(year), cy: sy(v), r: compact ? 5 : 7, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
      if (!compact) gMain.appendChild(s('text.fig-label', { x: sx(year) + (anchor === 'start' ? -2 : 2), y: sy(v) - 13, 'text-anchor': anchor }, `${formatNumber(v, 1)}${unit}`));
    }

    if (!locked) {
      shade.setAttribute('x', ox(from));
      shade.setAttribute('width', Math.max(2, ox(to) - ox(from)));
      handles.from.set(ox(from), oBottom + 6);
      handles.to.set(ox(to), oBottom + 6);
      handles.from.setLabel(String(from));
      handles.to.setLabel(String(to));
    }
    const sign = st.change > 0 ? 'up' : st.change < 0 ? 'down' : 'no change';
    roSpan.set(`${from} to ${to}`);
    roChange.set(st.change === 0 ? 'none' : `${sign} ${formatNumber(Math.abs(st.percent), 0)}%`);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Line chart from ${from} to ${to}: from ${formatNumber(st.first, 1)} to ${formatNumber(st.last, 1)}${unit}, ${st.change === 0 ? 'no change' : `${sign} ${formatNumber(Math.abs(st.percent), 0)} percent`}.`);
  }

  draw();
  if (readOnly) fr.el.classList.add('is-readonly');
  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      const a = typeof next.from === 'number' ? Math.round(next.from) : from;
      const b = typeof next.to === 'number' ? Math.round(next.to) : to;
      from = clamp(a, start, end - minSpan);
      to = clamp(b, from + minSpan, end);
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in handles) handles[key].setEnabled(!readOnly);
    },
    destroy() { for (const key in handles) handles[key].destroy(); },
  };
}

export default function create(spec, env) {
  return spec.mode === 'window' ? timeWindow(spec, env) : baseline(spec, env);
}

export const examples = [
  {
    title: 'axis-trick — baseline: slide the start of the axis',
    spec: {
      type: 'axis-trick', mode: 'baseline', top: 100, base: 0, maxBase: 95, unit: '%', yLabel: 'satisfied customers',
      data: [{ label: 'Brand A', value: 96, color: 'gray' }, { label: 'Brand B', value: 98, color: 'pink' }],
    },
  },
  {
    title: 'axis-trick — window: choose which years to show',
    spec: {
      type: 'axis-trick', mode: 'window', start: 2000, from: 2000, to: 2024, yLabel: 'burglaries',
      values: [520, 505, 512, 480, 462, 470, 441, 420, 432, 455, 428, 398, 380, 362, 371, 340, 322, 310, 289, 268, 242, 251, 278, 296, 284],
    },
  },
];
