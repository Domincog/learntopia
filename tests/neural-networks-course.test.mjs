/**
 * Inside Neural Networks: independent checks.
 *
 * Every number a lesson quotes (softmax outputs, losses, gradients, attention
 * weights, training curves) is worked out again here with code that shares
 * nothing with the lessons, the course helpers or the widgets: gradients by
 * finite differences, softmax from Math.exp, training by a second
 * implementation. Every generated step is run with many seeds and re-solved
 * from the text the learner sees. Every interactive check is tried on the
 * states its widget can reach.
 *
 *   node --test tests/neural-networks-course.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { compile, equivalent } from '../src/core/mathexpr.js';
import course from '../content/courses/neural-networks/course.js';
import * as H from '../content/courses/neural-networks/helpers.js';
import { CAT_SENTENCES } from '../content/courses/ai/helpers.js';
import { hingeSum, fitHinges, largestGap } from '../src/widgets/relu-builder.js';
import { softmax as widgetSoftmax } from '../src/widgets/softmax-bars.js';
import { forward as widgetForward, backward as widgetBackward, descend as widgetDescend } from '../src/widgets/backprop-net.js';
import { trainRun, summarize, TRAIN, VALIDATION } from '../src/widgets/loss-curves.js';
import { WORDS as WIDGET_WORDS, rank as widgetRank, nearestTo } from '../src/widgets/word-map.js';
import { attend } from '../src/widgets/attention-grid.js';

const SEEDS = 240;
const LESSONS = course.chapters.flatMap((c) => c.lessons.map((l) => l.id));
/** Every generated step of the course. Each one is re-solved by a test below; a guard keeps this list complete. */
const GENERATED = {
  'activation-functions': ['compose-gen', 'relu-neuron', 'hinge-sum'],
  'scores-to-probabilities': ['softmax-gen', 'shift', 'loss-halving'],
  backpropagation: ['chain-gen', 'one-weight'],
  'training-in-practice': ['epoch-count', 'early-stop-gen'],
  embeddings: ['cosine-gen', 'table-size'],
  attention: ['mix-gen', 'weight-gen'],
};
const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/neural-networks/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, 'neural-networks', id);
}
const tested = new Set();
const raw = (lessonId, stepId) => {
  const step = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(step, `${lessonId} has a step "${stepId}"`);
  return step;
};
const fixed = (lessonId, stepId) => resolveStep(raw(lessonId, stepId), makeRng(1), stepId);
/** Run a step's generator with many seeds and hand each concrete step to `verify`. */
function eachVariant(lessonId, stepId, verify) {
  const step = raw(lessonId, stepId);
  assert.equal(typeof step.gen, 'function', `${lessonId}/${stepId} is generated`);
  assert.ok(GENERATED[lessonId].includes(stepId), `${lessonId}/${stepId} is listed in GENERATED`);
  tested.add(`${lessonId}/${stepId}`);
  for (let seed = 1; seed <= SEEDS; seed++) {
    const s = resolveStep(step, makeRng(seed * 7919 + 13), stepId);
    try { verify(s); } catch (err) { err.message = `${lessonId}/${stepId} (seed ${seed}): ${err.message}\n  text: ${s.text.replace(/\s+/g, ' ').trim()}`; throw err; }
  }
}

/* ---------------------------------------------------------------- helpers */
const N = (str) => Number(String(str).replace(/[−–]/g, '-').replace(/,/g, '').replace(/\{|\}/g, ''));
const bolds = (text) => Array.from(text.matchAll(/\*\*([^*]+)\*\*/g), (m) => m[1]);
/** The bold phrases that contain a number ("**2,000 examples**"), as numbers. */
const boldNumbers = (text) => bolds(text).filter((b) => /\d/.test(b)).map((b) => N(/[−-]?[\d,.]*\d/.exec(b)[0]));
const vectorsIn = (text) => Array.from(text.matchAll(/\\begin\{pmatrix\}\s*(-?[\d.]+)\s*\\\\\s*(-?[\d.]+)\s*\\end\{pmatrix\}/g), (m) => [Number(m[1]), Number(m[2])]);
const near = (a, b, tol = 1e-9, msg = 'values differ') => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
const round = (v, places = 2) => Math.round(v * 10 ** places) / 10 ** places;
const range = (lo, hi, by = 1) => { const out = []; for (let i = 0; lo + i * by <= hi + 1e-9; i++) out.push(Math.round((lo + i * by) * 1e6) / 1e6); return out; };
const blankNumber = (step, i) => { assert.ok(step.blanks[i].numeric, `blank ${i} is a number`); return step.blanks[i].numbers[0]; };
/** A table row "| a | b | c |" as trimmed cells. */
const cells = (line) => line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
const tableRows = (text) => text.split('\n').filter((l) => /^\s*\|/.test(l) && !/^\s*\|[\s:|-]+\|\s*$/.test(l)).map(cells);
const relu = (v) => (v > 0 ? v : 0);
/** Softmax written out from scratch. */
function softmaxOf(scores, base = Math.E, temperature = 1) {
  const powers = scores.map((v) => Math.pow(base, v / temperature));
  let total = 0;
  for (const p of powers) total += p;
  return powers.map((p) => p / total);
}
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const norm = (a) => Math.sqrt(a[0] * a[0] + a[1] * a[1]);
const distance = (a, b) => norm([a[0] - b[0], a[1] - b[1]]);
/** Central finite difference. */
const slope = (f, x, eps = 1e-6) => (f(x + eps) - f(x - eps)) / (2 * eps);

/* ------------------------------------------------------- the whole course */

test('six lessons of 11 to 18 steps, each with 2 to 4 review steps, at least two hands-on steps, a recap and a teaser', () => {
  assert.deepEqual(LESSONS, ['activation-functions', 'scores-to-probabilities', 'backpropagation', 'training-in-practice', 'embeddings', 'attention']);
  for (const id of LESSONS) {
    const { steps, recap, next } = lessons[id];
    // 11 to 14 before the teaching screens of "teach before you ask" were added; 18 is the authoring guide's ceiling
    assert.ok(steps.length >= 11 && steps.length <= 18, `${id} has ${steps.length} steps`);
    const reviews = steps.filter((s) => s.review).length;
    assert.ok(reviews >= 2 && reviews <= 4, `${id} has ${reviews} review steps`);
    const handsOn = steps.filter((s) => s.type === 'interact' || [].concat(s.figure || []).some((f) => !f.static && f.type !== 'svg')).length;
    assert.ok(handsOn >= 2, `${id} has ${handsOn} hands-on steps`);
    assert.ok(recap.length >= 3 && recap.length <= 4 && next, `${id} has a recap and a teaser`);
    for (let i = 2; i < steps.length; i++) assert.ok(!(steps[i].type === 'info' && steps[i - 1].type === 'info' && steps[i - 2].type === 'info'), `${id}: three info steps in a row`);
  }
});

test('no text contains undefined or NaN; every choice has one right answer and no duplicate options', () => {
  for (const id of LESSONS) {
    for (const step of lessons[id].steps) {
      for (let k = 0; k < (step.gen ? SEEDS : 1); k++) {
        const s = resolveStep(step, makeRng(99 + k * 104729), step.id);
        const where = `${id}/${step.id} seed ${k}`;
        const blob = JSON.stringify(s, (key, value) => (typeof value === 'function' ? undefined : value));
        assert.ok(!/undefined|NaN|Infinity|\[object Object\]/.test(blob), where);
        if (s.type === 'choice') assert.equal(s.options.filter((o) => o.correct).length, 1, `${where}: exactly one correct option`);
        if (s.type === 'multi') assert.ok(s.options.some((o) => o.correct) && s.options.some((o) => !o.correct), where);
        if (s.type === 'choice' || s.type === 'multi') assert.equal(new Set(s.options.map((o) => o.text + JSON.stringify(o.figure || ''))).size, s.options.length, `${where}: duplicate options`);
        if (s.type === 'numeric') for (const [value] of s.wrong) assert.ok(Math.abs(value - s.answer) > 2 * (s.tolerance || 0) + 1e-9, `${where}: the anticipated mistake ${value} is too close to the answer ${s.answer}`);
        if (s.type === 'match') {
          assert.equal(new Set(s.pairs.map((p) => p[0])).size, s.pairs.length, where);
          assert.equal(new Set(s.pairs.map((p) => p[1])).size, s.pairs.length, where);
        }
        if (s.type === 'bucket') assert.equal(new Set(s.items.map((it) => it.text)).size, s.items.length, where);
        if (s.type === 'order') assert.equal(new Set(s.items).size, s.items.length, where);
        if (s.type === 'interact') assert.ok(s.solution !== undefined && typeof s.check === 'function', `${where}: has a check and a solution`);
        if (s.review) assert.ok(s.explain, `${where}: review steps explain themselves`);
      }
    }
  }
});

test('the words the brief rules out are not used: ReLU units do not "fire", and the model does not want, think or understand', () => {
  for (const id of LESSONS) {
    for (const step of lessons[id].steps) {
      for (let k = 0; k < (step.gen ? 20 : 1); k++) {
        const s = resolveStep(step, makeRng(5 + k), step.id);
        const blob = JSON.stringify(s, (key, value) => (typeof value === 'function' ? undefined : value));
        assert.ok(!/\bfires?\b|\bfired\b|\bfiring\b/i.test(blob), `${id}/${step.id}: "fires"`);
        assert.ok(!/(model|network|it) (wants|thinks|understands|knows|believes)\b/i.test(blob), `${id}/${step.id}: anthropomorphic wording`);
      }
    }
    const tail = JSON.stringify([lessons[id].recap, lessons[id].next]);
    assert.ok(!/\bfires?\b/i.test(tail));
  }
});

/* ------------------------------------------------- lesson 1: activations */

/** The state the relu-builder widget reports, worked out here from scratch. */
function builderState(kinks, weights, bias, target, bend = true, x0 = 0, x1 = 6) {
  const f = (x) => weights.reduce((t, w, i) => t + w * (bend ? relu(x - kinks[i]) : x - kinks[i]), bias);
  let gap = 0;
  for (let i = 0; i <= 2400; i++) { const x = x0 + ((x1 - x0) * i) / 2400; gap = Math.max(gap, Math.abs(f(x) - target(x))); }
  const cuts = [x0, ...kinks.filter((k) => k > x0 && k < x1), x1];
  const pieces = [];
  for (let i = 0; i < cuts.length - 1; i++) pieces.push({ from: cuts[i], to: cuts[i + 1], slope: round((f(cuts[i + 1]) - f(cuts[i])) / (cuts[i + 1] - cuts[i]), 6) });
  return { weights, bias, gap: round(gap, 3), match: gap <= 0.05, pieces, straight: pieces.every((p) => p.slope === pieces[0].slope), slope: pieces[0].slope };
}
const SLIDER = range(-3, 3, 0.5);

test('activation-functions: without a bend every setting gives one straight line, and none of them makes the V', () => {
  const step = raw('activation-functions', 'no-bend');
  assert.equal(step.widget.bend, false);
  const kinks = step.widget.hinges.map((h) => h.at);
  const target = (x) => Math.abs(x - 3);
  for (const w1 of SLIDER) for (const w2 of SLIDER) {
    const st = builderState(kinks, [w1, w2], step.widget.bias, target, false);
    assert.ok(st.straight, `weights ${w1}, ${w2} give a straight line`);
    near(st.slope, w1 + w2, 1e-9, 'the slope is the two weights added together');
    assert.ok(!st.match, 'no setting matches the V');
    // the widget's own arithmetic agrees
    near(hingeSum([{ at: 0, weight: w1 }, { at: 3, weight: w2 }], 3, 4.5, false), 3 + w1 * 4.5 + w2 * 1.5);
  }
  // the starting position really has "the left arm already there"
  const start = builderState(kinks, step.widget.hinges.map((h) => h.weight.value), 3, target, false);
  for (const x of [0, 1, 2, 3]) near(3 + start.weights[0] * x + start.weights[1] * (x - 3), 3 - x);
  assert.equal(typeof step.check({ tried: 5 }), 'string');
  assert.equal(step.check({ tried: 6 }), true);
  assert.ok(step.solution.tried >= 6);
});

test('activation-functions: composing two linear rules by hand', () => {
  const s = fixed('activation-functions', 'compose');
  // y = 3(2x + 1) − 4 = [6] x − [1]
  for (const x of [-2, 0, 1.5, 7]) near(3 * (2 * x + 1) - 4, blankNumber(s, 0) * x - blankNumber(s, 1));
  eachVariant('activation-functions', 'compose-gen', (step) => {
    const inner = /h = ([^$]+)\$/.exec(step.text)[1];
    const outer = /y = ([^$]+)\$/.exec(step.text)[1];
    const f = compile(inner, { vars: ['x'] });
    const g = compile(outer, { vars: ['h'] });
    const answer = compile(step.answer, { vars: ['x'] });
    for (const x of [-3, -1, 0, 0.5, 2, 10]) near(g({ h: f({ x }) }), answer({ x }), 1e-9, 'the answer is the composition');
    assert.ok(!/[()]/.test(step.answer), 'the model answer is multiplied out');
    for (const [wrong] of step.wrong) assert.ok(!equivalent(wrong, step.answer, ['x']), `the slip ${wrong} is not the answer`);
    assert.ok(step.explain.includes(`= ${step.answer}$`), 'the explanation ends with the answer');
    // the hint that works it out quotes the right two numbers
    const a = slope((x) => f({ x }), 0);
    const c = slope((h) => g({ h }), 0);
    const quoted = /= (-?\d+)x\$, and .* = (-?\d+)\$/.exec(step.hints[1]);
    near(Number(quoted[1]), a * c, 1e-6, 'the slope in the hint');
    near(Number(quoted[2]), g({ h: f({ x: 0 }) }), 1e-6, 'the plain number in the hint');
  });
});

test('activation-functions: ReLU values and a ReLU unit', () => {
  const s = fixed('activation-functions', 'meet-relu');
  assert.deepEqual(s.blanks.map((b) => b.numbers[0]), [3, -2, 0.5, -0.1].map(relu));
  eachVariant('activation-functions', 'relu-neuron', (step) => {
    const [w1, w2, b, x1, x2] = bolds(step.text).map(N);
    const score = w1 * x1 + w2 * x2 + b;
    assert.notEqual(score, 0, 'the score is not on the edge');
    assert.equal(blankNumber(step, 0), score, 'score');
    assert.equal(blankNumber(step, 1), relu(score), 'output');
    assert.equal(step.blanks[2].answer, score > 0 ? 'switched on' : 'switched off');
    // the sum written out in the template is the same sum
    const written = /score = (.+?) = /.exec(step.template)[1].replace(/×/g, '*').replace(/−/g, '-');
    near(compile(written, { vars: [] })({}), score);
    assert.ok(step.explain.includes(`= ${String(score).replace('-', '−')}.`), 'the explanation quotes the score');
    assert.match(step.explain, score > 0 ? /switched on and puts out/ : /switched off/);
  });
});

test('activation-functions: a sum of two hinges, evaluated by hand', () => {
  let off = 0;
  eachVariant('activation-functions', 'hinge-sum', (step) => {
    const tex = /\$\$([\s\S]+?)\$\$/.exec(step.text)[1];
    const expr = tex.replace(/\\begin\{aligned\}|\\end\{aligned\}|\{\}|&|\\\\|\\,/g, ' ').replace(/\\text\{ReLU\}/g, 'relu').replace(/y\s*=/, '')
      .replace(/(\d)\s*relu/g, '$1*relu');
    const x = Number(/when \$x = (-?\d+)\$/.exec(step.text)[1]);
    const value = compile(expr, { vars: ['x'] })({ x });
    assert.equal(step.answer, value, 'the answer is the value of the formula');
    // the same with the pieces parsed one by one
    const bias = Number(/^\s*(-?\d+)/.exec(expr)[1]);
    const hinges = Array.from(expr.matchAll(/([+-])\s*(\d*)\*?relu\(x(?:\s*([+-])\s*(\d+))?\)/g), (m) => ({ weight: (m[1] === '-' ? -1 : 1) * (m[2] ? Number(m[2]) : 1), at: m[3] ? (m[3] === '-' ? 1 : -1) * Number(m[4]) : 0 }));
    assert.equal(hinges.length, 2);
    assert.equal(bias + hinges[0].weight * relu(x - hinges[0].at) + hinges[1].weight * relu(x - hinges[1].at), step.answer);
    if (x < hinges[1].at) off += 1;
    for (const [wrong, why] of step.wrong) {
      if (/switched off/.test(why)) { assert.ok(x - hinges[1].at < 0, 'the second unit really is switched off'); assert.equal(wrong, bias + hinges[0].weight * (x - hinges[0].at) + hinges[1].weight * (x - hinges[1].at)); }
      if (/bias/.test(why)) assert.equal(wrong, step.answer - bias);
    }
    assert.ok(step.explain.replace(/\s+/g, ' ').includes(`= ${step.answer}$`), 'the explanation ends with the answer');
    assert.equal(/second unit is switched off/.test(step.explain), relu(x - hinges[1].at) === 0);
  });
  assert.ok(off > SEEDS * 0.3 && off < SEEDS * 0.7, 'about half of the variants have a unit that is switched off');
});

