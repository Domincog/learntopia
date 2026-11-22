// Independent checks of the calculus course: the helpers, and every generated
// problem re-solved numerically (many seeds) without using the generator's own algebra.
//
//   node --test tests/calculus-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { compile, equivalent } from '../src/core/mathexpr.js';
import { polyTex, polyExpr, derive, antiderive, evalPoly, rectSum, table } from '../content/courses/calculus/helpers.js';
import course from '../content/courses/calculus/course.js';

const SEEDS = 150;
const near = (a, b, tol = 1e-6, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} expected ${b}, got ${a}`);

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/calculus/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, 'calculus', meta.id);
  }
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(4242 + k * 7919), id));

/** TeX polynomial -> something mathexpr can read. */
const untex = (tex) => tex.replace(/\\tfrac13/g, '(1/3)').replace(/\\[,;! ]/g, ' ').replace(/[{}]/g, '').trim();
const fn = (expr, v = 'x') => { const f = compile(expr, { vars: [v] }); return (x) => f({ [v]: x }); };
const slope = (f, x, h = 1e-5) => (f(x + h) - f(x - h)) / (2 * h);
const integral = (f, a, b, n = 2000) => {
  const w = (b - a) / n;
  let sum = f(a) + f(b);
  for (let k = 1; k < n; k++) sum += f(a + k * w) * (k % 2 ? 4 : 2);
  return (sum * w) / 3;
};
const rows = (text) => text.split('\n').filter((l) => /^\|\s*-?[\d.]/.test(l)).map((l) => l.split('|').map((c) => c.trim()).filter(Boolean).map(Number));
const SAMPLES = [-2.3, -1.1, -0.4, 0.7, 1.9, 2.6];

/* ----------------------------------------------------------------- helpers */

test('helpers: polynomial formatting', () => {
  assert.equal(polyTex([[3, 2], [-4, 1], [1, 0]]), '3x^{2} - 4x + 1');
  assert.equal(polyExpr([[3, 2], [-4, 1], [1, 0]]), '3x^2 - 4x + 1');
  assert.equal(polyTex([[1, 3], [-1, 1]]), 'x^{3} - x');
  assert.equal(polyTex([[-1, 2], [6, 1], [0, 0]]), '-x^{2} + 6x');
  assert.equal(polyTex([[2, 1]], 't'), '2t');
  assert.equal(polyTex([]), '0');
  assert.equal(polyExpr([[-5, 0]]), '-5');
});

test('helpers: derive, antiderive, evalPoly, rectSum, table', () => {
  assert.deepEqual(derive([[4, 3], [5, 2], [-7, 1], [2, 0]]), [[12, 2], [10, 1], [-7, 0]]);
  assert.deepEqual(antiderive([[6, 2], [4, 1]]), [[2, 3], [2, 2]]);
  assert.equal(evalPoly([[1, 3], [-4, 1]], 2), 0);
  const sq = (t) => t * t;
  near(rectSum(sq, 0, 3, 3, 'left'), 5);
  near(rectSum(sq, 0, 3, 3, 'right'), 14);
  near(rectSum(sq, 0, 3, 60, 'left'), 8.77625);
  near(rectSum(sq, 0, 3, 100, 'right'), 9.13545);
  for (const n of [6, 28, 60, 100]) near(rectSum(sq, 0, 3, n, 'right') - rectSum(sq, 0, 3, n, 'left'), 27 / n);
  assert.equal(table(['a', 'b'], [[1, 2]]), '| a | b |\n| ---: | ---: |\n| 1 | 2 |');
});

/* ------------------------------------------------------------ course shape */

// docs/AUTHORING.md asks for 12–18 steps; three lessons have 17.
test('every lesson has 12–18 steps, 2–4 review steps and a hands-on step', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.ok(lesson.steps.length >= 12 && lesson.steps.length <= 18, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review).length;
    assert.ok(reviews >= 2 && reviews <= 4, `${id}: ${reviews} review steps`);
    assert.ok(lesson.steps.some((s) => s.type === 'interact'), `${id}: has an interact step`);
    assert.ok(lesson.recap.length >= 3, `${id}: recap`);
  }
});

test('interact steps accept their own solution and diagnose wrong states', () => {
  const measure = raw('average-vs-instant', 'measure');
  assert.equal(measure.check({ dt: 1, avg: 10 }), true);
  assert.match(measure.check({ dt: 2, avg: 10 }), /1 second apart/);
  assert.match(measure.check({ dt: 1, avg: 6 }), /Too slow/);
  assert.match(measure.check({ dt: 1, avg: 18 }), /Too fast/);
  const shrink = raw('average-vs-instant', 'shrink');
  assert.equal(shrink.check({ triedAll: true, smallest: 0.01 }), true);
  assert.match(shrink.check({ triedAll: false, smallest: 0.5 }), /Keep shrinking/);
  assert.match(shrink.check({ triedAll: false, smallest: 0.01 }), /whole table/);
  const level = raw('the-derivative', 'zero-slope');
  assert.equal(level.check({ P: { x: -1 } }), true);
  assert.equal(level.check({ P: { x: 1 } }), true);
  assert.match(level.check({ P: { x: 2 } }), /climbing/);
  assert.match(level.check({ P: { x: 0 } }), /downhill/);
  const squeeze = raw('area-under-curves', 'squeeze');
  assert.equal(squeeze.check({ n: 55 }), true);
  assert.match(squeeze.check({ n: 54 }), /0\.5 apart/);
  const reverse = raw('the-derivative', 'reverse');
  assert.equal(reverse.check({ picked: 2 }), true);
  for (const wrong of [0, 1, 3]) assert.equal(typeof reverse.check({ picked: wrong }), 'string');
  assert.equal(typeof reverse.check({ picked: null }), 'string');
});

/* ---------------------------------------------------------------- lesson 1 */

test('lesson 1: average rate from a table', () => {
  for (const step of variants('average-vs-instant', 'avg-from-table')) {
    const data = rows(step.text);
    const [t1, t2] = [...step.text.matchAll(/\$t = (\d+)\$/g)].map((m) => Number(m[1]));
    const at = (t) => data.find((row) => row[0] === t)[1];
    near(step.answer, (at(t2) - at(t1)) / (t2 - t1));
    assert.ok(Number.isInteger(step.answer) && step.answer > 0);
    assert.ok(data.every((row, i) => i === 0 || row[1] > data[i - 1][1]), 'distances increase');
  }
});

test('lesson 1: average rate from a graph', () => {
  for (const step of variants('average-vs-instant', 'avg-from-graph')) {
    const fig = step.figures[0];
    const f = fn(fig.fns[0].expr);
    const [p, q] = fig.points.map((pt) => pt.x);
    near(step.answer, (f(q) - f(p)) / (q - p));
    assert.ok(step.answer !== 0 && Number.isInteger(step.answer * 2), `clean answer ${step.answer}`);
    assert.equal(fig.secants[0].from, p);
    assert.equal(fig.secants[0].to, q);
    for (const x of [p, q]) assert.ok(f(x) >= fig.y[0] && f(x) <= fig.y[1], 'points are inside the window');
  }
});

test('lesson 1: the averages in the table really close in on the answer', () => {
  for (const step of variants('average-vs-instant', 'settle')) {
    const k = Number(/about \$?(\d*\.?\d*)t\^2|travelled \$(\d*\.?\d*)t\^2/.exec(step.text).slice(1).find((v) => v !== undefined) || 1);
    const a = Number(/start at \$t = (\d+)\$/.exec(step.text)[1]);
    const d = (t) => k * t * t;
    near(step.answer, slope(d, a), 1e-6);
    const shown = [...step.text.matchAll(/\| ([\d.]+) m\/s \|/g)].map((m) => Number(m[1]));
    assert.equal(shown.length, 4);
    [1, 0.1, 0.01, 0.001].forEach((h, i) => near(shown[i], (d(a + h) - d(a)) / h, 1e-9));
  }
});

test('lesson 1: the fixed numbers in the car story', () => {
  const d = (t) => 2 * t * t;
  near(slope(d, 5), 20);
  near((d(3) - d(2)) / 1, 10);
  for (const [h, before, after] of [[1, 18, 22], [0.1, 19.8, 20.2], [0.01, 19.98, 20.02], [0.001, 19.998, 20.002]]) {
    near((d(5) - d(5 - h)) / h, before, 1e-9);
    near((d(5 + h) - d(5)) / h, after, 1e-9);
  }
  near(slope(d, raw('average-vs-instant', 'find-moment').answer), 12);
  near(20 * 3.6, 72);
});

/* ---------------------------------------------------------------- lesson 2 */

test('lesson 2: signs of the slope at the marked points', () => {
  for (const step of variants('the-derivative', 'signs', 40)) {
    const fig = step.figures[0];
    const f = fn(fig.fns[0].expr);
    fig.points.forEach((pt, i) => {
      const m = slope(f, pt.x);
      const expected = Math.abs(m) < 1e-6 ? 1 : m > 0 ? 0 : 2;
      assert.equal(step.items[i].bucket, expected, `point ${step.items[i].text}`);
    });
    for (let b = 0; b < 3; b++) assert.ok(step.items.some((it) => it.bucket === b), 'every bucket is used');
  }
});

test('lesson 2: slope read from a tangent', () => {
  for (const step of variants('the-derivative', 'read-slope', 60)) {
    const fig = step.figures[0];
    const f = fn(fig.fns[0].expr);
    const [P, R] = fig.points;
    near(P.y, f(P.x));
    near(step.answer, slope(f, P.x), 1e-6);
    near(R.y, P.y + step.answer * (R.x - P.x));            // R is on the tangent
    assert.equal(fig.tangents[0].at, P.x);
    for (const pt of [P, R]) assert.ok(pt.x > fig.x[0] && pt.x < fig.x[1] && pt.y > fig.y[0] && pt.y < fig.y[1], 'inside the window');
  }
});

test('lesson 2: exactly one candidate graph is the derivative', () => {
  for (const step of variants('the-derivative', 'match-derivative', 60)) {
    const f = fn(step.widget.given.expr);
    const matches = step.widget.options.map((opt) => SAMPLES.every((x) => Math.abs(fn(opt.expr)(x) - slope(f, x)) < 1e-4));
    assert.equal(matches.filter(Boolean).length, 1);
    assert.equal(matches.indexOf(true), step.solution.picked);
    assert.equal(step.check(step.solution), true);
    step.widget.options.forEach((_, i) => { if (i !== step.solution.picked) assert.equal(typeof step.check({ picked: i }), 'string'); });
  }
  const reverse = raw('the-derivative', 'reverse');
  const given = fn(reverse.widget.given.expr);
  const ok = reverse.widget.options.map((opt) => SAMPLES.every((x) => Math.abs(slope(fn(opt.expr), x) - given(x)) < 1e-4));
  assert.deepEqual(ok, [false, false, true, false]);
});

/* ---------------------------------------------------------------- lesson 3 */

test('lesson 3: generated derivatives are right, and the listed slips are wrong', () => {
  for (const step of variants('derivative-rules', 'differentiate')) {
    const f = fn(untex(/f\(x\) = ([^$]+)\$\$/.exec(step.text)[1]));
    const answer = fn(step.answer);
    for (const x of SAMPLES) near(answer(x), slope(f, x), 1e-5);
    for (const [slip] of step.wrong) assert.ok(!equivalent(String(slip), step.answer, ['x']), `slip "${slip}" differs from the answer`);
  }
});

test('lesson 3: slope at a point, and where the slope is zero', () => {
  for (const step of variants('derivative-rules', 'slope-at')) {
    const f = fn(untex(/y = ([^$]+)\$\$/.exec(step.text)[1]));
    const x = Number(/where \$x = (-?\d+)\$/.exec(step.text)[1]);
    near(step.answer, slope(f, x), 1e-5);
  }
  for (const step of variants('derivative-rules', 'zero-slope')) {
    const ball = /h = ([^$]+)\$/.exec(step.text);
    const f = ball ? fn(untex(ball[1]), 't') : fn(untex(/y = ([^$]+)\$/.exec(step.text)[1]));
    near(slope(f, step.answer), 0, 1e-6);
    const top = /highest/.test(step.text);
    assert.ok(top ? f(step.answer) > f(step.answer + 0.5) : f(step.answer) < f(step.answer + 0.5), 'peak or valley as described');
  }
});

test('lesson 3: the measured slopes quoted in the text', () => {
  const sq = (x) => x * x;
  const cube = (x) => x * x * x;
  [-2, -1, 0, 1, 2, 3].forEach((x, i) => {
    near(slope(sq, x), [-4, -2, 0, 2, 4, 6][i], 1e-6);
    near(slope(cube, x), [12, 3, 0, 3, 12, 27][i], 1e-6);
  });
  near(slope((x) => x ** 4, 2), 32, 1e-6);
});

/* ---------------------------------------------------------------- lesson 4 */

test('lesson 4: distance under straight-line speed graphs', () => {
  for (const step of variants('area-under-curves', 'straight-pieces')) {
    const fig = step.figures[0];
    const area = fig.fns.reduce((total, piece) => total + integral(fn(piece.expr), piece.from, piece.to), 0);
    near(step.answer, area, 1e-6);
    assert.ok(Number.isInteger(step.answer));
    const end = Math.max(...fig.fns.map((piece) => piece.to));
    assert.ok(fig.x[1] > end && fig.fns.every((piece) => fn(piece.expr)(piece.from) <= fig.y[1]), 'graph fits the window');
  }
});

test('lesson 4: rectangle estimates from a table', () => {
  for (const step of variants('area-under-curves', 'table-estimate')) {
    const data = rows(step.text);
    const dt = data[1][0] - data[0][0];
    const left = /at the \*\*start\*\*/.test(step.text);
    const used = left ? data.slice(0, 4) : data.slice(1);
    near(step.answer, used.reduce((total, row) => total + row[1] * dt, 0));
    assert.ok(data.every((row, i) => i === 0 || row[1] > data[i - 1][1]), 'speed keeps rising');
  }
});

test('lesson 4: integrals by geometry, and the gap between left and right totals', () => {
  for (const step of variants('area-under-curves', 'integral-geometry')) {
    const piece = step.figures[0].fns[0];
    near(step.answer, integral(fn(piece.expr), piece.from, piece.to));
  }
  for (const step of variants('area-under-curves', 'gap')) {
    const [, u, v, T] = /from (\d+) m\/s to (\d+) m\/s over\s+(\d+) seconds/.exec(step.text).map(Number);
    const n = Number(/\*\*(\d+) rectangles\*\*/.exec(step.text)[1]);
    const speed = (t) => u + ((v - u) * t) / T;                // any rising graph gives the same gap
    near(step.answer, rectSum(speed, 0, T, n, 'right') - rectSum(speed, 0, T, n, 'left'), 1e-9);
    assert.equal(String(step.answer).length <= 4, true, `clean answer ${step.answer}`);
  }
});

test('lesson 4: the order of the estimates holds on rising and on falling curves', () => {
  for (const step of variants('area-under-curves', 'order-estimates', 60)) {
    const rising = /rises\*{0,2} all the way|\*\*rises all the way/.test(step.text);
    assert.ok(rising || /falls all the way/.test(step.text));
    for (const f of rising ? [(t) => t * t + 1, (t) => Math.exp(t / 2)] : [(t) => 10 - t * t, (t) => 4 / (1 + t)]) {
      const exact = integral(f, 0, 3);
      const value = (item) => {
        if (/true area/.test(item)) return exact;
        const n = Number(/, (\d+) of them/.exec(item)[1]);
        return rectSum(f, 0, 3, n, /^Left/.test(item) ? 'left' : 'right');
      };
      const values = step.items.map(value);
      for (let i = 1; i < values.length; i++) assert.ok(values[i] > values[i - 1], `${step.items[i - 1]} < ${step.items[i]}`);
    }
  }
});

/* ---------------------------------------------------------------- lesson 5 */

test('lesson 5: exact areas agree with numerical integration', () => {
  for (const step of variants('fundamental-theorem', 'exact-area')) {
    const fig = step.figures[0];
    const { from, to } = fig.areas[0];
    near(step.answer, integral(fn(fig.fns[0].expr), from, to), 1e-6);
    assert.ok(Number.isInteger(step.answer) && step.answer > 0);
    assert.ok(new RegExp(`x = ${from}\\$ and \\$x = ${to}\\$`).test(step.text), 'bounds in the text match the figure');
    // the antiderivative quoted in the explanation really differentiates back to the curve
    const quoted = /F\(x\) = ([^$]+)\$/.exec(step.explain)[1];
    assert.ok(!/(^|[^\d.])1x/.test(quoted), `no "1x" in "${quoted}"`);
    const F = fn(untex(quoted));
    for (const x of SAMPLES) near(slope(F, x), fn(fig.fns[0].expr)(x), 1e-5);
    near(F(to) - F(from), step.answer, 1e-9);
  }
});

test('lesson 5: antiderivatives differentiate back, and vanish at 0', () => {
  for (const step of variants('fundamental-theorem', 'antiderivative')) {
    const f = fn(untex(/f\(x\) = ([^$]+)\$\$/.exec(step.text)[1]));
    const F = fn(step.answer);
    near(F(0), 0);
    for (const x of SAMPLES) near(slope(F, x), f(x), 1e-5);
    for (const [slip] of step.wrong) assert.ok(!equivalent(String(slip), step.answer, ['x']));
  }
});

test('lesson 5: the bath fills fastest when the flow rate peaks', () => {
  for (const step of variants('fundamental-theorem', 'fastest-growth', 30)) {
    const f = fn(step.figures[0].fns[0].expr);
    let best = 0;
    for (let t = 0; t <= 6; t += 0.01) if (f(t) > f(best)) best = t;
    const right = step.options.find((o) => o.correct).text;
    const quoted = Number(/([\d.]+) min/.exec(right)[1]);
    assert.ok(Math.abs(quoted - best) < 0.06, `${right} vs peak at ${best.toFixed(2)}`);
  }
  near(integral((t) => t * t, 0, 3), 9);
  near(integral((t) => 4 * t, 0, 5), 50);
  near(integral((x) => 3 - x, 0, 6), 0);
});

/* ------------------------------------------------ lessons 6 and 7: helpers */

const gridOf = (lo, hi, step) => Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, k) => Math.round((lo + k * step) * 1e6) / 1e6);
/** Where f is largest on [lo, hi]: a coarse scan, then a fine one around the winner. */
const argmax = (f, lo, hi) => {
  const N = 4000;
  let best = lo;
  for (let k = 0; k <= N; k++) { const x = lo + ((hi - lo) * k) / N; if (f(x) > f(best)) best = x; }
  const a = Math.max(lo, best - (hi - lo) / N);
  const b = Math.min(hi, best + (hi - lo) / N);
  for (let k = 0; k <= N; k++) { const x = a + ((b - a) * k) / N; if (f(x) > f(best)) best = x; }
  return best;
};
/** A root of f between lo and hi (f changes sign there). */
const bisect = (f, lo, hi) => {
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if ((f(lo) < 0) === (f(mid) < 0)) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
};
/** e^x from its power series, so that nothing below leans on Math.exp or Math.E. */
const expSeries = (x) => { let term = 1; let total = 1; for (let k = 1; k < 80; k++) { term *= x / k; total += term; } return total; };
/** £1 after `periods` payments of interest at `rate` each, compounded one payment at a time. */
const compound = (rate, periods) => { let amount = 1; for (let k = 0; k < periods; k++) amount += amount * rate; return amount; };
const fixed = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const blanksOf = (lesson, id) => fixed(lesson, id).blanks.map((b) => (b.kind === 'select' ? b.answer : b.numeric ? b.numbers[0] : b.answers[0]));
const correctTexts = (step) => step.options.filter((o) => o.correct).map((o) => o.text);
const allStrings = (value, out = []) => {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, out));
  else if (value && typeof value === 'object' && !(value instanceof RegExp)) Object.values(value).forEach((v) => allStrings(v, out));
  return out;
};

test('lessons 6 and 7: one right answer per choice, no duplicate options, no broken text, solutions pass', () => {
  for (const id of ['optimization', 'own-slope']) {
    for (const step of lessons[id].steps) {
      for (let k = 0; k < (step.gen ? SEEDS : 1); k++) {
        const s = resolveStep(step, makeRng(99 + k * 7919), step.id);
        for (const text of allStrings(s)) assert.ok(!/undefined|NaN|Infinity|\[object/.test(text), `${id}/${step.id}: "${text.slice(0, 80)}"`);
        if (s.type === 'choice' || s.type === 'multi') {
          const texts = s.options.map((o) => o.text);
          assert.equal(new Set(texts).size, texts.length, `${id}/${step.id}: duplicate options`);
          const right = s.options.filter((o) => o.correct).length;
          if (s.type === 'choice') assert.equal(right, 1, `${id}/${step.id}: exactly one correct option`);
          else assert.ok(right >= 1 && right < s.options.length, `${id}/${step.id}: some right, some wrong`);
        }
        if (s.type === 'numeric') {
          for (const [value] of s.wrong) assert.ok(Math.abs(value - s.answer) > (s.tolerance ?? 0), `${id}/${step.id}: the slip ${value} is inside the tolerance`);
        }
        if (s.type === 'interact') assert.equal(s.check(s.solution), true, `${id}/${step.id}: the solution passes the check`);
      }
    }
  }
});

/* ---------------------------------------------------------------- lesson 6 */

test('lesson 6: the generated "best value" really is the maximiser of the stated formula', () => {
  const kinds = new Set();
  for (const step of variants('optimization', 'best-value', 200)) {
    const [, name, body] = /\$\$ ([AP]) = (.+?) \$\$/.exec(step.text);
    const v = name === 'A' ? 'x' : 'p';
    kinds.add(name);
    const forms = body.split('=').map((part) => fn(untex(part), v));
    const f = forms[0];
    for (const x of [0.3, 1.7, 4.4, 11, 23.5]) for (const g of forms) near(g(x), f(x), 1e-9, `two ways of writing "${body}":`);
    // the values that make sense: the side along the river cannot be negative, and neither can a price
    const fence = name === 'A' ? Number(/\*\*(\d+) metres\*\*/.exec(step.text)[1]) : null;
    const [lo, hi] = fence ? [0, fence / 2] : [0, 60];
    const best = argmax(f, lo, hi);
    assert.ok(Math.abs(best - step.answer) < 1e-3, `"${body}" is largest at ${best}, the key says ${step.answer}`);
    assert.ok(step.answer > lo && step.answer < hi, 'the best value is not at an edge');
    assert.ok(Math.abs(slope(f, step.answer)) < 1e-5, 'the slope is zero at the answer');
    assert.ok(f(step.answer) > f(lo) && f(step.answer) > f(hi) && f(step.answer) > 0, 'it beats both ends, and is a real field or a real profit');
    assert.ok(Number.isInteger(step.answer) && step.tolerance == null);
    assert.equal(step.unit, fence ? 'm' : 'pounds');
    // the derivative quoted in the hint and in the explanation
    const quoted = [/\$[AP]'\([xp]\) = ([^$]+)\$/.exec(step.explain)[1], /\$[AP]' = ([^$]+)\$/.exec(step.hints[0])[1]];
    for (const d of quoted) for (const x of [0, 1.5, 4, 9.25]) near(fn(untex(d), v)(x), slope(f, x), 1e-6, `derivative "${d}" at ${x}:`);
    assert.ok(new RegExp(`zero when \\$${v} = ${step.answer}\\$`).test(step.explain), step.explain);
    if (fence) {
      const [F, x, side] = /\$(\d+) - 2 \\times (\d+) = (\d+)\$ m: twice as long/.exec(step.explain).slice(1).map(Number);
      assert.deepEqual([F, x, side], [fence, step.answer, fence - 2 * step.answer]);
      assert.equal(side, 2 * step.answer);
      near(f(step.answer), step.answer * side);                    // the area is the two sides multiplied
    }
    // anticipated slips: each is a worse choice, and what its feedback claims is true
    assert.equal(step.wrong.length, 2);
    for (const [value, message] of step.wrong) {
      assert.ok(f(value) < f(step.answer));
      if (/area is zero/.test(message)) near(f(value), 0);
      else if (/Three equal sides/.test(message)) near(fence - 2 * value, value);
      else if (/is the slope at \$p = 0\$/.test(message)) near(slope(f, 0), value, 1e-6);
      else if (/Check the derivative/.test(message)) {
        const [right, slip] = /gives \$(-\d+)p\$, not \$(-\d+)p\$/.exec(message).slice(1).map(Number);
        near(slope(f, 1) - slope(f, 0), right, 1e-6);              // the true coefficient of p in P'
        near(slip * value + slope(f, 0), 0, 1e-5);                 // the slip leads to exactly this value
      } else assert.fail(`unexpected feedback: ${message}`);
    }
  }
  assert.deepEqual([...kinds].sort(), ['A', 'P']);
});

test('lesson 6: the pen, by sliding and by calculation', () => {
  // the hook: both pens use up the fence, and the square holds more
  const hook = fixed('optimization', 'hook');
  const fenceLength = Number(/\*\*(\d+) metres\*\* of fence/.exec(hook.text)[1]);
  const pens = hook.options.map((o) => /(\d+) m by (\d+) m/.exec(o.text)).filter(Boolean).map((m) => [Number(m[1]), Number(m[2])]);
  assert.equal(pens.length, 2);
  for (const [a, b] of pens) assert.equal(2 * (a + b), fenceLength);
  const [thin, square] = pens.map(([a, b]) => a * b);
  assert.ok(square > thin);
  assert.match(correctTexts(hook)[0], /square pen/);
  assert.match(hook.explain, new RegExp(`= ${square}\\$ square metres`));
  assert.match(hook.explain, new RegExp(`only ${thin} square metres`));

  // the slider: width + length is half the fence, and one width is best
  const pen = raw('optimization', 'pen');
  const readout = (label) => fn(pen.widget.readouts.find((r) => r.label === label).expr, 'w');
  const [length, area] = [readout('length'), readout('area')];
  const { min, max, step: dw } = pen.widget.params.w;
  const widths = gridOf(min, max, dw);
  for (const w of widths) { near(2 * (w + length(w)), fenceLength); near(area(w), w * length(w)); }
  const bestW = widths.reduce((a, b) => (area(b) > area(a) ? b : a));
  assert.equal(bestW, 5);
  assert.equal(area(bestW), 25);
  assert.equal(widths.filter((w) => area(w) >= area(bestW)).length, 1, 'only one width on the slider is best');
  assert.deepEqual(pen.solution, { w: bestW });
  for (const w of widths) {
    const verdict = pen.check({ w });
    if (w === bestW) assert.equal(verdict, true);
    else if (w < bestW) { assert.match(verdict, /still growing/); assert.ok(area(w + dw) > area(w)); }
    else { assert.match(verdict, /Too wide/); assert.ok(area(w) < area(w - dw)); }
  }

  // the same area as a curve, and its top
  const hill = raw('optimization', 'hill');
  const curve = fn(hill.widget.fns[0].expr);
  const written = /\$\$ A = (.+?) \$\$/.exec(hill.text)[1].split('=').map((part) => fn(untex(part), 'w'));
  assert.equal(written.length, 2);
  for (const w of widths) { near(curve(w), area(w)); for (const g of written) near(g(w), area(w)); }
  near(argmax(curve, hill.widget.x[0], hill.widget.x[1]), bestW, 1e-4);
  for (const x of gridOf(hill.widget.x[0], hill.widget.x[1], hill.widget.points[0].snap)) {
    const verdict = hill.check({ P: { x } });
    const m = slope(curve, x);
    if (verdict === true) { assert.equal(x, bestW); near(m, 0, 1e-6); }
    else if (/positive/.test(verdict)) assert.ok(m > 0, `slope at ${x}`);
    else { assert.match(verdict, /negative/); assert.ok(m < 0, `slope at ${x}`); }
  }

  // the fill-in: A'(w) = 10 − 2w, zero at 5, area 25
  const [c0, c1, zero, top] = blanksOf('optimization', 'solve-pen');
  for (const w of [0, 1.5, 4, 7.5]) near(c0 - c1 * w, slope(curve, w), 1e-6);
  near(bisect((w) => slope(curve, w), 0, 10), zero, 1e-6);
  assert.equal(curve(zero), top);
});

test('lesson 6: hilltop or valley, the ends of a stretch, and the true/false round', () => {
  const valley = fixed('optimization', 'valley');
  const f = fn(valley.figures[0].fns[0].expr);
  const stated = fn(untex(/\$f\(x\) = ([^$]+)\$/.exec(valley.text)[1]));
  const derivative = fn(untex(/derivative is \$([^$]+)\$/.exec(valley.text)[1]));
  for (const x of SAMPLES) { near(stated(x), f(x)); near(derivative(x), slope(f, x), 1e-6); }
  const bottom = argmax((x) => -f(x), valley.figures[0].x[0], valley.figures[0].x[1]);
  near(bottom, 3, 1e-4);
  assert.match(valley.text, /zero at \$x = 3\$/);
  assert.equal(f(3), 2);                                           // "its height is 9 − 18 + 11 = 2"
  assert.ok(f(bottom) > 0, 'the curve never reaches the axis');
  assert.deepEqual(correctTexts(valley), ['It is the lowest point of the curve']);

  const which = fixed('optimization', 'hill-or-valley');
  const [xLeft, xRight] = [...which.template.matchAll(/f'\((\d)\) =\$ \[\[/g)].map((m) => Number(m[1]));
  assert.ok(xLeft < 3 && xRight > 3);
  const [left, leftWay, right, rightWay, kind] = blanksOf('optimization', 'hill-or-valley');
  near(left, slope(f, xLeft), 1e-6);
  near(right, slope(f, xRight), 1e-6);
  assert.equal(leftWay, f(xLeft) > f(3) ? 'downhill' : 'uphill');
  assert.equal(rightWay, f(xRight) > f(3) ? 'uphill' : 'downhill');
  assert.equal(kind, f(3) < f(xLeft) && f(3) < f(xRight) ? 'bottom of a valley' : 'top of a hill');

  // a limited stretch: the largest value is at an end
  const edges = fixed('optimization', 'edges');
  const piece = edges.figures[0].fns[0];
  const g = fn(piece.expr);
  assert.match(edges.text, /from 0 to 4/);
  assert.deepEqual([piece.from, piece.to], [0, 4]);
  near(argmax(g, piece.from, piece.to), 4, 1e-6);
  for (const option of edges.options) {
    const x = Number(/\$x = (\d)\$/.exec(option.text)[1]);
    assert.equal(option.correct, x === 4, option.text);
    if (x !== 4) assert.ok(g(x) < g(4));
  }
  const quoted = [edges.text, edges.explain, ...edges.options.map((o) => o.why || '')].join(' ');
  const values = [...quoted.matchAll(/\$f\((\d)\) = ([^$]+)\$/g)];
  assert.ok(values.length >= 4);
  for (const [, x, chain] of values) for (const part of chain.split('=')) near(fn(untex(part))(0), g(Number(x)), 1e-9, `f(${x}) = ${chain}:`);
  near(slope(g, 1), 0, 1e-6);                                      // "zero at x = 1"
  assert.ok(slope(g, 4) > 1 && slope(g, 2) > 0);                   // still climbing at the end, and in the middle
  assert.ok(g(1) < g(0) && g(1) < g(2));                           // x = 1 is the lowest point

  // each verdict in the true/false round, backed by one of the curves above
  const hillCurve = fn(raw('optimization', 'hill').widget.fns[0].expr);
  const steepest = argmax((x) => slope(hillCurve, x), 0, 10);
  const verdicts = [
    [/top of a smooth hill, the slope of the curve is zero/, Math.abs(slope(hillCurve, argmax(hillCurve, 0, 10))) < 1e-3],
    [/slope of zero can also mark the bottom of a valley/, Math.abs(slope(f, bottom)) < 1e-3],
    [/largest value can be at one of the ends/, argmax(g, 0, 4) > 3.999],
    [/Wherever the slope is zero, the curve is at its highest/, f(3) >= f(2)],
    [/largest value of a curve is where its slope is largest/, hillCurve(steepest) >= hillCurve(5)],
  ];
  const truths = fixed('optimization', 'truths');
  assert.equal(truths.options.length, verdicts.length);
  assert.deepEqual(verdicts.map(([, truth]) => truth), [true, true, true, false, false]);
  for (const [pattern, truth] of verdicts) {
    const option = truths.options.find((o) => pattern.test(o.text));
    assert.ok(option, `an option matching ${pattern}`);
    assert.equal(option.correct, truth, option.text);
  }
});

test('lesson 6: the box cut from a 12 cm sheet', () => {
  const direct = (x) => x * (12 - 2 * x) * (12 - 2 * x);           // depth × base × base, straight from the description
  const box = raw('optimization', 'box');
  const V = fn(box.widget.fns[0].expr);
  const stated = fn(untex(/\$\$ V = (.+?) \$\$/.exec(box.text)[1]));
  for (const x of [0, 0.5, 1, 2, 3.3, 5, 6]) { near(V(x), direct(x), 1e-9); near(stated(x), direct(x), 1e-9); }

  // the two boxes in the prediction
  const setup = fixed('optimization', 'box-setup');
  const boxes = setup.options.map((o) => /(\d) cm cut: a \w+ (\d+) by (\d+) by (\d+)/.exec(o.text)).filter(Boolean).map((m) => m.slice(1).map(Number));
  assert.equal(boxes.length, 2);
  for (const [cut, a, b, depth] of boxes) assert.deepEqual([a, b, depth], [12 - 2 * cut, 12 - 2 * cut, cut]);
  const volumes = boxes.map(([cut]) => direct(cut));
  assert.deepEqual(volumes, [100, 108]);
  assert.match(correctTexts(setup)[0], /3 cm cut/);
  for (const v of volumes) assert.ok(setup.explain.includes(`= ${v}\\ \\text{cm}^3`), `the explanation quotes ${v}`);

  // the interactive: only the best cut is accepted, and the feedback tells the truth about the slope
  const cuts = gridOf(box.widget.x[0], box.widget.x[1], box.widget.points[0].snap);
  const bestCut = cuts.reduce((a, b) => (V(b) > V(a) ? b : a));
  assert.equal(bestCut, 2);
  near(argmax(direct, 0, 6), 2, 1e-4);                             // the best of all cuts, not only of those on the grid
  assert.equal(direct(2), 128);
  assert.match(box.explain, /8 by 8 by 2/);
  assert.match(box.explain, /128/);
  assert.deepEqual(box.solution, { P: { x: bestCut } });
  for (const x of cuts) {
    const verdict = box.check({ P: { x } });
    const m = slope(direct, x);
    if (x === bestCut) { assert.equal(verdict, true); continue; }
    assert.equal(typeof verdict, 'string');
    if (/slope is negative/.test(verdict)) assert.ok(m < -1e-6, `the slope at ${x} is ${m}, not negative`);
    else if (/slope is positive/.test(verdict)) assert.ok(m > 1e-6, `the slope at ${x} is ${m}, not positive`);
    else { assert.match(verdict, /level/); near(m, 0, 1e-6); near(direct(x), 0); }
  }

  // by calculation: the expansion, the derivative, its factorisation and its two roots
  const calc = fixed('optimization', 'box-check');
  const expanded = fn(untex(/\$V = ([^$]+)\$/.exec(calc.text)[1]));
  const factored = fn(untex(/factorises as \$([^$]+)\$/.exec(calc.template)[1]));
  const constant = Number(/\$x \+ (\d+)\$/.exec(calc.template)[1]);
  const [a, b, first, second, bestByCalc] = blanksOf('optimization', 'box-check');
  for (const x of [-1, 0, 0.5, 2, 3.7, 6, 8]) {
    near(expanded(x), direct(x), 1e-9);
    near(a * x * x - b * x + constant, slope(direct, x), 1e-5, `V'(${x}):`);
    near(factored(x), slope(direct, x), 1e-5, `factorised V'(${x}):`);
  }
  near(slope(direct, first), 0, 1e-6);
  near(slope(direct, second), 0, 1e-6);
  assert.ok(first < second && /smaller one first/.test(calc.template), 'the template says which root goes in which blank');
  assert.equal(direct(second), 0);                                 // "a cut of 6 cm leaves no base at all"
  assert.ok(slope(direct, second - 0.1) < 0 && slope(direct, second + 0.1) > 0, 'x = 6 is the bottom of a valley');
  assert.equal(bestByCalc, bestCut);
});

