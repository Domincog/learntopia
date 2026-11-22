// Independent checks of the Algorithms course. Nothing here trusts the course's
// own helpers for an answer: every generated question is re-solved from its own
// wording (many seeds) by really running the algorithm it asks about (walk the
// robot, binary-search every target, bubble the row, merge the piles, flood the
// graph), and every fixed number in the lessons is recomputed the same way.
//
//   node --test tests/algorithms-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { simulate as widgetRobot } from '../src/widgets/robot-grid.js';
import { distances as widgetDistances } from '../src/widgets/graph-walk.js';
import * as H from '../content/courses/algorithms/helpers.js';
import course from '../content/courses/algorithms/course.js';

const SEEDS = 200;
const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/algorithms/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, 'algorithms', meta.id);
  }
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const fixed = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(9001 + k * 7919), id));
const int = (text) => Number(String(text).replace(/,/g, ''));
const ints = (text) => (String(text).match(/\d[\d,]*/g) || []).map(int);
const correctOf = (step) => step.options.filter((o) => o.correct);

/* ======================================================================
 * The algorithms, written here from scratch (not imported from the course)
 * ==================================================================== */

/** Robot: heading as a vector on a screen whose y axis points down. */
const HEADING = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
const COMPASS = { N: 'up', E: 'right', S: 'down', W: 'left' };
const WORD = { Forward: 'F', 'Turn left': 'L', 'Turn right': 'R' };
const turn = ([dx, dy], c) => (c === 'R' ? [-dy, dx] : [dy, -dx]);
/** Walk a program. `turnsMove` models the slip "a turn also rolls one square". Returns every square stood on. */
function walk(start, facing, program, { turnsMove = false } = {}) {
  let [x, y] = start;
  let dir = HEADING[facing];
  const trail = [[x, y]];
  for (const c of program) {
    if (c !== 'F') dir = turn(dir, c);
    if (c === 'F' || turnsMove) { x += dir[0]; y += dir[1]; trail.push([x, y]); }
  }
  return { x, y, trail, facing: Object.keys(HEADING).find((k) => HEADING[k][0] === dir[0] && HEADING[k][1] === dir[1]) };
}
/** The shortest program (fewest commands) that stops on the goal: breadth-first over (x, y, heading). */
function shortestProgram(world) {
  const key = (s) => `${s.x},${s.y},${s.dir}`;
  let frontier = [{ x: world.start.x, y: world.start.y, dir: HEADING[COMPASS[world.start.dir]], n: 0 }];
  const seen = new Set(frontier.map(key));
  for (let n = 0; n < 40 && frontier.length; n++) {
    if (frontier.some((s) => s.x === world.goal.x && s.y === world.goal.y)) return n;
    const next = [];
    for (const s of frontier) {
      for (const c of 'FLR') {
        const dir = c === 'F' ? s.dir : turn(s.dir, c);
        const x = c === 'F' ? s.x + dir[0] : s.x;
        const y = c === 'F' ? s.y + dir[1] : s.y;
        if (x < 0 || y < 0 || x >= world.cols || y >= world.rows) continue;
        const t = { x, y, dir };
        if (!seen.has(key(t))) { seen.add(key(t)); next.push(t); }
      }
    }
    frontier = next;
  }
  return null;
}
/** The state robot-grid reports for a program that has been run (the widget's own pure simulator). */
function robotState(spec, program) {
  const sim = widgetRobot({ cols: spec.cols, rows: spec.rows, start: spec.start, goal: spec.goal, walls: [] }, program);
  return { program, length: program.length, ran: true, reached: sim.reached, crashed: sim.crashed, crashAt: sim.crashAt, passedGoal: sim.passedGoal, x: sim.final.x, y: sim.final.y, dir: sim.final.dir };
}

/** Binary search for every possible target among n sorted items: the most looks any target needs. */
function binarySearchWorst(n, upperMiddle = false) {
  let worst = 0;
  for (let target = 1; target <= n; target++) {
    let lo = 1;
    let hi = n;
    let looks = 0;
    for (;;) {
      const mid = upperMiddle ? Math.ceil((lo + hi) / 2) : Math.floor((lo + hi) / 2);
      looks++;
      if (mid === target) break;
      if (mid < target) lo = mid + 1; else hi = mid - 1;
    }
    worst = Math.max(worst, looks);
  }
  return worst;
}
/** The higher / lower / correct game: the fewest guesses that are enough against the worst luck, for ANY strategy. */
const OPTIMAL = [0, 1];
for (let n = 2; n <= 1000; n++) {
  let best = Infinity;
  for (let g = 1; g <= n; g++) best = Math.min(best, 1 + Math.max(OPTIMAL[g - 1], OPTIMAL[n - g]));
  OPTIMAL[n] = best;
}
/** Worst case for huge n without enumerating targets: after a miss, the bigger side of a middle guess survives. */
function binarySearchWorstBig(n) {
  let looks = 0;
  while (n >= 1) { looks++; n = Math.floor(n / 2); }
  return looks;
}

/** Bubble sort exactly as the lesson describes it: every pass is one pair shorter, no early exit. */
function bubbleSort(row) {
  const a = row.slice();
  let comparisons = 0;
  let swaps = 0;
  const passes = [];
  for (let pass = 0; pass < a.length - 1; pass++) {
    for (let i = 0; i < a.length - 1 - pass; i++) {
      comparisons++;
      if (a[i] > a[i + 1]) { const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; swaps++; }
    }
    passes.push(a.slice());
  }
  return { sorted: a, comparisons, swaps, passes };
}
function selectionSort(row) {
  const a = row.slice();
  let comparisons = 0;
  let swaps = 0;
  for (let i = 0; i < a.length - 1; i++) {
    let best = i;
    for (let j = i + 1; j < a.length; j++) { comparisons++; if (a[j] < a[best]) best = j; }
    if (best !== i) { const t = a[i]; a[i] = a[best]; a[best] = t; swaps++; }
  }
  return { sorted: a, comparisons, swaps };
}
const ascending = (n) => Array.from({ length: n }, (_, i) => i + 1);
const isSorted = (a) => a.every((v, i) => i === 0 || a[i - 1] <= v);

function mergePiles(a, b) {
  const out = [];
  let i = 0;
  let j = 0;
  let comparisons = 0;
  while (i < a.length && j < b.length) { comparisons++; out.push(a[i] < b[j] ? a[i++] : b[j++]); }
  while (i < a.length) out.push(a[i++]);
  while (j < b.length) out.push(b[j++]);
  return { out, comparisons };
}
/** Merge sort from single cards upwards, level by level, counting everything. */
function mergeSort(row) {
  let piles = row.map((v) => [v]);
  let comparisons = 0;
  let moves = 0;
  let levels = 0;
  while (piles.length > 1) {
    const next = [];
    for (let k = 0; k < piles.length; k += 2) {
      const merged = k + 1 < piles.length ? mergePiles(piles[k], piles[k + 1]) : { out: piles[k], comparisons: 0 };
      comparisons += merged.comparisons;
      moves += merged.out.length;
      next.push(merged.out);
    }
    piles = next;
    levels++;
  }
  return { sorted: piles[0], comparisons, moves, levels };
}
/** The most comparisons any merge of piles of a and b cards can need (dynamic programme over what is left). */
const mergeWorstMemo = new Map();
function mergeWorst(a, b) {
  const id = `${a},${b}`;
  if (!mergeWorstMemo.has(id)) {
    let prev = new Array(b + 1).fill(0);
    for (let i = 1; i <= a; i++) {
      const cur = [0];
      for (let j = 1; j <= b; j++) cur[j] = 1 + Math.max(prev[j], cur[j - 1]);
      prev = cur;
    }
    mergeWorstMemo.set(id, prev[b]);
  }
  return mergeWorstMemo.get(id);
}

/** Flood a graph outwards from `start`, one whole layer at a time (no queue, unlike the course's bfs). */
function flood(graph, start) {
  const near = {};
  for (const id of Object.keys(graph.nodes)) near[id] = new Set();
  for (const edge of graph.edges) { const [a, b] = edge.split('-'); near[a].add(b); near[b].add(a); }
  const dist = { [start]: 0 };
  const rings = [[start]];
  for (;;) {
    const ring = [];
    for (const u of rings[rings.length - 1]) for (const v of near[u]) if (!(v in dist)) { dist[v] = rings.length; ring.push(v); }
    if (!ring.length) break;
    rings.push(ring.sort());
  }
  return { dist, rings, near };
}
const isRoute = (graph, path) => { const { near } = flood(graph, path[0]); return path.every((v, i) => i === 0 || near[path[i - 1]].has(v)); };
/** Every route from `from` that never visits a node twice. */
function simpleRoutes(graph, from) {
  const { near } = flood(graph, from);
  const out = [];
  const grow = (path) => { out.push(path); for (const v of [...near[path[path.length - 1]]].sort()) if (!path.includes(v)) grow([...path, v]); };
  grow([from]);
  return out;
}
const subsets = (items) => items.reduce((all, item) => all.concat(all.map((set) => [...set, item])), [[]]);
const sameSet = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();

/* ======================================================================
 * Whole-course checks
 * ==================================================================== */

test('the course has six lessons, each with review steps, a hands-on step and a recap', () => {
  assert.deepEqual(course.chapters.map((c) => c.lessons.map((l) => l.id)), [['what-is-an-algorithm', 'binary-search'], ['sorting', 'divide-and-conquer'], ['big-o', 'graphs-bfs']]);
  // doubling the input of an n-squared method makes the work four times as big; it does not "square" it
  const bigO = course.chapters[2].lessons[0].summary;
  assert.match(bigO, /quadruple/);
  assert.doesNotMatch(bigO, /square it/);
  for (const [id, lesson] of Object.entries(lessons)) {
    const reviews = lesson.steps.filter((s) => s.review).length;
    assert.ok(reviews >= 2 && reviews <= 4, `${id}: ${reviews} review steps`);
    assert.ok(lesson.steps.some((s) => s.type === 'interact'), `${id}: has an interact step`);
    assert.ok(lesson.recap.length >= 3, `${id}: recap`);
  }
});

test('no text contains undefined, NaN or an unfilled slot (every step, generated ones with many seeds)', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        const blob = JSON.stringify(s, (key, value) => (typeof value === 'function' ? undefined : value));
        assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(blob), `${id}/${step.id} seed ${k}: ${(blob.match(/.{30}(undefined|NaN|\[object Object\]|Infinity).{30}/) || [''])[0]}`);
        if (!step.gen) break;
      }
    }
    assert.ok(!/undefined|NaN/.test(lesson.recap.join(' ') + lesson.next), `${id} recap`);
  }
});

test('every choice has exactly one correct option and no duplicate options; multi has no duplicates', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'choice' && step.type !== 'multi') continue;
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(5 + k * 97), step.id);
        if (step.type === 'choice') assert.equal(correctOf(s).length, 1, `${id}/${step.id} seed ${k}`);
        else assert.ok(correctOf(s).length >= 1 && correctOf(s).length < s.options.length, `${id}/${step.id}`);
        assert.equal(new Set(s.options.map((o) => o.text.trim())).size, s.options.length, `${id}/${step.id} seed ${k} has duplicate options`);
        assert.ok(s.options.every((o) => o.text.trim()), `${id}/${step.id} has an empty option`);
        if (!step.gen) break;
      }
    }
  }
});

test('numeric steps: no anticipated wrong answer is accepted as right, and the answer is a whole number of things', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'numeric') continue;
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(31 + k * 211), step.id);
        assert.ok(Number.isInteger(s.answer) && s.answer > 0, `${id}/${step.id}: answer ${s.answer}`);
        for (const [value] of s.wrong) assert.ok(Math.abs(value - s.answer) > (s.tolerance || 0), `${id}/${step.id} seed ${k}: wrong value ${value} would be accepted`);
        if (!step.gen) break;
      }
    }
  }
});

test('match and bucket steps are well-formed', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type === 'match') {
        assert.equal(new Set(step.pairs.map((p) => p[0])).size, step.pairs.length, `${id}/${step.id} left items`);
        assert.equal(new Set(step.pairs.map((p) => p[1])).size, step.pairs.length, `${id}/${step.id} right items`);
      }
      if (step.type === 'bucket') {
        const s = fixed(id, step.id);
        assert.equal(new Set(s.items.map((it) => it.text)).size, s.items.length, `${id}/${step.id} items`);
        for (let b = 0; b < s.buckets.length; b++) assert.ok(s.items.some((it) => it.bucket === b), `${id}/${step.id}: bucket ${b} is used`);
      }
    }
  }
});

/* ======================================================================
 * Lesson 1 · Recipes for Machines
 * ==================================================================== */

test('robot: the widget simulator agrees with an independent walk, for random programs', () => {
  const rng = makeRng(2024);
  for (let k = 0; k < 400; k++) {
    const dirKey = rng.pick(['N', 'E', 'S', 'W']);
    const program = Array.from({ length: rng.int(1, 9) }, () => rng.pick(['F', 'F', 'L', 'R']));
    const world = { cols: 60, rows: 60, start: { x: 30, y: 30, dir: dirKey }, goal: null, walls: [] };
    const mine = walk([30, 30], COMPASS[dirKey], program);
    const theirs = widgetRobot(world, program);
    assert.deepEqual([theirs.final.x, theirs.final.y, COMPASS[theirs.final.dir]], [mine.x, mine.y, mine.facing], program.join(''));
    const course_ = H.drive(program, dirKey);
    assert.deepEqual([course_.x + 30, course_.y + 30], [mine.x, mine.y]);
  }
});

