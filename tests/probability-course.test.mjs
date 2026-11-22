// Independent checks of the "Probability & Chance" course. Every generated
// question is re-solved from its own wording (many seeds): the numbers are
// parsed out of the resolved text and the answer is recomputed by brute-force
// enumeration of the sample space, never with the lesson's own helpers.
// Fixed answers, orderings, sorting tasks and the checks of the hands-on steps
// are recomputed the same way.
//
//   node --test tests/probability-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { parseNumber } from '../src/core/mathexpr.js';
import course from '../content/courses/probability/course.js';

const SEEDS = 200;

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/probability/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, 'probability', meta.id);
  }
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const fixed = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(1000 + k * 7919), id));

/* ------------------------------------------------------------------ tools */

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
/** "n/d" in lowest terms ("2" when the denominator is 1): what a reduced `display` must look like. */
const lowest = (n, d) => { const g = gcd(n, d) || 1; return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
const plain = (text) => String(text).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
const int = (s) => Number(String(s).replace(/,/g, ''));
const must = (re, text, what = '') => { const m = re.exec(text); assert.ok(m, `cannot read ${what || re} from: ${text}`); return m; };

/** All 36 equally likely outcomes of two dice. */
const DICE = [];
for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) DICE.push([a, b]);
const diceCount = (test) => DICE.filter(([a, b]) => test(a, b)).length;
const diceSet = (test) => DICE.filter(([a, b]) => test(a, b)).map(([a, b]) => `(${a}, ${b})`);
/** Every "(a, b)" pair written in a piece of text. */
const pairsIn = (text) => (String(text).match(/\(\d, \d\)/g) || []);

/** Every sequence of `length` results, each drawn from `faces` (equally likely). */
function sequences(faces, length) {
  let out = [[]];
  for (let i = 0; i < length; i++) out = out.flatMap((seq) => faces.map((f) => [...seq, f]));
  return out;
}
const share = (list, test) => [list.filter(test).length, list.length];

/** A fraction answer: right value, shown in lowest terms, and no "anticipated mistake" that is really the answer. */
function checkFraction(s, n, d, where) {
  assert.ok(Math.abs(s.answer - n / d) < 1e-12, `${where}: answer ${s.answer}, recomputed ${n}/${d}`);
  assert.equal(String(s.display), lowest(n, d), `${where}: display`);
  assert.ok(s.tolerance > 0 && s.tolerance <= 0.005, `${where}: tolerance`);
  checkWrong(s, where);
}
/** No listed wrong answer may be within the accepted tolerance of the right one; each has feedback. */
function checkWrong(s, where) {
  const tol = s.tolerance == null ? 1e-6 * Math.max(1, Math.abs(s.answer)) : s.tolerance;
  for (const [value, message] of s.wrong) {
    assert.ok(Math.abs(value - s.answer) > tol, `${where}: the "wrong" value ${value} would be accepted as ${s.answer}`);
    assert.ok(message && message.length > 10, `${where}: wrong value ${value} has no feedback`);
  }
}
/** An answer with no tolerance must be something a learner can type exactly. */
const typable = (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-9;
/** The phrasings of an event about two dice, read independently of the lesson's own predicates. */
function diceEvent(phrase) {
  const p = plain(phrase);
  let m;
  if ((m = /^the total is (\d+) or more$/.exec(p))) return (a, b) => a + b >= Number(m[1]);
  if ((m = /^the total is (\d+) or less$/.exec(p))) return (a, b) => a + b <= Number(m[1]);
  if ((m = /^the total is (\d+)$/.exec(p))) return (a, b) => a + b === Number(m[1]);
  if (p === 'both dice show the same number') return (a, b) => a === b;
  if (p === 'the two dice show different numbers') return (a, b) => a !== b;
  if ((m = /^the two numbers differ by exactly (\d)$/.exec(p))) return (a, b) => Math.abs(a - b) === Number(m[1]);
  if ((m = /^at least one die shows a (\d)$/.exec(p))) return (a, b) => a === Number(m[1]) || b === Number(m[1]);
  if ((m = /^one of the dice shows a (\d)$/.exec(p))) return (a, b) => a === Number(m[1]) || b === Number(m[1]);
  if ((m = /^neither die shows a (\d)$/.exec(p))) return (a, b) => a !== Number(m[1]) && b !== Number(m[1]);
  if ((m = /^the first die shows a (\d)$/.exec(p))) return (a) => a === Number(m[1]);
  if (p === 'the first die shows an odd number') return (a) => a % 2 === 1;
  if (p === 'both dice show an odd number') return (a, b) => a % 2 === 1 && b % 2 === 1;
  if (p === 'both dice show an even number') return (a, b) => a % 2 === 0 && b % 2 === 0;
  if (p === 'the first die shows a bigger number than the second') return (a, b) => a > b;
  if ((m = /^the larger of the two numbers is a (\d) \(a double \d counts\)$/.exec(p))) return (a, b) => Math.max(a, b) === Number(m[1]);
  throw new Error(`unknown dice event: "${p}"`);
}

/* -------------------------------------------------------------- structure */

test('the course has eight lessons in three chapters', () => {
  assert.deepEqual(course.chapters.map((c) => c.lessons.length), [3, 3, 2]);
  assert.equal(Object.keys(lessons).length, 8);
});

test('no generated text contains undefined, NaN or an empty slot', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        const blob = JSON.stringify(s, (key, value) => (typeof value === 'function' ? undefined : value));
        assert.ok(!/undefined|NaN|Infinity|\[object Object\]/.test(blob), `${id}/${step.id} seed ${k}`);
        assert.ok(!/\b1 (marbles|coins|tickets|times|rolls|flips|sections|outcomes)\b/.test(plain(`${s.text} ${s.explain} ${s.hints.join(' ')}`)), `${id}/${step.id} seed ${k}: "1 things"`);
        if (!step.gen) break;
      }
    }
  }
});

test('every choice has exactly one correct option and no duplicates; multi, match, order and bucket items are distinct', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(5 + k * 97), step.id);
        const where = `${id}/${step.id}`;
        if (s.type === 'choice' || s.type === 'multi') {
          const right = s.options.filter((o) => o.correct).length;
          if (s.type === 'choice') assert.equal(right, 1, where);   // this course has no opinion polls
          else assert.ok(right >= 1 && right < s.options.length, where);
          assert.equal(new Set(s.options.map((o) => plain(o.text))).size, s.options.length, `${where} has duplicate options`);
          for (const o of s.options) if (o.correct) assert.ok(!o.why, `${where}: a correct option carries "why it is wrong" feedback`);
        }
        if (s.type === 'match') {
          assert.equal(new Set(s.pairs.map((p) => p[0])).size, s.pairs.length, where);
          assert.equal(new Set(s.pairs.map((p) => p[1])).size, s.pairs.length, where);
        }
        if (s.type === 'order') assert.equal(new Set(s.items).size, s.items.length, where);
        if (s.type === 'bucket') assert.equal(new Set(s.items.map((it) => it.text)).size, s.items.length, where);
        if (s.type === 'numeric') {
          checkWrong(s, where);
          if (s.tolerance == null) assert.ok(typable(s.answer), `${where}: exact answer ${s.answer} cannot be typed exactly`);
        }
        if (!step.gen) break;
      }
    }
  }
});

/* ------------------------------------------- lesson 1 · what are the chances */

test('what-are-the-chances: counting marbles of one colour', () => {
  for (const s of variants('what-are-the-chances', 'count-it')) {
    const t = plain(s.text);
    const m = must(/A bag holds (\d+) (\w+), (\d+) (\w+) and (\d+) (\w+) marbles/, t);
    const bag = [];
    for (const i of [1, 3, 5]) for (let k = 0; k < Number(m[i]); k++) bag.push(m[i + 1]);
    assert.equal(new Set([m[2], m[4], m[6]]).size, 3, 'three different colours');
    const colour = must(/probability that it is (\w+)\?/, t)[1];
    const [n, d] = share(bag, (c) => c === colour);
    assert.ok(n > 0 && n < d);
    checkFraction(s, n, d, t);
    assert.ok(s.explain.includes(`\\frac{${n}}{${d}}`), 'explanation shows the count over the total');
  }
});

test('what-are-the-chances: a share as a percentage', () => {
  for (const s of variants('what-are-the-chances', 'percent')) {
    const t = plain(s.text);
    const n = Number(must(/(?:into|has|holds) (\d+) (?:equal sections|tickets|marbles)/, t)[1]);
    const m = must(/(One) of them is|(\d+) of them are|You hold (one|\d+) of them/, t);
    const word = m[1] || m[2] || m[3];
    const k = /one/i.test(word) ? 1 : Number(word);
    assert.ok(k >= 1 && k < n);
    assert.equal(s.unit, '%');
    assert.ok(Math.abs(s.answer - (100 * k) / n) < 1e-9, t);
    assert.ok(typable(s.answer), `${s.answer}% can be typed exactly`);
    assert.ok(/Give your answer as a percentage/.test(t));
    const e = must(/\\frac\{(\d+)\}\{(\d+)\} = ([\d.]+) = ([\d.]+)\\%/, s.explain).map(Number);
    assert.deepEqual(e.slice(1), [k, n, k / n, (100 * k) / n], 'the worked answer');
    checkWrong(s, t);
  }
});