/* ---------------------------------------------------------------- lesson 7 */

test('lesson 7: slope ÷ height for 2^x and 3^x, and the hunt for e', () => {
  // the weed covers the whole pond (area 1) on day 30 and doubles every day
  const hook = fixed('own-slope', 'hook');
  const covered = (day) => 2 ** (day - 30);
  const gain = (day) => covered(day) - covered(day - 1);
  assert.equal(gridOf(1, 30, 1).reduce((a, b) => (gain(b) > gain(a) ? b : a)), 30);
  assert.equal(gain(30), covered(29));                             // the last day adds as much as was there before
  assert.match(correctTexts(hook)[0], /last day/);

  const ratioStep = fixed('own-slope', 'ratio');
  const fig = ratioStep.figures[0];
  const two = fn(fig.fns[0].expr);
  assert.equal(two(3), 8);
  for (const x of gridOf(fig.x[0], fig.x[1], fig.points[0].snap)) assert.equal((slope(two, x) / two(x)).toFixed(2), '0.69');
  assert.deepEqual(correctTexts(ratioStep), ['It stays the same everywhere: about 0.69']);

  const hunt = raw('own-slope', 'find-e');
  const curve = compile(hunt.widget.fns[0].expr, { vars: ['x', 'b'] });
  const ratio = (b) => { const f = (x) => curve({ x, b }); return slope(f, 1) / f(1); };
  const quoted = [...hunt.text.matchAll(/\$(\d)\^x\$[^$]*?about ([\d.]+) of the height/g)].map((m) => [Number(m[1]), m[2]]);
  assert.deepEqual(quoted.map(([b]) => b), [2, 3]);
  for (const [b, text] of quoted) assert.equal(ratio(b).toFixed(2), text, `slope ÷ height for ${b}^x`);
  for (let b = 1.5; b < 4; b += 0.05) assert.ok(ratio(b + 0.05) > ratio(b), 'the ratio grows with the base, so only one base gives 1');
  const e = bisect((b) => ratio(b) - 1, 2, 3);
  near(e, expSeries(1), 1e-8);
  assert.equal(e.toFixed(5), /e = ([\d.]+)/.exec(hunt.explain)[1]);
  assert.equal(e.toFixed(3), /about ([\d.]+)\./.exec(fixed('own-slope', 'e').text)[1]);

  const { min, max, step: db } = hunt.widget.params.b;
  const bases = gridOf(min, max, db);
  const closest = bases.reduce((a, b) => (Math.abs(ratio(b) - 1) < Math.abs(ratio(a) - 1) ? b : a));
  assert.equal(hunt.check({ b: closest }), true, 'the base on the slider that comes closest is accepted');
  assert.deepEqual(hunt.solution, { b: closest });
  const accepted = bases.filter((b) => hunt.check({ b }) === true);
  assert.deepEqual(accepted, /between (\d\.\d+) and (\d\.\d+)/.exec(hunt.explain).slice(1).map(Number));
  assert.ok(accepted[0] < e && e < accepted[1] && accepted.length === 2, 'the accepted bases are the two either side of e');
  for (const b of bases) {
    const verdict = hunt.check({ b });
    if (verdict === true) continue;
    assert.match(verdict, ratio(b) < 1 ? /still smaller than the height/ : /larger than the height/, `feedback at b = ${b}`);
  }

  // e^x is its own derivative; so is a multiple of it; x^3 is not
  const exp = fn(fixed('own-slope', 'e').figures[0].fns[0].expr);
  for (const x of [-2, -0.5, 0, 1, 2.25, 3]) {
    near(exp(x), expSeries(x), 1e-12);
    near(slope(exp, x), exp(x), 1e-8);
    near(slope((t) => 5 * exp(t), x), 5 * exp(x), 1e-8);
    near(slope((t) => t ** 3, x), 3 * x * x, 1e-8);
  }
});

