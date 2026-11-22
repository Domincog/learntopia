// Independent checks of "Around the World: Places and Cultures".
//
// The course drills the map, so its answers are facts: which country is where, which city is
// the capital, which photograph shows which landmark, what came first. This file carries its
// OWN tables of those facts (capitals, approximate coordinates, dates, the country each
// landmark and each physical feature lies in), typed in separately from the course's
// helpers.js, and checks three things:
//   - the course's tables agree with these (and with the map widget's own Natural Earth data);
//   - every generated question, over 200 seeds, marks as right the answer that these tables
//     say is right, offers no second right answer, and rejects every other choice;
//   - every hand-written map, photo and timeline step accepts exactly the states it should.
//
//   node --test tests/world-regions-course.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeLesson, resolveStep } from '../src/player/normalize.js';
import { makeRng } from '../src/core/rng.js';
import { countryName, countryInfo, countryIds, countryAt, place, distanceKm, destination } from '../src/widgets/world-map.js';
import course from '../content/courses/world-regions/course.js';
import { FIND, PICKABLE, VIEW, CITIES, FEATURES, LANDMARKS, DATES, NOT_THE_BIGGEST } from '../content/courses/world-regions/helpers.js';

const SEEDS = 200;
const COURSE = 'world-regions';
const LESSON_IDS = ['europe', 'middle-east-north-africa', 'sub-saharan-africa', 'south-asia', 'east-asia', 'southeast-asia-oceania', 'latin-america', 'north-america'];

const lessons = {};
for (const chapter of course.chapters) {
  for (const meta of chapter.lessons) {
    const mod = await import(`../content/courses/${COURSE}/lessons/${meta.id}.js`);
    lessons[meta.id] = normalizeLesson(mod.default, COURSE, meta.id);
  }
}
const manifest = JSON.parse(readFileSync(new URL(`../content/media/${COURSE}/manifest.json`, import.meta.url), 'utf8')).images;

const raw = (lesson, id) => {
  const step = lessons[lesson].steps.find((s) => s.id === id);
  assert.ok(step, `step ${lesson}/${id} exists`);
  return step;
};
const variants = (lesson, id, n = SEEDS) => Array.from({ length: n }, (_, k) => resolveStep(raw(lesson, id), makeRng(4099 + k * 7919), id));
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const bold = (text) => { const m = /\*\*([^*]+)\*\*/.exec(text); assert.ok(m, `no bold phrase in: ${text}`); return m[1]; };

/** Every string a learner can see in a resolved step. */
function visible(step) {
  const out = [];
  const skip = new Set(['type', 'id', 'src', 'thumb', 'license', 'licenseUrl', 'sourceUrl', 'credit', 'title', 'changes', 'color', 'shape', 'mode', 'curve', 'style', 'view', 'viewBox', 'content', 'labelPos', 'markerLabels', 'projection', 'tone', 'fit', 'aspect', 'answer', 'pickable', 'ids', 'rivers']);
  const walk = (v, key) => {
    if (typeof v === 'string') { if (!skip.has(key)) out.push(v); }
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object' && !(v instanceof RegExp)) for (const k of Object.keys(v)) walk(v[k], k);
  };
  walk(step, '');
  return out;
}
/** Every widget spec in a resolved step: its figures, its widget, and the figures of its options. */
function specsOf(step) {
  const out = [...(step.figures || [])];
  if (step.widget) out.push(step.widget);
  for (const o of step.options || []) if (o.figure) out.push(o.figure);
  return out;
}
/** One resolved copy of every step (several seeds for generated ones). */
function* everyStep(seeds = 25) {
  for (const [lesson, l] of Object.entries(lessons)) {
    for (const step of l.steps) {
      const n = step.gen ? seeds : 1;
      for (let k = 0; k < n; k++) yield [lesson, resolveStep(step, makeRng(31 + k * 613), step.id), step];
    }
  }
}

/* ============================================================ this file's own facts */

// Country (as the map names it) → capital. Typed from an atlas, not copied from helpers.js.
const OWN_CAPITALS = {
  'United Kingdom': 'London', France: 'Paris', Germany: 'Berlin', Spain: 'Madrid', Italy: 'Rome', Portugal: 'Lisbon', Ireland: 'Dublin',
  Poland: 'Warsaw', Greece: 'Athens', Sweden: 'Stockholm', Norway: 'Oslo', Finland: 'Helsinki', Austria: 'Vienna', Hungary: 'Budapest',
  Romania: 'Bucharest', Ukraine: 'Kyiv', Russia: 'Moscow', Iceland: 'Reykjavík', Bulgaria: 'Sofia', Denmark: 'Copenhagen',
  Netherlands: 'Amsterdam', Belgium: 'Brussels', Czechia: 'Prague',
  Morocco: 'Rabat', Algeria: 'Algiers', Tunisia: 'Tunis', Libya: 'Tripoli', Egypt: 'Cairo', 'Saudi Arabia': 'Riyadh', Oman: 'Muscat',
  Iraq: 'Baghdad', Iran: 'Tehran', Turkey: 'Ankara', Syria: 'Damascus', Jordan: 'Amman', 'United Arab Emirates': 'Abu Dhabi',
  Qatar: 'Doha', Kuwait: 'Kuwait City',
  Nigeria: 'Abuja', Ghana: 'Accra', Senegal: 'Dakar', Mali: 'Bamako', Niger: 'Niamey', Ethiopia: 'Addis Ababa', Kenya: 'Nairobi',
  Uganda: 'Kampala', 'DR Congo': 'Kinshasa', Angola: 'Luanda', Zambia: 'Lusaka', Zimbabwe: 'Harare', Mozambique: 'Maputo',
  Namibia: 'Windhoek', Botswana: 'Gaborone', Madagascar: 'Antananarivo', Somalia: 'Mogadishu', Chad: 'N\'Djamena', Cameroon: 'Yaoundé',
  India: 'New Delhi', Pakistan: 'Islamabad', Bangladesh: 'Dhaka', Nepal: 'Kathmandu', Afghanistan: 'Kabul', Bhutan: 'Thimphu',
  China: 'Beijing', Japan: 'Tokyo', 'South Korea': 'Seoul', 'North Korea': 'Pyongyang', Mongolia: 'Ulaanbaatar',
  Thailand: 'Bangkok', Vietnam: 'Hanoi', Philippines: 'Manila', Singapore: 'Singapore', Cambodia: 'Phnom Penh',
  Australia: 'Canberra', 'New Zealand': 'Wellington', 'Papua New Guinea': 'Port Moresby',
  Mexico: 'Mexico City', Guatemala: 'Guatemala City', Cuba: 'Havana', Panama: 'Panama City', Colombia: 'Bogotá', Venezuela: 'Caracas',
  Ecuador: 'Quito', Peru: 'Lima', Chile: 'Santiago', Argentina: 'Buenos Aires', Uruguay: 'Montevideo', Paraguay: 'Asunción',
  Brazil: 'Brasília', 'Dominican Republic': 'Santo Domingo',
  'United States': 'Washington, D.C.', Canada: 'Ottawa',
};
// Big cities that are NOT capitals (the classic mix-ups), with the country they are in.
const OWN_NOT_CAPITALS = {
  Istanbul: 'Turkey', Casablanca: 'Morocco', Dubai: 'United Arab Emirates', Lagos: 'Nigeria', Karachi: 'Pakistan', Sydney: 'Australia',
  Auckland: 'New Zealand', 'São Paulo': 'Brazil', 'New York': 'United States', Toronto: 'Canada', 'Ho Chi Minh City': 'Vietnam', Shanghai: 'China',
};
// City → [lon, lat, country code]: positions typed from memory of the atlas, to the nearest tenth of a degree or so.
const OWN_PLACES = {
  London: [-0.1, 51.5, 'GB'], Paris: [2.35, 48.86, 'FR'], Berlin: [13.4, 52.5, 'DE'], Madrid: [-3.7, 40.4, 'ES'], Rome: [12.5, 41.9, 'IT'],
  Moscow: [37.6, 55.75, 'RU'], Athens: [23.7, 38, 'GR'], Istanbul: [29, 41, 'TR'], Cairo: [31.2, 30, 'EG'], Mecca: [39.8, 21.4, 'SA'],
  Tehran: [51.4, 35.7, 'IR'], Baghdad: [44.4, 33.3, 'IQ'], Riyadh: [46.7, 24.7, 'SA'], Ankara: [32.9, 39.9, 'TR'], Lagos: [3.4, 6.5, 'NG'],
  Abuja: [7.5, 9.1, 'NG'], Nairobi: [36.8, -1.3, 'KE'], Kinshasa: [15.3, -4.3, 'CD'], Johannesburg: [28, -26.2, 'ZA'], 'Addis Ababa': [38.7, 9, 'ET'],
  Dakar: [-17.4, 14.7, 'SN'], 'New Delhi': [77.2, 28.6, 'IN'], Mumbai: [72.9, 19.1, 'IN'], Kolkata: [88.4, 22.6, 'IN'], Karachi: [67, 24.9, 'PK'],
  Dhaka: [90.4, 23.8, 'BD'], Kathmandu: [85.3, 27.7, 'NP'], Colombo: [79.9, 6.9, 'LK'], Beijing: [116.4, 39.9, 'CN'], Shanghai: [121.5, 31.2, 'CN'],
  Tokyo: [139.7, 35.7, 'JP'], Seoul: [127, 37.6, 'KR'], Ulaanbaatar: [106.9, 47.9, 'MN'], Bangkok: [100.5, 13.75, 'TH'], Jakarta: [106.8, -6.2, 'ID'],
  Singapore: [103.8, 1.35, 'SG'], Manila: [121, 14.6, 'PH'], Sydney: [151.2, -33.9, 'AU'], Canberra: [149.1, -35.3, 'AU'], Wellington: [174.8, -41.3, 'NZ'],
  'Mexico City': [-99.1, 19.4, 'MX'], Lima: [-77, -12, 'PE'], 'Buenos Aires': [-58.4, -34.6, 'AR'], 'Brasília': [-47.9, -15.8, 'BR'],
  'São Paulo': [-46.6, -23.5, 'BR'], 'Bogotá': [-74.1, 4.7, 'CO'], Santiago: [-70.7, -33.45, 'CL'], Havana: [-82.4, 23.1, 'CU'],
  'New York': [-74, 40.7, 'US'], 'Los Angeles': [-118.25, 34.05, 'US'], Chicago: [-87.6, 41.9, 'US'], Toronto: [-79.4, 43.7, 'CA'],
  'Washington, D.C.': [-77, 38.9, 'US'], Ottawa: [-75.7, 45.4, 'CA'], Vancouver: [-123.1, 49.3, 'CA'], 'Montréal': [-73.6, 45.5, 'CA'],
  Houston: [-95.4, 29.8, 'US'], Miami: [-80.2, 25.8, 'US'], 'San Francisco': [-122.4, 37.8, 'US'], Seattle: [-122.3, 47.6, 'US'],
  'New Orleans': [-90.1, 29.95, 'US'], Denver: [-105, 39.7, 'US'],
};
// Event id → year (negative = BCE), from the notes the lessons were verified against.
const OWN_DATES = {
  parthenon: -432, colosseum: 80, 'notre-dame': 1163, 'st-basils': 1561, 'eiffel-tower': 1889, eu: 1993,
  'giza-pyramids': -2560, 'petra-treasury': 50, 'hagia-sophia': 537, hijra: 622, suez: 1869, 'burj-khalifa': 2010,
  'great-zimbabwe': 1300, adwa: 1896, ghana: 1957, 'year-of-africa': 1960, mandela: 1994, 'south-sudan': 2011,
  indus: -2500, buddha: -450, sigiriya: 480, 'taj-mahal': 1653, partition: 1947, bangladesh: 1971,
  qin: -221, kyoto: 794, hangul: 1443, meiji: 1868, 'korea-divided': 1945, shinkansen: 1964,
  'first-australians': -50000, borobudur: 825, 'angkor-wat': 1150, aotearoa: 1300, 'singapore-founded': 1819, 'sydney-opera-house': 1973,
  'chichen-itza': 1000, 'machu-picchu': 1450, columbus: 1492, 'latin-independence': 1821, 'panama-canal': 1914, 'christ-the-redeemer': 1931,
  cahokia: 1100, quebec: 1608, 'us-independence': 1776, 'canada-confederation': 1867, 'statue-of-liberty': 1886, nunavut: 1999,
};
// A word that each event's label must contain, so that a label cannot drift onto the wrong date.
const OWN_DATE_WORDS = {
  parthenon: 'Parthenon', colosseum: 'Colosseum', 'notre-dame': 'Notre-Dame', 'st-basils': 'Basil', 'eiffel-tower': 'Eiffel', eu: 'European Union',
  'giza-pyramids': 'Pyramid', 'petra-treasury': 'Petra', 'hagia-sophia': 'Hagia Sophia', hijra: 'Islamic calendar', suez: 'Suez', 'burj-khalifa': 'Burj Khalifa',
  'great-zimbabwe': 'Great Zimbabwe', adwa: 'Adwa', ghana: 'Ghana', 'year-of-africa': 'Seventeen', mandela: 'Mandela', 'south-sudan': 'South Sudan',
  indus: 'Indus', buddha: 'Buddha', sigiriya: 'Sigiriya', 'taj-mahal': 'Taj Mahal', partition: 'India and Pakistan', bangladesh: 'Bangladesh',
  qin: 'First Emperor', kyoto: 'Kyoto', hangul: 'Korean alphabet', meiji: 'Meiji', 'korea-divided': 'Korea is divided', shinkansen: 'bullet train',
  'first-australians': 'Australia', borobudur: 'Borobudur', 'angkor-wat': 'Angkor Wat', aotearoa: 'Aotearoa', 'singapore-founded': 'Singapore', 'sydney-opera-house': 'Opera House',
  'chichen-itza': 'Chichén Itzá', 'machu-picchu': 'Machu Picchu', columbus: 'Columbus', 'latin-independence': 'Mexico and Peru', 'panama-canal': 'Panama Canal', 'christ-the-redeemer': 'Christ the Redeemer',
  cahokia: 'Cahokia', quebec: 'Québec', 'us-independence': 'United States', 'canada-confederation': 'Canada', 'statue-of-liberty': 'Statue of Liberty', nunavut: 'Nunavut',
};
// Landmark: the name the questions use → [picture id, country code(s), lon, lat].
const OWN_LANDMARKS = {
  'the Parthenon': ['parthenon', ['GR'], 23.73, 37.97],
  'the Eiffel Tower': ['eiffel-tower', ['FR'], 2.29, 48.86],
  'St Basil\'s Cathedral': ['st-basils', ['RU'], 37.62, 55.75],
  'the pyramids of Giza': ['giza-pyramids', ['EG'], 31.13, 29.98],
  'the Treasury at Petra': ['petra-treasury', ['JO'], 35.45, 30.32],
  'Hagia Sophia': ['hagia-sophia', ['TR'], 28.98, 41.01],
  'the Great Mosque of Djenné': ['djenne-mosque', ['ML'], -4.56, 13.9],
  Kilimanjaro: ['kilimanjaro', ['TZ'], 37.35, -3.07],
  'Victoria Falls': ['victoria-falls', ['ZM', 'ZW'], 25.86, -17.92],
  'the Taj Mahal': ['taj-mahal', ['IN'], 78.04, 27.17],
  'the Golden Temple': ['golden-temple', ['IN'], 74.88, 31.62],
  Sigiriya: ['sigiriya', ['LK'], 80.76, 7.96],
  'the Great Wall of China': ['great-wall', ['CN'], 117.2, 40.7],
  'Gyeongbokgung Palace': ['gyeongbokgung', ['KR'], 126.98, 37.58],
  'Mount Fuji': ['mount-fuji', ['JP'], 138.73, 35.36],
  Borobudur: ['borobudur', ['ID'], 110.2, -7.61],
  'Angkor Wat': ['angkor-wat', ['KH'], 103.87, 13.41],
  'the Sydney Opera House': ['sydney-opera-house', ['AU'], 151.21, -33.86],
  'Machu Picchu': ['machu-picchu', ['PE'], -72.55, -13.16],
  'the pyramid of Chichén Itzá': ['chichen-itza', ['MX'], -88.57, 20.68],
  'Christ the Redeemer': ['christ-the-redeemer', ['BR'], -43.21, -22.95],
  'the Statue of Liberty': ['statue-of-liberty', ['US'], -74.04, 40.69],
  'the Grand Canyon': ['grand-canyon', ['US'], -112.1, 36.1],
  'the CN Tower': ['toronto-skyline', ['CA'], -79.39, 43.64],
};
// Physical feature → where its marker must fall: country codes (null = open water), and how
// many km of slack to allow (coasts, straits and lakes are fuzzy on a 1:110 million map).
const OWN_FEATURES = {
  'the Iberian Peninsula': [['ES'], 0], 'the Italian Peninsula': [['IT'], 0], 'the Balkan Peninsula': [['MK', 'RS', 'BG', 'XK'], 0],
  'the Scandinavian Peninsula': [['SE', 'NO'], 0], 'the Alps': [['CH', 'AT', 'IT'], 0], 'the British Isles': [['GB'], 0],
  'the Baltic Sea': [[null], 0], 'the Black Sea': [[null], 0], 'the North Sea': [[null], 0],
  'the Suez Canal': [['EG'], 30], 'the Strait of Hormuz': [['OM', 'IR', 'AE'], 120], 'the Bosphorus': [['TR'], 30],
  'the Strait of Gibraltar': [['ES', 'MA'], 60], 'the Bab-el-Mandeb': [['YE', 'DJ', 'ER'], 80],
  'the Sahel': [['NE'], 0], 'the Congo rainforest': [['CD'], 0], 'the Kalahari': [['BW'], 0], 'the Ethiopian Highlands': [['ET'], 0],
  'Lake Victoria': [['UG', 'TZ', 'KE', null], 120], Kilimanjaro: [['TZ', 'KE'], 0], 'Victoria Falls': [['ZM', 'ZW'], 0], Madagascar: [['MG'], 0],
  'the Namib': [['NA'], 0], 'the Niger Delta': [['NG'], 40], 'the Cape of Good Hope': [['ZA'], 40],
  'the Himalaya': [['NP', 'CN'], 0], 'the Deccan Plateau': [['IN'], 0], 'the Thar Desert': [['IN', 'PK'], 0], 'the Ganges Delta': [['BD', 'IN'], 40],
  'the Indus Delta': [['PK'], 40], 'the Hindu Kush': [['AF', 'PK'], 0], 'Sri Lanka': [['LK'], 0], 'the Ganges Plain': [['IN'], 0], 'the Bay of Bengal': [[null], 0],
  'the Tibetan Plateau': [['CN'], 0], 'the Gobi Desert': [['MN', 'CN'], 0], 'the North China Plain': [['CN'], 0], 'the Korean Peninsula': [['KR', 'KP'], 0],
  Honshu: [['JP'], 0], Hokkaido: [['JP'], 0], 'the Taklamakan Desert': [['CN'], 0], 'the Sichuan Basin': [['CN'], 0], 'the Yangtze Delta': [['CN'], 40],
  Sumatra: [['ID'], 0], Borneo: [['ID', 'MY'], 0], Java: [['ID'], 30], 'New Guinea': [['PG', 'ID'], 0], 'the Mekong Delta': [['VN'], 30], Luzon: [['PH'], 0],
  'the Great Barrier Reef': [['AU', null], 200], Tasmania: [['AU'], 0], Uluru: [['AU'], 0], 'the South Island': [['NZ'], 0],
  'the Andes': [['PE'], 0], 'the Amazon Basin': [['BR'], 0], Patagonia: [['AR'], 0], 'the Atacama Desert': [['CL'], 0], 'the Pampas': [['AR'], 0],
  'the Yucatán Peninsula': [['MX'], 0], 'the Isthmus of Panama': [['PA'], 40], 'the Caribbean Sea': [[null], 0], 'Lake Titicaca': [['PE', 'BO'], 40],
  'Cape Horn': [['CL'], 80], 'the Brazilian Highlands': [['BR'], 0],
  'the Rocky Mountains': [['US'], 0], 'the Great Plains': [['US'], 0], 'the Great Lakes': [['US', 'CA', null], 150], 'the Mississippi Delta': [['US'], 60],
  'Hudson Bay': [[null, 'CA'], 0], 'the Appalachians': [['US'], 0], Alaska: [['US'], 0], Florida: [['US'], 0], 'the Grand Canyon': [['US'], 0],
  'the Arctic Archipelago': [['CA', null], 150], Greenland: [['GL'], 0],
};
// Places whose status is disputed: never the answer to a question, never tappable in a "find the country" map.
const DISPUTED = ['TW', 'XK', 'EH', 'PS'];

