/**
 * Helpers for the linear algebra course.
 *
 * Conventions used in every lesson:
 *   - a vector is written as a column, a matrix acts on the vector to its right;
 *   - in JavaScript a matrix is written as its two ROWS, [[a, b], [c, d]], so that the
 *     code reads like the matrix on the page. Its columns are (a, c) and (b, d);
 *   - AB means "do B first, then A".
 */
import { r, num } from '../../kit.js';

/** A column vector as TeX. Entries may be numbers or ready-made TeX. */
const cell = (v) => (typeof v === 'number' ? num(v) : String(v));
export const vec = (x, y) => r`\begin{pmatrix} ${cell(x)} \\ ${cell(y)} \end{pmatrix}`;
/** A longer column vector as TeX: col(1, 2, 3). */
export const col = (...vs) => r`\begin{pmatrix} ${vs.map(cell).join(r` \\ `)} \end{pmatrix}`;
/** A 2×2 matrix as TeX, from its rows [[a, b], [c, d]]. */
export const mat = (m) => r`\begin{pmatrix} ${cell(m[0][0])} & ${cell(m[0][1])} \\ ${cell(m[1][0])} & ${cell(m[1][1])} \end{pmatrix}`;
/** The same with the first column in blue and the second in orange, as the widgets draw them. */
export const cmat = (m) => r`\begin{pmatrix} \blue{${cell(m[0][0])}} & \orange{${cell(m[0][1])}} \\ \blue{${cell(m[1][0])}} & \orange{${cell(m[1][1])}} \end{pmatrix}`;

/** A number inside a product or a power: negatives get brackets. */
export const par = (v) => (v < 0 ? `(${num(v)})` : num(v));

/**
 * "3u - 2v" with the vectors written out as columns: lin(3, [2, 1], -2, [0, 1]).
 * A coefficient of 1 is left out and a negative second coefficient becomes a subtraction.
 */
export function lin(k1, v1, k2, v2) {
  const first = `${k1 === 1 ? '' : k1 === -1 ? '-' : `${num(k1)}\\,`}${vec(v1[0], v1[1])}`;
  const size = Math.abs(k2);
  return `${first} ${k2 < 0 ? '-' : '+'} ${size === 1 ? '' : `${num(size)}\\,`}${vec(v2[0], v2[1])}`;
}
/** The two columns of a matrix written as rows. */
export const cols = (m) => [[m[0][0], m[1][0]], [m[0][1], m[1][1]]];

/* ------------------------------------------------------------ arithmetic */
export const dot = (u, v) => u.x * v.x + u.y * v.y;
/** Matrix times column vector. */
export const apply = (m, v) => ({ x: m[0][0] * v.x + m[0][1] * v.y, y: m[1][0] * v.x + m[1][1] * v.y });
/** The product AB: "first B, then A". */
export const mul = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
export const det = (m) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
export const sameMatrix = (A, B) => A.every((row, i) => row.every((v, j) => Math.abs(v - B[i][j]) < 1e-9));

/** A fill-in table for a 2×2 matrix: one blank per entry, laid out like the matrix. */
export const matrixBlanks = (m, name = '') => [
  `| ${name} | 1st column | 2nd column |`,
  '|:--|:--:|:--:|',
  `| top row | [[${num(m[0][0])}]] | [[${num(m[0][1])}]] |`,
  `| bottom row | [[${num(m[1][0])}]] | [[${num(m[1][1])}]] |`,
].join('\n');

/** Fill-in blanks for a column vector: one blank per number. */
export const vecBlanks = (x, y) => `Top number: [[${num(x)}]]\n\nBottom number: [[${num(y)}]]`;

/** The transformations the course keeps coming back to. */
export const TURN = [[0, -1], [1, 0]];        // a quarter turn anticlockwise
export const SHEAR = [[1, 1], [0, 1]];        // push the top one step to the right
export const IDENTITY = [[1, 0], [0, 1]];