test('lesson 7: the generated slope of e^x equals the height that is quoted', () => {
  const seen = new Set();
  for (const step of variants('own-slope', 'slope-of-e', 200)) {
    const x = Number(/At \$x = (\d+)\$/.exec(step.text)[1]);
    const [, how, shown] = /has height (exactly|about) \*\*([\d.]+)\*\*/.exec(step.text);
    seen.add(x);
    const height = expSeries(x);
    if (how === 'exactly') assert.equal(height, Number(shown)); else assert.equal(height.toFixed(2), shown);
    const m = slope(expSeries, x, 1e-4);
    const accepted = (v) => Math.abs(v - step.answer) <= step.tolerance;
    for (const fair of [m, Number(m.toFixed(2)), Number(m.toFixed(3)), Number(shown)]) assert.ok(accepted(fair), `x = ${x}: ${fair} should be accepted`);
    assert.ok(step.tolerance <= 0.01);
    assert.ok(step.explain.includes(`it is ${shown} as well`));
    for (const [value, message] of step.wrong) {
      assert.ok(!accepted(value));
      if (/value of \$x\$/.test(message)) assert.equal(value, x);
      else { assert.match(message, /power rule/); assert.equal(value, Number((x * expSeries(x - 1)).toFixed(2))); }
    }
  }
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3]);
});

