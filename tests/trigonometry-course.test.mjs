/**
 * Trigonometry: Circles & Waves — independent checks of the course.
 *
 * Every generator is run with many seeds and its answer is worked out again
 * here from the *text the learner sees* and from the figure that is drawn
 * (triangles are re-solved from their coordinates, waves are measured by brute
 * force), never from the generator's own variables. Every interactive check is
 * run over all the states its widget can reach.
 *
 *   node --test tests/trigonometry-course.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { compile } from '../src/core/mathexpr.js';
import { sidesOf } from '../src/widgets/trig-triangle.js';
import { radText, exactText } from '../src/widgets/unit-circle.js';

const SEEDS = 300;
const COURSE = 'trigonometry';
const LESSONS = ['right-triangle-ratios', 'finding-sides-angles', 'unit-circle', 'radians', 'sine-waves', 'any-triangle'];
/** Every generated step of the course. Each is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'right-triangle-ratios': ['which-side', 'read-ratios', 'use-ratio'],
  'finding-sides-angles': ['find-side', 'find-hyp', 'find-angle', 'eye-height'],
  'unit-circle': ['signs', 'exact', 'other-coordinate', 'mirror'],
  radians: ['deg-to-rad', 'rad-to-deg', 'arc-length', 'arc-degrees'],
  'sine-waves': ['period', 'from-extremes', 'read-formula', 'sound'],
  'any-triangle': ['cos-side', 'cos-angle', 'sin-side', 'ship-distance'],
};
const tested = new Set();

const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/${COURSE}/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, COURSE, id);
}

/** Run a step's generator with many seeds and hand each concrete step to `verify`. */
function eachVariant(lessonId, stepId, verify, minVariants = 5) {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  assert.equal(typeof raw.gen, 'function', `${lessonId}/${stepId} is generated`);
  assert.ok(GENERATED[lessonId].includes(stepId), `${lessonId}/${stepId} is listed in GENERATED`);
  tested.add(`${lessonId}/${stepId}`);
  const seen = new Set();
  for (let seed = 1; seed <= SEEDS; seed++) {
    const step = resolveStep(raw, makeRng(seed * 7919 + 13), stepId);
    seen.add(JSON.stringify([step.text, step.template, step.figures, (step.options || []).map((o) => o.text)]));
    try { verify(step); } catch (err) { err.message = `${lessonId}/${stepId} (seed ${seed}): ${err.message}\n  text: ${step.text.replace(/\s+/g, ' ').trim()}`; throw err; }
  }
  assert.ok(seen.size >= minVariants, `${lessonId}/${stepId}: only ${seen.size} different questions in ${SEEDS} seeds`);
}
/** A step that is not generated, in the shape the player sees. */
const fixed = (lessonId, stepId) => {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.ok(raw, `${lessonId} has a step "${stepId}"`);
  return resolveStep(raw, makeRng(1), stepId);
};

/* ---------------------------------------------------------------- helpers */

const D2R = Math.PI / 180;
const sind = (d) => Math.sin(d * D2R);
const cosd = (d) => Math.cos(d * D2R);
const tand = (d) => Math.tan(d * D2R);
const TRIG = { sin: sind, cos: cosd, tan: tand };
const near = (a, b, eps = 1e-9, msg = 'values differ') => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);
const round = (v, places = 1) => Math.round((v + Math.sign(v) * 1e-9) * 10 ** places) / 10 ** places;
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const range = (lo, hi, by = 1) => { const out = []; for (let i = 0; lo + i * by <= hi + 1e-9; i++) out.push(Math.round((lo + i * by) * 1e6) / 1e6); return out; };
const tidy4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return Object.is(r, -0) ? 0 : r; };
const hypot = (p, q) => Math.hypot(q.x - p.x, q.y - p.y);
/** The angle at `v` between the rays to `a` and to `c`, in degrees, from the cross and dot products. */
const angleAt = (a, v, c) => Math.abs(Math.atan2((a.x - v.x) * (c.y - v.y) - (a.y - v.y) * (c.x - v.x), (a.x - v.x) * (c.x - v.x) + (a.y - v.y) * (c.y - v.y))) / D2R;
const polar = (c, radius, deg) => ({ x: c.x + radius * cosd(deg), y: c.y + radius * sind(deg) });

/** Would the player accept this number for a numeric step? (the same rule as the player's numbersMatch) */
function accepts(step, v) {
  const ok = (target) => (step.tolerance != null ? Math.abs(v - target) <= step.tolerance + 1e-12 : Math.abs(v - target) <= 1e-6 * Math.max(1, Math.abs(target)));
  return ok(step.answer) || (step.accept || []).some(ok);
}
const bolds = (text) => Array.from(text.matchAll(/\*\*([^*]+)\*\*/g), (m) => m[1]);
const firstNumber = (text) => { const m = /-?\d+(?:\.\d+)?/.exec(text); assert.ok(m, `"${text}" contains a number`); return Number(m[0]); };
const numbersIn = (text) => (text.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const blank = (step, i) => step.blanks[i].numbers[0];
const correctOption = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, 'exactly one correct option'); return right[0]; };

/** The little tables of trig values printed in a question: { fns: ['sin', …], rows: { 35: { sin: '0.574', … } } } */
function tableIn(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
  assert.ok(lines.length >= 3, 'the text contains a table');
  const cells = (line) => line.split('|').slice(1, -1).map((c) => c.trim());
  const head = cells(lines[0]).map((c) => c.replace(/[$\\]/g, ''));
  assert.equal(head[0], 'angle');
  const rows = {};
  for (const line of lines.slice(2)) {
    const c = cells(line);
    const m = /^(\d+)°$/.exec(c[0]);
    assert.ok(m, `table row "${line}" starts with an angle`);
    rows[Number(m[1])] = Object.fromEntries(head.slice(1).map((fn, i) => [fn, c[i + 1]]));
  }
  // every entry is the true value, correctly rounded to 3 decimals
  for (const [angle, row] of Object.entries(rows)) {
    for (const [fn, cell] of Object.entries(row)) {
      assert.match(cell, /^-?\d+\.\d{3}$/, `table value ${cell} has 3 decimals`);
      near(Number(cell), TRIG[fn](Number(angle)), 0.0005 + 1e-9, `${fn} ${angle}° in the table`);
    }
  }
  return { fns: head.slice(1), rows };
}

/**
 * The right-angled triangle a `trig-triangle` figure draws, solved from its spec:
 * the marked angle and one side. The three sides are cross-checked with Pythagoras.
 */
function rightTriangle(fig) {
  assert.equal(fig.type, 'trig-triangle');
  const fix = fig.fix || 'hyp';
  const t = tand(fig.angle);
  let opp;
  let adj;
  if (fix === 'adj') { adj = fig.size; opp = adj * t; } else if (fix === 'opp') { opp = fig.size; adj = opp / t; } else { adj = fig.size / Math.sqrt(1 + t * t); opp = adj * t; }
  const hyp = Math.sqrt(opp * opp + adj * adj);
  near(hyp * hyp, opp * opp + adj * adj, 1e-9 * hyp * hyp);
  return { opp, adj, hyp };
}
/** The corners of that triangle as drawn (after mirroring and turning): A carries the marked angle, B the right angle. */
function drawnCorners(fig) {
  const t = rightTriangle(fig);
  const place = (p) => {
    let x = fig.flip ? -p.x : p.x;
    let y = p.y;
    for (let i = 0; i < ((fig.turn || 0) / 90) % 4; i++) [x, y] = [-y, x];
    return { x, y };
  };
  return { A: place({ x: 0, y: 0 }), B: place({ x: t.adj, y: 0 }), C: place({ x: t.adj, y: t.opp }) };
}

/** A multiple of π written by the lessons' piTex helper, as a number of π: "\frac{3\pi}{4}" -> 0.75. */
function piMultiple(tex) {
  let m = /^(-?)\\frac\{(\d*)\\pi\}\{(\d+)\}$/.exec(tex.trim());
  if (m) { assert.notEqual(m[2], '1', `"${tex}" does not write 1π`); return (m[1] ? -1 : 1) * (m[2] === '' ? 1 : Number(m[2])) / Number(m[3]); }
  m = /^(-?)(\d*)\\pi$/.exec(tex.trim());
  assert.ok(m, `"${tex}" is a multiple of pi`);
  assert.notEqual(m[2], '1', `"${tex}" does not write 1π`);
  return (m[1] ? -1 : 1) * (m[2] === '' ? 1 : Number(m[2]));
}
/** "3/4" or "2" as [numerator, denominator], which must be in lowest terms. */
function lowestTerms(text) {
  const m = /^(-?\d+)(?:\/(\d+))?$/.exec(text);
  assert.ok(m, `"${text}" is a whole number or a fraction`);
  const n = Number(m[1]);
  const d = m[2] ? Number(m[2]) : 1;
  assert.equal(gcd(n, d), 1, `${text} is in lowest terms`);
  assert.ok(!(m[2] && d === 1), `${text} is not written over 1`);
  return [n, d];
}
/** Where two rays meet: from p at angle a and from q at angle b (degrees, counter-clockwise from east). */
function meet(p, a, q, b) {
  const d1 = { x: cosd(a), y: sind(a) };
  const d2 = { x: cosd(b), y: sind(b) };
  const den = d1.x * d2.y - d1.y * d2.x;
  const t = ((q.x - p.x) * d2.y - (q.y - p.y) * d2.x) / den;
  return { x: p.x + t * d1.x, y: p.y + t * d1.y };
}
/** The smallest shift p = k × unit (k = 1, 2, …) that leaves f unchanged, by brute force. */
function periodOf(f, unit, kMax, samples) {
  for (let k = 1; k <= kMax; k++) if (samples.every((x) => Math.abs(f(x + k * unit) - f(x)) < 1e-7)) return k * unit;
  return null;
}
const extremes = (f, lo, hi, n = 40000) => { let max = -Infinity; let min = Infinity; for (let i = 0; i <= n; i++) { const y = f(lo + ((hi - lo) * i) / n); if (y > max) max = y; if (y < min) min = y; } return { max, min }; };

/* ------------------------------------------- lesson 1: right-triangle ratios */

const L1 = 'right-triangle-ratios';

test('ratios: the side asked for is the side the picture shows in that role', () => {
  const asks = new Set();
  eachVariant(L1, 'which-side', (step) => {
    const fig = step.figures[0];
    const { A, B, C } = drawnCorners(fig);
    near(angleAt(A, B, C), 90, 1e-6, 'the right angle is at B');
    near(angleAt(B, A, C), fig.angle, 1e-6, 'the marked angle is at A');
    assert.equal(fig.plain, true, 'the sides are not colour-coded, which would give the names away');
    // the role of each lettered side, from what it touches in the drawing
    const ends = { [fig.text.opp]: 'BC', [fig.text.adj]: 'AB', [fig.text.hyp]: 'AC' };
    const roleOf = (letter) => (!ends[letter].includes('A') ? 'opposite' : !ends[letter].includes('B') ? 'hypotenuse' : 'adjacent');
    assert.deepEqual(Object.keys(ends).sort(), ['p', 'q', 'r']);
    const asked = /\*\*Which side is (?:the )?(opposite|adjacent|hypotenuse)/.exec(step.text)[1];
    asks.add(asked);
    assert.match(step.text, asked === 'opposite' ? /is opposite the marked angle/ : asked === 'adjacent' ? /is adjacent to the marked angle/ : /is the hypotenuse\?/);
    for (const o of step.options) {
      const letter = /^Side \$([pqr])\$$/.exec(o.text)[1];
      assert.equal(roleOf(letter) === asked, !!o.correct, `option ${o.text}`);
      if (!o.correct) {
        const says = /it is the (opposite side|adjacent side|hypotenuse)/.exec(o.why) || /so it is the (hypotenuse)/.exec(o.why);
        assert.ok(says, `"${o.why}" names the side`);
        assert.equal(says[1].replace(' side', ''), roleOf(letter), `the feedback for side ${letter} names its real role`);
      }
    }
    correctOption(step);
    const told = /Side \$(.)\$ faces the right angle.*Side \$(.)\$ is across from the marked angle.*Side \$(.)\$ joins the marked angle to the right angle/.exec(step.explain);
    assert.deepEqual([roleOf(told[1]), roleOf(told[2]), roleOf(told[3])], ['hypotenuse', 'opposite', 'adjacent']);
  });
  assert.equal(asks.size, 3, 'all three names are asked for');
});

test('ratios: sine, cosine and tangent read from a drawn triangle', () => {
  eachVariant(L1, 'read-ratios', (step) => {
    const fig = step.figures[0];
    const t = rightTriangle(fig);
    const [opp, adj, hyp] = [Number(fig.text.opp), Number(fig.text.adj), Number(fig.text.hyp)];
    assert.equal(opp * opp + adj * adj, hyp * hyp, 'the labelled sides satisfy Pythagoras');
    near(t.opp, opp, 1e-9, 'the triangle is drawn to scale (opposite)');
    near(t.adj, adj, 1e-9, 'the triangle is drawn to scale (adjacent)');
    assert.deepEqual(numbersIn(step.text.split('.')[0]), [Math.min(opp, adj), Math.max(opp, adj), hyp], 'the text lists the same three sides');
    near(blank(step, 0), sind(fig.angle), 1e-12, 'sin θ');
    near(blank(step, 1), cosd(fig.angle), 1e-12, 'cos θ');
    near(blank(step, 2), tand(fig.angle), 1e-12, 'tan θ');
    assert.deepEqual(step.blanks.map((b) => b.answers[0]), [`${opp}/${hyp}`, `${adj}/${hyp}`, `${opp}/${adj}`]);
    assert.ok(fig.angle > 20 && fig.angle < 70, 'not too thin to read');
    assert.ok(step.hints[1].includes(`opposite $= ${opp}$, adjacent $= ${adj}$, hypotenuse $= ${hyp}$`));
  });
});

test('ratios: a height from a slope and a rounded sine', () => {
  eachVariant(L1, 'use-ratio', (step) => {
    const angle = Number(/\*\*(\d+)°\*\*/.exec(step.text)[1]);
    const length = Number(/\*\*(\d+) m\*\*/.exec(step.text)[1]);
    const said = /sine of (\d+)° is (about )?\*\*([\d.]+)\*\*/.exec(step.text);
    assert.equal(Number(said[1]), angle);
    const value = Number(said[3]);
    near(value, sind(angle), 0.005, 'the sine quoted in the text is right to 2 decimals');
    assert.equal(!said[2], Math.abs(value - sind(angle)) < 1e-12, '"about" is used exactly when the value is rounded');
    near(step.answer, length * value, 1e-9);
    assert.ok(accepts(step, length * sind(angle)), 'the calculator value is accepted too');
    assert.ok(step.tolerance <= 0.25, 'but the tolerance stays small');
    for (const [v, why] of step.wrong) {
      assert.ok(!accepts(step, v), `${v} is a wrong answer`);
      if (/divides/.test(why)) { near(v, round(length / value, 1), 1e-9); assert.ok(v > length, 'dividing gives more than the slope itself'); assert.ok(why.includes(`divides ${length} by ${value}`)); }
      if (/That is the length/.test(why)) assert.equal(v, length);
    }
    assert.ok(step.explain.includes(`${length} \\times ${value} = ${step.answer}`));
    // the calculator's sine, rounded to a whole metre or to 1 decimal, is accepted; the cosine, the tangent,
    // dividing, and a calculator in radian mode are not
    for (const v of [Math.round(length * sind(angle)), round(length * sind(angle), 1)]) assert.ok(accepts(step, v), `${v} is accepted (key ${step.answer} ± ${step.tolerance})`);
    for (const v of [length * cosd(angle), length * tand(angle), length / sind(angle), length / cosd(angle), Math.abs(length * Math.sin(angle))]) assert.ok(!accepts(step, v) && !accepts(step, round(v, 1)), `${v} is rejected (key ${step.answer} ± ${step.tolerance})`);
    assert.ok(step.answer < length, 'the height is less than the slope');
  });
});

test('ratios: fixed facts', () => {
  near(round(sind(35), 2), 0.57); near(sind(30), 0.5, 1e-12); near(tand(45), 1, 1e-12);
  assert.equal(fixed(L1, 'tan-45').answer, 1);
  for (const [v, why] of fixed(L1, 'tan-45').wrong) if (/sine of 45°/.test(why)) near(v, sind(45), 0.005);
  // from the other corner: the same two sides
  const co = fixed(L1, 'co-ratio');
  const value = (tex) => { const m = /\\(sin|cos|tan) (\d+)\^\\circ/.exec(tex); return TRIG[m[1]](Number(m[2])); };
  for (const o of co.options) {
    assert.equal(Math.abs(value(o.text) - sind(35)) < 1e-9, !!o.correct, o.text);
    if (!o.correct) { const quoted = /\\approx ([\d.]+)/.exec(o.why); near(Number(quoted[1]), value(o.text), 0.005, `the value quoted for ${o.text}`); }
  }
  assert.equal(co.figures[0].angle, 35); assert.equal(co.figures[0].text.other, '55°'); assert.equal(35 + 55, 90);
  near(round(0.5736, 2), 0.57); near(sind(35), 0.5736, 5e-5);
});

