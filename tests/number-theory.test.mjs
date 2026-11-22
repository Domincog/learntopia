/**
 * "The Secret Life of Numbers": checks the course's helper functions, the
 * facts quoted in the lesson text, and every generated problem (each
 * generator is run with many seeds and its answer is recomputed here,
 * independently, from the question text).
 *
 *   node --test tests/number-theory.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import {
  isPrime, primeFactors, factorsOf, digitSum, mod, euclid, commas, commasTex, listAnd,
  caesar, letterCounts, primesUpTo, powMod, powerChain, DAYS, ALPHABET,
} from '../content/courses/number-theory/helpers.js';
import { powMod as dialPowMod, orderOf as dialOrderOf } from '../src/widgets/power-cycle.js';
import course from '../content/courses/number-theory/course.js';
import divisibility from '../content/courses/number-theory/lessons/divisibility.js';
import primes from '../content/courses/number-theory/lessons/primes.js';
import gcdEuclid from '../content/courses/number-theory/lessons/gcd-euclid.js';
import clock from '../content/courses/number-theory/lessons/clock-arithmetic.js';
import codes from '../content/courses/number-theory/lessons/secret-codes.js';
import cycles from '../content/courses/number-theory/lessons/power-cycles.js';
import keys from '../content/courses/number-theory/lessons/public-keys.js';

const SEEDS = 400;
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const plain = (text) => String(text).replace(/,(?=\d{3})/g, ''); // "4,782" -> "4782"
const ints = (text) => (plain(text).match(/\d+/g) || []).map(Number);

/** Run a step's generator with many seeds; `verify(step, k)` asserts on each concrete variant. */
function eachVariant(lesson, id, verify) {
  const raw = lesson.steps.find((s) => s.id === id);
  assert.ok(raw, `step "${id}" exists`);
  assert.equal(typeof raw.gen, 'function', `step "${id}" is generated`);
  const seen = new Set();
  for (let k = 0; k < SEEDS; k++) {
    const step = resolveStep(raw, makeRng(7 + k * 7919), id);
    seen.add(JSON.stringify([step.text, step.template, step.answer, (step.options || []).map((o) => o.text)]));
    verify(step, k);
    if (step.options) {
      const texts = step.options.map((o) => o.text);
      assert.equal(new Set(texts).size, texts.length, `${id}: duplicate options ${texts}`);
      const right = step.options.filter((o) => o.correct).length;
      if (step.type === 'choice') assert.equal(right, 1, `${id}: exactly one correct option`);
      else assert.ok(right >= 1, `${id}: at least one correct option`);
      for (const o of step.options) if (o.correct) assert.equal(o.why, undefined, `${id}: a correct option carries a "why it is wrong"`);
    }
    for (const [value] of step.wrong || []) assert.notEqual(value, step.answer, `${id}: "wrong" contains the answer`);
  }
  assert.ok(seen.size >= 5, `${id}: only ${seen.size} distinct variants in ${SEEDS} tries`);
}

const blanks = (step) => step.blanks.map((b) => (b.kind === 'select' ? b.answer : b.answers[0]));

/* ------------------------------------------------------------------ helpers */

test('helpers: primes and factors', () => {
  assert.deepEqual(primesUpTo(30), [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
  assert.ok(!isPrime(1) && !isPrime(0) && isPrime(2) && !isPrime(91) && isPrime(97));
  assert.deepEqual(primeFactors(60), [2, 2, 3, 5]);
  assert.deepEqual(primeFactors(97), [97]);
  assert.deepEqual(primeFactors(294), [2, 3, 7, 7]);
  assert.deepEqual(factorsOf(24), [1, 2, 3, 4, 6, 8, 12, 24]);
  for (let n = 2; n < 500; n++) assert.equal(primeFactors(n).reduce((t, p) => t * p, 1), n);
});

test('helpers: digits, remainders, Euclid, formatting', () => {
  assert.equal(digitSum(4782), 21);
  assert.equal(mod(-3, 7), 4);
  assert.deepEqual(euclid(48, 18), { gcd: 6, steps: [{ a: 48, b: 18, q: 2, r: 12 }, { a: 18, b: 12, q: 1, r: 6 }, { a: 12, b: 6, q: 2, r: 0 }] });
  for (let a = 1; a < 60; a++) for (let b = 1; b < 60; b++) assert.equal(euclid(a, b).gcd, gcd(a, b));
  assert.equal(commas(5761455), '5,761,455');
  assert.equal(commasTex(30031), '30{,}031');
  assert.equal(listAnd([1, 2, 3]), '1, 2 and 3');
});

test('helpers: Caesar cipher', () => {
  assert.equal(caesar('ATTACK AT DAWN', 3), 'DWWDFN DW GDZQ');
  assert.equal(caesar('xyz', 3), 'ABC');
  assert.equal(caesar(caesar('Hello, World!', 11), -11), 'HELLO, WORLD!');
  assert.deepEqual(letterCounts('BANANA').slice(0, 2), [{ letter: 'A', count: 3 }, { letter: 'N', count: 2 }]);
});

/* -------------------------------------------------- facts quoted in the text */

test('facts: divisibility lesson', () => {
  assert.deepEqual([23, 24, 25, 26].map((n) => factorsOf(n).length), [2, 8, 3, 4]);
  assert.equal(234, 26 * 9);
  assert.equal(9 * 11, 99);
  for (const [n, by2, by5] of [[4318, true, false], [9135, false, true], [7260, true, true], [6423, false, false]]) {
    assert.equal(n % 2 === 0, by2);
    assert.equal(n % 5 === 0, by5);
  }
  // the digit-sum rule itself
  for (let n = 1; n < 20000; n++) {
    assert.equal(n % 9 === 0, digitSum(n) % 9 === 0);
    assert.equal(n % 3 === 0, digitSum(n) % 3 === 0);
  }
});

test('facts: primes lesson', () => {
  const count = (lo, hi) => primesUpTo(hi).filter((p) => p > lo).length;
  assert.equal(count(0, 100), 25);
  assert.equal(count(100, 200), 21);
  assert.equal(count(1000, 1100), 16);
  assert.deepEqual(primesUpTo(30).filter((p) => p > 20), [23, 29]);
  assert.equal(2 * 3 * 5 + 1, 31);
  assert.ok(isPrime(31) && isPrime(211));
  assert.equal(2 * 3 * 5 * 7 + 1, 211);
  assert.equal(2 * 3 * 5 * 7 * 11 * 13 + 1, 30031);
  assert.deepEqual(primeFactors(30031), [59, 509]);
  // sieve to 100: four primes clear every composite, and they cross out 49, 16, 6 and 3 numbers
  const by = new Array(101).fill(0);
  const fresh = [2, 3, 5, 7].map((p) => { let c = 0; for (let k = 2 * p; k <= 100; k += p) if (!by[k]) { by[k] = p; c++; } return c; });
  assert.deepEqual(fresh, [49, 16, 6, 3]);
  for (let k = 2; k <= 100; k++) assert.equal(by[k] === 0, isPrime(k));
  assert.equal(primesUpTo(Math.floor(Math.sqrt(200))).pop(), 13);
});

test('facts: gcd lesson', () => {
  assert.deepEqual(factorsOf(48).filter((d) => 18 % d === 0), [1, 2, 3, 6]);
  assert.deepEqual(euclid(84, 30).steps.map((s) => [s.q, s.r]), [[2, 24], [1, 6], [4, 0]]);
  assert.equal(euclid(1000001, 1000000).gcd, 1);
});

test('facts: clock lesson', () => {
  assert.equal(100 % 12, 4);
  assert.equal((9 + 100) % 12, 1);
  assert.deepEqual([17, 29, 41].map((h) => (9 + h) % 12), [2, 2, 2]);
  assert.equal(23 % 7, 2);
  assert.equal(DAYS[(2 + 23) % 7], 'Friday');
  assert.deepEqual([61 % 7, 45 % 7, (61 + 45) % 7, 106], [5, 3, 1, 15 * 7 + 1]);
  assert.deepEqual([(5 * 4) % 7, (12 * 4) % 7, 12 % 7], [6, 6, 5]);
  const reach = (hop) => new Set(Array.from({ length: 12 }, (_, j) => (hop * j) % 12)).size;
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].filter((hop) => reach(hop) === 12), [1, 5, 7, 11]);
  assert.equal(reach(4), 3);
});

