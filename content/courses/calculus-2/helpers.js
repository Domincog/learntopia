/**
 * Helpers shared by the Calculus II lessons: tidy TeX and typed expressions
 * for the small family of functions the course differentiates and integrates.
 */
import { num } from '../../kit.js';

/** A coefficient in front of something: coef(1) -> "", coef(-1) -> "-", coef(3) -> "3". */
export const coef = (c) => (c === 1 ? '' : c === -1 ? '-' : num(c));

/** c·x as TeX or as a typed expression: cx(1) -> "x", cx(-1) -> "-x", cx(3) -> "3x". */
export const cx = (c, v = 'x') => `${coef(c)}${v}`;

/** "+ 3" / "- 3" */
export const plus = (v) => (v < 0 ? `- ${num(-v)}` : `+ ${num(v)}`);

/**
 * a·x + b with tidy signs, written so that the first term is never negative when that can be avoided:
 * lin(2, -3) -> "2x - 3", lin(-1, 4) -> "4 - x", lin(-2, -1) -> "-2x - 1", lin(3, 0) -> "3x".
 */
export function lin(a, b, v = 'x') {
  if (b === 0) return cx(a, v);
  if (a < 0 && b > 0) return `${num(b)} - ${cx(-a, v)}`;
  return `${cx(a, v)} ${plus(b)}`;
}

/** A number that multiplies a bracket or a function, with a sign that reads well after "×": times(-2) -> "(-2)". */
export const bracketNeg = (v) => (v < 0 ? `(${num(v)})` : num(v));

/** n! for small n. */
export const factorial = (n) => { let out = 1; for (let i = 2; i <= n; i++) out *= i; return out; };

/** A markdown table from a header row and rows of cells (all centred). */
export function table(head, rows) {
  const line = (cells) => `| ${cells.join(' | ')} |`;
  return [line(head), line(head.map(() => ':---:')), ...rows.map(line)].join('\n');
}

/** Inline code in lesson text, for use inside r`…` strings (which cannot contain a backtick): code('e^(2x)'). */
export const code = (text) => '`' + text + '`';

/** The angle n·π/d as TeX: piFrac(0, 1) -> "0", piFrac(1, 1) -> "\pi", piFrac(2, 3) -> "\frac{2\pi}{3}". */
export function piFrac(n, d = 1) {
  if (n === 0) return '0';
  const top = `${n === 1 ? '' : n === -1 ? '-' : n}\\pi`;
  return d === 1 ? top : `\\frac{${top}}{${d}}`;
}

/** n·π/d as plain text for a figure: piText(1, 2) -> "π/2", piText(-1) -> "−π", piText(0) -> "0". */
export function piText(n, d = 1) {
  if (n === 0) return '0';
  return `${n < 0 ? '−' : ''}${Math.abs(n) === 1 ? '' : Math.abs(n)}π${d === 1 ? '' : `/${d}`}`;
}

/**
 * Numbers for the x-axis of a plot, written along the bottom edge of the window instead of under the axis.
 * A wave crosses the axis exactly at its tick marks, and the plot draws curves on top of its own tick
 * labels, so labels under the axis would be hidden. Spread the result into a plot spec:
 *
 *   { type: 'plot', y: [-1.5, 1.5], ...bottomAxis([[0, '0'], [Math.PI, 'π']], -1.5), fns: [...] }
 *
 * `marks` is a list of [x, text]; `y` is the bottom of the window. Extra labels can be passed as `more`.
 */
export function bottomAxis(marks, y, more = []) {
  return {
    xFormat: () => '',
    labels: [...marks.map(([x, text]) => ({ x, y, text, anchor: 'middle', dy: -8, color: 'gray' })), ...more],
  };
}

/** bottomAxis for multiples of π: piAxis([[0], [1, 2], [1], [3, 2], [2]], -1.5). */
export const piAxis = (marks, y, more = []) => bottomAxis(marks.map(([n, d = 1]) => [(n * Math.PI) / d, piText(n, d)]), y, more);
