/**
 * Proofs: How to Be Certain — independent checks of the course.
 *
 * Every generated step is run with many seeds and its answer is re-derived
 * here from the *text the learner sees*, by brute force or by a different
 * route than the generator takes. The interactive checks are run against
 * every reachable state where that is feasible, with the states built by
 * code written for this file (not by the widgets). The mathematical claims
 * the lessons make in passing are recomputed as well.
 *
 *   node --test tests/proofs-course.test.mjs
 *
 * One claim is too big for a test run and was checked once, offline, by a
 * linear sieve of the Liouville function up to 906,200,000: the first N > 1
 * for which fewer than half of the numbers 1 … N have an odd number of prime
 * factors is N = 906,150,257 (Pólya's conjecture; about ten seconds in Node).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { layoutPoints, regionCount, regionsOf } from '../src/widgets/chord-regions.js';
import { PRESETS } from '../src/widgets/conjecture-test.js';
import { fallenCount } from '../src/widgets/domino-chain.js';
import { isPiece, hasRoom } from '../src/widgets/domino-board.js';
import { dodge } from '../src/widgets/diagonal-list.js';
import { trominoTiling, centreTromino, fractionList, integerPosition, fractionText } from '../content/courses/proofs/helpers.js';

const SEEDS = 300;
const LESSONS = ['evidence-is-not-proof', 'contradiction', 'induction', 'pigeonhole', 'invariants', 'infinity'];
/** Every generated step of the course. Each one is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'evidence-is-not-proof': ['parity-proof', 'counterexample', 'built-to-fail'],
  contradiction: ['assume-what'],
  induction: ['use-formula', 'skip-step'],
  pigeonhole: ['socks', 'difference', 'three-alike', 'guaranteed'],
  invariants: ['coins-can', 'erase-game'],
  infinity: ['list-integers', 'fraction-position', 'diagonal-pick'],
};
const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/proofs/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, 'proofs', id);
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
    try { verify(step); } catch (err) { err.message = `${lessonId}/${stepId} (seed ${seed}): ${err.message}\n  text: ${step.text.replace(/\s+/g, ' ').trim()}`; throw err; }
  }
}
/** A step that is not generated, in the shape the player sees. */
const fixed = (lessonId, stepId) => {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  return resolveStep(raw, makeRng(1), stepId);
};
const correctOption = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, 'exactly one correct option'); return right[0]; };
const ints = (text) => (text.match(/-?\d+/g) || []).map(Number);
const isPrime = (n) => { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; };
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const choose = (n, k) => { if (k > n) return 0; let v = 1; for (let i = 0; i < k; i++) v = (v * (n - i)) / (i + 1); return Math.round(v); };
const blankValue = (step, i) => (step.blanks[i].kind === 'select' ? step.blanks[i].answer : step.blanks[i].numbers[0]);

/* ============================================================ lesson 1 */

test('evidence: the circle really gives 1, 2, 4, 8, 16, 31, 57 regions', () => {
  for (let n = 1; n <= 7; n++) {
    const pts = layoutPoints(n);
    // count the crossing points of the chords directly, and make sure no two crossings coincide
    const chords = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) chords.push([pts[i], pts[j], i, j]);
    const crossings = [];
    for (let a = 0; a < chords.length; a++) for (let b = a + 1; b < chords.length; b++) {
      const [p, q, i, j] = chords[a];
      const [u, v, k, l] = chords[b];
      if (new Set([i, j, k, l]).size < 4) continue;
      const den = (q.x - p.x) * (v.y - u.y) - (q.y - p.y) * (v.x - u.x);
      if (Math.abs(den) < 1e-12) continue;
      const t = ((u.x - p.x) * (v.y - u.y) - (u.y - p.y) * (v.x - u.x)) / den;
      const w = ((u.x - p.x) * (q.y - p.y) - (u.y - p.y) * (q.x - p.x)) / den;
      if (t > 1e-9 && t < 1 - 1e-9 && w > 1e-9 && w < 1 - 1e-9) crossings.push({ x: p.x + t * (q.x - p.x), y: p.y + t * (q.y - p.y) });
    }
    assert.equal(crossings.length, choose(n, 4), `${n} points: one crossing for every four points`);
    let closest = Infinity;
    for (let a = 0; a < crossings.length; a++) for (let b = a + 1; b < crossings.length; b++) closest = Math.min(closest, Math.hypot(crossings[a].x - crossings[b].x, crossings[a].y - crossings[b].y));
    assert.ok(closest > 4, `${n} points: no three chords meet in one point (closest crossings ${closest.toFixed(1)} apart)`);
    // Euler's formula for the drawing: V - E + F = 1, counting only the faces inside the circle
    const V = n + crossings.length;
    const E = (n >= 2 ? n : 0) + chords.length + 2 * crossings.length;
    const faces = n === 1 ? 1 : E - V + 1;
    assert.equal(faces, 1 + choose(n, 2) + choose(n, 4));
    assert.equal(regionCount(n), faces, `the widget builds ${faces} regions for ${n} points`);
  }
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((n) => regionCount(n)), [1, 2, 4, 8, 16, 31, 57]);
  assert.equal(1 + choose(8, 2) + choose(8, 4), 99, 'eight points give 99');
  assert.equal(regionCount(6, true), 30, 'six evenly spaced points lose one region');
  const count = fixed('evidence-is-not-proof', 'count-six');
  assert.equal(count.widget.n, 6);
  for (let counted = 0; counted <= 31; counted++) {
    const said = count.check({ n: 6, regions: 31, counted, complete: counted === 31 });
    assert.equal(said === true, counted === 31, `counted ${counted}`);
    if (said !== true) assert.equal(typeof said, 'string');
  }
  assert.match(fixed('evidence-is-not-proof', 'count-six').explain, /\*\*31\.\*\*/);
});

test('evidence: Euler\'s polynomial is prime for n = 0 … 39 and fails at 40', () => {
  const value = (n) => n * n + n + 41;
  for (let n = 0; n <= 39; n++) assert.ok(isPrime(value(n)), `n = ${n}`);
  assert.equal(value(40), 41 * 41);
  assert.equal(value(41), 41 * 43);
  const hunt = fixed('evidence-is-not-proof', 'euler-hunt');
  const { min, max } = hunt.widget;
  const failing = [];
  for (let n = min; n <= max; n++) {
    const res = PRESETS.euler(n);
    assert.equal(res.ok, isPrime(value(n)), `the widget's verdict for n = ${n}`);
    assert.ok(res.text.includes(String(value(n))), `the widget quotes ${value(n)}`);
    const product = /= (\d+) \\times (\d+)\$/.exec(res.text);
    if (product) assert.equal(Number(product[1]) * Number(product[2]), value(n));
    if (!res.ok) failing.push(n);
  }
  assert.equal(failing[0], 40, 'the first failure on offer is n = 40');
  // the check: right exactly when a failure has been seen
  for (const testedSoFar of [[0], [0, 1, 2], Array.from({ length: 40 }, (_, i) => i), [0, 40], [0, 44], Array.from({ length: 48 }, (_, i) => i)]) {
    const fails = testedSoFar.filter((n) => !isPrime(value(n)));
    const said = hunt.check({ n: testedSoFar[testedSoFar.length - 1], tested: testedSoFar, failures: fails, found: fails.length > 0 });
    assert.equal(said === true, fails.length > 0, `tested ${testedSoFar.length} values`);
    if (said !== true) assert.ok(said.includes(String(testedSoFar.length)), 'the feedback counts the values tested');
  }
  assert.ok(!isPrime(value(hunt.solution.n)), 'the solution is a counterexample');
  // the two factorisations the learner completes
  const why = fixed('evidence-is-not-proof', 'why-forty');
  assert.equal(blankValue(why, 0) * 41, value(40));
  assert.equal(41 * blankValue(why, 1), value(41));
});

test('evidence: the skeleton proofs about odd and even numbers', () => {
  const seen = new Set();
  const sample = [];
  for (let m = -4; m <= 6; m++) for (let k = -3; k <= 7; k++) sample.push([m, k]);
  const even = (v) => ((v % 2) + 2) % 2 === 0;
  eachVariant('evidence-is-not-proof', 'parity-proof', (step) => {
    const claim = /\*\*(.+?)\*\*/.exec(step.text)[1];
    seen.add(claim);
    const b = step.blanks.map((_, i) => blankValue(step, i));
    const says = b[b.length - 1];
    if (claim === 'the sum of two odd numbers is even') {
      for (const [m, k] of sample) { const sum = (2 * m + 1) + (2 * k + 1); assert.equal(sum, 2 * m + 2 * k + b[0]); assert.equal(sum, 2 * (m + k + b[1])); assert.ok(even(sum)); }
      assert.equal(says, 'even');
    } else if (claim === 'the sum of an even number and an odd number is odd') {
      for (const [m, k] of sample) { const odd = 2 * k + b[0]; assert.ok(!even(odd)); assert.equal(2 * m + odd, b[1] * (m + k) + 1); assert.ok(!even(2 * m + odd)); }
      assert.equal(b[0], 1);
      assert.equal(says, 'odd');
    } else if (claim === 'the product of two odd numbers is odd') {
      for (const [m, k] of sample) { const prod = (2 * m + 1) * (2 * k + 1); assert.equal(prod, 4 * m * k + 2 * m + 2 * k + b[0]); assert.equal(prod, 2 * (b[1] * m * k + m + k) + 1); assert.ok(!even(prod)); }
      assert.equal(says, 'odd');
    } else if (claim === 'an even number times any whole number is even') {
      for (const [m, k] of sample) { assert.equal((2 * m) * k, b[0] * (m * k)); assert.ok(even(2 * m * k)); }
      assert.equal(says, 'even');
    } else assert.fail(`no check for the claim "${claim}"`);
  });
  assert.equal(seen.size, 4, 'all four skeleton proofs turn up');
});

/** The false claims of the counterexample step, written out again: what a claim is about, and when it holds. */
const CLAIMS = {
  'Every odd number greater than 1 is prime.': { about: (n) => n % 2 === 1 && n > 1, holds: isPrime },
  'Every prime number is odd.': { about: isPrime, holds: (n) => n % 2 === 1 },
  'Every whole number that ends in 3 is prime.': { about: (n) => n % 10 === 3, holds: isPrime },
  'Every multiple of 3 is odd.': { about: (n) => n % 3 === 0, holds: (n) => n % 2 === 1 },
  'Every even number is a multiple of 4.': { about: (n) => n % 2 === 0, holds: (n) => n % 4 === 0 },
  'Every whole number that is divisible by 6 is also divisible by 12.': { about: (n) => n % 6 === 0, holds: (n) => n % 12 === 0 },
};

test('evidence: exactly one option is a counterexample, and every "why" is true', () => {
  const seen = new Set();
  eachVariant('evidence-is-not-proof', 'counterexample', (step) => {
    const claim = /The claim: \*\*(.+?)\*\*/.exec(step.text)[1];
    const rule = CLAIMS[claim];
    assert.ok(rule, `the test knows the claim "${claim}"`);
    seen.add(claim);
    const values = step.options.map((o) => Number(o.text));
    assert.deepEqual(values, values.slice().sort((a, b) => a - b), 'options in increasing order');
    for (const o of step.options) {
      const n = Number(o.text);
      const breaks = rule.about(n) && !rule.holds(n);
      assert.equal(breaks, !!o.correct, `${n} against "${claim}"`);
      if (o.correct) continue;
      assert.ok(o.why, `wrong option ${n} explains itself`);
      if (rule.about(n)) assert.match(o.why, /fits the claim/, `${n} fits`);
      else assert.match(o.why, /says nothing about/, `${n} is outside the claim`);
      if (/is prime/.test(o.why) && !/not prime/.test(o.why)) assert.ok(isPrime(n), `${n} is called prime`);
      if (/not prime/.test(o.why)) assert.ok(!isPrime(n), `${n} is called not prime`);
      if (/is even/.test(o.why)) assert.equal(n % 2, 0);
      if (/is odd/.test(o.why) && !/about odd/.test(o.why)) assert.equal(n % 2, 1, `${n}: ${o.why}`);
    }
    const c = Number(correctOption(step).text);
    assert.ok(step.explain.startsWith(String(c)) || step.explain.startsWith(`$${c}`), 'the explanation is about the counterexample');
    for (const m of step.explain.matchAll(/\$(\d+) = (\d+) \\times (\d+)( \+ (\d+))?\$/g)) assert.equal(Number(m[1]), Number(m[2]) * Number(m[3]) + Number(m[5] || 0), m[0]);
    if (/remainder of 6/.test(step.explain)) assert.equal(c % 12, 6);
    if (/not prime/.test(step.explain)) assert.ok(!isPrime(c));
  });
  assert.equal(seen.size, Object.keys(CLAIMS).length, 'every claim turns up');
});

test('evidence: the formula that is built to fail at n = p', () => {
  eachVariant('evidence-is-not-proof', 'built-to-fail', (step) => {
    const p = Number(/n\^2 - n \+ (\d+)\$/.exec(step.text)[1]);
    const f = (n) => n * n - n + p;
    const row = ints(/it gives ([\d, ]+)\./.exec(step.text)[1]);
    assert.deepEqual(row, [1, 2, 3, 4].map(f), 'the four values quoted');
    let smallest = 1;
    while (!((smallest * smallest) % p === 0 && smallest % p === 0 && p % p === 0)) smallest++;
    assert.equal(step.answer, smallest, 'the smallest n for which all three terms are multiples of p');
    assert.equal(f(p), p * p);
    for (let n = 1; n < p; n++) assert.ok(isPrime(f(n)), `n = ${n} gives a prime, as the explanation says`);
    for (const [value, message] of step.wrong) {
      assert.notEqual(value, step.answer);
      const product = /\$(\d+) \\times (\d+)\$/.exec(message);
      if (product) assert.equal(f(value), Number(product[1]) * Number(product[2]), `the value at n = ${value}`);
      if (/1, 1 and/.test(message)) assert.equal(value, 1);
    }
  });
});

