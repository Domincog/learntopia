/**
 * loss-curves — train a real (very small) network and read its loss curves.
 *
 * The problem is fixed: predict a tomato harvest (kg) from the water a plant
 * gets (litres a week). There are 12 training plants and 12 validation plants
 * that the network never trains on. The network has 1 input, 20 hidden ReLU
 * units and 1 output (61 weights), always starts from the same weights, and is
 * trained by gradient descent on the squared error, with the gradients worked
 * out by backpropagation. The learner chooses the learning rate and the batch
 * size, presses "Train", and gets the loss after every epoch (one pass through
 * the 12 training plants) for the training data and for the validation data.
 *
 * Nothing here is faked: the curves are whatever that training run produces.
 * With batch size 12 every step uses all the plants, so the run is the same
 * every time. Smaller batches are drawn in a fresh random order each epoch;
 * that order comes from env.rng, so within one figure the same settings always
 * give the same curve.
 *
 * {
 *   type: 'loss-curves',
 *   rate: { values: [0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5], value: 0.02 },   // slider; a plain number fixes it
 *   batch: { values: [1, 2, 4, 12], value: 12 },                                       // slider; a plain number fixes it
 *   decay: false,            // true: the learning rate is halved every 50 epochs; 'toggle': a button switches that on and off
 *   epochs: 300,
 *   validation: true,        // draw the validation curve as well
 *   fit: true,               // second panel: the plants and the curve the network predicts
 *   stop: false,             // true: an "epoch" slider moves a marker along the curves; the second panel shows the network at that epoch
 *   goal: 0.3,               // optional: a dotted line at this training loss; the state says when it was first reached
 *   compare: true,           // keep the previous run on the chart, in grey
 *   run: false,              // true: train once when the figure appears (for pictures and for steps without a Train button)
 *   yMax: 2.4,               // top of the loss axis
 *   static: false,           // true: a picture without controls (implies run)
 * }
 *
 * State: { rate, batch, decay, ran, runs, diverged, spiked, peak, finalTrain, finalVal, bestEpoch, bestVal,
 *          bumps, lateBumps, reached, epoch, trainAt, valAt, history }
 *   ran         a run has been made with the settings as they stand now
 *   runs        how many runs have been made
 *   diverged    the training loss went past 1000 (or stopped being a number): training was stopped
 *   peak        the highest training loss after the start; spiked: peak is more than twice the starting loss
 *   finalTrain, finalVal   the losses after the last epoch
 *   bestEpoch, bestVal     the epoch with the lowest validation loss, and that loss
 *   bumps       at how many epochs the training loss was higher than the epoch before
 *   lateBumps   the same count for the last 100 epochs only
 *   reached     the first epoch at which the training loss was below `goal` (null if never, or without a goal)
 *   epoch       where the marker is (with stop: true), with trainAt and valAt, the two losses there
 *   history     every run so far: [{ rate, batch, decay, diverged, spiked, finalTrain, finalVal, bestEpoch, bumps, lateBumps, reached }]
 *
 * setState accepts { rate, batch, decay, epoch }, { run: true } (train with the settings just given) and
 * { runs: [{ rate, batch, decay }, …] } (make these runs one after the other).
 */
import { frame, sliderRow, readout, button, hue, s, clamp, tidy, loop, formatNumber, addStyles } from './kit.js';
import { reducedMotion } from '../core/dom.js';
import { play } from '../core/audio.js';

addStyles('loss-curves', `
  .widget-loss-curves .lc-note { text-align: center; font-size: var(--fs-sm); color: var(--ink-2); font-weight: 600; min-height: 1.5em; }
  .widget-loss-curves .lc-note.is-bad { color: var(--red-text); }
`);

