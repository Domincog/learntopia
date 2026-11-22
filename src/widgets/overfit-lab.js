/**
 * overfit-lab — fit a curve of adjustable flexibility to a few noisy training
 * examples, then judge it on fresh examples it has never seen. As the model
 * gets more weights its training error can only fall; the error on fresh data
 * falls at first and then turns back up. That gap is overfitting.
 *
 * {
 *   type: 'overfit-lab',
 *   train: [[0.6, 2.2], [1.5, 3.8]],     // training examples [input, output] (default: a built-in set of 10)
 *   test:  [[1, 1.7], [2, 4]],           // fresh examples from the same source (default: a built-in set of 12)
 *   x: [0, 10], y: [0, 10],
 *   xLabel: 'water (litres a week)', yLabel: 'tomatoes (kg)',
 *   weights: { min: 2, max: 10, value: 2 },   // the model is a polynomial with this many weights
 *                                             // (2 = straight line, 3 = one bend allowed, …)
 *   reveal: 'button',                    // 'button': a button reveals the fresh data · true: shown from the start · false: never
 *   chart: true,                         // the small chart of error against the number of weights
 *   resample: false,                     // true adds a "New training data" button: same pattern, new random noise (env.rng)
 *   truth: '8 - 0.28(x - 5.5)^2',        // the pattern behind the data, used only for resampling
 *   noise: 0.8,                          // …and the size of the random scatter around it
 * }
 *
 * The curve is the least-squares fit: of all curves with that many weights,
 * the one with the smallest training error.
 *
 * State: { weights, trainError, testError, revealed, best, bestError, gap, tried, samples, sampledAt }
 *   trainError / testError — average squared miss on the training / fresh examples
 *   best       — the number of weights with the lowest test error (bestError)
 *   gap        — testError − trainError
 *   tried      — the settings visited so far, sorted
 *   samples    — how many times new training data were drawn
 *   sampledAt  — …and with how many weights each time: { 10: 3, 3: 2 }
 *
 * setState accepts { weights, revealed, tried, sampledAt }.
 */
import { frame, plane, drawAxes, sliderRow, readout, button, clipTo, fnPath, hue, s, h, tidy, formatNumber, addStyles } from './kit.js';
import { compile } from '../core/mathexpr.js';
import { play } from '../core/audio.js';

addStyles('overfit-lab', `
  .widget-overfit-lab .w-over-chart svg { touch-action: auto; }
  .widget-overfit-lab .w-over-key { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s1) var(--s4); font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-overfit-lab .w-over-key span { display: inline-flex; align-items: center; gap: 0.4rem; }
  .widget-overfit-lab .w-over-key svg { flex: none; }
  .widget-overfit-lab .btn-ghost.btn-sm { box-shadow: none; }
  .widget-overfit-lab .btn-sm { min-height: 40px; }
`);

const W = 560;
const TRAIN = [[0.6, 2.2], [1.5, 3.8], [2.4, 3.2], [3.6, 6.4], [4.4, 6.3], [5.3, 8.2], [6.5, 7.2], [7.4, 6.4], [8.6, 5.5], [9.4, 4.4]];
const TEST = [[1, 1.7], [2, 4], [2.8, 7.4], [3.2, 6.1], [4, 5.9], [4.9, 8], [5.7, 7.3], [6.1, 8.4], [7, 6], [7.8, 6.4], [8.2, 6.5], [9, 5.2]];

/** Chebyshev polynomials T0..Td at t (a well-behaved basis for polynomial fits). */
function basis(t, d) {
  const out = [1, t];
  for (let k = 2; k <= d; k++) out.push(2 * t * out[k - 1] - out[k - 2]);
  out.length = d + 1;
  return out;
}