test('activation-functions: the V takes weights −1 and +2, the bump +1, −2, +1, and every hint for a wrong setting is true', () => {
  const v = raw('activation-functions', 'make-v');
  let right = 0;
  for (const w1 of SLIDER) for (const w2 of SLIDER) {
    const st = builderState([0, 3], [w1, w2], v.widget.bias, (x) => Math.abs(x - 3));
    const verdict = v.check(st);
    const isV = w1 === -1 && w2 === 2;
    assert.equal(verdict === true, isV, `weights ${w1}, ${w2}`);
    assert.equal(st.match, isV);
    if (isV) { right += 1; continue; }
    if (/Start with the left arm/.test(verdict)) { assert.notEqual(w1, -1); assert.ok(verdict.includes(`Yours is ${String(w1).replace('-', '−')}.`)); }
    else if (/exactly cancels/.test(verdict)) { assert.equal(w1, -1); assert.equal(st.pieces[1].slope, 0); }
    else { assert.match(verdict, /The left arm is right/); assert.equal(w1, -1); assert.ok(verdict.includes(`at the moment ${String(w1 + w2).replace('-', '−')}.`)); assert.equal(st.pieces[1].slope, w1 + w2); }
  }
  assert.equal(right, 1);
  assert.deepEqual(v.solution.weights, [-1, 2]);

  const bump = raw('activation-functions', 'make-bump');
  const tent = (x) => Math.max(0, Math.min(x - 1, 5 - x));
  const kinks = bump.widget.hinges.map((h) => h.at);
  assert.deepEqual(kinks, [1, 3, 5]);
  right = 0;
  for (const a of SLIDER) for (const b of SLIDER) for (const c of SLIDER) {
    const st = builderState(kinks, [a, b, c], 0, tent);
    const verdict = bump.check(st);
    const isBump = a === 1 && b === -2 && c === 1;
    assert.equal(verdict === true, isBump, `weights ${a}, ${b}, ${c}`);
    if (isBump) { right += 1; continue; }
    if (/Start on the left/.test(verdict)) assert.notEqual(a, 1);
    else if (/The climb is right/.test(verdict)) { assert.equal(a, 1); assert.notEqual(a + b, -1); assert.ok(verdict.includes(`now ${String(a + b).replace('-', '−')}.`)); }
    else { assert.match(verdict, /Up and down are right/); assert.deepEqual([a, a + b], [1, -1]); assert.notEqual(a + b + c, 0); }
  }
  assert.equal(right, 1);
  assert.deepEqual(bump.solution.weights, [1, -2, 1]);
  // the targets handed to the widget are the shapes the lesson describes
  const fromSpec = (expr) => { const f = compile(expr, { vars: ['x'] }); return (x) => f({ x }); };
  for (const x of range(0, 6, 0.25)) { near(fromSpec(v.widget.target)(x), Math.abs(x - 3)); near(fromSpec(bump.widget.target)(x), tent(x)); }
});

test('activation-functions: more hinges, a smaller gap; the numbers in the explanation are right', () => {
  const step = raw('activation-functions', 'more-hinges');
  const wave = (x) => 2 + 1.5 * Math.sin(1.2 * x);
  const spec = compile(step.widget.target, { vars: ['x'] });
  for (const x of range(0, 6, 0.3)) near(spec({ x }), wave(x));
  /** Largest gap between the curve and straight pieces through it at n + 1 equally spaced points (written afresh here). */
  const gapOf = (n) => {
    let worst = 0;
    for (let i = 0; i < n; i++) {
      const a = (6 * i) / n; const b = (6 * (i + 1)) / n;
      for (let k = 0; k <= 400; k++) { const x = a + ((b - a) * k) / 400; worst = Math.max(worst, Math.abs(wave(a) + ((wave(b) - wave(a)) * (x - a)) / (b - a) - wave(x))); }
    }
    return worst;
  };
  const accepted = [];
  for (let n = step.widget.auto.min; n <= step.widget.auto.max; n++) {
    const mine = gapOf(n);
    // the widget and the course helper agree with this calculation
    const fit = fitHinges(wave, 0, 6, n);
    assert.equal(fit.units.length, n, `${n} hinges`);
    near(largestGap((x) => hingeSum(fit.units, fit.bias, x), wave, 0, 6, fit.units.map((u) => u.at)), mine, 2e-3, `the widget's gap for ${n} hinges`);
    near(H.hingeGap(wave, 0, 6, n), mine, 2e-3, `the helper's gap for ${n} hinges`);
    const verdict = step.check({ n, gap: round(mine, 3) });
    assert.equal(verdict === true, mine < 0.1, `${n} hinges`);
    if (verdict === true) accepted.push(n);
  }
  assert.deepEqual(accepted, [10, 11, 12, 13, 14, 15, 16], 'ten hinges or more');
  assert.ok(accepted.includes(step.solution.n));
  const quoted = Array.from(step.explain.matchAll(/(\d+) (?:hinges )?(?:it is|the largest gap was|only) (\d\.\d+)/g), (m) => [Number(m[1]), Number(m[2])]);
  assert.deepEqual(quoted.map((q) => q[0]), [2, 4, 8, 16], 'the explanation quotes 2, 4, 8 and 16 hinges');
  for (const [n, gap] of quoted) near(gap, gapOf(n), 0.006, `the gap quoted for ${n} hinges`);
});

test('activation-functions: the sigmoid step and the sorting step', () => {
  const s = fixed('activation-functions', 'sigmoid');
  const sig = (v) => 1 / (1 + Math.exp(-v));
  assert.equal(blankNumber(s, 0), sig(0));
  assert.equal(blankNumber(s, 1), 1); assert.ok(sig(8) < 1 && sig(8) > 0.999);
  assert.equal(blankNumber(s, 2), 0); assert.ok(sig(-8) > 0 && sig(-8) < 0.001);
  const f = compile(s.figures[0].fns[0].expr, { vars: ['x'] });
  for (const x of [-8, -1, 0, 2, 8]) near(f({ x }), sig(x));
  const relus = compile(fixed('activation-functions', 'meet-relu').figures[0].fns[0].expr, { vars: ['x'] });
  for (const x of [-4, -0.5, 0, 2.5]) near(relus({ x }), relu(x));
  // each statement in the sorting step is true of its own bucket and false of the other two
  const act = [(v) => v, relu, sig];
  const facts = {
    'A score of −4 comes out as −4': (g) => g(-4) === -4,
    'A score of −4 comes out as exactly 0': (g) => g(-4) === 0,
    'A score of 7 comes out as 7, and a score of −7 as 0': (g) => g(7) === 7 && g(-7) === 0,
    'The output always lies between 0 and 1': (g) => [-50, -3, 0, 3, 50].every((v) => g(v) >= 0 && g(v) <= 1),
    'A score of 0 comes out as 0.5': (g) => g(0) === 0.5,
  };
  const sort = fixed('activation-functions', 'which-bend');
  let checked = 0;
  for (const item of sort.items) {
    if (!facts[item.text]) continue;
    checked += 1;
    act.forEach((g, i) => assert.equal(facts[item.text](g), i === item.bucket, `"${item.text}" for bucket ${i}`));
  }
  assert.equal(checked, 5);
});

/* ------------------------------------- lesson 2: scores to probabilities */

test('scores-to-probabilities: the worked examples', () => {
  // hook: dividing by the sum gives fox −0.5; powers of 2 are all positive
  near(-1 / (2 + 1 - 1), -0.5);
  assert.ok(softmaxOf([2, 1, -1], 2).every((p) => p > 0));
  // by hand, with powers of 2
  const hand = fixed('scores-to-probabilities', 'by-hand');
  assert.deepEqual(hand.blanks.map((b) => b.numbers[0]), [4, 2, 2, 8, 0.5, 0.25, 0.25]);
  assert.deepEqual(softmaxOf([2, 1, 1], 2), [0.5, 0.25, 0.25]);
  // with e
  const withE = fixed('scores-to-probabilities', 'with-e');
  const exact = softmaxOf([2, 1, 0]);
  near(blankNumber(withE, 0), 7.39 + 2.72 + 1, 1e-9, 'the total of the rounded powers');
  [0, 1, 2].forEach((i) => {
    assert.equal(blankNumber(withE, i + 1), round(exact[i], 2), `probability ${i} to 2 decimals`);
    near([7.39, 2.72, 1][i] / 11.11, blankNumber(withE, i + 1), withE.tolerance, 'worked from the table');
  });
  near(Math.exp(1), 2.72, 0.005); near(Math.exp(2), 7.39, 0.005); near(Math.exp(3), 20.09, 0.005);
  // "with base 2 these scores would have given 0.57, 0.29 and 0.14"
  assert.deepEqual(softmaxOf([2, 1, 0], 2).map((p) => round(p, 2)), [0.57, 0.29, 0.14]);
  assert.match(withE.explain, /0\.57, 0\.29 and 0\.14/);
  // squared error against cross-entropy
  const table = tableRows(fixed('scores-to-probabilities', 'why-not-squared').text).slice(1);
  assert.equal(table.length, 3);
  for (const [p, squared, ce] of table.map((row) => row.map(Number))) {
    near(squared, (1 - p) ** 2, 0.005, `squared error at ${p}`);
    near(ce, -Math.log(p), 0.005, `cross-entropy at ${p}`);
  }
  near(-Math.log(0.001) / -Math.log(0.1), 3, 1e-9, '"three times as much"');
  // the widget's softmax is the same function
  for (const scores of [[2, 1, 1], [0, 0, 0], [-4, 6, 0]]) for (const base of [2, Math.E]) {
    widgetSoftmax(scores, { base }).probs.forEach((p, i) => near(p, softmaxOf(scores, base)[i], 1e-12));
    H.softmax(scores, base).forEach((p, i) => near(p, softmaxOf(scores, base)[i], 1e-12));
  }
});

test('scores-to-probabilities: aiming for 0.8 with powers of 2', () => {
  const step = raw('scores-to-probabilities', 'eighty');
  const { min, max } = step.widget.range;
  assert.equal(step.widget.base, 2);
  let solutions = 0;
  for (const a of range(min, max)) for (const b of range(min, max)) for (const c of range(min, max)) {
    const probs = softmaxOf([a, b, c], 2);
    const verdict = step.check({ scores: [a, b, c], probs });
    const hit = a === b + 3 && a === c + 3;
    assert.equal(Math.abs(probs[0] - 0.8) < 1e-9, hit, `0.8 exactly when cat is 3 above both others (${a}, ${b}, ${c})`);
    assert.equal(verdict === true, hit);
    if (hit) { solutions += 1; continue; }
    if (b !== c) {
      assert.match(verdict, /no whole-number score for cat lands exactly on 0\.8/);
      for (let cat = -40; cat <= 40; cat++) assert.ok(Math.abs(softmaxOf([cat, b, c], 2)[0] - 0.8) > 1e-9, 'and that is true');
    } else {
      assert.match(verdict, probs[0] < 0.8 ? /not enough\. Widen the gap/ : /too much\. Narrow the gap/);
    }
  }
  assert.equal(solutions, 6);
  assert.equal(step.check({ scores: step.solution.scores, probs: softmaxOf(step.solution.scores, 2) }), true);
  for (const scores of [[3, 0, 0], [4, 1, 1], [2, -1, -1]]) near(softmaxOf(scores, 2)[0], 0.8, 1e-12, 'the three examples in the explanation');
});

test('scores-to-probabilities: softmax from a table of powers of e', () => {
  const E = { 0: 1, 1: 2.72, 2: 7.39, 3: 20.09 };
  eachVariant('scores-to-probabilities', 'softmax-gen', (step) => {
    const rows = tableRows(step.text);
    const names = rows[0];
    const scores = rows[1].map(Number);
    assert.equal(scores.length, 3);
    assert.deepEqual(rows[2].slice(1).map(Number), [0, 1, 2, 3]);
    assert.deepEqual(rows[3].slice(1).map(Number), [1, 2.72, 7.39, 20.09], 'the table of powers');
    const asked = /probability of “([^”]+)”/.exec(step.text)[1];
    const which = names.indexOf(asked);
    assert.ok(which >= 0);
    const exact = softmaxOf(scores)[which];
    near(step.answer, exact, 0.005 + 1e-9, 'the answer is the exact value to 2 decimals');
    const total = scores.reduce((t, v) => t + E[v], 0);
    near(E[scores[which]] / total, step.answer, 0.0075, 'a learner working from the table lands inside the tolerance');
    assert.ok(step.tolerance >= 0.0075);
    assert.ok(step.explain.includes(`${Math.round(total * 100) / 100}`), 'the explanation quotes the total');
    for (const [wrong, why] of step.wrong) if (/raw scores/.test(why)) near(wrong, scores[which] / (scores[0] + scores[1] + scores[2]), 0.0051);
  });
});

test('scores-to-probabilities: adding the same number to every score changes nothing', () => {
  eachVariant('scores-to-probabilities', 'shift', (step) => {
    const lists = Array.from(step.text.matchAll(/(−?\d+), (−?\d+), (−?\d+)/g), (m) => m.slice(1, 4).map(N));
    assert.equal(lists.length, 2);
    const k = Number(/(?:adds|takes) (\d+) (?:to|from)/.exec(step.text)[1]);
    const sign = /adds/.test(step.text) ? 1 : -1;
    assert.deepEqual(lists[1], lists[0].map((v) => v + sign * k), 'the new scores are the old ones, shifted');
    const before = softmaxOf(lists[0]);
    softmaxOf(lists[1]).forEach((p, i) => near(p, before[i], 1e-12, 'the probabilities do not move'));
    assert.match(step.options.find((o) => o.correct).text, /^Nothing/);
    assert.ok(step.options.some((o) => o.text === (sign > 0 ? 'All three go up' : 'All three go down')));
  });
});

test('scores-to-probabilities: temperature, on the toy language model of the first course', () => {
  // the counts after "the" in How AI Learns
  const counts = {};
  for (const sentence of CAT_SENTENCES) { const w = sentence.split(' '); w.forEach((word, i) => { if (word === 'the' && w[i + 1]) counts[w[i + 1]] = (counts[w[i + 1]] || 0) + 1; }); }
  assert.deepEqual(counts, { cat: 4, dog: 3, mat: 2, rug: 1 });
  const step = raw('scores-to-probabilities', 'temperature');
  assert.deepEqual(step.widget.classes, ['cat', 'dog', 'mat', 'rug']);
  softmaxOf(step.widget.scores).forEach((p, i) => near(p, [0.4, 0.3, 0.2, 0.1][i], 1e-12, 'at temperature 1 the shares are the count shares'));
  const { min, max, step: by } = step.widget.temperature;
  const accepted = [];
  for (const T of range(min, max, by)) {
    const probs = softmaxOf(step.widget.scores, Math.E, T);
    // dividing the scores by T is the first course's rule: chance proportional to count^(1 / randomness)
    const powers = [4, 3, 2, 1].map((c) => c ** (1 / T));
    probs.forEach((p, i) => near(p, powers[i] / powers.reduce((t, v) => t + v, 0), 1e-12));
    assert.ok(probs[0] > probs[1] && probs[1] > probs[2] && probs[2] > probs[3], 'the order never changes');
    const verdict = step.check({ temperature: T, probs });
    // judged on the two decimals the bars display: a shown "0.2" is accepted
    assert.equal(verdict === true, Math.round(probs[3] * 100) >= 20, `temperature ${T}`);
    if (verdict === true) accepted.push(T);
    else assert.match(verdict, T < 1 ? /low temperatures favour the front-runner/ : /keep going/);
  }
  assert.deepEqual(accepted, range(3.4, 5, 0.2), 'a temperature of 3.4 or more shows "0.2" (or more) for rug');
  assert.ok(accepted.includes(step.solution.temperature));
  assert.equal(round(softmaxOf(step.widget.scores, Math.E, 4)[3], 1), 0.2);
  assert.equal(round(softmaxOf(step.widget.scores, Math.E, 0.2)[0], 2), 0.79);
  assert.match(step.explain, /“cat” takes 0\.79/);
});

