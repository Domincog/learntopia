/**
 * Data & Statistics course: the numbers quoted in the lessons are computed
 * from invented data sets. These tests pin those numbers down, check the
 * pure maths inside the course's widgets, and run every generated step many
 * times.
 *
 *   node --test tests/statistics.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng.js';
import { resolveStep } from '../src/player/normalize.js';
import { summarize } from '../src/widgets/dot-plot.js';
import { binCounts, summary } from '../src/widgets/histogram-lab.js';
import { regress } from '../src/widgets/scatter-fit.js';
import { layers, margin } from '../src/widgets/sampler.js';
import { describe, correlation, bestFit, cloud, JOURNEYS, HEIGHTS, INCOMES, QUIZ, ICE } from '../content/courses/statistics/helpers.js';

const LESSONS = ['center', 'spread', 'distributions', 'correlation', 'sampling', 'misleading-data'];
const load = async (id) => (await import(`../content/courses/statistics/lessons/${id}.js`)).default;
const stepOf = (lesson, id) => lesson.steps.find((s) => s.id === id);
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/** The state a dot-plot would report for these values (see src/widgets/dot-plot.js). */
function dotState(values, start = values, fulcrum = null) {
  const st = summarize(values);
  return { values, ...st, moved: values.filter((v, i) => v !== start[i]).length, fulcrum, balanced: fulcrum == null ? true : Math.abs(st.sum - st.n * fulcrum) < 1e-6 };
}