test('hook: the program stops on C, and A, B, D are where the three named slips lead', () => {
  const step = fixed('what-is-an-algorithm', 'hook');
  const fig = step.figure;
  const at = (p) => Object.keys(fig.marks).find((k) => fig.marks[k][0] === p.x && fig.marks[k][1] === p.y);
  const start = [fig.start.x, fig.start.y];
  const facing = COMPASS[fig.start.dir];
  assert.equal(at(walk(start, facing, fig.program)), 'C');
  assert.equal(correctOf(step)[0].text, 'Square C');
  assert.equal(at(walk(start, facing, fig.program.map((c) => (c === 'R' ? 'L' : c)))), 'A', 'A: turned left instead');
  assert.equal(at(walk(start, facing, fig.program.slice(0, -1))), 'B', 'B: one Forward short');
  assert.equal(at(walk(start, facing, fig.program, { turnsMove: true })), 'D', 'D: the turn also moved');
  assert.match(step.explain, /Two squares up.*two squares along/s);
});

test('first-program: the stated offsets and the solution are right, and nothing shorter exists', () => {
  const step = raw('what-is-an-algorithm', 'first-program');
  const w = step.widget;
  assert.deepEqual([w.start.y - w.goal.y, w.goal.x - w.start.x], [2, 3], 'flag is 2 up and 3 right, as the hint says');
  assert.match(step.hints[0], /2 squares up and 3 squares to the right/);
  assert.equal(step.check(robotState(w, step.solution.program)), true);
  assert.equal(shortestProgram(w), step.solution.program.length);
  assert.equal(typeof step.check(robotState(w, ['F', 'F', 'R', 'F', 'F', 'F', 'F'])), 'string', 'drove past the flag');
  assert.equal(typeof step.check(robotState(w, ['L', 'F'])), 'string', 'crash');
  assert.equal(typeof step.check({ ...robotState(w, step.solution.program), ran: false }), 'string', 'not run yet');
});

test('fix-bug: the given program crashes as described, and command 4 is the only one-command repair', () => {
  const step = raw('what-is-an-algorithm', 'fix-bug');
  const w = step.widget;
  const broken = robotState(w, w.program);
  assert.ok(broken.crashed && broken.crashAt === 6, 'turns left at 4, rolls on at 5, leaves the grid at 6');
  assert.equal(typeof step.check(broken), 'string');
  const repairs = [];
  w.program.forEach((c, i) => {
    for (const other of 'FLR') {
      if (other === c) continue;
      const program = w.program.slice();
      program[i] = other;
      if (step.check(robotState(w, program)) === true) repairs.push(`${i + 1}${other}`);
    }
  });
  assert.deepEqual(repairs, ['4R']);
  assert.deepEqual(step.solution.program, w.program.map((c, i) => (i === 3 ? 'R' : c)));
  assert.match(step.explain, /Command 4 said \*left\* where it should have said \*right\*/);
});

test('fewer-steps: the wandering program has 8 commands and works; 5 is the true minimum', () => {
  const step = raw('what-is-an-algorithm', 'fewer-steps');
  const w = step.widget;
  assert.equal(w.program.length, 8);
  assert.match(step.text, /\*\*8 commands\*\*/);
  const given = robotState(w, w.program);
  assert.ok(given.reached && !given.crashed, 'the 8-command program reaches the flag');
  assert.equal(typeof step.check(given), 'string', '8 commands is not accepted');
  assert.equal(shortestProgram(w), 5, 'no program with fewer than 5 commands reaches the flag');
  assert.equal(step.solution.program.length, 5);
  assert.equal(step.check(robotState(w, step.solution.program)), true);
  assert.deepEqual([w.start.y - w.goal.y, w.goal.x - w.start.x], [2, 2], 'flag is 2 up and 2 right, as the hint says');
});

