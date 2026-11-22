// "How AI Learns": the lessons make specific claims about their fixed data sets
// ("one line can sort at most 12 of the 16 plants", "the best one-knob model
// misses by about 2.3 minutes"…). These tests re-derive every such claim, so
// that nobody can change a data point without noticing that a sentence in a
// lesson has become false. Every solution written in a lesson is also checked
// against the settings its sliders can actually reach.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import course from '../content/courses/ai/course.js';
import {
  DELIVERIES, BATTERY, MANGOES, PLUMS, SOUR_MANGOES, MESSY_MANGOES, PLANTS,
  CAT_SENTENCES, DOCTOR_SENTENCES, netCorrect,
} from '../content/courses/ai/helpers.js';

const range = (lo, hi, step) => { const out = []; for (let v = lo; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6); return out; };
const mean = (arr) => arr.reduce((t, v) => t + v, 0) / arr.length;

/* ------------------------------------------------------------ straight lines */
const miss = (pts, w, b) => mean(pts.map(([x, y]) => Math.abs(w * x + b - y)));
const mse = (pts, w, b) => mean(pts.map(([x, y]) => (w * x + b - y) ** 2));

test('deliveries: the best one-knob model is w = 3.75 with an average miss of about 2.3', () => {
  const settings = range(0, 6, 0.25);
  const best = settings.reduce((a, w) => (miss(DELIVERIES, w, 0) < miss(DELIVERIES, a, 0) ? w : a));
  assert.equal(best, 3.75);
  assert.ok(Math.abs(miss(DELIVERIES, 3.75, 0) - 2.28) < 0.01);
  // its neighbours are clearly worse but still "close" (the hint threshold in the lesson is 2.65)
  assert.ok(miss(DELIVERIES, 3.5, 0) <= 2.65 && miss(DELIVERIES, 4, 0) <= 2.65);
  assert.ok(miss(DELIVERIES, 3.25, 0) > 2.65 && miss(DELIVERIES, 4.25, 0) > 2.65);
});

test('deliveries: with two knobs, w = 3 and b = 5 misses by 0.75; only a handful of settings get to 1 or less', () => {
  assert.equal(miss(DELIVERIES, 3, 5), 0.75);
  const good = [];
  for (const w of range(0, 6, 0.25)) for (const b of range(0, 12, 1)) if (miss(DELIVERIES, w, b) <= 1) good.push(`${w}/${b}`);
  assert.deepEqual(good.sort(), ['2.75/6', '3/4', '3/5', '3/6']);
  // the lesson-1 hook: about 23 minutes for 6 km
  assert.ok(Math.abs(3 * 6 + 5 - 23) < 1e-9);
});

test('deliveries: the squared-error valley has its lowest tried point at w = 3.75', () => {
  const settings = range(2.5, 5, 0.25);
  const best = settings.reduce((a, w) => (mse(DELIVERIES, w, 0) < mse(DELIVERIES, a, 0) ? w : a));
  assert.equal(best, 3.75);
  assert.equal(settings.length, 11);          // the lesson asks for at least 8 of them
});

test('deliveries: gradient descent on the standardised input reaches an error below 1 within 20 steps', () => {
  // the same procedure as fit-line's train mode, rate 0.1, from w = 0, b = 0
  const xs = DELIVERIES.map((p) => p[0]);
  const mx = mean(xs);
  const sd = Math.sqrt(mean(xs.map((x) => (x - mx) ** 2)));
  let w = 0; let b = 0;
  const errors = [];
  for (let k = 0; k < 30; k++) {
    let u = w * sd; let c = b + w * mx; let gu = 0; let gc = 0;
    for (const [x, y] of DELIVERIES) { const z = (x - mx) / sd; const e = u * z + c - y; gu += 2 * e * z; gc += 2 * e; }
    u -= 0.1 * gu / DELIVERIES.length; c -= 0.1 * gc / DELIVERIES.length;
    w = u / sd; b = c - w * mx;
    errors.push(mse(DELIVERIES, w, b));
  }
  assert.ok(errors.every((e, i) => i === 0 || e < errors[i - 1]), 'the error falls at every step');
  assert.ok(errors[16] < 1 && errors[15] >= 1, 'below 1 from step 17 on');
  assert.ok(Math.abs(w - 2.93) < 0.01 && Math.abs(b - 5.33) < 0.02, 'it ends close to w = 3, b = 5');
});

test('battery: a negative weight is needed, and w = −12, b = 98 misses by 1.5 points', () => {
  assert.equal(miss(BATTERY, -12, 98), 1.5);
  const good = [];
  for (const w of range(-20, 10, 1)) for (const b of range(40, 120, 2)) if (miss(BATTERY, w, b) <= 2.5) good.push([w, b]);
  assert.ok(good.length >= 5);
  assert.ok(good.every(([w]) => w < 0));
});

/* -------------------------------------------------------------- one neuron */
const sorted = (pts, w1, w2, b) => pts.reduce((t, [x, y, c]) => t + (((w1 * x + w2 * y + b) > 1e-9) === (c === 1) ? 1 : 0), 0);
const sliderSettings = () => { const out = []; for (const w1 of range(-2, 2, 0.5)) for (const w2 of range(-2, 2, 0.5)) for (const b of range(-20, 20, 1)) out.push([w1, w2, b]); return out; };
/** The best any straight line can do: try every direction, cutting between neighbouring points. */
function bestLine(pts) {
  let best = 0;
  for (let deg = 0; deg < 360; deg += 0.5) {
    const w1 = Math.cos((deg * Math.PI) / 180);
    const w2 = Math.sin((deg * Math.PI) / 180);
    const proj = pts.map(([x, y]) => w1 * x + w2 * y).sort((p, q) => p - q);
    const cuts = [proj[0] - 1, ...proj.slice(1).map((v, i) => (v + proj[i]) / 2), proj[proj.length - 1] + 1];
    for (const c of cuts) best = Math.max(best, sorted(pts, w1, w2, -c));
  }
  return best;
}

test('every fruit data set has 16 examples, 8 of each kind (9 and 7 for the messy batch)', () => {
  for (const set of [MANGOES, PLUMS, SOUR_MANGOES, PLANTS]) {
    assert.equal(set.length, 16);
    assert.equal(set.filter((p) => p[2] === 1).length, 8);
  }
  assert.equal(MESSY_MANGOES.filter((p) => p[2] === 1).length, 9);
});

test('mangoes: with weights 1 and 1, a bias from −12 to −8 separates them; bias 0 gets 8 right', () => {
  assert.equal(sorted(MANGOES, 1, 1, 0), 8);
  const ok = range(-20, 20, 1).filter((b) => sorted(MANGOES, 1, 1, b) === 16);
  assert.deepEqual(ok, [-12, -11, -10, -9, -8]);
});

test('plums: the mango neuron gets 13 right, and every slider setting that separates them ignores softness', () => {
  assert.equal(sorted(PLUMS, 1, 1, -10), 13);
  const solutions = sliderSettings().filter(([w1, w2, b]) => sorted(PLUMS, w1, w2, b) === 16);
  assert.ok(solutions.length > 0);
  assert.ok(solutions.every(([w1, w2]) => w2 === 0 && w1 > 0));
  assert.equal(sorted(PLUMS, 1, 0, -5), 16);
  assert.equal(sorted(PLUMS, -1, 0, 5), 0, 'the same border with swapped sides gets everything wrong');
});

test('sour mangoes: every separating setting weighs sweetness positively and sourness negatively', () => {
  const solutions = sliderSettings().filter(([w1, w2, b]) => sorted(SOUR_MANGOES, w1, w2, b) === 16);
  assert.ok(solutions.length > 0);
  assert.ok(solutions.every(([w1, w2]) => w1 > 0 && w2 < 0));
  assert.equal(sorted(SOUR_MANGOES, 1, -1, 0), 16);
  assert.equal(sorted(SOUR_MANGOES, 1, 1, -8), 8);
});

test('messy mangoes: no straight border sorts all 16; 15 is possible', () => {
  assert.equal(bestLine(MESSY_MANGOES), 15);
  assert.equal(Math.max(...sliderSettings().map(([w1, w2, b]) => sorted(MESSY_MANGOES, w1, w2, b))), 15);
  assert.equal(sorted(MESSY_MANGOES, 1, 1, -10), 15);
});

/* ------------------------------------------------------------------ layers */
test('plants: one neuron sorts at most 12 of 16, whatever its weights', () => {
  assert.equal(bestLine(PLANTS), 12);
  assert.equal(Math.max(...sliderSettings().map(([w1, w2, b]) => sorted(PLANTS, w1, w2, b))), 12);
  assert.equal(sorted(PLANTS, -2, 2, 4), 12, 'the solution given in the lesson');
  assert.equal(sorted(PLANTS, 1, 0, -5), 8, 'the starting position');
});

test('plants: two hidden neurons and an "and" neuron sort all 16', () => {
  const A = { w1: -1, w2: 1, b: 2 };
  const B = { w1: 1, w2: -1, b: 2 };
  assert.equal(netCorrect(A, B, { a: 1, b: 1, c: -1.5 }), 16);
  assert.equal(netCorrect(A, B, { a: 1, b: 1, c: -1 }), 16);
  assert.equal(netCorrect(A, B, { a: 1, b: 1, c: -0.5 }), 8, 'an "or" neuron says "thrives" everywhere');
  // every setting of B that works has sunlight positive and water negative, as the lesson's feedback assumes
  const works = sliderSettings().filter(([w1, w2, b]) => netCorrect(A, { w1, w2, b }, { a: 1, b: 1, c: -1.5 }) === 16);
  assert.ok(works.length >= 10);
  assert.ok(works.every(([w1, w2]) => w1 > 0 && w2 < 0));
  // the starting position of B in the lesson does not already solve it
  assert.ok(netCorrect(A, { w1: 1, w2: 0, b: -5 }, { a: 1, b: 1, c: -1.5 }) < 16);
});

