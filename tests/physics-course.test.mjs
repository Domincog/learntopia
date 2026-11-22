// Independent checks of "Physics: Motion & Forces". Every generated question
// is re-solved from its own wording (the numbers are parsed out of the text or
// the figure the learner sees) with kinematics, energy and momentum formulas
// written here, for many seeds. Interact steps are checked by feeding their
// `check` states worked out from closed forms, over every setting the sliders
// allow, so that exactly the settings the instruction asks for are accepted.
//
//   node --test tests/physics-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { G, aAn, forceDiagram } from '../content/courses/physics/helpers.js';
import course from '../content/courses/physics/course.js';

const SEEDS = 200;
const g = 10;                                   // the course's stated value of g (m/s²)

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/physics/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, 'physics', meta.id);
  }
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(3131 + k * 7919), id));

const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const near = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} expected ${b}, got ${a}`);
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };
const correctText = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: one correct option`); return right[0].text; };
const round4 = (v) => { const r = Math.round(v * 1e4) / 1e4; return Object.is(r, -0) ? 0 : r; };
const stepsOf = (lo, hi, st = 1) => { const out = []; for (let v = lo; v <= hi + 1e-9; v += st) out.push(Math.round(v * 1e6) / 1e6); return out; };

/** Every string a learner can see in a resolved step (figure markup excluded). */
function visible(step) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!['content', 'type', 'id', 'viewBox', 'color'].includes(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/* ------------------------------------------------------------ own physics */

/** Projectile from height h: time in the air and range, from the quadratic h + vy·t − ½·g·t² = 0. */
function fly(vx, vy, h = 0) {
  const time = (vy + Math.sqrt(vy * vy + 2 * g * h)) / g;
  return { time, range: vx * time };
}
/** The same by brute force: step the motion forward until the ball reaches the ground. */
function flyNumeric(vx, vy, h = 0, dt = 1e-3) {
  let x = 0;
  let y = h;
  let v = vy;
  let t = 0;
  for (let n = 0; n < 1e6; n++) {
    const yNext = y + v * dt - 0.5 * g * dt * dt;
    if (yNext < 0) { const f = y / (y - yNext); return { time: t + f * dt, range: x + vx * f * dt }; }
    y = yNext; v -= g * dt; x += vx * dt; t += dt;
  }
  throw new Error('never lands');
}
/** Distance fallen from rest after t seconds, by adding up small steps of v·dt. */
function fallen(t, n = 20000) {
  const dt = t / n;
  let d = 0;
  for (let i = 0; i < n; i++) d += g * (i + 0.5) * dt * dt;
  return d;
}
/** 1-D collision with restitution e (1 = perfectly bouncy, 0 = sticky), from momentum conservation. */
function collide(m1, v1, m2, v2, e) {
  const p = m1 * v1 + m2 * v2;
  return { u1: (p - m2 * e * (v1 - v2)) / (m1 + m2), u2: (p + m1 * e * (v1 - v2)) / (m1 + m2) };
}
const ke = (m, v) => 0.5 * m * v * v;

/* ------------------------------------------------------------ whole course */

test('course shape: six lessons, each with review steps, a recap and a hands-on step', () => {
  assert.equal(course.id, 'physics');
  assert.deepEqual(Object.keys(lessons), ['position-and-velocity', 'acceleration', 'forces-newton', 'projectiles', 'energy', 'momentum']);
  for (const [id, lesson] of Object.entries(lessons)) {
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) if (s.type === 'numeric') assert.equal(typeof s.gen, 'function', `${id}/${s.id}: numeric review steps are generated`);
    assert.ok(lesson.steps.some((s) => s.type === 'interact'), `${id}: has an interact step`);
    assert.ok(lesson.recap.length >= 3, `${id}: recap`);
  }
  assert.equal(G, 10);
});

test('no learner-visible text contains undefined, NaN, an object or float noise', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        for (const text of visible(s)) {
          assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), `${id}/${step.id} seed ${k}: ${text}`);
          assert.ok(!/\d\.\d{4,}/.test(text), `${id}/${step.id} seed ${k}: float noise in "${text}"`);
          assert.ok(!/\ba (8\d*|11|18) (m|kg)\b/.test(text) && !/\ban (?!8|11\b|18\b)\d+ (m|kg)\b/.test(text), `${id}/${step.id} seed ${k}: a/an in "${text}"`);
        }
        if (!step.gen) break;
      }
    }
  }
  for (const lesson of Object.values(lessons)) for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
});

test('every choice has exactly one correct option and no duplicates; multi has no duplicates', () => {
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
        seen++;
        if (!step.gen) break;
      }
    }
  }
  assert.ok(seen > 400);
});

test('numeric steps: exact answers that can be typed, and no listed slip equals the answer', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'numeric') continue;
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(9 + k * 613), step.id);
        assert.ok(Number.isFinite(s.answer), `${id}/${step.id}`);
        // an answer is either exact and easy to type, or the question says how to round it
        if (s.tolerance == null) assert.ok(Math.abs(s.answer * 2 - Math.round(s.answer * 2)) < 1e-9, `${id}/${step.id}: ${s.answer} is a whole number or a half`);
        else assert.match(flat(s.text), /round|nearest|decimal place/i, `${id}/${step.id}: a tolerance needs a rounding instruction`);
        assert.ok(s.unit, `${id}/${step.id} shows its unit`);
        for (const [slip] of s.wrong) assert.ok(Math.abs(slip - s.answer) > 1e-9, `${id}/${step.id}: slip ${slip} equals the answer`);
        if (!step.gen) break;
      }
    }
  }
});

test('helpers: a/an before a number, and the force diagram', () => {
  for (let n = 1; n <= 999; n++) {
    const an = n === 8 || n === 11 || n === 18 || (n >= 80 && n <= 89) || (n >= 800 && n <= 899);   // eight…, eleven, eighteen
    assert.equal(aAn(n), an ? 'an' : 'a', `a/an ${n}`);
  }
  const fig = forceDiagram([{ n: 30, dir: 'right', label: 'push' }, { n: 12, dir: 'left', label: 'friction' }], { mass: '4 kg', alt: 'x' });
  assert.deepEqual(arrows(fig), [{ n: 30, dir: 1, label: 'push' }, { n: 12, dir: -1, label: 'friction' }]);
});

/** Force arrows as drawn: rightward labels are anchored at their start, leftward ones at their end. */
function arrows(fig) {
  const out = [];
  for (const m of fig.content.matchAll(/<text class="fig-label text-\w+"[^>]*text-anchor="(start|end)">([^<]*?) ?(\d+) N<\/text>/g)) {
    out.push({ n: Number(m[3]), dir: m[1] === 'start' ? 1 : -1, label: m[2] });
  }
  return out;
}

/* ---------------------------------------------------------------- lesson 1 */

const tripPositions = (start, velocities, stage) => velocities.reduce((pos, v) => [...pos, pos[pos.length - 1] + v * stage], [start]);
/** The state the motion-graph widget reports, worked out here from x = x0 + v·t. */
function tripState(velocities, { start = 0, stage = 2, track = 12, played = true, target = null } = {}) {
  const positions = tripPositions(start, velocities, stage);
  const firstWrong = target ? velocities.findIndex((v, i) => v !== target[i]) : -1;
  return {
    velocities, positions, end: positions[positions.length - 1], played,
    distance: velocities.reduce((sum, v) => sum + Math.abs(v) * stage, 0),
    crashed: positions.some((x) => x < 0 || x > track),
    match: !!target && firstWrong === -1, firstWrong,
  };
}

test('lesson 1: static figures say what the text says', () => {
  const hook = one('position-and-velocity', 'hook');
  const fig = hook.figures[0];
  assert.deepEqual(tripPositions(fig.start || 0, fig.velocities, fig.stage), [0, 20, 0]);
  assert.match(correctText(hook), /rode away, then turned round and rode back/i);
  assert.match(hook.explain, /grows to 20 m and then shrinks back to 0/);

  const slope = one('position-and-velocity', 'slope').figures[0];
  const [t0, x0] = slope.triangle.from;
  const [t1, x1] = slope.triangle.to;
  assert.equal((x1 - x0) / (t1 - t0), slope.velocities[0]);
  assert.equal(x0, (slope.start || 0) + slope.velocities[0] * t0);  // the triangle's corners are on the line
  assert.equal(x1, (slope.start || 0) + slope.velocities[0] * t1);
  assert.deepEqual(slope.points.map((p) => p.label), [`(${t0} s, ${x0} m)`, `(${t1} s, ${x1} m)`]);
  assert.match(one('position-and-velocity', 'slope').text, new RegExp(`\\(${t0} s, ${x0} m\\) and \\(${t1} s, ${x1} m\\)[\\s\\S]*\\$${x1} - ${x0} = 6\\$ m[\\s\\S]*\\$${t1} - ${t0} = 3\\$ s`));
  assert.match(one('position-and-velocity', 'slope').text, /\[6 m\]\{\.red\} in \[3 s\]\{\.green\}[\s\S]*\\frac\{6\}\{3\} = 2/);
  assert.equal(x1 - x0, 6);
  assert.equal(t1 - t0, 3);
});

test('lesson 1: velocity read from two points on a graph', () => {
  for (const step of variants('position-and-velocity', 'read-velocity')) {
    const fig = step.figures[0];
    const [p, q] = fig.points;
    const v = (q.x - p.x) / (q.t - p.t);
    assert.equal(step.answer, v);
    assert.equal(step.unit, 'm/s');
    for (const pt of [p, q]) {
      assert.equal(pt.x, fig.start + fig.velocities[0] * pt.t, 'marked point is on the drawn line');
      assert.equal(pt.label, `(${pt.t} s, ${pt.x} m)`);
      assert.ok(pt.x >= 0 && pt.x <= fig.track && pt.t >= 0 && pt.t <= fig.duration);
    }
    assert.ok(fig.start + fig.velocities[0] * fig.duration <= fig.track, 'the whole line fits on the axes');
    assert.ok(q.t - p.t >= 2);
    assert.ok(fig.alt.includes(`${p.x} metres at ${p.t} seconds`) && fig.alt.includes(`${q.x} metres at ${q.t} seconds`));
    assert.ok(step.explain.includes(`$${q.x} - ${p.x} = ${q.x - p.x}$ m in $${q.t} - ${p.t} = ${q.t - p.t}$ s`) && step.explain.includes(`= ${v}$ m/s`));
    assert.ok(step.hints[1].includes(`$${q.x} - ${p.x} = ${q.x - p.x}$`) && step.hints[1].includes(`$${q.t} - ${p.t} = ${q.t - p.t}$`));
  }
});

