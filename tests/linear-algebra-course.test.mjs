/**
 * Linear Algebra: Vectors & Matrices — independent checks of the course.
 *
 * Every generator is run with many seeds and its answer is re-derived here
 * from the *text the learner sees* (the vectors, matrices and tables are
 * parsed back out of the TeX), with this file's own arithmetic. Every
 * interactive check is tried on every state its widget can reach and compared
 * with the instruction, worked out from first principles. A slip in a lesson
 * therefore shows up as a failing test instead of a wrong answer.
 *
 *   node --test tests/linear-algebra-course.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';

const SEEDS = 300;
const COURSE = 'linear-algebra';
const LESSONS = ['vectors', 'dot-product', 'matrices-transform', 'matrix-multiplication', 'determinants-inverses', 'eigenvectors'];
/** Every generated step of the course. Each is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  vectors: ['add-vectors', 'scale-vector', 'combine', 'length', 'find-combo'],
  'dot-product': ['angle-kind', 'dot-compute', 'make-perpendicular', 'most-similar'],
  'matrices-transform': ['read-matrix', 'apply-matrix'],
  'matrix-multiplication': ['multiply', 'which-order', 'which-product', 'powers'],
  'determinants-inverses': ['determinant', 'what-it-does', 'inverse', 'solve-system'],
  eigenvectors: ['eigen-check', 'spot-eigenvector', 'steady-state'],
};
const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/${COURSE}/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, COURSE, id);
}
const tested = new Set();

/** Run a step's generator with many seeds and hand each concrete step to `verify`. */
function eachVariant(lessonId, stepId, verify) {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  assert.equal(typeof raw.gen, 'function', `${lessonId}/${stepId} is generated`);
  assert.ok(GENERATED[lessonId].includes(stepId), `${lessonId}/${stepId} is listed in GENERATED`);
  tested.add(`${lessonId}/${stepId}`);
  for (let seed = 1; seed <= SEEDS; seed++) {
    const step = resolveStep(raw, makeRng(seed * 7919 + 13), stepId);
    try { verify(step, seed); } catch (err) { err.message = `${lessonId}/${stepId} (seed ${seed}): ${err.message}\n  text: ${step.text.replace(/\s+/g, ' ').trim()}`; throw err; }
  }
}
const rawStep = (lessonId, stepId) => {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  return raw;
};
/** A step that is not generated, in the shape the player sees. */
const fixed = (lessonId, stepId) => resolveStep(rawStep(lessonId, stepId), makeRng(1), stepId);

/* ------------------------------------------------- reading the TeX back in */

const N = String.raw`(-?\d+(?:\.\d+)?)`;
const VEC = new RegExp(String.raw`\\begin\{pmatrix\}\s*${N}\s*\\\\\s*${N}\s*\\end\{pmatrix\}`, 'g');
const MAT = new RegExp(String.raw`\\begin\{pmatrix\}\s*${N}\s*&\s*${N}\s*\\\\\s*${N}\s*&\s*${N}\s*\\end\{pmatrix\}`, 'g');
/** Every column vector with two plain numbers in a piece of text, in order. */
const vectorsIn = (text) => Array.from(text.matchAll(VEC), (m) => ({ x: Number(m[1]), y: Number(m[2]) }));
/** Every 2×2 matrix with plain numbers in a piece of text, in order, as rows. */
const matricesIn = (text) => Array.from(text.matchAll(MAT), (m) => [[Number(m[1]), Number(m[2])], [Number(m[3]), Number(m[4])]]);
/** A coloured matrix as the lessons write it: \blue{a} & \orange{b} \\ \blue{c} & \orange{d}. */
const colouredMatrix = (m) => String.raw`\begin{pmatrix} \blue{${m[0][0]}} & \orange{${m[0][1]}} \\ \blue{${m[1][0]}} & \orange{${m[1][1]}} \end{pmatrix}`;
const displayMath = (text) => { const m = /\$\$([\s\S]+?)\$\$/.exec(text); assert.ok(m, 'has display math'); return m[1].trim(); };
const blank = (step, i) => step.blanks[i].numbers[0];
const correctOption = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, 'exactly one correct option'); return right[0]; };

/* --------------------------------------------- this file's own arithmetic */

// (adding 0 turns a "minus zero" into a plain zero, so that results compare equal to the numbers read from the text)
const dot = (u, v) => u.x * v.x + u.y * v.y + 0;
const cross = (u, v) => u.x * v.y - u.y * v.x + 0;
const add = (u, v) => ({ x: u.x + v.x + 0, y: u.y + v.y + 0 });
const times = (k, u) => ({ x: k * u.x + 0, y: k * u.y + 0 });
const sameVec = (u, v) => Math.abs(u.x - v.x) < 1e-9 && Math.abs(u.y - v.y) < 1e-9;
/** Matrix times vector, row by row. */
const act = (m, v) => ({ x: m[0][0] * v.x + m[0][1] * v.y + 0, y: m[1][0] * v.x + m[1][1] * v.y + 0 });
/** AB, built column by column: each column of B is sent through A. */
function product(A, B) {
  const c1 = act(A, { x: B[0][0], y: B[1][0] });
  const c2 = act(A, { x: B[0][1], y: B[1][1] });
  return [[c1.x, c2.x], [c1.y, c2.y]];
}
const determinant = (m) => m[0][0] * m[1][1] - m[0][1] * m[1][0] + 0;
const sameMat = (A, B) => A.every((row, i) => row.every((v, j) => Math.abs(v - B[i][j]) < 1e-9));
const I2 = [[1, 0], [0, 1]];
const tidy = (v, places = 6) => { const p = 10 ** places; const r = Math.round(v * p) / p; return Object.is(r, -0) ? 0 : r; };
const ints = (lo, hi, by = 1) => { const out = []; for (let i = 0; lo + i * by <= hi + 1e-9; i++) out.push(tidy(lo + i * by)); return out; };

/* ------------------------- the states the three widgets can report (re-derived) */

/** What vector-plane reports for given arrow positions and slider values. */
function planeState(spec, pos = {}, sliders = {}) {
  const out = {};
  for (const d of spec.vectors) out[d.id] = pos[d.id] ? { ...pos[d.id] } : { x: d.x, y: d.y };
  if (spec.combo) {
    const two = spec.combo.of.length > 1;
    const a = sliders.a != null ? sliders.a : spec.combo.a.value;
    const b = two ? (sliders.b != null ? sliders.b : spec.combo.b.value) : 0;
    out.a = a;
    if (two) out.b = b;
    const end = add(times(a, out[spec.combo.of[0]]), two ? times(b, out[spec.combo.of[1]]) : { x: 0, y: 0 });
    out.point = { x: tidy(end.x), y: tidy(end.y) };
  }
  if (spec.sum) out.sum = add(out[spec.sum.of[0]], out[spec.sum.of[1]]);
  if (spec.pair) {
    const [p, q] = spec.pair.map((id) => out[id]);
    const lp = Math.hypot(p.x, p.y);
    const lq = Math.hypot(q.x, q.y);
    const cos = lp > 0 && lq > 0 ? Math.max(-1, Math.min(1, dot(p, q) / (lp * lq))) : null;
    out.dot = tidy(dot(p, q));
    out.cos = cos == null ? null : tidy(cos);
    out.angle = cos == null ? null : tidy((Math.acos(cos) * 180) / Math.PI, 4);
    out.shadow = lp > 0 ? tidy(dot(p, q) / lp) : null;
  }
  if (spec.target) {
    const end = spec.combo ? out.point : spec.sum ? out.sum : null;
    out.hit = !!end && sameVec(end, spec.target);
  }
  return out;
}
/** What matrix-grid reports for a learner matrix (rows), or for a list of pressed buttons. */
function gridState(spec, m, applied = null) {
  let M = m;
  if (applied) M = applied.reduce((acc, id) => product(spec.moves.find((mv) => mv.id === id).matrix, acc), spec.matrix || I2);
  const d = tidy(determinant(M));
  const total = spec.pre ? product(M, spec.pre) : M;
  const out = {
    a: M[0][0], b: M[0][1], c: M[1][0], d: M[1][1], det: d, area: Math.abs(d), flipped: d < 0, flat: d === 0,
    total: { a: total[0][0], b: total[0][1], c: total[1][0], d: total[1][1] },
  };
  if (applied) out.applied = applied.slice();
  if (spec.target) out.match = sameMat(total, spec.target);
  return out;
}
/** What eigen-spin reports for a test arrow (and a number of presses of its button). */
function spinState(spec, v, steps = 0) {
  const image = act(spec.matrix, v);
  const len2 = dot(v, v);
  const aligned = len2 > 1e-12 && Math.abs(cross(v, image)) < 1e-7 * Math.max(1, len2);
  let angle = (Math.atan2(v.y, v.x) * 180) / Math.PI;
  if (angle < 0) angle += 360;
  const out = { v: { ...v }, image: { x: tidy(image.x, 9), y: tidy(image.y, 9) }, aligned, factor: aligned ? tidy(dot(image, v) / len2, 6) : null, angle: tidy(angle, 4) % 360 };
  if (spec.iterate) {
    let p = v;
    for (let i = 0; i < steps; i++) p = act(spec.matrix, p);
    out.steps = steps;
    out.current = { x: tidy(p.x, 9), y: tidy(p.y, 9) };
  }
  if (spec.target) out.hit = sameVec(spec.iterate ? out.current : out.image, spec.target);
  return out;
}
const onCircle = (r, deg) => ({ x: tidy(r * Math.cos((deg * Math.PI) / 180), 9), y: tidy(r * Math.sin((deg * Math.PI) / 180), 9) });
/** Every whole-number point of a window given as spec.x and spec.y. */
const gridPoints = (spec) => ints(Math.ceil(spec.x[0]), Math.floor(spec.x[1])).flatMap((x) => ints(Math.ceil(spec.y[0]), Math.floor(spec.y[1])).map((y) => ({ x, y })));
/** Every matrix the two draggable arrows of a matrix-grid can make. */
function allMatrices(range = 4) {
  const vals = ints(-range, range);
  const out = [];
  for (const a of vals) for (const b of vals) for (const c of vals) for (const d of vals) out.push([[a, b], [c, d]]);
  return out;
}
/** Feedback for a wrong state is either `false` or a proper sentence. */
function feedback(said, where) {
  if (said === false) return '';
  assert.equal(typeof said, 'string', `${where}: feedback is a sentence`);
  assert.ok(said.length > 10 && !/undefined|NaN/.test(said), `${where}: "${said}"`);
  return said;
}

/* ================================================================ lesson 1 */

test('vectors: adding and scaling', () => {
  eachVariant('vectors', 'add-vectors', (step) => {
    const [u, v] = vectorsIn(step.text);
    const sum = add(u, v);
    assert.equal(blank(step, 0), sum.x, 'top number');
    assert.equal(blank(step, 1), sum.y, 'bottom number');
    assert.deepEqual(vectorsIn(step.explain).pop(), sum, 'the explanation ends with the same sum');
  });
  eachVariant('vectors', 'scale-vector', (step) => {
    const k = Number(/\\;(-?\d+)\\,\\begin/.exec(step.text)[1]);
    const [v] = vectorsIn(step.text);
    assert.equal(blank(step, 0), k * v.x);
    assert.equal(blank(step, 1), k * v.y);
    assert.ok(step.explain.includes(`= ${k * v.x}$`) && step.explain.includes(`= ${k * v.y}$`), 'the explanation quotes both results');
    assert.equal(/turns round/.test(step.explain), k < 0, 'only a negative scalar turns the arrow round');
    assert.notEqual(v.x, v.y, 'the two blanks differ');
  });
});

test('vectors: a combination of two vectors', () => {
  eachVariant('vectors', 'combine', (step) => {
    const m = new RegExp(String.raw`(\d+)\\,\\begin\{pmatrix\}\s*${N}\s*\\\\\s*${N}\s*\\end\{pmatrix\} ([+-]) (\d+)\\,\\begin\{pmatrix\}\s*${N}\s*\\\\\s*${N}\s*\\end\{pmatrix\}`).exec(displayMath(step.text));
    assert.ok(m, 'the question reads a·u ± b·v');
    const a = Number(m[1]);
    const u = { x: Number(m[2]), y: Number(m[3]) };
    const b = (m[4] === '-' ? -1 : 1) * Number(m[5]);
    const v = { x: Number(m[6]), y: Number(m[7]) };
    const end = add(times(a, u), times(b, v));
    assert.equal(blank(step, 0), end.x, 'top number');
    assert.equal(blank(step, 1), end.y, 'bottom number');
    assert.ok(a !== 1 && Math.abs(b) !== 1, 'no coefficient 1 is written out');
    // the second hint scales each vector correctly
    const [hu, hau, hv, hbv] = vectorsIn(step.hints[1]);
    assert.deepEqual([hu, hv], [u, v]);
    assert.deepEqual(hau, times(a, u));
    assert.deepEqual(hbv, times(Math.abs(b), v));
    assert.ok(step.explain.includes(`= ${end.x}$`) && step.explain.includes(`= ${end.y}$`), 'the explanation reaches the same numbers');
  });
});

test('vectors: the length of an arrow', () => {
  eachVariant('vectors', 'length', (step) => {
    const [v] = vectorsIn(step.text);
    const length = Math.sqrt(v.x * v.x + v.y * v.y);
    assert.ok(Number.isInteger(length), 'the length is a whole number');
    assert.equal(step.answer, length);
    const drawn = step.figures[0].vectors[0];
    assert.deepEqual({ x: drawn.x, y: drawn.y }, v, 'the figure shows the same arrow');
    const fig = step.figures[0];
    assert.ok(v.x > fig.x[0] && v.x < fig.x[1] && v.y > fig.y[0] && v.y < fig.y[1], 'the arrow is inside the window');
    assert.equal(fig.x[1] - fig.x[0], fig.y[1] - fig.y[0], 'the window is square');
    for (const [value, msg] of step.wrong) {
      assert.notEqual(value, length);
      if (/dotted legs/.test(msg)) assert.equal(value, Math.abs(v.x) + Math.abs(v.y));
      if (/square/.test(msg)) assert.equal(value, length * length);
    }
    const root = /\\sqrt\{(\d+)\} = (\d+)\$/.exec(step.explain);
    assert.deepEqual([Number(root[1]), Number(root[2])], [length * length, length]);
  });
});

test('vectors: working back from a destination to the combination', () => {
  eachVariant('vectors', 'find-combo', (step) => {
    const [u, v, target] = vectorsIn(step.text);
    const d = cross(u, v);
    assert.notEqual(d, 0, 'the two arrows point along different lines, so the answer is unique');
    // Cramer's rule
    assert.equal(blank(step, 0), cross(target, v) / d, 'a');
    assert.equal(blank(step, 1), cross(u, target) / d, 'b');
    assert.deepEqual(add(times(blank(step, 0), u), times(blank(step, 1), v)), target);
    assert.ok(step.hints[1].includes(`2a = ${target.x + target.y}$`), 'the hint adds the two equations correctly');
    assert.ok(step.explain.includes(`a = ${blank(step, 0)}$`), 'the explanation names a');
  });
});

test('vectors: fixed facts', () => {
  // the two drones
  assert.deepEqual(add({ x: 4, y: 1 }, { x: 1, y: 3 }), { x: 5, y: 4 });
  const U = { x: 2, y: 1 };
  const V = { x: 1, y: -3 };
  const want = { '\\mathbf{u} + \\mathbf{v}': add(U, V), '2\\,\\mathbf{u}': times(2, U), '-\\mathbf{v}': times(-1, V), '\\mathbf{u} + 2\\,\\mathbf{v}': add(U, times(2, V)) };
  const match = fixed('vectors', 'match-ops');
  assert.deepEqual(vectorsIn(match.text), [U, V]);
  for (const [left, right] of match.pairs) {
    const key = left.replace(/\$/g, '');
    assert.ok(want[key], `"${key}" is one of the expected expressions`);
    assert.deepEqual(vectorsIn(right)[0], want[key], left);
  }
  // the line that two parallel arrows can reach
  const line = fixed('vectors', 'same-line');
  const [u, v] = line.figures[0].vectors;
  assert.equal(cross(u, v), 0, 'the two arrows are parallel');
  assert.notEqual(cross(u, line.figures[0].target), 0, 'the star is off their line');
  assert.match(correctOption(line).text, /one line through the origin/);
  assert.deepEqual(add(times(0.5, u), times(0, v)), { x: 1, y: 0.5 }, 'the half step quoted in the feedback');
});

