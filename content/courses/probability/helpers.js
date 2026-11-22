/**
 * Probability & Chance · helpers shared by this course's lessons.
 *
 * Two dice are always written (a, b): a is the BLUE die (rows of the
 * dice-grid widget), b is the ORANGE die (columns). A cell's index in the
 * widget's state is (a − 1) · 6 + (b − 1).
 */
import { gcd } from '../../kit.js';

/** All 36 outcomes of two dice as [a, b] pairs, in dice-grid order. */
export const DICE = [];
for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) DICE.push([a, b]);

/** dice-grid cell indices of the outcomes where test(a, b) is true. */
export const diceWhere = (test) => DICE.map(([a, b], i) => (test(a, b) ? i : -1)).filter((i) => i >= 0);

/** How many of the 36 outcomes satisfy test(a, b). */
export const diceCount = (test) => DICE.filter(([a, b]) => test(a, b)).length;

/** The outcomes that satisfy test(a, b) as text: "(1, 6), (2, 5), …". */
export const dicePairs = (test) => DICE.filter(([a, b]) => test(a, b)).map(([a, b]) => `(${a}, ${b})`).join(', ');

/** Do two lists of cell indices describe exactly the same set? */
export function sameCells(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const set = new Set(b);
  return a.every((v) => set.has(v));
}

/** A reduced fraction as plain text, for `answer` and `display`: fracText(6, 36) → "1/6", fracText(4, 2) → "2". */
export function fracText(n, d) {
  const g = gcd(n, d) || 1;
  const a = n / g;
  const b = d / g;
  return b === 1 ? String(a) : `${a}/${b}`;
}

/** TeX for a fraction exactly as given (not reduced): rawFrac(6, 36) → "\frac{6}{36}". */
export const rawFrac = (n, d) => `\\frac{${n}}{${d}}`;

/** A probability as a tidy percentage string: pct(0.0918) → "9.2", pct(0.5) → "50". */
export function pct(p, digits = 1) {
  const k = Math.pow(10, digits);
  return String(Math.round(p * 100 * k) / k);
}

/**
 * A two-stage probability tree as a static `svg` figure.
 *
 *   treeFigure({
 *     titles: ['blue die', 'orange die'],                      // captions above the two stages
 *     first:  [{ label: '5 or 6', p: '1/3' }, { label: '1 to 4', p: '2/3' }],
 *     second: [[{ label: '5 or 6', p: '1/3' }, { label: '1 to 4', p: '2/3' }],     // after the first branch
 *              [{ label: '5 or 6', p: '1/3' }, { label: '1 to 4', p: '2/3' }]],    // after the second branch
 *     leaves: ['1/9', '2/9', '2/9', '4/9'],                    // result at the end of each path, top to bottom
 *     colors: ['blue', 'orange'],                              // hue of each stage
 *     highlight: [0],                                          // paths (0–3) to emphasise
 *     alt: '…',
 *   })
 */
export function treeFigure({ titles = ['', ''], first, second, leaves = [], colors = ['blue', 'orange'], highlight = [], alt = '', maxWidth = 440 }) {
  const y1 = [78, 190];
  const y2 = [[46, 110], [158, 222]];
  const hot = new Set(highlight);
  let out = '';
  const edge = (xa, ya, xb, yb, strong) => `<path class="${strong ? 'stroke-ink' : 'stroke-ink-3'} fill-none" stroke-width="${strong ? 3 : 2.5}" stroke-linecap="round" d="M${xa} ${ya} L${xb} ${yb}"/>`;
  const pill = (cx, cy, w, text, hue) => `<rect class="fill-${hue}-soft stroke-${hue}" stroke-width="2.5" x="${cx - w / 2}" y="${cy - 15}" width="${w}" height="30" rx="15"/>`
    + `<text class="fig-label" x="${cx}" y="${cy + 5}" text-anchor="middle">${text}</text>`;
  const prob = (x, y, text) => `<text class="fig-label-sm" x="${x}" y="${y}" text-anchor="middle">${text}</text>`;
  out += `<text class="fig-label-sm" style="fill:var(--ink-3)" x="134" y="14" text-anchor="middle">${titles[0]}</text>`;
  out += `<text class="fig-label-sm" style="fill:var(--ink-3)" x="286" y="14" text-anchor="middle">${titles[1]}</text>`;
  for (let i = 0; i < 2; i++) {
    const strong1 = hot.has(2 * i) || hot.has(2 * i + 1);
    out += edge(16, 134, 92, y1[i], strong1);
    out += prob(44, i === 0 ? 94 : 182, first[i].p);
    for (let j = 0; j < 2; j++) {
      const strong2 = hot.has(2 * i + j);
      out += edge(176, y1[i], 244, y2[i][j], strong2);
      out += prob(208, j === 0 ? (y1[i] + y2[i][j]) / 2 - 8 : (y1[i] + y2[i][j]) / 2 + 18, second[i][j].p);
      out += pill(286, y2[i][j], 84, second[i][j].label, colors[1]);
      out += `<text class="${strong2 ? 'fig-label-lg' : 'fig-label'}"${strong2 ? '' : ' style="fill:var(--ink-3)"'} x="396" y="${y2[i][j] + (strong2 ? 7 : 5)}" text-anchor="end">${leaves[2 * i + j] ?? ''}</text>`;
    }
    out += pill(134, y1[i], 84, first[i].label, colors[0]);
  }
  out += '<circle class="fill-ink" cx="16" cy="134" r="5"/>';
  return { type: 'svg', viewBox: '0 0 400 244', maxWidth, alt, content: out };
}

/**
 * A `feedback` function for numeric steps whose answer is an exact fraction: it catches
 * answers that are right in spirit but rounded too roughly (0.14 for 5/36).
 */
export const nearMiss = (target, ask = 'Give the exact fraction.') => (value) => (Math.abs(value - target) < 0.006 ? `Very close, but rounded. ${ask}` : null);

/** 1234567 → "1,234,567" (plain ASCII, safe inside text and TeX). */
export const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
