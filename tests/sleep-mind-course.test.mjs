// Independent checks of "Sleep, Stress and Mental Health".
//
// 1. A second, separately typed table of the course's key facts (each with its source) is compared with
//    the tables in content/courses/sleep-mind/helpers.js.
// 2. Every generated question is re-solved from the text the learner sees (times, doses and counts are
//    parsed out of the wording, or read off the figure's own data) with arithmetic written here.
// 3. Every interact step is fed the states its widget can reach, and must accept exactly those that do
//    what the instruction asks.
// 4. Safety: the standard disclaimer appears once, in the first lesson; nothing asks for the learner's
//    own health data; every step that mentions suicide or self-harm is sober and its lesson carries the
//    crisis pointers; language is person-first.
//
//   node --test tests/sleep-mind-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import course from '../content/courses/sleep-mind/course.js';
import * as H from '../content/courses/sleep-mind/helpers.js';
import { TYPICAL_NIGHT, PATTERNS } from '../src/widgets/hypnogram.js';

const COURSE = 'sleep-mind';
const SEEDS = 200;
const LESSONS = ['why-sleep', 'body-clock', 'better-sleep', 'stress', 'emotions-mind', 'mental-health', 'connection'];
/** Every generated step of the course. Each is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'why-sleep': ['sleep-need', 'hypno-read', 'cycles'],
  'body-clock': ['drift', 'body-time', 'jet-days'],
  'better-sleep': ['caffeine-left', 'which-process'],
  stress: ['sprint-or-marathon', 'breath-rate'],
  'emotions-mind': ['which-trap', 'ruminate'],
  'mental-health': ['count', 'conditions'],
  connection: ['risk', 'opens-or-shuts', 'toolkit'],
};
const tested = new Set();

const lessons = {};
const sources = {};       // the lesson files as written, before normalizing (for the word-for-word pins of the crisis content)
for (const id of LESSONS) {
  const file = fileURLToPath(new URL(`../content/courses/${COURSE}/lessons/${id}.js`, import.meta.url));
  if (!existsSync(file)) continue;
  const mod = await import(`../content/courses/${COURSE}/lessons/${id}.js`);
  sources[id] = mod.default;
  lessons[id] = normalizeLesson(mod.default, COURSE, id);
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
function eachVariant(lesson, id, verify, n = SEEDS) {
  const step = raw(lesson, id);
  assert.equal(typeof step.gen, 'function', `${lesson}/${id} is generated`);
  assert.ok((GENERATED[lesson] || []).includes(id), `${lesson}/${id} is listed in GENERATED`);
  tested.add(`${lesson}/${id}`);
  const texts = new Set();
  for (let k = 0; k < n; k++) {
    const s = resolveStep(step, makeRng(4217 + k * 7919), id);
    texts.add(flat(s.text));
    try { verify(s); } catch (err) { err.message = `${lesson}/${id} (seed ${k}): ${err.message}\n  text: ${flat(s.text)}`; throw err; }
  }
  return texts.size;
}
/** A second look at a generated step that eachVariant already re-derives: run a check on many of its variants. */
function eachSeed(lesson, id, verify, n = 80) {
  const step = raw(lesson, id);
  assert.equal(typeof step.gen, 'function', `${lesson}/${id} is generated`);
  for (let k = 0; k < n; k++) verify(resolveStep(step, makeRng(301 + k * 53), id));
}
const everyStep = (fn) => { for (const [lid, lesson] of Object.entries(lessons)) for (const step of lesson.steps) fn(lid, step); };

const flat = (s) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };
const near = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} expected ${b}, got ${a}`);
const correctText = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: one correct option`); return right[0].text; };
/** "23:30" → hours after midnight. */
const hm = (text) => { const [h, m] = text.split(':').map(Number); return h + m / 60; };
/** Hours from one clock time to the next occurrence of another. */
const span = (from, to) => ((hm(to) - hm(from)) % 24 + 24) % 24;
const specsOf = (step) => [...(step.figures || []), ...(step.widget ? [step.widget] : []), ...((step.options || []).map((o) => o.figure).filter(Boolean))];

/** Every string a learner can see in a resolved step (figure markup and identifiers excluded). */
function visible(step) {
  const out = [];
  const skip = ['type', 'id', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'color', 'mode', 'view', 'expr', 'content', 'viewBox', 'stage', 'trap', 'kind', 'system', 'tone', 'license', 'file'];
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.includes(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/* ====================================================================== own facts
 * Typed in independently of helpers.js, from the sources named. */

const FACTS = {
  // AASM / Sleep Research Society consensus statement, 2015: adults "7 or more hours per night".
  adultSleepMin: 7,
  // AASM consensus statement on paediatric sleep, 2016: 13 to 18 years 8 to 10 h; 6 to 12 years 9 to 12 h.
  teenSleep: [8, 10],
  childSleep: [9, 12],
  // Textbook figure for one sleep cycle (range roughly 70 to 120 minutes).
  cycleMinutes: 90,
  // Williamson & Feyer, Occup Environ Med, 2000: 17 to 19 h awake ≈ blood alcohol 0.05%. Dawson & Reid, Nature, 1997: 24 h ≈ 0.10%.
  awake: { hours: [17, 19], bac: 0.05, bac24: 0.1 },
  // Typical shares of a young adult's night (StatPearls, "Physiology, Sleep Stages"): N3 13 to 25%, REM 20 to 25%, N2 about half.
  share: { N3: [0.13, 0.25], REM: [0.2, 0.25], N2: [0.45, 0.55], N1: [0.02, 0.08] },
};

/* ====================================================================== whole course */

test('course outline: seven lessons in three chapters, ids untouched', () => {
  assert.equal(course.id, COURSE);
  assert.equal(course.category, 'health');
  assert.equal(course.level, 'Beginner');
  assert.equal(course.color, 'blue');
  assert.equal(course.cover, 'moon');
  assert.deepEqual(course.requires, []);
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), LESSONS);
  assert.deepEqual(Object.keys(lessons), LESSONS, 'every lesson file exists');
});

