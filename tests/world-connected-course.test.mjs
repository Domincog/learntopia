// Independent checks of "One World: 1450 to 1800".
//
// The course keeps its facts in content/courses/world-connected/helpers.js. This file has its
// OWN tables of the key dates, places and figures, typed in separately from the author's
// verified notes, and compares the two (a double entry: a slip in one of them shows up as a
// failing test). Every generated question is then re-answered from the text a learner sees,
// with the tables below, for a few hundred seeds; every map, photo and timeline interaction
// is fed its own solution and several plausible wrong states; every sea route is walked
// point by point across the detailed map to make sure it stays at sea.
//
//   node --test tests/world-connected-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { countryAt, countryName, countryInfo, regionNames, loadDetail, distanceKm, destination } from '../src/widgets/world-map.js';
import course from '../content/courses/world-connected/course.js';
import * as H from '../content/courses/world-connected/helpers.js';

const SEEDS = 240;
const COURSE = 'world-connected';
const LESSON_IDS = ['voyages', 'columbian-exchange', 'gunpowder-empires', 'print-and-reform', 'new-science', 'atlantic-world'];

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/${COURSE}/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, COURSE, meta.id);
  }
}
await loadDetail();          // the 1:50m shapes, in which every country (islands included) has an outline

const manifest = JSON.parse(readFileSync(fileURLToPath(new URL(`../content/media/${COURSE}/manifest.json`, import.meta.url)), 'utf8'));

const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(4409 + k * 7919), id));
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const bare = (s) => flat(s).replace(/\*/g, '');
const correctOption = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: exactly one correct option`); return right[0]; };
const isMessage = (v) => typeof v === 'string' && v.length > 8;

/** Every string a learner can see in a resolved step (figure markup and addresses excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['content', 'type', 'id', 'viewBox', 'color', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'mode', 'curve', 'shape', 'labelPos', 'style', 'view', 'tone', 'answer']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/** All widget specs of a resolved step: its figures, its widget and the figures of its options. */
function specsOf(step) {
  const out = [...(step.figures || [])];
  if (step.widget) out.push(step.widget);
  for (const o of step.options || []) if (o.figure) out.push(o.figure);
  return out;
}

/* ====================================================================== own tables */

// Dates, typed from the verification notes (not from helpers.js).
const DATES = {
  diamondSutra: 868, jikji: 1377, zhengHe: 1405, constantinople: 1453, gutenberg: 1455, elminaFort: 1482, dias: 1488,
  columbus: 1492, tordesillas: 1494, daGama: 1498, safavids: 1501, luther: 1517, magellanSails: 1519, tenochtitlanFalls: 1521,
  victoria: 1522, babur: 1526, atahualpa: 1532, copernicus: 1543, potosi: 1545, trent: 1545, manila: 1571, tokugawa: 1603,
  telescope: 1610, tajMahal: 1632, galileoTrial: 1633, qing: 1644, westphalia: 1648, royalSociety: 1660, principia: 1687,
  palmaresFalls: 1694, encyclopedie: 1751, equiano: 1789, haitiRevolt: 1791, wollstonecraft: 1792, britainTradeBan: 1807,
  britainAbolition: 1833, franceAbolition: 1848, usAbolition: 1865, brazilAbolition: 1888,
};

// A phrase that identifies each event in the wording learners see, for reading dates back out of option texts.
const EVENT_WORDS = [
  [/Diamond Sutra/, 868], [/Jikji/, 1377], [/Zheng He/, 1405], [/Constantinople/, 1453], [/Gutenberg/, 1455], [/Elmina/, 1482],
  [/Dias/, 1488], [/Columbus/, 1492], [/Tordesillas/, 1494], [/da Gama/, 1498], [/Safavid/, 1501], [/Ninety-five Theses/, 1517],
  [/Magellan's fleet/, 1519], [/Tenochtitlan falls/, 1521], [/Victoria/, 1522], [/Babur/, 1526], [/Atahualpa/, 1532],
  [/Copernicus/, 1543], [/Potos/, 1545], [/Council of Trent/, 1545], [/Manila/, 1571], [/Tokugawa/, 1603], [/telescope/, 1610],
  [/Taj Mahal/, 1632], [/Galileo is tried/, 1633], [/Qing/, 1644], [/Westphalia/, 1648], [/Royal Society/, 1660], [/Principia/, 1687],
  [/Palmares/, 1694], [/Encyclop/, 1751], [/Equiano/, 1789], [/Saint-Domingue/, 1791], [/Wollstonecraft/, 1792],
  [/outlaws its slave trade/, 1807], [/Slavery Abolition Act/, 1833], [/France abolishes/, 1848], [/United States abolishes/, 1865], [/Brazil abolishes/, 1888],
];
const yearOfText = (text) => {
  const hits = EVENT_WORDS.filter(([re]) => re.test(bare(text)));
  assert.equal(hits.length, 1, `exactly one known event in "${text}" (found ${hits.length})`);
  return hits[0][1];
};

// Places: [longitude, latitude] to the nearest tenth or so, and the modern country, from an atlas.
const SITES = {
  lisbon: [-9.1, 38.7, 'PT'], seville: [-6.0, 37.4, 'ES'], venice: [12.3, 45.4, 'IT'], rome: [12.5, 41.9, 'IT'], florence: [11.3, 43.8, 'IT'],
  mainz: [8.3, 50.0, 'DE'], wittenberg: [12.6, 51.9, 'DE'], geneva: [6.1, 46.2, 'CH'], paris: [2.3, 48.9, 'FR'], london: [-0.1, 51.5, 'GB'],
  cambridge: [0.1, 52.2, 'GB'], delft: [4.4, 52.0, 'NL'], frombork: [19.7, 54.4, 'PL'], prague: [14.4, 50.1, 'CZ'], padua: [11.9, 45.4, 'IT'],
  moscow: [37.6, 55.8, 'RU'], madeira: [-17.0, 32.7, 'PT'], saoTome: [6.6, 0.2, 'ST'], elmina: [-1.3, 5.1, 'GH'], luanda: [13.2, -8.8, 'AO'],
  goodHope: [18.5, -34.4, 'ZA'], malindi: [40.1, -3.2, 'KE'], mogadishu: [45.3, 2.0, 'SO'], aden: [45.0, 12.8, 'YE'], alexandria: [29.9, 31.2, 'EG'],
  hormuz: [56.5, 27.1, 'IR'], calicut: [75.8, 11.3, 'IN'], malacca: [102.2, 2.2, 'MY'], moluccas: [127.4, 0.7, 'ID'], istanbul: [29.0, 41.0, 'TR'],
  isfahan: [51.7, 32.7, 'IR'], agra: [78.0, 27.2, 'IN'], beijing: [116.4, 39.9, 'CN'], nanjing: [118.8, 32.1, 'CN'], edo: [139.7, 35.7, 'JP'],
  nagasaki: [129.9, 32.7, 'JP'], kyoto: [135.8, 35.0, 'JP'], manila: [121.0, 14.6, 'PH'], cebu: [123.9, 10.3, 'PH'], samarkand: [67.0, 39.7, 'UZ'],
  sanSalvador: [-74.5, 24.1, 'BS'], havana: [-82.4, 23.1, 'CU'], tenochtitlan: [-99.1, 19.4, 'MX'], acapulco: [-99.9, 16.9, 'MX'], lima: [-77.0, -12.0, 'PE'],
  potosi: [-65.8, -19.6, 'BO'], salvador: [-38.5, -13.0, 'BR'], palmares: [-36.0, -9.2, 'BR'], barbados: [-59.5, 13.2, 'BB'], jamaica: [-77.3, 18.1, 'JM'],
  saintDomingue: [-72.3, 19.0, 'HT'], palenque: [-75.2, 10.1, 'CO'], suriname: [-55.6, 4.6, 'SR'], magellanStrait: [-70.9, -53.2, 'CL'], guam: [144.8, 13.4, 'GU'],
  capeVerde: [-23.6, 15.1, 'CV'], canaries: [-16.5, 28.3, 'ES'], azores: [-27.2, 38.7, 'PT'],
};

// Which side of the Atlantic things were on in 1491 (names as learners see them, lower case).
const AMERICAN = ['maize (corn)', 'potatoes', 'tomatoes', 'chilli peppers', 'cacao (chocolate)', 'cassava (manioc)', 'tobacco', 'peanuts', 'pineapples', 'vanilla', 'turkeys', 'avocados', 'pumpkins and squash',
  'tomato', 'chilli', 'potato', 'paprika (ground chilli)', 'cacao', 'peanut', 'maize tortilla', 'pineapple', 'squash flowers', 'beans', 'black beans', 'cassava flour', 'allspice'];
const OLD_WORLD = ['wheat', 'rice', 'barley', 'sugar cane', 'coffee', 'tea', 'bananas', 'lentils', 'oranges', 'olives', 'black pepper', 'horses', 'cattle', 'pigs', 'donkeys', 'goats',
  'wheat flour', 'olive oil', 'basil', 'cheese', 'ginger', 'turmeric', 'garlic', 'tofu', 'sichuan pepper', 'mutton', 'onion', 'carrot', 'radish', 'salt', 'beef', 'caraway', 'lard',
  'lemongrass', 'fish sauce', 'lime leaves', 'milk', 'cane sugar', 'egg', 'cod', 'vinegar', 'coconut milk', 'palm sugar', 'pork'];
const sideOf = (name) => {
  const key = flat(name).toLowerCase();
  const a = AMERICAN.includes(key);
  const o = OLD_WORLD.includes(key);
  assert.ok(a !== o, `"${name}" is in exactly one of the test's two lists`);
  return a ? 'americas' : 'afroeurasia';
};
const AMERICAN_KITCHENS = /Tenochtitlan|Cusco|Maya|Taíno|Mexico|Brazil|Caribbean/;

// Homelands of crops: roughly where on the map, from the standard accounts of domestication.
const CROP_ORIGIN = { maize: [-99, 18], 'chilli pepper': [-99, 18], potato: [-70, -15], wheat: [40, 36], coffee: [38, 8], 'Asian rice': [115, 30], 'sugar cane': [143, -6] };

// The capital of each state about 1600, and the country it lies in today.
const CAPITALS = { Istanbul: 'TR', Isfahan: 'IR', Agra: 'IN', Beijing: 'CN', Edo: 'JP', Moscow: 'RU' };
// How each state's lands about 1600 compare in size with the modern country of its capital.
const THEN_VERSUS_NOW = { Istanbul: /far larger/, Isfahan: /larger/, Agra: /different area/, Beijing: /smaller/, Edo: /same islands/, Moscow: /smaller/ };

// One identifying phrase per "which state?" fact.
const EMPIRE_CLUES = [
  [/Constantinople/, 'Ottoman'], [/three continents/, 'Ottoman'], [/leyman/, 'Ottoman'], [/Sinan/, 'Ottoman'],
  [/Shia/, 'Safavid'], [/Isfahan/, 'Safavid'], [/Panipat/, 'Mughal'], [/Akbar/, 'Mughal'], [/Taj Mahal/, 'Mughal'],
  [/Forbidden City/, 'Ming'], [/Great Wall/, 'Ming'], [/Manchus/, 'Qing'], [/Edo/, 'Tokugawa'], [/Nagasaki/, 'Tokugawa'], [/Siberia/, 'Russia'],
];

// Who did what: a phrase in the question, and the person.
const DEEDS = [
  [/movable metal type in Mainz/, 'Johannes Gutenberg'], [/baked clay/, 'Bi Sheng'], [/first printing press in England/, 'William Caxton'],
  [/Ninety-five Theses/, 'Martin Luther'], [/Reformation in Geneva/, 'John Calvin'], [/Jesuit order/, 'Ignatius of Loyola'],
  [/New Testament in Greek/, 'Erasmus of Rotterdam'], [/New Testament into English/, 'William Tyndale'], [/Mona Lisa/, 'Leonardo da Vinci'],
  [/Sistine Chapel/, 'Michelangelo'], [/School of Athens/, 'Raphael'], [/dome of Florence cathedral/, 'Filippo Brunelleschi'],
  [/Earth-centred system/, 'Ptolemy'], [/Sun, not the Earth, at the centre/, 'Nicolaus Copernicus'], [/without a telescope/, 'Tycho Brahe'],
  [/ellipses/, 'Johannes Kepler'], [/moons circling Jupiter/, 'Galileo Galilei'], [/one law of gravity/, 'Isaac Newton'],
  [/atlas of the human body/, 'Andreas Vesalius'], [/heart pumps the blood/, 'William Harvey'], [/microscopes he made himself/, 'Antonie van Leeuwenhoek'],
  [/Suriname/, 'Maria Sibylla Merian'], [/natural rights/, 'John Locke'], [/separate branches/, 'Montesquieu'], [/religious toleration/, 'Voltaire'],
  [/Encyclop/, 'Denis Diderot'], [/Dare to know/, 'Immanuel Kant'], [/women should have the same education/, 'Mary Wollstonecraft'], [/his own enslavement/, 'Olaudah Equiano'],
];

// Where the new science was made: scientist → today's country.
const SCIENCE_COUNTRY = { Copernicus: 'PL', Galileo: 'IT', Kepler: 'CZ', Newton: 'GB', Leeuwenhoek: 'NL', Diderot: 'FR' };

