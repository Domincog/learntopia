// Independent checks of "Crossroads: 500 to 1500".
//
// The course keeps its facts in content/courses/world-crossroads/helpers.js (places, dated events,
// small tables of people and sites). This file holds its OWN copy of the key facts, typed in
// separately from the author's verified notes, and checks the helper tables against it (double
// entry). Every generated question is then re-solved, for a few hundred seeds, from the words and
// the figure the learner actually sees, using only the tables in this file. Interactive steps are
// fed states worked out here: the solution, and plausible wrong answers.
//
//   node --test tests/world-crossroads-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import course from '../content/courses/world-crossroads/course.js';
import * as H from '../content/courses/world-crossroads/helpers.js';
import { creditLine } from '../src/widgets/photo.js';
import { countryName, countryAt, countryInfo, distanceKm, destination, greatCircle, pointInPolygon, loadDetail, VIEWS } from '../src/widgets/world-map.js';

const COURSE = 'world-crossroads';
const SEEDS = 240;
await loadDetail();          // the 1:50 million coastlines, for checking that sea routes stay at sea

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/${COURSE}/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, COURSE, meta.id);
  }
}
const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(4409 + k * 7919), id));
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const plain = (s) => flat(s).replace(/\*/g, '');

/** Every string a learner can see in a resolved step (figure markup and file addresses excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['content', 'type', 'id', 'viewBox', 'color', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'shape', 'mode', 'curve', 'animate', 'labelPos', 'style', 'size']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}
/** Every widget spec of a given type in a resolved step: figures, the interact widget, option figures. */
function specs(step, type) {
  const found = [];
  const add = (spec) => { if (spec && typeof spec === 'object' && spec.type === type) found.push(spec); };
  for (const fig of step.figures || []) add(fig);
  add(step.widget);
  for (const o of step.options || []) { if (Array.isArray(o.figure)) o.figure.forEach(add); else add(o.figure); }
  return found;
}

/* ====================================================================== the test's own facts */

// Dated events (CE). `c` marks dates that are approximate or traditional.
const DATES = {
  hagiasophia: 537, tang: 618, hijra: 622, iberia: 711, abbasids: 750, baghdad: 762, lindisfarne: 793, charlemagne: 800,
  algebra: 820, diamondsutra: 868, song: 960, vinland: 1000, genji: 1010, movabletype: 1040, schism: 1054, crusade: 1095,
  cahokia: 1100, fibonacci: 1202, chinggis: 1206, sundiata: 1235, baghdadfalls: 1258, songfalls: 1279, musa: 1324,
  tenochtitlan: 1325, blackdeath: 1347, ming: 1368, inca: 1438, hangul: 1443, constantinople: 1453, columbus: 1492,
};
const CIRCA = new Set(['algebra', 'vinland', 'genji', 'movabletype', 'cahokia', 'sundiata', 'tenochtitlan', 'inca']);
// A word or two that must appear in the event's own line, so that an id cannot drift to another event.
const EVENT_WORDS = {
  hagiasophia: /Hagia Sophia/, tang: /Tang/, hijra: /Hijra/, iberia: /Spain/, abbasids: /Abbasid/, baghdad: /Baghdad is founded/, lindisfarne: /Lindisfarne/,
  charlemagne: /Charlemagne/, algebra: /algebra/, diamondsutra: /Diamond Sutra/, song: /Song dynasty begins/, vinland: /Newfoundland/, genji: /Genji/,
  movabletype: /movable type/, schism: /Rome and Constantinople/, crusade: /First Crusade/, cahokia: /Cahokia/, fibonacci: /Fibonacci/, chinggis: /Chinggis/,
  sundiata: /Sundiata/, baghdadfalls: /destroys Baghdad/, songfalls: /Kublai/, musa: /Mansa Musa/, tenochtitlan: /Tenochtitlan/, blackdeath: /Black Death/,
  ming: /Ming/, inca: /Inca/, hangul: /hangul/, constantinople: /Constantinople falls/, columbus: /Columbus/,
};

// Places: [longitude, latitude, modern country], to the nearest tenth of a degree or so.
const SITES = {
  'Chang\'an': [108.9, 34.3, 'CN'], Dunhuang: [94.7, 40.1, 'CN'], Kashgar: [76.0, 39.5, 'CN'], Samarkand: [67.0, 39.7, 'UZ'], Bukhara: [64.4, 39.8, 'UZ'],
  Merv: [62.2, 37.7, 'TM'], Baghdad: [44.4, 33.3, 'IQ'], Constantinople: [29.0, 41.0, 'TR'], Guangzhou: [113.3, 23.1, 'CN'], Malacca: [102.2, 2.2, 'MY'],
  Calicut: [75.8, 11.3, 'IN'], Hormuz: [56.5, 27.1, 'IR'], Aden: [45.0, 12.8, 'YE'], Kilwa: [39.5, -9.0, 'TZ'], Cairo: [31.2, 30.0, 'EG'],
  Venice: [12.3, 45.4, 'IT'], Mecca: [39.8, 21.4, 'SA'], Medina: [39.6, 24.5, 'SA'], Damascus: [36.3, 33.5, 'SY'], 'Córdoba': [-4.8, 37.9, 'ES'],
  Timbuktu: [-3.0, 16.8, 'ML'], Gao: [0.0, 16.3, 'ML'], 'Koumbi Saleh': [-8.0, 15.8, 'MR'], Taghaza: [-5.0, 23.6, 'ML'], 'Great Zimbabwe': [30.9, -20.3, 'ZW'],
  Lalibela: [39.0, 12.0, 'ET'], Ife: [4.6, 7.5, 'NG'], Kaifeng: [114.3, 34.8, 'CN'], Hangzhou: [120.2, 30.3, 'CN'], Beijing: [116.4, 39.9, 'CN'],
  Kyoto: [135.8, 35.0, 'JP'], Kaesong: [126.6, 38.0, 'KP'], 'Thang Long': [105.8, 21.0, 'VN'], Rome: [12.5, 41.9, 'IT'], Aachen: [6.1, 50.8, 'DE'],
  Paris: [2.3, 48.9, 'FR'], Kyiv: [30.5, 50.5, 'UA'], 'L\'Anse aux Meadows': [-55.5, 51.6, 'CA'], Karakorum: [102.8, 47.2, 'MN'], Tangier: [-5.8, 35.8, 'MA'],
  Delhi: [77.2, 28.6, 'IN'], Tenochtitlan: [-99.1, 19.4, 'MX'], Tikal: [-89.6, 17.2, 'GT'], Cusco: [-72.0, -13.5, 'PE'], Cahokia: [-90.1, 38.7, 'US'],
  'Mesa Verde': [-108.5, 37.2, 'US'], Dublin: [-6.3, 53.3, 'IE'], Iceland: [-21.9, 64.1, 'IS'], 'Greenland settlements': [-45.5, 61.0, 'GL'],
};
const site = (name) => { assert.ok(SITES[name], `the test knows where ${name} is`); return SITES[name]; };
const placeByName = (name) => Object.values(H.PLACES).find((p) => p.name === name);

/** Is the point in the country, or within `km` of it? (Coastal and border towns sit on simplified outlines.) */
function inOrNear(point, code, km = 110) {
  if (countryAt(point, 'low', 25) === code) return true;
  for (const r of [km / 2, km]) for (let b = 0; b < 360; b += 30) if (countryAt(destination(point, r, b), 'low', 25) === code) return true;
  return false;
}

/* ====================================================================== shape of the course */

const ORDER = ['silk-roads', 'islamic-world', 'african-kingdoms', 'song-china', 'medieval-europe', 'mongols', 'americas'];
const GENERATED = [
  'silk-roads/find-city', 'silk-roads/port-or-oasis',
  'islamic-world/scholars', 'islamic-world/when',
  'african-kingdoms/find-site', 'african-kingdoms/match-sites',
  'song-china/find-city', 'song-china/which-first',
  'medieval-europe/find-city', 'medieval-europe/when',
  'mongols/find-city', 'mongols/who',
  'americas/read-number', 'americas/find-site', 'americas/which-people',
];
const covered = new Set();          // generated steps this file has re-solved
const cover = (lesson, id) => { covered.add(`${lesson}/${id}`); return variants(lesson, id); };