test('evidence: fixed facts', () => {
  // Pólya's claim on a small range (the famous first failure was checked offline, see the header)
  const limit = 200000;
  const lambda = new Int8Array(limit + 1).fill(1);
  const rest = Array.from({ length: limit + 1 }, (_, i) => i);
  for (let p = 2; p <= limit; p++) {
    if (rest[p] !== p) continue; // not prime: something smaller already divided it
    for (let m = p; m <= limit; m += p) while (rest[m] % p === 0) { rest[m] /= p; lambda[m] = -lambda[m]; }
  }
  assert.equal(lambda[12], -1, '12 = 2 × 2 × 3 has three prime factors');
  let odd = 0;
  for (let n = 1; n <= limit; n++) {
    if (lambda[n] === -1) odd++;
    if (n > 1) assert.ok(2 * odd >= n, `at least half of 1 … ${n} have an odd number of prime factors`);
  }
  assert.match(fixed('evidence-is-not-proof', 'polya').text, /906\{,\}150\{,\}257/);
  // the direct proof
  for (let m = -5; m <= 5; m++) for (let k = -5; k <= 5; k++) assert.equal(Math.abs((2 * m + 2 * k) % 2), 0);
  const order = fixed('evidence-is-not-proof', 'even-proof');
  assert.equal(order.items.length, 6);
  assert.match(order.items[0], /^Let /);
  assert.match(order.items[5], /^So \$a \+ b\$ is even/);
});

/* ============================================================ lesson 2 */

test('contradiction: the search on the grid', () => {
  const hunt = fixed('contradiction', 'hunt');
  const [q0, q1] = hunt.widget.x;
  const [p0, p1] = hunt.widget.y;
  const passes = [];
  for (let q = q0; q <= q1; q++) for (let p = p0; p <= p1; p++) {
    const gap = Math.abs(p * p - 2 * q * q);
    if (q >= 1) assert.notEqual(gap, 0, `no grid point lies on the line (q = ${q}, p = ${p})`);
    const said = hunt.check({ P: { x: q, y: p } });
    assert.equal(said === true, q >= 1 && gap === 1, `q = ${q}, p = ${p}`);
    if (said === true) passes.push(`${p}/${q}`);
    else if (q >= 1) assert.ok(said.includes(`gap of ${gap}`) && said.includes(`= ${p * p}$`) && said.includes(`= ${2 * q * q}$`), said);
  }
  assert.deepEqual(passes.sort(), ['1/1', '17/12', '3/2', '7/5'], 'the fractions with a gap of 1');
  assert.equal(hunt.check(hunt.solution), true);
  assert.equal((3 / 2) ** 2, 2.25);
  assert.ok(Math.abs((7 / 5) ** 2 - 1.96) < 1e-12);
});

test('contradiction: a smaller positive number', () => {
  const halve = fixed('contradiction', 'halve');
  const { min, max, step, format } = halve.widget;
  for (let k = 0; min + k * step <= max + 1e-9; k++) {
    const a = min + k * step;
    const said = halve.check({ a });
    assert.equal(said === true, a > 0 && a < 0.25, `a = ${a}`);
    if (said !== true) assert.equal(typeof said, 'string');
    if (a === 0) assert.match(said, /Zero/);
    if (a === 0.25) assert.match(said, /their number/);
    if (a > 0.25) assert.match(said, /larger/);
  }
  assert.equal(halve.check(halve.solution), true);
  assert.equal(format(0.25), '1/4');
  assert.equal(format(0.5), '1/2');
  assert.equal(format(3 / 32), '3/32');
  assert.equal(fractionText(0), '0');
});

test('contradiction: fixed facts', () => {
  // an odd number has an odd square
  const odd = fixed('contradiction', 'odd-square');
  for (let m = -6; m <= 6; m++) {
    assert.equal((2 * m + 1) ** 2, 2 * (blankValue(odd, 0) * m * m + 2 * m) + blankValue(odd, 1));
    assert.equal(Math.abs((2 * m + 1) ** 2 % 2), 1);
  }
  assert.equal(blankValue(odd, 2), 'odd');
  assert.equal(blankValue(odd, 3), 'even');
  // no fraction in lowest terms squares to 2 (a brute-force look at small ones)
  for (let q = 1; q <= 400; q++) { const p = Math.round(Math.SQRT2 * q); assert.notEqual(p * p, 2 * q * q); }
  // the bogus proof: with a = b every line up to line 4 is true, and line 5 is false
  const bogus = fixed('contradiction', 'bogus');
  assert.equal(correctOption(bogus).text, 'Line 5');
  for (const a of [1, 3, -2]) {
    const b = a;
    assert.equal(a * a, a * b);
    assert.equal(a * a - b * b, a * b - b * b);
    assert.equal((a + b) * (a - b), b * (a - b));
    assert.notEqual(a + b, b, 'line 5 is false');
    assert.equal(a - b, 0, 'because it divides by a - b = 0');
  }
  // Euclid
  const primes = [2, 3, 5, 7, 11, 13];
  const N = primes.reduce((t, p) => t * p, 1) + 1;
  assert.equal(N, 30031);
  assert.equal(59 * 509, N);
  assert.ok(isPrime(59) && isPrime(509) && !primes.includes(59) && !primes.includes(509));
  for (const p of primes) assert.equal(N % p, 1);
  const fill = fixed('contradiction', 'primes-fill');
  assert.deepEqual(fill.blanks.map((_, i) => blankValue(fill, i)), [1, 'none', 'at least one', 'missing from']);
  assert.match(correctOption(fixed('contradiction', 'n-not-prime')).text, /prime factor that is not on the list/);
  // the proof for the wrong number: only line 3 makes an unsound step
  assert.equal(correctOption(fixed('contradiction', 'root-four')).text, 'Line 3');
  assert.ok((2 * 2) % 4 === 0 && 2 % 4 !== 0, 'p = 2: the square is divisible by 4, p is not');
  for (let k = 1; k <= 20; k++) for (let q = 1; q <= 200; q++) if (16 * k * k === 4 * q * q) assert.equal(q % 2, 0, 'line 4 is sound');
  // the ordered proofs start with the supposition and end with the conclusion
  const small = fixed('contradiction', 'smallest-order');
  assert.match(small.items[0], /^Suppose/);
  assert.match(small.items[small.items.length - 1], /no smallest positive fraction/);
  const root = fixed('contradiction', 'sqrt2-order');
  assert.match(root.items[0], /^Suppose/);
  assert.match(root.items[root.items.length - 1], /contradiction/);
});

const SUPPOSE = {
  '$\\sqrt{3}$ is not a fraction.': '$\\sqrt{3}$ is a fraction',
  'There are infinitely many primes.': 'There are only finitely many primes',
  'There is no largest whole number.': 'There is a largest whole number',
  'Every prime number greater than 2 is odd.': 'Some prime number greater than 2 is even',
  'No whole number is both even and odd.': 'Some whole number is both even and odd',
  'There is no smallest positive fraction.': 'There is a smallest positive fraction',
};

test('contradiction: the supposition is the exact opposite of the claim', () => {
  const seen = new Set();
  eachVariant('contradiction', 'assume-what', (step) => {
    const claim = /\*\*(.+?)\*\*/.exec(step.text)[1];
    assert.ok(SUPPOSE[claim], `the test knows the claim "${claim}"`);
    seen.add(claim);
    assert.equal(correctOption(step).text, SUPPOSE[claim]);
    assert.equal(step.options.length, 4);
    for (const o of step.options) {
      if (o.correct) continue;
      assert.ok(o.why, `"${o.text}" explains itself`);
      if (`${o.text}.` === claim) assert.match(o.why, /claim itself/);
    }
    assert.ok(step.options.some((o) => `${o.text}.` === claim), 'the claim itself is offered as a trap');
    assert.ok(step.explain.includes(SUPPOSE[claim]));
  });
  assert.equal(seen.size, Object.keys(SUPPOSE).length);
});

/* ============================================================ lesson 3 */

/** All subsets of [1 … n]. */
const subsets = (n) => Array.from({ length: 1 << n }, (_, mask) => Array.from({ length: n }, (_, i) => i + 1).filter((i) => mask & (1 << (i - 1))));

test('induction: the domino chains', () => {
  const hook = fixed('induction', 'hook');
  const count = hook.widget.count;
  for (const gaps of subsets(count - 1)) for (const pushed of [false, true]) {
    // a domino falls when it is pushed, or when the one before it fell and could reach it
    const down = new Array(count + 1).fill(false);
    if (pushed) { down[1] = true; for (let k = 2; k <= count; k++) down[k] = down[k - 1] && !gaps.includes(k - 1); }
    const fallen = down.filter(Boolean).length;
    assert.equal(pushed ? fallenCount(count, gaps) : 0, fallen, 'the widget counts the same');
    const said = hook.check({ count, gaps, pushed, fallen, allFallen: fallen === count });
    assert.equal(said === true, fallen === count, `gaps ${gaps}, pushed ${pushed}`);
    if (said === true) continue;
    if (fallen > 0) {
      assert.ok(gaps.includes(fallen), 'the chain stopped at a broken link');
      assert.ok(said.includes(`domino ${fallen} stands too far from domino ${fallen + 1}`), said);
    } else if (/close enough/.test(said)) assert.equal(gaps.length, 0);
  }
  assert.deepEqual(hook.widget.gaps, [6]);
  assert.equal(hook.check({ count, gaps: hook.solution.gaps, pushed: true, fallen: count, allFallen: true }), true);

  const horses = fixed('induction', 'horses');
  const n = horses.widget.count;
  let passes = 0;
  for (const gaps of subsets(n - 1)) for (const pushed of [false, true]) {
    const fallen = pushed ? fallenCount(n, gaps) : 0;
    const said = horses.check({ count: n, gaps, pushed, fallen, allFallen: fallen === n });
    assert.equal(said === true, pushed && gaps.length === 1 && gaps[0] === 1, `gaps ${gaps}, pushed ${pushed}`);
    if (said === true) { passes++; assert.equal(fallen, 1, 'only the first claim is proved'); continue; }
    if (gaps.length === 1 && gaps[0] > 1) {
      // the step from k to k + 1 horses: the first k and the last k of k + 1 horses
      const k = gaps[0];
      const first = Array.from({ length: k }, (_, i) => i + 1);
      const last = Array.from({ length: k }, (_, i) => i + 2);
      const shared = first.filter((h) => last.includes(h)).length;
      assert.ok(shared >= 1 && said.includes(`${shared} horse${shared === 1 ? '' : 's'} in common`), said);
    }
  }
  assert.equal(passes, 1);
  // and the step from 1 to 2 really has no overlap
  assert.equal([1].filter((h) => [2].includes(h)).length, 0);
});

test('induction: sums and layers', () => {
  const sums = fixed('induction', 'odd-sums');
  assert.deepEqual([0, 1, 2].map((i) => blankValue(sums, i)), [1 + 3, 1 + 3 + 5, 1 + 3 + 5 + 7]);
  assert.equal(blankValue(sums, 3), 'square');
  for (let n = 1; n <= 200; n++) {
    let odd = 0;
    let all = 0;
    for (let k = 1; k <= n; k++) { odd += 2 * k - 1; all += k; }
    assert.equal(odd, n * n);
    assert.equal(all, (n * (n + 1)) / 2);
    assert.equal((n + 1) ** 2 - n ** 2, 2 * n + 1, 'the L-shaped layer');
    assert.equal(PRESETS['odd-sum'](n).ok, true);
  }
  // the layer the learner adds to the 4 × 4 square
  const layer = fixed('induction', 'add-layer');
  const start = layer.widget.on;
  assert.equal(start.length, 16);
  assert.deepEqual(layer.widget.locked, start);
  const rows = new Set(start.map((i) => Math.floor(i / 5)));
  const cols = new Set(start.map((i) => i % 5));
  assert.ok(rows.size === 4 && cols.size === 4, 'the filled squares form a 4 × 4 block');
  for (let count = 16; count <= 25; count++) {
    const said = layer.check({ count });
    assert.equal(said === true, count === 25);
    if (said !== true) assert.ok(said.includes(`${25 - count} more`));
  }
  assert.equal(layer.solution.on.length, 25);
  // the induction step the learner completes
  const algebra = fixed('induction', 'step-algebra');
  const [two, twoAgain, one] = [0, 1, 2].map((i) => blankValue(algebra, i));
  for (let n = 1; n <= 30; n++) {
    assert.equal((n * (n + 1)) / 2 + (n + 1), (n * (n + 1) + two * (n + 1)) / 2);
    assert.equal(n * (n + 1) + two * (n + 1), (n + 1) * (n + twoAgain));
    assert.equal(((n + one) * (n + one + 1)) / 2, ((n + 1) * (n + 2)) / 2);
  }
  const order = fixed('induction', 'sum-order');
  assert.match(order.items[0], /Base case/);
  assert.match(order.items[1], /Induction step/);
  assert.match(order.items[5], /together prove/);
});

test('induction: adding up odd numbers with the formula', () => {
  eachVariant('induction', 'use-formula', (step) => {
    const last = Number(/\\cdots \+ (\d+) =/.exec(step.text)[1]);
    assert.equal(last % 2, 1);
    let sum = 0;
    let terms = 0;
    for (let v = 1; v <= last; v += 2) { sum += v; terms++; }
    assert.equal(step.answer, sum);
    for (const [value, message] of step.wrong) {
      assert.notEqual(value, sum);
      if (/squares the last/.test(message)) assert.equal(value, last * last);
      if (/Count again/.test(message)) { assert.equal(value, (terms - 1) ** 2); assert.ok(message.includes(`there are ${terms} odd numbers`)); }
      if (/\*all\*/.test(message)) assert.equal(value, (last * (last + 1)) / 2);
    }
    assert.ok(step.hints[1].includes(`2 \\times ${terms} - 1`) && step.hints[1].includes(`${terms} terms`));
    assert.ok(step.explain.includes(`$${terms}^2 = ${sum}$`));
    const nth = /is the (\d+)(st|nd|rd|th) odd number/.exec(step.explain);
    assert.equal(Number(nth[1]), terms);
    const suffix = terms % 100 >= 11 && terms % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][terms % 10] || 'th';
    assert.equal(nth[2], suffix, `ordinal of ${terms}`);
  });
});