test('plants: the output neuron solves the task exactly when it fires for "both" and for nothing else', () => {
  const A = { w1: -1, w2: 1, b: 2 };
  const B = { w1: 1, w2: -1, b: 2 };
  for (const a of range(-2, 2, 0.5)) for (const b of range(-2, 2, 0.5)) for (const c of range(-3, 3, 0.5)) {
    const fires = (x, y) => a * x + b * y + c > 1e-9;
    const isAnd = fires(1, 1) && !fires(1, 0) && !fires(0, 1);     // (0, 0) never occurs: every plant is above A's line or below B's
    assert.equal(netCorrect(A, B, { a, b, c }) === 16, isAnd, `output weights ${a}, ${b}, ${c}`);
  }
});

/* ------------------------------------------------------------- next words */
function followers(sentences, context) {
  const k = context.split(' ').length;
  const counts = {};
  for (const s of sentences) {
    const words = [...s.split(' '), '.'];
    for (let i = k; i < words.length; i++) {
      if (words.slice(i - k, i).join(' ') === context) counts[words[i]] = (counts[words[i]] || 0) + 1;
    }
  }
  return counts;
}

test('toy language model: the counts quoted in the lesson', () => {
  assert.deepEqual(followers(CAT_SENTENCES, 'the'), { cat: 4, mat: 2, dog: 3, rug: 1 });
  assert.deepEqual(followers(CAT_SENTENCES, 'cat'), { sat: 2, saw: 1, '.': 1 });
  assert.deepEqual(followers(CAT_SENTENCES, 'sat'), { on: 3 });
  assert.deepEqual(followers(CAT_SENTENCES, 'on'), { the: 3 });
  assert.equal(followers(CAT_SENTENCES, 'the').sat, undefined, '"sat" never follows "the"');
});

test('toy language model: "the dog sat on the rug" is new, yet every neighbouring pair occurs in the training text', () => {
  const sentence = 'the dog sat on the rug';
  assert.ok(!CAT_SENTENCES.includes(sentence));
  const words = [...sentence.split(' '), '.'];
  for (let i = 1; i < words.length; i++) assert.ok(followers(CAT_SENTENCES, words[i - 1])[words[i]] > 0, `${words[i - 1]} → ${words[i]}`);
});

test('toy language model: always taking the most frequent word loops for ever', () => {
  const text = ['the'];
  while (text.length < 12) {
    const next = followers(CAT_SENTENCES, text[text.length - 1]);
    // most frequent; ties go to the word seen first, which is the order of the keys
    text.push(Object.keys(next).reduce((a, w) => (next[w] > next[a] ? w : a)));
  }
  assert.equal(text.join(' '), 'the cat sat on the cat sat on the cat sat on');
});

test('lopsided text: "doctor said" → he 3, she 1; "nurse said" → she only', () => {
  assert.deepEqual(followers(DOCTOR_SENTENCES, 'doctor said'), { he: 3, she: 1 });
  assert.deepEqual(followers(DOCTOR_SENTENCES, 'nurse said'), { she: 2 });
});

/* ==========================================================================
   Independent review checks. Every generated step is re-solved from its own
   wording, every option list is checked, and the lessons' own check functions
   are run against widget states worked out here (not by the widgets).
   ========================================================================== */
const SEEDS = 200;
const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/ai/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, 'ai', meta.id);
  }
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(4242 + k * 7919), id));
const num = (s) => Number(String(s).replace('−', '-'));
const round2 = (v) => Math.round(v * 100) / 100;

test('six lessons; every generated step is listed here and re-solved below', () => {
  assert.deepEqual(Object.keys(lessons), ['prediction-machines', 'a-single-neuron', 'learning-by-descent', 'layers', 'predicting-words', 'limits']);
  const generated = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const s of lesson.steps) if (typeof s.gen === 'function') generated.push(`${id}/${s.id}`);
  assert.deepEqual(generated, [
    'prediction-machines/use-recipe', 'prediction-machines/read-weight', 'prediction-machines/average-miss',
    'a-single-neuron/work-the-sum', 'learning-by-descent/one-step', 'layers/count-weights',
    'predicting-words/count-to-chance', 'predicting-words/zero-randomness', 'limits/diagnose',
  ]);
});

test('no step text contains undefined or NaN; option lists have one right answer and no duplicates', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < (step.gen ? SEEDS : 1); k++) {
        const s = resolveStep(step, makeRng(99 + k * 104729), step.id);
        const where = `${id}/${step.id} seed ${k}`;
        const blob = JSON.stringify(s, (key, value) => (typeof value === 'function' ? undefined : value));
        assert.ok(!/undefined|NaN|Infinity|\[object Object\]/.test(blob), where);
        if (s.type === 'choice') assert.equal(s.options.filter((o) => o.correct).length, 1, `${where}: exactly one correct option`);
        if (s.type === 'multi') assert.ok(s.options.some((o) => o.correct) && s.options.some((o) => !o.correct), where);
        if (s.type === 'choice' || s.type === 'multi') assert.equal(new Set(s.options.map((o) => o.text)).size, s.options.length, `${where}: duplicate options`);
        if (s.type === 'numeric') for (const [value] of s.wrong) assert.ok(Math.abs(value - s.answer) > (s.tolerance || 0) + 1e-9, `${where}: an anticipated mistake equals the answer`);
        if (s.type === 'match') {
          assert.equal(new Set(s.pairs.map((p) => p[0])).size, s.pairs.length, where);
          assert.equal(new Set(s.pairs.map((p) => p[1])).size, s.pairs.length, where);
        }
        if (s.type === 'bucket') assert.equal(new Set(s.items.map((it) => it.text)).size, s.items.length, where);
        if (s.type === 'order') assert.equal(new Set(s.items).size, s.items.length, where);
      }
    }
  }
});

/* ------------------------------------------------- generated steps, re-solved */
test('prediction-machines/use-recipe: the recipe worked out from the question text', () => {
  const units = { minutes: 'min', height: 'cm', cones: 'cones' };
  for (const s of variants('prediction-machines', 'use-recipe')) {
    const [, output, w, input, b] = /\\text\{(\w+)\} = \\blue\{(\d+)\} \\times \\text\{(\w+)\} \+ \\orange\{(\d+)\}/.exec(s.text);
    const x = num(/\*\*What does it predict for (?:an order|a sunflower that is|a day of) (\d+)\s/.exec(s.text)[1]);
    const answer = num(w) * x + num(b);
    assert.equal(s.answer, answer, s.text);
    assert.equal(s.unit, units[output]);
    assert.ok(s.explain.startsWith(`$${w} \\times ${x} + ${b} = ${num(w) * x} + ${b} = ${answer}$`), s.explain);
    assert.ok(s.hints[0].includes(`Put ${x} in place of “${input}”`), s.hints[0]);
    assert.ok(s.hints[1].includes(`$${w} \\times ${x} = ${num(w) * x}$. Now add ${b}.`), s.hints[1]);
  }
});

test('prediction-machines/read-weight: only "each extra unit adds w" is true of the recipe', () => {
  for (const s of variants('prediction-machines', 'read-weight')) {
    const [, w, b] = /\\blue\{(\d+)\} \\times \\text\{\w+\} \+ \\orange\{(\d+)\}/.exec(s.text);
    assert.notEqual(w, b, 'if b equalled w, "with an input of 0 it gives w" would be true as well');
    assert.ok(s.text.includes(`**What does the weight ${w} tell you?**`));
    const right = s.options.find((o) => o.correct);
    assert.match(right.text, new RegExp(`^Each extra (kilometre|week|degree) adds ${w} (min|cm|cones) to the prediction$`));
    for (const o of s.options) if (!o.correct) assert.ok(!/^Each extra/.test(o.text) && o.text.includes(` ${w} `), o.text);
    assert.ok(s.explain.includes(`The weight ${w} multiplies the input`) && s.explain.includes(`The other weight, ${b}, is what is left when the input is 0`), s.explain);
  }
});

test('prediction-machines/average-miss: the mean absolute gap of the table', () => {
  for (const s of variants('prediction-machines', 'average-miss')) {
    const rows = [...s.text.matchAll(/\| [ABC] \| (\d+) min \| (\d+) min \|/g)].map((m) => [num(m[1]), num(m[2])]);
    assert.equal(rows.length, 3, s.text);
    const misses = rows.map(([predicted, actual]) => Math.abs(predicted - actual));
    const average = misses.reduce((t, v) => t + v, 0) / 3;
    assert.ok(Number.isInteger(average) && average > 0, s.text);
    assert.equal(s.answer, average, s.text);
    assert.ok(s.explain.includes(`The misses are ${misses.join(', ')} minutes`) && s.explain.includes(`{${misses.join(' + ')}}{3} = ${average}$`), s.explain);
    assert.ok(s.hints[1].includes(`The three misses are ${misses.join(', ')}.`), s.hints[1]);
  }
});