test('lesson shape: 11 to 20 steps, a predicting hook, hands-on steps, review steps, generated steps, a recap and a teaser', () => {
  const mine = ['hypnogram', 'body-clock', 'sleep-pressure', 'decay-curve', 'paced-breathing', 'thought-loop', 'fear-curve', 'dialogue', 'body-map', 'plot', 'grid', 'bars', 'photo', 'icon-array'];
  for (const [id, lesson] of Object.entries(lessons)) {
    // the teaching screens added in front of the questions took the lessons from 14 steps to 17 to 19 (the validator warns above 20)
    assert.ok(lesson.steps.length >= 11 && lesson.steps.length <= 20, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) if (s.type === 'numeric') assert.equal(typeof s.gen, 'function', `${id}/${s.id}: numeric review steps are generated`);
    const handsOn = lesson.steps.filter((s) => {
      if (s.type === 'interact') return true;
      const fig = s.figure && !Array.isArray(s.figure) ? s.figure : null;
      return !!fig && mine.includes(fig.type) && !fig.static && fig.mode !== 'static' && fig.type !== 'photo';
    });
    assert.ok(handsOn.length >= 3, `${id}: ${handsOn.length} hands-on steps`);
    assert.ok(lesson.steps.filter((s) => typeof s.gen === 'function').length >= 2, `${id}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${id}: no more than five choice steps`);
    assert.equal(lesson.steps[0].mode, 'predict', `${id} opens with a prediction`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: next`);
    for (let i = 2; i < lesson.steps.length; i++) assert.ok(!lesson.steps.slice(i - 2, i + 1).every((s) => s.type === 'info'), `${id}: three info steps in a row`);
    for (const s of lesson.steps) if (s.type !== 'info' && s.type !== 'reflect') assert.ok(s.gen || s.explain, `${id}/${s.id} has an explanation`);
    assert.ok(new Set(lesson.steps.map((s) => s.type)).size >= 5, `${id}: uses a range of step types`);
  }
});

test('no learner-visible text contains undefined, NaN, an object or float noise', () => {
  everyStep((id, step) => {
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(77 + k * 131), step.id);
      for (const text of visible(s)) {
        const where = `${id}/${step.id} seed ${k}: "${text.slice(0, 120)}"`;
        assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), where);
        assert.ok(!/\d\.\d{4,}/.test(text), `float noise in ${where}`);
        assert.ok(!/(?<![\d.,])\b1 (hours|days|minutes|cycles|breaths|people)\b/.test(text), `plural in ${where}`);
      }
      if (!step.gen) break;
    }
  });
  for (const lesson of Object.values(lessons)) for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
});

test('every choice has exactly one correct option, no duplicates, and says why each wrong option is wrong', () => {
  everyStep((id, step) => {
    if (step.type !== 'choice' && step.type !== 'multi') return;
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(5 + k * 97), step.id);
      const right = s.options.filter((o) => o.correct).length;
      const poll = s.mode === 'predict' && right === 0;
      if (step.type === 'choice' && !poll) assert.equal(right, 1, `${id}/${step.id} seed ${k}`);
      if (step.type === 'multi') assert.ok(right >= 1 && right < s.options.length, `${id}/${step.id} seed ${k}`);
      assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, `${id}/${step.id} has duplicate options`);
      for (const o of s.options) if (!o.correct && s.mode !== 'predict') assert.ok(o.why && o.why.length > 20, `${id}/${step.id}: "${o.text}" says why it is wrong`);
      if (!step.gen) break;
    }
  });
});

test('numeric steps are generated, show a unit, have hints and an explanation, and no listed slip equals the answer', () => {
  everyStep((id, step) => {
    if (step.type !== 'numeric') return;
    assert.equal(typeof step.gen, 'function', `${id}/${step.id}: numeric practice is generated`);
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(9 + k * 613), step.id);
      assert.ok(Number.isFinite(s.answer), `${id}/${step.id}`);
      assert.ok(s.unit, `${id}/${step.id} shows its unit`);
      assert.ok(s.explain && s.hints.length >= 1, `${id}/${step.id} has hints and an explanation`);
      const values = [s.answer, ...(s.wrong || []).map((w) => w[0])];
      assert.equal(new Set(values.map((v) => Math.round(v * 1e6))).size, values.length, `${id}/${step.id}: answer and slips ${values.join(', ')} are all different`);
      for (const [slip] of s.wrong || []) assert.ok(Math.abs(slip - s.answer) > 2 * (s.tolerance || 0), `${id}/${step.id}: slip ${slip} too close to ${s.answer}`);
    }
  });
});

test('fill steps: the right option of a dropdown is not always in the same place', () => {
  const positions = [];
  everyStep((id, step) => {
    if (step.type !== 'fill') return;
    const s = resolveStep(step, makeRng(3), step.id);
    for (const m of s.template.matchAll(/\[\[([^\]]+)\]\]/g)) {
      const opts = m[1].split('|');
      if (opts.length < 2) continue;
      assert.equal(opts.filter((o) => o.startsWith('*')).length, 1, `${id}/${step.id}: one starred option in ${m[0]}`);
      positions.push(opts.findIndex((o) => o.startsWith('*')));
    }
  });
  assert.ok(positions.length >= 3);
  assert.ok(new Set(positions).size >= 2, `dropdown answers sit in different positions (${positions})`);
});

/* ====================================================================== lesson 1: why-sleep */

const myStageAt = (night, minute) => { let t = 0; for (const [st, len] of night) { if (minute < t + len) return st; t += len; } return null; };
const myMinutes = (night, stage, from, to) => { let n = 0; for (let m = from; m < to; m++) if (myStageAt(night, m) === stage) n++; return n; };

test('lesson 1: the model night matches the textbook pattern and the widget\'s default night', () => {
  assert.deepEqual(H.NIGHT, TYPICAL_NIGHT, 'the lesson and the widget draw the same night');
  assert.equal(H.NIGHT_START, 23);
  const total = H.NIGHT.reduce((t, s) => t + s[1], 0);
  assert.equal(total, 480);
  assert.equal(H.NIGHT_MINUTES, 480);
  const asleep = total - myMinutes(H.NIGHT, 'W', 0, total);
  for (const [stage, [lo, hi]] of Object.entries(FACTS.share)) {
    const share = myMinutes(H.NIGHT, stage, 0, total) / asleep;
    assert.ok(share >= lo && share <= hi, `${stage} is ${(share * 100).toFixed(1)}% of sleep, textbook ${lo * 100} to ${hi * 100}%`);
  }
  // minute-by-minute counting agrees with the helper
  for (const st of ['W', 'N1', 'N2', 'N3', 'REM']) assert.equal(H.minutesOf(st), myMinutes(H.NIGHT, st, 0, total));
  for (const m of [0, 9, 10, 19, 20, 100, 239, 240, 300, 479]) assert.equal(H.stageAt(m), myStageAt(H.NIGHT, m));
  // five cycles, each ending in a REM period that is longer than the one before
  const rems = H.NIGHT.filter((s) => s[0] === 'REM').map((s) => s[1]);
  assert.equal(rems.length, 5);
  for (let i = 1; i < rems.length; i++) assert.ok(rems[i] > rems[i - 1], 'REM periods lengthen');
  let t = 0;
  const remEnds = [];
  for (const [st, len] of H.NIGHT) { t += len; if (st === 'REM') remEnds.push(t); }
  const lengths = remEnds.map((e, i) => e - (i ? remEnds[i - 1] : 0));
  for (const len of lengths) assert.ok(len >= 70 && len <= 120, `a cycle of ${len} minutes`);
  // what the lesson says about the two halves and about an alarm at 05:00
  const halves = flat(one('why-sleep', 'halves').explain);
  assert.equal(myMinutes(H.NIGHT, 'N3', 0, 240), 98);
  assert.equal(myMinutes(H.NIGHT, 'N3', 240, 480), 0);
  assert.equal(myMinutes(H.NIGHT, 'REM', 240, 480), 88);
  assert.equal(myMinutes(H.NIGHT, 'REM', 0, 480), 114);
  assert.match(halves, /all 98 minutes of deep sleep fall before 03:00/);
  assert.match(halves, /88 of the 114 minutes of REM sleep come after it/);
  const cut = one('why-sleep', 'cut-night');
  const lostRem = myMinutes(H.NIGHT, 'REM', 360, 480);
  assert.equal(lostRem, 52);
  assert.equal(Math.round((lostRem / 114) * 100), 46);
  assert.equal(myMinutes(H.NIGHT, 'N3', 360, 480), 0);
  assert.match(flat(cut.explain), /52 of her 114 minutes of REM sleep: \*\*46%\*\*/);
  assert.match(correctText(cut), /Nearly half of her REM sleep, and none of her deep sleep/);
  assert.deepEqual([...one('why-sleep', 'halves').template.matchAll(/\[\[[^\]]*\*([a-z0-9]+)/g)].map((m) => m[1]), ['first', 'second', '90']);
});

test('lesson 1: recommended sleep and the awake-for-17-hours comparison agree with the sources', () => {
  assert.equal(H.SLEEP_NEED.adult.min, FACTS.adultSleepMin);
  assert.deepEqual([H.SLEEP_NEED.teen.min, H.SLEEP_NEED.teen.max], FACTS.teenSleep);
  assert.deepEqual([H.SLEEP_NEED.child.min, H.SLEEP_NEED.child.max], FACTS.childSleep);
  assert.equal(H.CYCLE_MINUTES, FACTS.cycleMinutes);
  assert.deepEqual(H.AWAKE_ALCOHOL, { hours: FACTS.awake.hours, bac: FACTS.awake.bac, hours24bac: FACTS.awake.bac24 });
  for (const who of H.SLEEPERS) {
    const [lo, hi] = H.SLEEP_NEED[who.group].ages;
    assert.ok(who.age >= lo && who.age <= hi, `${who.name} (${who.age}) is in the group "${who.group}"`);
  }
  const drunk = one('why-sleep', 'awake-drunk');
  assert.match(correctText(drunk), /^0\.05%: at or over the legal limit/);
  assert.match(flat(drunk.text), /17 to 19 hours/);
  assert.match(flat(drunk.explain), /0\.10%/);
  const recap = lessons['why-sleep'].recap.join(' ');
  assert.match(recap, /7 hours or more/);
  assert.match(recap, /teenagers 8 to 10/);
  assert.match(recap, /17 to 19 hours awake.*0\.05%/);
});

test('lesson 1: how far a night falls short of the least recommended sleep', () => {
  const groups = new Set();
  const n = eachVariant('why-sleep', 'sleep-need', (step) => {
    const text = flat(step.text);
    const [name, age] = grab(/^\*\*(.+?), who is (\d+),\*\*/, text);
    const [from, to] = grab(/asleep from \*\*(\d\d:\d\d)\*\* to \*\*(\d\d:\d\d)\*\*/, text);
    const slept = span(from, to);
    let least;
    if (Number(age) >= 18) {
      assert.match(text, /recommend \*\*7 hours or more\*\* a night for adults/);
      least = FACTS.adultSleepMin;
    } else {
      assert.ok(Number(age) >= 13, 'a teenager');
      assert.match(text, /recommend \*\*8 to 10 hours\*\* a night for teenagers of 13 to 18/);
      least = FACTS.teenSleep[0];
    }
    groups.add(least);
    near(step.answer, least - slept, 1e-9);
    assert.ok(step.answer > 0 && step.answer <= 2);
    assert.ok(slept >= 5 && slept <= 7.5, `a believable night of ${slept} hours`);
    assert.equal(step.unit, 'hours');
    // the hints and the explanation quote the same figures
    assert.ok(flat(step.explain).includes(`${least} − ${slept} = **${step.answer}**`), step.explain);
    assert.ok(flat(step.explain).includes(`From ${from} to ${to} is ${H.hoursText(slept)}`));
    assert.ok(flat(step.explain).includes(`adds up to ${H.hoursText(step.answer * 5)}`));
    assert.ok(step.hints[1].includes(`${name} sleeps ${H.hoursText(slept)}`));
    assert.match(step.hints[0], hm(from) < 12 ? /Both times are after midnight/ : /to midnight, then from midnight/);
    near(step.wrong[0][0], slept);
    if (least === 8) near(step.wrong[1][0], 10 - slept);
  });
  assert.equal(groups.size, 2);
  assert.ok(n >= 40, `${n} different questions`);
  assert.equal(H.hoursText(6.5), '6½ hours');
  assert.equal(H.hoursText(7), '7 hours');
  assert.equal(H.hoursText(1), '1 hour');
  assert.equal(H.hoursText(0.5), 'half an hour');
  assert.equal(H.clock(23.5), '23:30');
  assert.equal(H.clock(25.5), '01:30');
  assert.equal(H.clock(-1), '23:00');
});

test('lesson 1: reading a stage off the hypnogram', () => {
  const stages = new Set();
  const names = { W: 'Awake', REM: 'REM sleep', N1: 'N1: dozing off', N2: 'N2: light sleep', N3: 'N3: deep sleep' };
  eachVariant('why-sleep', 'hypno-read', (step) => {
    const text = flat(step.text);
    const [at] = grab(/dashed line marks \*\*(\d\d:\d\d)\*\*/, text);
    const fig = step.figures[0];
    assert.equal(fig.type, 'hypnogram');
    assert.equal(fig.mode, 'static');
    assert.deepEqual(fig.night, TYPICAL_NIGHT);
    const minute = Math.round(span('23:00', at) * 60);
    assert.equal(fig.mark, minute, 'the marker is where the text says');
    const stage = myStageAt(TYPICAL_NIGHT, minute);
    // the moment is at least five minutes away from any change of stage
    for (const d of [-5, -1, 1, 4]) assert.equal(myStageAt(TYPICAL_NIGHT, minute + d), stage, `${at} is well inside its stage`);
    assert.equal(correctText(step), names[stage]);
    assert.deepEqual(step.options.map((o) => o.text), Object.values(names));
    assert.equal(step.shuffle, false);
    assert.ok(flat(step.explain).includes(`At ${at}`) && flat(step.explain).includes(`**${stage}** row`));
    assert.ok(fig.alt.includes(at) && fig.alt.includes(`${stage} row`));
    if (stage === 'N3') assert.ok(minute < 240, 'the explanation says deep sleep is found in the first half');
    stages.add(stage);
  });
  assert.deepEqual([...stages].sort(), ['N2', 'N3', 'REM']);
});

test('lesson 1: counting sleep cycles', () => {
  eachVariant('why-sleep', 'cycles', (step) => {
    const text = flat(step.text);
    const [from, to] = grab(/falls asleep at \*\*(\d\d:\d\d)\*\* and wakes at \*\*(\d\d:\d\d)\*\*/, text);
    const [cycle] = grab(/One sleep cycle takes about (\d+) minutes/, text).map(Number);
    assert.equal(cycle, FACTS.cycleMinutes);
    const minutes = span(from, to) * 60;
    near(step.answer, minutes / cycle);
    assert.ok(Number.isInteger(step.answer) && step.answer >= 3 && step.answer <= 6);
    assert.ok(flat(step.explain).includes(`${minutes} ÷ ${cycle} = **${step.answer}** cycles`));
    near(step.wrong[0][0], minutes / 60);
  });
});

test('lesson 1: the hypnogram steps accept exactly what they ask for', () => {
  const read = one('why-sleep', 'read-night');
  const all = ['W', 'REM', 'N1', 'N2', 'N3'];
  assert.equal(read.check({ seen: all, seenCount: 5 }), true);
  for (const missing of all) {
    const seen = all.filter((s) => s !== missing);
    const res = read.check({ seen, seenCount: 4 });
    assert.equal(typeof res, 'string');
    assert.ok(res.includes(missing === 'W' ? 'Awake' : missing), `names the missing stage ${missing}: ${res}`);
  }
  assert.deepEqual(read.solution.seen.slice().sort(), all.slice().sort());
  // N1 really is "just after 23:10" in the night shown
  assert.equal(myStageAt(read.widget.night, 10), 'N1');
  assert.equal(myStageAt(read.widget.night, 0), 'W');
  assert.equal(myStageAt(read.widget.night, 479), 'W');

  // build-night: all 243 combinations of the three kinds of cycle
  const build = one('why-sleep', 'build-night');
  const deepOf = (p) => PATTERNS[p].segments.reduce((n, s) => n + (s[0] === 'N3' ? s[1] : 0), 0);
  const remOf = (p) => PATTERNS[p].segments.reduce((n, s) => n + (s[0] === 'REM' ? s[1] : 0), 0);
  for (const p of 'DMR') assert.equal(PATTERNS[p].segments.reduce((n, s) => n + s[1], 0), 96, 'every cycle is 96 minutes');
  assert.ok(deepOf('D') > deepOf('M') && deepOf('M') > deepOf('R') && deepOf('R') === 0);
  assert.ok(remOf('D') < remOf('M') && remOf('M') < remOf('R'));
  let accepted = 0;
  const kinds = ['D', 'M', 'R'];
  for (let code = 0; code < 243; code++) {
    const patterns = [0, 1, 2, 3, 4].map((i) => kinds[Math.floor(code / 3 ** i) % 3]);
    const deep = patterns.map(deepOf);
    const rem = patterns.map(remOf);
    const typical = deep.every((d, i) => i === 0 || d <= deep[i - 1]) && rem.every((r, i) => i === 0 || r >= rem[i - 1]) && patterns[0] === 'D' && patterns[4] === 'R';
    const res = build.check({ patterns, deep, rem });
    assert.equal(res === true, typical, `build-night ${patterns.join('')}`);
    if (res === true) accepted++;
    else {
      assert.equal(typeof res, 'string');
      const m = /Cycle (\d) has more deep sleep than cycle (\d)/.exec(res);
      if (m) assert.ok(deep[m[1] - 1] > deep[m[2] - 1], `${patterns.join('')}: ${res}`);
      else if (/first cycle/.test(res)) assert.notEqual(patterns[0], 'D');
      else { assert.match(res, /last cycle/); assert.notEqual(patterns[4], 'R'); }
    }
  }
  assert.equal(accepted, 10, 'nights that start deep-rich, end REM-rich and never step back towards deep sleep: the three middle cycles in non-decreasing order');
  assert.equal(build.check({ patterns: build.solution.patterns }), true);
});

/* ====================================================================== lesson 2: body-clock */

// Typed in separately. Czeisler et al., Science 1999: the human clock averages 24.18 h (rounded 24.2).
// Travel-medicine rule of thumb (CDC Yellow Book, jet lag): about 1 h a day eastward, 1.5 h a day westward.
// Dunster et al., Science Advances 2018: Seattle, 07:50 → 08:45, +34 minutes of sleep. AAP 2014: 08:30 or later.
// Standard-time offsets from UTC of the cities used (hours).
const UTC = { London: 0, Tokyo: 9, 'New York': -5, Paris: 1, Nairobi: 3, Singapore: 8, 'Los Angeles': -8, Sydney: 10, Auckland: 12 };
const MY_LOW = 4.5;
/** Own version of the model's response to light: hours later (+) or earlier (−) in one day. */
function myShift(light, offset) {
  let tau = (((light - offset - MY_LOW) % 24) + 24) % 24;
  if (tau > 12) tau -= 24;
  if (tau > -9 && tau < 0) return 1.5 * Math.sin((Math.PI * -tau) / 9);
  if (tau > 0 && tau < 9) return -Math.sin((Math.PI * tau) / 9);
  return 0;
}

test('lesson 2: clock facts, flights and the Seattle figures agree with the sources', () => {
  assert.equal(H.CLOCK.period, 24.2);
  near(H.CLOCK.driftPerDay, H.CLOCK.period - 24, 1e-9);
  assert.equal(H.CLOCK.scnNeurons, 20000);
  assert.deepEqual(H.JET, { eastPerDay: 1, westPerDay: 1.5 });
  for (const f of H.FLIGHTS) assert.equal(f.ahead, UTC[f.to] - UTC[f.from], `${f.from} → ${f.to}`);
  assert.equal(new Set(H.FLIGHTS.map((f) => f.who)).size, H.FLIGHTS.length);
  assert.deepEqual([H.SEATTLE.before, H.SEATTLE.after, H.SEATTLE.gained, H.SEATTLE.aapEarliest], ['07:50', '08:45', 34, '08:30']);
  near(span(H.SEATTLE.before, H.SEATTLE.after) * 60, 55, 1e-6);
  assert.equal(H.SEATTLE.later, 55);
  assert.equal((H.SEATTLE.sleepAfter[0] * 60 + H.SEATTLE.sleepAfter[1]) - (H.SEATTLE.sleepBefore[0] * 60 + H.SEATTLE.sleepBefore[1]), 34);
  const school = one('body-clock', 'school');
  assert.ok(flat(school.explain).includes('from 07:50 to 08:45') && flat(school.explain).includes('**34 minutes longer**') && flat(school.explain).includes('no earlier than 08:30'));
  const cave = one('body-clock', 'cave');
  assert.match(flat(cave.explain), /24\.2 hours/);
  assert.match(flat(cave.explain), /about 12 minutes later each day, \*\*two hours\*\* in ten days/);
  near(0.2 * 60, 12, 1e-9); near(0.2 * 10, 2, 1e-9);
  assert.equal(cave.widget.drift, 0.2);
  assert.equal(cave.check({ days: 10 }), true);
  assert.equal(cave.check({ days: 14 }), true);
  for (const d of [0, 1, 5, 9]) assert.match(cave.check({ days: d }), new RegExp(`That is ${d} day`));
  assert.equal(cave.solution.days, 10);
  assert.match(correctText(one('body-clock', 'hook')), /Kept opening and folding/);
  assert.match(correctText(one('body-clock', 'reset-signal')), /Light reaching the eyes/);
  // the master clock is now described on the teaching screen in front of the question
  assert.match(flat(one('body-clock', 'teach-master-clock').text), /about 20,000 nerve cells/);
});

test('lesson 2: the slow drift of a clock that is not exactly 24 hours long', () => {
  const n = eachVariant('body-clock', 'drift', (step) => {
    const text = flat(step.text);
    const [len] = grab(/runs a day of \*\*(24\.\d) hours\*\*/, text).map(Number);
    const [days] = grab(/spends \*\*(\d+) days\*\*/, text).map(Number);
    // step the clock day by day
    let behind = 0;
    for (let d = 0; d < days; d++) behind += len - 24;
    near(step.answer, behind, 1e-9);
    assert.equal(step.unit, 'hours');
    near(step.wrong[0][0], len - 24, 1e-9);
    near(step.wrong[1][0], behind * 60, 1e-6);
    const perDay = Math.round((len - 24) * 10) / 10;
    assert.ok(flat(step.explain).includes(`${days} × ${perDay} = **${step.answer}**`), step.explain);
    assert.ok(flat(step.explain).includes(`(${Math.round(perDay * 60)} minutes)`));
    assert.ok(len >= 24.1 && len <= 24.5, 'within the range found in people');
  });
  assert.ok(n >= 12);
});

test('lesson 2: what the body clock shows after a flight', () => {
  const dirs = new Set();
  eachVariant('body-clock', 'body-time', (step) => {
    const text = flat(step.text);
    const [who, from, to, n, dir] = grab(/^(\S+) flies from (.+?) to (.+?), where the clocks are \*\*(\d+) hours (ahead|behind)\*\*/, text);
    const [local] = grab(/the local time is \*\*(\d\d:\d\d)\*\*/, text);
    assert.equal(UTC[to] - UTC[from], dir === 'ahead' ? Number(n) : -Number(n), `${from} → ${to}`);
    // the body is still on the time of the city of departure
    const body = (((hm(local) - (UTC[to] - UTC[from])) % 24) + 24) % 24;
    near(step.answer, body);
    assert.ok(Number.isInteger(step.answer) && step.answer >= 0 && step.answer <= 23);
    assert.ok(flat(step.explain).includes(`the body clock shows **${H.clock(body)}**`));
    assert.ok(flat(step.explain).includes(`${from} is ${n} hours ${dir === 'ahead' ? 'behind' : 'ahead'}`));
    assert.ok(text.includes(`${who}'s body clock has not moved yet`));
    near(step.wrong[0][0], (((hm(local) + (UTC[to] - UTC[from])) % 24) + 24) % 24);
    assert.match(text, dir === 'ahead' ? /first morning/ : /first evening/);
    dirs.add(dir);
  });
  assert.equal(dirs.size, 2);
});

test('lesson 2: days to recover by the rule of thumb', () => {
  const dirs = new Set();
  eachVariant('body-clock', 'jet-days', (step) => {
    const text = flat(step.text);
    assert.match(text, /about \*\*1 hour a day\*\* after a flight east and about \*\*1½ hours a day\*\* after a flight west/);
    const [from, to, n, dir] = grab(/flies from (.+?) to (.+?), where the clocks are \*\*(\d+) hours (ahead|behind)\*\*/, text);
    assert.equal(UTC[to] - UTC[from], dir === 'ahead' ? Number(n) : -Number(n));
    // clocks ahead: the destination lies to the east
    const perDay = dir === 'ahead' ? 1 : 1.5;
    let left = Number(n);
    let days = 0;
    while (left > 1e-9) { left -= perDay; days++; }
    near(left, 0, 1e-9, 'a whole number of days');
    assert.equal(step.answer, days);
    assert.equal(step.unit, 'days');
    assert.ok(flat(step.explain).includes(`${n} ÷ ${perDay} = **${days}** days`));
    near(step.wrong[0][0], Number(n) / (dir === 'ahead' ? 1.5 : 1), 1e-9);
    dirs.add(dir);
  });
  assert.equal(dirs.size, 2);
});

