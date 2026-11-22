// Independent checks of "The World at a Glance" (world-geography).
//
// The lessons build their maps, questions and feedback from the tables in
// content/courses/world-geography/helpers.js. This file keeps its OWN tables of the same facts, typed in
// separately from the author's verified notes (FACTS below), and checks that
//   - the helper tables agree with them (a double entry: a slip in one copy shows up as a failure);
//   - every country code is known to the map, and every coordinate is [longitude, latitude] and lands in or
//     near the country, sea or continent it is supposed to be in;
//   - every generated step, over 200 seeds, marks as correct exactly the answer that these tables give,
//     offers no distractor that is also true, and prints no "undefined" or "NaN";
//   - every order step agrees with the dates, every timeline check accepts its solution and refuses a
//     placement outside the tolerance the learner was told, and every map check accepts its solution and
//     refuses plausible wrong answers with a message;
//   - every photograph has a licence and a credit in the course's media manifest.
//
//   node --test tests/world-geography-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { countryName, countryInfo, countryIds, regionNames, countryAt, distanceKm, destination, place, pointInPolygon, VIEWS, PROJECTIONS } from '../src/widgets/world-map.js';
import course from '../content/courses/world-geography/course.js';
import * as H from '../content/courses/world-geography/helpers.js';

const COURSE = 'world-geography';
const SEEDS = 200;
const LESSON_IDS = ['continents-oceans', 'maps-lie', 'latitude-longitude', 'land-and-water', 'climate', 'where-people-live', 'countries-borders'];

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/${COURSE}/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, COURSE, meta.id);
  }
}
// The river data loads on demand in the browser; here it is read once.
const RIVER_DATA = (await import('../assets/geo/rivers.js')).default;
const manifest = JSON.parse(readFileSync(new URL(`../content/media/${COURSE}/manifest.json`, import.meta.url), 'utf8'));

const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const one = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id);
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(4099 + k * 7919), id));
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const grab = (re, text, msg) => { const m = re.exec(text); assert.ok(m, `${msg || 'pattern'} ${re} not found in: ${text}`); return m.slice(1); };
const correctOf = (step) => { const right = step.options.filter((o) => o.correct); assert.equal(right.length, 1, `${step.id}: exactly one correct option`); return right[0]; };
const isMessage = (res) => typeof res === 'string' && res.length > 8;

