// Independent checks of "Movement and Fitness".
//
// The facts of the course (guideline figures, study results, typical values) are typed in here a second
// time, from the author's verified notes, and compared with the tables the lessons are built from. Every
// generated question is re-solved from the wording the learner sees. The four models the lessons use
// (effort-lab, training-sim, sway-lab, week-planner) are worked out again here by other means, and each
// interact step's `check` is fed the states those models give, so that exactly the states the instruction
// asks for are accepted. Safety rules of the Health path are asserted at the end.
//
//   node --test tests/fitness-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { compile } from '../src/core/mathexpr.js';
import course from '../content/courses/fitness/course.js';
import * as H from '../content/courses/fitness/helpers.js';
import { physiology, effortForWork, zoneOf, PEOPLE as BODIES } from '../src/widgets/effort-lab.js';
import { recover, overload } from '../src/widgets/training-sim.js';
import { swayOf, balanceOf, LIMIT } from '../src/widgets/sway-lab.js';
import { tally } from '../src/widgets/week-planner.js';
import { structureIds, expandIds, structureInfo } from '../src/widgets/body-map.js';

const SEEDS = 200;
const LESSONS = ['why-move', 'aerobic', 'strength', 'mobility-balance', 'training-recovery', 'habits'];
/** Every generated step of the course. Each is re-derived below; the last test keeps the list complete. */
const GENERATED = {
  'why-move': ['equivalent', 'meets', 'intensity-sort'],
  aerobic: ['pulse', 'output', 'max-rate', 'stroke-stretch'],
  strength: ['log', 'which-overload', 'counts'],
  'mobility-balance': ['falls', 'scans'],
  'training-recovery': ['pain-sort', 'ramp'],
  habits: ['if-then', 'build-up'],
};
const tested = new Set();

/* ------------------------------------------------------------------------------------------------
 * The author's own table of facts, typed independently of content/courses/fitness/helpers.js.
 * ---------------------------------------------------------------------------------------------- */
const FACTS = {
  // WHO guidelines on physical activity and sedentary behaviour, 2020 (Bull et al., Br J Sports Med 2020)
  who: { moderate: [150, 300], vigorous: [75, 150], strengthDays: 2, childDaily: 60, childVigorousDays: 3, olderBalanceDays: 3, vigorousCountsAs: 2, year: 2020 },
  // WHO fact sheet "Physical activity", June 2024: 31% of adults (1.8 billion) insufficiently active in 2022
  inactiveAdultsPercent: 31,
  // Arem et al., JAMA Intern Med 2015: hazard ratios × 100 for none, <1×, 1–2×, 2–3×, 3–5×, 5–10×, ≥10× the minimum
  dose: { none: 100, some: 80, x1: 69, x2: 63, x3: 61, x5: 61, x10: 69 },
  // Ding et al., Lancet Public Health 2025: 7,000 v 2,000 steps a day, 47% lower all-cause mortality; manpo-kei about 1965
  steps: { reference: 2000, benefit: 7000, lower: 47, slogan: 10000, sloganYear: 1965 },
  // Tanaka, Monahan and Seals, J Am Coll Cardiol 2001: 208 − 0.7 × age
  tanaka: { 20: 194, 30: 187, 40: 180, 50: 173, 60: 166, 70: 159, 80: 152 },
  // WHO 2020 glossary: on a 0–10 scale moderate is 5–6, vigorous 7–8
  rpe: { moderate: [5, 6], vigorous: [7, 8] },
  // CDC target heart rate: 64–76% and 77–93% of maximum; American Heart Association: 50–70% and 70–85%
  zones: { cdc: [[64, 76], [77, 93]], aha: [[50, 70], [70, 85]] },
  // Fiatarone et al., JAMA 1990: mean age 90, 8 weeks, strength +174%
  nonagenarians: { age: 90, weeks: 8, gain: 174, year: 1990 },
  // Jones et al., J Bone Joint Surg 1977: cortical thickness +34.9% (men), +28.4% (women)
  tennis: { men: 35, women: 28, year: 1977 },
  // Lauersen et al., Br J Sports Med 2014: relative risks 0.963 (stretching), 0.550 (proprioception), 0.315 (strength)
  injuries: { stretching: 96, balance: 55, strength: 32 },
  // Sherrington et al., Cochrane 2019: rate of falls −23%
  fallsReduction: 23,
  // Brinjikji et al., AJNR 2015: asymptomatic people with disc degeneration / disc bulge at 20, 50, 80
  scans: { 20: { degeneration: 37, bulge: 30 }, 50: { degeneration: 80, bulge: 60 }, 80: { degeneration: 96, bulge: 84 } },
  // WHO fact sheet "Low back pain", 2023; Henschke et al. 2009 (0.9% serious pathology)
  backPain: { millions: 619, year: 2020, nonSpecific: 90, seriousPer100: 1 },
  // Lally et al., Eur J Soc Psychol 2010; Maltz 1960
  habit: { median: 66, range: [18, 254], myth: 21, mythYear: 1960 },
  // textbook timing of delayed-onset muscle soreness and of lactate clearance
  doms: { peak: [24, 72], lactateHours: 1 },
};
/** Intensity of activities for a typical healthy adult (US Physical Activity Guidelines 2018, CDC, NHS). */
const INTENSITY = {
  light: ['Strolling slowly', 'Washing the dishes', 'Cooking a meal', 'Dusting the shelves'],
  moderate: ['Walking briskly', 'Cycling gently on flat ground', 'Water aerobics', 'Doubles tennis', 'Ballroom dancing', 'Raking leaves', 'Pushing a lawn mower'],
  vigorous: ['Running', 'Swimming laps', 'Singles tennis', 'Skipping with a rope', 'Cycling fast or uphill', 'Hiking uphill with a heavy pack', 'A football match'],
};
const MODERATE_WORDS = ['brisk walking', 'gentle cycling', 'water aerobics', 'doubles tennis', 'dancing'];
const VIGOROUS_WORDS = ['running', 'lap swimming', 'singles tennis', 'fast cycling', 'football'];
/** Muscle-strengthening or not (NHS physical activity guidelines for adults). */
const STRENGTHENS = {
  'Push-ups or squats': true, 'Exercises with a resistance band': true, 'Lifting weights': true, 'Carrying heavy shopping bags': true,
  'Digging the garden': true, 'Yoga or Pilates': true, 'Pushing yourself along in a wheelchair': true,
  'A gentle stroll': false, 'Watching a workout video': false, 'Stretching your calves': false,
};