test('course shape: seven lessons, each woven from map, time, hands-on and review steps', () => {
  assert.equal(course.id, COURSE);
  assert.deepEqual(Object.keys(lessons), ORDER);
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((s) => resolveStep(s, makeRng(7), s.id));
    assert.ok(steps.length >= 11 && steps.length <= 20, `${id}: ${steps.length} steps`);          // 12 to 18 as a rule, 20 at the very most
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) assert.ok(resolveStep(s, makeRng(3), s.id).explain, `${id}/${s.id}: a review step explains its answer`);
    assert.ok(lesson.steps.filter((s) => typeof s.gen === 'function').length >= 2, `${id}: at least two generated steps`);
    assert.ok(steps.filter((s) => s.type === 'choice').length <= 5, `${id}: no more than five choice steps`);
    const handsOn = steps.filter((s) => s.type === 'interact' || s.figures.some((f) => (f.type === 'world-map' && !f.static) || (f.type === 'timeline' && f.mode === 'explore')));
    assert.ok(handsOn.length >= 3, `${id}: ${handsOn.length} hands-on steps`);
    const mapSteps = steps.filter((s) => specs(s, 'world-map').length);
    assert.ok(mapSteps.length >= 2, `${id}: ${mapSteps.length} steps with a map`);
    assert.ok(steps.some((s) => s.type === 'interact' && s.graded && s.widget.type === 'world-map'), `${id}: a graded map step`);
    assert.ok(steps.some((s) => s.type === 'order' || specs(s, 'timeline').length), `${id}: a timeline or an order step`);
    assert.equal(steps[0].mode, 'predict', `${id}: opens with a prediction`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: next`);
    for (const s of steps) if (s.graded) assert.ok(s.explain, `${id}/${s.id}: every graded step has an explanation`);
  }
});

test('the list of generated steps in this file is complete', () => {
  const actual = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const s of lesson.steps) if (typeof s.gen === 'function') actual.push(`${id}/${s.id}`);
  assert.deepEqual(actual.sort(), [...GENERATED].sort(), 'a generated step was added or removed: cover it in this file');
});

test('no learner-visible text contains undefined, NaN or an object', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        for (const text of visible(s)) assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), `${id}/${step.id} seed ${k}: ${text}`);
        if (!step.gen) break;
      }
    }
    for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
  }
});

test('every choice has exactly one correct option and no duplicates; every multi has a right and a wrong option', () => {
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
  assert.ok(seen > 900);
});

test('review steps stand alone', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps.filter((s) => s.review)) {
      for (const s of [resolveStep(step, makeRng(11), step.id), resolveStep(step, makeRng(12), step.id)]) {
        assert.ok(!/\b(as (we|you) (just )?saw|(map|figure|picture|step|screen) above|the last screen|the previous|earlier in this lesson|you just)\b/i.test(flat(s.text)), `${id}/${step.id} leans on its lesson: ${flat(s.text)}`);
        assert.ok(s.text.length > 20, `${id}/${step.id} has a question`);
      }
    }
  }
});

/* ====================================================================== double entry: events and places */

test('the events table agrees with the dates in this file', () => {
  assert.deepEqual(Object.keys(H.EVENTS).sort(), Object.keys(DATES).sort());
  for (const [id, e] of Object.entries(H.EVENTS)) {
    assert.equal(e.year, DATES[id], `${id}: year`);
    assert.equal(!!e.circa, CIRCA.has(id), `${id}: "about" flag`);
    assert.match(e.text, EVENT_WORDS[id], `${id}: its line names the event`);
    assert.ok(e.short && e.short.length <= 30, `${id}: a short label for timelines`);
    assert.equal(H.when(id), `${CIRCA.has(id) ? 'about ' : ''}${DATES[id]}`);
  }
});

test('every place is a valid [longitude, latitude], lies in the country it claims, and agrees with this file', () => {
  for (const [id, p] of Object.entries(H.PLACES)) {
    const [lon, lat] = p.at;
    assert.ok(Number.isFinite(lon) && Number.isFinite(lat) && Math.abs(lon) <= 180 && Math.abs(lat) <= 90, `${id}: coordinates`);
    if (p.country) {
      assert.ok(countryName(p.country), `${id}: ${p.country} is a country the map knows`);
      assert.ok(inOrNear(p.at, p.country), `${id}: [${p.at}] is not in or near ${p.country} (is the pair swapped?)`);
      // a swapped pair would land somewhere else entirely
      if (Math.abs(lon - lat) > 15) assert.ok(!inOrNear([lat, lon], p.country, 60), `${id}: the swapped pair also lands in ${p.country}?`);
    }
    if ((p.clue == null) !== (p.fact == null)) assert.fail(`${id}: a place used in "find it" questions needs both a clue and a fact`);
    if (p.clue) assert.ok(!p.clue.includes(p.name) && !/[.?!]$/.test(p.clue), `${id}: the clue must not name the place or end in a full stop`);
  }
  for (const [name, [lon, lat, code]] of Object.entries(SITES)) {
    const p = placeByName(name);
    assert.ok(p, `helpers.js has a place called ${name}`);
    assert.ok(distanceKm(p.at, [lon, lat]) <= 40, `${name}: helpers has [${p.at}], this file [${lon}, ${lat}]`);
    assert.equal(p.country, code, `${name}: country`);
  }
});

test('every country code used in a map of the course is one the map knows', () => {
  let codes = 0;
  const check = (v, where) => {
    if (typeof v === 'string' && /^[A-Z]{2}$/.test(v)) { assert.ok(countryName(v), `${where}: unknown country code ${v}`); codes++; }
    else if (Array.isArray(v)) v.forEach((x) => check(x, where));
  };
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(2), step.id);
      for (const map of specs(s, 'world-map')) {
        for (const key of ['answer', 'pickable', 'labels']) check(map[key], `${id}/${step.id}`);
        for (const g of map.regions || []) check(g.ids, `${id}/${step.id}`);
        if (typeof map.view === 'string') assert.ok(map.view in VIEWS || countryName(map.view), `${id}/${step.id}: view ${map.view}`);
        if (Array.isArray(map.view)) assert.ok(map.view.length === 4 && map.view[1] < map.view[3], `${id}/${step.id}: view box`);
        for (const m of map.markers || []) assert.ok(Array.isArray(m.at) && Math.abs(m.at[0]) <= 180 && Math.abs(m.at[1]) <= 90, `${id}/${step.id}: marker ${m.label}`);
        for (const l of map.lines || []) for (const pt of l.points) assert.ok(Array.isArray(pt) && pt.length === 2 && Math.abs(pt[0]) <= 180 && Math.abs(pt[1]) <= 90, `${id}/${step.id}: line point ${pt}`);
      }
      if (s.solution && typeof s.solution.picked === 'string') check(s.solution.picked, `${id}/${step.id}`);
    }
  }
  assert.ok(codes >= 3);
});

/* ====================================================================== routes and outlines */

/** Points every ~60 km along a route, leaving out `skipKm` at each end (ports and river mouths). */
function along(points, skipKm = 150) {
  const out = [];
  let total = 0;
  const legs = points.slice(1).map((p, i) => { const d = distanceKm(points[i], p); total += d; return d; });
  let done = 0;
  points.slice(1).forEach((p, i) => {
    const pts = greatCircle(points[i], p, 0.5);
    pts.forEach((q, k) => {
      const at = done + (legs[i] * k) / Math.max(1, pts.length - 1);
      if (at >= skipKm && at <= total - skipKm) out.push(q);
    });
    done += legs[i];
  });
  return out;
}

test('the sea routes stay at sea and the caravan roads stay on land', () => {
  const sea = { SEA_CHINA_INDIA: H.SEA_CHINA_INDIA, SEA_INDIA_GULF: H.SEA_INDIA_GULF, SEA_INDIA_ADEN: H.SEA_INDIA_ADEN, SEA_RED_SEA: H.SEA_RED_SEA, SEA_EAST_AFRICA: H.SEA_EAST_AFRICA, SEA_KILWA_SOFALA: H.SEA_KILWA_SOFALA };
  for (const [name, route] of Object.entries(sea)) {
    const pts = along(route);
    assert.ok(pts.length > 10, `${name}: sampled`);
    // Checked against the detailed (1:50 million) coastlines. Even those are simplified, and the routes thread
    // narrow straits (Malacca, Hormuz, the mouth of the Red Sea), so one sampled point in twenty may touch land.
    const onLand = pts.filter((p) => countryAt(p, 'high') !== null);
    assert.ok(onLand.length <= pts.length / 20, `${name}: ${onLand.length} of ${pts.length} sampled points are on land, e.g. [${onLand[0]}]`);
  }
  const land = { LAND_TRUNK_EAST: H.LAND_TRUNK_EAST, LAND_NORTH_BRANCH: H.LAND_NORTH_BRANCH, LAND_SOUTH_BRANCH: H.LAND_SOUTH_BRANCH, LAND_TRUNK_WEST: H.LAND_TRUNK_WEST, LAND_TO_INDIA: H.LAND_TO_INDIA };
  for (const [name, route] of Object.entries(land)) {
    const pts = along(route, 30);
    const atSea = pts.filter((p) => countryAt(p, 'low', 25) === null);
    assert.equal(atSea.length, 0, `${name}: crosses water at [${atSea[0]}]`);
  }
  // the two desert roads really pass on opposite sides of the Taklamakan, and both avoid its middle
  const middle = [83, 39];
  assert.ok(pointInPolygon(middle, H.TAKLAMAKAN));
  assert.ok(H.LAND_NORTH_BRANCH.slice(1, -1).every((p) => p[1] > middle[1] + 1.5) && H.LAND_SOUTH_BRANCH.slice(1, -1).every((p) => p[1] < middle[1] + 0.5));
  for (const p of [...H.LAND_NORTH_BRANCH, ...H.LAND_SOUTH_BRANCH].filter((q) => q[0] > 78 && q[0] < 88)) assert.ok(!pointInPolygon(p, H.TAKLAMAKAN) || distanceKm(p, middle) > 150, `road point [${p}] is in the middle of the desert`);
  // routes run the way the lessons say
  assert.deepEqual(H.LAND_TRUNK_EAST[0], H.PLACES.changan.at);
  assert.deepEqual(H.LAND_TRUNK_WEST[0], H.PLACES.kashgar.at);
  assert.deepEqual(H.SEA_CHINA_INDIA[0], H.PLACES.guangzhou.at);
  assert.deepEqual(H.SEA_EAST_AFRICA.at(-1), H.PLACES.kilwa.at);
});

test('the outlines of empires contain the cities the lessons put in them, and not the ones they leave out', () => {
  const inside = (name, outline) => pointInPolygon(site(name).slice(0, 2), outline);
  for (const name of ['Baghdad', 'Córdoba', 'Mecca', 'Medina', 'Damascus', 'Samarkand', 'Cairo']) assert.ok(inside(name, H.CALIPHATE_750), `${name} was under the caliphs in 750`);
  for (const name of ['Constantinople', 'Rome', 'Paris', 'Delhi', 'Kashgar', 'Timbuktu']) assert.ok(!inside(name, H.CALIPHATE_750), `${name} was not under the caliphs in 750`);
  assert.ok(inside('Constantinople', H.JUSTINIAN_565[0]) && inside('Cairo', H.JUSTINIAN_565[0]) && inside('Rome', H.JUSTINIAN_565[1]));
  for (const name of ['Paris', 'Baghdad', 'Mecca', 'Aachen']) assert.ok(!H.JUSTINIAN_565.some((o) => inside(name, o)), `${name} was outside Justinian's empire`);
  const khanates = { yuan: H.YUAN, horde: H.GOLDEN_HORDE, ilkhanate: H.ILKHANATE, chagatai: H.CHAGATAI };
  const home = { Karakorum: 'yuan', Beijing: 'yuan', Hangzhou: 'yuan', Guangzhou: 'yuan', Baghdad: 'ilkhanate', Samarkand: 'chagatai', Kashgar: 'chagatai' };
  for (const [name, want] of Object.entries(home)) for (const [k, outline] of Object.entries(khanates)) assert.equal(inside(name, outline), k === want, `${name} and the ${k} outline`);
  assert.ok(pointInPolygon(H.PLACES.sarai.at, H.GOLDEN_HORDE) && pointInPolygon(H.PLACES.tabriz.at, H.ILKHANATE));
  for (const name of ['Cairo', 'Kyoto', 'Delhi', 'Constantinople', 'Venice', 'Kaesong', 'Thang Long']) assert.ok(!Object.values(khanates).some((o) => inside(name, o)), `${name} was never inside a Mongol realm`);
  assert.ok(inside('Cusco', H.INCA_1525) && pointInPolygon(H.PLACES.quito.at, H.INCA_1525) && pointInPolygon(H.PLACES.santiago.at, H.INCA_1525));
  assert.ok(!inside('Tikal', H.INCA_1525) && !inside('Tenochtitlan', H.INCA_1525));
  // each outline is a ring of valid points
  for (const o of [H.CALIPHATE_750, ...H.JUSTINIAN_565, H.YUAN, H.GOLDEN_HORDE, H.ILKHANATE, H.CHAGATAI, H.INCA_1525, H.TAKLAMAKAN]) {
    assert.ok(o.length >= 4 && o.every((p) => p.length === 2 && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90));
  }
});

/* ====================================================================== generated: find it on the map */

// lesson/step: the width of the map in degrees of longitude (for the "can a finger tell them apart" check)
const FIND = {
  'silk-roads/find-city': { markers: 5 }, 'african-kingdoms/find-site': { markers: 5 }, 'song-china/find-city': { markers: 5 },
  'medieval-europe/find-city': { markers: 5 }, 'mongols/find-city': { markers: 5 }, 'americas/find-site': { markers: 4 },
};