/** Training plants: [water in litres a week, harvest in kg]. */
export const TRAIN = [[0.3, 1], [1.3, 1.6], [2, 5.5], [3.2, 5.9], [3.6, 6.8], [4.4, 6.2], [5.6, 8.2], [6.2, 8.3], [7.2, 8.3], [7.7, 7.6], [8.5, 3.9], [9.7, 2.9]];
/** Validation plants, from the same greenhouse. The network never trains on them. */
export const VALIDATION = [[0.6, 1.5], [1.4, 2.4], [2.6, 5.8], [3, 4.8], [4.3, 6.6], [5.1, 8.3], [5.5, 7.7], [6.8, 6.7], [7.2, 6.9], [8, 4.7], [8.8, 6.8], [9.8, 4.8]];
/** Starting weights of the 20 hidden units: input weight, bias and output weight of each. The output bias starts at 0. */
const W0 = [-1.127, -1.213, 1.055, -0.848, -0.995, -0.643, 0.895, 1.358, -1.37, 0.753, -0.752, -0.865, 0.838, -0.902, 1.293, 0.715, -1.481, 0.766, -1.578, -1.001];
const B0 = [-1.691, -1.559, 1.279, -0.93, -0.877, -0.485, 0.488, 0.509, -0.28, 0.092, 0.05, 0.218, -0.352, 0.537, -1.024, -0.667, 1.628, -0.973, 2.259, 1.504];
const V0 = [0.289, 0.132, -0.007, -0.207, 0.16, -0.044, -0.177, -0.184, 0.297, -0.106, 0.136, -0.271, 0.294, 0.106, 0.251, -0.276, 0.006, 0.106, -0.202, -0.105];
const HIDDEN = W0.length;
/** Inputs and outputs are rescaled before training, as is usual: water to (x − 5) / 3, harvest to (y − 5.5) / 2. */
const sx = (x) => (x - 5) / 3;
const sy = (y) => (y - 5.5) / 2;
const GRID = Array.from({ length: 51 }, (_, i) => i / 5); // 0, 0.2, …, 10 litres

const predict = (net, x) => {
  let y = net.c;
  for (let i = 0; i < HIDDEN; i++) { const z = net.w[i] * x + net.b[i]; if (z > 0) y += net.v[i] * z; }
  return y;
};
const meanSquare = (net, pts) => pts.reduce((t, [x, y]) => t + (predict(net, sx(x)) - sy(y)) ** 2, 0) / pts.length;

/**
 * One training run. Returns { train: [...], val: [...], curves: [...], diverged } with one entry per epoch
 * (entry 0 is before any training). `rng` needs a shuffle(array) method; it is only used for batches smaller than 12.
 */
export function trainRun({ rate = 0.02, batch = 12, decay = false, epochs = 300 } = {}, rng = null) {
  const net = { w: W0.slice(), b: B0.slice(), v: V0.slice(), c: 0 };
  const n = TRAIN.length;
  const size = clamp(Math.round(batch), 1, n);
  const train = [meanSquare(net, TRAIN)];
  const val = [meanSquare(net, VALIDATION)];
  const curve = () => GRID.map((x) => predict(net, sx(x)) * 2 + 5.5);
  const curves = [curve()];
  const identity = TRAIN.map((_, i) => i);
  let diverged = false;
  for (let e = 0; e < epochs; e++) {
    const lr = decay ? rate * 0.5 ** Math.floor(e / 50) : rate;
    const order = size >= n || !rng ? identity : rng.shuffle(identity);
    for (let from = 0; from < n; from += size) {
      const idx = order.slice(from, from + size);
      const gw = new Array(HIDDEN).fill(0); const gb = new Array(HIDDEN).fill(0); const gv = new Array(HIDDEN).fill(0);
      let gc = 0;
      for (const k of idx) {
        const x = sx(TRAIN[k][0]);
        const d = (2 * (predict(net, x) - sy(TRAIN[k][1]))) / idx.length;   // gradient at the output, averaged over the batch
        gc += d;
        for (let i = 0; i < HIDDEN; i++) {
          const z = net.w[i] * x + net.b[i];
          if (z > 0) { gv[i] += d * z; gw[i] += d * net.v[i] * x; gb[i] += d * net.v[i]; }   // a unit that is switched off passes nothing back
        }
      }
      for (let i = 0; i < HIDDEN; i++) { net.w[i] -= lr * gw[i]; net.b[i] -= lr * gb[i]; net.v[i] -= lr * gv[i]; }
      net.c -= lr * gc;
    }
    const t = meanSquare(net, TRAIN);
    if (!Number.isFinite(t) || t > 1000) { diverged = true; break; }
    train.push(t);
    val.push(meanSquare(net, VALIDATION));
    curves.push(curve());
  }
  return { train, val, curves, diverged };
}