test('what-are-the-chances: the missing blue marbles', () => {
  for (const s of variants('what-are-the-chances', 'missing')) {
    const t = plain(s.text);
    const red = Number(must(/There are (\d+) red marbles/, t)[1]);
    const [, a, b] = must(/\\frac\{(\d+)\}\{(\d+)\}/, t).map(Number);
    assert.equal(gcd(a, b), 1, 'the stated probability is in lowest terms');
    // brute force: the one number of blue marbles that gives red / (red + blue) = a / b
    const fits = [];
    for (let blue = 0; blue <= 500; blue++) if (red * b === a * (red + blue)) fits.push(blue);
    assert.deepEqual(fits, [s.answer], t);
    assert.ok(s.answer >= 1);
    const e = must(/\$(\d+) \\div (\d+) = (\d+)\$ marbles and the whole bag holds \$(\d+) \\times (\d+) = (\d+)\$\. That leaves \$(\d+) - (\d+) = (\d+)\$ blue/, plain(s.explain)).map(Number);
    assert.deepEqual(e.slice(1), [red, a, red / a, b, red / a, (b * red) / a, (b * red) / a, red, s.answer], 'the worked answer');
    checkWrong(s, t);
  }
});

test('what-are-the-chances: fixed steps', () => {
  // the die events are listed from least to most likely, with no ties
  const scale = fixed('what-are-the-chances', 'scale');
  const faces = [1, 2, 3, 4, 5, 6];
  const event = {
    'Rolling a 7': (f) => f === 7,
    'Rolling a 6': (f) => f === 6,
    'Rolling an even number': (f) => f % 2 === 0,
    'Rolling a number bigger than 1': (f) => f > 1,
    'Rolling a number smaller than 7': (f) => f < 7,
  };
  const counts = scale.items.map((it) => faces.filter(event[it]).length);
  assert.deepEqual(counts, [0, 1, 3, 5, 6]);
  for (const c of counts) assert.ok(scale.explain.includes(`\\frac{${c}}{6}`));

  // fraction or decimal ↔ percentage
  for (const [left, right] of fixed('what-are-the-chances', 'three-ways').pairs) {
    const f = /\\frac\{(\d+)\}\{(\d+)\}/.exec(left);
    const value = f ? Number(f[1]) / Number(f[2]) : Number(left.replace(/\$/g, ''));
    assert.ok(Math.abs(value * 100 - Number(right.replace('%', ''))) < 1e-9, `${left} = ${right}`);
  }

  // the uneven spinner: red covers half of the circle (two of four equal quarters)
  const spinner = fixed('what-are-the-chances', 'not-equal');
  assert.match(spinner.figures[0].alt, /red section covers half .* blue and the green section cover a quarter each/);
  assert.match(spinner.options.find((o) => o.correct).text, /\\frac\{1\}\{2\}/);

  const truths = fixed('what-are-the-chances', 'truths');
  assert.deepEqual(truths.options.filter((o) => o.correct).map((o) => o.text.slice(0, 22)), ['A probability of 0.25,', 'A probability can neve']);
});

test('what-are-the-chances: the marble-bag checks accept exactly the right bags', () => {
  const state = (red, blue) => { const total = red + blue; return { counts: { red, blue }, total, p: { red: total ? red / total : 0, blue: total ? blue / total : 0 } }; };
  const explore = raw('what-are-the-chances', 'explore');
  const certain = raw('what-are-the-chances', 'certain');
  const build = raw('what-are-the-chances', 'build');
  const built = [];
  for (let red = 0; red <= 12; red++) for (let blue = 0; blue <= 12; blue++) {   // 12 is the widget's cap per colour
    const st = state(red, blue);
    assert.equal(explore.check(st) === true, red === blue && red > 0, `explore ${red}/${blue}`);
    assert.equal(certain.check(st) === true, red > 0 && blue === 0, `certain ${red}/${blue}`);
    const ok = build.check(st) === true;
    assert.equal(ok, red + blue > 0 && 10 * blue === 3 * (red + blue), `build ${red}/${blue}`);
    if (ok) built.push([blue, red]);
    for (const step of [explore, certain, build]) { const res = step.check(st); assert.ok(res === true || (typeof res === 'string' && res.length > 10)); }
  }
  assert.deepEqual(built, [[3, 7]], 'exactly one bag the widget can hold is 30% blue');
  for (const step of [explore, certain, build]) {
    const c = { red: 0, blue: 0, ...step.solution.counts };
    assert.equal(step.check(state(c.red, c.blue)), true);
  }
});

/* --------------------------------------------- lesson 2 · counting outcomes */

test('counting-outcomes: probability of a total', () => {
  for (const s of variants('counting-outcomes', 'count-sum')) {
    const t = plain(s.text);
    const k = Number(must(/total is (\d+)\?/, t)[1]);
    const hit = (a, b) => a + b === k;
    checkFraction(s, diceCount(hit), 36, t);
    assert.deepEqual(pairsIn(s.explain), diceSet(hit), 'the explanation lists exactly the outcomes');
    assert.ok(s.explain.includes(`${diceCount(hit)} of the 36 outcomes`));
    // the "you forgot the order" feedback names a real pair in both orders
    for (const [, message] of s.wrong) {
      const m = /(\d) then (\d), and (\d) then (\d), are different outcomes/.exec(message);
      if (!m) continue;
      const [x, y, y2, x2] = m.slice(1).map(Number);
      assert.ok(x + y === k && x !== y && x === x2 && y === y2 && x >= 1 && y <= 6, message);
    }
    assert.match(s.feedback(diceCount(hit) / 36 + 0.003), /rounded/);
  }
});

test('counting-outcomes: probability of an event', () => {
  const seen = new Set();
  for (const s of variants('counting-outcomes', 'event-prob', 400)) {
    const t = plain(s.text);
    const phrase = must(/What is the probability that (.+)\? Give/, t)[1];
    seen.add(phrase);
    const hit = diceEvent(phrase);
    const n = diceCount(hit);
    checkFraction(s, n, 36, t);
    assert.ok(s.explain.includes(`${n} of the 36 outcomes`) && s.explain.includes(`\\frac{${n}}{36}`), t);
    // any outcomes the explanation spells out really belong to the event
    for (const p of pairsIn(s.explain)) assert.ok(diceSet(hit).includes(p), `${p} in ${t}`);
    // arithmetic such as "6 + 6 − 1", "5 × 5" in the explanation gives the count
    const sum = /: (\d+) \+ (\d+) − (\d+)\./.exec(s.explain);
    if (sum) assert.equal(Number(sum[1]) + Number(sum[2]) - Number(sum[3]), n);
    const product = /: (\d+) × (\d+)\./.exec(s.explain);
    if (product) assert.equal(Number(product[1]) * Number(product[2]), n);
    // the example in the "count both orders" feedback fits this event
    for (const [, message] of s.wrong) {
      const m = /for example (\d) then (\d), or (\d) then (\d)/.exec(message);
      if (!m) continue;
      const [x, y, y2, x2] = m.slice(1).map(Number);
      assert.ok(x === x2 && y === y2 && x !== y && hit(x, y) && hit(y, x), `${message} (${t})`);
    }
  }
  assert.equal(seen.size, 12, 'all twelve events were exercised');
});

test('counting-outcomes: fixed steps', () => {
  const totals = {};
  for (const [a, b] of DICE) totals[a + b] = (totals[a + b] || 0) + 1;
  const most = Object.keys(totals).sort((x, y) => totals[y] - totals[x])[0];
  assert.equal(fixed('counting-outcomes', 'hook').options.find((o) => o.correct).text, most);
  assert.equal(totals[7] / totals[2], 6, '"about six times as often as a 2"');
  assert.equal(Object.keys(totals).length, 11, '"the 11 totals"');

  // "a 1 and a 2" against "two 1s"
  const mixed = diceCount((a, b) => (a === 1 && b === 2) || (a === 2 && b === 1));
  assert.equal(mixed, 2 * diceCount((a, b) => a === 1 && b === 1));
  assert.match(fixed('counting-outcomes', 'one-and-two').options.find((o) => o.correct).text, /twice as likely/);

  // counting by multiplying
  const coin = ['H', 'T'];
  const die = [1, 2, 3, 4, 5, 6];
  const expected = [DICE.length, sequences(coin, 2).length, sequences(coin, 3).length, coin.length * die.length];
  assert.deepEqual(fixed('counting-outcomes', 'multiply').blanks.map((b) => b.numbers[0]), expected);

  // two coins: one head and one tail
  const [n, d] = share(sequences(coin, 2), (seq) => seq.includes('H') && seq.includes('T'));
  assert.equal(n / d, 0.5);
  assert.match(fixed('counting-outcomes', 'two-coins').options.find((o) => o.correct).text, /\\frac\{1\}\{2\}/);

  // differences of two dice
  const diffs = [0, 1, 2, 3, 4, 5].map((k) => diceCount((a, b) => Math.abs(a - b) === k));
  assert.deepEqual(diffs, [6, 10, 8, 6, 4, 2]);
  const difference = fixed('counting-outcomes', 'difference');
  assert.equal(difference.options.find((o) => o.correct).text, String(diffs.indexOf(Math.max(...diffs))));
  assert.match(difference.explain, /\*\*10\*\*[\s\S]*8, 6, 4 and 2 outcomes[\s\S]*\\frac\{10\}\{36\}/);
});

/** A dice-grid state holding exactly these outcomes. */
const gridState = (cells, possible = 36) => ({ on: cells.map(([a, b]) => (a - 1) * 6 + (b - 1)), cells, count: cells.length, possible });

/** A "tap every outcome" step accepts the brute-force set and nothing else that is one cell away from it. */
function checkGridStep(lesson, id, test, allowed = () => true) {
  const step = raw(lesson, id);
  const target = DICE.filter(([a, b]) => allowed(a, b) && test(a, b));
  assert.equal(step.check(gridState(target)), true, `${lesson}/${id}: the full set is accepted`);
  assert.deepEqual(step.solution.on.slice().sort((x, y) => x - y), gridState(target).on, `${lesson}/${id}: the stated solution is the full set`);
  assert.notEqual(step.check(gridState([])), true);
  for (let i = 0; i < target.length; i++) {
    assert.notEqual(step.check(gridState(target.filter((_, j) => j !== i))), true, `${lesson}/${id}: one cell missing`);
  }
  for (const cell of DICE.filter(([a, b]) => allowed(a, b) && !test(a, b))) {
    const res = step.check(gridState([...target, cell]));
    assert.equal(typeof res, 'string', `${lesson}/${id}: an extra cell ${cell} is rejected with feedback`);
  }
  return target.length;
}

