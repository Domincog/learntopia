/**
 * Statistical Inference: independent checks of the course.
 *
 * Every generated step is run with many seeds and its answer is re-derived
 * here from the *text the learner sees*, with maths written for this file
 * (a normal curve integrated numerically, binomial chances built up one flip
 * at a time, every deal of a permutation test listed). The fixed data sets
 * behind the figures are checked against every number the lessons quote
 * about them, and each interactive check is tried on the states a learner
 * can reach. The widgets' own exact formulas are compared with the same
 * independent maths, because the lessons quote what the widgets display.
 *
 *   node --test tests/inference-course.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { numbersMatch } from '../src/player/ui.js';
import { population } from '../src/widgets/sample-means.js';
import { MULTIPLIER, catches } from '../src/widgets/interval-rain.js';
import { binomialDist, hypergeometricDist, subsetSumDist } from '../src/widgets/null-sim.js';
import { normalCdf, upperZ, rates } from '../src/widgets/power-lab.js';
import { pText } from '../src/widgets/many-tests.js';
import { compare } from '../src/widgets/assign-lab.js';
import { RAIN, PLANTS, STUDENTS, HACK, DRAWER, FLAVOURS, binomTail } from '../content/courses/inference/helpers.js';

const SEEDS = 250;
const LESSONS = ['sampling-distributions', 'confidence-intervals', 'hypothesis-tests', 'errors-and-power', 'experiments', 'forking-paths'];
/** Every generated step of the course. Each one is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'sampling-distributions': ['se-calc', 'bigger-sample', 'band-95'],
  'confidence-intervals': ['ci-calc', 'poll-margin', 'poll-read', 'meaning-review'],
  'hypothesis-tests': ['read-p', 'verdict'],
  'errors-and-power': ['count-errors', 'no-evidence'],
  experiments: ['ab-read', 'which-design'],
  'forking-paths': ['expected', 'at-least-one'],
};
const tested = new Set();
const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/inference/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, 'inference', id);
}

/* ---------------------------------------------------------------- helpers */