/** Least-squares polynomial of the given degree through pts; returns a function of x. Householder QR. */
function fitPoly(pts, degree, x0, x1) {
  const m = pts.length;
  const n = Math.min(degree + 1, m);
  const d = n - 1;
  const tOf = (x) => (2 * x - x0 - x1) / (x1 - x0);
  const A = pts.map((p) => basis(tOf(p[0]), d));
  const b = pts.map((p) => p[1]);
  for (let k = 0; k < n; k++) {
    let norm = 0;
    for (let i = k; i < m; i++) norm += A[i][k] * A[i][k];
    norm = Math.sqrt(norm);
    if (norm < 1e-14) continue;
    const alpha = A[k][k] > 0 ? -norm : norm;
    const v = new Array(m).fill(0);
    for (let i = k; i < m; i++) v[i] = A[i][k];
    v[k] -= alpha;
    let vv = 0;
    for (let i = k; i < m; i++) vv += v[i] * v[i];
    if (vv < 1e-28) continue;
    for (let j = k; j < n; j++) {
      let dot = 0;
      for (let i = k; i < m; i++) dot += v[i] * A[i][j];
      const f = (2 * dot) / vv;
      for (let i = k; i < m; i++) A[i][j] -= f * v[i];
    }
    let dot = 0;
    for (let i = k; i < m; i++) dot += v[i] * b[i];
    const f = (2 * dot) / vv;
    for (let i = k; i < m; i++) b[i] -= f * v[i];
  }
  const c = new Array(n).fill(0);
  for (let k = n - 1; k >= 0; k--) {
    let sum = b[k];
    for (let j = k + 1; j < n; j++) sum -= A[k][j] * c[j];
    c[k] = Math.abs(A[k][k]) < 1e-12 ? 0 : sum / A[k][k];
  }
  return (x) => {
    const T = basis(tOf(x), d);
    let y = 0;
    for (let k = 0; k < n; k++) y += c[k] * T[k];
    return y;
  };
}

const mse = (f, pts) => pts.reduce((t, p) => t + (f(p[0]) - p[1]) ** 2, 0) / Math.max(1, pts.length);