test('dice-board steps accept exactly the right set of outcomes', () => {
  assert.equal(checkGridStep('counting-outcomes', 'grid-seven', (a, b) => a + b === 7), 6);
  assert.equal(checkGridStep('counting-outcomes', 'at-least-one-six', (a, b) => a === 6 || b === 6), 11);
  assert.equal(checkGridStep('and-or', 'and-grid', (a, b) => a >= 5 && b >= 5), 4);
  assert.equal(checkGridStep('and-or', 'or-grid', (a, b) => a >= 5 || b >= 5), 20);
  assert.equal(checkGridStep('conditional', 'shrink', (a, b) => a === 6 || b === 6), 11);
  // here the board only lets the learner tap outcomes with an even blue die
  const given = raw('conditional', 'given-even').widget.given;
  assert.equal(DICE.filter(([a, b]) => given(a, b)).length, 18);
  assert.equal(checkGridStep('conditional', 'given-even', (a, b) => a + b === 8, (a, b) => a % 2 === 0), 3);
  assert.deepEqual(DICE.filter(([a, b]) => given(a, b)), DICE.filter(([a]) => a % 2 === 0));
});

/* -------------------------------------------------- lesson 3 · the long run */

function logFactorials(n) { const lf = [0]; for (let i = 1; i <= n; i++) lf.push(lf[i - 1] + Math.log(i)); return lf; }
/** P(lo ≤ X ≤ hi) for X ~ Binomial(n, p). */
function binom(n, p, lo, hi) {
  const lf = logFactorials(n);
  let total = 0;
  for (let k = Math.max(0, lo); k <= Math.min(n, hi); k++) total += Math.exp(lf[n] - lf[k] - lf[n - k] + k * Math.log(p) + (n - k) * Math.log(1 - p));
  return total;
}

test('the-long-run: the stated chances are right', () => {
  // hook: at least 70% heads
  const ten = binom(10, 0.5, 7, 10);
  assert.ok(Math.abs(ten - 176 / 1024) < 1e-12 && Math.abs(1 / ten - 6) < 0.5, '"about once in every six tries"');
  assert.ok(binom(1000, 0.5, 700, 1000) < 1e-30);
  assert.match(fixed('the-long-run', 'hook').options.find((o) => o.correct).text, /10 flips/);
  // ten flips: exactly half "about one time in four"
  assert.ok(Math.abs(binom(10, 0.5, 5, 5) - 0.25) < 0.01);
  assert.ok(binom(10, 0.5, 3, 3) > 0.1, '30% heads is nothing unusual');
  // "almost always" between 45% and 55% after 1000 flips, between 48.5% and 51.5% after 10,000
  assert.ok(binom(1000, 0.5, 450, 550) > 0.99);
  assert.ok(binom(10000, 0.5, 4850, 5150) > 0.99);
  assert.ok(binom(10000, 0.5, 5000, 5000) < 0.01, 'exactly 5,000 heads: less than one time in a hundred');
  // the two hospitals: more than 60% boys
  const small = binom(15, 0.5, 10, 15);   // more than 9 of 15
  const large = binom(45, 0.5, 28, 45);   // more than 27 of 45
  assert.ok(Math.abs(1 / small - 7) < 0.5, '"about one day in seven"');
  assert.ok(Math.abs(1 / large - 15) < 0.5, '"about one day in fifteen"');
  assert.match(fixed('the-long-run', 'hospital').options.find((o) => o.correct).text, /small hospital/);
});

test('the-long-run: expected counts', () => {
  for (const s of variants('the-long-run', 'expected-count')) {
    const t = plain(s.text);
    const n = int(must(/([\d,]+) times/, t)[1]);
    let p;
    if (/A fair die is rolled/.test(t)) p = share([1, 2, 3, 4, 5, 6], (f) => f === 6);
    else if (/A fair coin is flipped/.test(t)) p = share(['H', 'T'], (f) => f === 'H');
    else if (/spinner has four equal sections, one of them red/.test(t)) p = share(['red', 'x', 'y', 'z'], (f) => f === 'red');
    else if (/Two dice are rolled and added/.test(t)) {
      p = [diceCount((a, b) => a + b === 7), 36];
      assert.ok(/total of 7 has probability one sixth/.test(t) && p[0] * 6 === p[1]);
    } else {
      const m = must(/A bag holds (\d+) red marbles and (\d+) blue ones\. You draw a marble, note its colour and put it back/, t);
      p = [Number(m[1]), Number(m[1]) + Number(m[2])];
      assert.match(t, /expect to draw red/);
    }
    const expected = (n * p[0]) / p[1];
    assert.ok(Number.isInteger(expected), `${t}: a whole number`);
    assert.equal(s.answer, expected, t);
    const f = lowest(p[0], p[1]).split('/');
    assert.ok(s.explain.includes(`\\frac{${f[0]}}{${f[1]}} \\times ${n} = ${expected}`), s.explain);
    checkWrong(s, t);
  }
});

test('the-long-run: the next go after a streak', () => {
  for (const s of variants('the-long-run', 'no-memory')) {
    const t = plain(s.text);
    let d;
    if (/fair die .* without a single six\. What is the probability that the next roll is a six/.test(t)) d = 6;
    else if (/fair die has just shown a six \d+ times in a row\. What is the probability that the next roll is a six/.test(t)) d = 6;
    else if (/fair coin has just landed tails \d+ times in a row\. What is the probability that the next flip is heads/.test(t)) d = 2;
    else d = Number(must(/A spinner has (\d+) equal sections, one of them green\. In the last \d+ spins it never stopped on green\. What is the probability that the next spin stops on green/, t)[1]);
    checkFraction(s, 1, d, t);
    // feedback: a rounded right answer is not told off for the gambler's fallacy
    const rounded = Math.round(100 / d) / 100;
    if (Math.abs(rounded - 1 / d) > s.tolerance) assert.match(s.feedback(rounded), /rounded/, `${rounded} for 1/${d}`);
    assert.match(s.feedback(0.9), /more than the usual chance/);
    assert.match(s.feedback(0.01), /less than the usual chance/);
    assert.match(s.feedback(50), /between 0 and 1/);
  }
});

test('the-long-run: a lucky start is swamped', () => {
  for (const s of variants('the-long-run', 'dilute')) {
    const t = plain(s.text);
    const h0 = Number(must(/(\d+) heads in its first 10 flips/, t)[1]);
    const more = Number(must(/flipped (\d+) more times/, t)[1]);
    const half = Number(must(/half of those are heads: (\d+)/, t)[1]);
    const total = int(must(/share of all ([\d,]+) flips/, t)[1]);
    assert.equal(half * 2, more);
    assert.equal(total, 10 + more);
    assert.ok(h0 <= 10);
    const pctHeads = (100 * (h0 + half)) / total;
    assert.ok(Math.abs(s.answer - pctHeads) < 1e-9, t);
    assert.ok(typable(s.answer) && s.answer > 50 && s.unit === '%');
    assert.ok(s.explain.includes(`${h0} + ${half} = ${h0 + half}`));
    checkWrong(s, t);
  }
});

test('the-long-run: activity checks', () => {
  const ten = raw('the-long-run', 'ten-flips');
  assert.equal(ten.check({ runs: 3, trials: 10 }), true);
  assert.equal(ten.check({ runs: 4, trials: 0 }), true);
  assert.notEqual(ten.check({ runs: 3, trials: 9 }), true);
  assert.notEqual(ten.check({ runs: 1, trials: 10 }), true);
  for (const [id, need] of [['thousand', 1000], ['streak-lab', 50000]]) {
    const step = raw('the-long-run', id);
    assert.equal(step.check({ trials: need }), true);
    assert.notEqual(step.check({ trials: need - 1 }), true);
    assert.ok(step.widget.max >= need && step.widget.buttons.every((b) => b <= step.widget.max));
  }
  const sort = fixed('the-long-run', 'sort');
  assert.deepEqual(sort.items.map((it) => it.bucket), [1, 0, 1, 0, 0, 1]);
});

/* ----------------------------------------------------- lesson 4 · and, or, not */