/** Every string a learner can see in a resolved step (figure markup and file addresses excluded). */
function visible(step) {
  const out = [];
  const skip = new Set(['content', 'type', 'id', 'viewBox', 'color', 'src', 'thumb', 'sourceUrl', 'licenseUrl', 'curve', 'shape', 'mode', 'projection', 'view', 'labelPos', 'animate']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}

/** Every generated step is listed here by the test that re-solves it; the guard at the end compares this with the lessons. */
const COVERED = new Set();
const covers = (lesson, id) => { COVERED.add(`${lesson}/${id}`); return variants(lesson, id); };

/* ============================================================================ the test's own facts */

const FACTS = {
  // Continents, largest first, in millions of km².
  continents: [['Asia', 44.6], ['Africa', 30.4], ['North America', 24.7], ['South America', 17.8], ['Antarctica', 14.2], ['Europe', 10.2], ['Oceania', 8.5]],
  oceans: ['Pacific Ocean', 'Atlantic Ocean', 'Indian Ocean', 'Southern Ocean', 'Arctic Ocean'],
  years: {
    columbus: 1492, america: 1507, pacificNamed: 1520, australia: 1606, antarctica: 1820, blueMarble: 1972,
    idrisi: 1154, mercator: 1569, gall: 1855, webMercator: 2005, equalEarth: 2018,
    longitudeAct: 1714, harrisonH4: 1761, frenchRevolution: 1789, greenwich: 1884, moonLanding: 1969,
  },
  billions: { 1: 1804, 2: 1927, 4: 1974, 8: 2022 },
  mapChanges: [[1945, /United Nations is founded/], [1960, /African countries become independent/], [1991, /Soviet Union breaks up/], [2002, /Timor-Leste/], [2011, /South Sudan/]],
  // Which continent a country is on (only countries that lie wholly on one).
  continentOf: {
    NG: 'Africa', ZA: 'Africa', KE: 'Africa', ET: 'Africa', MA: 'Africa', DZ: 'Africa', GH: 'Africa', TZ: 'Africa', CD: 'Africa', SN: 'Africa', MG: 'Africa', AO: 'Africa', SD: 'Africa', ML: 'Africa',
    CN: 'Asia', IN: 'Asia', JP: 'Asia', SA: 'Asia', IR: 'Asia', TH: 'Asia', VN: 'Asia', PK: 'Asia', MN: 'Asia', KR: 'Asia', PH: 'Asia', BD: 'Asia', IQ: 'Asia', UZ: 'Asia', NP: 'Asia',
    FR: 'Europe', DE: 'Europe', IT: 'Europe', ES: 'Europe', GB: 'Europe', PL: 'Europe', SE: 'Europe', NO: 'Europe', GR: 'Europe', PT: 'Europe', UA: 'Europe', NL: 'Europe', IE: 'Europe', FI: 'Europe', RO: 'Europe',
    US: 'North America', CA: 'North America', MX: 'North America', CU: 'North America', GT: 'North America', JM: 'North America', HN: 'North America', CR: 'North America', HT: 'North America',
    BR: 'South America', AR: 'South America', CL: 'South America', PE: 'South America', CO: 'South America', VE: 'South America', BO: 'South America', EC: 'South America', UY: 'South America', PY: 'South America',
    AU: 'Oceania', NZ: 'Oceania', PG: 'Oceania', FJ: 'Oceania',
  },
  // Points and the continent they are on (null: open sea), for the pin-placing step.
  points: [
    ['Asia', [116.4, 39.9]], ['Asia', [77.2, 28.6]], ['Asia', [104, 62]], ['Africa', [3.4, 6.6]], ['Africa', [36.8, -1.3]],
    ['North America', [-87.7, 41.9]], ['North America', [-99.1, 19.4]], ['North America', [-40, 72]],
    ['South America', [-58.4, -34.6]], ['South America', [-65, -17]], ['South America', [-53, 4]],
    ['Europe', [2.3, 48.9]], ['Europe', [37.6, 55.8]], ['Oceania', [133, -25]], ['Oceania', [175.6, -38.7]],
    ['Antarctica', [0, -85]], [null, [-140, 0]], [null, [75, -30]],
  ],
  equatorAfrica: ['GA', 'CG', 'CD', 'UG', 'KE', 'SO'],          // mainland; São Tomé and Príncipe is clipped as well
  // Areas in millions of km² by the name printed in the lesson.
  areas: {
    Greenland: 2.17, Africa: 30.37, India: 3.29, Brazil: 8.52, Australia: 7.69, China: 9.6, 'United States': 9.83, Russia: 17.1, Canada: 9.98,
    'Norway, Sweden and Finland together': 0.385 + 0.45 + 0.338, Sweden: 0.45, Nigeria: 0.924, Egypt: 1.002, Tanzania: 0.945, Finland: 0.338,
    Kenya: 0.58, Madagascar: 0.587, Argentina: 2.78, Mexico: 1.96,
  },
  // City → [latitude, longitude] in whole degrees (north and east positive) and its country.
  cities: {
    Cairo: [30, 31, 'EG'], Moscow: [56, 38, 'RU'], Istanbul: [41, 29, 'TR'], Delhi: [29, 77, 'IN'], Mumbai: [19, 73, 'IN'], Beijing: [40, 116, 'CN'], Tokyo: [36, 140, 'JP'],
    'New York': [41, -74, 'US'], 'Los Angeles': [34, -118, 'US'], Vancouver: [49, -123, 'CA'], 'Mexico City': [19, -99, 'MX'], Havana: [23, -82, 'CU'], Dakar: [15, -17, 'SN'],
    'Reykjavík': [64, -22, 'IS'], Lima: [-12, -77, 'PE'], 'Rio de Janeiro': [-23, -43, 'BR'], 'Buenos Aires': [-35, -58, 'AR'], Santiago: [-33, -71, 'CL'],
    'Cape Town': [-34, 18, 'ZA'], Johannesburg: [-26, 28, 'ZA'], Sydney: [-34, 151, 'AU'], Perth: [-32, 116, 'AU'], Auckland: [-37, 175, 'NZ'],
    // megacities and clock cities not in the list above
    Shanghai: [31, 121, 'CN'], Jakarta: [-6, 107, 'ID'], Dhaka: [24, 90, 'BD'], Karachi: [25, 67, 'PK'], Manila: [15, 121, 'PH'], Lagos: [6, 3, 'NG'], Kinshasa: [-4, 15, 'CD'],
    'São Paulo': [-24, -47, 'BR'], Bangkok: [14, 101, 'TH'], Dubai: [25, 55, 'AE'], Baghdad: [33, 44, 'IQ'], Manaus: [-3, -60, 'BR'], 'Bogotá': [5, -74, 'CO'], 'Guatemala City': [15, -91, 'GT'],
    Edinburgh: [56, -3, 'GB'],
  },
  // Hours ahead of (+) or behind (−) Greenwich, in cities that keep one time all year.
  clocks: { Tokyo: 9, Beijing: 8, Manila: 8, Bangkok: 7, Jakarta: 7, Dhaka: 6, Dubai: 4, Moscow: 3, Baghdad: 3, Johannesburg: 2, Kinshasa: 1, 'Rio de Janeiro': -3, Manaus: -4, Lima: -5, 'Bogotá': -5, 'Guatemala City': -6 },
  // Mountain ranges: continent, a point on the range, and countries it runs through.
  ranges: {
    Himalaya: ['Asia', [86.9, 28], ['NP', 'CN', 'IN', 'BT', 'PK']], Andes: ['South America', [-70, -22], ['CL', 'AR', 'BO', 'PE', 'EC', 'CO']],
    'Rocky Mountains': ['North America', [-112, 45], ['US', 'CA']], Alps: ['Europe', [10, 46.6], ['CH', 'AT', 'IT', 'FR', 'DE', 'SI', 'LI']],
    'Atlas Mountains': ['Africa', [-4, 32.5], ['MA', 'DZ', 'TN']], 'Ural Mountains': ['Europe', [59, 59], ['RU']], 'Great Dividing Range': ['Oceania', [150, -30], ['AU']],
  },
  // Rivers: continent, the sea they reach, the point where they reach it.
  rivers: {
    Nile: ['Africa', 'Mediterranean Sea', [31, 31.5]], Amazon: ['South America', 'Atlantic Ocean', [-50, 0]], Yangtze: ['Asia', 'East China Sea', [122, 31.4]],
    Mississippi: ['North America', 'Gulf of Mexico', [-89.3, 29.2]], Congo: ['Africa', 'Atlantic Ocean', [12.4, -6]], Ganges: ['Asia', 'Bay of Bengal', [90.6, 22.2]],
    Danube: ['Europe', 'Black Sea', [29.7, 45.2]],
  },
  cityRivers: { Cairo: 'Nile', Shanghai: 'Yangtze', Kinshasa: 'Congo', 'New Orleans': 'Mississippi', Vienna: 'Danube' },
  // Deserts: the countries their heart lies in.
  deserts: {
    Sahara: ['DZ', 'LY', 'EG', 'ML', 'NE', 'TD', 'MR', 'SD', 'TN', 'MA', 'EH'], 'Arabian Desert': ['SA', 'OM', 'AE', 'YE'], 'Gobi Desert': ['MN', 'CN'],
    'Kalahari Desert': ['BW', 'NA', 'ZA'], 'Atacama Desert': ['CL'], 'Australian deserts': ['AU'],
  },
  // Seas and lakes: a point in each (longitude, latitude), typed from an atlas.
  waters: {
    'Mediterranean Sea': [18, 35.5], 'Caribbean Sea': [-75, 15], 'Red Sea': [38, 20.5], 'Black Sea': [34, 43], 'Arabian Sea': [65, 15], 'Bay of Bengal': [88, 15],
    'South China Sea': [114, 12], 'Gulf of Mexico': [-90, 25], 'Hudson Bay': [-85, 60], 'Caspian Sea': [51, 42], 'Lake Baikal': [108, 53.5], 'Great Lakes': [-84, 45], 'Lake Victoria': [33, -1],
  },
  lakes: ['Caspian Sea', 'Lake Baikal', 'Great Lakes', 'Lake Victoria'],
  deepTime: [/Pangaea/, /dinosaurs/, /India collides/, /species/, /Everest/],      // 200 million, 66 million, 50 million, 300,000 and about 70 years ago
  // Example places and their biome.
  biomes: {
    'The Amazon basin': 'rainforest', 'The Congo basin': 'rainforest', Borneo: 'rainforest',
    'The plains of East Africa': 'savanna', 'The Cerrado of Brazil': 'savanna', 'Northern Australia': 'savanna',
    'The Sahara': 'desert', Arabia: 'desert', 'Central Australia': 'desert',
    'Southern Italy': 'mediterranean', California: 'mediterranean', 'The Cape of South Africa': 'mediterranean', 'Central Chile': 'mediterranean',
    Germany: 'temperate forest', 'The eastern United States': 'temperate forest', 'Eastern China': 'temperate forest',
    'The Great Plains of North America': 'steppe', 'The Kazakh steppe': 'steppe',          // not the Pampas: humid, with mild winters, so "too dry for forest" would be false there
    Siberia: 'taiga', 'Northern Canada': 'taiga', Finland: 'taiga',
    'The Arctic coast of Siberia': 'tundra', 'The far north of Canada': 'tundra', Greenland: 'ice', Antarctica: 'ice',
  },
  biomeOrder: ['Rainforest', 'Savanna', 'Desert', 'Mediterranean', 'Temperate forest', 'Taiga', 'Tundra'],          // from the Equator to the Arctic
  crowded: ['Plain of the Ganges', 'Plains of eastern China', 'Java', 'Nile delta', 'North-west Europe', 'Southern Nigeria'],
  empty: ['Sahara', 'Siberia', 'Amazon rainforest', 'Central Australia', 'Greenland', 'Tibetan Plateau', 'Northern Canada'],
  // People (millions) and area (thousands of km²), to work out density independently.
  people: {
    BD: [171, 148], KR: [52, 100], NL: [18, 42], IN: [1430, 3287], PH: [115, 300], JP: [124, 378], VN: [100, 331], PK: [240, 796], GB: [68, 243], NG: [224, 924], DE: [84, 357],
    MN: [3.4, 1564], AU: [26.5, 7692], NA: [3.0, 824], IS: [0.38, 103], LY: [6.9, 1760], CA: [40, 9985], BW: [2.6, 582], KZ: [19.6, 2725], RU: [144, 17098], BO: [12.4, 1099],
    NO: [5.5, 385], FI: [5.6, 338], AR: [46, 2780], SA: [37, 2150], DZ: [45.6, 2382], BR: [216, 8516],
  },
  megacityCountry: {
    Tokyo: 'JP', Delhi: 'IN', Shanghai: 'CN', Jakarta: 'ID', Dhaka: 'BD', Karachi: 'PK', Manila: 'PH', Cairo: 'EG', Lagos: 'NG', Kinshasa: 'CD', Istanbul: 'TR', Moscow: 'RU',
    'São Paulo': 'BR', 'Buenos Aires': 'AR', 'Mexico City': 'MX', 'New York': 'US', 'Los Angeles': 'US',
  },
  // Where each megacity stands (a key word of the description).
  megacitySite: {
    Tokyo: /bay/, Delhi: /Yamuna/, Shanghai: /mouth of the Yangtze/, Jakarta: /Java/, Dhaka: /delta of the Ganges/, Karachi: /Arabian Sea/, Manila: /bay/, Cairo: /Nile/, Lagos: /lagoon/,
    Kinshasa: /Congo River/, Istanbul: /Bosporus/, Moscow: /Moskva/, 'São Paulo': /plateau/, 'Buenos Aires': /Río de la Plata/, 'Mexico City': /high valley/, 'New York': /Hudson/, 'Los Angeles': /Pacific coast/,
  },
  landlocked: [
    'ML', 'BF', 'NE', 'TD', 'CF', 'SS', 'ET', 'UG', 'RW', 'BI', 'MW', 'ZM', 'ZW', 'BW', 'LS', 'SZ',          // Africa: 16
    'BO', 'PY',                                                                                            // South America: 2
    'AD', 'AT', 'BY', 'CH', 'CZ', 'HU', 'LI', 'LU', 'MD', 'MK', 'RS', 'SK', 'SM', 'VA', 'XK',              // Europe (14 UN members and Kosovo)
    'AF', 'AM', 'AZ', 'BT', 'KG', 'KZ', 'LA', 'MN', 'NP', 'TJ', 'TM', 'UZ',                                // Asia: 12
  ],
  islands: ['JP', 'ID', 'PH', 'MG', 'LK', 'NZ', 'IS', 'CU', 'GB', 'IE'],
  borders: {
    Pyrenees: ['FR', 'ES'], 'Rio Grande': ['US', 'MX'], Andes: ['CL', 'AR'], Mekong: ['LA', 'TH'], 'lower Danube': ['BG', 'RO'], Oder: ['DE', 'PL'],
    Amur: ['RU', 'CN'], Congo: ['CD', 'CG'], Zambezi: ['ZM', 'ZW'], 'Great Lakes': ['CA', 'US'],
  },
  stories: [
    [/enclave/, 'LS'], [/newest member of the United Nations/, 'SS'], [/ribbon/, 'CL'], [/17,000 islands/, 'ID'], [/only two neighbours/, 'MN'], [/finger of land/, 'NA'],
    [/Two of the smallest countries/, 'IT'], [/largest country in Africa/, 'DZ'], [/largest landlocked country/, 'KZ'], [/lost its only stretch of coast/, 'BO'], [/Mount Everest/, 'NP'],
  ],
  // Capital and largest city.
  capitals: {
    Australia: ['Canberra', 'Sydney', [149.1, -35.3]], Brazil: ['Brasília', 'São Paulo', [-47.9, -15.8]], Canada: ['Ottawa', 'Toronto', [-75.7, 45.4]],
    'United States': ['Washington', 'New York', [-77, 38.9]], Turkey: ['Ankara', 'Istanbul', [32.9, 39.9]], Nigeria: ['Abuja', 'Lagos', [7.5, 9.1]],
    'New Zealand': ['Wellington', 'Auckland', [174.8, -41.3]], China: ['Beijing', 'Shanghai', [116.4, 39.9]], Pakistan: ['Islamabad', 'Karachi', [73.1, 33.7]],
    Vietnam: ['Hanoi', 'Ho Chi Minh City', [105.8, 21]], Morocco: ['Rabat', 'Casablanca', [-6.8, 34]], Tanzania: ['Dodoma', 'Dar es Salaam', [35.7, -6.2]],
    Kazakhstan: ['Astana', 'Almaty', [71.4, 51.2]], Myanmar: ['Naypyidaw', 'Yangon', [96.1, 19.8]],
  },
  ussr: ['RU', 'UA', 'BY', 'MD', 'EE', 'LV', 'LT', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'KG', 'TJ'],
};

const CONTINENT_NAME = { asia: 'Asia', africa: 'Africa', 'north-america': 'North America', 'south-america': 'South America', antarctica: 'Antarctica', europe: 'Europe', oceania: 'Oceania' };
const bare = (name) => name.replace(/^the /i, '');
const codeByName = (name) => {
  const hit = countryIds('world', { territories: true }).find((id) => countryName(id) === bare(name));
  assert.ok(hit, `"${name}" is a country name the map knows`);
  return hit;
};

/** Which ocean a point in open water is in, by the usual limits (60° S, the Arctic Circle, the capes). */
function oceanOf([lon, lat]) {
  if (lat >= 66.5) return 'Arctic Ocean';
  if (lat <= -60) return 'Southern Ocean';
  if (lon > -70 && lon < 20) return 'Atlantic Ocean';
  if (lon >= 20 && lon < 147 && lat < 30) return 'Indian Ocean';
  return 'Pacific Ocean';
}
/** A [lon, lat] pair that could be a place on Earth. */
const validPoint = (p) => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
/** Is the point in the country, or within `km` of it? */
const inOrNear = (point, code, km = 60) => countryAt(point, 'low', 0) === code || countryAt(point, 'low', km) === code || (() => {
  const [w, s, e, n] = countryInfo(code).box;       // small countries have no shape on the coarse layer: fall back on their box
  return point[0] >= w - 0.6 && point[0] <= e + 0.6 && point[1] >= s - 0.6 && point[1] <= n + 0.6;
})();
/** The state the map widget reports in place mode for a pin at `pin` (same rule as the widget: 25 km of sea is forgiven). */
function placeState(widget, pin, placed = true) {
  const out = { pin, placed, country: placed ? countryAt(pin, 'low', 25) : null };
  const targets = widget.targets || (widget.target ? [{ id: 'target', at: Array.isArray(widget.target) ? widget.target : place(widget.target) }] : []);
  if (targets.length) {
    out.distances = {};
    let best = Infinity;
    for (const t of targets) {
      const km = Math.round(distanceKm(pin, t.at));
      out.distances[t.id] = km;
      if (km < best) { best = km; out.nearest = t.id; }
    }
    out.km = best;
  }
  return out;
}
const cityNear = (at) => {
  const hit = Object.entries(FACTS.cities).find(([, [lat, lon]]) => Math.abs(lat - at[1]) <= 0.75 && Math.abs(lon - at[0]) <= 0.75);
  assert.ok(hit, `a city of the test's table lies at ${at}`);
  return hit[0];
};
const degText = ([lat, lon]) => `${Math.abs(lat)}° ${lat > 0 ? 'N' : 'S'}, ${Math.abs(lon)}° ${lon > 0 ? 'E' : 'W'}`;

/* ============================================================================ whole course */

test('course shape: seven lessons, each within the brief', () => {
  assert.equal(course.id, COURSE);
  assert.deepEqual(Object.keys(lessons), LESSON_IDS);
  for (const [id, lesson] of Object.entries(lessons)) {
    const n = lesson.steps.length;
    assert.ok(n >= 11 && n <= 20, `${id}: ${n} steps`);          // 14 at most before the lessons were given their teaching screens
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    for (const s of reviews) assert.ok(!/^s\d+$/.test(s.id), `${id}/${s.id}: review steps have explicit ids`);
    assert.ok(lesson.steps.filter((s) => typeof s.gen === 'function').length >= 2, `${id}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${id}: no more than five choice steps`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap of 3 or 4 lines`);
    assert.ok(lesson.next.length > 20, `${id}: has a "next" teaser`);
    let handsOn = 0;
    let mapSteps = 0;
    let gradedMap = 0;
    let when = 0;
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(11), step.id);
      const figs = [...s.figures, ...(s.widget ? [s.widget] : [])];
      const interactive = s.type === 'interact' || s.figures.some((f) => (f.type === 'world-map' && !f.static) || f.type === 'timeline');
      if (interactive) handsOn++;
      if (figs.some((f) => f.type === 'world-map')) mapSteps++;
      if (s.type === 'interact' && s.graded && s.widget.type === 'world-map') gradedMap++;
      if (s.type === 'order' || figs.some((f) => f.type === 'timeline')) when++;
      for (const f of figs) assert.ok(f.alt && f.alt.length >= 12, `${id}/${step.id}: every figure has alt text`);
      if (s.graded) assert.ok(s.explain.length > 20, `${id}/${step.id}: graded steps explain themselves`);
    }
    assert.ok(handsOn >= 3, `${id}: ${handsOn} hands-on steps`);
    assert.ok(mapSteps >= 2, `${id}: ${mapSteps} steps on the map`);
    assert.ok(gradedMap >= 1, `${id}: a graded map interaction`);
    assert.ok(when >= 1, `${id}: a timeline or an order step`);
  }
});

test('no learner-visible text contains undefined, NaN or an object', () => {
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(77 + k * 131), step.id);
        for (const text of visible(s)) assert.ok(!/undefined|NaN|\[object Object\]|Infinity|\bnull\b/.test(text), `${id}/${step.id} seed ${k}: ${text}`);
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
      if (!['choice', 'multi', 'bucket', 'match', 'order'].includes(step.type)) continue;
      for (let k = 0; k < SEEDS; k++) {
        const s = resolveStep(step, makeRng(5 + k * 97), step.id);
        if (s.type === 'choice' || s.type === 'multi') {
          const right = s.options.filter((o) => o.correct).length;
          const poll = s.type === 'choice' && s.mode === 'predict' && right === 0;      // an opinion poll has no right answer
          if (s.type === 'choice' && !poll) assert.equal(right, 1, `${id}/${step.id} seed ${k}`);
          if (s.type === 'multi') assert.ok(right >= 1 && right < s.options.length, `${id}/${step.id} seed ${k}`);
          assert.equal(new Set(s.options.map((o) => flat(o.text))).size, s.options.length, `${id}/${step.id} seed ${k}: duplicate options`);
        }
        if (s.type === 'bucket') assert.equal(new Set(s.items.map((it) => it.text)).size, s.items.length, `${id}/${step.id}: duplicate items`);
        if (s.type === 'match') {
          assert.equal(new Set(s.pairs.map((p) => p[0])).size, s.pairs.length, `${id}/${step.id}: duplicate left items`);
          assert.equal(new Set(s.pairs.map((p) => p[1])).size, s.pairs.length, `${id}/${step.id}: duplicate right items`);
        }
        if (s.type === 'order') assert.equal(new Set(s.items).size, s.items.length, `${id}/${step.id}: duplicate items`);
        seen++;
        if (!step.gen) break;
      }
    }
  }
  assert.ok(seen > 1500);
});

test('every country code, region name, view and projection used anywhere is known to the map', () => {
  const regions = new Set(regionNames());
  const known = (v) => countryName(v) !== '' || regions.has(v);
  const check = (v, where) => {
    for (const item of Array.isArray(v) ? v : [v]) {
      if (typeof item === 'string') assert.ok(known(item), `${where}: "${item}" is a country code or a region name`);
      else if (item && typeof item === 'object' && typeof item.id === 'string') assert.ok(known(item.id), `${where}: "${item.id}"`);
    }
  };
  let maps = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < (step.gen ? 60 : 1); k++) {
        const s = resolveStep(step, makeRng(301 + k * 53), step.id);
        for (const fig of [...s.figures, ...(s.widget ? [s.widget] : [])]) {
          if (fig.type !== 'world-map') continue;
          maps++;
          const where = `${id}/${step.id}`;
          for (const g of fig.regions || []) check(g.ids, where);
          if (fig.pickable) check(fig.pickable, where);
          if (Array.isArray(fig.labels)) check(fig.labels.filter((l) => typeof l === 'string' || (l && l.id)), where);
          if (fig.mode === 'pick' || fig.mode === 'pickMany') check(fig.answer, where);
          if (typeof fig.view === 'string') assert.ok(fig.view in VIEWS || known(fig.view), `${where}: view "${fig.view}"`);
          if (fig.view && fig.view.ids) check(fig.view.ids, where);
          if (Array.isArray(fig.view) && typeof fig.view[0] === 'number') {
            assert.equal(fig.view.length, 4, `${where}: a view box is [west, south, east, north]`);
            const [w, so, e, n] = fig.view;
            assert.ok(so < n && Math.abs(so) <= 90 && Math.abs(n) <= 90 && Math.abs(w) <= 180 && Math.abs(e) <= 180 && w < e, `${where}: view box ${fig.view}`);
          }
          if (fig.projection) assert.ok(PROJECTIONS.includes(fig.projection), `${where}: projection "${fig.projection}"`);
          for (const m of fig.markers || []) assert.ok(validPoint(typeof m.at === 'string' ? place(m.at) : m.at), `${where}: marker ${JSON.stringify(m.at)}`);
          for (const line of fig.lines || []) for (const p of line.points) assert.ok(validPoint(typeof p === 'string' ? place(p) : p), `${where}: line point ${JSON.stringify(p)}`);
          for (const a of fig.areas || []) {
            for (const p of a.polygon || []) assert.ok(validPoint(p), `${where}: polygon point ${p}`);
            if (a.circle) assert.ok(validPoint(typeof a.circle === 'string' ? place(a.circle) : a.circle), `${where}: circle centre`);
          }
          for (const t of fig.targets || []) assert.ok(validPoint(t.at), `${where}: target ${t.at}`);
        }
      }
    }
  }
  assert.ok(maps > 150);
  // helper tables that hold codes
  for (const list of [Object.keys(H.STRADDLERS), ...Object.values(H.CONTINENT_COUNTRIES), H.EQUATOR_AFRICA, H.BIG_COUNTRIES, ...Object.values(H.LANDLOCKED), H.LANDLOCKED_ASIA, H.ISLAND_COUNTRIES, H.COASTAL_COUNTRIES, H.USSR,
    Object.keys(H.DENSITY.crowded), Object.keys(H.DENSITY.sparse), H.CITIES.map((c) => c.country), H.MEGACITIES.map((c) => c.country), H.CAPITALS.map((c) => c.country),
    H.BORDER_FEATURES.flatMap((f) => f.pair), H.BORDER_STORIES.flatMap((s) => [s.answer, ...Object.keys(s.wrong)])]) {
    for (const code of list) assert.notEqual(countryName(code), '', `helper table: "${code}" is a country code`);
  }
  for (const key of Object.keys(H.AREAS)) assert.ok(H.areaThing(key).ids.every(known), `AREAS key ${key}`);
});

/* ============================================================================ double entry: the helper tables */

test('helpers agree with the test\'s own facts: continents, oceans, dates', () => {
  assert.deepEqual(H.CONTINENTS.map((c) => [c.name, c.area]), FACTS.continents);
  for (let i = 1; i < H.CONTINENTS.length; i++) assert.ok(H.CONTINENTS[i - 1].area > H.CONTINENTS[i].area, 'continents are listed largest first');
  assert.deepEqual(H.CONTINENTS.map((c) => CONTINENT_NAME[c.id]), FACTS.continents.map((c) => c[0]));
  const land = FACTS.continents.reduce((sum, c) => sum + c[1], 0);
  assert.ok(Math.abs(land - H.LAND_AREA) < 3, `the continents add up to about ${H.LAND_AREA} million km² (${land})`);
  assert.ok(Math.abs((land / 510) * 100 - H.LAND_SHARE) < 1, 'land is about 29% of the 510 million km² of the surface');
  assert.equal(H.NORTH_LAND_SHARE, 68);

  assert.deepEqual(H.OCEANS.map((o) => o.name), FACTS.oceans);
  for (let i = 1; i < H.OCEANS.length; i++) assert.ok(H.OCEANS[i - 1].area > H.OCEANS[i].area, 'oceans are listed largest first');
  const sea = H.OCEANS.reduce((sum, o) => sum + o.area, 0);
  assert.ok(Math.abs(sea - 362) < 6, `the oceans add up to about 362 million km² (${sea})`);
  for (const o of H.OCEANS) assert.ok(Math.abs((o.area / sea) * 100 - o.share) <= 1.01, `${o.name}: ${o.share}% of the ocean`);
  assert.ok(H.ocean('pacific').area > H.LAND_AREA, 'the Pacific is larger than all the land');

  for (const [key, year] of Object.entries(FACTS.years)) assert.equal(H.EVENTS[key].year, year, `EVENTS.${key}`);
  assert.deepEqual(Object.keys(H.EVENTS).sort(), Object.keys(FACTS.years).sort());
  assert.deepEqual(H.BILLIONS, FACTS.billions);
  assert.equal(H.MAP_CHANGES.length, FACTS.mapChanges.length);
  H.MAP_CHANGES.forEach((e, i) => { assert.equal(e.year, FACTS.mapChanges[i][0]); assert.match(e.label, FACTS.mapChanges[i][1]); });
  assert.equal(H.UN_MEMBERS, 193);
  assert.equal(H.TILT, 23.4);
  assert.ok(Math.abs(90 - H.TILT - H.POLAR_CIRCLE) < 1e-9, 'the polar circles lie at 90° minus the tilt');
});

test('helpers agree with the test\'s own facts: countries and continents', () => {
  for (const [cont, codes] of Object.entries(H.CONTINENT_COUNTRIES)) {
    for (const code of codes) {
      assert.equal(FACTS.continentOf[code], CONTINENT_NAME[cont], `${code} is in ${CONTINENT_NAME[cont]}`);
      assert.equal(CONTINENT_NAME[countryInfo(code).continent], CONTINENT_NAME[cont], `the map agrees about ${code}`);
      assert.ok(!(code in H.STRADDLERS), `${code} is not a country on two continents`);
    }
  }
  assert.equal(Object.values(H.CONTINENT_COUNTRIES).flat().length, Object.keys(FACTS.continentOf).length);
  assert.deepEqual(H.EQUATOR_AFRICA.filter((id) => id !== 'ST').sort(), FACTS.equatorAfrica.slice().sort());
  for (const id of FACTS.equatorAfrica) { const [, s, , n] = countryInfo(id).box; assert.ok(s < 0 && n > 0, `${id} has land on both sides of the Equator`); }
  // continentsAt: the pin-placing rule
  for (const [name, pin] of FACTS.points) {
    const here = H.continentsAt(countryAt(pin, 'low', 25), pin).map((id) => CONTINENT_NAME[id]);
    if (name === null) assert.deepEqual(here, [], `${pin} is at sea`);
    else assert.ok(here.includes(name), `${pin} is in ${name} (got ${here})`);
  }
  assert.deepEqual(H.continentsAt('RU', [37, 55]), ['europe']);
  assert.deepEqual(H.continentsAt('RU', [100, 60]), ['asia']);
  assert.deepEqual(H.continentsAt('RU', [-175, 66]), ['asia']);
  assert.deepEqual(H.continentsAt('RU', [60, 57]).sort(), ['asia', 'europe']);
  assert.deepEqual(H.continentsAt(null, [0, 0]), []);
});

test('helpers agree with the test\'s own facts: areas and the Mercator pairs', () => {
  const name = (key) => bare(H.areaThing(key).name);
  for (const [polar, tropical] of H.SIZE_PAIRS) {
    for (const key of [polar, tropical]) {
      assert.ok(name(key) in FACTS.areas, `the test knows the area of ${name(key)}`);
      assert.ok(Math.abs(H.AREAS[key] / 1000 - FACTS.areas[name(key)]) / FACTS.areas[name(key)] < 0.02, `${name(key)}: ${H.AREAS[key]} thousand km²`);
    }
    const ratio = FACTS.areas[name(polar)] / FACTS.areas[name(tropical)];
    assert.ok(ratio >= 1.5 || ratio <= 1 / 1.5, `${name(polar)} and ${name(tropical)} differ by a factor of at least 1.5`);
    // "polar" really is the one further from the Equator
    const lat = (key) => Math.abs(key === 'africa' ? 2 : key === 'nordic3' ? 63 : countryInfo(key).center[1]);
    assert.ok(lat(polar) > lat(tropical) + 10, `${name(polar)} lies further from the Equator than ${name(tropical)}`);
  }
  assert.equal(Math.round(FACTS.areas.Africa / FACTS.areas.Greenland), 14);
  // the six giants of lesson 7, in order, and nothing else as large
  const giants = ['RU', 'CA', 'CN', 'BR', 'AU', 'IN'];
  for (let i = 1; i < giants.length; i++) assert.ok(H.AREAS[giants[i - 1]] > H.AREAS[giants[i]]);
  for (const id of H.BIG_COUNTRIES) { const [w, , e] = countryInfo(id).box; assert.ok(e - w >= 14, `${id} is wide enough to tap on a world map`); }
});

test('helpers agree with the test\'s own facts: cities, clocks and coordinates', () => {
  const tables = [['CITIES', H.CITIES], ['MEGACITIES', H.MEGACITIES], ['CLOCKS', H.CLOCKS], ['SAME_LATITUDE', [H.SAME_LATITUDE.sea, H.SAME_LATITUDE.inland]]];
  for (const [label, list] of tables) {
    for (const c of list) {
      assert.ok(validPoint(c.at), `${label}: ${c.name} ${c.at}`);
      const fact = FACTS.cities[c.name];
      assert.ok(fact, `${label}: the test knows ${c.name}`);
      assert.ok(Math.abs(c.at[1] - fact[0]) <= 0.75 && Math.abs(c.at[0] - fact[1]) <= 0.75, `${label}: ${c.name} is at about ${degText(fact)}, not ${c.at}`);
      if (c.country) assert.equal(c.country, fact[2], `${label}: ${c.name} is in ${fact[2]}`);
      assert.ok(inOrNear(c.at, fact[2]), `${label}: ${c.name} at ${c.at} lies in ${countryName(fact[2])}`);
      assert.ok(!inOrNear([c.at[1], c.at[0]], fact[2]) || Math.abs(c.at[0] - c.at[1]) < 12, `${label}: ${c.name}: a swapped pair would be noticed`);
      const known = place(c.name);
      if (known) assert.ok(distanceKm(known, c.at) < 30, `${label}: ${c.name} agrees with the map's own table of places`);
    }
  }
  for (const c of H.CITIES) assert.ok(Math.abs(c.at[0]) >= 10 && Math.abs(c.at[1]) >= 10, `${c.name} is far from the Equator and the prime meridian`);
  assert.equal(new Set(H.CITIES.map((c) => `${Math.round(c.at[1])},${Math.round(c.at[0])}`)).size, H.CITIES.length, 'no two cities share rounded coordinates');
  // clocks
  assert.deepEqual(Object.fromEntries(H.CLOCKS.map((c) => [c.name, c.offset])), FACTS.clocks);
  for (const c of H.CLOCKS) assert.ok(Math.abs(c.at[0] - 15 * c.offset) <= 7.5, `${c.name}: its clock agrees with the Sun to within half an hour`);
  // same latitude, sea and inland
  const { sea, inland, latitude } = H.SAME_LATITUDE;
  assert.ok(Math.abs(sea.at[1] - latitude) < 0.5 && Math.abs(inland.at[1] - latitude) < 0.5);
  assert.deepEqual([sea.name, sea.jan, sea.jul, inland.name, inland.jan, inland.jul], ['Edinburgh', 4, 15, 'Moscow', -6, 20]);
  for (const c of H.seasonCities()) assert.ok(Math.abs(FACTS.cities[c.name][0]) >= 26, `${c.name} is outside the tropics`);
  // megacities
  assert.deepEqual(Object.fromEntries(H.MEGACITIES.map((c) => [c.name, c.country])), FACTS.megacityCountry);
});

test('helpers agree with the test\'s own facts: mountains, rivers, deserts, seas', () => {
  assert.deepEqual(H.RANGES.map((r) => r.name).sort(), Object.keys(FACTS.ranges).sort());
  for (const r of H.RANGES) {
    const [cont, at, countries] = FACTS.ranges[r.name];
    assert.equal(CONTINENT_NAME[r.continent], cont, `${r.name} is in ${cont}`);
    assert.ok(distanceKm(r.at, at) < 600, `${r.name}: marker at ${r.at} is on the range (${Math.round(distanceKm(r.at, at))} km from ${at})`);
    for (const p of [r.at, ...r.line]) {
      assert.ok(validPoint(p), `${r.name}: ${p}`);
      assert.ok(countries.includes(countryAt(p, 'low', 120)), `${r.name}: ${p} is in ${countryAt(p, 'low', 120)}, expected one of ${countries}`);
    }
  }
  assert.deepEqual(H.RIVERS.map((r) => r.name).sort(), Object.keys(FACTS.rivers).sort());
  const seas = new Set([...H.RIVERS.map((r) => r.into), ...H.OTHER_SEAS]);
  for (const r of H.RIVERS) {
    const [cont, into, mouth] = FACTS.rivers[r.name];
    assert.equal(CONTINENT_NAME[r.continent], cont, `the ${r.name} is in ${cont}`);
    assert.equal(r.into, into, `the ${r.name} flows into the ${into}`);
    assert.ok(distanceKm(r.mouth, mouth) < 80, `the mouth of the ${r.name} is at about ${mouth}`);
    const land = countryAt(r.mouth, 'low', 120);
    assert.ok(land && H.continentsAt(land, r.mouth).includes(r.continent), `the mouth of the ${r.name} is on the coast of ${cont}`);
    for (const sea of r.notInto) assert.ok(seas.has(sea), `${r.name}: "${sea}" is one of the seas on offer`);
    assert.ok(place(r.city), `${r.city} is a place the map knows`);
  }
  assert.deepEqual(Object.fromEntries(H.CITY_RIVERS), FACTS.cityRivers);
  for (const [city, riverName] of H.CITY_RIVERS) assert.ok(H.RIVERS.some((r) => r.name === riverName) && place(city), `${city} on the ${riverName}`);
  // rivers the lessons ask the map to draw by name exist in the map's river data
  const riverData = RIVER_DATA.rivers.map((r) => r[0]);
  for (const r of H.RIVERS) assert.ok(riverData.includes(r.name), `the map can draw the ${r.name}`);

  assert.deepEqual(H.DESERTS.map((d) => d.name).sort(), Object.keys(FACTS.deserts).sort());
  for (const d of H.DESERTS) {
    assert.ok(d.view in VIEWS, `${d.name}: view ${d.view}`);
    for (const core of d.cores) {
      assert.ok(FACTS.deserts[d.name].includes(countryAt(core, 'low', 0)), `${d.name}: core ${core} is in ${countryAt(core, 'low', 0)}`);
      assert.ok(pointInPolygon(core, d.area), `${d.name}: core ${core} lies inside the drawn outline`);
      const [w, s, e, n] = VIEWS[d.view];
      assert.ok(core[0] > w && core[0] < e && core[1] > s && core[1] < n, `${d.name}: core ${core} is on the ${d.view} map`);
    }
    for (const p of d.area) assert.ok(validPoint(p) && d.cores.some((c) => distanceKm(c, p) < d.within + 900), `${d.name}: outline point ${p}`);
    assert.ok(d.within >= 500 && d.within <= 900);
  }
  assert.deepEqual(H.WATERS.map((w) => w.name).sort(), Object.keys(FACTS.waters).sort());
  for (const w of H.WATERS) {
    assert.ok(distanceKm(w.at, FACTS.waters[w.name]) < 250, `${w.name} is at about ${FACTS.waters[w.name]}`);
    assert.equal(w.kind === 'lake', FACTS.lakes.includes(w.name), `${w.name}: sea or lake`);
    if (w.kind === 'sea') assert.equal(countryAt(w.at, 'low', 0), null, `${w.name}: the marker stands in the water`);
  }
  for (const o of H.OCEANS) for (const spot of o.spots) {
    assert.equal(oceanOf(spot), o.name, `${spot} is in the ${o.name}`);
    assert.equal(countryAt(spot, 'low', 300), null, `${spot} is in open water`);
  }
  assert.deepEqual(H.DEEP_TIME.map((e) => e.ago), [200e6, 66e6, 50e6, 300e3, 70]);
  H.DEEP_TIME.forEach((e, i) => assert.match(e.label, FACTS.deepTime[i]));
});

test('helpers agree with the test\'s own facts: climate and biomes', () => {
  assert.equal(H.COOLING_PER_KM, 6);
  for (const b of H.BIOMES) {
    for (const spot of b.spots) {
      assert.equal(FACTS.biomes[spot.place], b.name === 'tropical rainforest' ? 'rainforest' : b.name === 'Mediterranean scrub' ? 'mediterranean' : b.name === 'ice cap' ? 'ice' : b.name, `${spot.place} is ${b.name}`);
      assert.ok(validPoint(spot.at) && countryAt(spot.at, 'low', 30), `${spot.place}: ${spot.at} is on land`);
    }
  }
  assert.equal(H.BIOMES.flatMap((b) => b.spots).length, Object.keys(FACTS.biomes).length);
  // latitude belts: where each example lies
  const absLat = (id) => H.biome(id).spots.map((sp) => Math.abs(sp.at[1]));
  assert.ok(absLat('rainforest').every((v) => v <= 8));
  assert.ok(absLat('savanna').every((v) => v > 3 && v < 20));
  assert.ok(absLat('desert').every((v) => v >= 18 && v <= 30));
  assert.ok(absLat('mediterranean').every((v) => v >= 30 && v <= 42));
  assert.ok(absLat('taiga').every((v) => v >= 52 && v <= 66));
  assert.ok(absLat('tundra').every((v) => v >= 66));
  // the walk from the Congo to the Arctic goes steadily north
  const walk = H.BIOMES.filter((b) => b.transect);
  for (let i = 1; i < walk.length; i++) assert.ok(walk[i].transect[1] > walk[i - 1].transect[1] + 5, `${walk[i].short} is north of ${walk[i - 1].short}`);
  assert.deepEqual(walk.filter((b) => b.id !== 'ice').map((b) => b.short), FACTS.biomeOrder);
  // currents: warm ones flow away from the Equator, cold ones towards it; the two dry coasts lie beside cold currents
  for (const c of H.CURRENTS) {
    const start = Math.abs(c.path[0][1]);
    const end = Math.abs(c.path[c.path.length - 1][1]);
    assert.equal(end > start, c.warm, `${c.name}: ${c.warm ? 'warm, flowing poleward' : 'cold, flowing towards the Equator'}`);
    for (const p of c.path) assert.ok(validPoint(p));
  }
  assert.deepEqual(H.CURRENT_SPOTS.filter((p) => p.dry).map((p) => p.id).sort(), ['atacama', 'namib']);
  for (const spot of H.CURRENT_SPOTS) {
    const nearCold = H.CURRENTS.some((c) => !c.warm && c.path.some((p) => distanceKm(p, spot.at) < 700));
    assert.equal(nearCold, spot.dry, `${spot.label}: beside a cold current exactly when it is a desert coast`);
  }
  assert.equal(countryAt(H.CURRENT_SPOTS.find((p) => p.id === 'atacama').at, 'low', 40), 'CL');
  assert.equal(countryAt(H.CURRENT_SPOTS.find((p) => p.id === 'namib').at, 'low', 40), 'NA');
  assert.equal(countryAt(H.CURRENT_SPOTS.find((p) => p.id === 'norway').at, 'low', 60), 'NO');
});

test('helpers agree with the test\'s own facts: people and countries', () => {
  assert.equal(Math.round(H.POPULATION_SHARE.reduce((sum, r) => sum + r.share, 0)), 100);
  assert.deepEqual(H.POPULATION_SHARE.map((r) => r.share), [59, 18, 9, 8, 5, 0.6]);
  assert.deepEqual(H.PEOPLE_SPOTS.filter((p) => p.dense).map((p) => p.label).sort(), FACTS.crowded.slice().sort());
  assert.deepEqual(H.PEOPLE_SPOTS.filter((p) => !p.dense).map((p) => p.label).sort(), FACTS.empty.slice().sort());
  for (const p of H.PEOPLE_SPOTS) assert.ok(validPoint(p.at) && countryAt(p.at, 'low', 60), `${p.label} is on land`);
  // density, worked out here from people and area
  const density = (code) => (FACTS.people[code][0] * 1e6) / (FACTS.people[code][1] * 1e3);
  for (const [group, table] of Object.entries(H.DENSITY)) {
    for (const [code, stated] of Object.entries(table)) {
      assert.ok(FACTS.people[code], `the test knows the people and area of ${code}`);
      assert.ok(Math.abs(stated - density(code)) / density(code) < 0.15 || Math.abs(stated - density(code)) < 1.5, `${code} (${group}): about ${Math.round(density(code))} per km², stated ${stated}`);
    }
  }
  const least = Math.min(...Object.keys(H.DENSITY.crowded).map(density));
  const most = Math.max(...Object.keys(H.DENSITY.sparse).map(density));
  assert.ok(least / most >= 8, `every crowded country is at least eight times as dense as every sparse one (${least.toFixed(0)} against ${most.toFixed(0)})`);

  for (const region of Object.keys(H.LANDLOCKED)) for (const code of H.LANDLOCKED[region]) assert.ok(FACTS.landlocked.includes(code), `${code} is landlocked`);
  assert.equal(H.LANDLOCKED.africa.length, 16);
  assert.deepEqual(H.LANDLOCKED['south-america'].slice().sort(), ['BO', 'PY']);
  for (const code of H.LANDLOCKED.africa) assert.equal(countryInfo(code).continent, 'africa');
  for (const code of H.LANDLOCKED.europe) assert.equal(countryInfo(code).continent, 'europe');
  for (const code of H.LANDLOCKED_ASIA) assert.ok(FACTS.landlocked.includes(code) && countryInfo(code).continent === 'asia', `${code} is landlocked, in Asia`);
  assert.deepEqual(H.ISLAND_COUNTRIES.slice().sort(), FACTS.islands.slice().sort());
  for (const code of [...H.ISLAND_COUNTRIES, ...H.COASTAL_COUNTRIES]) assert.ok(!FACTS.landlocked.includes(code), `${code} has a coast`);
  for (const code of H.COASTAL_COUNTRIES) assert.ok(!FACTS.islands.includes(code), `${code} is on a mainland`);

  assert.deepEqual(Object.fromEntries(H.BORDER_FEATURES.map((f) => [f.feature, f.pair])), FACTS.borders);
  assert.equal(H.BORDER_STORIES.length, FACTS.stories.length);
  for (const story of H.BORDER_STORIES) {
    const hits = FACTS.stories.filter(([re]) => re.test(story.clue));
    assert.equal(hits.length, 1, `story ${story.id} matches one of the test's clues`);
    assert.equal(story.answer, hits[0][1], `story ${story.id}`);
    assert.ok(story.view in VIEWS, `story ${story.id}: view ${story.view}`);
    const [w, s, e, n] = VIEWS[story.view];
    const [lon, lat] = countryInfo(story.answer).center;
    assert.ok(lon > w && lon < e && lat > s && lat < n, `story ${story.id}: ${story.answer} is on the ${story.view} map`);
    assert.ok(!(story.answer in story.wrong));
  }
  for (const c of H.CAPITALS) {
    const fact = FACTS.capitals[countryName(c.country)];
    assert.ok(fact, `the test knows the capital of ${countryName(c.country)}`);
    assert.ok(c.capital.startsWith(fact[0]), `${countryName(c.country)}: capital ${fact[0]}`);
    assert.equal(c.largest, fact[1], `${countryName(c.country)}: largest city ${fact[1]}`);
    assert.ok(distanceKm(place(c.capital), fact[2]) < 60, `${c.capital} is at about ${fact[2]}`);
    assert.equal(countryInfo(c.country).capital, c.capital, `the map's own table agrees about ${c.capital}`);
    for (const key of ['capital', 'largest', 'other']) if (c[key]) assert.ok(inOrNear(place(c[key]), c.country), `${c[key]} is in ${countryName(c.country)}`);
    assert.equal(new Set([c.capital, c.largest, c.other]).size, 3);
  }
  assert.deepEqual(H.USSR.slice().sort(), FACTS.ussr.slice().sort());
  assert.equal(H.USSR.length, 15);
});

/* ============================================================================ lesson 1 */

test('lesson 1: place the pin on a continent', () => {
  const seen = new Set();
  for (const step of covers('continents-oceans', 'place-continent')) {
    const name = grab(/Place the pin anywhere on (.+?)\.\*\*/, flat(step.text))[0];
    seen.add(name);
    assert.equal(step.widget.mode, 'place');
    assert.equal(step.check(placeState(step.widget, step.solution.pin)), true, `${name}: the solution passes`);
    assert.ok(isMessage(step.check(placeState(step.widget, [0, 0], false))), 'an unmoved pin is sent back');
    for (const [where, pin] of FACTS.points) {
      const res = step.check(placeState(step.widget, pin));
      assert.equal(res === true, where === name, `${name}: a pin at ${pin} (${where})`);
      if (res !== true) assert.ok(isMessage(res), `${name}: a pin at ${pin} gets a message`);
      if (where === null) assert.match(res, /in the sea/);
    }
  }
  assert.equal(seen.size, 7);
});

test('lesson 1: which marker is in which ocean', () => {
  for (const step of covers('continents-oceans', 'find-ocean')) {
    const name = grab(/Tap the marker in the (.+?)\.\*\*/, flat(step.text))[0];
    const { markers } = step.widget;
    assert.equal(markers.length, 5);
    assert.deepEqual(markers.map((m) => oceanOf(m.at)).sort(), FACTS.oceans.slice().sort(), 'one marker in each ocean');
    for (const m of markers) assert.equal(m.label, oceanOf(m.at), `the marker at ${m.at} is labelled with its own ocean`);
    const right = markers.filter((m) => oceanOf(m.at) === name);
    assert.equal(right.length, 1);
    assert.equal(step.solution.picked, right[0].id);
    assert.equal(step.widget.answer, right[0].id);
    assert.equal(step.widget.markerLabels, 'after');
    assert.equal(step.check({ picked: right[0].id }), true);
    assert.equal(step.check({ picked: null }), false);
    for (const m of markers.filter((x) => x !== right[0])) {
      const res = step.check({ picked: m.id });
      assert.ok(isMessage(res) && res.includes(oceanOf(m.at)) && res.includes(`Marker ${'ABCDE'[markers.indexOf(m)]}`), `wrong marker ${m.id}: ${res}`);
    }
    for (let i = 0; i < markers.length; i++) for (let j = i + 1; j < markers.length; j++) assert.ok(distanceKm(markers[i].at, markers[j].at) > 2500, 'markers stand far apart');
  }
});

test('lesson 1: which continent is the country on', () => {
  const kinds = new Set();
  for (const step of covers('continents-oceans', 'which-continent')) {
    const text = flat(step.text);
    const right = correctOf(step);
    let m;
    if ((m = /Which of these countries is in \*\*(.+?)\*\*\?/.exec(text))) {
      kinds.add('country');
      for (const o of step.options) assert.equal(FACTS.continentOf[codeByName(o.text)] === m[1], !!o.correct, `${o.text} and ${m[1]}`);
      for (const o of step.options.filter((x) => !x.correct)) assert.ok(o.why.includes(FACTS.continentOf[codeByName(o.text)]), `the feedback for ${o.text} names its continent`);
    } else {
      kinds.add('continent');
      const country = grab(/On which continent is \*\*(.+?)\*\*\?/, text)[0];
      assert.equal(right.text, FACTS.continentOf[codeByName(country)], `${country}`);
      for (const o of step.options) assert.ok(Object.values(CONTINENT_NAME).includes(o.text));
    }
    assert.equal(step.options.length, 4);
    assert.ok(step.explain.includes(right.text));
  }
  assert.equal(kinds.size, 2);
});

test('lesson 1: fixed steps', () => {
  const hook = one('continents-oceans', 'hook');
  assert.equal(hook.answer, 29);
  assert.match(flat(hook.explain), /About \*\*29%\*\*.*other 71%/);
  const sizes = one('continents-oceans', 'sizes');
  assert.deepEqual(sizes.items.map((t) => t.replace('Australia (with Oceania)', 'Oceania')), FACTS.continents.map((c) => c[0]));
  for (const [name, area] of FACTS.continents) assert.ok(flat(sizes.explain).includes(`${name === 'Oceania' ? 'Australia with Oceania' : name} ${area}`), `the explanation gives ${name} ${area}`);
  // the chart: each statement is judged here from the test's own areas
  const chart = one('continents-oceans', 'chart');
  const A = Object.fromEntries(FACTS.continents);
  const truth = (text) => {
    if (/Asia is larger than Africa and Europe put together/.test(text)) return A.Asia > A.Africa + A.Europe;
    if (/Africa is about three times the size of Europe/.test(text)) return Math.abs(A.Africa / A.Europe - 3) < 0.15;
    if (/Antarctica is larger than Europe/.test(text)) return A.Antarctica > A.Europe;
    if (/South America is larger than North America/.test(text)) return A['South America'] > A['North America'];
    if (/Europe is the smallest continent/.test(text)) return Math.min(...Object.values(A)) === A.Europe;
    throw new Error(`unexpected statement: ${text}`);
  };
  for (const o of chart.options) assert.equal(!!o.correct, truth(o.text), o.text);
  assert.deepEqual(chart.figures[0].data.map((d) => d.value), FACTS.continents.map((c) => c[1]));
  assert.match(flat(chart.explain), /30\.4 \+ 10\.2 = 40\.6/);
  assert.ok(Math.abs(A.Africa + A.Europe - 40.6) < 1e-9);
  // the Pacific against the land
  const pacific = one('continents-oceans', 'pacific');
  assert.match(correctOf(pacific).text, /larger than all the land/);
  assert.ok(flat(pacific.explain).includes('169 million') && flat(pacific.explain).includes('149 million') && flat(pacific.explain).includes('1520'));
  const north = one('continents-oceans', 'north-heavy');
  assert.equal(north.answer, 68);
  assert.deepEqual(north.figures.map((f) => f.center[1]), [90, -90]);
  // the old map: Australia and Antarctica are the ones missing
  const old = one('continents-oceans', 'old-map');
  assert.deepEqual(old.options.filter((o) => o.correct).map((o) => o.text).sort(), ['Antarctica', 'Australia']);
  assert.match(old.text, /1507/);
  assert.equal(1507 - 1492, 15);
  assert.match(old.text, /fifteen years after Columbus/);
});

test('lesson 1: the Equator in Africa', () => {
  const step = one('continents-oceans', 'equator');
  assert.equal(step.check({ picked: step.solution.picked, name: countryName(step.solution.picked) }), true);
  for (const id of countryIds('africa')) {
    const [, s, , n] = countryInfo(id).box;
    const crossed = FACTS.equatorAfrica.includes(id) || id === 'ST';
    const res = step.check({ picked: id, name: countryName(id) });
    assert.equal(res === true, crossed, `${countryName(id)}`);
    if (!crossed) {
      assert.ok(isMessage(res) && res.includes(countryName(id)));
      assert.equal(/entirely north/.test(res), s > 0, `${countryName(id)}: north or south of the line`);
      assert.ok(s > 0 || n < 0 || id === 'GQ', `${countryName(id)} really lies on one side`);
    }
  }
  assert.equal(step.check({ picked: null, name: null }), false);
  for (const id of FACTS.equatorAfrica) assert.ok(flat(step.explain).includes(countryName(id)));
  assert.deepEqual(step.widget.answer.slice().sort(), [...FACTS.equatorAfrica, 'ST'].sort());
});

/* ---------------------------------------------------------------- timelines */

/** A timeline step with cards: the solution passes; each card moved outside the stated tolerance fails with a message. */
function checkTimeline(lesson, id, cards, tolerance) {
  const step = one(lesson, id);
  const text = flat(step.text);
  assert.ok(new RegExp(`[Ww]ithin ${tolerance} years counts`).test(text), `${lesson}/${id}: the text states the tolerance of ${tolerance} years`);
  const { widget } = step;
  assert.equal(widget.type, 'timeline');
  assert.deepEqual(widget.place.map((c) => c.id).sort(), Object.keys(cards).sort());
  for (const c of widget.place) assert.equal(c.answer, cards[c.id], `${lesson}/${id}: card ${c.id}`);
  for (const e of widget.events) assert.ok(e.year >= widget.from && e.year <= widget.to && e.year !== 0);
  const state = (placed) => { const count = Object.values(placed).filter((v) => v != null).length; return { placed, count, complete: count === widget.place.length }; };
  assert.equal(step.check(state(step.solution.placed)), true, `${lesson}/${id}: the solution passes`);
  assert.equal(step.check(state({ ...cards })), true, 'the exact years pass');
  for (const key of Object.keys(cards)) {
    assert.ok(Math.abs(step.solution.placed[key] - cards[key]) <= tolerance / 2, `${lesson}/${id}: the solution for ${key} is close to the date`);
    for (const d of [-tolerance, tolerance]) assert.equal(step.check(state({ ...cards, [key]: cards[key] + d })), true, `${key} at the edge of the tolerance (${d})`);
    for (const d of [-(tolerance + widget.snap), tolerance + widget.snap, -3 * tolerance, 3 * tolerance]) {
      const year = cards[key] + d;
      if (year < widget.from || year > widget.to) continue;
      assert.ok(isMessage(step.check(state({ ...cards, [key]: year }))), `${lesson}/${id}: ${key} at ${year} is outside the tolerance`);
    }
    assert.ok(isMessage(step.check(state({ ...cards, [key]: null }))), 'an unplaced card is sent back');
    assert.ok(cards[key] - tolerance - widget.snap >= widget.from || cards[key] + tolerance + widget.snap <= widget.to, 'the axis has room for a wrong answer');
  }
  return step;
}

test('timelines: America and Antarctica; Harrison and Greenwich; four billion', () => {
  const a = checkTimeline('continents-oceans', 'when', { america: FACTS.years.america, antarctica: FACTS.years.antarctica }, 100);
  assert.deepEqual(a.widget.events.map((e) => e.year), [FACTS.years.columbus, FACTS.years.australia, FACTS.years.blueMarble]);
  assert.ok(flat(a.explain).includes('1507') && flat(a.explain).includes('1820'));
  const b = checkTimeline('latitude-longitude', 'when', { watch: FACTS.years.harrisonH4, greenwich: FACTS.years.greenwich }, 50);
  assert.deepEqual(b.widget.events.map((e) => e.year), [FACTS.years.columbus, FACTS.years.frenchRevolution, FACTS.years.moonLanding]);
  assert.ok(flat(b.explain).includes('1761') && flat(b.explain).includes('1884') && flat(b.text).includes('1884'));
  const c = checkTimeline('where-people-live', 'when', { four: FACTS.billions[4] }, 25);
  assert.deepEqual(c.widget.events.map((e) => e.year), [FACTS.billions[1], FACTS.billions[2], FACTS.billions[8]]);
  const ex = flat(c.explain);
  assert.ok(ex.includes(`took ${1927 - 1804} years`) && ex.includes(`${1974 - 1927} years`) && ex.includes(`${2022 - 1974} years`));
});

/* ============================================================================ lesson 2 */

test('lesson 2: which is really larger', () => {
  const winners = { polar: 0, tropical: 0 };
  for (const step of covers('maps-lie', 'true-size')) {
    const [a, b] = grab(/Which is really larger: \[(.+?)\]\{\.blue\} or \[(.+?)\]\{\.orange\}\?/, flat(step.text)).map(bare);
    assert.ok(a in FACTS.areas && b in FACTS.areas, `${a}, ${b}`);
    const bigger = FACTS.areas[a] > FACTS.areas[b] ? a : b;
    const right = correctOf(step);
    assert.equal(bare(right.text).toLowerCase(), bigger.toLowerCase(), `${a} against ${b}`);
    const ratio = Math.max(FACTS.areas[a], FACTS.areas[b]) / Math.min(FACTS.areas[a], FACTS.areas[b]);
    assert.ok(ratio >= 1.5, `${a} and ${b} are not close in size`);
    assert.equal(step.options.length, 3);
    assert.match(step.options[2].text, /about the same size/);
    assert.ok(!step.options[2].correct);
    assert.equal(step.figures[0].projection, 'mercator');
    assert.deepEqual(step.figures[0].regions.map((g) => bare(g.label).toLowerCase()), [a.toLowerCase(), b.toLowerCase()]);
    // the wording of the ratio is honest
    const ex = flat(step.explain);
    const said = /about (\d+(?:\.\d)?) times/.exec(ex);
    if (said) assert.ok(Math.abs(Number(said[1]) - ratio) <= 0.3, `"about ${said[1]} times" for a ratio of ${ratio.toFixed(2)}`);
    else if (/about twice/.test(ex)) assert.ok(ratio >= 1.9 && ratio < 2.25);
    else if (/nearly twice/.test(ex)) assert.ok(ratio >= 1.65 && ratio < 1.9);
    else { assert.match(ex, /about one and a half times/); assert.ok(ratio < 1.65); }
    assert.ok(bare(ex).toLowerCase().startsWith(bigger.toLowerCase()), 'the explanation starts with the larger one');
    assert.ok(!/(^|[.:] |than |of |or |\[)United States/.test(`${flat(step.text)} ${ex}`), 'the United States takes its article');
    winners[bigger === a ? 'polar' : 'tropical']++;
  }
  assert.ok(winners.polar > 30 && winners.tropical > 30, 'the answer is not always the one nearer the Equator');
});

test('lesson 2: find the country on a map with another centre', () => {
  const seen = new Set();
  for (const step of covers('maps-lie', 'recentred')) {
    const name = grab(/\*\*Tap (.+?)\.\*\*/, flat(step.text))[0];
    const code = codeByName(name);
    seen.add(code);
    assert.equal(step.widget.center, 150);
    assert.equal(step.solution.picked, code);
    assert.equal(step.widget.answer, code);
    assert.equal(step.check({ picked: code, name }), true);
    assert.equal(step.check({ picked: null, name: null }), false);
    for (const other of ['BR', 'CA', 'AU', 'IN', 'FR', 'NG'].filter((id) => id !== code)) {
      const res = step.check({ picked: other, name: countryName(other) });
      assert.ok(isMessage(res) && res.startsWith(`That is ${countryName(other)}.`) && res.toLowerCase().includes(name.toLowerCase()), `${other} for ${code}: ${res}`);
    }
    assert.ok(step.hints[0].toLowerCase().includes(name.toLowerCase()));
    if (code === 'US') assert.equal(name, 'the United States');
    // directions are those of the page (cut at 30° W): on it India lies to the left of the United States and Algeria to the left of Brazil
    const page = (id) => { const lon = countryInfo(id).center[0]; return lon < -30 ? lon + 360 : lon; };
    for (const [from, to] of [['US', 'IN'], ['BR', 'DZ'], ['CN', 'US'], ['DZ', 'CN'], ['AU', 'AR'], ['SA', 'MX']]) {
      if (to !== code) continue;
      const res = step.check({ picked: from, name: countryName(from) });
      assert.match(res, /On this map, .+ is to the [a-z-]+ of it\.$/);
      assert.equal(/west/.test(res), page(to) < page(from), `${from} to ${to}: ${res}`);
      assert.equal(/east/.test(res), page(to) > page(from), `${from} to ${to}: ${res}`);
    }
  }
  assert.ok(seen.size >= 12);
});

test('lesson 2: fixed steps', () => {
  const hook = one('maps-lie', 'hook');
  assert.equal(hook.answer, Math.round(FACTS.areas.Africa / FACTS.areas.Greenland));
  assert.equal(hook.answer, 14);
  assert.ok(FACTS.areas['United States'] + FACTS.areas.China + FACTS.areas.India < FACTS.areas.Africa, 'Africa holds the United States, China and India together');
  const globe = one('maps-lie', 'globe');
  assert.equal(globe.check({ picked: 'GL', name: 'Greenland' }), true);
  for (const id of ['IS', 'CA', 'NO', 'DZ']) assert.ok(isMessage(globe.check({ picked: id, name: countryName(id) })));
  assert.ok(isMessage(globe.check({ picked: null, name: null })));
  assert.ok(Math.abs(FACTS.areas.Greenland - 2.15) < 0.05, 'Greenland is about the size of Saudi Arabia (2.15 million km²)');
  // Mercator at 60°: twice as wide, twice as tall
  const stretch = one('maps-lie', 'stretch');
  const k = 1 / Math.cos((60 * Math.PI) / 180);
  assert.ok(Math.abs(k - 2) < 1e-9);
  assert.equal(stretch.answer, Math.round(k * k));
  assert.ok(Math.abs(1 / Math.cos((75 * Math.PI) / 180) ** 2 - 15) < 0.2, 'about 15 times at 75°');
  assert.match(flat(stretch.explain), /75° N.*about 15 times/);
  // the two routes: lengths recomputed here
  const rhumb = one('maps-lie', 'rhumb');
  const from = place('London');
  const to = place('Los Angeles');
  const gc = distanceKm(from, to);
  const rad = Math.PI / 180;
  const psi = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * rad) / 2));
  const dPhi = (to[1] - from[1]) * rad;
  const q = dPhi / (psi(to[1]) - psi(from[1]));
  const loxo = 6371 * Math.hypot(dPhi, q * (to[0] - from[0]) * rad);
  const ex = flat(rhumb.explain);
  const [saidGc, saidLoxo] = grab(/red route is about ([\d,]+) km; the blue one about ([\d,]+) km/, ex).map((v) => Number(v.replace(/,/g, '')));
  assert.ok(Math.abs(saidGc - gc) < 60, `great circle ${gc.toFixed(0)} km, stated ${saidGc}`);
  assert.ok(Math.abs(saidLoxo - loxo) < 60, `rhumb line ${loxo.toFixed(0)} km, stated ${saidLoxo}`);
  assert.match(correctOf(rhumb).text, /curved red/);
  assert.deepEqual(rhumb.figures[0].lines.map((l) => [l.curve, l.color]), [['rhumb', 'blue'], ['great-circle', 'red']]);
  // projections
  const recipes = one('maps-lie', 'recipes');
  assert.deepEqual(recipes.figures.map((f) => f.projection), ['gall-peters', 'equal-earth']);
  assert.deepEqual(Object.fromEntries(recipes.pairs), {
    Mercator: 'Directions true, sizes wrong', 'Gall–Peters': 'Sizes true, shapes pulled tall', 'Equal Earth': 'Sizes true, shapes gentler', 'A globe': 'All true, but half is hidden',
  });
  assert.match(correctOf(one('maps-lie', 'mercator-map')).text, /Sailors/);
  assert.equal(correctOf(one('maps-lie', 'which-way-up')).text, 'South');
  // nine centuries, in order
  const order = one('maps-lie', 'order');
  const years = order.items.map((label) => {
    if (/Astronauts photograph/.test(label)) return FACTS.years.blueMarble;
    const key = Object.keys(H.EVENTS).find((k2) => H.EVENTS[k2].label === label);
    assert.ok(key, `"${label}" is an event`);
    return FACTS.years[key];
  });
  assert.deepEqual(years, [1154, 1569, 1855, 1972, 2005, 2018]);
  for (let i = 1; i < years.length; i++) assert.ok(years[i] - years[i - 1] >= 10);
  for (const y of years) assert.ok(flat(order.explain).includes(String(y)), `the explanation gives ${y}`);
  const phone = one('maps-lie', 'phone');
  assert.deepEqual(phone.blanks.map((b) => b.answer), ['shapes and directions', 'poles', 'large']);
  const choose = one('maps-lie', 'choose');
  for (const it of choose.items) assert.equal(it.bucket, /size|how much|shrinking|desert/i.test(it.text) ? 1 : 0, it.text);
});