test('lesson 2: the light dial: the model, the exploration and the jet-lag task', async () => {
  const { lightShift } = await import('../src/widgets/body-clock.js');
  for (let offset = -8; offset <= 8; offset += 0.5) for (let light = 0; light < 24; light += 0.5) near(lightShift(light, offset), myShift(light, offset), 1e-9, `light ${light}, offset ${offset}`);
  // the sizes the lesson quotes: at most about 1.5 h later and 1 h earlier in a day, and nothing in the body's afternoon
  let most = 0; let least = 0;
  for (let light = 0; light < 24; light += 0.5) { most = Math.max(most, myShift(light, 0)); least = Math.min(least, myShift(light, 0)); }
  near(most, 1.5, 1e-9); near(least, -1, 1e-9);
  assert.equal(myShift(15, 0), 0);
  assert.ok(myShift(22, 0) > 1 && myShift(7, 0) < -0.7, 'the hint: 22:00 pushes later, 07:00 pulls earlier');

  const explore = one('body-clock', 'light-shift');
  assert.equal(myShift(explore.widget.light, explore.widget.offset), 0, 'the block starts where it does nothing');
  for (const later of [false, true]) for (const earlier of [false, true]) {
    const res = explore.check({ previewed: { later, earlier, none: true } });
    assert.equal(res === true, later && earlier);
    if (res !== true) assert.match(res, later ? /Now try the hours after/ : earlier ? /Now try the hours before/ : /Drag the yellow block/);
  }
  assert.equal(explore.check({ previewed: explore.solution.previewed }), true);

  const jet = one('body-clock', 'jet-east');
  assert.equal(jet.widget.offset, 6);
  assert.match(flat(jet.text), /6 hours behind\*\* local time, so her low point now falls at 10:30/);
  near(MY_LOW + 6, 10.5);
  // light at 08:00 on the first morning: before her low point, so the clock moves later (the trap in the explanation)
  assert.ok(myShift(8, 6) > 1);
  assert.match(flat(jet.explain), /08:00 hits her body at 02:00/);
  // play out every plan that keeps the light at one clock time, and the plan that always takes the best light
  const run = (lightFor, days) => { let off = 6; const out = []; for (let d = 0; d < days; d++) { off += myShift(lightFor(off, d), off); out.push(off); } return out; };
  const best = (off) => { let pick = 0; for (let l = 0; l < 24; l += 0.5) if (myShift(l, off) < myShift(pick, off)) pick = l; return pick; };
  const greedy = run(best, 7);
  assert.ok(Math.abs(greedy[5]) <= 0.5, `with the best light every day she is in step after 6 days (${greedy[5]})`);
  assert.ok(Math.abs(greedy[4]) > 0.5, 'and not sooner: about six days for six zones');
  let fixedWins = 0;
  for (let l = 0; l < 24; l += 0.5) {
    const path = run(() => l, 10);
    path.forEach((off, i) => {
      const state = { offset: Math.round(off * 100) / 100, days: i + 1, aligned: Math.abs(off) <= 0.5, light: l };
      const res = jet.check(state);
      assert.equal(res === true, state.aligned && state.days <= 7, `light ${l}, day ${i + 1}`);
      if (res === true) fixedWins++;
      else {
        assert.equal(typeof res, 'string');
        if (/wrong way/.test(res)) assert.ok(off > 6);
        if (/still .* behind/.test(res)) assert.ok(state.days >= 7 && off > 0.5, `light ${l}, day ${i + 1}, offset ${off}: ${res}`);
        if (/it took/.test(res)) assert.ok(state.aligned && state.days > 7);
        if (/pulled too far/.test(res)) { assert.ok(off < -0.5); assert.ok(res.includes(`${H.hoursText(Math.round(-off * 10) / 10)} ahead`)); }
      }
    });
  }
  assert.ok(fixedWins >= 1, 'at least one plan that never moves the light also works');
  assert.match(jet.check({ offset: 6, days: 0, aligned: false }), /Place the light/);
  assert.equal(jet.check({ ...jet.solution, aligned: Math.abs(jet.solution.offset) <= 0.5 }), true);
  // westward the best plan is quicker, as the explanation says
  let off = -6; let days = 0;
  while (Math.abs(off) > 0.5 && days < 20) { let pick = 0; for (let l = 0; l < 24; l += 0.5) if (myShift(l, off) > myShift(pick, off)) pick = l; off += myShift(pick, off); days++; }
  assert.ok(days <= 4, `six zones west take ${days} days at best`);
});

test('lesson 2: the three daily curves say what the text says', async () => {
  const { compile } = await import('../src/core/mathexpr.js');
  const fn = (expr, c) => { const f = compile(expr, { vars: ['x', 'c'] }); return (x) => f({ x, c }); };
  const argBest = (f, better) => { let at = 0; for (let x = 0; x <= 24; x += 0.25) if (better(f(x), f(at))) at = x; return at; };
  const hi = (a, b) => a > b; const lo = (a, b) => a < b;
  for (const c of [0, 2]) {
    const temp = fn(H.DAY_CURVES.temperature, c); const mel = fn(H.DAY_CURVES.melatonin, c); const cort = fn(H.DAY_CURVES.cortisol, c);
    near(argBest(temp, lo), 4.5 + c, 1e-9, 'temperature is lowest');
    near(argBest(temp, hi), 16.5 + c, 1e-9, 'temperature is highest');
    near(argBest(cort, hi), 8 + c, 1e-9, 'cortisol peak');
    near(argBest(mel, hi), 3 + c, 1e-9, 'melatonin peak');
    assert.ok(mel(13 + c) < 0.05 && mel(1 + c) > 0.5 && mel(23 + c) > mel(21 + c), 'melatonin: high at night, rising in the late evening');
    near(mel(0), mel(24), 1e-6, 'the curves join up at midnight'); near(cort(0), cort(24), 1e-6); near(temp(0), temp(24), 1e-9);
    for (const f of [temp, mel, cort]) for (let x = 0; x <= 24; x += 0.5) assert.ok(f(x) >= 0 && f(x) <= 1.05);
  }
  const curves = one('body-clock', 'curves');
  assert.deepEqual([...curves.template.matchAll(/\[\[[^\]]*\*([^|\]]+)/g)].map((m) => m[1]), ['04:30', 'during the night', 'soon after waking']);
  const school = one('body-clock', 'school');
  assert.equal(school.figures[0].vlines[0].x, 6.5, 'the alarm line is at 06:30');
  assert.match(correctText(school), /low point of the night, with melatonin still high/);
  assert.match(flat(school.explain), /the low point lands at 06:30/);
  assert.ok(school.options.some((o) => /cortisol peak comes at about 10:00/.test(o.why || '')));
  assert.ok(fn(H.DAY_CURVES.melatonin, 2)(6.5) > 0.4, 'two hours later, melatonin is still high at 06:30');
  const rule = one('body-clock', 'light-rule');
  assert.deepEqual([...rule.template.matchAll(/\[\[[^\]]*\*([^|\]]+)/g)].map((m) => m[1]), ['later', 'earlier', 'melatonin']);
  const sort = one('body-clock', 'sort');
  assert.deepEqual(sort.buckets, ['Moves it later', 'Moves it earlier', 'Hardly moves it']);
  const want = { 'Bright light in the last hours before bed': 0, 'Daylight in the first hours after waking': 1, 'Bright light in the middle of the afternoon': 2 };
  for (const item of sort.items) if (item.text in want) assert.equal(item.bucket, want[item.text], item.text);
  // those three, on the model: 21:30, 08:00 and 15:00 for a person whose low point is at 04:30
  assert.ok(myShift(21.5, 0) > 0.5 && myShift(8, 0) < -0.5 && myShift(15, 0) === 0);
  const shift = one('body-clock', 'shift-work');
  assert.deepEqual(shift.options.filter((o) => o.correct).map((o) => o.text.slice(0, 20)), ['Most night workers\' b', 'Years of night work '].map((s) => s.slice(0, 20)));
  assert.ok(shift.options.some((o) => !o.correct && /"probably" cancer-causing in 2019/.test(o.why)));
});

/* ====================================================================== lesson 3: better-sleep */

// Own version of the two-process model, stepped minute by minute (the widget uses closed-form exponentials).
// Constants as usually quoted for Borbély's model: pressure rises with a time constant of 18.2 h awake and
// decays with 4.2 h asleep; the clock's alerting signal is a 24-hour cosine, here of size 0.3, peaking at 17:00.
function myPressure(s0, from, blocks, until) {
  let S = s0;
  const dt = 1 / 600;
  for (let t = from; t < until - 1e-9; t += dt) {
    const asleep = blocks.some((b) => t >= b[0] - 1e-9 && t < b[1] - 1e-9);
    S += dt * (asleep ? -S / 4.2 : (1 - S) / 18.2);
  }
  return S;
}
const myAlert = (t) => 0.3 * Math.cos((2 * Math.PI * (t - 17)) / 24);
// Caffeine: mean half-life about 5 h, range about 1.5 to 9.5 h (StatPearls "Caffeine"; US National Academies).
// EFSA 2015: up to 400 mg a day for most adults, 200 mg in pregnancy; espresso and a 250 ml energy drink about 80 mg, cola (355 ml) about 40 mg.
const MY_CAFFEINE = { halfLife: 5, range: [1.5, 9.5], adult: 400, pregnancy: 200 };

test('lesson 3: facts about caffeine and insomnia, and the widget\'s constants', async () => {
  const sp = await import('../src/widgets/sleep-pressure.js');
  assert.deepEqual([sp.TAU_WAKE, sp.TAU_SLEEP, sp.CLOCK_AMP, sp.CLOCK_PEAK], [18.2, 4.2, 0.3, 17]);
  for (const t of [0, 5, 11, 17, 23]) near(sp.alerting(t), myAlert(t), 1e-12);
  assert.deepEqual(H.CAFFEINE, { halfLife: MY_CAFFEINE.halfLife, range: MY_CAFFEINE.range, adultDailyMax: MY_CAFFEINE.adult, pregnancyDailyMax: MY_CAFFEINE.pregnancy });
  for (const d of H.DRINKS) { assert.ok(d.mg >= 40 && d.mg <= 200, d.drink); assert.equal(d.mg % 40, 0, `${d.drink}: halves cleanly three times`); }
  assert.equal(H.DRINKS.find((d) => d.drink === 'an espresso').mg, 80);
  assert.equal(H.DRINKS.find((d) => d.drink === 'a can of cola').mg, 40);
  for (const c of H.CLEARERS) assert.ok(c.halfLife >= MY_CAFFEINE.range[0] && c.halfLife <= MY_CAFFEINE.range[1], `${c.name}: a half-life inside the measured range`);
  assert.deepEqual(H.INSOMNIA, { nightsPerWeek: 3, months: 3 });
  // a normal day on the model: 23:00 to 07:00 asleep gives about 9 on waking and about 62 at bedtime, day after day
  let S = 0.62;
  for (let day = 0; day < 4; day++) { S = myPressure(S, 23, [[23, 31]], 31); near(S * 100, H.PRESSURE.usualWake, 0.6, 'on waking'); S = myPressure(S, 7, [], 23); near(S * 100, H.PRESSURE.usualBed, 0.6, 'at bedtime'); }
  // the hook and the predict slider
  const hook = one('better-sleep', 'hook');
  assert.match(correctText(hook), /At 05:00, after 22 hours awake/);
  near(span('07:00', '05:00'), 22); near(span('07:00', '10:00') + 24, 27);
  const sleepy = (t) => myPressure(0.09, 7, [], t) - myAlert(t);
  assert.ok(sleepy(29) > sleepy(34), 'sleepier at 05:00 than at 10:00');
  const guess = one('better-sleep', 'caffeine-predict');
  const left = 100 * Math.exp((-Math.LN2 * 8) / MY_CAFFEINE.halfLife);
  assert.ok(Math.abs(left - guess.answer) <= guess.tolerance / 2, `${left} mg is left at 23:00`);
  assert.equal(Math.round(left), 33);
  assert.match(flat(guess.explain), /About \*\*33 mg\*\*/);
  assert.match(flat(guess.explain), /about \*\*5 hours\*\*/);
});

test('lesson 3: the all-nighter, the lie-in and the nap accept exactly what they ask for', () => {
  const night = one('better-sleep', 'all-nighter');
  const w = night.widget;
  assert.deepEqual([w.from, w.to, w.s0], [7, 41, 0.09]);
  const sleepiness = (t) => myPressure(w.s0, w.from, [], t) - myAlert(t);
  let worst = w.from;
  for (let t = w.from; t <= w.to; t += 0.25) if (sleepiness(t) > sleepiness(worst)) worst = t;
  assert.ok(worst >= 29 && worst <= 30, `sleepiest at ${H.clock(worst)}`);
  assert.match(flat(night.explain), /sleepiest at about \*\*05:30\*\*/);
  let accepted = 0;
  for (let c = w.from; c <= w.to; c += 0.5) {
    const state = { cursor: c, clock: H.clock(c), sleepiness: Math.round(sleepiness(c) * 100), worst: { t: worst } };
    const res = night.check(state);
    assert.equal(res === true, Math.abs(c - worst) <= 1, `marker at ${H.clock(c)}`);
    if (res === true) { accepted++; assert.ok(sleepiness(c) > sleepiness(worst) - 0.012, 'within a whisker of the peak'); }
    else {
      assert.ok(res.includes(`At ${H.clock(c)} his sleepiness is ${state.sleepiness}`));
      if (c < worst) assert.match(res, /climbs higher than that later/);
      else { assert.match(res, /lower than it was earlier, although he has now been awake for longer/); assert.ok(sleepiness(c) < sleepiness(worst)); }
    }
  }
  assert.ok(accepted >= 3 && accepted <= 5);
  assert.ok(Math.abs(night.solution.cursor - worst) <= 1);

  const lie = one('better-sleep', 'lie-in');
  const lw = lie.widget;
  const sat = lw.blocks.find((b) => b.id === 'saturday');
  assert.deepEqual([sat.start, sat.end], [23, 34.5], 'asleep from 23:00 on Saturday to 10:30 on Sunday');
  assert.match(flat(lie.text), /slept in until \*\*10:30\*\*\. At 23:00 her pressure is only 52/);
  const sundayPressure = (bed) => myPressure(lw.s0, lw.from, [[sat.start, sat.end]], bed) * 100;
  near(sundayPressure(47), 52, 0.5);
  // on an ordinary Sunday (up at 07:00) the same model gives the dashed line
  near(myPressure(lw.s0, lw.from, [[23, 31]], 47) * 100, lw.line, 0.6);
  const slider = lw.sliders[0];
  const ok = [];
  for (let bed = slider.min; bed <= slider.max; bed += slider.step) {
    const p = sundayPressure(bed);
    const res = lie.check({ blocks: { sunday: { start: bed } }, bedPressure: Math.round(p * 10) / 10 });
    if (res === true) ok.push(bed);
    else if (p < lw.line) assert.ok(res.includes(`At ${H.clock(bed)} her pressure is ${Math.round(p)}: still below 62`), res);
    else assert.ok(res.includes(`her pressure is ${Math.round(p)}`) && /earliest/.test(res), res);
  }
  assert.deepEqual(ok, [51.5], 'only 03:30 is accepted');
  assert.ok(sundayPressure(51) < lw.line && sundayPressure(51.5) >= lw.line, '03:30 is the first half-hour at which the line is reached');
  assert.equal(lie.solution.blocks.sunday.start, 51.5);
  assert.match(flat(lie.explain), /Not until about \*\*03:30\*\*/);
  assert.match(flat(lie.explain), /three and a half hours has pushed .* back by four and a half/);
  near(span('07:00', '10:30'), 3.5); near(span('23:00', '03:30'), 4.5);

  const nap = one('better-sleep', 'nap');
  const nw = nap.widget;
  const [move, length] = nw.sliders;
  const bedP = (start, len) => myPressure(nw.s0, nw.from, [[start, start + len]], 23) * 100;
  near(bedP(18, 1.5), 46.5, 0.5, 'the nap in the text: 90 minutes at 18:00');
  assert.ok(bedP(18, 1.5) < nw.line - 8, 'far below the line');
  const good = [];
  for (let start = move.min; start <= move.max; start += move.step) {
    for (let len = length.min; len <= length.max + 1e-9; len += length.step) {
      const p = bedP(start, len);
      if (Math.abs(p - nw.line) < 0.06) continue;           // too close to the line to call by a second method
      const res = nap.check({ blocks: { nap: { start, length: len } }, bedPressure: Math.round(p * 10) / 10 });
      assert.equal(res === true, p >= nw.line, `nap at ${start} for ${len} h: ${p}`);
      if (res === true) good.push([start, len]);
      else assert.ok(res.includes(`leaves her pressure at ${Math.round(p * 10) / 10} by 23:00`) && res.includes(`nap at ${H.clock(start)}`), res);
    }
  }
  assert.ok(good.length >= 10);
  assert.ok(good.every(([, len]) => len <= 0.5), 'only naps of half an hour or less pass');
  assert.ok(good.filter(([, len]) => len === 0.5).every(([start]) => start <= 16), 'and half-hour naps only early in the afternoon');
  assert.equal(nap.check({ blocks: { nap: nap.solution.blocks.nap }, bedPressure: Math.round(bedP(nap.solution.blocks.nap.start, nap.solution.blocks.nap.length) * 10) / 10 }), true);
  assert.equal(length.min, 0.25, 'the nap cannot be removed altogether');
});

test('lesson 3: the coffee that leaves 25 mg at bedtime', async () => {
  const { kernel } = await import('../src/widgets/decay-curve.js');
  for (const dt of [0, 1, 5, 10, 12.5]) near(kernel(dt, 5), Math.exp((-Math.LN2 * dt) / 5), 1e-12);
  assert.equal(kernel(-1, 5), 0);
  const step = one('better-sleep', 'caffeine-move');
  const w = step.widget;
  assert.deepEqual(w.events, [{ t: 15, amount: 100 }]);
  assert.equal(w.curves[0].halfLife, 5);
  assert.equal(w.marker.t, 23);
  const ok = [];
  for (let t = w.minT; t <= w.maxT; t += w.snap) {
    // halve minute by minute: a second way to the same number
    let mg = 100;
    const perMinute = Math.pow(0.5, 1 / 300);
    for (let m = 0; m < Math.round((23 - t) * 60); m++) mg *= perMinute;
    const atMarker = Math.round(mg * 10) / 10;
    const res = step.check({ events: [{ t, amount: 100 }], atMarker });
    if (res === true) ok.push(t);
    else {
      assert.ok(res.includes(`A coffee at ${H.clock(t)} leaves ${atMarker} mg at 23:00`), res);
      assert.match(res, atMarker > 25 ? /more than 25\. Earlier/ : /later cup would also do/);
    }
  }
  assert.deepEqual(ok, [13]);
  assert.equal(step.solution.events[0].t, 13);
  assert.match(flat(step.explain), /\*\*13:00\.\*\* From 100 mg to 25 mg takes two half-lives, which is 10 hours/);
});

