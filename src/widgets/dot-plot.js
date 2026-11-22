/**
 * dot-plot — data points on a number line, with the numbers that summarise
 * them drawn in. The line is a ruler: the mean is the pivot it balances on,
 * the median is a flag, range and quartiles become a box plot, and distances
 * from the mean become bars. Dots can be dragged, so every statistic answers
 * back at once.
 *
 * {
 *   type: 'dot-plot',
 *   min: 0, max: 10,               // ends of the ruler
 *   step: 1,                       // dots snap to multiples of this (keep (max - min) / step at 20 or less)
 *   major: 1,                      // spacing of the numbered ticks (auto if omitted)
 *   values: [2, 4, 4, 5, 9],       // the data: one dot each
 *   drag: true,                    // true: every dot; false: none; [4]: only these (drawn in orange)
 *   layout: 'stack',               // 'stack': equal values pile up · 'rows': one row per dot (needed for deviations)
 *   show: ['mean', 'median'],      // any of: mean, median, range, iqr, box (stack layout), deviations, sd (rows layout);
 *                                  //   default ['mean', 'median'], or nothing in balance mode
 *   readouts: ['range', 'iqr'],    // pills under the figure: n, sum, mean, median, min, max, range, q1, q3, iqr, sd, left, right
 *   fulcrum: 3,                    // balance mode: a pivot the learner drags; the ruler tips unless it sits at the mean
 *                                  //   { at: 6, fixed: true } pins the pivot, and the dots are dragged instead
 *   highlight: [4],                // dots drawn in the accent colour
 *   color: 'blue', accent: 'orange',
 *   unit: 'min',                   // appended to the labels in the figure
 *   digits: 2,                     // decimals shown
 *   rows: 5,                       // height of the tallest pile that fits without squeezing (stack layout;
 *                                  //   default: two more than the tallest pile at the start)
 * }
 *
 * State: { values, sorted, n, sum, mean, median, min, max, range, q1, q3, iqr, sd, mad, left, right, moved, fulcrum, balanced }
 *   values   — in the order given in the spec (sorted: ascending)
 *   q1, q3   — medians of the lower and upper half (the median itself is left out when n is odd)
 *   sd       — standard deviation, dividing by n · mad — mean distance from the mean
 *   left, right — total distance of the dots on each side of the pivot (balance mode) or of the mean
 *   moved    — how many dots are not where they started
 *   fulcrum, balanced — balance mode only (otherwise null / true)
 *
 * setState accepts { values } and / or { fulcrum }.
 */
import { frame, handle, readout, button, hue, s, clamp, snapTo, tidy, formatNumber, niceStep, ticks, addStyles } from './kit.js';
import { reducedMotion } from '../core/dom.js';
import { play } from '../core/audio.js';

addStyles('dot-plot', `
  .widget-dot-plot .dp-ruler { fill: var(--surface); stroke: var(--ink); stroke-width: 2.5; }
  .widget-dot-plot .dp-tick { stroke: var(--ink-3); stroke-width: 1.5; stroke-linecap: round; }
  .widget-dot-plot .dp-tick.is-major { stroke: var(--ink); stroke-width: 2; }
  .widget-dot-plot .w-canvas text.tick-label.dp-num { font-size: 13px; font-weight: 700; fill: var(--ink-2); stroke: none; }
  .widget-dot-plot .dp-ground { stroke: var(--hair); stroke-width: 3; stroke-linecap: round; }
  .widget-dot-plot .dp-dot { stroke: var(--edge-strong); stroke-width: 2.5; }
  @media (max-width: 520px) {
    .widget-dot-plot .w-canvas .fig-label { font-size: 15px; }
    .widget-dot-plot .w-canvas .fig-label-sm { font-size: 13px; }
  }
  .widget-dot-plot.is-compact .dp-dot { stroke-width: 2; }
`);

const middle = (a) => { const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };

