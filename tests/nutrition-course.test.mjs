// Independent checks of "Food and Nutrition". The facts of the course are typed in here a second time, from
// the author's verified notes (each with the body and year it comes from), and compared with the tables the
// lessons are built from. Every generated question is re-solved from its own wording: the numbers are parsed
// out of the text, or out of the figure the learner sees, and worked with arithmetic written here. Interact
// steps are checked by feeding their `check` every state the controls allow, worked out here, so that exactly
// the states the instruction asks for are accepted. Safety rules of the Health path are asserted at the end.
//
//   node --test tests/nutrition-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import course from '../content/courses/nutrition/course.js';
import * as H from '../content/courses/nutrition/helpers.js';
import { energyKcal, energyKj, energyShare } from '../src/widgets/food-makeup.js';
import { peakRise, peakTime, glucoseRise, glycaemicLoad } from '../src/widgets/glucose-curve.js';
import { describeAcid } from '../src/widgets/fatty-acid.js';
import { labelKj, labelKcal, perServing, lightBand } from '../src/widgets/food-label.js';
import { fraction } from '../src/widgets/plate-builder.js';
import { STRUCTURES, ALIASES, SYSTEMS } from '../assets/body/structures.js';

const SEEDS = 200;
const LESSONS = ['energy-balance', 'carbohydrates', 'fats', 'protein', 'vitamins-minerals', 'water-salt', 'eating-well'];
/** Every generated step of the course. Each one is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'energy-balance': ['label-energy', 'top-source'],
  carbohydrates: ['fibre-day', 'free-sugars', 'drink-sugar'],
  fats: ['solid-or-liquid', 'saturates-ri'],
  protein: ['reference-intake', 'above-reference'],
  'vitamins-minerals': ['deficiency', 'nrv-percent'],
  'water-salt': ['sodium-salt', 'caffeine'],
  'eating-well': ['fair-compare', 'traffic'],
};
/** Every interact step, with the widget it uses. Each has a test below. */
const INTERACT = {
  'energy-balance': { explore: 'food-makeup', build: 'food-makeup', spending: 'bars' },
  carbohydrates: { explore: 'glucose-curve', extremes: 'glucose-curve' },
  fats: { explore: 'fatty-acid', 'build-omega3': 'fatty-acid', trans: 'fatty-acid', swap: 'bars' },
  protein: { hook: 'bars', explore: 'food-makeup', 'plant-day': 'serving-tally', 'nitrogen-route': 'body-map' },
  'vitamins-minerals': { history: 'timeline', dose: 'plot', world: 'bars', 'salt-pack': 'photo' },
  'water-salt': { sources: 'bars', pressure: 'plot', 'salt-sources': 'bars', 'salt-day': 'serving-tally' },
  'eating-well': { plate: 'plate-builder', 'set-meal': 'photo', ingredients: 'food-label', 'us-label': 'photo' },
};
const tested = new Set();                       // generated steps that a test below has re-derived
const interactTested = new Set();

const lessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/nutrition/lessons/${id}.js`);
  lessons[id] = normalizeLesson(mod.default, 'nutrition', id);
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const number = (s) => Number(String(s).replace(/,/g, ''));
const near = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} expected ${b}, got ${a}`);
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };
const grabAll = (re, text) => [...text.matchAll(re)].map((m) => m.slice(1));
const correctText = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: one correct option`); return right[0].text; };

/** Run a generated step with many seeds and hand each concrete step to `verify`. Returns how many different questions appeared. */
function eachVariant(lesson, id, verify, n = SEEDS) {
  const step = raw(lesson, id);
  assert.equal(typeof step.gen, 'function', `${lesson}/${id} is generated`);
  assert.ok(GENERATED[lesson].includes(id), `${lesson}/${id} is listed in GENERATED`);
  tested.add(`${lesson}/${id}`);
  const texts = new Set();
  for (let k = 0; k < n; k++) {
    const s = resolveStep(step, makeRng(4217 + k * 7919), id);
    texts.add(flat(s.text) + JSON.stringify([s.items, s.pairs, s.options && s.options.map((o) => o.text), s.figures.map((f) => (f.product && f.product.id) || f.categories)]));
    try { verify(s); } catch (err) { err.message = `${lesson}/${id} (seed ${k}): ${err.message}\n  text: ${flat(s.text)}`; throw err; }
  }
  return texts.size;
}
/** The interact step, noted as tested. */
function interact(lesson, id) {
  const step = one(lesson, id);
  assert.equal(step.type, 'interact', `${lesson}/${id}`);
  assert.equal(step.widget.type, INTERACT[lesson][id], `${lesson}/${id} uses ${INTERACT[lesson][id]}`);
  interactTested.add(`${lesson}/${id}`);
  return step;
}
const passes = (step, state) => step.check(state) === true;
/** A wrong state must be refused, and where the refusal comes with a message, the message is a sentence. */
function refuses(step, state, msg) {
  const res = step.check(state);
  assert.notEqual(res, true, `${step.id}: ${msg || JSON.stringify(state)} should not be accepted`);
  if (typeof res === 'string') assert.ok(res.length > 15 && !/undefined|NaN/.test(res), `${step.id}: feedback "${res}"`);
  return res;
}

/** Every string a learner can see in a resolved step (figure markup and data keys excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['content', 'type', 'id', 'viewBox', 'color', 'expr', 'mode', 'kind', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'unit', 'tag', 'fit', 'pickable', 'key']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/* ------------------------------------------------- the facts, a second time */

// Energy per gram on labels: EU Regulation 1169/2011, Annex XIV (the "Atwater" general factors).
const KCAL = { carb: 4, protein: 4, fat: 9, alcohol: 7, fibre: 2 };
const KJ = { carb: 17, protein: 17, fat: 37, alcohol: 29, fibre: 8 };
// Energy in 100 g, kcal: USDA FoodData Central (2019-2024 releases), to compare with what the composition table gives.
const USDA_KCAL = { oil: 884, butter: 717, almonds: 579, cheese: 403, chocolate: 535, oats: 379, white: 265, wholemeal: 252, chicken: 165, egg: 155, rice: 130, lentils: 116, potato: 87, milk: 61, apple: 52, broccoli: 35, cola: 42, tofu: 144, peanuts: 567, yogurt: 61, salmon: 206, chickpeas: 164 };
// Protein in 100 g, grams: USDA FoodData Central.
const USDA_PROTEIN = { chicken: 31, egg: 12.6, cheese: 23, milk: 3.2, lentils: 9, tofu: 15, peanuts: 25.8, almonds: 21.2, wholemeal: 12.3, rice: 2.7, salmon: 22, chickpeas: 8.9, yogurt: 3.5, oats: 13.2, white: 9 };
// Glycaemic index, mean values: Atkinson, Foster-Powell & Brand-Miller, Diabetes Care 2008, table of 62 common foods.
const GI_2008 = { glucose: 100, potato: 78, watermelon: 76, white: 75, wholemeal: 74, rice: 73, sugar: 65, cola: 59, porridge: 55, banana: 51, juice: 50, spaghetti: 49, milk: 39, apple: 36, lentils: 32, chickpeas: 28 };
// Melting points, °C: CRC Handbook of Chemistry and Physics. Hydrogens from the formulas C18H36O2 … C18H30O2.
const ACIDS = [
  { doubles: [], trans: false, name: 'stearic acid', melt: 69, hydrogens: 36, kind: 'saturated', omega: null },
  { doubles: [9], trans: false, name: 'oleic acid', melt: 13, hydrogens: 34, kind: 'monounsaturated', omega: 9 },
  { doubles: [9, 12], trans: false, name: 'linoleic acid', melt: -5, hydrogens: 32, kind: 'polyunsaturated', omega: 6 },
  { doubles: [9, 12, 15], trans: false, name: 'alpha-linolenic acid', melt: -11, hydrogens: 30, kind: 'polyunsaturated', omega: 3 },
  { doubles: [9], trans: true, name: 'elaidic acid', melt: 45, hydrogens: 34, kind: 'monounsaturated', omega: 9 },
];
// Fats that are solid or semi-solid at 20 °C, and their share of saturated fatty acids (USDA FoodData Central).
const SATURATED_SHARE = { coconut: 83, butter: 63, palm: 49, lard: 39, olive: 14, sunflower: 10, rapeseed: 7 };
const SOLID_AT_20 = ['coconut', 'butter', 'palm', 'lard'];
// The nine essential amino acids of adults (WHO/FAO/UNU 2007).
const ESSENTIAL = ['histidine', 'isoleucine', 'leucine', 'lysine', 'methionine', 'phenylalanine', 'threonine', 'tryptophan', 'valine'];
// Deficiency diseases (any nutrition textbook; WHO micronutrient pages).
const DISEASE = { 'Vitamin C': 'scurvy', 'Vitamin D': 'rickets', 'Thiamin (B1)': 'beriberi', Iodine: 'goitre', Iron: 'anaemia', 'Vitamin A': 'night blindness' };
// Label reference values, EU Regulation 1169/2011, Annex XIII.
const NRV = { c: [80, 'mg'], d: [5, 'µg'], b12: [2.5, 'µg'], folic: [200, 'µg'], a: [800, 'µg'], iron: [14, 'mg'], zinc: [10, 'mg'], iodine: [150, 'µg'], calcium: [800, 'mg'] };
// UK front-of-pack bands for foods, g per 100 g (Department of Health guidance 2013/2016): [green up to, red above].
const BANDS = { fat: [3, 17.5], saturates: [1.5, 5], sugars: [5, 22.5], salt: [0.3, 1.5] };
// Caffeine in typical servings, mg (EFSA scientific opinion on the safety of caffeine, 2015).
const CAFFEINE_MG = { filter: 90, espresso: 80, energy: 80, tea: 50, cola: 40 };
const band = (key, g) => (g <= BANDS[key][0] ? 'low' : g > BANDS[key][1] ? 'high' : 'medium');

test('the fact tables of the course agree with an independent copy', () => {
  assert.deepEqual(H.KCAL_PER_G, KCAL);
  assert.deepEqual(H.KJ_PER_G, KJ);
  assert.equal(H.KJ_PER_KCAL, 4.184);                                  // definition of the thermochemical calorie
  assert.equal(H.REFERENCE_KCAL, 2000);                                // EU 1169/2011 Annex XIII; US label
  assert.deepEqual(H.THERMIC, { fat: [0, 3], carb: [5, 10], protein: [20, 30] });   // Westerterp 2004
  assert.equal(H.SATIETY.find((r) => r.food === 'Boiled potatoes').score, 323);     // Holt et al. 1995
  assert.equal(H.SATIETY.find((r) => r.food === 'Croissant').score, 47);
  assert.equal(H.SATIETY.find((r) => r.food === 'White bread').score, 100);
  // composition: nothing adds up to more than 100 g, and the energy is close to the published figure
  for (const [id, f] of Object.entries(H.FOODS)) {
    const sum = f.water + f.carb + f.fibre + f.protein + f.fat;
    assert.ok(sum <= 100 && sum >= 94, `${id}: parts add up to ${sum} g`);
    assert.ok(USDA_KCAL[id], `${id} has a published energy to compare with`);
    const kcal = KCAL.carb * f.carb + KCAL.protein * f.protein + KCAL.fat * f.fat + KCAL.fibre * f.fibre;
    // the label factors count fibre at 2 kcal per gram and round; published figures use food-specific factors
    assert.ok(Math.abs(kcal - USDA_KCAL[id]) <= Math.max(12, 0.15 * USDA_KCAL[id]), `${id}: ${kcal} kcal against ${USDA_KCAL[id]}`);
    near(H.kcalOf(f), kcal, 1e-9, `${id} kcalOf`);
    near(energyKcal(f), kcal, 1e-9, `${id} widget energy`);
    near(H.kjOf(f), KJ.carb * f.carb + KJ.protein * f.protein + KJ.fat * f.fat + KJ.fibre * f.fibre, 1e-9, `${id} kJ`);
    near(energyKj(f), H.kjOf(f), 1e-9);
    if (USDA_PROTEIN[id] != null) assert.ok(Math.abs(f.protein - USDA_PROTEIN[id]) <= 2.5, `${id}: protein ${f.protein} g against ${USDA_PROTEIN[id]}`);
  }
  // carbohydrates
  for (const [id, gi] of Object.entries(GI_2008)) assert.equal(H.GI[id].gi, gi, `GI of ${id}`);
  assert.equal(Object.keys(H.GI).length, Object.keys(GI_2008).length);
  assert.deepEqual(H.GI_BANDS, { lowMax: 55, highMin: 70 });           // ISO 26642:2010
  assert.deepEqual(H.FREE_SUGARS, { strongPct: 10, conditionalPct: 5 });   // WHO sugars guideline 2015
  assert.equal(H.COLA_SUGAR_PER_100ML, 10.6);
  assert.equal(H.GI.cola.carbs, Math.round(10.6 * 3.3));
  assert.deepEqual(H.FIBRE, { who: 25, efsa: 25, uk: 30, usPer1000kcal: 14 });   // WHO 2023, EFSA 2010, SACN 2015, DGA 2020
  // fats
  for (const a of ACIDS) {
    const mine = Object.values(H.FATTY_ACIDS).find((f) => f.name === a.name);
    assert.ok(mine, a.name);
    assert.deepEqual([mine.doubles, mine.trans, mine.melt, mine.omega], [a.doubles, a.trans, a.melt, a.omega], a.name);
    const d = describeAcid(a.doubles, a.trans);
    assert.deepEqual([d.name, d.melt, d.hydrogens, d.kind, d.omega, d.count], [a.name, a.melt, a.hydrogens, a.kind, a.omega, a.doubles.length], `widget: ${a.name}`);
    assert.equal(d.solid, a.melt > 20);
    assert.equal(d.kinks, a.trans ? 0 : a.doubles.length);
  }
  for (const f of H.FAT_PROFILES) {
    assert.equal(f.sat, SATURATED_SHARE[f.id], `${f.id} saturated share`);
    assert.equal(f.solid, SOLID_AT_20.includes(f.id), `${f.id} solid at 20 °C`);
    assert.ok(f.sat + f.mono + f.poly <= 100 && f.sat + f.mono + f.poly >= 90, f.id);
  }
  assert.deepEqual(H.FAT_LIMITS, { totalPct: 30, saturatedPct: 10, transPct: 1 });   // WHO fat guidelines 2023
  assert.deepEqual(H.SWAPS.map((s) => s.change), [-25, -15, -9, 0]);                 // Li et al., JACC 2015
  assert.equal(H.COCHRANE_SATFAT.year, 2020);                                        // Hooper et al., Cochrane 2020
  assert.ok(H.COCHRANE_SATFAT.events >= 17 && H.COCHRANE_SATFAT.events <= 21);
  // protein
  assert.deepEqual(H.ESSENTIAL_AMINO_ACIDS.slice().sort(), ESSENTIAL);
  assert.equal(H.AMINO_ACIDS_TOTAL, 20);
  assert.deepEqual(H.PROTEIN_REF, { rda: 0.8, who: 0.83, olderLow: 1.0, olderHigh: 1.2, athleteLow: 1.2, athleteHigh: 2.0, dga2026Low: 1.2, dga2026High: 1.6 });   // IOM 2005; WHO 2007 / EFSA 2012; PROT-AGE 2013; ACSM 2016; DGA 2025-2030
  assert.deepEqual(H.PROTEIN_INTAKE_US, { men: 99, women: 67 });                     // NHANES 2007-2010
  // vitamins and minerals
  assert.deepEqual(H.VITAMINS.fat, ['A', 'D', 'E', 'K']);
  assert.equal(H.VITAMINS.fat.length + H.VITAMINS.water.length, 13);
  for (const row of H.DEFICIENCY) assert.equal(row.disease, DISEASE[row.nutrient], row.nutrient);
  assert.deepEqual(H.VITAMIN_HISTORY.map((e) => [e.id, e.year]), [['lind', 1747], ['eijkman', 1897], ['funk', 1912], ['salt', 1922], ['folic', 1998]]);
  assert.deepEqual(H.ANAEMIA, { womenPct: 31, childrenPct: 40 });                    // WHO Global Health Observatory 2025: 30.7% and 39.8%
  assert.equal(H.FOLIC_ACID_UG, 400);                                                // WHO; NHS; CDC
  for (const [key, [amount, unit]] of Object.entries(NRV)) assert.deepEqual([H.NRV[key].amount, H.NRV[key].unit], [amount, unit], `NRV ${key}`);
  assert.equal(H.VITAMIN_A.upperUg, 3000);                                           // IOM 2001; EFSA
  assert.deepEqual(H.VITAMIN_C_COLDS, { trials: 29, people: 11306, shorterAdultsPct: 8, shorterChildrenPct: 14 });   // Cochrane 2013
  // water and salt
  assert.deepEqual(H.WATER.efsa, { women: 2.0, men: 2.5 });                          // EFSA 2010
  assert.deepEqual(H.WATER.us, { women: 2.7, men: 3.7 });                            // IOM 2004
  const total = (rows) => rows.reduce((t, r) => t + r.mL, 0);
  assert.equal(total(H.WATER_BALANCE.in), 2500);
  assert.equal(total(H.WATER_BALANCE.out), 2500);
  assert.deepEqual(H.SALT, { whoMaxG: 5, sodiumMaxG: 2, worldAverageG: 10.8, sodiumToSalt: 2.5 });   // WHO 2012, 2023
  near(H.SALT.sodiumMaxG * H.SALT.sodiumToSalt, H.SALT.whoMaxG);
  near((22.99 + 35.45) / 22.99, 2.5, 0.05, 'salt is 2.5 times its sodium by weight');
  assert.equal(H.POTASSIUM_MIN_MG, 3510);                                            // WHO 2012
  assert.deepEqual(H.SODIUM_SOURCES.map((s) => s.pct), [71, 14, 6, 5]);              // Harnack et al., Circulation 2017
  assert.deepEqual(H.CAFFEINE, { adultDayMg: 400, singleMg: 200, pregnancyDayMg: 200 });   // EFSA 2015
  for (const d of H.CAFFEINE_DRINKS) assert.equal(d.mg, CAFFEINE_MG[d.id], d.id);
  // eating well
  for (const [key, [low, high]] of Object.entries(BANDS)) assert.deepEqual([H.TRAFFIC[key].low, H.TRAFFIC[key].high], [low, high], key);
  for (const key of Object.keys(BANDS)) for (const g of [0, 0.3, 0.31, 1.5, 1.51, 3, 5, 5.01, 17.5, 17.6, 22.5, 22.6, 40]) {
    assert.equal(H.trafficBand(key, g), band(key, g), `${key} ${g}`);
    assert.equal(lightBand(key, g), band(key, g), `widget ${key} ${g}`);
  }
  assert.deepEqual(H.PLATE, { veg: 4, grain: 2, protein: 2 });                       // Canada's Food Guide 2019; Harvard Healthy Eating Plate 2011
  assert.deepEqual(H.NOVA_TRIAL, { people: 20, weeks: 2, extraKcal: 500, year: 2019 });   // Hall et al., Cell Metabolism 2019 (508 kcal)
  assert.deepEqual(H.PROCESSED_MEAT, { relativePct: 18, per1000Low: 56, per1000High: 66 });   // IARC 2015; Cancer Research UK
  // sample labels are possible foods: parts within the whole, "of which" lines within their parents
  for (const [id, p] of Object.entries(H.LABELS)) {
    assert.ok(p.fat + p.carb + p.fibre + p.protein + p.salt <= 100, `${id} adds up`);
    assert.ok(p.saturates <= p.fat && p.sugars <= p.carb, `${id}: of-which lines`);
    assert.equal(labelKcal(p), Math.round(9 * p.fat + 4 * p.carb + 4 * p.protein + 2 * p.fibre));
    assert.equal(labelKj(p), Math.round(37 * p.fat + 17 * p.carb + 17 * p.protein + 8 * p.fibre));
    assert.ok(Math.abs(labelKj(p) / labelKcal(p) - 4.184) < 0.12, `${id}: kJ and kcal agree`);
    assert.ok(p.ingredients.length >= 5);
  }
  assert.equal(perServing(22, 45), 9.9);
  assert.equal(fraction(4, 8), '1/2');
  assert.equal(fraction(2, 8), '1/4');
  assert.equal(fraction(3, 8), '3/8');
  // serving tables are consistent with the composition table
  const per = { chicken: ['chicken', 120], salmon: ['salmon', 120], lentils: ['lentils', 200], tofu: ['tofu', 150], yogurt: ['yogurt', 150], milk: ['milk', 250], cheese: ['cheese', 30], peanuts: ['peanuts', 30], chickpeas: ['chickpeas', 150], rice: ['rice', 180], oats: ['oats', 40], bread: ['wholemeal', 70], eggs: ['egg', 100] };
  for (const sv of H.PROTEIN_SERVINGS) {
    const [foodId, g] = per[sv.id];
    assert.ok(Math.abs(sv.g - (H.FOODS[foodId].protein * g) / 100) <= 1, `${sv.id}: ${sv.g} g of protein in ${g} g`);
  }
  // the model behind the glucose curves: glucose peaks 3.0 mmol/L up after 30 minutes; area in proportion to GI × carbohydrate
  near(peakRise(100, 50), 3.0);
  near(peakTime(100), 30);
  const area = (gi, carbs) => { let a = 0; for (let t = 0; t < 2000; t += 0.25) a += glucoseRise(gi, carbs, t) * 0.25; return a; };
  const ref = area(100, 50);
  for (const [gi, carbs] of [[75, 50], [32, 50], [76, 11], [59, 35]]) {
    near(area(gi, carbs) / ref, (gi * carbs) / 5000, 2e-3, `area for GI ${gi}, ${carbs} g`);
    assert.equal(glycaemicLoad(gi, carbs), Math.round((gi * carbs) / 100));
  }
  for (let gi = 21; gi <= 100; gi++) assert.ok(peakRise(gi, 50) > peakRise(gi - 1, 50) && peakTime(gi) < peakTime(gi - 1), 'a higher GI peaks higher and sooner');
});

/* ------------------------------------------------------------ whole course */

test('course shape: seven lessons of 16 to 18 steps, each with review steps, hands-on steps, generated steps and a recap', () => {
  assert.equal(course.id, 'nutrition');
  assert.deepEqual(course.requires, ['body-systems']);
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), LESSONS);
  const mine = ['food-makeup', 'glucose-curve', 'fatty-acid', 'serving-tally', 'food-label', 'plate-builder'];
  for (const [id, lesson] of Object.entries(lessons)) {
    // 11 to 14 before the "teach before you ask" revision, which added three to five teaching screens to each lesson
    assert.ok(lesson.steps.length >= 16 && lesson.steps.length <= 18, `${id}: ${lesson.steps.length} steps`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) if (s.type === 'numeric') assert.equal(typeof s.gen, 'function', `${id}/${s.id}: numeric review steps are generated`);
    const handsOn = lesson.steps.filter((s) => {
      if (s.type === 'interact') return true;
      const fig = s.figure && !Array.isArray(s.figure) ? s.figure : null;
      return !!fig && mine.includes(fig.type) && !fig.static && (fig.type !== 'food-label' || fig.mode === 'pick');
    });
    assert.ok(handsOn.length >= 3, `${id}: ${handsOn.length} hands-on steps`);
    assert.ok(lesson.steps.filter((s) => typeof s.gen === 'function').length >= 2, `${id}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${id}: no more than five choice steps`);
    assert.equal(lesson.steps[0].mode, 'predict', `${id} opens with a prediction`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: next`);
    for (let i = 2; i < lesson.steps.length; i++) assert.ok(!lesson.steps.slice(i - 2, i + 1).every((s) => s.type === 'info'), `${id}: three info steps in a row`);
    for (const s of lesson.steps) if (s.type !== 'info' && s.type !== 'reflect') assert.ok(s.gen || s.explain, `${id}/${s.id} has an explanation`);
    assert.ok(!lesson.steps.some((s) => s.type === 'order'), `${id}: an order step would need its own table and test here`);
  }
  assert.match(lessons['eating-well'].next, /Movement and Fitness/);
});

