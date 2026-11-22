// Independent checks of "The Modern World: 1750 to Today".
//
// Double entry: this file keeps its own table of the course's key dates and
// places, typed in from the author's verified notes and not imported from
// the course. The course's helper tables must agree with it. Every generated
// question is then re-answered from the text the learner sees, using only the
// tables in this file, for 240 seeds.
//
//   node --test tests/world-modern-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { countryName, countryInfo, countryAt, countryIds, distanceKm, place, regionNames, VIEWS } from '../src/widgets/world-map.js';
import { PLACES, EVENTS, when, inOrder, compass, pinCheck, whichFirst } from '../content/courses/world-modern/helpers.js';
import { RULED_1914 } from '../content/courses/world-modern/lessons/nations-and-empires.js';
import { SOVIET_REPUBLICS, NEVER_SOVIET } from '../content/courses/world-modern/lessons/cold-war-decolonisation.js';
import course from '../content/courses/world-modern/course.js';

const SEEDS = 240;
const COURSE = 'world-modern';

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
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(4099 + k * 7919), id));
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const everyStep = (fn) => { for (const [lid, lesson] of Object.entries(lessons)) for (const step of lesson.steps) fn(lid, step); };

/** Every string a learner can see in a resolved step. */
function visible(step) {
  const out = [];
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!['type', 'id', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'color', 'mode', 'view'].includes(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}
/** Every widget spec of a resolved step: figures, the interact widget, option figures. */
function specsOf(step) {
  const out = [...(step.figures || [])];
  if (step.widget) out.push(step.widget);
  for (const o of step.options || []) if (o.figure) out.push(o.figure);
  return out;
}

/* ============================================================ this file's own facts */

// Dates: [year, month, day]. Typed from verified notes (see the author's report), not copied from helpers.js.
const DATES = {
  newcomen: [1712], wattPatent: [1769], cottonGin: [1793], stockton: [1825], lmRailway: [1830], factoryAct: [1833],
  greatExhibition: [1851], atlanticCable: [1866], suezOpens: [1869], japanRailway: [1872],
  usDeclaration: [1776, 7, 4], usConstitution: [1787], bastille: [1789, 7, 14], haitiRising: [1791, 8], rightsOfWoman: [1791, 9],
  terror: [1793], haitiIndependence: [1804, 1, 1], napoleonEmperor: [1804, 12], napoleonSpain: [1808], hidalgo: [1810],
  andesCrossing: [1817], brazilIndependence: [1822, 9], ayacucho: [1824, 12], brazilAbolition: [1888],
  opiumWar: [1839], nanjingTreaty: [1842], perry: [1853], indianUprising: [1857], italyUnified: [1861], meiji: [1868],
  germanyUnified: [1871], berlinConference: [1884, 11], adwa: [1896], japanBeatsRussia: [1905], congoAnnexed: [1908],
  nzWomenVote: [1893], sarajevo: [1914, 6, 28], austriaDeclares: [1914, 7, 28], russiaMobilises: [1914, 7, 30], germanyDeclares: [1914, 8, 1],
  belgiumInvaded: [1914, 8, 4], armenianGenocide: [1915, 4], somme: [1916, 7], tsarAbdicates: [1917, 3], usEntersWar: [1917, 4],
  bolsheviks: [1917, 11], armistice: [1918, 11, 11], versailles: [1919, 6], usWomenVote: [1920], turkeyRepublic: [1923],
  wallStreet: [1929, 10], manchuria: [1931, 9], hitlerChancellor: [1933, 1], ethiopiaInvaded: [1935, 10], chinaWar: [1937, 7], munich: [1938, 9],
  polandInvaded: [1939, 9, 1], barbarossa: [1941, 6], pearlHarbor: [1941, 12], midway: [1942, 6], stalingradEnds: [1943, 2], dDay: [1944, 6, 6],
  germanySurrenders: [1945, 5, 8], unCharter: [1945, 6, 26], hiroshima: [1945, 8, 6], japanSurrenders: [1945, 9, 2], udhr: [1948, 12],
  nurembergLaws: [1935, 9], novemberPogrom: [1938, 11], massShootings: [1941, 6], deathCamps: [1942], auschwitzLiberated: [1945, 1, 27],
  indiaIndependence: [1947, 8], nato: [1949, 4], chinaRevolution: [1949, 10], koreanWar: [1950, 6], bandung: [1955, 4], warsawPact: [1955, 5],
  ghana: [1957, 3], sputnik: [1957, 10], yearOfAfrica: [1960], berlinWall: [1961, 8], cubanCrisis: [1962, 10], moonLanding: [1969, 7],
  saigonFalls: [1975, 4], wallFalls: [1989, 11], ussrEnds: [1991, 12], mandelaPresident: [1994, 5],
  oneBillion: [1804], twoBillion: [1927], fourBillion: [1974], container: [1956, 4], treatyOfRome: [1957, 3], earthrise: [1968, 12],
  chinaReforms: [1978, 12], montreal: [1987, 9], web: [1989, 3], halfUrban: [2007], parisAgreement: [2015, 12], eightBillion: [2022, 11],
};
const stamp = ([y, m = 1, d = 1]) => y * 10000 + m * 100 + d;

// Places: [longitude, latitude, country]. Rounded by hand from an atlas; '' means open sea or a remote island.
const WHERE = {
  manchester: [-2.2, 53.5, 'GB'], liverpool: [-3.0, 53.4, 'GB'], newcastle: [-1.6, 55.0, 'GB'], birmingham: [-1.9, 52.5, 'GB'],
  glasgow: [-4.3, 55.9, 'GB'], london: [-0.1, 51.5, 'GB'],
  philadelphia: [-75.2, 40.0, 'US'], paris: [2.3, 48.9, 'FR'], capHaitien: [-72.2, 19.8, 'HT'], caracas: [-66.9, 10.5, 'VE'],
  bogota: [-74.1, 4.7, 'CO'], quito: [-78.5, -0.2, 'EC'], guayaquil: [-79.9, -2.2, 'EC'], lima: [-77.0, -12.0, 'PE'],
  buenosAires: [-58.4, -34.6, 'AR'], mendoza: [-68.8, -32.9, 'AR'], santiago: [-70.7, -33.4, 'CL'], rio: [-43.2, -22.9, 'BR'],
  dolores: [-100.9, 21.2, 'MX'], ayacucho: [-74.2, -13.2, 'PE'],
  berlin: [13.4, 52.5, 'DE'], guangzhou: [113.3, 23.1, 'CN'], nanjing: [118.8, 32.1, 'CN'],
  delhi: [77.2, 28.6, 'IN'], adwa: [38.9, 14.2, 'ET'], asmara: [38.9, 15.3, 'ER'], 
  sarajevo: [18.4, 43.9, 'BA'], stPetersburg: [30.3, 59.9, 'RU'], ypres: [2.9, 50.9, 'BE'],
  gallipoli: [26.5, 40.3, 'TR'], 
  baghdad: [44.4, 33.3, 'IQ'], tanga: [39.1, -5.1, 'TZ'], 
  moscow: [37.6, 55.8, 'RU'], stalingrad: [44.5, 48.7, 'RU'], normandy: [-0.6, 49.3, 'FR'], elAlamein: [28.9, 30.8, 'EG'],
  midway: [-177.4, 28.2, ''], pearlHarbor: [-157.9, 21.4, 'US'], 
  
  havana: [-82.4, 23.1, 'CU'], seoul: [127.0, 37.6, 'KR'], hanoi: [105.8, 21.0, 'VN'],
  bandung: [107.6, -6.9, 'ID'], accra: [-0.2, 5.6, 'GH'], beijing: [116.4, 39.9, 'CN'], 
  
  suezCanal: [32.4, 30.5, 'EG'], panamaCanal: [-79.7, 9.1, 'PA'], malacca: [100.6, 3.2, ''], gibraltar: [-5.6, 36.0, ''], goodHope: [18.5, -34.4, 'ZA'],
  shenzhen: [114.1, 22.5, 'CN'], shanghai: [121.5, 31.2, 'CN'], 
};
// The name under which the map widget's own city table knows a place (where it has it), as a third opinion.
const CITY_TABLE = {
  manchester: 'Manchester', birmingham: 'Birmingham', glasgow: 'Glasgow', london: 'London', philadelphia: 'Philadelphia', paris: 'Paris',
  caracas: 'Caracas', bogota: 'Bogota', quito: 'Quito', guayaquil: 'Guayaquil', lima: 'Lima', buenosAires: 'Buenos Aires', mendoza: 'Mendoza',
  santiago: 'Santiago', rio: 'Rio de Janeiro', berlin: 'Berlin', guangzhou: 'Guangzhou', nanjing: 'Nanjing', delhi: 'Delhi',
  sarajevo: 'Sarajevo', stPetersburg: 'Saint Petersburg', 
  baghdad: 'Baghdad', moscow: 'Moscow', stalingrad: 'Volgograd', 
  havana: 'Havana', seoul: 'Seoul', hanoi: 'Hanoi', bandung: 'Bandung', accra: 'Accra', 
  beijing: 'Beijing', shenzhen: 'Shenzhen', shanghai: 'Shanghai', pearlHarbor: 'Honolulu',
};

// Who ruled where in 1914 (this file's own list).
const RULER_1914 = {
  NG: 'Britain', KE: 'Britain', GH: 'Britain', IN: 'Britain', SN: 'France', DZ: 'France', MG: 'France', VN: 'France', CD: 'Belgium',
  AO: 'Portugal', MZ: 'Portugal', NA: 'Germany', CM: 'Germany', LY: 'Italy', ID: 'the Netherlands', PH: 'the United States', KR: 'Japan',
};
// The fifteen Soviet republics, by today's country codes.
const USSR = ['RU', 'UA', 'BY', 'MD', 'EE', 'LV', 'LT', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'KG', 'TJ'];

// Marker questions: a few words of each clue, and the place it must lead to.
const CLUES = {
  'industrial-revolution/find-town': { Cottonopolis: 'manchester', 'bales of raw cotton': 'liverpool', 'River Tyne': 'newcastle', 'Boulton and Watt': 'birmingham', 'Scottish city': 'glasgow', 'the capital': 'london' },
  'age-of-revolutions/find-scene': { 'Declaration of Independence': 'philadelphia', Bastille: 'paris', 'enslaved people rose': 'capHaitien', 'Simón Bolívar': 'caracas', 'San Martín': 'buenosAires', 'Brazilian empire': 'rio', 'Miguel Hidalgo': 'dolores' },
  'first-world-war/fronts': { 'Western Front': 'ypres', 'shots that began the war': 'sarajevo', 'Russian capital': 'stPetersburg', 'Ottoman troops threw back': 'gallipoli', 'on the Tigris': 'baghdad', 'East African port': 'tanga' },
  'second-world-war/turning-points': { Stalingrad: 'stalingrad', Midway: 'midway', 'El Alamein': 'elAlamein', Normandy: 'normandy', 'Pearl Harbor': 'pearlHarbor' },
  'cold-war-decolonisation/hot-spots': { 'divided by a wall': 'berlin', 'Soviet missiles': 'havana', 'peninsula divided in 1945': 'seoul', 'first France and then the United States': 'hanoi', '29 Asian and African countries': 'bandung', 'capital of Ghana': 'accra', 'capital of India': 'delhi' },
  'globalisation/chokepoints': { 'Suez Canal': 'suezCanal', 'Panama Canal': 'panamaCanal', 'Strait of Malacca': 'malacca', 'Strait of Gibraltar': 'gibraltar', 'Cape of Good Hope': 'goodHope' },
};
// Country questions: the name in the instruction, and the code it must lead to.
const COUNTRY_CLUES = {
  'nations-and-empires/find-country': { Italy: 'IT', Germany: 'DE', Japan: 'JP', Ethiopia: 'ET', Liberia: 'LR', 'Democratic Republic of the Congo': 'CD', Thailand: 'TH' },
  'first-world-war/new-map': { Poland: 'PL', Finland: 'FI', Estonia: 'EE', Lithuania: 'LT', Hungary: 'HU', Czechia: 'CZ', Turkey: 'TR', Iraq: 'IQ', Syria: 'SY' },
};
const WHICH_FIRST = ['industrial-revolution', 'age-of-revolutions', 'first-world-war', 'second-world-war', 'globalisation'].map((l) => `${l}/which-first`);
const COVERED = new Set([...Object.keys(CLUES), ...Object.keys(COUNTRY_CLUES), ...WHICH_FIRST, 'nations-and-empires/who-ruled', 'cold-war-decolonisation/soviet-or-ally']);

// Events that must never be turned into quiz material (the brief: no game-like interactions on atrocity content).
const NEVER_QUIZZED = ['armenianGenocide', 'hiroshima', 'nurembergLaws', 'novemberPogrom', 'massShootings', 'deathCamps', 'auschwitzLiberated'];
const SOBER_STEPS = [['first-world-war', 'armenian-genocide'], ['nations-and-empires', 'congo'], ['second-world-war', 'holocaust'], ['second-world-war', 'stolpersteine'], ['second-world-war', 'hiroshima'], ['cold-war-decolonisation', 'partition']];

const labelToId = new Map(Object.entries(EVENTS).map(([id, e]) => [e.label, id]));
const nameToCode = new Map(countryIds('world', { territories: true }).map((id) => [countryName(id), id]));

/* ============================================================ the course as a whole */

test('course shape: seven lessons, each with a map, a hands-on step, review steps, generated steps and a recap', () => {
  assert.equal(course.id, COURSE);
  assert.deepEqual(Object.keys(lessons), ['industrial-revolution', 'age-of-revolutions', 'nations-and-empires', 'first-world-war', 'second-world-war', 'cold-war-decolonisation', 'globalisation']);
  for (const [id, lesson] of Object.entries(lessons)) {
    const n = lesson.steps.length;
    assert.ok(n >= 11 && n <= 20, `${id}: ${n} steps`);      // 17 to 19 since the teaching screens were added (never more than 20)
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    assert.ok(lesson.steps.filter((s) => typeof s.gen === 'function').length >= 2, `${id}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${id}: at most five choice steps`);
    const hands = lesson.steps.filter((s) => s.type === 'interact').length;
    assert.ok(hands >= 2, `${id}: ${hands} interact steps`);
    let maps = 0;
    let gradedMap = 0;
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(3), step.id);
      const specs = specsOf(s);
      if (specs.some((sp) => sp.type === 'world-map')) maps++;
      if (s.type === 'interact' && s.widget.type === 'world-map') gradedMap++;
    }
    assert.ok(maps >= 2, `${id}: ${maps} steps with a map`);
    assert.ok(gradedMap >= 1, `${id}: a graded map step`);
    assert.ok(lesson.steps.some((s) => s.type === 'order') || lesson.steps.some((s) => specsOf(resolveStep(s, makeRng(3), s.id)).some((sp) => sp.type === 'timeline')), `${id}: anchored in time`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next, `${id}: next`);
    assert.equal(lesson.steps[0].mode, 'predict', `${id}: opens with a prediction`);
  }
});

