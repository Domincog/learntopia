// Independent checks of "Probability II: Random Variables". Every generated
// question is re-solved from its own wording: the numbers are parsed out of the
// text the learner sees, and the answer is recomputed here by brute force
// (listing every outcome, stepping a chain forward, adding up a distribution)
// or with a different formula from the one the lesson uses. The checks of the
// hands-on steps are fed states worked out here, over every setting the widget
// allows, so that exactly the states the instruction asks for are accepted.
//
//   node --test tests/probability-2-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { parseNumber } from '../src/core/mathexpr.js';
import course from '../content/courses/probability-2/course.js';
import { choose as widgetChoose } from '../src/widgets/pascal-triangle.js';
import { binomial as widgetBinomial } from '../src/widgets/galton-board.js';
import { totalDistribution } from '../src/widgets/dice-sum-lab.js';
import { expectedBirthdayWait, expectedCollectorWait } from '../src/widgets/wait-sim.js';
import { roundCounts, stepCounts } from '../src/widgets/markov-flow.js';

const SEEDS = 200;
// How a probability is to be typed, and how much rounding that allows: 3 decimal places are at most 0.0005 off.
const PROB_HOW = 'Give a fraction, or a decimal rounded to 3 decimal places.';
const PROB_TOL = 0.0006;
const LESSONS = ['counting-arrangements', 'binomial', 'random-variables', 'normal-curve', 'waiting-times', 'markov-chains'];

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/probability-2/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, 'probability-2', meta.id);
  }
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
/** Every step that some test has looked at by name. */
const touched = new Set();
const one = (lesson, id) => { touched.add(`${lesson}/${id}`); return resolveStep(raw(lesson, id), makeRng(1), id); };
/** Every generated step that some test has re-solved; the last test checks that none was left out. */
const covered = new Set();
const variants = (lesson, id, n = SEEDS) => {
  covered.add(`${lesson}/${id}`);
  assert.equal(typeof raw(lesson, id).gen, 'function', `${lesson}/${id} is generated`);
  return Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(4242 + k * 7919), id));
};

/* ------------------------------------------------------------------ tools */

const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const plain = (s) => flat(s).replace(/\*\*/g, '');
const int = (s) => Number(String(s).replace(/,/g, ''));
const grab = (re, text, what = '') => { const m = re.exec(text); assert.ok(m, `cannot read ${what || re} from: ${text}`); return m.slice(1); };
const near = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} expected ${b}, got ${a}`);
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
const lowest = (n, d) => { const g = gcd(n, d) || 1; return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const correctText = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: one correct option`); return right[0].text; };
const blanks = (step) => step.blanks.map((b) => (b.kind === 'select' ? b.answer : b.numeric ? b.numbers[0] : b.answers[0]));

/** Every string a learner can see in a resolved step (figure markup and widget specs excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['type', 'id', 'figure', 'figures', 'widget', 'solution', 'keyboard', 'mode', 'display']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) if (!skip.has(k)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/* ---- counting, by listing --------------------------------------------- */

/** Every sequence of `length` results, each drawn from `faces`. */
function sequences(faces, length) {
  let out = [[]];
  for (let i = 0; i < length; i++) out = out.flatMap((seq) => faces.map((f) => [...seq, f]));
  return out;
}
/** Every ordered line-up of k different items out of 0 … n − 1. */
function lineups(n, k) {
  let out = [[]];
  for (let i = 0; i < k; i++) out = out.flatMap((seq) => Array.from({ length: n }, (_, v) => v).filter((v) => !seq.includes(v)).map((v) => [...seq, v]));
  return out;
}
/** Every group of k items out of 0 … n − 1, as bit masks. */
function groups(n, k) {
  const out = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    let bits = 0;
    for (let i = 0; i < n; i++) if (mask & (1 << i)) bits++;
    if (bits === k) out.push(mask);
  }
  return out;
}
/** n choose k from Pascal's rule (addition only), so that it shares nothing with the lessons' product formula. */
const pascalRow = (n) => { let row = [1]; for (let i = 0; i < n; i++) row = [1, ...row.slice(1).map((v, j) => v + row[j]), 1]; return row; };
const C = (n, k) => (k < 0 || k > n ? 0 : pascalRow(n)[k]);
const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
const bigFactorial = (n) => { let out = 1n; for (let i = 2n; i <= BigInt(n); i++) out *= i; return out; };

/* ---- distributions ----------------------------------------------------- */

/** Mean, variance and SD of a distribution given as [[value, probability], …]. */
function moments(dist) {
  const total = dist.reduce((t, [, p]) => t + p, 0);
  near(total, 1, 1e-9, 'probabilities add up to 1:');
  const mean = dist.reduce((t, [v, p]) => t + v * p, 0);
  const variance = dist.reduce((t, [v, p]) => t + (v - mean) ** 2 * p, 0);
  return { mean, variance, sd: Math.sqrt(variance) };
}
/** Distribution of the total of n independent copies of a variable, by multiplying the possibilities out one copy at a time. */
function sumDistribution(dist, n) {
  let acc = new Map([[0, 1]]);
  for (let i = 0; i < n; i++) {
    const next = new Map();
    for (const [t, p] of acc) for (const [v, q] of dist) if (q > 0) next.set(t + v, (next.get(t + v) || 0) + p * q);
    acc = next;
  }
  return [...acc.entries()].sort((a, b) => a[0] - b[0]);
}
const coin = [[0, 0.5], [1, 0.5]];
const fairDie = [1, 2, 3, 4, 5, 6].map((v) => [v, 1 / 6]);

/** Number of heads in n fair flips: the whole distribution, built up one flip at a time. */
const headsDistribution = (n) => sumDistribution(coin, n);

/* ---- answers ------------------------------------------------------------ */

/** A probability answer: right value, shown in lowest terms, typed as a fraction or as 3 decimals, and no slip that would be accepted. */
function checkProbability(s, n, d, where) {
  near(s.answer, n / d, 1e-12, `${where}: answer`);
  assert.equal(String(s.display), lowest(n, d), `${where}: display in lowest terms`);
  assert.equal(s.tolerance, PROB_TOL, `${where}: tolerance`);
  assert.ok(flat(s.text).includes(PROB_HOW), `${where}: says how to type the answer`);
  // both the exact fraction and its 3-decimal rounding are accepted; a 2-decimal rounding is caught with a hint, unless it is exact
  for (const typed of [`${n}/${d}`, lowest(n, d), `${3 * n}/${3 * d}`, (n / d).toFixed(3), (n / d).toFixed(4), (n / d).toFixed(6), String(n / d), (n / d).toFixed(3).replace(/^0/, '')]) {
    assert.ok(Math.abs(parseNumber(typed) - s.answer) <= s.tolerance + 1e-12, `${where}: "${typed}" should be accepted`);
  }
  // rounding half up by hand can differ from toFixed in the last place: both neighbours of the 3-decimal value are fine
  const thousandths = Math.floor((1000 * n) / d);
  const halfUp = (2 * ((1000 * n) % d) >= d ? thousandths + 1 : thousandths) / 1000;
  assert.ok(Math.abs(halfUp - s.answer) <= s.tolerance, `${where}: ${halfUp} (rounded half up) should be accepted`);
  // a decimal comma followed by three digits reaches the step as a whole number ("0,375" is read as 375):
  // the learner is told what happened instead of "a probability lies between 0 and 1"
  const comma = parseNumber((n / d).toFixed(3).replace('.', ','));
  if (comma > 1) assert.match(s.feedback(comma), /read as the whole number \d+\. Type the decimal with a point, like 0\.\d{3}/, `${where}: decimal comma`);
  else assert.ok(Math.abs(comma - s.answer) <= s.tolerance, `${where}: decimal comma`);
  const rough = Number((n / d).toFixed(2));
  if (Math.abs(rough - s.answer) > s.tolerance) assert.match(s.feedback(rough), /rounded too roughly/, `${where}: feedback for ${rough}`);
  assert.match(s.feedback(1.5), /between 0 and 1/);
  checkWrong(s, where);
}
/** No listed slip may be within the accepted tolerance of the right answer (or of another slip); each has feedback. */
function checkWrong(s, where) {
  const tol = s.tolerance == null ? 1e-6 * Math.max(1, Math.abs(s.answer)) : s.tolerance;
  s.wrong.forEach(([value, message], i) => {
    assert.ok(Math.abs(value - s.answer) > tol, `${where}: the "wrong" value ${value} would be accepted as ${s.answer}`);
    assert.ok(message && message.length > 12, `${where}: wrong value ${value} has no feedback`);
    s.wrong.slice(0, i).forEach(([other]) => assert.ok(Math.abs(other - value) > 1e-9, `${where}: slip ${value} is listed twice`));
  });
}

/* ============================================================ whole course */

