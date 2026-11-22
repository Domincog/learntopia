/**
 * histogram-lab — one data set, many histograms. The learner changes the bin
 * width with a slider and watches the shape appear (and dissolve again), can
 * hunt for the median with a draggable marker, and can lay a normal curve
 * with its 1 / 2 / 3 SD bands over the bars.
 *
 * {
 *   type: 'histogram-lab',
 *   data: [12.3, 14.1, …],          // the raw values
 *   min: 0, max: 45,                // ends of the axis; bins start at min
 *   widths: [1, 3, 5, 9, 15, 45],   // bin widths offered by the slider (omit for a fixed picture)
 *   width: 5,                       // bin width at the start
 *   show: ['mean', 'median'],       // markers drawn from the start
 *   reveal: ['mean'],               // markers that appear once the step is resolved (the widget is locked)
 *   rug: true,                      // a small tick under the axis for every single value
 *   curve: true,                    // overlay the normal curve that has the data's mean and SD
 *   band: 1,                        // shade mean ± this many SDs (0: no band) …
 *   bandSlider: true,               //   … and let the learner choose 1, 2 or 3
 *   guess: { value: 60, step: 1 },  // a marker the learner drags along the axis
 *   xLabel: 'minutes', xStep: 5,    // axis caption and spacing of the numbered ticks
 *   unit: 'min',                    // appended to values in labels
 *   color: 'blue', digits: 1, height: 310,
 * }
 *
 * State: { width, bins, counts, tallest, n, mean, median, sd, band, inside, guess, below }
 *   counts  — values per bin, left to right (a value on a boundary belongs to the bin on its right)
 *   inside  — percentage of the data within mean ± band·SD (null without a band)
 *   below   — percentage of the data to the left of the draggable marker (null without one)
 *   sd      — divides by n
 *
 * setState accepts { width }, { band } and { guess }.
 */
import { frame, handle, sliderRow, readout, hue, s, clamp, snapTo, tidy, formatNumber, niceStep, ticks, addStyles } from './kit.js';
import { play } from '../core/audio.js';

addStyles('histogram-lab', `
  .widget-histogram-lab .hl-rug { stroke: var(--ink); stroke-width: 1; opacity: 0.32; }
  @media (max-width: 520px) { .widget-histogram-lab .w-canvas .fig-label { font-size: 16px; } }
`);

/** How many values fall in each bin of the given width, starting at `min`. */
export function binCounts(data, min, max, width) {
  const bins = Math.max(1, Math.ceil((max - min) / width - 1e-9));
  const counts = new Array(bins).fill(0);
  for (const v of data) {
    if (v < min || v > max) continue;
    counts[Math.min(bins - 1, Math.floor((v - min) / width + 1e-9))] += 1;
  }
  return counts;
}

/** Mean, median and standard deviation (dividing by n). */
export function summary(data) {
  const sorted = data.slice().sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((t, v) => t + v, 0) / n;
  const m = Math.floor(n / 2);
  const median = n % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
  const sd = Math.sqrt(sorted.reduce((t, v) => t + (v - mean) * (v - mean), 0) / n);
  return { n, mean, median, sd, sorted };
}

const MARK = {
  mean: { hue: 'orange', dash: null, name: 'mean' },
  median: { hue: 'violet', dash: '3 6', name: 'median' },
};