for (const [key, want] of Object.entries(FIND)) {
  const [lesson, id] = key.split('/');
  test(`${key}: the marker to tap is the place that is named, wherever the markers fall`, () => {
    const targets = new Set();
    for (const s of cover(lesson, id)) {
      assert.equal(s.type, 'interact');
      const map = s.widget;
      assert.equal(map.mode, 'pickMarker');
      assert.equal(map.markerLabels, 'after', 'names are hidden until the step is answered');
      assert.equal(map.markers.length, want.markers);
      const named = /Find \*\*(.+?)\*\*/.exec(s.text);
      assert.ok(named, `the question names a place: ${s.text}`);
      const name = named[1];
      targets.add(name);
      const [lon, lat] = site(name);
      // the marker called for is where this file says the place is, and it is the solution
      const right = map.markers.filter((m) => distanceKm(m.at, [lon, lat]) <= 40);
      assert.equal(right.length, 1, `${name}: exactly one marker is at the place`);
      assert.equal(s.solution.picked, right[0].id);
      assert.equal(map.answer, right[0].id);
      assert.equal(right[0].label, name);
      assert.equal(s.check({ picked: right[0].id }), true);
      assert.equal(s.check({ picked: null }), false);
      // every other marker is a different place, far away, and choosing it is refused with its name
      const view = Array.isArray(map.view) ? map.view : VIEWS[map.view];
      const width = (view[2] - view[0] + 360) % 360;
      for (const m of map.markers) {
        if (m === right[0]) continue;
        const said = s.check({ picked: m.id });
        assert.equal(typeof said, 'string', `${m.label} is refused with a message`);
        assert.ok(said.includes(m.label), `the message names ${m.label}: ${said}`);
        const letter = String.fromCharCode(65 + map.markers.indexOf(m));
        assert.ok(said.startsWith(`Marker ${letter} `), `the message uses the letter the map shows: ${said}`);
        assert.ok(distanceKm(m.at, [lon, lat]) > 300, `${m.label} is too close to ${name} to be a fair wrong answer`);
        assert.ok(distanceKm(m.at, site(m.label).slice(0, 2)) <= 40, `${m.label} is drawn where it is`);
      }
      // markers are listed west to east (that is the order of the letters A, B, C …) and a finger can tell them apart
      const lons = map.markers.map((m) => m.at[0]);
      assert.deepEqual(lons, [...lons].sort((a, b) => a - b));
      for (const a of map.markers) for (const b of map.markers) {
        if (a === b) continue;
        const degrees = Math.hypot((a.at[0] - b.at[0]) * Math.cos(((a.at[1] + b.at[1]) / 2) * Math.PI / 180), a.at[1] - b.at[1]);
        assert.ok((degrees / width) * 360 >= 22, `${a.label} and ${b.label} are only ${Math.round((degrees / width) * 360)} px apart on a phone`);
      }
      // the clue describes the target and fits the country this file has for it
      assert.match(s.explain, new RegExp(`^Marker ${String.fromCharCode(65 + map.markers.indexOf(right[0]))}\\. `));
      assert.ok(plain(s.explain).includes(name) || /Chang'an/.test(s.explain), 'the explanation names the place');
      assert.ok(inOrNear(right[0].at, site(name)[2]));
    }
    assert.ok(targets.size >= 5, `${key}: only ${targets.size} different targets`);
  });
}

test('clues for "find it" questions fit the facts in this file', () => {
  // one or two words that must be in the clue (a kind of place, a neighbour), checked against this file's own knowledge
  const CLUES = {
    'Chang\'an': /northern China/, Dunhuang: /oasis.*Taklamakan/, Kashgar: /western end of the Taklamakan/, Samarkand: /Central Asia/, Baghdad: /Tigris/,
    Constantinople: /Black Sea.*Mediterranean/, Guangzhou: /southern port.*South China Sea/, Malacca: /strait.*Malay Peninsula.*Sumatra/, Calicut: /south-west coast of India/,
    Hormuz: /mouth of the Persian Gulf/, Aden: /south-western corner of Arabia/, Kilwa: /East Africa.*south of the equator/, Cairo: /Nile/, Venice: /Adriatic/,
    Mecca: /western Arabia/, 'Córdoba': /south of the Iberian Peninsula/, Timbuktu: /Niger.*Sahara/, Taghaza: /Sahara/, 'Great Zimbabwe': /southern Africa.*Zambezi.*Limpopo/,
    Lalibela: /highlands of the Horn of Africa/, Ife: /Gulf of Guinea/, Kaifeng: /Yellow River/, Hangzhou: /southern end of the Grand Canal/, Beijing: /northern end of the Grand Canal/,
    Kyoto: /Japan/, Kaesong: /Korean Peninsula/, 'Thang Long': /Vietnam.*south of China/, Rome: /Italian peninsula/, Aachen: /Rhine.*west of today's Germany/, Paris: /Seine.*north of France/,
    Kyiv: /Dnieper/, Karakorum: /steppe north of the Gobi/, Tangier: /Strait of Gibraltar/, Delhi: /northern India/, Tenochtitlan: /Mexico/, Tikal: /Yucatán/,
    Cusco: /Andes.*south of the equator/, Cahokia: /Mississippi/, 'Mesa Verde': /south-west/,
  };
  const hemisphere = { Kilwa: 'S', Cusco: 'S', 'Great Zimbabwe': 'S' };
  let n = 0;
  for (const p of Object.values(H.PLACES)) {
    if (!p.clue) continue;
    assert.ok(CLUES[p.name], `this file has a clue check for ${p.name}`);
    assert.match(p.clue, CLUES[p.name], `${p.name}: ${p.clue}`);
    assert.equal(p.at[1] < 0 ? 'S' : 'N', hemisphere[p.name] || 'N', `${p.name}: hemisphere`);
    n++;
  }
  assert.equal(n, Object.keys(CLUES).length);
  // spot checks of what the clues claim, from the coordinates in this file
  assert.ok(site('Kashgar')[0] < site('Dunhuang')[0] && site('Dunhuang')[0] < site('Chang\'an')[0], 'Kashgar is west of Dunhuang, which is west of Chang\'an');
  assert.ok(site('Hangzhou')[1] < site('Kaifeng')[1] && site('Kaifeng')[1] < site('Beijing')[1], 'Hangzhou, Kaifeng, Beijing run south to north');
  assert.ok(site('Taghaza')[1] > site('Timbuktu')[1] + 5, 'Taghaza is deep in the desert north of Timbuktu');
  assert.ok(Math.abs(distanceKm(site('Mecca').slice(0, 2), site('Medina').slice(0, 2)) - 340) < 25, 'Medina is about 340 km from Mecca');
  assert.ok(Math.abs(distanceKm(site('Baghdad').slice(0, 2), site('Mecca').slice(0, 2)) - 1400) < 60, 'Baghdad is about 1,400 km from Mecca');
});

/* ====================================================================== generated: dates */

const eventIdOf = (line) => {
  const hits = Object.entries(H.EVENTS).filter(([, e]) => flat(e.text) === plain(line) || flat(e.text) === flat(line));
  assert.equal(hits.length, 1, `"${line}" is the line of exactly one event`);
  assert.match(line, EVENT_WORDS[hits[0][0]]);
  return hits[0][0];
};

for (const [key, minGap] of [['islamic-world/when', 50], ['medieval-europe/when', 50]]) {
  const [lesson, id] = key.split('/');
  test(`${key}: the order given is the order of the dates, with no close calls`, () => {
    const seen = new Set();
    for (const s of cover(lesson, id)) {
      assert.equal(s.type, 'order');
      assert.equal(s.items.length, 4);
      const ids = s.items.map(eventIdOf);
      assert.equal(new Set(ids).size, 4);
      ids.forEach((e, i) => { if (i) assert.ok(DATES[e] - DATES[ids[i - 1]] >= minGap, `${ids[i - 1]} (${DATES[ids[i - 1]]}) and ${e} (${DATES[e]}) are too close to ask about`); });
      // the explanation gives each event its year, in the same order
      const years = [...s.explain.matchAll(/\*\*(?:About )?(\d{3,4})\*\*/g)].map((m) => Number(m[1]));
      assert.deepEqual(years, ids.map((e) => DATES[e]));
      for (const e of ids) assert.ok(s.explain.includes(`**${CIRCA.has(e) ? 'About ' : ''}${DATES[e]}**: ${H.EVENTS[e].text}`));
      seen.add(ids.join());
    }
    assert.ok(seen.size >= 6, `${key}: ${seen.size} different sets`);
  });
}

test('song-china/which-first: the option marked right is the earlier event, by at least a century', () => {
  const pairs = new Set();
  for (const s of cover('song-china', 'which-first')) {
    assert.equal(s.options.length, 2);
    const [right] = s.options.filter((o) => o.correct);
    const [wrong] = s.options.filter((o) => !o.correct);
    const a = eventIdOf(right.text);
    const b = eventIdOf(wrong.text);
    assert.ok(DATES[b] - DATES[a] >= 100, `${a} (${DATES[a]}) against ${b} (${DATES[b]})`);
    const gap = Math.round((DATES[b] - DATES[a]) / 10) * 10;
    assert.ok(wrong.why.includes(String(DATES[b])) && wrong.why.includes(`about ${gap} years after`), wrong.why);
    assert.ok(s.explain.includes(`(${CIRCA.has(a) ? 'about ' : ''}${DATES[a]})`) && s.explain.includes(`(${CIRCA.has(b) ? 'about ' : ''}${DATES[b]})`), s.explain);
    assert.ok(s.explain.indexOf(String(DATES[a])) < s.explain.indexOf(String(DATES[b])));
    pairs.add(`${a},${b}`);
  }
  assert.ok(pairs.size >= 12, `${pairs.size} different pairs`);
});

test('static order steps follow the dates', () => {
  // the journey of the numerals: India (Brahmagupta's rules for zero, 628), Baghdad (about 825), the Maghreb and al-Andalus (900s to 1100s), Pisa (1202)
  const numerals = one('islamic-world', 'numerals');
  assert.deepEqual(numerals.items.map((t) => /^(India|Baghdad|North Africa|Pisa)/.exec(t)[1]), ['India', 'Baghdad', 'North Africa', 'Pisa']);
  for (const year of ['628', '825', '1202']) assert.ok(numerals.explain.includes(year), `the explanation gives ${year}`);
  // the end of the Mongol empire
  const after = one('mongols', 'after');
  const ids = after.items.map(eventIdOf);
  assert.deepEqual(ids, ['chinggis', 'baghdadfalls', 'songfalls', 'blackdeath', 'ming']);
  ids.forEach((e, i) => { if (i) assert.ok(DATES[e] > DATES[ids[i - 1]] + 15); });
  assert.deepEqual([...after.explain.matchAll(/\*\*(\d{4})\*\*/g)].map((m) => Number(m[1])), ids.map((e) => DATES[e]));
});

/* ====================================================================== generated: people and places from tables */

/** For "which of these people …?" questions: the one name whose key words appear in the question. */
function onlyMatch(question, keys, where) {
  const hits = Object.entries(keys).filter(([, re]) => re.test(question)).map(([name]) => name);
  assert.equal(hits.length, 1, `${where}: the question fits exactly one person, not ${JSON.stringify(hits)}: ${question}`);
  return hits[0];
}

test('islamic-world/scholars: the scholar marked right is the one the clue describes', () => {
  const KEYS = {
    'Al-Khwarizmi': /algebra its name/, 'Ibn al-Haytham': /light travels/, 'Ibn Sina': /Canon of Medicine/, 'Hunayn ibn Ishaq': /translated Greek/,
    'Al-Idrisi': /world map/, 'Fatima al-Fihri': /Fez/,
  };
  // what each is known for, with a date the clue or the explanation may quote
  const FACTS = { 'Al-Khwarizmi': ['820'], 'Ibn al-Haytham': ['1020'], 'Ibn Sina': ['1025'], 'Hunayn ibn Ishaq': ['ninth'], 'Al-Idrisi': ['1154'], 'Fatima al-Fihri': ['859'] };
  assert.deepEqual(H.SCHOLARS.map((r) => r.name).sort(), Object.keys(KEYS).sort());
  const asked = new Set();
  for (const s of cover('islamic-world', 'scholars')) {
    assert.equal(s.options.length, 4);
    const who = onlyMatch(plain(s.text), KEYS, 'scholars');
    assert.equal(s.options.find((o) => o.correct).text, who);
    for (const o of s.options) {
      assert.ok(KEYS[o.text], `${o.text} is a scholar of the table`);
      if (!o.correct) assert.ok(o.why && o.why.includes(o.text.replace(/^Al-/, 'Al-')), `a wrong option says who that person was: ${o.why}`);
    }
    assert.ok(FACTS[who].some((f) => (s.text + s.explain).includes(f)), `${who}: the date ${FACTS[who]} appears`);
    assert.ok(plain(s.explain).includes(who));
    asked.add(who);
  }
  assert.equal(asked.size, 6);
});

test('mongols/who: the person marked right is the one the clue describes', () => {
  const KEYS = {
    'Chinggis Khan': /proclaimed their ruler in 1206/, 'Kublai Khan': /Dadu/, 'Hülegü': /destroyed Baghdad/, 'Marco Polo': /Venice/, 'Ibn Battuta': /Tangier/,
    'Rabban Sauma': /monk/, Timur: /from Samarkand/,
  };
  assert.deepEqual(H.MONGOL_AGE_PEOPLE.map((r) => r.name).sort(), Object.keys(KEYS).sort());
  const asked = new Set();
  for (const s of cover('mongols', 'who')) {
    assert.equal(s.options.length, 4);
    const who = onlyMatch(plain(s.text), KEYS, 'who');
    assert.equal(s.options.find((o) => o.correct).text, who);
    for (const o of s.options) assert.ok(KEYS[o.text], `${o.text} is in the table`);
    assert.ok(plain(s.explain).includes(who === 'Chinggis Khan' ? 'Chinggis' : who === 'Kublai Khan' ? 'Kublai' : who));
    asked.add(who);
  }
  assert.equal(asked.size, 7);
  // dates quoted in the table against this file
  const row = (name) => H.MONGOL_AGE_PEOPLE.find((r) => r.name === name);
  assert.ok(row('Chinggis Khan').clue.includes(String(DATES.chinggis)) && row('Hülegü').clue.includes(String(DATES.baghdadfalls)) && row('Kublai Khan').more.includes(String(DATES.songfalls)));
  assert.ok(row('Ibn Battuta').clue.includes('1325') && row('Ibn Battuta').clue.includes('117,000 km') && row('Marco Polo').more.includes('1271') && row('Marco Polo').more.includes('1295'));
});

test('silk-roads/port-or-oasis: exactly one option is of the kind asked for', () => {
  const PORT = new Set(['Calicut', 'Malacca', 'Kilwa', 'Guangzhou', 'Aden', 'Hormuz']);
  const CARAVAN = new Set(['Samarkand', 'Kashgar', 'Dunhuang', 'Bukhara', 'Merv']);
  // a port is on the coast; a caravan city is far inland (worked out from the helper's coordinates and the map's coastlines)
  const coastKm = (p) => { for (let r = 10; r <= 2000; r += 10) for (let b = 0; b < 360; b += 20) if (countryAt(destination(p, r, b), 'low') === null) return r; return Infinity; };
  for (const name of PORT) assert.ok(coastKm(placeByName(name).at) <= 150, `${name} is on the sea, or a short way up an estuary`);
  for (const name of CARAVAN) assert.ok(coastKm(placeByName(name).at) >= 600, `${name} is far inland`);
  const kinds = new Set();
  for (const s of cover('silk-roads', 'port-or-oasis')) {
    assert.equal(s.options.length, 4);
    const wantPort = /Which one was a sea port/.test(plain(s.text));
    assert.notEqual(wantPort, /Which one was a caravan city/.test(plain(s.text)), s.text);
    const set = wantPort ? PORT : CARAVAN;
    const other = wantPort ? CARAVAN : PORT;
    const fits = s.options.filter((o) => set.has(o.text));
    assert.equal(fits.length, 1, 'exactly one option is of the kind asked for');
    assert.ok(fits[0].correct);
    for (const o of s.options) if (!o.correct) { assert.ok(other.has(o.text), `${o.text} is of the other kind`); assert.ok(o.why.includes(o.text) && o.why.includes(wantPort ? 'caravan city' : 'sea port')); }
    assert.ok(s.explain.startsWith(`${fits[0].text} was a ${wantPort ? 'sea port' : 'caravan city'}`), s.explain);
    kinds.add(`${wantPort}:${fits[0].text}`);
  }
  assert.equal(kinds.size, 11);
});

test('african-kingdoms/match-sites: every place is paired with what it is known for', () => {
  const KNOWN = {
    Timbuktu: /scholars and books.*Niger/, Taghaza: /Salt mines/, Kilwa: /Swahili.*port.*gold/, 'Great Zimbabwe': /walls of stone.*without mortar/,
    Lalibela: /Churches cut.*rock/, Ife: /heads cast/, 'Koumbi Saleh': /capital of ancient Ghana/,
  };
  assert.deepEqual(H.AFRICA_SITES.map((r) => r.name).sort(), Object.keys(KNOWN).sort());
  const seen = new Set();
  for (const s of cover('african-kingdoms', 'match-sites')) {
    assert.equal(s.type, 'match');
    assert.equal(s.pairs.length, 4);
    assert.equal(new Set(s.pairs.map((p) => p[0])).size, 4);
    for (const [left, right] of s.pairs) {
      assert.match(right, KNOWN[left], `${left}: ${right}`);
      // no other description on the screen would also fit this place
      for (const [, otherRight] of s.pairs) if (otherRight !== right) assert.ok(!KNOWN[left].test(otherRight), `${left} also fits "${otherRight}"`);
      seen.add(left);
    }
  }
  assert.equal(seen.size, 7);
});

test('americas/which-people: the people marked right are the ones the trait belongs to', () => {
  const KEYS = [
    [/glyphs.*twenties.*zero/, 'The Maya'], [/Tikal, Palenque and Copán/, 'The Maya'],
    [/island in a lake.*chinampas/, 'The Mexica (Aztecs)'], [/Nahuatl/, 'The Mexica (Aztecs)'],
    [/knotted cords called quipus/, 'The Inca'], [/40,000 km of roads/, 'The Inca'],
    [/earth mounds beside the Mississippi/, 'The people of Cahokia'], [/cliffs of Mesa Verde.*Chaco Canyon/, 'The Ancestral Puebloans'],
  ];
  assert.equal(H.AMERICAN_TRAITS.length, KEYS.length);
  const asked = new Set();
  for (const s of cover('americas', 'which-people')) {
    assert.equal(s.options.length, 4);
    const q = plain(s.text);
    const hits = KEYS.filter(([re]) => re.test(q));
    assert.equal(hits.length, 1, `the question fits one trait: ${q}`);
    assert.equal(s.options.find((o) => o.correct).text, hits[0][1]);
    for (const o of s.options) assert.ok(KEYS.some(([, people]) => people === o.text), `${o.text} is one of the five peoples`);
    assert.ok(s.explain.length > 30);
    asked.add(q);
  }
  assert.equal(asked.size, KEYS.length);
});

/* ====================================================================== generated: Maya numbers */

/** Read a Maya number back from the drawing: bars count 5, dots 1, a shell 0; levels from the top down. */
function readMaya(svg) {
  const levels = svg.content.split('<rect class="fill-surface stroke-hair"').slice(1);
  return levels.map((part) => {
    const bars = (part.match(/<rect class="fill-orange/g) || []).length;
    const dots = (part.match(/<circle class="fill-blue/g) || []).length;
    const shell = /fill-yellow-soft/.test(part);
    assert.ok(shell ? bars + dots === 0 : bars + dots > 0, 'a level shows either a shell or bars and dots');
    assert.ok(bars <= 3 && dots <= 4);
    return bars * 5 + dots;
  });
}

test('americas/read-number: the answer is what the drawing shows, counted bar by bar and dot by dot', () => {
  const values = new Set();
  let zeros = 0;
  for (const s of cover('americas', 'read-number')) {
    assert.equal(s.type, 'numeric');
    const [fig] = specs(s, 'svg');
    const digits = readMaya(fig);
    assert.equal(digits.length, 2);
    const value = digits[0] * 20 + digits[1];
    assert.equal(s.answer, value);
    assert.ok(digits[0] >= 1 && digits[0] <= 4 && digits[1] >= 0 && digits[1] <= 19 && value >= 20 && value <= 99);
    assert.equal(s.tolerance, null);
    for (const [slip, msg] of s.wrong) { assert.notEqual(slip, value); assert.ok(msg.length > 20); }
    // the drawing fits its frame, level by level
    fig.content.split('<rect class="fill-surface stroke-hair"').slice(1).forEach((part) => {
      const top = Number(/ y="([\d.]+)"/.exec(part)[1]);
      for (const m of part.matchAll(/<circle[^>]* cy="([\d.]+)" r="([\d.]+)"/g)) assert.ok(Number(m[1]) - Number(m[2]) >= top + 2, 'a dot pokes out of the top of its frame');
    });
    // the words say the same as the picture
    assert.ok(fig.alt.includes(`${H.mayaWords(digits[0])}; ${H.mayaWords(digits[1])}`), fig.alt);
    assert.ok(s.explain.includes(`${digits[0]} × 20 = ${digits[0] * 20}`) && s.explain.includes(`**${value}**`), s.explain);
    assert.ok(s.hints[1].includes(`${digits[0]} × 20`));
    assert.match(plain(s.text), /lower level counts ones, the upper level counts twenties/);
    values.add(value);
    if (digits[1] === 0) zeros++;
  }
  assert.ok(values.size >= 50, `${values.size} different numbers`);
  assert.ok(zeros >= 5, 'the shell for zero turns up');
  assert.equal(H.mayaValue([2, 8]), 48);
  assert.equal(H.mayaWords(19), '3 bars and 4 dots');
  assert.deepEqual(readMaya(H.mayaNumber([4, 0])), [4, 0]);
  // the primer shows what its text says
  const primer = one('americas', 'maya-numbers').figures[0];
  assert.match(primer.alt, /19: 3 bars and 4 dots/);
  assert.match(primer.alt, /40 \+ 8 = 48/);
});

/* ====================================================================== timelines */

const TIMELINES = [
  { key: 'african-kingdoms/three-empires', want: { ghana: 1050, mali: 1325, songhai: 1500 }, tolerance: 100 },
  { key: 'song-china/when', want: { sutra: DATES.diamondsutra, type: DATES.movabletype, hangul: DATES.hangul }, tolerance: 100 },
  { key: 'americas/when', want: { cahokia: DATES.cahokia, tenochtitlan: DATES.tenochtitlan, inca: DATES.inca }, tolerance: 75 },
];

for (const { key, want, tolerance } of TIMELINES) {
  const [lesson, id] = key.split('/');
  test(`${key}: cards belong where the dates say, within the tolerance the text promises`, () => {
    const s = one(lesson, id);
    const tl = s.widget;
    assert.equal(tl.type, 'timeline');
    assert.match(plain(s.text), new RegExp(`Within ${tolerance} years counts`));
    assert.deepEqual(tl.place.map((c) => c.id).sort(), Object.keys(want).sort());
    for (const card of tl.place) { assert.equal(card.answer, want[card.id], `${card.id}: the date shown afterwards`); assert.ok(card.answer > tl.from && card.answer < tl.to); }
    for (const e of tl.events || []) if (DATES[e.id]) assert.equal(e.year, DATES[e.id], `landmark ${e.id}`);
    const state = (placed) => ({ placed, count: Object.values(placed).filter((v) => v != null).length, complete: Object.values(placed).every((v) => v != null) });
    assert.equal(s.check(state(s.solution.placed)), true, 'the solution is accepted');
    assert.equal(s.check(state(want)), true, 'the exact dates are accepted');
    for (const card of Object.keys(want)) {
      for (const sign of [-1, 1]) {
        assert.equal(s.check(state({ ...want, [card]: want[card] + sign * tolerance })), true, `${card}: ${tolerance} years ${sign < 0 ? 'early' : 'late'} still counts`);
        const off = s.check(state({ ...want, [card]: want[card] + sign * (tolerance + tl.snap) }));
        assert.equal(typeof off, 'string', `${card}: one step beyond the tolerance is refused`);
        assert.match(off, sign < 0 ? /too early/ : /too late/);
      }
      const missing = s.check(state({ ...want, [card]: null }));
      assert.equal(typeof missing, 'string');
    }
    // the cards are far enough apart that the tolerances cannot overlap by accident
    const years = Object.values(want).sort((a, b) => a - b);
    years.forEach((y, i) => { if (i) assert.ok(y - years[i - 1] >= 100); });
  });
}

test('silk-roads/when: only the Tang bar is accepted, and each other bar gets its own reply', () => {
  const s = one('silk-roads', 'when');
  const spans = Object.fromEntries(s.widget.spans.map((sp) => [sp.id, sp]));
  assert.deepEqual([spans.tang.from, spans.tang.to], [618, 907]);
  assert.deepEqual([spans.song.from, spans.song.to], [960, 1279]);
  assert.deepEqual([spans.abbasid.from, spans.abbasid.to], [750, 1258]);
  assert.deepEqual([spans.han.from, spans.han.to], [-206, 220]);
  assert.deepEqual([spans.mongol.from, spans.mongol.to], [1206, 1368]);
  assert.equal(spans.tang.from, DATES.tang);
  assert.equal(s.check({ picked: 'tang' }), true);
  assert.equal(s.check(s.solution), true);
  const replies = new Set();
  for (const id of ['han', 'rome', 'abbasid', 'song', 'mongol']) { const r = s.check({ picked: id }); assert.equal(typeof r, 'string', id); replies.add(r); }
  assert.ok(replies.size >= 4);
  assert.equal(s.check({ picked: null }), false);
  // the camel of the hook (700s) falls inside the bar
  assert.ok(spans.tang.from < 700 && spans.tang.to > 760);
});

test('timeline figures show the dates of this file', () => {
  let checked = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(1), step.id);
      for (const tl of specs(s, 'timeline')) {
        for (const e of tl.events || []) {
          assert.notEqual(e.year, 0, 'there is no year 0');
          if (DATES[e.id]) { assert.equal(e.year, DATES[e.id], `${id}/${step.id}: ${e.id}`); checked++; }
          assert.ok(e.year >= tl.from && e.year <= tl.to, `${id}/${step.id}: ${e.label} is on the axis`);
        }
        for (const sp of tl.spans || []) assert.ok(sp.from < sp.to && sp.to >= tl.from && sp.from <= tl.to, `${id}/${step.id}: ${sp.label}`);
      }
    }
  }
  assert.ok(checked >= 15);
  const spansOf = (lesson, step) => Object.fromEntries(specs(one(lesson, step), 'timeline')[0].spans.map((sp) => [sp.id, [sp.from, sp.to]]));
  assert.deepEqual(spansOf('islamic-world', 'translation'), { umayyad: [661, 750], abbasid: [750, 1258], andalus: [756, 1031] });
  assert.deepEqual(spansOf('song-china', 'dynasties'), { tang: [618, 907], song: [960, 1279], heian: [794, 1185], goryeo: [918, 1392] });
  assert.deepEqual(spansOf('medieval-europe', 'west'), { east: [400, 1453], vikings: [793, 1066], crusades: [1095, 1291] });
});

/* ====================================================================== map steps answered by hand */

/** The state the map widget reports for a pin at `pin`, when the target is `target`. */
const pinState = (pin, target, placed = true) => ({ pin, placed, km: Math.round(distanceKm(pin, target)), country: countryAt(pin, 'low', 25) });

for (const { key, name, km, view } of [
  { key: 'islamic-world/find-mecca', name: 'Mecca', km: 350 },
  { key: 'african-kingdoms/timbuktu', name: 'Timbuktu', km: 300 },
  { key: 'medieval-europe/constantinople', name: 'Constantinople', km: 250 },
]) {
  const [lesson, id] = key.split('/');
  test(`${key}: a pin within ${km} km is right; further off, the reply says how far and which way`, () => {
    const s = one(lesson, id);
    const target = site(name).slice(0, 2);
    assert.equal(s.widget.mode, 'place');
    assert.ok(distanceKm(s.widget.target, target) <= 40, 'the widget aims at the place this file knows');
    assert.match(plain(s.text), new RegExp(`Within ${km} km counts`));
    assert.equal(s.check(pinState(s.solution.pin, s.widget.target)), true);
    assert.equal(typeof s.check(pinState(s.widget.pin.start, s.widget.target, false)), 'string', 'an unmoved pin is sent back');
    assert.ok(distanceKm(s.widget.pin.start, target) > km * 1.5, 'the pin does not start on the answer');
    const dirs = { 0: 'north', 45: 'north-east', 90: 'east', 135: 'south-east', 180: 'south', 225: 'south-west', 270: 'west', 315: 'north-west' };
    for (const [bearing, word] of Object.entries(dirs)) {
      assert.equal(s.check(pinState(destination(target, km - 30, Number(bearing)), s.widget.target)), true, `${km - 30} km ${word} counts`);
      const far = km + 250;
      const reply = s.check(pinState(destination(target, far, Number(bearing)), s.widget.target));
      assert.equal(typeof reply, 'string', `${far} km ${word} is refused`);
      assert.ok(reply.includes(`too far ${word}.`), `${far} km to the ${word}: ${reply}`);
      const said = Number(/about ([\d,]+) km/.exec(reply)[1].replace(',', ''));
      assert.ok(Math.abs(said - far) <= 30, `the reply gives the distance: ${reply}`);
    }
    void view;
  });
}

test('compass(): the eight directions, also across the date line and near the pole', () => {
  assert.equal(H.compass([0, 0], [0, 10]), 'north');
  assert.equal(H.compass([0, 0], [10, 10]), 'north-east');
  assert.equal(H.compass([0, 0], [10, 0]), 'east');
  assert.equal(H.compass([0, 0], [10, -10]), 'south-east');
  assert.equal(H.compass([0, 0], [0, -10]), 'south');
  assert.equal(H.compass([0, 0], [-10, -10]), 'south-west');
  assert.equal(H.compass([0, 0], [-10, 0]), 'west');
  assert.equal(H.compass([0, 0], [-10, 10]), 'north-west');
  assert.equal(H.compass([175, 10], [-175, 10]), 'east');
  assert.equal(H.compass(site('Mecca').slice(0, 2), site('Baghdad').slice(0, 2)), 'north');
  assert.equal(H.compass(site('Mecca').slice(0, 2), site('Samarkand').slice(0, 2)), 'north-east');
  assert.equal(H.compass(site('Timbuktu').slice(0, 2), site('Taghaza').slice(0, 2)), 'north');
});

test('silk-roads/caravan: the route runs from Chang\'an west to Baghdad, oasis by oasis', () => {
  const s = one('silk-roads', 'caravan');
  const want = ['Chang\'an', 'Dunhuang', 'Kashgar', 'Samarkand', 'Baghdad'];
  const lons = want.map((n) => site(n)[0]);
  assert.deepEqual(lons, [...lons].sort((a, b) => b - a), 'each stop is west of the one before');
  const idOf = (name) => s.widget.markers.find((m) => m.label === name).id;
  const route = want.map(idOf);
  const state = (r) => ({ route: r, count: r.length });
  assert.deepEqual(s.solution.route, route);
  assert.deepEqual(s.widget.answer, route);
  assert.equal(s.check(state(route)), true);
  for (const m of s.widget.markers) assert.ok(distanceKm(m.at, site(m.label).slice(0, 2)) <= 40);
  for (const wrong of [[...route].reverse(), route.slice(0, 3), [route[0], route[2], route[1], route[3], route[4]], [route[1], route[0], route[2], route[3], route[4]], []]) {
    assert.equal(typeof s.check(state(wrong)), 'string', `route ${wrong} is refused with a message`);
  }
  // the distance quoted is the sum of the straight hops, and the travelling time follows from 30 km a day
  const km = want.slice(1).reduce((sum, n, i) => sum + distanceKm(site(want[i]).slice(0, 2), site(n).slice(0, 2)), 0);
  const quoted = Number(/about \*\*([\d,]+) km\*\*/.exec(s.explain)[1].replace(',', ''));
  assert.ok(Math.abs(quoted - km) <= 60, `quoted ${quoted} km, this file makes it ${Math.round(km)} km`);
  const days = Number(/about (\d+) days/.exec(s.explain)[1]);
  assert.ok(Math.abs(km / 30 - days) <= 6, `at 30 km a day ${Math.round(km)} km takes ${Math.round(km / 30)} days, the lesson says ${days}`);
});

test('islamic-world/expansion: of the four cities, only Constantinople stayed outside the caliphs\' rule', () => {
  const s = one('islamic-world', 'expansion');
  assert.equal(s.mode, 'predict');
  const byName = Object.fromEntries(s.widget.markers.map((m) => [m.label, m.id]));
  assert.deepEqual(s.widget.pickable.map((id) => s.widget.markers.find((m) => m.id === id).label).sort(), ['Constantinople', 'Córdoba', 'Damascus', 'Samarkand']);
  for (const name of ['Constantinople', 'Córdoba', 'Damascus', 'Samarkand']) {
    const inside = pointInPolygon(site(name).slice(0, 2), H.CALIPHATE_750);
    assert.equal(s.check({ picked: byName[name] }), !inside, `${name}: ${inside ? 'inside' : 'outside'} the caliphs' lands of 750`);
  }
  assert.equal(s.check(s.solution), true);
  assert.equal(s.widget.answer, byName.Constantinople);
});

test('african-kingdoms/ghana-where: Mauritania, where Koumbi Saleh is, and not modern Ghana', () => {
  const s = one('african-kingdoms', 'ghana-where');
  const koumbi = site('Koumbi Saleh');
  assert.equal(koumbi[2], 'MR');
  assert.ok(inOrNear(koumbi.slice(0, 2), 'MR', 60));
  assert.equal(s.check({ picked: 'MR', name: countryName('MR') }), true);
  assert.equal(s.check(s.solution), true);
  assert.equal(s.widget.answer, 'MR');
  for (const code of ['GH', 'ML', 'SN', 'NG', null]) assert.notEqual(s.check({ picked: code, name: code && countryName(code) }), true, `${code} is not accepted`);
  // "hundreds of kilometres": the nearest corner of modern Ghana is far from Koumbi Saleh
  const ghana = countryInfo('GH');
  assert.ok(distanceKm(koumbi.slice(0, 2), [ghana.box[0], ghana.box[3]]) > 600);
});

test('medieval-europe/vikings: the most westerly of the Norse places is Newfoundland', () => {
  const s = one('medieval-europe', 'vikings');
  const pickable = s.widget.pickable.map((id) => s.widget.markers.find((m) => m.id === id));
  const names = { lanse: 'L\'Anse aux Meadows', greenland: 'Greenland settlements', iceland: 'Iceland', dublin: 'Dublin' };
  assert.deepEqual(pickable.map((m) => m.id).sort(), Object.keys(names).sort());
  const west = pickable.slice().sort((a, b) => site(names[a.id])[0] - site(names[b.id])[0])[0];
  assert.equal(west.id, 'lanse');
  assert.equal(s.check({ picked: 'lanse' }), true);
  assert.equal(s.check(s.solution), true);
  for (const id of ['greenland', 'iceland', 'dublin', null]) assert.equal(s.check({ picked: id }), false);
  assert.ok(inOrNear(site(names.lanse).slice(0, 2), 'CA'));
  // the western line on the map stops at Greenland, so the map does not give the answer away
  const westLine = s.widget.lines[0].points;
  assert.ok(westLine.every((p) => p[0] > -50), 'the settlers\' route is drawn only as far as Greenland');
  assert.ok(s.explain.includes('1021') && s.explain.includes(`${1492 - 1021} years`));
});

test('mongols/stopped: Cairo and Kyoto, the two cities outside every Mongol realm', () => {
  const s = one('mongols', 'stopped');
  const khanates = [H.YUAN, H.GOLDEN_HORDE, H.ILKHANATE, H.CHAGATAI];
  const never = s.widget.markers.filter((m) => !khanates.some((o) => pointInPolygon(m.at, o)) && m.label !== 'Kyiv').map((m) => m.id).sort();
  assert.deepEqual(never, ['cairo', 'kyoto']);          // Kyiv was a tributary city outside the outline of direct rule, and it fell in 1240
  assert.equal(s.check({ picked: ['cairo', 'kyoto'], count: 2 }), true);
  assert.equal(s.check({ picked: [...s.solution.picked].sort(), count: 2 }), true);
  assert.deepEqual([...s.widget.answer].sort(), ['cairo', 'kyoto']);
  for (const wrong of [['baghdad', 'cairo'], ['cairo', 'kyiv'], ['kyoto', 'samarkand'], ['beijing', 'kyoto'], ['cairo'], []]) {
    const reply = s.check({ picked: wrong, count: wrong.length });
    assert.notEqual(reply, true, `${wrong} is refused`);
    if (wrong.length === 2) assert.equal(typeof reply, 'string');
  }
  assert.ok(s.check({ picked: ['baghdad', 'cairo'], count: 2 }).includes(String(DATES.baghdadfalls)));
});

test('americas/inca: Peru, where Cusco is; the neighbours get a reply that points the right way', () => {
  const s = one('americas', 'inca');
  assert.equal(site('Cusco')[2], 'PE');
  assert.equal(countryAt(site('Cusco').slice(0, 2)), 'PE');
  assert.equal(s.check({ picked: 'PE', name: 'Peru' }), true);
  assert.equal(s.check(s.solution), true);
  const cusco = site('Cusco');
  for (const code of ['EC', 'CO', 'BO', 'CL', 'AR']) {
    const reply = s.check({ picked: code, name: countryName(code) });
    assert.equal(typeof reply, 'string');
    const there = countryInfo(code).center;
    assert.ok(reply.includes(`further ${there[1] > cusco[1] ? 'south' : 'north'}`), `${code}: Cusco lies to the ${there[1] > cusco[1] ? 'south' : 'north'} of it: ${reply}`);
    assert.ok(reply.includes(countryName(code)));
  }
  for (const code of ['BR', 'VE', 'PY']) assert.match(s.check({ picked: code, name: countryName(code) }), /outside the Inca state/);
  assert.equal(s.check({ picked: null, name: null }), false);
  // the countries the reply calls "Inca" are the ones the outline touches
  for (const code of ['EC', 'PE', 'BO', 'CL', 'AR']) assert.ok(H.INCA_1525.some((p) => countryAt(p, 'low', 60) === code) || pointInPolygon(countryInfo(code).center, H.INCA_1525), `${code} is touched by the outline`);
});

/* ====================================================================== pictures */

const manifest = JSON.parse(readFileSync(fileURLToPath(new URL(`../content/media/${COURSE}/manifest.json`, import.meta.url)), 'utf8'));
const ALLOWED = /^(Public domain|CC0|CC BY(-SA)? [234]\.[05])/;
// which pictures each lesson shows, in order
const PICTURES = {
  'silk-roads': ['tang-camel', 'maqamat-ship'],
  'islamic-world': ['quran-folio', 'algebra-page', 'cordoba-mosque', 'astrolabe'],
  'african-kingdoms': ['mansa-musa', 'great-zimbabwe', 'lalibela', 'ife-head'],
  'song-china': ['qingming-bridge', 'banknote', 'diamond-sutra'],
  'medieval-europe': ['hagia-sophia', 'march', 'round-earth', 'chartres'],          // the round Earth now follows the screen on the universities
  mongols: ['ger', 'paiza'],
  americas: ['tenochtitlan-map', 'quipu', 'machu-picchu', 'cliff-palace'],
};

test('every picture comes from the course\'s media folder, with a licence, a credit and a description', () => {
  const bySrc = new Map(Object.values(manifest.images).flatMap((img) => [[img.src, img], [img.small && img.small.src, img]]));
  const used = new Set();
  for (const [id, lesson] of Object.entries(lessons)) {
    let count = 0;
    const shown = [];
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(1), step.id);
      for (const p of specs(s, 'photo')) {
        const img = bySrc.get(p.src);
        assert.ok(img, `${id}/${step.id}: ${p.src} is in the manifest of ${COURSE}`);
        assert.match(img.license, ALLOWED, `${img.id}: licence ${img.license}`);
        assert.ok(img.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'), `${img.id}: source`);
        assert.ok(img.publicDomain || (img.author && img.author.length > 1), `${img.id}: an author to credit`);
        assert.ok(p.alt && p.alt.length >= 50, `${id}/${step.id}: the alt text says what can be seen`);
        assert.ok(!/^(photo|image|picture) of/i.test(p.alt));
        assert.equal(p.license, img.license);
        // the step refers to its picture
        assert.ok(/photograph|picture|page|map|painted|painting|figure|head|ship|tablet|object|This is|This |Look/i.test(s.text), `${id}/${step.id}: the text uses the picture`);
        for (const h of p.hotspots || []) {
          assert.ok(h.x > 0.03 && h.x < 0.97 && h.y > 0.03 && h.y < 0.97 && h.r >= 0.05 && h.r <= 0.15, `${id}/${step.id}: hotspot ${h.id}`);
          assert.ok(h.label && h.alt, `${id}/${step.id}: hotspot ${h.id} has a label and a neutral description`);
        }
        used.add(img.id);
        shown.push(img.id);
        count++;
      }
    }
    assert.ok(count >= 2 && count <= 4, `${id}: ${count} pictures (the budget is 2 to 4)`);
    assert.deepEqual(shown, PICTURES[id], `${id}: its pictures`);
  }
  assert.deepEqual([...used].sort(), Object.keys(manifest.images).sort(), 'every picture in the manifest is used by a lesson');
  assert.ok(used.size >= 15 && used.size <= 28);
});

// Added in review: the credit a learner SEES under each picture (the record's author field is not always a
// clean name, and for the CC BY and CC BY-SA pictures the visible line has to name the person the licence
// asks us to credit). A word of the expected credit for every picture, typed in from the Commons pages.
const SEEN_CREDIT = {
  'tang-camel': /Gary Todd/, 'maqamat-ship': /^Yaḥyā ibn Maḥmūd al-Wāsiṭī$/, 'quran-folio': /^Marie-Lan Nguyen$/, 'algebra-page': /al-Khwarizmi/,
  'cordoba-mosque': /^Timor Espallargas$/, astrolabe: /^The Metropolitan Museum of Art$/, 'mansa-musa': /Abraham Cresques/, 'great-zimbabwe': /Andrew Moore/,
  lalibela: /^Bernard Gagnon$/, 'ife-head': /Ukabia/, 'qingming-bridge': /^Zhang Zeduan$/, banknote: /^PHGCOM$/, 'diamond-sutra': /^British Library$/,
  'round-earth': /Gossuin/, 'hagia-sophia': /^Arild Vågen$/, march: /Limbourg/, chartres: /^Florestan$/, ger: /^Mark Fischer$/, paiza: /./,
  'tenochtitlan-map': /Peypus/, quipu: /Lyndsaruell/, 'machu-picchu': /^Pedro Szekely$/, 'cliff-palace': /^Tobi 87$/,
};

test('the credit shown under every picture is a clean name, and names the photographer where the licence asks for it', () => {
  const bySrc = new Map(Object.values(manifest.images).map((img) => [img.src, img]));
  let seen = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(1), step.id);
      for (const p of specs(s, 'photo')) {
        const img = bySrc.get(p.src);
        const where = `${id}/${step.id} (${img.id})`;
        assert.ok(SEEN_CREDIT[img.id], `${where}: this file knows whom to credit`);
        assert.equal(typeof p.credit, 'string', `${where}: a credit`);
        assert.match(p.credit, SEEN_CREDIT[img.id], `${where}: the visible credit is "${p.credit}"`);
        assert.ok(!/https?:|www\.|Creator:|hochgeladen|Unknown|colophon|…|\.$/i.test(p.credit), `${where}: the visible credit is not a clean name: "${p.credit}"`);
        assert.ok(p.credit.length <= 60, `${where}: the visible credit is too long: "${p.credit}"`);
        const line = creditLine(p);
        assert.ok(line.includes(p.credit) && line.toLowerCase().includes(img.license.toLowerCase()), `${where}: the line under the picture reads "${line}"`);
        if (img.attributionRequired) assert.ok(/^CC BY/.test(img.license) && line.startsWith(`${p.creditLabel || 'Photo'}: ${p.credit}, ${img.license}`), `${where}: "${line}"`);
        seen++;
      }
    }
  }
  assert.equal(seen, Object.keys(manifest.images).length);
});