test('no learner-visible text contains undefined, NaN or an object', () => {
  everyStep((lid, step) => {
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(77 + k * 131), step.id);
      for (const text of visible(s)) assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), `${lid}/${step.id} seed ${k}: ${text}`);
      if (!step.gen) break;
    }
  });
  for (const lesson of Object.values(lessons)) for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
});

test('choice: exactly one correct option, no duplicates; multi, match, bucket and fill are well formed', () => {
  let seen = 0;
  everyStep((lid, step) => {
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(5 + k * 97), step.id);
      const where = `${lid}/${step.id} seed ${k}`;
      if (s.type === 'choice' || s.type === 'multi') {
        const right = s.options.filter((o) => o.correct).length;
        if (s.type === 'choice') assert.equal(right, 1, where);
        else assert.ok(right >= 1 && right < s.options.length, where);
        assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, `${where}: duplicate options`);
        for (const o of s.options) assert.ok(flat(o.text).length > 0, `${where}: an option without text`);
        seen++;
      }
      if (s.type === 'match') assert.equal(new Set(s.pairs.map((p) => p[0])).size, s.pairs.length, `${where}: left items are unique`);
      if (s.type === 'match') assert.equal(new Set(s.pairs.map((p) => p[1])).size, s.pairs.length, `${where}: right items are unique`);
      if (s.type === 'bucket') for (let b = 0; b < s.buckets.length; b++) assert.ok(s.items.some((it) => it.bucket === b), `${where}: empty bucket`);
      if (s.type === 'fill') {
        for (const blank of s.blanks) {
          assert.equal(blank.kind, 'select', `${where}: blanks are dropdowns (no typed years)`);
          assert.ok(blank.options.includes(blank.answer) && new Set(blank.options).size === blank.options.length, where);
        }
        // dropdowns are shown in the order written: the right answer must not always be the first entry
        assert.ok(s.blanks.some((b) => b.options[0] !== b.answer), `${where}: the answer is first in every dropdown`);
      }
      if (s.graded) assert.ok(s.explain, `${where}: graded steps explain`);
      if (!step.gen) break;
    }
  });
  assert.ok(seen > 600, `${seen} choice variants checked`);
});

test('guard: every generated step is covered by a test in this file', () => {
  const generated = [];
  everyStep((lid, step) => { if (typeof step.gen === 'function') generated.push(`${lid}/${step.id}`); });
  assert.deepEqual(generated.filter((g) => !COVERED.has(g)), [], 'generated steps without a test');
  assert.deepEqual([...COVERED].filter((g) => !generated.includes(g)), [], 'tests for generated steps that no longer exist');
});

/* ============================================================ double entry: dates and places */

test('dates: the course\'s event table agrees with this file\'s table, entry by entry', () => {
  assert.deepEqual(Object.keys(EVENTS).sort(), Object.keys(DATES).sort(), 'the same events in both tables');
  for (const [id, e] of Object.entries(EVENTS)) {
    const [y, m, d] = DATES[id];
    assert.equal(e.year, y, `${id}: year`);
    if (m != null || e.month != null) assert.equal(e.month, m, `${id}: month`);
    if (d != null || e.day != null) assert.equal(e.day, d, `${id}: day`);
    assert.ok(e.label && e.label.length <= 70, `${id}: label`);
    assert.ok(Number.isInteger(e.year) && e.year >= 1700 && e.year <= 2026 && e.year !== 0, `${id}: a modern year`);
  }
  assert.equal(new Set(Object.values(EVENTS).map((e) => e.label)).size, Object.keys(EVENTS).length, 'labels are unique');
  // the sorting key orders events inside one year correctly
  const ids = Object.keys(DATES);
  for (const a of ids) for (const b of ids) if (stamp(DATES[a]) < stamp(DATES[b])) assert.ok(when(EVENTS[a]) < when(EVENTS[b]), `${a} sorts before ${b}`);
  assert.deepEqual(inOrder(['armistice', 'sarajevo', 'versailles']), [EVENTS.sarajevo.label, EVENTS.armistice.label, EVENTS.versailles.label]);
});

test('places: valid [lon, lat], where this file says, inside the stated country, and matching the widget\'s city table', () => {
  assert.deepEqual(Object.keys(PLACES).sort(), Object.keys(WHERE).sort(), 'the same places in both tables');
  for (const [id, p] of Object.entries(PLACES)) {
    const [lon, lat] = p.at;
    assert.ok(Array.isArray(p.at) && p.at.length === 2 && Math.abs(lon) <= 180 && Math.abs(lat) <= 90, `${id}: a [lon, lat] pair`);
    const [wlon, wlat, wcountry] = WHERE[id];
    assert.ok(distanceKm(p.at, [wlon, wlat]) <= 25, `${id}: ${Math.round(distanceKm(p.at, [wlon, wlat]))} km from where this file puts it`);
    assert.equal(p.country, wcountry, `${id}: country`);
    if (wcountry) {
      assert.ok(countryInfo(wcountry), `${id}: ${wcountry} is a known code`);
      // a swapped pair would land in another country, or in the sea
      // (exactly at first; a port may sit a few kilometres off the simplified coastline, so then with 40 km of grace)
      // Two places are skipped: Hawaii has no shape on the coarse layer, and Shenzhen, 30 km from Hong Kong, falls on Hong Kong's
      // marker ring there. Both are pinned down by the city-table check below instead.
      if (!['pearlHarbor', 'shenzhen'].includes(id)) assert.equal(countryAt(p.at) || countryAt(p.at, 'low', 40), wcountry, `${id} lies in ${wcountry}`);
      else assert.ok(CITY_TABLE[id], `${id} is checked against the city table`);
    } else if (id === 'midway') assert.equal(countryAt(p.at), null, 'Midway is open ocean on the map');
    if (CITY_TABLE[id]) {
      const known = place(CITY_TABLE[id]);
      assert.ok(known, `${CITY_TABLE[id]} is in the widget's table`);
      assert.ok(distanceKm(p.at, known) <= 30, `${id}: ${Math.round(distanceKm(p.at, known))} km from the widget's ${CITY_TABLE[id]}`);
    }
  }
  // a few relations that would break if a pair were swapped or a sign lost
  assert.ok(PLACES.liverpool.at[0] < PLACES.manchester.at[0], 'Liverpool is west of Manchester');
  assert.ok(Math.abs(distanceKm(PLACES.liverpool.at, PLACES.manchester.at) - 50) < 8, 'and about 50 km from it');
  assert.ok(Math.abs(distanceKm(PLACES.moscow.at, PLACES.stalingrad.at) - 900) < 60, 'Stalingrad is about 900 km from Moscow');
  assert.ok(PLACES.guayaquil.at[1] < 0 && PLACES.quito.at[1] < 0 && PLACES.bogota.at[1] > 0, 'the equator runs between Bogotá and Quito');
  assert.ok(PLACES.midway.at[0] < -170 && PLACES.pearlHarbor.at[0] < -150, 'Midway and Hawaii are west longitudes');
});

