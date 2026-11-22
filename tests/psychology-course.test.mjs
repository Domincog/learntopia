// Independent checks of "Psychology: How Minds Work".
//
// 1. A second, separately typed table of the course's key numbers (each with its source) is compared
//    with the tables in content/courses/psychology/helpers.js.
// 2. Every generated question is re-solved from its own wording: numbers and scenarios are parsed out of the
//    text the learner sees, and the answer is worked out again here (by brute force, by a different formula,
//    or from this file's own keyword tables).
// 3. Every interact step is fed the states its widget can reach, built here from the widgets' documented
//    rules, and must accept exactly those that satisfy the instruction.
// 4. Care: the standard note, no scoring or labelling of the learner, tone on the sober steps, pictures.
//
//   node --test tests/psychology-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import course from '../content/courses/psychology/course.js';
import * as H from '../content/courses/psychology/helpers.js';
import { simulate as pavlov } from '../src/widgets/pavlov-lab.js';
import { simulate as schedule } from '../src/widgets/schedule-lab.js';

const SEEDS = 200;
const LESSONS = ['science-of-mind', 'perception', 'conditioning', 'memory', 'thinking', 'development', 'social', 'differences'];
/** Every generated step of the course. Each one is re-derived by a test below; the last test keeps this list complete. */
const GENERATED = {
  'science-of-mind': ['hook', 'measure', 'sort-status', 'three-questions'],
  perception: ['illusion-size', 'which-effect'],
  conditioning: ['classical-name', 'quadrants', 'schedule-match'],
  memory: ['chunks', 'misinfo-kind', 'which-id'],
  thinking: ['bat-ball', 'frame', 'ppv', 'bias-name'],
  development: ['stage-pick', 'zone', 'heritability'],
  social: ['diffuse', 'fae', 'how-solid'],
  differences: ['rel-val', 'types', 'iq-calc', 'flynn'],
};
/** Every interact step, and whether its check is exercised below. */
const INTERACTS = {
  'science-of-mind': ['assign', 'drawer', 'paths'],
  perception: ['hook', 'contrast', 'change', 'stroop'],
  conditioning: ['pair', 'extinguish', 'schedules'],
  memory: ['hook', 'span', 'loftus'],
  thinking: ['hook', 'loss', 'wason', 'wason-social', 'base-rate'],
  development: ['pour', 'harlow', 'lifespan'],
  social: ['hook', 'partner', 'milgram'],
  differences: ['hook', 'ruler', 'bell'],
};
const tested = new Set();
const checked = new Set();

const lessons = {};
const rawLessons = {};
for (const id of LESSONS) {
  const mod = await import(`../content/courses/psychology/lessons/${id}.js`);
  rawLessons[id] = mod.default;
  lessons[id] = normalizeLesson(mod.default, 'psychology', id);
}
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('../content/media/psychology/manifest.json', import.meta.url)), 'utf8'));

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
const figuresOf = (step) => [...(step.figures || []), ...(step.widget ? [step.widget] : []), ...((step.options || []).map((o) => o.figure).filter(Boolean))];
/** The one entry of a keyword table that a text matches. */
const classify = (table, text, what) => {
  const hits = Object.keys(table).filter((k) => table[k].test(text));
  assert.equal(hits.length, 1, `${what}: expected exactly one match, got [${hits.join(', ')}] for: ${text}`);
  return hits[0];
};

/** Every string a learner can see in a resolved step (drawing markup and internal ids excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['content', 'type', 'id', 'viewBox', 'color', 'expr', 'mode', 'kind', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'tone', 'effect']);
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
    texts.add(text + JSON.stringify(s.items || s.pairs || ''));
    try {
      for (const str of visible(s)) assert.ok(!/undefined|NaN|\[object/.test(str), `stray value in: ${str}`);
      if (s.type === 'numeric') {
        const slips = (made.wrong || []).map((w) => Number(w[0]));
        const all = [s.answer, ...slips];
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
          assert.ok(Math.abs(all[i] - all[j]) > 2 * (s.tolerance || 0) + 1e-9, `answer and slips must differ: ${all.join(', ')}`);
        }
      }
      if (s.type === 'choice' && s.mode !== 'predict') {
        assert.equal(s.options.filter((o) => o.correct).length, 1, 'exactly one correct option');
        assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, 'no duplicate options');
        for (const o of s.options) if (!o.correct) assert.ok(o.why && o.why.length > 15, `"${o.text}" says why it is wrong`);
      }
      assert.ok(s.explain.length > 20, 'has an explanation');
      verify(s, text, made);
    } catch (err) { err.message = `${lesson}/${id} (seed ${k}): ${err.message}\n  text: ${text}`; throw err; }
  }
  return texts.size;
}
const correctText = (s) => flat(s.options.find((o) => o.correct).text);

/** Share of a normal distribution between two z-scores (Abramowitz-Stegun approximation of erf). */
function normalShare(z0, z1) {
  const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const cdf = (z) => 0.5 * (1 + erf(z / Math.SQRT2));
  return cdf(z1) - cdf(z0);
}

/* ------------------------------------------------------- 1. double entry */

// Typed in from the sources, independently of helpers.js.
const FACTS = {
  osc: { year: 2015, studies: 100, original: 97, repeat: 36 },          // Open Science Collaboration, Science 349 (2015)
  egoDepletion: { labs: 23, people: '2,141' },                             // Hagger et al. 2016
  gorillaMissed: 46,                                                      // Simons & Chabris 1999: all 192 observers, every version
  gorillaThump: { observers: 12, missed: 50 },                            // the same paper: the chest-thumping version, 12 further observers
  door: [7, 15],                                                          // Simons & Levin 1998
  stroop: { plain: 63.3, clash: 110.3, items: 100, year: 1935 },          // Stroop 1935, experiment 2
  pavlovNobel: 1904,                                                      // nobelprize.org
  albert: { year: 1920, infants: 1, pairings: 7 },                        // Watson & Rayner 1920
  lepper: { expected: 8.59, surprise: 18.09, none: 16.73 },               // Lepper, Greene & Nisbett 1973
  span: { miller: 7, cowan: 4 },                                          // Miller 1956; Cowan 2001
  drm: { lure: 'sleep', words: 15, year: 1995 },                          // Roediger & McDermott 1995
  loftus: { smashed: 40.8, collided: 39.3, bumped: 38.1, hit: 34.0, contacted: 31.8, glass: [16, 7, 6], group: 50 },   // Loftus & Palmer 1974
  mall: { n: 24, yes: 6, repeatN: 123, repeatPct: 35 },                   // Loftus & Pickrell 1995; Murphy et al. 2023
  challenger: { first: 106, again: 44, accuracy: 2.95 },                  // Neisser & Harsch 1992
  exonerations: { cleared: 375, eyewitness: 69 },                         // Innocence Project, DNA exonerations 1989-2020
  hm: { operation: 1953, died: 2008 },
  anchor: { low: 10, high: 65, lowMedian: 25, highMedian: 45, african: 54, members: 193 },   // Tversky & Kahneman 1974; un.org
  linda: 85,                                                              // Tversky & Kahneman 1983
  framing: { saved: 72, deaths: 22, people: 600, sure: 200 },             // Tversky & Kahneman 1981
  wason: { abstract: 10, social: 75 },                                    // Wason 1966; Griggs & Cox 1982
  donation: { Germany: 12, Austria: 99.98, Denmark: 4.25, Sweden: 85.9 }, // Johnson & Goldstein 2003
  nudge: { published: 8.7, all: 1.4 },                                    // DellaVigna & Linos 2022
  stages: ['sensorimotor', 'preoperational', 'concrete', 'formal'],       // Piaget
  harlow: { cloth: 17, wire: 1 },                                         // Harlow 1958
  twins: { heritability: 49, traits: 17804 },                             // Polderman et al. 2015
  marshmallow: { children: 918, year: 2018 },                             // Watts, Duncan & Quan 2018
  language: { people: 669498, age: 17 },                                  // Hartshorne, Tenenbaum & Pinker 2018
  asch: { n: 123, conformed: 36.8, ever: 75, never: 25 },                 // Asch 1956
  milgram: { men: 40, toEnd: 26, volts: 450, remote: 65, bridgeport: 47.5, room: 40, touch: 30, phone: 20.5, peers: 10 },   // Milgram 1963, 1974
  bystander: { alone: 85, one: 62, four: 31 },                            // Darley & Latané 1968
  genovese: { year: 1964, claimed: 38 },
  street: { conflicts: 219, inTen: 9 },                                   // Philpot et al. 2020
  festinger: { year: 1959, small: 1, large: 20 },
  contactStudies: 515,                                                    // Pettigrew & Tropp 2006
  forer: { students: 39, mean: 4.26, year: 1949 },                        // Forer 1949
  carlson: { astrologers: 28, year: 1985 },
  iq: { mean: 100, sd: 15, binet: 1905 },
  flynnPerDecade: 3,
  eugenics: { buckVBell: 1927, us: 60000, act: 1924, german: 1933, germany: 400000 },
  mindset: { students: 12490, gain: 0.1 },                                // Yeager et al. 2019
  weird: { western: 96, us: 68, world: 12 },                              // Arnett 2008
  bigFive: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
};