test('course shape: six lessons of 13 to 18 steps, each with review steps, a recap and hands-on steps', () => {
  assert.equal(course.id, 'probability-2');
  assert.deepEqual(course.requires, ['probability']);
  assert.deepEqual(Object.keys(lessons), LESSONS);
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.ok(lesson.steps.length >= 13 && lesson.steps.length <= 18, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) {
      if (s.type === 'numeric') assert.equal(typeof s.gen, 'function', `${id}/${s.id}: numeric review steps are generated`);
      for (let k = 0; k < 20; k++) {
        const r = resolveStep(s, makeRng(31 + k), s.id);
        assert.ok(r.explain, `${id}/${s.id}: review steps explain`);
        assert.ok(!/\b(as we just saw|above|earlier step|previous step|last step)\b/i.test(flat(r.text)), `${id}/${s.id}: stands alone`);
      }
    }
    const handsOn = lesson.steps.filter((s) => s.type === 'interact');
    assert.ok(handsOn.length >= 2, `${id}: ${handsOn.length} hands-on steps`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: next`);
    assert.equal(lesson.steps[0].mode, 'predict', `${id}: opens with a prediction`);
    let infos = 0;
    for (const s of lesson.steps) { infos = s.type === 'info' ? infos + 1 : 0; assert.ok(infos < 3, `${id}: three info steps in a row`); }
    assert.ok(lesson.steps.some((s) => s.stretch), `${id}: has a stretch step`);
  }
});

test('no learner-visible text contains undefined, NaN, float noise, a bad plural or untidy TeX', () => {
  const things = 'coins|heads|tails|boxes|packs|rolls|tries|dice|days|people|friends|sets|balls|waits|sixes|bullseyes|things|toys|stickers|towns|customers|bikes|gamblers|questions|rounds|weeks|throws|marbles|flips|spins|arrows|steps|bags|measurements|SDs';
  const badPlural = new RegExp(`(^|[^\\d.,/^{])1 (${things})\\b`);
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        for (const text of visible(s)) {
          const where = `${id}/${step.id} seed ${k}: "${flat(text).slice(0, 140)}"`;
          assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), where);
          assert.ok(!/\d\.\d{5,}/.test(text), `float noise in ${where}`);
          assert.ok(!badPlural.test(flat(text)), `plural in ${where}`);
          assert.ok(!/\+ -|- -|\b1x\b|\+ 0(?![.\d])/.test(text), `untidy TeX in ${where}`);
        }
        if (!step.gen) break;
      }
    }
    for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
  }
});

test('every choice has exactly one correct option and no duplicates; multi has no duplicates', () => {
  let seen = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'choice' && step.type !== 'multi') continue;
      const s = resolveStep(step, makeRng(5), step.id);
      const right = s.options.filter((o) => o.correct).length;
      if (step.type === 'choice') assert.equal(right, 1, `${id}/${step.id}`);
      else assert.ok(right >= 1 && right < s.options.length, `${id}/${step.id}`);
      assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, `${id}/${step.id} has duplicate options`);
      if (step.mode !== 'predict') for (const o of s.options) if (!o.correct) assert.ok(o.why, `${id}/${step.id}: "${o.text}" says why it is wrong`);
      seen++;
    }
  }
  assert.ok(seen >= 10, `${seen} choice steps`);
});

test('numeric steps: answers that can be typed, a rounding rule wherever there is a tolerance, and no slip that equals the answer', () => {
  let probabilities = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'numeric') continue;
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(9 + k * 613), step.id);
        const where = `${id}/${step.id} seed ${k}`;
        assert.ok(Number.isFinite(s.answer), where);
        assert.ok(s.explain, `${where}: explains`);
        if (s.tolerance == null) {
          assert.ok(Math.abs(s.answer * 100 - Math.round(s.answer * 100)) < 1e-9, `${where}: ${s.answer} can be typed exactly`);
        } else {
          assert.ok(flat(s.text).includes(PROB_HOW), `${where}: a tolerance needs a rounding rule`);
          assert.ok(s.answer > 0 && s.answer < 1, `${where}: a probability`);
          assert.equal(typeof s.feedback, 'function', `${where}: feedback for near misses`);
          probabilities++;
        }
        checkWrong(s, where);
        if (!step.gen) break;
      }
    }
  }
  assert.ok(probabilities > 1000);
});

test('fill steps: every typed blank is a number, and probabilities in blanks accept fractions and decimals', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'fill') continue;
      for (let k = 0; k < 60; k++) {
        const s = resolveStep(step, makeRng(3 + k * 17), step.id);
        for (const b of s.blanks) {
          assert.equal(b.kind, 'input', `${id}/${step.id}`);
          assert.ok(b.numeric, `${id}/${step.id}: blank ${b.answers} is numeric`);
          const v = b.numbers[0];
          if (!Number.isInteger(v)) {
            // not a whole number: either a short decimal that can be typed exactly, or a fraction with a tolerance on the step
            const short = Math.abs(v * 10 - Math.round(v * 10)) < 1e-9;
            assert.ok(short || s.tolerance > 0, `${id}/${step.id}: blank ${b.answers} needs a tolerance`);
          }
        }
        if (!step.gen) break;
      }
    }
  }
  const dist = one('random-variables', 'distribution');
  assert.deepEqual(blanks(dist), [0.25, 0.5, 0.25, 1]);
  assert.ok(dist.tolerance > 0 && dist.tolerance <= 0.005);
  assert.match(dist.text, /Fractions and decimals are both fine/);
});

/* ================================================================ lesson 1 */

test('lesson 1: the numbers quoted about decks, factorials and committees', () => {
  const deck = bigFactorial(52);
  assert.equal(deck.toString().length, 68);                       // 8.07 × 10^67
  assert.ok(deck.toString().startsWith('806'));
  const hook = one('counting-arrangements', 'hook');
  assert.match(correctText(hook), /Almost certainly not/);
  assert.match(hook.explain, /about \$8 \\times 10\^\{67\}\$/);
  // a billion people, one shuffle a second, for 13.8 billion years
  const shuffles = 1e9 * 13.8e9 * 365.25 * 86400;
  assert.equal(shuffles.toExponential(0), '4e+26');
  assert.match(hook.explain, /about \$4 \\times 10\^\{26\}\$/);
  assert.ok(shuffles / Number(deck) < 1e-36, 'less than one part in a trillion trillion trillion');

  const info = one('counting-arrangements', 'factorial').text;
  assert.equal(factorial(3), 6);
  assert.equal(factorial(8), 40320);
  assert.match(info, /8! = 8 \\times 7 \\times 6 \\times \\cdots \\times 1 = 40,320/);
  assert.match(info, /\| 6 \| 40,320 \| 3,628,800 \|/);
  assert.ok(info.includes(commas(factorial(10))) && commas(factorial(10)) === '3,628,800');
  assert.equal(Number(bigFactorial(20)).toExponential(1), '2.4e+18');
  assert.match(info, /2\.4 \\times 10\^\{18\}/);
  assert.match(info, /8 \\times 10\^\{67\}/);

  const podium = one('counting-arrangements', 'podium');
  assert.deepEqual(blanks(podium), [8, 7, 6, lineups(8, 3).length]);
  const idea = one('counting-arrangements', 'choose-idea').text;
  // the worked example uses ten runners, which the generated step (5 to 9 things) cannot ask about
  assert.equal(groups(10, 3).length, 120);
  assert.equal(lineups(10, 3).length, 720);
  assert.match(idea, /= 120 \\text\{ trios\.\}/);
  assert.match(idea, /10 \\times 9 \\times 8 = 720/);
  assert.match(flat(podium.explain), /8 \\times 7 \\times 6 = 336/);
});

test('lesson 1: choices in stages multiply', () => {
  const kinds = new Set();
  for (const s of variants('counting-arrangements', 'multiply')) {
    const text = plain(s.text);
    let m;
    let count;
    if ((m = /offers (\d+) starters, (\d+) main courses and (\d+) desserts/.exec(text))) {
      count = sequences([0], 0).length * m[1] * m[2] * m[3];
      let listed = 0;
      for (let a = 0; a < m[1]; a++) for (let b = 0; b < m[2]; b++) for (let c = 0; c < m[3]; c++) listed++;
      assert.equal(listed, count);
      kinds.add('menu');
    } else if ((m = /holds (\d+) shirts, (\d+) pairs of trousers and (\d+) pairs of shoes/.exec(text))) {
      count = 0;
      for (let a = 0; a < m[1]; a++) for (let b = 0; b < m[2]; b++) for (let c = 0; c < m[3]; c++) count++;
      kinds.add('outfit');
    } else if ((m = /has (\d+) dials\. Each dial shows one of the digits (\d) to (\d), and dials may show the same digit/.exec(text))) {
      const symbols = Number(m[3]) - Number(m[2]) + 1;
      count = sequences(Array.from({ length: symbols }, (_, i) => i), Number(m[1])).length;
      kinds.add('lock');
    } else {
      m = grab(/roll one die and flip (\d+) coins?\./, text, 'coins');
      count = sequences([1, 2, 3, 4, 5, 6], 1).length * sequences(['H', 'T'], Number(m[0])).length;
      kinds.add('coins');
    }
    assert.equal(s.answer, count, text);
    assert.ok(s.explain.includes(`= ${commas(count)}$`), `explain quotes ${count}: ${s.explain}`);
    assert.match(text, /6 \\times 6 = 36/);
  }
  assert.equal(kinds.size, 4);
});

test('lesson 1: orders of n things, and line-ups of k out of n', () => {
  for (const s of variants('counting-arrangements', 'orders')) {
    const n = Number(grab(/^(\d+) (?:runners|people)|(?:have|holds) (\d+) different (?:books|songs)/, plain(s.text)).find(Boolean));
    assert.ok(n >= 4 && n <= 7);
    assert.equal(s.answer, lineups(n, n).length, `orders of ${n}`);
    assert.ok(s.explain.includes(`$${n}! =`) && s.explain.includes(`= ${commas(s.answer)}$`));
    assert.ok(s.hints[1].includes(Array.from({ length: n }, (_, i) => n - i).join(' \\times ')));
    for (const [, msg] of s.wrong) assert.ok(!/undefined/.test(msg));
  }
  const kinds = new Set();
  for (const s of variants('counting-arrangements', 'arrange')) {
    const text = plain(s.text);
    const n = Number(grab(/(\d+) (?:members|runners|different letter tiles)/, text)[0]);
    let k;
    if (/a president and a secretary\./.test(text) || /a gold and a silver medal/.test(text)) k = 2;
    else if (/a president, a secretary and a treasurer/.test(text) || /gold, silver and bronze medals/.test(text)) k = 3;
    else k = Number(grab(/lay (\d) of them in a row/, text)[0]);
    assert.match(text, /Nobody can hold two posts|with no ties|letter tiles/);
    assert.equal(s.answer, lineups(n, k).length, `${k} of ${n}`);
    assert.ok(s.explain.includes(`= ${commas(s.answer)}$`));
    // the slip "groups, ignoring order" quotes the number of groups
    const group = s.wrong.find(([, msg]) => /ignores order/.test(msg));
    assert.equal(group[0], groups(n, k).length);
    const repeat = s.wrong.find(([, msg]) => /That would let/.test(msg));
    assert.equal(repeat[0], sequences(Array.from({ length: n }, (_, i) => i), k).length);
    kinds.add(`${k}`);
  }
  assert.equal(kinds.size, 2);
});

test('lesson 1: groups where order does not matter', () => {
  for (const s of variants('counting-arrangements', 'choose')) {
    const text = plain(s.text);
    let n;
    let k;
    let m;
    if ((m = /team of (\d+) is to be picked from (\d+) volunteers/.exec(text))) { k = Number(m[1]); n = Number(m[2]); }
    else if ((m = /offers (\d+) toppings\. You choose (\d+) different ones/.exec(text))) { n = Number(m[1]); k = Number(m[2]); }
    else { m = grab(/own (\d+) books and pack (\d+) of them/, text); n = Number(m[0]); k = Number(m[1]); }
    const count = groups(n, k).length;
    assert.equal(s.answer, count, `${n} choose ${k}`);
    assert.equal(count, C(n, k));
    assert.ok(count <= 126, 'small enough to type');
    const ordered = lineups(n, k).length;
    assert.ok(s.explain.includes(`\\dfrac{${ordered}}{${factorial(k)}} = ${count}$`), s.explain);
    assert.ok(s.hints[0].includes(`= ${ordered}$`));
    const over = s.wrong.find(([, msg]) => /ordered line-ups/.test(msg));
    assert.equal(over[0], ordered);
    assert.ok(over[1].includes(`counted ${factorial(k)} times`));
  }
});

test('lesson 1: the two boards and the triangle accept exactly what the instructions ask for', () => {
  // codes with no repeated letter
  const codes = one('counting-arrangements', 'no-repeats');
  const labels = codes.widget.labels;
  assert.equal(labels.length, 27);
  assert.equal(new Set(labels).size, 27);
  assert.deepEqual([...labels].sort(), sequences(['A', 'B', 'C'], 3).map((q) => q.join('')).sort());
  const wantCodes = labels.map((w, i) => (new Set(w).size === 3 ? i : -1)).filter((i) => i >= 0);
  assert.equal(wantCodes.length, lineups(3, 3).length);
  checkBoard(codes, labels.length, wantCodes);
  assert.match(codes.check({ on: [0], count: 1 }), /AAA uses the letter A more than once/);
  assert.match(codes.check({ on: [labels.indexOf('ABA')], count: 1 }), /ABA uses the letter A more than once/);
  assert.match(codes.check({ on: [labels.indexOf('CBB')], count: 1 }), /CBB uses the letter B more than once/);

  // line-ups that give the committee A, B, C
  const over = one('counting-arrangements', 'overcount');
  const ups = over.widget.labels;
  assert.equal(ups.length, 24);
  assert.deepEqual([...ups].sort(), lineups(4, 3).map((q) => q.map((i) => 'ABCD'[i]).join('')).sort());
  const wantUps = ups.map((w, i) => (!w.includes('D') ? i : -1)).filter((i) => i >= 0);
  assert.equal(wantUps.length, 6);
  checkBoard(over, ups.length, wantUps);
  assert.match(over.check({ on: [ups.indexOf('ABD')], count: 1 }), /ABD includes D/);
  assert.match(flat(over.text), /4 \\times 3 \\times 2 = 24/);
  assert.equal(groups(4, 3).length, 24 / 6);
  assert.match(flat(over.explain), /24 \\div 6 = 4/);

  // the triangle: only row 6, place 3
  const tri = one('counting-arrangements', 'pascal');
  assert.equal(typeof tri.check({ selected: null, n: null, k: null, value: null }), 'string');
  for (let n = 0; n < tri.widget.rows; n++) {
    for (let k = 0; k <= n; k++) {
      const res = tri.check({ selected: [n, k], n, k, value: C(n, k) });
      assert.equal(res === true, n === 6 && k === 3, `row ${n}, place ${k}`);
      if (res !== true) assert.ok(res.includes(`choose ${k} from ${n}`) || res.includes(`choose 3 from ${n}`), res);
      assert.equal(widgetChoose(n, k), C(n, k));
    }
  }
  assert.deepEqual(tri.solution.selected, [6, 3]);
  assert.equal(groups(6, 3).length, 20);
  assert.equal(C(5, 2) + C(5, 3), 20);
  assert.match(tri.explain, /\\binom\{6\}\{3\} = 20/);
  assert.equal(pascalRow(6).filter((v) => v === 20).length, 1, 'only one cell of row 6 shows 20');
});

/** A board of tappable cells: the check must accept the wanted set and nothing else. */
function checkBoard(step, cells, wanted) {
  const state = (on) => ({ on: [...on].sort((a, b) => a - b), count: on.length });
  assert.equal(step.check(state(wanted)), true, 'the wanted set passes');
  assert.deepEqual([...step.solution.on].sort((a, b) => a - b), [...wanted].sort((a, b) => a - b), 'the solution is the wanted set');
  // every subset of the wanted cells, every wanted set with one extra cell, and many random sets
  for (let mask = 0; mask < (1 << wanted.length) - 1; mask++) {
    const on = wanted.filter((_, i) => mask & (1 << i));
    const res = step.check(state(on));
    assert.equal(typeof res, 'string', `incomplete set ${on}`);
    if (on.length) assert.ok(res.includes(`${on.length} so far`), res);
  }
  for (let i = 0; i < cells; i++) {
    if (wanted.includes(i)) continue;
    assert.equal(typeof step.check(state([...wanted, i])), 'string', `extra cell ${i}`);
    assert.equal(typeof step.check(state([i])), 'string');
  }
  const rng = makeRng(99);
  for (let t = 0; t < 3000; t++) {
    const on = Array.from({ length: cells }, (_, i) => i).filter(() => rng.bool(0.3));
    const same = on.length === wanted.length && on.every((i) => wanted.includes(i));
    assert.equal(step.check(state(on)) === true, same);
  }
}

test('lesson 1: drawing marbles without replacement', () => {
  for (const s of variants('counting-arrangements', 'all-red')) {
    const text = plain(s.text);
    const [red, blue, k] = grab(/holds (\d+) red and (\d+) blue marbles\. You draw (\d+) marbles at random, without putting any back/, text).map(Number);
    assert.match(text, /Every group of \d marbles is equally likely/);
    const all = groups(red + blue, k);
    const redMask = (1 << red) - 1;                               // marbles 0 … red − 1 are the red ones
    const good = all.filter((mask) => (mask & ~redMask) === 0).length;
    checkProbability(s, good, all.length, `all-red ${red}/${blue}/${k}`);
    // cross-check with the chain rule for draws without replacement
    let chain = 1;
    for (let i = 0; i < k; i++) chain *= (red - i) / (red + blue - i);
    near(s.answer, chain, 1e-12);
    assert.ok(s.explain.includes(`\\binom{${red + blue}}{${k}} = ${all.length}$`) && s.explain.includes(`\\binom{${red}}{${k}} = ${good}$`));
    const back = s.wrong.find(([, msg]) => /went back into the bag/.test(msg));
    near(back[0], (red / (red + blue)) ** k, 1e-12);
  }
});

/* ================================================================ lesson 2 */

const allRoutes = (rows) => sequences(['L', 'R'], rows).map((q) => q.join(''));
const rights = (route) => route.split('').filter((c) => c === 'R').length;
/** The state galton-board reports in steer mode, for a set of completed routes. */
function steerState(routes, rows, target) {
  const byBin = new Array(rows + 1).fill(0);
  for (const route of routes) byBin[rights(route)]++;
  return { mode: 'steer', rows, routes: [...routes].sort(), byBin, target, path: '', found: byBin[target], needed: allRoutes(rows).filter((q) => rights(q) === target).length };
}
/** The most likely bin of a board, found by listing every route with its probability. */
function likeliestBin(rows, p) {
  const prob = new Array(rows + 1).fill(0);
  for (const route of allRoutes(rows)) { const k = rights(route); prob[k] += p ** k * (1 - p) ** (rows - k); }
  let best = 0;
  for (let k = 1; k <= rows; k++) if (prob[k] > prob[best] + 1e-12) best = k;
  return { best, prob };
}

test('lesson 2: the numbers quoted about coins, routes and the board', () => {
  const ten = headsDistribution(10);
  near(ten[5][1], 252 / 1024, 1e-12);
  const hook = one('binomial', 'hook');
  assert.ok(Math.abs(hook.answer - 100 * ten[5][1]) <= hook.tolerance, 'the slider accepts the true 24.6%');
  assert.match(hook.explain, /24\.6%/);
  assert.equal((100 * ten[5][1]).toFixed(1), '24.6');
  assert.equal(allRoutes(10).filter((q) => rights(q) === 5).length, 252);
  assert.equal(allRoutes(10).filter((q) => rights(q) === 0).length, 1);
  const drop = one('binomial', 'drop');
  const flips = flat(one('binomial', 'example-flips').text);
  assert.match(flips, /All routes: \$2\^\{10\} = 1024\$/);
  assert.match(flips, /\$\\binom\{10\}\{5\} = 252\$/);
  assert.match(flips, /\\dfrac\{252\}\{1024\} \\approx 24\.6\\%/);
  assert.match(flips, /Only one route of the 1024 ends in bin 0/);
  // "more rows spread the pile over more bins, and yet it fills a smaller share of the board"
  const pileWidth = (rows) => moments(headsDistribution(rows)).sd;
  assert.ok(pileWidth(12) > pileWidth(4) && pileWidth(12) / 13 < pileWidth(4) / 5);
  assert.deepEqual(drop.widget.rowsRange, [2, 12]);
  assert.equal(drop.widget.rows, 10);
  assert.equal(drop.widget.p, 0.5);
  assert.equal(drop.check({ balls: 300 }), true);
  assert.match(drop.check({ balls: 299 }), /299 balls so far/);
  assert.match(drop.check({ balls: 1 }), /1 ball so far/);

  const bin = one('binomial', 'bin-chance');
  const into2 = allRoutes(4).filter((q) => rights(q) === 2).length;
  checkProbability(bin, into2, 16, 'bin-chance');
  assert.deepEqual(pascalRow(4), [1, 4, 6, 4, 1]);
  assert.deepEqual(bin.figures[0].mark.map(([n, k]) => C(n, k)), [1, 4, 6, 4, 1]);

  const six = one('binomial', 'one-six');
  const rolls = sequences([1, 2, 3, 4, 5, 6], 3);
  const oneSix = rolls.filter((q) => q.filter((v) => v === 6).length === 1).length;
  assert.deepEqual(blanks(six), [3, oneSix]);
  assert.equal(rolls.length, 216);
  assert.match(six.explain, /\\approx 0\.347/);
  assert.equal((oneSix / 216).toFixed(3), '0.347');

  const centres = one('binomial', 'centres');
  const expected = { 'Heads in 20 flips of a fair coin': 20 * 0.5, 'Sixes in 30 rolls of a fair die': 30 / 6, 'Baskets in 40 free throws, each scored with probability 0.8': 40 * 0.8, 'Wins among 200 scratch cards, each a winner with probability 0.01': 200 * 0.01 };
  for (const [left, right] of centres.pairs) near(Number(right), expected[left], 1e-9, left);
  assert.equal(new Set(centres.pairs.map((p) => p[1])).size, centres.pairs.length);
});

test('lesson 2: steering finds routes; only the full set of six is accepted', () => {
  const step = one('binomial', 'steer');
  const { rows, target } = step.widget;
  const routes = allRoutes(rows);
  const wanted = routes.filter((q) => rights(q) === target);
  assert.equal(wanted.length, 6);
  assert.deepEqual([...step.solution.routes].sort(), [...wanted].sort());
  for (const q of wanted) assert.ok(step.explain.includes(q), `explain lists ${q}`);
  let accepted = 0;
  for (let mask = 0; mask < (1 << routes.length); mask++) {
    const set = routes.filter((_, i) => mask & (1 << i));
    const state = steerState(set, rows, target);
    const res = step.check(state);
    const complete = wanted.every((q) => set.includes(q));
    assert.equal(res === true, complete);
    if (res === true) accepted++;
    else if (state.found === 0) assert.match(res, /exactly two bounces to the right/);
    else assert.ok(res.includes(`You have ${state.found} of the routes into bin 2`));
  }
  assert.equal(accepted, 1 << (routes.length - wanted.length));
});

test('lesson 2: tilting the board; the binomial formula against a list of every route', () => {
  const step = one('binomial', 'tilt');
  const rows = step.widget.rows;
  const [lo, hi] = step.widget.pRange;
  const good = [];
  for (let p = lo; p <= hi + 1e-9; p = Math.round((p + 0.05) * 100) / 100) {
    const { best, prob } = likeliestBin(rows, p);
    widgetBinomial(rows, p).forEach((v, k) => near(v, prob[k], 1e-12, `binomial(${rows}, ${p})[${k}]`));
    for (const balls of [0, 10, 199, 200, 1000]) {
      const res = step.check({ rows, p, balls, peak: best });
      assert.equal(res === true, best === 7 && balls >= 200, `p=${p}, balls=${balls}`);
      if (best < 7) assert.match(res, /more likely/);
      if (best > 7) assert.match(res, /too far/);
      if (best === 7 && balls < 200) assert.ok(res.includes(`${balls} so far`));
    }
    if (best === 7) good.push(p);
  }
  assert.deepEqual(good, [0.65, 0.7]);
  assert.ok(good.includes(step.solution.p) && step.solution.balls >= 200);
  assert.match(step.explain, /0\.7 does it \(0\.65 works too\)/);
});

test('lesson 2: exactly k heads in n fair flips', () => {
  for (const s of variants('binomial', 'fair')) {
    const text = plain(s.text);
    const n = Number(grab(/flipped (\d+) times|has (\d+) true-or-false questions/, text).find(Boolean));
    const k = Number(grab(/exactly (\d+) (?:heads?|tails?|right)/, text)[0]);
    assert.match(text, /fair coin/);
    const good = sequences(['H', 'T'], n).filter((q) => q.filter((c) => c === 'H').length === k).length;
    checkProbability(s, good, 2 ** n, `fair ${n}/${k}`);
    assert.ok(s.hints[1].includes(pascalRow(n).join(', ')));
    assert.ok(s.explain.includes(`\\binom{${n}}{${k}} = ${good}$`) && s.explain.includes(`2^{${n}} = ${2 ** n}$`));
    assert.match(s.feedback(good), /number of sequences that fit/);
  }
});

test('lesson 2: exactly k successes with an unequal chance', () => {
  const stories = new Set();
  for (const s of variants('binomial', 'biased')) {
    const text = plain(s.text);
    let a;
    let b;
    let n;
    let k;
    let m;
    if ((m = /A fair die is rolled (\d+) times\. What is the probability of exactly (one six|\d+ sixes)/.exec(text))) {
      [a, b, n] = [1, 6, Number(m[1])];
      k = m[2] === 'one six' ? 1 : parseInt(m[2], 10);
      stories.add('die');
    } else if ((m = /stops on red with probability \$\\frac\{(\d+)\}\{(\d+)\}\$ on every spin, whatever happened on earlier spins\. It is spun (\d+) times\. What is the probability that it stops on red exactly (once|\d+ times)/.exec(text))) {
      [a, b, n] = [Number(m[1]), Number(m[2]), Number(m[3])];
      k = m[4] === 'once' ? 1 : parseInt(m[4], 10);
      stories.add('spinner');
    } else {
      m = grab(/hits the bullseye with probability \$\\frac\{(\d+)\}\{(\d+)\}\$ on each shot, independently of her other shots\. She shoots (\d+) arrows\. What is the probability of exactly (\d+) bullseyes?/, text);
      [a, b, n, k] = m.map(Number);
      stories.add('archer');
    }
    // every trial has b equally likely tickets, a of them winners: list all b^n ticket sequences
    const tickets = Array.from({ length: b }, (_, i) => i);
    const good = sequences(tickets, n).filter((q) => q.filter((t) => t < a).length === k).length;
    checkProbability(s, good, b ** n, `biased ${a}/${b}, ${k} of ${n}`);
    assert.ok(s.explain.includes(`\\binom{${n}}{${k}} = ${C(n, k)}$`));
    const single = s.wrong.find(([, msg]) => /one particular order/.test(msg));
    near(single[0], (a / b) ** k * (1 - a / b) ** (n - k), 1e-12);
  }
  assert.equal(stories.size, 3);
});

test('lesson 2: at least k heads, and passing a quiz by guessing', () => {
  const kinds = new Set();
  for (const s of variants('binomial', 'at-least')) {
    const text = plain(s.text);
    const n = Number(grab(/A fair coin is flipped (\d+) times/, text)[0]);
    const k = Number(grab(/at least (\d+) heads?\?/, text)[0]);
    const flips = sequences(['H', 'T'], n);
    const count = (test) => flips.filter((q) => test(q.filter((c) => c === 'H').length)).length;
    const good = count((h) => h >= k);
    checkProbability(s, good, flips.length, `at least ${k} of ${n}`);
    const exact = s.wrong.find(([, msg]) => /\*exactly\*/.test(msg));
    near(exact[0], count((h) => h === k) / flips.length, 1e-12);
    const opposite = s.wrong.find(([, msg]) => /the opposite/.test(msg));
    near(opposite[0], count((h) => h < k) / flips.length, 1e-12);
    if (k === n - 1) { assert.match(s.explain, /Add the two cases/); assert.ok(s.hints[0].includes(`${k} or ${n} heads`)); kinds.add('add'); }
    else { assert.match(s.explain, /Use the complement/); assert.match(s.hints[0], k === 1 ? /no heads at all/ : /no heads or exactly one/); kinds.add(`complement ${k}`); }
    assert.ok(s.explain.includes(`\\frac{${good}}{${flips.length}}`));
  }
  assert.deepEqual([...kinds].sort(), ['add', 'complement 1', 'complement 2']);

  for (const s of variants('binomial', 'quiz')) {
    const text = plain(s.text);
    const [n, m] = grab(/has (\d+) questions\. Each offers (\d+) answers, exactly one of them right/, text).map(Number);
    const need = Number(grab(/at least (\d+) right/, text)[0]);
    assert.equal(need, n - 1);
    assert.match(text, /at random, each pick independent of the others/);
    const picks = sequences(Array.from({ length: m }, (_, i) => i), n);          // answer 0 is the right one
    const good = picks.filter((q) => q.filter((v) => v === 0).length >= need).length;
    checkProbability(s, good, picks.length, `quiz ${n}/${m}`);
    const nearly = picks.filter((q) => q.filter((v) => v === 0).length === need).length;
    assert.ok(s.explain.includes(`\\frac{${nearly}}{${picks.length}}`) && s.explain.includes(`\\frac{1}{${picks.length}}`));
  }
});

test('lesson 2: the sorting task names real reasons', () => {
  const fits = one('binomial', 'fits');
  const byText = (re) => { const it = fits.items.find((i) => re.test(i.text)); assert.ok(it, String(re)); return it; };
  assert.equal(byText(/Heads in 20 flips/).bucket, 0);
  assert.equal(byText(/Sixes in 12 rolls/).bucket, 0);
  assert.equal(byText(/putting the marble back/).bucket, 0);
  assert.equal(byText(/Aces in a 5-card hand/).bucket, 1);
  assert.equal(byText(/Rolls needed to get the first six/).bucket, 1);
  assert.equal(byText(/Rainy days/).bucket, 1);
  assert.equal(byText(/tires/).bucket, 1);
  for (const it of fits.items) assert.ok(it.why && it.why.length > 30);
  // dealing without replacement really does change the chance: the second ace is less likely after a first
  assert.ok(3 / 51 < 4 / 52);
});

/* ================================================================ lesson 3 */

/** The state dice-sum-lab reports, from weights for the faces 1 to 6 (or other values) and a number of dice. */
function diceState(weights, n = 1, { view = 'sum', linked = false, values = [1, 2, 3, 4, 5, 6] } = {}) {
  const tot = weights.reduce((a, b) => a + b, 0);
  const die = values.map((v, i) => [v, weights[i] / tot]);
  const dm = moments(die);
  const total = linked ? die.map(([v, p]) => [n * v, p]) : sumDistribution(die, n);
  const shown = view === 'average' ? total.map(([t, p]) => [t / n, p]) : total;
  const m = moments(shown);
  return { n, weights, view, linked, mean: m.mean, sd: m.sd, variance: m.variance, dieMean: dm.mean, dieSd: dm.sd, dieVariance: dm.variance, flat: weights.every((w) => w === weights[0]), faces: weights.filter((w) => w > 0).length };
}

test('lesson 3: the numbers quoted about bets, dice and hats', () => {
  // the opening bets: 100 flips paying 1 coin a head
  const hundred = headsDistribution(100);
  const below40 = hundred.filter(([h]) => h < 40).reduce((t, [, p]) => t + p, 0);
  assert.ok(below40 > 0.015 && below40 < 0.02, `P(fewer than 40 heads) = ${below40}`);
  const hook = one('random-variables', 'hook');
  assert.equal(correctText(hook), 'Bet A');
  assert.match(flat(hook.explain), /less than 2 times in 100/);
  near(moments(hundred).mean, 50, 1e-9);
  near(moments(hundred).sd, 5, 1e-9);
  near(moments([[0, 0.5], [100, 0.5]]).sd, 50, 1e-9);
  assert.match(flat(one('random-variables', 'root-n').explain), /With 100 flips the SD is only 5 coins, so a payout below 40 is two whole SDs under the expected 50\. Bet A, with one big flip, has an SD of 50 coins/);

  // fair die, the die that shows 1 or 6, the die that shows 3 or 4
  const fair = diceState([1, 1, 1, 1, 1, 1]);
  assert.equal(fair.sd.toFixed(2), '1.71');
  assert.equal(fair.variance.toFixed(2), '2.92');
  near(diceState([1, 0, 0, 0, 0, 1]).sd, 2.5, 1e-12);
  near(diceState([0, 0, 1, 1, 0, 0]).sd, 0.5, 1e-12);
  const recipe = one('random-variables', 'recipe').text;
  assert.match(recipe, /variance is \$6\.25\$ and the SD is \$\\sqrt\{6\.25\} = 2\.5\$/);
  assert.match(flat(one('random-variables', 'reweight').explain), /A fair die has an SD of about 1\.71\. A die that only shows 3 or 4 has an SD of 0\.5/);

  // doubling one die against adding two
  const doubled = moments(fairDie.map(([v, p]) => [2 * v, p]));
  const two = moments(sumDistribution(fairDie, 2));
  near(doubled.mean, 7, 1e-9);
  near(two.mean, 7, 1e-9);
  assert.equal(doubled.sd.toFixed(2), '3.42');
  assert.equal(two.sd.toFixed(2), '2.42');
  assert.equal(two.variance.toFixed(2), '5.83');
  const spread = one('random-variables', 'spread-adds');
  assert.equal(correctText(spread), 'One die, doubled');
  assert.match(flat(spread.explain), /2 \\times 1\.71 = 3\.42/);
  // the variances are quoted as exact fractions with their rounded values: rounded decimals do not add up
  // (2.92 + 2.92 is 5.84, and the square root of 5.83 is 2.41)
  // (the rule and its numbers now sit on the teaching screen that follows the question)
  const adds = flat(one('random-variables', 'teach-variances-add').text);
  assert.match(adds, /\\frac\{35\}\{12\} \\approx 2\.92\$\. - \*\*Two dice:\*\* two variances make \$\\mathord\{\\frac\{35\}\{6\} \\approx 5\.83\}\$, whose square root is about 2\.42/);
  assert.match(flat(spread.explain), /Their total has an SD of only 2\.42/);
  // twelve dice: 12 × 35/12 = 35, and the picture beside the text shows that total
  near(moments(sumDistribution(fairDie, 12)).variance, 35, 1e-9);
  assert.equal(Math.sqrt(35).toFixed(2), '5.92');
  assert.match(adds, /12 \\times \\frac\{35\}\{12\} = 35\$, so the SD of the total is \$\\sqrt\{35\} \\approx 5\.92/);
  assert.equal(one('random-variables', 'teach-variances-add').figures[0].n, 12);
  assert.ok(!/2\.92 \+ 2\.92/.test(adds));
  near(moments(fairDie).variance, 35 / 12, 1e-12);
  near(two.variance, 35 / 6, 1e-12);
  assert.equal((35 / 12).toFixed(2), '2.92');
  assert.equal((35 / 6).toFixed(2), '5.83');
  assert.equal(Math.sqrt(35 / 6).toFixed(2), '2.42');
  assert.ok(!/2\.92 \+ 2\.92/.test(spread.explain));
  // the two pictures show what the text says, on the same axes
  const [left, right] = spread.figures;
  assert.deepEqual(left.values, [2, 4, 6, 8, 10, 12]);
  assert.equal(left.n, 1);
  assert.equal(right.n, 2);
  assert.deepEqual(left.x, right.x);
  assert.equal(left.yMax, right.yMax);
  assert.ok(left.static && right.static && !left.readouts && !right.readouts, 'the pictures do not print the answer');
  near(moments(totalDistribution(left.values, [1, 1, 1, 1, 1, 1], 1).map((q) => [q.t, q.p])).sd, doubled.sd, 1e-12);
  near(moments(totalDistribution([1, 2, 3, 4, 5, 6], [1, 1, 1, 1, 1, 1], 2).map((q) => [q.t, q.p])).sd, two.sd, 1e-12);

  // four offers worth 10 coins each
  const rank = one('random-variables', 'rank-risk');
  const offers = [[[10, 1]], [[0, 0.5], [20, 0.5]], [[100, 0.1], [0, 0.9]], [[1000, 0.01], [0, 0.99]]];
  const sds = offers.map((d) => { const m = moments(d); near(m.mean, 10, 1e-9); return m.sd; });
  assert.ok(sds.every((v, i) => i === 0 || v > sds[i - 1]), 'listed from the smallest SD to the largest');
  assert.deepEqual(sds.map((v) => Math.round(v * 10) / 10), [0, 10, 30, 99.5]);
  assert.match(rank.items[0], /10 coins for certain/);
  assert.match(rank.items[1], /fair coin flip: 20 coins or nothing/);
  assert.match(rank.items[2], /1-in-10 chance of 100 coins/);
  assert.match(rank.items[3], /1-in-100 chance of 1,000 coins/);
  assert.match(flat(rank.explain), /0, then 10, then 30, then about 99\.5/);
  assert.match(flat(rank.explain), /= 900\$, so the SD is 30/);

  // 100 hats
  assert.match(correctText(one('random-variables', 'hats-100')), /Exactly 1/);
});

test('lesson 3: loading the die accepts only "half on 1, half on 6"', () => {
  const step = one('random-variables', 'reweight');
  const max = step.widget.maxWeight;
  let accepted = 0;
  const w = [0, 0, 0, 0, 0, 0];
  const visit = (i) => {
    if (i === 6) {
      if (!w.some((v) => v > 0)) return;
      const state = diceState(w.slice());
      const res = step.check(state);
      const wanted = w[0] > 0 && w[0] === w[5] && w.slice(1, 5).every((v) => v === 0);
      assert.equal(res === true, wanted, `weights ${w}`);
      if (res === true) { accepted++; return; }
      if (Math.abs(state.mean - 3.5) > 1e-9) assert.match(res, /Keep it at exactly 3\.5/);
      else if (state.flat) assert.match(res, /fair die, with an SD of 1\.71/);
      else { assert.match(res, /It can be larger/); assert.ok(state.sd < 2.49); }
      return;
    }
    for (let v = 0; v <= max; v++) { w[i] = v; visit(i + 1); }
    w[i] = 0;
  };
  visit(0);
  assert.equal(accepted, max);
  assert.equal(step.check(diceState(step.solution.weights)), true);
});

test('lesson 3: the hat table', () => {
  const step = one('random-variables', 'hats');
  const cells = step.widget.labels;
  const orders = lineups(3, 3).map((q) => q.map((i) => 'ABC'[i]).join(''));
  assert.equal(step.widget.rows, orders.length);
  assert.equal(step.widget.cols, 3);
  const rowsShown = Array.from({ length: 6 }, (_, r) => cells.slice(3 * r, 3 * r + 3).join(''));
  assert.deepEqual([...rowsShown].sort(), [...orders].sort());
  assert.deepEqual(step.widget.colLabels, ['A gets', 'B gets', 'C gets']);
  const wanted = cells.map((c, i) => (c === 'ABC'[i % 3] ? i : -1)).filter((i) => i >= 0);
  assert.equal(wanted.length, 6);                                 // six matches in six rows: an average of 1
  for (let col = 0; col < 3; col++) assert.equal(wanted.filter((i) => i % 3 === col).length, 2, 'each guest: 2 rows in 6');
  checkBoard(step, cells.length, wanted);
  const bad = cells.findIndex((c, i) => c !== 'ABC'[i % 3]);
  assert.ok(step.check({ on: [bad], count: 1 }).includes(`guest ${'ABC'[bad % 3]} gets hat ${cells[bad]}`));
});

test('lesson 3: expected value, variance and SD from a table', () => {
  const shapes = new Set();
  for (const s of variants('random-variables', 'sd-table')) {
    const rows = [...s.text.matchAll(/\| (\d+) coins? \| \$\\frac\{(\d+)\}\{(\d+)\}\$ \|/g)].map((m) => [Number(m[1]), Number(m[2]) / Number(m[3])]);
    assert.ok(rows.length === 2 || rows.length === 3, s.text);
    const m = moments(rows);
    const [mean, variance, sd] = blanks(s);
    near(mean, m.mean, 1e-9, 'expected value');
    near(variance, m.variance, 1e-9, 'variance');
    near(sd, m.sd, 1e-9, 'SD');
    for (const v of [mean, variance, sd]) assert.ok(Number.isInteger(v) && v >= 0, `whole numbers: ${[mean, variance, sd]}`);
    assert.ok(sd > 0);
    assert.ok(flat(s.explain).includes(`= ${mean}$`) && flat(s.explain).includes(`= ${variance}$`) && flat(s.explain).includes(`\\sqrt{${variance}} = ${sd}$`));
    const dists = rows.map(([v]) => Math.abs(v - m.mean));
    for (const d of dists) assert.ok(s.hints[1].includes(String(Math.round(d * 1e6) / 1e6)), `hint names the distance ${d}`);
    shapes.add(rows.map(([, p]) => p).join());
  }
  assert.equal(shapes.size, 4);
});

/** Expected number of fixed points of a random order of n things, from the exact distribution of the count. */
function expectedMatches(n) {
  if (n <= 8) {
    const all = lineups(n, n);
    return all.reduce((t, q) => t + q.filter((v, i) => v === i).length, 0) / all.length;
  }
  // P(exactly k matches) = C(n, k) · D(n − k) / n!, with D the derangement numbers
  const D = [1n, 0n];
  for (let i = 2; i <= n; i++) D.push(BigInt(i - 1) * (D[i - 1] + D[i - 2]));
  const nFact = bigFactorial(n);
  let total = 0n;
  let weighted = 0n;
  for (let k = 0; k <= n; k++) {
    const ways = (bigFactorial(n) / (bigFactorial(k) * bigFactorial(n - k))) * D[n - k];
    total += ways;
    weighted += BigInt(k) * ways;
  }
  assert.equal(total, nFact);
  return Number((weighted * 1000000n) / nFact) / 1e6;
}

test('lesson 3: expected values add, with or without independence', () => {
  const kinds = new Set();
  for (const s of variants('random-variables', 'add-means')) {
    const text = plain(s.text);
    let m;
    let expected;
    if ((m = /roll (\d+) fair dice and add up the numbers/.exec(text))) {
      expected = moments(sumDistribution(fairDie, Number(m[1]))).mean;
      kinds.add('dice');
    } else if ((m = /has (\d+) questions, each with (\d+) possible answers, one of them right\. You pick every answer at random/.exec(text))) {
      expected = moments(sumDistribution([[1, 1 / m[2]], [0, 1 - 1 / m[2]]], Number(m[1]))).mean;
      kinds.add('quiz');
    } else if ((m = /dealt (\d+) cards from a well-shuffled deck of 52, which contains 4 aces/.exec(text))) {
      // number of aces in a hand of c cards: C(4, k) C(48, c − k) / C(52, c)
      const c = Number(m[1]);
      const big = (n, k) => (k < 0 || k > n ? 0n : bigFactorial(n) / (bigFactorial(k) * bigFactorial(n - k)));
      let weighted = 0n;
      for (let k = 0; k <= 4; k++) weighted += BigInt(k) * big(4, k) * big(48, c - k);
      expected = Number((weighted * 1000000n) / big(52, c)) / 1e6;
      assert.match(text, /chance of \$\\frac\{1\}\{13\}\$ of being an ace, though the cards are not independent/);
      kinds.add('aces');
    } else if ((m = /puts (\d+) letters into (\d+) addressed envelopes completely at random, one letter in each/.exec(text))) {
      assert.equal(m[1], m[2]);
      expected = expectedMatches(Number(m[1]));
      assert.ok(text.includes(`\\frac{1}{${m[1]}}`));
      kinds.add('letters');
    } else {
      m = grab(/village has ([\d,]+) people\. Assume each person is equally likely to be born on any of the 365 days/, text);
      const people = int(m[0]);
      // binomial(people, 1/365): add up k · P(k), stepping the probabilities along
      let p = (364 / 365) ** people;
      let mean = 0;
      for (let k = 0; k < 200; k++) { mean += k * p; p *= ((people - k) / (k + 1)) * (1 / 364); }
      expected = mean;
      kinds.add('birthdays');
    }
    near(s.answer, expected, 1e-5, text);
    assert.ok(s.explain.includes(`= ${String(s.answer)}$`), s.explain);
  }
  assert.equal(kinds.size, 5);
});

test('lesson 3: the SD of a number of heads', () => {
  for (const s of variants('random-variables', 'root-n')) {
    const text = plain(s.text);
    const n = Number(grab(/A fair coin is flipped (\d+) times, and every head pays 1 coin/, text)[0]);
    assert.match(text, /The flips are independent/);
    const m = moments(headsDistribution(n));
    near(s.answer, m.sd, 1e-7, `SD of heads in ${n} flips`);
    assert.equal(s.unit, 'coins');
    assert.ok(s.explain.includes(`= ${n / 4}$`));
    const variance = s.wrong.find(([, msg]) => /That is the variance/.test(msg));
    near(variance[0], m.variance, 1e-7);
  }
  near(moments(coin).variance, 0.25, 1e-12);                       // "its variance is 1/4"
});

test('lesson 3: true and false statements', () => {
  const truths = one('random-variables', 'truths');
  const verdict = (re) => { const o = truths.options.find((x) => re.test(x.text)); assert.ok(o, String(re)); return !!o.correct; };
  assert.equal(verdict(/even if the parts depend on each other/), true);
  assert.equal(verdict(/same unit/), true);
  assert.equal(verdict(/standard deviation of 0 always takes the same value/), true);
  assert.equal(verdict(/same expected value carry the same risk/), false);
  assert.equal(verdict(/variance of a sum is always the sum/), false);
  // "a die added to itself has four times the variance of one die"
  near(moments(fairDie.map(([v, p]) => [2 * v, p])).variance, 4 * moments(fairDie).variance, 1e-9);
});

/* ================================================================ lesson 4 */

/** Share of a normal curve within z SDs of the mean, by adding up thin strips. */
function normalInside(z, n = 200000) {
  const h = (2 * z) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) { const x = -z + (i + 0.5) * h; sum += Math.exp(-x * x / 2); }
  return (sum * h) / Math.sqrt(2 * Math.PI);
}

test('lesson 4: the lab steps accept exactly what the instructions ask for', () => {
  const add = one('normal-curve', 'add-dice');
  for (let n = 1; n <= add.widget.nRange[1]; n++) assert.equal(add.check({ n }) === true, n >= 10, `add-dice n=${n}`);
  assert.match(add.check({ n: 1 }), /1 die so far/);
  assert.match(add.check({ n: 9 }), /9 dice so far/);

  const load = one('normal-curve', 'load-dice');
  const rng = makeRng(7);
  const tried = [[1, 1, 1, 1, 1, 1], [2, 2, 2, 2, 2, 2], [4, 0, 0, 0, 0, 0], [0, 0, 3, 0, 0, 0], [1, 0, 0, 0, 0, 1], load.solution.weights];
  for (let t = 0; t < 400; t++) tried.push(Array.from({ length: 6 }, () => rng.int(0, 4)));
  for (const weights of tried) {
    if (!weights.some((v) => v > 0)) continue;
    const faces = weights.filter((v) => v > 0).length;
    const even = weights.every((v) => v === weights[0]);
    for (const n of [1, 2, 29, 30]) {
      const res = load.check({ n, weights, faces, flat: even });
      assert.equal(res === true, faces >= 2 && !even && n === 30, `weights ${weights}, n=${n}`);
      if (faces < 2) assert.match(res, /at least two faces/);
      else if (even) assert.match(res, /still a fair die/);
      else if (n < 30) assert.ok(res.includes(`${n} so far, go to 30`));
    }
  }
  assert.equal(load.widget.nRange[1], 30);
  assert.equal(load.solution.n, 30);

  // doubling the SD takes four dice
  const dbl = one('normal-curve', 'double-sd');
  const one1 = diceState([1, 1, 1, 1, 1, 1], 1).sd;
  assert.match(flat(dbl.text), /standard deviation of \*\*1\.71\*\*/);
  assert.match(flat(dbl.text), /exactly twice that SD: 3\.42/);
  for (let n = dbl.widget.nRange[0]; n <= dbl.widget.nRange[1]; n++) {
    const state = diceState([1, 1, 1, 1, 1, 1], n);
    const res = dbl.check(state);
    const isDouble = Math.abs(state.sd - 2 * one1) < 1e-9;
    assert.equal(res === true, isDouble, `double-sd n=${n}`);
    assert.equal(isDouble, n === 4);
    if (res !== true) {
      const quoted = /SD is (\d+\.\d+)/.exec(res);
      if (quoted) assert.equal(quoted[1], state.sd.toFixed(2).replace(/0$/, '').replace(/\.$/, ''), res);
      if (n > 4) assert.match(res, /more than 3\.42/);
    }
  }
  assert.match(dbl.check(diceState([1, 1, 1, 1, 1, 1], 2)), /about 1\.41 times/);
  assert.equal(Math.SQRT2.toFixed(2), '1.41');

  // the average: SD below 0.5 first happens at 12 dice
  const avg = one('normal-curve', 'average');
  assert.equal(avg.widget.view, 'average');
  const below = [];
  for (let n = avg.widget.nRange[0]; n <= avg.widget.nRange[1]; n++) {
    const state = diceState([1, 1, 1, 1, 1, 1], n, { view: 'average' });
    near(state.sd, one1 / Math.sqrt(n), 1e-9, `SD of the average of ${n} dice`);
    if (state.sd < 0.5) below.push(n);
    const res = avg.check(state);
    assert.equal(res === true, n === 12, `average n=${n}`);
    if (state.sd >= 0.5) assert.match(res, /Not below 0\.5 yet/);
    else if (n > 12) assert.match(res, /fewer dice will do/);
  }
  assert.equal(below[0], 12);
  assert.equal(avg.solution.n, 12);
  assert.equal((one1 / Math.sqrt(12)).toFixed(2), '0.49');
  assert.match(flat(avg.explain), /1\.71 \\div \\sqrt\{12\} \\approx 0\.49/);

  // 68–95–99.7
  const rule = one('normal-curve', 'rule');
  const { min, max, step } = rule.widget.params.z;
  for (let z = min; z <= max + 1e-9; z += step) {
    const res = rule.check({ z });
    const inside = 100 * normalInside(z);
    assert.equal(res === true, Math.abs(inside - 95) < 1, `band of ${z} SDs holds ${inside}%`);
    assert.equal(res === true, z === 2);
    if (res !== true) {
      assert.ok(res.includes(`${inside.toFixed(1)}%`), `${res} should quote ${inside.toFixed(1)}%`);
      assert.match(res, z < 2 ? /Make it wider/ : /make it narrower/);
    }
  }
  assert.equal((100 * normalInside(1)).toFixed(0), '68');
  assert.equal((100 * normalInside(2)).toFixed(0), '95');
  assert.equal((100 * normalInside(3)).toFixed(1), '99.7');
  // the three numbers are stated on the teaching screen that follows, with a picture of the 1-SD and 2-SD bands
  const teachZ = one('normal-curve', 'teach-z');
  assert.match(teachZ.text, /\*\*68%\*\*[\s\S]*\*\*95%\*\*[\s\S]*\*\*99\.7%\*\*/);
  assert.equal(teachZ.figures[0].fns[0].expr, rule.widget.fns[0].expr);
  assert.deepEqual(teachZ.figures[0].areas.map((a) => [a.from, a.to]), [[-2, 2], [-1, 1]]);
  assert.match(flat(rule.explain), /about two thirds/);
  assert.ok(normalInside(1) > 0.66 && normalInside(1) < 0.7);
  assert.equal(rule.widget.fns[0].expr, 'exp(-x^2/2)/sqrt(2*pi)');
  assert.deepEqual(rule.widget.labels.map((l) => l.x), [-3, -2, -1, 0, 1, 2, 3]);

  // dependent dice
  const copy = one('normal-curve', 'copy-dice');
  assert.equal(copy.check({ linked: true }), true);
  assert.equal(typeof copy.check({ linked: false }), 'string');
  const free = diceState([1, 1, 1, 1, 1, 1], 30);
  const tied = diceState([1, 1, 1, 1, 1, 1], 30, { linked: true });
  assert.equal(free.sd.toFixed(1), '9.4');
  assert.equal(tied.sd.toFixed(0), '51');
  assert.match(flat(copy.explain), /SD has jumped from 9\.4 to 51/);
  assert.match(flat(copy.explain), /30, 60, 90, 120, 150 or 180/);
  near(moments(totalDistribution([1, 2, 3, 4, 5, 6], [1, 1, 1, 1, 1, 1], 30, true).map((q) => [q.t, q.p])).sd, tied.sd, 1e-9);
  near(moments(totalDistribution([1, 2, 3, 4, 5, 6], [1, 1, 1, 1, 1, 1], 30).map((q) => [q.t, q.p])).sd, free.sd, 1e-9);
});

test('lesson 4: thirty loaded dice really do make a bell', () => {
  const hook = one('normal-curve', 'hook');
  assert.match(correctText(hook), /One hump in the middle, shaped like a bell/);
  const weights = hook.figures[0].weights;
  assert.deepEqual(weights.map((w) => w > 0), [true, true, false, false, true, true], 'never on 3 or 4');
  assert.ok(weights[0] + weights[5] > weights[1] + weights[4], 'mostly 1 or 6');
  const tot = weights.reduce((a, b) => a + b, 0);
  const die = weights.map((w, i) => [i + 1, w / tot]);
  const dist = sumDistribution(die, 30);
  const m = moments(dist);
  // one hump, at the mean, and close to the normal curve with the same mean and SD everywhere
  const peak = dist.reduce((best, q) => (q[1] > best[1] ? q : best));
  assert.ok(Math.abs(peak[0] - m.mean) <= 1);
  let worst = 0;
  for (const [t, p] of dist) worst = Math.max(worst, Math.abs(p - Math.exp(-((t - m.mean) ** 2) / (2 * m.variance)) / Math.sqrt(2 * Math.PI * m.variance)));
  assert.ok(worst < 0.06 * peak[1], `largest gap to the bell: ${worst} against a peak of ${peak[1]}`);
  const within = (k) => dist.filter(([t]) => Math.abs(t - m.mean) <= k * m.sd).reduce((s, [, p]) => s + p, 0);
  assert.ok(Math.abs(within(1) - 0.68) < 0.03 && Math.abs(within(2) - 0.95) < 0.02);
  // and the widget's own arithmetic agrees with the brute-force distribution
  const own = totalDistribution([1, 2, 3, 4, 5, 6], weights, 30);
  assert.equal(own.length, dist.length);
  own.forEach((q, i) => { assert.equal(q.t, dist[i][0]); near(q.p, dist[i][1], 1e-12); });
});

test('lesson 4: the SD of a total grows like the square root', () => {
  const scenes = new Set();
  for (const s of variants('normal-curve', 'sd-total')) {
    const text = plain(s.text);
    const sd = Number(grab(/standard deviation of (\d+) (?:coins|g|mm)/, text)[0]);
    const n = Number(grab(/over (\d+) days|of (\d+) bags|takes (\d+) steps/, text).find(Boolean));
    assert.match(text, /independent/);
    // variances add: n · sd², then the root
    near(s.answer, Math.sqrt(n * sd * sd), 1e-9, `${n} parts of SD ${sd}`);
    assert.ok(Number.isInteger(s.answer));
    assert.equal(s.unit, /coins/.test(text) ? 'coins' : / g\b/.test(text) ? 'g' : 'mm');
    const added = s.wrong.find(([, msg]) => /adds the/.test(msg));
    assert.equal(added[0], n * sd);
    const avg = s.wrong.find(([, msg]) => /SD of the \*average\*/.test(msg));
    near(avg[0], sd / Math.sqrt(n), 1e-9);
    assert.ok(s.explain.includes(`= ${s.answer}$`));
    scenes.add(s.unit);
  }
  assert.equal(scenes.size, 3);
  // the rule itself, checked on dice by brute force
  for (const n of [2, 4, 9]) near(moments(sumDistribution(fairDie, n)).sd, Math.sqrt(n) * moments(fairDie).sd, 1e-9);
});

test('lesson 4: z-scores', () => {
  const signs = new Set();
  for (const s of variants('normal-curve', 'z-score')) {
    const text = plain(s.text);
    const [mean, sd] = grab(/with a mean of (\d+) (?:cm|g|points) and a standard deviation of (\d+) (?:cm|g|points)/, text).map(Number);
    const x = Number(grab(/z-score of (?:a height of|a bag of|a score of|an apple of) (\d+) (?:cm|g|points)\?/, text)[0]);
    near(s.answer, (x - mean) / sd, 1e-12);
    assert.notEqual(s.answer, 0);
    assert.equal(s.keyboard, 'full', 'a negative answer must not be given away by the keypad');
    assert.ok(s.explain.includes(s.answer > 0 ? 'above the mean' : 'below the mean'));
    const sign = s.wrong.find(([, msg]) => /Check the sign/.test(msg));
    assert.ok(sign[1].includes(x > mean ? 'above the mean' : 'below the mean') && sign[1].includes(x > mean ? 'positive' : 'negative'));
    signs.add(Math.sign(s.answer));
  }
  assert.equal(signs.size, 2);
});

test('lesson 4: the number of heads in many flips', () => {
  for (const s of variants('normal-curve', 'coin-range', 60)) {
    const text = plain(s.text);
    const n = int(grab(/A fair coin is flipped ([\d,]+) times/, text)[0]);
    assert.match(text, /about 95% of the area lies within 2 SDs of the mean/);
    const [mean, sd, lo, hi] = blanks(s);
    assert.equal(mean, n / 2);
    near(sd * sd, n / 4, 1e-9);                                    // variances add: n quarters
    assert.equal(lo, mean - 2 * sd);
    assert.equal(hi, mean + 2 * sd);
    for (const v of [mean, sd, lo, hi]) assert.ok(Number.isInteger(v));
  }
  // the claims behind it, by brute force for the smaller cases
  for (const n of [100, 400, 900]) {
    const dist = headsDistribution(n);
    const m = moments(dist);
    near(m.mean, n / 2, 1e-6);
    near(m.sd, Math.sqrt(n) / 2, 1e-6);
    const inside = dist.filter(([h]) => Math.abs(h - m.mean) <= 2 * m.sd).reduce((t, [, p]) => t + p, 0);
    assert.ok(inside > 0.94 && inside < 0.97, `${n} flips: ${inside} within 2 SDs`);
  }
});

test('lesson 4: making an average calmer, and where to expect a bell', () => {
  for (const s of variants('normal-curve', 'four-times')) {
    const text = plain(s.text);
    const n0 = Number(grab(/asks (\d+) people|average of (\d+) independent measurements/, text).find(Boolean));
    const f = Number(grab(/to be (\d+) times smaller/, text)[0]);
    // SD of an average is proportional to 1/√n: the new n must make that f times smaller
    near((1 / Math.sqrt(s.answer)) * f, 1 / Math.sqrt(n0), 1e-12, `${n0} → ${s.answer}`);
    assert.ok(s.explain.includes(`= ${commas(s.answer)}$`));
    const linear = s.wrong.find(([, msg]) => /shrinks only by a factor/.test(msg));
    assert.equal(linear[0], n0 * f);
  }
  const bell = one('normal-curve', 'bell-or-not');
  const bucket = (re) => { const it = bell.items.find((i) => re.test(i.text)); assert.ok(it, String(re)); return it.bucket; };
  assert.equal(bucket(/total of 50 rolls/), 0);
  assert.equal(bucket(/heads in 400 flips/), 0);
  assert.equal(bucket(/average of 30 independent weighings/), 0);
  assert.equal(bucket(/lottery players/), 1);
  assert.equal(bucket(/flood damage/), 1);
  assert.equal(bucket(/one roll of one die/), 1);
});

/* ================================================================ lesson 5 */

/** Expected number of tries until the first success, by adding up k · P(first success on try k). */
function expectedWait(p) {
  let mean = 0;
  let still = 1;
  for (let k = 1; k < 200000 && still > 1e-15; k++) { mean += k * still * p; still *= 1 - p; }
  return mean;
}
/** Chance that at least two of k people share one of `days` equally likely birthdays. */
function shared(k, days = 365) {
  let different = 1;
  for (let i = 0; i < k; i++) different *= (days - i) / days;
  return 1 - different;
}

test('lesson 5: the numbers quoted about waiting, collecting and birthdays', () => {
  // the first six: most likely on roll 1, and the bars shrink by 5/6
  const first = (k) => (5 / 6) ** (k - 1) / 6;
  assert.ok(first(1) > first(2) && first(2) > first(3));
  assert.match(correctText(one('waiting-times', 'hook')), /1st roll/);
  near(expectedWait(1 / 6), 6, 1e-9);
  const rolls = sequences([1, 2, 3, 4, 5, 6], 3);
  const chain = one('waiting-times', 'chain');
  assert.deepEqual(blanks(chain), [rolls.filter((q) => !q.includes(6)).length, rolls.filter((q) => q[0] !== 6 && q[1] !== 6 && q[2] === 6).length]);
  assert.equal((100 * (5 / 6) ** 10).toFixed(0), '16');
  assert.match(flat(chain.explain), /about 16%/);
  assert.match(one('waiting-times', 'memoryless').options.find((o) => /unlucky/.test(o.text)).why, /about 16% of the time/);
  // the scratch cards of the last step: one winner in 10
  near(expectedWait(0.1), 10, 1e-9);
  assert.equal((100 * 0.9 ** 10).toFixed(0), '35');
  assert.match(flat(one('waiting-times', 'reflect').model), /expected wait is still 10 cards/);
  assert.match(flat(one('waiting-times', 'reflect').model), /\$0\.9\^\{10\}\$, about 35%/);
  assert.match(correctText(one('waiting-times', 'memoryless')), /^6, exactly as at the start/);
  // memorylessness: given no six in 10 rolls, the remaining wait has the same distribution
  for (const k of [1, 2, 5]) near(first(10 + k) / (5 / 6) ** 10, first(k), 1e-12);
  const sim = one('waiting-times', 'roll-sim');
  near(sim.widget.p, 1 / 6, 1e-12);
  assert.equal(sim.check({ trials: 200 }), true);
  assert.match(sim.check({ trials: 1 }), /1 wait recorded/);
  assert.match(sim.check({ trials: 199 }), /199 waits recorded/);

  // six toys
  const waits = [6 / 6, 6 / 5, 6 / 4, 6 / 3, 6 / 2, 6 / 1];
  const total = waits.reduce((a, b) => a + b, 0);
  near(total, 14.7, 1e-9);
  near(expectedCollectorWait(6), total, 1e-9);
  const sum = one('waiting-times', 'collector-sum');
  assert.deepEqual(blanks(sum), [waits[3], waits[5], 14.7]);
  assert.match(sum.template, /\| 1 \| 1\.2 \| 1\.5 \|/);
  assert.ok(!/1 \+ 1\.2/.test(sum.template), 'the total line does not give the blanks away');
  // the opening of the collector problem is now a teaching screen: it works the first three waits, and the
  // simulation that follows reports the average
  const hookC = one('waiting-times', 'collector-hook');
  assert.equal(hookC.type, 'info');
  assert.match(flat(hookC.text), /Wait: 1 box\./);
  assert.ok(flat(hookC.text).includes(`1 \\div \\frac{5}{6} = ${waits[1]}$ boxes`) && flat(hookC.text).includes(`1 \\div \\frac{4}{6} = ${waits[2]}$ boxes`));
  assert.ok(!/14\.7|\b15\b/.test(hookC.text), 'the teaching screen does not give the total away');
  assert.match(one('waiting-times', 'collector-sim').explain, /close to 14\.7/);
  assert.equal(Math.round(expectedCollectorWait(50)), 225);
  assert.match(flat(sum.explain), /A set of 50 takes about 225 boxes/);
  const simC = one('waiting-times', 'collector-sim');
  assert.equal(simC.widget.n, 6);
  assert.equal(simC.check({ trials: 200 }), true);
  assert.match(simC.check({ trials: 1 }), /1 set collected/);
  // "most need between 9 and 20, a few need more than 30": exact distribution of the number of boxes
  const done = (t) => { let s = 0; for (let j = 0; j <= 6; j++) s += (-1) ** j * C(6, j) * ((6 - j) / 6) ** t; return s; };
  assert.ok(done(20) - done(8) > 0.6);
  assert.ok(1 - done(30) > 0.01 && 1 - done(30) < 0.05);
  near(done(5), 0, 1e-12);

  // birthdays
  const hookB = one('waiting-times', 'birthday-hook');
  let smallest = 2;
  while (shared(smallest) <= 0.5) smallest++;
  assert.equal(smallest, 23);
  assert.equal(hookB.answer, 23);
  assert.equal(C(23, 2), 253);
  assert.match(hookB.explain, /253 different pairs/);
  assert.match(flat(hookB.text), /equally likely to be born on any of the 365 days of the year, independently/);
  const find = one('waiting-times', 'birthday-find');
  const { min, max } = find.widget.params.k;
  for (let k = min; k <= max; k++) {
    const res = find.check({ k });
    assert.equal(res === true, k === smallest, `birthday-find k=${k}`);
    if (res !== true) {
      assert.ok(res.includes(`${(Math.round(1000 * shared(k)) / 10)}%`), res);
      assert.match(res, k < 23 ? /not yet more than half/ : /a smaller group already gets there/);
    }
  }
  assert.equal((100 * shared(22)).toFixed(1), '47.6');
  assert.equal((100 * shared(23)).toFixed(1), '50.7');
  assert.equal((100 * shared(50)).toFixed(0), '97');
  assert.match(flat(find.explain), /With 22 people the chance is 47\.6%, and with 23 it is 50\.7%\. With 50 people it is 97%/);
  // the dots in the chart are the exact values, and the big dot follows the slider
  const dots = find.widget.points.filter((p) => typeof p.y === 'number');
  assert.equal(dots.length, 60);
  for (const d of dots) near(d.y, shared(d.x), 1e-12);
  const live = find.widget.points.find((p) => typeof p.y === 'function');
  near(live.y({ k: 23 }), shared(23), 1e-12);
  near(find.widget.readouts[0].value({ k: 40 }), 100 * shared(40), 1e-9);
  assert.ok(expectedBirthdayWait(365) > 24 && expectedBirthdayWait(365) < 25);
});

test('lesson 5: expected waits and the chance of still waiting', () => {
  const kinds = new Set();
  for (const s of variants('waiting-times', 'wait')) {
    const text = plain(s.text);
    let m;
    if ((m = /stops on gold with probability \$\\frac\{1\}\{(\d+)\}\$ on every spin, whatever happened before\. What is the probability that there is no gold at all in the first (\d+) spins/.exec(text))) {
      const [sides, k] = [Number(m[1]), Number(m[2])];
      const spins = sequences(Array.from({ length: sides }, (_, i) => i), k);      // 0 is gold
      const none = spins.filter((q) => !q.includes(0)).length;
      checkProbability(s, none, spins.length, `no gold in ${k} spins of 1/${sides}`);
      kinds.add('still');
      continue;
    }
    let p;
    if ((m = /grabs a prize on 1 try in (\d+), and every try is independent/.exec(text))) p = 1 / m[1];
    else p = Number(grab(/with probability ([\d.]+), independently/, text)[0]);
    near(s.answer, expectedWait(p), 1e-6, `expected wait at p = ${p}`);
    assert.match(text, /Count the successful one too/);
    assert.ok(['tries', 'packs', 'throws'].includes(s.unit));
    assert.ok(s.explain.includes(`= ${String(s.answer)}$`), s.explain);
    kinds.add(s.unit);
  }
  assert.equal(kinds.size, 4);
});

test('lesson 5: the wait for the next new sticker', () => {
  for (const s of variants('waiting-times', 'next-new')) {
    const text = plain(s.text);
    const [n, have] = grab(/room for (\d+) different stickers\. Every pack holds one sticker, equally likely to be any of the \d+, independently of the other packs\. You already have (\d+) different stickers/, text).map(Number);
    assert.ok(have >= 1 && have < n);
    const p = (n - have) / n;
    near(s.answer, expectedWait(p), 1e-6, `${have} of ${n}`);
    assert.ok(s.explain.includes(`missing ${n - have} of the ${n}`));
    assert.ok(s.explain.includes(`= ${String(s.answer)}$`), s.explain);
    assert.ok(s.answer > 1);
  }
});

test('lesson 5: at least two the same', () => {
  const scenes = new Set();
  for (const s of variants('waiting-times', 'same-pick')) {
    const text = plain(s.text);
    let days;
    let k;
    let m;
    if ((m = /^(\d+) friends each write down a whole number from 1 to (\d+), in secret\. Assume every number is equally likely and the friends choose independently/.exec(text))) { k = Number(m[1]); days = Number(m[2]); scenes.add('friends'); }
    else if ((m = /^You roll (\d+) fair dice\./.exec(text))) { k = Number(m[1]); days = 6; scenes.add('dice'); }
    else if ((m = /^(\d+) people are chosen at random\. Assume each is equally likely to have been born on any of the 7 days of the week, independently/.exec(text))) { k = Number(m[1]); days = 7; scenes.add('weekdays'); }
    else { m = grab(/^(\d+) people are chosen at random\. Assume each is equally likely to have been born in any of the 12 months, independently/, text); k = Number(m[0]); days = 12; scenes.add('months'); }
    assert.match(text, /at least two of them/);
    const picks = sequences(Array.from({ length: days }, (_, i) => i), k);
    const clash = picks.filter((q) => new Set(q).size < k).length;
    checkProbability(s, clash, picks.length, `${k} picks from ${days}`);
    near(s.answer, shared(k, days), 1e-12);
    const diff = s.wrong.find(([, msg]) => /all \d are different/.test(msg));
    near(diff[0], (picks.length - clash) / picks.length, 1e-12);
  }
  assert.equal(scenes.size, 4);
});

/* ================================================================ lesson 6 */

/** The state markov-flow reports after `steps` steps from `start`, worked out here. */
function chainState(P, start, steps) {
  const total = start.reduce((a, b) => a + b, 0);
  const next = (c) => c.map((_, j) => c.reduce((t, v, i) => t + v * P[i][j], 0));
  const show = (c) => c.map((v) => Math.round(v));
  let counts = start.slice();
  let before = null;
  for (let t = 0; t < steps; t++) { before = show(counts); counts = next(counts); }
  const shown = show(counts);
  let later = counts;
  let settled = steps > 0;
  for (let t = 0; t < 400 && settled; t++) { later = next(later); if (show(later).some((v, i) => v !== shown[i])) settled = false; }
  const after = next(counts);
  return {
    step: steps, counts, shown, start, total,
    flows: P.map((row, i) => row.map((p) => counts[i] * p)),
    net: after.map((v, i) => v - counts[i]),
    still: steps > 0 && shown.every((v, i) => v === before[i]),
    settled,
    balanced: after.every((v, i) => Math.abs(v - counts[i]) <= total * 1e-6),
    moving: counts.reduce((t, v, i) => (P[i][i] === 1 ? t : t + v), 0),
  };
}
/** Long-run shares of a chain, by stepping a crowd forward until it stops changing. */
function longRun(P, start) {
  let c = start.slice();
  for (let t = 0; t < 5000; t++) c = c.map((_, j) => c.reduce((s, v, i) => s + v * P[i][j], 0));
  return c;
}

test('lesson 6: the weather towns settle at 800 sunny whatever the start', () => {
  const crowd = one('markov-chains', 'crowd');
  const P = crowd.widget.P;
  // the rule in the text is the rule in the widget
  const hook = one('markov-chains', 'hook');
  assert.match(flat(hook.text), /After a sunny day, the next day is sunny 90% of the time\. After a rainy day, the next day is rainy 60% of the time/);
  assert.deepEqual(P, [[0.9, 0.1], [0.4, 0.6]]);
  for (const row of P) near(row[0] + row[1], 1, 1e-12);
  const steady = longRun(P, [1000, 0]);
  near(steady[0], 800, 1e-6);
  assert.equal(hook.answer, 80);
  assert.deepEqual(longRun(P, [0, 1000]).map((v) => Math.round(v)), [800, 200]);
  assert.deepEqual([0, 1, 2, 3].map((t) => chainState(P, [1000, 0], t).shown[0]), [1000, 900, 850, 825]);
  assert.match(flat(crowd.explain), /1000, 900, 850, 825/);
  assert.match(flat(crowd.explain), /\*\*800 sunny, 200 rainy\*\*/);
  // the widget's own stepping and rounding agree with the arithmetic here
  near(stepCounts([1000, 0], P)[0], 900, 1e-9);
  assert.deepEqual(roundCounts([833.4, 166.6]), [833, 167]);

  let firstSettled = null;
  for (let t = 0; t <= 60; t++) {
    const state = chainState(P, crowd.widget.start, t);
    const res = crowd.check(state);
    assert.equal(res === true, state.settled, `crowd day ${t}`);
    if (state.settled) { assert.deepEqual(state.shown, [800, 200]); if (firstSettled == null) firstSettled = t; }
    else if (t === 0) assert.match(res, /Press "Next day"/);
    else if (state.still) assert.match(res, /held still for a day/);
    else assert.ok(res.includes(`Day ${t}`));
    if (firstSettled != null) assert.ok(state.settled, 'once settled, always settled');
  }
  assert.ok(firstSettled > 3 && firstSettled <= crowd.solution.steps, `settles on day ${firstSettled}`);

  const other = one('markov-chains', 'other-start');
  assert.deepEqual(other.widget.P, P);
  const starts = other.widget.starts.map((o) => o.counts);
  assert.deepEqual(starts, [[1000, 0], [0, 1000], [500, 500]]);
  let sawStillButMoving = false;
  for (const start of starts) {
    for (let t = 0; t <= 60; t++) {
      const state = chainState(P, start, t);
      const res = other.check(state);
      assert.equal(res === true, start[0] !== 1000 && state.settled, `other-start from ${start}, day ${t}`);
      if (start[0] === 1000) assert.match(res, /every town sunny, like the last one/);
      if (state.settled) assert.deepEqual(state.shown, [800, 200]);
      if (state.still && !state.settled) sawStillButMoving = true;
    }
  }
  assert.ok(sawStillButMoving, 'a number can hold still for a day before it has settled: the check waits');
  assert.equal(other.check(chainState(P, other.solution.start, other.solution.steps)), true);

  const fill = one('markov-chains', 'balance-weather');
  assert.deepEqual(blanks(fill), [P[1][0] / P[0][1], Math.round(steady[0]), Math.round(steady[1])]);
  near(P[0][1] * steady[0], P[1][0] * steady[1], 1e-6);            // the flows balance
});

test('lesson 6: sharing out the customers by hand', () => {
  const step = one('markov-chains', 'balance');
  const P = step.widget.P;
  assert.match(flat(step.text), /20% of brand A's customers switch to B, and 30% of brand B's customers switch to A/);
  assert.deepEqual(P, [[0.8, 0.2], [0.3, 0.7]]);
  const steady = longRun(P, [500, 500]);
  const good = [];
  for (let a = 0; a <= 1000; a += step.widget.placeStep) {
    const state = chainState(P, [a, 1000 - a], 0);
    const res = step.check(state);
    const stays = Math.abs(P[0][1] * a - P[1][0] * (1000 - a)) < 1e-6;
    assert.equal(res === true, stays, `balance at ${a}`);
    if (res === true) good.push(a);
    else {
      const out = Math.round(P[0][1] * a);
      const back = Math.round(P[1][0] * (1000 - a));
      assert.ok(res.includes(`lose ${out} customers`) && res.includes(`${back}`), res);
      assert.match(res, a > steady[0] ? /A has too many/ : /A has too few/);
    }
  }
  assert.deepEqual(good, [600]);
  near(steady[0], 600, 1e-6);
  assert.deepEqual(step.solution.counts, [600, 400]);
  assert.match(flat(step.explain), /0\.2 \\times 600 = 120\$ and \$0\.3 \\times 400 = 120/);
});

test('lesson 6: long-run shares of two-state chains', () => {
  const scenes = new Set();
  for (const s of variants('markov-chains', 'steady')) {
    const text = plain(s.text);
    let m;
    if ((m = /working machine has a (\d+)% chance of breaking down by the next day\. A broken one has a (\d+)% chance of being repaired by the next day\. In the long run, what percentage of days is the machine working/.exec(text))) scenes.add('machine');
    else if ((m = /a dry day is followed by a wet one (\d+)% of the time, and a wet day is followed by a dry one (\d+)% of the time\. In the long run, what percentage of days are dry/.exec(text))) scenes.add('weather');
    else { m = grab(/After a week with X, there is a (\d+)% chance of switching to Y\. After a week with Y, there is a (\d+)% chance of switching to X\. In the long run, in what percentage of weeks does the shopper buy brand X/, text); scenes.add('shopper'); if (m.length === 2) m = [null, ...m]; }
    const a = Number(m[1]) / 100;                                  // chance of leaving the state that is asked about
    const b = Number(m[2]) / 100;                                  // chance of coming back to it
    const share = longRun([[1 - a, a], [b, 1 - b]], [0.3, 0.7])[0];
    near(s.answer, 100 * share, 1e-6, `leave ${a}, return ${b}`);
    assert.ok(Number.isInteger(s.answer));
    assert.equal(s.unit, '%');
    const other = s.wrong.find(([, msg]) => /long-run share of "/.test(msg));
    near(other[0], 100 - s.answer, 1e-9);
    const stay = s.wrong.find(([, msg]) => /balancing the two flows/.test(msg));
    if (stay) near(stay[0], 100 * (1 - a), 1e-9);
    assert.ok(s.explain.includes(`= ${s.answer}\\%$`));
  }
  assert.equal(scenes.size, 3);
});

test('lesson 6: stepping a crowd forward twice', () => {
  for (const s of variants('markov-chains', 'two-steps')) {
    const text = plain(s.text);
    const [a, b] = grab(/Each (?:week|day), (\d+)% of (?:brand A's customers switch to brand B|the bikes at the station end up in town), and (\d+)% of (?:brand B's customers switch to A|the bikes in town are brought back to the station)/, text).map((v) => Number(v) / 100);
    assert.match(text, /^1000 (customers all use brand A today|shared bikes all start the day at the station)/);
    const P = [[1 - a, a], [b, 1 - b]];
    const after = chainState(P, [1000, 0], 2).counts;
    near(s.answer, after[0], 1e-6, `leave ${a}, return ${b}`);
    assert.ok(Number.isInteger(s.answer));
    const first = chainState(P, [1000, 0], 1).counts;
    assert.ok(s.hints[0].includes(`${Math.round(first[0])} ${/bikes/.test(text) ? 'at the station' : 'with A'}`) && s.hints[0].includes(`${Math.round(first[1])} ${/bikes/.test(text) ? 'in town' : 'with B'}`), s.hints[0]);
    const oneStep = s.wrong.find(([, msg]) => /after one/.test(msg));
    near(oneStep[0], first[0], 1e-6);
    assert.ok(s.explain.includes(`= ${s.answer}$`));
  }
});

test("lesson 6: the gambler's chain", () => {
  const ruin = one('markov-chains', 'ruin');
  const P = ruin.widget.P;
  assert.equal(P.length, 5);
  P.forEach((row, i) => {
    near(row.reduce((a, b) => a + b, 0), 1, 1e-12);
    if (i === 0 || i === 4) assert.equal(row[i], 1, 'the ends keep you');
    else { assert.equal(row[i - 1], 0.5); assert.equal(row[i + 1], 0.5); }
  });
  assert.deepEqual(ruin.widget.start, [0, 1000, 0, 0, 0]);
  assert.deepEqual(ruin.widget.states.map((st) => st.name), ['0 coins', '1 coin', '2 coins', '3 coins', '4 coins']);
  let firstSettled = null;
  for (let t = 0; t <= 60; t++) {
    const state = chainState(P, ruin.widget.start, t);
    const res = ruin.check(state);
    assert.equal(res === true, state.settled, `ruin round ${t}`);
    // a fair game: the average fortune of the crowd never moves
    near(state.counts.reduce((sum, v, i) => sum + v * i, 0) / 1000, 1, 1e-9);
    // nobody ever leaves an end tank, on display as well
    if (t > 0) { const prev = chainState(P, ruin.widget.start, t - 1).shown; assert.ok(state.shown[0] >= prev[0] && state.shown[4] >= prev[4]); }
    if (state.settled) { assert.deepEqual(state.shown, [750, 0, 0, 0, 250]); if (firstSettled == null) firstSettled = t; }
    else if (t === 0) assert.match(res, /Press "Next round" or "10 rounds"/);
    else if (state.moving >= 0.5) assert.ok(res.includes(`About ${Math.round(state.moving)} gambler`), res);
    else assert.match(res, /A few more rounds/);
  }
  assert.ok(firstSettled > 10 && firstSettled <= ruin.solution.steps && ruin.solution.steps <= 60, `settles in round ${firstSettled}`);
  assert.match(flat(ruin.explain), /\*\*750\*\* gamblers end with nothing and \*\*250\*\* with 4 coins/);
  assert.match(correctText(one('markov-chains', 'ruin-hook')), /1 in 4/);
  near(longRun(P, [0, 0, 0, 1000, 0])[4], 750, 1e-6);              // "from 3 coins it is 3 in 4"
  assert.match(flat(one('markov-chains', 'remembers').explain), /From 1 coin the chance of reaching 4 is 1 in 4; from 3 coins it is 3 in 4/);

  for (const s of variants('markov-chains', 'ruin-chance')) {
    const text = plain(s.text);
    let k;
    let goal;
    let m;
    if ((m = /starts with (\d+) coins?\. Each round she wins or loses 1 coin on the flip of a fair coin\. She stops when she has (\d+) coins, or when she has none/.exec(text))) { k = Number(m[1]); goal = Number(m[2]); }
    else { m = grab(/stands on square (\d+) of a track numbered 0 to (\d+)\. Each turn a fair coin decides whether it moves one square up or one square down\. The game ends when the token reaches square 0 or square \d+/, text); k = Number(m[0]); goal = Number(m[1]); }
    assert.ok(k >= 1 && k < goal);
    // a walk on 0 … goal with both ends absorbing: step a crowd until it has all been absorbed
    const walk = Array.from({ length: goal + 1 }, (_, i) => Array.from({ length: goal + 1 }, (_, j) => (i === 0 || i === goal ? (i === j ? 1 : 0) : (Math.abs(i - j) === 1 ? 0.5 : 0))));
    const start = Array.from({ length: goal + 1 }, (_, i) => (i === k ? 1 : 0));
    const end = longRun(walk, start);
    near(s.answer, end[goal], 1e-9, `from ${k} to ${goal}`);
    checkProbability(s, k, goal, `ruin ${k}/${goal}`);
    const broke = s.wrong.find(([, msg]) => /ending at 0/.test(msg));
    if (broke) near(broke[0], end[0], 1e-9);
  }
});

test('lesson 6: true and false statements, and the facts in the margins', () => {
  const truths = one('markov-chains', 'truths');
  const verdict = (re) => { const o = truths.options.find((x) => re.test(x.text)); assert.ok(o, String(re)); return !!o.correct; };
  assert.equal(verdict(/depends only on the current state/), true);
  assert.equal(verdict(/as many move from the first to the second as move back/), true);
  assert.equal(verdict(/can never be left/), true);
  assert.equal(verdict(/nobody changes state any more/), false);
  assert.equal(verdict(/whatever its start/), false);
  assert.match(truths.explain, /\(#\/learn\/ai\/predicting-words\)/);
  assert.match(one('waiting-times', 'memoryless').explain, /\(#\/learn\/probability\/the-long-run\)/);
  assert.match(one('markov-chains', 'name').text, /1906[\s\S]*1913[\s\S]*20,000 letters/);
});

/* ============================================================== reviewer */
// Added in review. These checks do not trust any number in the lessons: arithmetic quoted in a formula is
// re-evaluated as written, and the displays of the two exact widgets are compared with whole-number arithmetic.

/**
 * The value of a piece of TeX that is pure arithmetic: numbers, + − × ÷, fractions, roots, powers, factorials,
 * binomial coefficients and per cent. Anything else (a letter, \cdots, an empty side) gives null.
 */
function texValue(source) {
  const src = source.replace(/\\text\{[^{}]*\}\s*$/, '').replace(/\\[,;:! ]/g, ' ').trim();
  if (!src) return null;
  const tokens = [];
  const re = /\s*(\d+(?:,\d{3})*(?:\.\d+)?|\\times|\\cdot|\\div|\\d?frac|\\tfrac|\\sqrt|\\binom|\\left\(|\\right\)|\\%|[-+−(){}^!])/y;
  let at = 0;
  while (at < src.length) {
    re.lastIndex = at;
    const m = re.exec(src);
    if (!m) { if (/^\s*$/.test(src.slice(at))) break; return null; }
    tokens.push(m[1]);
    at = re.lastIndex;
  }
  let i = 0;
  const peek = () => tokens[i];
  const take = (t) => { if (tokens[i] !== t) throw new Error(`expected ${t}`); i++; };
  const group = () => { take('{'); const v = expr(); take('}'); return v; };
  function primary() {
    const t = tokens[i++];
    if (t === undefined) throw new Error('ended early');
    if (/^\d/.test(t)) return Number(t.replace(/,/g, ''));
    if (t === '(' || t === '\\left(') { const v = expr(); if (tokens[i] !== ')' && tokens[i] !== '\\right)') throw new Error('bracket'); i++; return v; }
    if (t === '{') { i--; return group(); }
    if (t === '\\frac' || t === '\\dfrac' || t === '\\tfrac') { const a = group(); const b = group(); return a / b; }
    if (t === '\\sqrt') return Math.sqrt(group());
    if (t === '\\binom') { const a = group(); const b = group(); return C(a, b); }
    throw new Error(`unexpected ${t}`);
  }
  function postfix() {
    let v = primary();
    for (;;) {
      if (peek() === '^') { i++; const e = peek() === '{' ? group() : primary(); v **= e; }
      else if (peek() === '!') { i++; v = factorial(v); }
      else if (peek() === '\\%') { i++; v /= 100; }
      else return v;
    }
  }
  const unary = () => (peek() === '-' || peek() === '−' ? (i++, -unary()) : postfix());
  function term() {
    let v = unary();
    for (;;) {
      if (peek() === '\\times' || peek() === '\\cdot') { i++; v *= unary(); }
      else if (peek() === '\\div') { i++; v /= unary(); }
      else return v;
    }
  }
  function expr() {
    let v = term();
    for (;;) {
      if (peek() === '+') { i++; v += term(); }
      else if (peek() === '-' || peek() === '−') { i++; v -= term(); }
      else return v;
    }
  }
  try { const v = expr(); return i === tokens.length && Number.isFinite(v) ? v : null; } catch { return null; }
}

/** Every "a = b" and "a ≈ b" between two pieces of pure arithmetic in a text, as [left, relation, right, leftValue, rightValue]. */
function quotedArithmetic(text) {
  const out = [];
  const maths = [...String(text).matchAll(/\$\$([\s\S]+?)\$\$|\$([^$]+)\$/g)].map((m) => m[1] || m[2]);
  for (const tex of maths) {
    const parts = tex.replace(/\\begin\{aligned\}|\\end\{aligned\}|\\\\|&|\\quad/g, ' ').split(/(=|\\approx|\\neq|\\leq?(?![a-zA-Z])|\\geq?(?![a-zA-Z])|<|>|\\longrightarrow)/);
    for (let k = 1; k + 1 < parts.length; k += 2) {
      if (parts[k] !== '=' && parts[k] !== '\\approx') continue;
      const a = texValue(parts[k - 1]);
      const b = texValue(parts[k + 1]);
      if (a != null && b != null) out.push([parts[k - 1].trim(), parts[k], parts[k + 1].trim(), a, b]);
    }
  }
  return out;
}

test('reviewer: the TeX arithmetic reader', () => {
  near(texValue('8 \\times 7 \\times 6'), 336);
  near(texValue('\\dfrac{9 \\times 8 \\times 7}{3 \\times 2 \\times 1}'), 84);
  near(texValue('1 - \\left(\\frac{1}{16} + \\frac{4}{16}\\right)'), 11 / 16, 1e-12);
  near(texValue('\\left(\\frac{2}{3}\\right)^{3}'), 8 / 27, 1e-12);
  near(texValue('\\frac{1}{10} \\times 90^2 + \\frac{9}{10} \\times 10^2'), 900, 1e-9);
  near(texValue('7!'), 5040);
  near(texValue('3,628,800'), 3628800);
  near(texValue('\\binom{10}{5}'), 252);
  near(texValue('24.6\\%'), 0.246, 1e-12);
  near(texValue('\\dfrac{-20}{8}'), -2.5);
  near(texValue('56 \\text{ ways.}'), 56);
  near(texValue('1.71 \\div \\sqrt{12}'), 1.71 / Math.sqrt(12), 1e-12);
  for (const notArithmetic of ['n \\times p', '5R', '', '1, 4, 6', 'P', '\\cdots', '2 3']) assert.equal(texValue(notArithmetic), null, notArithmetic);
  // the two slips this reader was written to catch
  const bad = quotedArithmetic('two have $2.92 + 2.92 = 5.83$, and $\\sqrt{5.83} \\approx 2.42$');
  assert.equal(bad.length, 2);
  assert.ok(Math.abs(bad[0][3] - bad[0][4]) > 0.005 && Math.abs(bad[1][3] - bad[1][4]) > 0.005);
});

test('reviewer: every piece of arithmetic quoted in a formula is true as written', () => {
  let compared = 0;
  const checkText = (text, where) => {
    for (const [left, rel, right, a, b] of quotedArithmetic(text)) {
      compared++;
      if (rel === '=') {
        assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)), `${where}: "${left} = ${right}" is ${a} against ${b}`);
      } else {
        // "≈": the right-hand side must be the left-hand side rounded to the digits shown
        const shown = /(\d+)(?:\.(\d+))?\s*(\\%)?$/.exec(right);
        assert.ok(shown, `${where}: "${right}"`);
        const unit = 10 ** -(shown[2] || '').length * (shown[3] ? 0.01 : 1);
        assert.ok(Math.abs(a - b) <= unit / 2 + 1e-9, `${where}: "${left} ≈ ${right}" is ${a}, which does not round to ${b}`);
      }
    }
  };
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(1234 + k * 977), step.id);
        for (const text of visible(s)) checkText(text, `${id}/${step.id} seed ${k}`);
        if (!step.gen) break;
      }
    }
    for (const line of [...lesson.recap, lesson.next]) checkText(line, `${id} recap`);
  }
  assert.ok(compared > 4000, `${compared} equalities re-evaluated`);
});

test('reviewer: the first six, roll by roll', () => {
  // each option of the opening question names one roll (or "every roll"), so that the options can be compared:
  // "the 3rd or 4th roll" together would be likelier (21%) than the 1st roll alone (17%)
  const first = (k) => (5 / 6) ** (k - 1) / 6;
  assert.ok(first(3) + first(4) > first(1));
  const hook = one('waiting-times', 'hook');
  const rolls = hook.options.map((o) => /^On the (\d+)(?:st|nd|rd|th) roll$/.exec(o.text)).filter(Boolean).map((m) => Number(m[1]));
  assert.equal(rolls.length, hook.options.length - 1, 'one roll per option');
  assert.ok(hook.options.some((o) => /Every roll is equally likely/.test(o.text)));
  assert.equal(new Set(rolls).size, rolls.length);
  const best = rolls.reduce((a, b) => (first(a) >= first(b) ? a : b));
  assert.equal(best, 1);
  assert.match(correctText(hook), /^On the 1st roll$/);
  for (const k of rolls) if (k !== 1) assert.ok(first(k) < first(1));
  // the chart of waits: every bar is 5/6 of the one before it, except the last, which collects the long waits
  const sim = one('waiting-times', 'roll-sim');
  const cap = sim.widget.cap;
  for (let k = 2; k < cap; k++) near(first(k) / first(k - 1), 5 / 6, 1e-12);
  const lastBar = (5 / 6) ** (cap - 1);                            // P(wait ≥ cap)
  assert.ok(lastBar > first(cap - 1), 'the collecting bar is taller than the bar before it');
  assert.ok(flat(sim.explain).includes(`except the last one, which collects every wait of ${cap} rolls or more`));
  near(1 - sequences([1, 2, 3, 4, 5, 6], 4).filter((q) => !q.includes(6)).length / 6 ** 4, first(1) + first(2) + first(3) + first(4), 1e-12);
});

test('reviewer: the tanks show exact arithmetic, rounded half up, at every step', () => {
  // counts as whole numbers over a power of ten, so that nothing is lost to floating point
  const exactShown = (P10, start, steps) => {
    let num = start.map((v) => BigInt(v));
    let den = 1n;
    const shown = [];
    for (let t = 0; t <= steps; t++) {
      shown.push(num.map((v) => Number((2n * v + den) / (2n * den))));
      num = num.map((_, j) => num.reduce((sum, v, i) => sum + v * BigInt(P10[i][j]), 0n));
      den *= 10n;
    }
    return shown;
  };
  const widgetShown = (P, start, steps) => { const out = []; let c = start.slice(); for (let t = 0; t <= steps; t++) { out.push(roundCounts(c)); c = stepCounts(c, P); } return out; };
  const tenths = (P) => P.map((row) => row.map((v) => Math.round(v * 10)));
  const crowd = one('markov-chains', 'crowd');
  const other = one('markov-chains', 'other-start');
  const ruin = one('markov-chains', 'ruin');
  const runs = [[crowd.widget.P, crowd.widget.start], ...other.widget.starts.map((o) => [other.widget.P, o.counts]), [ruin.widget.P, ruin.widget.start]];
  for (const [P, start] of runs) {
    for (const row of tenths(P)) assert.equal(row.reduce((a, b) => a + b, 0), 10);
    const exact = exactShown(tenths(P), start, 45);                // 45 steps keep 10^45 well inside BigInt, and cover every solution
    const own = widgetShown(P, start, 45);
    exact.forEach((row, t) => assert.deepEqual(own[t], row, `start ${start}, step ${t}`));
    // and the state the checks of this file are fed (chainState) shows the same numbers
    for (const t of [0, 1, 4, 6, 9, 10, 20, 21, 40]) assert.deepEqual(chainState(P, start, t).shown, exact[t], `chainState, start ${start}, step ${t}`);
  }
  // 812.5 sunny towns on day 4 are shown as 813 (half up), and 187.5 rainy ones as 188
  assert.deepEqual(exactShown(tenths(crowd.widget.P), [1000, 0], 4)[4], [813, 188]);
  // from "half and half" the display holds at 799 / 201 on days 8 and 9 and then moves to 800 / 200:
  // on day 9 the check refuses, and its message agrees with what is on the screen
  const half = exactShown(tenths(other.widget.P), [500, 500], 12);
  assert.deepEqual([half[8], half[9], half[10], half[11]], [[799, 201], [799, 201], [800, 200], [800, 200]]);
  const day9 = chainState(other.widget.P, [500, 500], 9);
  assert.ok(day9.still && !day9.settled);
  assert.match(other.check(day9), /held still for a day/);
  assert.ok(!/still moving/.test(other.check(day9)));
  assert.match(other.check(chainState(other.widget.P, [500, 500], 5)), /Day 5: the numbers are still moving/);
  assert.equal(other.check(chainState(other.widget.P, [500, 500], 10)), true);
  // the gamblers: 750 / 250 exactly in the limit, by solving h(k) = (h(k − 1) + h(k + 1)) / 2 with h(0) = 0, h(4) = 1
  const h = [0, 1 / 4, 2 / 4, 3 / 4, 1];
  for (let k = 1; k < 4; k++) near(h[k], (h[k - 1] + h[k + 1]) / 2, 1e-12);
  assert.deepEqual(exactShown(tenths(ruin.widget.P), ruin.widget.start, 45)[45], [1000 * (1 - h[1]), 0, 0, 0, 1000 * h[1]]);
});

test('reviewer: every entry of the triangle, every route on the board, and the dice chart for any loading', () => {
  // pascal-triangle draws at most 11 rows
  for (let n = 0; n <= 10; n++) {
    const row = pascalRow(n);
    for (let k = 0; k <= n; k++) {
      assert.equal(widgetChoose(n, k), row[k], `row ${n}, place ${k}`);
      assert.equal(row[k], groups(n, k).length, `${n} choose ${k} by listing`);
    }
  }
  // galton-board, steer mode (1 to 6 rows): the number of different routes into bin k is "rows choose k"
  for (let rows = 1; rows <= 6; rows++) {
    const routes = allRoutes(rows);
    assert.equal(new Set(routes).size, 2 ** rows);
    for (let k = 0; k <= rows; k++) {
      const into = routes.filter((q) => rights(q) === k);
      assert.equal(into.length, widgetChoose(rows, k));
      assert.equal(steerState(into, rows, k).needed, into.length);
    }
  }
  // drop mode: the most likely bin for every setting of the two sliders, with the lower bin on a tie
  for (let rows = 2; rows <= 12; rows++) {
    for (let i = 2; i <= 18; i++) {
      const p = i / 20;
      const own = widgetBinomial(rows, p);
      near(own.reduce((a, b) => a + b, 0), 1, 1e-12);
      const dist = sumDistribution([[1, p], [0, 1 - p]], rows);
      dist.forEach(([k, pr]) => near(own[k], pr, 1e-12, `binomial(${rows}, ${p})[${k}]`));
    }
  }
  // dice-sum-lab: exact totals for any loading, and the rules the widget uses for the mean and the SD
  const rng = makeRng(2026);
  const loadings = [[1, 1, 1, 1, 1, 1], [4, 1, 0, 0, 1, 4], [1, 0, 0, 0, 0, 1], [4, 0, 0, 0, 0, 1], [0, 2, 0, 0, 0, 0]];
  while (loadings.length < 30) { const w = Array.from({ length: 6 }, () => rng.int(0, 4)); if (w.some((v) => v > 0)) loadings.push(w); }
  for (const weights of loadings) {
    const tot = weights.reduce((a, b) => a + b, 0);
    const die = weights.map((w, i) => [i + 1, w / tot]);
    const dm = moments(die);
    for (const n of [1, 2, 5, 12, 30]) {
      const brute = sumDistribution(die, n);
      const own = totalDistribution([1, 2, 3, 4, 5, 6], weights, n);
      assert.equal(own.length, brute.length, `support of ${n} dice loaded ${weights}`);
      own.forEach((q, i) => { assert.equal(q.t, brute[i][0]); near(q.p, brute[i][1], 1e-12); });
      const m = moments(brute);
      near(m.mean, n * dm.mean, 1e-9);
      near(m.variance, n * dm.variance, 1e-9, 'variances of independent dice add:');
      near(moments(brute.map(([t, p]) => [t / n, p])).variance, dm.variance / n, 1e-9, 'variance of the average:');
      const copies = totalDistribution([1, 2, 3, 4, 5, 6], weights, n, true).map((q) => [q.t, q.p]);
      near(moments(copies).variance, n * n * dm.variance, 1e-9, 'copied dice:');
      assert.deepEqual(copies.map(([t]) => t), die.filter(([, p]) => p > 0).map(([v]) => n * v));
    }
  }
});

test('reviewer: answers with thousands, units and signs can be typed as a learner would', () => {
  for (const s of variants('normal-curve', 'coin-range', 40)) {
    for (const b of s.blanks) assert.equal(parseNumber(commas(b.numbers[0])), b.numbers[0], `"${commas(b.numbers[0])}"`);
  }
  for (const s of variants('normal-curve', 'four-times', 60)) assert.equal(parseNumber(commas(s.answer), { unit: s.unit }), s.answer);
  for (const s of variants('normal-curve', 'z-score', 60)) {
    for (const typed of [String(s.answer), String(s.answer).replace('.', ','), String(s.answer).replace('-', '−')]) assert.equal(parseNumber(typed), s.answer, typed);
  }
  for (const s of variants('markov-chains', 'steady', 40)) assert.equal(parseNumber(`${s.answer}%`, { unit: '%', percentAsNumber: true }), s.answer);
  // non-integer answers without a tolerance are short decimals, also typed as a fraction or with a comma
  for (const [lesson, id] of [['waiting-times', 'wait'], ['waiting-times', 'next-new'], ['random-variables', 'add-means']]) {
    for (const s of variants(lesson, id, 120)) {
      if (s.tolerance != null || Number.isInteger(s.answer)) continue;
      const text = String(s.answer);
      assert.ok(/^\d+\.\d{1,2}$/.test(text), `${lesson}/${id}: ${text}`);
      const [whole, decimals] = text.split('.');
      const den = 10 ** decimals.length;
      near(parseNumber(`${Number(whole) * den + Number(decimals)}/${den}`), s.answer, 1e-12);
      near(parseNumber(text.replace('.', ',')), s.answer, 1e-12);
    }
  }
});

/* ============================================================ teach first */
// The course was revised so that every lesson teaches before it asks. Each row: the lesson, a teaching screen,
// the first graded step it serves, and what that step needs to find on the screen. `added` marks the screens
// that the revision added; the others existed and gained a worked example.
const TAUGHT = [
  ['counting-arrangements', 'teach-stages', 'multiply', [/\*\*multiply\*\*/, /5 \\times 7 \\times 2 = 70/, /10 \\times 10 \\times 10 \\times 10 = 10,000/], 'added'],
  ['counting-arrangements', 'factorial', 'orders', [/\*\*factorial\*\*/, /n! = n \\times \(n-1\)/, /8! = 8 \\times 7/]],
  ['counting-arrangements', 'teach-arrange', 'arrange', [/with \$k\$ factors/, /12 \\times 11 = 132/, /12 \\times 11 \\times 10 = 1,320/], 'added'],
  ['counting-arrangements', 'choose-idea', 'choose', [/\*\*choose\*\*/, /\\binom\{n\}\{k\}/, /\\binom\{10\}\{3\}/, /\*\*permutations\*\*/, /\*\*combinations\*\*/]],
  ['counting-arrangements', 'example-groups', 'all-red', [/\\binom\{10\}\{2\}/, /\\binom\{3\}\{2\}/, /\\dfrac\{3\}\{45\} = \\dfrac\{1\}\{15\}/], 'added'],
  ['binomial', 'teach-board', 'steer', [/\*\*route\*\*/, /\*\*bin\*\*/, /RLRR/], 'added'],
  ['binomial', 'teach-routes', 'bin-chance', [/\\binom\{4\}\{2\}/, /1, 4, 6, 4 and 1/, /\\binom\{n\}\{k\}/], 'added'],
  ['binomial', 'example-flips', 'fair', [/2\^\{10\} = 1024/, /\\binom\{10\}\{5\} = 252/], 'added'],
  ['binomial', 'formula', 'one-six', [/\*\*trials\*\*/, /\*\*success\*\*/, /\*\*binomial distribution\*\*/, /p\^k \(1-p\)\^\{n-k\}/, /3 \\times \\frac\{16\}\{125\} = \\frac\{48\}\{125\}/]],
  ['binomial', 'teach-centre', 'centres', [/n \\times p/, /\*\*expected count\*\*/, /50 \\times 0\.7 = 35/], 'added'],
  ['binomial', 'example-at-least', 'at-least', [/1, 7, 21, 35, 35, 21, 7, 1/, /Add the two cases/, /Subtract those from 1/], 'added'],
  ['random-variables', 'teach-random-variable', 'distribution', [/\*\*random variable\*\*/, /\*\*distribution\*\*/, /\*\*expected value\*\*/, /E\(X\)/], 'added'],
  ['random-variables', 'recipe', 'sd-table', [/\*\*variance\*\*/, /\*\*standard deviation\*\*/, /\*\*square\*\*/]],
  ['random-variables', 'example-sd', 'sd-table', [/Expected value:/, /Variance:/, /Standard deviation: \$\\sqrt\{16\} = 4\$/], 'added'],
  ['random-variables', 'linearity', 'add-means', [/E\(X \+ Y\) = E\(X\) \+ E\(Y\)/, /3\.5 \+ 3\.5 = 7/, /60 \\times \\frac\{1\}\{6\} = 10/]],
  ['random-variables', 'teach-variances-add', 'root-n', [/\*variances\* that add/, /\*\*only for independent\*\*/, /take the square root/], 'added'],
  ['normal-curve', 'teach-root-n', 'sd-total', [/\\sqrt\{n\} \\times \\text\{SD of one\}/, /\\sqrt\{36\} \\times 4 = 24/, /256 \\times \\frac\{1\}\{4\} = 64/], 'added'],
  ['normal-curve', 'teach-average', 'four-times', [/\\frac\{\\text\{SD of one\}\}\{\\sqrt\{n\}\}/, /\*\*four times\*\*/], 'added'],
  ['normal-curve', 'teach-z', 'z-score', [/\*\*z-score\*\*/, /\\frac\{\\text\{value\} - \\text\{mean\}\}\{\\text\{SD\}\}/, /\\frac\{32\.5 - 40\}\{5\} = -1\.5/], 'added'],
  ['waiting-times', 'geometric', 'wait', [/\*\*geometric distribution\*\*/, /\(1-p\)\^k/, /\\dfrac\{1\}\{p\}/, /1 \\div \\frac\{1\}\{7\} = 7/, /\\frac\{6\}\{7\} \\times \\frac\{6\}\{7\} = \\frac\{36\}\{49\}/]],
  ['waiting-times', 'collector-hook', 'collector-sum', [/one for each new toy/, /1 \\div \\frac\{5\}\{6\} = 1\.2/, /1 \\div \\frac\{4\}\{6\} = 1\.5/]],
  ['waiting-times', 'example-match', 'same-pick', [/all are different/, /Subtract it from 1/, /\\dfrac\{24\}\{64\} = \\dfrac\{3\}\{8\}/], 'added'],
  ['markov-chains', 'teach-crowd', 'crowd', [/1000 towns/, /0\.1 \\times 1000 = 100/, /900 sunny, 100 rainy/], 'added'],
  ['markov-chains', 'name', 'balance', [/\*\*Markov chain\*\*/, /\*\*states\*\*/, /\*\*steady state\*\*/]],
  ['markov-chains', 'teach-balance', 'balance-weather', [/\*\*flows balance\*\*/, /0\.2 \\times S = 0\.6 \\times L/, /\*\*75%\*\*/], 'added'],
  ['markov-chains', 'example-two-steps', 'two-steps', [/0\.8 \\times 1000 = 800/, /0\.8 \\times 800 \+ 0\.6 \\times 200 = 760/], 'added'],
  ['markov-chains', 'teach-absorbing', 'ruin-chance', [/\*\*absorbing\*\*/, /average fortune/, /7 \\times P = 2/], 'added'],
];

test('teach before you ask: every lesson teaches first, and each teaching screen comes before the step it serves', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((s) => resolveStep(s, makeRng(1), s.id));
    const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
    const roles = steps.map(role);
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: a teaching screen or an exploration comes before the first graded step`);
    // an info step counts as a teaching screen only when something to answer follows it
    const lastTask = roles.reduce((last, r, i) => (r === 'teach' ? last : i), -1);
    const teaching = roles.filter((r, i) => r === 'teach' && i < lastTask).length;
    assert.ok(teaching >= 3 && teaching <= 6, `${id}: ${teaching} teaching screens`);
    const predictions = roles.filter((r) => r === 'predict').length;
    assert.ok(predictions >= 1 && predictions <= 2, `${id}: ${predictions} predictions`);
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length, `${id}: step ids are unique`);
  }
  for (const [lesson, screen, serves, needs] of TAUGHT) {
    const ids = lessons[lesson].steps.map((s) => s.id);
    assert.ok(ids.includes(screen), `${lesson}/${screen} exists`);
    assert.ok(ids.includes(serves), `${lesson}/${serves} exists`);
    const step = one(lesson, screen);
    assert.equal(step.type, 'info', `${lesson}/${screen} is a teaching screen`);
    assert.ok(ids.indexOf(screen) < ids.indexOf(serves), `${lesson}/${screen} comes before ${serves}`);
    for (const re of needs) assert.match(flat(step.text), re, `${lesson}/${screen}`);
    const words = flat(step.text).split(' ').length;
    assert.ok(words >= 40 && words <= 190, `${lesson}/${screen}: ${words} words`);
  }
  assert.equal(TAUGHT.filter((row) => row[4] === 'added').length, 19);
  // the one step whose kind changed: the third prediction of lesson 5 is now the screen that teaches its method
  assert.equal(raw('waiting-times', 'collector-hook').mode, undefined);
  // every generated or review step that needs a formula comes after a screen that states it
  for (const [id, lesson] of Object.entries(lessons)) {
    const served = new Set(TAUGHT.filter((row) => row[0] === id).map((row) => row[2]));
    const infoBefore = (index) => lesson.steps.slice(0, index).some((s) => s.type === 'info');
    lesson.steps.forEach((s, i) => { if (typeof s.gen === 'function' || served.has(s.id)) assert.ok(infoBefore(i), `${id}/${s.id} follows a teaching screen`); });
  }
});