// The slave trade: estimates of the SlaveVoyages database (Eltis and Richardson), people landed alive, 1501 to 1867.
const LANDED = {
  Brazil: 4864374, 'The British Caribbean': 2318252, 'Spanish America': 1292912, 'The French Caribbean': 1120216,
  'The Dutch colonies': 444728, 'Mainland North America': 388747,
};
const LANDED_ELSEWHERE = 108998 + 8860 + 155569;      // Danish West Indies, Europe, Africa
const EMBARKED_TOTAL = 12521337;

/* ====================================================================== the course as a whole */

test('course shape: six lessons in order, each with the required ingredients', () => {
  assert.equal(course.id, COURSE);
  assert.deepEqual(Object.keys(lessons), LESSON_IDS);
  for (const [id, lesson] of Object.entries(lessons)) {
    const n = lesson.steps.length;
    assert.ok(n >= 14 && n <= 20, `${id}: ${n} steps (14 to 20, teaching screens included)`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) assert.ok(s.explain || s.gen, `${id}/${s.id}: review steps explain themselves`);
    assert.ok(lesson.steps.filter((s) => s.gen).length >= 2, `${id}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'interact').length >= 2, `${id}: hands-on steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${id}: no more than five choice steps`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap of 3 or 4 lines`);
    assert.ok(lesson.next.length > 20, `${id}: has a "next" teaser`);
    // where, when: at least two map steps (one of them answered on the map) and something that anchors the lesson in time
    const resolved = lesson.steps.map((s) => resolveStep(s, makeRng(11), s.id));
    const maps = resolved.filter((s) => specsOf(s).some((spec) => spec.type === 'world-map'));
    assert.ok(maps.length >= 2, `${id}: ${maps.length} steps with a map`);
    assert.ok(resolved.some((s) => s.type === 'interact' && s.widget.type === 'world-map' && s.graded), `${id}: a graded map step`);
    assert.ok(resolved.some((s) => s.type === 'order' || specsOf(s).some((spec) => spec.type === 'timeline')), `${id}: a timeline or an order step`);
  }
  // the first step of every lesson is a prediction
  for (const [id, lesson] of Object.entries(lessons)) assert.equal(lesson.steps[0].mode, 'predict', `${id} opens with a prediction`);
});

test('no learner-visible text contains undefined, NaN or an object, and emphasis markers are balanced', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        for (const text of visible(s)) {
          assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), `${id}/${step.id} seed ${k}: ${text}`);
          assert.ok(!/\d\.\d{4,}/.test(text), `${id}/${step.id} seed ${k}: float noise in "${text}"`);
          for (const line of text.split('\n')) {
            // a line of prose that happens to begin "1788. It shows…" would be turned into a numbered list
            assert.ok(!/^\s*\d{1,4}\.\s/.test(line), `${id}/${step.id}: a line begins with a number and a full stop: "${line.trim()}"`);
            if (line.includes('[[')) continue;                       // dropdown blanks mark their answer with a star
            const bold = (line.match(/\*\*/g) || []).length;
            const single = (line.replace(/\*\*/g, '').match(/\*/g) || []).length;
            assert.ok(bold % 2 === 0 && single % 2 === 0, `${id}/${step.id}: emphasis opens and closes on one line: "${line.trim()}"`);
          }
        }
        if (!step.gen) break;
      }
    }
    for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
  }
});

test('every choice has exactly one correct option and no duplicates; multi and bucket are well formed', () => {
  let seen = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(5 + k * 97), step.id);
        if (s.type === 'choice' || s.type === 'multi') {
          const right = s.options.filter((o) => o.correct).length;
          if (s.type === 'choice') assert.equal(right, 1, `${id}/${step.id} seed ${k}: one correct option`);
          else assert.ok(right >= 1 && right < s.options.length, `${id}/${step.id}: some but not all options are correct`);
          const keys = s.options.map((o) => (o.figure ? o.figure.src : flat(o.text)));
          assert.equal(new Set(keys).size, keys.length, `${id}/${step.id} seed ${k}: duplicate options ${keys.join(' | ')}`);
          for (const o of s.options) assert.ok(o.figure || o.text.length > 1, `${id}/${step.id}: an empty option`);
          if (s.graded) assert.ok(s.explain.length > 30, `${id}/${step.id}: has an explanation`);
          seen++;
        }
        if (s.type === 'match') assert.equal(new Set(s.pairs.map((p) => p[1])).size, s.pairs.length, `${id}/${step.id}: right-hand items are distinct`);
        if (s.type === 'bucket') assert.equal(new Set(s.items.map((it) => it.text)).size, s.items.length, `${id}/${step.id}: bucket items are distinct`);
        if (!step.gen) break;
      }
    }
  }
  assert.ok(seen > 1500, `${seen} choice variants checked`);
});

/* ====================================================================== double entry: dates and places */

test('dates: the helper table agrees with the test\'s own table, event by event', () => {
  assert.deepEqual(Object.keys(H.EVENTS).sort(), Object.keys(DATES).sort(), 'the two tables list the same events');
  for (const [id, year] of Object.entries(DATES)) {
    assert.equal(H.EVENTS[id].year, year, `${id}: ${H.EVENTS[id].year} in helpers, ${year} here`);
    assert.equal(H.year(id), year);
    assert.equal(yearOfText(H.EVENTS[id].label), year, `${id}: the label names its own event`);
    assert.ok(H.EVENTS[id].short.length <= 26, `${id}: a short label for timelines`);
    if (H.EVENTS[id].to != null) assert.ok(H.EVENTS[id].to > year, `${id}: ends after it begins`);
  }
  // spans and figures quoted in the lessons
  assert.equal(H.EVENTS.zhengHe.to, 1433);
  assert.equal(H.EVENTS.trent.to, 1563);
  assert.equal(H.EVENTS.tajMahal.to, 1653);
  assert.equal(H.EVENTS.encyclopedie.to, 1772);
  const dynasties = { ottoman: [1299, 1922], safavid: [1501, 1736], mughal: [1526, 1857], ming: [1368, 1644], qing: [1644, 1912], tokugawa: [1603, 1868] };
  for (const [id, [from, to]] of Object.entries(dynasties)) assert.deepEqual([H.EMPIRES[id].from, H.EMPIRES[id].to], [from, to], `${id} dates`);
});

test('places: valid [lon, lat], inside the country they claim, and where the test\'s own atlas puts them', () => {
  for (const [id, p] of Object.entries(H.PLACES)) {
    const [lon, lat] = p.at;
    assert.ok(Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lon) <= 180 && Math.abs(lat) <= 90, `${id}: a valid coordinate`);
    assert.ok(countryName(p.country), `${id}: country code ${p.country} is known to the map`);
    // longitude first: a swapped pair lands in another country (or in the sea)
    assert.equal(countryAt(p.at, 'high', 40), p.country, `${id} (${p.name}) lies in ${countryName(p.country)}`);
    assert.deepEqual(H.at(id), p.at);
    assert.ok(p.name.length > 2);
  }
  for (const [id, [lon, lat, country]] of Object.entries(SITES)) {
    const p = H.PLACES[id];
    assert.ok(p, `the helpers know ${id}`);
    assert.equal(p.country, country, `${id}: country`);
    assert.ok(distanceKm(p.at, [lon, lat]) <= 60, `${id}: ${p.at} is ${Math.round(distanceKm(p.at, [lon, lat]))} km from the atlas position ${[lon, lat]}`);
  }
  assert.throws(() => H.at('atlantis'));
  assert.throws(() => H.year('ragnarok'));
});

test('every country code and coordinate used anywhere in the course is real', () => {
  const regions = new Set(regionNames());
  const isCode = (v) => typeof v === 'string' && /^[A-Z]{2}$/.test(v);
  const checkIds = (v, where) => {
    for (const idv of [].concat(v)) {
      if (typeof idv !== 'string') continue;
      assert.ok(isCode(idv) ? countryName(idv) : regions.has(idv), `${where}: "${idv}" is a country code or a region name`);
    }
  };
  const checkPoint = (pt, where) => {
    if (typeof pt === 'string') return;
    assert.ok(Array.isArray(pt) && pt.length === 2 && Math.abs(pt[0]) <= 180 && Math.abs(pt[1]) <= 75, `${where}: ${JSON.stringify(pt)} is [lon, lat]`);
  };
  let maps = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < 40; k++) {
        const s = resolveStep(step, makeRng(31 + k * 17), step.id);
        for (const spec of specsOf(s)) {
          if (spec.type !== 'world-map') continue;
          maps++;
          const where = `${id}/${step.id}`;
          assert.ok(spec.alt && spec.alt.length > 30, `${where}: the map has a description`);
          for (const g of spec.regions || []) checkIds(g.ids, where);
          if (spec.pickable && /^pick(Many)?$/.test(spec.mode)) checkIds(spec.pickable, where);
          if (spec.mode === 'pick') { checkIds(spec.answer, where); assert.ok(isCode(spec.answer)); }
          for (const m of spec.markers || []) checkPoint(m.at, where);
          for (const l of spec.lines || []) l.points.forEach((pt) => checkPoint(pt, where));
          for (const a of spec.areas || []) (a.polygon || []).forEach((pt) => checkPoint(pt, where));
          for (const l of spec.labels || []) if (l && l.at) checkPoint(l.at, where);
          if (Array.isArray(spec.view) && typeof spec.view[0] === 'number') {
            const [w, so, e, n] = spec.view;
            assert.ok(so < n && Math.abs(w) <= 180 && Math.abs(e) <= 180 && so >= -90 && n <= 90, `${where}: view ${spec.view}`);
            // everything drawn as a marker is inside the window
            for (const m of spec.markers || []) {
              if (typeof m.at === 'string') continue;
              const inLon = w <= e ? m.at[0] >= w && m.at[0] <= e : m.at[0] >= w || m.at[0] <= e;
              assert.ok(inLon && m.at[1] >= so && m.at[1] <= n, `${where}: marker ${m.label || m.id} at ${m.at} is inside the view ${spec.view}`);
            }
          }
          // pickMarker answers are markers that exist
          if (spec.mode === 'pickMarker') assert.ok(spec.markers.some((m) => m.id === spec.answer), `${where}: answer marker exists`);
        }
        if (!step.gen) break;
      }
    }
  }
  assert.ok(maps > 60, `${maps} maps checked`);
  for (const e of Object.values(H.EMPIRES)) { assert.ok(countryName(e.home)); for (const pt of e.extent) checkPoint(pt, e.name); }
  for (const list of Object.values(H.RELIGION_1600)) checkIds(list, 'RELIGION_1600');
  const all = Object.values(H.RELIGION_1600).flat();
  assert.equal(new Set(all).size, all.length, 'no country is coloured twice on the map of the Reformation');
  for (const h of Object.values(H.HOMELANDS)) checkPoint(h.at, 'HOMELANDS');
});

test('empires: capitals lie inside the rough outlines, and the outlines inside sensible bounds', () => {
  const inside = (pt, poly) => {
    let hit = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  };
  for (const id of ['ottoman', 'safavid', 'mughal', 'ming']) {
    const e = H.EMPIRES[id];
    assert.ok(e.extent.length >= 12, `${id}: an outline`);
    assert.ok(inside(H.at(e.capital), e.extent), `${id}: ${e.capital} is inside its own outline`);
    assert.ok(inside(e.labelAt, e.extent), `${id}: the label sits inside the outline`);
    for (const other of ['istanbul', 'isfahan', 'agra', 'beijing']) if (other !== e.capital) assert.ok(!inside(H.at(other), e.extent), `${id}: ${other} is outside`);
    assert.equal(countryAt(H.at(e.capital), 'high', 30), e.home, `${id}: the capital is in ${e.home} today`);
  }
  // cities the Ottomans held about 1600, and some they did not
  const O = [H.EMPIRES.ottoman.extent, ...H.EMPIRES.ottoman.more];
  const ottoman = (pt) => O.some((poly) => inside(pt, poly));
  for (const [name, pt] of [['Cairo', [31.2, 30.0]], ['Baghdad', [44.4, 33.3]], ['Belgrade', [20.5, 44.8]], ['Mecca', [39.8, 21.4]], ['Algiers', [3.1, 36.6]], ['Damascus', [36.3, 33.5]], ['Athens', [23.7, 38.0]]]) assert.ok(ottoman(pt), `${name} is inside the Ottoman outline`);
  for (const [name, pt] of [['Vienna', [16.4, 48.2]], ['Venice', [12.3, 45.4]], ['Rome', [12.5, 41.9]], ['Isfahan', [51.7, 32.7]], ['Madrid', [-3.7, 40.4]], ['Fez', [-5.0, 34.0]], ['Moscow', [37.6, 55.8]]]) assert.ok(!ottoman(pt), `${name} is outside the Ottoman outline`);
  // Mughal about 1700: Lahore, Delhi, Dhaka and the Deccan inside; Sri Lanka and Kandahar's west outside
  const M = H.EMPIRES.mughal.extent;
  for (const [name, pt] of [['Lahore', [74.3, 31.5]], ['Delhi', [77.2, 28.6]], ['Dhaka', [90.4, 23.7]], ['Hyderabad', [78.5, 17.4]]]) assert.ok(inside(pt, M), `${name} is inside the Mughal outline`);
  for (const [name, pt] of [['Colombo', [79.9, 6.9]], ['Isfahan', [51.7, 32.7]], ['Lhasa', [91.1, 29.7]]]) assert.ok(!inside(pt, M), `${name} is outside the Mughal outline`);
  // Safavid: Tabriz and Mashhad inside; Baghdad and Kabul outside (as drawn for about 1600)
  const S = H.EMPIRES.safavid.extent;
  for (const [name, pt] of [['Tabriz', [46.3, 38.1]], ['Mashhad', [59.6, 36.3]], ['Shiraz', [52.5, 29.6]]]) assert.ok(inside(pt, S), `${name} is inside the Safavid outline`);
  for (const [name, pt] of [['Baghdad', [44.4, 33.3]], ['Kabul', [69.2, 34.5]], ['Samarkand', [67.0, 39.7]]]) assert.ok(!inside(pt, S), `${name} is outside the Safavid outline`);
  // Ming: Nanjing, Xi'an, Guangzhou inside; Lhasa, Seoul, Ulaanbaatar outside
  const C = H.EMPIRES.ming.extent;
  for (const [name, pt] of [['Nanjing', [118.8, 32.1]], ['Xi\'an', [108.9, 34.3]], ['Guangzhou', [113.3, 23.1]], ['Chengdu', [104.1, 30.7]]]) assert.ok(inside(pt, C), `${name} is inside the Ming outline`);
  for (const [name, pt] of [['Lhasa', [91.1, 29.7]], ['Seoul', [127.0, 37.6]], ['Ulaanbaatar', [106.9, 47.9]], ['Hanoi', [105.8, 21.0]]]) assert.ok(!inside(pt, C), `${name} is outside the Ming outline`);
});