/* ============================================================================ lesson 3 */

test('lesson 3: read the coordinates of a marker', () => {
  const seen = new Set();
  for (const step of covers('latitude-longitude', 'read-coords')) {
    const at = step.figures[0].markers[0].at;
    const city = cityNear(at);
    seen.add(city);
    const want = degText(FACTS.cities[city]);
    assert.equal(correctOf(step).text, want, city);
    const [lat, lon] = FACTS.cities[city];
    assert.deepEqual(step.options.map((o) => o.text).sort(), [degText([lat, lon]), degText([-lat, lon]), degText([lat, -lon]), degText([-lat, -lon])].sort());
    assert.ok(step.figures[0].markers[0].label == null, 'the marker does not name the city');
    assert.ok(flat(step.explain).includes(city) && flat(step.explain).includes(want) && flat(step.explain).includes(countryName(FACTS.cities[city][2])));
    assert.match(flat(step.explain), new RegExp(`${lat > 0 ? 'north' : 'south'} of the Equator and ${lon > 0 ? 'east' : 'west'} of the prime meridian`));
    assert.equal(step.figures[0].graticule, 30);
  }
  assert.ok(seen.size >= 20);
});

test('lesson 3: move the pin to given coordinates', () => {
  for (const step of covers('latitude-longitude', 'place-coords')) {
    const m = grab(/Move the pin to (\d+)° ([NS]), (\d+)° ([EW])\*\*/, flat(step.text));
    const lat = Number(m[0]) * (m[1] === 'N' ? 1 : -1);
    const lon = Number(m[2]) * (m[3] === 'E' ? 1 : -1);
    const target = step.widget.targets[0].at;
    assert.ok(Math.abs(target[1] - lat) <= 0.5 && Math.abs(target[0] - lon) <= 0.5, `the target ${target} is the point named in the text (${lat}, ${lon})`);
    const city = cityNear(target);
    assert.equal(step.widget.targets[0].label, city);
    assert.ok(flat(step.explain).includes(`**${city}**`));
    assert.match(flat(step.text), /Within 1,000 km counts/);
    assert.equal(step.check(placeState(step.widget, step.solution.pin)), true);
    assert.ok(isMessage(step.check(placeState(step.widget, [0, 0], false))));
    const east = Math.abs(lon) > 150 ? lon < 0 : lon > 0;                          // away from the prime meridian, but not across the date line
    const away = lat > 0 ? (east ? 45 : 315) : (east ? 135 : 225);                // a bearing that keeps the pin in the same quarter
    assert.equal(step.check(placeState(step.widget, destination(target, 900, away))), true, '900 km off is accepted');
    const far = step.check(placeState(step.widget, destination(target, 1500, away)));
    assert.ok(isMessage(far) && /too far/.test(far), `1,500 km off: ${far}`);
    assert.match(step.check(placeState(step.widget, [target[0], -target[1]])), /of the Equator/);
    // the mirror image across the prime meridian is never accepted: the same numbers with E and W swapped are a wrong answer.
    // (Auckland, at 175° E, is only 900 km from 175° W across the date line, so this step does not use it.)
    const mirror = [-target[0], target[1]];
    assert.ok(distanceKm(mirror, target) > 2000, `${city}: E and W swapped lands far away`);
    assert.match(step.check(placeState(step.widget, mirror)), /of the prime meridian/);
    assert.notEqual(city, 'Auckland');
    assert.match(step.check(placeState(step.widget, [-target[0], -target[1]])), /of the Equator/);
  }
});

