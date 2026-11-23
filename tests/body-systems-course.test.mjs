// Independent checks of "The Body I: Fuel, Air and Blood".
//
// 1. A second, separately typed table of the course's facts (FACTS below, each with its source) is compared
//    with the tables in content/courses/body-systems/helpers.js and with the models inside the course's widgets.
// 2. Every generated question is re-solved from its own wording: the numbers and names are parsed out of the
//    text the learner sees, and the answer is worked out again here.
// 3. Every interact step is fed the states its widget can produce (all of them where the state space is
//    small), built with physiology written here, so that `check` accepts exactly what the instruction asks for.
// 4. Safety: the standard disclaimer appears once, no step asks for the learner's own health data, steps
//    about danger to life are sober and say to call for help, every body-map id exists and every picture
//    has a licence and a credit.
//
//   node --test tests/body-systems-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import course from '../content/courses/body-systems/course.js';
import * as H from '../content/courses/body-systems/helpers.js';
import { TISSUES, STOPS as CLOCK, originalShare } from '../src/widgets/cell-turnover.js';
import { PHASES, VALVES, openValves, valveFaults, cardiacOutput } from '../src/widgets/heart-cycle.js';
import { TYPES, canGive, antigens, antibodies } from '../src/widgets/blood-match.js';
import { leavingBlood, saturation, THICKNESSES, AREAS } from '../src/widgets/air-sac.js';
import { STOPS as GUT_STOPS, STATIONS, inWords } from '../src/widgets/gut-journey.js';
import { fuelAt, MIX, EFFORTS, TIMES } from '../src/widgets/fuel-mix.js';
import { simulate, GAINS, DELAYS } from '../src/widgets/feedback-loop.js';
import { waterDay, SWEATS } from '../src/widgets/water-balance.js';
import { structureIds, anchorIds, expandIds, structureName, structureNameThe, structureInfo } from '../src/widgets/body-map.js';

const SEEDS = 200;
const LESSONS = ['cells-to-systems', 'heart-circulation', 'blood', 'breathing', 'digestion', 'energy', 'kidneys-balance'];
/** Every generated step of the course. Each is re-derived by a test below; the last test keeps the list complete. */
const GENERATED = {
  'cells-to-systems': ['how-small', 'which-system', 'find-organ'],
  'heart-circulation': ['harvey-sum', 'pulse'],
  blood: ['donation-share', 'who-can-give', 'can-give'],
  breathing: ['oxygen-used', 'air-per-minute'],
  digestion: ['small-molecules', 'villi-area'],
  energy: ['organ-power', 'kj-kcal'],
  'kidneys-balance': ['filter-day', 'taken-back'],
};
const tested = new Set();

/* -------------------------------------------------------------- own facts */

// Typed here from the verified notes, independently of helpers.js. Source and year beside each.
const FACTS = {
  cells: { low: 30, high: 37, bacteria: 38 },            // trillion. Sender, Fuchs & Milo, PLOS Biol 2016; Bianconi et al. 2013
  sizesUm: { 'gut bacterium': 2, 'sperm cell': 5, 'red blood cell': 8, 'liver cell': 25, 'egg cell': 100 },   // textbook values
  lifeDays: { gut: 5, skin: 30, red: 120 },              // Sender & Milo, Nat Med 2021 (gut 3 to 5 days, red cells about 120 days)
  fatPerYear: 0.1,                                       // Spalding et al., Nature 2008
  heartRenewal: [0.01, 0.0045],                          // a year at ages 25 and 75. Bergmann et al., Science 2009
  heart: { rate: [60, 100], stroke: 70, output: 5, blood: 5, left: 120, right: 25, aorta: [120, 80], lungArtery: [25, 10], harvey: 1628 },   // AHA; Guyton & Hall; Merck Manual
  bloodPath: ['Right atrium', 'Right ventricle', 'Lungs', 'Left atrium', 'Left ventricle', 'Body'],
  blood: { plasma: 55, red: 45, redLife: 120, o2PerLitre: 200, o2Dissolved: 3, co: 200, madePerSecond: 2 },   // haematology references; NHSBT; ATSDR 2012
  // who can receive red cells from whom: recipient -> donors (the ABO and RhD rule in every transfusion handbook)
  donorsFor: {
    'O-': ['O-'], 'O+': ['O-', 'O+'], 'A-': ['O-', 'A-'], 'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'], 'B+': ['O-', 'O+', 'B-', 'B+'], 'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  },
  breath: { oxygenIn: 21, oxygenOut: 16, rate: [12, 20], tidal: 500, sacs: 480, surface: 70 },   // physiology texts; Ochs et al. 2004
  airway: ['nose', 'throat', 'windpipe', 'bronchi', 'bronchioles', 'air sacs'],
  gut: ['mouth', 'oesophagus', 'stomach', 'small intestine', 'large intestine'],
  gutHours: { stomach: [2, 5], small: [2, 6], large: [10, 59] },   // Lee et al., J Neurogastroenterol Motil 2014
  gutSurface: 30,                                        // m². Helander & Fändriks 2014
  cutInto: { Starch: 'Sugars such as glucose', Protein: 'Amino acids', Fat: 'Fatty acids' },
  enzymes: { Amylase: 'Starch', Pepsin: 'Protein', Lipase: 'Fat', Lactase: 'Milk sugar (lactose)' },
  energy: { kjPerKcal: 4.2, atp: [30, 2], fatAsCO2: 84, fatAsWater: 16, restingWatts: 80 },   // Meerman & Brown, BMJ 2014; biochemistry texts
  organShare: { brain: 20, liver: 20, 'resting muscles': 20, heart: 10, kidneys: 10 },         // rounded from Elia 1992
  balance: { core: [36.5, 37.5], fever: 38, filterMlMin: 125, filterLDay: 180, urine: [1, 2] },   // NHS; Guyton & Hall
  water: { made: 0.3, fixedLoss: 0.9, minUrine: 0.5 },   // litres a day; physiology texts (about 2.5 L in and out)
  // organs on the body diagram: which body-map structures count, and on which side of the person they lie
  organs: {
    heart: { ids: ['heart'], says: /person's left/ },
    lungs: { ids: ['left-lung', 'right-lung'], says: /either side of the heart/ },
    liver: { ids: ['liver'], says: /upper right/ },
    stomach: { ids: ['stomach'], says: /upper left/ },
    'small intestine': { ids: ['small-intestine'], says: /middle of the abdomen/ },
    'large intestine': { ids: ['large-intestine'], says: /framing the small intestine/ },
    bladder: { ids: ['bladder'], says: /low in the pelvis/ },
  },
  systemOf: {
    heart: 'Circulatory system', 'arteries and veins': 'Circulatory system', lungs: 'Respiratory system', windpipe: 'Respiratory system',
    stomach: 'Digestive system', 'small intestine': 'Digestive system', kidneys: 'Urinary system', bladder: 'Urinary system',
    brain: 'Nervous system', 'spinal cord': 'Nervous system', 'thyroid gland': 'Endocrine system', 'adrenal glands': 'Endocrine system',
    'lymph nodes': 'Immune and lymphatic system', spleen: 'Immune and lymphatic system', skull: 'Skeleton', ribs: 'Skeleton',
    biceps: 'Muscles', hamstrings: 'Muscles', 'sweat glands': 'Skin', 'hair and nails': 'Skin', uterus: 'Reproductive system', prostate: 'Reproductive system',
  },
  organIsPlural: {
    heart: false, 'arteries and veins': true, lungs: true, windpipe: false, stomach: false, 'small intestine': false, kidneys: true, bladder: false,
    brain: false, 'spinal cord': false, 'thyroid gland': false, 'adrenal glands': true, 'lymph nodes': true, spleen: false, skull: false, ribs: true,
    biceps: false, hamstrings: true, 'sweat glands': true, 'hair and nails': true, uterus: false, prostate: false,
  },
  // what a label on such a portion could plausibly say, in kcal (reviewer's table: food-composition tables give about
  // 60 to 65 kcal per 100 mL of whole milk, 130 per 100 g of cooked rice, 600 per 100 g of nuts)
  labelKcal: {
    'a carton of yoghurt': [80, 200], 'a bowl of rice': [150, 350], 'a slice of bread with cheese': [120, 300],
    'a handful of nuts': [120, 250], 'a glass of milk': [80, 180], 'a portion of lentil soup': [120, 300],
  },
  systemJob: [
    [/carries oxygen, fuel and wastes/, 'Circulatory system'], [/brings oxygen into the body/, 'Respiratory system'], [/breaks food down/, 'Digestive system'],
    [/filters the blood/, 'Urinary system'], [/fast electrical signals/, 'Nervous system'], [/hormones/, 'Endocrine system'],
    [/destroys germs/, 'Immune and lymphatic system'], [/supports and protects/, 'Skeleton'], [/pulling on bones/, 'Muscles'],
    [/waterproof barrier/, 'Skin'], [/start a new human being/, 'Reproductive system'],
  ],
};

/* ---------------------------------------------------------------- helpers */

const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/body-systems/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, 'body-systems', id);
}
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('../content/media/body-systems/manifest.json', import.meta.url)), 'utf8'));

const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const number = (s) => Number(String(s).replace(/,/g, ''));
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };
const raw = (lesson, id) => { const step = lessons[lesson].steps.find((s) => s.id === id); assert.ok(step, `step ${lesson}/${id} exists`); return step; };
const one = (lesson, id, seed = 1) => resolveStep(raw(lesson, id), makeRng(seed), id);
const correctText = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: one correct option`); return right[0].text; };
const near = (a, b, tol, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} expected ${b}, got ${a}`);
const grouped = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const figuresOf = (s) => [...(s.figures || []), ...(s.widget ? [s.widget] : []), ...(s.options || []).map((o) => o.figure).filter(Boolean)];

/** Run a generated step with many seeds and hand each concrete step to `verify`. Returns how many different texts were seen. */
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

/** A numeric step: the answer is the one worked out here, the slips are all different from it, hints and explanation quote it. */
function checkNumeric(s, expected, { tol = 1e-9, quotes = [] } = {}) {
  assert.ok(Number.isFinite(s.answer), 'the answer is a number');
  near(s.answer, expected, tol, 'answer');
  assert.ok(s.unit, 'the unit is shown');
  const values = [s.answer, ...(s.wrong || []).map((w) => w[0])];
  assert.equal(new Set(values.map((v) => Math.round(v * 1e6))).size, values.length, `answer and slips are all different: ${values.join(', ')}`);
  for (const [v, msg] of s.wrong || []) { assert.ok(Number.isFinite(v)); assert.ok(msg && msg.length > 15, 'each slip says what went wrong'); }
  assert.ok(s.hints.length >= 1 && s.explain, 'hints and an explanation');
  for (const q of quotes) assert.ok(flat(s.explain).includes(q), `the explanation quotes "${q}": ${flat(s.explain)}`);
}

/** Every string a learner can see in a resolved step (addresses and identifiers excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['type', 'id', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'viewBox', 'content', 'color', 'view', 'mode', 'show', 'hide', 'ids', 'at', 'path', 'pickable', 'answer', 'phase', 'open', 'scenario', 'controls', 'recipient', 'donor', 'selected', 'license', 'credit', 'changes', 'title', 'fit', 'aspect', 'labelPos', 'shape', 'target', 'focus', 'ghost', 'tone']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk({ ...step, title: undefined }, '');
  if (step.title) out.push(step.title);
  return out;
}

const allSteps = () => LESSONS.flatMap((lesson) => lessons[lesson].steps.map((step) => ({ lesson, step })));

/* ------------------------------------------------------------ whole course */