test('scores-to-probabilities: the loss, confident and right against confident and wrong', () => {
  const step = raw('scores-to-probabilities', 'loss-explore');
  const { min, max, step: by } = step.widget.range;
  assert.equal(step.widget.target, 0);
  let wins = 0;
  for (const cat of range(min, max, by)) for (const dog of range(min, max, by)) {
    const probs = softmaxOf([cat, dog, 0]);
    const loss = -Math.log(probs[0]);
    const verdict = step.check({ scores: [cat, dog, 0], probs, loss });
    assert.equal(verdict === true, loss > 5, `cat ${cat}, dog ${dog}`);
    // "for a loss above 5 it has to fall below 0.0067" is exact for every setting the sliders allow
    assert.equal(loss > 5, probs[0] < 0.0067);
    if (verdict === true) wins += 1;
    else assert.match(verdict, loss < 0.1 ? /confident-and-right corner/ : /has to fall below 0\.0067/);
  }
  assert.ok(wins > 20);
  const sol = softmaxOf(step.solution.scores);
  assert.equal(step.check({ scores: step.solution.scores, probs: sol, loss: -Math.log(sol[0]) }), true);
  near(-Math.log(1 / 3), 1.1, 0.005, 'three equal scores: a loss of about 1.1');
  assert.ok(softmaxOf([6, -4, 0])[0] > 0.99 && -Math.log(softmaxOf([6, -4, 0])[0]) < 0.1, 'a loss below 0.1 can be reached');
  // the curve in the next step is −ln(p)
  const curve = compile(fixed('scores-to-probabilities', 'loss-name').figures[0].fns[0].expr, { vars: ['x'] });
  for (const p of [0.01, 0.1, 0.5, 1]) near(curve({ x: p }), -Math.log(p));
  near(-Math.log(0.5), 0.69, 0.005);
});

test('scores-to-probabilities: each halving of the probability adds 0.693 to the loss', () => {
  eachVariant('scores-to-probabilities', 'loss-halving', (step) => {
    const p = N(bolds(step.text)[0]);
    const exact = -Math.log(p);
    near(step.answer, exact, 0.005 + 1e-9, 'the answer is −ln(p) to 2 decimals');
    const k = Math.round(Math.log2(1 / p));
    near(2 ** -k, p, 1e-12, 'p is 1 halved a whole number of times');
    near(k * 0.693, step.answer, step.tolerance, 'the halving rule lands inside the tolerance');
    near(k * 0.69, step.answer, step.tolerance, 'even with 0.69');
    assert.ok(step.hints[1].includes(`2^{${k}}`) && step.explain.includes(`halved ${k} times`));
    for (const [wrong, why] of step.wrong) {
      if (/wrong answers together/.test(why)) near(wrong, 1 - p, 0.0051);
      if (/Count the halvings/.test(why)) near(wrong, (k - 1) * 0.693, 0.0051);
    }
  });
});

/* ------------------------------------------------ lesson 3: backpropagation */

/** The worked network, written out again from the lesson's description. p: the nine weights. */
const NET0 = { wA1: 1, wA2: 1, bA: -1, wB1: 1, wB2: -3, bB: 0, v1: 2, v2: 3, c: -1 };
const X = [2, 1];
const TARGET = 2;
function run(p) {
  const zA = p.wA1 * X[0] + p.wA2 * X[1] + p.bA;
  const zB = p.wB1 * X[0] + p.wB2 * X[1] + p.bB;
  const hA = relu(zA); const hB = relu(zB);
  const y = p.v1 * hA + p.v2 * hB + p.c;
  return { zA, hA, zB, hB, y, L: (y - TARGET) ** 2 };
}
const GRAD_KEY = { wA1: 'gwA1', wA2: 'gwA2', bA: 'gbA', wB1: 'gwB1', wB2: 'gwB2', bB: 'gbB', v1: 'gv1', v2: 'gv2', c: 'gc' };
/** Every gradient of the network by finite differences: nudge one number, run the rest of the network, see what the loss did. */
function gradientsByNudging(p) {
  const f = run(p);
  const g = {};
  for (const key of Object.keys(GRAD_KEY)) g[GRAD_KEY[key]] = slope((v) => run({ ...p, [key]: v }).L, p[key]);
  g.gy = slope((y) => (y - TARGET) ** 2, f.y);
  g.ghA = slope((hA) => (p.v1 * hA + p.v2 * f.hB + p.c - TARGET) ** 2, f.hA);
  g.ghB = slope((hB) => (p.v1 * f.hA + p.v2 * hB + p.c - TARGET) ** 2, f.hB);
  g.gzA = slope((zA) => (p.v1 * relu(zA) + p.v2 * f.hB + p.c - TARGET) ** 2, f.zA);
  g.gzB = slope((zB) => (p.v1 * f.hA + p.v2 * relu(zB) + p.c - TARGET) ** 2, f.zB);
  return g;
}
const asNet = (p) => ({ x: X, target: TARGET, A: { w: [p.wA1, p.wA2], b: p.bA }, B: { w: [p.wB1, p.wB2], b: p.bB }, out: { v: [p.v1, p.v2], c: p.c } });

test('backpropagation: every number of the worked network, checked by finite differences', () => {
  assert.deepEqual(H.NET, asNet(NET0), 'the network in the lessons is the one tested here');
  const f = run(NET0);
  assert.deepEqual(f, { zA: 2, hA: 2, zB: -1, hB: 0, y: 3, L: 1 });
  assert.deepEqual(H.netForward(), f);
  assert.deepEqual(widgetForward(NET0, X, TARGET), f);
  const g = gradientsByNudging(NET0);
  const expected = { gy: 2, gc: 2, gv1: 4, gv2: 0, ghA: 4, ghB: 6, gzA: 4, gzB: 0, gbA: 4, gbB: 0, gwA1: 8, gwA2: 4, gwB1: 0, gwB2: 0 };
  const helper = H.netBackward();
  const widget = widgetBackward(NET0, X, TARGET);
  for (const [key, value] of Object.entries(expected)) {
    near(g[key], value, 1e-6, `finite differences for ${key}`);
    assert.equal(helper[key], value, `the helper's ${key}`);
    assert.equal(widget[key], value, `the widget's ${key}`);
  }
  assert.equal(Object.keys(expected).length, 14);
  // and for other weights too, so that the agreement is not an accident of these numbers
  const rng = makeRng(77);
  for (let k = 0; k < 200; k++) {
    const p = Object.fromEntries(Object.keys(NET0).map((key) => [key, rng.int(-3, 3) + rng.pick([0, 0.5])]));
    const z = run(p);
    if (Math.abs(z.zA) < 0.01 || Math.abs(z.zB) < 0.01) continue; // a unit exactly on its kink has no single slope
    const fd = gradientsByNudging(p);
    const bp = widgetBackward(p, X, TARGET);
    const hp = H.netBackward(asNet(p));
    for (const key of Object.keys(expected)) { near(bp[key], fd[key], 1e-5, `${key} with random weights`); near(hp[key], fd[key], 1e-5, `${key} (helper)`); }
  }
});

test('backpropagation: the fill-the-network steps ask for the right things, and no "slip" is a right answer', () => {
  const truth = { ...run(NET0), ...gradientsByNudging(NET0) };
  const asked = [];
  for (const id of ['forward', 'backward-top', 'backward-hidden', 'backward-weights']) {
    const step = raw('backpropagation', id);
    const w = step.widget;
    assert.deepEqual([w.x, w.target, w.A, w.B, w.out], [H.NET.x, H.NET.target, H.NET.A, H.NET.B, H.NET.out]);
    asked.push(...w.ask);
    for (const [key, list] of Object.entries(w.slips || {})) {
      assert.ok(w.ask.includes(key), `${id}: the slip for ${key} belongs to a blank of this step`);
      for (const [value] of list) assert.ok(Math.abs(value - truth[key]) > 1e-6, `${id}: the slip ${value} for ${key} is not the right answer`);
    }
    assert.equal(step.check({ done: true, filled: w.ask, mistakes: 0 }), true);
    assert.match(step.check({ done: false, filled: [], mistakes: 0 }), /press Enter/);
    assert.match(step.check({ done: false, filled: w.ask.slice(0, 2), mistakes: 1 }), new RegExp(`^2 of ${w.ask.length} filled in`));
    assert.deepEqual(step.solution, { done: true });
    // every number quoted in the explanation as "= value" is one of the true values of this step
    for (const key of w.ask) assert.ok(step.explain.includes(String(round(truth[key], 6))), `${id}: the explanation mentions the value of ${key}`);
  }
  assert.deepEqual(asked.slice(0, 6), ['zA', 'hA', 'zB', 'hB', 'y', 'L']);
  assert.deepEqual(asked.slice(6), ['gy', 'gc', 'gv1', 'gv2', 'ghA', 'ghB', 'gzA', 'gzB', 'gwA1', 'gwA2', 'gbA', 'gwB1']);
  // later steps are given exactly what earlier steps asked for
  assert.deepEqual(raw('backpropagation', 'backward-hidden').widget.given, ['forward', 'gy', 'gc', 'gv1', 'gv2']);
  assert.deepEqual(raw('backpropagation', 'backward-weights').widget.given, ['forward', 'gy', 'gc', 'gv1', 'gv2', 'ghA', 'ghB', 'gzA', 'gzB']);
});

test('backpropagation: chains of rates', () => {
  // the two-link chain of the first hands-on step
  const chain = fixed('backpropagation', 'chain-explore');
  const fig = chain.figures[0];
  const inner = compile(fig.inner, { vars: ['x'] }); const outer = compile(fig.outer, { vars: ['u'] });
  near(slope((x) => inner({ x }), 1), blankNumber(chain, 0), 1e-6);
  near(slope((u) => outer({ u }), 3), blankNumber(chain, 1), 1e-6);
  near(slope((x) => outer({ u: inner({ x }) }), 1), blankNumber(chain, 2), 1e-6);
  assert.deepEqual([inner({ x: 1 }), inner({ x: 2 }), outer({ u: 3 }), outer({ u: 6 })], [3, 6, 6, 12], 'the numbers in the explanation');
  assert.ok(!fig.show.includes('total'), 'the rate of the whole chain is left for the learner to find');
  // the squared miss
  const sq = fixed('backpropagation', 'square-rate');
  for (const [y, loss, nudged, then, change] of tableRows(sq.text).slice(1).map((row) => row.map(Number))) {
    near(loss, (y - 2) ** 2); near(then, (nudged - 2) ** 2, 1e-9); near(change, then - loss, 1e-9);
    near(change / (nudged - y), 2 * (y - 2), 0.02, 'about twice the miss');
  }
  assert.deepEqual(sq.blanks.map((b) => b.numbers[0]), [2, 6, 2]);
  eachVariant('backpropagation', 'chain-gen', (step) => {
    const rates = tableRows(step.text).slice(1).map((row) => N(/\$(-?\d+)\$\s*$/.exec(row[1])[1]));
    assert.equal(rates.length, 3);
    // build the chain and nudge it
    const loss = (w) => rates[2] * (rates[1] * (rates[0] * w));
    near(step.answer, loss(0.1) - loss(0), 1e-9, 'the change in the loss for a nudge of 0.1');
    for (const [wrong, why] of step.wrong) {
      if (/is the rate/.test(why)) near(wrong, rates[0] * rates[1] * rates[2]);
      if (/do not add/.test(why)) near(wrong, (rates[0] + rates[1] + rates[2]) * 0.1);
    }
    assert.ok(step.explain.includes(`= ${rates[0] * rates[1] * rates[2]}$`));
  });
});

test('backpropagation: nudging one weight, and descending', () => {
  const nudge = fixed('backpropagation', 'nudge-check');
  const by = nudge.figures[0].nudge.by;
  assert.deepEqual(nudge.figures[0].nudge.weights, ['wA1', 'wB1']);
  const changeA = run({ ...NET0, wA1: NET0.wA1 + by }).L - run(NET0).L;
  const changeB = run({ ...NET0, wB1: NET0.wB1 + by }).L - run(NET0).L;
  near(changeA, 0.0816, 1e-9);
  near(blankNumber(nudge, 0), changeA, nudge.tolerance, 'the change, to 2 decimals');
  assert.equal(blankNumber(nudge, 0), round(changeA, 2));
  near(blankNumber(nudge, 1), gradientsByNudging(NET0).gwA1, 1e-6);
  assert.equal(blankNumber(nudge, 2), changeB);
  assert.equal(changeB, 0);

  const step = raw('backpropagation', 'descend');
  const rate = step.widget.train.rate;
  assert.match(step.text, new RegExp(`- ${rate} \\\\times`));
  let p = { ...NET0 };
  const losses = [run(p).L];
  let accepted = null;
  for (let n = 0; n <= 30; n++) {
    const loss = run(p).L;
    const verdict = step.check({ steps: n, loss });
    assert.equal(verdict === true, loss < 0.01, `after ${n} steps`);
    if (verdict === true && accepted == null) accepted = n;
    // B is switched off the whole way, so its weights never move
    assert.ok(run(p).zB < 0);
    assert.deepEqual([p.wB1, p.wB2, p.bB], [NET0.wB1, NET0.wB2, NET0.bB]);
    // one step of gradient descent with finite-difference gradients; the widget and the helper must land in the same place
    const g = gradientsByNudging(p);
    const next = {};
    for (const key of Object.keys(p)) next[key] = Math.abs(g[GRAD_KEY[key]]) < 1e-9 ? p[key] : p[key] - rate * g[GRAD_KEY[key]];
    const w = widgetDescend(p, X, TARGET, rate);
    for (const key of Object.keys(p)) near(w[key], next[key], 1e-7, `${key} after step ${n + 1}`);
    p = w;
    losses.push(run(p).L);
    near(H.netForward(H.netAfterSteps(n + 1, rate)).L, losses[n + 1], 1e-9);
  }
  assert.equal(accepted, step.solution.steps);
  assert.equal(accepted, 8);
  for (let n = 1; n < losses.length; n++) assert.ok(losses[n] < losses[n - 1], 'the loss falls at every step');
  assert.match(step.explain, new RegExp(`from 1 to ${round(losses[1], 2)}, ${round(losses[2], 2)}, ${round(losses[3], 2)} … and after ${accepted} steps`));
});