test('lesson 3: latitude from the Pole Star, longitude from a clock', () => {
  for (const step of covers('latitude-longitude', 'pole-star')) {
    const a = Number(grab(/measures the Pole Star \*\*(\d+)°\*\* above the horizon/, flat(step.text))[0]);
    assert.equal(step.answer, a);
    assert.equal(step.unit, '° N');
    assert.deepEqual(step.wrong.map((w) => w[0]), a === 45 ? [] : [90 - a]);
    const km = Number(grab(/about ([\d,]+) km north of the Equator/, flat(step.explain))[0].replace(/,/g, ''));
    assert.ok(Math.abs(km - a * 111) <= 50);
  }
  const both = new Set();
  for (const step of covers('latitude-longitude', 'noon')) {
    const reads = Number(grab(/the clock reads \*\*(\d\d):00\*\*/, flat(step.text))[0]);
    const hours = reads - 12;
    assert.ok(hours !== 0 && Math.abs(hours) <= 9);
    const [deg, side] = step.blanks;
    assert.deepEqual(deg.numbers, [Math.abs(hours) * 15]);
    assert.equal(side.answer, hours > 0 ? 'west' : 'east', `clock at ${reads}:00`);
    assert.deepEqual([...side.options].sort(), ['east', 'west']);
    assert.ok(flat(step.explain).includes(`**${Math.abs(hours) * 15}° ${hours > 0 ? 'W' : 'E'}**`));
    assert.match(flat(step.text), /15° every hour/);
    both.add(side.answer);
  }
  assert.equal(both.size, 2);
  const prize = one('latitude-longitude', 'prize');
  assert.equal(prize.answer, (0.5 / 15) * 60);
  for (const [slip] of prize.wrong) assert.notEqual(slip, prize.answer);
});

