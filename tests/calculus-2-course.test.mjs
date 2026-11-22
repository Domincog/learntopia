/**
 * Calculus II: The Toolkit — independent checks of the course.
 *
 * This is the course where a wrong sign or a dropped factor is easiest to
 * write and hardest to see, so nothing here trusts a formula. Every derivative
 * the lessons quote is compared with a numerical derivative (central
 * differences with one Richardson step) of the function *as the learner sees
 * it*: the TeX in the question is parsed and evaluated. Every integral is
 * compared with Simpson's rule, every solution of a differential equation is
 * substituted into its equation numerically, every Euler step is taken again
 * with a plain loop, and every Taylor estimate is summed again from scratch.
 * Every interactive check is run over all the states its widget can reach.
 *
 *   node --test tests/calculus-2-course.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { compile, equivalent, parse } from '../src/core/mathexpr.js';

const SEEDS = 300;
const COURSE = 'calculus-2';
const LESSONS = ['chain-rule', 'product-rule', 'trig-derivatives', 'substitution', 'differential-equations', 'taylor-series'];
/** Every generated step of the course. Each is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'chain-rule': ['power-chain', 'exp-chain', 'root', 'balloon'],
  'product-rule': ['from-table', 'product-expr', 'peak', 'quotient-use', 'both-rules'],
  'trig-derivatives': ['values', 'chain', 'product'],
  substitution: ['choose-u', 'antiderivative', 'factor', 'definite', 'trig-definite'],
  'differential-equations': ['which-solution', 'euler-hand', 'cooling-rate'],
  'taylor-series': ['estimate-exp', 'sin-estimate'],
};
const tested = new Set();

const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/${COURSE}/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, COURSE, id);
}

/** Run a step's generator with many seeds and hand each concrete step to `verify`. */
function eachVariant(lessonId, stepId, verify, minVariants = 3) {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  assert.equal(typeof raw.gen, 'function', `${lessonId}/${stepId} is generated`);
  assert.ok(GENERATED[lessonId].includes(stepId), `${lessonId}/${stepId} is listed in GENERATED`);
  tested.add(`${lessonId}/${stepId}`);
  const seen = new Set();
  for (let seed = 1; seed <= SEEDS; seed++) {
    const step = resolveStep(raw, makeRng(seed * 7919 + 13), stepId);
    seen.add(JSON.stringify([step.text, step.template, (step.options || []).map((o) => o.text)]));
    try { verify(step); } catch (err) { err.message = `${lessonId}/${stepId} (seed ${seed}): ${err.message}\n  text: ${step.text.replace(/\s+/g, ' ').trim()}`; throw err; }
  }
  assert.ok(seen.size >= minVariants, `${lessonId}/${stepId}: only ${seen.size} different questions in ${SEEDS} seeds`);
}
/** A step that is not generated, in the shape the player sees (blanks parsed, options normalised). */
const fixed = (lessonId, stepId) => {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  assert.notEqual(typeof raw.gen, 'function', `${lessonId}/${stepId} is not generated`);
  return resolveStep(raw, makeRng(1), stepId);
};

/* ------------------------------------------------------------ TeX helpers */

/** Turn the TeX used in the lessons into something mathexpr can evaluate. Anything it does not understand fails loudly. */
function tex2expr(tex) {
  let s = String(tex);
  s = s.replace(/\\displaystyle/g, '').replace(/\\left|\\right/g, '');
  s = s.replace(/\\[,;!]|\\q?quad/g, ' ');
  s = s.replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/');
  s = s.replace(/\\[dt]?frac(\d)(\d)/g, '(($1)/($2))');                                  // \tfrac12
  s = s.replace(/\\(sin|cos)\^\{?(\d+)\}?\s*([a-zA-Z])/g, '($1($3))^($2)');                // \sin^4 x
  s = s.replace(/\\(sin|cos)\s*\(/g, '$1(');                                              // \sin(x^2)
  s = s.replace(/\\(sin|cos)\s*(\d*(?:\.\d+)?[a-zA-Z])/g, '$1($2)');                        // \sin x, \sin 2t
  for (let i = 0; i < 6; i++) {
    s = s.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)');
    s = s.replace(/\^\{([^{}]*)\}/g, '^($1)');
  }
  s = s.replace(/\\pi/g, 'pi').trim();
  assert.ok(!/[\\{}]/.test(s), `could not translate the TeX "${tex}" (got "${s}")`);
  return s;
}
/** A typed or TeX expression as a function of one variable. */
const fnOf = (expr, v = 'x') => { const f = compile(expr, { vars: [v] }); return (value) => f({ [v]: value }); };
const texFn = (tex, v = 'x') => fnOf(tex2expr(tex), v);

/** The display formulas of a text. A formula that is set over several lines (aligned) is returned as one line "a = b = c". */
const displays = (text) => Array.from(String(text).matchAll(/\$\$([\s\S]+?)\$\$/g), (m) => m[1]
  .replace(/\\begin\{aligned\}|\\end\{aligned\}/g, '').replace(/\\\\(\[\d+pt\])?/g, ' ').replace(/&/g, '').replace(/\s+/g, ' ').trim());
const display = (text, i = 0) => { const all = displays(text); assert.ok(all.length > i, `text has display formula number ${i + 1}`); return all[i]; };
/** Inline formulas of a text (display formulas are left out). */
const inline = (text) => Array.from(String(text).replace(/\$\$[\s\S]+?\$\$/g, ' ').matchAll(/\$([^$]+)\$/g), (m) => m[1].trim());
/** The pieces of "a = b = c". */
const sides = (tex) => tex.split('=').map((p) => p.trim());
const afterEquals = (tex) => { const p = sides(tex); return p[p.length - 1]; };
const match1 = (re, text, what) => { const m = re.exec(text); assert.ok(m, `the text gives ${what}`); return m; };
const blankNumber = (step, i) => { const b = step.blanks[i]; assert.ok(b && b.kind === 'input' && b.numeric, `blank ${i + 1} is a number`); return b.numbers[0]; };
const blankChoice = (step, i) => { const b = step.blanks[i]; assert.ok(b && b.kind === 'select', `blank ${i + 1} is a dropdown`); return b.answer; };
const correctOption = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, 'exactly one correct option'); return right[0]; };

/* --------------------------------------------------------- numerical tools */

const close = (a, b, rel = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= rel * Math.max(1, Math.abs(a), Math.abs(b));
const near = (a, b, msg = 'values differ', rel = 1e-6) => assert.ok(close(a, b, rel), `${msg}: ${a} vs ${b}`);
/** Derivative by central differences, with one Richardson step (error of order h⁴). */
function D(f, h = 1e-3) {
  const central = (x, step) => (f(x + step) - f(x - step)) / (2 * step);
  return (x) => (4 * central(x, h / 2) - central(x, h)) / 3;
}
/** Simpson's rule. */
function integrate(f, a, b, n = 2000) {
  const h = (b - a) / n;
  let total = f(a) + f(b);
  for (let i = 1; i < n; i++) total += f(a + i * h) * (i % 2 ? 4 : 2);
  return (total * h) / 3;
}
const XS = [-1.3, -0.6, 0.35, 0.9, 1.4];
/** Are f and g the same function, as far as the sample points can tell? */
const sameFn = (f, g, xs = XS, rel = 1e-6) => xs.every((x) => close(f(x), g(x), rel));
const assertSameFn = (f, g, msg, xs = XS, rel = 1e-6) => { for (const x of xs) assert.ok(close(f(x), g(x), rel), `${msg} (at ${x}: ${f(x)} vs ${g(x)})`); };
const round = (v, places = 4) => { const p = 10 ** places; const out = Math.round(v * p) / p; return Object.is(out, -0) ? 0 : out; };
const range = (lo, hi, by = 1) => { const out = []; for (let i = 0; lo + i * by <= hi + 1e-9; i++) out.push(Math.round((lo + i * by) * 1e6) / 1e6); return out; };
const sliderValues = (def) => range(def.min, def.max, def.step || 1);

/** Would the player accept this number for a numeric step? (the same rule as the player's numbersMatch) */
function accepts(step, v) {
  const ok = (target) => (step.tolerance != null ? Math.abs(v - target) <= step.tolerance + 1e-12 : Math.abs(v - target) <= 1e-6 * Math.max(1, Math.abs(target)));
  return ok(step.answer) || (step.accept || []).some(ok);
}
/** Checks shared by every generated `expr` step that asks for a derivative of the function shown in the display formula. */
function checkDerivativeStep(step, xs = XS) {
  const shown = display(step.text);
  assert.match(shown, /^y = /, 'the question shows y = …');
  const f = texFn(shown.replace(/^y = /, ''));
  const answer = fnOf(step.answer);
  assertSameFn(answer, D(f), 'the answer key is not the derivative of the function shown', xs, 1e-6);
  if (step.display) assert.ok(equivalent(step.display, step.answer, ['x']), `the revealed answer "${step.display}" is not the answer key`);
  for (const [wrong, message] of step.wrong) {
    assert.ok(!equivalent(String(wrong), step.answer, ['x']), `"${wrong}" is listed as wrong but is the answer`);
    assert.ok(!sameFn(fnOf(String(wrong)), D(f), xs), `"${wrong}" is listed as wrong but is the derivative`);
    assert.ok(message && message.length > 20, 'a listed slip explains itself');
  }
  // the worked answer: every expression after the first "=" of the last display formula is the derivative
  const worked = displays(step.explain);
  assert.ok(worked.length >= 1, 'the explanation shows its working');
  const parts = sides(worked[worked.length - 1]).slice(1);
  assert.ok(parts.length >= 1);
  for (const part of parts) assertSameFn(texFn(part), D(f), `the explanation's "${part}" is not the derivative`, xs, 1e-6);
  return { f, answer };
}

/* ------------------------------------------------- models of the widgets */

/** What the rate-chain widget reports at x (and k), worked out from its spec with numerical derivatives. */
function chainState(spec, x, k) {
  const vars = spec.k ? ['k'] : [];
  const inner = compile(spec.inner, { vars: ['x', ...vars] });
  const outer = compile(spec.outer, { vars: ['u', ...vars] });
  const g = (v) => inner({ x: v, k });
  const f = (v) => outer({ u: v, k });
  const u = g(x);
  const state = { x, u: round(u), y: round(f(u)), inner: round(D(g)(x)), outer: round(D(f)(u)), total: round(D((v) => f(g(v)))(x)) };
  if (spec.k) state.k = k;
  return state;
}
/** What the product-rect widget reports for a step h, worked out from its spec. */
function rectState(spec, h, x = spec.at) {
  const f = fnOf(spec.f);
  const g = fnOf(spec.g);
  const df = f(x + h) - f(x);
  const dg = g(x + h) - g(x);
  const gain = f(x + h) * g(x + h) - f(x) * g(x);
  return { x, h, f: f(x), g: g(x), df, dg, right: g(x) * df, top: f(x) * dg, corner: df * dg, gain, rate: gain / h, cornerShare: (df * dg) / gain };
}

/* ====================================================== lesson 1: chain rule */

test('chain rule: powers of an inside function', () => {
  eachVariant('chain-rule', 'power-chain', (step) => {
    const { answer } = checkDerivativeStep(step);
    // "multiply by its derivative, $a$": the slip times that factor is the answer, and the factor is the slope of the inside
    const insideTex = match1(/The inside, \$(.+?)\$, is changing too: multiply by its derivative, \$(.+?)\$/, step.wrong[0][1], 'the inside and its derivative');
    const inside = texFn(insideTex[1]);
    const dInside = texFn(insideTex[2]);
    assertSameFn(dInside, D(inside), 'the derivative of the inside quoted in the feedback');
    assertSameFn((x) => fnOf(step.wrong[0][0])(x) * dInside(x), answer, 'outside rate × inside rate is the answer');
    assert.ok(step.wrong[1][1].includes(`multiply by $${insideTex[2]}$`), 'the second slip quotes the same factor');
    assertSameFn((x) => answer(x) * inside(x), fnOf(step.wrong[2][0]), 'the third slip is the answer with the power not lowered');
    // hint 2: "Outside: $n(inside)^{n-1}$" is the first slip
    assertSameFn(texFn(match1(/Outside: \$(.+?)\$/, step.hints[1], 'the outside rate')[1]), fnOf(step.wrong[0][0]), 'the hint\'s outside rate');
    assert.ok(!/\b1x|\+ -|- -/.test(step.text + step.explain), 'tidy signs');
  }, 20);
});

test('chain rule: exponentials with an inside function', () => {
  eachVariant('chain-rule', 'exp-chain', (step) => {
    const { f, answer } = checkDerivativeStep(step, [-1.1, -0.4, 0.3, 0.8, 1.2]);
    const d = texFn(match1(/derivative of the inside, \$(.+?)\$/, step.wrong[0][1], 'the derivative of the inside')[1]);
    assertSameFn(fnOf(step.wrong[0][0]), f, 'the first slip is the function itself (the outside alone)');
    assertSameFn((x) => f(x) * d(x), answer, 'e^u × (derivative of the inside) is the answer');
    const insideTex = match1(/y = e\^\{(.+)\}$/, display(step.text), 'the exponent')[1];
    assertSameFn(d, D(texFn(insideTex)), 'the derivative of the exponent quoted in the feedback');
    assert.ok(step.text.includes('`e^(2x)`'), 'the question says how to type an exponent');
    assert.ok(!/\b1x|\+ -|- -|-1e|[^.\d]1e\^/.test(step.text + step.explain + step.hints.join(' ')), 'tidy coefficients');
  }, 12);
});

test('chain rule: the slope of a square root, step by step', () => {
  eachVariant('chain-rule', 'root', (step) => {
    const c = Number(match1(/y = \\sqrt\{x\^2 \+ (\d+)\}/, step.text, 'the function')[1]);
    const x = Number(match1(/at \$x = (-?\d+)\$/, step.text, 'the point')[1]);
    const f = (v) => Math.sqrt(v * v + c);
    const u = x * x + c;
    assert.equal(blankNumber(step, 0), u, 'u at the point');
    near(blankNumber(step, 1) ** 2, u, 'the square root of u');
    assert.ok(Number.isInteger(blankNumber(step, 1)), 'the root is a whole number');
    assert.equal(blankNumber(step, 2), 2 * Math.sqrt(u), 'twice the root');
    near(blankNumber(step, 3), D((v) => v * v + c)(x), 'the rate of the inside');
    near(blankNumber(step, 4), D(f)(x), 'the slope of the curve');
    near(blankNumber(step, 4), blankNumber(step, 3) / blankNumber(step, 2), 'the slope is the product of the two rates');
    // the worked answer and the general formula
    near(Number(afterEquals(display(step.explain, 0))), D(f)(x), 'the slope in the explanation');
    const general = inline(step.explain).filter((m) => m.startsWith('\\dfrac{x}'));
    assert.equal(general.length, 1, 'the explanation gives the general derivative');
    assertSameFn(texFn(general[0]), D(f), 'the general derivative of the root');
    assert.equal(step.template.includes(`$x = ${x}$`), true);
  }, 10);
});

test('chain rule: the balloon', () => {
  eachVariant('chain-rule', 'balloon', (step) => {
    const rate = Number(match1(/grows at \*\*([\d.]+) cm per second\*\*/, step.text, 'the rate of the radius')[1]);
    const radius = Number(match1(/when \$r = (\d+)\$ cm/, step.text, 'the radius')[1]);
    const V = (rr) => (4 / 3) * Math.PI * rr ** 3;
    const dVdr = D(V)(radius);
    // let the radius really grow for a short time and measure the volume
    const dt = 1e-6;
    const measured = (V(radius + rate * dt) - V(radius - rate * dt)) / (2 * dt);
    near(step.answer * Math.PI, measured, 'dV/dt', 1e-6);
    near(step.answer * Math.PI, dVdr * rate, 'dV/dr × dr/dt');
    near(step.wrong[0][0] * Math.PI, dVdr, 'the first slip is dV/dr');
    assert.ok(step.wrong[0][1].includes(`multiply by ${rate}.`), 'and its feedback names the missing factor');
    near(step.wrong[2][0], step.answer * Math.PI, 'the third slip includes π');
    for (const [value] of step.wrong) assert.ok(!accepts(step, value), `${value} is not accepted`);
    const quoted = match1(/= (\d+(?:\.\d+)?)\\pi \\approx (\d+)/, step.explain, 'the result');
    assert.equal(Number(quoted[1]), step.answer);
    assert.equal(Number(quoted[2]), Math.round(step.answer * Math.PI));
    assert.ok(step.explain.includes(`That is about ${Math.round(step.answer * Math.PI)} cm³ per second.`), 'the result in words');
    const lines = sides(display(step.explain)).slice(1, 3).map((t) => fnOf(tex2expr(t.replace(/\\frac\{dV\}\{dr\}/, `(${dVdr})`).replace(/\\frac\{dr\}\{dt\}/, `(${rate})`)))(0));
    for (const value of lines) near(value, measured, 'each line of the working is dV/dt', 1e-6);
    assert.match(step.unit, /\\pi/, 'π is written after the box');
  }, 8);
});

test('chain rule: fixed facts', () => {
  // the bike of the opening question, and the square whose second link changes
  const hook = fixed('chain-rule', 'hook');
  assert.equal(correctOption(hook).text, '6 metres');
  const square = fixed('chain-rule', 'square');
  const spec = square.figures[0];
  const at2 = chainState(spec, 2);
  const at3 = chainState(spec, 3);
  assert.deepEqual([blankNumber(square, 0), blankNumber(square, 1), blankNumber(square, 2), blankNumber(square, 3)], [at2.inner, at2.outer, at2.total, at3.total]);
  assert.equal(blankChoice(square, 4), 'multiplied');
  for (const x of range(0.5, 4, 0.5)) { const s = chainState(spec, x); near(s.inner * s.outer, s.total, `rates multiply at t = ${x}`); }
  assert.ok(square.text.includes('s = 3t') && square.text.includes('A = s^2'));
  assert.ok(square.template.includes('rates 3 and 18'), 'the rates at t = 3');
  assert.deepEqual([at3.inner, at3.outer], [3, 18]);
  near(D((t) => (3 * t) ** 2)(2), 36); // "A = 9t², so dA/dt = 18t, which is 36 at t = 2"

  // (3x + 1)² both ways
  const two = fixed('chain-rule', 'two-ways');
  const d = D((x) => (3 * x + 1) ** 2);
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => blankNumber(two, i)), [round(d(1) - d(0)), round(d(0)), round(D((x) => 3 * x + 1)(0.7)), round(d(1) - d(0)), round(d(0))]);
  assertSameFn((x) => 9 * x * x + 6 * x + 1, (x) => (3 * x + 1) ** 2, 'the expansion quoted');

  // the three attempts at the derivative of (x² + 1)²
  const measure = fixed('chain-rule', 'measure');
  const curve = fnOf(measure.figures[0].fns[0].expr);
  assertSameFn(curve, (x) => (x * x + 1) ** 2, 'the curve drawn');
  near(D(curve)(1), 8, 'the measured slope at x = 1');
  for (const o of measure.options) {
    const attempt = texFn(inline(o.text)[0]);
    assert.equal(sameFn(attempt, D(curve)), !!o.correct, `option ${o.text}`);
    if (!o.correct) { near(attempt(1), 4, `"${o.text}" gives 4 at x = 1, as its feedback says`); assert.match(o.why, /gives 4, but the measured slope is 8/); }
  }
  const snap = measure.figures[0].points[0].snap;
  assert.ok(Number.isInteger(1 / snap), 'the point can be put on x = 1');

  // inside and outside
  const outsides = [(u) => u * u, (u) => Math.exp(u), (u) => Math.sqrt(u), (u) => u ** 3];
  fixed('chain-rule', 'inside-outside').pairs.forEach(([whole, inside], i) => {
    const u = texFn(inline(inside)[0].replace(/^u = /, ''));
    assertSameFn(texFn(inline(whole)[0]), (x) => outsides[i](u(x)), `${whole} is its outside applied to ${inside}`);
  });

  // the table of the recipe
  const rows = fixed('chain-rule', 'recipe').text.split('\n').filter((l) => /^\s*\|\s*\$/.test(l)).map((l) => l.split('|').slice(1, 4).map((c) => inline(c)[0]));
  assert.equal(rows.length, 3);
  for (const [whole, outside, inside] of rows) assertSameFn((x) => texFn(outside)(x) * texFn(inside)(x), D(texFn(whole)), `outside × inside for ${whole}`);

  // right, or missing the inside factor
  const sort = fixed('chain-rule', 'sort-slips');
  let right = 0;
  for (const item of sort.items) {
    const [from, to] = inline(item.text)[0].split(/\\;\\to\\;/).map((t) => texFn(t));
    const correct = sameFn(to, D(from), [-0.9, -0.4, 0.3, 0.7, 1.2]);
    assert.equal(item.bucket, correct ? 0 : 1, item.text);
    if (correct) right++;
    else {
      const fix = match1(/the answer is \$(.+?)\$/, item.why, 'the right derivative');
      assertSameFn(texFn(fix[1]), D(from), `the correction of ${item.text}`, [-0.9, -0.4, 0.3, 0.7, 1.2]);
      const insideD = match1(/has derivative \$(.+?)\$/, item.why, 'the derivative of the inside');
      assertSameFn((x) => to(x) * texFn(insideD[1])(x), D(from), `the missing factor of ${item.text}`, [-0.9, -0.4, 0.3, 0.7, 1.2]);
    }
  }
  assert.equal(right, 3, 'three correct lines and three slips');
});