test('steps that deal with atrocity or mass death are marked tone: sober, and no others', () => {
  const SOBER = [
    'african-kingdoms/middlemen', 'african-kingdoms/teach-swahili', 'african-kingdoms/swahili',          // the trans-Saharan and Indian Ocean slave trades
    'medieval-europe/teach-crusades', 'medieval-europe/crusades',             // massacres of 1096 and 1099, the sack of 1204
    'mongols/rise', 'mongols/stopped', 'mongols/plague-path', 'mongols/teach-aftermath', 'mongols/plague-effects', 'mongols/after', 'mongols/who', 'mongols/verdict',
    'americas/tenochtitlan',                                                  // human sacrifice
  ];
  const actual = [];
  for (const [id, lesson] of Object.entries(lessons)) {
    assert.equal(lesson.tone, '', `${id}: the tone is set step by step, not for the whole lesson`);
    for (const step of lesson.steps) if (step.tone === 'sober') actual.push(`${id}/${step.id}`);
  }
  assert.deepEqual(actual.sort(), [...SOBER].sort());
  // every step whose text speaks of these things is in the list
  const GRIM = /enslaved|massacre|murdered|human sacrifice|Black Death killed|dead ran into millions|killing many/i;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(1), step.id);
      const words = [s.text, s.explain, s.model, ...(s.options || []).map((o) => `${o.text} ${o.why || ''}`), ...(s.pairs || []).flat()].filter(Boolean).join(' ');
      if (GRIM.test(words)) assert.ok(SOBER.includes(`${id}/${step.id}`), `${id}/${step.id} speaks of atrocity but is not marked sober`);
    }
  }
});

