// Independent checks of "First Worlds: To 500 CE".
//
// The course keeps its facts in content/courses/world-ancient/helpers.js. This file keeps its OWN small
// tables of the key dates and places, typed in separately, and compares the two (double entry). Every
// generated question is then re-answered from the wording the learner sees, using only the tables in
// this file; every `order` step is checked against the dates; every map, timeline and photo interaction
// is fed its own solution and several plausible wrong states.
//
//   node --test tests/world-ancient-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { countryName, countryAt, countryInfo, distanceKm, pointInPolygon } from '../src/widgets/world-map.js';
import course from '../content/courses/world-ancient/course.js';
import { PLACES, EVENTS, ORIGINS, TRADITIONS, NOW, yearOf, rangeOf, clearlyBefore } from '../content/courses/world-ancient/helpers.js';

const SEEDS = 200;
const LESSONS = ['peopling', 'farming', 'river-valleys', 'writing', 'persia-greece', 'rome-han', 'beliefs'];

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/world-ancient/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, 'world-ancient', meta.id);
  }
}
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('../content/media/world-ancient/manifest.json', import.meta.url)), 'utf8'));

const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(4099 + k * 7919), id));
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const allSteps = () => Object.entries(lessons).flatMap(([lesson, l]) => l.steps.map((step) => ({ lesson, step })));
const figuresOf = (s) => [...(s.figures || []), ...(s.widget ? [s.widget] : []), ...(s.options || []).flatMap((o) => (o.figure ? [o.figure] : []))];

/** Every string a learner can see in a resolved step (addresses and identifiers excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['type', 'id', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'color', 'viewBox', 'content', 'view', 'mode', 'shape', 'labelPos', 'style', 'curve', 'scale', 'projection', 'animate', 'markerLabels', 'answer', 'pickable', 'ids', 'first', 'target', 'shown', 'home', 'item', 'tradition', 'cc', 'license', 'credit', 'changes']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/* ------------------------------------------------------------ own tables */

const ago = (older, younger) => [NOW - older, NOW - younger];

// Key events: [earliest acceptable year, latest acceptable year, a word the helper's wording must contain].
// BCE years are negative. Ranges reflect what current reference works give, not a single "right" year.
const OWN_DATES = {
  'sapiens': [...ago(350000, 250000), /fossils/],
  'out-of-africa': [...ago(80000, 45000), /out of Africa/],
  'australia': [...ago(70000, 45000), /Australia/],
  'europe': [...ago(50000, 40000), /Europe/],
  'chauvet': [...ago(38000, 33000), /Chauvet/],
  'ice-peak': [...ago(27000, 18000), /ice sheets/],
  'americas': [...ago(25000, 13000), /Americas/],
  'austronesian': [-3500, -1500, /Taiwan/],
  'lapita': [-1100, -700, /Tonga and Samoa/],
  'madagascar': [300, 1100, /Madagascar/],
  'hawaii': [900, 1300, /Hawaii/],
  'rapa-nui': [1000, 1300, /Rapa Nui/],
  'aotearoa': [1200, 1350, /New Zealand/],
  'antarctica-seen': [1820, 1820, /Antarctica/],
  'ice-age-ends': [-9900, -9500, /Ice Age ends/],
  'gobekli': [-10000, -8800, /Göbekli Tepe/],
  'fertile-crescent': [-10500, -8500, /Fertile Crescent/],
  'catalhoyuk': [-7600, -6700, /Çatalhöyük/],
  'rice': [-8500, -5500, /Rice/],
  'maize': [-8000, -5500, /Maize/],
  'potato': [-8000, -3500, /Potatoes/],
  'kuk': [-8000, -3000, /New Guinea/],
  'pearl-millet': [-3200, -1800, /Pearl millet/],
  'sunflower': [-3500, -1800, /Sunflowers/],
  'stonehenge': [-3100, -2000, /Stonehenge/],
  'uruk-city': [-3600, -3100, /Uruk/],
  'egypt-unified': [-3300, -2900, /Egypt is united/],
  'pyramid': [-2650, -2480, /Great Pyramid/],
  'caral': [-3000, -2300, /Caral/],
  'indus-peak': [-2700, -1800, /Indus/],
  'mammoth': [-2300, -1700, /mammoths/],
  'hammurabi': [-1800, -1700, /Hammurabi/],
  'shang-anyang': [-1350, -1150, /Shang/],
  'olmec': [-1500, -800, /Olmec/],
  'cleopatra': [-30, -30, /Cleopatra/],
  'cuneiform': [-3500, -3100, /clay tablets/],
  'hieroglyphs': [-3400, -3000, /hieroglyphs/],
  'enheduanna': [-2400, -2200, /Enheduanna/],
  'sinai-alphabet': [-2000, -1500, /Sinai/],
  'oracle-bones': [-1350, -1150, /oracle bones/],
  'phoenician': [-1200, -900, /Phoenician/],
  'greek-alphabet': [-900, -700, /Greeks add vowels/],
  'maya-writing': [-500, -100, /Maya/],
  'rosetta-carved': [-196, -196, /Rosetta/],
  'last-hieroglyphs': [394, 394, /last known hieroglyphs/],
  'champollion': [1822, 1822, /Champollion/],
  'olympics': [-776, -776, /Olympic/],
  'cyrus-babylon': [-539, -539, /Cyrus/],
  'athens-democracy': [-510, -506, /democracy/],
  'marathon': [-490, -490, /Marathon/],
  'salamis': [-480, -480, /Salamis/],
  'parthenon': [-447, -432, /Parthenon/],
  'socrates': [-399, -399, /Socrates/],
  'alexander-king': [-336, -336, /Alexander becomes king/],
  'alexander-dies': [-323, -323, /Alexander dies/],
  'eratosthenes': [-260, -220, /Eratosthenes/],
  'gandhara-art': [1, 300, /Gandhara/],
  'roman-republic': [-509, -509, /republic/],
  'ashoka': [-268, -232, /Ashoka/],
  'qin': [-221, -221, /Qin/],
  'han-begins': [-206, -202, /Han dynasty begins/],
  'zhang-qian': [-139, -138, /Zhang Qian/],
  'augustus': [-27, -27, /Augustus/],
  'cai-lun': [105, 105, /Cai Lun/],
  'rome-peak': [117, 117, /greatest size/],
  'han-ends': [220, 220, /Han dynasty falls/],
  'gupta': [315, 325, /Gupta/],
  'west-rome-ends': [476, 476, /last Roman emperor in the west/],
  'rigveda': [-1700, -1000, /Vedas/],
  'temple-destroyed': [-587, -586, /Temple/],
  'confucius': [-551, -479, /Confucius/],
  'buddha': [-563, -400, /Buddha/],
  'jesus': [26, 36, /Jesus/],
  'buddhism-china': [1, 100, /Buddhism is first recorded in China/],
  'armenia': [301, 314, /Armenia/],
  'constantine': [313, 313, /Constantine/],
  'ezana': [320, 360, /Ezana/],
  'theodosius': [380, 380, /official religion/],
  'yungang': [460, 494, /Yungang/],
};

// Key places: [longitude, latitude, modern country, how many km the helper may differ]. Longitude first.
const OWN_PLACES = {
  'jebel-irhoud': [-8.9, 31.9, 'MA', 60], 'omo-kibish': [36.0, 5.4, 'ET', 80], 'madjedbebe': [132.9, -12.5, 'AU', 60],
  'sulawesi': [119.6, -5.0, 'ID', 150], 'chauvet': [4.4, 44.4, 'FR', 60], 'beringia': [-169, 66, null, 300],
  'white-sands': [-106.3, 32.8, 'US', 80], 'monte-verde': [-73.2, -41.5, 'CL', 80], 'taiwan': [121, 23.7, null, 150],
  'new-britain': [150.5, -5.6, 'PG', 200], 'samoa': [-172, -13.8, 'WS', 150], 'tonga': [-175.2, -21.2, 'TO', 150],
  'tahiti': [-149.4, -17.7, 'PF', 80], 'hawaii': [-155.5, 19.6, 'US', 250], 'rapa-nui': [-109.4, -27.1, 'CL', 40],
  'aotearoa': [174, -41, 'NZ', 300], 'madagascar': [47, -19, 'MG', 300], 'borneo': [114, 1, 'ID', 300],
  'fertile-crescent': [39.8, 37.6, 'TR', 150], 'gobekli-tepe': [38.9, 37.2, 'TR', 30], 'catalhoyuk': [32.8, 37.7, 'TR', 30],
  'yellow-river-millet': [114, 36.5, 'CN', 150], 'yangtze-rice': [120.5, 30, 'CN', 150], 'balsas': [-99.5, 18.3, 'MX', 150],
  'titicaca': [-70.3, -15.5, 'PE', 150], 'kuk-swamp': [144.3, -5.8, 'PG', 40], 'sahel': [0, 17, 'ML', 250],
  'eastern-woodlands': [-88, 37.5, 'US', 300],
  'uruk': [45.6, 31.3, 'IQ', 30], 'ur': [46.1, 31.0, 'IQ', 30], 'giza': [31.1, 30.0, 'EG', 20], 'mohenjo-daro': [68.1, 27.3, 'PK', 30],
  'harappa': [72.9, 30.6, 'PK', 30], 'anyang': [114.3, 36.1, 'CN', 40], 'caral': [-77.5, -10.9, 'PE', 30], 'la-venta': [-94.0, 18.1, 'MX', 30],
  'wrangel': [-179.5, 71.2, 'RU', 150],
  'abydos': [31.9, 26.2, 'EG', 30], 'serabit': [33.5, 29.0, 'EG', 30], 'byblos': [35.6, 34.1, 'LB', 30], 'san-bartolo': [-89.4, 17.5, 'GT', 60],
  'rosetta': [30.4, 31.4, 'EG', 30], 'babylon': [44.4, 32.5, 'IQ', 30],
  'sardis': [28.0, 38.5, 'TR', 30], 'susa': [48.3, 32.2, 'IR', 30], 'persepolis': [52.9, 29.9, 'IR', 30], 'athens': [23.7, 38.0, 'GR', 20],
  'sparta': [22.4, 37.1, 'GR', 20], 'pella': [22.5, 40.8, 'GR', 30], 'alexandria': [29.9, 31.2, 'EG', 20], 'syene': [32.9, 24.1, 'EG', 20],
  'samarkand': [67.0, 39.65, 'UZ', 20], 'taxila': [72.8, 33.75, 'PK', 30], 'massalia': [5.4, 43.3, 'FR', 20], 'neapolis': [14.25, 40.85, 'IT', 20],
  'syracuse': [15.3, 37.1, 'IT', 20], 'byzantion': [29.0, 41.0, 'TR', 20], 'cyrene': [21.9, 32.8, 'LY', 30],
  'rome': [12.5, 41.9, 'IT', 20], 'changan': [108.9, 34.3, 'CN', 40], 'luoyang': [112.45, 34.6, 'CN', 40], 'dunhuang': [94.7, 40.1, 'CN', 40],
  'kashgar': [76.0, 39.5, 'CN', 30], 'merv': [62.2, 37.7, 'TM', 30], 'ctesiphon': [44.6, 33.1, 'IQ', 30], 'antioch': [36.2, 36.2, 'TR', 20],
  'pataliputra': [85.1, 25.6, 'IN', 30], 'meroe': [33.75, 16.9, 'SD', 30], 'aksum': [38.7, 14.1, 'ET', 20], 'nimes': [4.4, 43.8, 'FR', 20],
  'lumbini': [83.3, 27.5, 'NP', 20], 'bodh-gaya': [85.0, 24.7, 'IN', 20], 'sarnath': [83.0, 25.4, 'IN', 20], 'qufu': [117.0, 35.6, 'CN', 20],
  'jerusalem': [35.2, 31.8, null, 20], 'anuradhapura': [80.4, 8.35, 'LK', 30], 'etchmiadzin': [44.3, 40.2, 'AM', 20], 'yungang': [113.1, 40.1, 'CN', 30],
  'yazd': [54.4, 31.9, 'IR', 20],
};
// Islands too small for the coarse country shapes: the lookup cannot place them, so they are covered by the
// distance check against OWN_PLACES alone.
const NO_SHAPE = new Set(['samoa', 'rapa-nui']);