test('lesson 7: compound interest closes in on e, and e^(kx) has slope k times its height', () => {
  const interest = fixed('own-slope', 'interest');
  assert.equal(compound(0.5, 2), 2.25);
  assert.match(interest.text, /1\.5 \\times 1\.5 = £2\.25/);
  const quarters = compound(0.25, 4);
  assert.ok(Math.abs(quarters - interest.answer) <= interest.tolerance);
  assert.equal(quarters.toFixed(2), String(interest.answer));
  assert.deepEqual(interest.wrong.map(([value]) => value), [compound(1, 1), compound(0.5, 2), 1.25 * 4]);
  for (const [value] of interest.wrong) assert.ok(Math.abs(value - quarters) > 10 * interest.tolerance);
  near(1.5625 ** 2, quarters, 1e-12);                              // the hint's shortcut

  // the table of (1 + 1/n)^n, recomputed one payment at a time
  const limit = fixed('own-slope', 'limit');
  const table = [...limit.text.matchAll(/^\| ([a-z ]+) \| ([\d,]+) \| £([\d.]+) \|$/gm)].map((m) => ({ label: m[1], n: Number(m[2].replace(/,/g, '')), shown: m[3] }));
  const perYear = { 'once a year': 1, 'twice a year': 2, 'every three months': 12 / 3, 'every month': 12, 'every week': 52, 'every day': 365, 'every hour': 365 * 24 };
  assert.equal(table.length, Object.keys(perYear).length);
  for (const row of table) {
    assert.equal(row.n, perYear[row.label], row.label);
    assert.equal(compound(1 / row.n, row.n).toFixed(4), row.shown, row.label);
  }
  const e = expSeries(1);
  for (let i = 1; i < table.length; i++) assert.ok(Number(table[i].shown) > Number(table[i - 1].shown), 'more payments, more money');
  assert.ok(table.every((row) => Number(row.shown) < e), 'never past e');
  const everyMinute = compound(1 / 525600, 525600);
  assert.ok(everyMinute > compound(1 / 8760, 8760) && everyMinute < e && everyMinute.toFixed(3) === '2.718');
  assert.deepEqual(correctTexts(limit), ['The total creeps up towards a limit, about £2.718']);
  assert.ok(limit.explain.includes(`e = ${e.toFixed(5)}`));

  // e^(kx): slope ÷ height is k, for every k on the slider and at every x
  const rate = fixed('own-slope', 'rate');
  const family = compile(rate.figures[0].fns[0].expr, { vars: ['x', 'k'] });
  const ratioAt = (k, x = 1) => { const f = (t) => family({ x: t, k }); return slope(f, x) / f(x); };
  const { min, max, step: dk } = rate.figures[0].params.k;
  for (const k of gridOf(min, max, dk)) for (const x of [-1, 0, 1, 2]) near(ratioAt(k, x), k, 1e-7);
  const ks = [...rate.template.matchAll(/e\^\{(-?[\d.]*)x\}\$ the slope/g)].map((m) => (m[1] === '-' ? -1 : Number(m[1])));
  assert.deepEqual(ks, [0.5, -1]);
  for (const k of ks) assert.ok(gridOf(min, max, dk).includes(k), `k = ${k} is on the slider`);
  const [half, minusOne, direction, general] = blanksOf('own-slope', 'rate');
  near(ratioAt(ks[0]), half, 1e-7);
  near(ratioAt(ks[1]), minusOne, 1e-7);
  assert.equal(direction, ratioAt(ks[1]) < 0 ? 'falling' : 'rising');
  assert.equal(general, 'k');
});

