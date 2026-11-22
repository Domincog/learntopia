import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, migrate } from '../src/core/store.js';
import * as P from '../src/core/progress.js';
import { DAY_MS, dayKey } from '../src/core/dates.js';

const T0 = new Date(2026, 2, 2, 10, 0, 0).getTime(); // a Monday
const day = (n) => T0 + n * DAY_MS;

test('levels: thresholds grow and levelInfo is consistent', () => {
  assert.equal(P.xpForLevel(1), 0);
  assert.equal(P.xpForLevel(2), 100);
  assert.equal(P.xpForLevel(3), 250);
  assert.equal(P.levelInfo(0).level, 1);
  assert.equal(P.levelInfo(99).level, 1);
  assert.equal(P.levelInfo(100).level, 2);
  const info = P.levelInfo(175);
  assert.equal(info.level, 2);
  assert.equal(info.into, 75);
  assert.equal(info.span, 150);
});

test('first XP of the day extends the streak, later XP does not', () => {
  const s = defaultState(T0);
  let r = P.addActivity(s, day(0), { xp: 10 });
  assert.ok(r.streakExtended);
  assert.equal(s.streak.current, 1);
  r = P.addActivity(s, day(0) + 1000, { xp: 10 });
  assert.ok(!r.streakExtended);
  assert.equal(s.streak.current, 1);
  P.addActivity(s, day(1), { xp: 5 });
  assert.equal(s.streak.current, 2);
  assert.equal(s.xp, 25);
  assert.equal(s.days[dayKey(day(0))].xp, 20);
});

test('zero-XP activity does not start a streak', () => {
  const s = defaultState(T0);
  P.addActivity(s, day(0), { ms: 5000 });
  assert.equal(s.streak.current, 0);
});

test('a missed day is covered by a rest day', () => {
  const s = defaultState(T0);          // starts with 1 rest day
  P.addActivity(s, day(0), { xp: 10 });
  P.addActivity(s, day(1), { xp: 10 });
  const r = P.addActivity(s, day(3), { xp: 10 }); // skipped day 2
  assert.equal(r.usedRest, 1);
  assert.equal(s.streak.current, 3);
  assert.equal(s.streak.rest, 0);
  assert.deepEqual(s.streak.rested, [dayKey(day(2))]);
});

test('missing more days than rest days breaks the streak', () => {
  const s = defaultState(T0);
  P.addActivity(s, day(0), { xp: 10 });
  P.addActivity(s, day(1), { xp: 10 });
  assert.equal(P.streakStatus(s, day(4)).current, 0, 'display shows broken before settle');
  const r = P.addActivity(s, day(4), { xp: 10 }); // skipped 2 days, only 1 rest
  assert.ok(r.streakBroken);
  assert.equal(s.streak.current, 1);
  assert.equal(s.streak.best, 2);
});

test('a rest day is earned every 7-day run, capped', () => {
  const s = defaultState(T0);
  s.streak.rest = 0;
  for (let i = 0; i < 7; i++) P.addActivity(s, day(i), { xp: 10 });
  assert.equal(s.streak.rest, 1);
  for (let i = 7; i < 28; i++) P.addActivity(s, day(i), { xp: 10 });
  assert.equal(s.streak.rest, P.MAX_REST_DAYS);
  assert.equal(s.streak.current, 28);
});

test('goalMet fires once when the daily goal is crossed', () => {
  const s = defaultState(T0);
  s.profile.goal = 20;
  assert.ok(!P.addActivity(s, day(0), { xp: 10 }).goalMet);
  assert.ok(P.addActivity(s, day(0), { xp: 10 }).goalMet);
  assert.ok(!P.addActivity(s, day(0), { xp: 10 }).goalMet);
});

test('levelUp is reported', () => {
  const s = defaultState(T0);
  const r = P.addActivity(s, day(0), { xp: 120 });
  assert.deepEqual({ from: r.levelUp.from, to: r.levelUp.to }, { from: 1, to: 2 });
});