const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/fitness/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, 'fitness', id);
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };
const correctOption = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: exactly one correct option`); return right[0]; };
const near = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} expected ${b}, got ${a}`);
/** Run a generated step with many seeds and hand each concrete step to `verify`. Returns the number of different questions. */
function eachVariant(lesson, id, verify, n = SEEDS) {
  const step = raw(lesson, id);
  assert.equal(typeof step.gen, 'function', `${lesson}/${id} is generated`);
  assert.ok(GENERATED[lesson].includes(id), `${lesson}/${id} is listed in GENERATED`);
  tested.add(`${lesson}/${id}`);
  const texts = new Set();
  for (let k = 0; k < n; k++) {
    const s = resolveStep(step, makeRng(5179 + k * 7919), id);
    texts.add(flat(s.text) + JSON.stringify(s.items || s.options || ''));
    try { verify(s); } catch (err) { err.message = `${lesson}/${id} (seed ${k}): ${err.message}\n  text: ${flat(s.text)}`; throw err; }
  }
  return texts.size;
}
/** A numeric step's answer and listed slips are all different numbers, and no slip is within reach of the answer. */
function slipsFine(step) {
  const values = [step.answer, ...(step.wrong || []).map((w) => w[0])];
  assert.equal(new Set(values.map((v) => Math.round(v * 1e6))).size, values.length, `${step.id}: answer and slips ${values.join(', ')} are all different`);
  for (const [slip, why] of step.wrong || []) {
    assert.ok(Math.abs(slip - step.answer) > 2 * (step.tolerance || 0), `${step.id}: slip ${slip} too close to ${step.answer}`);
    assert.ok(typeof why === 'string' && why.length > 15, `${step.id}: slip ${slip} says why`);
  }
}
/** Every string a learner can see in a resolved step. */
function visible(step) {
  const out = [];
  const skip = new Set(['type', 'id', 'expr', 'color', 'mode', 'view', 'kind', 'scale', 'person', 'stance', 'eyes', 'ground', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'answer', 'target', 'tone', 'level']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/* ------------------------------------------------------------------------------------ whole course */

test('course shape: six lessons of 14 to 20 steps, each opening with a prediction and ending on an invitation', () => {
  assert.equal(course.id, 'fitness');
  assert.equal(course.category, 'health');
  assert.deepEqual(course.requires, ['body-systems']);
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), LESSONS);
  const hands = ['effort-lab', 'training-sim', 'sway-lab', 'week-planner', 'body-map', 'plot'];
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.ok(lesson.steps.length >= 14 && lesson.steps.length <= 20, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) if (s.type === 'numeric') assert.equal(typeof s.gen, 'function', `${id}/${s.id}: numeric review steps are generated`);
    assert.ok(lesson.steps.filter((s) => s.gen).length >= 2, `${id}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${id}: no more than five choice steps`);
    const handsOn = lesson.steps.filter((s) => s.type === 'interact' || (resolveStep(s, makeRng(2), s.id).figures || []).some((f) => hands.includes(f.type) && !f.static));
    assert.ok(handsOn.length >= 3, `${id}: ${handsOn.length} hands-on steps`);
    assert.equal(lesson.steps[0].mode, 'predict', `${id} opens with a prediction`);
    const last = lesson.steps[lesson.steps.length - 1];
    assert.ok(last.mode === 'predict' && last.type === 'choice' && last.options.every((o) => !o.correct), `${id} ends on an invitation with no right answer`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: next`);
    for (let i = 2; i < lesson.steps.length; i++) assert.ok(!lesson.steps.slice(i - 2, i + 1).every((s) => s.type === 'info'), `${id}: three info steps in a row`);
    for (const s of lesson.steps) if (!['info', 'reflect'].includes(s.type)) assert.ok(s.gen || s.explain, `${id}/${s.id} has an explanation`);
  }
  assert.match(lessons.habits.next, /Sleep, Stress and Mental Health/);
});

test('the helper tables agree with the author\'s independent table of facts', () => {
  assert.deepEqual(H.WHO.adult.moderate, FACTS.who.moderate);
  assert.deepEqual(H.WHO.adult.vigorous, FACTS.who.vigorous);
  assert.equal(H.WHO.adult.strengthDays, FACTS.who.strengthDays);
  assert.equal(H.WHO.child.dailyAverage, FACTS.who.childDaily);
  assert.equal(H.WHO.child.vigorousDays, FACTS.who.childVigorousDays);
  assert.equal(H.WHO.older.balanceDays, FACTS.who.olderBalanceDays);
  assert.equal(H.WHO.vigorousFactor, FACTS.who.vigorousCountsAs);
  assert.equal(H.WHO.year, FACTS.who.year);
  assert.deepEqual(H.WHO.rpe, FACTS.rpe);
  assert.equal(H.equivalent(40, 30), 40 + 30 + 30);
  assert.equal(H.INACTIVITY.adultsPercent, FACTS.inactiveAdultsPercent);
  for (const row of H.DOSE) assert.equal(row.risk, FACTS.dose[row.id], `dose group ${row.id}`);
  assert.equal(H.DOSE.length, Object.keys(FACTS.dose).length);
  assert.deepEqual([H.STEPS.reference, H.STEPS.benefit, H.STEPS.lowerRiskPercent, H.STEPS.slogan, H.STEPS.sloganYear], [FACTS.steps.reference, FACTS.steps.benefit, FACTS.steps.lower, FACTS.steps.slogan, FACTS.steps.sloganYear]);
  for (const [age, rate] of Object.entries(FACTS.tanaka)) {
    assert.equal(H.maxHeartRate.tanaka(Number(age)), rate, `Tanaka at ${age}`);
    assert.equal(H.maxHeartRate.fox(Number(age)), 220 - Number(age));
  }
  assert.deepEqual([H.HR_ZONES.cdc.moderate, H.HR_ZONES.cdc.vigorous], FACTS.zones.cdc);
  assert.deepEqual([H.HR_ZONES.aha.moderate, H.HR_ZONES.aha.vigorous], FACTS.zones.aha);
  assert.deepEqual([H.NONAGENARIANS.meanAge, H.NONAGENARIANS.weeks, H.NONAGENARIANS.gainPercent, H.NONAGENARIANS.year], [FACTS.nonagenarians.age, FACTS.nonagenarians.weeks, FACTS.nonagenarians.gain, FACTS.nonagenarians.year]);
  assert.deepEqual([H.TENNIS_ARM.men, H.TENNIS_ARM.women, H.TENNIS_ARM.year], [FACTS.tennis.men, FACTS.tennis.women, FACTS.tennis.year]);
  assert.deepEqual([H.INJURY_TRIALS.stretching, H.INJURY_TRIALS.balance, H.INJURY_TRIALS.strength], [FACTS.injuries.stretching, FACTS.injuries.balance, FACTS.injuries.strength]);
  assert.equal(H.FALLS.reductionPercent, FACTS.fallsReduction);
  H.SPINE_SCANS.ages.forEach((age, i) => {
    assert.equal(H.SPINE_SCANS.degeneration[i], FACTS.scans[age].degeneration, `degeneration at ${age}`);
    assert.equal(H.SPINE_SCANS.bulge[i], FACTS.scans[age].bulge, `bulge at ${age}`);
  });
  assert.deepEqual([H.BACK_PAIN.millions, H.BACK_PAIN.year, H.BACK_PAIN.nonSpecificPercent, H.BACK_PAIN.seriousPer100], [FACTS.backPain.millions, FACTS.backPain.year, FACTS.backPain.nonSpecific, FACTS.backPain.seriousPer100]);
  assert.deepEqual([H.HABIT.medianDays, H.HABIT.range, H.HABIT.mythDays, H.HABIT.mythYear], [FACTS.habit.median, FACTS.habit.range, FACTS.habit.myth, FACTS.habit.mythYear]);
  assert.deepEqual([H.DOMS.peakHours, H.DOMS.lactateClearedHours], [FACTS.doms.peak, FACTS.doms.lactateHours]);
  // activities and what counts as strengthening
  for (const a of H.ACTIVITIES) assert.ok(INTENSITY[a.level].includes(a.text), `${a.text} is ${a.level}`);
  assert.equal(H.ACTIVITIES.length, Object.values(INTENSITY).flat().length);
  for (const a of H.STRENGTHENING) assert.equal(a.yes, STRENGTHENS[a.text], a.text);
  assert.equal(H.STRENGTHENING.length, Object.keys(STRENGTHENS).length);
  assert.equal(new Set(H.PEOPLE).size, H.PEOPLE.length);
});

test('the drawn dose–response curve passes through the published groups and only ever falls', () => {
  const curve = (m) => 59.4 + 11.5 * Math.exp(-m / 30) + 29.1 * Math.exp(-m / 195);       // typed again from the header comment
  const fromExpr = compile(H.DOSE_EXPR, { vars: ['x'] });
  for (let m = 0; m <= 600; m += 15) {
    near(H.doseRisk(m), curve(m), 1e-9, `doseRisk(${m})`);
    near(fromExpr({ x: m }), curve(m), 1e-9, `the plotted expression at ${m}`);
    if (m) assert.ok(curve(m) < curve(m - 15), 'more activity, lower risk');
  }
  near(curve(0), 100, 1e-9);
  // the middle of each published group: 75 (below 1×), 225 (1–2×), 375 (2–3×), 600 (3–5×) minutes a week
  for (const [m, id] of [[75, 'some'], [225, 'x1'], [375, 'x2'], [600, 'x3']]) {
    near(curve(m), FACTS.dose[id], 0.75, `curve at ${m} minutes`);
    assert.equal(H.DOSE.find((d) => d.id === id).minutes, m);
  }
});

test('no learner-visible text contains undefined, NaN, an object or float noise', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(91 + k * 131), step.id);
        for (const text of visible(s)) {
          const where = `${id}/${step.id} seed ${k}: "${text.slice(0, 140)}"`;
          assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), where);
          assert.ok(!/\d\.\d{5,}/.test(text), `float noise in ${where}`);
          assert.ok(!/\b1 (minutes|days|weeks|falls|sessions|beats|points|people)\b/.test(text), `plural in ${where}`);
        }
        if (!step.gen) break;
      }
    }
    for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
  }
});

test('every choice has exactly one correct option, no duplicates, and says why each wrong option is wrong', () => {
  let seen = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'choice' && step.type !== 'multi') continue;
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(7 + k * 97), step.id);
        const right = s.options.filter((o) => o.correct).length;
        const poll = s.mode === 'predict' && right === 0;                 // "which of these would suit you?" has no right answer
        if (step.type === 'choice' && !poll) assert.equal(right, 1, `${id}/${step.id} seed ${k}`);
        if (step.type === 'multi') assert.ok(right >= 1 && right < s.options.length, `${id}/${step.id} seed ${k}`);
        assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, `${id}/${step.id} has duplicate options`);
        for (const o of s.options) if (!o.correct && s.mode !== 'predict') assert.ok(o.why && o.why.length > 20, `${id}/${step.id}: "${o.text}" says why it is wrong`);
        seen++;
        if (!step.gen) break;
      }
    }
  }
  assert.ok(seen > 600);
});

test('numeric steps: generated, with a unit, hints, an explanation and slips that are really wrong', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'numeric') continue;
      assert.equal(typeof step.gen, 'function', `${id}/${step.id}: numeric practice is generated`);
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(11 + k * 613), step.id);
        assert.ok(Number.isFinite(s.answer) && s.answer > 0, `${id}/${step.id}`);
        assert.ok(Math.abs(s.answer * 10 - Math.round(s.answer * 10)) < 1e-7, `${id}/${step.id}: ${s.answer} has at most one decimal`);
        assert.ok(s.unit && s.explain && s.hints.length >= 1, `${id}/${step.id} shows a unit, hints and an explanation`);
        slipsFine(s);
      }
    }
  }
});

/* ---------------------------------------------------------------------------------------- lesson 1 */

test('lesson 1: the hook, the curve and the published steps down', () => {
  const hook = one('why-move', 'hook');
  assert.match(hook.text, /> \*\*A note before we start\.\*\*/);
  assert.deepEqual(hook.solution.values, [[FACTS.dose.some, FACTS.dose.x1, FACTS.dose.x2]]);
  assert.equal(hook.check(hook.solution), true);
  assert.ok(flat(hook.explain).includes(`**${FACTS.dose.some}**, **${FACTS.dose.x1}** and **${FACTS.dose.x2}**`));
  // 10, 30 and 60 minutes a day are 70, 210 and 420 minutes a week: below 1×, 1–2× and 2–3× the 150-minute minimum
  assert.deepEqual([70, 210, 420].map((m) => Math.floor(m / 150)), [0, 1, 2]);

  const explore = one('why-move', 'dose-explore');
  const curve = (m) => 59.4 + 11.5 * Math.exp(-m / 30) + 29.1 * Math.exp(-m / 195);
  const slider = explore.widget.params.m;
  const accepted = [];
  for (let m = slider.min; m <= slider.max; m += slider.step) {
    const gain = Math.round(curve(m) - curve(m + 75));
    const res = explore.check({ m });
    assert.equal(res === true, gain === 2, `dose-explore at ${m} minutes (gain ${gain})`);
    if (res === true) accepted.push(m);
    else {
      assert.equal(typeof res, 'string');
      if (m > 0) { assert.ok(res.includes(`At ${m} minutes a week`) && res.includes(`about ${gain} point`), res); assert.match(res, gain > 2 ? /Keep going right/ : /Come back/); }
    }
  }
  assert.ok(accepted.includes(explore.solution.m) && accepted.includes(300));
  assert.ok(Math.min(...accepted) >= 225 && Math.max(...accepted) <= 375, `accepted: ${accepted.join(', ')}`);
  assert.equal(Math.round(curve(0) - curve(75)), 20, '"At the start they are worth 20 points"');
  assert.match(flat(explore.text), /At the start they are worth 20 points/);
  assert.deepEqual(explore.widget.areas[0].from, 150);
  assert.deepEqual(explore.widget.areas[0].to, 300);

  const steps = one('why-move', 'dose-steps');
  assert.deepEqual(steps.blanks.slice(0, 3).map((b) => b.numbers[0]), [FACTS.dose.none - FACTS.dose.some, FACTS.dose.some - FACTS.dose.x1, FACTS.dose.x1 - FACTS.dose.x2]);
  assert.deepEqual(steps.blanks.slice(0, 3).map((b) => b.numbers[0]), [20, 11, 6]);
  assert.match(steps.blanks[3].answer, /first step, from none to some/);
  assert.deepEqual(steps.figures[0].data.map((d) => d.value), [100, 80, 69, 63, 61]);
  for (const v of [100, 80, 69, 63, 61]) assert.ok(steps.figures[0].alt.includes(String(v)));

  // the three study results are now given in the prompts (they were guesses before), and the questions ask what follows from them
  const buses = one('why-move', 'buses');
  assert.match(flat(buses.text), /conductors had roughly \*\*half\*\* the rate of fatal heart attacks \(Morris, 1953\)/);
  assert.match(correctOption(buses).text, /^Trials in which volunteers take up an activity programme/);
  const sitting = one('why-move', 'sitting');
  assert.match(flat(sitting.text), /\*\*most active quarter\*\*, with 60 to 75 minutes of moderate activity a day, long sitting hours made almost no difference/);
  assert.match(flat(sitting.text), /\*\*least active\*\* people, those who sat more than eight hours a day were more likely to die/);
  assert.match(correctOption(sitting).text, /mattered most for people who moved little; with plenty of activity it stopped showing up as a risk/);
  const stepsStep = one('why-move', 'steps');
  assert.equal(stepsStep.type, 'choice');
  assert.ok(flat(stepsStep.text).includes(`Compared with 2,000 steps a day, **7,000 steps a day** went with a ${FACTS.steps.lower}% lower risk`), stepsStep.text);
  assert.ok(flat(stepsStep.text).includes('sold from about 1965'));
  assert.match(correctOption(stepsStep).text, /Most of the gain is already there at about 7,000 steps; 10,000 is a catchy name, not a research finding/);
  assert.ok(flat(stepsStep.explain).includes('47% lower'));
  const guide = flat(one('why-move', 'guideline').text);
  assert.match(guide, /\*\*150 to 300 minutes a week\*\* of \*moderate\* activity, \*\*or\*\* 75 to 150 minutes of \*vigorous\*/);
  assert.match(guide, /on \*\*2 or more days\*\*/);
  assert.match(guide, /\*\*60 minutes a day\*\* of moderate-to-vigorous activity/);
  assert.match(guide, /balance and strength practice on 3 or more days/);
  // reviewer: the note names who it is for (WHO 2020: most people need no medical clearance to start gently) and discourages nobody else
  assert.match(guide, /For most people, building up gently is safe\./);
  assert.match(guide, /heart condition or another medical condition, get chest pain or dizziness with effort, are pregnant, or are unsure .* check with a health professional/);
  // reviewer: the curve is the author's line through the published groups, and the step says so
  assert.match(flat(explore.text), /our own smooth line through them, a drawing aid/);
  assert.match(flat(explore.explain), /^On this curve, at around \*\*300 minutes a week\*\*/);
  const all = one('why-move', 'everybody');
  assert.deepEqual(all.options.filter((o) => o.correct).map((o) => o.text.slice(0, 12)), ['Doing some p', 'Start with s', 'The recommen']);
  const benefits = one('why-move', 'benefits');
  for (const item of benefits.items) assert.equal(item.bucket === 1, /Colour blindness|less sleep|Toxins/.test(item.text), item.text);
});

test('lesson 1: moderate-equivalent minutes, re-added from the wording', () => {
  const n = eachVariant('why-move', 'equivalent', (step) => {
    const text = flat(step.text);
    const [a, modWord] = grab(/\*\*(\d+) minutes\*\* of ([a-z ]+) \(moderate\)/, text);
    const [b, vigWord] = grab(/\*\*(\d+) minutes\*\* of ([a-z ]+) \(vigorous\)/, text);
    assert.ok(MODERATE_WORDS.includes(modWord), `${modWord} is a moderate activity`);
    assert.ok(VIGOROUS_WORDS.includes(vigWord), `${vigWord} is a vigorous activity`);
    assert.match(text, /one vigorous minute as two moderate ones/);
    let total = Number(a);
    for (let i = 0; i < Number(b); i++) total += 2;                     // count each vigorous minute twice
    assert.equal(step.answer, total);
    assert.ok(step.explain.includes(`= ${total}$ minutes`));
    if (total >= 150) assert.match(step.explain, /reaches WHO's minimum of 150/);
    else assert.ok(step.explain.includes(`is ${150 - total} minutes short`), step.explain);
    assert.deepEqual(step.wrong.map((w) => w[0]), [Number(a) + Number(b), 2 * Number(a) + Number(b), 2 * Number(b)]);
  });
  assert.ok(n >= 40, `${n} different questions`);
});

test('lesson 1: does the week meet the two parts of the recommendation?', () => {
  const seen = new Set();
  eachVariant('why-move', 'meets', (step) => {
    const text = flat(step.text);
    let moderate = 0;
    let vigorous = 0;
    for (const m of text.matchAll(/(\d+) minutes of ([a-z ]+?)(?= and |, and )/g)) {
      if (MODERATE_WORDS.includes(m[2])) moderate += Number(m[1]);
      else if (VIGOROUS_WORDS.includes(m[2])) vigorous += Number(m[1]);
      else assert.fail(`unknown activity "${m[2]}"`);
    }
    assert.ok(moderate + vigorous > 0, 'the week lists some activity');
    const days = /no muscle-strengthening exercise/.test(text) ? 0 : Number(grab(/muscle-strengthening exercises on (\d) days?\b/, text)[0]);
    assert.match(text, /at least \*\*150 moderate-equivalent minutes\*\* \(vigorous minutes count double\) \*\*and\*\* strengthening on at least \*\*2 days\*\*/);
    const total = moderate + 2 * vigorous;
    const aerobic = total >= 150;
    const strength = days >= 2;
    assert.ok(Math.abs(total - 150) >= 10 || total === 150, 'not a hair\'s-breadth case');
    const expected = aerobic && strength ? 'Both parts are met' : aerobic ? 'The aerobic part is met, the strength part is not' : strength ? 'The strength part is met, the aerobic part is not' : 'Neither part is met yet';
    assert.equal(correctOption(step).text, expected);
    assert.equal(step.shuffle, false);
    assert.ok(step.explain.includes(`= ${total} moderate-equivalent minutes`) || step.explain.includes(`${moderate} = ${total}`), step.explain);
    assert.match(step.explain, aerobic ? /which reaches 150/ : /which is below 150/);
    assert.match(step.explain, strength ? /reaches the 2 days/ : /is short of the 2 days/);
    for (const o of step.options) {
      if (o.correct) continue;
      // each wrong option is told about a part it gets wrong, in words that are true for these numbers
      const claimsAerobic = /^Both|^The aerobic part is met/.test(o.text);
      const claimsStrength = /^Both|^The strength part is met/.test(o.text);
      if (/moderate-equivalent minutes/.test(o.why)) { assert.notEqual(claimsAerobic, aerobic); assert.match(o.why, aerobic ? /reaches 150/ : /below 150/); } else { assert.notEqual(claimsStrength, strength); assert.match(o.why, strength ? /reaches the 2/ : /short of the 2/); }
    }
    seen.add(expected);
  });
  assert.equal(seen.size, 4, 'all four outcomes occur');
});

test('lesson 1: the talk test accepts exactly the moderate band, and activities are sorted by the published lists', () => {
  const talk = one('why-move', 'talk-test');
  for (let effort = 0; effort <= 100; effort += 5) {
    const p = physiology('before', effort);
    const res = talk.check({ effort, zone: p.zone, talk: p.talk });
    assert.equal(res === true, effort >= 40 && effort < 60, `talk test at ${effort}%`);
    if (res !== true) assert.match(res, effort < 5 ? /up from rest/ : effort < 40 ? /Still easy enough to sing/ : effort < 90 ? /only a few words/ : /all-out/);
  }
  assert.equal(talk.check({ effort: talk.solution.effort, ...physiology('before', talk.solution.effort) }), true);

  const n = eachVariant('why-move', 'intensity-sort', (step) => {
    assert.deepEqual(step.buckets.map((b) => b.split(':')[0]), ['Light', 'Moderate', 'Vigorous']);
    assert.equal(step.items.length, 6);
    for (let b = 0; b < 3; b++) assert.equal(step.items.filter((i) => i.bucket === b).length, 2);
    for (const item of step.items) assert.ok(INTENSITY[['light', 'moderate', 'vigorous'][item.bucket]].includes(item.text), `${item.text} is in bucket ${item.bucket}`);
    assert.equal(new Set(step.items.map((i) => i.text)).size, 6);
  });
  assert.ok(n >= 100, `${n} different sets`);
});

/* ---------------------------------------------------------------------------------------- lesson 2 */

/** The example body of the effort-lab, written out again from its header comment. */
function body(who, effort) {
  const p = who === 'after' ? { rest: 58, max: 188, sv0: 85, sv1: 120, top: 12 } : { rest: 70, max: 190, sv0: 70, sv1: 100, top: 10 };
  const f = effort / 100;
  const hr = Math.round(p.rest + f * (p.max - p.rest));
  const rise = Math.min(1, f / 0.45);
  const sv = Math.round(p.sv0 + (p.sv1 - p.sv0) * (2 * rise - rise * rise));
  const breaths = Math.round(14 + 16 * f + 37.5 * Math.max(0, f - 0.6));
  const energy = 1 + f * (p.top - 1);
  const fat = 0.65 * (1 - f ** 1.6);
  const zone = effort >= 90 ? 'max' : effort >= 60 ? 'vigorous' : effort >= 40 ? 'moderate' : effort >= 5 ? 'light' : 'rest';
  return { hr, sv, out: (hr * sv) / 1000, breaths, energy, fat, zone, top: p.top };
}

test('lesson 2: the effort model is the one described, and behaves like a body', () => {
  for (const who of ['before', 'after']) {
    let last = null;
    for (let effort = 0; effort <= 100; effort += 5) {
      const mine = body(who, effort);
      const theirs = physiology(who, effort);
      assert.equal(theirs.heartRate, mine.hr); assert.equal(theirs.stroke, mine.sv); assert.equal(theirs.breaths, mine.breaths);
      near(theirs.output, mine.out, 0.051); near(theirs.energy, mine.energy, 0.051);
      assert.equal(theirs.fatShare, Math.round(mine.fat * 100)); assert.equal(theirs.zone, mine.zone); assert.equal(zoneOf(effort), mine.zone);
      near(theirs.fatUse + theirs.carbUse, theirs.energy, 0.06, 'the two fuels add up to the energy used');
      if (last) { assert.ok(mine.hr > last.hr && mine.sv >= last.sv && mine.breaths >= last.breaths && mine.fat < last.fat, `${who} at ${effort}%: harder work, higher readings, smaller share of fat`); }
      last = mine;
    }
  }
  // typical textbook values: about 5 L a minute at rest, about 20 at most in an untrained adult, resting pulse in 60–100
  near(body('before', 0).out, 5, 0.2); near(body('after', 0).out, 5, 0.2);
  near(body('before', 100).out, 20, 1.5);
  assert.ok(body('before', 0).hr >= 60 && body('before', 0).hr <= 100 && body('after', 0).hr < 60);
  assert.equal(BODIES.before.maxWork, 10); assert.equal(BODIES.after.maxWork, 12);
  // the fat used per minute is highest at moderate effort, while the share of fat is highest at rest
  const fatUse = (e) => body('before', e).energy * body('before', e).fat;
  const best = [...Array(21)].map((_, i) => i * 5).reduce((a, b) => (fatUse(b) > fatUse(a) ? b : a));
  assert.ok(best >= 40 && best < 60, `fat use peaks at ${best}% effort`);
  assert.ok(body('before', 20).fat > body('before', 50).fat && fatUse(20) < fatUse(50));
  // the same job (7 × rest): the trained body needs a lower heart rate, more blood per beat, about the same output
  const b = body('before', effortForWork('before', 7));
  const a = body('after', effortForWork('after', 7));
  near(effortForWork('before', 7), (6 / 9) * 100, 1e-9); near(effortForWork('after', 7), (6 / 11) * 100, 1e-9);
  assert.ok(a.hr < b.hr && a.sv > b.sv && Math.abs(a.out - b.out) < 1);
  assert.equal(b.zone, 'vigorous'); assert.equal(a.zone, 'moderate');
});

test('lesson 2: the fixed steps say what the model shows', () => {
  assert.match(correctOption(one('aerobic', 'hook')).text, /About 50: fewer beats, each one bigger/);
  const explore = one('aerobic', 'effort-explore');
  assert.equal(typeof explore.check({ zones: ['rest'] }), 'string');
  assert.match(explore.check({ zones: ['rest', 'light', 'moderate'] }), /vigorous or near-maximal/);
  assert.equal(explore.check({ zones: ['rest', 'light', 'moderate', 'vigorous', 'max'] }), true);
  assert.equal(explore.check(explore.solution), true);
  const ex = flat(explore.explain);
  assert.ok(ex.includes(`from ${body('before', 0).hr} to ${body('before', 100).hr}`));
  assert.ok(ex.includes(`from ${body('before', 0).sv} to ${body('before', 100).sv} mL`));
  assert.ok(ex.includes('4.9 to 19 litres'), ex);
  near(body('before', 100).out / body('before', 0).out, 4, 0.2, '"about four times as much"');

  const compare = one('aerobic', 'compare');
  for (let work = 1; work <= 12; work += 0.5) {
    for (const people of [['before'], ['after'], ['before', 'after']]) {
      const res = compare.check({ work, people });
      assert.equal(res === true, work === 7 && people.length === 2, `compare at ${work} with ${people}`);
    }
  }
  assert.equal(compare.check(compare.solution), true);
  const b = body('before', effortForWork('before', 7));
  const a = body('after', effortForWork('after', 7));
  assert.ok(flat(compare.explain).includes(`Before training: ${b.hr} beats a minute, ${b.breaths} breaths`) && flat(compare.explain).includes(`After: ${a.hr} beats, ${a.breaths} breaths`));

  const changed = one('aerobic', 'what-changed');
  assert.deepEqual(changed.blanks.map((x) => x.answer), ['more slowly', 'more', 'about the same']);
  assert.ok(flat(changed.explain).includes(`${b.hr} beats of ${b.sv} mL, or ${a.hr} beats of ${a.sv} mL`));
  assert.ok(flat(changed.explain).includes(`${body('after', 0).hr} beats instead of ${body('before', 0).hr}`));
  assert.equal(changed.figures[0].work, 7);

  // the path of oxygen, in the author's own order
  const path = one('aerobic', 'oxygen-path');
  const ORDER = [/air sacs of the lungs/, /binds to a red blood cell/, /left side of the heart/, /capillary wall in a muscle/, /mitochondrion/];
  assert.equal(path.items.length, ORDER.length);
  path.items.forEach((item, i) => assert.match(item, ORDER[i]));

  const match = one('aerobic', 'adaptations');
  assert.deepEqual(match.pairs.map((p) => p[0]), ['A larger stroke volume', 'A lower resting pulse', 'More capillaries in the muscles', 'More mitochondria in the muscles']);
  assert.match(match.pairs[0][1], /every heartbeat/); assert.match(match.pairs[2][1], /shorter path/); assert.match(match.pairs[3][1], /burned with oxygen/);
  assert.match(correctOption(one('aerobic', 'spread')).text, /formulas give an average/);
  const spread = flat(one('aerobic', 'spread').explain);
  assert.ok(spread.includes('64 to 76% of maximum') && spread.includes('50 to 70%'), 'both bodies\' bands are named, neither is graded');
  assert.ok(spread.includes('moderate is about 5 or 6 and vigorous about 7 or 8'));
  assert.equal(208 - 0.7 * 40, 220 - 40, 'at 40 the two formulas agree, as the step says');
  assert.match(correctOption(one('aerobic', 'fuel')).text, /larger share, but of a much smaller total/);
  assert.match(correctOption(one('aerobic', 'intervals')).text, /Both improve fitness/);
  // the two traces: the steady one settles at 130, the interval one swings between about 116 and 168 five times
  const [steady, bursts] = one('aerobic', 'intervals').figures[0].fns.map((f) => compile(f.expr, { vars: ['x'] }));
  near(steady({ x: 25 }), 130, 0.5);
  let peaks = 0;
  for (let x = 2; x < 30; x += 0.05) if (bursts({ x }) >= 160 && bursts({ x: x - 0.05 }) < 160) peaks++;
  assert.equal(peaks, 5);
  assert.ok(steady({ x: 0 }) >= 60 && bursts({ x: 0 }) >= 60 && bursts({ x: 0 }) <= 80);
});

test('lesson 2: counting a pulse, cardiac output, maximum heart rate and stroke volume, re-solved from the text', () => {
  eachVariant('aerobic', 'pulse', (step) => {
    const text = flat(step.text);
    const [count, secs] = grab(/counts \*\*(\d+) beats in (\d+) seconds\*\*/, text).map(Number);
    assert.equal(60 % secs, 0);
    let beats = 0;
    for (let t = 0; t < 60; t += secs) beats += count;
    assert.equal(step.answer, beats);
    assert.ok(beats >= 40 && beats <= 100, 'a believable resting pulse');
    assert.match(step.explain, beats < 60 ? /below the usual 60 to 100/ : /inside the usual adult resting range of 60 to 100/);
    assert.match(text, /Nothing you\s+count is asked for or stored/);
    assert.ok(step.explain.includes(`= ${beats}$ beats a minute`));
  });
  eachVariant('aerobic', 'output', (step) => {
    const text = flat(step.text);
    const hr = Number(grab(/\*\*(\d+) times a minute\*\*/, text)[0]);
    const sv = Number(grab(/\*\*(\d+) mL\*\*/, text)[0]);
    const litres = (hr * sv) / 1000;
    near(step.answer, litres, 1e-9);
    assert.ok(litres >= 3.5 && litres <= 21, `${litres} L a minute is believable`);
    assert.ok(step.explain.includes(`= ${hr * sv} \\text{ mL}`));
    assert.match(text, /1 litre = 1,000 mL/);
    assert.deepEqual(step.wrong.map((x) => x[0]), [hr * sv, hr + sv]);
  });
  const ages = new Set();
  eachVariant('aerobic', 'max-rate', (step) => {
    const text = flat(step.text);
    assert.match(text, /208 - 0\.7 \\times \\text\{age\}/);
    const age = Number(grab(/who is (\d+)\./, text)[0]);
    ages.add(age);
    assert.equal(step.answer, FACTS.tanaka[age]);
    assert.ok(step.explain.includes(`208 - ${Math.round(0.7 * age)} = ${FACTS.tanaka[age]}`));
    assert.ok(step.explain.includes(`220 minus age, gives ${220 - age}`));
    for (const [slip] of step.wrong) assert.notEqual(slip, step.answer);
    assert.equal(step.wrong.some(([slip]) => slip === 220 - age), age !== 40);
  });
  assert.equal(ages.size, 7);
  eachVariant('aerobic', 'stroke-stretch', (step) => {
    const text = flat(step.text);
    const [h1, s1] = grab(/beat \*\*(\d+) times a minute\*\*, pumping \*\*(\d+) mL\*\* per beat/, text).map(Number);
    const h2 = Number(grab(/pulse is \*\*(\d+)\*\*/, text)[0]);
    assert.match(text, /still needs the same blood flow per minute/);
    assert.ok(h2 < h1, 'training lowers the resting pulse');
    assert.equal(step.answer * h2, h1 * s1, 'the same flow as before');
    assert.ok(Number.isInteger(step.answer) && step.answer > s1);
    near((h1 * s1) / 1000, 5, 0.1, 'about 5 litres a minute at rest');
    assert.ok(step.explain.includes(`${h1 * s1} \\div ${h2} = ${step.answer}`));
  });
});

/* ---------------------------------------------------------------------------------------- lesson 3 */

/** Sixteen weeks of strength training, written again from the model's description. */
function strengthPlan(plan) {
  let neural = 0;
  let muscle = 0;
  let load = 75;
  const totals = [100];
  for (const kind of plan) {
    for (let week = 0; week < 4; week++) {
      const strength = 100 + neural + muscle;
      if (kind === 'rest') { neural *= 0.96; muscle *= 0.9; } else {
        if (kind === 'up' && 0.75 * strength > load) load = 0.75 * strength;
        const stimulus = Math.min(1, Math.max(0, (load / strength - 0.6) / 0.15));
        neural += 0.3 * stimulus * (20 - neural);
        muscle += 0.05 * stimulus * (40 - muscle);
      }
      totals.push(100 + neural + muscle);
    }
  }
  return { totals, end: totals[16], neural, muscle };
}
const KINDS = ['rest', 'same', 'up'];
const allPlans = () => KINDS.flatMap((a) => KINDS.flatMap((b) => KINDS.flatMap((c) => KINDS.map((d) => [a, b, c, d]))));

test('lesson 3: the overload model, and the steps built on it', () => {
  for (const plan of allPlans()) {
    const mine = strengthPlan(plan);
    const theirs = overload(plan);
    near(theirs.end, mine.end, 0.051, plan.join());
    near(theirs.neural, mine.neural, 0.051); near(theirs.muscle, mine.muscle, 0.051);
    theirs.weeks.forEach((wk, i) => near(wk.total, mine.totals[i], 1e-9));
    near(theirs.lastBlock, mine.totals[16] - mine.totals[12], 0.11);
  }
  const same = strengthPlan(['same', 'same', 'same', 'same']);
  const up = strengthPlan(['up', 'up', 'up', 'up']);
  assert.ok(same.totals[16] - same.totals[12] < 1.5 && up.totals[16] - up.totals[12] > 3, 'a fixed load levels off, a rising one keeps climbing');
  assert.ok(up.end > same.end + 15);
  // early gains are mostly nerve learning, later ones mostly muscle
  const early = overload(['up', 'up', 'up', 'up']).weeks[4];
  assert.ok(early.neural > 2 * early.muscle);
  assert.ok(up.muscle > up.neural);
  // rest: some is lost, not all, and muscle goes faster than skill
  const stop = overload(['up', 'up', 'rest', 'rest']);
  assert.ok(stop.end > 110 && stop.end < stop.weeks[8].total);
  assert.ok(stop.muscle / stop.weeks[8].muscle < stop.neural / stop.weeks[8].neural);

  const explore = one('strength', 'overload-explore');
  assert.deepEqual(explore.widget.plan, ['same', 'same', 'same', 'same']);
  assert.equal(explore.check({ plan: ['up', 'up', 'up', 'up'], seen: ['same,same,same,same', 'up,up,up,up'] }), true);
  assert.match(explore.check({ plan: ['up', 'same', 'same', 'same'], seen: ['same,same,same,same', 'up,same,same,same'] }), /every block/);
  assert.match(explore.check({ plan: ['same', 'same', 'same', 'same'], seen: ['same,same,same,same'] }), /Change the blocks/);
  assert.equal(explore.check(explore.solution), true);
  const ex = flat(explore.explain);
  assert.ok(ex.includes(`about ${Math.round(same.end)} and then **levels off**`) && ex.includes(`about ${Math.round(up.end)} and is still rising`), ex);

  const read = one('strength', 'overload-read');
  assert.deepEqual(read.blanks.map((b) => b.answer), ['nerve learning', 'thicker muscle fibres', 'level off']);
  assert.deepEqual(read.figures[0].plan, ['up', 'up', 'up', 'up']);

  // the month off: every plan the buttons allow, with weeks 9–12 fixed at rest
  const brk = one('strength', 'break');
  assert.deepEqual(brk.widget.lockPlan, [2]);
  let passes = 0;
  for (const a of KINDS) for (const b of KINDS) for (const d of KINDS) {
    const plan = [a, b, 'rest', d];
    const exact = strengthPlan(plan).end;
    const end = Math.round(exact * 10) / 10;           // the widget reports strength to one decimal; its display and the check both round that
    assert.equal(end, overload(plan).end);
    const res = brk.check({ plan, end });
    assert.equal(res === true, Math.round(end) >= 130, `break ${plan.join()}: ${exact}`);
    if (Math.abs(exact - 129.5) > 0.06) assert.equal(res === true, exact >= 129.5, `break ${plan.join()}: ${exact}`);
    if (res === true) passes++;
    else { assert.ok(res.includes(`Strength ends at ${Math.round(end)}`), res); assert.match(res, d === 'rest' ? /last block is free/ : /weeks 1 to 8/); }
  }
  assert.ok(passes >= 3 && passes <= 9, `${passes} of 27 plans pass`);
  const sol = strengthPlan(brk.solution.plan);
  assert.equal(brk.check({ plan: brk.solution.plan, end: sol.end }), true);
  const bx = flat(brk.explain);
  assert.ok(bx.includes(`about ${Math.round(sol.totals[8])} by week 8`) && bx.includes(`about ${Math.round(sol.totals[12])} during`) && bx.includes(`about ${Math.round(sol.end)} by week 16`), bx);
  assert.ok(sol.totals[12] < sol.totals[8] && sol.totals[12] > 100, 'a break costs some of the gain, not all of it');
});

test('lesson 3: reading a training log and recognising progressive overload', () => {
  eachVariant('strength', 'log', (step) => {
    const text = flat(step.text);
    const [sets, reps, load] = grab(/\*\*(\d+) sets of (\d+) with (\d+) kg\*\*/, text).map(Number);
    let total = 0;
    for (let s = 0; s < sets; s++) for (let r = 0; r < reps; r++) total += load;
    assert.equal(step.answer, total);
    assert.deepEqual(step.wrong.map((x) => x[0]), [sets * reps, reps * load]);
    assert.ok(step.explain.includes(`${sets * reps} \\times ${load} = ${total}$ kg`));
  });
  const kinds = new Set();
  eachVariant('strength', 'which-overload', (step) => {
    const text = flat(step.text);
    const base = grab(/\*\*(\d+) sets of (\d+) with ([\d.]+) kg\*\*/, text).map(Number);
    const volume = ([s, r, l]) => s * r * l;
    const entries = step.options.map((o) => grab(/^(\d+) sets of (\d+) with ([\d.]+) kg$/, o.text).map(Number));
    const harder = entries.filter((e) => volume(e) > volume(base));
    assert.equal(harder.length, 1, 'exactly one entry asks for more than a month ago');
    assert.deepEqual(grab(/^(\d+) sets of (\d+) with ([\d.]+) kg$/, correctOption(step).text).map(Number), harder[0]);
    for (const e of entries) for (let i = 0; i < 3; i++) assert.ok(e[i] > 0);
    // the correct entry changes exactly one of the three numbers, upwards
    const diff = harder[0].map((v, i) => v - base[i]);
    assert.equal(diff.filter((d) => d !== 0).length, 1);
    kinds.add(diff.findIndex((d) => d !== 0));
    assert.match(step.explain, diff[2] ? new RegExp(`load went up by ${diff[2]} kg`) : diff[1] ? /two more repetitions/ : /one more set/);
    assert.equal(step.shuffle, false, 'already shuffled by the generator');
  });
  assert.equal(kinds.size, 3, 'more sets, more repetitions and more load all occur');
  eachVariant('strength', 'counts', (step) => {
    assert.equal(step.items.length, 6);
    assert.equal(step.items.filter((i) => i.bucket === 0).length, 4);
    for (const item of step.items) {
      assert.equal(item.bucket === 0, STRENGTHENS[item.text], item.text);
      if (item.bucket === 1) assert.ok(item.why && item.why.length > 20);
    }
    assert.match(flat(step.text), /on 2 or more days a week/);
  });
});

test('lesson 3: bone, age, the muscle to tap and the folklore', () => {
  assert.match(correctOption(one('strength', 'hook')).text, /nervous system/);
  // the X-ray result is stated in the prompt; the question asks what a difference between two arms of one person shows
  const bone = one('strength', 'bone');
  assert.match(correctOption(bone).text, /Bone is built up where it is loaded/);
  assert.ok(flat(bone.text).includes('**35% thicker**') && flat(bone.text).includes('28% in the women') && flat(bone.text).includes('1977'));
  assert.match(flat(bone.explain), /lose\s+about 1% of the bone in their hips and legs every month/);
  assert.ok(Math.abs(FACTS.tennis.men / 100 - 1 / 3) < 0.03, '35% is "about a third"');
  // the bone-bank picture: built up to about 30, lost slowly to 50 and faster after; a higher peak crosses the line later
  const bank = one('strength', 'bone-bank');
  const fig = bank.figures[0];
  const mass = compile(fig.fns[1].expr, { vars: ['x', 'p'] });
  const crossing = (p) => { for (let age = 31; age <= 100; age += 0.01) if (mass({ x: age, p }) < 70) return age; return null; };
  let peakAge = 0;
  for (let age = 0; age <= 100; age += 0.5) if (mass({ x: age, p: 100 }) > mass({ x: peakAge, p: 100 })) peakAge = age;
  assert.ok(peakAge >= 25 && peakAge <= 32, `peak bone mass at ${peakAge}`);
  near(mass({ x: peakAge, p: 100 }), 100, 1.5);
  near((mass({ x: 60, p: 100 }) - mass({ x: 70, p: 100 })) / (mass({ x: 35, p: 100 }) - mass({ x: 45, p: 100 })), 3, 0.01, 'loss is three times as fast after 50');
  const readout = fig.readouts[0].value;
  for (let p = fig.params.p.min; p <= fig.params.p.max; p += fig.params.p.step) near(readout({ p }), crossing(p), 0.6, `the age at which the line is crossed with a peak of ${p}%`);
  assert.ok(crossing(110) > crossing(100) && crossing(100) > crossing(90));
  assert.match(correctOption(bank).text, /crossed years later/);
  assert.ok(flat(bank.explain).includes(`${Math.round(crossing(110)) - Math.round(crossing(90))} years' difference`), bank.explain);
  const slopeAt = (p) => mass({ x: 60, p }) / p - mass({ x: 70, p }) / p;
  near(slopeAt(90), slopeAt(110), 1e-9, 'the share lost per year does not depend on the peak');

  // the result at ninety is stated (with the size of the study), charted, and then reasoned about
  const ninety = one('strength', 'ninety');
  assert.equal(ninety.type, 'multi');
  assert.ok(flat(ninety.text).includes('average age of **90**') && flat(ninety.text).includes('8 weeks') && flat(ninety.text).includes('**174%** on average') && flat(ninety.explain).includes('**174%**'));
  assert.match(flat(ninety.text), /ten frail nursing-home residents .* In the\s+nine who finished/);
  assert.deepEqual(ninety.figures[0].data.map((d) => d.value), [100, 100 + FACTS.nonagenarians.gain]);
  for (const o of ninety.options) assert.equal(!!o.correct, /still answer to training at ninety|can be won back/.test(o.text), o.text);
  near(1 + FACTS.nonagenarians.gain / 100, 2.74, 1e-9, '"nearly three times as much"');

  const chair = one('strength', 'chair');
  const muscles = structureIds('muscles');
  assert.ok(muscles.includes('quadriceps'));
  for (const id of muscles) {
    const info = structureInfo(id);
    const res = chair.check({ picked: id, nameThe: `the ${info.name.toLowerCase()}` });
    assert.equal(res === true, id === 'quadriceps', `chair: ${id}`);
    if (res !== true) assert.match(res, /front of the thigh/);
  }
  assert.equal(typeof chair.check({ picked: null }), 'string');
  assert.equal(chair.widget.answer, 'quadriceps');
  assert.equal(chair.check(chair.solution), true);

  const myths = one('strength', 'myths');
  const TRUE = [/eighties can still build muscle/];
  for (const item of myths.widget.items) {
    assert.equal(item.answer, TRUE.some((re) => re.test(item.text)), item.text);
    assert.ok(item.why.length > 40);
  }
  assert.equal(myths.widget.items.length, 6);
  assert.equal(myths.check({ done: true }), true); assert.equal(myths.check({ done: false }), false);
  const tech = one('strength', 'technique');
  for (const o of tech.options) assert.equal(!!o.correct, !/Push through|heaviest weight/.test(o.text), o.text);
  assert.match(flat(tech.explain), /medical condition, or who is pregnant\s+or unsure, should check with a professional first/);
});

/* ---------------------------------------------------------------------------------------- lesson 4 */

/** Average sway, from the description of the model. */
const sway = ({ stance, eyes, ground, practice }) => 0.5 * (stance === 'one' ? 2.4 : 1) * (eyes === 'closed' ? 2.2 : 1) * (ground === 'soft' ? 1.4 : 1) * (1 - 0.45 * (1 - Math.exp(-practice / 4)));

test('lesson 4: balance, as modelled and as asked', () => {
  const settings = [];
  for (const stance of ['two', 'one']) for (const eyes of ['open', 'closed']) for (const ground of ['firm', 'soft']) for (let practice = 0; practice <= 8; practice++) settings.push({ stance, eyes, ground, practice });
  for (const set of settings) {
    near(swayOf(set), sway(set), 1e-12);
    const b = balanceOf(set);
    assert.equal(b.limit, set.stance === 'one' ? 4 : 9);
    assert.equal(b.steady, sway(set) * 2.2 <= b.limit);
    assert.equal(b.clear, 3 - (set.eyes === 'closed') - (set.ground === 'soft'));
  }
  assert.deepEqual(LIMIT, { two: 9, one: 4 });
  // a narrower base, a missing sense and a dulled sense each mean more sway; practice means less
  const base = { stance: 'two', eyes: 'open', ground: 'firm', practice: 0 };
  for (const change of [{ stance: 'one' }, { eyes: 'closed' }, { ground: 'soft' }]) assert.ok(sway({ ...base, ...change }) > sway(base));
  for (let wk = 1; wk <= 8; wk++) assert.ok(sway({ ...base, practice: wk }) < sway({ ...base, practice: wk - 1 }));

  const explore = one('mobility-balance', 'sway-explore');
  assert.equal(explore.check({ stance: 'two', tried: ['two/open/firm/0'] }), 'Switch the stance to one leg first.');
  assert.equal(explore.check({ stance: 'one', tried: ['two/open/firm/0', 'one/open/firm/0'] }), 'Now close the eyes.');
  assert.equal(explore.check({ stance: 'one', tried: ['two/open/firm/0', 'one/open/firm/0', 'one/closed/firm/0'] }), true);
  assert.equal(explore.check({ stance: 'one', tried: ['two/open/firm/0', 'two/closed/firm/0', 'one/closed/soft/0'] }), true);
  assert.equal(explore.check(explore.solution), true);
  const ex = flat(explore.explain);
  assert.ok(ex.includes('about 0.5 cm') && ex.includes('to 2.6 cm'), ex);
  near(sway({ ...base, stance: 'one', eyes: 'closed' }), 2.64, 1e-9);
  assert.ok(sway({ ...base, stance: 'one' }) / sway(base) > 2 && sway({ ...base, stance: 'one', eyes: 'closed' }) / sway({ ...base, stance: 'one' }) > 2, '"more than doubles", then "roughly doubles again"');
  assert.equal(balanceOf({ ...base, stance: 'one', eyes: 'closed' }).steady, false, '"too much to hold"');

  const practice = one('mobility-balance', 'practice');
  assert.deepEqual([practice.widget.stance, practice.widget.eyes, practice.widget.ground], ['one', 'closed', 'firm']);
  assert.deepEqual(practice.widget.controls, ['practice']);
  const accepted = [];
  for (let wk = 0; wk <= 8; wk++) {
    const set = { stance: 'one', eyes: 'closed', ground: 'firm', practice: wk };
    const reach = sway(set) * 2.2;
    const res = practice.check({ ...set, steady: reach <= 4, reach: Math.round(reach * 10) / 10, limit: 4 });
    assert.equal(res === true, reach <= 4, `practice ${wk} weeks: reach ${reach}`);
    if (res === true) accepted.push(wk);
    else assert.ok(res.includes(`After ${wk} week${wk === 1 ? '' : 's'}`) && res.includes(`${Math.round(reach * 10) / 10} cm`) && res.includes('4 cm limit'), res);
  }
  assert.deepEqual(accepted, [5, 6, 7, 8]);
  assert.equal(practice.solution.practice, 5);
  assert.ok(flat(practice.explain).includes('about **5 weeks**'));

  // the three senses are named on the teaching screen that follows the exploration
  assert.match(flat(one('mobility-balance', 'teach-balance').text), /the \*\*eyes\*\*; - the \*\*inner ear\*\*; - the sensors in soles, muscles and joints, a sense called \*\*proprioception\*\*/);
});

test('lesson 4: injuries, stretching, posture, the lower back and its warning signs', () => {
  const hook = one('mobility-balance', 'hook');
  assert.deepEqual(hook.solution.values, [[96, 55, 32]]);
  assert.equal(hook.check(hook.solution), true);
  const hx = flat(hook.explain);
  assert.ok(hx.includes('Stretching: **96**') && hx.includes('**55**') && hx.includes('**32**, fewer than a third'), hx);
  assert.ok(32 < 100 / 3);
  const stretch = one('mobility-balance', 'stretch-does');
  for (const item of stretch.items) assert.equal(item.bucket === 0, /how far a joint can move|Keeps the range/.test(item.text), item.text);
  assert.ok(stretch.items.some((i) => /about 1 point on a 100-point/.test(i.why || '')) && stretch.items.some((i) => /96 injuries for every 100/.test(i.why || '')));
  assert.match(correctOption(one('mobility-balance', 'warm-up')).text, /warm-up/);
  const posture = flat(one('mobility-balance', 'posture').text);
  assert.match(posture, /Studies have not found one "correct" posture/);
  assert.match(posture, /evidence that slouching causes back pain is weak/);
  assert.match(posture, /your best posture is your next\s+posture/);
  assert.match(correctOption(one('mobility-balance', 'desk')).text, /Change position often/);

  // the part of the spine to tap: only the lumbar vertebrae
  const where = one('mobility-balance', 'where-back');
  const spine = expandIds(['spine']);
  assert.deepEqual(spine.slice().sort(), ['cervical-spine', 'lumbar-spine', 'sacrum', 'tailbone', 'thoracic-spine']);
  for (const id of spine) {
    const res = where.check({ picked: id, nameThe: structureInfo(id).name });
    assert.equal(res === true, id === 'lumbar-spine', `where-back: ${id}`);
  }
  assert.equal(where.widget.answer, 'lumbar-spine');
  assert.equal(where.widget.view, 'back-torso');
  assert.match(flat(where.text), /24 movable bones .* seven in the neck, twelve in the chest and five in the\s+lower back/);
  assert.equal(7 + 12 + 5, 24);
  assert.match(flat(where.text), /seen \*\*from behind\*\*/);

  // the scan: of the four marked parts only the disc is accepted, and each wrong one is told what it is
  const mri = one('mobility-balance', 'mri');
  const PARTS = { disc: true, vertebra: /one of the bones/, canal: /nerves run in fluid/, fat: /fat under the skin/ };
  assert.deepEqual(mri.widget.hotspots.map((h) => h.id).sort(), Object.keys(PARTS).sort());
  for (const [part, expected] of Object.entries(PARTS)) {
    const res = mri.check({ picked: part });
    if (expected === true) assert.equal(res, true); else assert.match(res, expected);
  }
  assert.equal(typeof mri.check({ picked: null }), 'string');
  assert.equal(mri.check(mri.solution), true);
  assert.doesNotMatch(mri.widget.alt, /disc|vertebra/i, 'the description does not name the answer');
  for (const h of mri.widget.hotspots) { assert.ok(h.r >= 0.05 && h.x > h.r && h.x < 1 - h.r && h.y > 0 && h.y < 1); assert.doesNotMatch(h.alt, /disc|vertebra/i); }
  for (const a of mri.widget.hotspots) for (const b of mri.widget.hotspots) if (a.id < b.id) assert.ok(Math.hypot(a.x - b.x, (a.y - b.y) * (586 / 500)) >= (a.r + b.r) * 0.9, `${a.id} and ${b.id} hardly overlap`);
  assert.match(flat(mri.text), /seen from the side\. The person\s+is facing left/);

  const serious = one('mobility-balance', 'back-serious');
  assert.ok(flat(serious.text).includes('In 2020, low back pain affected 619 million people'));
  assert.ok(flat(serious.text).includes(`in about **${FACTS.backPain.seriousPer100}** a serious cause is found`) && flat(serious.text).includes(`in roughly **${FACTS.backPain.nonSpecific}** no specific damaged structure can be found`), serious.text);
  assert.deepEqual(serious.figures[0].data.map((d) => d.value), [FACTS.backPain.seriousPer100, FACTS.backPain.nonSpecific]);

  const care = one('mobility-balance', 'back-care');
  assert.equal(care.tone, 'sober');
  const URGENT = /Numbness around the genitals|bladder or bowel|both legs|after a fall or a crash|with a fever/;
  for (const item of care.items) assert.equal(item.bucket === 1, URGENT.test(item.text), item.text);
  assert.equal(care.items.filter((i) => i.bucket === 1).length, 5);
  // reviewer: the NHS list (2026) also has difficulty passing urine, numbness in both legs and a serious accident
  assert.match(flat(care.explain), /Numbness in the saddle area, new trouble passing urine, loss of\s+bladder or bowel control, or weakness or numbness in both legs:\s+\*\*call your emergency number or go to an emergency department\s+now\.\*\*/);
  assert.match(flat(care.explain), /back pain after a serious accident/);
  assert.ok(care.items.some((i) => i.bucket === 1 && /trouble passing urine/.test(i.text)));
  assert.match(flat(care.text), /stay as active as\s+you can/);
});

test('lesson 4: falls prevented and scan findings, re-solved from the text and the chart', () => {
  eachVariant('mobility-balance', 'falls', (step) => {
    const text = flat(step.text);
    const pct = Number(grab(/cut the number of falls by \*\*(\d+)%\*\*/, text)[0]);
    assert.equal(pct, FACTS.fallsReduction);
    const falls = Number(grab(/have \*\*(\d+) falls\*\*/, text)[0]);
    assert.equal(step.answer * 100, falls * pct);
    assert.ok(Number.isInteger(step.answer));
    assert.deepEqual(step.wrong.map((w) => w[0]), [falls - step.answer]);
    assert.ok(step.explain.includes(`= ${step.answer}$ falls prevented, leaving about ${falls - step.answer}`));
    assert.match(step.explain, /at least 3 days a week/);
    assert.match(text, /between a quarter and a third of people over 65 fall/);
  });
  const seen = new Set();
  eachVariant('mobility-balance', 'scans', (step) => {
    const text = flat(step.text);
    const [n, age] = grab(/Suppose \*\*(\d+)\*\* pain-free (\d+)-year-olds/, text).map(Number);
    const finding = /"disc degeneration"/.test(grab(/would show (.+?)\?\*\*/, text)[0]) ? 'degeneration' : 'bulge';
    seen.add(`${age}/${finding}`);
    const pct = FACTS.scans[age][finding];
    assert.equal(step.answer * 100, pct * n);
    assert.ok(Number.isInteger(step.answer));
    // the chart beside the question shows the same numbers
    const fig = step.figures[0];
    const col = fig.categories.indexOf(`Age ${age}`);
    const series = fig.series.find((s) => s.name.toLowerCase().includes(finding === 'degeneration' ? 'degeneration' : 'bulge'));
    assert.equal(series.values[col], pct);
    assert.ok(fig.alt.includes(`${pct} percent at age ${age}`));
    assert.ok(step.explain.includes(`${pct}\\% \\times ${n} = ${step.answer}$ people, none of them in pain`));
    assert.ok(step.hints[0].includes(`${pct}%`));
  });
  assert.equal(seen.size, 6);
});

/* ---------------------------------------------------------------------------------------- lesson 5 */

/**
 * Capacity after hard sessions at the start of the given days, worked out exactly: between sessions the
 * fatigue, the gain still to be delivered and the gain already banked follow simple exponentials.
 */
function capacityAt(days, time) {
  const A = 12; const TC = 1.2; const G = 10; const TOO = 9; const TP = 1; const TF = 5;
  let fatigue = 0; let pending = 0; let banked = 0; let t = 0;
  const advance = (to) => {
    const dt = to - t;
    if (dt <= 0) return;
    const eF = Math.exp(-dt / TF); const eP = Math.exp(-dt / TP);
    banked = banked * eF + pending * (TF / (TF - TP)) * (eF - eP);
    pending *= eP;
    fatigue *= Math.exp(-dt / TC);
    t = to;
  };
  for (const d of days.slice().sort((a, b) => a - b)) {
    if (d - 1 >= time) break;
    advance(d - 1);
    pending += G * (1 - fatigue / TOO);
    fatigue += A;
  }
  advance(time);
  return 100 + banked - fatigue;
}

test('lesson 5: the recovery model, checked against an exact solution', () => {
  const plans = { none: [], one: [1], daily: [...Array(21)].map((_, i) => i + 1), third: [1, 4, 7, 10, 13, 16, 19], weekly: [1, 8, 15], late: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21], mwf: [1, 3, 5, 8, 10, 12, 15, 17, 19] };
  for (const [name, days] of Object.entries(plans)) {
    const r = recover(days);
    near(r.end, capacityAt(days, 21), 0.5, `${name}: capacity at the end`);
    for (const time of [2.5, 6.5, 9.75, 13.5, 17.25, 20.5]) near(r.level[time * 16], capacityAt(days, time), 0.6, `${name}: capacity after ${time} days`);
    assert.equal(r.sessions, days.length);
  }
  // one session: a dip, back to the start after about a day, a peak about three days later, then fading
  assert.equal(capacityAt([1], 1e-9) < 89, true);
  near(capacityAt([1], 1), 100, 1.5);
  let best = 0;
  for (let t = 0; t <= 21; t += 0.05) if (capacityAt([1], t) > capacityAt([1], best)) best = t;
  assert.ok(best > 2.5 && best < 4, `the peak comes after ${best} days`);
  assert.ok(capacityAt([1], best) > 104 && capacityAt([1], 14) < 101.5);
  // spacing: every second or third day beats once a week, and hard sessions every day gain nothing
  assert.ok(capacityAt(plans.third, 21) > 110 && capacityAt(plans.weekly, 21) < 106 && capacityAt(plans.late, 21) < 96 && capacityAt(plans.daily, 21) < 96);

  const single = one('training-recovery', 'one-session');
  assert.deepEqual(single.blanks.map((b) => b.answer), ['lower than', 'one day', 'three days', 'slowly fades']);
  assert.deepEqual(single.figures[0].days, [1]);
  const sx = flat(single.explain);
  assert.ok(sx.includes(`from ${Math.round(capacityAt([1], 1e-9))} back through 100 to a peak of about ${Math.round(capacityAt([1], best))} on day ${Math.floor(best) + 1}`), sx);
});