test('ratios: the interactive checks accept exactly the right states', () => {
  const resize = fixed(L1, 'resize');
  for (let n = 1; n <= 8; n++) assert.equal(resize.check({ sizesTried: n }) === true, n >= 3, `${n} sizes tried`);
  assert.equal(resize.check({ sizesTried: new Set([...resize.solution.sizes, resize.solution.size]).size }), true);
  assert.equal(resize.widget.angle, 35);

  const change = fixed(L1, 'change-angle');
  const [lo, hi] = change.widget.angleRange;
  let passes = 0;
  for (const angle of range(lo, hi, change.widget.angleStep)) {
    const said = change.check({ angle, sin: tidy4(sind(angle)) });
    const half = Math.abs(sind(angle) - 0.5) < 1e-9;       // the height is exactly half the ramp
    assert.equal(said === true, half, `${angle}°`);
    if (said === true) { passes++; continue; }
    assert.ok(said.includes(`${round(sind(angle), 2)}`.replace(/^0\./, '0.')), `${angle}°: "${said}" quotes the ratio`);
    if (/more than half/.test(said)) assert.ok(sind(angle) > 0.5);
    if (/less than half/.test(said)) assert.ok(sind(angle) < 0.5);
  }
  assert.equal(passes, 1);
  assert.equal(change.check({ angle: change.solution.angle, sin: tidy4(sind(change.solution.angle)) }), true);

  const label = fixed(L1, 'label-sides');
  const TAGS = ['', 'opposite', 'adjacent', 'hypotenuse'];
  const TRUE = { opp: 'opposite', adj: 'adjacent', hyp: 'hypotenuse' };
  passes = 0;
  for (const opp of TAGS) for (const adj of TAGS) for (const hyp of TAGS) {
    const tags = { opp, adj, hyp };
    const placed = Object.values(tags).filter(Boolean).length;
    const right = Object.keys(tags).filter((k) => tags[k] === TRUE[k]).length;
    const said = label.check({ tags, placed, right });
    assert.equal(said === true, right === 3, JSON.stringify(tags));
    if (said === true) { passes++; continue; }
    if (/Give every side a name/.test(said)) assert.ok(placed < 3);
    else if (/Start with the hypotenuse/.test(said)) assert.ok(placed === 3 && hyp !== 'hypotenuse');
    else { assert.match(said, /The hypotenuse is right/); assert.ok(hyp === 'hypotenuse' && (opp !== 'opposite' || adj !== 'adjacent')); }
  }
  assert.equal(passes, 1);
  assert.equal(label.check({ tags: label.solution.tags, placed: 3, right: 3 }), true);
});

/* ---------------------------------------- lesson 2: finding sides and angles */

const L2 = 'finding-sides-angles';

/** What each story says is known and wanted, read from its wording. */
const STORIES = [
  { when: /ladder \*\*.*long leans against a wall and makes an angle[\s\S]*How high up the wall/, known: 'hyp', want: 'opp' },
  { when: /ladder \*\*.*long leans against a wall and makes an angle[\s\S]*How far is the foot of the ladder from the wall/, known: 'hyp', want: 'adj' },
  { when: /kite flies on a straight string[\s\S]*How high is the kite/, known: 'hyp', want: 'opp' },
  { when: /instrument on the ground \*\*.*from a tower[\s\S]*How tall is the tower/, known: 'adj', want: 'opp' },
  { when: /tree casts a shadow[\s\S]*How tall is the tree/, known: 'adj', want: 'opp' },
  { when: /wire runs from the top of a mast[\s\S]*How long is the wire/, known: 'opp', want: 'hyp' },
  { when: /ladder has to reach a window ledge[\s\S]*How long must the ladder be/, known: 'opp', want: 'hyp' },
  { when: /top of a lighthouse[\s\S]*How far is the boat from the foot of the lighthouse/, known: 'opp', want: 'adj' },
  { when: /foot of a ladder is \*\*.*from a wall[\s\S]*How long is the ladder/, known: 'adj', want: 'hyp' },
];
const RATIO = { 'hyp>opp': ['sin', '*'], 'hyp>adj': ['cos', '*'], 'adj>opp': ['tan', '*'], 'opp>hyp': ['sin', '/'], 'adj>hyp': ['cos', '/'], 'opp>adj': ['tan', '/'] };
const WORDS = { sine: 'sin', cosine: 'cos', tangent: 'tan' };

for (const stepId of ['find-side', 'find-hyp']) {
  test(`sides: ${stepId} is answered by the triangle that is drawn`, () => {
    const kinds = new Set();
    eachVariant(L2, stepId, (step) => {
      const matching = STORIES.filter((s) => s.when.test(step.text));
      assert.equal(matching.length, 1, 'the story is recognised');
      const { known, want } = matching[0];
      kinds.add(`${known}>${want}`);
      const [sizeText, angleText] = bolds(step.text);
      const size = firstNumber(sizeText);
      const angle = Number(/^(\d+)°$/.exec(angleText)[1]);
      assert.match(sizeText, /^[\d.]+ m$/);
      const table = tableIn(step.text);
      assert.deepEqual(Object.keys(table.rows), [String(angle)], 'one row, for the angle in the question');
      assert.deepEqual(table.fns, ['sin', 'cos', 'tan'], 'all three ratios are offered, so the learner has to choose');
      // the picture: same angle, same known side, question mark on the wanted side
      const fig = step.figures[0];
      assert.equal(fig.angle, angle); assert.equal(fig.size, size); assert.equal(fig.fix, known);
      assert.equal(fig.text[want], '?'); assert.equal(fig.text[known], `${size} m`); assert.equal(fig.text.angle, `${angle}°`);
      const exact = rightTriangle(fig)[want];
      // the same answer the long way round, from the ratio and the operation that the roles call for
      const [fn, op] = RATIO[`${known}>${want}`];
      assert.equal(op, stepId === 'find-side' ? '*' : '/');
      near(exact, op === '*' ? size * TRIG[fn](angle) : size / TRIG[fn](angle), 1e-9, 'triangle and ratio agree');
      const tableValue = Number(table.rows[angle][fn]);
      const viaTable = op === '*' ? size * tableValue : size / tableValue;
      assert.equal(step.answer, round(exact, 1), 'the key is the calculator value to 1 decimal');
      assert.equal(step.display, round(exact, 1).toFixed(1));
      for (const v of [exact, round(exact, 1), round(exact, 2), viaTable, round(viaTable, 1), round(viaTable, 2)]) assert.ok(accepts(step, v), `${v} is accepted`);
      assert.ok(step.tolerance <= 0.12, `the tolerance ${step.tolerance} stays small`);
      // a calculator value copied down to 4 decimals is as good as the table's 3
      const fourFigure = Number(TRIG[fn](angle).toFixed(4));
      const viaFour = op === '*' ? size * fourFigure : size / fourFigure;
      for (const v of [viaFour, round(viaFour, 1)]) assert.ok(accepts(step, v), `${v} (from ${fn} = ${fourFigure}) is accepted (key ${step.answer} ± ${step.tolerance})`);
      // the explanation works the answer out with the table value, so that calculation has to give the key
      assert.equal(round(viaTable, 1), step.answer, `the explanation's own arithmetic, ${size} ${op} ${tableValue} = ${viaTable}, rounds to the key`);
      // a calculator left in radian mode gives something else
      for (const f of [Math.sin, Math.cos, Math.tan]) for (const v of [Math.abs(size * f(angle)), Math.abs(size / f(angle))]) assert.ok(!accepts(step, v) && !accepts(step, round(v, 1)), `${v} (radian mode) must not be accepted`);
      // every slip (another ratio, or the other operation) is rejected, rounded or not
      const slips = [];
      for (const f of ['sin', 'cos', 'tan']) for (const o of ['*', '/']) if (f !== fn || o !== op) slips.push([f, o, o === '*' ? size * TRIG[f](angle) : size / TRIG[f](angle)]);
      for (const [f, o, v] of slips) for (const typed of [v, round(v, 1)]) assert.ok(!accepts(step, typed), `${size} ${o} ${f} ${angle}° = ${typed} must not be accepted (answer ${step.answer})`);
      // the feedback for each listed slip describes what was really done
      assert.equal(step.wrong.length, 3);
      for (const [v, why] of step.wrong) {
        const otherOp = /^That (multiplies|divides) ([\d.]+) by ([\d.]+)\./.exec(why);
        const otherFn = /^That uses the (sine|cosine|tangent), which is (opposite|adjacent) ÷ (hypotenuse|adjacent)\./.exec(why);
        assert.ok(otherOp || otherFn, `"${why}" is one of the two kinds of feedback`);
        if (otherOp) {
          assert.equal(otherOp[1], op === '*' ? 'divides' : 'multiplies');
          assert.equal(Number(otherOp[2]), size); assert.equal(otherOp[3], table.rows[angle][fn]);
          near(v, round(op === '*' ? size / TRIG[fn](angle) : size * TRIG[fn](angle), 1), 1e-9);
        } else {
          const f = WORDS[otherFn[1]];
          assert.notEqual(f, fn);
          assert.equal(`${otherFn[2]} ÷ ${otherFn[3]}`, { sin: 'opposite ÷ hypotenuse', cos: 'adjacent ÷ hypotenuse', tan: 'opposite ÷ adjacent' }[f]);
          near(v, round(op === '*' ? size * TRIG[f](angle) : size / TRIG[f](angle), 1), 1e-9);
          const names = { opp: 'opposite side', adj: 'adjacent side', hyp: 'hypotenuse' };
          assert.ok(why.includes(`You know the ${names[known]} and want the ${names[want]}`), why);
        }
      }
      assert.ok(step.hints[1].includes(`\\${fn} ${angle}^\\circ \\approx ${table.rows[angle][fn]}`), 'the hint quotes the right table value');
      assert.ok(step.hints[1].includes(op === '*' ? `\\dfrac{?}{${size}}` : `\\dfrac{${size}}{?}`), 'the hint puts the unknown in the right place');
      assert.ok(step.explain.includes(`\\approx ${step.display}$ m`), 'the explanation ends at the key');
      assert.ok(step.explain.includes(op === '*' ? `${size} \\times ${table.rows[angle][fn]}` : `\\dfrac{${size}}{${table.rows[angle][fn]}}`));
      assert.match(step.text, /Round to 1 decimal place\./);
    });
    assert.ok(kinds.size >= 3, `several kinds of triangle turn up (${[...kinds]})`);
  });
}

test('sides: an angle from two sides, by table or by calculator', () => {
  const used = new Set();
  eachVariant(L2, 'find-angle', (step) => {
    let m;
    let fn;
    let top;
    let bottom;
    if ((m = /ladder \*\*([\d.]+) m\*\* long leans against a wall and reaches \*\*([\d.]+) m\*\* up it/.exec(step.text))) { fn = 'sin'; top = Number(m[2]); bottom = Number(m[1]); }
    else if ((m = /ladder \*\*([\d.]+) m\*\* long leans against a wall\. Its foot is \*\*([\d.]+) m\*\* from the wall/.exec(step.text))) { fn = 'cos'; top = Number(m[2]); bottom = Number(m[1]); }
    else if ((m = /kite is \*\*([\d.]+) m\*\* above the ground, at the end of a straight string \*\*([\d.]+) m\*\* long/.exec(step.text))) { fn = 'sin'; top = Number(m[1]); bottom = Number(m[2]); }
    else if ((m = /roof rises \*\*([\d.]+) m\*\* over a horizontal distance of \*\*([\d.]+) m\*\*/.exec(step.text))) { fn = 'tan'; top = Number(m[1]); bottom = Number(m[2]); }
    assert.ok(fn, 'the story is recognised');
    used.add(fn);
    // the angle, from the third side (Pythagoras) and atan2 rather than from the inverse function the lesson uses
    const opp = fn === 'cos' ? Math.sqrt(bottom * bottom - top * top) : top;
    const adj = fn === 'sin' ? Math.sqrt(bottom * bottom - top * top) : fn === 'cos' ? top : bottom;
    const exact = Math.atan2(opp, adj) / D2R;
    assert.ok(Number.isInteger(step.answer));
    near(exact, step.answer, 0.25, 'the angle is close to a whole number of degrees, so every method rounds the same way');
    assert.equal(step.tolerance, 0.5);
    for (const v of [exact, round(exact, 1), round(exact, 2), step.answer]) assert.ok(accepts(step, v), `${v}° is accepted`);
    // by table: the closest entry in the right column is the answer, and it is in the table
    const table = tableIn(step.text);
    const angles = Object.keys(table.rows).map(Number);
    assert.equal(angles.length, 4);
    assert.deepEqual(angles, range(angles[0], angles[0] + 3), 'four consecutive angles');
    const ratio = top / bottom;
    const byGap = angles.slice().sort((p, q) => Math.abs(Number(table.rows[p][fn]) - ratio) - Math.abs(Number(table.rows[q][fn]) - ratio));
    assert.equal(byGap[0], step.answer, 'the nearest table value belongs to the answer');
    assert.ok(Math.abs(Number(table.rows[byGap[1]][fn]) - ratio) > Math.abs(Number(table.rows[byGap[0]][fn]) - ratio) + 0.002, 'and no other row is nearly as close');
    // the picture is to scale and carries the same numbers
    const fig = step.figures[0];
    near(fig.angle, exact, 1e-9, 'the picture is drawn to scale');
    const drawn = rightTriangle(fig);
    near(fn === 'cos' ? drawn.adj : drawn.opp, top, 1e-9); near(fn === 'tan' ? drawn.adj : drawn.hyp, bottom, 1e-9);
    assert.equal(fig.text.angle, '?');
    assert.equal(fig.text[fn === 'cos' ? 'adj' : 'opp'], `${top} m`); assert.equal(fig.text[fn === 'tan' ? 'adj' : 'hyp'], `${bottom} m`);
    // the other acute angle is what the classic slips give, and it is not accepted
    assert.equal(step.wrong.length, 1);
    assert.equal(step.wrong[0][0], 90 - step.answer);
    assert.ok(!accepts(step, 90 - exact) && !accepts(step, 90 - step.answer));
    assert.ok(Math.abs(90 - 2 * step.answer) > 4, 'the two acute angles are clearly different');
    assert.ok(step.hints[1].includes(`\\${fn}\\theta = \\dfrac{${top}}{${bottom}} \\approx ${ratio.toFixed(3)}`));
    // what the explanation says a calculator gives is true of the number it puts in the brackets,
    // and that number agrees with the answer
    const quoted = /\^\{-1\}\(([\d.]+)\) \\approx ([\d.]+)\^\\circ/.exec(step.explain);
    assert.ok(step.explain.includes(`belongs to ${step.answer}°`) && quoted, step.explain);
    assert.equal(quoted[1], ratio.toFixed(3));
    const keyed = { sin: Math.asin, cos: Math.acos, tan: Math.atan }[fn](Number(quoted[1])) / D2R;
    assert.equal(Number(quoted[2]), round(keyed, 1), `${fn}⁻¹(${quoted[1]}) is ${keyed}°, not ${quoted[2]}°`);
    assert.equal(Math.round(Number(quoted[2])), step.answer, 'the calculator value rounds to the answer');
    // other inverse functions and the fraction upside down never land on the answer
    for (const inverse of [Math.asin, Math.acos, Math.atan]) for (const x of [ratio, 1 / ratio]) {
      const v = inverse(x) / D2R;
      if (!Number.isFinite(v) || Math.abs(v - exact) < 1e-9) continue;
      assert.ok(!accepts(step, v) && !accepts(step, Math.round(v)), `${v}° (a wrong inverse, or the fraction upside down) must not be accepted`);
    }
    assert.ok(!accepts(step, exact * D2R), 'the angle in radians is not accepted');
  });
  assert.deepEqual([...used].sort(), ['cos', 'sin', 'tan']);
});

test('sides: a height measured from eye level', () => {
  eachVariant(L2, 'eye-height', (step) => {
    const m = /stand \*\*(\d+) m\*\* from a ([a-z ]+) and look up at its top\. Your line of sight is \*\*(\d+)°\*\* above the horizontal, and your eyes are \*\*([\d.]+) m\*\* above the ground/.exec(step.text);
    assert.ok(m, 'the story is recognised');
    const [d, angle, eye] = [Number(m[1]), Number(m[3]), Number(m[4])];
    assert.ok(step.text.includes(`**How tall is the ${m[2]}?**`));
    const table = tableIn(step.text);
    const tableTan = Number(table.rows[angle].tan);
    const fig = step.figures[0];
    assert.deepEqual([fig.angle, fig.size, fig.fix, fig.eye], [angle, d, 'adj', eye]);
    assert.equal(fig.text.total, '?'); assert.equal(fig.text.eye, `${eye} m`); assert.equal(fig.text.adj, `${d} m`);
    const above = rightTriangle(fig).opp;
    const exact = above + eye;
    assert.equal(step.answer, round(exact, 1));
    // rounding half-way through, table or calculator: all accepted
    for (const v of [exact, round(exact, 1), d * tableTan + eye, round(d * tableTan + eye, 1), round(above, 1) + eye, round(d * tableTan, 1) + eye, round(above, 2) + eye]) assert.ok(accepts(step, v), `${v} is accepted (key ${step.answer} ± ${step.tolerance})`);
    assert.ok(step.tolerance <= 0.2);
    for (const v of [above, round(above, 1), d * tableTan, exact + eye, d / tand(angle) + eye, d * sind(angle) + eye]) assert.ok(!accepts(step, v), `${v} is rejected`);
    const [[forgot, whyForgot], [divided]] = step.wrong;
    near(forgot, round(above, 1), 1e-9); assert.ok(whyForgot.includes(`${eye} m above the ground`));
    near(divided, round(d / tand(angle) + eye, 1), 1e-9);
    assert.ok(step.explain.includes(`${d} \\times ${table.rows[angle].tan} \\approx ${String(round(above, 1))}$ m`) && step.explain.includes(`**${step.display} m**`));
    // … and that product, which the hint quotes as well, really is what it is said to be
    assert.equal(round(d * tableTan, 1), round(above, 1), `${d} × ${tableTan} = ${d * tableTan} rounds to the height quoted`);
    assert.ok(step.hints[1].includes(`${d} \\times ${table.rows[angle].tan} \\approx ${String(round(above, 1))}$ m`));
    near(round(above, 1) + eye, step.answer, 1e-9, 'the height above eye level plus the eye height is the key');
    for (const v of [d * sind(angle) + eye, d * cosd(angle) + eye, (d + eye) * tand(angle), above - eye, Math.abs(d * Math.tan(angle)) + eye]) assert.ok(!accepts(step, v) && !accepts(step, round(v, 1)), `${v} is rejected`);
  });
});

