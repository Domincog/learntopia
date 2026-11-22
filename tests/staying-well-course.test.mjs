// Independent checks of "Staying Well: Prevention and Everyday Medicine".
//
// 1. A second, separately typed table of the course's key numbers (each with its source) is compared
//    with the tables in content/courses/staying-well/helpers.js.
// 2. Every generated question is re-solved from its own wording: the numbers are parsed out of the text
//    (or out of the sample label shown beside it) and the answer is worked out again here, by counting or
//    with a different formula than the generator used.
// 3. Every interact step is fed the states its controls can reach, built here from the widgets' documented
//    rules, and must accept exactly those that satisfy the instruction.
// 4. Safety: the disclaimer, no request for the learner's own health data, tone on the sober steps,
//    body-diagram ids, picture credits.
//
//   node --test tests/staying-well-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import course from '../content/courses/staying-well/course.js';
import * as H from '../content/courses/staying-well/helpers.js';
import { structureInfo, expandIds } from '../src/widgets/body-map.js';
import { effectiveR } from '../src/widgets/outbreak-sim.js';
import { afterDose, afterGrowth } from '../src/widgets/resistance-sim.js';
import { acidDay } from '../src/widgets/acid-day.js';
import { riskCounts } from '../src/widgets/risk-array.js';

const SEEDS = 200;
const LESSONS = ['germs', 'vaccines', 'medicines', 'everyday-care', 'know-your-numbers', 'screening', 'substances', 'health-claims'];
/** Every generated step of the course. Each one is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  germs: ['which-kind', 'growth', 'doubling'],
  vaccines: ['threshold-calc', 'enough'],
  medicines: ['label-pick', 'max-day', 'next-dose', 'double-dose'],
  'everyday-care': ['uv-index', 'listen-calc'],
  'know-your-numbers': ['units', 'bmi', 'risk-meaning'],
  screening: ['ppv-count', 'lead-time'],
  substances: ['units', 'std-drinks'],
  'health-claims': ['abs-calc', 'nnt', 'spot-confounder'],
};
const tested = new Set();

const lessons = {};
const rawLessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/staying-well/lessons/${id}.js`);
  rawLessons[id] = mod.default;
  lessons[id] = normalizeLesson(mod.default, 'staying-well', id);
}
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('../content/media/staying-well/manifest.json', import.meta.url)), 'utf8'));

const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const fixed = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const number = (s) => Number(String(s).replace(/,/g, ''));
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };
const near = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol, `${msg} expected ${b}, got ${a}`);
const grouped = (v) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const figuresOf = (step) => [...(step.figures || []), ...(step.widget ? [step.widget] : []), ...((step.options || []).map((o) => o.figure).filter(Boolean))];

/** Every string a learner can see in a resolved step (drawing markup and internal ids excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['content', 'type', 'id', 'viewBox', 'color', 'expr', 'mode', 'kind', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'view', 'at', 'shape', 'size', 'labelPos']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/** Run a generated step with many seeds and hand each concrete step (and the generator's raw output) to `verify`. */
function eachVariant(lesson, id, verify, n = SEEDS) {
  const step = raw(lesson, id);
  assert.equal(typeof step.gen, 'function', `${lesson}/${id} is generated`);
  assert.ok(GENERATED[lesson].includes(id), `${lesson}/${id} is listed in GENERATED`);
  tested.add(`${lesson}/${id}`);
  const texts = new Set();
  for (let k = 0; k < n; k++) {
    const seed = 9001 + k * 7919;
    const s = resolveStep(step, makeRng(seed), id);
    const made = step.gen(makeRng(seed));
    const text = flat(s.text);
    texts.add(text);
    try {
      for (const str of visible(s)) assert.ok(!/undefined|NaN|\[object/.test(str), `stray value in: ${str}`);
      if (s.type === 'numeric') {
        // the answer and every slip the generator listed are different numbers, further apart than the tolerance allows
        const slips = (made.wrong || []).map((w) => Number(w[0]));
        const all = [s.answer, ...slips];
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
          assert.ok(Math.abs(all[i] - all[j]) > 2 * (s.tolerance || 0) + 1e-9, `answer and slips must differ: ${all.join(', ')}`);
        }
      }
      if (s.type === 'choice') {
        assert.equal(s.options.filter((o) => o.correct).length, 1, 'exactly one correct option');
        assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, 'no duplicate options');
      }
      assert.ok(s.explain.length > 20, 'has an explanation');
      verify(s, text, made);
    } catch (err) { err.message = `${lesson}/${id} (seed ${k}): ${err.message}\n  text: ${text}`; throw err; }
  }
  return texts.size;
}
const correctText = (s) => flat(s.options.find((o) => o.correct).text);

/* ------------------------------------------------------- 1. double entry */

// Typed in from the sources, independently of helpers.js.
const FACTS = {
  handwashSeconds: 20,                    // CDC, When and How to Wash Your Hands (2024)
  food: { cold: 5, hot: 60, cook: 70, hours: 2 },   // WHO, Five Keys to Safer Food
  snowYear: 1854,                         // Snow, On the Mode of Communication of Cholera (1855)
  semmelweis: { before: 11.4, after: 1.3 },   // First Clinic, 1846 and 1848 (MJA 2018)
  jenner: 1796, smallpoxGone: 1980, smallpoxLast: 1977,   // WHO, Smallpox
  polio: { campaign: 1988, cases1988: 350000, endemic: ['Afghanistan', 'Pakistan'] },   // GPEI
  measles: { one: 93, two: 97, target: 95, pneumonia: 20, encephalitis: 1000, seizure: 3000, allergy: 1000000 },   // CDC 2024-25; McNeil 2016
  autism: { year: 1998, children: 12, retracted: 2010, danish: 657461, danishYear: 2019 },   // Lancet 2010; Hviid 2019
  penicillin: { fleming: 1928, nobel: 1945 },   // nobelprize.org
  amr: { deaths: 1.14, forecast: 39 },     // GRAM, Lancet 2024
  // sample labels: [mg per unit, most units in 24 h, shortest gap in hours]
  labels: { paracetamol: [500, 8, 4], acetaminophen: [500, 6, 6], ibuprofen: [200, 6, 4], coldflu: [1000, 4, 4], allergy: [10, 1, 24] },
  paracetamolMax: 4000,                   // NHS; FDA
  criticalPh: 5.5,                        // Stephan 1944
  uv: [[0, 2, 'low', 'none'], [3, 5, 'moderate', 'protect'], [6, 7, 'high', 'protect'], [8, 10, 'very high', 'extra'], [11, 99, 'extreme', 'extra']],   // WHO Global Solar UV Index, 2002
  noise: { db: 85, hours: 8, step: 3, whoDb: 80, whoHours: 40 },   // NIOSH 1998; WHO-ITU H.870
  road: { belt: [45, 50], helmetDeath: 42, helmetHead: 69 },       // WHO; Cochrane 2008
  ncd: { millions: 43, share: 75 },       // WHO fact sheet, September 2025
  hypertensionBillions: 1.4,              // WHO Global report on hypertension, 2025
  bp: { us: [130, 80], europe: [140, 90] },   // AHA/ACC 2025; ESC 2024
  units: { cholesterol: 39, glucose: 18 }, // 38.67 and 18.02, rounded
  diabetes: { hba1c: 6.5, mmolMol: 48, fasting: 7.0, mgdl: 126 },   // WHO; ADA 2025
  bmiBands: [18.5, 25, 30],               // WHO
  restingHr: [60, 100],                   // AHA
  risk: { base: 4, smoking: 2, bp: 2, ldl: 1.5, diabetes: 2 },      // teaching model (see helpers.js)
  screen: { base: 0.008, sens: 0.875, fpr: 0.1 },
  marmot: { invited: 10000, saved: 43, over: 129 },   // Independent UK Panel, Lancet 2012
  tobaccoMillions: 7,                     // WHO fact sheet, June 2025
  quitUnaided: 4,                         // Hughes 2004: 3 to 5 in 100
  alcohol: { unitMl: 10, gPerMl: 0.789, deaths: 2.6 },   // NHS; WHO 2024
  drinkGrams: { 'the United Kingdom': 8, Australia: 10, 'the United States': 14 },   // NHS; NHMRC 2020; NIAAA
  alcoholCancers: 7,                      // IARC Monographs 100E
  guidance: { uk: 14, ausWeek: 10, ausDay: 4, canada: 2 },   // UK CMOs 2016; NHMRC 2020; CCSA 2023
  meat: { pct: 18, lifetime: 6 },         // IARC 2015; Cancer Research UK
  pill: { year: 1995, per: 7000, abortions: 13000 },   // Furedi 1999
  torcetrapib: { hdl: 70, people: 15000 }, // ILLUMINATE, NEJM 2007
};

