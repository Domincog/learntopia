// Independent checks of Algorithms II. Nothing here trusts the course's own
// helpers for an answer. Every generated question is re-solved from the text
// and the picture the learner sees (200+ seeds), every puzzle is brute-forced,
// every count quoted in a lesson (boards, calls, coins, routes, tours) is
// recomputed with code written differently from the helpers, and every
// interactive check is tried on all the states its widget can reach.
//
//   node --test tests/algorithms-2-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import * as Queens from '../src/widgets/queens-board.js';
import * as TakeSkip from '../src/widgets/take-or-skip.js';
import * as Coins from '../src/widgets/coin-change.js';
import * as Meet from '../src/widgets/meeting-picker.js';
import * as Grid from '../src/widgets/dp-grid.js';
import * as RoadMap from '../src/widgets/dijkstra-map.js';
import * as Hash from '../src/widgets/hash-table.js';
import * as Tour from '../src/widgets/tour-builder.js';
import * as H from '../content/courses/algorithms-2/helpers.js';
import course from '../content/courses/algorithms-2/course.js';

const SEEDS = 220;
const COURSE = 'algorithms-2';
const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/${COURSE}/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, COURSE, meta.id);
  }
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const fixed = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
/** Generated steps are fetched through this, so that the guard at the end knows which ones were tested. */
const TESTED = new Set();
const variants = (lesson, id, n = SEEDS) => {
  assert.equal(typeof raw(lesson, id).gen, 'function', `${lesson}/${id} is a generated step`);
  TESTED.add(`${lesson}/${id}`);
  return Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(4001 + k * 7919), id));
};
const flat = (text) => String(text).replace(/\s+/g, ' ').trim();
const int = (text) => Number(String(text).replace(/,/g, ''));
const ints = (text) => (String(text).match(/\d[\d,]*/g) || []).map(int);
const commas = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const correctOf = (step) => step.options.filter((o) => o.correct);
const sum = (list) => list.reduce((a, b) => a + b, 0);
const words = (text) => text.split(/, | and | or /).map((w) => w.trim()).filter(Boolean);
const blankValues = (step) => step.blanks.map((b) => (b.kind === 'input' ? b.numbers[0] : b.answer));
const distinct = (list) => new Set(list).size === list.length;
/** Wrong values of a numeric step: none equals the answer, none is listed twice. */
function soundWrongs(step, label) {
  for (const [value] of step.wrong) assert.ok(Math.abs(value - step.answer) > (step.tolerance || 0), `${label}: the anticipated slip ${value} would be accepted`);
  assert.ok(distinct(step.wrong.map((w) => w[0])), `${label}: an anticipated slip is listed twice (${step.wrong.map((w) => w[0])})`);
}

/* ======================================================================
 * The algorithms, written here from scratch
 * ==================================================================== */

/** No two queens attack each other; cols[r] is the column of the queen in row r. */
const peaceful = (cols) => {
  for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) if (cols[i] === cols[j] || Math.abs(cols[i] - cols[j]) === j - i) return false;
  return true;
};
/** Every way of putting one queen in each row of an n × n board, checked one by one. */
function queensByBruteForce(n) {
  const solutions = [];
  const total = n ** n;
  for (let code = 0; code < total; code++) {
    const cols = [];
    for (let r = 0, x = code; r < n; r++, x = Math.floor(x / n)) cols.push(x % n);
    if (peaceful(cols)) solutions.push(cols);
  }
  return { boards: total, solutions };
}
/** The backtracking tree, built level by level (breadth first, unlike the course's depth-first helper). */
function queenLevels(n) {
  let level = [[]];
  const sizes = [];
  let deadEnds = 0;
  const all = [[]];
  for (let row = 0; row < n; row++) {
    const next = [];
    for (const prefix of level) {
      const grown = [];
      for (let c = 0; c < n; c++) if (peaceful([...prefix, c])) grown.push([...prefix, c]);
      if (!grown.length) deadEnds++;
      next.push(...grown);
    }
    sizes.push(next.length);
    all.push(...next);
    level = next;
  }
  return { sizes, nodes: sum(sizes), solutions: level, deadEnds, all };
}
/** Leftmost-square-first backtracking with an explicit stack, until the first solution. */
function leftmostRun(n) {
  const queens = [];
  let puts = 0;
  let backs = 0;
  let from = 0;
  while (queens.length < n) {
    let c = from;
    while (c < n && !peaceful([...queens, c])) c++;
    if (c < n) { queens.push(c); puts++; from = 0; } else { from = queens.pop() + 1; backs++; }
  }
  return { puts, backs, queens };
}
const subsetsOf = (items) => items.reduce((all, item) => all.concat(all.map((set) => [...set, item])), [[]]);

/** Fewest coins for an amount, by flooding outwards from 0 one coin at a time (not a table filled in order). */
function fewestCoins(coins, amount) {
  if (amount === 0) return 0;
  let frontier = new Set([0]);
  const seen = new Set([0]);
  for (let used = 1; used <= amount; used++) {
    const next = new Set();
    for (const a of frontier) for (const c of coins) { const b = a + c; if (b === amount) return used; if (b < amount && !seen.has(b)) { seen.add(b); next.add(b); } }
    frontier = next;
  }
  return Infinity;
}
function greedyCoins(coins, amount) {
  const out = [];
  let left = amount;
  while (left > 0) { const c = Math.max(...coins.filter((k) => k <= left)); out.push(c); left -= c; }
  return out;
}
/** Every multiset of coins (largest first) that pays `amount` with exactly `count` coins. */
function waysToPay(coins, amount, count) {
  const sorted = coins.slice().sort((a, b) => b - a);
  const out = [];
  const go = (i, left, chosen) => {
    if (left === 0 && chosen.length === count) { out.push(chosen); return; }
    if (i === sorted.length || chosen.length >= count || left <= 0) return;
    go(i, left - sorted[i], [...chosen, sorted[i]]);
    go(i + 1, left, chosen);
  };
  go(0, amount, []);
  return out;
}

const clash = (a, b) => !(a.end <= b.start || b.end <= a.start);
const peacefulSet = (set) => set.every((a, i) => set.every((b, j) => i >= j || !clash(a, b)));
function roomFacts(meetings) {
  const good = subsetsOf(meetings).filter(peacefulSet);
  const most = Math.max(...good.map((s) => s.length));
  return { good, most, best: good.filter((s) => s.length === most) };
}
/** A greedy booking rule, carried out with a sort at every step. Also reports whether it ever met a tie. */
function bookBy(meetings, keyOf) {
  const booked = [];
  let tie = false;
  for (;;) {
    const open = meetings.filter((m) => !booked.includes(m) && booked.every((b) => !clash(b, m))).sort((a, b) => keyOf(a) - keyOf(b));
    if (!open.length) return { booked, tie };
    if (open.length > 1 && keyOf(open[0]) === keyOf(open[1])) tie = true;
    booked.push(open[0]);
  }
}
const KEYS = { shortest: (m) => m.end - m.start, start: (m) => m.start, finish: (m) => m.end };
const hhmm = (t) => `${Math.floor(t)}:${String(Math.round((t % 1) * 60)).padStart(2, '0')}`;

/** Really run the forgetful recipe and count what it does. */
function forgetfulFib(n) {
  const calls = {};
  let total = 0;
  const f = (k) => { total++; calls[k] = (calls[k] || 0) + 1; return k <= 2 ? 1 : f(k - 1) + f(k - 2); };
  const value = f(n);
  return { value, total, calls };
}
/** Count routes by walking every one of them (right or down, never into a closed cell). */
function walkRoutes(rows, cols, closed, toR, toC) {
  const shut = new Set(closed.map(([r, c]) => `${r},${c}`));
  if (shut.has(`${toR},${toC}`)) return 0;
  let count = 0;
  const go = (r, c) => {
    if (r > toR || c > toC || shut.has(`${r},${c}`)) return;
    if (r === toR && c === toC) { count++; return; }
    go(r, c + 1);
    go(r + 1, c);
  };
  go(0, 0);
  return count;
}

const roadLength = (edges, a, b) => { const e = edges.find(([x, y]) => (x === a && y === b) || (x === b && y === a)); return e ? e[2] : null; };
/** Every route from `from` that visits no place twice. */
function simpleRoutes(nodes, edges, from) {
  const out = [];
  const grow = (path, cost) => {
    out.push({ path, cost });
    for (const v of Object.keys(nodes)) {
      const w = roadLength(edges, path[path.length - 1], v);
      if (w !== null && !path.includes(v)) grow([...path, v], cost + w);
    }
  };
  grow([from], 0);
  return out;
}
/** True shortest distances by comparing every simple route (no clever algorithm at all). */
function distancesByEnumeration(nodes, edges, from) {
  const best = {};
  for (const { path, cost } of simpleRoutes(nodes, edges, from)) { const to = path[path.length - 1]; if (!(to in best) || cost < best[to]) best[to] = cost; }
  return best;
}
/** Dijkstra's algorithm as the lesson states it, with a record of everything that happens. */
function runDijkstra(nodes, edges, start) {
  const ids = Object.keys(nodes);
  const label = Object.fromEntries(ids.map((id) => [id, Infinity]));
  label[start] = 0;
  const settled = [];
  const events = [];
  let ties = 0;
  while (settled.length < ids.length) {
    const open = ids.filter((id) => !settled.includes(id) && label[id] < Infinity);
    if (!open.length) break;
    const least = Math.min(...open.map((id) => label[id]));
    const candidates = open.filter((id) => label[id] === least);
    if (candidates.length > 1) ties++;
    const u = candidates[0];
    const before = Object.fromEntries(ids.filter((id) => !settled.includes(id)).map((id) => [id, label[id]]));
    settled.push(u);
    for (const v of ids) {
      const w = roadLength(edges, u, v);
      if (w === null || settled.includes(v)) continue;
      const via = label[u] + w;
      events.push({ from: u, to: v, old: label[v], via, better: via < label[v] });
      if (via < label[v]) label[v] = via;
    }
    events.push({ settled: u, before });
  }
  return { label, order: settled, events, ties };
}
const crosses = (p, q, r, s) => {
  const side = (a, b, c) => Math.sign((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]));
  return side(p, q, r) * side(p, q, s) < 0 && side(r, s, p) * side(r, s, q) < 0;
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const place = (ch) => ALPHABET.indexOf(ch) + 1;
const wordSum = (word) => sum([...word].map(place));

const permutations = (list) => (list.length < 2 ? [list] : list.flatMap((v, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [v, ...p])));
const straight = (towns, a, b) => Math.round(Math.sqrt((towns[a][0] - towns[b][0]) ** 2 + (towns[a][1] - towns[b][1]) ** 2) / 10);
const loopLength = (towns, order) => sum(order.map((id, i) => straight(towns, id, order[(i + 1) % order.length])));
/** Different round trips through n towns, counted by listing every order and merging each loop with its mirror image. */
function countLoops(n) {
  const seen = new Set();
  for (const p of permutations(Array.from({ length: n - 1 }, (_, i) => i + 1))) {
    const forward = p.join(',');
    const backward = p.slice().reverse().join(',');
    seen.add(forward < backward ? forward : backward);
  }
  return seen.size;
}
const bigFactorial = (n) => { let out = 1n; for (let k = 1n; k <= BigInt(n); k++) out *= k; return out; };

/* ======================================================================
 * Whole-course checks
 * ==================================================================== */

