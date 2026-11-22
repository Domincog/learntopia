/**
 * tiny-net — the smallest network with a hidden layer: two neurons (A and B)
 * each draw a line across the plane of examples, and a third neuron combines
 * their two outputs into the final answer. Nine adjustable numbers in all.
 *
 * {
 *   type: 'tiny-net',
 *   points: [[1.5, 2.2, 1], [1, 5.5, 0]],     // examples: [first input, second input, class 0 or 1]
 *   x: [0, 10], y: [0, 10],
 *   xLabel: 'sunlight', yLabel: 'water',      // names of the two inputs
 *   classes: ['struggles', 'thrives'],        // names of class 0 and class 1 (class 1 is the network's "yes")
 *   A:   { w1: -1, w2: 1, b: 2 },             // hidden neuron A: score = w1·x + w2·y + b
 *   B:   { w1: 1, w2: -1, b: 2 },             // hidden neuron B
 *   out: { a: 1, b: 1, c: -1.5 },             // output neuron: score = a·(A's output) + b·(B's output) + c
 *   edit: ['B'],                              // neurons that get knobs: any of 'A', 'B', 'out' (several: tabs)
 *   train: true,                              // or { rate: 4, steps: 400, perFrame: 1, target: 0.01 }:
 *                                             //   adds a "Train" button that tunes all nine numbers by gradient descent
 *   smooth: false,                            // true: smooth neurons (always on with `train`), see below
 * }
 *
 * Two kinds of neuron:
 *   - sharp (default): a neuron outputs 1 when its score is above 0, otherwise 0;
 *   - smooth: its output slides from 0 to 1 as the score rises (the logistic
 *     curve). Gradient descent needs this, because a sharp switch has no slope.
 *     The network's answer is "yes" where the output neuron is above one half.
 *
 * State: { A, B, out, correct, total, accuracy, solved, fires, steps, trained, error }
 *   fires   — what the output neuron does for each pair of hidden outputs:
 *             { neither, onlyA, onlyB, both } (booleans; sharp mode)
 *   steps   — training steps taken; trained — training has finished
 *   error   — average squared difference between output and class (smooth mode)
 *
 * setState accepts { A, B, out } (partial) and { trained: true }, which runs
 * the whole training at once.
 */
import { frame, plane, drawAxes, sliderRow, readout, button, clipTo, arrowMarker, hue, s, h, tidy, formatNumber, addStyles } from './kit.js';
import { play } from '../core/audio.js';
import { reducedMotion } from '../core/dom.js';

addStyles('tiny-net', `
  .widget-tiny-net .w-net-wiring {
    display: grid;
    gap: 2px;
    justify-self: center;
    max-width: 100%;
    padding: var(--s2) var(--s4);
    border: var(--bw) dashed var(--hair);
    border-radius: var(--r);
    font-size: var(--fs-sm);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .widget-tiny-net .w-net-wiring > div { padding: 1px 0.4em; border-radius: 8px; }
  .widget-tiny-net .w-net-wiring > div.is-editing { background: var(--yellow-soft); }
  .widget-tiny-net .w-net-wiring small { display: block; font-size: var(--fs-xs); font-weight: 600; color: var(--ink-2); text-align: center; padding-top: 2px; }
  .widget-tiny-net .w-net-wiring .is-A { color: var(--violet-text); }
  .widget-tiny-net .w-net-wiring .is-B { color: var(--teal-text); }
  .widget-tiny-net .w-net-wiring .is-out { color: var(--pink-text); }
  .widget-tiny-net .w-net-tabs { justify-self: center; }
  .widget-tiny-net .w-net-tabs button { min-height: 40px; }
  .widget-tiny-net .w-slider { grid-template-columns: minmax(0, 9.5em) minmax(0, 1fr) 2.8em; }
  .widget-tiny-net .w-net-key { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--s1) var(--s3); font-size: var(--fs-sm); font-weight: 700; color: var(--ink-2); }
  .widget-tiny-net .w-net-key span { display: inline-flex; align-items: center; gap: 0.4rem; }
  .widget-tiny-net .w-net-key svg { flex: none; }
  .widget-tiny-net .btn-ghost.btn-sm { box-shadow: none; }
  .widget-tiny-net .btn-sm { min-height: 40px; }
`);

const W = 560;
const H = 420;
const CELL = 5;
let seq = 0;

const sig = (z) => 1 / (1 + Math.exp(-z));