/* ------------------------------------------------------------ small tools of this file's own */

const NAME_TO_CODE = new Map();
for (const id of countryIds('world', { territories: true })) { NAME_TO_CODE.set(countryName(id), id); NAME_TO_CODE.set(`the ${countryName(id)}`, id); }
const codeOf = (name) => { const id = NAME_TO_CODE.get(name); assert.ok(id, `"${name}" is a country the map knows`); return id; };
const plain = (name) => name.replace(/^the /i, '');
const VIEW_BY_LESSON = {
  europe: ['europe', 'centralEurope', 'balkans', 'baltic'], 'middle-east-north-africa': ['mena', 'maghreb', 'middleEast'],
  'sub-saharan-africa': ['africa', 'subSahara', 'westAfrica', 'eastAfrica', 'southernAfrica', 'centralAfrica'], 'south-asia': ['southAsia'],
  'east-asia': ['eastAsia'], 'southeast-asia-oceania': ['southeastAsia', 'australasia', 'seaOceania'],
  'latin-america': ['middleAmerica', 'southAmerica', 'latinAmerica'], 'north-america': ['northAmerica', 'usCanada'],
};
const inBox = ([lon, lat], [w, s, e, n], pad = 0) => lon >= w - pad && lon <= e + pad && lat >= s - pad && lat <= n + pad;
const validPoint = (p) => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
/** Is the point inside the country, or close to it? (Coasts are simplified; small states are rings on the coarse layer.) */
function inOrNear(p, code, slackKm = 40) {
  if (countryAt(p, 'low', slackKm) === code) return true;
  const info = countryInfo(code);
  return !!info && !!info.box && inBox(p, info.box, 0.6);
}
/** A rough compass check with flat geometry, on purpose a different formula from the helper's bearing. */
function roughlyTowards(word, from, to) {
  const dx = (to[0] - from[0]) * Math.cos(((from[1] + to[1]) / 2) * Math.PI / 180);
  const dy = to[1] - from[1];
  const unit = { north: [0, 1], south: [0, -1], east: [1, 0], west: [-1, 0], 'north-east': [1, 1], 'north-west': [-1, 1], 'south-east': [1, -1], 'south-west': [-1, -1] }[word];
  assert.ok(unit, `"${word}" is a compass direction`);
  const cos = (dx * unit[0] + dy * unit[1]) / (Math.hypot(dx, dy) * Math.hypot(unit[0], unit[1]));
  return cos > 0.6;                              // within about 50 degrees of the true direction
}
const directionIn = (message) => { const m = /(north-east|north-west|south-east|south-west|north|south|east|west)/.exec(message); return m ? m[1] : null; };

/* ============================================================ the course as a whole */

test('course shape: eight lessons of 17 to 20 steps, hands-on, with review steps, generated practice, a recap and a teaser', () => {
  assert.equal(course.id, COURSE);
  assert.deepEqual(Object.keys(lessons), LESSON_IDS);
  for (const [id, lesson] of Object.entries(lessons)) {
    const n = lesson.steps.length;
    // (11 to 14 before the lessons were given their teaching screens; 20 is the most a lesson may have)
    assert.ok(n >= 17 && n <= 20, `${id}: ${n} steps`);
    const handsOn = lesson.steps.filter((s) => s.type === 'interact').length;
    assert.ok(handsOn >= 3, `${id}: ${handsOn} interact steps`);
    const reviews = lesson.steps.filter((s) => s.review);
    assert.ok(reviews.length >= 2 && reviews.length <= 4, `${id}: ${reviews.length} review steps`);
    assert.ok(lesson.steps.filter((s) => s.gen).length >= 2, `${id}: at least two generated steps`);
    assert.ok(lesson.steps.filter((s) => s.type === 'choice').length <= 5, `${id}: no more than five choice steps`);
    assert.ok(lesson.steps.some((s) => s.type === 'order' || specsOf(resolveStep(s, makeRng(1), s.id)).some((w) => w.type === 'timeline')), `${id}: an order step or a timeline`);
    assert.ok(lesson.recap.length >= 3 && lesson.recap.length <= 4, `${id}: recap`);
    assert.ok(lesson.next.length > 20, `${id}: teaser`);
    let infoRun = 0;
    for (const s of lesson.steps) { infoRun = s.type === 'info' ? infoRun + 1 : 0; assert.ok(infoRun < 3, `${id}: three info steps in a row`); }
  }
});

test('every graded step explains itself, and no learner-visible text is broken', () => {
  for (const [lesson, step, source] of everyStep(SEEDS)) {
    if (step.graded) assert.ok(step.explain.length > 20, `${lesson}/${step.id}: explain`);
    for (const text of visible(step)) {
      assert.ok(!/undefined|NaN|\[object Object\]|Infinity/.test(text), `${lesson}/${step.id}: ${text}`);
      // emphasis must open and close on one line of text, or the markers show up as asterisks
      for (const line of text.split('\n')) {
        const stripped = line.replace(/\[\[[^\]]*\]\]/g, '');
        const pairs = (stripped.match(/\*\*/g) || []).length;
        const singles = (stripped.replace(/\*\*/g, '').match(/\*/g) || []).length;
        assert.ok(pairs % 2 === 0 && singles % 2 === 0, `${lesson}/${step.id}: emphasis is not closed on its own line: "${line.trim()}"`);
      }
    }
    if (!source.gen) continue;
  }
  for (const lesson of Object.values(lessons)) for (const line of [...lesson.recap, lesson.next]) assert.ok(!/undefined|NaN/.test(line));
});

test('every choice has exactly one correct option and no duplicates; every multi has some right and some wrong', () => {
  let seen = 0;
  for (const [lesson, step] of everyStep(SEEDS)) {
    if (step.type !== 'choice' && step.type !== 'multi') continue;
    const right = step.options.filter((o) => o.correct).length;
    if (step.type === 'choice') assert.equal(right, 1, `${lesson}/${step.id}: one correct option`);
    else assert.ok(right >= 1 && right < step.options.length, `${lesson}/${step.id}`);
    const keys = step.options.map((o) => (o.figure ? o.figure.src : flat(o.text)));
    assert.equal(new Set(keys).size, keys.length, `${lesson}/${step.id}: duplicate options`);
    for (const o of step.options) assert.ok(o.figure || flat(o.text), `${lesson}/${step.id}: an option with neither text nor picture`);
    seen++;
  }
  assert.ok(seen > 800);
});

/* ============================================================ the tables in helpers.js */

