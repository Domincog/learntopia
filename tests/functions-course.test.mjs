/**
 * Algebra II: Functions & Growth — independent checks of the course.
 *
 * Every generator is run with many seeds and its answer is worked out again
 * here from the *text the learner sees* (or from the figure they look at),
 * by brute force or by a different route than the generator took. Every
 * interactive check is run against every state its widget can reach. A slip
 * in a lesson therefore shows up as a failing test, not as a wrong answer.
 *
 *   node --test tests/functions-course.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { compile, equivalent, parseNumber } from '../src/core/mathexpr.js';

const SEEDS = 300;
const COURSE = 'functions';
const LESSONS = ['function-machines', 'transformations', 'inequalities', 'exponents', 'exponential-growth', 'logarithms', 'quadratic-formula'];
/** Every generated step of the course. Each one is re-derived by a test below; the last tests keep this list complete. */
const GENERATED = {
  'function-machines': ['evaluate', 'plug-expression', 'read-graph', 'which-table', 'meaning', 'twice'],
  transformations: ['special-point', 'write-formula', 'point-moves'],
  inequalities: ['read-picture', 'solve', 'solve-compound', 'limit'],
  exponents: ['multiply', 'negative', 'simplify', 'half-power', 'cube-root'],
  'exponential-growth': ['write-rule', 'half-life', 'doubling', 'chessboard', 'find-factor', 'folds'],
  logarithms: ['evaluate', 'product-rule', 'power-rule', 'solve', 'quake', 'direct'],
  'quadratic-formula': ['complete-practice', 'abc', 'use-formula', 'set-up', 'how-many', 'balcony'],
};
const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/${COURSE}/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, COURSE, id);
}
/** The generated steps that a test in this file has really re-derived. */
const rederived = new Set();

/** Run a step's generator with many seeds and hand each concrete step to `verify`. */
function eachVariant(lessonId, stepId, verify) {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  assert.equal(typeof raw.gen, 'function', `${lessonId}/${stepId} is generated`);
  assert.ok(GENERATED[lessonId].includes(stepId), `${lessonId}/${stepId} is listed in GENERATED`);
  rederived.add(`${lessonId}/${stepId}`);
  for (let seed = 1; seed <= SEEDS; seed++) {
    const step = resolveStep(raw, makeRng(seed * 7919 + 13), stepId);
    try { verify(step, seed); } catch (err) { err.message = `${lessonId}/${stepId} (seed ${seed}): ${err.message}\n  text: ${step.text.replace(/\s+/g, ' ').trim()}`; throw err; }
  }
}

/* ------------------------------------------------------------ helpers */

/** Turn the TeX used in the lessons into an expression that mathexpr can evaluate. */
function plain(tex) {
  let out = tex.replace(/\{,\}/g, '').replace(/\\left|\\right/g, '').replace(/\\[;,!]/g, ' ');
  out = out.replace(/\\lvert/g, 'abs(').replace(/\\rvert/g, ')').replace(/\\[dt]?frac(\d)(\d)/g, '(($1)/($2))');
  for (let i = 0; i < 6; i++) {
    out = out.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
    out = out.replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)');
    out = out.replace(/\^\{([^{}]*)\}/g, '^($1)');
  }
  return out.replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/').replace(/[.]\s*$/, '').trim();
}
const displayMath = (text, i = 0) => { const all = Array.from(text.matchAll(/\$\$([\s\S]+?)\$\$/g), (m) => m[1].trim()); assert.ok(all[i] != null, 'has display math'); return all[i]; };
const fn = (expr, v = 'x', fns) => { const f = compile(plain(expr), { vars: [v], fns }); return (value) => f({ [v]: value }); };
const value = (tex) => compile(plain(tex), { vars: [] })({});
const near = (a, b, msg, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b)), `${msg || 'values differ'}: ${a} vs ${b}`);
/** Every whole number in a piece of text, in order, with thousands separators read correctly. */
const ints = (text) => (text.replace(/(\d),(?=\d{3})/g, '$1').match(/-?\d+/g) || []).map(Number);
const num = (text) => Number(String(text).replace(/\{,\}|,/g, ''));
const correctOption = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, 'exactly one correct option'); return right[0]; };
const mathIn = (text) => { const m = /\$([^$]+)\$/.exec(text); assert.ok(m, `"${text}" contains math`); return m[1]; };
const blank = (step, i) => step.blanks[i].numbers[0];
const picked = (step, i) => step.blanks[i].answer;
/** A step in the shape the player sees (blanks parsed, options normalised). */
const fixed = (lessonId, stepId, seed = 1) => {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  return resolveStep(raw, makeRng(seed), stepId);
};
const range = (lo, hi, by = 1) => { const out = []; for (let i = 0; lo + i * by <= hi + 1e-9; i++) out.push(Math.round((lo + i * by) * 1e6) / 1e6); return out; };
const sliderValues = (def) => range(def.min, def.max, def.step || 1);
/** Curve number `i` of a plot spec as a function of x, with the sliders at `params`. */
const curve = (spec, i, params = {}) => { const f = compile(spec.fns[i].expr, { vars: ['x', ...Object.keys(spec.params || {})] }); return (x) => f({ ...params, x }); };
/** The lowest value of f on a grid and where it is reached. */
function lowest(f, lo, hi, by) {
  let best = Infinity; let at = null;
  for (const x of range(lo, hi, by)) { const y = f(x); if (Number.isFinite(y) && y < best - 1e-12) { best = y; at = x; } }
  return { at, value: best };
}
const SIGN = { '<': (a, b) => a < b - 1e-9, '>': (a, b) => a > b + 1e-9, '≤': (a, b) => a <= b + 1e-9, '≥': (a, b) => a >= b - 1e-9 };
const SIGN_OF_TEX = { '<': '<', '>': '>', '\\le': '≤', '\\ge': '≥' };
/** A polynomial ax² + bx + c read back from the way it is displayed, by evaluating it. */
function coefficients(tex, v = 'x') {
  const p = fn(tex, v);
  const c = p(0);
  const a = (p(1) + p(-1)) / 2 - c;
  const b = (p(1) - p(-1)) / 2;
  near(p(3), 9 * a + 3 * b + c, `"${tex}" is a quadratic`);
  return { a, b, c, p };
}
const tidy = (text) => {
  assert.ok(!/(^|[^\d.{^])1[a-z](?![a-z])/.test(text.replace(/\\[a-z]+/g, ' ')), `no "1x" in "${text}"`);
  assert.ok(!/\+ -|- -|\+ \+|- \+/.test(text), `no doubled signs in "${text}"`);
};

/* ------------------------------------------------ lesson 1: function machines */

test('function-machines: f(k) is the rule with k put in', () => {
  eachVariant('function-machines', 'evaluate', (step) => {
    const m = /^([fgh])\(x\) = (.+)$/.exec(displayMath(step.text));
    assert.ok(m, 'the rule is shown as f(x) = …');
    tidy(m[2]);
    const ask = /\*\*What is \$([fgh])\((-?\d+)\)\$\?\*\*/.exec(step.text);
    assert.ok(ask && ask[1] === m[1], 'the question uses the same name as the rule');
    const k = Number(ask[2]);
    const rule = fn(m[2]);
    near(rule(k), step.answer, 'the answer');
    assert.ok(step.explain.includes(`= ${step.answer}$`), 'the explanation ends at the answer');
    for (const [wrong, message] of step.wrong) {
      assert.notEqual(wrong, step.answer);
      if (/negative number times itself/.test(message)) assert.ok(k < 0, 'only said when the input is negative');
      if (/The rule also says/.test(message)) near(wrong, rule(k) - rule(0), 'that value is the x-term alone');
    }
  });
});

test('function-machines: f(a + s) replaces x by the whole input', () => {
  eachVariant('function-machines', 'plug-expression', (step) => {
    const rule = fn(/^f\(x\) = (.+)$/.exec(displayMath(step.text))[1]);
    const shift = Number(/\$f\(a \+ (\d+)\)\$/.exec(step.text)[1]);
    const answer = fn(step.answer, 'a');
    for (const a of [-3, 0, 0.5, 7]) near(answer(a), rule(a + shift), `at a = ${a}`);
    assert.ok(!/[()]/.test(step.answer), 'the key has no brackets');
    tidy(step.answer);
    assert.equal(step.wrong.length, 2);
    const [plusAfter, noShift] = step.wrong.map(([expr]) => fn(String(expr), 'a'));
    for (const a of [-2, 1, 4]) { near(plusAfter(a), rule(a) + shift, 'the first slip is f(a) + s'); near(noShift(a), rule(a), 'the second slip is f(a)'); }
    for (const [expr] of step.wrong) assert.ok(!equivalent(String(expr), step.answer, ['a']), `${expr} is a wrong answer`);
  });
});

test('function-machines: a value read from a graph', () => {
  eachVariant('function-machines', 'read-graph', (step) => {
    const fig = step.figures[0];
    const k = Number(/\*\*Find \$h\((-?\d+)\)\$\.\*\*/.exec(step.text)[1]);
    const h = curve(fig, 0);
    near(h(k), step.answer, 'the height of the curve at that input');
    assert.ok(Number.isInteger(step.answer), 'a whole number, so it can be read off the grid');
    assert.ok(k > fig.x[0] && k < fig.x[1] && step.answer > fig.y[0] && step.answer < fig.y[1], 'the point is inside the window');
    const start = fig.points[0];
    assert.notEqual(start.x, k, 'the draggable point does not start on the answer');
    assert.equal(start.snap, 1);
    for (const [wrong] of step.wrong) assert.notEqual(wrong, step.answer);
  });
});

test('function-machines: exactly one of the three machines gives two outputs for one input', () => {
  eachVariant('function-machines', 'which-table', (step) => {
    const lines = Array.from(step.text.matchAll(/\*\*Machine ([ABC]):\*\* ([^\n]+)/g), (m) => [m[1], Array.from(m[2].matchAll(/(-?\d+) → (-?\d+)/g), (p) => [Number(p[1]), Number(p[2])])]);
    assert.equal(lines.length, 3);
    const broken = [];
    for (const [letter, pairs] of lines) {
      assert.equal(pairs.length, 4);
      const seen = new Map();
      let isFunction = true;
      for (const [x, y] of pairs) { if (seen.has(x) && seen.get(x) !== y) isFunction = false; seen.set(x, y); }
      if (!isFunction) broken.push(letter);
      const option = step.options.find((o) => o.text === `Machine ${letter}`);
      assert.equal(!!option.correct, !isFunction, `Machine ${letter}`);
      if (isFunction) {
        const outputs = pairs.map((p) => p[1]);
        const shares = new Set(outputs).size < outputs.length;
        assert.equal(/share an output/.test(option.why), shares, `what is said about Machine ${letter}`);
        if (shares) { const [u, v, w] = ints(option.why); assert.ok(pairs.some((p) => p[0] === u && p[1] === w) && pairs.some((p) => p[0] === v && p[1] === w) && u !== v, 'the two inputs named really share that output'); }
      } else {
        const [x, y1, y2] = ints(step.explain);
        assert.ok(pairs.some((p) => p[0] === x && p[1] === y1) && pairs.some((p) => p[0] === x && p[1] === y2) && y1 !== y2, 'the explanation quotes the repeated input');
      }
    }
    assert.equal(broken.length, 1);
  });
});

test('function-machines: reading f(p) = q in a story', () => {
  eachVariant('function-machines', 'meaning', (step) => {
    const m = /\*\*What does \$([A-Za-z])\((\d+)\) = (\d+)\$ say\?\*\*/.exec(step.text);
    assert.ok(m);
    const [p, q] = [Number(m[2]), Number(m[3])];
    assert.notEqual(p, q);
    assert.ok(step.text.includes(`$${m[1]}(`), 'the function is introduced in the story');
    assert.deepEqual(ints(correctOption(step).text), [p, q], 'input first, output second');
    const swapped = step.options.filter((o) => !o.correct && ints(o.text).join() === [q, p].join());
    assert.equal(swapped.length, 1, 'one option swaps input and output');
    for (const o of step.options) if (!o.correct) assert.ok(o.why, `"${o.text}" explains itself`);
  });
});

test('function-machines: feeding a function its own output', () => {
  eachVariant('function-machines', 'twice', (step) => {
    const rule = fn(/^f\(x\) = (.+)$/.exec(displayMath(step.text))[1]);
    const k = Number(/\$f\(f\((\d+)\)\)\$/.exec(step.text)[1]);
    near(rule(rule(k)), step.answer);
    assert.notEqual(rule(k), k, 'the input is not a fixed point');
    for (const [wrong, message] of step.wrong) {
      assert.notEqual(wrong, step.answer);
      if (/^That is \$f/.test(message)) near(wrong, rule(k));
      if (/not twice/.test(message)) near(wrong, 2 * rule(k));
    }
    assert.ok(step.explain.includes(`= ${step.answer}$`));
  });
});

test('function-machines: the interactive checks', () => {
  // the machine f: double, then add 1
  const feed = fixed('function-machines', 'feed');
  assert.deepEqual(feed.widget.ops, ['*2', '+1']);
  for (const input of range(feed.widget.min, feed.widget.max)) {
    const output = 2 * input + 1;
    const said = feed.check({ input, output, hit: output === feed.widget.target });
    assert.equal(said === true, output === 13, `input ${input}`);
    if (said !== true) assert.equal(/Too small/.test(said), output < 13, `input ${input}: ${said}`);
  }
  assert.equal(2 * feed.solution.input + 1, 13);

  // five points on g(x) = x² - 3
  const plot = fixed('function-machines', 'plot-it');
  const g = fn(/g\(x\) = ([^$]+) \$\$/.exec(plot.text)[1]);
  const ids = plot.widget.points.map((p) => p.id);
  const xs = plot.widget.points.map((p) => p.x);
  const heights = range(plot.widget.y[0], plot.widget.y[1]);
  let passes = 0;
  const visit = (i, state) => {
    if (i === ids.length) {
      const said = plot.check(state);
      const right = ids.every((id) => state[id].y === g(state[id].x));
      assert.equal(said === true, right);
      if (said === true) { passes++; return; }
      const named = /at \$x = (-?\d+)\$/.exec(said);
      if (named) { const id = ids[xs.indexOf(Number(named[1]))]; assert.notEqual(state[id].y, g(state[id].x), 'the point that is named is really off'); }
      else assert.ok(ids.every((id) => state[id].y === 0), 'the general nudge is only given at the start');
      return;
    }
    for (const y of heights) { state[ids[i]] = { x: xs[i], y }; visit(i + 1, state); }
  };
  visit(0, {});
  assert.equal(passes, 1);
  assert.equal(plot.check(plot.solution), true);
  assert.deepEqual(xs.map(g), [1, -2, -3, -2, 1], 'the outputs quoted in the explanation');

  // the vertical line on the sideways parabola
  const line = fixed('function-machines', 'vertical-line');
  for (const x of range(line.widget.x[0], line.widget.x[1])) {
    const outputs = new Set([0, 1].map((i) => curve(line.widget, i)(x)).filter(Number.isFinite));
    const said = line.check({ P: { x, y: 0 } });
    assert.equal(said === true, outputs.size === 2, `x = ${x}`);
    if (/meets the curve once/.test(said)) assert.equal(outputs.size, 1);
    if (/misses the curve/.test(said)) assert.equal(outputs.size, 0);
    assert.equal(line.widget.readouts[0].value({ P: { x, y: 0 } }), outputs.size, 'the readout counts the outputs');
  }
  assert.equal(line.check(line.solution), true);
});

test('function-machines: fixed facts', () => {
  // the graphs that are functions are exactly those drawn from a single rule
  for (const o of fixed('function-machines', 'graphs').options) {
    const fig = o.figure;
    let twice = false;
    for (const x of range(fig.x[0] + 0.25, fig.x[1] - 0.25, 0.5)) {
      const ys = fig.fns.map((f, i) => { const y = curve(fig, i)(x); const inside = (f.from == null || x >= f.from) && (f.to == null || x <= f.to); return inside && Number.isFinite(y) ? Math.round(y * 1e6) : null; }).filter((y) => y !== null);
      if (new Set(ys).size > 1) twice = true;
    }
    assert.equal(!!o.correct, !twice, o.figure.alt);
    if (!o.correct) assert.ok(o.why);
  }
  // which inputs each machine accepts
  const tests = [-7, -3, -0.5, 0, 2, 3, 9];
  for (const item of fixed('function-machines', 'domain').items) {
    const f = fn(mathIn(item.text).replace(/^[a-z]\(x\) = /, ''));
    const refused = tests.filter((x) => !Number.isFinite(f(x)));
    const expected = refused.length === 0 ? 0 : refused.length === 1 ? 1 : 2;
    assert.equal(item.bucket, expected, item.text);
    if (expected === 2) assert.deepEqual(refused, tests.filter((x) => x < 0), 'refuses exactly the negative inputs');
  }
  assert.equal(2 * 4 + 1, 9);
});

/* -------------------------------------------------- lesson 2: transformations */

test('transformations: the special point of a moved graph', () => {
  eachVariant('transformations', 'special-point', (step) => {
    const tex = displayMath(step.text).replace(/^y = /, '');
    tidy(tex);
    const f = fn(tex.replace(/\|([^|]+)\|/, 'abs($1)'));
    let at; let height;
    if (/\\sqrt/.test(tex)) {
      assert.match(step.text, /Where does this curve \*\*start\*\*/);
      at = range(-12, 12, 0.5).find((x) => Number.isFinite(f(x)));       // the first input the root accepts
      height = f(at);
    } else {
      assert.match(step.text, tex.includes('|') ? /\*\*corner\*\* of this V/ : /\*\*vertex\*\* of this parabola/);
      ({ at, value: height } = lowest(f, -12, 12, 0.5));
    }
    assert.equal(blank(step, 0), at, 'x of the special point');
    assert.equal(blank(step, 1), height, 'y of the special point');
    assert.notEqual(Math.abs(at), Math.abs(height), 'the two blanks cannot be swapped unnoticed');
    assert.ok(step.explain.includes(`$(${at},\\ ${height})$`), 'the explanation names the same point');
    assert.ok(step.explain.includes(`${Math.abs(at)} to the ${at > 0 ? 'right' : 'left'}`) && step.explain.includes(`${Math.abs(height)} ${height > 0 ? 'up' : 'down'}`));
  });
});

test('transformations: the formula of a moved graph', () => {
  const f = (x) => x ** 3 - 2 * x + 1;      // any function without symmetry will do
  eachVariant('transformations', 'write-formula', (step) => {
    const m = /moved \*\*(\d+) to the (right|left)\*\* and \*\*(\d+) (up|down)\*\*/.exec(step.text);
    assert.ok(m);
    const dx = (m[2] === 'right' ? 1 : -1) * Number(m[1]);
    const dy = (m[4] === 'up' ? 1 : -1) * Number(m[3]);
    assert.match(step.template, /^\$y = f\(x\$ \[\[[^\]]+\]\] \[\[\d+\]\] \$\)\$ \[\[[^\]]+\]\] \[\[\d+\]\]$/);
    const signed = (i) => (picked(step, i) === '+' ? 1 : -1) * blank(step, i + 1);
    assert.ok(['+', '−'].includes(picked(step, 0)) && ['+', '−'].includes(picked(step, 2)));
    const moved = (x) => f(x + signed(0)) + signed(2);
    // moving a graph by (dx, dy) carries every point (p, f(p)) to (p + dx, f(p) + dy)
    for (const p of [-2, 0, 0.5, 3]) near(moved(p + dx), f(p) + dy, `the point above ${p}`);
    assert.ok(step.explain.includes(`$y = f(x ${dx > 0 ? '-' : '+'} ${Math.abs(dx)}) ${dy > 0 ? '+' : '-'} ${Math.abs(dy)}$`));
  });
});