test('and-or: fixed numbers', () => {
  // four rolls, at least one six
  const [hit, all] = share(sequences([1, 2, 3, 4, 5, 6], 4), (seq) => seq.includes(6));
  assert.deepEqual([hit, all], [671, 1296]);
  const hook = fixed('and-or', 'hook');
  assert.ok(Math.abs(hook.answer - (100 * hit) / all) < 0.5, 'the slider answer is the true chance to the nearest percent');
  const calc = fixed('and-or', 'which-calc');
  assert.match(calc.options.find((o) => o.correct).text, /1 - \\left\(\\frac\{5\}\{6\}\\right\)\^4/);
  assert.ok(Math.abs(1 - (5 / 6) ** 4 - hit / all) < 1e-12);
  assert.ok(calc.explain.includes('\\frac{625}{1296}') && Math.abs(625 / 1296 - 0.482) < 0.0005 && Math.abs(hit / all - 0.518) < 0.0005);
  assert.ok(7 * (1 / 6) > 1, 'the shortcut gives more than 100% for seven rolls');
  // the simulation's event is the same one
  const sim = raw('and-or', 'simulate').widget;
  assert.deepEqual(share(sequences([1, 2, 3, 4, 5, 6], sim.dice), (seq) => sim.event(seq)), [671, 1296]);
  assert.ok(binom(1000, hit / all, 490, 550) > 0.9, '"usually between 49% and 55%" after 1000 rounds');

  // complement rule
  const not = fixed('and-or', 'not');
  assert.equal(not.blanks[0].numbers[0], 100 - 30);
  assert.ok(Math.abs(not.blanks[1].numbers[0] - 5 / 6) < 1e-12);
  for (const alt of not.blanks[1].numbers) assert.ok(Math.abs(alt - 5 / 6) < 0.005);

  // the tree and the "or" picture
  const high = (v) => v >= 5;
  assert.equal(diceCount((a, b) => high(a) && high(b)), 4);            // 1/9
  assert.equal(diceCount((a, b) => high(a) && !high(b)), 8);           // 2/9
  assert.equal(diceCount((a, b) => !high(a) && !high(b)), 16);         // 4/9
  assert.equal(diceCount((a, b) => high(a) || high(b)), 12 + 12 - 4);
  assert.deepEqual(fixed('and-or', 'or-rule').figures[0].legend.map((l) => Number(/\((\d+)\)/.exec(l.label)[1])), [8, 8, 4]);
  assert.equal(diceCount((a, b) => a + b === 2 || a + b === 12), 2);

  // de Méré's second bet
  const mere = fixed('and-or', 'de-mere');
  const none = (35 / 36) ** 24;
  assert.ok(Math.abs(mere.blanks[0].numbers[0] - diceCount((a, b) => !(a === 6 && b === 6)) / 36) < 1e-12);
  assert.equal(mere.blanks[1].numbers[0], 24);
  assert.ok(Math.abs(none - 0.509) < 0.0005, '"about 0.509"');
  assert.ok(Math.abs(mere.blanks[2].numbers[0] - (1 - none)) < 0.0005, '"about 0.491"');
  for (const alt of mere.blanks[2].numbers) assert.ok(Math.abs(alt - (1 - none)) < 0.005);
  assert.ok(mere.blanks[2].numbers.some((v) => Math.abs(v - parseNumber('0.4914')) < 1e-9), 'a more precise 0.4914 is accepted too');
  assert.ok(1 - none < 0.5 && hit / all > 0.5, 'the two bets sit on opposite sides of one half');
});

test('and-or: independent events, multiplied', () => {
  const coinDie = sequences(['heads', 'tails'], 1).flatMap(([c]) => [1, 2, 3, 4, 5, 6].map((d) => [c, d]));
  const dieTest = { 'a six': (d) => d === 6, 'an even number': (d) => d % 2 === 0, 'a number greater than 4': (d) => d > 4, 'a number less than 6': (d) => d < 6 };
  const kinds = new Set();
  for (const s of variants('and-or', 'and-practice', 300)) {
    const t = plain(s.text);
    let frac;
    let m;
    if ((m = /You flip a coin and roll a die\. What is the probability of getting (heads|tails) and (.+)\?/.exec(t))) {
      kinds.add('coin-die');
      assert.ok(dieTest[m[2]], `unknown die event "${m[2]}"`);
      frac = share(coinDie, ([c, d]) => c === m[1] && dieTest[m[2]](d));
    } else if ((m = /A spinner has (\d+) equal sections, one of them red\. You spin it twice\. What is the probability that it stops on red both times\?/.exec(t))) {
      kinds.add('spinner');
      frac = share(sequences(Array.from({ length: Number(m[1]) }, (_, i) => i), 2), (seq) => seq.every((v) => v === 0));
    } else if ((m = /You flip a fair coin (\d+) times\. What is the probability of getting heads every time\?/.exec(t))) {
      kinds.add('coins');
      frac = share(sequences(['H', 'T'], Number(m[1])), (seq) => seq.every((v) => v === 'H'));
    } else {
      m = must(/A bag holds (\d+) red and (\d+) blue marbles?\. You draw one marble, put it back, and draw again\. What is the probability of drawing red both times\?/, t);
      kinds.add('bag');
      const bag = [...Array(Number(m[1])).fill('red'), ...Array(Number(m[2])).fill('blue')];
      frac = share(sequences(bag, 2), (seq) => seq.every((v) => v === 'red'));
    }
    checkFraction(s, frac[0], frac[1], t);
    const last = [...s.explain.matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)].pop();
    assert.equal(lowest(Number(last[1]), Number(last[2])), lowest(frac[0], frac[1]), 'the worked product ends on the answer');
    assert.match(s.feedback(frac[0] / frac[1] + 0.004), /rounded/);
  }
  assert.equal(kinds.size, 4);
});

test('and-or: multiples of a or of b', () => {
  for (const s of variants('and-or', 'or-practice')) {
    const t = plain(s.text);
    const n = Number(must(/numbered 1 to (\d+)/, t)[1]);
    const [, a, b] = must(/multiple of (\d+) or a multiple of (\d+)/, t).map(Number);
    const cards = Array.from({ length: n }, (_, i) => i + 1);
    const inA = cards.filter((c) => c % a === 0);
    const inB = cards.filter((c) => c % b === 0);
    const both = inA.filter((c) => inB.includes(c));
    const either = cards.filter((c) => c % a === 0 || c % b === 0);
    assert.ok(both.length >= 1, 'there is an overlap to trip over');
    checkFraction(s, either.length, n, t);
    const e = plain(s.explain);
    const m = must(/Multiples of \d+: (\d+)\. Multiples of \d+: (\d+)\. In both lists \(the multiples of (\d+)\): (\d+)\. So \$(\d+) \+ (\d+) - (\d+) = (\d+)\$/, e).map(Number);
    assert.deepEqual(m.slice(1), [inA.length, inB.length, both[0], both.length, inA.length, inB.length, both.length, either.length], e);
    for (const [, message] of s.wrong) {
      const eg = /numbers such as (\d+) are in both lists|(\d+) is in both lists/.exec(message);
      if (!eg) continue;
      const v = Number(eg[1] || eg[2]);
      assert.ok(v % a === 0 && v % b === 0 && v <= n, message);
      assert.equal(!!eg[2], both.length === 1, 'singular only when exactly one card is in both lists');
    }
  }
});

test('and-or: at least one', () => {
  for (const s of variants('and-or', 'at-least-one')) {
    const t = plain(s.text);
    let frac;
    let m;
    if ((m = /You flip a fair coin (\d+) times\. What is the probability of at least one head\?/.exec(t))) {
      frac = share(sequences(['H', 'T'], Number(m[1])), (seq) => seq.includes('H'));
    } else if ((m = /You roll a die (twice|three times)\. What is the probability of at least one six\?/.exec(t))) {
      frac = share(sequences([1, 2, 3, 4, 5, 6], m[1] === 'twice' ? 2 : 3), (seq) => seq.includes(6));
    } else {
      m = must(/A spinner has (\d+) equal sections, one of them red\. You spin it twice\. What is the probability that it stops on red at least once\?/, t);
      frac = share(sequences(Array.from({ length: Number(m[1]) }, (_, i) => i), 2), (seq) => seq.includes(0));
    }
    checkFraction(s, frac[0], frac[1], t);
    const e = [...s.explain.matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)].map((x) => [Number(x[1]), Number(x[2])]);
    const [nNone, dAll] = e[1];   // P(none), unreduced
    assert.deepEqual([dAll - nNone, dAll], frac, 'P(none) in the explanation is the complement');
    assert.deepEqual(e[e.length - 1], frac, 'the explanation ends on the answer');
  }
});

/* ------------------------------------------------------ lesson 5 · given that */

test('conditional: fixed numbers', () => {
  const six = (a, b) => a === 6 || b === 6;
  const hook = fixed('conditional', 'hook');
  const nSix = diceCount(six);
  assert.equal(nSix, 11);
  assert.equal(diceCount((a, b) => six(a, b) && a === 6 && b === 6), 1);
  assert.match(hook.options.find((o) => o.correct).text, /\\frac\{1\}\{11\}/);
  // total of 8 given an even blue die
  assert.equal(diceCount((a, b) => a % 2 === 0 && a + b === 8), 3);
  assert.equal(diceCount((a) => a % 2 === 0), 18);
  assert.equal(diceCount((a, b) => a + b === 8), 5);
  // which-way-round table
  const flip = fixed('conditional', 'flip');
  const cells = flip.text.split('\n').filter((l) => /^\s*\|\s*\*\*/.test(l)).map((l) => l.split('|').map((c) => c.trim()).filter(Boolean).slice(1).map(Number));
  const [[a, b, r0], [c, d, r1], [c0, c1, total]] = cells;
  assert.deepEqual([a + b, c + d, a + c, b + d, r0 + r1], [r0, r1, c0, c1, total]);
  assert.equal(total, 200);
  assert.deepEqual(flip.blanks.map((x) => x.numbers[0]), [a + c, a + b], 'given a dog: the dog column; given a daily walk: the walking row');
  assert.ok(flip.explain.includes(`\\frac{${a}}{${a + c}} = ${Math.round((100 * a) / (a + c))}\\%`));
  assert.ok(flip.explain.includes(`\\frac{${a}}{${a + b}} \\approx ${Math.round((100 * a) / (a + b))}\\%`));
});

test('conditional: what a blue 6 does to other events', () => {
  const event = {
    'The total is 12': (a, b) => a + b === 12,
    'The total is 10 or more': (a, b) => a + b >= 10,
    'The total is 5': (a, b) => a + b === 5,
    'Both dice show odd numbers': (a, b) => a % 2 === 1 && b % 2 === 1,
    'The total is 7': (a, b) => a + b === 7,
    'The orange die shows a 3': (a, b) => b === 3,
    'The dice show the same number': (a, b) => a === b,
  };
  const step = fixed('conditional', 'shift');
  assert.deepEqual(step.buckets, ['More likely now', 'Less likely now', 'No change']);
  assert.equal(step.items.length, Object.keys(event).length);
  for (const item of step.items) {
    const test = event[item.text];
    assert.ok(test, item.text);
    const before = diceCount(test) * 6;                               // out of 36, scaled to a common denominator of 216
    const after = diceCount((a, b) => a === 6 && test(a, b)) * 36;    // out of 6
    assert.equal(item.bucket, after > before ? 0 : after < before ? 1 : 2, item.text);
  }
});

