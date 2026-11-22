/**
 * Algebra Foundations: independent checks of the generated problems.
 *
 * Every generator in the course is run with many seeds and its answer is
 * re-derived here from the *text the learner sees* (or from the figure spec),
 * not from the generator's own variables. A slip in a generator therefore
 * shows up as a failing test instead of a wrong answer in a lesson.
 *
 *   node --test tests/algebra-course.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { compile, equivalent } from '../src/core/mathexpr.js';

const SEEDS = 300;
const LESSONS = ['keeping-the-balance', 'undoing-operations', 'both-sides', 'growing-patterns', 'rate-of-change', 'lines', 'systems', 'parabolas', 'factoring'];
/** Every generated step of the course. Each one is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'keeping-the-balance': ['solve-add', 'solve-mul', 'mixed'],
  'undoing-operations': ['solve-two-step', 'solve-divided', 'first-undo'],
  'both-sides': ['subtract-x', 'solve-both', 'check-both', 'solve-minus'],
  'growing-patterns': ['use-rule', 'table-rule', 'picture-rule', 'which-step'],
  'rate-of-change': ['per-one', 'two-points', 'read-slope', 'predict-y'],
  lines: ['read-line', 'story-equation', 'story-backwards', 'through-two-points'],
  systems: ['read-crossing', 'solve-system', 'meeting-point'],
  parabolas: ['lowest', 'two-solutions', 'ball'],
  factoring: ['expand', 'expand-signs', 'factor', 'factor-signs', 'solve', 'garden'],
};
const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/algebra/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, 'algebra', id);
}

/** Run a step's generator with many seeds and hand each concrete step to `verify`. */
function eachVariant(lessonId, stepId, verify) {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  assert.equal(typeof raw.gen, 'function', `${lessonId}/${stepId} is generated`);
  assert.ok(GENERATED[lessonId].includes(stepId), `${lessonId}/${stepId} is listed in GENERATED`);
  for (let seed = 1; seed <= SEEDS; seed++) {
    const step = resolveStep(raw, makeRng(seed * 7919 + 13), stepId);
    try { verify(step); } catch (err) { err.message = `${lessonId}/${stepId} (seed ${seed}): ${err.message}\n  text: ${step.text.replace(/\s+/g, ' ').trim()}`; throw err; }
  }
}

/* ------------------------------------------------------------ TeX helpers */