test('the course has its six lessons, each 13 to 18 steps with reviews, hands-on steps, a recap and a teaser', () => {
  assert.deepEqual(course.chapters.map((c) => c.lessons.map((l) => l.id)), [['backtracking', 'greedy', 'dynamic-programming'], ['weighted-paths', 'hashing'], ['hard-problems']]);
  assert.deepEqual([course.id, course.category, course.level, course.color, course.cover, course.requires], ['algorithms-2', 'cs', 'Advanced', 'red', 'tree', ['algorithms']]);
  assert.ok(!/cannot be solved|impossible to solve|unsolvable|nobody can solve/i.test(JSON.stringify(course)), 'the course page does not overclaim about hard problems');
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.ok(lesson.steps.length >= 13 && lesson.steps.length <= 18, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) assert.ok(s.explain || s.gen, `${id}/${s.id}: a review step explains itself`);
    assert.ok(lesson.steps.filter((s) => s.type === 'interact').length >= 2, `${id}: at least two hands-on steps`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: next`);
    assert.ok(lesson.steps.some((s) => s.stretch), `${id}: has a stretch step`);
    assert.ok(['choice', 'interact', 'slider'].includes(lesson.steps[0].type), `${id}: opens with a question`);
    let infos = 0;
    for (const s of lesson.steps) { infos = s.type === 'info' ? infos + 1 : 0; assert.ok(infos < 3, `${id}: three info steps in a row`); }
    // pseudocode is never graded in this course
    for (const s of lesson.steps) assert.ok(!(s.type === 'order' && s.code), `${id}/${s.id}: no graded pseudocode`);
    assert.ok(!lesson.steps.some((s) => s.type === 'code'), `${id}: no code steps`);
  }
});

test('no text contains undefined, NaN or an unfilled slot (every step, generated ones with many seeds)', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        const blob = JSON.stringify(s, (key, value) => (typeof value === 'function' ? undefined : value));
        assert.ok(!/undefined|NaN|\[object Object\]|Infinity|\$\{/.test(blob), `${id}/${step.id} seed ${k}: ${(blob.match(/.{40}(undefined|NaN|\[object Object\]|Infinity|\$\{).{30}/) || [''])[0]}`);
        if (!step.gen) break;
      }
    }
    assert.ok(!/undefined|NaN|\$\{/.test(lesson.recap.join(' ') + lesson.next), `${id} recap`);
  }
});

test('every choice has exactly one correct option and no duplicate options; multi, match, bucket and fill are well-formed', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(5 + k * 97), step.id);
        const where = `${id}/${step.id} seed ${k}`;
        if (s.type === 'choice' || s.type === 'multi') {
          if (s.type === 'choice') assert.equal(correctOf(s).length, 1, where);
          else assert.ok(correctOf(s).length >= 1 && correctOf(s).length < s.options.length, where);
          assert.ok(distinct(s.options.map((o) => o.text.trim())), `${where}: duplicate options`);
          assert.ok(s.options.every((o) => o.text.trim()), `${where}: empty option`);
          if (s.mode !== 'predict') for (const o of s.options) assert.ok(o.correct || o.why, `${where}: the wrong option "${o.text}" says why it is wrong`);
        }
        if (s.type === 'numeric') {
          assert.ok(Number.isFinite(s.answer), where);
          soundWrongs(s, where);
        }
        if (s.type === 'match') { assert.ok(distinct(s.pairs.map((p) => p[0])) && distinct(s.pairs.map((p) => p[1])), where); }
        if (s.type === 'bucket') {
          assert.ok(distinct(s.items.map((it) => it.text)), where);
          s.buckets.forEach((_, b) => assert.ok(s.items.some((it) => it.bucket === b), `${where}: bucket ${b} is used`));
          assert.ok(s.items.every((it) => it.why), `${where}: every item says why`);
        }
        if (s.type === 'fill') for (const b of s.blanks) { if (b.kind === 'select') assert.ok(b.options.includes(b.answer) && distinct(b.options), where); else assert.ok(b.numeric, `${where}: typed blanks are numbers`); }
        if (s.type !== 'info' && s.type !== 'reflect' && s.mode !== 'predict' && s.type !== 'match') assert.ok(s.explain.trim().length > 20, `${where}: has an explanation`);
        if (s.type === 'interact') assert.equal(typeof s.check, 'function', where);
        if (!step.gen) break;
      }
    }
  }
});

/* ======================================================================
 * Lesson 1 · Try, Fail, Back Up
 * ==================================================================== */

test('queens: brute force finds 2 solutions among 256 boards, 4 among 46,656, and 92 for eight queens', () => {
  const four = queensByBruteForce(4);
  assert.deepEqual([four.boards, four.solutions.length], [256, 2]);
  const six = queensByBruteForce(6);
  assert.deepEqual([six.boards, six.solutions.length], [46656, 4]);
  // eight queens: a solution needs eight different columns, so trying the 8! orders of the columns is enough
  assert.equal(permutations([0, 1, 2, 3, 4, 5, 6, 7]).filter(peaceful).length, 92);
  assert.equal(8 ** 8, 16777216);

  const hook = fixed('backtracking', 'hook');
  assert.match(hook.text, /4 × 4 × 4 × 4 = \*\*256 boards\*\*/);
  assert.equal(correctOf(hook)[0].text, '2');
  assert.match(flat(hook.explain), /Only \*\*2\*\*.*16,777,216 boards and only 92 solutions/);
  // the picture: one queen in the middle of a 5 × 5 board attacks 16 squares
  const fig = hook.figure;
  assert.deepEqual([fig.n, fig.queens], [5, [[2, 2]]]);
  let attacked = 0;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (!(r === 2 && c === 2) && Queens.attacks(2, 2, r, c)) attacked++;
  assert.equal(attacked, 16);

  // the widget's attack test agrees with an independent one on every pair of squares
  for (let r1 = 0; r1 < 6; r1++) for (let c1 = 0; c1 < 6; c1++) for (let r2 = 0; r2 < 6; r2++) for (let c2 = 0; c2 < 6; c2++) {
    if (r1 === r2 && c1 === c2) continue;
    const mine = r1 === r2 || c1 === c2 || r1 - c1 === r2 - c2 || r1 + c1 === r2 + c2;
    assert.equal(Queens.attacks(r1, c1, r2, c2), mine);
  }
});

test('queens: the tree sizes, the leftmost-first runs and every number the lesson quotes about them', () => {
  const t4 = queenLevels(4);
  const t6 = queenLevels(6);
  const t8 = queenLevels(8);
  assert.deepEqual([t4.sizes, t4.nodes, t4.deadEnds, t4.solutions.length], [[4, 6, 4, 2], 16, 4, 2]);
  assert.deepEqual([t6.nodes, t6.solutions.length], [152, 4]);
  assert.deepEqual([t8.nodes, t8.solutions.length], [2056, 92]);
  for (const n of [4, 5, 6, 7, 8]) {
    const mine = queenLevels(n);
    const theirs = H.queensSearch(n);
    assert.deepEqual([theirs.nodes, theirs.solutions, theirs.deadEnds, theirs.perLevel.slice(1)], [mine.nodes, mine.solutions.length, mine.deadEnds, mine.sizes], `helper, n = ${n}`);
    const run = leftmostRun(n);
    const first = H.queensFirst(n);
    assert.deepEqual([first.puts, first.backs, first.found], [run.puts, run.backs, run.queens], `first solution, n = ${n}`);
    assert.ok(peaceful(run.queens) && run.queens.length === n);
  }
  assert.deepEqual([leftmostRun(4).puts, leftmostRun(4).backs], [8, 4]);
  assert.equal(leftmostRun(6).puts, 31);

  assert.match(flat(raw('backtracking', 'four-queens').explain), /puts down 8 queens and takes 4 of them back before the first solution/);
  const count = fixed('backtracking', 'tree-count');
  assert.deepEqual(blankValues(count), [4, 6, 4, 2, 16]);
  assert.match(flat(count.explain), /4 \+ 6 \+ 4 \+ 2 = \*\*16 boards\*\*, and 4 of them are dead ends/);
  assert.match(count.figure.alt, /4 ways to place the first queen, then 6 boards with two queens, 4 with three and 2 with four\. 4 boards are dead ends.*the 2 boards at the bottom are solutions/);
  // the drawn tree has one box per board: the empty board plus 16
  assert.equal((count.figure.content.match(/<rect /g) || []).length, 17);
  assert.equal((count.figure.content.match(/stroke-red" stroke-width="3.5"/g) || []).length, 4, 'four dead ends are framed in red');
  assert.equal((count.figure.content.match(/fill-green-soft/g) || []).length, 2, 'two solutions are framed in green');

  const six = raw('backtracking', 'six-queens');
  assert.match(flat(six.text), /There are 46,656 ways to put one queen in each row, and only 4 of them are solutions/);
  assert.match(flat(six.explain), /puts down 31 queens before the first solution.*has only 152 boards.*up to 46,656 boards/);
  // the hints: no solution of either puzzle has a queen in a corner
  for (const sol of t4.solutions) assert.ok(sol[0] !== 0 && sol[0] !== 3, 'four queens: no corner in row 1');
  for (const sol of t6.solutions) assert.ok(![sol[0], sol[5]].some((c) => c === 0 || c === 5), 'six queens: no corner');
  assert.match(six.hints[1], /No solution has a queen in a corner/);

  const growth = fixed('backtracking', 'growth');
  const rows = [...growth.text.matchAll(/\|\s*(\d)\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|/g)].map((m) => [int(m[1]), int(m[2]), int(m[3])]);
  assert.deepEqual(rows, [[4, 256, 16], [6, 46656, 152], [8, 16777216, 2056]]);
  for (const [n, brute, tree] of rows) { assert.equal(brute, n ** n); assert.equal(tree, queenLevels(n).nodes); }
  const said = flat(growth.options.map((o) => o.why || '').join(' ') + growth.explain);
  assert.match(said, /from 16 boards to 2,056: about 130 times as many/);
  assert.ok(Math.abs(2056 / 16 - 130) < 5);
  assert.match(said, /16 times fewer boards for 4 queens, about 8,000 times fewer for 8/);
  assert.equal(256 / 16, 16);
  assert.ok(Math.abs(16777216 / 2056 - 8000) / 8000 < 0.05);
  assert.match(lessons.backtracking.recap[2], /about 2,056 partial boards instead of 16,777,216 complete ones/);
  assert.match(flat(raw('backtracking', 'reflect').model), /about 2,056 partial boards instead of 16,777,216/);
});

test('four-queens, six-queens: the check accepts exactly the boards with all queens down, for every board a search can reach', () => {
  for (const [id, n] of [['four-queens', 4], ['six-queens', 6]]) {
    const step = raw('backtracking', id);
    assert.equal(step.widget.n, n);
    const tree = queenLevels(n);
    let accepted = 0;
    for (const queens of tree.all) {
      const solved = queens.length === n;
      for (const stuck of solved ? [false] : [false, true]) {
        const verdict = step.check({ n, queens, placed: queens.length, row: solved ? null : queens.length, solved, stuck, free: [], puts: queens.length, backs: 0 });
        assert.equal(verdict === true, solved, `${id}: ${queens.join('')}`);
        if (!solved) assert.equal(typeof verdict, 'string');
        if (!solved && stuck) assert.match(verdict, /no square left/);
      }
      if (solved) accepted++;
    }
    assert.equal(accepted, tree.solutions.length);
    assert.ok(peaceful(step.solution.queens) && step.solution.queens.length === n, `${id}: the solution is a solution`);
    // a board is never reachable with an attack on it: the widget refuses such squares
    for (const queens of tree.all) for (let c = 0; c < n && queens.length < n; c++) assert.equal(Queens.attacker(queens, queens.length, c) < 0, peaceful([...queens, c]));
  }
});

test('what-next: row 3 really is dead, and column 4 of row 2 is the one square still to try', () => {
  const step = fixed('backtracking', 'what-next');
  assert.deepEqual([step.figure.n, step.figure.queens, step.figure.highlight], [4, [0, 2], 2]);
  assert.ok(peaceful([0, 2]));
  for (let c = 0; c < 4; c++) assert.ok(!peaceful([0, 2, c]), 'every square of row 3 is attacked');
  const row2 = [0, 1, 2, 3].filter((c) => peaceful([0, c]));
  assert.deepEqual(row2, [2, 3], 'row 2 has two safe squares: columns 3 and 4');
  assert.match(correctOf(step)[0].text, /Take back the queen in row 2 and move her to the next safe square of row 2/);
  assert.match(flat(step.options.map((o) => o.why || '').join(' ')), /Row 2 still has a safe square that has not been tried: column 4/);
  assert.match(step.figure.alt, /row 1, column 1 and in row 2, column 3/);
});

test('prune-size (generated): the keyed number is how many boards really contain the clashing queens', () => {
  const seen = new Set();
  for (const step of variants('backtracking', 'prune-size')) {
    const text = flat(step.text);
    const n = int(/\*\*(\d) × \1\*\* board/.exec(text)[1]);
    const fixedRows = /rows 1, 2 and 3 are down, and two of them attack/.test(text) ? 3 : (/rows 1 and 2 are down, and they attack/.test(text) ? 2 : null);
    assert.ok(fixedRows, text);
    const rest = int(/filling the other (\d) rows/.exec(text)[1]);
    assert.equal(rest, n - fixedRows);
    // count the boards: fix clashing queens in the top rows and run through every way of filling the others
    let count = 0;
    const top = fixedRows === 2 ? [0, 0] : [0, 2, 1];
    assert.ok(!peaceful(top), 'the fixed queens attack each other');
    const total = n ** rest;
    for (let code = 0; code < total; code++) count++;
    assert.equal(count, n ** (n - fixedRows));
    assert.equal(step.answer, count, text);
    soundWrongs(step, 'prune-size');
    assert.ok(step.explain.includes(`**${commas(count)}** boards`));
    assert.ok(flat(step.explain).startsWith(`${new Array(rest).fill(n).join(' × ')} = `));
    assert.match(step.hints[1], new RegExp(`${rest} rows with ${n} choices each`));
    seen.add(`${n}/${fixedRows}`);
  }
  assert.equal(seen.size, 8, 'all eight combinations of board size and fixed rows turn up');
});

test('next-row (generated): counting the unattacked squares of the outlined row on the pictured board gives the keyed number', () => {
  const answers = new Set();
  for (const step of variants('backtracking', 'next-row', 300)) {
    const fig = step.figure;
    const text = flat(step.text);
    const [, n, upTo, askRow] = /on a (\d) × \1 board has placed queens in rows 1 to (\d)\. \*\*How many squares of row (\d)\*\*/.exec(text).map(Number);
    assert.deepEqual([fig.n, fig.queens.length, fig.highlight, fig.mode, fig.attacks], [n, upTo, upTo, 'view', false], 'the picture matches the wording and does not mark attacked squares');
    assert.equal(askRow, upTo + 1);
    assert.ok(askRow <= n);
    // the alt text names the same squares as the picture
    const named = [...fig.alt.matchAll(/row (\d), column (\d)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    assert.deepEqual(named, fig.queens.map((c, r) => [r + 1, c + 1]));
    assert.ok(peaceful(fig.queens), 'a backtracking search never has attacking queens on the board');
    const safe = [];
    for (let c = 0; c < n; c++) if (peaceful([...fig.queens, c])) safe.push(c + 1);
    assert.equal(step.answer, safe.length, `${fig.queens} on ${n}`);
    answers.add(safe.length);
    soundWrongs(step, 'next-row');
    for (const [value, why] of step.wrong) { assert.equal(value, n - upTo); assert.match(why, /only rules out the columns that already hold a queen/); }
    // the worked explanation: every ruled-out column with a true reason, and the right list of safe ones
    const explain = flat(step.explain);
    const ruled = [...explain.matchAll(/column (\d) \((same column as|on a diagonal of) the queen in row (\d)\)/g)];
    assert.equal(ruled.length, n - safe.length, 'every unsafe column is explained');
    for (const [, col, how, row] of ruled) {
      const qc = fig.queens[Number(row) - 1] + 1;
      if (how === 'same column as') assert.equal(qc, Number(col));
      else assert.equal(Math.abs(qc - Number(col)), askRow - Number(row), `column ${col} is on a diagonal of the queen in row ${row}`);
      assert.ok(!safe.includes(Number(col)));
    }
    if (safe.length) {
      const m = /That leaves \*\*(\d)\*\* safe squares?: columns? ([\d, and]+)\./.exec(explain);
      assert.equal(Number(m[1]), safe.length);
      assert.deepEqual(ints(m[2]), safe);
      assert.equal(/safe square:/.test(explain), safe.length === 1, 'singular and plural');
    } else assert.match(explain, new RegExp(`\\*\\*No square\\*\\* of row ${askRow} is safe.*takes back the queen in row ${upTo}`));
  }
  assert.ok(answers.has(0) && answers.size >= 3, `dead ends and several other counts turn up (${[...answers]})`);
});

test('parcels: one subset in 32 makes 15 kg, take-first backtracking needs 11 decisions, and the check accepts exactly the hit', () => {
  const step = raw('backtracking', 'parcels');
  const { items, target } = step.widget;
  assert.deepEqual([items, target], [[9, 7, 5, 4, 2], 15]);
  const hits = subsetsOf(items).filter((set) => sum(set) === target);
  assert.equal(subsetsOf(items).length, 32);
  assert.deepEqual(hits, [[9, 4, 2]], 'exactly one way of loading 15 kg');
  // take before skip, with an explicit stack of decisions
  let path = '';
  let steps = 0;
  const totalOf = (p) => sum(items.filter((_, i) => p[i] === 'T'));
  const dead = (p) => totalOf(p) > target || (p.length === items.length && totalOf(p) !== target);
  let nextTry = 'T';
  while (totalOf(path) !== target) {
    if (!dead(path) && nextTry) { path += nextTry; steps++; nextTry = 'T'; continue; }
    // back up: undo decisions until one is a "take" that can be turned into a "skip"
    let last = path[path.length - 1];
    path = path.slice(0, -1);
    while (last === 'S') { last = path[path.length - 1]; path = path.slice(0, -1); }
    nextTry = 'S';
  }
  assert.deepEqual([path, steps], ['TSSTT', 11]);
  const mine = H.subsetFirst(items, target);
  assert.deepEqual([mine.found, mine.steps], [path, steps]);
  assert.equal(step.solution.path, path);
  assert.match(flat(step.explain), /2 × 2 × 2 × 2 × 2 = 32 ways.*\(9 \+ 4 \+ 2\) after 11 decisions/);
  assert.match(step.hints[1], /The 9 kg parcel belongs in the load\. Which two smaller parcels add the missing 6 kg/);

  // every string of decisions the widget allows
  let accepted = 0;
  const all = [''];
  for (let len = 1; len <= items.length; len++) for (const p of all.filter((x) => x.length === len - 1)) all.push(`${p}T`, `${p}S`);
  for (const p of all) {
    const state = TakeSkip.replay(items, target, p);
    if (state.path !== p) continue; // not reachable: an earlier decision already ended the run
    assert.equal(state.total, totalOf(p));
    assert.equal(state.hit, totalOf(p) === target);
    assert.equal(state.over, totalOf(p) > target);
    for (const stuck of [false, true]) {
      const verdict = step.check({ ...state, target, stuck: stuck && !state.hit, steps: p.length, backs: 0 });
      assert.equal(verdict === true, totalOf(p) === target, p);
    }
    if (state.hit) accepted++;
  }
  assert.equal(accepted, 1);

  const rule = fixed('backtracking', 'prune-rule');
  assert.deepEqual(rule.options.map((o) => !!o.correct), [true, true, false, false]);
  assert.ok(16 > 15 && 6 + 5 < 15 && 9 + 4 + 2 === 15);
  // every option states the load and what is still undecided, so each one can be decided from its own wording:
  // a branch is dead exactly when the load is over the target, or cannot reach it even with everything still to come
  for (const o of rule.options) {
    const load = int(/The load is (\d+) kg/.exec(o.text)[1]);
    const total = /undecided parcels weigh (\d+) kg in total/.exec(o.text);
    const listed = /undecided parcels weigh ([\d kg and,]+)$/.exec(o.text);
    const single = /a (\d+) kg parcel is still undecided/.exec(o.text);
    let most = null; // the heaviest load this branch can still reach
    let reachable = null;
    if (total) most = load + int(total[1]);
    else if (listed) { most = load + sum(ints(listed[1])); reachable = subsetsOf(ints(listed[1])).some((set) => load + sum(set) === 15); }
    else if (single) { most = load + int(single[1]); reachable = [load, most].includes(15); }
    else assert.match(o.text, /two parcels are still undecided/);
    const dead = load > 15 || (most !== null && most < 15);
    assert.equal(!!o.correct, dead, o.text);
    if (!o.correct) assert.equal(reachable, true, `${o.text}: 15 kg can still be reached, so the branch must be explored`);
  }
  assert.match(rule.options[3].why, /11 \+ 4 = 15/);
});

/* ======================================================================
 * Lesson 2 · Take the Best Bite
 * ==================================================================== */

test('ordinary coins: greedy is optimal for every amount up to 99; 68 takes 7 coins and the check wants exactly that', () => {
  const coins = [1, 5, 10, 25];
  for (let a = 1; a <= 99; a++) assert.equal(greedyCoins(coins, a).length, fewestCoins(coins, a), `amount ${a}`);
  const step = raw('greedy', 'make-change');
  assert.deepEqual([step.widget.coins, step.widget.target], [coins, 68]);
  assert.equal(fewestCoins(coins, 68), 7);
  assert.deepEqual(greedyCoins(coins, 68), [25, 25, 10, 5, 1, 1, 1]);
  assert.deepEqual(step.solution.coins, [25, 25, 10, 5, 1, 1, 1]);
  assert.match(flat(step.explain), /25 \+ 25 \+ 10 \+ 5 \+ 1 \+ 1 \+ 1 = 68: \*\*7 coins\*\*, and no way of paying 68 uses fewer/);
  // every tray the widget can hold (it refuses to overshoot, and it is full at 16 coins)
  let accepted = 0;
  for (let q = 0; q <= 2; q++) for (let d = 0; d <= 6; d++) for (let n = 0; n <= 13; n++) for (let p = 0; p <= 16; p++) {
    const list = [...new Array(q).fill(25), ...new Array(d).fill(10), ...new Array(n).fill(5), ...new Array(p).fill(1)];
    if (sum(list) > 68 || list.length > 16) continue;
    const state = Coins.pay(coins, 68, list, 16);
    assert.deepEqual([state.total, state.count, state.exact, state.left], [sum(list), list.length, sum(list) === 68, 68 - sum(list)]);
    const verdict = step.check(state);
    assert.equal(verdict === true, sum(list) === 68 && list.length === 7, list.join('+'));
    if (verdict === true) accepted++;
    else if (sum(list) === 68) assert.match(verdict, new RegExp(`with ${list.length} coins`));
    else if (list.length) assert.match(verdict, new RegExp(`holds ${sum(list)}\\. Another ${68 - sum(list)} is missing`));
  }
  assert.equal(accepted, waysToPay(coins, 68, 7).length);
  assert.equal(accepted, 1, 'only one way of paying 68 with 7 coins');
});

test('greedy-run (generated): simulating the till on the worded amount gives the keyed number of coins', () => {
  const amounts = new Set();
  for (const step of variants('greedy', 'greedy-run')) {
    const amount = int(/hand over for (\d+)\?/.exec(flat(step.text))[1]);
    amounts.add(amount);
    const coins = greedyCoins([1, 5, 10, 25], amount);
    assert.equal(step.answer, coins.length, `amount ${amount}`);
    assert.equal(step.answer, fewestCoins([1, 5, 10, 25], amount), 'and it is the best possible, as the explanation says');
    soundWrongs(step, 'greedy-run');
    for (const [value] of step.wrong) assert.equal(value, new Set(coins).size, 'the anticipated slip is the number of kinds of coin');
    const explain = flat(step.explain);
    assert.ok(explain.startsWith(`${coins.join(' + ')} = ${amount}. That is **${coins.length} coin`), explain);
    assert.match(step.hints[1], new RegExp(`After the 25s, ${amount % 25} is left`));
    assert.ok(amount % 25 !== 0);
  }
  assert.ok(amounts.size > 40);
});

test('coins 1, 3, 4: greedy pays 6 with three coins, two are enough, and both checks say so', () => {
  const coins = [1, 3, 4];
  assert.deepEqual(greedyCoins(coins, 6), [4, 1, 1]);
  assert.equal(fewestCoins(coins, 6), 2);
  assert.deepEqual(waysToPay(coins, 6, 2), [[3, 3]]);
  const odd = raw('greedy', 'odd-coins');
  const beat = raw('greedy', 'beat-greedy');
  assert.deepEqual([odd.widget.coins, odd.widget.target, odd.widget.greedy], [coins, 6, true]);
  assert.deepEqual([beat.widget.coins, beat.widget.target, !!beat.widget.greedy], [coins, 6, false]);
  assert.deepEqual(odd.solution.coins, [4, 1, 1]);
  assert.deepEqual(beat.solution.coins, [3, 3]);
  // every sequence of coins that does not overshoot
  const sequences = [[]];
  for (let i = 0; i < sequences.length; i++) for (const c of coins) if (sum(sequences[i]) + c <= 6) sequences.push([...sequences[i], c]);
  let greedyRuns = 0;
  let beaten = 0;
  for (const seq of sequences) {
    const state = Coins.pay(coins, 6, seq, 10);
    assert.deepEqual(state.coins, seq);
    // is this what the greedy rule would have done so far?
    let left = 6;
    let obeys = true;
    for (const c of seq) { if (c !== Math.max(...coins.filter((k) => k <= left))) obeys = false; left -= c; }
    assert.equal(state.greedy, obeys, seq.join('+'));
    if (obeys) {
      // the strict tray only ever holds such sequences
      assert.equal(odd.check(state) === true, sum(seq) === 6);
      if (sum(seq) === 6) { greedyRuns++; assert.deepEqual(seq, [4, 1, 1]); }
    }
    const verdict = beat.check(state);
    assert.equal(verdict === true, sum(seq) === 6 && seq.length === 2, seq.join('+'));
    if (verdict === true) beaten++;
    else if (sum(seq) === 6 && obeys) assert.match(verdict, /greedy answer again: 4 \+ 1 \+ 1/);
    else if (sum(seq) === 6) assert.match(verdict, new RegExp(`pays 6 with ${seq.length} coins\\. Two are enough`));
  }
  assert.equal(greedyRuns, 1);
  assert.equal(beaten, 1);
  assert.match(flat(odd.explain), /Greedy pays 4 \+ 1 \+ 1: \*\*three coins\*\*/);
  assert.match(flat(beat.explain), /^3 \+ 3: \*\*two coins\*\*/);
  assert.match(lessons.greedy.recap[2], /pays 6 as 4 \+ 1 \+ 1, although 3 \+ 3 is better/);
});

test('fewest (generated): the worded greedy payment is what greedy does, and the keyed number is the true minimum', () => {
  const asked = new Set();
  for (const step of variants('greedy', 'fewest', 300)) {
    const text = flat(step.text);
    const m = /coins of \*\*([\d, and]+)\*\*\. The greedy rule pays \*\*(\d+)\*\* as ([\d +]+): that is (\d+) coins\. What is the \*\*smallest number of coins\*\* that pays (\d+) exactly/.exec(text);
    assert.ok(m, text);
    const coins = ints(m[1]);
    const amount = Number(m[2]);
    const quoted = ints(m[3]);
    assert.equal(Number(m[5]), amount);
    assert.deepEqual(quoted, greedyCoins(coins, amount), 'the greedy payment in the question');
    assert.equal(Number(m[4]), quoted.length);
    assert.equal(sum(quoted), amount);
    const best = fewestCoins(coins, amount);
    assert.equal(step.answer, best, text);
    assert.ok(best < quoted.length, 'greedy really is beaten here');
    soundWrongs(step, 'fewest');
    assert.deepEqual(step.wrong.map((w) => w[0]), [quoted.length]);
    // the advice "use fewer of the biggest coin" must be true of every best payment
    const big = Math.max(...coins);
    const bigIn = (list) => list.filter((c) => c === big).length;
    const optimal = waysToPay(coins, amount, best);
    assert.ok(optimal.length >= 1);
    for (const way of optimal) assert.ok(bigIn(way) < bigIn(quoted), `${way} uses fewer ${big}s than greedy`);
    assert.match(step.wrong[0][1], bigIn(quoted) === 1 ? new RegExp(`no ${big} at all`) : new RegExp(`fewer ${big}s`));
    assert.match(step.hints[0], new RegExp(`Greedy uses ${bigIn(quoted)} coins? of ${big}\\.`));
    const hinted = /with (no \d+ at all|(\d+) coins? of \d+)/.exec(step.hints[1]);
    const hintedCount = hinted[2] ? Number(hinted[2]) : 0;
    assert.ok(optimal.some((way) => bigIn(way) === hintedCount), 'the second hint leads to a best payment');
    const shown = ints(/^([\d +]+) = /.exec(flat(step.explain))[1]);
    assert.deepEqual([sum(shown), shown.length], [amount, best], 'the payment shown in the explanation');
    assert.ok(shown.every((c) => coins.includes(c)));
    asked.add(`${coins}/${amount}`);
  }
  assert.ok(asked.size >= 20, `many different questions (${asked.size})`);
});

test('the timetable: 4 meetings is the most, only D, A, F, C does it, and the free-choice check accepts exactly that', () => {
  const step = raw('greedy', 'meetings-free');
  const meetings = step.widget.meetings;
  assert.equal(meetings.length, 8);
  const room = roomFacts(meetings);
  assert.equal(room.most, 4);
  assert.deepEqual(room.best.map((s) => s.map((m) => m.id).sort().join('')), ['ACDF'], 'one best schedule only');
  assert.match(flat(step.explain), /D, A, F and C: \*\*4 meetings\*\*, and no choice of five fits/);
  let accepted = 0;
  for (const set of room.good) {
    const picked = set.map((m) => m.id);
    const full = meetings.every((m) => set.includes(m) || set.some((b) => clash(b, m)));
    assert.equal(Meet.freeOf(meetings, picked).length === 0, full, 'the widget and the test agree on what still fits');
    const verdict = step.check({ picked, count: picked.length, full, rule: null, results: {} });
    assert.equal(verdict === true, picked.length === 4, picked.join(''));
    if (verdict === true) accepted++;
    else if (picked.length) assert.match(verdict, full ? /nothing else fits\. But 4 are possible/ : /More will fit: 4 are possible/);
  }
  assert.equal(accepted, 1);
  assert.deepEqual(step.solution.picked.slice().sort(), ['A', 'C', 'D', 'F']);
  for (const a of meetings) for (const b of meetings) if (a !== b) assert.equal(Meet.overlap(a, b), clash(a, b));
});

test('three rules: shortest books A, D, H; earliest start G, H; earliest finish D, A, F, C; no rule ever meets a tie', () => {
  const step = raw('greedy', 'three-rules');
  const meetings = step.widget.meetings;
  assert.deepEqual(step.widget.rules, ['shortest', 'start', 'finish']);
  const want = { shortest: ['A', 'D', 'H'], start: ['G', 'H'], finish: ['D', 'A', 'F', 'C'] };
  for (const rule of ['shortest', 'start', 'finish']) {
    const run = bookBy(meetings, KEYS[rule]);
    assert.equal(run.tie, false, `${rule}: the rule's choice is always unique, so there is one valid way to carry it out`);
    assert.deepEqual(run.booked.map((m) => m.id), want[rule], rule);
    assert.deepEqual(Meet.runRule(meetings, rule), want[rule], `widget, ${rule}`);
    // step by step, the widget allows exactly the rule's choice
    const picked = [];
    for (const id of want[rule]) { assert.deepEqual(Meet.ruleChoices(meetings, picked, rule), [id]); picked.push(id); }
    assert.deepEqual(Meet.ruleChoices(meetings, picked, rule), []);
    assert.deepEqual(H.runRule(meetings, rule).map((m) => m.id), want[rule]);
  }
  const rows = [...step.explain.matchAll(/\|\s*([A-Za-z ]+?)\s*\|\s*([A-H, ]+?)\s*\|\s*(\d)\s*\|/g)].map((m) => [m[1], m[2].split(', '), Number(m[3])]);
  assert.deepEqual(rows, [['Shortest first', want.shortest, 3], ['Earliest start first', want.start, 2], ['Earliest finish first', want.finish, 4]]);
  // the two stories told about the failures
  const by = Object.fromEntries(meetings.map((m) => [m.id, m]));
  assert.equal(Math.min(...meetings.map((m) => m.start)), by.G.start, 'G begins first');
  assert.ok(by.G.end - by.G.start === Math.max(...meetings.map((m) => m.end - m.start)), 'and it is the longest meeting');
  assert.ok(clash(by.H, by.F) && clash(by.H, by.C) && !clash(by.F, by.C), 'H sits across both F and C, which would fit together');
  assert.match(flat(step.explain), /Only \*earliest finish\* found all 4/);
  // the check wants all three rules run
  for (const done of subsetsOf(['shortest', 'start', 'finish'])) {
    const results = Object.fromEntries(done.map((rule) => [rule, want[rule].length]));
    const verdict = step.check({ picked: [], count: 0, full: false, rule: 'finish', results });
    assert.equal(verdict === true, done.length === 3, done.join());
    if (verdict !== true) for (const rule of ['shortest', 'start', 'finish']) assert.equal(verdict.includes(H.RULE_NAME[rule]), !done.includes(rule));
  }
});

test('schedule (generated): of all bookings without overlap, exactly the largest ones are accepted', () => {
  const sizes = new Set();
  for (const step of variants('greedy', 'schedule')) {
    const meetings = step.widget.meetings;
    const said = { Five: 5, Six: 6, Seven: 7 }[/^(Five|Six|Seven) /.exec(flat(step.text))[1]];
    assert.equal(meetings.length, said);
    assert.ok(meetings.every((m) => m.start >= 9 && m.end <= 17 && m.end > m.start && (m.start * 2) % 1 === 0 && (m.end * 2) % 1 === 0), 'half-hour grid inside the drawn day');
    assert.deepEqual([step.widget.from, step.widget.to, step.widget.rule, step.widget.rules], [9, 17, undefined, undefined]);
    assert.ok(distinct(meetings.map((m) => m.end)), 'no two requests finish together, so "finishes first" is clear');
    const room = roomFacts(meetings);
    sizes.add(`${said}/${room.most}`);
    for (const set of room.good) {
      const picked = set.map((m) => m.id);
      const full = meetings.every((m) => set.includes(m) || set.some((b) => clash(b, m)));
      const verdict = step.check({ picked, count: picked.length, full, rule: null, results: {} });
      assert.equal(verdict === true, picked.length === room.most, picked.join(''));
      if (verdict !== true && picked.length) {
        assert.match(verdict, full ? /nothing else fits\. But more are possible/ : /At least one more fits/);
        assert.ok(verdict.startsWith(`${picked.length} booked`));
      }
    }
    // the solution and the explanation are the earliest-finish schedule, which is a largest one
    const greedy = bookBy(meetings, KEYS.finish).booked;
    assert.equal(greedy.length, room.most, 'earliest finish first is optimal');
    assert.deepEqual(step.solution.picked, greedy.map((m) => m.id));
    const listed = [...flat(step.explain).matchAll(/([A-H]) \(until (\d+:\d\d)\)/g)].map((m) => [m[1], m[2]]);
    assert.deepEqual(listed, greedy.map((m) => [m.id, hhmm(m.end)]));
    assert.match(flat(step.explain), new RegExp(`: \\*\\*${room.most} (meetings|rehearsals|lessons|training sessions)\\*\\*`));
    assert.ok(step.hints[1].includes(`${greedy[0].id} (${hhmm(greedy[0].start)}–${hhmm(greedy[0].end)})`));
    assert.equal(Math.min(...meetings.map((m) => m.end)), greedy[0].end);
    // not a give-away: at least one of the two tempting rules falls short
    assert.ok(Math.min(bookBy(meetings, KEYS.shortest).booked.length, bookBy(meetings, KEYS.start).booked.length) < room.most);
  }
  assert.ok(sizes.size >= 4, `several sizes (${[...sizes]})`);
});

test('smallest-fail: with coins 1, 5 and 12 greedy first goes wrong at 15, and every quoted payment is right', () => {
  const step = fixed('greedy', 'smallest-fail');
  const coins = [1, 5, 12];
  assert.deepEqual(ints(/coins of \*\*([\d, and]+)\*\*/.exec(step.text)[1]), coins);
  let first = null;
  for (let a = 1; a <= 60 && first === null; a++) if (greedyCoins(coins, a).length > fewestCoins(coins, a)) first = a;
  assert.equal(first, 15);
  assert.equal(step.answer, 15);
  assert.equal(H.firstGreedyFailure(coins), 15);
  assert.deepEqual([greedyCoins(coins, 15), fewestCoins(coins, 15)], [[12, 1, 1, 1], 3]);
  assert.match(flat(step.explain), /greedy pays 12 \+ 1 \+ 1 \+ 1, which is 4 coins\. But 5 \+ 5 \+ 5 does it with 3/);
  const said = Object.fromEntries(step.wrong.map(([v, why]) => [v, why]));
  assert.deepEqual([greedyCoins(coins, 12).length, fewestCoins(coins, 12)], [1, 1]);
  assert.match(said[12], /single coin/);
  assert.deepEqual([greedyCoins(coins, 10), fewestCoins(coins, 10)], [[5, 5], 2]);
  assert.match(said[10], /5 \+ 5: two coins/);
  assert.deepEqual([greedyCoins(coins, 13), fewestCoins([1, 5], 13)], [[12, 1], 5]);
  assert.match(said[13], /12 \+ 1: two coins\. Without the 12 it would take five/);
  assert.deepEqual([greedyCoins(coins, 14), fewestCoins([1, 5], 14)], [[12, 1, 1], 6]);
  assert.match(said[14], /12 \+ 1 \+ 1: three coins\. Without the 12 it would take six/);
  assert.deepEqual([greedyCoins(coins, 24), fewestCoins(coins, 24)], [[12, 12], 2]);
  for (let a = 1; a < 12; a++) assert.equal(greedyCoins([1, 5], a).length, fewestCoins([1, 5], a), 'below 12 greedy is fine');
  // helper functions used all over the lesson
  for (const set of [[1, 3, 4], [1, 4, 5], [1, 5, 6], [1, 4, 6], [1, 6, 10], [1, 7, 10], [1, 5, 12], [1, 5, 10, 25], [1, 3, 5], [1, 2, 5]]) {
    for (let a = 1; a <= 40; a++) {
      assert.equal(H.minCoinsTable(set, a)[a], fewestCoins(set, a), `${set} / ${a}`);
      assert.deepEqual(H.greedyChange(set, a), greedyCoins(set, a));
      const way = H.bestChange(set, a);
      assert.deepEqual([sum(way), way.length], [a, fewestCoins(set, a)]);
    }
  }
});

/* ======================================================================
 * Lesson 3 · Remember Your Answers
 * ==================================================================== */

test('fibonacci: the forgetful recipe really makes 15 calls for fib(6), 109 for fib(10) and 1,664,079 for fib(30)', () => {
  const six = forgetfulFib(6);
  assert.deepEqual([six.value, six.total, six.calls[4], six.calls[3], six.calls[2], six.calls[1], six.calls[5]], [8, 15, 2, 3, 5, 3, 1]);
  const ten = forgetfulFib(10);
  assert.deepEqual([ten.value, ten.total], [55, 109]);
  const thirty = forgetfulFib(30);
  assert.deepEqual([thirty.value, thirty.total], [832040, 1664079]);
  for (let n = 1; n <= 20; n++) {
    const run = forgetfulFib(n);
    assert.deepEqual([H.fib(n), H.fibCalls(n)], [run.value, run.total], `helpers, n = ${n}`);
    for (let k = 1; k <= n; k++) assert.equal(H.fibRepeats(n, k), run.calls[k] || 0);
  }
  const hook = fixed('dynamic-programming', 'hook');
  assert.match(flat(hook.text), /1, 1, 2, 3, 5, 8, 13.*fib\(30\) = 832,040/);
  assert.equal(correctOf(hook)[0].text, 'More than 1.6 million');
  assert.match(flat(hook.explain), /\*\*1,664,079 times\*\*, for a job that needs only 28 additions/);
  // a table for fib(n) needs one addition per cell from 3 to n
  let additions = 0;
  const table = [0, 1, 1];
  for (let k = 3; k <= 30; k++) { table[k] = table[k - 1] + table[k - 2]; additions++; }
  assert.deepEqual([additions, table[30]], [28, 832040]);

  const tree = fixed('dynamic-programming', 'call-tree');
  assert.deepEqual(blankValues(tree), [2, 3, 5, 15]);
  assert.match(flat(tree.template), /fib\(4\) is worked out .* times, fib\(3\) .* times and fib\(2\) .* times\. The whole tree has .* calls/);
  assert.equal((tree.figure.content.match(/<circle /g) || []).length, 15, 'the picture has one circle per call');
  for (let k = 1; k <= 6; k++) assert.equal((tree.figure.content.match(new RegExp(`>${k}</text>`, 'g')) || []).length, six.calls[k], `circles labelled ${k}`);
  assert.match(tree.figure.alt, /15 circles.*fib\(5\) once, fib\(4\) 2 times, fib\(3\) 3 times, fib\(2\) 5 times and fib\(1\) 3 times/);
  assert.match(flat(tree.explain), /15 calls for fib\(6\)/);
  assert.match(lessons['dynamic-programming'].recap[2], /fib\(30\): 1,664,079 calls without a memory, 28 additions with a table/);
  // the model answer of the reflection: "more than doubles every two steps" (mere doubling every two steps would give
  // about 2^14 times the calls of fib(2) by fib(30), tens of thousands, not 1.6 million)
  assert.match(flat(raw('dynamic-programming', 'reflect').model), /the number of calls more than doubles every two steps/);
  for (let n = 3; n <= 22; n++) assert.ok(forgetfulFib(n + 2).total > 2 * forgetfulFib(n).total, `calls for fib(${n + 2}) against fib(${n})`);
  assert.ok(2 ** 14 < 1664079 / 50);
});

test('fib-table: the check accepts the true table only and explains the first wrong cell correctly', () => {
  const step = raw('dynamic-programming', 'fib-table');
  const spec = step.widget;
  assert.deepEqual([spec.kind, spec.n], ['fib', 10]);
  const truth = [1, 1];
  while (truth.length < 10) truth.push(truth[truth.length - 1] + truth[truth.length - 2]);
  assert.deepEqual(truth, [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]);
  const solved = Grid.judge(spec, truth);
  assert.deepEqual([solved.values, solved.total, solved.correct], [truth, 8, true]);
  assert.equal(step.check(solved), true);
  assert.deepEqual(Grid.tableOf(spec).truth, truth, 'the widget fills in the same numbers when asked for the solution');
  for (let i = 2; i < 10; i++) {
    for (const slip of [truth[i] + 1, truth[i] - 1, truth[i - 1] * 2]) {
      if (slip === truth[i]) continue;
      const values = truth.slice();
      values[i] = slip;
      const verdict = step.check(Grid.judge(spec, values));
      assert.equal(verdict, `fib(${i + 1}) is fib(${i}) + fib(${i - 1}) = ${truth[i - 1]} + ${truth[i - 2]}, not ${slip}.`);
    }
    // a table that stops early
    const partial = truth.map((v, k) => (k < i ? v : null));
    const left = 10 - i;
    assert.equal(step.check(Grid.judge(spec, partial)), `${left} ${left === 1 ? 'cell is' : 'cells are'} still empty.`);
  }
  assert.match(flat(step.explain), /Eight additions, and fib\(10\) = 55 is in the table\. The forgetful recipe makes 109 calls.*28 additions against 1,664,079 calls/);
  assert.match(raw('dynamic-programming', 'name-it').text, /Richard Bellman in the 1950s/);
});

test('calls-grow (generated): the quoted call counts are real, and so is the keyed one', () => {
  const seen = new Set();
  for (const step of variants('dynamic-programming', 'calls-grow')) {
    const m = /\*\*([\d,]+) calls for fib\((\d+)\)\*\* and \*\*([\d,]+) calls for fib\((\d+)\)\*\*\. How many calls does it need for fib\((\d+)\)/.exec(flat(step.text));
    const [a, na, b, nb, n] = [int(m[1]), Number(m[2]), int(m[3]), Number(m[4]), Number(m[5])];
    assert.deepEqual([na, nb], [n - 2, n - 1]);
    assert.equal(forgetfulFib(na).total, a);
    assert.equal(forgetfulFib(nb).total, b);
    assert.equal(step.answer, forgetfulFib(n).total, `fib(${n})`);
    soundWrongs(step, 'calls-grow');
    assert.deepEqual(step.wrong.map((w) => w[0]), [a + b, 2 * b, b + 1]);
    assert.ok(flat(step.explain).startsWith(`1 + ${commas(b)} + ${commas(a)} = **${commas(step.answer)}** calls`));
    assert.ok(Math.abs(step.answer / b - 1.6) < 0.05, 'each step multiplies the cost by about 1.6');
    seen.add(n);
  }
  assert.equal(seen.size, 7);
});

/** Feedback of a routes table, checked against routes counted by walking them. */
function checkRoutesTable(step, rows, cols, closed) {
  const spec = step.widget;
  assert.deepEqual([spec.kind, spec.rows, spec.cols, spec.given], ['paths', rows, cols, 'edges']);
  const shut = (r, c) => closed.some(([cr, cc]) => cr === r && cc === c);
  const truth = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) truth.push(walkRoutes(rows, cols, closed, r, c));
  const model = Grid.tableOf(spec);
  assert.deepEqual(model.truth, truth, 'the widget agrees with routes counted one by one');
  const own = model.cells.filter((cell) => !cell.given).map((cell) => cell.index);
  assert.deepEqual(own, truth.map((_, i) => i).filter((i) => Math.floor(i / cols) > 0 && i % cols > 0 && !shut(Math.floor(i / cols), i % cols)), 'the learner fills every open inner cell');
  assert.equal(step.check(Grid.judge(spec, truth)), true);
  for (const i of own) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const up = truth[i - cols];
    const left = truth[i - 1];
    for (const slip of [truth[i] + 1, up * left + 7, Math.max(up, left) === truth[i] ? truth[i] + 2 : Math.max(up, left)]) {
      const values = truth.slice();
      values[i] = slip;
      const verdict = step.check(Grid.judge(spec, values));
      const upText = shut(r - 1, c) ? 'the cell above is closed (0 routes)' : `the cell above holds ${up}`;
      const leftText = shut(r, c - 1) ? 'the cell to the left is closed (0 routes)' : `the cell to the left holds ${left}`;
      assert.equal(verdict, `Row ${r + 1}, column ${c + 1}: ${upText} and ${leftText}. So ${up} + ${left} = ${truth[i]} routes arrive here, not ${slip}.`);
      assert.equal(up + left, truth[i]);
    }
  }
  // nothing entered, and one cell missing
  assert.match(step.check(Grid.judge(spec, [])), new RegExp(`^${own.length} cells? (is|are) still empty\\.$`));
  const oneShort = truth.slice();
  oneShort[own[own.length - 1]] = null;
  assert.equal(step.check(Grid.judge(spec, oneShort)), '1 cell is still empty.');
  return truth;
}