// Where each crop or animal was first farmed (this file's own list).
const OWN_ORIGINS = {
  'wheat': 'sw-asia', 'barley': 'sw-asia', 'lentils': 'sw-asia', 'sheep': 'sw-asia', 'goats': 'sw-asia',
  'rice': 'china', 'soybeans': 'china', 'foxtail millet': 'china',
  'maize': 'mesoamerica', 'turkeys': 'mesoamerica',
  'potatoes': 'andes', 'quinoa': 'andes', 'llamas': 'andes',
  'bananas': 'new-guinea', 'sugar cane': 'new-guinea',
  'sorghum': 'africa', 'pearl millet': 'africa',
  'sunflowers': 'eastern-na',
};
const REGION_WORDS = { 'sw-asia': /Fertile Crescent|South-west Asia/, 'china': /China/, 'mesoamerica': /Mexico/, 'andes': /Andes/, 'new-guinea': /New Guinea/, 'africa': /Africa south of the Sahara/, 'eastern-na': /[Ee]astern North America/ };

// One or two words that identify each tradition in a clue, and that must not occur in any other tradition's clues.
const OWN_TRADITIONS = {
  'Hinduism': /Vedas/, 'Buddhism': /Eightfold Path|awakened one/, 'Confucianism': /state of Lu|Analects/, 'Daoism': /Daodejing|wu wei/,
  'Zoroastrianism': /Ahura Mazda|good thoughts/, 'Judaism': /Torah/, 'Christianity': /Jesus of Nazareth|Roman-ruled Judaea/,
};

/* ------------------------------------------------------------ whole course */

