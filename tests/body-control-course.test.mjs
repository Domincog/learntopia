// Independent checks of "The Body II: Control, Defence and Movement".
//
// 1. Double entry of facts: the key figures of the course are typed in again below, from the author's
//    verified notes (source body and year in each comment), and compared with content/courses/body-control/helpers.js.
// 2. Every generated question is re-solved from the wording the learner sees (numbers parsed out of the text,
//    or looked up in a table written here, never taken from the generator's own variables).
// 3. Every interact step's `check` is fed every state its controls can reach (worked out here from the rules
//    of the widget), and must accept exactly the states its instruction asks for.
// 4. Safety: the standard disclaimer once, in lesson 1; no step asks for the learner's own health data; the step
//    that mentions sexual assault is sober and carries pointers to help; every body-map id exists; every
//    photograph has a licence and a credit in the course's manifest.
//
//   node --test tests/body-control-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import course from '../content/courses/body-control/course.js';
import * as H from '../content/courses/body-control/helpers.js';
import { simulateGlucose, describeRun } from '../src/widgets/glucose-loop.js';
import { describeResponse, responseCurves, ILL_AT } from '../src/widgets/immune-response.js';
import { hormoneLevels, ovulationDay, phaseOf, liningThickness } from '../src/widgets/cycle-hormones.js';
import { structureIds, anchorIds, expandIds, systemNames, viewNames, structureInfo } from '../src/widgets/body-map.js';

const SEEDS = 200;
const LESSONS = ['nervous-system', 'senses', 'hormones', 'immune-system', 'muscles-bones', 'life-cycle', 'sexual-health'];
/** Every generated step of the course. Each is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'nervous-system': ['travel-time', 'brain-regions', 'autonomic'],
  senses: ['lens-sign', 'decibels', 'hidden-senses'],
  hormones: ['units', 'thyroid-loop'],
  'immune-system': ['who-remembers', 'boosting'],
  'muscles-bones': ['lever-calc', 'injuries'],
  'life-cycle': ['puberty-range', 'ovulation-day'],
  'sexual-health': ['window-days', 'per-100', 'where-to-go'],
};
const tested = new Set();

const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/body-control/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, 'body-control', id);
}
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('../content/media/body-control/manifest.json', import.meta.url)), 'utf8'));

const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
/** A step as the player sees it (fill-in gaps parsed, defaults filled in). */
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const number = (s) => Number(String(s).replace(/,/g, ''));
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };
const correctText = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: one correct option`); return flat(right[0].text); };
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
    try { verify(s, flat(s.text)); } catch (err) { err.message = `${lesson}/${id} (seed ${k}): ${err.message}\n  text: ${flat(s.text)}`; throw err; }
  }
  return texts.size;
}
/** Every string a learner can see in a resolved step (figure and widget markup excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['content', 'type', 'id', 'viewBox', 'color', 'mode', 'view', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'license', 'credit', 'changes', 'title', 'tone', 'kind', 'answer']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) { if (k === 'widget' || k === 'figure' || k === 'solution') continue; walk(v[k], k); }
  };
  walk(step, '');
  if (step.title) out.push(step.title);
  return out;
}
const check = (lesson, id) => { const s = raw(lesson, id); assert.equal(typeof s.check, 'function', `${lesson}/${id} has a check`); return s.check; };
const accepts = (fn, state) => fn(state) === true;

/* ---------------------------------------------------------------- the author's own table of facts */

const FACTS = {
  // lesson 1
  neurons: 86e9,              // Azevedo et al., J. Comp. Neurol. 2009: 86.1 ± 8.1 billion neurons in the human brain
  fastNerve: 100,             // m/s: physiology textbooks, large myelinated fibres, up to about 100–120 m/s
  slowNerve: 1,               // m/s: unmyelinated fibres, about 0.5–2 m/s
  reaction: [200, 300],       // ms: typical simple visual reaction time
  reflex: ['receptor', 'sensory', 'relay', 'motor', 'muscle'],   // the reflex arc, in order
  // lesson 2
  rods: 120e6, cones: 6e6,    // per retina: textbook figures
  hairCells: 16000,           // per cochlea at birth: CDC (NCEH)
  decibels: { 'a whisper': 30, 'normal conversation': 60, 'a washing machine': 70, 'city traffic heard from inside a car': 80, 'a loud sports crowd': 100, 'a very loud music venue': 110, 'a siren close by': 120 },   // CDC (NCEH), "What noises cause hearing loss?"
  twoPoint: [3, 10, 40],      // mm: fingertip, palm, forearm (Weinstein 1968, as quoted in physiology texts)
  ear: ['eardrum', 'bones', 'cochlea', 'Hair cells', 'nerve'],
  // lesson 3
  fasting: 5, mgPerMmol: 18,  // mmol/L; 1 mmol/L glucose = 18 mg/dL (molar mass 180 g/mol)
  firstInsulin: 1922,         // Leonard Thompson, Toronto, January 1922
  type2Share: 90,             // IDF Diabetes Atlas 2025: over 90% of diabetes is type 2
  adultsWithDiabetes: 589e6,  // IDF Diabetes Atlas, 11th edition (2025): adults 20–79, 2024
  // lesson 4
  response: { first: { lag: 5, peakDay: 12, illDays: 7 }, memory: { lag: 2, peakDay: 6, illDays: 0, times: 20 } },   // textbook primary and secondary responses
  hivLiving: 40.8e6,          // WHO / UNAIDS 2025: people living with HIV in 2024
  // lesson 5
  bones: 206, handBones: 27, wristBones: 8, renewYears: 10,   // anatomy texts; NIH on bone remodelling
  peakBone: [25, 30],         // NIH (NIAMS)
  // lesson 6
  chromosomes: 46, pairs: 23,
  pregnancyWeeks: 40,         // NHS, WHO: from the first day of the last period
  pubertyGirls: [8, 13], pubertyBoys: [9, 14],   // NHS, "Early or delayed puberty"
  cycle: [21, 35], luteal: 14,                   // NHS
  menopause: [45, 55],        // NHS
  life1900: 32, lifeNow: 73,  // Our World in Data; UN World Population Prospects 2024
  // lesson 7: pregnancies per 100 couples in the first year, [typical, perfect]. Trussell & Aiken 2018 (Contraceptive Technology, 21st ed.); CDC
  methods: { none: [85, 85], withdrawal: [20, 4], condom: [13, 2], pill: [7, 0.3], injection: [4, 0.2], iud: [0.8, 0.6], implant: [0.1, 0.1] },
  fertileWindow: 6,           // Wilcox et al., NEJM 1995
  ecDays: 5,                  // WHO fact sheet on emergency contraception (2021)
};

test('double entry: the helper tables agree with the figures typed in here', () => {
  assert.equal(H.NERVE.neurons, FACTS.neurons);
  assert.equal(H.NERVE.fastSpeed, FACTS.fastNerve);
  assert.equal(H.NERVE.slowSpeed, FACTS.slowNerve);
  assert.deepEqual(H.NERVE.reaction, FACTS.reaction);
  for (const [, speed] of H.NERVE_FIBRES) assert.ok(speed >= 3 && speed <= 120, `${speed} m/s is in the range for myelinated fibres`);
  for (const [, metres] of H.NERVE_PATHS) assert.ok(metres >= 0.3 && metres <= 1.3, `${metres} m is a plausible nerve path in a limb`);
  FACTS.reflex.forEach((word, i) => assert.match(H.REFLEX_ARC[i].toLowerCase(), new RegExp(word), `reflex arc, stage ${i + 1}`));
  assert.equal(H.EYE.rods, FACTS.rods);
  assert.equal(H.EYE.cones, FACTS.cones);
  assert.equal(H.EYE.hairCells, FACTS.hairCells);
  assert.deepEqual(Object.fromEntries(H.SOUNDS), FACTS.decibels);
  assert.deepEqual(H.TWO_POINT.map(([, mm]) => mm), FACTS.twoPoint);
  FACTS.ear.forEach((word, i) => assert.ok(H.EAR_PATH[i].includes(word), `ear path, stage ${i + 1}: ${H.EAR_PATH[i]}`));
  assert.equal(H.GLUCOSE.fasting, FACTS.fasting);
  assert.equal(H.GLUCOSE.mgPerMmol, FACTS.mgPerMmol);
  assert.equal(H.GLUCOSE.firstInsulin, FACTS.firstInsulin);
  assert.equal(H.GLUCOSE.type2Share, FACTS.type2Share);
  assert.equal(H.GLUCOSE.adultsWithDiabetes, FACTS.adultsWithDiabetes);
  assert.ok(Math.abs(H.GLUCOSE.fasting * H.GLUCOSE.bloodLitres * 0.18 - H.GLUCOSE.gramsInBlood) <= 0.5, 'grams of glucose in the blood: mmol/L × litres × 0.18 g/mmol');
  assert.deepEqual(H.RESPONSE, FACTS.response);
  assert.equal(H.HIV.livingWith, FACTS.hivLiving);
  assert.equal(H.SKELETON.adultBones, FACTS.bones);
  assert.equal(H.SKELETON.handBones, FACTS.handBones);
  assert.equal(H.SKELETON.wristBones, FACTS.wristBones);
  assert.equal(H.SKELETON.renewYears, FACTS.renewYears);
  assert.deepEqual(H.SKELETON.peakBoneAge, FACTS.peakBone);
  assert.equal(8 + 5 + 14, FACTS.handBones, 'wrist + palm + fingers');
  assert.equal(H.LIFE.chromosomes, FACTS.chromosomes);
  assert.equal(H.LIFE.pairs, FACTS.pairs);
  assert.equal(H.LIFE.pregnancyWeeks, FACTS.pregnancyWeeks);
  assert.deepEqual(H.LIFE.pubertyOvaries, FACTS.pubertyGirls);
  assert.deepEqual(H.LIFE.pubertyTestes, FACTS.pubertyBoys);
  assert.deepEqual(H.LIFE.cycleDays, FACTS.cycle);
  assert.equal(H.LIFE.lutealDays, FACTS.luteal);
  assert.deepEqual(H.LIFE.menopauseAge, FACTS.menopause);
  assert.equal(H.LIFE.lifeExpectancy1900, FACTS.life1900);
  assert.equal(H.LIFE.lifeExpectancyNow, FACTS.lifeNow);
  assert.ok(2 ** H.LIFE.doublings > 3e13 && 2 ** H.LIFE.doublings < 4e13, '2^45 is about 35 trillion');
  assert.deepEqual(Object.fromEntries(H.METHODS.map((m) => [m.id, [m.typical, m.perfect]])), FACTS.methods);
  for (const m of H.METHODS) assert.ok(m.perfect <= m.typical, `${m.id}: perfect use is never worse than typical use`);
  assert.equal(H.FERTILITY.windowDays, FACTS.fertileWindow);
  assert.equal(H.FERTILITY.ecDays, FACTS.ecDays);
  assert.equal(H.DISCLAIMER, '> **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.');
});

/* ------------------------------------------------------------ whole course */

test('course shape: seven lessons of 14 to 18 steps, each with review steps, hands-on steps, generated steps and a recap', () => {
  assert.equal(course.id, 'body-control');
  assert.deepEqual(course.requires, ['body-systems']);
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), LESSONS);
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.ok(lesson.steps.length >= 14 && lesson.steps.length <= 18, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) if (s.type === 'numeric') assert.equal(typeof s.gen, 'function', `${id}/${s.id}: numeric review steps are generated`);
    assert.ok(lesson.steps.filter((s) => s.type === 'interact').length >= 3, `${id}: at least three hands-on steps`);
    assert.ok(lesson.steps.filter((s) => s.gen).length >= 2, `${id}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${id}: at most five choice steps`);
    assert.equal(lesson.steps[0].mode, 'predict', `${id} opens with a prediction`);
    assert.equal(lesson.steps[lesson.steps.length - 1].type, 'info', `${id} ends on an invitation`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: next`);
    for (let i = 2; i < lesson.steps.length; i++) assert.ok(!lesson.steps.slice(i - 2, i + 1).every((s) => s.type === 'info'), `${id}: three info steps in a row`);
    for (const s of lesson.steps) if (s.type !== 'info' && s.type !== 'reflect') assert.ok(s.gen || s.explain, `${id}/${s.id} has an explanation`);
  }
  assert.match(lessons['sexual-health'].next, /Food and Nutrition/, 'the last lesson points to the next course of the path');
});