test('facts: secret-codes lesson', () => {
  assert.equal(caesar('DLSS KVUL FVB MVBUK AOL RLF', -7), 'WELL DONE YOU FOUND THE KEY');
  const wheel = codes.steps.find((s) => s.id === 'wheel').widget;
  assert.equal(caesar(wheel.text, -7), 'WELL DONE YOU FOUND THE KEY');
  const crack = codes.steps.find((s) => s.id === 'crack').widget;
  const plainText = caesar(crack.text, -9);
  assert.match(plainText, /^EVERY SECRET NEEDS A KEY/);
  const [top, second] = letterCounts(crack.text);
  assert.equal(top.letter, 'N');
  assert.ok(top.count >= 2 * second.count - 1, 'the most common letter stands out');
  assert.equal(letterCounts(plainText)[0].letter, 'E');
  assert.equal(ALPHABET.indexOf('N') - ALPHABET.indexOf('E'), 9);
  assert.deepEqual([ALPHABET.indexOf('H'), ALPHABET[10], ALPHABET.indexOf('Y'), ALPHABET[(24 + 3) % 26]], [7, 'K', 24, 'B']);
  assert.equal(37 * 61, 2257);
  assert.deepEqual(primeFactors(2491), [47, 53]);
  assert.equal(primesUpTo(47).length, 15);
  assert.ok(Math.sqrt(2491) < 50 && Math.sqrt(2491) > 49);
  assert.equal(digitSum(2491), 16);
  assert.equal(primesUpTo(100).length, 25);
  assert.equal(primesUpTo(10000).length, 1229);
});

/* ------------------------------------------------------- generated problems */

test('generated: divisibility', () => {
  eachVariant(divisibility, 'remainder', (step) => {
    const [n, rows] = ints(step.text);
    assert.equal(step.answer, n % rows);
    assert.ok(step.answer > 0 && step.figures[0].n === n && step.figures[0].rows === rows);
  });
  eachVariant(divisibility, 'factors-of', (step) => {
    const [n] = ints(step.text);
    for (const o of step.options) assert.equal(!!o.correct, n % Number(o.text) === 0, `${o.text} | ${n}`);
  });
  eachVariant(divisibility, 'digit-sum', (step) => {
    const [n] = ints(step.text);
    const want = n % 9 === 0 ? 0 : n % 3 === 0 ? 1 : 3;
    assert.equal(step.options.findIndex((o) => o.correct), want, String(n));
    assert.ok(step.explain.includes(String(digitSum(n))));
  });
  eachVariant(divisibility, 'all-tests', (step) => {
    const [n] = ints(step.text);
    for (const o of step.options) assert.equal(!!o.correct, n % Number(o.text) === 0, `${o.text} | ${n}`);
  });
  eachVariant(divisibility, 'missing-digit', (step) => {
    const shown = step.text.match(/\$\$([^$]+)\$\$/)[1].replace(/\\;/g, ' ').trim().split(/\s+/);
    assert.equal(shown.length, 4);
    assert.notEqual(shown[0], '\\square');
    const fits = [];
    for (let d = 0; d <= 9; d++) if (Number(shown.map((c) => (c === '\\square' ? d : c)).join('')) % 9 === 0) fits.push(d);
    assert.deepEqual(fits, [step.answer], shown.join(''));
  });
});

test('generated: primes', () => {
  eachVariant(primes, 'spot-primes', (step) => {
    for (const o of step.options) assert.equal(!!o.correct, isPrime(Number(o.text)), o.text);
  });
  eachVariant(primes, 'find-prime', (step) => {
    for (const o of step.options) assert.equal(!!o.correct, isPrime(Number(o.text)), o.text);
    assert.equal(step.options.length, 4);
  });
  eachVariant(primes, 'factorise', (step) => {
    const [n] = ints(step.text);
    const given = blanks(step).map(Number);
    assert.deepEqual(given, primeFactors(n));
    assert.ok(given.length >= 3 && given.length <= 4);
  });
});

test('generated: gcd', () => {
  eachVariant(gcdEuclid, 'by-listing', (step) => {
    const [a, b] = ints(step.text.match(/gcd\(([^)]*)\)/)[1]);
    assert.equal(step.answer, gcd(a, b));
    assert.ok(step.answer > 1 && step.answer < a);
  });
  eachVariant(gcdEuclid, 'euclid-practice', (step) => {
    const [a, b] = ints(step.text);
    assert.equal(step.answer, gcd(a, b));
    const lines = euclid(a, b).steps.length;
    assert.ok(lines >= 2 && lines <= 4, `${a}, ${b}: ${lines} lines`);
    assert.equal((step.explain.match(/\\times/g) || []).length, lines);
  });
  eachVariant(gcdEuclid, 'fraction', (step) => {
    const [n, d] = ints(step.text);
    const [g, p, q] = blanks(step).map(Number);
    assert.equal(g, gcd(n, d));
    assert.deepEqual([p, q], [n / g, d / g]);
    assert.equal(gcd(p, q), 1);
  });
  eachVariant(gcdEuclid, 'meet-again', (step) => {
    const [a, b] = ints(step.text);
    assert.equal(step.answer, (a * b) / gcd(a, b));
    assert.ok(step.answer < a * b && step.answer > Math.max(a, b));
  });
});