test('every country code, region name, view and coordinate used on any map is valid', () => {
  const regions = new Set(regionNames());
  const okId = (id) => !!countryInfo(id) || regions.has(id);
  const point = (p, where) => {
    if (typeof p === 'string') { assert.ok(PLACES[p] || place(p), `${where}: unknown place "${p}"`); return; }
    assert.ok(Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90, `${where}: bad point ${JSON.stringify(p)}`);
  };
  let maps = 0;
  everyStep((lid, step) => {
    for (let k = 0; k < 60; k++) {
      const s = resolveStep(step, makeRng(11 + k * 389), step.id);
      for (const spec of specsOf(s)) {
        if (spec.type !== 'world-map') continue;
        maps++;
        const where = `${lid}/${step.id}`;
        assert.ok(spec.alt && spec.alt.length > 20, `${where}: the map has an alt text`);
        const v = spec.view;
        if (typeof v === 'string') assert.ok(v in VIEWS || okId(v), `${where}: view "${v}"`);
        else if (Array.isArray(v) && typeof v[0] === 'number') {
          assert.equal(v.length, 4, `${where}: a box has four numbers`);
          assert.ok(Math.abs(v[0]) <= 180 && Math.abs(v[2]) <= 180 && v[1] < v[3] && Math.abs(v[1]) <= 90 && Math.abs(v[3]) <= 90, `${where}: box ${v} is [west, south, east, north]`);
        } else if (Array.isArray(v)) for (const id of v) assert.ok(okId(id), `${where}: view member "${id}"`);
        else if (v && v.center) point(v.center, where);
        for (const group of spec.regions || []) for (const id of [].concat(group.ids)) assert.ok(okId(id), `${where}: region id "${id}"`);
        for (const id of spec.pickable || []) assert.ok(okId(id) || (spec.markers || []).some((m) => m.id === id), `${where}: pickable "${id}"`);
        if (['pick', 'pickMany'].includes(spec.mode)) for (const id of [].concat(spec.answer)) assert.ok(countryInfo(id), `${where}: answer "${id}"`);
        for (const l of Array.isArray(spec.labels) ? spec.labels : []) { if (typeof l === 'string') assert.ok(okId(l), `${where}: label "${l}"`); else if (l.at) point(l.at, where); }
        for (const m of spec.markers || []) point(m.at, `${where} marker ${m.id || m.label}`);
        for (const line of spec.lines || []) for (const p of line.points) { if (typeof p === 'string') assert.ok((spec.markers || []).some((m) => m.id === p) || place(p), `${where}: line point "${p}"`); else point(p, where); }
        for (const area of spec.areas || []) {
          if (area.polygon) area.polygon.forEach((p) => point(p, `${where} polygon`));
          if (area.circle) point(area.circle, `${where} circle`);
        }
        if (spec.target) point(spec.target, where);
        if (s.solution && s.solution.pin) point(s.solution.pin, where);
      }
      if (!step.gen) break;
    }
  });
  assert.ok(maps >= 30, `${maps} maps checked`);
  for (const t of RULED_1914) assert.ok(countryInfo(t.code) && (t.view in VIEWS), `${t.code}: code and view`);
  for (const id of [...SOVIET_REPUBLICS, ...NEVER_SOVIET.map((n) => n.code)]) assert.ok(countryInfo(id), id);
});

/* ============================================================ time: order steps and timelines */

test('every "order" step lists its events in true chronological order', () => {
  let n = 0;
  everyStep((lid, step) => {
    if (step.type !== 'order') return;
    const s = resolveStep(step, makeRng(1), step.id);
    const ids = s.items.map((label) => { const id = labelToId.get(label); assert.ok(id, `${lid}/${step.id}: "${label}" is an event of the table`); return id; });
    for (let i = 1; i < ids.length; i++) assert.ok(stamp(DATES[ids[i - 1]]) < stamp(DATES[ids[i]]), `${lid}/${step.id}: ${ids[i - 1]} comes before ${ids[i]}`);
    assert.ok(ids.length >= 4 && ids.length <= 7, `${lid}/${step.id}: ${ids.length} items`);
    for (const id of ids) assert.ok(!NEVER_QUIZZED.includes(id), `${lid}/${step.id}: ${id} is not quiz material`);
    // the years quoted in the explanation are the right ones, in order (steps inside one year quote none)
    const quoted = [...s.explain.matchAll(/\*\*(\d{4})\*\*/g)].map((m) => Number(m[1]));
    if (quoted.length) assert.deepEqual(quoted, ids.map((id) => DATES[id][0]), `${lid}/${step.id}: years in the explanation`);
    n++;
  });
  assert.equal(n, 6, 'six order steps');
  assert.deepEqual(one('first-world-war', 'chain').items.map((l) => labelToId.get(l)), ['sarajevo', 'austriaDeclares', 'russiaMobilises', 'germanyDeclares', 'belgiumInvaded']);
});

test('timelines: every event sits at its year, on the axis; placement checks accept the solution and reject a miss', () => {
  let timelines = 0;
  everyStep((lid, step) => {
    const s = resolveStep(step, makeRng(1), step.id);
    for (const spec of specsOf(s)) {
      if (spec.type !== 'timeline') continue;
      timelines++;
      for (const e of spec.events || []) {
        assert.ok(DATES[e.id], `${lid}/${step.id}: event ${e.id}`);
        assert.equal(e.year, DATES[e.id][0], `${lid}/${step.id}: ${e.id} at its year`);
        assert.ok(e.year >= spec.from && e.year <= spec.to, `${lid}/${step.id}: ${e.id} on the axis`);
      }
      for (const card of spec.place || []) assert.equal(card.answer, DATES[card.id][0], `${lid}/${step.id}: card ${card.id}`);
    }
  });
  assert.ok(timelines >= 4, `${timelines} timelines`);

  for (const [lid, sid, tol] of [['industrial-revolution', 'when', 25], ['globalisation', 'billions', 20]]) {
    const s = one(lid, sid);
    const cards = s.widget.place;
    const full = (placed) => ({ placed, count: cards.length, complete: true });
    assert.equal(s.check(full(s.solution.placed)), true, `${lid}/${sid}: the solution passes`);
    assert.match(flat(s.text), new RegExp(`[Ww]ithin ${tol} years`), `${lid}/${sid}: the text states the tolerance`);
    const exact = Object.fromEntries(cards.map((c) => [c.id, DATES[c.id][0]]));
    assert.equal(s.check(full(exact)), true, 'the exact years pass');
    assert.equal(typeof s.check({ placed: { ...exact, [cards[0].id]: null }, count: cards.length - 1, complete: false }), 'string', 'an unplaced card is asked for');
    for (const c of cards) {
      for (const sign of [-1, 1]) {
        const inside = { ...exact, [c.id]: exact[c.id] + sign * tol };
        const outside = { ...exact, [c.id]: exact[c.id] + sign * (tol + s.widget.snap) };
        assert.equal(s.check(full(inside)), true, `${lid}/${sid}: ${c.id} ${sign * tol} years off still counts`);
        const verdict = s.check(full(outside));
        assert.equal(typeof verdict, 'string', `${lid}/${sid}: ${c.id} ${sign * (tol + s.widget.snap)} years off is rejected with a message`);
      }
    }
  }
});

/* ============================================================ generated questions */

test('"which came first / last": the marked answer is right by this file\'s dates, clearly, and never uses atrocity events', () => {
  for (const key of WHICH_FIRST) {
    const [lid, sid] = key.split('/');
    const seen = new Set();
    for (const s of variants(lid, sid)) {
      const m = /happened \*\*(first|last)\*\*/.exec(s.text);
      assert.ok(m, `${key}: asks for first or last`);
      const ids = s.options.map((o) => labelToId.get(o.text));
      assert.ok(ids.every(Boolean) && new Set(ids).size === 3, `${key}: three different events`);
      for (const id of ids) assert.ok(!NEVER_QUIZZED.includes(id), `${key}: ${id} must not be quiz material`);
      const years = ids.map((id) => DATES[id][0]);
      const sorted = [...years].sort((a, b) => a - b);
      const want = m[1] === 'first' ? sorted[0] : sorted[2];
      const gap = m[1] === 'first' ? sorted[1] - sorted[0] : sorted[2] - sorted[1];
      assert.ok(gap >= 3, `${key}: the answer is at least three years clear of the others (${years})`);
      const right = s.options.filter((o) => o.correct);
      assert.equal(right.length, 1, key);
      assert.equal(DATES[labelToId.get(right[0].text)][0], want, `${key}: ${right[0].text}`);
      for (const o of s.options) if (!o.correct) assert.equal(o.why, `That was in ${DATES[labelToId.get(o.text)][0]}.`, `${key}: the feedback quotes the right year`);
      const listed = [...s.explain.matchAll(/\*\*(\d{4})\*\*: ([^\n]+)/g)].map((x) => [Number(x[1]), x[2].trim()]);
      assert.deepEqual(listed.map((x) => x[0]), sorted, `${key}: the explanation lists the years in order`);
      for (const [y, label] of listed) assert.equal(DATES[labelToId.get(label)][0], y, `${key}: ${label} (${y})`);
      seen.add(ids.slice().sort().join());
    }
    assert.ok(seen.size >= 8, `${key}: ${seen.size} different trios`);
  }
  assert.throws(() => whichFirst(makeRng(1), ['sarajevo', 'austriaDeclares', 'germanyDeclares']), /no clear trio/, 'events of one summer are refused');
});