test('lesson 1: a negative velocity from two positions', () => {
  for (const step of variants('position-and-velocity', 'moving-back')) {
    const text = flat(step.text);
    const [tA, xA, tB, xB] = grab(/At \$t = (\d+)\$ s a .+? is at the \*\*(\d+) m\*\* mark .+? At \$t = (\d+)\$ s the .+? is at the \*\*(\d+) m\*\* mark/, text).map(Number);
    const v = (xB - xA) / (tB - tA);
    assert.equal(step.answer, v);
    assert.ok(v < 0 && Number.isInteger(v) && tB > tA && xB > 0);
    assert.match(text, /Moving away from the 0 m mark counts as positive/);
    assert.equal(step.unit, 'm/s');
    assert.ok(step.explain.includes(`= ${v}$ m/s`) && step.explain.includes(`$${xB} - ${xA} = ${xB - xA}$ m in ${tB - tA} s`));
  }
});

test('lesson 1: the fastest stage is the steepest one, whichever way it tilts', () => {
  for (const step of variants('position-and-velocity', 'fastest-stage')) {
    const fig = step.figures[0];
    const pos = tripPositions(fig.start, fig.velocities, fig.stage);
    assert.ok(pos.every((x) => x >= 0 && x <= fig.track), `on the axes: ${pos}`);
    const steep = pos.slice(1).map((x, i) => Math.abs(x - pos[i]) / fig.stage);
    const top = Math.max(...steep);
    assert.equal(steep.filter((v) => v === top).length, 1, 'one stage is strictly fastest');
    assert.equal(step.options.findIndex((o) => o.correct), steep.indexOf(top));
    assert.deepEqual(step.options.map((o) => o.text), fig.stageLabels.map((l) => `Stage ${l}`));
    assert.equal(step.shuffle, false);
    assert.ok(fig.alt.includes(pos.map((x) => `${x} m`).join(', then ')));
    assert.ok(step.explain.includes(`${top} m/s`));
    step.options.forEach((o, i) => {
      if (/flat/.test(o.why)) assert.equal(fig.velocities[i], 0);
      if (/steepest \*climb\*/.test(o.why)) {
        assert.equal(fig.velocities[i], Math.max(...fig.velocities));
        assert.ok(o.why.includes(`at ${fig.velocities[i]} m/s`) && fig.velocities[steep.indexOf(top)] < 0);
      }
      if (/highest \*position\*/.test(o.why)) assert.equal(pos[i + 1], Math.max(...pos));
      if (o.correct) assert.ok(o.why.includes(`${top * fig.stage} m in ${fig.stage} s`));
    });
  }
});

test('lesson 1: distance, time and speed', () => {
  const kinds = new Set();
  for (const step of variants('position-and-velocity', 'speed-time-distance')) {
    const text = flat(step.text);
    let m;
    if ((m = /at a steady \*\*(\d+) m\/s\*\* for \*\*(\d+) s\*\*\. What distance/.exec(text))) {
      assert.equal(step.answer, m[1] * m[2]); assert.equal(step.unit, 'm'); kinds.add('d');
    } else if ((m = /at a steady \*\*(\d+) m\/s\*\*\. How long does a distance of \*\*(\d+) m\*\* take/.exec(text))) {
      assert.equal(step.answer, m[2] / m[1]); assert.equal(step.unit, 's'); kinds.add('t');
    } else {
      m = grab(/covers \*\*(\d+) m\*\* in \*\*(\d+) s\*\*, \w+ at a steady speed\. What is that speed/, text);
      assert.equal(step.answer, m[0] / m[1]); assert.equal(step.unit, 'm/s'); kinds.add('v');
    }
    assert.ok(Number.isInteger(step.answer) && step.answer > 0);
  }
  assert.equal(kinds.size, 3);
});