test('conditional: dice questions', () => {
  const seen = new Set();
  for (const s of variants('conditional', 'cond-dice', 400)) {
    const t = plain(s.text);
    const m = must(/You are told that (.+?)\. Given this, what is the probability that (.+)\? Give/, t);
    seen.add(`${m[1]} | ${m[2]}`);
    const B = diceEvent(m[1]);
    const A = diceEvent(m[2]);
    const both = (a, b) => A(a, b) && B(a, b);
    const nB = diceCount(B);
    const nBoth = diceCount(both);
    assert.ok(nBoth > 0 && nBoth < nB, 'neither impossible nor certain');
    checkFraction(s, nBoth, nB, t);
    const e = plain(s.explain);
    assert.ok(e.includes(`Still possible: ${nB} outcomes`), e);
    assert.deepEqual(pairsIn(/Among them,.*$/.exec(e)[0]), diceSet(both), 'the explanation lists the outcomes that fit');
    if (nB <= 12) assert.deepEqual(pairsIn(/Still possible:.*?Among them/.exec(e)[0]), diceSet(B));
    // the diagnosed mistakes are what they claim to be
    for (const [value, message] of s.wrong) {
      if (/out of all 36/.test(message)) assert.ok(Math.abs(value - nBoth / 36) < 1e-12);
      if (/ignores what you were told/.test(message)) assert.ok(Math.abs(value - diceCount(A) / 36) < 1e-12);
      if (/reverse question/.test(message)) assert.ok(Math.abs(value - nBoth / diceCount(A)) < 1e-12);
    }
  }
  assert.equal(seen.size, 10, 'all ten questions were exercised');
});

test('conditional: two-way tables', () => {
  // which row or column each phrase points at, written out independently of the lesson
  const ROW = { 'the student cycles to school': 'Cyclists', 'they cycle to school': 'Cyclists', 'the pet is a dog': 'Dogs', 'it is a dog': 'Dogs', 'the book is fiction': 'Fiction', 'it is fiction': 'Fiction' };
  const COL = { 'the student plays an instrument': 'Instrument', 'they play an instrument': 'Instrument', 'the pet has a microchip': 'Chip', 'it has a microchip': 'Chip', 'the book is out on loan': 'On loan', 'it is out on loan': 'On loan' };
  let byRow = 0;
  for (const s of variants('conditional', 'table', 300)) {
    const lines = s.text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
    const header = lines[0].split('|').map((c) => c.trim()).filter(Boolean);
    const body = lines.slice(2).map((l) => l.split('|').map((c) => c.trim().replace(/\*\*/g, '')).filter(Boolean));
    const [[row0, a, b, r0], [, c, d, r1], [, c0, c1, total]] = body.map((r) => [r[0], ...r.slice(1).map(Number)]);
    assert.deepEqual([a + b, c + d, a + c, b + d, r0 + r1, c0 + c1], [r0, r1, c0, c1, total, total], 'the table adds up');
    const t = plain(s.text);
    assert.equal(int(must(/(\d+) (?:students|pets|of its books)/, t)[1]), total, 'the intro states the grand total');
    const m = must(/Given that (.+?), what is the probability that (.+?)\? Give/, t);
    let group;
    if (ROW[m[1]]) {
      assert.equal(ROW[m[1]], row0); assert.equal(COL[m[2]], header[0]);
      group = a + b; byRow++;
    } else {
      assert.equal(COL[m[1]], header[0], m[1]); assert.equal(ROW[m[2]], row0, m[2]);
      group = a + c;
    }
    checkFraction(s, a, group, t);
    assert.ok(a > 0 && a < group);
    assert.ok(plain(s.explain).includes(`${group} `) && s.explain.includes(`\\frac{${a}}{${group}}`));
    // the tempting wrong answers are clearly different from the right one
    for (const v of [a / total, a / (ROW[m[1]] ? a + c : a + b), group / total]) assert.ok(Math.abs(v - a / group) > 0.01, t);
  }
  assert.ok(byRow > 60 && byRow < 240, 'both directions are asked');
});

test('conditional: which way round is larger', () => {
  const larger = [
    /has four legs, given that it is a dog$/,
    /can swim, given that they are an Olympic swimmer$/,
    /is wet, given that it is raining$/,
    /is even, given that it is a multiple of 4$/,
  ];
  const seen = new Set();
  for (const s of variants('conditional', 'which-bigger')) {
    const right = s.options.filter((o) => o.correct);
    assert.equal(right.length, 1);
    const text = plain(right[0].text);
    const which = larger.findIndex((re) => re.test(text));
    assert.ok(which >= 0, text);
    seen.add(which);
    assert.match(s.options[2].text, /^Neither/);
    assert.equal(s.shuffle, false);
  }
  assert.equal(seen.size, 4);
  const numbers = Array.from({ length: 1000 }, (_, i) => i + 1);
  const even = numbers.filter((v) => v % 2 === 0);
  const fours = numbers.filter((v) => v % 4 === 0);
  assert.equal(fours.filter((v) => v % 2 === 0).length / fours.length, 1);
  assert.equal(even.filter((v) => v % 4 === 0).length / even.length, 0.5);
});

test('conditional: two reds without replacement', () => {
  for (const s of variants('conditional', 'no-replace')) {
    const t = plain(s.text);
    const [, red, blue] = must(/A bag holds (\d+) red and (\d+) blue marbles\. You take out two marbles, one after the other, without putting the first one back/, t).map(Number);
    const bag = [...Array(red).fill('red'), ...Array(blue).fill('blue')];
    let hit = 0;
    let all = 0;
    for (let i = 0; i < bag.length; i++) for (let j = 0; j < bag.length; j++) {
      if (i === j) continue;
      all++;
      if (bag[i] === 'red' && bag[j] === 'red') hit++;
    }
    checkFraction(s, hit, all, t);
    assert.deepEqual(s.figures[0].marbles, { red, blue });
    assert.ok(s.explain.includes(`\\frac{${red}}{${red + blue}} \\times \\frac{${red - 1}}{${red + blue - 1}}`));
    // the with-replacement mistake is diagnosed as such
    const withReplacement = s.wrong.find(([, message]) => /went back into the bag/.test(message));
    assert.ok(Math.abs(withReplacement[0] - (red / (red + blue)) ** 2) < 1e-12);
  }
});

/* --------------------------------------------------- lesson 6 · the base rate */

/** Whole people in a crowd of 1000, the way the icon-array widget counts them. */
function crowd(base, sens, fpr, n = 1000) {
  const ill = Math.round(n * base);
  const truePos = Math.round(ill * sens);
  const falsePos = Math.round((n - ill) * fpr);
  return { ill, healthy: n - ill, truePos, falsePos, positives: truePos + falsePos, ppv: truePos / (truePos + falsePos) };
}

test('bayes: the opening test, the second test and the scanner', () => {
  const exact = (0.01 * 0.9) / (0.01 * 0.9 + 0.99 * 0.09);
  const hook = fixed('bayes', 'hook');
  assert.ok(Math.abs(hook.answer - 100 * exact) < 0.5, 'the slider answer is the true chance to the nearest percent');
  const c = crowd(0.01, 0.9, 0.09);
  assert.deepEqual([c.ill, c.healthy, c.truePos, c.falsePos, c.positives], [10, 990, 9, 89, 98]);
  const seeIt = raw('bayes', 'see-it');
  assert.deepEqual([seeIt.widget.base, seeIt.widget.sens, seeIt.widget.fpr], [0.01, 0.9, 0.09]);
  assert.match(plain(seeIt.explain), /98 people test positive, but only 9 of them are ill\. The other 89/);
  assert.ok(seeIt.explain.includes('\\frac{9}{98}') && Math.round((100 * 9) / 98) === 9);
  assert.equal(seeIt.check({ stage: 3 }), true);
  assert.notEqual(seeIt.check({ stage: 2 }), true);
  assert.ok(Math.abs(c.falsePos / c.truePos - 10) < 0.5, '"ten to one"');

  // a second, independent positive result
  const twice = (0.01 * 0.9 ** 2) / (0.01 * 0.9 ** 2 + 0.99 * 0.09 ** 2);
  assert.ok(Math.abs(twice - 0.5) < 0.01);
  assert.match(fixed('bayes', 'second-test').options.find((o) => o.correct).text, /About 50%/);

  // the airport scanner
  const flagged = (1e-5 * 0.99) / (1e-5 * 0.99 + (1 - 1e-5) * 0.02);
  assert.ok(Math.abs(1 / flagged - 2000) < 50, '"one flagged bag in 2,000"');
  assert.match(fixed('bayes', 'scanner').options.find((o) => o.correct).text, /harmless/);
});

test('bayes: the base-rate slider passes exactly when ill outnumber healthy among the positives', () => {
  const step = raw('bayes', 'base-rate');
  const { sens, fpr } = step.widget;
  let first = null;
  for (let pctBase = 1; pctBase <= 50; pctBase++) {   // the slider runs from 1% to 50% in steps of 1%
    const c = crowd(pctBase / 100, sens, fpr);
    const res = step.check({ ...c, base: pctBase / 100 });
    assert.equal(res === true, c.truePos > c.falsePos, `base rate ${pctBase}%`);
    if (res === true && first == null) first = pctBase;
    if (res !== true) assert.ok(res.includes(`${c.truePos} of the ${c.positives} positives`));
  }
  assert.equal(first, 10, '"once about 1 person in 10 is ill"');
  assert.ok(Math.abs(fpr / (sens + fpr) - 1 / 11) < 1e-12, 'the exact break-even base rate is 1 in 11');
  const sol = crowd(step.solution.base, sens, fpr);
  assert.equal(step.check(sol), true);
});