test('sides: fixed facts', () => {
  // the tree of the opening question
  const hook = fixed(L2, 'hook');
  const tree = rightTriangle(hook.figures[0]).opp;
  near(tree, 20 * tand(40), 1e-9); near(round(tree, 1), 16.8);
  assert.ok(Math.abs(hook.answer - tree) <= hook.tolerance, 'the slider accepts the true height');
  assert.ok(/\*\*20 m\*\*/.test(hook.text) && /\*\*40°\*\*/.test(hook.text));
  const solve = fixed(L2, 'solve-tree');
  assert.equal(solve.blanks[0].answer, 'multiply');
  for (const v of [20 * 0.839, tree, 16.8]) assert.ok(Math.abs(v - blank(solve, 1)) <= solve.tolerance, `${v} is accepted`);
  near(round(tand(40), 3), 0.839);
  // the flagpole: the angle found by aiming is the one used in the next question
  const aim = fixed(L2, 'aim');
  const pole = fixed(L2, 'pole-height');
  near(aim.widget.sceneHeight, 30 * tand(35), 1e-9);
  const height = rightTriangle(pole.figures[0]).opp;
  assert.equal(pole.answer, round(height, 1)); assert.equal(pole.display, '21.0');
  for (const v of [height, 30 * 0.7, 21]) assert.ok(accepts(pole, v));
  const row = tableIn(pole.text).rows[35];
  assert.deepEqual(pole.wrong.map(([v]) => v), [round(30 * Number(row.sin), 1), round(30 * Number(row.cos), 1), round(30 / Number(row.tan), 1)]);
  for (const [v] of pole.wrong) assert.ok(!accepts(pole, v));
  // inverse functions
  near(Math.atan(0.75) / D2R, 36.87, 0.005); near(Math.asin(0.5) / D2R, 30, 1e-9);
  // which ratio does each job
  const tool = fixed(L2, 'which-tool');
  assert.deepEqual(tool.buckets, ['sine', 'cosine', 'tangent']);
  for (const item of tool.items) {
    const sides = ['opposite', 'adjacent', 'hypotenuse'].filter((s) => item.text.includes(s));
    const pair = /both shorter sides/.test(item.text) ? 'adjacent+opposite' : sides.sort().join('+');
    assert.equal(item.bucket, { 'hypotenuse+opposite': 0, 'adjacent+hypotenuse': 1, 'adjacent+opposite': 2 }[pair], item.text);
  }
});

test('sides: the interactive checks accept exactly the right states', () => {
  const aim = fixed(L2, 'aim');
  const [lo, hi] = aim.widget.angleRange;
  assert.equal(aim.widget.fix, 'adj'); assert.equal(aim.widget.size, 30);
  let passes = 0;
  for (const angle of range(lo, hi, aim.widget.angleStep)) {
    const gap = tidy4(aim.widget.size * tand(angle) - aim.widget.sceneHeight);
    const said = aim.check({ angle, gap });
    assert.equal(said === true, Math.abs(gap) < 1e-6, `${angle}°`);
    if (said === true) { passes++; continue; }
    if (/below its top/.test(said)) assert.ok(gap < 0); else { assert.match(said, /passes above/); assert.ok(gap > 0); }
  }
  assert.equal(passes, 1);
  assert.equal(aim.check({ angle: aim.solution.angle, gap: 0 }), true);

  const search = fixed(L2, 'angle-search');
  const [lo2, hi2] = search.widget.angleRange;
  assert.equal(search.widget.fix, 'adj'); assert.equal(search.widget.size, 4);
  passes = 0;
  for (const angle of range(lo2, hi2, search.widget.angleStep)) {
    const said = search.check({ angle, tan: tidy4(tand(angle)) });
    assert.equal(said === true, round(tand(angle), 2) === 0.75, `${angle}°: the readout shows ${round(tand(angle), 2)}`);
    if (said === true) { passes++; continue; }
    assert.ok(said.includes(String(round(tand(angle), 2))), said);
    if (/too steep/.test(said)) assert.ok(tand(angle) > 0.75); else { assert.match(said, /not steep enough/); assert.ok(tand(angle) < 0.75); }
  }
  assert.equal(passes, 1);
  assert.equal(search.check({ angle: search.solution.angle, tan: tidy4(tand(search.solution.angle)) }), true);
  near(search.solution.angle, Math.atan(3 / 4) / D2R, 0.5);
});

/* ------------------------------------------------- lesson 3: the unit circle */

const L3 = 'unit-circle';

test('circle: the signs of cosine and sine in each quarter', () => {
  const quarters = new Set();
  eachVariant(L3, 'signs', (step) => {
    const deg = Number(/\\theta = (\d+)\^\\circ/.exec(step.text)[1]);
    assert.ok(deg % 90 !== 0, 'not on an axis');
    quarters.add(Math.floor(deg / 90));
    for (const o of step.options) {
      const m = /\\cos\\theta ([<>]) 0\$ and \$\\sin\\theta ([<>]) 0/.exec(o.text);
      const fits = (cosd(deg) > 0) === (m[1] === '>') && (sind(deg) > 0) === (m[2] === '>');
      assert.equal(fits, !!o.correct, `${o.text} at ${deg}°`);
      if (o.correct) continue;
      // "That is how it is between lo° and hi°, where the point is …. At deg° the point is …."
      const w = /between (\d+)° and (\d+)°, where the point is to the (left|right) of the centre and (above|below) it\. At (\d+)° the point is to the (left|right) of the centre and (above|below) it\./.exec(o.why);
      assert.ok(w, o.why);
      const mid = (Number(w[1]) + Number(w[2])) / 2;
      assert.ok((cosd(mid) > 0) === (m[1] === '>') && (sind(mid) > 0) === (m[2] === '>'), 'the quarter named has those signs');
      assert.equal(cosd(mid) > 0 ? 'right' : 'left', w[3]); assert.equal(sind(mid) > 0 ? 'above' : 'below', w[4]);
      assert.equal(Number(w[5]), deg);
      assert.equal(cosd(deg) > 0 ? 'right' : 'left', w[6]); assert.equal(sind(deg) > 0 ? 'above' : 'below', w[7]);
    }
    correctOption(step);
    const e = /(\d+)° lies between (\d+)° and (\d+)°.*\$x\$-coordinate is (positive|negative) and its \$y\$-coordinate is (positive|negative)/.exec(step.explain);
    assert.ok(Number(e[2]) < deg && deg < Number(e[3]) && Number(e[3]) - Number(e[2]) === 90);
    assert.equal(e[4], cosd(deg) > 0 ? 'positive' : 'negative'); assert.equal(e[5], sind(deg) > 0 ? 'positive' : 'negative');
  });
  assert.equal(quarters.size, 4);
});

/** The exact values offered as options: "\dfrac{\sqrt{3}}{2}" -> 0.866… */
const exactValue = (tex) => {
  const m = /\\d?frac\{(?:(1)|\\sqrt\{(\d)\})\}\{2\}/.exec(tex);
  assert.ok(m, `"${tex}" is one of the exact values`);
  return (m[1] ? 1 : Math.sqrt(Number(m[2]))) / 2;
};

test('circle: exact values at 30°, 45° and 60°', () => {
  eachVariant(L3, 'exact', (step) => {
    const q = /\\(sin|cos) (\d+)\^\\circ/.exec(step.text);
    const truth = TRIG[q[1]](Number(q[2]));
    for (const o of step.options) {
      const v = exactValue(o.text);
      assert.equal(Math.abs(v - truth) < 1e-12, !!o.correct, o.text);
      if (o.correct) continue;
      // whatever the feedback says this value is the sine or cosine of, it is
      const claims = Array.from(o.why.matchAll(/\\(sin|cos) (\d+)\^\\circ/g));
      for (const c of claims) near(TRIG[c[1]](Number(c[2])), v, 1e-12, `${o.why}`);
      if (!claims.length) { assert.match(o.why, /belongs to 45°/); near(sind(45), v, 1e-12); near(cosd(45), v, 1e-12); }
      near(exactValue(o.why), v, 1e-12, 'the feedback is about the option it belongs to');
    }
    correctOption(step);
    const end = /So \$\\(sin|cos) (\d+)\^\\circ = (.+)\$\.$/.exec(step.explain);
    assert.deepEqual([end[1], end[2]], [q[1], q[2]]);
    near(exactValue(end[3]), truth, 1e-12);
    // the triangle named in the explanation really gives that ratio
    const half = /side (opposite|adjacent to) the (\d+)° angle is (1|\$\\sqrt\{3\}\$), and the hypotenuse is 2/.exec(step.explain);
    if (half) {
      assert.equal(half[1] === 'opposite' ? 'sin' : 'cos', q[1]);
      near((half[3] === '1' ? 1 : Math.sqrt(3)) / 2, truth, 1e-12);
    } else assert.match(step.explain, /half a square/);
  });
});

test('circle: the other coordinate from sin²θ + cos²θ = 1', () => {
  const signs = new Set();
  eachVariant(L3, 'other-coordinate', (step) => {
    const [lo, hi] = /between (\d+)° and (\d+)°/.exec(step.text).slice(1).map(Number);
    const [n, d] = /\\sin\\theta = \\dfrac\{(\d+)\}\{(\d+)\}/.exec(step.text).slice(1).map(Number);
    // find the angle itself by bisection (the sine is monotonic on each quarter), then read off its cosine
    let a = lo;
    let b = hi;
    const rising = sind(lo) < sind(hi);
    for (let i = 0; i < 80; i++) { const mid = (a + b) / 2; if ((sind(mid) < n / d) === rising) a = mid; else b = mid; }
    const cosine = cosd((a + b) / 2);
    near(step.answer, cosine, 1e-9, 'the key is the cosine of that angle');
    near(step.answer ** 2 + (n / d) ** 2, 1, 1e-12);
    signs.add(Math.sign(step.answer));
    const [top, bottom] = /^(-?\d+)\/(\d+)$/.exec(step.display).slice(1).map(Number);
    near(top / bottom, step.answer, 1e-12, 'the answer shown is the key');
    assert.equal(gcd(top, bottom), 1);
    for (const [v, why] of step.wrong) {
      assert.ok(!accepts(step, v), `${v} is wrong`);
      if (/The size is right/.test(why)) { near(v, -step.answer, 1e-12); assert.match(why, hi === 180 ? /left of the y-axis, so the cosine is negative/ : /right of the y-axis, so the cosine is positive/); }
      if (/is not 1/.test(why)) near(v + n / d, 1, 1e-12);
      if (/the sine again/.test(why)) near(v, n / d, 1e-12);
    }
    // the square root forgotten, the square root of 1 − sin θ, or the sine squared: none is accepted
    for (const v of [1 - (n / d) ** 2, Math.sqrt(1 - n / d), (n / d) ** 2, -(1 - (n / d) ** 2)]) assert.ok(!accepts(step, v) && !accepts(step, round(v, 2)) && !accepts(step, round(v, 3)), `${v} is wrong (key ${step.answer})`);
    // typed as a decimal to 3 places, the answer is accepted as well
    assert.ok(accepts(step, round(cosine, 3)) && accepts(step, round(cosine, 4)));
    const quoted = Array.from(step.hints[0].matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g), (f) => Number(f[1]) / Number(f[2]));
    near(quoted[quoted.length - 1], 1 - (n / d) ** 2, 1e-12, 'cos²θ in the hint');
    assert.ok(step.explain.includes(`\\cos\\theta = ${step.answer < 0 ? '-' : ''}\\frac{${Math.abs(top)}}{${bottom}}$`));
    assert.ok(Math.abs(step.answer) > 0.2 && Math.abs(step.answer) < 0.98);
  });
  assert.equal(signs.size, 2, 'both quarters are used');
});

test('circle: mirror images across the y-axis', () => {
  eachVariant(L3, 'mirror', (step) => {
    const m = /point at (\d+)° is the mirror image, in the \$y\$-axis, of the point at (\d+)°\. \*\*Which of these is equal to \$\\(sin|cos) (\d+)\^\\circ\$/.exec(step.text);
    const [big, small, fn] = [Number(m[1]), Number(m[2]), m[3]];
    assert.equal(Number(m[4]), big); assert.equal(big + small, 180);
    near(cosd(big), -cosd(small), 1e-12, 'mirror image: opposite x'); near(sind(big), sind(small), 1e-12, 'mirror image: same height');
    const truth = TRIG[fn](big);
    for (const o of step.options) {
      const p = /^\$(-?)\\(sin|cos) (\d+)\^\\circ\$$/.exec(o.text);
      const v = (p[1] ? -1 : 1) * TRIG[p[2]](Number(p[3]));
      assert.equal(Math.abs(v - truth) < 1e-9, !!o.correct, o.text);
      if (o.correct) continue;
      assert.ok(o.why, `${o.text} explains itself`);
      if (/so its sine is positive/.test(o.why)) assert.ok(sind(big) > 0 && v < 0);
      if (/so its cosine is negative/.test(o.why)) assert.ok(cosd(big) < 0 && v > 0);
      if (/That is the cosine of \d+°/.test(o.why)) near(v, cosd(firstNumber(o.why)), 1e-12);
      if (/That is the sine of \d+°/.test(o.why)) near(v, sind(firstNumber(o.why)), 1e-12);
      if (/x-coordinate of the point at \d+°/.test(o.why)) near(v, cosd(firstNumber(o.why)), 1e-12);
    }
    correctOption(step);
  });
});

test('circle: fixed facts', () => {
  // the wheel question: the dot is as high at 150° as at 30°
  near(sind(150), 0.5, 1e-12); near(sind(30), 0.5, 1e-12); near(cosd(150), -cosd(30), 1e-12); near(round(cosd(150), 3), -0.866);
  assert.match(correctOption(fixed(L3, 'hook')).text, /^0\.5 m/);
  near(round(sind(35), 3), 0.574); near(round(cosd(35), 3), 0.819);
  const axis = fixed(L3, 'axis');
  assert.deepEqual(axis.blanks.map((b) => b.numbers[0]), [sind(90), cosd(90), cosd(180), sind(270)].map((v) => Math.round(v)));
  const sq = fixed(L3, 'half-square');
  assert.equal(blank(sq, 0), 1 ** 2 + 1 ** 2); near(blank(sq, 1), sind(45), sq.tolerance); near(1 / 1.414, blank(sq, 1), sq.tolerance); near(Math.SQRT2 / 2, 1 / Math.SQRT2, 1e-12);
  const tri = fixed(L3, 'half-triangle');
  assert.equal(blank(tri, 0), 2 ** 2 - 1 ** 2); near(blank(tri, 1), sind(30), 1e-12); near(blank(tri, 2), sind(60), tri.tolerance); near(1.732 / 2, blank(tri, 2), tri.tolerance);
  [0, 30, 45, 60, 90].forEach((deg, n) => near(sind(deg), Math.sqrt(n) / 2, 1e-12, `sin ${deg}° = √${n}/2`));
  for (const deg of range(0, 360, 5)) near(cosd(deg) ** 2 + sind(deg) ** 2, 1, 1e-12);
  assert.equal(fixed(L3, 'identity').answer, 1);
  // what the learner adds up there: the two squares as the widget shows them (3 decimals, from coordinates
  // kept to 4) come to exactly 1 at every position the point can snap to
  const identity = fixed(L3, 'identity').figures[0];
  assert.deepEqual(identity.readouts, ['angle', 'cos2', 'sin2']);
  for (const deg of range(0, 360, identity.step)) {
    const shown = [tidy4(cosd(deg)), tidy4(sind(deg))].map((v) => Math.round(v * v * 1000) / 1000);
    assert.equal(Math.round((shown[0] + shown[1]) * 1000) / 1000, 1, `${deg}°: ${shown[0]} + ${shown[1]}`);
  }
  near(cosd(240), -0.5, 1e-12); near(sind(240), -Math.sqrt(3) / 2, 1e-12); assert.equal(180 + 60, 240);
});

