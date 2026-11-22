/**
 * backprop-net — a tiny network worked through by hand: two inputs, two hidden
 * ReLU units (A and B), one output y and a squared-error loss.
 *
 *     score of A = wA1·x1 + wA2·x2 + bA      output of A = ReLU(score) = max(0, score)   (the same for B)
 *     y = v1·(output of A) + v2·(output of B) + c            loss = (y − target)²
 *
 * The picture shows every weight on its connection. Forward values sit inside
 * the boxes; gradients (how fast the loss changes when that number goes up by
 * a little) are the orange badges. Quantities listed in `ask` start as blanks:
 * the learner types them in one at a time, in order, and each right answer is
 * revealed in the picture before the next one is asked.
 *
 * {
 *   type: 'backprop-net',
 *   x: [2, 1], target: 2,
 *   A: { w: [1, 1], b: -1 }, B: { w: [1, -3], b: 0 }, out: { v: [2, 3], c: -1 },
 *   given: 'forward',        // what is shown from the start: 'none' (inputs, weights and target only) | 'forward'
 *                            //   | 'all' | a list of keys and/or the group names 'forward', 'backward'
 *   ask: ['gy', 'gc', 'gv1', 'gv2'],   // the blanks, in the order they are asked
 *   tolerance: 0.001,        // how close a typed number must be
 *   nudge: { weights: ['wA1', 'v1'], by: 0.01 },   // buttons that raise one weight a little and show the new loss
 *   train: { rate: 0.01 },   // a "Take one step" button: every weight moves by −rate × its gradient
 *   static: false,           // true: a picture, nothing to type or press
 * }
 *
 * Keys. Forward values: zA, hA, zB, hB (score and output of each hidden unit), y, L (the loss).
 * Gradients: gy, gc, gv1, gv2 (output neuron: bias c, weights from A and from B), ghA, ghB (at the hidden outputs),
 * gzA, gzB (at the hidden scores), gbA, gbB, gwA1, gwA2, gwB1, gwB2 (hidden biases and weights; wA1 is x1 → A).
 *
 * State: { weights, values, grads, filled, current, done, mistakes, lastWrong, nudged, lossBefore, lossAfter, change, steps, loss }
 *   weights    { wA1, wA2, bA, wB1, wB2, bB, v1, v2, c } as they stand (after any training steps)
 *   values     the true forward values, grads the true gradients, for those weights
 *   filled     the blanks answered correctly so far; current: the blank being asked (null when done)
 *   done       every blank is filled
 *   mistakes   wrong entries so far; lastWrong: { key, value } of the latest one
 *   nudged     which weight is nudged at the moment (or null), with lossBefore, lossAfter and change = after − before
 *   steps      training steps taken; loss: the loss now
 *
 * setState accepts { filled: [...] }, { done: true } (fills every blank), { nudged: 'wA1' } and { steps: n }.
 */
import { frame, button, readout, hue, s, h, tidy, mdInline, addStyles, formatNumber } from './kit.js';
import { parseNumber } from '../core/mathexpr.js';
import { play } from '../core/audio.js';

addStyles('backprop-net', `
  .widget-backprop-net .bn-ask { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--s2) var(--s3); font-weight: 700; }
  .widget-backprop-net .bn-ask input {
    width: 6.5ch; min-height: 40px; padding: 0 0.5rem; text-align: center;
    font: inherit; font-family: var(--font-mono); font-weight: 700; color: var(--ink);
    border: var(--bw) solid var(--edge); border-radius: var(--r-sm); background: var(--surface);
  }
  .widget-backprop-net .bn-ask input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .widget-backprop-net .bn-ask.is-wrong input { border-color: var(--red); background: var(--red-soft); }
  .widget-backprop-net .bn-ask .btn-sm { min-height: 40px; }
  .widget-backprop-net .bn-msg { text-align: center; min-height: 2.6em; font-size: var(--fs-sm); color: var(--ink-2); font-weight: 600; display: grid; align-content: center; }
  .widget-backprop-net .bn-msg.is-good { color: var(--green-text); }
  .widget-backprop-net .bn-legend { text-align: center; font-size: var(--fs-sm); color: var(--ink-2); font-weight: 600; }
  .widget-backprop-net .bn-legend i { display: inline-block; width: 1.5em; height: 1em; vertical-align: -0.12em; margin-right: 0.3em; border-radius: 6px; border: 2px solid var(--orange); background: var(--orange-soft); }
  .widget-backprop-net .bn-sub { font-size: 0.7em; }
`);