test('transformations: where one known point goes', () => {
  eachVariant('transformations', 'point-moves', (step) => {
    const pt = /The point \$\((-?\d+),\\ (-?\d+)\)\$ lies/.exec(step.text);
    const [p, q] = [Number(pt[1]), Number(pt[2])];
    const formula = /\$\\;y = (.+?)\\,\$\?\*\*/.exec(step.text)[1];
    tidy(formula);
    // a function through (p, q) that takes no value twice
    const f = (t) => q + (t - p) ** 3 + (t - p);
    const g = fn(formula, 'x', { f });
    const [x, y] = [blank(step, 0), blank(step, 1)];
    near(g(x), y, 'the new point is on the new graph');
    // and it is the image of (p, q): the new formula uses f exactly at p
    const used = [];
    fn(formula, 'x', { f: (t) => { used.push(t); return f(t); } })(x);
    assert.deepEqual(used, [p], 'the new formula calls f at the known input');
    assert.ok(step.explain.includes(`= ${y}$`), 'the explanation ends at the same height');
  });
});

test('transformations: the interactive checks', () => {
  const slide = fixed('transformations', 'slide');
  const dot = slide.widget.points[0];
  let passes = 0;
  for (const h of sliderValues(slide.widget.params.h)) for (const k of sliderValues(slide.widget.params.k)) {
    const corner = lowest(curve(slide.widget, 1, { h, k }), -8, 8, 0.5);
    const said = slide.check({ h, k });
    assert.equal(said === true, corner.at === dot.x && corner.value === dot.y, `h = ${h}, k = ${k}`);
    if (said === true) { passes++; continue; }
    if (/went \*\*left\*\*/.test(said)) assert.ok(corner.at < 0 && said.includes(`|x + ${-corner.at}|`));
    if (/Use \$h\$ first/.test(said)) assert.notEqual(corner.at, dot.x);
    if (/^The corner is straight above/.test(said)) assert.ok(corner.at === dot.x && corner.value > dot.y);
    if (/^The corner is below/.test(said)) assert.ok(corner.at === dot.x && corner.value < dot.y);
  }
  assert.equal(passes, 1);
  assert.equal(slide.check(slide.solution), true);

  const stretch = fixed('transformations', 'stretch-flip');
  for (const a of sliderValues(stretch.widget.params.a)) {
    const f = curve(stretch.widget, 1, { a });
    const through = stretch.widget.points.every((pt) => f(pt.x) === pt.y);
    const said = stretch.check({ a });
    assert.equal(said === true, through, `a = ${a}`);
    if (said === true) continue;
    if (/Too steep/.test(said)) assert.ok(f(2) < -3);
    if (/Too flat/.test(said)) assert.ok(f(2) > -3 && f(2) < 0);
    if (/opens upwards/.test(said)) assert.ok(f(2) > 0);
    if (/flat line/.test(said)) assert.equal(f(2), 0);
  }
  assert.equal(stretch.check(stretch.solution), true);

  const mirror = fixed('transformations', 'mirror');
  const wanted = (x) => Math.sqrt(-x);
  mirror.widget.options.forEach((option, i) => {
    const f = fn(option.expr);
    const same = [-5, -4, -1, 1, 4].every((x) => (Number.isNaN(wanted(x)) ? Number.isNaN(f(x)) : Math.abs(f(x) - wanted(x)) < 1e-9));
    assert.equal(mirror.check({ picked: i }) === true, same, `graph ${'ABCD'[i]}`);
    if (!same) assert.match(mirror.check({ picked: i }), new RegExp(`Graph ${'ABCD'[i]}`));
  });
  assert.equal(mirror.check({ picked: null }), false);
  assert.equal(mirror.check(mirror.solution), true);
});

test('transformations: fixed facts', () => {
  const v = fixed('transformations', 'meet-v');
  assert.deepEqual(v.blanks.map((b) => b.numbers[0]), [-3, -1, 0, 2].map(Math.abs));
  const why = fixed('transformations', 'why-right');
  assert.deepEqual(why.blanks.map((b) => b.numbers[0]), [...[1, 2, 3, 4].map((x) => Math.abs(x - 2)), 2]);
  // the opening question: only one formula starts at (3, 2)
  for (const o of fixed('transformations', 'hook').options) {
    const f = fn(mathIn(o.text).replace(/^y = /, ''));
    const start = range(-6, 12, 0.5).find((x) => Number.isFinite(f(x)));
    assert.equal(start === 3 && f(start) === 2 && Math.abs(f(7) - 4) < 1e-9, !!o.correct, o.text);
  }
  // which inputs √(x - 3) + 2 accepts
  const accepts = range(-6, 8, 0.5).filter((x) => Number.isFinite(Math.sqrt(x - 3) + 2));
  assert.equal(Math.min(...accepts), 3);
  for (const o of fixed('transformations', 'domain').options) if (!o.correct) {
    const tried = /Try \$x = (-?\d+)\$/.exec(o.why);
    assert.ok(tried && !accepts.includes(Number(tried[1])), `"${o.text}" is refuted by an input the function refuses`);
  }
  // each formula in the matching step does what its partner says, tested on a lopsided function
  const f = (x) => (x - 1) ** 3 + 2 * x;
  const effect = {
    'Moves it 3 up': (g, x) => near(g(x), f(x) + 3),
    'Moves it 3 to the left': (g, x) => near(g(x - 3), f(x)),
    'Makes it 3 times as tall': (g, x) => near(g(x), 3 * f(x)),
    'Turns it upside down': (g, x) => near(g(x), -f(x)),
    'Mirrors it left to right': (g, x) => near(g(-x), f(x)),
  };
  for (const [formula, words] of fixed('transformations', 'match').pairs) {
    const g = fn(mathIn(formula).replace(/^y = /, ''), 'x', { f });
    for (const x of [-2, 0.5, 3]) effect[words](g, x);
  }
});

/* ----------------------------------------------------- lesson 3: inequalities */

test('inequalities: the inequality read from a picture', () => {
  eachVariant('inequalities', 'read-picture', (step) => {
    const fig = step.figures[0];
    assert.ok(fig.static && fig.mode === 'ray');
    const shaded = (x) => (fig.dir === 'right' ? x > fig.at : x < fig.at) || (fig.closed && x === fig.at);
    for (const o of step.options) {
      const m = /^\$x (<|>|\\le|\\ge) (-?\d+)\$$/.exec(o.text);
      assert.ok(m, o.text);
      const says = (x) => SIGN[SIGN_OF_TEX[m[1]]](x, Number(m[2]));
      const same = range(fig.min, fig.max, 0.5).every((x) => says(x) === shaded(x));
      assert.equal(!!o.correct, same, o.text);
      if (o.correct) continue;
      const otherSide = says(fig.at + 1) !== shaded(fig.at + 1);
      assert.equal(/other side/.test(o.why), otherSide, `what is said about ${o.text}`);
      if (!otherSide) assert.match(o.why, fig.closed ? /filled, so .* is included/ : /hollow, so .* is not included/);
    }
    correctOption(step);
    assert.match(step.explain, new RegExp(`${fig.closed ? 'filled' : 'hollow'} end`));
    assert.match(fig.alt, new RegExp(`to the ${fig.dir} of ${fig.at}\\. The end at ${fig.at} is ${fig.closed ? 'filled' : 'hollow'}`));
  });
});