test('the helper tables agree with an independent table of the key facts', () => {
  assert.deepEqual([H.OSC.year, H.OSC.studies, H.OSC.originalSig, H.OSC.replicationSig], [FACTS.osc.year, FACTS.osc.studies, FACTS.osc.original, FACTS.osc.repeat]);
  const ego = H.FINDINGS.find((f) => f.id === 'ego');
  assert.ok(ego.note.includes(FACTS.egoDepletion.people) && /Twenty-three/.test(ego.note));
  assert.equal(H.GORILLA.missed, FACTS.gorillaMissed);
  assert.deepEqual([H.GORILLA.thumpObservers, H.GORILLA.thumpMissed], [FACTS.gorillaThump.observers, FACTS.gorillaThump.missed]);
  assert.deepEqual([H.DOOR.noticed, H.DOOR.of], FACTS.door);
  assert.deepEqual([H.STROOP.plain, H.STROOP.clash, H.STROOP.items, H.STROOP.year], [FACTS.stroop.plain, FACTS.stroop.clash, FACTS.stroop.items, FACTS.stroop.year]);
  assert.equal(H.PAVLOV.nobel, FACTS.pavlovNobel);
  assert.match(H.PAVLOV.field, /digestion/);
  assert.deepEqual([H.ALBERT.year, H.ALBERT.infants, H.ALBERT.pairings], [FACTS.albert.year, FACTS.albert.infants, FACTS.albert.pairings]);
  assert.deepEqual([H.LEPPER.expected, H.LEPPER.surprise, H.LEPPER.none], [FACTS.lepper.expected, FACTS.lepper.surprise, FACTS.lepper.none]);
  assert.deepEqual([H.SPAN.miller, H.SPAN.cowan], [FACTS.span.miller, FACTS.span.cowan]);
  assert.equal(H.DRM.lure, FACTS.drm.lure);
  assert.equal(H.DRM.words.length, FACTS.drm.words);
  assert.ok(!H.DRM.words.includes(H.DRM.lure), 'the lure is not on the study list');
  assert.ok(H.DRM.test.studied.every((w) => H.DRM.words.includes(w)), 'the "studied" test words really were studied');
  assert.ok(H.DRM.test.other.every((w) => !H.DRM.words.includes(w) && w !== H.DRM.lure), 'the unrelated test words were not studied');
  assert.equal(new Set(H.DRM.words).size, H.DRM.words.length);
  for (const [verb, mph] of H.LOFTUS.speeds) assert.equal(mph, FACTS.loftus[verb], verb);
  assert.deepEqual([H.LOFTUS.glass.smashed, H.LOFTUS.glass.hit, H.LOFTUS.glass.control, H.LOFTUS.glass.group], [...FACTS.loftus.glass, FACTS.loftus.group]);
  assert.deepEqual([H.MALL.participants, H.MALL.remembered, H.MALL.repeatN, H.MALL.repeatPct], [FACTS.mall.n, FACTS.mall.yes, FACTS.mall.repeatN, FACTS.mall.repeatPct]);
  assert.deepEqual([H.FLASHBULB.first, H.FLASHBULB.retested, H.FLASHBULB.accuracy], [FACTS.challenger.first, FACTS.challenger.again, FACTS.challenger.accuracy]);
  assert.deepEqual([H.EXONERATIONS.cleared, H.EXONERATIONS.eyewitnessPct], [FACTS.exonerations.cleared, FACTS.exonerations.eyewitness]);
  assert.deepEqual([H.HM.operation, H.HM.died], [FACTS.hm.operation, FACTS.hm.died]);
  assert.deepEqual([H.ANCHOR.low, H.ANCHOR.high, H.ANCHOR.lowMedian, H.ANCHOR.highMedian, H.ANCHOR.african, H.ANCHOR.members], Object.values(FACTS.anchor));
  assert.equal(H.LINDA.pct, FACTS.linda);
  assert.deepEqual([H.FRAMING.gainSure, H.FRAMING.lossSure, H.FRAMING.people, H.FRAMING.sure], Object.values(FACTS.framing));
  assert.deepEqual([H.WASON.abstractPct, H.WASON.socialPct], [FACTS.wason.abstract, FACTS.wason.social]);
  const rates = Object.fromEntries([...H.DONATION.optIn, ...H.DONATION.optOut]);
  for (const [country, pctIn] of Object.entries(FACTS.donation)) assert.equal(rates[country], pctIn, country);
  assert.ok(H.DONATION.optIn.every(([, v]) => v < 30) && H.DONATION.optOut.every(([, v]) => v > 85));
  assert.deepEqual([H.NUDGE.published, H.NUDGE.allTrials], [FACTS.nudge.published, FACTS.nudge.all]);
  assert.deepEqual(H.STAGES.map((s) => s.id), FACTS.stages);
  assert.deepEqual([H.HARLOW.cloth, H.HARLOW.wire], [FACTS.harlow.cloth, FACTS.harlow.wire]);
  assert.deepEqual([H.TWINS.heritability, H.TWINS.traits], [FACTS.twins.heritability, FACTS.twins.traits]);
  assert.deepEqual([H.MARSHMALLOW.children, H.MARSHMALLOW.year], [FACTS.marshmallow.children, FACTS.marshmallow.year]);
  assert.deepEqual([H.LANGUAGE.people, H.LANGUAGE.declineAge], [FACTS.language.people, FACTS.language.age]);
  assert.deepEqual([H.ASCH.participants, H.ASCH.conformedPct, H.ASCH.everShare, H.ASCH.neverShare], Object.values(FACTS.asch));
  assert.deepEqual([H.MILGRAM.men, H.MILGRAM.toEnd, H.MILGRAM.volts], [FACTS.milgram.men, FACTS.milgram.toEnd, FACTS.milgram.volts]);
  for (const v of H.MILGRAM.variations) assert.equal(v.pct, FACTS.milgram[v.id], v.id);
  assert.equal(Math.round((FACTS.milgram.toEnd / FACTS.milgram.men) * 100), FACTS.milgram.remote, '26 of 40 is 65%');
  assert.deepEqual([H.BYSTANDER.alone, H.BYSTANDER.oneOther, H.BYSTANDER.fourOthers], Object.values(FACTS.bystander));
  assert.deepEqual([H.GENOVESE.year, H.GENOVESE.claimed], Object.values(FACTS.genovese));
  assert.deepEqual([H.STREET.conflicts, H.STREET.helpedInTen], Object.values(FACTS.street));
  assert.deepEqual([H.SOCIAL_YEARS.festinger, H.SOCIAL_YEARS.small, H.SOCIAL_YEARS.large], Object.values(FACTS.festinger));
  assert.equal(H.SOCIAL_YEARS.contactStudies, FACTS.contactStudies);
  assert.deepEqual([H.FORER.students, H.FORER.mean, H.FORER.year], Object.values(FACTS.forer));
  assert.deepEqual([H.CARLSON.astrologers, H.CARLSON.year], Object.values(FACTS.carlson));
  assert.deepEqual([H.IQ.mean, H.IQ.sd, H.IQ.binet], Object.values(FACTS.iq));
  // the shares quoted for the bell curve follow from the normal distribution
  near(normalShare(-1, 1) * 100, H.IQ.within1, 0.5, 'within one SD');
  near(normalShare(-2, 2) * 100, H.IQ.within2, 0.6, 'within two SDs');
  near(normalShare(2, 9) * 100, H.IQ.above130, 0.1, 'above 130');
  assert.equal(H.FLYNN.perDecade, FACTS.flynnPerDecade);
  assert.deepEqual([H.EUGENICS.buckVBell, H.EUGENICS.usSterilised, H.EUGENICS.immigrationAct, H.EUGENICS.germanLaw, H.EUGENICS.germanSterilised], Object.values(FACTS.eugenics));
  assert.deepEqual([H.MINDSET.students, H.MINDSET.gain], Object.values(FACTS.mindset));
  assert.deepEqual([H.WEIRD.westernPct, H.WEIRD.usPct, H.WEIRD.worldShare], Object.values(FACTS.weird));
  assert.deepEqual(H.BIG_FIVE.map((p) => p[0]), FACTS.bigFive);
  // every fact table in helpers.js carries an [S] or [K] mark nearby
  const source = readFileSync(fileURLToPath(new URL('../content/courses/psychology/helpers.js', import.meta.url)), 'utf8');
  assert.ok((source.match(/\[S[\],;: ]/g) || []).length >= 15 && (source.match(/\[K[\],;: ]/g) || []).length >= 15, 'facts are marked [S] or [K]');
});