test('grid-paths: 20 routes cross the 4 × 4 grid, the table is right cell by cell, and 10 × 10 has 48,620', () => {
  const step = raw('dynamic-programming', 'grid-paths');
  const truth = checkRoutesTable(step, 4, 4, []);
  assert.deepEqual(truth, [1, 1, 1, 1, 1, 2, 3, 4, 1, 3, 6, 10, 1, 4, 10, 20]);
  assert.equal(walkRoutes(10, 10, [], 9, 9), 48620);
  assert.match(flat(step.explain), /\*\*20 routes\*\* lead to the far corner, found with nine small additions.*10 by 10 cells there are 48,620 routes, and the table still needs only 81 additions/);
  assert.deepEqual([3 * 3, 9 * 9], [9, 81]);
  for (const [r, c, shut] of [[4, 4, []], [3, 5, [[1, 2]]], [5, 4, [[2, 1], [3, 3]]]]) {
    const table = H.gridPaths(r, c, shut);
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) assert.equal(table[i][j], walkRoutes(r, c, shut, i, j));
  }
});

test('paths-table (generated): with one closed cell, the check accepts exactly the true numbers of routes', () => {
  const seen = new Set();
  for (const step of variants('dynamic-programming', 'paths-table')) {
    const m = /\((\d) rows, (\d) columns\).*crossed-out cell in row (\d), column (\d) is closed/.exec(flat(step.text));
    const [rows, cols, cr, cc] = m.slice(1).map(Number);
    assert.deepEqual(step.widget.closed, [[cr - 1, cc - 1]], 'the closed cell in the picture is the one in the wording');
    assert.ok(cr > 1 && cc > 1 && !(cr === rows && cc === cols), 'the closed cell is an inner cell, not the goal');
    const truth = checkRoutesTable(step, rows, cols, [[cr - 1, cc - 1]]);
    assert.match(flat(step.explain), new RegExp(`The bottom-right cell ends up with \\*\\*${truth[truth.length - 1]}\\*\\*`));
    assert.ok(truth[truth.length - 1] > 0);
    assert.deepEqual(step.solution, { solved: true });
    seen.add(`${rows}x${cols}:${cr},${cc}`);
  }
  assert.ok(seen.size >= 15, `many different grids (${seen.size})`);
});

test('coins-return: the table for coins 1, 3, 4 is 0 1 2 1 1 2 2 2 2 3 3, and the feedback on any wrong cell is true', () => {
  const step = raw('dynamic-programming', 'coins-return');
  const spec = step.widget;
  assert.deepEqual([spec.kind, spec.coins, spec.max], ['coins', [1, 3, 4], 10]);
  const truth = Array.from({ length: 11 }, (_, a) => fewestCoins([1, 3, 4], a));
  assert.deepEqual(truth, [0, 1, 2, 1, 1, 2, 2, 2, 2, 3, 3]);
  assert.deepEqual(Grid.tableOf(spec).truth, truth);
  assert.equal(step.check(Grid.judge(spec, truth)), true);
  for (let a = 1; a <= 10; a++) {
    for (const slip of [truth[a] + 1, truth[a] + 2, truth[a] - 1].filter((v) => v >= 0)) {
      const values = truth.slice();
      values[a] = slip;
      const verdict = step.check(Grid.judge(spec, values));
      const left = [1, 3, 4].filter((c) => c <= a).map((c) => a - c);
      const least = Math.min(...left.map((x) => truth[x]));
      assert.equal(least + 1, truth[a]);
      if (left.length === 1) assert.equal(verdict, `Amount ${a}: the last coin must be a 1, which leaves ${left[0]}. That cell holds ${truth[left[0]]}, so ${a} needs ${truth[left[0]]} + 1 = ${truth[a]}, not ${slip}.`);
      else {
        const parts = /^Amount (\d+): the last coin leaves ([\d, or]+)\. Those cells hold ([\d, and]+)\. The smallest is (\d+), so \1 needs \4 \+ 1 = (\d+), not (\d+)\.$/.exec(verdict);
        assert.ok(parts, verdict);
        assert.deepEqual(ints(parts[2]), left);
        assert.deepEqual(ints(parts[3]), left.map((x) => truth[x]));
        assert.deepEqual([Number(parts[4]), Number(parts[5]), Number(parts[6])], [least, truth[a], slip]);
      }
    }
  }
  assert.equal(step.check(Grid.judge(spec, truth.map((v, a) => (a <= 4 ? v : null)))), '6 cells are still empty.');
  assert.match(flat(step.explain), /The cell for 6 says \*\*2\*\*\. The table found 3 \+ 3/);
  // the worked hint for the amount 4
  assert.match(step.hints[0], /amount 4: the last coin leaves 3, 1 or 0\. Those cells hold 1, 1 and 0\. The smallest is 0, so 4 needs 0 \+ 1 = 1 coin/);
  assert.deepEqual([truth[3], truth[1], truth[0], truth[4]], [1, 1, 0, 1]);
});

test('coin-cell (generated): the pictured table is right, and the keyed cell is the true fewest number of coins', () => {
  const asked = new Set();
  for (const step of variants('dynamic-programming', 'coin-cell', 300)) {
    const text = flat(step.text);
    const m = /coins of \*\*([\d, and]+)\*\*\. The table lists the fewest coins needed for each amount from 0 to (\d+)\. \*\*What belongs in the cell for (\d+)\?/.exec(text);
    const coins = ints(m[1]);
    const amount = Number(m[3]);
    assert.equal(Number(m[2]), amount - 1);
    const fig = step.figure;
    assert.deepEqual([fig.kind, fig.coins, fig.max, fig.static, fig.hide], ['coins', coins, amount, true, [amount]]);
    const shown = ints(/amounts 0 to \d+: ([\d, ]+)\. The cell/.exec(fig.alt)[1]);
    assert.deepEqual(shown, Array.from({ length: amount }, (_, a) => fewestCoins(coins, a)), 'the table in the picture');
    assert.deepEqual(Grid.tableOf(fig).truth.slice(0, amount), shown, 'and the widget draws the same numbers');
    const best = fewestCoins(coins, amount);
    assert.equal(step.answer, best, text);
    soundWrongs(step, 'coin-cell');
    const fits = coins.filter((c) => c <= amount);
    const left = fits.map((c) => amount - c);
    const cells = left.map((a) => fewestCoins(coins, a));
    const least = Math.min(...cells);
    assert.equal(least + 1, best, 'the rule the lesson teaches gives the true answer');
    for (const [value, why] of step.wrong) {
      if (/only tries a 1 as the last coin/.test(why)) {
        assert.equal(value, fewestCoins(coins, amount - 1) + 1);
        assert.deepEqual(ints(/they leave ([\d, and]+)\./.exec(why)[1]), left.filter((a) => a !== amount - 1));
      } else if (/smallest of the cells you need/.test(why)) assert.equal(value, least);
      else if (/greedy rule would pay/.test(why)) assert.equal(value, greedyCoins(coins, amount).length);
      else assert.fail(`unknown feedback: ${why}`);
    }
    assert.deepEqual(ints(/That leaves ([\d, or]+)\.$/.exec(step.hints[0])[1]), left);
    assert.deepEqual(ints(/Those cells hold ([\d, and]+)\./.exec(step.hints[1])[1]), cells);
    const explain = flat(step.explain);
    assert.ok(explain.includes(`which leaves ${left.length > 1 ? `${left.slice(0, -1).join(', ')} or ${left[left.length - 1]}` : left[0]}. Those cells hold ${cells.length > 1 ? `${cells.slice(0, -1).join(', ')} and ${cells[cells.length - 1]}` : cells[0]}.`), explain);
    assert.ok(explain.includes(`The smallest is ${least}, so ${amount} needs ${least} + 1 = **${best} coin${best === 1 ? '' : 's'}**`), explain);
    asked.add(`${coins}/${amount}`);
  }
  assert.ok(asked.size >= 25, `many different questions (${asked.size})`);
});

/* ======================================================================
 * Lesson 4 · The Cheapest Route
 * ==================================================================== */

test('the three maps are drawable: no road crosses another, no place sits on a road, and the widget measures them correctly', () => {
  for (const [name, map] of Object.entries(H.MAPS)) {
    const ids = Object.keys(map.nodes);
    assert.ok(ids.length <= 7, `${name}: small enough for a phone`);
    for (const [a, b, w] of map.edges) assert.ok(map.nodes[a] && map.nodes[b] && Number.isInteger(w) && w > 0, `${name}: ${a}-${b}`);
    assert.ok(distinct(map.edges.map(([a, b]) => [a, b].sort().join(''))), `${name}: no road twice`);
    for (const [a, b] of map.edges) for (const [c, d] of map.edges) {
      if (new Set([a, b, c, d]).size < 4) continue;
      assert.ok(!crosses(map.nodes[a], map.nodes[b], map.nodes[c], map.nodes[d]), `${name}: ${a}-${b} crosses ${c}-${d}`);
    }
    for (const [x, y] of Object.values(map.nodes)) assert.ok(x >= 40 && x <= 520 && y >= 44 && y <= 262, `${name}: inside the picture`);
    for (const from of ids) {
      const mine = distancesByEnumeration(map.nodes, map.edges, from);
      assert.deepEqual(RoadMap.shortest(map.nodes, map.edges, from).dist, mine, `${name} from ${from}: widget`);
      assert.deepEqual(H.dijkstra(map, from).dist, mine, `${name} from ${from}: helper`);
      assert.deepEqual(runDijkstra(map.nodes, map.edges, from).label, mine, `${name} from ${from}: Dijkstra's algorithm gives the true distances`);
    }
  }
});

