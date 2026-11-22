/**
 * Helpers shared by the lessons of "Proofs: How to Be Certain".
 * Pure functions only, so tests/proofs-course.test.mjs can check them (and
 * the lesson generators that rely on them) without a browser.
 */

/** Is n a prime number? (trial division; fine for the small numbers used in lessons) */
export function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false;
  return true;
}

const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));

/**
 * A tiling of a size × size board (size a power of 2) with one square removed, by L-shaped
 * trominoes: Golomb's construction. Split the board into four quarters, lay one tromino round
 * the centre so that it takes one square from each quarter that is still whole, and carry on
 * inside each quarter. Returns the pieces as sorted lists of square indices (row-major).
 */
export function trominoTiling(size, hole) {
  const pieces = [];
  const fill = (top, left, n, gapRow, gapCol) => {
    if (n === 1) return;
    const half = n / 2;
    const piece = [];
    const gaps = [];
    for (const [qr, qc] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
      const inThis = gapRow >= top + qr * half && gapRow < top + (qr + 1) * half && gapCol >= left + qc * half && gapCol < left + (qc + 1) * half;
      // the square of this quarter that touches the centre of the board
      const cr = top + half - 1 + qr;
      const cc = left + half - 1 + qc;
      if (inThis) gaps.push([qr, qc, gapRow, gapCol]);
      else { piece.push(cr * size + cc); gaps.push([qr, qc, cr, cc]); }
    }
    pieces.push(piece.sort((a, b) => a - b));
    for (const [qr, qc, r, c] of gaps) fill(top + qr * half, left + qc * half, half, r, c);
  };
  fill(0, 0, size, Math.floor(hole / size), hole % size);
  return pieces.sort((a, b) => a[0] - b[0]);
}

/** The squares of the tromino that Golomb's construction lays round the centre of a size × size board. */
export function centreTromino(size, hole) {
  const half = size / 2;
  const holeQuarter = (Math.floor(hole / size) < half ? 0 : 2) + (hole % size < half ? 0 : 1);
  const centre = [(half - 1) * size + half - 1, (half - 1) * size + half, half * size + half - 1, half * size + half];
  return centre.filter((_, q) => q !== holeQuarter);
}

/**
 * The positive fractions in lowest terms, in the order of the classic list: by the sum
 * top + bottom, and within one sum by increasing top. 1/1, 1/2, 2/1, 1/3, 3/1, 1/4, 2/3, …
 * Returns the first `count` of them as [top, bottom] pairs.
 */
export function fractionList(count) {
  const out = [];
  for (let sum = 2; out.length < count; sum++) {
    for (let top = 1; top < sum && out.length < count; top++) {
      const bottom = sum - top;
      if (gcd(top, bottom) === 1) out.push([top, bottom]);
    }
  }
  return out;
}

/** Position (counting from 1) of the whole number k in the list 0, 1, -1, 2, -2, 3, -3, … */
export const integerPosition = (k) => (k > 0 ? 2 * k : -2 * k + 1);

/** A static picture: squares of side 1 to `upTo`, each built from L-shaped layers, the newest layer in orange. */
export function layersFigure(upTo = 4) {
  const cell = 16;
  const gap = 26;
  let x = 8;
  let content = '';
  const height = upTo * cell + 34;
  for (let n = 1; n <= upTo; n++) {
    const top = 8 + (upTo - n) * cell;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const newest = r === 0 || c === n - 1; // the layer added last: the top row and the right-hand column
      content += `<rect class="${newest ? 'fill-orange' : 'fill-blue-soft'} stroke-ink" stroke-width="1.5" x="${x + c * cell}" y="${top + r * cell}" width="${cell}" height="${cell}" rx="2"/>`;
    }
    content += `<text class="fig-label-sm" x="${x + (n * cell) / 2}" y="${height - 8}" text-anchor="middle">+${2 * n - 1}</text>`;
    x += n * cell + gap;
  }
  return {
    type: 'svg', viewBox: `0 0 ${x - gap + 8} ${height}`, maxWidth: 380, content,
    alt: `${upTo} squares of tiles with sides 1 to ${upTo}. Each is the one before plus an L-shaped layer along the top and the right: layers of ${Array.from({ length: upTo }, (_, i) => 2 * i + 1).join(', ')} tiles.`,
  };
}

/** A static picture: the grid of fractions top/bottom with the diagonal sweep that lists them. */
export function fractionGrid(size = 5) {
  const cell = 52;
  const pad = 34;
  let content = '';
  const at = (top, bottom) => [pad + (top - 0.5) * cell, pad + (bottom - 0.5) * cell];
  // the sweep: one stroke per diagonal (top + bottom constant), from top = 1 downwards
  for (let sum = 2; sum <= size + 1; sum++) {
    const [x1, y1] = at(1, sum - 1);
    const [x2, y2] = at(sum - 1, 1);
    if (sum > 2) content += `<line class="stroke-blue" stroke-width="3" stroke-linecap="round" opacity="0.45" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  for (let bottom = 1; bottom <= size; bottom++) for (let top = 1; top <= size; top++) {
    if (top + bottom > size + 1) continue;
    const [x, y] = at(top, bottom);
    const repeat = gcd(top, bottom) > 1;
    content += `<circle class="${repeat ? 'fill-surface stroke-hair' : 'fill-blue-soft stroke-blue'}" stroke-width="2" cx="${x}" cy="${y}" r="19"/>`;
    content += `<text class="fig-label-sm${repeat ? ' text-muted' : ''}" x="${x}" y="${y + 4}" text-anchor="middle"${repeat ? ' text-decoration="line-through"' : ''}>${top}/${bottom}</text>`;
  }
  content += `<text class="fig-label-sm text-muted" x="${pad + (size * cell) / 2}" y="16" text-anchor="middle">top number →</text>`;
  content += `<text class="fig-label-sm text-muted" x="14" y="${pad + (size * cell) / 2}" text-anchor="middle" transform="rotate(-90 14 ${pad + (size * cell) / 2})">bottom number →</text>`;
  return {
    type: 'svg', viewBox: `0 0 ${pad + size * cell + 6} ${pad + size * cell + 6}`, maxWidth: 300, content,
    alt: 'A triangle of fractions. Fractions with the same top-plus-bottom sum lie on one diagonal line. Repeats such as 2/2, 2/4 and 4/2 are crossed out.',
  };
}

/** A multiple of 1/den as text in lowest terms: fractionText(0.375) -> '3/8'. */
export function fractionText(v, den = 64) {
  const top = Math.round(v * den);
  if (top === 0) return '0';
  const g = gcd(Math.abs(top), den);
  return den / g === 1 ? String(top / g) : `${top / g}/${den / g}`;
}