test('a-single-neuron/work-the-sum: weighted sum and threshold from the wording', () => {
  const show = (v) => `${v < 0 ? '−' : ''}${Math.abs(v)}`;
  const seen = new Set();
  for (const s of variants('a-single-neuron', 'work-the-sum')) {
    const m = /weights \*\*(−?\d+)\*\* and \*\*(−?\d+)\*\* and a bias of \*\*(−?\d+)\*\*\.\s+Its two inputs are \*\*(\d+)\*\* and \*\*(\d+)\*\*\. It says “yes” when the score is above 0/.exec(s.text);
    assert.ok(m, s.text);
    const [w1, w2, b, x1, x2] = m.slice(1).map(num);
    const score = w1 * x1 + w2 * x2 + b;
    assert.notEqual(score, 0, 'a score of exactly 0 would make "above 0" a trick question');
    // the sum as it is written out in the template, evaluated on its own
    const t = /^score = (\d+) × (\d+) ([+−]) (\d+) × (\d+) ([+−]) (\d+) = $/.exec(s.parts[0].text);
    assert.ok(t, s.parts[0].text);
    assert.equal(num(t[1]) * num(t[2]) + (t[3] === '−' ? -1 : 1) * num(t[4]) * num(t[5]) + (t[6] === '−' ? -1 : 1) * num(t[7]), score);
    assert.deepEqual(s.blanks[0].numbers, [score]);
    assert.deepEqual(s.blanks[1].options, ['yes', 'no']);
    assert.equal(s.blanks[1].answer, score > 0 ? 'yes' : 'no');
    assert.equal(s.explain, `${w1} × ${x1} = ${w1 * x1}, and ${show(w2)} × ${x2} = ${show(w2 * x2)}. Together with the bias: ${show(score)}. That is ${score > 0 ? 'above 0, so the answer is “yes”' : 'not above 0, so the answer is “no”'}.`);
    seen.add(score > 0);
  }
  assert.equal(seen.size, 2, 'both answers occur');
});

test('learning-by-descent/one-step: new weight = old weight − learning rate × slope, and it moves downhill', () => {
  for (const s of variants('learning-by-descent', 'one-step')) {
    const m = /A weight is at \*\*(\d+)\*\*\. The slope of the error there is \*\*(−?\d+)\*\*\. The learning rate is \*\*([\d.]+)\*\*/.exec(s.text);
    assert.ok(m, s.text);
    const [w, slope, rate] = m.slice(1).map(num);
    const answer = w - rate * slope;
    assert.ok(Math.abs(s.answer - answer) < 1e-9, s.text);
    assert.ok(s.tolerance > 0 && s.tolerance < 0.05);
    assert.equal(s.answer < w, slope > 0, 'a positive slope sends the weight down, a negative one up');
    const e = /^\$(\d+) - ([\d.]+) \\times \((-?\d+)\) = (\d+) ([-+]) ([\d.]+) = (-?[\d.]+)\$\. The weight moves (down|up)/.exec(s.explain);
    assert.ok(e, s.explain);
    assert.deepEqual([num(e[1]), num(e[2]), num(e[3]), num(e[4])], [w, rate, slope, w]);
    assert.ok(Math.abs(num(e[6]) - rate * Math.abs(slope)) < 1e-9 && Math.abs(num(e[7]) - answer) < 1e-9, s.explain);
    assert.equal(e[5] === '-', slope > 0);
    assert.equal(e[8] === 'down', slope > 0);
    assert.equal(/positive/.test(s.hints[1]), slope > 0);
    for (const [value, message] of s.wrong) if (Math.abs(value - (w + rate * slope)) < 1e-9) assert.match(message, /uphill/);
  }
});

test('layers/count-weights: counted neuron by neuron', () => {
  for (const s of variants('layers', 'count-weights')) {
    const inputs = num(/\*\*(\d+) inputs\*\*/.exec(s.text)[1]);
    const hidden = num(/one hidden layer of \*\*(\d+) neurons\*\*/.exec(s.text)[1]);
    assert.match(s.text, /\*\*1 output neuron\*\* that takes the outputs of all the hidden neurons/);
    let count = 0;
    for (let h = 0; h < hidden; h++) count += inputs + 1;      // each hidden neuron: a weight per input, and a bias
    count += hidden + 1;                                        // the output neuron: a weight per hidden neuron, and a bias
    assert.equal(s.answer, count, s.text);
    assert.ok(s.explain.startsWith(`Hidden layer: $${hidden} \\times (${inputs} + 1) = ${hidden * (inputs + 1)}$. Output neuron: $${hidden} + 1 = ${hidden + 1}$. Altogether **${count}**.`), s.explain);
  }
  assert.equal(2 * (2 + 1) + (2 + 1), 9, 'the plant network: nine numbers, as the explanation says');
});

test('predicting-words/count-to-chance: counts add up to the total and give a whole percentage', () => {
  for (const s of variants('predicting-words', 'count-to-chance')) {
    const [, word, total] = /the word \*\*“(\w+)”\*\* occurs \*\*(\d+) times\*\*/.exec(s.text);
    const counts = Object.fromEntries([...s.text.matchAll(/- “(\w+)” (\d+) times?[,.]/g)].map((m) => [m[1], num(m[2])]));
    assert.equal(Object.keys(counts).length, 3, s.text);
    assert.equal(Object.values(counts).reduce((t, v) => t + v, 0), num(total), 'the three counts add up to the total, so the chances add up to 100%');
    const [, asked, after] = /\*\*What chance does the model give “(\w+)” after “(\w+)”\?\*\*/.exec(s.text);
    assert.equal(after, word);
    assert.equal((counts[asked] * 100) % num(total), 0, 'a whole number of percent');
    assert.equal(s.answer, (counts[asked] * 100) / num(total), s.text);
    assert.equal(s.unit, '%');
    assert.ok(s.explain.startsWith(`${counts[asked]} out of ${total} is ${s.answer}%.`), s.explain);
    assert.ok(!/ 1 times/.test(s.text));
  }
});

test('predicting-words/zero-randomness: chances sum to 100% and the single most likely word wins', () => {
  for (const s of variants('predicting-words', 'zero-randomness')) {
    const rows = [...s.text.matchAll(/\| (\w+) \| (\d+)% \|/g)].map((m) => [m[1], num(m[2])]);
    assert.equal(rows.length, 3, s.text);
    assert.equal(rows.reduce((t, r) => t + r[1], 0), 100);
    const top = Math.max(...rows.map((r) => r[1]));
    const winners = rows.filter((r) => r[1] === top);
    assert.equal(winners.length, 1, 'no tie for the most likely word');
    assert.equal(s.options.find((o) => o.correct).text, `“${winners[0][0]}”, every single time`);
    assert.ok(s.explain.includes(`the most likely word: “${winners[0][0]}”`) && s.explain.includes(`about ${top}% of the time`), s.explain);
  }
});

test('limits/diagnose: a small training error and a large fresh error', () => {
  for (const s of variants('limits', 'diagnose')) {
    const m = /gets \*\*(\d+)%\*\* wrong on .+?, and \*\*(\d+)%\*\* wrong on /.exec(s.text);
    assert.ok(m, s.text);
    const [low, high] = [num(m[1]), num(m[2])];
    assert.ok(low <= 5 && high >= 4 * low && high >= 20, s.text);
    assert.match(s.options.find((o) => o.correct).text, /^Overfitting/);
    assert.ok(s.explain.includes(`the ${high}%`), s.explain);
  }
});

/* --------------------------------- the lessons' check functions, state by state */
const lineState = (pts, w, b) => {
  const xs = pts.map((p) => p[0]);
  const mx = mean(xs);
  const my = mean(pts.map((p) => p[1]));
  const slope = mean(pts.map(([x, y]) => (x - mx) * (y - my))) / mean(xs.map((x) => (x - mx) ** 2));
  return { w, b, error: round2(miss(pts, w, b)), tilt: w - slope, over: mean(pts.map(([x, y]) => w * x + b - y)) };
};

test('two-knob line steps: the check passes exactly at the stated error, and following its feedback always gets there', () => {
  const cases = [
    { step: raw('prediction-machines', 'two-knobs'), pts: DELIVERIES, ws: range(0, 6, 0.25), bs: range(0, 12, 1), limit: 1 },
    { step: raw('prediction-machines', 'downhill-data'), pts: BATTERY, ws: range(-20, 10, 1), bs: range(40, 120, 2), limit: 2.5 },
  ];
  for (const { step, pts, ws, bs, limit } of cases) {
    const dw = ws[1] - ws[0];
    const db = bs[1] - bs[0];
    assert.equal(step.check(lineState(pts, step.solution.w, step.solution.b)), true, `${step.id}: the stated solution passes`);
    for (const w0 of ws) for (const b0 of bs) {
      let w = w0;
      let b = b0;
      for (let moves = 0; ; moves++) {
        const verdict = step.check(lineState(pts, w, b));
        assert.equal(verdict === true, round2(miss(pts, w, b)) <= limit, `${step.id} at w = ${w}, b = ${b}`);
        if (verdict === true) break;
        assert.ok(moves < 150, `${step.id}: the feedback from w = ${w0}, b = ${b0} never reaches a pass`);
        if (/^Your line climbs/.test(verdict)) w = -dw;
        else if (/^Too steep|does not fall fast enough/.test(verdict)) w -= dw;
        else if (/^Too flat|falls too fast/.test(verdict)) w += dw;
        else if (/Lower \$b\$/.test(verdict)) b -= db;
        else if (/Raise \$b\$/.test(verdict)) b += db;
        else assert.fail(`${step.id}: unexpected feedback “${verdict}”`);
        assert.ok(w >= ws[0] && w <= ws[ws.length - 1] && b >= bs[0] && b <= bs[bs.length - 1], `${step.id}: the feedback pushes a slider past its end (from ${w0}, ${b0})`);
      }
    }
  }
});