test('backpropagation: the gradient of one weight, through a ReLU that may be switched off', () => {
  let off = 0;
  eachVariant('backpropagation', 'one-weight', (step) => {
    const [x, z, v, g] = bolds(step.text).slice(0, 4).map(N);
    // a network that fits the description: score = w·x + rest, output through v, and a loss whose slope at y is g
    const w0 = 0.7;
    const rest = z - w0 * x;
    const loss = (w) => g * (v * relu(w * x + rest));
    near(step.answer, slope(loss, w0), 1e-6, 'the gradient, by nudging the weight');
    if (z <= 0) { off += 1; assert.equal(step.answer, 0); assert.match(step.explain, /switched off/); } else assert.match(step.explain, /switched on/);
    for (const [wrong, why] of step.wrong) {
      if (/if the unit were switched on/.test(why)) { assert.ok(z < 0); assert.equal(wrong, g * v * x); }
      if (/gradient at the unit's score/.test(why)) { assert.ok(z > 0); assert.equal(wrong, g * v); }
    }
  });
  assert.ok(off > SEEDS * 0.25 && off < SEEDS * 0.55, 'a good share of the variants have a unit that is switched off');
});

/* --------------------------------------------- lesson 4: training in practice */

/** The network of the loss-curves widget, re-implemented here: its data and starting weights are read from the widget's source. */
const source = fs.readFileSync(new URL('../src/widgets/loss-curves.js', import.meta.url), 'utf8');
const constant = (name) => JSON.parse(new RegExp(`const ${name} = (\\[[^;]*\\]);`).exec(source)[1]);
const START = [...constant('W0'), ...constant('B0'), ...constant('V0'), 0];
const HIDDEN = 20;
const scaleX = (x) => (x - 5) / 3;
const scaleY = (y) => (y - 5.5) / 2;
function meanSquare(theta, plants) {
  let total = 0;
  for (const [x, y] of plants) {
    let out = theta[3 * HIDDEN];
    for (let i = 0; i < HIDDEN; i++) out += theta[2 * HIDDEN + i] * relu(theta[i] * scaleX(x) + theta[HIDDEN + i]);
    total += (out - scaleY(y)) ** 2;
  }
  return total / plants.length;
}
/** Full-batch gradient descent with finite-difference gradients: slow, simple, and independent of backpropagation. */
function trainByNudging(rate, epochs = 300) {
  const theta = START.slice();
  const train = [meanSquare(theta, TRAIN)];
  const val = [meanSquare(theta, VALIDATION)];
  for (let e = 0; e < epochs; e++) {
    const grad = theta.map((v, i) => {
      const up = theta.slice(); up[i] = v + 1e-6;
      const down = theta.slice(); down[i] = v - 1e-6;
      return (meanSquare(up, TRAIN) - meanSquare(down, TRAIN)) / 2e-6;
    });
    for (let i = 0; i < theta.length; i++) theta[i] -= rate * grad[i];
    const t = meanSquare(theta, TRAIN);
    if (!Number.isFinite(t) || t > 1000) return { train, val, diverged: true };
    train.push(t);
    val.push(meanSquare(theta, VALIDATION));
  }
  return { train, val, diverged: false };
}
/** A state as the widget reports it, from a run. */
const labState = (settings, runResult, goal, extra = {}) => ({ ...settings, ran: true, runs: 1, ...summarize(runResult, goal), ...extra });

test('training-in-practice: averaging gradients, and counting steps', () => {
  const hand = fixed('training-in-practice', 'batch-by-hand');
  const grads = tableRows(hand.text)[1].slice(1).map(N);
  assert.deepEqual(grads, [8, -2, 4, -2]);
  const mean = (list) => list.reduce((t, v) => t + v, 0) / list.length;
  assert.deepEqual(hand.blanks.map((b) => b.numbers[0]), [mean(grads), mean(grads.slice(0, 2)), mean(grads.slice(2))]);
  near(mean([mean(grads.slice(0, 2)), mean(grads.slice(2))]), mean(grads), 1e-12, 'the two estimates average to the true value');
  eachVariant('training-in-practice', 'epoch-count', (step) => {
    const [examples, batch, epochs] = boldNumbers(step.text);
    let steps = 0;
    for (let e = 0; e < epochs; e++) for (let seen = 0; seen < examples; seen += batch) steps += 1;   // count them one by one
    assert.equal(step.answer, steps);
    assert.equal(examples % batch, 0, 'the batches divide the data evenly');
    for (const [wrong, why] of step.wrong) {
      if (/That is one epoch/.test(why)) assert.equal(wrong, examples / batch);
      if (/examples are processed/.test(why)) assert.equal(wrong, examples * epochs);
    }
    assert.ok(step.explain.includes(`= ${steps}$`));
  });
});

test('training-in-practice: the lab is a real training run, and the numbers quoted about it are right', () => {
  assert.equal(TRAIN.length, H.PLANTS); assert.equal(VALIDATION.length, 12); assert.equal(START.length, 61);
  for (const rate of [0.002, 0.01, 0.02, 0.05]) {
    const mine = trainByNudging(rate);
    const theirs = trainRun({ rate, batch: 12 });
    assert.equal(mine.diverged, false);
    assert.equal(theirs.train.length, 301);
    for (const e of [0, 1, 10, 50, 80, 150, 300]) {
      near(theirs.train[e], mine.train[e], 2e-4, `training loss at epoch ${e}, rate ${rate}`);
      near(theirs.val[e], mine.val[e], 2e-4, `validation loss at epoch ${e}, rate ${rate}`);
    }
    const reach = mine.train.findIndex((v) => v < H.LAB.goal);
    if (H.LAB.reach[rate]) assert.equal(reach, H.LAB.reach[rate], `the goal is reached at epoch ${H.LAB.reach[rate]} with rate ${rate}`);
    else assert.equal(reach, -1);
  }
  // the early-stopping run
  const stop = trainByNudging(H.LAB.stop.rate);
  const best = stop.val.indexOf(Math.min(...stop.val));
  assert.equal(best, H.LAB.stop.bestEpoch);
  assert.equal(round(stop.val[best], 2), H.LAB.stop.bestVal);
  assert.equal(round(stop.train[best], 2), H.LAB.stop.trainAtBest);
  assert.equal(round(stop.train[300], 2), H.LAB.stop.finalTrain);
  assert.equal(round(stop.val[300], 2), H.LAB.stop.finalVal);
  near(stop.val[300] / stop.val[best], 2, 0.1, '"the validation loss doubles"');
  for (let e = 1; e <= 300; e++) assert.ok(stop.train[e] < stop.train[e - 1], 'the training loss falls at every epoch');
  for (let e = 1; e <= best; e++) assert.ok(stop.val[e] < stop.val[e - 1], 'the validation loss falls up to its lowest point');
  for (let e = best + 1; e <= 300; e++) assert.ok(stop.val[e] > stop.val[e - 1], '… and rises from there on');
});

test('training-in-practice: the training lab, at every setting of both sliders', () => {
  const step = raw('training-in-practice', 'lab-rate');
  assert.deepEqual(step.widget.rate.values, H.RATES);
  assert.deepEqual(step.widget.batch.values, H.BATCHES);
  const goal = step.widget.goal;
  const verdicts = {};
  const seen = { good: 0, blew: 0, spiked: 0, slow: 0, rough: 0, lateSlow: 0, lateRough: 0 };
  for (const rate of H.RATES) for (const batch of H.BATCHES) {
    // with 12 plants per step nothing is random; smaller batches are tried with many different shuffles
    for (let seed = 1; seed <= (batch === 12 ? 1 : 40); seed++) {
      const shuffles = () => (batch === 12 ? null : makeRng(seed * 104729).fork(`lab ${rate} ${batch}`));
      const result = trainRun({ rate, batch }, shuffles());
      const facts = summarize(result, goal);
      const verdict = step.check(labState({ rate, batch, decay: false }, result, goal));
      if (batch === 12) verdicts[rate] = verdict;
      const good = !facts.diverged && !facts.spiked && facts.reached != null && facts.reached < 50;
      assert.equal(verdict === true, good, `rate ${rate}, batch ${batch}, seed ${seed}`);
      const start = result.train[0];
      if (good) { seen.good += 1; assert.ok(facts.peak <= 2 * start, 'never far above where it started'); continue; }
      if (facts.diverged) { seen.blew += 1; assert.match(verdict, /blew up\. Try a much smaller rate/); assert.ok(rate >= 0.05, 'only large rates blow up'); }
      else if (facts.spiked) { seen.spiked += 1; assert.match(verdict, /Try a smaller rate/); assert.ok(facts.peak > 2 * start && rate >= 0.02); assert.ok(verdict.includes(`shot up to ${Math.round(facts.peak)}`)); }
      else if (facts.reached == null && /too slowly\. Try a larger rate/.test(verdict)) {
        seen.slow += 1;
        assert.ok(rate <= 0.005, 'only small rates crawl');
        assert.ok(facts.lateBumps < 10 && result.train[300] < result.train[200] && result.train[200] < result.train[100], 'and the curve is still heading down');
      } else if (facts.reached == null) {
        seen.rough += 1;
        assert.match(verdict, /jumping up and down to the very end.*Try a smaller rate/);
        assert.ok(facts.lateBumps >= 10 && rate >= 0.05, 'only large rates keep jumping');
      } else if (/raise the rate/.test(verdict)) {
        seen.lateSlow += 1;
        assert.ok(verdict.includes(`only at epoch ${facts.reached}`) && facts.reached >= 50);
        // "larger steps would get there sooner": the next rate up, with the same batches in the same order, does
        const next = summarize(trainRun({ rate: H.RATES[H.RATES.indexOf(rate) + 1], batch }, shuffles()), goal);
        assert.ok(next.reached != null && next.reached < facts.reached, `rate ${rate}, batch ${batch}: the next rate up is quicker`);
      } else {
        seen.lateRough += 1;
        assert.match(verdict, /after a great deal of jumping about.*Try a smaller rate/);
        assert.ok(facts.bumps > 100 && rate >= 0.05);
      }
    }
  }
  for (const [kind, count] of Object.entries(seen)) if (kind !== 'lateRough') assert.ok(count > 0, `some setting is ${kind}`);
  assert.deepEqual(H.RATES.filter((rate) => verdicts[rate] === true), [0.05], 'with all 12 plants per step, exactly one rate does it');
  assert.deepEqual([step.solution.rate, step.solution.batch], [0.05, 12]);
  assert.match(step.check({ ran: false, runs: 0 }), /press “Train”/);
  // "with batches of 2 a rate of 0.01 is already enough", whatever the order of the batches
  for (let seed = 1; seed <= 200; seed++) {
    const result = trainRun({ rate: 0.01, batch: 2 }, makeRng(seed * 31337).fork('two'));
    assert.equal(step.check(labState({ rate: 0.01, batch: 2, decay: false }, result, goal)), true, `seed ${seed}`);
  }
  // the explanation: 0.1 leaps past 50 and recovers, 0.5 blows up within a few epochs, 0.05 has a bump a little after epoch 100
  const hot = trainRun({ rate: 0.1, batch: 12 });
  assert.ok(Math.max(...hot.train) > 50 && hot.train[300] < 0.3);
  const wild = trainRun({ rate: 0.5, batch: 12 });
  assert.ok(wild.diverged && wild.train.length < 6);
  const edge = trainRun({ rate: 0.05, batch: 12 }).train;
  const top = range(60, 200).reduce((best, e) => (edge[e] > edge[best] ? e : best), 60);
  assert.ok(top > 100 && top < 125 && edge[top] > 2 * edge[75] && edge[top] < edge[0], `the bump peaks a little after epoch 100 (at ${top})`);
  // the three small pictures: only the one marked as right has a loss that leaps above its start
  const pictures = fixed('training-in-practice', 'read-curves').options;
  assert.equal(pictures.length, 3);
  for (const option of pictures) {
    const facts = summarize(trainRun({ rate: option.figure.rate, batch: option.figure.batch }));
    assert.equal(facts.spiked, !!option.correct, `picture with rate ${option.figure.rate}`);
    assert.equal(facts.diverged, false);
  }
  const [slow, good] = pictures.map((o) => trainRun({ rate: o.figure.rate, batch: 12 }).train);
  assert.ok(slow[300] > 0.5 && good[300] < 0.2 && summarize(trainRun({ rate: pictures[1].figure.rate, batch: 12 })).bumps === 0);
});

test('training-in-practice: when to stop', () => {
  const step = raw('training-in-practice', 'validation');
  const result = trainRun({ rate: step.widget.rate, batch: step.widget.batch });
  const facts = summarize(result);
  assert.equal(step.widget.rate, H.LAB.stop.rate);
  const accepted = [];
  for (let epoch = 0; epoch <= 300; epoch++) {
    const state = { epoch, valAt: result.val[epoch], trainAt: result.train[epoch], bestVal: facts.bestVal, bestEpoch: facts.bestEpoch };
    const verdict = step.check(state);
    if (verdict === true) { accepted.push(epoch); continue; }
    if (epoch < facts.bestEpoch) { assert.match(verdict, /still falling/); assert.ok(result.val[epoch + 1] < result.val[epoch], 'it is still falling there'); }
    else { assert.match(verdict, /it has been lower than that/); assert.ok(result.train[Math.min(300, epoch + 1)] <= result.train[epoch], 'the training loss is still falling there'); }
  }
  assert.ok(accepted.includes(facts.bestEpoch) && accepted.includes(step.solution.epoch));
  assert.deepEqual(accepted, range(accepted[0], accepted[accepted.length - 1]), 'one unbroken stretch of epochs is accepted');
  assert.ok(accepted[0] >= 60 && accepted[accepted.length - 1] <= 105, `epochs ${accepted[0]} to ${accepted[accepted.length - 1]}`);
  // the generated table
  eachVariant('training-in-practice', 'early-stop-gen', (s) => {
    const rows = tableRows(s.text);
    const epochs = rows[0].slice(1).map(Number);
    const train = rows[1].slice(1).map(Number);
    const val = rows[2].slice(1).map(Number);
    const lowest = Math.min(...val);
    assert.equal(val.filter((v) => v === lowest).length, 1, 'one lowest validation loss');
    assert.equal(s.answer, epochs[val.indexOf(lowest)]);
    for (let i = 1; i < 6; i++) assert.ok(train[i] < train[i - 1], 'the training loss keeps falling');
    for (let i = val.indexOf(lowest) + 1; i < 6; i++) assert.ok(val[i] > val[i - 1], 'the validation loss rises after its lowest point');
    assert.ok(train.every((v) => v > 0));
    assert.deepEqual(s.wrong.map((w) => w[0]), [60]);
    assert.ok(s.wrong[0][1].includes(`rising since epoch ${s.answer}`));
    assert.ok(s.explain.includes(`lowest at epoch ${s.answer} (${lowest.toFixed(2)})`));
  });
});

test('training-in-practice: small batches and a schedule, over many random orders', () => {
  const batchStep = raw('training-in-practice', 'lab-batch');
  const rate = batchStep.widget.rate;
  const full = summarize(trainRun({ rate, batch: 12 }), H.LAB.goal);
  assert.equal(full.reached, H.LAB.reach[rate]);
  assert.equal(full.bumps, 0, 'with every plant in every step the curve is smooth');
  const schedule = raw('training-in-practice', 'lab-schedule');
  for (let seed = 1; seed <= 200; seed++) {
    // the widget draws its batches from env.rng.fork(...): any seed must tell the same story
    const small = summarize(trainRun({ rate, batch: 2 }, makeRng(seed * 104729).fork('loss-curves')), H.LAB.goal);
    assert.equal(small.diverged, false);
    assert.ok(small.reached >= 24 && small.reached <= 38, `batches of 2 reach the goal after about 30 epochs (seed ${seed}: ${small.reached})`);
    assert.ok(small.bumps > 80, 'and the curve is jagged');
    near(full.reached / small.reached, 6, 1.6, 'about a sixth of the work');
    const settings = { rate: schedule.widget.rate, batch: schedule.widget.batch };
    const constantRate = summarize(trainRun({ ...settings, decay: false }, makeRng(seed * 7919).fork('a')), H.LAB.goal);
    const decayed = summarize(trainRun({ ...settings, decay: true }, makeRng(seed * 7919).fork('a')), H.LAB.goal);
    assert.ok(!constantRate.diverged && !decayed.diverged);
    assert.equal(constantRate.reached, decayed.reached, 'for the first 50 epochs the two runs are the same run');
    assert.ok(constantRate.reached < 50);
    assert.ok(constantRate.lateBumps >= 30 && decayed.lateBumps <= 15, `jumping to the end against settling (seed ${seed}: ${constantRate.lateBumps}, ${decayed.lateBumps})`);
  }
  // the two exploration checks
  const run12 = { batch: 12 }; const run2 = { batch: 2 };
  assert.match(batchStep.check({ runs: 0, history: [] }), /Press “Train”/);
  assert.match(batchStep.check({ runs: 1, history: [run2] }), /batch size at 12/);
  assert.match(batchStep.check({ runs: 1, history: [run12] }), /batch size down to 2/);
  assert.equal(batchStep.check({ runs: 2, history: [run12, run2] }), true);
  assert.deepEqual(batchStep.solution.runs.map((r) => r.batch), [12, 2]);
  assert.match(schedule.check({ runs: 0, history: [] }), /Press “Train” first/);
  assert.match(schedule.check({ runs: 1, history: [{ decay: true }] }), /switched off, for comparison/);
  assert.match(schedule.check({ runs: 1, history: [{ decay: false }] }), /halves the rate/);
  assert.equal(schedule.check({ runs: 2, history: [{ decay: false }, { decay: true }] }), true);
});

/* ----------------------------------------------------- lesson 5: embeddings */

const MAP = H.WORD_MAP;
const at = (word) => MAP.find((w) => w.text === word).at;
/** The other words in order of distance; ties keep the order of the list, as in the widget. */
const byDistance = (from, words = MAP, self = null) => words.filter((w) => w.text !== self).map((w) => ({ word: w.text, value: distance(from, w.at) })).sort((a, b) => a.value - b.value);

test('embeddings: the hand-made map is what the lesson says it is', () => {
  assert.deepEqual(MAP, WIDGET_WORDS, 'the lessons and the widget use the same map');
  assert.equal(MAP.length, 12);
  // three clusters: every word's three closest words belong to its own group
  for (const w of MAP) {
    const closest = byDistance(w.at, MAP, w.text);
    assert.ok(closest.slice(0, 3).every((n) => H.groupOf(n.word) === w.group), `${w.text}: its three closest words are in its own group`);
    assert.ok(closest[1].value - closest[0].value > 1e-9, `${w.text}: no tie for the closest word`);
    assert.deepEqual(widgetRank(MAP, w.text).slice(0, 3).map((n) => n.word), closest.slice(0, 3).map((n) => n.word));
  }
  assert.ok(distance(at('cat'), at('cheese')) >= 6, '"cat" is a long way from "cheese"');
  // the first task: only "king" has "queen" as its closest word
  const step = raw('embeddings', 'explore-map');
  const winners = [];
  for (const w of MAP) {
    const neighbours = byDistance(w.at, MAP, w.text).slice(0, 3);
    const verdict = step.check({ selected: w.text, neighbours });
    if (verdict === true) winners.push(w.text);
    else if (w.text === 'queen') assert.match(verdict, /itself/);
    else assert.ok(verdict.includes(`is “${neighbours[0].word}”, not “queen”`));
  }
  assert.deepEqual(winners, ['king']);
  assert.equal(step.solution.selected, 'king');
  near(distance(at('king'), at('queen')), 2);
  assert.equal(byDistance(at('woman'), MAP, 'woman')[0].word, 'man');
});

test('embeddings: dot products and cosines', () => {
  const hand = fixed('embeddings', 'dot-by-hand');
  assert.deepEqual(vectorsIn(hand.text), [at('cat'), at('dog'), at('bread')]);
  assert.deepEqual(hand.blanks.map((b) => b.numbers[0]), [3 * 4 + 4 * 3, 3 * 2 + 4 * -4]);
  eachVariant('embeddings', 'cosine-gen', (step) => {
    const [a, b] = vectorsIn(step.text);
    near(norm(a), 5, 1e-12, 'each of length 5'); near(norm(b), 5, 1e-12);
    const cos = dot(a, b) / (norm(a) * norm(b));
    near(step.answer, cos, 1e-9);
    assert.ok(a[0] !== b[0] || a[1] !== b[1], 'two different vectors');
    for (const [wrong, why] of step.wrong) {
      if (/That is the dot product/.test(why)) assert.equal(wrong, dot(a, b));
      if (/divided by one length/.test(why)) assert.equal(wrong, dot(a, b) / 5);
    }
    assert.equal(/right angles/.test(step.explain), Math.abs(cos) < 1e-12);
    assert.equal(/opposite directions/.test(step.explain), Math.abs(cos + 1) < 1e-12);
    assert.ok(step.explain.includes(`= ${String(round(cos, 4))}$`));
  });
  // by cosine the most similar word to "kitten" is "cat"; by distance it is "puppy"
  const choice = fixed('embeddings', 'cosine-map');
  const kitten = at('kitten');
  const cosines = MAP.filter((w) => w.text !== 'kitten').map((w) => [w.text, dot(kitten, w.at) / (norm(kitten) * norm(w.at))]).sort((p, q) => q[1] - p[1]);
  assert.equal(cosines[0][0], 'cat');
  assert.ok(cosines[0][1] - cosines[1][1] > 0.01, 'clearly ahead of the runner-up');
  assert.equal(choice.options.find((o) => o.correct).text, 'cat');
  assert.equal(byDistance(kitten, MAP, 'kitten')[0].word, 'puppy');
  for (const option of choice.options.filter((o) => !o.correct)) {
    const quoted = Number(/(\d\.\d+)/.exec(option.why)[1]);
    near(quoted, cosines.find((c) => c[0] === option.text)[1], 0.005, `the cosine quoted for ${option.text}`);
  }
  assert.equal(widgetRank(MAP, 'kitten', 'cosine')[0].word, 'cat');
  assert.equal(choice.figures[0].measure, 'cosine');
});

test('embeddings: placing a new word', () => {
  const step = raw('embeddings', 'place-word');
  const words = step.widget.words;
  assert.deepEqual(words.slice(0, 12), MAP);
  assert.deepEqual(step.widget.drag, ['tiger']);
  let good = 0;
  for (const x of range(-6.5, 6.5, 0.5)) for (const y of range(-6.5, 6.5, 0.5)) {
    const neighbours = byDistance([x, y], MAP).slice(0, 3);
    const verdict = step.check({ selected: 'tiger', neighbours });
    const allAnimals = neighbours.every((n) => H.groupOf(n.word) === 0);
    assert.equal(verdict === true, allAnimals, `tiger at ${x}, ${y}`);
    if (allAnimals) { good += 1; continue; }
    const named = /is now “([a-z]+)”, and that is (an animal|a person|a food)/.exec(verdict);
    assert.ok(neighbours.some((n) => n.word === named[1]), 'the word it names is one of the three');
    assert.equal(named[2], ['an animal', 'a person', 'a food'][H.groupOf(named[1])]);
    assert.notEqual(H.groupOf(named[1]), 0);
  }
  assert.ok(good > 40, `${good} places work`);
  const [sx, sy] = step.solution.positions.tiger;
  assert.equal(step.check({ selected: 'tiger', neighbours: byDistance([sx, sy], MAP).slice(0, 3) }), true);
  assert.match(step.check({ selected: 'cat', neighbours: [] }), /Tap or drag “tiger”/);
});

test('embeddings: word arithmetic on the map', () => {
  const sum = (a, b, c) => [at(c)[0] - at(a)[0] + at(b)[0], at(c)[1] - at(a)[1] + at(b)[1]];
  // king − man + woman lands exactly on queen
  const hand = fixed('embeddings', 'analogy-by-hand');
  assert.deepEqual(vectorsIn(hand.text), [at('man'), at('woman'), at('king')]);
  assert.deepEqual(hand.blanks.map((b) => b.numbers[0]), [at('woman')[0] - at('man')[0], at('woman')[1] - at('man')[1], ...sum('man', 'woman', 'king')]);
  assert.deepEqual(sum('man', 'woman', 'king'), at('queen'));
  assert.match(hand.explain, /exactly where “queen” sits/);
  // dog − cat + kitten lands exactly on puppy; the check accepts that spot and no other
  const step = raw('embeddings', 'analogy-map');
  assert.deepEqual([step.widget.offset.from, step.widget.offset.to], ['cat', 'kitten']);
  const spot = sum('cat', 'kitten', 'dog');
  assert.deepEqual(spot, at('puppy'));
  let hits = 0;
  for (const x of range(-6.5, 6.5, 0.5)) for (const y of range(-6.5, 6.5, 0.5)) {
    const verdict = step.check({ probe: [x, y] });
    assert.equal(verdict === true, x === spot[0] && y === spot[1]);
    if (verdict === true) hits += 1;
    else if (x === at('kitten')[0] && y === at('kitten')[1]) assert.match(verdict, /tip of the arrow/);
    else if (x === at('dog')[0] && y === at('dog')[1]) assert.match(verdict, /“dog” itself/);
    else assert.ok(verdict.includes('(1.5, 1.5)') && verdict.includes('(4, 3)'), 'the hint quotes the step and where dog is');
  }
  assert.equal(hits, 1);
  assert.deepEqual(step.solution.probe, spot);
  assert.match(step.explain, /\(4, 3\) plus \(1\.5, 1\.5\) is \(5\.5, 4\.5\), and there sits “puppy”/);
  // the sum that makes no sense: bread − apple + pear lands nearest to "bread" itself
  const odd = fixed('embeddings', 'caveat');
  const where = sum('apple', 'pear', 'bread');
  assert.deepEqual(odd.figures[0].probe.at, where);
  assert.ok(odd.text.includes(`(${where[0]}, −${Math.abs(where[1])})`));
  const closest = byDistance(where, MAP);
  assert.equal(closest[0].word, 'bread');
  assert.ok(closest[1].value - closest[0].value > 0.5);
  assert.equal(odd.options.find((o) => o.correct).text, 'bread');
  assert.equal(nearestTo(MAP, where).word, 'bread');
  for (const option of odd.options.filter((o) => !o.correct && /away from the dot/.test(o.why))) near(Number(/(\d+(?:\.\d+)?) away/.exec(option.why)[1]), distance(where, at(option.text)), 0.005);
  near(Number(/“bread”, (\d\.\d+) away/.exec(odd.explain)[1]), distance(where, at('bread')), 0.005);
  assert.equal(odd.figures[0].line, false, 'the picture does not give the answer away');
});

test('embeddings: the size of an embedding table', () => {
  eachVariant('embeddings', 'table-size', (step) => {
    const [tokens, size] = boldNumbers(step.text);
    let total = 0;
    for (let i = 0; i < size; i++) total += tokens;     // one column at a time
    assert.equal(step.answer, total);
    assert.ok(step.explain.replace(/\{,\}/g, '').includes(`${tokens} \\times ${size} = ${total}$`));
    assert.deepEqual(step.wrong.map((w) => w[0]), [tokens + size, tokens]);
  });
});

/* ------------------------------------------------------ lesson 6: attention */

/** One step of the simplified attention of the lesson, written out with loops. */
function attentionOf(vectors, base = Math.E) {
  const weights = [];
  const out = [];
  const scores = [];
  for (const a of vectors) {
    const row = vectors.map((b) => a[0] * b[0] + a[1] * b[1]);
    const w = softmaxOf(row, base);
    scores.push(row);
    weights.push(w);
    out.push([0, 1].map((k) => { let t = 0; vectors.forEach((v, j) => { t += w[j] * v[k]; }); return t; }));
  }
  return { scores, weights, out };
}

test('attention: "the river bank" by hand, and with real softmax', () => {
  const the = [0.5, 0.5]; const river = [0, 2]; const money = [2, 0]; const bank = [1, 1];
  assert.deepEqual([H.THE.v, H.RIVER.v, H.MONEY.v, H.BANK.v], [the, river, money, bank]);
  const scoresStep = fixed('attention', 'scores');
  assert.deepEqual(vectorsIn(scoresStep.text), [bank]);
  assert.deepEqual(scoresStep.figures[0].vectors.map((v) => [v.label, v.x, v.y]), [['river', ...river], ['bank', ...bank], ['the', ...the]]);
  assert.deepEqual(scoresStep.blanks.map((b) => b.numbers[0]), [dot(bank, the), dot(bank, river), dot(bank, bank)]);
  assert.deepEqual([dot(bank, the), dot(bank, river), dot(bank, bank)], [1, 2, 2]);
  const hand = attentionOf([the, river, bank], 2);
  const weightsStep = fixed('attention', 'weights');
  assert.deepEqual(weightsStep.blanks.map((b) => b.numbers[0]), [2, 4, 4, 10, ...hand.weights[2]]);
  assert.deepEqual(hand.weights[2], [0.2, 0.4, 0.4]);
  const mix = fixed('attention', 'average');
  mix.blanks.forEach((b, k) => near(b.numbers[0], hand.out[2][k], 1e-9, `number ${k} of the new vector`));
  near(hand.out[2][0], 0.5, 1e-12); near(hand.out[2][1], 1.3, 1e-12);
  assert.deepEqual(vectorsIn(mix.text), [the, river, bank]);
  // with e, as the widget does it
  const real = attentionOf([the, river, bank]);
  const withMoney = attentionOf([the, money, bank]);
  const swap = raw('attention', 'swap');
  assert.deepEqual(swap.widget.tokens.map((t) => t.v), [the, river, bank]);
  assert.deepEqual(swap.widget.swap, { index: 1, options: [{ text: 'river', v: river }, { text: 'money', v: money }] });
  assert.notEqual(swap.widget.base, 2);
  assert.ok(swap.explain.includes(`(${round(real.out[2][0], 2)}, ${round(real.out[2][1], 2)})`), 'the new bank next to river');
  assert.ok(swap.explain.includes(`(${round(withMoney.out[2][0], 2)}, ${round(withMoney.out[2][1], 2)})`), 'the new bank next to money');
  assert.ok(swap.explain.includes(real.weights[2].map((w) => round(w, 2)).join(', ')), 'the weights with base e');
  assert.ok(real.out[2][1] > real.out[2][0] && withMoney.out[2][0] > withMoney.out[2][1], 'mostly water, then mostly money');
  assert.equal(typeof swap.check({ seen: [0] }), 'string');
  assert.equal(swap.check({ seen: [0, 1] }), true);
  // the widget and the helper compute the same thing
  for (const [vectors, base] of [[[the, river, bank], Math.E], [[the, money, bank], Math.E], [[the, river, bank], 2], [[[2, 0], [0, 2], [1.5, -0.5]], Math.E]]) {
    const mine = attentionOf(vectors, base);
    const w = attend(vectors, base);
    const hp = H.attention(vectors, base);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { near(w.weights[i][j], mine.weights[i][j], 1e-12); near(hp.weights[i][j], mine.weights[i][j], 1e-12); assert.equal(w.scores[i][j], mine.scores[i][j]); }
    for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) { near(w.out[i][k], mine.out[i][k], 1e-12); near(hp.out[i][k], mine.out[i][k], 1e-12); }
  }
});