test('helper capitals agree with this file\'s atlas and with the map widget\'s data', () => {
  let capitals = 0;
  for (const [city, [, , code, isCapital]] of Object.entries(CITIES)) {
    const country = countryName(code);
    if (isCapital) {
      capitals++;
      assert.equal(OWN_CAPITALS[country], city, `${city} is the capital of ${country}`);
      // the widget's own capital (Natural Earth) agrees, spelling apart
      assert.equal(flat(countryInfo(code).capital).toLowerCase(), city.toLowerCase(), `the map's data also has ${city} for ${country}`);
    } else if (OWN_CAPITALS[country]) {
      assert.notEqual(OWN_CAPITALS[country], city, `${city} is not the capital of ${country}`);
    }
  }
  assert.ok(capitals >= 85, `${capitals} capitals`);
  // no capital of a place whose status is disputed, and none of the countries with two or three capitals
  for (const [, [, , code, isCapital]] of Object.entries(CITIES)) if (isCapital) assert.ok(![...DISPUTED, 'IL', 'ZA', 'BO', 'LK', 'ID', 'MM', 'CI', 'BJ', 'BI', 'CH'].includes(code), `${code} must not be asked for a capital`);
  for (const [code, [city, why]] of Object.entries(NOT_THE_BIGGEST)) {
    assert.equal(OWN_NOT_CAPITALS[city], countryName(code), `${city} is the big non-capital city of ${countryName(code)}`);
    assert.equal(CITIES[city][2], code);
    assert.equal(CITIES[city][3], 0, `${city} is not marked as a capital`);
    assert.ok(why.length > 30);
  }
});

test('every city is where it should be: longitude first, inside its country, and where this file and the map data put it', () => {
  for (const [city, [lon, lat, code]] of Object.entries(CITIES)) {
    assert.ok(validPoint([lon, lat]), `${city}: a valid [lon, lat]`);
    assert.ok(countryInfo(code), `${city}: ${code} is a country code the map knows`);
    assert.ok(inOrNear([lon, lat], code), `${city} lies in or beside ${countryName(code)} (a swapped longitude and latitude would not)`);
    const known = place(city);
    assert.ok(known, `${city} is in the map's table of places`);
    assert.ok(distanceKm(known, [lon, lat]) < 15, `${city}: the helper and the map's table agree`);
    if (OWN_PLACES[city]) {
      assert.ok(distanceKm([OWN_PLACES[city][0], OWN_PLACES[city][1]], [lon, lat]) < 60, `${city}: within 60 km of this file's position`);
      assert.equal(OWN_PLACES[city][2], code, `${city}: country`);
    }
  }
  for (const city of Object.keys(OWN_PLACES)) assert.ok(CITIES[city], `${city} is in the helper table`);
});