const neuronState = (pts, w1, w2, b) => {
  const correct = sorted(pts, w1, w2, b);
  return { w1, w2, b, correct, total: pts.length, separated: correct === pts.length, swapped: correct === 0, best: correct };
};

test('one-neuron steps: each check passes exactly when the fruit are sorted, and its feedback is true of the state', () => {
  const someBias = (pts, w1, w2) => range(-20, 20, 1).some((b) => sorted(pts, w1, w2, b) === 16);
  const slide = raw('a-single-neuron', 'slide-the-border');
  for (const b of range(-20, 20, 1)) {
    const verdict = slide.check(neuronState(MANGOES, 1, 1, b));
    assert.equal(verdict === true, b >= -12 && b <= -8, `bias ${b}`);
    if (verdict === true) continue;
    const scores = (kind) => MANGOES.filter((p) => p[2] === kind).map(([x, y]) => x + y + b);
    if (/Lower the bias/.test(verdict)) assert.ok(scores(0).some((v) => v > 0), `bias ${b}`);
    else assert.ok(/Raise the bias/.test(verdict) && scores(1).some((v) => v < 0), `bias ${b}`);
  }
  for (const [id, pts] of [['plums', PLUMS], ['sourness', SOUR_MANGOES]]) {
    const step = raw('a-single-neuron', id);
    assert.equal(step.check(neuronState(pts, step.solution.w1, step.solution.w2, step.solution.b)), true, `${id}: the stated solution passes`);
    for (const [w1, w2, b] of sliderSettings()) {
      const verdict = step.check(neuronState(pts, w1, w2, b));
      assert.equal(verdict === true, sorted(pts, w1, w2, b) === 16, `${id} at ${w1}/${w2}/${b}`);
      if (verdict === true) continue;
      if (/sides are the wrong way round/.test(verdict)) {
        // flipping the signs puts every fruit on its right side, except one lying exactly on the border (score 0)
        const onBorder = pts.filter(([x, y]) => Math.abs(w1 * x + w2 * y + b) < 1e-9).length;
        assert.ok(onBorder <= 1 && sorted(pts, -w1, -w2, -b) >= 16 - onBorder, `${id} at ${w1}/${w2}/${b}`);
      }
      // advice to move the bias alone must be something the bias alone can do
      if (/bias/.test(verdict) && !/sides are the wrong way round|balance of the two weights/.test(verdict)) assert.ok(someBias(pts, w1, w2), `${id} at ${w1}/${w2}: “${verdict}”, but no bias works`);
    }
  }
  const odd = raw('a-single-neuron', 'odd-one-out');
  for (const [w1, w2, b] of sliderSettings()) assert.equal(odd.check(neuronState(MESSY_MANGOES, w1, w2, b)) === true, sorted(MESSY_MANGOES, w1, w2, b) >= 15);
  assert.equal(odd.check(neuronState(MESSY_MANGOES, odd.solution.w1, odd.solution.w2, odd.solution.b)), true);
});

/** Gradient descent on a one-weight curve, with the exact slope `df` (the widget estimates it numerically). */
function roll(f, df, { start, rate, lo, hi, steps = 40, untilSettled = true }) {
  const atRest = (w) => Math.abs(df(w)) < 0.1 && f(w + 0.05) + f(w - 0.05) - 2 * f(w) > 0;
  let w = start;
  let taken = 0;
  let crossings = 0;
  let escaped = false;
  while (taken < steps && !escaped && !(untilSettled && atRest(w))) {
    const next = w - rate * df(w);
    if (df(next) * df(w) < 0) crossings += 1;
    w = next;
    taken += 1;
    if (w < lo || w > hi) escaped = true;
  }
  return { w, start, rate, steps: taken, settled: !escaped && atRest(w), escaped, crossings };
}

test('learning-by-descent: six steps at rate 0.25; rates 0.35 to 0.65 pass; the advice always points towards them', () => {
  const f = (w) => (w - 4) ** 2;
  const df = (w) => 2 * (w - 4);
  const valley = { start: 1.5, lo: 0, hi: 8 };
  const six = roll(f, df, { ...valley, rate: 0.25 });
  assert.equal(six.steps, 6, 'the next step says "with a learning rate of 0.25 the ball needed six steps"');
  assert.equal(raw('learning-by-descent', 'walk-down').check(six), true);
  assert.notEqual(raw('learning-by-descent', 'walk-down').check(roll(f, df, { ...valley, rate: 0.25, steps: 5 })), true);
  // four times that rate: one step leaps to the far slope, exactly as high as before
  const leap = roll(f, df, { ...valley, rate: 1, steps: 1, untilSettled: false });
  assert.ok(leap.w > 4 && f(leap.w) === f(1.5) && leap.crossings === 1);
  // a rate of 0.5 lands on the bottom in one step
  assert.deepEqual([roll(f, df, { ...valley, rate: 0.5 }).steps, roll(f, df, { ...valley, rate: 0.5 }).w], [1, 4]);

  const step = raw('learning-by-descent', 'choose-rate');
  const passing = [];
  for (const rate of range(0.05, 1.1, 0.05)) {
    const rest = roll(f, df, { ...valley, rate, steps: 60 });
    assert.equal(step.check(rest) === true, rest.settled && rest.steps <= 4, `rate ${rate}`);
    if (step.check(rest) === true) passing.push(rate);
    // whenever the learner presses Check on the way there, the advice must point the right way (0.5 is the ideal rate)
    for (let k = 0; k <= rest.steps; k++) {
      const advice = step.check(roll(f, df, { ...valley, rate, steps: k, untilSettled: false }));
      if (advice === true) continue;
      if (/larger rate|too small/.test(advice)) assert.ok(rate < 0.5, `rate ${rate} after ${k} steps: “${advice}”`);
      if (/smaller rate|too large/.test(advice)) assert.ok(rate > 0.5, `rate ${rate} after ${k} steps: “${advice}”`);
    }
  }
  assert.deepEqual(passing, [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65]);
  assert.ok(roll(f, df, { ...valley, rate: 1.1, steps: 60 }).escaped && roll(f, df, { ...valley, rate: 1.05, steps: 60 }).escaped, 'the largest rates fly off the chart');
});

test('learning-by-descent/two-valleys: left of the hump the ball ends in the shallow valley, right of it in the deeper one', () => {
  const step = raw('learning-by-descent', 'two-valleys');
  const f = (w) => 0.1 * (w - 1.5) ** 2 * (w - 6) ** 2 + 0.3 * (6 - w) + 0.8;
  const df = (w) => 0.2 * (w - 1.5) * (w - 6) ** 2 + 0.2 * (w - 1.5) ** 2 * (w - 6) - 0.3;
  const grid = range(0, 7.5, 0.005);
  const deepest = grid.reduce((a, w) => (f(w) < f(a) ? w : a));
  assert.ok(Math.abs(deepest - 6.07) < 0.01 && f(deepest) < 1 && Math.max(...grid.map(f)) < 11, 'the deeper valley is the right-hand one, and the curve fits the window');
  const rested = (start, extra = {}) => {
    const rest = roll(f, df, { start, rate: 0.1, lo: 0, hi: 7.5, ...extra });
    return { ...rest, deepest: rest.settled && Math.abs(rest.w - deepest) < 0.3 };
  };
  for (const start of range(0, 7.5, 0.25)) {
    const rest = rested(start);
    assert.ok(rest.settled && !rest.escaped, `from ${start} the ball comes to rest within the 40 steps of "Roll"`);
    const verdict = step.check(rest);
    assert.equal(verdict === true, start >= 3.75, `start ${start}`);
    if (verdict !== true) assert.ok(/deeper valley/.test(verdict) && Math.abs(rest.w - 1.58) < 0.05, `start ${start}`);
    assert.notEqual(step.check(rested(start, { steps: 0 })), true, 'no start passes before the ball has rolled');
  }
  assert.equal(step.check(rested(step.solution.start, { steps: step.solution.steps, untilSettled: false })), true, 'the stated solution');
});

const netSorts = (A, B, out, pts = PLANTS) => {
  const on = (n, x, y) => (n.w1 * x + n.w2 * y + n.b > 1e-9 ? 1 : 0);
  return pts.filter(([x, y, kind]) => (out.a * on(A, x, y) + out.b * on(B, x, y) + out.c > 1e-9) === (kind === 1)).length;
};