test('attention: a weighted average, and weights from dot products', () => {
  eachVariant('attention', 'mix-gen', (step) => {
    const vectors = vectorsIn(step.text);
    assert.equal(vectors.length, 3);
    const weights = bolds(step.text).find((b) => /^[\d., ]+$/.test(b)).split(',').map(Number);
    near(weights[0] + weights[1] + weights[2], 1, 1e-12, 'the weights add up to 1');
    const k = /top number/.test(step.text) ? 0 : 1;
    assert.ok(/(top|bottom) number/.test(step.text));
    let mixed = 0;
    for (let j = 0; j < 3; j++) mixed += weights[j] * vectors[j][k];
    near(step.answer, mixed, 1e-9);
    const names = tableRows(step.text)[0];
    for (const [wrong, why] of step.wrong) {
      if (/plain average/.test(why)) near(wrong, (vectors[0][k] + vectors[1][k] + vectors[2][k]) / 3, 1e-4);
      const fav = /number of “([a-z]+)” alone, the token with the largest weight/.exec(why);
      if (fav) {
        const j = names.indexOf(fav[1]);
        assert.equal(wrong, vectors[j][k]);
        assert.ok(weights.every((w, i) => i === j || w < weights[j]), 'that token really has the largest weight');
      }
    }
    assert.ok(step.explain.includes(`= ${String(round(mixed, 4))}$`));
  });
  eachVariant('attention', 'weight-gen', (step) => {
    const [own, ...others] = vectorsIn(step.text);
    assert.deepEqual(own, [1, 1]);
    assert.equal(others.length, 3);
    const names = tableRows(step.text)[0];
    const which = names.indexOf(/give to "([a-z]+)"/.exec(step.text)[1]);
    assert.ok(which >= 0);
    const scores = others.map((v) => dot(own, v));
    const weights = softmaxOf(scores, 2);
    near(step.answer, weights[which], 1e-9);
    assert.equal(round(step.answer, 2), round(step.answer, 9), 'the weight has at most two decimals');
    assert.ok(step.hints[0].includes(`They are ${scores.join(', ')}.`), 'the hint quotes the scores');
    const powers = scores.map((s) => 2 ** s);
    assert.ok(step.hints[1].includes(`are ${powers.join(', ')}, with a total of ${powers[0] + powers[1] + powers[2]}.`), 'the hint quotes the powers');
    for (const [wrong, why] of step.wrong) {
      if (/share of the raw scores/.test(why)) near(wrong, scores[which] / (scores[0] + scores[1] + scores[2]), 1e-9);
      if (/2 to the power of the score/.test(why)) assert.equal(wrong, powers[which]);
    }
  });
});

test('attention: steering "it" towards "dog"', () => {
  const step = raw('attention', 'steer');
  const [dog, ball, it] = step.widget.tokens.map((t) => t.v);
  assert.deepEqual([dog, ball, it], [[2, 0], [0, 2], [1, 1]]);
  attentionOf([dog, ball, it]).weights[2].forEach((w) => near(w, 1 / 3, 1e-12, 'one third each at the start'));
  const { x, y } = step.widget.window;
  const snap = step.widget.snap;
  const winners = [];
  for (const px of range(x[0], x[1], snap)) for (const py of range(y[0], y[1], snap)) {
    const weights = attentionOf([dog, ball, [px, py]]).weights;
    const [toDog, toBall, toSelf] = weights[2];
    const verdict = step.check({ weights, vectors: [dog, ball, [px, py]] });
    assert.equal(verdict === true, toDog >= 0.6, `it at ${px}, ${py}`);
    if (verdict === true) { winners.push(`${px},${py}`); continue; }
    if (/more weight to itself/.test(verdict)) assert.ok(toSelf > toDog && toSelf > toBall);
    else if (/no preference for “dog”/.test(verdict)) assert.ok(toBall >= toDog);
    else { assert.match(verdict, /more than to “ball”, but not yet 0\.6/); assert.ok(toDog > toBall && toDog < 0.6); }
  }
  assert.deepEqual(winners.sort(), ['1,-0.5', '1,0', '1.5,-0.5', '1.5,0'], 'the places that work');
  assert.deepEqual(step.solution.vectors, [dog, ball, [1, 0]]);
  const sol = attentionOf(step.solution.vectors);
  assert.deepEqual(sol.scores[2], [2, 0, 1], 'the scores quoted in the explanation');
  assert.ok(step.explain.includes(`gives “dog” ${round(sol.weights[2][0], 2)} of the weight`));
});