test('course shape: seven lessons of 14 to 20 steps, each with a prediction, hands-on steps, review steps and a recap', () => {
  assert.equal(course.id, 'body-systems');
  assert.deepEqual(course.requires, []);
  assert.equal(course.category, 'health');
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), LESSONS);
  const mine = ['cell-turnover', 'heart-cycle', 'blood-match', 'air-sac', 'gut-journey', 'fuel-mix', 'feedback-loop', 'water-balance', 'body-map'];
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.ok(lesson.steps.length >= 14 && lesson.steps.length <= 20, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) {
      assert.ok(s.explain || s.gen, `${id}/${s.id}: a review step explains itself`);
      if (s.type === 'numeric') assert.equal(typeof s.gen, 'function', `${id}/${s.id}: numeric review steps are generated`);
      assert.ok(!/as (we|you) (just )?saw|above|previous|earlier/i.test(flat(one(id, s.id).text)), `${id}/${s.id}: a review step stands alone`);
    }
    const handsOn = lesson.steps.filter((s) => {
      if (s.type === 'interact') return true;
      const fig = s.figure && !Array.isArray(s.figure) ? s.figure : null;
      return !!fig && mine.includes(fig.type) && !fig.static;
    });
    assert.ok(handsOn.length >= 3, `${id}: ${handsOn.length} hands-on steps`);
    assert.ok(lesson.steps.filter((s) => s.gen).length >= 2, `${id}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${id}: no more than five choice steps`);
    assert.equal(lesson.steps[0].mode, 'predict', `${id} opens with a prediction`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: next`);
    for (let i = 2; i < lesson.steps.length; i++) assert.ok(!lesson.steps.slice(i - 2, i + 1).every((s) => s.type === 'info'), `${id}: three info steps in a row`);
    for (const s of lesson.steps) if (!['info', 'reflect'].includes(s.type)) assert.ok(s.gen || s.explain, `${id}/${s.id} has an explanation`);
    // the last step before the recap is an invitation, not an order
    const last = lesson.steps[lesson.steps.length - 1];
    assert.equal(last.type, 'info', `${id}: ends on something to notice`);
    assert.match(flat(last.text), /An invitation/, `${id}: the last step is framed as an invitation`);
  }
  assert.match(lessons['kidneys-balance'].next, /The Body II/);
});

test('the helper tables agree with the independently typed facts', () => {
  assert.deepEqual([H.CELL_COUNT.humanLow, H.CELL_COUNT.humanHigh, H.CELL_COUNT.bacteria], [FACTS.cells.low, FACTS.cells.high, FACTS.cells.bacteria]);
  for (const c of H.CELL_SIZES) {
    const key = Object.keys(FACTS.sizesUm).find((k) => c.name.includes(k));
    assert.ok(key, `size of ${c.name}`);
    assert.equal(c.um, FACTS.sizesUm[key], c.name);
    for (const span of c.spans) assert.ok(Number.isInteger((span * 1000) / c.um), `${c.name}: ${span} mm holds a whole number of them`);
  }
  assert.equal(H.SYSTEMS.length, 11);
  for (const sy of H.SYSTEMS) {
    for (const organ of sy.organs) assert.equal(FACTS.systemOf[organ], sy.name, `${organ} belongs to the ${sy.name}`);
    const job = FACTS.systemJob.find(([re]) => re.test(sy.job));
    assert.ok(job && job[1] === sy.name, `job of the ${sy.name}`);
  }
  assert.deepEqual(H.LEVELS.map((l) => l.level), ['cell', 'tissue', 'organ', 'system', 'organism']);
  // heart
  assert.deepEqual(H.HEART.restingRate, FACTS.heart.rate);
  assert.equal(H.HEART.stroke, FACTS.heart.stroke);
  assert.equal(H.HEART.output, FACTS.heart.output);
  assert.equal(H.HEART.bloodVolume, FACTS.heart.blood);
  assert.equal(H.HEART.leftPeak, FACTS.heart.left);
  assert.equal(H.HEART.rightPeak, FACTS.heart.right);
  assert.deepEqual(H.HEART.aorta, FACTS.heart.aorta);
  assert.deepEqual(H.HEART.pulmonaryArtery, FACTS.heart.lungArtery);
  assert.equal(H.HEART.harvey, FACTS.heart.harvey);
  near((FACTS.heart.stroke * 70) / 1000, FACTS.heart.output, 0.2, 'about 70 beats of 70 mL make about 5 litres a minute:');
  assert.deepEqual(H.BLOOD_PATH, FACTS.bloodPath);
  // blood
  assert.equal(H.BLOOD.plasmaShare, FACTS.blood.plasma);
  assert.equal(H.BLOOD.redShare, FACTS.blood.red);
  assert.equal(H.BLOOD.redLife, FACTS.blood.redLife);
  assert.equal(H.BLOOD.oxygenPerLitre, FACTS.blood.o2PerLitre);
  assert.equal(H.BLOOD.oxygenDissolved, FACTS.blood.o2Dissolved);
  assert.equal(H.BLOOD.coAffinity, FACTS.blood.co);
  assert.equal(H.BLOOD.redPerSecond, FACTS.blood.madePerSecond);
  assert.equal(H.BLOOD.volume, FACTS.heart.blood);
  for (const d of H.DONATIONS) {
    const pct = (d.ml / (d.litres * 1000)) * 100;
    assert.ok(Math.abs(pct - Math.round(pct)) < 1e-9 && pct >= 7 && pct <= 9, `a donation of ${d.ml} mL from ${d.litres} L is a whole per cent under 10`);
    assert.ok(d.ml >= 350 && d.ml <= 500, 'a realistic donation');
  }
  // breathing
  assert.equal(H.BREATH.oxygenIn, FACTS.breath.oxygenIn);
  assert.equal(H.BREATH.oxygenOut, FACTS.breath.oxygenOut);
  assert.deepEqual(H.BREATH.rate, FACTS.breath.rate);
  assert.equal(H.BREATH.tidal, FACTS.breath.tidal);
  assert.equal(H.BREATH.airSacs, FACTS.breath.sacs);
  assert.equal(H.BREATH.surface, FACTS.breath.surface);
  H.AIRWAY.forEach((stop, i) => assert.ok(stop.toLowerCase().includes(FACTS.airway[i]), `airway stop ${i + 1}: ${stop}`));
  assert.equal(H.AIRWAY.length, FACTS.airway.length);
  // digestion
  H.GUT_PATH.forEach((stop, i) => assert.ok(stop.toLowerCase().startsWith(FACTS.gut[i]), `gut stop ${i + 1}: ${stop}`));
  assert.equal(H.GUT_PATH.length, FACTS.gut.length);
  assert.deepEqual(H.GUT.stomachHours, FACTS.gutHours.stomach);
  assert.deepEqual(H.GUT.smallHours, FACTS.gutHours.small);
  assert.deepEqual(H.GUT.largeHours, FACTS.gutHours.large);
  assert.equal(H.GUT.surface, FACTS.gutSurface);
  for (const n of H.NUTRIENTS) assert.equal(n.units, FACTS.cutInto[n.name], `${n.name} is cut into`);
  assert.deepEqual(Object.fromEntries(H.ENZYME_PAIRS), FACTS.enzymes);
  for (const [smooth, factor] of H.VILLI_SUMS) {
    assert.ok(factor >= 60 && factor <= 120, 'enlargement within the measured 60 to 120 times');
    assert.ok(smooth * factor >= 24 && smooth * factor <= 36.01, `${smooth} × ${factor} stays near the measured 30 m²`);
  }
  // energy
  assert.equal(H.ENERGY.kjPerKcal, FACTS.energy.kjPerKcal);
  assert.deepEqual([H.ENERGY.atpWithOxygen, H.ENERGY.atpWithoutOxygen], FACTS.energy.atp);
  assert.equal(H.ENERGY.fatAsCO2, FACTS.energy.fatAsCO2);
  assert.equal(H.ENERGY.fatAsWater, FACTS.energy.fatAsWater);
  assert.equal(H.ENERGY.fatAsCO2 + H.ENERGY.fatAsWater, 100);
  assert.equal(H.ENERGY.restingWatts, FACTS.energy.restingWatts);
  assert.deepEqual(Object.fromEntries(H.ORGAN_SHARES.map((o) => [o.organ, o.share])), FACTS.organShare);
  for (const [kj, kcal] of H.LABEL_ENERGY) near(kcal * 4.184, kj, kj * 0.005, `${kcal} kcal in kJ:`);
  // balance
  assert.deepEqual(H.BALANCE.coreTemp, FACTS.balance.core);
  assert.equal(H.BALANCE.fever, FACTS.balance.fever);
  assert.equal(H.BALANCE.filterPerMinute, FACTS.balance.filterMlMin);
  assert.equal(H.BALANCE.filterPerDay, FACTS.balance.filterLDay);
  assert.equal((FACTS.balance.filterMlMin * 1440) / 1000, FACTS.balance.filterLDay, '125 mL a minute is 180 litres a day');
  assert.deepEqual(H.BALANCE.urinePerDay, FACTS.balance.urine);
});

test('no learner-visible text contains undefined, NaN, an object or float noise', () => {
  for (const { lesson, step } of allSteps()) {
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(77 + k * 131), step.id);
      for (const text of visible(s)) {
        const where = `${lesson}/${step.id} seed ${k}: "${text.slice(0, 140)}"`;
        assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), where);
        assert.ok(!/\d\.\d{4,}/.test(text), `float noise in ${where}`);
        assert.ok(!/\b(a) (8|11|18)\b(?! (µm|mm))/.test(text), `a/an in ${where}`);
        assert.ok(!/ {2,}\S.*\n.*```/.test(text));
      }
      if (!step.gen) break;
    }
  }
  for (const lesson of Object.values(lessons)) for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
});

test('every choice has exactly one correct option, no duplicates, and says why each wrong option is wrong', () => {
  let seen = 0;
  for (const { lesson, step } of allSteps()) {
    if (step.type !== 'choice' && step.type !== 'multi') continue;
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(5 + k * 97), step.id);
      const right = s.options.filter((o) => o.correct).length;
      if (step.type === 'choice') assert.equal(right, 1, `${lesson}/${step.id} seed ${k}`);
      else assert.ok(right >= 2 && right < s.options.length, `${lesson}/${step.id} seed ${k}`);
      assert.equal(new Set(s.options.map((o) => (o.figure && o.figure.src) || flat(o.text))).size, s.options.length, `${lesson}/${step.id} has duplicate options`);
      assert.ok(s.options.length >= 3 && s.options.length <= 5, `${lesson}/${step.id}: three to five options`);
      for (const o of s.options) if (!o.correct && s.mode !== 'predict') assert.ok(o.why && o.why.length > 25, `${lesson}/${step.id}: "${o.text}" says why it is wrong`);
      assert.ok(s.explain && flat(s.explain).length > 60, `${lesson}/${step.id}: explanation`);
      seen++;
      if (!step.gen) break;
    }
  }
  assert.ok(seen > 600);
  // the fixed questions, against the facts
  const right = (lesson, id) => correctText(one(lesson, id));
  assert.match(right('cells-to-systems', 'hook'), /30 trillion/);
  assert.equal(right('cells-to-systems', 'needs'), 'Oxygen');
  assert.match(right('cells-to-systems', 'seven-years'), /some cells last days, others a lifetime/);
  assert.equal(right('heart-circulation', 'hook'), 'Only to the lungs');
  assert.match(right('heart-circulation', 'why-thicker'), /much further, against much higher pressure/);
  assert.equal(right('heart-circulation', 'blue-blood'), 'Dark red');
  assert.match(right('heart-circulation', 'harvey'), /only towards the heart/);
  assert.match(right('blood', 'oxygen-carrier'), new RegExp(`About ${FACTS.blood.o2PerLitre} mL`));
  assert.match(right('blood', 'anaemia'), /less oxygen/);
  assert.match(right('blood', 'co'), /carries less and less oxygen/);
  // "surface" was a guess; it is now the teaching screen that states the same fact
  assert.equal(raw('breathing', 'surface').type, 'info');
  assert.match(flat(raw('breathing', 'surface').text), new RegExp(`about \\*\\*${FACTS.breath.surface} square metres\\*\\*: the floor of a small flat`));
  assert.match(flat(raw('breathing', 'surface').text), new RegExp(`\\*\\*${FACTS.breath.sacs} million\\*\\* air sacs`));
  assert.match(right('breathing', 'drive'), /Carbon dioxide building up/);
  assert.match(right('breathing', 'blackout'), /flushes out carbon dioxide/);
  assert.match(right('breathing', 'airways-care'), /more coughing and more infections/);
  assert.equal(right('digestion', 'hook'), 'Slightly sweet');
  assert.match(right('digestion', 'swallow'), /flap folds over the top of the windpipe/);
  assert.match(right('digestion', 'intolerance'), /large intestine, where bacteria ferment it/);
  assert.match(right('energy', 'hook'), /breath, as carbon dioxide/);
  assert.match(right('energy', 'atp'), /own body weight/);
  assert.match(right('energy', 'lactate'), /It is a fuel/);
  assert.match(right('energy', 'mitochondria'), /larger working surface/);
  assert.equal(right('kidneys-balance', 'hook'), 'By less than 1 °C');
  assert.match(right('kidneys-balance', 'head-myth'), /^No: the head loses about a tenth/);
  assert.match(right('kidneys-balance', 'dialysis'), /wastes and spare water out of the blood/);
  const multi = (lesson, id) => one(lesson, id).options.filter((o) => o.correct).map((o) => o.text);
  assert.equal(multi('breathing', 'slows').length, 3);
  assert.ok(multi('breathing', 'slows').every((t) => /smoke|Fluid|4,000 metres/.test(t)));
  assert.equal(multi('digestion', 'large').length, 3);
  assert.ok(multi('digestion', 'large').every((t) => /Water and salts|ferment|vitamins/.test(t)));
  // the numbers quoted in explanations
  assert.match(flat(one('energy', 'hook').explain), /8\.4 kg[\s\S]*1\.6 kg/);
  assert.match(flat(one('heart-circulation', 'why-thicker').explain), /\*\*120 mmHg\*\*[\s\S]*\*\*25 mmHg\*\*/);
  assert.match(flat(one('kidneys-balance', 'hook').explain), /36\.5 to 37\.5 °C/);
});