test('no learner-visible text contains undefined, NaN, an object or float noise', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        for (const text of visible(s)) {
          const where = `${id}/${step.id} seed ${k}: "${text.slice(0, 140)}"`;
          assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), where);
          assert.ok(!/\d\.\d{4,}/.test(text), `float noise in ${where}`);
          assert.ok(!/\b1 (grams|slices|servings|teaspoons|foods)\b/.test(text), `plural in ${where}`);
        }
        if (!step.gen) break;
      }
    }
  }
  for (const lesson of Object.values(lessons)) for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
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
  assert.ok(seen > 800);
});

test('numeric steps: generated, with a unit, hints, an explanation and distinct slips', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'numeric') continue;
      assert.equal(typeof step.gen, 'function', `${id}/${step.id}: numeric practice is generated`);
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(9 + k * 613), step.id);
        assert.ok(Number.isFinite(s.answer), `${id}/${step.id}`);
        if (s.tolerance == null) assert.ok(Math.abs(s.answer * 1000 - Math.round(s.answer * 1000)) < 1e-6, `${id}/${step.id}: ${s.answer} can be typed exactly`);
        else {
          assert.match(flat(s.text), /round to the nearest gram/i, `${id}/${step.id}: a tolerance needs a rounding instruction`);
          for (const [slip] of s.wrong) assert.ok(Math.abs(slip - s.answer) > 2 * s.tolerance, `${id}/${step.id}: slip ${slip} is too close to the answer ${s.answer}`);
        }
        assert.ok(s.unit, `${id}/${step.id} shows its unit`);
        assert.ok(s.explain && s.hints.length >= 1, `${id}/${step.id} has hints and an explanation`);
        const values = [s.answer, ...s.wrong.map((w) => w[0])];
        assert.equal(new Set(values.map((v) => Math.round(v * 1e6))).size, values.length, `${id}/${step.id}: answer and slips ${values.join(', ')} are all different`);
      }
    }
  }
});

/* ---------------------------------------------------------------- lesson 1 */

test('lesson 1: the energy in 100 g, from the grams on the label', () => {
  const n = eachVariant('energy-balance', 'label-energy', (step) => {
    const text = flat(step.text);
    const c = Number(grab(/\*\*(\d+) g of carbohydrate\*\*/, text)[0]);
    const p = Number(grab(/\*\*(\d+) g of protein\*\*/, text)[0]);
    const f = Number(grab(/\*\*(\d+) g of fat\*\*/, text)[0]);
    assert.ok(c + p + f < 100, 'the grams fit into 100 g');
    assert.match(text, /Use 4, 4 and 9 kcal per gram/);
    const kcal = KCAL.carb * c + KCAL.protein * p + KCAL.fat * f;
    assert.equal(step.answer, kcal);
    near(energyKcal({ carb: c, protein: p, fat: f }), kcal);
    assert.equal(step.unit, 'kcal');
    assert.deepEqual(step.wrong.map((w) => w[0]), [4 * (c + p + f), c + p + f, 9 * (c + p + f)]);
    assert.ok(step.hints[1].includes(`${4 * c} + ${4 * p} + ${9 * f}`));
    assert.ok(step.explain.includes(`${c} × 4 = ${4 * c}`) && step.explain.includes(`${p} × 4 = ${4 * p}`) && step.explain.includes(`${f} × 9 = ${9 * f}`));
    assert.ok(step.explain.replace(/,/g, '').includes(`**${kcal} kcal**`));
  });
  assert.ok(n >= 100, `${n} different questions`);
});