/** Turn the simple TeX used in the lessons into something mathexpr can evaluate. */
function plain(tex) {
  let out = tex;
  for (let i = 0; i < 4; i++) out = out.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
  return out.replace(/\\times/g, '*').replace(/\\div/g, '/').replace(/\\[;,!]/g, ' ').replace(/\{:\}/g, '').replace(/[.,]\s*$/, '').trim();
}
const displayMath = (text) => { const m = /\$\$([\s\S]+?)\$\$/.exec(text); assert.ok(m, 'has display math'); return m[1].trim(); };
const fn = (expr, v = 'x') => { const f = compile(plain(expr), { vars: [v] }); return (value) => f({ [v]: value }); };
/** "lhs = rhs" -> a function of the unknown that is zero exactly at the solutions. */
function gap(equation, v = 'x') {
  const sides = equation.split('=');
  assert.equal(sides.length, 2, `"${equation}" is one equation`);
  const [l, r] = sides.map((s) => fn(s, v));
  return (value) => l(value) - r(value);
}
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || 'values differ'}: ${a} vs ${b}`);
/** Every integer in a piece of lesson text, in order (currency signs and markup ignored). */
const ints = (text) => (text.replace(/\\\$/g, '').match(/-?\d+/g) || []).map(Number);
const points = (text) => Array.from(text.matchAll(/\((-?\d+),\s*(-?\d+)\)/g), (m) => ({ x: Number(m[1]), y: Number(m[2]) }));
const correctOption = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, 'exactly one correct option'); return right[0]; };
const mathIn = (text) => { const m = /\$([^$]+)\$/.exec(text); assert.ok(m, `"${text}" contains math`); return m[1]; };
const blank = (step, i) => step.blanks[i].numbers[0];
/** A step that is not generated, in the shape the player sees (blanks parsed, options normalised). */
const fixed = (lessonId, stepId) => {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  return resolveStep(raw, makeRng(1), stepId);
};
/** Every whole or fractional slider position: range(-2, 2, 0.25). */
const range = (lo, hi, by = 1) => { const out = []; for (let i = 0; lo + i * by <= hi + 1e-9; i++) out.push(Math.round((lo + i * by) * 1e6) / 1e6); return out; };
const sliderValues = (def) => range(def.min, def.max, def.step || 1);
/** Curve number `i` of a plot spec as a function of x, with the sliders at `params`. */
const curve = (spec, i, params = {}) => { const f = compile(spec.fns[i].expr, { vars: ['x', ...Object.keys(spec.params || {})] }); return (x) => f({ ...params, x }); };
/** The lowest value of f on a grid and where it is reached (pass sign = -1 for the highest). */
function extremum(f, lo, hi, by, sign = 1) {
  let best = Infinity;
  let at = null;
  for (const x of range(lo, hi, by)) { const y = sign * f(x); if (y < best - 1e-12) { best = y; at = x; } }
  return { at, value: sign * best };
}

/* ------------------------------------------- lesson 1: keeping the balance */

test('keeping-the-balance: one-step equations are solved by their answers', () => {
  for (const id of ['solve-add', 'solve-mul', 'mixed']) {
    eachVariant('keeping-the-balance', id, (step) => {
      const g = gap(displayMath(step.text));
      near(g(step.answer), 0, 'the answer does not satisfy the equation');
      assert.ok(Math.abs(g(1) - g(0)) > 1e-9, 'the equation has exactly one solution');
      assert.ok(Number.isInteger(step.answer) && step.answer > 0, 'the answer is a positive whole number');
      for (const [value] of step.wrong) assert.ok(Math.abs(g(value)) > 1e-9, `the "wrong" value ${value} does not solve the equation`);
    });
  }
});

test('keeping-the-balance: fixed facts', () => {
  assert.equal(7 - 2, 5); assert.equal(15 - 6, 9); assert.equal(12 / 3, 4); assert.equal(8 - 3, 5);
  const beyond = fixed('keeping-the-balance', 'beyond-scale');
  assert.equal(blank(beyond, 1) - blank(beyond, 0), 9, 'x - 4 = 9');
  assert.equal(blank(beyond, 0), 4);
  // each move in the matching step really isolates x
  const undo = { 'Subtract 5': (v) => v - 5, 'Add 5': (v) => v + 5, 'Divide by 5': (v) => v / 5, 'Multiply by 5': (v) => v * 5 };
  for (const [eq, move] of fixed('keeping-the-balance', 'match-moves').pairs) {
    const [l, r] = mathIn(eq).split('=').map((s) => fn(s));
    for (const x of [1, 4, 7.5]) near(undo[move](l(x)), x, `${eq} / ${move}`);
    assert.equal(r(0), 20);
  }
});

/* -------------------------------------------------- lesson 2: undoing */

test('undoing-operations: two-step equations are solved by their answers', () => {
  for (const id of ['solve-two-step', 'solve-divided']) {
    eachVariant('undoing-operations', id, (step) => {
      near(gap(displayMath(step.text))(step.answer), 0, 'the answer does not satisfy the equation');
      assert.ok(Number.isInteger(step.answer) && step.answer > 0, 'the answer is a positive whole number');
      for (const [value] of step.wrong) assert.notEqual(value, step.answer);
    });
  }
});

test('undoing-operations: "which move first" names the operation that was done last', () => {
  eachVariant('undoing-operations', 'first-undo', (step) => {
    const eq = displayMath(step.text);
    const right = correctOption(step).text;
    const expected = eq.includes('(') ? /^Divide by/ : eq.includes('\\frac') ? /^Subtract/ : / - /.test(eq) ? /^Add/ : /^Subtract/;
    assert.match(right, expected, `first move for ${eq}`);
    // the equation really has a whole-number solution
    const g = gap(eq);
    const x = -g(0) / (g(1) - g(0));
    near(x, Math.round(x), 'the solution is a whole number');
    for (const o of step.options) if (!o.correct) assert.ok(o.why, `wrong option "${o.text}" explains itself`);
  });
});

test('undoing-operations: the interactive checks diagnose wrong orders', () => {
  const byId = (id) => lessons['undoing-operations'].steps.find((s) => s.id === id);
  const back = byId('work-back');
  assert.equal(back.check({ solved: true, done: true, moves: ['-5', '/4'] }), true);
  assert.match(back.check({ solved: false, done: true, moves: ['/4', '-5'] }), /divided first/);
  assert.match(back.check({ solved: false, done: true, moves: ['-5', '*4'] }), /repeats/);
  assert.match(back.check({ solved: false, done: false, moves: ['-5'] }), /Keep going/);
  const brackets = byId('brackets');
  assert.equal(brackets.check({ solved: true, done: true, moves: ['/3', '-2'] }), true);
  assert.match(brackets.check({ solved: false, done: true, moves: ['-2', '/3'] }), /subtracted first/);
  // the numbers quoted in the lesson text
  near((29 - 5) / 4, 6); near(29 / 4 - 5, 2.25); near(3 * (5 + 2), 21); near(7 * 3 - 2, 19);
});

/* ---------------------------------------------------- lesson 3: both sides */

test('both-sides: subtracting x from both sides keeps the equation', () => {
  eachVariant('both-sides', 'subtract-x', (step) => {
    const original = gap(displayMath(step.text));
    for (const o of step.options) {
      const g = gap(mathIn(o.text));
      const same = [0, 1, 2.5].every((x) => Math.abs(g(x) - original(x)) < 1e-9);
      assert.equal(same, !!o.correct, `option ${o.text}`);
    }
    correctOption(step);
  });
});

test('both-sides: equations with x on both sides are solved by their answers', () => {
  for (const id of ['solve-both', 'solve-minus']) {
    eachVariant('both-sides', id, (step) => {
      near(gap(displayMath(step.text))(step.answer), 0, 'the answer does not satisfy the equation');
      assert.ok(Number.isInteger(step.answer) && step.answer > 0);
      for (const [value] of step.wrong) assert.notEqual(value, step.answer);
    });
  }
});

test('both-sides: the "check both sides" blanks match the equation', () => {
  let yes = 0;
  let no = 0;
  eachVariant('both-sides', 'check-both', (step) => {
    const [l, r] = displayMath(step.text).split('=').map((s) => fn(s));
    const t = Number(/x = (\d+)/.exec(step.text)[1]);
    near(blank(step, 0), l(t), 'left side');
    near(blank(step, 1), r(t), 'right side');
    const says = step.blanks[2].answer;
    assert.equal(says, Math.abs(l(t) - r(t)) < 1e-9 ? 'is' : 'is not');
    if (says === 'is') yes++; else no++;
  });
  assert.ok(yes > 50 && no > 50, 'both outcomes occur');
});

test('both-sides: the sorting step is right about every equation', () => {
  const step = lessons['both-sides'].steps.find((s) => s.id === 'how-many-solutions');
  for (const item of step.items) {
    const g = gap(mathIn(item.text));
    const slope = g(1) - g(0);
    const hasOne = Math.abs(slope) > 1e-9;          // a non-constant difference crosses zero exactly once
    if (!hasOne) assert.ok(Math.abs(g(0)) > 1e-9, `${item.text} is not an identity`);
    assert.equal(item.bucket, hasOne ? 0 : 1, item.text);
  }
});

/* ------------------------------------------------ lesson 4: growing patterns */

test('growing-patterns: evaluating a rule', () => {
  eachVariant('growing-patterns', 'use-rule', (step) => {
    const rule = fn(/\$\\;(.+?)\\;\$/.exec(step.text)[1], 'n');
    const n = Number(/in step (\d+)\?/.exec(step.text)[1]);
    near(step.answer, rule(n));
  });
});

test('growing-patterns: the rule chosen for a table fits every column, the others do not', () => {
  eachVariant('growing-patterns', 'table-rule', (step) => {
    const row = /\| Count \|([^\n]+)\|/.exec(step.text)[1].split('|').map((c) => Number(c.trim()));
    assert.equal(row.length, 4);
    for (const o of step.options) {
      const rule = fn(mathIn(o.text), 'n');
      const fits = row.every((count, i) => Math.abs(rule(i + 1) - count) < 1e-9);
      assert.equal(fits, !!o.correct, `option ${o.text} against ${row}`);
    }
  });
});

test('growing-patterns: the rule for a picture counts the tiles that are drawn', () => {
  eachVariant('growing-patterns', 'picture-rule', (step) => {
    const fig = step.figures[0];
    assert.equal(fig.shape, 'row');
    const rule = fn(step.answer, 'n');
    for (const n of fig.steps) near(rule(n), fig.grow * n + fig.start, `step ${n}`);
    for (const [wrong] of step.wrong) assert.ok(!equivalent(wrong, step.answer, ['n']), `${wrong} is a wrong answer`);
  });
});

test('growing-patterns: working back from a count to its step', () => {
  eachVariant('growing-patterns', 'which-step', (step) => {
    const sticks = Number(/\*\*(\d+) matchsticks\*\*/.exec(step.text)[1]);
    assert.equal(3 * step.answer + 1, sticks);
  });
});

test('growing-patterns: fixed facts', () => {
  const border = (n) => (n + 2) ** 2 - n ** 2;
  for (let n = 1; n <= 9; n++) { assert.equal(border(n), 4 * n + 4); assert.equal(4 * (n + 1), 4 * n + 4); }
  const match = lessons['growing-patterns'].steps.find((s) => s.id === 'match-rules');
  for (const [list, rule] of match.pairs) {
    const f = fn(mathIn(rule), 'n');
    list.split(',').map((t) => Number(t)).filter(Number.isFinite).forEach((value, i) => near(f(i + 1), value, `${list} / ${rule}`));
  }
});

/* -------------------------------------------------- lesson 5: rate of change */

test('rate-of-change: the rate read from a table', () => {
  eachVariant('rate-of-change', 'per-one', (step) => {
    const rows = step.text.split('\n').filter((l) => l.includes('|') && !l.includes('---')).map((l) => l.split('|').slice(2, 6).map((c) => Number(c.trim())));
    const [xs, ys] = rows;
    for (let i = 1; i < 4; i++) near((ys[i] - ys[i - 1]) / (xs[i] - xs[i - 1]), step.answer, 'rate between neighbouring columns');
  });
});

test('rate-of-change: the slope between two points', () => {
  eachVariant('rate-of-change', 'two-points', (step) => {
    const [p, q] = points(step.text);
    near((q.y - p.y) / (q.x - p.x), step.answer);
    assert.ok(p.y >= 0 && q.y >= 0, 'both points are in the first quadrant');
  });
});

test('rate-of-change: the slope read from a graph', () => {
  eachVariant('rate-of-change', 'read-slope', (step) => {
    const fig = step.figures[0];
    const [p, q] = fig.points;
    near((q.y - p.y) / (q.x - p.x), step.answer);
    const line = fn(fig.fns[0].expr);
    near(line(p.x), p.y, 'the first dot is on the line');
    near(line(q.x), q.y, 'the second dot is on the line');
    for (const pt of [p, q]) assert.ok(pt.x >= fig.x[0] && pt.x <= fig.x[1] && pt.y >= fig.y[0] && pt.y <= fig.y[1], 'the dots are inside the window');
  });
});

test('rate-of-change: predicting a point from a slope', () => {
  eachVariant('rate-of-change', 'predict-y', (step) => {
    const m = Number(/slope \$(-?\d+)\$/.exec(step.text)[1]);
    const [p] = points(step.text);
    const x2 = Number(/\$x\$ is (\d+)\?/.exec(step.text)[1]);
    near(p.y + m * (x2 - p.x), step.answer);
  });
});

/* ----------------------------------------------------------- lesson 6: lines */

test('lines: the equation read from a graph is the line that is drawn', () => {
  eachVariant('lines', 'read-line', (step) => {
    assert.ok(equivalent(step.answer, plain(step.figures[0].fns[0].expr), ['x']), `${step.answer} vs ${step.figures[0].fns[0].expr}`);
    for (const [wrong] of step.wrong) assert.ok(!equivalent(String(wrong), step.answer, ['x']));
  });
});

test('lines: a story turns into start + rate × x, and back', () => {
  eachVariant('lines', 'story-equation', (step) => {
    const [start, rate] = ints(step.text);
    const y = fn(step.answer);
    near(y(0), start, 'value at x = 0');
    near(y(1) - y(0), rate, 'change per step');
  });
  eachVariant('lines', 'story-backwards', (step) => {
    const [start, rate, total] = ints(step.text);
    assert.equal(rate * step.answer + start, total);
  });
});

test('lines: the line through two points', () => {
  eachVariant('lines', 'through-two-points', (step) => {
    const y = fn(step.answer);
    const [p, q] = points(step.text);
    near(y(p.x), p.y);
    near(y(q.x), q.y);
    assert.ok(p.x !== 0 && q.x !== 0, 'neither point is on the y-axis');
  });
});

test('lines: the interactive checks', () => {
  const byId = (id) => lessons.lines.steps.find((s) => s.id === id);
  const draw = byId('draw-line');
  assert.equal(draw.check({ P: { x: 0, y: 4 }, Q: { x: 2, y: 0 } }), true);
  assert.equal(draw.check({ P: { x: 0, y: 4 }, Q: { x: -1, y: 6 } }), true);
  assert.match(draw.check({ P: { x: 0, y: 3 }, Q: { x: 2, y: 0 } }), /intercept/);
  assert.match(draw.check({ P: { x: 0, y: 4 }, Q: { x: 2, y: 6 } }), /climbs/);
  assert.match(draw.check({ P: { x: 0, y: 4 }, Q: { x: 1, y: 0 } }), /too steep/);
  assert.match(draw.check({ P: { x: 0, y: 4 }, Q: { x: 0, y: 2 } }), /off the/);
  const target = byId('match-line');
  assert.equal(target.check({ m: -0.5, b: 3 }), true);
  assert.equal(typeof target.check({ m: 0.5, b: 3 }), 'string');
  assert.equal(typeof target.check({ m: -0.5, b: 2 }), 'string');
});

/* --------------------------------------------------------- lesson 7: systems */

test('systems: the crossing point read from a graph is on both lines', () => {
  eachVariant('systems', 'read-crossing', (step) => {
    const [x, y] = [blank(step, 0), blank(step, 1)];
    for (const f of step.figures[0].fns) near(fn(f.expr)(x), y, `line ${f.expr}`);
    const fig = step.figures[0];
    assert.ok(x > fig.x[0] && x < fig.x[1] && y > fig.y[0] && y < fig.y[1], 'the crossing is inside the window');
  });
});

test('systems: solving by setting the expressions equal', () => {
  eachVariant('systems', 'solve-system', (step) => {
    const rhs = Array.from(displayMath(step.text).matchAll(/y &= ([^\\]+)/g), (m) => fn(m[1]));
    assert.equal(rhs.length, 2);
    const [x, y] = [blank(step, 0), blank(step, 1)];
    for (const f of rhs) near(f(x), y);
  });
});

test('systems: the two sides of a "when are they equal" story meet at the answer', () => {
  eachVariant('systems', 'meeting-point', (step) => {
    const n = ints(step.text.split('\n')[0]);
    const [ahead, slow, start, fast] = n.length === 3 ? [n[0], n[1], 0, n[2]] : n;
    assert.equal(ahead + slow * step.answer, start + fast * step.answer, `numbers ${n}`);
    assert.ok(fast > slow && ahead > start);
  });
});

test('systems: fixed facts', () => {
  const a = (x) => 2 * x + 10;
  const b = (x) => 4 * x;
  assert.equal(a(5), 20); assert.equal(b(5), 20); assert.equal(a(1), 12); assert.equal(b(10), 40); assert.equal(a(10), 30);
  const step = lessons.systems.steps.find((s) => s.id === 'never-cross');
  for (const o of step.options) {
    const [f, g] = Array.from(o.text.matchAll(/y = ([^$\\]+)/g), (m) => fn(m[1]));
    const parallel = Math.abs((f(1) - f(0)) - (g(1) - g(0))) < 1e-9;
    assert.equal(parallel, !!o.correct, o.text);
    if (parallel) assert.ok(Math.abs(f(0) - g(0)) > 1e-9, 'parallel lines are not the same line');
  }
  const pick = lessons.systems.steps.find((s) => s.id === 'on-both');
  for (const o of pick.options) {
    const [p] = points(o.text);
    const onBoth = p.y === 2 * p.x + 1 && p.y === -p.x + 7;
    assert.equal(onBoth, !!o.correct, o.text);
  }
});

/* ------------------------------------------------------- lesson 8: parabolas */

test('parabolas: the lowest point of y = (x - h)^2 + k', () => {
  eachVariant('parabolas', 'lowest', (step) => {
    const eq = displayMath(step.text);
    assert.match(eq, /^y = \(x [+-] [1-9]\d*\)\^2 [+-] [1-9]\d*$/, `"${eq}" is a tidy vertex form`);
    const low = extremum(fn(eq.replace(/^y =/, '')), -10, 10, 0.25);       // brute force over a fine grid
    assert.equal(blank(step, 0), low.at, 'x of the lowest point');
    assert.equal(blank(step, 1), low.value, 'y of the lowest point');
    assert.notEqual(Math.abs(low.at), Math.abs(low.value), 'the two blanks cannot be mixed up unnoticed');
    assert.ok(step.explain.includes(`$(${low.at},\\ ${low.value})$`), 'the explanation names the same vertex');
  });
});

test('parabolas: x^2 = n^2 has exactly the two marked solutions', () => {
  eachVariant('parabolas', 'two-solutions', (step) => {
    const square = Number(/x\^2 = (\d+)/.exec(step.text)[1]);
    let right = 0;
    for (const o of step.options) {
      const value = Number(mathIn(o.text));
      assert.ok(Number.isFinite(value), `option ${o.text} is a number`);
      assert.equal(value * value === square, !!o.correct, `option ${o.text}`);
      if (o.correct) right++; else assert.ok(o.why, `wrong option ${o.text} explains itself`);
    }
    assert.equal(right, 2, 'a positive and a negative solution');
    const half = step.options.find((o) => /half of/.test(o.why || ''));
    assert.equal(Number(mathIn(half.text)), square / 2, 'the option called "half" is half');
  });
});

test('parabolas: the ball is highest halfway between its two roots', () => {
  eachVariant('parabolas', 'ball', (step) => {
    const h = fn(displayMath(step.text).replace(/^h =/, ''), 't');
    const land = Number(/lands again at \$t = (\d+)\$/.exec(step.text)[1]);
    near(h(0), 0, 'on the ground at the start');
    near(h(land), 0, 'on the ground at the landing time');
    const top = extremum(h, 0, land, 1 / 64, -1);
    near(top.value, step.answer, 'height of the highest point');
    near(top.at, land / 2, 'the highest point is halfway');
    near(h(2) - 2 * h(1) + h(0), -10, 'the rule is free fall with g = 10 m/s²');
    for (const [value] of step.wrong) assert.ok(Math.abs(value - step.answer) > 1e-9, `${value} is a wrong answer`);
    assert.ok(step.explain.includes(`= ${step.answer} \\text{ m}`), 'the explanation ends at the same height');
  });
});

test('parabolas: fixed facts', () => {
  const table = fixed('parabolas', 'table');
  assert.deepEqual(table.blanks.map((b) => b.numbers[0]), [4 * 4, 5 * 5, 4 * 4 - 3 * 3, 5 * 5 - 4 * 4]);
  assert.equal(fixed('parabolas', 'negative').answer, (-3) * (-3));
  for (const o of fixed('parabolas', 'which-way').options) {
    const y = fn(mathIn(o.text).replace(/^y =/, ''));
    assert.equal(y(10) < y(0), !!o.correct, `${o.text} opens downwards`);
  }
  const trap = extremum((x) => (x + 4) ** 2 + 1, -10, 10, 0.5);
  for (const o of fixed('parabolas', 'sign-trap').options) {
    const [x, y] = ints(o.text);
    assert.equal(x === trap.at && y === trap.value, !!o.correct, o.text);
  }
  // how often each curve meets the x-axis, from its discriminant
  for (const item of fixed('parabolas', 'how-many').items) {
    const y = fn(mathIn(item.text).replace(/^y =/, ''));
    const c = y(0);
    const a = (y(1) + y(-1)) / 2 - c;
    const b = (y(1) - y(-1)) / 2;
    const disc = b * b - 4 * a * c;
    assert.equal(item.bucket, disc > 1e-9 ? 0 : disc > -1e-9 ? 1 : 2, item.text);
    const vertex = /\$\((-?\d+), (-?\d+)\)\$/.exec(item.why);
    if (vertex) { near(Number(vertex[1]), -b / (2 * a), `vertex of ${item.text}`); near(Number(vertex[2]), y(-b / (2 * a)), `vertex of ${item.text}`); }
  }
});

test('parabolas: the interactive checks accept exactly the right states, and their feedback is true', () => {
  // y = a x^2 through the dot
  const stretch = fixed('parabolas', 'stretch-a');
  const dot = stretch.widget.points[0];
  for (const a of sliderValues(stretch.widget.params.a)) {
    const y = curve(stretch.widget, 1, { a })(dot.x);
    const said = stretch.check({ a });
    assert.equal(said === true, y === dot.y, `a = ${a}`);
    if (said === true) continue;
    assert.equal(typeof said, 'string', `a = ${a} gets feedback`);
    if (/Too narrow/.test(said)) assert.ok(a > 0 && y > dot.y, `a = ${a}: ${said}`);
    if (/Too wide/.test(said)) assert.ok(a > 0 && y < dot.y, `a = ${a}: ${said}`);
    if (/downwards/.test(said)) assert.ok(a < 0, `a = ${a}: ${said}`);
    if (/flat line/.test(said)) assert.equal(a, 0);
  }
  assert.equal(stretch.check(stretch.solution), true);
  assert.notEqual(stretch.check({ a: stretch.widget.params.a.value }), true, 'not solved at the start');

  // the vertex of y = (x - h)^2 + k on the dot
  const move = fixed('parabolas', 'move-it');
  const goal = move.widget.points[0];
  let passes = 0;
  for (const h of sliderValues(move.widget.params.h)) for (const k of sliderValues(move.widget.params.k)) {
    const low = extremum(curve(move.widget, 0, { h, k }), -8, 8, 0.5);
    const said = move.check({ h, k });
    assert.equal(said === true, low.at === goal.x && low.value === goal.y, `h = ${h}, k = ${k}`);
    if (said === true) { passes++; continue; }
    assert.equal(typeof said, 'string');
    if (/went left/.test(said)) assert.ok(low.at < 0);
    if (/right above/.test(said)) assert.ok(low.at === goal.x && low.value > goal.y);
    if (/too low/.test(said)) assert.ok(low.at === goal.x && low.value < goal.y);
    if (/Use \$h\$ first/.test(said)) assert.notEqual(low.at, goal.x);
  }
  assert.equal(passes, 1);
  assert.equal(move.check(move.solution), true);

  // P and Q on the two roots of y = x^2 - 4, either way round
  const cross = fixed('parabolas', 'crossings');
  const y = curve(cross.widget, 0);
  const xs = range(cross.widget.x[0], cross.widget.x[1]);
  assert.deepEqual(xs.filter((x) => y(x) === 0), [-2, 2]);
  passes = 0;
  for (const p of xs) for (const q of xs) {
    const said = cross.check({ P: { x: p, y: 0 }, Q: { x: q, y: 0 } });
    assert.equal(said === true, p !== q && y(p) === 0 && y(q) === 0, `P = ${p}, Q = ${q}`);
    if (said === true) { passes++; continue; }
    const onRoot = [p, q].filter((x) => y(x) === 0).length;
    if (/same spot/.test(said)) assert.equal(p, q);
    if (/One of them is right/.test(said)) assert.ok(onRoot === 1 && p !== q, `P = ${p}, Q = ${q}: ${said}`);
    if (/looking for the numbers/.test(said)) assert.equal(onRoot, 0, `P = ${p}, Q = ${q}: ${said}`);
  }
  assert.equal(passes, 2);
  assert.equal(cross.check(cross.solution), true);
});

/* ------------------------------------------------------- lesson 9: factoring */

/** "x^2 + 5x - 6", as displayed, -> [5, -6]. An untidy form ("1x", "+ -3", "+ 0") fails. */
function quadCoefficients(tex) {
  const m = /^x\^2(?: ([+-]) (\d*)x)?(?: ([+-]) (\d+))?$/.exec(tex.trim());
  assert.ok(m, `"${tex}" is a tidy quadratic`);
  assert.ok(m[2] !== '1' && m[2] !== '0' && m[4] !== '0', `"${tex}" has no 1x, 0x or + 0`);
  const s = m[1] ? (m[1] === '-' ? -1 : 1) * (m[2] === '' ? 1 : Number(m[2])) : 0;
  const p = m[3] ? (m[3] === '-' ? -1 : 1) * Number(m[4]) : 0;
  return [s, p];
}
const quadValue = (s, p) => (x) => x * x + s * x + p;
/** Whole-number solutions of x^2 + sx + p = 0 by brute force, smallest first. */
const wholeRoots = (s, p) => range(-150, 150).filter((x) => quadValue(s, p)(x) === 0);
/** The same solutions from the quadratic formula. */
function formulaRoots(s, p) {
  const disc = s * s - 4 * p;
  assert.ok(disc >= 0, 'the quadratic has real roots');
  return [(-s - Math.sqrt(disc)) / 2, (-s + Math.sqrt(disc)) / 2];
}
const sameFunction = (f, g) => [-6, -1.5, 0, 0.4, 3, 10].every((x) => Math.abs(f(x) - g(x)) < 1e-9);
const signedPart = (v, tail = '') => `${v < 0 ? '-' : '+'} ${Math.abs(v)}${tail}`;

test('factoring: expanding two brackets', () => {
  for (const id of ['expand', 'expand-signs']) {
    eachVariant('factoring', id, (step) => {
      const shown = /\\;(\(x [+-] \d+\)\(x [+-] \d+\))\$/.exec(step.text);
      assert.ok(shown, 'the text shows two tidy brackets');
      const [s, p] = quadCoefficients(step.answer);             // the key is expanded and tidy …
      assert.ok(sameFunction(fn(shown[1]), quadValue(s, p)), `${shown[1]} is not ${step.answer}`);   // … and equal to the product
      const typed = [
        `x^2${signedPart(s, 'x')}${signedPart(p)}`.replace(/ /g, ''),
        `x*x ${signedPart(s, '*x')} ${signedPart(p)}`,
        `${p} ${signedPart(s, 'x')} + x^2`,
        `x² ${signedPart(s, 'x')} ${signedPart(p)}`,
        `x(x ${signedPart(s)}) ${signedPart(p)}`,
      ];
      for (const form of typed) assert.ok(equivalent(form, step.answer, ['x']), `"${form}" should be accepted for ${step.answer}`);
      const slips = [`x^2 ${signedPart(p)}`, `x^2 ${signedPart(-s, 'x')} ${signedPart(p)}`, `x^2 ${signedPart(s, 'x')} ${signedPart(-p)}`, `x^2 ${signedPart(s + 1, 'x')} ${signedPart(p)}`, `2x ${signedPart(s)}`];
      for (const slip of slips) assert.ok(!equivalent(slip, step.answer, ['x']), `"${slip}" should be rejected for ${step.answer}`);
      for (const [wrong] of step.wrong) assert.ok(!equivalent(String(wrong), step.answer, ['x']), `${wrong} is a wrong answer`);
      for (const text of [step.explain, ...step.hints, ...step.wrong.map((w) => w[1])]) assert.ok(!/(^|[^\d.])1x/.test(text), `no "1x" in "${text}"`);
    });
  }
});

test('factoring: the two numbers with the right sum and product', () => {
  eachVariant('factoring', 'factor', (step) => {
    const [s, p] = quadCoefficients(/\\;(x\^2[^$]*)\$/.exec(step.text)[1]);
    const pairs = [];
    for (const u of range(-200, 200)) if (u <= s - u && u * (s - u) === p) pairs.push([u, s - u]);
    assert.equal(pairs.length, 1, 'exactly one pair of whole numbers has that sum and product');
    assert.deepEqual([blank(step, 0), blank(step, 1)], pairs[0], 'the blanks, smaller number first');
    assert.ok(pairs[0][0] > 0 && pairs[0][0] < pairs[0][1], 'two different positive numbers, so "smaller first" is clear');
    const listed = Array.from(step.hints[1].matchAll(/\$(\d+) \\times (\d+)\$/g), (m) => [Number(m[1]), Number(m[2])]);
    const all = range(1, p).filter((a) => a * a <= p && p % a === 0).map((a) => [a, p / a]);
    assert.deepEqual(listed, all, 'the hint lists every factor pair of the product');
    assert.equal(all.filter(([a, b]) => a + b === s).length, 1, 'only one of those pairs has the right sum');
  });
});

test('factoring: the factored form with a negative last term', () => {
  eachVariant('factoring', 'factor-signs', (step) => {
    const [s, p] = quadCoefficients(/\\;(x\^2[^$\\]*)\\,\$/.exec(step.text)[1]);
    assert.ok(p < 0 && s < 0, 'a negative last term and a negative middle term');
    for (const o of step.options) {
      assert.equal(sameFunction(fn(mathIn(o.text)), quadValue(s, p)), !!o.correct, `option ${o.text}`);
      if (!o.correct) assert.ok(o.why, `wrong option ${o.text} explains itself`);
    }
    const [m, n] = Array.from(correctOption(step).text.matchAll(/x ([+-]) (\d+)/g), (b) => (b[1] === '-' ? -1 : 1) * Number(b[2]));
    assert.ok(m * n < 0 && Math.abs(Math.min(m, n)) > Math.max(m, n), 'the larger number carries the minus sign, as the hint says');
  });
});

test('factoring: solving a quadratic by factoring', () => {
  eachVariant('factoring', 'solve', (step) => {
    const eq = displayMath(step.text);
    assert.match(eq, / = 0$/);
    const [s, p] = quadCoefficients(eq.replace(/ = 0$/, ''));
    const roots = wholeRoots(s, p);
    assert.equal(roots.length, 2, 'two different whole-number solutions');
    const byFormula = formulaRoots(s, p);
    near(roots[0], byFormula[0]);
    near(roots[1], byFormula[1]);
    assert.deepEqual([blank(step, 0), blank(step, 1)], roots, 'the blanks: smaller solution, then larger');
    const g = gap(eq);
    near(g(roots[0]), 0);
    near(g(roots[1]), 0);
    // the factored form quoted in the explanation is the same quadratic
    const factored = /= (\(x [+-] \d+\)\(x [+-] \d+\)) \$\$/.exec(step.explain.replace(/\s+/g, ' '));
    assert.ok(factored && sameFunction(fn(factored[1]), quadValue(s, p)), 'the explanation factors the same quadratic');
  });
});

test('factoring: the garden has one positive width', () => {
  eachVariant('factoring', 'garden', (step) => {
    const m = /\*\*(\d+) m longer than it is wide\*\*\. Its area is \*\*(\d+) m²\*\*/.exec(step.text);
    assert.ok(m, 'the text gives the extra length and the area');
    const [extra, area] = [Number(m[1]), Number(m[2])];
    const widths = formulaRoots(extra, -area).filter((x) => x > 0);       // x(x + extra) = area
    assert.equal(widths.length, 1, 'exactly one positive solution');
    near(widths[0], step.answer);
    assert.equal(step.answer * (step.answer + extra), area);
    assert.deepEqual(range(1, 300).filter((w) => w * (w + extra) === area), [step.answer], 'brute force agrees');
    for (const [value, message] of step.wrong) {
      assert.notEqual(value, step.answer);
      if (/length/.test(message)) assert.equal(value, step.answer + extra);
      if (/does solve the equation/.test(message)) assert.ok(value < 0 && value * (value + extra) === area, 'the negative root really solves the equation');
    }
  });
});

test('factoring: fixed facts', () => {
  for (const o of fixed('factoring', 'hook').options) assert.equal(sameFunction(fn(mathIn(o.text)), (x) => (x + 3) ** 2), !!o.correct, o.text);
  for (const o of fixed('factoring', 'solve-factored').options) {
    const x = Number(/x = (-?\d+)/.exec(o.text)[1]);
    assert.equal((x - 2) * (x + 5) === 0, !!o.correct, o.text);
    if (!o.correct) assert.deepEqual(ints(o.why), [x - 2, x + 5, (x - 2) * (x + 5)], `the working quoted for x = ${x}`);
  }
  assert.ok(sameFunction((x) => (x + 3) * (x + 4), quadValue(7, 12)));
  assert.ok(sameFunction((x) => (x + 1) * (x - 3), quadValue(-2, -3)));
  assert.ok(sameFunction((x) => (x + 6) * (x - 1), quadValue(5, -6)));
  assert.deepEqual(wholeRoots(5, -6), [-6, 1]);
  assert.equal((-1 + 3) / 2, 1, 'the vertex is halfway between the roots -1 and 3');
});

test('factoring: the interactive checks accept exactly the right states, and their feedback is true', () => {
  const model = (a, b) => ({ a, b, sum: a + b, product: a * b });        // the state of the area-model widget
  const sides = range(0, 6);                                             // its default slider range

  const square = fixed('factoring', 'square');
  for (const a of sides) for (const b of sides) {
    const said = square.check(model(a, b));
    assert.equal(said === true, a === 3 && b === 3, `a = ${a}, b = ${b}`);
    if (said !== true) assert.equal(typeof said, 'string');
  }
  assert.equal(square.check(model(square.solution.a, square.solution.b)), true);

  const puzzle = fixed('factoring', 'factor-puzzle');
  assert.deepEqual(puzzle.widget.target, [7, 12]);
  assert.match(puzzle.text, /x\^2 \+ 7x \+ 12/);
  let passes = 0;
  for (const a of sides) for (const b of sides) {
    const said = puzzle.check(model(a, b));
    assert.equal(said === true, sameFunction((x) => (x + a) * (x + b), quadValue(7, 12)), `a = ${a}, b = ${b}`);
    if (said === true) { passes++; continue; }
    if (/7 strips, as needed/.test(said)) assert.ok(a + b === 7 && said.includes(`holds ${a * b}, not 12`), said);
    else if (/holds 12, as needed/.test(said)) assert.ok(a * b === 12 && said.includes(`are ${a + b} strips, not 7`), said);
    else assert.ok(a + b !== 7 && a * b !== 12, `a = ${a}, b = ${b}: ${said}`);
  }
  assert.equal(passes, 2, '3 and 4, either way round');
  assert.equal(puzzle.check(model(puzzle.solution.a, puzzle.solution.b)), true);

  const graph = fixed('factoring', 'roots-graph');
  const wanted = graph.widget.points.map((pt) => pt.x).sort((u, v) => u - v);
  assert.deepEqual(wanted, [-1, 3]);
  passes = 0;
  for (const p of sliderValues(graph.widget.params.p)) for (const q of sliderValues(graph.widget.params.q)) {
    const y = curve(graph.widget, 0, { p, q });
    const roots = range(-6, 6).filter((x) => y(x) === 0);
    const said = graph.check({ p, q });
    assert.equal(said === true, roots.join() === wanted.join(), `p = ${p}, q = ${q}`);
    if (said === true) { passes++; continue; }
    const caught = roots.filter((x) => wanted.includes(x)).length;
    if (/touches the axis once/.test(said)) assert.equal(roots.length, 1);
    if (/One crossing is caught/.test(said)) assert.ok(caught === 1 && roots.length === 2, `p = ${p}, q = ${q}: ${said}`);
    if (/Watch the crossings/.test(said)) assert.ok(caught === 0 && roots.length === 2, `p = ${p}, q = ${q}: ${said}`);
  }
  assert.equal(passes, 2);
  assert.equal(graph.check(graph.solution), true);
});

/* ------------------------------------------------------ teach before you ask */

/**
 * The teaching screens that make each lesson teach before it asks:
 * [screen, the first step that needs it, what the screen has to contain].
 * A later edit that moves a screen behind its question, or drops the term or
 * the worked example the question relies on, fails here.
 */
const TEACHING = {
  'keeping-the-balance': [
    ['teach-undo-add', 'which-move', [/\*\*Solving\*\*/, /\*\*solution\*\*/, /\*\*subtract\*\*/, /:::example/]],
    ['teach-undo-times', 'solve-mul', [/3 \\times x/, /\*\*divide\*\*/, /:::example/]],
    ['teach-opposites', 'beyond-scale', [/\*\*opposite\*\*/, /add 7/, /divide by 7/, /multiply by 7/, /\\frac\{x\}\{7\}.*x \\div 7/, /:::example/]],
  ],
  'undoing-operations': [
    ['idea', 'scale-two-step', [/reverse order/, /subtract 3/, /divide by 2/]],
    ['example-two-step', 'order-steps', [/:::example/, /10x - 6 = 64/, /add 6/]],
    ['teach-divided', 'divide-form', [/:::example/, /fraction bar is a division/, /multiply by 10/]],
    ['teach-order', 'first-undo', [/bracket/, /undo first/, /Whatever came last is undone first/]],
  ],
  'both-sides': [
    ['teach-read-scale', 'take-boxes', [/means \$1x\$/, /one box off each pan/]],
    ['idea', 'subtract-x', [/subtract \$x\$ from both sides/, /7x - 2x = 5x/, /smaller pile/]],
    ['example-both', 'solve-both', [/:::example/, /subtract \$6x\$/, /each\*\* side/]],
    ['teach-no-solution', 'how-many-solutions', [/\*\*no solution\*\*/, /\*\*exactly one solution\*\*/, /x = 0/]],
  ],
  'growing-patterns': [
    ['teach-growing', 'build-next', [/\*\*growing pattern\*\*/, /\*\*2 tiles\*\*/]],
    ['rule', 'use-rule', [/\*\*variable\*\*/, /\*\*expression\*\*/, /:::example/, /in place of \$n/]],
    ['teach-table-rule', 'table-rule', [/:::example/, /count at step 0/, /goes up by \*\*10\*\*/]],
    ['teach-backwards', 'which-step', [/:::example/, /\*\*equation\*\*/, /2n \+ 1 = 201/]],
  ],
  'rate-of-change': [
    ['teach-rate', 'per-one', [/\*\*rate\*\*/, /:::example/, /70 \\div 10 = 7/]],
    ['teach-graph', 'make-slope', [/\*\*point\*\*/, /\*\*coordinates\*\*/, /\$x\$-axis/, /\$y\$-axis/, /\[run\]/, /\[rise\]/]],
    ['slope', 'downhill', [/\*\*slope\*\*/, /rise/, /run/]],
    ['teach-sign', 'sign-sort', [/positive/, /zero/, /negative/, /\*\*sign\*\*/, /\*\*size\*\*/]],
    ['example-two-points', 'two-points', [/:::example/, /second point minus first/, /5 - 20 = -15/, /8 - 3 = 5/]],
  ],
  lines: [
    ['equation', 'match-line', [/\$y\$-intercept/, /\*\*slope\*\*/]],
    ['example-read-line', 'read-line', [/:::example/, /cross the \$y\$-axis/, /1 step to the right/, /y = -x \+ 2/, /y = 3\./]],
    ['teach-story', 'story-equation', [/:::example/, /\*\*rate\*\* is \$m\$/, /\*\*start\*\* is \$b/, /50x \+ 200 = 500/]],
    ['example-draw', 'draw-line', [/:::example/, /intercept/, /1 across/, /step \*\*down\*\*/]],
    ['example-through', 'through-two-points', [/:::example/, /\*\*Slope\.\*\*/, /\*\*Intercept\.\*\*/]],
  ],
  systems: [
    ['teach-two-lines', 'find-crossing', [/y = 2x \+ 10/, /y = 4x/, /\*\*lower\*\*/]],
    ['system', 'read-crossing', [/\*\*system\*\*/, /\*\*solution\*\*/, /negative/]],
    ['example-set-equal', 'set-equal', [/:::example/, /\*\*same\*\* \$y/, /subtract \$4x\$/, /either equation/]],
    ['teach-parallel', 'never-cross', [/\*\*parallel\*\*/, /\*\*no solution\*\*/, /Different slopes/, /in \$y = 4\$ it is 0/]],
  ],
  parabolas: [
    ['teach-square', 'table', [/\*\*squared\*\*/, /x \\times x/, /\(-2\)\^2 = \(-2\) \\times \(-2\) = 4/]],
    ['shape', 'stretch-a', [/\*\*parabola\*\*/, /\*\*vertex\*\*/, /\*\*symmetric\*\*/]],
    ['teach-a', 'which-way', [/narrower/, /wider/, /hill/, /in front of \$x\^2\$/, /x\^2 - 5/]],
    ['teach-vertex', 'sign-trap', [/:::example/, /vertex at \$\(h, k\)\$/, /bracket is zero/]],
    ['teach-roots', 'two-solutions', [/\*\*roots\*\*/, /:::example/, /\(-20\) \\times \(-20\) = 400/, /halfway between/]],
    ['teach-how-many', 'how-many', [/twice/, /once/, /never/, /hill/]],
  ],
  factoring: [
    ['teach-area', 'square', [/\*\*multiplied\*\*/, /\*\*four parts\*\*/, /x \\times x = x\^2/]],
    ['expanding', 'expand', [/\*\*expanding\*\*/, /\*\*terms\*\*/, /:::example/]],
    ['teach-factoring', 'factor', [/\*\*quadratic\*\*/, /\*\*factoring\*\*/, /:::example/, /\*\*product\*\*/, /\*\*sum\*\*/]],
    ['teach-factor-signs', 'factor-signs', [/\(x - 2\)\(x - 10\)/, /\(x \+ 2\)\(x - 10\)/, /\(x - 2\)\(x \+ 10\)/, /larger number/]],
    ['teach-zero-product', 'solve-factored', [/\*\*zero-product property\*\*/, /:::example/, /One bracket must be zero/]],
    ['example-zero-side', 'garden', [/:::example/, /subtract 130/, /product \$-130\$ and the sum 3/, /makes sense/]],
  ],
};

test('every lesson: teach before you ask', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const id of LESSONS) {
    const steps = lessons[id].steps.map((raw) => fixed(id, raw.id));      // resolved, as the player sees them
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    assert.ok(roles.filter((kind) => kind === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.ok(steps.length >= 12 && steps.length <= 20, `${id}: ${steps.length} steps`);
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length, `${id}: step ids are unique`);
    for (const [teachId, askId, needs] of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === teachId);
      const ask = steps.findIndex((s) => s.id === askId);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${teachId}" exists`);
      assert.ok(ask > at, `${id}: "${teachId}" comes before "${askId}"`);
      assert.equal(roles[ask], 'graded', `${id}/${askId} is the question that "${teachId}" serves`);
      for (const needed of needs) assert.match(steps[at].text.replace(/\s+/g, ' '), needed, `${id}/${teachId} teaches what "${askId}" asks for`);
    }
  }
});

