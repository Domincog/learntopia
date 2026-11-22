/**
 * Logic & Deduction course: brute-force checks that every puzzle has exactly
 * the answer the lesson claims, and that every generated variant is sound.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng } from '../src/core/rng.js';
import * as H from '../content/courses/logic/helpers.js';
import { evaluate, truthTable } from '../src/widgets/gates.js';
import { analyse, winningMoves } from '../src/widgets/nim-game.js';
import course from '../content/courses/logic/course.js';

const lesson = async (id) => (await import(`../content/courses/logic/lessons/${id}.js`)).default;
const stepOf = (les, id) => les.steps.find((s) => s.id === id);
const SEEDS = 300;

/* ------------------------------------------------------------ structure */

test('every lesson has 12–18 steps, 2–4 review steps and a hands-on step', async () => {
  for (const chapter of course.chapters) {
    for (const meta of chapter.lessons) {
      const les = await lesson(meta.id);
      assert.equal(les.id, meta.id);
      assert.ok(les.steps.length >= 12 && les.steps.length <= 18, `${meta.id}: ${les.steps.length} steps`);
      const reviews = les.steps.filter((s) => s.review).length;
      assert.ok(reviews >= 2 && reviews <= 4, `${meta.id}: ${reviews} review steps`);
      assert.ok(les.steps.some((s) => s.type === 'interact'), `${meta.id}: no interact step`);
      assert.ok(les.recap.length >= 3 && les.recap.length <= 4, `${meta.id}: recap`);
    }
  }
});

/* ---------------------------------------------------------- logic grids */

test('grid puzzles have exactly one solution', () => {
  assert.deepEqual(H.solutionsOf(H.PETS), [[1, 2, 0]]);   // Ana–Dog, Ben–Fish, Cy–Cat
  assert.deepEqual(H.solutionsOf(H.BAND), [[1, 0, 2]]);   // Dev–Flute, Eva–Drums, Finn–Piano
  assert.deepEqual(H.solutionsOf(H.RACE), [[1, 3, 0, 2]]); // Ali 2nd, Bea 4th, Cal 1st, Dee 3rd
});

test('every clue of every grid puzzle is needed', () => {
  for (const puzzle of [H.PETS, H.BAND, H.RACE]) {
    puzzle.clues.forEach((_, i) => {
      const without = { ...puzzle, clues: puzzle.clues.filter((__, j) => j !== i) };
      assert.ok(H.solutionsOf(without).length > 1, `clue ${i + 1} is redundant`);
    });
  }
});

test('gridCheck accepts the solution and explains a tick that breaks a clue', () => {
  const check = H.gridCheck(H.RACE);
  assert.equal(check({ solved: true, ticks: [1, 3, 0, 2], wrong: [], badCrosses: [] }), true);
  const msg = check({ solved: false, ticks: [0, null, null, null], wrong: [0], badCrosses: [] }); // Ali first
  assert.match(msg, /clue 1/);
  // Bea 2nd breaks no single clue, but it forces Dee 1st, Ali 3rd, Cal 4th: a dead end
  const indirect = check({ solved: false, ticks: [null, 1, null, null], wrong: [1], badCrosses: [] });
  assert.match(indirect, /Bea’s row cannot be right/);
  assert.match(check({ solved: false, ticks: [null, null, null, null], wrong: [], badCrosses: [[1, 3]] }), /no clue behind it/);
  assert.match(check({ solved: false, ticks: [1, 3, null, null], wrong: [], badCrosses: [] }), /2 rows still need/);
});

test('generated mini puzzles are always uniquely solvable, with the stated answer', () => {
  const seen = new Set();
  for (let seed = 1; seed <= SEEDS; seed++) {
    const p = H.miniPuzzle(makeRng(seed));
    const sols = H.solutionsOf(p.puzzle);
    assert.equal(sols.length, 1);
    assert.equal(sols[0][p.answerRow], p.askCol);
    assert.equal(p.puzzle.rows[p.answerRow], p.answer);
    assert.ok(p.names.includes(p.answer));
    assert.equal(p.clues.length, 3);
    seen.add(p.clues.join('|') + p.question);
  }
  assert.ok(seen.size > 50);
});

test('"which square can you tick" always has exactly one forced square, the marked answer', async () => {
  const step = stepOf(await lesson('deduction-warmup'), 'next-tick');
  for (let seed = 1; seed <= SEEDS; seed++) {
    const made = step.gen(makeRng(seed));
    const { rows, cols, marks } = made.figure;
    const crossed = (r, c) => marks[`${r},${c}`] === 'no';
    const forced = new Set();
    for (let r = 0; r < 3; r++) { const open = [0, 1, 2].filter((c) => !crossed(r, c)); if (open.length === 1) forced.add(`${rows[r]} with ${cols[open[0]]}`); }
    for (let c = 0; c < 3; c++) { const open = [0, 1, 2].filter((r) => !crossed(r, c)); if (open.length === 1) forced.add(`${rows[open[0]]} with ${cols[c]}`); }
    assert.equal(forced.size, 1);
    const right = made.options.filter((o) => o.correct);
    assert.equal(right.length, 1);
    assert.ok(forced.has(right[0].text));
    assert.equal(new Set(made.options.map((o) => o.text)).size, 4);
    assert.equal(Object.keys(marks).length, 3);
  }
});

test('"which of these can you be certain of" is right in every world the clues allow', async () => {
  const step = stepOf(await lesson('deduction-warmup'), 'sure');
  for (let seed = 1; seed <= 60; seed++) {
    const cast = H.miniCast(makeRng(seed));
    const made = step.gen(makeRng(seed));
    const people = [cast.A, cast.B, cast.C];
    const things = [cast.x, cast.y, cast.z];
    // worlds: assignments where A and B do not have x
    const worlds = H.permutations(3).filter((a) => a[0] !== 0 && a[1] !== 0);
    assert.equal(worlds.length, 2);
    for (const opt of made.options) {
      const truthIn = (a) => {
        for (let p = 0; p < 3; p++) for (let t = 0; t < 3; t++) {
          if (opt.text === cast.pos(people[p], things[t])) return a[p] === t;
          if (opt.text === cast.neg(people[p], things[t])) return a[p] !== t;
        }
        throw new Error(`cannot read option "${opt.text}"`);
      };
      assert.equal(worlds.every(truthIn), !!opt.correct, opt.text);
    }
  }
});

/* ------------------------------------------------------ knights & liars */

const kinds = (worlds) => worlds.map((k) => k.map((v) => (v ? 'K' : 'L')).join(''));

test('island puzzles have the worlds the lesson says they have', () => {
  assert.deepEqual(kinds(H.possibleWorlds(H.ISLAND_SELF)), []);          // "I am a liar" is impossible
  assert.deepEqual(kinds(H.possibleWorlds([H.ISLAND_SELF[0]])), ['L', 'K']); // "I am a knight" fits both
  assert.deepEqual(kinds(H.possibleWorlds(H.ISLAND_BOTH)), ['LK']);
  assert.deepEqual(kinds(H.possibleWorlds(H.ISLAND_THREE)), ['LKL']);
  assert.deepEqual(H.islandSolution(H.ISLAND_THREE), { types: ['liar', 'knight', 'liar'] });
});

test('two-islander statements: what follows from each', () => {
  const worlds = (claim) => kinds(H.possibleWorlds([{ name: 'A', claim }, { name: 'B' }]));
  assert.deepEqual(worlds((k) => !k[0] && !k[1]), ['LK']);            // "We are both liars"
  assert.deepEqual(worlds((k) => !k[0] || !k[1]), ['KL']);            // "At least one of us is a liar"
  assert.deepEqual(worlds((k) => k[0] === k[1]).sort(), ['KK', 'LK']); // "We are the same kind": B is a knight
  assert.deepEqual(worlds((k) => k[0] !== k[1]).sort(), ['KL', 'LL']); // "We are different kinds": B is a liar
  assert.deepEqual(worlds((k) => !k[1]).sort(), ['KL', 'LK']);         // "B is a liar": different kinds
  assert.deepEqual(worlds((k) => k[1]).sort(), ['KK', 'LL']);          // "B is a knight": same kind
});

test('the fork in the road: only the nested question works', () => {
  const says = (isKnight, truth) => (isKnight ? truth : !truth);
  const cases = [];
  for (const knight of [true, false]) for (const left of [true, false]) cases.push({ knight, left });
  const reliable = (question) => cases.every((c) => question(c) === c.left) || cases.every((c) => question(c) !== c.left);
  const direct = (c) => says(c.knight, c.left);
  assert.equal(reliable(direct), false);
  assert.equal(reliable((c) => says(c.knight, c.knight)), false);              // "Are you a knight?"
  assert.equal(reliable((c) => says(c.knight, direct(c))), true);              // "Would you say yes?"
  assert.ok(cases.every((c) => says(c.knight, direct(c)) === c.left));         // …and "yes" means left
  assert.equal(reliable((c) => says(c.knight, says(false, c.left))), false);   // "Would a liar say…?"
});

/* -------------------------------------------------------------- if-then */

test('generated selection tasks accept P and not-Q, and nothing else', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const t = H.wasonTask(makeRng(seed));
    assert.equal(t.check({ selected: t.solution.selected }), true);
    assert.deepEqual(t.solution.selected, [t.roles.indexOf('P'), t.roles.indexOf('notQ')].sort());
    for (let mask = 0; mask < 16; mask++) {
      const selected = [0, 1, 2, 3].filter((i) => mask & (1 << i));
      if (selected.join() === t.solution.selected.join()) continue;
      assert.equal(typeof t.check({ selected }), 'string');
    }
    // the cards that "break" are always not-Q cards
    t.widget.cards.forEach((card, i) => { if (card.breaks) assert.equal(t.roles[i], 'notQ'); });
  }
});

test('the street world: the contrapositive agrees with the rule in all four worlds, the converse does not', async () => {
  const les = await lesson('if-then');
  const spec = stepOf(les, 'worlds').widget;
  const status = (st, w) => (!st.if(w) ? 'untested' : st.then(w) ? 'kept' : 'broken');
  const table = [];
  for (const rain of [true, false]) for (const wet of [true, false]) table.push(spec.statements.map((st) => status(st, [rain, wet]) !== 'broken'));
  const column = (i) => table.map((row) => row[i]).join();
  assert.equal(column(0), column(3));        // rule == contrapositive
  assert.equal(column(1), column(2));        // converse == inverse
  assert.notEqual(column(0), column(1));
  const check = stepOf(les, 'worlds').check;
  const state = (w) => ({ status: spec.statements.map((st) => status(st, w)) });
  assert.equal(check(state([false, true])), true);
  for (const w of [[true, true], [true, false], [false, false]]) assert.equal(typeof check(state(w)), 'string');
});