test('vectors: the interactive checks accept exactly the right states', () => {
  const draw = rawStep('vectors', 'draw');
  for (const p of gridPoints(draw.widget)) {
    const said = draw.check(planeState(draw.widget, { v: p }));
    assert.equal(said === true, p.x === -4 && p.y === 3, `draw ${p.x},${p.y}`);
    if (said === true) continue;
    const msg = feedback(said, 'draw');
    if (/to the \*\*right\*\*/.test(msg)) assert.ok(p.x > 0);
    if (/3 \*\*down\*\*/.test(msg)) assert.equal(p.y, -3);
    if (/wrong way round/.test(msg)) assert.deepEqual(p, { x: 3, y: -4 });
    const quoted = /goes (-?\d+) across and (-?\d+) up/.exec(msg);
    if (quoted) assert.deepEqual({ x: Number(quoted[1]), y: Number(quoted[2]) }, p);
  }
  assert.equal(draw.check(planeState(draw.widget, draw.solution)), true);

  const tip = rawStep('vectors', 'tip-to-tail');
  const [u0, v0] = tip.widget.vectors;
  for (const p of gridPoints(tip.widget)) {
    const said = tip.check(planeState(tip.widget, { w: p }));
    assert.equal(said === true, sameVec(p, add(u0, v0)), `tip-to-tail ${p.x},${p.y}`);
    if (said !== true && /blue move on its own/.test(feedback(said, 'tip'))) assert.ok(sameVec(p, u0));
    if (said !== true && /orange move on its own/.test(said)) assert.ok(sameVec(p, v0));
  }
  assert.equal(tip.check(planeState(tip.widget, tip.solution)), true);
  assert.deepEqual(vectorsIn(tip.explain), [{ x: 4, y: 1 }, { x: 1, y: 3 }, { x: 5, y: 4 }]);

  const order = rawStep('vectors', 'order');
  const pts = gridPoints(order.widget);
  let passes = 0;
  for (const u of pts) for (const v of pts) {
    const s = planeState(order.widget, { u, v });
    const said = order.check(s);
    const good = sameVec(add(u, v), order.widget.target) && (u.x !== 0 || u.y !== 0) && (v.x !== 0 || v.y !== 0);
    assert.equal(said === true, good, `order u=${u.x},${u.y} v=${v.x},${v.y}`);
    if (said === true) passes++;
  }
  assert.ok(passes > 20, 'many pairs reach the star');
  assert.equal(order.check(planeState(order.widget, order.solution)), true);
  assert.notEqual(order.check(planeState(order.widget)), true, 'not solved at the start');

  const scale = rawStep('vectors', 'scale');
  const base = scale.widget.vectors[0];
  for (const a of ints(scale.widget.combo.a.min, scale.widget.combo.a.max, scale.widget.combo.a.step)) {
    const said = scale.check(planeState(scale.widget, {}, { a }));
    assert.equal(said === true, sameVec(times(a, base), scale.widget.target), `scale a=${a}`);
    if (said === true) continue;
    const msg = feedback(said, 'scale');
    if (/too short/.test(msg)) assert.ok(a < 0 && a > -2);
    if (/too long/.test(msg)) assert.ok(a < -2);
    if (/positive number/.test(msg)) assert.ok(a > 0);
  }
  assert.equal(scale.check(planeState(scale.widget, {}, scale.solution)), true);
  assert.deepEqual(vectorsIn(scale.explain), [{ x: 2, y: 1 }, { x: -4, y: -2 }]);

  const reach = rawStep('vectors', 'reach');
  const [ru, rv] = reach.widget.vectors;
  passes = 0;
  for (const a of ints(-3, 3)) for (const b of ints(-3, 3)) {
    const said = reach.check(planeState(reach.widget, {}, { a, b }));
    const there = sameVec(add(times(a, ru), times(b, rv)), reach.widget.target);
    assert.equal(said === true, there, `reach a=${a} b=${b}`);
    if (said === true) { passes++; assert.deepEqual({ a, b }, reach.solution); continue; }
    const msg = feedback(said, 'reach');
    if (/Three lots/.test(msg)) assert.equal(a, 3);
    if (/Two lots/.test(msg)) assert.equal(b, 2);
    const at = /You are at \((-?\d+), (-?\d+)\)/.exec(msg);
    if (at) assert.deepEqual({ x: Number(at[1]), y: Number(at[2]) }, add(times(a, ru), times(b, rv)));
  }
  assert.equal(passes, 1, 'exactly one combination reaches the star');
  assert.notEqual(reach.check(planeState(reach.widget)), true, 'not solved at the start');
  assert.deepEqual(vectorsIn(reach.explain), [{ x: 6, y: 3 }, { x: -2, y: 2 }, { x: 4, y: 5 }]);
});

/* ================================================================ lesson 2 */

test('dot-product: the kind of angle follows the sign of the dot product', () => {
  const seen = new Set();
  eachVariant('dot-product', 'angle-kind', (step) => {
    const [u, v] = vectorsIn(step.text);
    const d = dot(u, v);
    const expected = d > 0 ? 'Less than 90°' : d === 0 ? 'Exactly 90°' : 'More than 90°';
    assert.equal(correctOption(step).text, expected);
    seen.add(expected);
    assert.ok((u.x || u.y) && (v.x || v.y), 'neither arrow is the zero vector');
    for (const o of step.options) {
      if (o.correct) continue;
      assert.equal(Number(/The dot product is (-?\d+)/.exec(o.why)[1]), d, 'the feedback quotes the right dot product');
    }
    assert.ok(step.explain.includes(`= ${d}$`), 'the explanation quotes the dot product');
    assert.ok(step.explain.includes(d > 0 ? 'positive' : d < 0 ? 'negative' : 'zero'));
  });
  assert.equal(seen.size, 3, 'all three kinds of angle occur');
});

test('dot-product: computing a dot product', () => {
  eachVariant('dot-product', 'dot-compute', (step) => {
    const [u, v] = vectorsIn(step.text);
    assert.equal(step.answer, dot(u, v));
    for (const [value, msg] of step.wrong) {
      assert.notEqual(value, step.answer);
      if (/other\* vector/.test(msg)) assert.equal(value, u.x * v.y + u.y * v.x);
      else if (/all four numbers/.test(msg)) assert.equal(value, u.x + u.y + v.x + v.y);
      else if (/not subtracted/.test(msg)) assert.equal(value, u.x * v.x - u.y * v.y);
      else assert.fail(`unexpected feedback: ${msg}`);
    }
    assert.ok(step.explain.includes(`= ${dot(u, v)}$`));
  });
});

test('dot-product: the missing number that makes two vectors perpendicular', () => {
  eachVariant('dot-product', 'make-perpendicular', (step) => {
    const [u] = vectorsIn(step.text);
    const c = Number(new RegExp(String.raw`\\begin\{pmatrix\}\s*${N}\s*\\\\\s*t\s*\\end\{pmatrix\}`).exec(step.text)[1]);
    assert.notEqual(u.y, 0, 'the unknown really matters');
    assert.equal(dot(u, { x: c, y: step.answer }), 0, 'the answer makes the dot product zero');
    for (const [value, msg] of step.wrong) {
      const d = dot(u, { x: c, y: value });
      assert.notEqual(d, 0, 'a "wrong" value does not make them perpendicular');
      assert.equal(Number(/= (-?\d+)\$, not 0/.exec(msg)[1]), d, 'the feedback quotes the dot product that value gives');
    }
    assert.ok(step.explain.includes(`t = ${step.answer}$`));
  });
});

test('dot-product: the most similar taste among three', () => {
  eachVariant('dot-product', 'most-similar', (step) => {
    const rows = {};
    for (const line of step.text.split('\n')) {
      const m = /^\|\s*\**(Mia|Noor|Otto|Pia)\**\s*\|(.+)\|\s*$/.exec(line.trim());
      if (m) rows[m[1]] = Array.from(m[2].matchAll(/\$(-?\d+)\$/g), (x) => Number(x[1]));
    }
    assert.deepEqual(Object.keys(rows), ['Mia', 'Noor', 'Otto', 'Pia'], 'the table has four people');
    for (const r of Object.values(rows)) assert.equal(r.length, 3, 'three ratings each');
    const score = (name) => rows.Mia.reduce((t, v, i) => t + v * rows[name][i], 0);
    const scores = { Noor: score('Noor'), Otto: score('Otto'), Pia: score('Pia') };
    const best = Math.max(...Object.values(scores));
    assert.equal(Object.values(scores).filter((v) => v === best).length, 1, 'there is one clear winner');
    const right = correctOption(step);
    assert.equal(scores[right.text], best);
    for (const o of step.options) {
      if (o.correct) continue;
      const m = /^(\w+) scores (-?\d+) with Mia\. (\w+) scores (-?\d+)/.exec(o.why);
      assert.deepEqual([m[1], Number(m[2]), m[3], Number(m[4])], [o.text, scores[o.text], right.text, best]);
    }
    for (const name of ['Noor', 'Otto', 'Pia']) assert.ok(step.explain.includes(`${name}: $${scores[name]}$`) || step.explain.includes(`${name}'s`), `the explanation gives ${name}'s score`);
    assert.ok(step.explain.includes(`= ${best}$`));
  });
});

test('dot-product: fixed facts', () => {
  const hook = fixed('dot-product', 'hook');
  const [hu, hv] = hook.figures[0].vectors;
  assert.equal(dot(hu, hv), 0, 'the two arrows of the hook are perpendicular');
  assert.notEqual(Math.hypot(hu.x, hu.y), Math.hypot(hv.x, hv.y), '…and not equally long, so only one option is true');
  assert.notEqual(cross(hu, hv), 0);
  const compute = fixed('dot-product', 'compute');
  const [a, b] = vectorsIn(compute.text);   // the general rule is written with letters, so only the example is found
  assert.deepEqual(compute.blanks.map((x) => x.numbers[0]), [a.x * b.x, a.y * b.y, dot(a, b)]);
  // cosine similarity: only the arrow that points the same way scores 1
  const pick = fixed('dot-product', 'direction-only');
  const ana = vectorsIn(pick.text).pop();
  for (const o of pick.options) {
    const [v] = vectorsIn(o.text);
    const cos = dot(ana, v) / (Math.hypot(ana.x, ana.y) * Math.hypot(v.x, v.y));
    assert.equal(Math.abs(cos - 1) < 1e-12, !!o.correct, o.text);
    if (/cosine similarity with Ana is \$-1\$/.test(o.why || '')) assert.ok(Math.abs(cos + 1) < 1e-12);
    if (/cosine is 0/.test(o.why || '')) assert.equal(dot(ana, v), 0);
    if (/less than 1/.test(o.why || '')) assert.ok(cos < 1 && cos > -1);
  }
  const truths = fixed('dot-product', 'truths');
  assert.equal(truths.options.filter((o) => o.correct).length, 3);
});

test('dot-product: the interactive checks accept exactly the right states', () => {
  const zero = rawStep('dot-product', 'find-zero');
  const u = zero.widget.vectors[0];
  for (const p of gridPoints(zero.widget)) {
    const said = zero.check(planeState(zero.widget, { v: p }));
    assert.equal(said === true, dot(u, p) === 0 && (p.x !== 0 || p.y !== 0), `find-zero ${p.x},${p.y}`);
    if (said === true) continue;
    const msg = feedback(said, 'find-zero');
    if (/still positive/.test(msg)) assert.ok(dot(u, p) > 0);
    if (/negative now/.test(msg)) assert.ok(dot(u, p) < 0);
    const quoted = /The dot product is (-?\d+)/.exec(msg);
    if (quoted) assert.equal(Number(quoted[1]), dot(u, p));
  }
  assert.equal(zero.check(planeState(zero.widget, zero.solution)), true);
  for (const v of vectorsIn(zero.explain)) assert.equal(dot(u, v), 0, 'every example in the explanation is perpendicular to u');

  const swing = rawStep('dot-product', 'swing');
  const su = swing.widget.vectors[0];
  const moving = swing.widget.vectors[1];
  let best = -Infinity;
  for (const deg of ints(0, 345, moving.snapDeg)) best = Math.max(best, dot(su, onCircle(moving.circle, deg)));
  for (const deg of ints(0, 345, moving.snapDeg)) {
    const p = onCircle(moving.circle, deg);
    const said = swing.check(planeState(swing.widget, { v: p }));
    assert.equal(said === true, Math.abs(dot(su, p) - best) < 1e-9, `swing ${deg}°`);
    if (said === true) continue;
    const msg = feedback(said, 'swing');
    if (/most \*\*negative\*\*/.test(msg)) assert.equal(deg, 180);
    if (/exactly 0/.test(msg)) assert.ok(deg === 90 || deg === 270);
    if (/It can still grow/.test(msg)) assert.ok(dot(su, p) > 0);
    if (/leaning against/.test(msg)) assert.ok(dot(su, p) < 0);
  }
  assert.equal(swing.check(planeState(swing.widget, swing.solution)), true);
  assert.equal(best, 12);

  const shadow = rawStep('dot-product', 'shadow');
  const hu = shadow.widget.vectors[0];
  const lenU = Math.hypot(hu.x, hu.y);
  assert.equal(lenU.toFixed(2), '4.47', 'the length of u quoted in the feedback');
  let passes = 0;
  for (const p of gridPoints(shadow.widget)) {
    const s = planeState(shadow.widget, { v: p });
    const said = shadow.check(s);
    // the shadow of v on u is (u·v)/|u|; it is as long as u when u·v = |u|²
    const good = Math.abs(dot(hu, p) / lenU - lenU) < 1e-9 && !sameVec(p, hu);
    assert.equal(said === true, good, `shadow ${p.x},${p.y}`);
    if (said === true) { passes++; continue; }
    const msg = feedback(said, 'shadow');
    if (/Make the shadow longer/.test(msg)) assert.ok(dot(hu, p) / lenU < lenU && dot(hu, p) > 0);
    if (/Make the shadow shorter/.test(msg)) assert.ok(dot(hu, p) / lenU > lenU);
    if (/points backwards/.test(msg)) assert.ok(dot(hu, p) < 0);
    if (/right angle/.test(msg)) assert.equal(dot(hu, p), 0);
  }
  assert.ok(passes >= 4);
  assert.equal(shadow.check(planeState(shadow.widget, shadow.solution)), true);
  for (const v of vectorsIn(shadow.explain)) assert.equal(dot(hu, v), 20, 'every example in the explanation has dot product 20');

  const taste = rawStep('dot-product', 'taste');
  const [ana, ben] = taste.widget.vectors;
  passes = 0;
  for (const p of gridPoints(taste.widget)) {
    const said = taste.check(planeState(taste.widget, { Y: p }));
    assert.equal(said === true, dot(p, ana) > 0 && dot(p, ben) < 0, `taste ${p.x},${p.y}`);
    if (said === true) { passes++; continue; }
    const msg = feedback(said, 'taste');
    if (/^You agree with Ana/.test(msg)) assert.ok(dot(p, ana) > 0 && dot(p, ben) >= 0);
    if (/^You disagree with Ben/.test(msg)) assert.ok(dot(p, ben) < 0 && dot(p, ana) <= 0);
  }
  assert.ok(passes > 5);
  assert.equal(taste.check(planeState(taste.widget, taste.solution)), true);
  assert.notEqual(taste.check(planeState(taste.widget)), true, 'not solved at the start');
  assert.ok(gridPoints(taste.widget).every((p) => Math.abs(p.x) <= 3 && Math.abs(p.y) <= 3), 'ratings run from -3 to 3');
});

/* ================================================================ lesson 3 */

test('matrices-transform: reading a matrix off its picture, and applying one', () => {
  eachVariant('matrices-transform', 'read-matrix', (step) => {
    const fig = step.figures[0];
    const m = fig.matrix;
    assert.deepEqual(step.blanks.map((b) => b.numbers[0]), [m[0][0], m[0][1], m[1][0], m[1][1]], 'the blanks, row by row, are the matrix that is drawn');
    assert.notEqual(determinant(m), 0);
    assert.ok(m.flat().every((v) => Math.abs(v) < fig.range), 'both arrow tips are inside the picture');
    const alt = Array.from(fig.alt.matchAll(/ends at (-?\d+) across and (-?\d+) up/g), (x) => [Number(x[1]), Number(x[2])]);
    assert.deepEqual(alt, [[m[0][0], m[1][0]], [m[0][1], m[1][1]]], 'the description for screen readers names the same two columns');
    assert.ok(step.explain.includes(colouredMatrix(m)), 'the explanation shows the same matrix');
    assert.ok(!(m[0][0] === 1 && m[1][0] === 0) && !(m[0][1] === 0 && m[1][1] === 1), 'neither arrow is still in its starting place');
  });
  eachVariant('matrices-transform', 'apply-matrix', (step) => {
    const [m] = matricesIn(step.text);
    const [v] = vectorsIn(step.text);
    const out = act(m, v);
    assert.equal(blank(step, 0), out.x);
    assert.equal(blank(step, 1), out.y);
    const parts = vectorsIn(step.hints[1]);
    assert.deepEqual(add(parts[0], parts[1]), out, 'the two scaled columns of the hint add up to the answer');
    assert.deepEqual(parts[0], times(v.x, { x: m[0][0], y: m[1][0] }));
    assert.deepEqual(vectorsIn(step.explain.split('Row by row')[0]).pop(), out);
    assert.ok(step.explain.includes(`= ${out.x}$`) && step.explain.includes(`= ${out.y}$`));
  });
});

