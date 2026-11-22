/**
 * Helpers shared by the Data & Statistics lessons: small formatting tools,
 * summary statistics, and the invented data sets the figures use.
 *
 * Every data set here is made up. Where a generator needs "random" values it
 * uses a fixed seed, so the numbers quoted in the lesson text stay true.
 */
import { makeRng } from '../../../src/core/rng.js';

export const WORDS = { 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Eleven', 12: 'Twelve' };

/** "3, 5, 8" */
export const listOf = (values) => values.join(', ');

/** 20000 -> "20,000" */
export const thousands = (v) => Number(v).toLocaleString('en-US');

/* ------------------------------------------------------------- statistics */

const total = (a) => a.reduce((t, v) => t + v, 0);
const middle = (a) => { const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const clean = (v) => Math.round(v * 1e6) / 1e6;

/**
 * Five-number summary and spread of a list.
 * Quartiles are the medians of the lower and upper half; when the count is
 * odd, the median itself belongs to neither half. SD divides by n.
 */
export function describe(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const n = sorted.length;
  const avg = total(sorted) / n;
  const half = Math.floor(n / 2);
  const q1 = n > 1 ? middle(sorted.slice(0, half)) : sorted[0];
  const q3 = n > 1 ? middle(sorted.slice(n - half)) : sorted[0];
  return {
    sorted, n, sum: clean(total(sorted)), mean: clean(avg), median: clean(middle(sorted)),
    min: sorted[0], max: sorted[n - 1], range: clean(sorted[n - 1] - sorted[0]),
    q1: clean(q1), q3: clean(q3), iqr: clean(q3 - q1),
    sd: clean(Math.sqrt(total(sorted.map((v) => (v - avg) ** 2)) / n)),
  };
}

/** Pearson correlation of [[x, y], …]. */
export function correlation(points) {
  const n = points.length;
  const mx = total(points.map((p) => p[0])) / n;
  const my = total(points.map((p) => p[1])) / n;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const [x, y] of points) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

/** Least-squares line through [[x, y], …]: { slope, intercept }. */
export function bestFit(points) {
  const n = points.length;
  const mx = total(points.map((p) => p[0])) / n;
  const my = total(points.map((p) => p[1])) / n;
  let sxx = 0;
  let sxy = 0;
  for (const [x, y] of points) { sxx += (x - mx) ** 2; sxy += (x - mx) * (y - my); }
  const slope = sxx ? sxy / sxx : 0;
  return { slope, intercept: my - slope * mx };
}

/* ------------------------------------------------------- random building blocks */

/** A standard normal draw (Box–Muller) from a seeded rng. */
export function gauss(rng) {
  const u = Math.max(rng.next(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng.next());
}

/** n standard scores: mean exactly 0, SD exactly 1, none further out than about 2.4. */
function standardScores(rng, n) {
  const raw = [];
  while (raw.length < n) { const z = gauss(rng); if (Math.abs(z) <= 2.1) raw.push(z); }
  const m = total(raw) / n;
  const sd = Math.sqrt(total(raw.map((v) => (v - m) ** 2)) / n);
  return raw.map((v) => (v - m) / sd);
}

/**
 * A cloud of n points whose correlation is EXACTLY r, scaled to sit inside
 * the box [lo, hi] × [lo, hi]. Works by making the noise exactly uncorrelated
 * with x before mixing: y = r·x + sqrt(1 − r²)·noise.
 */
export function cloud(rng, n, r, { lo = 0, hi = 10, digits = 2 } = {}) {
  const x = standardScores(rng, n);
  let e = standardScores(rng, n);
  const dot = total(e.map((v, i) => v * x[i])) / n;
  e = e.map((v, i) => v - dot * x[i]);
  const sd = Math.sqrt(total(e.map((v) => v * v)) / n);
  e = e.map((v) => v / sd);
  const y = x.map((v, i) => r * v + Math.sqrt(Math.max(0, 1 - r * r)) * e[i]);
  const mid = (lo + hi) / 2;
  const scale = (hi - lo) / 6.4;
  const p = 10 ** digits;
  const fit = (v) => Math.round(Math.min(hi, Math.max(lo, mid + v * scale)) * p) / p;
  return x.map((v, i) => [fit(v), fit(y[i])]);
}

/** A fixed-seed generator for the invented data sets below. */
export const seeded = (seed) => makeRng(seed);

/* ------------------------------------------------------ invented data sets */

const one = (v) => Math.round(v * 10) / 10;
const between = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** n draws from a normal distribution, kept inside [lo, hi], one decimal. */
function normalSample(rng, n, mean, sd, lo, hi) {
  const out = [];
  while (out.length < n) {
    const v = mean + sd * gauss(rng);
    if (v >= lo && v <= hi) out.push(one(v));
  }
  return out;
}

/** n draws from a right-skewed (log-normal) distribution with the given median. */
function skewedSample(rng, n, median, sigma, lo, hi) {
  const out = [];
  while (out.length < n) {
    const v = median * Math.exp(sigma * gauss(rng));
    if (v >= lo && v <= hi) out.push(one(v));
  }
  return out;
}

/**
 * Minutes it took 160 students to get to school: 80 who walk or cycle
 * (around 14 minutes) and 80 who come by bus (around 30 minutes).
 */
export const JOURNEYS = (() => {
  const rng = makeRng(20240);
  return [...normalSample(rng, 80, 14, 3.5, 2, 44), ...normalSample(rng, 80, 30, 4.5, 2, 44)];
})();

/** Heights of 400 adult women, in cm: bell-shaped around 165. */
export const HEIGHTS = normalSample(makeRng(1650), 400, 165, 7, 141, 189);

/** Yearly incomes of 300 people in a made-up town, in thousands: a long tail to the right. */
export const INCOMES = skewedSample(makeRng(3600), 300, 36, 0.5, 6, 158);

/** Marks out of 100 on an easy quiz, 200 students: piled up near the top, tail to the left. */
export const QUIZ = skewedSample(makeRng(8800), 200, 13, 0.55, 1, 78).map((v) => one(between(100 - v, 20, 100)));

/** Fourteen summer days at a beach kiosk: [noon temperature in °C, ice creams sold]. */
export const ICE = [
  [16, 70], [17, 50], [19, 110], [20, 85], [21, 120], [22, 100], [24, 150],
  [25, 125], [26, 175], [27, 160], [28, 190], [29, 170], [31, 230], [33, 215],
];