/* ----------------------------------------------------------- and/or/not */

test('"is this statement true?" marks the right option for every form and every world', async () => {
  const step = stepOf(await lesson('and-or-not'), 'evaluate');
  const seen = new Set();
  for (let seed = 1; seed <= SEEDS; seed++) {
    const made = step.gen(makeRng(seed));
    const [, p, q] = /P is (true|false)\*\* and \*\*Q is (true|false)/.exec(made.text);
    const formula = /^> (.*)$/m.exec(made.text)[1].replace(/\*\*/g, '');
    const js = formula.replace(/\bnot\b/g, '!').replace(/\band\b/g, '&&').replace(/\bor\b/g, '||');
    const value = !!new Function('P', 'Q', `return ${js};`)(p === 'true', q === 'true');
    assert.equal(made.options.find((o) => o.correct).text, value ? 'True' : 'False', `${formula} with P=${p}, Q=${q}`);
    assert.ok(made.explain.includes(`**${value}**`));
    seen.add(formula + p + q);
  }
  assert.equal(seen.size, 32);
});

test('truth-table sizes double with each statement', async () => {
  const step = stepOf(await lesson('and-or-not'), 'rows');
  for (let seed = 1; seed <= 40; seed++) {
    const made = step.gen(makeRng(seed));
    const n = Number(/for (\d) statements need/.exec(made.text)[1]);
    assert.equal(made.answer, 2 ** n);
  }
});

/* ---------------------------------------------------------------- gates */

test('the XOR building task has exactly one solution', () => {
  const wins = [];
  for (const g1 of ['AND', 'OR']) for (const g2 of ['AND', 'OR']) for (const g3 of ['AND', 'OR']) {
    if (truthTable(H.CIRCUIT_XOR_BUILD, { g1, g2, g3 }).lamp.join('') === '0110') wins.push({ g1, g2, g3 });
  }
  assert.deepEqual(wins, [H.XOR_BUILD_SOLUTION]);
});

test('the half adder has exactly one solution, and it adds', () => {
  const wins = [];
  const options = ['AND', 'OR', 'XOR'];
  for (const gs of options) for (const gc of options) {
    const t = truthTable(H.CIRCUIT_HALF_ADDER, { gs, gc });
    if (t.sum.join('') === '0110' && t.carry.join('') === '0001') wins.push({ gs, gc });
  }
  assert.deepEqual(wins, [H.HALF_ADDER_SOLUTION]);
  for (const a of [0, 1]) for (const b of [0, 1]) {
    const sig = evaluate(H.CIRCUIT_HALF_ADDER, { A: a, B: b }, H.HALF_ADDER_SOLUTION);
    assert.equal(2 * sig.carry + sig.sum, a + b);
  }
});

test('"light the lamp" has one answer; the NAND circuit is 1110; empty slots give null', () => {
  const lit = [];
  for (let m = 0; m < 8; m++) {
    const inputs = { A: (m >> 2) & 1, B: (m >> 1) & 1, C: m & 1 };
    if (evaluate(H.CIRCUIT_LIGHT, inputs).lamp === 1) lit.push(inputs);
  }
  assert.deepEqual(lit, [{ A: 1, B: 0, C: 1 }]);
  assert.equal(truthTable(H.CIRCUIT_NAND).lamp.join(''), '1110');
  assert.equal(truthTable(H.CIRCUIT_AND_OR).andLamp.join(''), '0001');
  assert.equal(truthTable(H.CIRCUIT_AND_OR).orLamp.join(''), '0111');
  assert.equal(truthTable(H.CIRCUIT_NOT).lamp.join(''), '10');
  assert.equal(evaluate(H.CIRCUIT_XOR_BUILD, { A: 1, B: 0 }, {}).lamp, null);
});

test('tracing questions: the stated lamp matches the circuit', () => {
  for (let seed = 1; seed <= SEEDS; seed++) {
    const t = H.traceTask(makeRng(seed));
    const inputs = {};
    t.figure.inputs.forEach((inp) => { inputs[inp.id] = inp.value; });
    assert.equal(evaluate(t.figure, inputs).lamp, t.lamp);
    assert.ok(t.explain.includes(`**${t.lamp}**`));
  }
});

/* ------------------------------------------------------------------ nim */

test('take 1..k: the losing piles are exactly the multiples of k + 1', () => {
  for (let k = 1; k <= 7; k++) {
    const take = Array.from({ length: k }, (_, i) => i + 1);
    const losing = analyse(take, 60);
    for (let n = 0; n <= 60; n++) assert.equal(losing[n], n % (k + 1) === 0, `k=${k}, n=${n}`);
  }
  const losing = analyse([1, 2, 3], 20);
  assert.deepEqual(winningMoves([1, 2, 3], 15, losing), [3]);
  assert.deepEqual(winningMoves([1, 2, 3], 16, losing), []);
});

test('generated first-move questions ask for the one winning move', async () => {
  const les = await lesson('strategy-games');
  for (let seed = 1; seed <= SEEDS; seed++) {
    for (const id of ['leave-four', 'first-move', 'general']) {
      const made = stepOf(les, id).gen(makeRng(seed));
      const n = Number(/\*\*(\d+) stones\*\*/.exec(made.text)[1]);
      const range = /from 1 to (\d+)/.exec(made.text);
      const k = range ? Number(range[1]) : 3;
      const take = Array.from({ length: k }, (_, i) => i + 1);
      assert.deepEqual(winningMoves(take, n, analyse(take, n)), [made.answer], `${id}: n=${n}, k=${k}`);
      // feedback for every other legal move names a real reply
      for (const v of take) if (v !== made.answer) assert.equal(typeof made.feedback(v), 'string');
    }
  }
});

test('generated "sort the piles" questions agree with the game analysis', async () => {
  const step = stepOf(await lesson('strategy-games'), 'sort-positions');
  for (let seed = 1; seed <= SEEDS; seed++) {
    const made = step.gen(makeRng(seed));
    const range = /between 1 and (\d+)/.exec(made.text);
    const k = range ? Number(range[1]) : 2;
    const take = Array.from({ length: k }, (_, i) => i + 1);
    const losing = analyse(take, 40);
    assert.equal(made.items.length, 7);
    assert.equal(new Set(made.items.map((it) => it.text)).size, 7);
    for (const item of made.items) assert.equal(item.bucket === 1, losing[parseInt(item.text, 10)], `${item.text} (k=${k})`);
  }
});

test('the losing-positions board: only 4, 8 and 12 pass', async () => {
  const check = stepOf(await lesson('strategy-games'), 'mark-losing').check;
  assert.equal(check({ on: [3, 7, 11] }), true);
  for (let mask = 0; mask < 1 << 15; mask++) {
    if (mask === ((1 << 3) | (1 << 7) | (1 << 11))) continue;
    const on = [];
    for (let i = 0; i < 15; i++) if (mask & (1 << i)) on.push(i);
    assert.notEqual(check({ on }), true);
  }
});

/* ==========================================================================
 * Independent review: every generated step re-solved from its own resolved
 * wording. Nothing below uses helpers.js or a widget to work out an expected
 * answer: the question is parsed out of the text the learner sees and solved
 * here by brute force.
 * ========================================================================== */

const { normalizeLesson, resolveStep } = await import('../src/player/normalize.js');
const LESSONS = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) LESSONS[meta.id] = normalizeLesson(await lesson(meta.id), 'logic', meta.id);
}
const rawStep = (les, id) => {
  const step = LESSONS[les].steps.find((s) => s.id === id);
  assert.ok(step, `step ${les}/${id} exists`);
  return step;
};
const variants = (les, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(rawStep(les, id), makeRng(1000 + k * 7919), id));
const plain = (t) => String(t).replace(/\*\*/g, '').replace(/[*_]/g, '').replace(/\s+/g, ' ').trim();
const orderings = (n) => {
  const out = [];
  const go = (p, rest) => { if (!rest.length) { out.push(p); return; } rest.forEach((v, i) => go([...p, v], rest.filter((_, j) => j !== i))); };
  go([], [...Array(n).keys()]);
  return out;
};

test('review: one correct option, no duplicate options, and no "undefined" or "NaN" in any resolved step', () => {
  for (const [id, les] of Object.entries(LESSONS)) {
    for (const step of les.steps) {
      for (let k = 0; k < (step.gen ? SEEDS : 1); k++) {
        const s = resolveStep(step, makeRng(31 + k * 104729), step.id);
        const where = `${id}/${step.id} seed ${k}`;
        const blob = JSON.stringify(s, (key, v) => (typeof v === 'function' ? undefined : v));
        assert.ok(!/undefined|NaN|\[object Object\]/.test(blob), where);
        if (s.type === 'choice') assert.equal(s.options.filter((o) => o.correct).length, 1, where);
        if (s.type === 'multi') assert.ok(s.options.some((o) => o.correct), where);
        if (s.type === 'choice' || s.type === 'multi') assert.equal(new Set(s.options.map((o) => plain(o.text))).size, s.options.length, `${where}: duplicate options`);
        if (s.type === 'bucket') assert.equal(new Set(s.items.map((i) => i.text)).size, s.items.length, where);
        if (s.type === 'match') assert.equal(new Set(s.pairs.map((p) => p[1])).size, s.pairs.length, where);
      }
    }
  }
});

/* ---------------------------------------------------------------- lesson 1 */

const MINI_THEMES = [
  { pos: /^(\w+) owns the (\w+)$/, neg: /^(\w+) does not own the (\w+)$/, ask: /^Who owns the (\w+)\?$/ },
  { pos: /^(\w+) plays the (\w+)$/, neg: /^(\w+) does not play the (\w+)$/, ask: /^Who plays the (\w+)\?$/ },
  { pos: /^(\w+) ordered the (\w+)$/, neg: /^(\w+) did not order the (\w+)$/, ask: /^Who ordered the (\w+)\?$/ },
  { pos: /^(\w+) painted the (\w+)$/, neg: /^(\w+) did not paint the (\w+)$/, ask: /^Who painted the (\w+)\?$/ },
];
const readClaim = (text) => {
  const t = plain(text).replace(/\.$/, '');
  for (const th of MINI_THEMES) {
    let m = th.neg.exec(t);
    if (m) return { who: m[1], what: m[2], is: false };
    m = th.pos.exec(t);
    if (m) return { who: m[1], what: m[2], is: true };
  }
  throw new Error(`cannot read "${text}"`);
};
const readIntro = (text) => {
  const m = /(\w+), (\w+) and (\w+) each [^:]+: (?:a|the) (\w+), (?:a|the) (\w+) and (?:a|the) (\w+)\./.exec(plain(text));
  assert.ok(m, text);
  return { names: [m[1], m[2], m[3]], things: [m[4], m[5], m[6]] };
};
const worldsFor = (names, things, clues) => orderings(3).filter((a) => clues.every((c) => (things[a[names.indexOf(c.who)]] === c.what) === c.is));