test('six towns: the quickest route takes 11 minutes on four roads, the fewest-roads route 13, and the route check accepts exactly the 11', () => {
  const hook = raw('weighted-paths', 'hook');
  const { nodes, edges } = hook.widget;
  assert.deepEqual([hook.widget.start, hook.widget.goal, hook.widget.mode], ['A', 'F', 'path']);
  const routes = simpleRoutes(nodes, edges, 'A');
  const toF = routes.filter((r) => r.path[r.path.length - 1] === 'F');
  const least = Math.min(...toF.map((r) => r.cost));
  assert.equal(least, 11);
  assert.deepEqual(toF.filter((r) => r.cost === least).map((r) => r.path.join('')), ['ABCEF'], 'one quickest route');
  const fewest = Math.min(...toF.map((r) => r.path.length));
  assert.deepEqual(toF.filter((r) => r.path.length === fewest).map((r) => [r.path.join(''), r.cost]), [['ADF', 13]], 'one route with the fewest roads, and it is slower');
  let accepted = 0;
  for (const { path, cost } of routes) {
    const reached = path[path.length - 1] === 'F';
    const verdict = hook.check({ path, cost, roads: path.length - 1, reached });
    assert.equal(verdict === true, reached && cost === 11, path.join(''));
    if (verdict === true) accepted++;
    else if (reached) assert.match(verdict, new RegExp(`takes ${cost} minutes\\. A quicker one exists`));
    else if (path.length > 1) assert.match(verdict, new RegExp(`stops at ${path[path.length - 1]}`));
  }
  assert.equal(accepted, 1);
  assert.deepEqual(hook.solution.path, ['A', 'B', 'C', 'E', 'F']);
  assert.match(flat(hook.explain), /A → B → C → E → F: 2 \+ 4 \+ 2 \+ 3 = \*\*11 minutes\*\*, on four roads\. The route with the fewest roads, A → D → F, takes 13 minutes/);

  const bfs = fixed('weighted-paths', 'bfs-wrong');
  assert.match(flat(bfs.text), /fewest roads\*\*\. On this map that is A → D → F/);
  assert.deepEqual(bfs.figure.route, ['A', 'D', 'F']);
  assert.equal(bfs.answer, 13);
  assert.equal(roadLength(edges, 'A', 'D') + roadLength(edges, 'D', 'F'), 13);
  assert.deepEqual(bfs.wrong.map((w) => w[0]), [2, 11]);
  assert.match(flat(bfs.explain), /4 \+ 9 = \*\*13 minutes\*\*: 2 more than the quickest route/);
  assert.match(bfs.figure.alt, /Its two roads take 4 and 9 minutes/);
});