test('lesson 5: the two planning tasks accept exactly the schedules they ask for', () => {
  const spacing = one('training-recovery', 'spacing');
  const tooMuch = one('training-recovery', 'too-much');
  const rng = makeRng(20261114);
  const schedules = [[], [1], [1, 8, 15], [1, 4, 7, 10, 13, 16, 19], [1, 3, 5, 8, 10, 12, 15, 17, 19], [...Array(21)].map((_, i) => i + 1), [12, 13, 14, 15, 16, 17, 18, 19, 20, 21], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 3, 5, 7, 9, 11, 13, 15, 17, 19], [6, 7, 13, 14, 20, 21], [1, 4, 8, 11, 15, 18]];
  for (let k = 0; k < 400; k++) { const p = rng.float(0.1, 0.9); schedules.push([...Array(21)].map((_, i) => i + 1).filter(() => rng.bool(p))); }
  let ok = 0;
  let wasted = 0;
  for (const days of schedules) {
    const r = recover(days);
    const state = { days: r.days, sessions: r.sessions, end: r.end, longestRun: r.longestRun, longestGap: r.longestGap };
    const exact = capacityAt(days, 21);
    if (Math.abs(exact - 109.5) < 0.6 || Math.abs(exact - 101.5) < 0.6) continue;      // too close to a threshold for the two integrations to agree
    const a = spacing.check(state);
    assert.equal(a === true, Math.round(exact) >= 110, `spacing ${days.join()}: ${exact}`);
    if (a === true) ok++;
    else if (days.length) {
      assert.ok(a.includes(`Capacity ends at ${Math.round(r.end)}`), a);
      let run = 0; let longest = 0;
      for (let d = 1; d <= 21; d++) { run = days.includes(d) ? run + 1 : 0; longest = Math.max(longest, run); }
      if (longest >= 3) assert.ok(a.includes(`sessions on ${longest} days running`), a);
      else if (days.length < 5) assert.ok(a.includes(`only ${days.length} session`), a);
    } else assert.match(a, /Tap a day/);
    const b = tooMuch.check(state);
    assert.equal(b === true, days.length >= 10 && Math.round(exact) <= 101, `too-much ${days.join()}: ${exact}`);
    if (b === true) wasted++;
    else assert.match(b, days.length < 10 ? new RegExp(`That is ${days.length} session`) : new RegExp(`still ends at ${Math.round(r.end)}`));
  }
  assert.ok(ok >= 5 && wasted >= 5, `${ok} schedules reach 110, ${wasted} waste ten or more sessions`);
  for (const step of [spacing, tooMuch]) { const r = recover(step.solution.days); assert.equal(step.check({ ...r }), true, `${step.id}: the solution passes`); }
  assert.deepEqual(tooMuch.widget.days, spacing.solution.days, 'the second task starts from the good plan');
  const sx = flat(spacing.explain);
  assert.ok(sx.includes(`ends at about ${Math.round(capacityAt([1, 4, 7, 10, 13, 16, 19], 21))}`) && sx.includes(`about ${Math.round(capacityAt([1, 8, 15], 21))}, because`), sx);
  assert.ok(flat(tooMuch.explain).includes(`end at about ${Math.round(capacityAt(tooMuch.solution.days, 21))}, below the start`), tooMuch.explain);
  assert.match(flat(tooMuch.explain), /easy\s+movement such as walking needs no such gap/);
});