test('review: the static grid puzzles, solved from my own reading of their clues', async () => {
  const les = LESSONS['deduction-warmup'];
  const mine = {
    'first-grid': [(has) => has.Ana !== 'Cat', (has) => has.Ben === 'Fish'],
    band: [(has) => has.Dev !== 'Drums', (has) => has.Finn !== 'Drums', (has) => has.Finn !== 'Flute'],
    race: [(has, place) => place.Ali !== 1 && place.Ali !== 4, (has, place) => place.Bea === place.Dee + 1, (has, place) => place.Cal < place.Ali],
  };
  for (const [id, clues] of Object.entries(mine)) {
    const step = les.steps.find((s) => s.id === id);
    const { rows, cols, solution } = step.widget;
    assert.equal(step.widget.clues.length, clues.length);
    const fits = (a, skip = -1) => {
      const has = {}; const place = {};
      rows.forEach((r, i) => { has[r] = cols[a[i]]; place[r] = a[i] + 1; });
      return clues.every((c, j) => j === skip || c(has, place));
    };
    const sols = orderings(rows.length).filter((a) => fits(a));
    assert.equal(sols.length, 1, `${id} has ${sols.length} solutions`);
    assert.deepEqual(sols[0], solution, id);
    assert.deepEqual(step.solution.ticks, solution, id);
    clues.forEach((_, k) => assert.ok(orderings(rows.length).filter((a) => fits(a, k)).length > 1, `${id}: clue ${k + 1} is not needed`));
    // the check accepts the full solution and nothing else, over every set of ticks the grid allows
    const n = rows.length;
    const states = [];
    const build = (r, ticks) => {
      if (r === n) { states.push(ticks); return; }
      build(r + 1, [...ticks, null]);
      for (let c = 0; c < n; c++) if (!ticks.includes(c)) build(r + 1, [...ticks, c]);
    };
    build(0, []);
    for (const ticks of states) {
      const wrong = [];
      ticks.forEach((c, r) => { if (c != null && c !== solution[r]) wrong.push(r); });
      const complete = ticks.every((c) => c != null);
      const res = step.check({ ticks, wrong, badCrosses: [], complete, solved: complete && !wrong.length });
      assert.equal(res === true, ticks.join() === solution.join(), `${id}: ${ticks}`);
      const blamed = /clue (\d+) can no longer be true/.exec(res === true ? '' : res);
      if (blamed) {
        const k = Number(blamed[1]) - 1;
        const stillPossible = orderings(n).some((a) => ticks.every((c, r) => c == null || a[r] === c) && (() => {
          const has = {}; const place = {};
          rows.forEach((r, i) => { has[r] = cols[a[i]]; place[r] = a[i] + 1; });
          return clues[k](has, place);
        })());
        assert.ok(!stillPossible, `${id}: clue ${k + 1} blamed although it can still hold with ticks ${ticks}`);
      }
    }
  }
});

test('review: "which square can you tick" — the options, their feedback and the explanation all follow from the crosses', () => {
  for (const s of variants('deduction-warmup', 'next-tick')) {
    const { rows, cols, marks } = s.figures[0];
    const crossed = (r, c) => marks[`${r},${c}`] === 'no';
    const name = (r, c) => `${rows[r]} with ${cols[c]}`;
    // the puzzle is one-to-one, and the wording has to say so (the column argument needs it)
    assert.match(s.text, /each person goes with a different /);
    const worlds = orderings(3).filter((a) => a.every((c, r) => !crossed(r, c)));
    const certain = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (worlds.every((a) => a[r] === c)) certain.push(name(r, c));
    assert.equal(certain.length, 1);
    assert.deepEqual(s.options.filter((o) => o.correct).map((o) => o.text), certain);
    for (const o of s.options) {
      const m = /^(\w+) with (\w+)$/.exec(o.text);
      const r = rows.indexOf(m[1]);
      const c = cols.indexOf(m[2]);
      assert.ok(!crossed(r, c), 'an option is a crossed-out square');
      if (o.correct) continue;
      if (/^That square is open/.test(o.why)) {
        assert.ok([0, 1, 2].some((cc) => cc !== c && !crossed(r, cc)) && [0, 1, 2].some((rr) => rr !== r && !crossed(rr, c)), o.why);
      } else {
        const w = /^Not that one: (\w+) has to take (\w+), so nobody else can\.$/.exec(o.why);
        assert.ok(w && certain[0] === `${w[1]} with ${w[2]}` && w[2] === m[2], o.why);
      }
    }
    const e = plain(s.explain);
    const col = /^Look down the (\w+) column: (\w+) and (\w+) are crossed out\. Somebody has to go with \1, and only (\w+) is left\.$/.exec(e);
    const row = /^Look along (\w+)’s row: (\w+) and (\w+) are crossed out\. \1 has to go with something, and only (\w+) is left\.$/.exec(e);
    assert.ok(col || row, e);
    if (col) {
      assert.ok(crossed(rows.indexOf(col[2]), cols.indexOf(col[1])) && crossed(rows.indexOf(col[3]), cols.indexOf(col[1])));
      assert.equal(`${col[4]} with ${col[1]}`, certain[0]);
    } else {
      assert.ok(crossed(rows.indexOf(row[1]), cols.indexOf(row[2])) && crossed(rows.indexOf(row[1]), cols.indexOf(row[3])));
      assert.equal(`${row[1]} with ${row[4]}`, certain[0]);
    }
  }
});

test('review: "which of these can you be certain of", read from the printed clues', () => {
  for (const s of variants('deduction-warmup', 'sure')) {
    const { names, things } = readIntro(s.text);
    const clues = s.text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- ')).map((l) => readClaim(l.slice(2)));
    assert.equal(clues.length, 2);
    const worlds = worldsFor(names, things, clues);
    assert.equal(worlds.length, 2);
    for (const o of s.options) {
      const c = readClaim(o.text);
      assert.ok(names.includes(c.who) && things.includes(c.what), o.text);
      assert.equal(worlds.every((a) => (things[a[names.indexOf(c.who)]] === c.what) === c.is), !!o.correct, o.text);
    }
  }
});

test('review: the mini puzzle has one solution given its three printed clues, and each clue is needed', () => {
  for (const s of variants('deduction-warmup', 'mini')) {
    const [intro, list, question] = s.text.split('\n\n');
    const { names, things } = readIntro(intro);
    const clues = list.split('\n').map((l) => readClaim(l.replace(/^- /, '')));
    assert.equal(clues.length, 3);
    const asked = MINI_THEMES.map((th) => th.ask.exec(plain(question))).find(Boolean)[1];
    assert.ok(things.includes(asked));
    const worlds = worldsFor(names, things, clues);
    assert.equal(worlds.length, 1);
    clues.forEach((_, k) => assert.ok(worldsFor(names, things, clues.filter((__, j) => j !== k)).length > 1, 'a clue is redundant'));
    const owner = names[worlds[0].findIndex((t) => things[t] === asked)];
    assert.deepEqual(s.options.filter((o) => o.correct).map((o) => o.text), [owner]);
    assert.deepEqual(s.options.map((o) => o.text), [...names, 'There is not enough information']);
    // every "X … the Y" pairing asserted in the explanation is true in that solution
    const has = (who) => things[worlds[0][names.indexOf(who)]];
    for (const m of s.explain.matchAll(/so it goes with (\w+)/g)) assert.ok(names.includes(m[1]));
    const first = /^The (\w+) is ruled out for both \w+ and \w+, so it goes with (\w+)\. For (\w+), [^.]*, which leaves the (\w+)\. The only thing left for (\w+) is the (\w+)\.$/.exec(s.explain);
    const second = /^For (\w+), [^.]*, so \1 goes with the (\w+)\. The (\w+) is ruled out for \w+ and \w+, so it goes with (\w+)\. That leaves the (\w+) for (\w+)\.$/.exec(s.explain);
    assert.ok(first || second, s.explain);
    const pairs = first ? [[first[2], first[1]], [first[3], first[4]], [first[5], first[6]]] : [[second[1], second[2]], [second[4], second[3]], [second[6], second[5]]];
    for (const [who, what] of pairs) assert.equal(has(who), what, s.explain);
  }
});

test('review: the key in three boxes — certain, possible, impossible by listing the worlds', () => {
  const s = resolveStep(rawStep('deduction-warmup', 'key-boxes'), makeRng(1), 'key-boxes');
  const worlds = ['green', 'blue']; // exactly one box, and not the red one
  const says = {
    'It is in the red box': (k) => k === 'red',
    'It is in the green box': (k) => k === 'green',
    'It is in green or blue': (k) => k === 'green' || k === 'blue',
    'It is not in the blue box': (k) => k !== 'blue',
    'It is in red or green': (k) => k === 'red' || k === 'green',
    'It is in none of them': () => false,
  };
  assert.deepEqual(s.buckets, ['Certain', 'Possible', 'Impossible']);
  for (const it of s.items) {
    const t = worlds.map(says[it.text]);
    assert.equal(it.bucket, t.every(Boolean) ? 0 : t.some(Boolean) ? 1 : 2, it.text);
  }
});

/* ---------------------------------------------------------------- lesson 2 */

const KL_WORLDS = [[true, true], [true, false], [false, true], [false, false]]; // [speaker is a knight, the other is a knight]
const fitting = (claim) => KL_WORLDS.filter(([a, b]) => claim(a, b) === a);

test('review: "X points at Y" — what is certain, worked out from the quoted sentence', () => {
  for (const s of variants('truth-tellers-liars', 'accuse')) {
    const m = /(\w+) points at (\w+) and says: “(\w+) is a (liar|knight)\.”/.exec(plain(s.text));
    assert.ok(m && m[3] === m[2], s.text);
    const [, A, B, , kind] = m;
    const worlds = fitting((a, b) => (kind === 'knight' ? b : !b));
    const says = {
      'They are the same kind: two knights or two liars': ([a, b]) => a === b,
      'They are different kinds: one knight and one liar': ([a, b]) => a !== b,
      [`${A} is a knight`]: ([a]) => a,
      [`${B} is a liar`]: ([, b]) => !b,
      [`${B} is a knight`]: ([, b]) => b,
    };
    for (const o of s.options) {
      assert.ok(says[o.text], o.text);
      assert.equal(worlds.every(says[o.text]), !!o.correct, `${plain(s.text)} -> ${o.text}`);
    }
    assert.ok(s.explain.includes(kind === 'liar' ? '**different**' : '**the same**'));
  }
});