test('lesson 1: which graph tells the story (slow away, stop, fast back)', () => {
  const step = one('position-and-velocity', 'story');
  const paths = [...step.figures[0].content.matchAll(/<path class="stroke-blue[^"]*"[^>]* d="([^"]+)"/g)].map((m) => [...m[1].matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((p) => [Number(p[1]), Number(p[2])]));
  assert.equal(paths.length, 4);
  const fits = paths.map((pts) => {
    const slopes = pts.slice(1).map((p, i) => -(p[1] - pts[i][1]) / (p[0] - pts[i][0]));    // screen y points down
    const home = Math.abs(pts[pts.length - 1][1] - pts[0][1]) < 0.5;
    return slopes.length === 3 && slopes[0] > 0 && Math.abs(slopes[1]) < 1e-9 && slopes[2] < 0 && -slopes[2] > slopes[0] && home;
  });
  assert.deepEqual(fits, [false, false, true, false]);
  assert.deepEqual(step.options.map((o) => !!o.correct), fits);
  assert.equal(step.shuffle, false);
});

test('lesson 1: cart challenges accept exactly the trips the instructions describe', () => {
  const drive = one('position-and-velocity', 'drive');
  assert.equal(drive.check(tripState([3, 0, -2, 1])), true);
  assert.equal(typeof drive.check(tripState([3, 0, -2, 1], { played: false })), 'string');
  assert.equal(typeof drive.check(tripState([3, 1, 2, 0])), 'string');          // runs off the far end
  assert.equal(typeof drive.check(tripState([1, 1, 0, 1])), 'string');          // never comes back
  assert.equal(typeof drive.check(tripState([2, 1, -1, -1])), 'string');        // never stands still
  assert.match(drive.check(tripState([-1, 0, 2, 0])), /runs off/);

  const match = one('position-and-velocity', 'match-target');
  const target = match.widget.target;
  const [lo, hi] = match.widget.vRange;
  const targetPos = tripPositions(0, target, match.widget.stage);
  assert.deepEqual(targetPos, [0, 4, 4, 10, 2]);
  assert.ok(targetPos.every((x) => x >= 0 && x <= match.widget.track));
  let accepted = 0;
  const vs = stepsOf(lo, hi);
  for (const a of vs) for (const b of vs) for (const c of vs) for (const d of vs) {
    const state = tripState([a, b, c, d], { target });
    const same = JSON.stringify(state.positions) === JSON.stringify(targetPos);
    const res = match.check(state);
    assert.equal(res === true, same, `match-target ${[a, b, c, d]}`);
    if (res === true) accepted++; else assert.equal(typeof res, 'string');
  }
  assert.equal(accepted, 1);
  assert.match(match.check(tripState([4, 0, 3, -4], { target })), /twice as far/);
  assert.match(match.check(tripState([2, 1, 3, -4], { target })), /flat/);
  assert.match(match.check(tripState([2, 0, 3, 4], { target })), /falls/);
  assert.match(flat(match.explain), /\$\+4\$ m in 2 s is \$2\$ m\/s\. Flat is \$0\$\. Then \$\+6\$ m in 2 s is \$3\$ m\/s, and \$-8\$ m in 2 s is \$-4\$ m\/s/);
  assert.match(match.hints[2], /falls from 10 m to 2 m: a change of −8 m in 2 s/);

  const delivery = one('position-and-velocity', 'delivery');
  const range = stepsOf(...delivery.widget.vRange);
  const winners = [];
  for (const a of range) for (const b of range) for (const c of range) for (const d of range) {
    const state = tripState([a, b, c, d], { track: delivery.widget.track });
    const p = state.positions;
    const obeys = !state.crashed && p[2] === 10 && p[3] === 10 && p[4] === 0;      // at 10 m at 4 s, still there at 6 s, home at 8 s
    assert.equal(delivery.check(state) === true, obeys, `delivery ${[a, b, c, d]}`);
    if (obeys) winners.push([a, b, c, d]);
  }
  assert.equal(winners.length, 6);
  for (const w of winners) { assert.equal(w[0] + w[1], 5); assert.equal(w[2], 0); assert.equal(w[3], -5); }
  assert.ok(winners.some((w) => String(w) === String(delivery.solution.velocities)));
  assert.match(flat(delivery.explain), /average\* velocity over those 4 s is \$\\frac\{10\}\{4\} = 2\.5\$ m\/s/);
});

/* ---------------------------------------------------------------- lesson 2 */

/** The facts ramp-roll reports for a car with starting velocity v0 and acceleration a after T seconds. */
function runState(v0, a, T) {
  const tStop = a < 0 ? v0 / -a : Infinity;
  const tt = Math.min(T, tStop);
  return { a, v0, ran: true, vEnd: tStop <= T ? 0 : v0 + a * T, distance: v0 * tt + 0.5 * a * tt * tt, stopped: tStop <= T, stopTime: Number.isFinite(tStop) ? round4(tStop) : null };
}

test('lesson 2: the ramp, the speed table and the free-fall table', () => {
  const hook = one('acceleration', 'hook');
  const a = (2 * 1) / (1 * 1);                         // 1 m in the first second, from rest: d = ½·a·t²
  assert.equal(hook.widget.a, a);
  const where = hook.widget.predict.map((t) => 0.5 * a * t * t);
  assert.deepEqual(where, [4, 9, 16]);
  assert.equal(hook.check({ guesses: where }), true);
  assert.equal(hook.check({ guesses: [2, 3, 4] }), false);          // "1 m every second"
  assert.ok(where[2] <= hook.widget.length);
  // the pattern is stated on the teaching screen that follows the prediction
  assert.match(flat(one('acceleration', 'teach-faster').text), /1 m, then 3 m, then 5 m, then 7 m\. Counted from the top, that puts it at 1, 4, 9 and 16 m/);
  assert.equal(one('acceleration', 'teach-faster').figures[0].a, a);
  assert.match(flat(hook.explain), /After 4 s it is already 16 m down the ramp/);

  const gain = one('acceleration', 'gain');
  const cells = (label) => flat(grab(new RegExp(`\\| ${label} \\|([^\\n]+)`), gain.text)[0]).split('|').map((c) => c.trim()).filter(Boolean).map(Number);
  const times = cells('Time \\(s\\)');
  const speeds = cells('Speed \\(m/s\\)');
  speeds.forEach((v, i) => assert.equal(v, a * times[i]));
  for (let i = 1; i < speeds.length; i++) assert.equal((speeds[i] - speeds[i - 1]) / (times[i] - times[i - 1]), gain.answer);
  assert.equal(gain.figures[0].a, a);

  const info = one('acceleration', 'name-it').figures[0];
  for (const pt of info.points) assert.equal(pt.v, info.v0 + info.a * pt.t);

  const fall = one('acceleration', 'free-fall').text;
  const row = (label) => flat(grab(new RegExp(`\\| ${label} \\|([^\\n]+)`), fall)[0]).split('|').map((c) => c.trim()).filter(Boolean).map(Number);
  const ts = row('Time falling \\(s\\)');
  row('Speed \\(m/s\\)').forEach((v, i) => assert.equal(v, g * ts[i]));
  row('Distance fallen \\(m\\)').forEach((d, i) => near(d, fallen(ts[i]) || 0, 1e-6));
  assert.match(fall, /about \$9\.8 \\text\{ m\/s\}\^2\$/);
});

test('lesson 2: only 3 m/s² reaches the target, only −3 m/s² stops the car in 4 s', () => {
  const up = one('acceleration', 'speed-up');
  const [vTarget, T] = grab(/to (\d+) m\/s in exactly (\d+) s/, flat(up.text)).map(Number);
  assert.equal(up.widget.duration, T);
  assert.deepEqual(up.widget.target, { t: T, v: vTarget });
  for (const a of stepsOf(...up.widget.aRange)) {
    const state = runState(up.widget.v0, a, T);
    assert.equal(up.check(state) === true, state.vEnd === vTarget, `speed-up a=${a}`);
    assert.equal(up.check(state) === true, a === 3);
    assert.ok(state.distance <= up.widget.length, 'the run stays on the road');
    assert.equal(typeof up.check({ ...state, ran: false }), 'string');
  }
  assert.equal(up.solution.a, vTarget / T);

  const brake = one('acceleration', 'brake');
  const v0 = Number(grab(/already doing \*\*(\d+) m\/s\*\*/, flat(brake.text))[0]);
  assert.equal(brake.widget.v0, v0);
  for (const a of stepsOf(...brake.widget.aRange)) {
    const state = runState(v0, a, brake.widget.duration);
    const restsExactlyAtEnd = a < 0 && v0 / -a === brake.widget.duration;
    const res = brake.check(state);
    assert.equal(res === true, restsExactlyAtEnd, `brake a=${a}`);
    if (a > 0) assert.match(res, /got faster/);
    if (a < 0 && v0 / -a < 4) assert.ok(res.includes(`at rest after ${state.stopTime} s`));
    if (a < 0 && v0 / -a > 4) assert.ok(res.includes(`still doing ${state.vEnd} m/s`));
  }
  assert.equal(brake.solution.a, -v0 / brake.widget.duration);
  assert.ok(runState(v0, -3, 4).distance <= brake.widget.length);
});

test('lesson 2: v = a·t in all three directions', () => {
  const kinds = new Set();
  for (const step of variants('acceleration', 'v-equals-at')) {
    const text = flat(step.text);
    assert.match(text, /starts from rest/);
    let m;
    if ((m = /accelerates steadily at \*\*\$([\d.]+) \\text\{ m\/s\}\^2\$\*\* for \*\*(\d+) s\*\*\. What speed/.exec(text))) {
      near(step.answer, m[1] * m[2]); assert.equal(step.unit, 'm/s'); kinds.add('v');
    } else if ((m = /reaches \*\*(\d+) m\/s\*\* in \*\*(\d+) s\*\*, speeding up steadily\. What is the acceleration/.exec(text))) {
      near(step.answer, m[1] / m[2]); assert.equal(step.unit, 'm/s²'); kinds.add('a');
    } else {
      m = grab(/accelerates steadily at \*\*\$([\d.]+) \\text\{ m\/s\}\^2\$\*\*\. How long does it take to reach \*\*(\d+) m\/s\*\*/, text);
      near(step.answer, m[1] / m[0]); assert.equal(step.unit, 's'); kinds.add('t');
    }
    assert.ok(step.answer > 0);
  }
  assert.equal(kinds.size, 3);
});

test('lesson 2: acceleration read from a velocity–time graph', () => {
  let slowing = 0;
  for (const step of variants('acceleration', 'read-vt')) {
    const fig = step.figures[0];
    const [p, q] = fig.points;
    const a = (q.v - p.v) / (q.t - p.t);
    assert.equal(step.answer, a);
    assert.equal(step.unit, 'm/s²');
    assert.equal(p.t, 0);
    assert.equal(q.t, fig.duration);
    assert.equal(fig.v0, p.v);
    assert.equal(fig.a, a);
    assert.equal(q.v, fig.v0 + fig.a * q.t);
    assert.ok(Math.min(p.v, q.v) >= 0 && Math.max(p.v, q.v) <= fig.vMax, 'the line stays on the axes');
    assert.equal(p.label, `(0 s, ${p.v} m/s)`);
    assert.equal(q.label, `(${q.t} s, ${q.v} m/s)`);
    assert.ok(step.explain.includes(`$${q.v} - ${p.v} = ${q.v - p.v}$ m/s in ${q.t} s`) && step.explain.includes(`= ${a} \\text{ m/s}^2$`));
    assert.equal(/Negative: it is slowing down/.test(step.explain), a < 0);
    if (a < 0) slowing++;
  }
  assert.ok(slowing > 40 && slowing < SEEDS - 40);
});

test('lesson 2: a flat velocity–time line is steady motion', () => {
  for (const step of variants('acceleration', 'flat-line', 40)) {
    const fig = step.figures[0];
    assert.equal(fig.a, 0);
    assert.ok(fig.v0 > 0 && fig.v0 <= fig.vMax);
    assert.equal(correctText(step), `Moving at a steady ${fig.v0} m/s`);
    assert.ok(step.explain.includes(`stays at ${fig.v0} m/s`));
  }
  assert.match(correctText(one('acceleration', 'fall-predict')), /land together/);
});

test('lesson 2: free fall with g = 10 m/s², stated in the question', () => {
  const kinds = new Set();
  for (const step of variants('acceleration', 'fall-speed')) {
    const text = flat(step.text);
    assert.match(text, /Take \$g = 10 \\text\{ m\/s\}\^2\$ and ignore the air/);
    let m;
    if ((m = /falls for \*\*(\d+) s\*\*\. How fast is it moving/.exec(text))) {
      assert.equal(step.answer, g * m[1]); assert.equal(step.unit, 'm/s'); kinds.add('v');
    } else {
      m = grab(/starts from rest\. How long does it take to reach \*\*(\d+) m\/s\*\*/, text);
      assert.equal(step.answer, m[0] / g); assert.equal(step.unit, 's'); kinds.add('t');
    }
  }
  assert.equal(kinds.size, 2);
  for (const step of variants('acceleration', 'how-far')) {
    const text = flat(step.text);
    assert.match(text, /Take \$g = 10 \\text\{ m\/s\}\^2\$ and ignore the air/);
    const t = Number(grab(/\*\*(\d+) s\*\*/, text)[0]);
    near(step.answer, fallen(t), 1e-6);
    assert.equal(step.unit, 'm');
    assert.notEqual(g * t, step.answer, 'speed and distance are different numbers, so a lucky slip cannot pass');
    assert.ok(step.explain.includes(`from 0 to ${g * t} m/s`) && step.explain.includes(`$= ${(g * t) / 2} \\times ${t} = ${step.answer}$ m`));
  }
  const drop = one('acceleration', 'drop');
  near(Math.sqrt((2 * drop.widget.height) / g), 2);                  // both land after 2 s without air
  assert.equal(drop.check({ vacuumRuns: 1 }), true);
  assert.equal(typeof drop.check({ vacuumRuns: 0, airRuns: 3 }), 'string');
});

/* ---------------------------------------------------------------- lesson 3 */

test('lesson 3: net force from the arrows in the figure', () => {
  const scenes = new Set();
  for (const step of variants('forces-newton', 'net-force')) {
    const forces = arrows(step.figures[0]);
    const net = forces.reduce((sum, f) => sum + f.dir * f.n, 0);
    assert.notEqual(net, 0);
    const [size, way] = step.blanks;
    assert.deepEqual(size.numbers, [Math.abs(net)]);
    assert.equal(way.kind, 'select');
    assert.equal(way.answer, net > 0 ? 'right' : 'left');
    assert.deepEqual([...way.options].sort(), ['left', 'right']);
    // the story names the same forces as the picture
    const story = flat(step.text).split('cancelling.')[1];
    assert.deepEqual([...story.matchAll(/(\d+) N/g)].map((m) => Number(m[1])).sort((a, b) => a - b), forces.map((f) => f.n).sort((a, b) => a - b));
    const tug = /pulls the rope left with (\d+) N\. The other pulls right with (\d+) N/.exec(story);
    if (tug) {
      assert.equal(forces.find((f) => f.dir < 0).n, Number(tug[1]));
      assert.equal(forces.find((f) => f.dir > 0).n, Number(tug[2]));
      scenes.add('tug');
    } else {
      const back = Number(grab(/Friction pushes back with (\d+) N/, story)[0]);
      assert.deepEqual(forces.filter((f) => f.dir < 0).map((f) => f.n), [back]);
      assert.ok(net > 0, 'the push wins, so "back" is to the left');
      scenes.add(forces.length === 3 ? 'car' : 'crate');
    }
    assert.ok(step.explain.includes(`= ${Math.abs(net)}$ N`));
  }
  assert.equal(scenes.size, 3);
});

test('lesson 3: steady speed means the forces balance exactly', () => {
  for (const step of variants('forces-newton', 'steady')) {
    const text = flat(step.text);
    assert.match(text, /\*\*steady\*\* \d+ m\/s/);
    const n = Number(grab(/with (\d+) N\./, text)[0]);
    assert.equal(correctText(step), `Exactly ${n} N`);
    assert.deepEqual(step.options.filter((o) => !o.correct).map((o) => o.text).sort(), [`Less than ${n} N`, `More than ${n} N`, 'Zero'].sort());
    assert.ok(step.explain.includes(`${n} N each way`));
  }
  assert.equal(one('forces-newton', 'hook').options.findIndex((o) => o.correct), 1);
  assert.match(correctText(one('forces-newton', 'hook')), /stays exactly the same/);
});

test('lesson 3: F = m·a in all three directions', () => {
  const kinds = new Set();
  for (const step of variants('forces-newton', 'f-equals-ma')) {
    const text = flat(step.text);
    let m;
    if ((m = /net force of \*\*(\d+) N\*\* acts on .+? with a mass of \*\*(\d+) kg\*\*\. What is the acceleration/.exec(text))) {
      assert.equal(step.answer, m[1] / m[2]); assert.equal(step.unit, 'm/s²'); kinds.add('a');
    } else if ((m = /What net force is needed to give .+? with a mass of \*\*(\d+) kg\*\* an acceleration of \*\*\$(\d+) \\text\{ m\/s\}\^2\$\*\*/.exec(text))) {
      assert.equal(step.answer, m[1] * m[2]); assert.equal(step.unit, 'N'); kinds.add('F');
    } else {
      m = grab(/net force of \*\*(\d+) N\*\* gives .+? an acceleration of \*\*\$(\d+) \\text\{ m\/s\}\^2\$\*\*\. What is the mass/, text);
      assert.equal(step.answer, m[0] / m[1]); assert.equal(step.unit, 'kg'); kinds.add('m');
    }
    assert.ok(Number.isInteger(step.answer) && step.answer > 0);
  }
  assert.equal(kinds.size, 3);
});

test('lesson 3: acceleration with friction uses the net force', () => {
  for (const step of variants('forces-newton', 'with-friction')) {
    const [m, push, friction] = grab(/A \*\*(\d+) kg\*\* crate is pushed across a floor with \*\*(\d+) N\*\*\. Friction pushes back with \*\*(\d+) N\*\*/, flat(step.text)).map(Number);
    const a = (push - friction) / m;
    assert.equal(step.answer, a);
    assert.ok(Number.isInteger(a) && a > 0);
    assert.equal(step.unit, 'm/s²');
    assert.deepEqual(arrows(step.figures[0]).map((f) => f.dir * f.n), [push, -friction]);
    assert.ok(step.figures[0].content.includes(`>${m} kg<`));
    // the three classic slips are all different from the answer and from each other
    assert.deepEqual(step.wrong.map((w) => w[0]), [push / m, (push + friction) / m, push - friction]);
    assert.equal(new Set([a, ...step.wrong.map((w) => w[0])]).size, 4);
    assert.ok(step.explain.includes(`$= ${push} - ${friction} = ${push - friction}$ N`) && step.explain.includes(`\\frac{${push - friction}}{${m}} = ${a} \\text{ m/s}^2`));
  }
});

test('lesson 3: heavy and light fall with the same acceleration', () => {
  for (const step of variants('forces-newton', 'falling-together', 60)) {
    const text = flat(step.text);
    assert.match(text, /every kilogram with about 10 N/);
    const [mH, nameH, mL, nameL] = grab(/A ([\d.]+) kg (.+?) and a ([\d.]+) kg (.+?) are dropped, with no air/, text);
    const weights = [Number(mH) * g, Number(mL) * g];
    assert.deepEqual(step.blanks.map((b) => b.numbers[0]), [weights[0], weights[0] / mH, weights[1], weights[1] / mL]);
    assert.deepEqual(step.blanks.map((b) => b.numbers[0]).filter((_, i) => i % 2), [g, g]);
    assert.ok(step.template.indexOf(nameH) < step.template.indexOf(nameL));
    const ratio = Number(grab(/pulled (\d+) times harder, but it is also (\d+) times harder/, step.explain)[0]);
    near(ratio, mH / mL, 1e-9);
    near(Number(grab(/also (\d+) times harder/, step.explain)[0]), mH / mL, 1e-9);
  }
});

test('lesson 3: cart challenges accept exactly the settings the instructions describe', () => {
  const ice = one('forces-newton', 'ice');
  assert.equal(ice.check({ friction: 0, ran: true }), true);
  assert.equal(typeof ice.check({ friction: 0, ran: false }), 'string');
  for (const f of stepsOf(...ice.widget.frictionRange).slice(1)) assert.equal(typeof ice.check({ friction: f, ran: true }), 'string');
  assert.ok(ice.widget.v0 * ice.widget.duration <= ice.widget.length, 'the frictionless glide stays in view');

  const bal = one('forces-newton', 'balance');
  const friction = Number(grab(/with (\d+) N\./, flat(bal.text))[0]);
  assert.equal(bal.widget.friction, friction);
  assert.equal(Number(grab(/sliding at \*\*(\d+) m\/s\*\*/, flat(bal.text))[0]), bal.widget.v0);
  for (const push of stepsOf(...bal.widget.pushRange)) {
    const net = push - friction;                                  // it is moving, so friction acts at full strength
    const state = { ran: true, push, friction, net, a: net / bal.widget.mass, steady: net === 0 };
    const res = bal.check(state);
    assert.equal(res === true, net === 0, `balance push=${push}`);
    if (net > 0) assert.ok(res.includes(`${net} N of net force`));
    if (net < 0) assert.match(res, /slows/);
    assert.equal(typeof bal.check({ ...state, ran: false }), 'string');
  }
  assert.equal(bal.solution.push, friction);

  const two = one('forces-newton', 'two-ways');
  assert.ok(!two.widget.friction && two.widget.v0 == null, 'smooth track, from rest');
  const wanted = Number(grab(/exactly \$(\d+) \\text\{ m\/s\}\^2\$/, flat(two.text))[0]);
  const runs = [];
  for (const push of stepsOf(...two.widget.pushRange)) for (const mass of stepsOf(...two.widget.massRange)) runs.push({ push, mass, friction: 0, a: round4(push / mass) });
  const winners = runs.filter((run) => run.push / run.mass === wanted);
  assert.deepEqual(winners.map((w) => `${w.push} N on ${w.mass} kg`), ['3 N on 1 kg', '6 N on 2 kg', '9 N on 3 kg', '12 N on 4 kg']);
  for (const w of winners) assert.ok(flat(two.explain).includes(`${w.push} N on ${w.mass} kg`), `explain lists ${w.push}/${w.mass}`);
  assert.equal(typeof two.check({ history: [] }), 'string');
  for (const run of runs) {
    const res = two.check({ history: [run] });
    assert.equal(typeof res, 'string', 'one run is never enough');
    if (run.a > wanted) assert.match(res, /too much/);
    if (run.a < wanted) assert.match(res, /too little/);
    assert.equal(typeof two.check({ history: [run, run] }), 'string', 'the same run twice is not two ways');
    for (const w of winners) assert.equal(two.check({ history: [w, run] }) === true, run.a === wanted && run !== w);
  }
  assert.ok(two.solution.history.every((run) => run.push / run.mass === wanted));
  assert.ok(winners.every((w) => 0.5 * wanted * two.widget.duration ** 2 <= two.widget.length && w.a === wanted));
});

/* ---------------------------------------------------------------- lesson 4 */

/** The state the projectile widget reports for one shot, from the formulas above. */
function shotState(widget, angle, speed, { launched = true, best = null } = {}) {
  const rad = (angle * Math.PI) / 180;
  const f = fly(speed * Math.cos(rad), speed * Math.sin(rad), widget.height || 0);
  const range = round4(f.range);
  let verdict = { hit: false, miss: null, error: null };
  if (widget.target) {
    const error = round4(range - widget.target.x);
    const hit = Math.abs(error) <= widget.target.width / 2 + 1e-9;
    verdict = { hit, miss: hit ? null : (error < 0 ? 'short' : 'long'), error };
  }
  return { angle, speed, launched, range, time: round4(f.time), best, shots: [{ angle, speed, range }], ...verdict };
}

test('lesson 4: brute-force flight agrees with the closed form', () => {
  for (const [vx, vy, h] of [[15, 0, 20], [8, 0, 45], [6, 15, 0], [14, 20, 0], [10, 17.3205, 0], [3, 0, 5]]) {
    const a = fly(vx, vy, h);
    const b = flyNumeric(vx, vy, h);
    near(b.time, a.time, 1e-5);
    near(b.range, a.range, 1e-5);
  }
});

test('lesson 4: the time in the air depends only on the height', () => {
  for (const step of variants('projectiles', 'fall-time')) {
    const text = flat(step.text);
    assert.match(text, /Take \$g = 10 \\text\{ m\/s\}\^2\$ and ignore the air/);
    const h = Number(grab(/(\d+) m high/, text)[0]);
    const v = Number(grab(/at (\d+) m\/s/, text)[0]);
    assert.match(text, /sideways|horizontally/);
    near(step.answer, flyNumeric(v, 0, h).time, 1e-5);
    near(step.answer, Math.sqrt((2 * h) / g));
    assert.equal(step.unit, 's');
    for (const [, d, t] of text.matchAll(/(\d+) m in (\d+) s/g)) near(Number(d), fallen(Number(t)), 1e-6, 'the table of falls in the question');
    assert.ok(new RegExp(`\\b${h} m in ${step.answer} s`).test(text), 'the needed fall is in the table');
    assert.ok(step.explain.includes(`${h} m takes ${step.answer} s`) && step.explain.includes(`${v} m/s`));
  }
});

test('lesson 4: range of a horizontal launch', () => {
  for (const step of variants('projectiles', 'how-far-out')) {
    const text = flat(step.text);
    assert.match(text, /Ignore the air/);
    assert.match(text, /level|horizontally/);
    const v = Number(grab(/at (\d+) m\/s/, text)[0]);
    const [h, t] = grab(/A fall of (\d+) m takes (\d+) s/, text).map(Number);
    assert.equal(Number(grab(/(\d+) m (?:above|high)/, text)[0]), h, 'the quoted fall is the height in the story');
    const flight = flyNumeric(v, 0, h);
    near(flight.time, t, 1e-5, 'the quoted fall time is right for g = 10');
    near(step.answer, flight.range, 1e-5);
    assert.equal(step.answer, v * t);
    assert.notEqual(step.answer, h, 'the range differs from the height, so a mix-up cannot pass');
    assert.equal(step.unit, 'm');
  }
});

test('lesson 4: the other angle with the same range', () => {
  const rangeAt = (deg) => fly(20 * Math.cos((deg * Math.PI) / 180), 20 * Math.sin((deg * Math.PI) / 180)).range;
  for (const step of variants('projectiles', 'pairs')) {
    const text = flat(step.text);
    assert.match(text, /above level ground/);
    assert.match(text, /same launch speed and no air/);
    const a = Number(grab(/launched at \*\*(\d+)°\*\*/, text)[0]);
    const others = [];
    for (let b = 1; b <= 89; b++) if (b !== a && Math.abs(rangeAt(b) - rangeAt(a)) < 1e-9) others.push(b);
    assert.deepEqual(others, [step.answer], `launched at ${a}°`);
    assert.equal(step.unit, '°');
    const off = Number(grab(/One is (\d+)° below 45°/, step.explain)[0]);
    assert.equal(off, Math.abs(45 - a));
  }
  // 45° is the single best angle on the launcher's slider
  const ranges = stepsOf(10, 80, 5).map((deg) => [deg, rangeAt(deg)]);
  const best = ranges.reduce((p, q) => (q[1] > p[1] ? q : p));
  assert.equal(best[0], 45);
  near(best[1], 40);
});

test('lesson 4: a kick from level ground', () => {
  for (const step of variants('projectiles', 'kick')) {
    const text = flat(step.text);
    assert.match(text, /from level ground/);
    assert.match(text, /Take \$g = 10 \\text\{ m\/s\}\^2\$ and ignore the air/);
    const [vx, vy] = grab(/\*\*(\d+) m\/s sideways\*\* and \*\*(\d+) m\/s upwards\*\*/, text).map(Number);
    const flight = flyNumeric(vx, vy, 0);
    near(step.answer, flight.range, 1e-5);
    assert.equal(step.unit, 'm');
    const [up, total] = [vy / g, (2 * vy) / g];
    near(flight.time, total, 1e-5);
    assert.ok(step.explain.includes(`rises for ${up} s`) && step.explain.includes(`${total} s in the air`) && step.explain.includes(`= ${step.answer}$ m`));
    assert.ok(step.hints[2].includes(`in the air for ${total} s`));
  }
});

test('lesson 4: fixed questions about a horizontal launch', () => {
  assert.match(correctText(one('projectiles', 'hook')), /land at the same moment/);
  const cliff = one('projectiles', 'hook').figures[0];
  near(flyNumeric(cliff.speed, 0, cliff.height).time, fallenTime(cliff.height), 1e-5);

  const faster = one('projectiles', 'faster-shot');
  assert.match(faster.text, /horizontally/);
  assert.match(faster.text, /Ignoring the air/);
  const slow = fly(7, 0, 20);
  const fast = fly(14, 0, 20);
  const truth = (text) => {
    if (/twice as far/.test(text)) return Math.abs(fast.range - 2 * slow.range) < 1e-9;
    if (/just as long/.test(text)) return Math.abs(fast.time - slow.time) < 1e-9;
    if (/for longer/.test(text)) return fast.time > slow.time + 1e-9;
    if (/sooner/.test(text)) return fast.time < slow.time - 1e-9;
    throw new Error(`unexpected option: ${text}`);
  };
  for (const o of faster.options) assert.equal(!!o.correct, truth(o.text), o.text);

  // strobe shadows: equal gaps sideways, growing gaps downwards
  const gaps = one('projectiles', 'gaps');
  const fig = gaps.figures[0];
  const times = stepsOf(0, fly(fig.speed, 0, fig.height).time - 1e-9, fig.strobe);
  const xs = times.map((t) => fig.speed * t);
  const drops = times.map((t) => 0.5 * g * t * t);
  const dx = xs.slice(1).map((x, i) => x - xs[i]);
  const dy = drops.slice(1).map((y, i) => y - drops[i]);
  assert.ok(dx.every((d) => Math.abs(d - dx[0]) < 1e-9));
  assert.ok(dy.every((d, i) => i === 0 || d > dy[i - 1]));
  assert.deepEqual(gaps.blanks.map((b) => b.answer), ['all equal', 'growing']);
  assert.match(gaps.text, /four times a second/);
  assert.equal(fig.strobe, 0.25);
});
const fallenTime = (h) => Math.sqrt((2 * h) / g);

test('lesson 4: launcher challenges accept exactly the settings the instructions describe', () => {
  const duel = one('projectiles', 'duel');
  assert.equal(duel.check({ shots: [] }) === true, false);
  assert.equal(duel.check({ shots: [{ speed: 10 }, { speed: 10 }] }) === true, false);
  assert.equal(duel.check({ shots: [{ speed: 10 }, { speed: 20 }] }), true);
  for (const v of stepsOf(...duel.widget.speedRange)) {
    const f = flyNumeric(v, 0, duel.widget.height);
    near(f.time, 2, 1e-5, 'every flight from the 20 m cliff lasts 2 s');
    assert.ok(f.range <= duel.widget.world[0], 'lands inside the picture');
  }

  const cliff = one('projectiles', 'cliff-target');
  const out = Number(grab(/flag stands (\d+) m out/, flat(cliff.text))[0]);
  assert.equal(cliff.widget.target.x, out);
  const hits = [];
  for (const v of stepsOf(...cliff.widget.speedRange)) {
    const state = shotState(cliff.widget, 0, v);
    near(state.range, flyNumeric(v, 0, cliff.widget.height).range, 1e-4);
    const res = cliff.check(state);
    assert.equal(res === true, state.range === out, `cliff-target speed=${v}`);
    if (res === true) hits.push(v); else assert.ok(res.includes(`${state.range} m out`));
    assert.equal(typeof cliff.check({ ...state, launched: false }), 'string');
  }
  assert.deepEqual(hits, [cliff.solution.speed]);
  assert.equal(hits[0], out / fallenTime(cliff.widget.height));

  const max = one('projectiles', 'max-range');
  assert.ok(!max.widget.height, 'level ground');
  const shots = stepsOf(...max.widget.angleRange).map((deg) => shotState(max.widget, deg, max.widget.speed));
  const furthest = shots.reduce((p, q) => (q.range > p.range ? q : p));
  assert.equal(shots.filter((s) => s.range === furthest.range).length, 1);
  for (const s of shots) {
    const res = max.check(s);
    assert.equal(res === true, s === furthest, `max-range ${s.angle}°`);
    if (res !== true) assert.match(res, s.angle < furthest.angle ? /aiming higher/ : /aiming lower/);
    assert.ok(s.range <= max.widget.world[0]);
    if (s !== furthest) assert.match(max.check({ ...s, best: furthest }), new RegExp(`your ${furthest.angle}° shot went further`));
  }
  assert.equal(max.solution.angle, furthest.angle);
  assert.ok(flat(max.explain).includes(`**${furthest.angle}°** wins, with ${furthest.range} m`));

  const same = one('projectiles', 'same-range');
  const ghost = same.widget.ghosts[0];
  const quoted = Number(grab(/It lands ([\d.]+) m away/, flat(same.text))[0]);
  const ghostRange = shotState(same.widget, ghost.angle, ghost.speed).range;
  assert.equal(Math.round(ghostRange * 10) / 10, quoted);
  assert.equal(same.widget.target.x, quoted);
  assert.equal(ghost.speed, same.widget.speed);
  assert.equal(Number(grab(/shot at \*\*(\d+)°\*\*/, flat(same.text))[0]), ghost.angle);
  const ok = [];
  for (const deg of stepsOf(...same.widget.angleRange)) {
    const state = shotState(same.widget, deg, same.widget.speed);
    const res = same.check(state);
    const lands = deg !== ghost.angle && Math.abs(state.range - ghostRange) < 1e-3;
    assert.equal(res === true, lands, `same-range ${deg}°`);
    if (res === true) ok.push(deg); else assert.equal(typeof res, 'string');
  }
  assert.deepEqual(ok, [90 - ghost.angle]);
  assert.equal(same.solution.angle, 90 - ghost.angle);
});

/* ---------------------------------------------------------------- lesson 5 */

/** Height of the energy track at x: the listed points joined by smooth (smoothstep) slopes. */
function trackHeight(pts, x) {
  let i = 0;
  while (i < pts.length - 2 && x > pts[i + 1][0]) i++;
  const u = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
  return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (3 * u * u - 2 * u * u * u);
}
/**
 * What happens to a ball released from rest at height h0 on the first slope.
 * Energy per kilogram, written as a height: h0 minus mu × (horizontal distance
 * travelled), the widget's documented friction model. The ball goes on while
 * that is above the track, and turns round where the two meet. (Meeting a
 * hilltop exactly is not getting over it: the ball arrives with no speed left.)
 */
function ride(pts, h0, mu) {
  let lo = pts[0][0];
  let hi = pts[1][0];
  for (let n = 0; n < 80; n++) { const mid = (lo + hi) / 2; if (trackHeight(pts, mid) > h0) lo = mid; else hi = mid; }   // release point, by bisection
  const xStart = (lo + hi) / 2;
  const xEnd = pts[pts.length - 1][0];
  for (let x = xStart + 1e-3; x <= xEnd; x += 1e-3) {
    if (h0 - mu * (x - xStart) < trackHeight(pts, x) + 1e-6) return { finished: false, climbHeight: trackHeight(pts, x) };
  }
  return { finished: true, climbHeight: Math.max(...pts.slice(2).map((p) => p[1])) };
}

test('lesson 5: track challenges, from energy conservation', () => {
  const hook = one('energy', 'hook');
  const pts = hook.figures[0].track;
  const [release, hill] = [Number(grab(/\*\*(\d+) m\*\* up a perfectly smooth track/, flat(hook.text))[0]), Number(grab(/hill \*\*(\d+) m\*\* high/, flat(hook.text))[0])];
  assert.equal(hook.figures[0].start, release);
  assert.equal(Math.max(...pts.slice(1, -1).map((p) => p[1])), hill);
  assert.equal(ride(pts, release, 0).finished, false);
  assert.match(correctText(hook), /cannot get higher than where it started/);

  const low = one('energy', 'lowest-start');
  assert.match(low.text, /6 m hill/);
  const passes = [];
  for (const start of stepsOf(...low.widget.startRange)) {
    const r = ride(low.widget.track, start, 0);
    assert.equal(r.finished, start > hill, `frictionless from ${start} m`);
    const res = low.check({ ran: true, start, friction: false, ...r });
    if (r.finished) passes.push(start);
    assert.equal(res === true, r.finished && start === Math.min(...stepsOf(...low.widget.startRange).filter((h) => h > hill)), `lowest-start ${start}`);
    if (res !== true) assert.equal(typeof res, 'string');
    assert.equal(typeof low.check({ ran: false, start, friction: false, ...r }), 'string');
  }
  assert.equal(low.solution.start, passes[0]);
  assert.equal(passes[0], 7);

  const fr = one('energy', 'friction');
  assert.deepEqual(fr.widget.track, low.widget.track);
  const reaches = [];
  for (const start of stepsOf(...fr.widget.startRange)) {
    const r = ride(fr.widget.track, start, fr.widget.mu);
    if (r.finished) reaches.push(start);
    const state = { ran: true, start, friction: true, finished: r.finished, climbHeight: Math.round(r.climbHeight * 100) / 100 };
    const res = fr.check(state);
    assert.equal(typeof fr.check({ ...state, friction: false }), 'string', 'friction must be switched on');
    assert.equal(typeof fr.check({ ...state, ran: false }), 'string');
    if (res !== true && !r.finished) assert.ok(r.climbHeight < Math.min(start, hill), 'with friction it turns round below the hilltop and below its release height');
  }
  assert.ok(reaches.length >= 2 && reaches.every((h, i) => i === 0 || h === reaches[i - 1] + 1), 'everything above the threshold makes it');
  for (const start of stepsOf(...fr.widget.startRange)) {
    const r = ride(fr.widget.track, start, fr.widget.mu);
    assert.equal(fr.check({ ran: true, start, friction: true, finished: r.finished, climbHeight: r.climbHeight }) === true, start === reaches[0], `friction ${start}`);
  }
  assert.equal(fr.solution.start, reaches[0]);
  assert.equal(reaches[0], 9);
  assert.match(flat(fr.explain), /9 m instead of 7 m/);
  assert.match(flat(fr.text), /7 m is no longer enough/);
  assert.equal(ride(fr.widget.track, 7, fr.widget.mu).finished, false);

  const bars = one('energy', 'watch-bars');
  assert.match(correctText(bars), /bottom of the valley/);
  const heavier = one('energy', 'heavier');
  assert.match(correctText(heavier), /energies are bigger, but its speeds and heights are the same/);
  for (const m of stepsOf(...heavier.figures[0].massRange)) {
    const top = m * g * heavier.figures[0].start;
    near(Math.sqrt((2 * top) / m), Math.sqrt(2 * g * heavier.figures[0].start));      // ½·m·v² = m·g·h: the same speed for every mass
  }
});

test('lesson 5: potential and kinetic energy', () => {
  for (const step of variants('energy', 'potential')) {
    const text = flat(step.text);
    assert.match(text, /Take \$g = 10 \\text\{ m\/s\}\^2\$/);
    const [m, h] = grab(/A \*\*(\d+) kg\*\* .+?, \*\*([\d.]+) m\*\* above/, text).map(Number);
    near(step.answer, m * g * h);
    assert.equal(step.unit, 'J');
    assert.ok(step.explain.includes(`${m} \\times 10 \\times ${h} = ${step.answer}$ J`));
  }
  for (const step of variants('energy', 'kinetic')) {
    const text = flat(step.text);
    const m = Number(grab(/\*\*([\d.]+) kg\*\*/, text)[0]);
    const v = Number(grab(/\*\*(\d+) m\/s\*\*/, text)[0]);
    near(step.answer, ke(m, v));
    assert.equal(step.unit, 'J');
    assert.ok(!/\broll/.test(text), 'a rolling ball also has rotational kinetic energy, so ½·m·v² would not be all of it');
    assert.ok(step.explain.includes(`\\times ${m} \\times ${v * v} = ${step.answer}$ J`));
  }
});

test('lesson 5: energy bookkeeping and the speed at the bottom', () => {
  for (const step of variants('energy', 'bookkeeping')) {
    const text = flat(step.text);
    assert.match(text, /starts from rest/);
    assert.match(text, /There is no friction/);
    const total = Number(grab(/with \*\*(\d+) J\*\* of potential energy/, text)[0]);
    const pe = Number(grab(/the potential energy is \*\*([\d.]+) J\*\*/, text)[0]);
    assert.ok(pe > 0 && pe < total);
    near(step.answer, total - pe);
    assert.equal(step.unit, 'J');
    assert.ok(step.explain.includes(`$${total} - ${pe} = ${step.answer}$ J`));
  }
  for (const step of variants('energy', 'speed-at-bottom')) {
    const text = flat(step.text);
    assert.match(text, /Ignore friction and air/);
    assert.match(text, /Take \$g = 10 \\text\{ m\/s\}\^2\$/);
    assert.match(text, /from rest|let go/);
    const h = Number(grab(/(?:top of an? |descends |comes down |seat is |ramp )([\d.]+) m/, text)[0]);
    const v = Math.sqrt(2 * g * h);                                  // m·g·h = ½·m·v²
    near(step.answer, v, 1e-9);
    assert.ok(Number.isInteger(step.answer));
    near(ke(3, step.answer), 3 * g * h, 1e-9, 'kinetic energy at the bottom equals potential energy at the top');
    assert.equal(step.unit, 'm/s');
    assert.ok(step.explain.includes(`2 \\times 10 \\times ${h} = ${Math.round(2 * g * h)}$`));
  }
  const match = one('energy', 'match');
  assert.deepEqual(match.pairs.map((p) => p[1]), ['All potential', 'All kinetic', 'Part kinetic, part potential', 'All turned to heat']);
});

/* ---------------------------------------------------------------- lesson 6 */

/** The facts collision-lab reports, from the collide() above. */
function crashState(m1, v1, m2, v2, mode) {
  const collides = v1 - v2 > 0;
  const { u1, u2 } = collides ? collide(m1, v1, m2, v2, mode === 'bouncy' ? 1 : 0) : { u1: v1, u2: v2 };
  return { m1, v1, m2, v2, mode, ran: true, collides, together: collides && mode === 'sticky', u1: round4(u1), u2: round4(u2), pBefore: m1 * v1 + m2 * v2, pAfter: m1 * u1 + m2 * u2, keBefore: ke(m1, v1) + ke(m2, v2), keAfter: ke(m1, u1) + ke(m2, u2) };
}

test('lesson 6: momentum of one object, with its sign', () => {
  let lefts = 0;
  for (const step of variants('momentum', 'find-momentum')) {
    const text = flat(step.text);
    assert.match(text, /Taking right as positive/);
    const [m, way, v] = grab(/A \*\*([\d.]+) kg\*\* .+? is moving to the \*\*(left|right)\*\* at \*\*(\d+) m\/s\*\*/, text);
    const p = Number(m) * Number(v) * (way === 'left' ? -1 : 1);
    near(step.answer, p);
    assert.equal(step.unit, 'kg·m/s');
    assert.equal(/Negative, because it is moving left/.test(step.explain), way === 'left');
    if (way === 'left') lefts++;
  }
  assert.ok(lefts > 30 && lefts < SEEDS - 30);
});

test('lesson 6: sticky collisions share the momentum over the total mass', () => {
  for (const step of variants('momentum', 'sticky-speed')) {
    const text = flat(step.text);
    assert.match(text, /Ignore friction/);
    assert.match(text, /standing still|stationary|at rest/);
    const [m1, m2] = [...text.matchAll(/\*\*(\d+) kg\*\*/g)].map((m) => Number(m[1]));
    const v1 = Number(grab(/\*\*(\d+) m\/s\*\*/, text)[0]);
    const { u1, u2 } = collide(m1, v1, m2, 0, 0);
    near(u1, u2);
    near(step.answer, u1);
    near(m1 * v1, (m1 + m2) * step.answer, 1e-9, 'momentum before = momentum after');
    assert.ok(Number.isInteger(step.answer) && step.answer > 0 && step.answer < v1);
    assert.ok(ke(m1 + m2, step.answer) < ke(m1, v1), 'a sticky collision loses kinetic energy');
    assert.notEqual(m1, m2, 'unequal masses, so "half the speed" is never right');
    assert.equal(step.unit, 'm/s');
    assert.ok(step.explain.includes(`$${m1} \\times ${v1} = ${m1 * v1}$ kg·m/s`) && step.explain.includes(`\\frac{${m1 * v1}}{${m1 + m2}} = ${step.answer}$ m/s`));
  }
});

test('lesson 6: force × time = change in momentum', () => {
  for (const step of variants('momentum', 'stop-force')) {
    const text = flat(step.text);
    assert.match(text, /average force/);
    const [m, v, t] = grab(/\*\*(\d+) kg\*\* dummy is moving at \*\*(\d+) m\/s\*\* .+? bring it to rest in \*\*([\d.]+) s\*\*/, text).map(Number);
    const F = (m * v) / t;
    near(step.answer, F);
    assert.equal(step.unit, 'N');
    assert.ok((v * t) / 2 <= 2, `stopping from ${v} m/s in ${t} s takes ${(v * t) / 2} m: it has to fit inside a car`);
    const [p, hard, times] = grab(/\\frac\{(\d+)\}\{0\.01\} = (\d+)\$ N: (\d+) times as much/, step.explain).map(Number);
    assert.equal(p, m * v);
    near(hard, (m * v) / 0.01);
    near(times, hard / F);
    assert.ok(step.explain.includes(`\\frac{${m * v}}{${t}} = ${step.answer}$ N`));
  }
});

test('lesson 6: cart challenges accept exactly the settings the instructions describe', () => {
  const hook = one('momentum', 'hook');
  const start = hook.figures[0];
  assert.match(flat(hook.text), /mass of 3 kg and rolls at 4 m\/s towards cart B, which has a mass of 1 kg and is standing still/);
  assert.deepEqual([start.m1, start.v1, start.m2, start.v2, start.mode], [3, 4, 1, 0, 'sticky']);
  assert.equal(correctText(hook), `${collide(start.m1, start.v1, start.m2, start.v2, 0).u1} m/s`);

  const lab = one('momentum', 'sticky-lab');
  for (const m2 of stepsOf(...lab.widget.m2Range)) {
    const s = crashState(lab.widget.m1, lab.widget.v1, m2, 0, 'sticky');
    near(s.pBefore, 12);                                           // "the Total is 12 before and 12 after"
    near(s.pAfter, 12);
    assert.ok(s.keAfter < s.keBefore);
  }
  assert.equal(lab.check({ history: [{ m2: 1 }, { m2: 3 }, { m2: 5 }] }), true);
  assert.equal(typeof lab.check({ history: [{ m2: 1 }, { m2: 1 }, { m2: 3 }] }), 'string');
  assert.equal(typeof lab.check({ history: [] }), 'string');

  const share = one('momentum', 'share-it');
  const wanted = Number(grab(/moves off at exactly (\d+) m\/s/, flat(share.text))[0]);
  const fits = [];
  for (const m2 of stepsOf(...share.widget.m2Range)) {
    const s = crashState(share.widget.m1, share.widget.v1, m2, share.widget.v2, 'sticky');
    const res = share.check(s);
    assert.equal(res === true, Math.abs(collide(3, 4, m2, 0, 0).u1 - wanted) < 1e-12, `share-it m2=${m2}`);
    if (res === true) fits.push(m2); else assert.match(res, s.u1 > wanted ? /Too fast/ : /Too slow/);
    assert.equal(typeof share.check({ ...s, ran: false }), 'string');
  }
  assert.deepEqual(fits, [share.solution.m2]);
  assert.equal(fits[0], (3 * 4) / wanted - 3);

  const head = one('momentum', 'head-on');
  assert.match(flat(head.text), /Cart A \(2 kg\) rolls right at 3 m\/s\. Cart B has a mass of 3 kg/);
  const stops = [];
  for (const v2 of stepsOf(...head.widget.v2Range)) {
    const s = crashState(head.widget.m1, head.widget.v1, head.widget.m2, v2, 'sticky');
    assert.ok(s.collides, 'A always catches B on this slider');
    const res = head.check(s);
    assert.equal(res === true, s.pBefore === 0, `head-on v2=${v2}`);
    if (res === true) stops.push(v2);
    else if (v2 < 0) assert.match(res, s.pBefore > 0 ? /Not enough/ : /Too much/);
    else assert.match(res, /negative velocity/);
  }
  assert.deepEqual(stops, [head.solution.v2]);
  assert.equal(stops[0], -(head.widget.m1 * head.widget.v1) / head.widget.m2);

  const predict = one('momentum', 'bounce-predict');
  const swap = collide(2, 4, 2, 0, 1);
  assert.deepEqual([swap.u1, swap.u2], [0, 4]);
  assert.equal(correctText(predict), 'A stops dead and B moves off at 4 m/s');

  const bounce = one('momentum', 'bounce-lab');
  assert.equal(bounce.widget.mode, 'bouncy');
  for (const m1 of stepsOf(...bounce.widget.m1Range)) for (const m2 of stepsOf(...bounce.widget.m2Range)) {
    const s = crashState(m1, bounce.widget.v1, m2, 0, 'bouncy');
    near(s.pAfter, s.pBefore, 1e-9);
    near(s.keAfter, s.keBefore, 1e-9, 'a perfectly bouncy collision keeps its kinetic energy');
    if (m1 === m2) near(s.u1, 0);                                  // "equal carts swap velocities"
    if (m1 > m2) assert.ok(s.u1 > 0 && s.u2 > s.u1, 'a heavy cart ploughs on and sends the light one ahead');
    if (m1 < m2) assert.ok(s.u1 < 0, 'a light cart bounces back');
  }
  assert.equal(bounce.check({ history: [{ m1: 2, m2: 2 }, { m1: 5, m2: 2 }, { m1: 1, m2: 4 }] }), true);
  assert.match(bounce.check({ history: [{ m1: 2, m2: 2 }] }), /heavier/);
  assert.match(bounce.check({ history: [{ m1: 5, m2: 2 }] }), /lighter/);
});

test('lesson 6: what is true of every collision, sticky or bouncy', () => {
  const step = one('momentum', 'always-true');
  const cases = [];
  for (const e of [0, 1]) for (const m1 of [1, 2, 5]) for (const m2 of [1, 3, 6]) for (const v1 of [2, 4]) for (const v2 of [-3, 0, 1]) {
    const { u1, u2 } = collide(m1, v1, m2, v2, e);
    cases.push({ m1, m2, v1, v2, u1, u2 });
  }
  const always = (fn) => cases.every(fn);
  const truth = (text) => {
    if (/total momentum afterwards equals/.test(text)) return always((c) => Math.abs(c.m1 * c.u1 + c.m2 * c.u2 - (c.m1 * c.v1 + c.m2 * c.v2)) < 1e-9);
    if (/momentum one cart loses, the other gains/.test(text)) return always((c) => Math.abs(c.m1 * (c.v1 - c.u1) - c.m2 * (c.u2 - c.v2)) < 1e-9);
    if (/total kinetic energy afterwards equals/.test(text)) return always((c) => Math.abs(ke(c.m1, c.u1) + ke(c.m2, c.u2) - ke(c.m1, c.v1) - ke(c.m2, c.v2)) < 1e-9);
    if (/moving in the same direction/.test(text)) return always((c) => c.u1 * c.u2 > 0);
    if (/heavier cart ends up with the greater speed/.test(text)) return always((c) => (c.m1 > c.m2 ? Math.abs(c.u1) > Math.abs(c.u2) : c.m2 > c.m1 ? Math.abs(c.u2) > Math.abs(c.u1) : true));
    throw new Error(`unexpected option: ${text}`);
  };
  for (const o of step.options) assert.equal(!!o.correct, truth(o.text), o.text);
  assert.equal(step.options.filter((o) => o.correct).length, 2);
});

/* ---------------------------------------------------- teach before you ask */

/** The teaching screens added when the course was revised to teach before it asks. */
const TEACHING = {
  'position-and-velocity': ['teach-position', 'example-negative', 'teach-speed', 'example-distance'],
  acceleration: ['teach-faster', 'teach-vt-graph', 'example-v-at', 'example-fall-distance'],
  'forces-newton': ['teach-net-force', 'example-friction', 'teach-weight'],
  projectiles: ['example-tower', 'teach-angles', 'example-up-and-over'],
  energy: ['teach-same-height', 'teach-kinetic', 'teach-total', 'teach-heat', 'teach-speed'],
  momentum: ['teach-conserved', 'teach-sticky-bouncy'],
};

/** [lesson, teaching screen, a step it serves, what that step needs to find on the screen] */
const SERVES = [
  ['position-and-velocity', 'teach-position', 'drive', ['**position**', '**climbing**', '**flat**', '**falling**']],
  ['position-and-velocity', 'slope', 'read-velocity', ['**Velocity**', '\\frac{\\text{change in position}}{\\text{time taken}}', ':::example', 'm/s']],
  ['position-and-velocity', 'example-negative', 'match-target', ['**negative**', ':::example']],
  ['position-and-velocity', 'example-negative', 'moving-back', ['*end − start*', '$3 - 11 = -8$ m', '\\frac{-8}{4} = -2']],
  ['position-and-velocity', 'teach-speed', 'fastest-stage', ['**Speed**', '**steepness**', 'whichever way it', ':::example']],
  ['position-and-velocity', 'example-distance', 'speed-time-distance', ['Distance = speed × time', 'Time = distance ÷ speed', 'Speed = distance ÷ time', ':::example']],
  ['acceleration', 'teach-faster', 'gain', ['keeps getting faster', '**speed**']],
  ['acceleration', 'name-it', 'speed-up', ['**Acceleration**', '\\frac{\\text{change in velocity}}{\\text{time taken}}', '\\text{ m/s}^2', ':::example']],
  ['acceleration', 'teach-vt-graph', 'read-vt', ['**velocity**', '**acceleration**', '**climbing**', '**falling**', 'Negative acceleration', ':::example']],
  ['acceleration', 'teach-vt-graph', 'flat-line', ['**flat**', 'steady speed', 'at rest only if the line sits at 0']],
  ['acceleration', 'example-v-at', 'v-equals-at', ['v = a \\times t', '**Speed reached:**', '**Time needed:**', '**Acceleration:**', ':::example']],
  ['acceleration', 'free-fall', 'fall-speed', ['10 m/s every second', 'v = g \\times t']],
  ['acceleration', 'example-fall-distance', 'how-far', ['**average**', 'half the final', 'average speed × time', ':::example']],
  ['forces-newton', 'first-law', 'balance', ['**net force**', 'keeps its velocity']],
  ['forces-newton', 'teach-net-force', 'net-force', ['**force**', '**newtons** (N)', '**net force**', 'same direction add', '$70 + 20 = 90$', '$90 - 30 = 60$']],
  ['forces-newton', 'teach-net-force', 'steady', ['**balanced**', 'the velocity does not change']],
  ['forces-newton', 'second-law', 'f-equals-ma', ['a = \\frac{F_{\\text{net}}}{m}', 'F_{\\text{net}} = m \\times a', '**mass**', '**Acceleration:**', '**Force:**', '**Mass:**']],
  ['forces-newton', 'example-friction', 'with-friction', ['**net** force', 'net force first', '$80 - 20 = 60$ N', '\\frac{60}{15} = 4']],
  ['forces-newton', 'teach-weight', 'falling-together', ['**Mass**', '**Weight**', 'every kilogram', ':::example']],
  ['projectiles', 'two-motions', 'faster-shot', ['**Sideways:**', '**Up and down:**', '**how long**', '**how far**']],
  ['projectiles', 'example-tower', 'fall-time', ['Only the fall decides', '45 m in 3 s', ':::example']],
  ['projectiles', 'example-tower', 'how-far-out', ['keeps its 9 m/s', '$9 \\times 3 = 27$ m']],
  ['projectiles', 'teach-angles', 'pairs', ['**45°**', 'either side of 45°', '**90°**', ':::example']],
  ['projectiles', 'example-up-and-over', 'kick', ['**upward** speed', 'coming down takes', '\\frac{30}{10} = 3', '$5 \\times 6 = 30$ m']],
  ['energy', 'teach-same-height', 'lowest-start', ['no higher', '**energy**', '**Potential energy**', '**Kinetic energy**']],
  ['energy', 'teach-same-height', 'watch-bars', ['**Kinetic energy** is the energy of motion']],
  ['energy', 'name-it', 'potential', ['**joules** (J)', 'E_p = m \\, g \\, h', 'g = 10', ':::example']],
  ['energy', 'teach-kinetic', 'kinetic', ['E_k = \\tfrac{1}{2} \\, m \\, v^2', 'Square the speed first', ':::example']],
  ['energy', 'teach-total', 'bookkeeping', [':::key', 'E_p + E_k', 'total − potential', ':::example']],
  ['energy', 'teach-heat', 'coaster', ['**heat**', 'cannot lift the ball again']],
  ['energy', 'teach-heat', 'match', ['**heat**']],
  ['energy', 'teach-speed', 'speed-at-bottom', ['m \\, g \\, h = \\tfrac{1}{2} \\, m \\, v^2', 'v^2 = 2 \\, g \\, h', 'Which number squared', ':::example']],
  ['momentum', 'name-it', 'find-momentum', ['**momentum**', 'p = m \\times v', 'kg·m/s', 'negative to the left', 'p = 2 \\times (-6) = -12']],
  ['momentum', 'teach-conserved', 'share-it', [':::key', '**total momentum**', '**conserved**']],
  ['momentum', 'teach-conserved', 'sticky-speed', ['combined mass', '$6 + 4 = 10$ kg', '\\frac{30}{10} = 3', ':::example']],
  ['momentum', 'teach-sticky-bouncy', 'always-true', ['**Sticky:**', '**Perfectly bouncy:**', 'heat and sound', 'the total momentum does not change', 'the other gains']],
  ['momentum', 'spread-the-stop', 'stop-force', ['Force × time = change in momentum', ':::example', '\\frac{12}{0.1} = 120']],
];

test('teach before you ask: shape of every lesson', () => {
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((step) => resolveStep(step, makeRng(1), step.id));   // `graded` exists only on resolved steps
    const roles = steps.map(role);
    const firstShown = roles.findIndex((kind) => kind === 'teach' || kind === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstShown >= 0 && firstGraded > firstShown, `${id}: "${steps[firstGraded].id}" is graded before anything has been taught`);
    const lastQuestion = roles.reduce((last, kind, i) => (kind === 'graded' || kind === 'reflect' ? i : last), -1);
    assert.ok(roles.filter((kind, i) => kind === 'teach' && i < lastQuestion).length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((kind) => kind === 'predict').length <= 2, `${id}: at most two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.ok(steps.length <= 18, `${id}: ${steps.length} steps`);
    for (const stepId of TEACHING[id]) {
      const at = steps.findIndex((s) => s.id === stepId);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}: the teaching screen "${stepId}" exists`);
      for (const fig of steps[at].figures) assert.ok(fig.alt, `${id}/${stepId}: its figure has alt text`);
      assert.ok(['graded', 'explore'].includes(roles[at + 1]), `${id}/${stepId} is followed at once by something to do`);
    }
  }
  assert.deepEqual(Object.keys(TEACHING), Object.keys(lessons));
});