test('lesson 5: soreness against lactate, the sprain, the heat', () => {
  assert.match(correctOption(one('training-recovery', 'hook')).text, /A few days later/);
  assert.match(flat(one('training-recovery', 'soreness').text), /\*\*delayed-onset muscle soreness\*\*\. Its cause is microscopic\s+damage: tiny tears and disruption inside muscle fibres/);
  const curve = one('training-recovery', 'soreness-curve');
  const [lactate, sore] = curve.figures[0].fns.map((f) => compile(f.expr, { vars: ['x'] }));
  assert.ok(lactate({ x: 1 }) / lactate({ x: 0 }) < 0.1, 'an hour later, less than a tenth of the extra lactate is left');
  let peak = 0;
  for (let h = 0; h <= 144; h++) if (sore({ x: h }) > sore({ x: peak })) peak = h;
  assert.equal(peak, 48);
  assert.ok(peak >= FACTS.doms.peak[0] && peak <= FACTS.doms.peak[1]);
  assert.ok(sore({ x: 1 }) < 0.01 && sore({ x: 144 }) < 1 && sore({ x: 24 }) > 3);
  assert.deepEqual(curve.blanks.map((b) => b.answer), ['almost gone', '48', 'cannot']);
  assert.ok(flat(curve.explain).includes('peaks 24 to 72 hours'));
  assert.match(correctOption(one('training-recovery', 'sprain')).text, /protect it for the first days, then start gentle movement/);
  assert.match(flat(one('training-recovery', 'sprain').explain), /Many health services still teach\s+RICE or a version of it, so advice differs/);
  const heat = one('training-recovery', 'heat');
  assert.equal(heat.tone, 'sober');
  // reviewer: "drink when thirsty" (sports medicine) and "do not wait for thirst" (public-health heat advice) differ,
  // so the graded option is the part both agree on, and the over-drinking option stays wrong for both
  for (const o of heat.options) assert.equal(!!o.correct, /Slow down|Carry water and drink regularly|as an emergency/.test(o.text), o.text);
  assert.ok(!heat.options.some((o) => o.correct && /thirst/i.test(o.text)), 'no graded option turns on thirst');
  assert.match(flat(heat.explain), /call the emergency number and cool them fast/);
  const parts = one('training-recovery', 'recovery-parts');
  for (const o of parts.options) assert.equal(!!o.correct, /^Sleep$|Enough food|Easy days/.test(o.text), o.text);
});

