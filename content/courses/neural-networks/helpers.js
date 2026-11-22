// Inside Neural Networks · shared numbers, data and small functions.
//
// Everything a lesson quotes as a number is worked out here from the same
// definitions the widgets use, so that text, figures and checks cannot drift
// apart. tests/neural-networks-course.test.mjs re-derives all of it with
// independent code.
import { num } from '../../kit.js';

/* --------------------------------------------------------------- text helpers */

/** A number with a real minus sign, for running text: -3 -> "−3". */
export const show = (v, digits = 2) => num(v, digits).replace('-', '−');
/** A number inside a product, for TeX: negatives get brackets. */
export const par = (v, digits = 4) => (v < 0 ? `(${num(v, digits)})` : num(v, digits));
/** Round to a number of decimals without floating-point fuzz. */
export const roundTo = (v, places = 2) => { const p = 10 ** places; const out = Math.round((v + Math.sign(v) * 1e-12) * p) / p; return Object.is(out, -0) ? 0 : out; };
/** A 2D vector as "(3, 4)" with real minus signs. */
export const pair = (v, digits = 2) => `(${show(v[0], digits)}, ${show(v[1], digits)})`;

/* ------------------------------------------------- lesson 1: bending the line */

export const relu = (v) => Math.max(0, v);
export const sigmoid = (v) => 1 / (1 + Math.exp(-v));

/** The sum of hinges: bias + Σ weight · ReLU(x − at). */
export const hinges = (units, bias, x) => units.reduce((t, u) => t + u.weight * relu(x - u.at), bias);

/** The dashed targets of the three building steps, as expressions the relu-builder widget can read. */
export const V_TARGET = 'abs(x - 3)';
export const BUMP_TARGET = 'max(0, min(x - 1, 5 - x))';
export const WAVE_TARGET = '2 + 1.5*sin(1.2*x)';
export const wave = (x) => 2 + 1.5 * Math.sin(1.2 * x);

/**
 * How far n equally spaced hinges stay from a curve f on [x0, x1], when their sum is made to
 * pass through f at every kink and at the right-hand edge: the largest vertical gap.
 */
export function hingeGap(f, x0, x1, n) {
  const step = (x1 - x0) / n;
  let worst = 0;
  for (let i = 0; i <= 3000; i++) {
    const x = x0 + ((x1 - x0) * i) / 3000;
    const k = Math.min(n - 1, Math.floor((x - x0) / step));
    const a = x0 + k * step;
    const y = f(a) + ((f(a + step) - f(a)) * (x - a)) / step;
    worst = Math.max(worst, Math.abs(y - f(x)));
  }
  return worst;
}

/* ------------------------------------------- lesson 2: scores to probabilities */

/** Softmax: base ^ (score / temperature), divided by the total. */
export function softmax(scores, base = Math.E, temperature = 1) {
  const powers = scores.map((v) => base ** (v / temperature));
  const total = powers.reduce((t, v) => t + v, 0);
  return powers.map((v) => v / total);
}
/** Cross-entropy loss for one example: minus the natural log of the probability given to the right answer. */
export const crossEntropy = (p) => -Math.log(p);

/** The toy language model of How AI Learns: after "the" came cat 4 times, dog 3, mat 2, rug 1. */
export const AFTER_THE = [['cat', 4], ['dog', 3], ['mat', 2], ['rug', 1]];
/** Scores whose softmax (at temperature 1) reproduces those shares: the natural logs of the counts. */
export const AFTER_THE_SCORES = AFTER_THE.map(([, count]) => Math.log(count));

/* ---------------------------------------------------- lesson 3: backpropagation */

/** The worked network: 2 inputs, 2 hidden ReLU units (A and B), 1 output, squared error. */
export const NET = {
  x: [2, 1],
  target: 2,
  A: { w: [1, 1], b: -1 },
  B: { w: [1, -3], b: 0 },
  out: { v: [2, 3], c: -1 },
};

/**
 * A second network of the same shape, used only for the worked examples on the teaching screens.
 * Every value and gradient in it differs from the one the learner then works out in NET.
 */
export const EXAMPLE_NET = {
  x: [3, 1],
  target: 9,
  A: { w: [1, 2], b: -1 },
  B: { w: [-1, 1], b: 0 },
  out: { v: [2, 5], c: -1 },
};

/** Forward pass of a network in the shape of NET. */
export function netForward(net = NET) {
  const zA = net.A.w[0] * net.x[0] + net.A.w[1] * net.x[1] + net.A.b;
  const zB = net.B.w[0] * net.x[0] + net.B.w[1] * net.x[1] + net.B.b;
  const hA = relu(zA);
  const hB = relu(zB);
  const y = net.out.v[0] * hA + net.out.v[1] * hB + net.out.c;
  return { zA, hA, zB, hB, y, L: (y - net.target) ** 2 };
}

/** Backward pass: the gradient of the loss at every node and for every weight. */
export function netBackward(net = NET) {
  const f = netForward(net);
  const gy = 2 * (f.y - net.target);
  const ghA = gy * net.out.v[0];
  const ghB = gy * net.out.v[1];
  const gzA = f.zA > 0 ? ghA : 0;
  const gzB = f.zB > 0 ? ghB : 0;
  return {
    gy, gc: gy, gv1: gy * f.hA, gv2: gy * f.hB, ghA, ghB, gzA, gzB,
    gbA: gzA, gbB: gzB, gwA1: gzA * net.x[0], gwA2: gzA * net.x[1], gwB1: gzB * net.x[0], gwB2: gzB * net.x[1],
  };
}