test('attention: the pipeline is in a sensible order, and the four omissions are named', () => {
  const order = fixed('attention', 'pipeline').items;
  const position = (re) => order.findIndex((item) => re.test(item));
  const sequence = [/tokens$/, /embedding/, /Attention layers/, /score to every token/, /Softmax/, /Pick a token/].map(position);
  assert.deepEqual(sequence, [0, 1, 2, 3, 4, 5]);
  const left = fixed('attention', 'left-out');
  assert.deepEqual(left.pairs.map((p) => p[0]), ['Positional information', 'Query, key and value weights', 'Normalisation', 'Feed-forward layers']);
  const recap = lessons.attention.recap.join(' ');
  for (const word of ['positional information', 'query, key and value', 'normalisation', 'feed-forward']) assert.ok(recap.toLowerCase().includes(word), `the recap names ${word}`);
  // the remark about order: a weighted average does not depend on the order of the tokens
  const a = attentionOf([[1, 0], [0, 2], [1, 1]]);
  const b = attentionOf([[0, 2], [1, 0], [1, 1]]);
  a.out[2].forEach((v, k) => near(v, b.out[2][k], 1e-12, 'swapping two tokens leaves the third one’s new vector unchanged'));
});

/* ------------------------------------------- added by the accuracy review */

/** A number as a widget reports it in its state: rounded to a few decimals. */
const tidied = (v, places = 6) => Math.round(v * 10 ** places) / 10 ** places;
/** A number as a widget prints it: two decimals, no trailing zeros. */
const printed = (v, places = 2) => String(Math.round(v * 10 ** places) / 10 ** places);

test('review: the checks give the same verdicts on the rounded numbers the widgets really report', () => {
  // softmax-bars reports probabilities and the loss to 6 decimals
  const eighty = raw('scores-to-probabilities', 'eighty');
  let hits = 0;
  for (const a of range(-3, 5)) for (const b of range(-3, 5)) for (const c of range(-3, 5)) {
    const probs = softmaxOf([a, b, c], 2).map((p) => tidied(p));
    const verdict = eighty.check({ scores: [a, b, c], probs });
    assert.equal(verdict === true, a === b + 3 && a === c + 3, `scores ${a}, ${b}, ${c}`);
    if (verdict === true) { hits += 1; continue; }
    // some other settings print as "0.8" on screen (0.795, 0.798): the feedback has to show the third decimal
    if (printed(probs[0]) === '0.8') assert.match(verdict, /Cat has 0\.79[58]\./, `scores ${a}, ${b}, ${c} print as 0.8 and are refused`);
  }
  assert.equal(hits, 6);
  const temp = raw('scores-to-probabilities', 'temperature');
  for (const T of range(temp.widget.temperature.min, temp.widget.temperature.max, temp.widget.temperature.step)) {
    const exact = softmaxOf(temp.widget.scores, Math.E, T);
    const verdict = temp.check({ temperature: T, probs: exact.map((p) => tidied(p)) });
    assert.equal(verdict === true, Math.round(exact[3] * 100) >= 20, `temperature ${T}`);
    // 3.4 and 3.6 print "0.2" for rug while it is still below 0.2: the feedback quotes three decimals, so the learner can see why
    if (verdict !== true && printed(exact[3]) === '0.2') assert.ok(verdict.includes(`“rug” has ${printed(exact[3], 3)}.`) && exact[3] < 0.2, `temperature ${T}`);
  }
  const lossStep = raw('scores-to-probabilities', 'loss-explore');
  for (const cat of range(-4, 6, 0.5)) for (const dog of range(-4, 6, 0.5)) {
    const probs = softmaxOf([cat, dog, 0]);
    const loss = tidied(-Math.log(probs[0]));
    const verdict = lossStep.check({ scores: [cat, dog, 0], probs: probs.map((p) => tidied(p)), loss });
    assert.equal(verdict === true, probs[0] < Math.exp(-5), `cat ${cat}, dog ${dog}`);
    // no setting prints a loss of exactly "5" and is then refused (or accepted) against what the screen says
    assert.ok(Math.abs(loss - 5) > 0.005, `cat ${cat}, dog ${dog}: the loss ${loss} would print as 5`);
  }
  // attention-grid reports weights to 6 decimals and prints 2
  const steer = raw('attention', 'steer');
  for (const px of range(-1, 3, 0.5)) for (const py of range(-2, 3, 0.5)) {
    const exact = attentionOf([[2, 0], [0, 2], [px, py]]).weights;
    const verdict = steer.check({ weights: exact.map((row) => row.map((w) => tidied(w))), vectors: [[2, 0], [0, 2], [px, py]] });
    assert.equal(verdict === true, exact[2][0] >= 0.6, `it at ${px}, ${py}`);
    assert.ok(verdict === true || Number(printed(exact[2][0])) < 0.6, `it at ${px}, ${py}: prints as ${printed(exact[2][0])} and is refused`);
  }
  // loss-curves reports losses to 4 decimals
  const stop = raw('training-in-practice', 'validation');
  const result = trainRun({ rate: stop.widget.rate, batch: stop.widget.batch });
  const facts = summarize(result);
  const accepted = range(0, 300).filter((epoch) => stop.check({ epoch, valAt: tidied(result.val[epoch], 4), trainAt: tidied(result.train[epoch], 4), bestVal: facts.bestVal, bestEpoch: facts.bestEpoch }) === true);
  assert.deepEqual(accepted, range(68, 96), 'epochs 68 to 96 are accepted, and nothing else');
  // relu-builder reports the gap to 3 decimals; 10 hinges is the first setting below 0.1
  const hinges = raw('activation-functions', 'more-hinges');
  const wave = (x) => 2 + 1.5 * Math.sin(1.2 * x);
  const gaps = range(1, 16).map((n) => { const fit = fitHinges(wave, 0, 6, n); return tidied(largestGap((x) => hingeSum(fit.units, fit.bias, x), wave, 0, 6, fit.units.map((u) => u.at)), 3); });
  gaps.forEach((gap, i) => assert.equal(hinges.check({ n: i + 1, gap }) === true, i + 1 >= 10, `${i + 1} hinges, gap ${gap}`));
  assert.ok(gaps[9] < 0.1 && gaps[8] > 0.11, `9 hinges ${gaps[8]}, 10 hinges ${gaps[9]}`);
});

test('review: squared error goes flat against the scores, not against the probability; cross-entropy does not', () => {
  const explain = fixed('scores-to-probabilities', 'why-not-squared').explain.replace(/\s+/g, ' ');
  assert.match(explain, /plotted against the scores, its curve goes flat exactly where the network is most wrong/);
  // three classes; z is the score of the right answer, the other two scores stay at 0
  const p = (z) => softmaxOf([z, 0, 0])[0];
  const squared = (z) => (1 - p(z)) ** 2;
  const crossEntropy = (z) => -Math.log(p(z));
  let before = Infinity;
  for (const z of [-2, -4, -6, -8, -10]) {
    const s = Math.abs(slope(squared, z));
    assert.ok(s < before, 'the more wrong the network, the flatter the squared error is against the score');
    before = s;
    assert.ok(Math.abs(slope(crossEntropy, z)) > 0.75, 'while cross-entropy keeps a slope close to 1');
    assert.ok(Math.abs(slope(crossEntropy, z)) > Math.abs(slope(crossEntropy, z + 1)), '"the worse the mistake, the stronger the push"');
  }
  assert.ok(before < 1e-3 && squared(-10) < 1 && squared(-10) > 0.999, 'squared error is stuck just under its ceiling of 1');
  assert.ok(crossEntropy(-10) > 10 && crossEntropy(-20) > 20, 'cross-entropy has no ceiling');
  // against the probability itself, squared error is at its steepest where the network is most wrong: the sentence needs "against the scores"
  near(slope((q) => (1 - q) ** 2, 0.001), -2, 0.01);
});