test('review: one islander speaks for two — the conclusion, worked out from the quoted sentence', () => {
  const claims = {
    'We are both liars.': (a, b) => !a && !b,
    'At least one of us is a liar.': (a, b) => !a || !b,
    'We are the same kind.': (a, b) => a === b,
    'We are different kinds.': (a, b) => a !== b,
  };
  const seen = new Set();
  for (const s of variants('truth-tellers-liars', 'pairs')) {
    const m = /(\w+) and (\w+) are standing together\. (\w+) says: “([^”]+)” (\w+) says nothing\./.exec(plain(s.text));
    assert.ok(m && m[3] === m[1] && m[5] === m[2], s.text);
    const at = { [m[1]]: 0, [m[2]]: 1 };
    assert.ok(claims[m[4]], m[4]);
    seen.add(m[4]);
    const worlds = fitting(claims[m[4]]);
    const holds = (text) => {
      let o = /^(\w+) is a (liar|knight) and (\w+) is a (liar|knight)$/.exec(text);
      if (o) return worlds.every((w) => w[at[o[1]]] === (o[2] === 'knight') && w[at[o[3]]] === (o[4] === 'knight'));
      o = /^(\w+) is a (liar|knight), but (\w+) could be either$/.exec(text);
      assert.ok(o, text);
      return worlds.every((w) => w[at[o[1]]] === (o[2] === 'knight')) && new Set(worlds.map((w) => w[at[o[3]]])).size === 2;
    };
    assert.deepEqual(s.options.map((o) => holds(o.text)), s.options.map((o) => !!o.correct), m[4]);
  }
  assert.equal(seen.size, 4);
});

test('review: the sentence nobody can say, and the fork questions, by listing every case', () => {
  const imp = resolveStep(rawStep('truth-tellers-liars', 'impossible'), makeRng(1), 'impossible');
  const says = {
    '“I am a liar.”': (a) => !a,
    '“I am a knight.”': (a) => a,
    '“My neighbour is a liar.”': (a, b) => !b,
    '“My neighbour and I are both liars.”': (a, b) => !a && !b,
  };
  for (const o of imp.options) assert.equal(fitting(says[o.text]).length === 0, !!o.correct, o.text);
  const hear = (knight, truth) => (knight ? truth : !truth);
  const questions = {
    '“Does the left road lead to the village?”': (k, left) => hear(k, left),
    '“Are you a knight?”': (k) => hear(k, k),
    '“If I asked you whether the left road leads to the village, would you say yes?”': (k, left) => hear(k, hear(k, left)),
    '“Would a liar say that the left road leads to the village?”': (k, left) => hear(k, hear(false, left)),
  };
  const fork = resolveStep(rawStep('truth-tellers-liars', 'fork'), makeRng(1), 'fork');
  for (const o of fork.options) {
    const yes = new Set();
    const no = new Set();
    for (const k of [true, false]) for (const left of [true, false]) (questions[o.text](k, left) ? yes : no).add(left);
    assert.equal(yes.size === 1 && no.size === 1, !!o.correct, o.text);
  }
  const lie = resolveStep(rawStep('truth-tellers-liars', 'double-lie'), makeRng(1), 'double-lie');
  const direct = hear(false, true);
  assert.deepEqual(lie.blanks.map((b) => b.answer), [direct, direct, hear(false, direct)].map((v) => (v ? 'yes' : 'no')));
});

/* ---------------------------------------------------------------- lesson 3 */

test('review: "which of these would break the promise" — if-part and then-part read from each option', () => {
  const read = {
    'It rains, and the match is cancelled': [1, 1], 'It rains, and the match is played': [1, 0],
    'It stays dry, and the match is cancelled': [0, 1], 'It stays dry, and the match is played': [0, 0],
    'You tidy your room and get an ice cream': [1, 1], 'You tidy your room and get no ice cream': [1, 0],
    'You leave the room messy and get an ice cream anyway': [0, 1], 'You leave the room messy and get no ice cream': [0, 0],
    'The alarm rings, and everybody leaves': [1, 1], 'The alarm rings, and somebody stays inside': [1, 0],
    'The alarm is silent, and everybody leaves': [0, 1], 'The alarm is silent, and somebody stays inside': [0, 0],
    'A guest orders the set menu and gets a free dessert': [1, 1], 'A guest orders the set menu and gets no free dessert': [1, 0],
    'A guest orders only a salad and gets a free dessert': [0, 1], 'A guest orders only a salad and gets no free dessert': [0, 0],
  };
  for (const s of variants('if-then', 'breaks')) {
    const cases = new Set();
    for (const o of s.options) {
      assert.ok(read[o.text], o.text);
      cases.add(read[o.text].join(''));
      assert.equal(read[o.text].join('') === '10', !!o.correct, o.text);
    }
    assert.equal(cases.size, 4);
  }
});

test('review: only the contrapositive says the same thing; converse and inverse are named correctly', () => {
  const PHRASES = [
    [/is a square$/, 'P', true], [/is not a square$/, 'P', false], [/has four sides$/, 'Q', true], [/does not have four sides$/, 'Q', false],
    [/you are in Tokyo$/, 'P', true], [/you are not in Tokyo$/, 'P', false], [/you are in Japan$/, 'Q', true], [/you are not in Japan$/, 'Q', false],
    [/is divisible by 10$/, 'P', true], [/is not divisible by 10$/, 'P', false], [/is even$/, 'Q', true], [/is odd$/, 'Q', false],
    [/is a whale$/, 'P', true], [/is not a whale$/, 'P', false], [/is a mammal$/, 'Q', true], [/is not a mammal$/, 'Q', false],
  ];
  const literal = (phrase) => { const hit = PHRASES.filter(([re]) => re.test(phrase)); assert.equal(hit.length, 1, phrase); return `${hit[0][2] ? '' : 'not '}${hit[0][1]}`; };
  const parse = (sentence) => {
    const m = /^If (.+), then (.+)\.$/.exec(sentence);
    assert.ok(m, sentence);
    const shape = `${literal(m[1])} -> ${literal(m[2])}`;
    const val = (lit, P, Q) => (lit.startsWith('not ') ? !(lit.endsWith('P') ? P : Q) : (lit.endsWith('P') ? P : Q));
    const [a, c] = shape.split(' -> ');
    return { shape, column: [[true, true], [true, false], [false, true], [false, false]].map(([P, Q]) => !val(a, P, Q) || val(c, P, Q)).join() };
  };
  for (const s of variants('if-then', 'contra')) {
    const rule = parse(/“([^”]+)”/.exec(s.text)[1]);
    assert.equal(rule.shape, 'P -> Q');
    for (const o of s.options) {
      const f = parse(o.text);
      assert.equal(f.column === rule.column, !!o.correct, o.text);
      if (o.correct) assert.equal(f.shape, 'not Q -> not P');
      else assert.equal(f.shape, /the converse/.test(o.why) ? 'Q -> P' : 'not P -> not Q', o.text);
    }
  }
});