test('generated: clock arithmetic', () => {
  eachVariant(clock, 'mod-practice', (step) => {
    const [n, m] = ints(step.text);
    assert.equal(step.answer, n % m);
  });
  eachVariant(clock, 'day-of-week', (step) => {
    const start = DAYS.findIndex((d) => step.text.includes(`**${d}**`));
    const [n] = ints(step.text);
    assert.ok(start >= 0);
    assert.equal(step.options.find((o) => o.correct).text, DAYS[(start + n) % 7]);
  });
  eachVariant(clock, 'mixed', (step) => {
    const [a, b, m] = ints(step.text);
    const want = step.text.includes('\\times') ? (a * b) % m : (a + b) % m;
    assert.equal(step.answer, want);
  });
  eachVariant(clock, 'night-trip', (step) => {
    const [depart, , hours] = ints(step.text); // "15:00" contributes 15 and 00
    assert.equal(step.answer, (depart + hours) % 24);
    assert.ok(depart + hours >= 24);
  });
  eachVariant(clock, 'check-digit', (step) => {
    const digits = ints(step.text.match(/\$\$([^$]+)\$\$/)[1].replace(/\\;/g, ' '));
    assert.equal(digits.length, 4);
    assert.equal((digits.reduce((t, d) => t + d, 0) + step.answer) % 10, 0);
    assert.ok(step.answer >= 0 && step.answer <= 9);
  });
  eachVariant(clock, 'same-place', (step) => {
    const [ref, m] = ints(step.text);
    for (const o of step.options) assert.equal(!!o.correct, Number(o.text) % m === ref % m, `${o.text} vs ${ref} mod ${m}`);
  });
});

test('generated: secret codes', () => {
  eachVariant(codes, 'encode', (step) => {
    const letter = step.text.match(/letter \*\*([A-Z])\*\*/)[1];
    const key = Number(step.text.match(/key \*\*(\d+)\*\*/)[1]);
    const [i, j, out] = blanks(step);
    assert.equal(Number(i), ALPHABET.indexOf(letter));
    assert.equal(Number(j), (ALPHABET.indexOf(letter) + key) % 26);
    assert.equal(out, caesar(letter, key));
  });
});

/* ------------------------------------------------- fixed answers in the text */

test('fixed steps: answers agree with the arithmetic', () => {
  const step = (lesson, id) => resolveStep(lesson.steps.find((s) => s.id === id), makeRng(1), id);
  assert.equal(step(gcdEuclid, 'hook').answer, gcd(48, 18));
  assert.deepEqual(blanks(step(gcdEuclid, 'bridge')).map(Number), [1, 6, 2, 0]);
  assert.deepEqual(blanks(step(clock, 'add-first')).map(Number), [61 % 7, 45 % 7, (61 + 45) % 7]);
  assert.equal(step(clock, 'multiply').answer, (5 * 4) % 7);
  assert.equal(step(codes, 'how-many-keys').answer, 25);
  assert.equal(step(codes, 'multiply').answer, 37 * 61);
  assert.deepEqual(blanks(step(primes, 'euclid-remainders')).map(Number), [31 % 2, 31 % 3, 31 % 5]);
  assert.deepEqual(blanks(step(divisibility, 'why-nines')).slice(0, 2).map(Number), [3, 2 + 3 + 4]);
  // the sort-into-groups step
  for (const item of step(divisibility, 'sort-12').items) {
    const v = Number(item.text);
    assert.equal(item.bucket, 12 % v === 0 ? 0 : v % 12 === 0 ? 1 : 2, item.text);
  }
});

/* ====================================================================== *
 *  Lessons 6 and 7: "Powers That Come Home" and "Build a Public Key".    *
 *  Everything below is recomputed with BigInt (a^n is worked out in      *
 *  full and only then reduced), never with the lessons' own powMod.      *
 * ====================================================================== */

const big = (v) => BigInt(v);
/** a^n mod m the slow, exact way: the whole power first, then one division. */
const bigPowMod = (a, n, m) => Number((big(a) ** big(n)) % big(m));
const lessonStep = (lesson, id) => {
  const raw = lesson.steps.find((s) => s.id === id);
  assert.ok(raw, `step "${id}" exists`);
  return raw;
};
const fixed = (lesson, id) => resolveStep(lessonStep(lesson, id), makeRng(1), id);
/** What the power-cycle dial reports for a base and a power, worked out independently of the widget. */
function dialState(m, base, n) {
  const seq = Array.from({ length: n + 1 }, (_, k) => bigPowMod(base, k, m));
  const visited = Array.from(new Set(seq)).sort((p, q) => p - q);
  let period = null;
  for (let k = 1; k <= 4 * m && period == null; k++) if (bigPowMod(base, k, m) === 1) period = k;
  const value = seq[n];
  return { m, base, n, value, visited, count: visited.length, period, home: n > 0 && value === 1 };
}

test('helpers and dial widget: powers on a clock agree with exact BigInt arithmetic', () => {
  for (let m = 2; m <= 40; m++) {
    for (let a = 0; a <= 41; a++) {
      for (let n = 0; n <= 24; n++) {
        const want = bigPowMod(a, n, m);
        assert.equal(powMod(a, n, m), want, `helpers powMod(${a}, ${n}, ${m})`);
        assert.equal(dialPowMod(a, n, m), want, `widget powMod(${a}, ${n}, ${m})`);
      }
      // the cycle length the widget reports: smallest k > 0 with a^k = 1, and none when a shares a factor with m
      let order = null;
      for (let k = 1; k <= 60 && order == null; k++) if (bigPowMod(a, k, m) === 1) order = k;
      assert.equal(dialOrderOf(a, m), order, `orderOf(${a}, ${m})`);
      assert.equal(order != null, gcd(a, m) === 1, `${a} comes home on the ${m}-clock exactly when it shares no factor with ${m}`);
    }
  }
  assert.deepEqual(powerChain(7, 4, 10), [7, 9, 3, 1]);
  assert.equal(powMod(3, 0, 7), 1);
});