test('chain rule: changing gear accepts exactly the gear that gives 8 metres', () => {
  const gears = fixed('chain-rule', 'gears');
  const spec = gears.widget;
  let passes = 0;
  for (const k of sliderValues(spec.k)) for (const x of [0.5, 1, 3]) {
    const state = chainState(spec, x, k);
    const metres = D((p) => 2 * (k * p))(1);                       // metres per pedal turn in this gear
    near(state.total, metres);
    const said = gears.check(state);
    assert.equal(said === true, close(metres, 8), `gear ${k}`);
    if (said === true) { passes++; continue; }
    assert.ok(said.includes(`carries the bike ${state.total} m`) && said.includes(`${k} wheel ${k === 1 ? 'turn' : 'turns'} of 2 m`), said);
    assert.equal(/higher gear/.test(said), metres < 8, said);
    assert.equal(/lower gear/.test(said), metres > 8, said);
  }
  assert.equal(passes, 3, 'one gear, whatever the position of the pedals');
  assert.equal(gears.check(chainState(spec, spec.start, gears.solution.k)), true);
  assert.notEqual(gears.check(chainState(spec, spec.start, spec.k.value)), true, 'not solved at the start');
  near(chainState(spec, 1, 3).total, 6, 'the gear of the opening question gives 6 m');
});

/* =================================================== lesson 2: product rule */

test('product rule: the slope of a product from values and slopes', () => {
  eachVariant('product-rule', 'from-table', (step) => {
    const row = (name) => match1(new RegExp(`\\| \\$${name}\\$ \\| \\$(-?\\d+)\\$ \\| \\$(-?\\d+)\\$ \\|`), step.text, `the row for ${name}`).slice(1, 3).map(Number);
    const [f, df] = row('f');
    const [g, dg] = row('g');
    const x0 = Number(match1(/slope at \$x = (\d+)\$/, step.text, 'the point')[1]);
    // two straight lines with those values and slopes; their product is differentiated numerically
    const product = (x) => (f + df * (x - x0)) * (g + dg * (x - x0));
    near(step.answer, D(product)(x0), 'the slope of the product');
    const slips = { 'multiplies the two slopes': df * dg, 'value of the product': f * g, 'adds the two slopes': df + dg, 'not subtracted': df * g - f * dg };
    assert.equal(step.wrong.length, 4, 'all four slips are different from the answer');
    for (const [value, message] of step.wrong) {
      assert.notEqual(value, step.answer);
      const key = Object.keys(slips).find((k) => message.includes(k));
      assert.ok(key, `feedback "${message}" is one of the four known slips`);
      assert.equal(value, slips[key], message);
    }
    assert.equal(new Set(step.wrong.map((w) => w[0])).size, 4, 'no two slips give the same number');
    assert.equal(Number(afterEquals(inline(step.explain)[0])), step.answer, 'the explanation ends at the answer');
    const terms = match1(/= (-?\d+) ([+-]) (\d+) =/, step.explain, 'the two strips');
    assert.equal(Number(terms[1]), df * g);
    assert.equal((terms[2] === '-' ? -1 : 1) * Number(terms[3]), f * dg);
  }, 50);
});

