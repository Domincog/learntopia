/**
 * fit-line — a straight-line model you tune by hand, or let gradient descent
 * tune for you. Shows the examples, the model's line, a vertical "miss" bar
 * from every example to the line, and a live error readout.
 *
 * {
 *   type: 'fit-line',
 *   points: [[1, 9], [2, 10], [3, 15]],     // the examples: [input, actual output]
 *   x: [0, 10], y: [0, 40],                 // window (xStep / yStep for the grid are optional)
 *   xLabel: 'distance (km)', yLabel: 'minutes',
 *   names: { input: 'km', output: 'minutes' },   // words used in the live recipe: "minutes = 3 × km + 5"
 *   unit: 'min',                            // unit shown after the error and the probe value
 *   w: { min: 0, max: 6, step: 0.25, value: 1, label: 'minutes per km' },   // the slope knob
 *   b: { min: 0, max: 12, step: 1, value: 0, label: 'head start' },         // the intercept knob
 *                                           //   b: false  -> a one-knob model (the line passes through 0)
 *   error: 'abs',                           // 'abs': average miss · 'squared': average of the squared misses
 *   line: true,                             // false: only the examples (no model, no knobs)
 *   misses: true,                           // draw the miss bars
 *   probe: 6,                               // mark one input value and show what the model predicts there
 *   chart: 'valley',                        // a second, small chart:
 *                                           //   'valley'  error against w; every knob setting you try leaves a dot
 *                                           //   'history' error after each training step
 *   train: { rate: 0.1, burst: 10 },        // replaces the knobs by buttons that run gradient descent on the
 *                                           // squared error (inputs are standardised first, as is usual in practice)
 * }
 *
 * State: { w, b, error, miss, mse, tilt, over, steps, visited }
 *   error   — the error in the chosen mode, rounded to 2 decimals (miss and mse are always both given)
 *   tilt    — w minus the best-fit slope: positive means the line is too steep, negative too shallow
 *   over    — average of (prediction − actual): positive means the line sits too high overall
 *   steps   — training steps taken so far (train mode)
 *   visited — the distinct w settings tried so far, sorted (useful with chart: 'valley')
 *
 * setState accepts { w, b }, { visited: [...] } and, in train mode, { steps: n }
 * (which replays n training steps from the starting weights).
 */