test('"which marker is …?": the clue leads to the marked place; every other marker is rejected with its name', () => {
  for (const [key, clues] of Object.entries(CLUES)) {
    const [lid, sid] = key.split('/');
    const hit = new Set();
    for (const s of variants(lid, sid)) {
      const question = /\*\*Which marker is (.+)\?\*\*/.exec(flat(s.text));
      assert.ok(question, `${key}: has a question`);
      const matches = Object.keys(clues).filter((words) => question[1].includes(words));
      assert.equal(matches.length, 1, `${key}: exactly one clue matches "${question[1]}"`);
      const want = clues[matches[0]];
      hit.add(want);
      const w = s.widget;
      assert.equal(w.type, 'world-map');
      assert.equal(w.mode, 'pickMarker');
      assert.equal(w.markerLabels, 'after', `${key}: names are hidden until the answer`);
      assert.equal(w.answer, want, `${key}: answer`);
      assert.deepEqual(s.solution, { picked: want }, `${key}: solution`);
      assert.deepEqual(w.markers.map((mk) => mk.id).sort(), Object.values(clues).sort(), `${key}: all the places are on the map`);
      for (const mk of w.markers) {
        const [lon, lat] = WHERE[mk.id];
        assert.ok(distanceKm(mk.at, [lon, lat]) <= 25, `${key}: marker ${mk.id} is in the right place`);
        const verdict = s.check({ picked: mk.id });
        if (mk.id === want) assert.equal(verdict, true, `${key}: ${want} is accepted`);
        else {
          assert.equal(typeof verdict, 'string', `${key}: ${mk.id} is rejected with a message`);
          assert.ok(verdict.includes(PLACES[mk.id].name), `${key}: the message names ${mk.id}`);
        }
      }
      assert.equal(s.check({ picked: null }), false, `${key}: nothing picked`);
      assert.ok(s.explain.includes(`**${PLACES[want].name}**`), `${key}: the explanation names the place`);
      assert.ok(!flat(s.text).includes(PLACES[want].name) || question[1].includes(PLACES[want].name), `${key}: the lead does not give the answer away`);
      // markers must be far enough apart to tap: more than 40 km, and no two in the same spot
      for (const a of w.markers) for (const b of w.markers) if (a.id < b.id) assert.ok(distanceKm(a.at, b.at) > 40, `${key}: ${a.id} and ${b.id}`);
    }
    assert.deepEqual([...hit].sort(), Object.values(clues).sort(), `${key}: every place is asked for`);
  }
});

test('"tap the country": the named country is the answer; neighbours are rejected with their names', () => {
  const neighbours = { IT: ['FR', 'ES', 'GR'], DE: ['PL', 'FR', 'AT'], JP: ['KR', 'CN', 'KP'], ET: ['SD', 'KE', 'SO'], LR: ['SL', 'CI', 'GN'], CD: ['CG', 'AO', 'TD'], TH: ['MM', 'VN', 'KH'],
    PL: ['DE', 'UA', 'BY'], FI: ['SE', 'NO', 'EE'], EE: ['LV', 'LT', 'FI'], LT: ['LV', 'EE', 'PL'], HU: ['AT', 'RO', 'SK'], CZ: ['SK', 'AT', 'PL'], TR: ['SY', 'IR', 'GR'], IQ: ['IR', 'SY', 'SA'], SY: ['IQ', 'TR', 'JO'] };
  for (const [key, clues] of Object.entries(COUNTRY_CLUES)) {
    const [lid, sid] = key.split('/');
    const hit = new Set();
    for (const s of variants(lid, sid)) {
      const text = flat(s.text);
      const matches = Object.keys(clues).filter((name) => new RegExp(`^\\*\\*Tap (the )?${name}\\b`).test(text));
      assert.equal(matches.length, 1, `${key}: one country is named in "${text}"`);
      const want = clues[matches[0]];
      hit.add(want);
      assert.equal(s.widget.mode, 'pick');
      assert.equal(s.widget.answer, want, key);
      assert.deepEqual(s.solution, { picked: want }, key);
      assert.equal(s.check({ picked: want, name: countryName(want) }), true, `${key}: ${want} accepted`);
      assert.equal(s.check({ picked: null, name: null }), false, key);
      for (const other of neighbours[want]) {
        const verdict = s.check({ picked: other, name: countryName(other) });
        assert.equal(typeof verdict, 'string', `${key}: ${other} rejected with a message`);
        assert.ok(verdict.includes(countryName(other)), `${key}: the message names ${other}`);
      }
      assert.ok(s.explain.startsWith(`**${countryName(want)}**`), `${key}: the explanation names ${want}`);
      // the view shows the country: its centre lies inside the window
      const box = VIEWS[s.widget.view];
      const c = countryInfo(want).center;
      assert.ok(box && c[0] > box[0] && c[0] < box[2] && c[1] > box[1] && c[1] < box[3], `${key}: ${want} is inside the view "${s.widget.view}"`);
    }
    assert.deepEqual([...hit].sort(), Object.values(clues).sort(), `${key}: every country is asked for`);
  }
});

test('"which power ruled it in 1914?": one correct option, agreeing with this file\'s list; the map shows that country', () => {
  assert.deepEqual(Object.fromEntries(RULED_1914.map((t) => [t.code, t.by])), RULER_1914, 'the lesson\'s table agrees with this file\'s');
  const hit = new Set();
  for (const s of variants('nations-and-empires', 'who-ruled')) {
    const name = /highlighted country is \*\*(.+?)\*\*/.exec(flat(s.text))[1];
    // Korea was one country in 1914: the question names it so and tints the whole peninsula
    const code = name === 'Korea' ? 'KR' : nameToCode.get(name);
    assert.ok(code && RULER_1914[code], `${name} is in the list`);
    assert.notEqual(name, 'South Korea', 'today\'s South Korea is not named as a country of 1914');
    hit.add(code);
    assert.match(s.text, /1914/);
    const right = s.options.filter((o) => o.correct);
    assert.equal(right.length, 1);
    assert.equal(right[0].text.toLowerCase(), RULER_1914[code].toLowerCase(), `${name}: ${right[0].text}`);
    assert.equal(s.options.length, 4);
    assert.equal(new Set(s.options.map((o) => o.text.toLowerCase())).size, 4, 'four different powers');
    const map = s.figures[0];
    assert.deepEqual(map.regions[0].ids, code === 'KR' ? ['KR', 'KP'] : [code], `${name} is the highlighted country`);
    const box = VIEWS[map.view];
    const c = countryInfo(code).center;
    assert.ok(c[0] > box[0] && c[0] < box[2] && c[1] > box[1] && c[1] < box[3], `${name} is inside the view "${map.view}"`);
    assert.ok(s.explain.toLowerCase().startsWith(`**${RULER_1914[code].toLowerCase()}.**`), `${name}: the explanation starts with the ruler`);
  }
  assert.equal(hit.size, Object.keys(RULER_1914).length, 'every country of the list is asked');
});

test('"which was inside the Soviet Union?": the right option is a Soviet republic and no other option is', () => {
  assert.deepEqual([...SOVIET_REPUBLICS, 'RU'].sort(), [...USSR].sort(), 'fifteen republics');
  for (const n of NEVER_SOVIET) assert.ok(!USSR.includes(n.code), `${n.code} was never a Soviet republic`);
  const hit = new Set();
  for (const s of variants('cold-war-decolonisation', 'soviet-or-ally')) {
    const codes = s.options.map((o) => nameToCode.get(o.text));
    assert.ok(codes.every(Boolean), 'options are countries');
    assert.equal(new Set(codes).size, 4);
    const inside = s.options.filter((o) => USSR.includes(nameToCode.get(o.text)));
    assert.equal(inside.length, 1, `exactly one Soviet republic among ${codes}`);
    assert.equal(inside[0].correct, true);
    assert.equal(s.options.filter((o) => o.correct).length, 1);
    for (const o of s.options) if (!o.correct) assert.ok(o.why && /never|always|separate|neither|kept its independence/.test(o.why), `${o.text}: says why not`);
    assert.ok(s.explain.includes(inside[0].text));
    assert.match(flat(s.text), /15 republics/);
    hit.add(codes[s.options.findIndex((o) => o.correct)]);
  }
  assert.equal(hit.size, SOVIET_REPUBLICS.length, 'every republic is asked for');
});

/* ============================================================ fixed map and photo interactions */

test('fixed pick steps accept the solution and reject plausible wrong states with a message', () => {
  const named = (id) => ({ picked: id, name: countryName(id) });
  const cases = [
    ['industrial-revolution', 'cottonopolis', { picked: 'manchester' }, [{ picked: 'liverpool' }, { picked: 'london' }, { picked: 'newcastle' }, { picked: 'glasgow' }]],
    ['industrial-revolution', 'belgium', named('BE'), [named('NL'), named('FR'), named('DE'), named('LU')]],
    ['industrial-revolution', 'mule', { picked: 'scavenger' }, [{ picked: 'spinner' }, { picked: 'piecer' }]],
    ['age-of-revolutions', 'find-haiti', named('HT'), [named('DO'), named('CU'), named('JM'), named('PR')]],
    ['age-of-revolutions', 'liberators', { picked: 'guayaquil' }, [{ picked: 'lima' }, { picked: 'caracas' }, { picked: 'santiago' }, { picked: 'bogota' }]],
    ['nations-and-empires', 'siam', named('TH'), [named('CN'), named('NP'), named('MM'), named('VN')]],
    ['cold-war-decolonisation', 'iron-curtain', named('DE'), [named('AT'), named('PL'), named('CZ'), named('FR')]],
    ['cold-war-decolonisation', 'ghana', named('GH'), [named('CI'), named('TG'), named('NG'), named('SN')]],
  ];
  // the closing step of lesson 6 reads a photograph; without the picture it falls back to a map
  cases.push(one('cold-war-decolonisation', 'korea-night').widget.type === 'photo'
    ? ['cold-war-decolonisation', 'korea-night', { picked: 'north' }, [{ picked: 'south' }, { picked: 'china' }]]
    : ['cold-war-decolonisation', 'korea-night', named('KP'), [named('KR'), named('CN'), named('JP')]]);
  for (const [lid, sid, good, bad] of cases) {
    const s = one(lid, sid);
    assert.equal(s.check({ ...s.solution, name: good.name }), true, `${lid}/${sid}: the solution passes`);
    assert.equal(s.check(good), true, `${lid}/${sid}: the right pick passes`);
    assert.equal(s.solution.picked, good.picked, `${lid}/${sid}: solution`);
    if (s.widget.type === 'world-map') assert.equal(s.widget.answer, good.picked, `${lid}/${sid}: the revealed answer is the checked one`);
    for (const state of bad) assert.equal(typeof s.check(state), 'string', `${lid}/${sid}: ${state.picked} is rejected with a message`);
    assert.equal(s.check({ picked: null, name: null }), false, `${lid}/${sid}: nothing picked`);
    if (s.widget.pickable) for (const state of [good, ...bad]) assert.ok(s.widget.pickable.includes(state.picked), `${lid}/${sid}: ${state.picked} can be tapped`);
    if (s.widget.type === 'photo') {
      const ids = s.widget.hotspots.map((h) => h.id);
      for (const state of [good, ...bad]) assert.ok(ids.includes(state.picked), `${lid}/${sid}: hotspot ${state.picked}`);
      for (const h of s.widget.hotspots) assert.ok(h.x > 0 && h.x < 1 && h.y > 0 && h.y < 1 && h.r >= 0.05 && h.label && h.alt, `${lid}/${sid}: hotspot ${h.id}`);
    }
  }
  // the two independent African states of 1914
  const two = one('nations-and-empires', 'two-free');
  assert.equal(two.check({ picked: ['ET', 'LR'], count: 2 }), true);
  assert.deepEqual([...two.solution.picked].sort(), ['ET', 'LR']);
  assert.deepEqual([...two.widget.answer].sort(), ['ET', 'LR']);
  for (const picked of [['ET'], ['LR'], ['ET', 'SL'], ['EG', 'LR'], ['MA', 'ZA'], []]) {
    const verdict = two.check({ picked: [...picked].sort(), count: picked.length });
    assert.equal(typeof verdict, 'string', `two-free: ${picked} is rejected with a message`);
  }
  assert.match(two.check({ picked: ['EG', 'LR'], count: 2 }), /Egypt was under European rule/);
});