test('the helper tables agree with an independent table of the key facts', () => {
  assert.equal(H.HANDWASH_SECONDS, FACTS.handwashSeconds);
  assert.deepEqual([H.FOOD.coldC, H.FOOD.hotC, H.FOOD.cookC, H.FOOD.roomHours], [FACTS.food.cold, FACTS.food.hot, FACTS.food.cook, FACTS.food.hours]);
  assert.equal(H.SNOW.year, FACTS.snowYear);
  assert.deepEqual([H.SEMMELWEIS.before, H.SEMMELWEIS.after], [FACTS.semmelweis.before, FACTS.semmelweis.after]);
  const V = H.VACCINE_HISTORY;
  assert.deepEqual([V.jenner, V.smallpoxEradicated, V.smallpoxLastCase, V.polioCampaign, V.polioCases1988], [FACTS.jenner, FACTS.smallpoxGone, FACTS.smallpoxLast, FACTS.polio.campaign, FACTS.polio.cases1988]);
  assert.deepEqual(V.polioEndemic, FACTS.polio.endemic);
  const M = H.MEASLES;
  assert.deepEqual([M.oneDose, M.twoDoses, M.target, M.pneumoniaOneIn, M.encephalitisOneIn, M.febrileSeizureOneIn, M.severeAllergyOneIn],
    [FACTS.measles.one, FACTS.measles.two, FACTS.measles.target, FACTS.measles.pneumonia, FACTS.measles.encephalitis, FACTS.measles.seizure, FACTS.measles.allergy]);
  assert.deepEqual([H.AUTISM_CLAIM.year, H.AUTISM_CLAIM.children, H.AUTISM_CLAIM.retracted, H.AUTISM_CLAIM.danishChildren, H.AUTISM_CLAIM.danishYear],
    [FACTS.autism.year, FACTS.autism.children, FACTS.autism.retracted, FACTS.autism.danish, FACTS.autism.danishYear]);
  assert.deepEqual([H.PENICILLIN.fleming, H.PENICILLIN.nobel], [FACTS.penicillin.fleming, FACTS.penicillin.nobel]);
  assert.deepEqual([H.AMR.deaths2021, H.AMR.forecast2050], [FACTS.amr.deaths, FACTS.amr.forecast]);
  assert.deepEqual(Object.keys(H.LABELS).sort(), Object.keys(FACTS.labels).sort());
  for (const [key, [mg, most, gap]] of Object.entries(FACTS.labels)) {
    const L = H.LABELS[key];
    assert.deepEqual([L.strength, L.maxUnits, L.everyHours], [mg, most, gap], key);
    // what the label says in words agrees with its numbers
    assert.ok(L.active.replace(/,/g, '').includes(`${mg} mg`), `${key}: active line states ${mg} mg`);
    assert.ok(new RegExp(`more than ${most} ${L.unit}s? in 24 hours`).test(L.max), `${key}: maximum line`);
    assert.ok(L.perDose * 1 <= most && Number.isInteger(most / L.perDose), `${key}: whole doses fit the maximum`);
    const gapSaid = /every (\d+)(?: to \d+)? hours|at least (\d+) hours|once a (day)/.exec(L.dose);
    assert.ok(gapSaid, `${key}: dose line gives the gap`);
    assert.equal(gapSaid[3] ? 24 : Number(gapSaid[1] || gapSaid[2]), gap, `${key}: gap`);
  }
  assert.equal(H.PARACETAMOL_MAX_MG, FACTS.paracetamolMax);
  assert.equal(H.LABELS.paracetamol.strength * H.LABELS.paracetamol.maxUnits, FACTS.paracetamolMax);
  assert.equal(H.TEETH.criticalPh, FACTS.criticalPh);
  for (let i = 0; i <= 14; i++) {
    const [, , name, need] = FACTS.uv.find(([lo, hi]) => i >= lo && i <= hi);
    assert.deepEqual([H.uvBand(i).name, H.uvBand(i).need], [name, need], `UV index ${i}`);
  }
  assert.equal(H.UV_PROTECT_FROM, 3);
  assert.deepEqual([H.NOISE.refDb, H.NOISE.refHours, H.NOISE.exchangeDb, H.NOISE.whoDb, H.NOISE.whoHoursPerWeek], [FACTS.noise.db, FACTS.noise.hours, FACTS.noise.step, FACTS.noise.whoDb, FACTS.noise.whoHours]);
  assert.deepEqual([H.ROAD.beltLow, H.ROAD.beltHigh, H.ROAD.helmetDeath, H.ROAD.helmetHead], [...FACTS.road.belt, FACTS.road.helmetDeath, FACTS.road.helmetHead]);
  assert.deepEqual([H.NCD.deathsMillions, H.NCD.sharePct], [FACTS.ncd.millions, FACTS.ncd.share]);
  assert.equal(H.HYPERTENSION.peopleBillions, FACTS.hypertensionBillions);
  assert.deepEqual(H.BP_GUIDELINES.us.highFrom, FACTS.bp.us);
  assert.deepEqual(H.BP_GUIDELINES.europe.highFrom, FACTS.bp.europe);
  // the bands of each guideline join up, and "high" starts where the guideline says
  for (const g of Object.values(H.BP_GUIDELINES)) {
    for (let i = 1; i < g.bands.length; i++) assert.equal(g.bands[i].from, g.bands[i - 1].to);
    assert.equal(g.bands.find((b) => /stage 1|^high$/.test(b.name)).from, g.highFrom[0]);
  }
  assert.deepEqual(H.UNITS, FACTS.units);
  near(FACTS.units.cholesterol, 38.67, 0.5); near(FACTS.units.glucose, 18.02, 0.5);
  assert.deepEqual([H.DIABETES.hba1cPct, H.DIABETES.hba1cMmolMol, H.DIABETES.fastingMmol, H.DIABETES.fastingMgDl], [FACTS.diabetes.hba1c, FACTS.diabetes.mmolMol, FACTS.diabetes.fasting, FACTS.diabetes.mgdl]);
  assert.equal(FACTS.diabetes.fasting * FACTS.units.glucose, FACTS.diabetes.mgdl, 'the two units of the glucose threshold agree');
  assert.deepEqual(H.BMI_BANDS, FACTS.bmiBands);
  assert.deepEqual(H.RESTING_HR, FACTS.restingHr);
  assert.equal(H.RISK_MODEL.base, FACTS.risk.base);
  for (const f of H.RISK_MODEL.factors) assert.equal(f.mult, FACTS.risk[f.id], f.id);
  assert.deepEqual(H.SCREEN_EXAMPLE, FACTS.screen);
  assert.deepEqual([H.MARMOT.invited, H.MARMOT.deathsPrevented, H.MARMOT.overdiagnosed], [FACTS.marmot.invited, FACTS.marmot.saved, FACTS.marmot.over]);
  assert.equal(H.TOBACCO.deathsMillions, FACTS.tobaccoMillions);
  assert.equal(H.QUIT_UNAIDED, FACTS.quitUnaided);
  assert.deepEqual([H.ALCOHOL.unitMl, H.ALCOHOL.gramsPerMl, H.ALCOHOL.deathsMillions], [FACTS.alcohol.unitMl, FACTS.alcohol.gPerMl, FACTS.alcohol.deaths]);
  near(FACTS.alcohol.unitMl * FACTS.alcohol.gPerMl, 8, 0.2, 'a UK unit is about 8 g');
  assert.deepEqual(Object.fromEntries(H.STANDARD_DRINK.map((d) => [d.country, d.grams])), FACTS.drinkGrams);
  assert.equal(H.ALCOHOL_CANCERS.length, FACTS.alcoholCancers);
  const G = H.ALCOHOL_GUIDANCE;
  assert.deepEqual([G.ukUnitsPerWeek, G.australiaPerWeek, G.australiaPerDay, G.canadaPerWeek], [FACTS.guidance.uk, FACTS.guidance.ausWeek, FACTS.guidance.ausDay, FACTS.guidance.canada]);
  assert.deepEqual([H.MEAT.relativePct, H.MEAT.lifetimePer100], [FACTS.meat.pct, FACTS.meat.lifetime]);
  assert.deepEqual([H.PILL_SCARE.year, H.PILL_SCARE.perWomen, H.PILL_SCARE.abortions], [FACTS.pill.year, FACTS.pill.per, FACTS.pill.abortions]);
  assert.deepEqual([H.TORCETRAPIB.hdlRisePct, H.TORCETRAPIB.people], [FACTS.torcetrapib.hdl, FACTS.torcetrapib.people]);
  // numbers the lessons state in running text
  near(1 - 1 / 15, 0.93, 0.005, 'the hook of the vaccines lesson');
  assert.equal(Math.round(FACTS.meat.lifetime * (1 + FACTS.meat.pct / 100)), 7, '18% more than 6 in 100 is about 7');
  assert.equal(H.herdThreshold(4), 0.75);
});

/* -------------------------------------------------- 2. generated questions */

const KIND_OF = {
  Cholera: 'bacterium', Tuberculosis: 'bacterium', 'Strep throat': 'bacterium', Tetanus: 'bacterium',
  'The common cold': 'virus', 'Influenza (flu)': 'virus', Measles: 'virus', 'COVID-19': 'virus', 'Norovirus infection': 'virus',
  "Athlete's foot": 'fungus', Thrush: 'fungus', Malaria: 'parasite',
};

test('germs: generated steps', () => {
  const kinds = eachVariant('germs', 'which-kind', (s, text) => {
    const [name] = grab(/^\*\*(.+?)\*\*:/, text);
    assert.ok(KIND_OF[name], `${name} is in the test's own table`);
    assert.equal(correctText(s), `A ${KIND_OF[name]}`);
    assert.ok(flat(s.explain).includes(`a **${KIND_OF[name]}**`));
  });
  assert.equal(kinds, Object.keys(KIND_OF).length, 'every illness of the table turns up');
  assert.deepEqual(H.ILLNESSES.map((i) => i.name).sort(), Object.keys(KIND_OF).sort());

  eachVariant('germs', 'growth', (s, text, made) => {
    const [R] = grab(/infects \*\*(\d+)\*\* others/, text).map(Number);
    const [n] = grab(/newly infected in round (\d+)/, text).map(Number);
    let cases = 1;                                  // round 0 is one person
    for (let round = 1; round <= n; round++) cases *= R;
    assert.equal(s.answer, cases);
    assert.ok(flat(s.explain).includes(grouped(cases)));
    const slip = (re) => (made.wrong.find((w) => re.test(w[1])) || [])[0];
    assert.equal(slip(/adding/), R * n);
    assert.equal(slip(/That is round/), cases / R);
  });

  eachVariant('germs', 'doubling', (s, text, made) => {
    const [start] = grab(/with \*\*(\d+)\*\* such bacteria/, text).map(Number);
    const [d] = grab(/double every \*\*(\d+) minutes\*\*/, text).map(Number);
    const [hours] = grab(/after (\d+) hours?\?/, text).map(Number);
    let count = start;
    for (let minute = d; minute <= hours * 60; minute += d) count *= 2;
    assert.equal(s.answer, count);
    assert.ok(flat(s.explain).includes(grouped(count)));
    const doublings = (hours * 60) / d;
    assert.ok(Number.isInteger(doublings));
    for (const h of s.hints) assert.ok(!/\d+\.\d+ doublings/.test(h));
    // the figure beside the question really doubles every d minutes and ends at 2^doublings
    const fig = s.figures[0];
    assert.equal(fig.fns[0].expr, `2^(x*${60 / d})`);
    assert.ok(fig.alt.includes(`${2 ** doublings} after ${hours} hour`));
    assert.ok(made.wrong.every((w) => Number(w[0]) !== count));
    assert.ok(text.includes(`${FACTS.food.cold} °C and ${FACTS.food.hot} °C`));
  });
});

test('vaccines: generated steps', () => {
  eachVariant('vaccines', 'threshold-calc', (s, text) => {
    const [r0] = grab(/infects \*\*([\d.]+)\*\* others/, text).map(Number);
    // the smallest immune share, in steps of a tenth of a per cent, at which one case infects no more than one other
    let v = 0;
    while (r0 * (1 - v / 1000) > 1 + 1e-9) v++;
    near(s.answer, v / 10, 0.05);
    assert.equal(s.unit, '%');
    assert.ok(flat(s.explain).includes(`**${String(s.answer)}%**`));
  });

  eachVariant('vaccines', 'enough', (s, text) => {
    const [v] = grab(/\*\*(\d+)%\*\* of the people are immune/, text).map(Number);
    const [r0] = grab(/R_0 = (\d+)/, text).map(Number);
    // count it out for 100 contacts of r0 cases
    const infected = (r0 * (100 - v)) / 100;
    near(s.blanks[0].numbers[0], infected, 1e-9);
    assert.notEqual(infected, 1, 'never exactly at the threshold');
    assert.equal(s.blanks[1].answer, infected > 1 ? 'keep growing' : 'die out');
    assert.deepEqual(s.blanks[1].options.slice().sort(), ['die out', 'keep growing']);
    assert.ok(flat(s.explain).includes(infected > 1 ? 'more than 1' : 'less than 1'));
    assert.ok(flat(s.explain).includes(infected > 1 ? 'falls short' : 'is above it'));
    assert.equal(1 - 1 / r0 > v / 100, infected > 1, 'the comparison with the threshold says the same');
  });
  // the dropdown does not always list the right option first
  const first = new Set();
  for (let k = 0; k < 60; k++) { const s = resolveStep(raw('vaccines', 'enough'), makeRng(k), 'enough'); first.add(s.blanks[1].options[0] === s.blanks[1].answer); }
  assert.equal(first.size, 2);
});

/** The numbers printed on a sample label shown as a figure or widget. */
function readLabel(spec) {
  assert.equal(spec.type, 'med-label');
  const rows = spec.labels[0].rows;
  const row = (head) => rows.find((r) => r.head.startsWith(head));
  const mg = number(grab(/([\d,]+) mg/, row('Active').text)[0]);
  const [most, unit] = grab(/more than (\d+) (\w+?)s? in 24 hours/, row('Maximum').text);
  const gapSaid = grab(/every (\d+)(?: to \d+)? hours|at least (\d+) hours/, row('Dose').text);
  const perDose = Number((/(?:1 or )?(\d) (?:tablet|caplet|sachet)/.exec(row('Dose').text) || [])[1]);
  return { rows, mg, most: Number(most), unit, gap: Number(gapSaid[0] || gapSaid[1]), perDose, ids: Object.fromEntries(rows.map((r) => [r.head.split(' ')[0], r.id])) };
}
const TIMES = { once: 1, twice: 2, 'three times': 3, 'four times': 4 };