test('inequalities: the solution set of a linear inequality', () => {
  let flips = 0;
  eachVariant('inequalities', 'solve', (step) => {
    const m = /^(.+?) (<|>|\\le|\\ge) (-?\d+)$/.exec(displayMath(step.text));
    assert.ok(m, 'an inequality with x on the left only');
    tidy(m[1]);
    const left = fn(m[1]);
    const holds = (x) => SIGN[SIGN_OF_TEX[m[2]]](left(x), Number(m[3]));
    const answer = (x) => SIGN[picked(step, 0)](x, blank(step, 1));
    for (const x of range(-25, 25, 0.25)) assert.equal(answer(x), holds(x), `x = ${x}`);
    const negative = left(1) - left(0) < 0;
    if (negative) flips++;
    assert.equal(/negative number/.test(step.hints[1]), negative, 'the hint about the sign');
    assert.equal(/sign flips/.test(step.explain), negative, 'the explanation about the sign');
  });
  assert.ok(flips > 100 && flips < SEEDS - 40, 'both kinds occur, so the learner has to decide each time');
});

test('inequalities: a double inequality', () => {
  eachVariant('inequalities', 'solve-compound', (step) => {
    const m = /^(-?\d+) (<|\\le) (.+?) (<|\\le) (-?\d+)$/.exec(displayMath(step.text));
    assert.ok(m, 'low, sign, middle, sign, high');
    const mid = fn(m[3]);
    const holds = (x) => SIGN[SIGN_OF_TEX[m[2]]](Number(m[1]), mid(x)) && SIGN[SIGN_OF_TEX[m[4]]](mid(x), Number(m[5]));
    const t = /^\[\[(-?\d+)\]\] \$(<|\\le)\\; x \\;(<|\\le)\$ \[\[(-?\d+)\]\]$/.exec(step.template);
    assert.ok(t, 'the template keeps the shape low, sign, x, sign, high');
    const answer = (x) => SIGN[SIGN_OF_TEX[t[2]]](blank(step, 0), x) && SIGN[SIGN_OF_TEX[t[3]]](x, blank(step, 1));
    let inside = 0;
    for (const x of range(-25, 25, 0.25)) { assert.equal(answer(x), holds(x), `x = ${x}`); if (holds(x)) inside++; }
    assert.ok(inside > 4 && blank(step, 0) < blank(step, 1));
  });
});

test('inequalities: the largest whole number under a limit', () => {
  eachVariant('inequalities', 'limit', (step) => {
    const bold = Array.from(step.text.matchAll(/\*\*(\d+) (?:kg|GB|coins)\*\*/g), (m) => Number(m[1]));
    assert.equal(bold.length, 3, 'the limit, what is already used, and the size of one item');
    const [limit, used, each] = bold;
    let most = 0;
    while (used + (most + 1) * each <= limit) most++;
    assert.equal(step.answer, most);
    assert.ok(most >= 3);
    for (const [wrong, message] of step.wrong) {
      assert.notEqual(wrong, step.answer);
      if (/Check that/.test(message)) { const [a, n, e, total, lim] = ints(message); assert.ok(a === used && e === each && n === most + 1 && total === used + n * each && lim === limit && total > limit, message); }
      if (/uses the whole/.test(message)) assert.equal(wrong, Math.floor(limit / each));
    }
    const fits = /\$(\d+) \\times (\d+) = (\d+)\$ fits (exactly|\(with (\d+) to spare\))/.exec(step.explain);
    assert.ok(fits && Number(fits[1]) === most && Number(fits[3]) === most * each);
    assert.equal(fits[4] === 'exactly' ? 0 : Number(fits[5]), limit - used - most * each, 'what is left over');
  });
});

/** The state an ineq-line probe reports after visiting `visited`, for the statement in its spec. */
function probeState(widget, visited, x = visited[visited.length - 1]) {
  const l = fn(widget.test.lhs);
  const r = fn(String(widget.test.rhs));
  const ok = (v) => SIGN[{ '<': '<', '>': '>', '<=': '≤', '>=': '≥' }[widget.test.op]](l(v), r(v));
  const all = Array.from(new Set(visited)).sort((a, b) => a - b);
  return { x, value: ok(x), trueAt: all.filter(ok), falseAt: all.filter((v) => !ok(v)), tested: all.length };
}
/** Every stretch of whole numbers lo…hi on the line that contains the starting point: what dragging a probe produces. */
const stretches = (widget) => { const out = []; for (const lo of range(widget.min, widget.x)) for (const hi of range(widget.x, widget.max)) out.push(range(lo, hi)); return out; };

test('inequalities: the probes accept exactly the visits that show where true turns into false', () => {
  const probe = fixed('inequalities', 'probe');
  assert.match(probe.text, /2x \+ 1 < 7/);
  assert.equal(probe.widget.test.lhs, '2x + 1');
  for (const visited of stretches(probe.widget)) {
    const state = probeState(probe.widget, visited);
    const said = probe.check(state);
    // enough has been seen when the last true number and the first false number, 2 and 3, are both tested
    assert.equal(said === true, visited.includes(2) && visited.includes(3), `visited ${visited[0]}…${visited[visited.length - 1]}`);
    if (said === true) continue;
    if (/makes it true/.test(said)) assert.equal(state.falseAt.length, 0);
    if (/makes it false/.test(said)) assert.equal(state.trueAt.length, 0);
    const gap = /true up to \$(-?\d+)\$ and false from \$(-?\d+)\$/.exec(said);
    if (gap) assert.ok(Number(gap[1]) === Math.max(...state.trueAt) && Number(gap[2]) === Math.min(...state.falseAt) && Number(gap[2]) - Number(gap[1]) > 1, said);
  }
  assert.equal(probe.check(probeState(probe.widget, probe.solution.visited, probe.solution.x)), true);
  for (const x of range(-8, 8, 0.25)) assert.equal(2 * x + 1 < 7, x < 3, 'the solution set quoted in the lesson');

  const flip = fixed('inequalities', 'flip-discover');
  assert.equal(flip.widget.test.lhs, '-2x');
  for (const visited of stretches(flip.widget)) {
    const state = probeState(flip.widget, visited);
    const said = flip.check(state);
    assert.equal(said === true, visited.includes(-3) && visited.some((v) => v < -3), `visited ${visited[0]}…${visited[visited.length - 1]}`);
    if (said === true) { assert.ok(state.trueAt.some((v) => v > -3) && state.falseAt.some((v) => v < -3), 'both sides of -3 were tested'); continue; }
    if (/none of it is less than/.test(said)) assert.ok(visited.every((v) => v > -3));
    if (/itself as well/.test(said)) assert.ok(!visited.includes(-3));
    if (/Try a number less than/.test(said)) assert.ok(visited.every((v) => v >= -3));
  }
  assert.equal(flip.check(probeState(flip.widget, flip.solution.visited, flip.solution.x)), true);
  for (const x of range(-8, 8, 0.25)) assert.equal(-2 * x < 6, x > -3, 'dividing by -2 turns the sign round');
});

test('inequalities: the drawn answers are accepted exactly when they are the solution set', () => {
  const grid = range(-8, 8, 0.25);
  const ray = (s) => (x) => (s.dir === 'right' ? x > s.at : x < s.at) || (s.closed && x === s.at);
  const stretch = (s) => (x) => (x > s.from && x < s.to) || (s.closedFrom && x === s.from) || (s.closedTo && x === s.to);
  const sameSet = (a, b) => grid.every((x) => a(x) === b(x));

  const draw = fixed('inequalities', 'draw-it');
  let passes = 0;
  for (const at of range(draw.widget.min, draw.widget.max)) for (const dir of ['left', 'right']) for (const closed of [true, false]) {
    const state = { at, dir, closed };
    const said = draw.check(state);
    assert.equal(said === true, sameSet(ray(state), (x) => 2 * x + 1 < 7), JSON.stringify(state));
    if (said === true) { passes++; continue; }
    if (/should stop at 3/.test(said)) assert.notEqual(at, 3);
    if (/greater than 3/.test(said)) assert.ok(at === 3 && dir === 'right');
    if (/filled end/.test(said)) assert.ok(at === 3 && dir === 'left' && closed);
  }
  assert.equal(passes, 1);
  assert.equal(draw.check(draw.solution), true);
  assert.notEqual(draw.check({ at: draw.widget.at, dir: draw.widget.dir, closed: draw.widget.closed }), true, 'not solved at the start');

  const compound = fixed('inequalities', 'compound');
  const { min, max } = compound.widget;
  assert.ok(min <= -5 && max >= 5, 'the line has room on both sides of every answer');
  assert.deepEqual([fixed('inequalities', 'square').widget.min, fixed('inequalities', 'square').widget.max], [min, max]);
  const ends = [];      // every position of the two ends: the widget keeps the left one to the left of the right one
  for (const from of range(min, max - 1)) for (const to of range(from + 1, max)) for (const closedFrom of [true, false]) for (const closedTo of [true, false]) ends.push({ from, to, closedFrom, closedTo });

  assert.match(compound.text, /-2 < x \\le 3/);
  passes = 0;
  for (const state of ends) {
    const said = compound.check(state);
    assert.equal(said === true, sameSet(stretch(state), (x) => x > -2 && x <= 3), JSON.stringify(state));
    if (said === true) { passes++; continue; }
    if (/should run from/.test(said)) assert.ok(state.from !== -2 || state.to !== 3);
    if (/that end is hollow/.test(said)) assert.ok(state.from === -2 && state.closedFrom);
    if (/that end is filled/.test(said)) assert.ok(state.to === 3 && !state.closedTo);
  }
  assert.equal(passes, 1);
  assert.equal(compound.check(compound.solution), true);

  // x² < 9: every message names a number, and what it says about that number is true
  const square = fixed('inequalities', 'square');
  passes = 0;
  for (const state of ends) {
    const said = square.check(state);
    const shaded = stretch(state);
    assert.equal(said === true, sameSet(shaded, (x) => x * x < 9), JSON.stringify(state));
    if (said === true) { passes++; continue; }
    assert.equal(typeof said, 'string');
    const beyond = /Test a number from that part: \$\(?(-?[\d.]+)\)?\^2 = ([\d.]+)\$/.exec(said);
    const missing = /For example \$(-?[\d.]+)\$ is not shaded, but \$\(?(-?[\d.]+)\)?\^2 = ([\d.]+)\$ is less than 9/.exec(said);
    if (beyond) {
      const w = Number(beyond[1]);
      assert.ok(shaded(w) && w * w >= 9 && Math.abs(w * w - Number(beyond[2])) < 1e-9, `${JSON.stringify(state)}: ${said}`);
      assert.equal(/beyond 3\./.test(said), w > 0);
    } else if (missing) {
      const w = Number(missing[1]);
      assert.ok(!shaded(w) && w * w < 9 && Number(missing[2]) === w && Math.abs(w * w - Number(missing[3])) < 1e-9, `${JSON.stringify(state)}: ${said}`);
    } else {
      assert.match(said, /Both ends must be hollow/);
      assert.ok(state.from === -3 && state.to === 3 && (state.closedFrom || state.closedTo));
    }
  }
  assert.equal(passes, 1);
  assert.equal(square.check(square.solution), true);
});

test('inequalities: fixed facts', () => {
  const like = fixed('inequalities', 'like-an-equation');
  assert.deepEqual([blank(like, 0), blank(like, 1), picked(like, 2), blank(like, 3)], [4, 11 + 4, '≤', (11 + 4) / 3]);
  for (const x of range(-10, 10, 0.25)) assert.equal(3 * x - 4 <= 11, x <= 5);
  // multiplying 2 < 5 by -1: now shown on the teaching screen "flip-rule" (it used to be the graded step "why-flip")
  const flip = fixed('inequalities', 'flip-rule');
  assert.equal(flip.type, 'info');
  const compared = Array.from(flip.text.matchAll(/\$(?:\\;)?(-?\d+) ([<>]) (-?\d+)\$/g), (m) => [Number(m[1]), m[2], Number(m[3])]);
  assert.deepEqual(compared, [[2, '<', 5], [-1 * 2, '>', -1 * 5]], 'the true statement and its mirror image');
  for (const [a, sign, b] of compared) assert.ok(sign === '<' ? a < b : a > b, `${a} ${sign} ${b}`);
  assert.deepEqual(flip.figures[0].marks.map((mark) => mark.value).sort((u, v) => u - v), [-5, -2, 2, 5], 'the picture shows the two numbers and their mirror images');
  // the worked example on that screen: every line has the same solutions
  assert.ok(flip.text.includes('$-7x - 1 \\le 13$') && flip.text.includes('$-7x \\le 14$') && flip.text.includes('$x \\ge -2$'));
  for (const x of range(-10, 10, 0.25)) { assert.equal(-7 * x - 1 <= 13, -7 * x <= 14); assert.equal(-7 * x <= 14, x >= -2); }
  // the other worked examples of the lesson
  for (const x of range(-10, 10, 0.25)) {
    assert.equal(2 * x + 5 > 11, x > 3, 'example-solve');
    assert.equal(-5 <= 6 * x + 1 && 6 * x + 1 < 25, -1 <= x && x < 4, 'teach-compound');
  }
  assert.match(fixed('inequalities', 'example-solve').text, /\$2x \+ 5 > 11\$[\s\S]*\$x > 3\$/);
  assert.match(fixed('inequalities', 'teach-compound').text, /\$-5 \\le 6x \+ 1 < 25\$[\s\S]*\$-1 \\le x < 4\$/);
  assert.deepEqual([(50 - 8) / 4, Math.floor((50 - 8) / 4)], [10.5, 10], 'example-limit: at most 10 tins');
  assert.match(fixed('inequalities', 'example-limit').text, /\$8 \+ 4x \\le 50\$[\s\S]*\$x \\le 10\.5\$[\s\S]*\*\*10 tins\*\*/);
  // which moves turn an inequality round: try each on a few true statements
  const moves = { 'Add 7': (v) => v + 7, 'Subtract 10': (v) => v - 10, 'Add $-4$': (v) => v - 4, 'Multiply by 3': (v) => v * 3, 'Divide by $-2$': (v) => v / -2, 'Multiply by $-1$': (v) => -v, 'Divide by 5': (v) => v / 5 };
  const items = fixed('inequalities', 'which-flips').items;
  assert.equal(items.length, Object.keys(moves).length);
  for (const item of items) {
    const move = moves[item.text];
    assert.ok(move, `a move for "${item.text}"`);
    const flipped = [[2, 5], [-4, 1], [-9, -3]].map(([a, b]) => move(a) > move(b));
    assert.ok(flipped.every((v) => v === flipped[0]));
    assert.equal(item.bucket, flipped[0] ? 1 : 0, item.text);
  }
});