test('lesson 3: how much caffeine is left after one, two or three half-lives', () => {
  const ks = new Set();
  const n = eachVariant('better-sleep', 'caffeine-left', (step) => {
    const text = flat(step.text);
    const [half] = grab(/half-life of \*\*(\d+) hours\*\*/, text).map(Number);
    const [start] = grab(/At \*\*(\d\d:\d\d)\*\*/, text);
    const [mg] = grab(/about \*\*(\d+) mg\*\* of caffeine/, text).map(Number);
    const [end] = grab(/is left at (\d\d:\d\d)\?/, text);
    const hours = span(start, end);
    const k = hours / half;
    assert.ok(Number.isInteger(k) && k >= 1 && k <= 3, `${hours} hours is a whole number of half-lives of ${half} h`);
    assert.ok(hm(start) + hours <= 25, 'the question ends by 01:00');
    let left = mg;
    for (let i = 0; i < k; i++) left /= 2;
    near(step.answer, left);
    near(step.answer, mg * Math.exp((-Math.LN2 * hours) / half), 1e-9);
    assert.equal(step.unit, 'mg');
    assert.ok(Number.isInteger(step.answer));
    assert.ok(half >= MY_CAFFEINE.range[0] && half <= MY_CAFFEINE.range[1]);
    const chain = Array.from({ length: k + 1 }, (_, i) => mg / 2 ** i).join(' → ');
    assert.ok(flat(step.explain).includes(`${chain} mg. **${left} mg** is left`), step.explain);
    assert.ok(flat(step.explain).includes(`is ${hours} hours: ${k === 1 ? 'one half-life' : `${k} half-lives`}`));
    assert.ok(step.hints[0].includes(`is ${hours} hours`));
    assert.ok(flat(step.explain).includes('from about 1.5 to 9.5 hours'));
    for (const [slip, why] of step.wrong) {
      if (slip === mg / 2) assert.ok(why.includes(`at ${H.clock(hm(start) + half)}`) && why.includes(`${k} half-lives have passed`));
      if (slip === mg / 4) assert.ok(k === 3);
    }
    ks.add(k);
  });
  assert.equal(ks.size, 3);
  assert.ok(n >= 60);
});

test('lesson 3: which process explains each scene', () => {
  // Own reading of every scene: what the wording alone implies.
  const seen = new Set();
  eachVariant('better-sleep', 'which-process', (step) => {
    const text = flat(step.text);
    let cause;
    if (/coffee|energy drink/.test(text)) cause = 'Caffeine is hiding the sleep pressure';
    else if (/napped|slept until noon/.test(text)) cause = 'Too little sleep pressure has built up';
    else { assert.match(text, /stayed up all night|time zones|works nights/); cause = 'The body clock is sending its alerting signal'; }
    assert.equal(correctText(step), cause);
    assert.deepEqual(step.options.map((o) => o.text), ['Too little sleep pressure has built up', 'The body clock is sending its alerting signal', 'Caffeine is hiding the sleep pressure']);
    for (const o of step.options) if (!o.correct && /^Caffeine/.test(o.text)) assert.match(o.why, /There is no caffeine in this story/);
    seen.add(text);
  });
  assert.equal(seen.size, H.SLEEP_SCENES.length);
  const by = (name) => H.SLEEP_SCENES.find((s) => s.text.startsWith(name));
  // the arithmetic inside the explanations
  near(span('20:00', '23:30'), 3.5); assert.match(by('Dmitri').because, /three and a half hours awake/);
  near(span('12:00', '23:00'), 11); assert.match(by('Hana').because, /only eleven hours/);
  assert.equal((3 + 8) % 24, 11); assert.match(by('Leilani').text, /flown west across eight time zones\. At 03:00/); assert.match(by('Leilani').because, /11:00 in the morning/);
  near(span('21:30', '00:30'), 3); assert.match(by('Bao').because, /Three hours after the drink, most of its caffeine is still in his body/);
  assert.ok(Math.exp((-Math.LN2 * 3) / 5) > 0.5);
  assert.match(by('Ines').text, /after 17 hours awake/);
  // on the model: Kwame at 10:00 against 05:00; a nap from 18:00 to 20:00; a lie-in to noon
  assert.ok(myPressure(0.09, 7, [], 34) > myPressure(0.09, 7, [], 29) && myAlert(34) > myAlert(29));
  assert.ok(myPressure(0.09, 7, [[18, 20]], 23.5) < 0.5);
  assert.ok(myPressure(0.62, 23, [[23, 36]], 47) < 0.52);
});

test('lesson 3: habits, insomnia and the signs worth a doctor\'s visit', () => {
  const habits = one('better-sleep', 'habits');
  assert.deepEqual(habits.buckets, ['Helps sleep', 'Harms sleep', 'Little or mixed evidence']);
  const mine = [
    [/same time every day/, 0], [/Daylight in the morning/, 0], [/cool, dark, quiet/, 0],
    [/glass of wine/, 1], [/large coffee six hours before bed/, 1],
    [/filter out blue light/, 2], [/sleep tracker/, 2],
  ];
  assert.equal(habits.items.length, mine.length);
  for (const item of habits.items) { const hit = mine.find(([re]) => re.test(item.text)); assert.ok(hit, item.text); assert.equal(item.bucket, hit[1], item.text); }
  near(Math.exp((-Math.LN2 * 6) / 5), 0.435, 0.001);       // "nearly half of the caffeine is still there"
  assert.match(correctText(one('better-sleep', 'insomnia')), /CBT-I/);
  const flags = one('better-sleep', 'red-flags');
  assert.deepEqual(flags.options.map((o) => !!o.correct), [true, true, true, false, false]);
  assert.match(flags.options[2].text, /at least 3 nights a week for 3 months/);
  assert.match(flat(flags.explain), /sleep apnoea/);
  assert.match(flat(flags.explain), /stop driving/);
  const cpap = one('better-sleep', 'cpap');
  assert.match(correctText(cpap), /room air.*slight pressure holds the airway open/);
  assert.ok(cpap.options.some((o) => /not extra oxygen/.test(o.why || '')));
  assert.equal(cpap.figures[0].type, 'photo');
  const two = one('better-sleep', 'two-processes');
  assert.deepEqual([...two.template.matchAll(/\[\[[^\]]*\*([^|\]]+)/g)].map((m) => m[1]), ['rises', 'falls', 'early evening', 'low']);
  assert.ok(myAlert(17) > myAlert(5) && myAlert(17) > myAlert(8) && myAlert(17) > myAlert(1));
});

/* ====================================================================== lesson 4: stress */

// Own version of a level that builds up with time constant `rise` and wears off with half-life `half`,
// scaled to a peak of 1: stepped numerically from the two-compartment picture behind it
// (a store that empties with the rise time into a pool that is cleared with the half-life).
function myResponse(half, rise, upTo, dt = 0.01) {
  const out = [];
  let store = 1;
  let pool = 0;
  const k = Math.LN2 / half;
  for (let t = 0; t <= upTo + 1e-9; t += dt) {
    out.push(pool);
    const flow = (store / rise) * dt;
    store -= flow;
    pool += flow - pool * k * dt;
  }
  const top = Math.max(...out);
  return { at: (t) => out[Math.min(out.length - 1, Math.max(0, Math.round(t / dt)))] / top, peakAt: out.indexOf(top) * dt };
}

test('lesson 4: the stress-hormone model has the time course the textbooks give', async () => {
  const { kernel } = await import('../src/widgets/decay-curve.js');
  const [adr, cort] = H.STRESS_CURVES;
  assert.deepEqual([adr.id, cort.id], ['adrenaline', 'cortisol']);
  const myCort = myResponse(cort.halfLife, cort.rise, 400);
  const myAdr = myResponse(adr.halfLife, adr.rise, 100);
  for (const t of [5, 10, 20, 40, 60, 90, 120, 180]) near(kernel(t, cort.halfLife, cort.rise), myCort.at(t), 0.01, `cortisol at ${t} min`);
  for (const t of [1, 2, 5, 10, 20]) near(kernel(t, adr.halfLife, adr.rise), myAdr.at(t), 0.02, `adrenaline at ${t} min`);
  // cortisol peaks 20 to 30 minutes after the stress begins (Trier Social Stress Test literature) …
  assert.ok(myCort.peakAt >= 18 && myCort.peakAt <= H.STRESS.cortisolPeakMin[1], `cortisol peaks after ${myCort.peakAt} min`);
  assert.deepEqual(H.STRESS.cortisolPeakMin, [20, 30]);
  // … and is back near its resting level an hour or two later
  assert.ok(myCort.at(60) > 0.3 && myCort.at(120) < 0.12 && myCort.at(150) < 0.05);
  // adrenaline: there within a minute or two, gone within minutes
  assert.ok(myAdr.peakAt < 2 && myAdr.at(20) < 0.06);
  const line = one('stress', 'timeline');
  assert.deepEqual([...line.template.matchAll(/\[\[[^\]]*\*([^|\]]+)/g)].map((m) => m[1]), ['seconds', '20', 'an hour or two']);
  assert.equal(line.figures[0].events[0].t, 20);
  assert.match(flat(line.text), /one alarm, at minute 20/);
  assert.deepEqual(H.STRESS.restingBreaths, [12, 20]);
  assert.equal(H.STRESS.slowBreaths, 6);
  assert.deepEqual([H.WHITEHALL.started, H.WHITEHALL.men, H.WHITEHALL.ratio], [1967, 17500, 3]);
  const control = one('stress', 'control');
  assert.match(correctText(control), /lowest grades/);
  assert.match(flat(control.text), /From 1967, researchers followed about 17,500 men/);
  assert.match(flat(control.explain), /about \*\*three times\*\* the death rate of the top grade/);
  assert.match(correctText(one('stress', 'hook')), /Much the same/);
});

test('lesson 4: the body-diagram steps and the order of the alarm chain', async () => {
  const body = await import('../src/widgets/body-map.js');
  const tour = one('stress', 'alarm-body');
  const parts = body.expandIds(tour.widget.show);
  for (const id of parts) assert.ok(tour.widget.notes[id] && tour.widget.notes[id].length > 30, `a note for ${id}`);
  assert.deepEqual(Object.keys(tour.widget.notes).sort(), parts.slice().sort(), 'a note for every part shown, and no others');
  for (let n = 0; n <= parts.length; n++) {
    const res = tour.check({ seenCount: n, seen: parts.slice(0, n) });
    assert.equal(res === true, n >= 5);
    if (res !== true) assert.ok(res.includes(`That is ${n}`) && res.includes(`Tap ${5 - n} more`));
  }
  assert.ok(tour.solution.seen.length >= 5 && tour.solution.seen.every((id) => parts.includes(id)));

  const pick = one('stress', 'adrenal-pick');
  assert.equal(pick.widget.answer, 'adrenals');
  const candidates = body.expandIds(pick.widget.pickable);
  assert.ok(candidates.includes('adrenals') && candidates.includes('right-kidney') && candidates.includes('pancreas'));
  for (const id of candidates) {
    const res = pick.check({ picked: id, name: body.structureName(id), nameThe: body.structureNameThe(id) });
    assert.equal(res === true, id === 'adrenals', id);
    if (res !== true) {
      assert.equal(typeof res, 'string');
      if (/kidney/.test(id)) assert.match(res, /That is a kidney/);
      else assert.ok(res.includes(body.structureNameThe(id)), `${id}: ${res}`);
    }
  }
  assert.equal(pick.check({ picked: null }), false);
  assert.equal(pick.check(pick.solution), true);
  assert.match(body.structureInfo('adrenals').note, /kidney/i);

  // own table: the fast nerve route and the slow hormone route, in the order things happen
  const chain = one('stress', 'chain');
  const mine = [/amygdala.*flags a threat/, /hypothalamus switches on/, /Within seconds: nerves.*adrenaline/, /Over minutes: a hormone messenger.*pituitary/, /After about 20 minutes: cortisol/];
  assert.equal(chain.items.length, mine.length);
  chain.items.forEach((item, i) => assert.match(item, mine[i]));

  // the two structures the chain names are shown on a real scan, labelled, with nothing to answer on it
  const routes = one('stress', 'teach-two-routes');
  const scan = routes.figures[0];
  assert.equal(scan.type, 'photo');
  assert.equal(scan.mode, 'label');
  assert.deepEqual(scan.hotspots.map((h) => h.id), ['hypothalamus', 'pituitary']);
  assert.deepEqual(scan.hotspots.map((h) => h.label), ['Hypothalamus', 'Pituitary gland']);
  for (const h of scan.hotspots) assert.ok(h.r >= 0.04 && h.x > h.r && h.x < 1 - h.r && h.y > 0 && h.y < 1, h.id);
  const [hyp, pit] = scan.hotspots;
  assert.ok(pit.y > hyp.y, 'the pituitary hangs below the hypothalamus');
  assert.ok(Math.hypot(hyp.x - pit.x, (hyp.y - pit.y) * (scan.height / scan.width)) >= hyp.r + pit.r, 'the two rings do not overlap');
  assert.match(flat(routes.text), /The picture is an MRI scan, seen from the side: the pituitary\s+hangs on a short stalk under the hypothalamus/);
});

test('lesson 4: the performance curve, the pile-up of alarms and the breathing pacer accept what they ask for', () => {
  const useful = one('stress', 'useful');
  const perf = (a) => 100 * Math.exp(-(((a - 5) / 2.4) ** 2));
  assert.equal(useful.widget.fns[0].expr, '100*exp(-((x-5)/2.4)^2)');
  const { min, max, step } = useful.widget.params.a;
  let best = min;
  for (let a = min; a <= max; a += step) if (perf(a) > perf(best)) best = a;
  assert.equal(best, 5);
  for (let a = min; a <= max; a += step) {
    const res = useful.check({ a });
    assert.equal(res === true, Math.abs(a - best) <= 0.5, `alertness ${a}`);
    if (res !== true) assert.match(res, a < best ? /more keyed up/ : /Past the top/);
  }
  assert.equal(useful.check(useful.solution), true);
  assert.notEqual(useful.widget.params.a.value, 5);

  const pile = one('stress', 'pile-up');
  const w = pile.widget;
  const cort = myResponse(25, 12, 400);
  const peakOf = (times) => { let top = 0; for (let t = 0; t <= w.to; t += 0.5) { let v = 0; for (const e of times) if (t >= e) v += 100 * cort.at(t - e); top = Math.max(top, v); } return top; };
  const startPeak = peakOf(w.events.map((e) => e.t));
  assert.ok(startPeak > 200, `bunched together the alarms reach ${startPeak}: more than twice one alarm`);
  assert.ok(w.events[2].t - w.events[0].t <= 30, 'three alarms within half an hour');
  assert.equal(w.line.y, 125);
  let passes = 0; let fails = 0;
  for (let a = w.minT; a <= w.maxT; a += 30) for (let b = a; b <= w.maxT; b += 30) for (let c = b; c <= w.maxT; c += 30) {
    const peak = peakOf([a, b, c]);
    if (Math.abs(peak - 125) < 2) continue;                  // too close to the line to call by a second method
    const res = pile.check({ peak: Math.round(peak * 10) / 10, count: 3 });
    assert.equal(res === true, peak <= 125, `alarms at ${a}, ${b}, ${c}: ${peak}`);
    if (res === true) { passes++; assert.ok(b - a >= 60 && c - b >= 60, 'only well-spaced alarms pass'); }
    else { fails++; assert.ok(res.includes(`climbs to ${Math.round(Math.round(peak * 10) / 10)}`), res); }
  }
  assert.ok(passes > 20 && fails > 50);
  assert.ok(peakOf(pile.solution.events.map((e) => e.t)) <= 125);

  const breathing = one('stress', 'breathing');
  const bw = breathing.widget;
  const ok = [];
  for (let i = bw.inhaleRange[0]; i <= bw.inhaleRange[1]; i += bw.inhaleRange[2]) for (let o = bw.exhaleRange[0]; o <= bw.exhaleRange[1]; o += bw.exhaleRange[2]) {
    const perMinute = 60 / (i + o);
    const res = breathing.check({ inhale: i, exhale: o, cycle: i + o, rate: Math.round(perMinute * 10) / 10, longerExhale: o > i });
    const wanted = Math.abs(perMinute - 6) < 1e-9 && o > i;
    assert.equal(res === true, wanted, `in ${i}, out ${o}`);
    if (wanted) ok.push(`${i}-${o}`);
    else if (Math.abs(perMinute - 6) < 1e-9) assert.match(res, /Now make the out-breath the longer part/);
    else assert.ok(res.includes(`one breath every ${i + o} s`) && res.includes(`${Math.round(perMinute * 10) / 10} breaths a minute`));
  }
  assert.deepEqual(ok, ['2-8', '3-7', '4-6']);
  assert.equal(breathing.check({ ...breathing.solution, cycle: 10, rate: 6, longerExhale: true }), true);
  assert.notEqual(60 / (bw.inhale + bw.exhale), 6, 'the pacer does not start on the answer');
  assert.match(flat(breathing.explain), /about half the usual resting pace of 12 to 20/);
  // the pacer is optional, promises no treatment, and says when to stop
  assert.match(flat(breathing.text), /if you like/);
  assert.match(flat(breathing.explain), /not a cure/);
  assert.match(flat(breathing.explain), /dizzy or uneasy, stop and breathe normally/);
  const pacer = readFileSync(fileURLToPath(new URL('../src/widgets/paced-breathing.js', import.meta.url)), 'utf8');
  assert.match(pacer, /Stop if you feel dizzy or uneasy/);
  assert.match(pacer, /Breathe along \(optional\)/);
});