test('medicines: generated steps', () => {
  const ASK = [[/what the medicine actually is/, 'Active'], [/the most that may be taken in a day/, 'Maximum'], [/how long to wait before another dose/, 'Dose'], [/what not to combine it with/, 'Warnings']];
  eachVariant('medicines', 'label-pick', (s, text) => {
    const label = readLabel(s.widget);
    assert.equal(s.widget.mode, 'pick');
    const want = ASK.find(([re]) => re.test(text));
    assert.ok(want, 'the question is one of the four');
    const target = label.ids[want[1]];
    for (const r of label.rows) assert.equal(s.check({ picked: r.id, pack: 0 }) === true, r.id === target, `row ${r.id}`);
    assert.equal(typeof s.check({ picked: null, pack: null }), 'string');
    assert.equal(s.check(s.solution), true);
    // the line really contains what the question asks about
    const line = label.rows.find((r) => r.id === target).text;
    if (want[1] === 'Dose') assert.ok(/hours/.test(line));
    if (want[1] === 'Warnings') assert.ok(/Do not take|may occur/.test(line));
  });

  eachVariant('medicines', 'max-day', (s, text) => {
    const label = readLabel(s.figures[0]);
    if (/in milligrams/.test(text)) {
      let mg = 0;
      for (let i = 0; i < label.most; i++) mg += label.mg;
      assert.equal(s.answer, mg);
      assert.equal(s.unit, 'mg');
      assert.ok(flat(s.explain).includes(grouped(mg)));
    } else {
      const [per, unit, times] = grab(/has taken \*\*(\d) (\w+?)s?, (once|twice|three times|four times)\*\*/, text);
      assert.equal(unit, label.unit);
      assert.equal(Number(per), label.perDose, 'a dose the label allows');
      const taken = Number(per) * TIMES[times];
      assert.ok(taken < label.most, 'still within the maximum');
      assert.equal(s.answer, label.most - taken);
      assert.equal(s.unit, `${label.unit}s`);
      assert.ok(flat(s.explain).includes(`at least ${label.gap} hours`));
    }
  });

  const toClock = (minutes) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  eachVariant('medicines', 'next-dose', (s, text) => {
    const label = readLabel(s.figures[0]);
    const [hh, mm] = grab(/at \*\*(\d\d):(\d\d)\*\*/, text).map(Number);
    const earliest = toClock(hh * 60 + mm + label.gap * 60);
    assert.equal(correctText(s), earliest);
    assert.ok(hh + label.gap < 24, 'no dose time crosses midnight');
    assert.ok(flat(s.explain).includes(`**${earliest}**`));
    // every other option is a different time, and its comment says truly whether it is too soon or merely later
    for (const o of s.options.filter((x) => !x.correct)) {
      const [oh, om] = o.text.split(':').map(Number);
      const gap = (oh * 60 + om - hh * 60 - mm) / 60;
      assert.ok(gap > 0 && gap !== label.gap);
      assert.ok(gap < label.gap ? /only \d hours later/.test(o.why) : /not the earliest/.test(o.why), o.why);
    }
  });

  let over = 0;
  const n = eachVariant('medicines', 'double-dose', (s, text) => {
    const [limit] = grab(/no more than \*\*([\d,]+) mg\*\* of paracetamol in 24 hours/, text).map(number);
    assert.equal(limit, FACTS.paracetamolMax);
    const [times] = grab(/two 500 mg paracetamol tablets, (once|twice|three times|four times)/, text);
    let total = 2 * 500 * TIMES[times];
    const sachets = /(\d) cold-and-flu sachets?, each with 1,000 mg/.exec(text);
    if (sachets) total += Number(sachets[1]) * 1000;
    if (/one dose of a night-time cough liquid, with 1,000 mg/.test(text)) total += 1000;
    assert.equal(s.blanks[0].numbers[0], total);
    assert.notEqual(total, limit, 'never exactly on the limit');
    assert.equal(s.blanks[1].answer, total > limit ? 'over' : 'within');
    assert.ok(flat(s.explain).includes(`**${grouped(total)} mg**`));
    assert.ok(flat(s.explain).includes(total > limit ? 'which is over the' : 'within the'));
    assert.equal(s.tone, 'sober');
    // each product on its own stays inside its own label
    assert.ok(2 * TIMES[times] <= FACTS.labels.paracetamol[1] && (!sachets || Number(sachets[1]) <= FACTS.labels.coldflu[1]));
    if (total > limit) over++;
  });
  assert.ok(n >= 8 && over > SEEDS * 0.25 && over < SEEDS * 0.85, 'both outcomes occur');
});

test('everyday care: generated steps', () => {
  const seen = new Set();
  eachVariant('everyday-care', 'uv-index', (s, text) => {
    const [index] = grab(/UV index of \*\*(\d+)\*\*/, text).map(Number);
    seen.add(index);
    const [, , name, need] = FACTS.uv.find(([lo, hi]) => index >= lo && index <= hi);
    const starts = { none: 'No protection needed', protect: 'Protection needed', extra: 'Extra protection' }[need];
    assert.ok(correctText(s).startsWith(starts), `${index}: ${correctText(s)}`);
    assert.ok(flat(s.explain).includes(`**${name}** band`));
    assert.ok(s.figures[0].alt.includes(`A pointer marks ${index}, in the ${name} band`));
    assert.equal(s.options.length, 3);
  });
  assert.ok(seen.size >= 12, 'the whole scale is practised');

  eachVariant('everyday-care', 'listen-calc', (s, text) => {
    const [ref, hours, step] = grab(/\*\*(\d+) dB\*\* is safe for \*\*(\d+) hours\*\* a day, and every \*\*(\d+) dB\*\* more halves/, text).map(Number);
    assert.deepEqual([ref, hours, step], [FACTS.noise.db, FACTS.noise.hours, FACTS.noise.step]);
    const [db] = grab(/measures \*\*(\d+) dB\*\*/, text).map(Number);
    let minutes = hours * 60;
    for (let level = ref; level < db; level += step) minutes /= 2;
    assert.equal(s.answer, minutes);
    assert.equal(s.unit, 'minutes');
    near(H.safeMinutes(db), minutes, 1e-9, 'the helper formula');
    assert.ok(flat(s.explain).includes(`= ${minutes}$ minutes`));
  });
});

test('know your numbers: generated steps', () => {
  eachVariant('know-your-numbers', 'units', (s, text) => {
    const [what, factor] = grab(/1 mmol\/L of (cholesterol|glucose) is about (\d+) mg\/dL/, text);
    assert.equal(Number(factor), FACTS.units[what]);
    const toMg = /\*\*([\d.]+) mmol\/L\*\*\. \*\*What would a laboratory that uses mg\/dL print/.exec(text);
    if (toMg) {
      near(s.answer, Number(toMg[1]) * factor, 1e-9);
      assert.equal(s.unit, 'mg/dL');
    } else {
      const [mg] = grab(/\*\*([\d.]+) mg\/dL\*\*\. \*\*What is that in mmol\/L/, text).map(Number);
      near(s.answer * factor, mg, 1e-9);
      assert.equal(s.unit, 'mmol/L');
    }
    if (what === 'glucose') assert.ok(flat(s.explain).includes(`${FACTS.diabetes.mgdl} mg/dL`) && flat(s.explain).includes(`${FACTS.diabetes.fasting} mmol/L`));
  });

  eachVariant('know-your-numbers', 'bmi', (s, text) => {
    const [height] = grab(/\*\*([\d.]+) m\*\* tall/, text).map(Number);
    const [weight] = grab(/weighs \*\*(\d+) kg\*\*/, text).map(Number);
    const exact = weight / height / height;
    assert.ok(Math.abs(s.answer - exact) <= 0.05 + 1e-9, `rounded to one decimal: ${s.answer} for ${exact}`);
    assert.ok(exact > 17 && exact < 33, 'an everyday example');
    assert.ok(!/underweight|overweight|obes|healthy weight|ideal/i.test(flat(s.text) + flat(s.explain)), 'the example person is not labelled');
    assert.ok(/populations/.test(s.explain) && /cannot tell muscle from fat/.test(s.explain), 'the limits of BMI are stated');
  });

  eachVariant('know-your-numbers', 'risk-meaning', (s, text) => {
    const [p] = grab(/risk of heart attack or stroke of \*\*(\d+)%\*\*/, text).map(Number);
    const [n] = grab(/Picture \*\*(\d+)\*\* people/, text).map(Number);
    // count them: person i of n is "affected" when i ≤ p% of n
    let hit = 0;
    for (let i = 1; i <= n; i++) if (i * 100 <= p * n) hit++;
    assert.equal(hit * 100, p * n, 'a whole number of people');
    const askNot = /\*not\* to have/.test(text);
    assert.equal(s.answer, askNot ? n - hit : hit);
    assert.ok(flat(s.explain).includes(`**${hit}**`) && flat(s.explain).includes(`${n - hit} of the ${n} would not`));
  });
});

test('screening: generated steps', () => {
  eachVariant('screening', 'ppv-count', (s, text) => {
    const [ill] = grab(/\*\*(\d+) in every 1,000\*\* have the disease/, text).map(Number);
    const [sens] = grab(/sensitivity of \*\*(\d+)%\*\*/, text).map(Number);
    const [spec] = grab(/specificity of \*\*(\d+)%\*\*/, text).map(Number);
    const well = 1000 - ill;
    const truePos = (ill * sens) / 100;
    const falsePos = well - (well * spec) / 100;      // the ones NOT correctly cleared
    for (const v of [truePos, falsePos]) near(v, Math.round(v), 1e-9, 'whole people');
    assert.deepEqual(s.blanks.map((b) => b.numbers[0]), [ill, Math.round(truePos), well, Math.round(falsePos), Math.round(truePos + falsePos), Math.round(truePos)]);
    const ppv = Math.round((truePos / (truePos + falsePos)) * 100);
    assert.ok(flat(s.explain).includes(`\\approx ${ppv}\\%`), `quotes ${ppv}%`);
    if (truePos < ill) assert.ok(flat(s.explain).includes(`misses ${ill - Math.round(truePos)} of the people`));
    else assert.ok(!/misses/.test(s.explain));
  });

  eachVariant('screening', 'lead-time', (s, text) => {
    const [found] = grab(/symptoms appear, at \*\*(\d+)\*\*/, text).map(Number);
    const [screened] = grab(/by screening at \*\*(\d+)\*\*/, text).map(Number);
    const [death] = grab(/both die at \*\*(\d+)\*\*/, text).map(Number);
    assert.ok(screened < found && found < death);
    assert.equal(s.answer, death - screened);
    const ex = flat(s.explain);
    assert.ok(ex.includes(`**${death - screened} years**`) && ex.includes(`Ana only ${death - found}`) && ex.includes(`${found - screened} more years of *knowing*`));
    assert.equal(s.tone, 'sober');
    assert.ok(s.figures[0].alt.includes(`found at ${found}`) && s.figures[0].alt.includes(`at ${screened}`));
  });
});

test('substances: generated steps', () => {
  eachVariant('substances', 'units', (s, text) => {
    const size = grab(/picks up a (?:large |small )?(\d+ ml|1 litre)/, text)[0];
    const ml = size === '1 litre' ? 1000 : Number(size.replace(' ml', ''));
    const [abv] = grab(/\*\*(\d+)%\*\* alcohol/, text).map(Number);
    const pure = (ml * abv) / 100;                    // ml of pure alcohol
    near(s.answer, pure / FACTS.alcohol.unitMl, 1e-9);
    near(H.ukUnits(ml, abv), pure / 10, 1e-9);
    assert.ok(text.includes(`one unit is ${FACTS.alcohol.unitMl} ml of pure alcohol`));
  });

  eachVariant('substances', 'std-drinks', (s, text) => {
    assert.ok(/UK \*\*unit\*\* is 8 g/.test(text) && /Australian \*\*standard drink\*\* is 10 g/.test(text) && /US \*\*standard drink\*\* is 14 g/.test(text));
    const [grams] = grab(/holds \*\*(\d+) g\*\* of pure alcohol/, text).map(Number);
    const [, country] = grab(/How many (units|standard drinks) is that in (.+?)\?/, text);
    const per = FACTS.drinkGrams[country];
    assert.ok(per, country);
    near(s.answer, grams / per, 1e-9);
    assert.ok(Number.isInteger(s.answer), 'a whole number of drinks');
    const fig = s.figures[0];
    assert.deepEqual(fig.data.map((d) => d.value), [8, 10, 14]);
  });
});