test('circle: the interactive checks accept exactly the right states', () => {
  const state = (deg) => ({ deg, cos: tidy4(cosd(deg)), sin: tidy4(sind(deg)) });
  const past = fixed(L3, 'past-90');
  let passes = 0;
  for (const deg of range(0, 360, past.widget.step)) {
    const said = past.check(state(deg));
    const wanted = deg > 90 && deg < 180 && Math.abs(sind(deg) - 0.5) < 1e-9;
    assert.equal(said === true, wanted, `${deg}°`);
    if (said === true) { passes++; continue; }
    if (/already knew/.test(said)) assert.equal(deg, 30);
    else if (/Stay between/.test(said)) assert.ok(deg < 90 || deg > 180);
    else {
      assert.ok(deg >= 90 && deg <= 180 && said.includes(`At ${deg}° the sine is ${tidy4(Math.round(sind(deg) * 1000) / 1000)}`), said);
      if (/too high\. Keep turning/.test(said)) assert.ok(sind(deg) > 0.5 && deg < 150); else { assert.match(said, /too low\. Turn back/); assert.ok(sind(deg) < 0.5 && deg > 150); }
    }
  }
  assert.equal(passes, 1);
  assert.equal(past.check(state(past.solution.deg)), true);

  const hunt = fixed(L3, 'find-240');
  passes = 0;
  for (const deg of range(0, 360, hunt.widget.step)) {
    const said = hunt.check(state(deg));
    const wanted = Math.abs(cosd(deg) + 0.5) < 1e-9 && sind(deg) < 0;
    assert.equal(said === true, wanted, `${deg}°`);
    if (said === true) { passes++; continue; }
    if (/The cosine is −1\/2 here, but/.test(said)) assert.ok(Math.abs(cosd(deg) + 0.5) < 1e-9 && sind(deg) > 0);
    else if (/Here the cosine is \+1\/2/.test(said)) near(cosd(deg), 0.5, 1e-9);
    else if (/For a negative cosine/.test(said)) assert.ok(cosd(deg) > -1e-9);
    else if (/For a negative sine/.test(said)) assert.ok(sind(deg) > -1e-9 && cosd(deg) < 0);
    else { assert.match(said, /Right quarter/); assert.ok(cosd(deg) < 0 && sind(deg) < 0 && said.includes(String(tidy4(Math.round(cosd(deg) * 1000) / 1000)))); }
  }
  assert.equal(passes, 1);
  assert.equal(hunt.check(state(hunt.solution.deg)), true);
});

/* ----------------------------------------------------------- lesson 4: radians */

const L4 = 'radians';

test('radians: degrees to a fraction of π', () => {
  eachVariant(L4, 'deg-to-rad', (step) => {
    const deg = Number(/\*\*(\d+)°\*\*/.exec(step.text)[1]);
    near(blank(step, 0) * Math.PI, (deg / 360) * 2 * Math.PI, 1e-12, 'the fraction of π is the same fraction of a half turn');
    const [n, d] = lowestTerms(step.blanks[0].answers[0]);
    assert.equal(n * 180, deg * d);
    assert.ok(step.template.startsWith(`$${deg}^\\circ =$`));
    const shown = /= ([^=$]+)\$ radians/.exec(step.explain);
    near(piMultiple(shown[1]), deg / 180, 1e-12, 'the radians quoted in the explanation');
    const g = Number(/can both be divided by (\d+)/.exec(step.hints[1])[1]);
    assert.ok(deg % g === 0 && 180 % g === 0 && gcd(deg / g, 180 / g) === 1, `${g} is the largest common divisor`);
  });
});

test('radians: radians to degrees', () => {
  let kinds = 0;
  eachVariant(L4, 'rad-to-deg', (step) => {
    const frac = /^Convert \$(.+)\$ radians to degrees\.$/.exec(step.text);
    if (frac) {
      kinds |= 1;
      const multiple = piMultiple(frac[1]);
      const deg = (multiple * 2 * Math.PI) / (2 * Math.PI) * 180;
      near(step.answer, deg, 1e-9);
      assert.ok(Number.isInteger(step.answer) && step.answer > 0 && step.answer < 360);
      assert.ok(step.explain.endsWith(`= ${step.answer}^\\circ$.`));
      assert.equal(typeof step.feedback(multiple * Math.PI), 'string', 'typing the angle as a decimal number of radians gets a comment');
      assert.equal(step.feedback(step.answer + 7), null);
      return;
    }
    kinds |= 2;
    const m = /^Convert \*\*([\d.]+) (radians?)\*\* to degrees\. Round to the nearest degree\./.exec(step.text);
    assert.ok(m, 'the question is recognised');
    const rad = Number(m[1]);
    assert.equal(m[2], rad === 1 ? 'radian' : 'radians');
    const exact = (rad / (2 * Math.PI)) * 360;
    assert.equal(step.answer, Math.round(exact));
    for (const v of [exact, round(exact, 1), (rad * 180) / 3.1416, (rad * 180) / 3.14, Math.round((rad * 180) / 3.14)]) assert.ok(accepts(step, v), `${v} is accepted`);
    assert.ok(!accepts(step, rad * D2R) && !accepts(step, exact + 1.2));
    assert.equal(typeof step.feedback(rad * D2R), 'string'); assert.equal(step.feedback(exact + 3), null);
    near(180 / Math.PI, 57.3, 0.05, 'one radian is about 57°');
    assert.ok(step.explain.includes(`${round(exact, 2)}^\\circ`));
  });
  assert.equal(kinds, 3, 'both kinds of question turn up');
});

test('radians: arc length is radius × angle', () => {
  eachVariant(L4, 'arc-length', (step) => {
    const [first, second] = bolds(step.text);
    const r = firstNumber(first);
    const unit = /([a-z]+)$/.exec(first)[1];
    const m = /^([\d.]+) (radians?)$/.exec(second);
    assert.ok(m, `"${second}" is an angle in radians`);
    const angle = Number(m[1]);
    assert.equal(m[2], angle === 1 ? 'radian' : 'radians');
    // as a fraction of the whole circumference, rather than as r × θ
    near(step.answer, (angle / (2 * Math.PI)) * 2 * Math.PI * r, 1e-9);
    assert.equal(step.unit, unit);
    for (const [v] of step.wrong) assert.ok(!accepts(step, v) && Math.abs(v - step.answer) > 0.02);
    // the angle is in radians already: converting it again, either way, gives something else, and so do the other slips
    for (const v of [r * angle * D2R, (r * angle) / D2R, 2 * Math.PI * r * angle, (r * angle) / 2, r + angle]) assert.ok(!accepts(step, v), `${v} is rejected (key ${step.answer})`);
    assert.ok(step.explain.includes(`= ${r} \\times ${angle} = ${step.answer}$ ${unit}`), step.explain);
    assert.ok(angle < 2 * Math.PI || /wheel/.test(step.text), 'only a wheel turns more than once');
  });
});

test('radians: arc length when the angle is given in degrees', () => {
  eachVariant(L4, 'arc-degrees', (step) => {
    const [first, second] = bolds(step.text);
    const r = firstNumber(first);
    const deg = Number(/^(\d+)°$/.exec(second)[1]);
    const places = /Round to 1 decimal place\./.test(step.text) ? 1 : 0;
    if (!places) assert.match(step.text, /Round to the nearest metre\./);
    const exact = (deg / 360) * 2 * Math.PI * r;
    assert.equal(step.answer, round(exact, places));
    assert.equal(step.display, round(exact, places).toFixed(places));
    const with314 = (deg / 360) * 2 * 3.14 * r;
    const viaAngle = r * round(deg * D2R, 3);
    for (const v of [exact, round(exact, 1), with314, round(with314, places), viaAngle, round(viaAngle, places)]) assert.ok(accepts(step, v), `${v} is accepted (key ${step.answer} ± ${step.tolerance})`);
    // other honest routes: π as 3.142 or 3.1416, π as 3.14 with the angle then rounded to 3 decimals,
    // or the right fraction of the whole circumference (rounded to 1 decimal on the way)
    const routes = [(deg / 180) * 3.142 * r, (deg / 180) * 3.1416 * r, r * round((deg * 3.14) / 180, 3), (round(2 * Math.PI * r, 1) * deg) / 360, (2 * 3.14 * r * deg) / 360];
    for (const v of routes) for (const typed of [v, round(v, places)]) assert.ok(accepts(step, typed), `${typed} is accepted (key ${step.answer} ± ${step.tolerance})`);
    assert.ok(step.tolerance / step.answer < 0.015, 'the tolerance is small next to the answer');
    assert.ok(!accepts(step, r * deg) && !accepts(step, exact * 1.05) && !accepts(step, exact * 0.95));
    // the slips: π forgotten, the angle halved or doubled, the diameter for the radius, the sector's area, the whole circumference
    for (const v of [(r * deg) / 180, exact / 2, exact * 2, (deg / 360) * Math.PI * r * r, 2 * Math.PI * r, r / (deg * D2R), r]) assert.ok(!accepts(step, v) && !accepts(step, round(v, places)), `${v} is rejected`);
    assert.equal(step.wrong[0][0], r * deg);
    const hint = /\$(\d+)\^\\circ = (.+) \\approx ([\d.]+)\$ radians/.exec(step.hints[1]);
    assert.equal(Number(hint[1]), deg); near(piMultiple(hint[2]) * Math.PI, deg * D2R, 1e-12); near(Number(hint[3]), deg * D2R, 0.0005);
    assert.ok(step.explain.includes(`\\approx ${step.display}$ ${step.unit}`));
  });
});

test('radians: fixed facts', () => {
  near(180 / Math.PI, 57.3, 0.005);
  assert.ok(Math.abs(fixed(L4, 'hook').answer - 180 / Math.PI) <= fixed(L4, 'hook').tolerance);
  near(2 * Math.asin(0.5) / D2R, 60, 1e-9, 'a chord as long as the radius spans 60°');
  const turns = fixed(L4, 'turns');
  near(blank(turns, 0), Math.PI, turns.tolerance); assert.equal(blank(turns, 1), 2); near(blank(turns, 2), Math.PI / 2, turns.tolerance);
  near(2 * Math.PI, 6.283, 0.0005);
  // the worked conversions on the two teaching screens (their numbers are pinned in "worked examples" below)
  near(80 * D2R, (4 * Math.PI) / 9, 1e-12); near(((4 * Math.PI) / 5) / D2R, 144, 1e-9); near(4 / D2R, 229.2, 0.05);
  near(Math.sin(30), -0.988, 0.0005); near(sind(1), 0.01745, 5e-6); near(Math.sin(0.1), 0.0998, 5e-5); near(Math.sin(0.2), 0.1987, 5e-5);
  // small angles: sin x is close to x and to nothing else on offer
  const why = fixed(L4, 'why-radians');
  assert.match(correctOption(why).text, /^\$x\$ itself$/);
  for (const x of [0.05, 0.1, 0.2]) { assert.ok(Math.abs(Math.sin(x) - x) < 0.002); assert.ok(Math.abs(Math.sin(x) - x * x) > 0.04); assert.ok(Math.abs(Math.sin(x) - x / 2) > 0.02); }
  // the angles to be put in order really are in order
  const inDegrees = (item) => {
    if (/°/.test(item)) return firstNumber(item);
    if (/\\pi/.test(item)) return piMultiple(/\$(.+)\$/.exec(item)[1].replace('\\dfrac', '\\frac')) * 180;
    return firstNumber(item) / D2R;
  };
  const order = fixed(L4, 'order').items.map(inDegrees);
  assert.deepEqual(order, order.slice().sort((a, b) => a - b));
  assert.equal(new Set(order).size, order.length);
  assert.deepEqual(order.map((v) => round(v, 1)), [45, 57.3, 90, 100, 180]);
});

test('radians: the interactive checks accept exactly the right states', () => {
  // every arc the dial can show: tenths of a radius-length, with the quarter turns snapped exactly
  const arcs = [...range(0, 6.2, 0.1), Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI];
  const state = (arc, sizesTried = 1) => ({ arc: tidy4(arc), rad: tidy4(arc), deg: Math.round((arc / D2R) * 10) / 10, full: arc >= 2 * Math.PI - 1e-9, sizesTried });
  const wrap = fixed(L4, 'wrap');
  for (const arc of arcs) for (const tried of [1, 2, 3, 5]) {
    const said = wrap.check(state(arc, tried));
    assert.equal(said === true, Math.abs(arc - 1) < 1e-9 && tried >= 2, `arc ${arc}, ${tried} sizes`);
    if (said === true) continue;
    if (/Make it exactly 1/.test(said)) assert.ok(Math.abs(arc - 1) > 1e-9 && said.includes(`${round(arc, 2)} radius-lengths`)); else { assert.match(said, /size of the circle/); assert.ok(tried < 2); }
  }
  assert.equal(wrap.check(state(wrap.solution.arc, new Set([...wrap.solution.sizes, wrap.solution.r]).size)), true);

  const full = fixed(L4, 'full-turn');
  for (const arc of arcs) {
    const said = full.check(state(arc));
    assert.equal(said === true, Math.abs(arc - 2 * Math.PI) < 1e-9, `arc ${arc}`);
    if (said !== true) assert.ok(said.includes(`${state(arc).deg}°`));
  }
  near(full.solution.arc, 2 * Math.PI, 0.05, 'the solution is the last stop of the slider');

  const dial = fixed(L4, 'pi-steps');
  assert.equal(dial.widget.mode, 'pi');
  for (const deg of range(0, 360, 15)) {
    const said = dial.check({ deg, rad: tidy4(deg * D2R) });
    assert.equal(said === true, Math.abs(deg * D2R - Math.PI / 3) < 1e-9, `${deg}°`);
    if (said === true) continue;
    assert.ok(said.includes(`${deg}°`));
    assert.equal(/Open it further/.test(said), deg < 60); assert.equal(/Close it up/.test(said), deg > 60);
  }
  assert.equal(dial.check({ deg: dial.solution.deg }), true);
});

/* ------------------------------------------------------- lesson 5: sine waves */

const L5 = 'sine-waves';

test('waves: amplitude and period of y = A sin(Bx), measured on the curve', () => {
  eachVariant(L5, 'period', (step) => {
    const m = /y = ([\d.]+)\\sin\\!\\left\((?:\\tfrac\{1\}\{(\d)\}|(\d+))x\\right\)/.exec(step.text);
    assert.ok(m, 'the equation is recognised');
    const A = Number(m[1]);
    const B = m[2] ? 1 / Number(m[2]) : Number(m[3]);
    assert.ok(A !== 1 && B !== 1, 'no "1 sin" or "1x"');
    const f = (x) => A * Math.sin(B * x);
    const { max, min } = extremes(f, 0, 16 * Math.PI);
    near(blank(step, 0), max, 1e-4, 'amplitude: the highest point of the curve'); near(min, -max, 1e-4);
    const period = periodOf(f, Math.PI / 60, 600, [0.1, 0.7, 1.3, 2.9, 4.4, 7.7]);
    assert.ok(period, 'the wave repeats');
    near(blank(step, 1) * Math.PI, period, 1e-9, 'period: the smallest shift that leaves the curve unchanged');
    lowestTerms(step.blanks[1].answers[0]);
    const end = /= ([^=]+)\$\.$/.exec(step.explain);
    near(piMultiple(end[1]) * Math.PI, period, 1e-9, 'the period quoted in the explanation');
  });
});

test('waves: midline and amplitude from the highest and lowest values', () => {
  eachVariant(L5, 'from-extremes', (step) => {
    const [hi, lo] = bolds(step.text).map(firstNumber);
    assert.ok(hi > lo && lo >= 0, `${hi} is above ${lo}, and neither is negative`);
    if (/hours\*\* of daylight/.test(step.text)) assert.ok(hi < 24 && Math.abs((hi + lo) / 2 - 12) <= 0.5, 'a believable year of daylight');
    const D = blank(step, 0);
    const A = blank(step, 1);
    near(D + A, hi, 1e-9, 'midline + amplitude is the highest value'); near(D - A, lo, 1e-9, 'midline − amplitude is the lowest value');
    assert.notEqual(D, A, 'the two blanks cannot be swapped unnoticed');
    assert.ok(step.explain.includes(`\\dfrac{${hi} + ${lo}}{2} = ${D}`) && step.explain.includes(`\\dfrac{${hi} - ${lo}}{2} = ${A}`));
  });
});

test('waves: the formula chosen for a graph is the curve that is drawn', () => {
  eachVariant(L5, 'read-formula', (step) => {
    const fig = step.figures[0];
    const drawn = compile(fig.fns[0].expr, { vars: ['x'] });
    const f = (t) => drawn({ x: t });
    const { max, min } = extremes(f, fig.x[0], fig.x[1], 16000);
    const midline = (max + min) / 2;
    const amplitude = (max - min) / 2;
    const period = periodOf(f, 1, 400, [0.3, 7.1, 13.9, 21.4]);
    assert.ok(min >= fig.y[0] && max <= fig.y[1] - 1, 'the whole wave is inside the window');
    assert.ok(fig.x[1] >= 2 * period - 1e-9, 'two full cycles are shown');
    near(f(0), midline, 1e-9, 'it starts on the midline'); assert.ok(f(period / 8) > midline, 'going up');
    assert.equal(fig.hlines[0].y, midline);
    for (const o of step.options) {
      const m = /^\$h = (\d+) \+ (\d+)\\sin(?:\\left\(\\tfrac\{2\\pi\}\{(\d+)\}\\,t\\right\)|\((\d+)\\,t\))\$$/.exec(o.text);
      assert.ok(m, `option ${o.text} is recognised`);
      const [d, a, b] = [Number(m[1]), Number(m[2]), m[3] ? (2 * Math.PI) / Number(m[3]) : Number(m[4])];
      const same = [0, 3.3, 9.1, 17, 26.5, 41, 77.7].every((t) => Math.abs(d + a * Math.sin(b * t) - f(t)) < 1e-9);
      assert.equal(same, !!o.correct, o.text);
      if (o.correct) continue;
      const n = numbersIn(o.why.replace(/\$2\\pi\$/, ''));
      if (/would swing about/.test(o.why)) assert.deepEqual(n, [d, d + a, midline], o.why);
      else if (/measured from the midline/.test(o.why)) assert.deepEqual(n, [midline, max, amplitude], o.why);
      else { assert.match(o.why, /is not the period/); assert.deepEqual(n, [period], o.why); }
    }
    correctOption(step);
    assert.deepEqual(numbersIn(step.explain.replace(/2\\pi/, '')), [midline, max, amplitude, period, period]);
  });
});