test('course shape: seven lessons with the right mix of steps', () => {
  assert.equal(course.id, 'world-ancient');
  assert.deepEqual(Object.keys(lessons), LESSONS);
  for (const [id, lesson] of Object.entries(lessons)) {
    const n = lesson.steps.length;
    assert.ok(n >= 12 && n <= 18, `${id}: ${n} steps`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    assert.ok(lesson.steps.filter((s) => typeof s.gen === 'function').length >= 2, `${id}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'interact').length >= 3, `${id}: at least three interact steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${id}: no more than five choice steps`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next && lesson.next.length > 40, `${id}: next`);
    assert.equal(lesson.steps[0].mode, 'predict', `${id}: opens with a prediction`);
    // where: at least two maps, one of them graded; when: a timeline or an order step
    const resolved = lesson.steps.map((s) => resolveStep(s, makeRng(11), s.id));
    const maps = resolved.filter((s) => figuresOf(s).some((f) => f.type === 'world-map'));
    assert.ok(maps.length >= 2, `${id}: ${maps.length} steps with a map`);
    assert.ok(resolved.some((s) => s.type === 'interact' && s.widget.type === 'world-map' && s.graded !== false), `${id}: a graded map step`);
    assert.ok(resolved.some((s) => s.type === 'order' || figuresOf(s).some((f) => f.type === 'timeline')), `${id}: a timeline or an order step`);
    assert.ok(resolved.some((s) => figuresOf(s).some((f) => f.type === 'photo')), `${id}: a picture used as evidence`);
  }
});

test('no learner-visible text contains undefined, NaN or an object; dates use BCE and CE', () => {
  for (const { lesson, step } of allSteps()) {
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(77 + k * 131), step.id);
      for (const text of visible(s)) {
        assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), `${lesson}/${step.id} seed ${k}: ${text}`);
        assert.ok(!/\b\d+ ?(BC|AD)\b|\bA\.D\.|\bB\.C\./.test(text), `${lesson}/${step.id}: use BCE and CE in "${text}"`);
        assert.ok(!/\bdiscovered (America|Australia|New Zealand|Hawaii)/i.test(text), `${lesson}/${step.id}: inhabited lands are reached, not discovered`);
      }
      if (!step.gen) break;
    }
  }
  for (const lesson of Object.values(lessons)) for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
});

test('review steps stand alone', () => {
  for (const { lesson, step } of allSteps()) {
    if (!step.review) continue;
    const s = resolveStep(step, makeRng(5), step.id);
    assert.ok(s.explain, `${lesson}/${step.id}: review step has an explanation`);
    assert.ok(!/as (we|you) (just )?saw|the previous|last step|above\b/i.test(flat(s.text)), `${lesson}/${step.id}: refers to its surroundings`);
  }
});

/* ------------------------------------------------------- double entry: facts */

test('helper dates agree with this file\'s own table', () => {
  assert.deepEqual(Object.keys(EVENTS).sort(), Object.keys(OWN_DATES).sort(), 'both tables list the same events');
  for (const [id, [lo, hi, word]] of Object.entries(OWN_DATES)) {
    const y = yearOf(id);
    assert.ok(y >= lo && y <= hi, `${id}: helper says ${y}, expected ${lo} to ${hi}`);
    assert.ok(y !== 0, `${id}: there is no year 0`);
    assert.match(EVENTS[id].text, word, `${id}: wording`);
    assert.ok(EVENTS[id].pm >= 0 && EVENTS[id].when.length > 5, `${id}: has a spread and a wording`);
    // the helper's own range of estimates must not stray far outside what this file accepts
    const [a, b] = rangeOf(id);
    const slack = Math.max(40, 0.25 * (hi - lo));
    assert.ok(a >= lo - slack && b <= hi + slack, `${id}: helper range ${a}..${b} against ${lo}..${hi}`);
  }
  // the learner-facing wording carries the same figure
  const says = (id, re) => assert.match(EVENTS[id].when, re, `${id}: "${EVENTS[id].when}"`);
  says('sapiens', /300,000/); says('australia', /50,000/); says('americas', /15,000/); says('aotearoa', /1250 to 1300 CE/);
  says('gobekli', /9500 BCE/); says('pyramid', /2560 BCE/); says('mammoth', /4,000 years ago/); says('cleopatra', /30 BCE/);
  says('cuneiform', /3300 BCE/); says('oracle-bones', /1250 BCE/); says('rosetta-carved', /196 BCE/); says('champollion', /1822/);
  says('cyrus-babylon', /539 BCE/); says('marathon', /490 BCE/); says('alexander-dies', /323 BCE/);
  says('qin', /221 BCE/); says('augustus', /27 BCE/); says('han-ends', /220 CE/); says('west-rome-ends', /476 CE/);
  says('constantine', /313 CE/); says('theodosius', /380 CE/); says('buddha', /fifth century BCE/);
  // BCE wording goes with negative years, CE wording with positive ones
  for (const [id, e] of Object.entries(EVENTS)) {
    if (!Number.isFinite(e.year)) continue;
    if (/\bBCE\b/.test(e.when) && !/\bCE\b/.test(e.when.replace(/BCE/g, ''))) assert.ok(e.year < 0, `${id}: BCE wording, year ${e.year}`);
    if (/\d CE\b/.test(e.when) && !/BCE/.test(e.when)) assert.ok(e.year > 0, `${id}: CE wording, year ${e.year}`);
  }
});

test('helper places agree with this file\'s own table, and every coordinate is [longitude, latitude]', () => {
  assert.deepEqual(Object.keys(PLACES).sort(), Object.keys(OWN_PLACES).sort(), 'both tables list the same places');
  for (const [id, [lon, lat, cc, km]] of Object.entries(OWN_PLACES)) {
    const p = PLACES[id];
    assert.ok(Array.isArray(p.at) && p.at.length === 2, `${id}: [lon, lat]`);
    assert.ok(Math.abs(p.at[0]) <= 180 && Math.abs(p.at[1]) <= 90, `${id}: valid longitude and latitude`);
    const d = distanceKm(p.at, [lon, lat]);
    assert.ok(d <= km, `${id}: helper is ${Math.round(d)} km from where this file puts it`);
    assert.equal(p.cc, cc, `${id}: country`);
    if (cc) {
      assert.ok(countryName(cc), `${id}: ${cc} is a known country code`);
      // exactly on land first; a point on a simplified coast is forgiven 40 km
      const found = countryAt(p.at, 'low') || countryAt(p.at, 'low', 40);
      // (Rome: on the coarse layer the Vatican is a ring drawn over the city, and a point on a ring counts as that country)
      if (!NO_SHAPE.has(id)) assert.ok(found === cc || (id === 'rome' && found === 'VA'), `${id}: the point lies in ${countryName(cc)}, not ${found}`);
      // the classic bug: latitude and longitude swapped. Where the two numbers differ enough to tell, the swapped
      // point must not land in the same country.
      if (!NO_SHAPE.has(id) && Math.abs(p.at[0]) <= 90 && Math.abs(p.at[0] - p.at[1]) > 20) assert.notEqual(countryAt([p.at[1], p.at[0]], 'low', 40), cc, `${id}: looks the same when swapped?`);
    }
  }
  for (const id of NO_SHAPE) {
    const info = countryInfo(PLACES[id].cc);
    assert.ok(info && info.name, `${id}: ${PLACES[id].cc} is known to the map`);
  }
});

/** Every [lon, lat] pair and every country code in a widget spec. */
function geoOf(spec) {
  const points = [];
  const codes = [];
  const pt = (p, what) => { if (Array.isArray(p)) points.push([p, what]); };
  for (const m of spec.markers || []) pt(m.at, `marker ${m.label}`);
  for (const l of spec.lines || []) for (const p of l.points) pt(p, `line ${l.label || ''}`);
  for (const a of spec.areas || []) for (const p of a.polygon || []) pt(p, `area ${a.label || ''}`);
  for (const l of spec.labels || []) { if (l && l.at) pt(l.at, `label ${l.text}`); else if (typeof l === 'string' && /^[A-Z]{2}$/.test(l)) codes.push(l); }
  for (const c of spec.pickable || []) if (/^[A-Z]{2}$/.test(c)) codes.push(c);
  for (const r of spec.regions || []) for (const c of [].concat(r.ids)) if (/^[A-Z]{2}$/.test(c)) codes.push(c);
  if (spec.mode === 'pick' && typeof spec.answer === 'string') codes.push(spec.answer);
  return { points, codes };
}

test('every map in the course: valid coordinates inside the view, and known country codes', () => {
  let maps = 0;
  for (const { lesson, step } of allSteps()) {
    for (let k = 0; k < 40; k++) {
      const s = resolveStep(step, makeRng(900 + k * 31), step.id);
      for (const spec of figuresOf(s)) {
        if (spec.type !== 'world-map') continue;
        maps++;
        assert.ok(spec.alt && spec.alt.length > 20, `${lesson}/${step.id}: map has a description`);
        const { points, codes } = geoOf(spec);
        for (const c of codes) assert.ok(countryName(c), `${lesson}/${step.id}: unknown country code ${c}`);
        for (const [p, what] of points) {
          assert.ok(p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]), `${lesson}/${step.id}: ${what}`);
          assert.ok(Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90, `${lesson}/${step.id}: ${what} is not [lon, lat]: ${p}`);
        }
        if (Array.isArray(spec.view)) {
          const [w, sth, e, n] = spec.view;
          assert.ok(sth < n && Math.abs(sth) <= 90 && Math.abs(n) <= 90, `${lesson}/${step.id}: view`);
          const inLon = (lon) => (w <= e ? lon >= w - 3 && lon <= e + 3 : lon >= w - 3 || lon <= e + 3);
          for (const m of spec.markers || []) assert.ok(inLon(m.at[0]) && m.at[1] >= sth - 2 && m.at[1] <= n + 2, `${lesson}/${step.id}: marker ${m.label} lies outside the view`);
        }
      }
      if (!step.gen) break;
    }
  }
  assert.ok(maps >= 30, `${maps} maps checked`);
});

test('outlines of empires and Ice Age lands contain the places they should, and not the ones they should not', () => {
  const poly = (lesson, id, i = 0) => figuresOf(one(lesson, id)).find((f) => f.type === 'world-map').areas[i].polygon;
  const inside = (p, id) => pointInPolygon(OWN_PLACES[id].slice(0, 2), p);
  const sunda = poly('peopling', 'ice-age', 0);
  const sahul = poly('peopling', 'ice-age', 1);
  assert.ok(inside(sunda, 'borneo') && pointInPolygon([110.4, -7.5], sunda) && !inside(sunda, 'sulawesi') && !inside(sunda, 'madjedbebe'), 'Sunda: Borneo and Java, not Sulawesi');
  assert.ok(inside(sahul, 'madjedbebe') && inside(sahul, 'kuk-swamp') && pointInPolygon([146.5, -42], sahul) && !inside(sahul, 'sulawesi') && !inside(sahul, 'aotearoa'), 'Sahul: Australia, New Guinea, Tasmania');
  const persia = poly('persia-greece', 'empire');
  for (const id of ['sardis', 'susa', 'persepolis', 'babylon', 'giza', 'samarkand', 'taxila']) assert.ok(inside(persia, id), `Persian Empire includes ${id}`);
  for (const id of ['athens', 'sparta', 'rome', 'pataliputra', 'meroe', 'changan']) assert.ok(!inside(persia, id), `Persian Empire excludes ${id}`);
  const rome = poly('rome-han', 'two-empires', 0);
  const han = poly('rome-han', 'two-empires', 1);
  for (const id of ['rome', 'athens', 'alexandria', 'antioch', 'nimes', 'massalia', 'cyrene', 'byzantion']) assert.ok(inside(rome, id), `Roman Empire includes ${id}`);
  for (const id of ['meroe', 'aksum', 'merv', 'persepolis', 'pataliputra', 'changan']) assert.ok(!inside(rome, id), `Roman Empire excludes ${id}`);
  assert.ok(pointInPolygon([-0.1, 51.5], rome) && !pointInPolygon([-6.3, 53.3], rome) && !pointInPolygon([13.4, 52.5], rome), 'London in, Dublin and Berlin out');
  for (const id of ['changan', 'luoyang', 'anyang', 'qufu', 'yangtze-rice', 'dunhuang']) assert.ok(inside(han, id), `Han Empire includes ${id}`);
  for (const id of ['kashgar', 'pataliputra', 'merv', 'rome']) assert.ok(!inside(han, id), `Han Empire excludes ${id}`);
  // the smaller outline used in the last lesson: "inside the empire" and "outside" must come out as the text says
  const chr = one('beliefs', 'christianity').widget;
  const empire = chr.areas[0].polygon;
  for (const id of ['rome', 'jerusalem', 'athens', 'alexandria']) assert.ok(inside(empire, id), `${id} lies inside the Roman Empire`);
  for (const id of ['etchmiadzin', 'aksum', 'ctesiphon']) assert.ok(!inside(empire, id), `${id} lies outside the Roman Empire`);
  assert.deepEqual(chr.markers.map((m) => m.id), ['rome', 'etchmiadzin', 'jerusalem', 'ctesiphon', 'aksum'], 'letters A to E as the explanation uses them');
  assert.match(flat(one('beliefs', 'christianity').explain), /Armenia\*\* \(marker B\).*Aksum\*\* \(marker E\)/);
});

/* -------------------------------------------------- choices, photos, orders */

test('every choice has exactly one correct option and no duplicates; multi has both right and wrong options', () => {
  let seen = 0;
  const key = (o) => (o.figure && o.figure.src ? o.figure.src : flat(o.text));
  for (const { lesson, step } of allSteps()) {
    if (step.type !== 'choice' && step.type !== 'multi') continue;
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(5 + k * 97), step.id);
      const right = s.options.filter((o) => o.correct).length;
      if (step.type === 'choice') assert.equal(right, 1, `${lesson}/${step.id} seed ${k}`);
      else assert.ok(right >= 1 && right < s.options.length, `${lesson}/${step.id} seed ${k}`);
      assert.equal(new Set(s.options.map(key)).size, s.options.length, `${lesson}/${step.id} has duplicate options`);
      if (s.mode !== 'predict') assert.ok(s.explain && s.explain.length > 40, `${lesson}/${step.id}: explanation`);
      seen++;
      if (!step.gen) break;
    }
  }
  assert.ok(seen > 400);
});

test('every photo comes from the course\'s media manifest, with a licence, a credit and a description', () => {
  const used = new Set();
  for (const { lesson, step } of allSteps()) {
    const s = resolveStep(step, makeRng(3), step.id);
    const optionPhotos = new Set((s.options || []).map((o) => o.figure).filter(Boolean));
    for (const spec of figuresOf(s)) {
      if (spec.type !== 'photo') continue;
      const id = /world-ancient\/([a-z0-9-]+)\.jpg/.exec(spec.src);
      assert.ok(id, `${lesson}/${step.id}: picture ${spec.src} is not in this course's media folder`);
      const rec = manifest.images[id[1]];
      assert.ok(rec, `${lesson}/${step.id}: ${id[1]} is in the manifest`);
      assert.ok(rec.license && rec.sourceUrl && /commons\.wikimedia\.org/.test(rec.sourceUrl), `${id[1]}: licence and source`);
      assert.ok(rec.publicDomain || rec.author, `${id[1]}: credit`);
      assert.equal(spec.license, rec.license, `${id[1]}: the lesson shows the recorded licence`);
      assert.ok(spec.alt && spec.alt.length >= 40, `${lesson}/${step.id}: ${id[1]} needs a real description`);
      assert.ok(!/^(a |an |the )?(photo|image|picture)/i.test(spec.alt), `${lesson}/${step.id}: alt should describe, not announce`);
      if (optionPhotos.has(spec)) assert.ok(!spec.caption, `${lesson}/${step.id}: no caption on an answer option`);
      used.add(id[1]);
    }
    // hotspots: inside the picture, with labels, and the solution is one of them
    if (s.type === 'interact' && s.widget.type === 'photo') {
      const spots = s.widget.hotspots;
      assert.ok(spots.length >= 3, `${lesson}/${step.id}: at least three hotspots`);
      for (const h of spots) assert.ok(h.x > 0 && h.x < 1 && h.y > 0 && h.y < 1 && h.r >= 0.05 && h.label && h.alt, `${lesson}/${step.id}: hotspot ${h.id}`);
      assert.ok(spots.some((h) => h.id === s.solution.picked));
    }
  }
  assert.deepEqual([...used].sort(), Object.keys(manifest.images).sort(), 'every picture in the manifest is used, and nothing else');
  assert.ok(used.size >= 15 && used.size <= 25, `${used.size} pictures`);
  for (const [id, lesson] of Object.entries(lessons)) {
    const mine = new Set(lesson.steps.flatMap((st) => figuresOf(resolveStep(st, makeRng(3), st.id)).filter((f) => f.type === 'photo').map((f) => f.src)));
    assert.ok(mine.size >= 2 && mine.size <= 6, `${id}: ${mine.size} pictures`);
  }
});

// Static `order` steps. A list of years means "dated": the items, in the stated order, happened in these years
// (this file's figures). 'causal' marks a chain of cause and effect, which has no dates to check.
const STATIC_ORDERS = {
  'farming/chain': 'causal',
  'writing/tokens-order': 'causal',
  'rome-han/rome-order': [-753, -509, -146, -44, -27],          // founding legend, Republic, Carthage destroyed, Caesar killed, Augustus
  'beliefs/philosophers': [-470, -428, -384, -356],             // born: Socrates, Plato, Aristotle, Alexander
};

test('static order steps follow the dates', () => {
  const found = [];
  for (const { lesson, step } of allSteps()) {
    if (step.type !== 'order' || step.gen) continue;
    const key = `${lesson}/${step.id}`;
    found.push(key);
    const want = STATIC_ORDERS[key];
    assert.ok(want, `${key}: add this order step to STATIC_ORDERS`);
    const s = one(lesson, step.id);
    if (want === 'causal') { assert.ok(s.items.length >= 4); continue; }
    assert.equal(s.items.length, want.length, `${key}: one year per item`);
    for (let i = 1; i < want.length; i++) assert.ok(want[i] > want[i - 1], `${key}: item ${i + 1} is later than item ${i}`);
  }
  assert.deepEqual(found.sort(), Object.keys(STATIC_ORDERS).sort());
  const rome = one('rome-han', 'rome-order').items;
  assert.match(rome[0], /village/); assert.match(rome[1], /kings are driven out/); assert.match(rome[2], /Carthage/); assert.match(rome[3], /Julius Caesar/); assert.match(rome[4], /Augustus/);
  assert.deepEqual(one('beliefs', 'philosophers').items, ['Socrates', 'Plato', 'Aristotle', 'Alexander the Great']);
  // the teaching screen before the Rome step gives the same years (they stood in the step's explanation until
  // the lesson was revised to teach first), in its text and on its timeline
  const rise = one('rome-han', 'teach-rome-rise');
  assert.equal(rise.type, 'info');
  assert.ok(lessons['rome-han'].steps.findIndex((s) => s.id === 'teach-rome-rise') < lessons['rome-han'].steps.findIndex((s) => s.id === 'rome-order'), 'the years are shown before the order is asked for');
  for (const y of ['753 BCE', '509 BCE', '146 BCE', '44 BCE', '27 BCE']) assert.ok(flat(rise.text).includes(y), `teach-rome-rise gives ${y}`);
  const line = figuresOf(rise).find((f) => f.type === 'timeline');
  assert.deepEqual(line.events.slice(0, 3).map((e) => e.year), [-753, -146, -44]);
  assert.deepEqual(line.spans.map((sp) => [sp.from, sp.to]), [[-509, -27], [-27, 476]]);
});

// Teach before you ask (docs/AUTHORING.md). The shape is checked here; the substance (that each graded step asks
// only for what a screen above it has shown) was checked by reading every lesson with tools/outline.mjs.
const TEACHING_STEPS = {
  'peopling': ['teach-land-bridges', 'teach-evidence', 'teach-triangle'],
  'farming': ['teach-domestication', 'teach-surplus'],
  'river-valleys': ['teach-sumer', 'teach-timeline'],
  'writing': ['teach-tokens', 'teach-beyond-accounts'],
  'persia-greece': ['teach-two-cities', 'teach-timeline'],
  'rome-han': ['teach-rome-rise', 'teach-han', 'teach-after'],
  'beliefs': ['teach-buddhism', 'teach-china', 'teach-philosophers'],
};

test('teach before you ask', () => {
  assert.deepEqual(Object.keys(TEACHING_STEPS), LESSONS);
  for (const [id, lesson] of Object.entries(lessons)) {
    const role = (s) => (s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded === false ? 'explore' : 'graded');
    const roles = lesson.steps.map(role);
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: a teaching screen or an exploration comes before the first graded step`);
    assert.ok(roles.filter((r) => r === 'teach').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(roles.filter((r) => r === 'predict').length <= 2, `${id}: no more than two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    for (const stepId of TEACHING_STEPS[id]) {
      const s = one(id, stepId);
      assert.equal(s.type, 'info', `${id}/${stepId} is a teaching screen`);
      assert.ok(flat(s.text).length > 120, `${id}/${stepId} has something to say`);
    }
  }
  // what each new screen is there for: the thing a later graded step asks about is shown first
  const before = (lesson, a, b) => assert.ok(lessons[lesson].steps.findIndex((s) => s.id === a) < lessons[lesson].steps.findIndex((s) => s.id === b), `${lesson}: ${a} comes before ${b}`);
  const shows = (lesson, id, re) => assert.match(textOf(lesson, id), re, `${lesson}/${id}`);
  before('peopling', 'teach-land-bridges', 'dry-or-sea'); shows('peopling', 'teach-land-bridges', /Beringia.*Britain.*Madagascar.*New Zealand/);
  before('peopling', 'teach-triangle', 'find-places'); shows('peopling', 'teach-triangle', /Hawaii.*Rapa Nui.*Polynesian triangle.*Madagascar/);
  before('peopling', 'teach-evidence', 'hands'); before('peopling', 'routes', 'find-places'); shows('peopling', 'routes', /Madjedbebe/);
  // the table of first crops is built from the helper's list, so every crop a question can ask about is on it
  before('farming', 'centres', 'crop-origin');
  for (const o of ORIGINS) for (const it of o.items) assert.ok(flat(one('farming', 'centres').text).includes(it), `farming/centres lists ${it}`);
  before('farming', 'teach-domestication', 'teosinte'); before('farming', 'teach-surplus', 'chain'); shows('farming', 'teach-surplus', /surplus.*specialists.*rulers/);
  assert.notEqual(one('farming', 'gobekli').mode, 'predict', 'Göbekli Tepe is now a graded question about the evidence in its prompt');
  shows('farming', 'gobekli', /wild gazelle and wild cattle/);
  before('river-valleys', 'teach-sumer', 'signature'); shows('river-valleys', 'teach-sumer', /ziggurat.*clay tablets.*sixties.*1754 BCE/);
  before('river-valleys', 'teach-timeline', 'order-rivers');
  before('writing', 'teach-tokens', 'tokens-order'); before('writing', 'teach-beyond-accounts', 'what-changed'); shows('writing', 'teach-beyond-accounts', /Hammurabi.*282 laws.*Gilgamesh.*fears\s+death/);
  before('persia-greece', 'teach-two-cities', 'sparta-athens'); before('persia-greece', 'teach-two-cities', 'which-building'); shows('persia-greece', 'teach-two-cities', /Parthenon.*Two kings.*helots/);
  before('persia-greece', 'teach-timeline', 'order-classical'); shows('persia-greece', 'teach-timeline', /Socrates.*399 BCE/);
  before('persia-greece', 'persepolis', 'echo-words'); shows('persia-greece', 'persepolis', /paradise/);
  before('rome-han', 'teach-han', 'han-paper'); shows('rome-han', 'teach-han', /Papyrus.*Parchment.*Paper.*silk/);
  before('rome-han', 'teach-after', 'echo-latin'); shows('rome-han', 'teach-after', /Spanish, Portuguese, French, Italian and Romanian.*German and English.*Greek/);
  before('beliefs', 'teach-buddhism', 'ashoka'); shows('beliefs', 'teach-buddhism', /Eightfold Path.*wheel/);
  before('beliefs', 'teach-china', 'china'); shows('beliefs', 'teach-china', /state of Lu.*Analects.*Daodejing.*wu wei.*Legalism/);
  before('beliefs', 'teach-philosophers', 'philosophers'); shows('beliefs', 'teach-philosophers', /Socrates.*Plato.*Academy.*Aristotle.*Alexander/);
  // every dated event that a generated "put these in order" step can draw has its date on the lesson's own
  // timeline or in a text above the step (the pools are read from the step's variants)
  const dated = {
    'river-valleys/order-rivers': ['teach-timeline', 'mammoth', 'cleopatra', 'four-rivers', 'pyramids', 'others'],
    'writing/order-scripts': ['teach-beyond-accounts', 'hook', 'tokens-order', 'alphabet', 'alphabet-route', 'rosetta', 'oracle-bone'],
    'persia-greece/order-classical': ['teach-timeline', 'empire', 'greek-world', 'athens-vote', 'wars', 'alexander', 'eratosthenes', 'gandhara'],
  };
  for (const [key, sources] of Object.entries(dated)) {
    const [lesson, id] = key.split('/');
    const at = lessons[lesson].steps.findIndex((s) => s.id === id);
    for (const src of sources) assert.ok(lessons[lesson].steps.findIndex((s) => s.id === src) < at, `${lesson}: ${src} comes before ${id}`);
    const shown = sources.map((src) => textOf(lesson, src)).join(' ');
    const pool = new Set(variants(lesson, id).flatMap((s) => s.items.map((t) => idOfText[t])));
    for (const ev of pool) {
      const y = Math.abs(yearOf(ev));
      const figures = (EVENTS[ev].when.match(/\d[\d,]*/g) || []).map((n) => n.replace(/,/g, ''));
      // (a date given only in words, "in the first to third centuries CE", is matched by its century)
      const ok = figures.length ? [String(y), ...figures].some((n) => shown.includes(n) || shown.includes(Number(n).toLocaleString('en-US'))) : /century CE/.test(shown);
      assert.ok(ok, `${key}: the date of "${ev}" (${EVENTS[ev].when}) is shown before the step`);
    }
  }
});

/* ------------------------------------------------------- generated steps */

const GENERATED = {
  'peopling/find-places': 'marker', 'peopling/order-arrivals': 'order',
  'farming/crop-origin': 'origin', 'farming/find-centres': 'marker',
  'river-valleys/find-country': 'country', 'river-valleys/order-rivers': 'order',
  'writing/kind-of-sign': 'sign', 'writing/order-scripts': 'order',
  'persia-greece/find-greek': 'marker', 'persia-greece/order-classical': 'order',
  'rome-han/find-cities': 'marker', 'rome-han/find-state': 'country',
  'beliefs/which-tradition': 'tradition', 'beliefs/where-began': 'marker',
};

test('guard: every generated step in the course is covered by this file', () => {
  const found = allSteps().filter(({ step }) => typeof step.gen === 'function').map(({ lesson, step }) => `${lesson}/${step.id}`);
  assert.deepEqual(found.sort(), Object.keys(GENERATED).sort());
});

// "Which marker shows …?": a phrase of the question → the place it must be (this file's coordinates), and the
// minimum distance the generator promises between markers.
const MARKER_KEYS = {
  'peopling/find-places': { minKm: 2500, keys: [[/oldest known fossils/, 'jebel-irhoud'], [/part of Australia with the oldest known traces of people/, 'madjedbebe'], [/Beringia/, 'beringia'], [/French cave/, 'chauvet'], [/Indonesian island/, 'sulawesi'], [/settled by sailors from Borneo/, 'madagascar'], [/Hawaii/, 'hawaii'], [/Rapa Nui/, 'rapa-nui'], [/Aotearoa New Zealand/, 'aotearoa']] },
  'farming/find-centres': { minKm: 2500, keys: [[/wheat and barley/, 'fertile-crescent'], [/rice/, 'yangtze-rice'], [/maize/, 'balsas'], [/potatoes/, 'titicaca'], [/bananas and sugar cane/, 'kuk-swamp'], [/sorghum and pearl millet/, 'sahel'], [/sunflowers/, 'eastern-woodlands']] },
  'persia-greece/find-greek': { minKm: 500, keys: [[/Marseille/, 'massalia'], [/Naples/, 'neapolis'], [/Sicily/, 'syracuse'], [/strait between Europe and Asia/, 'byzantion'], [/coast of Africa/, 'cyrene'], [/\*\*Athens\*\*/, 'athens']] },
  'rome-han/find-cities': { minKm: 1300, keys: [[/\*\*Rome\*\*/, 'rome'], [/Antioch/, 'antioch'], [/Merv/, 'merv'], [/Dunhuang/, 'dunhuang'], [/Chang'an/, 'changan'], [/Pataliputra/, 'pataliputra'], [/Meroë/, 'meroe'], [/Aksum/, 'aksum']] },
  'beliefs/where-began': { minKm: 1000, keys: [[/Socrates, Plato and Aristotle/, 'athens'], [/Jerusalem/, 'jerusalem'], [/Armenia/, 'etchmiadzin'], [/Aksum/, 'aksum'], [/Ganges/, 'sarnath'], [/Confucius/, 'qufu']] },
};

for (const [key, { minKm, keys }] of Object.entries(MARKER_KEYS)) {
  test(`${key}: the marked answer is the place the question asks for, and no other marker could be`, () => {
    assert.equal(GENERATED[key], 'marker');
    const [lesson, id] = key.split('/');
    const asked = new Set();
    for (const s of variants(lesson, id)) {
      assert.equal(s.type, 'interact');
      const w = s.widget;
      assert.equal(w.mode, 'pickMarker');
      assert.equal(w.markerLabels, 'after', 'names stay hidden until the answer');
      assert.equal(w.markers.length, 4);
      assert.equal(new Set(w.markers.map((m) => m.id)).size, 4);
      const hits = keys.filter(([re]) => re.test(s.text));
      assert.equal(hits.length, 1, `exactly one key matches "${flat(s.text)}"`);
      const want = hits[0][1];
      asked.add(want);
      assert.equal(w.answer, want, flat(s.text));
      assert.deepEqual(s.solution, { picked: want });
      const target = w.markers.find((m) => m.id === want);
      assert.ok(target, 'the answer is on the map');
      assert.ok(distanceKm(target.at, OWN_PLACES[want].slice(0, 2)) <= OWN_PLACES[want][3], `${want} is drawn where this file puts it`);
      assert.equal(s.check({ picked: want }), true);
      assert.equal(s.check({ picked: null }), false);
      for (const m of w.markers) {
        assert.ok(OWN_PLACES[m.id], `${m.id} is a known place`);
        assert.equal(m.label, PLACES[m.id].name);
        if (m.id === want) continue;
        const said = s.check({ picked: m.id });
        assert.equal(typeof said, 'string', `a wrong marker gets a message (${m.id})`);
        assert.ok(said.includes(PLACES[m.id].name), `the message names the place: ${said}`);
        assert.ok(distanceKm(m.at, target.at) >= minKm, `${m.id} is ${Math.round(distanceKm(m.at, target.at))} km from ${want}`);
      }
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(distanceKm(w.markers[i].at, w.markers[j].at) >= minKm, 'markers are well apart');
      // letters run west to east, and the explanation names the right letter
      const lons = w.markers.map((m) => m.at[0]);
      assert.deepEqual(lons, lons.slice().sort((a, b) => a - b), 'markers are listed from west to east');
      const letter = 'ABCD'[w.markers.indexOf(target)];
      assert.ok(s.explain.startsWith(`Marker ${letter} is **${PLACES[want].name}**`), s.explain);
    }
    assert.ok(asked.size >= Math.min(6, keys.length), `${asked.size} different places asked for`);
  });
}

// "Tap the modern country …": a phrase of the question → the country (this file's table).
const COUNTRY_KEYS = {
  'river-valleys/find-country': [[/Uruk and Ur/, 'IQ'], [/pyramids of Giza/, 'EG'], [/Mohenjo-daro and Harappa/, 'PK'], [/Anyang/, 'CN']],
  'rome-han/find-state': [[/city of \*\*Rome\*\*/, 'IT'], [/Chang'an/, 'CN'], [/Pataliputra/, 'IN'], [/Meroë/, 'SD'], [/Aksum/, 'ET'], [/Ctesiphon/, 'IQ']],
};

for (const [key, keys] of Object.entries(COUNTRY_KEYS)) {
  test(`${key}: the answer is the right modern country, and every other country is refused with a message`, () => {
    assert.equal(GENERATED[key], 'country');
    const [lesson, id] = key.split('/');
    const asked = new Set();
    for (const s of variants(lesson, id)) {
      const w = s.widget;
      assert.equal(w.mode, 'pick');
      const hits = keys.filter(([re]) => re.test(s.text));
      assert.equal(hits.length, 1, flat(s.text));
      const cc = hits[0][1];
      asked.add(cc);
      assert.equal(w.answer, cc);
      assert.deepEqual(s.solution, { picked: cc });
      assert.ok(w.pickable.includes(cc), 'the answer can be tapped');
      assert.equal(new Set(w.pickable).size, w.pickable.length);
      assert.equal(s.check({ picked: cc, name: countryName(cc) }), true);
      assert.equal(s.check({ picked: null, name: null }), false);
      for (const other of w.pickable) {
        if (other === cc) continue;
        const said = s.check({ picked: other, name: countryName(other) });
        assert.equal(typeof said, 'string', `${other} gets a message`);
        assert.ok(said.startsWith(`That is ${countryName(other)}`), said);
      }
      assert.ok(s.explain.includes(`**${countryName(cc)}**`), `the explanation names ${countryName(cc)}: ${s.explain}`);
      // no disputed territory can be the answer or be offered
      for (const c of w.pickable) assert.ok(!['TW', 'PS', 'IL', 'XK', 'EH', 'CY'].includes(c), `${c} is not offered`);
      // the view contains the answer
      const [wst, sth, est, nth] = w.view;
      const c = countryInfo(cc).center;
      assert.ok(c[0] > wst && c[0] < est && c[1] > sth && c[1] < nth, `${cc} is inside the view`);
    }
    assert.equal(asked.size, keys.length, 'every country is asked for');
    // each key's country agrees with this file's place table
    const place = { 'IQ': 'uruk', 'EG': 'giza', 'PK': 'mohenjo-daro', 'CN': 'anyang', 'IT': 'rome', 'IN': 'pataliputra', 'SD': 'meroe', 'ET': 'aksum' };
    for (const [, cc] of keys) assert.equal(OWN_PLACES[place[cc]][2], cc);
    assert.equal(OWN_PLACES.ctesiphon[2], 'IQ'); assert.equal(OWN_PLACES.changan[2], 'CN'); assert.equal(OWN_PLACES.harappa[2], 'PK'); assert.equal(OWN_PLACES.ur[2], 'IQ');
  });
}

// Generated order steps: the pool each one draws from is re-read here from the helper wording, and the order is
// judged with THIS file's ranges: each item's latest year must lie before the next item's earliest year.
const ORDER_STEPS = {
  'peopling/order-arrivals': { gap: 300 },
  'river-valleys/order-rivers': { gap: 150 },
  'writing/order-scripts': { gap: 150 },
  'persia-greece/order-classical': { gap: 40 },
};
const idOfText = Object.fromEntries(Object.entries(EVENTS).map(([id, e]) => [e.text, id]));

for (const [key, { gap }] of Object.entries(ORDER_STEPS)) {
  test(`${key}: the stated order is beyond dispute by this file's dates`, () => {
    assert.equal(GENERATED[key], 'order');
    const [lesson, id] = key.split('/');
    const seen = new Set();
    for (const s of variants(lesson, id)) {
      assert.equal(s.type, 'order');
      assert.equal(s.items.length, 4);
      assert.equal(new Set(s.items).size, 4);
      const ids = s.items.map((t) => { assert.ok(idOfText[t], `"${t}" is an event of the course`); return idOfText[t]; });
      for (let i = 1; i < ids.length; i++) {
        const [, hiPrev] = OWN_DATES[ids[i - 1]];
        const [loNext] = OWN_DATES[ids[i]];
        assert.ok(hiPrev < loNext, `${ids[i - 1]} (to ${hiPrev}) must clearly precede ${ids[i]} (from ${loNext})`);
        assert.ok(clearlyBefore(ids[i - 1], ids[i], { gap }), 'and the helper agrees');
      }
      for (const x of ids) assert.ok(s.explain.includes(EVENTS[x].when), 'the explanation gives each date');
      seen.add(ids.join());
    }
    assert.ok(seen.size >= 5, `${seen.size} different orders`);
  });
}

test('clearlyBefore never calls two overlapping events ordered', () => {
  const ids = Object.keys(EVENTS);
  for (const a of ids) for (const b of ids) {
    if (a === b) continue;
    if (clearlyBefore(a, b, { gap: 1 })) {
      assert.ok(rangeOf(a)[1] < rangeOf(b)[0]);
      assert.ok(!clearlyBefore(b, a, { gap: 1 }));
    }
  }
  // spot checks of pairs that must NOT be offered as "clearly ordered"
  assert.ok(!clearlyBefore('australia', 'europe', { gap: 300, ratio: 1.4 }) && !clearlyBefore('europe', 'australia', { gap: 300, ratio: 1.4 }));
  assert.ok(!clearlyBefore('hawaii', 'aotearoa', { gap: 300 }) && !clearlyBefore('rapa-nui', 'aotearoa', { gap: 300 }));
  assert.ok(!clearlyBefore('cuneiform', 'hieroglyphs', { gap: 150 }) && !clearlyBefore('uruk-city', 'egypt-unified', { gap: 150 }));
  assert.ok(!clearlyBefore('marathon', 'salamis', { gap: 40 }) && !clearlyBefore('qin', 'han-begins', { gap: 40 }));
  // and of pairs that must be
  assert.ok(clearlyBefore('pyramid', 'mammoth', { gap: 150 }), 'the Great Pyramid is older than the last mammoths');
  assert.ok(clearlyBefore('sapiens', 'australia', { gap: 300, ratio: 1.4 }) && clearlyBefore('americas', 'aotearoa', { gap: 300, ratio: 1.4 }));
});

test('farming/crop-origin: one correct option, right by this file\'s list, and no distractor is also true', () => {
  assert.deepEqual(ORIGINS.flatMap((o) => o.items).sort(), Object.keys(OWN_ORIGINS).sort(), 'the helper offers exactly the crops this file knows');
  for (const o of ORIGINS) for (const it of o.items) assert.equal(OWN_ORIGINS[it], o.id, `${it}: ${o.id}`);
  const regionOf = (text) => { const hit = Object.entries(REGION_WORDS).filter(([, re]) => re.test(text)); assert.equal(hit.length, 1, `one region in "${text}"`); return hit[0][0]; };
  const seen = new Set();
  for (const s of variants('farming', 'crop-origin', 300)) {
    assert.equal(s.options.length, 4);
    const right = s.options.filter((o) => o.correct);
    assert.equal(right.length, 1);
    const which = /Which of these was first farmed in \*\*(.+)\*\*\?/.exec(s.text);
    const where = /\*\*(.+)\*\*\?$/.exec(flat(s.text));
    if (which) {
      const region = regionOf(which[1]);
      const item = right[0].text.toLowerCase();
      assert.equal(OWN_ORIGINS[item], region, `${item} was first farmed in ${region}`);
      for (const o of s.options) if (!o.correct) { assert.ok(OWN_ORIGINS[o.text.toLowerCase()], `${o.text} is a known crop`); assert.notEqual(OWN_ORIGINS[o.text.toLowerCase()], region, `${o.text} would also be right`); assert.ok(o.why.startsWith(o.text), o.why); }
      seen.add(`A:${item}`);
    } else {
      assert.match(s.text, /^Where did (people first keep (herds|flocks) of|farmers first grow) \*\*/);
      const item = where[1];
      assert.ok(OWN_ORIGINS[item], `${item} is a known crop`);
      assert.equal(/herds/.test(s.text), ['sheep', 'goats', 'llamas'].includes(item), 'grazing animals are kept in herds');
      assert.equal(/flocks/.test(s.text), item === 'turkeys', 'birds are kept in flocks');
      assert.equal(regionOf(right[0].text), OWN_ORIGINS[item]);
      for (const o of s.options) if (!o.correct) assert.notEqual(regionOf(o.text), OWN_ORIGINS[item]);
      assert.equal(new Set(s.options.map((o) => regionOf(o.text))).size, 4);
      seen.add(`B:${item}`);
    }
    assert.ok(s.explain.toLowerCase().startsWith(`${[...right][0].correct && which ? right[0].text.toLowerCase() : where[1]}: first`), s.explain);
  }
  assert.ok(seen.size >= 25, `${seen.size} variants`);
});

test('farming: the fixed sorting step and the map of centres agree with this file\'s list', () => {
  const s = one('farming', 'sort-crops');
  const bucketOf = { 'sw-asia': 0, 'china': 1, 'mesoamerica': 2, 'andes': 2 };
  assert.deepEqual(s.buckets, ['South-west Asia', 'East Asia', 'The Americas']);
  for (const it of s.items) assert.equal(it.bucket, bucketOf[OWN_ORIGINS[it.text.toLowerCase()]], it.text);
});

test('writing/kind-of-sign: the kind of each sign is right', () => {
  const OWN = { '7': 0, '&': 0, '%': 0, '山': 0, '日': 0, 'か': 1, 'ま': 1, 'の': 1, 'm': 2, 'λ': 2, 'ب': 2 };
  const seen = new Set();
  for (const s of variants('writing', 'kind-of-sign')) {
    const sign = /^The sign \*\*(.+?)\*\* is/.exec(s.text)[1];
    assert.ok(sign in OWN, `sign ${sign}`);
    assert.deepEqual(s.options.map((o) => o.text), ['A whole word or idea', 'A syllable', 'A single sound']);
    assert.deepEqual(s.options.map((o) => !!o.correct), [0, 1, 2].map((k) => k === OWN[sign]));
    assert.match(s.explain, [/logogram/, /syllab/, /letter/][OWN[sign]]);
    seen.add(sign);
  }
  assert.equal(seen.size, Object.keys(OWN).length);
});

test('beliefs/which-tradition: each clue points to one tradition only, and the marked answer is that one', () => {
  assert.deepEqual(TRADITIONS.map((t) => t.name).sort(), Object.keys(OWN_TRADITIONS).sort());
  for (const t of TRADITIONS) {
    for (const clue of t.clues) {
      const hits = Object.entries(OWN_TRADITIONS).filter(([, re]) => re.test(clue)).map(([name]) => name);
      assert.deepEqual(hits, [t.name], `clue "${clue}" must identify ${t.name} and nothing else`);
      for (const other of TRADITIONS) if (other !== t) assert.ok(!clue.includes(other.name), 'a clue does not name a tradition');
      assert.ok(!/\b(true|false|myth|superstition|primitive|pagan|merely|so-called)\b/i.test(clue), `neutral wording: ${clue}`);
    }
    assert.ok(PLACES[t.place], `${t.name}: place`);
  }
  const seen = new Set();
  for (const s of variants('beliefs', 'which-tradition', 300)) {
    const clue = flat(s.text).replace(/^\*\*Which tradition is this\?\*\* > /, '');
    const hits = Object.entries(OWN_TRADITIONS).filter(([, re]) => re.test(clue)).map(([name]) => name);
    assert.equal(hits.length, 1, clue);
    assert.equal(s.options.length, 4);
    assert.deepEqual(s.options.filter((o) => o.correct).map((o) => o.text), hits);
    assert.equal(new Set(s.options.map((o) => o.text)).size, 4);
    for (const o of s.options) { assert.ok(OWN_TRADITIONS[o.text], o.text); if (!o.correct) assert.ok(o.why && o.why.includes(o.text), 'a wrong option says what that tradition is'); }
    seen.add(clue);
  }
  assert.equal(seen.size, TRADITIONS.length * 2, 'every clue appears');
});

/* --------------------------------------------- timelines and fixed interactions */

test('timelines: no year 0, everything inside the axis, and dates that match this file', () => {
  let count = 0;
  for (const { lesson, step } of allSteps()) {
    const s = resolveStep(step, makeRng(2), step.id);
    for (const spec of figuresOf(s)) {
      if (spec.type !== 'timeline') continue;
      count++;
      const log = spec.scale === 'log-ago';
      const from = log ? NOW - spec.fromAgo : spec.from;
      const to = log ? NOW - spec.toAgo : spec.to;
      for (const e of spec.events || []) {
        const y = Number.isFinite(e.ago) ? NOW - e.ago : e.year;
        assert.ok(y !== 0 && y >= from && y <= to, `${lesson}/${step.id}: event ${e.label}`);
        assert.ok(e.label && e.label.length <= 28, `${lesson}/${step.id}: short label "${e.label}"`);
      }
      for (const sp of spec.spans || []) assert.ok(sp.from < sp.to && sp.from >= from && sp.to <= to && sp.from !== 0 && sp.to !== 0, `${lesson}/${step.id}: span ${sp.label}`);
      assert.ok((spec.events || []).length <= 8, `${lesson}/${step.id}: not too many events for a phone`);
    }
  }
  assert.ok(count >= 6, `${count} timelines`);
  const within = (y, id) => assert.ok(y >= OWN_DATES[id][0] && y <= OWN_DATES[id][1], `${id}: ${y}`);
  const ev = (lesson, id, eid) => figuresOf(one(lesson, id)).find((f) => f.type === 'timeline').events.find((e) => e.id === eid);
  const sp = (lesson, id, sid) => figuresOf(one(lesson, id)).find((f) => f.type === 'timeline').spans.find((e) => e.id === sid);
  within(NOW - ev('peopling', 'deep-time', 'sapiens').ago, 'sapiens');
  within(NOW - ev('peopling', 'deep-time', 'pyramid').ago, 'pyramid');
  within(ev('peopling', 'pacific-story', 'lapita').year, 'lapita');
  within(ev('peopling', 'pacific-story', 'nz').year, 'aotearoa');
  within(ev('farming', 'when', 'fc').year, 'fertile-crescent');
  within(ev('farming', 'when', 'pyr').year, 'pyramid');
  within(ev('river-valleys', 'cleopatra', 'pyr').year, 'pyramid');
  within(ev('river-valleys', 'cleopatra', 'cleo').year, 'cleopatra');
  assert.equal(ev('river-valleys', 'cleopatra', 'moon').year, 1969);
  assert.deepEqual([sp('rome-han', 'when', 'rep').from, sp('rome-han', 'when', 'rep').to, sp('rome-han', 'when', 'emp').to], [-509, -27, 476]);
  assert.equal(ev('rome-han', 'when', 'hannibal').year, -218);
  assert.deepEqual([sp('beliefs', 'when', 'confucius').from, sp('beliefs', 'when', 'confucius').to], [-551, -479]);
  assert.deepEqual([sp('beliefs', 'when', 'socrates').from, sp('beliefs', 'when', 'socrates').to], [-470, -399]);
  within(ev('beliefs', 'when', 'temple').year, 'temple-destroyed');
  within(ev('beliefs', 'when', 'jesus').year, 'jesus');
  within(ev('beliefs', 'when', 'legal').year, 'constantine');
  // Cleopatra is nearer to the Moon landing than to the Great Pyramid (no year 0: 30 BCE to 1969 CE is 1,998 years)
  const toPyramid = -30 - -2560;
  const toMoon = 1969 + 30 - 1;
  assert.ok(toMoon < toPyramid && toMoon === 1998 && toPyramid === 2530);
  assert.equal(one('river-valleys', 'cleopatra').options.find((o) => o.correct).text, 'Nearer to the Moon landing');
  // the hook of the farming lesson: 11,500 years out of 300,000 is about 4%
  const hook = one('farming', 'hook');
  assert.ok(Math.abs(hook.answer - (11500 / 300000) * 100) < 0.5);
});

test('peopling/deep-time: the solution passes and placements outside the stated stretch fail with a message', () => {
  const s = one('peopling', 'deep-time');
  const st = (aus, ame) => ({ placed: { australia: aus == null ? null : NOW - aus, americas: ame == null ? null : NOW - ame }, complete: aus != null && ame != null, count: 2 });
  assert.equal(s.check({ placed: s.solution.placed, complete: true, count: 2 }), true);
  for (const [aus, ame] of [[50000, 15000], [65000, 23000], [45000, 13000], [70000, 25000]]) assert.equal(s.check(st(aus, ame)), true, `${aus}, ${ame}`);
  for (const [aus, ame] of [[30000, 15000], [200000, 15000], [50000, 40000], [50000, 8000], [12000, 50000]]) assert.equal(typeof s.check(st(aus, ame)), 'string', `${aus}, ${ame}`);
  assert.equal(typeof s.check(st(null, 15000)), 'string');
  // the accepted stretches contain this file's ranges for both events
  for (const y of OWN_DATES.australia.slice(0, 2)) assert.equal(s.check({ placed: { australia: y, americas: NOW - 15000 }, complete: true }), true);
  for (const y of OWN_DATES.americas.slice(0, 2)) assert.equal(s.check({ placed: { australia: NOW - 50000, americas: y }, complete: true }), true);
});

test('rome-han/when: the solution passes; a card more than 60 years off fails', () => {
  const s = one('rome-han', 'when');
  const st = (start, end) => ({ placed: { start, end }, complete: start != null && end != null, count: 2 });
  assert.match(flat(s.text), /Within 60 years counts/);
  assert.equal(s.check(st(s.solution.placed.start, s.solution.placed.end)), true);
  for (const [a, b] of [[-206, 220], [-260, 280], [-150, 160], [-200, 200]]) assert.equal(s.check(st(a, b)), true, `${a}, ${b}`);
  for (const [a, b] of [[-270, 220], [-140, 220], [-206, 290], [-206, 150], [-500, 476], [220, -206]]) assert.equal(typeof s.check(st(a, b)), 'string', `${a}, ${b}`);
  assert.equal(typeof s.check(st(null, 220)), 'string');
  assert.deepEqual(s.widget.place.map((c) => c.answer), [-206, 220]);
  within206();
  function within206() { assert.ok(-206 >= OWN_DATES['han-begins'][0] && -206 <= OWN_DATES['han-begins'][1] && OWN_DATES['han-ends'][0] === 220); }
});

test('explore steps on a timeline: the right dot or bar passes, the others get a message', () => {
  const farm = one('farming', 'when');
  assert.equal(farm.graded, false);
  assert.equal(farm.check({ selected: farm.solution.selected, seenCount: 1 }), true);
  assert.equal(farm.solution.selected, 'fc');
  // the first centre of farming is the earliest green event on the line, by this file's dates too
  const green = farm.widget.events.filter((e) => e.id !== 'pyr');
  assert.equal(green.slice().sort((a, b) => a.year - b.year)[0].id, 'fc');
  assert.ok(OWN_DATES['fertile-crescent'][1] < Math.min(OWN_DATES.rice[0], OWN_DATES.maize[0]) + 2500, 'the Fertile Crescent comes first');
  for (const e of [...farm.widget.events, ...farm.widget.spans]) {
    assert.ok(e.note && e.note.length > 30, `farming/when: ${e.id} has a note`);
    if (e.id !== 'fc') assert.equal(typeof farm.check({ selected: e.id, seenCount: 1 }), 'string', e.id);
  }
  assert.equal(typeof farm.check({ selected: null, seenCount: 0 }), 'string');

  const bel = one('beliefs', 'when');
  assert.equal(bel.graded, false);
  assert.equal(bel.check({ selected: bel.solution.selected, seenCount: 1 }), true);
  // Confucius, the Buddha and Socrates: all three lifetimes fall between 551 and 399 BCE on the line
  const spans = Object.fromEntries(bel.widget.spans.map((sp) => [sp.id, sp]));
  for (const id of ['confucius', 'buddha', 'socrates']) {
    assert.equal(bel.check({ selected: id, seenCount: 1 }), true, id);
    assert.ok(spans[id].from >= -551 && spans[id].to <= -399, id);
  }
  for (const e of [...bel.widget.events, ...bel.widget.spans]) {
    assert.ok(e.note && e.note.length > 30, `beliefs/when: ${e.id} has a note`);
    if (!['confucius', 'buddha', 'socrates'].includes(e.id)) assert.equal(typeof bel.check({ selected: e.id, seenCount: 1 }), 'string', e.id);
  }
  assert.equal(typeof bel.check({ selected: null, seenCount: 0 }), 'string');
});

// Fixed map and photo interactions: [lesson, step, wrong states that must be refused]. `true` in a wrong state's
// place of a message means "must return a string".
const FIXED = [
  ['peopling', 'trace-pacific', [{ route: ['taiwan', 'new-britain', 'samoa'], count: 3 }, { route: ['new-britain', 'taiwan', 'samoa', 'tahiti', 'aotearoa'], count: 5 }, { route: ['taiwan', 'aotearoa', 'new-britain', 'samoa', 'tahiti'], count: 5 }, { route: ['taiwan', 'samoa', 'new-britain', 'tahiti', 'aotearoa'], count: 5 }]],
  ['farming', 'axis', [{ picked: 'a' }, { picked: 'b' }, { picked: 'd' }]],
  ['river-valleys', 'others', [{ picked: 'amazon' }, { picked: 'la-venta' }, { picked: 'pampas' }]],
  ['writing', 'invented-where', [{ picked: 'uruk' }, { picked: 'abydos' }, { picked: 'anyang' }]],
  ['writing', 'alphabet-route', [{ route: ['serabit', 'byblos'], count: 2 }, { route: ['rome', 'athens', 'byblos', 'serabit'], count: 4 }, { route: ['serabit', 'athens', 'byblos', 'rome'], count: 4 }, { route: ['serabit', 'byblos', 'rome', 'athens'], count: 4 }]],
  ['persia-greece', 'alexander', [{ route: ['pella', 'alexandria'], count: 2 }, { route: ['alexandria', 'pella', 'babylon', 'samarkand', 'taxila'], count: 5 }, { route: ['pella', 'babylon', 'alexandria', 'samarkand', 'taxila'], count: 5 }, { route: ['pella', 'alexandria', 'babylon', 'taxila', 'samarkand'], count: 5 }]],
  ['beliefs', 'travels', [{ route: ['bodh-gaya', 'taxila'], count: 2 }, { route: ['luoyang', 'dunhuang', 'kashgar', 'taxila', 'bodh-gaya'], count: 5 }, { route: ['bodh-gaya', 'luoyang', 'dunhuang', 'kashgar', 'taxila'], count: 5 }, { route: ['bodh-gaya', 'taxila', 'dunhuang', 'kashgar', 'luoyang'], count: 5 }]],
  ['beliefs', 'christianity', [{ picked: ['aksum'], count: 1 }, { picked: ['aksum', 'rome'], count: 2 }, { picked: ['ctesiphon', 'etchmiadzin'], count: 2 }, { picked: ['etchmiadzin', 'jerusalem'], count: 2 }]],
  ['farming', 'teosinte', [{ picked: 'maize' }, { picked: 'hybrid' }]],
  ['river-valleys', 'standard-of-ur', [{ picked: 'guests' }, { picked: 'musician' }, { picked: 'herders' }, { picked: 'porters' }]],
  ['writing', 'beer-tablet', [{ picked: 'dent' }, { picked: 'arcs' }]],
];

test('fixed map and photo interactions: the solution passes, plausible wrong states do not', () => {
  const covered = new Set(FIXED.map(([l, id]) => `${l}/${id}`));
  for (const [lesson, id, wrong] of FIXED) {
    const s = one(lesson, id);
    assert.equal(s.type, 'interact');
    const sol = { ...s.solution };
    if (sol.route) sol.count = sol.route.length;
    if (Array.isArray(sol.picked)) { sol.picked = sol.picked.slice().sort(); sol.count = sol.picked.length; }
    assert.equal(s.check(sol), true, `${lesson}/${id}: solution`);
    for (const state of wrong) {
      const said = s.check(state);
      assert.notEqual(said, true, `${lesson}/${id}: ${JSON.stringify(state)} must not pass`);
      assert.equal(typeof said, 'string', `${lesson}/${id}: ${JSON.stringify(state)} deserves a message`);
      assert.ok(said.length > 15);
    }
    assert.notEqual(s.check(s.widget.mode === 'trace' ? { route: [], count: 0 } : Array.isArray(s.solution.picked) ? { picked: [], count: 0 } : { picked: null }), true, `${lesson}/${id}: nothing chosen`);
    // the `answer` shown on the map afterwards is the solution
    if (s.widget.type === 'world-map') assert.deepEqual([].concat(s.widget.answer).slice().sort(), [].concat(s.solution.route || s.solution.picked).slice().sort(), `${lesson}/${id}: answer shown = solution`);
    // every marker that can be tapped stands where this file's table puts that place
    if (s.widget.type === 'world-map') for (const m of s.widget.markers) if (m.id && OWN_PLACES[m.id]) assert.ok(distanceKm(m.at, OWN_PLACES[m.id].slice(0, 2)) <= OWN_PLACES[m.id][3], `${lesson}/${id}: ${m.id}`);
  }
  // the photo step of the last lesson, whatever its hotspots are called
  const ashoka = one('beliefs', 'ashoka');
  assert.equal(ashoka.check(ashoka.solution), true);
  for (const h of ashoka.widget.hotspots) if (h.id !== ashoka.solution.picked) assert.equal(typeof ashoka.check({ picked: h.id }), 'string');
  covered.add('beliefs/ashoka');
  // guard: no fixed interact step is left unchecked (generated ones and timelines are covered above)
  const others = new Set(['peopling/deep-time', 'rome-han/when', 'farming/when', 'beliefs/when']);
  for (const { lesson, step } of allSteps()) {
    if (step.type !== 'interact' || step.gen) continue;
    const key = `${lesson}/${step.id}`;
    assert.ok(covered.has(key) || others.has(key) || EXTRA_INTERACT.has(key), `${key}: add this interact step to the tests`);
  }
});

// Interact steps added after the first draft are listed here together with their own test below.
const EXTRA_INTERACT = new Set(['persia-greece/gandhara']);

test('persia-greece/gandhara: the Greek-looking details pass, the others get a message', () => {
  const s = one('persia-greece', 'gandhara');
  if (s.type !== 'interact') return;                       // the step is a plain choice in some drafts
  assert.equal(s.check(s.solution), true);
  const right = s.widget.hotspots.filter((h) => s.check({ picked: h.id }) === true).map((h) => h.id);
  assert.ok(right.length >= 1 && right.length < s.widget.hotspots.length);
  for (const h of s.widget.hotspots) if (!right.includes(h.id)) assert.equal(typeof s.check({ picked: h.id }), 'string', h.id);
  assert.equal(s.check({ picked: null }), false);
});

test('the trade and travel routes run the way the text says', () => {
  // Pacific: each leg of the settlement route goes east (across the date line) until the last, which turns south-west
  const east = (a, b) => { let d = OWN_PLACES[b][0] - OWN_PLACES[a][0]; if (d < -180) d += 360; if (d > 180) d -= 360; return d; };
  const pac = one('peopling', 'trace-pacific').solution.route;
  assert.deepEqual(pac, ['taiwan', 'new-britain', 'samoa', 'tahiti', 'aotearoa']);
  assert.ok(east('taiwan', 'new-britain') > 0 && east('new-britain', 'samoa') > 0 && east('samoa', 'tahiti') > 0 && east('tahiti', 'aotearoa') < 0);
  assert.ok(OWN_PLACES.aotearoa[1] < OWN_PLACES.tahiti[1], 'New Zealand is the most southerly');
  // the alphabet: Sinai is the southernmost marker, and the route ends furthest west
  const alpha = one('writing', 'alphabet-route').solution.route;
  assert.deepEqual(alpha, ['serabit', 'byblos', 'athens', 'rome']);
  assert.ok(alpha.every((id) => OWN_PLACES.serabit[1] <= OWN_PLACES[id][1]) && east('byblos', 'athens') < 0 && east('athens', 'rome') < 0);
  // Alexander: years of arrival in this file's own notes
  const alex = { pella: -334, alexandria: -331.5, babylon: -331, samarkand: -329, taxila: -326 };
  const route = one('persia-greece', 'alexander').solution.route;
  for (let i = 1; i < route.length; i++) assert.ok(alex[route[i]] > alex[route[i - 1]], `${route[i - 1]} before ${route[i]}`);
  // Buddhism to China: round the Tibetan Plateau, never across it
  const bud = one('beliefs', 'travels').solution.route;
  assert.deepEqual(bud, ['bodh-gaya', 'taxila', 'kashgar', 'dunhuang', 'luoyang']);
  assert.ok(east('bodh-gaya', 'taxila') < 0 && OWN_PLACES.taxila[1] > OWN_PLACES['bodh-gaya'][1], 'first north-west');
  assert.ok(east('kashgar', 'dunhuang') > 0 && east('dunhuang', 'luoyang') > 0, 'then east');
  for (const id of ['kashgar', 'dunhuang']) assert.ok(OWN_PLACES[id][1] > 38, `${id} lies north of the plateau`);
  // Eratosthenes: Syene is about 800 km from Alexandria, almost due south, near the tropic
  const d = distanceKm(OWN_PLACES.alexandria.slice(0, 2), OWN_PLACES.syene.slice(0, 2));
  assert.ok(d > 750 && d < 900, `Alexandria to Syene: ${Math.round(d)} km`);
  assert.ok(Math.abs(OWN_PLACES.syene[1] - 23.44) < 1, 'Syene lies close to the Tropic of Cancer');
  assert.ok(Math.abs((OWN_PLACES.alexandria[1] - OWN_PLACES.syene[1]) - 7.2) < 0.3, 'the two cities are about 7.2 degrees of latitude apart');
  const era = one('persia-greece', 'eratosthenes');
  assert.deepEqual(era.blanks.map((b) => Number(b.answers ? b.answers[0] : b.answer)), [360 / 7.2, (360 / 7.2) * 800]);
});

test('fill, bucket and match steps: the keys are right', () => {
  // sixty minutes, sixty seconds, 360 degrees
  const sixty = one('river-valleys', 'echo-sixty');
  assert.deepEqual(sixty.blanks.map((b) => Number(b.answers ? b.answers[0] : b.answer)), [60, 60, 360]);
  // Ice Age land bridges
  const dry = one('peopling', 'dry-or-sea');
  const DRY = { 'Siberia to Alaska': 0, 'Mainland Asia to Java': 0, 'France to Britain': 0, 'Australia to Tasmania': 0, 'Java to Australia': 1, 'Africa to Madagascar': 1, 'Australia to New Zealand': 1, 'Tahiti to Hawaii': 1 };
  assert.deepEqual(Object.fromEntries(dry.items.map((it) => [it.text, it.bucket])), DRY);
  // Athens and Sparta
  const as = one('persia-greece', 'sparta-athens');
  assert.deepEqual(as.buckets, ['Athens', 'Sparta']);
  for (const it of as.items) assert.equal(it.bucket, /lottery|theatre|fleet|Parthenon/.test(it.text) ? 0 : 1, it.text);
  assert.equal(as.items.filter((it) => it.bucket === 0).length, 4);
  // Rome and Han
  const rh = one('rome-han', 'compare');
  assert.deepEqual(rh.buckets, ['Rome', 'Han China', 'Both']);
  for (const it of rh.items) assert.equal(it.bucket, /Latin|aqueducts/.test(it.text) ? 0 : /Confucius|Paper|silkworms/.test(it.text) ? 1 : 2, it.text);
  // Latin's daughters
  const latin = one('rome-han', 'echo-latin');
  assert.deepEqual(latin.options.filter((o) => o.correct).map((o) => o.text).sort(), ['French', 'Portuguese', 'Romanian', 'Spanish']);
  assert.deepEqual(latin.options.filter((o) => !o.correct).map((o) => o.text).sort(), ['English', 'German', 'Greek']);
  // navigation without instruments
  const way = one('peopling', 'wayfinding');
  for (const o of way.options) assert.equal(!!o.correct, !/compass|Charts/.test(o.text), o.text);
  // matches: the left side is unique and each pair is what this file expects
  const pairs = (lesson, id) => Object.fromEntries(one(lesson, id).pairs.map((p) => [flat(p[0]), flat(p[1])]));
  const sig = pairs('river-valleys', 'signature');
  assert.match(sig['Egypt (Nile)'], /pyramids and hieroglyphs/); assert.match(sig['Indus valley'], /drains/); assert.match(sig['Shang China (Yellow River)'], /bronze/);
  assert.match(sig['Mesopotamia (Tigris and Euphrates)'], /clay tablets/); assert.match(sig['Caral (Peru)'], /no pottery/);
  const wr = pairs('writing', 'what-changed');
  assert.match(wr['The Rosetta Stone'], /three scripts/); assert.match(wr['Shang oracle bones'], /ancestors/); assert.match(wr['The Epic of Gilgamesh'], /poem/);
  const words = pairs('persia-greece', 'echo-words');
  assert.match(words.paradise, /Persian/); assert.match(words.democracy, /people/); assert.match(words.marathon, /490 BCE/);
});

/* ------------------------------------------------- added by the reviewer */

// Spans and distances that the lessons state in words, recomputed here from this file's own notes
// (BCE years negative, no year 0: the span from a BCE year to a CE year is the sum of the two minus one).
const span = (a, b) => (a < 0 && b > 0 ? b - a - 1 : b - a);
const textOf = (lesson, id) => flat(visible(one(lesson, id)).join(' '));

test('reviewer: the spans of years stated in the lessons agree with the arithmetic', () => {
  const near = (got, want, tol, what) => assert.ok(Math.abs(got - want) <= tol, `${what}: ${got} against the stated ${want}`);
  // the Great Pyramid (about 2560 BCE) was the tallest building until Lincoln Cathedral's spire, about 1311 CE
  assert.match(textOf('river-valleys', 'pyramids'), /for the next 3,800 years/); near(span(-2560, 1311), 3800, 100, 'tallest building');
  // "by then the pyramids were nearly 4,000 years old" (New Zealand, 1250 to 1300 CE)
  assert.match(textOf('peopling', 'hook'), /nearly 4,000 years old/);
  assert.ok(span(-2560, 1250) > 3700 && span(-2560, 1300) < 4000);
  // hieroglyphs unread from 394 CE to 1822
  assert.match(textOf('writing', 'rosetta'), /for 1,400 years/); near(span(394, 1822), 1400, 50, 'hieroglyphs unread');
  assert.match(textOf('writing', 'rosetta'), /in use for 3,000 years/); near(span(-3200, -196), 3000, 150, 'hieroglyphs in use');
  // the latest datable cuneiform tablet (an almanac from Uruk) is now put at 79/80 CE; older books say 75 CE
  assert.match(textOf('writing', 'oracle-bone'), /last known cuneiform tablet was written about 80 CE/);
  assert.match(textOf('writing', 'oracle-bone'), /Cuneiform is about 2,000 years older/); near(span(-3300, -1250), 2000, 150, 'cuneiform before oracle bones');
  // Eratosthenes (about 240 BCE) to Columbus (1492)
  assert.match(textOf('persia-greece', 'eratosthenes'), /1,700 years before Columbus/); near(span(-240, 1492), 1700, 50, 'Eratosthenes to Columbus');
  // the Han fell "about 250 years" before the last western emperor; Hannibal (218 BCE) and the Han (206 BCE) are a dozen years apart
  assert.match(textOf('rome-han', 'when'), /about 250 years/); near(span(220, 476), 250, 10, 'Han to western Rome');
  assert.ok(Math.abs(span(-218, -206)) <= 15);
  // Göbekli Tepe (about 9500 BCE) is "about 7,000 years older" than the pyramids and Stonehenge's great stones (about 2500 BCE)
  assert.match(textOf('farming', 'gobekli'), /about 7,000 years\s+older/); near(span(-9500, -2560), 7000, 150, 'Göbekli Tepe to the pyramids');
  // the last mammoths (about 2000 BCE) died "some five centuries" after the Great Pyramid
  assert.match(textOf('river-valleys', 'mammoth'), /some five centuries/); near(span(-2560, -2000), 500, 100, 'pyramid to mammoth');
  // Cleopatra: the two numbers in the feedback
  assert.match(textOf('river-valleys', 'cleopatra'), /about 2,530 years/); assert.equal(span(-2560, -30), 2530);
  assert.match(textOf('river-valleys', 'cleopatra'), /just under 2,000/); assert.equal(span(-30, 1969), 1998);
  // Egypt's 3,000 years (about 3100 BCE to 30 BCE) are longer than Cleopatra to the present
  assert.ok(span(-3100, -30) > span(-30, NOW));
  // the Pantheon (about 126 CE) "after 1,900 years"
  assert.match(textOf('rome-han', 'aqueduct'), /after 1,900 years/); near(span(126, NOW), 1900, 30, 'the Pantheon');
  // the Qin collapsed four years after the First Emperor died (210 BCE)
  assert.match(textOf('rome-han', 'qin'), /collapsed in 206 BCE, four\s+years after/); assert.equal(span(-210, -206), 4);
  // the farming hook as a clock: 11,500 of 300,000 years is the last 55 minutes of a day
  assert.match(textOf('farming', 'hook'), /five past eleven at night/); near((11500 / 300000) * 24 * 60, 55, 2, 'minutes before midnight');
});

test('reviewer: distances stated in the lessons are about right', () => {
  const km = (a, b) => distanceKm(a, b);
  const P = (id) => OWN_PLACES[id].slice(0, 2);
  // Rome to Luoyang "8,000 km apart"
  assert.match(textOf('rome-han', 'hook'), /8,000 km apart/); assert.ok(Math.abs(km(P('rome'), P('luoyang')) - 8000) < 500);
  // Hawaii to Tahiti "more than 4,000 km"
  assert.ok(km(P('hawaii'), P('tahiti')) > 4000 && km(P('hawaii'), P('tahiti')) < 4600);
  // Mohenjo-daro and Harappa "600 km apart"
  assert.match(textOf('river-valleys', 'indus'), /600 km apart/); assert.ok(Math.abs(km(P('mohenjo-daro'), P('harappa')) - 600) < 60);
  // lapis lazuli: Ur to the mines of Badakhshan (about 70.8 E, 36.2 N) is more than 2,000 km
  assert.match(textOf('river-valleys', 'standard-of-ur'), /more than 2,000 km away/); assert.ok(km(P('ur'), [70.8, 36.2]) > 2000);
  // Borneo to Madagascar "7,000 km away" (coast to coast; the two markers are a little further apart)
  assert.ok(km(P('borneo'), P('madagascar')) > 6500 && km(P('borneo'), P('madagascar')) < 8000);
  // the Royal Road as drawn: from Sardis to Susa, and about as long as the text says (2,700 km by road)
  const road = figuresOf(one('persia-greece', 'empire')).find((f) => f.type === 'world-map').lines[0].points;
  assert.ok(km(road[0], P('sardis')) < 30 && km(road[road.length - 1], P('susa')) < 30, 'the road runs from Sardis to Susa');
  let len = 0; for (let i = 1; i < road.length; i++) len += km(road[i - 1], road[i]);
  // (a line through seven waypoints is shorter than the road itself, 2,700 km, and longer than the straight line)
  assert.ok(len > km(P('sardis'), P('susa')) + 100 && len < 2900, `the Royal Road as drawn is ${Math.round(len)} km`);
  assert.match(textOf('persia-greece', 'hook'), /some 2,700 km/);
  // the Silk Road as drawn starts at Chang'an, passes Dunhuang, Kashgar, Samarkand and Merv in that order, and ends at Antioch
  const silk = figuresOf(one('rome-han', 'silk-road')).find((f) => f.type === 'world-map').lines[0].points;
  const at = (id) => silk.findIndex((p) => km(p, P(id)) < 40);
  const order = ['changan', 'dunhuang', 'kashgar', 'samarkand', 'merv', 'ctesiphon', 'antioch'].map(at);
  assert.ok(order.every((i) => i >= 0), 'every city is on the line');
  assert.deepEqual(order, order.slice().sort((a, b) => a - b), 'in order from east to west');
  assert.equal(order[0], 0); assert.equal(order[order.length - 1], silk.length - 1);
});

test('reviewer: in the Christianity step no marker stands near the edge of the shaded empire', () => {
  const s = one('beliefs', 'christianity');
  const empire = s.widget.areas[0].polygon;
  // a ring of points 150 km around each marker must lie wholly inside or wholly outside the outline
  // (rough flat-earth offsets are enough here: 1 degree of latitude is about 111 km)
  for (const m of s.widget.markers) {
    const centre = pointInPolygon(m.at, empire);
    assert.equal(centre, ['rome', 'jerusalem'].includes(m.id), `${m.id}: inside the outline?`);
    if (m.id === 'rome') continue;                // Rome is far from every edge except the sea, which is not an edge a learner reads
    for (let b = 0; b < 360; b += 30) {
      const dLat = (150 / 111) * Math.cos((b * Math.PI) / 180);
      const dLon = ((150 / 111) * Math.sin((b * Math.PI) / 180)) / Math.cos((m.at[1] * Math.PI) / 180);
      const p = [m.at[0] + dLon, m.at[1] + dLat];
      if (m.id === 'jerusalem' && dLon < 0) continue;   // to the west lies the coast, not the frontier
      assert.equal(pointInPolygon(p, empire), centre, `${m.id}: a point 150 km away at bearing ${b} is on the same side of the outline`);
    }
  }
});

test('reviewer: steps about killing, crucifixion or enslavement have the sober tone, and predictions are not made of them', () => {
  const hard = /\b(slaughter|massacre|crucified|sold into slavery|genocide)\b/i;
  let found = 0;
  for (const { lesson, step } of allSteps()) {
    // the question, its options and its feedback (the notes of an explorable timeline are not the subject of a step)
    const seeds = step.gen ? Array.from({ length: 60 }, (_, k) => 3 + k * 31) : [3];
    const words = seeds.map((seed) => { const v = resolveStep(step, makeRng(seed), step.id); return flat(visible({ text: v.text, explain: v.explain, options: v.options, items: v.items, hints: v.hints }).join(' ')); }).join(' ');
    const s = resolveStep(step, makeRng(3), step.id);
    if (!hard.test(words)) continue;
    found++;
    assert.equal(s.tone, 'sober', `${lesson}/${step.id} speaks of ${hard.exec(words)[0]} and should be sober`);
    assert.notEqual(s.mode, 'predict', `${lesson}/${step.id}: not a guessing game`);
  }
  assert.ok(found >= 3, `${found} such steps`);
});

test('reviewer: the lesson on beliefs describes living traditions in the present tense and does not rank them', () => {
  const all = lessons.beliefs.steps.map((st) => flat(visible(resolveStep(st, makeRng(5), st.id)).join(' '))).join(' ') + ' ' + lessons.beliefs.recap.join(' ');
  for (const re of [/\boldest of the seven\b/i, /\bfrom it Christianity\b/, /\bgrew from it\b/, /\b(primitive|superstition|heathen|pagan|idol|cult|mythology|so-called|merely)\b/i,
    /\b(true|false) (religion|faith|god)/i, /\b(fulfil|fulfilment|fulfilled|superseded|replaced by)\b/i, /Zoroastrians[^.]*\b(worshipped|taught|believed)\b/]) {
    assert.ok(!re.test(all), `beliefs: wording ${re}`);
  }
  // what followers hold is reported as belief, not stated as fact or as error
  assert.match(all, /Jews believe in \*\*one God\*\*/);
  assert.match(all, /Christians believe that God raised him/);
  assert.match(all, /Buddhists\s+believe, he reached awakening/);
  assert.match(all, /Ideas that most Hindus share/);
  // dates of founders are hedged, and the "Axial Age" is given as a label that historians question
  assert.match(all, /probably in the fifth century BCE/); assert.match(all, /Nobody knows when/); assert.match(all, /by\s+tradition in 301/);
  assert.match(all, /Historians treat that label with care/);
  // ("oldest" may describe a tradition's own texts, never one tradition against another)
  for (const t of TRADITIONS) assert.ok(!/\b(oldest|greatest|truest|most advanced|the first (religion|faith))\b/i.test((t.clues.join(' ') + ' ' + t.about).replace(/the oldest sacred texts of India|its oldest texts are the Vedas/g, '')), `${t.name}: no ranking in clues`);
});

test('reviewer: the word for five, and what memory could and could not do', () => {
  // this file's own list: Malay lima, Hawaiian lima, Maori rima, Rapa Nui rima, Malagasy dimy
  const five = one('peopling', 'echo-five');
  const map = figuresOf(five).find((f) => f.type === 'world-map');
  const WORD = { madagascar: 'dimy', borneo: 'lima', hawaii: 'lima', aotearoa: 'rima', 'rapa-nui': 'rima' };
  assert.equal(map.markers.length, 5);
  for (const [id, word] of Object.entries(WORD)) {
    const m = map.markers.find((x) => distanceKm(x.at, OWN_PLACES[id].slice(0, 2)) <= OWN_PLACES[id][3]);
    assert.ok(m, `a marker stands at ${id}`); assert.equal(m.label, word, id);
  }
  // the wrong option about number words must compare languages that really are unrelated (not English and French)
  const numbers = five.options.find((o) => /similar words for numbers/.test(o.text));
  assert.ok(!/cinq/.test(numbers.why) && /wǔ/.test(numbers.why) && /khamsa/.test(numbers.why) && /tano/.test(numbers.why), numbers.why);
  // writing was needed for exact detail in bulk, across distance and time; trained memory carried long texts and skills
  const mem = one('writing', 'memory-vs-writing');
  assert.match(flat(mem.text), /really needed writing/);
  for (const o of mem.options) assert.equal(!!o.correct, /agreement|exact message|debts/.test(o.text), o.text);
  for (const o of mem.options) if (!o.correct) assert.ok(o.why && o.why.length > 40, 'each wrong option explains what memory could do');
});