test('teach before you ask: each teaching screen comes before the step it serves, and says what that step needs', () => {
  for (const [lessonId, teach, ask, terms] of SERVES) {
    const steps = lessons[lessonId].steps;
    const screen = steps.find((s) => s.id === teach);
    assert.ok(screen && screen.type === 'info', `${lessonId}: no teaching screen "${teach}"`);
    const asked = steps.findIndex((s) => s.id === ask);
    assert.ok(asked >= 0 && steps.indexOf(screen) < asked, `${lessonId}: "${teach}" must come before "${ask}"`);
    for (const term of terms) assert.ok(flat(screen.text).includes(term), `${lessonId}/${teach} should mention "${term}" (needed by "${ask}")`);
  }
  // every graded step except the discoveries made on a simulator has a teaching screen pinned above it
  const served = new Set(SERVES.map(([lessonId, , ask]) => `${lessonId}/${ask}`));
  const discoveries = new Set([
    'position-and-velocity/story', 'position-and-velocity/delivery', 'position-and-velocity/sort',      // mixed practice of the screens above
    'acceleration/brake',                                             // discovered on the road simulator, stated on teach-vt-graph
    'forces-newton/two-ways', 'forces-newton/sort',                   // discovered on the cart, stated on second-law
    'projectiles/gaps', 'projectiles/cliff-target', 'projectiles/max-range', 'projectiles/same-range', 'projectiles/sort',
    'energy/friction', 'energy/heavier',                              // stated on teach-heat and teach-speed
    'momentum/head-on',
  ]);
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(1), step.id);
      if (!s.graded || s.mode === 'predict') continue;
      assert.ok(served.has(`${id}/${s.id}`) || discoveries.has(`${id}/${s.id}`), `${id}/${s.id}: which teaching screen serves this graded step?`);
    }
  }
  // a rule found on a simulator is stated on the teaching screen that follows, not first in the explanation
  for (const [lessonId, stepId, rule, teach] of [
    ['position-and-velocity', 'hook', 'not a picture', 'teach-position'],
    ['acceleration', 'brake', 'slopes', 'teach-vt-graph'],
    ['projectiles', 'same-range', '90°', 'teach-angles'],
    ['energy', 'friction', 'thermal', 'teach-heat'],
    ['energy', 'heavier', 'v^2', 'teach-speed'],
  ]) {
    const steps = lessons[lessonId].steps;
    const at = steps.findIndex((s) => s.id === stepId);
    assert.ok(!String(steps[at].explain).includes(rule), `${lessonId}/${stepId}: "${rule}" belongs on a teaching screen, not in the explanation`);
    const after = steps.findIndex((s) => s.id === teach);
    assert.ok(after > at && after - at <= 2, `${lessonId}: "${teach}" follows "${stepId}"`);
  }
});