test('lesson 1: which nutrient supplies most of the energy', () => {
  const tops = new Set();
  const n = eachVariant('energy-balance', 'top-source', (step) => {
    const text = flat(step.text);
    const g = {
      Carbohydrate: Number(grab(/\*\*(\d+) g of carbohydrate\*\*/, text)[0]),
      Protein: Number(grab(/\*\*(\d+) g of protein\*\*/, text)[0]),
      Fat: Number(grab(/\*\*(\d+) g of fat\*\*/, text)[0]),
    };
    assert.ok(g.Carbohydrate + g.Protein + g.Fat <= 100);
    const e = { Carbohydrate: 4 * g.Carbohydrate, Protein: 4 * g.Protein, Fat: 9 * g.Fat };
    const order = Object.keys(e).sort((a, b) => e[b] - e[a]);
    assert.ok(e[order[0]] - e[order[1]] >= 30, 'a clear winner');
    assert.equal(correctText(step), order[0]);
    tops.add(order[0]);
    assert.deepEqual(step.options.map((o) => o.text), ['Carbohydrate', 'Protein', 'Fat']);
    assert.equal(step.shuffle, false);
    for (const o of step.options) if (!o.correct) assert.ok(o.why.includes(`${e[o.text]} kcal`) && o.why.includes(`${e[order[0]]} kcal`), `why for ${o.text}`);
    assert.ok(step.explain.includes(`${4 * g.Carbohydrate} kcal`) && step.explain.includes(`${4 * g.Protein} kcal`) && step.explain.includes(`${9 * g.Fat} kcal`));
    assert.ok(step.explain.includes(`**${order[0].toLowerCase()}**`));
    const { top } = energyShare({ carb: g.Carbohydrate, protein: g.Protein, fat: g.Fat });
    assert.equal({ carb: 'Carbohydrate', protein: 'Protein', fat: 'Fat' }[top], order[0], 'the widget agrees');
  });
  assert.ok(tops.has('Fat') && tops.has('Carbohydrate'), 'both fat and carbohydrate can win');
  assert.ok(n >= 60, `${n} different questions`);
});

test('lesson 1: the food-makeup steps accept exactly what they ask for', () => {
  const explore = interact('energy-balance', 'explore');
  const ids = explore.widget.foods.map((f) => f.id);
  assert.equal(ids.length, 8);
  for (let k = 0; k <= 8; k++) assert.equal(passes(explore, { seenCount: k, seen: ids.slice(0, k) }), k >= 4, `${k} foods seen`);
  assert.ok(passes(explore, { seen: explore.solution.seen, seenCount: explore.solution.seen.length }));
  for (const id of explore.solution.seen) assert.ok(ids.includes(id));
  // the hook's claim: olive oil carries about 18 times the energy of apple
  const ratio = H.kcalOf(H.FOODS.oil) / H.kcalOf(H.FOODS.apple);
  assert.ok(ratio > 16 && ratio < 20, `oil / apple = ${ratio}`);

  const build = interact('energy-balance', 'build');
  let ok = 0;
  for (let carb = 0; carb <= 100; carb += 5) for (let fibre = 0; carb + fibre <= 100; fibre += 5) for (let protein = 0; carb + fibre + protein <= 100; protein += 5) for (let fat = 0; carb + fibre + protein + fat <= 100; fat += 5) {
    const grams = { water: 100 - carb - fibre - protein - fat, carb, fibre, protein, fat };
    const kcal = 4 * carb + 2 * fibre + 4 * protein + 9 * fat;
    const state = { food: null, grams, kcal, ...energyShare(grams) };
    const wanted = kcal > 0 && fat < 100 / 3 && 9 * fat > kcal / 2;
    const res = build.check(state);
    assert.equal(res === true, wanted, `carb ${carb}, fibre ${fibre}, protein ${protein}, fat ${fat}`);
    if (res !== true) {
      assert.equal(typeof res, 'string');
      if (kcal === 0) assert.match(res, /no energy/);
      else if (fat >= 100 / 3) assert.match(res, /a third of the weight or more/);
      else assert.ok(res.includes(`${state.share.fat}%`) && state.share.fat <= 50, `"${res}" is true of this food`);
    } else ok++;
  }
  assert.ok(ok > 50, `${ok} foods meet the instruction`);
  const sol = build.solution.grams;
  const solKcal = 4 * sol.carb + 2 * sol.fibre + 4 * sol.protein + 9 * sol.fat;
  assert.ok(passes(build, { grams: { ...sol }, kcal: solKcal, ...energyShare(sol) }));
  assert.equal(solKcal, 310);
  assert.ok(build.explain.includes('180 of the 310 kcal') && Math.round((180 / 310) * 100) === 58 && build.explain.includes('58%'));

  const spending = interact('energy-balance', 'spending');
  assert.ok(passes(spending, { values: spending.solution.values }));
  assert.equal(spending.solution.values[0].reduce((t, v) => t + v, 0), 100);
  refuses(spending, { values: [[30, 40, 30]] });
});

/* ---------------------------------------------------------------- lesson 2 */