test('induction: which cases a chain with a longer stride reaches', () => {
  eachVariant('induction', 'skip-step', (step) => {
    const a = Number(/true for \$n = (\d+)\$/.exec(step.text)[1]);
    const d = Number(/true for \$n \+ (\d+)\$/.exec(step.text)[1]);
    const proved = new Set();
    for (let v = a; v <= 200; v += d) proved.add(v);
    for (const o of step.options) {
      assert.equal(proved.has(Number(o.text)), !!o.correct, `n = ${o.text} with start ${a} and stride ${d}`);
      if (!o.correct) assert.ok(o.why.includes(`not ${a} plus a multiple of ${d}`));
    }
    const t = Number(correctOption(step).text);
    const shown = /\$(\d+) = (\d+) \+ (\d+) \\times (\d+)\$/.exec(step.explain);
    assert.deepEqual(shown.slice(1).map(Number), [t, a, (t - a) / d, d]);
    assert.ok(step.explain.includes(`${a}, ${a + d}, ${a + 2 * d}, ${a + 3 * d}`));
  });
});

/** The state of a board with pieces on it, worked out from scratch. */
function boardState(rows, cols, removed, pieces, kind) {
  const covered = new Set(pieces.flat());
  assert.equal(covered.size, pieces.length * (kind === 'tromino' ? 3 : 2), 'pieces do not overlap');
  const open = [];
  for (let i = 0; i < rows * cols; i++) if (!removed.includes(i) && !covered.has(i)) open.push(i);
  for (const c of covered) assert.ok(!removed.includes(c), 'no piece covers a removed square');
  const dark = open.filter((i) => (Math.floor(i / cols) + (i % cols)) % 2 === 1).length;
  const quarters = [0, 0, 0, 0];
  for (let i = 0; i < rows * cols; i++) if (removed.includes(i) || covered.has(i)) quarters[(Math.floor(i / cols) < rows / 2 ? 0 : 2) + (i % cols < cols / 2 ? 0 : 1)]++;
  return { pieces, count: pieces.length, placed: pieces.length, open: open.length, openDark: dark, openLight: open.length - dark, complete: open.length === 0, stuck: open.length > 0 && placements(rows, cols, removed, kind).every((p) => p.some((c) => !open.includes(c))), quarters };
}
/** Every place a single piece could go on an empty board. */
function placements(rows, cols, removed, kind) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (kind === 'tromino') {
      if (r + 1 >= rows || c + 1 >= cols) continue;
      const block = [i, i + 1, i + cols, i + cols + 1];
      for (const skip of block) out.push(block.filter((v) => v !== skip));
    } else {
      if (c + 1 < cols) out.push([i, i + 1]);
      if (r + 1 < rows) out.push([i, i + cols]);
    }
  }
  return out.filter((p) => p.every((v) => !removed.includes(v)));
}
/** Every set of non-overlapping pieces (each set once). */
function* packings(rows, cols, removed, kind) {
  const all = placements(rows, cols, removed, kind);
  const used = new Set();
  const chosen = [];
  function* go(from) {
    yield chosen.slice();
    for (let k = from; k < all.length; k++) {
      if (all[k].some((c) => used.has(c))) continue;
      all[k].forEach((c) => used.add(c));
      chosen.push(all[k]);
      yield* go(k + 1);
      chosen.pop();
      all[k].forEach((c) => used.delete(c));
    }
  }
  yield* go(0);
}

test('induction: trominoes', () => {
  const tryIt = fixed('induction', 'tromino-try');
  const { rows, cols, removed } = tryIt.widget;
  assert.equal(rows * cols - removed.length, 15);
  let tilings = 0;
  let checked = 0;
  for (const pieces of packings(rows, cols, removed, 'tromino')) {
    const st = boardState(rows, cols, removed, pieces, 'tromino');
    const said = tryIt.check(st);
    assert.equal(said === true, st.complete, `pieces ${JSON.stringify(pieces)}`);
    checked++;
    if (st.complete) { tilings++; assert.equal(pieces.length, 5); continue; }
    assert.equal(typeof said, 'string');
    if (/No L fits/.test(said)) assert.ok(st.stuck && pieces.length > 0 && said.includes(String(st.open)));
    if (/Keep going/.test(said)) assert.ok(!st.stuck && said.includes(`${st.open} squares`));
    assert.equal(hasRoom(new Set(Array.from({ length: 16 }, (_, i) => i).filter((i) => !removed.includes(i) && !pieces.flat().includes(i))), rows, cols, 'tromino'), !st.stuck, 'the widget agrees about "stuck"');
  }
  assert.ok(tilings >= 1 && checked > 500, `${tilings} complete tilings among ${checked} arrangements`);
  const solved = boardState(rows, cols, removed, tryIt.solution.pieces, 'tromino');
  assert.ok(solved.complete && tryIt.solution.pieces.every((p) => isPiece(p, cols, 'tromino')));
  assert.equal(tryIt.check(solved), true);

  // Golomb's construction tiles every board of side 2, 4, 8, 16, whichever square is missing
  for (const size of [2, 4, 8, 16]) for (let hole = 0; hole < size * size; hole++) {
    const pieces = trominoTiling(size, hole);
    assert.equal(pieces.length, (size * size - 1) / 3);
    const st = boardState(size, size, [hole], pieces, 'tromino');
    assert.ok(st.complete, `size ${size}, hole ${hole}`);
    for (const p of pieces) { const rs = p.map((c) => Math.floor(c / size)); const cs = p.map((c) => c % size); assert.ok(Math.max(...rs) - Math.min(...rs) === 1 && Math.max(...cs) - Math.min(...cs) === 1, 'each piece is an L'); }
  }

  // the induction step: exactly one single tromino leaves one square gone in every quarter
  const stepIt = fixed('induction', 'tromino-step');
  const board = stepIt.widget;
  assert.equal(stepIt.check(boardState(8, 8, board.removed, [], 'tromino')) === true, false);
  const good = [];
  for (const piece of placements(8, 8, board.removed, 'tromino')) {
    const st = boardState(8, 8, board.removed, [piece], 'tromino');
    const said = stepIt.check(st);
    const works = st.quarters.every((gone) => gone === 1);
    assert.equal(said === true, works, `piece ${piece}`);
    if (works) good.push(piece.join());
  }
  assert.deepEqual(good, [stepIt.solution.pieces[0].slice().sort((a, b) => a - b).join()]);
  assert.deepEqual(centreTromino(8, board.removed[0]).slice().sort((a, b) => a - b), [28, 35, 36]);
  assert.equal(board.max, 1);
});

/* ============================================================ lesson 4 */

/** The most things you can hold from `kinds` kinds with no kind appearing `k` times, by exhaustive search. */
const maxWithoutCache = new Map();
function maxWithout(kinds, k) {
  const key = `${kinds},${k}`;
  if (maxWithoutCache.has(key)) return maxWithoutCache.get(key);
  let best = 0;
  const seen = new Set();
  const stack = [new Array(kinds).fill(0)];
  while (stack.length) {
    const counts = stack.pop();
    const id = counts.slice().sort().join();
    if (seen.has(id)) continue;
    seen.add(id);
    best = Math.max(best, counts.reduce((t, c) => t + c, 0));
    for (let i = 0; i < kinds; i++) if (counts[i] + 1 < k) { const next = counts.slice(); next[i]++; stack.push(next); }
  }
  maxWithoutCache.set(key, best);
  return best;
}

test('pigeonhole: how many to be certain of a match', () => {
  eachVariant('pigeonhole', 'socks', (step) => {
    const kinds = Number(/\*\*(\d+) (colours|different symbols)\*\*/.exec(step.text)[1]);
    assert.equal(step.answer, maxWithout(kinds, 2) + 1);
    for (const [value] of step.wrong) assert.notEqual(value, step.answer);
    assert.ok(step.explain.includes(`${kinds} of them and still no match`) && step.explain.includes(`So ${kinds + 1} are enough`));
    assert.ok(step.hints[1].includes(`After ${kinds} `));
    assert.ok(step.wrong.some(([v, m]) => v === kinds && m.includes(`With ${kinds} `)));
  });
  eachVariant('pigeonhole', 'three-alike', (step) => {
    const kinds = Number(/\*\*(\d+) colours\*\*/.exec(step.text)[1]);
    const k = { three: 3, four: 4 }[/certain of (\w+) of the same colour/.exec(step.text)[1]];
    const safe = maxWithout(kinds, k);
    assert.equal(step.answer, safe + 1);
    assert.equal(safe, (k - 1) * kinds);
    for (const [value, message] of step.wrong) {
      assert.notEqual(value, step.answer);
      if (/guarantees a pair/.test(message)) assert.equal(value, maxWithout(kinds, 2) + 1);
      if (/you could hold exactly/.test(message)) { assert.equal(value, safe); assert.ok(message.includes(`${safe} socks`) && message.includes(`exactly ${k - 1} of every colour`)); }
      if (/more than you need/.test(message)) assert.ok(value > step.answer);
    }
    assert.ok(step.explain.includes(`$${k - 1} \\times ${kinds} = ${safe}$`) && step.explain.includes(`**${safe + 1}**`));
  });
});

test('pigeonhole: the two numbers that differ by a multiple of n', () => {
  eachVariant('pigeonhole', 'difference', (step) => {
    const n = Number(/differ by a multiple of (\d+)\./.exec(step.text)[1]);
    const list = ints(/\$\$([\s\S]+?)\$\$/.exec(step.text)[1].replace(/\\quad/g, ' '));
    assert.equal(list.length, n + 1, `${n + 1} numbers`);
    assert.equal(new Set(list).size, list.length, 'all different');
    const pairs = [];
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) if ((list[i] - list[j]) % n === 0) pairs.push([list[i], list[j]].sort((a, b) => a - b));
    assert.equal(pairs.length, 1, 'exactly one pair differs by a multiple of n');
    for (const o of step.options) {
      const [a, b] = ints(o.text);
      assert.ok(list.includes(a) && list.includes(b) && a < b, `${o.text} are two numbers of the list`);
      assert.equal((b - a) % n === 0, !!o.correct, o.text);
      if (!o.correct) assert.ok(o.why.includes(`$${b} - ${a} = ${b - a}$`) && o.why.includes(`remainders are ${a % n} and ${b % n}`), o.why);
    }
    assert.equal(new Set(step.options.map((o) => o.text)).size, 4);
    const [a, b] = pairs[0];
    assert.ok(step.explain.includes(`$${b} - ${a} = ${b - a} = ${(b - a) / n} \\times ${n}$`) && step.explain.includes(`remainder (${a % n})`));
  });
});

test('pigeonhole: what is certain about birthdays', () => {
  eachVariant('pigeonhole', 'guaranteed', (step) => {
    const students = Number(/\*\*(\d+) students\*\*/.exec(step.text)[1]);
    // the smallest possible "fullest month": spread the birthdays as evenly as possible
    const months = new Array(12).fill(0);
    for (let i = 0; i < students; i++) months[i % 12]++;
    const least = Math.max(...months);
    for (let m = 1; m < least; m++) assert.ok(12 * m < students, `${m} per month would not hold everybody`);
    for (const o of step.options) {
      const atLeast = /Some month holds at least (\d+)/.exec(o.text);
      const noMore = /No month holds more than (\d+)/.exec(o.text);
      let certain;
      if (atLeast) certain = Number(atLeast[1]) <= least;                 // even the most even spread has a month this full
      else if (noMore) certain = students <= Number(noMore[1]);            // false as soon as everybody shares one month
      else { assert.match(o.text, /Every month holds at least one/); certain = false; } // everybody could share one month
      assert.equal(certain, !!o.correct, o.text);
      if (!o.correct) assert.ok(o.why, 'explains itself');
    }
    assert.ok(correctOption(step).text.includes(`at least ${least} `));
    assert.ok(step.explain.includes(`at most ${12 * (least - 1)} students`) && step.explain.includes(`there are ${students}`));
  });
});