test('pin steps: the solution and the true place pass; a pin beyond the stated distance fails and is told how far and which way', () => {
  for (const [lid, sid, id, km] of [['first-world-war', 'sarajevo', 'sarajevo', 250], ['second-world-war', 'stalingrad', 'stalingrad', 400], ['globalisation', 'shenzhen', 'shenzhen', 400]]) {
    const s = one(lid, sid);
    const target = [WHERE[id][0], WHERE[id][1]];
    assert.equal(s.widget.mode, 'place');
    assert.ok(distanceKm(s.widget.target, target) <= 25, `${lid}/${sid}: the target is the place`);
    assert.match(flat(s.text), new RegExp(`within ${km} km`), `${lid}/${sid}: the text states the tolerance`);
    assert.equal(s.check({ pin: s.solution.pin, placed: true }), true, `${lid}/${sid}: the solution passes`);
    assert.equal(s.check({ pin: target, placed: true }), true);
    assert.equal(typeof s.check({ pin: target, placed: false }), 'string', 'an untouched pin is not an answer');
    // walk away from the place in four directions: inside the tolerance passes, outside fails with a direction
    const deg = km / 111;
    for (const [dx, dy, back] of [[0, 1, 'south'], [0, -1, 'north'], [1, 0, 'west'], [-1, 0, 'east']]) {
      const scale = dy ? 1 : 1 / Math.cos(target[1] * Math.PI / 180);
      const near = [target[0] + dx * deg * 0.9 * scale, target[1] + dy * deg * 0.9];
      const far = [target[0] + dx * deg * 1.25 * scale, target[1] + dy * deg * 1.25];
      assert.equal(s.check({ pin: near, placed: true }), true, `${lid}/${sid}: ${Math.round(distanceKm(near, target))} km away still counts`);
      const verdict = s.check({ pin: far, placed: true });
      assert.equal(typeof verdict, 'string', `${lid}/${sid}: ${Math.round(distanceKm(far, target))} km away is rejected`);
      assert.match(verdict, /about \d+ km away/);
      assert.ok(verdict.includes(`to the ${back} of it`), `${lid}/${sid}: "${verdict}" should point ${back}`);
    }
  }
  assert.equal(compass([0, 0], [10, 10]), 'north-east');
  assert.equal(compass([0, 0], [-10, 0]), 'west');
  assert.equal(compass([170, 0], [-170, 0]), 'east', 'across the date line');
  assert.equal(pinCheck('sarajevo', 250)({ pin: [18.4, 43.9], placed: true }), true);
});

/* ============================================================ facts quoted in fixed steps */

test('fixed facts: charts, numbers and lists quoted in the lessons agree with this file', () => {
  // UN membership (United Nations, "Growth in United Nations membership")
  const un = one('cold-war-decolonisation', 'un-growth');
  assert.deepEqual(un.figures[0].data.map((d) => [d.label, d.value]), [['1945', 51], ['1955', 76], ['1965', 117], ['1975', 144], ['1985', 159], ['1995', 185], ['2005', 191], ['2015', 193]]);
  assert.deepEqual(un.blanks.map((b) => b.answer), ['1960', 'Africa', '1990', 'Soviet Union']);
  const hook6 = one('cold-war-decolonisation', 'hook');
  assert.equal(hook6.answer, 51);
  // the steepest ten-year climb in the chart really is 1955 to 1965, and the next-largest later one is 1985 to 1995
  const steps = un.figures[0].data.map((d, i, all) => (i ? d.value - all[i - 1].value : 0));
  assert.equal(steps.indexOf(Math.max(...steps)), 2);
  assert.equal(steps.indexOf(Math.max(...steps.slice(4))), 5);

  // the metre: pole to equator is ten million metres
  const metre = one('age-of-revolutions', 'metre');
  assert.equal(metre.answer, 4 * 10_000_000 / 1000);
  for (const [slip] of metre.wrong) assert.ok(Math.abs(slip - metre.answer) > 2 * metre.tolerance, `slip ${slip} is far from the answer`);

  // population milestones: the two doublings quoted in the text
  const billions = one('globalisation', 'billions');
  assert.match(flat(billions.explain), /123 years/);
  assert.equal(DATES.twoBillion[0] - DATES.oneBillion[0], 123);
  assert.equal(DATES.fourBillion[0] - DATES.twoBillion[0], 47);
  assert.equal(DATES.eightBillion[0] - DATES.fourBillion[0], 48);

  // carbon dioxide: the curve starts near 280 ppm, passes 420 and never falls; most of the rise is after 1950
  const co2 = one('globalisation', 'co2');
  const pts = [co2.figures[0].segments[0].from, ...co2.figures[0].segments.map((sg) => sg.to)];
  assert.ok(pts[0][0] === 1750 && Math.abs(pts[0][1] - 280) <= 3);
  for (let i = 1; i < pts.length; i++) assert.ok(pts[i][0] > pts[i - 1][0] && pts[i][1] > pts[i - 1][1], 'the curve rises');
  const at1950 = pts.find((p) => p[0] === 1950)[1];
  const last = pts[pts.length - 1];
  assert.ok(last[1] > 420 && last[1] < 435 && last[0] >= 2024);
  assert.ok(last[1] - at1950 > 3 * (at1950 - pts[0][1]), 'most of the rise came after 1950');
  assert.ok(co2.options.find((o) => o.correct).text.includes('since 1950'));

  // the Nazi vote: 2.6%, 18.3%, 37.3%
  assert.deepEqual(one('second-world-war', 'crash').figures[0].data.map((d) => d.value), [2.6, 18.3, 37.3]);
  assert.equal(one('second-world-war', 'hook').answer, 37);

  // the two alliances of 1914 and of 1955 do not overlap, and Germany is the country left for the learner to find
  const kegs = one('first-world-war', 'powder-keg').figures[0].regions;
  assert.equal(kegs[0].ids.filter((id) => kegs[1].ids.includes(id)).length, 0);
  assert.ok(kegs[0].ids.includes('FR') && kegs[0].ids.includes('RU') && kegs[1].ids.includes('DE') && kegs[1].ids.includes('AT'));
  const curtain = one('cold-war-decolonisation', 'iron-curtain').widget;
  const [nato, pact] = curtain.regions.map((r) => r.ids);
  assert.equal(nato.filter((id) => pact.includes(id)).length, 0);
  assert.ok(!nato.includes('DE') && !pact.includes('DE'));
  for (const id of ['SE', 'FI', 'CH', 'AT', 'IE', 'ES', 'RS']) assert.ok(!nato.includes(id) && !pact.includes(id), `${id} was in neither alliance in 1955`);
  for (const p of curtain.lines[0].points) assert.ok(p[0] > 9 && p[0] < 18 && p[1] > 45 && p[1] < 55, 'the Iron Curtain line stays between the Baltic and the Adriatic');
  assert.ok(distanceKm(curtain.lines[0].points.at(-1), [13.8, 45.6]) < 30, 'and ends at Trieste');

  // free of European rule by 1830: not Canada, Cuba or the Guianas
  const free = one('age-of-revolutions', 'chain').figures[0].regions[0].ids;
  for (const id of ['CA', 'CU', 'PR', 'GY', 'SR', 'BZ', 'JM']) assert.ok(!free.includes(id), `${id} was still a colony in 1830`);
  for (const id of ['US', 'HT', 'MX', 'BR', 'AR', 'CO', 'PE']) assert.ok(free.includes(id), `${id} was independent by 1830`);

  // Asia about 1910: Thailand, China and Nepal are in no empire's colour
  const asia = one('nations-and-empires', 'siam').widget.regions.flatMap((r) => r.ids);
  for (const id of ['TH', 'CN', 'NP']) assert.ok(!asia.includes(id), id);
  assert.equal(new Set(asia).size, asia.length, 'no country is in two empires');
});

/* ============================================================ care with hard history */

test('atrocity content is told plainly: unscored, not generated, and absent from every quiz pool', () => {
  for (const [lid, sid] of SOBER_STEPS) {
    const step = raw(lid, sid);
    assert.ok(['info', 'reflect'].includes(step.type), `${lid}/${sid} is an info or reflect step, not a quiz`);
    assert.equal(step.gen, undefined, `${lid}/${sid} is not generated`);
    assert.ok(!step.review, `${lid}/${sid} is not a review card`);
    assert.equal(step.tone, 'sober', `${lid}/${sid} is marked tone: 'sober'`);
  }
  // the two war lessons are sober from end to end; elsewhere the steps that touch slavery, colonial violence,
  // famine, partition, apartheid and nuclear weapons are marked one by one
  for (const lid of ['first-world-war', 'second-world-war']) {
    assert.equal(lessons[lid].tone, 'sober', `${lid}: the whole lesson is sober`);
    for (const step of lessons[lid].steps) assert.equal(step.tone, 'sober', `${lid}/${step.id}`);
  }
  // (the teaching screens added in the teach-first revision are in the list where they tell of the same material)
  const marked = { 'industrial-revolution': ['mule', 'teach-chain', 'follow-cotton'], 'age-of-revolutions': ['chain', 'declaration', 'find-haiti', 'teach-haiti', 'haiti', 'find-scene'],
    'nations-and-empires': ['siam', 'congo', 'who-ruled', 'teach-migration', 'migration'], 'cold-war-decolonisation': ['berlin-wall', 'arms-race', 'partition', 'apartheid', 'teach-places', 'hot-spots'], globalisation: ['shenzhen'] };
  for (const [lid, ids] of Object.entries(marked)) {
    assert.deepEqual(lessons[lid].steps.filter((st) => st.tone === 'sober').map((st) => st.id), ids, `${lid}: sober steps`);
    assert.equal(lessons[lid].tone, '', `${lid}: an ordinary lesson otherwise`);
  }
  // any step whose words speak of genocide, massacre or people being enslaved or murdered must be sober
  everyStep((lid, step) => {
    for (let k = 0; k < 40; k++) {
      const st = resolveStep(step, makeRng(31 + k * 577), step.id);
      const words = visible(st).join(' ');
      if (/genocide|massacre|murder|enslaved|famine|atomic bomb|were killed|hostage/i.test(words)) assert.equal(step.tone, 'sober', `${lid}/${step.id} mentions atrocity and should be tone: 'sober'`);
      if (!step.gen) break;
    }
  });
  // no generated question, in any variant, mentions these events
  const banned = NEVER_QUIZZED.map((id) => EVENTS[id].label);
  everyStep((lid, step) => {
    if (!step.gen) return;
    for (let k = 0; k < SEEDS; k++) {
      const s = resolveStep(step, makeRng(900 + k * 211), step.id);
      const text = visible(s).join(' | ');
      for (const label of banned) assert.ok(!text.includes(label), `${lid}/${step.id}: "${label}" in a generated question`);
    }
  });
  // figures with honest ranges
  assert.match(flat(one('second-world-war', 'holocaust').text), /Six million Jews/);
  assert.match(flat(one('first-world-war', 'armenian-genocide').text), /600,000 and 1\.5 million/);
  assert.match(flat(one('second-world-war', 'hiroshima').text), /estimates vary/);
  assert.match(flat(one('cold-war-decolonisation', 'partition').text), /several hundred thousand to two million/);
});