test('corrections made in review stay made', () => {
  // "Silk Road": Richthofen made the name famous in 1877, but the German word is older, so no option claims a coinage in 1877
  const name = one('silk-roads', 'name');
  const right = name.options.find((o) => o.correct);
  assert.ok(/German/.test(right.text) && /1800s/.test(right.text) && !/1877/.test(right.text));
  assert.ok(/Richthofen/.test(name.explain) && /1877/.test(name.explain) && !/coined/.test(name.explain));
  assert.ok(!lessons['silk-roads'].recap.some((line) => /1877/.test(line)));
  // "almanac" is of uncertain origin and must not be listed among the words from Arabic
  assert.ok(!/almanac/.test(one('islamic-world', 'hook').explain));
  // the Catalan Atlas writes Gao as "geugeu"
  assert.ok(/geugeu/.test(one('african-kingdoms', 'musa').explain));
  // Swahili: estimates of the number of speakers vary too widely for "well over 100 million"
  assert.ok(/estimates vary/.test(one('african-kingdoms', 'swahili').explain));
  // Hagia Sophia: 1453 + 481 = 1934, the year of the decree that made it a museum
  assert.ok(/1934/.test(one('medieval-europe', 'hagia-sophia').explain));
  // the March page of the Très Riches Heures was begun by the Limbourgs and finished a generation later
  const march = one('medieval-europe', 'manor');
  assert.ok(/begun about 1415/.test(march.text) && /begun about 1412 to 1416/.test(specs(march, 'photo')[0].caption));
  // Ain Jalut lies in the valley south-west of the Sea of Galilee, some 30 km from the lake
  assert.ok(/south-west of the Sea of Galilee/.test(one('mongols', 'stopped').text));
});