test('facts: power-cycles lesson', () => {
  // the hook: 7^100 has 85 digits and ends in 1
  const huge = 7n ** 100n;
  assert.equal(String(huge).length, 85);
  assert.equal(huge % 10n, 1n);
  assert.match(lessonStep(cycles, 'hook').text, /85 digits/);
  assert.match(course.chapters.flatMap((c) => c.lessons).find((l) => l.id === 'power-cycles').summary, /85 digits/);
  assert.equal(fixed(cycles, 'hook').options.find((o) => o.correct).text, String(huge % 10n));
  assert.deepEqual([1, 2, 3, 4].map((n) => bigPowMod(7, n, 10)), [7, 9, 3, 1]);
  assert.equal(100, 25 * 4);
  // "7 -> 49 -> 9 -> 63 -> 3 -> 21 -> 1"
  assert.deepEqual([7 * 7, 49 % 10, 9 * 7, 63 % 10, 3 * 7, 21 % 10], [49, 9, 63, 3, 21, 1]);

  // the 7-clock: cycle lengths, who visits everything, and "they all divide 6"
  const order = (a, m) => dialState(m, a, 0).period;
  assert.deepEqual([2, 3, 4, 5, 6].map((a) => order(a, 7)), [3, 6, 3, 6, 2]);
  assert.deepEqual(dialState(7, 2, 12).visited, [1, 2, 4]);
  assert.deepEqual([2, 3, 4, 5, 6].filter((a) => dialState(7, a, 12).count === 6), [3, 5]);
  for (let a = 1; a <= 6; a++) {
    assert.equal(6 % order(a, 7), 0, `the cycle of ${a} divides 6`);
    assert.equal(bigPowMod(a, 6, 7), 1, `${a}^6 mod 7`);
  }
  assert.equal(bigPowMod(7, 6, 7), 0, 'a multiple of 7 never comes back to 1: the condition matters');

  // sixth-power
  const sixth = fixed(cycles, 'sixth-power');
  assert.equal(sixth.answer, bigPowMod(5, 6, 7));
  assert.deepEqual([1, 2, 3, 4, 5].map((n) => bigPowMod(5, n, 7)), [5, 4, 6, 2, 3]); // the hint's chain
  assert.deepEqual(sixth.wrong.map(([v]) => v), [(5 * 6) % 7, bigPowMod(5, 3, 7)]);

  // Fermat's little theorem, with its condition, on every prime clock up to 101 (11 and 101 are named in the text)
  for (const p of primesUpTo(101)) {
    for (let a = 1; a < p; a++) assert.equal(bigPowMod(a, p - 1, p), 1, `${a}^${p - 1} mod ${p}`);
    assert.equal(bigPowMod(p, p - 1, p), 0);
    assert.equal(bigPowMod(3 * p, p - 1, p), 0);
  }
  assert.ok(isPrime(11) && isPrime(101));
  assert.match(lessonStep(cycles, 'fermat').text, /not a multiple of \$p\$/);

  // the Fermat test: 2^90 mod 91
  const np = fixed(cycles, 'not-prime');
  const [, base, exp, modulus, shown] = np.text.match(/(\d+)\^\{(\d+)\} \\bmod (\d+) = (\d+)/).map(Number);
  assert.deepEqual([base, exp, modulus], [2, 90, 91]);
  assert.equal(bigPowMod(base, exp, modulus), shown);
  assert.equal(shown, 64);
  assert.deepEqual(primeFactors(91), [7, 13]);
  assert.equal(np.options.find((o) => o.correct).text, '91 is not prime');
  // a failed test proves "not prime" (for odd n; n = 2 is the one prime that "fails", because 2 is a multiple of it)...
  for (let n = 3; n < 4000; n += 2) if (bigPowMod(2, n - 1, n) !== 1) assert.ok(!isPrime(n), `${n} fails the test and so must be composite`);
  assert.equal(bigPowMod(2, 1, 2), 0);
  // ...but a passed test is not proof: 341 = 11 x 31 passes with base 2, and 561 passes with every base it shares no factor with
  assert.equal(bigPowMod(2, 340, 341), 1);
  assert.deepEqual(primeFactors(341), [11, 31]);
  assert.equal(bigPowMod(2, 560, 561), 1);
  assert.ok(!isPrime(561));
  const impostors = [];
  for (let n = 3; n < 2000; n += 2) if (!isPrime(n) && bigPowMod(2, n - 1, n) === 1) impostors.push(n);
  assert.deepEqual(impostors, [341, 561, 645, 1105, 1387, 1729, 1905]); // "a few impostors"

  // repeated squaring: 3^2, 3^4, 3^8, 3^16 on the 7-clock
  assert.deepEqual(blanks(fixed(cycles, 'squaring')).map(Number), [2, 4, 8, 16].map((n) => bigPowMod(3, n, 7)));
  assert.deepEqual([9 % 7, (2 * 2) % 7, (4 * 4) % 7, (2 * 2) % 7], [2, 4, 2, 4]); // each line squares the line before
  assert.equal(16 - 1, 15); // multiplications needed one step at a time
  // squarings from a to a^1024, and the cost of a 1000-digit exponent
  const squarings = fixed(cycles, 'count-squarings');
  assert.equal(2 ** squarings.answer, 1024);
  assert.equal(squarings.answer, 10);
  assert.ok(squarings.wrong.some(([v]) => v === 1024 - 1));
  const bits = (10n ** 1000n - 1n).toString(2).length; // the largest exponent with a thousand digits
  assert.ok(bits > 3000 && 2 * bits < 7000, `square-and-multiply needs at most ${2 * bits} steps`);

  // true/false round-up
  const truths = fixed(cycles, 'truths');
  assert.deepEqual(truths.options.map((o) => o.correct), [true, true, true, false, false]);
  assert.match(truths.options[2].text, /odd/, 'the Fermat-test statement must exclude n = 2');
  assert.match(truths.options[1].text, /unless \$a\$ is a multiple of \$p\$/);

  // the model answer: last digit of 3^2025
  assert.equal((3n ** 2025n) % 10n, 3n);
  assert.deepEqual([1, 2, 3, 4].map((n) => bigPowMod(3, n, 10)), [3, 9, 7, 1]);
  assert.equal(4 * 506 + 1, 2025);
  for (const line of cycles.recap) if (/p-1/.test(line)) assert.match(line, /not a multiple of \$p\$/);
});

test('interactive checks: power-cycles and public-keys accept exactly what they ask for', () => {
  // "raise the power until the marker is back on 1" (dial of 10, base 7, up to power 12)
  const explore = lessonStep(cycles, 'explore');
  assert.deepEqual([explore.widget.m, explore.widget.base, explore.widget.max], [10, 7, 12]);
  for (let n = 0; n <= 12; n++) {
    const verdict = explore.check(dialState(10, 7, n));
    assert.equal(verdict === true, n > 0 && (7n ** big(n)) % 10n === 1n, `explore at power ${n}`);
    if (verdict !== true) assert.equal(typeof verdict, 'string');
  }
  assert.equal(explore.check(dialState(10, 7, explore.solution.n)), true);
  assert.equal(explore.solution.n, 4);

  // "find a base whose powers land on all six places" (7-clock, bases 2 to 6)
  const visit = lessonStep(cycles, 'visit-all');
  assert.deepEqual([visit.widget.m, visit.widget.baseRange, visit.widget.max], [7, [2, 6], 12]);
  for (let base = 2; base <= 6; base++) {
    for (let n = 0; n <= 12; n++) {
      const state = dialState(7, base, n);
      const landed = new Set(Array.from({ length: n + 1 }, (_, k) => bigPowMod(base, k, 7)));
      const all = [1, 2, 3, 4, 5, 6].every((v) => landed.has(v));
      const verdict = visit.check(state);
      assert.equal(verdict === true, all, `visit-all: base ${base}, power ${n}`);
      if (!all && [2, 4, 6].includes(base)) assert.match(verdict, new RegExp(`after ${state.period} steps`));
    }
  }
  assert.equal(visit.check(dialState(7, visit.solution.base, visit.solution.n)), true);
  assert.deepEqual(dialState(7, 2, visit.widget.n).visited, [1, 2, 4]); // what the step's opening sentence says

  // "raise 29 to the power 7 on the 33-clock"
  const unlock = lessonStep(keys, 'unlock');
  assert.deepEqual([unlock.widget.m, unlock.widget.base, unlock.widget.max], [33, 29, 7]);
  for (let n = 0; n <= 7; n++) assert.equal(unlock.check(dialState(33, 29, n)) === true, n === 7);
  assert.equal(dialState(33, 29, 7).value, 17);
  assert.equal(unlock.solution.n, 7);
});

