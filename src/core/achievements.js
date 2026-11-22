/**
 * Achievements. Deliberately modest: they mark real milestones (showing up,
 * remembering, finishing) rather than nudging compulsive use.
 *
 * Each has a `test(ctx)`; optional `progress(ctx)` returns [have, need] for
 * a progress bar on the profile page.
 */
import { totals, levelInfo } from './progress.js';
import { diffDays } from './dates.js';

function context(state, courses) {
  const t = totals(state);
  const goal = state.profile.goal || 40;
  const dayKeys = Object.keys(state.days).filter((k) => state.days[k].xp > 0).sort();
  let goalDays = 0;
  for (const k of dayKeys) if (state.days[k].xp >= goal) goalDays++;
  let longestGap = 0;
  for (let i = 1; i < dayKeys.length; i++) longestGap = Math.max(longestGap, diffDays(dayKeys[i - 1], dayKeys[i]));

  let coursesDone = 0;
  const categoriesTouched = new Set();
  for (const course of courses || []) {
    let total = 0;
    let done = 0;
    for (const ch of course.chapters) {
      for (const l of ch.lessons) {
        total++;
        const rec = state.lessons[`${course.id}/${l.id}`];
        if (rec && rec.done > 0) { done++; categoriesTouched.add(course.category); }
      }
    }
    if (total > 0 && done === total) coursesDone++;
  }

  const lessonRecs = Object.values(state.lessons).filter((l) => l.done > 0);
  const hours = lessonRecs.map((l) => new Date(l.last).getHours());
  let maxStability = 0;
  for (const id in state.cards) maxStability = Math.max(maxStability, state.cards[id].s || 0);
  const dailyPuzzles = Object.keys((state.puzzles && state.puzzles.daily) || {}).length;

  return {
    state, t, goalDays, longestGap, coursesDone,
    subjects: categoriesTouched.size,
    perfect: lessonRecs.some((l) => l.best >= 1),
    night: hours.some((hr) => hr >= 22 || hr < 4),
    early: hours.some((hr) => hr >= 4 && hr < 7),
    maxStability,
    dailyPuzzles,
    streak: Math.max(state.streak.best || 0, state.streak.current || 0),
    level: levelInfo(state.xp).level,
  };
}