test('pigeonhole: the interactive steps and the facts behind them', () => {
  // six pigeons, five holes: every way of placing them puts two in one hole
  const hook = fixed('pigeonhole', 'hook');
  const { boxes, pigeons } = hook.widget;
  assert.ok(pigeons > boxes);
  let ways = 0;
  const place = (counts, left) => {
    if (left === 0) { ways++; assert.ok(Math.max(...counts) >= 2); }
    const waiting = left;
    const said = hook.check({ counts, placed: pigeons - left, waiting, max: Math.max(...counts), allPlaced: left === 0 });
    assert.equal(said === true, left === 0);
    if (left === 0) return;
    for (let b = 0; b < boxes; b++) { const next = counts.slice(); next[b]++; place(next, left - 1); }
  };
  place(new Array(boxes).fill(0), pigeons);
  assert.equal(ways, boxes ** pigeons);
  assert.equal(hook.solution.counts.reduce((t, c) => t + c, 0), pigeons);

  // hairs
  const hairs = fixed('pigeonhole', 'hairs');
  assert.deepEqual(hairs.blanks.map((_, i) => blankValue(hairs, i)), ['people', 'possible numbers of hairs', '1,000,000', 'certainly']);
  assert.equal(999999 - 0 + 1, 1000000);
  assert.ok(2000000 > 1000000);

  // remainders: any six numbers of the pool share a remainder; five can all differ
  const rem = fixed('pigeonhole', 'remainders-try');
  const pool = rem.widget.pool;
  assert.equal(new Set(pool).size, pool.length);
  const sizeK = (k, from = 0, chosen = [], out = []) => { if (chosen.length === k) { out.push(chosen.slice()); return out; } for (let i = from; i < pool.length; i++) { chosen.push(pool[i]); sizeK(k, i + 1, chosen, out); chosen.pop(); } return out; };
  for (const six of sizeK(6)) assert.ok(new Set(six.map((v) => v % 5)).size < 6);
  assert.ok(sizeK(5).some((five) => new Set(five.map((v) => v % 5)).size === 5));
  for (const v of pool) assert.equal(rem.widget.boxOf(v), v % 5);
  for (let k = 0; k <= 6; k++) {
    const said = rem.check({ placed: k, waiting: 6 - k, allPlaced: k === 6 });
    assert.equal(said === true, k === 6);
    if (k === 5) assert.match(said, /1 more number\./);
    if (k === 2) assert.match(said, /4 more numbers\./);
  }
  assert.equal(rem.solution.chosen.length, 6);
  assert.ok(rem.solution.chosen.every((v) => pool.includes(v)));
  // two numbers with the same remainder differ by a multiple of n
  for (let n = 2; n <= 9; n++) for (let a = 0; a < 60; a++) for (let b = a; b < 60; b++) if (a % n === b % n) assert.equal((b - a) % n, 0);

  // five points in the unit square
  const field = fixed('pigeonhole', 'points-square');
  const half = Math.SQRT2 / 2;
  const closest = (pts) => { let d = Infinity; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) d = Math.min(d, Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)); return d; };
  const asState = (pts) => Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map((id, i) => [id, pts[i]]));
  const rng = makeRng(42);
  for (let trial = 0; trial < 20000; trial++) {
    const pts = Array.from({ length: 5 }, () => ({ x: rng.int(0, 20) / 20, y: rng.int(0, 20) / 20 }));
    const d = closest(pts);
    assert.ok(d <= half + 1e-12, 'two of any five points are within √2/2');
    // … because two of them share a quarter (points on a dividing line may go either way)
    const quarter = (p) => (p.y < 0.5 ? 0 : 2) + (p.x < 0.5 ? 0 : 1);
    assert.ok(new Set(pts.map(quarter)).size < 5);
    const said = field.check(asState(pts));
    assert.equal(said === true, d >= 0.7);
    if (said !== true) assert.ok(said.includes(`${d.toFixed(2)} km`));
  }
  assert.equal(field.check(field.solution), true);
  assert.ok(Math.abs(closest(Object.values(field.solution)) - half) < 1e-12);
  assert.ok(Math.abs(Math.hypot(0.5, 0.5) - half) < 1e-12, 'the diagonal of a small square');
  assert.match(correctOption(fixed('pigeonhole', 'points-holes')).text, /0\.71/);
  for (const [id, def] of Object.entries(field.widget.points)) if (def.drag) { assert.deepEqual(def.constrain({ x: 1.3, y: -0.2 }), { x: 1, y: 0 }, id); }
  assert.equal(field.widget.readouts[0].value({ P: field.solution }).toFixed(3), half.toFixed(3));

  // friends: in every friendship pattern on five people (and on 2, 3, 4), two have the same number of friends
  for (let people = 2; people <= 5; people++) {
    const pairs = [];
    for (let i = 0; i < people; i++) for (let j = i + 1; j < people; j++) pairs.push([i, j]);
    for (let mask = 0; mask < 1 << pairs.length; mask++) {
      const friends = new Array(people).fill(0);
      pairs.forEach(([i, j], k) => { if (mask & (1 << k)) { friends[i]++; friends[j]++; } });
      assert.ok(new Set(friends).size < people, `${people} people, pattern ${mask}`);
      assert.ok(!(friends.includes(0) && friends.includes(people - 1)), 'nobody has no friends while somebody has everyone');
    }
  }
  const party = fixed('pigeonhole', 'friends');
  assert.deepEqual(party.blanks.map((_, i) => blankValue(party, i)), [0, 4, 2]);
  // the matching step
  const holes = fixed('pigeonhole', 'pick-holes');
  assert.ok(13 > 12 && 8 > 7 && 5 > 4 && 2000000 > 1000000);
  assert.equal(holes.pairs.length, 4);
  assert.match(holes.pairs[0][1], /12 months/);
  assert.match(holes.pairs[1][1], /7 possible remainders/);
});

/* ============================================================ lesson 5 */

/** Size of the largest set of dominoes on a board, by augmenting paths (dark squares on one side, light on the other). */
function maxDominoes(rows, cols, removed) {
  const gone = new Set(removed);
  const dark = [];
  for (let i = 0; i < rows * cols; i++) if (!gone.has(i) && (Math.floor(i / cols) + (i % cols)) % 2 === 1) dark.push(i);
  const partner = new Map();
  const neighbours = (i) => { const r = Math.floor(i / cols); const c = i % cols; return [c > 0 ? i - 1 : -1, c < cols - 1 ? i + 1 : -1, r > 0 ? i - cols : -1, r < rows - 1 ? i + cols : -1].filter((j) => j >= 0 && !gone.has(j)); };
  const tryMatch = (i, seen) => {
    for (const j of neighbours(i)) {
      if (seen.has(j)) continue;
      seen.add(j);
      if (!partner.has(j) || tryMatch(partner.get(j), seen)) { partner.set(j, i); return true; }
    }
    return false;
  };
  let size = 0;
  for (const i of dark) if (tryMatch(i, new Set())) size++;
  return size;
}

test('invariants: the cut chessboard', () => {
  assert.equal(maxDominoes(8, 8, []), 32);
  assert.equal(maxDominoes(8, 8, [0, 63]), 30, 'with two opposite corners gone, 31 dominoes never fit');
  const colours = fixed('invariants', 'count-colours');
  const squares = Array.from({ length: 64 }, (_, i) => i).filter((i) => i !== 0 && i !== 63);
  const dark = squares.filter((i) => (Math.floor(i / 8) + (i % 8)) % 2 === 1).length;
  assert.deepEqual(colours.blanks.map((_, i) => blankValue(colours, i)), [dark, squares.length - dark, 31, 31, 'impossible']);
  assert.equal((0 + 0) % 2, (7 + 7) % 2, 'opposite corners have the same colour');
  // every domino covers one square of each colour
  for (const [a, b] of placements(8, 8, [], 'domino')) assert.notEqual((Math.floor(a / 8) + (a % 8)) % 2, (Math.floor(b / 8) + (b % 8)) % 2);
  // remove one dark and one light square, anywhere, and the rest can always be covered
  for (let a = 0; a < 64; a++) for (let b = a + 1; b < 64; b++) {
    const mixed = (Math.floor(a / 8) + (a % 8)) % 2 !== (Math.floor(b / 8) + (b % 8)) % 2;
    assert.equal(maxDominoes(8, 8, [a, b]) === 31, mixed, `squares ${a} and ${b}`);
  }
  const hook = fixed('invariants', 'hook');
  assert.deepEqual(hook.figures[0].removed, [0, 63]);
  assert.match(correctOption(hook).text, /^No/);

  // the small board: never complete, at best six dominoes, and the check accepts exactly the dead ends
  const small = fixed('invariants', 'try-small');
  const { rows, cols, removed } = small.widget;
  let most = 0;
  let leastOpen = Infinity;
  for (const pieces of packings(rows, cols, removed, 'domino')) {
    const st = boardState(rows, cols, removed, pieces, 'domino');
    assert.ok(!st.complete, 'no arrangement covers the board');
    assert.equal(st.openDark - st.openLight, 2, 'the invariant: two more dark squares open than light ones');
    const said = small.check(st);
    assert.equal(said === true, st.stuck, JSON.stringify(pieces));
    if (said !== true) assert.ok(said.includes(`${st.open} squares are open`));
    if (st.stuck) { most = Math.max(most, pieces.length); leastOpen = Math.min(leastOpen, st.open); }
  }
  assert.equal(most, 6);
  assert.equal(leastOpen, 2);
  assert.equal(maxDominoes(rows, cols, removed), 6);
  const end = boardState(rows, cols, removed, small.solution.pieces, 'domino');
  assert.ok(end.stuck && end.open === 2 && small.check(end) === true);
  assert.deepEqual(fixed('invariants', 'colour-it').figures[0].removed, removed);
  assert.match(correctOption(fixed('invariants', 'colour-it')).text, /one dark square and one light square/);

  // one corner of each colour removed: the check accepts exactly the complete tilings, and there are some
  const fix = fixed('invariants', 'fix-it');
  const gone = fix.widget.removed;
  assert.notEqual((Math.floor(gone[0] / 4) + (gone[0] % 4)) % 2, (Math.floor(gone[1] / 4) + (gone[1] % 4)) % 2, 'one light and one dark corner');
  let tilings = 0;
  for (const pieces of packings(4, 4, gone, 'domino')) {
    const st = boardState(4, 4, gone, pieces, 'domino');
    assert.equal(st.openDark, st.openLight);
    const said = fix.check(st);
    assert.equal(said === true, st.complete);
    if (st.complete) tilings++;
    else if (/No domino fits/.test(said)) assert.ok(st.stuck);
    else assert.ok(!st.stuck && said.includes(`${st.open} squares`));
  }
  assert.ok(tilings >= 1);
  const done = boardState(4, 4, gone, fix.solution.pieces, 'domino');
  assert.ok(done.complete && fix.solution.pieces.every((p) => isPiece(p, 4, 'domino')));
});

/** Every row of coins that can be reached by turning over exactly two coins at a time, with the fewest moves needed. */
function reachable(start) {
  const dist = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length) {
    const row = queue.shift();
    for (let i = 0; i < row.length; i++) for (let j = i + 1; j < row.length; j++) {
      const next = row.split('').map((c, k) => (k === i || k === j ? (c === 'H' ? 'T' : 'H') : c)).join('');
      if (!dist.has(next)) { dist.set(next, dist.get(row) + 1); queue.push(next); }
    }
  }
  return dist;
}

test('invariants: turning over two coins at a time', () => {
  const tryIt = fixed('invariants', 'coins-try');
  const start = tryIt.widget.coins;
  const from = reachable(start);
  const goal = 'H'.repeat(start.length);
  assert.ok(!from.has(goal), 'five heads cannot be reached');
  for (const row of from.keys()) assert.equal(row.split('T').length % 2, 0, 'the number of tails stays odd');
  for (let moves = 0; moves <= 8; moves++) {
    const said = tryIt.check({ coins: start, moves, allHeads: false });
    assert.equal(said === true, moves >= 6);
    if (moves === 1) assert.match(said, /^1 move so far/);
  }
  assert.ok(from.has(tryIt.solution.coins), 'the solution shows a row that can really be reached');
  assert.equal(from.get(tryIt.solution.coins) % 2, tryIt.solution.moves % 2 === 0 ? from.get(tryIt.solution.coins) % 2 : -1, 'and in that many moves');
  const why = fixed('invariants', 'coins-why');
  assert.deepEqual(why.blanks.map((_, i) => blankValue(why, i)), [2, 2, 0, 'odd', 'even', 'impossible']);

  let yes = 0;
  let no = 0;
  eachVariant('invariants', 'coins-can', (step) => {
    const row = /\*\*([HT ]+)\*\*/.exec(step.text)[1].replace(/ /g, '');
    const dist = reachable(row);
    const possible = dist.has('H'.repeat(row.length));
    const tails = row.split('T').length - 1;
    const right = correctOption(step);
    assert.equal(right.text === 'Yes', possible, row);
    if (possible) { yes++; assert.equal(dist.get('H'.repeat(row.length)), tails / 2, 'the number of moves quoted'); assert.ok(step.explain.includes(`after ${tails / 2} move`)); } else { no++; assert.match(right.text, /odd, and it stays odd/); }
    for (const text of [step.explain, ...step.options.map((o) => o.why || '')]) for (const m of text.matchAll(/(\d+) tails?\b/g)) if (!/0 tails/.test(m[0])) assert.equal(Number(m[1]), tails, `"${text}" quotes the number of tails`);
    assert.equal(step.options.length, 3);
  });
  assert.ok(yes > 60 && no > 60, 'both answers occur');
});

/** Every number that can be the last one on the board, by exhaustive search. */
const lastNumbers = new Map();
function finals(n) {
  if (lastNumbers.has(n)) return lastNumbers.get(n);
  const out = new Set();
  const seen = new Set();
  const go = (board) => {
    const key = board.join();
    if (seen.has(key)) return;
    seen.add(key);
    if (board.length === 1) { out.add(board[0]); return; }
    for (let i = 0; i < board.length; i++) for (let j = i + 1; j < board.length; j++) {
      if (j > i + 1 && board[j] === board[j - 1]) continue; // the same pair of values again
      const rest = board.filter((_, k) => k !== i && k !== j);
      rest.push(Math.abs(board[i] - board[j]));
      go(rest.sort((a, b) => a - b));
    }
  };
  go(Array.from({ length: n }, (_, i) => i + 1));
  lastNumbers.set(n, out);
  return out;
}

test('invariants: the last number on the board', () => {
  eachVariant('invariants', 'erase-game', (step) => {
    const n = Number(/1, 2, 3, \\ldots, (\d+)\$/.exec(step.text)[1]);
    assert.equal(Number(/After (\d+) moves/.exec(step.text)[1]), n - 1);
    const possible = Array.from(finals(n));
    assert.ok(possible.length >= 1);
    const allOdd = possible.every((v) => v % 2 === 1);
    const allEven = possible.every((v) => v % 2 === 0);
    assert.ok(allOdd || allEven, `n = ${n}: the last number always has the same parity`);
    assert.equal(correctOption(step).text, allOdd ? 'It is certainly odd' : 'It is certainly even');
    let total = 0;
    for (let k = 1; k <= n; k++) total += k;
    assert.ok(step.explain.includes(`= ${total}$, which is ${allOdd ? 'odd' : 'even'}`));
    for (const o of step.options) if (!o.correct) { assert.ok(o.why); if (/at the start is/.test(o.why)) assert.ok(o.why.includes(`is ${total}, which is ${allOdd ? 'odd' : 'even'}`)); }
  });
});