test('health claims: generated steps', () => {
  eachVariant('health-claims', 'abs-calc', (s, text) => {
    const [base, n] = grab(/\*\*(\d+) in every ([\d,]+)\*\* get/, text).map(number);
    const twice = /\*\*double the risk\*\*/.test(text);
    const m = twice ? null : grab(/\*\*a (\d+)% (higher|lower) risk\*\*/, text);
    const pct = twice ? 100 : Number(m[0]);
    const more = twice || m[1] === 'higher';
    // count the changed people one by one
    let change = 0;
    for (let i = 1; i <= base; i++) if (i * 100 <= base * pct) change++;
    assert.equal(change * 100, base * pct, 'a whole number of people');
    assert.equal(s.answer, change);
    assert.equal(s.unit, `${more ? 'more' : 'fewer'} in ${grouped(n)}`);
    assert.ok(new RegExp(`How many ${more ? 'more' : 'fewer'} people in every ${grouped(n)}`).test(text));
    assert.ok(flat(s.explain).includes(`from ${base} to ${more ? base + change : base - change} in every ${grouped(n)}`));
    assert.ok(/invented for practice/.test(text));
  });

  eachVariant('health-claims', 'nnt', (s, text) => {
    const [without] = grab(/\*\*(\d+) in 100\*\* people who did not take it/, text).map(Number);
    const [withIt] = grab(/and \*\*(\d+) in 100\*\* people who took it/, text).map(Number);
    const [claimed] = grab(/by (\d+)%"/, text).map(Number);
    assert.ok(withIt < without);
    assert.equal(claimed, Math.round(((without - withIt) / without) * 100), 'the advert\'s percentage is the relative reduction');
    // the smallest group in which the medicine spares one whole person
    let people = 1;
    while ((people * (without - withIt)) / 100 < 1 - 1e-9) people++;
    assert.equal(s.answer, people);
    assert.equal(people * (without - withIt), 100, 'it divides exactly');
    assert.ok(flat(s.explain).includes(`The other ${people - 1} take it`));
  });

  const CLUE = [[/ice cream/, /Hot weather/], [/coffee/, /smoke/], [/vitamin pills/, /exercise more, smoke less/], [/night-light/, /parents/], [/chocolate/, /Rich countries/], [/bigger feet/, /Older children/]];
  const n = eachVariant('health-claims', 'spot-confounder', (s, text) => {
    const pair = CLUE.find(([re]) => re.test(text));
    assert.ok(pair, 'the finding is in the test\'s own table');
    assert.ok(pair[1].test(correctText(s)), correctText(s));
    assert.equal(s.options.length, 4);
    assert.ok(s.options.filter((o) => !o.correct).every((o) => o.why && o.why.length > 30));
    assert.ok(flat(s.explain).startsWith(correctText(s)));
  });
  assert.equal(n, CLUE.length);
});

/* ------------------------------------------------------ 3. interact steps */

const accepts = (step, state) => step.check(state) === true;

test('picture interactions accept exactly the right spot', () => {
  for (const [lesson, id, right] of [['germs', 'snow-map', ['broad']], ['medicines', 'disc-test', ['none1', 'none2']]]) {
    const s = fixed(lesson, id);
    const spots = s.widget.hotspots.map((h) => h.id);
    assert.ok(spots.length >= 5 && right.every((r) => spots.includes(r)));
    for (const spot of spots) assert.equal(accepts(s, { picked: spot }), right.includes(spot), `${id}: ${spot}`);
    assert.equal(typeof s.check({ picked: null }), 'string');
    assert.equal(s.check(s.solution), true);
    for (const h of s.widget.hotspots) assert.ok(h.x > h.r && h.x < 1 - h.r && h.y > 0 && h.y < 1 && h.r >= 0.05 && h.alt, `${id}/${h.id} lies inside the picture`);
    // a hotspot's hidden description must not give the answer away by naming it
    for (const h of s.widget.hotspots) assert.ok(!/Broad|resistant/i.test(h.alt));
  }
  const face = fixed('germs', 'face-entry');
  const parts = ['ear', 'eye', 'mouth', 'nose'];
  for (let mask = 0; mask < 16; mask++) {
    const picked = parts.filter((_, i) => mask & (1 << i));
    assert.equal(accepts(face, { picked, count: picked.length }), picked.join() === 'eye,mouth,nose', picked.join());
  }
  assert.equal(face.check(face.solution), true);
  assert.deepEqual(face.widget.answer.slice().sort(), ['eye', 'mouth', 'nose']);
});

test('outbreak steps: the settings that satisfy each instruction, and only those', () => {
  const run = (r0, vaccinated = 0, cut = 0) => ({ r0, vaccinated, cut, re: Math.round(r0 * (1 - cut) * (1 - vaccinated) * 100) / 100, infected: 10 });
  const state = (current, history, ran = true) => ({ ...current, ran, runs: history.length, last: null, history });
  near(effectiveR(4, 0.5, 0.5), 1, 1e-12, 'the widget\'s own formula');

  const chain = fixed('germs', 'chain');
  assert.equal(typeof chain.check(state(run(2), [])), 'string');
  assert.equal(typeof chain.check(state(run(2), [run(2), run(3)])), 'string');
  assert.equal(typeof chain.check(state(run(0.5), [run(0.5)])), 'string');
  assert.equal(chain.check(state(run(1), [run(2), run(1)])), 'Now set the slider below 1 (to 0.5) and start another outbreak.', 'exactly 1 is neither above nor below');
  assert.equal(chain.check(state(run(0.5), [run(2), run(0.5)])), true);

  const cutStep = fixed('germs', 'cut-spread');
  assert.equal(cutStep.widget.r0, 2.5);
  for (let i = 0; i <= 8; i++) for (const ran of [true, false]) {
    const cut = i / 10;
    const s = state(run(2.5, 0, cut), ran ? [run(2.5, 0, cut)] : [], ran);
    assert.equal(accepts(cutStep, s), ran && i === 6, `cut ${cut}, ran ${ran}`);
    const said = cutStep.check(s);
    if (i < 6) assert.ok(said.includes(`still infects ${String(s.re)}`), said);
    if (i > 6) assert.ok(/room to spare/.test(said) && said.includes(`only ${String(s.re)}`), said);
  }
  assert.equal(2.5 * (1 - 0.6), 1);

  const herd = fixed('vaccines', 'herd-explore');
  assert.equal(herd.widget.r0, 4);
  const h = (list) => state(run(4, list[list.length - 1] ?? 0), list.map((v) => run(4, v)));
  assert.equal(herd.check(h([0, 0.5, 0.8])), true);
  assert.equal(herd.check(h([0.8, 0.5, 0])), true, 'in any order');
  assert.equal(herd.check(h([0, 0.3, 0.75])), true, 'the threshold itself counts as enough');
  for (const list of [[], [0], [0, 0.5], [0.5, 0.8], [0, 0.8], [0, 0.9, 0.95]]) assert.equal(typeof herd.check(h(list)), 'string', list.join());

  const find = fixed('vaccines', 'threshold-find');
  assert.equal(find.widget.r0, 5);
  for (let i = 0; i <= 19; i++) for (const ran of [true, false]) {
    const v = i / 20;
    const s = state(run(5, v), ran ? [run(5, v)] : [], ran);
    assert.equal(accepts(find, s), ran && i === 16, `vaccinated ${v}, ran ${ran}`);
  }
  near(1 - 1 / 5, 0.8, 1e-12);
});

test('resistance: the selection model, the numbers quoted, and the check', () => {
  // own model: a course leaves a tenth of the ordinary bacteria and nine tenths of the resistant ones; regrowth keeps the proportions
  const dose = (p) => ({ s: Math.round(p.s / 10), r: Math.round(p.r * 0.9) });
  const grow = (p) => { const t = p.s + p.r; if (!t) return p; const r = p.s === 0 ? 200 : Math.round((p.r * 200) / t); return { s: 200 - r, r }; };
  const stateOf = (log) => {
    let p = { s: 198, r: 2 };
    let w = { susceptible: 198, resistant: 2 };
    for (const step of log) { p = step === 'dose' ? dose(p) : grow(p); w = step === 'dose' ? afterDose(w) : afterGrowth(w); }
    assert.deepEqual([w.susceptible, w.resistant], [p.s, p.r], `widget rule and own rule agree after ${log.join(',')}`);
    const total = p.s + p.r;
    return { susceptible: p.s, resistant: p.r, total, share: total ? p.r / total : 0, doses: log.filter((x) => x === 'dose').length, grows: log.filter((x) => x === 'grow').length, log, full: total === 200 };
  };
  const step = fixed('medicines', 'selection');
  const shares = [];
  const log = [];
  for (let i = 0; i < 3; i++) { log.push('dose', 'grow'); shares.push(Math.round(stateOf(log).share * 100)); }
  assert.deepEqual(shares, [9, 47, 89], 'the percentages in the explanation');
  assert.ok(/1% to 9%, then 47%, then 89%/.test(flat(step.explain)));
  assert.equal(step.check(stateOf(step.solution.log)), true);
  // every sequence of up to six steps: accepted exactly when the place is full again and more than half are resistant
  const walk = (sequence) => {
    const s = stateOf(sequence);
    assert.equal(accepts(step, s), s.full && s.resistant > s.susceptible, sequence.join(','));
    assert.notEqual(step.check(s), false, 'always says what to do next');
    if (sequence.length >= 6) return;
    if (s.total) walk([...sequence, 'dose']);
    if (s.total && !s.full) walk([...sequence, 'grow']);
  };
  walk([]);
  // with no resistant bacteria at the start none ever appear, as the next step's feedback says
  let p = { susceptible: 200, resistant: 0 };
  for (let i = 0; i < 4; i++) { p = afterGrowth(afterDose(p)); assert.equal(p.resistant, 0); }
  assert.equal(fixed('medicines', 'selection-why').figures[0].resistant, 0);
});

test('a day of acid attacks: own simulation, the widget\'s rule, and the two steps', () => {
  // own simulation, second by second: pH falls to 4.6 in 5 minutes, then recovers with a time constant of 45 minutes (+20% per extra item)
  const simulate = (meals, snacks) => {
    const at = new Map();
    for (const t of [...meals, ...snacks]) at.set(t * 60, (at.get(t * 60) || 0) + 1);
    let seconds = 0;
    let attacks = 0;
    let inside = false;
    for (let sec = 6 * 3600; sec < 30 * 3600; sec += 10) {
      const m = sec / 60;
      let ph = 7;
      for (const [start, items] of at) {
        const dt = m - start;
        if (dt <= 0) continue;
        const v = dt < 5 ? 7 - 2.4 * (dt / 5) : 7 - 2.4 * Math.exp(-(dt - 5) / (45 * (1 + 0.2 * (items - 1))));
        ph = Math.min(ph, v);
      }
      const below = ph < 5.5;
      if (below) { seconds += 10; if (!inside) attacks++; }
      inside = below;
    }
    return { minutes: seconds / 60, attacks };
  };
  const MEALS = [8, 13, 19];
  const explore = fixed('everyday-care', 'acid-explore');
  const fix = fixed('everyday-care', 'acid-fix');
  assert.deepEqual(fix.widget.meals, MEALS);
  const facts = (snacks) => {
    const w = acidDay(MEALS, snacks);
    const own = simulate(MEALS, snacks);
    assert.equal(w.attacks, own.attacks, `attacks for ${snacks}`);
    assert.ok(Math.abs(w.minutes - own.minutes) <= w.attacks + 1, `minutes for ${snacks}: ${w.minutes} against ${own.minutes}`);
    return { snacks, attacks: w.attacks, minutes: w.minutes, withMeals: w.withMeals, between: w.between };
  };
  const start = facts(fix.widget.snacks);
  assert.equal(start.attacks, 8);
  assert.ok(start.minutes > 170 && start.minutes < 195, 'about three hours, as the step says');
  assert.equal(typeof fix.check(start), 'string');
  assert.equal(typeof explore.check(start), 'string');
  assert.equal(explore.check(facts(explore.solution.snacks)), true);
  const solved = facts(fix.solution.snacks);
  assert.equal(fix.check(solved), true);
  assert.equal(solved.attacks, 3);
  assert.ok(solved.minutes > 80 && solved.minutes < 100, 'about an hour and a half');
  // every way of putting the five snacks on six possible times: accepted exactly when all of them are at mealtimes
  const slots = [8, 13, 19, 10, 15.5, 21];
  let accepted = 0;
  for (let code = 0; code < 6 ** 5; code += 7) {
    const snacks = [0, 1, 2, 3, 4].map((i) => slots[Math.floor(code / 6 ** i) % 6]);
    const s = facts(snacks);
    const allAtMeals = snacks.every((t) => MEALS.includes(t));
    assert.equal(accepts(fix, s), allAtMeals, snacks.join());
    assert.equal(s.between === 0, allAtMeals);
    assert.equal(accepts(explore, s), snacks.some((t) => MEALS.includes(t)));
    const said = fix.check(s);
    if (said !== true && s.between < 5) assert.ok(said.startsWith(`${s.minutes} minutes`) && said.includes(`${s.between} of the snacks`), said);
    if (allAtMeals) accepted++;
  }
  assert.ok(accepted > 3);
  // a snack half an hour after a meal is no better than one far from it: the attacks do not merge
  assert.ok(facts([8.5, 8, 13, 13, 19]).minutes >= 100);
});

test('listening time, alcohol clearing: the plot steps accept one setting each', () => {
  const loud = fixed('everyday-care', 'loud');
  for (let L = 82; L <= 106; L += 3) {
    let minutes = 8 * 60;
    for (let level = 85; level < L; level += 3) minutes /= 2;
    if (L === 82) minutes *= 2;
    assert.equal(accepts(loud, { L }), minutes === 15, `${L} dB`);
    if (minutes !== 15) assert.ok(loud.check({ L }).includes(minutes > 15 ? 'Go louder' : 'come back down'));
  }
  assert.equal(loud.check(loud.solution), true);
  assert.ok(loud.check({ L: 91 }).includes('2 hours') && loud.check({ L: 103 }).includes('7.5 minutes') && loud.check({ L: 82 }).includes('16 hours'));

  const clear = fixed('substances', 'clearing');
  for (let U = 2; U <= 12; U++) for (let t = 0; t <= 12; t++) {
    // own rule: one unit leaves each hour; the first hour with nothing left
    let left = U; let hour = 0;
    while (left > 0) { left -= FACTS.alcohol.unitMl / 10; hour++; }
    assert.equal(accepts(clear, { U, t }), U === 8 && t === hour, `${U} units, hour ${t}`);
  }
  assert.ok(clear.check({ U: 8, t: 5 }).includes('3 units are still in the body') && clear.check({ U: 8, t: 7 }).includes('1 unit is still'));
  assert.ok(/8 units/.test(clear.text));
});

test('risk pictures: every setting of the switches and sliders', () => {
  const F = FACTS.risk;
  const subsets = (ids) => Array.from({ length: 2 ** ids.length }, (_, mask) => ids.filter((_, i) => mask & (1 << i)));
  const count = (on) => Math.min(95, Math.round(on.reduce((m, id) => m * F[id], F.base)));
  const stateOf = (on) => {
    const withCount = count(on);
    const w = riskCounts(100, F.base, on.reduce((m, id) => m * F[id], 1));
    assert.equal(w.withCount, withCount, on.join());
    return { n: 100, base: F.base, withCount, extra: withCount - F.base, on };
  };
  const explore = fixed('know-your-numbers', 'risk-explore');
  assert.deepEqual(explore.widget.factors.map((f) => f.id), ['smoking', 'bp', 'ldl', 'diabetes']);
  for (const on of subsets(['smoking', 'bp', 'ldl', 'diabetes'])) assert.equal(accepts(explore, stateOf(on)), on.length >= 2, on.join());
  assert.deepEqual([count(['smoking']), count(['smoking', 'bp']), count(['smoking', 'bp', 'ldl', 'diabetes'])], [8, 16, 48], 'the numbers in the explanation');
  assert.ok(/from 4 to 8 in 100/.test(explore.explain) && /to 16/.test(explore.explain) && /make it 48/.test(explore.explain));

  const cut = fixed('know-your-numbers', 'risk-cut');
  assert.ok(cut.widget.factors.every((f) => f.on) && cut.widget.factors.length === 3);
  assert.equal(count(['smoking', 'bp', 'ldl']), 24);
  assert.ok(/24 in 100/.test(cut.text) && /8 in 100 or fewer/.test(cut.text));
  for (const on of subsets(['smoking', 'bp', 'ldl'])) {
    assert.equal(accepts(cut, stateOf(on)), count(on) <= 8, on.join());
    assert.equal(count(on) <= 8, on.length <= 1, 'dealing with any two of the three is what it takes');
  }
  assert.equal(cut.check(stateOf(cut.solution.on)), true);

  const help = fixed('substances', 'quit-help');
  for (let rr = 1; rr <= 3; rr += 0.5) assert.equal(accepts(help, { rr, base: 4 }), rr >= 3);
  assert.equal(help.widget.base, FACTS.quitUnaided);
  assert.ok(/4 in 100 into 8 to 12 in 100/.test(help.explain));

  const convert = fixed('health-claims', 'convert');
  assert.equal(convert.widget.base, 60);
  for (let i = 0; i <= 50; i++) {
    const rr = Math.round((1 + i * 0.02) * 100) / 100;
    const w = riskCounts(1000, 60, rr);
    assert.equal(accepts(convert, { rr, extra: w.extra }), i === 9, `${rr}`);
  }
  assert.equal(riskCounts(1000, 60, 1.18).extra, 11);
  assert.ok(/Sixty becomes 71/.test(convert.explain) && /11 extra cases in 1,000/.test(convert.explain));

  const doubles = fixed('health-claims', 'doubles');
  assert.equal(doubles.widget.rr, 2);
  for (let base = 1; base <= 500; base++) {
    const w = riskCounts(10000, base, 2);
    assert.equal(w.extra, base, 'doubling adds as many again');
    assert.equal(accepts(doubles, { base, extra: w.extra }), base === 1);
  }
  assert.ok(doubles.check({ base: 300, extra: 300 }).includes('300 in 10,000 means 300 extra'));
});

test('screening crowd: the three steps, for every slider setting', () => {
  const E = FACTS.screen;
  // the icon-array's documented rule: whole people only
  const tally = (base, sens, fpr) => {
    const ill = Math.round(1000 * base);
    const truePos = Math.round(ill * sens);
    const falsePos = Math.round((1000 - ill) * fpr);
    const positives = truePos + falsePos;
    return { base, sens, fpr, ill, truePos, falsePos, positives, ppv: positives ? truePos / positives : 0 };
  };
  const start = tally(E.base, E.sens, E.fpr);
  assert.deepEqual([start.ill, start.truePos, start.falsePos, start.positives], [8, 7, 99, 106], 'the numbers in the lesson');
  assert.equal(Math.round(start.ppv * 100), 7, 'the hook\'s answer');
  const hook = fixed('screening', 'hook');
  assert.equal(hook.answer, 7);
  const count = fixed('screening', 'count-it');
  for (let stage = 0; stage <= 3; stage++) assert.equal(accepts(count, { ...start, stage }), stage === 3);
  assert.ok(/\*\*106\*\* women/.test(count.explain) && /\*\*99\*\* do not/.test(count.explain));

  const baseRate = fixed('screening', 'base-rate');
  let first = null;
  for (let i = 0; i <= 146; i++) {
    const base = Math.round((0.008 + i * 0.002) * 1000) / 1000;
    const s = tally(base, E.sens, E.fpr);
    assert.equal(accepts(baseRate, s), s.truePos > s.falsePos, `base ${base}`);
    if (s.truePos > s.falsePos && first === null) first = base;
  }
  assert.ok(first > 0.1 && first < 0.115, `"a little over 1 in 10": ${first}`);
  assert.equal(baseRate.check(tally(baseRate.solution.base, E.sens, E.fpr)), true);

  const better = fixed('screening', 'better-test');
  for (let a = 0; a <= 4; a++) for (let b = 0; b <= 20; b++) {
    const s = tally(E.base, 0.5 + a * 0.125, b / 100);
    assert.equal(accepts(better, s), s.positives > 0 && s.truePos * 4 >= s.positives, `sens ${s.sens}, fpr ${s.fpr}`);
    if (b >= 10) assert.ok(!accepts(better, s), 'sensitivity alone never does it');
  }
  assert.ok(accepts(better, tally(E.base, 0.875, 0.02)) && !accepts(better, tally(E.base, 1, 0.03)));
  assert.equal(tally(E.base, 0.875, 0.02).positives, 27, '"down to about 27"');
  assert.equal(better.check(tally(E.base, better.solution.sens, better.solution.fpr)), true);
});

test('experiments by tapping buttons: confounding and chance', () => {
  const conf = fixed('health-claims', 'confounding');
  for (let c = 0; c <= 4; c++) for (let k = 0; k <= 4; k++) assert.equal(accepts(conf, { runs: { choice: c, coin: k } }), c >= 3 && k >= 3);
  assert.equal(conf.widget.effect, 0, 'the supplement does nothing in the model');
  const chance = fixed('health-claims', 'chance');
  for (const b of [0, 1, 20, 21, 40]) assert.equal(accepts(chance, { batches: b }), b >= 21);
  near(1 - 0.95 ** 20, 0.64, 0.01, '"about two rounds in three"');
});

/* ---------------------------------------------------------- 4. the rest */

test('order steps are written in the right order', () => {
  // risks of the vaccines lesson: the larger the "1 in N", the rarer
  const risks = fixed('vaccines', 'risks').items.map((t) => number(grab(/about 1 in ([\d,]+)/, t)[0]));
  assert.deepEqual(risks, [FACTS.measles.pneumonia, FACTS.measles.encephalitis, FACTS.measles.seizure, FACTS.measles.allergy]);
  assert.deepEqual(risks, risks.slice().sort((a, b) => a - b));
  const ORDERS = {
    'vaccines/tested': [/Laboratory and animal/, /Phase 1/, /Phase 2/, /Phase 3/, /regulators/, /Monitoring continues/],
    'know-your-numbers/artery': [/seeps into the artery wall/, /plaque builds up/, /plaque tears/, /clot forms/, /clot blocks/],
    'substances/quit-timeline': [/Pulse and blood pressure/, /Carbon monoxide/, /Coughing eases/, /heart attack has halved/, /lung cancer/],
    'health-claims/ladder': [/story/, /cells or animals/, /observe/, /Randomised controlled trials/, /Reviews/],
  };
  for (const [key, want] of Object.entries(ORDERS)) {
    const [lesson, id] = key.split('/');
    const items = fixed(lesson, id).items;
    assert.equal(items.length, want.length, key);
    want.forEach((re, i) => assert.ok(re.test(items[i]), `${key}: item ${i + 1} is ${items[i]}`));
  }
  // the times that go with the quitting milestones only ever increase
  const minutes = { '20 minutes': 20, 'a day or two': 2 * 1440, 'a few months': 90 * 1440, '1 year': 365 * 1440, '10 years': 3650 * 1440 };
  const times = H.QUIT_TIMELINE.map((q) => minutes[q.after]);
  assert.deepEqual(times, times.slice().sort((a, b) => a - b));
  assert.ok(times.every(Number.isFinite));
  const every = LESSONS.flatMap((l) => lessons[l].steps.filter((s) => s.type === 'order').map((s) => `${l}/${s.id}`));
  assert.deepEqual(every.sort(), ['vaccines/risks', ...Object.keys(ORDERS)].sort(), 'every order step is checked here');
});

test('every lesson has the agreed shape', () => {
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), LESSONS);
  const HANDS_ON = new Set(['outbreak-sim', 'resistance-sim', 'acid-day', 'risk-array', 'icon-array', 'assign-lab', 'many-tests', 'dot-plot', 'timeline']);
  for (const id of LESSONS) {
    const steps = lessons[id].steps;
    assert.ok(steps.length >= 11 && steps.length <= 20, `${id}: ${steps.length} steps`);
    const resolved = steps.map((s) => resolveStep(s, makeRng(5), s.id));
    const handsOn = resolved.filter((s) => s.type === 'interact' || s.figures.some((f) => HANDS_ON.has(f.type) || (f.type === 'plot' && f.params) || (f.type === 'body-map' && f.mode && f.mode !== 'view'))).length;
    assert.ok(handsOn >= 3, `${id}: ${handsOn} hands-on steps`);
    const review = steps.filter((s) => s.review).length;
    assert.ok(review >= 2 && review <= 4, `${id}: ${review} review steps`);
    assert.ok(steps.filter((s) => typeof s.gen === 'function').length >= 2, `${id}: generated steps`);
    assert.ok(steps.filter((s) => s.type === 'choice').length <= 5, `${id}: at most five choice steps`);
    assert.ok(steps[0].mode === 'predict', `${id} opens with a prediction`);
    assert.ok(rawLessons[id].recap.length >= 3 && rawLessons[id].recap.length <= 4 && rawLessons[id].next, `${id}: recap and teaser`);
    for (let i = 2; i < steps.length; i++) assert.ok(!(steps[i].type === 'info' && steps[i - 1].type === 'info' && steps[i - 2].type === 'info'), `${id}: three info steps in a row`);
    const last = steps[steps.length - 1];
    assert.equal(last.type, 'info', `${id} ends on an invitation`);
    assert.ok(/if you like|if you would like|if you are curious|you can find|try asking|Something to try/i.test(last.title + last.text), `${id}: the last step invites, it does not order`);
    for (const s of resolved) {
      if (s.review) assert.ok(s.explain && raw(id, s.id).id === s.id, `${id}/${s.id}: review steps have an id and an explanation`);
      if (s.type === 'interact') { assert.equal(typeof s.check, 'function'); assert.ok(s.solution && s.explain, `${id}/${s.id}`); assert.equal(s.check(s.solution) === true || ['chain', 'herd-explore', 'cut-spread', 'threshold-find', 'selection', 'acid-explore', 'acid-fix', 'base-rate', 'better-test', 'count-it', 'convert', 'doubles', 'risk-explore', 'risk-cut', 'quit-help', 'confounding', 'chance'].includes(s.id), true, `${id}/${s.id}: the solution is a complete state, or the step is checked with widget states above`); }
    }
  }
  assert.match(rawLessons['health-claims'].next, /First Aid/);
});

