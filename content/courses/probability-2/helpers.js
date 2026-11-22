/**
 * Probability II · helpers shared by this course's lessons.
 */
import { gcd } from '../../kit.js';

/** n! for small n (exact up to 18!). */
export const factorial = (n) => { let out = 1; for (let i = 2; i <= n; i++) out *= i; return out; };

/** Ordered line-ups of k things taken from n: n × (n − 1) × … with k factors. */
export const arrangements = (n, k) => { let out = 1; for (let i = 0; i < k; i++) out *= n - i; return out; };

/** n choose k: groups of k things taken from n, where order does not matter. */
export const choose = (n, k) => (k < 0 || k > n ? 0 : Math.round(arrangements(n, k) / factorial(k)));

/** The factors of a falling product as TeX: falling(8, 3) → "8 \times 7 \times 6". */
export const falling = (n, k) => Array.from({ length: k }, (_, i) => n - i).join(' \\times ');

/** ['a', 'b', 'c'] → "a, b and c". */
export const listAnd = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

/** 1234567 → "1,234,567" (plain ASCII, safe inside text and TeX). */
export const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** A reduced fraction as plain text, for `answer` and `display`: fracText(6, 36) → "1/6", fracText(4, 2) → "2". */
export function fracText(n, d) {
  const g = gcd(n, d) || 1;
  const a = n / g;
  const b = d / g;
  return b === 1 ? String(a) : `${a}/${b}`;
}

/** TeX for a fraction exactly as given (not reduced): rawFrac(6, 36) → "\frac{6}{36}". */
export const rawFrac = (n, d) => `\\frac{${n}}{${d}}`;

/** A fraction, and its reduced form when that is different: "\frac{6}{16} = \frac{3}{8}". */
export function fracChain(n, d) {
  const g = gcd(n, d) || 1;
  if (g === 1) return rawFrac(n, d);
  return d / g === 1 ? `${rawFrac(n, d)} = ${n / g}` : `${rawFrac(n, d)} = ${rawFrac(n / g, d / g)}`;
}

/** A probability as a tidy percentage string: pct(0.0918) → "9.2", pct(0.5) → "50". */
export function pct(p, digits = 1) {
  const k = Math.pow(10, digits);
  return String(Math.round(p * 100 * k) / k);
}

/** "= 0.4" when the value has at most `digits` decimals, "\approx 0.357" when it had to be rounded (TeX). */
export function eqDec(v, digits = 3) {
  const k = Math.pow(10, digits);
  const rounded = Math.round(v * k) / k;
  return Math.abs(v - rounded) < 1e-12 ? `= ${rounded}` : `\\approx ${v.toFixed(digits)}`;
}

/**
 * Keep only the anticipated mistakes that cannot be confused with the right answer: a "wrong" value that
 * happens to coincide with the answer for some numbers (or lies within the accepted tolerance) is dropped,
 * and so is a repeat of an earlier one.
 */
export function slips(answer, list, tolerance = 1e-9) {
  const out = [];
  for (const [value, message] of list) {
    if (!Number.isFinite(value)) continue;
    if (Math.abs(value - answer) <= tolerance * 2 + 1e-9) continue;
    if (out.some(([v]) => Math.abs(v - value) < 1e-9)) continue;
    out.push([value, message]);
  }
  return out;
}

/** Every ordered line-up of k different letters taken from `letters`, as strings in dictionary order. */
export function lineups(letters, k) {
  let out = [''];
  for (let i = 0; i < k; i++) out = out.flatMap((word) => letters.filter((c) => !word.includes(c)).map((c) => word + c));
  return out;
}

/** Every k-letter code made from `letters`, repeats allowed, in dictionary order. */
export function codes(letters, k) {
  let out = [''];
  for (let i = 0; i < k; i++) out = out.flatMap((word) => letters.map((c) => word + c));
  return out;
}

/** The chance that at least two of k people share a birthday, with `days` equally likely birthdays. */
export function sharedBirthday(k, days = 365) {
  let allDifferent = 1;
  for (let i = 0; i < k; i++) allDifferent *= (days - i) / days;
  return 1 - allDifferent;
}

/**
 * A `feedback` function for numeric steps whose answer is a probability: it catches values that cannot be
 * probabilities at all, and answers that are right in spirit but rounded too roughly.
 */
export const probFeedback = (answer) => (v) => {
  // "0,375" arrives here as 375: a comma followed by exactly three digits is read as a thousands separator.
  if (v > 1 && Number.isInteger(v) && Math.abs(v / 1000 - answer) <= PROB_TOL) {
    return `That was read as the whole number ${v}. Type the decimal with a point, like 0.${String(v).padStart(3, '0')}, or give the fraction.`;
  }
  if (v < 0 || v > 1) return 'A probability lies between 0 and 1.';
  if (Math.abs(v - answer) < 0.006) return 'Very close, but rounded too roughly. Give 3 decimal places, or the exact fraction.';
  return null;
};

/** The standard wording for how to type a probability. Steps that use it set `tolerance: PROB_TOL`. */
export const PROB_HOW = 'Give a fraction, or a decimal rounded to 3 decimal places.';
export const PROB_TOL = 0.0006;