/** Summary statistics of a list of numbers (see "State" above for the conventions). */
export function summarize(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((t, v) => t + v, 0);
  const mean = sum / n;
  const half = Math.floor(n / 2);
  const q1 = n > 1 ? middle(sorted.slice(0, half)) : sorted[0];
  const q3 = n > 1 ? middle(sorted.slice(n - half)) : sorted[0];
  const sd = Math.sqrt(sorted.reduce((t, v) => t + (v - mean) * (v - mean), 0) / n);
  const mad = sorted.reduce((t, v) => t + Math.abs(v - mean), 0) / n;
  return {
    sorted, n, sum: tidy(sum), mean: tidy(mean), median: tidy(middle(sorted)),
    min: sorted[0], max: sorted[n - 1], range: tidy(sorted[n - 1] - sorted[0]),
    q1: tidy(q1), q3: tidy(q3), iqr: tidy(q3 - q1), sd: tidy(sd), mad: tidy(mad),
  };
}

const READOUT_LABELS = {
  n: 'values', sum: 'total', mean: 'mean', median: 'median', min: 'smallest', max: 'largest', range: 'range',
  q1: 'Q1', q3: 'Q3', iqr: 'IQR', sd: 'SD', mad: 'mean distance', left: 'distances, left', right: 'distances, right',
};
const READOUT_HUES = { mean: 'orange', median: 'violet', iqr: 'violet', q1: 'violet', q3: 'violet', sd: 'teal', mad: 'teal' };