test('matrices-transform: fixed facts', () => {
  // the hook: 2 of the first column plus 3 of the second
  assert.deepEqual(act([[2, -1], [1, 1]], { x: 2, y: 3 }), { x: 1, y: 5 });
  assert.deepEqual(act([[1, -1], [1, 1]], { x: 3, y: 2 }), { x: 1, y: 5 });
  // the catalogue: what each matrix does, checked on a test shape
  const does = {
    'Makes everything twice as big': (m) => sameMat(m, [[2, 0], [0, 2]]),
    'Stretches sideways only': (m) => m[0][1] === 0 && m[1][0] === 0 && m[1][1] === 1 && m[0][0] > 1,
    'Flips top to bottom': (m) => sameMat(m, [[1, 0], [0, -1]]),
    'Quarter turn anticlockwise': (m) => sameVec(act(m, { x: 1, y: 0 }), { x: 0, y: 1 }) && sameVec(act(m, { x: 0, y: 1 }), { x: -1, y: 0 }),
    'Shear: the top slides to the right': (m) => sameVec(act(m, { x: 1, y: 0 }), { x: 1, y: 0 }) && act(m, { x: 0, y: 1 }).x > 0 && act(m, { x: 0, y: 1 }).y === 1,
  };
  const cat = fixed('matrices-transform', 'catalogue');
  for (const [left, right] of cat.pairs) {
    const [m] = matricesIn(left);
    for (const [name, fits] of Object.entries(does)) assert.equal(fits(m), name === right, `${left} / ${name}`);
  }
  // the picture options of the shear question
  const shear = fixed('matrices-transform', 'shear');
  const [asked] = [[[1, 1], [0, 1]]];
  assert.ok(shear.text.includes(colouredMatrix(asked)));
  for (const o of shear.options) assert.equal(sameMat(o.figure.matrix, asked), !!o.correct);
  assert.equal(new Set(shear.options.map((o) => JSON.stringify(o.figure.matrix))).size, shear.options.length, 'four different pictures');
  // no matrix moves the origin
  const slide = fixed('matrices-transform', 'no-slide');
  assert.match(correctOption(slide).text, /Slide/);
  for (const o of slide.options) for (const m of matricesIn(o.why || '')) assert.deepEqual(act(m, { x: 0, y: 0 }), { x: 0, y: 0 });
  assert.equal(determinant(matricesIn(slide.options.find((o) => /Squash/.test(o.text)).why)[0]), 0);
});

test('matrices-transform: the interactive checks accept exactly the right states', () => {
  const every = allMatrices(4);
  const goals = { explore: [[2, 0], [0, 2]], mirror: [[-1, 0], [0, 1]], turn: [[0, -1], [1, 0]], mystery: [[1, -1], [1, 1]] };
  for (const [id, goal] of Object.entries(goals)) {
    const step = rawStep('matrices-transform', id);
    let passes = 0;
    for (const m of every) {
      const s = gridState(step.widget, m);
      const said = step.check(s);
      assert.equal(said === true, sameMat(m, goal), `${id} ${JSON.stringify(m)}`);
      if (said === true) { passes++; continue; }
      const msg = feedback(said, id);
      const d = determinant(m);
      if (/squashed flat/.test(msg)) assert.equal(d, 0, `${id}: ${msg}`);
      if (/mirror image/.test(msg) && !/not a mirror image/.test(msg)) assert.ok(d < 0, `${id} ${JSON.stringify(m)}: ${msg}`);
      if (/not a mirror image/.test(msg)) assert.ok(d > 0, `${id}: ${msg}`);
      if (/leaning or turned/.test(msg)) assert.ok(m[0][1] !== 0 || m[1][0] !== 0);
      if (/Both arrows point backwards/.test(msg)) assert.ok(m[0][0] < 0 && m[1][1] < 0 && m[0][1] === 0 && m[1][0] === 0);
      if (/twice as wide, but not twice as tall/.test(msg)) assert.ok(m[0][0] === 2 && m[1][1] > 0 && m[1][1] !== 2 && m[0][1] === 0 && m[1][0] === 0);
      if (/twice as tall, but not twice as wide/.test(msg)) assert.ok(m[1][1] === 2 && m[0][0] > 0 && m[0][0] !== 2 && m[0][1] === 0 && m[1][0] === 0);
      const factors = /multiplied by (-?\d+) and heights by (-?\d+)/.exec(msg);
      if (factors) assert.ok(Number(factors[1]) === m[0][0] && Number(factors[2]) === m[1][1] && m[0][0] > 0 && m[1][1] > 0 && m[0][1] === 0 && m[1][0] === 0);
      if (/top to bottom/.test(msg)) assert.ok(sameMat(m, [[1, 0], [0, -1]]));
      if (/half turn/.test(msg)) assert.ok(sameMat(m, [[-1, 0], [0, -1]]));
      if (/\*\*clockwise\*\*/.test(msg)) assert.ok(sameMat(m, [[0, 1], [-1, 0]]));
      if (/blue arrow is right/.test(msg)) assert.ok(m[0][0] === goal[0][0] && m[1][0] === goal[1][0]);
      if (/orange arrow is right/.test(msg)) assert.ok(m[0][1] === goal[0][1] && m[1][1] === goal[1][1]);
    }
    assert.equal(passes, 1, `${id}: exactly one matrix is accepted`);
    assert.equal(step.check(gridState(step.widget, [[step.solution.a, step.solution.b], [step.solution.c, step.solution.d]])), true);
    assert.notEqual(step.check(gridState(step.widget, step.widget.matrix || I2)), true, `${id}: not solved at the start`);
  }
  // the top of the dashed stem quoted in the hint: the F's stem is 2 tall
  assert.deepEqual(act(goals.mystery, { x: 0, y: 2 }), { x: -2, y: 2 });

  const mv = rawStep('matrices-transform', 'mat-vec');
  const [p, q] = mv.widget.vectors;
  for (const a of ints(0, 4)) for (const b of ints(0, 4)) {
    const said = mv.check(planeState(mv.widget, {}, { a, b }));
    assert.equal(said === true, a === 3 && b === 2, `mat-vec ${a},${b}`);
  }
  const [M] = matricesIn(mv.explain);
  assert.deepEqual([{ x: M[0][0], y: M[1][0] }, { x: M[0][1], y: M[1][1] }], [{ x: p.x, y: p.y }, { x: q.x, y: q.y }], 'the two arrows are the columns of the matrix');
  assert.deepEqual(vectorsIn(mv.explain).pop(), act(M, { x: 3, y: 2 }));
});

/* ================================================================ lesson 4 */

const TURN = [[0, -1], [1, 0]];
const SHEAR = [[1, 1], [0, 1]];

test('matrix-multiplication: products, column by column', () => {
  eachVariant('matrix-multiplication', 'multiply', (step) => {
    const [A, B] = matricesIn(step.text);
    const AB = product(A, B);
    assert.deepEqual(step.blanks.map((b) => b.numbers[0]), [AB[0][0], AB[0][1], AB[1][0], AB[1][1]]);
    assert.ok(!sameMat(AB, product(B, A)), 'the order matters for this pair');
    assert.deepEqual(matricesIn(step.explain).pop(), AB, 'the explanation ends with the same product');
    const cols = vectorsIn(step.explain).filter((v, i, all) => sameVec(v, act(A, { x: B[0][0], y: B[1][0] })) || sameVec(v, act(A, { x: B[0][1], y: B[1][1] })) || i < 0 || all.length < 0);
    assert.ok(cols.length >= 2, 'both columns of the product appear in the explanation');
  });
  eachVariant('matrix-multiplication', 'which-product', (step) => {
    const [A, B] = matricesIn(step.text);
    const AB = product(A, B);
    const BA = product(B, A);
    const seen = new Set();
    for (const o of step.options) {
      const [m] = matricesIn(o.text);
      assert.equal(sameMat(m, AB), !!o.correct, `option ${o.text}`);
      seen.add(JSON.stringify(m));
      if (/That is \$BA\$/.test(o.why || '')) assert.ok(sameMat(m, BA));
      if (/matching positions/.test(o.why || '')) assert.ok(sameMat(m, A.map((row, i) => row.map((v, j) => v * B[i][j]))));
      if (/\$A \+ B\$/.test(o.why || '')) assert.ok(sameMat(m, A.map((row, i) => row.map((v, j) => v + B[i][j]))));
      if (!o.correct) assert.ok(o.why, 'every wrong option explains itself');
    }
    assert.equal(seen.size, 4, 'four different matrices');
    const quoted = matricesIn(step.explain);
    assert.deepEqual(quoted, [AB, BA], 'the explanation quotes AB and BA');
  });
});

test('matrix-multiplication: which product means which order', () => {
  const firsts = new Set();
  eachVariant('matrix-multiplication', 'which-order', (step) => {
    const named = /\$([A-Z])\$ is the matrix of a ([a-z ]+?), and \$([A-Z])\$ is the matrix of a ([a-z ]+?)\./.exec(step.text);
    const asked = /"first the ([a-z ]+?), then the ([a-z ]+?)"/.exec(step.text);
    assert.ok(named && asked, 'the wording is as expected');
    const letterOf = { [named[2]]: named[1], [named[4]]: named[3] };
    assert.notEqual(named[1], named[3]);
    assert.notEqual(named[2], named[4]);
    const first = letterOf[asked[1]];
    const second = letterOf[asked[2]];
    assert.ok(first && second && first !== second);
    // "AB means: first B, then A" — the move done first is written on the right
    assert.equal(correctOption(step).text, `$${second}${first}$`);
    const other = step.options.find((o) => o.text === `$${first}${second}$`);
    assert.ok(other && !other.correct && other.why.includes(`$${second}$ stands on the right`), 'the reversed product is offered and explained');
    assert.ok(step.explain.includes(`$${first}$ acts first and $${second}$ second`));
    firsts.add(first === named[1]);
    assert.ok(!(new Set([asked[1], asked[2]]).has('flip') && new Set([asked[1], asked[2]]).has('sideways stretch')), 'never a pair of moves that could be swapped');
  });
  assert.equal(firsts.size, 2, 'sometimes the first-named matrix acts first, sometimes the second');
});

test('matrix-multiplication: powers of the shear', () => {
  eachVariant('matrix-multiplication', 'powers', (step) => {
    const n = Number(/S\^\{(\d+)\}/.exec(step.text)[1]);
    const [S] = matricesIn(step.text);
    let P = I2;
    for (let i = 0; i < n; i++) P = product(S, P);
    assert.equal(step.answer, P[0][1], 'the top-right entry of S multiplied out n times');
    assert.deepEqual(matricesIn(step.explain).pop(), P);
    for (const [value] of step.wrong) assert.notEqual(value, step.answer);
    assert.ok(step.explain.includes(`saved ${n - 1} matrix multiplications`));
    assert.ok(step.figures[0].maxMoves < n, 'the figure cannot simply be pressed all the way to the answer');
  });
});

test('matrix-multiplication: fixed facts', () => {
  const TS = product(TURN, SHEAR);   // first shear, then turn
  const ST = product(SHEAR, TURN);   // first turn, then shear
  assert.deepEqual(TS, [[0, -1], [1, 1]]);
  assert.deepEqual(ST, [[1, -1], [1, 0]]);
  // follow the basis arrows by hand: shear, then turn
  assert.deepEqual(act(TURN, act(SHEAR, { x: 1, y: 0 })), { x: 0, y: 1 });
  assert.deepEqual(act(TURN, act(SHEAR, { x: 0, y: 1 })), { x: -1, y: 1 });
  const one = rawStep('matrix-multiplication', 'one-matrix');
  assert.deepEqual(vectorsIn(one.explain), [{ x: 1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: -1, y: 1 }]);
  assert.ok(one.explain.includes(colouredMatrix(TS)));
  assert.deepEqual(matricesIn(rawStep('matrix-multiplication', 'product').text), [TURN, SHEAR, TS], 'TS is written out correctly');
  const rtl = fixed('matrix-multiplication', 'right-to-left');
  assert.equal(correctOption(rtl).text, '$ST$', '"first the turn T, then the shear S" is ST');
  assert.deepEqual(matricesIn(rtl.explain), [ST, TS]);
  // the worked example
  const cols = fixed('matrix-multiplication', 'columns');
  const [A, B] = matricesIn(cols.text);
  const AB = product(A, B);
  assert.deepEqual(cols.blanks.map((b) => b.numbers[0]), [AB[0][0], AB[1][0], AB[0][1], AB[1][1]], 'the blanks go down the first column, then down the second');
  assert.deepEqual(matricesIn(cols.explain), [AB]);
  // wider and taller can be swapped
  const com = fixed('matrix-multiplication', 'commute');
  const [wide, tall] = com.figures[0].moves.map((m) => m.matrix);
  assert.ok(sameMat(product(wide, tall), product(tall, wide)));
  assert.match(correctOption(com).text, /same result/);
  assert.deepEqual(matricesIn(com.explain), [wide, tall, product(wide, tall), tall, wide, product(tall, wide)], 'both products are written out, and they agree');
  assert.equal(fixed('matrix-multiplication', 'truths').options.filter((o) => o.correct).length, 3);
});

test('matrix-multiplication: the interactive checks accept exactly the right states', () => {
  const both = rawStep('matrix-multiplication', 'try-both');
  const ids = both.widget.moves.map((m) => m.id);
  const sequences = [[]];
  for (let len = 1; len <= both.widget.maxMoves; len++) {
    const longer = [];
    for (const s of sequences.filter((q) => q.length === len - 1)) for (const id of ids) longer.push([...s, id]);
    sequences.push(...longer);
  }
  assert.equal(sequences.length, 1 + 2 + 4 + 8 + 16);
  for (const seq of sequences) {
    const s = gridState(both.widget, null, seq);
    const said = both.check(s);
    const good = seq.length === 2 && new Set(seq).size === 2 && s.match;
    assert.equal(said === true, good, `try-both ${seq.join(',')}`);
    if (said !== true) feedback(said, 'try-both');
  }
  assert.equal(both.check(gridState(both.widget, null, both.solution.applied)), true);
  assert.deepEqual(both.solution.applied, ['shear', 'turn']);
  assert.ok(sameMat(both.widget.target, product(TURN, SHEAR)), 'the outline is "shear, then turn"');
  assert.match(both.check(gridState(both.widget, null, ['turn', 'shear'])), /turned first and sheared second/);
  // turn-then-shear leaves the stem of the F along the horizontal axis
  assert.equal(act(product(SHEAR, TURN), { x: 0, y: 2 }).y, 0);

  const every = allMatrices(4);
  for (const [id, goal] of [['one-matrix', product(TURN, SHEAR)], ['identity', I2]]) {
    const step = rawStep('matrix-multiplication', id);
    let passes = 0;
    for (const m of every) {
      const said = step.check(gridState(step.widget, m));
      assert.equal(said === true, sameMat(m, goal), `${id} ${JSON.stringify(m)}`);
      if (said === true) { passes++; continue; }
      const msg = feedback(said, id);
      if (/squashed flat/.test(msg)) assert.equal(determinant(m), 0);
      if (/mirror image/.test(msg)) assert.ok(determinant(m) < 0);
      if (/blue arrow is right/.test(msg)) assert.ok(m[0][0] === goal[0][0] && m[1][0] === goal[1][0]);
      if (/orange arrow is right/.test(msg)) assert.ok(m[0][1] === goal[0][1] && m[1][1] === goal[1][1]);
    }
    assert.equal(passes, 1);
    assert.notEqual(step.check(gridState(step.widget, step.widget.matrix || I2)), true, `${id}: not solved at the start`);
  }
});

/* ================================================================ lesson 5 */

test('determinants-inverses: determinants and what they say', () => {
  eachVariant('determinants-inverses', 'determinant', (step) => {
    const [m] = matricesIn(step.text);
    const [[a, b], [c, d]] = m;
    assert.equal(step.answer, a * d - b * c);
    for (const [value, msg] of step.wrong) {
      assert.notEqual(value, step.answer);
      if (/\*\*subtracted\*\*/.test(msg)) assert.equal(value, a * d + b * c);
      else if (/wrong way round/.test(msg)) assert.equal(value, b * c - a * d);
      else if (/along the rows/.test(msg)) assert.equal(value, a * b - c * d);
      else assert.fail(`unexpected feedback: ${msg}`);
    }
    assert.ok(step.explain.endsWith(`= ${a * d - b * c}$.`));
  });
  const kinds = new Set();
  eachVariant('determinants-inverses', 'what-it-does', (step) => {
    const [m] = matricesIn(step.text);
    const D = determinant(m);
    const right = correctOption(step).text;
    kinds.add(Math.sign(D));
    if (D === 0) {
      assert.match(right, /^Squashed onto a line/);
      for (const o of step.options.filter((x) => !x.correct)) {
        const k = Number(/^Area (\d+)/.exec(o.text)[1]);
        assert.ok(k > 0, 'the tempting wrong area is not 0');
        assert.equal(k, Math.abs(m[0][0] * m[1][1] + m[0][1] * m[1][0]), 'it comes from adding the two products');
        assert.ok(o.why.includes(`= 0$, not ${k}`));
      }
    } else {
      assert.equal(right, D > 0 ? `Area ${D}, the right way round` : `Area ${-D}, mirrored`);
      for (const o of step.options.filter((x) => !x.correct)) {
        if (/^Area/.test(o.text)) assert.match(o.why, D > 0 ? /positive here/ : /negative here/);
        else assert.ok(o.why.includes(`The determinant is ${D}, not 0`));
      }
    }
    assert.ok(step.explain.includes(`= ${D}$`), 'the explanation quotes the determinant');
  });
  assert.equal(kinds.size, 3, 'positive, negative and zero determinants all occur');
});

test('determinants-inverses: the inverse really undoes the matrix', () => {
  eachVariant('determinants-inverses', 'inverse', (step) => {
    const [m] = matricesIn(step.text);
    const [x, y, z, w] = step.blanks.map((b) => b.numbers[0]);
    const inv = [[x, y], [z, w]];
    assert.ok(sameMat(product(inv, m), I2), 'A⁻¹A = I');
    assert.ok(sameMat(product(m, inv), I2), 'AA⁻¹ = I');
    assert.ok(inv.flat().every(Number.isInteger), 'whole numbers only');
    const D = determinant(m);
    assert.ok(step.hints[1].includes(`The determinant is $${D}$`));
    const swapped = [[m[1][1], -m[0][1]], [-m[1][0], m[0][0]]];
    assert.deepEqual(matricesIn(step.hints[1])[0], swapped, 'the hint swaps and changes signs correctly');
    assert.deepEqual(matricesIn(step.explain)[0], swapped);
    assert.equal(/Dividing by 1/.test(step.hints[1]), D === 1);
    assert.deepEqual(vectorsIn(step.explain), [{ x: m[0][0], y: m[1][0] }, { x: 1, y: 0 }], 'the check at the end uses the first column of A');
  });
});