test('teach before you ask: every kind of generated question has its method on the screen above', () => {
  const screenText = (lessonId, id) => flat(raw(lessonId, id).text);
  // lesson 1: the three uses of speed = distance ÷ time, as each explanation names them
  const sdt = screenText('position-and-velocity', 'example-distance');
  const rules = new Set();
  for (const step of variants('position-and-velocity', 'speed-time-distance')) {
    const rule = /^(\w+ = \w+ [×÷] \w+):/.exec(step.explain)[1];
    assert.ok(sdt.includes(`**${rule}.**`), `"${rule}" is shown on example-distance`);
    rules.add(rule);
  }
  assert.equal(rules.size, 3);
  // lessons 2 and 3: a worked line for each unknown, matched to the unit the question asks for
  for (const [lessonId, stepId, teach, lines] of [
    ['acceleration', 'v-equals-at', 'example-v-at', { 'm/s': '**Speed reached:**', s: '**Time needed:**', 'm/s²': '**Acceleration:**' }],
    ['forces-newton', 'f-equals-ma', 'second-law', { 'm/s²': '**Acceleration:**', N: '**Force:**', kg: '**Mass:**' }],
  ]) {
    const text = screenText(lessonId, teach);
    const units = new Set(variants(lessonId, stepId).map((s) => s.unit));
    assert.deepEqual([...units].sort(), Object.keys(lines).sort());
    for (const unit of units) assert.ok(text.includes(lines[unit]), `${lessonId}/${teach} works a "${unit}" example`);
  }
  // lesson 3: the net-force example adds two forces and subtracts a third, as the hardest scene needs
  assert.equal(arrows(one('forces-newton', 'teach-net-force').figures[0]).reduce((sum, f) => sum + f.dir * f.n, 0), 60);
  assert.deepEqual(arrows(one('forces-newton', 'example-friction').figures[0]).map((f) => f.dir * f.n), [80, -20]);
  // lesson 4: the table of falls in the fall-time question is the one on the worked example, as far as it goes
  const tower = screenText('projectiles', 'example-tower');
  for (const [, d, t] of tower.matchAll(/(\d+) m in (\d+) s/g)) near(Number(d), fallen(Number(t)), 1e-6, 'the falls quoted on example-tower');
  near(fly(9, 0, 45).time, 3);
  near(fly(9, 0, 45).range, 27);
  // lesson 4: the up-and-over example and its figure agree
  const over = one('projectiles', 'example-up-and-over').figures[0];
  const rad = (over.angle * Math.PI) / 180;
  near(over.speed * Math.cos(rad), 5, 1e-3);
  near(over.speed * Math.sin(rad), 30, 1e-3);
  near(fly(5, 30).range, 30);
  near(fly(5, 30).time, 6);
  const angles = one('projectiles', 'teach-angles').figures[0];
  assert.deepEqual(angles.ghosts.map((gh) => gh.angle), [30, 60]);
  // lesson 5: the worked examples follow the ball on the track
  const track = one('energy', 'name-it').figures[0];
  assert.equal(track.mass * g * track.start, 100);
  near(ke(track.mass, Math.sqrt(2 * g * track.start)), 100);
  assert.match(screenText('energy', 'name-it'), /\$E_p = 2 \\times 10 \\times 5 = 100\$ J/);
  assert.match(screenText('energy', 'teach-kinetic'), /moving at 10 m\/s[\s\S]*\\tfrac\{1\}\{2\} \\times 2 \\times 100 = 100\$ J/);
  near(Math.sqrt(2 * g * 2.45), 7);
  // lesson 6: the worked collision, and the energy lost in the very first one
  const stuck = one('momentum', 'teach-conserved').figures[0];
  near(collide(stuck.m1, stuck.v1, stuck.m2, stuck.v2, 0).u1, 3);
  assert.equal(stuck.m1 * stuck.v1, 30);
  const first = one('momentum', 'teach-sticky-bouncy').figures[0];
  const after = collide(first.m1, first.v1, first.m2, first.v2, 0).u1;
  assert.deepEqual([ke(first.m1, first.v1), ke(first.m1 + first.m2, after)], [24, 18]);
  assert.match(screenText('momentum', 'teach-sticky-bouncy'), /drops from 24 J to 18 J/);
});