test('generated: power-cycles', () => {
  eachVariant(cycles, 'small-power', (step) => {
    const [a, n, m] = step.text.match(/\$(\d+)\^\{(\d+)\} \\bmod (\d+)\$/).slice(1).map(Number);
    assert.equal(step.answer, bigPowMod(a, n, m), `${a}^${n} mod ${m}`);
    assert.ok(step.answer > 0 && step.answer < m && gcd(a, m) === 1);
    // the explanation walks a, a^2, … a^n round the clock
    const chain = step.explain.match(/\$([\d\s\\to]+)\$/)[1].split('\\to').map(Number);
    assert.deepEqual(chain, Array.from({ length: n }, (_, k) => bigPowMod(a, k + 1, m)));
    assert.match(step.explain, new RegExp(`\\\\bmod ${m} = ${step.answer}\\$`));
    assert.equal(Number(step.hints[0].match(/you get (\d+)/)[1]), (a * a) % m);
    for (const [value, message] of step.wrong) {
      if (/^That multiplies/.test(message)) assert.equal(value, (a * n) % m);
      else assert.equal(big(value), big(a) ** big(n));
    }
  });
  eachVariant(cycles, 'fermat-use', (step) => {
    const [a, power, p] = step.text.match(/(\d+)\^\{(\d+)\} \\bmod (\d+)/).slice(1).map(Number);
    assert.ok(isPrime(p) && a % p !== 0, 'the theorem applies');
    assert.equal(step.answer, bigPowMod(a, power, p), `${a}^${power} mod ${p}`);
    // the route the explanation takes: power = laps × (p − 1) + extra, answer = a^extra
    const laps = Math.floor(power / (p - 1));
    const extra = power % (p - 1);
    assert.equal(step.answer, bigPowMod(a, extra, p));
    const nums = ints(step.explain);
    if (extra === 0) {
      assert.deepEqual(nums.slice(0, 3), [power, laps, p - 1]);
      assert.equal(step.answer, 1);
    } else {
      assert.deepEqual(nums.slice(0, 4), [power, laps, p - 1, extra]);
      assert.match(step.explain, new RegExp(`\\$${a}\\^\\{${extra}\\} \\\\bmod ${p} = ${step.answer}\\$`));
    }
    assert.deepEqual(ints(step.hints[1]).slice(0, 3), [power, laps, p - 1]);
    assert.ok(!/\b0 steps|\+ 0\b/.test(step.hints.join(' ')), 'no "last 0 steps" in a hint');
    for (const [value, message] of step.wrong) {
      if (/reduced the exponent/.test(message)) assert.equal(value, bigPowMod(a, power % p, p));
      else assert.equal(value, 0);
    }
  });
});

test('generated: public-keys', () => {
  eachVariant(keys, 'lock', (step) => {
    const m = Number(step.text.match(/the number \*\*(\d+)\*\*/)[1]);
    const [base, e, N] = step.text.match(/(\d+)\^(\d+) \\bmod (\d+)/).slice(1).map(Number);
    assert.deepEqual([base, e, N], [m, 3, 33]);
    assert.equal(step.answer, bigPowMod(m, 3, 33));
    assert.equal(bigPowMod(step.answer, 7, 33), m, 'the private key opens what the public key locked');
    const [, , cube, q, , rem] = ints(step.explain); // m^3 = cube = q × 33 + rem
    assert.equal(cube, m ** 3);
    assert.deepEqual([q * 33 + rem, rem], [cube, step.answer]);
    assert.ok(m > 1 && m < 33);
    for (const [value, message] of step.wrong) {
      if (/private power/.test(message)) assert.equal(value, bigPowMod(m, 7, 33));
      else if (/times 3/.test(message)) assert.equal(value, m * 3);
      else assert.equal(value, m ** 3);
    }
  });
});