test('landmarks: country, position, a picture with a licence and a credit, and an alt text that does not give the name away', () => {
  const byId = Object.fromEntries(Object.entries(OWN_LANDMARKS).map(([name, v]) => [v[0], [name, ...v.slice(1)]]));
  assert.deepEqual(Object.keys(LANDMARKS).sort(), Object.keys(byId).sort());
  for (const [id, lm] of Object.entries(LANDMARKS)) {
    const [name, codes, lon, lat] = byId[id];
    assert.equal(lm.name, name, `${id}: name`);
    assert.deepEqual([lm.country, lm.also].filter(Boolean).sort(), codes.slice().sort(), `${id}: country`);
    assert.ok(validPoint(lm.at) && distanceKm(lm.at, [lon, lat]) < 25, `${id}: within 25 km of this file's position`);
    assert.ok(codes.some((c) => inOrNear(lm.at, c)), `${id}: lies in ${codes.join(' or ')}`);
    assert.ok(manifest[id], `${id}: a picture in the media manifest`);
    assert.ok(manifest[id].license && manifest[id].author && manifest[id].sourceUrl, `${id}: licence, author and source are recorded`);
    // the alt text describes; it must not contain the distinctive words of the name
    for (const word of plain(name).split(/[\s']+/).filter((w) => w.length > 4 && !['Great', 'Mount', 'Tower', 'Temple', 'Palace', 'Mosque', 'House', 'Canyon', 'Statue', 'Falls', 'pyramid', 'pyramids', 'Treasury', 'Cathedral', 'Golden', 'Grand', 'Opera'].includes(w))) {
      assert.ok(!lm.alt.includes(word), `${id}: the alt text names the answer ("${word}")`);
    }
    if (lm.year != null && DATES[id]) assert.ok(Math.abs(lm.year - OWN_DATES[id]) <= 30, `${id}: the landmark's year agrees with the dates table`);
  }
  assert.deepEqual(Object.keys(manifest).sort(), Object.keys(LANDMARKS).sort(), 'every picture of the course is a landmark of the table, and the other way round');
});

test('dates agree with this file\'s table, and each label names the right event', () => {
  assert.deepEqual(Object.keys(DATES).sort(), Object.keys(OWN_DATES).sort());
  for (const [id, [year, label]] of Object.entries(DATES)) {
    assert.equal(year, OWN_DATES[id], `${id}: year`);
    assert.notEqual(year, 0, 'there is no year 0');
    assert.ok(label.includes(OWN_DATE_WORDS[id]), `${id}: label "${label}" should mention ${OWN_DATE_WORDS[id]}`);
  }
  assert.equal(new Set(Object.values(DATES).map((d) => d[1])).size, Object.keys(DATES).length, 'labels are unique');
});

test('physical features fall where this file says they are, inside their lesson\'s map', () => {
  const lessonOf = { europe: 'europe', mena: 'middle-east-north-africa', africa: 'sub-saharan-africa', southAsia: 'south-asia', eastAsia: 'east-asia', seaOceania: 'southeast-asia-oceania', latinAmerica: 'latin-america', northAmerica: 'north-america' };
  const mainView = { europe: 'europe', mena: 'mena', africa: 'africa', southAsia: 'southAsia', eastAsia: 'eastAsia', seaOceania: 'seaOceania', latinAmerica: 'latinAmerica', northAmerica: 'northAmerica' };
  let n = 0;
  for (const [key, list] of Object.entries(FEATURES)) {
    assert.ok(lessonOf[key], key);
    assert.equal(new Set(list.map((f) => f.name)).size, list.length, `${key}: names are unique`);
    for (const f of list) {
      const own = OWN_FEATURES[f.name];
      assert.ok(own, `${f.name}: in this file's table`);
      assert.ok(validPoint(f.at), `${f.name}: a valid [lon, lat]`);
      assert.ok(inBox(f.at, VIEW[mainView[key]]), `${f.name}: inside the ${key} map`);
      const [codes, slack] = own;
      const hit = countryAt(f.at, 'low', slack);
      assert.ok(codes.includes(hit) || (slack > 0 && codes.includes(countryAt(f.at))), `${f.name}: the marker is in ${hit}, expected ${codes.join(' / ')}`);
      assert.ok(f.clue.length > 15 && !/[.]$/.test(f.clue), `${f.name}: a clue that fits into a sentence`);
      n++;
    }
  }
  assert.equal(n, Object.keys(OWN_FEATURES).length);
});

test('countries to find: known codes, a view that shows them, tappable, and never a disputed place', () => {
  for (const [key, list] of Object.entries(FIND)) {
    assert.equal(new Set(list.map((c) => c.id)).size, list.length, `${key}: no country twice`);
    for (const c of list) {
      const info = countryInfo(c.id);
      assert.ok(info, `${c.id} is a code the map knows`);
      assert.ok(VIEW[c.view], `${c.id}: view ${c.view}`);
      assert.ok(inBox(info.center, VIEW[c.view], 4), `${info.name} is inside the ${c.view} view`);
      assert.ok(PICKABLE[key].includes(c.id), `${info.name} can be tapped`);
      assert.ok(!DISPUTED.includes(c.id), `${info.name} is not a disputed territory`);
      assert.ok(c.where.length > 15 && c.fact.length > 30, `${info.name}: a clue and a fact`);
      // the widest dimension of the country should be a comfortable tap on a phone (360 px wide): at least about 14 px
      const [w, s, e, n] = VIEW[c.view];
      const pxPerDegree = 360 / (e - w);
      const size = Math.max((info.box[2] - info.box[0]) * Math.cos(info.center[1] * Math.PI / 180), info.box[3] - info.box[1]) * pxPerDegree;
      assert.ok(size >= 14, `${info.name} is only ${Math.round(size)} px across on the ${c.view} view`);
    }
  }
  for (const [key, list] of Object.entries(PICKABLE)) {
    for (const id of list) { assert.ok(countryInfo(id), `${key}: ${id}`); assert.ok(!DISPUTED.includes(id), `${key}: ${id} must not be tappable`); }
  }
});

test('every country code and every coordinate used anywhere in the lessons is valid', () => {
  let codes = 0;
  let points = 0;
  const checkIds = (v, where) => {
    for (const item of Array.isArray(v) ? v : [v]) {
      if (typeof item === 'string' && /^[A-Z]{2}$/.test(item)) { assert.ok(countryInfo(item), `${where}: unknown country code ${item}`); codes++; }
      else if (item && typeof item === 'object' && typeof item.id === 'string' && /^[A-Z]{2}$/.test(item.id)) { assert.ok(countryInfo(item.id), `${where}: unknown country code ${item.id}`); codes++; }
    }
  };
  const checkPoint = (p, where) => {
    if (typeof p === 'string') { assert.ok(place(p), `${where}: unknown place "${p}"`); return; }
    assert.ok(validPoint(p), `${where}: not a [lon, lat]: ${JSON.stringify(p)}`);
    points++;
  };
  for (const [lesson, step] of everyStep(40)) {
    for (const spec of specsOf(step)) {
      if (spec.type !== 'world-map') continue;
      const where = `${lesson}/${step.id}`;
      for (const group of spec.regions || []) checkIds(group.ids, where);
      checkIds(spec.pickable || [], where);
      if (Array.isArray(spec.labels)) checkIds(spec.labels, where);
      if (typeof spec.answer === 'string' && /^[A-Z]{2}$/.test(spec.answer)) checkIds(spec.answer, where);
      if (spec.view && !Array.isArray(spec.view) && typeof spec.view === 'object' && spec.view.ids) checkIds(spec.view.ids, where);
      if (Array.isArray(spec.view)) { assert.equal(spec.view.length, 4, `${where}: view box`); assert.ok(spec.view[3] > spec.view[1], `${where}: view is [west, south, east, north]`); }
      for (const m of spec.markers || []) checkPoint(m.at, where);
      for (const line of spec.lines || []) line.points.forEach((p) => checkPoint(p, where));
      for (const area of spec.areas || []) (area.polygon || []).forEach((p) => checkPoint(p, where));
      for (const label of Array.isArray(spec.labels) ? spec.labels : []) if (label && typeof label === 'object' && label.at) checkPoint(label.at, where);
      if (spec.target) checkPoint(spec.target, where);
      // a marker should be inside the window it is drawn in
      if (Array.isArray(spec.view)) for (const m of spec.markers || []) assert.ok(inBox(m.at, spec.view), `${where}: marker "${m.label}" is outside the map`);
    }
  }
  assert.ok(codes > 400 && points > 800, `${codes} codes, ${points} points`);
});

test('every photograph used in a lesson is in the manifest with a licence and a credit, and every picture is used', () => {
  const used = new Set();
  for (const [lesson, step] of everyStep(60)) {
    for (const spec of specsOf(step)) {
      if (spec.type !== 'photo') continue;
      const m = /content\/media\/world-regions\/([a-z0-9-]+)\.jpg/.exec(spec.src);
      assert.ok(m, `${lesson}/${step.id}: ${spec.src} is a picture of this course`);
      const entry = manifest[m[1]];
      assert.ok(entry, `${lesson}/${step.id}: ${m[1]} is in the manifest`);
      assert.ok(entry.license && entry.author, `${m[1]}: licence and author`);
      assert.equal(spec.license, entry.license, `${m[1]}: the lesson shows the recorded licence`);
      assert.ok(spec.credit && spec.sourceUrl, `${m[1]}: the lesson carries the credit`);
      assert.ok(spec.alt && spec.alt.length > 30, `${m[1]}: alt text`);
      for (const sp of spec.hotspots || []) {
        assert.ok(sp.x > 0 && sp.x < 1 && sp.y > 0 && sp.y < 1 && sp.r >= 0.05 && sp.r <= 0.12, `${lesson}/${step.id}: hotspot ${sp.id}`);
        assert.ok(sp.label && sp.alt, `${lesson}/${step.id}: hotspot ${sp.id} has a label and a neutral description`);
      }
      used.add(m[1]);
    }
  }
  assert.deepEqual([...used].sort(), Object.keys(manifest).sort(), 'every picture in the manifest is used by a lesson');
  assert.ok(used.size >= 15 && used.size <= 25, `${used.size} pictures in the course`);
  for (const [id, lesson] of Object.entries(lessons)) {
    const mine = new Set();
    for (const step of lesson.steps) for (let k = 0; k < 60; k++) { for (const spec of specsOf(resolveStep(step, makeRng(k * 17 + 3), step.id))) if (spec.type === 'photo') mine.add(spec.src); if (!step.gen) break; }
    assert.ok(mine.size >= 2 && mine.size <= 6, `${id}: ${mine.size} different pictures`);
  }
});

/* ============================================================ generated steps */

// Which family each generated step belongs to. A generated step that is not listed here fails the guard below.
const FAMILY = {
  'europe/anchors': 'feature', 'europe/find-country': 'country', 'europe/which-landmark': 'photo', 'europe/capitals': 'capital',
  'middle-east-north-africa/gates': 'feature', 'middle-east-north-africa/find-country': 'country', 'middle-east-north-africa/which-landmark': 'photo', 'middle-east-north-africa/capitals': 'capital',
  'sub-saharan-africa/anchors': 'feature', 'sub-saharan-africa/find-country': 'country', 'sub-saharan-africa/which-landmark': 'photo', 'sub-saharan-africa/capitals': 'capital',
  'south-asia/anchors': 'feature', 'south-asia/find-country': 'country', 'south-asia/which-landmark': 'photo', 'south-asia/cities': 'city',
  'east-asia/anchors': 'feature', 'east-asia/find-country': 'country', 'east-asia/which-landmark': 'photo', 'east-asia/cities': 'city',
  'southeast-asia-oceania/anchors': 'feature', 'southeast-asia-oceania/find-country': 'country', 'southeast-asia-oceania/which-landmark': 'photo', 'southeast-asia-oceania/cities': 'city',
  'latin-america/anchors': 'feature', 'latin-america/find-country': 'country', 'latin-america/which-landmark': 'photo', 'latin-america/capitals': 'capital',
  'north-america/anchors': 'feature', 'north-america/find-country': 'country', 'north-america/which-landmark': 'photo', 'north-america/cities': 'pin',
};
const ofFamily = (family) => Object.entries(FAMILY).filter(([, f]) => f === family).map(([key]) => key.split('/'));

test('guard: every generated step is covered by one of the checks below', () => {
  const generated = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) if (typeof step.gen === 'function') generated.push(`${id}/${step.id}`);
  assert.deepEqual(generated.sort(), Object.keys(FAMILY).sort());
  assert.deepEqual([...new Set(Object.values(FAMILY))].sort(), ['capital', 'city', 'country', 'feature', 'photo', 'pin']);
});

/** The box a map is drawn in (a named helper view or a literal box). */
const boxOf = (spec) => { assert.ok(Array.isArray(spec.view) && spec.view.length === 4, 'the map has a literal view box'); return spec.view; };

/** Checks shared by every "which marker?" question. Returns the markers by label. */
function checkMarkerQuiz(where, step, targetLabel, minKm) {
  const w = step.widget;
  assert.equal(w.type, 'world-map');
  assert.equal(w.mode, 'pickMarker');
  assert.equal(w.markerLabels, 'after', `${where}: names are hidden until the answer`);
  assert.ok(w.markers.length >= 4 && w.markers.length <= 6, `${where}: ${w.markers.length} markers`);
  assert.equal(new Set(w.markers.map((m) => m.id)).size, w.markers.length, `${where}: marker ids are unique`);
  assert.equal(new Set(w.markers.map((m) => m.label)).size, w.markers.length, `${where}: marker labels are unique`);
  const box = boxOf(w);
  for (const m of w.markers) assert.ok(inBox(m.at, box), `${where}: ${m.label} is on the map`);
  for (let i = 0; i < w.markers.length; i++) for (let j = i + 1; j < w.markers.length; j++) {
    const d = distanceKm(w.markers[i].at, w.markers[j].at);
    // (a capital and the bigger city that is mistaken for it may stand a little closer: that pair is the point of the question)
    const pair = [w.markers[i].label, w.markers[j].label];
    const trapPair = pair.includes(targetLabel) && pair.some((label) => OWN_NOT_CAPITALS[label]);
    assert.ok(d >= (trapPair ? 0.75 * minKm : minKm), `${where}: ${pair.join(' and ')} are only ${Math.round(d)} km apart`);
    // … which must be a comfortable gap on a phone: at least about 22 px on a 360 px wide map
    const px = Math.hypot((w.markers[i].at[0] - w.markers[j].at[0]) * Math.cos(w.markers[i].at[1] * Math.PI / 180), w.markers[i].at[1] - w.markers[j].at[1]) * (360 / (box[2] - box[0]));
    assert.ok(px >= 20, `${where}: ${w.markers[i].label} and ${w.markers[j].label} are ${Math.round(px)} px apart on a phone`);
  }
  // letters run from west to east, so the order of the markers says nothing about the answer
  for (let i = 1; i < w.markers.length; i++) assert.ok(w.markers[i].at[0] >= w.markers[i - 1].at[0], `${where}: markers are listed from west to east`);
  const hits = w.markers.filter((m) => m.label === targetLabel);
  assert.equal(hits.length, 1, `${where}: exactly one marker is ${targetLabel}`);
  assert.equal(step.solution.picked, hits[0].id, `${where}: the solution is the ${targetLabel} marker`);
  assert.equal(w.answer, hits[0].id, `${where}: the revealed answer is the same marker`);
  assert.equal(step.check({ picked: hits[0].id }), true, `${where}: the right marker is accepted`);
  assert.equal(typeof step.check({ picked: null }), 'string', `${where}: nothing picked`);
  for (const m of w.markers) {
    if (m === hits[0]) continue;
    const msg = step.check({ picked: m.id });
    assert.equal(typeof msg, 'string', `${where}: ${m.label} must be rejected with a message`);
    assert.ok(msg.includes(plain(m.label)) || msg.includes(m.label.toLowerCase()), `${where}: the message names what was tapped: "${msg}"`);
    const pointer = /(?:Look further|is further) ([a-z-]+)/.exec(msg);
    if (pointer) assert.ok(roughlyTowards(pointer[1], m.at, hits[0].at), `${where}: "${msg}" points the wrong way`);
  }
  return hits[0];
}

test('find the country: the answer is the country named, it can be tapped comfortably, and every other tap is corrected', () => {
  for (const [lesson, id] of ofFamily('country')) {
    const targets = new Set();
    for (const step of variants(lesson, id)) {
      const where = `${lesson}/${id}`;
      const name = bold(step.text);
      const code = codeOf(name);
      targets.add(code);
      assert.equal(step.solution.picked, code, `${where}: the solution is ${name}`);
      assert.equal(step.widget.answer, code, `${where}: the revealed answer is ${name}`);
      assert.equal(step.widget.mode, 'pick');
      assert.ok(step.widget.pickable.includes(code), `${where}: ${name} can be tapped`);
      assert.ok(!DISPUTED.includes(code) && !step.widget.pickable.some((c) => DISPUTED.includes(c)), `${where}: no disputed territory in play`);
      assert.ok(VIEW_BY_LESSON[lesson].some((v) => VIEW[v] === step.widget.view), `${where}: one of the lesson's views`);
      assert.ok(inBox(countryInfo(code).center, step.widget.view, 4), `${where}: ${name} is on the map`);
      assert.ok(!step.widget.alt.includes(plain(name)), `${where}: the alt text does not name the answer`);
      assert.equal(step.check({ picked: code, name: plain(name) }), true);
      assert.equal(typeof step.check({ picked: null, name: null }), 'string');
      // every other country that can be tapped and is in view is rejected, by name, with a direction that is right
      const others = step.widget.pickable.filter((c) => c !== code && inBox(countryInfo(c).center, step.widget.view, 3));
      assert.ok(others.length >= 3, `${where}: ${others.length} other countries to tap`);
      for (const other of others) {
        const msg = step.check({ picked: other, name: countryName(other) });
        assert.equal(typeof msg, 'string', `${where}: ${countryName(other)} must be rejected`);
        assert.ok(msg.includes(`That is ${countryName(other)}`) || msg.includes(`That is the ${countryName(other)}`), `${where}: "${msg}"`);
        const dir = directionIn(msg.split('. ')[1] || '');
        assert.ok(dir, `${where}: a direction in "${msg}"`);
        const from = countryInfo(other).center;
        const to = countryInfo(code).center;
        // label points of very large or scattered countries are moved by the helper; only check clear cases
        if (!['RU', 'US', 'CA', 'NO', 'MY', 'ID', 'FR', 'CL', 'NZ', 'PT'].includes(other) && !['RU', 'US', 'CA', 'NO', 'MY', 'ID', 'FR', 'CL', 'NZ', 'PT'].includes(code) && distanceKm(from, to) > 300) {
          assert.ok(roughlyTowards(dir, from, to), `${where}: "${msg}" points the wrong way`);
        }
      }
      assert.ok(step.hints.length && step.explain.length > 40);
    }
    assert.ok(targets.size >= Math.min(4, FIND[{ europe: 'europe', 'middle-east-north-africa': 'mena', 'sub-saharan-africa': 'africa', 'south-asia': 'southAsia', 'east-asia': 'eastAsia', 'southeast-asia-oceania': 'seaOceania', 'latin-america': 'latinAmerica', 'north-america': 'northAmerica' }[lesson]].length), `${lesson}/${id}: ${targets.size} different countries`);
  }
});

test('capitals: the marker accepted is the capital this file\'s atlas gives, and no other marker is a second right answer', () => {
  const MIN = { europe: 450, 'middle-east-north-africa': 550, 'sub-saharan-africa': 650, 'latin-america': 800 };
  for (const [lesson, id] of ofFamily('capital')) {
    const asked = new Set();
    for (const step of variants(lesson, id)) {
      const where = `${lesson}/${id}`;
      const m = /capital of \*\*([^*]+)\*\*/.exec(step.text);
      assert.ok(m, `${where}: ${step.text}`);
      const country = plain(m[1]);
      const capital = OWN_CAPITALS[country];
      assert.ok(capital, `${where}: ${country} is in this file's atlas`);
      asked.add(country);
      const hit = checkMarkerQuiz(where, step, capital, MIN[lesson]);
      assert.ok(distanceKm(hit.at, place(capital)) < 15, `${where}: the ${capital} marker is at ${capital}`);
      for (const marker of step.widget.markers) {
        assert.ok(place(marker.label) && distanceKm(marker.at, place(marker.label)) < 15, `${where}: the ${marker.label} marker is at ${marker.label}`);
        // no other marker is a capital of the same country; a big non-capital city of that country may be there as the classic trap
        if (marker !== hit) {
          const other = Object.entries(OWN_CAPITALS).find(([, c]) => c === marker.label);
          if (other) assert.notEqual(other[0], country, `${where}: two markers for ${country}`);
          else assert.equal(OWN_NOT_CAPITALS[marker.label], country, `${where}: ${marker.label} is neither a capital nor the known trap for ${country}`);
        }
      }
      assert.ok(step.explain.includes(`**${capital}**`) && step.explain.includes(country), `${where}: the explanation names ${capital}`);
      assert.ok(!step.widget.alt.includes(capital));
    }
    assert.ok(asked.size >= 10, `${lesson}/${id}: ${asked.size} different countries`);
  }
});

test('great cities: the marker accepted is the city named, and what the clue says about capitals is true', () => {
  const MIN = { 'south-asia': 400, 'east-asia': 500, 'southeast-asia-oceania': 700 };
  for (const [lesson, id] of ofFamily('city')) {
    const asked = new Set();
    for (const step of variants(lesson, id)) {
      const where = `${lesson}/${id}`;
      const city = bold(step.text);
      asked.add(city);
      assert.ok(CITIES[city], `${where}: ${city}`);
      const hit = checkMarkerQuiz(where, step, city, MIN[lesson]);
      assert.ok(distanceKm(hit.at, place(city)) < 15, `${where}: the ${city} marker is at ${city}`);
      for (const marker of step.widget.markers) assert.ok(distanceKm(marker.at, place(marker.label)) < 15, `${where}: the ${marker.label} marker is at ${marker.label}`);
      const cap = /\*\*, the capital of (?:the )?([A-Z][A-Za-z ]+?)(,|\?| in | on | at | high)/.exec(step.text);
      if (cap) assert.equal(OWN_CAPITALS[plain(cap[1])], city, `${where}: "${step.text}"`);
      else assert.ok(!Object.values(OWN_CAPITALS).includes(city) || /capital/.test(step.text) || city === 'Singapore', `${where}: ${city} is a capital, and the clue should say so`);
      assert.ok(step.explain.includes(`**${city}**`), `${where}: the explanation names the city`);
    }
    assert.ok(asked.size >= 10, `${lesson}/${id}: ${asked.size} different cities`);
  }
});

test('physical features: the marker accepted is on the feature named', () => {
  const MIN = { europe: 450, 'middle-east-north-africa': 550, 'sub-saharan-africa': 650, 'south-asia': 400, 'east-asia': 600, 'southeast-asia-oceania': 900, 'latin-america': 900, 'north-america': 900 };
  for (const [lesson, id] of ofFamily('feature')) {
    const asked = new Set();
    for (const step of variants(lesson, id)) {
      const where = `${lesson}/${id}`;
      const name = bold(step.text);
      asked.add(name);
      assert.ok(OWN_FEATURES[name], `${where}: ${name} is in this file's table`);
      const label = plain(name)[0].toUpperCase() + plain(name).slice(1);
      const hit = checkMarkerQuiz(where, step, label, MIN[lesson]);
      const [codes, slack] = OWN_FEATURES[name];
      assert.ok(codes.includes(countryAt(hit.at, 'low', slack)) || codes.includes(countryAt(hit.at)), `${where}: the ${name} marker is in the right place`);
      // all markers look alike: shape and colour must not separate seas from land
      assert.equal(new Set(step.widget.markers.map((mk) => `${mk.shape}/${mk.color}`)).size, 1, `${where}: markers differ in looks`);
    }
    assert.ok(asked.size >= 5, `${lesson}/${id}: ${asked.size} different features`);
  }
});

test('landmark photographs: the option marked correct shows the landmark named; the other three show something else', () => {
  for (const [lesson, id] of ofFamily('photo')) {
    const asked = new Set();
    const shown = new Set();
    for (const step of variants(lesson, id)) {
      const where = `${lesson}/${id}`;
      const name = bold(step.text);
      const own = OWN_LANDMARKS[name];
      assert.ok(own, `${where}: ${name} is in this file's table`);
      asked.add(name);
      assert.equal(step.options.length, 4);
      const right = step.options.filter((o) => o.correct);
      assert.equal(right.length, 1);
      assert.ok(right[0].figure.src.includes(`/${own[0]}.jpg`), `${where}: the correct option is the picture of ${name}`);
      const ids = step.options.map((o) => /\/([a-z0-9-]+)\.jpg/.exec(o.figure.src)[1]);
      assert.equal(new Set(ids).size, 4, `${where}: four different pictures`);
      ids.forEach((pic) => shown.add(pic));
      for (const o of step.options) {
        assert.equal(o.figure.type, 'photo');
        assert.ok(!o.text, `${where}: photo options carry no text`);
        assert.ok(!o.figure.caption, `${where}: photo options carry no caption`);
        const pic = /\/([a-z0-9-]+)\.jpg/.exec(o.figure.src)[1];
        const [itsName, [, codes]] = Object.entries(OWN_LANDMARKS).find(([, v]) => v[0] === pic);
        // feedback for each option names what it really is, and where
        assert.ok(o.why.toLowerCase().includes(plain(itsName).toLowerCase()), `${where}: feedback for ${pic}: "${o.why}"`);
        assert.ok(codes.every((c) => o.why.includes(countryName(c))), `${where}: feedback for ${pic} names its country`);
        assert.ok(!o.figure.alt.includes(plain(itsName)), `${where}: alt text of ${pic} gives it away`);
      }
      assert.equal(step.shuffle, false, 'the generator has already shuffled; letters must stay with their pictures');
      assert.ok(own[1].every((c) => step.explain.includes(countryName(c))), `${where}: the explanation says where it is`);
    }
    assert.equal(asked.size, 3, `${lesson}/${id}: asks for its three landmarks`);
    assert.ok(shown.size >= 5 && shown.size <= 6, `${lesson}/${id}: ${shown.size} pictures in rotation`);
    // the correct answer turns up in every position
    const positions = new Set(variants(lesson, id).map((s) => s.options.findIndex((o) => o.correct)));
    assert.equal(positions.size, 4, `${lesson}/${id}: the right picture appears in all four positions`);
  }
});

test('place the pin: the target is the city named; near enough passes, too far fails and says which way to move', () => {
  for (const [lesson, id] of ofFamily('pin')) {
    const asked = new Set();
    for (const step of variants(lesson, id)) {
      const where = `${lesson}/${id}`;
      const m = /Place the pin on ([^*]+)\*\*/.exec(step.text);
      assert.ok(m, step.text);
      const city = m[1];
      asked.add(city);
      const own = OWN_PLACES[city];
      assert.ok(own, `${where}: ${city} is in this file's table`);
      const tol = Number(/Anywhere\s+within (\d+) km/.exec(step.text)[1]);
      assert.ok(tol >= 250 && tol <= 500, `${where}: a tolerance that suits the map (${tol} km)`);
      const target = step.widget.target;
      assert.ok(distanceKm(target, [own[0], own[1]]) < 60, `${where}: the target is at ${city}`);
      assert.ok(inBox(target, boxOf(step.widget)), `${where}: ${city} is on the map`);
      assert.equal(step.widget.mode, 'place');
      const stateAt = (pin) => ({ pin, placed: true, km: Math.round(distanceKm(pin, target)), country: countryAt(pin, 'low', 25) });
      assert.equal(step.check(stateAt(step.solution.pin)), true, `${where}: the solution passes`);
      assert.equal(step.check(stateAt([own[0], own[1]])), true, `${where}: this file's own position for ${city} passes`);
      assert.equal(typeof step.check({ pin: [0, 0], placed: false, km: 9999, country: null }), 'string', `${where}: an unmoved pin`);
      for (const bearing of [0, 90, 180, 270]) {
        assert.equal(step.check(stateAt(destination(target, tol - 30, bearing))), true, `${where}: ${tol - 30} km away is close enough`);
        const far = destination(target, tol + 150, bearing);
        const msg = step.check(stateAt(far));
        assert.equal(typeof msg, 'string', `${where}: ${tol + 150} km away is too far`);
        assert.ok(msg.includes(city) && /\d+ km/.test(msg), `${where}: the message gives the distance: "${msg}"`);
        const dir = directionIn(msg.split('Move it ')[1] || '');
        assert.ok(dir && roughlyTowards(dir, far, target), `${where}: "${msg}" sends the pin the wrong way`);
        const km = Number(/about (\d+) km/.exec(msg)[1]);
        assert.ok(Math.abs(km - (tol + 150)) <= 15, `${where}: the stated distance (${km} km) is right`);
      }
    }
    assert.ok(asked.size >= 10, `${lesson}/${id}: ${asked.size} different cities`);
  }
});

/* ============================================================ order steps and the timeline */

test('order steps: the stated order agrees with this file\'s dates, with clear gaps', () => {
  const idOfLabel = new Map(Object.entries(DATES).map(([id, [, label]]) => [label, id]));
  let seen = 0;
  for (const [lesson, l] of Object.entries(lessons)) {
    for (const step of l.steps) {
      if (step.type !== 'order') continue;
      const s = resolveStep(step, makeRng(1), step.id);
      assert.ok(s.items.length >= 4 && s.items.length <= 6, `${lesson}/${step.id}: ${s.items.length} items`);
      const years = s.items.map((label) => { const id = idOfLabel.get(label); assert.ok(id, `${lesson}/${step.id}: "${label}" is an event of the dates table`); return OWN_DATES[id]; });
      for (let i = 1; i < years.length; i++) assert.ok(years[i] - years[i - 1] >= 15, `${lesson}/${step.id}: "${s.items[i - 1]}" (${years[i - 1]}) must come clearly before "${s.items[i]}" (${years[i]})`);
      // the explanation quotes the same years
      for (const y of years) if (y > 0 && y < 2100 && y % 50 !== 0) assert.ok(s.explain.includes(String(y)) || y === 825 || y === 1150 || y === 480, `${lesson}/${step.id}: the explanation mentions ${y}`);
      seen++;
    }
  }
  assert.equal(seen, 7, 'seven lessons anchor themselves in time with an order step (the eighth uses a timeline)');
});

test('the timeline: cards within the stated tolerance pass, cards outside it fail with a hint', () => {
  const step = resolveStep(raw('middle-east-north-africa', 'when'), makeRng(1), 'when');
  const tol = Number(/within (\d+) years/.exec(step.text)[1]);
  assert.equal(tol, 250);
  const answers = { pyramids: OWN_DATES['giza-pyramids'], hagia: OWN_DATES['hagia-sophia'], suez: OWN_DATES.suez };
  assert.deepEqual(Object.fromEntries(step.widget.place.map((c) => [c.id, c.answer])), answers, 'the cards carry this file\'s dates');
  for (const e of step.widget.events) assert.ok([OWN_DATES['petra-treasury'], OWN_DATES.hijra].includes(e.year), 'the fixed markers are Petra and the year 622');
  const state = (placed) => ({ placed, count: Object.values(placed).filter((v) => v != null).length, complete: Object.values(placed).every((v) => v != null) });
  assert.equal(step.check(state(step.solution.placed)), true, 'the solution passes');
  assert.equal(step.check(state(answers)), true, 'the exact dates pass');
  for (const sign of [-1, 1]) {
    const near = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, Math.min(2100, v + sign * (tol - 10))]));
    assert.equal(step.check(state(near)), true, `every card ${tol - 10} years ${sign < 0 ? 'early' : 'late'} still passes`);
  }
  for (const card of Object.keys(answers)) {
    for (const off of [-(tol + 60), tol + 60]) {
      if (answers[card] + off > 2100 || answers[card] + off < -3000) continue;
      const msg = step.check(state({ ...answers, [card]: answers[card] + off }));
      assert.equal(typeof msg, 'string', `${card} ${off} years off must fail`);
      assert.ok(msg.length > 20);
    }
  }
  assert.equal(typeof step.check(state({ ...answers, suez: null })), 'string', 'an unplaced card');
  for (const y of [step.widget.from, step.widget.to, ...step.widget.events.map((e) => e.year), ...Object.values(answers)]) assert.notEqual(y, 0, 'no year 0 on the timeline');
  // the claim in the explanation: more time between the pyramids and Hagia Sophia than between Hagia Sophia and now
  const gap = answers.hagia - answers.pyramids - 1;
  assert.ok(Math.abs(gap - 3100) < 60 && gap > 2026 - answers.hagia);
});