test('bayes: counting through 1000 people', () => {
  for (const s of variants('bayes', 'do-it')) {
    const t = plain(s.text);
    const [base, sens, fpr] = [...t.matchAll(/(\d+)%/g)].map((m) => Number(m[1]));
    assert.match(t, /(\d+)% of people have the illness\. The test is positive for (\d+)% of the people who are ill, and for (\d+)% of the people who are healthy/);
    const ill = (1000 * base) / 100;
    const healthy = 1000 - ill;
    const truePos = (ill * sens) / 100;
    const falsePos = (healthy * fpr) / 100;
    for (const v of [ill, truePos, falsePos]) assert.ok(Number.isInteger(v), `${t}: whole people`);
    assert.deepEqual(s.blanks.map((b) => b.numbers), [[ill], [healthy], [truePos], [falsePos], [truePos + falsePos]], t);
    const share100 = Math.round((100 * truePos) / (truePos + falsePos));
    assert.ok(s.explain.includes(`\\frac{${truePos}}{${truePos + falsePos}} \\approx ${share100}\\%`), s.explain);
    assert.ok(Math.abs((100 * truePos) / (truePos + falsePos) - share100) > 1e-9, '"≈" is honest: the share is not a whole percentage');
  }
});

test('bayes: from a test result to a probability', () => {
  const stories = new Set();
  for (const s of variants('bayes', 'compute', 300)) {
    const t = plain(s.text);
    const m = /A disease affects (\d+)% of the people who are screened for it\. The test detects (\d+)% of the cases, and it gives a false alarm to (\d+)% of the people who do not have the disease\. Someone tests positive\. What is the probability that they have the disease\?/.exec(t)
      || /(\d+)% of the emails arriving at an office are spam\. The filter flags (\d+)% of the spam, and it wrongly flags (\d+)% of the wanted emails\. An email has been flagged\. What is the probability that it really is spam\?/.exec(t)
      || must(/(\d+)% of the parts coming off a production line are faulty\. A scanner flags (\d+)% of the faulty parts, and it wrongly flags (\d+)% of the good ones\. A part has been flagged\. What is the probability that it really is faulty\?/, t);
    stories.add(/disease|spam|faulty/.exec(t)[0]);
    const [base, sens, fpr] = m.slice(1).map(Number);
    // Bayes' rule in whole numbers: P = base·sens / (base·sens + (100 − base)·fpr)
    const num = base * sens;
    const den = base * sens + (100 - base) * fpr;
    checkFraction(s, num, den, t);
    const pctText = Math.round((100 * num) / den);
    assert.ok(s.explain.includes(`\\approx ${pctText}\\%`), s.explain);
    // the hint's and the explanation's head-count is the same computation on 1000 cases
    const ill = 10 * base;
    const truePos = (ill * sens) / 100;
    const falsePos = ((1000 - ill) * fpr) / 100;
    assert.ok(Number.isInteger(truePos) && Number.isInteger(falsePos));
    assert.ok(plain(s.hints[1]).startsWith(`${ill} `) && s.hints[1].includes(`${truePos} of those`) && s.hints[1].includes(`${falsePos} of them`), s.hints[1]);
    assert.ok(!/(are spam|are faulty)[^.]*\. The other \d+ do not/.test(s.hints[1]), s.hints[1]);
    assert.ok(s.hints[2].includes(`${truePos} + ${falsePos}`));
    assert.ok(s.explain.includes(`\\frac{${truePos}}{${truePos + falsePos}}`));
    // the classic mix-ups are all rejected
    for (const mixUp of [sens / 100, 1 - fpr / 100, base / 100]) assert.ok(Math.abs(mixUp - num / den) > 2 * s.tolerance, t);
    assert.match(s.feedback(num / den + 0.0055), /rounded/);
  }
  assert.equal(stories.size, 3);
});

/* -------------------------------------------------- lesson 7 · expected value */

test('expected-value: the two wheels', () => {
  const ev = (wheel) => { const w = wheel.reduce((t, o) => t + o.p, 0); return wheel.reduce((t, o) => t + (o.p * o.prize) / w, 0); };
  const gold = raw('expected-value', 'play').widget;
  assert.ok(Math.abs(ev(gold.outcomes) - 2) < 1e-12 && gold.price === 3, 'expected prize 2, price 3: −1 per spin');
  assert.equal(gold.outcomes.reduce((t, o) => t + o.p, 0), gold.slices);
  assert.match(fixed('expected-value', 'hook').options.find((o) => o.correct).text, /shrinks/);
  const sdPerGame = Math.sqrt((1 / 6) * 12 ** 2 - 2 ** 2);
  assert.ok(Math.abs(sdPerGame * Math.sqrt(500) - 100) < 1, '"give or take a hundred" after 500 games');

  const fair = raw('expected-value', 'fair');
  const payout = ev(fair.widget.outcomes);
  assert.equal(payout, 4);
  assert.match(plain(fair.text), /12 coins on green and 4 coins on blue \(a quarter of the wheel each\), and nothing on red/);
  const shares = Object.fromEntries(fair.widget.outcomes.map((o) => [o.label, [o.p / 4, o.prize]]));
  assert.deepEqual(shares, { Red: [0.5, 0], Blue: [0.25, 4], Green: [0.25, 12] });
  const { min, max, step } = fair.widget.priceEdit;
  for (let price = min; price <= max; price += step) {
    for (const plays of [0, 299, 300, 5000]) {
      const res = fair.check({ price, payout, ev: payout - price, fair: Math.abs(payout - price) < 1e-9, plays });
      assert.equal(res === true, price === payout && plays >= 300, `price ${price}, ${plays} games`);
      if (price > payout) assert.match(res, /players lose/);
      if (price < payout) assert.match(res, /players win/);
    }
  }
  assert.equal(fair.solution.price, payout);

  const die = fixed('expected-value', 'die-game');
  assert.equal(die.answer, [1, 2, 3, 4, 5, 6].reduce((t, v) => t + v, 0) / 6);
});

test('expected-value: expected prize from a table or a lucky dip', () => {
  let wheels = 0;
  for (const s of variants('expected-value', 'table-ev', 300)) {
    const t = plain(s.text);
    let expected;
    let prizes;
    if (/A wheel pays these prizes/.test(t)) {
      wheels++;
      const rows = [...s.text.matchAll(/\| (\w+) \| \$\\frac\{(\d+)\}\{(\d+)\}\$ \| (\d+) coins \|/g)].map((m) => ({ n: Number(m[2]), d: Number(m[3]), prize: Number(m[4]) }));
      assert.equal(rows.length, 3);
      const common = rows.reduce((l, r) => (l * r.d) / gcd(l, r.d), 1);
      assert.equal(rows.reduce((sum, r) => sum + (r.n * common) / r.d, 0), common, 'the chances add up to 1');
      for (const r of rows) assert.equal(gcd(r.n, r.d), 1);
      expected = rows.reduce((sum, r) => sum + (r.n * common * r.prize) / r.d, 0) / common;
      prizes = rows.map((r) => r.prize);
      const terms = /= ([\d +]+) = (\d+)\$ coins per spin/.exec(s.explain);
      assert.deepEqual(terms[1].split(' + ').map(Number), rows.map((r) => (r.n * r.prize) / r.d), 'each product in the explanation');
      for (const [value, message] of s.wrong) if (/top prize/.test(message)) assert.equal(value, Math.max(...prizes), `${t}: "top prize" feedback`);
    } else {
      const m = must(/A lucky dip holds (\d+) envelopes\. (\d+) are empty, (\d+) contain (\d+) coins each, and (\d+) contain (\d+) coins each\. You draw one at random/, t).map(Number);
      assert.equal(m[2] + m[3] + m[5], m[1], 'the envelopes add up');
      const dip = [...Array(m[2]).fill(0), ...Array(m[3]).fill(m[4]), ...Array(m[5]).fill(m[6])];
      expected = dip.reduce((sum, v) => sum + v, 0) / dip.length;
      prizes = [0, m[4], m[6]];
    }
    assert.ok(Math.abs(s.answer - expected) < 1e-9, `${t}: answer ${s.answer}, recomputed ${expected}`);
    assert.ok(typable(s.answer) && s.unit === 'coins');
    assert.ok(expected > Math.min(...prizes) && expected < Math.max(...prizes));
    assert.ok(new RegExp(`= ${String(s.answer).replace('.', '\\.')}\\$ coins`).test(s.explain), s.explain);
    checkWrong(s, t);
  }
  assert.ok(wheels > 90 && wheels < 210);
});

test('expected-value: what a game is worth after paying for it', () => {
  const kinds = new Set();
  for (const s of variants('expected-value', 'net-ev', 300)) {
    const t = plain(s.text);
    let expected;
    let m;
    if ((m = /A raffle sells (\d+) tickets at (\d+) coins each\. One ticket, drawn at random, wins the only prize: ([\d,]+) coins/.exec(t))) {
      kinds.add('raffle');
      const [tickets, price, prize] = [Number(m[1]), Number(m[2]), int(m[3])];
      // every ticket: pays its price, and one of them collects the prize
      const results = Array.from({ length: tickets }, (_, i) => (i === 0 ? prize : 0) - price);
      expected = results.reduce((sum, v) => sum + v, 0) / tickets;
      assert.ok(expected < 0, 'a raffle that raises money');
      assert.match(s.explain, /every ticket loses money/);
    } else if ((m = /A game costs (\d+) coins\. You roll one die: a six wins (\d+) coins, anything else wins nothing/.exec(t))) {
      kinds.add('die');
      const [price, prize] = [Number(m[1]), Number(m[2])];
      expected = [1, 2, 3, 4, 5, 6].reduce((sum, f) => sum + (f === 6 ? prize : 0) - price, 0) / 6;
      assert.match(s.explain, expected > 0 ? /favours the player/ : expected < 0 ? /the player loses/ : /A fair game/);
    } else {
      m = must(/bet on a fair coin\. Heads: your friend pays you (\d+) coins\. Tails: you pay your friend (\d+) coins/, t);
      kinds.add('coin');
      expected = (Number(m[1]) - Number(m[2])) / 2;
      assert.notEqual(expected, 0);
      assert.match(s.explain, expected > 0 ? /favours you\./ : /favours your friend/);
    }
    assert.ok(Math.abs(s.answer - expected) < 1e-9, `${t}: answer ${s.answer}, recomputed ${expected}`);
    assert.ok(typable(s.answer) && s.unit === 'coins');
    assert.match(t, /Type a loss as a negative number/);
    assert.equal(s.keyboard, 'full', 'the keypad must allow a minus sign');
    checkWrong(s, t);
  }
  assert.equal(kinds.size, 3);
});