test('the two runs by hand: one valid order each (no ties), and every number in their explanations', () => {
  const first = raw('weighted-paths', 'first-run');
  const run1 = runDijkstra(first.widget.nodes, first.widget.edges, 'A');
  assert.deepEqual([first.widget.mode, first.widget.relax, first.widget.start], ['dijkstra', undefined, 'A']);
  assert.equal(run1.ties, 0, 'towns: the smallest label is always unique, so only one order of settling is valid');
  assert.deepEqual(run1.order, ['A', 'B', 'D', 'C', 'E', 'F']);
  const better1 = run1.events.filter((e) => e.better && e.old < Infinity).map((e) => `${e.to}:${e.old}>${e.via}`);
  assert.deepEqual(better1, ['E:9>8', 'F:13>11']);
  assert.match(flat(first.explain), /settled in the order A, B, D, C, E, F: closest first\. On the way, E's label improved from 9 to 8 and F's label improved from 13 to 11/);
  assert.match(flat(first.explain), /F's final label is 11/);
  assert.equal(run1.label.F, 11);

  const second = raw('weighted-paths', 'second-run');
  const run2 = runDijkstra(second.widget.nodes, second.widget.edges, 'A');
  assert.deepEqual([second.widget.mode, second.widget.relax, second.widget.start], ['dijkstra', 'tap', 'A']);
  assert.equal(run2.ties, 0, 'valley: one valid order');
  assert.deepEqual(run2.order, ['A', 'C', 'B', 'D', 'E', 'F', 'G']);
  const toB = run2.events.filter((e) => e.to === 'B');
  assert.deepEqual(toB.map((e) => [e.from, e.old, e.via, e.better]), [['A', Infinity, 4, true], ['C', 4, 3, true]]);
  assert.equal(run2.label.C, 2);
  assert.match(flat(second.explain), /Settled in the order A, C, B, D, E, F, G\. B's first label was 4, straight from A\. Then C was settled at 2, and the road from C gave 2 \+ 1 = 3/);
  assert.match(flat(second.explain), /G ends with 14/);
  assert.equal(run2.label.G, 14);
  // at least one road in each run brings no improvement, so the learner sees both outcomes
  assert.ok(run1.events.some((e) => e.to && !e.better) && run2.events.some((e) => e.to && !e.better));

  for (const step of [first, second]) {
    assert.equal(step.check({ settled: Object.keys(step.widget.nodes), dist: {}, prev: {}, phase: 'done', current: null, pending: [], done: true, mistakes: 3 }), true);
    assert.match(step.check({ settled: ['A', 'B'], dist: {}, prev: {}, phase: 'pick', current: null, pending: [], done: false, mistakes: 0 }), /2 of \d towns are settled/);
    assert.deepEqual(step.solution, { done: true });
  }
  assert.match(second.check({ settled: ['A', 'C'], dist: {}, prev: {}, phase: 'update', current: 'C', pending: ['D'], done: false, mistakes: 0 }), /C is settled, but one of its roads has not been checked yet/);
  assert.match(second.check({ settled: ['A', 'C'], dist: {}, prev: {}, phase: 'update', current: 'C', pending: ['B', 'D'], done: false, mistakes: 0 }), /some of its roads have not been checked yet/);
  const named = raw('weighted-paths', 'name-it').text;
  assert.match(named, /Edsger Dijkstra thought of it in 1956 and published it in 1959/);
});

test('update-step (generated): the new label is the smaller of the old label and label + road', () => {
  let improved = 0;
  let kept = 0;
  for (const step of variants('weighted-paths', 'update-step', 300)) {
    const m = /settled \*\*([A-H])\*\* with the label \*\*(\d+)\*\*\. A road of length \*\*(\d+)\*\* leads from \1 to ([A-H])\. At the moment \4 is unsettled and has the label \*\*(\d+)\*\*\. \*\*What is \4's label after the update/.exec(flat(step.text));
    assert.ok(m, flat(step.text));
    const [u, v] = [m[1], m[4]];
    const [d, w, old] = [Number(m[2]), Number(m[3]), Number(m[5])];
    assert.notEqual(u, v);
    assert.ok(old > d, 'an unsettled place cannot have a smaller label than the place just settled');
    assert.notEqual(old, d + w, 'no ambiguous tie');
    const want = Math.min(old, d + w);
    assert.equal(step.answer, want, flat(step.text));
    soundWrongs(step, 'update-step');
    if (d + w < old) { improved++; assert.match(step.explain, new RegExp(`${d} \\+ ${w} = ${d + w}\\. That beats ${old}, so ${v}'s label drops to \\*\\*${d + w}\\*\\*`)); }
    else { kept++; assert.match(step.explain, new RegExp(`${d} \\+ ${w} = ${d + w}\\. That is no better than ${old}, so ${v} keeps the label \\*\\*${old}\\*\\*`)); }
    for (const [value, why] of step.wrong) {
      for (const [, x, y, z] of why.matchAll(/(\d+) \+ (\d+) = (\d+)/g)) assert.equal(Number(x) + Number(y), Number(z));
      assert.ok([old, d + w, w, old + w].includes(value));
      if (value === old) assert.match(why, new RegExp(`less than ${old}`));
      if (value === d + w) assert.match(why, new RegExp(`not better than ${old}`));
    }
    assert.match(step.hints[1], new RegExp(`^${d} \\+ ${w} = ${d + w}\\. Is that smaller than ${old}\\?$`));
  }
  assert.ok(improved > 60 && kept > 60, `both outcomes are common (${improved} improved, ${kept} kept)`);
});

test('which-next (generated): the pictured labels are those of a real run, and only the unique smallest unsettled label is accepted', () => {
  const asked = new Set();
  for (const step of variants('weighted-paths', 'which-next', 300)) {
    const spec = step.widget;
    const start = /running from \*\*([A-G])\*\*/.exec(flat(step.text))[1];
    assert.deepEqual([spec.mode, spec.start], ['pick', start]);
    const ids = Object.keys(spec.nodes);
    const truth = distancesByEnumeration(spec.nodes, spec.edges, start);
    const settled = spec.settled;
    assert.ok(settled.includes(start) && settled.length >= 2);
    // the settled places are the closest ones, and they carry their true distances
    const open = ids.filter((id) => !settled.includes(id));
    assert.ok(Math.max(...settled.map((id) => truth[id])) <= Math.min(...open.map((id) => truth[id])), 'settled places are the nearest ones');
    for (const id of settled) assert.equal(spec.labels[id], truth[id], `settled label of ${id}`);
    // every other label is the best route that runs through settled places only
    const reachable = {};
    for (const id of open) {
      const via = settled.map((u) => (roadLength(spec.edges, u, id) === null ? Infinity : truth[u] + roadLength(spec.edges, u, id)));
      reachable[id] = Math.min(...via);
      assert.equal(spec.labels[id], reachable[id] === Infinity ? '∞' : reachable[id], `label of ${id}`);
    }
    const least = Math.min(...Object.values(reachable));
    const winners = open.filter((id) => reachable[id] === least);
    assert.equal(winners.length, 1, 'no tie: one place is clearly next');
    assert.ok(open.length >= 2);
    assert.equal(reachable[winners[0]], truth[winners[0]], 'and its label is already its true distance');
    for (const id of open) {
      const verdict = step.check({ picked: id });
      assert.equal(verdict === true, id === winners[0], `${start}: ${id}`);
      if (verdict !== true) {
        if (reachable[id] === Infinity) assert.match(verdict, new RegExp(`^${id} has not been reached yet`));
        else assert.match(verdict, new RegExp(`^${id}'s label is ${reachable[id]}\\. Another unsettled place has a smaller label`));
      }
    }
    assert.equal(typeof step.check({ picked: null }), 'string');
    assert.deepEqual(step.solution, { picked: winners[0] });
    assert.match(flat(step.explain), new RegExp(`The smallest label is ${least}, so \\*\\*${winners[0]}\\*\\* is settled next`));
    for (const [, id, label] of flat(step.explain).matchAll(/([A-G]) has the label (\d+)/g)) assert.equal(reachable[id], Number(label));
    for (const [, id, label] of spec.alt.matchAll(/([A-G]) (\d+)(?=[,.])/g)) assert.equal(reachable[id], Number(label));
    assert.ok(spec.alt.includes(`Settled: ${settled.join(', ')}.`));
    asked.add(`${ids.length}${spec.edges.length}${start}${settled.length}`);
  }
  assert.ok(asked.size >= 20, `many different moments (${asked.size})`);
});

test('negative road: Dijkstra settles B at 2, but the detour costs 1', () => {
  const step = fixed('weighted-paths', 'negative');
  const road = { AB: 2, AC: 5, CB: -4 };
  assert.match(step.figure.alt, /from A to B has length 2.*from A to C has length 5.*from C to B has length minus 4/);
  assert.match(step.figure.content, />2<.*>5<.*>−4</);
  // The paying road must be one-way. Driven in both directions it could be used again and again (B → C → B earns 8
  // each time), and then "the true cheapest cost from A to B" would not exist at all.
  assert.match(flat(step.text), /a one-way toll road from C to B that \*pays\* you 4/);
  assert.match(step.figure.alt, /one-way road from C to B/);
  assert.equal((step.figure.content.match(/<path /g) || []).length, 2, 'the roads, and an arrowhead on the one-way road');
  {
    // every walk, with repeats allowed, by relaxing every road again and again (no clever algorithm)
    const relaxAll = (arcs) => {
      const d = { A: 0, B: Infinity, C: Infinity };
      let changedInLastRound = false;
      for (let round = 0; round < 6; round++) {
        changedInLastRound = false;
        for (const [a, b, w] of arcs) if (d[a] + w < d[b]) { d[b] = d[a] + w; changedInLastRound = true; }
      }
      return { d, bottomless: changedInLastRound };
    };
    const oneWay = relaxAll([['A', 'B', 2], ['B', 'A', 2], ['A', 'C', 5], ['C', 'A', 5], ['C', 'B', -4]]);
    assert.deepEqual([oneWay.d.B, oneWay.bottomless], [1, false], 'with the one-way road the cheapest cost is 1, and it is a true minimum');
    const twoWay = relaxAll([['A', 'B', 2], ['B', 'A', 2], ['A', 'C', 5], ['C', 'A', 5], ['C', 'B', -4], ['B', 'C', -4]]);
    assert.equal(twoWay.bottomless, true, 'a two-way paying road would have no cheapest cost');
    // Dijkstra's algorithm exactly as the lesson states it, on the one-way map: settle the smallest label, update
    // the unsettled places that a road leads to, never touch a settled label again
    const arcs = { A: [['B', 2], ['C', 5]], B: [['A', 2]], C: [['A', 5], ['B', -4]] };
    const label = { A: 0 };
    const settled = [];
    while (settled.length < 3) {
      const open = Object.keys(label).filter((id) => !settled.includes(id));
      const u = open.reduce((best, id) => (label[id] < label[best] ? id : best));
      settled.push(u);
      for (const [v, w] of arcs[u]) if (!settled.includes(v) && (!(v in label) || label[u] + w < label[v])) label[v] = label[u] + w;
    }
    assert.deepEqual([settled, label], [['A', 'B', 'C'], { A: 0, B: 2, C: 5 }], 'the algorithm really ends with the wrong label 2 for B');
  }
  // the algorithm, to the letter: labels A 0, B 2, C 5; the smallest unsettled label is B's, and it is never changed again
  const label = { A: 0, B: road.AB, C: road.AC };
  assert.ok(label.B < label.C, 'B is settled before C');
  assert.equal(step.answer, Math.min(road.AB, road.AC + road.CB));
  assert.equal(step.answer, 1);
  assert.ok(step.answer < label.B, 'the "final" label was wrong');
  assert.match(flat(step.text), /settles B first, with the label 2, because 2 is smaller than 5/);
  assert.match(flat(step.explain), /5 \+ \(−4\) = \*\*1\*\*.*needs every length to be zero or more/);
  assert.deepEqual(step.wrong.map((w) => w[0]), [2, 9, -4]);
});

test('read-route: G is 14 from A, and the route check accepts exactly the routes of that length', () => {
  const step = raw('weighted-paths', 'read-route');
  const { nodes, edges } = step.widget;
  assert.deepEqual([step.widget.mode, step.widget.start, step.widget.goal, step.widget.labels], ['path', 'A', 'G', true]);
  const routes = simpleRoutes(nodes, edges, 'A');
  const toG = routes.filter((r) => r.path[r.path.length - 1] === 'G');
  const least = Math.min(...toG.map((r) => r.cost));
  assert.equal(least, 14);
  let accepted = [];
  for (const { path, cost } of routes) {
    const reached = path[path.length - 1] === 'G';
    const verdict = step.check({ path, cost, roads: path.length - 1, reached });
    assert.equal(verdict === true, reached && cost === least, path.join(''));
    if (verdict === true) accepted.push(path.join(''));
    else if (reached) assert.match(verdict, new RegExp(`is ${cost} long, but G's label says 14 is possible`));
  }
  assert.deepEqual(accepted, ['ACBDEG']);
  assert.deepEqual(step.solution.path.join(''), 'ACBDEG');
  const threeRoads = toG.filter((r) => r.path.length === 4).map((r) => r.cost).sort((a, b) => a - b);
  assert.equal(Math.min(...toG.map((r) => r.path.length)), 4, 'the fewest roads to G is three');
  assert.deepEqual(threeRoads, [15, 17]);
  assert.match(flat(step.explain), /A → C → B → D → E → G: 2 \+ 1 \+ 5 \+ 2 \+ 4 = \*\*14\*\*\. Five roads, and still shorter than both three-road routes, which are 15 and 17 long/);
  const d = distancesByEnumeration(nodes, edges, 'A');
  assert.deepEqual([d.E, d.D, d.G], [10, 8, 14]);
  assert.match(step.hints[0], /E has the label 10, and the road from E to G is 4 long: 10 \+ 4 = 14/);
  assert.match(step.hints[1], /D's label 8 plus the road of 2 gives 10/);
  assert.deepEqual([roadLength(edges, 'E', 'G'), roadLength(edges, 'D', 'E')], [4, 2]);
});

test('cheapest-cost (generated): the keyed length is the shortest of all routes on the pictured map', () => {
  const asked = new Set();
  for (const step of variants('weighted-paths', 'cheapest-cost', 300)) {
    const [, from, to] = /shortest route from ([A-G]) to ([A-G])\?/.exec(flat(step.text));
    const fig = step.figure;
    assert.deepEqual([fig.mode, fig.start, fig.goal, fig.labels, fig.route], ['view', from, to, undefined, undefined], 'the picture gives nothing away');
    const routes = simpleRoutes(fig.nodes, fig.edges, from).filter((r) => r.path[r.path.length - 1] === to);
    const least = Math.min(...routes.map((r) => r.cost));
    assert.equal(step.answer, least, `${from} to ${to}`);
    soundWrongs(step, 'cheapest-cost');
    const fewest = Math.min(...routes.map((r) => r.path.length));
    for (const [value, why] of step.wrong) {
      assert.match(why, /how long a route with the fewest roads is\. A different route is shorter/);
      assert.ok(routes.some((r) => r.path.length === fewest && r.cost === value), 'that really is a fewest-roads route');
      assert.ok(value > least);
    }
    const shown = /^([A-G](?: → [A-G])+): ([\d +]+) = \*\*(\d+) km\*\*/.exec(flat(step.explain));
    const path = shown[1].split(' → ');
    assert.deepEqual([path[0], path[path.length - 1]], [from, to]);
    const lengths = path.slice(1).map((id, i) => roadLength(fig.edges, path[i], id));
    assert.ok(lengths.every((w) => w !== null), 'the route in the explanation follows real roads');
    assert.deepEqual(ints(shown[2]), lengths);
    assert.deepEqual([sum(lengths), Number(shown[3])], [least, least]);
    assert.ok(path.length >= 3, 'at least two roads, so there is something to add up');
    assert.match(step.hints[1], new RegExp(`uses ${path.length - 1} roads`));
    // the alt text lists the same roads as the picture
    assert.deepEqual([...fig.alt.matchAll(/([A-G]) to ([A-G]) (\d+)/g)].map((m) => [m[1], m[2], Number(m[3])]), fig.edges.map(([a, b, w]) => [a, b, w]));
    asked.add(`${Object.keys(fig.nodes).length}${fig.edges.length}${from}${to}`);
  }
  assert.ok(asked.size >= 25, `many different trips (${asked.size})`);
});

test('every state the two hand-run maps can be in: the check passes exactly when every place is settled', () => {
  for (const id of ['first-run', 'second-run']) {
    const step = raw('weighted-paths', id);
    const { nodes, edges } = step.widget;
    const ids = Object.keys(nodes);
    const run = runDijkstra(nodes, edges, 'A');
    let states = 0;
    let passed = 0;
    for (let k = 0; k <= ids.length; k++) {
      const settled = run.order.slice(0, k);
      const current = k ? settled[k - 1] : null;
      const neighbours = current ? ids.filter((v) => roadLength(edges, current, v) !== null && !settled.includes(v)) : [];
      // with relax: 'tap' the learner may check the roads out of the newly settled place in any order
      const pendings = step.widget.relax === 'tap' ? subsetsOf(neighbours) : [[]];
      for (const pending of pendings) {
        const phase = pending.length ? 'update' : (k === ids.length ? 'done' : 'pick');
        for (const mistakes of [0, 4]) {
          const verdict = step.check({ settled, dist: {}, prev: {}, phase, current: pending.length ? current : null, pending, done: phase === 'done', mistakes });
          states++;
          assert.equal(verdict === true, k === ids.length && !pending.length, `${id}: ${settled.join('')} / ${pending.join('')}`);
          if (verdict === true) passed++;
          else assert.equal(typeof verdict, 'string');
        }
      }
    }
    assert.equal(passed, 2, `${id}: only the finished run passes (with or without refused taps on the way)`);
    assert.ok(states > 12);
  }
});

test('equal-weights: with every road of length 1, Dijkstra settles the places layer by layer, as the stretch question says', () => {
  const step = fixed('weighted-paths', 'equal-weights');
  assert.match(correctOf(step)[0].text, /^Layer by layer/);
  for (const [name, map] of Object.entries(H.MAPS)) {
    const flatRoads = map.edges.map(([a, b]) => [a, b, 1]);
    for (const start of Object.keys(map.nodes)) {
      // layers by flooding outwards one road at a time
      const layer = { [start]: 0 };
      let ring = [start];
      for (let d = 1; ring.length; d++) {
        const next = [];
        for (const u of ring) for (const v of Object.keys(map.nodes)) if (roadLength(flatRoads, u, v) !== null && !(v in layer)) { layer[v] = d; next.push(v); }
        ring = next;
      }
      const run = runDijkstra(map.nodes, flatRoads, start);
      assert.deepEqual(run.label, layer, `${name} from ${start}: a label is the number of roads from the start`);
      run.order.forEach((id, i) => { if (i) assert.ok(layer[run.order[i - 1]] <= layer[id], `${name} from ${start}: no place of a later layer is settled before an earlier one`); });
    }
  }
});

/* ======================================================================
 * Lesson 5 · Find It in One Step
 * ==================================================================== */

test('the cloakroom: five words on five hooks, then 8 words for 7 hooks and the collision of DIG with CAB', () => {
  const first = raw('hashing', 'place-keys');
  const more = raw('hashing', 'collisions');
  assert.deepEqual([first.widget.slots, first.widget.fn, first.widget.mode], [7, undefined, 'place']);
  const hook = (word) => wordSum(word) % 7;
  const firstWords = first.widget.keys;
  assert.deepEqual(firstWords.map((w) => [w, wordSum(w), hook(w)]), [['CAB', 6, 6], ['BED', 11, 4], ['ACE', 9, 2], ['FED', 15, 1], ['BAG', 10, 3]]);
  assert.ok(distinct(firstWords.map(hook)), 'no collision among the first five');
  for (const w of firstWords) assert.ok(flat(first.explain).includes(`${w}: ${[...w].map(place).join(' + ')} = ${wordSum(w)}, remainder ${hook(w)}`), w);
  assert.match(flat(first.explain), /repeat the sum, get 4, and go straight there/);
  assert.match(first.hints[0], /CAB: 3 \+ 1 \+ 2 = 6/);
  assert.match(first.hints[1], /BED: 2 \+ 5 \+ 4 = 11\. Seven goes into 11 once, and 4 is left over/);

  assert.deepEqual([more.widget.placed, more.widget.keys], [firstWords, ['BEE', 'BAD', 'DIG']]);
  const freeHooks = [0, 1, 2, 3, 4, 5, 6].filter((i) => !firstWords.map(hook).includes(i));
  assert.deepEqual([hook('BEE'), hook('BAD')].sort(), freeHooks, 'BEE and BAD take the last two free hooks');
  assert.deepEqual([wordSum('DIG'), hook('DIG'), hook('CAB')], [20, 6, 6]);
  assert.match(flat(more.text), /\*\*8 words for 7 hooks\*\*/);
  assert.equal(firstWords.length + more.widget.keys.length, 8);
  assert.match(flat(more.explain), /BEE and BAD took the last two free hooks\. Then came DIG: 4 \+ 9 \+ 7 = 20, remainder 6, and hook 6 already held CAB/);
  const table = Hash.fileAll([...firstWords, ...more.widget.keys], 7, 'sum');
  assert.deepEqual(table, [['BAD'], ['FED'], ['ACE'], ['BAG'], ['BED'], ['BEE'], ['CAB', 'DIG']]);
  assert.deepEqual(Hash.tableFacts(table), { counts: [1, 1, 1, 1, 1, 1, 2], placed: 8, longest: 2, used: 7, collisions: 1, load: 1.143 });

  // the checks: done or not, for every number of words filed
  for (const [step, total] of [[first, 5], [more, 3]]) {
    for (let filed = 0; filed <= total; filed++) {
      const verdict = step.check({ done: filed === total, waiting: total - filed, mistakes: 2 });
      assert.equal(verdict === true, filed === total);
      if (verdict !== true) assert.ok(verdict.startsWith(total - filed === 1 ? '1 word is still waiting' : `${total - filed} words are still waiting`), verdict);
    }
    assert.deepEqual(step.solution, { done: true });
  }
  // the widget's hash functions agree with an independent one
  for (const w of H.WORD_POOL) for (const m of [5, 7, 9, 11]) {
    assert.equal(Hash.HASH.sum.slot(w, m), wordSum(w) % m);
    assert.equal(Hash.HASH.first.slot(w, m), place(w[0]) % m);
    assert.equal(H.HASHES.sum(w, m), wordSum(w) % m);
  }
});

test('which-slot (generated): adding the letters of the worded word and taking the remainder gives the keyed slot', () => {
  const asked = new Set();
  for (const step of variants('hashing', 'which-slot', 300)) {
    const text = flat(step.text);
    const m = /\*\*(\d+) slots\*\*, numbered 0 to (\d+)\..*remainder on division by (\d+)\. \*\*Which slot does the word ([A-Z]+) go to/.exec(text);
    const slots = Number(m[1]);
    const word = m[4];
    assert.deepEqual([Number(m[2]), Number(m[3])], [slots - 1, slots]);
    const total = wordSum(word);
    assert.equal(step.answer, total % slots, `${word} mod ${slots}`);
    assert.ok(step.answer >= 0 && step.answer < slots);
    soundWrongs(step, 'which-slot');
    for (const [value, why] of step.wrong) {
      if (/is the sum of the letters/.test(why)) assert.equal(value, total);
      else { assert.equal(value, Math.floor(total / slots)); assert.ok(value >= 1); assert.match(why, new RegExp(`${slots} goes into ${total} ${value === 1 ? 'once' : `${value} times`}`)); }
    }
    assert.equal(step.hints[0], `${[...word].map((ch) => `${ch} = ${place(ch)}`).join(', ')}.`);
    assert.match(step.hints[1], new RegExp(`The sum is ${total}\\.`));
    const explain = flat(step.explain);
    assert.ok(explain.startsWith(`${word}: ${[...word].map(place).join(' + ')} = ${total}`), explain);
    if (total < slots) assert.match(explain, new RegExp(`less than ${slots}, so it is its own remainder: slot \\*\\*${total}\\*\\*`));
    else {
      const eq = /\$(\d+) = (\d+) \\times (\d+) \+ (\d+)\$/.exec(explain);
      assert.deepEqual([Number(eq[1]), Number(eq[2]) * Number(eq[3]) + Number(eq[4]), Number(eq[3]), Number(eq[4])], [total, total, slots, step.answer]);
    }
    asked.add(`${word}/${slots}`);
  }
  assert.ok(asked.size >= 60, `many different questions (${asked.size})`);
});

test('pigeonhole (generated): slots + 1 keys force a collision and slots keys do not (checked exhaustively for small tables)', () => {
  // every way of filing k keys into m slots, for small m
  for (let m = 1; m <= 5; m++) {
    const everyFiling = (k) => { let all = [[]]; for (let i = 0; i < k; i++) all = all.flatMap((f) => Array.from({ length: m }, (_, s) => [...f, s])); return all; };
    assert.ok(everyFiling(m).some((f) => distinct(f)), `${m} keys can avoid each other in ${m} slots`);
    assert.ok(everyFiling(m + 1).every((f) => !distinct(f)), `${m + 1} keys cannot`);
  }
  const seen = new Set();
  for (const step of variants('hashing', 'pigeonhole')) {
    const slots = int(/\*\*([\d,]+) slots\*\*/.exec(flat(step.text))[1]);
    seen.add(slots);
    assert.equal(step.answer, slots + 1);
    soundWrongs(step, 'pigeonhole');
    assert.deepEqual(step.wrong.map((w) => w[0]), [slots, 2, 2 * slots]);
    assert.ok(flat(step.explain).includes(`Key number **${commas(slots + 1)}** finds every slot taken`));
  }
  assert.ok(seen.size >= 6);
});

test('lookup-cost (generated): the keyed number is the word\'s place in its chain of the pictured table', () => {
  const answers = new Set();
  for (const step of variants('hashing', 'lookup-cost', 300)) {
    const word = /to find ([A-Z]+)\?/.exec(flat(step.text))[1];
    const fig = step.figure;
    assert.deepEqual([fig.mode, fig.slots, fig.fn, fig.find], ['view', 7, undefined, undefined], 'the picture does not mark the answer');
    assert.equal(fig.keys.length, 10);
    assert.ok(distinct(fig.keys));
    // file the words in the order given, by hand
    const table = Array.from({ length: 7 }, () => []);
    for (const key of fig.keys) table[wordSum(key) % 7].push(key);
    assert.deepEqual(Hash.fileAll(fig.keys, 7, 'sum'), table, 'the widget draws the same chains');
    assert.equal(fig.alt, `A hash table with 7 slots. ${table.map((c, i) => `Slot ${i}: ${c.length ? c.join(', ') : 'empty'}`).join('. ')}.`);
    const slot = wordSum(word) % 7;
    const chain = table[slot];
    const position = chain.indexOf(word) + 1;
    assert.ok(position >= 2, 'the word is not the first of its chain, so there is something to count');
    assert.equal(step.answer, position, `${word} in ${chain}`);
    answers.add(position);
    soundWrongs(step, 'lookup-cost');
    for (const [value, why] of step.wrong) {
      if (/never searches all/.test(why)) assert.equal(value, 10);
      else if (/search stops as soon as/.test(why)) { assert.equal(value, chain.length); assert.equal(/The word after it in the chain is never/.test(why), chain.length - position === 1); }
      else if (/Count [A-Z]+ itself as well/.test(why)) assert.equal(value, position - 1);
      else if (/is the number of the slot/.test(why)) assert.equal(value, slot);
      else assert.fail(`unknown feedback: ${why}`);
    }
    assert.match(step.hints[1], new RegExp(`It is in slot ${slot}\\.`));
    const explain = flat(step.explain);
    assert.ok(explain.includes(`${word} hashes to slot ${slot}, whose chain is ${chain.join(' → ')}.`), explain);
    assert.ok(explain.includes(`**${position} comparisons**`));
    assert.ok(explain.includes(`The other ${10 - chain.length} words in the table are never touched.`));
    assert.ok(Math.max(...table.map((c) => c.length)) <= 4, 'chains stay short enough to draw');
  }
  assert.ok(answers.has(2) && answers.has(3), `different places in the chain (${[...answers]})`);
});

test('bad-hash: "first letter only" piles six words into slot 2, the letter sum keeps every chain at 2, and the check tells them apart', () => {
  const step = raw('hashing', 'bad-hash');
  const { keys, slots, fns } = step.widget;
  assert.deepEqual([keys.length, slots, fns], [12, 7, ['first', 'sum']]);
  assert.ok(distinct(keys));
  const byFirst = Array.from({ length: 7 }, () => []);
  const bySum = Array.from({ length: 7 }, () => []);
  for (const key of keys) { byFirst[place(key[0]) % 7].push(key); bySum[wordSum(key) % 7].push(key); }
  assert.deepEqual(byFirst.map((c) => c.length), [0, 2, 6, 1, 1, 1, 1]);
  assert.deepEqual(byFirst[2], keys.filter((k) => k[0] === 'B'), 'slot 2 holds exactly the words that begin with B');
  assert.equal(byFirst[2][5], 'BIDE');
  assert.equal(Math.max(...bySum.map((c) => c.length)), 2);
  assert.ok(bySum.every((c) => c.length >= 1), 'the sum uses every slot');
  assert.ok(bySum.some((c) => c.includes('BAD') && c.includes('DAB')), 'the anagrams BAD and DAB collide');
  assert.equal([...'BAD'].sort().join(''), [...'DAB'].sort().join(''));
  for (const fn of ['first', 'sum']) {
    const table = Hash.fileAll(keys, 7, fn);
    assert.deepEqual(table, fn === 'first' ? byFirst : bySum, `widget, ${fn}`);
    const state = { fn, table, ...Hash.tableFacts(table), waiting: 0, mistakes: 0, done: true, tried: fn === 'first' ? ['first'] : ['first', 'sum'] };
    const verdict = step.check(state);
    assert.equal(verdict === true, fn === 'sum');
    if (fn === 'first') assert.match(verdict, /"First letter only" the longest chain holds 6 words/);
  }
  assert.deepEqual(step.solution, { fn: 'sum' });
  assert.match(flat(step.text), /Twelve words, seven slots/);
  assert.match(flat(step.explain), /6 of the twelve words begin with B, and "first letter only" sends them all to slot 2\. Finding BIDE there takes 6 comparisons/);
  assert.match(flat(step.explain), /no slot holds more than 2.*BAD and DAB have the same letters/);
});

test('load-factor (generated): keys divided by slots', () => {
  const seen = new Set();
  for (const step of variants('hashing', 'load-factor')) {
    const m = /\*\*([\d,]+) slots\*\* holds \*\*([\d,]+) keys\*\*/.exec(flat(step.text));
    const [slots, keys] = [int(m[1]), int(m[2])];
    assert.ok(Number.isInteger(keys) && keys > 0);
    assert.ok(Math.abs(step.answer - keys / slots) < 1e-9);
    assert.equal(step.tolerance, 0.001);
    soundWrongs(step, 'load-factor');
    assert.ok(Math.abs(step.wrong[0][0] - slots / keys) < 1e-9);
    assert.equal(step.wrong[1][0], keys - slots);
    assert.ok(flat(step.explain).startsWith(`${commas(keys)} ÷ ${commas(slots)} = **${String(keys / slots)}**`), flat(step.explain));
    seen.add(`${slots}/${keys}`);
  }
  assert.ok(seen.size >= 25);
});

test('regrow and the rest of the hashing lesson: BED moves from hook 4 to hook 11, and the facts quoted are the checked ones', () => {
  const step = fixed('hashing', 'regrow');
  assert.deepEqual([wordSum('BED'), wordSum('BED') % 7, wordSum('BED') % 14], [11, 4, 11]);
  assert.match(flat(step.options.map((o) => o.why || '').join(' ')), /look for BED on hook 11 and never see it on hook 4/);
  assert.match(flat(step.explain), /With 7 hooks its place is 4, because \$11 = 1 \\times 7 \+ 4\$\. With 14 hooks it is 11/);
  const wild = raw('hashing', 'in-the-wild').text;
  assert.match(wild, /\*\*dictionaries\*\* and \*\*sets\*\* are hash tables/);
  assert.match(wild, /about two-thirds full/);
  assert.match(wild, /cryptographic/i);
  assert.equal((wild.match(/cryptographic/gi) || []).length, 1, 'cryptographic hashing gets one note and no more');
  const worst = fixed('hashing', 'worst-case');
  assert.match(correctOf(worst)[0].text, /^No: many keys can still land in the same slot/);
  const hookStep = fixed('hashing', 'hook');
  assert.equal(correctOf(hookStep)[0].text, 'About 1 or 2');
  // "at most 20 looks" for a million sorted names
  let looks = 0;
  for (let n = 1000000; n >= 1; n = Math.floor(n / 2)) looks++;
  assert.equal(looks, 20);
});

/* ======================================================================
 * Lesson 6 · No Fast Way Known
 * ==================================================================== */

test('seven towns: 360 round trips, one best of 110 km, and nearest neighbour is forced step by step to a trip of 130 km', () => {
  const hook = raw('hard-problems', 'hook');
  const beat = raw('hard-problems', 'beat-it');
  const near = raw('hard-problems', 'nearest');
  const towns = hook.widget.towns;
  assert.deepEqual([beat.widget.towns, near.widget.towns], [towns, towns]);
  assert.deepEqual([hook.widget.start, beat.widget.start, near.widget.start, near.widget.mode], ['A', 'A', 'A', 'nearest']);
  const ids = Object.keys(towns);
  assert.equal(ids.length, 7);
  const others = ids.filter((id) => id !== 'A');
  const orders = permutations(others).map((p) => ['A', ...p]);
  assert.equal(orders.length, 720);
  const lengths = orders.map((o) => loopLength(towns, o));
  const best = Math.min(...lengths);
  assert.equal(best, 110);
  const winners = orders.filter((o, i) => lengths[i] === best).map((o) => o.join(''));
  assert.deepEqual(winners.sort(), ['ABCEDGF', 'AFGDECB'], 'one best loop, in its two directions');
  assert.equal(new Set(orders.map((o) => { const f = o.slice(1).join(''); const b = o.slice(1).reverse().join(''); return f < b ? f : b; })).size, 360);
  assert.equal(Math.min(...lengths.filter((l) => l > best)), 118, 'the runner-up is clearly longer');
  for (const [a, b] of [['A', 'B'], ['B', 'C'], ['C', 'E'], ['G', 'A']]) assert.equal(Tour.legLength(towns, a, b, 10), straight(towns, a, b));

  // nearest neighbour: at every step one town is strictly nearest
  const trip = ['A'];
  while (trip.length < 7) {
    const here = trip[trip.length - 1];
    const open = ids.filter((id) => !trip.includes(id)).sort((x, y) => straight(towns, here, x) - straight(towns, here, y));
    if (open.length > 1) assert.ok(straight(towns, here, open[1]) - straight(towns, here, open[0]) >= 2, `from ${here} the nearest town is clear`);
    trip.push(open[0]);
  }
  assert.deepEqual([trip.join(''), loopLength(towns, trip)], ['ACBEDFG', 130]);
  assert.deepEqual(near.solution.tour, trip);
  assert.equal(straight(towns, 'G', 'A'), 37);

  // every trip the free widget can hold, complete or not
  const partial = [['A']];
  for (let i = 0; i < partial.length; i++) if (partial[i].length < 7) for (const id of others) if (!partial[i].includes(id)) partial.push([...partial[i], id]);
  assert.equal(partial.filter((p) => p.length === 7).length, 720);
  let accepted = [];
  let greedyTrips = [];
  for (const tour of partial) {
    const state = { tour, visited: tour.length, ...Tour.measure(towns, tour, 10), mistakes: 0 };
    const complete = tour.length === 7;
    assert.equal(state.complete, complete);
    if (complete) assert.equal(state.length, loopLength(towns, tour));
    assert.equal(hook.check(state) === true, complete);
    assert.equal(near.check(state) === true, complete);
    const verdict = beat.check(state);
    assert.equal(verdict === true, complete && state.length === best, tour.join(''));
    if (verdict === true) accepted.push(tour.join(''));
    else if (complete) assert.match(verdict, new RegExp(`is ${state.length} km long\\. 110 km is possible`));
    else assert.ok(verdict.startsWith(7 - tour.length === 1 ? '1 town has not' : `${7 - tour.length} towns have not`), verdict);
    if (complete && state.greedy) greedyTrips.push(tour.join(''));
  }
  assert.deepEqual(accepted.sort(), ['ABCEDGF', 'AFGDECB']);
  assert.deepEqual(greedyTrips, ['ACBEDFG'], 'the nearest-neighbour widget accepts one way through and no other');
  assert.deepEqual(beat.solution.tour.join(''), 'ABCEDGF');

  // the best trip does not cross itself (the hint says so)
  const loop = [...beat.solution.tour, 'A'];
  for (let i = 0; i + 1 < loop.length; i++) for (let j = i + 2; j + 1 < loop.length; j++) {
    if (i === 0 && j === loop.length - 2) continue;
    assert.ok(!crosses(towns[loop[i]], towns[loop[i + 1]], towns[loop[j]], towns[loop[j + 1]]));
  }
  assert.match(beat.hints[0], /never crosses its own path/);
  assert.match(beat.hints[1], /Start A → B → C/);

  assert.match(flat(hook.explain), /one of \*\*360\*\* different round trips through these seven towns\. The shortest of them all is 110 km.*the other 359/);
  assert.match(flat(beat.text), /Find the shortest round trip of all: 110 km/);
  assert.match(flat(beat.explain), /A → B → C → E → D → G → F → A: 12 \+ 13 \+ 18 \+ 12 \+ 18 \+ 17 \+ 20 = \*\*110 km\*\*.*tried all 360/);
  assert.deepEqual(['AB', 'BC', 'CE', 'ED', 'DG', 'GF', 'FA'].map((leg) => straight(towns, leg[0], leg[1])), [12, 13, 18, 12, 18, 17, 20]);
  assert.match(flat(near.explain), /A → C → B → E → D → F → G → A: \*\*130 km\*\*, after six quick decisions instead of 360 round trips/);
  assert.match(flat(near.explain), /The best trip is 110 km, so this one is about 18% longer.*the drive home from G alone is 37 km/);
  assert.equal(Math.round((130 / 110 - 1) * 100), 18);
  assert.equal(H.bestTour(towns, 'A').length, best);
  assert.equal(H.nearestTour(towns, 'A').length, 130);
});

test('counting round trips: (n − 1)!/2 agrees with listing them, and the table, the times and the recap are right', () => {
  for (let n = 3; n <= 9; n++) assert.equal(BigInt(countLoops(n)), bigFactorial(n - 1) / 2n, `${n} towns`);
  for (const n of [3, 4, 5, 7, 10, 15, 20, 25, 30]) assert.equal(H.tourCount(n), bigFactorial(n - 1) / 2n);
  const fill = fixed('hard-problems', 'count-fill');
  assert.deepEqual(blankValues(fill), [24, 12]);
  assert.equal(countLoops(5), 12);
  assert.match(flat(fill.text), /a depot and \*\*4 other towns\*\*/);

  const boom = fixed('hard-problems', 'explosion');
  const rows = [...boom.text.matchAll(/\|\s*(\d+)\s*\|\s*([\d,]+)\s*\|/g)].map((m) => [Number(m[1]), BigInt(m[2].replace(/,/g, ''))]);
  assert.deepEqual(rows.map((r) => r[0]), [7, 10, 15, 20]);
  for (const [n, count] of rows) assert.equal(count, bigFactorial(n - 1) / 2n, `${n} towns`);
  assert.equal(rows[0][1], 360n);
  const perSecond = 1000000000n;
  const seconds20 = Number(rows[3][1] / perSecond);
  const year = 365.25 * 86400;
  assert.equal(correctOf(boom)[0].text, 'About 2 years');
  assert.ok(Math.abs(seconds20 / year - 2) < 0.1, `${seconds20 / year} years`);
  assert.ok(Math.abs(seconds20 / 1e6 - 61) < 0.5);
  assert.match(flat(boom.explain), /about 61 million seconds: nearly \*\*two years\*\*\. For 25 towns it would be about 10 million years/);
  const years25 = Number(bigFactorial(24) / 2n / perSecond) / year;
  assert.ok(Math.abs(years25 / 1e6 - 10) < 0.5, `${years25} years`);
  const why = Object.fromEntries(boom.options.map((o) => [o.text, o.why || '']));
  assert.match(why['About a minute'], /43,589,145,600 trips take 44 seconds\. Twenty towns have over a million times as many/);
  assert.equal(Math.round(Number(rows[2][1]) / 1e9), 44);
  assert.ok(rows[3][1] / rows[2][1] > 1000000n);
  assert.match(why['About a day'], /86,400 seconds: enough for about 86 trillion trips\. The table shows nearly 61 thousand trillion/);
  assert.equal(Math.round((86400 * 1e9) / 1e12), 86);
  assert.equal(Math.round(Number(rows[3][1]) / 1e15), 61);
  assert.match(lessons['hard-problems'].recap[0], /7 towns already allow 360 round trips, 20 towns about 61 thousand trillion/);
  // "every extra town multiplies the work by the number of towns"
  for (let n = 4; n <= 20; n++) assert.equal(bigFactorial(n) / 2n, (bigFactorial(n - 1) / 2n) * BigInt(n));
});

test('tours-count (generated): listing every round trip gives the keyed number', () => {
  const seen = new Set();
  for (const step of variants('hard-problems', 'tours-count')) {
    const n = int(/through (\d+) towns\*\* \(the depot included\)/.exec(flat(step.text))[1]);
    seen.add(n);
    assert.equal(step.answer, countLoops(n), `${n} towns`);
    soundWrongs(step, 'tours-count');
    const orders = permutations(Array.from({ length: n - 1 }, (_, i) => i)).length;
    assert.deepEqual(step.wrong.map((w) => w[0]), [orders, orders * n, (orders * n) / 2]);
    const product = Array.from({ length: n - 1 }, (_, i) => n - 1 - i);
    assert.ok(flat(step.explain).startsWith(`${product.join(' × ')} = ${commas(orders)} orders.`), flat(step.explain));
    assert.equal(product.reduce((a, b) => a * b, 1), orders);
    assert.ok(flat(step.explain).includes(`${commas(orders)} ÷ 2 = **${commas(step.answer)}** round trips`));
    assert.ok(step.hints[1].startsWith(`That is ${commas(orders)}.`));
  }
  assert.deepEqual([...seen].sort(), [4, 5, 6, 7, 8]);
});

test('verify (generated): the pictured legs add up to the keyed total, and "proved" is keyed exactly when the total is within the claim', () => {
  let proved = 0;
  let not = 0;
  let exact = 0;
  for (const step of variants('hard-problems', 'verify', 300)) {
    const text = flat(step.text);
    const [, n, limit] = /through these (\d) towns that is at most \*\*(\d+) km\*\* long/.exec(text).map(Number);
    const legs = ints(/The legs are ([\d km,and ]+) long\./.exec(step.figure.alt)[1]);
    assert.equal(legs.length, n);
    assert.match(step.figure.alt, new RegExp(`through ${n} towns`));
    // the numbers drawn on the ring are the same legs
    const drawn = [...step.figure.content.matchAll(/class="fig-label-lg"[^>]*>(\d+)<\/text>/g)].map((m) => Number(m[1]));
    assert.deepEqual(drawn, legs);
    assert.equal((step.figure.content.match(/<circle /g) || []).length, n);
    const total = sum(legs);
    const [typed, chosen] = blankValues(step);
    assert.equal(typed, total);
    assert.equal(chosen, total <= limit ? 'proved' : 'not proved by this trip', `${total} against ${limit}`);
    assert.deepEqual(step.blanks[1].options, ['proved', 'not proved by this trip']);
    const explain = flat(step.explain);
    assert.ok(explain.startsWith(`${legs.join(' + ')} = **${total} km**.`), explain);
    if (total < limit) { proved++; assert.ok(explain.includes(`That is less than ${limit} km, so this trip proves the claim.`)); }
    else if (total === limit) { exact++; assert.ok(explain.includes(`That is exactly ${limit} km, so this trip proves the claim.`)); }
    else { not++; assert.ok(explain.includes(`That is more than ${limit} km, so this trip proves nothing. (The claim might still be true: a different trip could be shorter.)`)); }
    assert.ok(explain.includes(`checking meant adding up ${n} numbers`), 'n legs are n numbers (and n − 1 additions)');
  }
  assert.ok(proved > 60 && not > 60 && exact >= 5, `all three cases turn up (${proved}, ${exact}, ${not})`);
});

test('P and NP: the wording stays within what is known', () => {
  const lesson = lessons['hard-problems'];
  const everything = flat(lesson.steps.map((s) => {
    const f = resolveStep(s, makeRng(3), s.id);
    return [f.title, f.text, f.explain, f.model, ...(f.hints || []), ...(f.options || []).filter((o) => o.correct || f.type !== 'multi').map((o) => (o.correct ? o.text : '')), ...(f.options || []).map((o) => o.why || '')].join(' ');
  }).join(' ') + lesson.recap.join(' ') + lesson.next);
  // what the lesson must say
  assert.match(everything, /Nobody knows/);
  assert.match(everything, /nobody has proved that none exists/);
  assert.match(everything, /Everything in P is also in NP/);
  assert.match(everything, /seven Millennium Prize Problems chosen by the Clay Mathematics Institute in 2000\. A correct solution is worth a million dollars/);
  assert.match(everything, /In 1971 Stephen Cook proved.*Richard Karp extended a year later \(Leonid Levin found it independently in the Soviet Union\)/);
  assert.match(everything, /a fast method for that one problem could be converted into a fast method for \*\*every\*\* problem in NP/);
  assert.match(everything, /NP stands for "nondeterministic polynomial time"/);
  // statements offered as true must not overclaim
  const careful = fixed('hard-problems', 'careful');
  assert.deepEqual(careful.options.map((o) => !!o.correct), [true, true, false, false, false]);
  for (const o of careful.options.filter((x) => !x.correct)) assert.ok(/proved that NP-complete problems cannot|cannot solve NP-complete problems at all|"not polynomial"/.test(o.text), o.text);
  const falls = fixed('hard-problems', 'one-falls');
  assert.match(correctOf(falls)[0].text, /Every problem in NP would have a fast method: P and NP would be the same/);
  const practice = fixed('hard-problems', 'practice');
  assert.match(correctOf(practice)[0].text, /heuristics/);
  // the sorting step: three tasks with known fast methods, three that are only known to be fast to check
  const sort = fixed('hard-problems', 'sort-p-np');
  assert.deepEqual(sort.buckets, ['A fast method is known', 'Fast to check, no fast method known']);
  assert.deepEqual(sort.items.map((it) => it.bucket), [0, 0, 0, 1, 1, 1]);
  for (const it of sort.items.filter((x) => x.bucket === 1)) { assert.match(it.text, /^(Is there|Can) /, 'a yes/no question, as NP requires'); assert.match(it.why, /No fast way|no fast way/); }
  // nowhere does the lesson's own voice call these problems impossible or unsolvable
  const own = flat(lesson.steps.map((s) => [s.text, s.explain].join(' ')).join(' ') + lesson.recap.join(' '));
  assert.ok(!/cannot be solved|impossible to solve|unsolvable/.test(own), 'the running text never says "cannot be solved"');
});

/* ======================================================================
 * The widgets themselves, driven tap by tap
 *
 * The tests above feed hand-made states to each step's check. These mount
 * the real widgets on a small stand-in for the DOM and play them the way a
 * learner does: a complete correct run, and at every moment of it every
 * wrong tap as well. A correct move must never be refused, a wrong one
 * must never be taken, and the step's check must pass exactly at the end.
 * ==================================================================== */

class FakeNode { constructor() { this.parentNode = null; } }
class FakeText extends FakeNode {
  constructor(text) { super(); this.data = String(text); }
  get textContent() { return this.data; }
  set textContent(v) { this.data = String(v); }
}
class FakeElement extends FakeNode {
  constructor(tag) { super(); this.tagName = String(tag).toLowerCase(); this.childNodes = []; this.attrs = {}; this.listeners = {}; this.dataset = {}; this.style = { setProperty() {} }; this.disabled = false; }
  get className() { return this.attrs.class || ''; }
  set className(v) { this.attrs.class = String(v); }
  get classList() {
    const names = () => (this.attrs.class || '').split(/\s+/).filter(Boolean);
    const put = (list) => { this.attrs.class = list.join(' '); };
    return {
      contains: (c) => names().includes(c),
      add: (...cs) => put([...new Set([...names(), ...cs])]),
      remove: (...cs) => put(names().filter((c) => !cs.includes(c))),
      toggle: (c, on) => { const want = on === undefined ? !names().includes(c) : !!on; put(want ? [...new Set([...names(), c])] : names().filter((x) => x !== c)); return want; },
    };
  }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  removeAttribute(k) { delete this.attrs[k]; }
  removeChild(node) { const i = this.childNodes.indexOf(node); if (i >= 0) this.childNodes.splice(i, 1); node.parentNode = null; return node; }
  appendChild(node) { if (node.parentNode) node.parentNode.removeChild(node); node.parentNode = this; this.childNodes.push(node); return node; }
  append(...nodes) { for (const n of nodes) this.appendChild(n instanceof FakeNode ? n : new FakeText(n)); }
  insertBefore(node, ref) { if (node.parentNode) node.parentNode.removeChild(node); const i = this.childNodes.indexOf(ref); node.parentNode = this; this.childNodes.splice(i < 0 ? this.childNodes.length : i, 0, node); return node; }
  replaceChildren(...nodes) { for (const c of this.childNodes) c.parentNode = null; this.childNodes = []; this.append(...nodes); }
  get firstChild() { return this.childNodes[0] || null; }
  get lastChild() { return this.childNodes[this.childNodes.length - 1] || null; }
  get textContent() { return this.childNodes.map((c) => c.textContent).join(''); }
  set textContent(v) { this.replaceChildren(new FakeText(v)); }
  set innerHTML(v) { this.markup = String(v); }
  get innerHTML() { return this.markup || ''; }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  fire(type) { const ev = { type, target: this, key: '', preventDefault() {}, stopPropagation() {} }; for (const fn of this.listeners[type] || []) fn(ev); }
  click() { if (!this.disabled) this.fire('click'); } // a disabled button swallows the click, as in a browser
  getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; }
  get offsetWidth() { return 0; }
  focus() {}
}
const everyNode = (el, out = []) => { out.push(el); for (const c of el.childNodes || []) if (c instanceof FakeElement) everyNode(c, out); return out; };

/**
 * Mount a widget (its module's default export) on the stand-in DOM.
 * The stand-in stays installed afterwards: the widgets create nodes whenever they re-draw.
 * Nothing else in this file looks at `document`, and every test file runs in a process of its own.
 */
function mountWidget(mod, spec) {
  globalThis.document = { createElement: (t) => new FakeElement(t), createElementNS: (_, t) => new FakeElement(t), createTextNode: (t) => new FakeText(t), head: new FakeElement('head') };
  globalThis.Node = FakeNode;
  const changes = [];
  const w = mod.default(JSON.parse(JSON.stringify(spec)), { compact: false, readOnly: false, onChange: (s) => changes.push(s), announce: () => {} });
  const parts = (cls) => everyNode(w.el).filter((e) => e.classList.contains(cls));
  return {
    state: () => w.getState(),
    setState: (s) => w.setState(s),
    changes,
    parts,
    /** Tap the i-th element of a class (cells, bars, places, slots, towns are created in reading order). */
    tap: (cls, i) => { parts(cls)[i].click(); return w.getState(); },
    button: (label) => everyNode(w.el).find((e) => e.tagName === 'button' && e.textContent.trim().startsWith(label)),
    /** Press a button by its label. Returns false when it was disabled (and so did nothing). */
    press(label) { const b = this.button(label); assert.ok(b, `a button "${label}"`); const live = !b.disabled; b.click(); return live; },
    said: () => { const e = everyNode(w.el).find((x) => x.getAttribute('aria-live') === 'polite'); return e ? e.textContent : ''; },
  };
}

test('queens-board, tap by tap: every free square is taken, every other tap refused, and the runs are 8 + 4 and 31 moves long', () => {
  const hit = (queens, row, col) => queens.some((qc, qr) => qc === col || Math.abs(qc - col) === row - qr);
  for (const [id, n, wantFirst, wantPuts, wantBacks] of [['four-queens', 4, [1, 3, 0, 2], 8, 4], ['six-queens', 6, [1, 3, 5, 0, 2, 4], 31, 25]]) {
    const step = raw('backtracking', id);
    for (const pickLast of [false, true]) {
      const w = mountWidget(Queens, step.widget);
      const tried = new Map(); // my own record: squares already tried under the queens now standing
      let st = w.state();
      let passes = 0;
      for (let guard = 0; guard < 4000 && !st.solved; guard++) {
        const key = st.queens.join(',');
        const done = tried.get(key) || new Set();
        const free = [];
        for (let c = 0; c < n; c++) if (!hit(st.queens, st.queens.length, c) && !done.has(c)) free.push(c);
        assert.deepEqual([st.free, st.stuck, st.row, st.placed], [free, !free.length, st.queens.length, st.queens.length], `${id} after ${key}`);
        assert.equal(step.check(st) === true, false, 'an unfinished board never passes');
        // every tap that is not a free square of the live row, and not the last queen, changes nothing
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
          if ((r === st.queens.length && free.includes(c)) || (r === st.queens.length - 1 && st.queens[r] === c)) continue;
          assert.deepEqual(w.tap('qb-cell', r * n + c), st, `${id} after ${key}: tapping row ${r + 1}, column ${c + 1}`);
        }
        if (!free.length) {
          assert.ok(st.queens.length, 'the search never runs dry before a solution');
          // take back: by the button, or by tapping the last queen
          if (guard % 2) assert.ok(w.press('Take back')); else w.tap('qb-cell', (st.queens.length - 1) * n + st.queens[st.queens.length - 1]);
          const after = w.state();
          assert.deepEqual([after.queens, after.backs, after.puts], [st.queens.slice(0, -1), st.backs + 1, st.puts]);
          for (const k of [...tried.keys()]) if (k === key || k.startsWith(`${key},`)) tried.delete(k); // rows below start afresh
          st = after;
          continue;
        }
        const c = pickLast ? free[free.length - 1] : free[0];
        tried.set(key, done.add(c));
        const after = w.tap('qb-cell', st.queens.length * n + c);
        assert.deepEqual([after.queens, after.puts, after.backs], [[...st.queens, c], st.puts + 1, st.backs], `${id}: a free square was refused after ${key}`);
        st = after;
      }
      assert.ok(st.solved && peaceful(st.queens) && st.queens.length === n);
      if (step.check(st) === true) passes++;
      assert.equal(passes, 1, 'the finished board passes');
      assert.equal(w.changes.length, st.puts + st.backs, 'the step hears of every accepted move and of no refused one');
      if (!pickLast) assert.deepEqual([st.queens, st.puts, st.backs], [wantFirst, wantPuts, wantBacks], `${id}: the leftmost-first run the explanation describes`);
      else assert.deepEqual(st.queens, wantFirst.map((c) => n - 1 - c), 'rightmost first finds the mirror image');
      assert.ok(st.puts <= queenLevels(n).nodes, 'no board of the tree is ever visited twice');
    }
    // the solution the step shows when the learner gives up
    const shown = mountWidget(Queens, step.widget);
    shown.setState(step.solution);
    assert.equal(step.check(shown.state()), true);
  }
});

test('take-or-skip, tap by tap: take-first needs 11 decisions, skip-first finds the same load, and nothing can be decided once over 15 kg', () => {
  const step = raw('backtracking', 'parcels');
  const { items, target } = step.widget;
  for (const [first, wantSteps] of [['T', 11], ['S', null]]) {
    const w = mountWidget(TakeSkip, step.widget);
    let st = w.state();
    for (let guard = 0; guard < 400 && !st.hit; guard++) {
      assert.notEqual(step.check(st), true);
      const total = sum(items.filter((_, i) => st.path[i] === 'T'));
      assert.deepEqual([st.total, st.over, st.end], [total, total > target, st.path.length === items.length]);
      if (st.over || st.end) {
        assert.ok(st.stuck && !w.press('Take') && !w.press('Skip'), 'no decision is possible when over the target or out of parcels');
        assert.deepEqual(w.state(), st);
      }
      if (st.stuck) { assert.ok(w.press('Back up')); const after = w.state(); assert.deepEqual([after.path, after.backs], [st.path.slice(0, -1), st.backs + 1]); st = after; continue; }
      const choice = st.open.includes(first) ? first : (first === 'T' ? 'S' : 'T');
      assert.ok(w.press(choice === 'T' ? 'Take' : 'Skip'), `${choice} after ${st.path}`);
      const after = w.state();
      assert.deepEqual([after.path, after.steps], [st.path + choice, st.steps + 1]);
      st = after;
    }
    assert.deepEqual([st.path, st.taken, st.total], ['TSSTT', [9, 4, 2], 15]);
    if (wantSteps) assert.equal(st.steps, wantSteps, 'the count in the explanation');
    assert.equal(step.check(st), true);
    assert.ok(!w.press('Take') && !w.press('Skip') && !w.press('Back up'), 'a finished load is left alone');
  }
});

test('backing out early never closes off a solution: after any taps at all, an orderly search still finds one', () => {
  // The widgets remember what has been tried, and refuse it. That is only sound for a choice whose every
  // continuation has failed. A learner may also back out of a choice straight away (the parcel widget's own
  // prompt offers it: "Now skip it, or back up"), and such a choice must stay open, or the only solution can
  // be shut out and the widget ends up announcing that everything has been tried.
  const parcels = raw('backtracking', 'parcels');
  {
    const w = mountWidget(TakeSkip, parcels.widget);
    w.press('Take'); w.press('Take');            // 9 + 7 = 16: over
    w.press('Back up');                          // "7: you have already tried to take it here. Now skip it, or back up."
    assert.deepEqual([w.state().path, w.state().open], ['T', ['S']]);
    w.press('Back up');                          // backs out of taking the 9, although skipping the 7 was never tried
    assert.deepEqual([w.state().path, w.state().open], ['', ['T', 'S']], 'taking the 9 is still possible: the load 9 + 4 + 2 lies that way');
  }
  const finishParcels = (w) => {
    for (let guard = 0; guard < 400 && !w.state().hit; guard++) {
      const st = w.state();
      if (st.stuck) assert.ok(w.press('Back up'), `stuck at "${st.path}" with nothing to back out of: ${w.said()}`);
      else assert.ok(w.press(st.open.includes('T') ? 'Take' : 'Skip'));
    }
    return w.state();
  };
  for (let k = 0; k < 300; k++) {
    const rng = makeRng(6100 + k);
    const w = mountWidget(TakeSkip, parcels.widget);
    for (let i = rng.int(1, 40); i > 0 && !w.state().hit; i--) w.press(rng.pick(['Take', 'Skip', 'Back up', 'Back up']));
    const st = finishParcels(w);
    assert.deepEqual([st.hit, st.path], [true, 'TSSTT'], `random start ${k}`);
    assert.equal(parcels.check(st), true);
  }
  for (const id of ['four-queens', 'six-queens']) {
    const step = raw('backtracking', id);
    const n = step.widget.n;
    {
      const w = mountWidget(Queens, step.widget);
      w.tap('qb-cell', 1); w.tap('qb-cell', 1);  // a queen on the second square of row 1, taken back at once
      assert.ok(w.state().free.includes(1), 'that square has not "led nowhere", so it stays free');
    }
    for (let k = 0; k < (n === 4 ? 300 : 60); k++) {
      const rng = makeRng(8800 + k);
      const w = mountWidget(Queens, step.widget);
      for (let i = rng.int(1, 60); i > 0 && !w.state().solved; i--) { if (rng.bool(0.3)) w.press('Take back'); else w.tap('qb-cell', rng.int(0, n * n - 1)); }
      for (let guard = 0; guard < 4000 && !w.state().solved; guard++) {
        const st = w.state();
        if (st.stuck) assert.ok(w.press('Take back'), `${id}, random start ${k}: "${w.said()}"`);
        else w.tap('qb-cell', st.row * n + st.free[0]);
      }
      const st = w.state();
      assert.ok(st.solved && peaceful(st.queens) && st.queens.length === n, `${id}, random start ${k}`);
      assert.equal(step.check(st), true);
    }
  }
});

test('coin-change, tap by tap: the strict tray takes only the greedy coin; the free tray takes anything that fits', () => {
  const coinButton = (w, c) => w.parts('cc-coin').find((b) => b.textContent.trim() === String(c));
  // odd-coins: at every moment exactly one coin is accepted
  const odd = raw('greedy', 'odd-coins');
  let w = mountWidget(Coins, odd.widget);
  let st = w.state();
  while (!st.exact) {
    assert.notEqual(odd.check(st), true);
    const biggest = Math.max(...odd.widget.coins.filter((c) => c <= st.left));
    for (const c of odd.widget.coins) if (c !== biggest) { coinButton(w, c).click(); assert.deepEqual(w.state(), st, `a ${c} with ${st.left} left`); }
    coinButton(w, biggest).click();
    const after = w.state();
    assert.deepEqual(after.coins, [...st.coins, biggest]);
    st = after;
  }
  assert.deepEqual([st.coins, st.greedy], [[4, 1, 1], true]);
  assert.equal(odd.check(st), true);
  // beat-greedy and make-change: free choice, overshooting impossible, Undo and Empty work
  const beat = raw('greedy', 'beat-greedy');
  w = mountWidget(Coins, beat.widget);
  for (const c of [4, 1, 1]) coinButton(w, c).click();
  assert.match(beat.check(w.state()), /greedy answer again/);
  assert.ok(w.press('Undo') && w.press('Undo'));
  assert.deepEqual(w.state().coins, [4]);
  coinButton(w, 3).click(); coinButton(w, 4).click();
  assert.deepEqual(w.state().coins, [4], 'a coin that would overshoot is not taken');
  assert.ok(w.press('Empty the tray'));
  for (const c of [3, 3]) coinButton(w, c).click();
  assert.equal(beat.check(w.state()), true);
  const make = raw('greedy', 'make-change');
  w = mountWidget(Coins, make.widget);
  for (const c of [1, 1, 1, 5, 10, 25, 25]) coinButton(w, c).click(); // smallest first: the order does not matter
  assert.deepEqual([w.state().total, w.state().count, w.state().greedy], [68, 7, false]);
  assert.equal(make.check(w.state()), true);
  w.press('Empty the tray');
  for (let i = 0; i < 20; i++) coinButton(w, 5).click();
  assert.deepEqual([w.state().count, w.state().total], [13, 65], 'fives stop fitting at 65');
  for (let i = 0; i < 5; i++) coinButton(w, 1).click();
  assert.deepEqual([w.state().count, w.state().exact], [16, true]);
  assert.match(make.check(w.state()), /with 16 coins/);
});

test('meeting-picker, tap by tap: a rule accepts only its own choice at every step, and free booking refuses only overlaps', () => {
  const three = raw('greedy', 'three-rules');
  const meetings = three.widget.meetings;
  const at = (id) => meetings.findIndex((m) => m.id === id);
  const ruleButton = (w, rule) => w.parts('btn').find((b) => b.textContent.trim().startsWith({ shortest: 'Shortest first', start: 'Earliest start', finish: 'Earliest finish' }[rule]));
  const w = mountWidget(Meet, three.widget);
  const ran = [];
  for (const rule of ['finish', 'shortest', 'start']) { // not the order of the buttons
    ruleButton(w, rule).click();
    let st = w.state();
    assert.deepEqual([st.rule, st.picked], [rule, []]);
    const want = bookBy(meetings, KEYS[rule]).booked.map((m) => m.id);
    for (const next of want) {
      for (const m of meetings) if (m.id !== next) assert.deepEqual(w.tap('mp-bar', at(m.id)).picked, st.picked, `${rule}: ${m.id} is not the rule's choice after ${st.picked.join('')}`);
      st = w.tap('mp-bar', at(next));
      assert.equal(st.picked[st.picked.length - 1], next, `${rule}: ${next} must be accepted`);
    }
    assert.ok(st.full);
    for (const m of meetings) assert.deepEqual(w.tap('mp-bar', at(m.id)).picked, want, 'a finished run changes no more');
    ran.push(rule);
    assert.deepEqual(Object.keys(w.state().results).sort(), ran.slice().sort());
    assert.equal(w.state().results[rule], want.length);
    assert.equal(three.check(w.state()) === true, ran.length === 3);
  }
  assert.deepEqual(w.state().results, { finish: 4, shortest: 3, start: 2 });
  // an abandoned run is not counted as a result
  const again = mountWidget(Meet, three.widget);
  ruleButton(again, 'finish').click();
  again.tap('mp-bar', at('D'));
  ruleButton(again, 'start').click();
  assert.deepEqual(again.state().results, {});

  const free = raw('greedy', 'meetings-free');
  const f = mountWidget(Meet, free.widget);
  // every pair: the second meeting is accepted exactly when the two do not overlap (touching is allowed)
  for (const a of meetings) for (const b of meetings) {
    if (a === b) continue;
    assert.deepEqual(f.tap('mp-bar', at(a.id)).picked, [a.id]);
    assert.deepEqual(f.tap('mp-bar', at(b.id)).picked, clash(a, b) ? [a.id] : [a.id, b.id], `${a.id} then ${b.id}`);
    assert.ok(f.press('Clear'));
  }
  for (const id of ['C', 'F', 'A', 'D']) f.tap('mp-bar', at(id));
  assert.equal(free.check(f.state()), true);
  assert.deepEqual(f.tap('mp-bar', at('F')).picked, ['C', 'A', 'D'], 'tapping a booked meeting takes it out again');
  assert.match(free.check(f.state()), /More will fit/);
});

test('dp-grid, tap by tap: cells open in order, digits are typed with the keys, and each table passes only when it is all true', () => {
  const key = (w, d) => w.parts('btn').find((b) => (d === 'back' ? b.getAttribute('aria-label') === 'Delete the last digit' : b.textContent.trim() === String(d))).click();
  const enter = (w, index, value) => {
    w.tap('dg-cell', index);
    if (/not open yet/.test(w.said())) return false;
    for (let i = 0; i < 3; i++) key(w, 'back');
    for (const d of String(value)) key(w, d);
    return true;
  };
  // Fibonacci: a cell is closed until both cells before it are filled
  const fibStep = raw('dynamic-programming', 'fib-table');
  let w = mountWidget(Grid, fibStep.widget);
  const fibs = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55];
  assert.equal(enter(w, 4, 5), false);
  assert.equal(w.state().filled, 0);
  for (let i = 2; i < 10; i++) {
    for (let later = i + 1; later < 10; later++) assert.equal(enter(w, later, 9), false, `fib(${later + 1}) is closed while fib(${i + 1}) is empty`);
    assert.notEqual(fibStep.check(w.state()), true);
    assert.ok(enter(w, i, fibs[i]));
    assert.equal(w.state().values[i], fibs[i]);
  }
  assert.equal(fibStep.check(w.state()), true);
  // deleting a cell empties the cells that were worked out from it
  w.tap('dg-cell', 4); key(w, 'back');
  assert.deepEqual(w.state().values, [1, 1, 2, 3, null, null, null, null, null, null]);
  // a wrong number is taken, and the check names it
  assert.ok(enter(w, 4, 6));
  assert.match(fibStep.check(w.state()), /^fib\(5\) is fib\(4\) \+ fib\(3\) = 3 \+ 2, not 6\.$/);

  // the two fixed tables and many generated ones, filled in two different orders
  const tables = [raw('dynamic-programming', 'grid-paths'), raw('dynamic-programming', 'coins-return'), ...variants('dynamic-programming', 'paths-table', 40)];
  for (const step of tables) {
    const spec = step.widget;
    const model = Grid.tableOf(spec);
    const own = model.cells.filter((c) => !c.given);
    let truth;
    if (spec.kind === 'coins') truth = model.cells.map((c) => fewestCoins(spec.coins, c.head));
    else truth = model.cells.map((c) => walkRoutes(spec.rows, spec.cols, spec.closed || [], c.row, c.col));
    for (const byColumn of [false, true]) {
      const order = own.slice().sort((a, b) => (byColumn ? a.col - b.col || a.row - b.row : a.index - b.index));
      w = mountWidget(Grid, spec);
      for (const cell of order) {
        assert.notEqual(step.check(w.state()), true, 'an unfinished table never passes');
        assert.ok(enter(w, cell.index, truth[cell.index]), `row ${cell.row + 1}, column ${cell.col + 1} is open when the cells it reads are filled`);
      }
      const st = w.state();
      assert.deepEqual(st.values, truth);
      assert.equal(step.check(st), true);
      // one cell off by one: sent back
      const last = order[order.length - 1];
      enter(w, last.index, truth[last.index] + 1);
      assert.equal(typeof step.check(w.state()), 'string');
    }
  }
});