test('determinants-inverses: a system solved by its inverse', () => {
  eachVariant('determinants-inverses', 'solve-system', (step) => {
    const rows = Array.from(step.text.matchAll(/(-?\d*)x ([+-]) (\d*)y &= (-?\d+)/g), (m) => {
      const coef = (t) => (t === '' ? 1 : t === '-' ? -1 : Number(t));
      return { a: coef(m[1]), b: (m[2] === '-' ? -1 : 1) * coef(m[3]), rhs: Number(m[4]) };
    });
    assert.equal(rows.length, 2, 'two equations');
    const x = blank(step, 0);
    const y = blank(step, 1);
    for (const row of rows) assert.equal(row.a * x + row.b * y, row.rhs, 'the answer satisfies the equation');
    const A = rows.map((row) => [row.a, row.b]);
    assert.notEqual(determinant(A), 0, 'the solution is unique');
    assert.ok(!/(^|[^\d])1[xy]/.test(displayMath(step.text.slice(step.text.indexOf('**Solve')))), 'no coefficient 1 is written out');
    assert.deepEqual(matricesIn(step.hints[0])[0], A, 'the hint names the right matrix');
    const [hA, inv, inv2] = matricesIn(step.explain);
    assert.deepEqual(hA, A);
    assert.deepEqual(inv, inv2);
    assert.ok(sameMat(product(inv, A), I2), 'the inverse quoted in the explanation is right');
    assert.deepEqual(vectorsIn(step.explain), [{ x: rows[0].rhs, y: rows[1].rhs }, { x, y }]);
  });
});

test('determinants-inverses: fixed facts', () => {
  const hook = fixed('determinants-inverses', 'hook');
  assert.equal(determinant(hook.figures[0].matrix), hook.answer);
  assert.equal(hook.answer, 5);
  // the shear and its inverse
  assert.ok(sameMat(product([[1, -1], [0, 1]], SHEAR), I2));
  // two arrows that the singular matrix merges
  const A = [[1, 2], [1, 2]];
  assert.equal(determinant(A), 0);
  assert.deepEqual(act(A, { x: 2, y: 0 }), act(A, { x: 0, y: 1 }));
  assert.deepEqual(act(A, { x: 2, y: 0 }), { x: 2, y: 2 });
  assert.deepEqual(fixed('determinants-inverses', 'no-undo').figures[0].matrix, A);
  // the system with parallel lines
  const par = fixed('determinants-inverses', 'parallel');
  const P = par.figures[0].matrix;
  assert.deepEqual(matricesIn(par.text), [P]);
  assert.equal(determinant(P), 0);
  assert.deepEqual(act(P, { x: 1, y: 0 }), { x: 1, y: 2 });
  assert.notEqual(cross({ x: 1, y: 2 }, par.figures[0].target), 0, 'the star is off the line that everything lands on');
  for (const v of gridPoints(par.figures[0])) assert.equal(cross({ x: 1, y: 2 }, act(P, v)), 0, 'every arrow lands on that line');
  assert.match(correctOption(par).text, /squashes the plane onto a line/);
  // the sorting step
  for (const item of fixed('determinants-inverses', 'sort').items) {
    const [m] = matricesIn(item.text);
    const D = determinant(m);
    assert.equal(item.bucket, D !== 0 ? 0 : 1, item.text);
    assert.equal(Number(/= (-?\d+)\$/.exec(item.why)[1]), D, `the reason quotes the determinant of ${item.text}`);
  }
});

test('determinants-inverses: the interactive checks accept exactly the right states', () => {
  const every = allMatrices(4);
  const squash = rawStep('determinants-inverses', 'squash');
  const flip = rawStep('determinants-inverses', 'flip');
  const undo = rawStep('determinants-inverses', 'undo');
  let undone = 0;
  for (const m of every) {
    const zeroColumn = (m[0][0] === 0 && m[1][0] === 0) || (m[0][1] === 0 && m[1][1] === 0);
    const D = determinant(m);
    let said = squash.check(gridState(squash.widget, m));
    assert.equal(said === true, D === 0 && !zeroColumn, `squash ${JSON.stringify(m)}`);
    if (said !== true) {
      const msg = feedback(said, 'squash');
      if (/no length/.test(msg)) assert.ok(zeroColumn);
      const area = /The area is (\d+)/.exec(msg);
      if (area) assert.equal(Number(area[1]), Math.abs(D));
    }
    said = flip.check(gridState(flip.widget, m));
    assert.equal(said === true, D === -2, `flip ${JSON.stringify(m)}`);
    if (said !== true) {
      const msg = feedback(said, 'flip');
      if (/still the right way round/.test(msg)) assert.ok(D > 0);
      if (/is a mirror image, but the area/.test(msg)) assert.ok(D < 0 && D !== -2 && msg.includes(`now ${-D}.`));
      if (/on one line now/.test(msg)) assert.equal(D, 0);
    }
    said = undo.check(gridState(undo.widget, m));
    assert.equal(said === true, sameMat(product(m, undo.widget.pre), I2), `undo ${JSON.stringify(m)}`);
    if (said === true) undone++;
    else {
      const msg = feedback(said, 'undo');
      if (/is the identity/.test(msg)) assert.ok(sameMat(m, I2));
      if (/second time/.test(msg)) assert.ok(sameMat(m, SHEAR));
      if (/mirror image/.test(msg)) assert.ok(D < 0);
    }
  }
  assert.equal(undone, 1);
  for (const step of [squash, flip, undo]) {
    const sol = [[step.solution.a, step.solution.b], [step.solution.c, step.solution.d]];
    assert.equal(step.check(gridState(step.widget, sol)), true);
    assert.notEqual(step.check(gridState(step.widget, step.widget.matrix || I2)), true, 'not solved at the start');
  }
  assert.equal(determinant(flip.widget.matrix), 2, 'the machine starts with area 2');

  const drag = rawStep('determinants-inverses', 'solve-drag');
  let hits = 0;
  for (const v of gridPoints(drag.widget)) {
    const said = drag.check(spinState(drag.widget, v));
    assert.equal(said === true, sameVec(act(drag.widget.matrix, v), drag.widget.target), `solve-drag ${v.x},${v.y}`);
    if (said === true) { hits++; continue; }
    const at = /sent to \((-?\d+), (-?\d+)\)/.exec(feedback(said, 'solve-drag'));
    assert.deepEqual({ x: Number(at[1]), y: Number(at[2]) }, act(drag.widget.matrix, v));
  }
  assert.equal(hits, 1);
  assert.equal(drag.check(spinState(drag.widget, drag.solution.v)), true);
  assert.deepEqual(matricesIn(drag.text), [drag.widget.matrix]);
  assert.deepEqual(vectorsIn(drag.text), [drag.widget.target]);
  // the system as written: 2x + y = 5 and x + y = 3
  assert.ok(2 * drag.solution.v.x + drag.solution.v.y === 5 && drag.solution.v.x + drag.solution.v.y === 3);
});

/* ================================================================ lesson 6 */

test('eigenvectors: checking and spotting eigenvectors', () => {
  eachVariant('eigenvectors', 'eigen-check', (step) => {
    const [A] = matricesIn(step.text);
    const [v] = vectorsIn(step.text);
    const out = act(A, v);
    assert.ok(v.x !== 0 || v.y !== 0);
    assert.equal(blank(step, 0), out.x);
    assert.equal(blank(step, 1), out.y);
    const lambda = blank(step, 2);
    assert.deepEqual(out, times(lambda, v), 'Av is that many times v');
    assert.deepEqual(vectorsIn(step.explain), [out, v]);
    assert.equal(/flipped/.test(step.explain), lambda < 0);
    assert.ok(A.flat().every((n) => Number.isInteger(n) && Math.abs(n) <= 6), 'small whole numbers');
  });
  eachVariant('eigenvectors', 'spot-eigenvector', (step) => {
    const [A] = matricesIn(step.text);
    assert.equal(step.options.length, 4);
    for (const o of step.options) {
      const [w] = vectorsIn(o.text);
      const to = act(A, w);
      const stays = cross(w, to) === 0;
      assert.equal(stays, !!o.correct, `option ${o.text}`);
      if (!o.correct) assert.deepEqual(vectorsIn(o.why), [to, w], 'the feedback quotes where the arrow is sent');
    }
    const [v] = vectorsIn(correctOption(step).text);
    const [, out] = vectorsIn(step.explain);
    assert.deepEqual(out, act(A, v));
    const lambda = Number(/eigenvalue \$(-?\d+)\$/.exec(step.explain)[1]);
    assert.deepEqual(act(A, v), times(lambda, v));
  });
});

test('eigenvectors: the settled state of two places', () => {
  const size = { half: 2, 'a third': 3, 'a quarter': 4, 'a fifth': 5 };
  eachVariant('eigenvectors', 'steady-state', (step) => {
    const total = Number(/\*\*(\d+) [a-z ]+\*\*/.exec(step.text)[1]);
    const places = /kept at (.+?) and at (.+?)\./.exec(step.text);
    const [m, n] = Array.from(step.text.matchAll(/\*\*(half|a third|a quarter|a fifth)\*\*/g), (x) => size[x[1]]);
    assert.ok(m && n && m !== n);
    assert.ok(step.text.includes(`of those at ${places[1]}`) && step.text.includes(`of those at ${places[2]}`));
    assert.ok(step.text.trim().endsWith(`then at ${places[1]}?**`), 'the question asks about the first place');
    // settled: as many leave the first place as arrive there
    const fits = ints(0, total).filter((a) => a * n === (total - a) * m);
    assert.equal(fits.length, 1, 'exactly one split is settled');
    assert.equal(step.answer, fits[0]);
    for (const [value, msg] of step.wrong) {
      assert.notEqual(value, step.answer);
      if (/number at/.test(msg)) assert.equal(value, total - step.answer);
      if (/equal split/.test(msg)) assert.equal(value, total / 2);
    }
    assert.ok(step.explain.includes(`**${step.answer}** and ${total - step.answer}`));
    assert.ok(step.explain.includes(`then ${step.answer / m} move each way`));
    assert.ok(step.hints[1].includes(`ratio ${m} to ${n}`) && step.hints[1].includes(`make ${total}`));
  });
});

test('eigenvectors: fixed facts', () => {
  const A = [[2, 1], [1, 2]];
  assert.deepEqual(act(A, { x: 1, y: 1 }), { x: 3, y: 3 });
  assert.deepEqual(act(A, { x: 1, y: -1 }), { x: 1, y: -1 });
  assert.equal(dot({ x: 1, y: 1 }, { x: 1, y: -1 }), 0, 'the two eigen-directions are at right angles');
  assert.equal(3 ** 10, 59049);
  assert.deepEqual(act([[2, 0], [0, -1]], { x: 0, y: 1 }), { x: 0, y: -1 });
  // a quarter turn sends every arrow to one at right angles to it
  for (const deg of ints(0, 345, 15)) { const v = onCircle(1, deg); assert.ok(Math.abs(dot(v, act(TURN, v))) < 1e-9); }
  // the growing matrix of the "again and again" step
  const rep = rawStep('eigenvectors', 'repeat');
  const B = rep.widget.matrix;
  assert.deepEqual(act(B, { x: 1, y: 1 }), { x: 1.5, y: 1.5 });
  assert.deepEqual(act(B, { x: 1, y: -1 }), { x: 0.5, y: -0.5 });
  assert.deepEqual(rep.widget.lines, [[1, 1], [1, -1]]);
  // the bikes
  const bikes = fixed('eigenvectors', 'bikes');
  const M = bikes.figures[0].matrix;
  assert.deepEqual(M, [[0.5, 0.25], [0.5, 0.75]], 'half of North goes to South, a quarter of South goes to North');
  assert.ok(M[0][0] + M[1][0] === 1 && M[0][1] + M[1][1] === 1, 'no bike is lost');
  let state = { ...bikes.figures[0].v };
  for (let day = 0; day < bikes.figures[0].iterate.max; day++) state = act(M, state);
  assert.deepEqual([Math.round(state.x), Math.round(state.y)], bikes.blanks.map((b) => b.numbers[0]), 'the numbers the figure settles on');
  assert.deepEqual(act(M, { x: 40, y: 80 }), { x: 40, y: 80 });
  assert.deepEqual(act(M, { x: 1, y: -1 }), { x: 0.25, y: -0.25 }, 'the other eigenvalue is a quarter');
  let early = { ...bikes.figures[0].v };
  for (let day = 0; day < 3; day++) early = act(M, early);
  assert.notDeepEqual([Math.round(early.x), Math.round(early.y)], [40, 80], 'it takes more than three days to settle');
  assert.equal(fixed('eigenvectors', 'truths').options.filter((o) => o.correct).length, 3);
});

test('eigenvectors: the interactive checks accept exactly the right states', () => {
  const directions = ints(0, 345, 15);
  const lineOf = (v, w) => Math.abs(cross(v, w)) < 1e-9;
  const cases = [
    ['spin', (v, to) => lineOf(v, to)],
    ['second', (v, to) => sameVec(v, to) || (lineOf(v, to) && Math.abs(dot(to, v) / dot(v, v) - 1) < 1e-9)],
    ['diagonal', (v, to) => lineOf(v, to) && dot(v, to) < 0],
  ];
  for (const [id, good] of cases) {
    const step = rawStep('eigenvectors', id);
    const accepted = [];
    for (const deg of directions) {
      const v = onCircle(step.widget.r || 1, deg);
      const said = step.check(spinState(step.widget, v));
      assert.equal(said === true, good(v, act(step.widget.matrix, v)), `${id} at ${deg}°`);
      if (said === true) { accepted.push(deg); continue; }
      const msg = feedback(said, id);
      const to = act(step.widget.matrix, v);
      const quoted = /green arrow is (\d+) times the violet one/.exec(msg);
      if (quoted) assert.ok(lineOf(v, to) && Math.abs(dot(to, v) / dot(v, v) - Number(quoted[1])) < 1e-9, `${id} at ${deg}°: ${msg}`);
      if (/off the dashed line/.test(msg)) assert.ok(!lineOf(v, to), `${id} at ${deg}°: ${msg}`);
    }
    assert.deepEqual(accepted, { spin: [45, 135, 225, 315], second: [135, 315], diagonal: [90, 270] }[id]);
    const len = Math.hypot(step.solution.v.x, step.solution.v.y);
    assert.equal(step.check(spinState(step.widget, { x: step.solution.v.x / len, y: step.solution.v.y / len })), true);
    assert.notEqual(step.check(spinState(step.widget, step.widget.v || { x: 1, y: 0 })), true, `${id}: not solved at the start`);
    const start = (Math.atan2(step.widget.v.y, step.widget.v.x) * 180) / Math.PI;
    assert.ok(Math.abs(start / 15 - Math.round(start / 15)) < 1e-3, 'the arrow starts on one of the directions it can be turned to');
  }
  // a quarter turn: no direction is ever accepted as an eigen-direction
  const rot = fixed('eigenvectors', 'rotation');
  for (const deg of directions) assert.equal(spinState(rot.figures[0], onCircle(1, deg)).aligned, false);
  assert.equal(correctOption(rot).text, 'None');

  const rep = rawStep('eigenvectors', 'repeat');
  for (const steps of ints(0, rep.widget.iterate.max)) {
    const said = rep.check(spinState(rep.widget, rep.widget.v, steps));
    assert.equal(said === true, steps >= 4, `repeat after ${steps}`);
    if (said !== true) assert.ok(said.includes(steps === 1 ? '1 time ' : `${steps} times `));
  }
  // the trail really does head for the direction (1, 1), wherever it starts
  for (const start of gridPoints(rep.widget)) {
    if (start.x + start.y === 0) continue;   // the exceptions: starts on the other dotted line
    let p = start;
    for (let i = 0; i < 40; i++) p = act(rep.widget.matrix, p);
    assert.ok(Math.abs(p.x - p.y) < 1e-6 * Math.abs(p.x), `from ${start.x},${start.y}`);
  }
});

/* =============================================================== everything */