/* -------------------------------------------------------- lesson 4: exponents */

test('exponents: a product of powers is one power', () => {
  eachVariant('exponents', 'multiply', (step) => {
    const factors = displayMath(step.text).split('\\cdot').map((part) => part.trim());
    let count = 0;
    const bases = new Set();
    for (const factor of factors) {
      const m = /^([a-z]|\d+)(?:\^\{(\d+)\})?$/.exec(factor);
      assert.ok(m, `factor "${factor}"`);
      bases.add(m[1]);
      count += m[2] ? Number(m[2]) : 1;        // written out, that many copies of the base
    }
    assert.equal(bases.size, 1, 'one base');
    assert.equal(blank(step, 0), count);
    assert.ok(step.explain.includes(`^{${count}}$`));
    assert.match(step.text, new RegExp(`power of \\$${[...bases][0]}\\$`));
  });
});

test('exponents: a negative exponent', () => {
  eachVariant('exponents', 'negative', (step) => {
    const m = /\$(\d+)\^\{-(\d+)\}\$/.exec(step.text);
    let power = 1;
    for (let i = 0; i < Number(m[2]); i++) power *= Number(m[1]);
    const values = step.options.map((o) => value(mathIn(o.text)));
    assert.equal(new Set(values.map((v) => v.toFixed(9))).size, values.length, 'four different values');
    step.options.forEach((o, i) => {
      assert.equal(!!o.correct, Math.abs(values[i] - 1 / power) < 1e-12, o.text);
      if (!o.correct) assert.ok(o.why);
      if (/does not make the result negative/.test(o.why || '')) assert.equal(values[i], -power);
      if (/An exponent is not a factor/.test(o.why || '')) assert.equal(values[i], -Number(m[1]) * Number(m[2]));
    });
  });
});

test('exponents: three rules in one expression', () => {
  const seen = new Set();
  eachVariant('exponents', 'simplify', (step) => {
    const expr = fn(displayMath(step.text));
    const e = blank(step, 0);
    for (const x of [0.6, 1.7, 2.5]) near(expr(x), x ** e, `at x = ${x}`, 1e-7);
    assert.notEqual(e, 0);
    assert.ok(step.explain.includes(`= x^{${e}}$`));
    assert.ok(!/x\^\{1\}\}/.test(step.explain), 'no 1/x^1');
    seen.add(Math.sign(e));
  });
  assert.equal(seen.size, 2, 'positive and negative exponents both occur');
});

test('exponents: the power one half', () => {
  eachVariant('exponents', 'half-power', (step) => {
    const sq = Number(/\$(\d+)\^\{1\/2\}\$/.exec(step.text)[1]);
    const root = range(0, 20).find((n) => n * n === sq);
    assert.ok(root > 0);
    const values = step.options.map((o) => value(mathIn(o.text)));
    assert.equal(new Set(values.map((v) => v.toFixed(9))).size, values.length);
    step.options.forEach((o, i) => {
      assert.equal(!!o.correct, values[i] === root, o.text);
      if (/half of/.test(o.why || '')) assert.equal(values[i], sq / 2);
      if (/negative exponent/.test(o.why || '')) near(values[i], 1 / sq);
      if (/not negative\.$/.test(o.why || '')) assert.equal(values[i], -root);
    });
  });
});

test('exponents: a cube root', () => {
  eachVariant('exponents', 'cube-root', (step) => {
    const cube = Number(/\*\*What is \$(\d+)\^\{1\/3\}\$\?\*\*/.exec(step.text)[1]);
    assert.deepEqual(range(1, 30).filter((n) => n * n * n === cube), [step.answer]);
    for (const [wrong, message] of step.wrong) {
      assert.notEqual(wrong, step.answer);
      if (/a third of/.test(message)) near(wrong, cube / 3);
      if (/square root/.test(message)) assert.equal(wrong * wrong, cube);
    }
  });
});

test('exponents: the interactive checks', () => {
  /** What the power-factors widget reports. */
  const factors = (op, m, n) => (op === 'times' ? { op, m, n, exponent: m + n, top: m + n, bottom: 0, cancelled: 0 } : { op, m, n, exponent: m - n, top: Math.max(m - n, 0), bottom: Math.max(n - m, 0), cancelled: Math.min(m, n) });
  const product = fixed('exponents', 'product');
  for (const m of range(1, 6)) for (const n of range(1, 6)) {
    const said = product.check(factors('times', m, n));
    assert.equal(said === true, m + n === 7 && m > 1 && n > 1, `${m}, ${n}`);
    if (said === true) continue;
    if (/single \$x\$/.test(said)) assert.ok(m + n === 7 && (m === 1 || n === 1));
    else assert.ok(m + n !== 7 && said.includes(`${m + n} factors`) && said.includes(`x^{${m + n}}`));
  }
  assert.equal(product.check(factors('times', product.solution.m, product.solution.n)), true);
  assert.notEqual(product.check(factors('times', product.widget.m, product.widget.n)), true);

  const quotient = fixed('exponents', 'quotient');
  for (const m of range(1, 6)) for (const n of range(1, 6)) {
    const state = factors('over', m, n);
    const said = quotient.check(state);
    assert.equal(said === true, m - n === 4 && n >= 2, `${m} over ${n}`);
    if (said === true) continue;
    if (/only one \$x\$ is cancelled/.test(said)) assert.ok(m - n === 4 && n === 1);
    else if (/Nothing is left on top/.test(said)) assert.ok(m <= n);
    else assert.ok(m - n > 0 && m - n !== 4 && said.includes(`${m - n} factor`));
  }
  assert.equal(quotient.check(factors('over', quotient.solution.m, quotient.solution.n)), true);

  const past = fixed('exponents', 'zero-negative');
  assert.equal(past.widget.m, past.widget.n, 'the step starts with top and bottom equal, as its text says');
  assert.ok(past.text.includes(`x^{${past.widget.m}-${past.widget.n}} = x^0`));
  for (const m of range(1, 6)) for (const n of range(1, 6)) {
    const said = past.check(factors('over', m, n));
    assert.equal(said === true, m < n, `${m} over ${n}`);
    if (/are equal/.test(said)) assert.equal(m, n);
    if (/more factors above/.test(said)) assert.ok(m > n);
  }
  assert.equal(past.check(factors('over', past.solution.m, past.solution.n)), true);
  assert.ok(past.explain.includes(`x^{${past.solution.m}-${past.solution.n}} = x^{${past.solution.m - past.solution.n}}`));

  const root = fixed('exponents', 'match-root');
  for (const p of sliderValues(root.widget.params.p)) {
    const blue = curve(root.widget, 0, { p });
    const dashed = curve(root.widget, 1);
    const same = [0.25, 1, 4, 9].every((x) => Math.abs(blue(x) - dashed(x)) < 1e-9);
    const said = root.check({ p });
    assert.equal(said === true, same, `p = ${p}`);
    if (said === true) continue;
    if (/above the dashed/.test(said)) assert.ok(blue(4) > dashed(4) && blue(9) > dashed(9));
    if (/below the dashed/.test(said)) assert.ok(blue(4) < dashed(4) && blue(9) < dashed(9));
    if (/flat line/.test(said)) assert.ok(blue(4) === 1 && blue(9) === 1);
    if (/straight line/.test(said)) assert.ok(blue(4) === 4 && blue(9) === 9);
  }
  assert.equal(root.check(root.solution), true);
});

test('exponents: fixed facts', () => {
  // the table of powers of 2, now shown on the teaching screen "zero-and-negative" (it used to be the graded step "pattern")
  const zero = fixed('exponents', 'zero-and-negative');
  assert.equal(zero.type, 'info');
  const cells = (label) => new RegExp(`\\| ${label} \\|(.+)\\|`).exec(zero.text)[1].split('|').map((cell) => cell.trim().replace(/^\$|\$$/g, ''));
  const powers = cells('power').map((cell) => Number(/^2\^\{?(-?\d+)\}?$/.exec(cell)[1]));
  assert.deepEqual(powers, [3, 2, 1, 0, -1, -2]);
  assert.deepEqual(cells('value').map((cell) => value(cell)), powers.map((e) => 2 ** e), 'each value in the table is that power of 2');
  near(value('4^{-3}'), 1 / 64);
  const pp = fixed('exponents', 'power-of-power');
  const lines = Array.from(pp.template.matchAll(/\$\(x\^(\d+)\)\^\{?(\d+)\}?\$/g), (m) => Number(m[1]) * Number(m[2]));
  assert.deepEqual(pp.blanks.map((b) => b.numbers[0]), lines);
  assert.ok(pp.figures[0].rule === false, 'the picture does not print the answer');
  for (const o of fixed('exponents', 'truths').options) {
    const [l, r] = mathIn(o.text).split('=').map((side) => fn(side));
    const always = [0.3, 1, 2, 5.5].every((x) => Math.abs(l(x) - r(x)) < 1e-9);
    assert.equal(!!o.correct, always, o.text);
    if (!o.correct) assert.ok(o.why);
  }
  assert.equal(4 + 8, 12); assert.equal(2 ** 5, 32);
  for (const o of fixed('exponents', 'hook').options) assert.equal(!!o.correct, o.text === String(2 ** 0));
});

/* ----------------------------------------------- lesson 5: exponential growth */

test('exponential-growth: a rule from a story', () => {
  eachVariant('exponential-growth', 'write-rule', (step) => {
    const start = Number(/\*\*(\d+) (?:people|views|yeast cells)\*\*/.exec(step.text)[1]);
    const factor = { doubles: 2, triples: 3 }[/\*\*(doubles|triples)\*\*/.exec(step.text)[1]];
    const steps = Number(/After (\d+) (?:hours|days): \$N =\$/.exec(step.template)[1]);
    let n = start;
    for (let i = 0; i < steps; i++) n *= factor;
    assert.deepEqual(step.blanks.map((b) => b.numbers[0]), [start, factor, n]);
    assert.ok(num(/= ([\d{},]+)\$\.$/.exec(step.explain)[1]) === n, 'the explanation ends at the same number');
  });
});

test('exponential-growth: half-lives', () => {
  eachVariant('exponential-growth', 'half-life', (step) => {
    const start = Number(/\*\*(\d+) (?:mg|units)\*\*/.exec(step.text)[1]);
    const half = num(/\*\*([\d,]+) (?:hours|years)\*\*/.exec(step.text)[1]);
    const total = num(/left after ([\d,]+) (?:hours|years)\?/.exec(step.text)[1]);
    const lives = total / half;
    assert.ok(Number.isInteger(lives) && lives >= 2);
    let left = start;
    for (let i = 0; i < lives; i++) left /= 2;
    assert.equal(step.answer, left);
    assert.ok(Number.isInteger(left));
    for (const [wrong, message] of step.wrong) {
      assert.ok(Math.abs(wrong - step.answer) > 1e-9);
      if (/after one half-life/.test(message)) assert.equal(wrong, start / 2);
      if (/not by/.test(message)) { near(wrong, start / (2 * lives)); assert.ok(message.includes(`2^{${lives}} = ${2 ** lives}`) && message.includes(`= ${2 * lives}$`)); }
    }
    const chain = /\$([\d .\\to]+)\$/.exec(step.explain)[1].split('\\to').map((t) => Number(t));
    assert.deepEqual(chain, range(0, lives).map((i) => start / 2 ** i), 'the halving chain');
  });
});

test('exponential-growth: doubling times', () => {
  eachVariant('exponential-growth', 'doubling', (step) => {
    const every = Number(/doubles every (\d+) minutes/.exec(step.text)[1]);
    const start = /\*\*1 bacterium\*\*/.test(step.text) ? 1 : Number(/\*\*(\d+) bacteria\*\*/.exec(step.text)[1]);
    const total = Number(/in (\d+) minutes\?/.exec(step.text)[1]);
    assert.ok(Number.isInteger(total / every));
    let n = start;
    for (let t = every; t <= total; t += every) n *= 2;
    assert.equal(step.answer, n);
    assert.equal(step.wrong.length, 3);
    for (const [wrong] of step.wrong) assert.notEqual(wrong, step.answer);
    assert.ok(step.explain.includes(`= ${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}')}$`));
  });
});