test('lesson 2: how much fibre is still missing from the day', () => {
  const n = eachVariant('carbohydrates', 'fibre-day', (step) => {
    const text = flat(step.text);
    const grams = grabAll(/\((\d+) g\)/g, text).map((m) => Number(m[0]));
    assert.equal(grams.length, 3, 'three foods');
    const target = Number(grab(/WHO's (\d+) g\?/, text)[0]);
    assert.equal(target, 25);
    const sum = grams.reduce((t, v) => t + v, 0);
    assert.ok(sum < target, 'the day is short of the target');
    assert.equal(step.answer, target - sum);
    assert.deepEqual(step.wrong.map((w) => w[0]), [sum]);
    assert.ok(step.hints[0].includes(grams.join(' + ')));
    assert.ok(step.explain.includes(`${grams.join(' + ')} = ${sum} g`) && step.explain.includes(`${target} − ${sum} = **${target - sum} g**`));
    // every food named is in the table with that amount
    for (const g of grams) assert.ok(H.FIBRE_FOODS.some((f) => f.g === g && text.includes(`${f.name} (${g} g)`)));
  });
  assert.ok(n >= 60, `${n} different questions`);
});

test('lesson 2: free sugars are sorted as the WHO defines them', () => {
  // WHO 2015: added sugars, and sugars naturally present in honey, syrups, fruit juices and concentrates.
  const isFree = (text) => /stirred into|honey|juice|syrup|added to/i.test(text);
  const isIntact = (text) => /inside a (whole|raw)|whole berries|lactose/i.test(text);
  for (const it of H.FREE_SUGAR_ITEMS.free) assert.ok(isFree(it.text) && !isIntact(it.text), it.text);
  for (const it of H.FREE_SUGAR_ITEMS.intact) assert.ok(isIntact(it.text) && !isFree(it.text), it.text);
  const n = eachVariant('carbohydrates', 'free-sugars', (step) => {
    assert.deepEqual(step.buckets, ['Free sugars', 'Not free sugars']);
    assert.equal(step.items.length, 6);
    assert.equal(new Set(step.items.map((it) => it.text)).size, 6);
    for (const it of step.items) {
      assert.equal(it.bucket, isFree(it.text) ? 0 : 1, it.text);
      assert.ok(it.why.length > 20);
    }
    assert.equal(step.items.filter((it) => it.bucket === 0).length, 3);
  });
  assert.ok(n >= 100, `${n} different sets`);
});

test('lesson 2: sugar in a whole drink, from its label', () => {
  const n = eachVariant('carbohydrates', 'drink-sugar', (step) => {
    const text = flat(step.text);
    const per = Number(grab(/\*\*([\d.]+) g of sugars per 100 mL\*\*/, text)[0]);
    const vol = Number(grab(/\*\*(\d+) mL\*\*/, text)[0]);
    const exact = (per * vol) / 100;
    near(step.answer, exact, 1e-9);
    assert.equal(step.tolerance, 0.5);
    assert.ok(Math.abs(Math.round(exact) - step.answer) <= step.tolerance, 'the nearest gram is accepted');
    assert.equal(step.display, String(Math.round(exact)));
    assert.match(text, /Round to the nearest gram/);
    assert.equal(step.unit, 'g');
    near(step.wrong[0][0], per);
    near(step.wrong[1][0], per * vol);
    assert.ok(step.explain.includes(`about **${Math.round(exact)} g**`));
    assert.ok(step.explain.includes(`roughly ${Math.round(exact / 4)} level teaspoons`), 'a level teaspoon of sugar is about 4 g');
    assert.ok(step.explain.includes('about 50 g a day') && step.explain.includes('about 25 g'));
    near((2000 * 0.10) / KCAL.carb, 50); near((2000 * 0.05) / KCAL.carb, 25);
  });
  assert.ok(n >= 18, `${n} different questions`);
});

test('lesson 2: the glucose-curve steps accept exactly what they ask for', () => {
  const stateOf = (foods, shown, seen = shown) => {
    const by = Object.fromEntries(foods.map((f) => [f.id, { carbs: 50, ...f }]));
    const peak = {};
    for (const id of shown) peak[id] = Math.round((5 + peakRise(by[id].gi, by[id].carbs)) * 10) / 10;
    const sorted = shown.slice().sort((a, b) => peakRise(by[b].gi, by[b].carbs) - peakRise(by[a].gi, by[a].carbs));
    return { shown, seen, seenCount: seen.length, peak, highest: sorted[0] || null, lowest: sorted[sorted.length - 1] || null };
  };
  const explore = interact('carbohydrates', 'explore');
  const all = explore.widget.foods.map((f) => f.id);
  for (let k = 1; k <= all.length; k++) assert.equal(passes(explore, stateOf(explore.widget.foods, all.slice(0, 1), all.slice(0, k))), k >= 4);
  assert.ok(passes(explore, stateOf(explore.widget.foods, explore.solution.seen.slice(-2), explore.solution.seen)));
  for (const f of explore.widget.foods) assert.equal(f.gi, GI_2008[f.id]);
  // what the explanation says about the curves is true of the model
  const peakOf = (id) => peakRise(GI_2008[id], 50);
  assert.ok(peakOf('sugar') < peakOf('white') && peakOf('white') < peakOf('glucose'), 'table sugar peaks lower than bread');
  assert.ok(Math.abs(peakOf('wholemeal') - peakOf('white')) < 0.05, 'wholemeal behaves almost like white');

  const extremes = interact('carbohydrates', 'extremes');
  const foods = extremes.widget.foods;
  const ids = foods.map((f) => f.id);
  const byGi = ids.slice().sort((a, b) => GI_2008[b] - GI_2008[a]);
  assert.deepEqual([byGi[0], byGi[byGi.length - 1]], ['potato', 'chickpeas'], 'the extremes of the list');
  refuses(extremes, stateOf(foods, []));
  for (const a of ids) {
    refuses(extremes, stateOf(foods, [a]), `one curve: ${a}`);
    for (const b of ids) {
      if (a === b) continue;
      const state = stateOf(foods, [a, b]);
      const wanted = [a, b].includes('potato') && [a, b].includes('chickpeas');
      const res = extremes.check(state);
      assert.equal(res === true, wanted, `${a} + ${b}`);
      if (!wanted) {
        assert.equal(typeof res, 'string');
        if ([a, b].includes('potato')) assert.match(res, /Boiled potato is the highest/);
        else if ([a, b].includes('chickpeas')) assert.match(res, /Chickpeas are the lowest/);
        else assert.ok(res.includes(String(state.peak[state.highest])), 'quotes the higher peak');
      }
    }
  }
  assert.ok(passes(extremes, stateOf(foods, extremes.solution.shown)));

  // the servings picture: watermelon's GI is higher than rice's, its curve much flatter
  const servings = one('carbohydrates', 'servings');
  const fig = servings.figures[0];
  const melon = fig.foods.find((f) => f.id === 'watermelon');
  const rice = fig.foods.find((f) => f.id === 'rice');
  assert.ok(melon.gi > rice.gi && peakRise(melon.gi, melon.carbs) < peakRise(rice.gi, rice.carbs) / 3);
  assert.ok(correctText(servings).includes(`${melon.carbs} g`) && correctText(servings).includes(`${rice.carbs} g`));
  assert.ok(50 / 0.075 > 500, '50 g of carbohydrate is more than half a kilogram of watermelon');
});

/* ---------------------------------------------------------------- lesson 3 */

test('lesson 3: which of three fats is solid at room temperature', () => {
  const n = eachVariant('fats', 'solid-or-liquid', (step) => {
    const fig = step.figures[0];
    assert.equal(fig.type, 'bars');
    const names = fig.categories;
    const sat = fig.series.find((s) => s.name === 'Saturated').values;
    assert.equal(names.length, 3);
    const idOf = (name) => H.FAT_PROFILES.find((f) => f.name.replace(' (canola)', '') === name).id;
    names.forEach((name, i) => assert.equal(sat[i], SATURATED_SHARE[idOf(name)], `${name} in the chart`));
    const solid = names.filter((name) => SOLID_AT_20.includes(idOf(name)));
    assert.equal(solid.length, 1, 'exactly one of the three is solid');
    const most = names[sat.indexOf(Math.max(...sat))];
    assert.equal(most, solid[0], 'and it is the one with the most saturated fat');
    assert.equal(correctText(step).replace(' (canola)', ''), solid[0]);
    assert.deepEqual(step.options.map((o) => o.text.replace(' (canola)', '')), names);
    for (const o of step.options) if (!o.correct) assert.ok(o.why.includes(`${SATURATED_SHARE[idOf(o.text.replace(' (canola)', ''))]}%`));
    assert.ok(step.explain.includes(`${Math.max(...sat)}%`));
    assert.match(flat(step.text), /Two of these pour at room temperature \(20 °C\)\. One is solid or semi-solid/);
  });
  assert.ok(n >= 12, `${n} different questions`);
});

test('lesson 3: a portion as a percentage of the label reference for saturates', () => {
  eachVariant('fats', 'saturates-ri', (step) => {
    const text = flat(step.text);
    const ri = Number(grab(/for saturates, \*\*(\d+) g a day\*\*/, text)[0]);
    assert.equal(ri, 20, 'EU Regulation 1169/2011, Annex XIII');
    const g = Number(grab(/\*\*(\d+) g of saturates\*\*/, text)[0]);
    const portion = Number(grab(/\((\d+) g\) says/, text)[0]);
    assert.ok(g < portion, 'the saturates fit into the portion');
    near(step.answer, (g / ri) * 100, 1e-9);
    assert.equal(step.unit, '%');
    assert.deepEqual(step.wrong.map((w) => w[0]), [g, ri - g]);
    assert.ok(step.explain.includes(`**${(g / ri) * 100}%**`.replace('.0000000000000', '')) || step.explain.includes(`**${Math.round((g / ri) * 100)}%**`));
    assert.ok(step.hints[1].includes('5%'));
  });
});

test('lesson 3: the fatty-acid steps accept exactly what they ask for', () => {
  const subsets = [[], [9], [12], [15], [9, 12], [9, 15], [12, 15], [9, 12, 15]];
  const explore = interact('fats', 'explore');
  for (let tried = 1; tried <= 8; tried++) assert.equal(passes(explore, { ...describeAcid([9]), tried }), tried >= 3);
  assert.ok(passes(explore, { ...describeAcid(explore.solution.doubles), tried: explore.solution.tried }));
  assert.ok(explore.explain.includes('69 °C') && explore.explain.includes('13 °C') && explore.explain.includes('−5 °C'));

  const omega = interact('fats', 'build-omega3');
  for (const d of subsets) {
    const state = describeAcid(d, false);
    const fromOmegaEnd = d.length ? 18 - Math.max(...d) : null;      // carbons counted in from the far end
    assert.equal(state.omega, fromOmegaEnd);
    const res = omega.check(state);
    assert.equal(res === true, fromOmegaEnd === 3, `double bonds at ${d.join(', ') || 'none'}`);
    if (res !== true) assert.ok(d.length ? res.includes(`omega-${fromOmegaEnd}`) : /saturated/.test(res), res);
  }
  assert.ok(passes(omega, describeAcid(omega.solution.doubles)));
  assert.equal(describeAcid(omega.solution.doubles).name, 'alpha-linolenic acid');

  const trans = interact('fats', 'trans');
  assert.deepEqual(trans.widget.sites, [9]);
  for (const d of [[], [9]]) for (const t of [false, true]) {
    const state = describeAcid(d, t);
    assert.equal(passes(trans, state), d.length === 1 && t, `${d.join(',')} trans ${t}`);
  }
  assert.ok(passes(trans, describeAcid(trans.solution.doubles, trans.solution.trans)));
  assert.equal(describeAcid([9], true).name, 'elaidic acid');
  assert.ok(trans.explain.includes('13 °C') && trans.explain.includes('45 °C'));

  const swap = interact('fats', 'swap');
  assert.deepEqual(swap.solution.values, [[75, 85, 91, 100]]);
  assert.ok(passes(swap, { values: swap.solution.values }));
  for (const row of [['polyunsaturated fat', '25% lower'], ['monounsaturated fat', '15% lower'], ['whole grains', '9% lower'], ['refined starch and sugar', 'no change']]) {
    assert.match(flat(swap.explain), new RegExp(`\\| ${row[0]} \\| ${row[1]} \\|`));
  }
  // the sort at the end agrees with the table of fats
  const sort = one('fats', 'sort-fats');
  const bucketOf = Object.fromEntries(sort.items.map((it) => [it.text, it.bucket]));
  assert.deepEqual([bucketOf.Butter, bucketOf['Coconut oil'], bucketOf['Palm oil'], bucketOf['Olive oil'], bucketOf['Sunflower oil']], [0, 0, 0, 1, 1]);
  for (const [name, id] of [['Butter', 'butter'], ['Coconut oil', 'coconut'], ['Olive oil', 'olive'], ['Sunflower oil', 'sunflower']]) {
    const f = H.FAT_PROFILES.find((p) => p.id === id);
    assert.equal(bucketOf[name], f.sat > f.mono + f.poly ? 0 : 1, name);
  }
});

/* ---------------------------------------------------------------- lesson 4 */

test('lesson 4: the reference intake for an example person', () => {
  const weights = new Set();
  eachVariant('protein', 'reference-intake', (step) => {
    const text = flat(step.text);
    const kg = Number(grab(/weighs \*\*(\d+) kg\*\*/, text)[0]);
    const per = Number(grab(/\*\*([\d.]+) g of protein per kilogram of body weight a day\*\*/, text)[0]);
    assert.equal(per, 0.8);
    weights.add(kg);
    near(step.answer, kg * per, 1e-9);
    assert.ok(Number.isInteger(step.answer), 'a whole number of grams');
    assert.deepEqual(step.wrong.map((w) => w[0]), [kg, Math.round((kg / 0.8) * 100) / 100, kg * 8]);
    assert.ok(step.explain.includes(`${kg} × 0.8 = **${step.answer} g a day**`));
    assert.ok(!/\byour\b/i.test(text), 'about a named example person');
  });
  assert.ok(weights.size >= 8 && Math.min(...weights) >= 45 && Math.max(...weights) <= 100);
});

test('lesson 4: how far a day of ordinary servings is above the reference', () => {
  const n = eachVariant('protein', 'above-reference', (step) => {
    const text = flat(step.text);
    const kg = Number(grab(/weighs (\d+) kg/, text)[0]);
    const ref = Number(grab(/= \*\*([\d.]+) g\*\* of protein a day/, text)[0]);
    near(ref, kg * 0.8, 1e-9, 'the reference stated in the question');
    const grams = grabAll(/\((\d+) g\)/g, text).map((m) => Number(m[0]));
    assert.equal(grams.length, 4, `four servings in: ${text}`);
    const sum = grams.reduce((t, v) => t + v, 0);
    assert.ok(sum > ref);
    near(step.answer, sum - ref, 1e-9);
    assert.deepEqual(step.wrong.map((w) => w[0]), [sum]);
    assert.ok(step.explain.includes(`${grams.join(' + ')} = ${sum} g`) && step.explain.includes(`${sum} − ${ref} = **${sum - ref} g**`));
    for (const g of grams) assert.ok(H.PROTEIN_SERVINGS.some((sv) => sv.g === g && text.includes(`${sv.name.replace(/ \(.*\)$/, '')} (${g} g)`)), `${g} g belongs to a serving named in the text`);
  });
  assert.ok(n >= 150, `${n} different questions`);
});

test('lesson 4: the protein steps accept exactly what they ask for', () => {
  const hook = interact('protein', 'hook');
  assert.deepEqual(hook.widget.series[0].values, [0.8 * 75, 0.8 * 60]);
  assert.ok(passes(hook, { values: hook.solution.values }));
  assert.ok(Math.abs(hook.solution.values[1][0] - 99) <= 2 && Math.abs(hook.solution.values[1][1] - 67) <= 2);

  const explore = interact('protein', 'explore');
  const plant = { lentils: true, tofu: true, peanuts: true, almonds: true, wholemeal: true, rice: true, chicken: false, egg: false, cheese: false, milk: false };
  const egg = explore.widget.foods.find((f) => f.id === 'egg').protein;
  const accepted = [];
  for (const f of explore.widget.foods) {
    assert.ok(f.id in plant, `${f.id} is classed as plant or animal here`);
    const grams = { carb: f.carb, fibre: f.fibre, protein: f.protein, fat: f.fat, water: f.water };
    const res = explore.check({ food: f.id, grams });
    const wanted = plant[f.id] && f.protein > egg;
    assert.equal(res === true, wanted, f.id);
    if (wanted) accepted.push(f.id);
    else if (f.id !== 'egg') assert.ok(plant[f.id] ? res.includes(`${f.protein} g`) : /comes from an animal/.test(res), res);
  }
  assert.deepEqual(accepted.sort(), ['almonds', 'peanuts']);
  assert.ok(accepted.includes(explore.solution.food));
  refuses(explore, { food: null, grams: {} });

  const day = interact('protein', 'plant-day');
  const items = day.widget.items;
  const animal = new Set(['chicken', 'eggs', 'milk']);
  for (const it of items) {
    assert.equal(it.tag, animal.has(it.id) ? 'animal' : 'plant', it.id);
    assert.equal(it.amount, H.PROTEIN_SERVINGS.find((sv) => sv.id === it.id).g);
  }
  assert.equal(day.widget.target, 0.8 * 70);
  let ways = 0;
  for (let mask = 0; mask < 1 << items.length; mask++) {
    const picked = items.filter((_, i) => mask & (1 << i));
    const total = picked.reduce((t, it) => t + it.amount, 0);
    const fromAnimals = picked.filter((it) => it.tag === 'animal').reduce((t, it) => t + it.amount, 0);
    const state = { picked: picked.map((it) => it.id), count: picked.length, total, reached: total >= 56, byTag: { plant: total - fromAnimals, animal: fromAnimals } };
    const wanted = fromAnimals === 0 && total >= 56;
    const res = day.check(state);
    assert.equal(res === true, wanted, state.picked.join('+'));
    if (wanted) ways++;
    else if (picked.length && fromAnimals === 0) assert.ok(res.includes(`${total} g so far`) && res.includes(`${56 - total} g short`), res);
    else if (fromAnimals > 0) assert.ok(res.includes(`${fromAnimals} g of protein from animal foods`), res);
  }
  assert.ok(ways >= 10, `${ways} plant-only days reach the reference`);
  const sol = day.solution.picked.map((id) => items.find((it) => it.id === id));
  assert.ok(sol.every((it) => it.tag === 'plant'));
  assert.equal(sol.reduce((t, it) => t + it.amount, 0), 59);
  assert.ok(flat(day.explain).includes('make 59 g'));

  // where surplus nitrogen goes: the liver makes urea, the two kidneys filter it out (any physiology textbook)
  const route = interact('protein', 'nitrogen-route');
  const UREA = ['left-kidney', 'liver', 'right-kidney'];
  assert.equal(route.widget.mode, 'pickMany');
  assert.equal(route.widget.max, 3);
  const pickable = route.widget.pickable;
  for (const id of UREA) assert.ok(pickable.includes(id), `${id} can be picked`);
  assert.deepEqual(route.widget.answer.slice().sort(), UREA);
  let right = 0;
  for (let mask = 0; mask < 1 << pickable.length; mask++) {
    const picked = pickable.filter((_, i) => mask & (1 << i)).sort();
    if (picked.length > 3) continue;                    // the widget allows three at most
    const res = route.check({ picked, count: picked.length });
    const wanted = picked.join() === UREA.join();
    assert.equal(res === true, wanted, picked.join('+') || 'nothing');
    if (wanted) { right++; continue; }
    assert.equal(typeof res, 'string');
    const good = picked.filter((id) => UREA.includes(id)).length;
    const bad = picked.length - good;
    if (picked.includes('bladder')) assert.match(res, /bladder, which only stores urine/);
    else if (bad) assert.ok(res.startsWith(`${['None', 'One', 'Two'][good]} of those ${good === 1 ? 'is' : 'are'} right`), `"${res}" for ${picked.join('+')}`);
    else assert.ok(res.startsWith(['Nothing is chosen yet', 'One right so far', 'Two right so far'][good]), `"${res}" for ${picked.join('+')}`);
  }
  assert.equal(right, 1);
  assert.deepEqual(route.solution.picked.slice().sort(), UREA);
  assert.ok(!/liver|kidney/i.test(route.widget.alt), 'the alt text does not name the answer');
});

/* ---------------------------------------------------------------- lesson 5 */

test('lesson 5: nutrients are matched to their deficiency diseases', () => {
  const n = eachVariant('vitamins-minerals', 'deficiency', (step) => {
    assert.equal(step.pairs.length, 4);
    assert.equal(new Set(step.pairs.map((p) => p[0])).size, 4);
    for (const [nutrient, right] of step.pairs) {
      assert.ok(DISEASE[nutrient], nutrient);
      assert.ok(right.startsWith(`${DISEASE[nutrient]}: `), `${nutrient} goes with ${DISEASE[nutrient]}, not "${right}"`);
    }
    for (const [nutrient, disease] of Object.entries(DISEASE)) assert.ok(step.explain.includes(`**${nutrient}**: ${disease}`));
  });
  assert.ok(n >= 15, `${n} different sets`);
});

test('lesson 5: a tablet as a percentage of the label reference value', () => {
  const seen = new Set();
  const n = eachVariant('vitamins-minerals', 'nrv-percent', (step) => {
    const text = flat(step.text);
    const [name, refText, unit] = grab(/For (.+?) the reference is \*\*([\d.]+) (mg|µg)\*\*/, text);
    const [doseText, unit2] = grab(/One tablet contains \*\*([\d.,]+) (mg|µg)\*\* of/, text);
    assert.equal(unit, unit2, 'the same unit on both sides');
    const key = Object.keys(NRV).find((k) => H.NRV[k].name === name);
    assert.deepEqual([Number(refText), unit], NRV[key], `reference for ${name}`);
    const dose = number(doseText);
    seen.add(key);
    near(step.answer, (dose / Number(refText)) * 100, 1e-6);
    assert.equal(step.unit, '%');
    assert.ok(step.explain.replace(/,/g, '').includes(`**${step.answer}%**`));
    for (const [slip] of step.wrong) assert.ok(Math.abs(slip - step.answer) > 1e-6);
    if (dose > Number(refText) * 3) assert.match(step.explain, /many times the reference/);
    if (dose < Number(refText)) assert.match(step.explain, /expected to come from food/);
  });
  assert.ok(seen.size >= 6 && n >= 18, `${seen.size} nutrients, ${n} questions`);
});

test('lesson 5: the interactive steps accept exactly what they ask for', () => {
  const history = interact('vitamins-minerals', 'history');
  const events = history.widget.events;
  assert.deepEqual(events.map((e) => e.year), [1747, 1897, 1912, 1922, 1998]);
  for (let k = 0; k <= 5; k++) assert.equal(passes(history, { seenCount: k, seen: events.slice(0, k).map((e) => e.id) }), k >= 3);
  assert.equal(history.solution.seen.length, 3);
  for (const id of history.solution.seen) assert.ok(events.some((e) => e.id === id));

  const dose = interact('vitamins-minerals', 'dose');
  const expr = dose.widget.fns[0].expr;
  assert.equal(expr, '100*exp(-5*x) + 100/(1 + exp(-1.6*(x - 7.5)))');
  const risk = (x) => 100 * Math.exp(-5 * x) + 100 / (1 + Math.exp(-1.6 * (x - 7.5)));
  const { min, max, step: st } = dose.widget.params.a;
  const okAt = [];
  for (let a = min; a <= max + 1e-9; a += st) {
    const res = dose.check({ a });
    assert.equal(res === true, risk(a) < 2, `intake ${a}: chance of harm ${risk(a).toFixed(2)}`);
    if (res === true) okAt.push(a);
    else assert.match(res, a < 1 ? /deficiency side/ : /excess itself/);
  }
  assert.deepEqual([okAt[0], okAt[okAt.length - 1]], [1, 5], 'the flat floor runs from the recommended amount to five times it');
  assert.equal(okAt.length, (5 - 1) / st + 1, 'and has no gaps');
  assert.ok(passes(dose, dose.solution));
  assert.ok(risk(0) > 99 && risk(10) > 95, 'both ends are harmful');
  // the vitamin A example: an upper level about four times the reference
  assert.ok(3000 / 800 > 3.3 && 3000 / 700 < 4.4);

  const world = interact('vitamins-minerals', 'world');
  assert.deepEqual(world.solution.values, [[31, 40]]);
  assert.ok(passes(world, { values: world.solution.values }));

  const pack = interact('vitamins-minerals', 'salt-pack');
  const spots = pack.widget.hotspots.map((h) => h.id);
  assert.deepEqual(spots.slice().sort(), ['brand', 'fluorid', 'jod', 'mountain']);
  for (const id of spots) {
    const res = pack.check({ picked: id });
    assert.equal(res === true, id === 'jod', id);
    if (id !== 'jod') assert.equal(typeof res, 'string', `${id} gets its own feedback`);
  }
  refuses(pack, { picked: null });
  assert.equal(pack.solution.picked, 'jod');
  for (const h of pack.widget.hotspots) assert.ok(h.r >= 0.05 && h.x > 0 && h.x < 1 && h.y > 0 && h.y < 1 && h.alt && h.label);
  assert.ok(!/iod|jod/i.test(pack.widget.alt), 'the alt text does not give the answer away');
});

/* ---------------------------------------------------------------- lesson 6 */

test('lesson 6: sodium on a label, converted to salt', () => {
  const n = eachVariant('water-salt', 'sodium-salt', (step) => {
    const text = flat(step.text);
    assert.match(text, /salt = sodium × 2\.5/);
    const mg = number(grab(/\*\*([\d,]+) mg of sodium\*\*/, text)[0]);
    const salt = (mg / 1000) * ((22.99 + 35.45) / 22.99);            // from the atomic weights of sodium and chlorine
    near(step.answer, salt, 0.03 * salt, 'close to the chemistry');
    near(step.answer, (mg * 2.5) / 1000, 1e-9);
    assert.equal(step.unit, 'g of salt');
    assert.deepEqual(step.wrong.map((w) => w[0]), [mg / 1000, mg * 2.5, mg / 2500]);
    assert.ok(step.explain.includes(`${mg / 1000} × 2.5 = **${step.answer} g of salt**`));
    assert.ok(step.explain.includes('5 g of salt a day is the same as 2 g'));
  });
  assert.ok(n >= 8, `${n} different questions`);
});

test('lesson 6: caffeine in a day of drinks', () => {
  const n = eachVariant('water-salt', 'caffeine', (step) => {
    const text = flat(step.text);
    const [amounts] = grab(/Typical amounts: (.+?)\. Today/, text);
    const mgOf = {};
    for (const part of amounts.split('; ')) {
      const [name, mg] = grab(/^(.+), (\d+) mg$/, part);
      mgOf[name] = Number(mg);
      const row = H.CAFFEINE_DRINKS.find((d) => d.name === name);
      assert.equal(Number(mg), CAFFEINE_MG[row.id], name);
    }
    assert.equal(Object.keys(mgOf).length, 3);
    const [had] = grab(/had (.+?)\. \*\*How much caffeine/, text);
    const parts = had.split(/, | and /);
    assert.equal(parts.length, 3);
    let total = 0;
    const single = [];
    for (const part of parts) {
      const twice = part.startsWith('two ');
      // "two mugs of filter coffee (200 mL)" is the drink "a mug of filter coffee (200 mL)", twice
      const name = Object.keys(mgOf).find((nm) => (twice ? part.slice(4).replace(/^(mugs|cans|espressos)/, (m) => m.slice(0, -1)) === nm.replace(/^an? /, '') : part === nm));
      assert.ok(name, `"${part}" is one of the drinks listed`);
      total += (twice ? 2 : 1) * mgOf[name];
      single.push(mgOf[name]);
    }
    assert.equal(step.answer, total);
    assert.equal(step.unit, 'mg');
    assert.ok(step.explain.includes(`= **${total} mg**`));
    assert.ok(step.explain.includes(total > 400 ? 'above the 400 mg guide' : 'within the 400 mg guide'));
    assert.match(text, /400 mg of caffeine a day\*\* raises no safety concern \(200 mg in pregnancy\)/);
    const once = single.reduce((t, v) => t + v, 0);
    assert.deepEqual(step.wrong.map((w) => w[0]), once === total ? [] : [once]);
  });
  assert.ok(n >= 60, `${n} different questions`);
});

test('lesson 6: the interactive steps accept exactly what they ask for', () => {
  const sources = interact('water-salt', 'sources');
  assert.deepEqual(sources.solution.values, [[1.5, 0.7, 0.3]]);
  assert.ok(passes(sources, { values: sources.solution.values }));
  near(sources.solution.values[0].reduce((t, v) => t + v, 0), 2.5);

  const pressure = interact('water-salt', 'pressure');
  const { min, max, step: st } = pressure.widget.params.s;
  // slopes from the pooled trials (He, Li & MacGregor 2013): 5.39 and 2.42 mmHg for 4.4 g of salt
  const high = (s) => (5.39 / 4.4) * (s - 11);
  const others = (s) => (2.42 / 4.4) * (s - 11);
  assert.deepEqual(pressure.widget.fns.map((f) => f.expr), ['1.2*(x - 11)', '0.55*(x - 11)']);
  near(5.39 / 4.4, 1.2, 0.03); near(2.42 / 4.4, 0.55, 0.01);
  for (let s = min; s <= max + 1e-9; s += st) {
    const res = pressure.check({ s });
    assert.equal(res === true, s === 5, `salt ${s} g`);
    if (res !== true) assert.match(res, s > 5 ? /limit is lower/ : /below the WHO's limit/);
  }
  assert.ok(passes(pressure, pressure.solution));
  assert.ok(Math.round(-high(5)) === 7 && Math.round(-others(5)) === 3, 'the falls quoted in the explanation');
  assert.match(flat(pressure.explain), /about \*\*7 mmHg\*\* in people with high blood pressure and about \*\*3 mmHg\*\* in everyone else/);

  const saltSources = interact('water-salt', 'salt-sources');
  assert.deepEqual(saltSources.solution.values, [[71, 14, 6, 5]]);
  assert.ok(passes(saltSources, { values: saltSources.solution.values }));
  refuses(saltSources, { values: [[25, 25, 25, 25]] });

  const day = interact('water-salt', 'salt-day');
  const items = day.widget.items;
  const text = flat(day.text);
  // the six foods the text names in bold, found among the items by that word
  const named = grabAll(/\*\*(\w+)\*\*/g, text).map((m) => m[0]).filter((w) => !/Tap|those|six|foods/.test(w));
  assert.deepEqual(named, ['bread', 'ham', 'cheese', 'soup', 'pizza', 'crisps']);
  const wanted = named.map((word) => { const hit = items.filter((it) => it.name.includes(word === 'cheese' ? 'cheddar' : word)); assert.equal(hit.length, 1, word); return hit[0].id; });
  for (let mask = 0; mask < 1 << items.length; mask++) {
    const picked = items.filter((_, i) => mask & (1 << i)).map((it) => it.id);
    const same = picked.length === wanted.length && wanted.every((id) => picked.includes(id));
    const res = day.check({ picked, count: picked.length });
    assert.equal(res === true, same, picked.join('+'));
    if (!same) {
      const extra = picked.filter((id) => !wanted.includes(id));
      const missing = wanted.filter((id) => !picked.includes(id));
      if (extra.length) assert.ok(res.includes(items.find((it) => it.id === extra[0]).name) && /did not eat/.test(res), res);
      else assert.ok(res.includes(items.find((it) => it.id === missing[0]).name), res);
    }
  }
  const total = wanted.reduce((t, id) => t + items.find((it) => it.id === id).amount, 0);
  near(total, 7.0, 1e-9);
  assert.ok(flat(day.explain).startsWith('**7 g** of salt') && total > 5);
  assert.deepEqual(day.solution.picked.slice().sort(), wanted.slice().sort());
  assert.equal(day.widget.target, 5);
});

/* ---------------------------------------------------------------- lesson 7 */

test('lesson 7: two per-serving labels compared gram for gram', () => {
  const words = { sugars: 'sugars', fibre: 'fibre', fat: 'fat', protein: 'protein' };
  const pairs = new Set();
  const n = eachVariant('eating-well', 'fair-compare', (step) => {
    const text = flat(step.text);
    const [word] = grab(/which of these two has more (\w+)\?/, text);
    const key = Object.keys(words).find((k) => words[k] === word);
    assert.ok(key, word);
    assert.equal(step.figures.length, 2);
    const shown = step.figures.map((fig) => {
      assert.equal(fig.type, 'food-label');
      assert.deepEqual(fig.columns, ['serving'], 'only the per-serving column is printed');
      assert.ok(fig.rows.includes(key), `the ${word} line is on the label`);
      const perPack = Math.round(((fig.product[key] * fig.product.serving) / 100) * 10) / 10;      // what the label prints
      assert.ok(perPack >= 1);
      assert.ok(fig.alt.includes(`${word} ${perPack} g`) || fig.alt.includes(`${word} ${String(perPack).replace(/\.0$/, '')} g`), `alt text gives the ${word}`);
      return { name: fig.product.name, serving: fig.product.serving, perPack, per100: (perPack / fig.product.serving) * 100 };
    });
    pairs.add(`${key}:${shown.map((s) => s.name).sort().join('|')}`);
    const more = shown[0].per100 > shown[1].per100 ? 0 : 1;
    assert.ok(shown[more].per100 > shown[1 - more].per100 * 1.2, 'a clear difference gram for gram');
    assert.ok(shown[more].perPack < shown[1 - more].perPack, 'the product with more per 100 g has less per serving: the instructive case');
    assert.equal(correctText(step), shown[more].name);
    assert.deepEqual(step.options.map((o) => o.text), shown.map((s) => s.name));
    const wrong = step.options.find((o) => !o.correct);
    assert.ok(wrong.why.includes(`${shown[1 - more].serving} g against ${shown[more].serving} g`));
    assert.ok(step.explain.includes(`**${shown[more].name}**`));
    for (const s of shown) assert.ok(step.explain.includes(`${s.name}: ${H.dp1(s.perPack)} g in a ${s.serving} g serving`));
  });
  assert.ok(pairs.size >= 8 && n >= 8, `${pairs.size} different pairs`);
});

test('lesson 7: the traffic-light colour of a nutrient', () => {
  const colours = new Set();
  const n = eachVariant('eating-well', 'traffic', (step) => {
    const text = flat(step.text);
    const [word, low, high] = grab(/mark (\w+) as \*\*green \(low\)\*\* at ([\d.]+) g or less per 100 g, and \*\*red \(high\)\*\* above ([\d.]+) g/, text);
    assert.deepEqual([Number(low), Number(high)], BANDS[word], `the bands quoted for ${word}`);
    const fig = step.figures[0];
    assert.deepEqual(fig.columns, ['100']);
    assert.ok(fig.rows.includes(word));
    const g = fig.product[word];
    const colour = g <= Number(low) ? 'Green (low)' : g > Number(high) ? 'Red (high)' : 'Amber (medium)';
    colours.add(colour);
    assert.equal(correctText(step), colour, `${fig.product.name}: ${g} g of ${word}`);
    assert.deepEqual(step.options.map((o) => o.text), ['Green (low)', 'Amber (medium)', 'Red (high)']);
    assert.ok(step.explain.includes(`${H.dp1(g)} g of ${word} per 100 g`) && step.explain.includes(`**${colour.toLowerCase()}**`));
    for (const o of step.options) if (!o.correct) assert.ok(o.why.includes(`This product has ${H.dp1(g)} g`));
    assert.ok(fig.alt.includes(`${H.dp1(g)} g`));
  });
  assert.equal(colours.size, 3, 'all three colours occur');
  assert.ok(n >= 25, `${n} different questions`);
});

test('lesson 7: the interactive steps accept exactly what they ask for', () => {
  const plate = interact('eating-well', 'plate');
  assert.equal(plate.widget.slices, 8);
  let accepted = 0;
  for (let veg = 0; veg <= 8; veg++) for (let grain = 0; veg + grain <= 8; grain++) for (let protein = 0; veg + grain + protein <= 8; protein++) {
    const ok = passes(plate, { parts: { veg, grain, protein }, filled: veg + grain + protein, empty: 8 - veg - grain - protein });
    // half vegetables and fruit, a quarter whole grains, a quarter protein foods
    assert.equal(ok, veg / 8 === 1 / 2 && grain / 8 === 1 / 4 && protein / 8 === 1 / 4, `${veg}/${grain}/${protein}`);
    if (ok) accepted++;
  }
  assert.equal(accepted, 1);
  assert.ok(passes(plate, { parts: plate.solution.parts }));
  assert.match(flat(plate.explain), /\*\*Half\*\* vegetables and fruit, a \*\*quarter\*\* whole grains, a \*\*quarter\*\* protein foods/);

  const meal = interact('eating-well', 'set-meal');
  for (const h of meal.widget.hotspots) {
    const res = meal.check({ picked: h.id });
    assert.equal(res === true, h.id === 'fish', h.id);
    if (h.id !== 'fish') assert.ok(typeof res === 'string' && res.length > 30, `${h.id} gets its own feedback`);
    assert.ok(h.r >= 0.05 && h.alt && h.label);
  }
  refuses(meal, { picked: null });
  assert.equal(meal.solution.picked, 'fish');
  assert.ok(!/salmon|tuna|omega/i.test(meal.widget.alt), 'the alt text does not give the answer away');

  const ingredients = interact('eating-well', 'ingredients');
  const list = ingredients.widget.product.ingredients;
  assert.equal(list[0], 'glucose syrup');
  const shares = list.map((x) => { const m = /\((\d+)%\)/.exec(x); return m ? Number(m[1]) : null; });
  for (let i = 1; i < list.length; i++) for (let j = 0; j < i; j++) if (shares[i] != null && shares[j] != null) assert.ok(shares[j] >= shares[i], 'the percentages printed fall along the list');
  list.forEach((_, i) => {
    const res = ingredients.check({ picked: `ingredient:${i}`, kind: 'ingredient', index: i });
    assert.equal(res === true, i === 0, `ingredient ${i + 1}`);
    if (i !== 0) assert.ok(res.includes(`number ${i + 1}`), res);
  });
  refuses(ingredients, { picked: null, kind: null, index: null });
  assert.equal(ingredients.solution.picked, 'ingredient:0');
  assert.ok(ingredients.explain.includes(`${ingredients.widget.product.sugars} g per 100 g`));

  const us = interact('eating-well', 'us-label');
  for (const h of us.widget.hotspots) {
    const res = us.check({ picked: h.id });
    assert.equal(res === true, h.id === 'added', h.id);
    if (h.id !== 'added') assert.ok(typeof res === 'string' && res.length > 30);
    assert.ok(h.r >= 0.05 && h.alt && h.label);
  }
  refuses(us, { picked: null });
  // what the explanation reads off the label: 10 g of added sugars is 20% of a 50 g daily value
  near((10 / 50) * 100, 20);
  assert.match(flat(us.explain), /"Includes 10 g Added Sugars", 20% of the daily value/);

  // the headline step: 66 − 56 in 1,000 is about 1 in 100
  const headline = one('eating-well', 'headline');
  const [lo, hi] = [Number(grab(/about (\d+) in 1,000 people who eat the least/, flat(headline.text))[0]), Number(grab(/about (\d+) in 1,000 of those who eat the most/, flat(headline.text))[0])];
  assert.equal(hi - lo, 10);
  assert.match(correctText(headline), /1 extra case in every 100 people/);
  assert.ok(Math.abs(hi / lo - 1.18) < 0.01, 'and that is the 18% relative rise');
  assert.match(flat(headline.explain), /66 − 56 = 10 extra cases in 1,000/);
});

/* ------------------------------------------------------- static graded steps */

test('static steps that state a fact are keyed as the fact tables say', () => {
  const fill = one('energy-balance', 'energy-per-gram');
  assert.deepEqual(fill.blanks.map((b) => Number(b.answers ? b.answers[0] : b.answer)), [KCAL.carb, KCAL.protein, KCAL.fat, 0]);
  const fig = fill.figures[0].foods[0];
  assert.ok(fill.figures[0].alt.includes(`fat ${fig.fat} g`) && fill.figures[0].alt.includes(`protein ${fig.protein} g`));

  const soluble = one('vitamins-minerals', 'soluble');
  assert.deepEqual(soluble.buckets, ['Fat-soluble (A, D, E, K)', 'Water-soluble (C and the B group)']);
  const stored = soluble.items.find((it) => /Stored in the liver/.test(it.text));
  const urine = soluble.items.find((it) => /passed out in the urine/.test(it.text));
  assert.deepEqual([stored.bucket, urine.bucket], [0, 1]);

  const who = one('vitamins-minerals', 'who-needs');
  const pairs = Object.fromEntries(who.pairs);
  assert.equal(pairs['Planning a pregnancy, and in its first 12 weeks'], 'Folic acid');     // WHO; NHS; CDC
  assert.equal(pairs['Eating no animal foods at all'], 'Vitamin B12');                       // NHS; Academy of Nutrition and Dietetics
  assert.equal(pairs['Getting very little sunlight on the skin'], 'Vitamin D');
  // the dose is stated on the teaching screen in front of the step (moved there from its explanation)
  assert.ok(one('vitamins-minerals', 'teach-who-needs').text.includes('400 µg'));

  const carriers = one('fats', 'carriers');
  const right = carriers.blanks.map((b) => (b.options ? b.options[b.answer != null ? b.answer : b.options.findIndex((o) => o.correct)] : null));
  assert.equal(carriers.blanks.length, 3);
  assert.match(carriers.template, /\*out to the body's tissues/);
  assert.match(carriers.template, /\[\[\*back to the liver/);
  assert.match(carriers.template, /\*the same substance\]\]/);
  void right;

  // Review: two groups only. Whether a weakly supported claim counts as "uncertain" or as "not supported" is a
  // judgement (WHO 2023 on sweeteners; IARC and JECFA 2023 on aspartame), so the step does not grade that line.
  const drinks = one('water-salt', 'drinks');
  assert.deepEqual(drinks.buckets, ['Strong evidence', 'Weak, mixed or no evidence']);
  const STRONG_DRINK_CLAIMS = [/^Sugary drinks raise/, /^More salt means higher blood pressure/];      // WHO 2015 (sugars), WHO 2012 / He & MacGregor 2013 (salt)
  for (const it of drinks.items) assert.equal(it.bucket, STRONG_DRINK_CLAIMS.some((re) => re.test(it.text)) ? 0 : 1, it.text);
  assert.equal(drinks.items.filter((it) => it.bucket === 0).length, 2);
  for (const it of drinks.items.filter((x) => x.bucket === 1)) assert.ok(it.why && it.why.length > 30, `${it.text}: says how weak the evidence is`);

  // Review: every food in the fat-sorting step is on the side its fatty acids put it (USDA FoodData Central:
  // butter and cheddar about 63% saturated, coconut oil 83%, palm oil 49% against 46% unsaturated; olive oil 14%,
  // walnuts 9%, salmon about 20%, sunflower oil 10%). Beef fat and lard are under 50% saturated and must not be
  // offered as "mostly saturated".
  const sortFats = one('fats', 'sort-fats');
  const SATURATED_SIDE = { Butter: 0, 'Coconut oil': 0, 'Cheddar cheese': 0, 'Palm oil': 0, 'Olive oil': 1, Walnuts: 1, Salmon: 1, 'Sunflower oil': 1 };
  assert.deepEqual(Object.fromEntries(sortFats.items.map((it) => [it.text, it.bucket])), SATURATED_SIDE);
  assert.ok(!/are mostly saturated/.test(sortFats.explain), 'lard (39%) and beef fat are solid without being mostly saturated');

  const patterns = one('eating-well', 'patterns');
  for (const it of patterns.items) {
    const plenty = /Vegetables|Beans|Whole grains|Nuts/.test(it.text);
    assert.equal(it.bucket, plenty ? 0 : 1, it.text);
  }
  // the fibre slider and its explanation
  const guess = one('carbohydrates', 'fibre-guess');
  assert.equal(guess.mode, 'predict');
  assert.ok(guess.answer >= 16 && guess.answer <= 20);
});

/* ------------------------------------------------------------------- safety */

const DISCLAIMER = '> **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.';

test('safety: the disclaimer appears once, in the first lesson, on its first or second step', () => {
  let count = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    lesson.steps.forEach((step, i) => {
      const hits = String(step.text).split('A note before we start.').length - 1;
      count += hits;
      if (hits) {
        assert.equal(id, LESSONS[0]);
        assert.ok(i <= 1, 'on the first or second step');
        assert.ok(String(step.text).split('\n').map((l) => l.trim()).includes(DISCLAIMER), 'word for word, as a quotation block');
      }
    });
  }
  assert.equal(count, 1);
});

test('safety: nothing asks for the learner\'s own data, sets targets or moralises food', () => {
  const asks = /\b(enter|type in|record|log|track) your\b|\byour (own )?(weight|height|age|bmi|waist|blood pressure|calories|intake|diet today|meals today)\b|how much do you (weigh|eat|drink)|what did you eat/i;
  const dietCulture = /\b(guilt[- ]free|clean eating|junk food|bad foods?|good foods?|cheat (day|meal)|ideal weight|target weight|goal weight|lose weight|weight[- ]loss (plan|goal|tip)|burn off|sinful|naughty|detox your|fat people|the obese|skinny)\b/i;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < 40; k++) {
        const s = resolveStep(step, makeRng(31 + k * 211), step.id);
        for (const text of visible(s)) {
          assert.ok(!asks.test(text), `${id}/${step.id} asks for personal data: "${text.slice(0, 140)}"`);
          assert.ok(!dietCulture.test(text), `${id}/${step.id} uses diet-culture wording: "${text.slice(0, 140)}"`);
        }
        // calculations are done for named example people, or for foods and labels
        if (s.type === 'numeric') assert.ok(!/\byou (ate|eat|drank|weigh)\b/i.test(flat(s.text)), `${id}/${step.id}`);
        if (!step.gen) break;
      }
      // no slider or numeric step asks for a body weight or an energy target as its answer
      if (step.type === 'slider' || step.type === 'numeric') {
        const s = resolveStep(step, makeRng(3), step.id);
        assert.ok(!/kcal a day|kg$/.test(String(s.unit || '')), `${id}/${step.id}: unit ${s.unit}`);
      }
    }
    for (const line of [...lesson.recap, lesson.next]) assert.ok(!dietCulture.test(line));
  }
});