test('lesson 7: the rule of 70 against the exact doubling time', () => {
  const rates = new Set();
  const ln2 = bisect((u) => expSeries(u) - 2, 0, 1);
  assert.equal(ln2.toFixed(2), '0.69');
  assert.ok(Math.abs(100 * ln2 - 70) < 1, '70 is 69.3 made round');
  for (const step of variants('own-slope', 'doubling', 200)) {
    const rate = Number(/by \*\*(\d+)% a year\*\*/.exec(step.text)[1]);
    rates.add(rate);
    assert.match(step.text, /divide 70 by the percentage/);
    assert.equal(step.answer, 70 / rate);
    assert.ok(Number.isInteger(step.answer));
    // from first principles: compound year by year for as long as the amount stays under double…
    let amount = 1;
    let years = 0;
    while (amount * (1 + rate / 100) < 2) { amount *= 1 + rate / 100; years++; }
    // …then find the exact moment within the following year
    const exact = bisect((t) => (1 + rate / 100) ** t - 2, years, years + 1);
    const continuous = bisect((t) => expSeries((rate / 100) * t) - 2, 0, 100);
    near(continuous, ln2 / (rate / 100), 1e-9);
    const accepted = (v) => Math.abs(v - step.answer) <= step.tolerance;
    // fair in one direction: the rule's answer, and both exact answers however they are rounded, are accepted
    for (const fair of [70 / rate, exact, Number(exact.toFixed(1)), Math.round(exact), continuous, Number(continuous.toFixed(1)), Math.round(continuous)]) {
      assert.ok(accepted(fair), `${rate}%: ${fair} should be accepted (key ${step.answer} ± ${step.tolerance})`);
    }
    assert.ok(Math.abs(step.answer - exact) / exact < 0.06, `${rate}%: the rule is within 6% of the exact ${exact}`);
    // fair in the other: nothing 20% out, and none of the anticipated slips, gets through
    for (const unfair of [exact * 1.2, exact * 0.8, 100 / rate, rate, 2 * step.answer]) {
      assert.ok(!accepted(unfair), `${rate}%: ${unfair} should not be accepted (key ${step.answer} ± ${step.tolerance})`);
    }
    for (const [value, message] of step.wrong) {
      assert.ok(!accepted(value));
      if (/use 70, not 100/.test(message)) near(value, 100 / rate, 1e-12);
      else { assert.match(message, /percentage itself/); assert.equal(value, rate); }
    }
    assert.deepEqual(/\$70 \\div (\d+) = (\d+)\$ years/.exec(step.explain).slice(1).map(Number), [rate, step.answer]);
    assert.ok(step.explain.includes(`kt \\approx ${ln2.toFixed(2)}`));
    assert.deepEqual(step.hints, [`70 ÷ ${rate}`]);
  }
  assert.deepEqual([...rates].sort((a, b) => a - b), [2, 5, 7, 10, 14]);
});