import { frame, plane, drawAxes, sliderRow, readout, button, clipTo, hue, s, h, clamp, tidy, formatNumber, niceStep, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('fit-line', `
  .widget-fit-line .w-fit-recipe {
    justify-self: center;
    max-width: 100%;
    padding: var(--s2) var(--s4);
    border: var(--bw) dashed var(--hair);
    border-radius: var(--r);
    text-align: center;
    font-weight: 700;
    font-size: var(--fs-lg);
    font-variant-numeric: tabular-nums;
    text-wrap: balance;
  }
  .widget-fit-line .w-fit-recipe .is-w { color: var(--blue-text); }
  .widget-fit-line .w-fit-recipe .is-b { color: var(--orange-text); }
  .widget-fit-line .w-fit-chart svg { touch-action: auto; }
  .widget-fit-line .btn-ghost.btn-sm { box-shadow: none; }
  .widget-fit-line .btn-sm { min-height: 40px; }
`);

const W = 560;

export default function create(spec, env) {
  const pts = (spec.points || []).map((p) => [Number(p[0]), Number(p[1])]);
  const n = Math.max(1, pts.length);
  const showLine = spec.line !== false;
  const interactive = showLine && !env.compact && !spec.static;
  const trainDef = spec.train ? { rate: 0.1, burst: 10, ...(spec.train === true ? {} : spec.train) } : null;
  const mode = spec.error === 'squared' ? 'squared' : 'abs';
  const unit = spec.unit || '';
  const names = { input: 'input', output: 'prediction', ...(spec.names || {}) };
  const wDef = { min: 0, max: 5, step: 0.25, value: 1, label: 'weight $w$', ...(spec.w || {}) };
  const hasB = spec.b !== false;
  const bDef = hasB ? { min: 0, max: 10, step: 1, value: 0, label: 'weight $b$', ...(spec.b || {}) } : null;
  let readOnly = !!env.readOnly;

  /* ------------------------------------------------------------- model */
  let w = showLine ? wDef.value : 0;
  let b = hasB ? bDef.value : 0;
  let steps = 0;
  const visited = new Set();
  let history = [];
  let timer = 0;

  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const mean = (arr) => arr.reduce((t, v) => t + v, 0) / Math.max(1, arr.length);
  const mx = mean(xs);
  const my = mean(ys);
  const varX = mean(xs.map((x) => (x - mx) ** 2)) || 1;
  const sdX = Math.sqrt(varX);
  const bestW = mean(pts.map(([x, y]) => (x - mx) * (y - my))) / varX;

  const missAt = (ww, bb) => mean(pts.map(([x, y]) => Math.abs(ww * x + bb - y)));
  const mseAt = (ww, bb) => mean(pts.map(([x, y]) => (ww * x + bb - y) ** 2));
  const errAt = (ww, bb) => (mode === 'squared' ? mseAt(ww, bb) : missAt(ww, bb));

  /* -------------------------------------------------------------- plot */
  const height = env.compact ? 300 : 350;
  const fr = frame({ width: W, height, compact: env.compact, label: spec.alt || 'Examples and a model line' });
  const { svg } = fr;
  const xWin = spec.x || [Math.min(0, ...xs), Math.max(...xs) + 1];
  const yWin = spec.y || [Math.min(0, ...ys), Math.max(...ys) * 1.15];
  const pl = plane({ x: xWin, y: yWin, width: W, height, pad: { l: 58, r: 18, t: 22, b: spec.xLabel ? 58 : 36 } });
  svg.appendChild(drawAxes(pl, { xStep: spec.xStep, yStep: spec.yStep, labels: !env.compact }));
  const midY = (pl.top + pl.bottom) / 2;
  if (spec.xLabel && !env.compact) svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: height - 9, 'text-anchor': 'middle' }, spec.xLabel));
  if (spec.yLabel && !env.compact) svg.appendChild(s('text.axis-label', { x: 15, y: midY, 'text-anchor': 'middle', transform: `rotate(-90 15 ${midY})` }, spec.yLabel));

  const clip = clipTo(svg, pl);
  const gProbe = s('g');
  const gMiss = s('g', { 'clip-path': clip });
  const lineEl = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 4, 'stroke-linecap': 'round', 'clip-path': clip });
  const gPts = s('g');
  const gTop = s('g');
  svg.append(gProbe, gMiss, lineEl, gPts, gTop);

  const missEls = pts.map(() => {
    const el = s('line', { stroke: hue('red'), 'stroke-width': 3.5, 'stroke-linecap': 'round' });
    gMiss.appendChild(el);
    return el;
  });
  for (const [x, y] of pts) {
    gPts.appendChild(s('circle', { cx: pl.sx(x), cy: pl.sy(y), r: 6.5, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
  }

  const hasProbe = typeof spec.probe === 'number';
  let probeDot = null;
  let probeLabel = null;
  if (hasProbe) {
    const px = pl.sx(spec.probe);
    gProbe.appendChild(s('line', { x1: px, x2: px, y1: pl.top, y2: pl.bottom, stroke: 'var(--ink-3)', 'stroke-width': 2.5, 'stroke-dasharray': '6 6', 'stroke-linecap': 'round' }));
    probeDot = s('circle', { cx: px, r: 8, fill: 'var(--surface)', stroke: hue('blue'), 'stroke-width': 3.5 });
    probeLabel = s('text.fig-label', { 'text-anchor': 'end' });
    gTop.append(probeDot, probeLabel);
    if (!showLine) {
      probeDot.setAttribute('visibility', 'hidden');
      probeLabel.textContent = spec.probeLabel || '?';
      probeLabel.setAttribute('class', 'fig-label-lg');
      probeLabel.setAttribute('x', px - 10);
      probeLabel.setAttribute('y', pl.top + 24);
    }
  }

  /* ------------------------------------------------------------ recipe */
  const recipe = h('div.w-fit-recipe', { 'aria-live': 'off' });
  if (showLine && !env.compact && spec.recipe !== false) fr.el.insertBefore(recipe, fr.readouts);

  const roError = readout(spec.errorLabel || (mode === 'squared' ? 'error' : 'average miss'), { digits: 2, unit: mode === 'squared' ? '' : unit });
  const roSteps = readout('training steps', { digits: 0 });
  if (showLine && !env.compact) fr.readouts.appendChild(roError.el);
  if (trainDef && !env.compact) fr.readouts.appendChild(roSteps.el);

  /* ------------------------------------------------------ second chart */
  const chartKind = !env.compact && showLine && (spec.chart === 'valley' || spec.chart === 'history') ? spec.chart : null;
  let chart = null;
  if (chartKind) {
    const ch = 190;
    const csvg = s('svg', { viewBox: `0 0 ${W} ${ch}`, role: 'img' });
    const box = h('div.w-canvas.w-fit-chart', csvg);
    fr.el.insertBefore(box, recipe.parentNode ? recipe : fr.readouts);
    chart = { svg: csvg, h: ch, gAxes: s('g'), gData: s('g'), pl: null, key: '' };
    csvg.append(chart.gAxes, chart.gData);
  }

  function chartPlane() {
    if (!chart) return;
    let xr;
    let yr;
    let xLabel;
    if (chartKind === 'valley') {
      xr = [wDef.min, wDef.max];
      const top = Math.max(errAt(wDef.min, hasB ? b : 0), errAt(wDef.max, hasB ? b : 0));
      yr = [0, top * 1.08 || 1];
      xLabel = spec.chartLabel || 'knob setting';
    } else {
      const span = Math.max(20, Math.ceil(steps / 10) * 10);
      xr = [0, span];
      yr = [0, (history[0] || 1) * 1.08];
      xLabel = 'training steps';
    }
    const key = `${xr}|${yr}`;
    if (key === chart.key) return;
    chart.key = key;
    chart.pl = plane({ x: xr, y: yr, width: W, height: chart.h, pad: { l: 58, r: 18, t: 20, b: 52 } });
    while (chart.gAxes.firstChild) chart.gAxes.removeChild(chart.gAxes.firstChild);
    chart.gAxes.appendChild(drawAxes(chart.pl, { yStep: niceStep(yr[1] - yr[0], 3), xStep: chartKind === 'valley' ? niceStep(xr[1] - xr[0], 6) : niceStep(xr[1] - xr[0], 5) }));
    const cm = (chart.pl.top + chart.pl.bottom) / 2;
    chart.gAxes.appendChild(s('text.axis-label', { x: (chart.pl.left + chart.pl.right) / 2, y: chart.h - 8, 'text-anchor': 'middle' }, xLabel));
    chart.gAxes.appendChild(s('text.axis-label', { x: 15, y: cm, 'text-anchor': 'middle', transform: `rotate(-90 15 ${cm})` }, 'error'));
  }

  function drawChart() {
    if (!chart) return;
    chartPlane();
    const cp = chart.pl;
    const g = chart.gData;
    while (g.firstChild) g.removeChild(g.firstChild);
    if (chartKind === 'valley') {
      const list = Array.from(visited).sort((p, q) => p - q);
      let d = '';
      list.forEach((v, i) => { d += `${i ? 'L' : 'M'}${cp.sx(v).toFixed(1)} ${cp.sy(errAt(v, b)).toFixed(1)}`; });
      if (list.length > 1) g.appendChild(s('path', { d, fill: 'none', stroke: hue('blue'), 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: 0.55 }));
      for (const v of list) {
        const here = Math.abs(v - w) < 1e-9;
        g.appendChild(s('circle', { cx: cp.sx(v), cy: cp.sy(errAt(v, b)), r: here ? 8 : 5, fill: here ? hue('orange') : hue('blue'), stroke: 'var(--edge-strong)', 'stroke-width': here ? 2.5 : 2 }));
      }
      chart.svg.setAttribute('aria-label', `Error for each knob setting tried so far: ${list.length} of them. Current setting ${formatNumber(w, 2)}, error ${formatNumber(errAt(w, b), 2)}.`);
    } else {
      let d = '';
      history.forEach((e, i) => { d += `${i ? 'L' : 'M'}${cp.sx(i).toFixed(1)} ${cp.sy(Math.min(e, cp.y1)).toFixed(1)}`; });
      if (history.length > 1) g.appendChild(s('path', { d, fill: 'none', stroke: hue('blue'), 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      const last = history.length - 1;
      if (last >= 0) g.appendChild(s('circle', { cx: cp.sx(last), cy: cp.sy(Math.min(history[last], cp.y1)), r: 7, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
      chart.svg.setAttribute('aria-label', `Error after each training step. After ${last} steps the error is ${formatNumber(history[last] || 0, 2)}.`);
    }
  }

  /* ---------------------------------------------------------- controls */
  const sliders = {};
  const changed = () => { if (chartKind === 'valley') visited.add(tidy(w, 4)); render(); env.onChange(getState()); };
  if (interactive && !trainDef) {
    sliders.w = sliderRow({ label: wDef.label, min: wDef.min, max: wDef.max, step: wDef.step, value: w, color: 'blue', onInput: (v) => { w = v; changed(); } });
    fr.controls.appendChild(sliders.w.el);
    if (hasB && !bDef.fixed) {
      sliders.b = sliderRow({ label: bDef.label, min: bDef.min, max: bDef.max, step: bDef.step, value: b, color: 'orange', onInput: (v) => { b = v; changed(); } });
      fr.controls.appendChild(sliders.b.el);
    }
  }

  /** One step of gradient descent on the squared error, with the input standardised. */
  function descend() {
    let u = w * sdX;            // slope with respect to the standardised input
    let c = b + w * mx;         // the line's height at the average input
    let gu = 0;
    let gc = 0;
    for (const [x, y] of pts) {
      const z = (x - mx) / sdX;
      const e = u * z + c - y;
      gu += 2 * e * z;
      gc += 2 * e;
    }
    u -= trainDef.rate * (gu / n);
    if (hasB) c -= trainDef.rate * (gc / n);
    w = u / sdX;
    b = hasB ? c - w * mx : 0;
    steps += 1;
    history.push(mseAt(w, b));
  }

  const stopRun = () => { if (timer) { clearInterval(timer); timer = 0; } };
  const buttons = [];
  function run(count) {
    if (readOnly || timer) return;
    if (count === 1 || reducedMotion()) {
      for (let i = 0; i < count; i++) descend();
      play('tap');
      render();
      env.onChange(getState());
      return;
    }
    let left = count;
    syncButtons(true);
    timer = setInterval(() => {
      descend();
      left -= 1;
      play('tick');
      render();
      if (left <= 0) { stopRun(); syncButtons(false); env.onChange(getState()); }
    }, 90);
  }
  function resetTraining() {
    stopRun();
    w = wDef.value;
    b = hasB ? bDef.value : 0;
    steps = 0;
    history = [mseAt(w, b)];
    syncButtons(false);
    render();
  }
  function syncButtons(busy) { for (const btn of buttons) btn.disabled = readOnly || !!busy; }

  if (interactive && trainDef) {
    history = [mseAt(w, b)];
    buttons.push(
      button('Take 1 step', () => run(1), { icon: 'footprints' }),
      button(`Run ${trainDef.burst} steps`, () => run(trainDef.burst), { icon: 'play' }),
      button('Start again', () => { if (readOnly) return; resetTraining(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' }),
    );
    fr.buttons.append(...buttons);
  } else if (trainDef) {
    history = [mseAt(w, b)];
  }

  /* ------------------------------------------------------------ render */
  const num = (v, digits = 2) => formatNumber(v, digits);
  function render() {
    if (showLine) {
      lineEl.setAttribute('d', `M${pl.sx(pl.x0)} ${pl.sy(w * pl.x0 + b)}L${pl.sx(pl.x1)} ${pl.sy(w * pl.x1 + b)}`);
      pts.forEach(([x, y], i) => {
        const el = missEls[i];
        el.setAttribute('x1', pl.sx(x)); el.setAttribute('x2', pl.sx(x));
        el.setAttribute('y1', pl.sy(y)); el.setAttribute('y2', pl.sy(w * x + b));
        el.setAttribute('opacity', spec.misses === false ? 0 : 0.9);
      });
      if (hasProbe) {
        const v = w * spec.probe + b;
        const py = clamp(pl.sy(v), pl.top, pl.bottom);
        probeDot.setAttribute('cy', py);
        probeLabel.textContent = `${num(v, 1)}${unit ? ' ' + unit : ''}`;
        probeLabel.setAttribute('x', pl.sx(spec.probe) - 13);
        probeLabel.setAttribute('y', py - 12 < pl.top + 16 ? py + 26 : py - 12);
      }
      const digits = trainDef ? 2 : Math.max(0, (String(wDef.step).split('.')[1] || '').length);
      const bDigits = trainDef ? 2 : (hasB ? Math.max(0, (String(bDef.step).split('.')[1] || '').length) : 0);
      const bPart = !hasB ? '' : ` ${b < 0 ? '−' : '+'} <span class="is-b">${num(Math.abs(b), bDigits)}</span>`;
      recipe.innerHTML = `${names.output} = <span class="is-w">${num(w, digits)}</span> × ${names.input}${bPart}`;
      roError.set(errAt(w, b));
      roSteps.set(steps);
      svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}Model: ${names.output} = ${num(w, 2)} times ${names.input}${hasB ? ` plus ${num(b, 2)}` : ''}. ${mode === 'squared' ? 'Error' : 'Average miss'} ${num(errAt(w, b), 2)}.`);
    } else {
      lineEl.setAttribute('d', '');
      missEls.forEach((el) => el.setAttribute('opacity', 0));
    }
    drawChart();
  }

  function getState() {
    return {
      w: tidy(w, 4),
      b: tidy(b, 4),
      error: tidy(errAt(w, b), 2),
      miss: tidy(missAt(w, b), 2),
      mse: tidy(mseAt(w, b), 2),
      tilt: tidy(w - bestW, 3),
      over: tidy(mean(pts.map(([x, y]) => w * x + b - y)), 3),
      steps,
      visited: Array.from(visited).sort((p, q) => p - q),
    };
  }

  if (chartKind === 'valley') visited.add(tidy(w, 4));
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      stopRun();
      if (Array.isArray(next.visited)) { visited.clear(); for (const v of next.visited) if (typeof v === 'number') visited.add(tidy(v, 4)); }
      if (trainDef && Number.isInteger(next.steps) && typeof next.w !== 'number') {
        resetTraining();
        for (let i = 0; i < next.steps; i++) descend();
      } else {
        if (typeof next.w === 'number') w = next.w;
        if (typeof next.b === 'number' && hasB) b = next.b;
        if (Number.isInteger(next.steps)) steps = next.steps;
      }
      if (sliders.w) sliders.w.set(w);
      if (sliders.b) sliders.b.set(b);
      if (chartKind === 'valley') visited.add(tidy(w, 4));
      syncButtons(false);
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      if (readOnly) stopRun();
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliders) sliders[key].setDisabled(readOnly);
      syncButtons(false);
    },
    destroy() { stopRun(); },
  };
}

const DELIVERIES = [[1, 9], [2, 10], [3, 15], [4, 17], [5, 19], [7, 27], [8, 28], [9, 32]];

export const examples = [
  {
    title: 'fit-line — tune two knobs by hand',
    spec: {
      type: 'fit-line', points: DELIVERIES, x: [0, 10], y: [0, 40], yStep: 10,
      xLabel: 'distance (km)', yLabel: 'minutes', names: { input: 'km', output: 'minutes' }, unit: 'min',
      w: { min: 0, max: 6, step: 0.25, value: 1, label: 'minutes per km' },
      b: { min: 0, max: 12, step: 1, value: 0, label: 'head start' },
    },
  },
  {
    title: 'fit-line — let gradient descent do it',
    spec: {
      type: 'fit-line', points: DELIVERIES, x: [0, 10], y: [0, 40], yStep: 10,
      xLabel: 'distance (km)', yLabel: 'minutes', names: { input: 'km', output: 'minutes' },
      w: { value: 0 }, b: { value: 0 }, error: 'squared', chart: 'history', train: { rate: 0.1, burst: 10 },
    },
  },
];