test('review: generated card tasks — roles read from the faces; the check accepts P with not-Q only; "breaks" is right', () => {
  const reader = (rule) => {
    if (/vowel/.test(rule)) return (f) => { const t = typeof f === 'object' ? f.text : f; return /^[AEIOU]$/.test(t) ? 'P' : /^[A-Z]$/.test(t) ? 'notP' : Number(t) % 2 === 0 ? 'Q' : 'notQ'; };
    if (/abroad/.test(rule)) return (f) => ({ Abroad: 'P', Local: 'notP', Form: 'Q', 'No form': 'notQ' }[f.text]);
    if (/big slide/.test(rule)) return (f) => (f.sub === 'age' ? (Number(f.text) >= 6 ? 'Q' : 'notQ') : { Slide: 'P', Sandpit: 'notP' }[f.text]);
    if (/top shelf/.test(rule)) return (f) => (f.sub === 'shelf' ? { Top: 'P', Bottom: 'notP' }[f.text] : { Red: 'Q', Blue: 'notQ' }[f.text]);
    throw new Error(`unknown rule: ${rule}`);
  };
  const rules = new Set();
  for (const s of variants('if-then', 'cards-again')) {
    const { rule, cards } = s.widget;
    rules.add(rule);
    const role = reader(rule);
    const fronts = cards.map((c) => role(c.front));
    assert.deepEqual([...fronts].sort(), ['P', 'Q', 'notP', 'notQ']);
    const need = [fronts.indexOf('P'), fronts.indexOf('notQ')].sort((a, b) => a - b);
    assert.deepEqual(s.solution.selected, need);
    for (let mask = 0; mask < 16; mask++) {
      const selected = [0, 1, 2, 3].filter((i) => mask & (1 << i));
      const res = s.check({ selected, count: selected.length });
      assert.equal(res === true, selected.join() === need.join());
      if (res !== true) assert.ok(typeof res === 'string' && !/undefined|\[object/.test(res), String(res));
    }
    cards.forEach((c, i) => {
      const back = role(c.back);
      assert.ok(back && /P/.test(back) !== /P/.test(fronts[i]), `card ${i}: one side for each half of the rule`);
      const breaks = [fronts[i], back].includes('P') && [fronts[i], back].includes('notQ');
      assert.equal(!!c.breaks, breaks, `card ${i}`);
      assert.equal(/rule is broken/.test(c.note), breaks, c.note);
    });
  }
  assert.equal(rules.size, 4);
});

test('review: the two fixed card tasks, the matching step, "only if" and the twin, by truth table', () => {
  const les = LESSONS['if-then'];
  const letter = (f) => (/^[AEIOU]$/.test(f) ? 'P' : /^[A-Z]$/.test(f) ? 'notP' : Number(f) % 2 === 0 ? 'Q' : 'notQ');
  const wason = les.steps.find((s) => s.id === 'wason');
  const party = les.steps.find((s) => s.id === 'party');
  const partyRole = (f) => (f.sub === 'drinking' ? (f.text === 'Beer' ? 'P' : 'notP') : Number(f.text) >= 18 ? 'Q' : 'notQ');
  for (const [step, role] of [[wason, letter], [party, partyRole]]) {
    const fronts = step.widget.cards.map((c) => role(c.front));
    const need = [fronts.indexOf('P'), fronts.indexOf('notQ')].sort((a, b) => a - b);
    assert.deepEqual(step.solution.selected, need);
    for (let mask = 0; mask < 16; mask++) {
      const selected = [0, 1, 2, 3].filter((i) => mask & (1 << i));
      assert.equal(step.check({ selected, count: selected.length }) === true, selected.join() === need.join());
    }
    step.widget.cards.forEach((c, i) => {
      const both = [fronts[i], role(c.back)];
      assert.equal(!!c.breaks, both.includes('P') && both.includes('notQ'), `card ${i}`);
    });
  }
  const festival = { Beer: 'P', Juice: 'notP', 'Age 25': 'Q', 'Age 16': 'notQ' };
  for (const [a, b] of les.steps.find((s) => s.id === 'same-puzzle').pairs) assert.equal(festival[a], letter(b), `${a} ~ ${b}`);
  // "the lamp is on only if the switch is up" rules out exactly: on and not up
  const worlds = [[1, 1], [1, 0], [0, 1], [0, 0]].filter(([on, up]) => !(on && !up));
  const says = {
    'If the lamp is on, then the switch is up.': ([on, up]) => !on || up,
    'If the switch is down, then the lamp is off.': ([on, up]) => up || !on,
    'If the switch is up, then the lamp is on.': ([on, up]) => !up || on,
    'If the lamp is off, then the switch is down.': ([on, up]) => on || !up,
  };
  const onlyIf = resolveStep(rawStep('if-then', 'only-if'), makeRng(1), 'only-if');
  for (const o of onlyIf.options) assert.equal(worlds.every((w) => !!says[o.text](w)), !!o.correct, o.text);
  const street = [(r, w) => !r || w, (r, w) => !w || r, (r, w) => r || !w, (r, w) => w || !r]; // rule, A, B, C read from their sentences
  const column = (i) => [[true, true], [true, false], [false, true], [false, false]].map(([r, w]) => street[i](r, w)).join();
  const twin = resolveStep(rawStep('if-then', 'twin'), makeRng(1), 'twin');
  twin.options.forEach((o, i) => assert.equal(column(i + 1) === column(0), !!o.correct, o.text));
});

/* ---------------------------------------------------------------- lesson 4 */

test('review: truth-table columns agree with their headings; De Morgan’s twin is the "or" column', () => {
  const heading = {
    'Cookie (coffee and sandwich)': (v) => v.c && v.s, 'Stamp (coffee or sandwich)': (v) => v.c || v.s,
    'Spends nothing': (v) => !v.c && !v.s,   // the worked column on the teaching screen before the café
    'P and Q': (v) => v.P && v.Q, 'P or Q': (v) => v.P || v.Q, 'not P': (v) => !v.P,
    'C and D': (v) => v.C && v.D, 'not (C and D)': (v) => !(v.C && v.D),
    '(not C) or (not D)': (v) => !v.C || !v.D, '(not C) and (not D)': (v) => !v.C && !v.D,
    Lamp: (v) => !(v.A && v.B),
  };
  let cells = 0;
  for (const id of ['and-or-not', 'logic-gates']) {
    for (const step of LESSONS[id].steps) {
      for (const spec of [step.widget, step.figure].filter((x) => x && x.type === 'truth-table')) {
        const ids = spec.vars.map((v) => (typeof v === 'string' ? v : v.id));
        for (const col of spec.columns) {
          const f = heading[plain(col.head)];
          assert.ok(f, col.head);
          for (let m = 0; m < 4; m++) { const v = { [ids[0]]: !!(m & 2), [ids[1]]: !!(m & 1) }; assert.equal(!!col.value(v), !!f(v), `${col.head} ${JSON.stringify(v)}`); cells++; }
        }
      }
    }
  }
  assert.equal(cells, 48);
  const column = (f) => [0, 1, 2, 3].map((m) => !!f({ C: !!(m & 2), D: !!(m & 1) })).join();
  assert.equal(column(heading['not (C and D)']), column(heading['(not C) or (not D)']));
  assert.notEqual(column(heading['not (C and D)']), column(heading['(not C) and (not D)']));
});

test('review: negations — the marked sentence is false exactly when the original is true; no other option is', () => {
  // every sentence as a function of its two facts, read by hand (printer: a = out of paper, b = out of ink)
  const S = {
    'The door is locked and the alarm is on.': (a, b) => a && b,
    'The door is unlocked, or the alarm is off.': (a, b) => !a || !b,
    'The door is unlocked, and the alarm is off.': (a, b) => !a && !b,
    'The door is locked, or the alarm is on.': (a, b) => a || b,
    'Kim speaks French and Kim speaks Spanish.': (a, b) => a && b,
    'Kim does not speak French, or Kim does not speak Spanish.': (a, b) => !a || !b,
    'Kim does not speak French, and Kim does not speak Spanish.': (a, b) => !a && !b,
    'Kim speaks French, or Kim speaks Spanish.': (a, b) => a || b,
    'The soup is hot and the bread is fresh.': (a, b) => a && b,
    'The soup is not hot, or the bread is not fresh.': (a, b) => !a || !b,
    'The soup is not hot, and the bread is not fresh.': (a, b) => !a && !b,
    'The soup is hot, or the bread is fresh.': (a, b) => a || b,
    'Ravi plays chess or Ravi plays tennis.': (a, b) => a || b,
    'Ravi does not play chess, and Ravi does not play tennis.': (a, b) => !a && !b,
    'Ravi does not play chess, or Ravi does not play tennis.': (a, b) => !a || !b,
    'Ravi plays chess, and Ravi plays tennis.': (a, b) => a && b,
    'It will rain today or it will rain tomorrow.': (a, b) => a || b,
    'It will not rain today, and it will not rain tomorrow.': (a, b) => !a && !b,
    'It will not rain today, or it will not rain tomorrow.': (a, b) => !a || !b,
    'It will rain today, and it will rain tomorrow.': (a, b) => a && b,
    'The printer is out of paper or out of ink.': (a, b) => a || b,
    'The printer has paper, and it has ink.': (a, b) => !a && !b,
    'The printer has paper, or it has ink.': (a, b) => !a || !b,
    'The printer is out of paper, and out of ink.': (a, b) => a && b,
  };
  const seen = new Set();
  for (const s of variants('and-or-not', 'negate')) {
    const said = /“([^”]+)”/.exec(s.text)[1];
    seen.add(said);
    assert.ok(S[said], said);
    for (const o of s.options) {
      assert.ok(S[o.text], o.text);
      const negates = KL_WORLDS.every(([a, b]) => !!S[o.text](a, b) === !S[said](a, b));
      assert.equal(negates, !!o.correct, `${said} -> ${o.text}`);
    }
    assert.equal(/^An “and” statement/.test(s.explain), / and /.test(said));
  }
  assert.equal(seen.size, 6);
});

test('review: table sizes (all seeds), "every window", and the connectives', () => {
  for (const s of variants('and-or-not', 'rows')) {
    const n = Number(/for (\d+) statements need/.exec(s.text)[1]);
    let rows = 0;
    const count = (k) => { if (k === n) { rows++; return; } count(k + 1); count(k + 1); };
    count(0);
    assert.equal(s.answer, rows);
    assert.ok(s.explain.includes(`2^{${n}} = ${rows}`));
    for (const [value] of s.wrong) assert.notEqual(value, s.answer);
  }
  const windows = [];
  for (let m = 0; m < 8; m++) windows.push([m & 1, m & 2, m & 4].map(Boolean)); // true = closed
  const says = {
    'At least one window is open': (w) => w.some((c) => !c),
    'Every window is open': (w) => w.every((c) => !c),
    'No window is closed': (w) => !w.some(Boolean),
    'At least one window is closed': (w) => w.some(Boolean),
  };
  const every = resolveStep(rawStep('and-or-not', 'everyone'), makeRng(1), 'everyone');
  for (const o of every.options) assert.equal(windows.every((w) => says[o.text](w) === !w.every(Boolean)), !!o.correct, o.text);
  const rule = {
    'only when both parts are true': (p, q) => p && q, 'when at least one part is true': (p, q) => p || q,
    'when exactly one part is true': (p, q) => p !== q, 'exactly when P is false': (p) => !p,
  };
  const table = { 'P and Q': 'TFFF', 'P or Q': 'TTTF', 'P xor Q (exclusive or)': 'FTTF', 'not P': 'FFTT' };
  for (const [a, b] of resolveStep(rawStep('and-or-not', 'connectives'), makeRng(1), 'connectives').pairs) {
    assert.equal(KL_WORLDS.map(([p, q]) => (rule[b](p, q) ? 'T' : 'F')).join(''), table[a], `${a} / ${b}`);
  }
});

/* ---------------------------------------------------------------- lesson 5 */

const MY_GATES = { AND: (a, b) => (a && b ? 1 : 0), OR: (a, b) => (a || b ? 1 : 0), XOR: (a, b) => (a !== b ? 1 : 0), NOT: (a) => (a ? 0 : 1) };
/** An evaluator written for this test, independent of src/widgets/gates.js. */
function runCircuit(spec, inputs, choices = {}) {
  const sig = { ...inputs };
  for (let pass = 0; pass < 20 && spec.gates.some((g) => !(g.id in sig)); pass++) {
    for (const g of spec.gates) {
      if (g.id in sig || !g.in.every((id) => id in sig)) continue;
      sig[g.id] = MY_GATES[g.slot ? choices[g.id] : g.type](...g.in.map((id) => sig[id]));
    }
  }
  for (const o of spec.outputs) sig[o.id] = sig[o.from];
  return sig;
}
const lampColumns = (spec, choices) => {
  const cols = {};
  for (const o of spec.outputs) cols[o.id] = [];
  for (const [A, B] of [[0, 0], [0, 1], [1, 0], [1, 1]]) { const sig = runCircuit(spec, { A, B }, choices); for (const o of spec.outputs) cols[o.id].push(sig[o.id]); }
  return cols;
};

test('review: tracing questions — the lamp and every sentence of the working, from the switch settings in the text', () => {
  const cases = new Set();
  for (const s of variants('logic-gates', 'trace')) {
    const fig = s.figures[0];
    const settings = /set to \*\*([^*]+)\*\*/.exec(s.text)[1].split(', ').map((p) => p.split(/ = /));
    assert.deepEqual(fig.inputs.map((i) => [i.id, String(i.value)]), settings, 'the figure shows the switches named in the text');
    const inputs = {};
    for (const [id, v] of settings) inputs[id] = Number(v);
    const sig = runCircuit(fig, inputs);
    cases.add(fig.gates.map((g) => g.type + g.in.join('')).join('|') + settings.join(';'));
    assert.deepEqual(s.options.map((o) => [o.text, !!o.correct]), [['On', sig.lamp === 1], ['Off', sig.lamp === 0]]);
    assert.ok(s.explain.endsWith(`so the lamp gets **${sig.lamp}**: it is ${sig.lamp ? 'on' : 'off'}.`), s.explain);
    const gate = (type) => fig.gates.find((g) => g.type === type);
    for (const c of s.explain.matchAll(/The (AND|OR) gate gets (\d) and (\d)(?:, so it sends out (\d))?/g)) {
      assert.deepEqual(gate(c[1]).in.map((id) => sig[id]), [Number(c[2]), Number(c[3])], c[0]);
      if (c[4] != null) assert.equal(sig[gate(c[1]).id], Number(c[4]), c[0]);
    }
    for (const c of s.explain.matchAll(/The NOT gate flips (\d) into (\d)/g)) assert.deepEqual([sig[gate('NOT').in[0]], sig[gate('NOT').id]], [Number(c[1]), Number(c[2])]);
  }
  assert.equal(cases.size, 32); // 3 circuits with three switches, 2 with two
});

test('review: "which gate fits" — each description matches exactly one of the four gates', () => {
  const column = (f) => [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => f(a, b)).join('');
  const two = { AND: column(MY_GATES.AND), OR: column(MY_GATES.OR), XOR: column(MY_GATES.XOR) };
  const described = {
    'Its output is 1 only when both inputs are 1.': column((a, b) => (a === 1 && b === 1 ? 1 : 0)),
    'A microwave oven runs only when the door is shut and the start button has been pressed.': column((shut, pressed) => (shut && pressed ? 1 : 0)),
    'Its output is 0 only when both inputs are 0.': column((a, b) => (a === 0 && b === 0 ? 0 : 1)),
    'A doorbell rings when the front button or the back button is pressed, or both.': column((front, back) => (front || back ? 1 : 0)),
    'It has one input, and its output is always the opposite.': 'one input',
    'A night light switches on exactly when its sensor reports that there is no daylight.': 'one input',
    'Its output is 1 when exactly one of its inputs is 1.': column((a, b) => (a + b === 1 ? 1 : 0)),
    'A stairway lamp has a switch at the top and one at the bottom. Flipping either one changes the lamp: it is lit when exactly one switch is up.': column((a, b) => (a + b === 1 ? 1 : 0)),
  };
  const seen = new Set();
  for (const s of variants('logic-gates', 'which-gate')) {
    const clue = plain(s.text.split('\n\n')[1]);
    seen.add(clue);
    assert.ok(described[clue], clue);
    const fits = described[clue] === 'one input' ? ['NOT'] : Object.keys(two).filter((g) => two[g] === described[clue]);
    assert.equal(fits.length, 1, clue);
    assert.deepEqual(s.options.filter((o) => o.correct).map((o) => o.text), fits, clue);
    assert.ok(s.explain.startsWith(`${fits[0]} `));
  }
  assert.equal(seen.size, 8);
});

test('review: circuit checks over every state, with an independent evaluator; the feedback gives advice that works', () => {
  const les = LESSONS['logic-gates'];
  const light = les.steps.find((s) => s.id === 'light-it');
  const lit = [];
  for (let m = 0; m < 8; m++) {
    const inputs = { A: (m >> 2) & 1, B: (m >> 1) & 1, C: m & 1 };
    const lamp = runCircuit(light.widget, inputs).lamp;
    const res = light.check({ inputs, outputs: { lamp } });
    assert.equal(res === true, lamp === 1);
    if (lamp === 1) lit.push(inputs);
    else if (/switch C/.test(res)) assert.equal(inputs.C, 0);
    else if (/Switch B/.test(res)) assert.equal(inputs.B, 1);
    else assert.deepEqual(inputs, { A: 0, B: 0, C: 1 });
  }
  assert.deepEqual(lit, [light.solution.inputs]);

  const xor = les.steps.find((s) => s.id === 'build-xor');
  const other = (g) => (g === 'AND' ? 'OR' : 'AND');
  const isXor = (c) => lampColumns(xor.widget, c).lamp.join('') === '0110';
  let wins = 0;
  for (const g1 of ['AND', 'OR']) for (const g2 of ['AND', 'OR']) for (const g3 of ['AND', 'OR']) {
    const choices = { g1, g2, g3 };
    const res = xor.check({ complete: true, truth: lampColumns(xor.widget, choices), gates: choices });
    assert.equal(res === true, isXor(choices));
    if (res === true) { wins++; assert.deepEqual(xor.solution.gates, choices); continue; }
    if (/Swap the gates in slots 1 and 2/.test(res)) {
      // the advice is: swap slots 1 and 2, and make the last gate an AND. Following it must solve the puzzle.
      assert.match(res, /let the last gate insist on \*\*both\*\*/);
      assert.ok(isXor({ g1: g2, g2: g1, g3: 'AND' }), 'the advice for the inverted lamp does not lead to the answer');
    } else if (/The last gate should insist on \*\*both\*\*/.test(res)) {
      assert.equal(g3, 'OR'); // and the answer does need an AND there
      assert.equal(xor.solution.gates.g3, 'AND');
    } else {
      assert.match(res, /Look at slots 1 and 2/);
      assert.ok(g1 !== xor.solution.gates.g1 || g2 !== xor.solution.gates.g2);
    }
    assert.ok(other(g1) && other(g2));
  }
  assert.equal(wins, 1);

  const adder = les.steps.find((s) => s.id === 'half-adder');
  wins = 0;
  for (const gs of ['AND', 'OR', 'XOR']) for (const gc of ['AND', 'OR', 'XOR']) {
    const truth = lampColumns(adder.widget, { gs, gc });
    const adds = [[0, 0], [0, 1], [1, 0], [1, 1]].every(([A, B], i) => 2 * truth.carry[i] + truth.sum[i] === A + B);
    const res = adder.check({ complete: true, truth });
    assert.equal(res === true, adds, `sum ${gs}, carry ${gc}`);
    if (adds) { wins++; assert.deepEqual({ gs, gc }, { gs: 'XOR', gc: 'AND' }); assert.deepEqual(adder.solution.gates, { gs, gc }); continue; }
    if (/Carry lamp/.test(res)) assert.notEqual(truth.carry.join(''), '0001');
    else if (/Try 1 \+ 1/.test(res)) assert.equal(truth.sum[3], 1);
    else assert.notEqual(truth.sum.join(''), '0110');
  }
  assert.equal(wins, 1);
  assert.equal(adder.widget.readouts[0].value({ A: 1, B: 1, carry: 1, sum: 0 }), '1 + 1 = 10');
  const recall = resolveStep(rawStep('logic-gates', 'adder-recall'), makeRng(1), 'adder-recall');
  assert.deepEqual(recall.blanks.map((b) => (b.kind === 'select' ? b.answer : b.answers[0])), ['XOR', 'AND', '1', '0']);
});

/* ---------------------------------------------------------------- lesson 6 */

/** Exhaustive game search, independent of the widget: can the player about to move force a win? */
const searched = new Map();
function canWin(n, k) {
  if (n === 0) return false; // the other player has just taken the last stone
  const key = `${n}/${k}`;
  if (!searched.has(key)) {
    let win = false;
    for (let t = 1; t <= Math.min(k, n) && !win; t++) win = !canWin(n - t, k);
    searched.set(key, win);
  }
  return searched.get(key);
}
const winningTakes = (n, k) => { const out = []; for (let t = 1; t <= Math.min(k, n); t++) if (!canWin(n - t, k)) out.push(t); return out; };
/** Does "take n mod (k + 1)" beat every possible sequence of replies? The whole tree is walked. */
function strategyWins(n, k) {
  const t = n % (k + 1);
  if (n === 0 || t === 0) return false;
  const left = n - t;
  for (let r = 1; r <= Math.min(k, left); r++) if (!strategyWins(left - r, k)) return false;
  return true;
}

test('review: first-move questions — one winning move by game search, it wins against every reply, and the feedback is true', () => {
  for (const id of ['leave-four', 'first-move', 'general']) {
    for (const s of variants('strategy-games', id)) {
      const n = Number(/\*\*(\d+) stones\*\*/.exec(s.text)[1]);
      const range = /any number from 1 to (\d+)/.exec(s.text);
      const k = range ? Number(range[1]) : 3;
      if (!range) assert.match(s.text, /1, 2 or 3/);
      assert.deepEqual(winningTakes(n, k), [s.answer], `${id}: n=${n}, k=${k}`);
      assert.ok(strategyWins(n, k), `${id}: n=${n}, k=${k}`);
      assert.equal(s.unit, s.answer === 1 ? 'stone' : 'stones');
      for (let v = 1; v <= k; v++) {
        if (v === s.answer) continue;
        const fb = s.feedback(v);
        const left = n - v;
        let m = /^That leaves (\d+)\. Your opponent can take (\d+) and leave \*you\* on (\d+), a multiple of (\d+)\.$/.exec(fb);
        if (m) {
          const [l, reply, rest, mod] = m.slice(1).map(Number);
          assert.ok(l === left && reply >= 1 && reply <= k && rest === left - reply && mod === k + 1 && !canWin(rest, k), fb);
          continue;
        }
        m = /^That leaves (\d+), and your opponent takes (it|the lot)\.$/.exec(fb);
        if (m) { assert.ok(Number(m[1]) === left && left <= k && (m[2] === 'it') === (left === 1), fb); continue; }
        m = /^That leaves (\d+)\. Now your opponent can take (\d+) and leave \*you\* with 4\.$/.exec(fb);
        assert.ok(m && Number(m[1]) === left && Number(m[2]) >= 1 && Number(m[2]) <= 3 && left - Number(m[2]) === 4, fb);
      }
      for (const bad of [0, k + 1, 1.5, -1]) assert.match(s.feedback(bad), /You may only take/);
      const stated = /nearest one below (\d+) is (\d+), so take \*\*(\d+)\*\*/.exec(s.explain);
      if (id === 'leave-four') assert.ok(s.explain.startsWith(`Take ${s.answer} and leave **4**`));
      else assert.deepEqual(stated.slice(1).map(Number), [n, n - s.answer, s.answer]);
    }
  }
});

test('review: "sort the piles" and the fixed game steps, by game search', () => {
  for (const s of variants('strategy-games', 'sort-positions')) {
    const range = /between 1 and (\d+)/.exec(s.text);
    const k = range ? Number(range[1]) : 2;
    if (!range) assert.match(s.text, /\*\*1 or 2\*\* stones/);
    assert.deepEqual(s.buckets, ['Winning position', 'Losing position']);
    for (const it of s.items) {
      const n = Number(/^(\d+) stones?$/.exec(it.text)[1]);
      assert.equal(it.bucket, canWin(n, k) ? 0 : 1, `${n} (take 1 to ${k})`);
      const w = /^From (\d+) you can take (\d+) and leave (\d+), a multiple of (\d+)\./.exec(it.why);
      if (it.bucket === 0) assert.ok(w && Number(w[1]) === n && Number(w[2]) <= k && n - Number(w[2]) === Number(w[3]) && !canWin(Number(w[3]), k) && Number(w[4]) === k + 1, it.why);
      else assert.ok(!w && it.why.includes(`${n} is losing`));
    }
    assert.ok(s.explain.includes(`multiples of **${k + 1}**`));
  }
  for (let k = 1; k <= 8; k++) for (let n = 0; n <= 80; n++) assert.equal(!canWin(n, k), n % (k + 1) === 0);
  const losing = [];
  for (let n = 1; n <= 15; n++) if (!canWin(n, 3)) losing.push(n);
  assert.deepEqual(losing, [4, 8, 12]);
  assert.deepEqual(rawStep('strategy-games', 'mark-losing').solution.on.map((i) => i + 1), losing);
  const four = resolveStep(rawStep('strategy-games', 'four-left'), makeRng(1), 'four-left');
  for (const o of four.options) { const m = /^Take (\d)$/.exec(o.text); assert.equal(!!o.correct, !m); if (m) assert.ok(canWin(4 - Number(m[1]), 3)); }
  const reply = resolveStep(rawStep('strategy-games', 'reply'), makeRng(1), 'reply');
  assert.deepEqual(reply.blanks.map((b) => b.numbers[0]), [12 - 1 - 8, 12 - 2 - 8, 12 - 3 - 8, 4]);
  // "thousands of different ways the game could go" from 15 stones
  const games = (n) => (n === 0 ? 1 : [1, 2, 3].filter((t) => t <= n).reduce((sum, t) => sum + games(n - t), 0));
  assert.equal(games(15), 5768);
});

test('review: the computer player — it never lets a won position go, and the learner can still win 15 (moving first) and 16 (moving second)', () => {
  const take = [1, 2, 3];
  for (const set of [[1, 2], take, [1, 2, 3, 4], [1, 2, 3, 4, 5, 6]]) {
    const table = analyse(set, 60);
    for (let n = 0; n <= 60; n++) { assert.equal(table[n], !canWin(n, set.length)); assert.deepEqual(winningMoves(set, n, table), winningTakes(n, set.length)); }
  }
  const losing = analyse(take, 16);
  // who can end up winning, over every choice the widget allows: the computer takes any winning move
  // if it has one and any legal move otherwise; the learner takes anything, or (perfect) the first winning move
  const winners = (n, turn, perfect) => {
    if (n === 0) return new Set([turn === 'you' ? 'computer' : 'you']);
    const good = winningMoves(take, n, losing);
    const legal = take.filter((t) => t <= n);
    const moves = turn === 'computer' ? (good.length ? good : legal) : (perfect && good.length ? [good[0]] : legal);
    const out = new Set();
    for (const t of moves) for (const w of winners(n - t, turn === 'you' ? 'computer' : 'you', perfect)) out.add(w);
    return out;
  };
  assert.deepEqual([...winners(15, 'you', true)], ['you']);
  assert.deepEqual([...winners(16, 'computer', true)], ['you']);
  assert.deepEqual([...winners(16, 'you', false)], ['computer']);
  for (let n = 1; n <= 16; n++) {
    const good = winningTakes(n, 3);
    for (const t of take.filter((x) => x <= n && x < n)) if (good.length && !good.includes(t)) assert.deepEqual([...winners(n - t, 'computer', false)], ['computer'], `after a slip at ${n}`);
    if (good.length) assert.equal((n - winningMoves(take, n, losing)[0]) % 4, 0); // what the "slip" feedback calls the better move
  }
});

test('review: "is this statement true?" — parsed with a small parser; every claim in the working is checked too', () => {
  const parse = (src) => {
    const toks = src.match(/\(|\)|not|and|or|P|Q/g);
    assert.equal(toks.join(''), src.replace(/\s+/g, ''), src);
    let i = 0;
    const atom = () => {
      const t = toks[i++];
      if (t === 'P' || t === 'Q') return (P, Q) => (t === 'P' ? P : Q);
      if (t === 'not') { const inner = atom(); return (P, Q) => !inner(P, Q); }
      assert.equal(t, '(');
      const inner = expr();
      assert.equal(toks[i++], ')');
      return inner;
    };
    const expr = () => {
      let left = atom();
      while (toks[i] === 'and' || toks[i] === 'or') {
        const op = toks[i++];
        const l = left;
        const r = atom();
        left = op === 'and' ? (P, Q) => l(P, Q) && r(P, Q) : (P, Q) => l(P, Q) || r(P, Q);
      }
      return left;
    };
    const f = expr();
    assert.equal(i, toks.length, src);
    return f;
  };
  const seen = new Set();
  let claims = 0;
  for (const s of variants('and-or-not', 'evaluate')) {
    const given = /P is (true|false)\*\* and \*\*Q is (true|false)/.exec(s.text);
    const P = given[1] === 'true';
    const Q = given[2] === 'true';
    const formula = /^> (.*)$/m.exec(s.text)[1].replace(/\*\*/g, '');
    const value = parse(formula)(P, Q);
    seen.add(`${formula}|${P}|${Q}`);
    assert.deepEqual(s.options.map((o) => [o.text, !!o.correct]), [['True', value], ['False', !value]], `${formula} with P=${P}, Q=${Q}`);
    assert.ok(s.explain.endsWith(`So the whole statement is **${value}**.`), s.explain);
    assert.equal(/in logic “or” means/.test(s.text), /\bor\b/.test(formula));
    for (const c of s.explain.matchAll(/“([^”]+)” is (true|false)/g)) {
      assert.equal(parse(c[1].replace(/^Not /, 'not '))(P, Q), c[2] === 'true', `${c[0]} — ${s.explain}`);
      claims++;
    }
    const unquoted = s.explain.replace(/“[^”]*”/g, '');
    for (const c of unquoted.matchAll(/\b([PQ]) is (true|false)/g)) { assert.equal(c[1] === 'P' ? P : Q, c[2] === 'true', c[0]); claims++; }
  }
  assert.equal(seen.size, 32);
  assert.ok(claims > SEEDS);
});

/* ==========================================================================
 * Teach before you ask. A graded step may only ask for what the lesson has
 * already shown. These tests pin the shape of every lesson, where each
 * teaching screen sits, the terms it must carry for the steps it serves, and
 * that no worked example can come back as the very next question.
 * ========================================================================== */

const RAW = {};
for (const id of Object.keys(LESSONS)) RAW[id] = await lesson(id);
const flat = (t) => String(t).replace(/\s+/g, ' ');
const rawOf = (les, id) => {
  const step = RAW[les].steps.find((s) => s.id === id);
  assert.ok(step, `step ${les}/${id} exists`);
  return step;
};
/** Everything on the teaching screens that come before a step. */
const taughtBefore = (les, id) => {
  const steps = RAW[les].steps;
  const at = steps.findIndex((s) => s.id === id);
  assert.ok(at > 0, `${les}/${id}`);
  return flat(steps.slice(0, at).filter((s) => s.type === 'info').map((s) => s.text).join('\n'));
};

/** The teaching screens added in the teach-first revision. */
const TEACHING = {
  'deduction-warmup': ['teach-not-clues', 'teach-certain', 'teach-order-clues'],
  'truth-tellers-liars': ['teach-cases', 'teach-questions'],
  'if-then': ['teach-rule-breaker', 'teach-two-cards'],
  'and-or-not': ['teach-statements', 'example-evaluate'],
  'logic-gates': ['example-trace', 'xor-named'],
  'strategy-games': ['teach-multiples', 'teach-general'],
};

/** [lesson, teaching screen, the graded steps it serves, terms those steps need]. */
const SERVES = [
  ['deduction-warmup', 'name-it', ['next-tick'], ['one open square left', 'Pear column']],
  ['deduction-warmup', 'teach-not-clues', ['band', 'mini'], ['**not**', 'one open square']],
  ['deduction-warmup', 'teach-certain', ['sure', 'key-boxes'], ['**Certain**', '**Possible**', '**Impossible**']],
  ['deduction-warmup', 'teach-order-clues', ['race'], ['again after every tick']],
  ['truth-tellers-liars', 'method', ['both-liars', 'argument'], ['**Assume**', '**contradiction**']],
  ['truth-tellers-liars', 'teach-cases', ['accuse', 'pairs'], ['**every** surviving world', 'either way round']],
  ['truth-tellers-liars', 'teach-questions', ['fork', 'double-lie'], ['**opposite**', 'same answer from both kinds']],
  ['if-then', 'teach-rule-breaker', ['party'], ['hidden side break the rule']],
  ['if-then', 'name-it', ['same-puzzle', 'breaks'], ['“if” part', '“then” part', '**broken**']],
  ['if-then', 'names', ['contra'], ['**Converse**', '**Inverse**', '**Contrapositive**', 'swap **and** negate']],
  ['if-then', 'teach-two-cards', ['cards-again'], ['“If” part true', '“Then” part false', '**converse**']],
  ['and-or-not', 'teach-statements', ['cafe'], ['**statement**', 'one row for each combination']],
  ['and-or-not', 'name-it', ['or-kinds', 'evaluate'], ['**P and Q**', '**P or Q**', '**not P**', '**truth table**']],
  ['and-or-not', 'example-evaluate', ['evaluate', 'de-morgan', 'connectives'], ['**brackets first**', '**xor**', 'at least one, possibly both']],
  ['and-or-not', 'laws', ['negate', 'everyone'], ['swap the connecting word']],
  ['logic-gates', 'gates-named', ['light-it', 'trace'], ['**AND**', '**OR**', '**NOT**']],
  ['logic-gates', 'example-trace', ['trace'], ['The NOT gate gets 0', 'The AND gate gets']],
  ['logic-gates', 'xor-named', ['which-gate', 'half-adder'], ['**XOR**', '**exactly one**']],
  ['logic-gates', 'binary', ['half-adder', 'adder-recall'], ['**binary**', '**carry**']],
  ['strategy-games', 'positions', ['leave-four', 'mark-losing'], ['**losing position**', '**winning position**']],
  ['strategy-games', 'teach-multiples', ['reply', 'first-move', 'win'], ['**multiples of 4**', 'nearest multiple of 4']],
  ['strategy-games', 'teach-general', ['general', 'sort-positions'], ['**one more than the largest move**']],
];

test('teach before you ask: shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const [id, les] of Object.entries(LESSONS)) {
    const steps = les.steps.map((step) => resolveStep(step, makeRng(1), step.id)); // as the player sees them
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    assert.ok(roles.filter((kind) => kind === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const stepId of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === stepId);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${stepId}" exists`);
      assert.ok(roles.indexOf('graded', at + 1) > 0, `${id}/${stepId} is followed by a question`);
      for (const fig of steps[at].figures || []) assert.ok(fig.alt, `${id}/${stepId}: its figure has alt text`);
    }
  }
});