/** The same network after n steps of gradient descent at the given learning rate. */
export function netAfterSteps(n, rate, net = NET) {
  let cur = net;
  for (let i = 0; i < n; i++) {
    const g = netBackward(cur);
    cur = {
      ...cur,
      A: { w: [cur.A.w[0] - rate * g.gwA1, cur.A.w[1] - rate * g.gwA2], b: cur.A.b - rate * g.gbA },
      B: { w: [cur.B.w[0] - rate * g.gwB1, cur.B.w[1] - rate * g.gwB2], b: cur.B.b - rate * g.gbB },
      out: { v: [cur.out.v[0] - rate * g.gv1, cur.out.v[1] - rate * g.gv2], c: cur.out.c - rate * g.gc },
    };
  }
  return cur;
}

/** The network as a backprop-net widget. */
export const netFigure = (extra = {}) => ({ type: 'backprop-net', x: NET.x, target: NET.target, A: NET.A, B: NET.B, out: NET.out, ...extra });

/* ------------------------------------------------ lesson 4: training in practice */

/** The fixed training problem of the loss-curves widget: 12 training plants. An epoch is one pass through them. */
export const PLANTS = 12;
/** The slider settings of the training lab. */
export const RATES = [0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5];
export const BATCHES = [1, 2, 4, 12];
/** A loss-curves figure. */
export const lab = (extra = {}) => ({ type: 'loss-curves', ...extra });

/* --------------------------------------------------------- lesson 5: embeddings */

/** The hand-made map: every word is a vector with two numbers. Groups: 0 animals, 1 people, 2 food. */
export const WORD_MAP = [
  { text: 'cat', at: [3, 4], group: 0 },
  { text: 'dog', at: [4, 3], group: 0 },
  { text: 'kitten', at: [4.5, 5.5], group: 0 },
  { text: 'puppy', at: [5.5, 4.5], group: 0 },
  { text: 'man', at: [-5, 1], group: 1 },
  { text: 'woman', at: [-5, 3], group: 1 },
  { text: 'king', at: [-2, 3], group: 1 },
  { text: 'queen', at: [-2, 5], group: 1 },
  { text: 'apple', at: [-2, -4], group: 2 },
  { text: 'pear', at: [-1, -5], group: 2 },
  { text: 'bread', at: [2, -4], group: 2 },
  { text: 'cheese', at: [3, -3], group: 2 },
];
export const GROUPS = ['animals', 'people', 'food'];
export const vecOf = (word, words = WORD_MAP) => words.find((w) => w.text === word).at;
export const groupOf = (word, words = WORD_MAP) => words.find((w) => w.text === word).group;
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const len = (a) => Math.hypot(a[0], a[1]);
export const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const cosine = (a, b) => dot(a, b) / (len(a) * len(b));
/** The word nearest to a point (straight-line distance). */
export function nearestWord(point, words = WORD_MAP, skip = []) {
  let best = null;
  for (const w of words) {
    if (skip.includes(w.text)) continue;
    const d = dist(w.at, point);
    if (!best || d < best.d) best = { word: w.text, d };
  }
  return best.word;
}
/** A word-map figure on the lesson's map. */
export const wordMap = (extra = {}) => ({ type: 'word-map', words: WORD_MAP, range: 7, ...extra });

/* ---------------------------------------------------------- lesson 6: attention */

/** "the river bank": vectors made up by hand. Across: how much a word has to do with money. Up: with water. */
export const THE = { text: 'the', v: [0.5, 0.5] };
export const RIVER = { text: 'river', v: [0, 2] };
export const MONEY = { text: 'money', v: [2, 0] };
export const BANK = { text: 'bank', v: [1, 1] };
/** One step of simplified self-attention: dot-product scores, softmax weights, weighted average. */
export function attention(vectors, base = Math.E) {
  const scores = vectors.map((a) => vectors.map((b) => dot(a, b)));
  const weights = scores.map((row) => softmax(row, base));
  const out = weights.map((row) => [0, 1].map((k) => row.reduce((t, w, j) => t + w * vectors[j][k], 0)));
  return { scores, weights, out };
}
/** An attention-grid figure. */
export const attentionFigure = (tokens, extra = {}) => ({ type: 'attention-grid', tokens, ...extra });

/**
 * What the training lab does at the settings the lesson talks about (full batches, so nothing is random).
 * The test file re-runs the training and checks every number here.
 */
export const LAB = {
  goal: 0.3,
  /** learning rate -> the first epoch with a training loss below the goal, using all 12 plants in every step */
  reach: { 0.01: 184, 0.02: 92, 0.05: 37 },
  /** the run of the early-stopping step: learning rate 0.02, all 12 plants in every step, 300 epochs */
  stop: { rate: 0.02, bestEpoch: 80, bestVal: 0.16, trainAtBest: 0.34, finalTrain: 0.17, finalVal: 0.32 },
};