test('lesson 4: breaths a minute from the seconds in and out', () => {
  const rates = new Set();
  eachVariant('stress', 'breath-rate', (step) => {
    const text = flat(step.text);
    const [i, o] = grab(/breathes in for \*\*(\d+) seconds?\*\* and out for \*\*(\d+) seconds?\*\*/, text).map(Number);
    // count the breaths that fit into a minute
    let breaths = 0;
    for (let t = i + o; t <= 60; t += i + o) breaths++;
    assert.equal((i + o) * breaths, 60, 'a whole number of breaths fills the minute');
    assert.equal(step.answer, breaths);
    assert.equal(step.unit, 'breaths a minute');
    assert.ok(flat(step.explain).includes(`${i} + ${o} = ${i + o} seconds, and 60 ÷ ${i + o} = **${breaths}** breaths a minute`));
    assert.equal(/out-breath longer than the in-breath/.test(step.explain), o > i);
    if (/slow, calming pace/.test(step.explain)) assert.ok(breaths <= 7);
    if (/ordinary resting pace/.test(step.explain)) assert.ok(breaths >= 12 && breaths <= 20);
    if (/slower than most people breathe at rest/.test(step.explain)) assert.ok(breaths < 12);
    near(step.wrong[0][0], i + o);
    assert.match(text, i === 1 ? /\*\*1 second\*\*/ : /seconds\*\* and out/);
    rates.add(breaths);
  });
  assert.ok(rates.size >= 5);
});

test('lesson 4: short-term or long-term stress', () => {
  // own reading of each example: long-term if its wording says it goes on and on
  const longTerm = (text) => /years|months|week after week|constant overtime/i.test(text);
  for (const x of H.STRESSORS) assert.equal(x.kind === 'chronic', longTerm(x.text), x.text);
  assert.equal(H.STRESSORS.filter((x) => x.kind === 'chronic').length, 6);
  const asked = new Set();
  eachVariant('stress', 'sprint-or-marathon', (step) => {
    const text = flat(step.text);
    const wantLong = /Which of these is long-term \(chronic\) stress\?/.test(text);
    if (!wantLong) assert.match(text, /Which of these is short-term \(acute\) stress\?/);
    assert.equal(step.options.length, 4);
    for (const o of step.options) {
      assert.equal(!!o.correct, longTerm(o.text) === wantLong, o.text);
      if (!o.correct) assert.match(o.why, longTerm(o.text) ? /long-term stress\.$/ : /short-term stress\.$/);
    }
    assert.ok(step.explain.includes(`"${correctText(step)}"`));
    asked.add(wantLong);
  });
  assert.equal(asked.size, 2);
  const sort = one('stress', 'chronic');
  const quick = /Sugar released|faster, stronger heartbeat|Sharper attention|Digestion paused/;
  for (const item of sort.items) assert.equal(item.bucket, quick.test(item.text) ? 0 : 1, item.text);
  assert.equal(sort.items.filter((i) => i.bucket === 1).length, 4);
  const helps = one('stress', 'what-helps');
  assert.deepEqual(helps.pairs.map((p) => p[0]), ['A brisk walk or other exercise', 'Talking it over with someone you trust', 'Making a plan for the part you can change', 'A full night\'s sleep']);
  assert.match(flat(helps.explain), /\*\*alcohol\*\*/);
  assert.match(flat(one('stress', 'try-this').text), /call your local emergency number/);
});

/* ====================================================================== lesson 5: emotions-mind */

test('lesson 5: the thought loops of Ana and Jomo', () => {
  const explore = one('emotions-mind', 'loop-explore');
  const ana = explore.widget;
  assert.equal(ana.type, 'thought-loop');
  assert.equal(ana.thoughts.length, 3);
  for (const t of ana.thoughts) for (const key of ['id', 'text', 'feeling', 'action', 'next']) assert.ok(t[key] && t[key].length > 1, `Ana, ${t.id}: ${key}`);
  // the calm reading of the situation gives the mildest feeling
  const calm = ana.thoughts.find((t) => /did not see me/.test(t.text));
  assert.ok(ana.thoughts.every((t) => t === calm || t.level > calm.level + 40));
  for (let n = 0; n <= 3; n++) {
    const res = explore.check({ seenCount: n, seen: ana.thoughts.slice(0, n).map((t) => t.id) });
    assert.equal(res === true, n === 3);
    if (res !== true) assert.ok(res.includes(`${n} of the 3 thoughts`));
  }
  assert.deepEqual(explore.solution.seen.slice().sort(), ana.thoughts.map((t) => t.id).sort());

  const balanced = one('emotions-mind', 'balanced');
  const jomo = balanced.widget;
  // own reading: the thought that fits the evidence mentions facts on both sides
  const fits = (t) => /stall/.test(t.text) && /mock test/.test(t.text);
  assert.equal(jomo.thoughts.filter(fits).length, 1);
  for (const t of jomo.thoughts) {
    const res = balanced.check({ thought: t.id, seen: [t.id], seenCount: 1, level: t.level });
    assert.equal(res === true, fits(t), t.id);
    if (res !== true) assert.match(res, /fail/.test(t.text) ? /ignores everything on the other side/ : /does not fit the evidence either/);
  }
  assert.equal(typeof balanced.check({ thought: null, seen: [], seenCount: 0 }), 'string');
  assert.equal(balanced.check(balanced.solution), true);
  const fit = jomo.thoughts.find(fits);
  const doom = jomo.thoughts.find((t) => /going to fail/.test(t.text));
  assert.ok(flat(balanced.explain).includes(`at ${fit.level}, not at ${doom.level}`));
  assert.notEqual(jomo.thoughts.indexOf(fit), 0, 'the balanced thought is not simply the first');
  // the facts in the balanced thought are the ones sorted as evidence on the screen before
  const evidence = one('emotions-mind', 'evidence');
  assert.deepEqual(evidence.buckets, ['Evidence for the thought', 'Evidence against it', 'Not evidence either way']);
  const mine = [[/stalled twice/, 0], [/failed his first test/, 0], [/passed a full mock test/, 1], [/instructor says he is ready/, 1], [/driven the test routes/, 1], [/feels sick/, 2], [/cousin failed/, 2]];
  assert.equal(evidence.items.length, mine.length);
  for (const item of evidence.items) { const hit = mine.find(([re]) => re.test(item.text)); assert.ok(hit, item.text); assert.equal(item.bucket, hit[1], item.text); }
});

test('lesson 5: the chain, the emotions and the thinking traps', () => {
  const loop = one('emotions-mind', 'the-loop');
  assert.deepEqual(loop.items.map((i) => i.split(':')[0]), ['Situation', 'Thought', 'Feeling', 'Action']);
  assert.match(flat(loop.explain), /Aaron Beck in the 1960s/);
  assert.match(correctText(one('emotions-mind', 'hook')), /tells herself the message means/);
  const emotions = Object.fromEntries(one('emotions-mind', 'emotions').pairs);
  assert.match(emotions.Fear, /^Danger/); assert.match(emotions.Anger, /^A wrong or an obstacle/); assert.match(emotions.Sadness, /^A loss/); assert.match(emotions.Disgust, /^Something harmful/);
  const traps = Object.fromEntries(one('emotions-mind', 'traps').pairs);
  assert.match(traps.Catastrophising, /I will fail, and my whole year is wasted/);
  assert.match(traps['Mind-reading'], /He thinks I am an idiot/);
  assert.match(traps['All-or-nothing thinking'], /one answer wrong, so the whole test was a failure/);

  // own reading of each example thought
  const myTrap = (thought) => {
    if (/\b(She|He|They) (finds?|thinks?|are laughing)/.test(thought)) return 'Mind-reading';
    if (/Anything less than|no point in going on|Either .* or/.test(thought)) return 'All-or-nothing thinking';
    assert.match(thought, /fired|never find a job|career is over/);
    return 'Catastrophising';
  };
  const seen = new Set();
  eachVariant('emotions-mind', 'which-trap', (step) => {
    const text = flat(step.text);
    const [thought] = grab(/The thought that comes: \*"(.+?)"\*/, text);
    const name = myTrap(thought);
    assert.ok(correctText(step).startsWith(`${name}:`), `${thought} → ${correctText(step)}`);
    assert.deepEqual(step.options.map((o) => o.text.split(':')[0]), ['Catastrophising', 'Mind-reading', 'All-or-nothing thinking']);
    assert.ok(step.explain.startsWith(`**${name}**`));
    seen.add(thought);
  });
  assert.equal(seen.size, H.TRAP_THOUGHTS.length);
  assert.equal(H.TRAP_THOUGHTS.length, 9);
  for (const key of Object.keys(H.TRAPS)) assert.equal(H.TRAP_THOUGHTS.filter((t) => t.trap === key).length, 3);
});

test('lesson 5: leaving feeds the fear, staying shrinks it: all 32 ways through five meetings', () => {
  assert.deepEqual(H.FEAR, { start: 80, encounters: 5, stay: 0.75, leave: 1.1, goal: 30 });
  const step = one('emotions-mind', 'face-it');
  const w = step.widget;
  assert.deepEqual([w.start, w.encounters, w.stay, w.leave, w.goal], [80, 5, 0.75, 1.1, 30]);
  let passes = 0;
  for (let code = 0; code < 32; code++) {
    const choices = [0, 1, 2, 3, 4].map((i) => ((code >> i) & 1 ? 'stay' : 'leave'));
    let peak = 80;
    for (const c of choices) peak = Math.min(100, c === 'stay' ? peak * 0.75 : peak * 1.1);
    const stays = choices.filter((c) => c === 'stay').length;
    const state = { choices, next: Math.round(peak * 10) / 10, done: true, stays, leaves: 5 - stays };
    const res = step.check(state);
    assert.equal(res === true, peak < 30, choices.join(' '));
    assert.equal(peak < 30, stays >= 4, 'under the line exactly when he stays at least four times');
    if (res === true) passes++;
    else {
      assert.ok(res.includes(String(Math.round(state.next))), res);
      if (stays === 0) assert.match(res, /left every time, and his fear has grown from 80 to 100/);
      else assert.ok(res.includes(stays === 1 ? 'stayed once' : `stayed ${stays} times`) && res.includes(5 - stays === 1 ? 'left once' : `left ${5 - stays} times`), res);
    }
    // an unfinished run is never accepted
    assert.match(step.check({ ...state, choices: choices.slice(0, 3), done: false }), /3 of 5 meetings/);
  }
  assert.equal(passes, 6);
  assert.equal(step.check({ choices: step.solution.choices, next: 19, done: true, stays: 5, leaves: 0 }), true);
  near(80 * 0.75 ** 5, 18.98, 0.01);
  assert.match(correctText(one('emotions-mind', 'avoid-predict')), /It stays, or grows/);
});

test('lesson 5: rumination or problem-solving', () => {
  // own reading: "why" questions, "if only" and "should have" lead nowhere; the others ask for something to do
  const solving = (text) => !/^"?(Why|What is wrong with me|If only|I should have)/.test(text);
  for (const x of H.INNER_TALK) assert.equal(x.kind === 'solving', solving(x.text), x.text);
  assert.equal(H.INNER_TALK.filter((x) => x.kind === 'solving').length, 5);
  const asked = new Set();
  eachVariant('emotions-mind', 'ruminate', (step) => {
    const text = flat(step.text);
    const wantSolving = /Which of these is problem-solving\?/.test(text);
    if (!wantSolving) assert.match(text, /Which of these is rumination\?/);
    assert.equal(step.options.length, 4);
    for (const o of step.options) {
      assert.equal(!!o.correct, solving(o.text) === wantSolving, o.text);
      if (!o.correct) assert.match(o.why, solving(o.text) ? /problem-solving\.$/ : /rumination\.$/);
    }
    assert.ok(step.explain.includes(correctText(step)));
    asked.add(wantSolving);
  });
  assert.equal(asked.size, 2);
});

test('lesson 5: naming a feeling and the evidence on mindfulness', () => {
  assert.match(correctText(one('emotions-mind', 'naming')), /became smaller/);
  // Goyal et al., JAMA Internal Medicine 2014: 47 trials. MYRIAD (Kuyken et al.) 2022: 85 schools.
  assert.deepEqual(H.MINDFULNESS, { goyalTrials: 47, myriadSchools: 85, myriadYear: 2022 });
  const mind = one('emotions-mind', 'mindfulness');
  assert.deepEqual(mind.options.map((o) => !!o.correct), [true, true, false, false]);
  assert.match(mind.options[2].why, /47 trials/);
  assert.match(mind.options[3].why, /In 85 British schools \(2022\)/);
  // Goyal's own summary is "small to moderate reductions": the lesson does not round that up
  assert.match(mind.options[1].text, /by a small to moderate amount/);
  assert.ok(!/help moderately|people moderately/.test(flat(mind.explain) + lessons['emotions-mind'].recap.join(' ')));
  const last = flat(one('emotions-mind', 'try-this').text);
  assert.match(last, /They are not treatment/);
  assert.match(last, /talk to a doctor/);
});

/* ====================================================================== lesson 6: mental-health */

// Typed in separately. WHO, "World mental health today" and the fact sheet "Mental disorders" (September 2025):
// in 2021 nearly 1 in 7 people (1.1 billion) were living with a mental disorder; anxiety disorders 359 million
// (2021); depression 332 million (2021, WHO "Depression" fact sheet of 2025; the older figure of 280 million was
// for 2019); more than 75% of people in low- and middle-income countries receive no treatment (WHO mhGAP and
// earlier fact sheets); a median of 13 mental health workers per 100,000 people (Mental Health Atlas 2024,
// WHO news release of 2 September 2025).
const MY_WORLD = { oneIn: 7, billion: 1.1, anxiety: 359, depression: 332, untreated: 75, workers: 13 };
// Crisis lines, typed in from the services' own pages and re-checked by the reviewer in November 2026:
// 988 (United States: 988lifeline.org, samhsa.gov: call, text or chat; Canada: 988.ca, canada.ca: call or text),
// Samaritans 116 123 (United Kingdom: samaritans.org; Republic of Ireland: samaritans.org/samaritans-ireland and
// www2.hse.ie), Lifeline 13 11 14 (Australia: lifeline.org.au, healthdirect.gov.au).
const MY_LINES = ['988', '116 123', '13 11 14'];
const POINTERS = [/\*\*988\*\* \(call or text\) in the United States and Canada/, /Samaritans on \*\*116 123\*\* in the United Kingdom and Ireland/, /Lifeline on \*\*13 11 14\*\* in Australia/, /findahelpline\.com/];
/** Play a dialogue: the state its widget would report for these picks. */
function talk(widget, picks) {
  const chosen = picks.map((id, i) => widget.turns[i].options.find((o) => o.id === id));
  const good = chosen.filter((o) => o && o.good).length;
  const done = picks.length >= widget.turns.length;
  return { picks, turn: picks.length, done, good, allGood: done && good === widget.turns.length };
}
/** Every way through a dialogue, as lists of option ids. */
function everyPath(widget) {
  let paths = [[]];
  for (const turn of widget.turns) paths = paths.flatMap((p) => turn.options.map((o) => [...p, o.id]));
  return paths;
}
function checkDialogue(step, { minTurns }) {
  const w = step.widget;
  assert.equal(w.type, 'dialogue');
  assert.ok(w.turns.length >= minTurns);
  const places = [];
  for (const turn of w.turns) {
    assert.equal(turn.options.filter((o) => o.good).length, 1, 'one good reply at each turn');
    assert.equal(turn.options.length, 3);
    places.push(turn.options.findIndex((o) => o.good));
    for (const o of turn.options) { assert.ok(o.reply && o.note && o.text, `${o.id} has a reply and a note`); assert.ok(o.note.length <= 90, `${o.id}: the note fits its pill`); }
  }
  assert.ok(new Set(places).size >= 2, `the good reply is not always in the same place (${places})`);
  let passes = 0;
  for (const path of everyPath(w)) {
    const res = step.check(talk(w, path));
    const allGood = path.every((id, i) => w.turns[i].options.find((o) => o.id === id).good);
    assert.equal(res === true, allGood, path.join(' → '));
    if (res === true) passes++; else assert.equal(typeof res, 'string');
    // an unfinished conversation is never accepted
    assert.match(step.check(talk(w, path.slice(0, -1))), new RegExp(`${path.length - 1} of ${w.turns.length} replies`));
  }
  assert.equal(passes, 1);
  assert.equal(step.check(talk(w, step.solution.picks)), true);
}