export default function create(spec, env) {
  const compact = !!env.compact;
  // Phones get a narrower drawing, so dots and labels stay big enough to read and to grab.
  const phone = !compact && typeof matchMedia === 'function' && matchMedia('(max-width: 520px)').matches;
  const K = compact
    ? { W: 300, PAD: 24, RMAX: 10, RULER: 24, FUL: 16, LANE: 30, ROW: 22 }
    : phone
      ? { W: 400, PAD: 30, RMAX: 13, RULER: 30, FUL: 28, LANE: 46, ROW: 30 }
      : { W: 560, PAD: 40, RMAX: 13, RULER: 30, FUL: 30, LANE: 48, ROW: 28 };
  const min = spec.min != null ? spec.min : 0;
  const max = spec.max != null ? spec.max : 10;
  const step = spec.step || 1;
  const digits = spec.digits != null ? spec.digits : 2;
  const unit = spec.unit ? ` ${spec.unit}` : '';
  const fmt = (v) => formatNumber(v, digits);
  const values = (Array.isArray(spec.values) && spec.values.length ? spec.values : [0]).map((v) => Number(v) || 0);
  const start = values.slice();
  const n = values.length;
  const rowsLayout = spec.layout === 'rows';
  const fulSpec = spec.fulcrum == null ? null : (typeof spec.fulcrum === 'object' ? spec.fulcrum : { at: spec.fulcrum });
  const balance = !!fulSpec;
  const show = new Set(spec.show || (balance ? [] : ['mean', 'median']));
  const fulStart = balance ? Number(fulSpec.at) || 0 : null;
  let fulcrum = fulStart;
  const fulDrag = balance && !fulSpec.fixed && !compact;
  const dragList = Array.isArray(spec.drag) ? spec.drag : null;
  const dragAll = spec.drag === true || (spec.drag == null && (!balance || !!fulSpec.fixed));
  const canDrag = (i) => !compact && (dragList ? dragList.includes(i) : dragAll);
  const anyDrag = values.some((_, i) => canDrag(i));
  const marked = new Set(spec.highlight || dragList || []);
  const colorOf = (i) => (marked.has(i) ? (spec.accent || 'orange') : (spec.color || 'blue'));
  let readOnly = !!env.readOnly;

  /* ------------------------------------------------------------ geometry */
  const span = K.W - 2 * K.PAD;
  const sx = (v) => K.PAD + ((v - min) / (max - min)) * span;
  const ux = (px) => min + ((px - K.PAD) / span) * (max - min);
  const pxStep = (step / (max - min)) * span;
  K.R = clamp(pxStep / 2 - 0.5, 5, K.RMAX);      // neighbouring dots never overlap
  K.GAP = 2 * K.R + 1;
  const snap = (v) => tidy(clamp(snapTo(v, step), min, max));
  const boxShown = !rowsLayout && (show.has('box') || show.has('iqr') || show.has('range'));
  const flagShown = show.has('median') && !show.has('box') && !show.has('iqr');
  const lane = boxShown || flagShown ? K.LANE : 10;
  const tiltRoom = balance ? 26 : 0;
  const tallest = Math.max(...values.map((v) => values.filter((w) => w === v).length));
  const pile = clamp(spec.rows || Math.min(n, tallest + 2), 2, 7);
  const sdShown = rowsLayout && show.has('sd');
  const bodyH = rowsLayout ? n * K.ROW + (sdShown ? 32 : 8) : pile * K.GAP + 6;
  const top = lane + tiltRoom;
  const yR = top + bodyH;                       // top edge of the ruler
  const meanShown = show.has('mean') && !balance;
  const pivotShown = meanShown || balance;
  const H = yR + K.RULER + (pivotShown ? K.FUL + (compact ? 8 : 30) : 8);
  const yGround = yR + K.RULER + K.FUL;
  const rulerX = K.PAD - K.R - 10;
  const rulerW = span + 2 * (K.R + 10);
  const textW = (text) => text.length * 8.3;     // rough width of a fig-label
  const within = (x, text) => clamp(x, 4 + textW(text) / 2, K.W - 4 - textW(text) / 2);

  const fr = frame({ width: K.W, height: H, plain: true, compact, label: spec.alt || 'Dot plot' });
  const { svg } = fr;
  if (compact) fr.el.classList.add('is-compact');

  /* ------------------------------------------------- layers, back to front */
  const gBack = s('g');     // bands and guide lines behind everything
  const gBeam = s('g');     // ruler + dots: this is what tips in balance mode
  const gMarks = s('g');    // flags, box plot, labels
  const gPivot = s('g');
  svg.append(gBack, gPivot, gBeam, gMarks);

  if (pivotShown) gPivot.appendChild(s('line.dp-ground', { x1: rulerX + 6, x2: rulerX + rulerW - 6, y1: yGround, y2: yGround }));
  const pivot = pivotShown ? s('path', { stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }) : null;
  const pivotLabel = pivotShown && !compact ? s('text.fig-label', { 'text-anchor': 'middle', y: yGround + 22 }) : null;
  if (pivot) gPivot.appendChild(pivot);
  if (pivotLabel) gPivot.appendChild(pivotLabel);

  // the ruler
  gBeam.appendChild(s('rect.dp-ruler', { x: rulerX, y: yR, width: rulerW, height: K.RULER, rx: 7 }));
  const major = spec.major || niceStep(max - min, compact ? 5 : 10);
  const minor = (max - min) / step <= 40 ? step : major / 5;
  for (const v of ticks(min, max, minor)) gBeam.appendChild(s('line.dp-tick', { x1: sx(v), x2: sx(v), y1: yR + 1, y2: yR + 6 }));
  for (const v of ticks(min, max, major)) {
    gBeam.appendChild(s('line.dp-tick.is-major', { x1: sx(v), x2: sx(v), y1: yR + 1, y2: yR + 8 }));
    gBeam.appendChild(s('text.tick-label.dp-num', { x: sx(v), y: yR + K.RULER - (compact ? 5 : 7), 'text-anchor': 'middle' }, formatNumber(v, 4)));
  }

  // rows layout: distance bars, the mean line, the SD band
  const devShown = rowsLayout && show.has('deviations');
  const rowY = (i) => top + K.ROW / 2 + i * K.ROW;
  const sdBand = sdShown ? s('rect', { y: top, height: n * K.ROW, fill: hue('teal', 'soft'), opacity: 0.6, rx: 6 }) : null;
  const meanLine = rowsLayout && show.has('mean') ? s('line', { y1: top - 4, y2: yR, stroke: hue('orange'), 'stroke-width': 3, 'stroke-linecap': 'round' }) : null;
  const sdBar = sdShown ? s('path', { fill: 'none', stroke: hue('teal', 'text'), 'stroke-width': 3, 'stroke-linecap': 'round' }) : null;
  const sdLabel = sdShown && !compact ? s('text.fig-label', { y: yR - 9, style: `fill:${hue('teal', 'text')}` }) : null;
  if (sdBand) gBack.appendChild(sdBand);
  const bars = values.map(() => (devShown ? s('line', { stroke: hue('teal'), 'stroke-width': 7, 'stroke-linecap': 'round', opacity: 0.75 }) : null));
  const barLabels = values.map(() => (devShown && !compact ? s('text.fig-label-sm') : null));
  bars.forEach((b) => b && gBack.appendChild(b));
  if (meanLine) gBack.appendChild(meanLine);
  if (sdBar) gBack.appendChild(sdBar);

  // top lane: median flag, or a box plot (whiskers = range, box = middle half)
  const medLine = show.has('median') || show.has('box') ? s('line', { y2: yR, stroke: hue('violet'), 'stroke-width': 2.5, 'stroke-dasharray': '3 6', 'stroke-linecap': 'round' }) : null;
  const medFlag = flagShown ? s('path', { fill: hue('violet'), stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linejoin': 'round' }) : null;
  const laneLabel = (boxShown || flagShown) && !compact ? s('text.fig-label', { 'text-anchor': 'middle', y: 17 }) : null;
  const laneLabel2 = show.has('box') && !compact ? s('text.fig-label', { 'text-anchor': 'middle', y: 17, style: `fill:${hue('violet', 'text')}` }) : null;
  const boxMid = K.LANE - (compact ? 10 : 15);
  const boxHalf = compact ? 7 : 10;
  const whisker = show.has('range') || show.has('box') ? s('path', { fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2.5, 'stroke-linecap': 'round' }) : null;
  const box = show.has('iqr') || show.has('box') ? s('rect', { y: boxMid - boxHalf, height: 2 * boxHalf, rx: 4, fill: hue('violet', 'soft'), stroke: 'var(--ink)', 'stroke-width': 2.5 }) : null;
  const boxMedian = show.has('box') ? s('line', { y1: boxMid - boxHalf, y2: boxMid + boxHalf, stroke: hue('violet'), 'stroke-width': 4, 'stroke-linecap': 'round' }) : null;
  if (medLine) gBack.appendChild(medLine);
  for (const el of [whisker, box, boxMedian, medFlag, laneLabel, laneLabel2, sdLabel, ...barLabels]) if (el) gMarks.appendChild(el);

  /* ---------------------------------------------------------------- dots */
  const seq = values.map((_, i) => i);   // arrival order: a dot that moves lands on top of the pile
  let counter = n;
  let wasBalanced = false;
  const dots = values.map((_, i) => {
    if (!canDrag(i)) {
      const el = s('circle.dp-dot', { r: K.R, fill: hue(colorOf(i)) });
      gBeam.appendChild(el);
      return { el, set: (x, y) => { el.setAttribute('cx', x); el.setAttribute('cy', y); } };
    }
    const hd = handle(svg, {
      r: K.R, color: colorOf(i), label: `Value ${i + 1} of ${n}`, keyStep: pxStep,
      onMove: (px) => {
        if (readOnly) return;
        const v = snap(ux(px));
        if (v === values[i]) return;
        values[i] = v;
        seq[i] = ++counter;
        play('tick');
        layout();
        env.onChange(getState());
      },
      onEnd: () => announceNow(),
    });
    gBeam.appendChild(hd.el);
    return { hd, el: hd.el, set: (x, y) => hd.set(x, y) };
  });

  let pivotHandle = null;
  if (fulDrag) {
    pivotHandle = handle(svg, {
      r: compact ? 6 : 9, color: 'orange', label: 'Pivot under the ruler', keyStep: pxStep,
      onMove: (px) => {
        if (readOnly) return;
        const v = snap(ux(px));
        if (v === fulcrum) return;
        fulcrum = v;
        play('tick');
        layout();
        env.onChange(getState());
      },
      onEnd: () => announceNow(),
    });
    gPivot.appendChild(pivotHandle.el);
  }

  /* ------------------------------------------------------------ readouts */
  const pills = (compact ? [] : (spec.readouts || [])).filter((key) => READOUT_LABELS[key]).map((key) => {
    const ro = readout(READOUT_LABELS[key], { digits, color: READOUT_HUES[key] || null });
    fr.readouts.appendChild(ro.el);
    return { key, ro };
  });

  const resetBtn = button('Reset', () => {
    if (readOnly) return;
    start.forEach((v, i) => { values[i] = v; seq[i] = i; });
    fulcrum = fulStart;
    layout();
    env.onChange(getState());
  }, { icon: 'reset', variant: 'ghost' });
  if ((anyDrag || fulDrag) && !compact) fr.buttons.appendChild(resetBtn);

  /* --------------------------------------------------------------- state */
  function getState() {
    const st = summarize(values);
    const about = balance ? fulcrum : st.mean;
    let left = 0;
    let right = 0;
    for (const v of values) { if (v < about) left += about - v; else right += v - about; }
    return {
      values: values.slice(), ...st,
      left: tidy(left), right: tidy(right),
      moved: values.filter((v, i) => v !== start[i]).length,
      fulcrum,
      balanced: balance ? Math.abs(st.sum - n * fulcrum) < 1e-6 : true,
    };
  }

  /* ---------------------------------------------------------------- tilt */
  let angle = 0;
  let raf = 0;
  function targetAngle(st) {
    if (!balance) return 0;
    const torque = (st.sum - n * fulcrum) / step;      // > 0: the right side is heavier
    if (Math.abs(torque) < 1e-6) return 0;
    const armHeavy = torque > 0 ? rulerX + rulerW - sx(fulcrum) : sx(fulcrum) - rulerX;
    const armLight = rulerW - armHeavy;
    const limit = Math.min(8, (Math.asin(Math.min(1, (K.FUL - 4) / Math.max(1, armHeavy))) * 180) / Math.PI,
      (Math.asin(Math.min(1, tiltRoom / Math.max(1, armLight))) * 180) / Math.PI);
    return Math.sign(torque) * Math.min(limit, 0.8 + Math.abs(torque) * 0.9);
  }
  const applyAngle = () => gBeam.setAttribute('transform', `rotate(${angle.toFixed(3)} ${sx(fulcrum).toFixed(2)} ${yR + K.RULER})`);
  function tiltTo(target) {
    cancelAnimationFrame(raf);
    if (reducedMotion() || !fr.el.isConnected) { angle = target; applyAngle(); return; }
    const tick = () => {
      const diff = target - angle;
      if (Math.abs(diff) < 0.04) { angle = target; applyAngle(); return; }
      angle += diff * 0.22;
      applyAngle();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  /* -------------------------------------------------------------- layout */
  function layout() {
    const st = getState();

    // dots
    if (rowsLayout) {
      dots.forEach((d, i) => d.set(sx(values[i]), rowY(i)));
    } else {
      const order = values.map((_, i) => i).sort((a, b) => seq[a] - seq[b]);
      const count = new Map();
      for (const i of order) count.set(values[i], (count.get(values[i]) || 0) + 1);
      const seen = new Map();
      for (const i of order) {
        const c = count.get(values[i]);
        const k = seen.get(values[i]) || 0;
        seen.set(values[i], k + 1);
        const gap = c > 1 ? Math.min(K.GAP, ((pile - 1) * K.GAP) / (c - 1)) : K.GAP;
        dots[i].set(sx(values[i]), yR - K.R - 3 - k * gap);
      }
    }
    dots.forEach((d, i) => { if (d.hd) d.hd.setLabel(`${fmt(values[i])}${unit}`); });

    // pivot: follows the mean, or is the learner's own in balance mode
    if (pivot) {
      const at = balance ? fulcrum : st.mean;
      const px = sx(at);
      const w = K.FUL * 0.62;
      pivot.setAttribute('d', `M${px} ${yR + K.RULER + 1} L${px + w} ${yGround} H${px - w} Z`);
      pivot.setAttribute('fill', hue(balance && st.balanced ? 'green' : 'orange'));
      if (pivotHandle) { pivotHandle.set(px, yR + K.RULER + K.FUL * 0.62); pivotHandle.setColor(st.balanced ? 'green' : 'orange'); }
      if (pivotHandle) pivotHandle.setLabel(`${fmt(fulcrum)}${st.balanced ? ', balanced' : ''}`);
      if (pivotLabel) {
        const text = balance ? (st.balanced ? `balanced at ${fmt(at)}${unit}` : `pivot at ${fmt(at)}${unit}`) : `mean ${fmt(at)}${unit}`;
        pivotLabel.textContent = text;
        pivotLabel.setAttribute('x', within(px, text));
        pivotLabel.setAttribute('style', `fill:${hue(balance && st.balanced ? 'green' : 'orange', 'text')}`);
      }
    }
    if (balance) tiltTo(targetAngle(st));

    // rows layout extras
    if (meanLine) { meanLine.setAttribute('x1', sx(st.mean)); meanLine.setAttribute('x2', sx(st.mean)); }
    bars.forEach((b, i) => {
      if (!b) return;
      const y = rowY(i);
      b.setAttribute('x1', sx(st.mean)); b.setAttribute('x2', sx(values[i])); b.setAttribute('y1', y); b.setAttribute('y2', y);
      const lab = barLabels[i];
      if (!lab) return;
      const rightSide = values[i] >= st.mean;
      lab.textContent = formatNumber(Math.abs(values[i] - st.mean), Math.min(digits, 1));
      lab.setAttribute('x', sx(values[i]) + (rightSide ? K.R + 6 : -K.R - 6));
      lab.setAttribute('y', y + 4.5);
      lab.setAttribute('text-anchor', rightSide ? 'start' : 'end');
    });
    if (sdBand) {
      const a = Math.max(rulerX, sx(st.mean - st.sd));
      const b = Math.min(rulerX + rulerW, sx(st.mean + st.sd));
      sdBand.setAttribute('x', a);
      sdBand.setAttribute('width', Math.max(0, b - a));
    }
    if (sdBar) {
      const y = yR - 14;
      const toRight = sx(st.mean + st.sd) <= rulerX + rulerW;
      const a = sx(st.mean);
      const b = sx(st.mean + (toRight ? st.sd : -st.sd));
      sdBar.setAttribute('d', `M${a} ${y} H${b} M${a} ${y - 6} V${y + 6} M${b} ${y - 6} V${y + 6}`);
      if (sdLabel) {
        const text = `SD ${fmt(st.sd)}${unit}`;
        const far = Math.max(a, b);
        const near = Math.min(a, b);
        const fits = far + 10 + textW(text) < K.W - 4;
        sdLabel.textContent = text;
        sdLabel.setAttribute('x', fits ? far + 10 : near - 10);
        sdLabel.setAttribute('text-anchor', fits ? 'start' : 'end');
      }
    }

    // top lane
    if (medLine) {
      medLine.setAttribute('x1', sx(st.median)); medLine.setAttribute('x2', sx(st.median));
      medLine.setAttribute('y1', boxShown ? boxMid + boxHalf + 2 : K.LANE - 4);
    }
    if (medFlag) {
      const px = sx(st.median);
      const y = K.LANE - 5;
      medFlag.setAttribute('d', `M${px} ${y} L${px - 9} ${y - 15} H${px + 9} Z`);
    }
    if (whisker) {
      const a = sx(st.min);
      const b = sx(st.max);
      whisker.setAttribute('d', `M${a} ${boxMid} H${b} M${a} ${boxMid - 7} V${boxMid + 7} M${b} ${boxMid - 7} V${boxMid + 7}`);
    }
    if (box) { box.setAttribute('x', sx(st.q1)); box.setAttribute('width', Math.max(0.01, sx(st.q3) - sx(st.q1))); }
    if (boxMedian) { boxMedian.setAttribute('x1', sx(st.median)); boxMedian.setAttribute('x2', sx(st.median)); }
    if (laneLabel) {
      let text;
      let x;
      let color = 'violet';
      if (show.has('box')) {
        const wide = sx(st.q3) - sx(st.q1) > textW('Q1 ') + 6;
        text = wide ? 'Q1' : 'Q1 · Q3';
        x = wide ? sx(st.q1) : (sx(st.q1) + sx(st.q3)) / 2;
        laneLabel2.textContent = wide ? 'Q3' : '';
        laneLabel2.setAttribute('x', within(sx(st.q3), 'Q3'));
      } else if (show.has('iqr')) {
        text = `IQR ${fmt(st.iqr)}${unit}`;
        x = (sx(st.q1) + sx(st.q3)) / 2;
      } else if (flagShown) {
        text = `median ${fmt(st.median)}${unit}`;
        x = sx(st.median);
      } else {
        text = `range ${fmt(st.range)}${unit}`;
        x = (sx(st.min) + sx(st.max)) / 2;
        color = null;
      }
      laneLabel.textContent = text;
      laneLabel.setAttribute('x', within(x, text));
      laneLabel.setAttribute('style', color ? `fill:${hue(color, 'text')}` : '');
    }

    for (const { key, ro } of pills) ro.set(st[key]);
    resetBtn.disabled = readOnly || (st.moved === 0 && fulcrum === fulStart);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}Dot plot of ${n} values: ${st.sorted.map((v) => formatNumber(v, 4)).join(', ')}. Mean ${fmt(st.mean)}, median ${fmt(st.median)}.${balance ? ` Pivot at ${fmt(fulcrum)}: ${st.balanced ? 'balanced' : st.sum > n * fulcrum ? 'tips to the right' : 'tips to the left'}.` : ''}`);
    if (balance && st.balanced && !wasBalanced && fr.el.isConnected) { play('pop'); env.announce('The ruler balances.'); }
    wasBalanced = balance && st.balanced;
  }

  function announceNow() {
    const st = getState();
    env.announce(balance
      ? (st.balanced ? `Balanced at ${fmt(fulcrum)}.` : `Pivot at ${fmt(fulcrum)}. The ${st.sum > n * fulcrum ? 'right' : 'left'} side is heavier.`)
      : `Mean ${fmt(st.mean)}, median ${fmt(st.median)}.`);
  }

  layout();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.values)) next.values.forEach((v, i) => { if (i < n && typeof v === 'number') { values[i] = snap(v); seq[i] = i; } });
      if (balance && typeof next.fulcrum === 'number') fulcrum = snap(next.fulcrum);
      layout();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      dots.forEach((d) => { if (d.hd) d.hd.setEnabled(!readOnly); });
      if (pivotHandle) pivotHandle.setEnabled(!readOnly);
      resetBtn.hidden = readOnly;
    },
    destroy() {
      cancelAnimationFrame(raf);
      dots.forEach((d) => { if (d.hd) d.hd.destroy(); });
      if (pivotHandle) pivotHandle.destroy();
    },
  };
}

export const examples = [
  {
    title: 'dot-plot — drag the dots; the mean is the pivot, the median the flag',
    spec: { type: 'dot-plot', min: 0, max: 10, values: [1, 2, 3, 4, 10], show: ['mean', 'median'] },
  },
  {
    title: 'dot-plot — balance mode: drag the pivot until the ruler is level',
    spec: { type: 'dot-plot', min: 0, max: 10, values: [1, 2, 3, 4, 10], fulcrum: 7, readouts: ['left', 'right'] },
  },
  {
    title: 'dot-plot — box plot above the dots',
    spec: { type: 'dot-plot', min: 0, max: 20, major: 2, values: [3, 3, 4, 4, 5, 5, 18], show: ['box'], readouts: ['range', 'iqr'] },
  },
  {
    title: 'dot-plot — rows layout with distances from the mean and the SD',
    spec: { type: 'dot-plot', min: 0, max: 10, values: [2, 4, 5, 6, 8], layout: 'rows', show: ['mean', 'deviations', 'sd'], readouts: ['sd'] },
  },
];