/** The facts about a run that lessons check. */
export function summarize(run, goal = null) {
  const { train, val } = run;
  const last = train.length - 1;
  let bestEpoch = 0;
  val.forEach((v, i) => { if (v < val[bestEpoch]) bestEpoch = i; });
  let bumps = 0;
  let lateBumps = 0;
  for (let i = 1; i < train.length; i++) {
    if (train[i] > train[i - 1]) { bumps += 1; if (i > last - 100) lateBumps += 1; }
  }
  const peak = train.length > 1 ? Math.max(...train.slice(1)) : train[0];
  const reached = goal == null ? null : train.findIndex((v) => v < goal);
  return {
    diverged: run.diverged,
    peak: tidy(peak, 4),
    spiked: run.diverged || peak > 2 * train[0],
    finalTrain: tidy(train[last], 4),
    finalVal: tidy(val[last], 4),
    bestEpoch,
    bestVal: tidy(val[bestEpoch], 4),
    bumps,
    lateBumps,
    reached: reached == null || reached < 0 ? null : reached,
    length: last,
  };
}

const W = 640;
const H = 300;
let clipCount = 0;

export default function create(spec, env) {
  const isStatic = !!spec.static || !!env.compact;
  const epochs = clamp(Math.round(spec.epochs || 300), 20, 600);
  const showVal = spec.validation !== false;
  const showFit = spec.fit !== false && !env.compact;
  const goal = typeof spec.goal === 'number' ? spec.goal : null;
  const yMax = spec.yMax || 2.4;
  const withStop = !!spec.stop && !isStatic;
  let readOnly = !!env.readOnly;

  const listOf = (def, fallback) => (def && typeof def === 'object' && Array.isArray(def.values) ? def.values.slice() : fallback);
  const rateDef = spec.rate && typeof spec.rate === 'object' ? spec.rate : null;
  const batchDef = spec.batch && typeof spec.batch === 'object' ? spec.batch : null;
  const rates = listOf(rateDef, [0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5]);
  const batches = listOf(batchDef, [1, 2, 4, 12]);
  let rate = rateDef ? (rateDef.value != null ? rateDef.value : rates[0]) : (typeof spec.rate === 'number' ? spec.rate : 0.02);
  let batch = batchDef ? (batchDef.value != null ? batchDef.value : batches[batches.length - 1]) : (typeof spec.batch === 'number' ? spec.batch : 12);
  let decay = spec.decay === true;
  const decayToggle = spec.decay === 'toggle' && !isStatic;

  let current = null;      // { settings, run, facts }
  let previous = null;
  let epoch = 0;           // the marker
  let shown = epochs;      // how much of the curve has been revealed (animation)
  const history = [];

  const settingsNow = () => ({ rate, batch, decay });
  const same = (a, b) => a && b && a.rate === b.rate && a.batch === b.batch && a.decay === b.decay;

  function makeRun(announce = true) {
    const settings = settingsNow();
    // the same settings always get the same stream of random batches. The schedule is left out of the label on
    // purpose: a run with it and a run without it draw the same batches, so they differ only where the rate differs.
    const rng = batch >= TRAIN.length ? null : env.rng.fork(`loss-curves ${rate} ${batch}`);
    const run = trainRun({ ...settings, epochs }, rng);
    const facts = summarize(run, goal);
    if (current && spec.compare !== false && !same(current.settings, settings)) previous = current;
    current = { settings, run, facts };
    history.push({ ...settings, diverged: facts.diverged, spiked: facts.spiked, finalTrain: facts.finalTrain, finalVal: facts.finalVal, bestEpoch: facts.bestEpoch, bumps: facts.bumps, lateBumps: facts.lateBumps, reached: facts.reached });
    epoch = Math.min(epoch || facts.length, facts.length);
    if (!withStop) epoch = facts.length;
    if (announce) env.announce(facts.diverged ? 'The loss blew up and training was stopped.' : `Training finished. Training loss ${formatNumber(facts.finalTrain, 2)}${showVal ? `, validation loss ${formatNumber(facts.finalVal, 2)}` : ''}.`);
  }

  const getState = () => {
    const ran = !!current && same(current.settings, settingsNow());
    const facts = current ? current.facts : {};
    const at = current ? Math.min(epoch, current.facts.length) : 0;
    return {
      rate, batch, decay,
      ran,
      runs: history.length,
      diverged: !!facts.diverged,
      spiked: !!facts.spiked,
      peak: facts.peak != null ? facts.peak : null,
      finalTrain: facts.finalTrain != null ? facts.finalTrain : null,
      finalVal: facts.finalVal != null ? facts.finalVal : null,
      bestEpoch: facts.bestEpoch != null ? facts.bestEpoch : null,
      bestVal: facts.bestVal != null ? facts.bestVal : null,
      bumps: facts.bumps != null ? facts.bumps : null,
      lateBumps: facts.lateBumps != null ? facts.lateBumps : null,
      reached: facts.reached != null ? facts.reached : null,
      epoch: at,
      trainAt: current ? tidy(current.run.train[at], 4) : null,
      valAt: current ? tidy(current.run.val[at], 4) : null,
      history: history.map((hst) => ({ ...hst })),
    };
  };

  /* -------------------------------------------------------------- drawing */
  const fr = frame({ width: showFit ? W : 440, height: H, compact: env.compact, maxWidth: showFit ? 680 : 520, label: spec.alt || 'Loss curves of a training run' });
  const { svg } = fr;
  const C = { l: 46, r: showFit ? 392 : 426, t: 16, b: H - 40 };            // the loss chart
  const F = { l: 432, r: W - 12, t: 34, b: H - 40 };                         // the fit panel
  const ex = (e) => C.l + (e / epochs) * (C.r - C.l);
  const ly = (v) => C.b - (clamp(v, 0, yMax * 1.2) / yMax) * (C.b - C.t);
  const fx = (x) => F.l + (x / 10) * (F.r - F.l);
  const fy = (y) => F.b - (clamp(y, -2, 13) / 11) * (F.b - F.t);

  // chart furniture
  const gAxes = s('g');
  for (let v = 0; v <= yMax + 1e-9; v += 0.5) {
    gAxes.appendChild(s('line.grid-line', { x1: C.l, x2: C.r, y1: ly(v), y2: ly(v) }));
    gAxes.appendChild(s('text.tick-label', { x: C.l - 7, y: ly(v) + 4, 'text-anchor': 'end' }, formatNumber(v, 1)));
  }
  const xTick = epochs <= 100 ? 20 : epochs <= 300 ? 100 : 200;
  for (let e = 0; e <= epochs; e += xTick) {
    gAxes.appendChild(s('line.grid-line', { x1: ex(e), x2: ex(e), y1: C.t, y2: C.b }));
    gAxes.appendChild(s('text.tick-label', { x: ex(e), y: C.b + 16, 'text-anchor': 'middle' }, String(e)));
  }
  gAxes.appendChild(s('line.axis-line', { x1: C.l, x2: C.r, y1: C.b, y2: C.b }));
  gAxes.appendChild(s('line.axis-line', { x1: C.l, x2: C.l, y1: C.t, y2: C.b }));
  gAxes.appendChild(s('text.axis-label', { x: C.r, y: H - 6, 'text-anchor': 'end' }, 'epochs'));
  gAxes.appendChild(s('text.axis-label', { x: C.l + 8, y: C.t + 10 }, 'loss'));
  svg.appendChild(gAxes);
  if (goal != null) {
    svg.appendChild(s('line', { x1: C.l, x2: C.r, y1: ly(goal), y2: ly(goal), stroke: hue('green'), 'stroke-width': 2, 'stroke-dasharray': '2 6', 'stroke-linecap': 'round' }));
    svg.appendChild(s('text', { class: 'fig-label-sm text-green', x: C.r - 4, y: ly(goal) - 6, 'text-anchor': 'end' }, `goal ${formatNumber(goal, 2)}`));
  }
  // legend: line style as well as colour
  const legendY = C.t + 12;
  const legend = s('g');
  const lx = C.r - (showVal ? 196 : 96);
  legend.appendChild(s('line', { x1: lx, x2: lx + 24, y1: legendY, y2: legendY, stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
  legend.appendChild(s('text', { class: 'fig-label-sm', x: lx + 30, y: legendY + 4 }, 'training'));
  if (showVal) {
    legend.appendChild(s('line', { x1: lx + 98, x2: lx + 122, y1: legendY, y2: legendY, stroke: hue('orange'), 'stroke-width': 3.5, 'stroke-dasharray': '7 5' }));
    legend.appendChild(s('text', { class: 'fig-label-sm', x: lx + 128, y: legendY + 4 }, 'validation'));
  }
  const clipId = `lc-clip-${Math.round(C.r)}-${++clipCount}`;
  const clipRect = s('rect', { x: C.l, y: C.t - 4, width: C.r - C.l, height: C.b - C.t + 8 });
  svg.appendChild(s('defs', {}, s('clipPath', { id: clipId }, clipRect)));
  const gCurves = s('g', { 'clip-path': `url(#${clipId})` });
  const gMarks = s('g');
  svg.append(gCurves, legend, gMarks);
  const gFit = s('g');
  if (showFit) {
    svg.appendChild(s('rect', { x: F.l, y: F.t, width: F.r - F.l, height: F.b - F.t, rx: 8, fill: 'none', stroke: 'var(--hair)', 'stroke-width': 2 }));
    svg.appendChild(s('text.axis-label', { x: F.r, y: H - 6, 'text-anchor': 'end' }, 'water'));
    svg.appendChild(s('text.axis-label', { x: F.l, y: F.t - 10 }, 'harvest'));
    svg.appendChild(gFit);
  }

  const note = document.createElement('div');
  note.className = 'lc-note';
  if (!env.compact) fr.el.insertBefore(note, fr.readouts);
  const roTrain = readout('training loss', { digits: 2, color: 'blue' });
  const roVal = readout('validation loss', { digits: 2, color: 'orange' });
  if (!env.compact) { fr.readouts.appendChild(roTrain.el); if (showVal) fr.readouts.appendChild(roVal.el); }

  const pathOf = (values, upTo) => {
    let d = '';
    const end = Math.min(values.length - 1, upTo);
    for (let e = 0; e <= end; e++) d += `${e ? 'L' : 'M'}${ex(e).toFixed(1)} ${ly(values[e]).toFixed(1)}`;
    return d;
  };

  function draw() {
    gCurves.replaceChildren();
    gMarks.replaceChildren();
    gFit.replaceChildren();
    const live = current && same(current.settings, settingsNow());
    if (previous) gCurves.appendChild(s('path', { d: pathOf(previous.run.train, epochs), fill: 'none', stroke: 'var(--ink-3)', 'stroke-width': 2, opacity: 0.55, 'stroke-linejoin': 'round' }));
    if (current) {
      const { run, facts } = current;
      const upTo = Math.round(shown);
      if (showVal) gCurves.appendChild(s('path', { d: pathOf(run.val, upTo), fill: 'none', stroke: hue('orange'), 'stroke-width': 3, 'stroke-dasharray': '7 5', 'stroke-linejoin': 'round', opacity: live ? 1 : 0.4 }));
      gCurves.appendChild(s('path', { d: pathOf(run.train, upTo), fill: 'none', stroke: hue('blue'), 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: live ? 1 : 0.4 }));
      const at = Math.min(epoch, facts.length, upTo);
      if (withStop && live) {
        gMarks.appendChild(s('line', { x1: ex(at), x2: ex(at), y1: C.t, y2: C.b, stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-dasharray': '4 4' }));
        gMarks.appendChild(s('circle', { cx: ex(at), cy: ly(run.train[at]), r: 5.5, fill: hue('blue'), stroke: 'var(--edge-strong)', 'stroke-width': 2 }));
        if (showVal) gMarks.appendChild(s('rect', { x: ex(at) - 5, y: ly(run.val[at]) - 5, width: 10, height: 10, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 2, transform: `rotate(45 ${ex(at)} ${ly(run.val[at])})` }));
      }
      if (facts.diverged && upTo >= facts.length) {
        gMarks.appendChild(s('text', { class: 'fig-label text-red', x: Math.min(ex(facts.length) + 8, C.r - 150), y: C.t + 40 }, 'the loss blew up'));
      }
      if (showFit) {
        const curve = run.curves[withStop ? at : Math.min(facts.length, upTo)];
        let d = '';
        GRID.forEach((x, i) => { d += `${i ? 'L' : 'M'}${fx(x).toFixed(1)} ${fy(curve[i]).toFixed(1)}`; });
        gFit.appendChild(s('path', { d, fill: 'none', stroke: hue('violet'), 'stroke-width': 3.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', opacity: live ? 1 : 0.4 }));
      }
      roTrain.set(run.train[at]);
      roVal.set(run.val[at]);
    } else {
      roTrain.set('—');
      roVal.set('—');
    }
    if (showFit) {
      for (const [x, y] of TRAIN) gFit.appendChild(s('circle', { cx: fx(x), cy: fy(y), r: 4.5, fill: hue('blue'), stroke: 'var(--edge-strong)', 'stroke-width': 1.5 }));
      if (showVal) for (const [x, y] of VALIDATION) gFit.appendChild(s('rect', { x: fx(x) - 4, y: fy(y) - 4, width: 8, height: 8, fill: hue('orange'), stroke: 'var(--edge-strong)', 'stroke-width': 1.5, transform: `rotate(45 ${fx(x)} ${fy(y)})` }));
    }
    // one line of plain words under the picture
    note.classList.remove('is-bad');
    if (!current) note.textContent = 'Press “Train” to run 300 epochs.'.replace('300', String(epochs));
    else if (!live) note.textContent = 'The settings have changed. Press “Train” to run them.';
    else if (current.facts.diverged) { note.textContent = `The loss passed 1000 after ${current.facts.length + 1} ${current.facts.length === 0 ? 'epoch' : 'epochs'}: training was stopped.`; note.classList.add('is-bad'); }
    else if (withStop) note.textContent = `Epoch ${Math.min(epoch, current.facts.length)} of ${current.facts.length}`;
    else note.textContent = `${current.facts.length} epochs, ${Math.ceil(TRAIN.length / batch)} ${Math.ceil(TRAIN.length / batch) === 1 ? 'step' : 'steps'} in each`;
    const st = getState();
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${!current ? 'No run yet.' : st.diverged ? 'The loss blew up.' : `Training loss ended at ${formatNumber(st.finalTrain, 2)}${showVal ? `, validation loss at ${formatNumber(st.finalVal, 2)}, lowest at epoch ${st.bestEpoch}` : ''}.`}`);
  }

  /* ------------------------------------------------------------- controls */
  const anim = loop((dt) => {
    shown += dt * epochs * 1.1;
    if (shown >= epochs) { shown = epochs; anim.stop(); }
    draw();
  });
  function train() {
    if (readOnly) return;
    makeRun();
    play('tick');
    if (reducedMotion()) { shown = epochs; draw(); } else { shown = 0; anim.start(); }
    if (stopRow) { stopRow.set(epoch); }
    env.onChange(getState());
  }

  const indexSlider = (label, values, value, color, fmt, set) => {
    let idx = values.indexOf(value);
    if (idx < 0) idx = 0;
    const row = sliderRow({
      label, min: 0, max: values.length - 1, step: 1, value: idx, color, format: (i) => fmt(values[Math.round(i)]),
      onInput: (i) => { if (readOnly) return; set(values[Math.round(i)]); play('tap'); draw(); env.onChange(getState()); },
    });
    return { row, show: (v) => { const i = values.indexOf(v); if (i >= 0) row.set(i); } };
  };
  let rateRow = null;
  let batchRow = null;
  let stopRow = null;
  let decayBtn = null;
  if (!isStatic) {
    if (rateDef) { rateRow = indexSlider('learning rate', rates, rate, 'green', (v) => formatNumber(v, 3), (v) => { rate = v; }); fr.controls.appendChild(rateRow.row.el); }
    if (batchDef) { batchRow = indexSlider('batch size', batches, batch, 'violet', (v) => (v >= TRAIN.length ? `${v} (all)` : String(v)), (v) => { batch = v; }); fr.controls.appendChild(batchRow.row.el); }
    if (withStop) {
      stopRow = sliderRow({
        label: 'look at epoch', min: 0, max: epochs, step: 1, value: epoch, color: 'orange',
        onInput: (v) => { if (readOnly) return; epoch = current ? Math.min(v, current.facts.length) : v; draw(); env.onChange(getState()); },
      });
      fr.controls.appendChild(stopRow.el);
    }
    if (rateDef || batchDef || decayToggle || !spec.run) fr.buttons.appendChild(button('Train', train, { variant: 'primary', icon: 'play' }));
    if (decayToggle) {
      decayBtn = button('Halve the rate every 50 epochs: off', () => {
        if (readOnly) return;
        decay = !decay;
        decayBtn.lastChild.textContent = `Halve the rate every 50 epochs: ${decay ? 'on' : 'off'}`;
        decayBtn.setAttribute('aria-pressed', String(decay));
        play('tap');
        draw();
        env.onChange(getState());
      });
      decayBtn.setAttribute('aria-pressed', 'false');
      fr.buttons.appendChild(decayBtn);
    }
  }

  if (spec.run || isStatic) { makeRun(false); if (withStop) epoch = current.facts.length; if (stopRow) stopRow.set(epoch); }
  draw();
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  const apply = (next) => {
    if (typeof next.rate === 'number') { rate = next.rate; if (rateRow) rateRow.show(rate); }
    if (typeof next.batch === 'number') { batch = next.batch; if (batchRow) batchRow.show(batch); }
    if (typeof next.decay === 'boolean') {
      decay = next.decay;
      if (decayBtn) { decayBtn.lastChild.textContent = `Halve the rate every 50 epochs: ${decay ? 'on' : 'off'}`; decayBtn.setAttribute('aria-pressed', String(decay)); }
    }
  };

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      anim.stop();
      shown = epochs;
      if (Array.isArray(next.runs)) for (const one of next.runs) { apply(one); makeRun(false); }
      apply(next);
      if (next.run) makeRun(false);
      if (typeof next.epoch === 'number') epoch = clamp(Math.round(next.epoch), 0, current ? current.facts.length : epochs);
      else if (current && (next.run || Array.isArray(next.runs))) epoch = withStop ? Math.min(epoch || current.facts.length, current.facts.length) : current.facts.length;
      if (stopRow) stopRow.set(epoch);
      draw();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const row of [rateRow && rateRow.row, batchRow && batchRow.row, stopRow]) if (row) row.setDisabled(readOnly);
    },
    destroy() { anim.stop(); },
  };
}

export const examples = [
  {
    title: 'loss-curves — choose the learning rate and the batch size',
    spec: { type: 'loss-curves', rate: { value: 0.02 }, batch: { value: 12 }, goal: 0.3 },
  },
  {
    title: 'loss-curves — where would you stop?',
    spec: { type: 'loss-curves', rate: 0.02, batch: 12, run: true, stop: true },
  },
];