test('choices: one right answer, no duplicates, feedback on the wrong ones', () => {
  for (const id of LESSONS) for (const step of lessons[id].steps) {
    if (step.type !== 'choice' && step.type !== 'multi') continue;
    for (let seed = 0; seed < (step.gen ? 40 : 1); seed++) {
      const s = resolveStep(step, makeRng(seed), step.id);
      const right = s.options.filter((o) => o.correct).length;
      if (s.type === 'choice') assert.equal(right, 1, `${id}/${s.id}`);
      else assert.ok(right >= 2 && right < s.options.length, `${id}/${s.id}: some but not all`);
      assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, `${id}/${s.id}: duplicate options`);
      if (s.mode !== 'predict') for (const o of s.options) if (!o.correct) assert.ok(s.type === 'choice' ? o.why || s.id === 'uv-index' || s.id === 'which-kind' : o.why, `${id}/${s.id}: "${o.text}" explains why it is wrong`);
    }
  }
  // fill-in dropdowns: the right option is not always the first
  const firsts = fixed('know-your-numbers', 'bp-meaning').blanks.map((b) => b.options.indexOf(b.answer));
  assert.deepEqual(firsts, [1, 0, 2]);
  // buckets and matches are well formed
  for (const id of LESSONS) for (const step of lessons[id].steps) {
    const s = resolveStep(step, makeRng(2), step.id);
    if (s.type === 'bucket') { assert.ok(s.items.length >= 5 && s.items.length <= 8, `${id}/${s.id}`); for (let b = 0; b < s.buckets.length; b++) assert.ok(s.items.some((it) => it.bucket === b), `${id}/${s.id}: bucket ${b} is used`); }
    if (s.type === 'match') assert.equal(new Set(s.pairs.map((p) => p[1])).size, s.pairs.length, `${id}/${s.id}: right-hand sides differ`);
  }
});