test('sliders, fill-in sentences, sortings and matchings agree with the facts', () => {
  const hook3 = one('blood', 'hook');
  assert.equal(hook3.answer, FACTS.blood.plasma);
  assert.equal(hook3.mode, 'predict');
  const hook4 = one('breathing', 'hook');
  assert.equal(hook4.answer, FACTS.breath.oxygenOut);
  assert.equal(hook4.max, FACTS.breath.oxygenIn);
  const answers = (lesson, id) => one(lesson, id).blanks.map((b) => b.answer);
  assert.deepEqual(answers('heart-circulation', 'lub-dub'), ['inlet', 'squeeze', 'outlet', 'relax']);
  assert.deepEqual(answers('heart-circulation', 'pressure'), ['squeeze', 'between beats']);
  assert.deepEqual(answers('blood', 'red-cells'), ['bone marrow', 'nucleus', '120', 'iron']);
  assert.deepEqual(answers('breathing', 'fick'), ['larger', 'thinner', 'bigger']);
  assert.deepEqual(answers('digestion', 'stomach'), ['acid', 'protein', 'mucus']);
  assert.deepEqual(answers('digestion', 'transit'), ['hours', 'hours', 'a day or more']);
  assert.deepEqual(answers('energy', 'equation'), ['oxygen', 'carbon dioxide', 'energy']);
  // in every fill step the right option is not always in the same place
  for (const { lesson, step } of allSteps()) {
    if (step.type !== 'fill') continue;
    const s = resolveStep(step, makeRng(1), step.id);
    const places = s.blanks.filter((b) => b.kind === 'select').map((b) => b.options.indexOf(b.answer));
    assert.ok(places.every((p) => p >= 0), `${lesson}/${step.id}`);
    assert.ok(new Set(places).size > 1, `${lesson}/${step.id}: the right option moves about (${places})`);
  }
  // orders
  assert.deepEqual(one('heart-circulation', 'follow-blood').items, FACTS.bloodPath);
  const levels = one('cells-to-systems', 'levels').items;
  [/muscle cell$/, /cells pulling together/, /^The heart:/, /circulatory system/, /whole person/].forEach((re, i) => assert.match(levels[i], re));
  const airway = one('breathing', 'airway').items;
  FACTS.airway.forEach((word, i) => assert.ok(airway[i].toLowerCase().includes(word), `airway ${i}: ${airway[i]}`));
  const tube = one('digestion', 'tube-order').items;
  FACTS.gut.forEach((word, i) => assert.ok(tube[i].toLowerCase().startsWith(word), `gut ${i}: ${tube[i]}`));
  const clot = one('blood', 'clot').items;
  [/vessel narrows/, /Platelets stick/, /fibrin/, /hardens into a clot/].forEach((re, i) => assert.match(clot[i], re));
  const adh = one('kidneys-balance', 'adh').items;
  [/sweat a lot/, /more concentrated/, /Sensors in the brain/, /ADH is released/, /kidneys take back more water/].forEach((re, i) => assert.match(adh[i], re));
  // matchings
  const pairs = (lesson, id) => Object.fromEntries(one(lesson, id).pairs);
  assert.deepEqual(pairs('digestion', 'enzymes'), FACTS.enzymes);
  const parts = pairs('blood', 'parts');
  assert.match(parts['Red cells'], /oxygen/i);
  assert.match(parts['White cells'], /germs/);
  assert.match(parts.Platelets, /clot/);
  assert.match(parts.Plasma, /Liquid/);
  const shapes = pairs('cells-to-systems', 'shapes');
  assert.match(shapes['Red blood cell'], /no nucleus/);
  assert.match(shapes['Nerve cell'], /metre long/);
  assert.match(shapes['Muscle fibre'], /sliding/);
  assert.match(shapes['Skin surface cell'], /Flat/);
  const steady = pairs('kidneys-balance', 'steady');
  assert.match(steady['Body temperature'], /Sweat, shivering/);
  assert.match(steady.Water, /ADH/);
  assert.match(steady.Salt, /Kidneys shed more or less salt/);
  // "Water" and "Salt" must not be interchangeable: only one right-hand side mentions each
  assert.equal(Object.values(steady).filter((v) => /salt/i.test(v)).length, 1);
  assert.equal(Object.values(steady).filter((v) => /ADH|[Tt]hirst/.test(v)).length, 1);
  assert.match(steady['Blood sugar'], /Insulin and glucagon/);
  assert.match(steady['Carbon dioxide'], /breathing/);
  // sortings
  const sorted = (lesson, id) => { const s = one(lesson, id); return s.items.map((it) => [it.text, s.buckets[it.bucket]]); };
  for (const [text, bucket] of sorted('heart-circulation', 'vessels')) {
    const want = /away from the heart|Thick|pulse/.test(text) ? 'Arteries' : /one cell thick|oxygen leaves/.test(text) ? 'Capillaries' : 'Veins';
    assert.equal(bucket, want, text);
  }
  for (const [text, bucket] of sorted('energy', 'aerobic-vs')) {
    const want = /only 2 ATP|lactate|sprint/.test(text) ? 'Without oxygen' : 'With oxygen';
    assert.equal(bucket, want, text);
  }
  for (const [text, bucket] of sorted('kidneys-balance', 'effectors')) {
    const want = /sweat|widen|shade/i.test(text) ? 'Body too hot' : 'Body too cold';
    assert.equal(bucket, want, text);
  }
  for (const id of ['vessels']) assert.equal(new Set(sorted('heart-circulation', id).map((x) => x[1])).size, 3, 'every vessel has at least one line');
});

/* ---------------------------------------------------------------- lesson 1 */

/** Share of a tissue's cells that are still the original ones after `days`, worked out here. */
function ownShare(id, days) {
  const years = days / 365;
  if (id === 'gut' || id === 'skin' || id === 'red') return Math.max(0, 1 - days / FACTS.lifeDays[id]);
  if (id === 'fat') return (1 - FACTS.fatPerYear) ** years;
  if (id === 'heart') {
    // renewal falls in a straight line from 1% a year at 25 to 0.45% at 75: step through the years a day at a time
    let f = 1;
    const [r0, r1] = FACTS.heartRenewal;
    for (let d = 0; d < Math.min(days, 50 * 365); d++) f *= 1 - (r0 + ((r1 - r0) * (d / 365)) / 50) / 365;
    return f;
  }
  return 1;      // neurons of the cortex, the core of the lens: not replaced
}

test('lesson 1: the cell clock, and what is still original after seven years', () => {
  for (const id of Object.keys(TISSUES)) {
    for (const stop of CLOCK) near(originalShare(id, stop.days), ownShare(id, stop.days) * 100, 0.6, `${id} after ${stop.label}:`);
  }
  // the clock step: accept exactly the first setting at which no original red cell is left
  const clock = raw('cells-to-systems', 'clock');
  const first = CLOCK.findIndex((stop) => ownShare('red', stop.days) === 0);
  assert.equal(CLOCK[first].label, '4 months');
  CLOCK.forEach((stop, i) => {
    const original = Object.fromEntries(Object.keys(TISSUES).map((id) => [id, Math.round(ownShare(id, stop.days) * 100)]));
    const res = clock.check({ stop: i, label: stop.label, days: stop.days, original });
    assert.equal(res === true, i === first, `clock at ${stop.label}`);
    if (res !== true) assert.equal(typeof res, 'string');
    if (i > 0 && i < first) assert.ok(res.includes(`${original.red}%`), `the feedback quotes the red cells still left: ${res}`);
  });
  assert.equal(clock.check({ stop: clock.solution.stop, label: CLOCK[clock.solution.stop].label, days: CLOCK[clock.solution.stop].days, original: { red: 0 } }), true);
  // seven years on
  const seven = one('cells-to-systems', 'seven-check');
  const days = 7 * 365;
  const KEY = [[/neurons/, 'neurons'], [/Heart muscle/, 'heart'], [/lens/, 'lens'], [/Red blood cells/, 'red'], [/lining of the gut/, 'gut']];
  for (const o of seven.options) {
    const [, tissue] = KEY.find(([re]) => re.test(o.text));
    assert.equal(!!o.correct, ownShare(tissue, days) > 0.5, `${o.text} after seven years`);
  }
  assert.ok(ownShare('fat', days) < 0.5 && ownShare('fat', days) > 0.4, 'about half of the fat cells have been swapped, as the explanation says');
  assert.match(flat(seven.explain), /about half are swapped in seven years/);
  // exploring the systems
  const map = raw('cells-to-systems', 'systems-map');
  const st = (seen) => ({ selected: seen[seen.length - 1] || null, seen, seenCount: seen.length });
  assert.equal(map.check(st(map.solution.seen)), true);
  assert.match(map.check(st([])), /0 parts so far/);
  assert.match(map.check(st(['heart'])), /1 part so far\. Tap 5 more/);
  assert.match(map.check(st(['stomach', 'liver', 'small-intestine', 'large-intestine', 'pancreas', 'gallbladder'])), /different system/);
  assert.equal(map.check(st(['stomach', 'liver', 'heart', 'aorta', 'left-lung', 'windpipe'])), true);
  // only the oxygen supply fails within minutes: the model answer must not say that of every link
  const why = flat(raw('cells-to-systems', 'why-blood').model);
  assert.match(why, /If the oxygen stops, the cell is in trouble within minutes/);
  assert.ok(!/any link stops/.test(why));
  // the opening guess and the disclaimer facts
  assert.match(flat(one('cells-to-systems', 'hook').explain), /between 30 and 37 trillion/);
});