test('numbers quoted in fixed text follow from the tables', () => {
  // Stroop: "74% longer"
  assert.equal(Math.round(((FACTS.stroop.clash - FACTS.stroop.plain) / FACTS.stroop.plain) * 100), 74);
  assert.match(flat(fixed('perception', 'stroop').explain), /63\.3 seconds .* 110\.3 seconds .* 74% longer/);
  // Loftus: about 41 against about 32, "nine more"; 32% and 14% saw glass
  const lof = flat(fixed('memory', 'loftus').explain);
  assert.match(lof, /About \*\*41 mph\*\*: nine more/);
  assert.equal(Math.round(FACTS.loftus.smashed) - Math.round(FACTS.loftus.contacted), 9);
  assert.ok(lof.includes('32% of the "smashed" group') && lof.includes('against 14%'), lof);
  assert.equal(Math.round((16 / 50) * 100), 32);
  assert.equal(Math.round((7 / 50) * 100), 14);
  assert.match(flat(fixed('memory', 'loftus').text), /about 32 miles per hour/);
  // lost in the mall: 6 of 24 is 25%
  const mall = fixed('memory', 'mall');
  assert.equal(mall.answer, 25);
  assert.match(flat(mall.explain), /\*\*25%\*\*: 6 of 24/);
  // anchoring: 54 of 193 is 28%
  assert.equal(Math.round((54 / 193) * 100), 28);
  assert.match(flat(fixed('thinking', 'hook').explain), /true figure is 28%: 54 of 193/);
  // prospect theory: 100^0.88 = 58 (rounded), and twice that is 115
  assert.equal(Math.round(100 ** 0.88), 58);
  assert.equal(Math.round(2 * 100 ** 0.88), 115);
  assert.match(flat(fixed('thinking', 'loss').explain), /feels like −115 .* feels like \+58/);
  // the screening picture: 10 ill, 9 found, 89 false alarms, 9 of 98
  const br = fixed('thinking', 'base-rate');
  const w = br.widget;
  const ill = Math.round(w.n * w.base);
  const hit = Math.round(ill * w.sens);
  const alarms = Math.round((w.n - ill) * w.fpr);
  assert.deepEqual([ill, hit, alarms, hit + alarms], [10, 9, 89, 98]);
  assert.match(flat(br.explain), /10 have the condition and 9 of them test positive\. But 89 of the 990 .* of 98 positives only 9 are real: \*\*about 9%\*\*/);
  assert.equal(Math.round((hit / (hit + alarms)) * 100), 9);
  // Milgram: 26 of 40 is 65%; Asch: about 37%
  assert.match(flat(fixed('social', 'milgram').explain), /\*\*26 of the 40: 65%\*\*/);
  assert.deepEqual(fixed('social', 'milgram').solution, { values: [[65]] });
  // (teach-first revision: Asch's and Darley and Latané's results are now presented on teaching screens with a bar
  //  chart; the Asch slider asks for the other half of the result, the rounds on which people did not go along)
  assert.match(flat(fixed('social', 'teach-asch').text), /Across 123 participants, people went along with the group on \*\*about 37%\*\*.*About 75% went along at least once, and about 25% never did/);
  assert.deepEqual(fixed('social', 'teach-asch').figures[0].data.map((d) => d.value), [1, Math.round(FACTS.asch.conformed)]);
  assert.equal(fixed('social', 'asch-numbers').answer, 100 - 37);
  assert.ok(fixed('social', 'asch-numbers').graded && fixed('social', 'asch-numbers').tolerance <= 3);
  assert.deepEqual(fixed('social', 'bystander').figures[0].data.map((d) => d.value), [FACTS.bystander.alone, FACTS.bystander.one, FACTS.bystander.four]);
  assert.match(flat(fixed('social', 'bystander').text), /85% went\. With one other listener it was 62%, and with four others 31%/);
  // Burger's partial repeat: the two shares in the chart are the ones in the reviewed helper note
  assert.deepEqual(fixed('social', 'teach-milgram-reading').figures[0].data.map((d) => d.value), [82.5, 70]);
  assert.match(readFileSync(fileURLToPath(new URL('../content/courses/psychology/helpers.js', import.meta.url)), 'utf8'), /\[S, reviewer\] Burger 2009: 70% were prepared to go on past 150 volts, against 82\.5% in Milgram's comparable version/);
  // (second review of the teaching screens) the Asch question says which rounds it counts, so that 63 is the only
  // reading; Burger's 70% against 82.5% is not a significant difference, and the screen says so, so that the graded
  // statement "about as willing to continue" follows from it; Fischhoff's effect is not called "far" larger
  assert.match(flat(fixed('social', 'asch-numbers').text), /Count only the rounds on which the rest of the group agreed on a wrong answer\. \*\*On what percentage of those rounds/);
  assert.match(flat(fixed('social', 'teach-milgram-reading').text), /against 82\.5% in Milgram's comparable version: a gap small enough, in groups of that size, to be chance\./);
  assert.ok(fixed('social', 'milgram-read').options.some((o) => o.correct && /about as willing to continue as in Milgram's day/.test(o.text)));
  assert.match(flat(fixed('science-of-mind', 'teach-hindsight').text), /rated that outcome as more predictable than people who had not been told/);
  assert.ok(!/far more predictable/.test(flat(fixed('science-of-mind', 'teach-hindsight').text)));
  assert.equal(fixed('science-of-mind', 'osc').answer, FACTS.osc.repeat);
  // the question describes the chest-thumping version, so its figure is the key; the pooled 46% is given as such
  assert.equal(fixed('perception', 'gorilla').answer, FACTS.gorillaThump.missed);
  assert.match(flat(fixed('perception', 'gorilla').text), /thumped their chest/);
  assert.match(flat(fixed('perception', 'gorilla').explain), /shown to only 12 viewers; across all 192 viewers and every version of the film, 46% missed/);
  assert.ok(Math.abs(FACTS.gorillaMissed - fixed('perception', 'gorilla').answer) <= fixed('perception', 'gorilla').tolerance, 'the pooled figure is accepted too');
  assert.equal(fixed('differences', 'weird').answer, FACTS.weird.western);
  // Lepper: "about half as much"
  near(FACTS.lepper.expected / FACTS.lepper.surprise, 0.5, 0.05);
  near(FACTS.lepper.expected / FACTS.lepper.none, 0.5, 0.05);
  // the file drawer: three of the forty tiles are below 0.05; the grid of analyses has two
  const drawer = fixed('science-of-mind', 'drawer').widget.p;
  assert.equal(drawer.length, 40);
  assert.equal(drawer.filter((p) => p < 0.05).length, 3);
  assert.match(flat(fixed('science-of-mind', 'drawer').explain), /Three studies.*37 in a drawer/);
  const paths = fixed('science-of-mind', 'paths').widget;
  const hits = [];
  paths.p.forEach((row, r) => row.forEach((p, c) => { if (p < 0.05) hits.push(`${paths.cols[c]} in ${paths.rows[r]}`); }));
  assert.deepEqual(hits, ['Reaction in Men', 'Mood in Under 30']);
  // the predict sliders are never exact-or-nothing
  for (const [l, id] of [['science-of-mind', 'osc'], ['perception', 'gorilla'], ['memory', 'mall'], ['differences', 'weird']]) {
    const s = fixed(l, id);
    assert.ok(s.mode === 'predict' && s.tolerance >= 5, `${l}/${id}`);
  }
});

/* ------------------------------------------------ 2. generated questions */

test('science of mind: generated steps', () => {
  const REVERSED = { education: /Better-educated soldiers had more nervous breakdowns/, country: /countryside kept their spirits up better/, home: /more eager to go home while the fighting lasted/ };
  const TRUE = { education: /fewer/, country: /cities/, home: /after the surrender/ };
  const n1 = eachVariant('science-of-mind', 'hook', (s, text) => {
    assert.equal(s.mode, 'predict');
    assert.equal(s.options.filter((o) => o.correct).length, 0, 'an opinion poll: no option is "right"');
    const which = classify(REVERSED, text, 'finding');
    assert.match(flat(s.explain), /found the \*\*opposite\*\*/);
    assert.match(flat(s.explain), TRUE[which]);
  }, 60);
  assert.equal(n1, 3);

  const GOOD = { 'Lack of sleep': /snap at a partner .* 4 hours .* 8/, 'Music helps': /sums solved .* with music and in silence/, 'Praise makes': /keep working .* after being praised, and after no comment/, 'Crowds make': /1 onlooker and with 5/, 'Phones distract': /braking time with and without/ };
  eachVariant('science-of-mind', 'measure', (s, text) => {
    const idea = Object.keys(GOOD).find((k) => text.includes(`"${k}`));
    assert.ok(idea, 'the idea is quoted');
    assert.match(correctText(s), GOOD[idea]);
    // the right plan compares two conditions; the others do not
    for (const o of s.options) assert.equal(/ and | with and without/.test(o.text) && /Count|Compare|Time|measure|Stage/.test(o.text), !!o.correct, o.text);
  }, 80);

  const STATUS = {
    failed: /power pose|Willpower is a fuel|old age|pen between your teeth|Listening to Mozart/,
    held: /Stroop|anchoring|Testing yourself|go along with a group|Misleading questions/,
  };
  eachVariant('science-of-mind', 'sort-status', (s) => {
    assert.deepEqual(s.buckets, ['Held up when repeated', 'Failed, or shrank to almost nothing']);
    assert.equal(s.items.length, 6);
    for (const it of s.items) assert.equal(it.bucket, classify(STATUS, it.text, 'finding') === 'held' ? 0 : 1, it.text);
    assert.equal(s.items.filter((it) => it.bucket === 0).length, 3);
    assert.ok(s.items.every((it) => it.why));
  });
  assert.deepEqual(H.FINDINGS.map((f) => classify(STATUS, f.name, 'finding')), H.FINDINGS.map((f) => f.status));

  eachVariant('science-of-mind', 'three-questions', (s, text) => {
    const sizes = [...text.matchAll(/(\d[\d,]*) (?:students|volunteers|people|pupils|workers)/g)].map((m) => number(m[1]));
    assert.ok(sizes.length >= 1 && sizes.every((v) => v === sizes[0]), `one group size in: ${text}`);
    const noComparison = /Nobody without the app was measured|No other pupils were tested/.test(text);
    const notRepeated = /Nobody has run the study again|only study of its kind/.test(text);
    const tiny = sizes[0] < 30;
    assert.equal([noComparison, notRepeated, tiny].filter(Boolean).length, 1, 'exactly one weakness');
    if (!noComparison) assert.match(text, /by lot|coin toss/);
    if (!notRepeated) assert.match(text, /found the same|reports the same|have since found/);
    if (!tiny) assert.ok(sizes[0] >= 200);
    const want = noComparison ? 'Compared with what?' : notRepeated ? 'Has anyone repeated it?' : 'How many people?';
    assert.equal(correctText(s), want);
    assert.ok(s.explain.includes(want));
    assert.deepEqual(s.options.map((o) => o.text), ['How many people?', 'Compared with what?', 'Has anyone repeated it?']);
  });
});

test('perception: generated steps', () => {
  eachVariant('perception', 'illusion-size', (s, text) => {
    const [truth] = grab(/plain line of (\d+) mm/, text).map(number);
    const [setting] = grab(/line is ([\d.]+) mm long/, text).map(number);
    assert.ok(setting < truth && Number.isInteger(setting));
    near(s.answer, ((truth - setting) / truth) * 100, 1e-9, 'illusion size');
    assert.ok(s.answer >= 5 && s.answer <= 25, 'a plausible size');
    assert.ok(s.explain.includes(`${truth} − ${setting} = ${truth - setting} mm`) && s.explain.includes(`= ${s.answer}%`));
    for (const [v] of s.wrong) assert.ok(Math.abs(v - s.answer) > 0.04);
  });

  const EFFECT = {
    'Inattentional blindness': /radiologist|cyclist rides|umbrella/,
    'Change blindness': /scarf disappears|carry a door|flick back and forth/,
    'Stroop interference': /LEFT with an arrow|how many digits|printed in red ink/,
    'The cocktail-party effect': /café|headphones/,
  };
  const n = eachVariant('perception', 'which-effect', (s, text) => {
    assert.equal(correctText(s), classify(EFFECT, text, 'scenario'));
    assert.equal(s.options.length, 4);
  });
  assert.equal(n, H.ATTENTION_CASES.length);
});

test('conditioning: generated steps', () => {
  const TERM = {
    Acquisition: /comes running at the sound|tenses up at the whine|buzz by itself brings/,
    Extinction: /stops coming|gets weaker each time|drooling dies away/,
    'Spontaneous recovery': /after a weekend with no bell|brings a little of the feeling back/,
    Generalisation: /anything else that buzzes|slightly higher note|ponies and donkeys/,
  };
  const n = eachVariant('conditioning', 'classical-name', (s, text) => assert.equal(correctText(s), classify(TERM, text, 'scenario')));
  assert.equal(n, H.CLASSICAL_CASES.length);

  eachVariant('conditioning', 'quadrants', (s) => {
    assert.deepEqual(s.buckets, ['Positive reinforcement', 'Negative reinforcement', 'Punishment']);
    assert.equal(s.items.length, 6);
    for (const it of s.items) {
      // read the item: does the behaviour go up or down, and was something unpleasant removed?
      const less = /\b(less|stays off)\b/.test(it.text);
      const relief = /beeps until|headache goes|whining stops|brings relief/.test(it.text);
      assert.equal(it.bucket, less ? 2 : relief ? 1 : 0, it.text);
      assert.ok(it.why.length > 20);
    }
    for (const b of [0, 1, 2]) assert.equal(s.items.filter((it) => it.bucket === b).length, 2);
  });
  for (const c of H.CONSEQUENCES) assert.equal(/\b(more|faster|sooner)\b/.test(c.text), c.bucket !== 2, c.text);

  const SCHEDULE = {
    'Fixed ratio': /every tenth one|every 20 shirts|every five lessons/,
    'Variable ratio': /slot machine|Scratch cards|trading cards/,
    'Fixed interval': /every Friday|every Monday|every hour on the hour/,
    'Variable interval': /message has arrived|Fishing|parcel van/,
  };
  eachVariant('conditioning', 'schedule-match', (s) => {
    assert.equal(s.pairs.length, 4);
    for (const [example, right] of s.pairs) assert.ok(right.startsWith(`${classify(SCHEDULE, example, 'example')}:`), `${example} → ${right}`);
    assert.equal(new Set(s.pairs.map((p) => p[1])).size, 4);
  });
});

test('memory: generated steps', () => {
  eachVariant('memory', 'chunks', (s, text, made) => {
    const [digits] = grab(/\*\*([\d ]+)\*\*/, text);
    const count = digits.replace(/\s/g, '').length;
    const [list] = grab(/Read as the years ([\d, ]+), it is/, flat(made.template));
    const years = list.split(',').map((y) => y.trim());
    assert.equal(years.join(''), digits.replace(/\s/g, ''), 'the years spell the digits');
    assert.equal(s.blanks.length, 2);
    assert.deepEqual(s.blanks.map((b) => b.numbers[0]), [count, years.length]);
    assert.ok(count > 9, 'more digits than working memory holds');
    assert.ok(s.explain.includes(`${count} digits`) && s.explain.includes(`${years.length} meaningful units`));
  });

  const MEM = {
    'The misinformation effect': /reads in the paper|passed the stop sign|talk it over/,
    'A false memory by association': /thread, pin|sour, candy/,
    'A flashbulb memory': /diary shows|wrote the morning after/,
    'Reconstruction from expectation': /books on the shelves|canoes with boats/,
  };
  const n = eachVariant('memory', 'misinfo-kind', (s, text) => assert.equal(correctText(s), classify(MEM, text, 'scenario')));
  assert.equal(n, H.MEMORY_CASES.length);

  eachVariant('memory', 'which-id', (s, text) => {
    assert.equal(s.tone, 'sober');
    const [a] = grab(/\*\*Witness A\*\* (.*?)\. - \*\*Witness B\*\*/, text);
    const [b] = grab(/\*\*Witness B\*\* (.*?)\. \*\*According/, text);
    // contaminated: confidence that arrived later, after feedback, or after a second viewing
    const tainted = (d) => /a year later|after the detective replied|picked nobody from the first/.test(d);
    const clean = (d) => /first line-up|first, properly run line-up/.test(d) && /certain|sure|confidently/.test(d) && !tainted(d);
    assert.ok(tainted(a) !== tainted(b) && clean(a) !== clean(b), 'one clean first identification, one contaminated');
    assert.equal(correctText(s), clean(a) ? 'Witness A' : 'Witness B');
    assert.ok(s.explain.includes(`Witness ${clean(a) ? 'A' : 'B'}.`));
    assert.deepEqual(s.options.map((o) => o.text).slice(0, 2), ['Witness A', 'Witness B']);
  });
});

test('thinking: generated steps', () => {
  eachVariant('thinking', 'bat-ball', (s, text) => {
    const [total] = grab(/cost \*\*(\d+) cents\*\* together/, text).map(number);
    const [more] = grab(/costs \*\*(\d+) cents more\*\*/, text).map(number);
    const solutions = [];
    for (let x = 0; x <= total; x++) if (x + (x + more) === total) solutions.push(x);
    assert.deepEqual(solutions, [s.answer]);
    assert.equal(s.wrong[0][0], total - more, 'the intuitive slip');
    assert.ok(s.explain.includes(`${s.answer} + ${s.answer + more} = ${total}`));
    assert.ok(s.wrong[0][1].includes(`${2 * (total - more) + more} cents, not ${total}`));
  });

  const nFrames = eachVariant('thinking', 'frame', (s, text) => {
    assert.equal(s.mode, 'predict');
    assert.equal(s.tone, 'sober');
    assert.equal(s.options.filter((o) => o.correct).length, 0, 'no right answer');
    const gain = /will be saved\.\*\*/.test(text) && !/will die\.\*\*/.test(text);
    const [people] = grab(/expected to kill (\d+) people/, text).map(number);
    const [sure] = grab(gain ? /A:\*\* \*\*(\d+) people will be saved/ : /A:\*\* \*\*(\d+) people will die/, text).map(number);
    assert.equal(people, FACTS.framing.people);
    assert.equal(gain ? sure : people - sure, FACTS.framing.sure, 'the sure option always leaves 200 alive');
    near(people / 3, FACTS.framing.sure, 1e-9, 'the gamble has the same expected outcome');
    const shares = s.options.map((o) => number(grab(/^(\d+)%/, o.why)[0]));
    assert.deepEqual(shares, gain ? [72, 28] : [22, 78]);
    assert.match(flat(s.explain), /lives \*\*saved\*\*, 72% chose it\. Worded as \*\*deaths\*\*, 22% did/);
    assert.match(flat(s.explain), /200 of 600 live either way/);
  }, 120);
  assert.equal(nFrames, 6);

  eachVariant('thinking', 'ppv', (s, text) => {
    const [have, hit] = grab(/- (\d+) [a-z ]+, and (\d+) of those/, text).map(number);
    const [others, alarms] = grab(/of the other (\d+), (\d+) also/, text).map(number);
    assert.equal(have + others, 1000);
    assert.ok(hit <= have && alarms <= others);
    near(s.answer, (hit / (hit + alarms)) * 100, 1e-9, 'share of the flagged that really have it');
    assert.equal(s.tolerance, 0.5);
    assert.equal(s.wrong[0][0], Math.round((hit / have) * 100), 'the slip is the hit rate');
    assert.ok(s.explain.includes(`${hit} + ${alarms} = ${hit + alarms}`) && s.explain.includes(`= ${s.answer}%`));
    assert.match(text, /One of the \w+ (who|that) /);
  });

  const BIAS = {
    Anchoring: /was 300, now 150|taller than 300 metres|names the first figure/,
    'The availability shortcut': /plane crash|start with K|shark attacks/,
    'The sunk-cost trap': /paid for the ticket|four years into it|so as not to "waste"/,
    'Confirmation bias': /did not wave|took it and got better|same mixed evidence/,
    'A framing effect': /80% lean|90% survival rate/,
  };
  const n = eachVariant('thinking', 'bias-name', (s, text) => assert.equal(correctText(s), classify(BIAS, text, 'scenario')));
  assert.equal(n, H.BIAS_CASES.length);
});

test('development: generated steps', () => {
  const STAGE = {
    Sensorimotor: /rattle|covered by a cloth|lifts a cushion/,
    Preoperational: /Moon follows|pretend soup|row of five coins/,
    'Concrete operational': /flattened ball of clay|stamp collection|sticks from shortest/,
    'Formal operational': /four liquids|no need for sleep|algebra/,
  };
  const AGES = { Sensorimotor: 'birth to about 2', Preoperational: 'about 2 to 7', 'Concrete operational': 'about 7 to 11', 'Formal operational': 'about 11 onwards' };
  eachVariant('development', 'stage-pick', (s) => {
    assert.equal(s.pairs.length, 4);
    for (const [behaviour, right] of s.pairs) { const st = classify(STAGE, behaviour, 'behaviour'); assert.equal(right, `${st} (${AGES[st]})`); }
    assert.equal(new Set(s.pairs.map((p) => p[1])).size, 4);
  });

  eachVariant('development', 'zone', (s, text) => {
    const [child, alone] = grab(/(\w+) can (.*?) without help\./, text);
    const [helped] = grab(new RegExp(`without help\\. ${child} can (.*?)\\. ${child} cannot yet`), text);
    const [beyond] = grab(new RegExp(`${child} cannot yet (.*?), even with help`), text);
    assert.equal(correctText(s), `To ${helped}`);
    assert.deepEqual(s.options.map((o) => o.text).sort(), [`To ${alone}`, `To ${helped}`, `To ${beyond}`].sort());
    assert.match(helped, /with|while|when/, 'the middle task is the one done with support');
  });

  const TRAIT = { height: 80, 'reading ability': 60, sociability: 45, 'blood pressure': 50 };
  eachVariant('development', 'heritability', (s, text) => {
    const [trait, pctText] = grab(/heritability of \*\*(.*?)\*\* is about (\d+)%/, text);
    assert.equal(number(pctText), TRAIT[trait]);
    const right = correctText(s);
    assert.ok(right.includes(`${pctText}% of the differences between people in that population`), right);
    for (const o of s.options) if (!o.correct) assert.ok(!/differences between people/.test(o.text));
    assert.match(flat(s.explain), /average of about 49%/);
  });
});

test('social: generated steps', () => {
  eachVariant('social', 'diffuse', (s, text) => {
    assert.equal(s.tone, 'sober');
    const [task] = grab(/Someone needs to (.*?)\./, text);
    const right = correctText(s);
    assert.match(right, /^Look at one person and say: "You, (in|with) the [a-z ]+: /);
    assert.ok(right.includes(`${task} now`));
    const wrong = s.options.filter((o) => !o.correct).map((o) => o.text);
    assert.ok(wrong.some((t) => t.includes(`"Somebody ${task}!"`)) && wrong.some((t) => /^Say nothing/.test(t)));
    assert.match(flat(s.explain), /\*\*one person\*\* and give them \*\*one job\*\*/);
  });

  eachVariant('social', 'fae', (s, text) => {
    assert.match(text, /selfish|shy|lazy|rude/, 'the first explanation is about character');
    assert.match(correctText(s), /overrate character and underrate the situation/);
    assert.match(flat(s.explain), /fundamental attribution error/);
    assert.match(flat(s.explain), /hospital|first day|been ill|short of staff/, 'a situational explanation is offered');
  }, 60);

  const SOLID = {
    0: /plainly wrong \(Asch\)|laboratory bystander effect|Contact between groups|formed at random/,
    1: /Stanford prison|Thirty-eight witnesses|implicit bias|stereotype threat/,
  };
  eachVariant('social', 'how-solid', (s) => {
    assert.deepEqual(s.buckets, ['Well supported', 'Weaker than its fame']);
    assert.equal(s.items.length, 6);
    for (const it of s.items) assert.equal(String(it.bucket), classify(SOLID, it.text, 'claim'), it.text);
    assert.equal(s.items.filter((it) => it.bucket === 0).length, 3);
  });
});

test('differences: generated steps', () => {
  const KIND = {
    'Reliable, but not valid': /3 kg too much|shoe size|how fast people can type/,
    'Neither reliable nor valid': /mood ring|different "love type"|different temperature each time/,
    'Reliable and valid': /reading test|183 cm|500 g/,
  };
  const n = eachVariant('differences', 'rel-val', (s, text) => {
    const kind = classify(KIND, text, 'case');
    assert.equal(correctText(s), kind);
    // read the case: does the result repeat, and is it right?
    const repeats = /every single time|always gives the same result|almost the same each time|nearly the same score|every time|each time a 500 g/.test(text) && !/different/.test(text);
    assert.equal(repeats, kind !== 'Neither reliable nor valid', 'repeatability decides reliability');
    assert.deepEqual(s.options.map((o) => o.text), ['Reliable and valid', 'Reliable, but not valid', 'Neither reliable nor valid']);
  });
  assert.equal(n, H.MEASURE_CASES.length);

  eachVariant('differences', 'types', (s, text) => {
    const people = [...text.matchAll(/(\p{L}+) scores \*\*(\d+)\*\*/gu)].map((m) => ({ name: m[1], score: number(m[2]) }));
    assert.equal(people.length, 3);
    const label = (p) => (p.score > 50 ? 'E' : 'I');
    assert.ok(people.every((p) => p.score !== 50));
    const same = [];
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (label(people[i]) === label(people[j])) same.push(`${people[i].name} and ${people[j].name}`);
    assert.equal(same.length, 1);
    assert.equal(correctText(s), same[0]);
    // the two who share a label are much further apart than the two who do not
    const sorted = people.map((p) => p.score).sort((a, b) => a - b);
    assert.ok(sorted[1] - sorted[0] <= 6 && sorted[2] - sorted[1] >= 30);
    assert.ok(s.explain.includes(`${sorted[1] - sorted[0]} points from`) && s.explain.includes(`${sorted[2] - sorted[1]} from`));
  });

  eachVariant('differences', 'iq-calc', (s, text) => {
    const [mean] = grab(/average of \*\*(\d+)\*\*/, text).map(number);
    const [sd] = grab(/standard deviation of \*\*(\d+)\*\*/, text).map(number);
    let z0 = -9;
    let z1 = 9;
    const between = /score between (\d+) and (\d+)\?/.exec(text);
    if (between) { z0 = (number(between[1]) - mean) / sd; z1 = (number(between[2]) - mean) / sd; }
    else if (/score above/.test(text)) z0 = (number(grab(/score above (\d+)\?/, text)[0]) - mean) / sd;
    else z1 = (number(grab(/score below (\d+)\?/, text)[0]) - mean) / sd;
    assert.ok([z0, z1].every((z) => Math.abs(z) === 9 || Math.abs(Math.abs(z) - Math.round(Math.abs(z))) < 1e-9), 'limits sit a whole number of SDs from the average');
    near(s.answer, normalShare(z0, z1) * 100, 0.6, 'share under the bell curve');
    assert.equal(s.tolerance, 0.5);
    for (const [v] of s.wrong) assert.ok(Math.abs(v - s.answer) > 1);
  });

  eachVariant('differences', 'flynn', (s, text) => {
    const [rate] = grab(/about \*\*(\d+) points per decade\*\*/, text).map(number);
    const [decades] = grab(/set \*\*(\d+) decades ago\*\*/, text).map(number);
    assert.equal(rate, FACTS.flynnPerDecade);
    assert.equal(s.answer, 100 + rate * decades);
    assert.equal(s.wrong[0][0], 100 - rate * decades);
    assert.ok(s.explain.includes(`${decades} × ${rate} = ${rate * decades} points`));
  }, 60);
});

/* ---------------------------------------------------- 3. interact steps */

const check = (lesson, id) => { checked.add(`${lesson}/${id}`); const s = fixed(lesson, id); assert.equal(typeof s.check === 'function' || !!s.target, true, `${lesson}/${id} has a check`); return s; };
const ok = (v) => v === true;

test('experiments on the learner: finished or not, and nothing else', () => {
  // each of these steps is complete when the demonstration has been run to its end, whatever the learner did in it
  const cases = [
    ['perception', 'hook', (revealed) => ({ kind: 'muller-lyer', value: 150, truth: 200, error: -25, moved: true, revealed })],
    ['perception', 'contrast', (revealed) => ({ kind: 'contrast', value: 50, truth: 50, error: 0, moved: true, revealed })],
    ['perception', 'change', (done) => ({ started: true, found: false, revealed: done, done, cycles: 3, misses: 1, seconds: 4 })],
    ['perception', 'stroop', (done) => ({ done, version: 'count', block: done ? 2 : 1, times: [5, done ? 4 : null], cost: done ? -20 : null, slips: [0, 3] })],
    ['memory', 'hook', (done) => ({ phase: done ? 'done' : 'test', done, picks: [], pickedLure: false, hits: 0, falseAlarms: 0 })],
    ['memory', 'span', (done) => ({ done, round: done ? 4 : 2, best: 0, results: [] })],
    ['thinking', 'hook', (done) => ({ spun: true, anchor: 10, side: 'higher', estimate: done ? 90 : null, revealed: done, done })],
    ['social', 'hook', (done) => ({ round: done ? 6 : 5, done, answers: [0, 0, 0, 0, 0], critical: 3, withGroup: 3, right: 0, ally: false })],
    ['social', 'partner', (done) => ({ round: done ? 3 : 1, done, answers: [1], critical: 2, withGroup: 0, right: 1, ally: true })],
    ['differences', 'hook', (done) => ({ picked: 3, built: true, rated: false, revealed: done, builds: 1, done })],
  ];
  for (const [lesson, id, state] of cases) {
    const s = check(lesson, id);
    assert.equal(s.graded, false, `${lesson}/${id} is an experiment, not a graded question`);
    assert.equal(ok(s.check(state(true))), true, `${lesson}/${id}: accepted once finished, whatever the outcome`);
    assert.equal(typeof s.check(state(false)), 'string', `${lesson}/${id}: says what is still to do`);
    assert.ok(s.solution && s.explain.length > 100);
  }
  // not fooled, or fooled: both pass, and the feedback text covers both
  const ml = fixed('perception', 'hook');
  for (const value of [120, 176, 200, 240]) assert.equal(ok(ml.check({ value, moved: true, revealed: true })), true);
  assert.match(flat(ml.explain), /Whatever your number was/);
  assert.match(flat(fixed('memory', 'hook').explain), /Some people do not tick it.*Both results are normal/);
  assert.match(flat(fixed('social', 'hook').explain), /however you answered tells you little/);
  assert.match(flat(fixed('differences', 'hook').explain), /Not everyone is convinced, least of all on a screen where a trick may be expected, and that is fine too/);
  assert.match(flat(fixed('thinking', 'hook').explain), /Not everyone is pulled on every question/);
  // debriefing: each demonstration that hides its purpose says so straight afterwards
  assert.match(flat(fixed('memory', 'hook').explain), /depends on not telling you its purpose beforehand, so here is the full story now/);
  assert.match(flat(fixed('differences', 'hook').explain), /The "test" was a fake, and saying so straight away/);
  assert.match(flat(fixed('social', 'hook').explain), /The other five were scripted/);
  // the Stroop step offers a version that needs no colour vision, and no clock runs out
  assert.match(flat(fixed('perception', 'stroop').text), /number version.*without colour.*nothing runs out/);
  assert.match(flat(fixed('memory', 'hook').text), /Skip the list/);
  assert.match(flat(fixed('perception', 'change').text), /no time limit.*Show me/);
});

test('science of mind: who gets the app, the file drawer, twenty analyses', () => {
  const assign = check('science-of-mind', 'assign');
  for (let c = 0; c <= 4; c++) for (let k = 0; k <= 4; k++) {
    const r = assign.check({ runs: { choice: c, coin: k } });
    assert.equal(ok(r), c >= 3 && k >= 3, `choice ${c}, coin ${k}`);
    if (!ok(r)) assert.match(r, c < 3 ? /choose/ : /coin/);
  }
  assert.equal(assign.widget.effect, 0, 'the app really does nothing');
  const drawer = check('science-of-mind', 'drawer');
  assert.equal(ok(drawer.check({ view: 'published' })), true);
  assert.equal(typeof drawer.check({ view: 'all' }), 'string');
  const paths = check('science-of-mind', 'paths');
  const grid = paths.widget.p;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) {
    const opened = [[0, 0], [r, c]];
    const best = Math.min(...opened.map(([a, b]) => grid[a][b]));
    assert.equal(ok(paths.check({ found: best < 0.05, tried: 2, bestText: String(best) })), best < 0.05);
  }
  assert.equal(paths.check({ found: false, tried: 20, bestText: '0.06' }), false);
  const [sr, sc] = paths.solution.opened[1];
  assert.ok(grid[sr][sc] < 0.05, 'the solution opens a significant tile');
});

// This file's own copy of the conditioning model documented in the widget's header.
function dog(kinds) {
  let V = 0;
  let I = 0;
  let rested = false; // a second night in a row adds nothing
  const out = [];
  for (const k of kinds) {
    const drops = Math.round(10 * Math.max(0, V - I));
    if (k === 'pair') { out.push({ kind: k, drops }); V += 0.3 * (1 - V); I *= 0.5; }
    else if (k === 'alone') { out.push({ kind: k, drops }); I += 0.3 * (V - I); }
    else { out.push({ kind: k, drops: null }); if (!rested) I *= 0.5; }
    rested = k === 'rest';
  }
  return out;
}

test('conditioning: the dog, and the pigeon', () => {
  const pair = check('conditioning', 'pair');
  for (let n = 0; n <= 9; n++) {
    const kinds = ['alone', ...Array(n).fill('pair'), 'alone'];
    const mine = dog(kinds);
    const st = pavlov(kinds);
    assert.deepEqual(st.trials.map((t) => t.drops), mine.map((t) => t.drops), `the widget follows its documented model (${n} pairings)`);
    assert.equal(ok(pair.check(st)), mine[mine.length - 1].drops >= 8, `${n} pairings, then the bell alone`);
    // pairing without testing is not enough
    assert.equal(ok(pair.check(pavlov(['alone', ...Array(n).fill('pair')]))), false);
  }
  assert.equal(ok(pair.check(pavlov(pair.solution.trials))), true);
  assert.equal(typeof pair.check(pavlov([])), 'string');
  assert.equal(dog(['alone'])[0].drops, 0, 'a bell means nothing before training');

  const ext = check('conditioning', 'extinguish');
  const trained = ext.widget.trials;
  assert.deepEqual(trained, Array(6).fill('pair'));
  for (let alones = 0; alones <= 9; alones++) for (const tail of [[], ['rest'], ['rest', 'alone'], ['alone']]) {
    const kinds = [...trained, ...Array(alones).fill('alone'), ...tail];
    const mine = dog(kinds);
    const faded = mine.slice(6, 6 + alones).some((t) => t.drops <= 1);
    const want = faded && tail.length === 2 && tail[0] === 'rest' && mine[mine.length - 1].drops >= 3;
    assert.equal(ok(ext.check(pavlov(kinds))), want, `${alones} bells alone, then ${tail.join(' + ') || 'nothing'}`);
  }
  assert.equal(ok(ext.check(pavlov(ext.solution.trials))), true);
  // the numbers the explanation relies on: fading takes about seven rings, and about half comes back
  const story = dog(ext.solution.trials);
  assert.equal(story.filter((t) => t.kind === 'alone').findIndex((t) => t.drops <= 1), 5, 'the sixth ring gives 1 drop');
  assert.deepEqual([story[6].drops, story[story.length - 1].drops], [9, 5], 'nine drops before fading, five after a night');
  assert.match(flat(ext.explain), /about half of it is back/);

  const sched = check('conditioning', 'schedules');
  const ids = ['crf', 'fr', 'vr', 'fi', 'vi'];
  for (let mask = 0; mask < 32; mask++) {
    const stopped = ids.filter((_, i) => mask & (1 << i));
    const r = sched.check({ trained: stopped, stopped });
    assert.equal(ok(r), stopped.includes('crf') && stopped.includes('vr'), stopped.join(','));
  }
  assert.equal(typeof sched.check({ trained: ['crf', 'vr'], stopped: ['crf'] }), 'string');
  // what the lesson says about the simulation is true of it
  const sim = Object.fromEntries(ids.map((id) => [id, schedule(id)]));
  assert.equal(sim.crf.after, 5, '"a handful"');
  assert.ok(sim.vr.after >= 85 && sim.vr.after <= 95, '"about ninety pecks"');
  for (const id of ids) if (id !== 'vr') { assert.ok(sim.vr.rate > sim[id].rate, `VR is faster than ${id}`); assert.ok(sim.vr.after > sim[id].after, `VR outlasts ${id}`); }
  for (const id of ids) assert.equal(sim[id].after, Math.max(5, 3 * sim[id].maxRun), 'the bird quits after three times its longest dry run');
  assert.equal(sim.fr.maxRun, 10);
  assert.equal(sim.vr.rewards.length > 15, true);
  // on a variable-ratio schedule the average requirement is 10 pecks
  near(sim.vr.pecks.length / sim.vr.rewards.length, 10, 1.5);
});

test('thinking: the curve, the cards and the crowd', () => {
  const loss = check('thinking', 'loss');
  assert.deepEqual(loss.target, { k: 2 });
  const k = loss.widget.params.k;
  assert.ok(k.min <= 1 && k.max >= 2 && k.value !== 2 && Number.isInteger((2 - k.min) / k.step), 'the slider starts elsewhere and can reach 2');

  // the cards that could hide a rule-breaker, worked out from the faces
  const vowel = (f) => /^[AEIOU]$/.test(f);
  const must = {
    wason: (card) => vowel(card.front) || (/^\d+$/.test(card.front) && Number(card.front) % 2 === 1),
    'wason-social': (card) => card.front.text === 'Beer' || (card.front.sub === 'age' && Number(card.front.text) <= 18),
  };
  for (const id of ['wason', 'wason-social']) {
    const s = check('thinking', id);
    const cards = s.widget.cards;
    const needed = cards.map((c, i) => (must[id](c) ? i : -1)).filter((i) => i >= 0);
    assert.deepEqual(needed, [0, 3]);
    assert.deepEqual(cards.map((c) => !!c.breaks), [false, false, false, true], 'only the last card hides a rule-breaker');
    for (let mask = 0; mask < 16; mask++) {
      const selected = [0, 1, 2, 3].filter((i) => mask & (1 << i));
      const r = s.check({ selected, count: selected.length });
      assert.equal(ok(r), mask === 0b1001, `cards ${selected.join(',')}`);
      if (!ok(r)) assert.equal(typeof r, 'string');
    }
    assert.deepEqual(s.solution, { selected: [0, 3] });
  }
  assert.equal(fixed('thinking', 'wason').graded, false, 'nine in ten get the abstract version wrong: it is not marked');

  const base = check('thinking', 'base-rate');
  for (let stage = 0; stage <= 3; stage++) assert.equal(ok(base.check({ stage })), stage === 3);
});

test('development, social, differences: the remaining activities', () => {
  const pour = check('development', 'pour');
  for (const poured of [false, true]) for (const afterYoung of [false, true]) for (const afterOld of [false, true]) {
    const r = pour.check({ poured, afterYoung, afterOld, complete: afterYoung && afterOld, asked: [] });
    assert.equal(ok(r), afterYoung && afterOld);
    if (!ok(r)) assert.match(r, afterYoung ? /seven/ : poured || afterOld ? /four/ : /Pour glass B/);
  }

  const ruler = check('differences', 'ruler');
  for (const steel of [0, 4, 5, 9]) for (const elastic of [0, 4, 5]) for (const misprint of [3, 5, 6]) {
    const r = ruler.check({ counts: { steel, elastic, misprint } });
    assert.equal(ok(r), steel >= 5 && elastic >= 5 && misprint >= 5);
    if (!ok(r)) assert.match(r, steel < 5 ? /steel/ : elastic < 5 ? /elastic/ : /misprinted/);
  }

  const bell = check('differences', 'bell');
  assert.deepEqual(bell.target, { a: 85, b: 115 });
  near(normalShare(-1, 1) * 100, 68, 0.5);
  // the curve drawn is the normal curve with mean 100 and SD 15
  near(1 / (15 * Math.sqrt(2 * Math.PI)), 0.026596, 1e-6);
  assert.ok(bell.widget.fns[0].expr.includes('0.026596') && bell.widget.fns[0].expr.includes('(x-100)/15'));

  // predictions drawn with bars: the published result passes, and the opposite belief does not
  const bars = [
    ['memory', 'loftus', [[32, 41]], [[32, 30]]],
    ['development', 'harlow', [[1, 17]], [[17, 1]]],
    ['development', 'lifespan', [[75, 110]], [[110, 75]]],
    ['social', 'milgram', [[65]], [[1]]],
  ];
  for (const [lesson, id, truth, myth] of bars) {
    const s = check(lesson, id);
    assert.equal(s.mode, 'predict', `${lesson}/${id} is a prediction, never marked wrong`);
    assert.deepEqual(s.solution.values, truth);
    assert.equal(s.check({ values: truth }), true);
    assert.equal(s.check({ values: myth }), false);
  }
  for (const lesson of LESSONS) for (const id of INTERACTS[lesson]) assert.ok(checked.has(`${lesson}/${id}`), `${lesson}/${id}: its check is exercised above`);
  const all = LESSONS.flatMap((l) => lessons[l].steps.filter((s) => s.type === 'interact').map((s) => `${l}/${s.id}`));
  assert.deepEqual(all.sort(), LESSONS.flatMap((l) => INTERACTS[l].map((id) => `${l}/${id}`)).sort(), 'every interact step is listed in INTERACTS');
});

/* ------------------------------------------------------ 4. order, shape */

test('order steps are written in the right order', () => {
  const stages = fixed('development', 'stages').items;
  assert.deepEqual(stages.map((t) => grab(/^\*\*(.*?)\*\*/, t)[0]), ['Sensorimotor', 'Preoperational', 'Concrete operational', 'Formal operational']);
  const vary = fixed('social', 'milgram-vary').items;
  const PCT = [[/another room/, FACTS.milgram.remote], [/shabby office/, FACTS.milgram.bridgeport], [/same room/, FACTS.milgram.room], [/press the victim's hand/, FACTS.milgram.touch], [/telephone/, FACTS.milgram.phone], [/refused to go on/, FACTS.milgram.peers]];
  const shares = vary.map((t) => PCT.find(([re]) => re.test(t))[1]);
  assert.equal(shares.length, 6);
  assert.deepEqual(shares, shares.slice().sort((a, b) => b - a), 'highest share first');
  assert.equal(new Set(shares).size, 6);
  for (const [, p] of PCT) assert.ok(flat(fixed('social', 'milgram-vary').explain).includes(`| ${p}% |`));
  const every = LESSONS.flatMap((l) => lessons[l].steps.filter((s) => s.type === 'order').map((s) => `${l}/${s.id}`));
  assert.deepEqual(every.sort(), ['development/stages', 'social/milgram-vary']);
});

test('every lesson has the agreed shape', () => {
  assert.deepEqual(course.chapters.flatMap((c) => c.lessons.map((l) => l.id)), LESSONS);
  for (const id of LESSONS) {
    const steps = lessons[id].steps;
    assert.ok(steps.length >= 11 && steps.length <= 20, `${id}: ${steps.length} steps`);
    const resolved = steps.map((s) => resolveStep(s, makeRng(5), s.id));
    const handsOn = resolved.filter((s) => s.type === 'interact').length;
    assert.ok(handsOn >= 3, `${id}: ${handsOn} hands-on steps`);
    const review = steps.filter((s) => s.review).length;
    assert.ok(review >= 2 && review <= 4, `${id}: ${review} review steps`);
    assert.ok(steps.filter((s) => typeof s.gen === 'function').length >= 2, `${id}: generated steps`);
    assert.ok(steps.filter((s) => s.type === 'choice').length <= 5, `${id}: at most five choice steps`);
    assert.ok(steps[0].mode === 'predict' || (steps[0].type === 'interact' && steps[0].graded === false), `${id} opens with a guess or an experiment that cannot be failed`);
    assert.ok(rawLessons[id].recap.length >= 3 && rawLessons[id].recap.length <= 4 && rawLessons[id].next, `${id}: recap and teaser`);
    for (let i = 2; i < steps.length; i++) assert.ok(!(steps[i].type === 'info' && steps[i - 1].type === 'info' && steps[i - 2].type === 'info'), `${id}: three info steps in a row`);
    const last = resolved[resolved.length - 1];
    assert.match(`${last.text} ${last.explain}`, /:::tip Optional, this week/, `${id}: the last step offers something optional to try`);
    assert.ok(!/\byou (must|should|have to)\b/i.test(grab(/:::tip Optional, this week([\s\S]*?):::/, `${last.text} ${last.explain}`)[0]), `${id}: an invitation, not an order`);
    for (const s of resolved) {
      if (s.review) assert.ok(s.explain && s.mode !== 'predict' && s.graded, `${id}/${s.id}: review steps are graded and explained`);
      if (s.review) assert.ok(!/as (we|you) (just )?saw|shown above|earlier in this lesson|the last step|the previous/i.test(s.text), `${id}/${s.id}: a review step stands alone`);
      if (s.graded) assert.ok(s.explain.length > 30, `${id}/${s.id}: explained`);
    }
    const kinds = new Set(steps.map((s) => s.type));
    assert.ok(kinds.size >= 5, `${id}: uses ${kinds.size} step types`);
  }
  assert.match(rawLessons.differences.next, /how do we know\?/, 'the course closes on its question');
  // the fill-in dropdowns do not always put the right option first
  const firsts = [];
  for (const id of LESSONS) for (const step of lessons[id].steps) if (step.type === 'fill' && !step.gen) for (const b of resolveStep(step, makeRng(1), step.id).blanks) if (b.kind === 'select') firsts.push(b.options.indexOf(b.answer));
  assert.ok(firsts.filter((i) => i === 0).length <= firsts.length / 2 && new Set(firsts).size >= 3, `positions of the right option: ${firsts.join('')}`);
});

test('choices: one right answer, no duplicates, feedback on the wrong ones', () => {
  for (const id of LESSONS) for (const step of lessons[id].steps) {
    for (let seed = 0; seed < (step.gen ? 40 : 1); seed++) {
      const s = resolveStep(step, makeRng(seed), step.id);
      if (s.type === 'choice' || s.type === 'multi') {
        const right = s.options.filter((o) => o.correct).length;
        const poll = s.mode === 'predict' && right === 0;
        if (s.type === 'choice' && !poll) assert.equal(right, 1, `${id}/${s.id}`);
        if (s.type === 'multi') assert.ok(right >= 1 && right < s.options.length, `${id}/${s.id}: some but not all`);
        const keys = s.options.map((o) => flat(o.text) || JSON.stringify(o.figure.content));
        assert.equal(new Set(keys).size, s.options.length, `${id}/${s.id}: duplicate options`);
        for (const o of s.options) if (!o.correct && !poll) assert.ok(o.why && o.why.length > 15, `${id}/${s.id}: "${o.text}" explains why it is wrong`);
      }
      if (s.type === 'bucket') { assert.ok(s.items.length >= 5 && s.items.length <= 8, `${id}/${s.id}`); for (let b = 0; b < s.buckets.length; b++) assert.ok(s.items.some((it) => it.bucket === b), `${id}/${s.id}: bucket ${b} is used`); }
      if (s.type === 'match') { assert.equal(new Set(s.pairs.map((p) => p[1])).size, s.pairs.length, `${id}/${s.id}: right-hand sides differ`); assert.equal(new Set(s.pairs.map((p) => p[0])).size, s.pairs.length); }
    }
  }
  // the three mountains: the doll's view is the learner's view mirrored
  const m = fixed('development', 'mountains');
  const peaks = (fig) => [...fig.alt.matchAll(/(tall peak|middle-sized peak|low hill)/g)].map((x) => x[1]);
  const mine = peaks(m.figures[0]);
  assert.deepEqual(peaks(m.options.find((o) => o.correct).figure), mine.slice().reverse());
  assert.deepEqual(peaks(m.options[0].figure), mine, 'the first wrong option is the learner\'s own view');
  // the Sally-Anne answers
  assert.deepEqual(fixed('development', 'sally').blanks.map((b) => b.answer), ['the box', 'the basket', 'false']);
  // the weighing of popular ideas
  const W = { 0: /five broad traits|IQ scores predict school/, 1: /growth mindset|Grit/, 2: /separate "intelligences"|16 personality types|Star signs/ };
  for (const it of fixed('differences', 'weigh').items) assert.equal(String(it.bucket), classify(W, it.text, 'idea'));
  // myths are never the right answer
  const myths = fixed('science-of-mind', 'myths');
  assert.deepEqual(myths.options.filter((o) => o.correct).map((o) => o.text), ['Testing yourself helps you remember more than re-reading does']);
  assert.equal(myths.mode, 'predict');
  const mem = fixed('memory', 'myths');
  for (const o of mem.options) assert.equal(!!o.correct, !/video camera|photographic|Hypnosis/.test(o.text), o.text);
});

/* ---------------------------------------------------------------- 5. care */

test('care: the standard note, no labelling of the learner, tone, replication status', () => {
  const NOTE = '> **A note before we start.** This course is about how minds work in general. It is not a tool for diagnosing yourself or anyone else. If you are worried about your own mental health, talk to a doctor or another professional you trust.';
  const everything = [];
  for (const id of LESSONS) for (const step of lessons[id].steps) for (let seed = 0; seed < (step.gen ? 25 : 1); seed++) {
    const s = resolveStep(step, makeRng(seed * 31 + 1), step.id);
    for (const str of visible(s)) everything.push({ id, step: s, str });
  }
  for (const id of LESSONS) for (const str of [...rawLessons[id].recap, rawLessons[id].next]) everything.push({ id, step: { id: 'recap' }, str });

  // the note: once, word for word, on the first step of the first lesson, in every variant of that step
  for (let seed = 0; seed < 30; seed++) assert.ok(flat(resolveStep(lessons['science-of-mind'].steps[0], makeRng(seed), 'hook').text).startsWith(flat(NOTE)));
  for (const { id, step, str } of everything) if (flat(str).includes('A note before we start')) assert.ok(id === 'science-of-mind' && step.id === 'hook', `${id}/${step.id} repeats the note`);
  assert.equal(lessons['science-of-mind'].steps.filter((s) => flat(resolveStep(s, makeRng(1), s.id).text).includes('A note before we start')).length, 1);

  // nothing asks for the learner's own data, scores them or tells them what kind of person they are
  const LABEL = /\b(your (IQ|personality type|type is|score is|diagnosis|result means)|you are (an? )?(introvert|extravert|narcissist|neurotic|type [A-Z])\b|enter your|type in your (age|weight|name)|you (have|suffer from) (depression|anxiety|ADHD|autism)|you scored (low|high|below|above))/i;
  for (const { id, step, str } of everything) assert.ok(!LABEL.test(str), `${id}/${step.id}: "${str.slice(0, 80)}"`);
  // the widgets built for this course do not keep or report anything personal: check what their states expose
  for (const name of ['illusion-match', 'stroop-task', 'change-spot', 'lure-list', 'anchor-wheel', 'line-judge', 'barnum-profile', 'pour-task', 'stretchy-ruler', 'pavlov-lab', 'schedule-lab']) {
    const src = readFileSync(fileURLToPath(new URL(`../src/widgets/${name}.js`, import.meta.url)), 'utf8');
    assert.ok(!/localStorage|sessionStorage|indexedDB|fetch\(|Math\.random/.test(src), `${name}: nothing is stored or sent, and randomness is seeded`);
    assert.ok(/export const examples/.test(src) && /State:/.test(src), `${name}: documented, with examples`);
    assert.ok(!/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/.test(src.replace(/&#\d+;/g, '')), `${name}: theme colours only`);
  }
  assert.ok(!/rating/.test(JSON.stringify(Object.keys({ picked: 0, built: 0, rated: 0, revealed: 0, builds: 0, done: 0 }))), 'the Barnum rating itself is not part of the state');

  // steps about people or animals who were harmed are worded soberly
  const SOBER = [['conditioning', 'albert'], ['memory', 'lineup'], ['memory', 'which-id'], ['development', 'harlow'], ['social', 'milgram'], ['social', 'milgram-vary'], ['social', 'milgram-read'], ['social', 'genovese'], ['differences', 'misuse'], ['thinking', 'frame'], ['social', 'diffuse'], ['memory', 'myths'], ['memory', 'hm'], ['social', 'stanford'],
    ['memory', 'teach-lineup'], ['social', 'teach-milgram-reading']];   // teaching screens added in front of sober questions, about the same material
  for (const [lesson, id] of SOBER) assert.equal(raw(lesson, id).tone, 'sober', `${lesson}/${id}`);
  for (const { id, step, str } of everything) {
    if (/Little Albert|Albert\b.*steel bar|sterilis|Genovese|wrongful|cleared by DNA|450 volts|Harlow/i.test(str) && step.id !== 'recap' && step.text && flat(step.text).includes(flat(str))) {
      assert.equal(step.tone, 'sober', `${id}/${step.id} mentions a dark chapter in its question and is not sober`);
    }
    assert.ok(!/suicid|self-harm|kill (yourself|themselves)/i.test(str), `${id}/${step.id}: outside the scope of this course`);
  }
  // the classic studies are told with their caveats
  const text = (lesson, id) => { const s = fixed(lesson, id); return flat(`${s.text} ${s.explain} ${(s.options || []).map((o) => `${o.text} ${o.why || ''}`).join(' ')}`); };
  assert.match(text('conditioning', 'albert'), /\*\*1 participant\*\*, no control child/);
  assert.match(text('conditioning', 'albert'), /would not be allowed today/);
  assert.match(text('social', 'stanford'), /coached/);
  assert.match(text('social', 'genovese'), /newspaper account was wrong/);
  assert.match(text('social', 'milgram-read'), /blindly obey any order.*worked worst/);
  assert.match(text('development', 'marshmallow'), /half as strong/);
  assert.match(text('development', 'harlow'), /would not be approved today/);
  assert.match(text('development', 'attachment'), /not built to grade parents/);
  assert.match(text('development', 'attachment'), /health professional/);
  assert.match(flat(fixed('development', 'teach-stages').text), /typical ones\. Healthy children vary a great deal/);   // moved with the stages to the teaching screen that first gives ages
  assert.match(text('development', 'teen'), /No study shows a finishing line/);
  assert.match(text('memory', 'myths'), /disputed among researchers/);
  assert.match(text('memory', 'mall'), /very small study/);
  assert.match(text('conditioning', 'limits'), /least settled/);
  assert.match(text('thinking', 'loss'), /\*\*debated\*\*/);
  assert.match(text('thinking', 'defaults'), /oversold/);
  assert.match(text('thinking', 'careful'), /by-product of the statistics/);
  assert.match(text('social', 'groups'), /staff steered events/);
  assert.match(text('differences', 'between-groups'), /cannot explain a difference \*\*between\*\* groups/);
  assert.match(text('differences', 'between-groups'), /far smaller than the differences among individuals inside any group/);
  // findings that failed to replicate are never offered as true
  for (const { id, step, str } of everything) {
    if (/power pos|ego depletion|willpower is a fuel|learning style|Mozart|left-brained|10% of our brain/i.test(str)) {
      assert.ok(id === 'science-of-mind', `${id}/${step.id} brings up a failed finding outside the lesson that examines it: ${str.slice(0, 60)}`);
    }
  }
  for (const m of H.MYTHS) assert.equal(m.verdict, m.id === 'testing');
  // pointers to the neighbouring courses
  assert.match(text('perception', 'driving'), /How to Learn Anything/);
  assert.match(text('memory', 'span'), /How to Learn Anything/);
  assert.match(text('social', 'diffuse'), /First Aid/);
});

test('every picture has a licence, a credit and a description, and is used', () => {
  const used = new Set();
  for (const id of LESSONS) for (const step of lessons[id].steps) {
    const s = resolveStep(step, makeRng(3), step.id);
    for (const spec of figuresOf(s)) {
      if (!['stroop-task', 'lure-list', 'anchor-wheel', 'barnum-profile', 'line-judge', 'memory-span'].includes(spec.type)) assert.ok(spec.alt && spec.alt.length > 20, `${id}/${s.id}: ${spec.type} has a description`);
      if (spec.type === 'photo') {
        const key = /psychology\/([a-z0-9-]+)\.jpg/.exec(spec.src);
        assert.ok(key, `${id}/${s.id}: the picture comes from this course's media folder`);
        const rec = manifest.images[key[1]];
        assert.ok(rec, `${key[1]} is in the manifest`);
        assert.ok(rec.license && rec.sourceUrl && (rec.author || rec.publicDomain), `${key[1]}: licence, source and credit`);
        assert.ok(!/^(a |an |the )?(photo|image|picture)\b/i.test(spec.alt), 'alt text describes, it does not announce');
        assert.ok(spec.caption, `${key[1]} has a caption`);
        used.add(key[1]);
      }
    }
  }
  assert.deepEqual([...used].sort(), Object.keys(manifest.images).sort(), 'every picture in the manifest is used, and nothing else');
  assert.ok(used.size >= 4 && used.size <= 8);
});

/* ------------------------------------------------- added by the reviewer */

test('review: the models behave as the textbook says, and the demonstrations say what they are', () => {
  // spontaneous recovery is partial, however many nights pass; extinction is not erasure
  const trained = Array(6).fill('pair');
  const before = pavlov([...trained, 'alone']).trials.at(-1).drops;
  for (const nights of [1, 2, 3, 6]) {
    const st = pavlov([...trained, ...Array(9).fill('alone'), ...Array(nights).fill('rest'), 'alone']);
    const back = st.trials.at(-1).drops;
    assert.ok(back >= 3 && back <= Math.ceil(before * 0.6), `after ${nights} night(s) ${back} of ${before} drops are back: some, not all`);
  }
  // relearning after extinction is faster than learning the first time (the old learning was not rubbed out)
  const first = pavlov(['pair', 'pair', 'alone']).trials.at(-1).drops;
  const again = pavlov([...trained, ...Array(9).fill('alone'), 'pair', 'pair', 'alone']).trials.at(-1).drops;
  assert.ok(again > first, 'two pairings restore more than two pairings first built');
  // generalisation falls off with distance from the trained signal
  const g = pavlov([...trained, 'alone', 'pair', 'near', 'far']).trials;
  assert.ok(g.at(-2).drops < g.at(-4).drops && g.at(-1).drops < g.at(-2).drops && g.at(-1).drops > 0, 'bell > near > far > 0');

  // schedules: the textbook patterns
  const sim = Object.fromEntries(['crf', 'fr', 'vr', 'fi', 'vi'].map((id) => [id, schedule(id)]));
  assert.ok(sim.vr.rate > sim.fr.rate && sim.fr.rate > sim.vi.rate && sim.vi.rate > sim.fi.rate, 'rates: VR > FR > VI > FI');
  for (const id of ['fr', 'vr', 'fi', 'vi']) assert.ok(sim[id].after >= 4 * sim.crf.after, `partial reinforcement (${id}) resists extinction far more than continuous`);
  // fixed interval: a pause after each reward, then faster and faster (the "scallop")
  const fi = sim.fi.pecks.slice(0, 8);
  const gaps = fi.map((t, i) => t - (i ? fi[i - 1] : 0));
  for (let i = 1; i < gaps.length; i++) assert.ok(gaps[i] < gaps[i - 1], 'pecks bunch up towards the end of the interval');
  // fixed ratio: the longest gap between pecks comes straight after a reward
  const fr = sim.fr.pecks;
  const afterReward = fr[10] - fr[9];
  for (let i = 1; i < 10; i++) assert.ok(afterReward > 3 * (fr[i] - fr[i - 1]), 'post-reinforcement pause');
  // no graded step turns on the invented quit rule
  assert.equal(fixed('conditioning', 'schedules').graded, false);
  assert.match(flat(fixed('conditioning', 'schedules').explain), /This simulation uses one simple rule/);

  // the widgets say what they did, in the same step
  const src = (name) => readFileSync(fileURLToPath(new URL(`../src/widgets/${name}.js`, import.meta.url)), 'utf8');
  assert.match(src('anchor-wheel'), /The wheel was rigged\./);
  assert.match(src('anchor-wheel'), /One answer cannot show whether the wheel pulled you/);
  assert.match(src('line-judge'), /were scripted\. On/);
  assert.match(src('barnum-profile'), /Everyone gets exactly this text\./);
  assert.match(src('lure-list'), /It was never shown\./);
  assert.match(src('lure-list'), /You did not tick it; most people do/);
  // the Müller-Lyer picture: the fixed line and the "equal" setting are the same length, about the same centre
  const im = src('illusion-match');
  assert.match(im, /'muller-lyer': \{ truth: 200,/);
  assert.match(im, /const a0 = cx0 - K\.truth \/ 2;\s*const a1 = cx0 \+ K\.truth \/ 2;\s*const b0 = cx0 - value \/ 2;\s*const b1 = cx0 \+ value \/ 2;/);
  assert.match(im, /spec\.value != null \? snap\(spec\.value\) : K\.truth/, 'a static picture is drawn with the two equal');
  assert.match(im, /color-mix\(in srgb, white \$\{level\}%, black\)/, 'the greys of the contrast figure do not follow the theme');
  // ...and the text never names a theme colour for a line that is drawn in the ink colour
  for (const id of ['hook', 'still-there']) assert.ok(!/black line/.test(JSON.stringify(visible(fixed('perception', id)))), `perception/${id}`);
  // Stroop: both blocks have the same number of items, timed from the first item to the last correct press
  const stroop = src('stroop-task');
  assert.match(stroop, /const items = makeItems\(block === 1\);\s*let at = 0;\s*const started = now\(\);/);
  assert.match(stroop, /finish\(\(now\(\) - started\) \/ 1000\)/);
  // change blindness: a blank frame between the pictures while searching, none afterwards
  assert.match(src('change-spot'), /if \(withBlank\) \{ paint\(true\); timer = setTimeout\(swap, blankMs\); \}/);
});

test('review: the stories are told with their corrections', () => {
  const text = (lesson, id) => { const s = fixed(lesson, id); return flat(`${s.text} ${s.explain} ${(s.options || []).map((o) => `${o.text} ${o.why || ''}`).join(' ')}`); };
  // Pavlov: the prize was for digestion, and the bell is the popular story
  assert.match(text('conditioning', 'hook'), /metronome, a buzzer/);
  assert.equal(correctText(fixed('conditioning', 'hook')), 'His studies of how digestion works');
  // Little Albert: his identity is not stated
  assert.match(text('conditioning', 'albert'), /historians still disagree about who he was/);
  assert.ok(!/Merritte|Barger/.test(text('conditioning', 'albert')));
  // Milgram: the order of the variations is unambiguous, and the prod finding is attributed to the 2009 repeat
  const pcts = H.MILGRAM.variations.map((v) => v.pct).sort((a, b) => b - a);
  for (let i = 1; i < pcts.length; i++) assert.ok(pcts[i - 1] - pcts[i] >= 5, 'no two versions are close enough to argue about');
  assert.match(text('social', 'milgram-read'), /in the 2009 repeat, nobody who heard it carried on/);
  assert.match(text('social', 'teach-milgram-reading'), /An influential modern reading/);   // moved to the teaching screen in front of the question
  assert.match(text('social', 'milgram'), /not all were told the truth promptly afterwards/);
  // Genovese: the correction, and no detail of the attack anywhere in the course
  assert.match(text('social', 'genovese'), /no group of 38 silent watchers/);
  // the marshmallow test, the MBTI figure and the first-aid pointer are hedged as the sources allow
  assert.match(text('development', 'marshmallow'), /fewer than a hundred children/);
  for (let seed = 1; seed < 8; seed++) assert.match(flat(resolveStep(raw('differences', 'types'), makeRng(seed), 'types').explain), /One review of the best-known type test, the MBTI, reported that as many as half/);
  assert.ok(!/begins with it/.test(text('social', 'diffuse')));
  // heritability: every distractor reads as a sentence
  for (let seed = 1; seed < 40; seed++) for (const o of resolveStep(raw('development', 'heritability'), makeRng(seed), 'heritability').options) assert.ok(!/person's how|their how/.test(o.text), o.text);
  // nothing in the course describes violence in detail, or compares the intelligence of ethnic or national groups
  for (const id of LESSONS) for (const step of lessons[id].steps) for (let seed = 0; seed < (step.gen ? 25 : 1); seed++) {
    const s = resolveStep(step, makeRng(seed * 17 + 3), step.id);
    for (const str of visible(s)) {
      assert.ok(!/\b(stabb?ed|stabbing|knife|raped?|bloody|bloodied)\b/i.test(str), `${id}/${s.id}: ${str.slice(0, 60)}`);
      assert.ok(!/\b(racial|ethnic|races?)\b/i.test(str), `${id}/${s.id}: ${str.slice(0, 60)}`);
    }
  }
});

/* ------------------------------------------------------ teach before you ask */

// Teaching screens added by the teach-first revision (docs/AUTHORING.md, "Teach before you ask").
const TEACH = {
  'science-of-mind': ['teach-hindsight', 'teach-measure', 'teach-experiment', 'teach-reforms', 'teach-classics'],
  perception: ['teach-illusion', 'teach-perception', 'teach-attention'],
  conditioning: ['teach-classical', 'teach-extinction', 'teach-quadrants', 'teach-schedules'],
  memory: ['teach-gist', 'teach-stages', 'teach-four-ways', 'teach-lineup'],
  thinking: ['teach-shortcuts', 'teach-confirmation', 'teach-biases', 'teach-careful'],
  development: ['teach-stages', 'teach-theory-of-mind', 'teach-attachment', 'teach-heritability'],
  social: ['teach-asch', 'teach-milgram-reading', 'teach-attribution', 'teach-solid'],
  differences: ['teach-reliable-valid', 'teach-big-five', 'teach-bell', 'teach-weigh'],
};
// [lesson, teaching screen, the first step it serves, what that step needs to find on the screen]
const SERVES = [
  ['science-of-mind', 'teach-hindsight', 'proverbs', [/hindsight bias/, /tell you nothing in advance/]],
  ['science-of-mind', 'teach-measure', 'measure', [/operational definition/, /count or time/, /two conditions are compared/]],
  ['science-of-mind', 'teach-experiment', 'why-random', [/correlation/, /random assignment/, /control group/]],
  ['science-of-mind', 'teach-reforms', 'reforms', [/file drawer/, /twenty ways to look/]],
  ['science-of-mind', 'teach-classics', 'sort-status', [/found many times, by different teams/, /few small, surprising studies/]],
  ['science-of-mind', 'teach-classics', 'three-questions', [/How many people\? Compared with what\? Has anyone repeated it\?/]],
  ['perception', 'teach-illusion', 'illusion-size', [/200 − 170 = \*\*30 units\*\*/, /30 ÷ 200 = \*\*15%\*\*/]],
  ['perception', 'teach-perception', 'name-it', [/\*\*Sensation\*\*/, /\*\*Perception\*\*/, /\*\*bottom-up\*\*/, /\*\*top-down\*\*/]],
  ['perception', 'teach-attention', 'which-effect', [/narrow gate/]],
  ['conditioning', 'teach-classical', 'terms', [/classical conditioning/, /\*Unconditioned\* means needing no learning/, /\*Conditioned\* means learned/, /Stimulus \| Response/]],
  ['conditioning', 'teach-extinction', 'classical-name', [/does not rub the old learning out/]],
  ['conditioning', 'law-of-effect', 'quadrants', [/reinforcer/, /punisher/]],
  ['conditioning', 'teach-quadrants', 'quadrants', [/\*\*Positive\*\* means something is added/, /\*\*negative\*\* means something is taken away/]],
  ['conditioning', 'teach-schedules', 'schedule-match', [/\*\*ratio\*\*/, /\*\*interval\*\*/, /\*\*fixed\*\* or \*\*variable\*\*/]],
  ['memory', 'teach-gist', 'debrief', [/\*\*gist\*\*/, /rebuilds\*\* the details/]],
  ['memory', 'teach-stages', 'stages', [/\*\*Encoding\*\*/, /\*\*Storage\*\*/, /\*\*Retrieval\*\*/, /\*\*Working memory\*\*/]],
  ['memory', 'teach-four-ways', 'flashbulb', [/106 students/, /about 3 out of 7/, /highly confident/]],
  ['memory', 'teach-lineup', 'lineup', [/can leak it without meaning to/, /assumes the culprit must be present/, /confidence grows afterwards/]],
  ['memory', 'teach-lineup', 'which-id', [/\*\*first\*\* identification/, /Confidence that arrives later is not/]],
  ['thinking', 'teach-shortcuts', 'bat-ball', [/\*\*heuristic\*\*/, /\*\*System 1\*\* \(fast\) and \*\*System 2\*\* \(slow\)/, /10 \+ 60 = 70/]],
  ['thinking', 'teach-confirmation', 'bias-name', [/confirmation bias/, /fewer than about one person in ten/, /about three in four/]],
  ['thinking', 'teach-biases', 'bias-name', [/sunk-cost trap\*\* is new/]],
  ['thinking', 'teach-careful', 'careful', [/usually right/, /does not switch it off/, /Dunning-Kruger/, /no special blindness needed/]],
  ['development', 'teach-stages', 'hook', [/object permanence/, /From about eight or nine months, babies search for it/]],
  ['development', 'teach-stages', 'stages', [/four stages/]],
  ['development', 'teach-theory-of-mind', 'sally', [/false-belief task/, /Under about four, most children answer with what they themselves know to be true/, /theory of mind/]],
  ['development', 'teach-attachment', 'attachment', [/secure\*\* pattern/, /32 samples from 8 countries/, /more variation inside countries than between them/, /can change as circumstances change/, /links with adult life are modest/]],
  ['development', 'teach-heritability', 'heritability', [/differences between individuals\* in a population/, /never one individual/, /could not all grow taller in better soil/]],
  ['social', 'teach-asch', 'asch-numbers', [/\*\*conformity\*\*/, /about 37%/]],
  ['social', 'teach-milgram-reading', 'milgram-read', [/partial repeat in 2009/, /beyond his script/, /doubted the shocks were real/, /flat order worked worst/, /followership/]],
  ['social', 'bystander', 'diffuse', [/diffusion of responsibility/]],
  ['social', 'teach-attribution', 'fae', [/\*\*attribution\*\*/, /fundamental attribution error/, /\*\*person\*\*/, /\*\*situation\*\*/]],
  ['social', 'teach-solid', 'how-solid', [/implicit association test/, /pre-registered repeats have often found little or nothing/]],
  ['differences', 'teach-reliable-valid', 'rel-val', [/\*\*reliable\*\* if it gives the same result when repeated/, /\*\*valid\*\* if it measures what it claims to measure/, /Misprinted \| yes \| no \| reliable, not valid/]],
  ['differences', 'teach-big-five', 'big-five', [/\*\*traits\*\*/, /Big Five/]],
  ['differences', 'teach-bell', 'iq-calc', [/standard deviation/, /That leaves 32% outside, split evenly between the two tails/, /about \*\*16%\*\* score above 220/]],
  ['differences', 'teach-weigh', 'weigh', [/Growth mindset/, /about a tenth of a grade point/, /overlaps very strongly with conscientiousness/, /no good tests of the separate intelligences exist/]],
];

test('teach before you ask: the shape of every lesson, and what each new screen has to carry', () => {
  for (const id of LESSONS) {
    const steps = lessons[id].steps;
    const resolved = steps.map((s) => resolveStep(s, makeRng(1), s.id));
    const role = (s) => (s.type === 'info' ? (s.teach ? 'teach' : 'closing') : s.mode === 'predict' ? 'predict' : s.graded ? 'graded' : 'explore');
    const roles = resolved.map((s, i) => role({ ...s, teach: steps[i].teach }));
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: something is taught or explored before the first graded step`);
    assert.ok(roles.filter((r) => r === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(steps.filter((s) => s.type === 'info').length >= 3, `${id}: at least three info steps`);
    // an opinion poll (a predict-mode choice with no right option) is a demonstration, not a guess at an answer
    const guesses = resolved.filter((s) => s.mode === 'predict' && !(Array.isArray(s.options) && !s.options.some((o) => o.correct)));
    assert.ok(guesses.length <= 2, `${id}: ${guesses.length} predictions (${guesses.map((s) => s.id).join(', ')})`);
    for (const tid of TEACH[id]) assert.equal(raw(id, tid).type, 'info', `${id}/${tid} is a teaching screen`);
    for (let i = 0; i < steps.length; i++) if (roles[i] === 'teach') assert.ok(roles.slice(i + 1).some((r) => r === 'graded' || r === 'explore' || r === 'predict'), `${id}/${steps[i].id} is followed by something to do`);
  }
  const at = (lesson, id) => { const i = lessons[lesson].steps.findIndex((s) => s.id === id); assert.ok(i >= 0, `${lesson}/${id} exists`); return i; };
  for (const [lesson, screen, served, needs] of SERVES) {
    assert.ok(at(lesson, screen) < at(lesson, served), `${lesson}/${screen} comes before ${served}`);
    const shown = flat(fixed(lesson, screen).text);
    for (const re of needs) assert.match(shown, re, `${lesson}/${screen} carries what ${served} needs`);
  }
  // a demonstration is never explained in advance: each one comes before the screen that names it
  for (const [lesson, demo, screen] of [['perception', 'hook', 'teach-illusion'], ['perception', 'stroop', 'teach-attention'], ['perception', 'change', 'teach-attention'], ['memory', 'hook', 'teach-gist'],
    ['thinking', 'hook', 'teach-shortcuts'], ['thinking', 'wason', 'teach-confirmation'], ['thinking', 'wason-social', 'teach-confirmation'], ['social', 'hook', 'teach-asch'], ['differences', 'hook', 'teach-reliable-valid'], ['development', 'pour', 'teach-stages']]) {
    assert.ok(at(lesson, demo) < at(lesson, screen), `${lesson}/${demo} is run before ${screen} explains it`);
  }
  assert.equal(at('thinking', 'frame') > at('thinking', 'teach-shortcuts') && !/fram/i.test(fixed('thinking', 'teach-shortcuts').text), true, 'the framing pair is not given away');
  // sober material keeps its tone on the new screens
  for (const [lesson, id] of [['memory', 'teach-lineup'], ['social', 'teach-milgram-reading']]) assert.equal(raw(lesson, id).tone, 'sober', `${lesson}/${id}`);
});

test('teach before you ask: every item a generated or table-driven question can ask about is on a screen above it', () => {
  const at = (lesson, id) => lessons[lesson].steps.findIndex((s) => s.id === id);
  const shown = (lesson, screen, before) => { assert.ok(at(lesson, screen) >= 0 && at(lesson, screen) < at(lesson, before), `${lesson}/${screen} comes before ${before}`); return flat(fixed(lesson, screen).text); };
  // lesson 1: all ten classics, all four reforms
  let t = shown('science-of-mind', 'teach-classics', 'sort-status');
  for (const f of H.FINDINGS) assert.ok(f.short && t.includes(f.short), `classic: ${f.id}`);
  assert.equal(H.FINDINGS.filter((f) => f.status === 'held').length, H.FINDINGS.filter((f) => f.status === 'failed').length, 'the table has two full columns');
  t = shown('science-of-mind', 'teach-reforms', 'reforms');
  for (const [name, what] of H.REFORMS) assert.ok(t.includes(`**${name}.** ${what}.`), name);
  assert.deepEqual(H.REFORM_CASES.map((c) => c[1]), H.REFORMS.map((r) => r[0]), 'each problem is answered by one of the reforms taught');
  assert.deepEqual(fixed('science-of-mind', 'reforms').pairs, H.REFORM_CASES);
  // lesson 2: the four effects of attention
  t = shown('perception', 'teach-attention', 'which-effect');
  for (const e of Object.values(H.ATTENTION_EFFECTS)) assert.ok(t.includes(`**${e.name}**: ${e.what}.`), e.name);
  assert.deepEqual([...new Set(H.ATTENTION_CASES.map((c) => c.effect))].sort(), Object.keys(H.ATTENTION_EFFECTS).sort());
  // lesson 3: the four parts of classical conditioning, the three kinds of consequence, the four schedules
  t = shown('conditioning', 'teach-extinction', 'classical-name');
  for (const c of Object.values(H.CLASSICAL_TERMS)) assert.ok(t.includes(`**${c.name}**: ${c.what}.`), c.name);
  t = shown('conditioning', 'teach-quadrants', 'quadrants');
  for (const bucket of fixed('conditioning', 'quadrants').buckets) assert.ok(t.includes(`**${bucket}**`), bucket);
  for (const c of H.CONSEQUENCES) assert.ok(!t.includes(c.text), 'the examples on the screen are not items of the sorting question');
  t = shown('conditioning', 'teach-schedules', 'schedule-match');
  for (const sc of Object.values(H.SCHEDULES)) { assert.ok(t.includes(`**${sc.name}**: ${sc.rule}.`), sc.name); for (const ex of sc.examples) assert.ok(!t.includes(ex), 'screen examples are the pigeon, not the items to be matched'); }
  // the terms match is asked about a new case, not about the dog on the screen
  assert.ok(fixed('conditioning', 'terms').pairs.every((p) => !/food|bell|drool/i.test(p[1])));
  // lesson 4: the four ways a memory goes wrong
  t = shown('memory', 'teach-four-ways', 'misinfo-kind');
  for (const e of Object.values(H.MEMORY_EFFECTS)) assert.ok(t.includes(`**${e.name}**: ${e.what}.`), e.name);
  assert.ok(at('memory', 'teach-four-ways') < at('memory', 'flashbulb') && at('memory', 'bartlett') < at('memory', 'misinfo-kind') && at('memory', 'loftus') < at('memory', 'misinfo-kind'));
  // lesson 5: the five biases
  t = shown('thinking', 'teach-biases', 'bias-name');
  for (const b of Object.values(H.BIASES)) assert.ok(t.includes(`**${b.name}**: ${b.what}.`), b.name);
  for (const c of H.BIAS_CASES) assert.ok(!t.includes(c.text));
  // lesson 6: the four stages with ages and marks
  t = shown('development', 'teach-stages', 'stage-pick');
  H.STAGES.forEach((st, i) => assert.ok(t.includes(`${i + 1}. **${st.name}** (${st.ages}): ${st.mark}.`), st.name));
  assert.ok(at('development', 'teach-stages') < at('development', 'stages'));
  // lesson 7: all eight claims of the sorting question
  t = shown('social', 'teach-solid', 'how-solid');
  for (const x of H.SOCIAL_SOLID) assert.ok(x.short && t.includes(x.short), x.text);
  // lesson 8: the Big Five, and the people in the matching question are high on the trait named
  t = shown('differences', 'teach-big-five', 'big-five');
  for (const [name, what] of H.BIG_FIVE) assert.ok(t.includes(`| **${name}** | ${what} |`), name);
  assert.deepEqual(H.BIG_FIVE_CASES.map((c) => c[0]), H.BIG_FIVE.map((c) => c[0]));
  const HIGH = { Openness: /curiosity/, Conscientiousness: /checks it twice/, Extraversion: /party/, Agreeableness: /lend a hand/, Neuroticism: /might go wrong/ };
  for (const [name, habit] of fixed('differences', 'big-five').pairs) assert.match(habit, HIGH[name], name);
  // every idea in the weighing question was presented above it, in a screen or in the feedback of an earlier step
  const above = lessons.differences.steps.slice(0, at('differences', 'weigh')).map((s) => { const r = resolveStep(s, makeRng(1), s.id); return flat(`${r.text} ${r.explain || ''}`); }).join(' ');
  for (const re of [/Big Five/, /predicts school results moderately well/, /Growth mindset/, /"Grit"/, /Multiple intelligences/, /MBTI/, /astrologers/]) assert.match(above, re);

  // worked examples use numbers that the questions after them cannot produce
  for (let k = 0; k < 300; k++) {
    const seed = 77 + k * 131;
    const size = resolveStep(raw('perception', 'illusion-size'), makeRng(seed), 'illusion-size');
    assert.ok(size.answer !== 15 && !/plain line of 500 mm/.test(size.text));
    const bat = flat(resolveStep(raw('thinking', 'bat-ball'), makeRng(seed), 'bat-ball').text);
    assert.ok(!/\*\*70 cents\*\* together/.test(bat) && !/\*\*50 cents more\*\*/.test(bat));
    assert.ok(!/average of \*\*200\*\*/.test(resolveStep(raw('differences', 'iq-calc'), makeRng(seed), 'iq-calc').text));
    assert.ok(!/set \*\*1 decades? ago\*\*/.test(resolveStep(raw('differences', 'flynn'), makeRng(seed), 'flynn').text));
    const ppv = resolveStep(raw('thinking', 'ppv'), makeRng(seed), 'ppv');
    assert.ok(ppv.answer !== 9, 'the screening picture (9 of 98) is not one of the generated questions');
  }
});

/* ------------------------------------------------------------------- guard */

test('every generated step of the course is re-derived by a test in this file', () => {
  for (const id of LESSONS) {
    const generated = lessons[id].steps.filter((s) => typeof s.gen === 'function').map((s) => s.id);
    assert.deepEqual(generated.slice().sort(), GENERATED[id].slice().sort(), `${id}: update GENERATED and add a test for any new generator`);
    for (const stepId of generated) assert.ok(tested.has(`${id}/${stepId}`), `${id}/${stepId} is generated, but no test above re-derives it`);
  }
});