const W = 640;
const H = 330;
let inputSeq = 0;
const FORWARD = ['zA', 'hA', 'zB', 'hB', 'y', 'L'];
const BACKWARD = ['gy', 'gc', 'gv1', 'gv2', 'ghA', 'ghB', 'gzA', 'gzB', 'gbA', 'gbB', 'gwA1', 'gwA2', 'gwB1', 'gwB2'];
const WEIGHTS = ['wA1', 'wA2', 'bA', 'wB1', 'wB2', 'bB', 'v1', 'v2', 'c'];
const GRAD_OF = { wA1: 'gwA1', wA2: 'gwA2', bA: 'gbA', wB1: 'gwB1', wB2: 'gwB2', bB: 'gbB', v1: 'gv1', v2: 'gv2', c: 'gc' };

const NAMES = {
  zA: 'Score of A', hA: 'Output of A (after ReLU)', zB: 'Score of B', hB: 'Output of B (after ReLU)', y: 'The output y', L: 'The loss',
  gy: 'Gradient at y', gc: 'Gradient of the output bias', gv1: 'Gradient of the weight A → y', gv2: 'Gradient of the weight B → y',
  ghA: 'Gradient at A’s output', ghB: 'Gradient at B’s output', gzA: 'Gradient at A’s score', gzB: 'Gradient at B’s score',
  gbA: 'Gradient of A’s bias', gbB: 'Gradient of B’s bias',
  gwA1: 'Gradient of the weight x₁ → A', gwA2: 'Gradient of the weight x₂ → A', gwB1: 'Gradient of the weight x₁ → B', gwB2: 'Gradient of the weight x₂ → B',
};
const WEIGHT_NAMES = { wA1: 'x₁ → A', wA2: 'x₂ → A', wB1: 'x₁ → B', wB2: 'x₂ → B', v1: 'A → y', v2: 'B → y', bA: 'bias of A', bB: 'bias of B', c: 'output bias' };
const RECIPES = {
  zA: 'A score is weight × x₁ + weight × x₂ + bias. Use the two weights on the connections into A.',
  zB: 'A score is weight × x₁ + weight × x₂ + bias. Use the two weights on the connections into B.',
  hA: 'ReLU lets a positive score through unchanged. Anything else becomes 0.',
  hB: 'ReLU lets a positive score through unchanged. Anything else becomes 0.',
  y: 'y is weight × (output of A) + weight × (output of B) + the output bias.',
  L: 'The loss is (y − target)².',
  gy: 'The loss is (y − target)². It changes 2 × (y − target) times as fast as y.',
  gc: 'Raise the output bias by 1 and y rises by 1. So this is the gradient at y, times 1.',
  gv1: 'Raise this weight by 1 and y rises by A’s output. So: gradient at y × A’s output.',
  gv2: 'Raise this weight by 1 and y rises by B’s output. So: gradient at y × B’s output.',
  ghA: 'Raise A’s output by 1 and y rises by the weight on A → y. So: gradient at y × that weight.',
  ghB: 'Raise B’s output by 1 and y rises by the weight on B → y. So: gradient at y × that weight.',
  gzA: 'Through the ReLU: times 1 if the unit is switched on (score above 0), times 0 if it is off.',
  gzB: 'Through the ReLU: times 1 if the unit is switched on (score above 0), times 0 if it is off.',
  gbA: 'Raise the bias by 1 and the score rises by 1. So this equals the gradient at A’s score.',
  gbB: 'Raise the bias by 1 and the score rises by 1. So this equals the gradient at B’s score.',
  gwA1: 'Raise this weight by 1 and A’s score rises by x₁. So: gradient at A’s score × x₁.',
  gwA2: 'Raise this weight by 1 and A’s score rises by x₂. So: gradient at A’s score × x₂.',
  gwB1: 'Raise this weight by 1 and B’s score rises by x₁. So: gradient at B’s score × x₁.',
  gwB2: 'Raise this weight by 1 and B’s score rises by x₂. So: gradient at B’s score × x₂.',
};

/** Forward pass. w: { wA1, wA2, bA, wB1, wB2, bB, v1, v2, c }. */
export function forward(w, x, target) {
  const zA = w.wA1 * x[0] + w.wA2 * x[1] + w.bA;
  const zB = w.wB1 * x[0] + w.wB2 * x[1] + w.bB;
  const hA = Math.max(0, zA);
  const hB = Math.max(0, zB);
  const y = w.v1 * hA + w.v2 * hB + w.c;
  return { zA, hA, zB, hB, y, L: (y - target) ** 2 };
}