test('waves: the period of a musical note', () => {
  eachVariant(L5, 'sound', (step) => {
    const hz = Number(/\*\*(\d+) Hz\*\*/.exec(step.text)[1]);
    const ms = 1000 / hz;
    assert.ok(accepts(step, ms) && accepts(step, round(ms, 2)) && accepts(step, round(ms, 3)), `${ms} ms is accepted`);
    assert.ok(!accepts(step, round(ms, 1)) || round(ms, 1) === round(ms, 2), 'one decimal is not enough');
    assert.ok(!accepts(step, hz / 1000) && !accepts(step, ms / 1000));
    // the As around the tuning note: each octave doubles the frequency
    if (/for tuning instruments, has/.test(step.text)) assert.equal(hz, 440);
    assert.ok(/for tuning instruments, has|octaves? (below|above) the standard tuning note/.test(step.text), 'the note is named');
    if (/one octave below/.test(step.text)) assert.equal(hz * 2, 440);
    if (/two octaves below/.test(step.text)) assert.equal(hz * 4, 440);
    if (/one octave above/.test(step.text)) assert.equal(hz, 440 * 2);
    assert.ok(step.explain.includes(`\\approx ${round(ms, 2)}$ ms`));
  }, 4);
});

/**
 * Hours of daylight at a latitude on a calendar date (at noon UT), from the sun's position:
 * mean longitude and anomaly, equation of centre, obliquity (the low-precision formulas of
 * the astronomical almanacs, good to about 0.01° at these dates), then the sunrise equation
 * for the upper limb with standard refraction (zenith distance 90.833°).
 * (A Fourier-series declination indexed by day of the year, such as Spencer's of 1971, is up
 * to a day out of step with today's calendar: 9 minutes of daylight near an equinox.)
 */
function daylightHours(latitude, year, month, day) {
  const y = month <= 2 ? year - 1 : year;
  const m = month <= 2 ? month + 12 : month;
  const century = Math.floor(y / 100);
  const julianDay = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + 2 - century + Math.floor(century / 4) - 1524;   // at noon UT
  const T = (julianDay - 2451545) / 36525;
  const meanLongitude = 280.46646 + 36000.76983 * T;
  const anomaly = (357.52911 + 35999.05029 * T) * D2R;
  const centre = (1.914602 - 0.004817 * T) * Math.sin(anomaly) + 0.019993 * Math.sin(2 * anomaly) + 0.000289 * Math.sin(3 * anomaly);
  const node = (125.04 - 1934.136 * T) * D2R;
  const longitude = (meanLongitude + centre - 0.00569 - 0.00478 * Math.sin(node)) * D2R;
  const obliquity = (23.439291 - 0.0130042 * T + 0.00256 * Math.cos(node)) * D2R;
  const decl = Math.asin(Math.sin(obliquity) * Math.sin(longitude));
  const lat = latitude * D2R;
  const cosH = (Math.cos(90.833 * D2R) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
  return (2 * Math.acos(cosH)) / D2R / 15;
}

test('waves: the daylight data are London\'s, and the fit is judged by its distance from the dots', () => {
  const step = fixed(L5, 'daylight');
  const dots = step.widget.points;
  // 21 December, then the 21st of each month, round to the next 21 December
  const months = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  assert.equal(dots.length, months.length);
  const cycle = [2025, 2026, 2027, 2028];       // the 21st falls up to three quarters of a day earlier or later in the seasons, depending on the leap year
  dots.forEach((dot, i) => {
    assert.equal(dot.x, i);
    const hours = cycle.map((year) => daylightHours(51.5, year, months[i], 21));
    const typical = hours.reduce((sum, h) => sum + h, 0) / hours.length;
    assert.equal(dot.y, Math.round(typical * 10) / 10, `daylight on the 21st, ${i} months after December: ${typical} h, to 0.1 h`);
    for (const h of hours) near(dot.y, h, 0.08, `daylight on the 21st, ${i} months after December, in any year`);
  });
  // the model against published sunrise and sunset tables for London: 7 h 50 min and 16 h 38 min at the
  // solstices, 12 h 16 min on 21 September 2026 and 10 h 20 min on 21 October 2026
  near(daylightHours(51.5, 2025, 12, 21) * 60, 7 * 60 + 50, 1.5); near(daylightHours(51.5, 2026, 6, 21) * 60, 16 * 60 + 38, 1.5);
  near(daylightHours(51.5, 2026, 9, 21) * 60, 12 * 60 + 16, 1.5); near(daylightHours(51.5, 2026, 10, 21) * 60, 10 * 60 + 20, 1.5);
  assert.equal(dots[0].y, dots[12].y, 'the year closes on itself');
  const curve = compile(step.widget.fns[0].expr, { vars: ['x', 'D', 'A', 'C'] });
  const miss = (s) => Math.sqrt(dots.reduce((sum, dot) => sum + (curve({ ...s, x: dot.x }) - dot.y) ** 2, 0) / dots.length);
  const values = (p) => range(p.min, p.max, p.step);
  const highest = Math.max(...dots.map((d) => d.y));
  const lowest = Math.min(...dots.map((d) => d.y));
  const longestDay = dots.findIndex((d) => d.y === highest);
  assert.equal(longestDay, 6, 'the longest day is 6 months after December');
  const accepted = [];
  for (const D of values(step.widget.params.D)) for (const A of values(step.widget.params.A)) for (const C of values(step.widget.params.C)) {
    const s = { D, A, C };
    const said = step.check(s);
    assert.equal(said === true, miss(s) <= 0.4, `D ${D}, A ${A}, C ${C}: rms ${miss(s)}`);
    if (said === true) { accepted.push(`${D}/${A}/${C}`); continue; }
    const peak = /reaches its peak at month ([\d.]+)\. The longest day is at month 6, in June: slide the wave to the (left|right)/.exec(said);
    if (peak) {
      // where this wave is really highest within the year
      let best = 0;
      for (const x of range(0, 12, 0.5)) if (curve({ ...s, x }) > curve({ ...s, x: best }) + 1e-9) best = x;
      assert.equal(Number(peak[1]), best, said);
      assert.equal(peak[2], best < longestDay ? 'right' : 'left');
      continue;
    }
    assert.equal(C, 3);
    const mid = /middle line of your wave is at ([\d.]+) hours\. The dots swing between ([\d.]+) and ([\d.]+) hours, so their middle is (higher|lower) than that/.exec(said);
    if (mid) {
      assert.deepEqual([Number(mid[1]), Number(mid[2]), Number(mid[3])], [D, lowest, highest]);
      assert.equal(mid[4], (highest + lowest) / 2 > D ? 'higher' : 'lower');
      continue;
    }
    const swing = /swings (only )?([\d.]+) hours above and below its middle line\. (The dots go further than that|That overshoots the dots)\./.exec(said);
    assert.ok(swing, said);
    assert.equal(Number(swing[2]), A);
    // with this midline, do the highest and lowest dots lie outside the wave's reach, or inside it?
    if (swing[1]) assert.ok(highest > D + A && lowest < D - A, said); else assert.ok(highest < D + A && lowest > D - A, said);
  }
  assert.deepEqual(accepted.sort(), ['12.5/4.5/3', '12.5/4/3', '12/4.5/3', '12/4/3'], 'the four settings nearest the data, and no others');
  assert.equal(step.check(step.solution), true);
  assert.notEqual(step.check({ D: step.widget.params.D.value, A: step.widget.params.A.value, C: step.widget.params.C.value }), true, 'not solved at the start');
  const worst = Math.max(...dots.map((dot) => Math.abs(curve({ ...step.solution, x: dot.x }) - dot.y)));
  assert.ok(worst < 0.7, `the fit named in the explanation stays within about 40 minutes of the data (${worst} h)`);
  assert.match(step.explain, /within about 40 minutes/);
  // … and of the real daylight on every day of a year, not only on the twelve 21sts
  const fitted = /y = (\d+) \+ ([\d.]+)\\sin\\!\\left\(\\frac\{2\\pi\}\{12\}\(x - (\d+)\)\\right\)/.exec(step.explain);
  assert.deepEqual([Number(fitted[1]), Number(fitted[2]), Number(fitted[3])], [step.solution.D, step.solution.A, step.solution.C], 'the explanation names the solution');
  const monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let widest = 0;
  for (let month = 1; month <= 12; month++) for (let day = 1; day <= monthLengths[month - 1]; day++) {
    // months after 21 December, counting from each 21st to the next as one step, as the dots do
    const sinceThe21st = day >= 21 ? (day - 21) / monthLengths[month - 1] : (day - 21) / monthLengths[(month + 10) % 12];
    const x = ((month % 12) + sinceThe21st + 12) % 12;
    widest = Math.max(widest, Math.abs(daylightHours(51.5, 2026, month, day) - curve({ ...step.solution, x })));
  }
  assert.ok(widest * 60 > 30 && widest * 60 < 45, `real daylight stays within about 40 minutes of the fitted wave all year (${widest * 60} min)`);
  // the accepted settings are the best the sliders can do: every other setting is clearly further from the dots
  const ranked = [];
  for (const D of values(step.widget.params.D)) for (const A of values(step.widget.params.A)) for (const C of values(step.widget.params.C)) ranked.push({ key: `${D}/${A}/${C}`, miss: miss({ D, A, C }) });
  ranked.sort((p, q) => p.miss - q.miss);
  assert.deepEqual(ranked.slice(0, accepted.length).map((s) => s.key).sort(), accepted.slice().sort(), 'the accepted settings are exactly the closest ones');
  assert.ok(ranked[accepted.length].miss > ranked[accepted.length - 1].miss + 0.15, 'with a clear gap to the next one');
  // midline and amplitude read from the extremes, as the hints suggest, land inside the accepted settings
  assert.ok(Math.abs((highest + lowest) / 2 - step.solution.D) <= 0.25 && Math.abs((highest - lowest) / 2 - step.solution.A) <= 0.25);
});

test('waves: fixed facts', () => {
  // landmarks of the sine wave in its first turn
  const marks = fixed(L5, 'landmarks');
  const xOf = { 'π/2': Math.PI / 2, π: Math.PI, '3π/2': (3 * Math.PI) / 2, '2π': 2 * Math.PI, '4π': 4 * Math.PI };
  near(Math.sin(Math.PI / 2), blank(marks, 0), 1e-12);
  near(Math.sin(xOf[marks.blanks[1].answer]), 0, 1e-12); assert.equal(marks.blanks[1].answer, 'π');
  // 2π is offered too, and the wave is on the axis there as well: the sentence has to ask for the first time
  const zeros = marks.blanks[1].options.filter((o) => Math.abs(Math.sin(xOf[o])) < 1e-12);
  assert.ok(zeros.length > 1 && /first back on the axis/.test(marks.template), 'the blank asks for the first return to the axis');
  assert.equal(xOf[marks.blanks[1].answer], Math.min(...zeros.map((o) => xOf[o])));
  // each of the other two dropdowns has only one true option
  assert.deepEqual(marks.blanks[2].options.filter((o) => Math.abs(Math.sin(xOf[o]) + 1) < 1e-12), ['3π/2']);
  assert.deepEqual(marks.blanks[4].options.filter((o) => Math.abs(xOf[o] - 2 * Math.PI) < 1e-12), ['2π']);
  near(Math.sin(xOf[marks.blanks[2].answer]), blank(marks, 3), 1e-12); assert.equal(blank(marks, 3), -1);
  near(xOf[marks.blanks[4].answer], periodOf(Math.sin, Math.PI / 6, 60, [0.2, 1.1, 2.5]), 1e-9);
  // the opening question: only the smooth wave is the height of a point on a circle
  for (const o of fixed(L5, 'hook').options) {
    const f = compile(o.figure.fns[0].expr, { vars: ['x'] });
    const isSine = range(0.1, 12, 0.37).every((x) => Math.abs(f({ x }) - Math.sin(x)) < 1e-9);
    assert.equal(isSine, !!o.correct, o.text);
    for (const x of range(0.05, 12.5, 0.05)) assert.ok(Math.abs(f({ x })) <= 1 + 1e-9, `${o.text} stays between −1 and 1`);
  }
  near(periodOf((x) => 2 * Math.sin(3 * x), Math.PI / 60, 600, [0.2, 0.9, 1.7]), (2 * Math.PI) / 3, 1e-9);
});

test('waves: the interactive checks accept exactly the right states', () => {
  const unroll = fixed(L5, 'unroll');
  for (const traced of range(0, 720, unroll.widget.step)) assert.equal(unroll.check({ traced }) === true, traced * D2R >= 2 * Math.PI - 1e-9, `traced ${traced}°`);
  assert.equal(unroll.check({ traced: unroll.solution.deg }), true);

  const wheel = fixed(L5, 'wheel');
  const { aRange, aStep, bRange, bStep, target } = wheel.widget;
  const xs = range(0.1, 6.2, 0.31);
  let passes = 0;
  for (const A of range(aRange[0], aRange[1], aStep)) for (const B of range(bRange[0], bRange[1], bStep)) {
    const said = wheel.check({ A, B });
    const same = xs.every((x) => Math.abs(A * Math.sin(B * x) - target.A * Math.sin(target.B * x)) < 1e-9);
    assert.equal(said === true, same, `A ${A}, B ${B}`);
    if (said === true) { passes++; continue; }
    // "tall" is about the peaks, "cycles" about how many fit into one turn
    if (/not tall enough/.test(said)) assert.ok(A < target.A);
    if (/too tall/.test(said)) assert.ok(A > target.A);
    if (/too few cycles|fits in more cycles/.test(said)) assert.ok(B < target.B);
    if (/too many cycles|has fewer cycles/.test(said)) assert.ok(B > target.B);
    if (/The cycles line up/.test(said)) assert.equal(B, target.B);
    if (/The height is right/.test(said)) assert.equal(A, target.A);
  }
  assert.equal(passes, 1);
  assert.equal(wheel.check(wheel.solution), true);
  assert.ok(wheel.explain.includes(`y = ${target.A}\\sin(${target.B}x)`));

  const shift = fixed(L5, 'cos-shift');
  const [cosine, shifted] = shift.widget.fns.map((fn) => compile(fn.expr, { vars: ['x', 'k'] }));
  const p = shift.widget.params.k;
  passes = 0;
  for (const k of range(p.min, p.max, p.step)) {
    const said = shift.check({ k });
    const diff = (g) => Math.max(...xs.map((x) => Math.abs(shifted({ x, k }) - g(x))));
    assert.equal(said === true, diff((x) => cosine({ x, k })) < 1e-9, `k = ${k}`);
    if (said === true) { passes++; continue; }
    if (/still the plain sine wave/.test(said)) assert.ok(diff(Math.sin) < 1e-9);
    if (/the dashed one upside down/.test(said)) assert.ok(diff((x) => -Math.cos(x)) < 1e-9);
    if (/turns the sine wave upside down/.test(said)) assert.ok(diff((x) => -Math.sin(x)) < 1e-9);
  }
  assert.equal(passes, 1);
  assert.equal(shift.check(shift.solution), true);
  for (const x of xs) near(Math.cos(x), Math.sin(x + Math.PI / 2), 1e-12);
});

/* -------------------------------------------------- lesson 6: any triangle */

const L6 = 'any-triangle';
/** The corners of a `geo` triangle figure, by the names printed on it. */
const cornersByName = (fig) => Object.fromEntries(Object.values(fig.points).map((p) => [p.label, { x: p.x, y: p.y }]));
const labelOn = (fig, i, j) => { const sh = fig.shapes.find((s) => s.kind === 'segment' && s.pts.includes(i) && s.pts.includes(j)); return sh ? sh.label : null; };

test('triangles: the third side by the law of cosines is the third side of the drawn triangle', () => {
  let obtuse = 0;
  eachVariant(L6, 'cos-side', (step) => {
    const m = /\$a = (\d+)\$ and \$b = (\d+)\$, and the angle between them is \$C = (\d+)\^\\circ\$\. You may use \$\\cos (\d+)\^\\circ \\approx (-?[\d.]+)\$/.exec(step.text);
    assert.ok(m, 'the question is recognised');
    const [a, b, C] = [Number(m[1]), Number(m[2]), Number(m[3])];
    assert.equal(Number(m[4]), C);
    assert.match(m[5], /^-?\d\.\d{3}$/); near(Number(m[5]), cosd(C), 0.0005 + 1e-9, 'the cosine quoted in the text');
    if (C > 90) obtuse++;
    // measure the picture
    const fig = step.figures[0];
    const { A: pa, B: pb, C: pc } = fig.points;
    near(hypot(pc, pb), a, 1e-9, 'side a as drawn'); near(hypot(pc, pa), b, 1e-9, 'side b as drawn'); near(angleAt(pa, pc, pb), C, 1e-9, 'angle C as drawn');
    const c = hypot(pa, pb);
    assert.deepEqual([labelOn(fig, 'B', 'C'), labelOn(fig, 'C', 'A'), labelOn(fig, 'A', 'B')], [String(a), String(b), '?']);
    assert.equal(step.answer, round(c, 1), 'the key is the third side of that triangle');
    assert.equal(step.display, round(c, 1).toFixed(1));
    const squareByTable = a * a + b * b - 2 * a * b * Number(m[5]);
    for (const v of [c, round(c, 2), Math.sqrt(squareByTable), round(Math.sqrt(squareByTable), 1), Math.sqrt(round(squareByTable, 1))]) assert.ok(accepts(step, v), `${v} is accepted (key ${step.answer} ± ${step.tolerance})`);
    assert.ok(step.tolerance <= 0.12);
    // c² rounded to 1 decimal before the square root, from the calculator's cosine or the table's
    for (const v of [Math.sqrt(round(c * c, 1)), Math.sqrt(round(squareByTable, 1))]) for (const typed of [v, round(v, 1)]) assert.ok(accepts(step, typed), `${typed} is accepted (key ${step.answer} ± ${step.tolerance})`);
    const pythagoras = Math.hypot(a, b);
    const wrongSign = Math.sqrt(a * a + b * b + 2 * a * b * cosd(C));
    for (const v of [pythagoras, round(pythagoras, 1), wrongSign, round(wrongSign, 1), c * c, a + b, Math.abs(a - b)]) assert.ok(!accepts(step, v), `${v} is rejected`);
    // more slips: the sine for the cosine, a calculator in radian mode, ab for 2ab, and (a² + b² − 2ab) × cos C
    const slips = [Math.sqrt(Math.abs(a * a + b * b - 2 * a * b * sind(C))), Math.sqrt(Math.abs(a * a + b * b - 2 * a * b * Math.cos(C))), Math.sqrt(a * a + b * b - a * b * cosd(C))];
    if (C < 90) slips.push(Math.sqrt((a - b) ** 2 * cosd(C)), (a - b) ** 2 * cosd(C));
    for (const v of slips) assert.ok(!accepts(step, v) && !accepts(step, round(v, 1)), `${v} is rejected`);
    assert.ok(c > Math.abs(a - b) && c < a + b, 'a real triangle');
    assert.equal(c < pythagoras, C < 90, 'shorter than Pythagoras exactly when the angle is acute');
    const [[w1, why1], [w2, why2], [w3, why3]] = step.wrong;
    near(w1, round(pythagoras, 1), 1e-9); assert.match(why1, /Pythagoras/);
    near(w2, round(wrongSign, 1), 1e-9); assert.match(why2, C < 90 ? /must be \*\*shorter\*\* than Pythagoras gives/ : /is negative[\s\S]*must be longer than Pythagoras gives/);
    near(w3, round(c * c, 1), 1e-9); assert.match(why3, /square root/);
    const sq = /= ([\d.]+)\$, so \$c \\approx ([\d.]+)\$/.exec(step.explain);
    near(Number(sq[1]), squareByTable, 0.0006, 'c² in the explanation'); assert.equal(sq[2], step.display);
    assert.equal(round(Math.sqrt(Number(sq[1])), 1), step.answer, `the explanation's own arithmetic: √${sq[1]} = ${Math.sqrt(Number(sq[1]))} rounds to the key`);
    assert.ok(step.explain.includes(C < 90 ? 'shorter than Pythagoras would give' : 'longer than Pythagoras would give'));
    near(Number(/\\approx ([\d.]+)\$\)\.$/.exec(step.explain)[1]), pythagoras, 0.05 + 1e-9);
  });
  assert.ok(obtuse > 40, 'obtuse angles turn up too');
});