test('summarize: mean, median, quartiles and SD follow the conventions used in the lessons', () => {
  const a = summarize([2, 4, 5, 6, 8]);
  assert.equal(a.mean, 5);
  assert.equal(a.sd, 2);
  const puzzle = summarize([3, 3, 4, 4, 5, 5, 18]);
  assert.deepEqual([puzzle.median, puzzle.q1, puzzle.q3, puzzle.iqr, puzzle.range], [4, 3, 5, 2, 15]);
  const eight = summarize([1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual([eight.median, eight.q1, eight.q3], [4.5, 2.5, 6.5]);
  const eleven = summarize([2, 3, 3, 4, 4, 4, 5, 5, 6, 6, 18]);
  assert.deepEqual([eleven.median, eleven.q1, eleven.q3], [4, 3, 6]);
  assert.ok(near(summarize([0, 0, 5, 10, 10]).sd, Math.sqrt(20), 1e-6));
});

test('the slow friend never moves the box (iqr-idea caption)', () => {
  for (let x = 0; x <= 20; x++) {
    const s = summarize([3, 3, 4, 4, 5, 5, x]);
    assert.deepEqual([s.q1, s.median, s.q3], [3, 4, 5], `orange dot at ${x}`);
  }
});

test('helpers.describe agrees with the widget', () => {
  const rng = makeRng(5);
  for (let k = 0; k < 200; k++) {
    const values = Array.from({ length: rng.int(1, 12) }, () => rng.int(0, 40));
    const a = describe(values);
    const b = summarize(values);
    for (const key of ['mean', 'median', 'q1', 'q3', 'iqr', 'range', 'sd']) assert.ok(near(a[key], b[key], 1e-6), `${key} of ${values}`);
  }
});

test('three data sets with mean 5 and range 10 have the SDs quoted in "biggest-sd"', () => {
  const sets = [[0, 4, 5, 5, 5, 5, 6, 10], [0, 1, 3, 4, 6, 7, 9, 10], [0, 0, 1, 1, 9, 9, 10, 10]].map(summarize);
  for (const s of sets) { assert.equal(s.mean, 5); assert.equal(s.range, 10); }
  assert.deepEqual(sets.map((s) => Math.round(s.sd * 10) / 10), [2.5, 3.4, 4.5]);
});

test('JOURNEYS: wide bins hide two groups that medium bins show', () => {
  assert.equal(JOURNEYS.length, 160);
  assert.deepEqual(binCounts(JOURNEYS, 0, 45, 45), [160]);
  assert.deepEqual(binCounts(JOURNEYS, 0, 45, 15), [50, 68, 42]);
  for (const width of [3, 5, 9]) {
    const c = binCounts(JOURNEYS, 0, 45, width);
    const peak = c.indexOf(Math.max(...c));
    const valley = c.slice(peak + 1).findIndex((v, i, arr) => v < c[peak] && arr.slice(i + 1).some((w) => w > v + 4));
    assert.ok(valley >= 0, `two humps at width ${width}: ${c}`);
  }
  const s = summary(JOURNEYS);
  assert.ok(near(s.mean, 22.06, 0.05));
  assert.equal(JOURNEYS.filter((v) => v >= 21 && v < 23).length, 5);
});

test('HEIGHTS follow the 68–95–99.7 rule closely', () => {
  const s = summary(HEIGHTS);
  assert.equal(s.n, 400);
  assert.ok(near(s.mean, 165.3, 0.05) && near(s.median, 165.3, 0.05) && near(s.sd, 7.23, 0.02));
  const within = (k) => (100 * HEIGHTS.filter((v) => Math.abs(v - s.mean) <= k * s.sd).length) / s.n;
  assert.ok(near(within(1), 68, 2) && near(within(2), 95, 1) && near(within(3), 99.7, 0.3));
  assert.ok(near(s.mean - 2 * s.sd, 151, 0.5) && near(s.mean + 2 * s.sd, 180, 0.5));
});

test('INCOMES are skewed right, QUIZ marks skewed left', () => {
  const s = summary(INCOMES);
  assert.equal(s.n, 300);
  assert.equal(s.median, 36.5);
  assert.ok(near(s.mean, 41.2, 0.1) && near(s.sd, 22.5, 0.1));
  assert.ok(s.sorted[0] > 10 && s.sorted[0] < 11);
  assert.equal(INCOMES.filter((v) => v < s.mean - 2 * s.sd).length, 0);
  assert.ok(near((100 * INCOMES.filter((v) => v > 85).length) / s.n, 5, 0.5));
  // the marker task: 36, 36.5 and 37 are accepted, 35.5 and 37.5 are not
  const below = (g) => (100 * (INCOMES.filter((v) => v < g).length + INCOMES.filter((v) => v === g).length / 2)) / s.n;
  assert.deepEqual([35.5, 36, 36.5, 37, 37.5].map((g) => Math.abs(below(g) - 50) <= 2.5), [false, true, true, true, false]);
  const q = summary(QUIZ);
  assert.ok(near(q.mean, 86, 0.5) && near(q.median, 88, 0.5) && q.mean < q.median);
});

test('cloud() produces the correlation it was asked for', () => {
  for (const r of [-0.9, -0.7, -0.4, 0, 0.4, 0.7, 0.9]) {
    for (let seed = 1; seed <= 25; seed++) {
      const pts = cloud(makeRng(seed * 31 + 7), 36, r);
      assert.ok(near(correlation(pts), r, 0.01), `r = ${r}, seed ${seed}: got ${correlation(pts)}`);
      assert.ok(pts.every((p) => p[0] >= 0 && p[0] <= 10 && p[1] >= 0 && p[1] <= 10));
    }
  }
});

test('ICE: the trend quoted in the correlation lesson', () => {
  const fit = regress(ICE);
  assert.ok(near(fit.slope, 9.87, 0.01) && near(fit.r, 0.95, 0.005));
  assert.ok(near(fit.intercept + 30 * fit.slope, 200, 5));
  assert.ok(near(bestFit(ICE).slope, fit.slope, 1e-9));
});

test('one outlier flips the sign of r', () => {
  const line = [[2, 3], [3, 3.5], [3.5, 4.5], [4.5, 5], [5, 6], [6, 6.5]];
  assert.ok(near(regress([...line, [6.5, 7.5]]).r, 0.99, 0.005));
  assert.ok(regress([...line, [10, 0]]).r < -0.4);
});

test('sampler: the unstirred pot and the margins of error', () => {
  const rows = layers(0.6);
  assert.equal(rows.reduce((t, v) => t + v, 0), 600);
  assert.equal(rows.slice(0, 4).reduce((t, v) => t + v, 0), 180);          // "about 90% teal" at the top
  assert.ok(rows.every((v, i) => i === 0 || v <= rows[i - 1]));
  assert.deepEqual([10, 40, 160].map((n) => Math.round(margin(0.6, n))), [31, 15, 7]);
});

test('Milltown burglaries: what the lesson says about them', async () => {
  const lesson = await load('misleading-data');
  const cherry = stepOf(lesson, 'cherry');
  const values = cherry.widget.values;
  const at = (year) => values[year - 2000];
  assert.equal(values.length, 25);
  assert.equal(Math.min(...values), at(2020));
  assert.equal(Math.round(((at(2023) - at(2020)) / at(2020)) * 100), 22);
  assert.equal(Math.round(((at(2024) - at(2000)) / at(2000)) * 100), -45);
  assert.ok(at(2020) < at(2000) / 2);
  const state = (from, to) => ({ from, to, span: to - from, first: at(from), last: at(to), change: at(to) - at(from), percent: ((at(to) - at(from)) / at(from)) * 100 });
  const winners = [];
  for (let from = 2000; from < 2024; from++) for (let to = from + 1; to <= 2024; to++) if (cherry.check(state(from, to)) === true) winners.push(`${from}-${to}`);
  // 2020 to 2022 is a rise of 14.9%, which the widget's readout shows as "up 15%": it counts.
  assert.deepEqual(winners, ['2020-2022', '2020-2023', '2020-2024', '2021-2023']);
  for (let from = 2000; from < 2024; from++) {
    for (let to = from + 2; to <= 2024; to++) {
      const shown = Math.round(((at(to) - at(from)) / at(from)) * 100);     // what the "change" readout displays
      const verdict = cherry.check(state(from, to));
      assert.equal(verdict === true, shown >= 15, `${from}-${to}: readout says ${shown}%`);
      if (verdict !== true && shown > 0) assert.ok(verdict.includes(`Up by ${shown}%`), `${from}-${to}: feedback quotes the readout`);
    }
  }
  assert.equal(cherry.check(state(cherry.solution.from, cherry.solution.to)), true);
});

test('dot-plot tasks: the published solutions pass, typical wrong states get feedback', async () => {
  const center = await load('center');
  const spread = await load('spread');
  const cases = [
    [stepOf(center, 'balance'), dotState([1, 2, 3, 4, 10], [1, 2, 3, 4, 10], 4), dotState([1, 2, 3, 4, 10], [1, 2, 3, 4, 10], 3)],
    [stepOf(center, 'missing-weight'), dotState([3, 4, 5, 6, 7], [3, 4, 5, 6, 1], 5), dotState([3, 4, 5, 6, 9], [3, 4, 5, 6, 1], 5)],
    [stepOf(center, 'drag-rich'), dotState([20, 30, 40, 50, 200]), dotState([20, 30, 40, 50, 120])],
    [stepOf(center, 'pull-apart'), dotState([1, 2, 3, 9, 10]), dotState([1, 2, 4, 8, 10])],
    [stepOf(spread, 'same-mean'), dotState([1, 3, 5, 7, 9]), dotState([4, 5, 5, 5, 6])],
    [stepOf(spread, 'box-task'), dotState([0, 4, 4, 5, 6, 6, 10]), dotState([0, 3, 4, 5, 6, 7, 10])],
    [stepOf(spread, 'max-spread'), dotState([0, 0, 5, 10, 10]), dotState([0, 1, 5, 9, 10])],
  ];
  for (const [step, good, bad] of cases) {
    assert.equal(step.check(good), true, `${step.id}: solution`);
    assert.equal(typeof step.check(bad), 'string', `${step.id}: wrong state should get a hint`);
    assert.deepEqual(good.values, step.solution.values || good.values, `${step.id}: solution in the lesson file`);
  }
  assert.equal(dotState([20, 30, 40, 50, 200]).mean, 68);
});

test('every generated step survives 300 seeds', async () => {
  for (const id of LESSONS) {
    const lesson = await load(id);
    for (const raw of lesson.steps) {
      if (typeof raw.gen !== 'function') continue;
      for (let k = 0; k < 300; k++) {
        const step = resolveStep(raw, makeRng(77 + k * 131), raw.id);
        if (step.type === 'numeric' || step.type === 'slider') assert.ok(Number.isFinite(step.answer), `${id}/${raw.id}`);
        if (step.type === 'numeric') assert.ok(step.answer >= 0, `${id}/${raw.id}: negative answer`);
        if (step.options) {
          assert.equal(step.options.filter((o) => o.correct).length, 1, `${id}/${raw.id}: one correct option`);
          assert.equal(new Set(step.options.map((o) => o.text)).size, step.options.length, `${id}/${raw.id}: distinct options`);
        }
        assert.ok(step.explain, `${id}/${raw.id}: explain`);
      }
    }
  }
});

test('generated arithmetic is what the text says it is', async () => {
  const center = await load('center');
  const spread = await load('spread');
  const numbers = (text) => (/\*\*([\d, ·]+)\*\*/.exec(text)[1].match(/\d[\d,]*/g) || []).map((v) => Number(v.replace(/,/g, '')));
  for (let k = 0; k < 300; k++) {
    const rng = () => makeRng(1234 + k * 17);
    const mean = resolveStep(stepOf(center, 'mean-calc'), rng(), 'mean-calc');
    assert.equal(summarize(numbers(mean.text)).mean, mean.answer);
    const med = resolveStep(stepOf(center, 'median-calc'), rng(), 'median-calc');
    assert.equal(summarize(numbers(med.text)).median, med.answer);
    const pick = resolveStep(stepOf(center, 'which-average'), rng(), 'which-average');
    const data = summarize(numbers(pick.text));
    assert.equal(data.n, 7);
    assert.equal(pick.options.find((o) => o.correct).text.replace(/,/g, ''), String(data.median));
    assert.ok(Number.isInteger(data.mean) && data.sorted.filter((v) => v < data.mean).length === 6);
    const range = resolveStep(stepOf(spread, 'range'), rng(), 'range');
    assert.equal(summarize(numbers(range.text)).range, range.answer);
    const iqr = resolveStep(stepOf(spread, 'iqr-calc'), rng(), 'iqr-calc');
    const q = summarize(numbers(iqr.text));
    assert.deepEqual(iqr.blanks.map((b) => b.numbers[0]), [q.median, q.q1, q.q3, q.iqr]);
  }
});

/* ===========================================================================
 * Independent review checks.
 *
 * Every generated step is answered again from its own resolved wording, with
 * formulas written here (none of the lesson's, the helpers' or the widgets'
 * code is used to get the expected answer). Fixed steps and interactive checks
 * are recomputed the same way.
 * ======================================================================== */

const SEEDS = Number(process.env.STATISTICS_SEEDS) || 200;      // e.g. STATISTICS_SEEDS=3000 node --test tests/statistics.test.mjs
const lessonsById = Object.fromEntries(await Promise.all(LESSONS.map(async (id) => [id, await load(id)])));
const rawStep = (lesson, id) => {
  const step = stepOf(lessonsById[lesson], id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const variants = (lesson, id, n = SEEDS) => {
  const step = rawStep(lesson, id);
  assert.equal(typeof step.gen, 'function', `${lesson}/${id} is generated`);
  return Array.from({ length: n }, (_, k) => resolveStep(step, makeRng(9001 + k * 7919), id));
};
const flat = (text) => String(text).replace(/\s+/g, ' ').trim();
const plain = (text) => Number(String(text).replace(/,/g, ''));
const grab = (re, text, what) => { const m = re.exec(text); assert.ok(m, `${what || re} not found in: ${text}`); return m; };
const add = (a) => a.reduce((t, v) => t + v, 0);
const avg = (a) => add(a) / a.length;
const asc = (a) => a.slice().sort((x, y) => x - y);
const mid = (a) => { const s = asc(a); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const gap = (a) => Math.max(...a) - Math.min(...a);
const popSd = (a) => { const m = avg(a); return Math.sqrt(avg(a.map((v) => (v - m) ** 2))); };
const skewness = (a) => { const m = avg(a); const s = popSd(a); return avg(a.map((v) => ((v - m) / s) ** 3)); };
const pearson = (pts) => {
  const mx = avg(pts.map((p) => p[0]));
  const my = avg(pts.map((p) => p[1]));
  let sxy = 0; let sxx = 0; let syy = 0;
  for (const [x, y] of pts) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  return { r: sxy / Math.sqrt(sxx * syy), slope: sxy / sxx, intercept: my - (sxy / sxx) * mx, mx, my, mse: (syy - (sxy * sxy) / sxx) / pts.length };
};
/** 95% margin of error of a random sample of n at a 50/50 split, in percentage points. */
const pollMargin = (n) => 196 * Math.sqrt(0.25 / n);
/** Share of a normal distribution further than z SDs above the mean, in percent (Simpson's rule). */
const upperTail = (z) => {
  const f = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  const N = 2000;
  const h = z / N;
  let area = f(0) + f(z);
  for (let i = 1; i < N; i++) area += f(i * h) * (i % 2 ? 4 : 2);
  return 100 * (0.5 - (area * h) / 3);
};
/** Every piece of learner-facing text in a resolved step. */
function textsOf(step) {
  const out = [step.title, step.text, step.explain, step.template, step.model, step.unit, step.prefix, ...(step.hints || [])];
  for (const o of step.options || []) out.push(o.text, o.why);
  for (const w of step.wrong || []) out.push(w[1]);
  for (const p of step.pairs || []) out.push(...p);
  for (const it of step.items || []) out.push(typeof it === 'string' ? it : it.text, it && it.why);
  for (const b of step.buckets || []) out.push(b);
  for (const f of [...(step.figures || []), step.widget].filter(Boolean)) out.push(f.alt, f.caption, f.xLabel, f.yLabel);
  for (const o of step.options || []) if (o.figure) out.push(o.figure.alt);
  return out.filter((v) => typeof v === 'string');
}

test('no step shows "undefined" or "NaN"; every choice has one correct option and no duplicates', () => {
  let generated = 0;
  for (const id of LESSONS) {
    for (const raw of lessonsById[id].steps) {
      const runs = typeof raw.gen === 'function' ? SEEDS : 1;
      if (runs > 1) generated++;
      for (let k = 0; k < runs; k++) {
        const s = resolveStep(raw, makeRng(31 + k * 613), raw.id);
        const where = `${id}/${raw.id} (variant ${k})`;
        for (const text of textsOf(s)) {
          assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), `${where}: ${text}`);
          assert.ok(!/(?<![\d.,])1 (points|people|cases|values|times|minutes|days|hours|samples|bars|marks|goals|pages|messages|pastries|students|voters)\b/.test(text), `${where}: "1" with a plural: ${text}`);
        }
        if (s.type === 'reflect') assert.ok(s.model.length > 40, `${where}: model answer`);
        if (s.type !== 'info' && s.type !== 'reflect') assert.ok(s.explain.trim(), `${where}: explain`);
        if (s.type === 'choice' || s.type === 'multi') {
          const right = s.options.filter((o) => o.correct).length;
          if (s.type === 'choice') assert.equal(right, 1, `${where}: exactly one correct option`);
          else assert.ok(right >= 1 && right < s.options.length, `${where}: some but not all options correct`);
          const keys = s.options.map((o) => flat(o.text) || JSON.stringify(o.figure));
          assert.equal(new Set(keys).size, keys.length, `${where}: duplicate options`);
        }
        if (s.type === 'numeric') {
          assert.ok(Number.isFinite(s.answer), `${where}: numeric answer`);
          for (const [value] of s.wrong) assert.ok(Math.abs(value - s.answer) > (s.tolerance || 0), `${where}: a "wrong" value would be accepted as right`);
          if (typeof s.feedback === 'function') assert.equal(s.feedback(s.answer), null, `${where}: feedback() objects to the right answer`);
        }
        if (s.type === 'fill') for (const b of s.blanks) assert.ok(b.kind === 'select' ? b.options.includes(b.answer) : b.answers.length === 1, `${where}: blank`);
      }
    }
  }
  assert.equal(generated, 17, 'the course has 17 generated steps, each re-solved below');
});

/* ------------------------------------------------------------------ center */

test('center/mean-calc: the answer is the mean of the listed values', () => {
  const sizes = new Set();
  for (const s of variants('center', 'mean-calc')) {
    const t = flat(s.text);
    const list = grab(/\*\*([\d, ]+)\*\*\. What is the \*\*mean\*\*\?$/, t)[1].split(', ').map(Number);
    const word = grab(/^(?:On )?(\w+) /, t)[1].toLowerCase();
    assert.equal({ four: 4, five: 5, six: 6 }[word], list.length, t);
    assert.ok(list.every((v) => Number.isInteger(v) && v >= 1), t);
    assert.equal(s.answer, avg(list), t);
    assert.ok(Number.isInteger(s.answer), t);
    assert.ok(s.explain.includes(`$${list.join(' + ')} = ${add(list)}$`), s.explain);
    assert.ok(s.explain.includes(`$${add(list)} \\div ${list.length} = ${avg(list)}$`), s.explain);
    assert.ok(s.hints[1].includes(`The total is ${add(list)}. Share it equally among ${list.length}.`), s.hints[1]);
    assert.equal(typeof s.feedback(add(list) / (list.length - 1)), 'string');
    sizes.add(list.length);
  }
  assert.deepEqual([...sizes].sort(), [4, 5, 6]);
});

test('center/median-calc: odd lists give the middle value, even lists the halfway point', () => {
  let even = 0;
  let odd = 0;
  for (const s of variants('center', 'median-calc')) {
    const t = flat(s.text);
    const list = grab(/: \*\*([\d, ]+)\*\*\. What is the \*\*median\*\*\?/, t)[1].split(', ').map(Number);
    assert.equal(new Set(list).size, list.length, `values repeat: ${t}`);
    const sorted = asc(list);
    const n = list.length;
    const expected = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    assert.equal(s.answer, expected, t);
    assert.equal(/halfway between them/.test(t), n % 2 === 0, `even lists (and only those) say what to do with two middle values: ${t}`);
    assert.ok(s.hints[1].includes(`Sorted: ${sorted.join(', ')}.`), s.hints[1]);
    assert.ok(s.explain.includes(`Sorted: ${sorted.join(', ')}.`), s.explain);
    if (n % 2) {
      odd++;
      assert.ok(s.explain.includes(`with ${(n - 1) / 2} values on each side, is **${expected}**`), s.explain);
      assert.notEqual(list[(n - 1) / 2], expected, `the list as written already has the median in the middle: ${t}`);
    } else {
      even++;
      assert.ok(s.explain.includes(`\\frac{${sorted[n / 2 - 1]} + ${sorted[n / 2]}}{2} = ${expected}$`), s.explain);
      assert.deepEqual(s.wrong.map((w) => w[0]), [sorted[n / 2 - 1], sorted[n / 2]]);
    }
    if (Math.abs(avg(list) - expected) > 0.06) assert.match(s.feedback(avg(list)), /That is the mean/);
  }
  assert.ok(even > 30 && odd > 30, 'both odd and even lists turn up');
});

test('center/which-average: the marked option is the median, and the data is as lopsided as the feedback says', () => {
  for (const s of variants('center', 'which-average')) {
    const t = flat(s.text);
    const list = grab(/: \*\*([\d,· ]+)\*\*\. Which single number/, t)[1].split(' · ').map(plain);
    assert.equal(list.length, 7, t);
    const sorted = asc(list);
    const median = sorted[3];
    const mean = avg(list);
    const right = s.options.find((o) => o.correct);
    assert.equal(plain(right.text), median, t);
    assert.ok(Number.isInteger(mean), `mean ${mean} is quoted as a whole number: ${t}`);
    assert.equal(list.filter((v) => v < mean).length, 6, `"six of the seven values are below it": ${t}`);
    assert.ok(sorted[6] > 3 * sorted[5], `one value far from the rest: ${t}`);
    const others = s.options.filter((o) => !o.correct).map((o) => plain(o.text));
    assert.ok(others.includes(mean) && others.includes(sorted[6]), t);
    for (const v of others) assert.ok([mean, sorted[6], (sorted[0] + sorted[6]) / 2].includes(v), `unexplained distractor ${v}: ${t}`);
    // "typical": the median is closer to the values, in total, than any other option on offer
    const off = (c) => add(list.map((v) => Math.abs(v - c)));
    for (const v of others) assert.ok(off(median) < off(v), t);
    const e = flat(s.explain);
    assert.ok(e.includes(`the middle (4th) value is **${right.text}**`), e);
    assert.ok(e.includes(`The mean is ${mean.toLocaleString('en-US')}, pulled far up by the single value of ${sorted[6].toLocaleString('en-US')}`), e);
  }
});

test('center/outlier-effect: the new mean and median', () => {
  for (const s of variants('center', 'outlier-effect')) {
    const t = flat(s.text);
    const m = grab(/\*\*([\d, ]+)\*\*\. So the mean is (\d+) and the median is (\d+)\./, t);
    const before = m[1].split(', ').map(Number);
    assert.equal(before.length, 5);
    assert.equal(avg(before), Number(m[2]), t);
    assert.equal(mid(before), Number(m[3]), t);
    const jump = grab(/jumps from (\d+) to \*\*(\d+)\*\*/, t);
    assert.equal(Number(jump[1]), Math.max(...before), t);
    const after = before.map((v) => (v === Number(jump[1]) ? Number(jump[2]) : v));
    const word = (a, b) => (b > a ? 'goes up' : b < a ? 'goes down' : 'stays the same');
    assert.equal(s.blanks.length, 4);
    assert.equal(s.blanks[0].answer, word(avg(before), avg(after)), t);
    assert.deepEqual(s.blanks[1].numbers, [avg(after)], t);
    assert.equal(s.blanks[2].answer, word(mid(before), mid(after)), t);
    assert.deepEqual(s.blanks[3].numbers, [mid(after)], t);
    assert.ok(flat(s.explain).includes(`so the mean rises by $${add(after) - add(before)} \\div 5 = ${avg(after) - avg(before)}$, to ${avg(after)}.`), s.explain);
  }
});

test('center: the café, the balance point and the fixed worked examples', () => {
  const hook = resolveStep(rawStep('center', 'hook'), makeRng(1), 'hook');
  const cafe = (9 * 40000 + 1e9) / 10;
  assert.equal(Math.round(cafe / 1e6), 100);
  assert.match(hook.options.find((o) => o.correct).text, /100 million/);
  const balance = rawStep('center', 'balance');
  assert.equal(avg(balance.widget.values), 4);
  assert.equal(balance.solution.fulcrum, 4);
  const missing = rawStep('center', 'missing-weight');
  const fixed = missing.widget.values.slice(0, 4);
  assert.equal(5 * 5 - add(fixed), 7);
  assert.equal(missing.solution.values[4], 7);
  // drag-rich: the mean goes from 40 to 68, the median stays at 40
  const rich = rawStep('center', 'drag-rich');
  assert.deepEqual([avg(rich.widget.values), mid(rich.widget.values)], [40, 40]);
  assert.deepEqual([avg(rich.solution.values), mid(rich.solution.values)], [68, 40]);
  assert.match(rich.explain, /from 40 all the way up to 68/);
  // median-idea: the two lists in the text
  assert.equal(mid([20, 30, 40, 50, 200]), 40);
  assert.equal(mid([20, 30, 40, 50, 60, 200]), 45);
  assert.match(rawStep('center', 'median-idea').text, /Here the median is 45\./);
  // pull-apart: every arrangement with median 3 and mean 5 passes, nothing else does
  const pull = rawStep('center', 'pull-apart');
  const rng = makeRng(99);
  for (let k = 0; k < 3000; k++) {
    const values = Array.from({ length: 5 }, () => rng.int(0, 10));
    const ok = mid(values) === 3 && add(values) === 25;
    assert.equal(pull.check(dotState(values)) === true, ok, `pull-apart with ${values}`);
  }
});

/* ------------------------------------------------------------------ spread */

test('spread/range: largest minus smallest of the seven values', () => {
  for (const s of variants('spread', 'range')) {
    const t = flat(s.text);
    const list = grab(/: \*\*([\d, ]+)\*\*\. What is the range\?$/, t)[1].split(', ').map(Number);
    assert.equal(list.length, 7, t);
    const hi = Math.max(...list);
    const lo = Math.min(...list);
    assert.equal(s.answer, hi - lo, t);
    assert.ok(s.answer >= 5, t);
    assert.notEqual(Math.abs(list[6] - list[0]), hi - lo, `first and last value happen to be the extremes: ${t}`);
    assert.ok(s.explain.includes(`Largest: ${hi}. Smallest: ${lo}. Range: $${hi} - ${lo} = ${hi - lo}$.`), s.explain);
    assert.ok(s.hints[0].includes(`The largest value is ${hi}.`));
  }
});

test('spread/iqr-calc: quartiles as the medians of the values below and above the median', () => {
  for (const s of variants('spread', 'iqr-calc')) {
    const t = flat(s.text);
    const list = grab(/: \*\*([\d, ]+)\*\*\. Find the quartiles\./, t)[1].split(', ').map(Number);
    assert.equal(list.length, 7, t);
    assert.equal(new Set(list).size, 7, `repeated values would make "below the median" unclear: ${t}`);
    const median = mid(list);
    const q1 = mid(list.filter((v) => v < median));
    const q3 = mid(list.filter((v) => v > median));
    assert.ok(s.blanks.every((b) => b.kind === 'input' && b.numeric && b.numbers.length === 1));
    assert.deepEqual(s.blanks.map((b) => b.numbers[0]), [median, q1, q3, q3 - q1], t);
    const e = flat(s.explain);
    assert.ok(e.includes(`**Q1 = ${q1}**`) && e.includes(`**Q3 = ${q3}**`) && e.includes(`$= ${q3} - ${q1} = ${q3 - q1}$`), e);
    assert.ok(s.hints[0].includes(`Sort first: ${asc(list).join(', ')}.`));
  }
});

test('spread/consistent: the marked set is the tighter one by every measure of spread', () => {
  for (const s of variants('spread', 'consistent')) {
    const t = flat(s.text);
    const sets = [...t.matchAll(/- ([A-Z]\w+ [AB]): \*\*([\d, ]+)\*\*/g)].map((m) => ({ name: m[1], values: m[2].split(', ').map(Number) }));
    assert.equal(sets.length, 2, t);
    assert.ok(sets.every((x) => x.values.length === 5));
    assert.equal(avg(sets[0].values), avg(sets[1].values), `same mean: ${t}`);
    const tight = gap(sets[0].values) < gap(sets[1].values) ? 0 : 1;
    const [a, b] = [sets[tight].values, sets[1 - tight].values];
    const iqr = (v) => { const x = asc(v); return (x[3] + x[4]) / 2 - (x[0] + x[1]) / 2; };
    assert.ok(gap(a) < gap(b) && popSd(a) < popSd(b) && iqr(a) < iqr(b), t);
    const right = s.options.find((o) => o.correct).text;
    assert.equal(right, `${sets[tight].name}: its range is ${gap(a)}, against ${gap(b)}`);
    const centre = Number(grab(/both have a mean of (\d+)/, s.options[2].text)[1]);
    assert.equal(centre, avg(a));
    assert.ok(flat(s.explain).startsWith(`Both sets have a mean of ${avg(a)}. But ${sets[tight].name} stays within ${gap(a)} from lowest to highest, while ${sets[1 - tight].name} swings across ${gap(b)}.`), s.explain);
  }
});

test('spread: fixed steps and the interactive checks', () => {
  const flaw = rawStep('spread', 'range-flaw');
  const times = flaw.figure.values;
  assert.equal(gap(times), 15);
  assert.equal(flaw.answer, gap(asc(times).slice(0, -1)));
  // sd-recipe: the table in the text and the three blanks
  const recipe = resolveStep(rawStep('spread', 'sd-recipe'), makeRng(1), 'sd-recipe');
  const row = (label) => grab(new RegExp(`^\\s*\\| ${label} \\| ([\\d |]+?) \\|\\s*$`, 'm'), recipe.text)[1].split(' | ').map(Number);
  const values = row('Value');
  const mean = avg(values);
  assert.equal(mean, 5);
  assert.deepEqual(row('Distance from 5'), values.map((v) => Math.abs(v - mean)));
  assert.deepEqual(row('Squared'), values.map((v) => (v - mean) ** 2));
  const squares = add(values.map((v) => (v - mean) ** 2));
  assert.deepEqual(recipe.blanks.map((b) => b.numbers[0]), [squares, squares / values.length, Math.sqrt(squares / values.length)]);
  assert.ok(Math.sqrt(squares / (values.length - 1)) > 2, 'dividing by n − 1 gives "a slightly larger number"');
  // biggest-sd: same mean, same range, and the marked picture has the largest SD
  const biggest = rawStep('spread', 'biggest-sd');
  const sds = biggest.options.map((o) => popSd(o.figure.values));
  for (const o of biggest.options) assert.deepEqual([avg(o.figure.values), gap(o.figure.values)], [5, 10]);
  assert.equal(biggest.options.findIndex((o) => o.correct), sds.indexOf(Math.max(...sds)));
  assert.ok(biggest.options.find((o) => o.correct).figure.values.every((v) => [4, 5].includes(Math.abs(v - 5))));
  // same-mean, box-task and max-spread against brute force over random arrangements
  const same = rawStep('spread', 'same-mean');
  const box = rawStep('spread', 'box-task');
  const max = rawStep('spread', 'max-spread');
  const rng = makeRng(2024);
  let best = 0;
  for (let k = 0; k < 4000; k++) {
    const five = Array.from({ length: 5 }, () => rng.int(0, 10));
    assert.equal(same.check(dotState(five)) === true, avg(five) === 5 && gap(five) >= 6, `same-mean ${five}`);
    if (avg(five) === 5) best = Math.max(best, popSd(five));
    const verdict = max.check(dotState(five));
    assert.equal(verdict === true, avg(five) === 5 && asc(five).join() === '0,0,5,10,10', `max-spread ${five}`);
    if (/ends of the ruler yet/.test(verdict)) assert.ok(!(five.includes(0) && five.includes(10)), `max-spread ${five}: ${verdict}`);
    if (/nothing is at the very ends/.test(verdict)) assert.ok(!five.includes(0) && !five.includes(10), `max-spread ${five}: ${verdict}`);
    const seven = Array.from({ length: 7 }, () => rng.int(0, 10));
    const x = asc(seven);
    assert.equal(box.check(dotState(seven)) === true, x[6] - x[0] === 10 && x[5] - x[1] === 2, `box-task ${seven}`);
  }
  assert.ok(best <= Math.sqrt(20) + 1e-9);
  assert.ok(near(popSd(max.solution.values), 4.47, 0.005));
});

/* ----------------------------------------------------------- distributions */

test('distributions/mean-vs-median: the answer follows from the pictured data', () => {
  const seen = new Set();
  for (const s of variants('distributions', 'mean-vs-median')) {
    const data = s.figures[0].data;
    const drawn = data.filter((v) => v >= s.figures[0].min && v <= s.figures[0].max);
    assert.ok(drawn.length >= data.length - 1, 'the picture shows (nearly) all the data');
    const pull = (avg(data) - mid(data)) / popSd(data);
    const expected = pull > 0.1 ? 'The mean is larger than the median' : pull < -0.1 ? 'The mean is smaller than the median' : 'They are about the same';
    assert.equal(s.options.find((o) => o.correct).text, expected);
    const skew = skewness(data);
    if (/tail to the right/.test(s.figures[0].alt)) assert.ok(skew > 1);
    else if (/tail to the left/.test(s.figures[0].alt)) assert.ok(skew < -1);
    else assert.ok(Math.abs(skew) < 0.2 && Math.abs(pull) < 0.02);
    const size = Number(grab(/of (\d+) (?:people|students|adult women)/, s.text)[1]);
    assert.equal(size, data.length);
    const quoted = /mean is about (\d+(?:\.\d+)?) and the median about (\d+(?:\.\d+)?)/.exec(s.explain);
    if (quoted) {
      assert.ok(near(Number(quoted[1]), avg(data), 0.5) && near(Number(quoted[2]), mid(data), 0.5), s.explain);
    } else {
      const both = Number(grab(/both are about (\d+) cm/, s.explain)[1]);
      assert.ok(near(both, avg(data), 0.5) && near(both, mid(data), 0.5), s.explain);
    }
    seen.add(expected);
  }
  assert.equal(seen.size, 3);
});

test('distributions/rule-apply: one and two standard deviations either side of the mean', () => {
  for (const s of variants('distributions', 'rule-apply')) {
    const t = flat(s.text);
    const m = grab(/\*\*mean of (\d+)\*\* (\w+) and a \*\*standard deviation of (\d+)\*\* (\w+)\./, t);
    const mean = Number(m[1]);
    const sd = Number(m[3]);
    assert.equal(m[2], m[4]);
    assert.match(t, /bell-shaped/);
    assert.deepEqual(s.blanks.map((b) => b.numbers[0]), [mean - sd, mean + sd, mean - 2 * sd, mean + 2 * sd], t);
    assert.ok(mean - 3 * sd > 0, `a bell this wide would reach below zero: ${t}`);
    assert.ok(s.template.includes(`${m[2]}.`));
  }
});

test('distributions/tail: the one-tail share from the 68–95–99.7 rule', () => {
  const seen = new Set();
  for (const s of variants('distributions', 'tail')) {
    const t = flat(s.text);
    const m = grab(/bell-shaped, with a mean of (\d+) (\S+) and a standard deviation of (\d+) (\S+)\./, t);
    const q = grab(/about what percentage are (above|below) (\d+) (\S+)\?\*\*/, t);
    assert.ok(m[2] === m[4] && m[2] === q[3], t);
    const z = (Number(q[2]) - Number(m[1])) / Number(m[3]);
    assert.ok([1, 2].includes(Math.abs(z)), t);
    assert.equal(q[1], z > 0 ? 'above' : 'below', `the question asks for the small tail: ${t}`);
    const inside = { 1: 68, 2: 95 }[Math.abs(z)];
    assert.equal(s.answer, (100 - inside) / 2, t);
    assert.ok(Math.abs(s.answer - upperTail(Math.abs(z))) < 0.25, 'the rule of thumb is close to the exact normal tail');
    assert.equal(s.unit, '%');
    assert.ok(s.tolerance > 0 && s.tolerance <= 0.25);
    assert.deepEqual(s.wrong.map((w) => w[0]), [100 - inside, inside, 100 - (100 - inside) / 2]);
    assert.ok(flat(s.explain).includes(`$${100 - inside} \\div 2 = ${s.answer}$%`), s.explain);
    seen.add(`${q[1]}${Math.abs(z)}`);
  }
  assert.equal(seen.size, 4);
});

test('distributions: fixed steps, pictures and interactive checks', () => {
  // hook: both charts are drawn from the same 160 answers
  const hook = rawStep('distributions', 'hook');
  assert.equal(hook.figure[0].data, hook.figure[1].data);
  assert.equal(hook.figure[0].data.length, 160);
  assert.deepEqual([hook.figure[0].width, hook.figure[1].width], [15, 3]);
  const counts = (data, lo, hi, w) => { const c = new Array(Math.round((hi - lo) / w)).fill(0); for (const v of data) c[Math.min(c.length - 1, Math.floor((v - lo) / w))]++; return c; };
  assert.deepEqual(counts(JOURNEYS, 0, 45, 15), [50, 68, 42]);
  assert.match(hook.figure[0].alt, /50, 68 and 42/);
  // explore-bins: only the widths that show two humps pass
  const bins = rawStep('distributions', 'explore-bins');
  const humps = (c) => c.filter((v, i) => v > 0 && v >= (c[i - 1] || 0) && v > (c[i + 1] || 0) && v >= 15).length;
  for (const width of bins.widget.widths) {
    const verdict = bins.check({ width });
    assert.equal(verdict === true, width === 3 || width === 5, `width ${width}`);
    if (verdict === true) assert.equal(humps(counts(JOURNEYS, 0, 45, width)), 2, `two humps at width ${width}`);
    else assert.equal(typeof verdict, 'string');
  }
  assert.equal(humps(counts(JOURNEYS, 0, 45, 15)), 1);
  assert.equal(bins.check(bins.solution), true);
  assert.equal(Math.round(avg(JOURNEYS)), 22);
  assert.equal(JOURNEYS.filter((v) => v > 21 && v < 23).length, 5);
  assert.ok(near(avg(JOURNEYS.slice(0, 80)), 14, 0.5) && near(avg(JOURNEYS.slice(80)), 30, 0.5));
  // skew-right: the marked picture is the only one with a long right tail
  const skew = rawStep('distributions', 'skew-right');
  const tails = skew.options.map((o) => skewness(o.figure.data));
  skew.options.forEach((o, i) => assert.equal(!!o.correct, tails[i] > 1, `option ${i}: skewness ${tails[i]}`));
  assert.ok(tails.some((v) => v < -1) && tails.some((v) => Math.abs(v) < 0.2));
  // find-median: a marker passes only within half a unit of the true median
  const find = rawStep('distributions', 'find-median');
  const median = mid(INCOMES);
  assert.equal(median, 36.5);
  assert.equal(Math.round(avg(INCOMES)), 41);
  for (let g = 0; g <= 160; g += 0.5) {
    const below = (100 * (INCOMES.filter((v) => v < g).length + INCOMES.filter((v) => v === g).length / 2)) / INCOMES.length;
    const verdict = find.check({ guess: g, below });
    if (verdict === true) assert.ok(Math.abs(g - median) <= 0.5, `marker ${g} accepted`);
    else assert.match(verdict, g < median ? /Move it right/ : /move it left/);
    if (Math.round(below) === 50) assert.equal(verdict, true, `the readout says 50% at ${g}`);
  }
  assert.equal(find.solution.guess, median);
  // bell: 1, 2 and 3 SDs hold about 68, 95 and 99.7 percent of the 400 heights
  const bell = rawStep('distributions', 'bell');
  const mean = avg(HEIGHTS);
  const sd = popSd(HEIGHTS);
  const inside = (k) => (100 * HEIGHTS.filter((v) => Math.abs(v - mean) <= k * sd).length) / HEIGHTS.length;
  assert.equal(bell.check({ band: 2, inside: inside(2) }), true);
  assert.match(bell.check({ band: 1, inside: inside(1) }), /only about 67%/);
  assert.match(bell.check({ band: 3, inside: inside(3) }), /99\.8%/);
  assert.ok(near(inside(1), 68, 2) && near(inside(2), 95, 1) && near(inside(3), 99.7, 0.3));
  // the worked example (now on the teaching screen that follows "bell"): its own rounded numbers must give the limits it states
  const rule = rawStep('distributions', 'teach-rule');
  const worked = grab(/mean is about ([\d.]+) cm and the SD about ([\d.]+) cm, so roughly 95% of these women are between (\d+) and (\d+) cm/, rule.text).slice(1).map(Number);
  assert.ok(near(worked[0], mean, 0.05) && near(worked[1], sd, 0.05), rule.text);
  assert.ok(rule.text.includes(`$${worked[0]} - 2 \\times ${worked[1]}$ and $${worked[0]} + 2 \\times ${worked[1]}$`), rule.text);
  for (const share of ['68%', '95%', '99.7%']) assert.ok(rule.text.includes(`**${share}**`), `teach-rule states ${share}`);
  assert.deepEqual([Math.round(worked[0] - 2 * worked[1]), Math.round(worked[0] + 2 * worked[1])], [worked[2], worked[3]], '165 + 2 × 7 is 179, not 180');
  assert.deepEqual([Math.round(mean - 2 * sd), Math.round(mean + 2 * sd)], [worked[2], worked[3]]);
  // not-normal: the quoted mean, SD and limits, and what the data really does
  const not = rawStep('distributions', 'not-normal');
  const im = Math.round(avg(INCOMES));
  const isd = Math.round(popSd(INCOMES));
  assert.match(not.text, new RegExp(`mean of ${im} and a standard deviation of ${isd} `));
  assert.match(not.text, new RegExp(`between ${im} − ${2 * isd} and ${im} \\+ ${2 * isd}, so between −${2 * isd - im} and ${im + 2 * isd} thousand`));
  assert.equal(INCOMES.filter((v) => v < im - 2 * isd).length, 0);
  assert.equal(Math.round((100 * INCOMES.filter((v) => v > im + 2 * isd).length) / INCOMES.length), 5);
  assert.equal(Math.round(Math.min(...INCOMES)), 10);
});

/* ------------------------------------------------------------- correlation */

test('correlation/estimate-r: the quoted r is the correlation of the pictured points', () => {
  const targets = new Set();
  for (const s of variants('correlation', 'estimate-r')) {
    const pts = s.figures[0].points;
    assert.equal(pts.length, 36);
    assert.ok(pts.every((p) => p.every((v) => v >= 0 && v <= 10)));
    const { r } = pearson(pts);
    assert.ok(Math.abs(r - s.answer) <= 0.015, `asked for ${s.answer}, drew ${r}`);
    const quoted = Number(grab(/Here \$r = (-?[\d.]+)\$/, s.explain)[1]);
    assert.ok(Math.abs(quoted - r) <= 0.005 + 1e-9, `explain quotes ${quoted}, the points have ${r}`);
    assert.deepEqual([s.min, s.max, s.step, s.tolerance], [-1, 1, 0.1, 0.2]);
    assert.ok(Math.abs(s.answer * 10 - Math.round(s.answer * 10)) < 1e-9, 'the answer can be set on the slider');
    assert.equal(/positive because the cloud climbs/.test(s.explain), r > 0.2);
    assert.equal(/negative because the cloud falls/.test(s.explain), r < -0.2);
    assert.equal(/strong association/.test(s.explain), Math.abs(r) > 0.85);
    assert.equal(/no association/.test(s.explain), Math.abs(r) < 0.1);
    targets.add(s.answer);
  }
  assert.equal(targets.size, 7);
});

test('correlation/scenario: the marked explanation fits the finding', () => {
  const expected = [
    [/umbrellas/, /^Rain does both/],
    [/bakeries/, /^Bigger towns have more of everything/],
    [/private tutor/, /^Struggling students/],
    [/in hospital last week/, /^Being seriously ill/],
    [/fitness tracker/, /^People who already like exercise/],
    [/many books/, /^Homes with many books differ in other ways/],
  ];
  const seen = new Set();
  for (const s of variants('correlation', 'scenario')) {
    const k = expected.findIndex(([finding]) => finding.test(s.text));
    assert.ok(k >= 0, s.text);
    assert.match(s.options.find((o) => o.correct).text, expected[k][1]);
    assert.equal(s.options.length, 3);
    assert.ok(s.options.filter((o) => !o.correct).every((o) => o.why));
    assert.match(s.explain, /third factor|the other way/);
    seen.add(k);
  }
  assert.equal(seen.size, expected.length);
});

test('correlation: the kiosk data, the pictures and the interactive checks', () => {
  const fit = pearson(ICE);
  // hook: the trend at 30 °C is inside the accepted band, and "about 10 ice creams per degree"
  const hook = rawStep('correlation', 'hook');
  assert.ok(Math.abs(fit.intercept + 30 * fit.slope - hook.answer) < 5);
  assert.ok(hook.tolerance >= 20);
  assert.equal(Math.round(fit.slope), 10);
  // direction: only the marked picture falls
  const direction = rawStep('correlation', 'direction');
  const rs = direction.options.map((o) => pearson(o.figure.points).r);
  direction.options.forEach((o, i) => assert.equal(!!o.correct, rs[i] < -0.5, `picture ${i}: r = ${rs[i]}`));
  assert.ok(rs.some((v) => v > 0.8) && rs.some((v) => Math.abs(v) < 0.05));
  // fit-line: for every position of the two handles the verdict is right and the feedback is true
  const line = rawStep('correlation', 'fit-line');
  const [x0, x1] = line.widget.x;
  const xa = x0 + (x1 - x0) * 0.06;
  const xb = x1 - (x1 - x0) * 0.06;
  const lineState = (left, right) => {
    const slope = (right - left) / (xb - xa);
    const intercept = left - slope * xa;
    const mse = avg(ICE.map(([x, y]) => (y - intercept - slope * x) ** 2));
    return {
      line: { left, right, slope, intercept, excess: mse / fit.mse - 1, tilt: slope - fit.slope, offset: intercept + slope * fit.mx - fit.my },
      above: ICE.filter(([x, y]) => y > intercept + slope * x).length,
      below: ICE.filter(([x, y]) => y < intercept + slope * x).length,
    };
  };
  let passing = 0;
  for (let left = 0; left <= 300; left += 5) {
    for (let right = 0; right <= 300; right += 5) {
      const st = lineState(left, right);
      const verdict = line.check(st);
      const where = `handles at ${left} and ${right}`;
      if (verdict === true) { passing++; assert.ok(st.line.excess <= 0.5, where); continue; }
      if (/too steep/.test(verdict)) assert.ok(st.line.tilt > 0, where);
      else if (/too flat/.test(verdict)) assert.ok(st.line.tilt < 0, where);
      else if (/too high: most dots are below/.test(verdict)) assert.ok(st.line.offset > 0 && st.below > st.above, `${where}: ${st.below} below, ${st.above} above`);
      else if (/too low: most dots are above/.test(verdict)) assert.ok(st.line.offset < 0 && st.above > st.below, `${where}: ${st.below} below, ${st.above} above`);
      else assert.fail(`${where}: unexpected feedback ${verdict}`);
    }
  }
  assert.ok(passing >= 40 && passing <= 80, `${passing} handle positions pass`);
  assert.equal(line.check(lineState(line.solution.line.left, line.solution.line.right)), true);
  assert.notEqual(line.check(lineState(line.widget.line.left, line.widget.line.right)), true);
  // outlier: r is 0.99 at the start, and a position passes exactly when r is below zero
  const outlier = rawStep('correlation', 'outlier');
  const six = outlier.widget.points.slice(0, 6);
  assert.equal(Math.round(pearson(outlier.widget.points).r * 100), 99);
  assert.match(outlier.text, /\$r = 0\.99\$/);
  let negative = 0;
  for (let x = 0; x <= 10; x += 0.5) {
    for (let y = 0; y <= 10; y += 0.5) {
      const r = Math.round(pearson([...six, [x, y]]).r * 1e4) / 1e4 || 0;
      const verdict = outlier.check({ r });
      assert.equal(verdict === true, r < 0, `orange point at (${x}, ${y}): r = ${r}`);
      if (verdict !== true) assert.ok(!/positive/.test(verdict) || r > 0, `(${x}, ${y}): r = ${r} is called positive`);
      if (r < 0) negative++;
    }
  }
  assert.ok(negative >= 20, 'enough positions make r negative');
  assert.ok(pearson(outlier.solution.points).r < -0.3);
  // r-truths: a perfect U really has r = 0, and −0.8 is the stronger of the two
  assert.ok(Math.abs(pearson([-3, -2, -1, 0, 1, 2, 3].map((x) => [x, x * x])).r) < 1e-12);
  assert.deepEqual(rawStep('correlation', 'r-truths').options.map((o) => !!o.correct), [true, true, true, false, false]);
});

/* ---------------------------------------------------------------- sampling */

test('sampling/margin-calc: k times smaller needs k² times the sample, and the quoted margins fit the sample sizes', () => {
  const words = { half: 2, 'a third': 3, 'a quarter': 4, 'a fifth': 5, 'a tenth': 10 };
  for (const s of variants('sampling', 'margin-calc')) {
    const t = flat(s.text);
    const n = plain(grab(/A poll of \*\*([\d,]+)\*\* randomly chosen people/, t)[1]);
    const m = Number(grab(/margin of error of about ±([\d.]+) points/, t)[1]);
    const cut = grab(/cut that to (half|a third|a quarter|a fifth|a tenth)\*\* \(about ±([\d.]+) (points?)\)/, t);
    const k = words[cut[1]];
    assert.equal(cut[3], Number(cut[2]) === 1 ? 'point' : 'points', t);
    assert.equal(Number(grab(/to make it (\d+) times smaller, you need (\d+) × (\d+) times/, t)[1]), k, t);
    assert.ok(Math.abs(m - pollMargin(n)) < 0.25, `±${m} for ${n} people (formula: ${pollMargin(n).toFixed(2)})`);
    assert.ok(Math.abs(Number(cut[2]) - m / k) <= 0.05 + 1e-9, t);
    assert.equal(s.answer, n * k * k, t);
    assert.ok(Math.abs(pollMargin(s.answer) - pollMargin(n) / k) < 1e-9, 'the new sample really has a margin k times smaller');
    assert.ok(pollMargin(s.answer - n) > pollMargin(n) / k, 'and nothing smaller would do');
    assert.deepEqual(s.wrong.map((w) => w[0]), [n * k, n * k * k * k]);
    assert.equal(typeof s.feedback(n), 'string');
    assert.ok(s.explain.includes(`$${n} \\times ${k * k} = ${n * k * k}$`), s.explain);
  }
});

test('sampling/which-poll: the random sample wins, and its quoted margin is right', () => {
  for (const s of variants('sampling', 'which-poll')) {
    const t = flat(s.text);
    const big = plain(grab(/\*\*Poll A:\*\* ([\d,]+) answers from/, t)[1]);
    const n = plain(grab(/\*\*Poll B:\*\* ([\d,]+) \w+ picked at random from/, t)[1]);
    assert.ok(big >= 3 * n, t);
    assert.match(s.options.find((o) => o.correct).text, /^Poll B: random choice/);
    assert.equal(s.options.length, 4);
    const quoted = Number(grab(/about ±([\d.]+) points for ([\d,]+) people/, s.explain)[1]);
    assert.ok(Math.abs(quoted - pollMargin(n)) < 0.25, `±${quoted} for ${n}`);
    assert.ok(s.options[2].why.includes(`sample of ${n.toLocaleString('en-US')} has a margin of error of only about ±${quoted} points`));
  }
});

test('sampling/too-close: the verdict follows from the lead and the margin of error', () => {
  const seen = new Set();
  for (const s of variants('sampling', 'too-close')) {
    const t = flat(s.text);
    const n = plain(grab(/A poll of ([\d,]+) randomly chosen voters/, t)[1]);
    const shares = grab(/finds \*\*([\d.]+)% for (.+?)\*\* and \*\*([\d.]+)% for (.+?)\*\*\./, t);
    const a = Number(shares[1]);
    const b = Number(shares[3]);
    const m = Number(grab(/margin of error is about ±([\d.]+) points/, t)[1]);
    assert.equal(a + b, 100, t);
    assert.ok(a > b, t);
    assert.ok(Math.abs(m - pollMargin(n)) < 0.25, `±${m} for ${n}`);
    const lead = a - b;
    const overlap = a - m <= b + m;
    assert.ok(lead <= m || lead >= 3 * m, `a lead of ${lead} with ±${m} is a grey zone`);
    assert.equal(overlap, lead <= m);
    assert.match(s.options.find((o) => o.correct).text, overlap ? /^No: the lead is within the margin of error/ : /^Yes: the lead is clearly bigger/);
    const e = flat(s.explain);
    assert.ok(e.includes(`The lead is ${lead} points`), e);
    assert.ok(e.includes(`${shares[2]} is somewhere between about ${a - m}% and ${a + m}%, and ${shares[4]} between about ${b - m}% and ${b + m}%`), e);
    assert.equal(/The ranges overlap/.test(e), overlap);
    assert.equal(/far apart/.test(e), !overlap);
    seen.add(overlap);
  }
  assert.equal(seen.size, 2);
});

test('sampling: the margin table, the pot and the fixed claims', () => {
  // hook: about 1,000 people for about ±3 points; one voter in 50,000
  assert.equal(Math.round(pollMargin(1000)), 3);
  assert.equal(50e6 / 1000, 50000);
  assert.match(rawStep('sampling', 'hook').explain, /one voter in every 50,000/);
  // the table in "margin"
  const rows = [...rawStep('sampling', 'margin').text.matchAll(/\| ([\d,]+) \| ± (\d+) points? \|/g)].map((m) => [plain(m[1]), Number(m[2])]);
  assert.equal(rows.length, 4);
  for (const [n, m] of rows) assert.equal(Math.round(pollMargin(n)), m, `±${m} for ${n} people`);
  // the bands drawn in "halving": 95% ranges for 10, 40 and 160 beads out of a pot of 1,000 with 60% teal
  const halving = rawStep('sampling', 'halving');
  // two standard errors either side, with the correction for drawing without replacement from 1,000 beads
  const band = (n) => 200 * Math.sqrt((0.6 * 0.4) / n) * Math.sqrt((1000 - n) / 999);
  assert.deepEqual(halving.figure.rows.map((row) => Math.round(band(row.n))), [31, 15, 7]);
  assert.match(halving.text, /within 31 points of the truth for samples of 10/);
  assert.ok(halving.figure.rows.every((row, i, all) => i === 0 || row.n === 4 * all[i - 1].n));
  assert.match(halving.options.find((o) => o.correct).text, /roughly halves/);
  // exact chance that a sample lands inside its band (hypergeometric): "about 95%"
  const lnFact = [0];
  for (let i = 1; i <= 1000; i++) lnFact.push(lnFact[i - 1] + Math.log(i));
  const choose = (n, k) => lnFact[n] - lnFact[k] - lnFact[n - k];
  for (const n of [10, 40, 160]) {
    let insideBand = 0;
    for (let k = 0; k <= n; k++) if (Math.abs((100 * k) / n - 60) <= band(n)) insideBand += Math.exp(choose(600, k) + choose(400, n - k) - choose(1000, n));
    assert.ok(insideBand > 0.94 && insideBand < 0.99, `n = ${n}: ${insideBand}`);
  }
  // the three drawing tasks count samples as the instructions say
  const ten = rawStep('sampling', 'ten-beads');
  assert.equal(typeof ten.check({ counts: [7] }), 'string');
  assert.equal(ten.check({ counts: [8] }), true);
  const spoons = rawStep('sampling', 'bigger-spoons');
  assert.deepEqual(spoons.widget.start, [10, 0, 0]);
  assert.match(spoons.check({ counts: [10, 14, 30] }), /samples of 40/);
  assert.match(spoons.check({ counts: [10, 15, 14] }), /n = 160/);
  assert.equal(spoons.check({ counts: [10, 15, 15] }), true);
  const unstirred = rawStep('sampling', 'unstirred');
  assert.equal(typeof unstirred.check({ counts: [9, 30] }), 'string');
  assert.equal(typeof unstirred.check({ counts: [30, 9] }), 'string');
  assert.equal(unstirred.check({ counts: [10, 10] }), true);
  // the top-100 spoon reaches the top four of twenty layers, which hold 90% teal
  const top = layers(0.6).slice(0, 4).reduce((t, v) => t + v, 0);
  assert.equal((100 * top) / 200, 90);
  assert.match(unstirred.explain, /about 90% teal/);
  // 1936: the figures in the Literary Digest step
  const digest = rawStep('sampling', 'digest');
  assert.match(digest.text, /In 1936/);
  assert.match(digest.text, /2\.4 million/);
  assert.match(digest.text, /50,000/);
  assert.match(digest.explain, /46 of the 48 states/);
  assert.match(digest.options.find((o) => o.correct).text, /Gallup/);
  assert.deepEqual(rawStep('sampling', 'truths').options.map((o) => !!o.correct), [true, true, true, false, false]);
});

/* --------------------------------------------------------- misleading data */

test('misleading-data/drawn-ratio: drawn heights are measured from the start of the axis', () => {
  for (const s of variants('misleading-data', 'drawn-ratio')) {
    const t = flat(s.text);
    const base = Number(grab(/The axis of the bar chart starts at \*\*(\d+)\*\*, not at 0\./, t)[1]);
    const bars = grab(/How many times as tall as the "(.+?)" bar is the "(.+?)" bar drawn\?/, t);
    const fig = s.figures[0];
    assert.equal(fig.base, base);
    assert.ok(fig.locked);
    const value = (label) => fig.data.find((d) => d.label === label).value;
    const short = value(bars[1]);
    const tall = value(bars[2]);
    assert.ok(short > base && tall > short && fig.top >= tall, t);
    assert.equal(s.answer, (tall - base) / (short - base), t);
    assert.ok(Number.isInteger(s.answer) && s.answer >= 2);
    assert.ok(fig.alt.includes(`starting at ${base}. ${bars[1]}: ${short}. ${bars[2]}: ${tall}.`), fig.alt);
    const pct = Number(grab(/differ by only about (\d+)%/, s.explain)[1]);
    assert.ok(Math.abs(pct - (tall / short - 1) * 100) <= 0.5 + 1e-9, s.explain);
    assert.ok(flat(s.explain).includes(`$${short} - ${base} = ${short - base}$ and $${tall} - ${base} = ${tall - base}$`), s.explain);
    assert.equal(s.feedback(tall / short) !== null, true, 'comparing the values themselves gets a pointer');
  }
});

test('misleading-data/extra-cases: the absolute change behind a relative headline', () => {
  const seen = new Set();
  for (const s of variants('misleading-data', 'extra-cases')) {
    const t = flat(s.text);
    const headline = grab(/headline: \*\*"(.+?)"\*\*/, t)[1];
    const factor = /\bdoubles? the risk\b/.test(headline) ? 2 : /\btriples? the risk\b/.test(headline) ? 3 : /\braises? the risk .* by 50%/.test(headline) ? 1.5 : null;
    assert.ok(factor, headline);
    const several = /^(Night shifts|Daily energy drinks) /.test(headline);
    assert.equal(/ (doubles|triples|raises) /.test(headline), !several, `verb agreement: ${headline}`);
    const small = grab(/normally affects (\d+) in every ([\d,]+) people\./, t);
    const base = Number(small[1]);
    const size = plain(small[2]);
    assert.equal(plain(grab(/Among ([\d,]+) people who/, t)[1]), size, t);
    const now = base * factor;
    assert.ok(Number.isInteger(now), t);
    assert.equal(s.answer, now - base, t);
    assert.ok(s.answer >= 1 && s.answer <= size / 100, `still a rare condition: ${t}`);
    const e = flat(s.explain);
    assert.ok(e.includes(`The risk goes from ${base} to ${now} in every ${small[2]}: **${now - base} extra ${now - base === 1 ? 'case' : 'cases'}**.`), e);
    assert.ok(e.includes(`"${Math.round((factor - 1) * 100)}% more" is the relative change.`), e);
    seen.add(factor);
  }
  assert.equal(seen.size, 3);
});

test('misleading-data: fixed steps recomputed from what the learner is shown', () => {
  // hook and stretch-axis: 96 against 98
  const hook = rawStep('misleading-data', 'hook');
  const [rival, wave] = hook.figure.data.map((d) => d.value);
  assert.equal((wave - hook.figure.base) / (rival - hook.figure.base), 3);
  assert.equal(Math.round((wave / rival - 1) * 100), 2);
  assert.match(hook.options.find((o) => o.correct).text, /2% larger/);
  const axis = rawStep('misleading-data', 'stretch-axis');
  for (let base = 0; base <= axis.widget.maxBase; base++) {
    const looks = Math.round(((wave - base) / (rival - base)) * 1e4) / 1e4;
    assert.equal(axis.check({ base, looks }) === true, base === 94, `axis starting at ${base}`);
  }
  assert.equal(axis.solution.base, 94);
  assert.equal((98 - 95.5) / (96 - 95.5), 5);
  // fair-headline
  const town = rawStep('misleading-data', 'fair-headline').figure.values;
  assert.equal(Math.round((1 - town[24] / town[0]) * 100), 45);
  assert.equal(Math.max(...town), town[0]);
  assert.ok(town[20] === Math.min(...town) && town[20] < town[0] / 2);
  // pill: 1 in 7,000 to 2 in 7,000
  assert.equal(Math.round((2 / 7000) * 10000) / 100, 0.03);
  assert.match(rawStep('misleading-data', 'pill').options.find((o) => o.correct).text, /1 extra case for every 7,000/);
  // dual-axes: read both lines off the drawing itself
  const dual = rawStep('misleading-data', 'dual-axes');
  const svg = dual.figure.content;
  const scale = (colour) => {
    const marks = [...svg.matchAll(new RegExp(`<text class="text-${colour}" x="\\d+" y="([\\d.]+)">(\\d+)</text>`, 'g'))].map((m) => [Number(m[1]), Number(m[2])]);
    assert.equal(marks.length, 5);
    const perPx = (marks[4][1] - marks[0][1]) / (marks[0][0] - marks[4][0]);
    for (const [y, v] of marks) assert.ok(Math.abs(marks[0][1] + (marks[0][0] - y) * perPx - v) < 1e-9, 'evenly spaced axis labels');
    return (y) => marks[0][1] + (marks[0][0] - 4 - y) * perPx;           // labels sit 4 px below their grid line
  };
  const ends = (colour) => {
    const d = grab(new RegExp(`<path class="stroke-${colour} fill-none"[^>]* d="M[\\d.]+ ([\\d.]+) .* L[\\d.]+ ([\\d.]+)"/>`), svg);
    return [Number(d[1]), Number(d[2])];
  };
  const revenue = ends('blue').map(scale('blue'));
  const staff = ends('orange').map(scale('orange'));
  assert.deepEqual(revenue, [20, 80]);
  assert.deepEqual(staff, [1000, 1010]);
  assert.equal(dual.answer, ((staff[1] - staff[0]) / staff[0]) * 100);
  assert.deepEqual(dual.wrong.map((w) => w[0]), [((revenue[1] - revenue[0]) / revenue[0]) * 100, staff[1] - staff[0], revenue[1] / revenue[0]]);
  // simpson: the table in the text
  const simpson = rawStep('misleading-data', 'simpson');
  const cells = Object.fromEntries([...simpson.text.matchAll(/\| \**([A-Za-z ]+?)\** \| \**(\d+) of (\d+)\** \| \**(\d+) of (\d+)\** \|/g)].map((m) => [m[1], m.slice(2).map(Number)]));
  const [mild, severe, all] = [cells['Mild cases'], cells['Severe cases'], cells['All patients']];
  assert.ok(mild && severe && all);
  assert.deepEqual(all, [mild[0] + severe[0], mild[1] + severe[1], mild[2] + severe[2], mild[3] + severe[3]]);
  assert.ok(mild[0] / mild[1] > mild[2] / mild[3] && severe[0] / severe[1] > severe[2] / severe[3], 'Hospital A is better in each group');
  assert.ok(all[0] / all[1] < all[2] / all[3], 'Hospital B is better overall');
  assert.deepEqual([mild[0] / mild[1], mild[2] / mild[3], severe[0] / severe[1], severe[2] / severe[3]].map((v) => Math.round(v * 100)), [95, 90, 50, 40]);
  assert.match(simpson.text, /80% of its patients recovered, against 59% at Hospital A/);
  assert.match(simpson.options.find((o) => o.correct).text, /^Hospital A, whether/);
  assert.equal(rawStep('misleading-data', 'checklist').text.match(/^\s*\d\. \*\*/gm).length, 6);
});

/* ===========================================================================
 * Teach before you ask.
 *
 * Every lesson shows a thing before it asks for it. These tests pin the shape
 * of each lesson, the teaching screens added for that purpose, what each one
 * must say for the step it serves, and the numbers in their worked examples.
 * ======================================================================== */

/** The teaching screens added when the course was revised to teach first. */
const TEACHING = {
  center: ['teach-total', 'teach-typical'],
  spread: ['teach-range', 'example-sd'],
  distributions: ['teach-shapes', 'teach-tail', 'teach-rule', 'example-tail'],
  correlation: ['teach-scatter', 'teach-direction', 'teach-r-limits', 'teach-experiment'],
  sampling: ['teach-sample', 'example-margin', 'teach-bias', 'example-lead'],
  'misleading-data': ['teach-bars', 'teach-cherry', 'teach-relative'],
};

/** [lesson, teaching screen, the step it serves, what the screen must say for that step] */
const SERVES = [
  ['center', 'mean-idea', 'mean-calc', ['**mean**', 'divide by how many there are']],
  ['center', 'teach-total', 'missing-weight', ['total = mean × count']],
  ['center', 'median-idea', 'median-calc', ['**median**', 'Sort first', 'halfway between them']],
  ['center', 'teach-typical', 'which-average', ['**outlier**', 'the median describes a typical value better']],
  ['center', 'teach-typical', 'outlier-effect', ['so the mean rises by', 'the median is still']],
  ['spread', 'teach-range', 'range', ['**range**', 'the largest value minus the smallest']],
  ['spread', 'teach-range', 'consistent', ['**consistent**']],
  ['spread', 'iqr-idea', 'iqr-calc', ['**lower quartile, Q1**', '**upper quartile, Q3**', 'IQR = Q3 − Q1']],
  ['spread', 'iqr-idea', 'box-task', ['**box plot**', 'whiskers']],
  ['spread', 'sd-idea', 'biggest-sd', ['**standard deviation (SD)**', 'from the mean']],
  ['spread', 'example-sd', 'sd-recipe', ['**Square**', '**Average**', '**square root**']],
  ['distributions', 'name-it', 'bins-review', ['**bins**', 'bin width']],
  ['distributions', 'teach-shapes', 'skew-right', ['**Skewed:**', 'named after the side the *tail* is on']],
  ['distributions', 'teach-shapes', 'shapes-match', ['**Symmetric:**', '**Two peaks**', 'against a maximum', 'a floor near zero and no ceiling']],
  ['distributions', 'teach-tail', 'mean-vs-median', ['The mean is dragged towards the tail', 'Tail on the right: mean above the median', 'Tail on the left: mean below it', 'No tail: the two are about the same']],
  ['distributions', 'teach-rule', 'rule-apply', ['**68%**', 'within 1 SD', '**95%**', 'within 2 SDs']],
  ['distributions', 'teach-rule', 'not-normal', ['bell-shaped']],
  ['distributions', 'example-tail', 'tail', ['split equally between the two tails', 'symmetric']],
  ['correlation', 'teach-scatter', 'fit-line', ['**scatter plot**', 'one dot per case']],
  ['correlation', 'teach-direction', 'direction', ['**line of best fit**', '**positive association**', '**negative association**']],
  ['correlation', 'r-explore', 'estimate-r', ['**correlation coefficient**', 'The sign tells you the direction', 'The size tells you the strength']],
  ['correlation', 'teach-r-limits', 'r-truths', ['**One unusual point**', 'It only sees straight lines', 'perfect U']],
  ['correlation', 'r-explore', 'ice-cream', ['**correlation coefficient**']],
  ['correlation', 'traps', 'sort-traps', ['**A third factor**', '**The arrow points the other way.**', '**Coincidence.**']],
  ['correlation', 'traps', 'scenario', ['**A third factor**', '**The arrow points the other way.**']],
  ['correlation', 'teach-experiment', 'experiment', ['**by chance**', '**randomised experiment**']],
  ['sampling', 'teach-sample', 'halving', ['**population**', '**sample**', '**random sample**']],
  ['sampling', 'margin', 'cauldron', ['**margin of error**', 'hardly at all on how many people there are altogether']],
  ['sampling', 'example-margin', 'margin-calc', ['**k times smaller**', '**k × k times**']],
  ['sampling', 'teach-bias', 'fair-or-biased', ['**biased**', 'People choose themselves']],
  ['sampling', 'teach-bias', 'which-poll', ['*self-selected*', 'It does nothing about **bias**']],
  ['sampling', 'example-lead', 'too-close', ['The ranges overlap', 'far apart', 'clearly bigger than the margin of error']],
  ['sampling', 'teach-sample', 'truths', ['**population**']],
  ['misleading-data', 'teach-bars', 'stretch-axis', ['measured from where the axis starts']],
  ['misleading-data', 'teach-bars', 'drawn-ratio', ['$96 - 95 = 1$', '$98 - 95 = 3$', '3 times as tall']],
  ['misleading-data', 'zero-rule', 'drawn-ratio', ['**truncated**']],
  ['misleading-data', 'teach-cherry', 'fair-headline', ['**cherry-picking**', 'the whole record']],
  ['misleading-data', 'teach-cherry', 'dual-axes', ['measured against where it *started*', '\\div 242', '\\div 520']],
  ['misleading-data', 'teach-relative', 'extra-cases', ['**relative**', '**absolute**', '"doubles"', '"triples"', '"up 50%"']],
  ['misleading-data', 'checklist', 'questions', ['Where does the axis start?', 'Percent of what?']],
];

test('teach before you ask: the shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  assert.deepEqual(Object.keys(TEACHING).sort(), LESSONS.slice().sort());
  for (const id of LESSONS) {
    const steps = lessonsById[id].steps.map((step) => resolveStep(step, makeRng(1), step.id));   // `graded` exists only on resolved steps
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    // a teaching screen is an info step that is followed by something to answer
    const lastAsked = roles.lastIndexOf('graded');
    const teaching = roles.filter((kind, i) => kind === 'teach' && i < lastAsked).length;
    assert.ok(teaching >= 3, `${id}: at least three teaching screens (found ${teaching})`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.ok(steps.length <= 18, `${id}: ${steps.length} steps`);
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length, `${id}: step ids are unique`);
    for (const stepId of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === stepId);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${stepId}" exists`);
      assert.ok(roles.indexOf('graded', at + 1) > 0, `${id}/${stepId} is followed by a question`);
      for (const figure of steps[at].figures) assert.ok(figure.alt, `${id}/${stepId}: its figure has alt text`);
    }
  }
});

test('teach before you ask: each teaching screen comes before the step it serves, and says what that step needs', () => {
  for (const [lessonId, teach, ask, terms] of SERVES) {
    const steps = lessonsById[lessonId].steps;
    const screen = steps.find((s) => s.id === teach);
    assert.ok(screen && screen.type === 'info', `${lessonId}: no teaching screen "${teach}"`);
    const asked = steps.findIndex((s) => s.id === ask);
    assert.ok(asked >= 0 && steps.indexOf(screen) < asked, `${lessonId}: "${teach}" must come before "${ask}"`);
    const shown = flat(screen.text);
    for (const term of terms) assert.ok(shown.includes(term), `${lessonId}/${teach} should say "${term}" (needed by "${ask}")`);
  }
  // a rule is stated on a teaching screen, not first in the explanation of the step that discovers it
  for (const [lessonId, stepId, rule] of [
    ['center', 'missing-weight', 'mean × count'], ['distributions', 'bell', '99.7'], ['distributions', 'shapes-match', 'bimodal'],
    ['correlation', 'hook', 'scatter plot'], ['correlation', 'fit-line', 'line of best fit'], ['correlation', 'outlier', 'Look at the scatter plot'],
    ['correlation', 'experiment', 'randomised'], ['sampling', 'unstirred', 'bias'], ['misleading-data', 'cherry', 'cherry-picking'],
    ['misleading-data', 'pill', 'absolute'],
  ]) {
    assert.ok(!flat(rawStep(lessonId, stepId).explain).includes(rule), `${lessonId}/${stepId}: "${rule}" belongs on a teaching screen, not in the explanation`);
  }
  // each discovery is followed straight away by the screen that names its rule
  for (const [lessonId, discovery, screen] of [
    ['distributions', 'find-median', 'teach-tail'], ['distributions', 'bell', 'teach-rule'], ['correlation', 'fit-line', 'teach-direction'],
    ['correlation', 'outlier', 'teach-r-limits'], ['sampling', 'unstirred', 'teach-bias'], ['misleading-data', 'cherry', 'teach-cherry'],
    ['misleading-data', 'pill', 'teach-relative'],
  ]) {
    const ids = lessonsById[lessonId].steps.map((s) => s.id);
    assert.equal(ids[ids.indexOf(discovery) + 1], screen, `${lessonId}: "${screen}" follows "${discovery}"`);
  }
  // evidence questions carry their evidence in the prompt
  assert.match(flat(rawStep('correlation', 'ice-cream').text), /Both are highest in the hot summer months\./);
  assert.match(flat(rawStep('misleading-data', 'dual-axes').text), /solid line \(revenue\) is read on the left-hand axis, the dotted line \(staff\) on the right-hand one/);
  // review steps still carry the definition they need when they come back alone
  assert.match(flat(variants('spread', 'range', 1)[0].text), /\*\*range\*\*: the largest value minus the smallest/);
  assert.match(flat(variants('spread', 'iqr-calc', 1)[0].text), /Q1 is the median of the values \*below\* the median/);
  assert.match(flat(variants('distributions', 'rule-apply', 1)[0].text), /about 68% of the values lie within 1 standard deviation of the mean, and about 95% within 2/);
  assert.match(flat(variants('sampling', 'margin-calc', 1)[0].text), /you need \d+ × \d+ times as many people/);
});

test('teach before you ask: every member of a generated pool is covered by a teaching screen above it', () => {
  const text = (lessonId, stepId) => flat(rawStep(lessonId, stepId).text);
  // estimate-r: every strength the generator can draw has a row in the table of r-explore
  for (const s of variants('correlation', 'estimate-r')) {
    const size = Math.abs(s.answer);
    assert.ok(text('correlation', 'r-explore').includes(size === 0 ? '| 0 | no straight-line trend |' : `| about ${size} |`), `r-explore has no row for ${size}`);
  }
  // scenario: each case is settled by one of the explanations named in "traps"
  for (const s of variants('correlation', 'scenario')) {
    const kind = /\*\*third factor\*\*/.test(s.explain) ? '**A third factor**' : /\*\*the other way\*\*/.test(s.explain) ? '**The arrow points the other way.**' : null;
    assert.ok(kind && text('correlation', 'traps').includes(kind), s.explain);
  }
  // mean-vs-median: the three shapes, each with its line in the key idea of teach-tail
  const lines = { 'The mean is larger than the median': 'Tail on the right: mean above the median', 'The mean is smaller than the median': 'Tail on the left: mean below it', 'They are about the same': 'No tail: the two are about the same' };
  for (const s of variants('distributions', 'mean-vs-median')) assert.ok(text('distributions', 'teach-tail').includes(lines[s.options.find((o) => o.correct).text]));
  // tail: the generator asks about 1 or 2 SDs, and teach-rule gives the share inside each
  for (const s of variants('distributions', 'tail')) {
    const inside = 100 - 2 * s.answer;
    assert.ok(text('distributions', 'teach-rule').includes(`**${inside}%**`), `teach-rule does not give ${inside}%`);
  }
  // extra-cases: every wording of the headline has a row in the table of teach-relative
  for (const s of variants('misleading-data', 'extra-cases')) {
    const headline = grab(/headline: \*\*"(.+?)"\*\*/, flat(s.text))[1];
    const row = /\bdoubles? the risk/.test(headline) ? '| "doubles" | 2 × the old risk |' : /\btriples? the risk/.test(headline) ? '| "triples" | 3 × the old risk |' : /by 50%/.test(headline) ? '| "up 50%" | the old risk plus half of it |' : null;
    assert.ok(row && text('misleading-data', 'teach-relative').includes(row), headline);
  }
  // which-poll and fair-or-biased: the two sources of bias named in teach-bias cover every biased method
  assert.ok(text('sampling', 'teach-bias').includes('Some people cannot be picked') && text('sampling', 'teach-bias').includes('People choose themselves'));
  // too-close and which-poll quote margins of error that are in the table of "margin" or follow from it
  const table = Object.fromEntries([...rawStep('sampling', 'margin').text.matchAll(/\| ([\d,]+) \| ± (\d+) points? \|/g)].map((m) => [plain(m[1]), Number(m[2])]));
  assert.deepEqual(table, { 100: 10, 400: 5, 1000: 3, 10000: 1 });
});

test('teach before you ask: the worked examples are right, and are not questions the practice steps can ask', () => {
  const fig = (lessonId, stepId, k = 0) => resolveStep(rawStep(lessonId, stepId), makeRng(1), stepId).figures[k];
  const text = (lessonId, stepId) => flat(rawStep(lessonId, stepId).text);
  // center
  const total = fig('center', 'teach-total');
  assert.deepEqual([total.values, total.fulcrum.at, avg(total.values), 4 * 6, 3 + 5 + 8, 24 - 16], [[3, 5, 8, 8], 6, 6, 24, 16, 8]);
  assert.deepEqual([mid([9, 2, 12, 3, 7]), [9, 2, 12, 3, 7][2]], [7, 12]);
  assert.match(text('center', 'median-idea'), /Take 9, 2, 12, 3, 7\. \*\*Sort first:\*\* 2, 3, 7, 9, 12\./);
  const typical = fig('center', 'teach-typical').values;
  assert.deepEqual([avg([20, 30, 40, 50, 60]), mid([20, 30, 40, 50, 60]), typical, avg(typical), mid(typical), (200 - 60) / 5], [40, 40, [20, 30, 40, 50, 200], 68, 40, 28]);
  assert.equal(typical.filter((v) => v < avg(typical)).length, 4);
  // spread
  const ranged = fig('spread', 'teach-range').values;
  assert.deepEqual([ranged, avg(ranged), gap(ranged)], [[1, 3, 5, 7, 9], 5, 8]);
  const puzzle = asc(fig('spread', 'iqr-idea').values);
  assert.deepEqual([puzzle, puzzle[3], mid(puzzle.slice(0, 3)), mid(puzzle.slice(4))], [[3, 3, 4, 4, 5, 5, 18], 4, 3, 5]);
  assert.match(text('spread', 'iqr-idea'), /Sorted: 3, 3, 4, \*\*4\*\*, 5, 5, 18\./);
  assert.match(text('spread', 'iqr-idea'), /IQR = Q3 − Q1 = 5 − 3 = 2/);
  const parcels = fig('spread', 'example-sd').values;
  assert.deepEqual([parcels, avg(parcels), parcels.map((v) => Math.abs(v - 6)), add(parcels.map((v) => (v - 6) ** 2)), popSd(parcels)], [[1, 7, 7, 9], 6, [5, 1, 1, 3], 36, 3]);
  assert.notDeepEqual(parcels, [2, 4, 5, 6, 8], 'the worked example is not the data of sd-recipe');
  // distributions
  const five = binCounts(JOURNEYS, 0, 45, 5);
  assert.deepEqual([fig('distributions', 'name-it').width, five[2], Math.max(...five)], [5, 41, 41]);
  assert.match(text('distributions', 'name-it'), /stands over 10 to 15 and reaches 41 on the side axis/);
  const marks = fig('distributions', 'teach-tail').values;
  assert.deepEqual([marks, add(marks), avg(marks), mid(marks)], [[2, 8, 9, 9, 10], 38, 7.6, 9]);
  assert.ok(near(avg(INCOMES), 41, 0.5) && mid(INCOMES) === 36.5);
  const shapes = resolveStep(rawStep('distributions', 'teach-shapes'), makeRng(1), 'teach-shapes').figures;
  assert.ok(Math.abs(skewness(shapes[0].data)) < 0.2 && skewness(shapes[1].data) < -1, 'the pictures are symmetric and skewed left');
  assert.deepEqual(shapes.map((f) => f.caption), ['Symmetric', 'Skewed left: the tail points left', 'Two peaks']);
  const hMean = avg(HEIGHTS);
  const hSd = popSd(HEIGHTS);
  assert.equal(Math.round(165.3 + 3 * 7.2), 187);
  assert.ok(near(hMean + 3 * hSd, 187, 0.5) && near(upperTail(3), 0.15, 0.02));
  assert.match(text('distributions', 'example-tail'), /\$0\.3 \\div 2 = 0\.15\$%/);
  // correlation
  const line = pearson(ICE);
  assert.deepEqual(ICE.reduce((a, b) => (b[0] > a[0] ? b : a)), [33, 215]);
  assert.ok(near(line.intercept + 20 * line.slope, 100, 5) && near(line.slope, 10, 0.5) && near(line.intercept + 30 * line.slope, 200, 5));
  assert.equal(fig('correlation', 'teach-direction').fit, true);
  const u = pearson(fig('correlation', 'teach-r-limits').points);
  assert.ok(Math.abs(u.r) < 1e-12 && Math.abs(u.slope) < 1e-12, 'the U has r = 0 and a flat line of best fit');
  // sampling
  assert.ok(near(pollMargin(1600), 2.5, 0.06) && near(pollMargin(1600 * 9), 0.8, 0.03));
  assert.equal(1600 * 3 * 3, 14400);
  assert.match(text('sampling', 'example-margin'), /1,600 × 9 = \*\*14,400 people\*\*/);
  assert.ok(near(pollMargin(625), 4, 0.1));
  assert.deepEqual([52 - 4, 52 + 4, 48 - 4, 48 + 4, 60 - 4, 60 + 4, 40 - 4, 40 + 4], [48, 56, 44, 52, 56, 64, 36, 44]);
  assert.ok(52 - 4 <= 48 + 4 && 60 - 4 > 40 + 4, 'the first pair of ranges overlaps, the second does not');
  const drawn = resolveStep(rawStep('sampling', 'example-lead'), makeRng(1), 'example-lead').figures[0].content;
  const px = (pct) => 30 + (pct - 40) * 15;
  assert.ok(drawn.includes(`class="stroke-blue" x1="${px(48)}" x2="${px(56)}"`) && drawn.includes(`class="stroke-orange" x1="${px(44)}" x2="${px(52)}"`), 'the drawing shows 48 to 56 and 44 to 52');
  // misleading data
  const [narrow, honest] = resolveStep(rawStep('misleading-data', 'teach-bars'), makeRng(1), 'teach-bars').figures;
  assert.deepEqual([narrow.base, honest.base, narrow.data.map((d) => d.value)], [95, 0, [96, 98]]);
  assert.deepEqual([(98 - 95) / (96 - 95), Math.round((98 / 96 - 1) * 100)], [3, 2]);
  const town = rawStep('misleading-data', 'fair-headline').figure.values;
  const year = (y) => town[y - 2000];
  assert.deepEqual([year(2020), year(2023), year(2023) - year(2020), year(2000), year(2024), year(2000) - year(2024)], [242, 296, 54, 520, 284, 236]);
  assert.deepEqual([Math.round((54 / 242) * 100), Math.round((236 / 520) * 100)], [22, 45]);
  const [chosen, whole] = resolveStep(rawStep('misleading-data', 'teach-cherry'), makeRng(1), 'teach-cherry').figures;
  assert.deepEqual([chosen.from, chosen.to, whole.from, whole.to, chosen.values, whole.values], [2020, 2023, 2000, 2024, town, town]);
  assert.deepEqual([8 / 4, 8 + 2], [2, 10]);

  // none of the worked examples is a question that the practice step after it can ask
  const never = (lessonId, stepId, same) => {
    for (const s of variants(lessonId, stepId)) assert.ok(!same(flat(s.text), s), `${lessonId}/${stepId} can repeat the worked example: ${flat(s.text)}`);
  };
  const listed = (t) => (/\*\*([\d, ·]+)\*\*/.exec(t)[1].match(/\d[\d,]*/g) || []).map(plain);
  never('center', 'mean-calc', (t) => asc(listed(t)).join() === '1,2,3,4,10');
  never('center', 'median-calc', (t) => listed(t).some((v) => v < 4));
  never('center', 'which-average', (t) => listed(t).length !== 7);
  never('center', 'outlier-effect', (t) => /\*\*20, 30, 40, 50, 60\*\*/.test(t));
  never('spread', 'range', (t) => listed(t).length !== 7);
  never('spread', 'iqr-calc', (t) => listed(t).some((v) => v < 12));
  never('distributions', 'rule-apply', (t) => /165|7\.2/.test(t));
  never('distributions', 'tail', (t, s) => s.answer === 0.15 || /cm\b/.test(t));
  never('sampling', 'margin-calc', (t) => /\*\*1,600\*\*/.test(t));
  never('sampling', 'too-close', (t) => /±4 points/.test(t) || /625 randomly/.test(t));
  never('misleading-data', 'drawn-ratio', (t) => /starts at \*\*9\d\*\*/.test(t));
  never('misleading-data', 'extra-cases', (t) => /25%|20,000/.test(t));
});