test('the one graded question on the Holocaust is fixed, plain, sober and accurate (added in review)', () => {
  const step = raw('second-world-war', 'holocaust-remember');
  assert.equal(step.type, 'choice');
  assert.equal(step.gen, undefined, 'not generated: the wording never varies');
  assert.equal(step.review, true, 'it returns in spaced review');
  assert.equal(step.tone, 'sober');
  assert.notEqual(step.mode, 'predict', 'not a guessing game');
  const s = one('second-world-war', 'holocaust-remember');
  assert.match(flat(s.text), /Holocaust/, 'the card stands alone');
  assert.match(flat(s.text), /Nazi Germany/);
  assert.equal(s.options.length, 3);
  const right = s.options.filter((o) => o.correct);
  assert.equal(right.length, 1);
  assert.match(right[0].text, /murder of about six million Jews/);
  assert.match(right[0].text, /two-thirds of the Jews of Europe/);
  // wrong options are real confusions (other wartime suffering), never a smaller number, and each is answered in words
  for (const o of s.options) {
    if (o.correct) continue;
    assert.ok(!/\d/.test(o.text), `no numbers to guess among the wrong options: ${o.text}`);
    assert.ok(o.why && /Holocaust/.test(o.why) && /Jew/.test(o.why), `"${o.text}" is answered plainly`);
  }
  assert.match(flat(s.explain), /six million Jews/);
  assert.match(flat(s.explain), /1\.5 million/);
  assert.match(flat(s.explain), /Roma, disabled people, Soviet prisoners of war/);
  assert.match(flat(s.explain), /records|testimony/, 'says how we know');
  // it replaced the 'road' step among the review cards, so the lesson still has four
  assert.ok(!raw('second-world-war', 'road').review);
  assert.equal(lessons['second-world-war'].steps.filter((st) => st.review).length, 4);
  // the lesson's other steps on the Holocaust and the bombings are still unscored
  for (const id of ['holocaust', 'stolpersteine', 'hiroshima']) assert.ok(['info', 'reflect'].includes(raw('second-world-war', id).type));
});

test('reviewer\'s checks: historical maps, hedged quotations, honest ranges, dropdown positions', () => {
  // lands of the Russian Empire (1914) and of the Soviet Union (1955) that the map of Europe shows are all coloured
  // (the window "europe" reaches 45° E; the widened drawing shows the Caucasus and the west of Kazakhstan as well)
  const visible15 = ['RU', 'UA', 'BY', 'EE', 'LV', 'LT', 'MD', 'GE', 'AM', 'AZ', 'KZ'];
  for (const id of visible15) assert.ok(USSR.includes(id));
  assert.ok(VIEWS.europe[2] >= 45);
  const allies = one('first-world-war', 'powder-keg').figures[0].regions[0].ids;
  const pact = one('cold-war-decolonisation', 'iron-curtain').widget.regions[1].ids;
  for (const id of visible15) {
    assert.ok(allies.includes(id), `${id} was in the Russian Empire in 1914`);
    assert.ok(pact.includes(id), `${id} was in the Soviet Union in 1955`);
  }
  // neutral in August 1914: in neither colour (Italy and Romania had treaties with the Central Powers but stayed out)
  const kegs = one('first-world-war', 'powder-keg').figures[0].regions.flatMap((r) => r.ids);
  for (const id of ['ES', 'PT', 'CH', 'NL', 'DK', 'NO', 'SE', 'IT', 'RO', 'GR', 'AL', 'LU', 'PL']) assert.ok(!kegs.includes(id), `${id} is not coloured for August 1914`);
  // neutral through the Second World War, or never occupied: not shaded as Axis-held
  const axis = one('second-world-war', 'reach').figures[0].regions.flatMap((r) => r.ids);
  for (const id of ['ES', 'PT', 'CH', 'SE', 'IE', 'TR', 'GB', 'IS', 'RU', 'CN', 'IN', 'AU', 'EG']) assert.ok(!axis.includes(id), `${id} is not shaded as Axis-held`);
  for (const id of ['FR', 'PL', 'NO', 'GR', 'UA', 'BY', 'TH', 'PH', 'ID', 'MM', 'KR']) assert.ok(axis.includes(id), `${id} was Axis-held or Axis-allied in 1942`);
  // 1955: Yugoslavia in neither bloc; Albania in the Pact; Greece and Turkey in NATO
  const [nato, wp] = one('cold-war-decolonisation', 'iron-curtain').widget.regions.map((r) => r.ids);
  for (const id of ['SI', 'HR', 'BA', 'RS', 'ME', 'MK', 'XK', 'CY', 'MT']) assert.ok(!nato.includes(id) && !wp.includes(id), `${id} in neither alliance`);
  assert.ok(wp.includes('AL') && nato.includes('GR') && nato.includes('TR') && nato.includes('IS') && nato.includes('PT'));
  // Asia about 1910: no colour for Afghanistan, Bhutan, Iran or Timor-Leste (Portuguese), and Brunei is British
  const asia = one('nations-and-empires', 'siam').widget.regions;
  const flatAsia = asia.flatMap((r) => r.ids);
  for (const id of ['AF', 'BT', 'IR', 'TL', 'MN']) assert.ok(!flatAsia.includes(id), id);
  assert.ok(asia.find((r) => r.label === 'British').ids.includes('BN'));
  // the two-exceptions step: only African countries can be tapped, so "… was under European rule in 1914" is never said of Arabia or Spain
  const two = one('nations-and-empires', 'two-free');
  assert.deepEqual(two.widget.pickable, ['africa']);
  // nuclear stockpiles: one consistent series (military stockpiles), peaking in 1986
  const nukes = one('cold-war-decolonisation', 'arms-race').figures[0];
  assert.deepEqual(nukes.data.map((d) => [d.label, d.value]), [['1945', 0], ['1955', 3], ['1965', 37], ['1975', 47], ['1986', 64], ['2025', 9.6]]);
  assert.match(nukes.caption, /military stockpiles/);
  // quotations of doubtful origin are hedged
  assert.match(flat(one('nations-and-empires', 'nation').explain), /later credited to/);
  assert.match(flat(one('first-world-war', 'versailles').explain), /is said to have remarked \(the story may be a legend\)/);
  // honest ranges
  assert.match(flat(one('first-world-war', 'cost').text), /17 to 100 million/);
  assert.match(flat(one('second-world-war', 'hiroshima').text), /110,000 to 210,000/);
  assert.match(flat(one('second-world-war', 'stalingrad').explain), /24 to 27 million/);
  assert.match(flat(one('nations-and-empires', 'congo').text), /toll is uncertain/);
  assert.match(flat(one('first-world-war', 'armenian-genocide').text), /great majority of historians/);
  assert.match(flat(one('first-world-war', 'armenian-genocide').text), /rejects that word/);
  // the trench photograph: caption and alt text both say that the men lying down are asleep
  const trench = one('first-world-war', 'trench').figures[0];
  assert.match(trench.caption, /sleep/);
  assert.match(trench.alt, /asleep/);
  // figures for the present carry a year or a hedge and are never the answer to a graded step
  assert.match(flat(one('globalisation', 'cities').explain), /in 2025/);
  assert.equal(one('globalisation', 'cities').mode, 'predict');
  assert.match(flat(one('globalisation', 'two-sides').explain), /by 2025/);
  assert.match(flat(one('cold-war-decolonisation', 'hook').text), /Since 2011, 193/);
  // dropdowns are shown in the order written: over the course the right entry is first, in the middle and last
  const positions = [];
  everyStep((lid, step) => { if (step.type === 'fill') for (const blank of one(lid, step.id).blanks) positions.push(blank.options.indexOf(blank.answer)); });
  assert.equal(positions.length, 11, 'eleven dropdowns in three steps');
  for (const pos of [0, 1, 2]) assert.ok(positions.filter((x) => x === pos).length >= 3, `the answer is in position ${pos + 1} at least three times (${positions})`);
});

/* ============================================================ pictures */