test('triangles: an angle from three sides', () => {
  const found = new Set();
  eachVariant(L6, 'cos-angle', (step) => {
    const [a, b, c] = /\$a = (\d+)\$, \$b = (\d+)\$ and \$c = (\d+)\$/.exec(step.text).slice(1).map(Number);
    assert.ok(a + b > c && a + c > b && b + c > a, 'a real triangle');
    // build it: C at the origin, B along the x-axis, A where the two circles (radius b about C, radius c about B) meet
    const x = (a * a + b * b - c * c) / (2 * a);
    const y = Math.sqrt(b * b - x * x);
    const corners = { C: { x: 0, y: 0 }, B: { x: a, y: 0 }, A: { x, y } };
    near(hypot(corners.A, corners.B), c, 1e-9); near(hypot(corners.A, corners.C), b, 1e-9);
    const angle = angleAt(corners.B, corners.C, corners.A);
    near(step.answer, angle, 1e-9, 'the angle facing side c');
    assert.ok([60, 90, 120].includes(step.answer));
    found.add(step.answer);
    for (const [v, why] of step.wrong) {
      assert.equal(v, 180 - step.answer); assert.ok(!accepts(step, v));
      assert.match(why, step.answer < 90 ? /\+0\.5[\s\S]*below 90°/ : /-0\.5[\s\S]*above 90°/);
    }
    assert.equal(step.wrong.length, step.answer === 90 ? 0 : 1);
    near(cosd(60), 0.5, 1e-12); near(cosd(90), 0, 1e-12); near(cosd(120), -0.5, 1e-12);
    assert.ok(step.explain.includes(`= ${cosd(step.answer) === 0 ? 0 : tidy4(cosd(step.answer))}$, so $C = ${step.answer}^\\circ$`), step.explain);
    assert.ok(step.hints[1].includes(`\\dfrac{${a * a + b * b - c * c}}{${2 * a * b}}`));
  });
  assert.equal(found.size, 3);
});

test('triangles: a side by the law of sines is that side of the drawn triangle', () => {
  eachVariant(L6, 'sin-side', (step) => {
    const [A, B, a] = /angle \$A = (\d+)\^\\circ\$, angle \$B = (\d+)\^\\circ\$, and the side facing \$A\$ is \$a = (\d+)\$/.exec(step.text).slice(1).map(Number);
    assert.ok(A + B < 180 && A !== B);
    // build the triangle from the question alone: B at the origin, C along the x-axis, A where the two rays meet
    const pb = { x: 0, y: 0 };
    const pc = { x: a, y: 0 };
    const pa = meet(pb, B, pc, 180 - (180 - A - B));
    near(angleAt(pb, pa, pc), A, 1e-9, 'the angle at A comes out right');
    const b = hypot(pa, pc);
    assert.equal(step.answer, round(b, 1)); assert.equal(step.display, round(b, 1).toFixed(1));
    // and the picture shows the same triangle
    const fig = cornersByName(step.figures[0]);
    near(hypot(fig.B, fig.C), a, 1e-9); near(angleAt(fig.B, fig.A, fig.C), A, 1e-9); near(angleAt(fig.A, fig.B, fig.C), B, 1e-9); near(hypot(fig.C, fig.A), b, 1e-9);
    assert.equal(labelOn(step.figures[0], 'B', 'C'), `a = ${a}`); assert.equal(labelOn(step.figures[0], 'C', 'A'), 'b = ?');
    const table = tableIn(step.text);
    assert.deepEqual(table.fns, ['sin']); assert.deepEqual(Object.keys(table.rows).map(Number).sort((p, q) => p - q), [A, B].sort((p, q) => p - q));
    const sA = Number(table.rows[A].sin);
    const sB = Number(table.rows[B].sin);
    for (const v of [b, round(b, 2), (a * sB) / sA, round((a * sB) / sA, 1), round(a / sA, 2) * sB, round(a / sA, 1) * sB, round(a * sB, 1) / sA]) assert.ok(accepts(step, v), `${v} is accepted (key ${step.answer} ± ${step.tolerance})`);
    // the product or the ratio of the two sines written down to 3 significant figures on the way
    for (const v of [round(a * sB, 2) / sA, a * round(sB / sA, 3), round(a / sA, 3) * sB]) for (const typed of [v, round(v, 1)]) assert.ok(accepts(step, typed), `${typed} is accepted (key ${step.answer} ± ${step.tolerance})`);
    assert.equal(round((a * sB) / sA, 1), step.answer, `the explanation's own arithmetic, ${a} × ${sB} ÷ ${sA} = ${(a * sB) / sA}, rounds to the key`);
    assert.ok(step.tolerance <= 0.15);
    const swapped = (a * sind(A)) / sind(B);
    for (const v of [swapped, round(swapped, 1), a, a * sind(B), a / sind(A)]) assert.ok(!accepts(step, v), `${v} is rejected`);
    // the same short cuts on a calculator instead of the table
    for (const v of [round(a / sind(A), 1) * sind(B), round(a * sind(B), 1) / sind(A)]) for (const typed of [v, round(v, 1)]) assert.ok(accepts(step, typed), `${typed} is accepted (key ${step.answer} ± ${step.tolerance})`);
    // more slips: the angles used without their sines, radian mode (minus sign dropped), cosines for sines,
    // half of the calculation with the wrong angle, and the third side (unless the triangle is isosceles and it is as long as b)
    const third = (a * sind(180 - A - B)) / sind(A);
    const slips = [(a * B) / A, Math.abs((a * Math.sin(B)) / Math.sin(A)), Math.abs((a * cosd(B)) / cosd(A)), a * sind(A), a / sind(B)];
    if (180 - A - B !== B) slips.push(third);
    for (const v of slips) assert.ok(!accepts(step, v) && !accepts(step, round(v, 1)), `${v} is rejected (key ${step.answer} ± ${step.tolerance})`);
    // no doubt about which triangle is meant: two angles and a side fix it (no "two triangles" case)
    assert.ok(180 - A - B >= 30, 'the third angle is not a sliver');
    near(step.wrong[0][0], round(swapped, 1), 1e-9);
    assert.equal(b > a, B > A, 'the bigger angle faces the longer side');
    assert.ok(step.explain.includes(B > A ? 'the bigger angle, so $b$ is the longer side' : 'the smaller angle, so $b$ is the shorter side'));
    assert.ok(step.explain.includes(`\\approx ${step.display}$`) && step.explain.includes(`\\dfrac{${a} \\times ${table.rows[B].sin}}{${table.rows[A].sin}}`));
  });
});

test('triangles: a distance by triangulation is where the two lines of sight cross', () => {
  eachVariant(L6, 'ship-distance', (step) => {
    const m = /\*\*(\d+) km\*\*[\s\S]*?\*\*(\d+)°\*\*[\s\S]*?\*\*(\d+)°\*\*/.exec(step.text);
    const [d, atA, atB] = [Number(m[1]), Number(m[2]), Number(m[3])];
    assert.match(step.text, new RegExp(`from A at \\*\\*${atA}°\\*\\*[\\s\\S]*from B at \\*\\*${atB}°\\*\\*`));
    assert.match(step.text, /How far is the \w+ from (station |tower )?A/);
    const A = { x: 0, y: 0 };
    const B = { x: d, y: 0 };
    const S = meet(A, atA, B, 180 - atB);
    assert.ok(S.y > 0, 'the lines of sight cross on the far side of the baseline');
    const fromA = hypot(A, S);
    const fromB = hypot(B, S);
    assert.equal(step.answer, round(fromA, 1)); assert.equal(step.display, round(fromA, 1).toFixed(1));
    const far = 180 - atA - atB;
    near(angleAt(A, S, B), far, 1e-9, 'the angle at the far corner');
    const table = tableIn(step.text);
    assert.deepEqual(Object.keys(table.rows).map(Number), [atA, atB, far].sort((p, q) => p - q), 'the table has the three angles, in order');
    const sB = Number(table.rows[atB].sin);
    const sF = Number(table.rows[far].sin);
    for (const v of [fromA, round(fromA, 2), (d * sB) / sF, round((d * sB) / sF, 1), round(d / sF, 2) * sB, round(d / sF, 1) * sB, round(d * sB, 1) / sF]) assert.ok(accepts(step, v), `${v} is accepted (key ${step.answer} ± ${step.tolerance})`);
    assert.ok(step.tolerance <= 0.15);
    // the product or the ratio of the two sines written down to 3 significant figures on the way, and the short cuts on a calculator
    for (const v of [round(d * sB, 2) / sF, d * round(sB / sF, 3), round(d / sF, 3) * sB, round(d / sind(far), 1) * sind(atB), round(d * sind(atB), 1) / sind(far)]) for (const typed of [v, round(v, 1)]) assert.ok(accepts(step, typed), `${typed} is accepted (key ${step.answer} ± ${step.tolerance})`);
    assert.equal(round((d * sB) / sF, 1), step.answer, `the explanation's own arithmetic, ${d} × ${sB} ÷ ${sF} = ${(d * sB) / sF}, rounds to the key`);
    const wrongPair = (d * sind(atB)) / sind(atA);
    for (const v of [fromB, round(fromB, 1), wrongPair, round(wrongPair, 1), d]) assert.ok(!accepts(step, v), `${v} is rejected`);
    // half of the calculation (treating the triangle as right-angled), the sines multiplied, the pair turned round,
    // the angles without their sines, the height of the triangle, radian mode: none passes, rounded or not
    const slips = [d * sind(atB), d / sind(far), d * sind(atB) * sind(far), (d * sind(atA)) / sind(atB), (d * sind(far)) / sind(atB), (d * atB) / far, S.y, Math.abs((d * Math.sin(atB)) / Math.sin(far))];
    for (const v of slips) assert.ok(!accepts(step, v) && !accepts(step, round(v, 1)), `${v} is rejected (key ${step.answer} ± ${step.tolerance})`);
    assert.ok(Math.abs(far - 90) >= 10, `the far angle (${far}°) is not close to a right angle, where the right-triangle short cut would nearly work`);
    const [[w1, why1], [w2, why2]] = step.wrong;
    near(w1, round(fromB, 1), 1e-9); assert.match(why1, /That is the distance from B/); assert.ok(why1.includes(`sin ${atB}°`));
    near(w2, round(wrongPair, 1), 1e-9); assert.ok(why2.includes(`${d} km baseline faces the angle at the`));
    // the picture: baseline along the bottom, the far corner where the lines cross
    const fig = cornersByName(step.figures[0]);
    const thing = Object.keys(fig).find((k) => k !== 'A' && k !== 'B');
    assert.ok(step.text.includes(thing), `the far corner is named after the ${thing}`);
    near(hypot(fig.A, fig.B), d, 1e-9); near(angleAt(fig.B, fig.A, fig[thing]), atA, 1e-9); near(angleAt(fig.A, fig.B, fig[thing]), atB, 1e-9); near(hypot(fig.A, fig[thing]), fromA, 1e-9);
    assert.ok(step.hints[1].includes(`is ${far}°`) && step.hints[1].includes(`faces the ${atB}° angle`));
    assert.ok(step.explain.includes(`180^\\circ - ${atA}^\\circ - ${atB}^\\circ = ${far}^\\circ`) && step.explain.includes(`\\approx ${step.display}$ km`));
  });
});

test('triangles: fixed facts', () => {
  // the opening question: sides 5 and 8 at 60° close with a side of exactly 7
  const hook = fixed(L6, 'hook').figures[0].points;
  near(hypot(hook.A, hook.B), 7, 1e-9); near(hypot(hook.C, hook.A), 8, 1e-9); near(hypot(hook.C, hook.B), 5, 1e-9); near(angleAt(hook.A, hook.C, hook.B), 60, 1e-9);
  near(Math.sqrt(89), 9.4, 0.05); assert.match(correctOption(fixed(L6, 'hook')).text, /shorter than 9\.4/);
  // the hinge at 60° and 120°, by coordinates
  const fill = fixed(L6, 'correction');
  const { A, C } = fill.figures[0].points;
  const c2 = (deg) => hypot(A, polar(C, 4, deg)) ** 2;
  near(hypot(C, A), 3, 1e-12);
  near(blank(fill, 0), c2(60), 1e-9); near(blank(fill, 1), 25 - c2(60), 1e-9); near(blank(fill, 2), c2(120), 1e-9); near(blank(fill, 3), c2(120) - 25, 1e-9);
  near(2 * 4 * 3 * cosd(60), 12, 1e-9); near(2 * 4 * 3 * cosd(120), -12, 1e-9);
  // the two expressions for the same height
  const derive = fixed(L6, 'derive');
  assert.deepEqual(derive.blanks.map((b) => b.answer), ['b', 'a', 'B']);
  const tri = { A: { x: 0, y: 0 }, B: { x: 9, y: 0 }, C: { x: 3.5, y: 5 } };
  const [angA, angB] = [angleAt(tri.B, tri.A, tri.C), angleAt(tri.A, tri.B, tri.C)];
  near(hypot(tri.A, tri.C) * sind(angA), tri.C.y, 1e-9, 'h = b sin A'); near(hypot(tri.B, tri.C) * sind(angB), tri.C.y, 1e-9, 'h = a sin B');
  // which law: sort each case by whether it contains a side with the angle facing it
  const which = fixed(L6, 'which-law');
  assert.deepEqual(which.buckets, ['Law of sines', 'Law of cosines']);
  for (const item of which.items) {
    const needsCosines = /angle between them|All three sides|enclose an angle/.test(item.text);
    assert.equal(item.bucket, needsCosines ? 1 : 0, item.text);
  }
  near(Math.sqrt(5 * 5 + 7 * 7 - 2 * 5 * 7 * cosd(100)), 9.29, 0.01);
});