/** What each pain calls for, decided here from its wording. */
function painKind(text) {
  if (/Pressure in the chest|confused|slurred/.test(text)) return 'emergency';
  if (/sudden sharp|swells within the hour|one shin|One knee/.test(text)) return 'stop';
  if (/[Bb]oth|ache dully/.test(text)) return 'sore';
  return null;
}

test('lesson 5: which pain is which, and the size of a jump in load', () => {
  const kinds = new Set();
  for (const p of H.PAINS) assert.equal(p.kind, painKind(p.text), p.text);
  const n = eachVariant('training-recovery', 'pain-sort', (step) => {
    assert.equal(step.tone, 'sober');
    const scenario = grab(/> (.+)$/, flat(step.text))[0];
    const kind = painKind(scenario);
    assert.ok(kind, `the scenario can be classified: ${scenario}`);
    kinds.add(kind);
    const ANSWER = { sore: /Ordinary training soreness/, stop: /Stop, rest it/, emergency: /call the emergency number now/ };
    assert.match(correctOption(step).text, ANSWER[kind]);
    assert.equal(step.options.length, 3);
    if (kind === 'emergency') assert.match(step.explain, /\*\*Stop and call your emergency number now\.\*\*/);
    if (kind === 'stop') assert.match(step.explain, /have it examined/);
    if (kind === 'sore') assert.match(step.explain, /delayed-onset muscle soreness/);
    for (const o of step.options) if (!o.correct) { assert.ok(o.why.length > 40); if (kind === 'emergency') assert.match(o.why, /need help now/); else assert.doesNotMatch(o.why, /need help now/); }
  });
  assert.equal(kinds.size, 3);
  assert.ok(n >= H.PAINS.length);
  eachVariant('training-recovery', 'ramp', (step) => {
    const text = flat(step.text);
    const [a, unit] = grab(/about \*\*(\d+) (km|lengths) a week\*\*/, text);
    const b = Number(grab(/This week it was \*\*(\d+) (?:km|lengths)\*\*/, text)[0]);
    const before = Number(a);
    assert.ok(b > before);
    near(step.answer, ((b - before) / before) * 100, 1e-9);
    assert.ok(Number.isInteger(step.answer) && step.answer >= 10 && step.answer <= 100);
    assert.equal(step.unit, '%');
    assert.ok(step.explain.includes(`\\frac{${b - before}}{${before}} = ${step.answer}\\%`));
    assert.match(step.explain, step.answer >= 50 ? /classic route to an overuse injury/ : step.answer <= 10 ? /small step like this/ : /sizeable step/);
    for (const [slip, why] of step.wrong) { assert.ok(Math.abs(slip - step.answer) > 1); assert.ok(why.includes(unit) || why.includes(String(before))); }
  });
});