test('safety: suicide and self-harm are not raised; steps about danger to life are sober; eating disorders come with a pointer to help', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(2), step.id);
      const all = visible(s).join(' ');
      if (/suicid|self-harm/i.test(all)) assert.equal(step.tone, 'sober', `${id}/${step.id} mentions suicide or self-harm and must be sober, with help pointers`);
      if (/\bit can kill\b|\bseizures?\b/i.test(all)) assert.equal(step.tone, 'sober', `${id}/${step.id} is about danger to life`);
      if (/call your emergency number/i.test(all)) assert.equal(step.tone, 'sober', `${id}/${step.id}`);
    }
  }
  const tooMuch = raw('water-salt', 'too-much');
  assert.equal(tooMuch.tone, 'sober');
  assert.match(flat(tooMuch.explain), /is an emergency: call your emergency number/);
  // Review: steps whose subject is people dying or being seriously harmed are sober too (sailors dying of scurvy;
  // cancer in the beta-carotene trials, a poisoned child, harm to a baby; anaemia, brain damage and blindness).
  for (const [lesson, id] of [['vitamins-minerals', 'hook'], ['vitamins-minerals', 'excess'], ['vitamins-minerals', 'world'], ['eating-well', 'table']]) {
    assert.equal(raw(lesson, id).tone, 'sober', `${lesson}/${id}`);
  }
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      const all = visible(resolveStep(step, makeRng(2), step.id)).join(' ');
      if (/\bthey die\b|\bpoison(ed)? a small child\b|eating-disorder/i.test(all)) assert.equal(step.tone, 'sober', `${id}/${step.id}`);
    }
  }
  const last = one('eating-well', 'table');
  assert.match(flat(last.text), /eating-disorder helpline/);
  assert.match(flat(last.text), /A doctor is a good first step/);
  assert.match(flat(last.text), /someone you trust/);
  assert.match(flat(last.text), /help works/);
  // The eating-disorder note gives no weights, amounts or methods: its only figures are helpline numbers, typed here
  // a second time from the reviewer's search (November 2026): Beat, UK, 0808 801 0677 (NHS service directory and
  // council directories); ANAD, US, 1 888 375 7767 (ANAD's own contact details); Butterfly, Australia,
  // 1800 33 4673 (butterfly.org.au, June 2026). NEDA's US helpline closed in 2023 and must not be listed.
  const note = flat(last.text).split(':::note')[1];
  const HELPLINES = { Beat: '0808 801 0677', ANAD: '1 888 375 7767', Butterfly: '1800 33 4673' };
  let rest = note;
  for (const [name, number] of Object.entries(HELPLINES)) {
    assert.ok(new RegExp(`${name} in [A-Za-z ]+ \\(${number}\\)`).test(note), `${name}: ${number}`);
    rest = rest.replace(number, '');
  }
  assert.ok(!/\d/.test(rest), 'no figures in the note other than the three helpline numbers');
  assert.ok(!/NEDA|kcal|kg|weight|calorie/i.test(note));
  assert.match(note, /findahelpline\.com/);
});