test('every photo used is in the course\'s media manifest with a licence and a credit, has an alt text, and every picture is used', () => {
  const manifest = JSON.parse(readFileSync(fileURLToPath(new URL(`../content/media/${COURSE}/manifest.json`, import.meta.url)), 'utf8'));
  const bySrc = new Map(Object.values(manifest.images).map((e) => [e.file, e]));
  const used = new Set();
  const perLesson = {};
  everyStep((lid, step) => {
    const s = resolveStep(step, makeRng(1), step.id);
    for (const spec of specsOf(s)) {
      if (spec.type !== 'photo') continue;
      const file = spec.src.split('/').pop().split('?')[0];
      const entry = bySrc.get(file);
      assert.ok(entry, `${lid}/${step.id}: ${file} is in the manifest`);
      assert.ok(spec.src.includes(`/media/${COURSE}/`), `${lid}/${step.id}: a picture of this course`);
      assert.ok(entry.license, `${entry.id}: licence`);
      assert.ok(entry.author || entry.credit, `${entry.id}: credit`);
      assert.ok(entry.sourceUrl && entry.sourceUrl.startsWith('https://commons.wikimedia.org/'), `${entry.id}: source`);
      assert.ok(spec.alt && spec.alt.length >= 40 && !/^(a |an |the )?(photo|image|picture)/i.test(spec.alt), `${lid}/${step.id}: alt text describes the picture`);
      assert.ok(/pictur|photo|print|paint|engrav|portrait|sign|look|shows?|drew|recorded|stones|plates|ship|room|memorial|satellite|here\b/i.test(s.text + s.explain), `${lid}/${step.id}: the step refers to its picture`);
      used.add(entry.id);
      (perLesson[lid] ||= new Set()).add(entry.id);
    }
  });
  assert.deepEqual(Object.keys(manifest.images).filter((id) => !used.has(id)), [], 'pictures in the manifest that no lesson uses');
  // pic('id', …) quietly leaves a figure out when the picture is missing: make sure none is
  const asked = new Set();
  for (const lid of Object.keys(lessons)) {
    const source = readFileSync(fileURLToPath(new URL(`../content/courses/${COURSE}/lessons/${lid}.js`, import.meta.url)), 'utf8');
    for (const m of source.matchAll(/\bpic\('([a-z0-9-]+)'/g)) asked.add(m[1]);
  }
  assert.deepEqual([...asked].filter((id) => !manifest.images[id]), [], 'pictures a lesson asks for that were never fetched');
  assert.deepEqual([...asked].sort(), [...used].sort(), 'every picture asked for is shown');
  for (const [lid, set] of Object.entries(perLesson)) assert.ok(set.size <= 4, `${lid}: ${set.size} pictures`);
  assert.ok(used.size >= 15 && used.size <= 25, `${used.size} pictures in the course`);
});

/* ============================================================ teach before you ask */

// Teach before you ask (docs/AUTHORING.md). The shape is checked for every lesson. The substance (each graded step
// asks only for what a screen above it has shown) was checked by reading every lesson with tools/outline.mjs --pool;
// the pins below hold the places where a later edit could most easily undo it.
const TEACHING_STEPS = {
  'industrial-revolution': ['teach-why-britain', 'teach-watt', 'teach-timeline', 'teach-spread', 'teach-chain'],
  'age-of-revolutions': ['teach-france', 'teach-stories', 'teach-haiti', 'teach-liberators'],
  'nations-and-empires': ['teach-opium', 'teach-tools', 'teach-scramble', 'teach-adwa', 'teach-migration'],
  'first-world-war': ['teach-chain', 'teach-fronts', 'teach-1917', 'teach-peace'],
  'second-world-war': ['teach-road', 'teach-turning', 'teach-why', 'teach-after'],
  'cold-war-decolonisation': ['teach-two-stories', 'teach-soviet', 'teach-asia', 'teach-places'],
  globalisation: ['teach-chokepoints', 'teach-globalisation', 'teach-rules', 'teach-timeline'],
};
const LESSON_ORDER = Object.keys(lessons);
const indexOf = (lesson, id) => { const i = lessons[lesson].steps.findIndex((s) => s.id === id); assert.ok(i >= 0, `${lesson}/${id} exists`); return i; };
const plain = (s) => flat(s).replace(/\*\*|\[|\]\{\.[a-z]+\}/g, '');
/** Every string a sighted learner can read in a value (as `visible`, but without the alt texts). */
const readable = (v) => { const out = []; const walk = (x, key) => { if (typeof x === 'string') { if (!['type', 'id', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'color', 'mode', 'view', 'alt', 'shape', 'labelPos', 'tone', 'curve', 'labelOn', 'style'].includes(key)) out.push(x); } else if (Array.isArray(x)) x.forEach((y) => walk(y, key)); else if (x && typeof x === 'object' && !(x instanceof RegExp)) for (const k of Object.keys(x)) walk(x[k], k); }; walk(v, ''); return out.join(' '); };
/** What a step shows before it is answered: its title, text and figures (not its explanation, options or feedback). */
const shownBy = (lesson, id) => { const s = one(lesson, id); return plain(readable({ title: s.title, text: s.text, figures: s.figures, widget: s.widget })); };
/** Everything a learner has read by the time they reach a step, explanations of the steps above included. */
const metAbove = (lesson, id) => lessons[lesson].steps.slice(0, indexOf(lesson, id)).map((s) => plain(readable(one(lesson, s.id)))).join(' ');
/** The figures of the teaching screens above a step. */
const figuresAbove = (lesson, id) => lessons[lesson].steps.slice(0, indexOf(lesson, id)).filter((s) => s.type === 'info').flatMap((s) => specsOf(one(lesson, s.id)));
/** Labels of every marker on the maps of the teaching screens above a step. */
const markedAbove = (lesson, id) => figuresAbove(lesson, id).filter((spec) => spec.type === 'world-map').flatMap((spec) => (spec.markers || []).map((m) => m.label || ''));
/** Every year a learner has met before a step: in the text above it, on the timelines above it, or anywhere in an earlier lesson. */
const yearsAbove = (lesson, id) => {
  const years = new Set();
  const take = (text) => { for (const m of text.matchAll(/\b(1[6-9]\d\d|20\d\d)\b/g)) years.add(Number(m[1])); };
  const fromSteps = (lid, steps) => { for (const s of steps) { const r = one(lid, s.id); take(readable(r)); for (const spec of specsOf(r)) if (spec.type === 'timeline') for (const e of [...(spec.events || []), ...(spec.place || [])]) years.add(e.year ?? e.answer); } };
  for (const lid of LESSON_ORDER.slice(0, LESSON_ORDER.indexOf(lesson))) fromSteps(lid, lessons[lid].steps);
  fromSteps(lesson, lessons[lesson].steps.slice(0, indexOf(lesson, id)));
  return years;
};
const before = (lesson, a, b) => assert.ok(indexOf(lesson, a) < indexOf(lesson, b), `${lesson}: ${a} comes before ${b}`);
const shows = (lesson, id, re) => assert.match(shownBy(lesson, id), re, `${lesson}/${id}`);
const has = (lesson, id, words) => { const t = shownBy(lesson, id).toLowerCase(); for (const w of words) assert.ok(t.includes(w.toLowerCase()), `${lesson}/${id} shows "${w}"`); };
const fillAnswers = (lesson, id) => [...raw(lesson, id).template.matchAll(/\[\[([^\]]+)\]\]/g)].map((m) => m[1].split('|').find((o) => o.startsWith('*')).slice(1));
const timelineIds = (lesson, id) => one(lesson, id).figures.find((f) => f.type === 'timeline').events.map((e) => e.id);
const labelCodes = (spec) => (spec.labels || []).map((l) => (typeof l === 'string' ? l : l.id || nameToCode.get(l.text)));

test('teach before you ask: the shape of every lesson', () => {
  assert.deepEqual(Object.keys(TEACHING_STEPS), LESSON_ORDER);
  for (const [id, lesson] of Object.entries(lessons)) {
    const role = (step) => { const s = resolveStep(step, makeRng(1), step.id); return s.type === 'info' ? 'teach' : s.mode === 'predict' ? 'predict' : s.type === 'reflect' ? 'reflect' : s.graded === false ? 'explore' : 'graded'; };
    const roles = lesson.steps.map(role);
    const firstTaught = roles.findIndex((r) => r === 'teach' || r === 'explore');
    assert.ok(firstTaught >= 0 && firstTaught < roles.indexOf('graded'), `${id}: a teaching screen or an exploration comes before the first graded step`);
    const teach = roles.filter((r) => r === 'teach').length;
    assert.ok(teach >= 3 && teach <= 8, `${id}: ${teach} teaching screens`);
    assert.ok(roles.filter((r) => r === 'predict').length <= 2, `${id}: no more than two predictions`);
    assert.ok(!roles.join(' ').includes('teach teach teach'), `${id}: never three teaching screens in a row`);
    assert.notEqual(roles.at(-1), 'teach', `${id}: the lesson does not end on a teaching screen`);
    for (const stepId of TEACHING_STEPS[id]) {
      const s = one(id, stepId);
      assert.equal(s.type, 'info', `${id}/${stepId} is a teaching screen`);
      assert.ok(flat(s.text).length > 120, `${id}/${stepId} has something to say`);
    }
    for (const step of lesson.steps) if (step.review) assert.notEqual(step.mode, 'predict', `${id}/${step.id}: a review step is never a prediction`);
  }
  // no graded step was lost in the revision
  let graded = 0;
  everyStep((lid, step) => { if (resolveStep(step, makeRng(1), step.id).graded) graded++; });
  assert.equal(graded, 72, 'graded steps in the course');
});