test('teach before you ask: worked examples use numbers their practice step cannot produce', () => {
  const never = (lessonId, stepId, same) => {
    for (const step of variants(lessonId, stepId)) assert.ok(!same(step, flat(step.text)), `${lessonId}/${stepId} can repeat the worked example: ${flat(step.text)}`);
  };
  never('position-and-velocity', 'read-velocity', (s) => JSON.stringify(s.figures[0].points.map((p) => [p.t, p.x])) === '[[1,3],[4,9]]' || s.figures[0].start % 2 === 1);   // the example's line starts at 1 m
  never('position-and-velocity', 'moving-back', (s, text) => /\*\*3 m\*\* mark/.test(text) || s.answer === -2 && /\*\*11 m\*\*/.test(text));
  never('position-and-velocity', 'fastest-stage', (s) => s.figures[0].velocities.length === 2);
  never('position-and-velocity', 'speed-time-distance', (s, text) => /\*\*7 m\/s\*\*/.test(text) || s.answer === 7);
  never('acceleration', 'read-vt', (s) => s.figures[0].duration === 6 || !Number.isInteger(s.answer));
  never('acceleration', 'v-equals-at', (s, text) => /\$6 \\text\{ m\/s\}\^2\$/.test(text) || (s.unit === 'm/s²' && (s.answer === 6 || s.answer === 2.5)));
  never('acceleration', 'how-far', (s, text) => /\*\*[25] s\*\*/.test(text));
  never('forces-newton', 'net-force', (s) => arrows(s.figures[0]).some((f) => [70, 20, 30].includes(f.n)) && arrows(s.figures[0]).length === 3);
  never('forces-newton', 'f-equals-ma', (s, text) => /\*\*15 kg\*\*/.test(text) || (s.unit === 'kg' && s.answer === 15));
  never('forces-newton', 'with-friction', (s, text) => /\*\*15 kg\*\*/.test(text));
  never('forces-newton', 'falling-together', (s, text) => /\b(50|0\.1) kg\b/.test(text));
  never('projectiles', 'fall-time', (s, text) => /at 9 m\/s/.test(text));
  never('projectiles', 'how-far-out', (s, text) => /at 9 m\/s/.test(text));
  never('projectiles', 'pairs', (s, text) => /\*\*(30|60|5|85)°\*\*/.test(text));
  never('projectiles', 'kick', (s, text) => /\*\*5 m\/s sideways\*\*/.test(text) || /\*\*30 m\/s upwards\*\*/.test(text));
  never('energy', 'potential', (s, text) => /\*\*2 kg\*\*.*\*\*5 m\*\*/.test(text));
  never('energy', 'kinetic', (s, text) => /\*\*2 kg\*\*/.test(text));
  never('energy', 'bookkeeping', (s, text) => /\*\*100 J\*\*.*\*\*30 J\*\*/.test(text));
  never('energy', 'speed-at-bottom', (s, text) => /\b2\.45 m\b/.test(text) || s.answer === 7);
  never('momentum', 'find-momentum', (s, text) => /\*\*[23] kg\*\*/.test(text));
  never('momentum', 'sticky-speed', (s, text) => /\*\*6 kg\*\*/.test(text) && /\*\*4 kg\*\*/.test(text));
  never('momentum', 'stop-force', (s, text) => /\*\*2 kg\*\*/.test(text) || /\*\*0\.5 s\*\*/.test(text));
});