/* ====================================================================== routes stay at sea */

/** Kilometres of a straight leg (in longitude and latitude, as the lessons draw them) that lie on land, away from the named ports. */
function landKm(a, b) {
  let dx = b[0] - a[0];
  if (dx > 180) dx -= 360;
  if (dx < -180) dx += 360;
  const dy = b[1] - a[1];
  const n = Math.max(2, Math.ceil(Math.hypot(dx, dy) / 0.1));
  const ports = Object.values(H.PLACES).map((p) => p.at);
  let onLand = 0;
  for (let k = 0; k <= n; k++) {
    const p = [a[0] + (dx * k) / n, a[1] + (dy * k) / n];
    if (p[0] > 180) p[0] -= 360;
    if (p[0] < -180) p[0] += 360;
    if (countryAt(p, 'high') && !ports.some((q) => distanceKm(p, q) < 40)) onLand++;
  }
  return (onLand / (n + 1)) * distanceKm(a, b);
}

test('sea routes: every leg of every voyage and trade route stays at sea, except the legs marked as overland', () => {
  const routes = [];
  for (const [id, v] of Object.entries(H.VOYAGES)) {
    routes.push([`${id}`, v.points, v.overland || []]);
    if (v.branch) routes.push([`${id} (branch)`, v.branch, []]);
    if (v.back) routes.push([`${id} (return)`, v.back, []]);
  }
  for (const [id, r] of Object.entries(H.ROUTES)) {
    if (r.points) routes.push([id, r.points, r.overland || []]);
    for (const [i, leg] of (r.legs || []).entries()) routes.push([`${id} leg ${i + 1}`, leg, []]);
  }
  assert.ok(routes.length >= 14);
  let legs = 0;
  for (const [name, points, overland] of routes) {
    assert.ok(points.length >= 3, `${name}: a route has waypoints`);
    for (let i = 0; i < points.length - 1; i++) {
      const km = landKm(points[i], points[i + 1]);
      legs++;
      // 30 km of slack: straits such as Magellan's, Malacca and San Bernardino are narrower than the map data can show
      if (overland.includes(i)) continue;                 // a river or a road: checked by name below
      assert.ok(km <= 30, `${name}: leg ${i} from ${JSON.stringify(points[i])} to ${JSON.stringify(points[i + 1])} crosses about ${Math.round(km)} km of land`);
    }
  }
  assert.ok(legs > 300, `${legs} legs walked`);
  // the overland legs are the ones history says: Suez to Alexandria; Potosí to the coast, the isthmus of Panama, the river to Seville; the Yangtze
  assert.deepEqual(H.ROUTES.spice.points[H.ROUTES.spice.overland[0] + 1], H.at('alexandria'));
  assert.deepEqual(H.ROUTES.silverAtlantic.points[0], H.at('potosi'));
  assert.deepEqual(H.ROUTES.silverAtlantic.points[H.ROUTES.silverAtlantic.points.length - 1], H.at('seville'));
  assert.deepEqual(H.VOYAGES.zhengHe.points[0], H.at('nanjing'));
});

test('voyages: each route starts, passes and ends where the history says', () => {
  const passes = (points, id, km = 150) => points.some((p) => distanceKm(p, H.at(id)) <= km);
  const V = H.VOYAGES;
  // Zheng He: Nanjing, Malacca, Sri Lanka, Calicut, Hormuz; the branch reaches Malindi
  for (const id of ['nanjing', 'malacca', 'ceylon', 'calicut', 'hormuz']) assert.ok(passes(V.zhengHe.points, id), `Zheng He passes ${id}`);
  assert.ok(passes(V.zhengHe.branch, 'malindi') && passes(V.zhengHe.branch, 'mogadishu'));
  assert.ok(V.zhengHe.points.every((p) => p[0] > 50), 'Zheng He never enters the Atlantic');
  // Dias: from Lisbon, round the Cape, no further than the south-east coast of Africa
  assert.deepEqual(V.dias.points[0], H.at('lisbon'));
  assert.ok(passes(V.dias.points, 'goodHope', 400) && V.dias.points.every((p) => p[0] < 30));
  // Columbus: Spain, the Canaries, the Bahamas; home by the Azores
  assert.deepEqual(V.columbus.points[0], H.at('palos'));
  assert.ok(passes(V.columbus.points, 'canaries') && passes(V.columbus.points, 'sanSalvador') && passes(V.columbus.back, 'azores'));
  assert.ok(V.columbus.points.every((p) => p[1] > 15 && p[1] < 40), 'Columbus stays in the latitudes of the trade winds');
  // Da Gama: Lisbon, Cape Verde, a wide arc west of 20° W in the South Atlantic, the Cape, Malindi, Calicut
  assert.deepEqual(V.daGama.points[0], H.at('lisbon'));
  for (const id of ['capeVerde', 'malindi', 'calicut']) assert.ok(passes(V.daGama.points, id), `da Gama passes ${id}`);
  assert.ok(passes(V.daGama.points, 'goodHope', 250));
  assert.ok(V.daGama.points.some((p) => p[0] < -20 && p[1] < -5), 'the great arc through the South Atlantic');
  assert.deepEqual(V.daGama.points[V.daGama.points.length - 1], H.at('calicut'));
  // Magellan and Elcano: out and home to Sanlúcar, through the strait, across the Pacific, the Philippines, the Moluccas, round Africa
  assert.deepEqual(V.magellan.points[0], H.at('sanlucar'));
  assert.deepEqual(V.magellan.points[V.magellan.points.length - 1], H.at('sanlucar'));
  for (const id of ['magellanStrait', 'guam', 'cebu', 'moluccas']) assert.ok(passes(V.magellan.points, id, 120), `the Victoria's course passes ${id}`);
  assert.ok(passes(V.magellan.points, 'goodHope', 700));
  const lons = V.magellan.points.map((p) => p[0]);
  assert.ok(lons.some((l) => l < -150) && lons.some((l) => l > 150), 'it crosses the date line');
  // order along the route: strait before Guam before Cebu before the Moluccas
  const idx = (id) => V.magellan.points.findIndex((p) => distanceKm(p, H.at(id)) <= 120);
  assert.ok(idx('magellanStrait') < idx('guam') && idx('guam') < idx('cebu') && idx('cebu') < idx('moluccas'));
  // every voyage can be drawn
  for (const id of Object.keys(V)) { const lines = H.voyageLines(id); assert.ok(lines.length >= 1 && lines.every((l) => l.arrow && l.curve === 'straight')); }
});

/* ====================================================================== generated steps */

const COVERED = new Set();
const cover = (lesson, id) => { COVERED.add(`${lesson}/${id}`); return variants(lesson, id); };

/** Feed a marker-picking step its answer and every other marker. */
function checkMarkerStep(s, where) {
  const w = s.widget;
  assert.equal(w.mode, 'pickMarker', where);
  assert.equal(w.answer, s.solution.picked, `${where}: the answer shown is the solution`);
  assert.equal(s.check({ picked: s.solution.picked }), true, `${where}: the solution passes`);
  const others = w.markers.filter((m) => m.id && m.id !== s.solution.picked);
  assert.ok(others.length >= 2, `${where}: at least two wrong markers`);
  for (const m of others) assert.ok(isMessage(s.check({ picked: m.id })), `${where}: picking ${m.id} fails with a message`);
  assert.ok(isMessage(s.check({ picked: null })), `${where}: nothing picked fails with a message`);
}

test('lesson 1, whose-route: the route on the map belongs to the voyager marked correct', () => {
  const seen = new Set();
  for (const s of cover('voyages', 'whose-route')) {
    const fig = s.figures[0];
    assert.equal(fig.type, 'world-map');
    const pts = fig.lines.flatMap((l) => l.points);
    const near = (id, km = 200) => pts.some((p) => distanceKm(p, H.at(id)) <= km);
    // identify the voyage from its geometry alone
    let who;
    if (pts.some((p) => p[0] < -150) && pts.some((p) => p[0] > 150)) who = 'Magellan and Elcano';
    else if (near('nanjing')) who = 'Zheng He';
    else if (near('sanSalvador')) who = 'Christopher Columbus';
    else if (near('calicut') && near('lisbon')) who = 'Vasco da Gama';
    assert.ok(who, 'the route is one of the four');
    const right = correctOption(s);
    assert.ok(right.text.startsWith(who), `the map shows ${who}'s route; marked: ${right.text}`);
    assert.equal(s.options.length, 4);
    assert.ok(s.explain.includes(who.split(' ')[0] === 'Christopher' ? 'Columbus' : who.split(' ')[0] === 'Vasco' ? 'Da Gama' : who.split(' ')[0]), 'the explanation is about the same voyage');
    assert.ok(!/Zheng|Columbus|Gama|Magellan|Elcano/.test(fig.alt), 'the description of the map does not name the voyager');
    assert.ok(!fig.lines.some((l) => l.label), 'no label on the route gives the answer away');
    seen.add(who);
  }
  assert.equal(seen.size, 4, 'all four voyages come up');
});

test('lesson 1, port-pick: the marker to tap is the port named, and wrong taps are told what they hit', () => {
  const PORT = { Lisbon: 'lisbon', 'Cape of Good Hope': 'goodHope', Malindi: 'malindi', Hormuz: 'hormuz', Calicut: 'calicut', Malacca: 'malacca', Nanjing: 'nanjing' };
  const seen = new Set();
  for (const s of cover('voyages', 'port-pick')) {
    const asked = /\*\*Tap ([^*]+)\*\*/.exec(s.text)[1];
    const name = asked.replace(/^the /, '');
    assert.equal(asked, name === 'Cape of Good Hope' ? 'the Cape of Good Hope' : name, 'only the Cape takes an article');
    assert.ok(PORT[name], `${name} is a port the test knows`);
    const target = s.widget.markers.find((m) => m.id === s.solution.picked);
    const [lon, lat] = SITES[PORT[name]];
    assert.ok(distanceKm(target.at, [lon, lat]) <= 60, `the marker for ${name} is at ${name}`);
    assert.equal(target.label, name);
    assert.equal(s.widget.markers.length, 4);
    assert.equal(s.widget.markerLabels, 'after', 'names are hidden until the step is answered');
    // markers are far enough apart to tap on a phone (at least 900 km on this map of half the world)
    for (const a of s.widget.markers) for (const b of s.widget.markers) if (a !== b) assert.ok(distanceKm(a.at, b.at) > 900, `${a.label} and ${b.label} are well apart`);
    checkMarkerStep(s, 'port-pick');
    for (const m of s.widget.markers) if (m !== target) assert.ok(s.check({ picked: m.id }).includes(m.label), 'the feedback names the port that was tapped');
    assert.ok(s.explain.includes(name));
    seen.add(name);
  }
  assert.equal(seen.size, 7, 'all seven ports come up');
});

test('lesson 2, kitchen: exactly one item comes from the other side of the Atlantic, and it is the marked one', () => {
  const seen = new Set();
  for (const s of cover('columbian-exchange', 'kitchen')) {
    const city = /unknown to a cook in ([^?]+)\?/.exec(s.text)[1];
    const home = AMERICAN_KITCHENS.test(city) ? 'americas' : 'afroeurasia';
    // the question says which half of the world the three familiar things belong to, and it is the cook's own half
    assert.match(s.text, home === 'americas' ? /Three of these can be found somewhere in the Americas/ : /Three of these can be found somewhere in Africa, Asia or Europe/);
    assert.equal(s.options.length, 4);
    const foreign = s.options.filter((o) => sideOf(o.text) !== home);
    assert.equal(foreign.length, 1, `one item is foreign to ${city}: ${s.options.map((o) => o.text).join(', ')}`);
    assert.equal(foreign[0], correctOption(s), 'and it is the one marked correct');
    assert.match(s.text, /1450/);
    assert.ok(bare(s.explain).toLowerCase().startsWith(foreign[0].text.toLowerCase()));
    assert.match(s.explain, home === 'americas' ? /came from Africa, Asia and Europe/ : /came from the Americas/);
    seen.add(home);
  }
  assert.equal(seen.size, 2, 'kitchens on both sides come up');
  // the table itself: every item is on the side this test expects
  for (const g of Object.values(H.GOODS)) assert.equal(sideOf(g.name), g.home, g.name);
  assert.ok(H.goodsFrom('americas').length >= 10 && H.goodsFrom('afroeurasia').length >= 10);
  // nothing with a disputed or two-sided history is in the table
  for (const g of Object.values(H.GOODS)) assert.ok(!/sweet potato|chicken|coconut|cotton|dog|gourd|grape|bean|onions|sheep/i.test(g.name), `${g.name} is left out on purpose`);
});