const rawStep = (lessonId, stepId) => {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  return raw;
};
/** A step that is not generated, in the shape the player sees. */
const fixed = (lessonId, stepId) => resolveStep(rawStep(lessonId, stepId), makeRng(1), stepId);
/** Run a step's generator with many seeds and hand each concrete step to `verify`. */
function eachVariant(lessonId, stepId, verify) {
  const raw = rawStep(lessonId, stepId);
  assert.equal(typeof raw.gen, 'function', `${lessonId}/${stepId} is generated`);
  assert.ok(GENERATED[lessonId].includes(stepId), `${lessonId}/${stepId} is listed in GENERATED`);
  tested.add(`${lessonId}/${stepId}`);
  const seen = new Set();
  for (let seed = 1; seed <= SEEDS; seed++) {
    const step = resolveStep(raw, makeRng(seed * 7919 + 13), stepId);
    seen.add(step.text);
    try { verify(step); } catch (err) { err.message = `${lessonId}/${stepId} (seed ${seed}): ${err.message}\n  text: ${step.text.replace(/\s+/g, ' ').trim()}`; throw err; }
  }
  assert.ok(seen.size >= 4, `${lessonId}/${stepId} has some variety (${seen.size} different texts)`);
}
const near = (a, b, msg, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${msg || 'values differ'}: ${a} vs ${b}`);
const plain = (s) => String(s).replace(/,/g, '');
/** The pieces of a text that are set in bold. */
const bolds = (text) => [...text.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1]);
/** The first number in a piece of text ("1,600 people" -> 1600). */
const firstNum = (s) => { const m = /-?\d[\d,]*(?:\.\d+)?/.exec(s); assert.ok(m, `"${s}" contains a number`); return Number(plain(m[0])); };
const grab = (text, re, what) => { const m = re.exec(text); assert.ok(m, `the text states ${what}`); return m; };
const blank = (step, i) => step.blanks[i].numbers[0];
const correctOption = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, 'exactly one correct option'); return right[0]; };
const correctIndex = (step) => { correctOption(step); return step.options.findIndex((o) => o.correct); };
/** Every anticipated slip is clear of the answer, so that its message can be seen and the answer is never mistaken for it. */
function slipsAreWrong(step) {
  const tol = step.tolerance || 0;
  for (const [value, message] of step.wrong) {
    assert.ok(Math.abs(value - step.answer) > 2 * tol + 1e-12, `the slip ${value} is too close to the answer ${step.answer}`);
    assert.ok(message.length > 20, 'the slip has a message');
  }
  const values = step.wrong.map(([v]) => v);
  for (let i = 0; i < values.length; i++) for (let j = i + 1; j < values.length; j++) assert.ok(Math.abs(values[i] - values[j]) > 2 * tol + 1e-12, `two slips share the value ${values[i]}`);
}
/** Every piece of text a learner can meet in a step. */
function textsOf(step) {
  const out = [step.title, step.text, step.explain, step.template, step.model, step.prefix, step.unit, ...(step.hints || [])];
  for (const o of step.options || []) out.push(o.text, o.why);
  for (const it of step.items || []) { if (typeof it === 'string') out.push(it); else out.push(it.text, it.why); }
  for (const p of step.pairs || []) out.push(p[0], p[1]);
  for (const b of step.buckets || []) out.push(b);
  for (const w of step.wrong || []) out.push(w[1]);
  return out.filter((t) => typeof t === 'string');
}

/* ------------------------------------------------- maths written for this file */

const density = (x) => Math.exp((-x * x) / 2) / Math.sqrt(2 * Math.PI);
/** Standard normal cumulative distribution by Simpson's rule (nothing in common with the widget's formula). */
function Phi(z) {
  if (z < -9) return 0;
  if (z > 9) return 1;
  const a = Math.abs(z);
  const n = 2000;
  const h = a / n;
  let t = density(0) + density(a);
  for (let i = 1; i < n; i++) t += density(i * h) * (i % 2 ? 4 : 2);
  const half = (t * h) / 3;
  return z >= 0 ? 0.5 + half : 0.5 - half;
}
/** The z that has a share `tail` of the bell above it. */
function zAbove(tail) {
  let lo = -9;
  let hi = 9;
  for (let i = 0; i < 70; i++) { const mid = (lo + hi) / 2; if (1 - Phi(mid) > tail) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
/** A two-group experiment on scores with SD `sd`: n per group, results above `threshold` count as significant. */
function experiment({ sd = 10, n, effect, threshold, alpha }) {
  const se = sd * Math.sqrt(2 / n);
  const line = threshold != null ? threshold : zAbove(alpha) * se;
  return { se, threshold: line, alpha: 1 - Phi(line / se), power: 1 - Phi((line - effect) / se), miss: Phi((line - effect) / se) };
}
/** Chances of 0 … n successes, built up one try at a time. */
function binomial(n, p) {
  let d = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(d.length + 1).fill(0);
    d.forEach((v, k) => { next[k] += v * (1 - p); next[k + 1] += v * p; });
    d = next;
  }
  return d;
}
const upper = (dist, k) => dist.slice(k).reduce((a, b) => a + b, 0);
/** The chance that Student's t with `df` degrees of freedom lies within ±c, by Simpson's rule on its density. */
function tWithin(df, c) {
  // the constant of the density, built up from Γ(1/2) = √π and Γ(1) = 1 with Γ(x + 1) = x Γ(x)
  // (in logarithms, so that large degrees of freedom do not overflow)
  const logGammaHalves = (twice) => { let g = twice % 2 ? Math.log(Math.PI) / 2 : 0; for (let x = twice % 2 ? 0.5 : 1; x < twice / 2 - 1e-9; x += 1) g += Math.log(x); return g; };
  const k = Math.exp(logGammaHalves(df + 1) - logGammaHalves(df)) / Math.sqrt(df * Math.PI);
  const f = (x) => k * (1 + (x * x) / df) ** (-(df + 1) / 2);
  const n = 4000;
  const h = c / n;
  let t = f(0) + f(c);
  for (let i = 1; i < n; i++) t += f(i * h) * (i % 2 ? 4 : 2);
  return (2 * t * h) / 3;
}
/** n choose k, exactly. */
function choose(n, k) {
  let out = 1n;
  for (let i = 1n; i <= BigInt(k); i++) out = (out * (BigInt(n) - i + 1n)) / i;
  return out;
}
const ratio = (a, b) => Number((a * 10n ** 15n) / b) / 1e15;
const sum = (list) => list.reduce((a, b) => a + b, 0);
const mean = (list) => sum(list) / list.length;
const sdOf = (list) => { const m = mean(list); return Math.sqrt(mean(list.map((v) => (v - m) ** 2))); };
const pc = (v, digits = 1) => String(Math.round(v * 100 * 10 ** digits) / 10 ** digits);

test('the maths in this file agrees with known values, and so do the widgets', () => {
  near(Phi(1.96), 0.9750021, 'Phi(1.96)', 1e-6);
  near(Phi(-1), 0.1586553, 'Phi(-1)', 1e-6);
  near(zAbove(0.05), 1.644854, 'z for 5%', 1e-5);
  near(tWithin(10, 2.228), 0.95, 'the t table at 10 degrees of freedom', 2e-4);
  near(tWithin(4, 2.776), 0.95, 'the t table at 4 degrees of freedom', 2e-4);
  near(tWithin(2000, 1.96), 2 * Phi(1.96) - 1, 't with many degrees of freedom is nearly normal', 5e-4);
  for (const z of [-3.1, -1.2, 0, 0.4, 1.645, 2.33, 4.4]) near(normalCdf(z), Phi(z), `the power-lab normal curve at ${z}`, 1e-9);
  near(upperZ(0.05), zAbove(0.05), 'the power-lab threshold', 1e-7);
  const viaWidget = rates({ sd: 10, n: 20, effect: 3, threshold: upperZ(0.05) * 10 * Math.sqrt(2 / 20) });
  const here = experiment({ n: 20, effect: 3, alpha: 0.05 });
  near(viaWidget.power, here.power, 'power in the widget', 1e-7);
  near(viaWidget.alpha, 0.05, 'false-alarm rate in the widget', 1e-9);
  // binomial chances three ways: built up flip by flip, the widget's, the lesson helper's
  for (const [n, p] of [[20, 0.5], [50, 0.5], [60, 1 / 6], [40, 0.25]]) {
    const mine = binomial(n, p);
    const theirs = binomialDist(n, p);
    mine.forEach((v, k) => near(theirs[k], v, `binomial(${n}, ${p}) at ${k}`, 1e-10));
    for (let k = 0; k <= n; k += 3) near(binomTail(n, p, k), upper(mine, k), `tail from ${k}`, 1e-10);
  }
  near(sum(hypergeometricDist(50, 20, 10)), 1, 'hypergeometric chances add up', 1e-9);
  near(hypergeometricDist(50, 20, 10)[4], ratio(choose(20, 4) * choose(30, 6), choose(50, 10)), 'a hypergeometric chance', 1e-10);
  assert.equal(MULTIPLIER[68], 1); assert.equal(MULTIPLIER[95], 2); assert.equal(MULTIPLIER[99.7], 3);
  assert.equal(catches(41, 1.5, 2, 38), true); assert.equal(catches(41, 1.5, 2, 37.9), false);
});

/* ------------------------------------------------ lesson 1: sampling distributions */

test('sampling-distributions: the city is what the text says it is', () => {
  const bell = population('bell', 0, 80);
  near(sum(bell.weights), 1, 'weights add up');
  const m = sum(bell.values.map((v, i) => v * bell.weights[i]));
  const sd = Math.sqrt(sum(bell.values.map((v, i) => (v - m) ** 2 * bell.weights[i])));
  near(m, 40, 'mean of the bell city', 1e-9);
  near(sd, 10, 'SD of the bell city', 0.01);
  near(bell.mean, m, 'the widget reports the mean'); near(bell.sd, sd, 'the widget reports the SD');
  // the three standard errors of the table, and the widths quoted for the pile of averages of 16
  const formula = rawStep('sampling-distributions', 'formula').text;
  assert.match(formula, /\| Standard error \| 5 \| 2\.5 \| 1\.25 \|/);
  for (const [n, se] of [[4, 5], [16, 2.5], [64, 1.25]]) near(sd / Math.sqrt(n), se, `SE for samples of ${n}`, 0.01);
  assert.match(rawStep('sampling-distributions', 'size-explore').explain, /\*\*5\*\*, then \*\*2\.5\*\*, then \*\*1\.25\*\*/);
  // "nearly every average lies between 33 and 47": that is 2.8 standard errors either side
  assert.ok(Phi(7 / 2.5) - Phi(-7 / 2.5) > 0.99);
  // Mia's 46: 2.4 standard errors out, as the explanation says; ordinary for one commuter
  const spreads = fixed('sampling-distributions', 'two-spreads');
  assert.match(spreads.explain, /6 \\div 2\.5 = 2\.4/);
  near(6 / 2.5, 2.4, 'Mia');
  assert.ok(2 * (1 - Phi(2.4)) < 0.05 && 2 * (1 - Phi(0.6)) > 0.5);
  assert.match(correctOption(spreads).text, /^Yes/);
  assert.equal(spreads.figures[0].spreads, 'exact');
  assert.equal(spreads.figures[0].n, 16);
  // the other two cities really are skewed and two-humped, with the same axis
  const skew = population('skew', 0, 80);
  const twin = population('twin', 0, 80);
  assert.ok(skew.mean < 25 && skew.weights.indexOf(Math.max(...skew.weights)) < skew.mean, 'skewed: the peak is left of the mean');
  near(twin.mean, 40, 'two humps are symmetric', 1e-6);
  assert.ok(twin.weights[40] < twin.weights[24] / 5 && twin.weights[40] < twin.weights[56] / 5, 'two humps with a dip between');
  // the hook: two averages of 16 differ by a few minutes (the SD of their difference is about 3.5)
  near(Math.sqrt(2) * 2.5, 3.54, 'difference of two averages', 0.01);
  assert.equal(correctOption(fixed('sampling-distributions', 'hook')).text, 'A few minutes apart');
});

test('sampling-distributions/se-calc: SD divided by the square root of n', () => {
  eachVariant('sampling-distributions', 'se-calc', (step) => {
    const [sample, spread] = bolds(step.text);
    const n = firstNum(sample);
    const sd = firstNum(spread);
    assert.ok(spread.endsWith(step.unit), 'the unit of the answer is the unit of the SD');
    near(step.answer, sd / Math.sqrt(n), 'standard error');
    assert.ok(Number.isInteger(Math.sqrt(n)), 'n is a perfect square');
    near(step.answer * 100, Math.round(step.answer * 100), 'the answer has at most two decimals', 1e-9);
    slipsAreWrong(step);
    const slips = step.wrong.map(([v]) => v);
    for (const v of [sd / n, sd, sd * Math.sqrt(n)]) assert.ok(slips.some((w) => Math.abs(w - v) < 1e-4), `the slip ${v} is anticipated`);
    assert.ok(step.hints[0].includes(`\\sqrt{${n}} = ${Math.sqrt(n)}`));
    assert.ok(step.explain.includes(`= ${step.answer}$`), 'the explanation ends in the answer');
  });
});

test('sampling-distributions/bigger-sample: k squared times the people, the error k times smaller', () => {
  eachVariant('sampling-distributions', 'bigger-sample', (step) => {
    const [first, error, second] = bolds(step.text);
    const n = firstNum(first);
    const se = firstNum(error);
    const n2 = firstNum(second);
    const factor = Number(grab(step.text, /: (\d+) times as many/, 'the factor')[1]);
    assert.equal(n2, n * factor);
    near(step.answer, se / Math.sqrt(factor), 'new standard error');
    // SE = SD ÷ √n, so the story fixes the SD of the journey times: it has to be a believable one
    const impliedSd = se * Math.sqrt(n);
    assert.ok(impliedSd >= 5 && impliedSd <= 45, `journey times with an SD of ${impliedSd.toFixed(1)} minutes`);
    slipsAreWrong(step);
    assert.ok(step.wrong.some(([v]) => Math.abs(v - se / factor) < 1e-4), 'dividing by the factor itself is anticipated');
    assert.ok(step.explain.includes(`= ${step.answer}$`));
  });
});

test('sampling-distributions/band-95: two standard errors either side of the mean', () => {
  eachVariant('sampling-distributions', 'band-95', (step) => {
    const [centre, spread, sample] = bolds(step.text);
    const m = firstNum(centre);
    const sd = firstNum(spread);
    const n = firstNum(sample);
    const se = sd / Math.sqrt(n);
    assert.equal(step.blanks.length, 3);
    near(blank(step, 0), se, 'standard error');
    near(blank(step, 1), m - 2 * se, 'lower end');
    near(blank(step, 2), m + 2 * se, 'upper end');
    assert.ok(step.explain.includes(`about ${m - 2 * sd} to ${m + 2 * sd}`), 'the spread of single values is quoted correctly');
  });
});

test('sampling-distributions: the interactive checks accept exactly what the instructions ask for', () => {
  const draw = rawStep('sampling-distributions', 'draw-samples');
  for (let count = 0; count <= 12; count++) assert.equal(draw.check({ count }) === true, count >= 10, `draw-samples with ${count}`);
  assert.match(draw.check({ count: 3 }), /drawn 3 so far/);
  assert.equal(draw.check(draw.solution), true);
  const pile = rawStep('sampling-distributions', 'pile-up');
  for (const count of [10, 1010, 1999, 2000, 5000]) assert.equal(pile.check({ count }) === true, count >= 2000, `pile-up with ${count}`);
  assert.equal(pile.check(pile.solution), true);

  const sizes = rawStep('sampling-distributions', 'size-explore');
  assert.deepEqual(sizes.widget.sizes, [4, 16, 64]);
  const options = [0, 1, 999, 1000, 3000];
  for (const a of options) for (const b of options) for (const c of options) {
    const verdict = sizes.check({ counts: { bell: { 4: a, 16: b, 64: c } } });
    assert.equal(verdict === true, a >= 1000 && b >= 1000 && c >= 1000, `size-explore ${a}/${b}/${c}`);
    if (verdict !== true) {
      const [size, have] = a < 1000 ? [4, a] : b < 1000 ? [16, b] : [64, c];
      assert.ok(verdict.includes(`of size ${size}`) && verdict.includes(`${have.toLocaleString('en-US')} sample`), `feedback names what is missing: ${verdict}`);
      assert.equal(/1 samples/.test(verdict), false);
    }
  }
  assert.equal(sizes.check({ counts: sizes.solution.counts }), true);

  const shapes = rawStep('sampling-distributions', 'shape-explore');
  assert.deepEqual(shapes.widget.shapes, ['bell', 'skew', 'twin']);
  assert.ok(shapes.widget.sizes.includes(1) && shapes.widget.sizes.includes(30));
  const some = [0, 999, 1000];
  for (const a of some) for (const b of some) for (const c of some) for (const d of some) {
    const counts = { bell: { 1: 0, 2: 0, 5: 0, 30: 0 }, skew: { 1: a, 2: 5000, 5: 0, 30: b }, twin: { 1: c, 2: 0, 5: 5000, 30: d } };
    const verdict = shapes.check({ counts });
    assert.equal(verdict === true, Math.min(a, b, c, d) >= 1000, `shape-explore ${a}/${b}/${c}/${d}`);
    if (verdict !== true) {
      const [city, size] = a < 1000 ? ['skewed', 1] : b < 1000 ? ['skewed', 30] : c < 1000 ? ['two-hump', 1] : ['two-hump', 30];
      assert.ok(verdict.includes(`${city} city`) && verdict.includes(`of size ${size}.`), `feedback names what is missing: ${verdict}`);
    }
  }
  assert.equal(shapes.check({ counts: { bell: {}, ...shapes.solution.counts } }), true);
});

test('sampling-distributions: sorting and true-false keys', () => {
  const sort = fixed('sampling-distributions', 'spreads-sort');
  // 0: about individual people (the SD of the data) · 1: about the estimate (the standard error)
  const key = { differs: 0, 'likely to be from the true mean': 1, Halves: 1, 'Stays about the same': 0, precise: 1, 'different people are': 0 };
  for (const item of sort.items) {
    const hit = Object.keys(key).filter((k) => item.text.includes(k));
    assert.equal(hit.length, 1, `"${item.text}" is recognised`);
    assert.equal(item.bucket, key[hit[0]], item.text);
    assert.ok(item.why);
  }
  assert.deepEqual(fixed('sampling-distributions', 'truths').options.map((o) => !!o.correct), [true, true, true, false, false]);
  near(10 / Math.sqrt(100), 1, 'an average of 100 varies ten times less');
  // the false statement about 100 values names the standard error, so that "100 times" cannot be read as the variance
  const hundred = fixed('sampling-distributions', 'truths').options[4];
  assert.match(hundred.text, /^The standard error of an average of 100 values is 100 times smaller than the SD/);
  assert.match(hundred.why, /^Ten times/);
  assert.match(correctOption(fixed('sampling-distributions', 'clt-apply')).text, /^Close to a bell/);
});

test('sampling-distributions/clt-apply: 2,500 is plenty for incomes up to ten times the usual, and not for giant outliers', () => {
  const step = fixed('sampling-distributions', 'clt-apply');
  assert.ok(step.text.includes('a few are ten times as high') && step.text.includes('**2,500 households**'));
  assert.match(step.explain, /2,500 is plenty here/);
  assert.match(step.explain, /thousands of times the rest/);
  // skewness of a population given as [value, weight] pairs; the average of n values has that skewness ÷ √n
  const skewness = (pairs) => {
    const total = sum(pairs.map(([, w]) => w));
    const m = sum(pairs.map(([v, w]) => v * w)) / total;
    const moment = (k) => sum(pairs.map(([v, w]) => (v - m) ** k * w)) / total;
    return moment(3) / moment(2) ** 1.5;
  };
  // a strongly skewed city: incomes spread like a lognormal (most near 1, the median) and cut off at ten times the median
  const city = [];
  for (let v = 0.05; v <= 10; v += 0.05) city.push([v, Math.exp(-0.5 * (Math.log(v) / 0.8) ** 2) / v]);
  const g = skewness(city);
  assert.ok(g > 1.5, `the city is strongly skewed (skewness ${g})`);
  assert.ok(g / Math.sqrt(2500) < 0.1, 'averages of 2,500 households are close to symmetric');
  // one household in 10,000 with 5,000 times the usual income: the averages stay lopsided
  const giants = [...city.map(([v, w]) => [v, w * 9999]), [5000, sum(city.map(([, w]) => w))]];
  assert.ok(skewness(giants) / Math.sqrt(2500) > 1, 'with giant outliers the averages of 2,500 are still clearly skewed');
});

/* --------------------------------------------------- lesson 2: confidence intervals */

test('confidence-intervals: the worked sample and the quoted figures', () => {
  const hook = fixed('confidence-intervals', 'hook');
  near(12 / Math.sqrt(64), 1.5, 'her standard error');
  assert.match(correctOption(hook).text, /give or take about 3/);
  const build = fixed('confidence-intervals', 'build-one');
  assert.deepEqual([0, 1, 2, 3].map((i) => blank(build, i)), [1.5, 3, 41 - 3, 41 + 3]);
  // misreading 1: the range of commuters is far wider than the interval, and only about a fifth lie inside it
  const data = fixed('confidence-intervals', 'not-the-data');
  assert.match(data.explain, /from 17 to 65 minutes/);
  assert.deepEqual([41 - 2 * 12, 41 + 2 * 12], [17, 65]);
  near(Phi(3 / 12) - Phi(-3 / 12), 0.2, 'share of commuters between 38 and 44', 0.01);
  assert.match(correctOption(data).text, /^No/);
  // misreading 2: "about 84%" is the chance that a second average lands within 2 SE of the first
  near(2 * Phi(Math.SQRT2) - 1, 0.84, 'next average inside a 95% interval', 0.005);
  assert.match(fixed('confidence-intervals', 'not-the-next').explain, /about 84% of the time/);
});

test('confidence-intervals: what "average ± k standard errors" really covers, by theory and by simulation', () => {
  // With the SD taken from the sample, (average − truth) ÷ SE follows Student's t with n − 1 degrees of freedom.
  near(tWithin(63, 2), 0.95, 'samples of 64, ± 2 SE: "close to 95 out of 100"', 0.002);
  near(1 - tWithin(63, 1), 1 / 3, 'samples of 64, ± 1 SE: "about a third miss"', 0.02);
  assert.ok(tWithin(63, 3) > 0.995, 'samples of 64, ± 3 SE: almost nothing misses');
  near(tWithin(255, 2), 0.95, 'samples of 256, ± 2 SE (the settings width-explore asks for)', 0.005);
  // the smallest samples on offer run a little under the nominal levels, which the lesson only quotes as "about"
  assert.ok(tWithin(15, 2) > 0.93 && tWithin(15, 2) < 0.95 && tWithin(15, 3) > 0.99);
  // the next sample's average inside an earlier ± 2 SE interval: the difference of two averages has √2 times the spread
  near(tWithin(63, Math.SQRT2), 0.84, 'the "about 84%" of misreading 2, with the SD estimated from 64 values', 0.005);
  near(2 * Phi(1.96 / Math.SQRT2) - 1, 0.834, 'the same figure for a textbook ± 1.96 SE interval', 0.001);

  // the same three figures from researchers simulated here: samples of 64 from a bell with mean 40 and SD 12
  const rng = makeRng(4711);
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rng.next(), 1e-12))) * Math.cos(2 * Math.PI * rng.next());
  const sample = () => {
    let total = 0;
    let squares = 0;
    for (let i = 0; i < 64; i++) { const v = 40 + 12 * gauss(); total += v; squares += v * v; }
    const est = total / 64;
    return [est, Math.sqrt((squares - 64 * est * est) / 63 / 64)];
  };
  const reps = 30000;
  let caught2 = 0;
  let caught1 = 0;
  let nextInside = 0;
  let previous = sample();
  for (let r = 0; r < reps; r++) {
    const [est, se] = sample();
    if (Math.abs(est - 40) <= 2 * se) caught2++;
    if (Math.abs(est - 40) <= se) caught1++;
    if (Math.abs(est - previous[0]) <= 2 * previous[1]) nextInside++;
    previous = [est, se];
  }
  near(caught2 / reps, 0.95, 'simulated coverage of ± 2 SE', 0.006);
  near(caught1 / reps, 0.68, 'simulated coverage of ± 1 SE', 0.012);
  near(nextInside / reps, 0.84, 'simulated share of next averages inside the previous interval', 0.01);
});

test('confidence-intervals: the hundred fixed intervals are what the two figures and their texts say', () => {
  assert.equal(RAIN.length, 100);
  const hit = ([est, se]) => Math.abs(est - 40) <= 2 * se;
  const misses = RAIN.map((p, i) => (hit(p) ? 0 : i + 1)).filter(Boolean);
  assert.deepEqual(misses, [14, 22, 44, 56, 58, 67]);
  assert.equal(RAIN.filter(hit).length, 94);
  // no interval ends so near 40 that the picture could be misread
  for (const [est, se] of RAIN) assert.ok(Math.abs(Math.abs(est - 40) - 2 * se) > 0.03);
  for (const [est, se] of RAIN) assert.equal(catches(est, se, 2, 40), hit([est, se]), 'the widget colours it the same way');
  // the standard errors are plausible for samples of 64 with SD 12
  assert.ok(RAIN.every(([, se]) => se > 1.1 && se < 1.9));
  near(mean(RAIN.map((p) => p[0])), 40, 'the averages centre on 40', 0.4);

  const next = fixed('confidence-intervals', 'not-the-next');
  assert.equal(next.figures[0].band, 0);
  assert.deepEqual(next.figures[0].fixed, RAIN);
  const [est, se] = RAIN[0];
  assert.ok(next.text.includes('**39.1 to 45.5**'));
  near(est - 2 * se, 39.13, 'lower end of the first interval', 1e-9);
  near(est + 2 * se, 45.53, 'upper end of the first interval', 1e-9);
  assert.ok(hit(RAIN[0]), 'it does contain the true mean');
  const inside = RAIN.slice(1).filter(([other]) => Math.abs(other - est) <= 2 * se).length;
  assert.equal(inside, 73);
  assert.match(correctOption(next).text, /only 73 of the other 99/);
  assert.match(next.explain, /42\.3/);
  // the averages outside her band are almost all below it
  assert.ok(RAIN.slice(1).filter(([other]) => other < est - 2 * se).length >= 24);

  const careful = fixed('confidence-intervals', 'careful-statement');
  const twenty = careful.figures[0].fixed;
  assert.deepEqual(twenty, RAIN.slice(0, 20));
  assert.deepEqual(twenty.map((p, i) => (hit(p) ? 0 : i + 1)).filter(Boolean), [14], 'researcher 14 is the one who missed');
  const [e14, s14] = twenty[13];
  assert.equal(Math.round(e14 - 2 * s14), 32);
  assert.equal(Math.round(e14 + 2 * s14), 38);
  assert.match(careful.explain, /Nineteen of these intervals contain the truth and one does not/);
  assert.match(careful.explain, /reports 32 to 38/);
  assert.match(correctOption(careful).text, /success rate of the method/);
});

test('confidence-intervals/width-explore: only 95% with samples of 256 gives ± 1.5, and the feedback is true', () => {
  const step = rawStep('confidence-intervals', 'width-explore');
  const { sd, sizes, levels } = step.widget;
  assert.equal(sd, 12);
  const mult = { 68: 1, 95: 2, 99.7: 3 };
  const winners = [];
  for (const level of levels) for (const n of sizes) for (const count of [0, 10, 99, 100]) {
    const margin = (mult[level] * sd) / Math.sqrt(n);
    const verdict = step.check({ level, n, count, margin });
    const good = level === 95 && margin <= 1.5 && count >= 100;
    assert.equal(verdict === true, good, `level ${level}, n ${n}, ${count} intervals`);
    if (good) winners.push(`${level}/${n}`);
    if (verdict !== true) {
      if (level === 68) assert.match(verdict, /a third of the intervals miss/);
      if (level === 68) assert.equal(/Narrow enough/.test(verdict), margin <= 1.5);
      if (level === 99.7) assert.match(verdict, /3 standard errors/);
      if (level === 95 && margin > 1.5) assert.ok(verdict.includes(`samples of ${n}`) && verdict.includes(`± ${margin} minutes`), verdict);
      if (level === 95 && margin <= 1.5) assert.ok(verdict.includes(`(${count} so far)`));
    }
  }
  assert.deepEqual(winners, ['95/256']);
  near(1 - (Phi(1) - Phi(-1)), 1 / 3, 'about a third of 68% intervals miss', 0.02);
  assert.equal(step.check({ ...step.solution, margin: (2 * 12) / Math.sqrt(step.solution.n) }), true);
  assert.match(step.explain, /12 \\div \\sqrt\{256\} = 0\.75/);
  const rainStep = rawStep('confidence-intervals', 'rain');
  assert.equal(rainStep.check({ count: 99 }) === true, false);
  assert.equal(rainStep.check({ count: 100 }), true);
  assert.equal(rainStep.check(rainStep.solution), true);
});

test('confidence-intervals/tradeoff: what each change does to margin = k × SD ÷ √n', () => {
  const step = fixed('confidence-intervals', 'tradeoff');
  const margin = ({ k = 2, sd = 12, n = 64 } = {}) => (k * sd) / Math.sqrt(n);
  const base = margin();
  const cases = [
    [/99\.7% confidence/, margin({ k: 3 })], [/68% confidence/, margin({ k: 1 })], [/four times as large/, margin({ n: 256 })],
    [/larger SD/, margin({ sd: 15 })], [/country ten times as big/, margin()], [/smaller sample/, margin({ n: 25 })],
  ];
  assert.equal(step.items.length, cases.length);
  for (const item of step.items) {
    const found = cases.filter(([re]) => re.test(item.text));
    assert.equal(found.length, 1, item.text);
    const after = found[0][1];
    assert.equal(item.bucket, after > base ? 0 : after < base ? 1 : 2, item.text);
  }
  assert.deepEqual(step.buckets, ['Wider', 'Narrower', 'About the same']);
});

test('confidence-intervals/ci-calc: estimate ± 2 standard errors', () => {
  eachVariant('confidence-intervals', 'ci-calc', (step) => {
    const [sample, centre, spread] = bolds(step.text);
    const n = firstNum(sample);
    const m = firstNum(centre);
    const sd = firstNum(spread);
    const se = sd / Math.sqrt(n);
    near(blank(step, 0), se, 'standard error');
    near(blank(step, 1), m - 2 * se, 'lower end');
    near(blank(step, 2), m + 2 * se, 'upper end');
    assert.ok(blank(step, 1) > 0);
    assert.ok(step.hints[0].includes(`\\div ${Math.sqrt(n)}`));
  });
});

test('confidence-intervals/poll-margin: one over the square root of n, in points', () => {
  eachVariant('confidence-intervals', 'poll-margin', (step) => {
    const n = Number(plain(grab(step.text, /A poll asks \*\*([\d,]+)\*\* people/, 'the size of the poll')[1]));
    near(step.answer, 100 / Math.sqrt(n), 'margin in points');
    // the shortcut is the 95% margin of a share near one half: 2 × √(0.5 × 0.5 ÷ n)
    near(step.answer / 100, 2 * Math.sqrt(0.25 / n), 'two standard errors of a percentage');
    slipsAreWrong(step);
    assert.equal(step.unit, 'points');
    assert.ok(step.explain.includes(`**${step.answer} percentage ${step.answer === 1 ? 'point' : 'points'}**`));
  });
  near(1 / Math.sqrt(1000), 0.03, 'the familiar ± 3 points', 0.002);
});

test('confidence-intervals/poll-read: where the whole interval lies decides the verdict', () => {
  const kinds = new Set();
  eachVariant('confidence-intervals', 'poll-read', (step) => {
    const n = Number(plain(grab(step.text, /A poll of ([\d,]+) randomly/, 'the size')[1]));
    const e = Number(grab(step.text, /finds that \*\*(\d+)%\*\* support/, 'the result')[1]);
    const m = Number(grab(step.text, /± ([\d.]+) points/, 'the margin')[1]);
    near(m, 100 / Math.sqrt(n), 'the margin fits the size of the poll', 0.01);
    const lo = e - m;
    const hi = e + m;
    assert.ok(lo !== 50 && hi !== 50, 'no end of the interval sits exactly on 50');
    const want = lo > 50 ? 0 : hi < 50 ? 2 : 1;
    kinds.add(want);
    assert.equal(step.shuffle, false);
    assert.equal(correctIndex(step), want, `interval ${lo} to ${hi}`);
    const range = `from ${lo}% to ${hi}%`;
    assert.ok(step.explain.includes(range));
    step.options.forEach((o, i) => {
      if (i === want) return;
      assert.ok(o.why, 'a wrong option says why');
      if (i === 3) return;
      assert.ok(o.why.includes(range));
      // each sentence about the interval is checked against the interval
      if (/All of it is below 50%/.test(o.why)) assert.ok(hi < 50);
      if (/All of it is above 50%/.test(o.why)) assert.ok(lo > 50);
      if (/All of it lies above 50%/.test(o.why)) assert.ok(lo > 50);
      if (/All of it lies below 50%/.test(o.why)) assert.ok(hi < 50);
      if (/Part of it is below 50%/.test(o.why)) assert.ok(lo < 50 && hi > 50);
      if (/Part of it is above 50%/.test(o.why)) assert.ok(lo < 50 && hi > 50);
      assert.ok(/(All|Part) of it/.test(o.why));
    });
  });
  assert.deepEqual([...kinds].sort(), [0, 1, 2], 'all three verdicts occur');
});

test('confidence-intervals/meaning-review: one correct reading, and the interval is centred on the estimate', () => {
  eachVariant('confidence-intervals', 'meaning-review', (step) => {
    const m = grab(step.text, /average [a-z' ]+ ([\d.]+) [a-z]+; 95% confidence interval ([\d.]+) to ([\d.]+)\./, 'the estimate and its interval');
    const [est, lo, hi] = [Number(m[1]), Number(m[2]), Number(m[3])];
    near((lo + hi) / 2, est, 'the estimate is the midpoint', 1e-9);
    assert.ok(lo < est && est < hi);
    assert.match(correctOption(step).text, /method that captures the true average in about 95% of samples/);
    for (const o of step.options) if (!o.correct) { assert.ok(o.why); assert.ok(o.text.includes(`${lo} and ${hi}`)); }
    assert.equal(step.options.length, 4);
  });
});

/* ------------------------------------------------------ lesson 3: hypothesis tests */

test('hypothesis-tests: the coin', () => {
  // 15 or more heads in 20 flips of a fair coin: 21,700 of the 1,048,576 equally likely sequences
  let ways = 0n;
  for (let k = 15; k <= 20; k++) ways += choose(20, k);
  assert.equal(ways, 21700n);
  const p15 = ratio(ways, 2n ** 20n);
  near(p15, 0.0207, 'chance of 15 or more', 0.0001);
  const hook = fixed('hypothesis-tests', 'hook');
  assert.ok(Math.abs(hook.answer - p15 * 100) <= hook.tolerance);
  assert.match(rawStep('hypothesis-tests', 'simulate').explain, /2\.07%/);
  const fair = binomial(20, 0.5);
  assert.ok(upper(fair, 7) - upper(fair, 14) > 0.85, 'most runs give 7 to 13 heads');
  const sim = rawStep('hypothesis-tests', 'simulate');
  assert.deepEqual([sim.widget.n, sim.widget.p, sim.widget.observed], [20, 0.5, 15]);
  assert.equal(sim.check({ trials: 999 }) === true, false);
  assert.equal(sim.check({ trials: 1000 }), true);
  assert.equal(sim.check(sim.solution), true);

  // the hunt for the smallest significant count: every position of the slider
  const hunt = rawStep('hypothesis-tests', 'threshold-hunt');
  assert.deepEqual(hunt.widget.observedRange, [10, 20]);
  assert.equal(hunt.widget.exact, true);
  const winners = [];
  for (let k = 10; k <= 20; k++) {
    const exact = upper(fair, k);
    const verdict = hunt.check({ observed: k, exact });
    if (verdict === true) winners.push(k);
    else if (k < 15) {
      assert.ok(exact >= 0.05, `${k} heads is not significant`);
      // quoted as the widget's readout prints it: two decimals below 10%, one from 10% up
      assert.ok(verdict.includes(` ${pc(exact, exact < 0.1 ? 2 : 1)}%`), `feedback quotes the share for ${k}: ${verdict}`);
    } else {
      assert.ok(exact < 0.05);
      assert.ok(verdict.includes(exact < 0.0001 ? 'less than 0.01%' : `${pc(exact, 2)}%`), verdict);
      assert.equal(/\(the share is 0%\)/.test(verdict), false);
    }
  }
  assert.deepEqual(winners, [15]);
  assert.ok(upper(fair, 14) > 0.05 && upper(fair, 15) < 0.05);
  assert.equal(pc(upper(fair, 14)), '5.8'); assert.equal(pc(upper(fair, 15)), '2.1');
  assert.match(hunt.explain, /5\.8%/); assert.match(hunt.explain, /2\.1%/);
  assert.equal(hunt.check({ observed: hunt.solution.observed, exact: upper(fair, hunt.solution.observed) }), true);

  // The course counts "at least as extreme" in one direction only, and says so where the p-value is defined.
  const defined = rawStep('hypothesis-tests', 'name-it').text;
  assert.match(defined, /"extreme" is counted \*in the direction of the claim\*: 15 heads or more/);
  assert.match(defined, /both directions, which roughly doubles the p-value/);
  // counting both directions (15 or more heads, or 15 or more tails) exactly doubles the coin's p-value
  near(upper(fair, 15) + (1 - upper(fair, 6)), 2 * p15, 'both directions', 1e-12);
  assert.ok(2 * p15 < 0.05 && 2 * upper(fair, 14) > 0.05, 'and 15 is the smallest significant count either way');
});

test('hypothesis-tests/read-p: the p-value is the share of null-world runs at least as extreme', () => {
  eachVariant('hypothesis-tests', 'read-p', (step) => {
    const [result, runs, count] = bolds(step.text);
    const [n, p] = /coin/i.test(step.text) ? [50, 0.5] : /die/i.test(step.text) ? [60, 1 / 6] : [40, 0.25];
    assert.ok(step.text.includes(String(n)), 'the number of tries is in the text');
    if (p === 0.25) assert.match(step.text, /four possible answers/);
    const k = firstNum(result);
    const sims = firstNum(runs);
    const hits = Number(count);
    assert.ok(step.text.includes(`${k} or more`), 'the event is "k or more"');
    near(step.answer, hits / sims, 'share of runs');
    // the invented simulation result is what such a simulation gives on average
    const exact = upper(binomial(n, p), k);
    assert.ok(Math.abs(hits - exact * sims) <= 0.5 + 1e-9, `${hits} of ${sims} for a chance of ${exact}`);
    // the precision asked for is the precision marked: the share itself and its three-place rounding both pass
    assert.match(step.text, /Give a decimal to at least three places/);
    const typed = (v) => numbersMatch(v, step.answer, step.tolerance);
    assert.ok(typed(hits / sims), 'the exact share is accepted');
    assert.ok(typed(Number((hits / sims).toFixed(3))), `${(hits / sims).toFixed(3)} is accepted for ${hits / sims}`);
    assert.ok(!typed(Number((hits / sims).toFixed(1))), 'one decimal place is too coarse to pass');
    slipsAreWrong(step);
    // the closing remark fits the size of the p-value, and hedges near the conventional line
    assert.match(step.explain, step.answer < 0.04 ? /look doubtful/ : step.answer > 0.08 ? /little evidence against/ : /suggestive at most/);
    assert.ok(step.answer > 0.005 && step.answer < 0.2, 'a p-value worth discussing');
    assert.ok(step.explain.includes(`= ${step.answer}$`));
    assert.ok(step.explain.includes(`about ${pc(step.answer)}% of experiments`));
  });
});

test('hypothesis-tests: the shuffle test on the tomato plants, deal by deal', () => {
  const { fert, plain: bare } = PLANTS;
  assert.equal(fert.length, 10); assert.equal(bare.length, 10);
  near(mean(fert), 67.9, 'fertilised average'); near(mean(bare), 61.9, 'plain average');
  near(mean(fert) - mean(bare), 6, 'the gap');
  // every way of dealing ten "fertiliser" labels among the twenty plants
  const all = [...fert, ...bare];
  const total = sum(all);
  const observed = sum(fert);
  let deals = 0;
  let extreme = 0;
  let within5 = 0;
  for (let mask = 0; mask < 1 << 20; mask++) {
    let bits = 0;
    let t = 0;
    for (let i = 0, m = mask; m; i++, m >>= 1) if (m & 1) { bits++; t += all[i]; }
    if (bits !== 10) continue;
    deals++;
    if (t >= observed) extreme++;
    if (Math.abs((2 * t - total) / 10) <= 5) within5++;
  }
  assert.equal(deals, 184756);
  assert.equal(deals, PLANTS.deals);
  assert.equal(extreme, 5679);
  assert.equal(extreme, PLANTS.extreme);
  near(extreme / deals, 0.03, 'p-value', 0.001);
  assert.ok(within5 / deals > 0.85, 'most shuffled gaps are between −5 and +5 cm');
  // the widget counts the same
  const dist = subsetSumDist(all, 10);
  let viaWidget = 0;
  dist.probs.forEach((pr, i) => { if (dist.min + i >= observed) viaWidget += pr; });
  near(viaWidget, extreme / deals, 'exact share in the widget', 1e-12);

  const shuffle = rawStep('hypothesis-tests', 'shuffle');
  assert.deepEqual(shuffle.widget.groups.map((g) => g.values), [fert, bare]);
  assert.ok(shuffle.text.includes('**67.9 cm**') && shuffle.text.includes('**61.9 cm**') && shuffle.text.includes('**6 cm**'));
  assert.equal(shuffle.check({ trials: 999 }) === true, false);
  assert.equal(shuffle.check(shuffle.solution), true);
  const says = fixed('hypothesis-tests', 'what-p-says');
  assert.ok(says.text.includes('184,756') && says.text.includes('5,679') && says.text.includes('**0.03**'));
  assert.match(correctOption(says).text, /^If the fertiliser did nothing, a gap this big or bigger would appear in about 3%/);
});

test('hypothesis-tests/base-rate: a thousand experiments, counted', () => {
  const step = rawStep('hypothesis-tests', 'base-rate');
  const { n, base, sens, fpr } = step.widget;
  const real = n * base;
  const found = real * sens;
  const alarms = (n - real) * fpr;
  assert.deepEqual([real, found, alarms], [100, 80, 45]);
  assert.match(step.explain, /Of the 100 real effects, 80 come out significant/);
  assert.match(step.explain, /45 of the 900 experiments/);
  assert.match(step.explain, /125 significant results, and \*\*45 of them, 36%, are false alarms\*\*/);
  near(alarms / (found + alarms), 0.36, 'share of false alarms');
  // "if only 1 idea in 100 were real, most significant results would be false alarms"
  assert.ok((990 * fpr) / (990 * fpr + 10 * sens) > 0.5);
  for (let stage = 0; stage <= 3; stage++) assert.equal(step.check({ stage }) === true, stage === 3);
  assert.equal(step.check(step.solution), true);
  assert.ok(step.text.includes('(#/learn/probability/bayes)'), 'it links to the base-rate lesson');
  assert.equal(step.widget.words.stages.length, 4);
  assert.ok(step.text.includes(`"${step.widget.words.stages[3]}"`), 'the last button is named in the instruction');
});

test('hypothesis-tests/verdict: significant, or no evidence either way', () => {
  const seen = new Set();
  eachVariant('hypothesis-tests', 'verdict', (step) => {
    const p = Number(grab(step.text, /p-value of \*\*([\d.]+)\*\*/, 'the p-value')[1]);
    const small = p < 0.05;
    seen.add(small);
    assert.ok(Math.abs(p - 0.05) >= 0.02, 'the p-value is clear of the line');
    assert.match(correctOption(step).text, small ? /^The result is statistically significant: if .+, a difference at least this large would be rare$/ : /^The experiment has not shown an effect\. It has not shown that there is none, either$/);
    const backwards = step.options.find((o) => /chance that/.test(o.text));
    assert.ok(backwards && !backwards.correct && backwards.text.includes(`a ${pc(p)}% chance`), 'the backwards reading is offered and is wrong');
    assert.match(backwards.why, /assuming/);
    for (const o of step.options) if (!o.correct) assert.ok(o.why);
    if (small) {
      const m = grab(step.options.find((o) => /proved/.test(o.text)).why, /in about (\d+) experiments? in ([\d,]+)/, 'how often chance does this');
      near(Number(m[1]) / Number(plain(m[2])), p, 'the "1 in 100" wording matches the p-value');
      assert.ok(step.explain.includes('below 0.05'));
    } else {
      assert.ok(step.options.find((o) => o.text === 'The result is statistically significant').why.includes(`This one is ${p}.`));
      assert.ok(step.explain.includes(`about ${pc(p)}% of experiments`));
      assert.match(step.explain, /is not "nothing is going on"/);
    }
  });
  assert.equal(seen.size, 2);
});

test('hypothesis-tests: the fixed keys', () => {
  assert.deepEqual(fixed('hypothesis-tests', 'interpret').options.map((o) => !!o.correct), [true, true, false, false, false]);
  const order = fixed('hypothesis-tests', 'test-order');
  assert.match(order.items[0], /null hypothesis/); assert.match(order.items[3], /p-value/);
  // the lady tasting tea: list every choice of 4 cups out of 8
  const byScore = [0, 0, 0, 0, 0];
  let choices = 0;
  for (let mask = 0; mask < 256; mask++) {
    const picked = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => mask & (1 << i));
    if (picked.length !== 4) continue;
    choices++;
    byScore[picked.filter((i) => i < 4).length]++;   // cups 0 to 3 are the milk-first ones
  }
  assert.equal(choices, 70);
  assert.deepEqual(byScore, [1, 16, 36, 16, 1]);
  const tea = fixed('hypothesis-tests', 'tea');
  assert.ok(tea.text.includes('70 ways') && tea.text.includes('**1**') && tea.text.includes('**16**'));
  near(tea.answer, (100 * (byScore[3] + byScore[4])) / choices, 'three or four right');
  slipsAreWrong(tea);
  assert.ok(Math.abs(24 - tea.answer) <= tea.tolerance, 'the rounded answer in the explanation is accepted');
  near(1 / 70, 0.014, 'a perfect score', 0.0005);
  const name = rawStep('hypothesis-tests', 'name-it').text;
  assert.match(name, /probability, \*if the null hypothesis is true\*, of a result at least as extreme as the one actually observed/);
});

/* -------------------------------------------------------- lesson 4: errors and power */

test('errors-and-power: every quoted rate, worked out with this file\'s normal curve', () => {
  const small = experiment({ n: 20, effect: 3, alpha: 0.05 });
  assert.equal(Math.round(small.power * 100), 24);
  const hook = fixed('errors-and-power', 'hook');
  assert.ok(Math.abs(hook.answer - small.power * 100) <= hook.tolerance);
  assert.match(hook.explain, /about \*\*24%\*\*/);
  assert.match(rawStep('errors-and-power', 'power-name').text, /power of 24%/);
  const run = rawStep('errors-and-power', 'run-small');
  assert.deepEqual([run.widget.sd, run.widget.effect, run.widget.n], [10, 3, 20]);
  for (const runs of [0, 1, 99, 100, 300]) assert.equal(run.check({ runs }) === true, runs >= 100);
  assert.equal(run.check(run.solution), true);

  // moving the line: every position the handle can take (steps of 0.1)
  const drag = rawStep('errors-and-power', 'threshold-drag');
  assert.deepEqual([drag.widget.effect, drag.widget.n, drag.widget.threshold], [5, 50, 3.3]);
  const at = (threshold) => experiment({ n: 50, effect: 5, threshold });
  let first = null;
  for (let i = -70; i <= 120; i++) {
    const threshold = i / 10;
    const s = at(threshold);
    const verdict = drag.check({ threshold, alpha: s.alpha, miss: s.miss, power: s.power });
    assert.equal(verdict === true, s.alpha <= 0.01, `threshold ${threshold}`);
    if (verdict === true && first == null) first = threshold;
    if (verdict !== true) {
      assert.ok(verdict.includes(`${pc(s.alpha)}%`), `feedback quotes the rate at ${threshold}: ${verdict}`);
      assert.equal(/right/.test(verdict), true);
      assert.equal(/more common|trouble/.test(verdict), s.alpha > 0.05);
    }
  }
  assert.equal(first, 4.7, 'the first position with a false-alarm rate of 1% or less');
  assert.equal(drag.solution.threshold, 4.7);
  near(at(3.3).alpha, 0.05, 'the line starts at about 5%', 0.001);
  assert.equal(Math.round(at(3.3).miss * 100), 20);
  assert.ok(at(4.7).alpha < 0.01);
  assert.equal(Math.round(at(4.7).miss * 100), 44);
  assert.match(drag.explain, /missed about 20% of the time/);
  assert.match(drag.explain, /\*\*44%\*\*/);

  // group size: every position of the slider
  const size = rawStep('errors-and-power', 'power-n');
  const [lo, hi, by] = size.widget.nRange;
  assert.equal(size.widget.effect, 3);
  const enough = [];
  for (let n = lo; n <= hi; n += by) {
    const s = experiment({ n, effect: 3, alpha: 0.05 });
    const verdict = size.check({ n, power: s.power });
    if (s.power >= 0.8) enough.push(n);
    assert.equal(verdict === true, n === 140, `${n} per group`);
    if (verdict !== true) {
      assert.ok(verdict.includes(`${pc(s.power)}%`), verdict);
      assert.equal(/Not 80% yet/.test(verdict), s.power < 0.8);
      assert.equal(/a smaller group already reaches 80%/.test(verdict), s.power >= 0.8);
    }
  }
  assert.equal(enough[0], 140, 'the smallest group on the slider with 80% power');
  assert.equal(Math.round(experiment({ n: 140, effect: 3, alpha: 0.05 }).power * 100), 81);
  assert.equal(Math.round(experiment({ n: 120, effect: 3, alpha: 0.05 }).power * 100), 75);
  assert.match(size.explain, /140 students per group the power is 81%\. With 120 it is still only 75%/);
  assert.equal(140 / 20, 7);
  assert.equal(size.check({ n: size.solution.n, power: experiment({ n: 140, effect: 3, alpha: 0.05 }).power }), true);

  // effect size: every position of the slider
  const eff = rawStep('errors-and-power', 'effect-size');
  const [e0, e1, eBy] = eff.widget.effectRange;
  assert.equal(eff.widget.n, 50);
  const strong = [];
  for (let effect = e0; effect <= e1 + 1e-9; effect += eBy) {
    const s = experiment({ n: 50, effect, alpha: 0.05 });
    const verdict = eff.check({ effect, power: s.power });
    if (s.power >= 0.8) strong.push(effect);
    assert.equal(verdict === true, effect === 5, `effect ${effect}`);
    if (verdict !== true && effect > 0) assert.ok(verdict.includes(`${pc(s.power)}%`) && /Not 80% yet/.test(verdict) === s.power < 0.8, verdict);
    if (effect === 0) { assert.match(verdict, /5% false-alarm rate/); near(s.power, 0.05, 'no effect: the power is the false-alarm rate', 1e-6); }
  }
  assert.equal(strong[0], 5);
  assert.equal(Math.round(experiment({ n: 50, effect: 5, alpha: 0.05 }).power * 100), 80);
  assert.equal(Math.round(experiment({ n: 50, effect: 4.5, alpha: 0.05 }).power * 100), 73);
  assert.equal(Math.round(experiment({ n: 50, effect: 1, alpha: 0.05 }).power * 100), 13);
  assert.match(eff.explain, /only 73%, and one of 1 point just 13%/);
});

test('errors-and-power: sorting, the trade-off and the button colours', () => {
  const sort = fixed('errors-and-power', 'classify');
  // [is something really going on?, did the test say so?]
  const stories = [
    [/smoke alarm/, false, true], [/drug that really works/, true, false], [/lucky charm/, false, true], [/really is biased/, true, false],
    [/useless supplement/, false, false], [/vaccine prevents illness, and it does/, true, true], [/scam email/, true, false],
  ];
  assert.equal(sort.items.length, stories.length);
  for (const item of sort.items) {
    const found = stories.filter(([re]) => re.test(item.text));
    assert.equal(found.length, 1, item.text);
    const [, real, flagged] = found[0];
    assert.equal(item.bucket, !real && flagged ? 0 : real && !flagged ? 1 : 2, item.text);
  }
  assert.deepEqual(sort.buckets, ['False alarm (type I)', 'Miss (type II)', 'Correct verdict']);
  const table = rawStep('errors-and-power', 'two-errors').text;
  assert.match(table, /\| \*\*Nothing is going on\*\* \| \*\*False alarm\*\* \(type I error\) \| Correct \|/);
  assert.match(table, /\| \*\*The effect is real\*\* \| Correct \| \*\*Miss\*\* \(type II error\) \|/);
  const fill = fixed('errors-and-power', 'tradeoff');
  assert.deepEqual(fill.blanks.map((b) => (b.kind === 'select' ? b.answer : b.numbers[0])), ['rarer', 'more common', 5]);
  // a line further right: fewer false alarms, more misses
  assert.ok(experiment({ n: 50, effect: 5, threshold: 4 }).alpha < experiment({ n: 50, effect: 5, threshold: 3 }).alpha);
  assert.ok(experiment({ n: 50, effect: 5, threshold: 4 }).miss > experiment({ n: 50, effect: 5, threshold: 3 }).miss);
  // what raises power
  const p0 = experiment({ sd: 10, n: 50, effect: 3, alpha: 0.05 }).power;
  assert.ok(experiment({ sd: 10, n: 100, effect: 3, alpha: 0.05 }).power > p0);
  assert.ok(experiment({ sd: 10, n: 50, effect: 4, alpha: 0.05 }).power > p0);
  assert.ok(experiment({ sd: 8, n: 50, effect: 3, alpha: 0.05 }).power > p0);
  assert.ok(experiment({ sd: 10, n: 50, effect: 3, alpha: 0.01 }).power < p0);
  assert.ok(experiment({ sd: 10, n: 25, effect: 3, alpha: 0.05 }).power < p0);
  assert.deepEqual(fixed('errors-and-power', 'raises-power').options.map((o) => !!o.correct), [true, true, true, false, false]);
  // four million visitors: 10.0% against 10.1%
  const n = 2e6;
  const se = 100 * Math.sqrt((0.1 * 0.9) / n + (0.101 * 0.899) / n);
  assert.equal((0.1 - 2 * se).toFixed(2), '0.04');
  assert.equal((0.1 + 2 * se).toFixed(2), '0.16');
  assert.ok(1 - Phi(0.1 / se) < 0.001 && 2 * (1 - Phi(0.1 / se)) < 0.001, 'p is below 0.001');
  const huge = fixed('errors-and-power', 'huge-sample');
  assert.ok(huge.text.includes('**0.04 to 0.16 percentage points**') && huge.text.includes('four million'));
  assert.match(correctOption(huge).text, /^The evidence that the new colour sells more is strong, but the gain is a sliver: between 0\.04 and 0\.16 percentage points$/);
  near(0.001 * 1000, 1, 'a tenth of a point is one sale per 1,000 visitors');
  // the recap does not overstate: a small study of a large effect can have high power (20 per group, effect 10: about 94%)
  assert.ok(lessons['errors-and-power'].recap.some((line) => /Small studies easily miss real effects/.test(line)));
  assert.equal(lessons['errors-and-power'].recap.some((line) => /miss most/.test(line)), false);
  assert.ok(experiment({ n: 20, effect: 10, alpha: 0.05 }).power > 0.9);
});

test('errors-and-power/count-errors: 5% of the useless ideas, and the power applied to the real ones', () => {
  eachVariant('errors-and-power', 'count-errors', (step) => {
    const m = grab(step.text, /tests \*\*(\d+)\*\* ideas\. In truth \*\*(\d+)\*\* of them are real effects, and the other (\d+) do nothing/, 'the ideas');
    const [total, real, useless] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const power = Number(grab(step.text, /power of \*\*(\d+)%\*\*/, 'the power')[1]);
    assert.equal(useless, total - real);
    const alarms = 0.05 * useless;
    const found = (power / 100) * real;
    near(blank(step, 0), alarms, 'false alarms');
    near(blank(step, 1), found, 'detected');
    near(blank(step, 2), real - found, 'missed');
    for (let i = 0; i < 3; i++) assert.ok(Number.isInteger(blank(step, i)), 'whole numbers');
    assert.ok(step.explain.includes(`gets ${alarms + found} significant results, and ${alarms} of them are false alarms`));
    assert.ok(step.template.includes(`${power}% of the ${real}`));
  });
});

test('errors-and-power/no-evidence: a low-powered trial settles nothing', () => {
  eachVariant('errors-and-power', 'no-evidence', (step) => {
    const p = Number(grab(step.text, /\(p = ([\d.]+)\)/, 'the p-value')[1]);
    const power = Number(grab(step.text, /was only \*\*(\d+)%\*\*/, 'the power')[1]);
    assert.ok(p > 0.05, 'the result really is not significant');
    assert.ok(power <= 30);
    assert.match(correctOption(step).text, /^No\. A trial this small would probably have missed a real effect/);
    const [, above, backwards, badly] = step.options;
    assert.ok(above.why.includes(`${100 - power} times in 100`));
    assert.ok(backwards.text.includes(`does nothing is ${pc(p, 0)}%`));
    assert.match(backwards.why, /assuming/);
    assert.ok(badly.why.includes(`With ${power}% power`) && /most of the time/.test(badly.why) && 100 - power > 50);
    assert.ok(step.explain.includes(`about ${100 - power} times in 100`));
    assert.match(step.explain, /No evidence of an effect is not evidence of no effect/);
  });
});

/* ------------------------------------------------------------ lesson 5: experiments */

test('experiments: the school, taken apart and simulated', () => {
  const keen = STUDENTS.filter((u) => u.trait).map((u) => u.score);
  const rest = STUDENTS.filter((u) => !u.trait).map((u) => u.score);
  assert.equal(keen.length, 20); assert.equal(rest.length, 20);
  assert.equal(mean(keen), 72); assert.equal(mean(rest), 57);
  const apart = fixed('experiments', 'take-apart');
  const users = (16 * 72 + 4 * 57) / 20;
  const others = (4 * 72 + 16 * 57) / 20;
  assert.equal(apart.blanks.length, 4);
  assert.deepEqual([0, 1, 2, 3].map((i) => blank(apart, i)), [users, others, users - others, 72 - 72]);
  assert.equal(72 - 72, 57 - 57, 'the gap is the same, zero, in both rows');
  assert.deepEqual([users, others], [69, 60]);
  assert.match(apart.explain, /80% keen; the other group is 20% keen/);
  assert.equal(16 / 20, 0.8);
  assert.match(apart.text, /\| \*\*Keen students\*\* \| 16 students, average 72 \| 4 students, average 72 \|/);
  assert.match(apart.text, /\| \*\*Other students\*\* \| 4 students, average 57 \| 16 students, average 57 \|/);

  // what the two ways of forming groups do, simulated here (keen students pick the app 8 times in 10)
  const rng = makeRng(20240);
  const split = (method) => {
    for (;;) {
      const treated = STUDENTS.map((u) => rng.next() < (method === 'coin' ? 0.5 : u.trait ? 0.8 : 0.2));
      const k = treated.filter(Boolean).length;
      if (k > 0 && k < 40) return treated;
    }
  };
  const gap = (treated) => mean(STUDENTS.filter((_, i) => treated[i]).map((u) => u.score)) - mean(STUDENTS.filter((_, i) => !treated[i]).map((u) => u.score));
  const chosen = Array.from({ length: 4000 }, () => gap(split('choice')));
  const tossed = Array.from({ length: 4000 }, () => gap(split('coin')));
  near(mean(chosen), 9, 'self-selection: the app group is ahead by about 9', 0.5);
  near(mean(tossed), 0, 'coin tosses: no gap on average', 0.25);
  assert.ok(chosen.filter((d) => d > 0).length / chosen.length > 0.98, 'the app group is ahead almost every time');
  assert.ok(sdOf(tossed) > 1.5 && sdOf(tossed) < 4.5, 'a single coin-toss split can be off by a few points');
  // the widget measures a split the same way
  const one = split('choice');
  near(compare(STUDENTS, one, 0).diff, gap(one), 'the widget\'s difference');
  near(compare(STUDENTS, one, 5).diff, gap(one) + 5, 'a real effect is added to the treated group');

  const self = rawStep('experiments', 'self-select');
  assert.equal(self.widget.effect, 0);
  assert.deepEqual(self.widget.units, STUDENTS);
  for (let runs = 0; runs <= 7; runs++) for (const revealed of [false, true]) {
    const verdict = self.check({ runs: { choice: runs, coin: 0 }, revealed });
    assert.equal(verdict === true, runs >= 5 && revealed, `${runs} runs, revealed ${revealed}`);
    if (runs < 5) assert.ok(verdict.includes(`${runs} so far`));
    else if (!revealed) assert.match(verdict, /Show who is keen/);
  }
  assert.equal(self.check(self.solution), true);
  const coin = rawStep('experiments', 'coin');
  assert.equal(coin.widget.repeat, 200);
  for (const a of [0, 1, 199, 200, 201]) for (const b of [0, 1, 199, 200, 201]) {
    const verdict = coin.check({ runs: { choice: a, coin: b } });
    assert.equal(verdict === true, a >= 200 && b >= 200, `${a} and ${b}`);
    if (verdict !== true) {
      assert.ok(a < 200 ? verdict.includes(`"They choose" has been used ${a} time`) : verdict.includes(`"Coin toss" has been used ${b} time`), verdict);
      assert.equal(/1 times/.test(verdict), false);
    }
  }
  assert.equal(coin.check(coin.solution), true);
  assert.match(correctOption(fixed('experiments', 'why-random')).text, /including traits nobody measured/);
});

test('experiments: the A/B test from start to finish', () => {
  const ab = rawStep('experiments', 'ab-test');
  const [b, a] = ab.widget.groups;
  assert.deepEqual([b.label, b.n, b.hits, a.label, a.n, a.hits], ['page B', 1000, 130, 'page A', 1000, 100]);
  assert.ok(ab.text.includes('**100** sign-ups (10%)') && ab.text.includes('**130** sign-ups (13%)') && ab.text.includes('the 230 sign-ups'));
  // deal the 230 sign-ups among 2,000 visitors: the chance that page B gets 130 or more of them
  let ways = 0n;
  for (let k = 130; k <= 230; k++) ways += choose(230, k) * choose(1770, 1000 - k);
  const p = ratio(ways, choose(2000, 1000));
  near(p, 0.021, 'exact p-value', 0.0005);
  assert.match(ab.explain, /about \*\*2%\*\*/); assert.match(ab.explain, /2\.1%/);
  const viaWidget = hypergeometricDist(2000, 230, 1000);
  near(upper(viaWidget, 130), p, 'the widget\'s exact share', 1e-9);
  assert.equal(ab.check({ trials: 999 }) === true, false);
  assert.equal(ab.check(ab.solution), true);
  // the interval for the difference
  const se = 100 * Math.sqrt((0.1 * 0.9) / 1000 + (0.13 * 0.87) / 1000);
  assert.equal(se.toFixed(1), '1.4');
  const interval = fixed('experiments', 'ab-interval');
  assert.ok(interval.text.includes('**1.4 points**'));
  near(blank(interval, 0), 2 * 1.4, 'margin'); near(blank(interval, 1), 3 - 2.8, 'lower end'); near(blank(interval, 2), 3 + 2.8, 'upper end');
});

test('experiments/ab-read: the interval for the lead, and whether zero is in it', () => {
  const verdicts = new Set();
  eachVariant('experiments', 'ab-read', (step) => {
    const a = grab(step.text, /Version A: ([\d,]+) people, \*\*(\d+)%\*\*/, 'version A');
    const b = grab(step.text, /Version B: ([\d,]+) people, \*\*(\d+)%\*\*/, 'version B');
    const s = grab(step.text, /B leads by (\d+) percentage points, with a standard error of about \*\*([\d.]+) points\*\*/, 'the lead and its standard error');
    const [n, pa, pb] = [Number(plain(a[1])), Number(a[2]) / 100, Number(b[2]) / 100];
    assert.equal(Number(plain(b[1])), n);
    const lead = Number(s[1]);
    const se = Number(s[2]);
    near(lead, 100 * (pb - pa), 'the lead', 1e-9);
    const exact = 100 * Math.sqrt((pa * (1 - pa)) / n + (pb * (1 - pb)) / n);
    assert.equal(exact.toFixed(1), se.toFixed(1), `the stated standard error ${se} is ${exact} rounded`);
    assert.ok(Math.abs(exact - se) < 0.045, 'and it is not a borderline rounding');
    const [margin, lo, hi] = [0, 1, 2].map((i) => blank(step, i));
    near(margin, 2 * se, 'margin'); near(lo, lead - 2 * se, 'lower end'); near(hi, lead + 2 * se, 'upper end');
    assert.ok(Math.abs(lo) > 0.15, 'zero is clearly inside or clearly outside');
    const choice = step.blanks[3];
    assert.equal(choice.kind, 'select');
    assert.deepEqual(choice.options, ['do', 'do not']);
    assert.equal(choice.answer, lo > 0 ? 'do' : 'do not');
    verdicts.add(choice.answer);
    assert.match(step.explain, lo > 0 ? /Every value in it is above 0/ : /It includes 0 \(and some negative values\)/);
    if (lo <= 0) assert.ok(lo < 0);
  });
  assert.equal(verdicts.size, 2, 'both verdicts occur');
});

test('experiments/which-design: the randomised study wins, whatever the sizes', () => {
  eachVariant('experiments', 'which-design', (step) => {
    const watch = grab(step.text, /- Study A [a-z ]+? ([\d,]+) /, 'study A');
    const assign = grab(step.text, /- Study B took (\d+) /, 'study B');
    assert.ok(Number(plain(watch[1])) > 10 * Number(assign[1]), 'the observational study is much the larger');
    assert.match(step.text, /coin toss|at random|lottery/);
    assert.match(correctOption(step).text, /^Study B: random assignment/);
    const big = step.options[1];
    assert.ok(big.text.includes(watch[1]) && /Size shrinks chance error, not bias/.test(big.why));
    for (const o of step.options) if (!o.correct) assert.ok(o.why);
  });
});

test('experiments: the history and the safeguards', () => {
  const lind = fixed('experiments', 'lind');
  assert.ok(lind.text.includes('May 1747') && lind.text.includes('12 sailors') && lind.text.includes('each pair'));
  assert.match(correctOption(lind).text, /^Chance did not decide/);
  // Lind allocated the remedies himself: the trial is never called randomised, and the story is given as his own account
  assert.match(lind.text, /^\s*By his own account, in May 1747/);
  assert.equal(/random/i.test(lind.text), false);
  assert.match(lind.explain, /he chose who got what, so it was not \*randomised\*/);
  assert.equal(lind.options.filter((o) => /random/i.test(o.text)).length, 0);
  const salk = rawStep('experiments', 'salk').text;
  assert.match(salk, /\| Vaccine \| 200,745 \| 57 \|/); assert.match(salk, /\| Placebo \| 201,229 \| 142 \|/);
  assert.ok(salk.includes('1954') && salk.includes('12 April 1955'));
  near(200745 + 201229, 400000, 'about 400,000 children', 2500);
  assert.ok((57 / 200745) < 0.5 * (142 / 201229), 'the rate in the vaccinated group is less than half');
  // The Francis report's table for the placebo-controlled areas, as [paralytic, non-paralytic, reported but not polio]:
  const francis = { vaccine: [33, 24, 25], placebo: [115, 27, 20] };
  // the lesson's column is the confirmed cases (paralytic + non-paralytic), and it is labelled so; 82 and 162 were *reported*
  assert.match(salk, /\| \| Children \| Confirmed polio cases \|/);
  assert.equal(francis.vaccine[0] + francis.vaccine[1], 57); assert.equal(francis.placebo[0] + francis.placebo[1], 142);
  assert.equal(sum(francis.vaccine), 82); assert.equal(sum(francis.placebo), 162);
  assert.ok(salk.includes(`paralytic cases, it was ${francis.vaccine[0]} against ${francis.placebo[0]}`));
  // the rates usually quoted from the same table: 28 and 71 per 100,000
  assert.equal(Math.round((57 / 200745) * 1e5), 28); assert.equal(Math.round((142 / 201229) * 1e5), 71);
  // "a gap far too big for chance": deal the 199 cases between two groups of these sizes
  const share = 200745 / (200745 + 201229);
  assert.ok((57 - 199 * share) / Math.sqrt(199 * share * (1 - share)) < -5, 'more than five standard errors from an even split');
  assert.match(fixed('experiments', 'why-random').explain, /an observational study on its own cannot/);
  const pairs = fixed('experiments', 'safeguards').pairs;
  const want = { 'A control group': /would have got better anyway/, 'Random assignment': /differ before treatment/, 'A placebo': /expect to/, 'Blinding the doctors': /judging/ };
  assert.equal(pairs.length, 4);
  for (const [left, right] of pairs) assert.match(right, want[left]);
  assert.equal(correctOption(fixed('experiments', 'hook')).text, 'It cannot be told from this comparison');
});

/* ---------------------------------------------------------- lesson 6: forking paths */

test('forking-paths: twenty tests of nothing', () => {
  near(1 - 0.95 ** 20, 0.64, 'at least one false alarm in twenty', 0.005);
  near(0.95 ** 20, 0.36, 'all twenty quiet', 0.005);
  assert.equal(correctOption(fixed('forking-paths', 'hook')).text, 'About 64%');
  near(20 * 0.05, 1, 'one false alarm per batch');
  assert.equal(FLAVOURS.length, 20); assert.equal(new Set(FLAVOURS).size, 20);
  const wall = rawStep('forking-paths', 'wall');
  assert.equal(wall.widget.tests, 20);
  for (const batches of [0, 1, 19, 20, 60]) assert.equal(wall.check({ batches }) === true, batches >= 20);
  assert.match(wall.check({ batches: 1 }), /1 batch so far/);
  assert.equal(wall.check(wall.solution), true);
  // Bonferroni
  const bon = rawStep('forking-paths', 'bonferroni');
  assert.deepEqual(bon.widget.alphas, [0.05, 0.05 / 20]);
  near(1 - (1 - 0.05 / 20) ** 20, 0.049, 'family-wide false-alarm rate', 0.0005);
  assert.match(bon.explain, /4\.9\\%/);
  for (const alpha of bon.widget.alphas) for (const batches of [0, 39, 40, 80]) {
    const verdict = bon.check({ alpha, batches });
    assert.equal(verdict === true, alpha === 0.0025 && batches >= 40, `alpha ${alpha}, ${batches} batches`);
    if (alpha === 0.05) assert.match(verdict, /Switch the threshold/);
  }
  assert.equal(bon.check(bon.solution), true);
  // peeking: test a true-null experiment after each fifth of the data, and stop at the first p < 0.05
  const rng = makeRng(99);
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(rng.next(), 1e-12))) * Math.cos(2 * Math.PI * rng.next());
  // Looks are equally spaced: after every 20 of 100 volunteers (five looks), or after every 10 (ten looks).
  // A "finding" is counted both ways: a difference in either direction (z beyond ±1.96), or only the hoped-for one (z above 1.645).
  const falseAlarms = (looks, reps) => {
    let either = 0;
    let hoped = 0;
    for (let r = 0; r < reps; r++) {
      let total = 0;
      let sawEither = false;
      let sawHoped = false;
      for (let k = 1; k <= looks; k++) {
        total += gauss();
        const z = total / Math.sqrt(k);
        if (Math.abs(z) > 1.959964) sawEither = true;
        if (z > 1.644854) sawHoped = true;
      }
      if (sawEither) either++;
      if (sawHoped) hoped++;
    }
    return { either: either / reps, hoped: hoped / reps };
  };
  const one = falseAlarms(1, 200000);
  near(one.either, 0.05, 'one look, either direction: the advertised 5%', 0.003);
  near(one.hoped, 0.05, 'one look, hoped-for direction: the advertised 5%', 0.003);
  const five = falseAlarms(5, 200000);
  near(five.either, 0.142, 'five looks, either direction (Armitage, McPherson and Rowe give 14.2%)', 0.004);
  near(five.hoped, 0.13, 'five looks, hoped-for direction', 0.004);
  const ten = falseAlarms(10, 200000);
  near(ten.either, 0.193, 'ten looks, either direction (Armitage, McPherson and Rowe give 19.3%)', 0.005);
  near(ten.hoped, 0.172, 'ten looks, hoped-for direction', 0.005);
  assert.ok(falseAlarms(20, 100000).either > ten.either, 'every further look adds to it');
  near(1 - 0.95 ** 5, 0.23, 'five separate experiments', 0.005);
  const peek = fixed('forking-paths', 'peeking');
  assert.ok(peek.text.includes('after every 20, five looks in all'), 'the text says what the looks are');
  assert.match(correctOption(peek).text, /^About 14%/);
  assert.match(peek.explain, /less than the 23%/);
  // the explanation says which way of counting each figure belongs to
  assert.match(peek.explain, /counts a "finding" in either direction/);
  assert.match(peek.explain, /only the hoped-for direction counts, it is about 13%/);
  assert.match(peek.explain, /one after every 10 volunteers, the two figures rise to nearly 20% and about 17%/);
  assert.equal(/almost certain/.test(peek.explain), false, 'no claim that a false alarm becomes almost certain: 100 looks give under 40%');
});

test('forking-paths: the supplement trial and the hundred labs', () => {
  assert.equal(HACK.p.length, HACK.rows.length); assert.ok(HACK.p.every((row) => row.length === HACK.cols.length));
  assert.equal(HACK.rows.length * HACK.cols.length, 20);
  const cells = HACK.p.flatMap((row, r) => row.map((p, c) => ({ p, r, c })));
  const hits = cells.filter((cell) => cell.p < 0.05);
  assert.deepEqual(hits.map((h) => [HACK.rows[h.r], HACK.cols[h.c], h.p]), [['Women', 'Mood', 0.026], ['Over 50', 'Energy', 0.039]]);
  assert.ok(cells.every((cell) => cell.p >= 0.05 ? cell.p > 0.06 : cell.p < 0.045), 'nothing sits on the line');
  assert.equal(pText(HACK.p[0][0]), '0.39');
  assert.equal(pText(0.026), '0.026'); assert.equal(pText(0.0499), '0.049'); assert.equal(pText(0.05), '0.050'); assert.equal(pText(0.0025), '0.0025'); assert.equal(pText(0.00249), '0.0024');
  const hack = rawStep('forking-paths', 'p-hack');
  assert.deepEqual(hack.widget.p, HACK.p);
  assert.deepEqual(hack.widget.open, [[0, 0]]);
  assert.ok(hack.text.includes('p = 0.39') && hack.text.includes('**weight** in **everyone**') && hack.text.includes('four other outcomes'));
  assert.match(hack.explain, /\*\*mood in women\*\* \(p = 0\.026\) and \*\*energy in the over-50s\*\* \(p = 0\.039\)/);
  // the state the widget reports for a set of opened tiles
  const state = (opened) => {
    const ps = opened.map(([r, c]) => HACK.p[r][c]);
    const best = Math.min(...ps);
    // the smallest p-value as its tile prints it: digits cut off, two places from 0.1 up and three below
    const places = best < 0.1 ? 3 : 2;
    const bestText = (Math.floor(best * 10 ** places + 1e-9) / 10 ** places).toFixed(places);
    assert.equal(bestText, pText(best), 'the tile prints it the same way');
    return { tried: opened.length, found: ps.some((p) => p < 0.05), best, bestText, hits: ps.filter((p) => p < 0.05).length };
  };
  // every order of opening tiles one by one from the top-left, in four different sweeps
  const sweeps = [cells, [...cells].reverse(), [...cells].sort((x, y) => y.p - x.p), [...cells].sort((x, y) => x.c - y.c || x.r - y.r)];
  for (const sweep of sweeps) {
    const opened = [[0, 0]];
    for (const cell of sweep) {
      if (!(cell.r === 0 && cell.c === 0)) opened.push([cell.r, cell.c]);
      const s = state(opened);
      const verdict = hack.check(s);
      assert.equal(verdict === true, s.found, `after ${opened.length} tiles`);
      if (verdict !== true) assert.ok(typeof verdict === 'string' && verdict.includes(`is ${s.bestText}.`) && verdict.includes(`${s.tried} of 20 run`), String(verdict));
    }
    assert.equal(state(opened).found, true, 'with every tile open there is always a hit');
  }
  assert.equal(hack.check(state(hack.solution.opened)), true);

  assert.equal(DRAWER.length, 100);
  assert.equal(DRAWER.filter((p) => p < 0.05).length, 6);
  assert.ok(DRAWER.every((p) => p > 0 && p < 1 && Math.abs(p - 0.05) > 0.005));
  const drawer = fixed('forking-paths', 'file-drawer');
  assert.deepEqual(drawer.figures[0].p, DRAWER);
  assert.ok(drawer.text.includes('**100 labs**') && drawer.text.includes('Six labs') && drawer.text.includes('other 94'));
  assert.match(correctOption(drawer).text, /^That the charm works/);
  near(100 * 0.05, 5, 'five expected');
});

test('forking-paths/expected: the number of tests times the threshold', () => {
  eachVariant('forking-paths', 'expected', (step) => {
    const n = firstNum(bolds(step.text)[0]);
    const alpha = Number(grab(step.text, /threshold of \*\*([\d.]+)\*\*/, 'the threshold')[1]);
    near(step.answer, n * alpha, 'expected false alarms');
    slipsAreWrong(step);
    assert.ok(step.wrong.some(([v]) => v === n - step.answer), 'counting the quiet tests is anticipated');
    assert.ok(step.hints[0].includes(`${alpha * 100}% of ${n}`) || step.hints[0].includes(`${Math.round(alpha * 100)}% of ${n}`));
    assert.ok(step.explain.includes(`= ${step.answer}$`));
  });
});

test('forking-paths/at-least-one: one minus the chance that every test stays quiet', () => {
  eachVariant('forking-paths', 'at-least-one', (step) => {
    const k = Number(grab(step.text, /measures \*\*(\d+) different outcomes\*\*/, 'the number of outcomes')[1]);
    let quiet = 1;
    for (let i = 0; i < k; i++) quiet *= 0.95;
    near(step.answer, 100 * (1 - quiet), 'chance of at least one', 1e-9);
    assert.ok(Math.abs(Math.round(step.answer) - step.answer) <= step.tolerance, 'the nearest whole number is accepted');
    slipsAreWrong(step);
    assert.equal(step.wrong.some(([v]) => v === 5 * k), k >= 4, 'adding 5% per test is flagged only where it is clearly off');
    assert.ok(step.explain.includes(`\\approx ${Math.round(step.answer)}\\%`));
    assert.ok(step.text.includes('(#/learn/probability/and-or)'));
  });
});

test('forking-paths: the published facts are quoted as checked, and the keys are right', () => {
  const rep = rawStep('forking-paths', 'replication').text;
  assert.ok(rep.includes('2015') && rep.includes('**100 studies**') && rep.includes('three psychology journals'));
  assert.match(rep, /\| Statistically significant \| 97% \| 36% \|/);
  assert.match(rep, /about \*\*half the size\*\*/);
  const pre = fixed('forking-paths', 'prereg');
  assert.ok(pre.text.includes('55 big trials') && pre.text.includes('**17 of 30** (57%)'));
  assert.equal(Math.round((17 / 30) * 100), 57); assert.equal(Math.round((2 / 25) * 100), 8); assert.equal(30 + 25, 55);
  assert.equal(correctOption(pre).text, 'Far fewer: 2 of 25');
  assert.match(pre.explain, /\*\*2 of 25\*\*: just 8%/);
  assert.match(correctOption(fixed('forking-paths', 'why-shrink')).text, /overestimate the effect/);
  const sort = fixed('forking-paths', 'checklist');
  const warning = [/subgroup/, /Dozens of outcomes/, /never how big/, /Forty volunteers/];
  for (const item of sort.items) assert.equal(item.bucket, warning.some((re) => re.test(item.text)) ? 1 : 0, item.text);
  assert.equal(sort.items.filter((it) => it.bucket === 1).length, 4);
  assert.equal(fixed('forking-paths', 'defences').pairs.length, 5);
});

/* ------------------------------------------------------------ teach before you ask */

/** The teaching screens added in the "teach before you ask" revision, each with the first step it serves. */
const TEACHING = {
  'sampling-distributions': [['example-se', 'se-calc'], ['teach-clt', 'clt-apply'], ['example-band', 'band-95']],
  'confidence-intervals': [['teach-interval', 'build-one'], ['teach-width', 'tradeoff'], ['teach-polls', 'poll-margin']],
  'hypothesis-tests': [['example-p', 'read-p'], ['teach-not-chance', 'interpret']],
  'errors-and-power': [['teach-power', 'raises-power'], ['example-count', 'count-errors']],
  experiments: [['teach-random', 'why-random'], ['teach-zero', 'ab-read']],
  'forking-paths': [['teach-many', 'expected']],
};
const at = (lessonId, stepId) => { rawStep(lessonId, stepId); return lessons[lessonId].steps.findIndex((s) => s.id === stepId); };
/** `teach` (an info step) comes before every step of `asks`, and its text contains every one of `terms`. */
function teaches(lessonId, teach, asks, terms = []) {
  const step = rawStep(lessonId, teach);
  assert.equal(step.type, 'info', `${lessonId}/${teach} is a teaching screen`);
  for (const ask of [].concat(asks)) assert.ok(at(lessonId, teach) < at(lessonId, ask), `${lessonId}: "${teach}" comes before "${ask}"`);
  for (const term of terms) assert.match(step.text, term, `${lessonId}/${teach} teaches ${term}`);
  return step;
}
/** Many variants of a generated step (without marking it as re-derived: the tests above do that). */
function variants(lessonId, stepId) {
  const raw = rawStep(lessonId, stepId);
  assert.equal(typeof raw.gen, 'function');
  return Array.from({ length: SEEDS }, (_, i) => resolveStep(raw, makeRng(i * 6151 + 5), stepId));
}

test('teach before you ask: the shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  assert.deepEqual(Object.keys(TEACHING), LESSONS);
  for (const id of LESSONS) {
    const steps = lessons[id].steps.map((raw) => resolveStep(raw, makeRng(1), raw.id));   // `graded` exists only on resolved steps
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    // only a screen that is followed by something to answer counts as teaching
    const lastAsked = roles.reduce((last, kind, i) => (kind === 'teach' ? last : i), -1);
    assert.ok(roles.filter((kind, i) => kind === 'teach' && i < lastAsked).length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.equal(roles[0], 'predict', `${id} opens with its prediction`);
    for (const [teach, ask] of TEACHING[id]) {
      teaches(id, teach, ask);
      const next = roles.indexOf('graded', at(id, teach) + 1);
      assert.ok(next > 0 && next <= at(id, ask), `${id}/${teach}: nothing graded is asked between it and "${ask}"`);
    }
  }
});

test('teach before you ask, lesson 1: a worked standard error, the theorem by name, a worked 95% band', () => {
  const L = 'sampling-distributions';
  teaches(L, 'name-it', 'two-spreads', [/\*\*sampling distribution\*\*/]);
  assert.match(rawStep(L, 'two-spreads').text, /about 95% of the values lie within 2 standard deviations/, 'the rule from the statistics course is recalled where it is first needed');
  teaches(L, 'formula', ['example-se', 'se-calc', 'bigger-sample', 'spreads-sort'], [/\*\*standard error\*\*/, /\\frac\{\\text\{SD\}\}\{\\sqrt\{n\}\}/]);

  // the worked standard error: 49 parcels with an SD of 21 g, then 36 times as many
  const se = teaches(L, 'example-se', ['se-calc', 'bigger-sample'], [/:::example/, /\*\*49 parcels\*\*/, /SD of \*\*21 g\*\*/, /\\sqrt\{49\} = 7/, /21 \\div 7 = 3\$ g/, /\\sqrt\{36\} = 6/, /3 \\div 6 = 0\.5\$ g/]);
  near(21 / Math.sqrt(49), 3, 'the worked standard error'); near(3 / Math.sqrt(36), 0.5, 'and 36 times the sample');
  const depot = population('bell', ...se.figure.x);
  near(depot.mean, 500, 'the parcels in the figure', 1e-6); near(depot.sd, 21, 'their SD', 0.05);
  assert.deepEqual([se.figure.n, se.figure.static, se.figure.spreads], [49, true, 'exact']);
  // … with numbers the two practice steps cannot produce
  for (const step of variants(L, 'se-calc')) assert.notEqual(firstNum(bolds(step.text)[0]), 49, 'no generated sample has 49 members');
  for (const step of variants(L, 'bigger-sample')) assert.notEqual(Number(/: (\d+) times as many/.exec(step.text)[1]), 36, 'no generated survey grows 36-fold');

  // the theorem is named on a screen after the exploration and before the question about it, not in an explanation
  const clt = teaches(L, 'teach-clt', ['clt-apply', 'truths'], [/\*\*Central limit theorem:\*\* averages of large enough random samples are bell-shaped, almost whatever the shape of the data/, /larger the sample has to be/]);
  assert.ok(at(L, 'shape-explore') < at(L, 'teach-clt'));
  assert.equal(/central limit theorem/i.test(rawStep(L, 'shape-explore').explain), false);
  assert.deepEqual([clt.figure.shape, clt.figure.n, clt.figure.static], ['skew', 30, true]);

  // the worked band: 500 ± 2 × 3, and single parcels 500 ± 2 × 21
  const band = teaches(L, 'example-band', 'band-95', [/:::example/, /within \*\*2 standard errors\*\* of the true mean/, /21 \\div \\sqrt\{49\} = 3/, /500 - 6 = 494/, /500 \+ 6 = 506/, /about 458 to 542 g/]);
  assert.deepEqual([500 - 2 * 3, 500 + 2 * 3, 500 - 2 * 21, 500 + 2 * 21], [494, 506, 458, 542]);
  assert.ok(band.text.includes('mean of **500 g**'));
  for (const step of variants(L, 'band-95')) {
    const [centre, , sample] = bolds(step.text);
    assert.ok(firstNum(centre) !== 500 && firstNum(sample) !== 49, 'the worked band is not one of the generated ones');
  }
});

test('teach before you ask, lesson 2: the interval, its width and the poll are shown before they are asked for', () => {
  const L = 'confidence-intervals';
  // the definition and a worked interval come before the first interval the learner builds
  const first = teaches(L, 'teach-interval', ['build-one', 'ci-calc'], [/\*\*interval estimate\*\*/, /\\text\{estimate\} \\pm \\text\{margin\}/, /within \*\*2 standard errors\*\* of the true mean/, /:::example/, /\*\*81 loaves\*\*/, /18 \\div 9 = 2\$ g/, /400 - 4 = 396/, /400 \+ 4 = 404/]);
  near(18 / Math.sqrt(81), 2, 'the baker\'s standard error');
  assert.deepEqual(first.figure.fixed, [[400, 2]]);
  assert.deepEqual([first.figure.mean, first.figure.sd, first.figure.n], [400, 18, 81]);
  for (const step of variants(L, 'ci-calc')) {
    assert.notEqual(firstNum(bolds(step.text)[0]), 81, 'no generated sample has 81 members');
    assert.match(step.text, /a standard error is the SD divided by √n/, 'the review step recalls the standard error');
  }

  // the careful reading is stated before the three misreadings and before the review question on it
  const meaning = teaches(L, 'meaning', ['not-the-data', 'not-the-next', 'careful-statement', 'meaning-review'], [/describes the \*\*method\*\*/, /about 95% of the time/, /The true mean is one fixed number: your interval either contains it or does not/]);
  assert.deepEqual(meaning.figure.fixed, RAIN);
  const hits = RAIN.filter(([est, s]) => Math.abs(est - 40) <= 2 * s).length;
  assert.ok(meaning.figure.caption.includes(`${hits} caught the true mean and ${100 - hits},`), 'the caption counts the hundred intervals correctly');

  // the formula for the width, and each row of its table
  const width = teaches(L, 'teach-width', 'tradeoff', [/margin = \(number of standard errors\) × SD ÷ √n/, /\*\*More confidence\*\*/, /\*\*More data\*\*/, /a larger SD/, /size of the \*population\* is not in the formula/]);
  assert.ok(at(L, 'width-explore') < at(L, 'teach-width'));
  for (const level of rawStep(L, 'width-explore').widget.levels) {
    const row = `| ${level}% | ${MULTIPLIER[level]} | ± ${MULTIPLIER[level] * 1.5} min |`;
    assert.ok(width.text.includes(row), `the table has the row ${row}`);
  }
  near(12 / Math.sqrt(64), 1.5, 'the standard error the table uses is the researcher\'s');

  // the poll: the shortcut worked once, and the reading against 50%
  const polls = teaches(L, 'teach-polls', ['poll-margin', 'poll-read'], [/:::example/, /1 \\div \\sqrt\{n\}/, /1 \\div 30 \\approx 0\.033/, /56 - 3\.3 = 52\.7/, /56 \+ 3\.3 = 59\.3/, /whole interval lies above 50%/, /both sides of 50%/, /wholly below 50%/, /set of values the data leave plausible/]);
  near(1 / Math.sqrt(900), 0.033, 'the worked margin', 0.0005);
  assert.ok(polls.text.includes('**900**'));
  for (const step of [...variants(L, 'poll-margin'), ...variants(L, 'poll-read')]) assert.equal(/\b900\b/.test(step.text), false, 'no generated poll asks 900 people');
});

test('teach before you ask, lesson 3: a worked p-value, and what a p-value is not, before the questions on them', () => {
  const L = 'hypothesis-tests';
  teaches(L, 'name-it', ['example-p', 'read-p', 'what-p-says', 'test-order', 'tea'], [/\*\*null hypothesis\*\*/, /\*\*p-value\*\*/, /at least as extreme/]);
  // the worked simulation: 11 or more reds in 30 spins of a fair one-in-five spinner, 4,000 runs
  const example = teaches(L, 'example-p', 'read-p', [/:::example/, /Null hypothesis: the spinner is fair/, /\*\*4,000 times\*\*/, /In \*\*102\*\* of those runs/, /102 \\div 4000 = 0\.0255/, /in about 2\.6% of experiments/]);
  const spinner = upper(binomial(30, 1 / 5), 11);
  assert.equal(Math.round(spinner * 4000), 102, 'what such a simulation gives on average');
  assert.equal(pc(102 / 4000), '2.6');
  near(30 / 5, 6, 'a fair spinner averages 6 reds'); assert.ok(example.text.includes('would average 6'));
  for (const step of variants(L, 'read-p')) assert.equal(/4,000|spinner/.test(step.text), false, 'the worked example is not one of the generated questions');

  // "statistically significant" is defined where the learner first uses it, and again on the screen about the convention
  assert.match(rawStep(L, 'threshold-hunt').text, /\*\*statistically significant\*\* when its p-value is below \*\*0\.05\*\*/);
  assert.ok(at(L, 'threshold-hunt') < at(L, 'interpret'));
  teaches(L, 'convention', 'verdict', [/\*\*statistically significant\*\*/, /It does not mean large, or important/, /No evidence of an effect is not evidence of no effect/]);

  // what a p-value does not say: stated on a screen after the crowd of experiments, before the two review questions
  const not = teaches(L, 'teach-not-chance', ['interpret', 'verdict'], [/It is \*\*not\*\* the probability that the null hypothesis is true/, /depends on the base rate as well/, /125 significant results/, /45 of them were false alarms/, /Nor does a p-value say how big an effect is/]);
  assert.ok(at(L, 'base-rate') < at(L, 'teach-not-chance') && at(L, 'what-p-says') < at(L, 'teach-not-chance'));
  const crowd = rawStep(L, 'base-rate').widget;
  assert.deepEqual([not.figure.n, not.figure.base, not.figure.sens, not.figure.fpr], [crowd.n, crowd.base, crowd.sens, crowd.fpr], 'the figure is the crowd the learner has just stepped through');
  assert.deepEqual([not.figure.stage, not.figure.stages], [3, false]);
  assert.ok(not.figure.caption.includes('125') && not.figure.caption.includes('80 real effects') && not.figure.caption.includes('45 false alarms'));
});

test('teach before you ask, lesson 4: what raises power and a worked count of errors', () => {
  const L = 'errors-and-power';
  teaches(L, 'two-errors', ['classify', 'tradeoff', 'count-errors'], [/type I error/, /type II error/, /5% of experiments on a useless treatment still come out significant/]);
  assert.deepEqual([rawStep(L, 'two-errors').figure.effect, rawStep(L, 'two-errors').figure.n], [3, 20], 'its picture is the first experiment');
  teaches(L, 'power-name', ['power-n', 'effect-size', 'raises-power', 'count-errors', 'no-evidence'], [/\*\*Power\*\* is the probability of a significant result when the effect is real/, /1 minus the miss rate/]);

  // every statement of the review question on power has been shown: three things that raise it, one that lowers it
  const power = teaches(L, 'teach-power', ['raises-power', 'no-evidence', 'huge-sample'], [/\*\*A larger true effect\*\*/, /\*effect size\*/, /\*\*More people in each group\*\*/, /\*\*Less varied measurements\*\* \(a smaller SD\)/, /stricter threshold does the opposite/]);
  assert.ok(at(L, 'power-n') < at(L, 'teach-power') && at(L, 'effect-size') < at(L, 'teach-power'));
  const quoted = /A test with (\d+)% power misses a real effect (\d+) times in 100/.exec(power.text).slice(1).map(Number);
  assert.equal(quoted[0] + quoted[1], 100);
  assert.equal(Math.round(experiment({ n: 20, effect: 3, alpha: 0.05 }).power * 100), quoted[0], 'it is the power of the lesson\'s first experiment');
  assert.deepEqual([power.figure.effect, power.figure.n], [5, 50]);
  assert.equal(Math.round(experiment({ n: 50, effect: 5, alpha: 0.05 }).power * 100), 80);
  assert.match(power.figure.caption, /power is 80%/);

  // the worked count, on the screen and in its picture
  const count = teaches(L, 'example-count', 'count-errors', [/:::example/, /tests \*\*400\*\* ideas/, /\*\*80\*\* are real effects and the other 320 do nothing/, /power of \*\*70%\*\*/, /0\.05 \\times 320 = 16/, /0\.7 \\times 80 = 56/, /80 - 56 = 24/, /16 \+ 56 = 72\$ significant results, and 16 of them are false alarms/]);
  const f = count.figure;
  assert.deepEqual([f.n, f.n * f.base, f.sens, f.fpr], [400, 80, 0.7, 0.05]);
  assert.deepEqual([0.05 * 320, 0.7 * 80, 80 - 56], [16, 56, 24]);
  assert.ok(f.caption.includes('56 detected, 24 missed, 16 false alarms') && f.caption.includes(`${320 - 16} correctly left alone`));
  for (const step of variants(L, 'count-errors')) assert.equal(/\*\*70%\*\*|\*\*80\*\* of them are real/.test(step.text), false, 'the worked lab is not one of the generated ones');

  assert.match(rawStep(L, 'huge-sample').text, /"significant" means \*hard to explain by chance alone\*: it does not mean large, or important/, 'the reading from the lesson before is recalled');
});

test('teach before you ask, lesson 5: random assignment and its vocabulary, and reading an interval against zero', () => {
  const L = 'experiments';
  teaches(L, 'confounding', ['which-design'], [/\*\*confounder\*\*/, /\*\*self-selection\*\*/, /\*\*observational study\*\*/]);
  const random = teaches(L, 'teach-random', ['why-random', 'lind', 'safeguards', 'which-design'], [/\*\*random assignment\*\*/, /balances \*\*everything\*\* at once/, /things nobody has thought of/, /\*\*randomised controlled trial\*\*/, /\*\*control group\*\* goes without the treatment/, /would have got better on their own/]);
  assert.ok(at(L, 'coin') < at(L, 'teach-random'));
  assert.deepEqual([random.figure.methods, random.figure.effect, random.figure.reveal], [['coin'], 0, 'shown']);
  assert.deepEqual(random.figure.units, STUDENTS);
  const salk = teaches(L, 'salk', 'safeguards', [/\*\*placebo\*\*/, /\*\*double-blind\*\*/, /doctors who know may judge unclear cases hopefully/]);
  // each safeguard of the matching question is named on one of the two screens above it
  for (const [left] of fixed(L, 'safeguards').pairs) {
    const word = left.replace(/^A /, '').replace('Blinding the doctors', 'doctors').toLowerCase();
    assert.ok(`${random.text} ${salk.text}`.toLowerCase().includes(word), `"${left}" has been taught`);
  }

  // the worked reading: 600 people per version, 22% against 26% (and against 29%)
  const zero = teaches(L, 'teach-zero', 'ab-read', [/:::example/, /set of values the data leave plausible/, /\*\*0\*\*, which means "no difference at all"/, /2 \\times 2\.5 = 5/, /4 - 5 = -1/, /4 \+ 5 = 9/, /\*\*do not\*\* rule out/, /from 2 to 12 points/, /\*\*do\*\* rule out/]);
  assert.ok(at(L, 'ab-interval') < at(L, 'teach-zero'));
  const seOf = (a, b) => 100 * Math.sqrt((a * (1 - a)) / 600 + (b * (1 - b)) / 600);
  assert.ok(zero.text.includes('Version A: 600 people, 22% signed up. Version B: 600 people, 26%.') && zero.text.includes('Had B scored 29%, a lead of 7'));
  assert.equal(seOf(0.22, 0.26).toFixed(1), '2.5'); assert.equal(seOf(0.22, 0.29).toFixed(1), '2.5');
  assert.deepEqual([4 - 2 * 2.5, 4 + 2 * 2.5, 7 - 2 * 2.5, 7 + 2 * 2.5], [-1, 9, 2, 12]);
  assert.deepEqual([zero.figure.ranges[0].from, zero.figure.ranges[0].to], [-1, 9]);
  assert.deepEqual(zero.figure.marks.map((m) => m.value), [4, 0]);
  for (const step of variants(L, 'ab-read')) assert.equal(/(^|[^,\d])600 people/.test(step.text), false, 'no generated test has 600 people per version');
});

test('teach before you ask, lesson 6: two worked sums for many tests, and only two predictions', () => {
  const L = 'forking-paths';
  const many = teaches(L, 'teach-many', ['expected', 'at-least-one'], [/:::example/, /300 \\times 0\.05 = 15/, /300 \\times 0\.01 = 3/, /0\.95\^\{8\} \\approx 0\.66/, /1 - 0\.66 = 0\.34\$, or 34%/]);
  assert.ok(at(L, 'wall') < at(L, 'teach-many'));
  near(300 * 0.05, 15, 'expected false alarms'); near(300 * 0.01, 3, 'at the stricter threshold');
  near(0.95 ** 8, 0.66, 'all eight quiet', 0.005); near(1 - 0.95 ** 8, 0.34, 'at least one of eight', 0.005);
  assert.ok(many.text.includes('(#/learn/inference/errors-and-power)'), 'it points back to the lesson that taught the false-alarm rate');
  for (const step of variants(L, 'expected')) assert.notEqual(firstNum(bolds(step.text)[0]), 300, 'no generated team runs 300 tests');
  for (const step of variants(L, 'at-least-one')) assert.equal(/\*\*8 different outcomes\*\*/.test(step.text), false, 'no generated study measures 8 outcomes');

  // the lesson keeps two predictions: the hook, and the result of a study that cannot be taught first
  const predictions = lessons[L].steps.filter((s) => s.mode === 'predict').map((s) => s.id);
  assert.deepEqual(predictions, ['hook', 'prereg']);
  // peeking is now a graded evidence question: its prompt gives the two bounds, and one option lies between them
  const peek = fixed(L, 'peeking');
  assert.equal(peek.graded, true);
  assert.ok(at(L, 'name-it') < at(L, 'peeking'));
  assert.match(rawStep(L, 'name-it').text, /\*\*When to stop\?\*\*/);
  assert.match(peek.text, /1 - 0\.95\^\{5\} \\approx 23\\%/);
  assert.match(peek.text, /Her five looks are not separate/);
  const shares = peek.options.map((o) => Number((/(\d+)%/.exec(o.text) || [])[1]));
  assert.deepEqual(shares.filter((v) => v > 5 && v < 23), [14]);
  for (const o of peek.options) if (!o.correct) assert.ok(o.why && o.why.length > 40, `"${o.text}" says why it is wrong`);

  // every defence of the matching question has been met, and its two terms of art are glossed
  teaches(L, 'name-it', ['peeking', 'defences', 'checklist'], [/\*\*p-hacking\*\*/, /\*\*garden of forking paths\*\*/]);
  teaches(L, 'replication', ['why-shrink', 'defences', 'checklist'], [/repeated \*\*100 studies\*\*/]);
  assert.match(rawStep(L, 'bonferroni').text, /\*\*Bonferroni correction\*\*/);
  assert.match(rawStep(L, 'prereg').text, /\*\*Pre-registration\*\* means writing down in public, \*before\* collecting any data/);
  assert.match(rawStep(L, 'file-drawer').explain, /\*\*publication bias\*\*, or the \*file-drawer problem\*/);
  for (const id of ['bonferroni', 'prereg', 'file-drawer', 'replication']) assert.ok(at(L, id) < at(L, 'defences'));
  assert.match(rawStep(L, 'defences').text, /An \*effect size\* says how big an effect is\. A \*null result\* is a study that found nothing\./);
});

/* ----------------------------------------------------------------- the whole course */

test('every step: one correct option per choice, no duplicates, nothing "undefined", solutions that fit', () => {
  for (const id of LESSONS) {
    const lesson = lessons[id];
    assert.ok(lesson.steps.length >= 13 && lesson.steps.length <= 18, `${id} has ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review).length;
    assert.ok(reviews >= 2 && reviews <= 4, `${id} has ${reviews} review steps`);
    const handsOn = lesson.steps.filter((s) => s.type === 'interact' || (s.figure && !s.figure.static && !s.figure.fixed)).length;
    assert.ok(handsOn >= 2, `${id} has ${handsOn} hands-on steps`);
    for (const raw of lesson.steps) {
      const rounds = typeof raw.gen === 'function' ? SEEDS : 1;
      for (let k = 0; k < rounds; k++) {
        const step = resolveStep(raw, makeRng(31 + k * 977), raw.id);
        const where = `${id}/${raw.id}`;
        for (const text of textsOf(step)) {
          assert.equal(/undefined|NaN|\[object/.test(text), false, `${where}: "${text.slice(0, 80)}"`);
          // singular and plural, articles, and stray ASCII minus signs in running text
          assert.equal(/(^|[^\d.,])1\$? (minutes|hours|marks|points|samples|batches|times|experiments|intervals)\b/.test(text), false, `${where}: "1" with a plural in "${text.slice(0, 120)}"`);
          assert.equal(/\ba (email|8\d?%|11%|18%)/.test(text), false, `${where}: "a" before a vowel sound in "${text.slice(0, 120)}"`);
        }
        if (step.type === 'choice') {
          assert.equal(step.options.filter((o) => o.correct).length, 1, `${where}: exactly one correct option`);
          assert.equal(new Set(step.options.map((o) => o.text.trim())).size, step.options.length, `${where}: no duplicate options`);
        }
        if (step.type === 'multi') {
          assert.ok(step.options.some((o) => o.correct) && step.options.some((o) => !o.correct), `${where}: a mix of true and false`);
          assert.equal(new Set(step.options.map((o) => o.text.trim())).size, step.options.length, `${where}: no duplicate options`);
          for (const o of step.options) if (!o.correct) assert.ok(o.why, `${where}: a false statement says why`);
        }
        if (step.graded) assert.ok(step.explain, `${where}: has an explanation`);
        if (raw.review) assert.ok(raw.id && step.explain, `${where}: review steps have an id and an explanation`);
        if (step.type === 'interact') assert.ok(step.solution && typeof step.check === 'function', `${where}: has a check and a solution`);
        if (step.type === 'numeric') assert.ok(Number.isFinite(step.answer));
      }
    }
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next, `${id}: next`);
  }
});

test('every generated step of the course is re-derived above', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.slice().sort(), GENERATED[id].slice().sort(), `${id}: the list of generated steps is complete`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} has a test`);
  }
});