test('review: recent and consequential statements are worded as verified', () => {
  // US Dietary Guidelines for Americans, 2025-2030: published 7 January 2026; protein 1.2-1.6 g/kg; the 10% cap on
  // saturated fat kept; a new (inverted) pyramid graphic (HHS/USDA; AAFP summary July 2026; Harvard Nutrition Source).
  const needs = flat(one('protein', 'needs').text);
  assert.match(needs, /guidelines for 2025 to 2030 \(published in January 2026\) suggest 1\.2 to 1\.6 g per kg/);
  assert.ok(!/2026 dietary guidelines/.test(needs), 'the edition is 2025-2030, not "2026"');
  assert.match(flat(one('eating-well', 'plate').explain), /In 2026 the United States introduced a new pyramid/);
  // FDA Nutrition Facts rule: final rule May 2016, compliance from January 2020, so not "since 2016".
  const usLabel = flat(one('eating-well', 'us-label').text);
  assert.ok(!/Since 2016/.test(usLabel));
  assert.match(usLabel, /Under rules set in 2016/);
  // WHO, May 2025: "nearly 60 countries" with best-practice trans-fat policies.
  assert.match(flat(one('fats', 'trans').explain), /by 2025 about 60 countries/);
  // WHO guideline on lower-sodium salt substitutes, January 2025 (conditional recommendation, with the kidney caveat).
  const potassium = flat(one('water-salt', 'potassium').explain);
  assert.match(potassium, /In 2025 the WHO suggested such substitutes/);
  assert.match(potassium, /kidney disease.*should ask a doctor first/);
  // Cells have membranes, not walls.
  assert.ok(!/cell wall\b/.test(flat(one('energy-balance', 'three-jobs').explain)));
  // Supplements are described as what is advised for a group, with a pointer to a professional.
  // (The sentence about B12 moved to the teaching screen in front of the step; the pointer to a professional stays
  // in the explanation.)
  const who = flat(one('vitamins-minerals', 'who-needs').explain);
  const whoTaught = flat(one('vitamins-minerals', 'teach-who-needs').text);
  assert.match(whoTaught, /are advised to use fortified foods or a supplement/);
  assert.match(whoTaught, /Details differ by country and by person/);
  // Second review: the screen is where the learner first meets this advice, so it carries the pointer as well.
  assert.match(whoTaught.replace(/\s+/g, ' '), /Details differ by country and by person: a pharmacist or doctor can say what applies to you/);
  assert.match(who, /a pharmacist or doctor can say what applies to you/);
  assert.ok(!/vegans need/.test(who) && !/vegans need/.test(whoTaught));
});