test('lesson 2, dish: the late-coming ingredient is the only one from the far side of the ocean', () => {
  const seen = new Set();
  for (const s of cover('columbian-exchange', 'dish')) {
    const [, dish, where] = /^(.+) could hardly be more at home in (.+?)\. Yet/.exec(flat(s.text));
    const home = AMERICAN_KITCHENS.test(where) ? 'americas' : 'afroeurasia';
    const foreign = s.options.filter((o) => sideOf(o.text) !== home);
    assert.equal(foreign.length, 1, `${dish} in ${where}: one newcomer among ${s.options.map((o) => o.text).join(', ')}`);
    assert.equal(foreign[0], correctOption(s));
    assert.ok(s.options.length >= 3 && s.options.length <= 4);
    assert.match(s.explain, home === 'americas' ? /came from Africa, Asia and Europe/ : /came from the Americas/);
    seen.add(dish);
  }
  assert.equal(seen.size, H.DISHES.length, 'every dish comes up');
  for (const d of H.DISHES) {
    assert.equal(H.INGREDIENT_HOME[d.late], sideOf(d.late), d.late);
    for (const o of d.old) { assert.equal(H.INGREDIENT_HOME[o], sideOf(o), o); assert.notEqual(H.INGREDIENT_HOME[o], H.INGREDIENT_HOME[d.late], `${d.dish}: ${o} is from the other side than ${d.late}`); }
    assert.ok(d.old.length >= 2);
  }
});

test('lesson 2, homelands: the marker to tap is where the crop was first grown', () => {
  const seen = new Set();
  for (const s of cover('columbian-exchange', 'homelands')) {
    const crop = /where (?:the )?(.+?) was first grown/.exec(bare(s.text))[1].replace(' (corn)', '');
    assert.ok(CROP_ORIGIN[crop], `the test knows where ${crop} comes from`);
    const target = s.widget.markers.find((m) => m.id === s.solution.picked);
    assert.ok(distanceKm(target.at, CROP_ORIGIN[crop]) <= 500, `${crop}: marker ${target.label} is at its homeland`);
    assert.equal(s.widget.markers.length, 6);
    for (const a of s.widget.markers) for (const b of s.widget.markers) if (a !== b) assert.ok(distanceKm(a.at, b.at) > 2500, `${a.label} and ${b.label} are far apart on the world map`);
    checkMarkerStep(s, `homelands (${crop})`);
    seen.add(crop);
  }
  assert.equal(seen.size, Object.keys(CROP_ORIGIN).length, 'all seven crops come up');
});

test('lesson 3, empire-home: the country to tap is the one the capital lies in today', () => {
  const seen = new Set();
  for (const s of cover('gunpowder-empires', 'empire-home')) {
    const capital = /ruled from ([^.]+)\./.exec(bare(s.text))[1];
    const want = CAPITALS[capital];
    assert.ok(want, `the test knows where ${capital} is`);
    assert.equal(s.solution.picked, want);
    assert.equal(s.widget.answer, want);
    assert.equal(s.widget.mode, 'pick');
    assert.ok(s.widget.pickable.includes(want), 'the answer can be tapped');
    assert.equal(s.check({ picked: want, name: countryName(want) }), true);
    for (const wrong of ['TR', 'IR', 'IN', 'CN', 'JP', 'RU', 'PK', 'SA', 'KZ'].filter((c) => c !== want)) {
      const fb = s.check({ picked: wrong, name: countryName(wrong) });
      assert.ok(isMessage(fb) && fb.includes(countryName(wrong)), `${capital}: tapping ${wrong} is told what it is`);
    }
    assert.ok(isMessage(s.check({ picked: null, name: null })));
    assert.ok(s.explain.includes(countryName(want)));
    assert.match(s.explain, THEN_VERSUS_NOW[capital], `${capital}: the comparison with today's borders is the right way round`);
    seen.add(capital);
  }
  assert.equal(seen.size, 6);
});

test('lesson 3, which-empire: each fact belongs to the state marked correct, and to no other option', () => {
  const seen = new Set();
  for (const s of cover('gunpowder-empires', 'which-empire')) {
    const hits = EMPIRE_CLUES.filter(([re]) => re.test(s.text));
    assert.equal(hits.length, 1, `one clue in "${flat(s.text)}"`);
    const want = hits[0][1];
    const right = correctOption(s);
    assert.ok(right.text.includes(want), `${flat(s.text)} → ${want}; marked ${right.text}`);
    assert.equal(s.options.filter((o) => o.text.includes(want)).length, 1);
    assert.equal(s.options.length, 4);
    seen.add(flat(s.text));
  }
  assert.equal(seen.size, H.EMPIRE_FACTS.length, 'every fact comes up');
  assert.equal(H.EMPIRE_FACTS.length, EMPIRE_CLUES.length);
});

test('lesson 4, print-towns: the marker to tap is the town named, and the four towns are well apart', () => {
  const TOWN = { Mainz: 'mainz', Venice: 'venice', Wittenberg: 'wittenberg', Rome: 'rome', Florence: 'florence', Geneva: 'geneva', Paris: 'paris', London: 'london' };
  const CLUE = { Mainz: /Gutenberg/, Venice: /port/, Wittenberg: /Luther/, Rome: /popes/, Florence: /Renaissance/, Geneva: /Calvin/, Paris: /French/, London: /Caxton/ };
  const seen = new Set();
  for (const s of cover('print-and-reform', 'print-towns')) {
    const name = /\*\*Tap ([^*]+)\*\*/.exec(s.text)[1];
    const target = s.widget.markers.find((m) => m.id === s.solution.picked);
    const [lon, lat] = SITES[TOWN[name]];
    assert.ok(distanceKm(target.at, [lon, lat]) <= 40, `the marker for ${name} is at ${name}`);
    assert.match(s.text, CLUE[name], `${name} is asked for by its own clue`);
    assert.equal(s.widget.markers.length, 4);
    for (const a of s.widget.markers) for (const b of s.widget.markers) if (a !== b) assert.ok(distanceKm(a.at, b.at) >= 280, `${a.label} and ${b.label} can be told apart on a phone`);
    const [w, so, e, n] = s.widget.view;
    for (const m of s.widget.markers) assert.ok(m.at[0] > w + 1 && m.at[0] < e - 1 && m.at[1] > so + 1 && m.at[1] < n - 1, `${m.label} is well inside the map`);
    checkMarkerStep(s, `print-towns (${name})`);
    assert.ok(s.explain.startsWith(name));
    seen.add(name);
  }
  assert.equal(seen.size, 8, 'all eight towns come up');
});

for (const [lesson, id, group] of [['print-and-reform', 'who-print', 'print'], ['new-science', 'who-science', 'science']]) {
  test(`${lesson}, ${id}: the deed belongs to the person marked correct`, () => {
    const seen = new Set();
    for (const s of cover(lesson, id)) {
      const hits = DEEDS.filter(([re]) => re.test(bare(s.text)));
      assert.equal(hits.length, 1, `one deed in "${flat(s.text)}"`);
      assert.equal(correctOption(s).text, hits[0][1]);
      assert.equal(s.options.length, 4);
      assert.ok(bare(s.explain).startsWith(hits[0][1]));
      seen.add(hits[0][1]);
    }
    const people = Object.values(H.PEOPLE).filter((p) => p.group === group);
    assert.equal(seen.size, people.length, `all ${people.length} people come up`);
    // no deed could be claimed by anyone else in the group: each matches one clue of the test's table only
    for (const p of people) assert.equal(DEEDS.filter(([re]) => re.test(bare(p.did))).length, 1, `${p.name}: "${p.did}" matches one clue`);
  });
}

test('lesson 5, science-home: the country to tap is where the scientist worked', () => {
  const seen = new Set();
  for (const s of cover('new-science', 'science-home')) {
    const who = flat(s.text).split(' ')[0];
    const want = SCIENCE_COUNTRY[who];
    assert.ok(want, `the test knows where ${who} worked`);
    assert.equal(s.solution.picked, want);
    assert.equal(s.widget.answer, want);
    assert.ok(s.widget.pickable.includes(want));
    assert.equal(s.check({ picked: want, name: countryName(want) }), true);
    for (const wrong of ['PL', 'IT', 'CZ', 'GB', 'NL', 'FR', 'DE', 'ES'].filter((c) => c !== want)) {
      const fb = s.check({ picked: wrong, name: countryName(wrong) });
      assert.ok(isMessage(fb) && fb.includes(countryName(wrong)), `${who}: tapping ${wrong} is told what it is`);
    }
    assert.ok(isMessage(s.check({ picked: null })));
    assert.ok(s.explain.includes(countryName(want)));
    seen.add(who);
  }
  assert.equal(seen.size, 6);
  for (const item of H.SCIENCE_HOMES) assert.equal(H.PLACES[item.place].country, item.country, `${item.who}: ${item.place} is in ${item.country}`);
});

test('lesson 6, where-most: the region marked correct received the most, by a wide margin', () => {
  const seen = new Set();
  for (const s of cover('atlantic-world', 'where-most')) {
    assert.equal(s.options.length, 3);
    const counts = s.options.map((o) => { assert.ok(LANDED[o.text], `the test has an estimate for ${o.text}`); return LANDED[o.text]; });
    const sorted = [...counts].sort((a, b) => b - a);
    assert.equal(LANDED[correctOption(s).text], sorted[0], 'the largest is marked');
    assert.ok(sorted[0] >= 1.5 * sorted[1], `a clear margin: ${sorted[0]} against ${sorted[1]}`);
    assert.match(s.text, /10\.7 million/);
    // the figures quoted in the explanation are the test's own, rounded
    for (const o of s.options) {
      const n = LANDED[o.text];
      const quoted = n >= 950000 ? `about ${(Math.round(n / 1e5) / 10)} million` : `about ${Math.round(n / 1e4) * 10},000`;
      assert.ok(s.explain.includes(quoted), `${o.text}: "${quoted}" appears in the explanation`);
    }
    seen.add(s.options.map((o) => o.text).sort().join('|'));
  }
  assert.ok(seen.size >= 8, `${seen.size} different trios`);
});

test('lesson 6, abolition-order: the event marked is the first (or last) of three that lie at least 15 years apart', () => {
  const seen = new Set();
  for (const s of cover('atlantic-world', 'abolition-order')) {
    const last = /happened \*\*last\*\*/.test(s.text);
    assert.ok(last || /happened \*\*first\*\*/.test(s.text));
    const years = s.options.map((o) => yearOfText(o.text));
    const sorted = [...years].sort((a, b) => a - b);
    assert.ok(sorted[1] - sorted[0] >= 15 && sorted[2] - sorted[1] >= 15, `far enough apart: ${sorted}`);
    assert.equal(yearOfText(correctOption(s).text), last ? sorted[2] : sorted[0]);
    // the explanation lists them in order, with their years
    const quoted = [...s.explain.matchAll(/\((?:about )?(\d{3,4})\)/g)].map((m) => Number(m[1]));
    assert.deepEqual(quoted, sorted, 'the explanation gives the three years in order');
    seen.add(sorted.join());
  }
  assert.ok(seen.size >= 6);
  for (const id of H.ABOLITION_EVENTS) assert.ok(DATES[id] >= 1789 && DATES[id] <= 1888);
  // the generator refuses a pool in which nothing is far enough apart
  assert.throws(() => H.firstOfThree(makeRng(1), ['dias', 'columbus', 'daGama'], { minGap: 25 }));
});

test('guard: every generated step of the course is covered by a test above', () => {
  const generated = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) if (typeof step.gen === 'function') generated.push(`${id}/${step.id}`);
  assert.deepEqual(generated.sort(), [...COVERED].sort());
  assert.equal(generated.length, 13);
});

/* ====================================================================== order steps and timelines */