for (const { key, right, wrong } of [
  { key: 'african-kingdoms/musa', right: 'gold', wrong: ['crown', 'town'] },
  { key: 'medieval-europe/hagia-sophia', right: 'minaret', wrong: ['dome', 'wall'] },
  { key: 'americas/tenochtitlan', right: 'causeway', wrong: ['precinct', 'lake'] },
]) {
  const [lesson, id] = key.split('/');
  test(`${key}: only the right part of the picture is accepted`, () => {
    const s = one(lesson, id);
    assert.equal(s.widget.type, 'photo');
    const spots = s.widget.hotspots;
    assert.deepEqual(spots.map((h) => h.id).sort(), [right, ...wrong].sort());
    assert.equal(s.check({ picked: right }), true);
    assert.equal(s.check(s.solution), true);
    const replies = new Set();
    for (const w of wrong) { const r = s.check({ picked: w }); assert.equal(typeof r, 'string', `${w} is refused with a message`); replies.add(r); }
    assert.equal(replies.size, wrong.length, 'each wrong part has its own reply');
    assert.equal(s.check({ picked: null }), false);
    // rings do not sit on top of each other (r is a fraction of the width)
    const ratio = s.widget.height / s.widget.width;
    for (const a of spots) for (const b of spots) if (a !== b) assert.ok(Math.hypot(a.x - b.x, (a.y - b.y) * ratio) >= (a.r + b.r) * 0.9, `${a.id} and ${b.id} overlap`);
    // the neutral description of the right part does not give the answer away
    const giveaway = { gold: /gold|nugget/i, minaret: /minaret|mosque|prayer/i, causeway: /causeway/i }[right];
    assert.ok(!giveaway.test(spots.find((h) => h.id === right).alt), `${right}: its description gives the answer away`);
    assert.ok(giveaway.test(spots.find((h) => h.id === right).label), `${right}: its label, shown afterwards, names it`);
  });
}