test('dijkstra-map, tap by tap: only a place with the smallest label can be settled, ties either way, and the labels end as the true distances', () => {
  const idsOf = (spec) => Object.keys(spec.nodes);
  /** Play a whole run. `last` picks among tied candidates and among roads still to check; every other tap is tried too. */
  function play(spec, last) {
    const ids = idsOf(spec);
    const w = mountWidget(RoadMap, spec);
    const at = (id) => ids.indexOf(id);
    const label = { [spec.start]: 0 };
    const settled = [];
    let st = w.state();
    let refused = 0;
    for (let guard = 0; guard < 300 && !st.done; guard++) {
      if (st.phase === 'pick') {
        const open = ids.filter((id) => id in label && !settled.includes(id));
        const least = Math.min(...open.map((id) => label[id]));
        const candidates = open.filter((id) => label[id] === least);
        for (const id of ids) {
          if (candidates.includes(id)) continue;
          const after = w.tap('dm-node', at(id));
          assert.deepEqual([after.settled, after.dist, after.phase], [st.settled, st.dist, 'pick'], `${id} must not be settled after ${settled.join('')}`);
          if (!settled.includes(id)) refused++;
          assert.equal(after.mistakes, refused, 'a wrong choice is counted, a tap on a settled place is not');
        }
        const u = last ? candidates[candidates.length - 1] : candidates[0];
        st = w.tap('dm-node', at(u));
        assert.equal(st.settled[st.settled.length - 1], u, `${u} has the smallest label after ${settled.join('')} and must be accepted`);
        settled.push(u);
        const roads = ids.filter((v) => roadLength(spec.edges, u, v) !== null && !settled.includes(v));
        if (spec.relax === 'tap') assert.deepEqual(st.pending.slice().sort(), roads);
        else for (const v of roads) label[v] = Math.min(v in label ? label[v] : Infinity, label[u] + roadLength(spec.edges, u, v));
      } else {
        assert.equal(st.phase, 'update');
        const u = st.current;
        for (const id of ids) {
          if (st.pending.includes(id)) continue;
          const after = w.tap('dm-node', at(id));
          // only a tap on a place that no road joins to u counts as a mistake (settled places and roads already checked do not)
          if (!settled.includes(id) && roadLength(spec.edges, u, id) === null) refused++;
          assert.deepEqual([after.pending, after.dist, after.settled, after.mistakes], [st.pending, st.dist, st.settled, refused], `${id} is not a road out of ${u} that still needs checking`);
          st = after;
        }
        const v = last ? st.pending.slice().sort().pop() : st.pending.slice().sort()[0];
        label[v] = Math.min(v in label ? label[v] : Infinity, label[u] + roadLength(spec.edges, u, v));
        st = w.tap('dm-node', at(v));
        assert.ok(!st.pending.includes(v));
      }
      assert.deepEqual(st.dist, label, `labels after ${settled.join('')}`);
    }
    assert.ok(st.done);
    return st;
  }
  for (const id of ['first-run', 'second-run']) {
    const step = raw('weighted-paths', id);
    const truth = distancesByEnumeration(step.widget.nodes, step.widget.edges, 'A');
    for (const last of [false, true]) {
      const st = play(step.widget, last);
      assert.deepEqual(st.dist, truth);
      assert.deepEqual(st.settled, id === 'first-run' ? ['A', 'B', 'D', 'C', 'E', 'F'] : ['A', 'C', 'B', 'D', 'E', 'F', 'G']);
      assert.equal(step.check(st), true);
      // each label came through a neighbour that explains it exactly
      for (const [v, u] of Object.entries(st.prev)) assert.equal(truth[u] + roadLength(step.widget.edges, u, v), truth[v]);
    }
    // an unfinished run does not pass
    const w = mountWidget(RoadMap, step.widget);
    w.tap('dm-node', 0);
    assert.equal(typeof step.check(w.state()), 'string');
    w.setState(step.solution);
    assert.equal(step.check(w.state()), true);
  }
  // every map from every start, both ways of checking roads, ties broken both ways: always the true distances
  let tied = 0;
  for (const [name, map] of Object.entries(H.MAPS)) for (const start of Object.keys(map.nodes)) {
    const truth = distancesByEnumeration(map.nodes, map.edges, start);
    if (runDijkstra(map.nodes, map.edges, start).ties) tied++;
    for (const relax of ['auto', 'tap']) for (const last of [false, true]) {
      assert.deepEqual(play({ type: 'dijkstra-map', mode: 'dijkstra', relax, ...map, start }, last).dist, truth, `${name} from ${start} (${relax}${last ? ', last' : ''})`);
    }
  }
  assert.ok(tied >= 2, 'some of these runs do meet ties, and either choice is accepted');

  // tracing a route: only real roads, no place twice, and the cost is the sum of the roads
  const hook = raw('weighted-paths', 'hook');
  const ids = idsOf(hook.widget);
  const w = mountWidget(RoadMap, hook.widget);
  assert.deepEqual(w.tap('dm-node', ids.indexOf('F')).path, ['A'], 'no road joins A and F');
  for (const id of ['B', 'D', 'E', 'F']) w.tap('dm-node', ids.indexOf(id));
  assert.deepEqual([w.state().path.join(''), w.state().cost, w.state().reached], ['ABDEF', 13, true]);
  assert.match(hook.check(w.state()), /takes 13 minutes/);
  assert.deepEqual(w.tap('dm-node', ids.indexOf('B')).path, ['A', 'B'], 'tapping an earlier place cuts the route back to it');
  for (const id of ['C', 'E', 'F']) w.tap('dm-node', ids.indexOf(id));
  assert.equal(hook.check(w.state()), true);
  // a moment of a run: a settled place cannot be chosen, any other can, and only the right one passes
  for (const step of variants('weighted-paths', 'which-next', 30)) {
    const names = idsOf(step.widget);
    const pick = mountWidget(RoadMap, step.widget);
    for (const id of names) {
      const st = pick.tap('dm-node', names.indexOf(id));
      if (step.widget.settled.includes(id)) { assert.notEqual(st.picked, id); continue; }
      assert.equal(st.picked, id);
      assert.equal(step.check(st) === true, id === step.solution.picked);
      pick.tap('dm-node', names.indexOf(id)); // tap again: the choice is withdrawn
      assert.equal(pick.state().picked, null);
    }
  }
});