test('lesson 3: clock time in another city', () => {
  const seen = new Set();
  for (const step of covers('latitude-longitude', 'clock-time')) {
    const text = flat(step.text);
    const [city, k, way] = grab(/Clocks in \*\*(.+?)\*\* are \*\*(\d+) hours? (ahead of|behind)\*\* Greenwich/, text);
    const utc = Number(grab(/When it is \*\*(\d\d):00\*\* in Greenwich/, text)[0]);
    assert.ok(city in FACTS.clocks, city);
    assert.equal(Number(k) * (way === 'behind' ? -1 : 1), FACTS.clocks[city], `${city}`);
    const local = utc + FACTS.clocks[city];
    assert.ok(local >= 1 && local <= 23, 'the answer is on the same day');
    assert.equal(correctOf(step).text, `${String(local).padStart(2, '0')}:00`);
    assert.ok(step.options.length >= 3 && step.options.length <= 4);
    for (const o of step.options) assert.match(o.text, /^([01]\d|2[0-3]):00$/);
    assert.ok(flat(step.explain).includes(`**${String(local).padStart(2, '0')}:00**`));
    const marker = step.figures[0].markers.find((mk) => mk.label === city);
    assert.ok(marker && Math.abs(marker.at[0] - FACTS.cities[city][1]) <= 0.75);
    const band = step.figures[0].areas[0].lons;
    assert.ok(marker.at[0] >= band[0] && marker.at[0] <= band[1], `${city} lies inside the shaded band`);
    seen.add(city);
  }
  assert.equal(seen.size, Object.keys(FACTS.clocks).length);
});

test('lesson 3: fixed steps', () => {
  const zones = one('latitude-longitude', 'zones');
  for (const it of zones.items) {
    const lat = Number(grab(/: (\d+)° [NS]$/, it.text)[0]);
    assert.equal(it.bucket, lat < 23.4 ? 0 : lat < 66.6 ? 1 : 2, it.text);
  }
  const lines = one('latitude-longitude', 'special-lines');
  assert.ok(lines.text.includes('23.4°') && lines.text.includes('66.6°'));
  const china = one('latitude-longitude', 'one-zone');
  assert.equal(china.check({ picked: 'CN', name: 'China' }), true);
  for (const id of ['RU', 'IN', 'KZ', 'MN', 'JP', 'ID']) assert.ok(isMessage(china.check({ picked: id, name: countryName(id) })), id);
  assert.equal(china.check({ picked: null, name: null }), false);
  const [w, , e] = countryInfo('CN').box;
  assert.ok(Math.abs((e - w) - 60) < 4, 'China spans about 60° of longitude');
  assert.equal(Math.round((e - w) / 15), 4, 'which is four hours of Sun time: five zones from end to end');
  assert.match(correctOf(one('latitude-longitude', 'date-line')).text, /Tuesday/);
  assert.match(correctOf(one('latitude-longitude', 'hook')).text, /north or south I am, but not how far east or west/);
  assert.match(correctOf(one('latitude-longitude', 'harrison')).text, /H4/);
});

/* ============================================================================ lesson 4 */

/** Shared checks for "tap the right marker" steps: one marker is the answer, the others are refused by name, all stand apart. */
function checkMarkerPick(step, rightId, gapDeg) {
  const { markers } = step.widget;
  assert.equal(step.widget.mode, 'pickMarker');
  assert.equal(step.widget.markerLabels, 'after');
  assert.equal(new Set(markers.map((m) => m.id)).size, markers.length);
  assert.ok(markers.length >= 4 && markers.length <= 5, `${markers.length} markers`);
  assert.ok(markers.some((m) => m.id === rightId));
  assert.equal(step.solution.picked, rightId);
  assert.equal(step.widget.answer, rightId);
  assert.equal(step.check({ picked: rightId }), true);
  assert.equal(step.check({ picked: null }), false);
  for (const m of markers.filter((x) => x.id !== rightId)) {
    const res = step.check({ picked: m.id });
    assert.ok(isMessage(res) && res.includes(`Marker ${'ABCDE'[markers.indexOf(m)]}`), `wrong marker ${m.id}: ${res}`);
  }
  for (let i = 0; i < markers.length; i++) {
    for (let j = i + 1; j < markers.length; j++) {
      let dLon = Math.abs(markers[i].at[0] - markers[j].at[0]);
      if (dLon > 180) dLon = 360 - dLon;
      assert.ok(Math.hypot(dLon, markers[i].at[1] - markers[j].at[1]) >= gapDeg, `${markers[i].label} and ${markers[j].label} stand apart`);
    }
  }
}

test('lesson 4: find the mountain range', () => {
  const seen = new Set();
  for (const step of covers('land-and-water', 'find-range')) {
    const name = grab(/\*\*Tap the (.+?)\.\*\*/, flat(step.text))[0];
    assert.ok(name in FACTS.ranges, name);
    seen.add(name);
    const right = step.widget.markers.filter((m) => m.label === name);
    assert.equal(right.length, 1);
    checkMarkerPick(step, right[0].id, 24);
    for (const m of step.widget.markers) assert.ok(distanceKm(m.at, FACTS.ranges[m.label][1]) < 600, `${m.label} is where the marker stands`);
    const wrong = step.widget.markers.find((m) => m.label !== name);
    assert.ok(step.check({ picked: wrong.id }).includes(wrong.label) && step.check({ picked: wrong.id }).includes(FACTS.ranges[wrong.label][0]), 'the feedback names the range and its continent');
    assert.ok(step.explain.includes(name === 'Ural Mountains' ? 'Urals' : name.replace(' Mountains', '')), `${name}: ${step.explain}`);
    const urals = step.widget.markers.find((m) => m.label === 'Ural Mountains' && m.label !== name);
    if (urals) assert.match(step.check({ picked: urals.id }), /is the Ural Mountains, on the line between Europe and Asia\.$/);
  }
  assert.equal(seen.size, 7);
});

test('lesson 4: where rivers reach the sea, and on which continent', () => {
  const kinds = new Set();
  for (const step of covers('land-and-water', 'river-facts')) {
    const text = flat(step.text);
    const right = correctOf(step);
    let m;
    if ((m = /Where does the \*\*(.+?)\*\* reach the sea\?/.exec(text))) {
      kinds.add('sea');
      assert.equal(right.text, FACTS.rivers[m[1]][1], m[1]);
      // no other option names a water that the right sea is part of, or that is part of it
      const family = { 'Mediterranean Sea': ['Atlantic Ocean'], 'East China Sea': ['Pacific Ocean'], 'Gulf of Mexico': ['Atlantic Ocean', 'Caribbean Sea'], 'Bay of Bengal': ['Indian Ocean'], 'Black Sea': ['Mediterranean Sea', 'Atlantic Ocean'], 'Atlantic Ocean': [] }[right.text];
      for (const o of step.options.filter((x) => !x.correct)) assert.ok(!family.includes(o.text), `${m[1]}: "${o.text}" could also be argued`);
    } else {
      kinds.add('continent');
      const river = grab(/Through which continent does the \*\*(.+?)\*\* flow\?/, text)[0];
      assert.equal(right.text, FACTS.rivers[river][0], river);
    }
    assert.equal(step.options.length, 4);
    assert.ok(flat(step.explain).includes(right.text));
  }
  assert.equal(kinds.size, 2);
});

test('lesson 4: place the pin in a desert', () => {
  const seen = new Set();
  for (const step of covers('land-and-water', 'place-desert')) {
    const text = flat(step.text);
    const within = Number(grab(/Anywhere within (\d+) km of its heart counts/, text)[0]);
    const d = H.DESERTS.find((x) => step.widget.pin.label === x.name);
    assert.ok(d, 'the pin is labelled with the desert');
    assert.ok(text.includes(d.name.startsWith('Australian') ? 'the deserts of central Australia' : `the ${d.name}`));
    seen.add(d.name);
    assert.equal(within, d.within);
    assert.equal(step.widget.view, d.view);
    assert.equal(step.check(placeState(step.widget, step.solution.pin)), true);
    assert.ok(isMessage(step.check(placeState(step.widget, d.cores[0], false))));
    for (const core of d.cores) {
      assert.equal(step.check(placeState(step.widget, core)), true);
      assert.ok(FACTS.deserts[d.name].includes(countryAt(core, 'low', 0)));
    }
    // a pin 2.2 tolerances from the nearest core, in a few directions, is refused with a distance
    for (const bearing of [0, 90, 180, 270]) {
      const pin = destination(d.cores[0], d.within * 2.2 + 400, bearing);
      if (d.cores.some((c) => distanceKm(c, pin) <= d.within)) continue;
      const res = step.check(placeState(step.widget, pin));
      assert.ok(isMessage(res) && /km too far/.test(res), `${d.name}, pin at ${pin.map((v) => v.toFixed(1))}: ${res}`);
    }
    for (const city of ['London', 'Tokyo', 'Lagos', 'Lima']) assert.ok(isMessage(step.check(placeState(step.widget, place(city)))), `${d.name}: a pin in ${city}`);
    // every accepted pin stands in a country the desert really reaches (a scan of the neighbourhood, one degree apart)
    const reach = { Sahara: FACTS.deserts.Sahara, 'Arabian Desert': [...FACTS.deserts['Arabian Desert'], 'QA', 'KW', 'BH', 'JO', 'IQ'], 'Gobi Desert': ['MN', 'CN'], 'Kalahari Desert': ['BW', 'NA', 'ZA'],
      'Atacama Desert': ['CL', 'PE', 'BO', 'AR'], 'Australian deserts': ['AU'] }[d.name];
    const lons = d.cores.map((c) => c[0]);
    const lats = d.cores.map((c) => c[1]);
    for (let lon = Math.min(...lons) - 14; lon <= Math.max(...lons) + 14; lon++) {
      for (let lat = Math.min(...lats) - 10; lat <= Math.max(...lats) + 10; lat++) {
        const state = placeState(step.widget, [lon, lat]);
        const res = step.check(state);
        if (res === true) assert.ok(reach.includes(state.country), `${d.name}: a pin at ${lon}, ${lat} in ${countryName(state.country)} is accepted`);
        else assert.ok(isMessage(res), `${d.name}: a pin at ${lon}, ${lat} gets a message`);
      }
    }
    if (d.name === 'Sahara') assert.match(step.check(placeState(step.widget, [37, 26])), /Saudi Arabia/);
    if (d.name === 'Arabian Desert') assert.match(step.check(placeState(step.widget, [54, 27.5])), /Iran/);
  }
  assert.equal(seen.size, 6);
});

test('lesson 4: find the sea or lake', () => {
  const seen = new Set();
  for (const step of covers('land-and-water', 'find-water')) {
    const name = grab(/\*\*Tap (?:the )?(.+?)\.\*\*/, flat(step.text))[0];
    assert.ok(name in FACTS.waters, name);
    seen.add(name);
    const right = step.widget.markers.filter((m) => m.label === name);
    assert.equal(right.length, 1);
    checkMarkerPick(step, right[0].id, 28);
    for (const m of step.widget.markers) assert.ok(distanceKm(m.at, FACTS.waters[m.label]) < 250, `${m.label} is where the marker stands`);
    const wrong = step.widget.markers.find((m) => m.label !== name);
    assert.ok(step.check({ picked: wrong.id }).includes(wrong.label));
  }
  assert.equal(seen.size, 13);
});

test('lesson 4: fixed steps', () => {
  assert.equal(one('land-and-water', 'hook').answer, 95);
  assert.match(flat(one('land-and-water', 'fit').text), /fit together like two pieces of a puzzle/);          // now a teaching screen: the observation is stated, not asked
  const ranges = one('land-and-water', 'ranges');
  for (const [left, rightSide] of ranges.pairs) assert.equal(rightSide, FACTS.ranges[left][0], left);
  assert.equal(ranges.pairs.length, 5);
  const order = one('land-and-water', 'deep-time');
  order.items.forEach((label, i) => assert.match(label, FACTS.deepTime[i]));
  assert.match(flat(order.explain), /200 million.*66 million.*50 million.*300,000.*1953/);
  const cities = one('land-and-water', 'cities');
  assert.deepEqual(Object.fromEntries(cities.pairs), FACTS.cityRivers);
  assert.equal(correctOf(one('land-and-water', 'deserts')).text, 'Antarctica');
  assert.ok(FACTS.continents.find((c) => c[0] === 'Antarctica')[1] > 9.2, 'Antarctica is larger than the Sahara');
  assert.match(correctOf(one('land-and-water', 'everest')).text, /sea floor/);
  const rivers = one('land-and-water', 'rivers');
  assert.deepEqual(rivers.figures[0].rivers.slice().sort(), Object.keys(FACTS.rivers).sort());
});

/* ============================================================================ lesson 5 */

test('lesson 5: who has summer now', () => {
  const combos = new Set();
  for (const step of covers('climate', 'season-city')) {
    const [month, season] = grab(/It is \*\*(January|July)\*\*\. In which of these cities is it \*\*(summer|winter)\*\*\?/, flat(step.text));
    combos.add(`${month} ${season}`);
    const north = (month === 'July') === (season === 'summer');          // the hemisphere that has that season in that month
    for (const o of step.options) {
      const lat = FACTS.cities[o.text][0];
      assert.ok(Math.abs(lat) >= 26, `${o.text} has real seasons`);
      assert.equal(lat > 0 === north, !!o.correct, `${o.text} in ${month}: ${season}?`);
      if (!o.correct) assert.ok(o.why.includes(lat > 0 ? 'Northern' : 'Southern') && o.why.includes(`${month} is a ${season === 'summer' ? 'winter' : 'summer'} month`));
    }
    assert.equal(step.options.length, 4);
    assert.ok(flat(step.explain).includes(north ? 'Northern Hemisphere, which' : 'Southern Hemisphere, which'));
  }
  assert.equal(combos.size, 4);
});

test('lesson 5: colder with height', () => {
  for (const step of covers('climate', 'altitude')) {
    const text = flat(step.text);
    const rate = Number(grab(/about \*\*(\d+)°C for every 1,000 m\*\*/, text)[0]);
    const base = Number(grab(/average temperature of \*\*(\d+)°C\*\*/, text)[0]);
    const metres = Number(grab(/\*\*([\d,]+) m\*\* higher/, text)[0].replace(/,/g, ''));
    assert.equal(rate, 6);
    assert.equal(step.answer, base - (rate * metres) / 1000);
    assert.ok(step.answer > 0 && Number.isInteger(step.answer));
    assert.equal(step.unit, '°C');
    for (const [slip] of step.wrong) assert.notEqual(slip, step.answer);
    assert.ok(flat(step.explain).includes(`**${step.answer}°C**`));
  }
});