test('lesson 1: sizes of cells, organ systems and finding an organ on the body diagram', () => {
  const sizes = new Set();
  let n = eachVariant('cells-to-systems', 'how-small', (s, text) => {
    const [um] = grab(/is about \*\*(\d+) µm\*\* (?:long|across)/, text);
    const [mm] = grab(/would stretch ([\d.]+) mm\?/, text);
    const key = Object.keys(FACTS.sizesUm).find((k) => text.toLowerCase().includes(k));
    assert.ok(key, 'a cell from the table');
    assert.equal(Number(um), FACTS.sizesUm[key], `size of a ${key}`);
    const expected = (Number(mm) * 1000) / Number(um);
    assert.ok(Number.isInteger(expected));
    checkNumeric(s, expected, { quotes: [`**${grouped(expected)}**`] });
    assert.ok(s.hints[0].includes(`${grouped(Number(mm) * 1000)} µm`));
    sizes.add(key);
  });
  assert.ok(n >= 10 && sizes.size === 5, `${n} variants, ${sizes.size} cells`);

  const asked = new Set();
  n = eachVariant('cells-to-systems', 'which-system', (s, text) => {
    let expected;
    const organ = /^The \*\*(.+?)\*\* (belong|belongs) to one/.exec(text);
    if (organ) {
      expected = FACTS.systemOf[organ[1]];
      assert.ok(expected, `${organ[1]} is in the table`);
      // typed here, not derived from the spelling: "biceps" and "uterus" end in s and are singular
      assert.ok(organ[1] in FACTS.organIsPlural, `${organ[1]} has a number`);
      assert.equal(organ[2], FACTS.organIsPlural[organ[1]] ? 'belong' : 'belongs', `grammar: "The ${organ[1]} ${organ[2]}"`);
    } else {
      const [job] = grab(/has this job: (?:to|it) \*\*(.+?)\*\*/, text);
      const hit = FACTS.systemJob.filter(([re]) => re.test(job));
      assert.equal(hit.length, 1, `one system has the job "${job}"`);
      expected = hit[0][1];
    }
    assert.equal(correctText(s), expected);
    assert.equal(s.options.length, 4);
    assert.equal(s.shuffle, false);
    for (const o of s.options) if (!o.correct) assert.ok(o.why.startsWith(`The ${o.text.toLowerCase()} `), `the feedback for ${o.text} is about that system`);
    assert.ok(flat(s.explain).startsWith(`The **${expected.toLowerCase()}**`));
    asked.add(expected);
  });
  assert.ok(n >= 25 && asked.size === 11, `${n} variants covering ${asked.size} systems`);

  const organs = new Set();
  n = eachVariant('cells-to-systems', 'find-organ', (s, text) => {
    const [name] = grab(/\*\*Tap (?:one of )?the (.+?)\.\*\*/, text);
    const organ = FACTS.organs[name];
    assert.ok(organ, `${name} is in the table`);
    assert.equal(/one of the/.test(text), organ.ids.length > 1);
    assert.match(text, /person's right side is on your left/);
    const w = s.widget;
    assert.equal(w.type, 'body-map');
    assert.equal(w.view, 'torso');
    assert.equal(w.mode, 'pick');
    assert.ok(!w.names && !w.labels, 'no names on the figure');
    assert.ok(organ.ids.includes(w.answer));
    assert.match(flat(s.explain), organ.says);
    assert.deepEqual([...w.pickable].sort(), Object.values(FACTS.organs).flatMap((o) => o.ids).sort());
    for (const id of w.pickable) {
      const res = s.check({ picked: id, name: structureName(id), nameThe: structureNameThe(id), side: structureInfo(id).side });
      assert.equal(res === true, organ.ids.includes(id), `tapping ${id} when asked for the ${name}`);
      if (res !== true) { assert.ok(res.startsWith(`That is ${structureNameThe(id)}.`), res); assert.match(res, organ.says); }
    }
    assert.equal(typeof s.check({ picked: null, name: null, nameThe: null, side: null }), 'string');
    assert.equal(s.check({ picked: s.solution.picked, nameThe: structureNameThe(s.solution.picked) }), true);
    organs.add(name);
  });
  assert.equal(organs.size, Object.keys(FACTS.organs).length, 'every organ is asked for');
  // the sides, from the body diagram's own table: the liver is on the person's right, the stomach and spleen on the left
  assert.equal(structureInfo('left-lung').side, 'left');
  assert.equal(structureInfo('right-kidney').side, 'right');
});

/* ---------------------------------------------------------------- lesson 2 */

test('lesson 2: the heart model opens and shuts its valves by pressure, and the valve step accepts only one-way flow', () => {
  const expected = { fill: ['mitral', 'tricuspid'], atria: ['mitral', 'tricuspid'], tighten: [], eject: ['aortic', 'pulmonary'], relax: [] };
  assert.deepEqual(PHASES.map((p) => p.id), Object.keys(expected));
  for (const p of PHASES) {
    assert.deepEqual(openValves(p.id), expected[p.id], `open valves while: ${p.name}`);
    // a valve is open exactly when the pressure behind it is higher than the pressure beyond it
    for (const [v, def] of Object.entries(VALVES)) assert.equal(openValves(p.id).includes(v), p.pressure[def.from] > p.pressure[def.to], `${v} in ${p.id}`);
    // the two sides of the heart: left always at higher pressure than right in the ventricles while they squeeze
    assert.ok(p.pressure.aorta >= FACTS.heart.aorta[1] - 0.01 && p.pressure.aorta <= FACTS.heart.aorta[0], `aortic pressure in ${p.id}`);
    assert.ok(p.pressure.pulmonary >= FACTS.heart.lungArtery[1] && p.pressure.pulmonary <= FACTS.heart.lungArtery[0], `pulmonary pressure in ${p.id}`);
  }
  assert.equal(Math.max(...PHASES.map((p) => p.pressure.lv)), FACTS.heart.left);
  assert.equal(Math.max(...PHASES.map((p) => p.pressure.rv)), FACTS.heart.right);
  // "lub" when the inlet valves have just shut, "dub" when the outlet valves have just shut
  assert.deepEqual(PHASES.map((p) => p.sound), [null, null, 'lub', null, 'dub']);
  assert.deepEqual([VALVES.tricuspid.side, VALVES.pulmonary.side, VALVES.mitral.side, VALVES.aortic.side], ['right', 'right', 'left', 'left']);
  assert.deepEqual([VALVES.tricuspid.kind, VALVES.mitral.kind, VALVES.pulmonary.kind, VALVES.aortic.kind], ['inlet', 'inlet', 'outlet', 'outlet']);
  assert.deepEqual([VALVES.tricuspid.to, VALVES.pulmonary.from, VALVES.mitral.to, VALVES.aortic.from], ['rv', 'rv', 'lv', 'lv']);

  // stepping through the beat
  const tour = raw('heart-circulation', 'step-through');
  const ids = PHASES.map((p) => p.id);
  for (let k = 1; k <= 5; k++) {
    const res = tour.check({ seen: ids.slice(0, k) });
    assert.equal(res === true, k === 5);
    if (k < 5) assert.ok(res.includes(`${k} of the 5`));
  }

  // you are the valves: every one of the 16 settings, during ejection
  const step = raw('heart-circulation', 'one-way');
  assert.equal(step.widget.phase, 'eject');
  const names = Object.keys(VALVES);
  let accepted = 0;
  for (let mask = 0; mask < 16; mask++) {
    const open = names.filter((_, i) => mask & (1 << i)).sort();
    // own rule: while the ventricles squeeze, an open inlet leaks backwards and a shut outlet blocks the way
    const backflow = open.filter((v) => VALVES[v].kind === 'inlet');
    const blocked = names.filter((v) => VALVES[v].kind === 'outlet' && !open.includes(v));
    const model = valveFaults('eject', open);
    assert.deepEqual([...model.backflow].sort(), backflow.sort(), `backflow with ${open}`);
    assert.deepEqual([...model.blocked].sort(), blocked.sort(), `blocked with ${open}`);
    const res = step.check({ mode: 'valves', phase: 'eject', open, backflow: model.backflow, blocked: model.blocked, oneWay: !backflow.length && !blocked.length });
    const good = open.join() === 'aortic,pulmonary';
    assert.equal(res === true, good, `valves open: ${open.join(', ') || 'none'}`);
    if (good) accepted++;
    else if (backflow.length) { assert.match(res, /running backwards/); for (const v of backflow) assert.ok(res.includes(VALVES[v].side === 'right' ? 'right inlet valve' : 'left inlet valve')); }
    else { assert.match(res, /held up/); for (const v of blocked) assert.ok(res.includes(VALVES[v].side === 'right' ? 'right outlet valve' : 'left outlet valve')); }
  }
  assert.equal(accepted, 1);
  assert.deepEqual([...step.solution.open].sort(), ['aortic', 'pulmonary']);
});

test('lesson 2: cardiac output, Harvey\'s sum and counting a pulse', () => {
  // rate times stroke volume: every slider setting
  const out = raw('heart-circulation', 'output');
  let accepted = 0;
  for (let rate = 40; rate <= 190; rate += 5) {
    for (let stroke = 40; stroke <= 140; stroke += 5) {
      const litres = (rate * stroke) / 1000;
      assert.equal(cardiacOutput(rate, stroke), Math.round(litres * 1000) / 1000);
      const res = out.check({ mode: 'output', rate, stroke, output: litres });
      const good = rate === 50 && stroke === 100;
      assert.equal(res === true, good, `${rate} × ${stroke}`);
      if (good) accepted++;
      else if (rate !== 50) assert.match(res, /heart rate to 50/);
      else assert.ok(res.includes(`${stroke} mL a beat`) && res.includes(`${litres} litres`) && (litres < 5 ? /only/.test(res) : /more than/.test(res)), res);
    }
  }
  assert.equal(accepted, 1);
  assert.deepEqual(out.solution, { rate: 50, stroke: 100 });

  let n = eachVariant('heart-circulation', 'harvey-sum', (s, text) => {
    const [rate] = grab(/beats \*\*(\d+) times a minute\*\*/, text);
    const [ml] = grab(/pushes \*\*(\d+) mL\*\*/, text);
    assert.match(text, /How many litres does it pump in one hour\?/);
    const perMinute = (Number(rate) * Number(ml)) / 1000;
    const expected = perMinute * 60;
    assert.ok(Number(rate) >= FACTS.heart.rate[0] && Number(rate) <= FACTS.heart.rate[1], 'a resting rate');
    checkNumeric(s, expected, { tol: 1e-6, quotes: [`**${grouped(expected)} litres an hour**`, `${perMinute} litres a minute`, `about ${FACTS.heart.blood} litres of blood`] });
    assert.equal(s.unit, 'litres');
    assert.ok(expected > 40 * FACTS.heart.blood, 'far more than the body holds: that is the argument');
    const slip = (re) => s.wrong.find((w) => re.test(w[1]))[0];
    near(slip(/in one minute\. An hour/), perMinute, 1e-9);
    near(slip(/answer in millilitres/), expected * 1000, 1e-6);
  });
  assert.ok(n >= 12, `${n} variants`);

  n = eachVariant('heart-circulation', 'pulse', (s, text) => {
    const [count, seconds] = grab(/counts \*\*(\d+) beats in (\d+) seconds\*\*/, text).map(Number);
    const expected = (count * 60) / seconds;
    assert.ok(Number.isInteger(expected) && expected >= 50 && expected <= 100, `${expected} is a plausible resting rate`);
    checkNumeric(s, expected, { quotes: [`**${expected} beats a minute**`, `${FACTS.heart.rate[0]} to ${FACTS.heart.rate[1]} a minute`] });
    assert.ok(s.wrong.some((w) => w[0] === count));
    assert.ok(/wrist/.test(text) && !/neck/.test(text), 'the pulse is taken at the wrist, never the neck');
    // the figure marks pulse points, and none of them is on the neck
    const fig = s.figures[0];
    assert.equal(fig.type, 'body-map');
    assert.ok(fig.markers.every((m) => /^pulse-(wrist|arm|foot)/.test(m.at)), 'pulse points shown');
  });
  assert.ok(n >= 30, `${n} variants`);
});

/* ---------------------------------------------------------------- lesson 3 */

test('lesson 3: blood groups. The model and both generated steps follow the donor table', () => {
  assert.deepEqual(TYPES, Object.keys(FACTS.donorsFor));
  for (const recipient of TYPES) for (const donor of TYPES) assert.equal(canGive(donor, recipient), FACTS.donorsFor[recipient].includes(donor), `${donor} to ${recipient}`);
  // O− can be given to everyone, AB+ can receive from everyone, and nobody else can
  assert.deepEqual(TYPES.filter((d) => TYPES.every((r) => canGive(d, r))), ['O-']);
  assert.deepEqual(TYPES.filter((r) => TYPES.every((d) => canGive(d, r))), ['AB+']);
  // antibodies are against the A or B marker a person lacks
  assert.deepEqual(antibodies('O+'), ['A', 'B']);
  assert.deepEqual(antibodies('A-'), ['B']);
  assert.deepEqual(antibodies('AB+'), []);
  assert.deepEqual(antigens('AB+'), ['A', 'B', 'D']);
  assert.deepEqual(antigens('O-'), []);
  const show = (t) => t.replace('-', '−');
  const unshow = (t) => t.replace('−', '-');

  const recipients = new Set();
  eachVariant('blood', 'who-can-give', (s, text) => {
    const recipient = unshow(grab(/blood group \*\*(\S+?)\*\* needs red cells/, text)[0]);
    const safe = FACTS.donorsFor[recipient];
    assert.ok(safe && recipient !== 'AB+', 'a recipient for whom some donors are unsafe');
    assert.equal(s.widget.type, 'blood-match');
    assert.equal(s.widget.mode, 'donors');
    assert.equal(s.widget.recipient, recipient);
    assert.deepEqual(s.solution.selected, safe);
    assert.ok(flat(s.explain).includes(`**${safe.map(show).join(', ')}**`), 'the explanation lists the safe donors');
    if (recipients.has(recipient)) return;
    recipients.add(recipient);
    // every one of the 256 selections
    for (let mask = 0; mask < 256; mask++) {
      const selected = TYPES.filter((_, i) => mask & (1 << i));
      const unsafe = selected.filter((t) => !safe.includes(t));
      const missed = safe.filter((t) => !selected.includes(t));
      const res = s.check({ mode: 'donors', recipient, selected, unsafe, missed, count: selected.length });
      assert.equal(res === true, !unsafe.length && !missed.length, `${recipient} given ${selected.join(' ') || 'nothing'}`);
      if (res === true) continue;
      if (!selected.length) assert.match(res, /at least one/);
      else if (unsafe.length) {
        // the feedback names an unsafe group and the marker(s) that make it unsafe
        const bad = unsafe[0];
        assert.ok(res.startsWith(`Group ${show(bad)} cells carry`), res);
        for (const m of ['A', 'B', 'D']) {
          const clash = (m === 'D' ? bad.endsWith('+') && !recipient.endsWith('+') : bad.includes(m) && !recipient.includes(m));
          assert.equal(res.includes(`${m} marker`), clash, `${m} in: ${res}`);
        }
      } else assert.ok(res.includes(missed.length === 1 ? 'one more group' : `${missed.length} more groups`), res);
    }
  });
  assert.equal(recipients.size, 7, 'every group except AB+ is asked about');

  const n = eachVariant('blood', 'can-give', (s, text) => {
    const recipient = unshow(grab(/blood group \*\*(\S+?)\*\* needs red cells urgently/, text)[0]);
    const safe = FACTS.donorsFor[recipient];
    assert.equal(s.options.length, 4);
    const groups = s.options.map((o) => unshow(grab(/^Group (\S+)$/, o.text)[0]));
    assert.equal(groups.filter((g) => safe.includes(g)).length, 1, `exactly one of ${groups.join(', ')} is safe for ${recipient}`);
    assert.ok(safe.includes(unshow(correctText(s).replace('Group ', ''))));
    for (const [i, o] of s.options.entries()) {
      if (o.correct) continue;
      for (const m of ['A', 'B', 'D']) {
        const clash = (m === 'D' ? groups[i].endsWith('+') && !recipient.endsWith('+') : groups[i].includes(m) && !recipient.includes(m));
        assert.equal(o.why.includes(`${m} marker`), clash, `${m} in: ${o.why}`);
      }
    }
    const good = unshow(correctText(s).replace('Group ', ''));
    assert.ok(/O-/.test(good) ? /none of the three markers/.test(flat(s.explain)) : /which the patient has too/.test(flat(s.explain)), flat(s.explain));
  });
  assert.ok(n >= 7, `${n} variants`);

  // trying donors against a B+ patient
  const tryIt = raw('blood', 'groups-explore');
  assert.equal(tryIt.widget.recipient, 'B+');
  const tally = (list) => ({ triedSafe: list.filter((d) => FACTS.donorsFor['B+'].includes(d)).length, triedClash: list.filter((d) => !FACTS.donorsFor['B+'].includes(d)).length });
  assert.equal(tryIt.check(tally(['A+', 'B+', 'O-'])), true);
  assert.equal(tryIt.check(tally(tryIt.solution.tried.map((t) => t.donor))), true);
  assert.match(tryIt.check(tally(['A+'])), /every donor has clashed/);
  assert.match(tryIt.check(tally(['A+', 'O+'])), /One safe donor found/);
  assert.match(tryIt.check(tally(['O+', 'B-'])), /find a donor that would clash/);
  assert.match(flat(tryIt.explain), /anti-A/);
});

test('lesson 3: a donation as a share of the blood, and the photograph', () => {
  const n = eachVariant('blood', 'donation-share', (s, text) => {
    const [litres] = grab(/has about \*\*([\d.]+) litres\*\* of blood/, text);
    const [ml] = grab(/donates \*\*(\d+) mL\*\*/, text);
    const pct = (Number(ml) / (Number(litres) * 1000)) * 100;
    near(pct, Math.round(pct), 1e-9, 'a whole per cent:');
    checkNumeric(s, Math.round(pct), { quotes: [`**${Math.round(pct)}%**`, 'under a tenth'] });
    assert.ok(pct < 10);
    assert.equal(s.unit, '%');
    assert.ok(!/\byour\b/.test(text), 'an example person, not the learner');
  });
  assert.ok(n >= 7, `${n} variants`);
  const photo = raw('blood', 'cells-photo');
  assert.equal(photo.check({ picked: 'platelet' }), true);
  assert.match(photo.check({ picked: 'red' }), /red blood cell/);
  assert.match(photo.check({ picked: 'white' }), /white blood cell/);
  assert.equal(photo.check({ picked: null }), false);
  // the oxygen sum in the explanation: about seventy times
  near(FACTS.blood.o2PerLitre / FACTS.blood.o2Dissolved, 70, 4, 'blood against plasma:');
  assert.match(flat(one('blood', 'oxygen-carrier').explain), /seventy times/);
  assert.match(flat(one('blood', 'red-cells').explain), /120 days/);
  // Landsteiner 1901 (Nobel Prize 1930); platelets last 7 to 10 days; compatibility is checked, by test or by computer
  assert.match(flat(raw('blood', 'rule').text), /Karl Landsteiner in 1901/);
  assert.match(flat(raw('blood', 'rule').text), /checks that the patient's and the donor's blood are compatible/);
  assert.deepEqual(H.BLOOD.plateletLife, [7, 10]);
  assert.match(flat(raw('blood', 'clot').explain), /Platelets last only about a week/);
});

/* ---------------------------------------------------------------- lesson 4 */

/** Oxygen pressure of the blood leaving the air sac, by stepping Fick's law along the capillary. */
function ownLeaving({ oxygen, thickness, area, exercise }) {
  const steps = 20000;
  const K = 9 / (thickness * (exercise ? 3 : 1));
  let p = 40;
  for (let i = 0; i < steps; i++) {
    const u = (i + 0.5) / steps;
    if (u <= area / 100) p += K * (oxygen - p) * (1 / steps);      // rate ∝ difference ÷ thickness, only where the surface works
  }
  return p;
}
/** Haemoglobin loading from the standard binding curve (half loaded at 26.6 mmHg, Hill exponent 2.7). */
const ownSaturation = (p) => 100 / (1 + (26.6 / p) ** 2.7);

test('lesson 4: the air-sac model follows Fick\'s law, and only thin air brings healthy resting lungs under 90%', () => {
  // textbook points on the binding curve: about 97% at 100 mmHg, 90% at 60, 75% at 40
  near(ownSaturation(100), 97.3, 0.6);
  near(ownSaturation(60), 90, 1);
  near(ownSaturation(40), 75, 1);
  near(saturation(100) * 100, ownSaturation(100), 1e-6);
  const HEALTHY = { oxygen: 100, thickness: 1, area: 100, exercise: false };
  const step = raw('breathing', 'altitude');
  const accepted = [];
  for (const oxygen of [50, 60, 70, 80, 90, 100]) for (const thickness of THICKNESSES) for (const area of AREAS) for (const exercise of [false, true]) {
    const set = { oxygen, thickness, area, exercise };
    const model = leavingBlood(set);
    const own = ownLeaving(set);
    near(model.leaving, own, 0.12, `leaving pressure for ${JSON.stringify(set)}:`);
    near(model.saturation, ownSaturation(own), 0.75, `saturation for ${JSON.stringify(set)}:`);
    const changed = Object.keys(HEALTHY).filter((k) => set[k] !== HEALTHY[k]);
    const res = step.check({ ...set, ...model, arriving: 40, changed });
    const good = changed.length === 1 && ownSaturation(own) < 89.5;
    assert.equal(res === true, good, JSON.stringify(set));
    if (good) accepted.push(set);
    else {
      assert.equal(typeof res, 'string');
      if (changed.length === 1) assert.ok(res.includes(`${model.saturation}% loaded`), res);
      if (changed.length > 1) assert.ok(res.includes(`${changed.length} controls`), res);
    }
  }
  assert.deepEqual(accepted, [{ oxygen: 50, thickness: 1, area: 100, exercise: false }], 'the one way: less oxygen in the air sac');
  assert.equal(leavingBlood(HEALTHY).saturation, 97);
  // healthy blood at rest is full about a third of the way along: the reserve the lesson talks about
  near(leavingBlood(HEALTHY).fullAt, 1 / 3, 0.08);
  // thicker walls and lost surface do slow loading: each lowers the leaving pressure in exercise
  assert.ok(ownLeaving({ ...HEALTHY, exercise: true, thickness: 4 }) < ownLeaving({ ...HEALTHY, exercise: true }) - 10);
  assert.ok(ownLeaving({ ...HEALTHY, exercise: true, area: 25 }) < ownLeaving({ ...HEALTHY, exercise: true }) - 10);
  // exploring: all four controls
  const explore = raw('breathing', 'explore-sac');
  assert.equal(explore.check({ changed: ['oxygen', 'thickness', 'area', 'exercise'] }), true);
  assert.match(explore.check({ changed: ['oxygen', 'thickness'] }), /2 of the 4 controls[\s\S]*blood-flow button/);
  assert.match(explore.check({ changed: ['exercise'] }), /1 of the 4 controls/);
  // the X-ray
  const xray = raw('breathing', 'bellows');
  assert.equal(xray.check({ picked: 'diaphragm' }), true);
  for (const id of ['lung', 'heart', 'collarbone', 'windpipe']) assert.equal(typeof xray.check({ picked: id }), 'string', id);
  assert.match(xray.check({ picked: 'heart' }), /person's left/);
  assert.equal(xray.check({ picked: null }), false);
});

test('lesson 4: oxygen kept from a breath, and air moved in a minute', () => {
  let n = eachVariant('breathing', 'oxygen-used', (s, text) => {
    const [inPct] = grab(/goes in with \*\*(\d+)% oxygen\*\*/, text);
    const [outPct] = grab(/comes out with \*\*(\d+)%\*\*/, text);
    const [ml] = grab(/A breath of \*\*([\d,]+) mL\*\*/, text);
    assert.equal(Number(inPct), FACTS.breath.oxygenIn);
    assert.ok([16, 17].includes(Number(outPct)), 'breathed-out air is 16 to 17% oxygen');
    const expected = (number(ml) * (inPct - outPct)) / 100;
    checkNumeric(s, expected, { quotes: [`**${expected} mL**`] });
    assert.equal(s.unit, 'mL');
  });
  assert.ok(n >= 8, `${n} variants`);
  n = eachVariant('breathing', 'air-per-minute', (s, text) => {
    const [rate] = grab(/breathes \*\*(\d+) times a minute\*\*/, text);
    const [ml] = grab(/about \*\*(\d+) mL\*\*/, text);
    assert.ok(Number(rate) >= FACTS.breath.rate[0] && Number(rate) <= FACTS.breath.rate[1], 'a resting breathing rate');
    const expected = (Number(rate) * Number(ml)) / 1000;
    checkNumeric(s, expected, { quotes: [`**${expected} litres a minute**`, `${FACTS.breath.rate[0]} to ${FACTS.breath.rate[1]} breaths a minute`] });
    assert.ok(expected >= 5 && expected <= 10, 'a plausible resting ventilation');
  });
  assert.ok(n >= 20, `${n} variants`);
});

/* ---------------------------------------------------------------- lesson 5 */

test('lesson 5: the meal travels the tube in order, and nearly everything is absorbed by the end of the small intestine', () => {
  // stations follow the order of the tube, and nothing ever becomes "less digested"
  const order = [...FACTS.gut, 'out'];
  let last = 0;
  GUT_STOPS.forEach((stop, i) => {
    const part = STATIONS[stop.station].part;
    assert.ok(order.indexOf(part) >= last, `${stop.time}: ${part}`);
    last = order.indexOf(part);
    if (i) for (const k of ['starch', 'protein', 'fat', 'absorbed', 'water']) assert.ok(stop[k] >= GUT_STOPS[i - 1][k], `${k} at ${stop.time}`);
    // nothing can be absorbed before it is broken down, and nothing is absorbed before the small intestine
    assert.ok(stop.absorbed <= Math.max(stop.starch, stop.protein, stop.fat));
    if (['mouth', 'oesophagus', 'stomach'].includes(part)) assert.equal(stop.absorbed, 0, `no absorption in the ${part}`);
  });
  assert.equal(new Set(GUT_STOPS.map((s) => STATIONS[s.station].part)).size, 6, 'every part of the tube is visited');
  // starch starts in the mouth, protein in the stomach, fat mainly in the small intestine
  const firstWith = (k, min = 1) => STATIONS[GUT_STOPS.find((s) => s[k] >= min).station].part;
  assert.equal(firstWith('starch'), 'mouth');
  assert.equal(firstWith('protein'), 'stomach');
  assert.equal(firstWith('fat', 20), 'small intestine');
  // times within the measured ranges
  const hours = (label) => (/hour/.test(label) ? parseFloat(label) : /1 day/.test(label) ? 24 : /1½ days/.test(label) ? 36 : 0);
  const leaveStomach = GUT_STOPS.find((s) => STATIONS[s.station].part === 'small intestine');
  assert.ok(hours(leaveStomach.time) >= FACTS.gutHours.stomach[0] && hours(leaveStomach.time) <= FACTS.gutHours.stomach[1]);

  const journey = raw('digestion', 'journey');
  const ids = Object.keys(STATIONS);
  assert.equal(journey.check({ seen: ids, seenAll: true }), true);
  assert.match(journey.check({ seen: ids.slice(0, 3), seenAll: false }), /3 of the 8 stops/);

  const where = raw('digestion', 'where-absorbed');
  const first = GUT_STOPS.findIndex((s) => s.absorbed > 90);
  assert.equal(STATIONS[GUT_STOPS[first].station].part, 'small intestine');
  assert.equal(GUT_STOPS[first].station, 'small-end');
  GUT_STOPS.forEach((stop, i) => {
    const res = where.check({ stop: i, time: stop.time, station: stop.station, part: STATIONS[stop.station].part, absorbed: stop.absorbed, water: stop.water });
    assert.equal(res === true, i === first, `clock at ${stop.time}`);
    if (i < first) assert.ok(res.includes(inWords(stop.absorbed)), res);
    if (i > first) assert.match(res, /Go back to the \*\*first\*\* stop/);
  });
  assert.equal(inWords(GUT_STOPS[first].absorbed), 'nearly all');
  assert.equal(where.solution.stop, first);
  assert.match(flat(where.explain), /end of the small intestine/);
});

test('lesson 5: what each food molecule is cut into, and the surface of the villi', () => {
  const seen = new Set();
  eachVariant('digestion', 'small-molecules', (s, text) => {
    const [name] = grab(/\*\*(Starch|Protein|Fat)\*\*, as in/, text);
    assert.equal(correctText(s), FACTS.cutInto[name]);
    assert.equal(s.options.length, 4);
    for (const o of s.options) {
      if (o.correct) continue;
      const other = Object.entries(FACTS.cutInto).find(([, units]) => units === o.text);
      if (other) assert.ok(o.why.includes(`what ${other[0].toLowerCase()} is cut into`), o.why);
      else assert.equal(o.text, 'Vitamins');
    }
    assert.ok(flat(s.explain).startsWith(`**${name} → `));
    const enzyme = Object.entries(FACTS.enzymes).find(([, what]) => what === name)[0];
    assert.ok(flat(s.explain).toLowerCase().includes(enzyme.toLowerCase()), `${name} is cut by ${enzyme}`);
    seen.add(name);
  });
  assert.equal(seen.size, 3);
  const n = eachVariant('digestion', 'villi-area', (s, text) => {
    const [smooth] = grab(/inner surface of about \*\*([\d.]+) m²\*\*/, text);
    const [factor] = grab(/about \*\*(\d+) times\*\* larger/, text);
    const expected = Number(smooth) * Number(factor);
    checkNumeric(s, expected, { tol: 1e-6, quotes: [`about ${FACTS.gutSurface} m²`] });
    assert.ok(expected >= 24 && expected <= 36.01, 'near the measured 30 m²');
    assert.equal(s.figures[0].type, 'photo');
  });
  assert.ok(n >= 6, `${n} variants`);

  // first stop for the blood from the gut: the liver, on the person's right
  const liver = raw('digestion', 'liver-first');
  assert.equal(liver.widget.answer, 'liver');
  assert.ok(!liver.widget.names && !liver.widget.labels, 'no names on the figure');
  for (const id of expandIds(liver.widget.pickable)) {
    const res = liver.check({ picked: id, name: structureName(id), nameThe: structureNameThe(id), side: structureInfo(id).side });
    assert.equal(res === true, id === 'liver', `tapping ${id}`);
    if (id !== 'liver') { assert.ok(res.includes(`That is ${structureNameThe(id)}`), res); assert.match(res, /upper right of the abdomen|other side of the abdomen/); }
  }
  assert.equal(typeof liver.check({ picked: null }), 'string');
  assert.equal(liver.solution.picked, 'liver');
  assert.equal(structureInfo('liver').name, 'Liver');
});

/* ---------------------------------------------------------------- lesson 6 */

test('lesson 6: the fuel model, and the two steps that search it', () => {
  const KEYS = ['ready', 'noOxygen', 'sugar', 'fat'];
  const sustainable = (e, i) => !(e === 4 && TIMES[i].seconds > 120) && !(e === 3 && TIMES[i].seconds >= 3 * 3600);
  for (let e = 0; e < EFFORTS.length; e++) {
    let glycogen = 100;
    for (let i = 0; i < TIMES.length; i++) {
      const row = MIX[e][i];
      assert.equal(row.reduce((a, b) => a + b, 0), 100, `shares add up at effort ${e}, time ${i}`);
      const f = fuelAt(e, i);
      assert.deepEqual(KEYS.map((k) => f.mix[k]), row);
      const top = Math.max(...row);
      assert.equal(row.filter((v) => v === top).length, 1, `one clear leader at effort ${e}, time ${i}`);
      assert.equal(f.main, KEYS[row.indexOf(top)]);
      assert.equal(f.sustainable, sustainable(e, i));
      assert.equal(f.withOxygen, row[2] + row[3]);
      assert.ok(f.glycogenLeft <= glycogen && f.glycogenLeft >= 0, 'the sugar store only runs down');
      glycogen = f.glycogenLeft;
      assert.ok(f.fatLeft > 98, 'the fat store hardly moves in three hours');
      // physiology: the ready store is spent within two minutes; nothing but oxygen-burning lasts beyond ten
      if (TIMES[i].seconds >= 120) assert.equal(row[0], 0);
      if (TIMES[i].seconds >= 600) assert.ok(row[1] <= 10);
    }
  }
  assert.ok(MIX[0].every((row) => row[0] === 0 && row[1] === 0 && row[3] > row[2]), 'at rest: all with oxygen, mostly fat');
  assert.equal(fuelAt(4, 0).main, 'ready');
  assert.equal(fuelAt(4, 1).main, 'noOxygen');
  assert.equal(fuelAt(3, 7).glycogenLeft, 0, 'a hard run empties the sugar store in about three hours');
  assert.ok(fuelAt(3, 6).glycogenLeft > 15, 'but not in two');
  // as effort rises (after ten minutes, with oxygen) the share of fat falls: the crossover
  for (let e = 1; e <= 3; e++) assert.ok(MIX[e][3][3] < MIX[e - 1][3][3] || e === 1, `fat share falls from effort ${e - 1} to ${e}`);
  assert.ok(MIX[3][3][3] < MIX[2][3][3] && MIX[2][3][3] < MIX[1][3][3]);

  const sprint = raw('energy', 'sprint-route');
  const far = raw('energy', 'fat-far');
  const okSprint = [];
  const okFar = [];
  for (let e = 0; e < EFFORTS.length; e++) for (let i = 0; i < TIMES.length; i++) {
    const row = MIX[e][i];
    const leader = KEYS[row.indexOf(Math.max(...row))];
    const state = { ...fuelAt(e, i), visited: 1 };
    let res = sprint.check(state);
    assert.equal(res === true, leader === 'noOxygen', `sprint-route at effort ${e}, time ${i}`);
    if (res === true) okSprint.push([e, i]);
    else {
      assert.equal(typeof res, 'string');
      if (sustainable(e, i) && e < 4) assert.ok(res.includes(`${row[1]}%`) && res.includes(TIMES[i].label), res);
    }
    res = far.check(state);
    const good = TIMES[i].seconds >= 3600 && e > 0 && sustainable(e, i) && leader === 'fat';
    assert.equal(res === true, good, `fat-far at effort ${e}, time ${i}`);
    if (good) okFar.push([e, i]);
    else if (TIMES[i].seconds >= 3600 && e > 0 && sustainable(e, i)) assert.ok(res.includes(`${state.glycogenLeft}%`) && /sugar still supplies most/.test(res), res);
  }
  assert.deepEqual(okSprint, [[4, 1]], 'only thirty seconds into an all-out sprint');
  assert.ok(okFar.length >= 4 && okFar.every(([e]) => e === 1 || e === 2), 'an easy walk or a steady jog, for an hour or more');
  assert.deepEqual([sprint.solution.effort, sprint.solution.stop], [4, 1]);
  assert.equal(far.check({ ...fuelAt(far.solution.effort, far.solution.stop) }), true);

  const explore = raw('energy', 'explore-fuel');
  assert.equal(explore.check({ visited: 6 }), true);
  assert.match(explore.check({ visited: 1 }), /1 setting\. Try 5 more/);
  assert.match(explore.check({ visited: 4 }), /4 settings\. Try 2 more/);
  const mito = raw('energy', 'find-mito');
  assert.equal(mito.check({ seen: ['nucleus', 'mitochondria'], seenCount: 2 }), true);
  assert.equal(typeof mito.check({ seen: ['nucleus'], seenCount: 1 }), 'string');
  assert.equal(typeof mito.check({ seen: [], seenCount: 0 }), 'string');
  assert.equal(mito.widget.view, 'cell');
  // the bars to predict: the solution is the table
  const bars = raw('energy', 'bmr-predict');
  assert.equal(bars.mode, 'predict');
  assert.deepEqual(bars.solution.values[0], Object.values(FACTS.organShare));
  assert.deepEqual(bars.widget.data.map((d) => d.label.replace('\n', ' ').toLowerCase()), Object.keys(FACTS.organShare));
  assert.equal(bars.check(bars.solution), true);
});

test('lesson 6: an organ\'s share of resting power, and kilojoules against kilocalories', () => {
  const organs = new Set();
  let n = eachVariant('energy', 'organ-power', (s, text) => {
    const [watts] = grab(/at a rate of \*\*(\d+) watts\*\*/, text);
    const [organ, , share] = grab(/The (brain|liver|resting muscles|heart|kidneys) (use|uses) about \*\*(\d+)%\*\*/, text);
    assert.equal(Number(share), FACTS.organShare[organ], `share of the ${organ}`);
    const many = organ === 'kidneys' || organ === 'resting muscles';
    assert.ok(text.includes(many ? `The ${organ} use about` : `The ${organ} uses about`), 'grammar');
    assert.ok(text.includes(many ? 'they make up' : 'it makes up'));
    assert.match(text, new RegExp(`How many watts ${many ? 'do' : 'does'} (her|his) ${organ} use\\?`));
    const expected = (Number(watts) * Number(share)) / 100;
    checkNumeric(s, expected, { quotes: [`**${expected} watts**`] });
    assert.ok(Number(watts) >= 60 && Number(watts) <= 100, 'a plausible resting power');
    organs.add(organ);
  });
  assert.ok(n >= 20 && organs.size === 5, `${n} variants, ${organs.size} organs`);
  const ways = new Set();
  n = eachVariant('energy', 'kj-kcal', (s, text) => {
    assert.match(text, /One kilocalorie is about 4\.2 kilojoules/);
    const [value, unit] = grab(/says \*\*([\d,]+) (kJ|kcal)\*\*/, text);
    const toKcal = unit === 'kJ';
    assert.match(text, toKcal ? /How many kilocalories is that\?/ : /How many kilojoules is that\?/);
    const expected = toKcal ? number(value) / FACTS.energy.kjPerKcal : number(value) * FACTS.energy.kjPerKcal;
    checkNumeric(s, expected, { tol: 1e-6, quotes: [`**${grouped(expected)} ${toKcal ? 'kcal' : 'kJ'}**`] });
    assert.equal(s.unit, toKcal ? 'kcal' : 'kJ');
    assert.ok(Math.abs(expected - Math.round(expected)) < 1e-6, 'a whole number');
    // the food and its energy belong together: a conversion drill must not teach a wrong idea of a food
    const [food] = grab(/The label on (.+?) says/, text);
    const range = FACTS.labelKcal[food];
    assert.ok(range, `${food} is in the table`);
    const kcal = toKcal ? expected : number(value);
    assert.ok(kcal >= range[0] && kcal <= range[1], `${kcal} kcal is plausible for ${food}`);
    near(kcal * 4.184, toKcal ? number(value) : expected, 0.005 * kcal * 4.184, 'against the exact factor 4.184:');
    ways.add(unit);
  });
  assert.ok(n >= 20 && ways.size === 2, `${n} variants`);
});

/* ---------------------------------------------------------------- lesson 7 */

/** An hour of core temperature with a proportional response that acts `delay` minutes late, stepped finely. */
function ownHour(k, delay, drift = -0.04) {
  const dt = 0.01;
  const n = Math.round(60 / dt);
  const xs = [37];
  for (let i = 0; i < n; i++) {
    const j = i - Math.round(delay / dt);
    const felt = j < 0 ? 37 : xs[j];
    const push = Math.max(-0.3, Math.min(0.3, k * (37 - felt)));
    xs.push(xs[i] + (drift + push) * dt);
  }
  const tail = xs.slice(n - Math.round(15 / dt));
  return { lowest: Math.min(...xs), highest: Math.max(...xs), final: xs[n], inRange: Math.min(...xs) >= 36.5 && Math.max(...xs) <= 37.5, settled: Math.max(...tail) - Math.min(...tail) <= 0.1 };
}

test('lesson 7: the feedback model, and the strength that suits a five-minute delay', () => {
  assert.deepEqual(GAINS.map((g) => g.name), ['none', 'weak', 'medium', 'strong']);
  for (let g = 0; g < GAINS.length; g++) for (const delay of DELAYS) {
    const model = simulate({ scenario: 'cold', gain: g, delay });
    const own = ownHour(GAINS[g].k, delay);
    near(model.lowest, own.lowest, 0.03, `lowest with ${GAINS[g].name}, delay ${delay}:`);
    near(model.final, own.final, 0.05, `final with ${GAINS[g].name}, delay ${delay}:`);
    assert.equal(model.inRange, own.inRange, `in range with ${GAINS[g].name}, delay ${delay}`);
    assert.equal(model.settled, own.settled, `settled with ${GAINS[g].name}, delay ${delay}`);
    // the heat scenario is the mirror image
    const hot = simulate({ scenario: 'heat', gain: g, delay });
    near(hot.highest - 37, 37 - model.lowest, 0.02, 'mirror:');
  }
  // no response: a steady drift; any response without delay: it levels off short of the set point by drift ÷ strength
  near(ownHour(0, 0).final, 37 - 0.04 * 60, 1e-6);
  near(ownHour(0.12, 0).final, 37 - 0.04 / 0.12, 0.01);
  near(ownHour(0.32, 0).final, 37 - 0.04 / 0.32, 0.01);

  const tune = raw('kidneys-balance', 'tune');
  assert.equal(tune.widget.delay, 5);
  assert.deepEqual(tune.widget.controls, ['gain']);
  const accepted = [];
  for (let g = 0; g < GAINS.length; g++) {
    const own = ownHour(GAINS[g].k, 5);
    const model = simulate({ scenario: 'cold', gain: g, delay: 5 });
    const state = { scenario: 'cold', gain: g, gainName: GAINS[g].name, delay: 5, ran: true, lowest: model.lowest, highest: model.highest, final: model.final, inRange: model.inRange, settled: model.settled, swings: model.swings };
    const res = tune.check(state);
    assert.equal(res === true, own.inRange && own.settled, `strength ${GAINS[g].name}`);
    if (res === true) accepted.push(GAINS[g].name);
    else if (g === 0) assert.match(res, /no response/);
    else if (!own.inRange) { assert.match(res, /below the healthy range[\s\S]*too weak/); assert.ok(own.final < 36.5); assert.ok(res.includes(`${model.final} °C`)); }
    else { assert.match(res, /keeps swinging[\s\S]*overshoots/); assert.ok(!own.settled); }
    assert.match(tune.check({ ...state, ran: false, inRange: false, settled: false }), /Press \*\*Run\*\*/);
  }
  assert.deepEqual(accepted, ['medium']);
  assert.equal(tune.solution.gain, 2);

  const explore = raw('kidneys-balance', 'thermostat-explore');
  const tried = (gains) => ({ runs: gains.length, tried: gains.map((gain) => ({ gain, delay: 0 })) });
  assert.equal(explore.check(tried([0, 1, 2])), true);
  assert.equal(explore.check(tried([0, 2, 3])), true);
  assert.match(explore.check(tried([])), /Press \*\*Run\*\*/);
  assert.match(explore.check(tried([1, 2, 3])), /"none"/);
  assert.match(explore.check(tried([0, 1])), /2 of the 4 strengths/);
  assert.equal(explore.check(tried([0, ...explore.solution.tried.map((t) => t.gain), explore.solution.gain])), true);
});

test('lesson 7: finding the kidneys, a day\'s filtering and the water budget', () => {
  const where = raw('kidneys-balance', 'kidney-where');
  assert.equal(where.widget.view, 'back-torso');
  assert.ok(!expandIds(where.widget.show).some((id) => /kidney/.test(id)), 'the kidneys are not drawn before the answer');
  assert.deepEqual(where.widget.targets.map((t) => t.at).sort(), ['left-kidney', 'right-kidney']);
  assert.equal(where.check({ placed: true, distance: 0 }), true);
  assert.equal(where.check({ placed: true, distance: 4 }), true);
  assert.match(where.check({ placed: true, distance: 4.1 }), /about 4 cm from the nearest kidney/);
  assert.match(where.check({ placed: true, distance: 12.4 }), /about 12 cm[\s\S]*lowest ribs/);
  assert.match(where.check({ placed: false, distance: 30 }), /Move the marker/);
  assert.match(flat(where.text), /Within 4 cm counts/);

  let n = eachVariant('kidneys-balance', 'filter-day', (s, text) => {
    const [ml] = grab(/filter \*\*(\d+) mL\*\* of fluid/, text);
    assert.match(text, /A day has 1,440 minutes/);
    assert.equal(24 * 60, 1440);
    const expected = (Number(ml) * 24 * 60) / 1000;
    assert.ok(Number(ml) >= 90 && Number(ml) <= FACTS.balance.filterMlMin, 'a healthy filtering rate');
    checkNumeric(s, expected, { tol: 1e-6, quotes: [`**${expected} litres a day**`, `${FACTS.balance.filterLDay} litres`] });
  });
  assert.ok(n >= 4, `${n} variants`);
  n = eachVariant('kidneys-balance', 'taken-back', (s, text) => {
    const [filtered] = grab(/filter \*\*(\d+) litres\*\*/, text);
    const [urine, word] = grab(/produce \*\*([\d.]+) (litres?)\*\* of urine/, text);
    assert.equal(word, Number(urine) === 1 ? 'litre' : 'litres', 'grammar');
    assert.ok(Number(urine) >= FACTS.balance.urine[0] && Number(urine) <= FACTS.balance.urine[1], '1 to 2 litres of urine');
    const expected = Number(filtered) - Number(urine);
    const pct = Math.round((expected / Number(filtered)) * 1000) / 10;
    checkNumeric(s, expected, { quotes: [`**${expected} litres**`, `about ${pct}%`] });
    assert.ok(pct >= 98.5, 'nearly all of it is taken back');
  });
  assert.ok(n >= 10, `${n} variants`);

  // the water budget: every slider setting, with the sum done here
  const step = raw('kidneys-balance', 'water');
  const accepted = [];
  for (let intake = 0.5; intake <= 4; intake += 0.5) for (const sweat of SWEATS) {
    const spare = intake + FACTS.water.made - FACTS.water.fixedLoss - sweat;
    const urine = Math.max(FACTS.water.minUrine, spare);
    const short = Math.max(0, FACTS.water.minUrine - spare);
    const model = waterDay(intake, sweat);
    near(model.urine, urine, 1e-9, `urine with ${intake} in, ${sweat} sweated:`);
    near(model.short, short, 1e-9, `shortfall with ${intake} in, ${sweat} sweated:`);
    near(model.takenBack, FACTS.balance.filterLDay - urine, 1e-9);
    // in balance, what goes out equals what comes in
    if (short === 0) near(intake + FACTS.water.made, FACTS.water.fixedLoss + sweat + urine, 1e-9, 'balance:');
    const res = step.check({ ...model, changed: [] });
    const smallest = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].find((v) => v + FACTS.water.made - FACTS.water.fixedLoss - 2 >= FACTS.water.minUrine);
    const good = sweat === 2 && intake === smallest;
    assert.equal(res === true, good, `${intake} in, ${sweat} sweated`);
    if (good) accepted.push(intake);
    else if (sweat !== 2) assert.match(res, /set the sweat to 2\.0 litres/);
    else if (short > 0) assert.ok(res.includes(`short by ${short.toFixed(1)} litres`), res);
    else assert.ok(res.includes(`${urine.toFixed(1)} litres of urine to spare`), res);
  }
  assert.deepEqual(accepted, [3.5]);
  assert.deepEqual(step.solution, { sweat: 2, intake: 3.5 });
  // darker urine when less is made; the default day gives a typical 1 to 2 litres of pale urine
  const typical = waterDay(2.5, 0.2);
  assert.ok(typical.urine >= 1 && typical.urine <= 2 && typical.colourName === 'pale straw' && typical.balanced);
  assert.ok(waterDay(3.5, 2).colour > typical.colour);
  assert.equal(waterDay(1, 2).adh, 'very high');
  assert.ok(waterDay(4, 0.2).colour < typical.colour);
});

/* ------------------------------------------------------------------ safety */

const DISCLAIMER = '> **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.';

test('safety: the disclaimer, no personal health data, sober steps and plain red flags', () => {
  // the standard disclaimer: once, word for word, on the first or second step of the first lesson
  const holders = [];
  for (const { lesson, step } of allSteps()) if (String(step.text || '').includes('A note before we start')) holders.push(`${lesson}/${step.id}`);
  assert.deepEqual(holders, ['cells-to-systems/city']);
  assert.ok(lessons['cells-to-systems'].steps.findIndex((s) => s.id === 'city') <= 1);
  assert.ok(flat(raw('cells-to-systems', 'city').text).includes(flat(DISCLAIMER)), 'word for word');

  const asksForData = /\b(enter|type|record|write down|tell us|input) your\b|\byour (own )?(weight|height|age|bmi|blood pressure|waist|intake|diet|symptoms|medicines|medication|cycle|period|mood|calories)\b|how (much|many|old|tall|heavy) (do|are|did) you\b|what did you (eat|drink)/i;
  const moralising = /\b(junk food|guilt[- ]free|clean eating|ideal weight|target weight|lose weight|weight[- ]loss (plan|goal|tip)|burn off|the obese|normal people|bad food|good food)\b/i;
  const selfHarm = /\b(suicid|self[- ]harm|kill (yourself|themselves|himself|herself))/i;
  for (const { lesson, step } of allSteps()) {
    for (let k = 0; k < 40; k++) {
      const s = resolveStep(step, makeRng(900 + k * 17), step.id);
      for (const text of visible(s)) {
        assert.ok(!asksForData.test(text), `${lesson}/${step.id} asks for the learner's own data: "${text.slice(0, 120)}"`);
        assert.ok(!moralising.test(text), `${lesson}/${step.id}: wording to avoid in "${text.slice(0, 120)}"`);
        assert.ok(!selfHarm.test(text), `${lesson}/${step.id}: this course does not discuss suicide or self-harm`);
      }
      // a numeric answer is never a measurement of the learner: calculations are about a named example person or a general case
      if (s.type === 'numeric') assert.ok(!/\b(count|measure|take|find) your\b|\byour (pulse|heart rate|breathing rate|blood)\b/i.test(flat(s.text)), `${lesson}/${step.id} computes with the learner's own measurement`);
      if (!step.gen) break;
    }
  }
  // steps about danger to life are sober, and no others
  const sober = Object.fromEntries(LESSONS.map((id) => [id, lessons[id].steps.filter((s) => s.tone === 'sober').map((s) => s.id)]));
  assert.deepEqual(sober, { 'cells-to-systems': [], 'heart-circulation': [], blood: ['co'], breathing: ['blackout'], digestion: [], energy: [], 'kidneys-balance': ['dialysis'] });
  for (const { lesson, step } of allSteps()) {
    const text = flat([step.text, step.explain].join(' '));
    if (/drown|carbon monoxide|kept alive by a machine/i.test(text)) assert.equal(step.tone, 'sober', `${lesson}/${step.id} is about danger to life`);
  }
  // red flags are stated plainly
  assert.match(flat(raw('blood', 'co').explain), /Get everyone into fresh air and call your emergency number/);
  assert.match(flat(raw('breathing', 'slows').explain), /severe difficulty breathing is an emergency: call your emergency number/);
  assert.match(flat(raw('breathing', 'blackout').explain), /never over-breathe before swimming underwater/);
  // nothing discourages care: advice to see someone is phrased as an invitation to ask
  assert.match(flat(raw('blood', 'anaemia').explain), /raise with a doctor/);
  assert.match(flat(raw('digestion', 'intolerance').explain), /tested \*before\* cutting out gluten/);
  assert.match(flat(raw('kidneys-balance', 'water').explain), /not a guide to how much to drink/);
  assert.match(flat(raw('blood', 'anaemia').explain), /not to guess at or to treat on your own with iron tablets/);
  // the pulse note: when to ask, that a low rate alone is common in fit people, and the emergency line
  const pulseNote = flat(raw('heart-circulation', 'notice').text);
  assert.match(pulseNote, /often above 100 or feels irregular is worth mentioning to a doctor/);
  assert.match(pulseNote, /below 60 that comes with dizziness or faintness \(a low rate alone is common in fit people\)/);
  assert.match(pulseNote, /Chest pain, fainting or severe breathlessness needs urgent help: call your emergency number/);
  assert.ok(!/usually harmless/.test(pulseNote), 'an irregular pulse is not waved away');
  // urine colour: a rough guide only, other things change it, and blood in the urine is checked promptly (NHS)
  const urine = flat(raw('kidneys-balance', 'notice').text);
  assert.match(urine, /rough guide only: some foods, vitamins and medicines change the colour/);
  assert.match(urine, /Red, pink or brown urine with no obvious cause \(such as beetroot\) should be checked by a doctor promptly, even if it happens only once/);
  // choking is pointed to first aid; a core pushed out of range is an emergency; a transplant or dialysis is described plainly
  assert.match(flat(raw('digestion', 'swallow').explain), /cannot cough, speak or breathe needs help at once/);
  assert.match(flat(raw('kidneys-balance', 'dialysis').explain), /Wastes cross by diffusion, and gentle pressure draws off spare water/);
  assert.match(flat(raw('kidneys-balance', 'dialysis').explain), /about four hours, typically three times a week/);
  assert.match(flat(raw('kidneys-balance', 'dialysis').explain), /at least one adult in ten/);
  assert.match(flat(raw('blood', 'co').explain), /A carbon monoxide alarm is the reliable protection/);
  assert.ok(!/nearly empty/.test(flat(raw('blood', 'co').explain)));
  assert.match(flat(raw('breathing', 'blackout').explain), /never practise breath-holding in water alone/);
  // the energy lesson: fat leaving as carbon dioxide is told as chemistry, with no advice attached
  for (const step of lessons.energy.steps) {
    const text = flat(visible(resolveStep(step, makeRng(5), step.id)).join(' '));
    assert.ok(!/\b(diet|slim|weight loss|lose weight|fat[- ]burning zone|burn (off|more) (fat|calories)|calorie deficit|eat less)\b/i.test(text), `energy/${step.id}: no weight-loss framing`);
  }
  assert.match(flat(raw('energy', 'fat-far').explain), /not a recipe: no setting on this model is "better" than another/);
  // self-observation is optional and never recorded
  for (const [lesson, id] of [['heart-circulation', 'notice'], ['breathing', 'notice']]) assert.match(flat(raw(lesson, id).text), /nothing to (write down|record)/);
  // blood is never said to be blue
  assert.match(flat(one('heart-circulation', 'blue-blood').explain), /Human blood is always red/);
});

test('every body-map structure, anchor and system used in the course exists', () => {
  const structures = new Set(structureIds());
  const anchors = new Set(anchorIds());
  const known = (id) => { const base = String(id).split(':')[0]; return structures.has(base) || anchors.has(base) || expandIds([base]).length > 0; };
  let specs = 0;
  let ids = 0;
  const need = (id, where) => { if (Array.isArray(id) || typeof id !== 'string') return; ids++; assert.ok(known(id), `${where}: body-map does not know "${id}"`); };
  for (const { lesson, step } of allSteps()) {
    for (let k = 0; k < 30; k++) {
      const s = resolveStep(step, makeRng(31 + k * 211), step.id);
      for (const spec of figuresOf(s)) {
        if (spec.type !== 'body-map') continue;
        specs++;
        const where = `${lesson}/${step.id}`;
        for (const key of ['show', 'hide', 'ghost', 'focus', 'pickable']) for (const id of spec[key] || []) need(id, where);
        for (const label of Array.isArray(spec.labels) ? spec.labels : []) need(typeof label === 'string' ? label : label.id, where);
        for (const g of spec.groups || []) for (const id of [].concat(g.ids)) need(id, where);
        for (const m of spec.markers || []) need(m.at, where);
        for (const f of spec.flows || []) for (const stop of f.path) need(stop, where);
        for (const t of spec.targets || []) need(t.at, where);
        if (spec.target) need(spec.target, where);
        for (const id of [].concat(spec.answer || [])) need(id, where);
        for (const id of Object.keys(spec.notes || {})) need(id, where);
        assert.ok(spec.alt && spec.alt.length > 30, `${where}: the figure is described`);
        if (s.type === 'interact' && s.widget === spec) {
          for (const id of [].concat(s.solution.seen || [], s.solution.picked || [])) need(id, where);
          if (typeof s.solution.at === 'string') need(s.solution.at, where);
        }
      }
      if (!step.gen) break;
    }
  }
  assert.ok(specs >= 8 && ids >= 40, `${specs} body-map figures, ${ids} ids checked`);
  assert.ok(!known('no-such-organ'));
});

test('every photo comes from the course\'s media manifest, with a licence, a credit and a description', () => {
  const used = new Set();
  for (const { lesson, step } of allSteps()) {
    const s = resolveStep(step, makeRng(3), step.id);
    for (const spec of figuresOf(s)) {
      if (spec.type !== 'photo') continue;
      const id = /content\/media\/body-systems\/([a-z0-9-]+)\.jpg/.exec(spec.src);
      assert.ok(id, `${lesson}/${step.id}: picture ${spec.src} is not in this course's media folder`);
      const rec = manifest.images[id[1]];
      assert.ok(rec, `${lesson}/${step.id}: ${id[1]} is in the manifest`);
      assert.ok(rec.license && rec.sourceUrl && /commons\.wikimedia\.org/.test(rec.sourceUrl), `${id[1]}: licence and source`);
      assert.ok(rec.publicDomain || rec.author, `${id[1]}: credit`);
      assert.ok(/^(Public domain|CC0|CC BY(-SA)? \d\.\d)/.test(rec.license), `${id[1]}: an accepted licence (${rec.license})`);
      assert.equal(spec.license, rec.license, `${id[1]}: the lesson shows the recorded licence`);
      assert.ok(spec.alt && spec.alt.length >= 60, `${lesson}/${step.id}: ${id[1]} needs a real description`);
      assert.ok(!/^(a |an |the )?(photo|image|picture)/i.test(spec.alt), `${lesson}/${step.id}: alt should describe, not announce`);
      used.add(id[1]);
    }
    if (s.type === 'interact' && s.widget.type === 'photo') {
      const spots = s.widget.hotspots;
      assert.ok(spots.length >= 3, `${lesson}/${step.id}: at least three hotspots`);
      for (const h of spots) assert.ok(h.x > 0 && h.x < 1 && h.y > 0 && h.y < 1 && h.r >= 0.05 && h.label && h.alt, `${lesson}/${step.id}: hotspot ${h.id}`);
      assert.ok(spots.some((h) => h.id === s.solution.picked));
      // the alt text of the picture and of its hotspots does not name the answer
      const answer = spots.find((h) => h.id === s.solution.picked).label.toLowerCase();
      assert.ok(!s.widget.alt.toLowerCase().includes(answer), `${lesson}/${step.id}: the description does not give the answer away`);
      for (const h of spots) assert.ok(!h.alt.toLowerCase().includes(h.label.toLowerCase()), `${lesson}/${step.id}: hotspot ${h.id}`);
    }
  }
  assert.deepEqual([...used].sort(), Object.keys(manifest.images).sort(), 'every picture in the manifest is used, and nothing else');
  assert.ok(used.size >= 5 && used.size <= 20, `${used.size} pictures`);
  // about four pictures a lesson (docs/IMAGES.md); a question with four picture options uses its four
  for (const [id, lesson] of Object.entries(lessons)) {
    const figures = lesson.steps.flatMap((step) => figuresOf(resolveStep(step, makeRng(3), step.id))).filter((f) => f.type === 'photo');
    assert.ok(new Set(figures.map((f) => f.src)).size <= 4, `${id}: ${figures.length} pictures`);
    assert.ok(figures.length <= 5, `${id}: ${figures.length} pictures`);
  }
});

/* ------------------------------------------------------- teach before you ask */

/** The teaching screens that make sure nothing is asked before it has been shown (docs/AUTHORING.md, "Teach before you ask"). */
const TEACHING = {
  'cells-to-systems': ['teach-shapes', 'teach-needs', 'teach-supply', 'teach-rest'],
  'heart-circulation': ['teach-beat', 'teach-lap', 'teach-vessels', 'teach-output'],
  blood: ['teach-parts', 'teach-haemoglobin', 'teach-clot'],
  breathing: ['teach-airway', 'teach-bellows', 'surface', 'teach-drive'],
  digestion: ['teach-molecules', 'teach-tube', 'teach-enzymes'],
  energy: ['teach-respiration', 'teach-atp', 'teach-routes'],
  'kidneys-balance': ['teach-effectors', 'teach-kidneys'],
};

test('teach before you ask: every lesson teaches before its first graded step, on at least three screens, with at most two predictions', () => {
  const role = (lesson, s) => { const r = resolveStep(s, makeRng(1), s.id); return s.type === 'info' ? 'teach' : r.mode === 'predict' ? 'predict' : r.graded ? 'graded' : s.type === 'reflect' ? 'reflect' : 'explore'; };
  const text = (lesson, id, seed = 1) => flat(one(lesson, id, seed).text);
  const at = (lesson, id) => { const i = lessons[lesson].steps.findIndex((s) => s.id === id); assert.ok(i >= 0, `${lesson}/${id} exists`); return i; };
  /** `teach` is a teaching screen, stands before every step of `serves`, and contains every one of `terms`. */
  const serves = (lesson, teach, serve, terms) => {
    assert.equal(raw(lesson, teach).type, 'info', `${lesson}/${teach} is a teaching screen`);
    for (const id of [].concat(serve)) assert.ok(at(lesson, teach) < at(lesson, id), `${lesson}/${teach} comes before ${id}`);
    for (const term of terms) assert.ok(typeof term === 'string' ? text(lesson, teach).toLowerCase().includes(term.toLowerCase()) : term.test(text(lesson, teach)), `${lesson}/${teach} shows "${term}"`);
  };
  assert.deepEqual(Object.keys(TEACHING), LESSONS);
  for (const [id, lesson] of Object.entries(lessons)) {
    const roles = lesson.steps.map((s) => role(id, s));
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: a teaching screen or an exploration comes before the first graded step (${lesson.steps[firstGraded].id})`);
    assert.ok(roles.slice(0, -1).filter((r) => r === 'teach').length >= 3, `${id}: at least three teaching screens before the closing invitation`);
    assert.ok(roles.filter((r) => r === 'predict').length <= 2, `${id}: at most two predictions`);
    for (const stepId of TEACHING[id]) {
      const step = raw(id, stepId);
      assert.equal(step.type, 'info', `${id}/${stepId} is a teaching screen`);
      assert.ok(flat(step.text).length > 150, `${id}/${stepId} teaches something`);
      assert.ok(at(id, stepId) < lesson.steps.length - 1, `${id}/${stepId} comes before the closing invitation`);
      assert.ok(!step.tone, `${id}/${stepId}: none of the new screens is about danger to life`);
      for (const figure of [step.figure].flat().filter(Boolean)) assert.ok(figure.alt && figure.alt.length > 40, `${id}/${stepId}: the figure has alt text`);
    }
  }

  // lesson 1: the four cells, the reserves, and every system and organ a generated question can ask for
  serves('cells-to-systems', 'teach-shapes', 'shapes', ['bendy disc', 'nucleus', 'up to a metre long', 'slide past each other', 'flat, tough tiles']);
  // the figure draws the red cell's dimple as a darker middle, as the nerve cell's nucleus is drawn: the text says which is which
  assert.match(text('cells-to-systems', 'teach-shapes'), /darker middle in the picture is a dimple in the disc, not a nucleus/);
  // then the real cells: one micrograph of each of the four kinds as picture options, after the drawing has been matched
  serves('cells-to-systems', 'teach-shapes', 'real-cells', ['bendy disc', 'up to a metre long', 'slide past each other', 'flat, tough tiles']);
  assert.ok(at('cells-to-systems', 'shapes') < at('cells-to-systems', 'real-cells'), 'the drawing is matched before the real cells are shown');
  const real = raw('cells-to-systems', 'real-cells');
  const pictured = (o) => /content\/media\/body-systems\/([a-z0-9-]+)\.jpg/.exec(o.figure.src)[1];
  assert.deepEqual(real.options.map(pictured).sort(), ['muscle-fibres', 'neuron', 'red-cells', 'skin-cells']);
  assert.deepEqual(real.options.filter((o) => o.correct).map(pictured), ['neuron']);
  assert.match(text('cells-to-systems', 'real-cells'), /Which picture shows a nerve cell\?/);
  for (const o of real.options) {
    assert.ok(o.figure.type === 'photo' && !o.text && !o.figure.caption, 'picture options carry no words');
    assert.ok(!/nerve|neuron|blood|muscle|skin/i.test(o.figure.alt), `the description does not name the cell: ${o.figure.alt}`);
    assert.ok(o.correct || o.why, 'each other picture says what it shows');
  }
  serves('cells-to-systems', 'teach-needs', 'needs', ['| Fuel | weeks |', '| Water | days |', '| Oxygen | a few minutes |']);
  for (const sy of H.SYSTEMS) {
    const screen = ['respiratory', 'digestive', 'circulatory', 'urinary'].includes(sy.id) ? 'teach-supply' : 'teach-rest';
    serves('cells-to-systems', screen, 'which-system', [`**${sy.name}** (${sy.organs.join(', ')}): ${sy.job}`]);
  }
  assert.equal(H.SYSTEMS.filter((sy) => text('cells-to-systems', 'teach-supply').includes(`**${sy.name}**`)).length, 4);
  assert.equal(H.SYSTEMS.filter((sy) => text('cells-to-systems', 'teach-rest').includes(`**${sy.name}**`)).length, 7);
  serves('cells-to-systems', 'teach-supply', 'find-organ', [/person's right side is on your left/]);
  const organFigure = raw('cells-to-systems', 'teach-supply').figure;
  const named = expandIds(organFigure.labels.map((l) => (typeof l === 'string' ? l : l.id)));
  for (const organ of H.ORGANS) assert.ok(organ.ids.some((oid) => named.includes(oid)), `the ${organ.name} is named on the figure before it is asked for`);
  assert.equal(organFigure.view, one('cells-to-systems', 'find-organ').widget.view, 'the same view as the question');
  assert.match(text('cells-to-systems', 'how-small'), /3 mm is 3,000 µm, and 3,000 ÷ 10 = 300/, 'a worked line');
  assert.ok(!H.CELL_SIZES.some((c) => c.um === 10 || c.spans.includes(3)), 'with numbers the generator cannot produce');

  // lesson 2: valves and sounds, the lap, the vessels, the sum
  serves('heart-circulation', 'teach-beat', ['one-way', 'lub-dub'], ['| relax and fill | open | shut |', '| squeeze | shut | open |', /"Lub"\*\*: the inlet valves shut as the ventricles start to squeeze/, /"Dub"\*\*: the outlet valves shut as the ventricles relax/]);
  serves('heart-circulation', 'teach-lap', ['follow-blood', 'why-thicker', 'blue-blood'], [`**${FACTS.bloodPath.join(' → ')}**`, `about ${FACTS.heart.right} mmHg`, `about ${FACTS.heart.left} mmHg`, 'Real blood is always red', 'darker red when it has given some up']);
  const lap = raw('heart-circulation', 'teach-lap').figure;
  assert.deepEqual(lap.flows.map((f) => f.path[f.path.length - 1]), ['right-atrium', 'right-ventricle', 'pulmonary-artery', 'left-atrium', 'left-ventricle', 'aorta'], 'the arrows follow the lap');
  assert.deepEqual(lap.flows.map((f) => f.color), ['blue', 'blue', 'blue', 'red', 'red', 'red'], 'oxygen-poor on the right side, oxygen-rich on the left');
  for (const fact of H.VESSEL_FACTS) serves('heart-circulation', 'teach-vessels', 'vessels', [fact.text]);
  for (const [k, kind] of H.VESSEL_KINDS.entries()) {
    const line = text('heart-circulation', 'teach-vessels').split('- **').find((l) => l.startsWith(`${kind}**`));
    for (const fact of H.VESSEL_FACTS) assert.equal(line.toLowerCase().includes(fact.text.toLowerCase()), fact.kind === k, `"${fact.text}" stands under ${kind} only`);
  }
  serves('heart-circulation', 'teach-output', ['harvey-sum', 'output'], ['100 × 50 mL = 5,000 mL, which is 5 litres', '5 litres × 60 = 300 litres', 'stroke volume', 'cardiac output']);
  assert.equal((100 * 50) / 1000, 5);
  assert.deepEqual([raw('heart-circulation', 'teach-output').figure.rate, raw('heart-circulation', 'teach-output').figure.stroke], [100, 50], 'the figure starts on the worked example');
  for (let seed = 1; seed <= 40; seed++) assert.ok(!/\*\*100 times a minute\*\*|\*\*50 mL\*\*/.test(text('heart-circulation', 'harvey-sum', seed)), 'the worked example is not one of the questions');
  assert.match(text('heart-circulation', 'pulse'), /7 beats in 6 seconds would be 7 × 10 = 70 a minute/);

  // lesson 3: the parts, the red cell, the clot
  for (const p of H.BLOOD_PARTS) serves('blood', 'teach-parts', ['parts', 'cells-photo'], [`| **${p.part}** | ${p.job} |`]);
  serves('blood', 'teach-parts', 'cells-photo', ['bone marrow', 'A platelet is only a fragment, smaller than either cell']);
  serves('blood', 'teach-haemoglobin', ['red-cells', 'anaemia', 'co'], ['iron', 'bone marrow', 'nucleus', `**${FACTS.blood.redLife} days**`, `${FACTS.blood.madePerSecond} million new ones every second`, `${H.BLOOD.haemPerCell} million`]);
  assert.ok(at('blood', 'cells-photo') < at('blood', 'teach-haemoglobin'), 'the named photograph comes after the question about it');
  for (const step of H.CLOT_STEPS) serves('blood', 'teach-clot', 'clot', [step]);
  assert.match(text('blood', 'teach-clot'), /1\. The cut vessel narrows.*2\. Platelets stick.*3\. Protein threads.*4\. The mesh traps/s);
  assert.match(text('blood', 'donation-share'), /300 ÷ 6,000 = 0\.05, which is 5%/);
  assert.ok(!H.DONATIONS.some((d) => d.ml === 300), 'with numbers the generator cannot produce');

  // lesson 4: the airway, the bellows, the air sacs, the drive to breathe
  serves('breathing', 'teach-airway', 'airway', ['nose or mouth', 'throat', 'windpipe', 'bronchi', 'bronchioles', 'air sacs']);
  const where = FACTS.airway.map((word) => text('breathing', 'teach-airway').toLowerCase().indexOf(word === 'nose' ? 'nose or mouth' : word));
  assert.ok(where.every((p, i) => p >= 0 && (i === 0 || p > where[i - 1])), 'the stops are named in the order of the airway');
  serves('breathing', 'teach-bellows', 'bellows', ['diaphragm', 'tightens and flattens downward', 'air flows in', 'lungs spring back']);
  serves('breathing', 'surface', ['explore-sac', 'fick'], ['capillaries', 'less than a thousandth of a millimetre apart']);
  serves('breathing', 'teach-drive', ['blackout'], ['carbon dioxide', 'brainstem', 'about 97% loaded', 'wash carbon dioxide out']);
  assert.ok(at('breathing', 'drive') < at('breathing', 'teach-drive'), 'the guess comes first');
  assert.match(text('breathing', 'oxygen-used'), /300 × 3 ÷ 100 = 9 mL/);
  assert.match(text('breathing', 'air-per-minute'), /10 breaths of 300 mL would be 3,000 mL, or 3 litres/);

  // lesson 5: molecules, rooms, enzymes, and where the blood from the gut goes
  for (const n of H.NUTRIENTS) serves('digestion', 'teach-molecules', 'small-molecules', [`**${n.name}**, as in ${n.food}, is cut into **${n.units.toLowerCase()}**`]);
  serves('digestion', 'teach-molecules', 'small-molecules', ['Vitamins need no cutting']);
  for (const room of H.GUT_PATH) serves('digestion', 'teach-tube', ['tube-order', 'stomach', 'large'], [`**${room}**:`]);
  const rooms = H.GUT_PATH.map((room) => text('digestion', 'teach-tube').indexOf(`**${room}**`));
  assert.ok(rooms.every((p, i) => i === 0 || p > rooms[i - 1]), 'the rooms are listed in the order of the tube');
  serves('digestion', 'teach-tube', 'large', ['water and salts are taken back', 'ferment part of the fibre', 'vitamin K', 'nearly everything useful is absorbed']);
  assert.ok(at('digestion', 'journey') < at('digestion', 'teach-tube'), 'the rooms are named after the meal has been followed');
  for (const [enzyme, cuts] of H.ENZYME_PAIRS) serves('digestion', 'teach-enzymes', ['enzymes', 'intolerance'], [`| **${enzyme}** | ${cuts} |`]);
  assert.match(text('digestion', 'swallow'), /a small flap, the \*\*epiglottis\*\*/);
  assert.ok(raw('digestion', 'swallow').figure.labels.includes('epiglottis'), 'the flap is named on the figure');
  assert.match(text('digestion', 'liver-first'), /carries it to the \*\*liver\*\* first/);
  for (const screen of ['teach-tube', 'teach-enzymes']) assert.ok(raw('digestion', screen).figure.labels.includes('liver') && at('digestion', screen) < at('digestion', 'liver-first'), `the liver is named on ${screen}`);

  // lesson 6: respiration, ATP, the two routes
  serves('energy', 'teach-respiration', 'equation', ['sugar', 'oxygen', 'carbon dioxide', 'water', 'energy', 'respiration']);
  serves('energy', 'teach-atp', ['mitochondria', 'atp'], ['ATP', 'recharged', 'spending money, not savings']);
  assert.ok(at('energy', 'find-mito') < at('energy', 'teach-atp'), 'the mitochondria are found before they are explained');
  for (const fact of H.OXYGEN_FACTS) serves('energy', 'teach-routes', ['lactate', 'aerobic-vs'], [fact.text]);
  for (const [k, route] of ['With oxygen', 'Without oxygen'].entries()) {
    const line = text('energy', 'teach-routes').split('- **').find((l) => l.startsWith(`${route}**`));
    for (const fact of H.OXYGEN_FACTS) assert.equal(line.toLowerCase().includes(fact.text.toLowerCase()), fact.kind === k, `"${fact.text}" stands under "${route}" only`);
  }
  // "atp" was a guess; it is now reasoned from two figures in its prompt (about 0.1 kg, recharged hundreds of times)
  assert.ok(!one('energy', 'atp').mode && one('energy', 'atp').graded);
  assert.match(text('energy', 'atp'), /about a tenth of a kilogram of ATP at any moment.*recharged hundreds of times a day/s);
  assert.match(text('energy', 'lactate'), /only 2 of about 30 ATP.*Within about an hour.*Very little of it is lost in the urine/s);
  assert.match(text('energy', 'organ-power'), /30% of 50 watts would be 50 × 30 ÷ 100 = 15 watts/);
  for (let seed = 1; seed <= 12; seed++) assert.match(text('energy', 'kj-kcal', seed), /so 10 kcal is about 42 kJ, and 84 kJ is about 20 kcal/);
  assert.ok(!H.LABEL_ENERGY.some(([kj, kcal]) => kcal === 10 || kcal === 20));

  // lesson 7: the responses, the kidneys, and the two loops named in a prompt
  for (const r of H.TEMP_RESPONSES) serves('kidneys-balance', 'teach-effectors', 'effectors', [r.text]);
  for (const [k, state] of ['Body too hot', 'Body too cold'].entries()) {
    const line = text('kidneys-balance', 'teach-effectors').split('- **').find((l) => l.startsWith(`${state}**`));
    for (const r of H.TEMP_RESPONSES) assert.equal(line.toLowerCase().includes(r.text.toLowerCase()), r.kind === k, `"${r.text}" stands under "${state}" only`);
  }
  serves('kidneys-balance', 'teach-kidneys', ['kidney-where', 'filter-day', 'water', 'taken-back', 'steady', 'dialysis'], ['high at the back of the abdomen', 'each side of the spine', 'lowest ribs', '**filter**', '**takes back**', 'water and salt steady']);
  const kidneys = raw('kidneys-balance', 'teach-kidneys').figure;
  assert.equal(kidneys.view, raw('kidneys-balance', 'kidney-where').widget.view, 'the same view as the question');
  assert.ok(expandIds(kidneys.show).includes('left-kidney') && expandIds(kidneys.show).includes('right-kidney'), 'and here the kidneys are drawn');
  assert.match(text('kidneys-balance', 'head-myth'), /left only the head bare.*about a tenth of the body's surface/s);
  assert.match(text('kidneys-balance', 'adh'), /a hormone, \*\*ADH\*\*, which tells the kidneys to take back more water/);
  assert.match(text('kidneys-balance', 'steady'), /two hormones from the pancreas, insulin and glucagon/);
  assert.match(text('kidneys-balance', 'filter-day'), /10 × 1,440 = 14,400 mL, which is 14\.4 litres/);
  assert.equal((10 * 1440) / 1000, 14.4);
});

/* ------------------------------------------------------------------- guard */

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.slice().sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} is generated, but no test above re-derives it`);
  }
  // every interact step has a check, a solution and an explanation, and its own solution has been fed to it above or by the smoke test
  for (const { lesson, step } of allSteps()) {
    if (step.type !== 'interact') continue;
    const s = resolveStep(step, makeRng(1), step.id);
    assert.equal(typeof s.check, 'function', `${lesson}/${step.id}`);
    assert.ok(s.solution && s.explain, `${lesson}/${step.id}`);
  }
});
