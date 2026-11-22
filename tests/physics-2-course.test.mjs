// Independent checks of "Physics II: Orbits & Waves". Every generated question
// is re-solved from its own wording (the numbers are parsed out of the text, or
// out of the figure the learner sees) with physics written here: circular
// motion from finite differences, orbits by stepping Newton's law of gravity,
// pendulums and springs by stepping their equations of motion, waves by adding
// sines sample by sample, refraction from the ratio of the two speeds.
// Interact steps are checked by feeding their `check` the states worked out
// here for every setting the controls allow, so that exactly the settings the
// instruction asks for are accepted. Where a widget exports the formula it
// uses, that formula is compared with the brute-force result as well.
//
//   node --test tests/physics-2-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { compile } from '../src/core/mathexpr.js';
import course from '../content/courses/physics-2/course.js';
import { G, EARTH_RADIUS, SOUND, LIGHT, aAn, grouped, groupedTex } from '../content/courses/physics-2/helpers.js';
import { flight } from '../src/widgets/orbit-cannon.js';
import { pendulumPeriod, springPeriod } from '../src/widgets/pendulum-lab.js';
import { refractAngle, LIGHT_SPEED } from '../src/widgets/light-ray.js';

const SEEDS = 200;
const g = 10;                                   // the course's stated value of g at the ground (m/s²)
const LESSONS = ['circular-motion', 'gravity-orbits', 'oscillations', 'waves', 'superposition', 'light'];
/** Every generated step of the course. Each one is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'circular-motion': ['direction', 'find-accel', 'find-force', 'max-speed'],
  'gravity-orbits': ['orbit-speed', 'weaker'],
  oscillations: ['pendulum-ratio', 'formula-use', 'spring-ratio', 'read-graph', 'other-world'],
  waves: ['measure-wavelength', 'wave-equation', 'thunder', 'crossing'],
  superposition: ['add-heights', 'harmonic-wavelength', 'harmonic-frequency', 'beat-frequency'],
  light: ['which-way', 'light-time', 'doppler'],
};
const tested = new Set();                       // generated steps that a test below has actually re-derived

const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/physics-2/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, 'physics-2', id);
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
/** Run a generated step with many seeds and hand each concrete step to `verify`. */
function eachVariant(lesson, id, verify, n = SEEDS) {
  const step = raw(lesson, id);
  assert.equal(typeof step.gen, 'function', `${lesson}/${id} is generated`);
  assert.ok(GENERATED[lesson].includes(id), `${lesson}/${id} is listed in GENERATED`);
  tested.add(`${lesson}/${id}`);
  const texts = new Set();
  for (let k = 0; k < n; k++) {
    const s = resolveStep(step, makeRng(4217 + k * 7919), id);
    texts.add(flat(s.text));
    try { verify(s); } catch (err) { err.message = `${lesson}/${id} (seed ${k}): ${err.message}\n  text: ${flat(s.text)}`; throw err; }
  }
  return texts.size;
}

const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const number = (s) => Number(String(s).replace(/,/g, ''));
const near = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} expected ${b}, got ${a}`);
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };
const correctText = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: one correct option`); return right[0].text; };
const stepsOf = (lo, hi, st = 1) => { const out = []; for (let i = 0; lo + i * st <= hi + 1e-9; i++) out.push(Math.round((lo + i * st) * 1e6) / 1e6); return out; };
const round2 = (v) => Math.round(v * 100) / 100;
const round4 = (v) => Math.round(v * 1e4) / 1e4;
const distinct = (values, msg) => assert.equal(new Set(values.map((v) => Math.round(v * 1e6))).size, values.length, `${msg}: ${values.join(', ')} are all different`);
/** The answer and every listed slip of a numeric step are different numbers, so each message can only fire for its own mistake. */
const slipsDistinct = (step) => distinct([step.answer, ...step.wrong.map((w) => w[0])], `${step.id} answer and slips`);
/** The cells of a markdown table row that starts with `label`. */
const row = (text, label) => flat(grab(new RegExp(`\\| ${label} \\|([^\\n]+)`), text)[0]).split('|').map((c) => c.trim()).filter(Boolean);