test('safety and care', () => {
  const DISCLAIMER = '> **A note before we start.** This course is general education about health. It cannot take account of your own circumstances, so it is not a substitute for advice from a health professional who knows you.';
  const everything = [];
  for (const id of LESSONS) for (const step of lessons[id].steps) for (let seed = 0; seed < (step.gen ? 25 : 1); seed++) {
    const s = resolveStep(step, makeRng(seed * 31 + 1), step.id);
    for (const str of visible(s)) everything.push({ id, step: s, str });
  }
  for (const id of LESSONS) for (const str of [...rawLessons[id].recap, rawLessons[id].next]) everything.push({ id, step: { id: 'recap' }, str });
  const withDisclaimer = everything.filter((e) => e.str.includes('A note before we start'));
  assert.equal(withDisclaimer.length, 1, 'the disclaimer appears once');
  assert.equal(withDisclaimer[0].id, 'germs');
  assert.ok(lessons.germs.steps.indexOf(raw('germs', withDisclaimer[0].step.id)) <= 1, 'on the first or second step');
  assert.ok(withDisclaimer[0].str.includes(DISCLAIMER), 'word for word');

  // nothing asks for the learner's own health data
  const ASKS = /\b(enter|type|tell us|record|write down|log|track) (in )?your\b|your (weight|height|age|bmi|waist|blood pressure reading|cholesterol|medicines?|symptoms|intake|drinking|units)\b|how much do you (weigh|drink|smoke)|how many (drinks|cigarettes|units) do you|what is your (weight|height|age|blood pressure)/i;
  for (const e of everything) assert.ok(!ASKS.test(e.str), `${e.id}/${e.step.id} asks for personal data: ${e.str}`);
  // no numeric, slider or typed answer is about the learner
  for (const id of LESSONS) for (const step of lessons[id].steps) {
    const s = resolveStep(step, makeRng(4), step.id);
    if (['numeric', 'slider', 'short', 'fill'].includes(s.type)) assert.ok(!/\byour? (own )?(pulse|weight|height|body|blood)\b/i.test(s.text), `${id}/${s.id}`);
  }
  // language about bodies, food and people
  const AVOID = /\bthe obese\b|\bnormal people\b|\bideal weight\b|\bjunk food\b|\bguilt-free\b|\bclean eating\b|\bcommitted suicide\b|\baddicts?\b|\balcoholics?\b|\bjunkie|\bdrug abuse/i;
  for (const e of everything) assert.ok(!AVOID.test(e.str), `${e.id}/${e.step.id}: ${e.str}`);
  // suicide and self-harm are not part of this course; if a mention is ever added it must be sober and carry the pointers
  for (const e of everything.filter((x) => /suicid|self-harm/i.test(x.str))) {
    assert.equal(e.step.tone, 'sober', `${e.id}/${e.step.id}`);
    assert.ok(everything.some((x) => x.id === e.id && /findahelpline\.com/.test(x.str)) && everything.some((x) => x.id === e.id && /emergency number/.test(x.str)));
  }
  // steps about death and serious illness are sober
  const SOBER = { germs: ['snow-map', 'snow-evidence', 'semmelweis'], vaccines: ['risks'], medicines: ['double-dose'], 'everyday-care': ['moles', 'belts'], 'know-your-numbers': ['hook', 'artery'], substances: ['hook', 'alcohol-long', 'other-drugs', 'addiction'], 'health-claims': ['hook', 'convert', 'doubles', 'surrogate'] };
  for (const [id, ids] of Object.entries(SOBER)) for (const stepId of ids) assert.equal(raw(id, stepId).tone, 'sober', `${id}/${stepId}`);
  assert.equal(lessons.screening.tone, 'sober');
  assert.ok(lessons.screening.steps.every((s) => s.tone === 'sober'));
  for (const e of everything) if (/\b(died|dies(?! out)|die(?! out)|death|deaths|kills?(?! bacteria| nine| the ordinary)|killed|overdose|cancers?)\b/i.test(e.str) && e.step.type && e.step.type !== 'info' && e.step.id !== 'recap') {
    // passing mentions (a statistic in an explanation, "skin cancer" in advice on sun) in steps whose subject is something else
    const calm = e.step.tone === 'sober' || ['which-kind', 'wash', 'doubling', 'jenner', 'types', 'targets', 'selection', 'selection-why', 'slow-it', 'sun-facts', 'smoke-does', 'quit-timeline', 'vaping', 'ladder', 'red-flags', 'spot-confounder'].includes(e.step.id);
    assert.ok(calm, `${e.id}/${e.step.id} mentions death or cancer: should it be tone: 'sober'? "${e.str.slice(0, 90)}"`);
  }
  // red flags are stated plainly where the lessons touch them
  assert.ok(/needs medical help \*\*at once\*\*, even if they feel well/.test(flat(fixed('medicines', 'double-dose').explain)));
  assert.ok(/call your emergency number at once/i.test(flat(fixed('substances', 'other-drugs').explain)));
  assert.ok(/needs an ambulance now\. Call your emergency number/.test(flat(fixed('substances', 'help').text)));
  // contested thresholds are shown, never graded
  for (const id of LESSONS) for (const step of lessons[id].steps) {
    const s = resolveStep(step, makeRng(6), step.id);
    if (!s.graded) continue;
    const key = JSON.stringify([s.answer, s.options && s.options.filter((o) => o.correct).map((o) => o.text), s.blanks && s.blanks.map((b) => b.answer || b.answers)]);
    assert.ok(!/1[34]0\/[89]0|14 units|10 standard drinks/.test(key), `${id}/${s.id} grades a threshold on which authorities differ`);
  }
  assert.ok(/140\/90/.test(fixed('know-your-numbers', 'bp-high').text) && /130\/80/.test(fixed('know-your-numbers', 'bp-high').text), 'both blood-pressure lines are given');
  assert.ok(['United Kingdom', 'Australia', 'Canada', 'United States'].every((c) => fixed('substances', 'guidance').text.includes(c)));
  // sample labels say that they are samples, and doses are never the learner's
  for (const stepId of ['label-pick', 'max-day', 'next-dose']) assert.ok(/sample/i.test(fixed('medicines', stepId).text), stepId);
});