test('lesson 6: how common, and what the numbers mean for a group of people', () => {
  assert.deepEqual(H.WORLD, { oneIn: MY_WORLD.oneIn, totalBillion: MY_WORLD.billion, year: 2021, anxietyMillion: MY_WORLD.anxiety, depressionMillion: MY_WORLD.depression, untreatedLmicPct: MY_WORLD.untreated, workersPer100k: MY_WORLD.workers });
  // 1.1 billion of about 7.9 billion people in 2021 is close to 1 in 7
  near(7.9 / MY_WORLD.billion, MY_WORLD.oneIn, 0.3);
  const hook = one('mental-health', 'hook');
  assert.equal(hook.widget.rows * hook.widget.cols, 100);
  const expected = Math.round(100 / MY_WORLD.oneIn);
  assert.equal(expected, 14);
  for (let n = 0; n <= 100; n++) assert.equal(hook.check({ on: Array.from({ length: n }, (_, i) => i) }), Math.abs(n - expected) <= 3, `${n} circles`);
  assert.equal(hook.solution.on.length, 14);
  assert.match(flat(hook.explain), /About \*\*14\*\*.*nearly \*\*1 person in 7\*\* worldwide, more than a billion people/);
  assert.equal(hook.mode, 'predict');

  eachVariant('mental-health', 'count', (step) => {
    const text = flat(step.text);
    const [inN] = grab(/about \*\*1 person in (\d+)\*\*/, text).map(Number);
    assert.equal(inN, MY_WORLD.oneIn);
    const n = Number(grab(/\*\*([\d,]+)\*\* (?:people|pupils and staff|employees)/, text)[0].replace(/,/g, ''));
    // deal the people out into groups of seven and count the groups
    let groups = 0;
    for (let left = n; left >= inN; left -= inN) groups++;
    assert.equal(groups * inN, n, 'the group divides evenly');
    assert.equal(step.answer, groups);
    assert.equal(step.unit, 'people');
    assert.ok(flat(step.explain).includes(`÷ ${inN} = **${groups.toLocaleString('en-US')}** people`));
    near(step.wrong[0][0], n * inN);
  });
});

test('lesson 6: a hard time or something more; depression, anxiety and other conditions', () => {
  const sort = one('mental-health', 'ordinary-or-ask');
  assert.deepEqual(sort.buckets, ['An ordinary reaction', 'Worth talking to a doctor']);
  // own reading: it has lasted a month or more AND daily life has shrunk
  const worthAsking = (text) => /for a month|for six months|this term/.test(text);
  for (const item of sort.items) assert.equal(item.bucket, worthAsking(item.text) ? 1 : 0, item.text);
  assert.equal(sort.items.filter((i) => i.bucket === 1).length, 3);
  assert.match(flat(sort.explain), /\*\*how long\*\*.*\*\*how strong\*\*.*\*\*how much does it get in the way\*\*/);
  assert.match(flat(one('mental-health', 'three-questions').text), /Only a trained professional/);

  const dep = one('mental-health', 'depression');
  assert.match(flat(dep.text), /at least \*\*two weeks\*\*/);
  assert.equal(H.DEPRESSION.weeks, 2);
  assert.deepEqual(dep.options.map((o) => !!o.correct), [true, true, true, true, false, false]);
  assert.match(dep.options[4].text, /weak character/);
  // not a self-test: no count of signs, no threshold, and it says what to do instead
  const depAll = flat(dep.text + ' ' + dep.explain + ' ' + dep.options.map((o) => `${o.text} ${o.why || ''}`).join(' '));
  assert.ok(!/\b(five|5|four|4|three|3) (or more )?(of these|signs|symptoms)|you (may |might |probably )?have|score|tick|count how many/i.test(depAll), 'no scoring and no verdict');
  assert.match(flat(dep.explain), /cannot diagnose anyone.*talk it over with a doctor/);
  assert.match(flat(one('mental-health', 'anxiety').explain), /respond well to treatment/);
  assert.ok(!/above all/.test(flat(one('mental-health', 'anxiety').explain)), 'therapy is not ranked above medicine');

  const anx = Object.fromEntries(one('mental-health', 'anxiety').pairs);
  assert.match(anx['Generalised anxiety'], /many things.*for months/);
  assert.match(anx['Panic disorder'], /Sudden surges of intense fear/);
  assert.match(anx['Social anxiety'], /being judged/);
  assert.match(anx['A phobia'], /one thing/);

  const mine = {
    'Bipolar disorder': /depression, and episodes of unusually high mood/,
    Schizophrenia: /psychosis/,
    'Post-traumatic stress disorder': /After a terrifying event/,
    ADHD: /attention, restlessness.*impulse/,
    'An eating disorder': /Eating and thoughts about food/,
    'Obsessive-compulsive disorder': /Unwanted, distressing thoughts, and rituals/,
  };
  const names = new Set();
  eachVariant('mental-health', 'conditions', (step) => {
    assert.equal(step.pairs.length, 4);
    assert.equal(new Set(step.pairs.map((p) => p[0])).size, 4);
    for (const [name, gist] of step.pairs) { assert.ok(mine[name], name); assert.match(gist, mine[name]); assert.ok(gist.length <= 75, `${name}: fits on a phone`); names.add(name); }
  });
  assert.equal(names.size, 6);
  // nothing in the eating-disorder line that could act as a tip: no numbers, no methods
  assert.ok(!/\d|calorie|weigh|kg|purg|vomit|laxative|fast/i.test(H.CONDITIONS.find((c) => /eating/.test(c.name)).gist));
});

test('lesson 6: causes, treatments, the treatment gap and words', () => {
  const causes = one('mental-health', 'causes');
  assert.match(correctText(causes), /too simple: the causes are a mix of biology, experience and circumstances/);
  assert.ok(causes.options.some((o) => /2022 review/.test(o.why || '')));
  assert.ok(causes.options.some((o) => /antidepressant medicines help many people/.test(o.why || '')));
  const works = one('mental-health', 'what-works');
  assert.deepEqual(works.options.map((o) => !!o.correct), [true, true, true, false, false]);
  assert.match(flat(works.explain), /can take more than one attempt/);
  assert.match(flat(works.explain), /\*\*most people get better\*\*/);
  const gap = one('mental-health', 'treatment-gap');
  for (let v = 0; v <= 100; v += 5) assert.equal(gap.check({ values: [[v]] }), v >= 70, `${v}%`);
  assert.ok(flat(gap.explain).includes(`**More than ${MY_WORLD.untreated}%**`) && flat(gap.explain).includes(`about ${MY_WORLD.workers} mental health workers for every 100,000 people`));
  assert.ok(gap.solution.values[0][0] >= MY_WORLD.untreated);
  assert.notEqual(gap.widget.data[0].value, 75, 'the bar does not start on the answer');

  const words = one('mental-health', 'words');
  assert.deepEqual(words.buckets, ['Respectful', 'Better avoided']);
  const avoid = /^a schizophrenic$|committed suicide|so OCD|^the mentally ill$/;
  for (const item of words.items) assert.equal(item.bucket, avoid.test(item.text) ? 1 : 0, item.text);
  assert.equal(words.items.filter((i) => i.bucket === 0).length, 4);
  for (const item of words.items) if (item.bucket === 1) assert.ok(item.why && item.why.length > 30, `${item.text} says why`);

  checkDialogue(one('mental-health', 'help-talk'), { minTurns: 3 });
  assert.match(flat(one('mental-health', 'help-talk').explain), /\*\*family doctor\*\*/);
});

test('lesson 6 is sober throughout, and its step on suicide follows safe-messaging rules', () => {
  assert.equal(lessons['mental-health'].tone, 'sober');
  for (const step of lessons['mental-health'].steps) assert.equal(step.tone, 'sober', `mental-health/${step.id}`);
  const crisis = one('mental-health', 'crisis');
  const text = flat(crisis.text);
  // what to do, in the order of the guidance (NIMH "5 action steps"; NHS; Samaritans): ask, listen, keep safe, connect
  const order = ['Ask directly', 'Listen, and take it seriously', 'stay with them', 'call your local emergency number', 'Help them reach support'].map((p) => text.indexOf(p));
  assert.ok(order.every((at) => at >= 0), 'all four actions are there');
  assert.deepEqual(order.slice().sort((a, b) => a - b), order, 'in order');
  assert.match(text, /Asking does not plant the idea/);
  // the fifth of NIMH's steps: follow up
  assert.match(text, /Help them reach support\*\*: a crisis line, a doctor, someone they trust\. Then stay in touch\./);
  // the lines are offered to the reader too, without asking anything about them
  assert.match(text, /These lines are for anyone, including you\./);
  // exactly three numbers are printed, each next to its country: nothing that could be dialled in the wrong place
  assert.deepEqual((text.match(/\*\*[\d ]+\*\*/g) || []).map((m) => m.replace(/\*/g, '')), MY_LINES);
  // hope and recovery
  assert.match(text, /It is \*\*not\*\* a sign that things cannot get better: with support, most people come through/);
  // the pointers, with the numbers typed in above
  for (const re of POINTERS) assert.match(text, re);
  for (const number of MY_LINES) assert.ok(text.includes(`**${number}**`), number);
  assert.deepEqual(H.CRISIS_LINES.map((l) => l.number), MY_LINES);
  // nothing that describes a method, gives detail or figures, or presents it as a way out or as common
  assert.ok(!/\b(methods?|overdos\w*|pills?|hang\w*|jump\w*|guns?|weapons?|rope|bridge|poison\w*|cut(s|ting)?|way out|solution|end the pain|epidemic|more and more|increasing|rates?|\d+ (people|deaths))\b/i.test(text), 'no method, detail, statistics or framing as a solution');
  assert.ok(!/commit/i.test(text));
  assert.equal(lessons['mental-health'].steps.filter((s) => /suicid/i.test(visible(resolveStep(s, makeRng(1), s.id)).join(' '))).map((s) => s.id).join(), 'words,crisis', 'suicide is named in the step on words and in the one step about it');
  // the recap names each number with its country (a bare number is useless, or wrong, somewhere else)
  assert.match(lessons['mental-health'].recap.join(' '), /988 in the United States and Canada, 116 123 in the United Kingdom and Ireland, 13 11 14 in Australia; findahelpline\.com/);
  assert.match(lessons['mental-health'].recap.join(' '), /most people get better/);
});

/* ====================================================================== lesson 7: connection */

test('lesson 7: loneliness, social ties and the long studies', () => {
  // WHO Commission on Social Connection, June 2025: about 1 in 6 people; an estimated 871,000 deaths a year.
  assert.deepEqual(H.LONELY, { oneIn: 6, deathsPerYear: 871000 });
  // Holt-Lunstad, Smith & Layton, PLoS Medicine 2010: 148 studies, 308,849 people, 7.5 years, odds ratio 1.50.
  assert.deepEqual(H.TIES, { studies: 148, people: 309000, years: 7.5, survivalPct: 50 });
  near(H.TIES.people, 308849, 500);
  // Holt-Lunstad et al., Perspectives on Psychological Science 2015: loneliness 26%, isolation 29%, living alone 32%.
  assert.deepEqual(H.TIE_RISKS.map((r) => r.pct), [26, 29, 32]);
  assert.match(H.TIE_RISKS[0].what, /lonely/); assert.match(H.TIE_RISKS[1].what, /isolated/); assert.match(H.TIE_RISKS[2].what, /live alone/);
  // Harvard Study of Adult Development: 268 students and 456 Boston boys, from 1938.
  assert.deepEqual(H.HARVARD, { started: 1938, students: 268, boys: 456, total: 724 });
  assert.equal(268 + 456, 724);

  const hook = one('connection', 'hook');
  assert.equal(hook.widget.rows * hook.widget.cols, 60);
  for (let n = 0; n <= 60; n++) assert.equal(hook.check({ on: Array.from({ length: n }, (_, i) => i) }), Math.abs(n - 60 / 6) <= 2, `${n} circles`);
  assert.match(flat(hook.explain), /About \*\*10\*\*.*\*\*1 person in 6\*\*/);
  const survival = one('connection', 'survival');
  assert.equal(survival.answer, 50);
  assert.match(flat(survival.text), /pooled 148 studies that had followed about 309,000 people for 7\.5 years/);
  assert.match(flat(survival.explain), /they do not run experiments/);
  assert.match(correctText(one('connection', 'harvard')), /satisfied they were with their relationships/);
  assert.match(flat(one('connection', 'harvard').text), /Since 1938, researchers in Boston have followed 724 men/);

  const sort = one('connection', 'lonely-or-alone');
  // own reading: lonely if the person misses contact, whatever the head count
  const lonely = (text) => /nobody really knows her|aches for company|nobody to call/.test(text);
  for (const item of sort.items) assert.equal(item.bucket, lonely(item.text) ? 0 : 1, item.text);
  assert.equal(sort.items.filter((i) => i.bucket === 0).length, 3);
});

test('lesson 7: "26% more likely" as people in a thousand', () => {
  const kinds = new Set();
  eachVariant('connection', 'risk', (step) => {
    const text = flat(step.text);
    const [what, pct] = grab(/people who (.+?) were about \*\*(\d+)% more likely\*\* to die/, text);
    const [group, base] = grab(/Picture ([\d,]+) older adults .*of whom \*\*(\d+)\*\* die during a study/, text).map((v) => Number(v.replace(/,/g, '')));
    // one in ten dies: at that level an odds ratio of 1.26 to 1.32 (what the paper pooled) and "26 to 32% more
    // likely" differ by no more than a few deaths in a thousand; at 40% they would differ by almost fifty
    assert.equal(base * 10, group);
    const odds = (base / group) / (1 - base / group) * (1 + Number(pct) / 100);
    assert.ok(Math.abs(group * odds / (1 + odds) - base * (1 + Number(pct) / 100)) <= 0.005 * group, 'the simple reading stays close to the odds-ratio reading');
    const mine = { 'feel lonely': 26, 'are socially isolated': 29, 'live alone': 32 };
    assert.equal(Number(pct), mine[what], what);
    const predicted = base * (1 + Number(pct) / 100);
    near(step.answer, predicted, 1e-9);
    assert.ok(Number.isInteger(step.answer));
    assert.equal(step.unit, 'deaths');
    assert.equal(step.tone, 'sober');
    assert.ok(flat(step.explain).includes(`${pct}% of ${base} is ${predicted - base}, so about ${base} + ${predicted - base} = **${predicted}** in ${group.toLocaleString('en-US')}, against ${base} in ${group.toLocaleString('en-US')}`));
    near(step.wrong[0][0], predicted - base, 1e-9);
    near(step.wrong[1][0], base + Number(pct));
    assert.notEqual(base, 100, 'with 100 deaths, adding the percentage as a number would happen to give the right answer');
    // the comparison group in the question is the opposite of the group asked about
    if (what === 'feel lonely') assert.match(text, /[2-5],000 older adults who do not feel lonely.*[2-5],000 similar adults who feel lonely/);
    assert.equal(grab(/Among ([\d,]+) similar adults/, text)[0].replace(/,/g, ''), String(group), 'both groups are the same size');
    if (what === 'live alone') assert.match(text, /who live with others.*who live alone/);
    kinds.add(what);
  });
  assert.equal(kinds.size, 3);
});