test('hash-table, tap by tap: a word goes on the hook its letter sum names and on no other', () => {
  for (const id of ['place-keys', 'collisions']) {
    const step = raw('hashing', id);
    const w = mountWidget(Hash, step.widget);
    const before = (step.widget.placed || []).length;
    let wrongTaps = 0;
    step.widget.keys.forEach((word, k) => {
      const right = wordSum(word) % 7;
      for (let i = 0; i < 7; i++) {
        if (i === right) continue;
        const st = w.tap('ht-slot', i);
        wrongTaps++;
        assert.deepEqual([st.placed, st.waiting, st.mistakes], [before + k, step.widget.keys.length - k, wrongTaps], `${word} on hook ${i}`);
        assert.ok(w.said().includes(`What is left over when ${wordSum(word)} is divided by 7?`));
        assert.notEqual(step.check(st), true);
      }
      const st = w.tap('ht-slot', right);
      assert.equal(st.placed, before + k + 1);
      assert.equal(st.table[right][st.table[right].length - 1], word);
    });
    assert.equal(step.check(w.state()), true);
    for (let i = 0; i < 7; i++) w.tap('ht-slot', i);
    assert.equal(w.state().mistakes, wrongTaps, 'nothing more happens once every word is filed');
  }
  assert.equal(mountWidget(Hash, raw('hashing', 'collisions').widget).state().collisions, 0, 'no collision before DIG arrives');
  const bad = raw('hashing', 'bad-hash');
  const w = mountWidget(Hash, bad.widget);
  assert.deepEqual([w.state().fn, w.state().longest], ['first', 6]);
  assert.equal(typeof bad.check(w.state()), 'string');
  w.parts('btn').find((b) => b.textContent.trim() === 'Sum of the letters').click();
  assert.deepEqual([w.state().fn, w.state().longest, w.state().tried], ['sum', 2, ['first', 'sum']]);
  assert.equal(bad.check(w.state()), true);
});

test('tour-builder, tap by tap: nearest neighbour accepts only the nearest open town; a free trip can be cut back and rebuilt', () => {
  const near = raw('hard-problems', 'nearest');
  const towns = near.widget.towns;
  const ids = Object.keys(towns);
  const w = mountWidget(Tour, near.widget);
  let st = w.state();
  let refused = 0;
  while (!st.complete) {
    const here = st.tour[st.tour.length - 1];
    const open = ids.filter((id) => !st.tour.includes(id));
    const least = Math.min(...open.map((id) => straight(towns, here, id)));
    const nearest = open.filter((id) => straight(towns, here, id) === least);
    assert.equal(nearest.length, 1);
    assert.equal(typeof near.check(st), 'string');
    for (const id of ids) {
      if (id === nearest[0]) continue;
      const after = w.tap('tb-town', ids.indexOf(id));
      if (open.includes(id)) refused++;
      assert.deepEqual([after.tour, after.mistakes], [st.tour, refused], `${id} from ${here}`);
    }
    st = w.tap('tb-town', ids.indexOf(nearest[0]));
    assert.equal(st.tour[st.tour.length - 1], nearest[0]);
  }
  assert.deepEqual([st.tour.join(''), st.length, st.greedy], ['ACBEDFG', 130, true]);
  assert.equal(near.check(st), true);

  const beat = raw('hard-problems', 'beat-it');
  const f = mountWidget(Tour, beat.widget);
  for (const id of ['C', 'B', 'E', 'D', 'F', 'G']) f.tap('tb-town', ids.indexOf(id));
  assert.deepEqual([f.state().complete, f.state().length], [true, 130]);
  assert.match(beat.check(f.state()), /130 km long\. 110 km is possible/);
  assert.deepEqual(f.tap('tb-town', ids.indexOf('A')).tour, ['A'], 'tapping the depot cuts the trip back to the start');
  for (const id of ['B', 'C', 'E', 'D', 'F']) f.tap('tb-town', ids.indexOf(id));
  assert.deepEqual(f.tap('tb-town', ids.indexOf('F')).tour.join(''), 'ABCED', 'tapping the last town takes it out');
  assert.ok(f.press('Undo'));
  assert.equal(f.state().tour.join(''), 'ABCE');
  for (const id of ['D', 'G', 'F']) f.tap('tb-town', ids.indexOf(id));
  assert.deepEqual([f.state().length, f.state().legs], [110, [12, 13, 18, 12, 18, 17, 20]]);
  assert.equal(beat.check(f.state()), true);
});

/* ======================================================================
 * Teach before you ask
 *
 * A graded step may only ask for what a screen above it has shown. The
 * validator checks the shape of a lesson. These tests pin the substance:
 * every teaching screen stands before the step it serves and says what that
 * step needs, and every worked example is true (re-derived here) and is not
 * a question that the generated step after it can ask.
 * ==================================================================== */

/** The teaching screens added in the "teach before you ask" revision, each with the first step it serves. */
const TEACHING = {
  backtracking: [['teach-undo-latest', 'what-next'], ['teach-prune', 'prune-size'], ['example-safe-squares', 'next-row']],
  greedy: [['teach-rule', 'make-change'], ['teach-hold-back', 'fewest'], ['teach-exchange', 'why-finish']],
  'dynamic-programming': [['teach-call-tree', 'call-tree'], ['teach-table', 'fib-table'], ['teach-routes', 'grid-paths'], ['teach-last-coin', 'coins-return']],
  'weighted-paths': [['teach-lengths', 'bfs-wrong'], ['teach-run', 'first-run'], ['teach-final', 'why-closest']],
  hashing: [['teach-rule', 'place-keys'], ['teach-collisions', 'pigeonhole']],
  'hard-problems': [['teach-count', 'count-fill'], ['teach-check', 'verify'], ['teach-heuristic', 'practice']],
};
const at = (lesson, id) => { raw(lesson, id); return lessons[lesson].steps.findIndex((s) => s.id === id); };
/** `teach` (an info step) comes before `ask` and its text contains every one of `terms`. */
function teaches(lesson, teach, ask, terms = []) {
  const step = raw(lesson, teach);
  assert.equal(step.type, 'info', `${lesson}/${teach} is a teaching screen`);
  assert.ok(at(lesson, teach) < at(lesson, ask), `${lesson}: "${teach}" comes before "${ask}"`);
  for (const term of terms) assert.match(step.text, term, `${lesson}/${teach} teaches ${term}`);
  return step;
}

test('teach before you ask: the shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  assert.deepEqual(Object.keys(TEACHING), Object.keys(lessons));
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((step) => fixed(id, step.id)); // resolved, as the player sees them
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    // only a screen that is followed by something to answer teaches anything that is then used
    const lastAsked = roles.lastIndexOf('graded');
    assert.ok(roles.filter((kind, i) => kind === 'teach' && i < lastAsked).length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const [teach, ask] of TEACHING[id]) {
      teaches(id, teach, ask);
      const next = roles.indexOf('graded', at(id, teach) + 1);
      assert.ok(next > 0 && next <= at(id, ask), `${id}/${teach}: nothing graded is asked between it and "${ask}" that it does not serve`);
    }
  }
});

test('teach before you ask, backtracking: a worked branch of the search, what one dead end saves, and a worked row', () => {
  const L = 'backtracking';
  assert.match(fixed(L, 'hook').explain, /is called \*\*brute force\*\*/, 'brute force is named before the steps that use the word');
  assert.match(raw(L, 'tree').text, /\*\*search tree\*\*[\s\S]*\*\*dead end\*\*[\s\S]*\*\*backtracking\*\*/);
  assert.ok(at(L, 'four-queens') < at(L, 'tree') && at(L, 'tree') < at(L, 'tree-count'));
  const safe = (queens) => [0, 1, 2, 3].filter((c) => peaceful([...queens, c])).map((c) => c + 1);

  // the worked branch: the queen of row 1 on column 4
  const undo = teaches(L, 'teach-undo-latest', 'what-next', [/takes back the \*\*latest\*\* queen/, /Only now does the queen in row 1 move/]);
  assert.deepEqual([undo.figure.n, undo.figure.mode, undo.figure.queens, undo.figure.highlight], [4, 'view', [3, 0, 2], 3]);
  assert.deepEqual(safe([3]), [1, 2], 'row 2 has two safe squares, columns 1 and 2, and the leftmost is tried first');
  assert.deepEqual(safe([3, 0]), [3], 'row 3 then has one safe square, column 3');
  assert.deepEqual(safe([3, 0, 2]), [], 'row 4 has none: the picture');
  assert.deepEqual(safe([3, 1]), [], 'with the queen of row 2 on column 2, row 3 has none');
  const branch = flat(undo.text);
  assert.match(branch, /Row 2: column 1 is safe\. Row 3: column 3\. Row 4: nothing is safe \(the picture\)/);
  assert.match(branch, /Take back the queen in row 3\. She has no other safe square, so the queen in row 2 comes back as well/);
  assert.match(branch, /The queen of row 2 moves on to column 2\. Now row 3 has no safe square/);
  assert.match(branch, /Row 2 has run out too/);
  assert.match(undo.figure.alt, /row 1, column 4, in row 2, column 1 and in row 3, column 3\. All four squares of row 4 are crossed out/);
  assert.notDeepEqual(undo.figure.queens.slice(0, 2), fixed(L, 'what-next').figure.queens, 'not the board of the question that follows');

  // what a dead end saves: two clashing queens, and 4 × 4 boards below them
  const prune = teaches(L, 'teach-prune', 'prune-size', [/\*\*pruning\*\*/, /Brute force cannot stop early/, /4 × 4 = \*\*16\*\* complete boards/]);
  assert.deepEqual([prune.figure.n, prune.figure.mode, prune.figure.queens], [4, 'view', [[0, 0], [1, 1]]]);
  assert.ok(Queens.attacks(0, 0, 1, 1) && !peaceful([0, 1]), 'the two queens of the picture attack each other');
  assert.equal(queensByBruteForce(4).boards / 16, 16, 'of the 256 boards, 16 have their first two queens on those squares');
  for (const step of variants(L, 'prune-size')) assert.ok(!/\*\*4 × 4\*\*/.test(step.text), 'the generated step never asks about the board of the worked example');
  assert.ok(at(L, 'teach-prune') < at(L, 'prune-rule'));
  assert.match(flat(fixed(L, 'prune-rule').explain), /Both tests are \*\*pruning\*\*/);

  // is this square safe?
  const row = teaches(L, 'example-safe-squares', 'next-row', [/\*\*straight up\*\*/, /\*\*up along both diagonals\*\*/]);
  assert.deepEqual([row.figure.n, row.figure.mode, row.figure.queens, row.figure.attacks, row.figure.highlight], [4, 'view', [1, 3], false, 2]);
  assert.ok(peaceful([1, 3]));
  assert.deepEqual(safe([1, 3]), [1]);
  const said = [...flat(row.text).matchAll(/Column (\d): (?:no queen above it, none on its diagonals\. \*\*Safe\.\*\*|the queen of row (\d) is (straight above|one step up a diagonal)\.)/g)];
  assert.deepEqual(said.map((m) => Number(m[1])), [1, 2, 3, 4], 'every square of the row is gone through');
  for (const [, col, queenRow, how] of said) {
    const c = Number(col) - 1;
    if (!queenRow) { assert.ok(peaceful([1, 3, c]), `column ${col} is safe`); continue; }
    const queenCol = [1, 3][Number(queenRow) - 1];
    if (how === 'straight above') assert.equal(queenCol, c);
    else assert.deepEqual([Math.abs(queenCol - c), 2 - (Number(queenRow) - 1)], [1, 1], `column ${col} is one step down a diagonal from the queen of row ${queenRow}`);
  }
  assert.match(flat(row.text), /One safe square, not two/);
  assert.match(row.figure.alt, /queens in row 1, column 2 and in row 2, column 4\. Row 3 is outlined/);
  for (const step of variants(L, 'next-row', 300)) assert.ok(step.figure.n >= 5, 'the generated boards are bigger than the worked one');

  assert.match(flat(fixed(L, 'match-prune').text), /A Sudoku is one: its empty cells are filled with digits, one by one, so that no digit repeats in a row, a column or a box/);
});