test('exponential-growth: grains on a chessboard', () => {
  eachVariant('exponential-growth', 'chessboard', (step) => {
    const square = Number(/grains go on square (\d+)\?/.exec(step.text)[1]);
    let grains = 1;
    for (let s = 2; s <= square; s++) grains *= 2;
    assert.equal(step.answer, grains);
    assert.deepEqual(step.wrong.map((w) => w[0]), [grains * 2, 2 * square, 2 * (square - 1)]);
    for (const [wrong] of step.wrong) assert.notEqual(wrong, step.answer);
  });
  assert.ok(2n ** 63n > 9n * 10n ** 18n && 2n ** 63n < 10n ** 19n, '2^63 is about 9 followed by 18 zeros');
});

test('exponential-growth: the growth factor of a list', () => {
  const kinds = new Set();
  eachVariant('exponential-growth', 'find-factor', (step) => {
    const list = displayMath(step.text).split(',\\quad').map((t) => Number(t));
    assert.equal(list.length, 4);
    assert.ok(list.every((v) => Number.isInteger(v) && v > 0), 'whole numbers');
    const ratios = [1, 2, 3].map((i) => list[i] / list[i - 1]);
    for (const ratio of ratios) near(ratio, ratios[0], 'a constant ratio');
    near(step.answer, ratios[0]);
    assert.deepEqual(step.wrong.map((w) => w[0]), [list[1] - list[0], 1 / step.answer]);
    for (const [wrong] of step.wrong) assert.ok(Math.abs(wrong - step.answer) > 1e-9);
    assert.equal(/decay/.test(step.explain), step.answer < 1);
    kinds.add(step.answer < 1);
  });
  assert.equal(kinds.size, 2, 'growth and decay both occur');
});

test('exponential-growth: counting folds', () => {
  eachVariant('exponential-growth', 'folds', (step) => {
    const target = num(/\(([\d,]+) mm\)\?/.exec(step.text)[1]);
    let tenths = 1;         // the thickness in tenths of a millimetre, so that the arithmetic is exact
    let folds = 0;
    while (tenths <= target * 10) { tenths *= 2; folds++; }
    assert.equal(step.answer, folds);
    const [short] = step.wrong;
    assert.equal(short[0], folds - 1);
    const quoted = num(/= ([\d{},.]+)\$ mm/.exec(short[1])[1]);
    near(quoted, 2 ** (folds - 1) / 10, 'the thickness one fold earlier');
    assert.ok(quoted < target);
    assert.ok(step.explain.includes(`**${folds} folds**`));
  });
});

test('exponential-growth: the interactive checks', () => {
  const race = fixed('exponential-growth', 'race');
  const { linear, exponential, max } = race.widget;
  assert.match(race.text, /100 coins on day 0 and adds 100 coins every day/);
  assert.match(race.text, /1 coin on day 0 and \*\*doubles\*\*/);
  const A = (n) => linear.start + linear.add * n;
  const B = (n) => exponential.start * exponential.factor ** n;
  const first = range(0, max).find((n) => B(n) > A(n));
  for (const n of range(0, max)) {
    const said = race.check({ n, linear: A(n), exponential: B(n) });
    assert.equal(said === true, n === first, `day ${n}`);
    if (/still ahead/.test(said)) assert.ok(A(n) > B(n) && said.includes(`${A(n).toLocaleString('en-US')} coins against ${B(n).toLocaleString('en-US')}`));
    if (/took the lead earlier/.test(said)) assert.ok(B(n) > A(n) && n > first);
  }
  assert.equal(race.solution.n, first);
  assert.deepEqual([first, A(10), B(10), A(20), B(20)], [11, 1100, 1024, 2100, 1048576], 'the numbers quoted in the explanation');

  const slider = fixed('exponential-growth', 'factor-slider');
  const dots = slider.widget.points.filter((p) => p.color === 'orange');
  assert.equal(dots.length, 2);
  for (const b of sliderValues(slider.widget.params.b)) {
    const f = curve(slider.widget, 0, { b });
    const through = dots.every((d) => Math.abs(f(d.x) - d.y) < 1e-9);
    const said = slider.check({ b });
    assert.equal(said === true, through, `b = ${b}`);
    assert.equal(f(0), 4, 'the curve starts at 4 whatever b is');
    if (said === true) continue;
    if (/flat line/.test(said)) assert.ok(f(1) === 4 && f(5) === 4);
    if (/climbs/.test(said)) assert.ok(f(2) > f(1) && f(1) > 4);
    const at = /it is at \$4 \\times ([\d.]+) = ([\d.]+)\$, above/.exec(said) || /down at \$4 \\times ([\d.]+) = ([\d.]+)\$, below/.exec(said);
    if (at) { assert.equal(Number(at[1]), b); assert.equal(Number(at[2]), f(1)); assert.equal(/above/.test(said), f(1) > 2); }
  }
  assert.equal(slider.check(slider.solution), true);
});

test('exponential-growth: fixed facts', () => {
  // the paper: 0.1 mm doubled 42 times, in kilometres
  const km = 0.1 * 2 ** 42 / 1e6;
  assert.ok(km > 384400 && Math.round(km / 10000) * 10000 === 440000);
  // linear, exponential or neither: differences and ratios
  for (const item of fixed('exponential-growth', 'sort').items) {
    const list = item.text.split(',').map(Number);
    const diffs = list.slice(1).map((v, i) => v - list[i]);
    const ratios = list.slice(1).map((v, i) => v / list[i]);
    const constant = (arr) => arr.every((v) => Math.abs(v - arr[0]) < 1e-9);
    assert.equal(item.bucket, constant(diffs) ? 0 : constant(ratios) ? 1 : 2, item.text);
  }
  // which plan wins in the end
  const end = fixed('exponential-growth', 'eventually');
  const fig = end.figures[0];
  const C = (n) => fig.linear.start + fig.linear.add * n;
  const D = (n) => fig.exponential.start * fig.exponential.factor ** n;
  assert.match(end.text, /starts with 1,000 coins and adds \*\*1,000 coins\*\* every week/);
  assert.ok(fig.linear.start === 1000 && fig.linear.add === 1000 && fig.exponential.start === 1 && fig.exponential.factor === 1.5);
  const ahead = range(0, fig.max).filter((n) => D(n) > C(n));
  assert.deepEqual(ahead, range(26, fig.max), 'behind up to week 25, ahead from week 26 on');
  assert.equal(correctOption(end).text, 'Plan D, from week 26 on');
  assert.equal(Math.round(D(26)), 37877); assert.equal(C(26), 27000); assert.equal(C(1), 2000); assert.equal(D(1), 1.5);
  for (const n of ahead) assert.ok(D(n) / 2 > 1000, 'once ahead, D gains more than 1,000 a week');
});

/* ------------------------------------------------------- lesson 6: logarithms */

test('logarithms: a logarithm is the exponent that works', () => {
  const signs = new Set();
  eachVariant('logarithms', 'evaluate', (step) => {
    const m = /\\log_\{(\d+)\} (.+?)\\,\$/.exec(step.text);
    const base = Number(m[1]);
    const x = value(m[2]);
    const found = range(-12, 24).filter((e) => Math.abs(base ** e - x) < 1e-12 * Math.max(1, x));
    assert.deepEqual(found, [step.answer], `${base} to what power gives ${x}`);
    signs.add(Math.sign(step.answer));
    for (const [wrong, message] of step.wrong) {
      assert.notEqual(wrong, step.answer);
      if (/is not \$/.test(message)) near(wrong, x / base);
      if (/wrong sign/.test(message)) assert.equal(wrong, -step.answer);
    }
    assert.ok(step.explain.startsWith(`$${base}^{${step.answer}} = `));
  });
  assert.equal(signs.size, 3, 'negative, zero and positive logarithms all occur');
});

test('logarithms: the logarithm of a product', () => {
  let whole = 0;
  eachVariant('logarithms', 'product-rule', (step) => {
    const given = Array.from(step.text.matchAll(/\\log_\{?(\d+)\}? (\d+) (=|\\approx) ([\d.]+)\$/g), (m) => ({ base: Number(m[1]), x: Number(m[2]), exact: m[3] === '=', log: Number(m[4]) }));
    assert.ok(given.length === 1 || given.length === 2);
    for (const g of given) near(Math.log(g.x) / Math.log(g.base), g.log, 'what the learner is told is true', g.exact ? 1e-12 : 0.0005 / g.log);
    const ask = /\*\*What is \$\\log_\{?(\d+)\}? \(?([^$]+?)\)?\$/.exec(step.text);
    const asked = value(ask[2]);
    const truth = Math.log(asked) / Math.log(Number(ask[1]));
    if (given.length === 2) {
      whole++;
      near(step.answer, truth, 'the answer', 1e-12);
      assert.equal(step.tolerance, null);
      assert.equal(asked, given[0].x * given[1].x);
    } else {
      assert.ok(Math.abs(step.answer - truth) < 0.0006, `${step.answer} vs ${truth}`);
      assert.ok(step.tolerance > 0 && step.tolerance < 0.001);
      near(asked / given[0].x, 10 ** Math.round(Math.log10(asked / given[0].x)), 'the number is the given one times a power of ten');
    }
    for (const [wrong] of step.wrong) assert.ok(Math.abs(wrong - step.answer) > 0.01);
  });
  assert.ok(whole > 80 && whole < SEEDS - 80, 'both kinds of question occur');
});

test('logarithms: the logarithm of a power', () => {
  eachVariant('logarithms', 'power-rule', (step) => {
    const told = /told that \$\\log_\{(\d+)\} (\d+) = (\d+)\$/.exec(step.text);
    const [base, x, log] = told.slice(1).map(Number);
    assert.equal(base ** log, x, 'what the learner is told is true');
    const ask = /\\left\((\d+)\^\{(\d+)\}\\right\)\$\?\*\*/.exec(step.text);
    assert.equal(Number(ask[1]), x);
    const n = Number(ask[2]);
    let count = 0;                    // divide x^n by the base until 1 is left
    for (let v = BigInt(x) ** BigInt(n); v > 1n; v /= BigInt(base)) count++;
    assert.equal(step.answer, count);
    assert.deepEqual(step.wrong.map((w) => w[0]), [n + log]);
    assert.notEqual(n + log, step.answer);
  });
});

test('logarithms: an unknown in the exponent', () => {
  eachVariant('logarithms', 'solve', (step) => {
    const m = /^(?:(\d+) \\cdot )?(\d+)\^\{\\,x\} = ([\d{},]+)$/.exec(displayMath(step.text));
    assert.ok(m, 'c · b^x = number');
    const [c, base, rhs] = [m[1] ? Number(m[1]) : 1, Number(m[2]), num(m[3])];
    assert.deepEqual(range(0, 40).filter((x) => c * base ** x === rhs), [step.answer]);
    for (const [wrong, message] of step.wrong) { assert.notEqual(wrong, step.answer); assert.equal(wrong, rhs / c / base); assert.ok(message.includes(`gives ${(rhs / c).toLocaleString('en-US')}?`)); }
    assert.equal(/Divide by/.test(step.explain), c !== 1);
  });
});

test('logarithms: steps on the earthquake scale', () => {
  eachVariant('logarithms', 'quake', (step) => {
    const [high, low] = /magnitude (\d+) earthquake as in a magnitude (\d+)\?/.exec(step.text).slice(1).map(Number);
    assert.ok(high > low);
    let times = 1;
    for (let mag = low; mag < high; mag++) times *= 10;
    assert.equal(step.answer, times);
    assert.deepEqual(step.wrong.map((w) => w[0]), [high - low, 10 * (high - low)]);
  });
});

test('logarithms: solving 2^x = a power of ten', () => {
  eachVariant('logarithms', 'direct', (step) => {
    const target = num(/^2\^\{\\,x\} = ([\d{},]+)$/.exec(displayMath(step.text))[1]);
    near(2 ** step.answer, target, '2 to the answer gives the target', 1e-9);
    const k = Math.round(Math.log10(target));
    assert.equal(10 ** k, target);
    // the learner works with 0.301 and rounds to one decimal place: that has to be accepted
    const typed = Math.round((k / 0.301) * 10) / 10;
    assert.ok(Math.abs(typed - step.answer) <= step.tolerance, `${typed} is accepted for ${step.answer}`);
    assert.equal(Number(step.display), typed, 'the answer shown is the one the learner is asked for');
    assert.ok(step.explain.includes(`\\approx ${step.display}$`));
    for (const [wrong] of step.wrong) assert.ok(Math.abs(wrong - step.answer) > 1);
    const [lo, below, hi, above] = ints(/It fits: (.+?) is above it/.exec(step.explain)[1].replace(/\$2\^\{(\d+)\} = /g, '$1 ').replace(/[{}]/g, '')).filter((v, i) => i !== 2);
    assert.ok(2 ** lo === below && below < target && hi === lo + 1 && 2 ** hi === above && above > target, 'the two neighbouring powers');
  });
});

