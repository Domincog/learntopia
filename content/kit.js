/**
 * Authoring kit: small helpers for writing lessons.
 *
 *   import { r, frac, signed, linear } from '../../../kit.js';
 *
 * `r` is the important one. Lesson text is full of backslashes (TeX), and in
 * an ordinary JS string "\frac" silently turns into a form-feed + "rac".
 * Write every string that contains TeX with the r tag and backslashes just
 * work:
 *
 *   text: r`The slope is $\frac{\text{rise}}{\text{run}}$.`
 *
 * Interpolation still works inside an r string:  r`Solve $${a}x = ${a * x}$`
 */
import { formatNumber } from '../src/core/mathexpr.js';

export { dist, midpoint, angleDeg, polygonArea, perimeter, slopeOf, near } from '../src/core/geom.js';

/** Raw template tag: backslashes are kept as typed. */
export const r = String.raw;

export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
export const lcm = (a, b) => (a && b ? Math.abs(a * b) / gcd(a, b) : 0);

/** Round to `places` decimals (default 2), avoiding float fuzz. */
export const round = (v, places = 2) => { const p = Math.pow(10, places); return Math.round((v + Number.EPSILON) * p) / p; };

/** A number as plain text with at most `digits` decimals: 0.30000000004 -> "0.3". ASCII minus (safe inside math). */
export const num = (v, digits = 4) => formatNumber(typeof v === 'string' && v.trim() !== '' ? Number(v) : v, digits).replace('−', '-');

/**
 * A reduced fraction as TeX: frac(6, 8) -> "\frac{3}{4}", frac(6, 3) -> "2", frac(-1, 2) -> "-\frac{1}{2}".
 * Pass { dfrac: true } for a full-size fraction inside running text.
 */
export function frac(n, d, { dfrac = false } = {}) {
  if (d === 0) return '\\text{undefined}';
  const g = gcd(n, d) || 1;
  let a = n / g;
  let b = d / g;
  if (b < 0) { a = -a; b = -b; }
  if (b === 1) return String(a);
  return `${a < 0 ? '-' : ''}\\${dfrac ? 'dfrac' : 'frac'}{${Math.abs(a)}}{${b}}`;
}

/** "+ 3" / "- 3", for building expressions such as "2x - 3". */
export const signed = (v, digits = 4) => (v < 0 ? `- ${num(-v, digits)}` : `+ ${num(v, digits)}`);

/** A coefficient next to a variable: term(1) -> "x", term(-1) -> "-x", term(3) -> "3x", term(2, 'y') -> "2y" */
export const term = (c, v = 'x') => (c === 1 ? v : c === -1 ? `-${v}` : `${num(c)}${v}`);

/** TeX for a·x + b with tidy signs: linear(2, -3) -> "2x - 3", linear(1, 0) -> "x", linear(0, 5) -> "5" */
export function linear(a, b, v = 'x') {
  if (a === 0) return num(b);
  if (b === 0) return term(a, v);
  return `${term(a, v)} ${signed(b)}`;
}

/** plural(1, 'apple') -> "1 apple", plural(3, 'apple') -> "3 apples", plural(2, 'box', 'boxes') */
export const plural = (n, word, many) => `${n} ${n === 1 ? word : (many || word + 's')}`;

/** Ordinal: 1 -> "1st", 22 -> "22nd" */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Integer list: range(3) -> [0,1,2]; range(2, 5) -> [2,3,4] */
export function range(a, b) {
  const lo = b === undefined ? 0 : a;
  const hi = b === undefined ? a : b;
  return Array.from({ length: Math.max(0, hi - lo) }, (_, i) => lo + i);
}

export const sum = (arr) => arr.reduce((t, v) => t + v, 0);
export const mean = (arr) => (arr.length ? sum(arr) / arr.length : NaN);
export function median(arr) {
  const a = arr.slice().sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/**
 * Build multiple-choice options from a correct value and distractors,
 * dropping any distractor that equals the answer or repeats another.
 * Each distractor is a value or [value, 'why it is wrong'].
 *
 *   options: numberOptions(12, [10, [14, 'That adds instead of multiplying.'], 24])
 */
export function numberOptions(answer, distractors, format = (v) => `$${num(v)}$`) {
  const seen = new Set([num(answer)]);
  const out = [{ text: format(answer), correct: true }];
  for (const d of distractors) {
    const [value, why] = Array.isArray(d) ? d : [d, undefined];
    if (!Number.isFinite(value)) continue;
    const key = num(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(why ? { text: format(value), why } : { text: format(value) });
  }
  return out;
}
