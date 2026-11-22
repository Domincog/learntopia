/**
 * Small helpers shared by the Algebra II: Functions & Growth lessons.
 */
import { num } from '../../kit.js';

/** A number with thousands separators: commas(1048576) -> "1,048,576", commas(6553.6) -> "6,553.6". */
export const commas = (n) => {
  const sign = n < 0 ? '-' : '';
  const [whole, part] = String(Math.abs(n)).split('.');
  return sign + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (part ? `.${part}` : '');
};

/** The same number for use inside math, where a bare comma would get a gap after it: texCommas(1024) -> "1{,}024". */
export const texCommas = (n) => commas(n).replace(/,/g, '{,}');

/**
 * ax² + bx + c with tidy terms, as TeX that the answer checker can also read:
 * quadratic(2, -5, -3) -> "2x^2 - 5x - 3", quadratic(1, 0, 4) -> "x^2 + 4", quadratic(-1, 1, 0) -> "-x^2 + x".
 */
export function quadratic(a, b, c, v = 'x') {
  const lead = `${a === 1 ? '' : a === -1 ? '-' : num(a)}${v}^2`;
  const mid = b === 0 ? '' : ` ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : num(Math.abs(b))}${v}`;
  const end = c === 0 ? '' : ` ${c < 0 ? '-' : '+'} ${num(Math.abs(c))}`;
  return `${lead}${mid}${end}`;
}

/** The four inequality signs, as the learner sees them and as TeX. */
export const SIGNS = ['<', '≤', '>', '≥'];
export const SIGN_TEX = { '<': '<', '≤': '\\le', '>': '>', '≥': '\\ge' };
/** The sign after both sides are multiplied or divided by a negative number. */
export const FLIPPED = { '<': '>', '≤': '≥', '>': '<', '≥': '≤' };

/** A dropdown blank for a `fill` template with the four signs, the right one starred. */
export const signBlank = (sign) => `[[${SIGNS.map((s) => (s === sign ? `*${s}` : s)).join('|')}]]`;

/** A plot window in which one unit is about as long across as it is up, with the origin in the middle. */
export const SQUARE = { x: [-6, 6], y: [-4, 4] };