test('teach before you ask: arithmetic on the teaching screens is true, also where it is wrapped to keep it on one line', () => {
  let compared = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'info') continue;
      const text = String(step.text).replace(/\\mathord\{([^$]*)\}\$/g, '$1$$');
      assert.ok(!/\\mathord/.test(text), `${id}/${step.id}: unwrapped`);
      for (const [left, rel, right, a, b] of quotedArithmetic(text)) {
        compared++;
        if (rel === '=') assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)), `${id}/${step.id}: "${left} = ${right}" is ${a} against ${b}`);
        else {
          const shown = /(\d+)(?:\.(\d+))?\s*(\\%)?$/.exec(right);
          const unit = 10 ** -(shown[2] || '').length * (shown[3] ? 0.01 : 1);
          assert.ok(Math.abs(a - b) <= unit / 2 + 1e-9, `${id}/${step.id}: "${left} ≈ ${right}" is ${a}`);
        }
      }
    }
  }
  assert.ok(compared >= 45, `${compared} equalities on teaching screens`);
  // numbers quoted in words on the new screens
  assert.equal(groups(10, 2).length, 45);
  assert.equal(groups(3, 2).length, 3);
  assert.equal((1 / 15).toFixed(3), '0.067');
  assert.equal(allRoutes(6).filter((q) => rights(q) === 2).length, 15);
  assert.deepEqual(pascalRow(7), [1, 7, 21, 35, 35, 21, 7, 1]);
  near(headsDistribution(7).filter(([h]) => h >= 6).reduce((t, [, p]) => t + p, 0), 1 / 16, 1e-12);
  near(headsDistribution(7).filter(([h]) => h >= 2).reduce((t, [, p]) => t + p, 0), 15 / 16, 1e-12);
  near(sumDistribution([[1, 0.8], [0, 0.2]], 3)[2][1], 48 / 125, 1e-12);                 // exactly 2 scores in 3 throws at 4/5
  const prize = moments([[0, 3 / 6], [2, 2 / 6], [8, 1 / 6]]);
  near(prize.mean, 2, 1e-12);
  const dip = moments([[10, 4 / 5], [20, 1 / 5]]);
  near(dip.mean, 12, 1e-12); near(dip.variance, 16, 1e-12); near(dip.sd, 4, 1e-12);
  near(moments(headsDistribution(256)).sd, 8, 1e-6);
  near(expectedWait(1 / 7), 7, 1e-9);
  assert.equal((100 * 36 / 49).toFixed(0), '73');
  near(shared(3, 4), 5 / 8, 1e-12);
  assert.ok(shared(3, 4) > 0.5, '"already more likely than not"');
  // the library chain of lesson 6: 800 then 760 on the shelf, 750 in the long run, 150 moving each way
  const library = [[0.8, 0.2], [0.6, 0.4]];
  assert.deepEqual([1, 2].map((t) => chainState(library, [1000, 0], t).counts[0]).map((v) => Math.round(v)), [800, 760]);
  near(longRun(library, [1000, 0])[0], 750, 1e-6);
  near(0.2 * 750, 0.6 * 250, 1e-9);
  for (const id of ['teach-balance', 'example-two-steps']) assert.deepEqual(one('markov-chains', id).figures[0].P, library);
  assert.deepEqual(one('markov-chains', 'teach-balance').figures[0].start, [750, 250]);
  assert.deepEqual(one('markov-chains', 'example-two-steps').figures[0].start, [800, 200]);
  assert.deepEqual(one('markov-chains', 'teach-absorbing').figures[0].start, [750, 0, 0, 0, 250]);
  // a fair walk from 2 with ends at 0 and 7 reaches 7 with probability 2/7
  const walk7 = Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => (i === 0 || i === 7 ? (i === j ? 1 : 0) : (Math.abs(i - j) === 1 ? 0.5 : 0))));
  near(longRun(walk7, [0, 0, 1, 0, 0, 0, 0, 0])[7], 2 / 7, 1e-9);
  // the pictures of the board: one route into bin 3, and all sixteen routes
  assert.deepEqual(one('binomial', 'teach-board').figures[0].routes, ['RLRR']);
  assert.equal(rights('RLRR'), 3);
  assert.deepEqual([...one('binomial', 'teach-routes').figures[0].routes].sort(), allRoutes(4).sort());
});