test('invariants: the knight', () => {
  const jumps = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const next = (i) => jumps.map(([dr, dc]) => [Math.floor(i / 5) + dr, (i % 5) + dc]).filter(([r, c]) => r >= 0 && r < 5 && c >= 0 && c < 5).map(([r, c]) => r * 5 + c);
  const colour = (i) => (Math.floor(i / 5) + (i % 5)) % 2;
  for (let i = 0; i < 25; i++) for (const j of next(i)) assert.notEqual(colour(i), colour(j), 'every jump changes colour');
  // a route through all 25 squares exists (found by search) …
  const seen = new Array(25).fill(false);
  let closed = false;
  let open = false;
  const walk = (i, depth, start) => {
    if (depth === 25) { open = true; if (next(i).includes(start)) closed = true; return; }
    for (const j of next(i)) { if (seen[j]) continue; seen[j] = true; walk(j, depth + 1, start); seen[j] = false; if (closed) return; }
  };
  for (const start of [0, 12]) { seen[start] = true; walk(start, 1, start); seen[start] = false; }
  assert.ok(open, 'the knight can visit all 25 squares');
  // … but none of them ends a knight's jump away from its start (every route from the corner and from the centre was tried)
  assert.ok(!closed, 'no route returns to its starting square');
  assert.match(correctOption(fixed('invariants', 'knight')).text, /^No: after 25 jumps/);
  // the claims of the matching step are true, and each tool named fits its claim
  const tools = fixed('invariants', 'choose-tool');
  assert.deepEqual(tools.pairs.map((pair) => /^(\w+):/.exec(pair[1])[1]), ['Contradiction', 'Induction', 'Pigeonhole', 'Invariant', 'Counterexample']);
  for (let n = 0; n <= 40; n++) { let sum = 0; for (let k = 0; k <= n; k++) sum += 2 ** k; assert.equal(sum, 2 ** (n + 1) - 1); }
  assert.ok(400 > 366, 'more people than dates, 29 February included');
  assert.ok(!reachable('TTTTTTT').has('HHHHHHH'), 'seven tails cannot all be turned two at a time');
  assert.ok(isPrime(2) && 2 % 2 === 0, '2 is an even prime');
  for (let even = 0; even <= 1000; even += 2) assert.equal((even + 2) % 2, 0, 'after every even number comes a larger one');
  const sort = fixed('invariants', 'sort-proofs');
  assert.deepEqual(sort.items.map((it) => it.bucket), [0, 1, 0, 1, 0, 1]);
});

/* ============================================================ lesson 6 */

/** Hilbert's hotel on its first few thousand rooms: who is where after an instruction. */
function hotel(rule, k, arrivals) {
  const ROOMS = 4000;
  const room = new Map(); // room -> guest
  for (let n = 1; n <= ROOMS; n++) {
    const to = rule === 'plus' ? n + k : rule === 'double' ? 2 * n : n;
    assert.ok(!room.has(to), 'no two guests are sent to the same room');
    room.set(to, n);
  }
  const free = [];
  for (let n = 1; n <= ROOMS; n++) if (!room.has(n)) free.push(n);
  const endless = free.length > 100;                       // the free rooms go on and on
  const wanted = arrivals === 'bus' ? Infinity : arrivals;
  const housed = endless ? wanted : Math.min(free.length, wanted);
  return { rule, k, free, freed: endless ? 'infinite' : free.length, allHoused: housed === wanted, waiting: housed === wanted ? 0 : arrivals === 'bus' ? 'infinite' : wanted - housed, housed: housed === wanted ? 'all' : housed };
}

test('infinity: the hotel', () => {
  const one = fixed('infinity', 'hotel-one');
  const bus = fixed('infinity', 'hotel-bus');
  const states = [[null, 1], ...[1, 2, 3, 4, 5].map((k) => ['plus', k]), ['double', 1]];
  for (const [rule, k] of states) {
    const a = hotel(rule, k, 1);
    assert.equal(one.check(a) === true, a.allHoused, `one guest, ${rule} ${k}`);
    assert.equal(a.allHoused, rule !== null);
    const b = hotel(rule, k, 'bus');
    const said = bus.check(b);
    assert.equal(said === true, b.allHoused, `the bus, ${rule} ${k}`);
    assert.equal(b.allHoused, rule === 'double');
    if (rule === 'plus') {
      assert.deepEqual(b.free, Array.from({ length: k }, (_, i) => i + 1), 'moving up k rooms frees rooms 1 to k');
      assert.ok(said.includes(`frees only ${k} room${k === 1 ? '' : 's'}`), said);
    }
    if (rule === 'double') assert.ok(b.free.every((n) => n % 2 === 1) && b.free.length === 2000, 'doubling frees exactly the odd rooms');
  }
  assert.equal(one.check(hotel(one.solution.rule, one.solution.k, 1)), true);
  assert.equal(bus.check(hotel(bus.solution.rule, 1, 'bus')), true);
  for (let m = 1; m <= 500; m++) assert.equal((2 * m - 1) % 2, 1, 'new guest m takes the odd room 2m - 1');
  // the pairing step
  const pair = fixed('infinity', 'pairing');
  assert.deepEqual(pair.blanks.map((_, i) => blankValue(pair, i)), [2 * 50, 42 / 2, 'no', 'no']);
});

test('infinity: where a whole number sits in the list 0, 1, -1, 2, -2, …', () => {
  const list = [0];
  for (let m = 1; m <= 60; m++) list.push(m, -m);
  eachVariant('infinity', 'list-integers', (step) => {
    const k = Number(/At which position is \$(-?\d+)\$/.exec(step.text)[1]);
    assert.equal(step.answer, list.indexOf(k) + 1);
    assert.equal(integerPosition(k), list.indexOf(k) + 1);
    for (const [value, message] of step.wrong) {
      assert.notEqual(value, step.answer);
      const of = /position of \$?(-?\d+)\$?/.exec(message);
      if (of) assert.equal(value, list.indexOf(Number(of[1])) + 1, message);
    }
    const said = ints(step.explain.replace(/\$\\pm \d\$/g, ''));
    assert.equal(said[said.length - 1], step.answer, 'the explanation ends at the same position');
  });
  assert.deepEqual(list.slice(0, 7), [0, 1, -1, 2, -2, 3, -3]);
});

/** The list of positive fractions, built again from its description. */
function sweep(count, skipRepeats = true) {
  const out = [];
  const values = new Set();
  for (let sum = 2; out.length < count; sum++) for (let top = 1; top < sum && out.length < count; top++) {
    const value = top / (sum - top);
    const repeat = Array.from(values).some((v) => Math.abs(v - value) < 1e-12);
    if (repeat && skipRepeats) continue;
    values.add(value);
    out.push(`${top}/${sum - top}`);
  }
  return out;
}

test('infinity: the list of fractions', () => {
  const list = sweep(60);
  assert.deepEqual(fractionList(60).map(([t, b]) => `${t}/${b}`), list, 'the helper builds the same list');
  assert.deepEqual(list.slice(0, 11), ['1/1', '1/2', '2/1', '1/3', '3/1', '1/4', '2/3', '3/2', '4/1', '1/5', '5/1']);
  for (const f of list) { const [t, b] = f.split('/').map(Number); assert.equal(gcd(t, b), 1, `${f} is in lowest terms`); }
  const next = fixed('infinity', 'fractions');
  assert.equal(correctOption(next).text, '$\\frac{1}{5}$');
  assert.equal(list[9], '1/5');
  assert.ok(next.explain.includes(`is number ${list.indexOf('3/7') + 1}.`), 'the position quoted for 3/7');
  const everything = sweep(60, false);
  eachVariant('infinity', 'fraction-position', (step) => {
    const m = /At which position is \$\\frac\{(\d+)\}\{(\d+)\}\$/.exec(step.text);
    const f = `${m[1]}/${m[2]}`;
    assert.equal(step.answer, list.indexOf(f) + 1, f);
    for (const [value, message] of step.wrong) { assert.notEqual(value, step.answer); assert.equal(value, everything.indexOf(f) + 1, 'the position if nothing were skipped'); assert.match(message, /skipped/); }
    const sum = Number(m[1]) + Number(m[2]);
    const before = list.findIndex((g) => g.split('/').map(Number).reduce((a, b) => a + b) === sum);
    assert.ok(step.hints[0].includes(`top + bottom = ${sum}`));
    assert.ok(step.hints[1].startsWith(`${before} fractions come before`));
    assert.ok(step.explain.startsWith(`${before} fractions lie on the earlier diagonals`) && step.explain.includes(`at position ${step.answer}.`));
    const quoted = Array.from(step.explain.matchAll(/\\tfrac\{(\d+)\}\{(\d+)\}/g), (g) => `${g[1]}/${g[2]}`);
    assert.deepEqual(quoted, list.filter((g) => g.split('/').map(Number).reduce((a, b) => a + b) === sum), 'the diagonal quoted');
  });
});

test('infinity: the diagonal', () => {
  const build = fixed('infinity', 'diagonal-build');
  const rows = build.widget.rows;
  const n = rows.length;
  assert.ok(rows.every((r) => r.length >= n));
  const diagonal = rows.map((r, i) => Number(r[i]));
  const digitsAllowed = [1, 2, 3, 4, 5, 6, 7, 8];
  const stateOf = (digits) => {
    const clashes = [];
    digits.forEach((d, j) => { if (d != null && d === diagonal[j]) clashes.push(j + 1); });
    const filled = digits.filter((d) => d != null).length;
    return { rows, diagonal, digits, filled, clashes, escaped: filled === n && clashes.length === 0 };
  };
  let accepted = 0;
  const digits = new Array(n).fill(1);
  const all = (j) => {
    if (j === n) {
      const said = build.check(stateOf(digits.slice()));
      const differsEverywhere = rows.every((r, i) => r[i] !== String(digits[i]));
      assert.equal(said === true, differsEverywhere, digits.join(''));
      if (said === true) { accepted++; for (const r of rows) assert.notEqual(r.slice(0, n), digits.join(''), 'the new number is not one of the entries'); } else {
        const first = digits.findIndex((d, i) => d === diagonal[i]) + 1;
        assert.ok(said.includes(`Your digit ${first} is ${diagonal[first - 1]}`) && said.includes(`entry ${first}`), said);
      }
      return;
    }
    for (const d of digitsAllowed) { digits[j] = d; all(j + 1); }
  };
  all(0);
  assert.equal(accepted, 7 ** n, 'seven choices for each digit');
  assert.match(build.check(stateOf([1, null, null, 3, null, null])), /4 to go/);
  const way = dodge(diagonal);
  assert.ok(way.every((d, j) => d !== diagonal[j] && d >= 1 && d <= 8), 'the solution dodges every marked digit');
  assert.equal(build.check(stateOf(way)), true);
  assert.equal(build.solution.escape, true);
  assert.ok(build.hints[1].includes(`The marked digits are ${diagonal.join(', ')}.`), 'the hint quotes the marked digits');
  const example = ints(/for example ([\d, ]+)\./.exec(build.hints[1])[1]);
  assert.equal(build.check(stateOf(example)), true, 'the example in the hint works');
  // a number written with the digits 1 to 8 only lies strictly between 0 and 1
  assert.ok(0.111111 > 0 && 0.888889 < 1);
  // the argument, in order
  const order = fixed('infinity', 'cantor-order');
  assert.match(order.items[0], /^Suppose/);
  assert.match(order.items[order.items.length - 1], /no such list exists/);
  assert.match(order.explain, /1874/);
  assert.match(order.explain, /1891/);

  eachVariant('infinity', 'diagonal-pick', (step) => {
    const lines = step.text.split('\n').filter((l) => /^\| (1st|2nd|3rd|4th) \|/.test(l));
    assert.equal(lines.length, 4);
    const marked = [];
    const entries = lines.map((line, i) => {
      const cell = /\| 0\.([\d*]+)… \|$/.exec(line)[1];
      const bold = /\*\*(\d)\*\*/.exec(cell);
      assert.equal(cell.indexOf('**'), i, `in entry ${i + 1} the marked digit is digit ${i + 1}`);
      marked.push(Number(bold[1]));
      return cell.replace(/\*/g, '');
    });
    entries.forEach((e, i) => { assert.equal(e.length, 4); assert.equal(Number(e[i]), marked[i]); });
    for (const o of step.options) {
      const d = /^0\.(\d{4})…$/.exec(o.text)[1].split('').map(Number);
      const escapes = d.every((v, i) => v !== marked[i]);
      assert.equal(escapes, !!o.correct, `${o.text} against the marked digits ${marked}`);
      assert.ok(d.every((v) => v >= 1 && v <= 8), 'only the digits 1 to 8');
      if (o.correct) { for (const e of entries) assert.notEqual(e, d.join('')); continue; }
      const at = d.findIndex((v, i) => v === marked[i]);
      const word = ['1st', '2nd', '3rd', '4th'][at];
      assert.ok(o.why.includes(`Its ${word} digit is ${marked[at]}`) && o.why.includes(`${word} entry`), o.why);
      assert.equal(d.filter((v, i) => v === marked[i]).length, 1, 'it clashes in exactly one place');
    }
    assert.ok(step.explain.includes(`The marked digits are ${marked.join(', ')}.`));
    assert.ok(step.explain.includes(correctOption(step).text));
  });
  const sizes = fixed('infinity', 'sizes');
  assert.deepEqual(sizes.items.map((it) => it.bucket), [0, 0, 0, 0, 1, 1]);
});

/* ============================================================ added in review */