/* ---------------------------------------------------------------------------------------- lesson 6 */

/** Totals of a week plan, added up here from the activity list of the step. */
function week(plan, activities) {
  const byId = Object.fromEntries(activities.map((a) => [a.id, a]));
  let minutes = 0; let strength = 0; let balance = 0;
  const used = [];
  for (const day of plan) {
    const items = day.map((id) => byId[id]);
    used.push(items.reduce((t, a) => t + a.minutes, 0));
    for (const a of items) minutes += a.kind === 'moderate' ? a.minutes : a.kind === 'vigorous' ? 2 * a.minutes : 0;
    if (items.some((a) => a.strength)) strength++;
    if (items.some((a) => a.balance)) balance++;
  }
  return { minutes, strength, balance, used };
}

test('lesson 6: the week planner adds up correctly and its two tasks accept exactly the weeks that meet the recommendation', () => {
  for (const id of ['planner', 'planner-older']) {
    const step = one('habits', id);
    const { activities, free, need } = step.widget;
    assert.equal(need.minutes, FACTS.who.moderate[0]);
    assert.equal(need.strengthDays, FACTS.who.strengthDays);
    assert.equal(need.balanceDays || 0, id === 'planner-older' ? FACTS.who.olderBalanceDays : 0);
    const rng = makeRng(id.length * 977);
    const plans = [step.solution.plan, free.map(() => [])];
    for (let k = 0; k < 600; k++) {
      // fill each day at random with activities that fit its free time
      plans.push(free.map((minutes) => {
        const day = [];
        let left = minutes;
        for (let tries = 0; tries < 4; tries++) { const a = rng.pick(activities); if (a.minutes <= left && rng.bool(0.55)) { day.push(a.id); left -= a.minutes; } }
        return day;
      }));
    }
    let met = 0;
    for (const plan of plans) {
      const mine = week(plan, activities);
      mine.used.forEach((u, d) => assert.ok(u <= free[d], 'the plan fits the free time'));
      const theirs = tally(plan, activities, need);
      assert.equal(theirs.equivalent, mine.minutes); assert.equal(theirs.strengthDays, mine.strength); assert.equal(theirs.balanceDays, mine.balance);
      const meets = mine.minutes >= 150 && mine.strength >= 2 && mine.balance >= (need.balanceDays || 0);
      assert.equal(theirs.meets, meets);
      const res = step.check({ plan, ...theirs });
      assert.equal(res === true, meets, `${id}: ${JSON.stringify(plan)}`);
      if (res === true) met++;
      else if (theirs.count) {
        if (mine.minutes < 150) assert.ok(res.includes(`${150 - mine.minutes} more moderate-equivalent minutes`), res); else assert.doesNotMatch(res, /moderate-equivalent/);
        if (mine.strength < 2) assert.ok(res.includes(`strength on ${2 - mine.strength} more day`), res); else assert.doesNotMatch(res, /strength on/);
        if (need.balanceDays && mine.balance < need.balanceDays) assert.ok(res.includes(`balance on ${need.balanceDays - mine.balance} more day`), res); else assert.doesNotMatch(res, /balance on/);
      } else assert.match(res, /Pick a day/);
    }
    assert.ok(met >= 3, `${id}: ${met} random weeks meet the recommendation, so the task is not a needle in a haystack`);
    const sol = week(step.solution.plan, activities);
    assert.ok(sol.minutes >= 150 && sol.minutes <= 300 && sol.strength >= 2);
  }
  // what the explanations say about the two example weeks
  const rosa = one('habits', 'planner');
  const r = week(rosa.solution.plan, rosa.widget.activities);
  assert.equal(r.minutes, 160);
  assert.ok(flat(rosa.explain).includes('120 + 2 × 20 = 160 minutes') && flat(rosa.explain).includes('strength on two'), rosa.explain);
  assert.equal(rosa.widget.free[2], 0, '"none on Wednesday"');
  assert.match(flat(rosa.explain), /a walk on Monday and Thursday, strength exercises\s+on Tuesday and Friday, the dance class on Saturday and a short run on\s+Sunday/);
  assert.deepEqual(rosa.solution.plan.map((d) => d.join('+')), ['walk', 'strength', '', 'walk', 'strength', 'dance', 'run']);
  const kenji = one('habits', 'planner-older');
  const k = week(kenji.solution.plan, kenji.widget.activities);
  assert.deepEqual([k.minutes, k.balance], [150, 3]);
  assert.equal(kenji.widget.free[3], 0, '"Thursday is taken"');
  assert.equal(kenji.solution.plan.filter((d) => d.includes('walk')).length, 4, '"brisk walks on four days"');
  assert.match(flat(kenji.text), /Kenji is 72/);
});