test('lesson 7: same amount or in proportion, the area under e^x, and the true/false round', () => {
  const sort = fixed('own-slope', 'sort');
  assert.deepEqual(sort.buckets, ['Same amount each time', 'In proportion to its size']);
  const expected = [[/candle/, 0], [/taxi/, 0], [/bath/, 0], [/interest/, 1], [/double/, 1], [/rumour/, 1], [/tenth of its extra warmth/, 1]];
  assert.equal(sort.items.length, expected.length);
  for (const [pattern, bucket] of expected) assert.equal(sort.items.find((item) => pattern.test(item.text)).bucket, bucket, String(pattern));

  const area = fixed('own-slope', 'area');
  const { from, to } = area.figures[0].areas[0];
  assert.deepEqual([from, to], [0, 1]);
  assert.match(area.text, /from \$x = 0\$ to \$x = 1\$/);
  const exact = integral(fn(area.figures[0].fns[0].expr), from, to);
  near(exact, expSeries(1) - 1, 1e-9);
  assert.ok(Math.abs(exact - area.answer) <= area.tolerance);
  const eGiven = Number(/e \\approx ([\d.]+)/.exec(area.text)[1]);
  near(area.answer, eGiven - 1, 1e-12);
  assert.deepEqual(area.wrong.map(([value]) => value), [eGiven, 1]);
  for (const [value] of area.wrong) assert.ok(Math.abs(value - exact) > 10 * area.tolerance);
  assert.match(area.explain, /e - 1 \\approx 1\.718/);
  assert.ok(!/last lesson/.test(area.explain), 'the fundamental theorem is two lessons back, not one');

  const doubling5 = bisect((t) => 1.05 ** t - 2, 0, 100);
  const verdicts = [
    [/slope of \$y = e\^x\$ at any point equals its height/, [-1, 0, 2.5].every((x) => Math.abs(slope(expSeries, x) / expSeries(x) - 1) < 1e-8)],
    [/grows by 5% a year doubles in about 14 years/, Math.round(doubling5) === 14],
    [/slope of \$y = e\^\{-x\}\$ is negative everywhere/, gridOf(-5, 5, 0.5).every((x) => slope((t) => expSeries(-t), x) < 0)],
    [/derivative of \$e\^x\$ is \$x\\,e\^\{x-1\}\$/, Math.abs(slope(expSeries, 2) - 2 * expSeries(1)) < 1e-6],
    [/more and more often makes the total grow without limit/, compound(1 / 525600, 525600) > 3],
  ];
  const truths = fixed('own-slope', 'truths');
  assert.equal(truths.options.length, verdicts.length);
  assert.deepEqual(verdicts.map(([, truth]) => truth), [true, true, true, false, false]);
  for (const [pattern, truth] of verdicts) {
    const option = truths.options.find((o) => pattern.test(o.text));
    assert.ok(option, `an option matching ${pattern}`);
    assert.equal(option.correct, truth, option.text);
  }

  // the model answer: 3% a year
  const model = fixed('own-slope', 'reflect').model;
  assert.match(model, /roughly every 23 years \(70 ÷ 3\)/);
  assert.equal(Math.round(70 / 3), 23);
  const doubling3 = bisect((t) => 1.03 ** t - 2, 0, 100);
  assert.ok(Math.abs(doubling3 - 23) < 1);
  assert.match(model, /three doublings: eight times as much/);
  assert.equal(Math.round(70 / doubling3), 3);
  assert.equal(Math.round(compound(0.03, 70)), 8);
});

/* ------------------------------------------------------ teach before you ask */

/** The teaching screens added so that every lesson shows a thing before it asks for it. */
const TEACHING = {
  'average-vs-instant': ['teach-rate-of-change'],
  'the-derivative': ['teach-slope-signs', 'example-tangent-slope', 'teach-function', 'teach-sign-change'],
  'derivative-rules': ['teach-term-by-term', 'example-slope-at', 'example-level-point'],
  'area-under-curves': ['teach-area-shapes', 'example-split', 'example-rectangles', 'teach-under-over'],
  'fundamental-theorem': ['teach-area-formula'],
  optimization: ['teach-pen-formula', 'example-recipe', 'teach-full-check'],
  'own-slope': ['teach-doubling-curve', 'teach-growth-decay', 'teach-rule-of-70'],
};

/**
 * [teaching screen, the first step it serves, what the screen must contain].
 * Screens that were already there are listed too: each is where a term, a notation or a
 * method is shown for the first time, and it has to stay in front of the step that needs it.
 */