test('expected-value: the two-dice game', () => {
  for (const s of variants('expected-value', 'dice-game')) {
    const t = plain(s.text);
    const price = Number(must(/costs (\d+) coins a go/, t)[1]);
    const [, double, seven] = must(/A double wins (\d+) coins, a total of 7 wins (\d+) coins, and anything else wins nothing/, t).map(Number);
    assert.equal(diceCount((a, b) => a === b && a + b === 7), 0, 'a roll cannot be both');
    const expected = DICE.reduce((sum, [a, b]) => sum + (a === b ? double : a + b === 7 ? seven : 0) - price, 0) / 36;
    assert.ok(Math.abs(s.answer - expected) < 1e-9, `${t}: answer ${s.answer}, recomputed ${expected}`);
    assert.ok(typable(s.answer));
    assert.equal(s.keyboard, 'full');
    checkWrong(s, t);
  }
});

test('expected-value: fixed steps', () => {
  const order = fixed('expected-value', 'order-ev');
  const values = order.items.map((item) => {
    const m = /A (\d+)% chance of winning ([\d,]+) coins/.exec(item);
    return m ? (Number(m[1]) / 100) * int(m[2]) : Number(/^(\d+) coins for certain$/.exec(item)[1]);
  });
  assert.deepEqual(values, [30, 40, 50, 60]);
  const truths = fixed('expected-value', 'truths');
  assert.deepEqual(truths.options.map((o) => !!o.correct), [true, true, false, false]);
});

/* -------------------------------------------------------- lesson 8 · monty hall */

/**
 * Exact win chances [stay, switch] in an n-door game, given that the host showed only goats.
 * `knows`: the host never opens the car door. Otherwise he leaves one other door shut at random,
 * and rounds in which the car is exposed are void.
 */
function monty(n, knows) {
  let stay = 0; let swap = 0; let valid = 0;
  for (let car = 0; car < n; car++) for (let pick = 0; pick < n; pick++) for (let left = 0; left < n; left++) {
    if (left === pick) continue;
    let weight;   // chance that the host leaves `left` shut, times (n − 1) to stay in whole numbers
    if (knows) weight = pick === car ? 1 : (left === car ? n - 1 : 0);
    else weight = 1;
    if (!knows && car !== pick && car !== left) continue;   // the blind host exposed the car: void
    valid += weight;
    if (pick === car) stay += weight;
    if (left === car) swap += weight;
  }
  return { stay: [stay, valid], swap: [swap, valid] };
}

test('monty-hall: staying, switching and the blind host, by exact enumeration', () => {
  const classic = monty(3, true);
  assert.equal(lowest(...classic.stay), '1/3');
  assert.equal(lowest(...classic.swap), '2/3');
  assert.equal(lowest(...monty(100, true).swap), '99/100');
  const blind = monty(3, false);
  assert.equal(lowest(...blind.stay), '1/2');
  assert.equal(lowest(...blind.swap), '1/2');

  assert.match(fixed('monty-hall', 'hook').options.find((o) => o.correct).text, /Switch/);
  assert.match(fixed('monty-hall', 'why-stay').options.find((o) => o.correct).text, /\\frac\{1\}\{3\}/);
  const host = fixed('monty-hall', 'blind-host');
  assert.match(host.options.find((o) => o.correct).text, /\\frac\{1\}\{2\}/);
  assert.equal(host.figures[0].host, 'random');
  const fill = fixed('monty-hall', 'why-switch');
  assert.deepEqual(fill.blanks.slice(0, 3).map((b) => b.answer), ['goat', 'car', 'wins']);
  for (const v of fill.blanks[3].numbers) assert.ok(Math.abs(v - 2 / 3) < 0.005);
  assert.ok(Math.abs(fill.blanks[3].numbers[0] - 2 / 3) < 1e-12);
  // three cases, always starting with door 1
  const cases = fixed('monty-hall', 'three-cases');
  assert.deepEqual(cases.items.map((it) => [Number(/door (\d)/.exec(it.text)[1]), it.bucket]), [[1, 1], [2, 0], [3, 0]]);
  const rules = fixed('monty-hall', 'rules');
  assert.deepEqual(rules.options.map((o) => !!o.correct), [true, true, true, false, false]);
});

test('monty-hall: switching with n doors', () => {
  const sizes = new Set();
  for (const s of variants('monty-hall', 'n-doors')) {
    const t = plain(s.text);
    const n = int(must(/with ([\d,]+) doors/, t)[1]);
    sizes.add(n);
    assert.match(t, /The host, who knows where the car is, opens all the other doors except one, showing only goats\. You switch/);
    const exact = n <= 100 ? monty(n, true).swap : [n - 1, n];   // switching wins exactly when the first pick was wrong
    assert.equal(lowest(...exact), `${n - 1}/${n}`);
    assert.ok(Math.abs(s.answer - (n - 1) / n) < 1e-12);
    assert.equal(s.display, `${n - 1}/${n}`);
    assert.ok(s.tolerance < 1 / n / 2 || n > 1000, 'the tolerance cannot blur "certain" into the answer');
    assert.ok(Math.abs(1 - s.answer) > s.tolerance, '1 is not accepted');
    checkWrong(s, t);
  }
  assert.ok(sizes.size >= 7);
});

test('monty-hall: activity checks', () => {
  const play = raw('monty-hall', 'play');
  assert.equal(play.check({ stay: { played: 3 }, switch: { played: 3 } }), true);
  assert.match(play.check({ stay: { played: 6 }, switch: { played: 0 } }), /stayed 6 times and switched not at all/);
  const long = raw('monty-hall', 'long-run');
  assert.equal(long.check({ stay: { played: 1000 }, switch: { played: 1000 } }), true);
  assert.notEqual(long.check({ stay: { played: 2000 }, switch: { played: 500 } }), true);
  assert.equal(raw('monty-hall', 'hundred').widget.doors, 100);
});

/* ------------------------------------------------------------------------
 * Teach before you ask: a graded step may only ask for what the lesson has
 * already shown. The validator checks the shape; these pin the substance.
 * --------------------------------------------------------------------- */

// teaching screens added when the course was revised to teach first
const TEACHING = {
  'what-are-the-chances': ['teach-scale', 'teach-three-ways', 'example-backwards'],
  'counting-outcomes': ['teach-board', 'example-event', 'teach-multiply'],
  'the-long-run': ['example-expect', 'teach-no-memory'],
  'and-or': ['teach-not', 'example-or', 'teach-at-least-one'],
  conditional: ['teach-ruled-out', 'teach-independent', 'example-table', 'example-no-replace'],
  bayes: ['teach-base-rate', 'teach-names'],
  'expected-value': ['teach-fair', 'teach-risk'],
  'monty-hall': ['teach-host', 'teach-two-doors', 'example-many-doors', 'teach-rules'],
};