test('teach before you ask: each teaching screen comes before the steps it serves, and carries the terms they need', () => {
  for (const [les, teach, asks, terms] of SERVES) {
    const steps = RAW[les].steps;
    const screen = rawOf(les, teach);
    assert.equal(screen.type, 'info', `${les}/${teach}`);
    for (const ask of asks) {
      const asked = steps.findIndex((s) => s.id === ask);
      assert.ok(asked >= 0 && steps.indexOf(screen) < asked, `${les}: "${teach}" must come before "${ask}"`);
    }
    for (const term of terms) assert.ok(flat(screen.text).includes(term), `${les}/${teach} should mention "${term}" (needed by ${asks.join(', ')})`);
  }
  // one sentence in the prompt where one sentence was all that was missing
  assert.match(flat(rawOf('if-then', 'only-if').text), /cannot be on \*without\* the switch being up/);
  for (const s of variants('and-or-not', 'rows', 40)) assert.match(flat(s.text), /\*\*doubles\*\* the table: 1 statement takes 2 rows, and 2 statements take 4\./);
  assert.match(flat(rawOf('strategy-games', 'mark-losing').text), /1, 2 and 3 are winning, and 4 is losing/);
  // a rule is stated on the teaching screen that follows a discovery, not first in that step's explanation
  for (const [les, id, rule] of [
    ['strategy-games', 'mark-losing', 'multiples of 4'], ['logic-gates', 'build-xor', '**XOR**'],
    ['and-or-not', 'or-kinds', 'xor'], ['if-then', 'twin', 'ontrapositive'],
  ]) assert.ok(!flat(rawOf(les, id).explain).includes(rule), `${les}/${id}: "${rule}" belongs on a teaching screen`);
});