test('teach before you ask, greedy: the cashier\'s rule run once, a worked trap, and the swap behind earliest finish', () => {
  const L = 'greedy';
  const rule = teaches(L, 'teach-rule', 'make-change', [/what is the biggest coin that fits into what is left\?/]);
  assert.deepEqual([rule.figure.coins, rule.figure.target, rule.figure.paid, rule.figure.static], [[1, 5, 10, 25], 23, [10, 10, 1, 1, 1], true]);
  assert.deepEqual(greedyCoins([1, 5, 10, 25], 23), [10, 10, 1, 1, 1]);
  assert.equal(fewestCoins([1, 5, 10, 25], 23), 5);
  const told = flat(rule.text);
  assert.match(told, /25 is too big\. The biggest coin that fits is \*\*10\*\*\. Left to pay: 13\./);
  assert.match(told, /10 fits again\. Left: 3\./);
  assert.match(told, /Now 10 and 5 are both too big\. Only \*\*1\*\* fits, three times/);
  assert.match(told, /10 \+ 10 \+ 1 \+ 1 \+ 1 = 23: that is \*\*5 coins\*\*\. Count every coin, not every kind of coin/);
  assert.deepEqual([23 - 10, 13 - 10], [13, 3]);
  for (const step of variants(L, 'greedy-run')) assert.notEqual(int(/hand over for (\d+)\?/.exec(flat(step.text))[1]), 23, 'the generated step never asks for the worked amount');
  assert.ok(at(L, 'make-change') < at(L, 'name-it') && at(L, 'name-it') < at(L, 'greedy-run'));
  assert.match(raw(L, 'name-it').text, /\*\*greedy algorithm\*\*/);

  const trap = teaches(L, 'teach-hold-back', 'fewest', [/\*\*hold back on the biggest coin\*\*/, /is called a \*\*counterexample\*\*/, /\*\*A greedy rule needs a reason, not just a good feeling\.\*\*/]);
  assert.ok(at(L, 'beat-greedy') < at(L, 'teach-hold-back'), 'it follows the discovery it explains');
  assert.ok(at(L, 'teach-hold-back') < at(L, 'smallest-fail'), '"counterexample" is explained before the hunt for one');
  const m = /Coins of 1, 5 and 8\. Pay 15\. - Greedy: ([\d +]+)\. \*\*(\d) coins\.\*\* - With no 8 at all: ([\d +]+)\. \*\*(\d) coins\.\*\*/.exec(flat(trap.text));
  assert.ok(m, flat(trap.text));
  assert.deepEqual(ints(m[1]), greedyCoins([1, 5, 8], 15));
  assert.deepEqual([Number(m[2]), Number(m[4])], [greedyCoins([1, 5, 8], 15).length, fewestCoins([1, 5, 8], 15)]);
  assert.deepEqual([ints(m[3]), sum(ints(m[3])), fewestCoins([1, 5, 8], 15)], [[5, 5, 5], 15, 3]);
  assert.deepEqual([trap.figure.coins, trap.figure.target, trap.figure.paid, trap.figure.static], [[1, 5, 8], 15, [8, 5, 1, 1], true]);
  for (const step of variants(L, 'fewest', 300)) assert.ok(!/coins of \*\*1, 5 and 8\*\*/.test(flat(step.text)), 'the generated step never uses the coins of the worked example');
  assert.match(flat(trap.text), /With 1, 5, 10 and 25 the greedy rule has none\. With 1, 3 and 4 it has one at 6/);
  assert.ok(greedyCoins([1, 3, 4], 6).length > fewestCoins([1, 3, 4], 6));

  const swap = teaches(L, 'teach-exchange', 'why-finish', [/\*\*exchange argument\*\*/, /Swap E for D, the meeting that finishes earliest/, /It can be \*\*proved\*\*/]);
  assert.ok(at(L, 'three-rules') < at(L, 'teach-exchange'), 'it follows the three runs it explains');
  const meetings = swap.figure.meetings;
  const by = Object.fromEntries(meetings.map((x) => [x.id, x]));
  assert.equal(Math.min(...meetings.map((x) => x.end)), by.D.end, 'D finishes earliest');
  assert.ok(by.D.end <= by.E.end && clash(by.D, by.E), 'D ends no later than E, the meeting it replaces');
  for (const x of meetings) if (x.start >= by.E.end) assert.ok(x.start >= by.D.end, `${x.id} fits after E, so it fits after D`);
  assert.match(flat(swap.text), /starts with E \(10:00 to 13:00\)/);
  assert.deepEqual([hhmm(by.E.start), hhmm(by.E.end)], ['10:00', '13:00']);
  assert.deepEqual([swap.figure.booked, swap.figure.static], [['D'], true]);
  assert.match(flat(swap.text), /found all 4 meetings here/);
  assert.equal(roomFacts(meetings).most, 4);
});

test('teach before you ask, dynamic programming: a worked count of calls, a worked table, the last-step rule and the last-coin rule', () => {
  const L = 'dynamic-programming';
  const calls = teaches(L, 'teach-call-tree', 'call-tree', [/that is one \*\*call\*\*/, /Only fib\(2\) and fib\(1\) answer at once/]);
  const five = forgetfulFib(5);
  assert.equal((calls.figure.content.match(/<circle /g) || []).length, five.total, 'the picture has one circle per call of fib(5)');
  assert.deepEqual([forgetfulFib(2).total, forgetfulFib(3).total, forgetfulFib(4).total, five.total, five.calls[3]], [1, 3, 5, 9, 2]);
  const counted = flat(calls.text);
  assert.match(counted, /fib\(3\): itself, fib\(2\) and fib\(1\)\. \*\*3 calls\.\*\*/);
  assert.match(counted, /fib\(4\): itself, the 3 calls of fib\(3\), and fib\(2\)\. 1 \+ 3 \+ 1 = \*\*5 calls\.\*\*/);
  assert.match(counted, /fib\(5\): itself, the 5 calls of fib\(4\) and the 3 of fib\(3\)\. 1 \+ 5 \+ 3 = \*\*9 calls\.\*\*/);
  for (const step of variants(L, 'calls-grow')) assert.ok(Number(/does it need for fib\((\d+)\)/.exec(flat(step.text))[1]) > 6, 'the generated step asks about bigger numbers than the worked count');
  assert.match(flat(fixed(L, 'call-tree').explain), /one for itself, 9 inside fib\(5\) and 5 inside fib\(4\)/);
  assert.equal(1 + 9 + 5, forgetfulFib(6).total);

  const table = teaches(L, 'teach-table', 'fib-table', [/\*\*overlapping subproblems\*\*/, /write every answer into a \*\*table\*\*/]);
  assert.deepEqual([table.figure.kind, table.figure.n, table.figure.static], ['fib', 6, true]);
  assert.deepEqual(Grid.tableOf(table.figure).truth, [1, 1, 2, 3, 5, 8]);
  assert.match(flat(table.text), /1 \+ 1 = 2, then 2 \+ 1 = 3, then 3 \+ 2 = 5, then 5 \+ 3 = \*\*8\*\*/);
  assert.match(flat(table.text), /4 additions instead of 15 calls/);
  assert.equal(forgetfulFib(6).total, 15);
  assert.ok(at(L, 'teach-table') < at(L, 'no-overlap') && at(L, 'name-it') < at(L, 'classify'));
  assert.match(raw(L, 'name-it').text, /\*\*Memoisation\*\*[\s\S]*\*\*Dynamic programming\*\*/);

  const routes = teaches(L, 'teach-routes', 'grid-paths', [/\*\*last step\*\*/, /from the cell above or from the cell on the left, never both/, /\*\*routes to a cell = cell above \+ cell on its left\*\*/]);
  assert.ok(at(L, 'teach-routes') < at(L, 'why-add'));
  assert.deepEqual([routes.figure.kind, routes.figure.rows, routes.figure.cols, routes.figure.static, routes.figure.closed], ['paths', 3, 3, true, undefined]);
  const walked = (r, c) => walkRoutes(3, 3, [], r, c);
  assert.deepEqual([walked(0, 2), walked(1, 1), walked(1, 2), walked(2, 1), walked(2, 2)], [1, 2, 3, 3, 6]);
  assert.match(flat(routes.text), /Row 2: 1 \+ 1 = 2, then 1 \+ 2 = 3\. Row 3: 2 \+ 1 = 3, then 3 \+ 3 = \*\*6\*\* routes to the far corner/);
  assert.deepEqual(Grid.tableOf(routes.figure).truth, [1, 1, 1, 1, 2, 3, 1, 3, 6]);
  for (const step of variants(L, 'paths-table')) {
    assert.equal(step.widget.closed.length, 1, 'a generated grid always has a closed cell, so it is never the worked grid');
    assert.match(flat(step.text), /no route may pass through it, so it counts as 0\./);
  }

  const last = teaches(L, 'teach-last-coin', 'coins-return', [/asks about the \*\*last\*\* coin/, /\*\*1 \+ the smallest of the cells it reads\*\*/]);
  assert.ok(at(L, 'teach-last-coin') < at(L, 'coin-cell'));
  assert.deepEqual([last.figure.kind, last.figure.coins, last.figure.max, last.figure.static], ['coins', [1, 5, 8], 10, true]);
  assert.deepEqual(Grid.tableOf(last.figure).truth, Array.from({ length: 11 }, (_, a) => fewestCoins([1, 5, 8], a)));
  const cells = [...flat(last.text).matchAll(/Last coin an? (\d): (\d) is left\. That cell holds (\d)\./g)].map((x) => x.slice(1).map(Number));
  assert.deepEqual(cells.map((x) => x[0]), [1, 5, 8], 'every kind of coin is tried as the last one');
  for (const [coin, left, holds] of cells) assert.deepEqual([left, holds], [10 - coin, fewestCoins([1, 5, 8], left)], `last coin ${coin}`);
  const least = Math.min(...cells.map((x) => x[2]));
  assert.ok(flat(last.text).includes(`The smallest is ${least}. Add the last coin itself, and 10 needs ${least} + 1 = **${fewestCoins([1, 5, 8], 10)} coins**: 5 + 5. Greedy would pay 8 + 1 + 1.`), flat(last.text));
  assert.deepEqual([least + 1, greedyCoins([1, 5, 8], 10)], [2, [8, 1, 1]]);
  for (const step of variants(L, 'coin-cell', 300)) assert.notDeepEqual(step.figure.coins, [1, 5, 8], 'the generated step never uses the coins of the worked example');
});

test('teach before you ask, weighted paths: route lengths, a worked run of Dijkstra\'s algorithm, and why a settled label is final', () => {
  const L = 'weighted-paths';
  assert.equal(fixed(L, 'hook').graded, false, 'the opening puzzle is an exploration, not a graded question');
  const len = teaches(L, 'teach-lengths', 'bfs-wrong', [/\*\*length of a route\*\* is the sum of the numbers on its roads/, /\*\*shortest route\*\*/, /\*\*breadth-first search\*\* \(BFS\) found the route with the fewest edges/]);
  assert.deepEqual([len.figure.mode, len.figure.route], ['view', ['A', 'B', 'D', 'F']]);
  assert.deepEqual([roadLength(len.figure.edges, 'A', 'B'), roadLength(len.figure.edges, 'B', 'D'), roadLength(len.figure.edges, 'D', 'F')], [2, 3, 9]);
  assert.match(flat(len.text), /A → B → D → F: 2 \+ 3 \+ 9 = \*\*14 minutes\*\*, on 3 roads/);
  assert.match(len.figure.alt, /Its roads take 2, 3 and 9 minutes/);
  assert.notDeepEqual(len.figure.route, fixed(L, 'bfs-wrong').figure.route, 'not the route the next question asks about');

  // the worked run, on a map of its own
  const run = teaches(L, 'teach-run', 'first-run', [/carries a \*\*label\*\*: the best distance from the start found so far/, /\*\*settle\*\* the unsettled place with the smallest label/]);
  assert.ok(at(L, 'first-run') < at(L, 'name-it') && at(L, 'name-it') < at(L, 'update-step'));
  const map = H.SHOW_MAP;
  assert.deepEqual([run.figure.nodes, run.figure.edges, run.figure.start], [map.nodes, map.edges, 'P']);
  assert.ok(!Object.values(H.MAPS).includes(map), 'the generated steps draw from MAPS, and this map is not one of them');
  assert.deepEqual(Object.keys(map.nodes), ['P', 'Q', 'R', 'S']);
  for (const [a, b] of map.edges) for (const [c, d] of map.edges) if (new Set([a, b, c, d]).size === 4) assert.ok(!crosses(map.nodes[a], map.nodes[b], map.nodes[c], map.nodes[d]), `${a}-${b} crosses ${c}-${d}`);
  const worked = runDijkstra(map.nodes, map.edges, 'P');
  assert.deepEqual([worked.order, worked.ties, worked.label], [['P', 'Q', 'R', 'S'], 0, { P: 0, Q: 3, R: 4, S: 9 }]);
  assert.deepEqual(worked.label, distancesByEnumeration(map.nodes, map.edges, 'P'));
  assert.deepEqual(worked.events.filter((e) => e.to).map((e) => `${e.from}${e.to}: ${e.old} > ${e.via}${e.better ? ' better' : ''}`),
    ['PQ: Infinity > 3 better', 'PR: Infinity > 4 better', 'QR: 4 > 5', 'QS: Infinity > 11 better', 'RS: 11 > 9 better']);
  const lines = flat(run.text);
  assert.match(lines, /\*\*P\*\* is the start: label 0\. Settle it\. Its roads give Q the label 3 and R the label 4\./);
  assert.match(lines, /Smallest unsettled label: \*\*Q\*\*, 3\. Settle it\. To R: 3 \+ 2 = 5, no better than 4, so R keeps 4\. To S: 3 \+ 8 = 11, the first label of S\./);
  assert.match(lines, /Next \*\*R\*\*, 4\. To S: 4 \+ 5 = 9\. That beats 11, so the label of S drops to 9\./);
  assert.match(lines, /\*\*S\*\* is last, settled at 9\./);
  assert.deepEqual([run.figure.mode, run.figure.settled, run.figure.labels], ['view', ['P', 'Q'], { P: 0, Q: 3, R: 4, S: 11 }], 'the picture is the moment after Q has been settled');
  for (const step of variants(L, 'update-step')) assert.ok(!/\*\*[P-S]\*\*/.test(step.text), 'the generated step never uses the places of the worked run');

  // why the smallest label is final: a real moment of the second map
  const fin = teaches(L, 'teach-final', 'why-closest', [/declares the smallest unsettled label \*\*final\*\*/, /\*\*no road has a negative length\.\*\*/]);
  assert.ok(at(L, 'second-run') < at(L, 'teach-final') && at(L, 'teach-final') < at(L, 'negative'));
  const v = fin.figure;
  assert.deepEqual([v.nodes, v.edges], [H.MAPS.valley.nodes, H.MAPS.valley.edges]);
  const truth = distancesByEnumeration(v.nodes, v.edges, 'A');
  assert.deepEqual(v.settled, ['A', 'C', 'B']);
  assert.deepEqual(runDijkstra(v.nodes, v.edges, 'A').order.slice(0, 4), ['A', 'C', 'B', 'D'], 'those three are settled first, and D is next');
  for (const id of v.settled) assert.equal(v.labels[id], truth[id], `settled label of ${id}`);
  for (const id of Object.keys(v.nodes).filter((x) => !v.settled.includes(x))) {
    const via = Math.min(...v.settled.map((u) => (roadLength(v.edges, u, id) === null ? Infinity : truth[u] + roadLength(v.edges, u, id))));
    assert.equal(v.labels[id], via === Infinity ? '∞' : via, `label of ${id}`);
  }
  assert.deepEqual([v.labels.D, v.labels.E, v.labels.F, v.labels.G, truth.D], [8, 12, 13, '∞', 8]);
  assert.match(flat(fin.text), /A, C and B are settled, and D has the smallest unsettled label: 8\. That is the best way into D straight from a settled place\. Any other route has to pass through another unsettled place first: E \(label 12\) or F \(label 13\)/);
  assert.match(flat(raw(L, 'read-route').text), /Work backwards from G: the route comes in from the neighbour whose label plus its road gives exactly G's label/);
});

test('teach before you ask, hashing: the rule worked on one word, and collisions, chains and pigeonholes named before they are asked', () => {
  const L = 'hashing';
  const rule = teaches(L, 'teach-rule', 'place-keys', [/\*\*7 hooks\*\*, numbered 0 to 6/, /A = 1, B = 2, C = 3/, /keep the \*\*remainder\*\*: what is left over/]);
  assert.deepEqual([wordSum('HIDE'), wordSum('HIDE') % 7, Math.floor(wordSum('HIDE') / 7), 3 * 7], [26, 5, 3, 21]);
  assert.match(flat(rule.text), /8 \+ 9 \+ 4 \+ 5 = 26\. Seven goes into 26 three times, which makes 21, and \*\*5\*\* is left over\. HIDE goes on hook 5\./);
  assert.deepEqual([...'HIDE'].map(place), [8, 9, 4, 5]);
  assert.match(flat(rule.text), /A sum smaller than 7 is its own remainder: a word with the sum 4 goes on hook 4/);
  assert.deepEqual([rule.figure.mode, rule.figure.slots, rule.figure.keys, rule.figure.find], ['view', 7, ['HIDE'], 'HIDE']);
  assert.ok(![...H.WORD_POOL, ...H.FIRST_WORDS, ...H.MORE_WORDS, ...H.CROWD].includes('HIDE'), 'no later step asks about the word of the worked example');
  assert.ok(at(L, 'place-keys') < at(L, 'name-it') && at(L, 'name-it') < at(L, 'which-slot'));
  assert.match(raw(L, 'name-it').text, /\*\*hash function\*\*[\s\S]*\*\*hash table\*\*/);

  const chain = teaches(L, 'teach-collisions', 'pigeonhole', [/are a \*\*collision\*\*/, /\*\*chaining\*\*: each slot holds a short list/, /More keys than slots always means a collision: the \*\*pigeonhole principle\*\*/]);
  assert.ok(at(L, 'collisions') < at(L, 'teach-collisions') && at(L, 'teach-collisions') < at(L, 'lookup-cost'));
  assert.deepEqual([chain.figure.mode, chain.figure.slots, chain.figure.find, chain.figure.keys], ['view', 7, 'DIG', [...H.FIRST_WORDS, ...H.MORE_WORDS]]);
  const table = Array.from({ length: 7 }, () => []);
  for (const key of chain.figure.keys) table[wordSum(key) % 7].push(key);
  assert.deepEqual(table[6], ['CAB', 'DIG']);
  assert.equal(chain.figure.keys.length - table[6].length, 6);
  assert.match(flat(chain.text), /works out its slot, 6, goes there and compares along the chain: first CAB, then DIG\. That is \*\*2 comparisons\*\*, and the other 6 words are never touched/);
  assert.match(flat(chain.text), /With 3 slots, three keys may be lucky and get a slot each, but a fourth has nowhere new to go/);
  for (const step of variants(L, 'pigeonhole')) assert.ok(!/\*\*3 slots\*\*/.test(flat(step.text)), 'the generated step never asks about the 3 slots of the worked case');
  for (const key of table.flat()) assert.ok(chain.figure.alt.includes(key));

  // the worked line in the load-factor question uses numbers the generator cannot produce
  for (const step of variants(L, 'load-factor')) {
    assert.match(flat(step.text), /For example, 12 keys in 60 slots give 12 ÷ 60 = 0\.2\./);
    assert.ok(Math.abs(step.answer - 0.2) > 0.01 && !/\*\*60 slots\*\*/.test(flat(step.text)));
  }
  assert.equal(12 / 60, 0.2);
});

test('teach before you ask, hard problems: a worked count, a worked check, the other hard problems, and heuristics', () => {
  const L = 'hard-problems';
  const count = teaches(L, 'teach-count', 'count-fill', [/Count the orders in which the van can visit the other towns/, /every loop is in the list twice, once in each direction/]);
  assert.ok(at(L, 'teach-count') < at(L, 'tours-count'));
  const trio = count.figure.towns;
  assert.deepEqual([Object.keys(trio), count.figure.mode, count.figure.tour], [['A', 'B', 'C'], 'view', ['A', 'B', 'C']]);
  assert.deepEqual([permutations(['B', 'C']).length, countLoops(3)], [2, 1], 'two orders, one round trip');
  const there = loopLength(trio, ['A', 'B', 'C']);
  assert.equal(there, loopLength(trio, ['A', 'C', 'B']), 'both directions are equally long');
  assert.equal(Tour.measure(trio, ['A', 'B', 'C'], 10).length, there, 'and the widget measures the same loop');
  assert.ok(flat(count.text).includes(`2 × 1 = **2 orders**, A → B → C → A and A → C → B → A. These are the same loop driven in opposite directions, and both are ${there} km long. So there is only 2 ÷ 2 = **1 round trip**.`), flat(count.text));
  assert.match(flat(count.text), /with 3 other towns the orders are counted 3 × 2 × 1/);
  // three towns are below the range of the generated step: its own test pins that range to 4 … 8

  const check = teaches(L, 'teach-check', 'verify', [/\*\*finding\*\* a shortest round trip/, /\*\*Checking\*\* a trip that somebody proposes/, /the claim is \*\*proved\*\*/]);
  const towns = check.figure.towns;
  assert.equal(check.figure.tour.join(''), 'ABCEDGF');
  const legs = check.figure.tour.map((id, i) => straight(towns, id, check.figure.tour[(i + 1) % 7]));
  assert.ok(flat(check.text).includes(`"There is a round trip of at most 115 km."`));
  assert.ok(flat(check.text).includes(`Add up its legs: ${legs.join(' + ')} = ${sum(legs)} km. That is within 115 km`), flat(check.text));
  assert.ok(sum(legs) === 110 && sum(legs) <= 115 && 130 > 115);
  assert.match(flat(check.text), /A trip of 130 km would prove nothing: a different trip might still be short enough/);
  assert.ok(Math.max(...legs) > 15, 'the generated step draws legs of 3 to 15 km, so it can never show this trip');
  for (const leg of legs) assert.ok(check.figure.alt.includes(String(leg)));

  // the two other hard problems are presented before the sorting step asks about them
  teaches(L, 'p-np', 'sort-p-np', [/\*\*P\*\* is the class of problems that can be \*solved\* fast/, /\*\*NP\*\* is the class of problems whose proposed answers can be \*checked\* fast/, /Can a map be coloured with three colours so that neighbouring countries differ\?/, /Do these parcels fit into a given number of vans\?/, /no known fast way of \*finding\* an answer/]);
  assert.ok(at(L, 'teach-check') < at(L, 'p-np'));
  teaches(L, 'np-complete', 'one-falls', [/\*\*NP-complete\*\*/]);
  assert.ok(at(L, 'np-complete') < at(L, 'careful'));

  // the explosion question carries its own worked line and the one fact it needs
  const boom = fixed(L, 'explosion');
  assert.match(flat(boom.text), /For 15 towns it needs 43,589,145,600 ÷ 1,000,000,000 seconds: about 44 seconds\. A year has about 32 million seconds\./);
  assert.equal(Math.round((365.25 * 86400) / 1e6), 32);

  const heur = teaches(L, 'teach-heuristic', 'practice', [/\*\*heuristic\*\*: quick, usually good, and with no promise of the best answer/, /\*\*greedy\*\* algorithm/, /takes what looks best right now and never goes back/]);
  assert.ok(at(L, 'nearest') < at(L, 'teach-heuristic'), 'it follows the run it names');
  assert.equal(heur.figure.tour.join(''), 'ACBEDFG');
  const trip = heur.figure.tour.map((id, i) => straight(heur.figure.towns, id, heur.figure.tour[(i + 1) % 7]));
  assert.equal(trip[6], Math.max(...trip), 'the long drive home comes last');
  assert.ok(trip[0] === Math.min(...trip), 'and the shortest leg comes first');
  assert.ok(heur.figure.alt.includes(`${sum(trip)} km in all`));
});

/* ======================================================================
 * The guard
 * ==================================================================== */

test('every generated step of the course is re-solved somewhere in this file', () => {
  const generated = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) if (typeof step.gen === 'function') generated.push(`${id}/${step.id}`);
  assert.equal(generated.length, 17);
  const missing = generated.filter((name) => !TESTED.has(name));
  assert.deepEqual(missing, [], `generated steps without a test: ${missing.join(', ')}`);
  for (const name of TESTED) assert.ok(generated.includes(name), `${name} is tested but no longer exists`);
});