/** Every string a learner can see in a resolved step (figure markup excluded). */
function visible(step) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!['content', 'type', 'id', 'viewBox', 'color', 'expr', 'mode', 'kind', 'wave', 'body', 'medium', 'from'].includes(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/* ------------------------------------------------------------ own physics */

/** Acceleration of a point going round a circle, from the change of its velocity over a very short time. */
function circleAccel(v, radius) {
  const w = v / radius;
  const dt = 1e-6 / w;
  const vel = (t) => [-v * Math.sin(w * t), v * Math.cos(w * t)];
  const [a, b] = [vel(0), vel(dt)];
  const acc = [(b[0] - a[0]) / dt, (b[1] - a[1]) / dt];
  // at t = 0 the point is at (radius, 0): the acceleration should point at the centre, along −x
  return { size: Math.hypot(...acc), inward: -acc[0] / Math.hypot(...acc) };
}

/**
 * A ball fired horizontally at v km/s from `height` km above a planet of radius R km, where gravity at the
 * ground is gSurface m/s² and falls off as 1/r². Stepped with Newton's second law (velocity Verlet) until
 * it reaches the ground or has gone once round.
 */
function orbitNumeric(v, { R = EARTH_RADIUS, height = 882, gSurface = g, dt = 0.25 } = {}) {
  const mu = (gSurface / 1000) * R * R;
  let x = 0;
  let y = R + height;
  let vx = v;
  let vy = 0;
  let t = 0;
  let swept = 0;
  let highest = height;
  let lowest = height;
  const acc = (px, py) => { const r3 = Math.hypot(px, py) ** 3; return [(-mu * px) / r3, (-mu * py) / r3]; };
  let [ax, ay] = acc(x, y);
  for (let n = 0; n < 4e6; n++) {
    const xn = x + vx * dt + 0.5 * ax * dt * dt;
    const yn = y + vy * dt + 0.5 * ay * dt * dt;
    const [axn, ayn] = acc(xn, yn);
    const dAngle = Math.atan2(x * yn - y * xn, x * xn + y * yn);       // angle turned about the centre in this step
    const rn = Math.hypot(xn, yn);
    if (rn <= R) {
      const rPrev = Math.hypot(x, y);
      const f = (rPrev - R) / (rPrev - rn);
      return { lands: true, distance: R * (swept + Math.abs(dAngle) * f), time: t + f * dt, highest, lowest: 0 };
    }
    swept += Math.abs(dAngle);
    vx += 0.5 * (ax + axn) * dt; vy += 0.5 * (ay + ayn) * dt;
    x = xn; y = yn; ax = axn; ay = ayn; t += dt;
    highest = Math.max(highest, rn - R);
    lowest = Math.min(lowest, rn - R);
    if (swept >= 2 * Math.PI) return { lands: false, distance: null, time: t, highest, lowest };
  }
  throw new Error('the ball neither landed nor completed a lap');
}

/** Period of an oscillator x'' = accel(x), released from rest at x0: the time until it is back at its starting point (RK4). */
function periodNumeric(accel, x0, dt = 2e-4) {
  let x = x0;
  let v = 0;
  let t = 0;
  let turned = false;                           // has it reached the far turning point yet?
  for (let n = 0; n < 5e6; n++) {
    const k1x = v; const k1v = accel(x);
    const k2x = v + 0.5 * dt * k1v; const k2v = accel(x + 0.5 * dt * k1x);
    const k3x = v + 0.5 * dt * k2v; const k3v = accel(x + 0.5 * dt * k2x);
    const k4x = v + dt * k3v; const k4v = accel(x + dt * k3x);
    const vNew = v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    if (!turned && v < 0 && vNew >= 0) turned = true;
    else if (turned && v > 0 && vNew <= 0) return t + (dt * v) / (v - vNew);
    v = vNew;
    t += dt;
  }
  throw new Error('no full swing found');
}
const D2R = Math.PI / 180;
/** A real pendulum (not the small-angle one): θ'' = −(g/L)·sin θ. */
const swingPeriod = (L, degrees, gHere = g) => periodNumeric((th) => -(gHere / L) * Math.sin(th), degrees * D2R);
/** A mass m on a spring of stiffness k, pulled A metres from rest: x'' = −(k/m)·x. */
const bouncePeriod = (m, k, A = 0.04) => periodNumeric((x) => (-k / m) * x, A);

/** Angle of a ray after a boundary, from the two speeds of light (degrees from the normal; null if it cannot cross). */
function snell(angle, vBefore, vAfter) {
  const sine = (Math.sin(angle * D2R) * vAfter) / vBefore;
  return sine > 1 ? null : Math.asin(sine) / D2R;
}

/** Amplitude of a·sin(x) + b·sin(x − shift·2π), found by sampling one whole wave. */
function sumAmplitude(a, b, shift) {
  let top = 0;
  for (let i = 0; i < 20000; i++) {
    const u = i / 20000;
    top = Math.max(top, Math.abs(a * Math.sin(2 * Math.PI * u) + b * Math.sin(2 * Math.PI * (u - shift))));
  }
  return top;
}

/**
 * How many times a second two notes sounded together fade out. Each note is a turning arrow of length 1
 * (turning fA or fB times a second); the loudness of the pair goes with the length of the two arrows added
 * tip to tail. The quiet moments, when that sum all but vanishes, are counted over `seconds`.
 */
function beatsPerSecond(fA, fB, seconds = 2, rate = 4000) {
  const size = (t) => Math.hypot(Math.sin(2 * Math.PI * fA * t) + Math.sin(2 * Math.PI * fB * t), Math.cos(2 * Math.PI * fA * t) + Math.cos(2 * Math.PI * fB * t));
  let dips = 0;
  for (let i = 1; i < seconds * rate; i++) {
    const [before, here, after] = [size((i - 1) / rate), size(i / rate), size((i + 1) / rate)];
    if (here < before && here <= after && here < 0.2) dips++;
  }
  return dips / seconds;
}

/* ------------------------------------------------------------ whole course */

test('course shape: six lessons of 12 to 18 steps, each with review steps, hands-on steps and a recap', () => {
  assert.equal(course.id, 'physics-2');
  assert.deepEqual(course.requires, ['physics']);
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), LESSONS);
  const mine = ['whirl-ball', 'orbit-cannon', 'gravity-probe', 'pendulum-lab', 'rope-wave', 'wave-adder', 'standing-wave', 'light-ray'];
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.ok(lesson.steps.length >= 12 && lesson.steps.length <= 18, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) if (s.type === 'numeric') assert.equal(typeof s.gen, 'function', `${id}/${s.id}: numeric review steps are generated`);
    const handsOn = lesson.steps.filter((s) => {
      if (s.type === 'interact') return true;
      const fig = s.figure && !Array.isArray(s.figure) ? s.figure : null;
      return !!fig && mine.includes(fig.type) && !fig.static;
    });
    assert.ok(handsOn.length >= 2, `${id}: ${handsOn.length} hands-on steps`);
    assert.equal(lesson.steps[0].mode, 'predict', `${id} opens with a prediction`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: next`);
    for (let i = 2; i < lesson.steps.length; i++) assert.ok(!lesson.steps.slice(i - 2, i + 1).every((s) => s.type === 'info'), `${id}: three info steps in a row`);
    for (const s of lesson.steps) if (s.type !== 'info' && s.type !== 'reflect') assert.ok(s.gen || s.explain, `${id}/${s.id} has an explanation`);
  }
  assert.equal(G, 10);
  assert.equal(EARTH_RADIUS, 6400);
  assert.equal(SOUND, 340);
  assert.equal(LIGHT, 300000);
});

test('no learner-visible text contains undefined, NaN, an object, float noise or a wrong article or plural', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        for (const text of visible(s)) {
          const where = `${id}/${step.id} seed ${k}: "${text.slice(0, 120)}"`;
          assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), where);
          assert.ok(!/\d\.\d{5,}/.test(text), `float noise in ${where}`);
          assert.ok(!/\b[Aa] \**(8\d*|11|18)(,\d{3})* (m|kg|N|Hz)\b/.test(text) && !/\b[Aa]n \**(?!8|11\b|18\b)\d[\d.,]* (m|kg|N|Hz)\b/.test(text), `a/an in ${where}`);
          assert.ok(!/\b1 (beats|loops|times|fits|radii|steps|seconds)\b/.test(text), `plural in ${where}`);
          assert.ok(!/\+ -|- -|\b1x\b/.test(text.replace(/\$[^$]*\$/g, (m) => m)), `sign in ${where}`);
        }
        if (!step.gen) break;
      }
    }
  }
  for (const lesson of Object.values(lessons)) for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
  for (let n = 1; n <= 1999; n++) {
    const an = n === 8 || n === 11 || n === 18 || (n >= 80 && n <= 89) || (n >= 800 && n <= 899);   // eight…, eleven, eighteen
    assert.equal(aAn(n), an ? 'an' : 'a', `a/an ${n}`);
  }
  assert.equal(aAn(0.5), 'a');
  assert.equal(grouped(6400000), '6,400,000');
  assert.equal(grouped(880), '880');
  assert.equal(groupedTex(64000000), '64{,}000{,}000');
});

test('every choice has exactly one correct option and no duplicates', () => {
  let seen = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'choice' && step.type !== 'multi') continue;
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(5 + k * 97), step.id);
        const right = s.options.filter((o) => o.correct).length;
        if (step.type === 'choice') assert.equal(right, 1, `${id}/${step.id} seed ${k}`);
        else assert.ok(right >= 1 && right < s.options.length, `${id}/${step.id} seed ${k}`);
        assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, `${id}/${step.id} has duplicate options`);
        for (const o of s.options) if (!o.correct && s.mode !== 'predict') assert.ok(o.why && o.why.length > 20, `${id}/${step.id}: "${o.text}" says why it is wrong`);
        seen++;
        if (!step.gen) break;
      }
    }
  }
  assert.ok(seen > 600);
});

test('numeric steps: answers that can be typed, units shown, and no listed slip equals the answer', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'numeric') continue;
      assert.equal(typeof step.gen, 'function', `${id}/${step.id}: numeric practice is generated`);
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(9 + k * 613), step.id);
        assert.ok(Number.isFinite(s.answer), `${id}/${step.id}`);
        // an answer is either exact with at most two decimals, or the question says how to round it
        if (s.tolerance == null) assert.ok(Math.abs(s.answer * 100 - Math.round(s.answer * 100)) < 1e-7, `${id}/${step.id}: ${s.answer} has at most two decimals`);
        else {
          assert.match(flat(s.text), /round to two decimal places/i, `${id}/${step.id}: a tolerance needs a rounding instruction`);
          for (const [slip] of s.wrong) assert.ok(Math.abs(slip - s.answer) > 2 * s.tolerance, `${id}/${step.id}: slip ${slip} is too close to the answer ${s.answer}`);
        }
        assert.ok(s.unit, `${id}/${step.id} shows its unit`);
        assert.ok(s.explain && s.hints.length >= 1, `${id}/${step.id} has hints and an explanation`);
        slipsDistinct(s);
      }
    }
  }
});

/* ---------------------------------------------------------------- lesson 1 */

const WAYS = { up: 'Up the screen', down: 'Down the screen', left: 'To the left', right: 'To the right' };
const wayOf = ([x, y]) => (Math.abs(x) > Math.abs(y) ? (x > 0 ? WAYS.right : WAYS.left) : (y > 0 ? WAYS.up : WAYS.down));
const PLACE = { 'to the right of the peg': [1, 0], 'above the peg': [0, 1], 'to the left of the peg': [-1, 0], 'below the peg': [0, -1] };
/** What the whirl-ball widget reports for these settings: m·v²/r towards the centre. */
const whirlState = ({ speed, radius, mass, cuts = 0 }) => ({ speed, radius, mass, accel: round4((speed * speed) / radius), force: round4((mass * speed * speed) / radius), period: round4((2 * Math.PI * radius) / speed), cut: cuts > 0, cuts });

test('lesson 1: which way the force points, and where a puck goes when the string snaps', () => {
  const kinds = new Set();
  const n = eachVariant('circular-motion', 'direction', (step) => {
    const text = flat(step.text);
    const [sense] = grab(/circles a peg \*\*(clockwise|anticlockwise)\*\*/, text);
    const [place] = grab(/Right now it is (to the right of the peg|above the peg|to the left of the peg|below the peg)/, text);
    const pos = PLACE[place];
    const inward = [-pos[0], -pos[1]];
    // the velocity is the position turned a quarter-turn: anticlockwise (x, y) → (−y, x), clockwise (x, y) → (y, −x)
    const velocity = sense === 'anticlockwise' ? [-pos[1], pos[0]] : [pos[1], -pos[0]];
    const asksForce = /Which way does the net force on the puck point\?/.test(text);
    if (!asksForce) assert.match(text, /at this instant the string snaps\. \*\*Which way does the puck move off\?/);
    kinds.add(`${asksForce}`);
    assert.equal(correctText(step), wayOf(asksForce ? inward : velocity));
    assert.deepEqual(step.options.map((o) => o.text), Object.values(WAYS));
    assert.equal(step.shuffle, false);
    // the picture shows the same situation
    const fig = step.figures[0];
    assert.equal(fig.type, 'whirl-ball');
    near(Math.cos(fig.angle * D2R), pos[0], 1e-9); near(Math.sin(fig.angle * D2R), pos[1], 1e-9);
    assert.equal(fig.dir, sense === 'anticlockwise' ? 1 : -1);
    assert.ok(fig.static && fig.arrows === false, 'the picture does not give the answer away');
    assert.ok(fig.alt.includes(place) && fig.alt.includes(`round ${sense}`));
    // each wrong option is told what it really is
    for (const o of step.options) {
      if (o.correct) continue;
      if (asksForce && o.text === wayOf(velocity)) assert.match(o.why, /the way the puck is moving/);
      if (asksForce && o.text === wayOf(pos)) assert.match(o.why, /directly away from the peg/);
      if (asksForce && o.text === wayOf([-velocity[0], -velocity[1]])) assert.match(o.why, /opposite to the way the puck is moving/);
      if (!asksForce && o.text === wayOf(inward)) assert.match(o.why, /direction of the string's pull/);
      if (!asksForce && o.text === wayOf(pos)) assert.match(o.why, /directly away from the peg/);
      if (!asksForce && o.text === wayOf([-velocity[0], -velocity[1]])) assert.ok(o.why.includes(`circling ${sense === 'anticlockwise' ? 'clockwise' : 'anticlockwise'}`));
    }
    assert.ok(step.explain.includes(wayOf(asksForce ? inward : velocity).toLowerCase()));
    assert.ok(step.explain.includes(place));
  });
  assert.equal(kinds.size, 2);
  assert.ok(n >= 14, `${n} different questions`);
});

test('lesson 1: a = v²/r, checked against the change of velocity round a circle', () => {
  eachVariant('circular-motion', 'find-accel', (step) => {
    const text = flat(step.text);
    assert.match(text, /steady/);
    const v = Number(grab(/\*\*(\d+) m\/s\*\*/, text)[0]);
    const radius = Number(grab(/(?:radius \*\*([\d.]+) m\*\*|\*\*([\d.]+) m\*\* from the centre)/, text).find((x) => x != null));
    const a = circleAccel(v, radius);
    near(step.answer, a.size, 1e-5);
    near(a.inward, 1, 1e-6, 'the acceleration points at the centre');
    near(step.answer, (v * v) / radius);
    assert.equal(step.unit, 'm/s²');
    assert.ok(step.answer >= 1 && step.answer <= 10, 'a believable acceleration');
    assert.ok(step.explain.includes(`\\frac{${v}^2}{${radius}} = \\frac{${v * v}}{${radius}} = ${step.answer} \\text{ m/s}^2`));
    assert.deepEqual(step.wrong.map((w) => w[0]), [v / radius, v * v, 0]);
  });
});

test('lesson 1: F = m·v²/r', () => {
  eachVariant('circular-motion', 'find-force', (step) => {
    const text = flat(step.text);
    const m = Number(grab(/\*\*([\d.]+) kg\*\*/, text)[0]);
    const v = Number(grab(/\*\*(\d+) m\/s\*\*/, text)[0]);
    const radius = Number(grab(/(?:radius \*\*([\d.]+) m\*\*|\*\*([\d.]+) m\*\* from its centre)/, text).find((x) => x != null));
    near(step.answer, m * circleAccel(v, radius).size, 1e-5);
    // the same from the time for one lap: F = m·(2π/T)²·r
    const T = (2 * Math.PI * radius) / v;
    near(step.answer, m * (2 * Math.PI / T) ** 2 * radius, 1e-9);
    assert.equal(step.unit, 'N');
    assert.ok(Number.isInteger(step.answer));
    near(step.wrong[2][0], (v * v) / radius, 1e-9, 'the third slip is the bare acceleration');
    assert.ok(step.hints[1].includes(`\\frac{${v}^2}{${radius}} = ${(v * v) / radius} \\text{ m/s}^2`));
    assert.ok(step.explain.includes(`\\frac{${m} \\times ${v}^2}{${radius}} = ${m} \\times ${(v * v) / radius} = ${step.answer}$ N`));
    assert.match(text, new RegExp(`^${m === 800 ? 'An' : 'A'} \\*\\*`));
  });
});

test('lesson 1: the fastest speed the tyres allow', () => {
  eachVariant('circular-motion', 'max-speed', (step) => {
    const text = flat(step.text);
    const [road] = grab(/On a (snowy|wet) road/, text);
    const m = Number(grab(/\*\*(\d+) kg\*\* car/, text)[0]);
    const F = Number(grab(/at most \*\*(\d+) N\*\*/, text)[0]);
    const radius = Number(grab(/radius \*\*(\d+) m\*\*/, text)[0]);
    const v = Math.sqrt((F * radius) / m);
    near(step.answer, v);
    assert.ok(Number.isInteger(step.answer));
    near(m * circleAccel(step.answer, radius).size, F, 1e-5, 'at that speed the bend demands exactly what the tyres can give');
    // the grip is believable for the road named: friction ÷ weight is 0.2–0.25 on snow, 0.4–0.5 in the wet
    const grip = F / (m * g);
    assert.ok(road === 'snowy' ? grip >= 0.2 && grip <= 0.25 : grip >= 0.4 && grip <= 0.5, `${road}: ${grip}`);
    assert.equal(step.unit, 'm/s');
    assert.ok(step.hints[1].includes(`\\frac{${F} \\times ${radius}}{${m}} = ${v * v}$`));
    assert.ok(step.explain.includes(`= ${v * v}$ and $v = ${v}$ m/s`) && step.explain.includes(`${F} N at most`));
  });
});

test('lesson 1: the puck experiments accept exactly what the instructions ask for', () => {
  const hook = one('circular-motion', 'hook');
  assert.match(correctText(hook), /inwards, towards the peg/);
  assert.match(correctText(one('circular-motion', 'cut-predict')), /Straight on/);
  assert.equal(one('circular-motion', 'cut-predict').options.findIndex((o) => o.correct), 1, 'path B is the second option');

  const cut = one('circular-motion', 'cut-run');
  assert.equal(typeof cut.check(whirlState({ ...cut.widget, cuts: 0 })), 'string');
  assert.match(cut.check(whirlState({ ...cut.widget, cuts: 1 })), /once more/);
  assert.equal(cut.check(whirlState({ ...cut.widget, cuts: 2 })), true);
  assert.equal(cut.check(whirlState({ ...cut.widget, ...cut.solution })), true);

  const sf = one('circular-motion', 'speed-force');
  const [m0, v0, r0, f0] = grab(/This (\d+) kg puck circles on a (\d+) m string\. At (\d+) m\/s the string pulls with \*\*(\d+) N\*\*/, flat(sf.text)).map(Number).map((x, i, a) => [a[0], a[2], a[1], a[3]][i]);
  assert.deepEqual([sf.widget.mass, sf.widget.speed, sf.widget.radius], [m0, v0, r0]);
  near(m0 * circleAccel(v0, r0).size, f0, 1e-5);
  const wanted = Number(grab(/four times as hard: (\d+) N/, flat(sf.text))[0]);
  assert.equal(wanted, 4 * f0);
  const pulls = [];
  for (const speed of stepsOf(...sf.widget.speedRange)) {
    const state = whirlState({ ...sf.widget, speed });
    near(state.force, m0 * circleAccel(speed, r0).size, 1e-5);
    pulls.push(state.force);
    const res = sf.check(state);
    assert.equal(res === true, state.force === wanted, `speed-force ${speed}`);
    if (res !== true) { assert.ok(res.includes(`At ${speed} m/s the string pulls with ${state.force} N`)); assert.match(res, state.force < wanted ? /more speed/ : /Slow down/); }
  }
  assert.equal(sf.solution.speed, 2 * v0, 'twice the speed gives four times the pull');
  assert.deepEqual(row(sf.explain, 'Pull \\(N\\)').map(Number), pulls);
  assert.deepEqual(row(sf.explain, 'Speed \\(m/s\\)').map(Number), stepsOf(...sf.widget.speedRange));

  const rf = one('circular-motion', 'radius-force');
  const fig = rf.figures[0];
  const at = (radius) => whirlState({ ...fig, radius }).force;
  assert.match(flat(rf.text), /speed stays at 4 m\/s/);
  assert.equal(fig.speed, 4);
  near(at(2) / at(1), 0.5);
  near(at(1), fig.mass * circleAccel(fig.speed, 1).size, 1e-5);
  const [r1, r2] = [...rf.template.matchAll(/At (\d) m/g)].map((m) => Number(m[1]));
  assert.deepEqual([r1, r2], [1, 2]);
  assert.deepEqual(rf.blanks.slice(0, 2).map((b) => b.numbers[0]), [at(r1), at(r2)]);
  assert.equal(rf.blanks[2].answer, 'halves');
  assert.ok(flat(rf.explain).includes(`${at(1)} N at 1 m to ${at(2)} N at 2 m`) && flat(rf.explain).includes(`${at(0.5)} N at 0.5 m`));
  assert.ok(stepsOf(...fig.radiusRange).includes(1) && stepsOf(...fig.radiusRange).includes(2) && stepsOf(...fig.radiusRange).includes(0.5));

  const formula = one('circular-motion', 'teach-force').text;      // the worked puck example moved here with F = m·v²/r
  assert.match(formula, /\\frac\{2 \\times 4\^2\}\{1\} = 32\$ N/);
  near((2 * 4 ** 2) / 1, 32);
  assert.match(correctText(one('circular-motion', 'ice')), /along the tangent/);
  assert.match(correctText(one('circular-motion', 'passenger')), /carry straight on .* door pushes you inwards/);
  const match = one('circular-motion', 'match');
  assert.deepEqual(match.pairs.map((p) => p[1]), ['The pull of the string', 'Friction from the road', 'Gravity', 'The push of the drum wall']);
});

/* ---------------------------------------------------------------- lesson 2 */

/** What the orbit-cannon widget reports for one launch speed, from the stepped orbit above. */
function cannonState(speed, launched = true) {
  const o = orbitNumeric(speed);
  return { speed, launched, lands: o.lands, orbits: !o.lands, distance: o.lands ? o.distance : null, time: o.time / 60, highest: Math.round(o.highest), lowest: Math.round(o.lowest) };
}

test('lesson 2: the stepped orbit agrees with the formula the cannon widget uses', () => {
  for (const v of stepsOf(1, 8, 0.5)) {
    const a = orbitNumeric(v);
    const b = flight(v);
    assert.equal(a.lands, b.lands, `${v} km/s lands`);
    if (a.lands) near(a.distance, b.distance, 2e-3, `${v} km/s landing distance`);
    else near(a.highest, b.highest, 5e-3, `${v} km/s greatest height`);
    near(a.time, b.total, 2e-3, `${v} km/s time`);
  }
  // circular speed at the top of the mountain, and just above the ground: v² / r = g(r)
  const r0 = EARTH_RADIUS + 882;
  const gTop = g * (EARTH_RADIUS / r0) ** 2;
  near(Math.sqrt((gTop / 1000) * r0), 7.5, 1e-4);
  near(Math.sqrt((g / 1000) * EARTH_RADIUS), 8, 1e-12);
  assert.ok(flight(7.5).circular && !flight(8).circular && !flight(7).circular);
  const lap = orbitNumeric(7.5);
  assert.ok(lap.highest - lap.lowest < 2, 'at 7.5 km/s the height never changes by more than 2 km');
});

test('lesson 2: the four kinds of path: falls back, circle, stretched loop, escape', () => {
  // Added in review. With gravity g·R²/r² the speed for a circle at the mountain top is √(g·R²/r0), and √2 times
  // that is the escape speed. The widget's formula is compared with the energy of the ball and with a stepped flight.
  const r0 = EARTH_RADIUS + 882;
  const mu = (g / 1000) * EARTH_RADIUS ** 2;                 // km³/s²
  const vCircle = Math.sqrt(mu / r0);
  const vEscape = Math.SQRT2 * vCircle;
  near(vCircle, 7.5, 1e-4); near(vEscape, 10.606, 1e-4);
  const energy = (v) => (v * v) / 2 - mu / r0;                // per kilogram; negative: bound to the planet
  /** Stepped flight of a ball that leaves: the time and the angle round the centre at which it is 4·r0 away. */
  const leave = (v, dt = 0.25) => {
    let [x, y, vx, vy, t] = [0, r0, v, 0, 0];
    const acc = (px, py) => { const r3 = Math.hypot(px, py) ** 3; return [(-mu * px) / r3, (-mu * py) / r3]; };
    let [ax, ay] = acc(x, y);
    for (let n = 0; n < 4e6; n++) {
      const xn = x + vx * dt + 0.5 * ax * dt * dt;
      const yn = y + vy * dt + 0.5 * ay * dt * dt;
      const [axn, ayn] = acc(xn, yn);
      const [rp, rn] = [Math.hypot(x, y), Math.hypot(xn, yn)];
      if (rn >= 4 * r0) { const f = (4 * r0 - rp) / (rn - rp); return { time: t + f * dt, angle: Math.atan2(x + f * (xn - x), y + f * (yn - y)) }; }
      vx += 0.5 * (ax + axn) * dt; vy += 0.5 * (ay + ayn) * dt;
      [x, y, ax, ay, t] = [xn, yn, axn, ayn, t + dt];
    }
    throw new Error('the ball never got away');
  };
  for (const v of [1, 3, 5, 6.5, 7, 7.2, 7.5, 7.6, 8, 9, 10, 10.5, 10.7, 11, 12, 20]) {
    const f = flight(v);
    assert.equal(f.escapes, energy(v) >= 0, `${v} km/s escapes exactly when its energy is not negative`);
    assert.equal(f.lands || f.orbits || f.escapes, true);
    assert.equal([f.lands, f.orbits, f.escapes].filter(Boolean).length, 1, `${v} km/s is exactly one of: lands, orbits, escapes`);
    if (f.escapes) {
      assert.ok(v >= vEscape);
      const mine = leave(v);
      near(f.total, mine.time, 2e-3, `${v} km/s: time to get 4·r0 away`);
      near(f.phiEnd, mine.angle, 2e-3, `${v} km/s: angle round the planet by then`);
      near(f.rAt(f.phiEnd), 4 * r0, 1e-9);
      assert.ok(Number.isFinite(f.total) && f.total > 0 && f.total < 3 * 3600);
      assert.equal(f.highest, Infinity);
      // it never turns back: the distance from the centre only grows along the path
      for (let i = 1; i <= 50; i++) assert.ok(f.rAt((f.phiEnd * i) / 50) > f.rAt((f.phiEnd * (i - 1)) / 50));
    } else if (f.orbits) {
      assert.ok(v < vEscape);
      // a closed loop: back at the cannon after one turn, and its far point follows from the energy (semi-major axis −μ/2E)
      near(f.rAt(2 * Math.PI), r0, 1e-9);
      const a = -mu / (2 * energy(v));
      near(Math.max(f.highest, f.lowest) + Math.min(f.highest, f.lowest) + 2 * EARTH_RADIUS, 2 * a, 1e-9, `${v} km/s: nearest + farthest = 2a`);
      near(f.total, 2 * Math.PI * Math.sqrt(a ** 3 / mu), 1e-3, `${v} km/s: Kepler's third law for the lap time`);
      assert.equal(v > vCircle + 0.01, f.highest > 882 + 1, 'faster than the circular speed: it swings out further than the mountain top');
    } else {
      assert.ok(v < vCircle, 'only shots slower than the circular speed can come down');
      near(f.rAt(f.phiEnd), EARTH_RADIUS, 1e-9);
    }
  }
  assert.ok(flight(7.5).circular && flight(7.5).orbits);
  // the only use in the course stops at 8 km/s, well short of escape
  assert.ok(one('gravity-orbits', 'cannon').widget.speedRange[1] < vEscape);
});