test('teach before you ask: every item a question draws from its table is on a teaching screen above it', () => {
  // the three piles of the sorting step
  const sorting = resolveStep(rawStep('deduction-warmup', 'key-boxes'), makeRng(1), 'key-boxes');
  for (const bucket of sorting.buckets) assert.ok(taughtBefore('deduction-warmup', 'key-boxes').includes(`**${bucket}**`), bucket);
  // every gate a question can name: as an answer, as an option, or drawn in a circuit to trace
  for (const s of variants('logic-gates', 'which-gate', 80)) {
    for (const o of s.options) assert.ok(taughtBefore('logic-gates', 'which-gate').includes(`**${o.text}**`), `${o.text} before which-gate`);
  }
  for (const s of variants('logic-gates', 'trace', 80)) {
    for (const g of s.figures[0].gates) assert.ok(taughtBefore('logic-gates', 'trace').includes(`**${g.type}**`), `${g.type} before trace`);
  }
  for (const g of H.CIRCUIT_HALF_ADDER.gates) for (const kind of g.slot) assert.ok(taughtBefore('logic-gates', 'half-adder').includes(`**${kind}**`), `${kind} before half-adder`);
  // the four connectives of the matching step, and every word a generated formula uses
  const words = { 'P and Q': '**P and Q**', 'P or Q': '**P or Q**', 'P xor Q (exclusive or)': '**xor**', 'not P': '**not P**' };
  for (const [left] of resolveStep(rawStep('and-or-not', 'connectives'), makeRng(1), 'connectives').pairs) {
    assert.ok(words[left] && taughtBefore('and-or-not', 'connectives').includes(words[left]), left);
  }
  assert.ok(taughtBefore('and-or-not', 'connectives').includes('**exclusive or**'));
  for (const s of variants('and-or-not', 'evaluate', 80)) {
    const formula = /^> (.*)$/m.exec(s.text)[1].replace(/\*\*/g, '');
    for (const w of formula.match(/not|and|or/g)) assert.ok(taughtBefore('and-or-not', 'evaluate').includes(`**${w === 'not' ? 'not P' : `P ${w} Q`}**`), w);
    if (/\(/.test(formula)) assert.ok(taughtBefore('and-or-not', 'evaluate').includes('**brackets first**'));
  }
  // the names a wrong answer is given in its feedback
  for (const s of variants('if-then', 'contra', 40)) {
    for (const o of s.options.filter((x) => !x.correct)) {
      const name = /That is the (converse|inverse)/.exec(o.why)[1];
      assert.ok(taughtBefore('if-then', 'contra').toLowerCase().includes(`**${name}**`), name);
    }
  }
});

test('teach before you ask: the worked examples are right, and no question can repeat one', () => {
  const never = (les, id, same, n = SEEDS) => { for (const s of variants(les, id, n)) assert.ok(!same(s), `${les}/${id} can repeat a worked example: ${plain(s.text)}`); };
  const blob = (s) => JSON.stringify(s, (key, v) => (typeof v === 'function' ? undefined : v));

  // lesson 1: three small grids, each with a cast of its own
  const cast = /\b(Pat|Quinn|Rae|Gus|Hope|Idris|Mo|Nour|Pia)\b/;
  for (const id of ['next-tick', 'sure', 'mini']) never('deduction-warmup', id, (s) => cast.test(blob(s)), 120);
  for (const id of ['first-grid', 'band', 'race']) assert.ok(!rawOf('deduction-warmup', id).widget.rows.some((r) => cast.test(r)));
  const grid = (id) => rawOf('deduction-warmup', id).figure;
  const open = (fig, r, c) => !fig.marks[`${r},${c}`];
  const pear = grid('name-it');
  assert.deepEqual([0, 1, 2].filter((r) => pear.marks[`${r},1`] !== 'no'), [2]);     // one square left in the Pear column…
  assert.equal(pear.marks['2,1'], 'yes');                                              // …and it is ticked
  const team = grid('teach-not-clues');
  assert.equal(team.clues.length, 2);
  assert.deepEqual([0, 1, 2].filter((r) => team.marks[`${r},0`] !== 'no'), [1]);
  assert.equal(team.marks['1,0'], 'yes');
  const queue = grid('teach-order-clues');                                             // rows Mo, Nour, Pia; "Nour queued somewhere behind Pia"
  const lines = orderings(3).filter((a) => a[1] > a[2]);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) assert.equal(open(queue, r, c), lines.some((a) => a[r] === c), `queue square ${r},${c}`);
  assert.deepEqual(lines.filter((a) => a[2] === 1).map((a) => a[1]), [2]);             // Pia 2nd puts Nour 3rd

  // lesson 2: the feud leaves two worlds, one knight in each; the chest question tells nothing
  assert.deepEqual(kinds(H.possibleWorlds(H.ISLAND_FEUD)).sort(), ['KL', 'LK']);
  assert.deepEqual(rawOf('truth-tellers-liars', 'teach-cases').figure.people, H.ISLAND_FEUD);
  for (const id of ['accuse', 'pairs']) never('truth-tellers-liars', id, (s) => /\b(Tor|Ulla)\b/.test(blob(s)), 120);
  const hear = (knight, truth) => (knight ? truth : !truth);
  const word = (v) => (v ? 'yes' : 'no');
  const chest = flat(rawOf('truth-tellers-liars', 'teach-questions').text);
  assert.ok(chest.includes(`| A knight says | ${word(hear(true, true))} | ${word(hear(true, false))} |`));
  assert.ok(chest.includes(`| A liar says | ${word(hear(false, true))} | ${word(hear(false, false))} |`));
  assert.equal(hear(true, true), hear(false, false));                                  // a "yes" can mean either case

  // lesson 3: the worked cards are the hook's own (A, K, 4, 7); a generated task never deals that hand
  const hand = (cards) => cards.map((c) => (typeof c.front === 'object' ? c.front.text : c.front)).sort().join();
  for (const id of ['teach-rule-breaker', 'teach-two-cards']) {
    const fig = rawOf('if-then', id).figure;
    assert.equal(hand(fig.cards), '4,7,A,K');
    assert.equal(fig.static, true);
    assert.equal(fig.reveal, 'never');                                                 // the backs stay hidden on a teaching screen
  }
  never('if-then', 'cards-again', (s) => hand(s.widget.cards) === '4,7,A,K');
  never('if-then', 'contra', (s) => /teenager/.test(blob(s)), 60);
  never('if-then', 'breaks', (s) => /beer|vowel/i.test(blob(s)), 60);

  // lesson 4: the example's letters and its first formula are outside the generator's pool
  never('and-or-not', 'evaluate', (s) => /\b[RS]\b/.test(s.text) || /^> \(\*\*not\*\* P\) \*\*and\*\* Q$/m.test(s.text));
  const R = false; const S = true;
  const worked = flat(rawOf('and-or-not', 'example-evaluate').text);
  assert.ok(worked.includes(`so the statement is **${!R && S}**`));
  assert.ok(worked.includes(`“Not” flips it: **${!(R || S)}**`));
  never('and-or-not', 'negate', (s) => /rich|famous|red or blue/.test(blob(s)), 60);
  never('and-or-not', 'rows', (s) => s.answer <= 4, 60);                               // the prompt's worked line stops at 2 statements
  const nothing = rawOf('and-or-not', 'teach-statements').figure.columns[0];
  assert.deepEqual([[1, 1], [1, 0], [0, 1], [0, 0]].map(([c, s]) => !!nothing.value({ c: !!c, s: !!s })), [false, false, false, true]);

  // lesson 5: the traced circuit is not one of the pool's, and the walk-through is what it does
  const shape = (spec) => spec.gates.map((g) => g.type + g.in.join('')).join('|');
  const example = H.CIRCUIT_TRACE_EXAMPLE;
  assert.ok(!H.TRACE_CIRCUITS.some((c) => shape(c) === shape(example)));
  never('logic-gates', 'trace', (s) => shape(s.figures[0]) === shape(example));
  const sig = runCircuit(example, { A: 0, B: 1 });
  assert.deepEqual([sig.not, sig.and, sig.lamp], [1, 1, 1]);
  assert.deepEqual(example.inputs.map((i) => [i.id, i.value]), [['A', 0], ['B', 1]]);
  assert.equal(lampColumns(H.CIRCUIT_XOR).lamp.join(''), '0110');
  assert.equal(truthTable(H.CIRCUIT_XOR).lamp.join(''), '0110');

  // lesson 6: 34 stones (take 2) and "take 1 to 9" from 47 (take 7) are outside every generator
  assert.deepEqual(winningTakes(34, 3), [2]);
  assert.deepEqual(winningTakes(47, 9), [7]);
  for (let n = 1; n <= 100; n++) assert.equal(!canWin(n, 9), n % 10 === 0);
  const pile = rawOf('strategy-games', 'teach-multiples').figure;
  assert.equal(pile.stones - pile.taken.length, 32);
  never('strategy-games', 'first-move', (s) => /\*\*34 stones\*\*/.test(s.text));
  for (const id of ['general', 'sort-positions']) never('strategy-games', id, (s) => /1 (to|and) 9\b/.test(plain(s.text)));
});