test('order steps: chronologies agree with the dates table, and the spice route runs from island to kitchen', () => {
  const dated = [['columbian-exchange', 'order'], ['print-and-reform', 'order']];
  for (const [lesson, id] of dated) {
    const s = one(lesson, id);
    const years = s.items.map((item) => yearOfText(item));
    for (let i = 1; i < years.length; i++) assert.ok(years[i] > years[i - 1], `${lesson}/${id}: ${s.items[i - 1]} (${years[i - 1]}) comes before ${s.items[i]} (${years[i]})`);
    // every year quoted in the explanation belongs to one of the items or to the world context named there
    for (const y of years) assert.ok(s.explain.includes(String(y)), `${lesson}/${id}: the explanation gives ${y}`);
  }
  assert.match(one('print-and-reform', 'order').explain, /25 years after Columbus/);
  assert.equal(DATES.luther - DATES.columbus, 25);
  assert.match(one('print-and-reform', 'order').explain, /four\s+years before Tenochtitlan fell/);
  assert.equal(DATES.tenochtitlanFalls - DATES.luther, 4);
  // the spice route: the hands appear in the order the route on the map passes their ports
  const spice = one('voyages', 'spice');
  const stops = ['Malacca', 'Calicut', 'Alexandria', 'Mediterranean'];
  spice.items.forEach((item, i) => assert.ok(item.includes(stops[i]), `hand ${i + 1} is the one that reaches ${stops[i]}`));
  const route = H.ROUTES.spice.points;
  const pos = (id) => route.findIndex((p) => distanceKm(p, H.at(id)) < 5);
  assert.ok(pos('moluccas') === 0 && pos('moluccas') < pos('malacca') && pos('malacca') < pos('calicut') && pos('calicut') < pos('aden') && pos('aden') < pos('alexandria') && pos('alexandria') < pos('venice'));
  // every order step in the course is one of these three
  const all = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) if (step.type === 'order') all.push(`${id}/${step.id}`);
  assert.deepEqual(all.sort(), ['columbian-exchange/order', 'print-and-reform/order', 'voyages/spice']);
});

test('timeline placing: the solution passes, anything within 30 years passes, anything further out fails', () => {
  const steps = [
    ['voyages', 'timeline', { zhengHe: DATES.zhengHe, columbus: DATES.columbus, victoria: DATES.victoria }],
    ['new-science', 'timeline', { copernicus: DATES.copernicus, telescope: DATES.telescope, principia: DATES.principia }],
  ];
  for (const [lesson, id, truth] of steps) {
    const s = one(lesson, id);
    const w = s.widget;
    assert.equal(w.type, 'timeline');
    assert.match(s.text, /within 30 years/);
    assert.deepEqual(Object.fromEntries(w.place.map((c) => [c.id, c.answer])), truth, `${lesson}: the cards show the true years afterwards`);
    for (const c of w.place) assert.ok(c.answer >= w.from && c.answer <= w.to, `${c.id} fits on the axis`);
    for (const e of w.events) assert.equal(DATES[e.id] || e.year, e.year, `${lesson}: landmark ${e.label} is at its true year`);
    const state = (placed) => ({ placed, complete: Object.values(placed).every((v) => v != null), count: Object.values(placed).filter((v) => v != null).length });
    assert.equal(s.check(state(s.solution.placed)), true, `${lesson}: the solution passes`);
    assert.equal(s.check(state(truth)), true, `${lesson}: the true years pass`);
    for (const shift of [-30, -15, 15, 30]) {
      for (const card of Object.keys(truth)) {
        const placed = { ...truth, [card]: truth[card] + shift };
        const ordered = Object.values(placed).every((v, i, arr) => i === 0 || v > arr[i - 1]);
        if (ordered) assert.equal(s.check(state(placed)), true, `${lesson}: ${card} ${shift} years off still counts`);
      }
    }
    for (const shift of [-35, 35, -60, 60]) {
      for (const card of Object.keys(truth)) {
        const fb = s.check(state({ ...truth, [card]: truth[card] + shift }));
        assert.ok(isMessage(fb), `${lesson}: ${card} ${shift} years off is rejected with a message`);
      }
    }
    // the wrong order is rejected even when every card is "near"
    const ids = Object.keys(truth);
    assert.ok(isMessage(s.check(state({ ...truth, [ids[0]]: truth[ids[1]], [ids[1]]: truth[ids[0]] }))));
    // an unfinished answer is not judged
    assert.ok(isMessage(s.check(state({ ...truth, [ids[2]]: null }))));
    // the widget snaps in steps of 5: the solution is reachable
    for (const v of Object.values(s.solution.placed)) assert.equal(v % w.snap, 0, `${lesson}: ${v} is a multiple of the snap`);
  }
});

test('timeline picking and exploring: dynasties about 1600, and the landmarks of abolition', () => {
  const s = one('gunpowder-empires', 'timeline');
  const w = s.widget;
  assert.equal(w.mode, 'pick');
  const ruling = w.spans.filter((sp) => sp.from <= 1600 && sp.to >= 1600).map((sp) => sp.id);
  assert.deepEqual(ruling.sort(), ['ming', 'mughal', 'ottoman', 'safavid'], 'who was ruling in 1600');
  assert.equal(s.solution.picked, 'ming');
  assert.equal(s.check({ picked: 'ming', kind: 'span' }), true);
  for (const wrong of ['qing', 'tokugawa', 'ottoman', 'safavid', 'mughal']) assert.ok(isMessage(s.check({ picked: wrong, kind: 'span' })), `${wrong} is rejected with a message`);
  assert.ok(isMessage(s.check({ picked: null })));
  assert.match(s.check({ picked: 'qing' }), /1644/);
  for (const sp of w.spans) { assert.equal(sp.to, H.EMPIRES[sp.id].to); assert.ok(sp.from >= w.from && sp.to <= w.to); }

  const a = one('atlantic-world', 'abolition');
  assert.equal(a.graded, false, 'reading the landmarks is not marked');
  assert.equal(a.widget.mode, 'explore');
  const years = a.widget.events.map((e) => e.year);
  assert.deepEqual(years, [1789, 1791, 1807, 1833, 1848, 1865, 1888]);
  for (const e of a.widget.events) { assert.equal(e.year, DATES[e.id]); assert.ok(e.note.length > 40, `${e.id} has a note`); }
  assert.ok(isMessage(a.check({ selected: null, seen: [], seenCount: 0 })));
  assert.equal(a.check({ selected: 'brazilAbolition', seen: ['brazilAbolition'], seenCount: 1 }), true);
  assert.ok(a.widget.events.some((e) => e.id === a.solution.selected));
  // the notes do not contradict the dates table
  const noteOf = (id) => a.widget.events.find((e) => e.id === id).note;
  assert.match(noteOf('haitiRevolt'), /1804/);
  assert.match(noteOf('britainTradeBan'), /1808/);
  assert.match(noteOf('britainAbolition'), /1834/);
  assert.match(noteOf('britainAbolition'), /20 million pounds/);
  assert.match(noteOf('franceAbolition'), /1794/);
});

/* ====================================================================== map, photo and widget interactions */

test('map steps: each solution passes its own check, and plausible wrong answers fail with a message', () => {
  // lesson 1: the volta
  const volta = one('voyages', 'volta');
  assert.equal(volta.check({ picked: 'b' }), true);
  assert.ok(isMessage(volta.check({ picked: 'a' })) && isMessage(volta.check({ picked: null })));
  assert.equal(volta.widget.answer, 'b');
  // route B really is the long way round: about half as long again, and it reaches the latitude of the Azores far out at sea
  const len = (pts) => pts.slice(1).reduce((sum, p, i) => sum + distanceKm(pts[i], p), 0);
  const coast = len(H.ROUTES.elminaCoast.points);
  const out = len(H.ROUTES.elminaVolta.points);
  assert.ok(out / coast > 1.35 && out / coast < 1.7, `the volta is ${(out / coast).toFixed(2)} times as long as the coastal route`);
  assert.ok(H.ROUTES.elminaVolta.points.some((p) => p[0] < -30 && p[1] > 30), 'it swings out towards the Azores');
  assert.match(volta.explain, /about half as long again/);
  // the pickable markers sit on their own routes
  const onRoute = (pt, route) => route.some((p, i) => i > 0 && distanceKm(pt, [(p[0] + route[i - 1][0]) / 2, (p[1] + route[i - 1][1]) / 2]) < 600);
  const mark = (id) => volta.widget.markers.find((m) => m.id === id).at;
  assert.ok(onRoute(mark('a'), H.ROUTES.elminaCoast.points) && onRoute(mark('b'), H.ROUTES.elminaVolta.points));

  // lesson 1: da Gama's stops
  const gama = one('voyages', 'da-gama');
  const want = ['lisbon', 'capeVerde', 'goodHope', 'malindi', 'calicut'];
  assert.deepEqual(gama.solution.route, want);
  assert.deepEqual(gama.widget.answer, want);
  assert.equal(gama.check({ route: want, count: 5 }), true);
  for (const wrong of [['lisbon', 'goodHope', 'capeVerde', 'malindi', 'calicut'], ['lisbon', 'capeVerde', 'goodHope', 'calicut', 'malindi'], ['calicut', 'malindi', 'goodHope', 'capeVerde', 'lisbon'], ['lisbon', 'capeVerde', 'goodHope'], []]) {
    assert.ok(isMessage(gama.check({ route: wrong, count: wrong.length })), `route ${wrong.join('>') || '(empty)'} is rejected with a message`);
  }
  // the stops come in the same order along the route drawn under them
  const along = want.map((id) => H.VOYAGES.daGama.points.findIndex((p) => distanceKm(p, H.at(id)) < 260));
  assert.ok(along.every((v, i) => v >= 0 && (i === 0 || v > along[i - 1])), `the stops lie along the route in order: ${along}`);

  // lesson 2: Manila
  const loop = one('columbian-exchange', 'loop');
  assert.equal(loop.check({ picked: 'manila' }), true);
  for (const wrong of ['seville', 'potosi', 'acapulco', null]) assert.ok(isMessage(loop.check({ picked: wrong })), `${wrong} is rejected with a message`);
  assert.equal(loop.widget.answer, 'manila');
  assert.deepEqual(H.ROUTES.galleon.points[0], H.at('acapulco'));
  assert.deepEqual(H.ROUTES.galleon.points[H.ROUTES.galleon.points.length - 1], H.at('manila'));
  assert.ok(H.ROUTES.galleon.points.every((p) => p[1] > 10 && p[1] < 18), 'the westbound galleon ran along the trade winds, between 10 and 18 degrees north');

  // lesson 3: Iran, Nagasaki
  const safavid = one('gunpowder-empires', 'safavid');
  assert.equal(safavid.check({ picked: 'IR', name: 'Iran' }), true);
  for (const wrong of ['IQ', 'TR', 'SA', 'AF', 'PK', 'EG']) { const fb = safavid.check({ picked: wrong, name: countryName(wrong) }); assert.ok(isMessage(fb) && fb.includes(countryName(wrong)), `${wrong} is told what it is`); }
  assert.ok(isMessage(safavid.check({ picked: null, name: null })));
  assert.equal(safavid.widget.answer, 'IR');
  assert.equal(countryAt(H.at('isfahan'), 'high'), 'IR');
  const japan = one('gunpowder-empires', 'japan');
  checkMarkerStep(japan, 'japan');
  assert.equal(japan.solution.picked, 'nagasaki');
  // Nagasaki is the south-westernmost of the three markers, as the question says
  const jm = Object.fromEntries(japan.widget.markers.map((m) => [m.id, m.at]));
  assert.ok(jm.nagasaki[0] < jm.kyoto[0] && jm.kyoto[0] < jm.edo[0] && jm.nagasaki[1] < jm.kyoto[1]);

  // lesson 4: Venice
  const spread = one('print-and-reform', 'spread');
  checkMarkerStep(spread, 'spread');
  assert.equal(spread.solution.picked, 'venice');
  const years = Object.fromEntries(spread.widget.markers.map((m) => [m.id, Number(/\d{4}/.exec(m.label)[0])]));
  assert.deepEqual(years, { mainz: 1450, rome: 1467, venice: 1469, paris: 1470, krakow: 1473, london: 1476 });
  assert.equal(countryAt(spread.widget.markers.find((m) => m.id === 'krakow').at, 'high'), 'PL');

  // lesson 4: the pin on Mainz. The widget reports where the pin is and how far that is from the target.
  const mainz = one('print-and-reform', 'mainz');
  assert.equal(mainz.widget.mode, 'place');
  assert.ok(distanceKm(mainz.widget.target, SITES.mainz.slice(0, 2)) < 30, 'the target is Mainz');
  assert.match(mainz.text, /within 200 km/);
  const pinState = (pin) => ({ pin, placed: true, km: Math.round(distanceKm(pin, mainz.widget.target)), country: countryAt(pin, 'high') });
  assert.equal(mainz.check(pinState(mainz.solution.pin)), true);
  for (const [name, pin] of [['Frankfurt', [8.68, 50.11]], ['Cologne', [6.96, 50.94]], ['Strasbourg', [7.75, 48.58]], ['Stuttgart', [9.18, 48.78]]]) assert.equal(mainz.check(pinState(pin)), true, `a pin on ${name} is close enough`);
  const BEARINGS = { north: 0, 'north-east': 45, east: 90, 'south-east': 135, south: 180, 'south-west': 225, west: 270, 'north-west': 315 };
  for (const [name, pin] of [['Paris', [2.35, 48.86]], ['Berlin', [13.4, 52.52]], ['Venice', [12.34, 45.44]], ['London', [-0.12, 51.51]], ['Rome', [12.5, 41.9]], ['Vienna', [16.37, 48.21]], ['Hamburg', [9.99, 53.55]], ['Madrid', [-3.7, 40.42]]]) {
    const st = pinState(pin);
    assert.ok(st.km > 200, `${name} is more than 200 km from Mainz`);
    const fb = mainz.check(st);
    assert.ok(isMessage(fb) && fb.includes(`${st.km} km`), `${name}: the feedback says how far off the pin is`);
    // the direction named is the one of the eight that really leads from the pin towards Mainz
    const named = /lies to the ([a-z-]+) of your pin/.exec(fb)[1];
    const best = Object.keys(BEARINGS).sort((a, b) => distanceKm(destination(pin, st.km, BEARINGS[a]), mainz.widget.target) - distanceKm(destination(pin, st.km, BEARINGS[b]), mainz.widget.target))[0];
    assert.equal(named, best, `${name}: Mainz lies to the ${best}`);
  }
  assert.ok(isMessage(mainz.check({ pin: [8, 46], placed: false, km: 445 })), 'an unmoved pin is not judged');
  assert.equal(H.compass([0, 0], [0, 10]), 'north');
  assert.equal(H.compass([0, 0], [10, 0]), 'east');
  assert.equal(H.compass([10, 50], [0, 40]), 'south-west');
  assert.equal(H.compass([170, 0], [-170, 0]), 'east', 'across the date line');
  // the Rhine really does pass Mainz in the map's river data (the question leans on it)
  assert.match(mainz.widget.rivers.join(), /Rhine/);

  // lesson 6: Angola, Palmares
  const from = one('atlantic-world', 'where-from');
  assert.equal(from.check({ picked: 'AO', name: 'Angola' }), true);
  for (const wrong of ['CD', 'CG', 'GA', 'NA', 'NG', 'GH', 'SN', 'CM']) { const fb = from.check({ picked: wrong, name: countryName(wrong) }); assert.ok(isMessage(fb) && fb.includes(countryName(wrong)), `${wrong} is told what it is`); }
  assert.ok(isMessage(from.check({ picked: null })));
  assert.equal(countryAt(H.at('luanda'), 'high', 20), 'AO');
  assert.equal(countryInfo('AO').capital, 'Luanda');
  const resist = one('atlantic-world', 'resistance');
  checkMarkerStep(resist, 'resistance');
  assert.equal(resist.solution.picked, 'palmares');
  assert.equal(countryAt(H.at('palmares'), 'high'), 'BR');

  // every interact step in the course has been looked at by one test or another
  const known = new Set(['voyages/volta', 'voyages/da-gama', 'voyages/cantino', 'voyages/timeline', 'voyages/port-pick', 'columbian-exchange/homelands', 'columbian-exchange/malintzin',
    'columbian-exchange/loop', 'gunpowder-empires/safavid', 'gunpowder-empires/japan', 'gunpowder-empires/timeline', 'gunpowder-empires/empire-home', 'print-and-reform/mainz', 'print-and-reform/spread',
    'print-and-reform/renaissance', 'print-and-reform/print-towns', 'new-science/diagram', 'new-science/merian', 'new-science/newton', 'new-science/timeline', 'new-science/science-home',
    'atlantic-world/where-from', 'atlantic-world/resistance', 'atlantic-world/abolition']);
  const all = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) if (step.type === 'interact') all.push(`${id}/${step.id}`);
  assert.deepEqual(all.sort(), [...known].sort());
});