test('teach before you ask: no worked example is one of the questions that the next generated step can ask', () => {
  // [lesson, generated step, what would make a variant the same problem as the worked example in front of it]
  const clashes = [
    ['counting-arrangements', 'multiply', (s) => s.answer === 70 || s.answer === 10000],
    ['counting-arrangements', 'orders', (s) => s.answer === 40320],
    ['counting-arrangements', 'arrange', (s) => /\*\*12 /.test(s.text)],
    ['counting-arrangements', 'choose', (s) => /\b10\b/.test(plain(s.text))],
    ['counting-arrangements', 'all-red', (s) => /\*\*3 red\*\*/.test(s.text)],
    ['binomial', 'fair', (s) => /\b10\b/.test(plain(s.text).replace(PROB_HOW, ''))],
    ['binomial', 'biased', (s) => /\\frac\{4\}\{5\}/.test(s.text)],
    ['binomial', 'at-least', (s) => /flipped \*\*7 times\*\*/.test(s.text)],
    ['random-variables', 'sd-table', (s) => /\| 10 coins \| \$\\frac\{4\}\{5\}\$ \|/.test(s.text)],
    ['random-variables', 'add-means', (s) => /\*\*2 fair dice\*\*|\b60\b/.test(s.text)],
    ['random-variables', 'root-n', (s) => /\*\*12 times\*\*/.test(s.text)],
    ['normal-curve', 'sd-total', (s) => s.answer === 24 && /\b36\b/.test(s.text)],
    ['normal-curve', 'four-times', (s) => /\*\*25 /.test(s.text)],
    ['normal-curve', 'z-score', (s) => /mean of \*\*40 /.test(s.text)],
    ['normal-curve', 'coin-range', (s) => /\*\*256 times\*\*/.test(s.text)],
    ['waiting-times', 'wait', (s) => s.answer === 7 || Math.abs(s.answer - 36 / 49) < 1e-9],
    ['waiting-times', 'next-new', (s) => /room for \*\*6 different stickers\*\*/.test(s.text)],
    ['waiting-times', 'same-pick', (s) => Math.abs(s.answer - 5 / 8) < 1e-9 && /\b4\b/.test(plain(s.text).replace(PROB_HOW, '').replace(/^\d+ /, ''))],
    ['markov-chains', 'steady', (s) => /\*\*20%\*\*/.test(s.text) && /\*\*60%\*\*/.test(s.text)],
    ['markov-chains', 'two-steps', (s) => /\*\*60%\*\*/.test(s.text)],
    ['markov-chains', 'ruin-chance', (s) => /she has \*\*7 coins\*\*, or|numbered 0 to 7\b/.test(s.text)],
  ];
  for (const [lesson, id, same] of clashes) {
    for (const s of variants(lesson, id)) assert.ok(!same(s), `${lesson}/${id} can ask the worked example: ${flat(s.text)}`);
  }
});

/* ================================================================== guard */

test('every generated step of the course has been re-solved above', () => {
  const generated = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) if (typeof step.gen === 'function') generated.push(`${id}/${step.id}`);
  assert.equal(generated.length, 22);
  const missing = generated.filter((key) => !covered.has(key));
  assert.deepEqual(missing, [], `generated steps without an independent test: ${missing.join(', ')}`);
  // and every hands-on step has had its check exercised by name in this file
  const interact = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) if (step.type === 'interact') interact.push(`${id}/${step.id}`);
  assert.equal(interact.length, 21);
  const unchecked = interact.filter((key) => !touched.has(key));
  assert.deepEqual(unchecked, [], `hands-on steps whose check is not exercised: ${unchecked.join(', ')}`);
});