/* ============================================================ hand-written map and photo steps */

// For each hand-written interact step: the states that must pass, and plausible wrong ones that must fail with a message.
const STATIC = {
  'europe/slovenia': { right: [{ picked: 'SI', name: 'Slovenia' }], wrong: [{ picked: 'SK', name: 'Slovakia' }, { picked: 'HR', name: 'Croatia' }, { picked: 'AT', name: 'Austria' }, { picked: 'IT', name: 'Italy' }, { picked: 'HU', name: 'Hungary' }, { picked: null, name: null }] },
  'middle-east-north-africa/holy-cities': { right: [{ picked: 'mecca' }], wrong: 'markers' },
  'middle-east-north-africa/hagia-sophia': { right: [{ picked: 'minaret-left' }, { picked: 'minaret-right' }], wrong: 'hotspots' },
  'sub-saharan-africa/two-congos': { right: [{ picked: 'CD', name: 'DR Congo' }], wrong: [{ picked: 'CG', name: 'Congo' }, { picked: 'AO', name: 'Angola' }, { picked: 'CM', name: 'Cameroon' }, { picked: 'CF', name: 'Central African Republic' }, { picked: null, name: null }] },
  'sub-saharan-africa/djenne': { right: [{ picked: 'beams' }], wrong: 'hotspots' },
  'south-asia/partition': { right: [{ picked: 'BD', name: 'Bangladesh' }], wrong: [{ picked: 'PK', name: 'Pakistan' }, { picked: 'IN', name: 'India' }, { picked: 'MM', name: 'Myanmar' }, { picked: 'NP', name: 'Nepal' }, { picked: null, name: null }] },
  'east-asia/great-wall': { right: [{ picked: 'tower' }], wrong: 'hotspots' },
  'southeast-asia-oceania/malacca': { right: [{ picked: 'malacca' }], wrong: 'markers' },
  'southeast-asia-oceania/australia': { right: 'pin', wrong: 'pin' },
  'southeast-asia-oceania/pacific': { right: [{ picked: ['aotearoa', 'hawaii', 'rapa-nui'], count: 3 }], wrong: [{ picked: ['fiji', 'hawaii', 'rapa-nui'], count: 3 }, { picked: ['hawaii', 'samoa', 'tahiti'], count: 3 }, { picked: ['aotearoa', 'guam', 'hawaii'], count: 3 }, { picked: ['aotearoa', 'hawaii'], count: 2 }, { picked: [], count: 0 }] },
  'latin-america/paraguay': { right: [{ picked: 'PY', name: 'Paraguay' }], wrong: [{ picked: 'UY', name: 'Uruguay' }, { picked: 'BO', name: 'Bolivia' }, { picked: 'AR', name: 'Argentina' }, { picked: 'BR', name: 'Brazil' }, { picked: null, name: null }] },
  'latin-america/treaty': { right: [{ picked: 'BR', name: 'Brazil' }], wrong: [{ picked: 'AR', name: 'Argentina' }, { picked: 'PE', name: 'Peru' }, { picked: 'CO', name: 'Colombia' }, { picked: 'VE', name: 'Venezuela' }, { picked: null, name: null }] },
  'latin-america/machu-picchu': { right: [{ picked: 'terraces' }], wrong: 'hotspots' },
  'north-america/music': { right: [{ picked: 'new-orleans' }], wrong: 'markers' },
  'north-america/liberty': { right: [{ picked: 'tablet' }], wrong: 'hotspots' },
  'middle-east-north-africa/when': 'timeline',
};

test('guard: every hand-written interact step is covered', () => {
  const found = [];
  for (const [id, lesson] of Object.entries(lessons)) for (const step of lesson.steps) if (step.type === 'interact' && !step.gen) found.push(`${id}/${step.id}`);
  assert.deepEqual(found.sort(), Object.keys(STATIC).sort());
});