const SERVES = {
  'average-vs-instant': [
    ['secant', 'avg-from-table', [/secant line/, /:::example/, /rise/]],
    ['teach-rate-of-change', 'avg-from-graph', [/average rate of change/, /:::example/, /negative/]],
    ['instant', 'settle', [/instantaneous speed/, /\*\*limit\*\*/, /:::example/]],
    ['instant', 'avg-or-instant', [/instantaneous rate of change/]],
  ],
  'the-derivative': [
    ['tangent', 'zero-slope', [/tangent line/, /slope of a curve at a point/]],
    ['teach-slope-signs', 'signs', [/climbing/, /positive/, /falling/, /negative/, /zero/, /hilltop/, /valley/]],
    ['example-tangent-slope', 'read-slope', [/:::example/, /rise/, /run/, /on the tangent/]],
    ['teach-function', 'tracer', [/\*\*function\*\*/, /\$f\(x\)\$/, /:::example/]],
    ['derivative', 'match-derivative', [/\*\*derivative\*\*/, /f'\(x\)/, /f' > 0/, /f' = 0/, /f' < 0/]],
    ['teach-sign-change', 'reverse', [/:::example/, /peak/, /valley/]],
    ['teach-sign-change', 'features', [/peak/, /valley/, /straight line/, /steeper and steeper/]],
  ],
  'derivative-rules': [
    ['power-rule', 'shift', [/n\\,x\^\{n-1\}/, /f'\(x\)/, /\\dfrac\{dy\}\{dx\}/]],
    ['teach-term-by-term', 'sum', [/\*\*differentiating\*\*/, /constant/, /stays in front/, /one term at a time/, /:::example/]],
    ['teach-term-by-term', 'differentiate', [/:::example/]],
    ['example-slope-at', 'slope-at', [/:::example/, /Differentiate/, /Put in/, /height/]],
    ['example-level-point', 'zero-slope', [/:::example/, /zero/, /top of a hill/, /bottom of a valley/]],
  ],
  'area-under-curves': [
    ['teach-area-shapes', 'triangle', [/triangle/, /\\tfrac12 \\times \\text\{base\} \\times \\text\{height\}/, /:::example/]],
    ['example-split', 'straight-pieces', [/:::example/, /Rectangle/, /Triangle/, /level piece/]],
    ['why-area', 'left-sum', [/area under the graph/, /slices/]],
    ['example-rectangles', 'table-estimate', [/:::example/, /\*\*start\*\*/, /\*\*end\*\*/, /four rectangles/]],
    ['teach-under-over', 'squeeze', [/rising/, /falling/, /too small/, /too big/, /between/]],
    ['teach-under-over', 'order-estimates', [/thinner/]],
    ['integral', 'integral-geometry', [/\*\*integral\*\*/, /\\int_0\^3/, /dt/]],
  ],
  'fundamental-theorem': [
    ['why', 'fastest-growth', [/A'\(x\) = f\(x\)/, /rate at which area piles up/]],
    ['why', 'triangle-check', [/fundamental theorem/]],
    ['reverse-rule', 'one-line', [/antiderivative/, /raise the power by one, then divide by the new power/, /:::example/, /constant/]],
    ['teach-area-formula', 'exact-area', [/F\(b\) - F\(a\)/, /\\int_a\^b/, /:::example/]],
    ['reverse-rule', 'antiderivative', [/:::example/]],
  ],
  optimization: [
    ['teach-pen-formula', 'pen', [/10 - w/, /A = w \\times \(10 - w\)/]],
    ['recipe', 'solve-pen', [/slope is zero/, /Differentiate/, /Set the derivative to zero/, /optimisation/]],
    ['example-recipe', 'solve-pen', [/:::example/, /Differentiate/, /Set to zero/]],
    ['example-recipe', 'best-value', [/:::example/]],
    ['teach-full-check', 'truths', [/hilltop/, /valley/, /ends/]],
  ],
  'own-slope': [
    ['teach-doubling-curve', 'ratio', [/\*\*exponential\*\*/, /doubles/, /in proportion to its size/]],
    ['e', 'slope-of-e', [/its own derivative/, /slope equals its height/]],
    ['teach-growth-decay', 'sort', [/\*\*growth\*\*/, /\*\*decay\*\*/, /same amount/, /fraction of its size/, /straight line/]],
    ['teach-rule-of-70', 'doubling', [/doubling time/, /70 ÷ the percentage/, /:::example/]],
    ['teach-rule-of-70', 'truths', [/70/]],
  ],
};

test('teach before you ask: every lesson teaches first, on three to six screens, with at most two predictions', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const id of Object.keys(lessons)) {
    const steps = lessons[id].steps.map((step) => fixed(id, step.id));      // resolved, as the player sees them
    const roles = steps.map(role);
    const at = (stepId) => steps.findIndex((s) => s.id === stepId);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    const screens = roles.filter((kind) => kind === 'teach').length;
    assert.ok(screens >= 3 && screens <= 6, `${id}: ${screens} teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const stepId of TEACHING[id]) {
      const step = steps[at(stepId)];
      assert.ok(step && step.type === 'info', `${id}: the teaching screen "${stepId}" exists`);
      assert.ok(step.figures.length >= 1 || /\n\s*\|/.test(step.text), `${id}/${stepId} has a figure or a table`);
      assert.ok(roles.indexOf('graded', at(stepId) + 1) > 0, `${id}/${stepId} is followed by a question`);
    }
    for (const [teach, ask, needs] of SERVES[id]) {
      assert.ok(at(teach) >= 0 && at(ask) >= 0, `${id}: "${teach}" and "${ask}" exist`);
      assert.equal(steps[at(teach)].type, 'info', `${id}/${teach} is a teaching screen`);
      assert.ok(at(teach) < at(ask), `${id}: "${teach}" comes before "${ask}"`);
      for (const pattern of needs) assert.match(steps[at(teach)].text, pattern, `${id}/${teach} shows what "${ask}" needs`);
    }
  }
  // a discovery is followed at once by the screen that names what was found
  const next = (id, stepId) => lessons[id].steps[lessons[id].steps.findIndex((s) => s.id === stepId) + 1].id;
  assert.equal(next('average-vs-instant', 'limit-value'), 'instant');
  assert.equal(next('the-derivative', 'zoom-slope'), 'tangent');
  assert.equal(next('the-derivative', 'zero-slope'), 'teach-slope-signs');
  assert.equal(next('the-derivative', 'tracer'), 'derivative');
  assert.equal(next('derivative-rules', 'pattern'), 'power-rule');
  assert.equal(next('derivative-rules', 'scale'), 'teach-term-by-term');
  assert.equal(next('area-under-curves', 'right-edge'), 'teach-under-over');
  assert.equal(next('fundamental-theorem', 'accumulate'), 'why');
  assert.equal(next('fundamental-theorem', 'undo'), 'reverse-rule');
  assert.equal(next('fundamental-theorem', 'one-line'), 'teach-area-formula');
  assert.equal(next('optimization', 'hill'), 'recipe');
  assert.equal(next('optimization', 'edges'), 'teach-full-check');
  assert.equal(next('own-slope', 'find-e'), 'e');
  assert.equal(next('own-slope', 'rate'), 'teach-growth-decay');
  // terms that used to appear first in an explanation are now defined before they are used
  assert.match(fixed('average-vs-instant', 'measure').text, /\*\*average speed\*\*: the distance covered\s+divided by the time taken/);
  assert.match(fixed('fundamental-theorem', 'undo').text, /is called an \*\*antiderivative\*\*/);
  assert.match(fixed('fundamental-theorem', 'triangle-check').text, /½ × base × height/);
  assert.match(fixed('own-slope', 'area').text, /F\(b\) - F\(a\)/);
});

test('teach before you ask: the worked examples are right, and are not the questions that follow them', () => {
  const text = (lesson, id) => fixed(lesson, id).text;
  const curve = (lesson, id) => fn(fixed(lesson, id).figures[0].fns[0].expr);
  const never = (lesson, id, pattern, n = SEEDS) => { for (const step of variants(lesson, id, n)) assert.ok(!pattern.test(step.text), `${lesson}/${id} can produce the worked example: ${step.text.slice(0, 90)}`); };

  // lesson 1: the car between 1 s and 4 s, and the leaking barrel
  const car = (t) => 2 * t * t;
  assert.deepEqual([car(1), car(4), (car(4) - car(1)) / 3], [2, 32, 10]);
  assert.match(text('average-vs-instant', 'secant'), /\\frac\{32 - 2\}\{4 - 1\}/);
  const barrel = curve('average-vs-instant', 'teach-rate-of-change');
  assert.deepEqual([barrel(2), barrel(6), (barrel(6) - barrel(2)) / (6 - 2)], [60, 28, -8]);
  assert.match(text('average-vs-instant', 'teach-rate-of-change'), /\\frac\{28 - 60\}\{6 - 2\} = \\frac\{-32\}\{4\} = -8/);
  for (const step of variants('average-vs-instant', 'avg-from-graph')) assert.notEqual(step.figures[0].fns[0].expr, fixed('average-vs-instant', 'teach-rate-of-change').figures[0].fns[0].expr);
  assert.match(text('average-vs-instant', 'instant'), /22, 20\.2, 20\.02, 20\.002 m\/s/);        // the "just after" column of limit-value

  // lesson 2: the four tangents, the tangent through P and R, f(3) = 9, and the hill read from its derivative
  const signs = fixed('the-derivative', 'teach-slope-signs');
  const wave = fn(signs.figures[0].fns[0].expr);
  const signOf = (m) => (Math.abs(m) < 1e-6 ? 0 : m > 0 ? 1 : -1);
  assert.deepEqual(signs.figures[0].tangents.map((t) => signOf(slope(wave, t.at))), [1, 0, -1, 0]);     // A, B, C, D
  assert.ok(wave(-2) > wave(-2.5) && wave(-2) > wave(-1.5) && wave(2) < wave(1.5) && wave(2) < wave(2.5), 'B is a hilltop and D a valley floor');
  for (const step of variants('the-derivative', 'signs', 40)) assert.notEqual(step.figures[0].fns[0].expr, signs.figures[0].fns[0].expr);
  const tangentFig = fixed('the-derivative', 'example-tangent-slope').figures[0];
  const bowl = fn(tangentFig.fns[0].expr);
  const [P, R] = tangentFig.points;
  assert.deepEqual([P.x, P.y, R.x, R.y], [3, 5, 1, -1]);
  near(bowl(P.x), P.y);
  near(slope(bowl, P.x), 3, 1e-6);
  near((P.y - R.y) / (P.x - R.x), 3);
  near(R.y, P.y + 3 * (R.x - P.x));                                       // R is on the tangent, not on the curve
  assert.ok(Math.abs(bowl(R.x) - R.y) > 1);
  for (const step of variants('the-derivative', 'read-slope', 60)) assert.notEqual(step.answer, 3);
  assert.equal(curve('the-derivative', 'teach-function')(3), 9);
  assert.match(text('the-derivative', 'teach-function'), /\$f\(3\) = 3\^2 = 9\$/);
  const hillFig = fixed('the-derivative', 'teach-sign-change').figures[0];
  const hill = fn(hillFig.fn);
  near(slope(hill, 2), 0, 1e-6);
  assert.ok(slope(hill, 1) > 0 && slope(hill, 3) < 0 && hill(2) > hill(1) && hill(2) > hill(3), 'a hill with its top at x = 2');
  assert.match(text('the-derivative', 'teach-sign-change'), /a hill with its top at \$x = 2\$/);
  assert.notEqual(raw('the-derivative', 'reverse').widget.given.expr, '2 - x');

  // lesson 3: term by term, the slope at a point, and the level point
  const poly = fn('2x^5 - 3x^2 + 9x - 4');
  const dPoly = fn('10x^4 - 6x + 9');
  for (const x of SAMPLES) near(dPoly(x), slope(poly, x), 1e-5);
  assert.match(text('derivative-rules', 'teach-term-by-term'), /f\(x\) = 2x\^5 - 3x\^2 \+ 9x - 4/);
  assert.match(text('derivative-rules', 'teach-term-by-term'), /f'\(x\) = 10x\^4 - 6x \+ 9/);
  never('derivative-rules', 'differentiate', /x\^\{5\} - 3x\^\{2\}/);
  for (const id of ['example-slope-at', 'example-level-point']) {
    const f = curve('derivative-rules', id);
    assert.match(text('derivative-rules', id), /y = 8x - 2x\^2/);
    assert.match(text('derivative-rules', id), /\\dfrac\{dy\}\{dx\} = 8 - 4x/);
    for (const x of SAMPLES) { near(f(x), 8 * x - 2 * x * x); near(slope(f, x), 8 - 4 * x, 1e-6); }
  }
  const dome = curve('derivative-rules', 'example-slope-at');
  assert.deepEqual([dome(1), 8 - 4 * 1, dome(2), 8 - 4 * 2], [6, 4, 8, 0]);
  near(argmax(dome, -1, 5), 2, 1e-4);
  for (const id of ['slope-at', 'zero-slope']) never('derivative-rules', id, /8x - 2x\^\{2\}|-2x\^\{2\} \+ 8x/);

  // lesson 4: a triangle, a rectangle with a triangle on top, and rectangles from a table
  const triangle = fixed('area-under-curves', 'teach-area-shapes').figures[0].fns[0];
  near(integral(fn(triangle.expr), triangle.from, triangle.to), 36);
  assert.deepEqual([triangle.to, fn(triangle.expr)(triangle.to), 0.5 * 6 * 12], [6, 12, 36]);
  assert.match(text('area-under-curves', 'teach-area-shapes'), /\\tfrac12 \\times 6 \\times 12 = 36/);
  const bus = fixed('area-under-curves', 'example-split').figures[0].fns[0];
  assert.deepEqual([fn(bus.expr)(0), fn(bus.expr)(4), bus.to], [3, 9, 4]);
  near(integral(fn(bus.expr), bus.from, bus.to), 4 * 3 + 0.5 * 4 * 6);
  assert.match(text('area-under-curves', 'example-split'), /12 \+ 12 = 24/);
  never('area-under-curves', 'straight-pieces', /from 3 m\/s/);
  const rectangles = fixed('area-under-curves', 'example-rectangles');
  const readings = rectangles.text.split('\n').filter((line) => /^\s*\|\s*(time|speed)/.test(line)).map((line) => line.split('|').slice(2, -1).map(Number));
  assert.deepEqual(readings, [[0, 3, 6, 9, 12], [1, 2, 5, 10, 17]]);
  const logged = fn(rectangles.figures[0].fns[0].expr);
  readings[0].forEach((t, i) => near(logged(t), readings[1][i]));
  near(rectSum(logged, 0, 12, 4, 'left'), 54);
  near(rectSum(logged, 0, 12, 4, 'right'), 102);
  assert.match(rectangles.text, /3 \\times \(1 \+ 2 \+ 5 \+ 10\) = 54/);
  assert.match(rectangles.text, /3 \\times 34 = 102/);
  assert.deepEqual([rectangles.figures[0].riemann[0].n, rectangles.figures[0].riemann[0].mode], [4, 'left']);
  never('area-under-curves', 'table-estimate', /every 3 seconds/);
  const falling = fn(fixed('area-under-curves', 'teach-under-over').figures[0].fns[0].expr);
  const rising = (t) => t * t;
  for (const n of [6, 12, 60]) {
    assert.ok(rectSum(rising, 0, 3, n, 'left') < integral(rising, 0, 3) && integral(rising, 0, 3) < rectSum(rising, 0, 3, n, 'right'));
    assert.ok(rectSum(falling, 0, 3, n, 'left') > integral(falling, 0, 3) && integral(falling, 0, 3) > rectSum(falling, 0, 3, n, 'right'));
  }
  assert.match(text('area-under-curves', 'teach-under-over'), /\| rising \| too small \| too big \|/);
  assert.match(text('area-under-curves', 'teach-under-over'), /\| falling \| too big \| too small \|/);

  // lesson 5: an antiderivative term by term, and an area between two edges
  const F = fn('2x^5 + 3x^2 - 7x');
  for (const x of SAMPLES) near(slope(F, x), 10 * x ** 4 + 6 * x - 7, 1e-5);
  assert.match(text('fundamental-theorem', 'reverse-rule'), /10x\^4 \+ 6x - 7/);
  assert.match(text('fundamental-theorem', 'reverse-rule'), /F\(x\) = 2x\^5 \+ 3x\^2 - 7x/);
  for (const [f, anti] of [['1', 'x'], ['x', 'x^2/2'], ['x^2', 'x^3/3'], ['x^3', 'x^4/4']]) for (const x of SAMPLES) near(slope(fn(anti), x), fn(f)(x), 1e-5);
  for (const step of variants('fundamental-theorem', 'antiderivative')) assert.ok(!/x\^5/.test(step.answer));
  const area = fixed('fundamental-theorem', 'teach-area-formula').figures[0];
  assert.deepEqual([area.areas[0].from, area.areas[0].to], [1, 2]);
  near(integral(fn(area.fns[0].expr), 1, 2), 21);
  for (const x of SAMPLES) near(slope((t) => 3 * t ** 3, x), fn(area.fns[0].expr)(x), 1e-5);
  assert.match(text('fundamental-theorem', 'teach-area-formula'), /F\(2\) - F\(1\) = 24 - 3 = 21/);
  never('fundamental-theorem', 'exact-area', /y = 9x\^2/);

  // lesson 6: the pen's table (without the answer), and the café's best price
  const pens = [...text('optimization', 'teach-pen-formula').matchAll(/^\s*\| (\d+) \| (\d+) \| (\d+) \|\s*$/gm)].map((m) => m.slice(1).map(Number));
  assert.equal(pens.length, 3);
  for (const [w, length, a] of pens) { assert.equal(2 * (w + length), 20); assert.equal(a, w * length); assert.ok(w < 5, 'the best width is left to find'); }
  const penFig = fixed('optimization', 'teach-pen-formula').figures[0];
  assert.deepEqual([penFig.fns[0].to, Number(penFig.fns[0].expr)], pens[2].slice(0, 2));
  const profit = curve('optimization', 'example-recipe');
  for (const p of [0, 2.5, 6, 11]) { near(profit(p), 36 * p - 3 * p * p - 60); near(slope(profit, p), 36 - 6 * p, 1e-6); }
  near(argmax(profit, 0, 12), 6, 1e-4);
  assert.equal(profit(6), 48);
  assert.match(text('optimization', 'example-recipe'), /P'\(p\) = 36 - 6p/);
  assert.match(text('optimization', 'example-recipe'), /= 48\$ pounds/);
  never('optimization', 'best-value', /3p\^2/);
  const stretch = fixed('optimization', 'teach-full-check').figures[0];
  assert.deepEqual(stretch.fns[0], fixed('optimization', 'edges').figures[0].fns[0]);            // the stretch just looked at

  // lesson 7: the doubling table, growth and decay, and the rule of 70
  const doubling = text('own-slope', 'teach-doubling-curve').split('\n').filter((line) => /^\s*\|\s*\$(x|2\^x)\$/.test(line))
    .map((line) => line.split('|').slice(2, -1).map((cell) => Number(cell.replace(/\$/g, '').replace('\\tfrac12', '0.5'))));
  assert.deepEqual(doubling, [[-1, 0, 1, 2, 3, 4], [0.5, 1, 2, 4, 8, 16]]);
  doubling[0].forEach((x, i) => assert.equal(2 ** x, doubling[1][i]));
  assert.equal(curve('own-slope', 'teach-doubling-curve')(3), 8);
  const [up, down] = fixed('own-slope', 'teach-growth-decay').figures[0].fns.map((f) => fn(f.expr));
  for (const x of [-2, 0, 1.5]) { near(slope(up, x) / up(x), 0.5, 1e-6); near(slope(down, x) / down(x), -0.5, 1e-6); }
  const sortItems = fixed('own-slope', 'sort').items.map((item) => item.text).join(' ');
  for (const word of ['tank', 'town', 'ball']) assert.ok(!sortItems.includes(word), `"${word}" is an example on the teaching screen, not an item to sort`);
  assert.match(text('own-slope', 'teach-rule-of-70'), /3\.5% a year\. \$70 \\div 3\.5 = 20\$/);
  near(bisect((t) => 1.035 ** t - 2, 0, 100), 20, 0.02);
  const forest = curve('own-slope', 'teach-rule-of-70');
  assert.deepEqual([0, 20, 40, 60].map(forest), [1, 2, 4, 8]);
  never('own-slope', 'doubling', /\*\*3\.5% a year\*\*/, 200);
  near(slope((x) => 2 ** x, 1) / 2, bisect((u) => expSeries(u) - 2, 0, 1), 1e-6);                // "the same 0.69 you measured on 2^x"
});