test('every form that "which move first" can ask about is on the screen before it', () => {
  // the four forms of first-undo: ax + b, ax - b, x/a + b and a(x + b)
  const table = fixed('undoing-operations', 'teach-order').text;
  const rows = Array.from(table.matchAll(/\|\s*\$\\mathord\{([^$|]+=[^$|]+)\}\$\s*\|[^|]*: ([a-z]+ (?:by )?\d+)\s*\|/g), (m) => [m[1].replace('\\dfrac', '\\frac'), m[2]]);
  assert.equal(rows.length, 4);
  const formOf = (eq) => (eq.includes('(') ? 'brackets' : eq.includes('\\frac') ? 'divided' : / - /.test(eq) ? 'minus' : 'plus');
  assert.deepEqual(rows.map(([eq]) => formOf(eq)).sort(), ['brackets', 'divided', 'minus', 'plus']);
  const first = { brackets: /^divide by/, divided: /^subtract/, minus: /^add/, plus: /^subtract/ };
  for (const [eq, move] of rows) {
    assert.match(move, first[formOf(eq)], `first move for ${eq}`);
    const g = gap(eq);
    const x = -g(0) / (g(1) - g(0));
    near(x, Math.round(x), `${eq} has a whole-number solution`);
  }
  const seen = new Set();
  eachVariant('undoing-operations', 'first-undo', (step) => {
    const eq = displayMath(step.text);
    seen.add(formOf(eq));
    assert.ok(!rows.some(([shown]) => shown === eq), `${eq} is a row of the teaching table`);
  });
  assert.deepEqual([...seen].sort(), ['brackets', 'divided', 'minus', 'plus']);
});