test('toy RSA, end to end', () => {
  // N = 33 = 3 × 11, e = 3, d = 7: the numbers in the "recipe" table
  const recipe = lessonStep(keys, 'recipe').text;
  assert.match(recipe, /N = 33/);
  assert.match(recipe, /e = 3/);
  assert.match(recipe, /d = 7/);
  assert.deepEqual(primeFactors(33), [3, 11]);
  const phi = (3 - 1) * (11 - 1);
  assert.equal(phi, 20);
  assert.equal((3 * 7) % phi, 1);
  for (let m = 0; m < 33; m++) {
    const locked = bigPowMod(m, 3, 33);
    assert.equal(bigPowMod(locked, 7, 33), m, `lock then unlock ${m}`);
    assert.equal(bigPowMod(bigPowMod(m, 7, 33), 3, 33), m, `sign then verify ${m}`); // "either order"
    assert.equal(bigPowMod(m, 21, 33), m, `${m}^21`);
    // "the power 20 brings a number back to 1, as long as it shares no factor with 33": exactly then
    assert.equal(bigPowMod(m, 20, 33) === 1, gcd(m, 33) === 1, `${m}^20`);
  }
  assert.equal(new Set(Array.from({ length: 33 }, (_, m) => bigPowMod(m, 3, 33))).size, 33, 'locking never sends two messages to the same number');

  // the worked example: 29 unlocks to 17, and 17 locks to 29
  const unlock = lessonStep(keys, 'unlock');
  assert.match(unlock.text, /\*\*29\*\*/);
  assert.match(unlock.explain, /\*\*17\*\*/);
  assert.equal(bigPowMod(29, 7, 33), 17);
  assert.equal(17 ** 3, 4913);
  assert.equal(148 * 33 + 29, 4913);

  // "why 7 undoes 3"
  assert.deepEqual(blanks(fixed(keys, 'why')).map(Number), [(3 - 1) * (11 - 1), 3 * 7, (3 * 7) % 20]);

  // make your own key: every number is read from the step's own wording, then every message is tried
  const findD = fixed(keys, 'find-d');
  const [p, q] = findD.text.match(/primes (\d+) and (\d+)/).slice(1).map(Number);
  const N2 = Number(findD.text.match(/N = (\d+)/)[1]);
  const phi2 = Number(findD.text.match(/= (\d+)\$\. Keep/)[1]);
  const e2 = Number(findD.text.match(/e = (\d+)/)[1]);
  assert.ok(isPrime(p) && isPrime(q) && p !== q);
  assert.deepEqual([N2, phi2, e2], [p * q, (p - 1) * (q - 1), 3]);
  assert.equal(Number(findD.text.match(/divided by (\d+)/)[1]), phi2);
  const unlocksAll = (d, n = N2) => Array.from({ length: n }, (_, m) => m).every((m) => bigPowMod(bigPowMod(m, e2, n), d, n) === m);
  const fitsRecipe = (d) => (e2 * d) % phi2 === 1;
  const reallyUnlock = [];
  const recipe2 = [];
  for (let d = 1; d <= 3 * phi2; d++) {
    if (unlocksAll(d)) reallyUnlock.push(d);
    if (fitsRecipe(d)) recipe2.push(d);
  }
  assert.equal(findD.answer, recipe2[0], 'the smallest d with e*d = 1 mod (p-1)(q-1)');
  assert.equal(findD.answer, reallyUnlock[0], 'and no smaller power opens the lock');
  assert.ok(unlocksAll(findD.answer), `N = ${N2}: lock then unlock every message`);
  for (const d of recipe2) assert.ok(unlocksAll(d), `${d} fits the recipe, so it must unlock`);
  assert.match(findD.text, /smallest/, 'more than one d satisfies the condition, so the question must say which');
  assert.ok(recipe2.length >= 3);
  // feedback for a bigger d that fits the recipe says "would unlock too": true; anything else gets no such message
  assert.match(findD.feedback(recipe2[1]), new RegExp(`${e2 * recipe2[1]}\\$ does leave remainder 1`));
  for (let v = 0; v <= 3 * phi2; v++) assert.equal(findD.feedback(v) != null, v !== findD.answer && fitsRecipe(v), `feedback(${v})`);
  // the anticipated wrong answers really are wrong: none fits the recipe and none opens the lock (the old key 7 included)
  assert.ok(findD.wrong.some(([v]) => v === 7));
  for (const [value, message] of findD.wrong) {
    assert.ok(!fitsRecipe(value) && !unlocksAll(value), `${value} is listed as wrong`);
    const [, factor, product] = message.match(/3 \\times (\d+) = (\d+)/).map(Number);
    assert.deepEqual([factor, product], [value, e2 * value]);
    assert.equal(Number(message.match(/remainder (?:is )?(\d+)/)[1]), (e2 * value) % phi2, message);
  }
  // the hints list the first numbers that leave remainder 1, and exactly one of them is a multiple of 3
  const listed = ints(findD.hints[0]).slice(2);
  assert.deepEqual(listed, [1, 2, 3].map((k) => k * phi2 + 1));
  assert.deepEqual(listed.filter((v) => v % e2 === 0), [e2 * findD.answer]);
  assert.deepEqual(ints(findD.explain).slice(0, 6), [e2, findD.answer, e2 * findD.answer, 1, phi2, 1]);
  // (Why the lock is not built from 5 and 11: on the 55-clock the old key 7 opens everything too,
  // because 3 x 7 = 21 leaves remainder 1 on division by lcm(4, 10) = 20. Marking 7 wrong there would be false.)
  assert.ok(unlocksAll(7, 55) && unlocksAll(27, 55));
  assert.ok(unlocksAll(7, 33) && !unlocksAll(3, 33));

  // sizes quoted for real keys: a 2048-bit N has 617 digits, its primes about 308 each
  assert.equal(String(2n ** 2047n).length, 617);
  assert.equal(String(2n ** 2048n - 1n).length, 617);
  assert.equal(String(2n ** 1023n).length, 308);

  // true/false round-up and the matching step
  assert.deepEqual(fixed(keys, 'truths').options.map((o) => o.correct), [true, true, true, false, false]);
  assert.equal(fixed(keys, 'roles').pairs.length, 4);
});

/* ------------------------------------------------------ teach before you ask */

const LESSONS = { divisibility, primes, 'gcd-euclid': gcdEuclid, 'clock-arithmetic': clock, 'secret-codes': codes, 'power-cycles': cycles, 'public-keys': keys };

/**
 * The teaching screens that make each lesson teach before it asks:
 * [screen, the first graded step that needs it, what the screen has to contain].
 * A later edit that moves a screen behind its question, or drops the term or
 * the worked example the question relies on, fails here.
 */