test('review: the fatty-acid drawing shows as many hydrogens as the widget states', async () => {
  const src = readFileSync(new URL('../src/widgets/fatty-acid.js', import.meta.url), 'utf8');
  assert.match(src, /hAtom\(pts\[0\], 0, 1\)/, 'the hydrogen of the acid group is drawn');
  // 16 CH2 carbons (2 each) + CH3 (3) + the acid group (1) = 36 for stearic acid; two fewer for each double bond
  for (const [doubles, n] of [[[], 36], [[9], 34], [[9, 12], 32], [[9, 12, 15], 30]]) {
    const drawn = 1 + 3 + 2 * 16 - 2 * doubles.length;
    assert.equal(describeAcid(doubles).hydrogens, n);
    assert.equal(drawn, n);
  }
});

test('safety: every photo has a manifest entry with a licence and a credit, and every figure has alt text', () => {
  const manifest = JSON.parse(readFileSync(new URL('../content/media/nutrition/manifest.json', import.meta.url), 'utf8'));
  const records = Object.values(manifest.images);
  const bySrc = (src) => records.find((r) => r && typeof r === 'object' && (src.includes(`/${r.id}.jpg`) || (r.file && src.includes(r.file))));
  const used = new Set();
  let photos = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(8), step.id);
      const specs = [...s.figures, ...(s.widget ? [s.widget] : []), ...((s.options || []).map((o) => o.figure).filter(Boolean))];
      for (const spec of specs) {
        assert.ok(spec.alt && spec.alt.length > 20, `${id}/${step.id}: ${spec.type} has alt text`);
        if (spec.type !== 'photo') continue;
        photos++;
        assert.ok(spec.src.startsWith('content/media/nutrition/'), `${id}/${step.id}: a picture of this course`);
        const rec = bySrc(spec.src);
        assert.ok(rec, `${id}/${step.id}: ${spec.src} is in the manifest`);
        used.add(rec.id);
        assert.ok(rec.license && String(rec.license).length > 2, `${rec.id}: licence`);
        assert.ok(/^(Public domain|CC0|CC BY(-SA)? [234]\.\d)/.test(String(rec.license)), `${rec.id}: licence "${rec.license}" is on the allow-list`);
        assert.ok(rec.author && String(rec.author).length > 2, `${rec.id}: credit`);
        assert.ok(String(rec.sourceUrl || rec.source || '').includes('commons.wikimedia.org'), `${rec.id}: source page`);
        assert.ok(spec.credit || spec.license, `${id}/${step.id}: the credit travels with the spec`);
      }
    }
  }
  assert.ok(photos >= 3 && photos <= 12, `${photos} photographs in the course`);
  for (const rec of records) if (rec && rec.id) assert.ok(used.has(rec.id), `${rec.id} is in the manifest and used by a lesson`);
  // every body-map id used by the course exists in the widget's own tables
  let bodyMaps = 0;
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) {
    const specs = [step.widget, ...(Array.isArray(step.figure) ? step.figure : [step.figure])].filter(Boolean);
    for (const spec of specs) {
      if (spec.type !== 'body-map') continue;
      bodyMaps++;
      const ids = [spec.show, spec.hide, spec.pickable, spec.answer, spec.focus, spec.ghost, spec.labels, ...(spec.groups || []).map((g) => g.ids)].flat().filter((v) => typeof v === 'string');
      assert.ok(ids.length > 0, `${id}/${step.id}`);
      for (const part of ids) assert.ok(part in STRUCTURES || part in ALIASES || part in SYSTEMS || part === 'all', `${id}/${step.id}: "${part}" is not a body-map structure, alias or system`);
      for (const part of [spec.answer, step.solution && step.solution.picked].flat().filter(Boolean)) assert.ok(part in STRUCTURES, `${id}/${step.id}: answer "${part}" is a structure`);
    }
  }
  assert.equal(bodyMaps, 1);
});

/* ------------------------------------------------------- teach before you ask */

/** The teaching screens added so that nothing is asked before it has been shown (docs/AUTHORING.md, "Teach before you ask"), each with the first step it serves. */
const TEACHING = {
  'energy-balance': { 'teach-jobs': 'three-jobs', 'example-label': 'label-energy', 'teach-spending': 'spending', 'teach-weight': 'weight' },
  carbohydrates: { 'teach-grain': 'grain', 'teach-fibre': 'fibre-evidence', 'teach-free-sugars': 'free-sugars', 'teach-claims': 'myths' },
  fats: { 'teach-mixtures': 'solid-or-liquid', 'teach-carriers': 'carriers', 'teach-trials': 'how-sure' },
  protein: { 'teach-builds': 'builds', 'teach-complement': 'complement', 'teach-spare': 'spare' },
  'vitamins-minerals': { 'teach-deficiency': 'deficiency', 'teach-excess': 'excess', 'teach-who-needs': 'who-needs', 'teach-tested': 'multivitamin' },
  'water-salt': { 'teach-budget': 'sources', 'teach-limits': 'water-truths', 'teach-potassium': 'potassium', 'teach-sweeteners': 'drinks', 'teach-caffeine': 'caffeine' },
  'eating-well': { 'teach-patterns': 'patterns', 'teach-plate': 'plate', 'teach-per-100': 'fair-compare', 'teach-risk': 'headline', 'teach-fads': 'red-flags' },
};
const taught = (lesson, id) => flat(raw(lesson, id).text);
const position = (lesson, id) => lessons[lesson].steps.indexOf(raw(lesson, id));