export const ACHIEVEMENTS = [
  { id: 'first-lesson', title: 'First Step', desc: 'Finish your first lesson.', icon: 'footprints', hue: 'orange', test: (c) => c.t.lessons >= 1 },
  { id: 'lessons-5', title: 'Warming Up', desc: 'Finish 5 lessons.', icon: 'sprout', hue: 'green', test: (c) => c.t.lessons >= 5, progress: (c) => [c.t.lessons, 5] },
  { id: 'lessons-20', title: 'Bookworm', desc: 'Finish 20 lessons.', icon: 'library', hue: 'blue', test: (c) => c.t.lessons >= 20, progress: (c) => [c.t.lessons, 20] },
  { id: 'lessons-50', title: 'Scholar', desc: 'Finish 50 lessons.', icon: 'school', hue: 'violet', test: (c) => c.t.lessons >= 50, progress: (c) => [c.t.lessons, 50] },
  { id: 'perfect', title: 'Flawless', desc: 'Finish a lesson with every answer right first time.', icon: 'gem', hue: 'teal', test: (c) => c.perfect },
  { id: 'course-1', title: 'Completionist', desc: 'Finish every lesson in a course.', icon: 'trophy', hue: 'yellow', test: (c) => c.coursesDone >= 1 },
  { id: 'explorer', title: 'Explorer', desc: 'Finish lessons in 3 different subjects.', icon: 'compass', hue: 'pink', test: (c) => c.subjects >= 3, progress: (c) => [c.subjects, 3] },
  { id: 'streak-3', title: 'Hat Trick', desc: 'Practise 3 days in a row.', icon: 'flame', hue: 'orange', test: (c) => c.streak >= 3, progress: (c) => [c.streak, 3] },
  { id: 'streak-7', title: 'Full Week', desc: 'Practise 7 days in a row.', icon: 'calendar-check', hue: 'orange', test: (c) => c.streak >= 7, progress: (c) => [c.streak, 7] },
  { id: 'streak-30', title: 'Habit Formed', desc: 'Practise 30 days in a row.', icon: 'medal', hue: 'red', test: (c) => c.streak >= 30, progress: (c) => [c.streak, 30] },
  { id: 'streak-100', title: 'Centurion', desc: 'Practise 100 days in a row.', icon: 'crown', hue: 'yellow', test: (c) => c.streak >= 100, progress: (c) => [c.streak, 100] },
  { id: 'goal-1', title: 'Goal Getter', desc: 'Reach your daily goal.', icon: 'target', hue: 'green', test: (c) => c.goalDays >= 1 },
  { id: 'goal-7', title: 'On a Roll', desc: 'Reach your daily goal on 7 different days.', icon: 'trending-up', hue: 'green', test: (c) => c.goalDays >= 7, progress: (c) => [c.goalDays, 7] },
  { id: 'review-1', title: 'Memory Lane', desc: 'Recall your first review item.', icon: 'review', hue: 'violet', test: (c) => c.t.reviews >= 1 },
  { id: 'review-50', title: 'Gardener', desc: 'Recall 50 review items.', icon: 'leaf', hue: 'green', test: (c) => c.t.reviews >= 50, progress: (c) => [c.t.reviews, 50] },
  { id: 'review-250', title: 'Memory Palace', desc: 'Recall 250 review items.', icon: 'key', hue: 'violet', test: (c) => c.t.reviews >= 250, progress: (c) => [c.t.reviews, 250] },
  { id: 'long-term', title: 'Built to Last', desc: 'Grow a memory strong enough to last a month.', icon: 'mountain', hue: 'teal', test: (c) => c.maxStability >= 30 },
  { id: 'calibrated', title: 'Know Thyself', desc: 'Be right 90% of the time when you say you are certain (20+ answers).', icon: 'scale', hue: 'blue', test: (c) => c.state.calib.sure[0] >= 20 && c.state.calib.sure[1] / c.state.calib.sure[0] >= 0.9 },
  { id: 'comeback', title: 'Welcome Back', desc: 'Return after a week or more away.', icon: 'door', hue: 'pink', test: (c) => c.longestGap >= 7 },
  { id: 'night-owl', title: 'Night Owl', desc: 'Finish a lesson after 10 pm.', icon: 'moon-star', hue: 'violet', test: (c) => c.night },
  { id: 'early-bird', title: 'Early Bird', desc: 'Finish a lesson before 7 am.', icon: 'sunrise', hue: 'yellow', test: (c) => c.early },
  { id: 'puzzle-1', title: 'Puzzler', desc: 'Solve a puzzle.', icon: 'puzzle', hue: 'teal', test: (c) => c.t.puzzles >= 1 },
  { id: 'puzzle-daily-5', title: 'Daily Habit', desc: 'Solve 5 daily puzzles.', icon: 'calendar', hue: 'teal', test: (c) => c.dailyPuzzles >= 5, progress: (c) => [c.dailyPuzzles, 5] },
  { id: 'xp-1000', title: 'Four Digits', desc: 'Earn 1,000 XP.', icon: 'zap', hue: 'yellow', test: (c) => c.state.xp >= 1000, progress: (c) => [c.state.xp, 1000] },
  { id: 'xp-5000', title: 'High Voltage', desc: 'Earn 5,000 XP.', icon: 'rocket', hue: 'red', test: (c) => c.state.xp >= 5000, progress: (c) => [c.state.xp, 5000] },
];

/**
 * Award any newly met achievements. Mutates state.ach and returns the list of
 * achievements earned by this call.
 */
export function checkAchievements(state, now, courses) {
  const ctx = context(state, courses);
  const earned = [];
  for (const a of ACHIEVEMENTS) {
    if (state.ach[a.id]) continue;
    let ok = false;
    try { ok = !!a.test(ctx); } catch { ok = false; }
    if (ok) { state.ach[a.id] = now; earned.push(a); }
  }
  return earned;
}

/** All achievements with earned timestamps and progress, for the profile page. */
export function achievementList(state, courses) {
  const ctx = context(state, courses);
  return ACHIEVEMENTS.map((a) => {
    let progress = null;
    if (a.progress) { try { progress = a.progress(ctx); } catch { progress = null; } }
    return { ...a, earnedAt: state.ach[a.id] || null, progress };
  });
}