test('lesson 5: find the biome on the map', () => {
  const seen = new Set();
  for (const step of covers('climate', 'find-biome')) {
    const where = grab(/Tap the marker that stands (.+?)\.\*\*/, flat(step.text))[0];
    const biomeId = { 'in tropical rainforest': 'rainforest', 'in savanna': 'savanna', 'in a desert': 'desert', 'in Mediterranean scrub': 'mediterranean', 'in temperate forest': 'temperate forest', 'on the steppe': 'steppe', 'in the taiga': 'taiga', 'on the tundra': 'tundra', 'on an ice cap': 'ice' }[where];
    assert.ok(biomeId, where);
    seen.add(biomeId);
    const placeOf = (m) => m.label.split(': ')[0];
    const right = step.widget.markers.filter((m) => FACTS.biomes[placeOf(m)] === biomeId);
    assert.equal(right.length, 1, `exactly one marker stands ${where}`);
    checkMarkerPick(step, right[0].id, 26);
    assert.equal(new Set(step.widget.markers.map((m) => FACTS.biomes[placeOf(m)])).size, step.widget.markers.length, 'every marker is in a different biome');
    for (const m of step.widget.markers) {
      const spot = H.BIOMES.flatMap((b) => b.spots).find((sp) => sp.place === placeOf(m));
      assert.deepEqual(m.at, spot.at);
      assert.ok(m.label.toLowerCase().endsWith(FACTS.biomes[placeOf(m)] === 'ice' ? 'ice' : FACTS.biomes[placeOf(m)].split(' ')[0] === 'temperate' ? 'temperate forest' : FACTS.biomes[placeOf(m)]), m.label);
    }
    assert.ok(step.explain.startsWith(placeOf(right[0])));
    assert.ok(!/\b(four|five|six) (lettered )?markers\b/i.test(`${flat(step.text)} ${step.widget.alt}`), 'the text does not promise a number of markers (there may be four or five)');
  }
  assert.equal(seen.size, 9);
});

test('lesson 5: fixed steps', () => {
  const hook = one('climate', 'hook');
  assert.match(correctOf(hook).text, /Much colder: about −6°C/);
  assert.match(correctOf(one('climate', 'seasons')).text, /tilted towards the Sun/);
  const beams = one('climate', 'sun-angle');
  assert.deepEqual(beams.blanks.map((b) => b.answer), ['high', 'concentrated on a small patch', 'less']);
  // the two footprints in the drawing: the slanted one really is longer
  const lines = [...beams.figures[0].content.matchAll(/<line class="stroke-red"[^>]* x1="(\d+)" y1="(\d+)" x2="(\d+)" y2="(\d+)"/g)].map((m) => Math.hypot(m[3] - m[1], m[4] - m[2]));
  assert.equal(lines.length, 2);
  assert.ok(lines[0] > lines[1] * 1.5, 'the beam near the pole is spread over a longer patch');
  // sea and inland: each statement judged from the two cities' own numbers
  const sea = one('climate', 'sea');
  const E = { jan: 4, jul: 15 };
  const M = { jan: -6, jul: 20 };
  const truth = (text) => {
    if (/Moscow has the colder winter/.test(text)) return M.jan < E.jan;
    if (/Moscow has the warmer summer/.test(text)) return M.jul > E.jul;
    if (/gap between winter and summer is bigger in Moscow/.test(text)) return M.jul - M.jan > E.jul - E.jan;
    if (/Edinburgh is warmer all year round/.test(text)) return E.jan > M.jan && E.jul > M.jul;
    throw new Error(`unexpected statement: ${text}`);
  };
  for (const o of sea.options) assert.equal(!!o.correct, truth(o.text), o.text);
  assert.deepEqual(sea.figures[0].series.map((sr) => sr.values), [[4, 15], [-6, 20]]);
  assert.ok(flat(sea.explain).includes('swings 11°C') && flat(sea.explain).includes('swings 26°C'));
  // currents: exactly the two coasts beside cold currents
  const cur = one('climate', 'currents');
  const st = (ids) => ({ picked: ids.slice().sort(), count: ids.length });
  assert.equal(cur.check(st(['atacama', 'namib'])), true);
  assert.equal(cur.check(st(cur.solution.picked)), true);
  for (const pair of [['atacama', 'norway'], ['namib', 'amazon'], ['florida', 'atacama'], ['norway', 'amazon']]) assert.ok(isMessage(cur.check(st(pair))), pair.join());
  assert.ok(isMessage(cur.check(st(['atacama']))) && isMessage(cur.check(st([]))));
  assert.deepEqual(cur.widget.answer.slice().sort(), ['atacama', 'namib']);
  // the monsoon year and the walk to the Arctic
  const monsoon = one('climate', 'monsoon');
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const first = (label) => MONTHS.map((mth, i) => [label.indexOf(mth), i]).filter(([at]) => at >= 0).sort((p, q) => p[0] - q[0])[0][1];      // the month named first
  const months = monsoon.items.map(first);
  assert.deepEqual(months, [3, 5, 6, 9, 11], 'April, June, July, October, December');
  const walk = one('climate', 'transect');
  assert.deepEqual(walk.items.map((t) => t.split(':')[0]), FACTS.biomeOrder);
  assert.match(correctOf(one('climate', 'rain-shadow')).text, /south/);
  assert.match(correctOf(one('climate', 'windcatchers')).text, /Hot and very dry/);
  const belts = one('climate', 'belts');
  const dry = belts.figures[0].areas.filter((a) => a.band && a.color === 'orange').map((a) => a.band);
  const inDry = (lat) => dry.some(([lo, hi]) => lat >= lo && lat <= hi);
  for (const d of H.DESERTS) assert.equal(d.cores.every((c) => inDry(c[1])), d.id !== 'gobi', `${d.name}: ${d.id === 'gobi' ? 'outside' : 'inside'} the dry belts`);
});

/* ============================================================================ lesson 6 */

test('lesson 6: crowded or empty', () => {
  const kinds = new Set();
  for (const step of covers('where-people-live', 'crowded-or-empty')) {
    const wantDense = /Tap the one that stands in one of the most crowded/.test(flat(step.text));
    if (!wantDense) assert.match(flat(step.text), /Tap the one that stands in one of the emptiest/);
    kinds.add(wantDense);
    const isDense = (m) => { assert.ok(FACTS.crowded.includes(m.label) || FACTS.empty.includes(m.label), m.label); return FACTS.crowded.includes(m.label); };
    const right = step.widget.markers.filter((m) => isDense(m) === wantDense);
    assert.equal(right.length, 1, 'exactly one marker of the kind asked for');
    checkMarkerPick(step, right[0].id, 24);
    assert.equal(step.widget.markers.length, 5, 'the text says "four of these markers", so there are four others');
    const wrong = step.widget.markers.find((m) => m !== right[0]);
    assert.match(step.check({ picked: wrong.id }), wantDense ? /almost empty/ : /most crowded/);
  }
  assert.equal(kinds.size, 2);
});

test('lesson 6: most and least densely populated', () => {
  const density = (code) => (FACTS.people[code][0] * 1e6) / (FACTS.people[code][1] * 1e3);
  const kinds = new Set();
  for (const step of covers('where-people-live', 'dense-sparse')) {
    const most = /most densely populated/.test(flat(step.text));
    if (!most) assert.match(flat(step.text), /most thinly populated/);
    kinds.add(most);
    const values = step.options.map((o) => density(codeByName(o.text)));
    const best = most ? Math.max(...values) : Math.min(...values);
    const right = correctOf(step);
    assert.equal(density(codeByName(right.text)), best, `${step.options.map((o) => o.text)}`);
    for (const v of values.filter((x) => x !== best)) assert.ok(most ? best / v >= 4 : v / best >= 4, 'the answer is not a close call');
    assert.equal(step.options.length, 4);
    for (const o of step.options) {
      const said = Number(grab(new RegExp(`${o.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} (?:has )?about ([\\d,]+)`), flat(step.explain))[0].replace(/,/g, ''));
      const real = density(codeByName(o.text));
      assert.ok(Math.abs(said - real) / real < 0.15 || Math.abs(said - real) < 1.5, `${o.text}: said ${said}, worked out ${real.toFixed(1)}`);
    }
  }
  assert.equal(kinds.size, 2);
});

test('lesson 6: find the megacity', () => {
  const seen = new Set();
  for (const step of covers('where-people-live', 'megacities')) {
    const name = grab(/\*\*Tap (.+?)\.\*\*/, flat(step.text))[0];
    assert.ok(name in FACTS.megacityCountry, name);
    seen.add(name);
    checkMarkerPick(step, name, 26);
    for (const m of step.widget.markers) {
      const [lat, lon] = FACTS.cities[m.label];
      assert.ok(Math.abs(m.at[1] - lat) <= 0.75 && Math.abs(m.at[0] - lon) <= 0.75, `${m.label} is at about ${lat}, ${lon}`);
    }
    const wrong = step.widget.markers.find((m) => m.id !== name);
    assert.ok(step.check({ picked: wrong.id }).includes(`${wrong.label}, in`) && step.check({ picked: wrong.id }).includes(countryName(FACTS.megacityCountry[wrong.label])));
    assert.ok(step.explain.includes(countryName(FACTS.megacityCountry[name])));
    assert.match(step.explain, FACTS.megacitySite[name], `${name}: where it stands`);
  }
  assert.equal(seen.size, 17);
});

test('lesson 6: fixed steps', () => {
  const hook = one('where-people-live', 'hook');
  assert.ok(hook.answer > 50, 'more than half');
  const circle = hook.figures[0].areas[0];
  assert.equal(circle.km, 4000);
  // the countries named in the explanation have their biggest city inside the circle
  for (const city of ['Shanghai', 'Delhi', 'Jakarta', 'Karachi', 'Dhaka', 'Tokyo']) assert.ok(distanceKm(circle.circle, place(city)) < 4000, `${city} is inside the circle`);
  const capArea = 2 * Math.PI * 6371 ** 2 * (1 - Math.cos(4000 / 6371));
  assert.ok(Math.abs(capArea / 510e6 - 0.1) < 0.01, 'the circle covers about a tenth of the globe');
  assert.ok(Math.abs(Math.sqrt((149e6 / 8e9) * 1e6) - 135) < 3, 'an even share of the land is a square about 135 m across');
  // the night picture: only the Nile is accepted; the other rings and a miss are sent back
  const night = one('where-people-live', 'night');
  assert.equal(night.widget.type, 'photo');
  assert.equal(night.widget.mode, 'point');
  const spots = night.widget.hotspots;
  const at = (point) => { const hit = spots.find((sp) => Math.hypot(point.x - sp.x, (point.y - sp.y) * (night.widget.height / night.widget.width)) <= sp.r); return { picked: hit ? hit.id : null, point, label: hit ? hit.label : null }; };
  assert.equal(night.check(at(night.solution.point)), true);
  assert.equal(at(night.solution.point).picked, 'nile');
  for (const sp of spots.filter((x) => x.id !== 'nile')) assert.ok(isMessage(night.check({ picked: sp.id, point: { x: sp.x, y: sp.y }, label: sp.label })), sp.id);
  assert.ok(isMessage(night.check(at({ x: 0.1, y: 0.8 }))) && isMessage(night.check({ picked: null, point: null, label: null })));
  // The picture is a plain longitude and latitude grid of the Earth, cut to the box recorded in the manifest.
  // The Nile's ring is where the Nile is: Cairo, Asyut and Aswan fall inside it, and no other ring holds them.
  const rec = Object.values(manifest.images).find((im) => im.src === night.widget.src);
  const [cl, ct, cr, cb] = rec.options.crop || [0, 0, 1, 1];
  const shape = night.widget.height / night.widget.width;
  const frac = ([lon, lat]) => ({ x: ((lon + 180) / 360 - cl) / (cr - cl), y: ((90 - lat) / 180 - ct) / (cb - ct) });
  const inside = (sp, point) => Math.hypot(point.x - sp.x, (point.y - sp.y) * shape) <= sp.r;
  assert.ok(Math.abs(shape - (cb - ct) / (2 * (cr - cl))) < 0.01, 'the picture has the shape of its box on a 2 : 1 grid');
  const nile = spots.find((sp) => sp.id === 'nile');
  for (const town of [[31.2, 30], [32.9, 24.1], [31.2, 27.2]]) {
    assert.ok(inside(nile, frac(town)), `the Nile at ${town} is inside its ring`);
    for (const sp of spots.filter((x) => x !== nile)) assert.ok(!inside(sp, frac(town)), `${sp.id} does not hold the Nile`);
  }
  const home = { europe: place('Berlin'), india: place('Delhi'), china: place('Shanghai') };
  for (const sp of spots.filter((x) => x !== nile)) {
    assert.ok(home[sp.id], `the test knows where ${sp.id} is`);
    assert.ok(inside(sp, frac(home[sp.id])), `${sp.id}: its ring holds ${home[sp.id]}`);
    assert.ok(sp.x - sp.r > 0 && sp.x + sp.r < 1 && sp.y > 0 && sp.y < 1, `${sp.id}: the ring is on the picture`);
  }
  for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) assert.ok(Math.hypot(spots[i].x - spots[j].x, (spots[i].y - spots[j].y) * shape) > spots[i].r + spots[j].r, `${spots[i].id} and ${spots[j].id} do not overlap`);
  // shares by region: each statement judged from the test's own numbers
  const share = { Asia: 59, Africa: 18, Europe: 9, Latin: 8, Northern: 5, Oceania: 0.6 };
  const cont = one('where-people-live', 'continents');
  const truth = (text) => {
    if (/More people live in Asia than in the whole of the rest/.test(text)) return share.Asia > 50;
    if (/Africa has about twice as many people as Europe/.test(text)) return Math.abs(share.Africa / share.Europe - 2) < 0.2;
    if (/Fewer than one person in a hundred lives in Oceania/.test(text)) return share.Oceania < 1;
    if (/Northern America has more people than Africa/.test(text)) return share.Northern > share.Africa;
    throw new Error(`unexpected statement: ${text}`);
  };
  for (const o of cont.options) assert.equal(!!o.correct, truth(o.text), o.text);
  assert.deepEqual(cont.figures[0].data.map((d) => d.value), Object.values(share));
  const why = one('where-people-live', 'empty-why');
  const reason = { Sahara: 0, 'Central Australia': 0, Arabia: 0, Siberia: 1, 'Northern Canada': 1, Antarctica: 1, Tibetan: 2, Himalaya: 2 };          // not the Andes: tens of millions live in the Andean highlands
  for (const it of why.items) { const key = Object.keys(reason).find((k2) => it.text.includes(k2)); assert.ok(key, it.text); assert.equal(it.bucket, reason[key], it.text); }
  assert.match(correctOf(one('where-people-live', 'cities')).text, /towns and cities/);
  assert.match(correctOf(one('where-people-live', 'korea')).text, /far less electricity/);
  const info = one('where-people-live', 'density');
  assert.ok(Math.abs(17098 / 148 - 115) < 2 && /more than a hundred times/.test(flat(info.text)));
  assert.equal(one('where-people-live', 'why-asia').options.filter((o) => o.correct).length, 3);
});

/* ============================================================================ lesson 7 */

test('lesson 7: tap a landlocked country', () => {
  const seen = new Set();
  for (const step of covers('countries-borders', 'landlocked')) {
    const region = grab(/Tap any landlocked country in (.+?)\.\*\*/, flat(step.text))[0];
    seen.add(region);
    const id = { Africa: 'africa', 'South America': 'south-america', Europe: 'europe' }[region];
    assert.ok(id);
    const members = countryIds(id);
    assert.equal(step.check({ picked: step.solution.picked, name: countryName(step.solution.picked) }), true);
    assert.ok(FACTS.landlocked.includes(step.solution.picked) && members.includes(step.solution.picked));
    for (const code of members) {
      const res = step.check({ picked: code, name: countryName(code) });
      assert.equal(res === true, FACTS.landlocked.includes(code), `${countryName(code)} (${region})`);
      if (res !== true) assert.ok(isMessage(res) && res.includes(countryName(code)) && /sea coast/.test(res));
    }
    assert.equal(step.check({ picked: null, name: null }), false);
    // no landlocked country anywhere is told that it has a coast, whatever the map shows at its edges
    for (const code of FACTS.landlocked) assert.equal(step.check({ picked: code, name: countryName(code) }), true, `${countryName(code)} is landlocked`);
    assert.equal(step.check({ picked: 'NL', name: 'Netherlands' }), 'The Netherlands has a sea coast. Look for a country that touches no sea at all.');
    for (const code of step.widget.answer) assert.ok(FACTS.landlocked.includes(code) && members.includes(code));
    assert.deepEqual(step.widget.answer.slice().sort(), members.filter((c) => FACTS.landlocked.includes(c)).sort(), `every landlocked country of ${region} is revealed`);
    if (region === 'Africa') for (const code of step.widget.answer) assert.ok(step.explain.includes(countryName(code)));
  }
  assert.equal(seen.size, 3);
});

test('lesson 7: landlocked, island or mainland with a coast', () => {
  for (const step of covers('countries-borders', 'shapes')) {
    assert.deepEqual(step.buckets, ['Landlocked', 'All islands', 'Mainland with a coast']);
    assert.equal(step.items.length, 8);
    for (const it of step.items) {
      const code = codeByName(it.text);
      const want = FACTS.landlocked.includes(code) ? 0 : FACTS.islands.includes(code) ? 1 : 2;
      assert.equal(it.bucket, want, it.text);
    }
    assert.deepEqual([0, 1, 2].map((b) => step.items.filter((it) => it.bucket === b).length), [3, 3, 2]);
  }
});

test('lesson 7: which two countries does it divide', () => {
  const seen = new Set();
  for (const step of covers('countries-borders', 'natural-borders')) {
    const feature = grab(/^The \*\*(.+?)\*\* (?:is a river|are mountains|are lakes) that forms? a border/, flat(step.text))[0];
    assert.ok(feature in FACTS.borders, feature);
    seen.add(feature);
    const pairOf = (text) => text.replace(/^The /, 'the ').split(' and ').map((n) => codeByName(n.replace(/^the /, ''))).sort().join();
    const right = correctOf(step);
    assert.equal(pairOf(right.text), FACTS.borders[feature].slice().sort().join(), feature);
    const all = Object.values(FACTS.borders).map((p) => p.slice().sort().join());
    for (const o of step.options) assert.ok(all.includes(pairOf(o.text)), `${o.text} is a real pair of neighbours from the table`);
    assert.equal(new Set(step.options.map((o) => pairOf(o.text))).size, 4);
    assert.match(right.text, /^[A-Z]/);
  }
  assert.equal(seen.size, 10);
});