test('layers/second-border: passes exactly when all 16 are sorted; advice about the bias alone is never a dead end', () => {
  const step = raw('layers', 'second-border');
  const A = { w1: -1, w2: 1, b: 2 };
  const out = { a: 1, b: 1, c: -1.5 };
  const solves = (w1, w2, b) => netSorts(A, { w1, w2, b }, out) === 16;
  assert.equal(step.check({ A, B: step.solution.B, out, solved: solves(step.solution.B.w1, step.solution.B.w2, step.solution.B.b) }), true);
  let noBiasWorks = 0;
  for (const [w1, w2, b] of sliderSettings()) {
    assert.equal(netSorts(A, { w1, w2, b }, out), netCorrect(A, { w1, w2, b }, out));
    const verdict = step.check({ A, B: { w1, w2, b }, out, solved: solves(w1, w2, b) });
    assert.equal(verdict === true, solves(w1, w2, b), `B = ${w1}/${w2}/${b}`);
    if (verdict === true) continue;
    if (/Flip the signs/.test(verdict)) assert.ok(solves(-w1, -w2, -b));
    else if (/Give water a negative weight/.test(verdict)) assert.ok(w2 >= 0);
    else if (/Give sunlight a positive weight/.test(verdict)) assert.ok(w1 <= 0);
    else {
      assert.ok(w1 > 0 && w2 < 0 && /adjust the bias/.test(verdict), verdict);
      if (range(-20, 20, 1).some((bias) => solves(w1, w2, bias))) continue;
      noBiasWorks += 1;
      assert.match(verdict, /balance of the two weights/, `B = ${w1}/${w2}: no bias sorts all 16, so “adjust the bias” alone would be a dead end`);
    }
  }
  assert.ok(noBiasWorks > 0, 'some weight pairs with the right signs are too lopsided for any bias');
});

test('layers/output-neuron: passes exactly for an "and" neuron, and each message is true of the state', () => {
  const step = raw('layers', 'output-neuron');
  const A = { w1: -1, w2: 1, b: 2 };
  const B = { w1: 1, w2: -1, b: 2 };
  assert.equal(netSorts(A, B, { a: 1, b: 1, c: -0.5 }), 8, 'the "or" neuron it starts from says "thrives" for all 16');
  for (const a of range(-2, 2, 0.5)) for (const b of range(-2, 2, 0.5)) for (const c of range(-3, 3, 0.5)) {
    const fires = { neither: c > 1e-9, onlyA: a + c > 1e-9, onlyB: b + c > 1e-9, both: a + b + c > 1e-9 };
    const verdict = step.check({ out: { a, b, c }, fires, solved: netSorts(A, B, { a, b, c }) === 16 });
    assert.equal(verdict === true, fires.both && !fires.onlyA && !fires.onlyB && !fires.neither, `output ${a}/${b}/${c}`);
    if (verdict === true) continue;
    if (/neither A nor B/.test(verdict)) assert.ok(fires.neither);
    else if (/stays off even when both fire/.test(verdict)) assert.ok(!fires.both);
    else assert.ok(/when only one of them does/.test(verdict) && (fires.onlyA || fires.onlyB), `output ${a}/${b}/${c}: ${verdict}`);
  }
  // the worked numbers in the hints and the explanation
  assert.deepEqual([1 - 1.5 > 0, 2 - 1.5 > 0, 1 - 1 > 0, 2 - 1 > 0], [false, true, false, true]);
});

test('layers/watch-it-learn: gradient descent on the smooth network sorts all 16 within a few hundred steps', () => {
  // the same task as the widget (smooth neurons, squared error, rate 4, inputs centred on 5 and scaled by 2.5),
  // but with slopes measured numerically instead of by the widget's formulas
  const sig = (z) => 1 / (1 + Math.exp(-z));
  const pts = PLANTS.map(([x, y, kind]) => [(x - 5) / 2.5, (y - 5) / 2.5, kind]);
  const output = (p, u, v) => sig(p[6] * sig(p[0] * u + p[1] * v + p[2]) + p[7] * sig(p[3] * u + p[4] * v + p[5]) + p[8]);
  const error = (p) => mean(pts.map(([u, v, kind]) => (output(p, u, v) - kind) ** 2));
  const right = (p) => pts.filter(([u, v, kind]) => (output(p, u, v) > 0.5) === (kind === 1)).length;
  let p = [2.5, 0, 0, 0, 2.5, 0, 1, 1, -1];       // A: sunlight > 5 · B: water > 5 · out: 1, 1, −1
  assert.equal(right(p), 8);
  let steps = 0;
  let rises = 0;
  while (steps < 400 && !(error(p) < 0.01 && right(p) === 16)) {
    const slopes = p.map((_, i) => { const up = p.slice(); up[i] += 1e-6; const down = p.slice(); down[i] -= 1e-6; return (error(up) - error(down)) / 2e-6; });
    const next = p.map((value, i) => value - 4 * slopes[i]);
    if (error(next) > error(p)) rises += 1;
    p = next;
    steps += 1;
  }
  assert.equal(right(p), 16);
  assert.ok(steps > 100 && steps < 400, `"a few hundred small downhill steps": ${steps}`);
  assert.equal(rises, 0, 'every step went downhill');
  assert.equal(raw('layers', 'watch-it-learn').check({ trained: true, solved: true, steps }), true);
  assert.equal(raw('layers', 'try-one').check({ best: 12 }), true);
  assert.notEqual(raw('layers', 'try-one').check({ best: 11 }), true);
});

test('predicting-words/write-something-new: a new sentence passes, a copied or a two-word one does not', () => {
  const step = raw('predicting-words', 'write-something-new');
  const state = (words) => {
    const text = [...words.split(' '), '.'];
    for (let i = 1; i < text.length; i++) assert.ok(followers(CAT_SENTENCES, text[i - 1])[text[i]] > 0, `the model offers “${text[i]}” after “${text[i - 1]}”`);
    const copied = CAT_SENTENCES.includes(words);
    return { text, ended: true, full: false, copied, novel: !copied };
  };
  assert.deepEqual(step.solution.text, state('the dog sat on the rug').text);
  assert.equal(step.check(state('the dog sat on the rug')), true);
  assert.equal(step.check(state('the cat sat on the dog saw the mat')), true, 'the nonsense sentence quoted in the explanation can be written');
  assert.match(step.check(state('the cat sat on the mat')), /word for word/);
  assert.match(step.check(state('the cat')), /at least four words/);
  // every new sentence is either two words long or at least four, so that message never misleads
  const lengths = new Set();
  const walk = (text) => {
    if (text.length > 7) return;
    if (text[text.length - 1] === '.') { if (!CAT_SENTENCES.includes(text.slice(0, -1).join(' '))) lengths.add(text.length - 1); return; }
    for (const next of Object.keys(followers(CAT_SENTENCES, text[text.length - 1]))) walk([...text, next]);
  };
  walk(['the']);
  assert.ok(lengths.has(2) && !lengths.has(3), [...lengths].join());
  // with no randomness the model has made 6 picks and repeated a pair of words well before the 12-word limit
  assert.equal(raw('predicting-words', 'no-randomness').check({ temperature: 0, modelPicks: 6, repeats: true, full: false }), true);
  assert.notEqual(raw('predicting-words', 'no-randomness').check({ temperature: 1, modelPicks: 11, repeats: true, full: true }), true);
});

test('limits/what-the-text-says: the two blanks are the shares in the six sentences', () => {
  const s = resolveStep(raw('limits', 'what-the-text-says'), makeRng(1), 'what-the-text-says');
  const doctor = followers(DOCTOR_SENTENCES, 'doctor said');
  const nurse = followers(DOCTOR_SENTENCES, 'nurse said');
  const share = (row, word) => (100 * (row[word] || 0)) / Object.values(row).reduce((t, v) => t + v, 0);
  assert.deepEqual(s.blanks.map((blank) => blank.numbers), [[share(doctor, 'she')], [share(nurse, 'he')]]);
  assert.deepEqual([share(doctor, 'she'), share(nurse, 'he')], [25, 0]);
});