export default function create(spec, env) {
  let train = (spec.train || TRAIN).map((p) => [Number(p[0]), Number(p[1])]);
  const test = (spec.test || TEST).map((p) => [Number(p[0]), Number(p[1])]);
  const xWin = spec.x || [0, 10];
  const yWin = spec.y || [0, 10];
  const wDef = { min: 2, max: 10, value: 2, ...(spec.weights || {}) };
  wDef.max = Math.min(wDef.max, train.length);
  const interactive = !env.compact && !spec.static;
  const truth = compile(spec.truth || '8 - 0.28(x - 5.5)^2', { vars: ['x'] });
  const noise = spec.noise != null ? spec.noise : 0.8;
  let readOnly = !!env.readOnly;

  let weights = wDef.value;
  let revealed = spec.reveal === true;
  let samples = 0;
  let sampledAt = {};
  const tried = new Set([weights]);

  /* --------------------------------------------------------- the fits */
  let fits = {};
  function refit() {
    fits = {};
    for (let k = wDef.min; k <= wDef.max; k++) {
      const f = fitPoly(train, k - 1, xWin[0], xWin[1]);
      fits[k] = { f, train: mse(f, train), test: mse(f, test) };
    }
  }
  refit();
  const best = () => {
    let arg = wDef.min;
    for (let k = wDef.min; k <= wDef.max; k++) if (fits[k].test < fits[arg].test - 1e-12) arg = k;
    return arg;
  };

  /* ------------------------------------------------------------- plot */
  const height = env.compact ? 320 : 340;
  const fr = frame({ width: W, height, compact: env.compact, label: spec.alt || 'A curve fitted to noisy examples' });
  const { svg } = fr;
  const pl = plane({ x: xWin, y: yWin, width: W, height, pad: env.compact ? { l: 14, r: 14, t: 14, b: 14 } : { l: 58, r: 18, t: 22, b: spec.xLabel ? 58 : 36 } });
  svg.appendChild(drawAxes(pl, { xStep: spec.xStep, yStep: spec.yStep || 2, labels: !env.compact, box: env.compact }));
  const midY = (pl.top + pl.bottom) / 2;
  if (!env.compact) {
    if (spec.xLabel) svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: height - 9, 'text-anchor': 'middle' }, spec.xLabel));
    if (spec.yLabel) svg.appendChild(s('text.axis-label', { x: 15, y: midY, 'text-anchor': 'middle', transform: `rotate(-90 15 ${midY})` }, spec.yLabel));
  }
  const clip = clipTo(svg, pl);
  const curve = s('path', { fill: 'none', stroke: hue('blue'), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'clip-path': clip });
  const gTest = s('g');
  const gTrain = s('g');
  svg.append(curve, gTest, gTrain);

  const diamond = (cx, cy, r, attrs) => s('path', { d: `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`, 'stroke-linejoin': 'round', ...attrs });
  for (const [x, y] of test) gTest.appendChild(diamond(pl.sx(x), pl.sy(y), 8, { fill: hue('teal'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
  function drawTrain() {
    while (gTrain.firstChild) gTrain.removeChild(gTrain.firstChild);
    for (const [x, y] of train) gTrain.appendChild(s('circle', { cx: pl.sx(x), cy: pl.sy(y), r: 6.5, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
  }

  /* -------------------------------------------- error-against-weights */
  const showChart = spec.chart !== false && !env.compact;
  const ch = 196;
  let chart = null;
  if (showChart) {
    const csvg = s('svg', { viewBox: `0 0 ${W} ${ch}`, role: 'img' });
    const box = h('div.w-canvas.w-over-chart', csvg);
    fr.el.insertBefore(box, fr.readouts);
    const top = spec.errorMax || 5;
    const cp = plane({ x: [wDef.min - 0.5, wDef.max + 0.5], y: [0, top], width: W, height: ch, pad: { l: 58, r: 18, t: 20, b: 52 } });
    const band = s('rect', { y: cp.top, width: cp.kx, height: cp.ih, fill: hue('yellow', 'soft') });
    csvg.appendChild(band);
    csvg.appendChild(drawAxes(cp, { xStep: 1, yStep: top > 6 ? 2 : 1 }));
    const cm = (cp.top + cp.bottom) / 2;
    csvg.appendChild(s('text.axis-label', { x: (cp.left + cp.right) / 2, y: ch - 8, 'text-anchor': 'middle' }, 'weights in the model'));
    csvg.appendChild(s('text.axis-label', { x: 15, y: cm, 'text-anchor': 'middle', transform: `rotate(-90 15 ${cm})` }, 'error'));
    const g = s('g');
    csvg.appendChild(g);
    chart = { svg: csvg, cp, g, band, top };
  }

  /* --------------------------------------------------------- controls */
  if (!env.compact) {
    const dot = (inner) => { const el = s('svg', { width: 18, height: 18, viewBox: '0 0 18 18', 'aria-hidden': 'true' }); el.appendChild(inner); return el; };
    const key = h('div.w-over-key',
      h('span', dot(s('circle', { cx: 9, cy: 9, r: 6, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 })), 'training examples'),
      h('span.is-test', dot(diamond(9, 9, 7, { fill: hue('teal'), stroke: 'var(--edge-strong)', 'stroke-width': 2 })), 'fresh examples'),
    );
    fr.el.insertBefore(key, fr.canvas.nextSibling);
    fr.keyTest = key.querySelector('.is-test');
  }
  const roTrain = readout('training error', { digits: 2, color: 'orange' });
  const roTest = readout('error on fresh data', { digits: 2, color: 'teal' });
  if (!env.compact) {
    fr.readouts.appendChild(roTrain.el);
    if (spec.reveal !== false) fr.readouts.appendChild(roTest.el);
  }
  let slider = null;
  if (interactive) {
    slider = sliderRow({
      label: spec.sliderLabel || 'weights in the model', min: wDef.min, max: wDef.max, step: 1, value: weights, color: 'blue',
      onInput: (v) => { weights = v; tried.add(v); render(); env.onChange(getState()); },
    });
    fr.controls.appendChild(slider.el);
  }
  let revealBtn = null;
  let sampleBtn = null;
  if (interactive && spec.reveal !== false && spec.reveal !== true) {
    revealBtn = button('Reveal fresh data', () => {
      if (readOnly || revealed) return;
      revealed = true;
      play('reveal');
      render();
      env.announce('Fresh examples revealed.');
      env.onChange(getState());
    }, { icon: 'eye', variant: 'primary' });
    fr.buttons.appendChild(revealBtn);
  }
  if (interactive && spec.resample) {
    sampleBtn = button('New training data', () => {
      if (readOnly) return;
      // same inputs, same underlying pattern, fresh random scatter
      const gauss = () => Math.sqrt(-2 * Math.log(1 - env.rng.next())) * Math.cos(2 * Math.PI * env.rng.next());
      train = train.map(([x]) => [x, tidy(Math.min(yWin[1] - 0.3, Math.max(yWin[0] + 0.3, truth({ x }) + noise * gauss())), 1)]);
      samples += 1;
      sampledAt[weights] = (sampledAt[weights] || 0) + 1;
      refit();
      play('drop');
      render();
      env.onChange(getState());
    }, { icon: 'dice' });
    fr.buttons.appendChild(sampleBtn);
  }

  /* ----------------------------------------------------------- render */
  function drawChart() {
    if (!chart) return;
    const { cp, g, band, top } = chart;
    band.setAttribute('x', cp.sx(weights - 0.5));
    while (g.firstChild) g.removeChild(g.firstChild);
    const list = Array.from(tried).sort((p, q) => p - q);
    const yOf = (v) => cp.sy(Math.min(v, top));
    const series = [['train', 'orange', null], ['test', 'teal', '7 6']];
    for (const [field, color, dash] of series) {
      if (field === 'test' && !revealed) continue;
      let d = '';
      list.forEach((k, i) => { d += `${i ? 'L' : 'M'}${cp.sx(k).toFixed(1)} ${yOf(fits[k][field]).toFixed(1)}`; });
      if (list.length > 1) g.appendChild(s('path', { d, fill: 'none', stroke: hue(color), 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': dash }));
    }
    for (const k of list) {
      const here = k === weights;
      const off = fits[k].test > top;
      if (revealed) {
        g.appendChild(diamond(cp.sx(k), yOf(fits[k].test), here ? 9 : 6.5, { fill: hue('teal'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
        if (off) g.appendChild(s('text.fig-label-sm', { x: cp.sx(k), y: cp.top + 28, 'text-anchor': 'middle' }, `↑ ${formatNumber(fits[k].test, 1)}`));
      }
      g.appendChild(s('circle', { cx: cp.sx(k), cy: yOf(fits[k].train), r: here ? 7.5 : 5, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
    }
    chart.svg.setAttribute('aria-label', `Error for each model size tried so far. With ${weights} weights: training error ${formatNumber(fits[weights].train, 2)}${revealed ? `, error on fresh data ${formatNumber(fits[weights].test, 2)}` : ''}.`);
  }

  function render() {
    const fit = fits[weights];
    curve.setAttribute('d', fnPath(fit.f, pl, { samples: 360 }));
    drawTrain();
    gTest.style.display = revealed ? '' : 'none';
    if (fr.keyTest) fr.keyTest.style.display = revealed ? '' : 'none';
    roTrain.set(fit.train);
    roTest.set(revealed ? fit.test : 'hidden');
    if (revealBtn) revealBtn.disabled = readOnly || revealed;
    if (sampleBtn) sampleBtn.disabled = readOnly;
    drawChart();
    svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}A curve with ${weights} weights fitted to ${train.length} training examples. Training error ${formatNumber(fit.train, 2)}${revealed ? `, error on ${test.length} fresh examples ${formatNumber(fit.test, 2)}` : ''}.`);
  }

  function getState() {
    const fit = fits[weights];
    const b = best();
    return {
      weights,
      trainError: tidy(fit.train, 3),
      testError: tidy(fit.test, 3),
      revealed,
      best: b,
      bestError: tidy(fits[b].test, 3),
      gap: tidy(fit.test - fit.train, 3),
      tried: Array.from(tried).sort((p, q) => p - q),
      samples,
      sampledAt: { ...sampledAt },
    };
  }

  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (Array.isArray(next.tried)) { tried.clear(); for (const k of next.tried) if (fits[k]) tried.add(k); }
      if (Number.isInteger(next.weights) && fits[next.weights]) { weights = next.weights; if (slider) slider.set(weights); }
      tried.add(weights);
      if (typeof next.revealed === 'boolean' && spec.reveal !== false) revealed = next.revealed || spec.reveal === true;
      if (next.sampledAt && typeof next.sampledAt === 'object') {
        sampledAt = {};
        for (const k in next.sampledAt) if (Number(next.sampledAt[k]) > 0) sampledAt[k] = Number(next.sampledAt[k]);
        samples = Object.values(sampledAt).reduce((t, v) => t + v, 0);
      }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      if (slider) slider.setDisabled(readOnly);
      render();
    },
  };
}

export const examples = [
  {
    title: 'overfit-lab — more weights, lower training error… and then?',
    spec: { type: 'overfit-lab', xLabel: 'water (litres a week)', yLabel: 'tomatoes (kg)', weights: { value: 3 } },
  },
  {
    title: 'overfit-lab — fresh data shown, new training samples on demand',
    spec: { type: 'overfit-lab', xLabel: 'water (litres a week)', yLabel: 'tomatoes (kg)', weights: { value: 10 }, reveal: true, resample: true },
  },
];
