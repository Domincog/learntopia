/**
 * Progress rules: XP, levels, the daily goal, streaks with rest days, lesson
 * completion and review bookkeeping.
 *
 * Every function here is a plain function of the state document (see
 * store.js) and a timestamp, so the rules are easy to read, test and change.
 */
import { dayKey, addDays, diffDays, DAY_MS, lastDays, weekdayShort } from './dates.js';
import { schedule, recallNow, isDue, Grade, gradeFrom } from './srs.js';

/** XP awarded for things. Tuned so a typical lesson is worth ~100–130 XP. */
export const XP = Object.freeze({
  firstTry: 10,   // correct on the first attempt, no hints
  withHelp: 7,    // correct on the first attempt, used a hint
  retry: 5,       // correct after a wrong attempt
  revealed: 2,    // asked to see the solution (reading it still counts)
  predict: 3,     // made a prediction before being taught (no wrong answers)
  reflect: 6,     // wrote a self-explanation
  lessonDone: 20, // finishing a lesson
  perfect: 10,    // …with every question right first time
  review: 8,      // recalled a review item
  reviewMiss: 3,  // missed a review item (and then saw why)
  puzzle: 15,     // solved a puzzle
  dailyPuzzle: 25,
});

const LEVEL_TITLES = [
  'Curious', 'Tinkerer', 'Pattern Spotter', 'Guess Maker', 'Conjecturer',
  'Problem Solver', 'Lemma Collector', 'Proof Seeker', 'Theorem Tamer', 'Idea Weaver',
  'Deep Thinker', 'Polymath', 'Sage', 'Luminary', 'Legend',
];

/** Total XP needed to reach `level` (level 1 = 0 XP). Gaps grow by 50 each level. */
export const xpForLevel = (level) => 25 * (level - 1) * (level + 2);

export function levelInfo(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    level,
    title: LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1],
    base,
    next,
    into: xp - base,
    span: next - base,
    pct: (xp - base) / (next - base),
  };
}

export const GOALS = Object.freeze([
  { xp: 20, label: 'Light', note: 'about 5 minutes a day' },
  { xp: 40, label: 'Steady', note: 'about 10 minutes a day' },
  { xp: 80, label: 'Serious', note: 'about 20 minutes a day' },
  { xp: 150, label: 'Intense', note: 'about 35 minutes a day' },
]);

export const MAX_REST_DAYS = 2;

function dayRecord(state, key) {
  if (!state.days[key]) {
    state.days[key] = { xp: 0, lessons: 0, reviews: 0, answered: 0, correct: 0, ms: 0, puzzles: 0 };
  }
  return state.days[key];
}

export const srsOptions = (state) => ({ retention: state.settings.retention || 0.9 });

/* ------------------------------------------------------------------ streak */

/**
 * Reconcile the streak with the calendar. Missed days are covered by rest
 * days when available; otherwise the streak ends. Safe to call any time.
 */
export function settleStreak(state, now) {
  const st = state.streak;
  const todayKey = dayKey(now);
  if (!st.last || st.current === 0) return { usedRest: 0, broken: false };
  const gap = diffDays(st.last, todayKey);
  if (gap <= 1) return { usedRest: 0, broken: false };
  const missed = gap - 1;
  if (missed <= st.rest) {
    for (let i = 1; i <= missed; i++) st.rested.push(addDays(st.last, i));
    if (st.rested.length > 90) st.rested = st.rested.slice(-90);
    st.rest -= missed;
    st.last = addDays(todayKey, -1);
    return { usedRest: missed, broken: false };
  }
  const lost = st.current;
  st.current = 0;
  return { usedRest: 0, broken: true, lost };
}

/** The streak as it should be displayed right now. */
export function streakStatus(state, now) {
  const st = state.streak;
  const todayKey = dayKey(now);
  const doneToday = st.last === todayKey && st.current > 0;
  let current = st.current;
  if (st.last && current > 0) {
    const gap = diffDays(st.last, todayKey);
    if (gap > 1 && gap - 1 > st.rest) current = 0; // will be broken on next settle
  }
  return { current, best: Math.max(st.best, current), doneToday, rest: st.rest };
}

/** Seven-day strip (Mon–Sun style, ending today) for the home screen. */
export function weekStrip(state, now) {
  const todayKey = dayKey(now);
  const rested = new Set(state.streak.rested);
  return lastDays(7, todayKey).map((key) => {
    const rec = state.days[key];
    let status = 'missed';
    if (rec && rec.xp > 0) status = 'done';
    else if (rested.has(key)) status = 'rest';
    else if (key === todayKey) status = 'today';
    return { key, label: weekdayShort(key).slice(0, 2), status, xp: rec ? rec.xp : 0, isToday: key === todayKey };
  });
}

/* ---------------------------------------------------------------- activity */

/**
 * Record learning activity (XP, answers, time…). Extends the streak on the
 * first XP of the day and reports anything worth celebrating.
 */