test('worked examples use numbers that the practice generators cannot produce', () => {
  /** [lesson, teaching screen, text of the example on that screen, generated step, does this variant repeat the example?] */
  const sameMath = (shown) => (step) => displayMath(step.text).replace(/\s+/g, ' ') === shown;
  const sameLine = (shown) => (step) => equivalent(step.answer, shown, ['x']);
  const mentions = (shown) => (step) => step.text.includes(shown);
  const cases = [
    ['keeping-the-balance', 'teach-undo-add', 'x + 20 = 50', 'solve-add', sameMath('x + 20 = 50')],
    ['keeping-the-balance', 'teach-undo-times', '10x = 70', 'solve-mul', sameMath('10x = 70')],
    ['keeping-the-balance', 'teach-opposites', '\\frac{x}{10} = 4', 'mixed', sameMath('\\frac{x}{10} = 4')],
    ['undoing-operations', 'example-two-step', '10x - 6 = 64', 'solve-two-step', mentions('10x')],
    ['undoing-operations', 'teach-divided', '\\dfrac{x}{10} - 4 = 2', 'solve-divided', mentions('\\frac{x}{10}')],
    ['both-sides', 'example-both', '9x + 20 = 6x + 50', 'solve-both', mentions('= 6x')],
    ['both-sides', 'idea', '3x + 2 &= x + 10', 'subtract-x', mentions('= x +')],
    ['both-sides', 'example-both', '9x + 20 = 6x + 50', 'solve-minus', mentions('= 6x')],
    ['growing-patterns', 'rule', 'Step 40', 'use-rule', mentions('step 40?')],
    ['growing-patterns', 'teach-table-rule', '| Count | 13 | 23 | 33 | 43 |', 'table-rule', mentions('| 13 | 23 | 33 | 43 |')],
    ['growing-patterns', 'teach-backwards', '2n + 1 = 201', 'which-step', mentions('**201 matchsticks**')],
    ['rate-of-change', 'teach-rate', '| 5 | 75 | 145 | 215 |', 'per-one', mentions('| 0 | 10 | 20 | 30 |')],
    ['rate-of-change', 'example-two-points', '$(3, 20)$ and $(8, 5).$', 'two-points', (step) => { const [p, q] = points(step.text); return q.x - p.x === 5; }],
    ['lines', 'example-read-line', 'y = 3x - 4', 'read-line', sameLine('3x - 4')],
    ['lines', 'teach-story', 'y = 50x + 200', 'story-equation', sameLine('50x + 200')],
    ['lines', 'teach-story', '50x + 200 = 500', 'story-backwards', (step) => { const [start, rate] = ints(step.text); return start === 200 || rate === 50; }],
    ['lines', 'example-through', 'y = 5x - 3', 'through-two-points', sameLine('5x - 3')],
    ['systems', 'example-set-equal', 'y = 7x + 2', 'solve-system', mentions('7x')],
    ['parabolas', 'teach-vertex', 'y = (x + 9)^2 - 10', 'lowest', sameMath('y = (x + 9)^2 - 10')],
    ['parabolas', 'teach-roots', 'x^2 = 400', 'two-solutions', mentions('x^2 = 400')],
    ['factoring', 'expanding', '(x + 10)(x + 20)', 'expand', mentions('(x + 10)')],
    ['factoring', 'teach-factoring', 'x^2 + 12x + 20', 'factor', mentions('x^2 + 12x + 20$')],
    ['factoring', 'teach-factor-signs', 'x^2 - 8x - 20', 'factor-signs', mentions('x^2 - 8x - 20\\')],
    ['factoring', 'teach-zero-product', 'x^2 - 12x + 20 = 0', 'solve', sameMath('x^2 - 12x + 20 = 0')],
    ['factoring', 'example-zero-side', 'x(x + 3) = 130', 'garden', mentions('Its area is **130 m²**')],
  ];
  for (const [lessonId, teachId, shown, stepId, repeats] of cases) {
    const ids = lessons[lessonId].steps.map((s) => s.id);
    assert.ok(fixed(lessonId, teachId).text.includes(shown), `${lessonId}/${teachId} shows "${shown}"`);
    assert.ok(ids.indexOf(teachId) < ids.indexOf(stepId), `${lessonId}: "${teachId}" comes before "${stepId}"`);
    eachVariant(lessonId, stepId, (step) => assert.ok(!repeats(step), `the worked example "${shown}" came back as the question`));
  }
  // the example inside the prompt of expand-signs is never the question under it
  eachVariant('factoring', 'expand-signs', (step) => {
    assert.match(step.text, /:::example[\s\S]*\(x - 10\)\(x \+ 3\)[\s\S]*x\^2 - 7x - 30/);
    assert.ok(!/\\;\(x - 10\)/.test(step.text), 'the question differs from the example above it');
  });
  assert.ok(sameFunction((x) => (x - 10) * (x + 3), quadValue(-7, -30)));
});