test('lesson 2: only 7.5 km/s is the lowest speed on the slider that never lands', () => {
  const hook = one('gravity-orbits', 'hook');
  assert.match(correctText(hook), /never lands/);
  for (const v of hook.figures[0].ghosts) assert.ok(orbitNumeric(v).lands, `the dashed ${v} km/s shot lands`);
  assert.ok(orbitNumeric(hook.figures[0].ghosts[1]).distance > orbitNumeric(hook.figures[0].ghosts[0]).distance);
  assert.match(hook.explain, /1728/);

  const cannon = one('gravity-orbits', 'cannon');
  const speeds = stepsOf(...cannon.widget.speedRange);
  const states = speeds.map((v) => cannonState(v));
  const lowest = states.find((s) => s.orbits).speed;
  assert.equal(lowest, 7.5);
  for (const state of states) {
    const res = cannon.check(state);
    assert.equal(res === true, state.speed === lowest, `cannon ${state.speed}`);
    if (state.lands) {
      const quoted = number(grab(/comes down ([\d,]+) km from the foot/, res)[0]);
      assert.ok(Math.abs(quoted - state.distance) <= 12, `${state.speed} km/s: quoted ${quoted}, stepped ${state.distance}`);
      assert.equal(quoted, Math.round(flight(state.speed).distance / 10) * 10, 'the same number the widget shows');
      assert.match(res, /faster/);
    } else if (res !== true) {
      const quoted = number(grab(/swings out to ([\d,]+) km above the ground/, res)[0]);
      assert.ok(Math.abs(quoted - state.highest) <= 25, `${state.speed} km/s: quoted ${quoted}, stepped ${state.highest}`);
    }
    assert.equal(typeof cannon.check({ ...state, launched: false }), 'string');
  }
  assert.equal(cannon.solution.speed, lowest);
  // "At 7 km/s the ball gets about a quarter of the way round"
  const seven = orbitNumeric(7).distance / (2 * Math.PI * EARTH_RADIUS);
  assert.ok(seven > 0.22 && seven < 0.26, `7 km/s goes ${seven} of the way round`);
  assert.match(cannon.hints[1], /At 7 km\/s the ball gets about a quarter of the way round/);
  // "comes back to the cannon after 102 minutes"
  near(Number(grab(/after (\d+) minutes/, flat(cannon.explain))[0]), orbitNumeric(7.5).time / 60, 5e-3);
  assert.match(flat(cannon.text), /about 880 km/);
  assert.ok(Math.abs((cannon.widget.height ?? 882) - 880) <= 2);
});