test('product rule: products with e^x', () => {
  eachVariant('product-rule', 'product-expr', (step) => {
    const { answer } = checkDerivativeStep(step);
    // the first two listed slips are the two strips: together they are the answer
    assertSameFn((x) => fnOf(step.wrong[0][0])(x) + fnOf(step.wrong[1][0])(x), answer, 'the two strips add up to the answer');
    const factored = afterEquals(display(step.explain));
    assert.ok(equivalent(tex2expr(factored), step.answer, ['x']), `the factored form ${factored} is accepted`);
    assert.ok(!/\b1x|\+ -|\(1x/.test(step.explain + step.text), 'tidy terms');
  }, 12);
});

test('product rule: the peak of x·e^(−x/k)', () => {
  eachVariant('product-rule', 'peak', (step) => {
    const tex = match1(/\$\\;y = (.+?)\\;\$/, step.text, 'the curve')[1];
    const f = texFn(tex);
    const fig = step.figures[0];
    assertSameFn(fnOf(fig.fns[0].expr), f, 'the curve drawn is the curve in the question', [0.2, 1, 2.5, 4]);
    let best = 0;
    for (let x = 0; x <= fig.x[1]; x += 0.001) if (f(x) > f(best)) best = x;
    near(step.answer, best, 'the highest point, by brute force', 2e-3);
    near(D(f)(step.answer), 0, 'the slope there is zero', 1e-7);
    assert.ok(f(step.answer) < fig.y[1], 'the peak is inside the picture');
    const snap = fig.points[0].snap;
    near(Math.round(step.answer / snap) * snap, step.answer, 'the point can be dragged onto the peak');
    for (const [value, message] of step.wrong) {
      assert.ok(Math.abs(D(f)(value)) > 0.05, `the slope at the "wrong" value ${value} is not zero`);
      if (value === 0) { assert.match(message, /slope there is 1/); near(D(f)(0), 1, 'the slope at 0'); }
    }
    for (const part of sides(display(step.explain)).slice(1)) assertSameFn(texFn(part), D(f), `the explanation's ${part}`, [0.3, 1, 2.2, 5]);
    const hinted = sides(inline(step.hints[1])[0]);
    for (const part of hinted.slice(1)) assertSameFn(texFn(part), D(f), `the hint's ${part}`, [0.3, 1, 2.2, 5]);
    const gPrime = match1(/g' = (.+?)\$/, step.hints[0], 'the derivative of the exponential')[1];
    const g = texFn(match1(/g = (.+?)\$/, step.hints[0], 'the exponential')[1]);
    assertSameFn(texFn(gPrime), D(g), 'the chain-rule derivative in the first hint', [0.3, 1, 2.2, 5]);
  }, 4);
});

test('product rule: the quotient rule at a point', () => {
  eachVariant('product-rule', 'quotient-use', (step) => {
    const f = texFn(display(step.text).replace(/^y = /, ''));
    const p = Number(match1(/where \$x = (-?\d+)\$/, step.text, 'the point')[1]);
    near(step.answer, D(f)(p), 'the slope of the quotient');
    assert.ok(Math.abs(step.answer * 1000 - Math.round(step.answer * 1000)) < 1e-9, 'the answer is a short decimal');
    const [top, bottom] = match1(/\\frac\{(.+?)\}\{(.+?)\}/, display(step.text), 'top and bottom').slice(1, 3).map((t) => texFn(t));
    assert.ok(Math.abs(bottom(p)) > 1e-9, 'the bottom is not zero at the point');
    assert.equal(step.wrong.length, 3);
    near(step.wrong[0][0], D(top)(p) / D(bottom)(p), 'slip 1 divides the derivatives');
    near(step.wrong[1][0], f(p), 'slip 2 is the height');
    near(step.wrong[2][0], (D(top)(p) * bottom(p) - top(p) * D(bottom)(p)) / bottom(p), 'slip 3 forgets to square the bottom');
    for (const [value] of step.wrong) assert.ok(!accepts(step, value));
    assert.equal(new Set(step.wrong.map((w) => round(w[0], 6))).size, 3, 'three different slips');
    const general = sides(display(step.explain)).slice(1);
    for (const part of general) assertSameFn(texFn(part), D(f), `the explanation's ${part}`, [0.2, 0.9, 1.7, 3.1]);
    near(Number(afterEquals(inline(step.explain).pop())), step.answer, 'the explanation ends at the answer');
    assert.ok(!/\b1\(x|\b1x/.test(step.explain + step.hints.join(' ')), 'no "1(x + a)" or "1x"');
  }, 12);
});

test('product rule: product rule and chain rule together', () => {
  eachVariant('product-rule', 'both-rules', (step) => {
    const { answer } = checkDerivativeStep(step, [-1.1, -0.5, 0.3, 0.8, 1.2]);
    // "f·g' alone" plus "f'·g" is the answer
    const alone = step.wrong.find(([, m]) => /alone/.test(m));
    const other = texFn(match1(/f' \\cdot g = (.+?)\$/, alone[1], 'the other strip')[1]);
    assertSameFn((x) => fnOf(alone[0])(x) + other(x), answer, 'the two strips add up', [-1.1, -0.5, 0.3, 0.8, 1.2]);
    const gPrime = match1(/g' = ([^$]+?)\$\. Now/, step.hints[1], 'the derivative of g')[1];
    const g = texFn(match1(/g = (.+?)\$/, step.hints[0], 'g')[1]);
    assertSameFn(texFn(afterEquals(gPrime)), D(g), 'the chain-rule derivative in the hint', [-1.1, -0.5, 0.3, 0.8, 1.2]);
    assert.ok(!/-1e|[^.\d]1e\^|\+ -/.test(step.explain + step.hints.join(' ') + step.wrong.map((w) => w[1]).join(' ')), 'tidy coefficients');
  }, 12);
});

test('product rule: fixed facts', () => {
  const strips = fixed('product-rule', 'strips');
  const spec = strips.widget;
  const area = (t) => fnOf(spec.f)(t) * fnOf(spec.g)(t);
  // the opening question and the limit of the strips
  assert.equal(correctOption(fixed('product-rule', 'hook')).text, '23 cm² per second');
  near(D(area)(0), 23, 'the area of the 5 by 4 rectangle grows at 23');
  assert.deepEqual([fnOf(spec.f)(0), fnOf(spec.g)(0), D(fnOf(spec.f))(0), D(fnOf(spec.g))(0)].map((v) => round(v)), [5, 4, 2, 3]);
  assert.match(strips.text, /it gains 29 cm²/);
  near(rectState(spec, 1).gain, 29);
  // the same with letters: 8h + 15h + 6h², so 8 + 15 + 6h
  const pieces = fixed('product-rule', 'pieces');
  const h = 0.001;
  const s = rectState(spec, h);
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => blankNumber(pieces, i)), [round(s.right / h), round(s.top / h), round(s.corner / (h * h)), round(s.corner / (h * h)), round(D(area)(0))]);
  for (const hh of spec.steps) near(rectState(spec, hh).rate, 8 + 15 + 6 * hh, `gain ÷ step for h = ${hh}`);
  assert.match(strips.explain, /first 6, then 3, 1\.5, 0\.6 and 0\.06/);
  assert.deepEqual(spec.steps.map((hh) => round(rectState(spec, hh).corner / hh)), [6, 3, 1.5, 0.6, 0.06]);

  // x·x: only the product rule gives 2x
  const obvious = fixed('product-rule', 'not-product');
  const truth = D((x) => x * x);
  for (const o of obvious.options) {
    const formula = inline(o.text)[0];
    if (formula) assert.equal(sameFn(texFn(formula), truth), !!o.correct, o.text);
    else assert.ok(!o.correct && /agree only at \$x = \\frac12\$/.test(o.why));
  }
  near(truth(0.5), 1, 'the two rules agree at x = 1/2 and nowhere else');
  const sq = rectState(obvious.figures[0], 0.01, 3);
  near(sq.right / 0.01, 3); near(sq.top / 0.01, 3);          // two strips, each x long

  // (2x + 1)(x² + 3), by the product rule and multiplied out
  const guided = fixed('product-rule', 'guided');
  const y = (x) => (2 * x + 1) * (x * x + 3);
  const dy = D(y);
  const a = (dy(1) + dy(-1)) / 2 - dy(0);
  const b = (dy(1) - dy(-1)) / 2;
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => blankNumber(guided, i)), [round(D((x) => 2 * x + 1)(0.3)), round(D((x) => x * x + 3)(1) / 1), round(a), round(b), round(a)]);
  near(dy(0), 6, 'the constant term of the derivative');
  assertSameFn(y, (x) => 2 * x ** 3 + x * x + 6 * x + 3, 'the expansion quoted');
  assertSameFn(dy, (x) => 2 * (x * x + 3) + (2 * x + 1) * 2 * x, 'the product-rule line quoted');

  // which rule: a small classifier that looks only at how the formula is built
  const classify = (tex) => {
    if (/^\(.+\)\^\d+$/.test(tex) || /^e\^\{\d+x\}$/.test(tex) || /^\\sqrt\{.+\}$/.test(tex)) return 0;     // one function inside another
    if (/\\cdot/.test(tex) || /^\(.+\)\\,e\^x$/.test(tex)) return 1;                                         // two functions of x multiplied
    return 2;
  };
  const which = fixed('product-rule', 'which-rule');
  for (const item of which.items) assert.equal(item.bucket, classify(inline(item.text)[0]), item.text);
  assert.deepEqual([0, 1, 2].map((bkt) => which.items.filter((it) => it.bucket === bkt).length), [3, 2, 2]);
  near(D((x) => 5 * x ** 4)(1.3), 20 * 1.3 ** 3, 'the derivative quoted for 5x⁴');
});

test('product rule: shrinking the step accepts only the smallest step, and its feedback is true', () => {
  const strips = fixed('product-rule', 'strips');
  for (const h of strips.widget.steps) {
    const state = rectState(strips.widget, h);
    const said = strips.check(state);
    assert.equal(said === true, h <= 0.01, `h = ${h}`);
    if (said === true) continue;
    const quoted = match1(/step of ([\d.]+) the area gained ÷ step is ([\d.]+), and the corner still supplies ([\d.]+) of that/, said, 'its numbers');
    assert.deepEqual(quoted.slice(1, 4).map(Number), [h, round(state.rate), round(state.corner / h)]);
  }
  assert.equal(strips.check(rectState(strips.widget, strips.solution.h)), true);
  assert.equal(Math.min(...strips.widget.steps), 0.01, 'the step can be shrunk to 0.01');
});

/* ============================================ lesson 3: the slope of a wave */

const piAngle = (tex) => {
  if (tex === '0') return 0;
  let m = /^\\frac\{(\d*)\\pi\}\{(\d+)\}$/.exec(tex);
  if (m) return ((m[1] === '' ? 1 : Number(m[1])) * Math.PI) / Number(m[2]);
  m = /^(\d*)\\pi$/.exec(tex);
  assert.ok(m, `"${tex}" is a multiple of π`);
  return (m[1] === '' ? 1 : Number(m[1])) * Math.PI;
};

test('trig derivatives: the slope of sine or cosine at a special angle', () => {
  const answers = new Set();
  eachVariant('trig-derivatives', 'values', (step) => {
    const m = match1(/\$\\;y = \\(sin|cos) x\\;\$ at \$\\;x = (.+?)\$\?/, step.text, 'the function and the point');
    const f = m[1] === 'sin' ? Math.sin : Math.cos;
    const x = piAngle(m[2]);
    near(step.answer, D(f)(x), 'the slope of the wave', 1e-7);
    assert.ok([0, 0.5, -0.5, 1, -1].includes(step.answer), 'an exact, simple value');
    answers.add(`${m[1]} ${step.answer}`);
    const fig = step.figures[0];
    near(fig.points[0].x, x, 'the marked point');
    assertSameFn(fnOf(fig.fns[0].expr), f, 'the curve drawn');
    for (const [value, message] of step.wrong) {
      assert.ok(!accepts(step, value), `${value} is not the answer`);
      if (/height of the curve/.test(message)) near(value, f(x), 'the "height" slip', 1e-9);
      else { assert.match(message, /Check the sign/); near(value, -step.answer); }
    }
    // the value quoted in the second hint and in the explanation
    const quoted = match1(/\$\\(sin|cos) ([^$]+?) = (-?[\d.]+)\$/, step.hints[1], 'a value');
    near(Number(quoted[3]), (quoted[1] === 'sin' ? Math.sin : Math.cos)(piAngle(quoted[2])), 'the value in the hint', 1e-9);
    assert.equal(quoted[1], m[1] === 'sin' ? 'cos' : 'sin', 'the hint uses the derivative, not the function');
    const told = match1(/\$\\(sin|cos) ([^$]+?) = (-?[\d.]+)\$/, step.explain, 'a value in the explanation');
    near(Number(told[3]), (told[1] === 'sin' ? Math.sin : Math.cos)(piAngle(told[2])), 'the value in the explanation', 1e-9);
    assert.ok(step.explain.trim().endsWith(m[1] === 'sin' ? `= ${step.answer}$.` : `the slope is $${step.answer}$.`), 'the explanation ends at the answer');
  }, 15);
  assert.ok(answers.size >= 9, 'both functions and all five values occur');
});

test('trig derivatives: the chain rule on a wave', () => {
  eachVariant('trig-derivatives', 'chain', (step) => {
    const { f, answer } = checkDerivativeStep(step, [-1.2, -0.5, 0.3, 0.8, 1.3]);
    const forgot = step.wrong.find(([, m]) => /outside alone/.test(m));
    const d = match1(/multiply by its derivative, \$?([^$.]+?)\$?\.$/, forgot[1], 'the derivative of the inside')[1];
    const insideTex = match1(/The inside, \$(.+?)\$,/, forgot[1], 'the inside')[1];
    assertSameFn(texFn(d), D(texFn(insideTex)), 'the derivative of the inside in the feedback');
    assertSameFn((x) => fnOf(forgot[0])(x) * texFn(d)(x), answer, 'outside × inside', [-1.2, -0.5, 0.3, 0.8, 1.3]);
    const sign = step.wrong.find(([, m]) => /Check the sign/.test(m));
    assertSameFn((x) => -fnOf(sign[0])(x), answer, 'the sign slip is minus the answer', [-1.2, -0.5, 0.3, 0.8, 1.3]);
    assert.equal(/derivative of sine is \$\+\\cos\$/.test(sign[1]), /\\sin/.test(display(step.text)), 'the sign feedback names the right function');
    assert.ok(Math.abs(f(0.3)) <= 1, 'a wave');
  }, 10);
});

test('trig derivatives: products with a wave', () => {
  eachVariant('trig-derivatives', 'product', (step) => {
    const { answer } = checkDerivativeStep(step, [-1.2, -0.5, 0.3, 0.8, 1.3]);
    const alone = step.wrong.find(([, m]) => /alone/.test(m));
    const fPrime = texFn(match1(/f' = (.+?)\$/, alone[1], "f'")[1]);
    const g = texFn(match1(/g = (.+?)\$/, step.hints[0], 'g')[1]);
    assertSameFn((x) => fnOf(alone[0])(x) + fPrime(x) * g(x), answer, 'the two strips add up', [-1.2, -0.5, 0.3, 0.8, 1.3]);
    const [fP, gP] = Array.from(step.hints[1].matchAll(/' = (.+?)\$/g), (mm) => texFn(mm[1]));
    assertSameFn(fP, D(texFn(match1(/f = (.+?)\$/, step.hints[0], 'f')[1])), "f' in the hint", [-1.2, -0.5, 0.3, 0.8, 1.3]);
    assertSameFn(gP, D(g), "g' in the hint", [-1.2, -0.5, 0.3, 0.8, 1.3]);
    assert.equal(new Set(step.wrong.map((w) => w[0])).size, step.wrong.length, 'no slip is listed twice');
    for (let i = 0; i < step.wrong.length; i++) for (let j = i + 1; j < step.wrong.length; j++) assert.ok(!equivalent(step.wrong[i][0], step.wrong[j][0], ['x']), 'no two slips are the same function');
  }, 6);
});

test('trig derivatives: fixed facts', () => {
  // the opening guess
  near(D(Math.sin)(0), fixed('trig-derivatives', 'hook').answer, 'the slope of sine at 0');

  // four readings, and the name of the curve
  const rec = fixed('trig-derivatives', 'recognise');
  const at = [0, Math.PI / 2, Math.PI, 1.5 * Math.PI];
  assert.deepEqual([0, 1, 2, 3].map((i) => blankNumber(rec, i)), at.map((x) => round(D(Math.sin)(x))));
  const named = { 'sin x': Math.sin, 'cos x': Math.cos, '−sin x': (x) => -Math.sin(x), '−cos x': (x) => -Math.cos(x) };
  for (const name of rec.blanks[4].options) assert.equal(at.every((x) => close(named[name](x), D(Math.sin)(x))), name === blankChoice(rec, 4), name);
  const P = rec.figures[0].points[0];
  near(P.snap, Math.PI / 2); near(P.xMax, 2 * Math.PI);
  assertSameFn(fnOf(rec.figures[0].fns[0].expr), Math.sin, 'the curve drawn');

  // the cycle of four
  const cycle = fixed('trig-derivatives', 'cycle');
  let current = Math.cos;
  for (const i of [0, 1, 2]) { const next = named[blankChoice(cycle, i)]; assertSameFn(next, D(current), `derivative number ${i + 2}`); current = next; }
  assertSameFn(current, Math.sin, 'back at sine');
  assert.equal(blankNumber(cycle, 3), 4);
  assert.equal(blankChoice(cycle, 4), 'minus');
  assertSameFn(D(D(Math.sin, 1e-2), 1e-2), (x) => -Math.sin(x), 'the second derivative of sine', XS, 1e-5);

  // the derivative of cosine is negative exactly on the upper half
  const sign = fixed('trig-derivatives', 'cos-sign');
  const regions = [
    [/upper half/, (t) => t > 0 && t < Math.PI],
    [/right-hand half/, (t) => Math.cos(t) > 0],
    [/first quarter/, (t) => t > 0 && t < Math.PI / 2],
    [/Everywhere/, () => true],
  ];
  const thetas = range(1, 359, 1).filter((d) => d % 90 !== 0).map((d) => (d * Math.PI) / 180);
  for (const o of sign.options) {
    const region = regions.find(([re]) => re.test(o.text));
    assert.ok(region, `option "${o.text}" is one of the four regions`);
    assert.equal(thetas.every((t) => (D(Math.cos)(t) < 0) === region[1](t)), !!o.correct, o.text);
  }

  // degrees: the slope at 0 is π/180
  const deg = fixed('trig-derivatives', 'degrees');
  const inDegrees = fnOf(deg.figures[0].fns[0].expr);
  near(inDegrees(90), 1); near(inDegrees(30), 0.5);
  const slope = D(inDegrees, 1e-2)(0);
  for (const o of deg.options) {
    const value = fnOf(tex2expr(inline(o.text)[0]), 'x')(0);
    assert.equal(close(value, slope, 1e-6), !!o.correct, o.text);
    if (!o.correct) near(Number(match1(/\\approx ([\d.]+)/, o.why, 'its decimal')[1]), round(value, 4), 'the decimal quoted');
  }
  near(slope, 0.01745, 'π/180 as quoted', 1e-5);
  near(round(slope, 4), 0.0175);
  near(1 / slope, 57.3, 'a run of about 57 for a rise of 1', 1e-3);
  assertSameFn(D(inDegrees, 1e-2), (x) => (Math.PI / 180) * Math.cos((Math.PI / 180) * x), 'the chain-rule derivative in the explanation', [0, 20, 75, 130]);

  // the spring: acceleration is minus position
  const spring = fixed('trig-derivatives', 'spring');
  const [position, acceleration] = spring.figures[0].fns.map((f) => fnOf(f.expr));
  assertSameFn(acceleration, D(D(position, 1e-2), 1e-2), 'the acceleration curve is the second derivative of the position', XS, 1e-5);
  let hardest = 0;
  for (let t = 0; t <= 2 * Math.PI; t += 0.001) if (Math.abs(acceleration(t)) > Math.abs(acceleration(hardest))) hardest = t;
  near(Math.abs(position(hardest)), 1, 'the pull is hardest at the end of the swing', 1e-5);
  assert.match(correctOption(spring).text, /top and the bottom/);
  near(acceleration(Math.PI), 0, 'no pull in the middle', 1e-9);

  // match each function with its derivative
  for (const [from, to] of fixed('trig-derivatives', 'match').pairs) assertSameFn(texFn(inline(to)[0]), D(texFn(inline(from)[0])), `${from} → ${to}`);

  // the picture of the proof: the velocity is the radius turned through a right angle
  for (const d of range(0, 360, 15)) {
    const t = (d * Math.PI) / 180;
    const radius = [Math.cos(t), Math.sin(t)];
    const velocity = [D(Math.cos)(t), D(Math.sin)(t)];
    near(radius[0] * velocity[0] + radius[1] * velocity[1], 0, 'velocity ⟂ radius', 1e-9);
    near(Math.hypot(...velocity), 1, 'unit speed', 1e-9);
    near(velocity[0], -radius[1]); near(velocity[1], radius[0]);
  }
});

test('trig derivatives: the interactive checks', () => {
  const circle = fixed('trig-derivatives', 'circle');
  const step = circle.widget.step;
  const stateAt = (d) => { const t = (d * Math.PI) / 180; return { deg: d, sin: round(Math.sin(t)), cos: round(Math.cos(t)), vx: round(D(Math.cos)(t)), vy: round(D(Math.sin)(t)) }; };
  const passing = [];
  for (const d of range(0, 360, step)) {
    const state = stateAt(d);
    const said = circle.check(state);
    assert.equal(said === true, state.vy === 0.5, `${d}°`);
    if (said === true) { passing.push(d); continue; }
    if (/falling/.test(said)) assert.ok(state.vy < 0 && said.includes(`at ${round(-state.vy, 2)}.`), said);
    else if (/straight sideways/.test(said)) assert.equal(state.vy, 0);
    else if (/more than 0\.5/.test(said)) assert.ok(state.vy > 0.5 && said.includes(`rising at ${round(state.vy, 2)},`), said);
    else { assert.match(said, /rising at only/); assert.ok(state.vy > 0 && state.vy < 0.5 && said.includes(`only ${round(state.vy, 2)}.`), said); }
    if (/right-hand half/.test(said)) assert.ok(Math.cos((d * Math.PI) / 180) < 1e-9, 'the falling places are on the left');
  }
  assert.deepEqual(passing, [60, 300], 'π/3 and 5π/3, as the explanation says');
  assert.equal(circle.check(stateAt(circle.solution.deg)), true);
  assert.notEqual(circle.check(stateAt(circle.widget.deg)), true, 'not solved at the start');
  assert.equal(stateAt(60).cos, 0.5, 'and the x-coordinate there is 0.5 as well');

  const trace = fixed('trig-derivatives', 'trace');
  assert.equal(trace.check({ done: true }), true);
  assert.equal(typeof trace.check({ done: false }), 'string');
  assertSameFn(fnOf(trace.widget.fn), Math.sin, 'the traced curve');
});

/* ================================================== lesson 4: substitution */

test('substitution: choosing the inside function', () => {
  const seen = new Set();
  eachVariant('substitution', 'choose-u', (step) => {
    const integrand = texFn(match1(/^\\int (.+?)\\,dx$/, display(step.text), 'the integrand')[1]);
    seen.add(display(step.text));
    const after = texFn(match1(/\\int (.+?)\\,du/, step.explain, 'the integral in u')[1], 'u');
    const xs = [0.3, 0.7, 1.1, 1.4];
    for (const o of step.options) {
      const u = texFn(match1(/^\$u = (.+)\$$/, o.text, 'a substitution')[1]);
      const fits = xs.every((x) => close(after(u(x)) * D(u)(x), integrand(x), 1e-6));
      assert.equal(fits, !!o.correct, `u from ${o.text}: f(u)·u' ${fits ? 'is' : 'is not'} the integrand`);
      if (!o.correct) assert.ok(o.why && o.why.length > 30, 'a wrong substitution explains itself');
      // "… is the derivative of the inside": true of the option it is said about
      if (!o.correct && /\*derivative\* of the inside/.test(o.why)) {
        const inside = texFn(match1(/^\$u = (.+)\$$/, correctOption(step).text, 'the inside')[1]);
        assertSameFn(u, D(inside), `${o.text} really is the derivative of the inside`, xs);
      }
      if (!o.correct && /Then \$du = (.+?)\\,dx\$/.test(o.why)) assertSameFn(texFn(/Then \$du = (.+?)\\,dx\$/.exec(o.why)[1]), D(u), 'the du quoted for a wrong substitution', xs);
    }
    assert.equal(`$u = ${match1(/With \$u = (.+?)\$/, step.explain, 'the substitution')[1]}$`, correctOption(step).text);
  }, 5);
  assert.equal(seen.size, 5);
});

test('substitution: antiderivatives with a condition that fixes the constant', () => {
  eachVariant('substitution', 'antiderivative', (step) => {
    const f = texFn(display(step.text).replace(/^f\(x\) = /, ''));
    const at0 = Number(match1(/that has \$F\(0\) = (-?\d+)\$/, step.text, 'the condition')[1]);
    const F = fnOf(step.answer);
    const xs = [-1.1, -0.5, 0.4, 0.9, 1.2];
    assertSameFn(D(F), f, 'the derivative of the answer is the integrand', xs, 1e-6);
    near(F(0), at0, 'the condition at 0');
    for (const b of [0.6, 1.1]) near(integrate(f, 0, b), F(b) - F(0), `the area from 0 to ${b}`, 1e-7);      // the fundamental theorem, numerically
    for (const [wrong, message] of step.wrong) {
      const W = fnOf(String(wrong));
      assert.ok(!equivalent(String(wrong), step.answer, ['x']));
      if (/check the condition/.test(message)) { assertSameFn(D(W), f, 'this slip has the right derivative', xs, 1e-6); assert.ok(!close(W(0), at0), 'but the wrong value at 0'); assert.ok(message.includes(`must be $${at0}$`)); }
      else { assert.match(message, /factors separately/); assert.ok(!sameFn(D(W), f, xs), 'integrating the factors separately gives the wrong derivative'); }
    }
    // the substitution described in the hints and the explanation
    const u = texFn(match1(/\$u = (.+?)\$/, step.hints[0], 'u')[1]);
    assertSameFn(texFn(match1(/Its derivative, \$(.+?)\$,/, step.hints[0], 'du/dx')[1]), D(u), 'the derivative of the inside', xs);
    const inU = match1(/\\int (.+?)\\,du = (.+?) \+ C/, step.hints[1], 'the integral in u');
    assertSameFn(D(texFn(inU[2], 'u')), texFn(inU[1], 'u'), 'the antiderivative in u', [0.3, 0.8, 1.5, 2.2]);
    assertSameFn((x) => texFn(inU[1], 'u')(u(x)) * D(u)(x), f, 'f(u)·u\' is the integrand', xs);
    assertSameFn((x) => texFn(inU[2], 'u')(u(x)), F, 'putting the inside back gives the answer', xs);
    const final = match1(/\\;F\(x\) = (.+?)\$/, step.explain, 'the final answer');
    assertSameFn(texFn(final[1]), F, 'the answer in the explanation', xs);
    assert.ok(step.text.includes('no $+\\,C$'), 'the question says not to add a constant');
  }, 12);
});

test('substitution: supplying a missing constant', () => {
  eachVariant('substitution', 'factor', (step) => {
    const m = match1(/\\int (.+?)\\,dx \\;=\\; (.+?) \\;\\div\$/, step.template, 'the integrand and the top of the answer');
    const f = texFn(m[1]);
    const top = texFn(m[2]);
    const den = blankNumber(step, 0);
    const xs = [-1.1, -0.5, 0.4, 0.9, 1.2];
    assertSameFn(D((x) => top(x) / den), f, 'the derivative of the answer is the integrand', xs, 1e-6);
    near(integrate(f, 0.2, 1.1), (top(1.1) - top(0.2)) / den, 'the area from 0.2 to 1.1', 1e-7);
    // the bookkeeping in the question
    const u = texFn(match1(/Here \$u = (.+?)\$ has \$du = (.+?)\\,dx\$/, step.text, 'u')[1]);
    const du = texFn(/Here \$u = (.+?)\$ has \$du = (.+?)\\,dx\$/.exec(step.text)[2]);
    assertSameFn(du, D(u), 'du/dx', xs);
    const offer = match1(/only offers \$(.*?)dx\$, which is \$(.+?)\\,du\$/, step.text, 'what the integrand offers');
    const have = offer[1] ? texFn(offer[1].replace(/\\,$/, '')) : () => 1;
    const part = fnOf(tex2expr(offer[2]))(0);
    for (const x of xs) near(have(x), part * du(x), 'the part of du that is there');
    // the hint, and the working in the explanation
    const inU = texFn(match1(/\\int (.+?)\\,du/, step.hints[0], 'the integral in u')[1], 'u');
    assertSameFn((x) => inU(u(x)) * D(u)(x), f, 'the integrand in u', xs);
    const check = sides(match1(/Check by differentiating: \$\\;(.+?)\$\./, step.explain, 'the check')[1]);
    for (const piece of check) assertSameFn(texFn(piece), f, `the check "${piece}"`, xs);
    const mid = match1(/du = (.+?) \+ C = \\dfrac\{(.+)\}\{(\d+)\} \+ C/, step.explain, 'the working');
    assertSameFn((x) => texFn(mid[1], 'u')(u(x)), (x) => top(x) / den, 'the antiderivative in u', xs);
    assert.equal(Number(mid[3]), den);
  }, 20);
});

test('substitution: definite integrals', () => {
  eachVariant('substitution', 'definite', (step) => {
    const m = match1(/^\\int_\{(-?\d+)\}\^\{(-?\d+)\} (.+?)\\,dx$/, display(step.text), 'the integral');
    const [a, b] = [Number(m[1]), Number(m[2])];
    const f = texFn(m[3]);
    near(step.answer, integrate(f, a, b), 'the integral, by Simpson\'s rule', 1e-8);
    assert.ok(Number.isInteger(step.answer * 4), 'a tidy answer');
    const u = texFn(match1(/substitution \$u = (.+?)\$/, step.text, 'the substitution')[1]);
    const [lo, hi] = [u(a), u(b)];
    const told = match1(/\$u\$ runs from (-?\d+) to (-?\d+)\./, step.wrong[0][1], 'the new limits');
    assert.deepEqual([Number(told[1]), Number(told[2])], [lo, hi]);
    // the integrand in u, taken from the hint, between the new limits gives the same number
    const inU = texFn(match1(/\\int (.+?)\\,du/, step.hints[0], 'the integral in u')[1], 'u');
    near(integrate(inU, lo, hi), step.answer, 'the integral in u between the new limits', 1e-8);
    near(step.wrong[0][0], integrate(inU, a, b), 'slip 1 keeps the old limits', 1e-8);
    near(step.wrong[1][0], integrate(inU, 0, hi), 'slip 2 is the value at the upper limit only', 1e-8);
    for (const [value] of step.wrong) assert.ok(!accepts(step, value));
    const shown = match1(/\\int_\{(-?\d+)\}\^\{(-?\d+)\} .+? = (-?[\d.]+)$/, display(step.explain), 'the worked answer');
    assert.deepEqual(shown.slice(1, 4).map(Number), [lo, hi, step.answer]);
    const parts = sides(display(step.explain));
    near(fnOf(tex2expr(parts[1]))(0), step.answer, 'the subtraction in the explanation');
  }, 15);
});

test('substitution: a power of sine next to a cosine', () => {
  eachVariant('substitution', 'trig-definite', (step) => {
    const f = texFn(match1(/^\\int_0\^\{\\pi\/2\} (.+?)\\,dx$/, display(step.text), 'the integrand')[1]);
    const exact = integrate(f, 0, Math.PI / 2);
    assert.ok(accepts(step, exact), `Simpson's rule gives ${exact}, the key is ${step.answer}`);
    near(step.answer, exact, 'the key is the exact value', 1e-8);
    for (const [value] of step.wrong) assert.ok(Math.abs(value - step.answer) > 2 * step.tolerance, `the slip ${value} is clear of the answer`);
    const inU = texFn(match1(/\\int_0\^1 (.+?)\\,du/, step.hints[1], 'the integral in u')[1], 'u');
    near(integrate(inU, 0, 1), exact, 'the integral in u from 0 to 1', 1e-8);
    near(step.wrong[0][0], integrate(inU, 0, Math.PI / 2), 'slip 1 keeps the limits for x', 1e-8);
    near(fnOf(tex2expr(afterEquals(display(step.explain))))(0), exact, 'the fraction in the explanation', 1e-8);
    // "an exact fraction or a decimal": the decimal may be rounded to two places (0.33 for 1/3, 0.13 for 1/8) or to three
    for (const places of [2, 3]) assert.ok(accepts(step, round(exact, places)), `${round(exact, places)} is accepted for ${exact}`);
    assert.ok(!accepts(step, exact + 0.02) && !accepts(step, exact - 0.02), 'but not an answer that is 0.02 out');
  }, 6);
});

test('substitution: fixed facts', () => {
  const xs = [-1.1, -0.5, 0.4, 0.9, 1.2];
  // forwards, then backwards
  const forward = fixed('substitution', 'forward');
  const y = texFn(match1(/\$\\;y = (.+?)\$/, forward.text, 'the function')[1]);
  assertSameFn(fnOf(forward.answer), D(y), 'the derivative of (x² + 1)⁴', xs);
  for (const [wrong] of forward.wrong) assert.ok(!sameFn(fnOf(wrong), D(y), xs));
  const reverse = fixed('substitution', 'reverse');
  const target = texFn(match1(/has derivative \$(.+?)\$,\*\*/, reverse.text, 'the target')[1]);
  for (const o of reverse.options) assert.equal(sameFn(D(texFn(inline(o.text)[0])), target, xs), !!o.correct, o.text);
  assertSameFn((x) => 4 * target(x), D(y), 'a quarter as much');
  // the one-liner of the opening question is the integral that has just been done
  const hook = fixed('substitution', 'hook');
  assertSameFn(texFn(match1(/\\int (.+?)\\,dx/, correctOption(hook).text, 'the easy integrand')[1]), target, 'the easy integral');

  // the worked example in the info step
  const pattern = fixed('substitution', 'pattern').text;
  const worked = match1(/\\int (.+?)\\,dx \\qquad u = (.+?), \\quad du = (.+?)\\,dx/, pattern, 'the worked example');
  const u = texFn(worked[2]);
  assertSameFn(texFn(worked[3]), D(u), 'du in the example', xs);
  const result = match1(/= \\tfrac14 u\^4 \+ C = (.+?) \+ C/, pattern, 'its result');
  assertSameFn(D(texFn(result[1])), texFn(worked[1]), 'the example checks by differentiating', xs);

  // one substitution from start to finish
  const sub = fixed('substitution', 'do-sub');
  const integrand = texFn(match1(/\\int (.+?)\\,dx/, sub.text, 'the integrand')[1]);
  const names = { 'x²': (x) => x * x, '2x': (x) => 2 * x, 'cos x': Math.cos, 'sin u': Math.sin, '−sin u': (v) => -Math.sin(v), 'cos u': Math.cos, 'sin(2x)': (x) => Math.sin(2 * x), 'sin(x²)': (x) => Math.sin(x * x), 'cos(x²)': (x) => Math.cos(x * x) };
  const inside = names[blankChoice(sub, 0)];
  assert.equal(blankChoice(sub, 1), '2x dx');
  assertSameFn((x) => 2 * x, D(inside), 'du = 2x dx');
  for (const name of sub.blanks[2].options) assert.equal(sameFn(D(names[name]), Math.cos), name === blankChoice(sub, 2), `∫cos u du = ${name}`);
  for (const name of sub.blanks[3].options) assert.equal(sameFn(D(names[name]), integrand, xs), name === blankChoice(sub, 3), `the answer ${name}`);
  assertSameFn((x) => Math.cos(x * x) * blankNumber(sub, 4) * x, integrand, 'the check line');

  // limits change too: the two shaded regions always have the same area
  const limits = fixed('substitution', 'limits');
  const fig = limits.figures[0];
  const [blue, orange] = fig.fns.map((f) => fnOf(f.expr));
  const uOf = (x) => x * x + 1;
  for (const b of sliderValues(fig.params.b)) {
    const scope = (expr) => compile(String(expr), { vars: ['b'] })({ b });
    const left = integrate(blue, scope(fig.areas[0].from), scope(fig.areas[0].to));
    const right = integrate(orange, scope(fig.areas[1].from), scope(fig.areas[1].to));
    near(left, right, `the two areas for b = ${b}`, 1e-8);
    near(scope(fig.areas[1].to), uOf(b)); near(scope(fig.areas[1].from), uOf(0));
  }
  assert.deepEqual([blankNumber(limits, 0), blankNumber(limits, 1)], [uOf(0), uOf(1)]);
  near(blankNumber(limits, 2), integrate(blue, 0, 1), 'the definite integral', 1e-8);
  near(blankNumber(limits, 2), integrate((v) => v ** 3, 1, 2), 'the same integral in u', 1e-8);
  assertSameFn(blue, (x) => 2 * x * (x * x + 1) ** 3, 'the blue curve', [0.2, 0.5, 0.9]);
  assert.ok(fig.fns[0].to <= 1 && fig.fns[1].from >= 1, 'the two regions do not overlap');

  // the slip with the old limits
  const slip = fixed('substitution', 'old-limits');
  near(integrate((v) => v ** 3, 0, 1), 0.25, 'what the student computed');
  near(integrate(blue, 0, 1), 3.75, 'the true value quoted');
  assert.match(correctOption(slip).text, /runs from 1 to 2/);
  near(((1 + 1) ** 4 - 1) / 4, 3.75, 'the second route in the explanation');

  // does substitution fit? The inside is found from the formula; the rest is compared with its derivative.
  const fit = fixed('substitution', 'ready-or-not');
  const insideOf = (tex) => {
    let m = /e\^\{(.+?)\}/.exec(tex);
    if (m) return { u: m[1], outer: Math.exp };
    m = /\((x\^3 \+ 1)\)\^5/.exec(tex);
    if (m) return { u: m[1], outer: (v) => v ** 5 };
    m = /\\cos\((.+?)\)/.exec(tex);
    assert.ok(m, `"${tex}" has an inside function`);
    return { u: m[1], outer: Math.cos };
  };
  for (const item of fit.items) {
    const tex = match1(/\\int (.+?)\\,dx/, item.text, 'an integrand')[1];
    const f = texFn(tex);
    const { u: uTex, outer } = insideOf(tex);
    const uu = texFn(uTex);
    const ratio = [0.4, 0.8, 1.3].map((x) => f(x) / outer(uu(x)) / D(uu)(x));      // (the other factor) ÷ u'
    const constant = ratio.every((v) => close(v, ratio[0], 1e-6));
    assert.equal(item.bucket, !constant ? 2 : close(ratio[0], 1) ? 0 : 1, `${item.text}: other factor ÷ u' = ${ratio.map((v) => round(v, 3))}`);
    const half = /\\tfrac(\d)(\d)/.exec(item.why || '');
    if (item.bucket === 1 && half && /answer is/.test(item.why)) near(Number(half[1]) / Number(half[2]), ratio[0], `the constant quoted for ${item.text}`);
  }
  assert.deepEqual([0, 1, 2].map((bkt) => fit.items.filter((it) => it.bucket === bkt).length), [2, 3, 2]);
  assertSameFn(D((x) => 0.5 * Math.exp(x * x)), (x) => x * Math.exp(x * x), 'the answer quoted for x·e^(x²)', xs);
  assertSameFn(D((x) => Math.sin(5 * x) / 5), (x) => Math.cos(5 * x), 'the answer quoted for cos 5x', xs);
});

test('substitution: tuning the guess accepts exactly the antiderivative', () => {
  const tune = fixed('substitution', 'tune');
  const spec = tune.widget;
  const integrand = fnOf(spec.fns[1].expr);
  assert.equal(spec.fns[2].expr, 'd0(x)', 'the orange curve is the slope of the guess');
  assertSameFn(integrand, texFn(match1(/\\int (.+?)\\,dx/, tune.text, 'the integrand')[1]), 'the dashed curve is the integrand in the question');
  let passes = 0;
  for (const n of sliderValues(spec.params.n)) {
    const guess = (x) => compile(spec.fns[0].expr, { vars: ['x', 'n'] })({ x, n });
    const isAntiderivative = sameFn(D(guess), integrand, [-1, -0.4, 0.3, 0.8, 1.1]);
    const said = tune.check({ n });
    assert.equal(said === true, isAntiderivative, `n = ${n}`);
    if (said === true) { passes++; continue; }
    const quoted = match1(/slope of your guess at x = 1 is ([\d.]+), but the integrand there is ([\d.]+)/, said, 'its numbers');
    near(Number(quoted[1]), round(D(guess)(1), 2), 'the slope of the guess at 1');
    near(Number(quoted[2]), integrand(1), 'the integrand at 1');
    assert.equal(/too steep/.test(said), D(guess)(1) > integrand(1), said);
    assert.equal(/too flat/.test(said), D(guess)(1) < integrand(1), said);
  }
  assert.equal(passes, 1);
  assert.equal(tune.check(tune.solution), true);
  assert.notEqual(tune.check({ n: spec.params.n.value }), true, 'not solved at the start');
});

/* ======================================= lesson 5: differential equations */

/** Does y(t) satisfy dy/dt = F(t, y) at a handful of times? */
const solves = (y, F, ts = [0, 0.3, 0.8, 1.5]) => ts.every((t) => close(D(y)(t), F(t, y(t)), 1e-6));
/** The solution of dy/dt = F(t, y) from (t0, y0), by a very fine midpoint method (independent of the widget's code). */
function solveTo(F, t0, y0, t1, n = 20000) {
  const h = (t1 - t0) / n;
  let y = y0;
  for (let i = 0; i < n; i++) { const t = t0 + i * h; const mid = y + (h / 2) * F(t, y); y += h * F(t + h / 2, mid); }
  return y;
}
const ruleOf = (expr) => { const f = compile(expr, { vars: ['t', 'y'] }); return (t, y) => f({ t, y }); };

test('differential equations: picking the solution of dy/dt = ky with the right start', () => {
  eachVariant('differential-equations', 'which-solution', (step) => {
    const m = match1(/^\\frac\{dy\}\{dt\} = (.+?) \\qquad y\(0\) = (\d+)$/, display(step.text), 'the equation and the starting value');
    const rhs = compile(tex2expr(m[1]), { vars: ['y'] });
    const F = (t, y) => rhs({ y });
    const start = Number(m[2]);
    for (const o of step.options) {
      const y = texFn(match1(/^\$y = (.+)\$$/, o.text, 'a function')[1], 't');
      const ok = solves(y, F) && close(y(0), start);
      assert.equal(ok, !!o.correct, `${o.text}: ${solves(y, F) ? 'solves' : 'does not solve'} the equation, y(0) = ${y(0)}`);
      if (o.correct) continue;
      if (/It does start at/.test(o.why)) { near(y(0), start, `"${o.text}" does start at ${start}`); assert.ok(!solves(y, F)); }
      else { const told = Number(match1(/starts at \$y\(0\) = (-?[\d.]+)\$/, o.why, 'its starting value')[1]); near(y(0), told); assert.notEqual(told, start); }
      if (/straight line/.test(o.why)) near(D(y)(0.2), D(y)(1.7), 'a straight line');
    }
    const k = F(0, 1);
    near(Number(match1(/has derivative \$(-?[\d.]+)e/, step.explain, 'the derivative')[1]), k * start, 'the derivative quoted in the explanation');
    assert.ok(!/-1e|[^.\d]1e\^|\+ -|-1y|[^.\d]1y/.test(step.text + step.options.map((o) => o.text + (o.why || '')).join(' ') + step.explain), 'tidy coefficients');
  }, 20);
});

test('differential equations: two Euler steps by hand', () => {
  eachVariant('differential-equations', 'euler-hand', (step) => {
    const rhs = compile(tex2expr(display(step.text).replace(/^\\frac\{dy\}\{dt\} = /, '')), { vars: ['t', 'y'] });
    const m = match1(/Start at \$t = 0\$, \$y = (-?[\d.]+)\$, and use steps of \$h = ([\d.]+)\$/, step.text, 'the start and the step');
    const h = Number(m[2]);
    let t = 0;
    let y = Number(m[1]);
    const walk = [];
    for (let i = 0; i < 2; i++) { const slope = rhs({ t, y }); y += h * slope; t += h; walk.push(slope, y); }
    [0, 1, 2, 3].forEach((i) => near(blankNumber(step, i), walk[i], `blank ${i + 1}`, 1e-9));
    assert.ok(step.template.includes(`$t = ${h}$`) && step.template.includes(`$t = ${round(2 * h)}$`), 'the times in the template');
    for (const v of walk) assert.ok(Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-6, 'short decimals');
    // the working in the explanation: "a + h × m = b", twice
    const lines = Array.from(step.explain.matchAll(/\$(-?[\d.]+) \+ ([\d.]+) \\times \(?(-?[\d.]+)\)? = (-?[\d.]+)\$/g), (mm) => mm.slice(1, 5).map(Number));
    assert.equal(lines.length, 2);
    for (const [a, hh, slope, b] of lines) { near(a + hh * slope, b, 'a line of the working', 1e-9); assert.equal(hh, h); }
    near(lines[1][3], walk[3]);
  }, 25);
});

test('differential equations: the rate of cooling right now', () => {
  let warming = 0;
  eachVariant('differential-equations', 'cooling-rate', (step) => {
    const T = Number(match1(/at \*\*(-?\d+) °C\*\* stands in a room at \*\*(\d+) °C\*\*/, step.text, 'the two temperatures')[1]);
    const room = Number(/room at \*\*(\d+) °C\*\*/.exec(step.text)[1]);
    const rhs = compile(tex2expr(display(step.text).replace(/^\\frac\{dT\}\{dt\} = /, '')), { vars: ['T'] });
    const F = (t, temp) => rhs({ T: temp });
    near(step.answer, F(0, T), 'the right-hand side at this temperature', 1e-9);
    // follow the temperature for a hundredth of a minute and measure its rate
    const dt = 0.01;
    near((solveTo(F, 0, T, dt, 200) - T) / dt, step.answer, 'the measured rate', 2e-3);
    near(F(0, room), 0, 'no change at room temperature');
    assert.equal(step.answer < 0, T > room, 'falling when warmer than the room, rising when colder');
    if (T < room) warming++;
    assert.match(step.unit, /per minute/);
    assert.equal(step.wrong.length, 3);
    for (const [value, message] of step.wrong) {
      assert.ok(!accepts(step, value), `${value} is not accepted`);
      if (/size is right/.test(message)) { near(value, -step.answer); assert.equal(/warmer than the room/.test(message), T > room, message); }
      else if (/temperature itself/.test(message)) { const k = -F(0, room + 1); near(value, -k * T, 'the slip that forgets the room', 1e-9); }   // k is the cooling per degree of gap
      else { assert.match(message, /minus the gap/); near(value, -(T - room)); }
    }
    assert.equal(new Set(step.wrong.map((w) => round(w[0], 6))).size, 3, 'three different slips');
    near(Number(afterEquals(inline(step.explain)[0])), step.answer, 'the explanation ends at the answer', 1e-9);
    assert.equal(/it warms up/.test(step.explain), T < room, 'the last sentence fits the case');
  }, 30);
  assert.ok(warming > 30, 'cold drinks occur as well');
});

test('differential equations: fixed facts', () => {
  // the coffee: the opening numbers follow from the cooling equation used later
  const cooling = fixed('differential-equations', 'cooling');
  const cool = ruleOf(cooling.figures[0].rule);
  const coffee = (minutes) => solveTo(cool, 0, 90, minutes);
  near(coffee(14), 55, 'after 14 minutes: about 55 °C', 0.01);
  near(coffee(28), 37, 'after 28 minutes: about 37 °C', 0.02);
  assert.equal(correctOption(fixed('differential-equations', 'hook')).text, 'About 37 °C');
  assertSameFn((t) => 20 + 70 * Math.exp(-0.05 * t), coffee, 'the solution quoted for the coffee', [0, 7, 20, 45], 1e-6);
  assert.ok(solves((t) => 20 + 70 * Math.exp(-0.05 * t), cool, [0, 5, 20, 40]));
  near(cool(0, 20), 0, 'room temperature is an equilibrium');
  assert.ok(cool(0, 5) > 0 && cool(0, 90) < 0, 'cold drinks warm up, hot ones cool');
  for (const start of [5, 40, 90]) near(solveTo(cool, 0, start, 400), 20, `from ${start} °C the temperature closes in on 20`, 1e-4);
  for (const start of [5, 90]) assert.equal(Math.sign(solveTo(cool, 0, start, 60) - 20), Math.sign(start - 20), 'and does not cross it');
  assert.match(correctOption(cooling).text, /close in on 20 °C/);
  assert.equal(fixed('differential-equations', 'cooling').figures[0].hlines[0].y, 20);

  // a rule for the slope
  const dash = fixed('differential-equations', 'dash');
  const half = (t, y) => 0.5 * y;
  assert.deepEqual([0, 1, 2].map((i) => blankNumber(dash, i)), [half(1, 4), half(3, 4), half(3, 6)]);
  assert.equal(blankChoice(dash, 3), 'the height y');
  assertSameFn((y) => ruleOf(fixed('differential-equations', 'field').widget.rule)(1.7, y), (y) => half(0, y), 'the field drawn is the rule in the text');

  // the key fact, and the check by substitution
  for (const [k, C] of [[0.5, 1], [0.5, 3], [-1, 4], [2, 0.5]]) assert.ok(solves((t) => C * Math.exp(k * t), (t, y) => k * y), `C·e^(kt) solves dy/dt = ky for k = ${k}`);
  const verify = fixed('differential-equations', 'verify');
  const y = (t) => 3 * Math.exp(0.5 * t);
  near(blankNumber(verify, 0), D(y)(0), 'the coefficient of the derivative');
  near(blankNumber(verify, 1), 0.5 * y(0));
  assert.equal(blankChoice(verify, 2), 'equal for every t');
  near(blankNumber(verify, 3), y(0));
  assert.ok(solves(y, half));

  // compound interest is Euler's method
  const interest = fixed('differential-equations', 'interest');
  let money = 1;
  for (let i = 0; i < 4; i++) money += 0.25 * money;
  near(blankNumber(interest, 0), 1 + 0.25);
  assert.ok(Math.abs(blankNumber(interest, 1) - money) <= interest.tolerance, `four steps of 0.25 reach ${money}`);
  assert.equal(blankNumber(interest, 2), 1 / 0.125);

  // logistic growth
  const logistic = fixed('differential-equations', 'logistic');
  const pond = ruleOf(logistic.figures[0].rule);
  assertSameFn((P) => pond(0, P), texFn(display(logistic.text).replace(/^\\frac\{dP\}\{dt\} = /, ''), 'P'), 'the field drawn is the equation in the text', [0.5, 3, 8, 12]);
  near(solveTo(pond, 0, 1, 40), 10, 'from 1 the population levels off at 10', 1e-6);
  near(solveTo(pond, 0, 13, 40), 10, 'from 13 it falls back to 10', 1e-6);
  assert.deepEqual([blankChoice(logistic, 0), blankChoice(logistic, 1)], ['levels off at 10', 'falls back to 10']);
  let fastest = 0;
  for (let P = 0; P <= 14; P += 0.001) if (pond(0, P) > pond(0, fastest)) fastest = P;
  near(blankNumber(logistic, 2), fastest, 'the population grows fastest halfway', 1e-3);
  near(pond(0, 0), 0); near(pond(0, 10), 0);
  assert.ok(pond(0, 13) < 0);
  assertSameFn(D((P) => P - (P * P) / 10), (P) => 1 - P / 5, 'the derivative in the hint');

  // each situation and its equation, tested on what the equation says at particular values
  const eqs = Object.fromEntries(fixed('differential-equations', 'match').pairs.map(([story, eq]) => [story, compile(tex2expr(inline(eq)[0].replace(/^\\dfrac\{dy\}\{dt\} = /, '')), { vars: ['y'] })]));
  const rate = (re, y) => { const key = Object.keys(eqs).find((s) => re.test(s)); assert.ok(key, `a situation matching ${re}`); return eqs[key]({ y }); };
  near(rate(/Savings/, 200) / 200, 0.03, 'savings grow by 3% of themselves');
  near(rate(/radioactive/, 200) / 200, -0.03, 'the sample loses 3% of itself');
  near(rate(/tank/, 7), 3); near(rate(/tank/, 700), 3);
  near(rate(/Soup/, 20), 0); assert.ok(rate(/Soup/, 60) < 0);
  near(rate(/Fish/, 300), 0); assert.ok(rate(/Fish/, 100) > 0 && rate(/Fish/, 400) < 0);

  // y'' = −y
  const osc = fixed('differential-equations', 'oscillator');
  for (const o of osc.options) {
    const f = texFn(inline(o.text)[0].replace(/^y = /, ''), 't');
    const second = D(D(f, 1e-2), 1e-2);
    assert.equal([0.2, 0.9, 1.6].every((t) => close(second(t), -f(t), 1e-5)), !!o.correct, o.text);
    if (/\\sin 2t/.test(o.text)) near(second(0.4) / f(0.4), -4, 'sin 2t has y″ = −4y, as its feedback says', 1e-5);
    if (/e\^\{t\}/.test(o.text)) near(second(0.4) / f(0.4), 1, 'e^t has y″ = +y', 1e-5);
  }
  assert.equal(osc.options.filter((o) => o.correct).length, 3);
});

test('differential equations: the slope-field check accepts exactly the start whose solution goes through the ring', () => {
  const field = fixed('differential-equations', 'field');
  const spec = field.widget;
  const ring = spec.target;
  near(ring.y, Math.exp(2), 'the ring is where e^(0.5t) is at t = 4', 1e-3);
  let passes = 0;
  for (const y0 of range(spec.y[0], spec.y[1], spec.snap[1])) {
    const end = y0 * Math.exp(0.5 * ring.t);                         // the exact solution, not the widget's stepping
    near(end, solveTo(ruleOf(spec.rule), 0, y0, ring.t), 'the formula solves the rule', 1e-6);
    const miss = round(end - ring.y);
    const state = { start: { t: 0, y: y0 }, end: round(end), miss, hit: Math.abs(miss) <= ring.tol };
    const said = field.check(state);
    assert.equal(said === true, state.hit, `start ${y0}`);
    if (said === true) { passes++; assert.equal(y0, 1); continue; }
    assert.ok(said.includes(`Starting at ${y0},`), said);
    assert.equal(/Start lower/.test(said), end > ring.y, said);
    assert.equal(/Start higher/.test(said), end < ring.y, said);
  }
  assert.equal(passes, 1);
  const solved = field.solution.start.y * Math.exp(2);
  assert.equal(field.check({ start: { t: 0, y: 1 }, miss: round(solved - ring.y), hit: true }), true);
  assert.notEqual(spec.start.y, 1, 'not solved at the start');
  // the family in the picture that names the idea never crosses itself
  const name = fixed('differential-equations', 'name').figures[0];
  const starts = [...name.family, name.start.y].sort((a, b) => a - b);
  for (const t of [1, 3, 6]) { const heights = starts.map((s) => s * Math.exp(0.5 * t)); assert.deepEqual(heights.slice().sort((a, b) => a - b), heights); }
});

test('differential equations: the Euler walk needs a finished walk with a smaller step', () => {
  const walk = fixed('differential-equations', 'euler-walk');
  const spec = walk.widget;
  const F = ruleOf(spec.rule);
  const finals = {};
  for (const h of spec.euler.sizes) {
    const steps = Math.round((spec.euler.to - spec.start.t) / h);
    near(steps * h, spec.euler.to - spec.start.t, 'a whole number of steps reaches the end');
    let t = spec.start.t;
    let y = spec.start.y;
    for (let n = 0; n <= steps; n++) {
      const done = t >= spec.euler.to - 1e-9;
      const exact = Math.exp(t);
      const said = walk.check({ h, n, t: round(t, 6), y: round(y, 6), exact: round(exact, 6), error: round(y - exact, 6), done });
      assert.equal(said === true, done && h < 0.5, `h = ${h}, ${n} steps`);
      if (said !== true) {
        if (!done) assert.ok(/Keep pressing/.test(said) && said.includes(`t = ${round(t, 3)}`), said);
        else { assert.ok(said.includes(`arrive at ${round(y, 2)}`) && said.includes(`true curve is at ${round(exact, 2)}`), said); assert.equal(h, 0.5); }
      }
      if (done) finals[h] = y;
      y += h * F(t, y);
      t += h;
    }
  }
  // the numbers in the explanation, and the reason smaller steps are better
  near(finals[0.5], 2.25); near(round(finals[0.25], 2), 2.44); near(round(finals[0.125], 2), 2.57);
  assert.ok(Math.E - finals[0.125] < Math.E - finals[0.25] && Math.E - finals[0.25] < Math.E - finals[0.5], 'smaller steps end closer to e');
  for (const h of spec.euler.sizes) near(finals[h], (1 + h) ** Math.round(1 / h), 'Euler for dy/dt = y is compound interest');
  const sol = walk.solution;
  assert.equal(walk.check({ h: sol.h, n: sol.n, t: sol.h * sol.n, y: finals[sol.h], exact: Math.E, done: sol.h * sol.n >= 1 }), true);
  assert.ok(solves(Math.exp, F), 'e^t is the true solution drawn');
});

/* =============================================== lesson 6: Taylor series */

const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
const expSum = (n, x) => { let total = 0; for (let k = 0; k <= n; k++) total += x ** k / fact(k); return total; };
const sinSum = (n, x) => { let total = 0; for (let k = 0; 2 * k + 1 <= n; k++) total += ((-1) ** k * x ** (2 * k + 1)) / fact(2 * k + 1); return total; };

test('Taylor series: estimating e^x with a few terms', () => {
  eachVariant('taylor-series', 'estimate-exp', (step) => {
    const n = Number(match1(/Taylor polynomial of degree (\d) for \$e\^x\$/, step.text, 'the degree')[1]);
    const poly = texFn(display(step.text));
    const target = match1(/estimate \$(e(?:\^\{(-?[\d.]+)\})?)\$/, step.text, 'what to estimate');
    const x = target[2] === undefined ? 1 : Number(target[2]);
    // the polynomial shown really is the Taylor polynomial: right degree, right derivatives at 0
    assertSameFn(poly, (v) => expSum(n, v), 'the polynomial shown', [-1.5, -0.4, 0.7, 2]);
    near(poly(1e-3), Math.exp(1e-3), 'it hugs e^x near 0', 1e-9);
    const value = poly(x);
    assert.ok(accepts(step, value), `the polynomial gives ${value}, the key is ${step.answer}`);
    near(step.answer, round(value, 3), 'the key is the value rounded to 3 places');
    for (const [wrong, message] of step.wrong) {
      assert.ok(Math.abs(wrong - step.answer) > 2 * step.tolerance, `the slip ${wrong} is clear of the answer`);
      if (/true value/.test(message)) near(wrong, round(Math.exp(x), 3));
      else { assert.match(message, /plain powers/); let plain = 0; for (let k = 0; k <= n; k++) plain += x ** k; near(wrong, plain); }
    }
    const terms = match1(/The terms are (.+?)\. Add them up/, step.hints[1], 'the terms')[1].split(', ').map(Number);
    assert.equal(terms.length, n + 1);
    terms.forEach((term, k) => near(term, round(x ** k / fact(k), 4), `term ${k}`));
    // a rounded value is introduced with "≈", never as "= 2.7183…" (the digits of e go on 2.71828…)
    const told = match1(/\\approx ([\d.]+)\$, so the estimate is off by about ([\d.]+)\./, step.explain, 'the true value and the error');
    assert.ok(!/\\ldots/.test(step.explain), 'no "…" after a rounded value');
    near(Number(told[1]), round(Math.exp(x), 4), 'the true value quoted');
    near(Number(told[2]), round(Math.abs(Math.exp(x) - value), 4), 'the error quoted');
    assert.ok(Number(told[2]) > 0, 'the error is never quoted as zero');
    // the sum written out in the explanation is the sum of the terms it lists
    const summed = match1(/the terms are \$(.+?) \\approx (-?[\d.]+)\$/, step.explain, 'the sum in the explanation');
    near(Number(summed[2]), round(value, 3), 'the sum quoted');
    near(summed[1].split(' + ').map((t) => Number(t.replace(/[()]/g, ''))).reduce((a, b) => a + b, 0), value, 'the listed terms add up to it', 2e-4);
  }, 10);
});

test('Taylor series: estimating sin x with two terms', () => {
  eachVariant('taylor-series', 'sin-estimate', (step) => {
    const poly = texFn(match1(/\\sin x \\approx (.+?)\$ \(with/, step.text, 'the approximation')[1]);
    assertSameFn(poly, (v) => sinSum(3, v), 'the approximation is the Taylor polynomial of degree 3', [-0.8, -0.2, 0.4, 1.1]);
    const x = Number(match1(/estimate \$\\sin ([\d.]+)\$/, step.text, 'the angle')[1]);
    const value = poly(x);
    assert.ok(accepts(step, value), `two terms give ${value}, the key is ${step.answer}`);
    near(step.answer, round(value, 4));
    assert.ok(Math.abs(value - Math.sin(x)) < 0.001, 'and that is close to the true sine');
    const slips = [x, x - x ** 3 / 3, x + x ** 3 / 6];
    assert.equal(step.wrong.length, 3);
    step.wrong.forEach(([wrong], i) => {
      near(wrong, round(slips[i], 4), `slip ${i + 1}`);
      assert.ok(Math.abs(wrong - step.answer) > 2 * step.tolerance, `the slip ${wrong} is clear of the answer`);
    });
    near(Number(match1(/\^3 = ([\d.]+)\$/, step.hints[0], 'the cube')[1]), x ** 3, 'the cube in the hint', 1e-9);
    const told = match1(/\\sin [\d.]+ \\approx ([\d.]+)\$\. Two terms, and the error is only about ([\d.]+)\./, step.explain, 'the true value and the error');
    assert.ok(!/\\ldots/.test(step.explain), 'no "…" after a rounded value');
    near(Number(told[1]), round(Math.sin(x), 6), 'the true value quoted');
    // the error quoted is the true error to one significant figure or better, and never "0" (for sin 0.1 it is 0.00000008)
    const trueError = Math.abs(Math.sin(x) - value);
    assert.ok(Number(told[2]) > 0, `the error for sin ${x} is quoted as ${told[2]}`);
    const places = (told[2].split('.')[1] || '').length;
    assert.ok(Math.abs(Number(told[2]) - trueError) <= 0.5 * 10 ** -places + 1e-12, `the error quoted for sin ${x}: ${told[2]} vs ${trueError}`);
    near(trueError, x ** 5 / 120, 'the error is about the next term of the series, x⁵/120', 2e-2 * x ** 5);
    near(Number(match1(/which rounds to ([\d.]+)\./, step.explain, 'the rounded value')[1]), step.answer);
  }, 6);
});

test('Taylor series: fixed facts', () => {
  // a parabola in disguise
  const hook = fixed('taylor-series', 'hook');
  const gap = Math.abs(Math.cos(0.5) - (1 - 0.25 / 2));
  assert.ok(gap < 0.003 && gap > 0.001, `the gap at 0.5 is ${gap}`);
  assert.equal(correctOption(hook).text, 'Less than 0.003');
  assertSameFn(fnOf(hook.figures[0].fns[1].expr), (x) => sinSum(1, 0) + 1 - (x * x) / 2, 'the parabola drawn');

  // factorials, and where they come from
  const facts = fixed('taylor-series', 'factorials');
  assert.deepEqual([0, 1, 2, 3].map((i) => blankNumber(facts, i)), [fact(3), fact(4), fact(4), fact(5)]);
  for (const n of [2, 3, 4, 5]) { let f = (x) => x ** n; for (let i = 0; i < n; i++) f = D(f, 0.05); near(f(0.3), fact(n), `x^${n} differentiated ${n} times`, 1e-3); }

  // the sine series
  const sine = fixed('taylor-series', 'sine-coeffs');
  const derivs = [Math.sin, Math.cos, (x) => -Math.sin(x), (x) => -Math.cos(x)];
  derivs.slice(1).forEach((f, i) => assertSameFn(f, D(derivs[i]), `derivative ${i + 1} of sine`));
  assert.deepEqual([0, 1, 2, 3].map((i) => blankNumber(sine, i)), derivs.map((f) => round(f(0))));
  assert.equal(blankNumber(sine, 4), fact(3));

  // cosine for free
  const cos = fixed('taylor-series', 'cos-series');
  const sinePoly = texFn(match1(/\*\*Differentiate\*\* \$\\;(.+?)\$\./, cos.text, 'the polynomial')[1]);
  assertSameFn(sinePoly, (x) => sinSum(5, x), 'the polynomial is the sine series up to x⁵');
  assertSameFn(fnOf(cos.answer), D(sinePoly), 'its derivative');
  for (const [wrong] of cos.wrong) assert.ok(!sameFn(fnOf(wrong), D(sinePoly)));
  assert.ok(equivalent('1 - 3x^2/6 + 5x^4/120', cos.answer, ['x']), 'an unsimplified answer is accepted');
  for (const x of [0.1, 0.3]) assert.ok(Math.abs(fnOf(cos.answer)(x) - Math.cos(x)) < x ** 6, 'and it is the start of the cosine series');

  // the series quoted in the texts and in the matching step: each starts the function's own Taylor series
  const pairs = fixed('taylor-series', 'match-series').pairs;
  assert.equal(pairs.length, 4);
  for (const [fnTex, seriesTex] of pairs) {
    const f = texFn(inline(fnTex)[0]);
    const start = texFn(inline(seriesTex)[0].replace(/\s*[+-] \\dots$/, ''));
    const degree = Math.max(...Array.from(inline(seriesTex)[0].matchAll(/x\^(\d)/g), (m) => Number(m[1])));
    for (const x of [0.1, 0.05, -0.1]) assert.ok(Math.abs(f(x) - start(x)) < 3 * Math.abs(x) ** (degree + 1), `${seriesTex} is the start of the series of ${fnTex} (at ${x}: ${f(x)} vs ${start(x)})`);
    for (const other of pairs) if (other[0] !== fnTex) assert.ok(Math.abs(texFn(inline(other[0])[0])(0.3) - start(0.3)) > 1e-3, `${seriesTex} does not also fit ${other[0]}`);
  }

  // the warning: 1/(1 − x)
  const geo = fixed('taylor-series', 'geometric');
  const target = (x) => 1 / (1 - x);
  const partial = (n, x) => { let total = 0; for (let k = 0; k <= n; k++) total += x ** k; return total; };
  const closesIn = (x) => Math.abs(partial(3000, x) - target(x)) < 1e-6 && Math.abs(partial(3001, x) - target(x)) < 1e-6;
  const tests = { 'between': (x) => x > -1 && x < 1, 'every \\$x\\$, just': () => true, 'less than 1': (x) => x < 1, 'Only at': (x) => x === 0 };
  for (const o of geo.options) {
    const key = Object.keys(tests).find((k) => new RegExp(k).test(o.text));
    assert.ok(key, `option "${o.text}" is one of the four claims`);
    assert.equal([-1.5, -0.75, 0, 0.5, 0.9, 2].every((x) => closesIn(x) === tests[key](x)), !!o.correct, o.text);
  }
  near(target(2), -1); assert.deepEqual([0, 1, 2, 3].map((n) => partial(n, 2)), [1, 3, 7, 15]);
  assert.deepEqual([0, 1, 2, 3].map((n) => partial(n, -1.5)), [1, -0.5, 1.75, -1.625]);
  assert.deepEqual([0, 1, 2, 3].map((n) => partial(n, 0.5)), [1, 1.5, 1.75, 1.875]);
  near(target(0.5), 2);
  // every Taylor coefficient of 1/(1 − x) is 1: f⁽ⁿ⁾(0) = n!
  let f = target;
  for (let n = 1; n <= 3; n++) { f = D(f, 0.02); near(f(0) / fact(n), 1, `coefficient ${n} of 1/(1 − x)`, 1e-3); }
  const gfig = geo.figures[0];
  for (const n of sliderValues(gfig.params.n)) {
    const drawn = (x) => compile(gfig.fns[1].expr, { vars: ['x', 'n'] })({ x, n });
    assertSameFn(drawn, (x) => partial(n, x), `the polynomial drawn for degree ${n}`, [-1.5, -0.5, 0.5, 2]);
  }

  // true or false
  const truths = fixed('taylor-series', 'truths');
  assert.deepEqual(truths.options.map((o) => !!o.correct), [true, true, true, false, false]);
  assert.ok(Math.abs(partial(8, 2) - target(2)) > Math.abs(partial(3, 2) - target(2)), 'at x = 2 more terms make 1/(1 − x) worse');
  for (const n of [4, 8, 12]) assert.ok(Math.abs(expSum(n, 2) - Math.exp(2)) > 0, 'a Taylor polynomial of e^x is never exactly e^x');
});

test('Taylor series: the interactive checks, and the polynomials the plots draw', () => {
  // value and slope
  const tangent = fixed('taylor-series', 'tangent');
  const curve = fnOf(tangent.widget.fns[0].expr);
  assertSameFn(curve, Math.exp, 'the curve is e^x');
  let passes = 0;
  for (const a0 of sliderValues(tangent.widget.params.a0)) for (const a1 of sliderValues(tangent.widget.params.a1)) {
    const line = (x) => compile(tangent.widget.fns[1].expr, { vars: ['x', 'a0', 'a1'] })({ x, a0, a1 });
    const matches = close(line(0), curve(0)) && close(D(line)(0), D(curve)(0));
    const said = tangent.check({ a0, a1 });
    assert.equal(said === true, matches, `a0 = ${a0}, a1 = ${a1}`);
    if (said === true) { passes++; continue; }
    if (/Fix the height first/.test(said)) assert.ok(!close(line(0), 1) && said.includes(`(0, ${a0})`), said);
    else { assert.ok(close(line(0), 1) && said.includes(`slope ${a1},`), said); assert.equal(/curve is steeper/.test(said), D(line)(0) < 1, said); assert.equal(/curve is less steep/.test(said), D(line)(0) > 1, said); }
  }
  assert.equal(passes, 1);
  assert.equal(tangent.check(tangent.solution), true);
  assert.notEqual(tangent.check({ a0: tangent.widget.params.a0.value, a1: tangent.widget.params.a1.value }), true);

  // the bend
  const bend = fixed('taylor-series', 'bend');
  passes = 0;
  for (const a2 of sliderValues(bend.widget.params.a2)) {
    const poly = (x) => compile(bend.widget.fns[1].expr, { vars: ['x', 'a2'] })({ x, a2 });
    const second = D(D(poly, 1e-2), 1e-2)(0);
    near(second, 2 * a2, 'the second derivative of the polynomial is 2·a2', 1e-6);
    near(compile(bend.widget.readouts[1].expr, { vars: ['a2'] })({ a2 }), second, 'the readout', 1e-6);
    near(poly(0), 1); near(D(poly)(0), 1);                               // value and slope are untouched
    const matches = close(second, D(D(Math.exp, 1e-2), 1e-2)(0), 1e-5);
    const said = bend.check({ a2 });
    assert.equal(said === true, matches, `a2 = ${a2}`);
    if (said === true) { passes++; continue; }
    assert.ok(said.includes(`polynomial is ${round(2 * a2, 1)},`), said);
    assert.equal(/does not bend enough/.test(said), second < 1, said);
    assert.equal(/bends too much/.test(said), second > 1, said);
  }
  assert.equal(passes, 1);
  assert.equal(bend.check(bend.solution), true);

  // one term at a time: the lowest degree within 0.01 of e² at x = 2
  const degree = fixed('taylor-series', 'degree');
  const drawnExp = (n) => (x) => compile(degree.widget.fns[1].expr, { vars: ['x', 'n'] })({ x, n });
  const degrees = sliderValues(degree.widget.params.n);
  for (const n of degrees) assertSameFn(drawnExp(n), (x) => expSum(n, x), `the plot's polynomial of degree ${n}`, [-2.5, -1, 0.5, 2, 3]);
  const lowest = degrees.find((n) => Math.abs(Math.exp(2) - expSum(n, 2)) < 0.01);
  for (const n of degrees) {
    const gap = Math.exp(2) - expSum(n, 2);
    const said = degree.check({ n });
    assert.equal(said === true, n === lowest, `degree ${n}`);
    if (said === true) continue;
    assert.ok(said.includes(`${round(gap, 4)}`), `the gap quoted for degree ${n}: ${said}`);
    assert.equal(/Add more terms/.test(said), Math.abs(gap) >= 0.01, said);
    assert.equal(/within 0\.01/.test(said), Math.abs(gap) < 0.01, said);
  }
  assert.equal(lowest, 7);
  assert.equal(degree.check(degree.solution), true);
  const quoted = match1(/\\;(.+?) \\approx ([\d.]+)\$, against \$e\^2 \\approx ([\d.]+)\$/, degree.explain, 'the sum in the explanation');
  const terms = quoted[1].split(' + ').map(Number);
  assert.equal(terms.length, 8);
  terms.forEach((term, k) => near(term, round(2 ** k / fact(k), 3), `term ${k} of the sum`));
  near(Number(quoted[2]), round(expSum(7, 2), 3)); near(Number(quoted[3]), round(Math.exp(2), 3));

  // how far does it reach: the lowest odd degree within 0.1 of sin x on [0, π]
  const reach = fixed('taylor-series', 'reach');
  const drawnSin = (n) => (x) => compile(reach.widget.fns[1].expr, { vars: ['x', 'n'] })({ x, n });
  const odd = sliderValues(reach.widget.params.n);
  assert.deepEqual(odd, [1, 3, 5, 7, 9, 11, 13]);
  const worst = (n) => { let w = 0; for (let x = 0; x <= Math.PI + 1e-12; x += Math.PI / 2000) w = Math.max(w, Math.abs(Math.sin(x) - sinSum(n, x))); return w; };
  for (const n of odd) assertSameFn(drawnSin(n), (x) => sinSum(n, x), `the plot's polynomial of degree ${n}`, [-6, -3, -1, 0.5, 2, 3.1, 5]);
  const first = odd.find((n) => worst(n) < 0.1);
  for (const n of odd) {
    const said = reach.check({ n });
    assert.equal(said === true, n === first, `degree ${n}`);
    near(reach.widget.readouts[0].value({ n }), worst(n), 'the readout', 1e-4);
    if (said === true) continue;
    assert.equal(/needs more terms/.test(said), worst(n) >= 0.1, said);
    assert.equal(/stays within 0\.1 as well/.test(said), worst(n) < 0.1, said);
    const gapQuoted = Number(match1(n < first ? /strays ([\d.]+) from/ : /largest gap is ([\d.]+)\. But/, said, 'the gap')[1]);
    assert.equal(gapQuoted, round(worst(n), n < first ? 2 : 5), `the gap quoted for degree ${n}: ${said}`);
    assert.ok(gapQuoted > 0, `no polynomial is the sine curve: the gap for degree ${n} is never quoted as 0`);
    assert.ok(round(reach.widget.readouts[0].value({ n }), reach.widget.readouts[0].digits) > 0, `and the readout never shows 0 (degree ${n})`);
  }
  assert.equal(first, 7);
  assert.equal(reach.check(reach.solution), true);
  for (const n of odd) assert.ok(Math.abs(sinSum(n, 1e4)) > 1e3, 'every one of these polynomials shoots off in the end');
});

/* ============================================ what the learner may type */

/**
 * The verdict the player gives a typed expression, in the order src/player/types/expr.js uses:
 * unreadable (sent back, no attempt used) · right · the feedback of a listed slip · plain wrong.
 */
function verdict(step, typed) {
  try { parse(typed, { vars: step.vars }); } catch { return 'unreadable'; }
  if (equivalent(typed, step.answer, step.vars)) return 'right';
  const hit = step.wrong.find(([w]) => equivalent(typed, String(w), step.vars));
  return hit ? hit[1] : 'wrong';
}
/** The variant of a generated step whose question shows this formula (or the step itself, when it is not generated). */
function showing(lessonId, stepId, shown) {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  for (let seed = 1; seed <= 5000; seed++) {
    const step = resolveStep(raw, makeRng(seed), stepId);
    if (displays(step.text).includes(shown) || step.text.includes(shown)) return step;
    if (typeof raw.gen !== 'function') break;
  }
  return assert.fail(`${lessonId}/${stepId} never shows ${shown}`);
}

test('typed answers: a correct answer is accepted however it is written', () => {
  const cases = [
    ['chain-rule', 'power-chain', 'y = (x^2 + 1)^{3}', (x) => (x * x + 1) ** 3, ['6x(x^2+1)^2', '6*x*(x^2+1)^2', '6x^5 + 12x^3 + 6x', '3(x^2+1)^2*2x', '(x^2 + 1)^2 * 6x', '6x(x²+1)²', '6x(1 + x^2)^2', '6x[x^2+1]^2', '6x(x^2+1)**2']],
    ['chain-rule', 'power-chain', 'y = (4 - x)^{3}', (x) => (4 - x) ** 3, ['-3(4-x)^2', '-3(x-4)^2', '-3x^2 + 24x - 48', '3(4-x)^2*(-1)', '−3(4 − x)^2']],
    ['chain-rule', 'exp-chain', 'y = e^{2x}', (x) => Math.exp(2 * x), ['2e^(2x)', 'e^(2x)*2', '2*e^(2*x)', '2exp(2x)', '2e^{2x}', '2(e^x)^2', '2 e^(2x)']],
    ['chain-rule', 'exp-chain', 'y = e^{-x}', (x) => Math.exp(-x), ['-e^(-x)', '-e^-x', '-1/e^x', '−e^(−x)', '-exp(-x)']],
    ['chain-rule', 'exp-chain', 'y = e^{x^2}', (x) => Math.exp(x * x), ['2xe^(x^2)', '2x*e^(x^2)', '2xe^x^2', 'e^(x^2)*2x', '2x exp(x^2)']],
    ['chain-rule', 'exp-chain', 'y = e^{3x + 2}', (x) => Math.exp(3 * x + 2), ['3e^(3x+2)', '3e^(2+3x)', '3e^2*e^(3x)', '3*e^(3*x + 2)']],
    ['product-rule', 'product-expr', 'y = x^{2}\\,e^x', (x) => x * x * Math.exp(x), ['2xe^x + x^2e^x', '(2x + x^2)e^x', 'xe^x(x + 2)', 'x^2e^x + 2xe^x', '2x*e^x + x^2*e^x', 'e^x(x^2+2x)']],
    ['product-rule', 'product-expr', 'y = x\\,e^x', (x) => x * Math.exp(x), ['e^x + xe^x', '(1+x)e^x', 'e^x(x+1)', 'xe^x+e^x', '1*e^x + x*e^x']],
    ['product-rule', 'both-rules', 'y = x\\,e^{2x}', (x) => x * Math.exp(2 * x), ['e^(2x) + 2xe^(2x)', '(1+2x)e^(2x)', 'e^(2x)(2x+1)', '2xe^(2x)+e^(2x)']],
    ['product-rule', 'both-rules', 'y = x\\,e^{-x}', (x) => x * Math.exp(-x), ['e^(-x) - xe^(-x)', '(1-x)e^(-x)', 'e^-x - xe^-x', '(1-x)/e^x']],
    ['trig-derivatives', 'chain', 'y = \\sin(2x)', (x) => Math.sin(2 * x), ['2cos(2x)', '2*cos(2*x)', 'cos(2x)*2', '2 cos(2x)', '2cos[2x]']],
    ['trig-derivatives', 'chain', 'y = \\cos(x^2)', (x) => Math.cos(x * x), ['-2xsin(x^2)', '-2x*sin(x^2)', '-sin(x^2)*2x', '−2x sin(x²)']],
    ['trig-derivatives', 'product', 'y = x^2\\,\\sin x', (x) => x * x * Math.sin(x), ['2xsin(x) + x^2cos(x)', 'x(2sin(x) + xcos(x))', 'x^2cos(x)+2xsin(x)', '2x*sin(x) + x^2*cos(x)']],
    ['trig-derivatives', 'product', 'y = e^x\\,\\cos x', (x) => Math.exp(x) * Math.cos(x), ['e^xcos(x) - e^xsin(x)', 'e^x(cos(x) - sin(x))', '(cos(x)-sin(x))e^x', 'e^x*cos(x) - e^x*sin(x)']],
    ['substitution', 'forward', 'y = (x^2 + 1)^4', (x) => (x * x + 1) ** 4, ['8x(x^2+1)^3', '8x^7 + 24x^5 + 24x^3 + 8x', '4(x^2+1)^3*2x', '8*x*(x^2 + 1)^3']],
    ['taylor-series', 'cos-series', 'x - \\dfrac{x^3}{6} + \\dfrac{x^5}{120}', (x) => x - x ** 3 / 6 + x ** 5 / 120, ['1 - x^2/2 + x^4/24', 'x^4/24 - x^2/2 + 1', '1 - 3x^2/6 + 5x^4/120', '1 - 0.5x^2 + x^4/24', '1 - x^2/2! + x^4/4!', '1-(1/2)x^2+(1/24)x^4']],
  ];
  for (const [lessonId, stepId, shown, f, forms] of cases) {
    const step = showing(lessonId, stepId, shown);
    for (const typed of forms) {
      assertSameFn(fnOf(typed), D(f), `"${typed}" is the derivative of ${shown}`, [-1.1, -0.4, 0.3, 0.8, 1.2]);     // the forms themselves are checked first
      assert.equal(verdict(step, typed), 'right', `${lessonId}/${stepId}: "${typed}" for ${shown}`);
    }
  }
  // antiderivatives: any spelling of F is accepted, and a different constant is not
  const anti = [
    ['f(x) = 3\\sin^2 x\\,\\cos x', (x) => Math.sin(x) ** 3, ['sin(x)^3', '(sin(x))^3', 'sin(x)³', 'sin(x)*sin(x)^2']],
    ['f(x) = 2x\\,e^{x^2}', (x) => Math.exp(x * x), ['e^(x^2)', 'e^x^2', 'exp(x^2)', 'e^{x^2}']],
    ['f(x) = 6x\\,(x^2 + 1)^{2}', (x) => (x * x + 1) ** 3, ['(x^2+1)^3', 'x^6 + 3x^4 + 3x^2 + 1', '(1 + x^2)^3']],
    ['f(x) = 2x\\cos(x^2)', (x) => Math.sin(x * x), ['sin(x^2)', 'sin(x*x)', 'sin(x²)']],
  ];
  for (const [shown, F, forms] of anti) {
    const step = showing('substitution', 'antiderivative', shown);
    for (const typed of forms) { assertSameFn(fnOf(typed), F, `"${typed}" is the antiderivative`); assert.equal(verdict(step, typed), 'right', `"${typed}" for ${shown}`); }
    for (const c of ['+ 1', '- 1']) assert.match(verdict(step, `${forms[0]} ${c}`), /check the condition/, 'the right shape with the wrong constant gets the feedback about the condition');
    for (const c of ['+ 2', '+ 0.5', '- 3']) assert.equal(verdict(step, `${forms[0]} ${c}`), 'wrong', 'any other constant is simply wrong: the condition pins it');
  }
  assert.match(verdict(showing('substitution', 'antiderivative', 'f(x) = 6x\\,(x^2 + 1)^{2}'), 'x^6 + 3x^4 + 3x^2'), /check the condition/, 'the expanded antiderivative without its constant term fails F(0) = 1');
});

test('typed answers: a function written without brackets is sent back as unreadable, never marked wrong', () => {
  const unbracketed = ['sin x', 'cos x', 'cos2x', '2cos 2x', '2cos2x', 'sin^2(x)', 'sin^3 x', 'sinx', 'xcosx', '-2xsin x^2', 'Sin(x)', '2Cos(2x)', 'dy/dx = 2x', 'y = 2x', '2x,', 'ln x'];
  let seen = 0;
  for (const id of LESSONS) for (const raw of lessons[id].steps.filter((s) => s.type === 'expr')) {
    for (let seed = 1; seed <= 12; seed++) {
      const step = resolveStep(raw, makeRng(seed), raw.id);
      for (const typed of unbracketed) assert.equal(verdict(step, typed), 'unreadable', `${id}/${raw.id}: "${typed}"`);
      seen++;
    }
  }
  assert.ok(seen >= 9 * 12, 'every expr step of the course was tried');
});

test('typed answers: an exponent typed without brackets (e^2x) is either read correctly or told to use brackets', () => {
  const outcomes = { right: 0, told: 0 };
  for (const [lessonId, stepId] of [['chain-rule', 'exp-chain'], ['product-rule', 'both-rules']]) {
    const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
    for (let seed = 1; seed <= SEEDS; seed++) {
      const step = resolveStep(raw, makeRng(seed * 31 + 7), stepId);
      if (!/e\^\(/.test(step.display)) continue;                                   // x·(ax + b)ⁿ has no exponential
      const bare = step.display.replace(/e\^\(([^()]*)\)/g, 'e^$1');               // 2e^(2x) → 2e^2x, 3e^(3x + 2) → 3e^3x + 2
      assert.notEqual(bare, step.display);
      const f = texFn(display(step.text).replace(/^y = /, ''));
      const said = verdict(step, bare);
      const reallyRight = sameFn(fnOf(bare), D(f), [-1.1, -0.4, 0.3, 0.8, 1.2]);    // e^-x and e^x^2 are read as intended
      if (reallyRight) { assert.equal(said, 'right', `"${bare}" is the derivative as it is read, so it must be accepted`); outcomes.right++; continue; }
      assert.notEqual(said, 'right');
      assert.match(said, /preview under the box/, `${lessonId}/${stepId}: "${bare}" (for ${step.display}) is marked wrong without saying why: ${said}`);
      assert.match(said, /in brackets, like `e\^\(2x\)`/);
      outcomes.told++;
    }
  }
  assert.ok(outcomes.right > 20 && outcomes.told > 100, `both cases occur: ${JSON.stringify(outcomes)}`);
});

/* ================================================= numerical statements */

test('Euler\'s method on dy/dt = y: the error shrinks roughly in proportion to the step, and (1 + 1/n)^n closes in on e', () => {
  const euler = (n) => { const h = 1 / n; let y = 1; for (let i = 0; i < n; i++) y += h * y; return y; };
  let before = null;
  for (const n of [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]) {
    const reached = euler(n);
    near(reached, (1 + 1 / n) ** n, `${n} Euler steps reach (1 + 1/${n})^${n}`, 1e-12);
    assert.ok(reached < Math.E, 'the walk falls behind the curve');
    if (before !== null) {
      const ratio = (Math.E - before) / (Math.E - reached);
      assert.ok(ratio > 1.5 && ratio < 2.05, `halving the step from 1/${n / 2} to 1/${n} divides the error by ${ratio}`);
      if (n >= 64) near(ratio, 2, 'for small steps the error is in proportion to the step', 0.02);
    }
    before = reached;
  }
  assert.ok(Math.E - euler(1024) < 0.0015);
  assert.match(fixed('differential-equations', 'interest').explain, /with \$n\$ steps you reach \$\\left\(1 \+ \\frac1n\\right\)\^n\$/);
  assert.match(fixed('differential-equations', 'euler-walk').explain, /The true value is \$e \\approx 2\.718\$/);
});

test('Taylor series: the terms of e² shrink only after the first three, as the explanation says', () => {
  const terms = Array.from({ length: 12 }, (_, k) => 2 ** k / fact(k));
  assert.match(fixed('taylor-series', 'degree').explain, /After the first three, each term is smaller than the one before/);
  assert.ok(!(terms[1] < terms[0]) && !(terms[2] < terms[1]), 'the first three do not shrink: 1, 2, 2');
  for (let k = 3; k < terms.length; k++) assert.ok(terms[k] < terms[k - 1], `term ${k} is smaller than term ${k - 1}`);
  // the series for e^x, sin x and cos x do close in for every x: far from 0 it just takes more terms
  for (const x of [-12, -3, 5, 12]) {
    near(expSum(80, x), Math.exp(x), `80 terms of the series for e^x at ${x}`, 1e-9);
    near(sinSum(79, x), Math.sin(x), `the sine series at ${x}`, 1e-7);
    let c = 0; for (let k = 0; k <= 40; k++) c += ((-1) ** k * x ** (2 * k)) / fact(2 * k);
    near(c, Math.cos(x), `the cosine series at ${x}`, 1e-7);
  }
  const recap = lessons['taylor-series'].recap.join(' ');
  assert.match(recap, /for every \$x\$/); assert.match(recap, /only for \$\|x\| < 1\$/);
  // "this is how computers do it" is said as "in this spirit", not as a literal fact
  assert.match(fixed('taylor-series', 'truths').explain, /works in this spirit: often with a polynomial approximation/);
});

test('plots marked in multiples of π (or in degrees) carry every label at its own x, on a grid line, inside the window', () => {
  let labels = 0;
  for (const id of LESSONS) for (const raw of lessons[id].steps) {
    for (let seed = 1; seed <= (typeof raw.gen === 'function' ? 60 : 1); seed++) {
      const step = resolveStep(raw, makeRng(seed), raw.id);
      for (const fig of [...step.figures, step.widget].filter((f) => f && f.type === 'plot' && f.labels)) {
        assert.equal(fig.xFormat(1.234), '', `${id}/${raw.id}: the plot's own numbers under the axis are switched off`);
        for (const label of fig.labels) {
          const text = label.text.replace('−', '-');
          let value;
          if (text === '0') value = 0;
          else if (/°$/.test(text)) value = Number(text.slice(0, -1));
          else { const m = match1(/^(-?)(\d*)π(?:\/(\d+))?$/, text, `a multiple of π in "${label.text}"`); value = ((m[1] ? -1 : 1) * (m[2] === '' ? 1 : Number(m[2])) * Math.PI) / (m[3] ? Number(m[3]) : 1); }
          near(label.x, value, `${id}/${raw.id}: the label "${label.text}" is at x = ${label.x}`, 1e-12);
          assert.ok(label.x >= fig.x[0] && label.x <= fig.x[1], `${id}/${raw.id}: "${label.text}" is inside the window`);
          assert.equal(label.y, fig.y[0], 'on the bottom edge');
          near(label.x / fig.xStep, Math.round(label.x / fig.xStep), `${id}/${raw.id}: "${label.text}" sits on a grid line`, 1e-9);
          labels++;
        }
      }
    }
  }
  assert.ok(labels > 40, `${labels} labels checked`);
});

/* ======================================================================
 * The widgets themselves
 *
 * The tests above feed hand-made states to each step's check. These mount
 * the real widgets on a small stand-in for the DOM, move them through every
 * state a learner can reach, compare what they report (and draw) with the
 * mathematics worked out here, and run each step's check on the real state.
 * ==================================================================== */

class FakeNode { constructor() { this.parentNode = null; } }
class FakeText extends FakeNode {
  constructor(text) { super(); this.data = String(text); }
  get textContent() { return this.data; }
  set textContent(v) { this.data = String(v); }
}
class FakeElement extends FakeNode {
  constructor(tag) { super(); this.tagName = String(tag).toLowerCase(); this.childNodes = []; this.attrs = {}; this.listeners = {}; this.dataset = {}; this.style = { setProperty() {} }; this.disabled = false; this.value = ''; }
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
  querySelector(tag) { return this.childNodes.find((c) => c instanceof FakeElement && c.tagName === tag) || null; }   // only ever asked for a direct <defs>
  querySelectorAll(tag) { const out = []; const walk = (el) => { for (const c of el.childNodes) if (c instanceof FakeElement) { if (c.tagName === tag) out.push(c); walk(c); } }; walk(this); return out; }
  get textContent() { return this.childNodes.map((c) => c.textContent).join(''); }
  set textContent(v) { this.replaceChildren(new FakeText(v)); }
  set innerHTML(v) { this.markup = String(v); }
  get innerHTML() { return this.markup || ''; }
  addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
  fire(type) { const ev = { type, target: this, key: '', preventDefault() {}, stopPropagation() {} }; for (const fn of this.listeners[type] || []) fn(ev); }
  click() { if (!this.disabled) this.fire('click'); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0 }; }
  focus() {}
}
const everyNode = (el, out = []) => { out.push(el); for (const c of el.childNodes || []) if (c instanceof FakeElement) everyNode(c, out); return out; };

/** Mount a widget (its module's default export) on the stand-in DOM. Nothing else in this file looks at `document`. */
function mountWidget(mod, spec) {
  globalThis.document = { createElement: (t) => new FakeElement(t), createElementNS: (_, t) => new FakeElement(t), createTextNode: (t) => new FakeText(t), head: new FakeElement('head') };
  globalThis.Node = FakeNode;
  const w = mod.default(spec, { compact: false, readOnly: false, onChange() {}, announce() {} });
  const all = (tag) => everyNode(w.el).filter((e) => e.tagName === tag);
  return {
    state: () => w.getState(),
    setState: (s) => w.setState(s),
    all,
    /** Move the i-th slider of the widget to a value, as a drag of its thumb does. */
    slide(i, value) { const input = all('input')[i]; assert.ok(input, `slider ${i + 1}`); input.value = value; input.fire('input'); return w.getState(); },
    press(label) { const b = all('button').find((e) => e.textContent.trim().startsWith(label)); assert.ok(b, `a button "${label}"`); b.click(); return w.getState(); },
    /** The numbers in the readout pills, as the learner reads them. */
    readouts: () => all('b').map((e) => e.textContent.replace('−', '-')),
  };
}

test('rate-chain, the real widget: the rate of the chain is the product of the link rates in every reachable state', async () => {
  const RateChain = await import('../src/widgets/rate-chain.js');
  const gears = fixed('chain-rule', 'gears');
  const bike = mountWidget(RateChain, gears.widget);
  let passes = 0;
  for (const k of sliderValues(gears.widget.k)) {
    bike.slide(0, k);
    for (const x of range(0, 4, 0.5)) {
      bike.setState({ x });
      const s = bike.state();
      assert.deepEqual([s.k, s.x, s.u, s.y, s.inner, s.outer, s.total], [k, x, k * x, 2 * k * x, k, 2, 2 * k], `the bike in gear ${k} after ${x} turns of the pedals`);
      near(s.inner * s.outer, s.total, 'wheel turns per pedal turn × metres per wheel turn = metres per pedal turn');
      const said = gears.check(s);
      assert.equal(said === true, 2 * k === 8, `gear ${k}: ${said}`);
      if (said === true) passes++;
      else { assert.ok(said.includes(`carries the bike ${2 * k} m`), said); assert.equal(/higher gear/.test(said), 2 * k < 8, said); }
    }
  }
  assert.equal(passes, 9, 'gear 4 is right wherever the pedals are, and no other gear is');
  bike.setState(gears.solution);
  assert.equal(gears.check(bike.state()), true, 'the solution of the step');

  const square = mountWidget(RateChain, fixed('chain-rule', 'square').figures[0]);
  for (const t of range(0, 4, 0.5)) {
    square.setState({ x: t });
    const s = square.state();
    assert.deepEqual([s.u, s.y, s.inner, s.outer, s.total], [3 * t, 9 * t * t, 3, 6 * t, 18 * t], `the square at t = ${t}`);
    near(s.inner * s.outer, s.total, `the rates multiply at t = ${t}`);
    near(s.total, D((v) => (3 * v) ** 2)(t), 'and that is the slope of A = 9t²');
  }
});

test('product-rect, the real widget: two strips and a corner, and the corner\'s share of "gain ÷ step" is 6h', async () => {
  const ProductRect = await import('../src/widgets/product-rect.js');
  const strips = fixed('product-rule', 'strips');
  const w = mountWidget(ProductRect, strips.widget);
  near(w.state().gain, 29, 'over a whole second the 5 by 4 rectangle gains 29');
  const corner = [];
  strips.widget.steps.forEach((h, i) => {
    const s = w.slide(0, i);
    assert.equal(s.h, h);
    const gain = (5 + 2 * h) * (4 + 3 * h) - 5 * 4;                                   // the new area minus the old one
    near(s.right, 4 * 2 * h, `right strip, h = ${h}`); near(s.top, 5 * 3 * h, `top strip, h = ${h}`); near(s.corner, 2 * h * 3 * h, `corner, h = ${h}`);
    near(s.right + s.top + s.corner, gain, 'the three parts are the whole gain'); near(s.gain, gain); near(s.rate, gain / h);
    near(s.rate - 23, 6 * h, 'gain ÷ step is 23 plus the corner\'s 6h');
    corner.push(round(s.corner / s.h, 6));
    // the bar: its three coloured parts have lengths in the proportion 8 : 15 : 6h
    const bar = ['orange', 'violet', 'green'].map((c) => w.all('rect').find((e) => e.attrs.fill === `var(--${c})`));
    assert.ok(bar.every(Boolean), 'the bar has an orange, a violet and a green part');
    const [a, b, c] = bar.map((e) => Number(e.attrs.width));
    near(b / a, 15 / 8, `bar: top strip ÷ right strip, h = ${h}`); near(c / a, (6 * h) / 8, `bar: corner ÷ right strip, h = ${h}`);
    assert.deepEqual(w.readouts().map(Number), [round(gain, 4), round(gain / h, 4)], 'the readouts: area gained, and area gained ÷ step');
    const said = strips.check(s);
    assert.equal(said === true, h <= 0.01, `h = ${h}: ${said}`);
    if (said !== true) assert.ok(said.includes(`is ${round(23 + 6 * h)}, and the corner still supplies ${round(6 * h)} of that`), said);
  });
  assert.deepEqual(corner, [6, 3, 1.5, 0.6, 0.06], 'the corner supplies 6, 3, 1.5, 0.6 and 0.06, as the explanation says');
  for (let i = 1; i < corner.length; i++) assert.ok(corner[i] / corner[0] <= strips.widget.steps[i] / strips.widget.steps[0] + 1e-12, 'the corner shrinks with the step while the strips stay at 8 and 15');
  w.setState(strips.solution);
  assert.equal(strips.check(w.state()), true);

  // the growing square: gain ÷ step is 2x + h, two strips of x each
  const spec = fixed('product-rule', 'not-product').figures[0];
  const sq = mountWidget(ProductRect, spec);
  for (const x of range(spec.xRange[0], spec.xRange[1], spec.xStep)) for (const h of spec.steps) {
    sq.setState({ x, h });
    const s = sq.state();
    near(s.right / h, x); near(s.top / h, x); near(s.corner / h, h); near(s.rate, 2 * x + h, `the square of side ${x}, step ${h}`);
  }
});

test('circle-velocity, the real widget: the velocity is the radius turned through a right angle, (−sin θ, cos θ)', async () => {
  const CircleVelocity = await import('../src/widgets/circle-velocity.js');
  const circle = fixed('trig-derivatives', 'circle');
  const w = mountWidget(CircleVelocity, circle.widget);
  const passing = [];
  for (const d of range(0, 360, circle.widget.step)) {
    w.setState({ deg: d });
    const s = w.state();
    const t = (d * Math.PI) / 180;
    assert.deepEqual([s.deg, s.sin, s.cos, s.vx, s.vy], [d, round(Math.sin(t)), round(Math.cos(t)), round(D(Math.cos)(t)), round(D(Math.sin)(t))], `${d}°`);
    assert.ok(Math.abs(s.cos * s.vx + s.sin * s.vy) < 1e-4, 'velocity ⟂ radius');
    near(Math.hypot(s.vx, s.vy), 1, 'unit speed', 1e-4);
    // what is drawn: the green arrow starts at the point and is at right angles to the radius, pointing counter-clockwise
    const lines = w.all('line');
    const arrow = lines.find((l) => l.attrs['marker-end']);
    const radius = lines.find((l) => l.attrs.stroke === 'var(--ink)' && !l.attrs['marker-end']);
    const r = [Number(radius.attrs.x2) - Number(radius.attrs.x1), Number(radius.attrs.y2) - Number(radius.attrs.y1)];
    const a = [Number(arrow.attrs.x2) - Number(arrow.attrs.x1), Number(arrow.attrs.y2) - Number(arrow.attrs.y1)];
    assert.deepEqual([arrow.attrs.x1, arrow.attrs.y1], [radius.attrs.x2, radius.attrs.y2], 'the arrow starts at the point');
    assert.ok(Math.abs(r[0] * a[0] + r[1] * a[1]) < 1e-6, `the arrow drawn at ${d}° is at right angles to the radius`);
    near(a[0] / Math.hypot(...a), -Math.sin(t), 'it points −sin θ across', 1e-9);
    near(-a[1] / Math.hypot(...a), Math.cos(t), 'and cos θ up (y runs downwards on the screen)', 1e-9);
    const said = circle.check(s);
    if (said === true) passing.push(d);
    else if (s.vy < 0) assert.match(said, /falling/);
    else if (s.vy === 0) { assert.match(said, /straight sideways/); assert.ok(d === 90 || d === 270); }
  }
  assert.deepEqual(passing, [60, 300]);
  w.slide(0, 60);
  assert.equal(circle.check(w.state()), true, 'the slider reaches the solution too');
});

test('slope-field, the real widget: dashes, the solution curve, the ring and the Euler walk', async () => {
  const SlopeField = await import('../src/widgets/slope-field.js');
  const dashesOf = (w) => w.all('g').find((g) => g.attrs.opacity === '0.85').childNodes.map((l) => ['x1', 'y1', 'x2', 'y2'].map((k) => Number(l.attrs[k])));
  /** Screen → graph coordinates, calibrated on the first and the last dash: the lowest-left and the highest-right point of the grid. */
  const mapping = (spec, dashes) => {
    const centre = ([x1, y1, x2, y2]) => [(x1 + x2) / 2, (y1 + y2) / 2];
    const first = (lo, by) => Math.ceil(lo / by - 1e-9) * by;
    const last = (hi, by) => Math.floor(hi / by + 1e-9) * by;
    const [ta, tb, ya, yb] = [first(spec.t[0], spec.grid[0]), last(spec.t[1], spec.grid[0]), first(spec.y[0], spec.grid[1]), last(spec.y[1], spec.grid[1])];
    const [ax, ay] = centre(dashes[0]);
    const [bx, by] = centre(dashes[dashes.length - 1]);
    const kx = (bx - ax) / (tb - ta);
    const ky = (ay - by) / (yb - ya);
    return { kx, ky, count: (Math.round((tb - ta) / spec.grid[0]) + 1) * (Math.round((yb - ya) / spec.grid[1]) + 1), t: (px) => ta + (px - ax) / kx, y: (py) => ya + (ay - py) / ky };
  };
  // every dash of every field in the lesson has the slope the rule gives at its centre, and sits on the grid
  for (const id of ['field', 'name', 'euler-walk', 'cooling', 'logistic']) {
    const step = fixed('differential-equations', id);
    const spec = step.widget || step.figures[0];
    const F = ruleOf(spec.rule);
    const w = mountWidget(SlopeField, spec);
    const dashes = dashesOf(w);
    const map = mapping(spec, dashes);
    assert.equal(dashes.length, map.count, `${id}: one dash at every point of the grid`);
    const centres = new Set();
    for (const [x1, y1, x2, y2] of dashes) {
      const t = map.t((x1 + x2) / 2);
      const y = map.y((y1 + y2) / 2);
      near(t / spec.grid[0], Math.round(t / spec.grid[0]), `${id}: a dash centre is on the grid in t`, 1e-6);
      near(y / spec.grid[1], Math.round(y / spec.grid[1]), `${id}: a dash centre is on the grid in y`, 1e-6);
      const drawn = ((y1 - y2) / map.ky) / ((x2 - x1) / map.kx);                         // rise over run, in graph units
      near(drawn, F(t, y), `${id}: the dash at (${round(t, 3)}, ${round(y, 3)})`, 1e-6);
      centres.add(`${round(t, 4)},${round(y, 4)}`);
    }
    assert.equal(centres.size, dashes.length, `${id}: no two dashes share a grid point`);
  }

  // the ring: exactly the start whose solution passes within the tolerance of it
  const field = fixed('differential-equations', 'field');
  const w = mountWidget(SlopeField, field.widget);
  const ring = field.widget.target;
  const passing = [];
  for (const y0 of range(field.widget.y[0], field.widget.y[1], field.widget.snap[1])) {
    w.setState({ start: { y: y0 } });
    const s = w.state();
    const exact = y0 * Math.exp(0.5 * ring.t);
    near(s.end, exact, `the widget's solution from ${y0} at t = ${ring.t}`, 1e-4);
    near(s.slope, 0.5 * y0);
    assert.equal(s.hit, Math.abs(exact - ring.y) <= ring.tol, `through the ring from ${y0}?`);
    const said = field.check(s);
    assert.equal(said === true, s.hit, `start ${y0}: ${said}`);
    if (said === true) passing.push(y0); else assert.equal(/Start lower/.test(said), exact > ring.y, said);
  }
  assert.deepEqual(passing, [1]);
  // the blue curve that is drawn from y = 1 is e^(0.5t)
  w.setState(field.solution);
  const map = mapping(field.widget, dashesOf(w));
  const curve = w.all('path').find((p) => p.attrs['stroke-width'] === '3.5' && (p.attrs.d || '').length > 100);
  const points = curve.attrs.d.split(/[ML]/).filter(Boolean).map((p) => p.trim().split(' ').map(Number));
  assert.ok(points.length > 200, 'a finely sampled curve');
  for (const [px, py] of points) { const t = map.t(px); const y = map.y(py); if (y <= field.widget.y[1]) assert.ok(Math.abs(y - Math.exp(0.5 * t)) < 2e-3, `the drawn curve at t = ${round(t, 3)}: ${y} vs ${Math.exp(0.5 * t)}`); }

  // the walk: each press is one step y ← y + h·F(t, y), and the true height is e^t
  const walk = fixed('differential-equations', 'euler-walk');
  const finals = {};
  walk.widget.euler.sizes.forEach((h, i) => {
    const walker = mountWidget(SlopeField, walk.widget);
    let s = walker.slide(0, i);
    assert.deepEqual([s.h, s.n, s.t, s.y, s.done], [h, 0, 0, 1, false]);
    let y = 1;
    for (let n = 1; n <= Math.round(1 / h); n++) {
      assert.notEqual(walk.check(s), true, 'not accepted before the walk is finished');
      s = walker.press('Take a step');
      y += h * y;
      assert.equal(s.n, n); near(s.t, n * h, 'time', 1e-9); near(s.y, y, `h = ${h}, step ${n}`, 1e-6); near(s.exact, Math.exp(n * h), 'the true curve', 1e-6); near(s.error, y - Math.exp(n * h), 'the error', 1e-5);
    }
    assert.equal(s.done, true, `h = ${h}: at t = 1 after ${Math.round(1 / h)} steps`);
    assert.equal(walk.check(s) === true, h < 0.5, `finished with h = ${h}`);
    assert.equal(walker.press('Take a step').n, s.n, 'no step beyond t = 1');
    finals[h] = s.y;
  });
  assert.deepEqual([round(finals[0.5], 2), round(finals[0.25], 2), round(finals[0.125], 2)], [2.25, 2.44, 2.57], 'the three arrivals quoted in the explanation');
  const done = mountWidget(SlopeField, walk.widget);
  done.setState(walk.solution);
  assert.equal(walk.check(done.state()), true);

  // cooling and logistic growth: the widget's curves end where the formulas say, and never cross their equilibrium
  const cooling = fixed('differential-equations', 'cooling').figures[0];
  const cup = mountWidget(SlopeField, cooling);
  for (const T of range(cooling.y[0], cooling.y[1], cooling.snap[1])) {
    cup.setState({ start: { y: T } });
    near(cup.state().end, 20 + (T - 20) * Math.exp(-0.05 * cooling.t[1]), `the drink that starts at ${T} °C, after ${cooling.t[1]} minutes`, 1e-4);
    assert.equal(Math.sign(cup.state().end - 20), Math.sign(T - 20), 'it stays on its own side of 20 °C');
  }
  const pond = fixed('differential-equations', 'logistic').figures[0];
  const fish = mountWidget(SlopeField, pond);
  for (const P of range(pond.y[0], pond.y[1], pond.snap[1])) {
    fish.setState({ start: { y: P } });
    const exact = P === 0 ? 0 : 10 / (1 + ((10 - P) / P) * Math.exp(-pond.t[1]));           // the logistic curve through (0, P)
    near(fish.state().end, exact, `the population that starts at ${P}`, 1e-4);
    if (P > 0) assert.ok(Math.abs(fish.state().end - 10) < 0.01, 'every start above zero ends at 10');
  }
});

test('plot figures as the learner reads them: equal areas for every b, the measured slopes, the tuned guess', async () => {
  const Plot = await import('../src/widgets/plot.js');
  // limits change too: the two readouts agree at every position of the slider
  const limits = mountWidget(Plot, fixed('substitution', 'limits').figures[0]);
  for (const b of sliderValues(fixed('substitution', 'limits').figures[0].params.b)) {
    limits.slide(0, b);
    const [blue, orange] = limits.readouts().map(Number);
    assert.equal(blue, orange, `the two areas shown for b = ${b}`);
    near(blue, round(((b * b + 1) ** 4 - 1) / 4, 3), `the area for b = ${b}`);
  }
  // let the graph referee: the slope read at x = 1 is 8
  const measure = mountWidget(Plot, fixed('chain-rule', 'measure').figures[0]);
  measure.setState({ P: { x: 1 } });
  assert.deepEqual(measure.readouts().map(Number), [1, 8]);
  // degrees: the readout says 0.0175
  assert.deepEqual(mountWidget(Plot, fixed('trig-derivatives', 'degrees').figures[0]).readouts().map(Number), [0.0175]);
  // the four readings of the slope of sine
  const rec = mountWidget(Plot, fixed('trig-derivatives', 'recognise').figures[0]);
  assert.deepEqual([0, 1, 2, 3].map((q) => { rec.setState({ P: { x: (q * Math.PI) / 2 } }); return rec.readouts(); }), [['0', '1'], ['π/2', '0'], ['π', '-1'], ['3π/2', '0']]);
  // guess, differentiate, adjust: the readouts are the numbers the feedback quotes
  const tune = fixed('substitution', 'tune');
  const guess = mountWidget(Plot, tune.widget);
  for (const n of sliderValues(tune.widget.params.n)) {
    const s = guess.slide(0, n);
    assert.deepEqual(guess.readouts().map(Number), [round(24 / n, 2), 4], `n = ${n}`);
    assert.equal(tune.check(s) === true, n === 6);
  }
  // the peak of x·e^(−x/k): the slope readout is 0 exactly where the answer says
  const raw = lessons['product-rule'].steps.find((s) => s.id === 'peak');
  for (let seed = 1; seed <= 12; seed++) {
    const step = resolveStep(raw, makeRng(seed), 'peak');
    const peak = mountWidget(Plot, step.figures[0]);
    peak.setState({ P: { x: step.answer } });
    assert.deepEqual(peak.readouts().map(Number), [step.answer, 0], `the peak at x = ${step.answer}`);
  }
});

/* ------------------------------------------------ teach before you ask */

/** The teaching screens added so that every lesson shows a thing before it asks for it. */
const TEACHING = {
  'chain-rule': ['teach-chain', 'teach-inside-outside', 'example-exp', 'teach-root'],
  'product-rule': ['teach-gain', 'example-product', 'example-peak', 'example-quotient'],
  'trig-derivatives': ['example-slope-at-angle', 'example-chain-wave', 'teach-second-derivative'],
  substitution: ['teach-backwards', 'example-condition', 'example-missing-factor', 'example-limits'],
  'differential-equations': ['teach-slope-rule', 'example-euler', 'teach-reading-equations'],
  'taylor-series': ['teach-imitate', 'example-estimate', 'example-cosine', 'teach-series'],
};

/**
 * [teaching screen, a step it serves, what the screen must contain].
 * Screens that were already there are listed too: each is where a term, a notation or a
 * method is shown for the first time, and it has to stay in front of the step that needs it.
 */
const SERVES = {
  'chain-rule': [
    ['teach-chain', 'gears', [/\*\*rate\*\*/, /\*\*product\*\*/, /3 \\times 2 = 6/]],
    ['name', 'inside-outside', [/\\frac\{dy\}\{du\} \\times \\frac\{du\}\{dx\}/, /Rates along a chain multiply/]],
    ['teach-inside-outside', 'inside-outside', [/\*\*inside\*\*/, /\*\*outside\*\*/, /exponent/, /under the root/]],
    ['teach-inside-outside', 'two-ways', [/:::example/, /power rule/, /put the inside back/]],
    ['recipe', 'power-chain', [/\*\*outside\*\*/, /Multiply by the derivative of the \*\*inside\*\*/, /f'\\big\(g\(x\)\\big\) \\times g'\(x\)/, /negative/]],
    ['example-exp', 'exp-chain', [/:::example/, /its own derivative/, /exponent/]],
    ['teach-root', 'root', [/:::example/, /\\frac\{1\}\{2\\sqrt\{u\}\}/, /Multiply the two rates/]],
    ['recipe', 'sort-slips', [/leaving the inside exactly as it is/]],
    ['name', 'balloon', [/Rates along a chain multiply/]],
  ],
  'product-rule': [
    ['teach-gain', 'strips', [/:::example/, /on average/, /strip on the right/, /strip on top/, /corner/]],
    ['rule', 'not-product', [/f' \\cdot g/, /f \\cdot g'/, /corner vanishes/]],
    ['rule', 'from-table', [/:::example/, /slopes/, /3 \\times 7 \+ 10 \\times \(-2\)/]],
    ['example-product', 'guided', [/:::example/, /Name the factors/, /Add the two strips/]],
    ['example-product', 'product-expr', [/its own derivative/, /y'\$ is short for/]],
    ['example-peak', 'peak', [/:::example/, /chain rule/, /slope is zero/, /never zero/]],
    ['example-peak', 'both-rules', [/chain rule from the last lesson/]],
    ['quotient', 'quotient-use', [/\*\*quotient rule\*\*/, /g\^2/]],
    ['example-quotient', 'quotient-use', [/:::example/, /Differentiate first, then put the number in/]],
  ],
  'trig-derivatives': [
    ['why', 'cos-sign', [/-\\sin\\theta/]],
    ['why', 'values', [/\\frac\{d\}\{d\\theta\}\\sin\\theta &= \\cos\\theta/, /\\frac\{d\}\{d\\theta\}\\cos\\theta &= -\\sin\\theta/]],
    ['example-slope-at-angle', 'values', [/:::example/, /\\pi\/6/, /0\.87/, /sign of the quarter/]],
    ['example-chain-wave', 'degrees', [/:::example/, /multiply by the derivative of the inside/]],
    ['example-chain-wave', 'chain', [/\\sin\(7x\)/, /\\cos\(x\^3\)/, /-\\sin u/]],
    ['teach-second-derivative', 'spring', [/\*\*second derivative\*\*/, /y''/, /\*\*velocity\*\*/, /\*\*acceleration\*\*/, /:::example/]],
  ],
  substitution: [
    ['teach-backwards', 'forward', [/\\int f\(x\)\\,dx = F\(x\) \+ C/, /antiderivative/, /:::example/, /\+\\,C\$ stands for any constant/]],
    ['pattern', 'choose-u', [/\*\*substitution\*\*/, /du = g'\(x\)\\,dx/, /:::example/]],
    ['pattern', 'do-sub', [/name the inside/, /integrate in \$u\$/, /put the inside back/]],
    ['example-condition', 'antiderivative', [/:::example/, /Use the condition/, /\\sin\^5 x/, /its own antiderivative/]],
    ['example-missing-factor', 'factor', [/:::example/, /\\tfrac12\\,du/, /e\^\{7x\}/]],
    ['example-missing-factor', 'ready-or-not', [/Only a \*number\*/, /\*function of \$x\$\* cannot/]],
    ['example-limits', 'definite', [/:::example/, /change the limits with it/, /New limits/, /upper limit/]],
    ['example-limits', 'old-limits', [/change the limits with it/]],
    ['example-limits', 'trig-definite', [/New limits/]],
  ],
  'differential-equations': [
    ['teach-slope-rule', 'dash', [/:::example/, /\*\*slope\*\*/, /0\.5 \\times 8\} = 4/]],
    ['teach-slope-rule', 'cooling-rate', [/at any point of the graph, it tells you/]],
    ['name', 'verify', [/\*\*differential equation\*\*/, /starting value/]],
    ['name', 'which-solution', [/y = C\\,e\^\{kt\}/]],
    ['example-euler', 'euler-hand', [/:::example/, /new \$y\$ = old \$y\$ \+ \$h\$ × slope/, /\*new\* point/]],
    ['teach-reading-equations', 'match', [/steady rate/, /in proportion to size/, /decay/, /gap/, /levels off/]],
  ],
  'taylor-series': [
    ['teach-imitate', 'tangent', [/:::example/, /Value/, /Slope/, /a_0 \+ a_1x/]],
    ['name', 'degree', [/\*\*Taylor polynomial\*\*/, /f\^\{\(n\)\}\(0\)/, /\$n\$th derivatives/]],
    ['example-estimate', 'estimate-exp', [/:::example/, /one term at a time/, /divided by its factorial/, /negative \$x\$/]],
    ['example-cosine', 'sine-coeffs', [/:::example/, /-\\sin x/, /2!/, /divide by the factorials/]],
    ['teach-series', 'match-series', [/\*\*Taylor series\*\*/]],
    ['teach-series', 'truths', [/No polynomial of any degree is \*exactly\*/, /only for \$x\$ between \$-1\$ and \$1\$/]],
  ],
};

/**
 * Worked examples must not be the question that follows: [lesson, the screen with the example,
 * the generated step it prepares, formulas of the example]. Each formula is on the screen and
 * is never shown by the generator.
 */
const EXAMPLES = [
  ['chain-rule', 'teach-inside-outside', 'power-chain', ['(7x + 2)^3']],
  ['chain-rule', 'recipe', 'power-chain', ['(x^2 + 9)^7', '(5 - 9x)^8']],
  ['chain-rule', 'recipe', 'exp-chain', ['e^{7x}']],
  ['chain-rule', 'example-exp', 'exp-chain', ['e^{x^3}', 'e^{-6x}']],
  ['chain-rule', 'teach-root', 'root', ['\\sqrt{6x + 4}']],
  ['product-rule', 'example-product', 'product-expr', ['(x^2 + 1)\\,e^x']],
  ['product-rule', 'example-peak', 'peak', ['e^{-5x}', 'e^{-x/5}']],
  ['product-rule', 'example-peak', 'both-rules', ['e^{-5x}']],
  ['product-rule', 'example-quotient', 'quotient-use', ['\\dfrac{4x}{x + 6}']],
  ['trig-derivatives', 'example-chain-wave', 'chain', ['\\sin(7x)', '\\cos(x^3)']],
  ['substitution', 'pattern', 'choose-u', ['2x\\,(x^2 + 1)^3']],
  ['substitution', 'example-condition', 'antiderivative', ['6x\\,(x^2 + 5)^2', '\\sin^5 x']],
  ['substitution', 'example-missing-factor', 'factor', ['x\\,(x^2 + 9)^5', 'e^{7x}']],
  ['substitution', 'example-limits', 'definite', ['(x^2 - 1)^2']],
  ['differential-equations', 'example-euler', 'euler-hand', ['= 2t + y']],
];

/** Every different question a generated step asks in SEEDS seeds: its text and its template. */
function pool(lessonId, stepId) {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.equal(typeof raw.gen, 'function', `${lessonId}/${stepId} is generated`);
  const out = new Set();
  for (let seed = 1; seed <= SEEDS; seed++) { const step = resolveStep(raw, makeRng(seed * 7919 + 13), stepId); out.add(`${step.text}\n${step.template || ''}`); }
  return [...out];
}
/** A formula with the braces round one-figure powers removed, so that x^{3} and x^3 compare equal. */
const plainPowers = (text) => text.replace(/\^\{(\w)\}/g, '^$1');

test('teach before you ask: every lesson teaches first, on three to six screens, with at most two predictions', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const id of LESSONS) {
    const steps = lessons[id].steps.map((raw) => resolveStep(raw, makeRng(1), raw.id));      // resolved, as the player sees them
    const roles = steps.map(role);
    const at = (stepId) => steps.findIndex((s) => s.id === stepId);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    const screens = roles.filter((kind) => kind === 'teach').length;
    assert.ok(screens >= 3 && screens <= 6, `${id}: ${screens} teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const stepId of TEACHING[id]) {
      const step = steps[at(stepId)];
      assert.ok(step && step.type === 'info', `${id}: the teaching screen "${stepId}" exists`);
      assert.ok(step.figures.length >= 1 || /\n\s*\|/.test(step.text) || /:::(example|key)/.test(step.text), `${id}/${stepId} has a figure, a table or a worked example`);
      assert.ok(roles.indexOf('graded', at(stepId) + 1) > 0, `${id}/${stepId} is followed by a question`);
    }
    for (const [teach, ask, needs] of SERVES[id]) {
      assert.ok(at(teach) >= 0 && at(ask) >= 0, `${id}: "${teach}" and "${ask}" exist`);
      assert.equal(steps[at(teach)].type, 'info', `${id}/${teach} is a teaching screen`);
      assert.ok(at(teach) < at(ask), `${id}: "${teach}" comes before "${ask}"`);
      for (const pattern of needs) assert.match(steps[at(teach)].text, pattern, `${id}/${teach} shows what "${ask}" needs`);
    }
    // every generated step has a worked example somewhere above it (on a screen, or as a line of its own prompt)
    for (const stepId of GENERATED[id]) {
      const above = steps.slice(0, at(stepId)).filter((s) => s.type === 'info' && /:::example/.test(s.text));
      assert.ok(above.length >= 1, `${id}/${stepId}: a worked example comes before it`);
    }
  }
  // a discovery is followed at once by the screen that names what was found
  const next = (id, stepId) => lessons[id].steps[lessons[id].steps.findIndex((s) => s.id === stepId) + 1].id;
  assert.equal(next('chain-rule', 'square'), 'name');
  assert.equal(next('product-rule', 'pieces'), 'rule');
  assert.equal(next('trig-derivatives', 'circle'), 'why');
  assert.equal(next('trig-derivatives', 'cycle'), 'teach-second-derivative');
  assert.equal(next('substitution', 'tune'), 'pattern');
  assert.equal(next('substitution', 'limits'), 'example-limits');
  assert.equal(next('differential-equations', 'field'), 'name');
  assert.equal(next('differential-equations', 'interest'), 'example-euler');
  assert.equal(next('taylor-series', 'factorials'), 'name');
  assert.equal(next('taylor-series', 'geometric'), 'teach-series');
  // terms and notation that used to appear first in an explanation are now defined on a screen before they are used
  assert.ok(!/second derivative/.test(fixed('trig-derivatives', 'cycle').explain), 'the second derivative is named on its own screen, not in an explanation');
  assert.ok(!/Taylor series/.test(fixed('taylor-series', 'geometric').explain), 'the Taylor series is named on its own screen, not in an explanation');
  assert.match(fixed('taylor-series', 'match-series').text, /Carried on for ever, a Taylor polynomial is called a Taylor series/, 'the review step carries its own definition');
  assert.match(fixed('substitution', 'hook').text, /integral sign without limits asks for an \*\*antiderivative\*\*/, 'the notation of the opening question is explained in it');
  for (const id of LESSONS) for (const raw of lessons[id].steps) for (const text of strings(resolveStep(raw, makeRng(1), raw.id))) assert.ok(!/\\Big\[/.test(text), `${id}/${raw.id}: the bracket notation [F] is never taught, so it is not used`);
});

test('teach before you ask: no worked example is a question its generator can ask, and the four series are shown before they are matched', () => {
  for (const [id, teach, stepId, formulas] of EXAMPLES) {
    const screen = plainPowers(fixed(id, teach).text);
    const asked = pool(id, stepId).map(plainPowers);
    for (const formula of formulas) {
      assert.ok(screen.includes(formula), `${id}/${teach} works through ${formula}`);
      assert.ok(!asked.some((text) => text.includes(formula)), `${id}/${stepId} can ask the worked example ${formula}`);
    }
  }
  // examples given with numbers
  for (const text of pool('product-rule', 'from-table')) assert.ok(!/\| \$-?(7|8|9|10)\$ \|/.test(text), 'the table never has the 10 and the 7 of the worked example');
  assert.match(fixed('product-rule', 'rule').text, /\$f = 10\$ and \$g = 7\$/);
  for (const text of pool('trig-derivatives', 'values')) assert.ok(!/\\sin x\\;\$ at \$\\;x = \\frac\{\\pi\}\{6\}\$|\\cos x\\;\$ at \$\\;x = \\frac\{\\pi\}\{4\}\$/.test(text), 'sine at π/6 and cosine at π/4 are the worked examples');
  near(D(Math.sin)(Math.PI / 6), 0.87, 'the slope quoted for sine at π/6', 6e-3); near(D(Math.cos)(Math.PI / 4), -0.71, 'the slope quoted for cosine at π/4', 6e-3);
  for (const text of pool('taylor-series', 'estimate-exp')) assert.ok(!/estimate \$e\^\{0\.2\}\$/.test(text), 'e^0.2 is the worked example');
  for (const text of pool('taylor-series', 'sin-estimate')) { assert.ok(!/estimate \$\\sin 0\.7\$/.test(text), 'sin 0.7 is the worked line'); assert.match(text, /For example, \$\\sin 0\.7 \\approx \\mathord\{0\.7 - \\dfrac\{0\.343\}\{6\}\}\$, which is about \$0\.6428\$/); }

  // the worked examples themselves, re-derived
  const xs = [-0.9, -0.4, 0.3, 0.7, 1.2];
  assertSameFn((x) => 21 * (7 * x + 2) ** 2, D((x) => (7 * x + 2) ** 3), '(7x + 2)³', xs);
  assertSameFn((x) => -72 * (5 - 9 * x) ** 7, D((x) => (5 - 9 * x) ** 8), '(5 − 9x)⁸', [0.3, 0.5, 0.7]);
  assertSameFn((x) => 3 * x * x * Math.exp(x ** 3), D((x) => Math.exp(x ** 3)), 'e^(x³)', xs);
  assertSameFn((x) => -6 * Math.exp(-6 * x), D((x) => Math.exp(-6 * x)), 'e^(−6x)', [0, 0.2, 0.5]);
  near(D((x) => Math.sqrt(6 * x + 4))(2), 0.75, 'the slope of √(6x + 4) at 2');
  near(3 * 7 + 10 * -2, 1, 'the product rule with numbers');
  assertSameFn((x) => (x * x + 2 * x + 1) * Math.exp(x), D((x) => (x * x + 1) * Math.exp(x)), '(x² + 1)eˣ', xs);
  assertSameFn((x) => (1 - 5 * x) * Math.exp(-5 * x), D((x) => x * Math.exp(-5 * x)), 'x·e^(−5x)', [0, 0.2, 0.6]);
  near(D((x) => x * Math.exp(-5 * x))(0.2), 0, 'its peak is at 0.2', 1e-7);
  assertSameFn((x) => -0.2 * Math.exp(-x / 5), D((x) => Math.exp(-x / 5)), 'e^(−x/5)', xs);
  assertSameFn((x) => 24 / (x + 6) ** 2, D((x) => (4 * x) / (x + 6)), '4x/(x + 6)', xs);
  near(D((x) => (4 * x) / (x + 6))(2), 0.375, 'its slope at 2'); near((4 * 2) / (2 + 6), 1, 'and its height there');
  assertSameFn((x) => 7 * Math.cos(7 * x), D((x) => Math.sin(7 * x)), 'sin 7x', xs);
  assertSameFn((x) => -3 * x * x * Math.sin(x ** 3), D((x) => Math.cos(x ** 3)), 'cos(x³)', xs);
  assertSameFn((t) => 6 * t, D(D((t) => t ** 3, 1e-2), 1e-2), 'position t³, acceleration 6t', xs, 1e-5);
  assertSameFn(D((x) => (x * x + 5) ** 3), (x) => 6 * x * (x * x + 5) ** 2, '6x(x² + 5)²', xs); near((0 + 5) ** 3, 125, 'F(0) = 125');
  assertSameFn(D((x) => Math.sin(x) ** 6), (x) => 6 * Math.sin(x) ** 5 * Math.cos(x), '6 sin⁵x cos x', xs);
  assertSameFn(D((x) => (x * x + 9) ** 6 / 12), (x) => x * (x * x + 9) ** 5, 'x(x² + 9)⁵', xs);
  assertSameFn(D((x) => Math.exp(7 * x) / 7), (x) => Math.exp(7 * x), 'e^(7x)', [-0.3, 0, 0.2]);
  near(integrate((x) => 2 * x * (x * x - 1) ** 2, 1, 2), 9, 'the definite integral of the example', 1e-9);
  near(integrate((u) => u * u, 0, 3), 9, 'the same integral in u', 1e-9);
  { let t = 0; let y = 1; const walk = []; for (let i = 0; i < 2; i++) { const slope = 2 * t + y; y += 0.5 * slope; t += 0.5; walk.push(slope, y); } assert.deepEqual(walk, [1, 1.5, 2.5, 2.75], 'the Euler example'); }
  const euler = fixed('differential-equations', 'example-euler').figures[0];
  assert.deepEqual(euler.points.map((p) => [p.x, p.y]), [[0, 1], [0.5, 1.5], [1, 2.75]], 'the path drawn is the path worked out');
  assert.deepEqual(ruleOf(fixed('differential-equations', 'teach-slope-rule').figures[0].rule)(2, 8), 4, 'the dash at (2, 8)');
  near(D((x) => Math.exp(2 * x))(0), 2, 'the slope of e^(2x) at 0');
  assertSameFn(fnOf(fixed('taylor-series', 'teach-imitate').figures[0].fns[1].expr), (x) => 1 + 2 * x, 'the tangent drawn', xs);
  near(round(expSum(3, 0.2), 3), 1.221, 'e^0.2 from four terms'); near(round(Math.exp(0.2), 4), 1.2214, 'and from a calculator');
  near(round(0.7 - 0.343 / 6, 4), 0.6428, 'sin 0.7 from two terms'); near(0.7 ** 3, 0.343);
  assertSameFn(fnOf(fixed('product-rule', 'example-peak').figures[0].fns[0].expr), (x) => x * Math.exp(-5 * x), 'the curve drawn for the peak example', [0.1, 0.2, 0.7]);

  // the five kinds of equation are on the screen before the matching step, each with its reading
  const kinds = fixed('differential-equations', 'teach-reading-equations').text.split('\n').filter((l) => /^\s*\|/.test(l)).slice(2);     // without the heading and the rule under it
  assert.equal(kinds.length, fixed('differential-equations', 'match').pairs.length, 'one row for each kind of equation that is matched');
  const rhs = kinds.map((l) => compile(tex2expr(inline(l)[0].replace(/^\\mathord\{(.+)\}$/, '$1')), { vars: ['y'] }));      // the first cell is the right-hand side of dy/dt = …
  near(rhs[0]({ y: 3 }), 5); near(rhs[0]({ y: 300 }), 5);                                  // steady
  near(rhs[1]({ y: 50 }) / 50, 0.2); near(rhs[2]({ y: 50 }) / 50, -0.2);                    // 20% of itself, gained or lost
  near(rhs[3]({ y: 15 }), 0); assert.ok(rhs[3]({ y: 40 }) < 0 && rhs[3]({ y: 5 }) > 0);       // the gap from 15 closes
  near(rhs[4]({ y: 80 }), 0); assert.ok(rhs[4]({ y: 20 }) > 0 && rhs[4]({ y: 100 }) < 0);     // levels off at 80

  // each of the four series is shown before the step that matches them
  const taylor = lessons['taylor-series'].steps;
  const before = (stepId) => taylor.findIndex((s) => s.id === stepId) < taylor.findIndex((s) => s.id === 'match-series');
  for (const [stepId, field, pattern] of [
    ['name', 'text', /e\^x \\approx 1 \+ x \+ \\frac\{x\^2\}\{2!\}/],
    ['sine-coeffs', 'explain', /\\sin x \\approx x - \\frac\{x\^3\}\{3!\}/],
    ['cos-series', 'explain', /\\cos x \\approx 1 - \\frac\{x\^2\}\{2!\}/],
    ['geometric', 'text', /1 \+ x \+ x\^2 \+ \\dots \+ x\^n/],
  ]) { assert.ok(before(stepId), `${stepId} comes before the matching step`); assert.match(fixed('taylor-series', stepId)[field], pattern, `${stepId} shows its series`); }
  // the table of exact values on the wave screen
  const wave = fixed('trig-derivatives', 'example-slope-at-angle').text.split('\n').filter((l) => /^\s*\|/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  const angles = [0, Math.PI / 6, Math.PI / 3, Math.PI / 2];
  assert.deepEqual(wave[2].slice(1).map(Number), angles.map((a) => round(Math.sin(a), 2)), 'the sines in the table');
  assert.deepEqual(wave[3].slice(1).map(Number), angles.map((a) => round(Math.cos(a), 2)), 'the cosines in the table');
});

/* ------------------------------------------------------ all six lessons */

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

test('every lesson: shape, one right answer per choice, no broken text, no "wrong" answer that is accepted', () => {
  for (const id of LESSONS) {
    const lesson = lessons[id];
    assert.ok(lesson.steps.length >= 12 && lesson.steps.length <= 18, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review).length;
    assert.ok(reviews >= 2 && reviews <= 4, `${id}: ${reviews} review steps`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next, `${id}: a teaser for what comes next`);
    const handsOn = lesson.steps.filter((s) => s.type === 'interact' || (s.figure && [].concat(s.figure).some((f) => !f.static && (f.params || f.points?.some((p) => p.drag) || ['rate-chain', 'product-rect', 'circle-velocity', 'slope-field', 'slope-tracer'].includes(f.type))))).length;
    assert.ok(handsOn >= 2, `${id}: ${handsOn} hands-on steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'interact').length >= 1, `${id}: at least one interact step`);
    for (const raw of lesson.steps) {
      const runs = typeof raw.gen === 'function' ? SEEDS : 1;
      if (raw.review) assert.ok(raw.explain || typeof raw.gen === 'function', `${id}/${raw.id}: a review step explains itself`);
      for (let seed = 1; seed <= runs; seed++) {
        const step = resolveStep(raw, makeRng(seed * 104729 + 5), raw.id);
        const where = `${id}/${raw.id} (seed ${seed})`;
        for (const text of strings(step)) assert.ok(!/undefined|NaN|Infinity|\[object/.test(text), `${where}: "${text.slice(0, 90)}"`);
        if (step.graded) assert.ok(step.explain, `${where}: a graded step has an explanation`);
        for (const fig of [...step.figures, step.widget].filter(Boolean)) assert.ok(fig.alt, `${where}: a figure has no alt text`);
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
          for (const [value] of step.wrong) assert.ok(!accepts(step, value), `${where}: the "wrong" value ${value} would be accepted`);
          // no listed slip hides another: two slips within the tolerance of each other would always show the first one's message
          const clash = (a, b) => (step.tolerance != null ? Math.abs(a - b) <= step.tolerance + 1e-12 : Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b)));
          step.wrong.forEach(([a], i) => step.wrong.slice(i + 1).forEach(([b]) => assert.ok(!clash(a, b), `${where}: the slips ${a} and ${b} cannot be told apart`)));
        }
        if (step.type === 'expr') {
          assert.ok(equivalent(step.answer, step.answer, step.vars), `${where}: the answer can be compared with itself`);
          for (const [wrong] of step.wrong) assert.ok(!equivalent(String(wrong), step.answer, step.vars), `${where}: "wrong" lists the answer`);
          step.wrong.forEach(([a], i) => step.wrong.slice(i + 1).forEach(([b]) => assert.ok(!equivalent(String(a), String(b), step.vars), `${where}: the slips "${a}" and "${b}" are the same function`)));
          if (step.display) { parse(step.display, { vars: step.vars }); assert.ok(equivalent(step.display, step.answer, step.vars), `${where}: the answer that is revealed, "${step.display}", is not accepted`); }
        }
        if (step.type === 'fill') for (const b of step.blanks) assert.ok(b.kind === 'select' ? b.options.includes(b.answer) : b.answers.length > 0, `${where}: a blank has no answer`);
        if (step.type === 'match') { assert.equal(new Set(step.pairs.map((p) => p[0])).size, step.pairs.length, `${where}: left items repeat`); assert.equal(new Set(step.pairs.map((p) => p[1])).size, step.pairs.length, `${where}: right items repeat`); }
        if (step.type === 'interact') assert.ok(typeof step.check === 'function' && step.solution, `${where}: a check and a solution`);
      }
    }
  }
});

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} is generated but no test re-derives it`);
  }
});