test('trace (generated): walking the worded program from the worded start lands on the keyed square', () => {
  const lettersSeen = new Set();
  for (const step of variants('what-is-an-algorithm', 'trace', 300)) {
    const fig = step.figure;
    const facing = /facing \*\*(up|right|down|left)\*\*/.exec(step.text)[1];
    const words = /\*\*((?:Forward|Turn left|Turn right)(?:, (?:Forward|Turn left|Turn right))*)\*\*/.exec(step.text)[1].split(', ');
    const program = words.map((w) => WORD[w]);
    const where = /in column (\d) of row (\d), facing (\w+)\./.exec(fig.alt);
    const start = [Number(where[1]) - 1, Number(where[2]) - 1];
    assert.equal(where[3], facing, 'alt text and question agree on the heading');
    assert.deepEqual([fig.start.x, fig.start.y, COMPASS[fig.start.dir]], [...start, facing], 'the drawn robot matches the wording');
    assert.deepEqual(fig.program, program, 'the drawn program matches the wording');

    const end = walk(start, facing, program);
    for (const [x, y] of end.trail) assert.ok(x >= 0 && y >= 0 && x < fig.cols && y < fig.rows, 'the robot stays on the grid');
    const squares = Object.entries(fig.marks);
    assert.equal(squares.length, 4);
    assert.equal(new Set(squares.map(([, p]) => p.join())).size, 4, 'four different squares');
    for (const [, [x, y]] of squares) {
      assert.ok(x >= 0 && y >= 0 && x < fig.cols && y < fig.rows, 'marks are on the grid');
      assert.notDeepEqual([x, y], start, 'no letter sits on the start square');
    }
    const hit = squares.filter(([, p]) => p[0] === end.x && p[1] === end.y).map(([k]) => k);
    assert.equal(hit.length, 1, 'exactly one lettered square is where the robot stops');
    assert.equal(correctOf(step)[0].text, `Square ${hit[0]}`);
    assert.deepEqual(step.options.map((o) => o.text), ['Square A', 'Square B', 'Square C', 'Square D']);
    lettersSeen.add(hit[0]);

    // the feedback on each wrong square must be true of that square
    for (const option of step.options) {
      if (option.correct || !option.why) continue;
      const [mx, my] = fig.marks[option.text.slice(-1)];
      if (/left and right were swapped/.test(option.why)) {
        const p = walk(start, facing, program.map((c) => (c === 'L' ? 'R' : c === 'R' ? 'L' : c)));
        assert.deepEqual([p.x, p.y], [mx, my], 'mirror slip');
      } else if (/never moves the robot/.test(option.why)) {
        const p = walk(start, facing, program, { turnsMove: true });
        assert.deepEqual([p.x, p.y], [mx, my], 'turn-moves slip');
      } else if (/still has a Forward/.test(option.why)) {
        assert.equal(program[program.length - 1], 'F');
        const p = walk(start, facing, program.slice(0, -1));
        assert.deepEqual([p.x, p.y], [mx, my], 'one-short slip');
        assert.ok(end.trail.some(([x, y]) => x === mx && y === my), 'the robot really passes that square');
      } else assert.fail(`unknown feedback: ${option.why}`);
    }

    // the worked explanation, replayed line by line
    let pos = start.slice();
    let dir = facing;
    const lines = step.explain.split('\n').filter((l) => /^\d+\. /.test(l));
    let commands = 0;
    for (const line of lines) {
      const fwd = /^\d+\. Forward(?: × (\d+))?: (\d+) squares? (up|right|down|left)\.$/.exec(line);
      const trn = /^\d+\. Turn (left|right)(?: \(the robot's (left|right), not yours\))?: same square, now facing (up|right|down|left)\.$/.exec(line);
      assert.ok(fwd || trn, `unreadable line: ${line}`);
      if (fwd) {
        const k = Number(fwd[2]);
        assert.equal(Number(fwd[1] || 1), k);
        assert.equal(fwd[3], dir, 'moves the way it is facing');
        pos = [pos[0] + k * HEADING[dir][0], pos[1] + k * HEADING[dir][1]];
        commands += k;
      } else {
        if (trn[2]) assert.equal(trn[2], trn[1]);
        const [dx, dy] = turn(HEADING[dir], trn[1] === 'right' ? 'R' : 'L');
        dir = Object.keys(HEADING).find((k) => HEADING[k][0] === dx && HEADING[k][1] === dy);
        assert.equal(trn[3], dir, 'the stated new heading is right');
        commands += 1;
      }
    }
    assert.equal(commands, program.length, 'the explanation covers every command');
    assert.deepEqual(pos, [end.x, end.y]);
    assert.match(step.explain, new RegExp(`It stops on \\*\\*${hit[0]}\\*\\*\\.$`));
  }
  assert.equal(lettersSeen.size, 4, 'the right answer is not always the same letter');
});

test('find-largest and the other order steps list their lines in a working order', () => {
  // Run the "largest" recipe as written: it must return the maximum of any list.
  const lines = raw('what-is-an-algorithm', 'find-largest').items;
  assert.deepEqual(lines, ['set largest to first number', 'for each other number:', '  if number > largest:', '    set largest to number', 'output largest']);
  const rng = makeRng(8);
  for (let k = 0; k < 50; k++) {
    const list = Array.from({ length: rng.int(1, 12) }, () => rng.int(-50, 50));
    let largest = list[0];
    for (const number of list.slice(1)) if (number > largest) largest = number;
    assert.equal(largest, Math.max(...list));
  }
  // cooking: the pasta must go into water that is already boiling for the order to be the only sensible one
  const pasta = raw('what-is-an-algorithm', 'order-matters').items;
  assert.match(pasta[2], /boiling water/);
});

/* ======================================================================
 * Lesson 2 · Halve It
 * ==================================================================== */

test('helpers: halvingChain / maxGuesses equal the worst case of a real binary search and of the best possible strategy', () => {
  for (let n = 1; n <= 1000; n++) {
    const worst = binarySearchWorst(n);
    assert.equal(worst, binarySearchWorst(n, true), `n=${n}: lower and upper middle agree`);
    assert.equal(worst, OPTIMAL[n], `n=${n}: binary search is optimal`);
    assert.equal(worst, Math.floor(Math.log2(n)) + 1, `n=${n}`);
    assert.equal(H.maxGuesses(n), worst, `n=${n}: course helper`);
    assert.equal(binarySearchWorstBig(n), worst);
  }
});

test('1 to 100: seven guesses are enough, six are not; the stated chain and the best first guess are right', () => {
  assert.equal(OPTIMAL[100], 7);
  assert.equal(fixed('binary-search', 'hook').answer, 7);
  assert.ok(OPTIMAL[100] > 6);
  const chain = [100, 50, 25, 12, 6, 3, 1];
  // the bigger side that can survive a guess in the middle of a pile
  for (let i = 0; i + 1 < chain.length; i++) {
    const n = chain[i];
    for (const g of [Math.floor((n + 1) / 2), Math.ceil((n + 1) / 2)]) assert.equal(Math.max(g - 1, n - g), chain[i + 1], `pile of ${n}`);
  }
  for (const id of ['halving', 'beat-the-cheat']) {
    const text = id === 'halving' ? raw('binary-search', id).text : raw('binary-search', id).explain;
    assert.deepEqual(ints(/\*\*(100 → [^*]+)\*\*/.exec(text)[1]), chain, id);
  }
  assert.match(lessons['binary-search'].recap[1], /100 → 50 → 25 → 12 → 6 → 3 → 1 means 7 checks/);

  // best-first: how many numbers can survive each offered first guess, at worst
  const step = fixed('binary-search', 'best-first');
  const survivors = (g) => Math.max(g - 1, 100 - g);
  const offered = step.options.map((o) => Number(o.text));
  assert.deepEqual(offered, [1, 10, 50, 90]);
  const best = offered.reduce((a, b) => (survivors(b) < survivors(a) ? b : a));
  assert.equal(Number(correctOf(step)[0].text), best);
  assert.equal(survivors(50), 50);
  assert.equal(100 - 10, 90, '"higher" after 10 leaves 90');
  assert.equal(90 - 1, 89, '"lower" after 90 leaves 89');
  assert.match(step.options[1].why, /90 numbers are still alive/);
  assert.match(step.options[3].why, /89 numbers are still alive/);
});

test('beat-the-cheat: the check accepts exactly "found within 7", with sensible wording', () => {
  const step = raw('binary-search', 'beat-the-cheat');
  assert.equal(step.widget.limit, 7);
  assert.equal(step.check({ found: true, guesses: 7, left: 1 }), true);
  assert.equal(step.check({ found: true, guesses: 5, left: 1 }), true);
  assert.match(step.check({ found: true, guesses: 8, left: 1 }), /in 8 guesses/);
  assert.match(step.check({ found: false, guesses: 7, left: 3 }), /3 numbers are still alive/);
  assert.match(step.check({ found: false, guesses: 7, left: 1 }), /1 number is still alive/);
  assert.equal(typeof step.check({ found: false, guesses: 2, left: 25 }), 'string');
  assert.equal(Math.floor((51 + 100) / 2), 75, 'hint: the middle of 51 to 100');
});

test('count-guesses (generated): the answer is the worst case of a real binary search on that many items', () => {
  const sizes = new Set();
  for (const step of variants('binary-search', 'count-guesses')) {
    const game = /\*\*1 to ([\d,]+)\*\*/.exec(step.text);
    const list = /\*\*([\d,]+) names\*\*/.exec(step.text);
    assert.ok(game || list, step.text);
    const n = int((game || list)[1]);
    sizes.add(n);
    assert.equal(step.answer, binarySearchWorst(n), `n=${n}`);
    assert.equal(step.answer, OPTIMAL[n], `n=${n}: no strategy does better, so "always enough" has one answer`);
    assert.equal(step.tolerance, null);
    assert.equal(step.unit, game ? 'guesses' : 'checks');
    // the worked chain: halve, rounding down, until 1; one look per pile
    const chain = ints(/\*\*([\d,]+(?: → [\d,]+)+)\*\*/.exec(step.explain)[1]);
    assert.equal(chain[0], n);
    assert.equal(chain[chain.length - 1], 1);
    chain.forEach((v, i) => { if (i) assert.equal(v, Math.floor(chain[i - 1] / 2)); });
    assert.equal(chain.length, step.answer);
    assert.match(step.explain, new RegExp(`\\*\\*${step.answer} piles\\*\\*`));
    assert.deepEqual(ints(step.hints[1].split('.')[0]), chain);
    assert.equal(new Set(step.wrong.map((w) => w[0])).size, step.wrong.length, 'distinct anticipated mistakes');
  }
  assert.ok(sizes.size >= 12, 'many different sizes turn up');
});

test('a million and a billion: 20 and 30 looks; 19 and 29 halvings', () => {
  const million = fixed('binary-search', 'million');
  assert.equal(binarySearchWorstBig(1e6), 20);
  assert.equal(million.answer, 20);
  assert.ok(2 ** 19 <= 1e6 && 1e6 < 2 ** 20, 'so 20 looks, not 19 or 21, is the exact worst case');
  let halvings = 0;
  for (let n = 1e6; n > 1; n = Math.floor(n / 2)) halvings++;
  assert.equal(halvings, 19);
  assert.match(million.explain, /after 19 halvings a single name is left/);
  assert.match(million.explain, /2\^\{20\} = 1\{,\}048\{,\}576/);
  assert.equal(2 ** 20, 1048576);
  assert.equal(2 ** 10, 1024);
  assert.equal(binarySearchWorst(1000), 10, 'a thousand items: 10 checks (recap)');
  const billion = fixed('big-o', 'billion');
  assert.equal(binarySearchWorstBig(1e9), 30);
  assert.equal(billion.answer, 30);
  assert.ok(2 ** 29 <= 1e9 && 1e9 < 2 ** 30);
  assert.ok(Math.abs(2 ** 30 / 1e9 - 1.07) < 0.005, '2^30 is about 1.07 billion');
});

test('cards: 7 sorted cards need at most 3 flips, and the check wants exactly that', () => {
  assert.equal(binarySearchWorst(7), 3);
  const sorted = raw('binary-search', 'cards-sorted');
  assert.equal(sorted.widget.count, 7);
  assert.equal(sorted.check({ found: true, flips: 3, target: 42 }), true);
  assert.match(sorted.check({ found: true, flips: 4, target: 42 }), /in 4 flips/);
  assert.match(sorted.check({ found: false, flips: 2, target: 42 }), /find 42/);
  const shuffled = raw('binary-search', 'cards-shuffled');
  assert.ok(shuffled.widget.unlucky && shuffled.widget.sorted === false);
  // linear search: the average number of looks for a target that is present is (n + 1) / 2
  assert.equal([1, 2, 3, 4, 5, 6, 7].reduce((a, b) => a + b) / 7, 4);
});

test('next-check (generated): the keyed card is the middle of what a real binary search still has in play', () => {
  const stages = new Set();
  for (const step of variants('binary-search', 'next-check', 300)) {
    const w = step.widget;
    const target = int(/\*\*(\d+)\*\*/.exec(step.text)[1]);
    assert.equal(w.target, target);
    assert.equal(w.values.length, 7);
    assert.ok(w.values.every((v, i) => i === 0 || w.values[i - 1] < v), 'sorted, no repeats');
    assert.ok(w.values.includes(target));
    assert.ok(w.pick, 'pick mode');
    // the face-up cards must be exactly the ones binary search turns first, and none of them the target
    const turned = [];
    let lo = 0;
    let hi = 6;
    while (turned.length < w.open.length) {
      const mid = (lo + hi) / 2;
      assert.ok(Number.isInteger(mid), 'an odd number of cards in play, so "the middle" is one card');
      turned.push(mid);
      assert.notEqual(w.values[mid], target, 'the target is not already face up');
      if (w.values[mid] < target) lo = mid + 1; else hi = mid - 1;
    }
    assert.deepEqual(w.open, turned);
    // what is in play, worked out from the face-up cards alone
    const live = w.values.map((v, i) => i).filter((i) => !w.open.includes(i)
      && w.open.every((j) => (w.values[j] < target ? i > j : i < j)));
    assert.deepEqual(live, Array.from({ length: hi - lo + 1 }, (_, i) => lo + i));
    assert.equal(live.length % 2, 1);
    const want = live[(live.length - 1) / 2];
    stages.add(w.open.length);

    const accepted = [];
    for (let i = 0; i < 7; i++) {
      if (w.open.includes(i)) continue;
      const verdict = step.check({ picked: i });
      if (verdict === true) accepted.push(i);
      else {
        assert.equal(typeof verdict, 'string');
        const told = /^Card (\d) shows (\d+), which is (lower|higher) than (\d+)\./.exec(verdict);
        if (told) {
          const j = Number(told[1]) - 1;
          assert.ok(w.open.includes(j), 'the feedback points at a face-up card');
          assert.equal(w.values[j], Number(told[2]));
          assert.equal(told[3], w.values[j] < target ? 'lower' : 'higher');
          assert.ok(told[3] === 'lower' ? i < j : i > j, 'and the picked card really is on the ruled-out side');
          assert.ok(!live.includes(i));
        } else assert.ok(live.includes(i), `"still in play" feedback only for cards in play: ${verdict}`);
      }
    }
    assert.deepEqual(accepted, [want]);
    assert.equal(step.solution.picked, want);
    assert.equal(typeof step.check({ picked: null }), 'string');
    assert.match(step.explain, new RegExp(`\\*\\*card ${want + 1}\\*\\*`));
    if (w.open.length) {
      for (const [, card, value, verdict] of step.explain.matchAll(/card (\d) shows (\d+), which is too (low|high)/g)) {
        assert.equal(w.values[Number(card) - 1], Number(value));
        assert.equal(verdict, Number(value) < target ? 'low' : 'high');
      }
      const said = /So (?:only card (\d) is|cards (\d) to (\d) are) still in play/.exec(step.explain);
      assert.deepEqual(said[1] ? [Number(said[1]), Number(said[1])] : [Number(said[2]), Number(said[3])], [lo + 1, hi + 1]);
    } else assert.match(step.explain, /all 7 cards are in play.*card 4.*at most 3 cards remain/s);
  }
  assert.deepEqual([...stages].sort(), [0, 1, 2]);
});

test('binary-search recipe: carried out line by line it finds every item, within the promised number of looks', () => {
  const lines = raw('binary-search', 'recipe').items;
  assert.match(lines[0], /^Look at the middle item/);
  assert.match(lines[1], /stop: found/);
  assert.match(lines[2], /too small.*everything before it/);
  assert.match(lines[3], /^Otherwise.*everything after it/);
  assert.match(lines[4], /^Go back to the first step/);
  for (const n of [1, 2, 7, 100]) {
    const list = ascending(n).map((v) => v * 3);
    for (const want of list) {
      let part = list.slice();
      let looks = 0;
      for (;;) {
        const mid = Math.floor((part.length - 1) / 2);
        looks++;
        if (part[mid] === want) break;
        part = part[mid] < want ? part.slice(mid + 1) : part.slice(0, mid);
        assert.ok(part.length > 0);
      }
      assert.ok(looks <= binarySearchWorst(n));
    }
  }
});

/* ======================================================================
 * Lesson 3 · Putting Things in Order
 * ==================================================================== */

test('helpers: pairCount, bubblePass and inversions agree with a real bubble sort', () => {
  const rng = makeRng(77);
  for (let k = 0; k < 300; k++) {
    const row = rng.shuffle(ascending(rng.int(2, 9)));
    const run = bubbleSort(row);
    assert.ok(isSorted(run.sorted));
    assert.equal(run.comparisons, H.pairCount(row.length), 'comparisons do not depend on the starting order');
    assert.equal(run.swaps, H.inversions(row), 'one swap per pair that starts in the wrong order');
    assert.deepEqual(H.bubblePass(row).row, run.passes[0]);
    const sel = selectionSort(row);
    assert.ok(isSorted(sel.sorted));
    assert.equal(sel.comparisons, run.comparisons, 'selection sort: the same number of comparisons');
    assert.ok(sel.swaps <= row.length - 1 && sel.swaps <= run.swaps, 'selection sort never swaps more than bubble sort');
  }
});

test('the two worked rows: 10 comparisons each; and every count quoted in the lesson', () => {
  const bubble = raw('sorting', 'bubble');
  const run = bubbleSort(bubble.widget.values);
  assert.deepEqual([run.comparisons, run.swaps], [10, 6]);
  // the count is taught on its own screen (it used to sit in the explanation of "bubble")
  const counting = raw('sorting', 'teach-count');
  assert.match(counting.text, /4 on the first pass, then 3, then 2, then 1\. That makes \*\*10\*\*/);
  const passes = [...counting.text.matchAll(/^\s*\|\s*(\d)\s*\|\s*(\d)\s*\|\s*(\d)\s*\|\s*$/gm)].map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
  assert.deepEqual(passes, [[1, 5, 4], [2, 4, 3], [3, 3, 2], [4, 2, 1]], 'pass, loose bars, comparisons');
  assert.equal(passes.reduce((sum, p) => sum + p[2], 0), run.comparisons);
  assert.match(counting.text, /5 \\times 4 = 20\$, and half of it is 10\./);
  assert.match(bubble.explain, /decision 10 times/);
  const selection = raw('sorting', 'selection');
  const sel = selectionSort(selection.widget.values);
  assert.deepEqual([sel.comparisons, sel.swaps], [10, 3]);
  assert.ok(sel.swaps < bubbleSort(selection.widget.values).swaps, '"though with fewer swaps"');
  assert.match(selection.explain, /\*\*10 comparisons again\*\*/);
  // hook: 10 for five numbers; 4 comparisons check a sorted row; 7 is the least any method can guarantee
  const hook = fixed('sorting', 'hook');
  assert.equal(correctOf(hook)[0].text, '10');
  assert.equal(bubbleSort([3, 1, 5, 2, 4]).comparisons, 10);
  assert.equal(Math.ceil(Math.log2(120)), 7, 'five numbers have 120 orders, and 6 yes/no answers tell apart only 64');
  assert.match(hook.explain, /needs 7 when the numbers fall badly/);
  // the table shown after the machine has run (on the teaching screen that follows "watch")
  const fourfold = raw('sorting', 'teach-fourfold');
  const rows = [...fourfold.text.matchAll(/\|\s*(\d+)\s*\|\s*(\d+)\s*\|/g)].map((m) => [Number(m[1]), Number(m[2])]);
  assert.deepEqual(fourfold.figure.data.map((d) => [ints(d.label)[0], d.value]), rows, 'the bar chart shows the same counts');
  // its worked example: 40 numbers, then 80
  assert.equal(bubbleSort(ascending(40).reverse()).comparisons, 780);
  assert.equal(bubbleSort(ascending(80).reverse()).comparisons, 3160);
  assert.match(fourfold.text, /40 numbers take 780 comparisons\. For 80 numbers .*4 \\times 780 = 3\{,\}120\$, so roughly 3,000\. \(The exact count is 3,160\.\)/);
  assert.deepEqual(rows.map((r) => r[0]), raw('sorting', 'watch').widget.sizes);
  for (const [n, count] of rows) assert.equal(bubbleSort(makeRng(n).shuffle(ascending(n))).comparisons, count, `${n} bars`);
  assert.deepEqual(rows, [[5, 10], [10, 45], [20, 190]]);
  const watch = raw('sorting', 'watch');
  assert.equal(watch.check({ runs: { 5: 10, 10: 45, 20: 190 } }), true);
  assert.match(watch.check({ runs: { 5: 10 } }), /10 and 20 bars/);
  assert.match(lessons.sorting.recap[2], /10 for 5 items, 45 for 10/);
});

test('one-pass (generated): one real pass over the pictured row gives the keyed row', () => {
  for (const step of variants('sorting', 'one-pass', 300)) {
    const row = ints(/A row of five cards: ([\d, ]+)\./.exec(step.figure.alt)[1]);
    assert.equal(row.length, 5);
    assert.equal(new Set(row).size, 5);
    const after = row.slice();
    const log = [];
    for (let i = 0; i < 4; i++) {
      const swapped = after[i] > after[i + 1];
      log.push([after[i], after[i + 1], swapped]);
      if (swapped) { const t = after[i]; after[i] = after[i + 1]; after[i + 1] = t; }
    }
    assert.deepEqual(ints(correctOf(step)[0].text), after);
    const big = Math.max(...row);
    assert.equal(after[4], big, 'the biggest reaches the end');
    assert.ok(!isSorted(after.slice(0, 4)) || !isSorted(after), '"the rest is not sorted yet" is true');
    assert.ok(!isSorted(after), 'the fully sorted row is a wrong option');
    // the three distractors are what their feedback says they are
    const texts = step.options.map((o) => ints(o.text).join());
    assert.ok(texts.includes(row.slice().sort((a, b) => a - b).join()));
    assert.ok(texts.includes(row.join()));
    assert.ok(texts.includes([...row.filter((v) => v !== big), big].join()));
    assert.ok(log.some((l) => l[2]), 'the pass changes something, as the feedback on "unchanged" claims');
    // worked explanation and hint
    const lines = [...step.explain.matchAll(/^\d\. (\d) and (\d): (swap|leave)\. Row: ([\d, ]+)$/gm)];
    assert.equal(lines.length, 4);
    lines.forEach((m, i) => assert.deepEqual([Number(m[1]), Number(m[2]), m[3] === 'swap'], log[i]));
    assert.deepEqual(ints(lines[3][4]), after);
    assert.match(step.explain, new RegExp(`The biggest number, ${big}, has reached the end`));
    assert.match(step.hints[1], new RegExp(`${log[0][0]} against ${log[0][1]}: ${log[0][2] ? 'swap' : 'leave'}`));
  }
});

test('count (generated): a real bubble sort on that many numbers makes the keyed number of comparisons', () => {
  const seen = new Set();
  for (const [k, step] of variants('sorting', 'count').entries()) {
    const n = int(/\*\*(\d+) numbers\*\*/.exec(step.text)[1]);
    seen.add(n);
    assert.equal(int(/first pass makes (\d+) comparisons/.exec(step.text)[1]), n - 1);
    assert.equal(step.answer, bubbleSort(makeRng(k).shuffle(ascending(n))).comparisons);
    const terms = ints(step.explain.split('=')[0]);
    assert.deepEqual(terms, ascending(n - 1).reverse());
    assert.equal(terms.reduce((a, b) => a + b), step.answer);
    assert.match(step.explain, new RegExp(`${n} \\\\times ${n - 1} \\\\div 2 = ${step.answer}\\$`));
  }
  assert.deepEqual([...seen].sort((a, b) => a - b), [6, 7, 8, 9, 10]);
});

test('double (generated): the keyed "about" is the offered value nearest the true count for the doubled row', () => {
  for (const step of variants('sorting', 'double')) {
    const m = /\*\*([\d,]+) comparisons\*\* to sort ([\d,]+) numbers\.[\s\S]*for \*\*([\d,]+)\*\* numbers/.exec(step.text);
    const [now, n, twice] = [int(m[1]), int(m[2]), int(m[3])];
    assert.equal(twice, 2 * n);
    let count = 0;
    for (let i = 1; i < n; i++) count += i;
    assert.equal(now, count, 'the quoted count for the shorter row is right');
    let exact = 0;
    for (let i = 1; i < twice; i++) exact += i;
    const offered = step.options.map((o) => int(/About ([\d,]+)/.exec(o.text)[1]));
    const right = int(/About ([\d,]+)/.exec(correctOf(step)[0].text)[1]);
    assert.ok(Math.abs(right - exact) / exact < 0.02, `${right} is about ${exact}`);
    for (const v of offered) if (v !== right) assert.ok(Math.abs(v - exact) / exact > 0.45, `${v} is clearly not about ${exact}`);
    assert.ok(Math.abs(offered[0] / now - 2) < 0.1 && Math.abs(offered[2] / now - 8) < 0.4, 'the wrong options are the 2x and 8x the feedback talks about');
    assert.ok(Math.abs(exact / now - 4) < 0.1, 'about four times the work');
    assert.deepEqual(ints(/exact count is \$(.*)\$/.exec(step.explain)[1].replace(/\{,\}/g, ',').replace(/\\div 2/, '')), [twice, twice - 1, exact]);
  }
});

test('worst-case (generated): bubble sort on a reversed row really makes that many swaps, and no row needs more', () => {
  for (const step of variants('sorting', 'worst-case')) {
    const n = int(/\*\*(\d+) numbers\*\*/.exec(step.text)[1]);
    const run = bubbleSort(ascending(n).reverse());
    assert.equal(step.answer, run.swaps);
    assert.equal(run.swaps, run.comparisons, 'every comparison is a swap');
    assert.equal(ints(step.explain.split('=')[0]).reduce((a, b) => a + b), step.answer);
  }
  // "No starting order is worse": check all orders of up to 7 numbers
  const perms = (list) => (list.length < 2 ? [list] : list.flatMap((v, i) => perms([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [v, ...p])));
  for (const n of [4, 5, 6, 7]) assert.equal(Math.max(...perms(ascending(n)).map((p) => bubbleSort(p).swaps)), (n * (n - 1)) / 2);
});

test('bubble-sort recipe: the four lines, run as written, sort any row with n(n-1)/2 comparisons', () => {
  assert.deepEqual(raw('sorting', 'recipe').items, ['repeat until all are locked:', '  go along the loose pairs:', '    if left > right: swap', '  lock the last loose bar']);
  const rng = makeRng(5);
  for (let k = 0; k < 60; k++) {
    const row = rng.shuffle(ascending(rng.int(1, 9)));
    let loose = row.length;
    let comparisons = 0;
    while (loose > 0) {
      for (let i = 0; i + 1 < loose; i++) { comparisons++; if (row[i] > row[i + 1]) { const t = row[i]; row[i] = row[i + 1]; row[i + 1] = t; } }
      loose--;
    }
    assert.ok(isSorted(row));
    assert.equal(comparisons, (row.length * (row.length - 1)) / 2);
  }
});

/* ======================================================================
 * Lesson 4 · Divide and Conquer
 * ==================================================================== */

test('helpers: merge and mergeSortCounts agree with an independent merge sort', () => {
  const rng = makeRng(404);
  for (let k = 0; k < 300; k++) {
    const row = rng.shuffle(ascending(rng.int(2, 40)));
    const mine = mergeSort(row);
    const theirs = H.mergeSortCounts(row);
    assert.ok(isSorted(mine.sorted));
    assert.deepEqual([theirs.comparisons, theirs.moves, theirs.levels, theirs.sorted], [mine.comparisons, mine.moves, mine.levels, mine.sorted]);
    assert.equal(mine.levels, Math.ceil(Math.log2(row.length)));
    assert.equal(mine.moves, mine.levels * row.length, 'every card moves once per level');
    assert.ok(mine.comparisons <= mine.moves);
  }
});

test('the worked merge and the worked merge sort: 7 comparisons; 3 levels, 24 moves, 17 comparisons', () => {
  const two = raw('divide-and-conquer', 'merge-two');
  const [a, b] = two.widget.piles;
  assert.ok(isSorted(a) && isSorted(b));
  const merged = mergePiles(a, b);
  assert.equal(merged.out.length, 8);
  assert.equal(merged.comparisons, 7);
  assert.match(two.explain, /Eight cards, seven comparisons/);
  assert.equal(two.check({ done: true, sorted: true }), true);
  assert.equal(typeof two.check({ done: true, sorted: false }), 'string');
  assert.equal(typeof two.check({ done: false, sorted: true }), 'string');

  const sort = raw('divide-and-conquer', 'merge-sort');
  const run = mergeSort(sort.widget.values);
  assert.deepEqual([run.levels, run.moves, run.comparisons], [3, 24, 17]);
  assert.match(sort.explain, /24 card moves and 17 comparisons/);
  // the count is taught on the screen that follows (it used to sit in the explanation of "merge-sort")
  const levels = raw('divide-and-conquer', 'teach-levels');
  assert.match(levels.text, /\*\*3 levels\*\*.*3 \\times 8 = 24\$ card moves, and only 17 comparisons/s);
  assert.equal(bubbleSort(sort.widget.values).comparisons, 28);
  assert.match(levels.text, /Bubble sort needs 28 comparisons for 8 cards/);
  const perLevel = [...levels.text.matchAll(/^\s*\|\s*(\d)\s*\|\s*(\d) piles? of (\d)\s*\|\s*(\d)\s*\|\s*$/gm)].map((m) => m.slice(1).map(Number));
  assert.deepEqual(perLevel, [[1, 4, 2, 8], [2, 2, 4, 8], [3, 1, 8, 8]], 'level, piles, pile size, cards moved');
  assert.match(levels.text, /1 → 2 → 4 → 8\. It takes 3 doublings to reach 8/);

  // the worked merge on the teaching screen: every row is what a real merge does next
  const demo = raw('divide-and-conquer', 'teach-merge');
  const [, demoA, demoB] = /merge of ([\d, ]+) with ([\d, ]+), step by step/.exec(demo.text);
  const restA = ints(demoA);
  const restB = ints(demoB);
  assert.ok(isSorted(restA) && isSorted(restB));
  const steps = [...demo.text.matchAll(/^\s*\|\s*(\d+) and (\d+)\s*\|\s*(\d+)\s*\|\s*([\d, ]+?)\s*\|\s*$/gm)];
  const row = [];
  for (const [, a, b, taken, out] of steps) {
    assert.deepEqual([restA[0], restB[0]], [Number(a), Number(b)], 'the two front cards');
    assert.equal(Number(taken), Math.min(restA[0], restB[0]));
    row.push(restA[0] < restB[0] ? restA.shift() : restB.shift());
    assert.deepEqual(ints(out), row);
  }
  assert.equal(steps.length, mergePiles(ints(demoA), ints(demoB)).comparisons);
  assert.ok(restA.length === 0 || restB.length === 0, 'the table stops when one pile is empty');
  const total = ints(demoA).length + ints(demoB).length;
  assert.match(demo.text, new RegExp(`so ${[...restA, ...restB].join(', ')} follows without a comparison: ${total} cards, ${steps.length} comparisons`));
  assert.equal(steps.length, mergeWorst(ints(demoA).length, ints(demoB).length), 'and it is a worst case: cards minus one');
});

test('merge-next (generated): the smaller front card of the pictured piles is the keyed card', () => {
  for (const step of variants('divide-and-conquer', 'merge-next', 300)) {
    const m = /Pile A still holds ([\d, ]+), with (\d+) at the front\. Pile B still holds ([\d, ]+), with (\d+) at the front\. Merged so far: ([\d, ]+|nothing)\./.exec(step.figure.alt);
    const pileA = ints(m[1]);
    const pileB = ints(m[3]);
    const out = m[5] === 'nothing' ? [] : ints(m[5]);
    assert.deepEqual([pileA[0], pileB[0]], [Number(m[2]), Number(m[4])]);
    assert.ok(pileA.length && pileB.length, 'both piles still have cards');
    assert.ok(isSorted(pileA) && isSorted(pileB) && isSorted(out));
    assert.equal(new Set([...pileA, ...pileB, ...out]).size, pileA.length + pileB.length + out.length, 'no card twice');
    assert.ok(out.length >= 1 && out.every((v) => v < pileA[0] && v < pileB[0]), 'a genuine half-finished merge');
    // carry the merge on by one card
    const next = mergePiles(pileA, pileB).out[0];
    assert.equal(step.answer, next);
    assert.equal(next, Math.min(...pileA, ...pileB), 'and it is the smallest card still waiting');
    const others = [...pileA, ...pileB].filter((v) => v !== next);
    assert.deepEqual(step.wrong.map((w) => w[0]).sort((x, y) => x - y), others.sort((x, y) => x - y), 'every other card has its own feedback');
    for (const [value, why] of step.wrong) {
      if (/not at the front/.test(why)) assert.ok(value !== pileA[0] && value !== pileB[0]);
      else assert.ok(value === Math.max(pileA[0], pileB[0]) && /front card, but not the smaller/.test(why));
    }
    assert.match(step.explain, new RegExp(`front cards are ${pileA[0]} and ${pileB[0]}, and the smaller one, \\*\\*${next}\\*\\*`));
    assert.match(step.hints[1], new RegExp(`${pileA[0]} and ${pileB[0]}\\.$`));
  }
});

test('merge-count (generated): the keyed number is the most comparisons any merge of those piles can need', () => {
  for (const step of variants('divide-and-conquer', 'merge-count')) {
    const m = /one holds \*\*(\d+) cards\*\*, the other \*\*(\d+)\*\*/.exec(step.text);
    const [a, b] = [Number(m[1]), Number(m[2])];
    assert.equal(step.answer, mergeWorst(a, b), `${a} and ${b}`);
    // and that worst case really happens: deal the cards alternately
    const all = ascending(a + b);
    const left = [];
    const right = [];
    let i = all.length - 1;
    while (i >= 0) { if (left.length < a && (right.length >= b || left.length <= right.length)) left.unshift(all[i--]); else right.unshift(all[i--]); }
    if (a === b) assert.equal(mergePiles(left, right).comparisons, step.answer);
    assert.ok(mergePiles(left, right).comparisons <= step.answer);
    assert.match(step.explain, new RegExp(`${a} \\+ ${b} − 1 = \\*\\*${step.answer}\\*\\*`));
    assert.match(step.hints[1], new RegExp(`There are ${a + b} cards`));
  }
  assert.equal(mergeWorst(20, 30), 49);
  assert.equal(mergePiles(ascending(25).map((v) => 2 * v), ascending(25).map((v) => 2 * v - 1)).comparisons, 49, 'two piles of 25 can need 49');
});

test('levels and work (generated): counted by really merging level by level', () => {
  const sizes = new Set();
  for (const step of variants('divide-and-conquer', 'levels')) {
    const n = int(/sort \*\*([\d,]+) cards\*\*/.exec(step.text)[1]);
    sizes.add(n);
    let piles = n;
    let levels = 0;
    while (piles > 1) { piles = Math.ceil(piles / 2); levels++; }
    assert.equal(step.answer, levels);
    assert.equal(2 ** step.answer, n);
    const chain = ints(step.explain.split('\n').find((l) => l.includes('→')));
    assert.deepEqual(chain, Array.from({ length: levels + 1 }, (_, i) => 2 ** i));
    assert.match(step.explain, new RegExp(`doubles \\*\\*${levels} times\\*\\*`));
  }
  assert.deepEqual([...sizes].sort((a, b) => a - b), [16, 32, 64, 128, 256, 512, 1024]);

  for (const [k, step] of variants('divide-and-conquer', 'work').entries()) {
    const n = int(/\*\*(\d+) cards\*\*/.exec(step.text)[1]);
    const run = mergeSort(makeRng(k).shuffle(ascending(n)));
    assert.equal(step.blanks.length, 3);
    assert.deepEqual(step.blanks.map((b) => b.numbers[0]), [run.levels, n, run.moves]);
    assert.ok(run.comparisons <= run.moves, '"never more comparisons than that"');
    const quoted = ints(step.explain);
    assert.deepEqual(quoted.slice(0, 3), [run.levels, n, run.moves]);
    assert.equal(quoted[quoted.length - 1], bubbleSort(ascending(n).reverse()).comparisons, 'bubble sort on the same row');
  }
});

test('the comparison table, the hook and the million-card claims', () => {
  const compare = fixed('divide-and-conquer', 'compare');
  const rows = [...compare.text.matchAll(/^\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|\s*([\d,]+)\s*\|\s*$/gm)].map((m) => [int(m[1]), int(m[2]), int(m[3])]);
  assert.equal(rows.length, 3);
  for (const [n, bubble, merge] of rows) {
    assert.equal(bubble, (n * (n - 1)) / 2, `bubble sort on ${n}`);
    assert.equal(merge, mergeSort(ascending(n).reverse()).moves, `merge sort moves on ${n}`);
  }
  assert.equal(bubbleSort(ascending(64).reverse()).comparisons, 2016);
  const ratio = rows[2][1] / rows[2][2];
  const offered = compare.options.map((o) => int(/About ([\d,]+) times/.exec(o.text)[1]));
  const nearest = offered.reduce((a, b) => (Math.abs(Math.log(b / ratio)) < Math.abs(Math.log(a / ratio)) ? b : a));
  assert.equal(int(/About ([\d,]+) times/.exec(correctOf(compare)[0].text)[1]), nearest);
  assert.equal(Math.round(ratio), 51);
  assert.equal(Math.round(rows[1][1] / rows[1][2]), 5, '"for 64 cards it was already about 5 times"');
  assert.equal(10 * 10240, 102400);
  assert.ok(1000 * 10240 > 1e7);

  // hook: bubble sort about 500,000 comparisons for 1,000 numbers; merge sort always under 10,000
  assert.equal((1000 * 999) / 2, 499500);
  let most = 0;
  const rng = makeRng(1000);
  for (let k = 0; k < 40; k++) most = Math.max(most, mergeSort(rng.shuffle(ascending(1000))).comparisons);
  assert.ok(most < 10000 && most > 8000, `merge sort on 1,000 numbers: ${most} comparisons`);
  assert.ok(mergeSort(ascending(1000)).moves === 10000);
  assert.equal(correctOf(fixed('divide-and-conquer', 'hook'))[0].text, 'About 10,000');
  assert.ok(499500 / most > 45 && 499500 / most < 62, 'about fifty times less');
  // no comparison sort can manage 1,000 comparisons: log2(1000!) is far bigger
  let bits = 0;
  for (let i = 2; i <= 1000; i++) bits += Math.log2(i);
  assert.ok(bits > 8500);

  // a million cards
  const million = fixed('divide-and-conquer', 'million');
  let piles = 1e6;
  let levels = 0;
  while (piles > 1) { piles = Math.ceil(piles / 2); levels++; }
  assert.equal(levels, 20);
  assert.equal(million.answer, 20);
  assert.equal(2 ** 19, 524288);
  assert.match(million.wrong.find((w) => w[0] === 19)[1], /524,288/);
  const moves = 20 * 1e6;
  const bubble = (1e6 * (1e6 - 1)) / 2;
  assert.ok(Math.abs(bubble / 5e11 - 1) < 0.001, 'about 500 billion');
  assert.equal(moves / 1e9, 1 / 50, 'a fiftieth of a second at a billion steps a second');
  assert.ok(bubble / 1e9 / 60 > 8 && bubble / 1e9 / 60 < 9, 'more than eight minutes');
  assert.equal(Math.round(bubble / moves / 1000), 25, 'about 25,000 times less work');
  assert.match(compare.explain, /about 25,000 times less work/);
});

test('merge-sort recipe: run as written (recursively) it sorts, and its depth is the number of levels', () => {
  assert.deepEqual(raw('divide-and-conquer', 'recursion').items, ['to sort a pile:', '  if it has 1 card: done', '  split it into two halves', '  sort each half this way', '  merge the two halves']);
  const sort = (pile) => {
    if (pile.length <= 1) return pile;
    const half = Math.floor(pile.length / 2);
    return mergePiles(sort(pile.slice(0, half)), sort(pile.slice(half))).out;
  };
  const rng = makeRng(12);
  for (let k = 0; k < 40; k++) assert.ok(isSorted(sort(rng.shuffle(ascending(rng.int(1, 50))))));
});

/* ======================================================================
 * Lesson 5 · How Work Grows
 * ==================================================================== */

test('the race: n = 32 is the first n with n squared over 1,000, and the check accepts only that', () => {
  const step = raw('big-o', 'race');
  const range = step.widget.params.n;
  let first = null;
  for (let n = range.min; n <= range.max; n += range.step) {
    if (first == null && n * n > 1000) first = n;
    const verdict = step.check({ n });
    assert.equal(verdict === true, n === 32, `n=${n}`);
    if (verdict !== true) assert.equal(/still not more than 1,000/.test(verdict), n * n <= 1000, `feedback at n=${n}`);
  }
  assert.equal(first, 32);
  assert.equal(step.solution.n, 32);
  assert.deepEqual([31 * 31, 32 * 32, 32 * Math.log2(32), Math.log2(32)], [961, 1024, 160, 5]);
  assert.match(step.explain, /n\^2 = 1024\$ steps, \$n \\log_2 n = 160\$, \$n = 32\$ and \$\\log_2 n = 5\$/);
});

test('the growth table is right in every cell', () => {
  const text = raw('big-o', 'table').text;
  const row = (label) => text.split('\n').find((l) => l.trim().startsWith(`| $${label}$ |`)).split('|').slice(2, 5).map((c) => c.trim());
  const ns = [10, 100, 1000];
  assert.deepEqual(row('n'), ['10', '100', '1,000']);
  row(String.raw`\log_2 n`).forEach((cell, i) => assert.equal(int(/\d[\d,]*/.exec(cell)[0]), Math.round(Math.log2(ns[i]))));
  row(String.raw`n \log_2 n`).forEach((cell, i) => {
    const shown = int(/\d[\d{},]*/.exec(cell)[0].replace(/[{}]/g, ''));
    assert.ok(Math.abs(shown - ns[i] * Math.log2(ns[i])) / shown < 0.01, `n log n at ${ns[i]}: ${shown}`);
  });
  assert.deepEqual(row('n^2'), ['100', '10,000', '1 million']);
  assert.deepEqual([10 ** 2, 100 ** 2, 1000 ** 2], [100, 10000, 1e6]);
  const pow = row('2^n');
  assert.equal(pow[0], '1,024');
  assert.equal(2 ** 10, 1024);
  assert.equal(String(2n ** 100n).length - 1, 30);
  assert.match(pow[1], /10\^\{30\}/);
  assert.equal(String(2n ** 1000n).length, 302, '2^1000 has 302 digits');
  assert.match(pow[2], /10\^\{301\}/);
  assert.match(text, /a number with 302 digits/);
  assert.equal(String(2n ** 100n)[0], '1');
  assert.equal(String(2n ** 1000n)[0], '1');
});

test('ten-times, doubling, crossover and the exponential safe', () => {
  const ten = fixed('big-o', 'ten-times');
  assert.equal(1000 ** 2 / 100 ** 2, 100);
  assert.equal(correctOf(ten)[0].text, '100 times more');
  assert.deepEqual([Math.round(Math.log2(100)), Math.round(Math.log2(1000))], [7, 10]);

  const doubling = fixed('big-o', 'doubling');
  for (const n of [8, 64, 1000]) {
    assert.equal((2 * n) / n, 2);
    assert.equal((2 * n) ** 2 / n ** 2, 4);
    assert.ok(Math.abs(Math.log2(2 * n) - Math.log2(n) - 1) < 1e-9);
  }
  assert.deepEqual(doubling.blanks.map((b) => b.answer), ['twice as many', 'four times as many', 'one more step']);

  const cross = raw('big-o', 'crossover');
  const range = cross.widget.params.n;
  for (let n = range.min; n <= range.max; n += range.step) {
    const verdict = cross.check({ n });
    assert.equal(verdict === true, 100 * n === n * n, `n=${n}`);
    if (verdict !== true) assert.equal(/B is still ahead/.test(verdict), n * n < 100 * n, `who is ahead at n=${n}`);
  }
  assert.deepEqual([100 * 100, 100 ** 2, 10 ** 2, 100 * 10], [10000, 10000, 100, 1000]);

  const safe = fixed('big-o', 'exponential');
  assert.ok(Math.abs(2 ** 30 / 1e9 - 1) < 0.08, '2^30 is about a billion');
  const years = 2 ** 60 / 1e9 / (365.25 * 24 * 3600);
  assert.ok(years > 30 && years < 40);
  assert.equal(correctOf(safe)[0].text, 'More than 30 years');
  assert.ok(1e9 / (365.25 * 24 * 3600) > 30, 'a billion seconds is more than 30 years');
  assert.ok(Math.abs(30 * 24 * 3600 - 2.6e6) < 1e4, 'a month is about 2.6 million seconds');

  const hook = fixed('big-o', 'hook');
  assert.equal(correctOf(hook)[0].text, 'About a fiftieth of a second');
  assert.equal(20e6 / 1e9, 0.02);
  assert.equal(20e9 / 1e9, 20, '20 seconds would be 20 billion steps');
});

test('scale-up (generated): the keyed time follows from the stated growth law', () => {
  const kinds = new Set();
  for (const step of variants('big-o', 'scale-up', 300)) {
    const square = /\$O\(n\^2\)\$/.test(step.text);
    assert.notEqual(square, /\$O\(n\)\$/.test(step.text));
    assert.equal(square, /\*\*square\*\*/.test(step.text));
    const m = /On ([\d,]+) items it takes \*\*(\d+) (second|minute)s?\*\*\.[\s\S]*on \*\*([\d,]+)\*\* items/.exec(step.text);
    const [base, t, unit, bigger] = [int(m[1]), Number(m[2]), m[3], int(m[4])];
    kinds.add(`${square}${unit}`);
    assert.equal(step.unit, `${unit}s`);
    const factor = bigger / base;
    assert.ok(Number.isInteger(factor) && factor >= 2);
    // work = c * n^p, fitted to the stated time
    const p = square ? 2 : 1;
    const c = t / base ** p;
    assert.ok(Math.abs(c * bigger ** p - step.answer) < 1e-9, `${step.text} -> ${step.answer}`);
    assert.ok(step.answer > t);
    assert.match(step.explain, new RegExp(`= ${step.answer}\\$ ${unit}s\\.$`));
    assert.match(step.hints[0], new RegExp(`${factor} times as big`));
    for (const [value, why] of step.wrong) {
      if (/would be right for \$O\(n\)\$/.test(why)) assert.equal(value, t * factor);
      if (/would be right for \$O\(n\^2\)\$/.test(why)) assert.equal(value, t * factor * factor);
    }
  }
  assert.equal(kinds.size, 4);
});

test('big-O labels: the matched and sorted jobs really grow that way (measured by running them)', () => {
  // count steps at n and 2n: O(1) stays, O(log n) adds one, O(n) doubles, O(n log n) a bit more than doubles, O(n^2) about four times
  const n = 512;
  assert.equal(binarySearchWorst(2 * n) - binarySearchWorst(n), 1);
  const merge = (k) => mergeSort(makeRng(k).shuffle(ascending(k))).moves;
  assert.ok(merge(2 * n) / merge(n) > 2 && merge(2 * n) / merge(n) < 2.3);
  const bubble = (k) => (k * (k - 1)) / 2;
  assert.ok(Math.abs(bubble(2 * n) / bubble(n) - 4) < 0.01);
  assert.equal((2 * n * (2 * n - 1)) / 2 / ((n * (n - 1)) / 2) > 3.99, true, 'handshakes');
  const pairs = Object.fromEntries(raw('big-o', 'match-algorithms').pairs);
  assert.equal(pairs['Binary search in a sorted list'], String.raw`$O(\log n)$`);
  assert.equal(pairs['Reading every item once'], '$O(n)$');
  assert.equal(pairs['Merge sort'], String.raw`$O(n \log n)$`);
  assert.equal(pairs['Bubble sort'], '$O(n^2)$');
  assert.equal(pairs['Looking at the first item only'], '$O(1)$');
  const classify = fixed('big-o', 'classify');
  const bucketOf = (re) => classify.buckets[classify.items.find((it) => re.test(it.text)).bucket];
  assert.equal(bucketOf(/dictionary/), String.raw`$O(\log n)$`);
  assert.equal(bucketOf(/guessing game/), String.raw`$O(\log n)$`);
  assert.equal(bucketOf(/prices/), '$O(n)$');
  assert.equal(bucketOf(/tallest/), '$O(n)$');
  assert.equal(bucketOf(/Bubble-sort/), '$O(n^2)$');
  assert.equal(bucketOf(/shake hands/), '$O(n^2)$');
});

/* ======================================================================
 * Lesson 6 · Maps and Shortest Paths
 * ==================================================================== */

test('helpers and widget: bfs, layers and shortestPath agree with an independent flood of every graph from every node', () => {
  for (const [name, graph] of Object.entries(H.GRAPHS)) {
    const ids = Object.keys(graph.nodes);
    assert.equal(new Set(graph.edges.map((e) => e.split('-').sort().join('-'))).size, graph.edges.length, `${name}: no edge twice`);
    for (const edge of graph.edges) { const [a, b] = edge.split('-'); assert.ok(graph.nodes[a] && graph.nodes[b] && a !== b, `${name}: ${edge}`); }
    for (const start of ids) {
      const mine = flood(graph, start);
      assert.equal(Object.keys(mine.dist).length, ids.length, `${name}: connected`);
      assert.deepEqual(H.bfs(graph, start).dist, mine.dist, `${name} from ${start}`);
      assert.deepEqual(H.layers(graph, start), mine.rings, `${name} from ${start}`);
      const adj = Object.fromEntries(ids.map((id) => [id, [...mine.near[id]].sort()]));
      assert.deepEqual(widgetDistances(ids, adj, start), mine.dist, `${name} from ${start}: widget`);
      for (const to of ids) {
        const path = H.shortestPath(graph, start, to);
        assert.ok(isRoute(graph, path) && path[0] === start && path[path.length - 1] === to && path.length - 1 === mine.dist[to]);
      }
    }
  }
});

test('the friends graph: A to H takes 3 hand-overs, and the layer tasks accept exactly the right nodes', () => {
  const friends = H.GRAPHS.friends;
  const { dist, rings, near } = flood(friends, 'A');
  const hook = fixed('graphs-bfs', 'hook');
  assert.equal(dist.H, 3);
  assert.equal(correctOf(hook)[0].text, '3');
  assert.ok(isRoute(friends, ['A', 'B', 'F', 'H']), 'the route in the explanation exists');
  assert.ok(![...near.A].some((v) => near.H.has(v)), 'nobody who knows A also knows H');
  assert.ok(simpleRoutes(friends, 'A').some((p) => p[p.length - 1] === 'H' && p.length - 1 === 4), 'a four-hand-over route exists too');
  assert.ok(simpleRoutes(friends, 'A').filter((p) => p[p.length - 1] === 'H' && p.length - 1 === 3).every((p) => p.includes('F')), 'every shortest one goes through F');
  assert.deepEqual(rings, [['A'], ['B', 'C'], ['D', 'E', 'F'], ['G', 'H']]);
  assert.match(raw('graphs-bfs', 'name-it').figure.alt, /B and C are 1 step away, D, E and F are 2, and G and H are 3/);
  assert.deepEqual([...near.B].filter((v) => v !== 'A').sort(), ['D', 'F'], 'hint: from B you reach D and F');

  for (const [id, k] of [['layer-one', 1], ['layer-two', 2]]) {
    const step = raw('graphs-bfs', id);
    const others = Object.keys(friends.nodes).filter((v) => v !== 'A');
    for (const picked of subsets(others)) {
      const verdict = step.check({ selected: picked.slice().sort() });
      assert.equal(verdict === true, sameSet(picked, rings[k]), `${id}: ${picked.join('')}`);
      if (verdict !== true) checkLayerFeedback(verdict, dist, 'A');
    }
    assert.deepEqual(step.solution.selected, rings[k]);
  }
});

/** Any distance a piece of layer feedback states must be the true one. */
function checkLayerFeedback(verdict, dist, start) {
  assert.equal(typeof verdict, 'string');
  const only = /^(\w) is only (\d+) steps? from (\w): it has an edge (straight to \w|to an earlier layer)\.$/.exec(verdict);
  const far = /^(\w) is (\d+) steps from (\w)\. No route with only (\d+) edges? reaches it\.$/.exec(verdict);
  if (only) {
    assert.equal(dist[only[1]], Number(only[2]));
    assert.equal(only[3], start);
    assert.equal(only[4].startsWith('straight'), dist[only[1]] === 1);
  } else if (far) {
    assert.equal(dist[far[1]], Number(far[2]));
    assert.ok(Number(far[2]) > Number(far[4]));
  } else assert.match(verdict, /^(Tap the nodes|Right so far)/);
}

test('the metro graph: I is 4 steps from A, and the route check accepts exactly the shortest routes', () => {
  const metro = H.GRAPHS.metro;
  const { dist, rings } = flood(metro, 'A');
  assert.equal(dist.I, 4);
  assert.deepEqual(rings, [['A'], ['B', 'C'], ['D', 'E', 'F'], ['G', 'H'], ['I']]);
  const step = raw('graphs-bfs', 'read-path');
  assert.deepEqual([step.widget.start, step.widget.goal], ['A', 'I']);
  let shortest = 0;
  for (const path of simpleRoutes(metro, 'A')) {
    const reached = path[path.length - 1] === 'I';
    const verdict = step.check({ path, length: path.length - 1, reached });
    assert.equal(verdict === true, reached && path.length - 1 === 4, path.join(''));
    if (verdict === true) {
      shortest++;
      path.forEach((v, i) => assert.equal(dist[v], i, 'a shortest route climbs one layer per step'));
    } else if (reached) assert.match(verdict, new RegExp(`it takes ${path.length - 1} steps`));
  }
  assert.equal(shortest, 6, '"There are several of them here"');
  assert.equal(step.check({ path: step.solution.path, length: 4, reached: true }), true);
  assert.ok(isRoute(metro, step.solution.path));
});

test('distance (generated): flooding the pictured graph from the named start reaches the goal after the keyed number of steps', () => {
  const asked = new Set();
  for (const step of variants('graphs-bfs', 'distance', 300)) {
    const [, from, to] = /from \*\*(\w)\*\* to \*\*(\w)\*\*/.exec(step.text);
    const graph = { nodes: step.figure.nodes, edges: step.figure.edges };
    assert.deepEqual([step.figure.start, step.figure.goal], [from, to]);
    assert.ok(!step.figure.showDist, 'the picture does not give the distances away');
    const { dist, rings } = flood(graph, from);
    assert.equal(step.answer, dist[to], `${from} to ${to}`);
    assert.ok(step.answer >= 2);
    asked.add(`${Object.keys(graph.nodes).length}${graph.edges.length}${from}${to}`);
    // the worked route is a real route of that length
    const route = /One shortest route is ([\w →]+)\./.exec(step.explain)[1].split(' → ');
    assert.ok(isRoute(graph, route));
    assert.deepEqual([route[0], route[route.length - 1], route.length - 1], [from, to, step.answer]);
    // the layers as listed
    const listed = /Layer by layer from \w: (.*)\.\n/.exec(step.explain)[1].split('; ').map((part) => {
      const [, k, names] = /^(\d+) steps?: (.*)$/.exec(part);
      return [Number(k), names.split(', ')];
    });
    assert.deepEqual(listed, rings.slice(1).map((ring, i) => [i + 1, ring]));
    assert.match(step.explain, new RegExp(`${to} first turns up after \\*\\*${step.answer} steps\\*\\*`));
    assert.deepEqual(step.hints[1].replace(/^Layer 1 is |\.$/g, '').split(/, | and /), rings[1]);
    assert.match(step.figure.alt, new RegExp(`A graph with ${Object.keys(graph.nodes).length} nodes`));
  }
  assert.ok(asked.size >= 40, `many different questions (${asked.size})`);
});

test('two-away (generated): of all possible selections, only the true second layer is accepted', () => {
  const asked = new Set();
  for (const step of variants('graphs-bfs', 'two-away', 150)) {
    const start = /exactly 2 steps from (\w)\./.exec(step.text)[1];
    const graph = { nodes: step.widget.nodes, edges: step.widget.edges };
    assert.equal(step.widget.start, start);
    assert.ok(!step.widget.showDist);
    const { dist, rings } = flood(graph, start);
    const want = rings[2];
    assert.ok(want && want.length >= 2);
    asked.add(`${graph.edges.length}${start}`);
    for (const picked of subsets(Object.keys(graph.nodes).filter((v) => v !== start))) {
      const verdict = step.check({ selected: picked.slice().sort() });
      assert.equal(verdict === true, sameSet(picked, want), `${start}: ${picked.join('')}`);
      if (verdict !== true) checkLayerFeedback(verdict, dist, start);
    }
    assert.deepEqual(step.solution.selected, want);
    const said = step.explain.split('\n').map((l) => l.trim()).filter(Boolean);
    assert.deepEqual(/neighbours of \w: (.*)\.$/.exec(said[0])[1].split(/, | and /), rings[1]);
    assert.deepEqual(/reaches \*\*(.*)\*\*\./.exec(said[1])[1].split(/, | and /), want);
  }
  assert.ok(asked.size >= 10, `several different questions (${asked.size})`);
});

test('queue, recipe and weights: the stated queue, a run of the five-line recipe, and the road sums', () => {
  // queue-trace: first in, first out
  const trace = fixed('graphs-bfs', 'queue-trace');
  const queue = ['C', 'D', 'E'];
  queue.shift();
  queue.push('F', 'G');
  assert.equal(correctOf(trace)[0].text, queue.join(', '));
  // D and E need not be in an EARLIER layer than F and G: in the little tree S-P, S-C, P-D, P-E, C-F, C-G the queue
  // is C, D, E when C is explored, and D, E, F, G are all two steps from S. The explanation must not claim otherwise.
  {
    const tree = { nodes: { S: 0, P: 0, C: 0, D: 0, E: 0, F: 0, G: 0 }, edges: ['S-P', 'S-C', 'P-D', 'P-E', 'C-F', 'C-G'] };
    const { dist } = flood(tree, 'S');
    const found = new Set(['S']);
    const line = ['S'];
    let seen = false;
    while (line.length) {
      if (line.join() === 'C,D,E') { seen = true; assert.deepEqual([dist.D, dist.E, dist.F, dist.G], [2, 2, 2, 2]); }
      const front = line.shift();
      for (const edge of tree.edges) {
        const [a, b] = edge.split('-');
        const v = a === front ? b : b === front ? a : null;
        if (v && !found.has(v)) { found.add(v); line.push(v); }
      }
    }
    assert.ok(seen, 'the queue C, D, E really occurs');
    assert.doesNotMatch(trace.explain, /belong to an earlier layer/);
    assert.match(trace.explain, /cannot belong to a later layer/);
  }

  // the recipe, run as written, on every graph: distances come out right, each node queued once, each edge seen twice
  assert.deepEqual(raw('graphs-bfs', 'recipe').items, ['put start in the queue', 'while queue is not empty:', '  take the front node', '  for each new neighbour:', '    add it to the back']);
  for (const graph of Object.values(H.GRAPHS)) {
    for (const start of Object.keys(graph.nodes)) {
      const { dist, near } = flood(graph, start);
      const found = { [start]: 0 };
      const line = [start];
      let queued = 1;
      let looked = 0;
      const explored = [];
      while (line.length) {
        const front = line.shift();
        explored.push(front);
        for (const v of [...near[front]].sort()) {
          looked++;
          if (v in found) continue;
          found[v] = found[front] + 1;
          line.push(v);
          queued++;
        }
      }
      assert.deepEqual(found, dist);
      assert.equal(queued, Object.keys(graph.nodes).length);
      assert.equal(looked, 2 * graph.edges.length);
      assert.ok(explored.every((v, i) => i === 0 || dist[explored[i - 1]] <= dist[v]), 'nodes are explored in order of distance: no layer starts before the one before is finished');
    }
  }

  // weights: 12 km against 3 + 4 km
  const weights = fixed('graphs-bfs', 'weights');
  const km = ints(weights.figure.alt.replace(/Towns A and B/, ''));
  assert.deepEqual(km, [12, 3, 4]);
  assert.ok(3 + 4 < 12);
  assert.equal(correctOf(weights)[0].text, 'Through C: 2 edges, 7 km');

  const uses = fixed('graphs-bfs', 'uses');
  assert.deepEqual(uses.options.map((o) => o.correct), [true, true, true, false, false]);
});

/* ======================================================================
 * Teach before you ask
 * ==================================================================== */

/** The teaching screens added in the "teach before you ask" revision, each with the first step it serves. */
const TEACHING = {
  'what-is-an-algorithm': [['teach-trace', 'trace'], ['teach-many-ways', 'what-counts'], ['teach-loop', 'find-largest']],
  'binary-search': [['teach-worst-case', 'best-first'], ['teach-sorted-row', 'cards-sorted'], ['teach-linear', 'where-it-works'], ['teach-count', 'count-guesses']],
  sorting: [['teach-pass', 'bubble'], ['teach-count', 'count'], ['teach-fourfold', 'double']],
  'divide-and-conquer': [['teach-merge', 'merge-next'], ['teach-levels', 'levels'], ['teach-recursion', 'recursion']],
  'big-o': [['teach-growths', 'race'], ['teach-scale', 'scale-up']],
  'graphs-bfs': [['teach-graph', 'layer-one'], ['teach-queue', 'queue-trace'], ['teach-fewest', 'uses']],
};
const at = (lesson, id) => { raw(lesson, id); return lessons[lesson].steps.findIndex((s) => s.id === id); };
/** The lines of the pseudo-code block in a step's text, without the indentation of the lesson file. */
function fenced(text) {
  const lines = /```pseudo\n([\s\S]*?)\n\s*```/.exec(text)[1].split('\n');
  const margin = Math.min(...lines.map((l) => l.length - l.trimStart().length));
  return lines.map((l) => l.slice(margin));
}
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
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((step) => fixed(id, step.id)); // resolved, as the player sees them
    const roles = steps.map(role);
    assert.ok(steps.length >= 12 && steps.length <= 18, `${id}: ${steps.length} steps`);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    assert.ok(roles.filter((kind) => kind === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const [teach, ask] of TEACHING[id]) {
      teaches(id, teach, ask);
      const next = roles.indexOf('graded', at(id, teach) + 1);
      assert.ok(next > 0 && next <= at(id, ask), `${id}/${teach}: nothing graded is asked between it and "${ask}" that it does not serve`);
    }
  }
});

test('teach before you ask, lesson 1: a worked trace, "many algorithms", and steps that repeat', () => {
  const L = 'what-is-an-algorithm';
  // the worked trace: its lines, replayed, are what the robot in the figure really does
  const trace = teaches(L, 'teach-trace', 'trace', [/\*\*trace\*\*/, /the robot's left, not yours/]);
  const fig = trace.figure;
  assert.equal(fig.editable, false);
  const facing = /The robot faces \*\*(up|right|down|left)\*\*/.exec(trace.text)[1];
  assert.equal(COMPASS[fig.start.dir], facing);
  assert.deepEqual(/and runs: ([\w, ]+)\./.exec(trace.text)[1].split(', ').map((w) => WORD[w]), fig.program);
  const end = walk([fig.start.x, fig.start.y], facing, fig.program);
  for (const [x, y] of end.trail) assert.ok(x >= 0 && y >= 0 && x < fig.cols && y < fig.rows, 'the robot stays on the grid');
  let pos = [fig.start.x, fig.start.y];
  let dir = facing;
  let commands = 0;
  for (const line of trace.text.split('\n').map((l) => l.trim()).filter((l) => /^\d+\. /.test(l))) {
    const fwd = /^\d+\. Forward(?: × (\d+))?: (\d+) squares? (up|right|down|left)\.$/.exec(line);
    const trn = /^\d+\. Turn (left|right)(?: \(the robot's (?:left|right), not yours\))?: same square, now facing (up|right|down|left)\.$/.exec(line);
    assert.ok(fwd || trn, `unreadable line: ${line}`);
    if (fwd) {
      assert.equal(fwd[3], dir);
      pos = [pos[0] + Number(fwd[2]) * HEADING[dir][0], pos[1] + Number(fwd[2]) * HEADING[dir][1]];
      commands += Number(fwd[2]);
    } else {
      const [dx, dy] = turn(HEADING[dir], trn[1] === 'right' ? 'R' : 'L');
      dir = Object.keys(HEADING).find((k) => HEADING[k][0] === dx && HEADING[k][1] === dy);
      assert.equal(trn[2], dir);
      commands += 1;
    }
  }
  assert.equal(commands, fig.program.length);
  assert.deepEqual(pos, [end.x, end.y]);
  const sim = widgetRobot({ cols: fig.cols, rows: fig.rows, start: fig.start, goal: null, walls: [] }, fig.program);
  assert.deepEqual([sim.final.x, sim.final.y, sim.crashed], [end.x, end.y, false]);
  // different data: three Forwards in a row never turn up in the generated puzzle
  assert.ok(fig.program.join('').includes('FFF'));
  for (const step of variants(L, 'trace', 300)) assert.ok(!step.figure.program.join('').includes('FFF'));

  // "written in a programming language" and "the only correct method" are answered on a screen before they are asked
  teaches(L, 'teach-many-ways', 'what-counts', [/\*\*correct\*\*/, /many correct algorithms/, /\*\*counting steps\*\*/, /in plain words, as a diagram or in a programming language/]);
  assert.ok(at(L, 'fewer-steps') < at(L, 'teach-many-ways'), 'it follows the two programs it talks about');
  assert.match(raw(L, 'teach-many-ways').text, /\| The old one \| 8 \| yes \|[\s\S]*\| Yours \| 5 \| yes \|/);
  assert.equal(raw(L, 'fewer-steps').widget.program.length, 8);
  assert.equal(raw(L, 'fewer-steps').solution.program.length, 5);

  // the loop and the test, with a recipe of the same shape as the one the learner then has to assemble
  const loop = teaches(L, 'teach-loop', 'find-largest', [/\*\*for each\*\* repeats the indented lines/, /\*\*if\*\* does its indented line only when the test is true/, /is bigger than/]);
  const code = fenced(loop.text);
  assert.equal(code.length, 5);
  const wanted = raw(L, 'find-largest').items;
  code.forEach((line, i) => {
    assert.equal(line.length - line.trimStart().length, wanted[i].length - wanted[i].trimStart().length, `line ${i + 1} is indented like the line it prepares for`);
    if (i !== 3) assert.equal(line.trim().split(' ')[0], wanted[i].trim().split(' ')[0], `line ${i + 1} starts with the same word (set, for, if, output)`);
  });
  assert.notDeepEqual(code, wanted);
  const limit = Number(/if number > (\d+):/.exec(code.join('\n'))[1]);
  assert.match(loop.text, new RegExp(`numbers bigger than ${limit}`));
  const list = ints(/On the list ([\d, ]+) it puts out/.exec(loop.text)[1]);
  // the run, one column per number: the number, the verdict of the test, and the count after it
  const cells = (label) => loop.text.split('\n').find((l) => l.trim().startsWith(`| ${label} |`)).split('|').slice(2, -1).map((c) => c.trim());
  assert.deepEqual(cells('Number').map(Number), list);
  const verdicts = cells('Bigger?');
  const shown = cells('`count`').map(Number);
  assert.deepEqual([verdicts.length, shown.length], [list.length, list.length]);
  let count = 0;
  list.forEach((number, i) => {
    assert.equal(verdicts[i], number > limit ? 'yes' : 'no');
    if (number > limit) count += 1;
    assert.equal(shown[i], count);
  });
  assert.match(loop.text, new RegExp(`it puts out \\*\\*${count}\\*\\*`));
  assert.ok(count > 0 && count < list.length, 'both outcomes of the test are shown');
});

test('teach before you ask, lesson 2: what a guess rules out, a worked search on cards, linear search, a worked count', () => {
  const L = 'binary-search';
  const split = teaches(L, 'teach-worst-case', 'best-first', [/what if the answer goes against me/]);
  const [, max, guess] = /numbers 1 to (\d+), and you guess (\d+)\./.exec(split.text).map(Number);
  assert.notEqual(max, 100, 'not the game that "best-first" asks about');
  assert.match(split.text, new RegExp(`"Lower" leaves 1 to ${guess - 1}: \\*\\*${guess - 1} numbers\\*\\*`));
  assert.match(split.text, new RegExp(`"Higher" leaves ${guess + 1} to ${max}: \\*\\*${max - guess} numbers\\*\\*`));
  assert.match(split.text, new RegExp(`With bad luck, ${Math.max(guess - 1, max - guess)} numbers are still alive`));
  assert.deepEqual(ints(split.figure.alt), [1, max, guess, guess - 1, max - guess]);
  assert.ok(at(L, 'best-first') < at(L, 'halving') && at(L, 'halving') < at(L, 'beat-the-cheat'), 'explore, find the middle, name the rule, then use it');

  // the worked search: the cards already turned are the ones a real binary search turns, and one card is left
  const row = teaches(L, 'teach-sorted-row', 'cards-sorted', [/\*\*sorted\*\*/, /Flip the middle card, card 4/, /ruled out without a look/]);
  const w = row.figure;
  assert.equal(w.type, 'card-row');
  assert.ok(w.values.length === 7 && w.values.every((v, i) => i === 0 || w.values[i - 1] < v) && w.values.includes(w.target));
  const turned = [];
  let lo = 0;
  let hi = 6;
  for (;;) {
    const mid = (lo + hi) / 2;
    if (w.values[mid] === w.target) break;
    turned.push(mid);
    if (w.values[mid] < w.target) lo = mid + 1; else hi = mid - 1;
  }
  assert.deepEqual(w.flipped, turned);
  assert.equal(lo, hi, 'a single card is left for the learner to turn');
  assert.match(row.text, new RegExp(`Find \\*\\*${w.target}\\*\\*`));
  assert.match(row.text, new RegExp(`card 4\\. It shows ${w.values[3]}: too low`));
  assert.match(row.text, new RegExp(`card ${turned[1] + 1}\\. It shows ${w.values[turned[1]]}: too ${w.values[turned[1]] < w.target ? 'low' : 'high'}`));
  assert.match(row.text, new RegExp(`Only card ${lo + 1} is left[\\s\\S]*\\*\\*Flip card ${lo + 1}\\*\\*`));
  assert.ok(at(L, 'teach-sorted-row') < at(L, 'next-check'));

  // linear search and "sorted only" are named after the shuffled row, before the questions that need them
  teaches(L, 'teach-linear', 'where-it-works', [/\*\*linear search\*\*/, /only works on \*\*sorted\*\* data/, /7 flips for 7 cards/]);
  assert.equal(at(L, 'teach-linear'), at(L, 'cards-shuffled') + 1, 'straight after the exploration it explains');
  assert.doesNotMatch(raw(L, 'cards-shuffled').explain, /linear search/, 'and not in that exploration\'s explanation any more');
  for (const item of raw(L, 'where-it-works').items) assert.ok(!raw(L, 'teach-linear').text.includes(item.text), `"${item.text}" is a new case, not one read off the screen`);

  // the worked count, for a size the generated question cannot ask about; sorted lists have been met by then
  const count = teaches(L, 'teach-count', 'count-guesses', [/keep halving until 1 is left/, /round down/, /one check for each/]);
  assert.ok(at(L, 'cards-sorted') < at(L, 'count-guesses') && at(L, 'teach-count') < at(L, 'million'));
  const chain = ints(/\*\*(\d+(?: → \d+)+)\*\*/.exec(count.text)[1]);
  chain.forEach((v, i) => { if (i) assert.equal(v, Math.floor(chain[i - 1] / 2)); });
  assert.equal(chain[chain.length - 1], 1);
  assert.equal(chain.length, binarySearchWorst(chain[0]));
  assert.match(count.text, new RegExp(`Six piles, so ${chain.length} checks are always enough`));
  assert.equal(chain.length, 6);
  assert.equal(binarySearchWorst(2 * chain[0]), chain.length + 1, 'twice as long: one more check');
  assert.match(count.text, new RegExp(`${2 * chain[0]} items, needs just one more check`));
  for (const step of variants(L, 'count-guesses')) assert.ok(!step.text.includes(`**1 to ${chain[0]}**`) && !step.text.includes(`**${chain[0]} names**`));
  assert.match(fixed(L, 'million').text, /1,000 names need 10\./);
});

test('teach before you ask, lesson 3: one pass shown, the count worked, the fourfold rule named', () => {
  const L = 'sorting';
  const pass = teaches(L, 'teach-pass', 'bubble', [/\*\*neighbours\*\*/, /\*\*swap\*\*/, /\*\*leave\*\*/, /\*\*pass\*\*/, /\*\*bubble sort\*\*/, /one pair shorter/]);
  assert.ok(at(L, 'teach-pass') < at(L, 'one-pass'));
  // the stepped picture is a real pass
  const start = ints(/over the row ([\d, ]+)\./.exec(pass.figure.alt)[1]);
  assert.match(pass.text, new RegExp(`one pass over ${start.join(', ')}\\.`));
  assert.equal(start.length, 4, 'four cards: the generated one-pass rows have five');
  const now = start.slice();
  const told = [...pass.figure.alt.matchAll(/(\d+) and (\d+): (swap|leave), giving ([\d, ]+)\./g)];
  assert.equal(told.length, start.length - 1);
  told.forEach((m, i) => {
    assert.deepEqual([now[i], now[i + 1]], [Number(m[1]), Number(m[2])]);
    assert.equal(m[3] === 'swap', now[i] > now[i + 1]);
    if (now[i] > now[i + 1]) { const t = now[i]; now[i] = now[i + 1]; now[i + 1] = t; }
    assert.deepEqual(ints(m[4]), now);
  });
  assert.deepEqual(now, bubbleSort(start).passes[0]);
  assert.equal(now[now.length - 1], Math.max(...start));
  assert.ok(!isSorted(now), '"the rest is not in order yet"');
  assert.ok(told.some((m) => m[3] === 'swap') && told.some((m) => m[3] === 'leave'), 'both verdicts are shown');
  for (const m of told) assert.ok(pass.figure.content.includes(`${m[1]} and ${m[2]}: ${m[3]}`), 'and written into the picture');
  assert.match(pass.text, new RegExp(`The biggest number, ${Math.max(...start)}, is carried along to the end`));

  // the count is worked for 5 bars (asserted in the lesson-3 tests above); the generated question asks about 6 to 10
  teaches(L, 'teach-count', 'count', [/one comparison shorter than the one before/, /multiply the number of bars by one less, then halve/]);
  assert.ok(at(L, 'bubble') < at(L, 'teach-count'));
  assert.doesNotMatch(raw(L, 'bubble').explain, /4 on the first pass/);

  // twice the row, four times the work: named straight after the machine was watched, with a worked example
  const fourfold = teaches(L, 'teach-fourfold', 'double', [/\*\*twice as long\*\*/, /\*\*four times\*\*/, /twice as many passes, and each pass is about twice as long/, /:::example/]);
  assert.equal(at(L, 'teach-fourfold'), at(L, 'watch') + 1);
  assert.doesNotMatch(raw(L, 'watch').explain, /four times/);
  for (const step of variants(L, 'double')) assert.ok(!/ sort 40 numbers\./.test(step.text), 'the worked example is not a question');
  assert.ok(at(L, 'teach-fourfold') < at(L, 'summary-match') && fourfold.figure.type === 'bars');
  // the terms of the closing match were all taught: selection sort is named in the step that runs it
  assert.match(raw(L, 'selection').text, /\*\*find the smallest\*\*, put it first[\s\S]*\*\*selection sort\*\*/);
  assert.ok(at(L, 'selection') < at(L, 'summary-match'));
  assert.match(raw(L, 'recipe').text, /indented lines belong to the line above them/);
});

test('teach before you ask, lesson 4: merging named and worked, levels counted, recursion shown on a second recipe', () => {
  const L = 'divide-and-conquer';
  const merge = teaches(L, 'teach-merge', 'merge-next', [/\*\*merging\*\*/, /\*\*front\s+cards\*\*/, /which front card is smaller/, /the last card never needs one/]);
  assert.equal(at(L, 'teach-merge'), at(L, 'merge-two') + 1);
  assert.ok(at(L, 'teach-merge') < at(L, 'merge-count'));
  assert.doesNotMatch(raw(L, 'merge-two').explain, /merging/);
  // its picture is the worked merge after two comparisons
  const m = /Pile A still holds ([\d, ]+), with (\d+) at the front\. Pile B still holds ([\d, ]+), with (\d+) at the front\. Merged so far: ([\d, ]+)\./.exec(merge.figure.alt);
  const [, demoA, demoB] = /merge of ([\d, ]+) with ([\d, ]+), step by step/.exec(merge.text);
  const whole = mergePiles(ints(demoA), ints(demoB)).out;
  assert.deepEqual(ints(m[5]), whole.slice(0, 2));
  assert.deepEqual([...ints(m[1]), ...ints(m[3])].sort((a, b) => a - b), whole.slice(2));
  assert.match(merge.figure.caption, new RegExp(`front cards are ${m[2]} and ${m[4]}, so ${Math.min(m[2], m[4])} goes next`));
  assert.equal(Math.min(m[2], m[4]), whole[2]);
  // different data: the generated questions never merge piles this small
  for (const step of variants(L, 'merge-count')) {
    const sizes = /one holds \*\*(\d+) cards\*\*, the other \*\*(\d+)\*\*/.exec(step.text).slice(1).map(Number);
    assert.ok(sizes[0] >= 4 && sizes[1] >= 4);
  }
  assert.ok(ints(demoA).length < 3 && ints(demoB).length <= 3);

  // the three parts are named where the idea is taught, before they are matched
  teaches(L, 'idea', 'three-parts', [/\(\*\*divide\*\*\)/, /\(\*\*conquer\*\*\)/, /\(\*\*combine\*\*\)/, /\*\*divide and conquer\*\*/, /\*\*merge sort\*\*/]);
  assert.ok(at(L, 'idea') < at(L, 'merge-sort'));

  // levels: counted for the 8 cards just sorted (asserted above); the generated questions start at 16
  teaches(L, 'teach-levels', 'levels', [/levels\*\* of merging/, /every card moved\s+down exactly once/, /doublings/]);
  assert.equal(at(L, 'teach-levels'), at(L, 'merge-sort') + 1);
  assert.ok(at(L, 'teach-levels') < at(L, 'work') && at(L, 'teach-levels') < at(L, 'million'));

  // recursion: named and shown on binary search, before merge sort has to be assembled as a recipe that uses itself
  const rec = teaches(L, 'teach-recursion', 'recursion', [/\*\*recursive\*\*/, /\*\*easy case\*\*/, /does not go round in circles/]);
  assert.ok(at(L, 'teach-recursion') < at(L, 'three-parts'), '"easy case" is explained before it is matched');
  const code = fenced(rec.text);
  assert.equal(code.length, 5);
  assert.match(code[0], /^to find a name in a sorted list:$/);
  assert.match(code[code.length - 1], /^\s+find the name in that half$/, 'the last line uses the recipe itself');
  assert.match(code[2], /^\s+if it is the one: done$/, 'the third line is the easy case, as the text says');
  assert.match(rec.text, /Its last line is the whole recipe again[\s\S]*Here that is the third line/);
  assert.notDeepEqual(code, raw(L, 'recursion').items);
  assert.doesNotMatch(raw(L, 'recursion').explain, /is called \*\*recursive\*\*/);
  // log2 is put into words where it first appears
  assert.match(raw(L, 'both-halves').explain, /written \$\\log_2 n\$: how many times \$n\$ can be halved before 1 is left/);
});

test('teach before you ask, lesson 5: the four growth laws, the labels, a worked scaling, and the evidence in the prompts', () => {
  const L = 'big-o';
  const growths = teaches(L, 'teach-growths', 'race', [/number of items \$n\$/, /\*\*Binary search\*\*/, /\*\*Finding the largest number\*\*/, /\*\*Merge sort\*\*/, /\*\*Bubble sort\*\*/, /about half of \$n\^2\$/]);
  assert.equal(at(L, 'race'), at(L, 'teach-growths') + 1, 'the race is the first graded step, and the screen is right before it');
  const cell = (label) => growths.text.split('\n').find((l) => l.trim().startsWith(`| $${label}$ |`)).split('|').slice(2, 4).map((c) => c.trim());
  const n = int(/For \$n = (\d+)\$/.exec(growths.text)[1]);
  assert.equal(n, 8);
  assert.deepEqual(cell(String.raw`\log_2 n`), ['halvings of $n$ until 1 is left', String(Math.log2(n))]);
  assert.deepEqual(cell('n'), ['one step per item', String(n)]);
  assert.deepEqual(cell(String.raw`n \log_2 n`), [String.raw`$n$ times $\log_2 n$`, String(n * Math.log2(n))]);
  assert.deepEqual(cell('n^2'), ['$n$ times $n$', String(n * n)]);
  assert.deepEqual(growths.figure.data.map((d) => d.value), [Math.log2(n), n, n * Math.log2(n), n * n]);
  let halvings = 0;
  for (let k = n; k > 1; k = Math.floor(k / 2)) halvings++;
  assert.equal(halvings, 3);
  assert.match(growths.text, /8 \\to 4 \\to 2 \\to 1\$ is 3 halvings/);
  assert.equal(mergeSort(ascending(n).reverse()).moves, n * Math.log2(n), 'merge sort on 8 cards: 24 moves');
  assert.ok(Math.abs(bubbleSort(ascending(n)).comparisons / (n * n) - 0.5) < 0.1, 'bubble sort: about half of n squared');

  // 2^n and 10^30 are put into words on the screen that first shows them
  teaches(L, 'table', 'ten-times', [/\$2\^n\$, which is \$n\$ twos multiplied together/, /doubles with every extra item/, /\$10\^\{30\}\$ is a 1 followed by 30 zeros/]);
  assert.ok(at(L, 'table') < at(L, 'exponential'));
  assert.match(raw(L, 'exponential').text, /every extra switch doubles the number of combinations/);

  // every label that is matched or sorted into has a row on the notation screen above
  const notation = raw(L, 'notation');
  const labels = [...raw(L, 'match-algorithms').pairs.map((p) => p[1]), ...fixed(L, 'classify').buckets];
  assert.ok(labels.length >= 8);
  for (const label of labels) {
    assert.ok(notation.text.includes(`| ${label} |`), `${label} has a row in the table of labels`);
  }
  assert.ok(at(L, 'notation') < at(L, 'match-algorithms') && at(L, 'notation') < at(L, 'classify') && at(L, 'teach-growths') < at(L, 'notation'));

  // the worked scaling: its numbers follow from the law, and the generated question cannot ask the same thing
  const scale = teaches(L, 'teach-scale', 'scale-up', [/:::example/, /how many times bigger is the input/, /every doubling of the input adds just one step/]);
  assert.ok(at(L, 'teach-scale') < at(L, 'doubling') && at(L, 'teach-scale') < at(L, 'billion'));
  const s = /takes \*\*(\d+) seconds\*\* on ([\d,]+) items\. How long on ([\d,]+) items\? The input is (\d+) times as big\./.exec(scale.text);
  const [t, base, bigger, k] = [Number(s[1]), int(s[2]), int(s[3]), Number(s[4])];
  assert.equal(bigger / base, k);
  assert.match(scale.text, new RegExp(`\\$O\\(n\\)\\$: ${k} times the work\\. \\$${t} \\\\times ${k} = ${t * k}\\$ seconds`));
  assert.match(scale.text, new RegExp(`\\$O\\(n\\^2\\)\\$: \\$${k} \\\\times ${k} = ${k * k}\\$ times the work\\. \\$${t} \\\\times ${k * k} = ${t * k * k}\\$ seconds`));
  for (const step of variants(L, 'scale-up', 300)) {
    const q = /On ([\d,]+) items it takes \*\*(\d+) /.exec(step.text);
    assert.ok(int(q[1]) !== base && Number(q[2]) !== t, 'different numbers from the worked example');
  }

  // a billion: the two earlier counts are in the prompt, and they are right
  assert.match(fixed(L, 'billion').text, /A thousand entries need 10 steps, and a million need 20\./);
  assert.deepEqual([binarySearchWorstBig(1e3), binarySearchWorstBig(1e6)], [10, 20]);
  assert.equal(24 * 3600, 86400);
  assert.match(fixed(L, 'exponential').hints[1], /a day has only 86,400/);
});

test('teach before you ask, lesson 6: the words for graphs, layers finished in order, a worked queue, what BFS measures', () => {
  const L = 'graphs-bfs';
  const words = teaches(L, 'teach-graph', 'layer-one', [/\*\*graph\*\*/, /\*\*nodes\*\*/, /\*\*edges\*\*/, /\*\*neighbours\*\*/, /\*\*route\*\*/, /every edge\s+on the way counts as one \*\*step\*\*/]);
  assert.equal(at(L, 'teach-graph'), at(L, 'hook') + 1);
  assert.doesNotMatch(raw(L, 'hook').explain, /\*\*nodes\*\*/);
  assert.match(words.figure.alt, /Edges join P to Q, Q to R and Q to S/);
  assert.match(words.text, /P and\s+R are not neighbours\. The shortest route between them is P → Q → R: two edges, so two steps/);
  assert.equal(flood({ nodes: { P: 0, Q: 0, R: 0, S: 0 }, edges: ['P-Q', 'Q-R', 'Q-S'] }, 'P').dist.R, 2);

  teaches(L, 'name-it', 'why-shortest', [/\*\*breadth-first search\*\*/, /Each layer is finished before the next one begins/, /\*\*queue\*\*, a waiting line/]);
  assert.ok(at(L, 'layer-two') < at(L, 'name-it') && at(L, 'name-it') < at(L, 'run-bfs') && at(L, 'name-it') < at(L, 'distance'));

  // the worked queue: a graph of its own, and every row is what a real queue does
  const queue = teaches(L, 'teach-queue', 'queue-trace', [/\*\*first in, first out\*\*/, /takes the node at the \*front\*/, /at the \*back\*/]);
  assert.equal(at(L, 'queue-trace'), at(L, 'teach-queue') + 1);
  assert.ok(at(L, 'teach-queue') < at(L, 'recipe'));
  const graph = { nodes: queue.figure.nodes, edges: queue.figure.edges };
  const start = queue.figure.start;
  for (const other of Object.values(H.GRAPHS)) assert.notDeepEqual(graph.edges, other.edges, 'not one of the graphs the generated questions use');
  assert.ok(Object.keys(graph.nodes).every((v) => !'ABCDEFGHI'.includes(v)), 'and not the letters of the question that follows');
  const { dist, near, rings } = flood(graph, start);
  assert.equal(Object.keys(dist).length, Object.keys(graph.nodes).length, 'connected');
  const rows = [...queue.text.matchAll(/^\s*\|\s*(start|\w)\s*\|\s*([\w, ]+?)\s*\|\s*([\w, ]+?)\s*\|\s*$/gm)].map((r) => [r[1], r[2].split(', '), r[3].split(', ')]);
  assert.equal(rows.length, 4);
  assert.deepEqual(rows[0], ['start', [start], [start]]);
  const found = new Set([start]);
  const line = [start];
  for (const [explored, fresh, after] of rows.slice(1)) {
    assert.equal(line.shift(), explored, 'the node explored is the one at the front');
    const news = [...near[explored]].sort().filter((v) => !found.has(v));
    for (const v of news) { found.add(v); line.push(v); }
    assert.deepEqual(fresh, news);
    assert.deepEqual(after, line);
  }
  const third = rows[3][0];
  const again = [...near[third]].find((v) => rows[2][1].includes(v));
  assert.ok(again, 'the third node explored meets a node that is already in the queue');
  assert.match(queue.text, new RegExp(`${third} was found before ${rows[2][1].join(' and ')}, so it is explored before them`));
  assert.match(queue.text, new RegExp(`when ${third} is explored, ${again} has already been found`));
  assert.ok(dist[third] < dist[rows[2][1][0]], 'an earlier layer really is explored first');
  assert.match(queue.figure.alt, new RegExp(`${rings[1].join(' and ')} are 1 step away, and ${rings[2].slice(0, -1).join(', ')} and ${rings[2][rings[2].length - 1]} are 2 steps away`));
  assert.match(raw(L, 'recipe').text, /"while" repeats its indented lines for as long as its test is true/);

  // what BFS measures is stated on a screen before the question about its uses, with other examples than the ones asked
  const fewest = teaches(L, 'teach-fewest', 'uses', [/\*\*fewest edges\*\*/, /only when every edge counts the same/, /different lengths or costs/, /\*\*Dijkstra's algorithm\*\*/]);
  assert.equal(at(L, 'teach-fewest'), at(L, 'weights') + 1);
  assert.doesNotMatch(raw(L, 'weights').explain, /Dijkstra/);
  assert.deepEqual(ints(fewest.figure.alt.replace(/Towns A and B/, '')), [12, 3, 4]);
  assert.match(fewest.figure.caption, /the single road, 12 km\. Shortest distance: through C, 7 km/);
  for (const option of fixed(L, 'uses').options) {
    for (const word of ['click', 'introduction', 'stop', 'speed limit', 'flight']) {
      if (option.text.includes(word)) assert.ok(!fewest.text.includes(word), `"${word}" is a new case, not one read off the screen`);
    }
  }
});