test('review: the schedule step compares two runs on the same batches', () => {
  // the widget must not put the schedule into the label of its random stream, or "for the first 50 epochs they are the same run" is false
  const label = /env\.rng\.fork\(`([^`]*)`\)/.exec(source);
  assert.ok(label, 'the widget draws its batches from a fork of env.rng');
  assert.ok(/\$\{rate\}/.test(label[1]) && /\$\{batch\}/.test(label[1]) && !/decay/.test(label[1]), `the stream depends on the rate and the batch size only (label: ${label[1]})`);
  const schedule = raw('training-in-practice', 'lab-schedule');
  assert.match(schedule.explain, /for the first 50 epochs they are the same run/);
  const settings = { rate: schedule.widget.rate, batch: schedule.widget.batch };
  for (let seed = 1; seed <= 60; seed++) {
    const stream = () => makeRng(seed * 15485863).fork(`loss-curves ${settings.rate} ${settings.batch}`);
    const constantRate = trainRun({ ...settings, decay: false }, stream());
    const decayed = trainRun({ ...settings, decay: true }, stream());
    for (let e = 0; e <= 50; e++) assert.equal(decayed.train[e], constantRate.train[e], `seed ${seed}: epoch ${e} is the same in both runs`);
    assert.notEqual(decayed.train[60], constantRate.train[60], 'after epoch 50 they part ways');
    // "the jumps die away": in the last 100 epochs the halved run moves by less than a hundredth of what the constant run does
    const jump = (t) => Math.max(...range(201, 300).map((e) => Math.abs(t[e] - t[e - 1])));
    assert.ok(jump(decayed.train) < 0.002 && jump(constantRate.train) > 10 * jump(decayed.train), `seed ${seed}: ${jump(constantRate.train)} against ${jump(decayed.train)}`);
  }
});

test('review: the recap of lesson 1 keeps the approximation claim modest', () => {
  const recap = lessons['activation-functions'].recap.join(' ');
  assert.match(recap, /follow any continuous curve closely over a limited range of inputs/);
  assert.match(raw('activation-functions', 'more-hinges').explain.replace(/\s+/g, ' '), /any continuous curve over a limited range of inputs/);
  // why the range matters: a fixed sum of hinges is a straight line beyond its last kink, so it cannot follow the wave for ever
  const wave = (x) => 2 + 1.5 * Math.sin(1.2 * x);
  const fit = fitHinges(wave, 0, 6, 16);
  const inside = largestGap((x) => hingeSum(fit.units, fit.bias, x), wave, 0, 6);
  const outside = largestGap((x) => hingeSum(fit.units, fit.bias, x), wave, 6, 30);
  assert.ok(inside < 0.05 && outside > 3, `gap ${inside} inside the range, ${outside} outside it`);
  // "just below 1" and "just above 0": wherever the point can be dragged, the sigmoid's readout never prints as a plain 1 or 0
  const fig = fixed('activation-functions', 'sigmoid').figures[0];
  const point = fig.points[0];
  const output = fig.readouts.find((ro) => ro.label === 'output');
  for (const score of range(fig.x[0], fig.x[1], point.snap)) {
    const shown = printed(1 / (1 + Math.exp(-score)), output.digits);
    assert.ok(Number(shown) > 0 && Number(shown) < 1, `a score of ${score} prints as ${shown}`);
  }
});

test('review: more of each generated step, re-read from its own text', () => {
  const again = (lessonId, stepId, verify) => {
    const step = raw(lessonId, stepId);
    for (let seed = 1; seed <= SEEDS; seed++) {
      const s = resolveStep(step, makeRng(seed * 48271 + 11), stepId);
      try { verify(s); } catch (err) { err.message = `${lessonId}/${stepId} (review seed ${seed}): ${err.message}\n  text: ${s.text.replace(/\s+/g, ' ').trim()}`; throw err; }
    }
  };
  const flat = (text) => text.replace(/\s+/g, ' ');
  const linearIn = (text, letter) => { const f = compile(text, { vars: [letter] }); const b = f({ [letter]: 0 }) + 0; return [f({ [letter]: 1 }) - b + 0, b]; };   // "+ 0" turns −0 into 0
  again('activation-functions', 'compose-gen', (s) => {
    const [a, b] = linearIn(/h = ([^$]+)\$/.exec(s.text)[1], 'x');
    const [c, d] = linearIn(/y = ([^$]+)\$/.exec(s.text)[1], 'h');
    for (const [slip, why] of s.wrong) {
      const [m, k] = linearIn(slip, 'x');
      if (/slope is right/.test(why)) { assert.deepEqual([m, k], [a * c, b + d]); assert.ok(why.includes(`$${b}$`) && why.includes(`$${c}$`) && why.includes(`$${d}$`), why); }
      if (/do not add/.test(why)) { assert.deepEqual([m, k], [a + c, c * b + d]); assert.notEqual(a + c, a * c, 'only listed when adding the slopes gives a wrong slope'); }
      if (/Do not lose/.test(why)) { assert.deepEqual([m, k], [a * c, d]); assert.ok(why.includes(`= ${c * b}$`), why); }
    }
    assert.equal(s.wrong.length, a + c === a * c ? 2 : 3);
    assert.equal(s.expanded, true);
  });
  again('activation-functions', 'relu-neuron', (s) => {
    const [w1, w2, bias, x1, x2] = bolds(s.text).map(N);
    const terms = /The score is (−?\d+) ([+−]) (\d+) ([+−]) (\d+) = (−?\d+)\./.exec(s.explain);
    assert.ok(terms, s.explain);
    assert.deepEqual([N(terms[1]), (terms[2] === '−' ? -1 : 1) * terms[3], (terms[4] === '−' ? -1 : 1) * terms[5], N(terms[6])], [w1 * x1, w2 * x2, bias, w1 * x1 + w2 * x2 + bias]);
    if (w1 * x1 + w2 * x2 + bias > 0) assert.ok(s.explain.includes(`puts out ${w1 * x1 + w2 * x2 + bias}.`));
  });
  again('activation-functions', 'hinge-sum', (s) => {
    const tex = flat(/\$\$([\s\S]+?)\$\$/.exec(s.text)[1]);
    const kinks = Array.from(tex.matchAll(/\\text\{ReLU\}\(x(?: ([+-]) (\d+))?\)/g), (m) => (m[1] ? (m[1] === '-' ? 1 : -1) * Number(m[2]) : 0));
    const x = Number(/when \$x = (-?\d+)\$/.exec(s.text)[1]);
    assert.equal(kinks.length, 2);
    assert.ok(kinks[0] < kinks[1] && x > kinks[0] && x !== kinks[1], 'x is right of the first kink and never exactly on one');
    assert.ok(flat(s.hints[0]).includes(`\\text{ReLU}(${x - kinks[0]})$ and $\\text{ReLU}(${x - kinks[1]})$`), s.hints[0]);
    assert.ok(flat(s.hints[1]).includes(`$${relu(x - kinks[0])}$ and $${relu(x - kinks[1])}$`), s.hints[1]);
  });
  // softmax from the table: every case there is, not only the ones the seeds happen to draw
  const E = [1, 2.72, 7.39, 20.09];
  for (const a of [0, 1, 2, 3]) for (const b of [0, 1, 2, 3]) for (const c of [0, 1, 2, 3]) {
    if (a === b && b === c) continue;
    const exact = softmaxOf([a, b, c]);
    const total = E[a] + E[b] + E[c];
    [a, b, c].forEach((score, i) => {
      const key = round(exact[i], 2);
      const fromTable = E[score] / total;
      assert.equal(round(fromTable, 2), key, `scores ${a}, ${b}, ${c}: the table gives the same two decimals as e itself`);
      near(Math.floor(fromTable * 100) / 100, key, 0.01 + 1e-12, 'an answer cut off after two decimals is still accepted (the player allows the tolerance plus 1e-12)');
    });
  }
  again('scores-to-probabilities', 'softmax-gen', (s) => {
    assert.equal(s.tolerance, 0.01);
    const quoted = /is \$([\d.]+) \\div ([\d.]+) \\approx ([\d.]+)\$/.exec(flat(s.explain));
    assert.ok(quoted, s.explain);
    near(Number(quoted[1]) / Number(quoted[2]), Number(quoted[3]), 0.005 + 1e-9, 'the division in the explanation');
    assert.equal(Number(quoted[3]), s.answer);
  });
  again('scores-to-probabilities', 'loss-halving', (s) => {
    const p = N(bolds(s.text)[0]);
    const k = Math.round(-Math.log2(p));
    // every fair way of writing the answer is accepted: the rule with 0.693 or 0.69, rounded or cut off, or the logarithm itself
    for (const typed of [k * 0.693, round(k * 0.693, 2), Math.floor(k * 0.693 * 100) / 100, k * 0.69, round(-Math.log(p), 2), -Math.log(p)]) near(typed, s.answer, s.tolerance + 1e-12, `${typed} is accepted`);
    near(Number(/= ([\d.]+)\$\.\)/.exec(flat(s.explain))[1]), -Math.log(p), 0.00051, 'the logarithm quoted in the explanation');
  });
  again('backpropagation', 'chain-gen', (s) => {
    const rates = tableRows(s.text).slice(1).map((row) => N(/\$(-?\d+)\$\s*$/.exec(row[1])[1]));
    const product = rates[0] * rates[1] * rates[2];
    assert.equal(Math.sign(s.answer), Math.sign(product), 'the loss falls exactly when the product of the rates is negative');
    for (const [slip, why] of s.wrong) if (/Check the sign/.test(why)) near(slip, -product / 10);
    near(Number(/= (-?[\d.]+)\$\.$/.exec(flat(s.explain).trim())[1]), product / 10, 1e-9, 'the last number of the explanation');
  });
  again('backpropagation', 'one-weight', (s) => {
    const [x, z, v, g] = bolds(s.text).slice(0, 4).map(N);
    assert.notEqual(z, 0, 'the score is never exactly on the kink');
    for (const [slip, why] of s.wrong) if (/part of the chain too/.test(why)) { assert.ok(z > 0); assert.equal(slip, g * x); }
    if (z > 0) assert.ok(flat(s.explain).includes(`= ${g * v}$`) && flat(s.explain).includes(`$${g * v * x}$.`), s.explain);
    else assert.ok(flat(s.explain).includes(`$${g * v} \\times 0 = 0$`), s.explain);
  });
  again('training-in-practice', 'epoch-count', (s) => {
    const [examples, batch, epochs] = boldNumbers(s.text);
    for (const [slip, why] of s.wrong) if (/one step per epoch/.test(why)) assert.equal(slip, epochs);
    assert.ok(flat(s.explain).includes(`$${examples} \\div ${batch} = ${examples / batch}$`), s.explain);
  });
  again('training-in-practice', 'early-stop-gen', (s) => {
    const rows = tableRows(s.text);
    const train = rows[1].slice(1).map(Number);
    const val = rows[2].slice(1).map(Number);
    const best = val.indexOf(Math.min(...val));
    for (let i = 1; i <= best; i++) assert.ok(val[i] < val[i - 1], 'the validation loss falls all the way to its lowest point');
    assert.ok(best < 5, 'the lowest validation loss is never at the last epoch, where the training loss is lowest too');
    assert.equal(train[5], Math.min(...train), '"epoch 60 has the lowest training loss"');
    assert.ok(s.explain.includes(`rises to ${val[5].toFixed(2)}`) && s.explain.includes(`falling to ${train[5].toFixed(2)}`), s.explain);
  });
  again('embeddings', 'cosine-gen', (s) => {
    const [a, b] = vectorsIn(s.text);
    const d = dot(a, b);
    assert.ok(flat(s.hints[1]).includes(`$${d}$`), 'the hint quotes the dot product');
    assert.equal(round(s.answer, 2), s.answer, 'a number with two decimals at most');
  });
  again('attention', 'mix-gen', (s) => {
    const names = tableRows(s.text)[0];
    const asked = /new vector for "([a-z]+)"/.exec(s.text)[1];
    assert.equal(/the token "([a-z]+)" gives/.exec(s.text)[1], asked, 'the token that gives the weights is the one asked about');
    assert.ok(names.includes(asked));
    const products = Array.from(flat(s.explain).matchAll(/([\d.]+) \\times \(?(-?\d+)\)?/g), (m) => Number(m[1]) * Number(m[2]));
    assert.equal(products.length, 3);
    near(products[0] + products[1] + products[2], s.answer, 1e-9, 'the sum written out in the explanation');
  });
  again('attention', 'weight-gen', (s) => {
    const others = vectorsIn(s.text).slice(1);
    const powers = others.map((v) => 2 ** (v[0] + v[1]));
    const total = powers[0] + powers[1] + powers[2];
    const which = tableRows(s.text)[0].indexOf(/give to "([a-z]+)"/.exec(s.text)[1]);
    assert.ok(flat(s.explain).includes(`$${powers[which]} \\div ${total} = ${s.answer}$`), s.explain);
  });
});

/* ===================================================== teach before you ask */

/** The teaching screens added so that each lesson shows a thing before it asks for it. */
const TEACHING = {
  'activation-functions': ['teach-compose', 'teach-relu-unit', 'teach-hinges'],
  'scores-to-probabilities': ['teach-recipe', 'teach-temperature'],
  backpropagation: ['teach-rate', 'teach-forward', 'teach-backward', 'teach-backward-hidden'],
  'training-in-practice': ['teach-batch-gradient', 'teach-curve-shapes', 'teach-early-stopping'],
  embeddings: ['teach-cosine', 'teach-table', 'teach-trained'],
  attention: ['teach-three-steps', 'teach-pipeline', 'teach-left-out'],
};
const EXAMPLE = ':::example';
/**
 * [teaching screen, the step it serves, what the screen has to say for that step, the discovery it follows (optional)].
 * A screen that names a rule found on a widget comes after the discovery and before the first step that uses the rule.
 */
const SERVES = {
  'activation-functions': [
    ['teach-compose', 'compose', [EXAMPLE, 'Put the first rule into the second', 'Multiply out the bracket', 'slopes multiplied'], 'no-bend'],
    ['teach-compose', 'compose-gen', [EXAMPLE, '**one** rule of the same kind']],
    ['name-it', 'which-bend', ['**linear**', '**activation function**', 'collapses into']],
    ['teach-relu-unit', 'relu-neuron', [EXAMPLE, 'weights · inputs + bias', '**switched on**', '**switched off**'], 'meet-relu'],
    ['teach-hinges', 'hinge-sum', [EXAMPLE, 'work out each ReLU first', 'Switched off', 'Add up'], 'make-v'],
    ['teach-hinges', 'make-bump', ['Each hinge adds its weight to the slope, from its kink onwards']],
  ],
  'scores-to-probabilities': [
    ['teach-recipe', 'by-hand', [EXAMPLE, '**probability**', 'Raise 2 to the power of each score', 'Divide each by the total', 'add up to 1']],
    ['name-it', 'with-e', [EXAMPLE, '**softmax**', 'e \\approx 2.718', '2.72 \\div 3.72']],
    ['name-it', 'softmax-gen', [EXAMPLE, 'e^{\\text{score}}']],
    ['name-it', 'shift', ['Only the **gaps** between the scores matter'], 'eighty'],
    ['teach-temperature', 'temperature-effects', [EXAMPLE, '**Above 1**', 'even out', '**Below 1**', 'never changes which score is highest'], 'temperature'],
    ['loss-name', 'loss-halving', [EXAMPLE, '**cross-entropy loss**', 'every further halving', 'six halvings'], 'loss-explore'],
    ['loss-name', 'truths', ['-\\ln(p)', '**natural logarithm**']],
  ],
  backpropagation: [
    ['teach-rate', 'chain-explore', [EXAMPLE, '**rate**', 'the change in the result, divided by the small nudge that caused it', 'nudge × rate']],
    ['teach-rate', 'square-rate', ['divided by the small nudge']],
    ['name-chain', 'chain-gen', [EXAMPLE, 'the rates multiply', '**chain rule**', 'signs included'], 'chain-explore'],
    ['teach-forward', 'forward', [EXAMPLE, '**forward pass**', 'weights · inputs + bias', 'switched off and passes on 0', 'squared miss']],
    ['teach-backward', 'backward-top', [EXAMPLE, '**gradient**', '2 \\times (y - \\text{target})', 'it multiplies A\'s output'], 'forward'],
    ['teach-backward-hidden', 'backward-hidden', [EXAMPLE, 'reaches $y$ through a weight', 'switched off passes no gradient back'], 'backward-top'],
    ['teach-backward-hidden', 'one-weight', ['passes the gradient back unchanged', 'passes no gradient back']],
    ['name-it', 'truths', ['**backpropagation**', '**Forward pass:**', '**Backward pass:**'], 'backward-weights'],
  ],
  'training-in-practice': [
    ['teach-batch-gradient', 'batch-by-hand', [EXAMPLE, '**average**', '**estimate**']],
    ['name-it', 'epoch-count', [EXAMPLE, '**batch**', '**epoch**', 'one pass through the whole training set', '12 \\div 2 = 6'], 'lab-batch'],
    ['teach-curve-shapes', 'read-curves', ['too small', 'too large', 'leaps far above where it started', 'drops fast, then levels off'], 'lab-rate'],
    ['teach-curve-shapes', 'diagnose', ['still falling when training ends', 'blows up']],
    ['teach-early-stopping', 'early-stop-gen', [EXAMPLE, '**Early stopping**', 'lowest **validation** loss'], 'validation'],
    ['teach-early-stopping', 'diagnose', ['**overfitting**']],
  ],
  embeddings: [
    ['name-it', 'explore-map', ['**embedding**', 'distance', 'positions close together']],
    ['teach-cosine', 'cosine-gen', [EXAMPLE, '**cosine similarity**', 'divide the dot product by both lengths', 'right angles'], 'dot-by-hand'],
    ['teach-cosine', 'cosine-map', ['**directions only**']],
    ['teach-table', 'learned', ['**The embeddings are weights**', 'random numbers', 'gradient descent nudges it'], 'place-word'],
    ['teach-table', 'table-size', ['one row for every token', '12 \\times 2 = 24']],
    ['teach-table', 'truths', ['Nobody decides what any direction means']],
    ['teach-trained', 'caveat', ['any three words, sensible or not'], 'analogy-map'],
    ['teach-trained', 'truths', ['**word2vec**', 'near “queen”', 'a tendency, not a law']],
  ],
  attention: [
    ['teach-three-steps', 'scores', [EXAMPLE, '**Score.**', 'dot product']],
    ['teach-three-steps', 'weights', ['**Weigh.**', 'powers of 2']],
    ['teach-three-steps', 'average', ['**Mix.**', 'weighted average']],
    ['name-it', 'mix-gen', ['**attention**', 'weighted average of all the vectors'], 'swap'],
    ['name-it', 'weight-gen', ['Softmax turns each token\'s scores into weights that add up to 1']],
    ['teach-pipeline', 'pipeline', ['**Tokens.**', '**Embeddings.**', '**Attention layers.**', 'one score for every token in the vocabulary', '**Softmax**', '**Pick.**'], 'stacking'],
    ['teach-left-out', 'left-out', ['**Positional information.**', '**Query, key and value weights.**', '**Normalisation**', '**Feed-forward layers**']],
  ],
};
/** A step's text on one line. */
const oneLine = (step) => step.text.replace(/\s+/g, ' ');

test('every lesson: teach before you ask', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const id of LESSONS) {
    const steps = lessons[id].steps.map((step) => fixed(id, step.id));      // resolved, as the player sees them
    const roles = steps.map(role);
    const at = (stepId) => { const i = steps.findIndex((s) => s.id === stepId); assert.ok(i >= 0, `${id} has a step "${stepId}"`); return i; };
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    const screens = roles.filter((kind) => kind === 'teach').length;
    assert.ok(screens >= 3 && screens <= 6, `${id}: three to six teaching screens (it has ${screens})`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const stepId of TEACHING[id]) {
      assert.equal(steps[at(stepId)].type, 'info', `${id}: "${stepId}" is a teaching screen`);
      assert.ok(roles.indexOf('graded', at(stepId) + 1) > 0, `${id}/${stepId} is followed by a question`);
      assert.ok(SERVES[id].some(([teach]) => teach === stepId), `${id}/${stepId} is pinned to the step it serves`);
    }
    for (const [teach, ask, says, after] of SERVES[id]) {
      assert.equal(steps[at(teach)].type, 'info', `${id}/${teach} is a teaching screen`);
      assert.ok(at(teach) < at(ask), `${id}: "${teach}" comes before "${ask}"`);
      if (after) assert.ok(at(after) < at(teach), `${id}: "${teach}" names what "${after}" let the learner find, so it comes after it`);
      for (const phrase of says) assert.ok(oneLine(steps[at(teach)]).includes(phrase), `${id}/${teach} says "${phrase}", which "${ask}" needs`);
    }
    // every generated step has a worked example somewhere above it
    for (const stepId of GENERATED[id]) {
      assert.ok(steps.slice(0, at(stepId)).some((s) => s.type === 'info' && s.text.includes(EXAMPLE)), `${id}/${stepId}: a worked example comes before it`);
    }
  }
});

test('teach before you ask: the worked examples are right, and no generated question can repeat one', () => {
  const said = (lessonId, stepId, ...phrases) => { const text = oneLine(fixed(lessonId, stepId)); for (const phrase of phrases) assert.ok(text.includes(phrase), `${lessonId}/${stepId} says "${phrase}"`); };
  const figureOf = (lessonId, stepId, i = 0) => fixed(lessonId, stepId).figures[i];
  /** No variant of a generated step matches the pattern (the numbers of the worked example in front of it). */
  const never = (lessonId, stepId, pattern, what) => {
    const step = raw(lessonId, stepId);
    for (let seed = 1; seed <= SEEDS; seed++) {
      const s = resolveStep(step, makeRng(seed * 6007 + 3), stepId);
      assert.ok(!pattern.test(oneLine(s)), `${lessonId}/${stepId} (seed ${seed}) repeats the worked example (${what}): ${oneLine(s)}`);
    }
  };
  const mean = (list) => list.reduce((t, v) => t + v, 0) / list.length;

  /* lesson 1 */
  for (const x of [-2, 0, 1.5, 7]) near(5 * (6 * x + 1) - 2, 30 * x + 3);
  said('activation-functions', 'teach-compose', 'h = 6x + 1', 'y = 5h - 2', 'y = 5(6x + 1) - 2', 'y = 30x + 5 - 2', 'y = 30x + 3', '5 \\times 6 = 30');
  never('activation-functions', 'compose-gen', /h = 6x|y = 5h/, 'h = 6x + 1 and y = 5h − 2');
  assert.equal(4 * 2 - 5 * 6 + 7, -15); assert.equal(relu(-15), 0); assert.equal(relu(4 * 2 - 5 * 6 + 30), 8);
  said('activation-functions', 'teach-relu-unit', 'Weights 4 and −5, bias 7, inputs 2 and 6', '8 - 30 + 7 = -15', '\\text{ReLU}(-15) = 0', '8 - 30 + 30 = 8');
  never('activation-functions', 'relu-neuron', /weights \*\*4\*\*|and \*\*−5\*\*|bias of \*\*7\*\*|and \*\*6\*\*\./, 'weights 4 and −5, bias 7, an input of 6');
  assert.equal(5 + 4 * relu(4 - 1) - 2 * relu(4 - 6), 17);
  said('activation-functions', 'teach-hinges', '5 + 4\\,\\text{ReLU}(x - 1)', '- 2\\,\\text{ReLU}(x - 6)', '\\text{ReLU}(3) = 3', '\\text{ReLU}(-2) = 0', '5 + 4 \\times 3 - 2 \\times 0 = 17');
  never('activation-functions', 'hinge-sum', /ReLU\}\(x - 6\)|y = \{\} & 5 /, 'a kink at 6, a bias of 5');
  near(Math.exp(-2), 0.135, 0.0005); near(1 / (1 + Math.exp(-2)), 0.88, 0.005); near(1 / 1.135, 0.88, 0.005);
  said('activation-functions', 'sigmoid', 'e^{-2} \\approx 0.135', '1 \\div 1.135 \\approx 0.88');
  assert.equal(figureOf('activation-functions', 'sigmoid').points[0].x, 2, 'the point in the picture starts at the score of the worked line');
  const vee = figureOf('activation-functions', 'teach-hinges');     // the V of make-v, solved, as a picture
  assert.deepEqual([vee.static, vee.bias, vee.hinges.map((h) => [h.at, h.weight])], [true, 3, [[0, -1], [3, 2]]]);
  assert.equal(vee.target, raw('activation-functions', 'make-v').widget.target);

  /* lesson 2 */
  assert.deepEqual(softmaxOf([2, 2, 1], 2), [0.4, 0.4, 0.2]);
  said('scores-to-probabilities', 'teach-recipe', 'rain 2, sun 2, snow 1', '4 + 4 + 2 = 10', '\\frac{4}{10} = 0.4', '\\frac{2}{10} = 0.2', '2^{-1} = 0.5');
  const rows = figureOf('scores-to-probabilities', 'teach-recipe');
  assert.deepEqual([rows.scores, rows.base, rows.static], [[2, 2, 1], 2, true]);
  assert.notDeepEqual(softmaxOf([2, 2, 1], 2), softmaxOf([2, 1, 1], 2), 'not the answer of the fill-in step that follows');
  assert.deepEqual(softmaxOf([1, 0]).map((p) => round(p, 2)), [0.73, 0.27]);
  near(2.72 / 3.72, 0.73, 0.005); near(1 / 3.72, 0.27, 0.005);
  assert.deepEqual(softmaxOf([3, 0, 0], 2), softmaxOf([4, 1, 1], 2), '"3, 0, 0 and 4, 1, 1 give the same shares"');
  said('scores-to-probabilities', 'name-it', 'Two classes, with scores 1 and 0', 'the total is 3.72', '\\approx 0.73', '\\approx 0.27');
  for (let seed = 1; seed <= SEEDS; seed++) assert.equal(tableRows(resolveStep(raw('scores-to-probabilities', 'softmax-gen'), makeRng(seed * 6007 + 3), 'softmax-gen').text)[1].length, 3, 'the generated question always has three classes; the example has two');
  const heat = tableRows(fixed('scores-to-probabilities', 'teach-temperature').text).slice(1);
  assert.deepEqual(heat.map((row) => Number(row[0])), [1, 2, 0.5]);
  for (const [T, scores, powers, shares] of heat.map((row) => row.map((cell) => cell.split(',').map(Number)))) {
    assert.deepEqual(scores, [4 / T[0], 2 / T[0]]);
    assert.deepEqual(powers, scores.map((v) => 2 ** v));
    assert.deepEqual(shares, softmaxOf([4, 2], 2, T[0]).map((p) => round(p, 2)));
  }
  near(-Math.log(1 / 64), 4.16, 0.005); near(6 * 0.693, 4.16, 0.005); near(1 / 64, 0.016, 0.0005);
  said('scores-to-probabilities', 'loss-name', 'A probability of 1/64, about 0.016', 'six halvings', '6 \\times 0.693 \\approx 4.16');
  never('scores-to-probabilities', 'loss-halving', /\*\*0\.0156/, 'a probability of 1/64');

  /* lesson 3 */
  near(5 * 2.1, 10.5); near((5 * 2.1 - 5 * 2) / 0.1, 5); near(0.02 * 5, 0.1);
  said('backpropagation', 'teach-rate', 'y = 5 × w', '0.5 \\div 0.1 = 5', '0.02 \\times 5 = 0.1');
  near(7 * -1 * 3, -21); near(0.1 * -21, -2.1);
  said('backpropagation', 'name-chain', 'rates 7, −1 and 3', '7 \\times (-1) \\times 3 = -21', '0.1 \\times (-21) = -2.1');
  never('backpropagation', 'chain-gen', /\$7\$|\$-1\$/, 'a rate of 7 or of −1');
  // the example network of the three teaching screens, worked out here with finite differences
  const E = { wA1: 1, wA2: 2, bA: -1, wB1: -1, wB2: 1, bB: 0, v1: 2, v2: 5, c: -1 };
  const EX = [3, 1]; const ET = 9;
  assert.deepEqual(H.EXAMPLE_NET, { x: EX, target: ET, A: { w: [E.wA1, E.wA2], b: E.bA }, B: { w: [E.wB1, E.wB2], b: E.bB }, out: { v: [E.v1, E.v2], c: E.c } });
  const go = (p) => {
    const zA = p.wA1 * EX[0] + p.wA2 * EX[1] + p.bA; const zB = p.wB1 * EX[0] + p.wB2 * EX[1] + p.bB;
    const hA = relu(zA); const hB = relu(zB); const y = p.v1 * hA + p.v2 * hB + p.c;
    return { zA, hA, zB, hB, y, L: (y - ET) ** 2 };
  };
  const f = go(E);
  assert.deepEqual(f, { zA: 4, hA: 4, zB: -2, hB: 0, y: 7, L: 4 });
  const g = {
    gy: slope((y) => (y - ET) ** 2, f.y),
    gc: slope((v) => go({ ...E, c: v }).L, E.c),
    gv1: slope((v) => go({ ...E, v1: v }).L, E.v1),
    gv2: slope((v) => go({ ...E, v2: v }).L, E.v2),
    ghA: slope((hA) => (E.v1 * hA + E.v2 * f.hB + E.c - ET) ** 2, f.hA),
    ghB: slope((hB) => (E.v1 * f.hA + E.v2 * hB + E.c - ET) ** 2, f.hB),
    gzA: slope((zA) => (E.v1 * relu(zA) + E.v2 * f.hB + E.c - ET) ** 2, f.zA),
    gzB: slope((zB) => (E.v1 * f.hA + E.v2 * relu(zB) + E.c - ET) ** 2, f.zB),
    gwA1: slope((v) => go({ ...E, wA1: v }).L, E.wA1),
  };
  const quoted = { gy: -4, gc: -4, gv1: -16, gv2: 0, ghA: -8, ghB: -20, gzA: -8, gzB: 0, gwA1: -24 };
  const theirs = widgetBackward(E, EX, ET);
  for (const [key, value] of Object.entries(quoted)) { near(g[key], value, 1e-6, `the example network's ${key}`); near(theirs[key], value, 1e-9, `the widget's ${key} for the example network`); near(H.netBackward(H.EXAMPLE_NET)[key], value, 1e-9); }
  assert.deepEqual(widgetForward(E, EX, ET), f);
  said('backpropagation', 'teach-forward', '1 \\times 3 + 2 \\times 1 - 1 = 4', '-1 \\times 3 + 1 \\times 1 + 0 = -2', 'y = 2 \\times 4 + 5 \\times 0 - 1 = 7', '(7 - 9)^2 = 4');
  said('backpropagation', 'teach-backward', 'y = 7, target 9', '2 \\times (7 - 9) = -4', '-4 \\times 1 = -4', '-4 \\times 4 = -16', '-4 \\times 0 = 0');
  said('backpropagation', 'teach-backward-hidden', '-4 \\times 2 = -8', '-4 \\times 5 = -20', '-8 \\times 1 = -8', '-20 \\times 0 = 0');
  said('backpropagation', 'backward-weights', 'an input of 3', '-8 \\times 3 = -24');
  const shown = { 'teach-forward': 'forward', 'teach-backward': ['forward', 'gy', 'gc', 'gv1', 'gv2'], 'teach-backward-hidden': ['forward', 'gy', 'gc', 'gv1', 'gv2', 'ghA', 'ghB', 'gzA', 'gzB'] };
  for (const [stepId, given] of Object.entries(shown)) {
    const fig = figureOf('backpropagation', stepId);
    assert.deepEqual([fig.type, fig.static, fig.given, fig.x, fig.target, fig.A, fig.B, fig.out], ['backprop-net', true, given, EX, ET, H.EXAMPLE_NET.A, H.EXAMPLE_NET.B, H.EXAMPLE_NET.out]);
  }
  // nothing in the example is an answer of the network the learner then works through (zeros apart)
  const mine = { ...f, ...quoted }; const answers = { ...run(NET0), ...gradientsByNudging(NET0) };
  for (const key of Object.keys(mine)) if (mine[key] !== 0) assert.ok(Math.abs(mine[key] - answers[key]) > 0.5, `${key}: ${mine[key]} in the example, ${answers[key]} in the exercise`);

  /* lesson 4 */
  assert.deepEqual([mean([10, -4, 6]), mean([10, -4])], [4, 3]);
  said('training-in-practice', 'teach-batch-gradient', 'gradients 10, −4 and 6', '(10 - 4 + 6) \\div 3 = 4', '(10 - 4) \\div 2 = 3');
  assert.equal(TRAIN.length, 12); assert.equal((12 / 2) * 300, 1800);
  said('training-in-practice', 'name-it', '12 plants, batches of 2, 300 epochs', '12 \\div 2 = 6', '6 \\times 300 = 1{,}800');
  never('training-in-practice', 'epoch-count', /\*\*12 examples\*\*|batches of \*\*2\*\*|\*\*300 epochs\*\*/, '12 examples, batches of 2, 300 epochs');
  const [crawl, burst] = [0, 1].map((i) => figureOf('training-in-practice', 'teach-curve-shapes', i));
  assert.deepEqual([crawl.type, crawl.static, crawl.rate, crawl.batch, burst.static, burst.rate, burst.batch], ['loss-curves', true, 0.005, 12, true, 0.5, 12]);
  said('training-in-practice', 'teach-curve-shapes', 'a rate of 0.005: it crawls', 'a rate of 0.5: the loss leaves the chart at once');
  const slow = trainRun({ rate: crawl.rate, batch: 12 }); const slowFacts = summarize(slow, H.LAB.goal);
  assert.ok(!slowFacts.diverged && !slowFacts.spiked && slowFacts.bumps === 0 && slowFacts.reached == null, 'a rate of 0.005 is smooth, and too slow to reach the goal');
  assert.ok(slow.train[300] < slow.train[250] && slow.train[250] < slow.train[200], '"still falling when training ends"');
  const wild = trainRun({ rate: burst.rate, batch: 12 });
  assert.ok(wild.diverged && wild.train.length < 6, 'a rate of 0.5 blows up within a few epochs');
  for (const option of fixed('training-in-practice', 'read-curves').options) assert.ok(![crawl.rate, burst.rate].includes(option.figure.rate), 'the pictures of the question are other runs');
  const saved = tableRows(fixed('training-in-practice', 'teach-early-stopping').text).slice(1).map((row) => row.map(Number));
  assert.deepEqual(saved.map((row) => row[0]), [100, 200, 300, 400]);
  for (let i = 1; i < saved.length; i++) assert.ok(saved[i][1] < saved[i - 1][1], 'the training loss of the example keeps falling');
  assert.deepEqual(saved.filter((row) => row[2] === Math.min(...saved.map((r) => r[2]))).map((row) => row[0]), [200]);
  said('training-in-practice', 'teach-early-stopping', 'Keep epoch **200**', 'its validation loss, 0.40, is the lowest', 'Epoch 400 has the lowest training loss');
  never('training-in-practice', 'early-stop-gen', /\| 100 \||every 100 epochs/, 'weights saved every 100 epochs');

  /* lesson 5 */
  near(distance(at('cat'), at('dog')), 1.41, 0.005);
  said('embeddings', 'name-it', '(3, 4)', '\\sqrt{1^2 + 1^2} \\approx 1.41');
  const mapFigure = figureOf('embeddings', 'name-it');
  assert.deepEqual([mapFigure.type, mapFigure.static, mapFigure.select, mapFigure.words], ['word-map', true, 'cat', MAP]);
  assert.deepEqual(widgetRank(MAP, 'cat').slice(0, 3).map((n) => n.word), ['dog', 'kitten', 'puppy']);
  assert.equal(dot(at('king'), at('queen')), 19);
  said('embeddings', 'dot-by-hand', '(-2) \\times (-2) + 3 \\times 5 = 19');
  const [u, v] = [[3, 4], [8, 6]];
  assert.deepEqual([dot(u, v), norm(u), norm(v), dot(u, v) / (norm(u) * norm(v))], [48, 5, 10, 0.96]);
  assert.equal(dot([2 * u[0], 2 * u[1]], [2 * v[0], 2 * v[1]]), 4 * dot(u, v), '"double both, and it is four times as large"');
  said('embeddings', 'teach-cosine', 'u = (3, 4) and v = (8, 6)', '3 \\times 8 + 4 \\times 6 = 48', '\\sqrt{3^2 + 4^2} = 5', '\\sqrt{8^2 + 6^2} = 10', '48 \\div (5 \\times 10) = 0.96');
  const arrows = figureOf('embeddings', 'teach-cosine');
  assert.deepEqual([arrows.static, arrows.vectors.map((a) => [a.x, a.y]), arrows.pair], [true, [u, v], ['u', 'v']]);
  for (let seed = 1; seed <= SEEDS; seed++) for (const vec of vectorsIn(resolveStep(raw('embeddings', 'cosine-gen'), makeRng(seed * 6007 + 3), 'cosine-gen').text)) near(norm(vec), 5, 1e-12, 'the generated vectors all have length 5; the example has one of length 10');
  assert.equal(MAP.length * MAP[0].at.length, 24);
  assert.deepEqual(tableRows(fixed('embeddings', 'teach-table').text).slice(1, 4), ['cat', 'dog', 'kitten'].map((word) => [word, ...at(word).map(String)]));
  said('embeddings', 'teach-table', '12 rows and 2 columns', '12 \\times 2 = 24');
  never('embeddings', 'table-size', /\*\*12 tokens\*\*|\*\*2 numbers\*\*/, '12 tokens, 2 numbers each');
  assert.deepEqual([at('dog')[0] - at('cat')[0], at('dog')[1] - at('cat')[1]], [1, -1]);
  said('embeddings', 'analogy-by-hand', '(4 - 3,\\ 3 - 4) = (1, -1)');
  assert.deepEqual(figureOf('embeddings', 'teach-trained').offset, { from: 'man', to: 'woman', at: 'king', copy: true });

  /* lesson 6 */
  const pairOf = figureOf('attention', 'teach-three-steps');
  assert.deepEqual([pairOf.static, pairOf.base, pairOf.focus, pairOf.tokens.map((t) => [t.text, t.v])], [true, 2, 0, [['it', [1, 0]], ['trophy', [3, 1]]]]);
  const worked = attentionOf([[1, 0], [3, 1]], 2);
  assert.deepEqual(worked.scores[0], [1, 3]);
  assert.deepEqual(worked.weights[0], [0.2, 0.8]);
  near(worked.out[0][0], 2.6, 1e-12); near(worked.out[0][1], 0.8, 1e-12);
  assert.deepEqual(worked.weights[1].map((w) => round(w, 2)), [0.01, 0.99], 'the second row of the grid in the picture');
  const fromWidget = attend([[1, 0], [3, 1]], 2);
  worked.weights[0].forEach((w, j) => near(fromWidget.weights[0][j], w, 1e-12)); worked.out[0].forEach((value, k) => near(fromWidget.out[0][k], value, 1e-12));
  said('attention', 'teach-three-steps', 'it = (1, 0), trophy = (3, 1)', '1 \\times 3 + 0 \\times 1 = 3', '2^1 = 2', '2^3 = 8', 'total 10', '0.2 and 0.8', '0.2 \\times (1, 0) + 0.8 \\times (3, 1) = (2.6,\\ 0.8)');
  for (const stepId of ['mix-gen', 'weight-gen']) for (let seed = 1; seed <= SEEDS; seed++) assert.equal(tableRows(resolveStep(raw('attention', stepId), makeRng(seed * 6007 + 3), stepId).text)[0].length, 3, 'the generated questions have three tokens; the example has two');
  // the worked pipeline runs in the order that the ordering step asks for
  const walk = oneLine(fixed('attention', 'teach-pipeline'));
  const places = ['**Tokens.**', '**Embeddings.**', '**Attention layers.**', '**Scores.**', '**Softmax**', '**Pick.**'].map((label) => walk.indexOf(label));
  assert.ok(places.every((p, i) => p >= 0 && (i === 0 || p > places[i - 1])), 'tokens, embeddings, attention, scores, softmax, pick');
  // every part the matching step asks about is introduced, by name, on the screen before it
  for (const [part] of fixed('attention', 'left-out').pairs) assert.ok(oneLine(fixed('attention', 'teach-left-out')).includes(`**${part}`), `the teaching screen introduces "${part}"`);
  said('attention', 'teach-left-out', '(the query)', '(the key)', '(the value)', '“dog bites man” and “man bites dog”');
});

/* ------------------------------------------------------------- the guard */

test('every generated step of the course is re-solved by a test above', () => {
  const generated = [];
  for (const id of LESSONS) for (const s of lessons[id].steps) if (typeof s.gen === 'function') generated.push(`${id}/${s.id}`);
  const listed = Object.entries(GENERATED).flatMap(([id, steps]) => steps.map((s) => `${id}/${s}`));
  assert.deepEqual(generated.sort(), listed.sort(), 'GENERATED lists exactly the generated steps');
  for (const id of generated) assert.ok(tested.has(id), `${id} is generated but no test re-solves it`);
});