test('lesson 6: habits, if-then plans and building up', () => {
  const hook = one('habits', 'hook');
  assert.equal(hook.answer, FACTS.habit.median);
  assert.ok(flat(hook.explain).includes('**66 days**') && flat(hook.explain).includes('from 18 to 254') && flat(hook.explain).includes('"21 days" comes from a 1960'));
  assert.match(correctOption(one('habits', 'gap')).text, /deciding afresh each day/);
  const loop = one('habits', 'loop');
  assert.deepEqual(loop.pairs.map((p) => p[0]), ['Cue', 'Routine', 'Reward', 'Repetition']);
  assert.match(loop.pairs[0][1], /kettle is switched on/); assert.match(loop.pairs[1][1], /Ten squats/); assert.match(loop.pairs[2][1], /sip of tea/);
  // the curve: nearly flat (95%) after three time constants, which the slider moves from 18 to about 250 days
  const curve = one('habits', 'curve');
  const fig = curve.figures[0];
  const auto = compile(fig.fns[0].expr, { vars: ['x', 'd'] });
  const days = fig.params.d;
  for (const d of [days.min, days.value, days.max]) {
    near(auto({ x: d, d }), 95, 0.1, 'the slider value is the day on which the curve is 95% of the way up');
    assert.ok(auto({ x: 20, d }) - auto({ x: 0, d }) > auto({ x: 60, d }) - auto({ x: 40, d }), 'the first 20 days add more than a later 20');
  }
  assert.equal(days.value, FACTS.habit.median);
  assert.equal(days.min, FACTS.habit.range[0]);
  near(days.max, FACTS.habit.range[1], 3);
  assert.match(correctOption(curve).text, /fastest at the start and then flatten/);
  assert.match(correctOption(one('habits', 'missed')).text, /Nothing measurable/);
  const easy = one('habits', 'easy');
  for (const item of easy.items) assert.equal(item.bucket === 0, /enjoy|friend|laid out|small enough/.test(item.text), item.text);

  eachVariant('habits', 'if-then', (step) => {
    const isPlan = (t) => /^(When|After|If) [^,]+, I will [a-z]/.test(t);
    for (const o of step.options) assert.equal(!!o.correct, isPlan(o.text), o.text);
    assert.equal(step.options.length, 4);
    assert.match(flat(step.explain), /"When X happens, I will do Y"/);
  });
  for (const item of H.IF_THEN) for (const other of [item.wish, item.vague, item.slogan]) assert.doesNotMatch(other, /^(When|After|If) .*I will/);

  eachVariant('habits', 'build-up', (step) => {
    const text = flat(step.text);
    const now = Number(grab(/for \*\*(\d+) minutes a week\*\*/, text)[0]);
    const add = Number(grab(/\*\*(\d+) more minutes each week\*\*/, text)[0]);
    assert.match(text, /minimum of \*\*150 minutes\*\*/);
    let weeks = 0;
    for (let m = now; m < 150; m += add) weeks++;
    assert.equal(step.answer, weeks);
    assert.equal(now + weeks * add, 150, 'the steps land exactly on 150');
    assert.ok(weeks >= 2 && weeks <= 8);
    assert.ok(step.explain.includes(`${150 - now} \\div ${add} = ${weeks}$ weeks`));
    for (const [slip] of step.wrong) assert.notEqual(slip, weeks);
  });
  assert.match(one('habits', 'reflect').model, /cue that already exists/);
});

/* ------------------------------------------------------------------------------------------ safety */

test('safety: the disclaimer, no requests for personal health data, sober steps, and nothing about weight loss', () => {
  const DISCLAIMER = '> **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.';
  let found = 0;
  const personal = /\b(your (own )?(weight|height|age|bmi|blood pressure|waist|calories|food intake|medicines?|medication|symptoms|cycle|mood))\b|\benter your\b|\btype (in )?your\b|how (much|many) do you (weigh|eat|drink|sleep)|how old are you|how tall are you/i;
  const diet = /\b(lose weight|(?<!unexplained )weight loss|burn off|slim|fat-burning workout|calorie deficit|ideal weight|target weight|beach body|guilt-free|junk food|clean eating)\b/i;
  const stigma = /\bthe obese\b|\bnormal people\b|\bcommitted suicide\b/i;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < 40; k++) {
        const s = resolveStep(step, makeRng(301 + k * 53), step.id);
        const texts = visible(s);
        for (const t of texts) {
          if (t.includes('A note before we start')) { found++; assert.ok(t.replace(/\s*\n\s*/g, ' ').includes(DISCLAIMER), 'the disclaimer is worded exactly'); assert.equal(id, 'why-move'); assert.equal(lesson.steps.indexOf(step), 0); }
          assert.ok(!personal.test(t), `${id}/${step.id} asks for personal health data: "${t.slice(0, 120)}"`);
          assert.ok(!diet.test(t), `${id}/${step.id} uses diet-culture wording: "${t.slice(0, 120)}"`);
          assert.ok(!stigma.test(t), `${id}/${step.id}: "${t.slice(0, 120)}"`);
          if (/suicid|self-harm/i.test(t)) assert.fail(`${id}/${step.id} mentions suicide or self-harm: it would need tone 'sober' and the help pointers`);
          if (/emergency number|emergency department/i.test(t)) assert.equal(s.tone || lesson.tone, 'sober', `${id}/${step.id} tells the learner to call for help, so it is sober`);
        }
        if (!step.gen) break;
      }
      // no step grades the learner's own body: sliders and numerics are about studies and example people
      if (['numeric', 'slider'].includes(step.type)) assert.ok(step.gen || step.mode === 'predict', `${id}/${step.id}`);
    }
  }
  assert.equal(found, 1, 'the disclaimer appears exactly once');
  // the note about checking with a professional is in the first lesson and wherever a lesson comes close to a programme
  assert.match(flat(one('why-move', 'guideline').text), /check\s+with a health professional/);
  assert.match(flat(one('strength', 'technique').explain), /check with a professional/);
  assert.match(flat(one('habits', 'planner-older').explain), /ask a\s+doctor or physiotherapist/);
  // heart-rate bands differ between bodies, so no graded step asks for one
  for (const lesson of Object.values(lessons)) for (const step of lesson.steps) if (step.type === 'numeric') for (let k = 0; k < 30; k++) assert.doesNotMatch(flat(resolveStep(step, makeRng(k), step.id).text), /% of (your |their |the )?maximum/);
});

test('every body-map structure used exists, and every photo has a licence and a credit', () => {
  const known = new Set([...structureIds(), 'skeleton', 'muscles', 'spine', 'organs', 'skin']);
  const manifestPath = fileURLToPath(new URL('../content/media/fitness/manifest.json', import.meta.url));
  const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { images: {} };
  const used = new Set();
  let maps = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(3), step.id);
      const specs = [...(s.figures || []), ...(s.widget ? [s.widget] : []), ...(s.options || []).map((o) => o.figure).filter(Boolean)];
      for (const spec of specs) {
        assert.ok(spec.alt && spec.alt.length > 20, `${id}/${step.id}: the ${spec.type} has a description`);
        if (spec.type === 'body-map') {
          maps++;
          const ids = [...(spec.show || []), ...(spec.hide || []), ...(spec.ghost || []), ...(spec.pickable || []), ...(spec.labels || []).map((l) => (typeof l === 'string' ? l : l.id)).filter(Boolean), ...(spec.groups || []).flatMap((g) => g.ids), ...(spec.answer ? [].concat(spec.answer) : [])];
          for (const sid of ids) assert.ok(known.has(sid) || expandIds([sid]).every((x) => known.has(x)), `${id}/${step.id}: body-map id "${sid}" exists`);
          if (spec.answer) assert.ok(structureIds().includes(spec.answer));
        }
        if (spec.type === 'photo') {
          const key = /content\/media\/fitness\/([a-z0-9-]+)\.jpg/.exec(spec.src);
          assert.ok(key, `${id}/${step.id}: a photo comes from the course's own media folder`);
          const rec = manifest.images[key[1]];
          assert.ok(rec, `${key[1]} is in the manifest`);
          assert.ok(rec.license && /commons\.wikimedia\.org/.test(rec.sourceUrl), `${key[1]}: licence and source`);
          assert.ok(rec.publicDomain || rec.author, `${key[1]}: credit`);
          assert.equal(spec.license, rec.license);
          used.add(key[1]);
        }
      }
    }
  }
  assert.ok(maps >= 3, 'the body diagram is used where a question has a "where"');
  assert.deepEqual([...used].sort(), Object.keys(manifest.images).sort(), 'every picture in the manifest is used, and nothing else');
});

/* ---------------------------------------------------------------------------- reviewer's additions */

test('reviewer: published figures typed again from the sources, and the honesty of the models', () => {
  // Brinjikji et al., AJNR 2015, table 2, by decade from 20 to 80
  const DEGENERATION = [37, 52, 68, 80, 88, 93, 96];
  const BULGE = [30, 40, 50, 60, 69, 77, 84];
  assert.deepEqual(H.SPINE_SCANS.ages.map((a) => DEGENERATION[(a - 20) / 10]), H.SPINE_SCANS.degeneration);
  assert.deepEqual(H.SPINE_SCANS.ages.map((a) => BULGE[(a - 20) / 10]), H.SPINE_SCANS.bulge);
  // Arem et al. 2015: hazard ratios; only the first five groups are drawn or graded
  assert.deepEqual(H.DOSE.map((d) => d.risk), [100, 80, 69, 63, 61, 61, 69]);
  // Buist et al. 2008: 20.8% v 20.3% injured, so "no fewer injuries"
  assert.ok(20.8 >= 20.3);
  eachVariant('training-recovery', 'ramp', (step) => assert.match(step.explain, /a trial that tested it found no fewer injuries/));

  // heart-rate formulas: rough, and medicines change heart rate
  const spread = flat(one('aerobic', 'spread').explain);
  assert.match(spread, /spread of about 10 beats a minute/);
  assert.match(spread, /beta blockers,\s+slow the heart, and then heart-rate targets do not apply/);
  eachVariant('aerobic', 'max-rate', (step) => assert.match(step.explain, /Both are averages/));
  eachVariant('aerobic', 'pulse', (step) => { assert.match(flat(step.text), /Nothing you\s+count is asked for or stored/); assert.match(flat(step.text), /inside of\s+your wrist/); assert.doesNotMatch(flat(step.text), /neck/); });

  // the models say that they are models
  assert.match(flat(one('aerobic', 'effort-explore').text), /a model of an adult .*real bodies differ/);
  assert.match(flat(one('aerobic', 'fuel').explain), /In this model/);
  assert.match(flat(one('strength', 'overload-explore').text), /This is a model/);
  assert.match(flat(one('strength', 'bone-bank').text), /simplified picture/);
  assert.match(flat(one('mobility-balance', 'sway-explore').explain), /^In this model/);
  assert.match(flat(one('mobility-balance', 'practice').explain), /numbers are\s+illustrative/);
  assert.match(flat(one('training-recovery', 'one-session').text), /a model of/);
  // the graded reading of the one-session chart hides the widget's own sentence, which would name the dip, the day of the peak and the fading (three of its four blanks);
  // the teaching screen before it keeps that sentence
  assert.equal(one('training-recovery', 'one-session').figure.note, false);
  assert.notEqual(one('training-recovery', 'name-it').figure.note, false);
  assert.match(readFileSync(new URL('../src/widgets/training-sim.js', import.meta.url), 'utf8'), /spec\.note !== false\) fr\.el\.appendChild\(note\)/);
  assert.match(flat(one('training-recovery', 'too-much').explain), /Two cautions about this model/);
  assert.match(flat(one('training-recovery', 'soreness-curve').text), /The typical course of two things/);

  // nothing is overclaimed about ageing or growth hormone
  assert.doesNotMatch(flat(one('strength', 'ninety').explain), /Most of what is blamed on age/);
  assert.doesNotMatch(flat(one('training-recovery', 'recovery-parts').explain), /most of the day's release/);
});

test('reviewer: safety wording a learner might act on', () => {
  // the heatstroke scenario does not teach that sweating rules heatstroke out (in exertional heatstroke people often still sweat)
  for (const p of H.PAINS) assert.doesNotMatch(p.text, /stops sweating/);
  assert.equal(H.PAINS.filter((p) => p.kind === 'emergency').length, 3);
  // soreness: the rare dangerous look-alike is named
  assert.match(flat(one('training-recovery', 'soreness-curve').explain), /dark, cola-coloured urine .* needs medical\s+help the same day/);
  // sprain: protection, then early gentle loading; RICE is said to be still taught; red flags for an examination
  const sprain = one('training-recovery', 'sprain');
  assert.match(flat(sprain.explain), /cannot take weight, looks misshapen, is numb or is\s+not improving needs to be examined/);
  assert.match(flat(sprain.explain), /evidence on\s+ice is thin either way/);
  // nobody is told to push through pain or to exercise with warning signs
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < (step.gen ? 40 : 1); k++) {
        const s = resolveStep(step, makeRng(977 + k * 31), step.id);
        for (const o of s.options || []) if (/[Pp]ush through|Keep going through|painkiller before/.test(o.text)) assert.ok(!o.correct, `${id}/${step.id}: "${o.text}" is never a right answer`);
        for (const item of s.items || []) if (typeof item === 'object' && /[Pp]ush through/.test(item.text || '')) assert.fail(`${id}/${step.id}`);
      }
    }
  }
  // the MRI description matches the picture: the upper discs are not darker than the bone
  const mri = one('mobility-balance', 'mri');
  assert.doesNotMatch(mri.widget.alt, /thin darker pads/);
  assert.doesNotMatch(mri.check({ picked: 'vertebra' }), /darker/);
});

/* ----------------------------------------------------------------------------- teach before you ask */

/**
 * The teaching screens of the course that a graded step leans on: [teaching step, the step it serves, what
 * that step needs to find on it]. All but `guideline` were added in the teach-first revision; `name-it`,
 * `posture`, `back-serious` and `soreness` are older steps that became teaching screens then.
 */
