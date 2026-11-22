/**
 * Helpers shared by the calculus lessons.
 *
 * A polynomial is a list of [coefficient, power] pairs, highest power first:
 *   3x² − 4x + 1  is  [[3, 2], [-4, 1], [1, 0]]
 */
import { num } from '../../kit.js';

const clean = (terms) => terms.filter(([c]) => c !== 0);

function write(terms, v, power) {
  const list = clean(terms);
  if (!list.length) return '0';
  return list.map(([c, p], i) => {
    const size = Math.abs(c);
    const coef = size === 1 && p !== 0 ? '' : num(size);
    const body = p === 0 ? coef : p === 1 ? `${coef}${v}` : `${coef}${v}${power(p)}`;
    if (i === 0) return c < 0 ? `-${body}` : body;
    return c < 0 ? ` - ${body}` : ` + ${body}`;
  }).join('');
}

/** TeX for a polynomial: polyTex([[3, 2], [-4, 1], [1, 0]]) -> "3x^{2} - 4x + 1" */
export const polyTex = (terms, v = 'x') => write(terms, v, (p) => `^{${p}}`);

/** The same polynomial as a typed expression (for `expr` answers): "3x^2 - 4x + 1" */
export const polyExpr = (terms, v = 'x') => write(terms, v, (p) => `^${p}`);

/** Derivative, term by term (power rule). */
export const derive = (terms) => clean(terms).filter(([, p]) => p > 0).map(([c, p]) => [c * p, p - 1]);

/** Antiderivative with constant 0 (coefficients may come out as fractions). */
export const antiderive = (terms) => clean(terms).map(([c, p]) => [c / (p + 1), p + 1]);

/** Value of a polynomial at x. */
export const evalPoly = (terms, x) => terms.reduce((total, [c, p]) => total + c * Math.pow(x, p), 0);

/** Left- or right-rectangle total for f on [a, b] with n rectangles. */
export function rectSum(f, a, b, n, mode = 'left') {
  const w = (b - a) / n;
  let total = 0;
  for (let k = 0; k < n; k++) total += f(a + (mode === 'right' ? k + 1 : k) * w) * w;
  return total;
}

/** A two-column markdown table from rows of cells, right-aligned. */
export function table(head, rows) {
  const line = (cells) => `| ${cells.join(' | ')} |`;
  return [line(head), line(head.map(() => '---:')), ...rows.map(line)].join('\n');
}