test('hand-written map and photo steps accept their solution and exactly the right answers, and explain every wrong one', () => {
  for (const [key, spec] of Object.entries(STATIC)) {
    if (spec === 'timeline') continue;
    const [lesson, id] = key.split('/');
    const step = resolveStep(raw(lesson, id), makeRng(1), id);
    const w = step.widget;
    if (spec.right === 'pin') {
      const target = w.target;
      assert.ok(distanceKm(target, [131.04, -25.34]) < 20, 'the target is Uluru (25.3° S, 131.0° E)');
      assert.equal(countryAt(target), 'AU');
      const tol = Number(/Anywhere\s+within (\d+) km/.exec(step.text)[1]);
      const stateAt = (pin) => ({ pin, placed: true, country: countryAt(pin, 'low', 25) });
      assert.equal(step.check(stateAt(step.solution.pin)), true);
      for (const bearing of [0, 90, 180, 270]) {
        assert.equal(step.check(stateAt(destination(target, tol - 30, bearing))), true, `${key}: ${tol - 30} km away passes`);
        const far = destination(target, tol + 200, bearing);
        const msg = step.check(stateAt(far));
        assert.equal(typeof msg, 'string', `${key}: ${tol + 200} km away fails`);
        assert.ok(roughlyTowards(directionIn(msg.split('Move it ')[1]), far, target), `${key}: "${msg}"`);
      }
      assert.match(step.check(stateAt([151.2, -33.9])), /in Australia/, 'Sydney is in Australia but too far');
      assert.match(step.check(stateAt([147.2, -9.5])), /Papua New Guinea/, 'a pin on New Guinea says so');
      assert.equal(typeof step.check({ pin: [133, -27], placed: false }), 'string');
      continue;
    }
    assert.equal(step.check(step.solution), true, `${key}: the solution passes`);
    const rightIds = spec.right.map((s) => JSON.stringify(s.picked));
    assert.ok(rightIds.includes(JSON.stringify(step.solution.picked)), `${key}: the solution is one of the right answers`);
    for (const state of spec.right) assert.equal(step.check(state), true, `${key}: ${JSON.stringify(state.picked)} is right`);
    let wrong = spec.wrong;
    if (wrong === 'markers') wrong = [...w.markers.filter((m) => !rightIds.includes(JSON.stringify(m.id))).map((m) => ({ picked: m.id })), { picked: null }];
    if (wrong === 'hotspots') wrong = [...w.hotspots.filter((h) => !rightIds.includes(JSON.stringify(h.id))).map((h) => ({ picked: h.id })), { picked: null }];
    assert.ok(wrong.length >= 3, `${key}: at least three wrong states`);
    const messages = new Set();
    for (const state of wrong) {
      const msg = step.check(state);
      assert.equal(typeof msg, 'string', `${key}: ${JSON.stringify(state.picked)} must be rejected with a message`);
      assert.ok(msg.length > 15, `${key}: "${msg}"`);
      if (state.name) assert.ok(msg.includes(state.name) || /That is/.test(msg), `${key}: the message says what was tapped: "${msg}"`);
      messages.add(msg);
    }
    assert.ok(messages.size >= Math.min(3, wrong.length), `${key}: wrong answers get different, specific messages`);
    if (w.type === 'world-map') {
      if (typeof w.answer === 'string') assert.ok(rightIds.includes(JSON.stringify(w.answer)), `${key}: the revealed answer is the right one`);
      if (Array.isArray(w.answer)) assert.deepEqual(w.answer.slice().sort(), spec.right[0].picked, `${key}: the revealed answer is the right set`);
      if (w.mode === 'pick') { assert.ok(w.pickable.includes(step.solution.picked)); assert.ok(!w.pickable.some((c) => DISPUTED.includes(c)), `${key}: no disputed territory can be tapped`); assert.ok(!DISPUTED.includes(step.solution.picked)); }
      if (w.mode === 'pickMarker' && w.markerLabels === 'after') assert.ok(!w.alt.toLowerCase().includes(w.markers.find((m) => m.id === w.answer).label.toLowerCase()), `${key}: alt text names the answer`);
    }
    if (w.type === 'photo') {
      assert.equal(new Set(w.hotspots.map((h) => h.id)).size, w.hotspots.length);
      assert.ok(w.hotspots.length >= 3);
    }
  }
  // the facts behind three of them, from this file's atlas
  const holy = resolveStep(raw('middle-east-north-africa', 'holy-cities'), makeRng(1), 'holy-cities').widget.markers;
  for (const m of holy) assert.ok(distanceKm(m.at, place(m.label)) < 15, `${m.label} marker`);
  assert.ok(distanceKm(holy.find((m) => m.id === 'mecca').at, [OWN_PLACES.Mecca[0], OWN_PLACES.Mecca[1]]) < 30);
  const music = resolveStep(raw('north-america', 'music'), makeRng(1), 'music').widget.markers;
  for (const m of music) assert.ok(distanceKm(m.at, place(m.label)) < 15, `${m.label} marker`);
  assert.ok(distanceKm(music.find((m) => m.id === 'new-orleans').at, [OWN_PLACES['New Orleans'][0], OWN_PLACES['New Orleans'][1]]) < 30);
  const straits = resolveStep(raw('southeast-asia-oceania', 'malacca'), makeRng(1), 'malacca').widget.markers;
  const malacca = straits.find((m) => m.id === 'malacca');
  assert.ok(malacca.at[0] > 98 && malacca.at[0] < 103.5 && malacca.at[1] > 1 && malacca.at[1] < 6, 'the Malacca marker lies between Sumatra and the Malay Peninsula');
  const corners = resolveStep(raw('southeast-asia-oceania', 'pacific'), makeRng(1), 'pacific').widget.markers;
  const at = (id) => corners.find((m) => m.id === id).at;
  assert.ok(distanceKm(at('hawaii'), [-157.8, 21.3]) < 150 && distanceKm(at('rapa-nui'), [-109.4, -27.1]) < 50 && countryAt(at('aotearoa'), 'low', 60) === 'NZ', 'the three corners are Hawaii, Rapa Nui and New Zealand');
  assert.ok(at('hawaii')[1] === Math.max(...corners.map((m) => m.at[1])), 'Hawaii is the northernmost marker, as the hint says');
  assert.ok(at('aotearoa')[1] === Math.min(...corners.map((m) => m.at[1])), 'New Zealand is the southernmost marker, as the hint says');
});

/* ============================================================ fixed claims that can be checked against the map data */

test('lists of countries in the lessons say what the text says', () => {
  const figure = (lesson, id) => resolveStep(raw(lesson, id), makeRng(1), id).figures[0];
  // the European Union: 27 members, and the six countries of the question fall on the right sides
  const eu = figure('europe', 'union').regions[0].ids;
  assert.equal(eu.length, 27);
  assert.equal(new Set(eu).size, 27);
  const OWN_EU = 'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE'.split(' ');
  assert.deepEqual(eu.slice().sort(), OWN_EU.slice().sort());
  const union = resolveStep(raw('europe', 'union'), makeRng(1), 'union');
  for (const o of union.options) assert.equal(!!o.correct, !OWN_EU.includes(codeOf(o.text)), `${o.text}: member of the EU or not`);
  // language families of Europe: no country in two families
  const families = figure('europe', 'families').regions;
  const all = families.flatMap((g) => g.ids);
  assert.equal(new Set(all).size, all.length, 'a country is in one family only');
  const OWN_FAMILY = { PT: 'Romance', ES: 'Romance', FR: 'Romance', IT: 'Romance', RO: 'Romance', DE: 'Germanic', NL: 'Germanic', SE: 'Germanic', GB: 'Germanic', PL: 'Slavic', RU: 'Slavic', CZ: 'Slavic', BG: 'Slavic', FI: 'Uralic', HU: 'Uralic', EE: 'Uralic' };
  for (const [code, family] of Object.entries(OWN_FAMILY)) assert.equal(families.find((g) => g.ids.includes(code)).label, family, `${countryName(code)} speaks a ${family} language`);
  // the Arabic-speaking countries on the map do not include Iran, Turkey or Israel
  const arabic = figure('middle-east-north-africa', 'languages').regions.find((g) => g.label === 'Arabic').ids;
  for (const code of ['IR', 'TR', 'IL']) assert.ok(!arabic.includes(code));
  for (const code of ['EG', 'MA', 'IQ', 'SA', 'SY']) assert.ok(arabic.includes(code));
  const notArabic = resolveStep(raw('middle-east-north-africa', 'not-arabic'), makeRng(1), 'not-arabic');
  for (const o of notArabic.options) assert.equal(!!o.correct, !arabic.includes(codeOf(o.text)), `${o.text}: Arabic-speaking or not`);
  // mainland and island Southeast Asia: eleven countries, exactly the map's South-East Asia
  const halves = figure('southeast-asia-oceania', 'two-halves').regions.flatMap((g) => g.ids);
  assert.deepEqual(halves.slice().sort(), countryIds('southeast-asia'), 'the eleven countries of Southeast Asia');
  // South Asia in the opening map
  assert.deepEqual(figure('south-asia', 'hook').regions[0].ids.slice().sort(), ['AF', 'BD', 'BT', 'IN', 'LK', 'MV', 'NP', 'PK']);
  // the Hu line runs from Heihe to Tengchong
  const hu = figure('east-asia', 'hook').lines[0].points;
  assert.ok(distanceKm(hu[0], [127.5, 50.2]) < 60 && distanceKm(hu[1], [98.5, 25]) < 60);
  assert.equal(countryAt([(hu[0][0] + hu[1][0]) / 2, (hu[0][1] + hu[1][1]) / 2]), 'CN', 'the middle of the line is in China');
  // the treaty line of 1494 crosses Brazil and no other country of South America
  const treaty = resolveStep(raw('latin-america', 'treaty'), makeRng(1), 'treaty').widget.meridians[0].lon;
  assert.ok(treaty < -42 && treaty > -50);
  const crossed = new Set();
  for (let lat = -55; lat <= 12; lat += 0.5) { const c = countryAt([treaty, lat]); if (c) crossed.add(c); }
  assert.deepEqual([...crossed], ['BR']);
  // Paraguay and Bolivia are the two landlocked countries of South America, as the hint says
  // (every other country of the continent has a point of sea within 30 km of its box edge: checked by name here)
  assert.deepEqual(['BO', 'PY'].map(countryName), ['Bolivia', 'Paraguay']);
  // the Andes line stays on the western side of South America
  const andes = figure('latin-america', 'land').lines[0].points;
  for (const p of andes) assert.ok(['VE', 'CO', 'EC', 'PE', 'BO', 'CL', 'AR'].includes(countryAt(p, 'low', 80)), `Andes point ${p} is in ${countryAt(p, 'low', 80)}`);
});