/* ====================================================================== a few numbers the lessons quote */

test('numbers quoted in the lessons add up', () => {
  // Hagia Sophia: a church from 537 to 1453, then a mosque until 1934
  const hs = one('medieval-europe', 'hagia-sophia');
  assert.ok(hs.explain.includes(`${DATES.constantinople - DATES.hagiasophia} years`) && hs.explain.includes(`${1934 - DATES.constantinople}`));
  // Gutenberg (1450s) after Bi Sheng and after the Diamond Sutra
  assert.ok(1455 - DATES.movabletype > 380 && 1455 - DATES.movabletype < 430 && 1455 - DATES.diamondsutra > 550);
  // "some sixty Londons"
  const hook = one('song-china', 'hook');
  assert.equal(hook.answer, 1000);
  assert.ok(1000 / 15 > 60 && 1000 / 15 < 70);
  // the Mongol empire against Rome: 24 million km² against 5 million
  const mongol = one('mongols', 'hook');
  assert.ok(Math.abs(24 / 5 - mongol.answer) <= mongol.tolerance);
  // Ibn Battuta's 117,000 km: within the slider's tolerance, "nearly three times round the Earth", "about five times" Marco Polo
  const ib = one('mongols', 'travellers');
  assert.ok(Math.abs(117 - ib.answer) <= ib.tolerance && 117000 / 40075 > 2.8 && 117000 / 40075 < 3 && Math.round(117 / 24) === 5);
  // the Belitung ship: about 60,000 pieces
  const ship = one('silk-roads', 'belitung');
  assert.equal(ship.answer, 60);
  assert.equal(ship.unit, 'thousand pieces');
  // sliders: the answer is on the scale and the tolerance is generous
  for (const s of [hook, mongol, ib, ship]) { assert.equal(s.mode, 'predict'); assert.ok(s.answer > s.min && s.answer < s.max && s.tolerance >= s.step); }
});

/* ====================================================================== teach before you ask */

// Teach before you ask (docs/AUTHORING.md). The shape is checked for every lesson; the substance (that each
// graded step asks only for what a screen above it has shown) was checked by reading every lesson with
// tools/outline.mjs --pool, and the pins below hold the places where a later edit could most easily undo it.
const TEACHING_STEPS = {
  'silk-roads': ['teach-relay', 'teach-cargo', 'teach-passengers'],
  'islamic-world': ['teach-pillars', 'teach-scholars', 'teach-timeline'],
  'african-kingdoms': ['teach-swahili', 'teach-africa-map'],
  'song-china': ['teach-inventions', 'teach-exams', 'teach-neighbours', 'teach-timeline'],
  'medieval-europe': ['teach-revival', 'teach-crusades', 'teach-two-churches', 'teach-timeline'],
  mongols: ['teach-steppe', 'teach-army', 'teach-aftermath'],
  americas: ['teach-toolkit', 'teach-crops', 'teach-peoples'],
};
const indexOf = (lesson, id) => { const i = lessons[lesson].steps.findIndex((s) => s.id === id); assert.ok(i >= 0, `${lesson}/${id} exists`); return i; };
/** What a step shows before it is answered: its text and its figures (not its explanation, options or feedback). */
const shownBy = (lesson, id) => { const s = one(lesson, id); return plain(visible({ title: s.title, text: s.text, figures: s.figures, widget: s.type === 'info' ? null : s.widget }).join(' ')); };
/** Everything shown on the steps above a step; with `only`, on the teaching screens above it. */
const shownAbove = (lesson, id, only = () => true) => lessons[lesson].steps.slice(0, indexOf(lesson, id)).filter(only).map((s) => shownBy(lesson, s.id)).join(' ');
const taughtAbove = (lesson, id) => shownAbove(lesson, id, (s) => s.type === 'info');