/* ---- the tomato experiment: exact least-squares fits (fractions, no rounding) to the widget's built-in data */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
class Frac {
  constructor(n, d = 1n) { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; this.n = n / g; this.d = d / g; }
  plus(o) { return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  minus(o) { return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  times(o) { return new Frac(this.n * o.n, this.d * o.d); }
  over(o) { return new Frac(this.n * o.d, this.d * o.n); }
  valueOf() { return Number(this.n) / Number(this.d); }
}
const tenth = (v) => new Frac(BigInt(Math.round(v * 10)), 10n);     // every data value has one decimal
/** The least-squares polynomial with `weights` coefficients, by solving the normal equations exactly. */
function exactFit(pts, weights) {
  const zero = new Frac(0n);
  const powers = pts.map(([x]) => { const row = [new Frac(1n)]; for (let k = 1; k <= 2 * weights; k++) row.push(row[k - 1].times(tenth(x))); return row; });
  const M = [];
  for (let i = 0; i < weights; i++) {
    M.push([]);
    for (let j = 0; j < weights; j++) M[i].push(powers.reduce((t, row) => t.plus(row[i + j]), zero));
    M[i].push(powers.reduce((t, row, k) => t.plus(row[i].times(tenth(pts[k][1]))), zero));
  }
  for (let c = 0; c < weights; c++) {
    let pivot = c;
    while (M[pivot][c].n === 0n) pivot += 1;
    [M[c], M[pivot]] = [M[pivot], M[c]];
    for (let r = 0; r < weights; r++) {
      if (r === c) continue;
      const factor = M[r][c].over(M[c][c]);
      for (let k = c; k <= weights; k++) M[r][k] = M[r][k].minus(factor.times(M[c][k]));
    }
  }
  const coef = M.map((row, i) => row[weights].over(row[i]));
  return (x) => { let y = zero; let p = new Frac(1n); for (const c of coef) { y = y.plus(c.times(p)); p = p.times(tenth(x)); } return Number(y); };
}

test('limits: the tomato model. Only 10 weights fit every plant; 3 weights are best on fresh data; more only get worse', () => {
  const source = fs.readFileSync(new URL('../src/widgets/overfit-lab.js', import.meta.url), 'utf8');
  const TRAIN = JSON.parse(/const TRAIN = (\[\[.*?\]\]);/.exec(source)[1]);
  const TEST = JSON.parse(/const TEST = (\[\[.*?\]\]);/.exec(source)[1]);
  assert.deepEqual([TRAIN.length, TEST.length], [10, 12], 'ten training plants, twelve fresh ones');
  const peak = TRAIN.reduce((a, p) => (p[1] > a[1] ? p : a));
  assert.ok(Math.abs(peak[0] - 5) < 0.6, 'the harvest peaks at about 5 litres a week');
  const sizes = range(2, 10, 1);
  const fits = Object.fromEntries(sizes.map((k) => { const f = exactFit(TRAIN, k); return [k, { train: mean(TRAIN.map(([x, y]) => (f(x) - y) ** 2)), fresh: mean(TEST.map(([x, y]) => (f(x) - y) ** 2)) }]; }));
  // never-miss: the training error only ever falls, and only the 10-weight curve gets it under 0.05 (it is zero)
  const neverMiss = raw('limits', 'never-miss');
  for (const k of sizes) {
    if (k > 2) assert.ok(fits[k].train <= fits[k - 1].train + 1e-9, `training error at ${k} weights`);
    assert.equal(neverMiss.check({ weights: k, trainError: Math.round(fits[k].train * 1000) / 1000 }) === true, k === 10, `${k} weights`);
  }
  assert.ok(fits[10].train < 1e-12);
  // fresh-data: lowest at 3 weights, falling before and rising all the way after
  const best = sizes.reduce((a, k) => (fits[k].fresh < fits[a].fresh ? k : a));
  assert.equal(best, 3);
  assert.ok(fits[2].fresh > fits[3].fresh);
  for (const k of sizes) if (k > 3) assert.ok(fits[k].fresh > fits[k - 1].fresh, `fresh error at ${k} weights`);
  assert.ok(fits[10].fresh > 5 * fits[3].fresh, 'the curve that never misses is by far the worst on fresh data');
  const fresh = raw('limits', 'fresh-data');
  assert.match(fresh.check({ revealed: false, weights: 3, best }), /Reveal fresh data/);
  for (const k of sizes) {
    const verdict = fresh.check({ revealed: true, weights: k, best });
    assert.equal(verdict === true, k === 3);
    if (k > 3) assert.match(verdict, /Try fewer weights/);
    if (k < 3) assert.match(verdict, /Try more weights/);
  }
  assert.equal(fresh.solution.weights, 3);
  const batch = raw('limits', 'another-batch');
  assert.equal(batch.check({ sampledAt: batch.solution.sampledAt }), true);
  assert.match(batch.check({ sampledAt: { 10: 2 } }), /3 weights/);
  assert.match(batch.check({ sampledAt: { 3: 5 } }), /10 weights/);
});

/* ==========================================================================
   Teach before you ask. Every lesson shows a thing before it asks for it. The
   worked examples use numbers that the practice step after them cannot
   produce, and every number quoted on a teaching screen is re-derived here.
   ========================================================================== */
/** The teaching screens added in the "teach before you ask" revision, each with the first step it serves. */
const TEACHING = {
  'prediction-machines': [['example-use-recipe', 'use-recipe'], ['teach-error', 'average-miss'], ['teach-machine-learning', 'rules-or-examples'], ['teach-far-from-examples', 'far-from-examples']],
  'a-single-neuron': [['teach-weights', 'read-weights'], ['teach-border', 'knobs'], ['teach-one-border', 'neuron-facts']],
  'learning-by-descent': [['example-one-step', 'one-step'], ['teach-learning-rate', 'rate-symptoms'], ['teach-training', 'training-loop'], ['teach-low-point', 'descent-facts']],
  layers: [['teach-band', 'what-is-missing'], ['teach-deeper-layers', 'edges-to-objects']],
  'predicting-words': [['teach-counting', 'read-the-bars'], ['teach-temperature', 'zero-randomness'], ['teach-tokens', 'tokens'], ['teach-lm-training', 'training-a-language-model']],
  limits: [['teach-skew', 'skewed-in-skewed-out'], ['teach-overfitting', 'diagnose'], ['teach-habits', 'good-habits']],
};
const at = (lesson, id) => { raw(lesson, id); return lessons[lesson].steps.findIndex((s) => s.id === id); };
const resolved = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
/** `teach` (an info step) comes before `ask` and its text contains every one of `terms`. */
function teaches(lesson, teach, ask, terms = []) {
  const step = raw(lesson, teach);
  assert.equal(step.type, 'info', `${lesson}/${teach} is a teaching screen`);
  assert.ok(at(lesson, teach) < at(lesson, ask), `${lesson}: "${teach}" comes before "${ask}"`);
  for (const term of terms) assert.match(step.text, term, `${lesson}/${teach} teaches ${term}`);
  return step;
}
const close = (a, b) => Math.abs(a - b) < 1e-9;

test('teach before you ask: the shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  assert.deepEqual(Object.keys(TEACHING), Object.keys(lessons));
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((step) => resolved(id, step.id));     // `graded` exists only on resolved steps
    const roles = steps.map(role);
    assert.ok(steps.length >= 12 && steps.length <= 18, `${id}: ${steps.length} steps`);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    // only a screen that is followed by something to answer counts as teaching
    const lastAsked = roles.reduce((last, kind, i) => (kind === 'teach' ? last : i), -1);
    assert.ok(roles.filter((kind, i) => kind === 'teach' && i < lastAsked).length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const [teach, ask] of TEACHING[id]) {
      teaches(id, teach, ask);
      const next = roles.indexOf('graded', at(id, teach) + 1);
      assert.ok(next > 0 && next <= at(id, ask), `${id}/${teach}: nothing graded is asked between it and "${ask}"`);
    }
  }
});

test('teach before you ask, lesson 1: a worked prediction, a worked average miss, rules or examples, far from the examples', () => {
  const L = 'prediction-machines';
  // the four words of the vocabulary step, and of the lesson, are defined before the first calculation
  const names = teaches(L, 'name-it', 'use-recipe', [/\*\*model\*\*/, /\*\*input\*\*/, /\*\*prediction\*\*/, /\*\*weights\*\*/, /\*\*error\*\*/]);
  for (const [word] of raw(L, 'vocabulary').pairs) assert.ok(names.text.toLowerCase().includes(word.split(' ')[0].toLowerCase()), word);

  // the worked prediction: w × 2 + b, which the practice step cannot ask (its inputs start at 3)
  const use = teaches(L, 'example-use-recipe', 'use-recipe', [/:::example/, /each extra kilometre adds/, /prediction for 0 km/]);
  assert.ok(at(L, 'example-use-recipe') < at(L, 'read-weight'));
  const m = /\\blue\{(\d+)\} \\times (\d+) \+ \\orange\{(\d+)\} = (\d+) \+ (\d+) = (\d+)\$ minutes/.exec(use.text).slice(1).map(num);
  assert.deepEqual([m[0] * m[1], m[2], m[0] * m[1] + m[2]], [m[3], m[4], m[5]]);
  assert.deepEqual([use.figure.w.value, use.figure.b.value, use.figure.probe], [m[0], m[2], m[1]]);
  assert.ok(use.text.includes(`An order from ${m[1]} km away`));
  const more = /For (\d+) km the model says (\d+) minutes/.exec(use.text).slice(1).map(num);
  assert.deepEqual([more[0], more[1]], [m[1] + 1, m[5] + m[0]], 'one kilometre more, w minutes more');
  assert.ok(close(miss(DELIVERIES, m[0], m[2]), 0.75), 'the model on that screen is the one the learner tuned');
  for (const s of variants(L, 'use-recipe')) {
    const x = num(/\*\*What does it predict for (?:an order|a sunflower that is|a day of) (\d+)\s/.exec(s.text)[1]);
    assert.ok(x > m[1], 'the worked input is smaller than any the practice step asks about');
  }

  // the worked average miss: the table is what the line in the figure does to the three orders
  const err = teaches(L, 'teach-error', 'average-miss', [/\*\*error\*\*/, /\*\*average miss\*\*/, /drop the sign/, /:::example/]);
  const rows = [...err.text.matchAll(/\| (\d+) min \| (\d+) min \| (\d+) \|/g)].map((r) => r.slice(1).map(num));
  assert.deepEqual(rows, err.figure.points.map(([x, y]) => { const p = err.figure.w.value * x + err.figure.b.value; return [p, y, Math.abs(p - y)]; }));
  const quoted = /\\frac\{([\d +]+)\}\{(\d+)\} = (\d+)\$ minutes/.exec(err.text);
  assert.deepEqual(quoted[1].split(' + ').map(num), rows.map((r) => r[2]));
  assert.equal(num(quoted[2]), rows.length);
  assert.equal(num(quoted[3]), mean(rows.map((r) => r[2])));
  assert.ok(rows.some(([p, y]) => p > y) && rows.some(([p, y]) => p < y), 'it shows a miss in each direction');
  const smallest = Math.min(...rows.map((r) => r[0]));
  for (const s of variants(L, 'average-miss')) {
    for (const r of s.text.matchAll(/\| [ABC] \| (\d+) min \|/g)) assert.ok(num(r[1]) < smallest, 'the practice step never predicts a time from the worked example');
  }

  const ml = teaches(L, 'teach-machine-learning', 'rules-or-examples', [/rules that a person wrote down/, /found from examples/, /\*\*machine learning\*\*/]);
  for (const item of raw(L, 'rules-or-examples').items) assert.ok(!ml.text.includes(item.text), 'the sorting step asks about new cases');

  // far from the examples: the battery line, asked about more hours than any example has
  const far = teaches(L, 'teach-far-from-examples', 'far-from-examples', [/whether or not it has seen anything like it/, /Far from them/]);
  assert.ok(at(L, 'downhill-data') < at(L, 'teach-far-from-examples'), 'the battery model is tuned first');
  const f = /-(\d+) \\times (\d+) \+ (\d+) = -(\d+)/.exec(far.text).slice(1).map(num);
  assert.equal(-f[0] * f[1] + f[2], -f[3]);
  assert.deepEqual([far.figure.w.value, far.figure.b.value, far.figure.probe], [-f[0], f[2], f[1]]);
  assert.deepEqual([far.figure.w.value, far.figure.b.value], [raw(L, 'downhill-data').solution.w, raw(L, 'downhill-data').solution.b]);
  assert.deepEqual(far.figure.points, BATTERY);
  assert.deepEqual([Math.min(...BATTERY.map((p) => p[0])), Math.max(...BATTERY.map((p) => p[0]))], [0.5, 7], '"from half an hour to 7 hours"');
  assert.ok(f[1] > 7 && far.figure.y[0] < -f[3] && far.text.includes(`Minus ${f[3]} points`) && raw(L, 'far-from-examples').explain.includes(`minus ${f[3]} points`));
});