test('triangles: the interactive checks accept exactly the right states', () => {
  // the hinge: every position the end of the rod can snap to
  const hinge = fixed(L6, 'hinge');
  const { A, C } = hinge.widget.points;
  let passes = 0;
  for (const deg of range(20, 160, 5)) {
    const B = polar(C, 4, deg);
    near(angleAt(A, C, B), deg, 1e-9);
    const c2 = hypot(A, B) ** 2;
    const said = hinge.check({ B: hinge.widget.points.B.constrain(B) });
    assert.equal(said === true, Math.abs(c2 - 25) < 1e-9, `${deg}°`);
    if (said === true) { passes++; assert.equal(deg, 90); continue; }
    assert.ok(said.includes(`At ${deg}°`) && said.includes(`c² is ${round(c2, 1)}`), said);
    if (/too short/.test(said)) assert.ok(c2 < 25 && /Open the hinge/.test(said)); else { assert.match(said, /too long[\s\S]*Close the hinge/); assert.ok(c2 > 25); }
  }
  assert.equal(passes, 1);
  assert.equal(hinge.check(hinge.solution), true);
  // the snapping keeps the rod length and lands on whole multiples of 5°
  for (const p of [{ x: 9, y: 1 }, { x: 5.3, y: 7 }, { x: 0.2, y: 2.2 }, { x: 5, y: -3 }, { x: 11, y: 1.6 }]) {
    const q = hinge.widget.points.B.constrain(p);
    near(hypot(C, q), 4, 1e-9);
    const deg = angleAt(A, C, q);
    near(deg / 5, Math.round(deg / 5), 1e-9); assert.ok(deg >= 20 - 1e-9 && deg <= 160 + 1e-9);
  }

  // the law of sines explorer: every grid position of C
  const explore = fixed(L6, 'explore-sines');
  const pts = explore.widget.points;
  let obtuse = 0;
  let total = 0;
  for (const x of range(0.5, 11.5, 0.5)) for (const y of range(2, 7.5, 0.5)) {
    const Cp = pts.C.constrain({ x, y });
    assert.deepEqual(Cp, { x, y }, 'grid positions inside the allowed region stay where they are');
    const angles = [angleAt(pts.B, pts.A, Cp), angleAt(pts.A, pts.B, Cp), angleAt(pts.A, Cp, pts.B)];
    near(angles[0] + angles[1] + angles[2], 180, 1e-9);
    const biggest = Math.max(...angles);
    const said = explore.check({ C: Cp });
    if (Math.abs(biggest - 90) < 1e-6) assert.notEqual(said, true, 'a right angle is not "bigger than 90°"');
    else assert.equal(said === true, biggest > 90, `C at (${x}, ${y}): largest angle ${biggest}`);
    total++;
    if (said === true) obtuse++;
    // what the explanation claims: the three ratios agree, everywhere
    const sides = [hypot(pts.B, Cp), hypot(pts.A, Cp), hypot(pts.A, pts.B)];
    const ratios = sides.map((side, i) => side / sind(angles[i]));
    near(ratios[0], ratios[1], 1e-9); near(ratios[1], ratios[2], 1e-9);
    explore.widget.readouts.forEach((ro, i) => near(ro.value({ dist: (p, q) => hypot(p === 'C' ? Cp : pts[p], q === 'C' ? Cp : pts[q]), angle: (p, v, q) => angleAt(p === 'C' ? Cp : pts[p], v === 'C' ? Cp : pts[v], q === 'C' ? Cp : pts[q]) }), ratios[i], 1e-9, `readout ${i}`));
  }
  assert.ok(obtuse > 20 && obtuse < total - 20, 'both outcomes are easy to reach');
  assert.notEqual(explore.check({ C: { x: pts.C.x, y: pts.C.y } }), true, 'not done at the start');
  assert.equal(explore.check(explore.solution), true);

  // triangulation: every pair of directions
  const tri = fixed(L6, 'triangulate');
  const w = tri.widget.points;
  const want = /\*\*(\d+)° at A\*\* and \*\*(\d+)° at B\*\*/.exec(tri.text).slice(1).map(Number);
  near(hypot(w.A, w.B), 7, 1e-12, 'the stations are 7 km apart in the picture too');
  passes = 0;
  for (const a of range(20, 160, 5)) for (const b of range(20, 160, 5)) {
    const P = w.P.constrain(polar(w.A, 3, a));
    const Q = w.Q.constrain(polar(w.B, 3, 180 - b));
    near(angleAt(w.B, w.A, P), a, 1e-9); near(angleAt(w.A, w.B, Q), b, 1e-9);
    const said = tri.check({ P, Q });
    assert.equal(said === true, a === want[0] && b === want[1], `${a}° at A, ${b}° at B`);
    if (said === true) { passes++; continue; }
    if (/The line from B is right/.test(said)) assert.ok(b === want[1] && a !== want[0] && said.includes(`angle at A is ${a}°`));
    else if (/The line from A is right/.test(said)) assert.ok(a === want[0] && b !== want[1] && said.includes(`angle at B is ${b}°`));
    else assert.ok(a !== want[0] && b !== want[1] && said.includes(`${a}° at A and ${b}° at B`), said);
    // the ship is drawn where the two lines of sight really cross, or not at all
    const ship = w.S.derive({ P, Q });
    if (a + b < 180 - 1e-9) { const S = meet(w.A, a, w.B, 180 - b); near(ship.x, S.x, 1e-6); near(ship.y, S.y, 1e-6); } else assert.equal(ship, null);
  }
  assert.equal(passes, 1);
  assert.equal(tri.check(tri.solution), true);
  const S = w.S.derive(tri.solution);
  near(angleAt(w.A, S, w.B), 60, 1e-9, 'the angle at the ship, as the explanation says');
  near(hypot(w.A, S), (7 * sind(70)) / sind(60), 1e-9, 'and the law of sines gives its distance');
  assert.ok(S.y < tri.widget.y[1] && S.x > tri.widget.x[0] && S.x < tri.widget.x[1], 'the ship is inside the picture');
});

/* ------------------------------------------------- the widgets' own arithmetic */

test('widgets: the triangle is solved correctly from its angle and any one side', () => {
  for (const angle of range(1, 89)) for (const fix of ['hyp', 'adj', 'opp']) for (const size of [1, 3.5, 20]) {
    const t = sidesOf(angle, size, fix);
    near(t[fix], size, 1e-9 * size, `${fix} is the side that was given`);
    near(t.opp * t.opp + t.adj * t.adj, t.hyp * t.hyp, 1e-9 * t.hyp * t.hyp, 'Pythagoras');
    near(Math.atan2(t.opp, t.adj) / D2R, angle, 1e-9, 'the marked angle faces the opposite side');
    assert.ok(t.hyp > t.opp && t.hyp > t.adj && t.opp > 0 && t.adj > 0);
  }
  // the ratios the readouts show: opposite ÷ hypotenuse, adjacent ÷ hypotenuse, opposite ÷ adjacent
  const t = sidesOf(35, 6);
  near(t.opp / t.hyp, sind(35), 1e-12); near(t.adj / t.hyp, cosd(35), 1e-12); near(t.opp / t.adj, tand(35), 1e-12);
  assert.equal(round(t.opp / t.hyp, 2), 0.57, 'the ratio the first lesson says the ramp shows');
});

test('widgets: exact values and radian names on the unit circle', () => {
  const valueOf = (text) => {
    const m = /^(−?)(0|1|1\/2|√2\/2|√3\/2)$/.exec(text);
    assert.ok(m, `"${text}" is one of the exact values`);
    return (m[1] ? -1 : 1) * { 0: 0, 1: 1, '1/2': 0.5, '√2/2': Math.SQRT1_2, '√3/2': Math.sqrt(3) / 2 }[m[2]];
  };
  for (const deg of range(0, 360, 15)) {
    for (const v of [Math.cos(deg * D2R), Math.sin(deg * D2R)]) {
      const text = exactText(v);
      // multiples of 30° and 45° have an exact value of this kind; 15°, 75°, … do not
      if (deg % 30 === 0 || deg % 45 === 0) near(valueOf(text), v, 1e-12, `the exact value at ${deg}°`); else assert.equal(text, null, `${deg}° has no simple exact value`);
    }
    // the angle as a multiple of π, in lowest terms
    const name = radText(deg);
    if (deg === 0) { assert.equal(name, '0'); continue; }
    const m = /^(\d*)π(?:\/(\d+))?$/.exec(name);
    assert.ok(m, `"${name}" is a multiple of π`);
    const [n, d] = [m[1] === '' ? 1 : Number(m[1]), m[2] ? Number(m[2]) : 1];
    assert.notEqual(m[1], '1'); assert.equal(gcd(n, d), 1);
    near((n / d) * Math.PI, deg * D2R, 1e-12, `${deg}° in radians`);
  }
  assert.equal(radText(180), 'π'); assert.equal(radText(360), '2π'); assert.equal(radText(60), 'π/3'); assert.equal(radText(270), '3π/2');
});

/* ----------------------------------------------------------- all six lessons */

/** Every piece of text a learner can see in a concrete step. */
function strings(step) {
  const out = [step.title, step.text, step.explain, step.template, step.model, step.prefix, step.unit, step.display, ...(step.hints || [])];
  for (const o of step.options || []) out.push(o.text, o.why);
  for (const item of step.items || []) out.push(typeof item === 'string' ? item : item.text, item.why);
  for (const pair of step.pairs || []) out.push(...pair);
  for (const w of step.wrong || []) out.push(w[1]);
  for (const fig of [...(step.figures || []), step.widget].filter(Boolean)) {
    out.push(fig.alt);
    for (const value of Object.values(fig.text || {})) out.push(value);
  }
  return out.filter((text) => typeof text === 'string');
}

test('every lesson: shape, one right answer per choice, no broken text, no "wrong" answer that is accepted', () => {
  for (const id of LESSONS) {
    const lesson = lessons[id];
    assert.ok(lesson.steps.length >= 12 && lesson.steps.length <= 18, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review).length;
    assert.ok(reviews >= 2 && reviews <= 4, `${id}: ${reviews} review steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'interact').length >= 2, `${id}: at least two hands-on steps`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    for (const raw of lesson.steps) {
      const runs = typeof raw.gen === 'function' ? SEEDS : 1;
      for (let seed = 1; seed <= runs; seed++) {
        const step = resolveStep(raw, makeRng(seed * 104729 + 5), raw.id);
        const where = `${id}/${raw.id} (seed ${seed})`;
        for (const text of strings(step)) {
          assert.ok(!/undefined|NaN|Infinity|\[object/.test(text), `${where}: "${text.slice(0, 90)}"`);
          assert.ok(!/\+ -|- -|\{1\\pi\}|[^\d.]1\\pi|\b1 (metres|radians|steps|hours)\b|\b0\.\d*0 (m|km|cm)\b/.test(text), `${where}: untidy text "${text.slice(0, 120)}"`);
        }
        if (step.type !== 'info' && step.type !== 'reflect') assert.ok(step.explain || (step.options || []).some((o) => o.why) || step.type === 'bucket', `${where}: has an explanation`);
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
          for (const [value] of step.wrong) assert.ok(!accepts(step, value), `${where}: the "wrong" value ${value} would be accepted (answer ${step.answer} ± ${step.tolerance})`);
          if (step.display != null) { const [n, d = 1] = String(step.display).split('/').map(Number); near(n / d, step.answer, 1e-9, `${where}: the answer shown`); }
          if (step.tolerance != null) assert.ok(step.tolerance < Math.max(0.6, Math.abs(step.answer) * 0.02), `${where}: tolerance ${step.tolerance} is small next to ${step.answer}`);
        }
        if (step.type === 'fill') for (const b of step.blanks) assert.ok(b.kind === 'select' ? b.options.includes(b.answer) : b.answers.length > 0, `${where}: a blank has no answer`);
        if (step.type === 'interact') assert.ok(step.solution !== undefined && typeof step.check === 'function', `${where}: has a check and a solution`);
        if (step.type === 'match') assert.equal(new Set(step.pairs.map((p) => p[1])).size, step.pairs.length, `${where}: the right-hand items are all different`);
        if (step.review) assert.ok(step.explain || step.type === 'bucket', `${where}: a review step explains itself`);
      }
    }
  }
});

/* ------------------------------------------------------ teach before you ask */

/** The teaching screens added so that each lesson shows a thing before it asks for it. */
const TEACHING = {
  'right-triangle-ratios': ['same-ratio', 'example-ratios', 'example-height', 'how-big'],
  'finding-sides-angles': ['example-side', 'example-divide', 'example-angle'],
  'unit-circle': ['circle-triangle', 'quarters', 'exact-values', 'pythagoras-identity'],
  radians: ['arc-idea', 'full-turn-rule', 'convert-back', 'arc-rule'],
  'sine-waves': ['read-wave', 'sound-waves'],
  'any-triangle': ['name-parts', 'example-cos-side', 'example-cos-angle', 'example-ship'],
};
const EXAMPLE = ':::example';
/**
 * [teaching screen, the step it serves, what the screen has to say for that step, the discovery it follows (optional)].
 * A screen that names a rule found by exploring comes after the exploration and before the first step that uses the rule.
 */
const SERVES = {
  'right-triangle-ratios': [
    ['same-ratio', 'truths', ['enlargement', 'Same angle, same ratio'], 'change-angle'],
    ['names', 'label-sides', ['hypotenuse', 'opposite', 'adjacent']],
    ['names', 'which-side', ['faces the right angle', 'does not touch it', 'runs from the marked angle to the right angle']],
    ['name-it', 'read-ratios', ['\\sin\\theta', '\\cos\\theta', '\\tan\\theta', 'SOH CAH TOA']],
    ['example-ratios', 'read-ratios', [EXAMPLE, 'name the three sides first', '\\frac{12}{15}', '\\frac{9}{15}', '\\frac{12}{9}']],
    ['example-height', 'use-ratio', [EXAMPLE, 'Multiply both sides by 10', 'opposite', 'hypotenuse']],
    ['how-big', 'truths', ['always less than 1', '\\tan\\theta > 1', 'slope'], 'tan-45'],
  ],
  'finding-sides-angles': [
    ['example-side', 'pick-ratio', [EXAMPLE, 'the side you know and the side you want', 'opposite ÷ hypotenuse', 'adjacent ÷ hypotenuse', 'opposite ÷ adjacent']],
    ['recipe', 'find-side', ['Name the sides', 'Pick the ratio', 'Solve']],
    ['example-divide', 'find-hyp', [EXAMPLE, 'then divide by', 'Unknown underneath: divide']],
    ['inverse', 'find-angle', ['\\sin^{-1}', '\\cos^{-1}', '\\tan^{-1}'], 'angle-search'],
    ['example-angle', 'find-angle', [EXAMPLE, 'closest to 0.429', '25°']],
    ['inverse', 'which-tool', ['inverses']],
  ],
  'unit-circle': [
    ['circle-triangle', 'coords', ['radius 1', 'counter-clockwise', '$x$-coordinate', '$y$-coordinate', 'hypotenuse']],
    ['define', 'past-90', ['\\cos\\theta = x', '\\sin\\theta = y'], 'coords'],
    ['quarters', 'signs', ['left of the $y$-axis the cosine is negative', 'below the $x$-axis the sine is negative'], 'past-90'],
    ['quarters', 'mirror', [EXAMPLE, 'mirror image', '\\sin 150^\\circ = \\sin 30^\\circ', '\\cos 150^\\circ = -\\cos 30^\\circ']],
    ['exact-values', 'exact', ['exactly', 'reverse order']],
    ['pythagoras-identity', 'other-coordinate', [EXAMPLE, '\\sin^2\\theta + \\cos^2\\theta = 1', 'Take the square root', 'left of the $y$-axis'], 'identity'],
  ],
  radians: [
    ['arc-idea', 'wrap', ['**arc**', '**radius-lengths**']],
    ['name', 'full-turn', ['one radian', '\\frac{\\text{arc length}}{\\text{radius}}'], 'wrap'],
    ['full-turn-rule', 'turns', [EXAMPLE, '2\\pi$ radius-lengths', 'A full turn, 360°, is $2\\pi$ radians'], 'full-turn'],
    ['convert', 'deg-to-rad', [EXAMPLE, '180^\\circ = \\pi \\text{ radians}', 'multiply by $\\frac{\\pi}{180}$']],
    ['convert-back', 'rad-to-deg', [EXAMPLE, 'multiply by $\\frac{180}{\\pi}$', '3.1416']],
    ['convert-back', 'order', ['180°']],
    ['arc-rule', 'arc-length', [EXAMPLE, 's = r\\theta']],
    ['arc-rule', 'arc-degrees', ['**in radians**', 'converted first']],
  ],
  'sine-waves': [
    ['name', 'wheel', ['**period**', '**amplitude**']],
    ['amp-period', 'period', [EXAMPLE, '\\dfrac{2\\pi}{B}', '2\\pi \\div \\tfrac{1}{5} = 10\\pi'], 'wheel'],
    ['general-form', 'from-extremes', ['**midline**', '**amplitude**', '**period**', '**shift**'], 'daylight'],
    ['read-wave', 'from-extremes', [EXAMPLE, 'halfway between the extremes', 'half the distance between them']],
    ['read-wave', 'read-formula', ['\\frac{2\\pi}{10}', 'no shift', 'h = 3 + 2\\sin']],
    ['sound-waves', 'sound', [EXAMPLE, '**frequency**', 'hertz (Hz)', '1000 \\div 200 = 5']],
    ['sound-waves', 'sound-match', ['**louder**', 'larger amplitude', '**higher**', 'shorter period', 'midline']],
    ['general-form', 'sound-match', ['**shift**']],
  ],
  'any-triangle': [
    ['name-parts', 'hinge', ['**faces**', 'c^2 = a^2 + b^2', '**negative**']],
    ['law-cos', 'cos-side', ['c^2 = a^2 + b^2 - 2ab\\cos C'], 'correction'],
    ['example-cos-side', 'cos-side', [EXAMPLE, 'Taking away a negative number **adds**']],
    ['example-cos-angle', 'cos-angle', [EXAMPLE, '\\cos C = \\frac{a^2 + b^2 - c^2}{2ab}', 'A negative cosine means an angle above 90°']],
    ['law-sin', 'sin-side', ['\\frac{a}{\\sin A} = \\frac{b}{\\sin B}', '**matched pair**'], 'derive'],
    ['example-ship', 'sin-side', [EXAMPLE, '**matched pair**', 'Multiply both sides by $\\sin 70^\\circ$'], 'triangulate'],
    ['example-ship', 'ship-distance', ['180^\\circ - 50^\\circ - 70^\\circ = 60^\\circ', 'faces the angle at **B**']],
    ['law-sin', 'which-law', ['**matched pair**']],
  ],
};

test('every lesson: teach before you ask', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const id of LESSONS) {
    const steps = lessons[id].steps.map((raw) => fixed(id, raw.id));      // resolved, as the player sees them
    const roles = steps.map(role);
    const at = (stepId) => { const i = steps.findIndex((s) => s.id === stepId); assert.ok(i >= 0, `${id} has a step "${stepId}"`); return i; };
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    assert.ok(roles.filter((kind) => kind === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'teach').length <= 6, `${id}: no more than six teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const stepId of TEACHING[id]) {
      const step = steps[at(stepId)];
      assert.equal(step.type, 'info', `${id}: "${stepId}" is a teaching screen`);
      assert.ok(roles.indexOf('graded', at(stepId) + 1) > 0, `${id}/${stepId} is followed by a question`);
      assert.ok(SERVES[id].some(([teach]) => teach === stepId), `${id}/${stepId} is pinned to the step it serves`);
    }
    for (const [teach, ask, says, after] of SERVES[id]) {
      assert.equal(steps[at(teach)].type, 'info', `${id}/${teach} is a teaching screen`);
      assert.ok(at(teach) < at(ask), `${id}: "${teach}" comes before "${ask}"`);
      if (after) assert.ok(at(after) < at(teach), `${id}: "${teach}" names what "${after}" let the learner find, so it comes after it`);
      for (const phrase of says) assert.ok(steps[at(teach)].text.includes(phrase), `${id}/${teach} says "${phrase}", which "${ask}" needs`);
    }
    // review steps come back alone, weeks later: each still explains itself
    for (const step of steps.filter((s) => s.review)) assert.ok(step.explain || step.type === 'bucket', `${id}/${step.id}`);
  }
});