test('review: the regions the learner taps cover the circle exactly once, and none is too small to tap', () => {
  const R = 186;
  const polygonOf = (d) => (/[Aa]/.test(d) ? null : d.slice(1, -1).split('L').map((pair) => { const [x, y] = pair.trim().split(/\s+/).map(Number); return { x, y }; }));
  const areaOf = (poly) => Math.abs(poly.reduce((t, p, i) => { const q = poly[(i + 1) % poly.length]; return t + p.x * q.y - q.x * p.y; }, 0)) / 2;
  const inside = (poly, p) => { let sign = 0; for (let i = 0; i < poly.length; i++) { const a = poly[i]; const b = poly[(i + 1) % poly.length]; const c = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x); if (Math.abs(c) < 1e-9) return false; if (sign === 0) sign = Math.sign(c); else if (Math.sign(c) !== sign) return false; } return true; };
  for (const regular of [false, true]) for (let n = 3; n <= 7; n++) {
    const pts = layoutPoints(n, regular);
    const regions = regionsOf(pts);
    const polygons = regions.map((reg) => polygonOf(reg.d));
    // the straight-sided regions, plus one circular segment per side of the polygon of points, make up the whole disc
    let total = 0;
    for (const poly of polygons) if (poly) total += areaOf(poly);
    for (let i = 0; i < n; i++) { let span = pts[(i + 1) % n].t - pts[i].t; if (span <= 0) span += 2 * Math.PI; total += ((R * R) / 2) * (span - Math.sin(span)); }
    assert.ok(Math.abs(total - Math.PI * R * R) < 40, `${n} points${regular ? ' (evenly spaced)' : ''}: the regions add up to the disc (off by ${(total - Math.PI * R * R).toFixed(1)})`);
    assert.equal(polygons.filter((p) => !p).length, n, 'one curved region per side');
    // the number of a counted region is written inside that region and inside no other
    regions.forEach((reg, k) => {
      if (!polygons[k]) return;
      const holders = polygons.filter((poly) => poly && inside(poly, { x: reg.cx, y: reg.cy }));
      assert.ok(holders.length === 1 && holders[0] === polygons[k], `${n} points: label of region ${k}`);
    });
    // no region is a sliver: the circle that fits inside the smallest straight-sided region has a radius of 9 or more (the drawing is 420 wide)
    for (const poly of polygons) if (poly) {
      const around = poly.reduce((t, p, i) => t + Math.hypot(p.x - poly[(i + 1) % poly.length].x, p.y - poly[(i + 1) % poly.length].y), 0);
      assert.ok((2 * areaOf(poly)) / around > 9, `${n} points: a region is too small to tap (area ${areaOf(poly).toFixed(0)})`);
    }
  }
  const told = fixed('evidence-is-not-proof', 'count-six');
  assert.match(told.text, /all 15 lines/);
  assert.equal(choose(6, 2), 15);
  assert.ok(told.explain.includes(`7 points give ${1 + choose(7, 2) + choose(7, 4)} regions and 8 give ${1 + choose(8, 2) + choose(8, 4)}`));
});

/**
 * The famous number itself. A segmented sieve of the Liouville function λ(n) = (−1)^(number of prime factors),
 * written for this file. It takes about half a minute, so it only runs on request:
 *   PROOFS_FULL=1 node --test tests/proofs-course.test.mjs
 * (It was run during the review of the course, and gave 906,150,257.)
 */
test('review: Pólya\'s claim first fails at N = 906,150,257 (full sieve, set PROOFS_FULL=1)', { skip: !process.env.PROOFS_FULL }, () => {
  const LIMIT = 906_200_000;
  const SEG = 1 << 22;
  const root = Math.floor(Math.sqrt(LIMIT)) + 1;
  const small = [];
  const composite = new Uint8Array(root + 1);
  for (let p = 2; p <= root; p++) { if (composite[p]) continue; small.push(p); for (let m = p * p; m <= root; m += p) composite[m] = 1; }
  const lam = new Int8Array(SEG);
  const prod = new Float64Array(SEG);
  let odd = 0; // how many of 1 … n have an odd number of prime factors
  let first = null;
  for (let lo = 1; lo <= LIMIT && first === null; lo += SEG) {
    const hi = Math.min(LIMIT, lo + SEG - 1);
    const len = hi - lo + 1;
    lam.fill(1, 0, len);
    prod.fill(1, 0, len);
    for (const p of small) {
      if (p * p > hi) break;
      for (let q = p; q <= hi; q *= p) for (let i = Math.ceil(lo / q) * q - lo; i < len; i += q) { lam[i] = -lam[i]; prod[i] *= p; }
    }
    for (let i = 0; i < len; i++) {
      const n = lo + i;
      const sign = prod[i] === n ? lam[i] : -lam[i]; // one prime factor above √n may be left over
      if (sign === -1) odd++;
      if (n > 1 && 2 * odd < n) { first = n; break; }
    }
  }
  assert.equal(first, 906150257);
  assert.match(fixed('evidence-is-not-proof', 'polya').explain, /906,150,257/);
});

test('review: the pieces of the board widget, against a definition written here', () => {
  // a domino is two squares that share a side; an L is three different squares that all touch each other (sides or corners)
  const king = (a, b, cols) => Math.max(Math.abs(Math.floor(a / cols) - Math.floor(b / cols)), Math.abs((a % cols) - (b % cols)));
  for (const cols of [4, 5]) {
    const cells = 4 * cols;
    for (let a = 0; a < cells; a++) for (let b = 0; b < cells; b++) {
      const sideBySide = Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) + Math.abs((a % cols) - (b % cols)) === 1;
      assert.equal(isPiece([a, b], cols, 'domino'), sideBySide, `domino ${a},${b} on ${cols} columns`);
      assert.equal(isPiece([a, b], cols, 'tromino'), false, 'two squares are no tromino');
      for (let c = 0; c < cells; c++) {
        const anL = new Set([a, b, c]).size === 3 && king(a, b, cols) === 1 && king(a, c, cols) === 1 && king(b, c, cols) === 1;
        assert.equal(isPiece([a, b, c], cols, 'tromino'), anL, `tromino ${a},${b},${c} on ${cols} columns`);
        assert.equal(isPiece([a, b, c], cols, 'domino'), false, 'three squares are no domino');
      }
    }
  }
  // "stuck" for dominoes: the widget's test against a search for two open neighbours, on every arrangement of the small board
  const small = fixed('invariants', 'try-small');
  const { rows, cols, removed } = small.widget;
  for (const pieces of packings(rows, cols, removed, 'domino')) {
    const covered = new Set(pieces.flat());
    const open = Array.from({ length: rows * cols }, (_, i) => i).filter((i) => !removed.includes(i) && !covered.has(i));
    const room = open.some((i) => open.some((j) => j > i && ((j === i + 1 && j % cols !== 0) || j === i + cols)));
    assert.equal(hasRoom(new Set(open), rows, cols, 'domino'), room, JSON.stringify(pieces));
  }
});

test('review: the 4 × 4 tromino board has exactly one tiling, and the hints lead to it', () => {
  const tryIt = fixed('induction', 'tromino-try');
  const { rows, cols, removed } = tryIt.widget;
  const tilings = [];
  for (const pieces of packings(rows, cols, removed, 'tromino')) if (pieces.length * 3 === rows * cols - removed.length) tilings.push(pieces.map((p) => p.slice().sort((a, b) => a - b).join()).sort());
  assert.equal(tilings.length, 1, 'one tiling only');
  assert.deepEqual(tryIt.solution.pieces.map((p) => p.slice().sort((a, b) => a - b).join()).sort(), tilings[0], 'and it is the solution shown');
  // hint 1: the L that wraps round the missing square (the rest of its 2 × 2 quarter); hint 2: an L in the very centre
  const hole = removed[0];
  const quarter = (i) => (Math.floor(i / cols) < rows / 2 ? 0 : 2) + (i % cols < cols / 2 ? 0 : 1);
  const round = Array.from({ length: rows * cols }, (_, i) => i).filter((i) => i !== hole && quarter(i) === quarter(hole));
  const centre = [5, 6, 9, 10].filter((i) => i !== hole);
  assert.ok([5, 6, 9, 10].includes(hole), 'the missing square is one of the four centre squares, so the centre L is forced');
  assert.ok(tilings[0].includes(round.join()) && tilings[0].includes(centre.join()));
  // every 4 × 4 board with one square removed can be tiled, wherever the hole is (the supposition of the next step)
  for (let gone = 0; gone < 16; gone++) {
    let found = 0;
    for (const pieces of packings(4, 4, [gone], 'tromino')) if (pieces.length === 5) found++;
    assert.ok(found >= 1, `hole ${gone}`);
  }
});

test('review: the coins shown as the solution can be reached in exactly that many moves', () => {
  const tryIt = fixed('invariants', 'coins-try');
  let rowsNow = new Set([tryIt.widget.coins]);
  for (let move = 1; move <= tryIt.solution.moves; move++) {
    const next = new Set();
    for (const row of rowsNow) for (let i = 0; i < row.length; i++) for (let j = i + 1; j < row.length; j++) next.add(row.split('').map((c, k) => (k === i || k === j ? (c === 'H' ? 'T' : 'H') : c)).join(''));
    rowsNow = next;
    assert.ok(!rowsNow.has('H'.repeat(tryIt.widget.coins.length)), `no five heads after ${move} moves`);
  }
  assert.ok(rowsNow.has(tryIt.solution.coins));
  assert.equal(tryIt.check({ coins: tryIt.solution.coins, moves: tryIt.solution.moves, allHeads: false }), true);
});

test('review: no closed knight\'s tour on the 5 × 5 board from any square; open tours exist', () => {
  const jumps = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
  const next = Array.from({ length: 25 }, (_, i) => jumps.map(([dr, dc]) => [Math.floor(i / 5) + dr, (i % 5) + dc]).filter(([r, c]) => r >= 0 && r < 5 && c >= 0 && c < 5).map(([r, c]) => r * 5 + c));
  const seen = new Array(25).fill(false);
  let open = 0;
  let closed = 0;
  const starts = new Set();
  const walk = (i, depth, start) => {
    if (depth === 25) { open++; starts.add(start); if (next[i].includes(start)) closed++; return; }
    for (const j of next[i]) if (!seen[j]) { seen[j] = true; walk(j, depth + 1, start); seen[j] = false; }
  };
  for (let start = 0; start < 25; start++) { seen[start] = true; walk(start, 1, start); seen[start] = false; }
  assert.equal(closed, 0);
  assert.equal(open, 1728, 'the known number of open tours');
  // open tours start only on the 13 squares of the corners' colour: the colour argument again
  assert.deepEqual(Array.from(starts).sort((a, b) => a - b), Array.from({ length: 25 }, (_, i) => i).filter((i) => (Math.floor(i / 5) + (i % 5)) % 2 === 0));
});

test('review: wording that has to be exactly right', () => {
  // 0 is even (lesson 1 says so), and 0 has no partner among the counting numbers: the pairing step must ask about 2, 4, 6, …
  assert.match(fixed('evidence-is-not-proof', 'definitions').text, /\$0 = 2 \\times 0\$ is even/);
  const pairing = lessons.infinity.steps.find((s) => s.id === 'pairing');
  assert.match(pairing.template, /any of the even numbers 2, 4, 6, … left without a partner/);
  assert.match(fixed('infinity', 'hook').text, /even numbers among them/);
  for (let n = 1; n <= 500; n++) { assert.equal((2 * n) % 2, 0); assert.ok(2 * n >= 2); }
  // the slip named in the feedback of the fraction step must be one the slip really makes
  const everything = sweep(60, false);
  const kept = sweep(60);
  eachVariant('infinity', 'fraction-position', (step) => {
    const m = /At which position is \$\\frac\{(\d+)\}\{(\d+)\}\$/.exec(step.text);
    for (const [value, message] of step.wrong) {
      const counted = everything.slice(0, value).filter((f) => !kept.includes(f));
      const named = Array.from(message.matchAll(/\\frac(\d)(\d)/g), (g) => `${g[1]}/${g[2]}`);
      assert.ok(named.length >= 1, 'the feedback names a skipped fraction');
      for (const f of named) assert.ok(counted.includes(f), `counting to ${m[1]}/${m[2]} without skipping passes ${counted.join(', ')}, not ${f}`);
    }
  });
  // "lowest terms" and the pigeonhole principle, stated without a loophole
  assert.match(fixed('contradiction', 'odd-square').text, /no common factor bigger than 1/);
  assert.match(fixed('pigeonhole', 'name-it').text, /Suppose no box held more than one/);
  // the proofs to put in order: the lines are stored in the one order in which each follows from those above it
  const inOrder = (lessonId, stepId, marks) => {
    const items = fixed(lessonId, stepId).items;
    assert.equal(items.length, marks.length, `${lessonId}/${stepId}: number of lines`);
    marks.forEach((mark, i) => assert.ok(items[i].includes(mark), `${lessonId}/${stepId}: line ${i + 1} should contain "${mark}"`));
  };
  inOrder('evidence-is-not-proof', 'even-proof', ['Let $a$ and $b$', '$a = 2m$ and $b = 2k$', '$a + b = 2m + 2k$', '$a + b = 2(m + k)$', '2 times a whole number', 'So $a + b$ is even']);
  inOrder('contradiction', 'smallest-order', ['Suppose there **is**', '\\frac{s}{2}', 'not the smallest', 'supposition was false']);
  inOrder('contradiction', 'sqrt2-order', ['lowest terms: $\\frac{p}{q}$', '$p^2 = 2q^2$', '$p = 2k$', '$q^2 = 2k^2$', '$q$ is even as well', 'not in lowest terms']);
  inOrder('induction', 'sum-order', ['**Base case.**', 'Suppose the formula holds for some $n$', 'Add $n + 1$ to both sides', 'The right-hand side equals', 'So whenever', 'together prove']);
  assert.match(fixed('induction', 'sum-order').text, /with the base case first/, 'base case and step could be told in either order, so the step says which');
  inOrder('infinity', 'cantor-order', ['Suppose all the decimals', 'Build a new decimal', 'equals none of the entries', 'missing from the list', 'contradicts the supposition']);
});

/* ============================================================ all six lessons */