test('the worked examples on the teaching screens are right', () => {
  // lessons 1 to 3: every line of a worked solution has the same solution
  for (const [eqs, x] of [
    [['x + 20 = 50', 'x = 50 - 20', 'x = 30'], 30],
    [['10x = 70', 'x = 70 / 10'], 7],
    [['x / 10 = 4', 'x = 4 * 10'], 40],
    [['10x - 6 = 64', '10x = 70'], 7],
    [['x / 10 - 4 = 2', 'x / 10 = 6'], 60],
    [['7x + 10 = 80', '7x - 10 = 60'], 10],
    [['x / 7 + 10 = 12'], 14],
    [['7(x + 10) = 84', 'x + 10 = 12'], 2],
    [['9x + 20 = 6x + 50', '3x + 20 = 50', '3x = 30'], 10],
    [['6x = 2x', '4x = 0'], 0],
    [['2x + 1 = 201', '2x = 200'], 100],
    [['50x + 200 = 500', '50x = 300'], 6],
    [['7x + 2 = 4x + 32', '3x + 2 = 32'], 10],
  ]) for (const eq of eqs) { const g = gap(eq); near(g(x), 0, eq); assert.ok(Math.abs(g(x + 1)) > 1e-9, `${eq} has one solution`); }
  assert.equal(9 * 10 + 20, 110); assert.equal(6 * 10 + 50, 110);
  // lesson 4
  assert.equal(2 * 40 + 1, 81);
  [13, 23, 33, 43].forEach((count, i) => assert.equal(10 * (i + 1) + 3, count));
  // lesson 5
  [5, 75, 145, 215].forEach((metres, i) => assert.equal(7 * (10 * i) + 5, metres));
  [1, 3, 5, 7].forEach((y, x) => assert.equal(2 * x + 1, y));
  assert.equal((5 - 20) / (8 - 3), -3);
  // lesson 6
  const through = (m, b, pts) => pts.forEach(([x, y]) => assert.equal(m * x + b, y));
  through(3, -4, [[0, -4], [1, -1]]);
  through(3, -1, [[0, -1], [1, 2]]);
  through(5, -3, [[2, 7], [4, 17]]);
  // lesson 7
  assert.equal(7 * 10 + 2, 72); assert.equal(4 * 10 + 32, 72);
  for (const x of [-2, 0, 3.5]) assert.equal((2 * x + 2) - (2 * x - 3), 5);
  // lesson 8
  assert.deepEqual([3, 6, 10, -2].map((x) => x * x), [9, 36, 100, 4]);
  assert.deepEqual(extremum((x) => (x + 9) ** 2 - 10, -12, 12, 0.5), { at: -9, value: -10 });
  assert.deepEqual(extremum((x) => (x - 3) ** 2 - 2, -12, 12, 0.5), { at: 3, value: -2 });
  assert.equal(20 * 20, 400); assert.equal((-20) * (-20), 400);
  // lesson 9
  assert.ok(sameFunction((x) => (x + 10) * (x + 20), quadValue(30, 200)));
  assert.deepEqual(range(1, 20).filter((a) => a * a <= 20 && 20 % a === 0).map((a) => [a, 20 / a]), [[1, 20], [2, 10], [4, 5]]);
  for (const [a, b, shown] of [[2, 10, 'x^2 + 12x + 20'], [-2, -10, 'x^2 - 12x + 20'], [2, -10, 'x^2 - 8x - 20'], [-2, 10, 'x^2 + 8x - 20']]) {
    const [s, p] = quadCoefficients(shown);
    assert.ok(sameFunction((x) => (x + a) * (x + b), quadValue(s, p)), shown);
    const row = fixed('factoring', 'teach-factor-signs').text.split('\n').find((line) => line.includes('{' + shown + '}$ |'));
    assert.ok(row, 'the table has a row for ' + shown);
    assert.ok(sameFunction(fn(/\{(\(x [+-] \d+\)\(x [+-] \d+\))\}\$/.exec(row)[1]), quadValue(s, p)), 'the factored form in the row for ' + shown);
  }
  assert.deepEqual(wholeRoots(-12, 20), [2, 10]);
  assert.deepEqual(wholeRoots(3, -130), [-13, 10]);
});