const TEACHING = {
  divisibility: [
    ['names', 'factors-of', [/\*\*3 divides 24\*\*/, /\*\*divisible\*\*/, /\*\*factor\*\*/, /\*\*multiple\*\*/, /from 1 up to 24 itself/]],
    ['teach-last-digit', 'last-digit', [/last digit/, /even: 0, 2, 4, 6 or 8 \| \*\*2\*\*/, /0 or 5 \| \*\*5\*\*/, /\| 0 \| \*\*10\*\*/, /:::example/]],
    ['teach-digit-sum', 'digit-sum', [/\*\*digit sum\*\*/, /divisible by \*\*9\*\* exactly when its digit sum is/, /works for \*\*3\*\*/, /:::example/, /7 \+ 3 \+ 8 = 18/]],
  ],
  primes: [
    ['names', 'sieve', [/\*\*prime\*\*/, /\*\*composite\*\*/, /smallest prime is 2/, /And 1\?.*neither/]],
    ['teach-prime-test', 'spot-primes', [/try 2, 3, 5, 7, 11/, /\*\*times itself\*\*/, /\*\*square root\*\*/, /:::example Is 103 prime\?/, /11 \\times 11 = 121/, /\*\*103 is prime\*\*/]],
    ['unique', 'factorise', [/product of primes \*\*in exactly one way\*\*/]],
    ['example-factorise', 'factorise', [/:::example/, /\*\*smallest prime that divides\*\*/, /156 = 2 \\times 2 \\times 3 \\times 13/]],
    ['teach-euclid-proof', 'euclid-conclusion', [/must have a prime factor/, /add 1/, /leaves remainder 1/, /at least one prime is missing/]],
  ],
  'gcd-euclid': [
    ['names', 'by-listing', [/\*\*common divisor\*\*/, /\*\*greatest common divisor\*\*/, /\\gcd\(48, 18\) = 6/]],
    ['recipe', 'order-lines', [/Divide the bigger number by the smaller/, /\*\*remainder\*\*/, /until the remainder is 0/, /48 = 2 \\times 18 \+ 12/, /12 = 2 \\times 6 \+ 0/]],
    ['example-fraction', 'fraction', [/:::example/, /divided by the same number/, /\*\*gcd\*\*/, /\\gcd\(20, 35\) = 5/, /\\frac\{4\}\{7\}/]],
    ['teach-lcm', 'meet-again', [/\*\*common multiple\*\*/, /\*\*least common multiple\*\*/, /\*\*lcm\*\*/, /:::example/, /multiples of 10/, /40 \\div 2 = 20/]],
  ],
  'clock-arithmetic': [
    ['names', 'mod-practice', [/\*\*remainder\*\*/, /\*\*mod\*\*/, /:::example/, /100 = 8 \\times 12 \+ 4/, /12 \\bmod 12 = 0/]],
    ['teach-reduce-first', 'mixed', [/\*\*at any moment\*\*/, /:::example/, /\*\*Adding:\*\*/, /\*\*Multiplying:\*\*/, /7 \\times 6 = 42/, /42 \\bmod 10 = 2/]],
    ['teach-check-digit', 'check-digit', [/\*\*check digit\*\*/, /add up to 0 mod 10/, /:::example/, /20 - 16 = 4/]],
  ],
  'secret-codes': [
    ['teach-caesar', 'wheel', [/\*\*cipher\*\*/, /\*\*key\*\*/, /\*\*encode\*\*/, /\*\*decode\*\*/, /wraps round/, /:::example/]],
    ['names', 'encode', [/addition on a clock with 26 places/, /\\bmod 26/, /Y is 24/, /subtract the key/]],
    ['rsa', 'truths', [/open padlock/, /two huge secret primes/, /\*\*public-key cryptography\*\*/, /Nobody has \*proved\*/]],
  ],
  'power-cycles': [
    ['teach-powers', 'explore', [/\*\*power\*\*/, /\*\*exponent\*\*/, /7 \\times 7 \\times 7/, /\*\*last digit\*\*.*remainder mod 10/]],
    ['method', 'small-power', [/kept only the remainder/, /9 \\times 7 = 63/, /Multiply by \$a\$, reduce, and repeat/, /:::example/, /3\^3 \\bmod 5 = 2/]],
    ['fermat', 'fermat-use', [/not a multiple of \$p\$/, /a\^\{\\,p-1\} \\bmod p = 1/]],
    ['example-fermat', 'fermat-use', [/:::example/, /5\^\{20\} \\bmod 7/, /20 = 3 \\times 6 \+ 2/, /by \$p - 1\$, not by \$p\$/, /answer is 1/]],
  ],
  'public-keys': [
    ['recipe', 'lock', [/\*\*public key\*\*/, /\*\*private key\*\*/, /m\^3 \\bmod 33/, /power 7/]],
    ['example-lock', 'lock', [/:::example/, /13\^3 = 13 \\times 13 \\times 13 = 2197/, /2197 = 66 \\times 33 \+ 19/]],
    ['teach-key-rule', 'find-d', [/\(p - 1\) \\times \(q - 1\)/, /\*\*remainder 1\*\*/, /:::example/, /21, 41, 61/, /d = 7/, /without the two primes/]],
    ['real', 'truths', [/\*\*RSA\*\*/, /\*\*Padding\.\*\*/]],
  ],
};
/** The screens this revision added (the others in TEACHING were there before). */
const ADDED = {
  divisibility: ['teach-last-digit', 'teach-digit-sum'],
  primes: ['teach-prime-test', 'example-factorise', 'teach-euclid-proof'],
  'gcd-euclid': ['example-fraction', 'teach-lcm'],
  'clock-arithmetic': ['teach-reduce-first', 'teach-check-digit'],
  'secret-codes': ['teach-caesar'],
  'power-cycles': ['teach-powers', 'example-fermat'],
  'public-keys': ['example-lock', 'teach-key-rule'],
};

test('every lesson: teach before you ask', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const [id, lesson] of Object.entries(LESSONS)) {
    const steps = lesson.steps.map((raw) => resolveStep(raw, makeRng(1), raw.id)); // resolved, as the player sees them
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    // a teaching screen is an info step with something to answer after it
    const lastTask = roles.reduce((last, kind, i) => (kind === 'teach' ? last : i), -1);
    assert.ok(roles.filter((kind, i) => kind === 'teach' && i < lastTask).length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.ok(steps.length >= 12 && steps.length <= 20, `${id}: ${steps.length} steps`);
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length, `${id}: step ids are unique`);
    for (const added of ADDED[id]) assert.ok(TEACHING[id].some(([teachId]) => teachId === added), `${id}: "${added}" is pinned below`);
    for (const [teachId, askId, needs] of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === teachId);
      const ask = steps.findIndex((s) => s.id === askId);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${teachId}" exists`);
      assert.ok(ask > at, `${id}: "${teachId}" comes before "${askId}"`);
      assert.equal(roles[ask], 'graded', `${id}/${askId} is the question that "${teachId}" serves`);
      for (const needed of needs) assert.match(steps[at].text.replace(/\s+/g, ' '), needed, `${id}/${teachId} teaches what "${askId}" asks for`);
    }
  }
  // discoveries are named on a screen straight after them
  const follows = (lesson, first, then) => lesson.steps.findIndex((s) => s.id === then) === lesson.steps.findIndex((s) => s.id === first) + 1;
  assert.ok(follows(divisibility, 'why-nines', 'teach-digit-sum'));
  assert.ok(follows(primes, 'why-stop', 'teach-prime-test'));
  assert.ok(follows(primes, 'euclid-remainders', 'teach-euclid-proof'));
  assert.ok(follows(gcdEuclid, 'bridge', 'recipe'));
  assert.ok(follows(clock, 'multiply', 'teach-reduce-first'));
  assert.ok(follows(cycles, 'sixth-power', 'fermat'));
  assert.ok(follows(keys, 'why', 'teach-key-rule'));
});