test('photo steps: the right part of each picture is accepted, the other parts are explained', () => {
  const picks = [['voyages', 'cantino', 'line'], ['columbian-exchange', 'malintzin', 'malintzin'], ['new-science', 'diagram', 'earth'], ['new-science', 'merian', 'chrysalis']];
  for (const [lesson, id, right] of picks) {
    const s = one(lesson, id);
    const spots = s.widget.hotspots;
    assert.equal(s.widget.type, 'photo');
    assert.ok(spots.length >= 4, `${lesson}/${id}: several parts to choose from`);
    assert.equal(s.solution.picked, right);
    assert.equal(s.check({ picked: right }), true);
    for (const sp of spots) {
      if (sp.id !== right) assert.ok(isMessage(s.check({ picked: sp.id })), `${lesson}/${id}: ${sp.id} is rejected with a message`);
      assert.ok(sp.x > 0 && sp.x < 1 && sp.y > 0 && sp.y < 1 && sp.r >= 0.04 && sp.r <= 0.12, `${sp.id}: a sensible ring`);
      assert.ok(sp.label && sp.alt, `${sp.id}: has a label and a neutral description`);
      // the neutral description read out before answering does not contain the label that names the part
      assert.ok(!sp.alt.toLowerCase().includes(sp.label.toLowerCase()), `${sp.id}: the description does not name the part`);
    }
    assert.ok(isMessage(s.check({ picked: null })));
    // rings do not swallow one another: centres are further apart than the smaller radius (in units of the picture's width)
    const aspect = s.widget.width / s.widget.height;
    for (const a of spots) for (const b of spots) if (a !== b) assert.ok(Math.hypot(a.x - b.x, (a.y - b.y) / aspect) > Math.min(a.r, b.r), `${a.id} and ${b.id} are separate`);
  }
  // the vanishing point: tapping anywhere in the ring between the two central figures counts
  const ren = one('print-and-reform', 'renaissance');
  assert.equal(ren.widget.mode, 'point');
  assert.equal(ren.check({ picked: 'vanish', point: { x: 0.5, y: 0.47 } }), true);
  assert.equal(ren.check({ picked: ren.solution.picked, point: ren.solution.point }), true);
  for (const wrong of ['left', 'right', 'arch', null]) assert.ok(isMessage(ren.check({ picked: wrong, point: { x: 0.1, y: 0.1 } })), `${wrong} is rejected with a message`);
  const v = ren.widget.hotspots.find((h) => h.id === 'vanish');
  assert.ok(Math.abs(v.x - 0.5) < 0.03, 'the vanishing point is on the centre line of the painting');
  assert.ok(Math.hypot(ren.solution.point.x - v.x, (ren.solution.point.y - v.y) / (ren.widget.width / ren.widget.height)) < v.r, 'the solution point lies inside the ring');
});

test('Newton\'s cannon: any shot that lands is sent back, any orbit is accepted', () => {
  const s = one('new-science', 'newton');
  assert.equal(s.widget.type, 'orbit-cannon');
  const [lo, hi, st] = s.widget.speedRange;
  // closed form for this widget's mountain (882 km) and planet (6400 km, g = 10): the ball lands when its lowest point is below the ground
  const R = 6400e3;
  const r0 = R + 882e3;
  const mu = 10 * R * R;
  const lands = (kms) => {
    const v = kms * 1000;
    const energy = v * v / 2 - mu / r0;
    if (energy >= 0) return false;                         // escapes
    const a = -mu / (2 * energy);
    const h = r0 * v;
    const e = Math.sqrt(Math.max(0, 1 - (h * h) / (mu * a)));
    return a * (1 - e) < R;                                // perigee under the surface
  };
  let orbits = 0;
  for (let v = lo; v <= hi + 1e-9; v += st) {
    const state = { speed: v, launched: true, lands: lands(v), orbits: !lands(v) };
    if (state.lands) assert.ok(isMessage(s.check(state)), `${v} km/s lands and is sent back`);
    else { assert.equal(s.check(state), true, `${v} km/s stays up and is accepted`); orbits++; }
    assert.ok(isMessage(s.check({ ...state, launched: false })), 'nothing counts until the cannon is fired');
  }
  assert.ok(orbits >= 1 && orbits <= 3, `${orbits} of the slider's speeds give an orbit`);
  assert.equal(lands(s.solution.speed), false, 'the solution speed is an orbit');
  assert.equal(lands(7), true);
  assert.equal(lands(7.5), false);
});

/* ====================================================================== pictures */

test('pictures: every photo used is in the course\'s manifest with a licence and a credit, and is described', () => {
  const used = new Map();
  for (const [id, lesson] of Object.entries(lessons)) {
    let count = 0;
    const inLesson = new Set();
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(3), step.id);
      for (const spec of specsOf(s)) {
        if (spec.type !== 'photo') continue;
        const m = /^content\/media\/world-connected\/([a-z0-9-]+)\.jpg\?v=/.exec(spec.src);
        assert.ok(m, `${id}/${step.id}: the picture comes from this course's media folder (${spec.src})`);
        const entry = manifest.images[m[1]];
        assert.ok(entry, `${m[1]} is in the manifest`);
        assert.ok(entry.license && entry.license.length > 3, `${m[1]}: has a licence`);
        assert.ok(/^(Public domain|CC0|CC BY(-SA)? [234]\.[05])/.test(entry.license), `${m[1]}: licence "${entry.license}" is on the allow-list`);
        assert.ok(entry.author && entry.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'), `${m[1]}: has a credit and a source`);
        assert.ok(spec.credit && spec.license, `${id}/${step.id}: the credit travels with the picture`);
        assert.ok(spec.alt && spec.alt.length >= 60, `${id}/${step.id}: the alt text says what can be seen (${(spec.alt || '').length} characters)`);
        assert.ok(!/^(a |an |the )?(photo|image|picture)/i.test(spec.alt), `${id}/${step.id}: alt text starts with the subject`);
        if (spec.caption) assert.notEqual(spec.caption.toLowerCase(), spec.alt.toLowerCase());
        inLesson.add(m[1]);
        used.set(m[1], id);
        count++;
      }
      // photo answer options: no text, no caption, and an alt that does not name the answer
      for (const o of s.options || []) {
        if (!o.figure || o.figure.type !== 'photo') continue;
        assert.equal(o.text, '', `${id}/${step.id}: photo options have no text`);
        assert.ok(!o.figure.caption, `${id}/${step.id}: photo options have no caption`);
        assert.ok(!/Taj|Mahal|leymaniye|Isfahan|Forbidden|Istanbul|Beijing|Agra|Ottoman|Mughal|Safavid|Ming/i.test(o.figure.alt), `${id}/${step.id}: option alt "${o.figure.alt}" does not name the place`);
      }
    }
    assert.ok(inLesson.size >= 2 && inLesson.size <= 4, `${id}: ${inLesson.size} different pictures (2 to 4)`);
    assert.ok(count >= 2);
  }
  // nothing fetched and then forgotten
  assert.deepEqual([...used.keys()].sort(), Object.keys(manifest.images).sort(), 'every picture in the manifest is used by a lesson');
  assert.ok(used.size >= 15 && used.size <= 25, `${used.size} pictures in the course`);
});

/* ====================================================================== figures quoted in the text */

test('numbers in the text: the slave trade estimates add up and are quoted correctly', () => {
  const landedSum = Object.values(LANDED).reduce((a, b) => a + b, 0) + LANDED_ELSEWHERE;
  assert.equal(landedSum, 10702656, 'the regional estimates add up to the published total');
  assert.equal(H.LANDED, Math.round(landedSum / 1e5) / 10);
  assert.equal(H.EMBARKED, Math.round(EMBARKED_TOTAL / 1e5) / 10);
  for (const d of H.DESTINATIONS) {
    assert.equal(d.exact, LANDED[d.name], `${d.name}: the estimate`);
    assert.equal(d.millions, Math.round(d.exact / 1e5) / 10, `${d.name}: rounded to a tenth of a million`);
  }
  assert.deepEqual(H.DESTINATIONS.map((d) => d.exact), [...H.DESTINATIONS.map((d) => d.exact)].sort((a, b) => b - a), 'listed from the largest to the smallest');
  // shares quoted in the lesson
  const share = (n) => (100 * n) / landedSum;
  const hook = one('atlantic-world', 'hook');
  assert.equal(hook.answer, Math.round(share(LANDED['Mainland North America'])), 'about 4 in 100 were landed in mainland North America');
  assert.match(hook.text, /12\.5 million/);
  assert.match(bare(hook.text), /who survived the crossing/);
  assert.ok(share(LANDED.Brazil) > 44 && share(LANDED.Brazil) < 50, 'nearly half were landed in Brazil');
  assert.match(hook.explain, /Nearly half were\s+taken to Brazil/);
  const numbers = one('atlantic-world', 'numbers');
  assert.match(numbers.text, /12\.5 million/);
  assert.match(numbers.text, /10\.7 million/);
  assert.match(numbers.text, /Almost\s+two million died at sea/);
  assert.ok(EMBARKED_TOTAL - landedSum > 1.7e6 && EMBARKED_TOTAL - landedSum < 2e6);
  const bars = numbers.figures[0];
  assert.equal(bars.type, 'bars');
  assert.deepEqual(bars.data.map((d) => d.value), [4.9, 2.3, 1.3, 1.1, 0.4, 0.4]);
  assert.ok(bars.data.every((d) => d.value <= bars.yMax));
  // West Central Africa: about 5.7 of 12.5 million embarked is "nearly half"
  const from = one('atlantic-world', 'where-from');
  assert.match(from.text, /nearly half of them, about 5\.7 million/);
  assert.ok(5.7 / 12.5 > 0.44 && 5.7 / 12.5 < 0.5);
  // the recap repeats the same figures
  const recap = lessons['atlantic-world'].recap.join(' ');
  assert.match(recap, /12\.5 million/);
  assert.match(recap, /10\.7 million/);
  assert.match(recap, /4 in 100/);
  assert.match(recap, /1807 to 1888/);
  // no drag-and-drop or sorting games in this lesson
  for (const step of lessons['atlantic-world'].steps) assert.ok(!['bucket', 'match', 'order', 'fill'].includes(step.type), `atlantic-world/${step.id}: no sorting or matching games on this material`);
});