/** Keep the part of a polygon where a·x + b·y + c has the given sign (Sutherland–Hodgman). */
function clipHalf(poly, a, b, c, positive) {
  const val = (p) => (a * p[0] + b * p[1] + c) * (positive ? 1 : -1);
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const vp = val(p);
    const vq = val(q);
    if (vp >= 0) out.push(p);
    if ((vp >= 0) !== (vq >= 0)) {
      const t = vp / (vp - vq);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return out;
}

export default function create(spec, env) {
  const pts = (spec.points || []).map((p) => ({ x: Number(p[0]), y: Number(p[1]), c: p[2] ? 1 : 0 }));
  const classes = spec.classes || ['no', 'yes'];
  const colors = spec.colors || ['blue', 'orange'];
  const xName = spec.xLabel || 'input 1';
  const yName = spec.yLabel || 'input 2';
  const trainDef = spec.train ? { rate: 4, steps: 400, perFrame: 1, target: 0.01, ...(spec.train === true ? {} : spec.train) } : null;
  const smooth = !!trainDef || !!spec.smooth;
  const interactive = !env.compact && !spec.static;
  const editable = interactive && !smooth ? (spec.edit || []).filter((k) => ['A', 'B', 'out'].includes(k)) : [];
  const xWin = spec.x || [0, 10];
  const yWin = spec.y || [0, 10];
  let readOnly = !!env.readOnly;

  /* ------------------------------------------------------------- model */
  const initial = () => ({
    A: { w1: 1, w2: 0, b: -5, ...(spec.A || {}) },
    B: { w1: 0, w2: 1, b: -5, ...(spec.B || {}) },
    out: { a: 1, b: 1, c: -1, ...(spec.out || {}) },
  });
  let net = initial();
  let steps = 0;
  let trained = false;
  let raf = 0;
  let selected = editable[0] || null;

  const act = (z) => (smooth ? sig(z) : (z > 1e-9 ? 1 : 0));
  const hid = (n, x, y) => act(n.w1 * x + n.w2 * y + n.b);
  const outVal = (x, y) => act(net.out.a * hid(net.A, x, y) + net.out.b * hid(net.B, x, y) + net.out.c);
  const says = (x, y) => outVal(x, y) > 0.5;
  const tally = () => pts.reduce((t, p) => t + (says(p.x, p.y) === (p.c === 1) ? 1 : 0), 0);
  const meanError = () => (pts.length ? pts.reduce((t, p) => t + (outVal(p.x, p.y) - p.c) ** 2, 0) / pts.length : 0);

  /* Gradient descent on the average squared error. The inputs are centred and
     scaled first (u = (x − centre) / scale), which is standard practice. */
  const cx = (xWin[0] + xWin[1]) / 2;
  const cy = (yWin[0] + yWin[1]) / 2;
  const sx = (xWin[1] - xWin[0]) / 4;
  const sy = (yWin[1] - yWin[0]) / 4;
  function descend() {
    const toN = (n) => [n.w1 * sx, n.w2 * sy, n.b + n.w1 * cx + n.w2 * cy];
    const A = toN(net.A);
    const B = toN(net.B);
    const o = [net.out.a, net.out.b, net.out.c];
    const gA = [0, 0, 0];
    const gB = [0, 0, 0];
    const go = [0, 0, 0];
    for (const p of pts) {
      const u = (p.x - cx) / sx;
      const v = (p.y - cy) / sy;
      const a = sig(A[0] * u + A[1] * v + A[2]);
      const b = sig(B[0] * u + B[1] * v + B[2]);
      const y = sig(o[0] * a + o[1] * b + o[2]);
      const dz = 2 * (y - p.c) * y * (1 - y);
      go[0] += dz * a; go[1] += dz * b; go[2] += dz;
      const da = dz * o[0] * a * (1 - a);
      const db = dz * o[1] * b * (1 - b);
      gA[0] += da * u; gA[1] += da * v; gA[2] += da;
      gB[0] += db * u; gB[1] += db * v; gB[2] += db;
    }
    const k = trainDef.rate / Math.max(1, pts.length);
    for (let i = 0; i < 3; i++) { A[i] -= k * gA[i]; B[i] -= k * gB[i]; o[i] -= k * go[i]; }
    const toRaw = (n) => ({ w1: n[0] / sx, w2: n[1] / sy, b: n[2] - (n[0] / sx) * cx - (n[1] / sy) * cy });
    net = { A: toRaw(A), B: toRaw(B), out: { a: o[0], b: o[1], c: o[2] } };
    steps += 1;
  }
  const doneTraining = () => steps >= trainDef.steps || (meanError() < trainDef.target && tally() === pts.length);

  /* -------------------------------------------------------------- plot */
  const fr = frame({ width: W, height: H, compact: env.compact, label: spec.alt || 'A tiny network sorting examples on a plane' });
  const { svg } = fr;
  const pl = plane({ x: xWin, y: yWin, width: W, height: H, pad: env.compact ? { l: 14, r: 14, t: 14, b: 14 } : { l: 58, r: 18, t: 22, b: 58 } });
  const clip = clipTo(svg, pl);
  const patId = `w-net-stripes-${++seq}`;
  svg.querySelector('defs').appendChild(s('pattern', { id: patId, width: 12, height: 12, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
    s('line', { x1: 0, y1: 0, x2: 0, y2: 12, stroke: hue(colors[1]), 'stroke-width': 5, opacity: 0.3 })));
  const arrows = { A: arrowMarker(svg, 'violet', 5), B: arrowMarker(svg, 'teal', 5) };

  const noFill = s('rect', { x: pl.left, y: pl.top, width: pl.iw, height: pl.ih, fill: hue(colors[0], 'soft') });
  const yesFill = s('path', { fill: hue(colors[1], 'soft'), stroke: 'none' });
  const yesStripes = s('path', { fill: `url(#${patId})`, stroke: 'none' });
  svg.appendChild(s('g', { 'clip-path': clip, opacity: 0.9 }, noFill, yesFill, yesStripes));
  svg.appendChild(drawAxes(pl, { xStep: spec.xStep, yStep: spec.yStep, labels: !env.compact, box: env.compact }));
  const midY = (pl.top + pl.bottom) / 2;
  if (!env.compact) {
    svg.appendChild(s('text.axis-label', { x: (pl.left + pl.right) / 2, y: H - 9, 'text-anchor': 'middle' }, xName));
    svg.appendChild(s('text.axis-label', { x: 15, y: midY, 'text-anchor': 'middle', transform: `rotate(-90 15 ${midY})` }, yName));
  }

  const tint = { A: 'violet', B: 'teal', out: 'pink' };
  const lines = {};
  for (const key of ['A', 'B']) {
    const line = s('line', { stroke: hue(tint[key]), 'stroke-width': 4.5, 'stroke-linecap': 'round', 'clip-path': clip });
    const tick = s('line', { stroke: hue(tint[key]), 'stroke-width': 3.5, 'stroke-linecap': 'round', 'marker-end': arrows[key] });
    const tag = s('text.fig-label', { 'text-anchor': 'middle', style: `fill:${hue(tint[key], 'text')}` }, key);
    lines[key] = { line, tick, tag };
    svg.append(line, tick, tag);
  }
  const gRings = s('g');
  const gPts = s('g');
  svg.append(gRings, gPts);
  const rings = pts.map((p) => {
    const px = pl.sx(p.x);
    const py = pl.sy(p.y);
    const ring = s('circle', { cx: px, cy: py, r: 14, fill: 'none', stroke: hue('red'), 'stroke-width': 3.5 });
    gRings.appendChild(ring);
    gPts.appendChild(p.c === 1
      ? s('circle', { cx: px, cy: py, r: 7.5, fill: hue(colors[1]), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 })
      : s('rect', { x: px - 6.5, y: py - 6.5, width: 13, height: 13, rx: 2.5, fill: hue(colors[0]), stroke: 'var(--edge-strong)', 'stroke-width': 2.5 }));
    return ring;
  });

  /* ---------------------------------------------------------- controls */
  if (!env.compact) {
    const dot = (inner) => { const el = s('svg', { width: 18, height: 18, viewBox: '0 0 18 18', 'aria-hidden': 'true' }); el.appendChild(inner); return el; };
    fr.el.insertBefore(h('div.w-net-key',
      h('span', dot(s('circle', { cx: 9, cy: 9, r: 6, fill: hue(colors[1]), stroke: 'var(--edge-strong)', 'stroke-width': 2 })), classes[1]),
      h('span', dot(s('rect', { x: 3.5, y: 3.5, width: 11, height: 11, rx: 2, fill: hue(colors[0]), stroke: 'var(--edge-strong)', 'stroke-width': 2 })), classes[0]),
      h('span', dot(s('rect', { x: 2, y: 2, width: 14, height: 14, rx: 3, fill: `url(#${patId})`, stroke: hue(colors[1]), 'stroke-width': 2 })), `says “${classes[1]}”`),
      h('span', dot(s('circle', { cx: 9, cy: 9, r: 6.5, fill: 'none', stroke: hue('red'), 'stroke-width': 3 })), 'wrong'),
    ), fr.canvas.nextSibling);
  }
  const roCorrect = readout('sorted correctly', { digits: 0 });
  const roSteps = readout('training steps', { digits: 0 });
  const roError = readout('error', { digits: 3 });
  if (!env.compact) {
    fr.readouts.appendChild(roCorrect.el);
    if (trainDef) fr.readouts.append(roSteps.el, roError.el);
  }
  const wiring = h('div.w-net-wiring');
  if (!env.compact && spec.wiring !== false) fr.el.insertBefore(wiring, fr.buttons);

  const ranges = {
    w: { min: -2, max: 2, step: 0.5 }, b: { min: -20, max: 20, step: 1 },
    v: { min: -2, max: 2, step: 0.5 }, c: { min: -3, max: 3, step: 0.5 },
    ...(spec.ranges || {}),
  };
  const sliderSets = {};
  let tabs = null;
  if (editable.length) {
    if (editable.length > 1) {
      const names = { A: 'Neuron A', B: 'Neuron B', out: 'Output neuron' };
      tabs = h('div.segmented.w-net-tabs', { role: 'group', 'aria-label': 'Which neuron to adjust' }, editable.map((key) => {
        const btn = h('button', { type: 'button', 'aria-pressed': String(key === selected), dataset: { key } }, names[key]);
        btn.addEventListener('click', () => { if (readOnly) return; selected = key; play('select'); showSliders(); render(); });
        return btn;
      }));
      fr.controls.appendChild(tabs);
    }
    for (const key of editable) {
      const rows = key === 'out'
        ? [['a', 'weight: A', ranges.v, 'violet'], ['b', 'weight: B', ranges.v, 'teal'], ['c', 'bias', ranges.c, 'pink']]
        : [['w1', `weight: ${xName}`, ranges.w, tint[key]], ['w2', `weight: ${yName}`, ranges.w, tint[key]], ['b', 'bias', ranges.b, tint[key]]];
      const wrap = h('div.w-controls');
      sliderSets[key] = { wrap, rows: {} };
      for (const [field, label, r, color] of rows) {
        const row = sliderRow({
          label, min: r.min, max: r.max, step: r.step, value: net[key][field], color,
          onInput: (v) => { net[key][field] = v; render(); env.onChange(getState()); },
        });
        sliderSets[key].rows[field] = row;
        wrap.appendChild(row.el);
      }
      fr.controls.appendChild(wrap);
    }
  }
  function showSliders() {
    for (const key in sliderSets) sliderSets[key].wrap.hidden = key !== selected;
    if (tabs) for (const btn of tabs.children) btn.setAttribute('aria-pressed', String(btn.dataset.key === selected));
  }

  const stopRun = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } };
  let trainBtn = null;
  let resetBtn = null;
  function finish() {
    stopRun();
    trained = true;
    render();
    play('correct');
    env.announce(`Training finished after ${steps} steps: ${tally()} of ${pts.length} sorted correctly.`);
    env.onChange(getState());
  }
  function train() {
    if (readOnly || raf || trained) return;
    if (reducedMotion()) { while (!doneTraining()) descend(); finish(); return; }
    const tick = () => {
      for (let i = 0; i < trainDef.perFrame && !doneTraining(); i++) descend();
      if (doneTraining()) { raf = 0; finish(); return; }
      render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    render();
  }
  if (trainDef && interactive) {
    trainBtn = button('Train', train, { icon: 'play', variant: 'primary' });
    resetBtn = button('Start again', () => { if (readOnly) return; stopRun(); net = initial(); steps = 0; trained = false; render(); env.onChange(getState()); }, { icon: 'reset', variant: 'ghost' });
    fr.buttons.append(trainBtn, resetBtn);
  }

  /* ------------------------------------------------------------ render */
  const num = (v) => formatNumber(v, smooth ? 1 : 2);
  const term = (v, name, first) => `${first ? (v < 0 ? '−' : '') : (v < 0 ? ' − ' : ' + ')}${num(Math.abs(v))}${name ? ` × ${name}` : ''}`;
  const toPath = (poly) => (poly.length < 3 ? '' : `${poly.map((p, i) => `${i ? 'L' : 'M'}${pl.sx(p[0]).toFixed(1)} ${pl.sy(p[1]).toFixed(1)}`).join('')}Z`);

  function drawRegions() {
    let d = '';
    if (smooth) {
      // sample the network on a fine grid; join the "yes" cells of each row into runs
      const cols = Math.ceil(pl.iw / CELL);
      const rows = Math.ceil(pl.ih / CELL);
      for (let j = 0; j < rows; j++) {
        const y = pl.uy(pl.top + (j + 0.5) * CELL);
        let run = -1;
        for (let i = 0; i <= cols; i++) {
          const yes = i < cols && says(pl.ux(pl.left + (i + 0.5) * CELL), y);
          if (yes && run < 0) run = i;
          if (!yes && run >= 0) { d += `M${pl.left + run * CELL} ${pl.top + j * CELL}h${(i - run) * CELL}v${CELL}h${-(i - run) * CELL}z`; run = -1; }
        }
      }
    } else {
      const rect = [[xWin[0], yWin[0]], [xWin[1], yWin[0]], [xWin[1], yWin[1]], [xWin[0], yWin[1]]];
      const side = (poly, n, on) => {
        if (Math.abs(n.w1) < 1e-9 && Math.abs(n.w2) < 1e-9) return (n.b > 1e-9) === on ? poly : [];
        return clipHalf(poly, n.w1, n.w2, n.b, on);
      };
      for (const a of [0, 1]) for (const b of [0, 1]) {
        if (!(net.out.a * a + net.out.b * b + net.out.c > 1e-9)) continue;
        d += toPath(side(side(rect, net.A, a === 1), net.B, b === 1));
      }
    }
    yesFill.setAttribute('d', d);
    yesStripes.setAttribute('d', d);
  }

  function drawLine(key, along) {
    const n = net[key];
    const { line, tick, tag } = lines[key];
    const rect = [[xWin[0], yWin[0]], [xWin[1], yWin[0]], [xWin[1], yWin[1]], [xWin[0], yWin[1]]];
    const len = Math.hypot(n.w1, n.w2);
    // where the line crosses the window
    const hits = [];
    if (len > 1e-9) {
      for (let i = 0; i < 4; i++) {
        const p = rect[i];
        const q = rect[(i + 1) % 4];
        const vp = n.w1 * p[0] + n.w2 * p[1] + n.b;
        const vq = n.w1 * q[0] + n.w2 * q[1] + n.b;
        if ((vp > 0) !== (vq > 0)) { const t = vp / (vp - vq); hits.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]); }
      }
    }
    const visible = hits.length >= 2;
    for (const el of [line, tick, tag]) el.style.display = visible ? '' : 'none';
    if (!visible) return;
    const [p, q] = hits;
    line.setAttribute('x1', pl.sx(p[0])); line.setAttribute('y1', pl.sy(p[1]));
    line.setAttribute('x2', pl.sx(q[0])); line.setAttribute('y2', pl.sy(q[1]));
    // a small arrow on the line pointing to the side where the neuron fires,
    // with the neuron's letter just behind it; placed where it hides no example
    const nl = Math.hypot(n.w1 / pl.kx, n.w2 / pl.ky) || 1;
    const nx = (n.w1 / pl.kx) / nl;      // unit normal in pixel space, towards the firing side
    const ny = (-n.w2 / pl.ky) / nl;     // (y grows downwards on screen)
    let spot = null;
    for (const t of [along, 0.5, 1 - along, 0.15, 0.85]) {
      const mx = pl.sx(p[0] + (q[0] - p[0]) * t);
      const my = pl.sy(p[1] + (q[1] - p[1]) * t);
      const tx = mx - nx * 20;
      const ty = my - ny * 20;
      let room = Math.min(tx - pl.left, pl.right - tx, ty - pl.top, pl.bottom - ty) + 8;
      for (const pt of pts) {
        room = Math.min(room, Math.hypot(pl.sx(pt.x) - tx, pl.sy(pt.y) - ty), Math.hypot(pl.sx(pt.x) - (mx + nx * 22), pl.sy(pt.y) - (my + ny * 22)));
      }
      if (!spot || room > spot.room + 0.5) spot = { mx, my, tx, ty, room };
      if (room > 26) break;
    }
    tick.setAttribute('x1', spot.mx); tick.setAttribute('y1', spot.my);
    tick.setAttribute('x2', spot.mx + nx * 24); tick.setAttribute('y2', spot.my + ny * 24);
    tag.setAttribute('x', spot.tx);
    tag.setAttribute('y', spot.ty + 6);
    if (env.compact) { tick.style.display = 'none'; tag.style.display = 'none'; }
  }

  function render() {
    drawRegions();
    drawLine('A', 0.3);
    drawLine('B', 0.7);
    let correct = 0;
    pts.forEach((p, i) => {
      const ok = says(p.x, p.y) === (p.c === 1);
      if (ok) correct += 1;
      rings[i].style.display = ok ? 'none' : '';
    });
    roCorrect.set(`${correct} of ${pts.length}`);
    roSteps.set(steps);
    roError.set(meanError());
    const row = (key, text) => `<div class="${selected === key && editable.length ? 'is-editing' : ''}"><span class="is-${key}">${key === 'out' ? 'Output' : key}</span>: score = ${text}</div>`;
    wiring.innerHTML =
      row('A', `${term(net.A.w1, xName, true)}${term(net.A.w2, yName)}${term(net.A.b)}`) +
      row('B', `${term(net.B.w1, xName, true)}${term(net.B.w2, yName)}${term(net.B.b)}`) +
      row('out', `${term(net.out.a, 'A', true)}${term(net.out.b, 'B')}${term(net.out.c)}`) +
      `<small>${smooth ? 'Smooth neurons: each output slides from 0 to 1 as its score rises.' : 'A neuron fires (outputs 1) when its score is above 0. Otherwise it outputs 0.'}</small>`;
    if (trainBtn) { trainBtn.disabled = readOnly || !!raf || trained; resetBtn.disabled = readOnly || (!steps && !raf); }
    svg.setAttribute('aria-label', `${spec.alt ? spec.alt + ' ' : ''}The network sorts ${correct} of ${pts.length} examples correctly.${trainDef ? ` Training steps: ${steps}.` : ''}`);
  }

  function getState() {
    const correct = tally();
    const fire = (a, b) => net.out.a * a + net.out.b * b + net.out.c > 1e-9;
    const round = (o) => { const out = {}; for (const k in o) out[k] = tidy(o[k], 3); return out; };
    return {
      A: round(net.A), B: round(net.B), out: round(net.out),
      correct,
      total: pts.length,
      accuracy: pts.length ? tidy(correct / pts.length, 4) : 1,
      solved: correct === pts.length,
      fires: { neither: fire(0, 0), onlyA: fire(1, 0), onlyB: fire(0, 1), both: fire(1, 1) },
      steps,
      trained,
      error: tidy(meanError(), 4),
    };
  }

  showSliders();
  render();
  if (readOnly) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      stopRun();
      if (trainDef && next.trained) {
        net = initial();
        steps = 0;
        while (!doneTraining()) descend();
        trained = true;
      } else {
        for (const key of ['A', 'B', 'out']) {
          if (!next[key]) continue;
          for (const field in net[key]) if (typeof next[key][field] === 'number') net[key][field] = next[key][field];
          if (sliderSets[key]) for (const field in sliderSets[key].rows) sliderSets[key].rows[field].set(net[key][field]);
        }
      }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      if (readOnly && raf) { while (!doneTraining()) descend(); stopRun(); trained = true; }
      fr.el.classList.toggle('is-readonly', readOnly);
      for (const key in sliderSets) for (const field in sliderSets[key].rows) sliderSets[key].rows[field].setDisabled(readOnly);
      if (tabs) for (const btn of tabs.children) btn.disabled = readOnly;
      render();
    },
    destroy() { stopRun(); },
  };
}

const PLANTS = [
  [1.5, 2.2, 1], [2.8, 2, 1], [3.6, 4.4, 1], [4.8, 4.2, 1], [5.6, 6.6, 1], [6.8, 6.2, 1], [7.6, 8.4, 1], [8.6, 7.8, 1],
  [1, 5.5, 0], [2, 8, 0], [3.5, 7.5, 0], [4.6, 9.2, 0],
  [5.5, 1.5, 0], [7, 3, 0], [8.5, 1.2, 0], [9, 4.6, 0],
];

export const examples = [
  {
    title: 'tiny-net — tune any of the three neurons by hand',
    spec: {
      type: 'tiny-net', points: PLANTS, xLabel: 'sunlight', yLabel: 'water', classes: ['struggles', 'thrives'],
      A: { w1: -1, w2: 1, b: 2 }, B: { w1: 1, w2: -0.5, b: -1 }, out: { a: 1, b: 1, c: -1.5 }, edit: ['A', 'B', 'out'],
    },
  },
  {
    title: 'tiny-net — let gradient descent find all nine numbers',
    spec: { type: 'tiny-net', points: PLANTS, xLabel: 'sunlight', yLabel: 'water', classes: ['struggles', 'thrives'], train: true },
  },
];