/* --------------------------------------------------------- all nine lessons */

/** Every piece of text a learner can see in a concrete step. */
function strings(step) {
  const out = [step.title, step.text, step.explain, step.template, step.model, step.prefix, step.unit, ...(step.hints || [])];
  for (const o of step.options || []) out.push(o.text, o.why);
  for (const item of step.items || []) out.push(typeof item === 'string' ? item : item.text, item.why);
  for (const pair of step.pairs || []) out.push(...pair);
  for (const w of step.wrong || []) out.push(w[1]);
  for (const fig of [...(step.figures || []), step.widget].filter(Boolean)) out.push(fig.alt);
  return out.filter((text) => typeof text === 'string');
}

test('every lesson: one right answer per choice, no repeated options, no broken text, no "wrong" answer that is right', () => {
  for (const id of LESSONS) {
    for (const raw of lessons[id].steps) {
      const runs = typeof raw.gen === 'function' ? SEEDS : 1;
      for (let seed = 1; seed <= runs; seed++) {
        const step = resolveStep(raw, makeRng(seed * 104729 + 5), raw.id);
        const where = `${id}/${raw.id} (seed ${seed})`;
        for (const text of strings(step)) assert.ok(!/undefined|NaN|Infinity|\[object/.test(text), `${where}: "${text.slice(0, 90)}"`);
        if (step.type === 'choice' || step.type === 'multi') {
          const texts = step.options.map((o) => o.text.trim());
          assert.equal(new Set(texts).size, texts.length, `${where}: an option is repeated`);
          const right = step.options.filter((o) => o.correct).length;
          if (step.type === 'multi') assert.ok(right >= 1, `${where}: at least one correct option`);
          else if (step.mode === 'predict') assert.ok(right <= 1, `${where}: at most one correct option`);
          else assert.equal(right, 1, `${where}: exactly one correct option`);
        }
        if (step.type === 'numeric') {
          assert.ok(Number.isFinite(step.answer), `${where}: the answer is a number`);
          for (const [value] of step.wrong) assert.ok(Math.abs(value - step.answer) > 1e-9, `${where}: "wrong" lists the answer`);
        }
        if (step.type === 'expr') for (const [wrong] of step.wrong) assert.ok(!equivalent(String(wrong), step.answer, step.vars), `${where}: "wrong" lists the answer`);
        if (step.type === 'fill') for (const b of step.blanks) assert.ok(b.kind === 'select' ? b.options.includes(b.answer) : b.answers.length > 0, `${where}: a blank has no answer`);
      }
    }
  }
});

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
  }
});