test('body diagrams use real structures; every picture has a licence, a credit and a description', () => {
  const known = (id) => {
    if (Array.isArray(id)) return id.length === 2 && id.every(Number.isFinite);
    const [name] = String(id).split(':');
    return !!structureInfo(name) || expandIds([name]).some((x) => x !== name && structureInfo(x));
  };
  const used = new Set();
  let maps = 0;
  for (const id of LESSONS) for (const step of lessons[id].steps) {
    const s = resolveStep(step, makeRng(3), step.id);
    for (const spec of figuresOf(s)) {
      assert.ok(spec.alt && spec.alt.length > 20, `${id}/${s.id}: ${spec.type} has a description`);
      if (spec.type === 'body-map') {
        maps++;
        const ids = [...(spec.show || []), ...(spec.hide || []), ...(spec.ghost || []), ...(spec.focus || []), ...(spec.pickable || []), ...[].concat(spec.answer || []),
          ...(spec.groups || []).flatMap((g) => [].concat(g.ids)), ...(spec.markers || []).map((m) => m.at)];
        for (const x of ids) assert.ok(known(x), `${id}/${s.id}: body-map id ${JSON.stringify(x)} exists`);
      }
      if (spec.type === 'photo') {
        const key = /staying-well\/([a-z0-9-]+)\.jpg/.exec(spec.src);
        assert.ok(key, `${id}/${s.id}: the picture comes from this course's media folder`);
        const rec = manifest.images[key[1]];
        assert.ok(rec, `${key[1]} is in the manifest`);
        assert.ok(rec.license && rec.sourceUrl && (rec.author || rec.publicDomain), `${key[1]}: licence, source and credit`);
        assert.ok(!/^(a |an |the )?(photo|image|picture)/i.test(spec.alt), 'alt text describes, it does not announce');
        used.add(key[1]);
      }
    }
  }
  assert.ok(maps >= 3, 'the body diagram is used');
  assert.deepEqual([...used].sort(), Object.keys(manifest.images).sort(), 'every picture in the manifest is used, and nothing else');
});

// Added in review: an independent table of the facts the first table leaves out, and the wording that a learner might act on.
test('review: more facts, and the safety wording a learner might act on', () => {
  // reproduction numbers and thresholds (Guerra 2017; Fine 1993; Biggerstaff 2014)
  assert.deepEqual([H.R0.measles.low, H.R0.measles.high], [12, 18]);
  assert.ok(H.R0.flu.low >= 1.1 && H.R0.flu.high <= 1.5);
  assert.equal(Math.round(100 * (1 - 1 / 12)), 92);
  assert.equal(Math.round(100 * (1 - 1 / 18)), 94);
  assert.ok(/needs 92 to 94%/.test(flat(fixed('vaccines', 'threshold-name').text)));
  assert.deepEqual(H.MEASLES.deathsPerThousand, [1, 3]);                    // CDC, Measles: complications
  assert.deepEqual([H.SNOW.deaths, H.SNOW.workhouseInmates, H.SNOW.workhouseDeaths, H.SNOW.breweryWorkers], [616, 535, 5, 70]);   // Snow 1855
  assert.ok(!/took his map/.test(flat(fixed('germs', 'snow-map').explain)), 'the map was drawn after the handle was removed');
  assert.deepEqual([H.MYOPIA_TRIAL.minutes, H.MYOPIA_TRIAL.years], [40, 3]);    // He et al., JAMA 2015: 30.4% against 39.5%
  near(H.MYOPIA_TRIAL.outdoors, 30.4, 0.5); near(H.MYOPIA_TRIAL.usual, 39.5, 0.5);
  assert.equal(H.CANCER.hpvReduction, 88);                                  // Lei et al., NEJM 2020
  assert.deepEqual([H.ALCOHOL.deathsMillions, H.ALCOHOL.deathsYear], [2.6, 2019]);   // WHO, Global status report on alcohol and health, 2024
  assert.deepEqual(H.ALCOHOL_CANCERS.slice().sort(), ['bowel', 'breast', 'food pipe (oesophagus)', 'liver', 'mouth', 'throat', 'voice box']);   // IARC 100E
  // screening invitations as shown (never graded): NHS England 2025-26; USPSTF 2018, 2021, 2024
  const PROG = {
    Cervical: ['ages 25 to 64, every 5 years', 'ages 21 to 65, every 3 to 5 years'],
    Bowel: ['ages 50 to 74, every 2 years', 'ages 45 to 75'],
    Breast: ['ages 50 to 70, every 3 years', 'ages 40 to 74, every 2 years'],
  };
  assert.deepEqual(Object.fromEntries(H.PROGRAMMES.map((p) => [p.cancer, [p.england, p.us]])), PROG);
  // the Marmot arithmetic and the hook of the screening lesson
  const tp = 7; const fp = Math.round(992 * 0.1);
  assert.equal(tp + fp, 106);
  assert.equal(Math.round((100 * tp) / (tp + fp)), 7);
  assert.ok(/\*\*106\*\* women have a positive test\. \*\*7\*\* of them have cancer, and \*\*99\*\* do not/.test(flat(fixed('screening', 'count-it').explain)));
  // the quoted US wording (Dietary Guidelines for Americans 2025-2030, January 2026)
  assert.ok(fixed('substances', 'guidance').text.includes('"consume less alcohol for better overall health"'));

  // medicines: the overdose warning, the lower limit for some people, and no advice to change a course alone
  for (let seed = 1; seed <= 40; seed++) {
    const s = resolveStep(raw('medicines', 'double-dose'), makeRng(seed), 'double-dose');
    const ex = flat(s.explain);
    assert.ok(/medical help \*\*at once\*\*, even if they feel well/.test(ex));
    assert.ok(/limit is lower on some packs and for some people/.test(ex) && /pharmacist/.test(ex));
    assert.ok(/active-ingredient line/.test(ex));
    assert.ok(!/child/i.test(flat(s.text) + ex), 'no children\'s doses');
  }
  assert.ok(/do not stop early or carry on longer on your own/.test(flat(fixed('medicines', 'slow-it').explain)));
  assert.ok(fixed('medicines', 'slow-it').options.some((o) => o.correct && /Never sharing antibiotics or saving leftovers/.test(o.text)));
  assert.ok(fixed('medicines', 'cautions').pairs.some(([a, b]) => a === 'Aspirin' && /Not for children/.test(b) && /Reye/.test(b)));
  assert.ok(/ask a pharmacist or doctor, not to take more/.test(JSON.stringify(Array.from({ length: 30 }, (_, k) => resolveStep(raw('medicines', 'max-day'), makeRng(k + 1), 'max-day').explain))));
  // know your numbers: when to call for help
  assert.ok(/Chest pain or pressure that does not pass.*call your emergency number at once/.test(flat(fixed('know-your-numbers', 'artery').explain)));
  assert.ok(/180\/120 or more\) together with chest pain.*is an emergency\. Call your emergency number/.test(flat(fixed('know-your-numbers', 'bp-readings').explain)));
  assert.ok(/nobody needs to write it down/.test(flat(fixed('know-your-numbers', 'try-it').text)), 'the pulse activity records nothing');
  for (let seed = 1; seed <= 40; seed++) {
    const s = resolveStep(raw('know-your-numbers', 'bmi'), makeRng(seed), 'bmi');
    assert.ok(/example adult/.test(s.text) && /only a rough first look/.test(s.explain));
    assert.ok(!/overweight|obes|underweight|normal weight|healthy weight|ideal/i.test(s.text + s.explain));
  }
  // screening: symptoms are not for waiting; the "both reasonable" sentence is about breast screening only
  assert.ok(/should be checked now, not left for the next screening invitation/.test(flat(fixed('screening', 'symptoms').text)));
  const harms = flat(fixed('screening', 'harms').explain);
  assert.ok(/invitations to breast screening/.test(harms) && /Cervical and bowel screening.*leans more clearly towards taking part/.test(harms));
  // substances: nothing that makes drink-driving a sum, help for someone in danger, vapes not for non-smokers
  assert.ok(/cannot tell anyone when they are safe to drive/.test(flat(fixed('substances', 'clearing').explain)));
  assert.ok(/Stay with them, and if they are breathing, lay them on their side/.test(flat(fixed('substances', 'help').text)));
  assert.ok(/not for children, or for people who do not smoke/.test(flat(fixed('substances', 'vaping').explain)));
  assert.ok(/During pregnancy no amount is known to be safe/.test(flat(fixed('substances', 'alcohol-long').explain)));
  // germs: the sentence on masks claims no more than the evidence
  assert.ok(/trials have given mixed results/.test(flat(fixed('germs', 'face-entry').explain)));
  // vaccines: no false balance
  assert.ok(/MMR does not cause autism/.test(flat(fixed('vaccines', 'autism-claim').explain)));
  assert.ok(/far smaller than the risks of the disease/.test(flat(fixed('vaccines', 'risks').explain)));
});

/* ------------------------------------------------------ teach before you ask */

// Every teaching screen added when the course was revised to teach before it asks: [the screen, the first step it serves, terms it must contain].
const TEACH = {
  germs: [
    ['teach-illnesses', 'which-kind', ['Bacteria', 'Viruses', 'Fungi', 'Parasites']],
    ['teach-routes', 'routes', ['Air', 'Hands and surfaces', 'Food and water', 'Blood and sex', 'Insects', 'flu', 'norovirus', 'cholera', 'hepatitis B', 'malaria']],
    ['teach-r', 'growth', ['reproduction number', 'multiplies', '6 × 6', '216']],
    ['teach-handwash', 'wash', ['soap', '20 seconds', 'thumbs, fingertips and between the fingers', 'wet', 'antibacterial']],
  ],
  vaccines: [
    ['teach-memory', 'jenner', ['first meeting', 'second meeting', 'memory cells', 'specific']],
    ['teach-types', 'types', ['weakened live germ', 'inactivated', 'piece of the germ', 'mRNA']],
    ['example-threshold', 'threshold-calc', ['1.25', '20%', '1.125', '0.875', 'keep growing', 'die out']],
  ],
  medicines: [
    ['teach-antibiotics', 'targets', ['cell wall', 'Strep throat', 'Tuberculosis', 'Urinary tract infections', 'common cold', 'Flu', 'COVID-19', 'Most coughs and sore throats']],
    ['teach-label', 'label-pick', ['Active ingredient', 'Use', 'Dose', 'Maximum', 'Warnings', 'sample']],
    ['example-label', 'max-day', ['6 × 250', '1,500 mg', '6 − 4', '15:30', 'invented']],
    ['teach-cautions', 'cautions', ['Ibuprofen', 'Aspirin', 'Reye', 'St John\'s wort', 'Grapefruit juice']],
  ],
  'everyday-care': [
    ['teach-teeth', 'teeth-care', ['Plaque', 'Sugar', 'Fluoride', 'between the teeth', 'sleep']],
    ['teach-uv', 'uv-index', ['UV index', '0 to 2', '3 to 7', '8 and above']],
    ['teach-sun', 'sun-facts', ['cloud', 'Melanin', 'tan', 'factor 3', 'sunscreen']],
    ['teach-eyes', 'eyes', ['outdoors', '40 in 100', '30 in 100', 'daylight']],
    ['teach-decibels', 'listen-calc', ['halves', '106', '7 steps', '3.75 minutes']],
  ],
  'know-your-numbers': [
    ['teach-artery', 'artery', ['atherosclerosis', 'LDL cholesterol', 'plaque', 'tears', 'clot']],
    ['teach-bp', 'bp-meaning', ['systolic', 'diastolic', 'contracts', 'rests between beats', 'stiffen and scar']],
    ['teach-blood-tests', 'units', ['LDL cholesterol', 'Blood glucose', '39 mg/dL', '18 mg/dL', 'multiply', 'divide']],
    ['teach-risk', 'risk-cut', ['multiplier', 'divide', '48 ÷ 2', 'teaching model']],
  ],
  screening: [
    ['teach-cancer', 'what-cancer', ['mistakes', 'keep dividing', 'not an infection']],
    ['teach-prevention', 'lower-risk', ['Tobacco', 'HPV', 'hepatitis B', 'Alcohol', 'Ultraviolet', 'detox', 'vitamin']],
    ['teach-terms', 'terms', ['Sensitivity', 'Specificity', 'False positive', 'False negative', 'Predictive value']],
    ['example-count', 'ppv-count', ['30', '27', '970', '97', '124', 'wrongly flagged']],
  ],
  substances: [
    ['teach-smoke', 'smoke-does', ['Carbon monoxide', 'Tar', 'Irritant gases and particles', 'Nicotine']],
    ['teach-units', 'units', ['10 ml', '400 × 10 ÷ 1,000', 'standard drink', '8 g', '10 g', '14 g']],
    ['teach-alcohol-long', 'alcohol-long', ['mouth', 'throat', 'voice box', 'food pipe', 'liver', 'bowel', 'breast', 'starts at low levels']],
    ['teach-other-drugs', 'other-drugs', ['Opioids', 'Stimulants', 'Cannabis', 'sedatives']],
  ],
  'health-claims': [
    ['teach-two-ways', 'convert', ['Relative', 'Absolute', '80 × 0.25 = 20', '20 more']],
    ['example-nnt', 'nnt', ['30 − 20', '100 ÷ 10', 'number needed to treat']],
    ['teach-confounder', 'spot-confounder', ['confounder', 'randomised', 'third thing', 'other way round']],
    ['teach-ladder', 'ladder', ['story', 'Cells and animals', 'Observing', 'randomised trial', 'review']],
  ],
};