export function addActivity(state, now, delta = {}) {
  const settle = settleStreak(state, now);
  const key = dayKey(now);
  const rec = dayRecord(state, key);
  const levelBefore = levelInfo(state.xp).level;
  const goal = state.profile.goal || 40;
  const goalBefore = rec.xp >= goal;

  const xp = Math.max(0, Math.round(delta.xp || 0));
  rec.xp += xp;
  rec.lessons += delta.lessons || 0;
  rec.reviews += delta.reviews || 0;
  rec.answered += delta.answered || 0;
  rec.correct += delta.correct || 0;
  rec.ms += Math.max(0, Math.round(delta.ms || 0));
  rec.puzzles += delta.puzzles || 0;
  state.xp += xp;

  let streakExtended = false;
  let restEarned = false;
  const st = state.streak;
  if (xp > 0 && st.last !== key) {
    st.current += 1;
    st.last = key;
    st.best = Math.max(st.best, st.current);
    streakExtended = true;
    if (st.current % 7 === 0 && st.rest < MAX_REST_DAYS) {
      st.rest += 1;
      restEarned = true;
    }
  }

  const levelAfter = levelInfo(state.xp).level;
  return {
    xp,
    streakExtended,
    streak: st.current,
    restEarned,
    usedRest: settle.usedRest,
    streakBroken: settle.broken,
    goalMet: !goalBefore && rec.xp >= goal,
    levelUp: levelAfter > levelBefore ? { from: levelBefore, to: levelAfter, title: levelInfo(state.xp).title } : null,
  };
}

export function todayRecord(state, now) {
  return state.days[dayKey(now)] || { xp: 0, lessons: 0, reviews: 0, answered: 0, correct: 0, ms: 0, puzzles: 0 };
}

/* ----------------------------------------------------------------- lessons */

export const lessonKey = (courseId, lessonId) => `${courseId}/${lessonId}`;
export const cardKey = (courseId, lessonId, stepId) => `${courseId}/${lessonId}/${stepId}`;

export function parseCardKey(key) {
  const [courseId, lessonId, ...rest] = key.split('/');
  return { courseId, lessonId, stepId: rest.join('/') };
}

export const lessonRecord = (state, courseId, lessonId) => state.lessons[lessonKey(courseId, lessonId)] || null;

export function isLessonDone(state, courseId, lessonId) {
  const rec = lessonRecord(state, courseId, lessonId);
  return !!(rec && rec.done > 0);
}

export function saveResume(state, courseId, lessonId, resume) {
  const key = lessonKey(courseId, lessonId);
  const rec = state.lessons[key] || (state.lessons[key] = { done: 0, first: null, last: null, best: 0 });
  rec.resume = resume;
  state.recent.course = courseId;
}

export function clearResume(state, courseId, lessonId) {
  const rec = state.lessons[lessonKey(courseId, lessonId)];
  if (rec) delete rec.resume;
}

/**
 * Mark a lesson finished and put its review-worthy questions on the schedule.
 * @param stepResults [{ id, review, correct, attempts, hints, revealed }]
 */
export function finishLesson(state, now, { courseId, lessonId, accuracy = 1, stepResults = [], bonusXp = 0, ms = 0 }) {
  const key = lessonKey(courseId, lessonId);
  const rec = state.lessons[key] || (state.lessons[key] = { done: 0, first: null, last: null, best: 0 });
  const firstTime = rec.done === 0;
  rec.done += 1;
  rec.first = rec.first || now;
  rec.last = now;
  rec.best = Math.max(rec.best || 0, accuracy);
  delete rec.resume;
  state.recent.course = courseId;

  let nextDue = null;
  let scheduled = 0;
  for (const r of stepResults) {
    if (!r.review) continue;
    const id = cardKey(courseId, lessonId, r.id);
    const grade = gradeFrom(r);
    const existing = state.cards[id];
    if (!existing) state.cards[id] = schedule(null, grade, now, srsOptions(state));
    else if (isDue(existing, now) || grade === Grade.Again) state.cards[id] = schedule(existing, grade, now, srsOptions(state));
    scheduled++;
    const due = state.cards[id].due;
    if (nextDue === null || due < nextDue) nextDue = due;
  }

  const activity = addActivity(state, now, { xp: bonusXp, lessons: 1, ms });
  return { ...activity, firstTime, scheduled, nextDue, nextDueDays: nextDue === null ? null : Math.max(1, Math.round((nextDue - now) / DAY_MS + 0.49)) };
}

/* ------------------------------------------------------------------ review */

/** Apply one review answer to a card. Cards practised early are only rescheduled if missed. */
export function applyReview(state, now, cardId, { correct, confidence = null, hints = 0 }) {
  const card = state.cards[cardId];
  if (!card) return null;
  // "Certain" only earns the long Easy interval once an item has been recalled
  // before: one confident answer is not yet evidence of durable knowledge.
  const trusted = confidence === 'sure' && card.reps < 2 ? 'think' : confidence;
  const grade = gradeFrom({ correct, attempts: 1, hints, confidence: trusted });
  const due = isDue(card, now);
  const changed = due || grade === Grade.Again;
  if (changed) state.cards[cardId] = schedule(card, grade, now, srsOptions(state));
  if (confidence && state.calib[confidence]) {
    state.calib[confidence][0] += 1;
    if (correct) state.calib[confidence][1] += 1;
  }
  return { grade, changed, card: state.cards[cardId], ivl: state.cards[cardId].ivl };
}

