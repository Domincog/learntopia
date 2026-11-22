/**
 * Helpers shared by the lessons of "The Secret Life of Numbers".
 * Pure functions only, so tests/number-theory.test.mjs can check them
 * (and the lesson generators that rely on them) without a browser.
 */

/** Is n a prime number? (trial division; fine for the small numbers used in lessons) */
export function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

/** Prime factors with repeats, smallest first: primeFactors(60) -> [2, 2, 3, 5] */
export function primeFactors(n) {
  const out = [];
  let rest = Math.abs(Math.round(n));
  for (let d = 2; d * d <= rest; d++) {
    while (rest % d === 0) { out.push(d); rest /= d; }
  }
  if (rest > 1) out.push(rest);
  return out;
}

/** Every factor (divisor) of n, smallest first: factorsOf(12) -> [1, 2, 3, 4, 6, 12] */
export function factorsOf(n) {
  const out = [];
  for (let d = 1; d <= n; d++) if (n % d === 0) out.push(d);
  return out;
}

/** Sum of the decimal digits: digitSum(4782) -> 21 */
export const digitSum = (n) => String(Math.abs(n)).split('').reduce((t, c) => t + Number(c), 0);

/** Remainder that is never negative: mod(-3, 7) -> 4 */
export const mod = (a, m) => ((a % m) + m) % m;

/** base^n mod m, multiplying and reducing one step at a time (so nothing ever gets big). */
export function powMod(base, n, m) {
  let value = 1 % m;
  for (let i = 0; i < n; i++) value = (value * base) % m;
  return value;
}

/** The remainders of base^1, base^2, … base^n on a clock with m places. */
export const powerChain = (base, n, m) => Array.from({ length: n }, (_, i) => powMod(base, i + 1, m));

/**
 * Euclid's algorithm, keeping every division line.
 *   euclid(48, 18) -> { gcd: 6, steps: [{ a: 48, b: 18, q: 2, r: 12 }, { a: 18, b: 12, q: 1, r: 6 }, { a: 12, b: 6, q: 2, r: 0 }] }
 */
export function euclid(a, b) {
  const steps = [];
  let x = a;
  let y = b;
  while (y) {
    const q = Math.floor(x / y);
    const r = x % y;
    steps.push({ a: x, b: y, q, r });
    x = y;
    y = r;
  }
  return { gcd: x, steps };
}

/** One division line as TeX: "48 = 2 \times 18 + 12" */
export const divisionTex = ({ a, b, q, r }) => `${a} = ${q} \\times ${b} + ${r}`;

/** Thousands separators for prose: commas(30031) -> "30,031" */
export const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** The same for use inside $…$ (a bare comma would get a space after it): "30{,}031" */
export const commasTex = (n) => commas(n).replace(/,/g, '{,}');

/** "a, b and c" */
export function listAnd(items, word = 'and') {
  const list = items.map(String);
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} ${word} ${list[list.length - 1]}`;
}

/** A product as TeX: productTex([2, 2, 3, 5]) -> "2 \times 2 \times 3 \times 5" */
export const productTex = (factors) => factors.join(' \\times ');

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Position of a letter in the alphabet, counting from A = 0. */
export const letterIndex = (ch) => ALPHABET.indexOf(String(ch).toUpperCase());

/**
 * Caesar cipher: shift every letter forward by `key` places (wrapping after Z).
 * Use a negative key to decode. Everything that is not a letter is left alone.
 */
export const caesar = (text, key) => String(text).toUpperCase().replace(/[A-Z]/g, (c) => ALPHABET[mod(c.charCodeAt(0) - 65 + key, 26)]);

/** Letter counts of a message, most common first: [{ letter: 'E', count: 9 }, …] (ties: alphabetical) */
export function letterCounts(text) {
  const counts = new Map();
  for (const c of String(text).toUpperCase()) if (c >= 'A' && c <= 'Z') counts.set(c, (counts.get(c) || 0) + 1);
  return Array.from(counts, ([letter, count]) => ({ letter, count }))
    .sort((p, q) => q.count - p.count || (p.letter < q.letter ? -1 : 1));
}

/** All primes up to and including `max`. */
export function primesUpTo(max) {
  const out = [];
  for (let k = 2; k <= max; k++) if (isPrime(k)) out.push(k);
  return out;
}