/** Every piece of text a learner can see in a concrete step. */
function strings(step) {
  const out = [step.title, step.text, step.explain, step.template, step.model, step.prefix, step.unit, ...(step.hints || [])];
  for (const o of step.options || []) out.push(o.text, o.why);
  for (const item of step.items || []) out.push(typeof item === 'string' ? item : item.text, item.why);
  for (const pair of step.pairs || []) out.push(...pair);
  for (const w of step.wrong || []) out.push(w[1]);
  for (const fig of [...(step.figures || []), step.widget].filter(Boolean)) out.push(fig.alt, fig.claim, fig.boxTitle);
  return out.filter((text) => typeof text === 'string');
}

test('every lesson: shape, one right answer per choice, no repeated options, no broken text', () => {
  for (const id of LESSONS) {
    const lesson = lessons[id];
    assert.ok(lesson.steps.length >= 12 && lesson.steps.length <= 18, `${id}: ${lesson.steps.length} steps`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next, `${id}: next`);
    const reviews = lesson.steps.filter((s) => s.review).length;
    assert.ok(reviews >= 2 && reviews <= 4, `${id}: ${reviews} review steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'reflect').length <= 1, `${id}: at most one reflect`);
    const handsOn = lesson.steps.filter((s) => s.type === 'interact' || (s.figure && !Array.isArray(s.figure) && s.figure.type !== 'svg' && !s.figure.static)).length;
    assert.ok(handsOn >= 2, `${id}: ${handsOn} hands-on steps`);
    for (const raw of lesson.steps) {
      const runs = typeof raw.gen === 'function' ? SEEDS : 1;
      for (let seed = 1; seed <= runs; seed++) {
        const step = resolveStep(raw, makeRng(seed * 104729 + 5), raw.id);
        const where = `${id}/${raw.id} (seed ${seed})`;
        for (const text of strings(step)) assert.ok(!/\bundefined\b|\bNaN\b|\[object|[=:] ?-?Infinity\b|\bInfinity (km|rooms?|moves?)\b/.test(text), `${where}: "${text.slice(0, 90)}"`);
        for (const text of strings(step)) assert.ok(!/\b1 (squares|moves|rooms|tiles|horses|numbers|pigeons|values|regions) /.test(text), `${where}: singular and plural in "${text.slice(0, 90)}"`);
        if (step.type === 'choice' || step.type === 'multi') {
          const texts = step.options.map((o) => o.text.trim());
          assert.equal(new Set(texts).size, texts.length, `${where}: an option is repeated`);
          const right = step.options.filter((o) => o.correct).length;
          if (step.mode === 'predict') assert.ok(right <= 1, `${where}: at most one correct option`);
          else assert.equal(right, 1, `${where}: exactly one correct option`);
          if (step.mode !== 'predict') assert.ok(step.explain, `${where}: has an explanation`);
        }
        if (step.type === 'numeric') {
          assert.ok(Number.isFinite(step.answer), `${where}: the answer is a number`);
          for (const [value] of step.wrong) assert.ok(Math.abs(value - step.answer) > 1e-9, `${where}: "wrong" lists the answer`);
        }
        if (step.type === 'fill') for (const b of step.blanks) assert.ok(b.kind === 'select' ? b.options.includes(b.answer) && new Set(b.options).size === b.options.length : b.answers.length > 0, `${where}: a blank has no answer`);
        if (step.type === 'order') assert.equal(new Set(step.items).size, step.items.length, `${where}: two lines are the same`);
        if (step.type === 'match') {
          assert.equal(new Set(step.pairs.map((pair) => pair[0])).size, step.pairs.length, `${where}: two left-hand items are the same`);
          assert.equal(new Set(step.pairs.map((pair) => pair[1])).size, step.pairs.length, `${where}: two right-hand items are the same, so a correct pairing could be marked wrong`);
        }
        if (step.type === 'bucket') step.buckets.forEach((_, b) => assert.ok(step.items.some((it) => it.bucket === b), `${where}: an empty bucket`));
        if (step.type === 'interact') assert.ok(step.solution !== undefined && typeof step.check === 'function', `${where}: check and solution`);
        if (step.review) assert.ok(step.explain || step.type === 'match', `${where}: a review step explains itself`);
      }
    }
  }
});

/* ============================================================ teach before you ask */

/** The teaching screens added when the course was revised to teach before it asks. */
const TEACHING = {
  'evidence-is-not-proof': ['teach-counterexample', 'example-direct'],
  contradiction: ['example-contradiction', 'example-root-half', 'teach-sound-steps', 'teach-opposite'],
  induction: ['teach-chain', 'example-induction', 'teach-tromino-proof'],
  pigeonhole: ['teach-remainders', 'teach-crowded'],
  invariants: ['teach-parity', 'example-erase', 'teach-toolbox'],
  infinity: ['teach-same-size', 'teach-sweep', 'teach-diagonal'],
};
/** [lesson, teaching screen, the steps it serves, what it has to say for them] — the older screens included. */
const SERVES = [
  ['evidence-is-not-proof', 'conjecture', ['euler-hunt', 'sort-evidence'], ['**conjecture**', '**evidence**']],
  ['evidence-is-not-proof', 'teach-counterexample', ['counterexample', 'sort-evidence', 'what-it-takes'], ['**counterexample**', '**disproves**', '**about**', '**fails**', 'says nothing about it']],
  ['evidence-is-not-proof', 'definitions', ['example-direct', 'even-proof', 'parity-proof'], ['**even**', '**odd**', '2 \\times k + 1', 'some whole number, whichever it is']],
  ['evidence-is-not-proof', 'example-direct', ['even-proof', 'parity-proof', 'sort-evidence'], ['**direct proof**', 'Let $a$ and $b$', '$a = 3m$ and $b = 3k$', '3(m + k)', 'common factor', 'Two letters']],
  ['contradiction', 'method', ['halve', 'smallest-order'], ['**Suppose**', '**impossible**', '**proof by contradiction**']],
  ['contradiction', 'example-contradiction', ['smallest-order', 'sqrt2-order', 'primes-fill'], ['**Suppose**', 'contradicts', 'supposition was false', 'Call it $L$']],
  ['contradiction', 'example-root-half', ['sqrt2-order', 'what-clashed', 'root-four'], ['lowest terms', '$q^2 = 2p^2$', '$q = 2k$', 'halve both sides', '**contradiction**']],
  ['contradiction', 'teach-sound-steps', ['bogus', 'root-four'], ['**sound**', '**Dividing by zero.**', 'divisible by 9', 'small numbers']],
  ['contradiction', 'teach-opposite', ['assume-what'], ['**exact opposite**', '**no**', '**Every**', '**some**', 'Too strong', 'agrees with the claim', 'the claim itself']],
  ['induction', 'teach-chain', ['two-facts', 'name-induction'], ['**The first domino falls.**', '**Every domino knocks over the next one.**']],
  ['induction', 'name-induction', ['step-algebra', 'sum-order', 'which-part', 'horses'], ['**Base case.**', '**Induction step.**', 'stands for any whole number']],
  ['induction', 'example-induction', ['step-algebra', 'sum-order', 'use-formula', 'which-part'], ['**Base case.**', '**Induction step.**', '$2n + 1$', '$(n + 1)^2$', 'together prove']],
  ['induction', 'teach-tromino-proof', ['which-part'], ['**Base case.**', '**Induction step.**', '$2^n \\times 2^n$', 'twice the side', 'Golomb', '1954']],
  ['pigeonhole', 'name-it', ['socks', 'hairs', 'pick-holes'], ['**pigeonhole principle**', '**at least two**', 'are the pigeons', 'are the holes', 'Dirichlet']],
  ['pigeonhole', 'teach-remainders', ['difference', 'pick-holes'], ['same remainder', 'differ by a multiple of', '$n + 1$ whole numbers']],
  ['pigeonhole', 'teach-crowded', ['three-alike', 'guaranteed'], ['$(k - 1) \\times n$', '**at least $k$**', 'unluckiest', 'at most 8 things']],
  ['invariants', 'name-it', ['fix-it', 'sort-proofs', 'choose-tool'], ['**invariant**', '**impossible**', 'Checking **every** arrangement']],
  ['invariants', 'teach-parity', ['coins-can', 'erase-game'], ['**parity**', 'invariant', 'has no objection', 'a way exists']],
  ['invariants', 'example-erase', ['erase-game'], ['lowers the sum by $2b$', 'an even amount', 'the sum *is* the last number']],
  ['invariants', 'teach-toolbox', ['choose-tool'], ['**Counterexample.**', '**Contradiction.**', '**Induction.**', '**Pigeonhole.**', '**Invariant.**']],
  ['infinity', 'teach-same-size', ['pairing', 'hotel-one', 'hotel-bus'], ['**the same size**', 'paired off one to one', 'nothing left over', '$n + 10$']],
  ['infinity', 'countable', ['list-integers', 'sizes'], ['one endless', '0,\\;\\; 1,\\; -1,\\;\\; 2,\\; -2']],
  ['infinity', 'teach-sweep', ['fractions', 'fraction-position', 'sizes'], ['sweep the diagonals', 'smallest top number upwards', 'Skip a fraction', 'is skipped']],
  ['infinity', 'teach-diagonal', ['objection', 'cantor-order', 'diagonal-pick'], ['**diagonal argument**', '**Suppose**', 'differs from row $n$ at flip $n$', '**contradiction**']],
];
const flat = (text) => String(text || '').replace(/\s+/g, ' ').trim();
const variants = (lessonId, stepId, n = SEEDS) => { const out = []; eachVariant(lessonId, stepId, (step) => { if (out.length < n) out.push(step); }); return out; };
/** Everything the lesson has put on a teaching screen before the step with this id. */
const taughtBefore = (lessonId, stepId) => {
  const steps = lessons[lessonId].steps;
  const at = steps.findIndex((s) => s.id === stepId);
  assert.ok(at >= 0, `${lessonId} has a step "${stepId}"`);
  return flat(steps.slice(0, at).filter((s) => s.type === 'info').map((s) => `${s.title} ${s.text}`).join(' '));
};

test('teach before you ask: shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? (s.teach ? 'teach' : 'closing') : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const id of LESSONS) {
    const steps = lessons[id].steps.map((raw) => resolveStep(raw, makeRng(1), raw.id)); // `graded` exists only on resolved steps
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    assert.ok(roles.filter((kind) => kind === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const stepId of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === stepId);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${stepId}" exists`);
      assert.ok(roles.indexOf('graded', at + 1) > 0, `${id}/${stepId} is followed by a question`);
      for (const fig of steps[at].figures || []) assert.ok(fig.alt, `${id}/${stepId}: its figure has alt text`);
    }
  }
});

test('teach before you ask: each teaching screen comes before the steps it serves, and says what they need', () => {
  for (const [les, teach, asks, terms] of SERVES) {
    const steps = lessons[les].steps;
    const at = steps.findIndex((s) => s.id === teach);
    assert.ok(at >= 0 && steps[at].type === 'info', `${les}/${teach} is a teaching screen`);
    for (const ask of asks) {
      const asked = steps.findIndex((s) => s.id === ask);
      assert.ok(asked >= 0 && at < asked, `${les}: "${teach}" must come before "${ask}"`);
    }
    for (const term of terms) assert.ok(flat(steps[at].text).includes(term), `${les}/${teach} should say "${term}" (needed by ${asks.join(', ')})`);
  }
  // a rule found by doing is stated on the teaching screen that follows, not first in that step's explanation
  for (const [les, id, rule] of [
    ['evidence-is-not-proof', 'polya', 'counterexample'], ['induction', 'hook', 'knocks over'], ['induction', 'tromino-step', 'Golomb'],
    ['pigeonhole', 'remainders-try', 'multiple of'], ['invariants', 'coins-why', 'parity'], ['pigeonhole', 'three-alike', '(k - 1)'],
  ]) for (const step of typeof lessons[les].steps.find((s) => s.id === id).gen === 'function' ? variants(les, id, 20) : [fixed(les, id)]) assert.ok(!flat(step.explain).includes(rule), `${les}/${id}: "${rule}" belongs on a teaching screen`);
  // one sentence in the prompt where one sentence was all that was missing
  assert.match(flat(fixed('evidence-is-not-proof', 'euler-hunt').text), /A \*\*prime\*\* is a whole number greater than 1 that is not a product of two smaller whole numbers/);
  assert.ok(lessons['evidence-is-not-proof'].steps.findIndex((s) => s.id === 'euler-hunt') < lessons['evidence-is-not-proof'].steps.findIndex((s) => s.id === 'counterexample'), 'primes are defined before the claims about primes');
  assert.match(flat(fixed('evidence-is-not-proof', 'why-forty').text), /\$7 \\times 5 \+ 5 = 8 \\times 5\$/);
  assert.equal(7 * 5 + 5, 8 * 5);
  assert.match(flat(fixed('induction', 'horses').text), /has to work for \*\*every\*\* \$n\$/);
  assert.match(flat(fixed('infinity', 'sizes').text), /a collection that contains one that cannot be listed cannot be listed either/);
  assert.match(flat(fixed('infinity', 'pairing').text), /Pair each counting number \$n\$ with the even number \$2n\$/);
});