test('lesson 7: the two conversations, the replies that open or shut the door, and the crisis step', () => {
  checkDialogue(one('connection', 'listen'), { minTurns: 3 });
  checkDialogue(one('connection', 'limits'), { minTurns: 2 });
  assert.match(flat(one('connection', 'listen').explain), /\*\*listened\*\*.*\*\*did not try to fix\*\*.*\*\*asked\*\*.*\*\*promised to stay in touch\*\*/);

  const shuts = (text) => /At least|much worse|think positive|exactly how you feel|Have you tried|Cheer up/.test(text);
  for (const l of H.SUPPORT_LINES) assert.equal(l.opens, !shuts(l.text), l.text);
  eachVariant('connection', 'opens-or-shuts', (step) => {
    assert.deepEqual(step.buckets, ['Opens the door', 'Shuts it']);
    assert.equal(step.items.length, 6);
    assert.equal(new Set(step.items.map((i) => i.text)).size, 6);
    for (const item of step.items) { assert.equal(item.bucket, shuts(item.text) ? 1 : 0, item.text); if (item.bucket === 1) assert.ok(item.why.length > 30); }
    assert.equal(step.items.filter((i) => i.bucket === 0).length, 3);
  });

  const crisis = one('connection', 'crisis');
  assert.equal(crisis.tone, 'sober');
  assert.match(correctText(crisis), /Take it seriously, ask him directly, stay with him, and get help/);
  const all = flat(crisis.text + ' ' + crisis.explain + ' ' + crisis.options.map((o) => `${o.text} ${o.why || ''}`).join(' '));
  for (const re of POINTERS) assert.match(flat(crisis.explain), re);
  assert.match(flat(crisis.explain), /local emergency number/);
  assert.match(flat(crisis.explain), /People come through times like this, and help works/);
  assert.ok(!/\b(methods?|overdos\w*|pills?|hang\w*|jump\w*|guns?|weapons?|rope|poison\w*|way out|commit\w*)\b/i.test(all));
  assert.match(correctText(one('connection', 'screens')), /a small link, with big differences/);
  const pathways = one('connection', 'pathways');
  assert.equal(pathways.pairs.length, 4);
});

test('lesson 7: what else helps, the toolkit and the hand-over to the next course', () => {
  const fill = one('connection', 'what-else');
  assert.deepEqual([...fill.template.matchAll(/\[\[[^\]]*\*([^|\]]+)/g)].map((m) => m[1]), ['120', 'shows a link, not proof of cause', 'small']);
  assert.equal(H.NATURE.minutes, 120);        // White et al., Scientific Reports 2019
  // own table: which lesson's tool answers which situation
  const mine = [
    [/coffee at 17:00/, /caffeine/], [/flight east/, /daylight/], [/Heart pounding/, /Slow breaths/], [/unanswered message/, /fact, or a guess/],
    [/afraid of the lift/, /small steps/], [/felt flat for two months/, /Ask, listen, and suggest a doctor/], [/sleeping until noon/, /steady getting-up time/],
  ];
  assert.equal(H.TOOLKIT.length, mine.length);
  const seen = new Set();
  eachVariant('connection', 'toolkit', (step) => {
    assert.equal(step.pairs.length, 4);
    for (const [situation, tool] of step.pairs) {
      const hit = mine.find(([re]) => re.test(situation));
      assert.ok(hit, situation);
      assert.match(tool, hit[1]);
      // no other tool on the screen answers this situation as well
      assert.equal(step.pairs.filter((p) => hit[1].test(p[1])).length, 1);
      seen.add(situation);
    }
    assert.match(step.explain, /\(Lesson \d\)/);
  });
  assert.equal(seen.size, 7);
  const last = lessons.connection;
  assert.match(last.next, /Staying Well/);
  assert.match(last.recap.join(' '), /emergency number or a crisis line/);
  assert.equal(last.steps[last.steps.length - 1].type, 'info');
});

/* ====================================================================== safety and care */

const DISCLAIMER = '> **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.';

test('the standard disclaimer appears exactly once, word for word, on the first or second step of the first lesson', () => {
  let count = 0;
  everyStep((id, step) => {
    const s = resolveStep(step, makeRng(1), step.id);
    const has = flat(s.text).includes(flat(DISCLAIMER));
    if (has) {
      count++;
      assert.equal(id, LESSONS[0]);
      assert.ok(step.index <= 1, 'on the first or second step');
    } else {
      assert.ok(!/A note before we start/.test(visible(s).join(' ')), `${id}/${step.id}: no second copy`);
    }
  });
  assert.equal(count, 1);
});

test('no step asks for the learner\'s own health data, diagnoses the learner, or uses stigmatising words', () => {
  const asks = /\b(enter|type in|record|log|write down|rate|score) your (own )?(weight|height|age|sleep|hours|mood|symptoms?|blood pressure|pulse|heart rate|stress|anxiety|caffeine|intake|medic)/i;
  const own = /\b(your weight|your height|your bmi|your blood pressure|your medication|your medicines|your diagnosis|your symptoms|how many hours do you sleep|how much do you sleep|how stressed are you|how anxious are you|how depressed|do you have (depression|anxiety|insomnia)|you (probably |may )?have (depression|an anxiety disorder|insomnia|a mental))/i;
  const stigma = /\b(commit(ted|s)? suicide|successful suicide|failed suicide|the mentally ill|a schizophrenic|schizophrenics|an anorexic|a depressive|lunatic|psycho\b|maniac|nutter|addicts?\b|the obese|normal people)\b/i;
  everyStep((id, step) => {
    for (let k = 0; k < 40; k++) {
      const s = resolveStep(step, makeRng(31 + k * 17), step.id);
      const words = visible(s).join(' \n ');
      assert.ok(!asks.test(words), `${id}/${step.id} asks for the learner's own data: ${asks.exec(words)}`);
      assert.ok(!own.test(words), `${id}/${step.id}: ${own.exec(words)}`);
      // phrases that the lesson on words quotes as examples to avoid are allowed only in that step
      if (!(id === 'mental-health' && step.id === 'words')) assert.ok(!stigma.test(words), `${id}/${step.id}: ${stigma.exec(words)}`);
      if (!step.gen) break;
    }
  });
});

test('every step that mentions suicide or self-harm is sober, and its lesson carries the help pointers', () => {
  const topic = /suicid|self-harm|hurt themselves|ending their life|end (his|her|their) (own )?life|not want(ing)? to (be alive|live)|cannot see the point of going on/i;
  let found = 0;
  everyStep((id, step) => {
    for (let k = 0; k < 20; k++) {
      const s = resolveStep(step, makeRng(11 + k * 29), step.id);
      const words = visible(s).join(' \n ');
      if (topic.test(words)) {
        found++;
        assert.equal(step.tone, 'sober', `${id}/${step.id} mentions suicide or self-harm and must be tone: 'sober'`);
        const whole = lessons[id].steps.map((st) => visible(resolveStep(st, makeRng(1), st.id)).join(' ')).join(' ');
        for (const number of ['988', '116 123', '13 11 14']) assert.ok(whole.includes(number), `${id}: the lesson gives ${number}`);
        assert.ok(/findahelpline\.com/.test(whole) && /emergency number/.test(whole), `${id}: directory and emergency number`);
        assert.ok(!/commit(ted|s)? suicide/i.test(words) || step.id === 'words');
      }
      if (!step.gen) break;
    }
  });
  assert.ok(found >= 3);
  // steps about death are sober too
  everyStep((id, step) => {
    const s = resolveStep(step, makeRng(1), step.id);
    if (/\b(deaths?|to die|died|death rate)\b/i.test(visible(s).join(' ')) && s.type !== 'info' && !/words/.test(step.id)) assert.equal(step.tone, 'sober', `${id}/${step.id} is about deaths`);
  });
  // the two predictions about who lives and who dies (Whitehall, social ties) are sober as well
  assert.equal(raw('stress', 'control').tone, 'sober');
  assert.equal(raw('connection', 'survival').tone, 'sober');
  // no explanation or text starts a line with "20." and the like, which the Markdown would turn into a numbered list
  everyStep((id, step) => {
    const s = resolveStep(step, makeRng(1), step.id);
    for (const field of [s.text, s.explain]) for (const line of String(field || '').split('\n')) assert.ok(!/^\s*\d+[.)] /.test(line), `${id}/${step.id}: a line starts with a number and a full stop: "${line.trim()}"`);
  });
});