/** Every string a learner can be shown in a resolved step (text, options, hints, feedback, figure labels…). */
function stringsOf(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) stringsOf(v, out);
  else if (value && typeof value === 'object') for (const [key, v] of Object.entries(value)) { if (key !== 'id' && key !== 'type') stringsOf(v, out); }
  return out;
}
/** The text with all formulas taken out, by the same rules as the lesson renderer. */
const withoutMath = (text) => text.replace(/\$\$[\s\S]+?\$\$/g, ' ').replace(/\$([^\s$](?:[^$\n]*[^\s$])?)\$(?!\d)/g, ' ');
const mathOf = (text) => [...Array.from(text.matchAll(/\$\$([\s\S]+?)\$\$/g), (m) => m[1]), ...Array.from(text.replace(/\$\$[\s\S]+?\$\$/g, ' ').matchAll(/\$([^\s$](?:[^$\n]*[^\s$])?)\$(?!\d)/g), (m) => m[1])];
const TABLE_RULE = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function checkStep(step, where) {
  for (const text of stringsOf(step)) {
    assert.ok(!/undefined|NaN|\[object/.test(text), `${where}: "${text.slice(0, 80)}"`);
    const prose = withoutMath(text);
    assert.ok(!/\\[a-zA-Z]+/.test(prose), `${where}: TeX outside a formula in "${prose.trim().slice(0, 90)}"`);
    assert.ok(!prose.includes('$'), `${where}: an unmatched $ in "${text.slice(0, 80)}"`);
    for (const tex of mathOf(text)) {
      assert.ok(!/[+-] -\d/.test(tex), `${where}: an untidy sign in $${tex}$`);
      assert.ok(!/(^|[^\d.}])1\\,\\begin\{pmatrix\}/.test(tex), `${where}: a coefficient 1 written out in $${tex}$`);
    }
    // a table only renders when its second line is a proper rule
    const lines = text.split('\n').map((l) => l.trim());
    for (const line of lines) assert.equal((line.match(/\*\*/g) || []).length % 2, 0, `${where}: bold opens and closes on the same line in "${line.slice(0, 70)}"`);
    lines.forEach((line, i) => { if (/^\|[\s:|-]+\|$/.test(line) && /-/.test(line)) assert.match(line, TABLE_RULE, `${where}: table rule "${line}"`); if (/^\|.*\|$/.test(line) && i + 1 < lines.length && /^\|.*\|$/.test(lines[i + 1]) && i === lines.findIndex((l) => /^\|.*\|$/.test(l))) assert.match(lines[i + 1], TABLE_RULE, `${where}: the line under a table heading`); });
  }
  if (step.type === 'choice' || step.type === 'multi') {
    const right = step.options.filter((o) => o.correct).length;
    if (step.type === 'choice') assert.equal(right, 1, `${where}: exactly one correct option`);
    else assert.ok(right >= 1 && right < step.options.length, `${where}: some, but not all, options are correct`);
    const keys = step.options.map((o) => (o.figure ? JSON.stringify(o.figure.matrix) : o.text.trim()));
    assert.equal(new Set(keys).size, keys.length, `${where}: no duplicate options (${keys.join(' | ')})`);
    for (const o of step.options) if (!o.correct && step.mode !== 'predict') assert.ok(o.why || step.options.length === 2 || step.type === 'choice', `${where}: wrong option "${o.text}"`);
  }
  if (step.type === 'numeric') for (const [value] of step.wrong) assert.notEqual(value, step.answer, `${where}: a "wrong" value equals the answer`);
  if (step.type === 'fill') for (const b of step.blanks) assert.ok(b.kind === 'select' || b.answers.length > 0, `${where}: every blank has an answer`);
  if (step.graded) assert.ok(step.explain, `${where}: has an explanation`);
}

test('every step: no stray text, one correct option, no duplicate options, tidy formulas', () => {
  let steps = 0;
  for (const id of LESSONS) {
    for (const raw of lessons[id].steps) {
      const seeds = typeof raw.gen === 'function' ? SEEDS : 1;
      for (let seed = 1; seed <= seeds; seed++) {
        const step = resolveStep(raw, makeRng(seed * 104729 + 7), raw.id);
        checkStep(step, `${id}/${raw.id}${seeds > 1 ? ` (seed ${seed})` : ''}`);
        steps++;
      }
      if (raw.type === 'interact') assert.ok(raw.solution !== undefined && typeof raw.check === 'function', `${id}/${raw.id} has a check and a solution`);
    }
    for (const line of [...lessons[id].recap, lessons[id].next]) checkStep({ text: line }, `${id} recap`);
    const n = lessons[id].steps.length;
    assert.ok(n >= 12 && n <= 20, `${id} has ${n} steps`);
    const reviews = lessons[id].steps.filter((s) => s.review).length;
    assert.ok(reviews >= 2 && reviews <= 4, `${id} has ${reviews} review steps`);
    assert.ok(lessons[id].recap.length >= 3 && lessons[id].recap.length <= 4);
    assert.ok(lessons[id].steps.filter((s) => s.type === 'interact' || (s.figure && !s.figure.static && ['vector-plane', 'matrix-grid', 'eigen-spin'].includes(s.figure.type))).length >= 2, `${id} has hands-on steps`);
  }
  assert.ok(steps > 6000);
});

test('one convention throughout: AB means "first B, then A"', () => {
  // The helper the lessons use for products agrees with composing the two moves by hand.
  for (const v of [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 2, y: -3 }]) {
    assert.deepEqual(act(product(TURN, SHEAR), v), act(TURN, act(SHEAR, v)));
  }
});

/* ===================================================== added in review */

/*
 * A second, independent line of defence: instead of looking for particular numbers, read every
 * formula the course writes and work it out. The little evaluator below knows numbers, column
 * vectors, 2×2 matrices, sums, products (written side by side, with \times or with \cdot),
 * powers, inverses, \sqrt, \frac and \det. A matrix is taken exactly as it is typeset, row by
 * row, so a matrix written with its rows and columns swapped makes an equality fail.
 */
class NotArithmetic extends Error {}
const isV = (v) => v && v.t === 'v';
const isM = (v) => v && v.t === 'm';
const vecOf = (...a) => ({ t: 'v', a });
const matOf = (rowsOfIt) => ({ t: 'm', a: rowsOfIt });
function texAdd(p, q, sign) {
  if (typeof p === 'number' && typeof q === 'number') return p + sign * q;
  if (isV(p) && isV(q) && p.a.length === q.a.length) return vecOf(...p.a.map((x, i) => x + sign * q.a[i]));
  if (isM(p) && isM(q)) return matOf(p.a.map((row, i) => row.map((x, j) => x + sign * q.a[i][j])));
  throw new Error('a sum of two things of different kinds');
}
function texMul(p, q, how) {
  if (typeof p === 'number' && typeof q === 'number') return p * q;
  if (typeof p === 'number' && isV(q)) return vecOf(...q.a.map((x) => p * x));
  if (typeof p === 'number' && isM(q)) return matOf(q.a.map((row) => row.map((x) => p * x)));
  if (isM(p) && isV(q) && q.a.length === 2) return vecOf(...p.a.map((row) => row[0] * q.a[0] + row[1] * q.a[1]));
  if (isM(p) && isM(q)) return matOf([0, 1].map((i) => [0, 1].map((j) => p.a[i][0] * q.a[0][j] + p.a[i][1] * q.a[1][j])));
  if (isV(p) && isV(q) && how === 'cdot' && p.a.length === q.a.length) return p.a.reduce((t, x, i) => t + x * q.a[i], 0);
  throw new Error('a product that makes no sense');
}
function texSame(p, q, eps = 1e-9) {
  if (typeof p === 'number' && typeof q === 'number') return Math.abs(p - q) < eps;
  if (isV(p) && isV(q)) return p.a.length === q.a.length && p.a.every((x, i) => Math.abs(x - q.a[i]) < eps);
  if (isM(p) && isM(q)) return p.a.every((row, i) => row.every((x, j) => Math.abs(x - q.a[i][j]) < eps));
  return false;
}
const texShow = (v) => (typeof v === 'number' ? String(v) : isV(v) ? `(${v.a.join(', ')})` : `[${v.a.map((row) => row.join(' ')).join(' ; ')}]`);
/** One side of an equation. `blocks` holds the bodies of the pmatrix environments, which appear in `src` as §0§, §1§, … */
function texValue(src, env, blocks) {
  const toks = [];
  for (let i = 0; i < src.length;) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (ch === '§') { const j = src.indexOf('§', i + 1); toks.push({ k: 'pm', v: Number(src.slice(i + 1, j)) }); i = j + 1; continue; }
    if (/\d/.test(ch)) { const m = /^\d+(\.\d+)?/.exec(src.slice(i)); toks.push({ k: 'num', v: Number(m[0]) }); i += m[0].length; continue; }
    if ('+-()^{}'.includes(ch)) { toks.push({ k: ch }); i++; continue; }
    if (ch === '\\') {
      const m = /^\\([a-zA-Z]+|[,;!: ])/.exec(src.slice(i));
      if (!m) throw new NotArithmetic(src);
      i += m[0].length;
      const w = m[1];
      if ([',', ';', '!', ':', ' ', 'quad', 'qquad'].includes(w)) continue;
      if (['times', 'cdot', 'sqrt', 'det'].includes(w)) { toks.push({ k: w }); continue; }
      if (['frac', 'tfrac', 'dfrac'].includes(w)) { toks.push({ k: 'frac' }); continue; }
      if (w === 'mathbf') { const mm = /^\s*\{([a-zA-Z])\}/.exec(src.slice(i)); if (!mm) throw new NotArithmetic(src); toks.push({ k: 'name', v: `bold ${mm[1]}` }); i += mm[0].length; continue; }
      throw new NotArithmetic(`\\${w}`);
    }
    if (/[a-zA-Z]/.test(ch)) { toks.push({ k: 'name', v: ch }); i++; continue; }
    throw new NotArithmetic(ch);
  }
  let p = 0;
  const eat = (k) => { if (!toks[p] || toks[p].k !== k) throw new NotArithmetic(src); return toks[p++]; };
  const braced = () => { eat('{'); const v = sum(); eat('}'); return v; };
  function primary() {
    const t = toks[p++];
    if (!t) throw new NotArithmetic(src);
    if (t.k === 'num') return t.v;
    if (t.k === '(') { const v = sum(); eat(')'); return v; }
    if (t.k === '{') { const v = sum(); eat('}'); return v; }
    if (t.k === 'name') { if (!(t.v in env)) throw new NotArithmetic(t.v); return env[t.v]; }
    if (t.k === 'frac') { const a = braced(); return a / braced(); }
    if (t.k === 'sqrt') return Math.sqrt(braced());
    if (t.k === 'det') { const m = power(); if (!isM(m)) throw new Error('the determinant of something that is not a matrix'); return m.a[0][0] * m.a[1][1] - m.a[0][1] * m.a[1][0]; }
    if (t.k === 'pm') {
      const rowsOfIt = blocks[t.v].split(/\\\\(?:\[[^\]]*\])?/).map((row) => row.split('&').map((cell) => { const v = texValue(cell, env, blocks); if (typeof v !== 'number') throw new NotArithmetic(cell); return v; }));
      if (rowsOfIt.every((row) => row.length === 1)) return vecOf(...rowsOfIt.map((row) => row[0]));
      if (rowsOfIt.length === 2 && rowsOfIt.every((row) => row.length === 2)) return matOf(rowsOfIt);
    }
    throw new NotArithmetic(src);
  }
  function power() {
    let base = primary();
    while (toks[p] && toks[p].k === '^') {
      p++;
      const e = toks[p] && toks[p].k === '{' ? braced() : eat('num').v;
      if (typeof base === 'number') base **= e;
      else if (isM(base) && e === -1) { const [[a, b], [c, d]] = base.a; const D = a * d - b * c; if (D === 0) throw new Error('the inverse of a matrix with determinant 0'); base = matOf([[d / D, -b / D], [-c / D, a / D]]); } else if (isM(base) && Number.isInteger(e) && e >= 0) { let out = matOf(I2); for (let i = 0; i < e; i++) out = texMul(base, out); base = out; } else throw new NotArithmetic(src);
    }
    return base;
  }
  const unary = () => (toks[p] && toks[p].k === '-' ? (p++, texMul(-1, unary())) : power());
  function product_() {
    let v = unary();
    for (;;) {
      const t = toks[p];
      if (t && (t.k === 'times' || t.k === 'cdot')) { p++; v = texMul(v, unary(), t.k); } else if (t && ['pm', '(', '{', 'name', 'frac', 'sqrt', 'det'].includes(t.k)) v = texMul(v, power());
      else return v;
    }
  }
  function sum() {
    let v = product_();
    while (toks[p] && (toks[p].k === '+' || toks[p].k === '-')) { const sign = toks[p++].k === '+' ? 1 : -1; v = texAdd(v, product_(), sign); }
    return v;
  }
  const v = sum();
  if (p < toks.length) throw new NotArithmetic(src);
  return v;
}
/** A formula cut into statements (rows of an aligned block, pieces between \quad), each a list of sides joined by "=". */
function statementsOf(tex) {
  const blocks = [];
  let src = tex.replace(/\\(blue|orange|green|violet|red|teal|pink|yellow|gray)\s*\{/g, '{');
  src = src.replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g, (_, body) => { blocks.push(body); return `§${blocks.length - 1}§`; });
  src = src.replace(/\\begin\{aligned\}|\\end\{aligned\}/g, ' ');
  const list = [];
  for (const row of src.split(/\\\\(?:\[[^\]]*\])?/).map((line) => line.replace(/&/g, ' ').trim())) {
    if (!row) continue;
    if (/^=/.test(row) && list.length) list[list.length - 1] += ` ${row}`; else list.push(row);
  }
  return { blocks, list: list.flatMap((st) => st.split(/\\qquad|\\quad/)).map((st) => st.trim().replace(/[.,]$/, '').trim()).filter(Boolean) };
}
/** Everything in a text that can be worked out, in reading order (each side of each "=" separately). */
function valuesIn(text, env = {}) {
  const out = [];
  for (const tex of mathOf(text)) {
    const { blocks, list } = statementsOf(tex);
    for (const st of list) for (const side of st.split('=')) { try { out.push(texValue(side, env, blocks)); } catch (err) { if (!(err instanceof NotArithmetic)) throw err; } }
  }
  return out;
}
/**
 * Check every equality in a text. A statement "A = (matrix)" or "\mathbf{v} = (column)" also defines that name
 * for what follows. Sides that are not arithmetic (letters with no value, words) are left out.
 */
function checkEqualities(text, env, where, tally) {
  for (const pass of [1, 2]) {   // the first pass picks up the definitions, the second checks everything with them
    for (const tex of mathOf(text)) {
      const { blocks, list } = statementsOf(tex);
      for (const st of list) {
        const sides = st.split('=');
        if (sides.length < 2) continue;
        const values = sides.map((side) => { try { return texValue(side, env, blocks); } catch (err) { if (err instanceof NotArithmetic) return undefined; throw new Error(`${where}: ${err.message} in $${tex}$`); } });
        const name = /^\{*\s*(?:\\mathbf\{([a-zA-Z])\}|([a-zA-Z]))\s*\}*$/.exec(sides[0].trim());
        if (name && values[0] === undefined && values[1] !== undefined) env[name[1] ? `bold ${name[1]}` : name[2]] = values[1];
        const known = values.filter((v) => v !== undefined);
        for (const v of known) assert.ok(texSame(v, known[0]), `${where}: ${texShow(known[0])} is not ${texShow(v)} in $${tex}$`);
        if (pass === 2 && known.length > 1) tally.checked++;
      }
    }
  }
}

test('review: the evaluator itself can tell a true formula from a false one', () => {
  const tally = { checked: 0 };
  const ok = String.raw`$$ \begin{aligned} TS &= \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix} \\[4pt] &= \begin{pmatrix} 0 & -1 \\ 1 & 1 \end{pmatrix} \end{aligned} $$ and $3\,\blue{\begin{pmatrix} 1 \\ 1 \end{pmatrix}} - 2\,\begin{pmatrix} -1 \\ 1 \end{pmatrix} = \begin{pmatrix} 5 \\ 1 \end{pmatrix}.$ and $\sqrt{(-3)^2 + 4^2} = \sqrt{25} = 5$`;
  checkEqualities(ok, {}, 'self-test', tally);
  assert.equal(tally.checked, 3);
  // the same product with the answer transposed, the two factors swapped, or a sign lost: each must be caught
  for (const bad of [
    String.raw`$\begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 0 & 1 \\ -1 & 1 \end{pmatrix}$`,
    String.raw`$\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix} = \begin{pmatrix} 0 & -1 \\ 1 & 1 \end{pmatrix}$`,
    String.raw`$2 \times (-3) + 1 \times 4 = 2$`,
    String.raw`$A = \begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}$, so $A^{-1} = \begin{pmatrix} 4 & -2 \\ -3 & 1 \end{pmatrix}$`,
    String.raw`$\det\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix} = 2$`,
  ]) assert.throws(() => checkEqualities(bad, {}, 'self-test', tally), /is not/, bad);
  assert.deepEqual(valuesIn(String.raw`$\begin{pmatrix} 1 & 2 \\ 3 & 4 \end{pmatrix}^{-1}$`)[0].a, [[-2, 1], [1.5, -0.5]]);
  assert.deepEqual(valuesIn(String.raw`$\begin{pmatrix} \tfrac{1}{2} & \tfrac{1}{4} \\[5pt] \tfrac{1}{2} & \tfrac{3}{4} \end{pmatrix}\begin{pmatrix} 40 \\ 80 \end{pmatrix}$`)[0].a, [40, 80]);
});

test('review: every equality written in a formula, anywhere in the course, is true', () => {
  // letters that a lesson defines in one step and goes on using in the next ones
  const known = {
    'matrix-multiplication': { T: matOf(TURN), S: matOf(SHEAR) },
    'determinants-inverses': { S: matOf(SHEAR), I: matOf(I2) },
  };
  const tally = { checked: 0 };
  for (const id of LESSONS) {
    for (const raw of lessons[id].steps) {
      const seeds = typeof raw.gen === 'function' ? SEEDS : 1;
      for (let seed = 1; seed <= seeds; seed++) {
        const step = resolveStep(raw, makeRng(seed * 15485863 + 3), raw.id);
        const where = `${id}/${raw.id}${seeds > 1 ? ` (seed ${seed})` : ''}`;
        const fromText = { ...(known[id] || {}) };
        checkEqualities(step.text, fromText, where, tally);
        // every other string is read on its own, knowing only what the question defined
        const { text, ...rest } = step;
        for (const s of stringsOf(rest)) checkEqualities(s, { ...fromText }, where, tally);
      }
    }
    for (const line of lessons[id].recap) checkEqualities(line, {}, `${id} recap`, tally);
  }
  assert.ok(tally.checked > 12000, `only ${tally.checked} equalities were worked out`);
});