const TEACHING = {
  'why-move': [
    ['teach-dose-response', 'dose-steps', [/\*\*dose–response\s+curve\*\*/, /biggest gain goes to whoever\s+moves from none to some/, /compares people as they are/]],
    ['teach-benefits', 'benefits', [/heart attack and stroke/, /type 2 diabetes/, /colon and breast cancer/, /depression and dementia/, /falls in older age/, /need just as much sleep/, /sweat\s+is water and salt for cooling/]],
    ['teach-intensity', 'intensity-sort', [/\*\*Light\*\* \(can talk and sing\)/, /\*\*Moderate\*\* \(can talk, but not sing\)/, /\*\*Vigorous\*\* \(only a few words between breaths\)/, /relative to the person/]],
    ['guideline', 'equivalent', [/One vigorous minute counts as two moderate ones/, /bouts of any length/]],
    ['example-equivalent', 'equivalent', [/Vigorous minutes count double: 2 × 45 = 90/, /70 \+ 90 = \*\*160 moderate-equivalent minutes\*\*/]],
    ['example-equivalent', 'meets', [/\*\*aerobic\*\* part/, /160 reaches the minimum of 150/, /1 day is short of the 2 recommended/]],
    ['teach-everybody', 'everybody', [/Doing some physical activity is better than doing none/, /Start with small amounts and build up gradually/, /disability or a long-term condition, adapted to what they can do/, /adult amounts still apply/]],
  ],
  aerobic: [
    ['teach-output', 'output', [/\*\*Heart rate\*\*/, /\*\*Stroke volume\*\*: the blood pumped by one beat/, /\*\*Cardiac output\*\*: the blood pumped in a minute/, /190 × 100 mL = 19,000 mL, which is \*\*19 litres a minute\*\*/]],
    ['teach-adaptations', 'adaptations', [/stroke volume goes up, so the same supply takes fewer beats, at rest too/, /\*\*Capillaries\*\*: more grow around each muscle fibre, a shorter path for oxygen/, /\*\*Mitochondria\*\*: the fibres build more, so more fuel is burned with oxygen/, /\*\*VO₂ max\*\*/]],
    ['example-max-rate', 'max-rate', [/208 - 0\.7 \\times \\text\{age\}/, /0\.7 × 55 = 38\.5/, /208 − 38\.5 = \*\*169\.5\*\*/]],
    ['example-max-rate', 'spread', [/Both are\s+averages/, /commonly 10 beats a\s+minute or more to either side, and training hardly changes it/]],
  ],
  strength: [
    ['teach-overload', 'overload-read', [/\*\*progressive overload\*\*/, /strength levels off, as in this model/, /each fibre grows thicker\. The number of fibres hardly changes/, /nerve learning/]],
    ['teach-log', 'log', [/\*\*repetition\*\* is one lift/, /\*\*set\*\* is a group of repetitions/, /\*\*load\*\* is the weight/, /2 × 5 = 10 lifts, each of 6 kg\. So 10 × 6 = \*\*60 kg\*\*/]],
    ['teach-log', 'which-overload', [/more load, more repetitions, or one more set/]],
    ['teach-counts', 'counts', [/work against a load until they are\s+tired counts/, /on 2 or more days\s+a week/]],
    ['teach-counts', 'chair', []],
    ['teach-technique', 'technique', [/light load before adding weight/, /Move under control, and keep breathing/, /Add load a little at a time/, /day or two before the same muscles work hard again/, /pain in a joint, is a signal to\s+stop/]],
  ],
  'mobility-balance': [
    ['teach-stretching', 'stretch-does', [/\*\*range of\s+motion\*\*: how far a joint can move/, /96 for every 100/, /about 1 point less on a 100-point scale/, /slightly reduces it for a while/, /not a warm-up/]],
    ['teach-stretching', 'warm-up', [/Easy movement that builds up is/]],
    ['teach-balance', 'practice', [/\*\*proprioception\*\*/]],
    ['posture', 'desk', [/staying in \*\*any\*\* position for a long time/]],
    ['back-serious', 'mri', [/"non-specific" back pain/]],
    ['teach-warning-signs', 'back-care', [/numbness around the genitals or buttocks/, /new trouble passing urine, or loss of bladder or bowel control/, /weakness or numbness in both legs/, /a fall or a crash/, /with a fever/, /\*\*Call your emergency number or go to an emergency department\s+now\*\*/]],
  ],
  'training-recovery': [
    ['name-it', 'one-session', [/\*\*stress, recovery,\s+adaptation\.\*\*/, /made-up\s+units/, /so capacity dips/]],
    ['teach-spacing', 'recovery-parts', [/Your two plans in the model showed the rule/, /hard\s+sessions need room/, /starts in the dip left by the last/, /alternate hard days with easy ones/]],
    ['soreness', 'soreness-curve', [/Lactic acid is the famous suspect/]],
    ['teach-pains', 'pain-sort', [/dull ache in the muscles that did the work/, /on both sides/, /sudden, sharp, one-sided, in a joint, swollen or worse each time/, /Chest pain or pressure, fainting, confusion, sudden weakness or trouble speaking/, /hot and confused in the heat/]],
    ['example-ramp', 'ramp', [/percentage of the \*\*old\*\*\s+load/, /20 − 16 = 4 km/, /4 ÷ 16 = 0\.25/, /\*\*25%\*\*/]],
  ],
  habits: [
    ['teach-habit', 'gap', [/needs a fresh decision every\s+day meets tiredness, weather and a full diary/]],
    ['teach-habit', 'loop', [/\*\*cue\*\*/, /\*\*routine\*\*/, /\*\*reward\*\*/, /Repeat it in the same setting/]],
    ['teach-habit-study', 'missed', [/A single missed day made no\s+measurable difference/, /Repeated misses,\s+of course, slow things down/]],
    ['teach-if-then', 'if-then', [/\*\*if-then plan\*\*/, /\*\*cue\*\* that will\s+certainly happen, and \*\*one specific action\*\*/, /\*\*A wish\*\*/, /\*\*A vague resolve\*\*/, /\*\*A slogan\*\*/]],
    ['teach-easy', 'easy', [/\*\*Easy\*\*: close, cheap, prepared/, /\*\*Pleasant\*\*/, /\*\*Small\*\*: small enough to survive a bad day/, /\*\*Specific\*\*: a cue and an action/, /Motivation comes and goes/]],
  ],
};

test('teach before you ask: every lesson teaches before its first graded step, and each teaching screen carries what the next question needs', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((s) => resolveStep(s, makeRng(1), s.id));
    const lastTask = steps.map((s) => s.type !== 'info').lastIndexOf(true);
    const role = (s, i) => (s.type === 'info' ? (i < lastTask ? 'teach' : 'closing') : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore');
    const roles = steps.map(role);
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: a teaching screen or an exploration comes before the first graded step`);
    assert.ok(roles.filter((r) => r === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((r) => r === 'predict').length <= 2, `${id}: the hook and the closing invitation are the only guesses`);
    for (const [teachId, servedId, needs] of TEACHING[id]) {
      const teach = raw(id, teachId);
      assert.equal(teach.type, 'info', `${id}/${teachId} is a teaching screen`);
      const at = lesson.steps.indexOf(teach);
      const served = lesson.steps.indexOf(raw(id, servedId));
      assert.ok(at < served, `${id}/${teachId} comes before ${servedId}`);
      const text = flat(teach.text);
      for (const re of needs) assert.match(text, re, `${id}/${teachId}`);
      const words = text.split(' ').length;
      assert.ok(words <= 175, `${id}/${teachId}: ${words} words is too long for one screen`);
    }
    // a guided discovery is followed by the screen that names what was found
    for (const [explore, named] of [['dose-explore', 'teach-dose-response'], ['effort-explore', 'teach-output'], ['overload-explore', 'teach-overload'], ['sway-explore', 'teach-balance'], ['too-much', 'teach-spacing']]) {
      const i = lesson.steps.findIndex((s) => s.id === explore);
      if (i >= 0) assert.equal(lesson.steps[i + 1].id, named, `${id}: ${named} follows ${explore}`);
    }
  }
  // sober screens that tell the learner when to call for help
  assert.equal(raw('mobility-balance', 'teach-warning-signs').tone, 'sober');
  assert.equal(raw('training-recovery', 'teach-pains').tone, 'sober');
});

test('teach before you ask: every item a generated question can draw is on a teaching screen above it, and no worked example is a question', () => {
  const lower = (t) => t.charAt(0).toLowerCase() + t.slice(1);
  // intensity-sort draws from ACTIVITIES: all eighteen are listed under their level
  const intensity = flat(raw('why-move', 'teach-intensity').text);
  for (const [level, items] of Object.entries(INTENSITY)) {
    const line = intensity.split(' - ').find((part) => part.startsWith(`**${level.charAt(0).toUpperCase()}${level.slice(1)}**`));
    assert.ok(line, `teach-intensity has a line for ${level}`);
    for (const item of items) assert.ok(line.includes(lower(item)), `teach-intensity lists "${item}" as ${level}`);
  }
  // counts draws from STRENGTHENING: all ten are listed on the right side, and the muscle the next step asks for is named on the figure
  const counts = flat(raw('strength', 'teach-counts').text);
  const [yesPart, noPart] = counts.split('**Does not count**');
  for (const [item, yes] of Object.entries(STRENGTHENS)) assert.ok((yes ? yesPart.split('**Counts**')[1] : noPart).includes(lower(item)), `teach-counts lists "${item}"`);
  const muscles = one('strength', 'teach-counts').figures[0];
  assert.ok(muscles.labels.some((l) => l.id === 'quadriceps' && /straighten the knee/.test(l.text)), 'the front thigh muscles are named, with what they do');
  assert.equal(raw('strength', 'chair').widget.answer, 'quadriceps');
  // pain-sort: the three answers are worded on the teaching screen exactly as in the options, and every scenario shows a feature it names
  const pains = flat(raw('training-recovery', 'teach-pains').text);
  for (const answer of Object.values(H.PAIN_ANSWERS)) assert.ok(pains.includes(answer), `teach-pains says "${answer}"`);
  const FEATURES = { sore: /[Bb]oth|ache dully/, stop: /sudden|sharp|[Oo]ne |swells|joint/, emergency: /chest|confused|slurred/ };
  for (const p of H.PAINS) assert.match(p.text, FEATURES[p.kind], p.text);
  // if-then: the taught example is of the form the question asks for, and is none of the six in the table
  const ifThen = flat(raw('habits', 'teach-if-then').text);
  const example = grab(/\*\*An if-then plan\*\*: "([^"]+)"/, ifThen)[0];
  assert.match(example, /^When [^,]+, I will [a-z]/);
  for (const item of H.IF_THEN) for (const line of Object.values(item)) assert.ok(!ifThen.includes(line), `teach-if-then does not give away "${line}"`);
  // the charts on teaching screens show the helper tables' numbers
  assert.deepEqual(one('mobility-balance', 'teach-stretching').figures[0].data.map((d) => d.value), [100, FACTS.injuries.stretching, FACTS.injuries.balance, FACTS.injuries.strength]);
  assert.deepEqual(one('strength', 'teach-log').figures[0].data.map((d) => d.value), [60, 70, 72, 90]);
  const week = one('why-move', 'example-equivalent').figures[0];
  assert.deepEqual([tally(week.plan, week.activities, week.need).equivalent, tally(week.plan, week.activities, week.need).strengthDays], [160, 1]);
  assert.match(flat(raw('habits', 'teach-habit-study').text), /96 volunteers.*typical volunteer \| 66 \|.*quickest \| 18 \|.*slowest \| 254 \|.*\| 21 \|/);
  // worked examples use numbers that the generated question after them cannot produce
  const never = (lesson, id, re) => { for (let k = 0; k < 300; k++) assert.doesNotMatch(flat(resolveStep(raw(lesson, id), makeRng(17 + k * 389), id).text), re, `${lesson}/${id} repeats its worked example`); };
  never('why-move', 'equivalent', /\*\*70 minutes\*\* of [a-z ]+ \(moderate\)|\*\*45 minutes\*\* of [a-z ]+ \(vigorous\)/);
  never('why-move', 'meets', /\b70 minutes of .* 45 minutes of/);
  never('aerobic', 'pulse', /\*\*11 beats in 10 seconds\*\*/);
  never('aerobic', 'output', /\*\*190 times a minute\*\*/);
  never('aerobic', 'max-rate', /who is 55\./);
  never('strength', 'log', /\*\*2 sets of 5 with 6 kg\*\*/);
  never('strength', 'which-overload', /\*\*2 sets of 5 with 6 kg\*\*/);
  never('mobility-balance', 'falls', /\*\*10%\*\*/);
  never('training-recovery', 'ramp', /\*\*16 km a week\*\*/);
  never('habits', 'build-up', /for \*\*100 minutes a week\*\*/);
  // the short worked lines inside generated prompts
  assert.match(flat(one('aerobic', 'pulse').text), /11 beats in 10\s+seconds would be 11 × 6 = 66 beats a minute/);
  assert.match(flat(one('mobility-balance', 'falls').text), /A cut of 10% would mean 10 fewer falls in every 100/);
  assert.match(flat(one('mobility-balance', 'scans').text), /A bar at 10% would mean 10 people in\s+every 100/);
  assert.match(flat(one('habits', 'build-up').text), /From 100 minutes, with 25 more each week, it would take\s+50 ÷ 25 = 2 weeks/);
  // evidence questions carry their evidence in the prompt
  assert.match(flat(one('aerobic', 'intervals').text), /In trials that compare them, both kinds of session raise VO₂ max/);
  assert.match(flat(one('training-recovery', 'sprain').text), /\*\*protect\*\*\s+the joint for the first few days and then to \*\*load it gently\*\*/);
  assert.match(flat(one('training-recovery', 'heat').text), /drinking far beyond thirst can dilute the\s+salt in the blood/);
});

/* ------------------------------------------------------------------------------------------- guard */

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    const generated = lesson.steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.slice().sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const sid of generated) assert.ok(tested.has(`${id}/${sid}`), `${id}/${sid} is re-derived by a test`);
  }
});