test('teach before you ask: every place, country and date of a generated or ordering question is shown first', () => {
  // marker questions: every place is named on the map of a teaching screen above the step
  for (const [key, clues] of Object.entries(CLUES)) {
    const [lid, sid] = key.split('/');
    const labels = markedAbove(lid, sid);
    for (const place of Object.values(clues)) assert.ok(labels.some((l) => l.includes(PLACES[place].name)), `${key}: ${PLACES[place].name} is on a teaching map above the question`);
  }
  // "which came first?" and "put in order": every year has been met
  for (const key of WHICH_FIRST) {
    const [lid, sid] = key.split('/');
    const met = yearsAbove(lid, sid);
    const pool = new Set(variants(lid, sid).flatMap((s) => s.options.map((o) => labelToId.get(o.text))));
    assert.ok(pool.size >= 6, `${key}: ${pool.size} events in the pool`);
    for (const id of pool) assert.ok(met.has(DATES[id][0]), `${key}: ${id} (${DATES[id][0]}) is met before the question`);
  }
  everyStep((lid, step) => {
    if (step.type !== 'order') return;
    const met = yearsAbove(lid, step.id);
    for (const label of one(lid, step.id).items) assert.ok(met.has(DATES[labelToId.get(label)][0]), `${lid}/${step.id}: the year of "${label}" is met before the step`);
  });
  // timelines that teach a pool show the whole pool
  const poolOf = (lid) => new Set(variants(lid, 'which-first').flatMap((s) => s.options.map((o) => labelToId.get(o.text))));
  for (const id of poolOf('industrial-revolution')) assert.ok(timelineIds('industrial-revolution', 'teach-timeline').includes(id), `lesson 1: ${id} is on the teaching timeline`);
  for (const id of poolOf('globalisation')) assert.ok(timelineIds('globalisation', 'teach-timeline').includes(id), `lesson 7: ${id} is on the teaching timeline`);
  for (const label of [...one('globalisation', 'order').items]) assert.ok(timelineIds('globalisation', 'teach-timeline').includes(labelToId.get(label)), `lesson 7: "${label}" is on the teaching timeline`);
  for (const label of one('second-world-war', 'road').items) assert.ok(timelineIds('second-world-war', 'teach-road').includes(labelToId.get(label)), `lesson 5: "${label}" is on the teaching timeline`);
  for (const card of one('industrial-revolution', 'when').widget.place) assert.ok(timelineIds('industrial-revolution', 'teach-timeline').includes(card.id), `lesson 1: card ${card.id} was on the teaching timeline`);

  // "which power ruled it in 1914?": the African countries are coloured and named on the map of the Scramble …
  before('nations-and-empires', 'teach-scramble', 'who-ruled'); before('nations-and-empires', 'siam', 'who-ruled');
  const scramble = one('nations-and-empires', 'teach-scramble').figures[0];
  const asia1910 = one('nations-and-empires', 'siam').widget;
  const asianRuler = { Britain: 'British', France: 'French', 'the Netherlands': 'Dutch', 'the United States': 'United States', Japan: 'Japan' };
  for (const [code, ruler] of Object.entries(RULER_1914)) {
    if (countryInfo(code).continent === 'Africa' || ['NG', 'KE', 'GH', 'SN', 'DZ', 'MG', 'CD', 'AO', 'MZ', 'NA', 'CM', 'LY'].includes(code)) {
      assert.equal(scramble.regions.find((g) => g.ids.includes(code)).label, ruler, `${code} is coloured for ${ruler}`);
      assert.ok(labelCodes(scramble).includes(code), `${code} is named on the map of Africa in 1914`);
    } else {
      // … and the Asian ones on the map of Asia about 1910, whose prompt says who held each
      assert.ok(asia1910.regions.find((g) => g.ids.includes(code)).label.includes(asianRuler[ruler]), `${code} is coloured for ${ruler}`);
      assert.ok(labelCodes(asia1910).includes(code), `${code} is named on the map of Asia`);
    }
  }
  shows('nations-and-empires', 'siam', /India was British.*Vietnam French.*Indonesia Dutch.*Philippines American.*Korea Japanese/);
  // the map of Africa in 1914 does not give away the next question
  for (const code of ['ET', 'LR']) assert.ok(!scramble.regions.some((g) => g.ids.includes(code)) && !labelCodes(scramble).includes(code), `${code} is left for the learner to find`);

  // "tap the country": the new states of 1918 to 1923 are named on the map of the peace
  before('first-world-war', 'teach-peace', 'new-map');
  for (const code of Object.values(COUNTRY_CLUES['first-world-war/new-map'])) assert.ok(labelCodes(one('first-world-war', 'teach-peace').figures[0]).includes(code), `${code} is named on the map of the peace`);

  // "which was inside the Soviet Union?": every republic is coloured and named, and every other option is named as a separate state
  before('cold-war-decolonisation', 'teach-soviet', 'soviet-or-ally');
  const union = one('cold-war-decolonisation', 'teach-soviet').figures[0];
  assert.deepEqual([...union.regions[0].ids].sort(), [...USSR].sort(), 'the fifteen republics are one colour');
  for (const code of USSR) assert.ok(labelCodes(union).includes(code), `${code} is named on the map of the Soviet Union`);
  for (const n of NEVER_SOVIET) {
    assert.ok(!union.regions[0].ids.includes(n.code));
    assert.ok(union.regions.slice(1).some((g) => g.ids.includes(n.code)) || n.code === 'MN', `${n.code} is coloured as a separate state`);
    has('cold-war-decolonisation', 'teach-soviet', [countryName(n.code)]);
  }
});

test('teach before you ask: each new screen comes before the step it serves, and says what that step needs', () => {
  const rightOptions = (lesson, id) => one(lesson, id).options.filter((o) => o.correct).map((o) => o.text);
  let L = 'industrial-revolution';
  before(L, 'teach-why-britain', 'why-britain'); shows(L, 'teach-why-britain', /near the surface, close to rivers and the sea.*High wages, cheap fuel.*Colonies and Atlantic trade/);
  shows(L, 'teach-why-britain', /Newcastle, on the River Tyne.*London, the capital, had about a million people in 1800/);
  before(L, 'engine', 'teach-watt'); before(L, 'teach-watt', 'when'); shows(L, 'teach-watt', /James Watt.*Glasgow.*1769.*Birmingham.*Boulton.*wheel/);
  assert.equal(one(L, 'teach-watt').figures[0].type, 'photo');
  before(L, 'teach-timeline', 'when'); shows(L, 'teach-timeline', /1712.*1769.*1793.*cotton gin.*1830.*1866.*1872/);
  before(L, 'teach-spread', 'belgium'); has(L, 'teach-spread', ['Belgium was first', 'Germany', 'France', 'United States', 'Japan']);
  before(L, 'teach-chain', 'follow-cotton'); for (const [place] of one(L, 'follow-cotton').pairs) has(L, 'teach-chain', [place]);
  shows(L, 'teach-chain', /Enslaved people planted and picked it.*cotton gin.*undersold its hand weavers/);

  L = 'age-of-revolutions';
  before(L, 'teach-france', 'rights-of-man'); shows(L, 'teach-france', /14 July.*Bastille.*seven prisoners.*National Assembly.*"Left" and "right".*Declaration of the Rights of Man/);
  shows(L, 'rights-of-man', /Ten Commandments/);
  before(L, 'teach-stories', 'myths'); shows(L, 'teach-stories', /metric system.*clubs were banned in 1793.*Rousseau.*No record connects it to her.*1\.69 m/);
  before(L, 'find-haiti', 'teach-haiti'); before(L, 'teach-haiti', 'haiti'); shows(L, 'teach-haiti', /1791.*Toussaint Louverture.*1804.*Haiti.*Nowhere else have enslaved people freed themselves and founded a country/);
  before(L, 'teach-liberators', 'liberators'); before(L, 'teach-liberators', 'brazil'); has(L, 'teach-liberators', [...fillAnswers(L, 'brazil'), 'Hidalgo', 'Dolores', 'Bolívar', 'Caracas', 'San Martín', 'Buenos Aires', '1810', '1822']);

  L = 'nations-and-empires';
  before(L, 'teach-opium', 'opium'); before(L, 'opium', 'japan'); shows(L, 'teach-opium', /opium.*Lin Zexu.*Britain chose war.*steamships.*Treaty of Nanjing.*never made a colony/);
  before(L, 'teach-tools', 'tools'); has(L, 'teach-tools', ['Quinine', 'Steamboats', 'machine gun', 'telegraph', 'malaria']);
  before(L, 'berlin', 'teach-scramble'); before(L, 'teach-scramble', 'two-free'); shows(L, 'teach-scramble', /Ethiopia, an ancient empire.*Liberia, a small republic.*freed African Americans/);
  before(L, 'teach-adwa', 'adwa'); shows(L, 'teach-adwa', /tens of thousands of modern rifles.*united behind him in an army of about 100,000.*routed/);
  before(L, 'teach-migration', 'migration'); has(L, 'teach-migration', ['Irish, Italians, Poles', 'five-year contracts', 'Mauritius, Trinidad and Fiji', 'Chinese labourers', 'Malaya', 'North America', 'British settlers', 'Aboriginal', 'Māori']);

  L = 'first-world-war';
  before(L, 'teach-chain', 'chain'); shows(L, 'teach-chain', /28 July.*declared war on Serbia.*30 July.*Russia mobilised.*1 August.*Germany declared war on Russia.*4 August.*Belgium.*Britain/);
  shows(L, 'trench', /barbed wire, machine guns and shellfire.*Railways rushed defenders/);
  before(L, 'teach-fronts', 'fronts'); has(L, 'teach-fronts', Object.values(CLUES['first-world-war/fronts']).map((p) => PLACES[p].name));
  before(L, 'teach-1917', 'year-1917'); has(L, 'teach-1917', fillAnswers(L, 'year-1917'));
  before(L, 'teach-peace', 'four-empires'); before(L, 'teach-peace', 'versailles');
  shows(L, 'teach-peace', /responsibility for the war.*reparations.*army of 100,000 men.*colonies and about an eighth of its territory/);
  shows(L, 'teach-peace', /emperor fled.*republic.*Austria-Hungary split.*Soviet Union.*Turkey became a republic.*Britain took control of Iraq.*France of Syria/);

  L = 'second-world-war';
  before(L, 'teach-road', 'road'); has(L, 'teach-road', ['Manchuria', 'Ethiopia', 'chancellor', 'Munich', 'appeasement', 'Poland']);
  before(L, 'reach', 'turning-points'); before(L, 'teach-turning', 'turning-points'); has(L, 'teach-turning', Object.values(CLUES['second-world-war/turning-points']).map((p) => PLACES[p].name));
  before(L, 'teach-why', 'why-allies'); has(L, 'teach-why', rightOptions(L, 'why-allies').map((t) => t.replace(/^The Axis ran/, 'ran')));
  before(L, 'hiroshima', 'teach-after'); before(L, 'teach-after', 'after');
  for (const [left] of one(L, 'after').pairs) has(L, 'teach-after', [left.split(',')[0].replace('Universal Declaration', 'Universal Declaration of Human Rights')]);
  shows(L, 'teach-after', /meeting-place of states.*crimes against humanity.*destroying a people became a crime in international law.*rights that belong to every person/);

  L = 'cold-war-decolonisation';
  before(L, 'teach-two-stories', 'un-growth'); has(L, 'teach-two-stories', ['Africa', 'Soviet Union', '1960', '1991']);
  shows(L, 'berlin-wall', /three million people had left East Germany for the West/);
  before(L, 'partition', 'teach-asia'); before(L, 'teach-asia', 'asia'); has(L, 'teach-asia', ['Indonesia', 'Dutch', 'Mao Zedong', 'Korea', 'Vietnam', 'France', 'United States', 'Bandung', '29 Asian and African states']);
  before(L, 'teach-places', 'hot-spots'); has(L, 'teach-places', Object.values(CLUES['cold-war-decolonisation/hot-spots']).map((p) => PLACES[p].name));

  L = 'globalisation';
  before(L, 'acceleration', 'billions');
  before(L, 'teach-chokepoints', 'chokepoints'); has(L, 'teach-chokepoints', Object.values(CLUES['globalisation/chokepoints']).map((p) => PLACES[p].name));
  before(L, 'teach-globalisation', 'two-sides'); has(L, 'teach-globalisation', ['globalisation', ...rightOptions(L, 'two-sides').map((t) => t.replace('older industrial', 'the older industrial'))]);
  before(L, 'teach-rules', 'agreements'); for (const [left] of one(L, 'agreements').pairs) has(L, 'teach-rules', [left.split(',')[0]]);
  has(L, 'teach-rules', ['against disease', 'merged their markets', 'ozone layer', 'well below 2 °C']);
  before(L, 'teach-timeline', 'order'); before(L, 'teach-timeline', 'which-first');
});