test('numbers in the text: years, spans and comparisons agree with the dates table', () => {
  const text = (lesson, id) => bare(visible(one(lesson, id)).join(' '));
  // lesson 1
  assert.match(text('voyages', 'hook'), /between 1405 and 1433/);
  assert.match(text('voyages', 'giraffe'), /Da Gama arrived 84 years later/);
  assert.equal(DATES.daGama - 1414, 84);
  assert.match(text('voyages', 'da-gama'), /In 1488 Bartolomeu Dias/);
  assert.match(text('voyages', 'da-gama'), /Almost ten years\s+later Vasco da Gama/);        // he rounded the Cape in November 1497 and reached India in May 1498
  assert.equal(DATES.daGama - DATES.dias, 10);
  assert.match(text('voyages', 'cantino'), /In 1494/);
  assert.match(text('voyages', 'cantino'), /chart of 1502/);
  assert.match(text('voyages', 'cantino'), /only four\s+years after da Gama/);
  assert.equal(1502 - DATES.daGama, 4);
  assert.match(text('voyages', 'magellan'), /In 1519/);
  assert.match(text('voyages', 'magellan'), /home in 1522 with 18 men/);
  assert.match(text('voyages', 'columbus'), /In 1492/);
  assert.match(text('voyages', 'columbus'), /more than four times/);
  assert.ok(19300 / 4400 > 4, 'the real distance from the Canaries to Japan is more than four times Columbus\'s 4,400 km');
  assert.match(text('voyages', 'why-portugal'), /head start of ninety\s+years/);
  assert.ok(Math.abs((DATES.daGama - DATES.zhengHe) - 90) <= 5);
  // lesson 2
  assert.match(text('columbian-exchange', 'name'), /In 1972/);
  assert.match(text('columbian-exchange', 'silver'), /In 1545/);
  assert.match(text('columbian-exchange', 'loop'), /from 1571/);
  assert.match(text('columbian-exchange', 'coin'), /utraque unum/);
  assert.match(text('columbian-exchange', 'conquest'), /in 1521/);
  assert.match(text('columbian-exchange', 'conquest'), /In 1532/);
  // lesson 3
  assert.match(text('gunpowder-empires', 'teach-ottoman'), /In 1453/);
  assert.match(text('gunpowder-empires', 'teach-ottoman'), /Süleyman \(1520 to 1566\)/);
  assert.match(text('gunpowder-empires', 'ottoman'), /church of 537/);
  assert.match(text('gunpowder-empires', 'safavid'), /In 1501/);
  assert.match(text('gunpowder-empires', 'mughal'), /In 1526/);
  assert.match(text('gunpowder-empires', 'buildings'), /between 1632 and 1653/);
  assert.match(text('gunpowder-empires', 'teach-china'), /\(1368 to 1644\)/);
  assert.match(text('gunpowder-empires', 'japan'), /In 1603/);
  assert.match(text('gunpowder-empires', 'japan'), /250 years of\s+peace/);
  assert.ok(Math.abs((H.EMPIRES.tokugawa.to - H.EMPIRES.tokugawa.from) - 250) <= 20);
  assert.match(text('gunpowder-empires', 'timeline'), /six centuries, until 1922/);
  assert.ok(H.EMPIRES.ottoman.to - H.EMPIRES.ottoman.from > 600);
  // lesson 4
  assert.match(text('print-and-reform', 'not-first'), /1377, about eighty years before Gutenberg/);
  assert.ok(Math.abs((DATES.gutenberg - DATES.jikji) - 80) <= 3);
  assert.match(text('print-and-reform', 'hook'), /Forty-five years later, in 1500/);
  assert.equal(1500 - DATES.gutenberg, 45);
  assert.match(text('print-and-reform', 'luther'), /In 1517/);
  assert.match(text('print-and-reform', 'north-south'), /in 1648/);
  // lesson 5
  assert.match(text('new-science', 'hook'), /For 1,400 years/);
  assert.ok(Math.abs((DATES.copernicus - 150) - 1400) <= 20);
  assert.match(text('new-science', 'hook'), /In 1543/);
  assert.match(text('new-science', 'kepler'), /In 1609/);
  assert.match(text('new-science', 'trial'), /In 1633/);
  assert.match(text('new-science', 'trial'), /aged 69/);
  assert.equal(1633 - 1564, 69);
  assert.match(text('new-science', 'newton'), /In 1687/);
  assert.match(text('new-science', 'method'), /In 1660/);
  assert.match(text('new-science', 'blind-spots'), /In 1792/);
  assert.match(text('new-science', 'blind-spots'), /Three years earlier Olaudah Equiano/);
  assert.equal(DATES.wollstonecraft - DATES.equiano, 3);
  assert.match(text('new-science', 'timeline'), /Almost 150 years/);
  assert.ok(DATES.principia - DATES.copernicus > 140 && DATES.principia - DATES.copernicus < 150);
  // lesson 6
  assert.match(text('atlantic-world', 'coast'), /built in 1482/);
  assert.match(text('atlantic-world', 'equiano'), /in 1789/);
  assert.match(text('atlantic-world', 'brookes'), /In 1788 campaigners against the slave trade published/);
  assert.match(text('atlantic-world', 'brookes'), /454 people/);
  assert.match(text('atlantic-world', 'resistance'), /fell to a colonial army in 1694/);
  assert.match(text('atlantic-world', 'resistance'), /20 November 1695/);
  assert.match(text('atlantic-world', 'abolition'), /1807/);
  assert.match(text('atlantic-world', 'abolition'), /1888/);
});

/* ====================================================================== added in review */

test('tone: the whole Atlantic lesson, and the steps on epidemics, conquest and forced labour, are marked sober', () => {
  for (const step of lessons['atlantic-world'].steps) {
    assert.equal(step.tone, 'sober', `atlantic-world/${step.id} is sober`);
    assert.equal(resolveStep(step, makeRng(3), step.id).tone, 'sober', `atlantic-world/${step.id} stays sober once resolved (review cards too)`);
  }
  assert.equal(lessons['atlantic-world'].tone, 'sober', 'the lesson ends without confetti');
  for (const id of ['disease', 'teach-conquest', 'conquest', 'silver']) assert.equal(raw('columbian-exchange', id).tone, 'sober', `columbian-exchange/${id} is sober`);
  // and nothing else in the course is: the tone is kept for atrocity, not spread thin
  for (const id of LESSON_IDS.filter((l) => l !== 'atlantic-world')) {
    const sober = lessons[id].steps.filter((s) => s.tone === 'sober').map((s) => s.id);
    assert.deepEqual(sober, id === 'columbian-exchange' ? ['disease', 'teach-conquest', 'conquest', 'silver'] : [], `${id}: sober steps`);
  }
});

test('the racist claim about "nature" is never offered in the site\'s own voice', () => {
  const why = one('atlantic-world', 'why');
  const claim = why.options.find((o) => /fitted by nature/.test(o.text));
  assert.ok(claim && !claim.correct, 'it is a wrong option');
  assert.match(claim.text, /as slave-owners claimed/, 'and it is attributed to those who made it');
  assert.match(claim.why, /it is false/);
  assert.equal(why.options.filter((o) => o.correct).length, 4);
});