// [lesson, teaching screen, the first step that needs it, what the screen must say (bold marks and line breaks ignored)]
const SERVES = [
  ['what-are-the-chances', 'idea', 'count-it', ['probability', 'equally likely', '\\frac{\\text{outcomes you want}}{\\text{all outcomes}}', 'P(\\text{red})']],
  ['what-are-the-chances', 'teach-scale', 'scale', ['certain', 'impossible', 'between 0 and 1', 'six equally likely faces', ':::example']],
  ['what-are-the-chances', 'teach-three-ways', 'three-ways', ['fraction', 'decimal', 'percentage', 'multiply by 100', ':::example']],
  ['what-are-the-chances', 'teach-three-ways', 'percent', ['\\frac{6}{40}', '15\\%']],
  ['what-are-the-chances', 'example-backwards', 'missing', ['share', 'equal parts', ':::example']],
  ['counting-outcomes', 'teach-board', 'grid-seven', ['outcome', '(2, 5)', '(5, 2)', 'different outcome', '36']],
  ['counting-outcomes', 'sample-space', 'count-sum', ['sample space', 'event', '\\frac{6}{36}', ':::example']],
  ['counting-outcomes', 'example-event', 'event-prob', ['count', 'divide by 36', 'or more', 'once', ':::example']],
  ['counting-outcomes', 'teach-multiply', 'multiply', ['multiply the number of possibilities', ':::key', ':::example']],
  ['counting-outcomes', 'teach-multiply', 'two-coins', ['H-red', 'T-red', 'equally likely']],
  ['the-long-run', 'law', 'how-close', ['law of large numbers', 'share']],
  ['the-long-run', 'example-expect', 'expected-count', ['probability × number of tries', 'best guess', ':::example']],
  ['the-long-run', 'teach-no-memory', 'no-memory', ['independent', 'gambler\'s fallacy', ':::example']],
  ['and-or', 'teach-not', 'not', ['P(\\text{not } A) = 1 - P(A)', 'complement rule', ':::example']],
  ['and-or', 'multiply', 'and-practice', ['independent', 'P(A) \\times P(B)', 'coin', 'spinner', 'die', 'put back', ':::example']],
  ['and-or', 'or-rule', 'or-practice', ['P(A) + P(B) - P(A \\text{ and } B)', 'count them twice']],
  ['and-or', 'example-or', 'or-practice', ['multiple of 3 or a multiple of 5', 'In both lists', 'cannot happen together', ':::example']],
  ['and-or', 'teach-at-least-one', 'which-calc', ['none at all', 'take it away from 1', ':::example']],
  ['conditional', 'teach-ruled-out', 'shrink', ['rules out', 'still possible', 'equally likely', ':::example']],
  ['conditional', 'given', 'given-even', ['conditional probability', 'given', 'P(A \\mid B)', '\\frac{1}{11}']],
  ['conditional', 'given', 'cond-dice', ['\\dfrac{\\text{outcomes in } A \\text{ and } B}{\\text{outcomes in } B}']],
  ['conditional', 'teach-independent', 'shift', ['before', 'after', 'independent', 'P(A \\mid B) = P(A)']],
  ['conditional', 'example-table', 'table', ['look only at the row', 'look only at the column', 'Given that', ':::example']],
  ['conditional', 'example-table', 'flip', ['\\frac{12}{40}', '\\frac{12}{57}']],
  ['conditional', 'example-no-replace', 'no-replace', ['P(A) \\times P(B \\mid A)', 'keep the first one out', ':::example']],
  ['bayes', 'recipe', 'do-it', ['base rate', '1000 people', '\\text{ill and positive}', '\\dfrac{9}{98}']],
  ['bayes', 'recipe', 'compute', ['Compare']],
  ['bayes', 'teach-base-rate', 'second-test', ['base rate', 'starting point', '90 of 171']],
  ['bayes', 'teach-names', 'terms', ['Base rate', 'Sensitivity', 'False-positive rate', 'P(\\text{positive} \\mid \\text{ill})', 'given']],
  ['expected-value', 'idea', 'table-ev', ['expected prize', 'expected value', 'multiply each possible result by its probability']],
  ['expected-value', 'teach-fair', 'net-ev', ['fair game', 'negative', 'raffle', 'bet', '(-3)', ':::example']],
  ['expected-value', 'teach-fair', 'lottery', ['pays back half']],
  ['expected-value', 'teach-risk', 'insurance', ['average', 'risk', 'repeat a bet many times']],
  ['expected-value', 'teach-risk', 'order-ev', ['0.2 \\times 200 = 40', 'for certain']],
  ['monty-hall', 'teach-host', 'why-stay', ['knows where the car is', 'goat', 'offers you the switch']],
  ['monty-hall', 'teach-two-doors', 'not-fifty', ['first pick was right', 'picked blindly', '\\frac{2}{3}']],
  ['monty-hall', 'example-many-doors', 'n-doors', ['first pick', '\\frac{7}{8}', ':::example']],
  ['monty-hall', 'teach-rules', 'rules', ['knows where the car is', 'always shows a goat', 'always offers the switch', 'blindly', 'only when you have picked the car']],
];

test('teach before you ask: shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  assert.deepEqual(Object.keys(TEACHING).sort(), Object.keys(lessons).sort());
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((step) => resolveStep(step, makeRng(1), step.id));   // `graded` exists only on resolved steps
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    assert.ok(roles.filter((kind) => kind === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.ok(steps.length <= 18, `${id}: ${steps.length} steps`);
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
    const steps = lessons[lessonId].steps;
    const screen = steps.find((s) => s.id === teach);
    assert.ok(screen && screen.type === 'info', `${lessonId}: no teaching screen "${teach}"`);
    const asked = steps.findIndex((s) => s.id === ask);
    assert.ok(asked >= 0 && steps.indexOf(screen) < asked, `${lessonId}: "${teach}" must come before "${ask}"`);
    const shown = plain(screen.text);
    for (const term of terms) assert.ok(shown.includes(term), `${lessonId}/${teach} should mention "${term}" (needed by "${ask}")`);
  }
  // a rule is stated on a teaching screen, not first in the explanation of the step that discovers it
  for (const [lessonId, stepId, rule] of [
    ['what-are-the-chances', 'certain', 'between 0 and 1'], ['counting-outcomes', 'grid-seven', '\\frac{6}{36}'],
    ['the-long-run', 'streak-lab', 'fallacy'], ['and-or', 'or-grid', '12 + 12 - 4'], ['conditional', 'shrink', '\\frac{1}{11}'],
    ['conditional', 'shift', 'P(A \\mid B)'], ['bayes', 'why-so-many', 'base rate'], ['bayes', 'base-rate', 'symptoms'],
    ['expected-value', 'fair', 'fair game'],
  ]) {
    assert.ok(!plain(raw(lessonId, stepId).explain).includes(rule), `${lessonId}/${stepId}: "${rule}" belongs on the teaching screen that follows, not in the explanation`);
  }
  // terms that a later step uses are explained where they first appear
  assert.match(plain(raw('counting-outcomes', 'at-least-one-six').text), /or the orange die shows 6, or both do/);
  assert.match(plain(raw('the-long-run', 'sort').text), /gambler's fallacy is the belief that a result is "due"/);
  assert.match(plain(raw('bayes', 'second-test').text), /new crowd is the 98 people who tested positive once: 9 ill and 89 healthy/);
});

test('teach before you ask: the worked examples are right, and are not questions the practice steps can ask', () => {
  // the numbers on the new teaching screens, recomputed
  assert.equal(6 / 40, 0.15);                                                         // raffle, lesson 1
  assert.deepEqual([15 / 5, 7 * 3, 21 - 15, lowest(15, 21)], [3, 21, 6, '5/7']);      // from the share back to the bag
  assert.deepEqual(fixed('what-are-the-chances', 'example-backwards').figures[0].marbles, { red: 15, blue: 6 });
  assert.equal(diceCount((a, b) => a + b >= 11), 3);
  assert.equal(diceCount((a, b) => a + b === 2), 1);
  assert.equal(sequences(['H', 'T'], 1).length * 3, 6);                               // a coin and a three-part spinner
  assert.equal((3 / 10) * 200, 60);
  const cards = Array.from({ length: 15 }, (_, i) => i + 1);
  assert.deepEqual([cards.filter((c) => c % 3 === 0).length, cards.filter((c) => c % 5 === 0).length, cards.filter((c) => c % 15 === 0).length, cards.filter((c) => c % 3 === 0 || c % 5 === 0).length], [5, 3, 1, 7]);
  assert.deepEqual(share(sequences([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 2), (seq) => seq.includes(0)), [19, 100]);   // at least one gold in two spins
  assert.deepEqual(share(sequences([1, 2, 3, 4, 5, 6], 3), (seq) => seq.every((f) => f === 6)), [1, 216]);
  assert.deepEqual([diceCount((a, b) => a + b === 11), diceCount((a, b) => a === 6 && a + b === 11), diceCount((a, b) => b % 2 === 0), diceCount((a, b) => a === 6 && b % 2 === 0)], [2, 1, 18, 3]);
  assert.deepEqual([12 + 28, 45 + 15, 12 + 45, 28 + 15, 40 + 60, lowest(12, 40), lowest(12, 57)], [40, 60, 57, 43, 100, '3/10', '4/19']);   // the café table
  assert.deepEqual([lowest(2 * 1, 5 * 4), 2 * 3, 3 * 2, 3 * 2], ['1/10', 6, 6, 6]);   // two reds from 2 red and 3 blue, and the other leaves of the tree (in twentieths)
  const tenth = crowd(0.1, 0.9, 0.09);
  assert.deepEqual([tenth.truePos, tenth.falsePos, tenth.positives, Math.round(100 * tenth.ppv)], [90, 81, 171, 53]);
  assert.deepEqual([100 / 50 - 4, (50 * 4) / 100, (5 - 3) / 2, 0.2 * 200], [-2, 2, 1, 40]);   // raffle (pays back half), coin bet, 20% of 200
  assert.equal(lowest(...monty(8, true).swap), '7/8');

  const never = (lessonId, stepId, same) => {
    for (const s of variants(lessonId, stepId)) assert.ok(!same(plain(s.text)), `${lessonId}/${stepId} can repeat the worked example: ${plain(s.text)}`);
  };
  never('what-are-the-chances', 'percent', (t) => /\b40 (equal sections|tickets|marbles)/.test(t));
  never('what-are-the-chances', 'missing', (t) => /\b15 red/.test(t) || t.includes('\\frac{5}{7}'));
  never('counting-outcomes', 'count-sum', (t) => /total is (2|7)\?/.test(t));
  never('counting-outcomes', 'event-prob', (t) => /11 or more/.test(t));
  never('the-long-run', 'expected-count', (t) => /3 red/.test(t) || (/bag/.test(t) && /\b200 times/.test(t)));
  never('the-long-run', 'no-memory', (t) => /spinner has 3 equal/.test(t));
  never('and-or', 'and-practice', (t) => /8 equal sections/.test(t) || /roll a die (3|three) times/.test(t));
  never('and-or', 'or-practice', (t) => /1 to 15\b/.test(t));
  never('and-or', 'at-least-one', (t) => /10 equal sections/.test(t));
  never('conditional', 'table', (t) => /Tea|Coffee|Milk/.test(t));
  never('conditional', 'no-replace', (t) => /holds 2 red/.test(t));
  never('bayes', 'do-it', (t) => /\b1% of people/.test(t));
  never('bayes', 'compute', (t) => /(affects|^) ?1% /.test(t));
  never('expected-value', 'net-ev', (t) => /sells 50 tickets/.test(t) || /pays you 5 coins/.test(t));
  never('monty-hall', 'n-doors', (t) => /with 8 doors/.test(t));
});