/** The rows of the first markdown table in a text, as arrays of cells (header first, rule line dropped). */
const tableRows = (text) => text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|') && !/^\|[\s:|-]+\|$/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
/** No variant of a generated step may be the worked example in front of it. */
function never(lessonId, stepId, isTheExample, what) {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  assert.equal(typeof raw.gen, 'function', `${lessonId}/${stepId} is generated`);
  for (let seed = 1; seed <= SEEDS; seed++) {
    const step = resolveStep(raw, makeRng(seed * 31337 + 7), stepId);
    assert.ok(!isTheExample(step), `${lessonId}/${stepId} (seed ${seed}) repeats the worked example: ${what}`);
  }
}

test('teaching screens: every table a question draws on is shown first, and in full', () => {
  // lesson 1: the three names, and the three ratios
  const names = fixed(L1, 'names').text;
  for (const name of ['hypotenuse', 'opposite', 'adjacent']) assert.ok(names.includes(`[${name}]`), `the ${name} is named and coloured`);
  const sizes = tableRows(fixed(L1, 'how-big').text);
  assert.deepEqual(sizes.slice(1).map((row) => row[0]), ['20°', '45°', '70°']);
  for (const [angle, sin, cos, tan] of sizes.slice(1)) {
    const deg = parseInt(angle, 10);
    near(Number(sin), sind(deg), 0.0005 + 1e-9); near(Number(cos), cosd(deg), 0.0005 + 1e-9); near(Number(tan), tand(deg), 0.0005 + 1e-9);
    assert.ok(Number(sin) < 1 && Number(cos) < 1, 'sine and cosine stay below 1');
    assert.equal(Number(tan) > 1, deg > 45, 'the tangent passes 1 at 45°');
  }
  // lesson 3: the four quarters the "signs" question draws from, each with the signs its coordinates really have
  const quarters = tableRows(fixed(L3, 'quarters').text).slice(1);
  assert.equal(quarters.length, 4);
  quarters.forEach(([angles, where, cos, sin], i) => {
    assert.equal(angles, `${90 * i}° to ${90 * i + 90}°`);
    const mid = 90 * i + 45;
    assert.equal(cos, cosd(mid) > 0 ? '$> 0$' : '$< 0$', `cosine in the ${where} quarter`);
    assert.equal(sin, sind(mid) > 0 ? '$> 0$' : '$< 0$', `sine in the ${where} quarter`);
    assert.equal(where, `${sind(mid) > 0 ? 'upper' : 'lower'} ${cosd(mid) > 0 ? 'right' : 'left'}`);
  });
  eachSeed(L3, 'signs', (step) => {
    const deg = Number(/\\theta = (\d+)\^\\circ/.exec(step.text)[1]);
    const row = quarters[Math.floor(deg / 90)];
    assert.equal(correctOption(step).text, `$\\cos\\theta ${row[2].slice(1, 2)} 0$ and $\\sin\\theta ${row[3].slice(1, 2)} 0$`, `the table on the teaching screen answers ${deg}°`);
  });
  // … and all six exact values that the "exact" question can ask for
  const exact = tableRows(fixed(L3, 'exact-values').text);
  assert.deepEqual(exact[0].slice(1), ['30°', '45°', '60°']);
  for (const [fn, ...cells] of exact.slice(1)) {
    const f = { '$\\sin$': sind, '$\\cos$': cosd }[fn];
    assert.ok(f, `row ${fn}`);
    cells.forEach((cell, i) => near(exactValue(cell), f([30, 45, 60][i]), 1e-12, `${fn} ${[30, 45, 60][i]}° on the teaching screen`));
  }
  assert.equal(exact.length, 3);
  eachSeed(L3, 'exact', (step) => {
    const q = /\\(sin|cos) (\d+)\^\\circ/.exec(step.text);
    const row = exact.find((cells) => cells[0] === `$\\${q[1]}$`);
    assert.equal(`$${/^\$(.+)\$$/.exec(correctOption(step).text)[1]}$`, row[1 + [30, 45, 60].indexOf(Number(q[2]))], `the table answers ${q[0]}`);
  });
  // lesson 6: the three cosines the hinge and "an angle from three sides" lean on
  const cosines = tableRows(fixed(L6, 'name-parts').text);
  assert.deepEqual(cosines[0].slice(1), ['60°', '90°', '120°']);
  cosines[1].slice(1).forEach((cell, i) => near(Number(cell.replace(/\$/g, '')), cosd([60, 90, 120][i]), 1e-12));
  // lesson 5: each change in the sound that has to be matched is described on a screen above
  const sound = fixed(L5, 'sound-waves').text + fixed(L5, 'general-form').text;
  for (const [, wave] of fixed(L5, 'sound-match').pairs) {
    const word = /amplitude|period|shift|midline/.exec(wave)[0];
    assert.ok(sound.includes(word), `"${word}" is explained before the matching question`);
  }
});

/** Run a generated step with many seeds (without counting it as that step's own re-derivation). */
function eachSeed(lessonId, stepId, verify) {
  const raw = lessons[lessonId].steps.find((s) => s.id === stepId);
  for (let seed = 1; seed <= SEEDS; seed++) verify(resolveStep(raw, makeRng(seed * 9973 + 3), stepId));
}

test('teaching screens: the worked examples are right, and are never the question that follows', () => {
  // lesson 1
  near(round(6 * sind(35), 2), 3.44); near(round(12 * sind(35), 2), 6.88); near(round(3.44 / 6, 2), 0.57); near(round(6.88 / 12, 2), 0.57);
  const same = tableRows(fixed(L1, 'same-ratio').text).slice(1);
  assert.deepEqual(same, [['6 m', '3.44 m', '0.57'], ['12 m', '6.88 m', '0.57']]);
  assert.equal(9 * 9 + 12 * 12, 15 * 15);
  const ratios = fixed(L1, 'example-ratios');
  near(rightTriangle(ratios.figures[0]).opp, 12, 1e-9); near(rightTriangle(ratios.figures[0]).adj, 9, 1e-9);
  assert.deepEqual([ratios.figures[0].text.opp, ratios.figures[0].text.adj, ratios.figures[0].text.hyp], ['12', '9', '15']);
  never(L1, 'read-ratios', (s) => s.figures[0].text.hyp === '15', 'the 9-12-15 triangle');
  near(round(10 * 0.57, 1), 5.7); near(round(10 * sind(35), 1), 5.7);
  assert.ok(fixed(L1, 'example-height').text.includes('10 \\times 0.57 = 5.7'));
  never(L1, 'use-ratio', (s) => /\*\*35°\*\*/.test(s.text), 'a 35° slope');
  // lesson 2
  const side = fixed(L2, 'example-side');
  near(rightTriangle(side.figures[0]).adj, 12 * cosd(20), 1e-9);
  assert.ok(side.text.includes(`12 \\times ${cosd(20).toFixed(3)} \\approx ${round(12 * cosd(20), 1)}$ m`) && round(12 * Number(cosd(20).toFixed(3)), 1) === round(12 * cosd(20), 1));
  const under = fixed(L2, 'example-divide');
  near(rightTriangle(under.figures[0]).hyp, 9 / sind(25), 1e-9);
  assert.ok(under.text.includes(`\\dfrac{9}{${sind(25).toFixed(3)}} \\approx ${round(9 / sind(25), 1)}$ m`) && round(9 / Number(sind(25).toFixed(3)), 1) === round(9 / sind(25), 1));
  for (const stepId of ['find-side', 'find-hyp']) never(L2, stepId, (s) => [20, 25].includes(s.figures[0].angle) && [9, 12].includes(s.figures[0].size), 'the ramp or the zip wire');
  const angle = fixed(L2, 'example-angle');
  const rows = tableIn(angle.text).rows;
  const closest = Object.keys(rows).sort((p, q) => Math.abs(Number(rows[p].sin) - 3 / 7) - Math.abs(Number(rows[q].sin) - 3 / 7));
  assert.equal(closest[0], '25'); assert.equal(Math.round(Math.asin(3 / 7) / D2R), 25); assert.ok(angle.text.includes(`That is ${rows[25].sin}, in the row of **25°**`));
  assert.ok(Math.abs(Number(rows[closest[1]].sin) - 3 / 7) > Math.abs(Number(rows[25].sin) - 3 / 7) + 0.002, 'no other row is nearly as close');
  near(angle.figures[0].angle, Math.asin(3 / 7) / D2R, 1e-9); near(rightTriangle(angle.figures[0]).hyp, 7, 1e-9);
  assert.ok(angle.text.includes('\\dfrac{3}{7} \\approx 0.429') && angle.text.includes(`\\sin^{-1}(0.429) \\approx ${round(Math.asin(0.429) / D2R, 1)}^\\circ`));
  assert.equal(Math.round(Math.asin(0.429) / D2R), 25, 'the calculator value rounds to the same angle');
  never(L2, 'find-angle', (s) => /\*\*7 m\*\*/.test(s.text) && /\*\*3 m\*\*/.test(s.text), 'the numbers 3 and 7');
  assert.match(fixed(L2, 'eye-height').text, /starts at your eyes, not at your feet/);
  // lesson 3
  near(cosd(150), -cosd(30), 1e-12); near(round(cosd(150), 3), -0.866);
  assert.equal(9 * 9 + 40 * 40, 41 * 41); assert.equal(41 * 41, 1681); assert.equal(1681 - 81, 1600);
  never(L3, 'other-coordinate', (s) => /\{41\}/.test(s.text), 'a sine of 9/41');
  // lesson 4
  near((3 / 4) * 2 * Math.PI, (3 * Math.PI) / 2, 1e-12); near(round((3 * Math.PI) / 2, 2), 4.71);
  assert.ok(fixed(L4, 'convert').text.includes('\\frac{80}{180}') && fixed(L4, 'convert').text.includes('\\frac{4\\pi}{9}')); assert.equal(gcd(80, 180), 20);
  never(L4, 'deg-to-rad', (s) => /\*\*80°\*\*/.test(s.text), '80°');
  assert.ok(fixed(L4, 'convert-back').text.includes('\\dfrac{4 \\times 180^\\circ}{5} = 144^\\circ') && fixed(L4, 'convert-back').text.includes('\\approx 229.2^\\circ'));
  never(L4, 'rad-to-deg', (s) => s.answer === 144 || s.answer === 229, '4π/5 or 4 radians');
  const arc = fixed(L4, 'arc-rule');
  assert.deepEqual([arc.figures[0].r, arc.figures[0].arc], [3, 2]); assert.ok(arc.text.includes('s = 3 \\times 2 = 6$ m'));
  never(L4, 'arc-length', (s) => /\*\*3 (m|cm)\*\*/.test(s.text) || (/\*\*2 radians\*\*/.test(s.text) && s.answer === 6), 'a radius of 3, or 2 radians on a 3 m circle');
  // lesson 5
  near(periodOf((x) => 6 * Math.sin(10 * x), Math.PI / 60, 600, [0.2, 0.9, 1.7]), Math.PI / 5, 1e-9);
  near(periodOf((x) => 0.8 * Math.sin(x / 5), Math.PI / 6, 600, [0.2, 0.9, 1.7]), 10 * Math.PI, 1e-9);
  const ampFig = fixed(L5, 'amp-period').figures[0];
  const ampWave = compile(ampFig.fns[0].expr, { vars: ['x'] });
  near(periodOf((x) => ampWave({ x }), Math.PI / 60, 600, [0.2, 0.9, 1.7]), (2 * Math.PI) / 3, 1e-9); near(extremes((x) => ampWave({ x }), 0, 2 * Math.PI).max, 2, 1e-6);
  near(ampFig.segments[1].to[0] - ampFig.segments[1].from[0], (2 * Math.PI) / 3, 1e-3, 'the period marker is one period long');
  never(L5, 'period', (s) => /y = (6|0\.8)\\sin/.test(s.text), 'an amplitude of 6 or 0.8');
  const buoy = fixed(L5, 'read-wave').figures[0];
  const bob = compile(buoy.fns[0].expr, { vars: ['x'] });
  const swing = extremes((x) => bob({ x }), buoy.x[0], buoy.x[1], 16000);
  near(swing.max, 5, 1e-6); near(swing.min, 1, 1e-6); near(periodOf((x) => bob({ x }), 1, 400, [0.3, 7.1]), 10, 1e-9); assert.equal(buoy.hlines[0].y, 3);
  for (const t of [0, 1.3, 4, 7.7]) near(bob({ x: t }), 3 + 2 * Math.sin(((2 * Math.PI) / 10) * t), 1e-9);
  never(L5, 'from-extremes', (s) => blank(s, 0) === 3 && blank(s, 1) === 2, 'a midline of 3 with an amplitude of 2');
  never(L5, 'read-formula', (s) => /\{2\\pi\}\{10\}/.test(correctOption(s).text), 'a period of 10');
  const notes = fixed(L5, 'sound-waves').figures[0].fns.map((fn) => compile(fn.expr, { vars: ['x'] }));
  near(periodOf((x) => notes[0]({ x }), 0.5, 100, [0.3, 1.1]), 1000 / 200, 1e-9, 'the 200 Hz note repeats every 5 ms');
  assert.ok(periodOf((x) => notes[1]({ x }), 0.5, 100, [0.3, 1.1]) < 5 && extremes((x) => notes[1]({ x }), 0, 10).max > 1.5, 'the orange note is higher and louder');
  never(L5, 'sound', (s) => /\*\*200 Hz\*\*/.test(s.text), '200 Hz');
  // lesson 6
  const c2 = 20 * 20 + 15 * 15 - 2 * 20 * 15 * -0.423;
  near(c2, 878.8, 1e-9); near(round(cosd(115), 3), -0.423); assert.equal(round(Math.sqrt(c2), 1), 29.6); assert.equal(round(Math.sqrt(625 - 600 * cosd(115)), 1), 29.6);
  const law = fixed(L6, 'example-cos-side');
  assert.ok(law.text.includes('625 + 253.8 = 878.8') && law.text.includes('\\sqrt{878.8} \\approx 29.6'), law.text);
  near(hypot(law.figures[0].points.A, law.figures[0].points.B), Math.sqrt(625 - 600 * cosd(115)), 1e-9, 'the picture is that triangle');
  never(L6, 'cos-side', (s) => /a = (20|15)\$ and \$b = (20|15)\$/.test(s.text), 'sides of 20 and 15');
  near((81 + 225 - 441) / (2 * 9 * 15), cosd(120), 1e-12); assert.equal(81 + 225 - 441, -135);
  const back = fixed(L6, 'example-cos-angle').figures[0].points;
  near(hypot(back.A, back.B), 21, 1e-9); near(angleAt(back.A, back.C, back.B), 120, 1e-9);
  never(L6, 'cos-angle', (s) => /c = 21\$/.test(s.text), 'the 9-15-21 triangle');
  const ship = fixed(L6, 'example-ship');
  const far = (7 * sind(70)) / sind(60);
  assert.equal(round(far, 1), 7.6); assert.equal(round((7 * 0.94) / 0.866, 1), 7.6); assert.ok(ship.text.includes('\\dfrac{7 \\times 0.940}{0.866} \\approx 7.6$ km'));
  const coast = cornersByName(ship.figures[0]);
  near(hypot(coast.A, coast.B), 7, 1e-9); near(angleAt(coast.B, coast.A, coast.ship), 50, 1e-9); near(angleAt(coast.A, coast.B, coast.ship), 70, 1e-9); near(hypot(coast.A, coast.ship), far, 1e-9);
  never(L6, 'sin-side', (s) => /a = 7\$/.test(s.text), 'a side of 7');
  never(L6, 'ship-distance', (s) => /\*\*7 km\*\*/.test(s.text), 'a 7 km baseline');
});

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} has a test of its own`);
  }
});
