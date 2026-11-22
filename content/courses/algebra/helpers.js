/**
 * Small helpers shared by the Algebra Foundations lessons.
 */
import { num } from '../../kit.js';

/**
 * Plot windows in which one unit is (almost exactly) as long on the x-axis as
 * on the y-axis, so that a slope of 1 really looks like 45°. The plot area of
 * the `plot` widget is about 1.53 times as wide as it is tall.
 */
export const CENTRED = { x: [-6, 6], y: [-4, 4] };      // origin in the middle
export const QUADRANT = { x: [-1, 11], y: [-1, 7] };     // mostly positive values
export const TALL = { x: [-6, 6], y: [-2, 6] };          // room above the x-axis

/** An expression string for the plot widget: lineExpr(-2, 3) -> "(-2)*x + (3)". */
export const lineExpr = (m, b) => `(${m})*x + (${b})`;

/** A point as TeX: point(2, -3) -> "(2, -3)". */
export const point = (x, y) => `(${num(x)}, ${num(y)})`;

/** "up 3" / "down 2": the direction and size of a change, in words. */
export const upDown = (v) => `${v < 0 ? 'down' : 'up'} ${num(Math.abs(v))}`;

/** A window for parabolas: room for a bowl above the axis and a little below. */
export const BOWL = { x: [-6, 6], y: [-4, 10] };

/**
 * x² + sx + p with tidy terms: quad(5, -6) -> "x^2 + 5x - 6", quad(-1, 0) -> "x^2 - x".
 * The result is valid TeX and also an expression the answer checker can read.
 */
export function quad(s, p) {
  const mid = s === 0 ? '' : ` ${s < 0 ? '-' : '+'} ${Math.abs(s) === 1 ? '' : num(Math.abs(s))}x`;
  const end = p === 0 ? '' : ` ${p < 0 ? '-' : '+'} ${num(Math.abs(p))}`;
  return `x^2${mid}${end}`;
}

/** One bracket as TeX: bracket(3) -> "(x + 3)", bracket(-2) -> "(x - 2)", bracket(0) -> "x". */
export const bracket = (n) => (n === 0 ? 'x' : `(x ${n < 0 ? '-' : '+'} ${num(Math.abs(n))})`);

/** Every pair of positive whole numbers with the given product, smaller first: factorPairs(12) -> [[1,12],[2,6],[3,4]]. */
export function factorPairs(n) {
  const out = [];
  for (let a = 1; a * a <= n; a++) if (n % a === 0) out.push([a, n / a]);
  return out;
}