test('logarithms: the interactive checks', () => {
  const find = fixed('logarithms', 'find-power');
  const p = find.widget.points[0];
  const f = curve(find.widget, 0);
  const positions = range(find.widget.x[0], find.widget.x[1], p.snap);
  // accepted: the two positions of the point on either side of the true power
  const truth = Math.log2(6);
  const nearest = positions.filter((x) => Math.abs(x - truth) < p.snap);
  assert.equal(nearest.length, 2);
  for (const x of positions) {
    const said = find.check({ P: { x, y: Math.round(f(x) * 1e6) / 1e6 } });
    assert.equal(said === true, nearest.includes(x), `x = ${x}`);
    if (said !== true) assert.equal(/too low/.test(said), f(x) < 6, `x = ${x}: ${said}`);
  }
  assert.equal(find.check({ P: { x: find.solution.P.x, y: f(find.solution.P.x) } }), true);
  assert.ok(Math.abs(truth - 2.58) < 0.006);

  const slide = fixed('logarithms', 'slide');
  const { base, steps } = slide.widget;
  let passes = 0;
  for (const shift of range(0, steps)) for (const read of range(0, steps)) {
    const state = { shift, read, a: base ** shift, b: base ** read, product: base ** (shift + read), onScale: shift + read <= steps };
    const said = slide.check(state);
    assert.equal(said === true, (state.a === 8 && state.b === 16) || (state.a === 16 && state.b === 8), `${state.a} and ${state.b}`);
    if (said === true) { passes++; assert.equal(state.product, 8 * 16); assert.ok(state.onScale); continue; }
    if (/past the end/.test(said)) assert.ok(!state.onScale);
    else assert.ok(state.onScale && said.includes(`$${state.a} \\times ${state.b} = ${state.a * state.b}$`), said);
  }
  assert.equal(passes, 2);
  assert.equal(slide.check({ a: base ** slide.solution.shift, b: base ** slide.solution.read, product: 128, onScale: true }), true);
  assert.equal(Math.log2(8) + Math.log2(16), Math.log2(128));

  const scale = fixed('logarithms', 'log-scale');
  for (const pos of range(scale.widget.min, scale.widget.max)) {
    const said = scale.check({ p: pos });
    assert.equal(said === true, scale.widget.format(pos) === '1,000', `position ${pos}`);
    if (said !== true) assert.ok(said.includes(`on ${scale.widget.format(pos)}.`) && /keep going/.test(said) === 10 ** pos < 1000);
  }
  assert.equal(scale.widget.format(scale.widget.max), '1,000,000');
  assert.equal(scale.check(scale.solution), true);
});

test('logarithms: fixed facts', () => {
  assert.equal(2 ** 20, 1048576);
  assert.equal(fixed('logarithms', 'hook').answer, range(0, 60).find((n) => 2 ** n > 1e6));
  // each fact about powers is true, its partner is true, and the partner is its logarithm
  /** Both sides of a statement as numbers: "\log_2 8 + \log_2 16 = \log_2 128" -> [7, 7]. */
  const sides = (tex) => plain(tex).replace(/\\log_\{?(\d+)\}?\s*(\([^()]*\)|[\d.]+)/g, 'log($2, $1)').split('=').map((side) => compile(side, { vars: [] })({}));
  const logs = [];
  const pairs = fixed('logarithms', 'backwards').pairs;
  for (const [power, log] of pairs) {
    const [pl, pr] = sides(mathIn(power));
    const [ll, lr] = sides(mathIn(log));
    near(pl, pr, `${power} is true`);
    near(ll, lr, `${log} is true`, 1e-12);
    const base = Number(/\\log_\{?(\d+)\}?/.exec(log)[1]);
    near(ll, Math.log(pl) / Math.log(base), `${log} is the logarithm of ${power}`, 1e-12);
    logs.push(Math.round(ll * 1e9) / 1e9);
  }
  assert.equal(new Set(logs).size, pairs.length, 'no fact about powers could be matched with two facts about logarithms');
  near(Math.log2(8) + Math.log2(16), 7); near(Math.log2(8 ** 4), 12);
  const undo = fixed('logarithms', 'undo');
  assert.deepEqual(undo.blanks.map((b) => b.numbers[0]), [Math.log2(2 ** 9), Math.round(Math.log10(10 ** -4)), Math.round(10 ** Math.log10(500))]);
  for (const o of fixed('logarithms', 'impossible').options) {
    const v = Math.log2(value(/\\log_2 \(?([^)]+?)\)?\$$/.exec(o.text)[1]));
    assert.equal(!!o.correct, Number.isNaN(v), o.text);
    if (!o.correct) assert.ok(o.why.includes(`That is $${v}$`) || o.why.includes(`That is ${v},`), o.why);
  }
});

/* ------------------------------------------------ lesson 7: quadratic formula */

test('quadratic-formula: completing the square', () => {
  eachVariant('quadratic-formula', 'complete-practice', (step) => {
    const m = /^\$x\^2 ([+-]) (\d+)x\\; \+\$ \[\[(\d+)\]\] \$= \(x ([+-])\$ \[\[(\d+)\]\] \$\)\^2\$$/.exec(step.template);
    assert.ok(m, 'x² ± bx + [ ] = (x ± [ ])²');
    assert.equal(m[1], m[4], 'the same sign on both sides');
    const sign = m[1] === '-' ? -1 : 1;
    const b = Number(m[2]);
    assert.ok(step.text.includes(`x^2 ${m[1]} ${b}x`));
    const [add, half] = [blank(step, 0), blank(step, 1)];
    for (const x of [-3, 0, 1.5, 10]) near(x * x + sign * b * x + add, (x + sign * half) ** 2, `at x = ${x}`);
    assert.ok(add > 0 && half > 0);
  });
});

test('quadratic-formula: reading off a, b, c and the discriminant', () => {
  eachVariant('quadratic-formula', 'abc', (step) => {
    const eq = displayMath(step.text);
    assert.match(eq, / = 0$/);
    tidy(eq);
    const { a, b, c } = coefficients(eq.replace(/ = 0$/, ''));
    assert.deepEqual(step.blanks.map((bl) => bl.numbers[0]), [a, b, c, b * b - 4 * a * c]);
    assert.ok(a !== 0 && b !== 0 && c !== 0);
    assert.ok(step.explain.endsWith(`= ${b * b - 4 * a * c}$.`));
  });
});

test('quadratic-formula: the formula finds both solutions', () => {
  eachVariant('quadratic-formula', 'use-formula', (step) => {
    const eq = displayMath(step.text);
    tidy(eq);
    const { a, b, c, p } = coefficients(eq.replace(/ = 0$/, ''));
    const [lo, hi] = [blank(step, 0), blank(step, 1)];
    assert.ok(lo < hi, 'smaller solution first');
    near(p(lo), 0, 'the smaller solution', 1e-9);
    near(p(hi), 0, 'the larger solution', 1e-9);
    const root = Math.sqrt(b * b - 4 * a * c);
    assert.ok(Number.isInteger(root) && root > 0, 'a perfect square under the root');
    near(lo, Math.min((-b - root) / (2 * a), (-b + root) / (2 * a)));
    near(hi, Math.max((-b - root) / (2 * a), (-b + root) / (2 * a)));
    assert.ok(!Number.isInteger(lo) || !Number.isInteger(hi), 'one solution is a fraction, so factoring by sight is hard');
    // what the learner is told to type is read as that number
    for (const bl of step.blanks) { assert.match(bl.answers[0], /^-?\d+(\/\d+)?$/); near(parseNumber(bl.answers[0]), bl.numbers[0]); }
    assert.ok(step.explain.includes(`\\sqrt{${root * root}} = ${root}$`));
  });
});

/** The two numbers that an option such as "x = (-7 ± √69)/2" stands for. */
function plusMinus(tex) {
  const whole = /^x = \\dfrac\{(-?\d+) \\pm \\sqrt\{(\d+)\}\}\{(\d+)\}$/.exec(tex);
  if (whole) { const [p, q, r] = whole.slice(1).map(Number); return [(p - Math.sqrt(q)) / r, (p + Math.sqrt(q)) / r]; }
  const part = /^x = (-?\d+) \\pm \\dfrac\{\\sqrt\{(\d+)\}\}\{(\d+)\}$/.exec(tex);
  assert.ok(part, `"${tex}" has one of the two shapes`);
  const [p, q, r] = part.slice(1).map(Number);
  return [p - Math.sqrt(q) / r, p + Math.sqrt(q) / r];
}

test('quadratic-formula: only one way of putting the numbers in gives solutions', () => {
  eachVariant('quadratic-formula', 'set-up', (step) => {
    const { a, b, c, p } = coefficients(displayMath(step.text).replace(/ = 0$/, ''));
    const D = b * b - 4 * a * c;
    assert.ok(D > 0 && !Number.isInteger(Math.sqrt(D)), 'two solutions that are not rational');
    assert.equal(new Set(step.options.map((o) => o.text)).size, 4);
    for (const o of step.options) {
      const solves = plusMinus(mathIn(o.text)).every((x) => Math.abs(p(x)) < 1e-9);
      assert.equal(!!o.correct, solves, o.text);
      if (!o.correct) assert.ok(o.why);
      if (/Under the root goes/.test(o.why || '')) assert.ok(o.why.includes(`= ${D}$`) && ints(o.why.split('=')[1]).join() === [b * b, 4 * a * c].join(), o.why);
      if (/starts with/.test(o.why || '')) assert.ok(o.why.includes(`$b = ${b}$`) && o.why.includes(`$-b = ${-b}$`));
    }
    const [lo, hi] = plusMinus(mathIn(correctOption(step).text));
    const quoted = /about \$(-?[\d.]+)\$ and \$(-?[\d.]+)\$/.exec(step.explain).slice(1).map(Number);
    assert.ok(Math.abs(quoted[0] - lo) <= 0.005 + 1e-9 && Math.abs(quoted[1] - hi) <= 0.005 + 1e-9, 'the decimals in the explanation');
  });
});

test('quadratic-formula: the discriminant counts the solutions', () => {
  const count = { Two: 0, One: 0, None: 0 };
  eachVariant('quadratic-formula', 'how-many', (step) => {
    const eq = displayMath(step.text);
    tidy(eq);
    const { a, b, c, p } = coefficients(eq.replace(/ = 0$/, ''));
    const D = b * b - 4 * a * c;
    // count the crossings directly: where does the parabola stand at its vertex?
    const vertex = p(-b / (2 * a));
    const crossings = Math.abs(vertex) < 1e-9 ? 'One' : (vertex < 0) === (a > 0) ? 'Two' : 'None';
    assert.equal(crossings, D > 0 ? 'Two' : D === 0 ? 'One' : 'None', 'vertex and discriminant agree');
    assert.equal(correctOption(step).text, crossings);
    count[crossings]++;
    for (const o of step.options) if (!o.correct) assert.ok(o.why.includes(`it is $${D}$`), o.why);
    assert.ok(step.explain.includes(`= ${D}$.`));
  });
  assert.ok(Object.values(count).every((n) => n > 60), `all three outcomes occur: ${JSON.stringify(count)}`);
});

test('quadratic-formula: the ball lands at the positive root', () => {
  eachVariant('quadratic-formula', 'balcony', (step) => {
    const h = fn(displayMath(step.text).replace(/^h = /, ''), 't');
    assert.ok(h(0) > 0, 'it starts above the ground');
    near(h(2) - 2 * h(1) + h(0), -10, 'free fall with g = 10 m/s²');
    let lo = 0; let hi = 20;                          // bisection: above the ground at 0, below it at 20
    assert.ok(h(hi) < 0);
    for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (h(mid) > 0) lo = mid; else hi = mid; }
    near(step.answer, lo, 'the landing time', 1e-9);
    assert.equal(Number(step.display), Math.round(lo * 10) / 10);
    assert.ok(Math.abs(Number(step.display) - step.answer) <= step.tolerance, 'the rounded answer is accepted');
    const [early, back] = step.wrong;
    assert.ok(early[0] < 0 && Math.abs(h(early[0])) < 1e-9, 'the other root is negative');
    near(h(back[0]), h(0), 'back at the height of the balcony');
    assert.ok(back[1].includes(`${h(0)} m to fall`));
    for (const [wrong] of step.wrong) assert.ok(Math.abs(wrong - step.answer) > step.tolerance + 0.02, 'a slip is never accepted as right');
    // the calculation offered in the last hint is read as the answer
    near(parseNumber(/answer: (.+)$/.exec(step.hints[2])[1]), step.answer, 'the typed calculation', 1e-9);
  });
});

test('quadratic-formula: the interactive checks', () => {
  const build = fixed('quadratic-formula', 'complete');
  const b = build.widget.b;
  assert.ok(build.text.includes(`x^2 + ${b}x`));
  const needed = (b / 2) ** 2;
  let passes = 0;
  for (const split of [false, true]) for (const added of range(0, needed + 4)) {
    const filled = split ? added : 0;                // putting the rectangle back empties the corner
    const state = { b, half: b / 2, split, added: filled, needed, extra: Math.max(0, filled - needed), complete: split && filled === needed };
    const said = build.check(state);
    // a perfect square: x² + bx + added must equal (x + b/2)² for every x, and the pieces must be in place
    const square = split && [0, 1, 2.5].every((x) => x * x + b * x + filled === (x + b / 2) ** 2);
    assert.equal(said === true, square, JSON.stringify(state));
    if (said === true) { passes++; continue; }
    if (/First cut/.test(said)) assert.ok(!split);
    if (/too many/.test(said)) assert.ok(split && filled > needed && said.startsWith(`${filled - needed} too many`));
    if (/empty place/.test(said)) assert.ok(split && filled < needed && said.includes(`${needed - filled} empty ${needed - filled === 1 ? 'place.' : 'places.'}`));
  }
  assert.equal(passes, 1);
  assert.equal(build.solution.added, needed);

  const disc = fixed('quadratic-formula', 'discriminant');
  for (const c of sliderValues(disc.widget.params.c)) {
    const f = curve(disc.widget, 0, { c });
    const low = lowest(f, -7, 3, 0.25).value;
    const said = disc.check({ c });
    assert.equal(said === true, low === 0, `c = ${c}`);
    const D = 16 - 4 * c;
    assert.equal(compile(disc.widget.readouts[0].expr, { vars: ['c'] })({ c }), D, 'the readout is the discriminant of x² + 4x + c');
    if (said === true) { assert.equal(D, 0); continue; }
    assert.equal(/crosses the axis twice/.test(said), low < 0);
    assert.ok(said.includes(String(D)) && /positive/.test(said) === D > 0);
  }
  assert.equal(disc.check(disc.solution), true);
});

