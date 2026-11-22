import test from 'node:test';
import assert from 'node:assert/strict';
import { schedule, retrievability, intervalFor, Grade, gradeFrom, recallNow, isDue, interleave, DAY_MS, maturity } from '../src/core/srs.js';

const T0 = new Date(2026, 0, 10, 9, 0, 0).getTime();

test('retrievability is 90% when elapsed == stability and decays over time', () => {
  assert.ok(Math.abs(retrievability(10, 10) - 0.9) < 1e-9);
  assert.equal(retrievability(0, 5), 1);
  assert.ok(retrievability(30, 10) < retrievability(10, 10));
});

test('interval for 90% retention equals stability', () => {
  assert.ok(Math.abs(intervalFor(7, 0.9) - 7) < 1e-9);
  assert.ok(intervalFor(7, 0.8) > 7);
  assert.ok(intervalFor(7, 0.95) < 7);
});

test('new cards: better grades give longer first intervals', () => {
  const again = schedule(null, Grade.Again, T0);
  const hard = schedule(null, Grade.Hard, T0);
  const good = schedule(null, Grade.Good, T0);
  const easy = schedule(null, Grade.Easy, T0);
  assert.equal(again.ivl, 1);
  assert.ok(hard.ivl >= 1 && hard.ivl <= good.ivl);
  assert.ok(good.ivl >= 2 && good.ivl <= 5);
  assert.ok(easy.ivl > good.ivl);
  assert.ok(again.d > easy.d, 'failed items start out harder');
  assert.equal(good.reps, 1);
  assert.equal(good.lapses, 0);
});

test('intervals expand with successful, well-spaced reviews', () => {
  let card = schedule(null, Grade.Good, T0);
  let now = T0;
  const intervals = [card.ivl];
  for (let i = 0; i < 5; i++) {
    now = card.due + 9 * 3600 * 1000;
    card = schedule(card, Grade.Good, now);
    intervals.push(card.ivl);
  }
  for (let i = 1; i < intervals.length; i++) assert.ok(intervals[i] > intervals[i - 1], intervals.join(','));
  assert.ok(intervals[intervals.length - 1] > 60, 'reaches long-term retention: ' + intervals.join(','));
});

test('a lapse shrinks stability, counts, and comes back tomorrow', () => {
  let card = schedule(null, Grade.Good, T0);
  card = schedule(card, Grade.Good, card.due);
  const before = card.s;
  const lapsed = schedule(card, Grade.Again, card.due);
  assert.ok(lapsed.s < before);
  assert.equal(lapsed.ivl, 1);
  assert.equal(lapsed.lapses, 1);
});

test('reviewing far too early gains little; reviewing late gains more', () => {
  const base = schedule(schedule(null, Grade.Good, T0), Grade.Good, T0 + 3 * DAY_MS);
  const early = schedule(base, Grade.Good, base.last + 1 * DAY_MS);
  const onTime = schedule(base, Grade.Good, base.due);
  assert.ok(early.s < onTime.s);
});

test('due dates land at the start of a day and respect maxInterval', () => {
  const card = schedule(null, Grade.Good, T0);
  const due = new Date(card.due);
  assert.equal(due.getHours(), 0);
  assert.ok(isDue(card, card.due));
  assert.ok(!isDue(card, T0));
  let c = card;
  for (let i = 0; i < 20; i++) c = schedule(c, Grade.Easy, c.due);
  assert.ok(c.ivl <= 365);
});

test('higher target retention means shorter intervals', () => {
  const a = schedule(null, Grade.Good, T0, { retention: 0.95 });
  const b = schedule(null, Grade.Good, T0, { retention: 0.8 });
  assert.ok(a.ivl < b.ivl);
});

test('gradeFrom maps behaviour to grades', () => {
  assert.equal(gradeFrom({ correct: false }), Grade.Again);
  assert.equal(gradeFrom({ correct: true, revealed: true }), Grade.Again);
  assert.equal(gradeFrom({ correct: true, attempts: 3 }), Grade.Again);
  assert.equal(gradeFrom({ correct: true, attempts: 2 }), Grade.Hard);
  assert.equal(gradeFrom({ correct: true, hints: 1 }), Grade.Hard);
  assert.equal(gradeFrom({ correct: true, confidence: 'guess' }), Grade.Hard);
  assert.equal(gradeFrom({ correct: true }), Grade.Good);
  assert.equal(gradeFrom({ correct: true, confidence: 'think' }), Grade.Good);
  assert.equal(gradeFrom({ correct: true, confidence: 'sure' }), Grade.Easy);
});

test('recallNow and maturity', () => {
  const card = schedule(null, Grade.Good, T0);
  assert.ok(recallNow(card, T0) > 0.99);
  assert.ok(recallNow(card, T0 + 30 * DAY_MS) < 0.7);
  assert.equal(maturity(null).key, 'new');
  assert.equal(maturity({ reps: 3, s: 45 }).key, 'strong');
});

test('interleave avoids same-lesson neighbours when it can', () => {
  const items = [
    { id: 'a1', group: 'a', r: 0.5 }, { id: 'a2', group: 'a', r: 0.6 }, { id: 'a3', group: 'a', r: 0.7 },
    { id: 'b1', group: 'b', r: 0.8 }, { id: 'c1', group: 'c', r: 0.9 },
  ];
  const out = interleave(items);
  assert.equal(out.length, 5);
  assert.equal(out[0].id, 'a1');
  let clashes = 0;
  for (let i = 1; i < out.length; i++) if (out[i].group === out[i - 1].group) clashes++;
  assert.ok(clashes <= 1);
});