export default function create(spec, env) {
  const compact = !!env.compact;
  const phone = !compact && typeof matchMedia === 'function' && matchMedia('(max-width: 520px)').matches;
  const data = (spec.data || []).map(Number).filter(Number.isFinite);
  const st = summary(data.length ? data : [0]);
  const min = spec.min != null ? spec.min : Math.floor(st.sorted[0]);
  const max = spec.max != null ? spec.max : Math.ceil(st.sorted[st.n - 1]);
  const widths = Array.isArray(spec.widths) && spec.widths.length > 1 ? spec.widths : null;
  let width = spec.width || (widths ? widths[Math.floor(widths.length / 2)] : niceStep(max - min, 10));
  const digits = spec.digits != null ? spec.digits : 1;
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const fmt = (v) => formatNumber(v, digits);
  const color = spec.color || 'blue';
  const shown = new Set(spec.show || []);
  const later = new Set((spec.reveal || []).filter((k) => !shown.has(k)));
  let band = clamp(Math.round(spec.band || 0), 0, 3);
  const guessSpec = spec.guess == null ? null : (typeof spec.guess === 'object' ? spec.guess : { value: spec.guess });
  const guessStep = guessSpec ? guessSpec.step || niceStep(max - min, 60) : 1;
  let guess = guessSpec ? Number(guessSpec.value != null ? guessSpec.value : (min + max) / 2) : null;
  let readOnly = !!env.readOnly;

  /* ------------------------------------------------------------ geometry */
  const laneKeys = compact ? [] : ['guess', 'median', 'mean'].filter((k) => (k === 'guess' ? !!guessSpec : shown.has(k) || later.has(k)));
  const LINE = phone ? 23 : 21;
  const lane = laneKeys.length ? 8 + LINE * laneKeys.length : 12;
  const W = compact ? 300 : phone ? 440 : 560;
  const body = spec.height || (compact ? 150 : phone ? 270 : 290);
  const pad = compact ? { l: 8, r: 8, t: 8, b: 8 } : { l: 44, r: 14, t: lane, b: (spec.xLabel ? 50 : 30) + (spec.rug ? 8 : 0) };
  const H = compact ? body : body + lane + pad.b - 42;
  const left = pad.l;
  const right = W - pad.r;
  const top = pad.t;
  const bottom = H - pad.b;
  const kx = (right - left) / (max - min);
  const sx = (v) => left + (v - min) * kx;
  const ux = (px) => min + (px - left) / kx;
  const textW = (text) => text.length * (phone ? 8.9 : 8.3);
  const within = (x, text) => clamp(x, 4 + textW(text) / 2, W - 4 - textW(text) / 2);

  const fr = frame({ width: W, height: H, compact, plain: compact, label: spec.alt || 'Histogram' });
  const { svg } = fr;

  /* ------------------------------------------------- layers, back to front */
  const gGrid = s('g');
  const bandRect = s('rect', { y: top, height: bottom - top, fill: hue('teal', 'soft'), opacity: 0.85, visibility: 'hidden' });
  const gBars = s('g');
  const curve = spec.curve ? s('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': compact ? 2 : 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }) : null;
  const bandEdges = s('path', { fill: 'none', stroke: hue('teal', 'text'), 'stroke-width': 2.5, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round', visibility: 'hidden' });
  const gMarks = s('g');
  svg.append(gGrid, bandRect, gBars, bandEdges);
  if (curve) svg.appendChild(curve);

  // x axis (fixed)
  const gAxis = s('g');
  gAxis.appendChild(s('line.axis-line', { x1: left, x2: right, y1: bottom, y2: bottom }));
  if (!compact) {
    let xStep = spec.xStep || niceStep(max - min, 9);
    while ((kx * xStep) < textW(formatNumber(max, 4)) + 10) xStep *= 2;       // never let the numbers collide
    const yTicks = bottom + (spec.rug ? 26 : 18);
    for (const v of ticks(min, max, xStep)) {
      gAxis.appendChild(s('line.axis-line', { x1: sx(v), x2: sx(v), y1: bottom, y2: bottom + 5, 'stroke-width': 1.5 }));
      gAxis.appendChild(s('text.tick-label', { x: sx(v), y: yTicks, 'text-anchor': 'middle' }, formatNumber(v, 4)));
    }
    if (spec.xLabel) gAxis.appendChild(s('text.axis-label', { x: (left + right) / 2, y: H - 7, 'text-anchor': 'middle' }, spec.xLabel));
    if (spec.rug) for (const v of data) if (v >= min && v <= max) gAxis.appendChild(s('line.hl-rug', { x1: sx(v), x2: sx(v), y1: bottom + 4, y2: bottom + 11 }));
  }
  svg.append(gAxis, gMarks);

  // marker lines and their labels: one line of text each, so they can never collide
  const marks = {};
  for (const key of ['median', 'mean']) {
    if (!shown.has(key) && !later.has(key)) continue;
    const row = laneKeys.indexOf(key);
    const yText = 4 + LINE * (row + 1) - 5;
    const line = s('line', { y1: top - (compact ? 0 : 3), y2: bottom, stroke: hue(MARK[key].hue), 'stroke-width': compact ? 2.5 : 3.5, 'stroke-dasharray': MARK[key].dash, 'stroke-linecap': 'round' });
    const label = compact ? null : s('text.fig-label', { y: yText, 'text-anchor': 'middle', style: `fill:${hue(MARK[key].hue, 'text')}` });
    gMarks.appendChild(line);
    if (label) gMarks.appendChild(label);
    marks[key] = { line, label };
  }
  let guessLine = null;
  let guessLabel = null;
  let guessHandle = null;
  if (guessSpec && !compact) {
    const yText = 4 + LINE - 5;
    guessLine = s('line', { y1: top - 3, y2: bottom, stroke: 'var(--ink)', 'stroke-width': 3, 'stroke-linecap': 'round' });
    guessLabel = s('text.fig-label', { y: yText, 'text-anchor': 'middle' });
    gMarks.append(guessLine, guessLabel);
    guessHandle = handle(svg, {
      r: 11, color: 'orange', label: guessSpec.label || 'Marker', keyStep: Math.max(2, kx * guessStep),
      onMove: (px) => {
        if (readOnly) return;
        const v = tidy(clamp(snapTo(ux(px), guessStep), min, max));
        if (v === guess) return;
        guess = v;
        draw();
        env.onChange(getState());
      },
    });
    svg.appendChild(guessHandle.el);
  }

  /* ------------------------------------------------------------ controls */
  const roInside = readout('inside the band', { digits: 1, unit: '%', color: 'teal' });
  const roBelow = readout('left of the marker', { digits: 0, unit: '%' });
  const roAbove = readout('right of it', { digits: 0, unit: '%' });
  if (!compact && (band || spec.bandSlider)) fr.readouts.appendChild(roInside.el);
  if (!compact && guessSpec) fr.readouts.append(roBelow.el, roAbove.el);

  let widthRow = null;
  if (widths && !compact) {
    widthRow = sliderRow({
      label: 'bin width', min: 0, max: widths.length - 1, step: 1, value: Math.max(0, widths.indexOf(width)), color,
      format: (i) => `${formatNumber(widths[i], 4)}${unit}`,
      onInput: (i) => { if (readOnly) return; width = widths[i]; play('tick'); draw(); env.onChange(getState()); },
    });
    fr.controls.appendChild(widthRow.el);
  }
  let bandRow = null;
  if (spec.bandSlider && !compact) {
    band = band || 1;
    bandRow = sliderRow({
      label: 'band', min: 1, max: 3, step: 1, value: band, color: 'teal',
      format: (k) => `mean ± ${k} SD`,
      onInput: (k) => { if (readOnly) return; band = k; play('tick'); draw(); env.onChange(getState()); },
    });
    fr.controls.appendChild(bandRow.el);
  }

  /* --------------------------------------------------------------- state */
  const share = (test) => (data.length ? (100 * data.filter(test).length) / data.length : 0);
  function getState() {
    const counts = binCounts(data, min, max, width);
    return {
      width, bins: counts.length, counts, tallest: Math.max(0, ...counts),
      n: st.n, mean: tidy(st.mean, 4), median: tidy(st.median, 4), sd: tidy(st.sd, 4),
      band: band || null,
      inside: band ? tidy(share((v) => Math.abs(v - st.mean) <= band * st.sd), 2) : null,
      guess,
      below: guess == null ? null : tidy(share((v) => v < guess) + share((v) => v === guess) / 2, 2),
    };
  }

  /* ---------------------------------------------------------------- draw */
  const empty = (g) => { while (g.firstChild) g.removeChild(g.firstChild); };
  function draw() {
    const state = getState();
    const { counts } = state;
    const peak = spec.curve ? Math.max(state.tallest, (st.n * width) / (st.sd * Math.sqrt(2 * Math.PI))) : state.tallest;
    const yStep = Math.max(1, niceStep(Math.max(1, peak), 4));
    const yMax = Math.max(yStep, Math.ceil(Math.max(1, peak) / yStep - 1e-9) * yStep);
    const sy = (c) => bottom - (c / yMax) * (bottom - top);

    empty(gGrid);
    if (!compact) {
      for (const v of ticks(0, yMax, yStep)) {
        gGrid.appendChild(s('line.grid-line', { x1: left, x2: right, y1: sy(v), y2: sy(v) }));
        gGrid.appendChild(s('text.tick-label', { x: left - 7, y: sy(v) + 4, 'text-anchor': 'end' }, formatNumber(v, 0)));
      }
    }

    empty(gBars);
    const bw = kx * width;
    const stroke = Math.max(0.5, Math.min(compact ? 1.6 : 2.5, bw * 0.16));
    counts.forEach((c, k) => {
      if (!c) return;
      const x = sx(min + k * width);
      gBars.appendChild(s('rect', {
        x, y: sy(c), width: Math.max(0.5, Math.min(bw, right - x)), height: bottom - sy(c),
        fill: hue(color), stroke: 'var(--ink)', 'stroke-width': stroke, 'stroke-linejoin': 'round',
      }));
    });

    if (curve) {
      let d = '';
      for (let i = 0; i <= 120; i++) {
        const x = min + ((max - min) * i) / 120;
        const z = (x - st.mean) / st.sd;
        const y = ((st.n * width) / (st.sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
        d += `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`;
      }
      curve.setAttribute('d', d);
    }

    if (band) {
      const a = clamp(sx(st.mean - band * st.sd), left, right);
      const b = clamp(sx(st.mean + band * st.sd), left, right);
      bandRect.setAttribute('x', a);
      bandRect.setAttribute('width', Math.max(0, b - a));
      bandRect.setAttribute('visibility', 'visible');
      bandEdges.setAttribute('d', `M${a} ${top} V${bottom} M${b} ${top} V${bottom}`);
      bandEdges.setAttribute('visibility', 'visible');
      roInside.set(state.inside);
    }

    if (widthRow) widthRow.input.setAttribute('aria-valuetext', `${formatNumber(width, 4)}${unit}, ${counts.length} bars`);
    if (bandRow) bandRow.input.setAttribute('aria-valuetext', `mean plus or minus ${band} standard deviations, holding ${formatNumber(state.inside, 1)} percent`);

    for (const key of ['mean', 'median']) {
      const mark = marks[key];
      if (!mark) continue;
      const on = shown.has(key);
      const x = sx(st[key]);
      mark.line.setAttribute('visibility', on ? 'visible' : 'hidden');
      mark.line.setAttribute('x1', x);
      mark.line.setAttribute('x2', x);
      if (mark.label) {
        const text = `${MARK[key].name} ${fmt(st[key])}${unit}`;
        mark.label.textContent = on ? text : '';
        mark.label.setAttribute('x', within(x, text));
      }
    }

    if (guessHandle) {
      const x = sx(guess);
      guessHandle.set(x, bottom);
      guessHandle.setLabel(`${fmt(guess)}${unit}, ${Math.round(state.below)} percent of the data to the left`);
      guessLine.setAttribute('x1', x);
      guessLine.setAttribute('x2', x);
      const text = `your marker: ${fmt(guess)}${unit}`;
      guessLabel.textContent = text;
      guessLabel.setAttribute('x', within(x, text));
      roBelow.set(Math.round(state.below));
      roAbove.set(100 - Math.round(state.below));
    }

    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Histogram of ${st.n} values from ${formatNumber(min, 4)} to ${formatNumber(max, 4)}${unit} in ${counts.length} bins of width ${formatNumber(width, 4)}. Counts: ${counts.join(', ')}.`);
  }

  draw();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (typeof next.width === 'number' && (!widths || widths.includes(next.width))) { width = next.width; if (widthRow) widthRow.set(widths.indexOf(width)); }
      if (typeof next.band === 'number') { band = clamp(Math.round(next.band), 0, 3); if (bandRow && band) bandRow.set(band); }
      if (typeof next.guess === 'number' && guessSpec) guess = tidy(clamp(snapTo(next.guess, guessStep), min, max));
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (widthRow) widthRow.setDisabled(readOnly);
      if (bandRow) bandRow.setDisabled(readOnly);
      if (guessHandle) guessHandle.setEnabled(!readOnly);
      if (readOnly && later.size) { for (const key of later) shown.add(key); draw(); }
    },
    destroy() { if (guessHandle) guessHandle.destroy(); },
  };
}

/* A small made-up data set for the gallery: two overlapping groups. */
const demo = [];
for (let i = 0; i < 90; i++) {
  demo.push(tidy(12 + 4 * Math.sin(i * 12.9898) * Math.cos(i * 4.1414) + ((i * 7) % 5) * 0.4, 1));
  if (i % 2) demo.push(tidy(29 + 5 * Math.sin(i * 7.233) * Math.cos(i * 1.9) + ((i * 3) % 7) * 0.3, 1));
}

export const examples = [
  {
    title: 'histogram-lab — change the bin width',
    spec: { type: 'histogram-lab', data: demo, min: 0, max: 45, widths: [1, 3, 5, 9, 15, 45], width: 5, rug: true, xLabel: 'minutes', unit: 'min', show: ['mean', 'median'] },
  },
  {
    title: 'histogram-lab — normal curve with a 1 / 2 / 3 SD band, and a draggable marker',
    spec: { type: 'histogram-lab', data: demo, min: 0, max: 45, width: 3, curve: true, bandSlider: true, guess: { value: 10, step: 0.5 } },
  },
];