test('teach before you ask, lesson 2: a worked weighted sum, what a weight says, what moves the border', () => {
  const L = 'a-single-neuron';
  const inside = teaches(L, 'name-it', 'work-the-sum', [/\*\*Weighted sum\.\*\*/, /\*\*bias\*\*/, /\*\*Threshold\.\*\*/, /:::example/, /A weight of 0/]);
  const head = /:::example Weights (\d+) and −(\d+), bias (\d+), inputs (\d+) and (\d+)/.exec(inside.text).slice(1).map(num);
  const sum = /score = (\d+) × (\d+) − (\d+) × (\d+) \+ (\d+) = (\d+) − (\d+) \+ (\d+) = \*\*(\d+)\*\*\. That is above 0, so the neuron says “yes”/.exec(inside.text).slice(1).map(num);
  assert.deepEqual([sum[0], sum[2], sum[4], sum[1], sum[3]], head);
  assert.deepEqual([sum[0] * sum[1], sum[2] * sum[3], sum[4]], [sum[5], sum[6], sum[7]]);
  assert.ok(sum[5] - sum[6] + sum[7] === sum[8] && sum[8] > 0);
  for (const s of variants(L, 'work-the-sum')) {
    const w1 = num(/weights \*\*(−?\d+)\*\*/.exec(s.text)[1]);
    assert.ok(w1 < head[0], 'the practice step never uses the first weight of the worked example');
  }

  teaches(L, 'teach-weights', 'read-weights', [/positive \| pushes towards “yes”/, /negative \| pushes towards “no”/, /0 \| ignored/, /\*\*sign\*\*/, /\*\*size\*\*/, /what one more of this input does to the score/, /:::example/]);
  assert.ok(at(L, 'plums') < at(L, 'teach-weights') && at(L, 'sourness') < at(L, 'teach-weights'), 'the table names what the learner has already found by hand');
  const [dry, rain] = /\*\*\+(\d+)\*\* on \*days since watering\* and \*\*−(\d+)\*\*/.exec(raw(L, 'teach-weights').text).slice(1).map(num);
  assert.ok(rain / dry > 2, '"that cancels more than two dry days"');

  // the border: the bias slides it, and doubling all three numbers leaves it where it was
  const border = teaches(L, 'teach-border', 'knobs', [/\*\*weights\*\* tilt/, /\*\*bias\*\* slides/, /more points get a “yes”/, /\*balance\*/]);
  const [w, b] = /set both weights to (\d+) and the bias to −(\d+)/.exec(border.text).slice(1).map(num);
  const fig = border.figure;
  assert.deepEqual([fig.points, fig.lock], [MANGOES, undefined], 'the mangoes, with all three knobs free');
  assert.deepEqual([w, -b], [2 * fig.w1.value, 2 * fig.b.value]);
  assert.equal(fig.w1.value, fig.w2.value);
  assert.ok(sliderSettings().some(([w1, w2, bias]) => w1 === w && w2 === w && bias === -b), 'the sliders can reach it');
  for (const [x, y] of MANGOES) assert.equal(w * x + w * y - b > 0, fig.w1.value * x + fig.w2.value * y + fig.b.value > 0);
  assert.equal(sorted(MANGOES, w, w, -b), 16);
  assert.ok(sorted(MANGOES, 1, 1, -9) === 16 && MANGOES.filter(([x, y]) => x + y - 5 > 0).length > MANGOES.filter(([x, y]) => x + y - 10 > 0).length, 'a higher bias, more “yes”');

  const one = teaches(L, 'teach-one-border', 'neuron-facts', [/\*\*straight line\*\*/, /stores no examples/, /15 of 16/]);
  assert.ok(at(L, 'odd-one-out') < at(L, 'teach-one-border'));
  assert.deepEqual(one.figure.points, MESSY_MANGOES);
  assert.equal(sorted(MESSY_MANGOES, one.figure.w1.value, one.figure.w2.value, one.figure.b.value), 15);
});

test('teach before you ask, lesson 3: a worked step, the learning rate, one round of training, a low point', () => {
  const L = 'learning-by-descent';
  const f = (w) => (w - 4) ** 2;
  const df = (w) => 2 * (w - 4);
  const valley = { start: 1.5, lo: 0, hi: 8 };
  teaches(L, 'name-it', 'one-step', [/\*\*gradient descent\*\*/, /learning rate/, /slope/]);
  const worked = teaches(L, 'example-one-step', 'one-step', [/:::example/, /Taking away a negative number adds/]);
  assert.deepEqual([worked.figure.curve, worked.figure.start, worked.figure.rate], ['(w - 4)^2', 1.5, 0.25]);
  const first = /\$([\d.]+) - ([\d.]+) \\times \((-\d+)\) = [\d.]+ \+ ([\d.]+) = ([\d.]+)\$/.exec(worked.text).slice(1).map(Number);
  assert.deepEqual(first, [1.5, 0.25, df(1.5), 0.25 * -df(1.5), 1.5 - 0.25 * df(1.5)]);
  assert.ok(worked.text.includes(`The weight is ${first[0]}. The slope there is −${-first[2]}. The learning rate is ${first[1]}.`));
  const second = /At a weight of (\d+) it is \+(\d+):\s+\$\d+ - ([\d.]+) \\times \d+ = \d+ - (\d+) = (\d+)\$/.exec(worked.text).slice(1).map(Number);
  assert.deepEqual(second, [6, df(6), 0.25, 0.25 * df(6), 6 - 0.25 * df(6)]);
  for (const s of variants(L, 'one-step')) assert.ok(!s.text.includes(`The learning rate is **${first[1]}**`), 'the practice step never uses the learning rate of the worked example');

  // the picture of a rate that is too large: four leaps, each landing higher, all still on the chart
  const rates = teaches(L, 'teach-learning-rate', 'rate-symptoms', [/too small \| tiny/, /too large \| leap across the valley/, /height of the ball is the model’s error/, /as large as it can be without bouncing/]);
  assert.ok(at(L, 'choose-rate') < at(L, 'teach-learning-rate'));
  const pictured = num(/The picture shows a rate of ([\d.]+)/.exec(rates.text)[1]);
  assert.deepEqual([rates.figure.rate, rates.figure.static], [pictured, true]);
  let w = valley.start;
  for (let k = 0; k < rates.figure.steps; k++) {
    const next = w - pictured * df(w);
    assert.ok(next >= valley.lo && next <= valley.hi && f(next) > f(w) && df(next) * df(w) < 0, `leap ${k + 1} crosses the valley and lands higher`);
    w = next;
  }
  assert.ok(rates.figure.steps >= 3);

  teaches(L, 'teach-training', 'training-loop', [/\*\*training\*\*/, /\*\*training data\*\*/, /\*\*Predict\.\*\*/, /\*\*Measure\.\*\*/, /\*\*Find the slopes\.\*\*/, /\*\*Nudge\.\*\*/, /The slope decides/]);
  assert.ok(at(L, 'train-the-line') < at(L, 'teach-training'));

  // the picture of the two valleys: the ball of the exploration, at rest in the shallow one
  const low = teaches(L, 'teach-low-point', 'descent-facts', [/no map/, /not necessarily \*the\* lowest/, /depends on where it starts/]);
  assert.ok(at(L, 'two-valleys') < at(L, 'teach-low-point'));
  const lab = raw(L, 'two-valleys').widget;
  assert.deepEqual([low.figure.curve, low.figure.x, low.figure.start, low.figure.rate], [lab.curve, lab.x, lab.start, lab.rate]);
  const g = (v) => 0.1 * (v - 1.5) ** 2 * (v - 6) ** 2 + 0.3 * (6 - v) + 0.8;
  const dg = (v) => 0.2 * (v - 1.5) * (v - 6) ** 2 + 0.2 * (v - 1.5) ** 2 * (v - 6) - 0.3;
  const rest = roll(g, dg, { start: low.figure.start, rate: low.figure.rate, lo: 0, hi: 7.5, steps: low.figure.steps });
  assert.ok(rest.settled && Math.abs(rest.w - 1.58) < 0.05 && g(rest.w) > g(6.07) + 1, 'at rest in the shallow valley, well above the floor of the deeper one');
});