test('no learner-visible text contains undefined, NaN, an object or float noise', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        for (const text of visible(s)) {
          const where = `${id}/${step.id} seed ${k}: "${text.slice(0, 120)}"`;
          assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), where);
          assert.ok(!/\d\.\d{5,}/.test(text), `float noise in ${where}`);
          assert.ok(!/\b1 (steps|times|days|couples)\b/.test(text.replace(/[\d,.]+1 (steps|times|days|couples)/g, '')), `plural in ${where}`);
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
  assert.ok(seen > 1000);
});

test('numeric steps: generated, exact, with hints, and no listed slip equals the answer or another slip', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'numeric') continue;
      assert.equal(typeof step.gen, 'function', `${id}/${step.id}: numeric practice is generated`);
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(9 + k * 613), step.id);
        assert.ok(Number.isFinite(s.answer) && s.answer > 0, `${id}/${step.id}: ${s.answer}`);
        assert.ok(Math.abs(s.answer * 100 - Math.round(s.answer * 100)) < 1e-7, `${id}/${step.id}: ${s.answer} has at most two decimals`);
        assert.ok(s.explain && s.hints.length >= 1, `${id}/${step.id} has hints and an explanation`);
        const values = [s.answer, ...s.wrong.map((w) => w[0])];
        assert.equal(new Set(values.map((v) => Math.round(v * 1e6))).size, values.length, `${id}/${step.id}: answer and slips are all different: ${values.join(', ')}`);
      }
    }
  }
});

test('order steps: every sequence matches the order written here', () => {
  const want = {
    'nervous-system/synapse': ['impulse arrives', 'release', 'crosses the gap', 'next cell'],
    'senses/ear-path': FACTS.ear,
    'hormones/loop-order': ['glucose rises', 'releases insulin', 'take glucose in', 'falls back', 'less insulin'],
    'immune-system/clonal': ['Phagocytes carry', 'receptors fit', 'divide', 'antibodies and killer cells', 'memory cells'],
    'life-cycle/pregnancy-order': ['sperm and an egg join', 'settles into the lining', 'placenta forms', 'movements can be felt', 'until birth'],
  };
  let found = 0;
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) {
    if (step.type !== 'order') continue;
    const key = `${id}/${step.id}`;
    assert.ok(want[key], `${key}: an order step this file knows`);
    assert.equal(step.items.length, want[key].length, key);
    want[key].forEach((phrase, i) => assert.ok(step.items[i].includes(phrase), `${key}, item ${i + 1}: "${step.items[i]}" should mention "${phrase}"`));
    found++;
  }
  assert.equal(found, Object.keys(want).length);
  // the reflex arc is asked as a fill-in: its five gaps, in order
  assert.deepEqual(one('nervous-system', 'reflex-arc').blanks.map((b) => b.answer), ['receptor', 'sensory', 'relay', 'motor', 'muscle']);
  for (const b of one('nervous-system', 'reflex-arc').blanks) assert.equal(b.options.filter((o) => o === b.answer).length, 1);
  // the eye, front to back
  assert.deepEqual(one('senses', 'eye-parts').blanks.map((b) => b.answer), ['cornea', 'lens', 'retina', 'cones', 'rods']);
  // chromosome counts
  assert.deepEqual(one('life-cycle', 'chromosome-count').blanks.map((b) => b.numbers[0]), [23, 23, 46, 23, 46]);
});

/* ------------------------------------------------------- teach before you ask */

/** The teaching screens that make sure nothing is asked before it has been shown (docs/AUTHORING.md, "Teach before you ask"). */
const TEACHING = {
  'nervous-system': ['example-travel-time', 'teach-neuron', 'teach-reflex', 'teach-whole-brain'],
  senses: ['teach-eye', 'teach-long-sight', 'teach-ear', 'teach-hidden-senses', 'illusion'],
  hormones: ['teach-insulin', 'teach-two-services', 'teach-glucagon', 'teach-glands'],
  'immune-system': ['teach-barriers', 'teach-inflammation', 'teach-adaptive', 'teach-misfires', 'teach-support'],
  'muscles-bones': ['example-lever', 'teach-joint', 'teach-bone', 'teach-injuries'],
  'life-cycle': ['teach-chromosomes', 'teach-pregnancy', 'teach-puberty', 'teach-cycle'],
  'sexual-health': ['example-window', 'teach-how-methods', 'teach-stis'],
};