test('review: hints and feedback formulas come to what they claim', () => {
  eachVariant('vectors', 'length', (step) => {
    const [v] = vectorsIn(step.text);
    assert.deepEqual(valuesIn(step.hints[0]), [v.x * v.x + v.y * v.y], 'the first hint adds the two squares');
    assert.ok(step.hints[1].includes(`gives ${v.x * v.x + v.y * v.y}?`));
  });
  eachVariant('vectors', 'find-combo', (step) => {
    const env = { a: blank(step, 0), b: blank(step, 1) };
    const tally = { checked: 0 };
    for (const s of [...step.hints, step.explain]) checkEqualities(s, { ...env }, 'with the answer filled in', tally);
    assert.ok(tally.checked >= 6, 'both equations hold in the hints and in the explanation');
  });
  eachVariant('dot-product', 'make-perpendicular', (step) => {
    const [u] = vectorsIn(step.text);
    const c = Number(new RegExp(String.raw`\\begin\{pmatrix\}\s*${N}\s*\\\\\s*t\s*\\end\{pmatrix\}`).exec(step.text)[1]);
    const tally = { checked: 0 };
    for (const s of [...step.hints, step.explain]) checkEqualities(s, { t: step.answer }, 'with t filled in', tally);
    assert.ok(tally.checked >= 2, 'the equation "… + … × t = 0" holds for the answer');
    for (const s of [step.hints[1], step.explain]) {
      const said = /first product is \$(-?\d+)\$, so \$(.+?) \\times t\$ (?:has to|must) be \$(-?\d+)\$/.exec(s);
      assert.deepEqual([Number(said[1]), valuesIn(`$${said[2]}$`)[0], Number(said[3])], [u.x * c, u.y, u.y * step.answer]);
    }
  });
  eachVariant('dot-product', 'dot-compute', (step) => {
    // when two slips happen to give the same number the learner sees the first message: it must be true of that number
    for (const [value] of step.wrong) {
      const shown = step.wrong.find(([w]) => w === value)[1];
      const quoted = /^That is \$([^$]+)\$/.exec(shown);
      if (quoted) assert.equal(valuesIn(`$${quoted[1]}$`)[0] + 0, value, shown);
    }
  });
  eachVariant('dot-product', 'most-similar', (step) => {
    const [noor] = valuesIn(step.hints[0]);
    assert.ok(step.options[0].text === 'Noor' && (step.options[0].correct || step.options[0].why.startsWith(`Noor scores ${noor + 0} with Mia`)), 'the hint works out Noor\'s score');
  });
  eachVariant('matrices-transform', 'apply-matrix', (step) => {
    const [m] = matricesIn(step.text);
    const [v] = vectorsIn(step.text);
    const lots = /Take (-?\d+) lots of the first column and \$(-?\d+)\$ lots of the second/.exec(step.hints[0]);
    assert.deepEqual([Number(lots[1]), Number(lots[2])], [v.x, v.y]);
    assert.deepEqual(vectorsIn(step.hints[0]), [{ x: m[0][0], y: m[1][0] }, { x: m[0][1], y: m[1][1] }], 'the hint names the two columns, first then second');
    const out = act(m, v);
    assert.deepEqual(valuesIn(step.hints[0]).pop().a.map((n) => n + 0), [out.x, out.y]);
  });
  eachVariant('matrix-multiplication', 'multiply', (step) => {
    const [A, B] = matricesIn(step.text);
    assert.match(step.text, /A &= [\s\S]*B &= /, 'A is the first matrix shown and B the second');
    const AB = product(A, B);
    for (const v of [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 2, y: -3 }]) assert.deepEqual(act(AB, v), act(A, act(B, v)), 'AB does B first, then A');
    step.hints.forEach((hint, j) => {
      assert.deepEqual(valuesIn(hint).pop().a.map((n) => n + 0), [AB[0][j], AB[1][j]], `hint ${j + 1} comes to column ${j + 1} of AB`);
      assert.deepEqual(vectorsIn(hint), [{ x: A[0][0], y: A[1][0] }, { x: A[0][1], y: A[1][1] }], 'it combines the columns of A');
    });
  });
  eachVariant('matrix-multiplication', 'which-product', (step) => {
    const [A, B] = matricesIn(step.text);
    const AB = product(A, B);
    assert.deepEqual(valuesIn(step.hints[0]).pop().a.map((n) => n + 0), [AB[0][0], AB[1][0]]);
    assert.deepEqual(vectorsIn(step.explain), [{ x: B[0][0], y: B[1][0] }, { x: AB[0][0], y: AB[1][0] }, { x: B[0][1], y: B[1][1] }, { x: AB[0][1], y: AB[1][1] }]);
  });
  eachVariant('determinants-inverses', 'determinant', (step) => {
    const [[[a, b], [c, d]]] = matricesIn(step.text);
    // the signed area of the parallelogram on the two columns, by the shoelace formula
    const corners = [[0, 0], [a, c], [a + b, c + d], [b, d]];
    let twice = 0;
    corners.forEach(([x1, y1], i) => { const [x2, y2] = corners[(i + 1) % 4]; twice += x1 * y2 - x2 * y1; });
    assert.equal(step.answer, twice / 2 + 0);
    assert.deepEqual(valuesIn(step.hints[0]).map((n) => n + 0), [a * d + 0, b * c + 0]);
    for (const [value] of step.wrong) {
      const shown = step.wrong.find(([w]) => w === value)[1];
      if (/\*\*subtracted\*\*/.test(shown)) assert.equal(valuesIn(shown)[0] + 0, value);
      if (/along the rows/.test(shown)) assert.deepEqual(valuesIn(shown).map((n) => n + 0), [a * b + 0, c * d + 0]);
    }
  });
  eachVariant('determinants-inverses', 'inverse', (step) => {
    const [m] = matricesIn(step.text);
    assert.equal(valuesIn(step.hints[0])[0] + 0, determinant(m));
    // the table of blanks is laid out like the matrix
    const lines = step.template.split('\n');
    assert.match(lines[0], /1st column \| 2nd column \|$/);
    assert.match(lines[2], /^\| top row \| \[\[-?\d+\]\] \| \[\[-?\d+\]\] \|$/);
    assert.match(lines[3], /^\| bottom row \| \[\[-?\d+\]\] \| \[\[-?\d+\]\] \|$/);
  });
  eachVariant('determinants-inverses', 'solve-system', (step) => {
    const [A] = matricesIn(step.hints[0]);
    const [t] = vectorsIn(step.hints[0]);
    const [inv] = matricesIn(step.hints[1]);
    assert.ok(sameMat(product(inv, A), I2) && sameMat(product(A, inv), I2));
    assert.deepEqual(act(inv, t), { x: blank(step, 0), y: blank(step, 1) }, 'A⁻¹t is the answer');
    // no other pair of whole numbers nearby solves it
    let found = 0;
    for (const x of ints(-30, 30)) for (const y of ints(-30, 30)) if (sameVec(act(A, { x, y }), t)) found++;
    assert.equal(found, 1);
  });
  eachVariant('eigenvectors', 'eigen-check', (step) => {
    const [A] = matricesIn(step.text);
    const [x, y] = valuesIn(step.hints[0]);
    assert.deepEqual([x + 0, y + 0], [blank(step, 0), blank(step, 1)], 'the first hint works out Av');
    // an eigenvalue is a root of λ² − (a + d)λ + (ad − bc)
    const lambda = blank(step, 2);
    assert.equal(lambda * lambda - (A[0][0] + A[1][1]) * lambda + determinant(A), 0);
    assert.ok((A[0][0] + A[1][1]) ** 2 - 4 * determinant(A) > 0, 'two different eigenvalues, so only two eigen-directions');
  });
});

test('review: products are taken in the stated order, by the lessons and by the widget', async () => {
  const { after } = await import('../src/widgets/matrix-grid.js');
  const asRows = (m) => [[m.a, m.b], [m.c, m.d]];
  const asState = (m) => ({ a: m[0][0], b: m[0][1], c: m[1][0], d: m[1][1] });
  // the widget's after(q, p) is "first p, then q"
  for (const [q, p] of [[TURN, SHEAR], [SHEAR, TURN], [[[2, 1], [0, -1]], [[1, 2], [3, 4]]]]) {
    const both = asRows(after(asState(q), asState(p)));
    for (const v of [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 3, y: -2 }]) assert.deepEqual(act(both, v), act(q, act(p, v)));
  }
  // pressing Shear and then Turn, as the widget applies presses, lands on the outline of "try-both"; the other order does not
  const both = rawStep('matrix-multiplication', 'try-both');
  const press = (ids) => asRows(ids.reduce((acc, id) => after(asState(both.widget.moves.find((mv) => mv.id === id).matrix), acc), asState(I2)));
  assert.ok(sameMat(press(['shear', 'turn']), both.widget.target));
  assert.ok(!sameMat(press(['turn', 'shear']), both.widget.target));
  assert.deepEqual(press(['shear', 'turn']), [[0, -1], [1, 1]]);
  // "undo": the learner's matrix acts after the shear that is already there
  const undo = rawStep('determinants-inverses', 'undo');
  assert.deepEqual(asRows(after(asState([[1, -1], [0, 1]]), asState(undo.widget.pre))), I2);

  // "which-order" with real matrices: the marked product does the two moves in the order asked, the other one does not
  const real = { 'quarter turn': [TURN], shear: [SHEAR], flip: [[[-1, 0], [0, 1]], [[1, 0], [0, -1]]], 'sideways stretch': [[[2, 0], [0, 1]], [[3, 0], [0, 1]]] };
  eachVariant('matrix-multiplication', 'which-order', (step) => {
    const named = /\$([A-Z])\$ is the matrix of a ([a-z ]+?), and \$([A-Z])\$ is the matrix of a ([a-z ]+?)\./.exec(step.text);
    const asked = /"first the ([a-z ]+?), then the ([a-z ]+?)"/.exec(step.text);
    const kindOf = { [named[1]]: named[2], [named[3]]: named[4] };
    for (const first of real[asked[1]]) for (const second of real[asked[2]]) {
      const pick = (letter) => (kindOf[letter] === asked[1] ? first : second);
      for (const o of step.options) {
        const letters = /^\$([A-Z])([A-Z])\$$/.exec(o.text);
        if (!letters) { assert.ok(!o.correct); continue; }
        const written = product(pick(letters[1]), pick(letters[2]));
        const does = [{ x: 1, y: 0 }, { x: 0, y: 1 }].every((v) => sameVec(act(written, v), act(second, act(first, v))));
        assert.equal(does, !!o.correct, `${o.text} for "first the ${asked[1]}, then the ${asked[2]}"`);
      }
    }
  });
});

test('review: settled states are where the story really ends up', () => {
  const size = { half: 2, 'a third': 3, 'a quarter': 4, 'a fifth': 5 };
  eachVariant('eigenvectors', 'steady-state', (step) => {
    const total = Number(/\*\*(\d+) [a-z ]+\*\*/.exec(step.text)[1]);
    const [m, n] = Array.from(step.text.matchAll(/\*\*(half|a third|a quarter|a fifth)\*\*/g), (x) => size[x[1]]);
    // play the story forward from three different starts: 1/m of the first place moves on, 1/n of the second moves back
    for (const start of [total, 0, total / 3]) {
      let here = start;
      let there = total - start;
      for (let i = 0; i < 400; i++) { const out = here / m; const back = there / n; here += back - out; there += out - back; }
      assert.ok(Math.abs(here - step.answer) < 1e-6, `the numbers settle at ${here}, not ${step.answer}`);
    }
  });
  // the bikes, day by day, as the figure's readouts show them (whole bikes)
  const bikes = fixed('eigenvectors', 'bikes');
  let north = 120;
  let south = 0;
  const days = [];
  for (let day = 1; day <= 6; day++) { const toSouth = north / 2; const toNorth = south / 4; north += toNorth - toSouth; south += toSouth - toNorth; days.push(`${Math.round(north)}/${Math.round(south)}`); }
  assert.deepEqual(days, ['60/60', '45/75', '41/79', '40/80', '40/80', '40/80'], 'the readouts stop moving after four or five days, as the hint says');
  assert.deepEqual(bikes.blanks.map((b) => b.numbers[0]), [40, 80]);
  assert.match(bikes.hints[0], /After about five days/);
});

test('review: eigenvalues of the matrices the last lesson shows', () => {
  /** Real eigenvalues from the characteristic equation λ² − (a + d)λ + (ad − bc) = 0, largest first; none when the roots are not real. */
  const eigenvalues = (m) => { const tr = m[0][0] + m[1][1]; const disc = tr * tr - 4 * determinant(m); return disc < 0 ? [] : [(tr + Math.sqrt(disc)) / 2, (tr - Math.sqrt(disc)) / 2]; };
  const direction = (m, l) => (Math.abs(m[0][1]) > 1e-12 ? { x: m[0][1], y: l - m[0][0] } : Math.abs(m[1][0]) > 1e-12 ? { x: l - m[1][1], y: m[1][0] } : (Math.abs(m[0][0] - l) < 1e-12 ? { x: 1, y: 0 } : { x: 0, y: 1 }));
  const along = (p, q) => Math.abs(cross(p, q)) < 1e-9;
  const spin = rawStep('eigenvectors', 'spin').widget.matrix;
  assert.deepEqual(eigenvalues(spin), [3, 1]);
  assert.ok(along(direction(spin, 3), { x: 1, y: 1 }) && along(direction(spin, 1), { x: 1, y: -1 }));
  const diag = rawStep('eigenvectors', 'diagonal').widget.matrix;
  assert.deepEqual(eigenvalues(diag), [2, -1]);
  assert.ok(along(direction(diag, 2), { x: 1, y: 0 }) && along(direction(diag, -1), { x: 0, y: 1 }));
  assert.deepEqual(eigenvalues(TURN), [], 'a quarter turn has no real eigenvalue');
  const grow = rawStep('eigenvectors', 'repeat').widget.matrix;
  assert.deepEqual(eigenvalues(grow), [1.5, 0.5]);
  assert.ok(along(direction(grow, 1.5), { x: 1, y: 1 }) && along(direction(grow, 0.5), { x: 1, y: -1 }));
  assert.match(rawStep('eigenvectors', 'repeat').text, /eigenvalue is 1\.5, along the other 0\.5/);
  const bikes = fixed('eigenvectors', 'bikes').figures[0].matrix;
  assert.deepEqual(eigenvalues(bikes), [1, 0.25]);
  assert.ok(along(direction(bikes, 1), { x: 40, y: 80 }));
  // the eigen-directions asked for lie exactly on the 15° stops of the turning arrow
  for (const m of [spin, diag]) for (const l of eigenvalues(m)) { const d = direction(m, l); const deg = (Math.atan2(d.y, d.x) * 180) / Math.PI; assert.ok(Math.abs(deg / 15 - Math.round(deg / 15)) < 1e-9); }
  // each turning step accepts both arrows of a line: v and −v
  for (const id of ['spin', 'second', 'diagonal']) {
    const step = rawStep('eigenvectors', id);
    for (const deg of ints(0, 345, 15)) {
      const v = onCircle(1, deg);
      const w = onCircle(1, (deg + 180) % 360);
      assert.equal(step.check(spinState(step.widget, v)) === true, step.check(spinState(step.widget, w)) === true, `${id}: ${deg}° and the opposite arrow`);
    }
  }
  // every generated matrix: the option marked right is the only one of the four on an eigen-direction
  eachVariant('eigenvectors', 'spot-eigenvector', (step) => {
    const [A] = matricesIn(step.text);
    const roots = eigenvalues(A);
    assert.equal(roots.length, 2);
    assert.notEqual(roots[0], roots[1]);
    for (const o of step.options) {
      const [w] = vectorsIn(o.text);
      const solves = roots.some((l) => Math.abs((A[0][0] - l) * w.x + A[0][1] * w.y) < 1e-9 && Math.abs(A[1][0] * w.x + (A[1][1] - l) * w.y) < 1e-9);
      assert.equal(solves, !!o.correct, `(A − λI)w = 0 for ${o.text}`);
    }
  });
});