test('lesson 2: 8 km/s from the falling ball, from the curve of the Earth and from v²/r = g', () => {
  const falling = flat(one('gravity-orbits', 'falling').text);
  assert.match(falling, /In one second a ball falls \[5 m\]\{\.red\}/);
  near(0.5 * g * 1 ** 2, 5);
  assert.match(falling, /over 8 km, the round Earth's surface drops away by \[5 m\]\{\.blue\}/);
  // how far the ground lies below a level line 8 km long: R − √(R² − d²)
  const drop = (EARTH_RADIUS - Math.sqrt(EARTH_RADIUS ** 2 - 8 ** 2)) * 1000;
  near(drop, 5, 1e-3);
  assert.match(falling, /g = 10 \\text\{ m\/s\}\^2\$ and no air/);

  const eight = one('gravity-orbits', 'eight');
  assert.match(flat(eight.text), /6,400 km, which is 6,400,000 m/);
  const [v2, v, km] = eight.blanks;
  assert.equal(number(v2.answer), g * EARTH_RADIUS * 1000);
  assert.equal(number(v.answer), Math.sqrt(g * EARTH_RADIUS * 1000));
  assert.deepEqual(km.numbers, [Math.sqrt(g * EARTH_RADIUS * 1000) / 1000]);
  assert.equal(new Set(v2.options.map(number)).size, 3);
  near(orbitNumeric(8, { height: 0.001 }).highest, 0.001, 1, 'at 8 km/s a ball just above the ground stays there');
  // the measured values quoted in the explanation
  near(Math.sqrt(9.8 * 6370e3) / 1000, 7.9, 2e-3);
  assert.match(flat(eight.explain), /g = 9\.8 \\text\{ m\/s\}\^2\$ and \$r = 6\{,\}370\$ km, it comes to 7\.9 km\/s/);
});

test('lesson 2: orbital speed just above a smaller world', () => {
  eachVariant('gravity-orbits', 'orbit-speed', (step) => {
    const text = flat(step.text);
    const [km, metres] = grab(/radius of \*\*([\d,]+) km\*\*, which is ([\d,]+) m/, text).map(number);
    assert.equal(metres, km * 1000);
    const gHere = Number(grab(/accelerate at \*\*\$([\d.]+) \\text\{ m\/s\}\^2\$\*\*/, text)[0]);
    const v = Math.sqrt(gHere * metres);
    near(step.answer, v);
    assert.ok(Number.isInteger(step.answer));
    assert.equal(step.unit, 'm/s');
    // step the orbit: at that speed a satellite skimming this world neither rises nor falls
    const lap = orbitNumeric(step.answer / 1000, { R: km, height: 0.05, gSurface: gHere, dt: 0.25 });
    assert.ok(!lap.lands && lap.highest - lap.lowest < 0.5, `stays level: ${lap.lowest} to ${lap.highest} km`);
    assert.ok(orbitNumeric(step.answer / 1000 - 0.05, { R: km, height: 0.05, gSurface: gHere, dt: 0.25 }).lands, 'a little slower, and it comes down');
    near(gHere / km, g / EARTH_RADIUS, 1e-9, 'a world of the same rock as the Earth: surface gravity in step with radius');
    assert.notEqual(gHere * km, step.answer, 'using kilometres by mistake does not happen to give the answer');
    assert.ok(step.hints[1].includes(`${gHere} \\times ${groupedTex(metres)} = ${groupedTex(v * v)}`));
    assert.ok(step.explain.includes(`= ${groupedTex(v * v)}$ and $v = ${groupedTex(v)}$ m/s`) && step.explain.includes(`That is ${v / 1000} km/s`));
    assert.ok(step.answer < 8000, 'slower than round the Earth, as the explanation says');
  });
});

test('lesson 2: the inverse-square law, on the probe, in the table and in the questions', () => {
  const probe = one('gravity-orbits', 'inverse-square');
  assert.match(flat(probe.text), /1 Earth radius \(6,400 km\)/);
  const [quarter] = grab(/a quarter of that: ([\d.]+) N/, flat(probe.text)).map(Number);
  assert.equal(quarter, g / 4);
  const accepted = [];
  for (const d of stepsOf(1, probe.widget.max, probe.widget.step)) {
    const pull = g / (d * d);
    const res = probe.check({ distance: d, pull: round4(pull), weaker: d * d, visited: [d] });
    assert.equal(res === true, Math.abs(pull - quarter) < 1e-9, `probe at ${d}`);
    if (res === true) accepted.push(d);
    else {
      const quoted = Number(grab(/pull (?:on the kilogram )?is (?:still |down to )?([\d.]+) N/, res)[0]);
      assert.ok(Math.abs(quoted - pull) <= 0.006, `at ${d} radii the message quotes ${quoted} N for ${pull}`);
      assert.match(res, pull > quarter ? /Go further out/ : /Come back in/);
    }
  }
  assert.deepEqual(accepted, [2]);
  assert.equal(probe.solution.distance, 2);
  assert.match(probe.check({ distance: 4 }), /a sixteenth of 10 N/);
  near(g / 9, 1.11, 2e-3);
  assert.match(flat(probe.explain), /a ninth \(1\.11 N\)/);

  const law = one('gravity-orbits', 'law').text;
  const radii = row(law, 'Distance from the centre \\(Earth radii\\)').map(Number);
  row(law, 'Times weaker than at the ground').map(Number).forEach((w, i) => assert.equal(w, radii[i] ** 2));
  row(law, 'Pull on each kilogram \\(N\\)').map(Number).forEach((p, i) => near(p, g / radii[i] ** 2, 2e-3));

  let byHeight = 0;
  eachVariant('gravity-orbits', 'weaker', (step) => {
    const text = flat(step.text);
    const W = Number(grab(/weighs \*\*(\d+) N\*\*/, text)[0]);
    let k;
    const height = /\*\*([\d,]+) km above the ground\*\*/.exec(text);
    if (height) {
      assert.match(text, /The Earth's radius is 6,400 km/);
      k = (EARTH_RADIUS + number(height[1])) / EARTH_RADIUS;
      byHeight++;
      assert.ok(step.hints[0].includes(`${grouped(EARTH_RADIUS)} + ${height[1]} = ${grouped(k * EARTH_RADIUS)} km`));
      // the slip of measuring from the ground instead of from the centre
      const fromGround = W / (number(height[1]) / EARTH_RADIUS) ** 2;
      assert.ok(step.wrong.some((w) => Math.abs(w[0] - fromGround) < 1e-9), 'the "measured from the ground" slip is listed');
      assert.ok(Number.isInteger(fromGround), 'and is a number a learner can arrive at');
    } else {
      k = Number(grab(/\*\*(\d+) Earth radii from the centre of the Earth\*\*/, text)[0]);
    }
    assert.ok(Number.isInteger(k) && k >= 2);
    near(step.answer, W / (k * k));
    assert.ok(Number.isInteger(step.answer));
    assert.equal(step.unit, 'N');
    assert.ok(step.explain.includes(`$${k}^2 = ${k * k}$ times weaker: $\\frac{${W}}{${k * k}} = ${step.answer}$ N`));
    assert.ok(step.wrong.some((w) => Math.abs(w[0] - W / k) < 1e-9 && w[1].includes(`${k} times as far means ${k * k} times weaker`)));
  });
  assert.ok(byHeight > 40 && byHeight < SEEDS - 40);
});

test('lesson 2: gravity at the Space Station, real orbits and the Moon', () => {
  const iss = one('gravity-orbits', 'iss');
  const fraction = (EARTH_RADIUS / (EARTH_RADIUS + 400)) ** 2;
  assert.ok(Math.abs(fraction * 100 - iss.answer) <= iss.tolerance, `gravity 400 km up is ${fraction * 100}% of its value at the ground`);
  assert.match(flat(iss.explain), /\\left\(\\frac\{6400\}\{6800\}\\right\)\^2 \\approx 0\.89/);
  near(fraction, 0.89, 6e-3);
  near(700 * fraction, 620, 2e-3);
  assert.match(flat(iss.explain), /weighs 700 N on the ground still weighs about 620 N/);
  assert.equal(iss.mode, 'predict');
  const floating = one('gravity-orbits', 'floating');
  assert.match(correctText(floating), /falling around the Earth together with the station/);
  near(400 / EARTH_RADIUS, 1 / 16);
  assert.ok(floating.options.some((o) => /sixteenth of the Earth's radius/.test(o.why || '')));

  // The table of real orbits is consistent with itself and with the measured strength of the Earth's gravity
  // (G·M = 398 600 km³/s²): speed = √(GM/r), and one lap = 2πr ÷ speed.
  const table = one('gravity-orbits', 'higher-slower');
  const GM = 398600;
  const rows = [...table.text.matchAll(/\| ([A-Za-z ]+) \| ([\d,]+) km \| ([\d.]+) km\/s \| ([\d.]+) (min|h|day|days) \|/g)];
  assert.equal(rows.length, 4);
  const seconds = { min: 60, h: 3600, day: 86400, days: 86400 };
  let last = null;
  for (const [, name, rText, vText, lapText, unit] of rows) {
    const [r, v, lap] = [number(rText), Number(vText), Number(lapText) * seconds[unit]];
    near(v, Math.sqrt(GM / r), 0.03, `${name}: speed`);
    near(lap, (2 * Math.PI * r) / Math.sqrt(GM / r), 0.03, `${name}: time for one lap`);
    if (last) assert.ok(r > last.r && v < last.v && lap > last.lap, 'higher is slower and takes longer');
    last = { r, v, lap };
  }
  assert.deepEqual(table.blanks.map((b) => b.answer), ['slower', 'longer', 'hang still in the sky']);
  near((2 * Math.PI * 42200) / Math.sqrt(GM / 42200) / 3600, 23 + 56 / 60, 5e-3, 'one lap at 42 200 km takes 23 h 56 min');
  assert.match(flat(table.explain), /23 h 56 min/);

  const moon = one('gravity-orbits', 'moon-test');
  assert.match(flat(moon.text), /60 Earth radii .* 1,020 m\/s round a circle of radius 384,000,000 m/);
  near(384000 / EARTH_RADIUS, 60, 1e-9);
  const [weaker, accel] = moon.blanks;
  assert.deepEqual(weaker.numbers, [60 ** 2]);
  near(Number(accel.answer), circleAccel(1020, 384e6).size, 0.01);
  near(g / 3600, 0.0028, 0.01);
  near(1020 ** 2, 1040400);
  assert.match(flat(moon.explain), /1020\^2 = 1\{,\}040\{,\}400/);
  near((2 * Math.PI * 384e6) / 1020 / 86400, 27.3, 5e-3, 'the speed and radius quoted give a month of 27.3 days');

  const sort = one('gravity-orbits', 'sort');
  const truth = (t) => /only force|falling towards|speed stays the same|acceleration points at the centre/.test(t);
  for (const item of sort.items) assert.equal(item.bucket === 0, truth(item.text), item.text);
  assert.equal(sort.items.filter((i) => i.bucket === 1).length, 3);
});

/* ---------------------------------------------------------------- lesson 3 */

const formulaPendulum = (L, gHere = g) => 2 * Math.PI * Math.sqrt(L / gHere);
const formulaSpring = (m, k) => 2 * Math.PI * Math.sqrt(m / k);
/** What pendulum-lab reports for one pendulum setting, from the stepped pendulum above. */
const pendState = (set, extra = {}) => ({ mode: 'pendulum', ...set, period: round4(swingPeriod(set.length, set.angle)), formula: round4(formulaPendulum(set.length)), ran: true, ...extra });
const shown = (seconds) => String(round2(seconds));      // a period as the lesson's messages print it

test('lesson 3: the stepped pendulum and spring agree with the widget and with the formulas the lesson states', () => {
  for (const L of [0.2, 0.8, 1, 1.8, 2]) for (const angle of [5, 20, 40]) near(swingPeriod(L, angle), pendulumPeriod(L, angle), 1e-6, `pendulum ${L} m, ${angle}°`);
  for (const m of [0.1, 0.4]) for (const k of [10, 40]) {
    near(bouncePeriod(m, k), springPeriod(m, k), 1e-6, `spring ${m} kg, ${k} N/m`);
    near(springPeriod(m, k), formulaSpring(m, k));
    near(bouncePeriod(m, k, 0.08), bouncePeriod(m, k, 0.02), 1e-7, 'a spring keeps its period whatever the amplitude');
  }
  // Small swings: T = 2π√(L/g) is what the pendulum widget shows at 5°, to the two decimals on screen, for every length on its slider.
  for (const L of stepsOf(0.2, 2, 0.2)) assert.equal(round2(swingPeriod(L, 5)), round2(formulaPendulum(L)), `${L} m at 5°`);
  // Wide swings take a little longer, which is what "for small swings" warns about.
  assert.ok(swingPeriod(1, 40) > swingPeriod(1, 20) && swingPeriod(1, 20) > swingPeriod(1, 5) && swingPeriod(1, 5) > formulaPendulum(1));
  near(swingPeriod(1, 40) / formulaPendulum(1), 1.031, 1e-3);
  // the mass is in neither equation of motion for the pendulum; for the spring it is, as √m
  near(bouncePeriod(0.4, 10) / bouncePeriod(0.1, 10), 2, 1e-6);
  near(bouncePeriod(0.4, 10) / bouncePeriod(0.4, 40), 2, 1e-6);
});

test('lesson 3: the pendulum experiments accept exactly what the instructions ask for', () => {
  assert.match(correctText(one('oscillations', 'hook')), /Cleo: longer ropes/);

  const pt = one('oscillations', 'pendulum-test');
  assert.match(flat(pt.text), /This pendulum is 1 m long/);
  assert.equal(pt.widget.length, 1);
  const runs = (list) => ({ history: list.map(([mass, angle]) => ({ length: 1, mass, angle, period: round4(swingPeriod(1, angle)) })) });
  assert.match(pt.check(runs([])), /Release/);
  assert.match(pt.check(runs([[1, 10]])), /change the mass/);
  assert.match(pt.check(runs([[1, 10], [1, 10]])), /change the mass/);
  assert.match(pt.check(runs([[1, 10], [2, 10]])), /release angle/);
  assert.match(pt.check(runs([[1, 10], [1, 30]])), /change the mass/);
  assert.equal(pt.check(runs([[1, 10], [2, 10], [2, 30]])), true);
  assert.equal(pt.check(runs(pt.solution.history.map((run) => [run.mass, run.angle]))), true);
  // every history of up to three runs: accepted exactly when it contains two different masses and two different angles
  const settings = [];
  const periodAt = new Map(stepsOf(...pt.widget.angleRange).map((angle) => [angle, round4(swingPeriod(1, angle))]));
  for (const mass of stepsOf(...pt.widget.massRange)) for (const angle of stepsOf(...pt.widget.angleRange)) settings.push({ length: 1, mass, angle, period: periodAt.get(angle) });
  for (const a of settings) for (const b of settings) for (const c of [null, ...settings]) {
    const history = c ? [a, b, c] : [a, b];
    const varied = new Set(history.map((run) => run.mass)).size >= 2 && new Set(history.map((run) => run.angle)).size >= 2;
    assert.equal(pt.check({ history }) === true, varied);
  }
  for (const run of pt.solution.history) { assert.ok(stepsOf(...pt.widget.massRange).includes(run.mass)); assert.ok(stepsOf(...pt.widget.angleRange).includes(run.angle)); }
  const said = flat(pt.explain);
  assert.ok(said.includes(`the period is ${shown(swingPeriod(1, pt.widget.angle))} s`));
  assert.equal(round2(swingPeriod(1, pt.widget.angle)), round2(formulaPendulum(1)), 'the starting swing shows the period the formula gives');
  const [a5, a20, a40] = grab(/From 5° to 20° the period only creeps from ([\d.]+) s to ([\d.]+) s, and even at 40° it is ([\d.]+) s/, said).map(Number);
  assert.deepEqual([a5, a20, a40], [round2(swingPeriod(1, 5)), round2(swingPeriod(1, 20)), round2(swingPeriod(1, 40))]);

  const lt = one('oscillations', 'length-test');
  const [L0, T0] = grab(/At \*\*([\d.]+) m\*\* this pendulum takes \*\*([\d.]+) s\*\*/, flat(lt.text)).map(Number);
  const T1 = Number(grab(/twice as long: ([\d.]+) s/, flat(lt.text))[0]);
  assert.equal(lt.widget.length, L0);
  assert.equal(round2(swingPeriod(L0, lt.widget.angle)), T0);
  assert.equal(T1, round2(2 * T0));
  const fits = [];
  for (const length of stepsOf(...lt.widget.lengthRange)) {
    const state = pendState({ length, mass: lt.widget.mass, angle: lt.widget.angle });
    const res = lt.check(state);
    assert.equal(res === true, round2(state.period) === T1, `length-test ${length} m`);
    if (res === true) fits.push(length);
    else {
      assert.ok(res.includes(`${shown(state.period)} s`), `${length} m: "${res}" quotes ${shown(state.period)} s`);
      if (length !== 2 * L0) assert.match(res, state.period < T1 ? /longer still/ : /Shorten it/);
    }
    assert.equal(typeof lt.check({ ...state, ran: false }), 'string');
  }
  assert.deepEqual(fits, [4 * L0]);
  assert.equal(lt.solution.length, 4 * L0);
  const lengths = row(lt.explain, 'Length \\(m\\)').map(Number);
  assert.deepEqual(lengths, stepsOf(...lt.widget.lengthRange), 'the table lists what the slider can show');
  assert.deepEqual(row(lt.explain, 'Period \\(s\\)').map(Number), lengths.map((L) => round2(swingPeriod(L, lt.widget.angle))));
  // at this release angle, every length on the slider shows the period the small-swing formula gives
  for (const L of lengths) assert.equal(round2(swingPeriod(L, lt.widget.angle)), round2(formulaPendulum(L)), `${L} m`);
  near(swingPeriod(9 * L0, 2) / swingPeriod(L0, 2), 3, 1e-6, 'nine times the length, three times the period');

  const info = one('oscillations', 'name-it').text;
  assert.match(info, /2\\pi\\sqrt\{0\.1\} \\approx 1\.99/);
  near(formulaPendulum(1), 1.99, 2e-3);
  assert.match(info, /small swings/);
  assert.match(flat(one('oscillations', 'teach-graph').text), /A period of 0\.5 s means 2 swings a second: 2 Hz/);   // frequency is now defined where graphs are read
  near(1 / 0.5, 2);
});

test('lesson 3: what a change of length or mass does to a pendulum', () => {
  const kinds = new Set();
  eachVariant('oscillations', 'pendulum-ratio', (step) => {
    const text = flat(step.text);
    const T = Number(grab(/takes \*\*([\d.]+) s\*\* for each full swing/, text)[0]);
    assert.match(text, /still swings through a small angle/);
    let lengthFactor = 1;
    if (/string is replaced by one \*\*four times as long\*\*/.test(text)) lengthFactor = 4;
    else if (/string is replaced by one \*\*nine times as long\*\*/.test(text)) lengthFactor = 9;
    else if (/string is shortened to \*\*a quarter\*\* of its length/.test(text)) lengthFactor = 0.25;
    else assert.match(text, /bob is swapped for one \*\*(three times|half) as heavy\*\*, on the same string/);
    kinds.add(lengthFactor);
    // a pendulum with that period has length g·(T/2π)²; step the swing of the changed one (the mass is not in its equation of motion)
    const L = g * (T / (2 * Math.PI)) ** 2;
    const expected = T * (swingPeriod(L * lengthFactor, 2) / swingPeriod(L, 2));
    near(step.answer, expected, 1e-5);
    assert.equal(step.unit, 's');
    assert.ok(step.explain.includes(lengthFactor === 1 ? `still ${T} s` : `= ${step.answer}$ s`));
  });
  assert.equal(kinds.size, 4);
});

test('lesson 3: the pendulum formula with numbers', () => {
  eachVariant('oscillations', 'formula-use', (step) => {
    const text = flat(step.text);
    const L = Number(grab(/\*\*([\d.]+) m\*\*/, text)[0]);
    assert.match(text, /swings gently/);
    assert.match(text, /T = 2\\pi\\sqrt\{\\frac\{L\}\{g\}\}\$ with \$g = 10 \\text\{ m\/s\}\^2\$/);
    assert.match(text, /Take \$\\pi = 3\.14\$ and round to two decimal places/);
    assert.equal(step.answer, round2(2 * 3.14 * Math.sqrt(L / g)));
    assert.ok(Math.abs(step.answer - formulaPendulum(L)) <= 0.0051, 'the same to two decimals with a better value of π');
    assert.ok(Math.abs(swingPeriod(L, 5) - step.answer) < step.tolerance, 'a real pendulum swinging gently takes this long, within the tolerance');
    assert.equal(step.unit, 's');
    const root = Number(grab(/Its square root is ([\d.]+)\./, step.hints[0])[0]);
    near(root, Math.sqrt(L / g));
    assert.ok(step.hints[0].includes(`\\frac{${L}}{10} = ${round4(L / g)}$`));
    assert.ok(step.explain.includes(`2 \\times 3.14 \\times ${root} \\approx ${step.answer}$ s`));
  });
});

test('lesson 3: the spring experiment, the spring rule and its ratio questions', () => {
  const st = one('oscillations', 'spring-test');
  const [m0, k0, T0] = grab(/With ([\d.]+) kg on a (\d+) N\/m spring, the period is \*\*([\d.]+) s\*\*/, flat(st.text)).map(Number);
  const T1 = Number(grab(/halves it: ([\d.]+) s/, flat(st.text))[0]);
  assert.deepEqual([st.widget.mass, st.widget.stiffness], [m0, k0]);
  assert.equal(round2(bouncePeriod(m0, k0)), T0);
  assert.equal(T1, round2(T0 / 2));
  const target = bouncePeriod(m0, k0) / 2;
  const winners = new Set();
  for (const mass of stepsOf(...st.widget.massRange)) for (const stiffness of stepsOf(...st.widget.stiffnessRange)) {
    const period = bouncePeriod(mass, stiffness);
    for (const pull of stepsOf(...st.widget.pullRange)) {
      const state = { mode: 'spring', mass, stiffness, pull, period: round4(period), ran: true };
      const res = st.check(state);
      const halves = Math.abs(period - target) < 1e-5;
      assert.equal(res === true, halves, `spring ${mass} kg, ${stiffness} N/m, ${pull} cm`);
      if (halves) winners.add(`${mass} kg on ${stiffness} N/m`);
      else if (mass === m0 && stiffness === k0) {
        assert.match(res, pull === st.widget.pull ? /starting point: 1\.26 s/ : /the period is still 1\.26 s/);
        // the message says which way the pull was changed, and the slider goes both ways from its starting value
        assert.equal(/^Pulled down further, it has further to go but also moves faster/.test(res), pull > st.widget.pull, `${pull} cm: "${res}"`);
        assert.equal(/^Pulled down less far, it has less far to go but also moves more slowly/.test(res), pull < st.widget.pull, `${pull} cm: "${res}"`);
      } else { assert.ok(res.includes(`${shown(period)} s`)); assert.match(res, period > target ? /not quick enough/ : /too quick/); }
      assert.equal(typeof st.check({ ...state, ran: false }), 'string');
    }
  }
  assert.deepEqual([...winners], ['0.1 kg on 10 N/m', '0.2 kg on 20 N/m', '0.3 kg on 30 N/m', '0.4 kg on 40 N/m']);
  assert.ok(winners.has(`${st.solution.mass} kg on ${st.solution.stiffness} N/m`));
  assert.match(flat(st.explain), /four times as stiff\*\* \(40 N\/m\), or \*\*a quarter of the mass\*\* \(0\.1 kg\)/);
  // four settings are accepted, so the explanation must not say that there are only two ways
  assert.ok(stepsOf(...st.widget.pullRange).some((p) => p < st.widget.pull) && stepsOf(...st.widget.pullRange).some((p) => p > st.widget.pull), 'the pull slider goes both ways');
  assert.ok(!/Two ways:/.test(st.explain), 'not "Two ways": other settings are accepted too');
  assert.match(flat(st.explain), /The two simplest ways: .*\(Half the mass on a spring twice as stiff works as well\.\)/);
  assert.ok(winners.has(`${m0 / 2} kg on ${2 * k0} N/m`), 'half the mass on twice the stiffness is accepted');
  near(bouncePeriod(m0 / 2, 2 * k0), target, 1e-6);

  const rule = one('oscillations', 'spring-rule').text;
  assert.match(rule, /0\.4 kg on 10 N\/m gives \$2\\pi\\sqrt\{0\.04\} = 2\\pi \\times 0\.2 \\approx 1\.26\$ s/);
  near(0.4 / 10, 0.04); near(Math.sqrt(0.04), 0.2); near(formulaSpring(0.4, 10), 1.26, 3e-3);

  const kinds = new Set();
  eachVariant('oscillations', 'spring-ratio', (step) => {
    const text = flat(step.text);
    const T = Number(grab(/with a period of \*\*([\d.]+) s\*\*/, text)[0]);
    let [mTimes, kTimes, aTimes] = [1, 1, 1];
    if (/mass is replaced by one \*\*four times as heavy\*\*, on the same spring/.test(text)) mTimes = 4;
    else if (/mass is replaced by one \*\*nine times as heavy\*\*, on the same spring/.test(text)) mTimes = 9;
    else if (/spring is replaced by one \*\*four times as stiff\*\*, with the same mass/.test(text)) kTimes = 4;
    else { assert.match(text, /pulled down \*\*twice as far\*\* as before/); aTimes = 2; }
    kinds.add(`${mTimes}/${kTimes}/${aTimes}`);
    // a 1 kg mass with that period sits on a spring of stiffness (2π/T)²; step the changed system
    const k = (2 * Math.PI / T) ** 2;
    near(step.answer, bouncePeriod(mTimes, k * kTimes, 0.04 * aTimes), 1e-5);
    assert.equal(step.unit, 's');
    assert.ok(step.explain.includes(aTimes === 2 ? `still ${T} s` : `= ${step.answer}$ s`));
  });
  assert.equal(kinds.size, 4);
});

test('lesson 3: period and frequency read from a position–time graph', () => {
  const asks = new Set();
  eachVariant('oscillations', 'read-graph', (step) => {
    const fig = step.figures[0];
    assert.equal(fig.type, 'plot');
    const curve = compile(fig.fns[0].expr, { vars: ['x'] });
    const f = (x) => curve({ x });
    // the peaks of the drawn curve, found by scanning it
    const peaks = [];
    const dx = fig.x[1] / 60000;
    for (let i = 0; i * dx <= fig.x[1] + 1e-9; i++) {
      const x = i * dx;
      if (f(x) >= f(Math.max(0, x - dx)) && f(x) > f(x + dx)) peaks.push(x);
    }
    assert.ok(peaks.length >= 3, `${peaks.length} peaks in view`);
    const T = peaks[1] - peaks[0];
    for (let i = 1; i < peaks.length; i++) near(peaks[i] - peaks[i - 1], T, 1e-3);
    for (const p of peaks) near(p / fig.xStep, Math.round(p / fig.xStep), 1e-3, 'each peak sits on a grid line');
    const A = f(0);
    assert.ok(A <= fig.y[1] && -A >= fig.y[0], 'the curve stays on the axes');
    const text = flat(step.text);
    if (/What is the period of the motion\?/.test(text)) {
      asks.add('period'); near(step.answer, T, 1e-3); assert.equal(step.unit, 's');
      assert.ok(step.explain.includes(`the next at ${step.answer} s`));
      assert.ok(step.wrong.some((w) => Math.abs(w[0] - T / 2) < 1e-3));
    } else {
      assert.match(text, /What is its frequency\?/);
      asks.add('frequency'); near(step.answer, 1 / T, 1e-3); assert.equal(step.unit, 'Hz');
      assert.ok(step.explain.includes(`\\frac{1}{${round4(T)}} = ${step.answer}$ Hz`));
    }
    for (const [slip] of step.wrong) assert.notEqual(slip, A === step.answer ? null : step.answer);
    assert.ok(fig.alt.includes(`peak of ${A} centimetres`) && fig.alt.includes(`${round4(T)} s and ${round4(2 * T)} s after the start`));
    assert.equal(fig.xLabel, 'time (s)');
  });
  assert.equal(asks.size, 2);
});

test('lesson 3: a pendulum on another world, energy, and what changes the period', () => {
  const places = new Set();
  eachVariant('oscillations', 'other-world', (step) => {
    const text = flat(step.text);
    const T = Number(grab(/takes \*\*([\d.]+) s\*\* for each small swing/, text)[0]);
    const gNew = Number(grab(/where \$g\$ is \$([\d.]+) \\text\{ m\/s\}\^2\$/, text)[0]);
    assert.match(text, /On Earth, take \$g = 10 \\text\{ m\/s\}\^2\$/);
    if (/the Moon/.test(text)) assert.equal(gNew, 1.6); else assert.match(text, /imaginary planet/);
    places.add(gNew);
    const L = g * (T / (2 * Math.PI)) ** 2;
    near(step.answer, T * (swingPeriod(L, 2, gNew) / swingPeriod(L, 2, g)), 1e-5);
    assert.equal(step.unit, 's');
    assert.ok(step.explain.includes(`= ${step.answer}$ s`));
    const ratio = Number(grab(/Gravity there is ([\d.]+) times (weaker|stronger)/, step.hints[1])[0]);
    near(ratio, Math.max(g / gNew, gNew / g));
    assert.equal(/weaker/.test(step.hints[1]), gNew < g);
    near(Number(grab(/The square root of [\d.]+ is ([\d.]+)\./, step.hints[1])[0]), Math.sqrt(ratio));
  });
  assert.equal(places.size, 3);

  const swap = one('oscillations', 'energy-swap');
  assert.match(correctText(swap), /lowest point, in the middle/);
  // kinetic energy = total − m·g·L·(1 − cos θ): greatest where the angle is zero, zero at the release angle
  const fig = swap.figures[0];
  const ke = (deg) => fig.mass * g * fig.length * (Math.cos(deg * D2R) - Math.cos(fig.angle * D2R));
  for (const deg of [-30, -20, -10, 10, 20, 30]) assert.ok(ke(0) > ke(deg));
  near(ke(fig.angle), 0);
  assert.equal(fig.angle, 30);
  assert.match(flat(swap.text), /released from 30°/);

  const sort = one('oscillations', 'sort');
  assert.deepEqual(sort.buckets, ['Longer period', 'Shorter period', 'No change']);
  const sign = (d) => (Math.abs(d) < 1e-6 ? 2 : d > 0 ? 0 : 1);
  const effect = (text) => {
    if (/pendulum: longer string/.test(text)) return sign(swingPeriod(2, 2) - swingPeriod(1, 2));
    if (/pendulum: shorter string/.test(text)) return sign(swingPeriod(0.5, 2) - swingPeriod(1, 2));
    if (/pendulum: taken to the Moon/.test(text)) return sign(swingPeriod(1, 2, 1.6) - swingPeriod(1, 2, g));
    if (/pendulum: heavier bob/.test(text)) return 2;                 // the mass is not in θ'' = −(g/L)·sin θ
    if (/spring: heavier mass/.test(text)) return sign(bouncePeriod(0.8, 10) - bouncePeriod(0.4, 10));
    if (/spring: stiffer spring/.test(text)) return sign(bouncePeriod(0.4, 40) - bouncePeriod(0.4, 10));
    if (/spring: pulled further before release/.test(text)) return sign(bouncePeriod(0.4, 10, 0.08) - bouncePeriod(0.4, 10, 0.04));
    throw new Error(`unexpected item: ${text}`);
  };
  for (const item of sort.items) assert.equal(item.bucket, effect(item.text), item.text);
  assert.equal(sort.items.length, 7);
});

/* ---------------------------------------------------------------- lesson 4 */

test('lesson 4: the wavelength read from a frozen picture', () => {
  eachVariant('waves', 'measure-wavelength', (step) => {
    const fig = step.figures[0];
    assert.equal(fig.type, 'rope-wave');
    assert.ok(fig.static);
    // the frozen rope is a sine curve with a crest `crestAt` metres from the hand; scan it for its crests along the 12 m ruler
    const lambdaDrawn = fig.speed / fig.freq;
    const y = (x) => Math.cos((2 * Math.PI * (x - fig.crestAt)) / lambdaDrawn);
    const crests = [];
    for (let i = 0; i <= 12000; i++) { const x = i / 1000; if (y(x) > 1 - 1e-9) crests.push(x); }
    assert.ok(crests.length >= 2, 'at least two crests on the ruler');
    for (const c of crests) assert.ok(Number.isInteger(c), 'crests sit on whole metres');
    assert.deepEqual(grab(/Crests are marked at ([\d, ]+) metres/, fig.alt)[0].split(', ').map(Number), crests);
    assert.equal(step.answer, crests[1] - crests[0]);
    assert.equal(step.unit, 'm');
    assert.match(flat(step.text), /each crest is marked, and the ruler is in metres/);
    assert.ok(step.explain.includes(`crests are at ${crests[0]} m and ${crests[1]} m`) && step.explain.includes(`${crests[1]} − ${crests[0]} = ${step.answer} m`));
    assert.ok(step.wrong.some((w) => w[0] === step.answer / 2 && /half a wavelength/.test(w[1])));
    if (crests[0] > 0) assert.ok(step.wrong.some((w) => w[0] === crests[0] && w[1].includes(`at ${crests[1]} m`)));
  });
});

test('lesson 4: the rope experiments accept exactly what the instructions ask for', () => {
  assert.match(correctText(one('waves', 'hook')), /Exactly where it started/);
  assert.match(correctText(one('waves', 'watch-bead')), /Straight up and down/);
  assert.match(correctText(one('waves', 'slinky')), /To and fro along the spring/);
  assert.equal(one('waves', 'slinky').figures[0].kind, 'longitudinal');
  const pic = one('waves', 'teach-measure');                       // the ruler picture moved here from name-it
  near(pic.figures[0].speed / pic.figures[0].freq, 4);
  assert.match(flat(pic.text), /Here it is 4 m/);
  assert.match(pic.figures[0].alt, /Crests are marked at 3, 7 and 11 metres/);
  assert.equal(pic.figures[0].crestAt, 3);
  assert.match(flat(pic.text), /crests are at 3 m and 7 m, and \$7 - 3 = 4\$/);

  const d = one('waves', 'discover');
  const v = d.widget.speed;
  const wantedLambda = Number(grab(/wavelength exactly (\d+) m/, flat(d.text))[0]);
  const ok = [];
  for (const freq of stepsOf(...d.widget.freqRange)) {
    const wavelength = round4(v / freq);
    const res = d.check({ freq, speed: v, wavelength, period: round4(1 / freq), frozen: true });
    assert.equal(res === true, Math.abs(v / freq - wantedLambda) < 1e-9, `discover ${freq} Hz`);
    if (res === true) ok.push(freq);
    else { assert.ok(res.includes(`At ${freq} Hz`) && res.includes(`${round2(v / freq)} m apart`)); assert.match(res, v / freq > wantedLambda ? /faster shaking/ : /more slowly/); }
  }
  assert.deepEqual(ok, [d.solution.freq]);
  assert.equal(d.solution.freq, v / wantedLambda);
  for (const stepText of [d.explain, one('waves', 'wave-speed').text]) {
    const fs = row(stepText, 'Frequency[^|]*').map(Number);
    const ls = row(stepText, 'Wavelength[^|]*').map(Number);
    assert.equal(fs.length, 4);
    fs.forEach((f, i) => { near(f * ls[i], v); assert.ok(stepsOf(...d.widget.freqRange).includes(f)); });
  }
  const ws = one('waves', 'wave-speed');
  assert.deepEqual(ws.blanks[0].numbers, [v]);
  assert.equal(ws.blanks[1].answer, 'speed');
  assert.match(ws.explain, /v = f \\times \\lambda/);

  assert.match(correctText(one('waves', 'medium-predict')), /A tighter rope/);
  const mt = one('waves', 'medium-test');
  const [far, t0] = grab(/flag, (\d+) m away\. On this rope it takes (\d+) s/, flat(mt.text)).map(Number);
  const tWanted = Number(grab(/arrive in (\d+) s/, flat(mt.text))[0]);
  assert.equal(far / mt.widget.speed, t0);
  const fastRopes = new Set();
  for (const amp of stepsOf(...mt.widget.ampRange)) for (const flick of stepsOf(...mt.widget.flickRange)) for (const speed of mt.widget.ropes) {
    const state = { amp, flick, speed, sent: true, travelTime: round4(far / speed) };
    const res = mt.check(state);
    assert.equal(res === true, far / speed === tWanted, `medium-test ${amp} cm, ${flick} s, ${speed} m/s`);
    if (res === true) fastRopes.add(speed);
    else if (speed === mt.widget.speed) assert.match(res, amp === mt.widget.amp && flick === mt.widget.flick ? /the 3 s you started with/ : /Still 3 s/);
    else { assert.ok(far / speed > t0); assert.ok(res.includes(`takes ${far / speed} s`)); }
    assert.equal(typeof mt.check({ ...state, sent: false }), 'string');
  }
  assert.deepEqual([...fastRopes], [mt.solution.speed]);
  assert.match(flat(mt.explain), /12 m in 2 s is 6 m\/s/);
  near(far / tWanted, mt.solution.speed);

  const sound = flat(one('waves', 'sound').text);
  assert.match(sound, /about \*\*340 m\/s\*\*\. \(That is at 15 °C\./);
  assert.match(sound, /331 m\/s at 0 °C/);
  near(331.3 + 0.606 * 15, SOUND, 2e-3);          // the usual rule for the speed of sound in air at 15 °C

  const sort = one('waves', 'sort');
  const along = (t) => /Sound|push-pull|wagons/.test(t);
  const across = (t) => /rope|guitar string|washing line/.test(t);
  for (const item of sort.items) { assert.ok(along(item.text) !== across(item.text), item.text); assert.equal(item.bucket, along(item.text) ? 1 : 0, item.text); }
});

test('lesson 4: v = f·λ in all three directions', () => {
  const kinds = new Set();
  eachVariant('waves', 'wave-equation', (step) => {
    const text = flat(step.text);
    let m;
    let speed;
    if ((m = /have a frequency of \*\*([\d.]+) Hz\*\* and a wavelength of \*\*([\d.]+) m\*\*\. How fast do they travel\?/.exec(text))) {
      near(step.answer, m[1] * m[2]); assert.equal(step.unit, 'm/s'); kinds.add('v'); speed = step.answer;
    } else if ((m = /travel at \*\*([\d.]+) m\/s\*\* and have a frequency of \*\*([\d.]+) Hz\*\*\. What is their wavelength\?/.exec(text))) {
      near(step.answer, m[1] / m[2]); assert.equal(step.unit, 'm'); kinds.add('lambda'); speed = Number(m[1]);
    } else {
      m = grab(/travel at \*\*([\d.]+) m\/s\*\* and have a wavelength of \*\*([\d.]+) m\*\*\. What is their frequency\?/, text);
      near(step.answer, m[0] / m[1]); assert.equal(step.unit, 'Hz'); kinds.add('f'); speed = Number(m[0]);
    }
    if (/^Sound waves in air/.test(text)) assert.equal(speed, SOUND);
    assert.ok(step.answer > 0);
    assert.ok(step.explain.includes(`= ${step.answer}$`));
  });
  assert.equal(kinds.size, 3);
});

test('lesson 4: thunder, echoes and a crest crossing a pool', () => {
  const kinds = new Set();
  eachVariant('waves', 'thunder', (step) => {
    const text = flat(step.text);
    assert.match(text, /Sound travels at 340 m\/s in air/);
    let m;
    if ((m = /hear its thunder \*\*(\d+) s\*\* later/.exec(text))) {
      kinds.add('thunder'); assert.equal(step.answer, SOUND * m[1]); assert.equal(step.unit, 'm');
      assert.match(text, /light arrives almost at once/);
      if (step.answer >= 1000) assert.ok(step.explain.includes(`about ${Math.round(step.answer / 100) / 10} km`));
      assert.match(step.explain, /every 3 s of waiting is about 1 km/);
    } else if ((m = /hear the echo \*\*(\d+) s\*\* later/.exec(text))) {
      kinds.add('echo'); assert.equal(step.answer, (SOUND * m[1]) / 2); assert.equal(step.unit, 'm');
      assert.ok(step.wrong.some((w) => w[0] === SOUND * m[1] && /and back/.test(w[1])));
    } else {
      m = grab(/bursts \*\*(\d+) m\*\* away/, text);
      kinds.add('delay'); near(step.answer, m[0] / SOUND); assert.equal(step.unit, 's');
    }
  });
  assert.equal(kinds.size, 3);
  near(SOUND * 3, 1000, 0.03, 'three seconds of sound is about a kilometre');

  eachVariant('waves', 'crossing', (step) => {
    const text = flat(step.text);
    const L = Number(grab(/pool \*\*(\d+) m\*\* long/, text)[0]);
    const lambda = Number(grab(/crests are \*\*([\d.]+) m\*\* apart/, text)[0]);
    const f = /bobs up and down \*\*once every 2 s\*\*/.test(text) ? 1 / 2 : (assert.match(text, /bobs up and down \*\*twice every second\*\*/), 2);
    // follow one crest: each time the ball completes a bob (1/f seconds) the crest has moved on by one wavelength
    const bobsNeeded = L / lambda;
    const t = bobsNeeded / f;
    near(step.answer, t);
    assert.notEqual(step.answer, bobsNeeded, 'the number of wavelengths in the pool is not the answer by accident');
    assert.equal(step.unit, 's');
    assert.ok(step.hints[1].includes(`= ${round4(f * lambda)}$ m/s`) && step.hints[0].includes(`${f} Hz`));
    assert.ok(step.explain.includes(`\\frac{${L}}{${round4(f * lambda)}} = ${step.answer}$ s`));
  });
});

/* ---------------------------------------------------------------- lesson 5 */

test('lesson 5: displacements add', () => {
  let below = 0;
  eachVariant('superposition', 'add-heights', (step) => {
    const text = flat(step.text);
    const a = Number(grab(/wave A alone would lift it \*\*(\d+) mm\*\* above its resting level/, text)[0]);
    let b;
    let m;
    if ((m = /Wave B alone would push it \*\*(\d+) mm below\*\* that level/.exec(text))) { b = -Number(m[1]); below++; }
    else b = Number(grab(/Wave B alone would lift it \*\*(\d+) mm above\*\* that level/, text)[0]);
    assert.match(text, /Up counts as positive/);
    assert.equal(step.answer, a + b);
    assert.notEqual(step.answer, 0);
    assert.equal(step.unit, 'mm');
    assert.ok(step.explain.includes(b < 0 ? `$${a} + (-${-b}) = ${a + b}$ mm` : `$${a} + ${b} = ${a + b}$ mm`));
    if (b < 0) assert.equal(/below its resting level: B is the bigger/.test(step.explain), a + b < 0);
  });
  assert.ok(below > 60 && below < SEEDS - 40);

  const pulses = one('superposition', 'pulses');
  assert.match(pulses.check({ playedUp: false, playedFlipped: false }), /Press \*\*Play\*\*/);
  assert.match(pulses.check({ playedUp: true, playedFlipped: false }), /B is a trough/);
  assert.match(pulses.check({ playedUp: false, playedFlipped: true }), /B is a crest/);
  assert.equal(pulses.check({ playedUp: true, playedFlipped: true }), true);
  assert.equal(pulses.check(pulses.solution), true);
  assert.match(flat(pulses.explain), /stands 40 cm high, the two 20 cm humps stacked up/);
  assert.equal(20 + 20, 40);
  assert.match(flat(pulses.explain), /\+20 cm and −20 cm add up to nothing/);
  assert.match(correctText(one('superposition', 'hook')), /pass through each other and carry on unchanged/);
  assert.match(correctText(one('superposition', 'noise')), /turned upside down/);
});

test('lesson 5: sliding one wave along the other', () => {
  const shift = one('superposition', 'shift');
  const [a, b] = [shift.widget.ampA ?? 20, shift.widget.ampB ?? 20];
  const flatAt = [];
  for (const sh of stepsOf(0, 1, shift.widget.shiftStep ?? 0.125)) {
    const amp = sumAmplitude(a, b, sh);
    const res = shift.check({ mode: 'waves', shift: sh, ampA: a, ampB: b, sumAmp: round4(amp) });
    assert.equal(res === true, amp < 1e-6, `shift ${sh}`);
    if (res === true) flatAt.push(sh);
    else if (sh === 0 || sh === 1) { assert.match(res, /as \*big\* as it can get: 40 cm/); near(amp, 40, 1e-6); }
    else assert.ok(res.includes(`${Math.round(amp * 10) / 10} cm`), `${sh}: "${res}" quotes ${amp}`);
  }
  assert.deepEqual(flatAt, [0.5]);
  assert.equal(shift.solution.shift, 0.5);
  near(sumAmplitude(a, b, 0), 2 * a, 1e-6, 'crest on crest: twice as tall');
  assert.match(flat(shift.explain), /half a wavelength/);
});

test('lesson 5: which waves fit a string fixed at both ends', () => {
  const fit = one('superposition', 'fit');
  const L = Number(grab(/This string is ([\d.]+) m long/, flat(fit.text))[0]);
  assert.equal(fit.widget.length, L);
  const range = fit.widget.wavelengthRange ?? [0.4, 2.4, 0.1];
  // a wave drawn from the left-hand clamp fits when it is back at zero at the right-hand clamp
  const fits = stepsOf(...range).filter((lambda) => Math.abs(Math.sin((2 * Math.PI * L) / lambda)) < 1e-9).sort((x, y) => y - x);
  assert.deepEqual(fits, [2.4, 1.2, 0.8, 0.6, 0.4]);
  const said = flat(fit.explain);
  assert.ok(said.includes(fits.map((v) => `${v} m`).join(', ').replace(/, ([^,]+)$/, ' and $1')), 'the explanation lists every fitting wavelength on the slider');
  assert.deepEqual(fits.map((lambda) => Math.round((2 * L) / lambda)), [1, 2, 3, 4, 6]);
  assert.match(said, /1, 2, 3, 4 and 6\. \(Five fit too, at 0\.48 m/);
  near((2 * L) / 5, 0.48);
  assert.ok(!stepsOf(...range).includes(0.48));
  assert.ok(!fits.includes(fit.widget.wavelength), 'the starting wavelength does not fit');
  // The nudge after one or two fits points to wavelengths that are still to be found on this slider:
  // "shorter" must not be said once the shortest wavelength on the slider has been found.
  const lowest = Math.min(...stepsOf(...range));
  assert.ok(fits.includes(lowest));
  for (const a of fits) for (const b of [null, ...fits]) {
    if (b === a) continue;
    const found = (b == null ? [a] : [a, b]).sort((x, y) => y - x);
    const res = fit.check({ found });
    const way = grab(/Keep sliding: (shorter|longer) wavelengths fit too\./, res)[0];
    const left = fits.filter((v) => !found.includes(v));
    assert.ok(way === 'shorter' ? left.some((v) => v < Math.min(...found)) : left.some((v) => v > Math.min(...found)), `found ${found}: "${res}"`);
    assert.equal(way === 'longer', found.includes(lowest), `found ${found}: "${res}"`);
  }
  assert.match(fit.check({ found: [] }), /No fit yet/);
  assert.match(fit.check({ found: [2.4] }), /1 fit so far \(2\.4 m\)/);
  assert.match(fit.check({ found: [2.4, 1.2] }), /2 fits so far \(2\.4 m, 1\.2 m\)/);
  assert.equal(fit.check({ found: [2.4, 1.2, 0.8] }), true);
  assert.equal(fit.check(fit.solution), true);
  for (const lambda of fit.solution.found) assert.ok(fits.includes(lambda));

  const standing = one('superposition', 'standing');
  assert.match(standing.text, /L = n \\times \\frac\{\\lambda\}\{2\}/);
  const string = standing.figures[0];
  near(string.speed / (2 * string.length), 110, 1e-9, 'the fundamental of the string in the picture');

  eachVariant('superposition', 'harmonic-wavelength', (step) => {
    const text = flat(step.text);
    const len = Number(grab(/\*\*([\d.]+) m\*\* long is fixed at both ends/, text)[0]);
    const n = Number(grab(/\*\*(\d+) loops?\*\*/, text)[0]);
    const lambda = step.answer;
    // with this wavelength the wave is zero at both ends and has exactly n − 1 still points in between
    near(Math.sin((2 * Math.PI * len) / lambda), 0, 1e-9);
    let nodes = 0;
    for (let i = 1; i < 6000; i++) { const x0 = (len * (i - 0.5)) / 6000; const x1 = (len * (i + 0.5)) / 6000; if (Math.sin((2 * Math.PI * x0) / lambda) * Math.sin((2 * Math.PI * x1) / lambda) < 0) nodes++; }
    assert.equal(nodes, n - 1);
    near(lambda, (2 * len) / n);
    assert.equal(step.unit, 'm');
    const fig = step.figures[0];
    assert.deepEqual([fig.type, fig.mode, fig.length, fig.n, fig.static], ['standing-wave', 'harmonics', len, n, true]);
    assert.equal(fig.caption, false, 'the picture leaves the counting of half-wavelengths to the learner');
    assert.ok(step.explain.includes(`${round4(lambda)} m`));
    assert.ok(step.wrong.some((w) => Math.abs(w[0] - len / n) < 1e-9 && /half/.test(w[1])));
  });
});

test('lesson 5: harmonics, a shortened string, and beats', () => {
  eachVariant('superposition', 'harmonic-frequency', (step) => {
    const text = flat(step.text);
    const f1 = Number(grab(/vibrates in one loop at \*\*(\d+) Hz\*\*: its fundamental/, text)[0]);
    const n = Number(grab(/vibrate in \*\*(\d+) loops\*\*/, text)[0]);
    assert.match(text, /With nothing else changed/);
    // a string of length 1: wave speed = f1 × (wavelength of one loop = 2); with n loops the wavelength is 2/n
    const v = f1 * 2;
    near(step.answer, v / (2 / n));
    assert.equal(step.unit, 'Hz');
    assert.ok([55, 110, 196, 220, 440].includes(f1));
    assert.ok(step.explain.includes(`$${n} \\times ${f1} = ${n * f1}$ Hz`));
  });

  const fret = one('superposition', 'fret');
  const [fOpen] = grab(/fundamental at \*\*(\d+) Hz\*\*/, flat(fret.text)).map(Number);
  const [fWanted] = grab(/fundamental is (\d+) Hz/, flat(fret.text)).map(Number);
  const freq = (len) => fret.widget.speed / (2 * len);         // one loop: wavelength = 2 × length, and f = v ÷ wavelength
  near(freq(fret.widget.length), fOpen);
  const ok = [];
  for (const len of stepsOf(...fret.widget.lengthRange)) {
    const state = { mode: 'harmonics', length: len, n: 1, wavelength: round4(2 * len), frequency: round2(freq(len)), fundamental: round2(freq(len)) };
    const res = fret.check(state);
    assert.equal(res === true, Math.abs(freq(len) - fWanted) < 1e-9, `fret ${len} m`);
    if (res === true) ok.push(len);
    else { assert.ok(res.includes(`At ${len} m the string sounds ${round2(freq(len))} Hz`)); assert.match(res, freq(len) < fWanted ? /shorter still/ : /Lengthen it/); }
  }
  assert.deepEqual(ok, [fret.widget.length / 2]);
  assert.equal(fret.solution.length, fret.widget.length / 2);
  assert.match(flat(fret.explain), /from 2\.4 m to 1\.2 m/);
  near(2 * fret.widget.length, 2.4); near(2 * fret.solution.length, 1.2);

  const beats = one('superposition', 'beats');
  const fA = beats.widget.freqA;
  assert.match(flat(beats.text), /at 10 Hz/);
  assert.equal(fA, 10);
  const twice = [];
  for (const fB of stepsOf(...beats.widget.freqBRange)) {
    const counted = beatsPerSecond(fA, fB);
    assert.equal(counted, Math.abs(fA - fB), `counted swells for ${fA} Hz with ${fB} Hz`);
    const res = beats.check({ mode: 'beats', freqA: fA, freqB: fB, beat: counted });
    assert.equal(res === true, counted === 2, `beats ${fB} Hz`);
    if (res === true) twice.push(fB);
    else if (fB === fA) assert.match(res, /stay in step/);
    else assert.ok(res.includes(`differ by ${counted} Hz`) && res.includes(counted === 1 ? '1 time a second' : `${counted} times a second`));
  }
  assert.deepEqual(twice, [8, 12]);
  assert.ok(twice.includes(beats.solution.freqB));
  assert.match(flat(beats.explain), /8 Hz or 12 Hz/);
  // "They start in step … quiet. Half a second after the start they are in step again": the loudness of the pair
  // (the length of the two turning arrows added) is greatest at 0 s, all but zero a quarter of a second later,
  // and back at its greatest half a second after the start; so the quiet moment is NOT half a second before the next loud one.
  const loudness = (fB, t) => Math.hypot(Math.sin(2 * Math.PI * fA * t) + Math.sin(2 * Math.PI * fB * t), Math.cos(2 * Math.PI * fA * t) + Math.cos(2 * Math.PI * fB * t));
  for (const fB of twice) {
    near(loudness(fB, 0), 2, 1e-9);
    near(loudness(fB, 0.25), 0, 1e-9);
    near(loudness(fB, 0.5), 2, 1e-9);
    for (let t = 0.01; t < 0.5; t += 0.01) assert.ok(loudness(fB, t) < 2 - 1e-6, `${fB} Hz: not fully in step again before 0.5 s (t = ${t})`);
  }
  assert.match(flat(beats.explain), /They start in step, crest on crest: loud\..*quiet\. Half a second after the start they are in step again/);
  assert.ok(!/Half a second later/.test(beats.explain), 'the half second counts from the start, not from the quiet moment');

  const kinds = new Set();
  eachVariant('superposition', 'beat-frequency', (step) => {
    const text = flat(step.text);
    let m;
    if ((m = /One sounds \*\*(\d+) Hz\*\*, the other \*\*(\d+) Hz\*\*/.exec(text))) {
      kinds.add('count');
      assert.equal(step.answer, Math.abs(m[1] - m[2]));
      assert.equal(step.unit, 'beats per second');
      assert.ok(step.explain.includes(`$${Math.max(m[1], m[2])} - ${Math.min(m[1], m[2])} = ${step.answer}$`));
    } else {
      kinds.add('tune');
      const d = Number(grab(/hears \*\*(\d+) beats? each second\*\*/, text)[0]);
      const [way] = grab(/a little too \*\*(low|high)\*\*/, text);
      assert.match(text, /440 Hz tuning fork/);
      assert.equal(step.answer, way === 'low' ? 440 - d : 440 + d);
      assert.equal(Math.abs(step.answer - 440), d, 'the string and the fork differ by the number of beats');
      assert.equal(step.unit, 'Hz');
      assert.ok(step.explain.includes(`440 ${way === 'low' ? '−' : '+'} ${d} = ${step.answer} Hz`));
    }
  }, 120);
  assert.equal(kinds.size, 2);
  // two real forks, counted by brute force
  assert.equal(beatsPerSecond(440, 443, 2, 16000), 3);
  assert.equal(beatsPerSecond(256, 254, 2, 16000), 2);

  const match = one('superposition', 'match');
  assert.deepEqual(match.pairs.map((p) => p[0]), ['Constructive interference', 'Destructive interference', 'A standing wave', 'Beats']);
});

/* ---------------------------------------------------------------- lesson 6 */

test('lesson 6: the speeds the questions quote are the ones the light widget uses', () => {
  assert.deepEqual(LIGHT_SPEED, { air: 300000, water: 225000, glass: 200000, diamond: 124000 });
  for (const medium of ['water', 'glass', 'diamond']) for (const angle of [0, 10, 35, 50, 80]) near(refractAngle(angle, LIGHT_SPEED.air, LIGHT_SPEED[medium]), snell(angle, LIGHT_SPEED.air, LIGHT_SPEED[medium]), 1e-12);
  assert.equal(refractAngle(60, LIGHT_SPEED.water, LIGHT_SPEED.air), null, 'too flat to get out of the water');
  // rounded from the measured refractive indices 1.33, 1.5 and 2.42, with c = 299 792 km/s
  near(299792 / 1.333, LIGHT_SPEED.water, 2e-3);
  near(299792 / 1.5, LIGHT_SPEED.glass, 2e-3);
  near(299792 / 2.417, LIGHT_SPEED.diamond, 2e-3);
  near(299792, LIGHT, 1e-3);
  assert.match(flat(one('light', 'colour').text), /about \*\*300,000 km\/s\*\* \(more exactly 299,792 km\/s\)/);
  assert.match(flat(one('light', 'colour').text), /behaves like a stream of particles/);
  assert.match(flat(one('light', 'why-bend').text), /about 225,000 km\/s instead of 300,000 km\/s/);
  assert.equal(one('light', 'why-bend').figures[0].medium, 'water');
});

test('lesson 6: mirror, water and coin accept exactly what the instructions ask for', () => {
  assert.match(correctText(one('light', 'hook')), /Shallower/);
  const mirror = one('light', 'mirror');
  const target = mirror.widget.target.incidence;
  const hits = [];
  for (const angle of stepsOf(...mirror.widget.angleRange)) {
    // reflection flips the part of the direction that points into the mirror, so the angle from the normal is unchanged
    const coming = [Math.sin(angle * D2R), -Math.cos(angle * D2R)];           // travelling to the right and down, towards the mirror
    const leaving = [coming[0], -coming[1]];
    const out = Math.atan2(leaving[0], leaving[1]) / D2R;
    near(out, angle, 1e-9);
    const res = mirror.check({ mode: 'mirror', angle, out: round4(out), hit: Math.abs(out - target) < 1e-9 });
    assert.equal(res === true, angle === target, `mirror ${angle}°`);
    if (res === true) hits.push(angle);
    else { assert.ok(res.includes(`arrives at ${angle}° and leaves at ${angle}°`) && res.includes(`${target}° from the normal`)); assert.match(res, angle > target ? /closer to the normal/ : /further from the normal/); }
  }
  assert.deepEqual(hits, [mirror.solution.angle]);
  assert.match(flat(mirror.explain), /35° in, 35° out/);
  assert.equal(target, 35);

  const water = one('light', 'into-water');
  assert.equal(water.figures[0].medium, 'water');
  assert.match(correctText(water), /towards the normal/);
  const inAir = row(water.explain, 'Angle in air').map((c) => Number(c.replace('°', '')));
  const inWater = row(water.explain, 'Angle in water').map((c) => Number(c.replace('°', '')));
  inAir.forEach((angle, i) => {
    assert.equal(inWater[i], Math.round(snell(angle, LIGHT_SPEED.air, LIGHT_SPEED.water) * 10) / 10, `${angle}° in air`);
    assert.ok(stepsOf(...water.figures[0].angleRange).includes(angle));
    assert.ok(angle === 0 ? inWater[i] === 0 : inWater[i] < angle, 'towards the normal at every slant, straight on at 0°');
  });

  const coin = one('light', 'coin');
  const aim = coin.widget.target.incidence;
  const coinAngle = snell(aim, LIGHT_SPEED.air, LIGHT_SPEED[coin.widget.medium]);
  const ok = [];
  for (const angle of stepsOf(...coin.widget.angleRange)) {
    const out = snell(angle, LIGHT_SPEED.air, LIGHT_SPEED[coin.widget.medium]);
    const res = coin.check({ mode: 'refract', angle, out: round4(out), medium: coin.widget.medium, hit: Math.abs(out - coinAngle) < 1e-9 });
    assert.equal(res === true, angle === aim, `coin ${angle}°`);
    if (res === true) ok.push(angle);
    else if (angle === 35) { assert.match(res, /straight along the dashed line/); assert.ok(out < coinAngle, 'aimed straight at the coin, the ray ends up steeper than the coin'); assert.match(res, /Come in flatter/); }
    else {
      assert.ok(res.includes(`${Math.round(out * 10) / 10}° from the normal`) && res.includes(`${Math.round(coinAngle * 10) / 10}°`));
      assert.match(res, out < coinAngle ? /Come in flatter/ : /closer to the normal/);
    }
  }
  assert.deepEqual(ok, [coin.solution.angle]);
  assert.ok(Math.abs(coinAngle - 35) < 0.1, 'the dashed line through the coin is 35° from the normal, which is on the slider');
  assert.ok(flat(coin.explain).includes(`${Math.round(coinAngle * 10) / 10}° in the water`) && flat(coin.explain).includes(`**${aim}°**`));
});

test('lesson 6: which way a ray bends', () => {
  const seen = new Set();
  eachVariant('light', 'which-way', (step) => {
    const text = flat(step.text);
    const [v1, from, v2, to] = grab(/Light travels at \*\*([\d,]+) km\/s\*\* in (\w+) and at \*\*([\d,]+) km\/s\*\* in (\w+)\./, text);
    assert.ok(text.includes(`A ray passes from ${from} into ${to}`));
    assert.equal(number(v1), LIGHT_SPEED[from]);
    assert.equal(number(v2), LIGHT_SPEED[to]);
    const headOn = /head-on, along the normal/.test(text);
    if (!headOn) assert.match(text, /at a slant/);
    // send a ray in (at 10° for a slant, 0° head-on) and see which way it has turned
    const angle = headOn ? 0 : 10;
    const out = snell(angle, number(v1), number(v2));
    const expected = Math.abs(out - angle) < 1e-9 ? 'It does not bend' : out < angle ? 'Towards the normal' : 'Away from the normal';
    assert.equal(correctText(step), expected);
    assert.deepEqual(step.options.map((o) => o.text), ['Towards the normal', 'Away from the normal', 'It does not bend']);
    assert.equal(step.shuffle, false);
    seen.add(`${from}>${to}${headOn ? '|' : '/'}`);
    const slows = number(v2) < number(v1);
    if (!headOn) {
      assert.equal(/slows down/.test(step.explain), slows);
      assert.equal(/speeds up/.test(step.explain), !slows);
      const other = step.options.find((o) => !o.correct && o.text !== 'It does not bend');
      assert.equal(/Here it slows down/.test(other.why), slows);
      assert.equal(/Here it speeds up/.test(other.why), !slows);
      assert.ok(other.why.includes(`from ${v1} km/s to ${v2} km/s`));
    } else {
      assert.equal(/simply slows down/.test(step.explain), slows);
      assert.equal(/simply speeds up/.test(step.explain), !slows);
    }
  }, 300);
  assert.ok(seen.size >= 16, `${seen.size} different questions`);
});

test('lesson 6: the pool and the prism pictures show what the text says', () => {
  const pool = one('light', 'pool');
  assert.match(correctText(pool), /higher up than it really is/);
  const svg = pool.figures[0].content;
  const [coinX, coinY, sx, sy, ex, ey] = grab(/class="stroke-red[^"]*"[^>]* d="M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)"/, svg).map(Number);
  // angles from the normal (the vertical) on each side of the surface
  const inWater = Math.atan2(sx - coinX, coinY - sy) / D2R;
  const inAir = Math.atan2(ex - sx, sy - ey) / D2R;
  near(Math.sin(inAir * D2R) / Math.sin(inWater * D2R), LIGHT_SPEED.air / LIGHT_SPEED.water, 5e-3, 'the bend in the picture obeys the two speeds');
  assert.ok(inAir > inWater, 'away from the normal on the way out');
  // the dashed line continues the last part of the ray straight back, and passes above the coin
  const [x1, y1, x2, y2] = grab(/class="stroke-violet"[^>]* x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/, svg).map(Number);
  assert.deepEqual([x1, y1], [sx, sy]);
  near((y2 - y1) / (x2 - x1), (ey - sy) / (ex - sx), 5e-3, 'in line with the ray that reaches the eye');
  assert.equal(x2, coinX);
  assert.ok(y2 < coinY - 30 && y2 > sy, 'above the coin, below the surface');
  assert.ok(!/where it seems to be/.test(svg), 'the picture does not label the answer');

  const prism = one('light', 'prism');
  assert.equal(prism.type, 'order');
  const p = prism.figures[0].content;
  const [bx0, by0, bx1, by1] = grab(/class="stroke-ink" stroke-width="5"[^>]* x1="([\d.]+)" y1="([\d.]+)" x2="([\d.]+)" y2="([\d.]+)"/, p).map(Number);
  const incoming = Math.atan2(by1 - by0, bx1 - bx0);
  const turn = {};
  for (const m of p.matchAll(/class="stroke-(\w+) fill-none"[^>]* d="M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)"/g)) {
    assert.deepEqual([Number(m[2]), Number(m[3])], [bx1, by1], 'every colour starts where the white beam enters');
    turn[m[1]] = (Math.atan2(m[7] - m[5], m[6] - m[4]) - incoming) / D2R;       // how far the outgoing ray has turned (clockwise on screen: towards the base)
  }
  const order = ['red', 'orange', 'yellow', 'green', 'blue', 'violet'];
  assert.deepEqual(Object.keys(turn), order);
  for (let i = 1; i < order.length; i++) assert.ok(turn[order[i]] > turn[order[i - 1]] && turn[order[i - 1]] > 0, `${order[i]} is turned more than ${order[i - 1]}`);
  // the answer key lists the colours from least bent to most bent, as the picture shows them
  const asked = prism.items.map((c) => c.toLowerCase());
  assert.deepEqual(asked, asked.slice().sort((p, q) => turn[p] - turn[q]));
  assert.deepEqual(asked, ['red', 'yellow', 'blue', 'violet']);
  assert.deepEqual(prism.labels, ['Slowed least', 'Slowed most']);
  for (const colour of order) assert.ok(prism.figures[0].alt.includes(colour));
  assert.match(flat(prism.explain), /drawn wider than life/);
  assert.match(flat(prism.text), /The more a material slows light down, the more it bends it/);
});

test('lesson 6: light travel times', () => {
  const places = new Set();
  eachVariant('light', 'light-time', (step) => {
    const text = flat(step.text);
    assert.match(text, /^Light travels through space at 300,000 km\/s\./);
    const d = number(grab(/\*\*([\d,]+) km\*\*/, text)[0]);
    places.add(d);
    near(step.answer, d / LIGHT);
    assert.equal(step.unit, 's');
    assert.ok(step.explain.includes(`\\frac{${groupedTex(d)}}{300{,}000} = ${step.answer}$ s`));
    if (/radio/i.test(text)) assert.match(text, /Radio signals travel at the speed of light/);
    // the remark after the answer is true of that answer
    const t = step.answer;
    if (/More than 8 minutes/.test(step.explain)) assert.ok(t / 60 > 8 && t / 60 < 9);
    if (/A little over a second/.test(step.explain)) assert.ok(t > 1 && t < 1.5);
    if (/About an eighth of a second/.test(step.explain)) near(t, 1 / 8, 0.05);
    if (/That is 5 minutes/.test(step.explain)) assert.equal(t, 300);
    if (/more than 40 minutes/.test(step.explain)) assert.ok(t / 60 > 40 && t / 60 < 45);
  });
  assert.equal(places.size, 6);
});

test('lesson 6: the Doppler picture and what the listener hears', () => {
  assert.match(correctText(one('light', 'doppler-predict')), /higher note as it comes, dropping to a lower note/);
  let ahead = 0;
  eachVariant('light', 'doppler', (step) => {
    const text = flat(step.text);
    assert.match(text, /moving to the \*\*right\*\*/);
    const svg = step.figures[0].content;
    const rings = [...svg.matchAll(/<circle class="stroke-blue fill-none"[^>]* cx="([\d.]+)" cy="[\d.]+" r="([\d.]+)"\/>/g)].map((m) => ({ cx: Number(m[1]), r: Number(m[2]) })).sort((p, q) => p.r - q.r);
    const source = Number(grab(/<circle class="fill-orange stroke-ink"[^>]* cx="([\d.]+)"/, svg)[0]);
    assert.ok(rings.length >= 3);
    // older crests are bigger and were sent from further back: the source has been moving to the right
    for (let i = 1; i < rings.length; i++) assert.ok(rings[i].cx < rings[i - 1].cx && rings[i - 1].cx < source);
    const sent = rings[1].r - rings[0].r;                                   // how far a crest travels between one crest and the next being sent
    const gapAhead = (rings[1].cx + rings[1].r) - (rings[0].cx + rings[0].r);
    const gapBehind = (rings[0].cx - rings[0].r) - (rings[1].cx - rings[1].r);
    assert.ok(gapAhead < sent && gapBehind > sent, 'crests squeezed ahead, stretched behind');
    // crests all travel at the same speed, so the number arriving each second goes as 1 ÷ their spacing
    const isAhead = /stands \*\*ahead\*\* of it, on the right/.test(text);
    if (!isAhead) assert.match(text, /stands \*\*behind\*\* it, on the left/); else ahead++;
    const heard = 1 / (isAhead ? gapAhead : gapBehind);
    const made = 1 / sent;
    assert.equal(correctText(step), heard > made ? 'A higher note' : 'A lower note');
    assert.deepEqual(step.options.map((o) => o.text), ['A higher note', 'The same note', 'A lower note']);
    assert.match(step.explain, isAhead ? /squeezed together.*more of them arrive each second.*\*\*higher note\*\*/ : /stretched apart.*fewer of them arrive each second.*\*\*lower note\*\*/);
    assert.match(step.explain, /Doppler effect.*distant galaxies.*towards the red.*moving away/);
  });
  assert.ok(ahead > 60 && ahead < SEEDS - 60);
  const match = one('light', 'match');
  assert.deepEqual(match.pairs.map((p) => p[0]), ['Reflection', 'Refraction', 'Dispersion', 'The Doppler effect']);
});

/* ------------------------------------------------------------ listed slips */

test('every listed slip is the mistake its message describes', () => {
  // Added in review. The tests above re-derive the answers; this one re-derives the anticipated wrong answers
  // from the question's wording, so that a learner who makes one mistake is never told about a different one.
  const SEEDS2 = 150;
  const variants = (lesson, id, verify) => {
    const step = raw(lesson, id);
    for (let k = 0; k < SEEDS2; k++) {
      const s = resolveStep(step, makeRng(31337 + k * 2221), id);
      const text = flat(s.text);
      const slip = (re) => { const hit = s.wrong.filter((w) => re.test(w[1])); assert.ok(hit.length <= 1, `${lesson}/${id}: two slips share the message ${re}`); return hit.length ? hit[0][0] : null; };
      try {
        verify(s, text, slip);
        // a slip that the answer box would accept as correct could never show its message
        for (const [w] of s.wrong) assert.ok(Math.abs(w - s.answer) > (s.tolerance ?? 1e-6 * Math.max(1, Math.abs(s.answer))), `slip ${w} would be marked right`);
      } catch (err) { err.message = `${lesson}/${id} (seed ${k}): ${err.message}\n  text: ${text}`; throw err; }
    }
  };
  const is = (value, expected, msg) => { assert.notEqual(value, null, `${msg}: slip is listed`); near(value, expected, 1e-9, msg); };

  variants('circular-motion', 'find-accel', (s, text, slip) => {
    const v = Number(grab(/steady \*\*([\d.]+) m\/s\*\*/, text)[0]);
    const r = Number(grab(/(?:radius \*\*([\d.]+) m\*\*|\*\*([\d.]+) m\*\* from the centre)/, text).find((x) => x != null));
    is(slip(/has to be squared before you divide/), v / r, 'speed not squared');
    is(slip(/That is \$v\^2\$/), v * v, 'not divided by the radius');
    is(slip(/direction keeps changing/), 0, 'no acceleration');
  });
  variants('circular-motion', 'find-force', (s, text, slip) => {
    const m = Number(grab(/\*\*([\d.]+) kg\*\*/, text)[0]);
    const v = Number(grab(/steady \*\*([\d.]+) m\/s\*\*/, text)[0]);
    const r = Number(grab(/(?:radius \*\*([\d.]+) m\*\*|\*\*([\d.]+) m\*\* from its centre)/, text).find((x) => x != null));
    is(slip(/^The speed has to be squared\.$/), (m * v) / r, 'speed not squared');
    is(slip(/still has to be divided by the radius/), m * v * v, 'not divided by the radius');
    is(slip(/That is the acceleration/), (v * v) / r, 'the acceleration');
  });
  variants('circular-motion', 'max-speed', (s, text, slip) => {
    const m = Number(grab(/\*\*(\d+) kg\*\* car/, text)[0]);
    const F = Number(grab(/at most \*\*(\d+) N\*\*/, text)[0]);
    const r = Number(grab(/radius \*\*(\d+) m\*\*/, text)[0]);
    is(slip(/Take the square root/), (F * r) / m, 'v squared');
    is(slip(/greatest sideways acceleration/), F / m, 'the acceleration');
  });
  variants('gravity-orbits', 'orbit-speed', (s, text, slip) => {
    const km = number(grab(/radius of \*\*([\d,]+) km\*\*/, text)[0]);
    const gHere = Number(grab(/accelerate at \*\*\$([\d.]+) \\text/, text)[0]);
    is(slip(/That is \$v\^2\$/), gHere * km * 1000, 'v squared');
    is(slip(/speed in km\/s/), Math.sqrt(gHere * km * 1000) / 1000, 'kilometres per second');
    is(slip(/Use the radius in metres/), gHere * km, 'radius left in kilometres');
  });
  variants('gravity-orbits', 'weaker', (s, text, slip) => {
    const W = Number(grab(/weighs \*\*(\d+) N\*\*/, text)[0]);
    const height = /\*\*([\d,]+) km above the ground\*\*/.exec(text);
    const k = height ? (EARTH_RADIUS + number(height[1])) / EARTH_RADIUS : Number(grab(/\*\*(\d+) Earth radii from the centre/, text)[0]);
    is(slip(/does not fall in step with the distance/), W / k, 'inverse, not inverse-square');
    const ground = slip(/Count the distance from the \*\*centre\*\*/);
    if (ground != null) { assert.ok(height); near(ground, W / (k - 1) ** 2); }
    const same = slip(/twice as far from the centre of the Earth as on the ground/);
    if (same != null) { assert.ok(height && k === 2, 'only said when it really is twice as far'); assert.equal(same, W); }
    if (height) assert.ok(ground != null || same != null);
  });
  variants('oscillations', 'pendulum-ratio', (s, text, slip) => {
    const T = Number(grab(/takes \*\*([\d.]+) s\*\*/, text)[0]);
    if (/four times as long/.test(text)) { is(slip(/four times the length only doubles/), 4 * T, 'in step with the length'); is(slip(/one thing that does change/), T, 'unchanged'); }
    else if (/nine times as long/.test(text)) { is(slip(/nine times the length triples/), 9 * T, 'in step with the length'); is(slip(/one thing that does change/), T, 'unchanged'); }
    else if (/a quarter\*\* of its length/.test(text)) { is(slip(/a quarter of the length halves/), T / 4, 'in step with the length'); is(slip(/one thing that does change/), T, 'unchanged'); }
    else if (/three times as heavy/.test(text)) is(slip(/mass of the bob makes no difference/), 3 * T, 'in step with the mass');
    else is(slip(/mass of the bob makes no difference/), T / 2, 'in step with the mass');
  });
  variants('oscillations', 'formula-use', (s, text, slip) => {
    const L = Number(grab(/\*\*([\d.]+) m\*\*/, text)[0]);
    is(slip(/still has to be multiplied by \$2\\pi\$/), round2(Math.sqrt(L / g)), 'the bare square root');
    const noRoot = slip(/Take the square root of/);
    if (noRoot != null) near(noRoot, round2((2 * 3.14 * L) / g));
    // working with a better value of π, or without rounding, is accepted too
    for (const typed of [2 * Math.PI * Math.sqrt(L / g), 2 * 3.14 * Math.sqrt(L / g), round2(2 * Math.PI * Math.sqrt(L / g))]) assert.ok(Math.abs(typed - s.answer) <= s.tolerance, `${typed} is accepted`);
  });
  variants('oscillations', 'spring-ratio', (s, text, slip) => {
    const T = Number(grab(/period of \*\*([\d.]+) s\*\*/, text)[0]);
    if (/four times as heavy/.test(text)) { is(slip(/four times the mass only doubles/), 4 * T, 'in step with the mass'); is(slip(/exactly the two things/), T, 'unchanged'); }
    else if (/nine times as heavy/.test(text)) { is(slip(/nine times the mass triples/), 9 * T, 'in step with the mass'); is(slip(/exactly the two things/), T, 'unchanged'); }
    else if (/four times as stiff/.test(text)) { is(slip(/shorter, not longer/), 2 * T, 'the wrong way'); is(slip(/four times the stiffness halves/), T / 4, 'in step with the stiffness'); is(slip(/exactly the two things/), T, 'unchanged'); }
    else is(slip(/two effects cancel exactly/), 2 * T, 'in step with the amplitude');
  });
  variants('oscillations', 'other-world', (s, text, slip) => {
    const T = Number(grab(/takes \*\*([\d.]+) s\*\*/, text)[0]);
    const gNew = Number(grab(/where \$g\$ is \$([\d.]+) \\text/, text)[0]);
    is(slip(/but the period goes with the square root of that/), T * (g / gNew), 'in step with gravity, no square root');
    is(slip(/Gravity is what pulls the bob back/), T, 'unchanged');
    is(slip(gNew < g ? /takes longer, not less long/ : /takes less long, not longer/), T / Math.sqrt(g / gNew), 'the wrong way');
  });
  variants('waves', 'wave-equation', (s, text, slip) => {
    let m;
    if ((m = /frequency of \*\*([\d.]+) Hz\*\* and a wavelength of \*\*([\d.]+) m\*\*\. How fast/.exec(text))) {
      const [f, lambda] = [Number(m[1]), Number(m[2])];
      for (const [w, msg] of s.wrong) assert.ok(Math.abs(w - f / lambda) < 1e-9 || Math.abs(w - lambda / f) < 1e-9, `${w}: ${msg}`);
    } else if ((m = /travel at \*\*([\d.]+) m\/s\*\* and have a frequency of \*\*([\d.]+) Hz\*\*/.exec(text))) {
      const [v, f] = [Number(m[1]), Number(m[2])];
      const [multiplied, upsideDown] = [slip(/Multiplying makes it enormous/), slip(/upside down: wavelength/)];
      if (multiplied != null) near(multiplied, v * f);
      if (upsideDown != null) near(upsideDown, f / v);
    } else {
      m = grab(/travel at \*\*([\d.]+) m\/s\*\* and have a wavelength of \*\*([\d.]+) m\*\*/, text).map(Number);
      const [multiplied, period] = [slip(/Multiplying is the wrong way round/), slip(/It is the period, in seconds/)];
      if (multiplied != null) near(multiplied, m[0] * m[1]);
      is(period, m[1] / m[0], 'the period: one over the frequency');
      near(period, 1 / s.answer, 1e-9);
    }
  });
  variants('waves', 'thunder', (s, text, slip) => {
    let m;
    if ((m = /thunder \*\*(\d+) s\*\* later/.exec(text))) is(slip(/Divide and the storm would seem closer/), SOUND / m[1], 'divided');
    else if ((m = /echo \*\*(\d+) s\*\* later/.exec(text))) is(slip(/and back/), SOUND * m[1], 'the whole trip');
    else is(slip(/Multiplying makes it far too long/), grab(/bursts \*\*(\d+) m\*\* away/, text)[0] * SOUND, 'multiplied');
  });
  variants('waves', 'crossing', (s, text, slip) => {
    const L = Number(grab(/pool \*\*(\d+) m\*\* long/, text)[0]);
    const lambda = Number(grab(/crests are \*\*([\d.]+) m\*\* apart/, text)[0]);
    const f = /once every 2 s/.test(text) ? 0.5 : 2;
    is(slip(/how many wavelengths fit along the pool/), L / lambda, 'number of wavelengths');
    is(slip(/That is the speed of the waves/), f * lambda, 'the speed');
  });
  variants('superposition', 'add-heights', (s, text, slip) => {
    const a = Number(grab(/lift it \*\*(\d+) mm\*\* above its resting level/, text)[0]);
    const down = /push it \*\*(\d+) mm below\*\*/.exec(text);
    const b = down ? -Number(down[1]) : Number(grab(/Wave B alone would lift it \*\*(\d+) mm above\*\*/, text)[0]);
    is(slip(down ? /counts as negative/ : /have the same sign/), a - b, 'sign of B flipped');
    is(slip(/A lifts the point/), -a + Math.abs(b), 'sign of A flipped');
    is(slip(/The bigger wave does not win/), Math.max(a, Math.abs(b)), 'only the bigger wave');
  });
  variants('superposition', 'harmonic-wavelength', (s, text, slip) => {
    const len = Number(grab(/\*\*([\d.]+) m\*\* long/, text)[0]);
    const n = Number(grab(/\*\*(\d+) loops?\*\*/, text)[0]);
    is(slip(/length of one loop/), len / n, 'one loop');
    const whole = slip(/would be right for two loops/);
    if (whole != null) { assert.ok(n > 2); near(whole, len); near(whole, (2 * len) / 2); }
  });
  variants('superposition', 'harmonic-frequency', (s, text, slip) => {
    const f1 = Number(grab(/one loop at \*\*(\d+) Hz\*\*/, text)[0]);
    const n = Number(grab(/in \*\*(\d+) loops\*\*/, text)[0]);
    is(slip(/shorter waves have a \*higher\* frequency/), f1 / n, 'divided');
    is(slip(/wave speed on the string has not changed/), f1, 'unchanged');
  });
  variants('superposition', 'beat-frequency', (s, text, slip) => {
    let m;
    if ((m = /One sounds \*\*(\d+) Hz\*\*, the other \*\*(\d+) Hz\*\*/.exec(text))) {
      is(slip(/That is the average/), (Number(m[1]) + Number(m[2])) / 2, 'the average');
      is(slip(/not their sum/), Number(m[1]) + Number(m[2]), 'the sum');
    } else {
      const d = Number(grab(/hears \*\*(\d+) beats? each second\*\*/, text)[0]);
      const low = /too \*\*low\*\*/.test(text);
      is(slip(/on the wrong side of the fork/), low ? 440 + d : 440 - d, 'the wrong side');
      is(slip(/That is the difference between the two frequencies/), d, 'the difference');
      assert.ok(s.wrong[0][1].includes(`The string is too ${low ? 'low' : 'high'}`));
    }
  });
  variants('light', 'light-time', (s, text, slip) => {
    const d = number(grab(/\*\*([\d,]+) km\*\*/, text)[0]);
    is(slip(/upside down: time = distance ÷ speed/), LIGHT / d, 'upside down');
  });
});

/* ------------------------------------------------------ teach before you ask */

/** The teaching screens added when the course was revised to teach before it asks. */
const NEW_TEACHING = {
  'circular-motion': ['teach-tangent', 'teach-force', 'example-max-speed'],
  'gravity-orbits': ['teach-cannon', 'teach-orbit-speed', 'teach-free-fall'],
  oscillations: ['teach-root', 'teach-graph'],
  waves: ['teach-pulse', 'teach-measure', 'teach-wave-equation', 'example-echo'],
  superposition: ['teach-interference', 'teach-harmonics', 'teach-beats'],
  light: ['teach-ray', 'teach-bend-rule', 'teach-doppler'],
};

/**
 * [teaching screen, a graded step that needs it, what the screen has to contain].
 * A later edit that moves a screen behind its question, or drops the term, the
 * formula or the worked example the question relies on, fails here.
 */
const TEACHING = {
  'circular-motion': [
    ['teach-tangent', 'direction', ['**tangent**', 'clockwise', ':::example']],
    ['name-it', 'direction', ['**centripetal**', 'points at the centre']],
    ['formula', 'find-accel', ['a = \\frac{v^2}{r}', '**squared**', ':::example']],
    ['teach-force', 'find-force', ['F = \\frac{m\\,v^2}{r}', 'newtons', ':::example']],
    ['teach-force', 'match', ['the string for the puck', 'friction for a car on a bend', 'gravity for the Moon']],
    ['example-max-speed', 'max-speed', [':::example', 'v^2 = \\frac{3600 \\times 36}{900} = 144', 'the most the tyres can give']],
  ],
  'gravity-orbits': [
    ['teach-cannon', 'cannon', ['kilometres per second', 'curves away']],
    ['falling', 'sort', ['**orbit**', 'falling the whole time', 'needs no engine']],
    ['teach-orbit-speed', 'orbit-speed', ['v^2 = g \\times r', 'in metres', ':::example']],
    ['law', 'weaker', ['n^2$ times weaker', ':::example', '**above the ground**', 'Count from the centre']],
    ['teach-free-fall', 'floating', ['**free fall**', 'floor pushing up', 'reads **zero**']],
  ],
  oscillations: [
    ['teach-root', 'pendulum-ratio', ['**Mass:** no effect', '**square root** of the length', 'a quarter of the length gives half', ':::example']],
    ['name-it', 'formula-use', ['T = 2\\pi\\sqrt{\\frac{L}{g}}', ':::example', 'Its square root']],
    ['name-it', 'other-world', ['where $g$ is weaker, the period is longer']],
    ['spring-rule', 'spring-ratio', ['T = 2\\pi\\sqrt{\\frac{m}{k}}', '**longer** period', '**shorter** period', '**amplitude**', ':::example']],
    ['teach-graph', 'read-graph', ['**Period**', '**next peak**', '**Frequency**', '**hertz**', ':::example']],
  ],
  waves: [
    ['teach-pulse', 'watch-bead', ['**pulse**', '**wave**', '**crests**', '**troughs**']],
    ['name-it', 'sort', ['**medium**', '**Transverse**', '**Longitudinal**', '**Sound** is a longitudinal wave']],
    ['teach-measure', 'measure-wavelength', ['**Amplitude**', '**Wavelength**', 'one crest to the next', '**Frequency**']],
    ['teach-wave-equation', 'wave-equation', ['v = f \\times \\lambda', '\\lambda = \\frac{v}{f}', 'f = \\frac{v}{\\lambda}', ':::example']],
    ['sound', 'thunder', ['set by the **medium**', '**340 m/s**']],
    ['example-echo', 'thunder', ['distance = speed × time', 'time = distance ÷ speed', '**echo**', 'there **and back**', ':::example']],
  ],
  superposition: [
    ['principle', 'add-heights', ['**superposition**', '**displacement**', 'negative below', ':::example']],
    ['teach-interference', 'shift', ['**constructive interference**', '**destructive interference**']],
    ['teach-interference', 'noise', ['Crests arrive on troughs', 'cancel completely']],
    ['standing', 'harmonic-wavelength', ['**standing wave**', '**loops**', 'half a wavelength', ':::example']],
    ['teach-harmonics', 'harmonic-frequency', ['**fundamental**', '**harmonics**', 'v = f\\lambda', '$n$ times higher', ':::example']],
    ['teach-beats', 'beat-frequency', ['**beat**', '**difference** between the two frequencies', ':::example', 'too high']],
    ['teach-beats', 'match', ['nearly the same frequency']],
  ],
  light: [
    ['teach-ray', 'mirror', ['**ray**', '**normal**', 'measured from the normal']],
    ['why-bend', 'which-way', ['**refraction**', 'slows down']],
    ['teach-bend-rule', 'which-way', ['**slows down**', '**towards**', '**speeds up**', '**away from**', '**head-on**', ':::example']],
    ['colour', 'prism', ['**White light**', '**frequency**']],
    ['teach-doppler', 'doppler', ['**Doppler effect**', 'squeezed together', 'stretched apart', 'higher note', 'lower note']],
    ['teach-doppler', 'match', ['**Doppler effect**']],
  ],
};

test('every lesson: teach before you ask', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const id of LESSONS) {
    const steps = lessons[id].steps.map((step) => resolveStep(step, makeRng(1), step.id));      // resolved, as the player sees them
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    // a teaching screen is an info step that is followed by something to answer
    const lastAsked = roles.reduce((last, kind, i) => (kind === 'teach' ? last : i), -1);
    assert.ok(roles.filter((kind, i) => kind === 'teach' && i < lastAsked).length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length, `${id}: step ids are unique`);
    for (const added of NEW_TEACHING[id]) assert.equal(raw(id, added).type, 'info', `${id}/${added} is a teaching screen`);
    for (const [teachId, askId, needs] of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === teachId);
      const ask = steps.findIndex((s) => s.id === askId);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${teachId}" exists`);
      assert.ok(ask > at, `${id}: "${teachId}" comes before "${askId}"`);
      assert.equal(roles[ask], 'graded', `${id}/${askId} is the question that "${teachId}" serves`);
      for (const needed of needs) assert.ok(flat(steps[at].text).includes(needed), `${id}/${teachId} teaches what "${askId}" asks for: "${needed}"`);
    }
  }
});

test('worked examples use numbers that the question after them cannot produce', () => {
  // [lesson, generated step, what a variant would look like if it repeated the worked example on the screen before it]
  const same = [
    ['circular-motion', 'find-accel', (t) => /\*\*40 m\*\*/.test(t) && /\*\*6 m\/s\*\*/.test(t)],
    ['circular-motion', 'find-force', (t) => /\*\*2 kg\*\*/.test(t) && /\*\*4 m\/s\*\*/.test(t) && /radius \*\*1 m\*\*/.test(t)],
    ['circular-motion', 'max-speed', (t) => /\*\*900 kg\*\*/.test(t) || /\*\*3600 N\*\*/.test(t)],
    ['gravity-orbits', 'orbit-speed', (t) => /\*\*900 km\*\*/.test(t)],
    ['gravity-orbits', 'weaker', (t) => /\*\*750 N\*\*/.test(t) || /25,600 km/.test(t)],
    ['oscillations', 'pendulum-ratio', (t) => /\*\*1\.5 s\*\*/.test(t) || /sixteen/.test(t)],
    ['oscillations', 'formula-use', (t) => /\*\*4\.9 m\*\*/.test(t)],
    ['oscillations', 'spring-ratio', (t) => /\*\*0\.9 s\*\*/.test(t) || /nine times as stiff|sixteen/.test(t)],
    ['oscillations', 'read-graph', (t, s) => s.figures[0].fns[0].expr.includes('/0.2)')],
    ['oscillations', 'other-world', (t) => Math.abs(g / Number(/where \$g\$ is \$([\d.]+)/.exec(t)[1]) - 9) < 1e-9],
    ['waves', 'measure-wavelength', (t, s) => s.figures[0].crestAt === 3],
    ['waves', 'wave-equation', (t) => /\*\*12 m\/s\*\*/.test(t) || (/\*\*3 Hz\*\*/.test(t) && /\*\*4 m\*\*/.test(t))],
    ['waves', 'thunder', (t) => /\*\*510 m\*\*/.test(t) || /echo \*\*0\.5 s\*\*/.test(t)],
    ['superposition', 'add-heights', (t) => /\*\*30 mm\*\*/.test(t) || /\*\*50 mm/.test(t)],
    ['superposition', 'harmonic-wavelength', (t) => /\*\*5 loops\*\*/.test(t)],
    ['superposition', 'harmonic-frequency', (t) => /\*\*150 Hz\*\*/.test(t) || /\*\*6 loops\*\*/.test(t)],
    ['superposition', 'beat-frequency', (t) => /\*\*30[07] Hz\*\*/.test(t) || /200 Hz tuning fork/.test(t) || /\*\*[78] beats/.test(t)],
    ['light', 'which-way', (t) => /150,000|250,000/.test(t)],
    ['light', 'light-time', (t) => /\*\*600,000 km\*\*/.test(t)],
  ];
  for (const [lesson, id, repeats] of same) {
    const step = raw(lesson, id);
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(2203 + k * 3571), id);
      assert.ok(!repeats(flat(s.text), s), `${lesson}/${id} (seed ${k}) repeats the worked example: ${flat(s.text)}`);
    }
  }
  // the examples themselves are right
  near(6 ** 2 / 40, 0.9); near(Math.sqrt((3600 * 36) / 900), 12); near(Math.sqrt(0.9 * 900000), 900);
  near((EARTH_RADIUS + 25600) / EARTH_RADIUS, 5); near(750 / 25, 30);
  near(1.5 * Math.sqrt(16), 6); assert.equal(round2(2 * 3.14 * Math.sqrt(4.9 / g)), 4.4); near(0.9 / Math.sqrt(9), 0.3); near(0.9 * Math.sqrt(16), 3.6);
  near(1 / 0.2, 5); near(3 * 4, 12); near(510 / SOUND, 1.5); near((SOUND * 0.5) / 2, 85);
  near((2 * 1.5) / 5, 0.6); near(6 * 150, 900); near(600000 / LIGHT, 2);
  assert.match(flat(one('oscillations', 'name-it').text), /2 \\times 3\.14 \\times 0\.7 \\approx 4\.40\$ s/);
  assert.match(flat(one('gravity-orbits', 'teach-orbit-speed').text), /0\.9 \\times 900\{,\}000 = 810\{,\}000/);
  assert.match(flat(one('gravity-orbits', 'law').text), /6,400 \+ 25,600 = 32,000 km\. That is 5 Earth radii/);
  assert.match(flat(one('waves', 'example-echo').text), /340 \\times 0\.5 = 170\$ m.*170 \\div 2 = 85\$ m/);
  assert.match(flat(one('light', 'light-time').text), /So 600,000 km takes it 600,000 ÷ 300,000 = 2 s\./);
  // the pictures on the new screens show what their text says
  assert.equal(one('gravity-orbits', 'teach-cannon').figures[0].speed, 5);
  assert.ok(orbitNumeric(5).lands && Math.abs(orbitNumeric(5).distance - 3000) < 100, 'the 5 km/s shot comes down about 3,000 km away');
  const graph = one('oscillations', 'teach-graph').figures[0];
  near(compile(graph.fns[0].expr, { vars: ['x'] })({ x: 0.2 }), 3, 1e-9, 'a peak of 3 cm at 0.2 s');
  const rootCurve = compile(one('oscillations', 'teach-root').figures[0].fns[0].expr, { vars: ['x'] });
  near(rootCurve({ x: 0.8 }) / rootCurve({ x: 0.2 }), 2, 1e-9, 'four times the length, twice the period');
  near(rootCurve({ x: 0.2 }), swingPeriod(0.2, 5), 5e-3);
  const out = one('light', 'teach-bend-rule').figures[0];
  assert.equal(out.from, 'below');
  for (const angle of stepsOf(...out.angleRange)) assert.ok(snell(angle, LIGHT_SPEED.water, LIGHT_SPEED.air) != null, `at ${angle}° the ray still gets out of the water`);
  assert.equal(one('superposition', 'teach-beats').figures[0].freqB - one('superposition', 'teach-beats').figures[0].freqA, 2);
  assert.equal(beatsPerSecond(10, 12), 2);
});

/* ------------------------------------------------------------------- guard */

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.slice().sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} is generated, but no test above re-derives it`);
  }
  // every interact step has a solution and a check, and a widget of this course
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) {
    if (step.type !== 'interact') continue;
    assert.equal(typeof step.check, 'function', `${id}/${step.id}`);
    assert.ok(step.solution && step.explain, `${id}/${step.id}`);
  }
});