test('teach before you ask: every lesson teaches before its first graded step, on at least three screens, with at most two predictions', () => {
  // lessons[id].steps are the steps as written: a step counts unless it says `graded: false` (an exploration)
  const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded === false ? 'explore' : 'graded');
  assert.deepEqual(Object.keys(TEACHING), LESSONS);
  for (const [id, lesson] of Object.entries(lessons)) {
    const roles = lesson.steps.map(role);
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: a teaching screen or an exploration comes before the first graded step (${lesson.steps[firstGraded].id})`);
    assert.ok(roles.filter((r) => r === 'teach').length >= 3, `${id}: at least three info steps`);
    assert.ok(roles.filter((r) => r === 'predict').length <= 2, `${id}: at most two predictions`);
    for (const stepId of TEACHING[id]) {
      const step = raw(id, stepId);
      assert.equal(step.type, 'info', `${id}/${stepId} is a teaching screen`);
      assert.ok(flat(step.text).length > 150, `${id}/${stepId} teaches something`);
      assert.ok(lesson.steps.indexOf(step) < lesson.steps.length - 1, `${id}/${stepId} comes before the closing invitation`);
      for (const figure of [step.figure].flat().filter(Boolean)) assert.ok(figure.alt && figure.alt.length > 40, `${id}/${stepId}: the figure has alt text`);
    }
  }
  // a teaching screen about sober material is sober too
  for (const [lessonId, stepId] of [['immune-system', 'teach-inflammation'], ['immune-system', 'teach-misfires'], ['sexual-health', 'teach-stis']]) assert.equal(raw(lessonId, stepId).tone, 'sober', `${lessonId}/${stepId}`);
  // senses had three predictions: the grey-squares illusion is now a teaching screen that keeps the demonstration
  assert.equal(raw('senses', 'illusion').figure.type, 'svg');
  assert.match(flat(raw('senses', 'illusion').text), /exactly the same grey/);
  // facts that moved from an explanation to a teaching screen are pinned where they now stand
  assert.match(flat(raw('nervous-system', 'example-travel-time').text), /0\.6 ÷ 30 = 0\.02 seconds.*\*\*20 ms\*\*/, 'worked example: 0.6 m at 30 m/s is 20 ms');
  assert.ok(Math.abs((0.6 / 30) * 1000 - 20) < 1e-9);
  assert.match(flat(raw('nervous-system', 'teach-whole-brain').text), new RegExp(`about \\*\\*${H.NERVE.brainEnergyShare}%\\*\\* of the body's energy at rest`));
  assert.match(flat(raw('senses', 'teach-ear').text), /eardrum.*Three tiny bones.*cochlea.*hair cells.*hearing nerve/s, 'the ear, in the order of EAR_PATH');
  assert.match(flat(raw('senses', 'teach-long-sight').text), /focus falls \*\*behind\*\* the retina.*\*\*plus lens\*\*, fatter in the middle/s);
  // touch is one of the five named senses: the table of "more senses" says that it is there for comparison
  assert.match(flat(raw('senses', 'teach-hidden-senses').text), /more senses than those five.*three of them, with touch beside them for comparison/s);
  assert.match(flat(raw('hormones', 'teach-glucagon').text), /\*\*Glucagon\*\* \| falling \| makes the liver release stored glucose/);
  assert.match(flat(raw('hormones', 'resistant').explain), new RegExp(`over ${FACTS.type2Share}% of people with diabetes have it`));
  for (const id of ['pituitary', 'pineal', 'thyroid', 'adrenals', 'pancreas']) assert.ok(flat(raw('hormones', 'teach-glands').text).includes(`| **${H.GLANDS[id][0]}** | ${H.GLANDS[id][1]} | ${H.GLANDS[id][2]} |`), `${id} row`);
  for (const [barrier, how, example] of H.BARRIERS) {
    assert.ok(flat(raw('immune-system', 'teach-barriers').text).toLowerCase().includes(`**${barrier}**: ${how}.`.toLowerCase()), `${barrier} is taught`);
    assert.ok(raw('immune-system', 'barriers').pairs.some(([a, b]) => a === barrier && b === example), `${barrier} is asked as a case`);
  }
  for (const [sign, cause] of H.INFLAMMATION) assert.ok(flat(raw('immune-system', 'teach-inflammation').text).includes(`| ${sign} | ${cause} |`), `${sign} row`);
  assert.match(flat(raw('muscles-bones', 'example-lever').text), /28 ÷ 4 = 7 times.*20 × 7 = \*\*140 N\*\*/s, 'worked example: 2 kg at 28 cm, muscle at 4 cm');
  assert.equal((2 * 10 * 28) / 4, 140);
  assert.equal(raw('muscles-bones', 'example-lever').figure.reach / raw('muscles-bones', 'example-lever').figure.attach, 7);
  for (const [name, job] of H.CONNECTORS) assert.ok(flat(raw('muscles-bones', 'teach-joint').text).toLowerCase().includes(`**${name}**: ${job}.`.toLowerCase()), `${name} is taught`);
  for (const [word, v] of Object.entries(H.INJURIES)) assert.ok(flat(raw('muscles-bones', 'teach-injuries').text).toLowerCase().includes(`| **${word}** | ${v.what} |`.toLowerCase()), `${word} row`);
  assert.match(flat(raw('muscles-bones', 'teach-bone').text), new RegExp(`renewed about every \\*\\*${FACTS.renewYears} years\\*\\*`));
  assert.equal(raw('muscles-bones', 'knuckles').mode, 'predict', 'guessing the result of an experiment is a prediction');
  assert.equal(role(raw('muscles-bones', 'bone-alive')), 'graded', 'and what bone is made of is taught, then asked');
  assert.match(flat(raw('life-cycle', 'teach-chromosomes').text), new RegExp(`\\*\\*${FACTS.chromosomes} chromosomes\\*\\*.*\\*\\*${FACTS.pairs} pairs\\*\\*`));
  assert.match(flat(raw('life-cycle', 'teach-pregnancy').text), new RegExp(`about \\*\\*${FACTS.pregnancyWeeks} weeks\\*\\*, counted from the first day of the last period.*Third, from week 28`));
  for (const [change, who] of H.PUBERTY_CHANGES) {
    const row = { ovaries: 'In bodies with ovaries', testes: 'In bodies with testes', both: 'In both' }[who];
    const line = flat(raw('life-cycle', 'teach-puberty').text).split('| ').join('|').split('|').find((cell, i, cells) => cells[i - 1] && cells[i - 1].trim() === row);
    assert.ok(line && line.toLowerCase().includes(change.toLowerCase()), `"${change}" is taught in the row "${row}"`);
  }
  assert.match(flat(raw('life-cycle', 'cycle-length').explain), /\*\*day 21\*\*: 35 − 14/);
  assert.match(flat(raw('sexual-health', 'example-window').text), /28 − 14 = \*\*day 14\*\*.*14 − 5 = \*\*day 9\*\*.*day 9 to day 14/s);
  for (const [method, group] of H.METHOD_GROUPS) {
    const row = { barrier: /\*\*Barrier\*\*[^|]*\| ([^|]*)\|/, hormonal: /\*\*Hormones\*\*[^|]*\| ([^|]*)\|/, neither: /\*\*Neither of these\*\* \| ([^|]*)\|/ }[group];
    assert.ok(grab(row, flat(raw('sexual-health', 'teach-how-methods').text))[0].includes(method), `${method} is taught as ${group}`);
  }
  assert.match(flat(raw('sexual-health', 'teach-stis').text), /Chlamydia, gonorrhoea and syphilis are caused by bacteria and are cured with antibiotics/);
});

/* ---------------------------------------------------------------- lesson 1 */

test('lesson 1: travel time = distance ÷ speed, in milliseconds', () => {
  const n = eachVariant('nervous-system', 'travel-time', (s, text) => {
    const [metres] = grab(/\*\*([\d.]+) m\*\*/, text).map(number);
    const [speed] = grab(/\*\*(\d+) metres per second\*\*/, text).map(number);
    const ms = (metres / speed) * 1000;
    assert.ok(Math.abs(ms - Math.round(ms)) < 1e-9, `${ms} ms is a whole number`);
    assert.equal(s.answer, Math.round(ms));
    assert.equal(s.unit, 'ms');
    assert.ok(speed <= 120 && speed >= 3 && metres <= 1.3);
    assert.ok(flat(s.explain).includes(`**${Math.round(ms)} ms**`), 'the explanation quotes the answer');
    const slips = s.wrong.map((w) => w[0]);
    assert.ok(slips.some((v) => Math.abs(v - metres / speed) < 1e-12) && slips.some((v) => Math.abs(v - metres * speed) < 1e-9));
  });
  assert.ok(n >= 8, `${n} variants`);
});

const BRAIN_LOSS = [
  [/planning|personality/, 'frontal-lobe'],
  [/numbness|one side of the body/, 'parietal-lobe'],
  [/understanding speech|new memories/, 'temporal-lobe'],
  [/field of vision/, 'occipital-lobe'],
  [/clumsy|unsteady/, 'cerebellum'],
  [/breathing and heartbeat/, 'brainstem'],
];
const BRAIN_PARTS = BRAIN_LOSS.map((b) => b[1]);

test('lesson 1: the part of the brain an injury points to; exactly that part is accepted', () => {
  const seen = new Set();
  eachVariant('nervous-system', 'brain-regions', (s, text) => {
    const hits = BRAIN_LOSS.filter(([re]) => re.test(text));
    assert.equal(hits.length, 1, 'the description fits one region');
    const want = hits[0][1];
    seen.add(want);
    assert.equal(s.widget.answer, want);
    assert.deepEqual(s.solution, { picked: want });
    assert.deepEqual(s.widget.pickable.slice().sort(), BRAIN_PARTS.slice().sort());
    for (const picked of BRAIN_PARTS) {
      const out = s.check({ picked, name: 'x', nameThe: 'the x', side: null });
      assert.equal(out === true, picked === want, `${picked} for ${want}`);
      if (picked !== want) assert.equal(typeof out, 'string', 'a wrong part gets feedback');
    }
    assert.equal(s.check({ picked: null, nameThe: null }), false);
    assert.ok(flat(s.explain).toLowerCase().includes(structureInfo(want).name.toLowerCase()));
  });
  assert.equal(seen.size, 6);
  // the widget's own notes agree with the course's table
  assert.match(structureInfo('occipital-lobe').note, /vision/);
  assert.match(structureInfo('cerebellum').note, /balance/);
  assert.match(structureInfo('brainstem').note, /breathing/);
  assert.match(structureInfo('temporal-lobe').note, /hearing/);
});

const SYMPATHETIC = ['Heart beats faster', 'Pupils widen', 'Airways widen', 'Digestion is put on hold', 'Sweating increases', 'The liver releases stored glucose'];
const PARASYMPATHETIC = ['Heart beats more slowly', 'Pupils narrow', 'Saliva flows and digestion gets going', 'Airways narrow back to their resting width'];

test('lesson 1: the two branches of the autonomic system', () => {
  eachVariant('nervous-system', 'autonomic', (s) => {
    assert.equal(s.items.length, 6);
    assert.match(s.buckets[0], /Sympathetic/);
    assert.match(s.buckets[1], /Parasympathetic/);
    assert.equal(new Set(s.items.map((i) => i.text)).size, 6);
    for (const item of s.items) {
      const symp = SYMPATHETIC.includes(item.text);
      assert.ok(symp || PARASYMPATHETIC.includes(item.text), `"${item.text}" is in this file's table`);
      assert.equal(item.bucket, symp ? 0 : 1, item.text);
    }
    assert.equal(s.items.filter((i) => i.bucket === 0).length, 3);
  });
  assert.equal(H.AUTONOMIC.length, SYMPATHETIC.length + PARASYMPATHETIC.length);
});

