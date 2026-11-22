import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState } from '../src/core/store.js';
import * as P from '../src/core/progress.js';
import { checkAchievements, achievementList, ACHIEVEMENTS } from '../src/core/achievements.js';
import { DAY_MS } from '../src/core/dates.js';
import { makeRng } from '../src/core/rng.js';
import { cluesOf, lineSolvable } from '../src/puzzles/nonogram.js';
import { score } from '../src/puzzles/codebreaker.js';
import { dailyPuzzleInfo, PUZZLES } from '../src/puzzles/registry.js';
import { simulate } from '../src/widgets/memory-curve.js';

const T0 = new Date(2026, 4, 4, 15, 0, 0).getTime();
const COURSES = [
  { id: 'a', category: 'math', chapters: [{ lessons: [{ id: 'l1' }, { id: 'l2' }] }] },
  { id: 'b', category: 'logic', chapters: [{ lessons: [{ id: 'l1' }] }] },
  { id: 'c', category: 'cs', chapters: [{ lessons: [{ id: 'l1' }] }] },
];

test('achievements are awarded once, when their condition is met', () => {
  const s = defaultState(T0);
  assert.deepEqual(checkAchievements(s, T0, COURSES), []);
  P.finishLesson(s, T0, { courseId: 'a', lessonId: 'l1', accuracy: 1, bonusXp: 60, stepResults: [] });
  const first = checkAchievements(s, T0, COURSES).map((a) => a.id);
  assert.ok(first.includes('first-lesson'));
  assert.ok(first.includes('perfect'));
  assert.ok(first.includes('goal-1'));
  assert.ok(!first.includes('course-1'));
  assert.deepEqual(checkAchievements(s, T0, COURSES), [], 'not awarded twice');
  P.finishLesson(s, T0 + DAY_MS, { courseId: 'a', lessonId: 'l2', accuracy: 0.5, bonusXp: 20, stepResults: [] });
  assert.ok(checkAchievements(s, T0 + DAY_MS, COURSES).some((a) => a.id === 'course-1'));
  P.finishLesson(s, T0 + 2 * DAY_MS, { courseId: 'b', lessonId: 'l1', bonusXp: 20, stepResults: [] });
  P.finishLesson(s, T0 + 2 * DAY_MS, { courseId: 'c', lessonId: 'l1', bonusXp: 20, stepResults: [] });
  const later = checkAchievements(s, T0 + 2 * DAY_MS, COURSES).map((a) => a.id);
  assert.ok(later.includes('explorer'));
  assert.ok(later.includes('streak-3'));
});

test('achievementList reports progress and every achievement is well-formed', () => {
  const s = defaultState(T0);
  const list = achievementList(s, COURSES);
  assert.equal(list.length, ACHIEVEMENTS.length);
  assert.deepEqual(list.find((a) => a.id === 'lessons-5').progress, [0, 5]);
  const ids = new Set();
  for (const a of ACHIEVEMENTS) {
    assert.ok(a.id && a.title && a.desc && a.icon && a.hue && typeof a.test === 'function', a.id);
    assert.ok(!ids.has(a.id), `duplicate id ${a.id}`);
    ids.add(a.id);
  }
});

test('comeback and calibration achievements', () => {
  const s = defaultState(T0);
  P.addActivity(s, T0, { xp: 10 });
  P.addActivity(s, T0 + 9 * DAY_MS, { xp: 10 });
  s.calib.sure = [20, 19];
  const ids = checkAchievements(s, T0 + 9 * DAY_MS, COURSES).map((a) => a.id);
  assert.ok(ids.includes('comeback'));
  assert.ok(ids.includes('calibrated'));
});

test('nonogram clues and the line solver', () => {
  assert.deepEqual(cluesOf([1, 1, 0, 1, 0]), [2, 1]);
  assert.deepEqual(cluesOf([0, 0, 0]), [0]);
  assert.deepEqual(cluesOf([1, 1, 1]), [3]);
  // a plus sign is forced by its clues
  const plus = [[0, 1, 0], [1, 1, 1], [0, 1, 0]];
  const rows = plus.map(cluesOf);
  const cols = plus[0].map((_, c) => cluesOf(plus.map((row) => row[c])));
  assert.ok(lineSolvable(rows, cols));
  // a 2x2 checkerboard has two solutions, so line logic cannot finish it
  assert.ok(!lineSolvable([[1], [1]], [[1], [1]]));
  // contradictory clues are rejected
  assert.ok(!lineSolvable([[2], [2]], [[1], [0]]));
});

test('code breaker scoring handles repeats correctly', () => {
  assert.deepEqual(score([0, 1, 2, 3], [0, 1, 2, 3]), { exact: 4, near: 0 });
  assert.deepEqual(score([0, 1, 2, 3], [3, 2, 1, 0]), { exact: 0, near: 4 });
  assert.deepEqual(score([0, 0, 1, 1], [0, 1, 0, 1]), { exact: 2, near: 2 });
  assert.deepEqual(score([0, 0, 0, 1], [1, 1, 1, 0]), { exact: 0, near: 2 });
  assert.deepEqual(score([0, 1, 2, 3], [4, 4, 4, 4]), { exact: 0, near: 0 });
});

test('the daily puzzle is the same for everyone on a day and rotates', () => {
  const a = dailyPuzzleInfo('2026-05-04');
  const b = dailyPuzzleInfo('2026-05-04');
  assert.equal(a.id, b.id);
  assert.equal(a.seed, b.seed);
  const week = ['04', '05', '06', '07'].map((d) => dailyPuzzleInfo(`2026-05-${d}`).id);
  assert.equal(new Set(week).size, PUZZLES.length);
  assert.notEqual(dailyPuzzleInfo('2026-05-04').seed, dailyPuzzleInfo('2026-05-08').seed);
});

test('memory-curve model: spaced reviews beat crammed ones', () => {
  const spaced = simulate([3, 10, 28], 30, 1);
  const crammed = simulate([1, 2, 3], 30, 1);
  assert.ok(spaced.lowest >= 0.7, `spaced lowest ${spaced.lowest}`);
  assert.ok(crammed.lowest < 0.5, `crammed lowest ${crammed.lowest}`);
  assert.ok(simulate([], 30, 1).final < 0.1);
  // a later (harder) single review leaves the memory in better shape at the end
  assert.ok(simulate([5], 30, 1).final > simulate([1], 30, 1).final);
});

test('seeded rng helpers stay in range and are reproducible', () => {
  const a = makeRng(7);
  const b = makeRng(7);
  for (let i = 0; i < 200; i++) {
    const v = a.int(-3, 3);
    assert.equal(v, b.int(-3, 3));
    assert.ok(v >= -3 && v <= 3);
  }
  const rng = makeRng('seed');
  for (let i = 0; i < 100; i++) {
    assert.notEqual(rng.nonzero(-2, 2), 0);
    assert.ok(![3, 4].includes(rng.intExcept(1, 6, [3, 4])));
    const stepped = rng.step(0, 2, 0.5);
    assert.ok([0, 0.5, 1, 1.5, 2].includes(stepped));
  }
  assert.deepEqual(makeRng(1).shuffle([1, 2, 3, 4, 5]).sort(), [1, 2, 3, 4, 5]);
  assert.equal(makeRng(1).sample([1, 2, 3, 4, 5], 3).length, 3);
});
