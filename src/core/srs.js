/**
 * Spaced-repetition scheduler.
 *
 * This is a compact implementation of the open FSRS model (Free Spaced
 * Repetition Scheduler, by Jarrett Ye and contributors): each review item
 * carries a *stability* S (days until recall probability falls to 90%) and a
 * *difficulty* D (1–10). After each review both are updated from the grade and
 * from how much the memory had decayed, and the next review is scheduled for
 * when predicted recall drops to the learner's target retention.
 *
 * Why this instead of fixed 1-3-7-day boxes: the gain from a review depends
 * on how close to forgetting you were. Reviewing something you still know
 * cold barely helps; retrieving it just before it slips away helps a lot.
 * The model captures that, so reviews land where they do the most good.
 *
 * Pure functions, no DOM: unit-tested in tests/srs.test.mjs.
 */

export const DAY_MS = 86400000;

export const Grade = Object.freeze({ Again: 1, Hard: 2, Good: 3, Easy: 4 });

/** FSRS-5 default parameters (fitted on a large public review dataset). */
export const DEFAULT_W = Object.freeze([
  0.40255, 1.18385, 3.173, 15.69105, // initial stability for Again / Hard / Good / Easy
  7.1949, 0.5345,                   // initial difficulty
  1.4604, 0.0046,                   // difficulty update + mean reversion
  1.54575, 0.1192, 1.01925,         // stability growth after a successful recall
  1.9395, 0.11, 0.29605, 2.2698,    // stability after forgetting
  0.2315, 2.9898,                   // hard penalty, easy bonus
  0.51655, 0.6621,                  // same-day reviews
]);

const DECAY = -0.5;
const FACTOR = 19 / 81; // makes R(t = S) exactly 0.9

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Probability of recall after `elapsedDays` for a memory with `stability`. */
export function retrievability(elapsedDays, stability) {
  if (!(stability > 0)) return 0;
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

/** Days until recall probability decays to `retention`. */
export function intervalFor(stability, retention = 0.9) {
  return (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
}

const initStability = (g, w) => Math.max(0.1, w[g - 1]);
const initDifficulty = (g, w) => w[4] - Math.exp(w[5] * (g - 1)) + 1;

function nextDifficulty(d, g, w) {
  const delta = -w[6] * (g - 3);
  const damped = d + (delta * (10 - d)) / 9;             // harder to move near the ceiling
  const reverted = w[7] * initDifficulty(4, w) + (1 - w[7]) * damped; // drift back toward "easy"
  return clamp(reverted, 1, 10);
}

function stabilityAfterRecall(d, s, r, g, w) {
  const hardPenalty = g === Grade.Hard ? w[15] : 1;
  const easyBonus = g === Grade.Easy ? w[16] : 1;
  const growth = Math.exp(w[8]) * (11 - d) * Math.pow(s, -w[9]) * (Math.exp((1 - r) * w[10]) - 1);
  return s * (1 + growth * hardPenalty * easyBonus);
}

function stabilityAfterLapse(d, s, r, w) {
  const next = w[11] * Math.pow(d, -w[12]) * (Math.pow(s + 1, w[13]) - 1) * Math.exp((1 - r) * w[14]);
  return Math.min(next, s);
}

const stabilitySameDay = (s, g, w) => s * Math.exp(w[17] * (g - 3 + w[18]));

function startOfDay(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Apply a review and return the updated card.
 *
 * @param {object|null} card  { s, d, last, due, reps, lapses } or null for a brand-new item
 * @param {1|2|3|4} grade
 * @param {number} now        timestamp (ms)
 * @param {{ retention?: number, maxInterval?: number, w?: number[] }} [opts]
 */
export function schedule(card, grade, now, opts = {}) {
  const w = opts.w || DEFAULT_W;
  const retention = clamp(opts.retention || 0.9, 0.7, 0.97);
  const maxInterval = opts.maxInterval || 365;
  const isNew = !card || !card.reps;
  let s;
  let d;

  if (isNew) {
    s = initStability(grade, w);
    d = clamp(initDifficulty(grade, w), 1, 10);
  } else {
    const elapsed = Math.max(0, (now - card.last) / DAY_MS);
    const r = retrievability(elapsed, card.s);
    if (elapsed < 0.5) s = stabilitySameDay(card.s, grade, w);
    else if (grade === Grade.Again) s = stabilityAfterLapse(card.d, card.s, r, w);
    else s = stabilityAfterRecall(card.d, card.s, r, grade, w);
    d = nextDifficulty(card.d, grade, w);
  }

  s = clamp(s, 0.05, 36500);
  let interval = Math.round(intervalFor(s, retention));
  if (grade === Grade.Again) interval = 1; // relearn tomorrow (and again later this session)
  interval = clamp(interval, 1, maxInterval);

  return {
    s: Math.round(s * 1000) / 1000,
    d: Math.round(d * 1000) / 1000,
    last: now,
    due: startOfDay(now) + interval * DAY_MS,
    ivl: interval,
    reps: (card && card.reps ? card.reps : 0) + 1,
    lapses: (card && card.lapses ? card.lapses : 0) + (!isNew && grade === Grade.Again ? 1 : 0),
  };
}

/** Current recall probability of a card. */
export function recallNow(card, now) {
  if (!card || !card.reps) return 0;
  return retrievability((now - card.last) / DAY_MS, card.s);
}

export const isDue = (card, now) => !!card && card.reps > 0 && card.due <= now;

/**
 * Turn what happened on a question into a grade.
 *  - wrong / gave up               -> Again
 *  - right, but needed a hint, a second try, or was only guessing -> Hard
 *  - right first time              -> Good
 *  - right first time and certain  -> Easy
 */
export function gradeFrom({ correct, attempts = 1, hints = 0, revealed = false, confidence = null }) {
  if (!correct || revealed) return Grade.Again;
  if (attempts > 2) return Grade.Again;
  if (attempts > 1 || hints > 0 || confidence === 'guess') return Grade.Hard;
  if (confidence === 'sure') return Grade.Easy;
  return Grade.Good;
}

/** A friendly label for how well-established a memory is. */
export function maturity(card) {
  if (!card || !card.reps) return { key: 'new', label: 'New' };
  if (card.s < 3) return { key: 'learning', label: 'Learning' };
  if (card.s < 10) return { key: 'growing', label: 'Growing' };
  if (card.s < 30) return { key: 'solid', label: 'Solid' };
  return { key: 'strong', label: 'Long-term' };
}

/**
 * Order due items so that neighbours come from different lessons where
 * possible (interleaving), weakest memories first.
 * @param {{ id: string, group: string, r: number }[]} items
 */
export function interleave(items) {
  const pool = items.slice().sort((a, b) => a.r - b.r);
  const out = [];
  let lastGroup = null;
  while (pool.length) {
    let idx = pool.findIndex((it) => it.group !== lastGroup);
    if (idx === -1) idx = 0;
    const [it] = pool.splice(idx, 1);
    out.push(it);
    lastGroup = it.group;
  }
  return out;
}