test('lesson 7: border stories', () => {
  const seen = new Set();
  for (const step of covers('countries-borders', 'border-stories')) {
    const hits = FACTS.stories.filter(([re]) => re.test(step.text));
    assert.equal(hits.length, 1, flat(step.text));
    const answer = hits[0][1];
    seen.add(answer);
    assert.equal(step.solution.picked, answer);
    assert.equal(step.widget.answer, answer);
    assert.equal(step.check({ picked: answer, name: countryName(answer) }), true);
    assert.equal(step.check({ picked: null, name: null }), false);
    // every country on that map except the answer is refused with a message
    const [w, s, e, n] = VIEWS[step.widget.view];
    const onMap = countryIds('world').filter((id) => { const [lon, lat] = countryInfo(id).center; return lon > w && lon < e && lat > s && lat < n; });
    assert.ok(onMap.includes(answer) && onMap.length >= 5);
    for (const id of onMap.filter((x) => x !== answer)) assert.ok(isMessage(step.check({ picked: id, name: countryName(id) })), `${id} for ${answer}`);
    assert.ok(step.explain.includes(countryName(answer)), `the explanation names ${countryName(answer)}`);
  }
  assert.equal(seen.size, 11);
});

test('lesson 7: capital or largest city', () => {
  const seen = new Set();
  for (const step of covers('countries-borders', 'capitals')) {
    const country = grab(/\*\*Tap the capital of (?:the )?(.+?)\.\*\*/, flat(step.text))[0];
    const fact = FACTS.capitals[country];
    assert.ok(fact, country);
    seen.add(country);
    const { markers } = step.widget;
    const capital = markers.find((m) => m.id === 'capital');
    const largest = markers.find((m) => m.id === 'largest');
    assert.equal(capital.label, fact[0]);
    assert.equal(largest.label, fact[1]);
    assert.ok(distanceKm(capital.at, fact[2]) < 60, `${fact[0]} is at about ${fact[2]}`);
    assert.equal(step.check({ picked: 'capital' }), true);
    assert.match(step.check({ picked: 'largest' }), new RegExp(`${fact[1]} is the largest city`));
    if (markers.length === 3) assert.ok(isMessage(step.check({ picked: 'other' })));
    assert.equal(step.check({ picked: null }), false);
    assert.equal(step.solution.picked, 'capital');
    assert.ok(flat(step.explain).includes(`**${fact[0]}**`) && flat(step.explain).includes(fact[1]));
    // the map is zoomed to the cities: all of them are in view, and no two are closer than a tenth of its width or so
    const { center, span } = step.widget.view;
    assert.ok(span >= 8 && span <= 30, `${country}: a window of ${span}°`);
    for (const m of markers) {
      assert.ok(distanceKm(center, m.at) / 111.2 < span * 0.42, `${m.label} is inside the window`);
      assert.equal(countryAt(m.at, 'low', 60), codeByName(country), `${m.label} is in ${country}`);
    }
    for (let i = 0; i < markers.length; i++) for (let j = i + 1; j < markers.length; j++) assert.ok(distanceKm(markers[i].at, markers[j].at) / 111.2 >= span * 0.09, `${markers[i].label} and ${markers[j].label} can be told apart`);
    assert.deepEqual(step.widget.regions[0].ids, [codeByName(country)]);
  }
  assert.equal(seen.size, 14);
});

test('lesson 7: fixed steps', () => {
  const hook = one('countries-borders', 'hook');
  assert.ok(Math.abs(hook.answer - 193) <= 2 && hook.explain.includes('193'));
  const state = one('countries-borders', 'what-is-a-state');
  assert.deepEqual(state.options.filter((o) => o.correct).map((o) => o.text), ['A permanent population', 'A defined territory', 'A government', 'The ability to deal with other states']);
  const sizes = one('countries-borders', 'sizes');
  assert.deepEqual(sizes.items, ['Russia', 'Canada', 'China', 'Brazil', 'Australia', 'India']);
  const areas = sizes.items.map((nm) => FACTS.areas[nm]);
  for (let i = 1; i < areas.length; i++) assert.ok(areas[i - 1] > areas[i] * 1.03, `${sizes.items[i - 1]} is larger than ${sizes.items[i]}`);
  assert.ok(Math.abs(FACTS.areas.Russia / 149 - 1 / 9) < 0.01, 'Russia has about a ninth of the land');
  assert.match(correctOf(one('countries-borders', 'ruler')).text, /line of latitude/);
  assert.equal(one('countries-borders', 'ruler').figures[0].parallels[0].lat, 49);
  assert.match(correctOf(one('countries-borders', 'africa')).text, /European governments/);
  assert.match(correctOf(one('countries-borders', 'baarle')).text, /cross it freely/);
  assert.match(correctOf(one('countries-borders', 'berlin')).text, /Anyone from Africa/);
  assert.match(one('countries-borders', 'berlin').text, /1884 to 1885/);
  const changes = one('countries-borders', 'changes');
  changes.items.forEach((label, i) => assert.match(label, FACTS.mapChanges[i][1]));
  for (const [year] of FACTS.mapChanges) assert.ok(flat(changes.explain).includes(String(year)));
  // one becomes fifteen
  const ussr = one('countries-borders', 'ussr');
  const st = (ids) => ({ picked: ids.slice().sort(), count: ids.length });
  assert.equal(ussr.check(st(ussr.solution.picked)), true);
  assert.equal(ussr.check(st(['EE', 'GE', 'TJ'])), true);
  assert.ok(isMessage(ussr.check(st(['RU', 'UA']))) && isMessage(ussr.check(st([]))));
  for (const id of ['PL', 'FI', 'MN', 'CN', 'RO', 'TR', 'IR', 'AF', 'SE']) assert.ok(isMessage(ussr.check(st(['RU', 'UA', id]))), id);
  for (const id of FACTS.ussr) assert.ok(flat(ussr.explain).includes(countryName(id)));
  assert.deepEqual(ussr.widget.answer.slice().sort(), FACTS.ussr.slice().sort());
  assert.equal(ussr.widget.max, 3);
  const [w, s, e, n] = ussr.widget.view;
  for (const id of FACTS.ussr.filter((x) => x !== 'RU')) { const [lon, lat] = countryInfo(id).center; assert.ok(lon > w && lon < e && lat > s && lat < n, `${id} is on the map`); }
});

/* ============================================================================ teach before you ask */

/** Teaching screens added when the course was revised so that every lesson teaches before it asks. */
const NEW_TEACHING = {
  'continents-oceans': [],          // "how-many" became a teaching screen; nothing new was needed
  'maps-lie': ['teach-mercator', 'teach-equal-area', 'teach-big-countries'],
  'latitude-longitude': ['example-coords', 'teach-longitude-time', 'teach-zones'],
  'land-and-water': ['teach-ranges'],
  climate: ['teach-climate', 'teach-seasons', 'teach-biome-world'],
  'where-people-live': ['teach-night', 'teach-empty', 'teach-megacities', 'teach-megacities-world'],
  'countries-borders': ['teach-coasts', 'teach-borders', 'teach-scramble', 'teach-capitals', 'teach-changes'],
};
const at = (lesson, id) => { const i = lessons[lesson].steps.findIndex((s) => s.id === id); assert.ok(i >= 0, `step ${lesson}/${id} exists`); return i; };
/** `first` comes before every one of `later` in the lesson. */
const before = (lesson, first, ...later) => { for (const id of later) assert.ok(at(lesson, first) < at(lesson, id), `${lesson}: ${first} comes before ${id}`); };
const textOf = (lesson, id) => flat(one(lesson, id).text);
const says = (lesson, id, ...terms) => { const text = textOf(lesson, id); for (const t of terms) assert.ok(t instanceof RegExp ? t.test(text) : text.includes(t), `${lesson}/${id} says "${t}"`); };
const markerLabels = (fig) => (fig.markers || []).map((m) => m.label);
const sameSet = (a, b, msg) => assert.deepEqual([...a].sort(), [...b].sort(), msg);