test('quadratic-formula: fixed facts', () => {
  const p = (x) => x * x + 6 * x + 4;
  for (const x of [-3 + Math.sqrt(5), -3 - Math.sqrt(5)]) near(p(x), 0, 'x = -3 ± √5 solves x² + 6x + 4 = 0', 1e-9);
  assert.equal((-3 + Math.sqrt(5)).toFixed(2), '-0.76'); assert.equal((-3 - Math.sqrt(5)).toFixed(2), '-5.24');
  near(lowest(p, -8, 2, 0.5).value, -5); assert.equal(lowest(p, -8, 2, 0.5).at, -3);
  const undo = fixed('quadratic-formula', 'undo-square');
  const [u, v, x1, x2] = undo.blanks.map((bl) => bl.numbers[0]);
  assert.ok(u > 0 && u * u === 9 && v === -u && x1 === u + 1 && x2 === v + 1 && (x1 - 1) ** 2 === 9 && (x2 - 1) ** 2 === 9);
  const solve = fixed('quadratic-formula', 'solve-by-completing');
  assert.deepEqual(solve.blanks.map((bl) => bl.numbers[0]), [9, -4 + 9, -3]);
  // the derivation: every line holds for the same x, for several quadratics
  const derive = fixed('quadratic-formula', 'derive');
  for (const [a, b, c] of [[1, 6, 4], [2, -5, -3], [-1, 4, 7], [3, 1, -2]]) {
    const D = b * b - 4 * a * c;
    for (const sign of [1, -1]) {
      const x = (-b + sign * Math.sqrt(D)) / (2 * a);
      const lines = [
        [a * x * x + b * x + c, 0],
        [x * x + (b / a) * x, -c / a],
        [(x + b / (2 * a)) ** 2, b * b / (4 * a * a) - c / a],
        [(x + b / (2 * a)) ** 2, D / (4 * a * a)],
        [Math.abs(x + b / (2 * a)), Math.abs(Math.sqrt(D) / (2 * a))],
      ];
      for (const [l, r] of lines) near(l, r, `a = ${a}, b = ${b}, c = ${c}`, 1e-9);
    }
  }
  assert.equal(derive.items.length, 6);
  assert.match(derive.items[0], /ax\^2 \+ bx \+ c = 0/);
  assert.match(derive.items[5], /^\$x = \\dfrac\{-b \\pm \\sqrt\{b\^2 - 4ac\}\}\{2a\}\$$/);
  // the worked example on the formula card
  assert.deepEqual([(-6 + Math.sqrt(36 - 20)) / 2, (-6 - Math.sqrt(36 - 20)) / 2], [-1, -5]);
  assert.equal((-1) ** 2 + 6 * -1 + 5, 0); assert.equal((-5) ** 2 + 6 * -5 + 5, 0);
});

/* ------------------------------------------- added by the accuracy review */

test('inequalities: every line of a worked solution has the same solution set as the question', () => {
  const grid = range(-40, 40, 0.5);
  const holds = (sign) => SIGN[SIGN_OF_TEX[sign]];
  eachVariant('inequalities', 'solve', (step) => {
    const q = /^(.+?) (<|>|\\le|\\ge) (-?\d+)$/.exec(displayMath(step.text));
    const left = fn(q[1]);
    const asked = (x) => holds(q[2])(left(x), Number(q[3]));
    const [b, a] = [left(0), left(1) - left(0)];
    // "Subtract 6: 6x ≥ -36", then the last line
    const mid = /^(Subtract|Add) (\d+): \$\\;(-?\d+)x (<|>|\\le|\\ge) (-?\d+)\$\. Then divide by \$(-?\d+)\$/.exec(step.explain.replace(/\s+/g, ' ').trim());
    assert.ok(mid, `the working: ${step.explain}`);
    assert.deepEqual([mid[1], Number(mid[2]), Number(mid[3]), Number(mid[6])], [b > 0 ? 'Subtract' : 'Add', Math.abs(b), a, a]);
    const last = /^x (<|>|\\le|\\ge) (-?\d+)$/.exec(displayMath(step.explain));
    for (const x of grid) {
      assert.equal(holds(mid[4])(Number(mid[3]) * x, Number(mid[5])), asked(x), `the middle line at x = ${x}`);
      assert.equal(holds(last[1])(x, Number(last[2])), asked(x), `the last line at x = ${x}`);
    }
    assert.ok(step.hints[0].includes(`${b > 0 ? 'subtract' : 'add'} ${Math.abs(b)} on both sides`) && step.hints[1].includes(`divide by $${a}$`));
  });
  eachVariant('inequalities', 'solve-compound', (step) => {
    const q = /^(-?\d+) (<|\\le) (.+?) (<|\\le) (-?\d+)$/.exec(displayMath(step.text));
    const mid = fn(q[3]);
    const asked = (x) => holds(q[2])(Number(q[1]), mid(x)) && holds(q[4])(mid(x), Number(q[5]));
    const [b, a] = [mid(0), mid(1) - mid(0)];
    const line = /^(Subtract|Add) (\d+) everywhere: \$\\;(-?\d+) (<|\\le) (\d+)x (<|\\le) (-?\d+)\$\. Divide everything by (\d+):/.exec(step.explain.replace(/\s+/g, ' ').trim());
    assert.ok(line, `the working: ${step.explain}`);
    assert.deepEqual([line[1], Number(line[2]), Number(line[5]), Number(line[8])], [b > 0 ? 'Subtract' : 'Add', Math.abs(b), a, a]);
    assert.ok(a > 0, 'dividing by a positive number, as the hint says');
    const last = /^(-?\d+) (<|\\le) x (<|\\le) (-?\d+)$/.exec(displayMath(step.explain));
    for (const x of grid) {
      assert.equal(holds(line[4])(Number(line[3]), a * x) && holds(line[6])(a * x, Number(line[7])), asked(x), `the middle line at x = ${x}`);
      assert.equal(holds(last[2])(Number(last[1]), x) && holds(last[3])(x, Number(last[4])), asked(x), `the last line at x = ${x}`);
    }
  });
  eachVariant('inequalities', 'limit', (step) => {
    const [limit, used, each] = Array.from(step.text.matchAll(/\*\*(\d+) (?:kg|GB|coins)\*\*/g), (m) => Number(m[1]));
    assert.ok(step.hints[0].includes(`$\\;${used} + ${each}x \\le ${limit}$`), step.hints[0]);
    assert.ok(step.hints[1].includes(`$\\;${each}x \\le ${limit - used}$`) && step.hints[1].includes(`does ${each} go into ${limit - used}?`), step.hints[1]);
    assert.ok(step.explain.includes(`$${step.answer + 1} \\times ${each} = ${(step.answer + 1) * each}$ is too much`) && (step.answer + 1) * each > limit - used);
  });
});

test('inequalities: the probes judge every set of tested numbers correctly, not only unbroken stretches', () => {
  // a quick drag can jump over whole numbers, so any set that contains the starting number can be what was tested
  for (const [id, enough] of [
    ['probe', (seen) => seen.includes(2) && seen.includes(3)],                                   // the last true number and the first false one
    ['flip-discover', (seen) => seen.includes(-3) && seen.some((v) => v < -3) && seen.some((v) => v > -3)],
  ]) {
    const step = fixed('inequalities', id);
    const others = range(step.widget.min, step.widget.max).filter((v) => v !== step.widget.x);
    for (let mask = 0; mask < 2 ** others.length; mask++) {
      const visited = [step.widget.x, ...others.filter((_, i) => mask & (1 << i))];
      const state = probeState(step.widget, visited);
      const said = step.check(state);
      assert.equal(said === true, enough(visited), `${id}: tested ${visited.join(', ')}`);
      if (said === true) continue;
      assert.equal(typeof said, 'string', `${id}: tested ${visited.join(', ')} gets a message`);
      const gap = /true up to \$(-?\d+)\$ and false from \$(-?\d+)\$/.exec(said);
      if (gap) assert.ok(Number(gap[1]) === Math.max(...state.trueAt) && Number(gap[2]) === Math.min(...state.falseAt) && Number(gap[2]) - Number(gap[1]) > 1, said);
      if (/makes it true|is true, and none of it/.test(said)) assert.equal(state.falseAt.length, 0, said);
      if (/none of it is less than/.test(said)) assert.ok(visited.every((v) => v > -3), said);
      if (/itself as well/.test(said)) assert.ok(!visited.includes(-3) && state.falseAt.length > 0, said);
      if (/Try a number less than/.test(said)) assert.ok(visited.includes(-3) && visited.every((v) => v >= -3), said);
    }
  }
});

/** A finished number, as the numeric step type understands it when a step has `plain: true` (the pattern of src/player/types/numeric.js). */
const FINISHED = /^=?\s*-?\s*(\d+([.,]\d+)?|[.,]\d+|\d+\s*\/\s*\d+|\d+\s+\d+\s*\/\s*\d+)\s*%?$/;