test('teach before you ask: every lesson teaches before its first graded step, on at least three screens, with at most two predictions', () => {
  // `graded` is settled when a step is resolved
  const role = (step) => {
    const s = resolveStep(step, makeRng(1), step.id);
    return s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded ? 'graded' : 'explore';
  };
  assert.deepEqual(Object.keys(TEACHING), LESSONS);
  for (const [id, lesson] of Object.entries(lessons)) {
    const roles = lesson.steps.map(role);
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: a teaching screen or an exploration comes before the first graded step (${lesson.steps[firstGraded].id})`);
    // the last step of a lesson is its closing screen (or, in lesson 1, a reflection): it does not count as teaching
    assert.ok(roles.slice(0, -1).filter((r) => r === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((r) => r === 'predict').length <= 2, `${id}: at most two predictions`);
    for (const [stepId, serves] of Object.entries(TEACHING[id])) {
      const step = raw(id, stepId);
      assert.equal(step.type, 'info', `${id}/${stepId} is a teaching screen`);
      assert.ok(flat(step.text).length > 150, `${id}/${stepId} teaches something`);
      assert.ok(position(id, stepId) < position(id, serves), `${id}/${stepId} comes before ${serves}`);
      assert.equal(role(raw(id, serves)), 'graded', `${id}/${serves} is a graded check of what was taught`);
      for (const figure of [step.figure].flat().filter(Boolean)) assert.ok(figure.alt && figure.alt.length > 40, `${id}/${stepId}: the figure has alt text`);
    }
  }
  // sober where the screen itself is about serious illness or harm, and only there
  for (const [id, steps] of Object.entries(TEACHING)) {
    for (const stepId of Object.keys(steps)) assert.equal(raw(id, stepId).tone === 'sober', id === 'vitamins-minerals' && ['teach-deficiency', 'teach-excess'].includes(stepId), `${id}/${stepId}`);
  }
  // predictions that became taught-and-checked steps, and the study result that became the prediction instead
  for (const [id, stepId] of [['energy-balance', 'spending'], ['water-salt', 'sources'], ['eating-well', 'plate'], ['energy-balance', 'three-jobs']]) assert.equal(role(raw(id, stepId)), 'graded', `${id}/${stepId}`);
  assert.equal(raw('eating-well', 'upf').mode, 'predict');
  assert.equal(raw('carbohydrates', 'fibre-guess').mode, 'predict');
});

test('teach before you ask: each teaching screen holds what the questions after it need', () => {
  // lesson 1: the jobs and the terms; a worked example no generated product can repeat; the shares; the influences
  for (const word of ['Fuel', 'Building material', 'Regulators', 'carbohydrate and fat', 'protein', 'vitamins and minerals', '**macronutrients**', '**micronutrients**']) assert.ok(taught('energy-balance', 'teach-jobs').includes(word), word);
  const cheese = H.FOODS.cheese;
  const example = taught('energy-balance', 'example-label');
  assert.ok(example.includes(`${cheese.carb} × 4 = ${4 * cheese.carb} kcal`) && example.includes(`${cheese.protein} × 4 = ${4 * cheese.protein} kcal`) && example.includes(`${cheese.fat} × 9 = ${9 * cheese.fat} kcal`));
  assert.ok(example.includes(`**${KCAL.carb * cheese.carb + KCAL.protein * cheese.protein + KCAL.fat * cheese.fat} kcal**`) && cheese.fibre === 0);
  assert.equal(raw('energy-balance', 'example-label').figure.foods[0].id, 'cheese');
  for (let k = 0; k < SEEDS; k++) {
    const text = flat(resolveStep(raw('energy-balance', 'label-energy'), makeRng(11 + k * 37), 'label-energy').text);
    assert.ok(!(text.includes(`**${cheese.carb} g of carbohydrate**`) && text.includes(`**${cheese.protein} g of protein**`) && text.includes(`**${cheese.fat} g of fat**`)), 'the worked example is never the question');
  }
  assert.match(taught('energy-balance', 'teach-spending'), /Staying alive at rest.*60 to 70%.*Moving.*15 to 30%.*Digesting and processing food.*about 10%/s);
  for (const word of ['Genes', 'Hormones', 'Sleep', 'Surroundings', '40 to 70%']) assert.ok(taught('energy-balance', 'teach-weight').includes(word), word);

  // lesson 2
  assert.match(taught('carbohydrates', 'teach-grain'), /\*\*Whole grains\*\*.*keep all three parts.*\*\*Refined\*\* grains have lost the brown outer layers and the part that would sprout/s);
  // The kernel is a published diagram whose labels give only the names, so the screen says what each part is (the
  // drawing it replaced printed those notes beside the parts). The question after it shows the same picture.
  assert.match(taught('carbohydrates', 'teach-grain'), /\*\*Bran\*\*: the brown outer layers.*\*\*Endosperm\*\*: the seed's food store.*\*\*Germ\*\*: the small part at the base that would sprout/s);
  for (const id of ['teach-grain', 'grain']) {
    const fig = raw('carbohydrates', id).figure;
    assert.ok(fig.type === 'photo' && fig.src.includes('/wheat-kernel.jpg'), `carbohydrates/${id} shows the labelled kernel`);
    assert.ok(!/white flour|keeps?\b/i.test(fig.alt), `carbohydrates/${id}: the alt text describes the picture without answering the question`);
  }
  const fibre = taught('carbohydrates', 'teach-fibre');
  assert.match(fibre, /\*\*Soluble\*\* fibre.*\*\*Insoluble\*\* fibre/s);
  assert.match(fibre, /185 long-term studies and 58 trials.*\*\*15 to 30% lower\*\*.*observational, but the trials agree.*certainty as moderate/s, 'the finding keeps its strength of evidence');
  for (const bar of raw('carbohydrates', 'teach-fibre').figure.data) assert.ok(H.FIBRE_FOODS.some((f) => f.g === bar.value), `fibre chart: ${bar.label}`);
  const free = taught('carbohydrates', 'teach-free-sugars');
  // every item the generated sort can show falls under a category that the screen names
  const FREE_WORDS = [[/stirred into|added to/i, '**added**'], [/honey/i, '**honey**'], [/syrup/i, '**syrups**'], [/juice/i, '**fruit juice**']];
  const INTACT_WORDS = [[/whole (apple|banana|berries)/i, 'whole fruit'], [/raw carrot/i, 'vegetables'], [/lactose/i, 'lactose']];
  for (const [items, words] of [[H.FREE_SUGAR_ITEMS.free, FREE_WORDS], [H.FREE_SUGAR_ITEMS.intact, INTACT_WORDS]]) {
    for (const it of items) {
      const hit = words.find(([re]) => re.test(it.text));
      assert.ok(hit && free.includes(hit[1]), `"${it.text}" is covered by the teaching screen`);
    }
  }
  assert.ok(free.indexOf('**Not free:**') > free.indexOf('**fruit juice**'));
  assert.match(free, /\*\*below 10% of energy\*\*, and suggests that below 5% would be better still/);
  // Second review: the evidence on whole fruit is observational, so it is worded as a link, not as a fact about people.
  assert.match(free.replace(/\s+/g, ' '), /studies consistently link eating whole fruit to better health/);
  assert.ok(!/fruit eaters are/.test(free));
  // ... and a population recommendation is not called a "target".
  assert.ok(!/\btargets?\b/i.test(flat(one('carbohydrates', 'fibre-guess').explain)));
  for (const claim of ['Sugar makes children hyperactive', 'Carbohydrates are fattening in themselves', 'Honey and brown sugar are far better for you than white sugar']) {
    assert.ok(taught('carbohydrates', 'teach-claims').includes(claim) && raw('carbohydrates', 'myths').items.some((it) => it.text === claim && it.bucket === 1), claim);
  }
  for (let k = 0; k < SEEDS; k++) {
    const text = flat(resolveStep(raw('carbohydrates', 'drink-sugar'), makeRng(5 + k * 53), 'drink-sugar').text);
    assert.ok(text.includes('7 g per 100 mL in a 200 mL carton would be 7 × 2 = 14 g') && !/\*\*7 g of sugars/.test(text) && !/\*\*200 mL\*\*/.test(text), 'a worked line the generator cannot repeat');
  }

  // lesson 3
  const mixtures = raw('fats', 'teach-mixtures');
  for (const f of H.FAT_PROFILES) {
    const name = f.name.replace(' (canola)', '');
    assert.ok(flat(mixtures.text).includes(name.toLowerCase()), `${name} is named`);
    const bar = mixtures.figure.data.find((d) => d.label.replace('\n', ' ') === name);
    assert.equal(bar.value, SATURATED_SHARE[f.id], `${name} in the chart`);
    const where = flat(mixtures.text).indexOf(name.toLowerCase());
    assert.equal(where < flat(mixtures.text).indexOf('**pours**'), SOLID_AT_20.includes(f.id), `${name} is on the right side of "sets" and "pours"`);
  }
  assert.match(taught('fats', 'teach-carriers'), /\*\*LDL\*\* parcels carry cholesterol out from the liver.*\*\*HDL\*\* parcels collect spare cholesterol and return it to the\s+liver.*same substance in both/s);
  // Second review (November 2026): 17% (RR 0.83, 12 trials) is the pooled result of the current edition of the Cochrane
  // review (CD011737.pub3, August 2020); 21% (RR 0.79, 11 trials) was the result of the edition of May 2020 (pub2). They
  // are two editions, not an "overall" figure and a "main analysis" (cochrane.org plain-language summary; Cochrane
  // PEARLS 655, May 2020).
  const trials = taught('fats', 'teach-trials').replace(/\s+/g, ' ');
  assert.match(trials, /Cochrane review \(2020\).*fell by about 17% in the latest edition of the review, and by 21% in the edition before it.*Deaths from all causes changed little or not at all.*moderate-quality evidence/);
  assert.ok(!/main analysis/.test(trials));
  assert.deepEqual(raw('fats', 'teach-trials').figure.data.map((d) => d.value), [75, 85, 91, 100]);
  assert.match(taught('fats', 'name-it'), /oily fish such as salmon/);
  assert.match(flat(one('fats', 'eggs').text), /the liver makes most of the cholesterol in the body, and it makes less when more arrives in food/);
  for (let k = 0; k < SEEDS; k++) {
    const text = flat(resolveStep(raw('fats', 'saturates-ri'), makeRng(3 + k * 71), 'saturates-ri').text);
    assert.ok(text.includes('For example, 10 g would be 10 ÷ 20 = 0.5, which is 50%.') && !text.includes('**10 g of saturates**'));
  }

  // lesson 4
  for (const option of raw('protein', 'builds').options.filter((o) => o.correct)) {
    const word = /Muscle|enzymes|Antibodies|Haemoglobin/i.exec(option.text)[0].toLowerCase();
    assert.ok(taught('protein', 'teach-builds').includes(`**${word}**`), word);
  }
  assert.match(taught('protein', 'teach-builds'), /The energy store under the skin is not protein\. It is fat\./);
  assert.match(taught('protein', 'teach-complement'), /\*\*Grains\*\* are low in lysine; \*\*pulses\*\*.*are low in methionine.*pool of amino acids that lasts through the day/s);
  // Second review: the dashed line of the sketch is named in the key (y under 30), clear of every bar (the tallest
  // reaches y = 62); beside the line itself the words ran across the top of a bar.
  const sketch = raw('protein', 'teach-complement').figure.content;
  assert.equal(sketch, raw('protein', 'complement').figure.content, 'the question shows the sketch that was taught');
  const lineName = /<text class="fig-label-sm" x="(\d+)" y="(\d+)"[^>]*>what the body needs<\/text>/.exec(sketch);
  assert.ok(lineName && Number(lineName[2]) < 30 && Number(lineName[1]) > 250, 'the name of the dashed line is in the key');
  assert.equal(sketch.split('what the body needs').length - 1, 1);
  assert.match(taught('protein', 'teach-spare'), /\*\*no store for spare protein\*\*.*\*\*urea\*\* in the urine.*total protein eaten over the day explains the results/s);
  for (let k = 0; k < SEEDS; k++) {
    const text = flat(resolveStep(raw('protein', 'reference-intake'), makeRng(7 + k * 29), 'reference-intake').text);
    assert.ok(text.includes('62 × 0.8 = 49.6 g a day') && !text.includes('**62 kg**'));
  }
  near(62 * 0.8, 49.6);

  // lesson 5: every row of the table the matching question draws from
  for (const row of H.DEFICIENCY) assert.ok(taught('vitamins-minerals', 'teach-deficiency').includes(`**${row.nutrient}**: ${row.disease} (${row.sign})`), row.nutrient);
  assert.match(flat(one('vitamins-minerals', 'soluble').text), /absorbs and stores them along with fat.*kidneys filter out most of a surplus/s);
  const excess = taught('vitamins-minerals', 'teach-excess');
  assert.match(excess, /in smokers and other people at high risk, \*\*beta-carotene\*\* pills \(in one trial with vitamin A\) raised the rate of lung cancer, by 18% and 28%.*\*\*Iron\*\* tablets can poison a small child.*\*\*vitamin A\*\* in pregnancy.*same molecules/s);
  assert.equal(raw('vitamins-minerals', 'teach-excess').figure.fns[0].expr, raw('vitamins-minerals', 'dose').widget.fns[0].expr, 'the same curve as the one explored');
  assert.match(taught('vitamins-minerals', 'teach-tested'), /no clear protection against heart disease or cancer \(US Preventive Services Task Force, 2022\).*29 trials with more than 11,000 people.*just as many colds.*about 8% shorter in adults/s);
  for (let k = 0; k < SEEDS; k++) {
    const text = flat(resolveStep(raw('vitamins-minerals', 'nrv-percent'), makeRng(13 + k * 17), 'nrv-percent').text);
    assert.ok(text.includes('30 ÷ 20 = 1.5, which is 150%'));
  }
  assert.ok(!Object.values(H.NRV).some((r) => r.amount === 20), 'no label reference is 20, so the worked line is not a question');

  // lesson 6
  const budget = taught('water-salt', 'teach-budget');
  for (const mL of H.WATER_BALANCE.in.map((r) => r.mL)) assert.ok(budget.includes(`| ${H.grouped(mL)} |`), `${mL} mL in`);
  assert.deepEqual(raw('water-salt', 'teach-budget').figure.data.map((d) => d.value), H.WATER_BALANCE.out.map((r) => r.mL / 1000));
  assert.match(taught('water-salt', 'teach-limits'), /\*\*All drinks count\*\*.*tea,\s+coffee and soup hydrate too.*about a litre an\s+hour.*dilutes the sodium in the blood/s);
  assert.match(taught('water-salt', 'teach-potassium'), /SSaSS, 2021.*strokes fell by about 14% and deaths by about\s+12%.*kidney disease had been excluded/s);
  assert.match(taught('water-salt', 'teach-sweeteners'), /\*\*Weight: mixed\.\*\*.*low in\s+certainty.*\*\*Cancer: weak\.\*\*.*kept its daily limit unchanged/s, 'each claim about sweeteners keeps its strength of evidence');
  const chart = raw('water-salt', 'teach-caffeine').figure.data;
  assert.deepEqual(chart.map((d) => d.value), H.CAFFEINE_DRINKS.map((d) => CAFFEINE_MG[d.id]), 'every drink the generated sum can use is on the chart');
  assert.match(taught('water-salt', 'teach-caffeine'), /\*\*400 mg a day\*\*.*200 mg a day in pregnancy.*2 × 50 \+ 80 = 180 mg/s);
  for (let k = 0; k < SEEDS; k++) {
    const text = flat(resolveStep(raw('water-salt', 'sodium-salt'), makeRng(19 + k * 23), 'sodium-salt').text);
    assert.ok(text.includes('300 mg of sodium is 0.3 g, and 0.3 × 2.5 = 0.75 g of salt') && !text.includes('**300 mg of sodium**'));
  }

  // lesson 7
  const patterns = taught('eating-well', 'teach-patterns');
  for (const food of [...H.PATTERN_PLENTY, ...H.PATTERN_LITTLE]) assert.ok(patterns.includes(food), food);
  assert.ok(patterns.indexOf('**Only a little:**') > patterns.indexOf(H.PATTERN_PLENTY[H.PATTERN_PLENTY.length - 1]) && patterns.indexOf('**Only a little:**') < patterns.indexOf(H.PATTERN_LITTLE[0]));
  assert.match(patterns, /Nothing is forbidden, and no single food makes or breaks a diet/);
  assert.match(taught('eating-well', 'teach-plate'), /\*\*half\*\* vegetables and fruit.*\*\*a quarter\*\* whole grains.*maize \(corn\).*\*\*a quarter\*\* protein foods: pulses such as beans and lentils/s);
  // the sorting step after it says "Corn tortillas": the screen gives both names of the grain
  assert.ok(raw('eating-well', 'cuisines').items.some((it) => /^Corn tortillas$/.test(it.text) && it.bucket === 1));
  const per100 = raw('eating-well', 'teach-per-100');
  assert.ok(!Object.values(H.LABELS).some((p) => p.name === per100.figure.product.name), 'the worked example uses a product that no generated question shows');
  assert.equal(perServing(per100.figure.product.sugars, per100.figure.product.serving), 12);
  assert.match(flat(per100.text), /12 ÷ 40 × 100 = \*\*30 g\*\*.*9 ÷ 25 × 100 = \*\*36 g\*\*.*less sugar in a serving, but more gram for gram/s);
  near((12 / 40) * 100, 30); near((9 / 25) * 100, 36);
  const risk = raw('eating-well', 'teach-risk');
  assert.match(flat(risk.text), /invented numbers.*15 ÷ 10 = 1\.5, a rise of 50%.*15 − 10 = 5 extra cases in every 100 people/s);
  assert.deepEqual([risk.figure.type, risk.figure.n, risk.figure.base, risk.figure.rr], ['risk-array', 100, 10, 1.5]);
  for (const sign of raw('eating-well', 'red-flags').options) {
    const key = /fast, dramatic results|bans whole groups of foods for everyone|testimonials and before-and-after stories|sell the supplements or products it requires|findings are uncertain and may change|national food guides already advise/.exec(sign.text);
    assert.ok(key && taught('eating-well', 'teach-fads').includes(key[0]), sign.text);
  }
});

/* ------------------------------------------------------------------- guard */

test('every generated step and every interact step of the course is covered by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.slice().sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} is generated, but no test above re-derives it`);
    const interacts = lessons[id].steps.filter((s) => s.type === 'interact').map((s) => s.id);
    assert.deepEqual(interacts.slice().sort(), Object.keys(INTERACT[id]).sort(), `${id}: update INTERACT and add a test for any new interact step`);
    for (const stepId of interacts) {
      assert.ok(interactTested.has(`${id}/${stepId}`), `${id}/${stepId} is an interact step, but no test above checks it`);
      const step = raw(id, stepId);
      assert.equal(typeof step.check, 'function', `${id}/${stepId}`);
      assert.ok(step.solution && step.explain, `${id}/${stepId}`);
    }
  }
});