test('teach before you ask', () => {
  const said = (lesson, id) => flat(visible(fixed(lesson, id)).join(' '));
  for (const id of LESSONS) {
    const steps = lessons[id].steps;
    const resolved = steps.map((s) => resolveStep(s, makeRng(1), s.id));
    const firstGraded = resolved.findIndex((s) => s.graded);
    const firstTaught = resolved.findIndex((s) => s.type === 'info' || (s.type === 'interact' && !s.graded));
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: something is taught or explored before the first graded step`);
    const screens = steps.slice(0, -1).filter((s) => s.type === 'info').length;       // the closing screen does not count
    assert.ok(screens >= 3, `${id}: ${screens} teaching screens`);
    assert.ok(steps.filter((s) => s.mode === 'predict').length <= 2, `${id}: at most two predictions`);
    for (const [teach, serves, terms] of TEACH[id]) {
      const at = steps.findIndex((s) => s.id === teach);
      assert.ok(at >= 0 && steps[at].type === 'info', `${id}/${teach} is a teaching screen`);
      assert.ok(at < steps.findIndex((s) => s.id === serves), `${id}/${teach} comes before ${serves}`);
      const text = said(id, teach);
      for (const term of terms) assert.ok(text.toLowerCase().includes(term.toLowerCase()), `${id}/${teach} says "${term}"`);
    }
  }
  const variants = (lesson, id, n = 120) => Array.from({ length: n }, (_, k) => flat(resolveStep(raw(lesson, id), makeRng(77 + k * 131), id).text));

  // tables that a generated question draws from are shown whole on a teaching screen above it
  const illnesses = said('germs', 'teach-illnesses').toLowerCase();
  for (const ill of H.ILLNESSES) assert.ok(illnesses.includes(ill.name.toLowerCase()), `teach-illnesses lists ${ill.name}`);
  const kinds = said('germs', 'kinds');
  for (const m of Object.values(H.MICROBES)) assert.ok(kinds.includes(m.plural) && kinds.includes(m.what));
  for (const t of H.VACCINE_TYPES) assert.ok(said('vaccines', 'teach-types').includes(t.gives), t.kind);
  for (const need of Object.values(H.UV_NEED)) assert.ok(said('everyday-care', 'teach-uv').includes(need), need);
  for (const d of H.STANDARD_DRINK) assert.ok(said('substances', 'teach-units').includes(`${d.grams} g`));
  for (const site of H.ALCOHOL_CANCERS) assert.ok(said('substances', 'teach-alcohol-long').includes(site), site);
  for (const rung of H.EVIDENCE_LADDER) assert.ok(fixed('health-claims', 'teach-ladder').figures[0].alt.includes(rung), rung);
  for (const [a, b] of fixed('substances', 'smoke-does').pairs) assert.ok(said('substances', 'teach-smoke').includes(a) && said('substances', 'teach-smoke').includes(b));
  for (const [a, b] of fixed('substances', 'other-drugs').pairs) assert.ok(said('substances', 'teach-other-drugs').replace(/\*\*/g, '').includes(a) && said('substances', 'teach-other-drugs').includes(b));
  for (const q of H.QUIT_TIMELINE) assert.ok(fixed('substances', 'quit-timeline').items.includes(q.what));
  assert.ok(/circulation responds within minutes.*blood within days.*lungs take months.*heart about a year.*cancer longest of all/.test(flat(fixed('substances', 'quit-timeline').text)), 'the order step carries its rule');
  // the label the first label screen explains is not one the questions use, and it carries the same five headings
  assert.deepEqual(fixed('medicines', 'teach-label').figures[0].labels[0].rows.map((r) => r.head.split(' (')[0]), ['Active ingredient', 'Use', 'Dose', 'Maximum', 'Warnings']);
  assert.equal(fixed('medicines', 'teach-label').figures[0].labels[0].name, H.LABELS.allergy.name);

  // worked examples use numbers the questions after them cannot produce
  assert.ok(variants('germs', 'growth').every((t) => !/infects \*\*6\*\* others/.test(t)));
  assert.ok(variants('germs', 'doubling').every((t) => !/double every \*\*15 minutes\*\*/.test(t) && /double every 15 minutes double 4 times/.test(t)));
  assert.ok([...variants('vaccines', 'threshold-calc'), ...variants('vaccines', 'enough')].every((t) => !/1\.25/.test(t)));
  near(1 - 1 / 1.25, 0.2, 1e-12); near(1.25 * 0.9, 1.125, 1e-12); near(1.25 * 0.7, 0.875, 1e-12);
  // Added in review: the table on `threshold-name` follows the formula and is not a look-up for `threshold-calc`:
  // the question never asks an R0 that the table shows, nor the one whose answer `threshold-find` has just revealed.
  const thresholdTable = fixed('vaccines', 'threshold-name').text;
  const tableCells = (re) => grab(re, thresholdTable, 'table row')[0].split('|').map((c) => Number(c.replace('%', '').trim()));
  const shownR0 = tableCells(/\|\s*\$R_0\$\s*\|([^\n]+)\|/);
  const shownShare = tableCells(/\|\s*Immune share needed\s*\|([^\n]+)\|/);
  assert.equal(shownR0.length, 5);
  shownR0.forEach((r0, i) => assert.equal(shownShare[i], Math.round(100 * (1 - 1 / r0)), `the table's threshold for R0 = ${r0}`));
  const askedR0 = new Set(variants('vaccines', 'threshold-calc', 200).map((t) => Number(grab(/infects \*\*([\d.]+)\*\* others/, t)[0])));
  assert.ok(askedR0.size >= 6, 'the threshold question still has at least six different R0 values');
  for (const r0 of askedR0) assert.ok(!shownR0.includes(r0) && r0 !== 5 && r0 !== 15, `threshold-calc asks R0 = ${r0}, whose answer is already on the screen above`);
  assert.ok(Object.values(H.LABELS).every((l) => l.strength !== 250 && l.everyHours !== 8));
  assert.equal(6 * 250, 1500);
  assert.ok(variants('everyday-care', 'listen-calc').every((t) => !/measures \*\*106 dB\*\*/.test(t)));
  assert.equal(H.safeMinutes(106), 3.75);
  assert.ok(variants('know-your-numbers', 'units').every((t) => !/\*\*8 mmol\/L\*\*|\*\*144 mg\/dL\*\*/.test(t)));
  assert.ok(variants('know-your-numbers', 'bmi').every((t) => !/\*\*2 m\*\* tall/.test(t) && /88 ÷ 4 = 22/.test(t)));
  assert.ok(variants('know-your-numbers', 'risk-meaning').every((t) => !/of \*\*25%\*\*/.test(t) && !/Picture \*\*40\*\*/.test(t)));
  assert.ok(H.SCREEN_RATES.every(([ill, sens, spec]) => !(ill === 30 && sens === 90 && spec === 90)));
  const ex = H.screenCounts([30, 90, 90]);
  assert.deepEqual([ex.truePos, ex.well, ex.falsePos, ex.positives, Math.round(ex.ppv * 100)], [27, 970, 97, 124, 22]);
  const crowd = fixed('screening', 'example-count').figures[0];
  near(crowd.base, 0.03, 1e-12); near(crowd.sens, 0.9, 1e-12); near(crowd.fpr, 0.1, 1e-12);
  assert.ok(variants('substances', 'units').every((t) => !/picks up a (?:large |small )?400 ml/.test(t)));
  assert.equal(H.ukUnits(400, 10), 4);
  assert.ok(variants('substances', 'std-drinks').every((t) => !/holds \*\*20 g\*\*/.test(t)));
  assert.ok(H.HEADLINE_CASES.every(([n, base, pct]) => !(base === 80 && pct === 25) && !(base === 50 && pct === 30 && n === 1000)));
  assert.ok(variants('health-claims', 'nnt').every((t) => !/\*\*30 in 100\*\* people who did not/.test(t)));
  const twoWays = fixed('health-claims', 'teach-two-ways').figures[0];
  assert.deepEqual([riskCounts(twoWays.n, twoWays.base, twoWays.rr).withCount, riskCounts(twoWays.n, twoWays.base, twoWays.rr).extra], [100, 20]);
  const nntFig = fixed('health-claims', 'example-nnt').figures[0];
  assert.equal(riskCounts(nntFig.n, nntFig.base, nntFig.rr).withCount, 20);
  const riskFig = fixed('know-your-numbers', 'teach-risk').figures[0];
  assert.ok(riskFig.factors.every((f) => f.on) && riskFig.factors.reduce((m, f) => m * f.mult, FACTS.risk.base) === 48);
  // the day shown on the teeth screen is the solved day of the step before it
  assert.deepEqual(fixed('everyday-care', 'teach-teeth').figures[0].snacks, fixed('everyday-care', 'acid-fix').solution.snacks);

  // balance travels with the content that was moved in front of a question
  assert.ok(/mixed results/.test(flat(fixed('germs', 'face-entry').explain)));
  // Added in review: the 1998 claim is never shown without its retraction, and one study's average is not told as what "most people" do
  assert.ok(/a paper describing 12 children, since withdrawn by its journal, suggested/.test(flat(fixed('vaccines', 'autism-claim').text)));
  assert.ok(/whether or not it played any part/.test(flat(fixed('vaccines', 'autism-claim').text)));
  assert.ok(/In one large study that watched people at public sinks, the average wash lasted about six/.test(said('germs', 'teach-handwash')));
  assert.ok(/only about fifteen years/.test(flat(fixed('substances', 'vaping').text)) && /far lower levels of the main toxic chemicals/.test(flat(fixed('substances', 'vaping').text)));
  assert.ok(/health agencies weigh that differently/.test(flat(fixed('substances', 'vaping').explain)));
  assert.ok(/vitamin D/.test(flat(fixed('everyday-care', 'sun-facts').explain)), 'the sun is not only a hazard');
  assert.ok(/teaching model with rounded numbers/.test(said('know-your-numbers', 'teach-risk')));
  assert.ok(/That is information, not a commandment/.test(said('substances', 'guidance')));
  const order = lessons.substances.steps.map((s) => s.id);
  assert.ok(order.indexOf('teach-alcohol-long') < order.indexOf('guidance'), 'the guidance table still follows the long-term risks');
  // the screening lesson stays sober throughout, new screens included; elsewhere only the screens about serious illness are
  for (const stepId of ['teach-cancer', 'teach-prevention', 'teach-terms', 'example-count']) assert.equal(raw('screening', stepId).tone, 'sober');
  for (const [lesson, stepId] of [['know-your-numbers', 'teach-artery'], ['substances', 'teach-alcohol-long'], ['substances', 'teach-other-drugs']]) assert.equal(raw(lesson, stepId).tone, 'sober', stepId);
});

/* ------------------------------------------------------------------- guard */

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.slice().sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} is generated, but no test above re-derives it`);
  }
});