test('lesson 1: the neuron experiments accept exactly what the instructions ask for', () => {
  // the rule of the nerve-impulse widget, written out here: threshold 4; rate 20 + 30 per step above it; 1000 ms or 10 ms per metre
  const rate = (v) => (v < 4 ? 0 : 20 + 30 * (v - 4));
  const lab = check('nervous-system', 'impulse-lab');
  assert.equal(typeof lab({ runs: 0, sawBelow: false, sawAbove: 0 }), 'string');
  for (let a = 0; a <= 10; a++) for (let b = 0; b <= 10; b++) for (let c = 0; c <= 10; c++) {
    const tried = [...new Set([a, b, c])];
    const state = { runs: 3, sawBelow: tried.some((v) => v < 4), sawAbove: tried.filter((v) => v >= 4).length };
    assert.equal(accepts(lab, state), state.sawBelow && state.sawAbove >= 2, `tried ${tried}`);
  }
  assert.ok(accepts(lab, { runs: 3, sawBelow: true, sawAbove: 2 }));

  const my = check('nervous-system', 'myelin');
  for (let strength = 0; strength <= 10; strength++) for (const myelin of [false, true]) for (const shown of [false, true]) {
    const state = { strength, myelin, fired: shown && strength >= 4, rate: rate(strength), travel: myelin ? 1000 / FACTS.fastNerve : 1000 / FACTS.slowNerve };
    const out = my(state);
    assert.equal(out === true, myelin && state.fired, JSON.stringify(state));
    if (typeof out === 'string' && /still needs|Still \d/.test(out)) { assert.ok(!myelin && state.fired); assert.ok(out.includes('1000 ms')); }
    if (typeof out === 'string' && /more impulses \((\d+) a second\)/.test(out)) assert.equal(number(/\((\d+) a second\)/.exec(out)[1]), rate(strength));
    if (typeof out === 'string' && /below the threshold/.test(out)) assert.ok(strength < 4 && myelin);
  }
  assert.ok(accepts(my, { strength: 6, myelin: true, fired: true, rate: 80, travel: 10 }));
  assert.ok(accepts(check('nervous-system', 'reaction-test'), { done: true }));
  assert.equal(typeof check('nervous-system', 'reaction-test')({ done: false }), 'string');
  const explore = check('nervous-system', 'brain-explore');
  for (let n = 0; n <= 7; n++) assert.equal(accepts(explore, { seenCount: n }), n >= 5);
  assert.ok(raw('nervous-system', 'brain-explore').solution.seen.length >= 5);
});

/* ---------------------------------------------------------------- lesson 2 */

// who is in the story → [where the unaided focus falls, which lens]: short sight focuses in front (minus lens), long sight behind (plus lens)
const SIGHT = { Aiko: ['In front of', 'minus'], Luis: ['In front of', 'minus'], Kwame: ['Behind', 'plus'], Marta: ['Behind', 'plus'] };