test('review: numbers quoted in sentences, where no formula states them', () => {
  /** Points written in running text, "(−1, 1)" or "$(2, 0)$", in order. */
  const pointsIn = (text) => Array.from(text.matchAll(/\(([−-]?\d+(?:\.\d+)?), ([−-]?\d+(?:\.\d+)?)\)/g), (m) => ({ x: Number(m[1].replace('−', '-')), y: Number(m[2].replace('−', '-')) }));
  const col = (m, j) => ({ x: m[0][j], y: m[1][j] });
  /** The first matrix typeset in a text, whatever its entries are written with (fractions too). */
  const typeset = (text) => { const { blocks } = statementsOf(mathOf(text)[0]); return texValue('§0§', {}, blocks).a; };

  // lesson 1: the two drones
  const drones = fixed('vectors', 'hook');
  const legs = Array.from(drones.text.matchAll(/\*\*(\d+) km east and (\d+) km north\*\*/g), (m) => ({ x: Number(m[1]), y: Number(m[2]) }));
  const end = /finish (\d+) km east and (\d+) km north/.exec(drones.explain);
  assert.equal(legs.length, 2);
  assert.deepEqual({ x: Number(end[1]), y: Number(end[2]) }, add(legs[0], legs[1]));

  // lesson 2: the largest and the most negative dot product of an arrow of length 3 with one of length 4
  const swing = rawStep('dot-product', 'swing');
  const [su, sv] = swing.widget.vectors;
  const reach = ints(0, 345, sv.snapDeg).map((deg) => tidy(dot(su, onCircle(sv.circle, deg))));
  assert.match(swing.explain, new RegExp(String.raw`= ${Math.max(...reach)}\$[\s\S]*most negative value, \$${Math.min(...reach)}\$`));
  assert.match(swing.text, new RegExp(`keeps its length, ${sv.circle}, and can only turn\\. .* is ${Math.hypot(su.x, su.y)} long`));
  // the example taste in the explanation is the solution, scored against Ana and Ben
  const taste = rawStep('dot-product', 'taste');
  const [ana, ben] = taste.widget.vectors;
  assert.deepEqual(vectorsIn(taste.explain), [taste.solution.Y]);
  assert.deepEqual(valuesIn(taste.explain).filter((v) => typeof v === 'number').slice(0, 4), [dot(ana, taste.solution.Y), dot(ana, taste.solution.Y), dot(ben, taste.solution.Y), dot(ben, taste.solution.Y)]);
  assert.ok(taste.explain.includes(`$${ana.x} \\times ${taste.solution.Y.x} + ${ana.y} \\times`) && taste.explain.includes(`$(${ben.x}) \\times ${taste.solution.Y.x} + ${ben.y} \\times`), 'Ana\'s and Ben\'s own numbers are used');

  // lesson 3: what the feedback of the shear pictures says about each picture
  const shear = fixed('matrices-transform', 'shear');
  const [asked] = [SHEAR];
  for (const o of shear.options.filter((x) => !x.correct)) {
    const m = o.figure.matrix;
    const blue = /blue arrow (?:has moved to|ends at) (\([^)]+\))/.exec(o.why);
    const orange = /orange (?:arrow|one) ends at (\([^)]+\))/.exec(o.why);
    const first = /blue arrow stays at (\([^)]+\))/.exec(o.why);
    const second = /second column of the matrix is (\([^)]+\))/.exec(o.why);
    assert.ok(blue || orange, o.why);
    if (blue) assert.deepEqual(pointsIn(blue[1])[0], col(m, 0), o.why);
    if (orange) assert.deepEqual(pointsIn(orange[1])[0], col(m, 1), o.why);
    if (first) assert.deepEqual(pointsIn(first[1])[0], col(asked, 0), o.why);
    if (second) assert.deepEqual(pointsIn(second[1])[0], col(asked, 1), o.why);
    if (/orange one has stayed/.test(o.why)) assert.deepEqual(col(m, 1), { x: 0, y: 1 });
    if (/blue arrow does not move/.test(o.why)) assert.deepEqual(col(asked, 0), { x: 1, y: 0 });
  }
  assert.deepEqual(vectorsIn(shear.explain).pop(), col(asked, 1));

  // lesson 4: each basis arrow followed through the shear and then the turn, in the hint and in the feedback
  const one = rawStep('matrix-multiplication', 'one-matrix');
  const [from, mid, again, to] = pointsIn(one.hints[0]);
  assert.deepEqual([from, act(SHEAR, from), again, act(TURN, again)], [{ x: 0, y: 1 }, mid, mid, to]);
  const blueRight = one.check(gridState(one.widget, [[0, -1], [1, 0]]));
  assert.match(blueRight, /blue arrow is right/);
  assert.deepEqual(pointsIn(blueRight), [act(SHEAR, { x: 1, y: 0 }), act(TURN, act(SHEAR, { x: 1, y: 0 }))]);
  for (const said of [one.check(gridState(one.widget, [[1, -1], [0, 1]])), one.check(gridState(one.widget, [[1, 0], [0, 1]]))]) assert.deepEqual(pointsIn(said), [act(SHEAR, { x: 1, y: 0 })]);

  // lesson 5
  const flipped = rawStep('determinants-inverses', 'flip');
  assert.ok(flipped.explain.includes(`${colouredMatrix([[2, 0], [0, -1]])}$ that number is $${determinant([[2, 0], [0, -1]])}$`));
  const hook5 = fixed('determinants-inverses', 'hook');
  assert.ok(hook5.text.includes(colouredMatrix(hook5.figures[0].matrix)), 'the matrix in the question is the one drawn');
  const noUndo = fixed('determinants-inverses', 'no-undo');
  const A = noUndo.figures[0].matrix;
  assert.deepEqual(matricesIn(noUndo.text), [A]);
  const [t1, t2] = vectorsIn(noUndo.text);
  const [e1, e2, landing] = vectorsIn(noUndo.explain);
  assert.deepEqual([e1, e2], [t1, t2], 'the explanation is about the two arrows the question suggests');
  assert.deepEqual([act(A, e1), act(A, e2)], [landing, landing]);
  assert.notDeepEqual(e1, e2);
  const back = pointsIn(noUndo.options.find((o) => /stretches the line back out/.test(o.text)).why);
  assert.deepEqual(back, [landing, e1, e2]);
  const para = fixed('determinants-inverses', 'parallel');
  const P = para.figures[0].matrix;
  const [sent, lands] = vectorsIn(para.options.find((o) => /to the origin/.test(o.text)).why);
  assert.deepEqual(act(P, sent), lands);
  const [through] = vectorsIn(para.options.find((o) => /fractions/.test(o.text)).why);
  const [line, star] = vectorsIn(para.explain);
  assert.deepEqual([through, star], [line, para.figures[0].target]);
  for (const v of [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 3, y: -2 }]) assert.equal(cross(line, act(P, v)), 0);
  assert.notEqual(cross(line, star), 0);
  // the system written next to that matrix is the same system
  const eqs = Array.from(para.text.matchAll(/(\d*)x \+ (\d*)y &= (-?\d+)/g), (m) => [Number(m[1] || 1), Number(m[2] || 1), Number(m[3])]);
  assert.deepEqual(eqs.map((e) => [e[0], e[1]]), P);
  assert.deepEqual({ x: eqs[0][2], y: eqs[1][2] }, para.figures[0].target);
  const drag = rawStep('determinants-inverses', 'solve-drag');
  const moves = /to the right moves the green arrow (\d+) across and (\d+) up: the first column\. Each step up moves it (\d+) across and (\d+) up: the second column/.exec(drag.hints[0]);
  assert.ok(moves, 'the hint says what one step of v does');
  assert.deepEqual([{ x: Number(moves[1]), y: Number(moves[2]) }, { x: Number(moves[3]), y: Number(moves[4]) }], [col(drag.widget.matrix, 0), col(drag.widget.matrix, 1)]);
  const sys = Array.from(drag.text.matchAll(/(\d*)x \+ (\d*)y &= (-?\d+)/g), (m) => [Number(m[1] || 1), Number(m[2] || 1), Number(m[3])]);
  assert.deepEqual(sys.map((e) => [e[0], e[1]]), drag.widget.matrix, 'the equations and the matrix are the same system');
  assert.deepEqual({ x: sys[0][2], y: sys[1][2] }, drag.widget.target);
  // the inverse of the shear, quoted on the screen that puts the formula to work (it moved there from the formula screen)
  const [quoted] = matricesIn(rawStep('determinants-inverses', 'example-inverse').text);
  assert.ok(sameMat(product(quoted, SHEAR), I2) && sameMat(product(SHEAR, quoted), I2));
  assert.deepEqual(quoted, [[SHEAR[1][1], -SHEAR[0][1]], [-SHEAR[1][0] + 0, SHEAR[0][0]]], 'swap a and d, change the signs of b and c; the determinant is 1');
  assert.equal(determinant(SHEAR), 1);

  // lesson 6
  const nameIt = rawStep('eigenvectors', 'name-it');
  const [E] = matricesIn(nameIt.text);
  const lambda = Number(/eigenvector with eigenvalue (-?\d+)/.exec(nameIt.text)[1]);
  const onLine = vectorsIn(nameIt.text);
  assert.equal(onLine.length, 3);
  for (const v of onLine) assert.deepEqual(act(E, v), times(lambda, v), 'every arrow named on that line is stretched by the eigenvalue');
  const second = rawStep('eigenvectors', 'second');
  const quotedValues = Array.from(second.text.matchAll(/eigenvalue (-?\d+)/g), (m) => Number(m[1]));
  const tr = E[0][0] + E[1][1];
  for (const l of quotedValues.slice(0, 2)) assert.equal(l * l - tr * l + determinant(E), 0, `${l} is an eigenvalue`);
  assert.deepEqual(quotedValues.slice(0, 2).sort(), [1, 3]);
  const diag = rawStep('eigenvectors', 'diagonal');
  const here = /here (-?\d+) and \$(-?\d+)\$/.exec(diag.explain);
  assert.deepEqual([Number(here[1]), Number(here[2])], [diag.widget.matrix[0][0], diag.widget.matrix[1][1]]);
  assert.ok(diag.widget.matrix[0][1] === 0 && diag.widget.matrix[1][0] === 0);
  const rep = rawStep('eigenvectors', 'repeat');
  const parts = /part along \$(.+?)\$ by ([\d.]+) and the part along \$(.+?)\$ by ([\d.]+)\./.exec(rep.explain);
  for (const [tex, factor] of [[parts[1], parts[2]], [parts[3], parts[4]]]) { const [v] = vectorsIn(tex); assert.deepEqual(act(rep.widget.matrix, v), times(Number(factor), v)); }
  assert.deepEqual(matricesIn(rep.text), [rep.widget.matrix]);
  // the bikes: the story, the matrix as it is typeset (twice) and the matrix the figure uses all agree
  const bikes = fixed('eigenvectors', 'bikes');
  const size = { half: 1 / 2, 'a quarter': 1 / 4 };
  const story = /\*\*(half|a quarter)\*\* of the bikes at North\s+end the day at South, and \*\*(half|a quarter)\*\* of the bikes at South end the day at North/.exec(bikes.text);
  const [toSouth, toNorth] = [size[story[1]], size[story[2]]];
  const fromStory = [[1 - toSouth, toNorth], [toSouth, 1 - toNorth]];   // rows: North, South; columns: from North, from South
  assert.deepEqual(typeset(bikes.text), fromStory);
  assert.deepEqual(typeset(bikes.explain), fromStory);
  assert.deepEqual(bikes.figures[0].matrix, fromStory);
  assert.match(bikes.text, /\\begin\{pmatrix\} \\text\{North\} \\\\ \\text\{South\} \\end\{pmatrix\}/, 'North is the top number');
  assert.deepEqual([bikes.figures[0].xLabel, bikes.figures[0].parts], ['bikes at North', ['North', 'South']]);
  const total = Number(/has (\d+) shared bikes/.exec(bikes.text)[1]);
  assert.deepEqual(bikes.figures[0].v, { x: total, y: 0 }, 'all bikes start at North');
  assert.equal(blank(bikes, 0) + blank(bikes, 1), total);
  const each = Number(/(\d+) bikes go each way every day/.exec(bikes.explain)[1]);
  assert.deepEqual([blank(bikes, 0) * toSouth, blank(bikes, 1) * toNorth], [each, each]);
  const other = valuesIn(/other eigenvalue of this\s+matrix is (\$[^$]+\$)/.exec(bikes.explain)[1])[0];
  assert.equal(other, fromStory[0][0] + fromStory[1][1] - 1, 'the two eigenvalues add up to the trace, and one of them is 1');
  assert.deepEqual(act(fromStory, { x: 1, y: -1 }), times(other, { x: 1, y: -1 }));
  // ten applications of a matrix with eigenvalue 3
  const model = rawStep('eigenvectors', 'reflect').model;
  const power = /\$3\^\{(\d+)\}\$, which is\s+([\d ]+\d)/.exec(model);
  assert.equal(Number(power[2].replace(/ /g, '')), 3 ** Number(power[1]));
  assert.match(rawStep('eigenvectors', 'reflect').text, /applied ten times/);
  assert.equal(Number(power[1]), 10);
});

test('review: advice in feedback points the right way for every state that triggers it', () => {
  // explore: "twice as wide, but not twice as tall" is said for heights 1, 3 and 4, so the advice cannot be "stretch"
  const explore = rawStep('matrices-transform', 'explore');
  for (const other of [1, 3, 4]) {
    const tall = explore.check(gridState(explore.widget, [[2, 0], [0, other]]));
    assert.match(tall, /twice as wide, but not twice as tall\. Make the orange arrow 2 long as well\.$/);
    const wide = explore.check(gridState(explore.widget, [[other, 0], [0, 2]]));
    assert.match(wide, /twice as tall, but not twice as wide\. Make the blue arrow 2 long as well\.$/);
  }
  for (const m of allMatrices(4)) { const said = explore.check(gridState(explore.widget, m)); if (typeof said === 'string' && /Stretch/.test(said)) assert.fail(`"${said}" for ${JSON.stringify(m)}`); }
  // taste: wherever "move to the right" is said, moving right (and nothing else) does lead to an accepted taste
  const taste = rawStep('dot-product', 'taste');
  let told = 0;
  for (const p of gridPoints(taste.widget)) {
    if (!/move to the right/.test(String(taste.check(planeState(taste.widget, { Y: p }))))) continue;
    told++;
    assert.ok(ints(p.x + 1, 3).some((x) => taste.check(planeState(taste.widget, { Y: { x, y: p.y } })) === true), `from ${p.x},${p.y}`);
  }
  assert.ok(told > 5);
  // reach: "change only b" / "change only a" really is enough
  const reach = rawStep('vectors', 'reach');
  for (const a of ints(-3, 3)) for (const b of ints(-3, 3)) {
    const said = String(reach.check(planeState(reach.widget, {}, { a, b })));
    if (/change only \$b\$/.test(said)) assert.ok(ints(-3, 3).some((b2) => reach.check(planeState(reach.widget, {}, { a, b: b2 })) === true));
    if (/change only \$a\$/.test(said)) assert.ok(ints(-3, 3).some((a2) => reach.check(planeState(reach.widget, {}, { a: a2, b })) === true));
  }
  // mirror and undo: "leave the orange arrow where it started", "leave the blue arrow where it is" describe the accepted matrix
  const mirror = rawStep('matrices-transform', 'mirror');
  assert.deepEqual([mirror.solution.b, mirror.solution.d], [0, 1]);
  const undo = rawStep('determinants-inverses', 'undo');
  assert.deepEqual([undo.solution.a, undo.solution.c], [1, 0]);
  assert.ok(undo.solution.b < 0, 'the top slides back to the left');
});

test('review: a product shown with rounded numbers is not written as an exact equality', async () => {
  // eigen-spin writes "A v = Av" under the picture; on the 15° stops most entries are rounded to two decimals
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../src/widgets/eigen-spin.js', import.meta.url), 'utf8');
  assert.match(source, /exact \? '=' : '\\\\approx'/);
  // why it matters: at 45° the widget shows (0.71, 0.71) and (2.12, 2.12), and 2 × 0.71 + 0.71 is 2.13
  const v = onCircle(1, 45);
  const shown = (n) => Math.round(n * 100) / 100;
  assert.notEqual(shown(2 * shown(v.x) + shown(v.y)), shown(2 * v.x + v.y));
});

/* ===================================================== teach before you ask */

/** The teaching screens added so that each lesson shows a thing before it asks for it. */
const TEACHING = {
  vectors: ['teach-vector', 'teach-scalar', 'teach-combination', 'teach-length', 'example-find-combo'],
  'dot-product': ['teach-dot', 'example-perpendicular', 'teach-similarity'],
  'matrices-transform': ['teach-machine', 'example-apply'],
  'matrix-multiplication': ['teach-two-moves', 'teach-right-to-left', 'example-product', 'teach-identity'],
  'determinants-inverses': ['teach-area', 'example-determinant', 'example-inverse', 'example-solve'],
  eigenvectors: ['teach-off-line', 'example-eigen-check', 'example-settled'],
};
const EXAMPLE = ':::example';
/**
 * [teaching screen, the step it serves, what the screen has to say for that step, the discovery it follows (optional)].
 * A screen that names a rule found on a widget comes after the discovery and before the first step that uses the rule.
 */