test('finishing a lesson records it and schedules its review items', () => {
  const s = defaultState(T0);
  const r = P.finishLesson(s, day(0), {
    courseId: 'c', lessonId: 'l', accuracy: 0.8, bonusXp: 20,
    stepResults: [
      { id: 'a', review: true, correct: true, attempts: 1 },
      { id: 'b', review: true, correct: false, attempts: 3, revealed: true },
      { id: 'x', review: false, correct: true, attempts: 1 },
    ],
  });
  assert.ok(r.firstTime);
  assert.equal(r.scheduled, 2);
  assert.equal(r.nextDueDays, 1);
  assert.ok(P.isLessonDone(s, 'c', 'l'));
  assert.equal(Object.keys(s.cards).length, 2);
  assert.ok(s.cards['c/l/a'].ivl > s.cards['c/l/b'].ivl);
  assert.equal(s.recent.course, 'c');
  assert.equal(P.dueCount(s, day(0)), 0);
  assert.equal(P.dueCount(s, day(1) + DAY_MS / 2), 1);
  assert.equal(P.dueCount(s, day(10)), 2);
});

test('replaying a lesson does not inflate memory of items that are not due', () => {
  const s = defaultState(T0);
  const res = { courseId: 'c', lessonId: 'l', stepResults: [{ id: 'a', review: true, correct: true, attempts: 1 }] };
  P.finishLesson(s, day(0), res);
  const before = { ...s.cards['c/l/a'] };
  P.finishLesson(s, day(0) + 60000, res);
  assert.deepEqual(s.cards['c/l/a'], before);
  assert.equal(s.lessons['c/l'].done, 2);
});

test('reviews reschedule due cards and track calibration', () => {
  const s = defaultState(T0);
  P.finishLesson(s, day(0), { courseId: 'c', lessonId: 'l', stepResults: [{ id: 'a', review: true, correct: true, attempts: 1 }] });
  const due = s.cards['c/l/a'].due;
  const r = P.applyReview(s, due + 1000, 'c/l/a', { correct: true, confidence: 'sure' });
  assert.ok(r.changed);
  assert.ok(s.cards['c/l/a'].ivl > 3);
  assert.ok(s.cards['c/l/a'].ivl < 20, 'first confident recall is graded Good, not Easy');
  assert.deepEqual(s.calib.sure, [1, 1]);
  // early practice: correct -> unchanged, wrong -> rescheduled for tomorrow
  const snapshot = { ...s.cards['c/l/a'] };
  assert.ok(!P.applyReview(s, due + 2000, 'c/l/a', { correct: true }).changed);
  assert.deepEqual(s.cards['c/l/a'], snapshot);
  assert.ok(P.applyReview(s, due + 3000, 'c/l/a', { correct: false }).changed);
  assert.equal(s.cards['c/l/a'].ivl, 1);
});

test('forecast, strength and course progress', () => {
  const s = defaultState(T0);
  const course = { id: 'c', chapters: [{ lessons: [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }] }] };
  P.finishLesson(s, day(0), { courseId: 'c', lessonId: 'l1', stepResults: [{ id: 'a', review: true, correct: true, attempts: 1 }] });
  const fc = P.reviewForecast(s, day(0), 7);
  assert.equal(fc.reduce((a, b) => a + b, 0), 1);
  assert.equal(fc[0], 0);
  assert.ok(P.lessonStrength(s, 'c', 'l1', day(0)) > 0.99);
  assert.ok(P.lessonStrength(s, 'c', 'l1', day(40)) < 0.7);
  assert.equal(P.lessonStrength(s, 'c', 'l2', day(0)), null);
  const cp = P.courseProgress(s, course, day(0));
  assert.equal(cp.done, 1);
  assert.equal(cp.total, 3);
  assert.equal(cp.next.id, 'l2');
  P.saveResume(s, 'c', 'l3', { index: 2 });
  assert.equal(P.courseProgress(s, course, day(0)).next.id, 'l3');
});

test('weekStrip marks done / rest / today', () => {
  const s = defaultState(T0);
  P.addActivity(s, day(0), { xp: 10 });
  P.addActivity(s, day(2), { xp: 10 }); // day 1 rested
  const strip = P.weekStrip(s, day(3));
  assert.equal(strip.length, 7);
  assert.equal(strip[6].status, 'today');
  assert.equal(strip[5].status, 'done');
  assert.equal(strip[4].status, 'rest');
  assert.equal(strip[3].status, 'done');
});

test('migrate fills in missing fields without losing data', () => {
  const s = migrate({ xp: 50, lessons: { 'a/b': { done: 1 } }, settings: { sound: false } }, T0);
  assert.equal(s.xp, 50);
  assert.equal(s.settings.sound, false);
  assert.equal(s.settings.theme, 'auto');
  assert.equal(s.lessons['a/b'].done, 1);
  assert.deepEqual(s.cards, {});
  assert.ok(Array.isArray(s.streak.rested));
});