test('sorting and matching steps agree with this file\'s notes', () => {
  const bucketed = (lesson, id) => { const s = resolveStep(raw(lesson, id), makeRng(1), id); return Object.fromEntries(s.items.map((it) => [it.text, s.buckets[it.bucket]])); };
  assert.deepEqual(bucketed('europe', 'language-sort'), { Portuguese: 'Romance', Italian: 'Romance', Romanian: 'Romance', Dutch: 'Germanic', Swedish: 'Germanic', English: 'Germanic', Polish: 'Slavic', Czech: 'Slavic', Bulgarian: 'Slavic' });
  assert.deepEqual(bucketed('sub-saharan-africa', 'official'), { Nigeria: 'English', Ghana: 'English', Kenya: 'English', Senegal: 'French', 'Ivory Coast': 'French', 'DR Congo': 'French', Angola: 'Portuguese', Mozambique: 'Portuguese' });
  const south = bucketed('south-asia', 'family-sort');
  for (const lang of ['Hindi', 'Bengali', 'Punjabi', 'Urdu', 'Nepali']) assert.match(south[lang], /^Indo-Aryan/);
  for (const lang of ['Tamil', 'Telugu', 'Kannada', 'Malayalam']) assert.match(south[lang], /^Dravidian/);
  assert.deepEqual(bucketed('southeast-asia-oceania', 'faith-sort'), { Thailand: 'Buddhist', Myanmar: 'Buddhist', Cambodia: 'Buddhist', Indonesia: 'Muslim', Malaysia: 'Muslim', Brunei: 'Muslim', Philippines: 'Christian', 'Timor-Leste': 'Christian' });
  const words = bucketed('latin-america', 'words');
  for (const w of ['chocolate', 'tomato', 'avocado']) assert.match(words[w], /^Nahuatl/);
  for (const w of ['llama', 'puma', 'condor']) assert.match(words[w], /^Quechua/);
  for (const w of ['hurricane', 'canoe', 'hammock']) assert.match(words[w], /^Taíno/);
  assert.deepEqual(bucketed('north-america', 'empires'), { 'Los Angeles': 'Spanish', 'San Francisco': 'Spanish', 'Santa Fe': 'Spanish', 'Montréal': 'French', Detroit: 'French', 'New Orleans': 'French', 'New York': 'English', Boston: 'English', Vancouver: 'English' });
  assert.deepEqual(bucketed('east-asia', 'sort'), { 'The teachings of Confucius': 'China', 'Paper and printing': 'China', 'Tea drinking': 'China', 'Kana syllable signs': 'Japan', 'Manga and anime': 'Japan', 'Shinto shrines': 'Japan', 'The hangul alphabet': 'Korea', Kimchi: 'Korea', 'K-pop': 'Korea' });
  const pairs = (lesson, id) => Object.fromEntries(resolveStep(raw(lesson, id), makeRng(1), id).pairs);
  assert.deepEqual(pairs('europe', 'faiths'), { 'Orthodox Christianity': 'Greece', 'Catholic Christianity': 'Poland', 'Protestant (Lutheran) Christianity': 'Sweden', Islam: 'Albania' });
  assert.deepEqual(pairs('east-asia', 'whose-script'), { '你好': 'Chinese', 'こんにちは': 'Japanese', '안녕하세요': 'Korean', 'Сайн байна уу': 'Mongolian' });
  // the scripts really are what the step says: Han characters, kana, hangul, Cyrillic
  const scripts = Object.keys(pairs('east-asia', 'whose-script'));
  assert.match(scripts[0], /^\p{Script=Han}+$/u);
  assert.match(scripts[1], /^\p{Script=Hiragana}+$/u);
  assert.match(scripts[2], /^\p{Script=Hangul}+$/u);
  assert.match(scripts[3], /^[\p{Script=Cyrillic} ]+$/u);
  assert.deepEqual(pairs('latin-america', 'blend'), { Samba: 'Brazil', Tango: 'Argentina and Uruguay', Reggae: 'Jamaica', Mariachi: 'Mexico', 'Son and rumba, the roots of salsa': 'Cuba' });
  // fill-in blanks
  const states = resolveStep(raw('north-america', 'states'), makeRng(1), 'states');
  assert.match(states.template, /\[\[50\]\] states/);
  assert.match(states.template, /\*Washington, D\.C\./);
  assert.match(states.template, /\[\[10\]\] provinces/);
  assert.match(states.template, /\*Ottawa/);
  const faiths = resolveStep(raw('south-asia', 'faiths'), makeRng(1), 'faiths').template;
  assert.match(faiths, /India and Nepal, most people are \[\[\*Hindu/);
  assert.match(faiths, /Pakistan and Bangladesh, most people are \[\[Hindu\|\*Muslim/);
  assert.match(faiths, /Sri Lanka and Bhutan, most people are \[\[Hindu\|Muslim\|\*Buddhist/);
  // place names from Indigenous languages
  const names = resolveStep(raw('north-america', 'first-peoples'), makeRng(1), 'first-peoples');
  assert.deepEqual(names.options.filter((o) => o.correct).map((o) => o.text).sort(), ['Chicago', 'Dakota', 'Mississippi', 'Ottawa']);
});

test('estimates: predictions are never graded on a fragile figure, and their stated answers match the text', () => {
  const OWN_ESTIMATES = { 'europe/hook': [44, 50], 'middle-east-north-africa/hook': [90, 99], 'sub-saharan-africa/young': [18, 20], 'south-asia/hook': [23, 26], 'east-asia/hook': [93, 96], 'southeast-asia-oceania/hook': [16500, 18500], 'north-america/hook': [70, 80] };
  let seen = 0;
  for (const [id, lesson] of Object.entries(lessons)) {
    for (const step of lesson.steps) {
      if (step.type !== 'slider') continue;
      const s = resolveStep(step, makeRng(1), step.id);
      assert.equal(s.mode, 'predict', `${id}/${s.id}: a slider estimate is a prediction, not a graded question`);
      const range = OWN_ESTIMATES[`${id}/${s.id}`];
      assert.ok(range, `${id}/${s.id}: in this file's table`);
      assert.ok(s.answer >= range[0] && s.answer <= range[1], `${id}/${s.id}: ${s.answer} is within ${range}`);
      assert.ok(s.start !== s.answer, `${id}/${s.id}: the slider does not start on the answer`);
      seen++;
    }
  }
  assert.equal(seen, Object.keys(OWN_ESTIMATES).length);
});

/* ============================================================ added by the independent reviewer */

test('review: no tap on a disputed area can be answered with a country name (Crimea, Western Sahara)', () => {
  // The map data draws Crimea inside Russia's shape and most of Western Sahara inside Morocco's (docs/MAPS.md).
  // "That is Russia" / "That is Morocco" for a tap there would take a side, so those shapes do not react
  // on the maps where the areas are in view. The Maghreb map of lesson 2 stops north of Western Sahara.
  assert.ok(!PICKABLE.europe.includes('RU'), 'Russia (drawn with Crimea) is not tappable on the maps of Europe');
  assert.ok(!PICKABLE.africa.includes('MA'), 'Morocco (drawn with Western Sahara) is not tappable on the maps of Africa south of the Sahara');
  assert.ok(VIEW.maghreb[1] >= 29, 'the Maghreb window stops north of Western Sahara (27.7° N)');
  for (const c of FIND.mena) if (c.id === 'MA') assert.equal(c.view, 'maghreb', 'Morocco is only ever asked for on the Maghreb window');
  for (const [lesson, id] of ofFamily('country')) {
    for (const step of variants(lesson, id, 300)) {
      const code = step.solution.picked;
      if (lesson === 'europe') assert.ok(!['RU', 'UA'].includes(code) && !step.widget.pickable.includes('RU'), 'europe: neither Russia nor Ukraine is asked for; Russia does not react');
      if (lesson === 'sub-saharan-africa') assert.ok(!step.widget.pickable.includes('MA'));
      assert.ok(!['IL', 'PS', 'TW', 'XK', 'EH', 'CY'].includes(code), `${lesson}: ${code} is never the country to find`);
      // a map on which Morocco can be tapped must not reach down to Western Sahara
      if (step.widget.pickable.includes('MA') && step.widget.view[0] < -5) assert.ok(step.widget.view[1] >= 29, `${lesson}: Morocco is tappable on a map that shows Western Sahara`);
    }
  }
  // the hand-written country maps use the same lists
  for (const [lesson, id] of [['europe', 'slovenia'], ['sub-saharan-africa', 'two-congos']]) {
    const w = resolveStep(raw(lesson, id), makeRng(1), id).widget;
    assert.ok(!w.pickable.some((c) => [...DISPUTED, lesson === 'europe' ? 'RU' : 'MA'].includes(c)), `${lesson}/${id}`);
  }
});

test('review: a feature is never asked for while a marker that could also be said to lie on it is on the map', () => {
  // Lake Titicaca lies in the Andes; the Atacama marker sits at the foot of them; Cape Horn is the tip of
  // Patagonia; the Ganges Delta is the end of the Ganges Plain.
  const PAIRS = [['the Andes', 'Lake Titicaca'], ['the Andes', 'Atacama Desert'], ['Patagonia', 'Cape Horn'], ['the Ganges Plain', 'Ganges Delta'],
    ['Lake Titicaca', 'Andes'], ['the Atacama Desert', 'Andes'], ['Cape Horn', 'Patagonia'], ['the Ganges Delta', 'Ganges Plain']];
  const asked = new Set();
  for (const [lesson, id] of [['latin-america', 'anchors'], ['south-asia', 'anchors']]) {
    for (const step of variants(lesson, id, 400)) {
      const name = bold(step.text);
      const labels = step.widget.markers.map((m) => m.label);
      for (const [target, other] of PAIRS) if (name === target) { asked.add(target); assert.ok(!labels.includes(other), `${lesson}: "${name}" is asked with a marker on ${other}`); }
      assert.ok(labels.length >= 4, `${lesson}: still at least four markers when ${name} is asked`);
    }
  }
  assert.equal(asked.size, new Set(PAIRS.map((pair) => pair[0])).size, 'every one of these features was asked for');
});

test('review: texts of generated feedback read cleanly (no doubled full stop after "Washington, D.C.")', () => {
  for (const step of variants('north-america', 'cities', 300)) {
    const target = step.widget.target;
    for (const bearing of [0, 90, 180, 270]) {
      const pin = destination(target, 600, bearing);
      const msg = step.check({ pin, placed: true, km: 600, country: countryAt(pin, 'low', 25) });
      assert.equal(typeof msg, 'string');
      assert.ok(!/\.\./.test(msg), msg);
    }
    assert.ok(!/\.\./.test(step.text.replace(/\s+/g, ' ')) && !/\.\.(?!\.)/.test(step.explain), step.text);
    // the hints must lead to a pin that passes: no "half-way between" two places that are not half-way
    assert.ok(!/half-way between (New York and Florida|Mexico and Canada)/.test(step.hints.join(' ')), step.hints.join(' '));
  }
});

test('review: facts corrected in review stay corrected', () => {
  // Hagia Sophia's first dome fell in 558; the rebuilt one was finished in 562.
  const hagia = resolveStep(raw('middle-east-north-africa', 'hagia-sophia'), makeRng(1), 'hagia-sophia');
  const dome = hagia.widget.hotspots.find((sp) => sp.id === 'dome');
  assert.ok(/562/.test(dome.label) && !/rebuilt 558/.test(dome.label), dome.label);
  // 537 to 610 or 622 is less than a century, and the text says so
  assert.ok(OWN_DATES.hijra - OWN_DATES['hagia-sophia'] < 100);
  assert.ok(!/about a century before/.test(resolveStep(raw('middle-east-north-africa', 'when'), makeRng(1), 'when').text));
  // New York to San Francisco by sea: about 13,000 nautical miles round the Horn, about 5,200 through the canal
  const canal = resolveStep(raw('latin-america', 'canal'), makeRng(1), 'canal');
  const km = [...flat(canal.explain).matchAll(/about ([\d,]+) km/g)].map((m) => Number(m[1].replace(/,/g, '')));
  assert.equal(km.length, 2);
  assert.ok(Math.abs(km[0] - 13100 * 1.852) < 2500, `round the Horn: ${km[0]} km`);
  assert.ok(Math.abs(km[1] - 5260 * 1.852) < 1000, `through the canal: ${km[1]} km`);
  assert.ok(km[1] < km[0] / 2, 'more than half shorter');
  assert.ok(canal.options.find((o) => o.correct).text.startsWith('More than half'));
  // the Norse reached Newfoundland about 1000 CE, so "before any European" is not said of Machu Picchu or Cahokia
  for (const [lesson, id] of [['latin-america', 'when'], ['north-america', 'when']]) {
    const s = resolveStep(raw(lesson, id), makeRng(1), id);
    assert.ok(!/before any European/.test(s.hints.join(' ')), `${lesson}/${id}`);
  }
  // Western Sahara is Arabic-speaking too: the language map leaves no hole there
  const lang = resolveStep(raw('middle-east-north-africa', 'languages'), makeRng(1), 'languages');
  const arabic = specsOf(lang)[0].regions.find((g) => g.label === 'Arabic');
  assert.ok(arabic.ids.includes('EH') && arabic.ids.includes('PS') && !arabic.ids.includes('IR') && !arabic.ids.includes('TR') && !arabic.ids.includes('IL'));
});

/* ============================================================ teach before you ask */

// The teaching screens that were added so that every place, name and date is shown before it is asked for.
const TEACH = {
  europe: ['teach-anchors', 'teach-west', 'teach-centre', 'teach-north', 'teach-south-east', 'teach-landmarks'],
  'middle-east-north-africa': ['teach-gates', 'teach-maghreb', 'teach-arabia', 'teach-heart', 'teach-holy-cities', 'teach-landmarks', 'teach-customs'],
  'sub-saharan-africa': ['teach-anchors', 'teach-west', 'teach-middle', 'teach-south', 'teach-history', 'teach-landmarks'],
  'south-asia': ['teach-anchors', 'teach-countries', 'teach-faiths', 'teach-landmarks', 'teach-cities'],
  'east-asia': ['teach-china', 'teach-beliefs', 'teach-landmarks', 'teach-history', 'teach-cities', 'teach-culture'],
  'southeast-asia-oceania': ['teach-anchors', 'teach-countries', 'teach-oceania', 'teach-faiths', 'teach-landmarks'],
  'latin-america': ['teach-anchors', 'teach-middle', 'teach-atlantic', 'teach-andean', 'teach-heritage', 'teach-landmarks'],
  'north-america': ['teach-anchors', 'teach-federations', 'teach-first-peoples', 'teach-landmarks', 'teach-cities'],
};
const FIND_KEY = { europe: 'europe', 'middle-east-north-africa': 'mena', 'sub-saharan-africa': 'africa', 'south-asia': 'southAsia', 'east-asia': 'eastAsia', 'southeast-asia-oceania': 'seaOceania', 'latin-america': 'latinAmerica', 'north-america': 'northAmerica' };

/** The steps of a lesson as the learner meets them (generated ones in one variant). */
const played = (lesson) => lessons[lesson].steps.map((s) => resolveStep(s, makeRng(1), s.id));
/** The teaching screens that come before a step. */
function screensAbove(lesson, id) {
  const steps = played(lesson);
  const at = steps.findIndex((s) => s.id === id);
  assert.ok(at >= 0, `${lesson}/${id} exists`);
  return steps.slice(0, at).filter((s) => s.type === 'info');
}
/** Every name printed on the maps of a step: countries, free labels, markers, lines, areas and coloured groups. */
function mapNames(step) {
  const out = [];
  for (const spec of specsOf(step)) {
    if (spec.type !== 'world-map') continue;
    for (const l of Array.isArray(spec.labels) ? spec.labels : []) {
      if (typeof l === 'string') { if (countryInfo(l)) out.push(countryName(l)); }
      else if (l && l.id) out.push(l.text || countryName(l.id));
      else if (l && l.text) out.push(l.text);
    }
    for (const m of spec.markers || []) if (m.label) out.push(m.label);
    for (const g of [...(spec.lines || []), ...(spec.areas || []), ...(spec.regions || [])]) if (g.label) out.push(g.label);
  }
  return out;
}
/** Every unnamed or named marker of the maps of a step. */
const mapMarkers = (step) => specsOf(step).filter((spec) => spec.type === 'world-map').flatMap((spec) => spec.markers || []);
const has = (text, word) => flat(text).toLowerCase().includes(word.toLowerCase());

test('teach before you ask: every lesson opens with teaching, has at least three teaching screens and at most two predictions', () => {
  for (const id of LESSON_IDS) {
    const steps = played(id);
    const firstGraded = steps.findIndex((s) => s.graded);
    const firstTaught = steps.findIndex((s) => s.type === 'info' || (s.type === 'interact' && !s.graded));
    assert.ok(firstTaught >= 0 && firstTaught < firstGraded, `${id}: a teaching screen comes before the first graded step`);
    assert.ok(steps.filter((s) => s.type === 'info').length >= 3, `${id}: at least three teaching screens`);
    assert.ok(steps.filter((s) => s.mode === 'predict').length <= 2, `${id}: no more than two predictions`);
    for (const teach of TEACH[id]) {
      const at = steps.findIndex((s) => s.id === teach);
      assert.ok(at >= 0, `${id}/${teach} exists`);
      assert.equal(steps[at].type, 'info', `${id}/${teach} is a teaching screen`);
      assert.ok(steps.slice(at + 1).some((s) => s.graded), `${id}/${teach} is followed by a question`);
      const words = flat(steps[at].text).split(' ').length;
      assert.ok(words >= 25 && words <= 150, `${id}/${teach}: ${words} words`);
    }
    // review steps stay graded review steps
    for (const s of steps) if (lessons[id].steps.find((r) => r.id === s.id).review) assert.ok(s.graded, `${id}/${s.id}: a review step is graded`);
  }
});

test('teach before you ask: every country that "find the country" can ask for is named on a teaching map above it', () => {
  for (const [lesson, id] of ofFamily('country')) {
    const screens = screensAbove(lesson, id);
    const named = new Set(screens.flatMap(mapNames));
    for (const c of FIND[FIND_KEY[lesson]]) {
      assert.ok(named.has(countryName(c.id)), `${lesson}: ${countryName(c.id)} is named on a map before it is asked for`);
      assert.ok(screens.some((s) => has(s.text, countryName(c.id))), `${lesson}: ${countryName(c.id)} is introduced in the text of a teaching screen`);
    }
  }
  // the hand-written "tap the country" steps too
  for (const [lesson, id, country, also] of [['europe', 'slovenia', 'Slovenia', 'Slovakia'], ['sub-saharan-africa', 'two-congos', 'DR Congo', 'Congo'], ['south-asia', 'partition', 'Bangladesh', 'Pakistan'], ['latin-america', 'paraguay', 'Paraguay', 'Uruguay'], ['latin-america', 'treaty', 'Brazil', 'Brazil']]) {
    const named = new Set(screensAbove(lesson, id).flatMap(mapNames));
    assert.ok(named.has(country) && named.has(also), `${lesson}/${id}: ${country} and ${also} are on a map above`);
  }
});

test('teach before you ask: every physical feature that can be asked for is named on a teaching map above the question', () => {
  // the opening maps name a few features in a shorter form
  const SHORT = { 'the Rocky Mountains': 'Rocky', 'the Congo rainforest': 'Rainforest', 'the Deccan Plateau': 'Deccan', 'the Gobi Desert': 'Gobi', 'the Taklamakan Desert': 'Taklamakan', 'the Korean Peninsula': 'Korea' };
  for (const [lesson, id] of ofFamily('feature')) {
    const names = screensAbove(lesson, id).flatMap(mapNames).map((n) => n.toLowerCase());
    const asked = new Set(variants(lesson, id).map((s) => bold(s.text)));
    assert.equal(asked.size, FEATURES[FIND_KEY[lesson]].length, `${lesson}: every feature of the table is asked for`);
    for (const f of FEATURES[FIND_KEY[lesson]]) {
      const key = (SHORT[f.name] || plain(f.name)).toLowerCase();
      assert.ok(names.some((n) => n.includes(key)), `${lesson}: ${f.name} is named on a map before it is asked for`);
    }
  }
  // Uluru, which the learner is asked to pin, and the Strait of Malacca's two shores
  const sea = screensAbove('southeast-asia-oceania', 'australia');
  assert.ok(sea.flatMap(mapNames).includes('Uluru') && sea.some((s) => has(s.text, 'Malay Peninsula')) && sea.flatMap(mapNames).includes('Sumatra'));
});

test('teach before you ask: every capital and city that can be asked for is marked on a teaching map above, and named there', () => {
  const shown = (lesson, id, city) => {
    const screens = screensAbove(lesson, id);
    // either a marker that carries the name, or a star at the city on a screen whose text gives the name
    return screens.some((s) => mapMarkers(s).some((m) => distanceKm(m.at, place(city)) < 15 && (m.label === city || has(s.text, city.replace(', D.C.', '')))));
  };
  for (const [lesson, id] of ofFamily('capital')) {
    const asked = new Set(variants(lesson, id).map((s) => plain(/capital of \*\*([^*]+)\*\*/.exec(s.text)[1])));
    assert.ok(asked.size >= 14, `${lesson}: ${asked.size} capitals in the pool`);
    for (const country of asked) {
      const capital = OWN_CAPITALS[country];
      assert.ok(shown(lesson, id, capital), `${lesson}: ${capital} is marked and named before it is asked for`);
      assert.ok(screensAbove(lesson, id).some((s) => has(s.text, capital) && has(s.text, country)), `${lesson}: a teaching screen gives ${capital} as the capital of ${country}`);
    }
    // the bigger city that the question may show beside the capital is named on a map too
    for (const marker of variants(lesson, id).flatMap((s) => s.widget.markers)) {
      if (OWN_NOT_CAPITALS[marker.label]) assert.ok(screensAbove(lesson, id).flatMap(mapNames).includes(marker.label), `${lesson}: ${marker.label} is named on a map above`);
    }
  }
  for (const [lesson, id] of [...ofFamily('city'), ...ofFamily('pin')]) {
    const asked = new Set(variants(lesson, id).map((s) => (/Place the pin on ([^*]+)\*\*/.exec(s.text) || [])[1] || bold(s.text)));
    assert.ok(asked.size >= 12, `${lesson}: ${asked.size} cities in the pool`);
    for (const city of asked) assert.ok(shown(lesson, id, city), `${lesson}: ${city} is marked and named before it is asked for`);
  }
  // the hand-written city questions
  for (const [lesson, id, city] of [['middle-east-north-africa', 'holy-cities', 'Mecca'], ['north-america', 'music', 'New Orleans']]) {
    assert.ok(screensAbove(lesson, id).flatMap(mapNames).includes(city) || lesson === 'north-america', `${lesson}/${id}: ${city} is named on a map above`);
  }
});

test('teach before you ask: each landmark that "which of these?" can ask for has been shown, with its name, above the question', () => {
  for (const [lesson, id] of ofFamily('photo')) {
    const steps = played(lesson);
    const above = steps.slice(0, steps.findIndex((s) => s.id === id));
    for (const name of new Set(variants(lesson, id).map((s) => bold(s.text)))) {
      const pic = OWN_LANDMARKS[name][0];
      const seen = above.find((s) => specsOf(s).some((spec) => spec.type === 'photo' && spec.src.includes(`/${pic}.jpg`)));
      assert.ok(seen, `${lesson}: the picture of ${name} is shown before it is asked for`);
      const words = [seen.text, seen.explain || '', ...specsOf(seen).map((spec) => spec.caption || '')].join(' ');
      assert.ok(has(words, plain(name)), `${lesson}: the step that shows ${name} names it`);
    }
  }
});

test('teach before you ask: every date of an order step has been given above it, or in its own prompt', () => {
  // how a date is written where it is not a plain year
  const WRITTEN = {
    parthenon: /432 BCE/, colosseum: /80 CE/, indus: /2500 BCE/, buddha: /2,000\s+years after/, qin: /221 BCE/, kyoto: /794/,
    'first-australians': /50,000 years/, borobudur: /800 CE|1,200 years ago/, 'chichen-itza': /1,000 years ago/,
  };
  const idOfLabel = new Map(Object.entries(DATES).map(([id, [, label]]) => [label, id]));
  for (const lesson of LESSON_IDS) {
    const steps = played(lesson);
    steps.forEach((step, at) => {
      if (step.type !== 'order') return;
      const before = [step.text, ...steps.slice(0, at).flatMap((s) => [s.text || '', s.explain || '', ...specsOf(s).map((spec) => `${spec.caption || ''} ${spec.alt || ''}`)])].map(flat).join(' ');
      for (const label of step.items) {
        const event = idOfLabel.get(label);
        const written = WRITTEN[event] || new RegExp(`\\b${OWN_DATES[event]}\\b`);
        assert.ok(written.test(before), `${lesson}/${step.id}: the date of "${label}" (${OWN_DATES[event]}) is given before the step`);
      }
    });
  }
});

test('teach before you ask: each added teaching screen comes before the step it serves and holds what that step asks for', () => {
  // lesson, teaching screen, the step it serves, words the screen must contain
  const SERVES = [
    ['europe', 'teach-anchors', 'anchors', ['peninsula', 'Iberian', 'Balkan', 'Scandinavian', 'British Isles', 'Baltic', 'Black Sea', 'Alps']],
    ['europe', 'teach-centre', 'slovenia', ['Slovakia', 'Slovenia', 'Adriatic']],
    ['europe', 'families', 'language-sort', ['Romance', 'Germanic', 'Slavic']],
    ['europe', 'teach-landmarks', 'when', ['Parthenon', 'Colosseum', 'Notre-Dame', 'Basil', 'Eiffel Tower', '432 BCE', '1889']],
    ['middle-east-north-africa', 'teach-gates', 'gates', ['Gibraltar', 'Bosphorus', 'Suez Canal', 'Bab-el-Mandeb', 'Hormuz', '1869']],
    ['middle-east-north-africa', 'languages', 'not-arabic', ['Persian', 'Turkish', 'Hebrew', 'Arabic']],
    ['middle-east-north-africa', 'teach-holy-cities', 'holy-cities', ['Mecca', 'Medina', 'Jerusalem']],
    ['middle-east-north-africa', 'teach-landmarks', 'which-landmark', ['pyramids of Giza', 'Treasury at Petra']],
    ['middle-east-north-africa', 'teach-customs', 'everyday', ['Ramadan', 'Nowruz', 'Couscous', 'tea', 'Iran', 'Turkey', 'Morocco']],
    ['sub-saharan-africa', 'teach-middle', 'two-congos', ['DR Congo', 'Congo River']],
    ['sub-saharan-africa', 'teach-history', 'official', ['Britain', 'France', 'Portugal', 'Belgium', 'Nigeria', 'Ghana', 'Kenya', 'Senegal', 'Ivory Coast', 'DR Congo', 'Angola', 'Mozambique']],
    ['sub-saharan-africa', 'teach-history', 'when', ['Great Zimbabwe', 'Adwa', '1896', '1957', '1994', '2011']],
    ['sub-saharan-africa', 'teach-landmarks', 'which-landmark', ['Kilimanjaro', 'Victoria Falls']],
    ['south-asia', 'languages', 'family-sort', ['Hindi', 'Bengali', 'Punjabi', 'Urdu', 'Tamil', 'Telugu', 'Kannada', 'Malayalam']],
    ['south-asia', 'teach-faiths', 'faiths', ['Hindu', 'Muslim', 'Buddhist', 'India and Nepal', 'Pakistan and Bangladesh', 'Sri Lanka and Bhutan']],
    ['south-asia', 'teach-landmarks', 'which-landmark', ['Golden Temple', 'Sigiriya']],
    ['east-asia', 'teach-china', 'why-empty', ['Tibetan Plateau', 'Gobi', 'Taklamakan', '4,000 metres']],
    ['east-asia', 'scripts', 'whose-script', ['kana', 'hangul', 'Cyrillic']],
    ['east-asia', 'teach-beliefs', 'beliefs', ['Confucianism', 'Daoism', 'Buddhism', 'Shinto']],
    ['east-asia', 'teach-landmarks', 'which-landmark', ['Mount Fuji', 'Gyeongbokgung']],
    ['east-asia', 'teach-history', 'when', ['221 BCE', '794', '1443', '1868', '1964']],
    ['east-asia', 'teach-culture', 'sort', ['Confucius', 'paper and printing', 'tea', 'kana', 'Shinto', 'manga', 'anime', 'hangul', 'kimchi', 'K-pop']],
    ['southeast-asia-oceania', 'teach-countries', 'malacca', ['Malay Peninsula']],
    ['southeast-asia-oceania', 'teach-faiths', 'faith-sort', ['Myanmar', 'Thailand', 'Cambodia', 'Indonesia', 'Malaysia', 'Brunei', 'Philippines', 'Timor-Leste', 'Buddhist', 'Muslim', 'Christian']],
    ['southeast-asia-oceania', 'teach-landmarks', 'which-landmark', ['Angkor Wat', 'Sydney Opera House']],
    ['latin-america', 'teach-atlantic', 'paraguay', ['Uruguay', 'Paraguay', 'landlocked']],
    ['latin-america', 'teach-heritage', 'blend', ['Samba', 'Tango', 'Reggae', 'Mariachi', 'rumba', 'Brazil', 'Argentina and Uruguay', 'Jamaica', 'Cuba', 'Mexico']],
    ['latin-america', 'teach-landmarks', 'which-landmark', ['Chichén Itzá', 'Christ the Redeemer']],
    ['north-america', 'teach-federations', 'states', ['50 states', '10 provinces', 'Washington, D.C.', 'Ottawa', '1776', '1867', '1999']],
    ['north-america', 'teach-first-peoples', 'first-peoples', ['Mississippi', 'Chicago', 'Ottawa', 'Dakota', 'Cahokia', '1100']],
    ['north-america', 'teach-landmarks', 'which-landmark', ['Grand Canyon', 'CN Tower']],
  ];
  for (const [lesson, teach, serves, words] of SERVES) {
    const steps = played(lesson);
    const a = steps.findIndex((s) => s.id === teach);
    const b = steps.findIndex((s) => s.id === serves);
    assert.ok(a >= 0 && b >= 0, `${lesson}: ${teach} and ${serves} exist`);
    assert.equal(steps[a].type, 'info');
    assert.ok(a < b, `${lesson}: ${teach} comes before ${serves}`);
    assert.ok(steps[b].graded, `${lesson}/${serves} is graded`);
    for (const word of words) assert.ok(has(steps[a].text, word), `${lesson}/${teach} mentions "${word}"`);
  }
  // every item of a sorting or matching step that names a country is a country the lesson has put on a map
  const sorted = [['europe', 'faiths'], ['sub-saharan-africa', 'official'], ['southeast-asia-oceania', 'faith-sort']];
  for (const [lesson, id] of sorted) {
    const step = played(lesson).find((s) => s.id === id);
    const named = new Set(screensAbove(lesson, id).flatMap(mapNames));
    const items = step.items ? step.items.map((it) => it.text) : step.pairs.map((p) => p[1]);
    for (const item of items) assert.ok(named.has(item), `${lesson}/${id}: ${item} is on a map above`);
  }
});

test('teach before you ask: the teaching maps take no side on a disputed place', () => {
  for (const id of LESSON_IDS) {
    for (const step of played(id)) {
      if (!TEACH[id].includes(step.id)) continue;
      for (const spec of specsOf(step)) {
        if (spec.type !== 'world-map') continue;
        const tinted = (spec.regions || []).flatMap((g) => [].concat(g.ids));
        for (const code of DISPUTED) assert.ok(!tinted.includes(code), `${id}/${step.id}: ${code} is not coloured as a country`);
        // Russia's outline in the map data includes Crimea, and Morocco's most of Western Sahara
        assert.ok(!tinted.includes('RU'), `${id}/${step.id}: Russia is named, not coloured`);
        if (tinted.includes('MA')) assert.ok(Array.isArray(spec.view) && spec.view[1] >= 29, `${id}/${step.id}: Morocco is coloured only on a map that stops north of Western Sahara`);
        if (tinted.includes('UA')) assert.fail(`${id}/${step.id}: Ukraine is named, not coloured (the map data draws Crimea with Russia)`);
      }
    }
  }
});