test('teach before you ask: the shape of every lesson', () => {
  assert.deepEqual(Object.keys(NEW_TEACHING), LESSON_IDS);
  for (const [id, lesson] of Object.entries(lessons)) {
    const steps = lesson.steps.map((step) => resolveStep(step, makeRng(1), step.id));
    const teaches = (s) => s.type === 'info' || (s.type === 'interact' && !s.graded && s.mode !== 'predict');
    const firstTeach = steps.findIndex(teaches);
    const firstGraded = steps.findIndex((s) => s.graded);
    assert.ok(firstTeach >= 0 && firstTeach < firstGraded, `${id}: a teaching screen or an exploration comes before the first graded step (${steps[firstGraded].id})`);
    assert.ok(steps.filter((s) => s.type === 'info').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(steps.filter((s) => s.mode === 'predict').length <= 2, `${id}: no more than two predictions`);
    for (let i = 2; i < steps.length; i++) assert.ok(!(steps[i].type === 'info' && steps[i - 1].type === 'info' && steps[i - 2].type === 'info'), `${id}: never three teaching screens in a row (${steps[i].id})`);
    for (const added of NEW_TEACHING[id]) assert.equal(steps[at(id, added)].type, 'info', `${id}/${added} is a teaching screen`);
    for (const s of steps.filter((x) => x.review)) assert.ok(s.graded && s.mode !== 'predict', `${id}/${s.id}: a review step is graded`);
  }
});

test('teach before you ask, lesson 1: continents, sizes and oceans are shown before they are asked for', () => {
  const L = 'continents-oceans';
  assert.equal(one(L, 'how-many').type, 'info');
  before(L, 'seven', 'place-continent', 'old-map', 'which-continent');
  const seven = one(L, 'seven');
  for (const c of H.CONTINENTS) assert.ok(seven.figures[0].regions.some((g) => g.label === c.name), `the map of "seven" names ${c.name}`);
  assert.equal(seven.figures[0].continents, true);
  before(L, 'chart', 'sizes');                                      // the areas are on the chart before the order is asked for
  before(L, 'oceans', 'pacific', 'find-ocean');
  for (const o of H.OCEANS) says(L, 'oceans', o.name.replace(' Ocean', ''), `${o.share}%`);
  assert.equal(one(L, 'oceans').figures[0].oceans, true);
  const pacific = one(L, 'pacific');
  assert.ok(pacific.graded && pacific.mode !== 'predict');
  says(L, 'pacific', '71%', '29%', '46%');
  assert.ok(0.46 * 71 > 29, 'the shares in the prompt settle the question');
  before(L, 'old-map', 'when');
  says(L, 'when', 'fifteen years after Columbus', /more than three centuries longer/);
  assert.ok(FACTS.years.antarctica - FACTS.years.america > 300);
  // the country question carries its own map: every country it names is marked and named on it
  for (const step of variants(L, 'which-continent')) {
    const fig = step.figures[0];
    assert.equal(fig.type, 'world-map');
    const asked = /On which continent is \*\*(.+?)\*\*\?/.exec(flat(step.text));
    const want = asked ? [bare(asked[1])] : step.options.map((o) => o.text);
    sameSet(markerLabels(fig), want, 'the marked countries are the ones the question names');
    sameSet(fig.regions[0].ids, want.map(codeByName));
    assert.ok(!fig.continents, 'the map does not print the names of the continents');
  }
});

test('teach before you ask, lesson 2: projections, true sizes and the big countries', () => {
  const L = 'maps-lie';
  assert.equal(one(L, 'globe').graded, false, 'finding Greenland on the globe is an exploration');
  before(L, 'globe', 'why');
  before(L, 'mercator-map', 'teach-mercator');
  before(L, 'teach-mercator', 'rhumb', 'phone', 'choose');
  says(L, 'teach-mercator', /straight line/, /angles and shapes/, /size/);
  before(L, 'recipes', 'teach-equal-area');
  before(L, 'teach-equal-area', 'true-size', 'order', 'choose');
  says(L, 'teach-equal-area', 'equal-area', String(FACTS.years.gall), String(FACTS.years.equalEarth), 'Gall–Peters', 'Equal Earth');
  assert.deepEqual(one(L, 'teach-equal-area').figures[0].events.map((e) => e.year), [FACTS.years.mercator, FACTS.years.gall, FACTS.years.equalEarth]);
  // every date of the order step has been given before it
  before(L, 'which-way-up', 'order');
  before(L, 'phone', 'order');
  says(L, 'which-way-up', String(FACTS.years.idrisi));
  says(L, 'mercator-map', String(FACTS.years.mercator));
  says(L, 'phone', String(FACTS.years.webMercator));
  says(L, 'order', String(FACTS.years.blueMarble));
  // the size question shows the same pair on an equal-area map
  for (const step of variants(L, 'true-size', 60)) {
    assert.equal(step.figures.length, 2);
    assert.equal(step.figures[1].projection, 'equal-earth');
    assert.deepEqual(step.figures[1].regions.map((g) => g.ids), step.figures[0].regions.map((g) => g.ids));
    assert.match(flat(step.text), /Equal Earth, an equal-area map/);
  }
  // every country the Pacific-centred map can ask for is named on the map before it, and in the table beside it
  before(L, 'teach-big-countries', 'recentred');
  const big = one(L, 'teach-big-countries');
  sameSet(big.figures[0].labels, H.BIG_COUNTRIES);
  sameSet(big.figures[0].regions[0].ids, H.BIG_COUNTRIES);
  for (const code of H.BIG_COUNTRIES) says(L, 'teach-big-countries', countryName(code));
  for (const step of variants(L, 'recentred', 60)) assert.ok(H.BIG_COUNTRIES.includes(step.solution.picked));
});

test('teach before you ask, lesson 3: worked examples come before the first problem of each kind', () => {
  const L = 'latitude-longitude';
  before(L, 'grid', 'example-coords');
  before(L, 'example-coords', 'read-coords', 'place-coords');
  const ex = one(L, 'example-coords');
  says(L, 'example-coords', /below\*\* the Equator/, /left\*\* of the prime meridian/, '24° S, 47° W', 'São Paulo');
  const exAt = ex.figures[0].markers[0].at;
  assert.equal(cityNear(exAt), 'São Paulo');
  assert.ok(!H.CITIES.some((c) => distanceKm(c.at, exAt) < 300), 'the worked example is not a city a generated question can ask for');
  assert.equal(ex.figures[0].graticule, 30);
  before(L, 'special-lines', 'zones');
  before(L, 'teach-longitude-time', 'noon', 'prize');
  says(L, 'teach-longitude-time', '15° every hour', '22:00', /10 hours × 15° = 150°/, '150° W', '150° E');
  for (const step of variants(L, 'noon', 80)) assert.ok(!/\*\*(22|02):00\*\*/.test(flat(step.text)), 'the worked example uses a clock reading that no generated question uses');
  before(L, 'harrison', 'when');
  assert.ok(flat(one(L, 'harrison').explain).includes(String(FACTS.years.harrisonH4)), 'the date of the watch is given before the timeline asks for it');
  before(L, 'teach-zones', 'clock-time', 'one-zone', 'date-line');
  says(L, 'teach-zones', 'time zones', /\*\*ahead\*\*/, /\*\*behind\*\*/, 'China', 'Beijing', '09:00', '11:00', '07:00');
  const zones = one(L, 'teach-zones').figures[0];
  assert.ok(zones.labels.includes('CN') && zones.regions[0].ids.includes('CN'), 'China is shown, named, before the map asks for it');
  assert.equal(zones.meridians.length, 5);
  says(L, 'date-line', /Asian side, clocks are twelve hours \*\*ahead\*\*/, /American side, twelve hours \*\*behind\*\*/);
});

test('teach before you ask, lesson 4: every range, river, desert and sea is on a labelled map first', () => {
  const L = 'land-and-water';
  assert.equal(one(L, 'fit').type, 'info');
  says(L, 'fit', 'Pangaea', '200 million years ago', 'Wegener', 'Marie Tharp');
  says(L, 'plates', '50 million years ago');
  before(L, 'fit', 'deep-time');
  before(L, 'plates', 'deep-time', 'everest');
  says(L, 'deep-time', '66 million years ago', '300,000 years old');
  // ranges: all seven of the table, drawn and named
  before(L, 'teach-ranges', 'ranges', 'find-range');
  const ranges = one(L, 'teach-ranges');
  assert.deepEqual(ranges.figures[0].markers.map((m) => m.at), H.RANGES.map((r) => r.at));
  assert.equal(ranges.figures[0].lines.length, H.RANGES.length);
  for (const name of Object.keys(FACTS.ranges)) says(L, 'teach-ranges', name);
  for (const [name, [continentName]] of Object.entries(FACTS.ranges)) if (name !== 'Ural Mountains' && name !== 'Great Dividing Range') says(L, 'teach-ranges', new RegExp(`${name}\\*\\*, in ${continentName}`));
  says(L, 'teach-ranges', /between Europe and Asia/, /east coast of Australia/);
  // rivers: the sea and the city of each are in the table, and the seas are printed on the map
  before(L, 'rivers', 'river-facts', 'cities');
  const rivers = one(L, 'rivers');
  for (const [name, [, sea]] of Object.entries(FACTS.rivers)) says(L, 'rivers', new RegExp(`\\| ${name} \\| ${sea} \\| [^|]+ \\|`));
  for (const [city, river] of Object.entries(FACTS.cityRivers)) says(L, 'rivers', new RegExp(`\\| ${river} \\| [^|]+ \\| ${city} \\|`));
  sameSet(rivers.figures[0].labels.map((l) => l.text), new Set(Object.values(FACTS.rivers).map((r) => r[1])));
  for (const l of rivers.figures[0].labels) assert.equal(countryAt(l.at, 'low', 0), null, `"${l.text}" is printed on the water`);
  // deserts: the six of the table are shaded and named on the map of the step before
  before(L, 'deserts', 'place-desert');
  const deserts = one(L, 'deserts').figures[0].areas;
  assert.equal(deserts.length, H.DESERTS.length);
  for (const d of H.DESERTS) assert.ok(deserts.some((a) => d.name.startsWith(a.label) && a.polygon === d.area), `${d.name} is on the map`);
  // seas and lakes: all thirteen
  before(L, 'waters', 'find-water');
  const shown = one(L, 'waters').figures.flatMap((f) => f.markers.map((m) => m.at));
  assert.deepEqual(shown.map(String).sort(), H.WATERS.map((w) => String(w.at)).sort());
});

test('teach before you ask, lesson 5: climate, the seasons and the biomes', () => {
  const L = 'climate';
  before(L, 'teach-climate', 'sun-angle');
  says(L, 'teach-climate', /\*\*Climate\*\* is the weather a place can expect year after year/, /\*\*latitude\*\*/, /midday Sun climbs high/);
  before(L, 'sun-angle', 'teach-seasons');
  before(L, 'teach-seasons', 'seasons', 'season-city');
  says(L, 'teach-seasons', 'tilted by 23.4°', 'June to August', 'December to February', /\*\*opposite\*\*/, /Slanting light is spread thin/);
  // the season question shows where its four cities are
  for (const step of variants(L, 'season-city', 80)) {
    const fig = step.figures[0];
    sameSet(markerLabels(fig), step.options.map((o) => o.text));
    assert.ok(fig.parallels.includes('equator'));
    for (const m of fig.markers) assert.ok(Math.abs(m.at[1] - FACTS.cities[m.label][0]) <= 0.75, `${m.label} stands at its own latitude`);
  }
  // the worked figures in the prompt of the height question, at heights the generator never uses
  for (const step of variants(L, 'altitude', 40)) {
    assert.match(flat(step.text), /500 m up it is about 3°C cooler, and 5,000 m up about 30°C cooler/);
    const metres = Number(grab(/\*\*([\d,]+) m\*\* higher/, flat(step.text))[0].replace(/,/g, ''));
    assert.ok(metres !== 500 && metres !== 5000);
  }
  before(L, 'belts', 'rain-shadow', 'find-biome', 'transect');
  before(L, 'biomes', 'teach-biome-world');
  before(L, 'teach-biome-world', 'find-biome', 'transect');
  for (const b of H.BIOMES) says(L, 'biomes', `| ${b.short} | ${b.brief} |`);
  const world = one(L, 'teach-biome-world').figures[0];
  sameSet(new Set(markerLabels(world)), H.BIOMES.map((b) => b.short), 'every biome is marked on the second map');
  assert.ok(world.markers.some((m) => m.at[1] < -20) && world.markers.some((m) => m.at[1] > 60), 'the map runs from the far north to the south');
  for (const m of world.markers) {
    const spot = H.BIOMES.flatMap((b) => b.spots.map((sp) => ({ ...sp, short: b.short }))).find((sp) => String(sp.at) === String(m.at));
    if (spot) assert.equal(m.label, spot.short, `${spot.place} is labelled with its own biome`);
    else { assert.equal(m.label, 'Desert'); assert.equal(countryAt(m.at, 'low', 40), 'CL', 'the one extra marker is the Atacama'); }
  }
  says(L, 'teach-biome-world', /repeat south of the Equator/, /\*\*Mediterranean\*\* on the west side/, /\*\*steppe\*\* deep inside a continent/, /Greenland and Antarctica/);
  for (const step of variants(L, 'find-biome', 20)) assert.deepEqual(step.widget.parallels, ['equator', 'tropics', 'polar-circles']);
});

test('teach before you ask, lesson 6: crowded and empty places, densities and megacities', () => {
  const L = 'where-people-live';
  before(L, 'teach-night', 'night', 'korea');
  const ringed = one(L, 'teach-night').figures[0];
  assert.equal(ringed.mode, 'label');
  assert.deepEqual(ringed.hotspots.map((sp) => sp.id).sort(), ['china', 'europe', 'india'], 'the Nile is left for the learner to find');
  says(L, 'teach-night', 'Sahara', 'Europe', 'India', 'eastern China', /picture/);
  before(L, 'crowded-map', 'crowded-or-empty', 'why-asia');
  before(L, 'teach-empty', 'crowded-or-empty', 'empty-why');
  sameSet(markerLabels(one(L, 'crowded-map').figures[0]), FACTS.crowded);
  sameSet(markerLabels(one(L, 'teach-empty').figures[0]), FACTS.empty);
  for (const p of H.PEOPLE_SPOTS.filter((x) => !x.dense)) says(L, 'teach-empty', `| ${p.label} | ${p.reason} |`);
  says(L, 'crowded-map', /\*\*rice\*\*, which feeds more people from each field/, /at least two thousand years/);
  before(L, 'density', 'dense-sparse');
  for (const step of variants(L, 'dense-sparse', 80)) {
    const fig = step.figures[0];
    sameSet(markerLabels(fig), step.options.map((o) => o.text));
    sameSet(fig.regions[0].ids, step.options.map((o) => codeByName(o.text)));
    for (const m of fig.markers) assert.ok(inOrNear(m.at, codeByName(m.label), 400), `${m.label}: the marker stands in the country`);
  }
  before(L, 'cities', 'teach-megacities');
  before(L, 'teach-megacities', 'megacities');
  before(L, 'teach-megacities-world', 'megacities');
  const asia = markerLabels(one(L, 'teach-megacities').figures[0]);
  const rest = markerLabels(one(L, 'teach-megacities-world').figures[0]);
  assert.deepEqual([asia.length, rest.length], [7, 10]);
  sameSet([...asia, ...rest], Object.keys(FACTS.megacityCountry), 'all seventeen megacities are named on a map before the question');
  for (const fig of [one(L, 'teach-megacities').figures[0], one(L, 'teach-megacities-world').figures[0]]) {
    for (const m of fig.markers) assert.ok(Math.abs(m.at[1] - FACTS.cities[m.label][0]) <= 0.75 && Math.abs(m.at[0] - FACTS.cities[m.label][1]) <= 0.75, `${m.label} is where the marker stands`);
  }
  says(L, 'teach-megacities', 'more than ten million');
  says(L, 'when', /from four billion to eight, took a little under fifty years/);
  assert.ok(FACTS.billions[8] - FACTS.billions[4] < 50 && FACTS.billions[8] - FACTS.billions[4] > 45);
});

test('teach before you ask, lesson 7: coasts, borders, capitals and the changing map', () => {
  const L = 'countries-borders';
  before(L, 'teach-coasts', 'landlocked', 'shapes');
  const coasts = one(L, 'teach-coasts').figures[0];
  sameSet(coasts.regions[0].ids, FACTS.landlocked, 'every landlocked country is coloured');
  sameSet(coasts.regions[1].ids, FACTS.islands);
  says(L, 'teach-coasts', 'landlocked', 'island country', /more than forty/, /sixteen in Africa/);
  for (const step of variants(L, 'shapes', 80)) {
    const fig = step.figures[0];
    sameSet(fig.labels, step.items.map((it) => codeByName(it.text)), 'the eight countries are named on the map');
    sameSet(fig.regions[0].ids, fig.labels);
  }
  for (const id of ['RU', 'CA', 'CN', 'BR', 'AU', 'IN']) says(L, 'sizes', `| ${countryName(id)} | ${FACTS.areas[countryName(id)].toFixed(1)} |`);
  const ruler = one(L, 'ruler');
  assert.ok(ruler.graded && ruler.mode !== 'predict', 'the 49th parallel is read off the map, not guessed');
  for (const o of ruler.options.filter((x) => !x.correct)) assert.ok(o.why.length > 20);
  before(L, 'ruler', 'teach-borders');
  before(L, 'teach-borders', 'natural-borders');
  says(L, 'teach-borders', /\*\*geometry\*\*/, /\*\*nature\*\*/);
  for (const [feature, pair] of Object.entries(FACTS.borders)) {
    const row = grab(new RegExp(`\\*\\*${feature.replace(/^l/, 'L')}\\*\\* \\((?:river|mountains|lakes)\\): (.+?)(?= \\*\\*|$)`), textOf(L, 'teach-borders'), feature)[0];
    sameSet(row.split(' and ').map((n) => codeByName(n)), pair, `${feature} divides ${pair}`);
  }
  const borders = one(L, 'teach-borders').figures[0];
  for (const name of borders.rivers) assert.ok(RIVER_DATA.rivers.some((r) => r[0] === name), `the map can draw the ${name}`);
  assert.equal(borders.rivers.length + borders.lines.length + 1, Object.keys(FACTS.borders).length, 'seven rivers, two mountain borders and the Great Lakes');
  before(L, 'berlin', 'teach-scramble');
  before(L, 'teach-scramble', 'africa');
  says(L, 'teach-scramble', 'Scramble for Africa', '1880s', '1914', 'Ethiopia and Liberia', /lines of latitude and longitude/);
  sameSet(one(L, 'teach-scramble').figures[0].regions[0].ids, ['ET', 'LR']);
  before(L, 'baarle', 'border-stories');
  // stories whose clue cannot be solved from the shapes alone name the neighbours on the map, never the answer
  let named = 0;
  for (const step of variants(L, 'border-stories', 120)) {
    const story = H.BORDER_STORIES.find((s) => s.answer === step.solution.picked);
    assert.deepEqual(step.widget.labels || [], story.show || []);
    assert.ok(!(step.widget.labels || []).includes(story.answer));
    if (story.show) named++;
    if (story.answer === 'ID') assert.deepEqual(step.widget.parallels, ['equator']);
  }
  assert.ok(named > 10);
  for (const answer of ['SS', 'MN', 'NP']) assert.ok(H.BORDER_STORIES.find((s) => s.answer === answer).show.length >= 1, `${answer}: neighbours are named`);
  before(L, 'teach-capitals', 'capitals');
  for (const [country, [capitalName, largest]] of Object.entries(FACTS.capitals)) says(L, 'teach-capitals', `${country}: **${capitalName}**, not ${largest}`);
  const caps = one(L, 'teach-capitals').figures[0];
  assert.equal(caps.markers.length, Object.keys(FACTS.capitals).length);
  for (const m of caps.markers) assert.ok(Object.values(FACTS.capitals).some(([name, , where]) => name === m.label && distanceKm(m.at, where) < 60), `${m.label} is where its star stands`);
  before(L, 'teach-changes', 'ussr', 'changes');
  for (const [year, re] of FACTS.mapChanges) says(L, 'teach-changes', new RegExp(`\\*\\*${year}\\*\\*: [^*]*${re.source}`));
  const fifteen = one(L, 'teach-changes').figures[0];
  sameSet(fifteen.regions[0].ids, FACTS.ussr);
  sameSet(fifteen.labels, FACTS.ussr);
  assert.deepEqual(fifteen.view, one(L, 'ussr').widget.view, 'the same map, first with names and then without');
});

/* ============================================================================ photographs and the guard */

test('country names read correctly inside sentences ("the Netherlands", "the United States")', () => {
  assert.equal(H.theName('Netherlands'), 'the Netherlands');
  assert.equal(H.theCountry('US'), 'the United States');
  assert.equal(H.theCountry('GB'), 'the United Kingdom');
  assert.equal(H.theCountry('PH'), 'the Philippines');
  assert.equal(H.theCountry('AE'), 'the United Arab Emirates');
  assert.equal(H.theCountry('SB'), 'the Solomon Islands');
  for (const code of ['FR', 'CN', 'CD', 'CG', 'NZ', 'IS', 'IE', 'UA', 'SD', 'CI']) assert.equal(H.theCountry(code), countryName(code), `${countryName(code)} takes no article`);
  // no generated or fixed text of the course puts one of these names bare after a verb or a preposition
  const slip = /\b(is|in|of|than|or|and|That is|Tap|capital of) (United States|United Kingdom|Netherlands|Philippines|United Arab Emirates)\b/;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      for (let k = 0; k < (step.gen ? SEEDS : 1); k++) {
        const s = resolveStep(step, makeRng(2203 + k * 389), step.id);
        for (const text of [s.text, s.explain, ...(s.hints || []), ...(s.options || []).map((o) => o.why || '')]) assert.ok(!slip.test(flat(text || '')), `${id}/${step.id}: ${flat(text || '').slice(0, 160)}`);
      }
    }
  }
  // messages that name the country a learner tapped
  const pinUS = resolveStep(raw('continents-oceans', 'place-continent'), makeRng(3), 'place-continent');
  const inUS = placeState(pinUS.widget, [-98, 39]);
  const msg = pinUS.check(inUS);
  if (msg !== true) assert.match(msg, /^Your pin is in the United States \(North America\)\./);
  assert.match(one('latitude-longitude', 'one-zone').check({ picked: 'PH', name: 'Philippines' }), /^That is the Philippines\./);
  assert.match(one('maps-lie', 'globe').check({ picked: 'US', name: 'United States' }), /^That is the United States\./);
  assert.match(one('countries-borders', 'ussr').check({ picked: ['AE'], count: 1 }), /^The United Arab Emirates was not part of the Soviet Union\.$/);
  for (const step of variants('countries-borders', 'border-stories', 40)) {
    if (step.solution.picked !== 'ID' && step.solution.picked !== 'MN') assert.match(step.check({ picked: 'US', name: 'United States' }), /^That is the United States\./);
  }
});

test('directions in feedback are read off the flat map, never across its cut edge', () => {
  // the usual map, centred on Greenwich: Asia is to the right of Alaska, the Americas to the left of Australia
  assert.match(H.compassOnPage([-150, 64], [90, 45]), /east/);
  assert.match(H.compassOnPage([134, -25], [-100, 45]), /west/);
  assert.equal(H.compassOnPage([2, 48], [37, 55]), 'east');
  assert.equal(H.compassOnPage([20, 8], [15, 50]), 'north');
  // a Pacific-centred map: India is to the left of the United States, Brazil to the right of China
  assert.match(H.compassOnPage([-98, 39], [79, 22], 150), /west/);
  assert.match(H.compassOnPage([104, 35], [-53, -10], 150), /east/);
  // lesson 1: a pin in Australia when North America is asked for, and a pin in Alaska when Asia is asked for
  for (const step of variants('continents-oceans', 'place-continent', 60)) {
    const name = grab(/Place the pin anywhere on (.+?)\.\*\*/, flat(step.text))[0];
    if (name === 'North America') assert.match(step.check(placeState(step.widget, [134, -25])), /North America is to the (north-)?west of it/);
    if (name === 'Asia') assert.match(step.check(placeState(step.widget, [-150, 64])), /Asia is to the (east|south-east) of it/);
    if (name === 'Oceania') assert.match(step.check(placeState(step.widget, [-120, -10])), /in the sea\. Oceania is to the (east|south-east) of your pin/);
  }
});

test('lesson 6: the density table agrees with its own numbers', () => {
  const info = flat(one('where-people-live', 'density').text);
  const row = (name) => grab(new RegExp(`\\| ${name} \\| (\\d+) million \\| ([\\d,]+)( million)? km² \\| about ([\\d,]+) \\|`), info);
  const bd = row('Bangladesh');
  const ru = row('Russia');
  const perKm2 = ([people, area, million]) => (Number(people) * 1e6) / (Number(area.replace(/,/g, '')) * (million ? 1e6 : 1));
  assert.ok(Math.abs(perKm2(bd) - Number(bd[3].replace(/,/g, ''))) / perKm2(bd) < 0.03, `Bangladesh: ${perKm2(bd).toFixed(0)} per km², printed ${bd[3]}`);
  assert.ok(Math.abs(perKm2(ru) - Number(ru[3])) < 0.8, `Russia: ${perKm2(ru).toFixed(1)} per km², printed ${ru[3]}`);
  assert.match(info, /Bangladesh\*\*, about 175 million/);
});

test('every photograph has a licence and a credit, is used, and has alt text', () => {
  const used = new Set();
  const perLesson = {};
  for (const [id, lesson] of Object.entries(lessons)) {
    perLesson[id] = new Set();
    for (const step of lesson.steps) {
      const s = resolveStep(step, makeRng(3), step.id);
      const figs = [...s.figures, ...(s.widget ? [s.widget] : []), ...(s.options || []).map((o) => o.figure).filter(Boolean)];
      for (const f of figs.filter((x) => x.type === 'photo')) {
        const key = Object.keys(manifest.images).find((k) => manifest.images[k].src === f.src);
        assert.ok(key, `${id}/${step.id}: the picture ${f.src} is in the course's manifest`);
        used.add(key);
        perLesson[id].add(key);
        const rec = manifest.images[key];
        assert.ok(rec.license && rec.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'), `${key}: licence and source`);
        assert.ok(rec.author && rec.author.length > 1, `${key}: a credit`);
        assert.ok(rec.publicDomain || /^CC (BY|BY-SA) \d/.test(rec.license) || rec.license === 'CC0', `${key}: ${rec.license} is a licence the project accepts`);
        assert.equal(f.credit, rec.author);
        assert.equal(f.license, rec.license);
        assert.ok(f.alt && f.alt.length > 40 && !/^(a |an |the )?(photo|image|picture)/i.test(f.alt), `${id}/${step.id}: alt text describes the picture`);
        assert.ok(f.alt.toLowerCase() !== String(f.caption || '').toLowerCase());
        // the step refers to the picture
        assert.ok(/photograph|picture|map|view|look|here (is|are)|this is/i.test(s.text), `${id}/${step.id}: the text refers to the picture`);
      }
    }
    assert.ok(perLesson[id].size >= 2 && perLesson[id].size <= 4, `${id}: ${perLesson[id].size} pictures`);
  }
  assert.deepEqual([...used].sort(), Object.keys(manifest.images).sort(), 'every picture in the manifest is used');
  assert.ok(used.size >= 14 && used.size <= 25);
});

test('guard: every generated step in the course is re-solved by a test above', () => {
  const generated = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) if (typeof step.gen === 'function') generated.push(`${id}/${step.id}`);
  assert.deepEqual(generated.filter((key) => !COVERED.has(key)), [], 'generated steps without a test');
  assert.deepEqual([...COVERED].filter((key) => !generated.includes(key)), [], 'tests for steps that no longer exist');
  assert.ok(generated.length >= 14);
});