test('teach before you ask, lesson 4: why one border fails, a worked count, layer upon layer', () => {
  const L = 'layers';
  const band = teaches(L, 'teach-band', 'what-is-missing', [/\*\*band\*\*/, /\*\*both\*\* sides/, /one straight border/]);
  const { w1, w2, b } = band.figure;
  assert.equal(sorted(PLANTS, w1.value, w2.value, b.value), 12);
  const wrong = PLANTS.filter(([x, y, kind]) => (w1.value * x + w2.value * y + b.value > 0) !== (kind === 1));
  assert.ok(wrong.length === 4 && wrong.every(([x, y, kind]) => kind === 0 && x < 5 && y > 5), '"the four at the top left are on the thrives side"');
  assert.ok(PLANTS.filter(([x, y, kind]) => kind === 0 && x > 5 && y < 5).length === 4, 'and four strugglers at the bottom right are fenced off');

  // the output neuron's starting state, worked in its own prompt
  const out = raw(L, 'output-neuron');
  const o = /weights (\d+) and (\d+) and a bias of −([\d.]+)\. When only A fires, its score is\s+\$(\d+) \\times 1 \+ (\d+) \\times 0 - ([\d.]+) = ([\d.]+)\$/.exec(out.text).slice(1).map(num);
  assert.deepEqual([o[0], o[1], -o[2]], [out.widget.out.a, out.widget.out.b, out.widget.out.c]);
  assert.ok(o[3] === o[0] && o[4] === o[1] && o[5] === o[2] && close(o[0] - o[2], o[6]) && o[6] > 0 && o[1] - o[2] > 0);

  // the worked count is the plant network, which the practice step never asks about
  const layers = teaches(L, 'name-it', 'count-weights', [/\*\*layers\*\*/, /\*\*hidden layer\*\*/, /\*\*neural network\*\*/, /one weight for each of its inputs, plus one bias/, /:::example/]);
  assert.ok(at(L, 'output-neuron') < at(L, 'name-it'));
  assert.match(layers.text, /2 weights \+ 1 bias = 3 numbers\. B likewise: 3\./);
  assert.match(layers.text, /The output neuron takes A and B: 2 weights \+ 1 bias = 3\./);
  assert.match(layers.text, /3 \+ 3 \+ 3 = \*\*9\*\*/);
  const seen = new Set();
  for (const s of variants(L, 'count-weights', 600)) {
    const inputs = num(/\*\*(\d+) inputs\*\*/.exec(s.text)[1]);
    const hidden = num(/one hidden layer of \*\*(\d+) neurons\*\*/.exec(s.text)[1]);
    assert.ok(!(inputs === 2 && hidden === 2), 'never the network of the worked example');
    seen.add(`${inputs}/${hidden}`);
  }
  assert.equal(seen.size, 4 * 5 - 1, 'every other size from 2 to 5 inputs and 2 to 6 hidden neurons occurs');

  teaches(L, 'teach-deeper-layers', 'edges-to-objects', [/Each layer works with what the layer before it produced/, /borders into regions/, /emerges during training/]);
  assert.ok(at(L, 'watch-it-learn') < at(L, 'teach-deeper-layers'));
  assert.match(raw(L, 'one-or-many').text, /below 4” takes one level border\.\s+“Yes if it is below 2 or above 8” takes two/);
  for (const item of raw(L, 'one-or-many').items) assert.ok(!/below (2|4)|above 8/.test(item.text), 'the worked line in the prompt is not one of the items');
});

test('teach before you ask, lesson 5: counting, temperature, tokens and one round of training', () => {
  const L = 'predicting-words';
  const counting = teaches(L, 'teach-counting', 'read-the-bars', [/counted what came next/, /:::example/, /table of counts \*\*is\*\* the model/]);
  assert.ok(at(L, 'teach-counting') < at(L, 'count-to-chance'));
  const cat = followers(CAT_SENTENCES, 'cat');
  const total = Object.values(cat).reduce((t, v) => t + v, 0);
  assert.equal(counting.figure.start, 'cat');
  assert.deepEqual([total, cat.sat, cat.saw, cat['.']], [4, 2, 1, 1]);
  assert.ok(counting.text.includes('“cat” occurs 4 times') && counting.text.includes('“sat” twice, “saw” once, and once the sentence ends'));
  assert.ok(counting.text.includes(`2 ÷ 4 = 0.5, or **${(100 * cat.sat) / total}%**`) && counting.text.includes(`1 in 4, or ${(100 * cat.saw) / total}%`));
  // neither that example nor the worked line in the practice step itself can come up as the question
  for (const s of variants(L, 'count-to-chance')) {
    const asked = num(/occurs \*\*(\d+) times\*\*/.exec(s.text)[1]);
    assert.ok(asked !== total && asked !== 12, s.text);
    assert.ok(s.text.includes('(A count of 3 out of 12 would be a chance of 3 ÷ 12 = 0.25, or 25%.)'));
  }
  assert.equal(3 / 12, 0.25);

  const temp = teaches(L, 'teach-temperature', 'zero-randomness', [/\*\*At 0\*\*/, /\*\*At 1\*\*/, /\*\*Higher still\*\*/, /\*\*temperature\*\*/, /\*\*prompt\*\*/]);
  assert.ok(at(L, 'no-randomness') < at(L, 'teach-temperature') && at(L, 'teach-temperature') < at(L, 'model-facts'));
  const the = followers(CAT_SENTENCES, 'the');
  assert.ok(temp.text.includes(`“cat” about ${the.cat * 10} times in 100, “dog” about ${the.dog * 10}`) && the.rug === Math.min(...Object.values(the)));
  assert.equal(Object.keys(the).length, 4, 'four words follow “the”; the practice step always offers three');

  assert.ok(at(L, 'scale-up') < at(L, 'why-not-a-table'));
  assert.match(raw(L, 'scale-up').text, /Weights, not counts/);
  assert.match(raw(L, 'why-not-a-table').text, /Take any 50 words from a book: that exact sequence has probably never been written anywhere else/);

  teaches(L, 'teach-tokens', 'tokens', [/\*\*tokens\*\*/, /A common word is one token/, /split into several pieces/, /fixed before training begins/, /down to single letters/]);
  assert.ok(!raw(L, 'teach-tokens').text.includes('flurbish'), 'the made-up word is new in the question');
  teaches(L, 'teach-lm-training', 'training-a-language-model', [/hide its last token/, /gives every possible next token a chance/, /The lower the chance it got, the bigger the error/, /nudges all the weights/, /the weights, not the text/, /no step asks whether the text is \*true\*/]);
  assert.ok(at(L, 'teach-lm-training') < at(L, 'model-facts'));
});

test('teach before you ask, lesson 6: where errors cluster, lopsided text, overfitting in numbers, habits', () => {
  const L = 'limits';
  teaches(L, 'likely-is-not-true', 'where-errors-cluster', [/a page number/, /a reference/, /a long sum/, /after the training text was collected/]);

  const skew = teaches(L, 'teach-skew', 'skewed-in-skewed-out', [/\*\*these six sentences\*\*/, /whatever patterns its training data contain/, /garbage in, garbage out/]);
  assert.ok(at(L, 'what-the-text-says') < at(L, 'teach-skew'));
  const doctor = followers(DOCTOR_SENTENCES, 'doctor said');
  assert.ok(skew.text.includes(`gives “he” a chance of ${(100 * doctor.he) / (doctor.he + doctor.she)}%`));
  assert.deepEqual([skew.figure.corpus, skew.figure.start, skew.figure.context], [DOCTOR_SENTENCES, 'the doctor said', 2]);
  assert.ok(!skew.text.includes('engineer'), 'the question after it is a new case');

  // the table of errors is what the widget shows for 2, 3 and 10 weights
  const over = teaches(L, 'teach-overfitting', 'diagnose', [/\*\*2 weights: too simple\.\*\*/, /\*\*10 weights: overfitting\.\*\*/, /tiny training error next to a large error on fresh data/, /\*\*test data\*\*/]);
  assert.ok(at(L, 'fresh-data') < at(L, 'teach-overfitting'));
  const source = fs.readFileSync(new URL('../src/widgets/overfit-lab.js', import.meta.url), 'utf8');
  const TRAIN = JSON.parse(/const TRAIN = (\[\[.*?\]\]);/.exec(source)[1]);
  const TEST = JSON.parse(/const TEST = (\[\[.*?\]\]);/.exec(source)[1]);
  const table = [...over.text.matchAll(/\| (\d+) \| ([\d.]+) \| ([\d.]+) \|/g)].map((r) => r.slice(1).map(Number));
  assert.deepEqual(table.map((r) => r[0]), [2, 3, 10]);
  for (const [k, train, fresh] of table) {
    const fit = exactFit(TRAIN, k);
    assert.ok(Math.abs(mean(TRAIN.map(([x, y]) => (fit(x) - y) ** 2)) - train) < 0.005, `training error with ${k} weights`);
    assert.ok(Math.abs(mean(TEST.map(([x, y]) => (fit(x) - y) ** 2)) - fresh) < 0.005, `fresh error with ${k} weights`);
  }
  assert.equal(over.figure.weights.value, 10);
  assert.ok(table[0][1] > 5 * table[1][1] && table[0][2] > 3 * table[1][2], 'the straight line does badly on both');

  teaches(L, 'teach-habits', 'good-habits', [/Match the checking to the stakes/, /need no checking/, /independent source/, /must be opened/, /may be kept by the company/]);
});