test('every body-map step uses structures that exist, and every photo has a manifest entry with a licence and a credit', async () => {
  const body = await import('../src/widgets/body-map.js');
  const known = new Set([...body.structureIds(), ...body.anchorIds()]);
  let maps = 0;
  const manifestFile = fileURLToPath(new URL(`../content/media/${COURSE}/manifest.json`, import.meta.url));
  const manifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : { images: {} };
  const bySrc = new Map(Object.values(manifest.images).map((e) => [e.file, e]));
  const used = new Set();
  everyStep((id, step) => {
    const s = resolveStep(step, makeRng(1), step.id);
    for (const spec of specsOf(s)) {
      if (spec.type === 'body-map') {
        maps++;
        assert.ok(body.viewNames ? true : true);
        const ids = [];
        for (const key of ['show', 'hide', 'ghost', 'pickable', 'focus']) if (Array.isArray(spec[key])) ids.push(...spec[key]);
        if (spec.answer) ids.push(...[].concat(spec.answer));
        if (spec.notes) ids.push(...Object.keys(spec.notes));
        if (Array.isArray(spec.labels)) for (const l of spec.labels) ids.push(typeof l === 'string' ? l : l.id);
        for (const g of spec.groups || []) ids.push(...[].concat(g.ids));
        for (const raw of ids.filter(Boolean)) {
          const expanded = body.expandIds([raw]);
          assert.ok(expanded.length >= 1 && expanded.every((x) => known.has(x)), `${id}/${step.id}: body-map id "${raw}"`);
        }
        assert.ok(spec.alt && spec.alt.length > 30, `${id}/${step.id}: alt text`);
      }
      if (spec.type === 'photo') {
        const file = spec.src.split('/').pop().split('?')[0];
        const entry = bySrc.get(file);
        assert.ok(entry, `${id}/${step.id}: ${file} is in the manifest`);
        assert.ok(spec.src.includes(`/media/${COURSE}/`), 'a picture of this course');
        assert.ok(entry.license, `${entry.id}: licence`);
        assert.ok(entry.author || entry.credit, `${entry.id}: credit`);
        assert.ok(entry.sourceUrl && entry.sourceUrl.startsWith('https://commons.wikimedia.org/'), `${entry.id}: source`);
        assert.ok(spec.alt && spec.alt.length >= 40 && !/^(a |an |the )?(photo|image|picture)/i.test(spec.alt), `${id}/${step.id}: alt text describes the picture`);
        assert.ok(/picture|plant|leaves|animal|jellyfish/i.test(s.text), `${id}/${step.id}: the step refers to its picture`);
        used.add(entry.id);
      }
    }
  });
  assert.ok(maps >= 2, 'the body diagram is used');
  assert.deepEqual(Object.keys(manifest.images).filter((x) => !used.has(x)), [], 'pictures in the manifest that no lesson uses');
  // pic('id', …) quietly leaves a figure out when the picture is missing: make sure none is
  const asked = new Set();
  for (const lid of Object.keys(lessons)) {
    const source = readFileSync(fileURLToPath(new URL(`../content/courses/${COURSE}/lessons/${lid}.js`, import.meta.url)), 'utf8');
    for (const m of source.matchAll(/\bpic\('([a-z0-9-]+)'/g)) asked.add(m[1]);
  }
  assert.deepEqual([...asked].sort(), [...used].sort(), 'every picture asked for is shown');
});

/* ====================================================================== teach before you ask */

/**
 * The teaching screens added so that nothing is asked before it has been shown (docs/AUTHORING.md, "Teach before
 * you ask"): [the screen, the steps it must stand in front of, what those steps need to find on it].
 */
const TEACHING = {
  'why-sleep': [
    ['teach-stages', ['name-stages', 'halves', 'hypno-read', 'truths'], [/non-REM/, /rapid eye movement/, /sleep cycle/, /five in its eight hours/, /Dreams can come in any stage/, /Brief awakenings are part of every normal night/]],
    ['teach-what-for', ['what-for', 'truths'], [/replayed and filed/, /growth hormone is released in deep sleep/, /fewer antibodies/, /wash waste out of the brain/, /what dreams are for/, /test results keep getting worse/]],
    ['teach-sleep-need', ['sleep-need', 'truths'], [/the same at 30 and at 70/, /Older adults have less deep sleep and wake more often/, /8 − 6½ = \*\*1½ hours\*\* short/]],
    ['teach-sleep-signs', ['jellyfish'], [/goes \*\*quiet\*\*/, /\*\*reacts more slowly\*\*/, /\*\*catches up\*\*/]],
  ],
  'body-clock': [
    ['teach-master-clock', ['reset-signal', 'light-rule'], [/\*\*master clock\*\*/, /\*\*hypothalamus\*\*/, /cells in the retina/, /how bright the world is/]],
    ['teach-light-rule', ['light-rule', 'jet-east', 'sort'], [/\*\*before\*\* the low point.*\*\*later\*\*/s, /\*\*after\*\* the low point.*\*\*earlier\*\*/s, /afternoon, light hardly moves it/, /\*\*melatonin\*\*/]],
    ['teach-jet-lag', ['body-time', 'jet-east', 'jet-days'], [/\*\*jet lag\*\*/, /Fly \*\*east\*\*, and the local clocks are \*\*ahead\*\*/, /Fly \*\*west\*\*, and they are \*\*behind\*\*/, /4 hours earlier: it shows \*\*04:00\*\*/]],
    ['teach-shift-work', ['shift-work'], [/stay half-adjusted/, /sleep problems, accidents, type 2 diabetes and heart disease/, /"probably" cancer-causing/, /evidence is limited/]],
  ],
  'better-sleep': [
    ['teach-two-curves', ['all-nighter', 'two-processes', 'lie-in', 'nap', 'which-process'], [/\*\*Sleep pressure\*\*.*builds up for every hour awake and drains away during sleep/s, /\*\*alerting signal\*\*/, /strongest in the early evening and weakest shortly before dawn/, /a model of an ordinary day/, /model's own scale of 0 to 100, which is not a measurement/]],
    ['teach-habits', ['habits', 'insomnia'], [/regular hours/, /morning light/, /cool, dark and quiet/, /second half of the night is broken and short of REM sleep/, /2023 Cochrane review found no clear benefit/, /guess at sleep stages from movement and pulse/]],
    ['teach-insomnia', ['insomnia', 'red-flags'], [/at least 3 nights a week, for 3 months or more/, /\*\*insomnia\*\*/, /CBT-I/, /Sleeping pills.*second choice, for short periods/s]],
    ['teach-apnoea', ['red-flags', 'cpap'], [/loud snoring with pauses in breathing/, /\*\*sleep apnoea\*\*/, /airway keeps closing during sleep/, /by keeping the airway open/, /nodding off at the wheel/]],
  ],
  stress: [
    ['teach-adrenals', ['adrenal-pick', 'timeline', 'chain'], [/\*\*adrenaline\*\* and \*\*cortisol\*\*/, /\*\*adrenal glands\*\*/, /caps on top of the kidneys/]],
    ['teach-two-routes', ['chain'], [/\*\*amygdala\*\*.*flags a threat/s, /\*\*hypothalamus\*\* switches on the alarm/s, /nerve route.*Within seconds/s, /hormone route.*\*\*pituitary gland\*\*/s]],
    ['teach-long-haul', ['sprint-or-marathon', 'chronic'], [/\*\*short-term \(acute\) stress\*\*/, /\*\*long-term \(chronic\) stress\*\*/, /disturbs sleep/, /keeps blood pressure up/, /more likely to develop a cold/, /wears on mood/, /raised risks, not certainties/, /in the graph, a simple model,/]],
  ],
  'emotions-mind': [
    ['teach-emotions', ['emotions'], [/\*\*Fear\*\* \| danger/, /\*\*Anger\*\* \| a wrong, or an obstacle/, /\*\*Sadness\*\* \| a loss/, /\*\*Disgust\*\* \| something harmful/]],
    ['teach-traps', ['traps', 'which-trap'], [/\*\*thinking traps\*\*/]],
    ['teach-naming', ['naming'], [/putting a feeling into\s+words/, /turn the alarm down a little/, /\*\*amygdala\*\*/]],
    ['teach-mindfulness', ['mindfulness'], [/paying attention to the present moment, on purpose, without judging it/, /47 trials/, /small to moderate amount/, /Not better/, /85 British schools \(2022\)/]],
  ],
  'mental-health': [
    ['teach-how-common', ['count', 'ordinary-or-ask'], [/\*\*1 in 7\*\* means one out of every 7 people/, /35 ÷ 7 = 5/, /invisible from outside/, /treatable/]],
    ['teach-depression', ['depression'], [/loss of interest or pleasure in things once enjoyed/, /at least \*\*two weeks\*\*/, /sleep, appetite, energy, concentration/, /worthless, or guilty without cause/, /not a flaw/, /cheerful front/, /responds to treatment/]],
    ['teach-anxiety', ['anxiety'], [/\*\*anxiety disorder\*\*/, /panic attack.*it passes/s, /respond well to treatment/]],
    ['teach-conditions', ['conditions'], [/One line cannot hold a condition, and no two people with the same diagnosis are alike/, /all can be treated or managed/]],
    ['teach-what-works', ['what-works', 'help-talk'], [/\*\*talking therapies\*\*, such as CBT/, /\*\*medicines\*\* prescribed by a doctor/, /\*\*regular physical activity\*\*, alongside other help/, /worked out with a professional/]],
  ],
  connection: [
    ['teach-lonely', ['lonely-or-alone', 'risk'], [/\*\*Loneliness\*\* is a feeling: the gap between the contact a person has and the contact they want/, /\*\*Social isolation\*\* is a fact/, /not the head count/]],
    ['teach-pathways', ['pathways', 'harvard'], [/\*\*A calmer stress system\.\*\*/, /\*\*Better habits\.\*\*/, /\*\*Practical help\.\*\*/, /\*\*A reason to keep going\.\*\*/]],
    ['teach-support', ['listen', 'opens-or-shuts', 'limits'], [/\*\*Listen\*\* before anything else/, /\*\*Do not rush to fix\*\*/, /\*\*Ask\*\* what would help/, /\*\*Stay in touch\*\*/, /\*\*correct\*\* the feeling/, /\*\*compare\*\* it away/, /\*\*rush to fix\*\* it/s]],
    ['teach-what-else', ['screens', 'what-else'], [/explains very little of the difference in wellbeing/, /averages hide a lot/, /at least 120 minutes a week in nature/, /does not run an experiment/s, /small lift in wellbeing/]],
  ],
};

test('teach before you ask: every lesson teaches before its first graded step, on at least three screens, with at most two predictions', () => {
  assert.deepEqual(Object.keys(TEACHING), LESSONS);
  for (const [id, lesson] of Object.entries(lessons)) {
    // `graded` exists only on resolved steps
    const steps = lesson.steps.map((s) => resolveStep(s, makeRng(1), s.id));
    const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
    const roles = steps.map(role);
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: a teaching screen or an exploration comes before the first graded step (${steps[firstGraded].id})`);
    assert.ok(roles.filter((r) => r === 'teach').length >= 3, `${id}: at least three info steps`);
    // … and at least three of them are followed by something to answer (a closing screen teaches nothing that is then used)
    assert.ok(lesson.steps.filter((s) => s.teach).length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((r) => r === 'predict').length <= 2, `${id}: at most two predictions`);
    const at = (stepId) => { const i = lesson.steps.findIndex((s) => s.id === stepId); assert.ok(i >= 0, `${id}/${stepId} exists`); return i; };
    for (const [stepId, serves, needs] of TEACHING[id]) {
      const step = raw(id, stepId);
      assert.equal(step.type, 'info', `${id}/${stepId} is a teaching screen`);
      assert.ok(step.teach, `${id}/${stepId} is followed by something to answer`);
      assert.ok(flat(step.text).length > 150, `${id}/${stepId} teaches something`);
      for (const later of serves) assert.ok(at(stepId) < at(later), `${id}/${stepId} comes before ${later}`);
      for (const re of needs) assert.match(flat(step.text), re, `${id}/${stepId}`);
      for (const figure of [step.figure].flat().filter(Boolean)) assert.ok(figure.alt && figure.alt.length > 40, `${id}/${stepId}: the figure has alt text`);
    }
  }
});

test('teach before you ask: every table a question is drawn from is shown on a teaching screen first', () => {
  const text = (lesson, id) => flat(raw(lesson, id).text);
  // lesson 1: the four stages (the options of hypno-read, the pairs of name-stages) and the recommended amounts
  for (const st of ['N1', 'N2', 'N3', 'REM']) assert.ok(text('why-sleep', 'teach-stages').includes(`**${H.STAGES[st].short}**]{.${H.STAGES[st].color}} | ${H.STAGES[st].gist} |`), `${st} row`);
  assert.match(H.STAGES.N1.gist, /^Dozing off/); assert.match(H.STAGES.N2.gist, /^Light sleep: about half of the night/); assert.match(H.STAGES.N3.gist, /^Deep sleep: big, slow brain waves/); assert.match(H.STAGES.REM.gist, /Darting eyes.*vivid dreams.*large muscles switched off/);
  for (const [stage, description] of raw('why-sleep', 'name-stages').pairs) assert.ok(H.STAGES[stage].gist.toLowerCase().includes(description.split(/[:,]/)[0].toLowerCase()), `${stage}: "${description}" is what the teaching table says`);
  assert.equal(raw('why-sleep', 'teach-stages').figure.type, 'hypnogram');
  assert.equal(raw('why-sleep', 'teach-stages').figure.mode, 'static');
  assert.deepEqual(raw('why-sleep', 'teach-stages').figure.night, TYPICAL_NIGHT);
  assert.ok(text('why-sleep', 'teach-sleep-need').includes('| Children of 6 to 12 | 9 to 12 hours |'));
  assert.ok(text('why-sleep', 'teach-sleep-need').includes(`| Teenagers of 13 to 18 | ${FACTS.teenSleep[0]} to ${FACTS.teenSleep[1]} hours |`));
  assert.ok(text('why-sleep', 'teach-sleep-need').includes(`| Adults | ${FACTS.adultSleepMin} hours or more |`));
  // lesson 5: the three traps, each with an example that no question uses
  for (const key of Object.keys(H.TRAPS)) assert.ok(text('emotions-mind', 'teach-traps').includes(`**${H.TRAPS[key].name}**: ${H.TRAPS[key].gist}.`), `${key} is taught`);
  const asked = [...H.TRAP_THOUGHTS.map((t) => t.thought), ...raw('emotions-mind', 'traps').pairs.map((p) => p[1])];
  for (const m of text('emotions-mind', 'teach-traps').matchAll(/\*"([^"]+)"/g)) assert.ok(!asked.some((a) => a.includes(m[1]) || m[1].includes(a)), `the example "${m[1]}" is not itself a question`);
  assert.equal([...text('emotions-mind', 'teach-traps').matchAll(/\*"([^"]+)"/g)].length, 3);
  // lesson 6: the kinds of anxiety disorder and all six other conditions (the generated match shows four of them)
  for (const [kind, description] of raw('mental-health', 'anxiety').pairs) assert.ok(text('mental-health', 'teach-anxiety').includes(`| **${kind}** | ${description} |`), `${kind} row`);
  assert.equal(H.CONDITIONS.length, 6);
  for (const c of H.CONDITIONS) assert.ok(text('mental-health', 'teach-conditions').includes(`| **${c.name}** | ${c.gist} |`), `${c.name} row`);
  // lesson 7: every tool of the toolkit was taught in the lesson it names
  const whole = (lesson) => flat(`${lessons[lesson].steps.map((s) => visible(resolveStep(s, makeRng(1), s.id)).join(' ')).join(' ')} ${lessons[lesson].recap.join(' ')}`);
  const taught = { 2: /Daylight in the first hours after waking|daylight in the\s+first hour or two after you wake/, 3: /steady getting-up time/, 4: /long out-breaths/, 5: /Is that a fact, or a guess\?|manageable steps/, 6: /family doctor/ };
  for (const tool of H.TOOLKIT) assert.match(whole(LESSONS[tool.lesson - 1]), taught[tool.lesson], `${tool.tool} (Lesson ${tool.lesson})`);
  assert.match(whole('better-sleep'), /moving your last caffeine of the day a couple of hours earlier/);
});

test('teach before you ask: each worked example uses numbers that its generated question cannot produce', () => {
  // sleep-need: Lena wakes at 07:00; the generator's sleepers wake at 05:30, 06:00 or 06:30
  eachSeed('why-sleep', 'sleep-need', (s) => assert.ok(!/\*\*07:00\*\*/.test(flat(s.text)) && !/Lena/.test(s.text)));
  // cycles: the worked line is a night of 2 cycles; the generator asks for 3 to 6
  eachSeed('why-sleep', 'cycles', (s) => { assert.match(flat(s.text), /so 3 hours of sleep \(180 minutes\) would hold 2 cycles/); assert.ok(s.answer >= 3); });
  assert.equal(180 / FACTS.cycleMinutes, 2);
  // body-time and jet-days: the examples are 4 hours ahead; no flight in the table is
  assert.ok(H.FLIGHTS.every((f) => Math.abs(f.ahead) !== 4));
  assert.equal(8 - 4, 4);
  eachSeed('body-clock', 'jet-days', (s) => assert.match(flat(s.text), /Clocks that are ahead mean a flight east, so 4 hours ahead would take about 4 ÷ 1 = 4 days/));
  // drift: the exploration's own arithmetic is spelled out in its explanation
  assert.match(flat(one('body-clock', 'cave').explain), /0\.2 hours too long, which is 12 minutes, and 10 × 0\.2 = 2/);
  // caffeine: the half-life is defined, and a halving is worked, before the generated question
  assert.match(flat(one('better-sleep', 'caffeine-predict').explain), /\*\*half-life\*\*/);
  assert.match(flat(one('better-sleep', 'caffeine-move').explain), /From 100 mg to 25 mg takes two half-lives/);
  assert.ok(H.DRINKS.every((d) => d.mg !== 100), 'no generated drink starts at the 100 mg of the worked case');
  const order = (lesson, ...ids) => { const at = ids.map((id) => lessons[lesson].steps.findIndex((s) => s.id === id)); assert.deepEqual(at.slice().sort((a, b) => a - b), at, `${lesson}: ${ids.join(' → ')}`); assert.ok(at[0] >= 0); };
  order('better-sleep', 'caffeine-predict', 'caffeine-move', 'caffeine-left', 'which-process');
  // breath-rate: a breath of 15 seconds; the patterns in the table last 3 to 12 seconds
  assert.ok(H.BREATH_PATTERNS.every(([i, o]) => i + o !== 15));
  eachSeed('stress', 'breath-rate', (s) => assert.match(flat(s.text), /7 seconds in and 8 seconds out make one breath of 15 seconds, and 60 ÷ 15 = 4 breaths a minute/));
  assert.equal(60 / (7 + 8), 4);
  // count: 35 people; the generator's groups are 70 and more
  eachSeed('mental-health', 'count', (s) => assert.ok(!/\*\*35\*\*/.test(s.text)));
  // risk: 20% more than 50; the generator uses 26, 29 or 32% of 200 to 500
  eachSeed('connection', 'risk', (s) => assert.match(flat(s.text), /\(For example, 20% more than 50 would be 50 \+ 10 = 60\.\)/));
  assert.equal(50 * 1.2, 60);
  assert.ok(H.TIE_RISKS.every((r) => r.pct !== 20));
  // the order of discovery, rule and check where a simulator comes first
  order('why-sleep', 'read-night', 'teach-stages', 'name-stages');
  order('body-clock', 'light-shift', 'teach-light-rule', 'light-rule');
  order('stress', 'alarm-body', 'teach-adrenals', 'adrenal-pick', 'timeline', 'teach-two-routes', 'chain');
  order('stress', 'pile-up', 'teach-long-haul', 'sprint-or-marathon', 'chronic');
  order('emotions-mind', 'loop-explore', 'the-loop', 'teach-emotions', 'emotions', 'teach-traps', 'traps', 'which-trap');
  order('mental-health', 'three-questions', 'ordinary-or-ask', 'teach-depression', 'depression');
  order('connection', 'teach-support', 'listen', 'opens-or-shuts', 'limits', 'crisis');
  // one sentence in the prompt where one sentence was all that was missing
  assert.match(flat(one('mental-health', 'ordinary-or-ask').text), /how long, how strong, how much in the way\?/);
  assert.match(flat(one('mental-health', 'words').text), /put the \*\*person first\*\*.*keep diagnoses out of jokes.*carry no blame/);
  assert.match(flat(one('mental-health', 'help-talk').text), /an \*\*open question\*\*, \*\*listening\*\* without fixing or judging, and \*\*one small next step\*\*/);
  assert.match(flat(one('mental-health', 'causes').text), /Genes shift the odds\. So do hardship in childhood, long-lasting stress, loss, loneliness, physical illness, poverty and discrimination/);
  assert.match(flat(one('connection', 'limits').text), /may set a limit, kindly.*one support among several, not the whole net/);
  assert.match(flat(one('emotions-mind', 'evidence').text), /What counts as evidence is a fact about the thing itself: here, how Jomo drives/);
});

test('the new teaching screens keep the care rules: no verdict on the learner, no second mention of suicide, sober where the lesson is', () => {
  const scoring = /\b(five|5|four|4|three|3) (or more )?(of these|signs|symptoms)|you (may |might |probably )?have|score|tick|count how many|do you|have you|are you/i;
  for (const [id, list] of Object.entries(TEACHING)) for (const [stepId] of list) {
    const words = flat(raw(id, stepId).text);
    // (the lesson on sleep habits speaks of the "score" of a sleep tracker: the scoring words are checked where conditions are described)
    if (id === 'mental-health') assert.ok(!scoring.test(words), `${id}/${stepId}: ${scoring.exec(words)}`);
    assert.ok(!/\byou (may |might |probably )?have (depression|an anxiety|insomnia|sleep apnoea|a mental)|\b(your|my) (symptoms|diagnosis|mood|sleep)\b/i.test(words), `${id}/${stepId} says nothing about the learner's own health`);
    assert.ok(!/suicid|self-harm/i.test(words), `${id}/${stepId}`);
    assert.ok(!/\b(should|must|ought to) (take|start|stop|try|avoid)\b/i.test(words), `${id}/${stepId} gives no instruction about treatment`);
    assert.equal(raw(id, stepId).tone === 'sober', id === 'mental-health', `${id}/${stepId}: sober exactly in the lesson that is sober throughout`);
  }
  // the screen in front of the list of signs says what the list cannot do, and the list itself still says so
  assert.match(flat(raw('mental-health', 'three-questions').text), /They are not a test.*Only a trained professional.*No list on a\s+screen can/s);
  assert.match(flat(one('mental-health', 'depression').explain), /cannot diagnose anyone/);
});

/** Fingerprint of a piece of lesson text exactly as it is written in the lesson file. */
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
const wordsOf = (step) => ({ type: step.type, tone: step.tone || '', title: step.title, text: step.text, options: (step.options || []).map((o) => [o.text, !!o.correct, o.why || '']), explain: step.explain || '' });

test('the crisis steps, the help pointers and the telephone numbers are word for word what the specialist reviewer signed off', () => {
  // Fingerprints taken from the reviewed course before the teach-first revision. A change to any character of these
  // texts (a number, the name of a service, a country, the order of the advice) fails here: such a change needs the
  // numbers verified again on the services' own pages (docs/HEALTH.md), and then a new fingerprint.
  const source = (lesson, id) => sources[lesson].steps.find((s) => s.id === id);
  assert.equal(fingerprint(wordsOf(source('mental-health', 'crisis'))), '16eef796fbcd50e2', 'mental-health/crisis');
  assert.equal(fingerprint(wordsOf(source('connection', 'crisis'))), 'c20c2b3f94243ccd', 'connection/crisis');
  assert.equal(fingerprint(sources['mental-health'].recap), '142f34159255e351', 'the recap of mental-health');
  assert.equal(fingerprint(sources.connection.recap), '45dbf7b932f1fd2d', 'the recap of connection');
  assert.equal(fingerprint([H.crisisPointers(), H.CRISIS_LINES, H.HELPLINE_DIRECTORY]), 'af697ff8b9951da4', 'the crisis lines and the sentence that names them');
  assert.equal(fingerprint(H.WORDS), '0bdfb794cd40b28c', 'the table of respectful and avoidable phrases');
  // no telephone number anywhere else: the three lines appear in the two crisis steps and in one recap line, and nowhere new
  const numbers = /\b988\b|116 123|13 11 14/;
  const withNumbers = [];
  everyStep((id, step) => { if (numbers.test(visible(resolveStep(step, makeRng(1), step.id)).join(' '))) withNumbers.push(`${id}/${step.id}`); });
  assert.deepEqual(withNumbers, ['mental-health/crisis', 'connection/crisis']);
  // the red-flag wording of the other lessons stands as it was
  assert.match(flat(one('stress', 'try-this').text), /Chest pain or pressure, or sudden trouble breathing, is never "just stress" until a professional has said so: call your local emergency number/);
  assert.match(flat(one('better-sleep', 'red-flags').explain), /the only safe response is to stop driving/);
});

/* ====================================================================== keep the list complete */

test('every generated step of the course is re-derived by a test above', () => {
  const found = {};
  everyStep((id, step) => { if (typeof step.gen === 'function') (found[id] ||= []).push(step.id); });
  assert.deepEqual(found, Object.fromEntries(Object.entries(GENERATED).filter(([id]) => lessons[id])), 'GENERATED lists exactly the generated steps');
  for (const [id, ids] of Object.entries(found)) for (const sid of ids) assert.ok(tested.has(`${id}/${sid}`), `${id}/${sid} has a test that re-derives it`);
});