/** Ids of all due cards, weakest memory first. */
export function dueCardIds(state, now) {
  const out = [];
  for (const id in state.cards) {
    const card = state.cards[id];
    if (isDue(card, now)) out.push({ id, r: recallNow(card, now) });
  }
  out.sort((a, b) => a.r - b.r);
  return out.map((x) => x.id);
}

export const dueCount = (state, now) => dueCardIds(state, now).length;

/** Cards that are not due yet, weakest first (for optional extra practice). */
export function weakestCardIds(state, now, limit = 10) {
  const out = [];
  for (const id in state.cards) {
    const card = state.cards[id];
    if (card.reps > 0 && !isDue(card, now)) out.push({ id, r: recallNow(card, now) });
  }
  out.sort((a, b) => a.r - b.r);
  return out.slice(0, limit).map((x) => x.id);
}

/** How many reviews fall due on each of the next `days` days (index 0 = today, incl. overdue). */
export function reviewForecast(state, now, days = 7) {
  const out = new Array(days).fill(0);
  const todayKey = dayKey(now);
  for (const id in state.cards) {
    const card = state.cards[id];
    if (!card.reps) continue;
    const idx = Math.max(0, diffDays(todayKey, dayKey(card.due)));
    if (idx < days) out[idx] += 1;
  }
  return out;
}

/** Average predicted recall (0–1) of a lesson's review items, or null if none yet. */
export function lessonStrength(state, courseId, lessonId, now) {
  const prefix = lessonKey(courseId, lessonId) + '/';
  let sum = 0;
  let n = 0;
  for (const id in state.cards) {
    if (id.startsWith(prefix)) { sum += recallNow(state.cards[id], now); n++; }
  }
  return n ? sum / n : null;
}

export function strengthLabel(strength) {
  if (strength == null) return null;
  if (strength >= 0.9) return { key: 'strong', label: 'Strong' };
  if (strength >= 0.75) return { key: 'good', label: 'Good' };
  if (strength >= 0.55) return { key: 'fading', label: 'Fading' };
  return { key: 'weak', label: 'Needs review' };
}

/* -------------------------------------------------------------- summaries */

/**
 * Progress through a course.
 * @param course a catalog course ({ id, chapters: [{ lessons: [{ id }] }] })
 */
export function courseProgress(state, course, now) {
  let total = 0;
  let done = 0;
  let next = null;
  let resume = null;
  let strengthSum = 0;
  let strengthN = 0;
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      total++;
      const rec = lessonRecord(state, course.id, lesson.id);
      if (rec && rec.done > 0) {
        done++;
        const st = lessonStrength(state, course.id, lesson.id, now);
        if (st != null) { strengthSum += st; strengthN++; }
      } else if (!next) {
        next = lesson;
      }
      if (rec && rec.resume && !resume) resume = lesson;
    }
  }
  return {
    total,
    done,
    pct: total ? done / total : 0,
    started: done > 0 || !!resume,
    complete: total > 0 && done === total,
    next: resume || next,
    strength: strengthN ? strengthSum / strengthN : null,
  };
}

export function totals(state) {
  let answered = 0;
  let correct = 0;
  let ms = 0;
  let reviews = 0;
  let activeDays = 0;
  let puzzles = 0;
  for (const key in state.days) {
    const d = state.days[key];
    answered += d.answered || 0;
    correct += d.correct || 0;
    ms += d.ms || 0;
    reviews += d.reviews || 0;
    puzzles += d.puzzles || 0;
    if (d.xp > 0) activeDays++;
  }
  let lessons = 0;
  let lessonRuns = 0;
  for (const key in state.lessons) {
    if (state.lessons[key].done > 0) { lessons++; lessonRuns += state.lessons[key].done; }
  }
  return {
    answered,
    correct,
    accuracy: answered ? correct / answered : null,
    minutes: Math.round(ms / 60000),
    reviews,
    activeDays,
    puzzles,
    lessons,
    lessonRuns,
    cards: Object.keys(state.cards).length,
  };
}

/** Calibration rows for the profile chart: stated confidence vs. actual accuracy. */
export function calibration(state) {
  const rows = [
    { key: 'guess', label: 'Guessing', expected: 0.4 },
    { key: 'think', label: 'Fairly sure', expected: 0.75 },
    { key: 'sure', label: 'Certain', expected: 0.95 },
  ];
  return rows.map((row) => {
    const [n, c] = state.calib[row.key] || [0, 0];
    return { ...row, n, accuracy: n ? c / n : null };
  });
}