test('a question that is itself a piece of arithmetic cannot be answered by typing it back', () => {
  // what a learner would type to hand the question back, for each such step
  const echo = {
    'exponents/cube-root': (step) => { const m = /\$(\d+)\^\{1\/3\}\$\?/.exec(step.text); return `${m[1]}^(1/3)`; },
    'logarithms/evaluate': (step) => { const m = /\\log_\{(\d+)\} (.+?)\\,\$/.exec(step.text); return `log(${plain(m[2])}, ${m[1]})`; },
    'logarithms/product-rule': (step) => { const m = /\*\*What is \$\\log_\{?(\d+)\}? \(?([^$]+?)\)?\$/.exec(step.text); return `log(${plain(m[2])}, ${m[1]})`; },
    'logarithms/power-rule': (step) => { const m = /\\log_\{(\d+)\}\\!\\left\((\d+)\^\{(\d+)\}\\right\)\$\?/.exec(step.text); return `log(${m[2]}^${m[3]}, ${m[1]})`; },
  };
  for (const [key, typedBack] of Object.entries(echo)) {
    const [lessonId, stepId] = key.split('/');
    eachVariant(lessonId, stepId, (step) => {
      const typed = typedBack(step);
      const accepted = Math.abs(parseNumber(typed) - step.answer) <= (step.tolerance != null ? step.tolerance : 1e-6 * Math.max(1, Math.abs(step.answer)));
      assert.ok(accepted, `"${typed}" evaluates to the answer, so without "plain" it would be marked right`);
      assert.equal(step.plain, true, 'the step accepts finished numbers only');
      assert.ok(!FINISHED.test(typed), `"${typed}" is sent back`);
      // and the right answer can still be typed: as shown when revealed, and with a real minus sign
      const key2 = step.display != null ? String(step.display) : String(Math.round(step.answer * 1000) / 1000);
      assert.ok(FINISHED.test(key2), `"${key2}" is a finished number`);
      assert.ok(Math.abs(parseNumber(key2) - step.answer) <= (step.tolerance != null ? step.tolerance : 1e-6 * Math.max(1, Math.abs(step.answer))), `"${key2}" is accepted`);
      for (const hint of step.hints) assert.ok(!/type the calculation/i.test(hint), 'no hint invites typing a calculation');
    });
  }
  // no other numeric step of the course asks for the value of an expression that could be typed as it stands
  for (const id of LESSONS) for (const raw of lessons[id].steps) {
    if (raw.type !== 'numeric' || echo[`${id}/${raw.id}`]) continue;
    for (let seed = 1; seed <= 40; seed++) {
      const step = resolveStep(raw, makeRng(seed * 31 + 1), raw.id);
      assert.ok(!/\*\*What is \$[^$]*(\\log|\^\{)[^$]*\$[^*]*\?\*\*/.test(step.text), `${id}/${raw.id}: "${step.text.replace(/\s+/g, ' ').trim()}" needs plain: true`);
    }
  }
});

test('rounded answers: the correctly rounded value is accepted and its neighbours are not', () => {
  const accepts = (step, v) => Math.abs(v - step.answer) <= step.tolerance + 1e-12;
  let rounded = 0;
  eachVariant('logarithms', 'product-rule', (step) => {
    if (step.tolerance == null) return;
    rounded++;
    const ask = /\*\*What is \$\\log_\{10\} ([\d{},]+)\$, to three decimal places\?\*\*/.exec(step.text);
    assert.ok(ask, 'the text says how to round');
    const truth = Math.log10(num(ask[1]));
    const key = Math.round(truth * 1000) / 1000;
    assert.ok(Math.abs(step.answer - key) < 1e-9, `the key ${step.answer} is the true value ${truth} to three decimal places`);
    assert.ok(accepts(step, key) && accepts(step, truth) && !accepts(step, key + 0.001) && !accepts(step, key - 0.001));
    assert.ok(step.explain.trim().endsWith(`= ${key}$.`), 'the explanation ends at the key');
  });
  assert.ok(rounded > 80);
  eachVariant('logarithms', 'direct', (step) => {
    assert.match(step.text, /to one decimal place\?\*\*/);
    const target = num(/^2\^\{\\,x\} = ([\d{},]+)$/.exec(displayMath(step.text))[1]);
    const exact = Math.log2(target);
    const key = Math.round(exact * 10) / 10;
    const withHint = Math.round(Math.log10(target)) / 0.301;            // the route the text gives, with log 2 ≈ 0.301
    assert.equal(Math.round(withHint * 10) / 10, key, 'the rounded logarithm leads to the same first decimal');
    assert.ok(accepts(step, key) && accepts(step, withHint) && accepts(step, exact) && !accepts(step, key + 0.1) && !accepts(step, key - 0.1), `${key} only, for ${exact}`);
  });
  eachVariant('quadratic-formula', 'balcony', (step) => {
    assert.match(step.text, /to one decimal place\./);
    const { a, b, c } = coefficients(displayMath(step.text).replace(/^h = /, ''), 't');
    const exact = (-b - Math.sqrt(b * b - 4 * a * c)) / (2 * a);         // a is negative: this is the later root
    assert.ok(exact > 0 && Math.abs(exact - step.answer) < 1e-9);
    const key = Math.round(exact * 10) / 10;
    assert.ok(accepts(step, key) && !accepts(step, Math.round((key + 0.1) * 10) / 10) && !accepts(step, Math.round((key - 0.1) * 10) / 10), `${key} only, for ${exact}`);
    assert.ok(step.explain.includes(`about **${key} seconds**`) && step.hints[1].includes(`= ${b * b} + ${-4 * a * c} = ${b * b - 4 * a * c}$`));
  });
});

test('what the text says about the figure beside it, and how large numbers are written inside formulas', () => {
  // the slide rule of the lesson doubles at every step; the logarithmic number line multiplies by ten
  const rule = fixed('logarithms', 'slide');
  const line = fixed('logarithms', 'log-scale');
  assert.equal(rule.widget.base, 2);
  assert.match(rule.text, /each step to the right doubles/);
  for (const v of range(line.widget.min, line.widget.max - 1)) assert.equal(num(line.widget.format(v + 1)) / num(line.widget.format(v)), 10, 'each mark is ten times the one before');
  assert.match(line.text, /multiplies by 10\*\*, just as every step on the slide rule doubled/);
  // inside math a bare comma is followed by a gap ("1, 000"): thousands are written 1{,}000 there
  for (const id of LESSONS) for (const raw of lessons[id].steps) {
    const runs = typeof raw.gen === 'function' ? SEEDS : 1;
    for (let seed = 1; seed <= runs; seed++) {
      const step = resolveStep(raw, makeRng(seed * 613 + 2), raw.id);
      for (const text of strings(step)) for (const m of text.matchAll(/\$\$?([^$]+)\$\$?/g)) assert.ok(!/\d,\d{3}/.test(m[1]), `${id}/${raw.id} (seed ${seed}): a bare comma inside the formula ${m[1]}`);
    }
  }
});

/** One side of a quoted calculation: a number when it is plain arithmetic, a function when one letter is all it contains, otherwise null. */
function sideOf(tex) {
  const src = plain(tex);
  if (/\\/.test(src) || !src) return null;
  const letters = Array.from(new Set(src.replace(/sqrt|abs/g, '').match(/[A-Za-z]/g) || []));
  try {
    if (!letters.length) { const v = compile(src, { vars: [] })({}); return Number.isFinite(v) ? { v } : null; }
    if (letters.length === 1) { const f = compile(src, { vars: letters }); return { letter: letters[0], f: (t) => f({ [letters[0]]: t }) }; }
  } catch { return null; }
  return null;
}

test('every lesson: each calculation quoted in an explanation, a hint or a feedback line is true', () => {
  const covered = new Map();
  let checked = 0;
  const digits = (text) => { const m = /\.(\d+)$/.exec(text.trim()); return m ? m[1].length : 0; };
  const check = (text, where, key) => {
    for (const m of String(text).matchAll(/\$\$?([^$]+)\$\$?/g)) {
      const pieces = m[1].split(/(=|\\approx)/);
      if (pieces.length < 3) continue;
      const parts = [];
      for (let i = 0; i < pieces.length; i += 2) parts.push({ tex: pieces[i].trim(), side: sideOf(pieces[i]), rounded: i > 0 && pieces[i - 1] === '\\approx' });
      // an identity in one letter, such as (x + 7)² = x² + 14x + 49 or x⁹ / x⁵ = x⁴: true for every value tried
      if (parts.every((p) => p.side && p.side.f && p.side.letter === parts[0].side.letter)) {
        for (const t of [0.7, 1.9, 2.6]) for (const p of parts.slice(1)) { near(p.side.f(t), parts[0].side.f(t), `${where}: "${m[1].trim()}" at ${t}`, 1e-9); checked++; }
        covered.set(key, (covered.get(key) || 0) + 1);
        continue;
      }
      // plain arithmetic: 6 × 5 - 3 = 30 - 3 = 27. After an "≈" each number only has to agree as far as it is written out.
      const numbers = parts.filter((p) => p.side && p.side.f == null);
      if (numbers.length < 2) continue;
      let exact = numbers[0];
      for (const p of numbers.slice(1)) {
        const loose = parts.slice(1, parts.indexOf(p) + 1).some((q) => q.rounded);
        const slack = loose ? 0.5 * 10 ** -digits(p.tex) + 1e-9 : 1e-9 * Math.max(1, Math.abs(exact.side.v));
        assert.ok(Math.abs(p.side.v - exact.side.v) <= slack, `${where}: "${m[1].trim()}" says ${exact.side.v} = ${p.side.v}`);
        if (!loose) exact = p;
        checked++;
      }
      covered.set(key, (covered.get(key) || 0) + 1);
    }
  };
  for (const id of LESSONS) {
    for (const raw of lessons[id].steps) {
      const runs = typeof raw.gen === 'function' ? SEEDS : 1;
      for (let seed = 1; seed <= runs; seed++) {
        const step = resolveStep(raw, makeRng(seed * 15485863 + 11), raw.id);
        const texts = [step.explain, step.model, ...step.hints, ...(step.wrong || []).map((w) => w[1]), ...(step.options || []).map((o) => o.why), ...(step.items || []).map((item) => item.why)];
        if (step.type === 'info') texts.push(step.text);
        for (const text of texts) if (typeof text === 'string') check(text, `${id}/${raw.id} (seed ${seed})`, `${id}/${raw.id}`);
      }
    }
    for (const line of lessons[id].recap) check(line, `${id} recap`, `${id}/recap`);
  }
  // the check is not empty: these steps all quote calculations, and each was really reached
  for (const key of ['function-machines/evaluate', 'function-machines/twice', 'transformations/point-moves', 'inequalities/limit', 'exponents/multiply', 'exponents/negative', 'exponents/simplify', 'exponents/half-power', 'exponents/cube-root',
    'exponential-growth/write-rule', 'exponential-growth/half-life', 'exponential-growth/doubling', 'exponential-growth/chessboard', 'exponential-growth/find-factor', 'exponential-growth/folds',
    'logarithms/evaluate', 'logarithms/product-rule', 'logarithms/power-rule', 'logarithms/solve', 'logarithms/quake', 'logarithms/direct',
    'quadratic-formula/complete-practice', 'quadratic-formula/abc', 'quadratic-formula/use-formula', 'quadratic-formula/set-up', 'quadratic-formula/how-many']) {
    assert.ok(covered.get(key) > 0, `${key}: no calculation was found to check`);
  }
  assert.ok(checked > 20000, `${checked} equalities checked`);
  // the checker itself notices a wrong line
  assert.throws(() => check('$6 \\times 5 - 3 = 30 - 3 = 28$', 'self-test', 'self-test'));
  assert.throws(() => check('$(x + 7)^2 = x^2 + 14x + 48$', 'self-test', 'self-test'));
  assert.throws(() => check('$x = 6 \\div 0.301 \\approx 19.8$', 'self-test', 'self-test'));
  assert.doesNotThrow(() => check('$x = 6 \\div 0.301 \\approx 19.9$ and $\\log_{10} 70 \\approx 1 + 0.845 = 1.845$', 'self-test', 'self-test'));
});

/* ------------------------------------------------------------- every lesson */

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
        for (const text of strings(step)) {
          assert.ok(!/undefined|NaN|Infinity|\[object/.test(text), `${where}: "${text.slice(0, 90)}"`);
          assert.ok(!/\d\.\d{5,}/.test(text), `${where}: an unrounded number in "${text.slice(0, 90)}"`);
        }
        if (step.type === 'choice' || step.type === 'multi') {
          const keys = step.options.map((o) => `${o.text.trim()}|${o.figure ? JSON.stringify(o.figure) : ''}`);
          assert.equal(new Set(keys).size, keys.length, `${where}: an option is repeated`);
          const right = step.options.filter((o) => o.correct).length;
          if (step.type === 'multi') assert.ok(right >= 1 && right < step.options.length, `${where}: some, but not all, options are correct`);
          else if (step.mode === 'predict') assert.ok(right <= 1, `${where}: at most one correct option`);
          else assert.equal(right, 1, `${where}: exactly one correct option`);
        }
        if (step.type === 'numeric') {
          assert.ok(Number.isFinite(step.answer), `${where}: the answer is a number`);
          for (const [wrong] of step.wrong) assert.ok(Math.abs(wrong - step.answer) > (step.tolerance || 1e-9), `${where}: "wrong" lists a value that is accepted`);
        }
        if (step.type === 'expr') for (const [wrong] of step.wrong) assert.ok(!equivalent(String(wrong), step.answer, step.vars), `${where}: "wrong" lists the answer`);
        if (step.type === 'fill') for (const b of step.blanks) assert.ok(b.kind === 'select' ? b.options.includes(b.answer) : b.answers.length > 0, `${where}: a blank has no answer`);
        if (step.type === 'interact') assert.notEqual(step.solution, undefined, `${where}: has a solution`);
        if (step.graded && step.type !== 'info') assert.ok(step.explain, `${where}: has an explanation`);
      }
    }
  }
});

/** The teaching screens added so that every lesson shows a thing before it asks for it. */
const TEACHING = {
  'function-machines': ['example-evaluate', 'example-expression', 'three-views', 'vertical-line-test'],
  transformations: ['absolute-value', 'teach-stretch', 'teach-mirror'],
  inequalities: ['four-signs', 'example-solve', 'flip-rule', 'teach-compound', 'example-limit'],
  exponents: ['count-factors', 'divide-rule', 'zero-and-negative', 'power-rule', 'half-is-root'],
  'exponential-growth': ['two-ways', 'compare-neighbours', 'decay-half-life'],
  logarithms: ['log-rules', 'example-exponent'],
  'quadratic-formula': ['undo-a-square', 'halve-then-square', 'example-formula', 'count-solutions'],
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
    for (const stepId of TEACHING[id]) {
      const step = steps.find((s) => s.id === stepId);
      assert.ok(step && step.type === 'info', `${id}: the teaching screen "${stepId}" exists`);
      assert.ok(roles.indexOf('graded', steps.indexOf(step) + 1) > 0, `${id}/${stepId} is followed by a question`);
    }
    // a worked example comes before the first practice step of each new kind of problem
    const before = (teach, ask) => assert.ok(steps.findIndex((s) => s.id === teach) < steps.findIndex((s) => s.id === ask) && steps.some((s) => s.id === teach) && /:::example/.test(steps.find((s) => s.id === teach).text), `${id}: the worked example "${teach}" comes before "${ask}"`);
    for (const [teach, ask] of {
      'function-machines': [['example-evaluate', 'evaluate'], ['example-expression', 'plug-expression']],
      transformations: [],
      inequalities: [['example-solve', 'like-an-equation'], ['flip-rule', 'solve'], ['teach-compound', 'solve-compound'], ['example-limit', 'limit']],
      exponents: [['power-rule', 'simplify'], ['half-is-root', 'half-power']],
      'exponential-growth': [['name-it', 'write-rule'], ['decay-half-life', 'half-life']],
      logarithms: [['log-rules', 'product-rule'], ['example-exponent', 'solve']],
      'quadratic-formula': [['undo-a-square', 'undo-square'], ['halve-then-square', 'complete-practice'], ['example-formula', 'use-formula'], ['count-solutions', 'how-many']],
    }[id]) before(teach, ask);
  }
});

test('every lesson: 12 to 18 steps, two to four review steps, at least two hands-on steps', () => {
  for (const id of LESSONS) {
    const steps = lessons[id].steps;
    assert.ok(steps.length >= 12 && steps.length <= 18, `${id}: ${steps.length} steps`);
    const review = steps.filter((s) => s.review);
    assert.ok(review.length >= 2 && review.length <= 4, `${id}: ${review.length} review steps`);
    for (const s of review) assert.ok(!/as we just saw|above|previous step|last step/i.test(fixed(id, s.id).text), `${id}/${s.id} stands alone`);
    const handsOn = steps.filter((s) => s.type === 'interact');
    assert.ok(handsOn.length >= 2, `${id}: ${handsOn.length} interactive steps`);
    assert.ok(lessons[id].recap.length >= 3 && lessons[id].recap.length <= 4 && lessons[id].next, `${id}: recap and teaser`);
  }
});

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const stepId of generated) assert.ok(rederived.has(`${id}/${stepId}`), `${id}/${stepId} is generated but no test re-derives it`);
  }
});