test('teach before you ask: the shape of every lesson', () => {
  assert.deepEqual(Object.keys(TEACHING_STEPS), ORDER);
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
  const has = (lesson, id, words) => { const t = shownBy(lesson, id).toLowerCase(); for (const w of words) assert.ok(t.includes(plain(w).toLowerCase()), `${lesson}/${id} shows "${w}"`); };

  // lesson 1
  before('silk-roads', 'web', 'caravan');
  before('silk-roads', 'teach-relay', 'relay'); shows('silk-roads', 'teach-relay', /relay.*Sogdians.*Samarkand.*Bukhara.*Merv.*200 kg/);
  before('silk-roads', 'teach-cargo', 'goods'); has('silk-roads', 'teach-cargo', one('silk-roads', 'goods').items.map((it) => it.text));
  before('silk-roads', 'teach-cargo', 'name'); shows('silk-roads', 'teach-cargo', /German geographers, in the 1800s/);
  before('silk-roads', 'monsoon', 'when-sail'); shows('silk-roads', 'monsoon', /November to March.*north-east/);
  before('silk-roads', 'teach-passengers', 'what-else'); shows('silk-roads', 'teach-passengers', /Buddhism.*Korea and Japan.*Islam.*East Africa and Southeast Asia.*Paper-making.*plague.*Americas/);
  before('silk-roads', 'web', 'when'); shows('silk-roads', 'web', /Tang/);
  // lesson 2
  before('islamic-world', 'arabia', 'find-mecca');
  before('islamic-world', 'teach-pillars', 'astrolabe'); before('islamic-world', 'teach-pillars', 'pillars');
  has('islamic-world', 'teach-pillars', one('islamic-world', 'pillars').pairs.flat()); shows('islamic-world', 'teach-pillars', /Sunni.*Shia/);
  before('islamic-world', 'teach-scholars', 'scholars'); shows('islamic-world', 'astrolabe', /measure its height.*shows the hour/);
  // lesson 3
  before('african-kingdoms', 'gold-salt', 'middlemen'); before('african-kingdoms', 'gold-salt', 'musa'); shows('african-kingdoms', 'gold-salt', /Sahel.*Koumbi Saleh, Timbuktu, Gao/);
  before('african-kingdoms', 'teach-swahili', 'swahili'); shows('african-kingdoms', 'teach-swahili', /monsoon.*Bantu.*Arabic/);
  assert.equal(one('african-kingdoms', 'teach-swahili').figures[0].type, 'world-map');
  shows('african-kingdoms', 'zimbabwe', /local African make and of the right age/); shows('african-kingdoms', 'lalibela', /not a block or a joint/);
  before('african-kingdoms', 'teach-africa-map', 'find-site'); before('african-kingdoms', 'teach-africa-map', 'match-sites');
  has('african-kingdoms', 'teach-africa-map', H.AFRICA_SITES.map((r) => r.name));
  for (const it of one('african-kingdoms', 'two-doors').items) assert.ok(taughtAbove('african-kingdoms', 'two-doors').includes(it.text.replace(/^The salt mines of |, capital of .*$/g, '')), `two-doors: ${it.text}`);
  // lesson 4
  before('song-china', 'rice-canal', 'canal');
  before('song-china', 'teach-inventions', 'first-use'); has('song-china', 'teach-inventions', one('song-china', 'first-use').pairs.map((p) => p[0]));
  shows('song-china', 'teach-inventions', /wrapping and padding.*Buddhist prayers.*medicine for long life.*fortune-telling/);
  shows('song-china', 'printing', /character stands for a whole word/);
  before('song-china', 'teach-exams', 'exams'); shows('song-china', 'teach-exams', /numbered.*farmer's son.*Women could not.*few hundred/);
  before('song-china', 'teach-neighbours', 'find-city'); before('song-china', 'teach-neighbours', 'neighbours'); before('song-china', 'teach-neighbours', 'when');
  shows('song-china', 'teach-neighbours', /Goryeo.*Kaesong.*celadon.*Hangul.*1443.*Kyoto.*Kana.*Genji.*1010.*Murasaki Shikibu.*938.*Thang Long/);
  // lesson 5
  before('medieval-europe', 'east-rome', 'hagia-sophia'); shows('medieval-europe', 'hagia-sophia', /minarets: tall, slender towers/); shows('medieval-europe', 'manor', /lord.*peasants/);
  before('medieval-europe', 'teach-revival', 'sphere'); before('medieval-europe', 'teach-revival', 'gothic'); shows('medieval-europe', 'teach-revival', /universities.*vault pushes its walls outward.*thick walls and small windows/);
  assert.equal(one('medieval-europe', 'teach-revival').figures[0].type, 'svg');
  before('medieval-europe', 'teach-crusades', 'crusades'); shows('medieval-europe', 'teach-crusades', /1095.*Jerusalem.*Rhineland.*Constantinople.*1099.*Franks.*1204.*sacked/);
  before('medieval-europe', 'teach-two-churches', 'east-west'); before('medieval-europe', 'teach-two-churches', 'find-city');
  shows('medieval-europe', 'teach-two-churches', /pope in Rome.*Latin.*Aachen.*Paris.*patriarch of Constantinople.*Greek.*Cyril and Methodius.*Kyiv.*1054.*Catholic.*Orthodox/);
  // lesson 6
  before('mongols', 'teach-steppe', 'steppe'); shows('mongols', 'teach-steppe', /steppe.*herds.*moved with them/);
  before('mongols', 'teach-army', 'riders'); shows('mongols', 'teach-army', /rider and archer.*spare horses.*ability and loyalty.*engineers.*guns barely existed/);
  before('mongols', 'rise', 'stopped'); before('mongols', 'khanates', 'paiza');
  before('mongols', 'teach-aftermath', 'plague-effects'); shows('mongols', 'teach-aftermath', /1894.*higher wages.*serfs.*falsely accused.*recovered/);
  for (const e of ['chinggis', 'baghdadfalls', 'songfalls', 'blackdeath', 'ming']) assert.ok(shownAbove('mongols', 'after').concat(shownBy('mongols', 'after')).includes(String(DATES[e])), `mongols/after: ${DATES[e]} is shown before the events are put in order`);
  // lesson 7
  before('americas', 'maya-numbers', 'read-number');
  shows('americas', 'maya-fate', /several million people.*Mayan languages/); shows('americas', 'tenochtitlan', /causeways, raised roads of earth and stone/); shows('americas', 'north', /moved, mostly south and east/);
  assert.ok(one('americas', 'inca').widget.markers.some((m) => m.label === 'Cusco'), 'the map of the Inca state marks Cusco');
  before('americas', 'teach-toolkit', 'without'); shows('americas', 'teach-toolkit', /no iron.*No horses and no oxen.*llama.*wheel/);
  before('americas', 'teach-crops', 'crops'); has('americas', 'teach-crops', ['Maize', 'Potatoes', 'Tomatoes', 'Cacao', 'Chilli peppers', 'Wheat', 'Rice', 'Sugar cane', 'Coffee', 'Nahuatl']);
  assert.equal(one('americas', 'crops').items.length, 9);
  before('americas', 'teach-peoples', 'find-site'); before('americas', 'teach-peoples', 'which-people');
});

test('teach before you ask: everything a generated question can ask about has been shown above it', () => {
  // "find it on the map": every place that can be a target (or a wrong marker) is named on a map or in a text above the step
  for (const key of Object.keys(FIND)) {
    const [lesson, id] = key.split('/');
    const above = shownAbove(lesson, id);
    const names = new Set(variants(lesson, id).flatMap((s) => s.widget.markers.map((m) => m.label)));
    assert.ok(names.size >= 5);
    for (const name of names) assert.ok(above.includes(name), `${key}: ${name} is on a map or in a text above the step`);
  }
  // in the lessons that end with a summary map, that one screen names every place of the pool
  for (const [lesson, screen, id] of [['silk-roads', 'teach-passengers', 'find-city'], ['african-kingdoms', 'teach-africa-map', 'find-site'], ['song-china', 'teach-neighbours', 'find-city'],
    ['medieval-europe', 'teach-two-churches', 'find-city'], ['americas', 'teach-peoples', 'find-site']]) {
    const names = new Set(variants(lesson, id).flatMap((s) => s.widget.markers.map((m) => m.label)));
    const labels = one(lesson, screen).figures[0].markers.map((m) => m.label).join(' | ');
    for (const name of names) assert.ok(labels.includes(name), `${lesson}/${screen}: the map names ${name}`);
  }
  // caravan cities and sea ports
  for (const idOfPlace of [...H.OASES, ...H.PORTS]) assert.ok(taughtAbove('silk-roads', 'port-or-oasis').includes(H.PLACES[idOfPlace].name), `port-or-oasis: ${H.PLACES[idOfPlace].name} is on a teaching screen`);
  assert.match(shownBy('silk-roads', 'teach-relay'), /caravan cities of Bukhara and Merv/); assert.match(shownBy('silk-roads', 'monsoon'), /sea ports/);
  // tables of people and places: the teaching table is built from the helper's rows
  for (const row of H.SCHOLARS) { assert.ok(row.brief && row.brief.length <= 64, `${row.name}: a short line for the table`); assert.ok(shownBy('islamic-world', 'teach-scholars').includes(`${row.name} | ${plain(row.brief)}`), `teach-scholars lists ${row.name}`); }
  for (const row of H.AFRICA_SITES) assert.ok(taughtAbove('african-kingdoms', 'match-sites').includes(row.name), `match-sites: ${row.name}`);
  for (const row of H.MONGOL_AGE_PEOPLE) assert.ok(shownAbove('mongols', 'who').includes(row.name.replace(/ Khan$/, '')), `mongols/who: ${row.name} has been introduced`);
  assert.match(shownBy('mongols', 'khanates'), /Hülegü, who had destroyed Baghdad in 1258, founded the Ilkhanate/);
  const peoples = shownBy('americas', 'teach-peoples');
  for (const name of H.AMERICAN_PEOPLES) assert.ok(peoples.includes(name), `teach-peoples lists ${name}`);
  for (const re of [/Glyphs.*twenties.*zero/, /Tikal, Palenque and Copán/, /island in a lake.*chinampa/, /Nahuatl/, /40,000 km of roads.*relay runners/, /quipus/, /earth mounds beside the Mississippi/, /Mesa Verde.*Chaco Canyon/]) assert.match(peoples, re);
  assert.equal(H.AMERICAN_TRAITS.length, 8, 'a new trait needs a word in the table of teach-peoples');
  // dated events: the lesson's closing timeline carries every event the step can draw, with its year in the text
  for (const [lesson, id, draw] of [
    ['islamic-world', 'when', (s) => s.items.map(eventIdOf)], ['medieval-europe', 'when', (s) => s.items.map(eventIdOf)], ['song-china', 'which-first', (s) => s.options.map((o) => eventIdOf(o.text))],
  ]) {
    before(lesson, 'teach-timeline', id);
    const pool = new Set(variants(lesson, id).flatMap(draw));
    const screen = one(lesson, 'teach-timeline');
    const [tl] = specs(screen, 'timeline');
    assert.deepEqual(tl.events.map((e) => e.id).sort(), [...pool].sort(), `${lesson}/teach-timeline shows exactly the events of ${id}`);
    assert.equal(tl.showYears, true);
    for (const e of pool) { assert.ok(flat(screen.text).includes(H.when(e)), `${lesson}/teach-timeline gives the date of ${e}`); assert.ok(tl.alt.includes(`${H.EVENTS[e].short}, ${H.when(e)}`)); }
  }
  // the worked example of the Maya numbers (2 twenties and 8 ones) is never the question that follows
  for (const s of variants('americas', 'read-number', 600)) assert.notEqual(s.answer, 48);
  function before(lesson, a, b) { assert.ok(indexOf(lesson, a) < indexOf(lesson, b), `${lesson}: ${a} comes before ${b}`); }
});

/* ====================================================================== the guard */

test('every generated step of the course was re-solved by this file', () => {
  assert.deepEqual([...covered].sort(), [...GENERATED].sort());
});