test('teach before you ask: every case a generated question can ask about has been taught above it', () => {
  // lesson 1: the words of every false claim (prime, in the prompt of the hunt; even and odd come with the claims themselves)
  const l1 = lessons['evidence-is-not-proof'].steps;
  const shownBefore = (stepId) => flat(l1.slice(0, l1.findIndex((s) => s.id === stepId)).map((s) => `${s.text || ''}`).join(' '));
  for (const claim of Object.keys(CLAIMS)) if (/prime/.test(claim)) assert.ok(shownBefore('counterexample').includes('A **prime** is'), claim);
  // … and the three kinds of option (breaks the claim, fits it, is not what the claim is about) are the three lines of the worked example
  const example = taughtBefore('evidence-is-not-proof', 'counterexample');
  for (const kind of ['It fits the claim', 'The claim says nothing about it', 'A counterexample: the claim is false']) assert.ok(example.includes(kind), kind);
  for (const step of variants('evidence-is-not-proof', 'counterexample', 60)) {
    for (const o of step.options) if (!o.correct) assert.ok(/fits the claim|says nothing about/.test(o.why));
  }
  // every skeleton proof is about odd and even numbers, both defined on the screen before the worked proof
  for (const step of variants('evidence-is-not-proof', 'parity-proof', 40)) {
    assert.match(step.text, /odd|even/);
    assert.equal(step.hints.length, 2, 'a general hint and one for this proof');
    assert.ok(step.hints.every((hint) => typeof hint === 'string' && hint.length > 20));
  }
  // lesson 2: every kind of claim whose opposite is asked for has had its opposite shown earlier in the lesson
  const l2 = lessons.contradiction.steps;
  const before = l2.slice(0, l2.findIndex((s) => s.id === 'assume-what'));
  const seen = flat(before.map((s) => [s.text, s.template, ...(s.items || [])].join(' ')).join(' '));
  const opposite = taughtBefore('contradiction', 'assume-what');
  const where = {
    '$\\sqrt{3}$ is not a fraction.': () => seen.includes('Suppose some fraction does square to 2'),
    'There are infinitely many primes.': () => seen.includes('Suppose there are only finitely many primes'),
    'There is no largest whole number.': () => opposite.includes('"There is **no** largest multiple of 10." Suppose there **is** one.'),
    'There is no smallest positive fraction.': () => seen.includes('Suppose there **is** a smallest positive fraction'),
    'Every prime number greater than 2 is odd.': () => opposite.includes('"**Every** multiple of 4 is even." Suppose **some** multiple of 4 is odd.'),
    'No whole number is both even and odd.': () => opposite.includes('"**No** multiple of 10 is odd." Suppose **some** multiple of 10 is odd.'),
  };
  assert.deepEqual(Object.keys(where).sort(), Object.keys(SUPPOSE).sort(), 'one earlier model for every claim of the pool');
  for (const [claim, shown] of Object.entries(where)) assert.ok(shown(), `the opposite of a claim like "${claim}" is shown before it is asked for`);
  // lesson 5: the five tools of the matching step are the five of the reminder before it
  for (const pair of fixed('invariants', 'choose-tool').pairs) {
    const tool = /^(\w+):/.exec(pair[1])[1];
    assert.ok(flat(fixed('invariants', 'teach-toolbox').text).includes(`**${tool}.**`), tool);
  }
  // lesson 6: both rules the sorting step leans on, and the collections it names
  const sizes = taughtBefore('infinity', 'sizes');
  for (const said of ['all the whole numbers, negatives included', 'positive fractions', 'endless rows']) assert.ok(sizes.includes(said), said);
});

test('teach before you ask: the worked examples are right, and no question can repeat one', () => {
  const text = (les, id) => flat(fixed(les, id).text);
  // lesson 1: "every multiple of 5 ends in 5" is not one of the claims on offer, and 15, 12, 10 are what the screen says
  assert.ok(!Object.keys(CLAIMS).some((claim) => /multiple of 5/.test(claim)));
  const about = (n) => n % 5 === 0;
  const holds = (n) => n % 10 === 5;
  assert.ok(about(15) && holds(15) && !about(12) && about(10) && !holds(10));
  assert.match(text('evidence-is-not-proof', 'teach-counterexample'), /\*\*15\*\* is a multiple of 5 and ends in 5.*\*\*12\*\* is not a multiple of 5.*\*\*10\*\* is a multiple of 5, and it ends in 0/);
  // the worked direct proof is about multiples of 3: not the proof to put in order, and not one of the proofs with gaps
  for (let m = -5; m <= 5; m++) for (let k = -5; k <= 5; k++) { assert.equal(3 * m + 3 * k, 3 * (m + k)); assert.equal((3 * m + 3 * k) % 3 === 0, true); }
  assert.ok(12 === 3 * 4 && (12 + 9) % 3 === 0 && (300 + 6) % 3 === 0);
  assert.ok(!/multiple/.test(flat(fixed('evidence-is-not-proof', 'even-proof').items.join(' '))));
  for (const step of variants('evidence-is-not-proof', 'parity-proof', 60)) assert.ok(!/multiples? of 3/.test(step.text + step.template));

  // lesson 2: "no largest multiple of 10" is not a claim of the pool; L + 10 is a larger multiple of 10
  assert.ok(!Object.keys(SUPPOSE).some((claim) => /multiple of 10|multiple of 4/.test(claim)));
  for (let L = 10; L <= 500; L += 10) assert.ok((L + 10) % 10 === 0 && L + 10 > L);
  // no fraction squares to one half (a look at small ones), and the lines of the rehearsal are true
  for (let q = 1; q <= 600; q++) for (const p of [Math.floor(q / Math.SQRT2), Math.ceil(q / Math.SQRT2)]) assert.notEqual(2 * p * p, q * q, `${p}/${q}`);
  for (let k = 1; k <= 30; k++) for (let p = 1; p <= 60; p++) if (4 * k * k === 2 * p * p) assert.equal(p * p, 2 * k * k);
  const half = text('contradiction', 'example-root-half');
  assert.ok(!half.includes('$p^2 = 2q^2$'), 'the rehearsal is the proof about one half, not the proof about 2');
  assert.ok(lessons.contradiction.steps.findIndex((s) => s.id === 'odd-square') < lessons.contradiction.steps.findIndex((s) => s.id === 'example-root-half'), 'the two tools come before the proof that uses them');
  // the two unsound steps
  assert.equal(5 * 0, 9 * 0);
  assert.ok((3 * 3) % 9 === 0 && 3 % 9 !== 0);
  assert.ok(!/5 = 9|divisible by 9/.test(flat(fixed('contradiction', 'bogus').text) + flat(fixed('contradiction', 'root-four').text)));
  // Euclid's trick with three primes
  assert.equal(2 * 3 * 5 + 1, 31);
  for (const p of [2, 3, 5]) assert.equal(31 % p, 1);
  assert.match(text('contradiction', 'primes-fill'), /\$2 \\times 3 \\times 5 \+ 1 = 31\$/);

  // lesson 3: the chain of the teaching screen stops after its third domino
  const chain = fixed('induction', 'teach-chain').figures[0];
  assert.equal(fallenCount(chain.count, chain.gaps), 3);
  assert.match(text('induction', 'teach-chain'), /after domino 3/);
  assert.equal(chain.editable, false);
  // the worked induction is about the odd numbers; the proof to put in order is about 1 + 2 + … + n
  for (let n = 1; n <= 60; n++) assert.equal(n * n + 2 * n + 1, (n + 1) ** 2);
  assert.ok(!/n\(n ?\+ ?1\)/.test(text('induction', 'example-induction')));
  assert.equal((4 * 5) / 2 + 5, (4 * 5 + 2 * 5) / 2);
  assert.equal((4 * 5 + 2 * 5) / 2, (5 * 6) / 2);
  assert.equal(1 + 2 + 3 + 4, (4 * 5) / 2);
  assert.match(text('induction', 'step-algebra'), /\\frac\{4 \\times 5\}\{2\} \+ 5 = \\frac\{4 \\times 5 \+ 2 \\times 5\}\{2\} = \\frac\{5 \\times 6\}\{2\}/);
  assert.equal(1 + 3 + 5 + 7 + 9, 5 ** 2);
  for (const step of variants('induction', 'use-formula')) {
    assert.match(flat(step.text), /\$1 \+ 3 \+ 5 \+ 7 \+ 9\$ has 5 terms, because 9 is the 5th odd number/);
    assert.ok(Number(/\\cdots \+ (\d+) =/.exec(step.text)[1]) > 9, 'the question is never the worked sum');
  }
  // the board on the tromino screen is completely and correctly tiled
  const board = fixed('induction', 'teach-tromino-proof').figures[0];
  assert.ok(board.static && boardState(8, 8, board.removed, board.pieces, 'tromino').complete);
  assert.ok(board.pieces.every((p) => isPiece(p, 8, 'tromino')) && board.pieces.length === 21);
  assert.deepEqual(board.removed, fixed('induction', 'tromino-step').widget.removed);

  // lesson 4: two colours need three socks; no sock question has two colours
  assert.equal(maxWithout(2, 2) + 1, 3);
  for (const step of variants('pigeonhole', 'socks')) assert.ok(Number(/\*\*(\d+) (colours|different symbols)\*\*/.exec(step.text)[1]) > 2);
  const birds = fixed('pigeonhole', 'name-it').figures[0];
  assert.ok(birds.boxes.length === 2 && birds.pigeons === 3);
  // 10, 14, 20, 27 on division by 3: only 14 and 20 share a remainder; the questions divide by 4 or more
  const four = fixed('pigeonhole', 'teach-remainders').figures[0];
  assert.deepEqual(four.pool, [10, 14, 20, 27]);
  assert.deepEqual(four.pool.map((v) => v % 3), [1, 2, 2, 0]);
  assert.deepEqual(four.pool.map(four.boxOf), [1, 2, 2, 0]);
  assert.ok(four.limit === 4 && four.boxes.length === 3 && 20 - 14 === 2 * 3);
  const poolOfFive = fixed('pigeonhole', 'remainders-try').widget.pool;
  assert.ok(poolOfFive.includes(21) && poolOfFive.includes(31) && 21 % 5 === 1 && 31 % 5 === 1 && 31 - 21 === 2 * 5);
  for (const step of variants('pigeonhole', 'difference')) assert.ok(Number(/differ by a multiple of (\d+)\./.exec(step.text)[1]) >= 4);
  // three alike from two colours: 5 socks; 9 things in 4 boxes; no later question uses two colours
  assert.equal(maxWithout(2, 3) + 1, 5);
  assert.equal(maxWithout(4, 3), 8);
  for (const step of variants('pigeonhole', 'three-alike')) assert.ok(Number(/\*\*(\d+) colours\*\*/.exec(step.text)[1]) > 2);
  const five = fixed('pigeonhole', 'teach-crowded').figures[0];
  assert.ok(five.boxes.length === 2 && five.pigeons === 5);

  // lesson 5: T H T T can never become all heads, T H H T can in one move; the questions have five coins or more
  assert.ok(!reachable('THTT').has('HHHH'));
  assert.equal(reachable('THHT').get('HHHH'), 1);
  assert.equal(fixed('invariants', 'teach-parity').figures[0].coins, 'THHT');
  for (const step of variants('invariants', 'coins-can')) assert.ok(/\*\*([HT ]+)\*\*/.exec(step.text)[1].replace(/ /g, '').length >= 5);
  // the board 3, 4, 6: whatever the moves, the last number is odd; the questions start from 1, 2, 3, …
  const ends = new Set();
  const play = (boardNow) => {
    if (boardNow.length === 1) { ends.add(boardNow[0]); return; }
    for (let i = 0; i < boardNow.length; i++) for (let j = i + 1; j < boardNow.length; j++) play([...boardNow.filter((_, k) => k !== i && k !== j), Math.abs(boardNow[i] - boardNow[j])]);
  };
  play([3, 4, 6]);
  assert.ok(ends.size >= 1 && Array.from(ends).every((v) => v % 2 === 1), `last numbers ${Array.from(ends)}`);
  assert.ok(3 + 4 + 6 === 13 && 3 + 2 === 5 && 13 - 5 === 2 * 4);
  for (let a = 1; a <= 12; a++) for (let b = 1; b <= a; b++) assert.equal((a + b) - (a - b), 2 * b);
  for (const step of variants('invariants', 'erase-game', 60)) assert.match(step.text, /\$1, 2, 3, \\ldots, \d+\$/);

  // lesson 6: n and n + 10 pair off the counting numbers with 11, 12, 13, …
  for (let n = 1; n <= 300; n++) { assert.ok(n + 10 >= 11); assert.equal(n + 10 - 10, n); }
  // 3 and -3 sit at positions 6 and 7, and are never asked for
  assert.ok(integerPosition(3) === 6 && integerPosition(-3) === 7);
  for (const step of variants('infinity', 'list-integers')) {
    assert.match(flat(step.text), /The pair \$3, -3\$ takes positions 6 and 7\./);
    assert.ok(Math.abs(Number(/At which position is \$(-?\d+)\$/.exec(step.text)[1])) >= 5);
  }
  // the first three diagonals of the sweep
  assert.deepEqual(sweep(5), ['1/1', '1/2', '2/1', '1/3', '3/1']);
  assert.match(text('infinity', 'teach-sweep'), /So the list begins \$\\frac11, \\frac12, \\frac21, \\frac13, \\frac31\$\./);
  for (const step of variants('infinity', 'fraction-position')) assert.ok(step.answer >= 10, 'the fractions asked for lie beyond the worked diagonals');
  // the rows of coin flips: the new row differs from row n at flip n
  const flips = fixed('infinity', 'teach-diagonal').figures[0].alt;
  const rows = Array.from(/Four rows of coin flips: (.+?), each running on/.exec(flips)[1].matchAll(/[HT](?: [HT]){3}/g), (m) => m[0].replace(/ /g, ''));
  const fresh = /opposite of each marked flip: ([HT, ]+)\./.exec(flips)[1].replace(/[, ]/g, '');
  assert.equal(rows.length, 4);
  rows.forEach((row, i) => { assert.notEqual(fresh[i], row[i], `the new row differs from row ${i + 1} at flip ${i + 1}`); assert.notEqual(fresh, row); });
  assert.equal(/are marked: ([HT, ]+)\./.exec(flips)[1].replace(/[, ]/g, ''), rows.map((row, i) => row[i]).join(''));
  // the worked proof is about coin flips; the proof to put in order is about decimals
  assert.ok(!/decimal/.test(text('infinity', 'teach-diagonal').split(':::example')[1]));
  assert.ok(fixed('infinity', 'cantor-order').items.every((line) => !/flip|row/.test(line)));
});

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} has a test that re-derives its answer`);
  }
});