test('generated sentences read as English: articles, capitals and "was …" clauses', () => {
  for (const s of variants('print-and-reform', 'print-towns', 120)) {
    assert.doesNotMatch(s.explain, /was (beside|where it)/, 'no "London was beside which …"');
    assert.match(s.explain, /, was (the|where) /);
  }
  for (const s of variants('new-science', 'science-home', 60)) {
    for (const code of ['GB', 'NL', 'DE', 'PL']) {
      const fb = s.check({ picked: code, name: countryName(code) });
      if (fb !== true) assert.doesNotMatch(fb, /That is (United Kingdom|Netherlands)/, 'the United Kingdom and the Netherlands take an article');
    }
    assert.doesNotMatch(s.explain, /today's (United Kingdom|Netherlands)|in (United Kingdom|Netherlands)/);
  }
  for (const s of variants('columbian-exchange', 'homelands', 120)) {
    assert.doesNotMatch(s.text, /asian rice/, '"Asian" keeps its capital');
    for (const m of s.widget.markers) { const fb = s.check({ picked: m.id }); if (fb !== true) assert.doesNotMatch(fb, /asian rice|homeland of potato\b|in Central America/); }
  }
  for (const s of variants('voyages', 'port-pick', 120)) {
    assert.doesNotMatch(bare(s.text), /Tap Cape of Good Hope/);
    assert.doesNotMatch(s.explain, /\. Cape of Good Hope was/);
    assert.doesNotMatch(s.text, /Four ports/, 'the Cape is not a port');
  }
  for (const s of variants('columbian-exchange', 'kitchen', 120)) assert.doesNotMatch(s.text, /fourth (grows|lives) only/, '"is found" suits plants and animals alike');
});

test('claims corrected in review stay corrected', () => {
  const text = (lesson, id) => bare(visible(one(lesson, id)).join(' '));
  assert.doesNotMatch(text('voyages', 'cantino'), /oldest surviving one/, 'Juan de la Cosa\'s chart of about 1500 may show the line too');
  assert.doesNotMatch(text('gunpowder-empires', 'overview'), /traders reached the Pacific/, 'Moskvitin\'s party of 1639 were Cossacks');
  for (const id of ['teach-china', 'china', 'teach-states']) assert.doesNotMatch(text('gunpowder-empires', id), /founded the Qing|outline of China today/, 'the Qing was proclaimed in 1636, and ruled Mongolia too');
  assert.doesNotMatch(text('print-and-reform', 'north-south'), /left each ruler to settle the religion/, 'that was Augsburg, 1555');
  assert.doesNotMatch(text('new-science', 'galileo'), /four nights/, 'the page shows four drawings from three nights');
  assert.doesNotMatch(text('atlantic-world', 'abolition'), /first law against the trade|300,000 British families/, 'Denmark legislated first (1792); Clarkson counted persons');
  assert.match(text('atlantic-world', 'where-from'), /around and south of the mouth of the River Congo/, 'Loango and Cabinda lie north of the river');
  for (const s of variants('atlantic-world', 'where-most', 40)) assert.doesNotMatch(s.text, /landed in the Americas/, '10.7 million includes about 165,000 landed in Europe and Africa');
  // empire-home: Russia and Ming China about 1600 were smaller, not larger, than the modern countries
  for (const s of variants('gunpowder-empires', 'empire-home', 80)) assert.doesNotMatch(s.explain, /mostly larger/);
});

/* ====================================================================== teach before you ask */

// Teach before you ask (docs/AUTHORING.md). The shape is checked for every lesson; the substance (that each
// graded step asks only for what a screen above it has shown) was checked by reading every lesson with
// tools/outline.mjs --pool, and the pins below hold the places where a later edit could most easily undo it.
const TEACHING_STEPS = {
  voyages: ['teach-toolkit', 'teach-winds', 'teach-columbus', 'teach-voyages'],
  'columbian-exchange': ['teach-two-worlds', 'teach-homelands', 'teach-conquest', 'teach-new-homes'],
  'gunpowder-empires': ['teach-ottoman', 'teach-china', 'teach-capitals', 'teach-states'],
  'print-and-reform': ['teach-type', 'teach-effects', 'teach-renaissance'],
  'new-science': ['teach-two-systems', 'teach-trial', 'teach-enlightenment', 'teach-science-map'],
  'atlantic-world': ['teach-why', 'teach-culture'],
};
const indexOf = (lesson, id) => { const i = lessons[lesson].steps.findIndex((s) => s.id === id); assert.ok(i >= 0, `${lesson}/${id} exists`); return i; };
/** What a step shows before it is answered: its title, text and figures (not its explanation, options or feedback). */
const shownBy = (lesson, id) => { const s = one(lesson, id); return bare(visible({ title: s.title, text: s.text, figures: s.figures, widget: s.type === 'info' ? null : s.widget }).join(' ')); };
/** Everything a learner has read by the time they reach a step: prompts, figures and the explanations of the steps above. */
const metAbove = (lesson, id) => lessons[lesson].steps.slice(0, indexOf(lesson, id)).map((s) => bare(visible(one(lesson, s.id)).join(' '))).join(' ');
/** What the teaching screens above a step show. */
const taughtAbove = (lesson, id) => lessons[lesson].steps.slice(0, indexOf(lesson, id)).filter((s) => s.type === 'info').map((s) => shownBy(lesson, s.id)).join(' ');
/** Labels of every marker on the maps of the teaching screens above a step. */
const markedAbove = (lesson, id) => lessons[lesson].steps.slice(0, indexOf(lesson, id)).filter((s) => s.type === 'info')
  .flatMap((s) => specsOf(one(lesson, s.id))).filter((spec) => spec.type === 'world-map').flatMap((spec) => (spec.markers || []).map((m) => m.label || ''));

test('teach before you ask: the shape of every lesson', () => {
  assert.deepEqual(Object.keys(TEACHING_STEPS), LESSON_IDS);
  for (const [id, lesson] of Object.entries(lessons)) {
    const role = (step) => { const s = resolveStep(step, makeRng(1), step.id); return s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded === false ? 'explore' : 'graded'; };
    const roles = lesson.steps.map(role);
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    const firstGraded = roles.indexOf('graded');
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: a teaching screen or an exploration comes before the first graded step`);
    const teach = roles.filter((r) => r === 'teach').length;
    assert.ok(teach >= 3 && teach <= 6, `${id}: ${teach} teaching screens (three to six)`);
    assert.ok(roles.filter((r) => r === 'predict').length <= 2, `${id}: no more than two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.notEqual(roles.at(-1), 'teach', `${id}: the lesson does not end on a teaching screen`);
    for (const stepId of TEACHING_STEPS[id]) {
      const s = one(id, stepId);
      assert.equal(s.type, 'info', `${id}/${stepId} is a teaching screen`);
      assert.ok(flat(s.text).length > 120, `${id}/${stepId} has something to say`);
    }
    // a review step never became a prediction
    for (const step of lesson.steps) if (step.review) assert.notEqual(step.mode, 'predict', `${id}/${step.id}`);
  }
});

test('teach before you ask: each new screen comes before the step it serves, and says what that step needs', () => {
  const before = (lesson, a, b) => assert.ok(indexOf(lesson, a) < indexOf(lesson, b), `${lesson}: ${a} comes before ${b}`);
  const shows = (lesson, id, re) => assert.match(shownBy(lesson, id), re, `${lesson}/${id}`);
  const has = (lesson, id, words) => { const t = shownBy(lesson, id).toLowerCase(); for (const w of words) assert.ok(t.includes(bare(w).toLowerCase()), `${lesson}/${id} shows "${w}"`); };
  const fillAnswers = (lesson, id) => [...raw(lesson, id).template.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].split('|').find((o) => o.startsWith('*')).slice(1));

  // lesson 1
  before('voyages', 'zheng-he', 'giraffe'); shows('voyages', 'giraffe', /lives wild only in Africa/);
  before('voyages', 'teach-toolkit', 'tools'); has('voyages', 'teach-toolkit', fillAnswers('voyages', 'tools'));
  assert.equal(one('voyages', 'teach-toolkit').figures[0].type, 'photo');
  before('voyages', 'volta', 'teach-winds'); before('voyages', 'teach-winds', 'da-gama'); shows('voyages', 'teach-winds', /volta do mar.*trade winds.*north-east.*westerlies/);
  before('voyages', 'spice', 'why-portugal'); before('voyages', 'columbus', 'why-portugal');
  shows('voyages', 'columbus', /king of Portugal had already turned him down.*Earth is a sphere.*4,400 km/); shows('voyages', 'magellan', /Portuguese captain sailing for Spain/);
  before('voyages', 'teach-columbus', 'cantino'); shows('voyages', 'teach-columbus', /Bahamas.*Canary Islands.*trade winds.*westerlies.*Azores/);
  assert.deepEqual(one('voyages', 'teach-columbus').figures[0].lines[0].points, H.VOYAGES.columbus.points);
  before('voyages', 'teach-voyages', 'whose-route'); before('voyages', 'teach-voyages', 'port-pick');
  const voyagers = new Set(variants('voyages', 'whose-route', 60).flatMap((s) => s.options.map((o) => o.text)));
  assert.equal(voyagers.size, 4);
  for (const option of voyagers) { const [who, from] = option.split(', sailing from '); has('voyages', 'teach-voyages', [who, from]); }
  const allRoutes = one('voyages', 'teach-voyages').figures[0];
  for (const id of ['zhengHe', 'columbus', 'daGama', 'magellan']) {
    assert.ok(allRoutes.lines.some((l) => l.points === H.VOYAGES[id].points || JSON.stringify(l.points) === JSON.stringify(H.VOYAGES[id].points)), `teach-voyages draws the route of ${id}`);
    // and each voyage also has a map of its own earlier in the lesson
    const own = lessons.voyages.steps.slice(0, indexOf('voyages', 'teach-voyages')).flatMap((s) => specsOf(one('voyages', s.id))).filter((spec) => spec.type === 'world-map');
    assert.ok(own.some((spec) => (spec.lines || []).some((l) => JSON.stringify(l.points) === JSON.stringify(H.VOYAGES[id].points))), `${id} is drawn on a map of its own`);
  }
  const ports = new Set(variants('voyages', 'port-pick', 120).flatMap((s) => s.widget.markers.map((m) => m.label)));
  assert.equal(ports.size, 7);
  for (const port of ports) { assert.ok(allRoutes.markers.some((m) => m.label === port), `teach-voyages marks ${port}`); has('voyages', 'teach-voyages', [port]); }

  // lesson 2
  before('columbian-exchange', 'teach-two-worlds', 'sort'); shows('columbian-exchange', 'teach-two-worlds', /Old World.*New World.*pork, beef or cheese/);
  has('columbian-exchange', 'teach-two-worlds', Object.values(H.GOODS).map((g) => g.name));
  has('columbian-exchange', 'teach-two-worlds', one('columbian-exchange', 'sort').items.map((it) => it.text));
  // the newcomer in every dish of the generated "dish" step is something this screen puts on the far side of the ocean
  const twoWorlds = shownBy('columbian-exchange', 'teach-two-worlds').toLowerCase();
  for (const d of H.DISHES) assert.ok(twoWorlds.includes(d.late.replace('paprika (ground chilli)', 'chilli')), `teach-two-worlds covers ${d.late} (${d.dish})`);
  before('columbian-exchange', 'teach-homelands', 'homelands');
  has('columbian-exchange', 'teach-homelands', [...H.CROP_HOMES.map((c) => c.crop), ...Object.values(H.HOMELANDS).map((h) => h.name)]);
  assert.deepEqual(one('columbian-exchange', 'teach-homelands').figures[0].markers.map((m) => m.at), Object.values(H.HOMELANDS).map((h) => h.at));
  before('columbian-exchange', 'name', 'disease'); shows('columbian-exchange', 'disease', /herd animals of Africa, Asia and Europe.*never known these diseases/);
  before('columbian-exchange', 'malintzin', 'teach-conquest'); before('columbian-exchange', 'teach-conquest', 'conquest');
  shows('columbian-exchange', 'teach-conquest', /alliance.*fought hard.*smallpox.*In 1521.*steel weapons, horses and guns.*tens of thousands of Tlaxcalan and other local allies/);
  before('columbian-exchange', 'teach-new-homes', 'spread');
  has('columbian-exchange', 'teach-new-homes', ['Ireland and northern Europe', 'West and Central Africa', 'India, Thailand and Sichuan', 'Great Plains of North America', 'Brazil and the Caribbean']);
  for (const [left] of one('columbian-exchange', 'spread').pairs) has('columbian-exchange', 'teach-new-homes', [left.split(',')[0].slice(0, 5)]);      // "Potat(oes)", "Chill(ies)", "Horse(s)" …
  // the order step: every date is met before it
  for (const y of [1521, 1532, 1545, 1571]) assert.ok(metAbove('columbian-exchange', 'order').includes(String(y)), `${y} is met before the order step`);

  // lesson 3
  before('gunpowder-empires', 'teach-ottoman', 'ottoman'); shows('gunpowder-empires', 'teach-ottoman', /Constantinople.*Europe, Asia and Africa.*the Magnificent.*Algiers to Baghdad to Budapest/);
  shows('gunpowder-empires', 'safavid', /Shah Abbas.*Isfahan/); shows('gunpowder-empires', 'mughal', /scholars of Islam, Hinduism.*debated.*Rajput/);
  shows('gunpowder-empires', 'buildings', /Taj Mahal.*tomb for his wife.*white marble/); shows('gunpowder-empires', 'japan', /shoguns ruled from Edo/);
  before('gunpowder-empires', 'teach-china', 'china'); has('gunpowder-empires', 'teach-china', fillAnswers('gunpowder-empires', 'china'));
  before('gunpowder-empires', 'mughal', 'size'); shows('gunpowder-empires', 'mughal', /100 million people/);
  before('gunpowder-empires', 'teach-capitals', 'empire-home');
  for (const [capital, code] of Object.entries(CAPITALS)) has('gunpowder-empires', 'teach-capitals', [capital, countryName(code)]);
  assert.deepEqual(one('gunpowder-empires', 'teach-capitals').figures[0].regions.map((g) => g.ids[0]).sort(), Object.values(CAPITALS).sort());
  before('gunpowder-empires', 'teach-states', 'which-empire');
  const states = shownBy('gunpowder-empires', 'teach-states');
  for (const [clue, state] of EMPIRE_CLUES) {
    const line = states.split(' - ').find((l) => l.includes(state));
    assert.ok(line && clue.test(line), `teach-states: the line for ${state} mentions ${clue}`);
  }

  // lesson 4
  before('print-and-reform', 'teach-type', 'not-first'); shows('print-and-reform', 'teach-type', /Block printing.*whole page.*Movable type.*stamp for every sign.*Bi Sheng.*baked clay/);
  shows('print-and-reform', 'mainz', /half-way along the River Rhine/); shows('print-and-reform', 'spread', /European end of the spice route/);
  assert.ok(one('voyages', 'spice').figures[0].markers.some((m) => m.label === 'Venice'), 'the spice-route map of lesson 1 marks Venice');
  before('print-and-reform', 'teach-effects', 'effects');
  shows('print-and-reform', 'teach-effects', /languages people spoke.*how a language was written.*Identical copies.*Rumours.*most Europeans still could not read/);
  before('print-and-reform', 'teach-renaissance', 'renaissance'); shows('print-and-reform', 'teach-renaissance', /Renaissance.*Florence.*humanists/);
  before('print-and-reform', 'split', 'north-south'); before('print-and-reform', 'split', 'order'); shows('print-and-reform', 'split', /Council of Trent \(1545 to 1563\)/);
  for (const y of [1377, 1455, 1517, 1545, 1648]) assert.ok(metAbove('print-and-reform', 'order').includes(String(y)), `${y} is met before the order step`);
  for (const town of ['Mainz', 'Venice', 'Wittenberg', 'Rome', 'Florence', 'Geneva', 'Paris', 'London']) {
    assert.ok(markedAbove('print-and-reform', 'print-towns').some((label) => label.startsWith(town)), `${town} is marked on a teaching map before print-towns`);
  }

  // lesson 5
  before('new-science', 'teach-two-systems', 'diagram'); shows('new-science', 'teach-two-systems', /Earth-centred.*Alexandria.*stands still in the middle.*Sun in the middle.*third one out.*perfect circles/);
  assert.equal(one('new-science', 'teach-two-systems').figures[0].type, 'svg');
  shows('new-science', 'kepler', /complete reform of astronomy/);
  before('new-science', 'teach-trial', 'trial'); shows('new-science', 'teach-trial', /In 1633.*declare that the Earth does not move.*house arrest.*not burned at the stake.*Bruno.*1992/);
  before('new-science', 'teach-enlightenment', 'enlightenment'); has('new-science', 'teach-enlightenment', one('new-science', 'enlightenment').pairs.map((p) => p[0]));
  shows('new-science', 'teach-enlightenment', /consent.*separate branches.*toleration.*Encyclopédie.*Dare to know/);
  before('new-science', 'teach-science-map', 'science-home');
  for (const [who, code] of Object.entries(SCIENCE_COUNTRY)) has('new-science', 'teach-science-map', [who, countryName(code)]);
  for (const y of [1543, 1610, 1687]) assert.ok(metAbove('new-science', 'timeline').includes(String(y)), `${y} is met before the timeline`);

  // the two "who?" steps: every person in the pool has been named, with the deed, on a step above
  for (const [lesson, id, group] of [['print-and-reform', 'who-print', 'print'], ['new-science', 'who-science', 'science']]) {
    const met = metAbove(lesson, id);
    for (const p of Object.values(H.PEOPLE).filter((q) => q.group === group)) {
      const surname = p.name.replace(/ of .*$/, '').split(' ').at(-1);
      assert.ok(met.includes(surname), `${lesson}: ${p.name} is met before ${id}`);
    }
  }
  // and the people who appear nowhere else are taught by their table entry, word for word
  for (const id of ['brunelleschi', 'leonardo', 'michelangelo', 'raphael']) has('print-and-reform', 'teach-renaissance', [H.PEOPLE[id].name, H.PEOPLE[id].did]);
  has('print-and-reform', 'teach-effects', ['William Caxton', H.PEOPLE.caxton.did, 'William Tyndale', 'Erasmus of Rotterdam', 'Greek New Testament']);
  for (const id of ['locke', 'montesquieu', 'voltaire', 'diderot', 'kant']) has('new-science', 'teach-enlightenment', [H.PEOPLE[id].name, H.PEOPLE[id].did]);
  has('new-science', 'teach-two-systems', [H.PEOPLE.ptolemy.did]);

  // lesson 6
  before('atlantic-world', 'sugar', 'teach-why'); before('atlantic-world', 'teach-why', 'why');
  shows('atlantic-world', 'teach-why', /Native peoples.*trade in captives already existed.*no home to flee to.*would not enslave other Europeans/);
  shows('atlantic-world', 'teach-why', /Slave-owners gave another reason.*It was an excuse, and it is false/);
  before('atlantic-world', 'numbers', 'where-most');
  assert.deepEqual(one('atlantic-world', 'numbers').figures[0].data.map((d) => d.label.replace('\n', ' ')), H.DESTINATIONS.map((d) => (d.short || d.name).replace('\n', ' ')));
  before('atlantic-world', 'coast', 'where-from');
  before('atlantic-world', 'teach-culture', 'culture'); shows('atlantic-world', 'teach-culture', /banjo.*samba, rumba, blues and jazz.*"Okra", "yam" and "gumbo".*Vodou in Haiti, Candomblé in Brazil/);
  before('atlantic-world', 'abolition', 'abolition-order');
  assert.deepEqual(one('atlantic-world', 'abolition').widget.events.map((e) => e.id), H.ABOLITION_EVENTS);
});