test('worked examples: the arithmetic is right, and no generator can ask the example back', () => {
  const text = (lesson, id) => lessonStep(lesson, id).text;
  // divisibility: three-digit examples; the generated numbers have four or five digits
  for (const [n, by2, by5] of [[346, true, false], [715, false, true], [870, true, true]]) assert.deepEqual([n % 2 === 0, n % 5 === 0, n % 10 === 0], [by2, by5, by2 && by5]);
  assert.equal(346, 34 * 10 + 6);
  assert.deepEqual([738, 582, 415].map((n) => [digitSum(n), n % 3 === 0, n % 9 === 0]), [[18, true, true], [15, true, false], [10, false, false]]);
  for (const id of ['digit-sum', 'all-tests']) eachVariant(divisibility, id, (step) => assert.ok(ints(step.text)[0] >= 1000, `${id}: four digits or more`));
  // the last-digit match uses none of the screen's examples
  for (const [n] of lessonStep(divisibility, 'last-digit').pairs) assert.ok(!text(divisibility, 'teach-last-digit').includes(plain(n)));

  // primes
  assert.ok(isPrime(103) && 103 === 7 * 14 + 5 && digitSum(103) === 4 && 11 * 11 > 103 && 7 * 7 < 103);
  assert.deepEqual(primeFactors(69), [3, 23]);
  assert.equal(digitSum(69), 15);
  assert.deepEqual(primeFactors(156), [2, 2, 3, 13]);
  assert.deepEqual([156 / 2, 78 / 2, 39 / 3, digitSum(39)], [78, 39, 13, 12]);
  assert.deepEqual(lessonStep(primes, 'example-factorise').figure.splits, [[156, 2, 78], [78, 2, 39], [39, 3, 13]]);
  for (const id of ['spot-primes', 'find-prime']) eachVariant(primes, id, (step) => assert.ok(!step.options.some((o) => ['103', '69'].includes(o.text)), `${id} asks about a worked example`));
  eachVariant(primes, 'factorise', (step) => assert.notEqual(ints(step.text)[0], 156));
  // every number the prime questions can show yields to the method on the screen: a factor is found, or ruled out, by primes whose square is no bigger
  for (const id of ['spot-primes', 'find-prime']) {
    eachVariant(primes, id, (step) => {
      for (const o of step.options) {
        const n = Number(o.text);
        if (n < 2) continue;
        const tried = primesUpTo(Math.floor(Math.sqrt(n)));
        assert.equal(!tried.some((p) => n % p === 0), isPrime(n), `${n}: trial division up to the square root decides`);
        assert.ok(tried.length <= 6, `${n}: at most six primes to try`);
      }
    });
  }

  // gcd
  assert.deepEqual(euclid(35, 20).steps.map((s) => [s.a, s.q, s.b, s.r]), [[35, 1, 20, 15], [20, 1, 15, 5], [15, 3, 5, 0]]);
  assert.deepEqual([gcd(20, 35), 20 / 5, 35 / 5], [5, 4, 7]);
  assert.deepEqual([gcd(4, 10), (4 * 10) / gcd(4, 10), 20 % 4, 10 % 4], [2, 20, 0, 2]);
  eachVariant(gcdEuclid, 'euclid-practice', (step) => {
    const [a, b] = ints(step.text);
    assert.ok(!(a === 48 && b === 18) && !(a === 84 && b === 30) && !(a === 35 && b === 20), 'euclid-practice asks a worked example back');
  });
  eachVariant(gcdEuclid, 'fraction', (step) => assert.notDeepEqual(ints(step.text).slice(0, 2), [20, 35]));
  eachVariant(gcdEuclid, 'meet-again', (step) => assert.notDeepEqual(ints(step.text).slice(0, 2).sort((p, q) => p - q), [4, 10]));

  // clock arithmetic
  assert.deepEqual([17 % 12, 100 % 12, 12 % 12], [5, 4, 0]);
  eachVariant(clock, 'mod-practice', (step) => assert.notDeepEqual(ints(step.text), [100, 12]));
  assert.deepEqual([47 % 10, 36 % 10, (47 + 36) % 10, (47 * 36) % 10, 47 + 36, 47 * 36], [7, 6, 3, 2, 83, 1692]);
  eachVariant(clock, 'mixed', (step) => assert.notEqual(ints(step.text)[2], 10, 'the worked example owns the 10-clock'));
  assert.deepEqual([7 + 5 + 4, (7 + 5 + 4 + 4) % 10, 7 + 5 + 9 + 4], [16, 0, 25]);
  eachVariant(clock, 'day-of-week', (step) => assert.notEqual(ints(step.text)[0], 23)); // 23 days is worked through in "week"

  // secret codes: Caesar's own key, 3, is the example on both screens
  assert.equal(caesar('ATTACK', 3), 'DWWDFN');
  assert.equal(caesar('XYZ', 3), 'ABC');
  const wheelFigure = lessonStep(codes, 'teach-caesar').figure;
  assert.deepEqual([wheelFigure.mode, wheelFigure.shift, wheelFigure.static, caesar(wheelFigure.text, wheelFigure.shift)], ['encode', 3, true, 'DWWDFN DW GDZQ']);
  eachVariant(codes, 'encode', (step) => assert.notEqual(Number(step.text.match(/key \*\*(\d+)\*\*/)[1]), 3));

  // power cycles
  assert.deepEqual([7 ** 1, 7 ** 2, 7 ** 3, 343 % 10], [7, 49, 343, 3]);
  assert.deepEqual([bigPowMod(3, 2, 5), bigPowMod(3, 3, 5), 4 * 3], [4, 2, 12]);
  eachVariant(cycles, 'small-power', (step) => assert.ok(![5, 10].includes(Number(step.text.match(/\\bmod (\d+)\$/)[1]))));
  assert.deepEqual([bigPowMod(5, 6, 7), 3 * 6 + 2, bigPowMod(5, 20, 7), 25 % 7], [1, 20, 4, 4]);
  eachVariant(cycles, 'fermat-use', (step) => assert.notEqual(Number(step.text.match(/(\d+)\^\{/)[1]), 5));

  // public keys
  assert.deepEqual([13 ** 3, 66 * 33 + 19, bigPowMod(13, 3, 33), bigPowMod(19, 7, 33)], [2197, 2197, 19, 13]);
  eachVariant(keys, 'lock', (step) => assert.notEqual(Number(step.text.match(/the number \*\*(\d+)\*\*/)[1]), 13));
  assert.deepEqual([21, 41, 61].map((v) => [v % 20, v % 3 === 0]), [[1, true], [1, false], [1, false]]);
  assert.match(lessonStep(keys, 'find-d').text, /primes 3 and 23/); // not the toy lock of the worked example
});

test('all seven lessons: one right answer per choice, no duplicate options, no broken text', () => {
  const lessons = LESSONS;
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), Object.keys(lessons));
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.equal(lesson.id, id);
    for (const raw of lesson.steps) {
      for (let k = 0; k < (raw.gen ? 150 : 1); k++) {
        const step = resolveStep(raw, makeRng(31 + k * 6007), raw.id);
        const where = `${id}/${raw.id} (seed ${k})`;
        const blob = JSON.stringify(step, (key, value) => (typeof value === 'function' ? undefined : value));
        assert.ok(!/undefined|NaN|\[object Object\]/.test(blob), `${where}: broken text`);
        if (step.options) {
          const texts = step.options.map((o) => o.text);
          assert.equal(new Set(texts).size, texts.length, `${where}: duplicate options`);
          const right = step.options.filter((o) => o.correct).length;
          if (step.type === 'choice') assert.equal(right, 1, `${where}: exactly one correct option`);
          else assert.ok(right >= 1, `${where}: at least one correct option`);
        }
        if (step.type === 'numeric') {
          assert.ok(Number.isInteger(step.answer) && step.answer >= 0, `${where}: whole-number answer`);
          assert.ok(!step.wrong.some(([v]) => v === step.answer), `${where}: "wrong" contains the answer`);
        }
      }
    }
  }
});