test('lesson 2: where the focus falls and which lens corrects it', () => {
  const people = new Set();
  eachVariant('senses', 'lens-sign', (s, text) => {
    const [name] = grab(/^(\w+)/, text);
    assert.ok(SIGHT[name], `${name} is in this file's table`);
    people.add(name);
    const [where, lens] = SIGHT[name];
    // the story itself must say which distance is blurred: far for short sight, near for long sight
    if (lens === 'minus') assert.match(text, /board is blurred|cannot read the numbers on a bus/); else assert.match(text, /small print|arm's length/);
    const right = correctText(s);
    assert.ok(right.startsWith(`${where} the retina`) && right.includes(`a ${lens} lens`), right);
    assert.equal(s.options.length, 4);
    assert.match(flat(s.explain), new RegExp(lens === 'minus' ? 'in front of' : 'behind'));
  });
  assert.equal(people.size, 4);
});

test('lesson 2: decibels: every 10 dB is ten times the energy', () => {
  const answers = new Set();
  eachVariant('senses', 'decibels', (s, text) => {
    const found = [...text.matchAll(/([a-z][a-z' ]+?), about \*\*(\d+) dB\*\*/g)].map((m) => [m[1].trim(), number(m[2])]);
    assert.equal(found.length, 2);
    for (const [name, db] of found) assert.equal(FACTS.decibels[name], db, `${name} is about ${db} dB in this file's table`);
    const diff = found[1][1] - found[0][1];
    assert.ok(diff > 0 && diff <= 40 && diff % 10 === 0, `quieter first, at most 40 dB apart: ${diff}`);
    const want = Math.round(10 ** (diff / 10));
    assert.equal(s.answer, want);
    answers.add(want);
    assert.ok(flat(s.explain).includes(`**${want.toLocaleString('en-US')} times**`), 'the explanation quotes the answer');
    for (const [slip] of s.wrong) assert.notEqual(slip, want);
  });
  assert.deepEqual([...answers].sort((a, b) => a - b), [10, 100, 1000, 10000]);
});

const SCENES = [
  [/fingertip to the tip of your nose|knee is bent or straight|walk upstairs/, 'Position sensors in muscles and joints'],
  [/spinning|windowless cabin|which way is up/, 'Balance organs in the inner ear'],
  [/sharp stone/, 'Pain receptors'],
  [/coin among the keys/, 'Touch receptors in the skin'],
];

test('lesson 2: which sense is at work', () => {
  const seen = new Set();
  eachVariant('senses', 'hidden-senses', (s, text) => {
    const hits = SCENES.filter(([re]) => re.test(text));
    assert.equal(hits.length, 1);
    assert.equal(correctText(s), hits[0][1]);
    seen.add(text);
    assert.equal(s.options.length, 4);
  });
  assert.equal(seen.size, H.SENSE_SCENES.length);
});

test('lesson 2: the eye experiments accept exactly what the instructions ask for', () => {
  // the rule of the eye-focus widget, written out here: error = eye + lens + glasses − 1/distance (6 m counts as far away: 0)
  const state = (eye, distance, lens, glasses) => {
    const error = Math.round((eye + lens + glasses - (distance >= 6 ? 0 : 1 / distance)) * 100) / 100;
    return { eye, distance, lens, glasses, error, sharp: Math.abs(error) < 0.25, where: Math.abs(error) < 0.25 ? 'retina' : error > 0 ? 'front' : 'behind' };
  };
  const near = check('senses', 'focus-near');
  const spec = raw('senses', 'focus-near').widget;
  assert.equal(spec.eye, 0);
  for (const d of [6, 2, 1, 0.5, 0.25]) for (let lens = spec.lensRange[0]; lens <= spec.lensRange[1]; lens += spec.lensRange[2]) {
    const st = state(0, d, lens, 0);
    const out = near(st);
    assert.equal(out === true, d === 0.25 && lens === 4, `object at ${d} m, lens +${lens}`);
    if (typeof out === 'string' && /behind the retina/.test(out)) assert.equal(st.where, 'behind');
    if (typeof out === 'string' && /in front of the retina/.test(out)) assert.equal(st.where, 'front');
    if (typeof out === 'string' && /^Sharp/.test(out)) assert.ok(st.sharp && d > 0.25);
  }
  const short = check('senses', 'short-sight');
  const sspec = raw('senses', 'short-sight').widget;
  assert.ok(sspec.eye > 0, 'a short-sighted eye focuses too strongly for its length');
  for (let g = sspec.glassesRange[0]; g <= sspec.glassesRange[1]; g += sspec.glassesRange[2]) {
    const st = state(sspec.eye, 6, 0, g);
    const out = short(st);
    assert.equal(out === true, g === -sspec.eye, `glasses ${g}`);
    if (typeof out === 'string' && /fatter in the middle/.test(out)) assert.ok(g > 0);
    if (typeof out === 'string' && /still in front/.test(out)) assert.ok(g < 0 && st.where === 'front');
    if (typeof out === 'string' && /Too strong/.test(out)) assert.equal(st.where, 'behind');
  }
  assert.equal(raw('senses', 'short-sight').solution.glasses, -2);
  // the photograph of the retina: only the optic disc is accepted
  const fundus = check('senses', 'fundus');
  const spots = raw('senses', 'fundus').widget.hotspots.map((h) => h.id);
  assert.deepEqual(spots.slice().sort(), ['disc', 'macula', 'plain', 'vessel']);
  for (const id of spots) { const out = fundus({ picked: id }); assert.equal(out === true, id === 'disc'); if (id !== 'disc') assert.equal(typeof out, 'string'); }
  assert.equal(fundus({ picked: null }), false);
  // two-point touch: any guess with fingertip < palm < forearm counts as "what happens"; the solution shows the real values
  const two = check('senses', 'two-point');
  assert.deepEqual(raw('senses', 'two-point').solution.values, [FACTS.twoPoint]);
  assert.ok(two({ values: [FACTS.twoPoint] }));
  assert.ok(!two({ values: [[20, 20, 20]] }) && !two({ values: [[40, 10, 3]] }));
  // the tastes: sour, umami and bitter are basic tastes; chilli and strawberry are not
  const tastes = raw('senses', 'tastes');
  assert.deepEqual(tastes.options.filter((o) => o.correct).map((o) => o.text.split(' ')[0]).sort(), ['Bitter', 'Sour', 'Umami']);
});

/* ---------------------------------------------------------------- lesson 3 */

test('lesson 3: mmol/L and mg/dL', () => {
  const kinds = new Set();
  eachVariant('hormones', 'units', (s, text) => {
    if (s.unit === 'mg/dL') {
      const [mmol] = grab(/shows \*\*([\d.]+) mmol\/L\*\*/, text).map(number);
      assert.equal(s.answer, Math.round(mmol * FACTS.mgPerMmol));
      assert.ok(Math.abs(mmol * 18 - Math.round(mmol * 18)) < 1e-9);
      kinds.add('to mg');
    } else {
      assert.equal(s.unit, 'mmol/L');
      const [mg] = grab(/blood glucose of \*\*(\d+) mg\/dL\*\*/, text).map(number);
      assert.ok(Math.abs(s.answer - mg / FACTS.mgPerMmol) < 1e-9);
      kinds.add('to mmol');
    }
    assert.match(text, /1 mmol\/L of glucose is 18 mg\/dL/);
    assert.ok(s.answer >= 3 && s.answer <= 200);
  });
  assert.equal(kinds.size, 2);
});

test('lesson 3: the thyroid loop: low hormone, high TSH; high hormone, low TSH', () => {
  const seen = new Set();
  eachVariant('hormones', 'thyroid-loop', (s, text) => {
    const under = /underactive/.test(text);
    assert.notEqual(under, /overactive/.test(text));
    assert.equal(correctText(s), under ? 'High' : 'Low');
    assert.deepEqual(s.options.map((o) => o.text), ['High', 'Low', 'Unchanged']);
    assert.match(flat(s.explain), new RegExp(`TSH is ${under ? 'high' : 'low'}`));
    seen.add(under);
  });
  assert.equal(seen.size, 2);
});

test('lesson 3: the glucose model behaves as the lesson says, and the experiments accept what they ask for', () => {
  const normal = describeRun(simulateGlucose({ condition: 'normal' }));
  const none = describeRun(simulateGlucose({ condition: 'none' }));
  const treated = describeRun(simulateGlucose({ condition: 'none', treated: true }));
  const resistant = describeRun(simulateGlucose({ condition: 'resistant' }));
  // healthy: starts at 5, rises by about half, back within about two hours
  assert.equal(normal.start, FACTS.fasting);
  assert.ok(normal.peak > 6.5 && normal.peak < 8, `healthy peak ${normal.peak}`);
  assert.ok(normal.backAt >= 90 && normal.backAt <= 150, `healthy: back after ${normal.backAt} min`);
  assert.ok(!normal.spills);
  // glucose rises before insulin does
  const run = simulateGlucose({ condition: 'normal' });
  const peakG = run.reduce((a, b) => (b.G > a.G ? b : a));
  const peakI = run.reduce((a, b) => (b.I > a.I ? b : a));
  assert.ok(peakG.t < peakI.t + 15 && run[45].G > run[30].G, 'glucose moves first');
  // no insulin: far too high, higher still, and not back
  assert.ok(none.start > 10 && none.peak > none.start + 3 && none.backAt === null && none.final > 10 && none.spills);
  assert.equal(none.insulinPeak, 0);
  // insulin by injection: nearly healthy again, and never dangerously low
  assert.ok(treated.peak < 10 && treated.backAt !== null && Math.abs(treated.start - 5) < 0.2);
  assert.ok(Math.min(...simulateGlucose({ condition: 'none', treated: true }).map((p) => p.G)) > 4);
  // weak response: insulin "nearly twice" the healthy peak, glucose higher for longer
  const ratio = resistant.insulinPeak / normal.insulinPeak;
  assert.ok(ratio > 1.6 && ratio < 2.05, `insulin peak ratio ${ratio}`);
  assert.ok(resistant.peak > normal.peak + 1 && resistant.backAt > normal.backAt + 30 && resistant.start > normal.start);
  // the hook: a teaspoon
  const hook = raw('hormones', 'hook');
  assert.equal(hook.answer, 5);
  assert.ok(Math.abs(FACTS.fasting * 5 * 0.18 - hook.answer) <= 0.5);

  const st = (condition, treatedOn, ran, runs) => ({ condition, treated: treatedOn, ran, runs, seen: [...new Set(runs.map((r) => r.condition))] });
  const noIns = check('hormones', 'no-insulin');
  for (const c of ['normal', 'none']) for (const ran of [false, true]) assert.equal(accepts(noIns, st(c, false, ran, [])), c === 'none' && ran);
  const treat = check('hormones', 'treat');
  for (const t of [false, true]) for (const ran of [false, true]) assert.equal(accepts(treat, st('none', t, ran, [])), t && ran);
  const res = check('hormones', 'resistant');
  const all = [[], [{ condition: 'normal' }], [{ condition: 'resistant' }], [{ condition: 'normal' }, { condition: 'resistant' }], [{ condition: 'resistant' }, { condition: 'normal' }]];
  for (const runs of all) for (const c of ['normal', 'resistant']) assert.equal(accepts(res, st(c, false, runs.length > 0, runs)), runs.length === 2, JSON.stringify(runs));
  assert.ok(accepts(check('hormones', 'meal-normal'), { ran: true }) && !accepts(check('hormones', 'meal-normal'), { ran: false }));
  for (let n = 0; n <= 3; n++) assert.equal(accepts(check('hormones', 'glands-map'), { seenCount: n }), n >= 3);
  assert.deepEqual(raw('hormones', 'glands-map').widget.pickable.slice().sort(), ['adrenals', 'pancreas', 'thyroid']);
  // which statements belong to which type of diabetes
  const sort = raw('hormones', 'type-sort');
  const bucketOf = (re) => sort.items.find((i) => re.test(i.text)).bucket;
  assert.equal(bucketOf(/immune system has destroyed/), 0);
  assert.equal(bucketOf(/needed from the start/), 0);
  assert.equal(bucketOf(/respond weakly/), 1);
  assert.equal(bucketOf(/nine in ten/), 1);
  assert.equal(bucketOf(/slowly/), 1);
  assert.equal(bucketOf(/runs too high/), 2);
  assert.equal(bucketOf(/full lives/), 2);
  // insulin lowers, glucagon raises
  assert.match(correctText(raw('hormones', 'glucagon')), /glucagon.*liver release/);
});

/* ---------------------------------------------------------------- lesson 4 */

test('lesson 4: the response curves match the figures the lesson quotes', () => {
  const first = describeResponse('first');
  const memory = describeResponse('memory');
  assert.equal(first.lag, FACTS.response.first.lag);
  assert.equal(first.peakDay, FACTS.response.first.peakDay);
  assert.equal(first.illDays, FACTS.response.first.illDays);
  assert.equal(memory.lag, FACTS.response.memory.lag);
  assert.equal(memory.peakDay, FACTS.response.memory.peakDay);
  assert.equal(memory.illDays, 0);
  assert.ok(Math.abs(memory.peak - FACTS.response.memory.times) <= 1.5, `the memory peak is about 20 times the first: ${memory.peak}`);
  for (let d = 0; d <= 28; d += 0.25) assert.ok(responseCurves('memory', d).microbes < ILL_AT, 'no illness the second time');
  const accept2 = check('immune-system', 'second-meeting');
  for (const sawSame of [false, true]) for (const sawDifferent of [false, true]) {
    const out = accept2({ sawSame, sawDifferent, count: 2 });
    assert.equal(out === true, sawSame && sawDifferent);
    if (typeof out === 'string' && /memory response/.test(out)) assert.ok(sawSame && !sawDifferent);
    if (typeof out === 'string' && /all over again/.test(out)) assert.ok(sawDifferent && !sawSame);
  }
  assert.ok(accepts(check('immune-system', 'first-meeting'), { count: 1 }) && !accepts(check('immune-system', 'first-meeting'), { count: 0 }));
});

test('lesson 4: who has met the virus before', () => {
  let firsts = 0;
  const n = eachVariant('immune-system', 'who-remembers', (s, text) => {
    const [a, b] = grab(/\| \| (\w+) \| (\w+) \|/, text);
    const row = (label) => grab(new RegExp(`\\| ${label} \\| (?:day )?(\\d+) \\| (?:day )?(\\d+) \\|`), text).map(number);
    const detected = row('Antibodies first detected');
    const peakDay = row('Antibody peak');
    const level = row('Peak level \\(units\\)');
    // the one whose antibodies came sooner, peaked sooner and peaked higher has memory cells
    const votes = [detected[0] < detected[1], peakDay[0] < peakDay[1], level[0] > level[1]];
    assert.ok(votes.every((v) => v === votes[0]), 'all three rows point the same way');
    const want = votes[0] ? a : b;
    if (votes[0]) firsts++;
    assert.equal(correctText(s), want);
    assert.ok(Math.max(...level) >= 10 * Math.min(...level), 'the memory peak is at least ten times higher');
    assert.ok(Math.min(...detected) <= 3 && Math.max(...detected) >= 5);
    assert.ok(flat(s.explain).startsWith(`**${want}.**`));
    assert.equal(s.options.length, 3);
  });
  assert.ok(n > 100 && firsts > 50 && firsts < 150, 'either person can be the one');
});

const SUPPORTED = ['Being up to date with vaccines', 'Getting enough sleep', 'Not smoking', 'Eating enough, with a varied diet'];
const NOT_SUPPORTED = ['"Immune-boosting" supplements for well-fed people', 'Large doses of vitamin C to prevent colds', '"Detox" teas and juices', 'Antibiotics at the first sign of a cold'];

test('lesson 4: what supports the immune system, and the picks on the pictures', () => {
  eachVariant('immune-system', 'boosting', (s) => {
    assert.equal(s.items.length, 6);
    for (const item of s.items) {
      const ok = SUPPORTED.includes(item.text);
      assert.ok(ok || NOT_SUPPORTED.includes(item.text), `"${item.text}" is in this file's table`);
      assert.equal(item.bucket, ok ? 0 : 1, item.text);
      assert.ok(item.why && item.why.length > 30);
    }
    assert.equal(s.items.filter((i) => i.bucket === 0).length, 3);
  });
  assert.equal(H.IMMUNE_CLAIMS.length, SUPPORTED.length + NOT_SUPPORTED.length);
  const nodes = check('immune-system', 'lymph-nodes');
  for (const id of ['lymph-nodes-neck', 'lymph-nodes-armpit', 'lymph-nodes-groin', 'spleen', 'thymus']) {
    const out = nodes({ picked: id, nameThe: 'x' });
    assert.equal(out === true, id === 'lymph-nodes-neck', id);
    if (id !== 'lymph-nodes-neck') assert.equal(typeof out, 'string');
  }
  assert.deepEqual(expandIds(raw('immune-system', 'lymph-nodes').widget.pickable).sort(), ['lymph-nodes-armpit', 'lymph-nodes-groin', 'lymph-nodes-neck', 'spleen', 'thymus']);
  const cell = check('immune-system', 'phagocyte');
  for (const h of raw('immune-system', 'phagocyte').widget.hotspots) assert.equal(cell({ picked: h.id }) === true, h.id === 'cell');
  // allergy, autoimmune, weakened
  const sort = raw('immune-system', 'misfires');
  const bucketOf = (re) => sort.items.find((i) => re.test(i.text)).bucket;
  assert.equal(bucketOf(/Hay fever/), 0);
  assert.equal(bucketOf(/peanuts/), 0);
  assert.equal(bucketOf(/Type 1 diabetes/), 1);
  assert.equal(bucketOf(/Rheumatoid/), 1);
  assert.equal(bucketOf(/Multiple sclerosis/), 1);
  assert.equal(bucketOf(/HIV/), 2);
});

/* ---------------------------------------------------------------- lesson 5 */

test('lesson 5: the biceps force from the lever rule', () => {
  const ratios = new Set();
  eachVariant('muscles-bones', 'lever-calc', (s, text) => {
    const [kg] = grab(/weighing \*\*(\d+) kg\*\*/, text).map(number);
    const [reach] = grab(/load is \*\*(\d+) cm\*\* from the elbow/, text).map(number);
    const [attach] = grab(/attaches \*\*(\d+) cm\*\* from the elbow/, text).map(number);
    assert.match(text, /1 kg weighs 10 N/);
    // balance of turning effects about the elbow: F × attach = weight × reach
    const force = (kg * 10 * reach) / attach;
    assert.ok(Math.abs(force - Math.round(force)) < 1e-9);
    assert.equal(s.answer, Math.round(force));
    assert.equal(s.unit, 'N');
    ratios.add(reach / attach);
    assert.ok(attach >= 3 && attach <= 5 && reach >= 28 && reach <= 40, 'a plausible forearm');
    assert.ok(flat(s.explain).includes(`**${Math.round(force)} N**`));
    assert.ok(s.wrong.some(([v]) => v === kg * 10), 'the weight of the load is a listed slip');
  });
  assert.ok(ratios.size >= 5);
});

const TISSUE = { sprain: 'A ligament', strain: 'A muscle or its tendon', fracture: 'A bone' };

test('lesson 5: sprain, strain, fracture', () => {
  const kinds = new Set();
  eachVariant('muscles-bones', 'injuries', (s, text) => {
    const [word] = grab(/\*\*(sprain|strain|fracture)(?:ed)?\*\*/, text);
    kinds.add(word);
    assert.equal(correctText(s), TISSUE[word]);
    assert.equal(s.options.length, 4);
    assert.match(flat(s.explain), new RegExp(`A \\*\\*${word}\\*\\*`));
  });
  assert.equal(kinds.size, 3);
});

test('lesson 5: the arm, the leg and the X-ray accept exactly what the instructions ask for', () => {
  const reach = raw('muscles-bones', 'lever-attach').widget.reach;
  assert.equal(reach, 32);
  const attachStep = check('muscles-bones', 'lever-attach');
  const range = raw('muscles-bones', 'lever-attach').widget.attachRange;
  for (let a = range[0]; a <= range[1]; a += range[2]) {
    const ratio = Math.round((reach / a) * 100) / 100;
    const out = attachStep({ attach: a, ratio });
    assert.equal(out === true, a === 8, `attached at ${a} cm`);
    if (typeof out === 'string') assert.ok(out.includes(String(ratio)), 'the feedback quotes the ratio');
    if (typeof out === 'string' && /should be less/.test(out)) assert.ok(ratio > 4);
  }
  // the hook and the first experiment: 32 cm against 4 cm is eight times
  assert.equal(H.SKELETON.forearmReach / H.SKELETON.bicepsAttach, 8);
  assert.match(correctText(raw('muscles-bones', 'hook')), /eight times/);
  const explore = check('muscles-bones', 'lever-explore');
  for (let n = 1; n <= 4; n++) assert.equal(accepts(explore, { loads: Array.from({ length: n }, (_, i) => i + 1) }), n >= 3);
  const pairs = check('muscles-bones', 'pairs');
  for (const bent of [false, true]) for (const straightened of [false, true]) assert.equal(accepts(pairs, { bent, straightened }), bent && straightened);
  const pull = check('muscles-bones', 'pull-only');
  for (const id of raw('muscles-bones', 'pull-only').widget.pickable) {
    const out = pull({ picked: id, nameThe: `the ${id}` });
    assert.equal(out === true, id === 'quadriceps', id);
    if (id !== 'quadriceps') assert.equal(typeof out, 'string');
    if (typeof out === 'string' && /a bone/.test(out)) assert.equal(structureInfo(id).system, 'skeleton');
  }
  assert.match(structureInfo('quadriceps').note, /straightens the knee/);
  const xray = check('muscles-bones', 'xray');
  for (const h of raw('muscles-bones', 'xray').widget.hotspots) assert.equal(xray({ picked: h.id }) === true, h.id === 'wrist');
  // three kinds of muscle
  const sort = raw('muscles-bones', 'three-muscles');
  const bucketOf = (re) => sort.items.find((i) => re.test(i.text)).bucket;
  assert.equal(bucketOf(/Biceps/), 0);
  assert.equal(bucketOf(/diaphragm/), 0);
  assert.equal(bucketOf(/stomach/), 1);
  assert.equal(bucketOf(/arteries/), 1);
  assert.equal(bucketOf(/heart/), 2);
  // tendon: muscle to bone; ligament: bone to bone
  const pairsOf = Object.fromEntries(raw('muscles-bones', 'connectors').pairs);
  assert.match(pairsOf.Tendon, /muscle to a bone/);
  assert.match(pairsOf.Ligament, /bone to a bone/);
  assert.match(correctText(raw('muscles-bones', 'knuckles')), /No arthritis in either hand/);
});

/* ---------------------------------------------------------------- lesson 6 */

test('lesson 6: is this start of puberty inside the typical range?', () => {
  const kinds = new Set();
  eachVariant('life-cycle', 'puberty-range', (s, text) => {
    // the ranges are stated in the question itself
    const [g0, g1] = grab(/between \*\*(\d+) and (\d+)\*\* in girls/, text).map(number);
    const [b0, b1] = grab(/between \*\*(\d+) and (\d+)\*\* in boys/, text).map(number);
    assert.deepEqual([g0, g1, b0, b1], [...FACTS.pubertyGirls, ...FACTS.pubertyBoys]);
    const story = text.slice(text.indexOf('An example:'));
    const girl = /\bher\b/.test(story);
    assert.notEqual(girl, /\bhis\b/.test(story), 'the story says whose range applies');
    const [age] = grab(/(?:at age|is) (\d+)/, story).map(number);
    const [lo, hi] = girl ? [g0, g1] : [b0, b1];
    assert.ok(age !== lo && age !== hi, 'never exactly on a boundary');
    const want = age < lo ? 'Earlier than the typical range' : age > hi ? 'Later than the typical range' : 'Within the typical range';
    if (/no signs of puberty yet/.test(story)) assert.ok(age > hi, 'only a late case is told as "not yet"');
    assert.equal(correctText(s), want);
    kinds.add(`${girl}${want}`);
    if (want !== 'Within the typical range') assert.match(flat(s.explain), /worth mentioning to a doctor/);
  });
  assert.equal(kinds.size, 6);
});

test('lesson 6: ovulation is about 14 days before the next period', () => {
  const lengths = new Set();
  eachVariant('life-cycle', 'ovulation-day', (s, text) => {
    const [length] = grab(/\*\*(\d+) days\*\* long/, text).map(number);
    assert.match(text, /usual 14 days between ovulation and the next period/);
    assert.ok(length >= FACTS.cycle[0] && length <= FACTS.cycle[1] && length !== 28);
    assert.equal(s.answer, length - FACTS.luteal);
    lengths.add(length);
    assert.ok(flat(s.explain).includes(`**day ${length - 14}**`));
  });
  assert.ok(lengths.size >= 10);
});

test('lesson 6: the cycle model and its experiments', () => {
  for (let length = 21; length <= 35; length++) {
    const o = ovulationDay(length);
    assert.equal(o, length - FACTS.luteal);
    // LH peaks on the day before the egg is released; progesterone peaks about a week after; oestrogen peaks before LH does
    const days = Array.from({ length }, (_, i) => i + 1);
    const top = (name) => days.reduce((a, b) => (hormoneLevels(b, length)[name] > hormoneLevels(a, length)[name] ? b : a));
    assert.equal(top('LH'), o - 1, `LH peak in a ${length}-day cycle`);
    assert.ok(top('oestrogen') <= top('LH') && top('oestrogen') >= o - 4, `oestrogen peak in a ${length}-day cycle: day ${top('oestrogen')}`);
    assert.ok(Math.abs(top('progesterone') - (o + 7)) <= 1, `progesterone peak in a ${length}-day cycle`);
    assert.ok(hormoneLevels(o - 4, length).progesterone < 0.1 && hormoneLevels(length, length).progesterone < 0.25, 'progesterone is low before ovulation and has fallen by the next period');
    assert.equal(phaseOf(1, length), 'period');
    assert.equal(phaseOf(o, length), 'ovulation');
    assert.equal(phaseOf(o + 1, length), 'after');
    assert.ok(liningThickness(5, length) < liningThickness(o, length) && liningThickness(o, length) < liningThickness(length, length), 'the lining is thinnest after the period and thickest before the next');
  }
  const explore = check('life-cycle', 'cycle-explore');
  for (let day = 1; day <= 28; day++) {
    const out = explore({ day, length: 28, ovulation: 14, phase: phaseOf(day, 28) });
    assert.equal(out === true, day === 14, `day ${day}`);
    if (typeof out === 'string' && /Not yet/.test(out)) assert.ok(day < 14);
    if (typeof out === 'string' && /Go back/.test(out)) assert.ok(day > 14);
  }
  const longer = check('life-cycle', 'cycle-length');
  for (let length = 21; length <= 35; length++) for (let day = 1; day <= length; day++) {
    const out = longer({ day, length, ovulation: length - 14, phase: phaseOf(day, length) });
    assert.equal(out === true, length === 35 && day === 21, `length ${length}, day ${day}`);
  }
  assert.deepEqual(raw('life-cycle', 'cycle-length').solution, { length: 35, day: 21 });
  // the pictures
  const kary = check('life-cycle', 'karyotype');
  for (const h of raw('life-cycle', 'karyotype').widget.hotspots) assert.equal(kary({ picked: h.id }) === true, h.id === 'xy');
  const where = check('life-cycle', 'where-it-grows');
  for (const id of ['ovaries', 'uterus', 'bladder']) assert.equal(where({ picked: id }) === true, id === 'uterus');
  assert.deepEqual(raw('life-cycle', 'where-it-grows').widget.pickable.slice().sort(), ['bladder', 'ovaries', 'uterus']);
  // four hormones, four jobs
  const jobs = Object.fromEntries(raw('life-cycle', 'cycle-match').pairs);
  assert.match(jobs.FSH, /ripen/);
  assert.match(jobs.Oestrogen, /Rebuilds the lining/);
  assert.match(jobs.LH, /releases the egg/);
  assert.match(jobs.Progesterone, /after ovulation/);
  // puberty: what happens in which bodies
  const sort = raw('life-cycle', 'puberty-changes');
  const bucketOf = (re) => sort.items.find((i) => re.test(i.text)).bucket;
  assert.equal(bucketOf(/Periods/), 0);
  assert.equal(bucketOf(/Breasts/), 0);
  assert.equal(bucketOf(/Sperm/), 1);
  assert.equal(bucketOf(/Testicles/), 1);
  assert.equal(bucketOf(/growth spurt/), 2);
  assert.equal(bucketOf(/Hair/), 2);
  // later life, and the two predictions
  assert.deepEqual(raw('life-cycle', 'trainable').options.filter((o) => o.correct).map((o) => o.text).sort(), ['Balance', 'Learning new skills', 'Muscle strength']);
  assert.equal(raw('life-cycle', 'life-expectancy').answer, FACTS.lifeNow);
  assert.match(correctText(raw('life-cycle', 'hook')), /45$/);
});

/* ---------------------------------------------------------------- lesson 7 */

test('lesson 7: the fertile window, counted back from the next period', () => {
  const lengths = new Set();
  eachVariant('sexual-health', 'window-days', (s, text) => {
    const [length] = grab(/\*\*(\d+) days\*\* long/, text).map(number);
    assert.match(text, /14 days before the next period/);
    assert.match(text, /\*\*5 days before it\*\*/);
    const ov = length - FACTS.luteal;
    assert.deepEqual(s.blanks.map((b) => b.numbers[0]), [ov, ov - (FACTS.fertileWindow - 1), ov]);
    assert.ok(ov - 5 >= 1, 'the window opens on a real day of the cycle');
    lengths.add(length);
    assert.ok(flat(s.explain).includes(`**day ${ov - 5} to day ${ov}**`));
  });
  assert.ok(lengths.size >= 10);
  // the fixed statements about cycles of 22, 28 and 35 days
  const win = (length) => [length - 19, length - 14];
  assert.deepEqual(win(28), [9, 14]);
  assert.deepEqual(win(35), [16, 21]);
  assert.deepEqual(win(22), [3, 8]);
  const safe = raw('sexual-health', 'safe-days');
  for (const o of safe.options) {
    const m = /(\d+)-day/.exec(o.text);
    if (m) { const [a, b] = win(number(m[1])); assert.equal(!!o.correct, 7 >= a && 7 <= b, o.text); } else assert.ok(!o.correct);
  }
});

test('lesson 7: typical use, per hundred and per region', () => {
  const methods = new Set();
  const byName = { 'the external condom': 'condom', 'the pill': 'pill', 'the three-monthly injection': 'injection', 'the copper IUD (coil)': 'iud', 'the implant': 'implant', withdrawal: 'withdrawal' };
  eachVariant('sexual-health', 'per-100', (s, text) => {
    const [name, rate] = grab(/With typical use, (.+?) has a failure rate of \*\*([\d.]+) in 100\*\*/, text);
    const id = byName[name];
    assert.ok(id, `"${name}" is in this file's table`);
    assert.equal(number(rate), FACTS.methods[id][0], `${id}: typical use`);
    const [couples] = grab(/\*\*([\d,]+) couples\*\*/, text).map(number);
    const want = (number(rate) * couples) / 100;
    assert.ok(Math.abs(want - Math.round(want)) < 1e-9, 'a whole number of pregnancies');
    assert.equal(s.answer, Math.round(want));
    methods.add(id);
    assert.ok(flat(s.explain).includes(`**${Math.round(want)}**`));
    for (const [slip, msg] of s.wrong) if (/perfect-use/.test(msg)) assert.ok(Math.abs(slip - (FACTS.methods[id][1] * couples) / 100) < 1e-9);
  });
  assert.equal(methods.size, 6);
  // the table in the explanation of the exploring step quotes this file's figures
  const table = flat(raw('sexual-health', 'year-explore').explain);
  for (const [label, id] of [['No method', 'none'], ['Withdrawal', 'withdrawal'], ['Condom', 'condom'], ['The pill', 'pill'], ['Injection', 'injection'], ['Copper IUD', 'iud'], ['Implant', 'implant']]) {
    assert.ok(table.includes(`| ${label} | ${FACTS.methods[id][0]} | ${FACTS.methods[id][1]} |`), `${label} row`);
  }
  assert.equal(raw('sexual-health', 'hook').answer, FACTS.methods.none[0]);
  // "find a method under 1 in 100 with typical use": the IUD and the implant, and only with the typical-use view
  const fit = check('sexual-health', 'fit-and-forget');
  for (const [id, [typical, perfect]] of Object.entries(FACTS.methods)) for (const use of ['typical', 'perfect']) {
    const rate = use === 'typical' ? typical : perfect;
    const out = fit({ method: id, use, rate, marked: Math.round(rate), typical, perfect });
    assert.equal(out === true, use === 'typical' && (id === 'iud' || id === 'implant'), `${id}, ${use}`);
    if (typeof out === 'string' && /in 100 couples/.test(out)) assert.ok(out.includes(`${Math.round(typical)} in 100`));
  }
  const year = check('sexual-health', 'year-explore');
  for (let n = 1; n <= 5; n++) for (const sawPerfect of [false, true]) assert.equal(accepts(year, { seen: Array(n).fill('x'), sawPerfect }), n >= 4 && sawPerfect);
  const windowStep = check('sexual-health', 'fertile-window');
  for (let n = 1; n <= 4; n++) assert.equal(accepts(windowStep, { lengths: Array(n).fill(0) }), n >= 3);
});

const FIRST_STEP = [
  [/condom split|without contraception/, /pharmacy or clinic, today/],
  [/ever been tested|bother with a test/, /for a test/],
  [/which contraception would suit|forgetting her pill/, /to compare methods/],
];

test('lesson 7: where to go, how methods work, what is true of infections, and what consent is', () => {
  const seen = new Set();
  eachVariant('sexual-health', 'where-to-go', (s, text) => {
    const hits = FIRST_STEP.filter(([re]) => re.test(text));
    assert.equal(hits.length, 1);
    assert.match(correctText(s), hits[0][1]);
    seen.add(text);
    assert.ok(!s.options.find((o) => /wait to see/.test(o.text)).correct, 'waiting is never the answer');
    assert.match(flat(s.explain), /differ from country to country/);
  });
  assert.equal(seen.size, H.SERVICE_CASES.length);
  const groups = raw('sexual-health', 'group-methods');
  const groupOf = (re) => groups.items.find((i) => re.test(i.text)).bucket;
  assert.equal(groupOf(/External condom/), 0);
  assert.equal(groupOf(/Internal condom/), 0);
  assert.equal(groupOf(/Diaphragm/), 0);
  assert.equal(groupOf(/The pill/), 1);
  assert.equal(groupOf(/Implant/), 1);
  assert.equal(groupOf(/Injection/), 1);
  assert.equal(groupOf(/Copper IUD/), 2);
  assert.equal(groupOf(/Withdrawal/), 2);
  assert.equal(correctText(raw('sexual-health', 'only-condoms')), 'Condoms');
  const sti = raw('sexual-health', 'sti-facts');
  const truth = (re) => sti.items.find((i) => re.test(i.text)).bucket === 0;
  assert.ok(truth(/no symptoms/) && truth(/cured with antibiotics/) && truth(/HPV vaccine/) && truth(/does not pass HIV on/));
  assert.ok(!truth(/tell by looking/) && !truth(/many partners/) && !truth(/pill gives some protection/));
  const consent = raw('sexual-health', 'consent');
  const yes = consent.items.filter((i) => i.bucket === 0).map((i) => i.text);
  assert.deepEqual(yes, ['Says a clear yes, wide awake, clear-headed and under no pressure']);
  for (const item of consent.items) assert.ok(item.why && item.why.length > 30, `${item.text} explains itself`);
  assert.equal(consent.items.length, 6);
});

/* ------------------------------------------------------------------ safety */

test('safety: the disclaimer once, no requests for personal health data, sober tone and help where assault is mentioned', () => {
  let disclaimers = 0;
  const personal = /\b(your (own )?(weight|height|age|blood pressure|cycle|period|symptoms|medicines|mood|diet|intake|bmi)\b|enter your|type in your|how much do you weigh|how old are you|when was your last)/i;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < 40; k++) {
        const s = resolveStep(step, makeRng(3 + k * 211), step.id);
        const all = visible(s).map(flat).join(' | ');
        if (all.includes('A note before we start.')) { if (k === 0) disclaimers++; assert.equal(id, 'nervous-system'); assert.ok(lesson.steps.indexOf(step) <= 1, 'on the first or second step'); assert.ok(all.includes(H.DISCLAIMER.slice(2))); }
        assert.ok(!personal.test(all), `${id}/${step.id} asks for personal health data: ${(personal.exec(all) || [])[0]}`);
        assert.ok(!/\b(the obese|normal people|ideal weight|junk food|committed suicide)\b/i.test(all), `${id}/${step.id}: wording`);
        if (/suicid|self-harm/i.test(all)) assert.equal(step.tone || lesson.tone, 'sober', `${id}/${step.id}`);
        if (/\bassault|\babuse\b|\brape\b/i.test(all)) {
          assert.equal(step.tone || lesson.tone, 'sober', `${id}/${step.id} mentions assault and is sober`);
          assert.match(all, /emergency number/);
          assert.match(all, /800 656 4673/);
          assert.match(all, /0808 500 2222/);
          assert.match(all, /0800 1111/);
          assert.match(all, /findahelpline\.com/);
          assert.match(all, /never the fault/);
        }
        if (!step.gen) break;
      }
    }
  }
  assert.equal(disclaimers, 1, 'the standard disclaimer appears exactly once in the course');
  assert.equal(raw('sexual-health', 'consent').tone, 'sober');
  // urgent warnings are stated plainly where symptoms come up
  assert.match(flat(raw('hormones', 'no-insulin').explain), /need a doctor \*\*urgently\*\*/);
  assert.match(flat(raw('hormones', 'no-insulin').explain), /vomiting, stomach pain, fast deep breathing or drowsiness.*call your emergency number/, 'the signs of ketoacidosis are an emergency');
  assert.match(flat(raw('hormones', 'treat').explain), /falls too low, which is dangerous/, 'low blood glucose is not played down');
  assert.match(flat(raw('hormones', 'treat').explain), /worked out with their diabetes team/, 'no dosing guidance');
  assert.match(flat(raw('immune-system', 'inflammation').explain), /stiff neck, a rash that does not fade when pressed, confusion or trouble breathing is an emergency: call your emergency number/);
  assert.match(flat(raw('immune-system', 'inflammation').explain), /baby under three months needs medical help \*\*urgently\*\*/);
  assert.match(flat(raw('immune-system', 'misfires').explain), /call your emergency number at once/);
  assert.match(flat(raw('immune-system', 'lymph-nodes').explain), /a week or two is worth showing to a doctor/, 'NHS (England) says 1 week, HSE (Ireland) 2 weeks: the lesson gives the range');
  assert.match(flat(raw('senses', 'try-this').text), /sudden loss or change of sight or hearing.*medical help the same day/i);
  // the help lines, typed in again here. Verified by the reviewer in November 2026: RAINN's National Sexual Assault Hotline
  // 800 656 4673; Rape Crisis England & Wales 24/7 line 0808 500 2222 (for ages 16 and over); Childline 0800 1111 (under 19, UK)
  assert.deepEqual(H.ASSAULT_HELP.map((line) => (/\d[\d ]{6,}\d/.exec(line) || [''])[0]), ['', '800 656 4673', '0808 500 2222', '0800 1111', '']);
  assert.match(H.ASSAULT_HELP[2], /16 or over/, 'the Rape Crisis line is for people aged 16 and over');
  assert.match(H.ASSAULT_HELP[3], /under 19/, 'so younger readers are given Childline');
  // steps that deal with serious illness, urgent symptoms, death or assault drop the cheering
  for (const [lesson, id] of [['hormones', 'no-insulin'], ['hormones', 'treat'], ['immune-system', 'inflammation'], ['immune-system', 'misfires'], ['life-cycle', 'life-expectancy'], ['sexual-health', 'sti-facts'], ['sexual-health', 'consent']]) {
    assert.equal(raw(lesson, id).tone, 'sober', `${lesson}/${id} is sober`);
  }
  // the reaction timer reports a time, never a verdict on the learner
  const timer = readFileSync(fileURLToPath(new URL('../src/widgets/reaction-timer.js', import.meta.url)), 'utf8');
  assert.match(timer, /a demonstration, not a test of you/);
  assert.ok(!/\b(slow|poor|below average|abnormal|impaired)\b/i.test(timer.replace(/\/\*[\s\S]*?\*\//, '')), 'no judging words in the reaction timer');
  // consent items can be judged from their own wording
  const consentTexts = raw('sexual-health', 'consent').items.map((i) => i.text);
  assert.ok(consentTexts.some((t) => /last week, and has not been asked today/.test(t)) && consentTexts.some((t) => /kissing, and the other person takes that as a yes to more/.test(t)));
  // the table of failure rates names its source and year, and emergency contraception is described as WHO describes it
  assert.match(flat(raw('sexual-health', 'year-explore').explain), /first year of use \(Trussell and Aiken, 2018/);
  assert.match(flat(raw('sexual-health', 'group-methods').explain), /within 5 days after unprotected sex\. Sooner is better\. It prevents a pregnancy from starting; it does not end one/);
  // self-experiments can always be skipped: none of them is graded on what the learner's body does
  assert.equal(raw('nervous-system', 'reaction-test').graded, false);
  assert.equal(raw('senses', 'hook').mode, 'predict');
  assert.equal(raw('senses', 'two-point').mode, 'predict');
});

test('every body-map id exists, and the reproductive layers appear only where a step needs them', () => {
  const known = new Set([...structureIds(), ...anchorIds(), ...Object.keys(systemNames())]);
  const ok = (id) => known.has(id) || (expandIds([id]).length > 0 && expandIds([id]).every((x) => known.has(x)));
  let maps = 0;
  const layered = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) {
    for (let k = 0; k < 30; k++) {
      const s = resolveStep(step, makeRng(11 + k * 17), step.id);
      for (const spec of [s.widget, s.figure].flat().filter((f) => f && f.type === 'body-map')) {
        maps++;
        assert.ok(viewNames().includes(spec.view), `${id}/${step.id}: view ${spec.view}`);
        const ids = [...(spec.show || []), ...(spec.pickable || []), ...(Array.isArray(spec.labels) ? spec.labels.map((l) => (typeof l === 'string' ? l : l.id)).filter(Boolean) : []), ...(spec.focus || []), ...(spec.hide || []), ...[spec.answer].flat().filter(Boolean)];
        for (const x of ids) assert.ok(ok(x), `${id}/${step.id}: "${x}" is a body-map id`);
        assert.ok(spec.alt && spec.alt.length > 40, `${id}/${step.id}: alt text`);
        if (expandIds(ids).some((x) => structureInfo(x) && structureInfo(x).layer)) layered.push(`${id}/${step.id}`);
        if (s.solution && s.solution.picked) assert.ok(ok(s.solution.picked));
        if (s.solution && s.solution.seen) for (const x of s.solution.seen) assert.ok(ok(x));
      }
      if (!step.gen) break;
    }
  }
  assert.ok(maps >= 6, `${maps} body-map figures`);
  assert.deepEqual([...new Set(layered)], ['life-cycle/where-it-grows']);
});

test('every photograph comes from the course manifest, with a licence, a credit and a description', () => {
  const used = new Set();
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) {
    for (const spec of [step.widget, step.figure].flat().filter((f) => f && f.type === 'photo')) {
      const m = /content\/media\/body-control\/([a-z0-9-]+)\.jpg/.exec(spec.src);
      assert.ok(m, `${id}/${step.id}: a picture of this course`);
      const rec = manifest.images[m[1]];
      assert.ok(rec, `${m[1]} is in the manifest`);
      used.add(m[1]);
      assert.ok(rec.license && /commons\.wikimedia\.org/.test(rec.sourceUrl), `${m[1]}: licence and source`);
      assert.ok(rec.author && rec.author.length > 3, `${m[1]}: a credit`);
      assert.equal(spec.license, rec.license);
      assert.ok(spec.alt && spec.alt.length > 60, `${m[1]}: alt text`);
      assert.ok(spec.hotspots && spec.hotspots.length >= 3, `${m[1]} is used by its step: the learner taps a part of it`);
      for (const h of spec.hotspots) assert.ok(h.x > 0 && h.x < 1 && h.y > 0 && h.y < 1 && h.r >= 0.05 && h.label && h.alt);
    }
  }
  assert.deepEqual([...used].sort(), Object.keys(manifest.images).sort(), 'every picture in the manifest is used, and nothing else');
  assert.ok(used.size <= 12);
});

/* ------------------------------------------------------------------- guard */

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.slice().sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} is generated, but no test above re-derives it`);
  }
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) {
    if (step.type !== 'interact') continue;
    const s = resolveStep(step, makeRng(1), step.id);
    assert.equal(typeof s.check, 'function', `${id}/${step.id}`);
    assert.ok(s.solution && s.explain, `${id}/${step.id}`);
  }
});