/** Backward pass: the gradient of the loss with respect to every node and every weight. */
export function backward(w, x, target) {
  const f = forward(w, x, target);
  const gy = 2 * (f.y - target);
  const ghA = gy * w.v1;
  const ghB = gy * w.v2;
  const gzA = f.zA > 0 ? ghA : 0;
  const gzB = f.zB > 0 ? ghB : 0;
  return {
    gy, gc: gy, gv1: gy * f.hA, gv2: gy * f.hB, ghA, ghB, gzA, gzB,
    gbA: gzA, gbB: gzB, gwA1: gzA * x[0], gwA2: gzA * x[1], gwB1: gzB * x[0], gwB2: gzB * x[1],
  };
}

/** One step of gradient descent on all nine weights. */
export function descend(w, x, target, rate) {
  const g = backward(w, x, target);
  const next = {};
  for (const key of WEIGHTS) next[key] = w[key] - rate * g[GRAD_OF[key]];
  return next;
}

export default function create(spec, env) {
  const x = Array.isArray(spec.x) ? spec.x.map(Number) : [2, 1];
  const target = spec.target != null ? Number(spec.target) : 2;
  const A = spec.A || { w: [1, 1], b: -1 };
  const B = spec.B || { w: [1, -3], b: 0 };
  const out = spec.out || { v: [2, 3], c: -1 };
  const start = { wA1: A.w[0], wA2: A.w[1], bA: A.b, wB1: B.w[0], wB2: B.w[1], bB: B.b, v1: out.v[0], v2: out.v[1], c: out.c };
  const isStatic = !!spec.static || !!env.compact;
  const tolerance = spec.tolerance != null ? Number(spec.tolerance) : 0.001;
  const nudgeDef = !isStatic && spec.nudge ? { weights: ['wA1'], by: 0.01, ...spec.nudge } : null;
  const trainDef = !isStatic && spec.train ? { rate: 0.01, ...(spec.train === true ? {} : spec.train) } : null;
  let readOnly = !!env.readOnly;

  const expand = (list) => list.flatMap((key) => (key === 'forward' ? FORWARD : key === 'backward' ? BACKWARD : key === 'all' ? [...FORWARD, ...BACKWARD] : [key]));
  const givenSpec = spec.given == null ? 'none' : spec.given;
  const given = new Set(givenSpec === 'none' ? [] : expand(Array.isArray(givenSpec) ? givenSpec : [givenSpec]));
  const ask = (Array.isArray(spec.ask) ? spec.ask : []).filter((key) => (FORWARD.includes(key) || BACKWARD.includes(key)) && !given.has(key));
  const filled = new Set();
  let weights = { ...start };
  let steps = 0;
  let mistakes = 0;
  let lastWrong = null;
  let nudged = null;

  const shownWeights = () => (nudged ? { ...weights, [nudged]: weights[nudged] + nudgeDef.by } : weights);
  const current = () => (isStatic ? null : ask.find((key) => !filled.has(key)) || null);
  const isDone = () => ask.length > 0 && ask.every((key) => filled.has(key));
  const round = (obj, places = 6) => Object.fromEntries(Object.entries(obj).map(([key, v]) => [key, tidy(v, places)]));

  const getState = () => {
    const f = forward(weights, x, target);
    const after = nudged ? forward(shownWeights(), x, target).L : null;
    return {
      weights: round(weights),
      values: round(f),
      grads: round(backward(weights, x, target)),
      filled: ask.filter((key) => filled.has(key)),
      current: current(),
      done: isDone(),
      mistakes,
      lastWrong,
      nudged,
      lossBefore: tidy(f.L, 6),
      lossAfter: after == null ? null : tidy(after, 6),
      change: after == null ? null : tidy(after - f.L, 6),
      steps,
      loss: tidy(f.L, 6),
    };
  };

  /* -------------------------------------------------------------- drawing */
  const fr = frame({ width: W, height: H, compact: env.compact, plain: true, maxWidth: 640, label: spec.alt || 'A small network with two inputs, two hidden units and one output' });
  const { svg } = fr;
  const P = {
    x1: { x: 54, y: 84 }, x2: { x: 54, y: 232 },
    A: { x: 288, y: 84 }, B: { x: 288, y: 232 },
    y: { x: 492, y: 158 }, L: { x: 588, y: 158 },
  };
  const IN_W = 84; const IN_H = 42; const HID_W = 148; const HID_H = 66; const OUT_W = 78; const OUT_H = 66; const LOSS_W = 86;
  const gEdges = s('g');
  const gNodes = s('g');
  const gLabels = s('g');
  svg.append(gEdges, gNodes, gLabels);

  const fmt = (v, places = 3) => formatNumber(tidy(v, 6), places);
  const sub = (letter, digit, rest = '') => [s('tspan', {}, letter), s('tspan', { class: 'bn-sub', dy: 4 }, digit), s('tspan', { dy: -4 }, rest)];

  function edge(from, to, color = 'var(--ink-3)') {
    gEdges.appendChild(s('line', { x1: from.x, y1: from.y, x2: to.x, y2: to.y, stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round' }));
  }
  const along = (from, to, t) => ({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });

  // fixed geometry: where every weight label and every badge sits
  const inA = { x: P.A.x - HID_W / 2, y: P.A.y }; const inB = { x: P.B.x - HID_W / 2, y: P.B.y };
  const fromX1 = { x: P.x1.x + IN_W / 2, y: P.x1.y }; const fromX2 = { x: P.x2.x + IN_W / 2, y: P.x2.y };
  const outA = { x: P.A.x + HID_W / 2, y: P.A.y }; const outB = { x: P.B.x + HID_W / 2, y: P.B.y };
  const inY1 = { x: P.y.x - OUT_W / 2, y: P.y.y - 12 }; const inY2 = { x: P.y.x - OUT_W / 2, y: P.y.y + 12 };
  const SPOT = {
    wA1: along(fromX1, inA, 0.36), wB1: along(fromX1, inB, 0.3), wA2: along(fromX2, inA, 0.3), wB2: along(fromX2, inB, 0.36),
    v1: along(outA, inY1, 0.5), v2: along(outB, inY2, 0.5),
    bA: { x: P.A.x - 14, y: P.A.y + HID_H / 2 + 34 }, bB: { x: P.B.x - 14, y: P.B.y + HID_H / 2 + 34 }, c: { x: P.y.x - 12, y: P.y.y + OUT_H / 2 + 34 },
  };
  const BADGE = {
    gzA: { x: P.A.x - HID_W / 4, y: P.A.y + HID_H / 2 }, ghA: { x: P.A.x + HID_W / 4, y: P.A.y + HID_H / 2 },
    gzB: { x: P.B.x - HID_W / 4, y: P.B.y + HID_H / 2 }, ghB: { x: P.B.x + HID_W / 4, y: P.B.y + HID_H / 2 },
    gy: { x: P.y.x, y: P.y.y + OUT_H / 2 },
    gwA1: { x: SPOT.wA1.x + 2, y: SPOT.wA1.y - 25 }, gwB1: { x: SPOT.wB1.x + 40, y: SPOT.wB1.y + 2 },
    gwA2: { x: SPOT.wA2.x + 40, y: SPOT.wA2.y - 2 }, gwB2: { x: SPOT.wB2.x + 2, y: SPOT.wB2.y + 25 },
    gv1: { x: SPOT.v1.x + 8, y: SPOT.v1.y - 25 }, gv2: { x: SPOT.v2.x + 8, y: SPOT.v2.y + 25 },
    gbA: { x: SPOT.bA.x + 62, y: SPOT.bA.y - 5 }, gbB: { x: SPOT.bB.x + 62, y: SPOT.bB.y - 5 }, gc: { x: SPOT.c.x + 62, y: SPOT.c.y - 5 },
  };

  const visible = (key) => given.has(key) || filled.has(key) || (isStatic && ask.includes(key) && spec.reveal === true);

  function draw() {
    const w = shownWeights();
    const f = forward(w, x, target);
    const g = backward(weights, x, target);
    const cur = current();
    const places = nudged ? 4 : 3;
    gEdges.replaceChildren();
    gNodes.replaceChildren();
    gLabels.replaceChildren();

    edge(fromX1, inA); edge(fromX1, inB); edge(fromX2, inA); edge(fromX2, inB);
    edge(outA, inY1); edge(outB, inY2);
    edge({ x: P.y.x + OUT_W / 2, y: P.y.y }, { x: P.L.x - LOSS_W / 2, y: P.L.y });

    const box = (cx0, cy0, wBox, hBox, fill, extra = {}) => s('rect', { x: cx0 - wBox / 2, y: cy0 - hBox / 2, width: wBox, height: hBox, rx: 12, fill, stroke: 'var(--ink)', 'stroke-width': 2.5, ...extra });
    const text = (cls, tx, ty, content, extra = {}) => { const t = s('text', { class: cls, x: tx, y: ty, 'text-anchor': 'middle', ...extra }); if (Array.isArray(content)) t.append(...content); else t.textContent = content; return t; };

    // inputs
    [['x1', '1', x[0]], ['x2', '2', x[1]]].forEach(([id, digit, value]) => {
      gNodes.appendChild(box(P[id].x, P[id].y, IN_W, IN_H, hue('blue', 'soft')));
      gNodes.appendChild(text('fig-label', P[id].x, P[id].y + 5, sub('x', digit, ` = ${fmt(value)}`)));
    });

    /** A forward value, or a "?" when it is still a blank. */
    const cell = (key, tx, ty, value) => {
      const known = visible(key);
      const asked = ask.includes(key) && !known;
      if (asked && key === cur) gNodes.appendChild(s('rect', { x: tx - 30, y: ty - 21, width: 60, height: 28, rx: 8, fill: hue('yellow', 'soft'), stroke: hue('yellow'), 'stroke-width': 2.5 }));
      gNodes.appendChild(text('fig-label-lg', tx, ty, known ? fmt(value, places) : asked ? '?' : '', asked && key !== cur ? { opacity: 0.45 } : {}));
    };

    // hidden units
    [['A', 'violet', 'zA', 'hA'], ['B', 'teal', 'zB', 'hB']].forEach(([id, color, zKey, hKey]) => {
      const p = P[id];
      const offKnown = visible(hKey) && visible(zKey);
      const off = offKnown && f[zKey] <= 0;
      gNodes.appendChild(box(p.x, p.y, HID_W, HID_H, hue(color, 'soft'), off ? { 'stroke-dasharray': '6 5' } : {}));
      gNodes.appendChild(s('line', { x1: p.x, x2: p.x, y1: p.y - HID_H / 2, y2: p.y + HID_H / 2, stroke: 'var(--ink)', 'stroke-width': 1.5, opacity: 0.5 }));
      gNodes.appendChild(text(`fig-label text-${color}`, p.x, p.y - HID_H / 2 - 9, offKnown ? `${id}: switched ${off ? 'off' : 'on'}` : id));
      gNodes.appendChild(text('fig-label-sm text-muted', p.x - HID_W / 4, p.y - 17, 'score'));
      gNodes.appendChild(text('fig-label-sm text-muted', p.x + HID_W / 4, p.y - 17, 'output'));
      cell(zKey, p.x - HID_W / 4, p.y + 8, f[zKey]);
      cell(hKey, p.x + HID_W / 4, p.y + 8, f[hKey]);
    });

    // output and loss
    gNodes.appendChild(box(P.y.x, P.y.y, OUT_W, OUT_H, hue('pink', 'soft')));
    gNodes.appendChild(text('fig-label-sm text-muted', P.y.x, P.y.y - 17, 'output y'));
    cell('y', P.y.x, P.y.y + 8, f.y);
    gNodes.appendChild(box(P.L.x, P.L.y, LOSS_W, OUT_H, 'var(--surface)'));
    gNodes.appendChild(text('fig-label-sm text-muted', P.L.x, P.L.y - 17, 'loss'));
    cell('L', P.L.x, P.L.y + 8, f.L);
    gNodes.appendChild(text('fig-label', P.L.x, P.L.y - OUT_H / 2 - 10, `target ${fmt(target)}`));

    // weights on their connections, biases under their units
    const pill = (key) => {
      const p = SPOT[key];
      const label = fmt(w[key], places);
      const wide = Math.max(34, label.length * 10 + 14);
      const hot = nudged === key;
      gLabels.appendChild(s('rect', { x: p.x - wide / 2, y: p.y - 13, width: wide, height: 26, rx: 13, fill: hot ? hue('yellow', 'soft') : 'var(--surface)', stroke: hot ? hue('yellow') : 'var(--ink)', 'stroke-width': hot ? 3 : 2 }));
      gLabels.appendChild(text('fig-label', p.x, p.y + 5, label));
    };
    for (const key of ['wA1', 'wA2', 'wB1', 'wB2', 'v1', 'v2']) pill(key);
    for (const key of ['bA', 'bB', 'c']) gLabels.appendChild(text('fig-label-sm', SPOT[key].x, SPOT[key].y, `bias ${fmt(w[key], places)}`));

    // gradients: orange badges
    for (const key of BACKWARD) {
      const known = visible(key);
      const asked = ask.includes(key) && !known;
      if (!known && !asked) continue;
      const p = BADGE[key];
      const label = known ? fmt(g[key]) : '?';
      const wide = Math.max(34, label.length * 10 + 14);
      const hot = asked && key === cur;
      gLabels.appendChild(s('rect', {
        x: p.x - wide / 2, y: p.y - 12, width: wide, height: 24, rx: 8,
        fill: hot ? hue('yellow', 'soft') : hue('orange', 'soft'), stroke: hot ? hue('yellow') : hue('orange'), 'stroke-width': hot ? 3 : 2,
        opacity: asked && !hot ? 0.5 : 1,
      }));
      gLabels.appendChild(text('fig-label text-orange', p.x, p.y + 5, label, asked && !hot ? { opacity: 0.5 } : {}));
    }

    const st = getState();
    const said = [`Inputs ${fmt(x[0])} and ${fmt(x[1])}, target ${fmt(target)}.`];
    for (const key of FORWARD) if (visible(key)) said.push(`${NAMES[key]}: ${fmt(f[key], places)}.`);
    for (const key of BACKWARD) if (visible(key)) said.push(`${NAMES[key]}: ${fmt(g[key])}.`);
    if (cur) said.push(`Asked for now: ${NAMES[cur]}.`);
    svg.setAttribute('aria-label', `${spec.alt ? `${spec.alt} ` : ''}${said.join(' ')}`);
    return st;
  }

  /* ------------------------------------------------------- asking blanks */
  const askBox = h('div.bn-ask');
  const askLabel = h('label');
  const input = h('input', { type: 'text', inputmode: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: false });
  input.dataset.keys = 'own';
  const enter = button('Enter', () => submit(), { variant: 'primary' });
  const msg = h('div.bn-msg', { 'aria-live': 'polite' });
  const legend = h('div.bn-legend', h('i'), 'gradient: how fast the loss changes when that number goes up');
  const showsGradients = [...given, ...ask].some((key) => BACKWARD.includes(key));
  if (!env.compact && showsGradients) fr.el.insertBefore(legend, fr.readouts);
  if (!isStatic && ask.length) {
    askBox.append(askLabel, input, enter);
    fr.el.insertBefore(askBox, fr.readouts);
    fr.el.insertBefore(msg, fr.readouts);
    inputSeq += 1;
    input.id = `bn-in-${inputSeq}`;
    askLabel.setAttribute('for', input.id);
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); ev.stopPropagation(); submit(); } });
    input.addEventListener('input', () => askBox.classList.remove('is-wrong'));
  }

  function refreshAsk() {
    const cur = current();
    if (!ask.length || isStatic) return;
    if (cur) {
      askLabel.textContent = `${NAMES[cur]} =`;
      input.setAttribute('aria-label', NAMES[cur]);
      input.disabled = readOnly;
      enter.disabled = readOnly;
      askBox.style.display = '';
    } else {
      askBox.style.display = 'none';
    }
  }

  function submit() {
    if (readOnly) return;
    const cur = current();
    if (!cur) return;
    const value = parseNumber(input.value);
    if (!Number.isFinite(value)) { msg.className = 'bn-msg'; msg.textContent = 'Type a number, then press Enter.'; return; }
    const truth = { ...forward(weights, x, target), ...backward(weights, x, target) }[cur];
    if (Math.abs(value - truth) <= tolerance + 1e-12) {
      filled.add(cur);
      lastWrong = null;
      input.value = '';
      askBox.classList.remove('is-wrong');
      play(isDone() ? 'correct' : 'pop');
      msg.className = 'bn-msg is-good';
      const next = current();
      msg.textContent = next ? `${NAMES[cur]} = ${fmt(truth)}. Next: ${NAMES[next].toLowerCase()}.` : `${NAMES[cur]} = ${fmt(truth)}. Every blank is filled in.`;
      env.announce(msg.textContent);
    } else {
      mistakes += 1;
      lastWrong = { key: cur, value };
      askBox.classList.add('is-wrong');
      play('wrong');
      const slip = ((spec.slips && spec.slips[cur]) || []).find(([v]) => Math.abs(v - value) < 1e-9);
      msg.className = 'bn-msg';
      msg.replaceChildren(h('span', { html: mdInline(`Not ${fmt(value)}. ${slip ? slip[1] : RECIPES[cur]}`) }));
      env.announce(msg.textContent);
    }
    draw();
    refreshAsk();
    if (current() && !readOnly) input.focus({ preventScroll: true });
    env.onChange(getState());
  }

  /* ------------------------------------------------- nudging and training */
  const roBefore = readout('loss before', { digits: 4 });
  const roAfter = readout('loss after', { digits: 4, color: 'violet' });
  const roChange = readout('change', { digits: 4, color: 'orange' });
  const nudgeBtns = {};
  if (nudgeDef) {
    fr.readouts.append(roBefore.el, roAfter.el, roChange.el);
    for (const key of nudgeDef.weights) {
      if (!WEIGHTS.includes(key)) continue;
      const btn = button(`Nudge ${WEIGHT_NAMES[key]} by +${formatNumber(nudgeDef.by, 4)}`, () => {
        if (readOnly) return;
        nudged = nudged === key ? null : key;
        play('tap');
        render();
        env.onChange(getState());
      });
      btn.setAttribute('aria-pressed', 'false');
      nudgeBtns[key] = btn;
      fr.buttons.appendChild(btn);
    }
  }
  const roSteps = readout('steps taken', { digits: 0 });
  const roLoss = readout('loss', { digits: 4, color: 'violet' });
  if (trainDef) {
    fr.readouts.append(roSteps.el, roLoss.el);
    fr.buttons.appendChild(button('Take one step', () => {
      if (readOnly) return;
      weights = descend(weights, x, target, trainDef.rate);
      steps += 1;
      play('tick');
      render();
      env.onChange(getState());
    }, { variant: 'primary' }));
    fr.buttons.appendChild(button('Start again', () => {
      if (readOnly) return;
      weights = { ...start };
      steps = 0;
      render();
      env.onChange(getState());
    }, { icon: 'reset', variant: 'ghost' }));
  }

  function render() {
    const st = draw();
    refreshAsk();
    if (nudgeDef) {
      roBefore.set(st.lossBefore);
      roAfter.set(st.lossAfter == null ? '—' : st.lossAfter);
      roChange.set(st.change == null ? '—' : st.change);
      for (const [key, btn] of Object.entries(nudgeBtns)) {
        btn.setAttribute('aria-pressed', String(nudged === key));
        btn.classList.toggle('btn-primary', nudged === key);
      }
    }
    if (trainDef) { roSteps.set(steps); roLoss.set(st.loss); }
  }

  render();
  if (readOnly || isStatic) fr.el.classList.add('is-readonly');

  return {
    el: fr.el,
    getState,
    setState(next) {
      if (!next) return;
      if (next.done) for (const key of ask) filled.add(key);
      if (Array.isArray(next.filled)) { filled.clear(); for (const key of next.filled) if (ask.includes(key)) filled.add(key); }
      if ('nudged' in next && nudgeDef) nudged = nudgeDef.weights.includes(next.nudged) ? next.nudged : null;
      if (typeof next.steps === 'number' && trainDef) {
        weights = { ...start };
        steps = 0;
        for (let i = 0; i < Math.min(500, Math.max(0, Math.round(next.steps))); i++) { weights = descend(weights, x, target, trainDef.rate); steps += 1; }
      }
      if (isDone()) { msg.className = 'bn-msg is-good'; msg.textContent = 'Every blank is filled in.'; }
      render();
    },
    setReadOnly(v) {
      readOnly = !!v;
      fr.el.classList.toggle('is-readonly', readOnly);
      input.disabled = readOnly;
      enter.disabled = readOnly;
    },
  };
}

export const examples = [
  {
    title: 'backprop-net — the forward pass, blank by blank',
    spec: { type: 'backprop-net', ask: ['zA', 'hA', 'zB', 'hB', 'y', 'L'] },
  },
  {
    title: 'backprop-net — the backward pass at the output',
    spec: { type: 'backprop-net', given: 'forward', ask: ['gy', 'gc', 'gv1', 'gv2'] },
  },
  {
    title: 'backprop-net — every gradient, and training',
    spec: { type: 'backprop-net', given: 'all', train: { rate: 0.01 } },
  },
];