const SERVES = {
  vectors: [
    ['teach-vector', 'draw', ['**vector**', 'across number on top', '**left**', '**down**', '**origin**']],
    ['name-it', 'add-vectors', [EXAMPLE, 'add row by row', 'Top row', 'Bottom row'], 'tip-to-tail'],
    ['teach-scalar', 'scale-vector', [EXAMPLE, '**scalar**', 'Multiply **both** numbers', 'turns round'], 'scale'],
    ['teach-scalar', 'match-ops', ['$-\\mathbf{v}$ is short for $-1 \\times \\mathbf{v}$']],
    ['teach-combination', 'combine', [EXAMPLE, '**combination**', '**scale each vector first**', 'subtract row by row'], 'reach'],
    ['teach-length', 'length', [EXAMPLE, 'Pythagoras', '|\\mathbf{v}| = \\sqrt{x^2 + y^2}', 'squaring removes it']],
    ['example-find-combo', 'find-combo', [EXAMPLE, 'Top row', 'Bottom row', 'Add the two equations']],
  ],
  'dot-product': [
    ['teach-dot', 'compute', [EXAMPLE, '**dot product**', 'top by top, bottom by bottom', 'single **number**']],
    ['teach-dot', 'truths', ['order makes no difference']],
    ['name-it', 'angle-kind', [EXAMPLE, 'under 90°', 'over 90°', 'positive', 'zero', 'negative'], 'swing'],
    ['cosine', 'direction-only', ['1 when the arrows point the same way'], 'shadow'],
    ['example-perpendicular', 'make-perpendicular', [EXAMPLE, 'Perpendicular means a dot product of 0', 'Check:']],
    ['teach-similarity', 'direction-only', ['**cosine similarity**', 'divide the dot product by both lengths', 'point the same way']],
  ],
  'matrices-transform': [
    ['teach-machine', 'explore', ['marked 1st', '2nd', 'rides along on it']],
    ['name-it', 'read-matrix', ['**matrix**', '[first column]{.blue}', '[second column]{.orange}', '**column by column**', '**basis arrows**'], 'mirror'],
    ['name-it', 'no-slide', ['origin stays put', '**transformation**']],
    ['rule', 'apply-matrix', ['**entry**', '\\mathord{2 \\times 2}', '**dot product**'], 'mat-vec'],
    ['example-apply', 'apply-matrix', [EXAMPLE, '**By columns:**', '**By rows**']],
  ],
  'matrix-multiplication': [
    ['teach-two-moves', 'try-both', ['**Turn**', '**Shear**', '**Start again**']],
    ['product', 'right-to-left', ['**product**', 'after **both** moves'], 'one-matrix'],
    ['teach-right-to-left', 'right-to-left', ['**first** $B$, **then** $A$', 'from right to left', 'shoes(socks(foot))']],
    ['teach-right-to-left', 'which-order', ['**first** $B$, **then** $A$']],
    ['example-product', 'columns', [EXAMPLE, 'The first column of $AB$ is $A$ times the first column of $B$', 'Side by side']],
    ['example-product', 'multiply', [EXAMPLE, 'First column', 'Second column']],
    ['teach-identity', 'truths', ['**identity matrix**', '$AI = A$ and $IA = A$'], 'identity'],
  ],
  'determinants-inverses': [
    ['teach-area', 'squash', ['**unit square**', 'multiplies **every** area']],
    ['name-it', 'determinant', ['**determinant**', 'Negative: shapes are mirrored', 'squashed onto a line'], 'flip'],
    ['example-determinant', 'determinant', [EXAMPLE, 'two diagonals', 'subtract']],
    ['example-determinant', 'what-it-does', ['**size**', '**minus sign**', 'mirrored']],
    ['formula', 'inverse', ['**inverse**', '$A^{-1}$', 'determinant is **not zero**', '**Swap**', '**Change the signs**', '**Divide**'], 'no-undo'],
    ['formula', 'sort', ['determinant is **not zero**']],
    ['example-inverse', 'inverse', [EXAMPLE, 'Determinant:', 'Swap', 'Divide every entry']],
    ['example-solve', 'solve-system', [EXAMPLE, 'Read off the matrix and the target', 'Find the inverse', 'Apply it to the target'], 'solve-drag'],
  ],
  eigenvectors: [
    ['teach-off-line', 'spin', ['test arrow', 'where the matrix sends it', 'multiple of']],
    ['name-it', 'second', ['**eigenvector**', '**eigenvalue**', 'A\\mathbf{v} = \\lambda\\,\\mathbf{v}'], 'spin'],
    ['example-eigen-check', 'eigen-check', [EXAMPLE, 'Multiply', 'Compare', 'eigenvalue 2']],
    ['example-eigen-check', 'spot-eigenvector', ['does not come out as a multiple of itself', '**negative**']],
    ['example-settled', 'steady-state', [EXAMPLE, '**Settled** means', 'ratio 2 to 4', 'eigenvalue 1'], 'bikes'],
  ],
};

test('every lesson: teach before you ask', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const id of LESSONS) {
    const steps = lessons[id].steps.map((raw) => fixed(id, raw.id));      // resolved, as the player sees them
    const roles = steps.map(role);
    const at = (stepId) => { const i = steps.findIndex((s) => s.id === stepId); assert.ok(i >= 0, `${id} has a step "${stepId}"`); return i; };
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    assert.ok(roles.filter((kind) => kind === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'teach').length <= 6, `${id}: no more than six teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const stepId of TEACHING[id]) {
      const step = steps[at(stepId)];
      assert.equal(step.type, 'info', `${id}: "${stepId}" is a teaching screen`);
      assert.ok(roles.indexOf('graded', at(stepId) + 1) > 0, `${id}/${stepId} is followed by a question`);
      assert.ok(SERVES[id].some(([teach]) => teach === stepId), `${id}/${stepId} is pinned to the step it serves`);
    }
    for (const [teach, ask, says, after] of SERVES[id]) {
      assert.equal(steps[at(teach)].type, 'info', `${id}/${teach} is a teaching screen`);
      assert.ok(at(teach) < at(ask), `${id}: "${teach}" comes before "${ask}"`);
      if (after) assert.ok(at(after) < at(teach), `${id}: "${teach}" names what "${after}" let the learner find, so it comes after it`);
      for (const phrase of says) assert.ok(steps[at(teach)].text.includes(phrase), `${id}/${teach} says "${phrase}", which "${ask}" needs`);
    }
    // review steps come back alone, weeks later: each still explains itself
    for (const step of steps.filter((s) => s.review)) assert.ok(step.explain, `${id}/${step.id}`);
  }
});

test('teach before you ask: no generated question repeats the worked example in front of it', () => {
  /** What stands between ":::example" and its closing ":::" on a teaching screen. */
  const exampleOf = (step) => { const m = /:::example([\s\S]*?)\n\s*:::/.exec(step.text); return m ? m[1] : ''; };
  const arrow = (v) => ({ x: v.x, y: v.y });
  const scaled = (text) => [Number(/(-?\d+)\\,\\begin\{pmatrix\}/.exec(text)[1]), vectorsIn(text)[0]];
  const twoVectors = [(s, ex) => vectorsIn(ex).slice(0, 2), (q) => vectorsIn(q.text).slice(0, 2)];
  const twoMatrices = [(s, ex) => matricesIn(ex).slice(0, 2), (q) => matricesIn(q.text).slice(0, 2)];
  const oneMatrix = [(s, ex) => matricesIn(ex)[0], (q) => matricesIn(q.text)[0]];
  const drawnMatrix = [(s) => s.figures[0].matrix, (q) => matricesIn(q.text)[0]];
  // [lesson, teaching screen, generated step, the numbers of the worked example, the same numbers of a question]
  const pairs = [
    ['vectors', 'name-it', 'add-vectors', ...twoVectors],
    ['vectors', 'teach-scalar', 'scale-vector', (s, ex) => scaled(ex), (q) => scaled(q.text)],
    ['vectors', 'teach-combination', 'combine', ...twoVectors],
    ['vectors', 'teach-length', 'length', (s) => arrow(s.figures[0].vectors[0]), (q) => vectorsIn(q.text)[0]],
    ['vectors', 'example-find-combo', 'find-combo', (s, ex) => vectorsIn(ex)[2], (q) => vectorsIn(q.text)[2]],
    ['dot-product', 'teach-dot', 'dot-compute', ...twoVectors],
    ['dot-product', 'teach-dot', 'angle-kind', ...twoVectors],
    ['dot-product', 'name-it', 'angle-kind', (s) => s.figures[0].vectors.map(arrow), (q) => vectorsIn(q.text).slice(0, 2)],
    ['dot-product', 'example-perpendicular', 'make-perpendicular', (s, ex) => vectorsIn(ex)[0], (q) => vectorsIn(q.text)[0]],
    ['matrices-transform', 'name-it', 'read-matrix', (s) => s.figures[0].matrix, (q) => q.figures[0].matrix],
    ['matrices-transform', 'example-apply', 'apply-matrix', (s, ex) => vectorsIn(ex)[0], (q) => vectorsIn(q.text)[0]],
    ['matrix-multiplication', 'example-product', 'multiply', ...twoMatrices],
    ['matrix-multiplication', 'example-product', 'which-product', ...twoMatrices],
    ['determinants-inverses', 'example-determinant', 'determinant', ...drawnMatrix],
    ['determinants-inverses', 'example-determinant', 'what-it-does', ...drawnMatrix],
    ['determinants-inverses', 'example-inverse', 'inverse', ...oneMatrix],
    ['determinants-inverses', 'example-solve', 'solve-system', (s, ex) => matricesIn(ex)[0], (q) => matricesIn(q.hints[0])[0]],
    ['eigenvectors', 'example-eigen-check', 'eigen-check', ...oneMatrix],
    ['eigenvectors', 'example-eigen-check', 'spot-eigenvector', ...oneMatrix],
  ];
  for (const [lessonId, teach, ask, ofExample, ofQuestion] of pairs) {
    const order = lessons[lessonId].steps.map((s) => s.id);
    assert.ok(order.indexOf(teach) >= 0 && order.indexOf(teach) < order.indexOf(ask), `${lessonId}: "${teach}" comes before "${ask}"`);
    const screen = fixed(lessonId, teach);
    const shown = ofExample(screen, exampleOf(screen));
    assert.ok(shown !== undefined && JSON.stringify(shown) !== '[]' && !JSON.stringify(shown).includes('null'), `${lessonId}/${teach} shows a worked example with numbers`);
    const raw = rawStep(lessonId, ask);
    assert.equal(typeof raw.gen, 'function', `${lessonId}/${ask} is generated`);
    for (let seed = 1; seed <= SEEDS; seed++) {
      const step = resolveStep(raw, makeRng(seed * 31337 + 7), ask);
      assert.notDeepEqual(ofQuestion(step), shown, `${lessonId}/${ask} (seed ${seed}) repeats the worked example of "${teach}"`);
    }
  }
  // the settled bikes are worked through on a teaching screen: the story that follows never has the same numbers
  const settled = fixed('eigenvectors', 'example-settled').text;
  const bikes = fixed('eigenvectors', 'bikes');
  assert.ok(settled.includes(`North has $2 \\times 20 = ${blank(bikes, 0)}$ and South has $4 \\times 20 = ${blank(bikes, 1)}$`), 'the worked example ends on the numbers the figure settles on');
  assert.ok(settled.includes(`for ${blank(bikes, 0) + blank(bikes, 1)} bikes`));
  const story = rawStep('eigenvectors', 'steady-state');
  for (let seed = 1; seed <= 4 * SEEDS; seed++) {
    const step = resolveStep(story, makeRng(seed * 31337 + 7), 'steady-state');
    const total = Number(/\*\*(\d+) [a-z ]+\*\*/.exec(step.text)[1]);
    const parts = Array.from(step.text.matchAll(/\*\*(half|a third|a quarter|a fifth)\*\*/g), (x) => x[1]);
    assert.ok(!(total === 120 && parts[0] === 'half' && parts[1] === 'a quarter'), `steady-state (seed ${seed}) repeats the bikes`);
  }
});

test('teach before you ask: the worked examples are right, and the moves a question names have been met', () => {
  // lesson 1: the length example is a whole-number triangle the "length" step never draws, and the combination example lands where its picture does
  const len = fixed('vectors', 'teach-length');
  const v = len.figures[0].vectors[0];
  assert.equal(Math.hypot(v.x, v.y), 20);
  assert.ok(len.text.includes(`$(${v.x})^2 = ${v.x * v.x}$ and $${v.y}^2 = ${v.y * v.y}$`) && len.text.includes('\\sqrt{400} = 20'));
  const comb = fixed('vectors', 'teach-combination');
  const [cu, cv] = comb.figures[0].vectors;
  const { a, b } = comb.figures[0].combo;
  assert.deepEqual(vectorsIn(comb.text).slice(0, 2), [{ x: cu.x, y: cu.y }, { x: cv.x, y: cv.y }], 'the picture shows the two vectors of the example');
  assert.deepEqual(vectorsIn(comb.text).pop(), add(times(a.value, cu), times(b.value, cv)));
  assert.ok(b.value < 0, 'the example shows a subtraction, which "combine" asks for half the time');
  const sum = fixed('vectors', 'name-it');
  const [su, sv] = sum.figures[0].vectors;
  assert.deepEqual(vectorsIn(sum.text), [{ x: su.x, y: su.y }, { x: sv.x, y: sv.y }, add(su, sv)]);
  // lesson 2: the pictures of the two examples show what the text works out
  const kind = fixed('dot-product', 'name-it');
  assert.ok(kind.text.includes(`= ${dot(...kind.figures[0].vectors)}$. That is negative`) && dot(...kind.figures[0].vectors) < 0);
  const perp = fixed('dot-product', 'example-perpendicular');
  assert.equal(dot(...perp.figures[0].vectors), 0);
  assert.ok(perp.text.includes(`$t = ${perp.figures[0].vectors[1].y}$`));
  // lesson 3: the example multiplies the matrix whose columns are drawn, and both readings agree
  const app = fixed('matrices-transform', 'example-apply');
  const [p, q] = app.figures[0].vectors;
  const M = [[p.x, q.x], [p.y, q.y]];
  assert.ok(app.text.includes(colouredMatrix(M)));
  const [by] = vectorsIn(app.text);
  assert.deepEqual([app.figures[0].combo.a.value, app.figures[0].combo.b.value], [by.x, by.y]);
  assert.deepEqual(vectorsIn(app.text).pop(), act(M, by));
  assert.ok(app.text.includes(`= ${act(M, by).x}$`) && app.text.includes(`= ${act(M, by).y}$`), 'row by row gives the same two numbers');
  // lesson 4: the worked product, and the two moves on the buttons
  const prod = fixed('matrix-multiplication', 'example-product');
  const [A, B, AB] = matricesIn(prod.text);
  assert.deepEqual(AB, product(A, B));
  assert.ok(!sameMat(product(A, B), product(B, A)));
  const two = fixed('matrix-multiplication', 'teach-two-moves');
  assert.ok(two.text.includes(colouredMatrix(TURN)) && two.text.includes(colouredMatrix(SHEAR)));
  assert.deepEqual(two.figures[0].moves.map((m) => m.matrix), [TURN, SHEAR]);
  // every move that "which-order" can name was met in the lesson before
  const met = { 'quarter turn': /quarter turn/i, shear: /\bshear\b/i, flip: /\bflip/i, 'sideways stretch': /stretche?s? sideways/i };
  const earlier = lessons['matrices-transform'].steps.map((raw) => stringsOf(fixed('matrices-transform', raw.id)).join(' ')).join(' ');
  const named = new Set();
  for (let seed = 1; seed <= SEEDS; seed++) {
    const step = resolveStep(rawStep('matrix-multiplication', 'which-order'), makeRng(seed * 31337 + 7), 'which-order');
    for (const m of step.text.matchAll(/is the matrix of a ([a-z ]+?)[,.]/g)) named.add(m[1]);
  }
  assert.deepEqual([...named].sort(), Object.keys(met).sort());
  for (const name of named) assert.match(earlier, met[name], `"${name}" appears in the lesson on transformations`);
  // lesson 5: the three worked examples
  const dEx = fixed('determinants-inverses', 'example-determinant');
  assert.ok(dEx.text.includes(colouredMatrix(dEx.figures[0].matrix)) && dEx.text.includes(`= ${determinant(dEx.figures[0].matrix)} \\end{aligned}`));
  assert.ok(determinant(dEx.figures[0].matrix) < 0, 'the example shows a negative determinant, so that "mirrored" is read off it');
  const area = fixed('determinants-inverses', 'teach-area');
  assert.ok(area.text.includes(colouredMatrix(area.figures[0].matrix)) && area.text.includes(`area by ${determinant(area.figures[0].matrix)},`));
  assert.equal(area.figures[0].matrix[1][0], 0, 'the base of the parallelogram lies along the axis, so "base times height" can be read off');
  const inv = fixed('determinants-inverses', 'example-inverse');
  const [, E, swapped, Einv] = matricesIn(inv.text);
  assert.deepEqual(swapped, [[E[1][1], -E[0][1]], [-E[1][0], E[0][0]]]);
  assert.ok(sameMat(product(Einv, E), I2) && sameMat(product(E, Einv), I2) && determinant(E) === -1);
  const solve = fixed('determinants-inverses', 'example-solve');
  const [SA, SAinv] = matricesIn(solve.text);
  const [t, , x] = vectorsIn(solve.text);
  assert.deepEqual([SA, SAinv], [E, Einv], 'the system uses the matrix whose inverse was just worked out');
  assert.deepEqual(act(SA, x), t);
  // lesson 6: the tested arrow is an eigenvector that "eigen-check" cannot draw
  const eig = fixed('eigenvectors', 'example-eigen-check');
  const [EA] = matricesIn(eig.text);
  const [ev, out] = vectorsIn(eig.text);
  assert.deepEqual(eig.figures[0].matrix, EA);
  assert.deepEqual({ x: eig.figures[0].v.x, y: eig.figures[0].v.y }, ev);
  assert.deepEqual(out, act(EA, ev));
  assert.deepEqual(out, times(2, ev));
  const off = fixed('eigenvectors', 'teach-off-line');
  const [OA] = matricesIn(off.text);
  assert.deepEqual(OA, off.figures[0].matrix);
  assert.notEqual(cross(off.figures[0].v, act(OA, off.figures[0].v)), 0, 'the arrow shown really is knocked off its line');
});

test('every generated step of the course is re-derived in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.slice().sort(), GENERATED[id].slice().sort(), `${id}: the GENERATED list is complete and current`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} has a test`);
  }
});
