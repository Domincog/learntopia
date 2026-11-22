// The World at a Glance: shared facts and small helpers.
//
// Every place, size and date that more than one step uses lives in a table here, so that maps,
// generated questions and feedback are all built from the same record and a correction is made once.
// Coordinates are always [longitude, latitude]: east and north positive.
// tests/world-geography-course.test.mjs keeps its own, independently typed copy of the key facts.
import { countryInfo, countryName, distanceKm } from '../../../src/widgets/world-map.js';

/* ------------------------------------------------------------------ small tools */

/** 'a', 'a and b', 'a, b and c'. */
export function listText(items) {
  const a = items.map(String);
  if (a.length <= 1) return a.join('');
  return `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
}

/** 12345 → '12,345'. */
export const thousands = (n) => Math.round(n).toLocaleString('en-US');

/** A distance for feedback: 1234 → 'about 1,200 km', 87 → 'about 90 km'. */
export function roughKm(km) {
  const step = km >= 1000 ? 100 : km >= 200 ? 50 : 10;
  return `about ${thousands(Math.max(step, Math.round(km / step) * step))} km`;
}

const COMPASS = ['east', 'north-east', 'north', 'north-west', 'west', 'south-west', 'south', 'south-east'];

/** In which compass direction `to` lies as seen from `from` (eight points; good enough for feedback). */
export function compass(from, to) {
  let dLon = to[0] - from[0];
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  const dLat = to[1] - from[1];
  const midLat = ((from[1] + to[1]) / 2) * (Math.PI / 180);
  const angle = Math.atan2(dLat, dLon * Math.cos(midLat)) * (180 / Math.PI);
  return COMPASS[((Math.round(angle / 45) % 8) + 8) % 8];
}

/**
 * The same as it reads on a flat world map centred on longitude `centre`. The page is cut on the far side of the globe, and
 * the direction is never taken across that cut: on the usual map Asia is to the east of Alaska, although the shorter
 * way round the globe is westwards.
 */
export function compassOnPage(from, to, centre = 0) {
  const x = (lon) => ((((lon - centre + 180) % 360) + 360) % 360) - 180;
  const midLat = ((from[1] + to[1]) / 2) * (Math.PI / 180);
  const angle = Math.atan2(to[1] - from[1], (x(to[0]) - x(from[0])) * Math.cos(midLat)) * (180 / Math.PI);
  return COMPASS[((Math.round(angle / 45) % 8) + 8) % 8];
}

/** Feedback for a pin that missed: "about 1,200 km too far south-west". */
export function howFarOff(pin, target) {
  return `${roughKm(distanceKm(pin, target))} too far ${compass(target, pin)}`;
}

/** 34.6 → '35° N', -33.9 → '34° S'. */
export const latText = (lat) => (Math.round(lat) === 0 ? '0°' : `${Math.abs(Math.round(lat))}° ${lat > 0 ? 'N' : 'S'}`);
/** 151.2 → '151° E', -58.4 → '58° W'. */
export const lonText = (lon) => (Math.round(lon) === 0 || Math.abs(Math.round(lon)) === 180 ? `${Math.abs(Math.round(lon))}°` : `${Math.abs(Math.round(lon))}° ${lon > 0 ? 'E' : 'W'}`);
export const coordText = ([lon, lat]) => `${latText(lat)}, ${lonText(lon)}`;

/** A country's name as it reads inside a sentence: 'the Netherlands', 'the United States', but 'France'. */
const NEEDS_THE = /^(United |Netherlands$|Philippines$|Bahamas$|Maldives$|Comoros$|Seychelles$|Central African Republic$|Dominican Republic$|French Southern Lands$|British Indian Ocean Territory$)|Islands$/;
export const theName = (name) => (NEEDS_THE.test(name) ? `the ${name}` : name);
/** The same from a country code. */
export const theCountry = (code) => theName(countryName(code));
/** First letter in upper case, for the start of a sentence. */
export const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/* ------------------------------------------------------------------ continents */

/**
 * The seven continents of the usual English-language convention, largest first.
 * area: millions of km², rounded (mainstream reference figures; sources differ in the second digit).
 * pin: a point well inside, used as a solution and for "try further north" hints.
 */
export const CONTINENTS = [
  { id: 'asia', name: 'Asia', area: 44.6, pin: [90, 45], color: 'green',
    where: 'It is the biggest landmass on the map: east of Europe and north of the Indian Ocean.',
    fact: 'Asia is the largest continent: about 30% of all the land, and home to about six in every ten people.' },
  { id: 'africa', name: 'Africa', area: 30.4, pin: [20, 8], color: 'orange',
    where: 'It sits in the middle of the map, south of Europe, with the Equator running across it.',
    fact: 'Africa is the second-largest continent, and the only one that reaches from the northern temperate zone, across the Equator, to the southern temperate zone.' },
  { id: 'north-america', name: 'North America', area: 24.7, pin: [-100, 45], color: 'red',
    where: 'It is the northern landmass on the left of the map, between the Pacific and the Atlantic.',
    fact: 'North America runs from the Arctic to the narrow Isthmus of Panama. Greenland, Central America and the Caribbean islands are counted with it.' },
  { id: 'south-america', name: 'South America', area: 17.8, pin: [-58, -12], color: 'yellow',
    where: 'It is the tapering landmass in the lower left, joined to North America by a narrow neck of land.',
    fact: 'South America lies mostly south of the Equator and further east than many people expect: almost all of it is east of Florida.' },
  { id: 'antarctica', name: 'Antarctica', area: 14.2, pin: [60, -80], color: 'teal',
    where: 'It surrounds the South Pole, so on this map it is stretched along the bottom edge.',
    fact: 'Antarctica surrounds the South Pole. It is larger than Europe, almost entirely covered by ice, and has no countries and no permanent residents.' },
  { id: 'europe', name: 'Europe', area: 10.2, pin: [15, 50], color: 'violet',
    where: 'It is the ragged western end of the biggest landmass, north of Africa.',
    fact: 'Europe is the western end of the great landmass of Eurasia. It counts as a continent by a tradition that goes back to the ancient Greeks.' },
  { id: 'oceania', name: 'Oceania', area: 8.5, pin: [134, -25], color: 'pink',
    where: 'Australia is its largest land: the island continent in the lower right of the map.',
    fact: 'Australia is the smallest continent. Together with New Zealand, New Guinea and the islands of the Pacific, the wider region is called Oceania.' },
];
export const continent = (id) => CONTINENTS.find((c) => c.id === id);

/** Countries that lie on two continents, with the continents they touch (larger share first). */
export const STRADDLERS = {
  RU: ['asia', 'europe'], TR: ['asia', 'europe'], KZ: ['asia', 'europe'], AZ: ['asia', 'europe'], GE: ['asia', 'europe'],
  EG: ['africa', 'asia'], ID: ['asia', 'oceania'],
};

/**
 * The continent(s) a pin stands on, given the country the map reports and the pin itself.
 * Returns a list, because the lines between continents are conventions: a pin in a country that
 * straddles two of them counts for either, except in Russia, where the two halves are far apart
 * (west of 55° E is Europe, east of 65° E is Asia, the Urals in between count for both).
 */
export function continentsAt(code, pin) {
  if (!code) return [];
  const [lon] = pin || [0, 0];
  if (code === 'RU') return lon < 0 || lon > 65 ? ['asia'] : lon < 55 ? ['europe'] : ['asia', 'europe'];
  if (code === 'FR' && lon < -40) return ['south-america'];          // French Guiana is drawn as part of France
  if (STRADDLERS[code]) return STRADDLERS[code];
  const info = countryInfo(code);
  return info && info.continent ? [info.continent] : [];
}

/** Well-known countries that lie wholly on one continent, for "which of these is in …?" questions. */
export const CONTINENT_COUNTRIES = {
  africa: ['NG', 'ZA', 'KE', 'ET', 'MA', 'DZ', 'GH', 'TZ', 'CD', 'SN', 'MG', 'AO', 'SD', 'ML'],
  asia: ['CN', 'IN', 'JP', 'SA', 'IR', 'TH', 'VN', 'PK', 'MN', 'KR', 'PH', 'BD', 'IQ', 'UZ', 'NP'],
  europe: ['FR', 'DE', 'IT', 'ES', 'GB', 'PL', 'SE', 'NO', 'GR', 'PT', 'UA', 'NL', 'IE', 'FI', 'RO'],
  'north-america': ['US', 'CA', 'MX', 'CU', 'GT', 'JM', 'HN', 'CR', 'HT'],
  'south-america': ['BR', 'AR', 'CL', 'PE', 'CO', 'VE', 'BO', 'EC', 'UY', 'PY'],
  oceania: ['AU', 'NZ', 'PG', 'FJ'],
};

/* ---------------------------------------------------------------------- oceans */

/**
 * The five oceans, largest first. area: millions of km² (NOAA figures, rounded); share: % of all ocean.
 * spots: points in open water, far from any other ocean, where a quiz marker can stand.
 */
export const OCEANS = [
  { id: 'pacific', name: 'Pacific Ocean', area: 169, share: 46, spots: [[-140, 8], [-125, -28], [172, 28]],
    fact: 'The Pacific is the largest and deepest ocean: about a third of the whole planet, and bigger than all the land put together.' },
  { id: 'atlantic', name: 'Atlantic Ocean', area: 85, share: 24, spots: [[-42, 30], [-18, -22]],
    fact: 'The Atlantic is the long, S-shaped ocean between the Americas on one side and Europe and Africa on the other.' },
  { id: 'indian', name: 'Indian Ocean', area: 71, share: 20, spots: [[76, -20], [88, -32]],
    fact: 'The Indian Ocean lies between Africa, Asia and Australia. Most of it is south of the Equator.' },
  { id: 'southern', name: 'Southern Ocean', area: 22, share: 6, spots: [[-125, -65], [100, -62]],
    fact: 'The Southern Ocean is the ring of cold water around Antarctica, south of 60° S. It is the newest name on the list.' },
  { id: 'arctic', name: 'Arctic Ocean', area: 16, share: 4, spots: [[-150, 79], [170, 80]],
    fact: 'The Arctic Ocean, around the North Pole, is the smallest and shallowest ocean. Much of it is covered by floating sea ice.' },
];
export const ocean = (id) => OCEANS.find((o) => o.id === id);

/** Total land, in millions of km² (about 29% of the 510 million km² of the Earth's surface). */
export const LAND_AREA = 149;
export const LAND_SHARE = 29;
/** Share of all land that lies north of the Equator, in %. */
export const NORTH_LAND_SHARE = 68;

/** African countries whose land the Equator crosses, west to east (ST: the islet of Rolas, just off São Tomé). */
export const EQUATOR_AFRICA = ['ST', 'GA', 'CG', 'CD', 'UG', 'KE', 'SO'];

/* ----------------------------------------------------------------------- dates */

/** Dated events of the course. year: CE unless negative. One entry per event, used by timelines, order steps and tests. */
export const EVENTS = {
  columbus: { year: 1492, label: 'Columbus crosses the Atlantic' },
  america: { year: 1507, label: '"America" first printed on a map' },
  pacificNamed: { year: 1520, label: 'Magellan names the Pacific' },
  australia: { year: 1606, label: 'A Dutch ship reaches Australia' },
  antarctica: { year: 1820, label: 'Antarctica first sighted' },
  blueMarble: { year: 1972, label: 'The "Blue Marble" photograph' },
  // lesson 2: maps
  idrisi: { year: 1154, label: 'Al-Idrisi draws a world map for King Roger of Sicily' },
  mercator: { year: 1569, label: 'Mercator publishes his map for sailors' },
  gall: { year: 1855, label: 'James Gall presents an equal-area world map' },
  webMercator: { year: 2005, label: 'Online maps adopt a version of Mercator' },
  equalEarth: { year: 2018, label: 'The Equal Earth projection is published' },
  // lesson 3: latitude and longitude
  longitudeAct: { year: 1714, label: 'Britain offers a prize for finding longitude at sea' },
  harrisonH4: { year: 1761, label: 'Harrison\'s sea watch is tested on a voyage to Jamaica' },
  frenchRevolution: { year: 1789, label: 'French Revolution' },
  greenwich: { year: 1884, label: 'Greenwich is chosen as the world\'s zero of longitude' },
  moonLanding: { year: 1969, label: 'First Moon landing' },
};

/* ----------------------------------------------------------------------- sizes */

/**
 * Areas in thousands of km² (total area, UN and national figures, rounded to the nearest thousand).
 * Keys are country codes, plus 'africa' for the whole continent and 'nordic3' for Norway, Sweden and Finland together.
 */
export const AREAS = {
  RU: 17098, CA: 9985, US: 9834, CN: 9597, BR: 8516, AU: 7692, IN: 3287, AR: 2780, KZ: 2725, DZ: 2382, CD: 2345,
  GL: 2166, SA: 2150, MX: 1964, ID: 1905, EG: 1002, TZ: 945, NG: 924, MG: 587, KE: 580, SE: 450, NO: 385, FI: 338,
  africa: 30370, nordic3: 1173,
};

/** What to colour and what to call each key of AREAS on a map. */
export const AREA_THINGS = {
  africa: { ids: ['africa'], name: 'Africa' },
  nordic3: { ids: ['NO', 'SE', 'FI'], name: 'Norway, Sweden and Finland together' },
  US: { ids: ['US'], name: 'the United States' },
};
export const areaThing = (key) => AREA_THINGS[key] || { ids: [key], name: countryName(key) };

/**
 * Pairs for "which is really larger?" on a Mercator map: [the one nearer a pole, the one nearer the Equator].
 * Only pairs whose true areas differ by a factor of 1.5 or more are listed (the test enforces it), so that
 * "about the same" is never a defensible answer. In some pairs the polar one really is larger: the map
 * exaggerates, but it does not always reverse the order.
 */
export const SIZE_PAIRS = [
  ['GL', 'africa'], ['GL', 'IN'], ['GL', 'BR'], ['GL', 'AU'], ['GL', 'CN'], ['GL', 'US'],
  ['RU', 'africa'], ['CA', 'africa'], ['nordic3', 'IN'], ['SE', 'NG'], ['SE', 'EG'], ['SE', 'TZ'], ['FI', 'KE'],
  ['GL', 'MG'], ['GL', 'NG'], ['GL', 'KE'], ['CA', 'IN'], ['CA', 'AR'], ['CA', 'MX'], ['RU', 'BR'], ['RU', 'AU'], ['RU', 'CN'],
];

/** Countries large enough to tap on a whole-world map on a phone (each at least about 15° wide). */
export const BIG_COUNTRIES = ['BR', 'CA', 'AU', 'IN', 'CN', 'US', 'RU', 'AR', 'MX', 'DZ', 'CD', 'SA', 'KZ', 'ID', 'MN', 'IR'];

/* ---------------------------------------------------------------- coordinates */

/**
 * Cities for latitude and longitude practice: spread over all four quarters of the globe, and each at least
 * 10° from the Equator and from the prime meridian, so that a slip of N/S or E/W lands a long way off.
 * at: [longitude, latitude]; country: where it is.
 */
export const CITIES = [
  { name: 'Cairo', at: [31.25, 30.05], country: 'EG' },
  { name: 'Moscow', at: [37.61, 55.75], country: 'RU' },
  { name: 'Istanbul', at: [29.01, 41.11], country: 'TR' },
  { name: 'Delhi', at: [77.23, 28.67], country: 'IN' },
  { name: 'Mumbai', at: [72.86, 19.02], country: 'IN' },
  { name: 'Beijing', at: [116.39, 39.93], country: 'CN' },
  { name: 'Tokyo', at: [139.75, 35.69], country: 'JP' },
  { name: 'New York', at: [-73.98, 40.75], country: 'US' },
  { name: 'Los Angeles', at: [-118.18, 33.99], country: 'US' },
  { name: 'Vancouver', at: [-123.12, 49.28], country: 'CA' },
  { name: 'Mexico City', at: [-99.13, 19.44], country: 'MX' },
  { name: 'Havana', at: [-82.37, 23.13], country: 'CU' },
  { name: 'Dakar', at: [-17.48, 14.72], country: 'SN' },
  { name: 'Reykjavík', at: [-21.95, 64.15], country: 'IS' },
  { name: 'Lima', at: [-77.05, -12.05], country: 'PE' },
  { name: 'Rio de Janeiro', at: [-43.23, -22.92], country: 'BR' },
  { name: 'Buenos Aires', at: [-58.4, -34.6], country: 'AR' },
  { name: 'Santiago', at: [-70.67, -33.45], country: 'CL' },
  { name: 'Cape Town', at: [18.43, -33.92], country: 'ZA' },
  { name: 'Johannesburg', at: [28.03, -26.17], country: 'ZA' },
  { name: 'Sydney', at: [151.18, -33.92], country: 'AU' },
  { name: 'Perth', at: [115.84, -31.95], country: 'AU' },
  { name: 'Auckland', at: [174.76, -36.85], country: 'NZ' },
];

/**
 * Clock time in cities that keep the same time all year (no daylight-saving change) and whose clocks agree with
 * the Sun to within half an hour: offset is hours ahead of (+) or behind (−) Greenwich time (UTC).
 */
export const CLOCKS = [
  { name: 'Tokyo', at: [139.75, 35.69], offset: 9 },
  { name: 'Beijing', at: [116.39, 39.93], offset: 8 },
  { name: 'Manila', at: [120.98, 14.61], offset: 8 },
  { name: 'Bangkok', at: [100.51, 13.75], offset: 7 },
  { name: 'Jakarta', at: [106.83, -6.17], offset: 7 },
  { name: 'Dhaka', at: [90.41, 23.73], offset: 6 },
  { name: 'Dubai', at: [55.28, 25.23], offset: 4 },
  { name: 'Moscow', at: [37.61, 55.75], offset: 3 },
  { name: 'Baghdad', at: [44.39, 33.34], offset: 3 },
  { name: 'Johannesburg', at: [28.03, -26.17], offset: 2 },
  { name: 'Kinshasa', at: [15.31, -4.33], offset: 1 },
  { name: 'Rio de Janeiro', at: [-43.23, -22.92], offset: -3 },
  { name: 'Manaus', at: [-60, -3.1], offset: -4 },
  { name: 'Lima', at: [-77.05, -12.05], offset: -5 },
  { name: 'Bogotá', at: [-74.09, 4.6], offset: -5 },
  { name: 'Guatemala City', at: [-90.53, 14.62], offset: -6 },
];

/** The tilt of the Earth's axis, and the special lines of latitude that follow from it (degrees). */
export const TILT = 23.4;
export const POLAR_CIRCLE = 66.6;
/** Kilometres in one degree of latitude. */
export const KM_PER_DEGREE = 111;

/* ------------------------------------------------------------------- landforms */

/**
 * Mountain ranges. line: points along the crest, for drawing (approximate); at: where a quiz marker stands.
 * continent: a CONTINENTS id (the Urals are the conventional line between two).
 */
export const RANGES = [
  { id: 'himalaya', name: 'Himalaya', continent: 'asia', at: [84, 28.6],
    line: [[73.5, 35.5], [78, 32], [83, 29], [88, 27.8], [92, 27.8], [95.5, 29]],
    fact: 'The Himalaya, in Asia, hold Mount Everest (8,849 m) and all the highest peaks on Earth. They rose, and are still rising, where India pushes into the rest of Asia.' },
  { id: 'andes', name: 'Andes', continent: 'south-america', at: [-70, -20],
    line: [[-73, 10], [-77, 3], [-78.5, -2], [-77, -10], [-72, -15], [-68.5, -20], [-69.5, -28], [-70, -33], [-71.5, -41], [-73, -49]],
    fact: 'The Andes run for more than 7,000 km down the whole western edge of South America: the longest mountain chain on land.' },
  { id: 'rockies', name: 'Rocky Mountains', continent: 'north-america', at: [-113, 46],
    line: [[-125, 57], [-120, 54], [-116, 50.5], [-113.5, 47], [-110.5, 44], [-106.5, 40], [-105.5, 36]],
    fact: 'The Rocky Mountains run for nearly 5,000 km through western Canada and the United States.' },
  { id: 'alps', name: 'Alps', continent: 'europe', at: [10, 46.5],
    line: [[6.5, 44.5], [7, 45.8], [9, 46.5], [11.5, 47], [13.5, 47.2], [15.5, 47.5]],
    fact: 'The Alps arc across the middle of Europe, from France to Austria and Slovenia. Their highest peak, Mont Blanc, is about 4,800 m.' },
  { id: 'atlas', name: 'Atlas Mountains', continent: 'africa', at: [-3, 33],
    line: [[-9, 30.5], [-6, 32], [-2, 33.5], [2, 34.5], [6, 35.5], [9.5, 36]],
    fact: 'The Atlas Mountains cross Morocco, Algeria and Tunisia, and stand between the Mediterranean coast and the Sahara.' },
  { id: 'urals', name: 'Ural Mountains', continent: 'europe', at: [59.5, 60],
    line: [[66, 68], [60, 65], [59.5, 60], [59, 55], [58, 51.5]],
    fact: 'The Urals are old, worn-down mountains running north to south through Russia: the conventional line between Europe and Asia.' },
  { id: 'dividing', name: 'Great Dividing Range', continent: 'oceania', at: [150.5, -29],
    line: [[145.5, -17], [147, -22], [150.5, -26], [151.5, -30], [150, -34], [147.5, -37]],
    fact: 'The Great Dividing Range follows the east coast of Australia for more than 3,500 km.' },
];
export const range = (id) => RANGES.find((r) => r.id === id);

/**
 * Great rivers. name is the name the map knows; mouth: where it reaches the sea; into: that sea;
 * notInto: larger waters that the sea belongs to (never offered as wrong answers); city: a great city on it.
 */
export const RIVERS = [
  { id: 'nile', name: 'Nile', continent: 'africa', mouth: [31.2, 31.5], into: 'Mediterranean Sea', notInto: ['Atlantic Ocean'], city: 'Cairo',
    fact: 'The Nile flows north for about 6,650 km, from the highlands of East Africa through the Sahara to the Mediterranean. It is usually listed as the longest river in the world.' },
  { id: 'amazon', name: 'Amazon', continent: 'south-america', mouth: [-50, 0], into: 'Atlantic Ocean', notInto: [], city: 'Manaus',
    fact: 'The Amazon carries far more water than any other river: about a fifth of all the river water that reaches the sea. Whether it or the Nile is the longer depends on how you measure.' },
  { id: 'yangtze', name: 'Yangtze', continent: 'asia', mouth: [121.9, 31.4], into: 'East China Sea', notInto: ['Pacific Ocean'], city: 'Shanghai',
    fact: 'The Yangtze, about 6,300 km long, is the longest river in Asia. It crosses China from the Tibetan Plateau to the sea at Shanghai.' },
  { id: 'mississippi', name: 'Mississippi', continent: 'north-america', mouth: [-89.3, 29.1], into: 'Gulf of Mexico', notInto: ['Atlantic Ocean', 'Caribbean Sea'], city: 'New Orleans',
    fact: 'The Mississippi, with its great branch the Missouri, drains the middle of North America, from the Rockies to the Appalachians, into the Gulf of Mexico.' },
  { id: 'congo', name: 'Congo', continent: 'africa', mouth: [12.4, -6], into: 'Atlantic Ocean', notInto: [], city: 'Kinshasa',
    fact: 'The Congo curves through the rainforest of Central Africa and crosses the Equator twice. It is the deepest river in the world, and only the Amazon carries more water.' },
  { id: 'ganges', name: 'Ganges', continent: 'asia', mouth: [90.5, 22.3], into: 'Bay of Bengal', notInto: ['Indian Ocean'], city: 'Varanasi',
    fact: 'The Ganges flows from the Himalaya across the plains of northern India and, joined by the Brahmaputra, through Bangladesh to the Bay of Bengal. Hundreds of millions of people live in its basin, and it is sacred to Hindus.' },
  { id: 'danube', name: 'Danube', continent: 'europe', mouth: [29.7, 45.2], into: 'Black Sea', notInto: ['Mediterranean Sea', 'Atlantic Ocean'], city: 'Vienna',
    fact: 'The Danube crosses Europe from the Black Forest in Germany to the Black Sea. It passes through ten countries, more than any other river.' },
];
export const river = (id) => RIVERS.find((r) => r.id === id);
/** Other seas offered as wrong answers to "where does it reach the sea?". */
export const OTHER_SEAS = ['Arabian Sea', 'Caribbean Sea', 'North Sea', 'Pacific Ocean', 'Indian Ocean', 'Red Sea'];

/**
 * Deserts. area: a rough outline for drawing only (never used to judge an answer).
 * cores: points well inside the desert; a pin within `within` km of any of them counts as "in" it,
 * unless it stands in one of the countries listed under `outside` (across a sea from the desert), which get their own message.
 * view: the map on which the learner places the pin.
 */
export const DESERTS = [
  { id: 'sahara', name: 'Sahara', view: 'africa', within: 900, cores: [[-5, 23], [8, 24], [20, 24], [30, 23]],
    outside: { SA: 'That is across the Red Sea, in Saudi Arabia. The Sahara is in Africa, to the west.' },
    area: [[-16, 20], [-10, 29], [0, 33], [10, 33.5], [20, 31], [30, 30.5], [34, 27], [37, 19], [30, 15.5], [15, 15], [0, 16.5], [-16, 17]],
    fact: 'The Sahara stretches right across North Africa, from the Atlantic to the Red Sea. At about 9 million km² it is the largest hot desert on Earth, nearly as big as the United States.' },
  { id: 'arabian', name: 'Arabian Desert', view: 'middle-east', within: 700, cores: [[45, 23], [52, 21]],
    outside: { IR: 'That is Iran, across the Persian Gulf. The Arabian Desert is on the peninsula to the south-west.' },
    area: [[36, 29], [40, 31.5], [47, 29.5], [51, 25], [56, 23.5], [58.5, 20.5], [54, 17], [45, 14], [43, 17.5], [39.5, 22], [36, 27]],
    fact: 'The Arabian Desert covers most of the Arabian Peninsula. Its southern part, the Rub\' al-Khali or "Empty Quarter", is the largest continuous sea of sand in the world.' },
  { id: 'gobi', name: 'Gobi Desert', view: 'asia', within: 600, cores: [[98, 42.5], [108, 43.5]],
    area: [[92, 42], [97, 45], [105, 45.5], [112, 45.5], [117, 43], [110, 40.5], [103, 39.5], [95, 40]],
    fact: 'The Gobi lies across southern Mongolia and northern China. It is a cold desert: winter temperatures fall far below freezing.' },
  { id: 'kalahari', name: 'Kalahari Desert', view: 'africa', within: 500, cores: [[22, -23]],
    area: [[19, -19], [24, -19], [26.5, -23], [24, -27.5], [19.5, -27.5], [17.5, -23]],
    fact: 'The Kalahari covers most of Botswana and parts of Namibia and South Africa. It is home to the San, who have lived there for tens of thousands of years.' },
  { id: 'atacama', name: 'Atacama Desert', view: 'south-america', within: 500, cores: [[-69.5, -23.5]],
    area: [[-70.5, -18], [-68.5, -18.5], [-68, -24], [-69.5, -28], [-71, -28], [-70.5, -23]],
    fact: 'The Atacama, a strip of northern Chile between the Andes and the Pacific, is the driest desert outside the polar regions. Some of its weather stations have gone years without measurable rain.' },
  { id: 'australian', name: 'Australian deserts', view: 'australia', within: 700, cores: [[124, -24], [133, -26]],
    area: [[117, -20], [125, -18.5], [134, -20], [140, -23.5], [140, -29.5], [133, -31], [125, -31], [118, -27]],
    fact: 'A group of deserts fills the centre and west of Australia, the driest inhabited continent. Most Australians live on the wetter coasts.' },
];
export const desert = (id) => DESERTS.find((d) => d.id === id);

/** Seas and lakes worth knowing. at: a point in the water, for a marker. */
export const WATERS = [
  { id: 'mediterranean', name: 'Mediterranean Sea', kind: 'sea', at: [18, 35], fact: 'The Mediterranean lies between Europe, Africa and Asia. Its name means "in the middle of the land".' },
  { id: 'caribbean', name: 'Caribbean Sea', kind: 'sea', at: [-75, 15], fact: 'The Caribbean Sea lies between the islands of the West Indies, Central America and the north coast of South America.' },
  { id: 'red-sea', name: 'Red Sea', kind: 'sea', at: [38, 20], fact: 'The Red Sea is the long, narrow sea between Africa and Arabia. It is a rift, where two plates are pulling apart.' },
  { id: 'black-sea', name: 'Black Sea', kind: 'sea', at: [34, 43.3], fact: 'The Black Sea lies between south-eastern Europe and Turkey. The Danube ends here.' },
  { id: 'arabian-sea', name: 'Arabian Sea', kind: 'sea', at: [64, 15], fact: 'The Arabian Sea is the part of the Indian Ocean between Arabia and India.' },
  { id: 'bengal', name: 'Bay of Bengal', kind: 'sea', at: [89, 14], fact: 'The Bay of Bengal is the part of the Indian Ocean east of India. The Ganges ends here.' },
  { id: 'south-china', name: 'South China Sea', kind: 'sea', at: [114, 13], fact: 'The South China Sea lies between southern China, Vietnam, the Philippines and Borneo. It is one of the busiest shipping routes in the world.' },
  { id: 'gulf-mexico', name: 'Gulf of Mexico', kind: 'sea', at: [-90, 25], fact: 'The Gulf of Mexico is the great bay between the United States, Mexico and Cuba. The Mississippi ends here.' },
  { id: 'hudson', name: 'Hudson Bay', kind: 'sea', at: [-85, 60], fact: 'Hudson Bay is the huge, shallow inland sea in the north of Canada. It freezes over every winter.' },
  { id: 'caspian', name: 'Caspian Sea', kind: 'lake', at: [50.5, 41.5], fact: 'The Caspian Sea, between Europe and Asia, has no outlet to the ocean: it is the largest lake in the world, and salty.' },
  { id: 'baikal', name: 'Lake Baikal', kind: 'lake', at: [108, 53.5], fact: 'Lake Baikal, in Siberia, is the deepest lake in the world. It holds about a fifth of all the liquid fresh water on the surface of the Earth.' },
  { id: 'great-lakes', name: 'Great Lakes', kind: 'lake', at: [-85, 45], fact: 'The five Great Lakes lie on the border between Canada and the United States. Together they are the largest group of freshwater lakes on Earth.' },
  { id: 'victoria', name: 'Lake Victoria', kind: 'lake', at: [33, -1], fact: 'Lake Victoria, on the Equator in East Africa, is the largest lake in Africa and a source of the Nile.' },
];
export const water = (id) => WATERS.find((w) => w.id === id);

/**
 * Markers for a "tap the right one" map: the target plus others from the pool, chosen so that no two stand
 * closer than `gap` degrees (so that a thumb can tell them apart on a phone). Returns them shuffled.
 */
export function spreadMarkers(rng, pool, target, { count = 5, gap = 26, at = (x) => x.at } = {}) {
  const far = (a, b) => {
    let dLon = Math.abs(at(a)[0] - at(b)[0]);
    if (dLon > 180) dLon = 360 - dLon;
    return Math.hypot(dLon, at(a)[1] - at(b)[1]) >= gap;
  };
  const chosen = [target];
  for (const item of rng.shuffle(pool)) {
    if (chosen.length >= count) break;
    if (item !== target && chosen.every((c) => far(c, item))) chosen.push(item);
  }
  return rng.shuffle(chosen);
}

/** Deep time, in years before the present (rounded; the order step and its test use these). */
export const DEEP_TIME = [
  { id: 'pangaea', ago: 200e6, label: 'The supercontinent Pangaea begins to break apart' },
  { id: 'dinosaurs', ago: 66e6, label: 'The last dinosaurs die out' },
  { id: 'india', ago: 50e6, label: 'India collides with Asia and the Himalaya begin to rise' },
  { id: 'sapiens', ago: 300e3, label: 'Our own species appears in Africa' },
  { id: 'everest', ago: 70, label: 'Tenzing Norgay and Edmund Hillary climb Everest' },
];

/** Great cities and the rivers they stand on. */
export const CITY_RIVERS = [['Cairo', 'Nile'], ['Shanghai', 'Yangtze'], ['Kinshasa', 'Congo'], ['New Orleans', 'Mississippi'], ['Vienna', 'Danube']];

/** Lines drawn on the plates map (approximate; for drawing only). */
export const RING_OF_FIRE_WEST = [[178, -38], [180, -30], [168, -16], [155, -6], [147, -5], [128, 2], [125, 8], [121, 16], [124, 24], [131, 32], [140, 37], [147, 44], [158, 52], [170, 53], [179.9, 51.5]];
export const RING_OF_FIRE_EAST = [[-179.9, 51.5], [-165, 54], [-152, 59], [-135, 57], [-123, 47], [-120, 38], [-105, 20], [-91, 14.5], [-84, 10], [-78, 0], [-72, -16], [-69, -23], [-71.5, -38], [-73, -46]];
export const MID_ATLANTIC_RIDGE = [[-18, 66], [-30, 58], [-33, 50], [-30, 43], [-39, 35], [-45, 25], [-45, 15], [-33, 6], [-25, 0.5], [-13, -5], [-13, -20], [-15, -35], [-10, -45], [0, -54]];
export const GREAT_RIFT = [[36, 33], [35, 29], [38, 20], [42, 12], [38, 7], [36, 0], [35, -5], [34.5, -13], [35, -18]];

/* --------------------------------------------------------------------- climate */

/** Average air temperature in °C (1991–2020 normals, rounded) for two cities at the same latitude. */
export const SAME_LATITUDE = {
  latitude: 56,
  sea: { name: 'Edinburgh', country: 'GB', at: [-3.19, 55.95], jan: 4, jul: 15 },
  inland: { name: 'Moscow', country: 'RU', at: [37.61, 55.75], jan: -6, jul: 20 },
};

/** How much cooler the air gets as you climb: °C per 1,000 m (a round average; the real figure varies with the weather). */
export const COOLING_PER_KM = 6;

/**
 * Cities outside the tropics, for "who has summer now?" (from CITIES; each at least 26° from the Equator).
 * Delhi is left out: its hottest weeks come before the monsoon, in May and June, so "summer" is less clear-cut there.
 */
export const seasonCities = () => CITIES.filter((c) => Math.abs(c.at[1]) >= 26 && c.name !== 'Delhi');

/** Ocean currents drawn on the currents map (approximate paths, for drawing only). */
export const CURRENTS = [
  { id: 'gulf-stream', name: 'Gulf Stream and North Atlantic Drift', warm: true, path: [[-80, 25], [-76, 33], [-68, 39], [-50, 43], [-30, 50], [-10, 58], [5, 65]] },
  { id: 'humboldt', name: 'Humboldt Current', warm: false, path: [[-76, -45], [-74.5, -33], [-72.5, -22], [-78.5, -12], [-82.5, -5]] },
  { id: 'benguela', name: 'Benguela Current', warm: false, path: [[16.5, -34], [13, -25], [11, -17], [9, -10]] },
  { id: 'california', name: 'California Current', warm: false, path: [[-128, 45], [-125, 38], [-119.5, 31], [-113.5, 23]] },
  { id: 'canary', name: 'Canary Current', warm: false, path: [[-12, 38], [-13, 30], [-18.5, 22], [-20, 15]] },
];

/** Places on the currents map. dry: a coastal desert beside a cold current. */
export const CURRENT_SPOTS = [
  { id: 'atacama', at: [-70.3, -23.5], label: 'Atacama coast, Chile', dry: true },
  { id: 'namib', at: [14.6, -23], label: 'Namib coast, Namibia', dry: true },
  { id: 'norway', at: [7, 62], label: 'West coast of Norway', dry: false },
  { id: 'amazon', at: [-50, -1], label: 'Mouth of the Amazon', dry: false },
  { id: 'florida', at: [-80.5, 27], label: 'Florida', dry: false },
];

/**
 * The main biomes, roughly in order from the Equator to the poles. sketch: the climate and the plants in a few words
 * (brief: the same in a line short enough for a table).
 * spots: example places for the world map; transect: its place on a line from the Congo to the Arctic (steppe lies off the line).
 */
export const BIOMES = [
  { id: 'rainforest', brief: 'hot and wet all year', where: 'in tropical rainforest', name: 'tropical rainforest', short: 'Rainforest', sketch: 'hot and wet all year', transect: [22, 0],
    spots: [{ at: [-62, -4], place: 'The Amazon basin' }, { at: [22, 0], place: 'The Congo basin' }, { at: [114, 1], place: 'Borneo' }] },
  { id: 'savanna', brief: 'hot; a wet and a dry season', where: 'in savanna', name: 'savanna', short: 'Savanna', sketch: 'hot all year, with a wet season and a long dry one: grass and scattered trees', transect: [25, 9],
    spots: [{ at: [35, -5], place: 'The plains of East Africa' }, { at: [-48, -14], place: 'The Cerrado of Brazil' }, { at: [133, -16], place: 'Northern Australia' }] },
  { id: 'desert', brief: 'dry all year', where: 'in a desert', name: 'desert', short: 'Desert', sketch: 'dry all year', transect: [25, 24],
    spots: [{ at: [10, 24], place: 'The Sahara' }, { at: [48, 22], place: 'Arabia' }, { at: [128, -25], place: 'Central Australia' }] },
  { id: 'mediterranean', brief: 'dry summers, mild wet winters', where: 'in Mediterranean scrub', name: 'Mediterranean scrub', short: 'Mediterranean', sketch: 'hot dry summers and mild wet winters', transect: [22, 38],
    spots: [{ at: [16, 39.3], place: 'Southern Italy' }, { at: [-120, 36], place: 'California' }, { at: [19.5, -33.5], place: 'The Cape of South Africa' }, { at: [-71, -34], place: 'Central Chile' }] },
  { id: 'temperate-forest', brief: 'mild, with rain all year', where: 'in temperate forest', name: 'temperate forest', short: 'Temperate forest', sketch: 'warm summers, cool winters and rain all year: trees that drop their leaves', transect: [22, 50],
    spots: [{ at: [10, 51], place: 'Germany' }, { at: [-80, 38], place: 'The eastern United States' }, { at: [117, 36], place: 'Eastern China' }] },
  { id: 'steppe', brief: 'grassland, too dry for trees', where: 'on the steppe', name: 'steppe', short: 'Steppe', sketch: 'grassland with hot summers and cold winters, too dry for forest', transect: null,
    spots: [{ at: [-100, 42], place: 'The Great Plains of North America' }, { at: [68, 49], place: 'The Kazakh steppe' }] },
  { id: 'taiga', brief: 'conifers; long, hard winters', where: 'in the taiga', name: 'taiga', short: 'Taiga', sketch: 'conifer forest with long, bitter winters and short summers', transect: [27, 63],
    spots: [{ at: [100, 60], place: 'Siberia' }, { at: [-95, 55], place: 'Northern Canada' }, { at: [27, 64], place: 'Finland' }] },
  { id: 'tundra', brief: 'too cold for trees', where: 'on the tundra', name: 'tundra', short: 'Tundra', sketch: 'too cold for trees: moss, lichen and low shrubs over frozen ground', transect: [27, 70],
    spots: [{ at: [100, 72], place: 'The Arctic coast of Siberia' }, { at: [-100, 67], place: 'The far north of Canada' }] },
  { id: 'ice', brief: 'frozen all year', where: 'on an ice cap', name: 'ice cap', short: 'Ice', sketch: 'frozen all year', transect: [18, 79],
    spots: [{ at: [-40, 73], place: 'Greenland' }, { at: [60, -80], place: 'Antarctica' }] },
];
export const biome = (id) => BIOMES.find((b) => b.id === id);

/** The Indian monsoon year, in order (typical dates; the onset varies by a week or two from year to year). */
export const MONSOON_YEAR = [
  'April and May: the land bakes; the hottest, driest weeks',
  'Early June: wet winds from the ocean reach the south-west coast',
  'July: the rains cover almost all of India',
  'October: the winds turn and the rains retreat',
  'December to February: cool, dry winds blow from the land',
];

/* ---------------------------------------------------------------------- people */

/** Share of the world's people by region, in % (United Nations estimates for the mid-2020s, rounded). */
export const POPULATION_SHARE = [
  { name: 'Asia', short: 'Asia', share: 59, color: 'green' },
  { name: 'Africa', short: 'Africa', share: 18, color: 'orange' },
  { name: 'Europe', short: 'Europe', share: 9, color: 'violet' },
  { name: 'Latin America and the Caribbean', short: 'Latin\nAmerica', share: 8, color: 'yellow' },
  { name: 'Northern America', short: 'Northern\nAmerica', share: 5, color: 'red' },
  { name: 'Oceania', short: 'Oceania', share: 0.6, color: 'pink' },
];

/** The circle of the opening question: more than half of all people live inside it. */
export const HALF_CIRCLE = { center: [106.6, 26.6], km: 4000 };

/** Crowded and nearly empty parts of the world, for the "tap the crowded one" map. reason: why an empty place is empty. */
export const PEOPLE_SPOTS = [
  { id: 'ganges', at: [83, 26], label: 'Plain of the Ganges', dense: true,
    fact: 'Hundreds of millions of people live on the plain of the Ganges, in northern India and Bangladesh: one of the most thickly settled farming regions on Earth.' },
  { id: 'china', at: [116, 33.5], label: 'Plains of eastern China', dense: true,
    fact: 'The plains of eastern China, watered by the Yellow River and the Yangtze, are home to hundreds of millions of people.' },
  { id: 'java', at: [110, -7.3], label: 'Java', dense: true,
    fact: 'More than 150 million people live on Java, an island about the size of England: over half of all Indonesians.' },
  { id: 'nile', at: [31, 30.3], label: 'Nile delta', dense: true,
    fact: 'Nearly all of Egypt\'s people, more than 100 million of them, live along the Nile and in its delta.' },
  { id: 'rhine', at: [6.5, 51.3], label: 'North-west Europe', dense: true,
    fact: 'From England across the Low Countries to the Rhine runs one of the most built-up regions in the world.' },
  { id: 'nigeria', at: [5, 7], label: 'Southern Nigeria', dense: true,
    fact: 'Nigeria has more people than any other country in Africa: well over 200 million.' },
  { id: 'sahara', at: [10, 23], label: 'Sahara', dense: false, reason: 'too dry',
    fact: 'The Sahara is nearly as large as the United States, and almost empty: there is too little water to farm.' },
  { id: 'siberia', at: [105, 65], label: 'Siberia', dense: false, reason: 'too cold',
    fact: 'Siberia is larger than Canada, but its long, bitter winters and frozen ground leave room for only a few people per square kilometre.' },
  { id: 'amazon', at: [-63, -4], label: 'Amazon rainforest', dense: false, reason: 'dense forest',
    fact: 'The Amazon rainforest is thinly peopled: dense forest and poor soils make it hard to farm on a large scale. Many Indigenous peoples have lived in it for thousands of years.' },
  { id: 'outback', at: [130, -25], label: 'Central Australia', dense: false, reason: 'too dry',
    fact: 'The dry heart of Australia is almost empty. Most Australians live in a few cities on the coast.' },
  { id: 'greenland', at: [-42, 72], label: 'Greenland', dense: false, reason: 'ice',
    fact: 'Greenland is mostly buried under ice. Its 57,000 people live in small towns along the coast.' },
  { id: 'tibet', at: [88, 33.5], label: 'Tibetan Plateau', dense: false, reason: 'too high',
    fact: 'The Tibetan Plateau lies more than 4,000 m above the sea: high, cold and dry, with thin air and a short growing season.' },
  { id: 'arctic-canada', at: [-100, 63], label: 'Northern Canada', dense: false, reason: 'too cold',
    fact: 'The north of Canada is tundra and cold forest. Most Canadians live in a narrow band along the southern border.' },
];
export const peopleSpot = (id) => PEOPLE_SPOTS.find((p) => p.id === id);

/**
 * People per km² of total area (mid-2020s, rounded). Two groups a long way apart: every crowded country here has
 * at least nine times the density of every sparse one, so "which is more crowded?" is never a close call.
 */
export const DENSITY = {
  crowded: { BD: 1200, KR: 520, NL: 430, IN: 430, PH: 380, JP: 330, VN: 300, PK: 300, GB: 280, NG: 240, DE: 240 },
  sparse: { MN: 2, AU: 3, NA: 4, IS: 4, LY: 4, CA: 4, BW: 4, KZ: 7, RU: 8, BO: 11, NO: 14, FI: 16, AR: 17, SA: 17, DZ: 19, BR: 25 },
};

/** Cities of more than ten million people (by most counts), spread over the continents. site: where the city stands. */
export const MEGACITIES = [
  { name: 'Tokyo', at: [139.75, 35.69], country: 'JP', site: 'on a great bay of the Pacific coast of Japan' },
  { name: 'Delhi', at: [77.23, 28.67], country: 'IN', site: 'on the Yamuna, a branch of the Ganges' },
  { name: 'Shanghai', at: [121.43, 31.22], country: 'CN', site: 'at the mouth of the Yangtze' },
  { name: 'Jakarta', at: [106.83, -6.17], country: 'ID', site: 'on the north coast of the island of Java' },
  { name: 'Dhaka', at: [90.41, 23.73], country: 'BD', site: 'in the delta of the Ganges and the Brahmaputra' },
  { name: 'Karachi', at: [66.99, 24.87], country: 'PK', site: 'on the Arabian Sea, near the mouth of the Indus' },
  { name: 'Manila', at: [120.98, 14.61], country: 'PH', site: 'on a sheltered bay of the South China Sea' },
  { name: 'Cairo', at: [31.25, 30.05], country: 'EG', site: 'on the Nile, where its valley opens into the delta' },
  { name: 'Lagos', at: [3.39, 6.45], country: 'NG', site: 'on a lagoon of the Atlantic coast' },
  { name: 'Kinshasa', at: [15.31, -4.33], country: 'CD', site: 'on the Congo River' },
  { name: 'Istanbul', at: [29.01, 41.11], country: 'TR', site: 'on the Bosporus, the strait between Europe and Asia' },
  { name: 'Moscow', at: [37.61, 55.75], country: 'RU', site: 'on the Moskva River, in the heart of European Russia' },
  { name: 'São Paulo', at: [-46.63, -23.56], country: 'BR', site: 'on a plateau a short way inland from the Atlantic coast' },
  { name: 'Buenos Aires', at: [-58.4, -34.6], country: 'AR', site: 'on the wide estuary of the Río de la Plata' },
  { name: 'Mexico City', at: [-99.13, 19.44], country: 'MX', site: 'in a high valley 2,240 m above the sea, where the Aztec capital Tenochtitlan once stood' },
  { name: 'New York', at: [-73.98, 40.75], country: 'US', site: 'at the mouth of the Hudson River, on the Atlantic coast' },
  { name: 'Los Angeles', at: [-118.18, 33.99], country: 'US', site: 'on the Pacific coast' },
];

/** The year the world's population passed each number of billions (United Nations estimates). */
export const BILLIONS = { 1: 1804, 2: 1927, 4: 1974, 8: 2022 };

/* ------------------------------------------------------------------- countries */

export const UN_MEMBERS = 193;

/** Landlocked countries, by the map on which the learner looks for one. */
export const LANDLOCKED = {
  africa: ['ML', 'BF', 'NE', 'TD', 'CF', 'SS', 'ET', 'UG', 'RW', 'BI', 'MW', 'ZM', 'ZW', 'BW', 'LS', 'SZ'],
  'south-america': ['BO', 'PY'],
  europe: ['AD', 'AT', 'BY', 'CH', 'CZ', 'HU', 'LI', 'LU', 'MD', 'MK', 'RS', 'SK', 'SM', 'VA', 'XK'],
};
/** Other well-known landlocked countries (Asia), for sorting questions. */
export const LANDLOCKED_ASIA = ['MN', 'NP', 'AF', 'KZ', 'UZ', 'LA', 'BT'];
/** Countries made up entirely of islands. */
export const ISLAND_COUNTRIES = ['JP', 'ID', 'PH', 'MG', 'LK', 'NZ', 'IS', 'CU', 'GB', 'IE'];
/** Countries on a mainland, with a sea coast. */
export const COASTAL_COUNTRIES = ['BR', 'KE', 'IN', 'FR', 'EG', 'MX', 'CN', 'NG', 'ZA', 'VN', 'PE', 'TR'];

/** Natural features that make a border, and the two countries each one separates. */
export const BORDER_FEATURES = [
  { id: 'pyrenees', feature: 'Pyrenees', kind: 'mountains', pair: ['FR', 'ES'], fact: 'The Pyrenees wall off the Iberian Peninsula from the rest of Europe. The border follows their crest from the Atlantic to the Mediterranean.' },
  { id: 'rio-grande', feature: 'Rio Grande', kind: 'river', pair: ['US', 'MX'], fact: 'From El Paso to the Gulf of Mexico, about 2,000 km, the border follows the river that Mexicans call the Río Bravo.' },
  { id: 'andes', feature: 'Andes', kind: 'mountains', pair: ['CL', 'AR'], fact: 'Chile and Argentina share one of the longest borders in the world, more than 5,000 km, most of it along the crest of the Andes.' },
  { id: 'mekong', feature: 'Mekong', kind: 'river', pair: ['LA', 'TH'], fact: 'For much of its length the border between Laos and Thailand is the Mekong, the great river of mainland Southeast Asia.' },
  { id: 'danube', feature: 'lower Danube', kind: 'river', pair: ['BG', 'RO'], fact: 'For about 470 km the Danube is the border between Bulgaria, on its south bank, and Romania, on its north bank.' },
  { id: 'oder', feature: 'Oder', kind: 'river', pair: ['DE', 'PL'], fact: 'Since 1945 the border between Germany and Poland has followed the rivers Oder and Neisse.' },
  { id: 'amur', feature: 'Amur', kind: 'river', pair: ['RU', 'CN'], fact: 'The Amur, which the Chinese call Heilong Jiang, the Black Dragon River, divides the Russian Far East from north-east China.' },
  { id: 'congo', feature: 'Congo', kind: 'river', pair: ['CD', 'CG'], fact: 'Two countries are named after the river between them, and their capitals, Kinshasa and Brazzaville, face each other across it.' },
  { id: 'zambezi', feature: 'Zambezi', kind: 'river', pair: ['ZM', 'ZW'], fact: 'The Zambezi, with the Victoria Falls, is the border between Zambia and Zimbabwe.' },
  { id: 'great-lakes', feature: 'Great Lakes', kind: 'lakes', pair: ['CA', 'US'], fact: 'The border runs through the middle of four of the five Great Lakes. Further west it becomes a ruler-straight line.' },
];

/**
 * "Which country is this?" riddles about borders, each on the map where the answer is a comfortable tap.
 * show: neighbours whose names are printed on the map, where the clue cannot be solved from the shapes alone;
 * equator: draw the Equator (the clue refers to it).
 */
export const BORDER_STORIES = [
  { id: 'lesotho', view: 'southern-africa', answer: 'LS',
    clue: 'One small kingdom on this map is an **enclave**: it is completely surrounded by a single other country.',
    wrong: { SZ: 'That is Eswatini. It is nearly surrounded by South Africa, but it also has a border with Mozambique.', ZA: 'That is South Africa, the country that does the surrounding.' },
    explain: 'Lesotho lies entirely inside South Africa. Only two other countries in the world are enclaves like this: San Marino and Vatican City, both inside Italy.' },
  { id: 'south-sudan', view: 'east-africa', answer: 'SS', show: ['SD', 'ET'],
    clue: 'The newest member of the United Nations is on this map. It became independent in 2011, when its people voted to separate from Sudan, the country to its north.',
    wrong: { SD: 'That is Sudan, the country it separated from. Look to the south of it.', ER: 'That is Eritrea, which became independent from Ethiopia in 1993. The newest country is further west.' },
    explain: 'South Sudan became independent in July 2011 and joined the United Nations as its 193rd member. Borders are still being drawn.' },
  { id: 'chile', view: 'south-america', answer: 'CL',
    clue: 'One country on this map is a ribbon more than 4,000 km long and mostly less than 200 km wide, squeezed between the crest of the Andes and the Pacific Ocean.',
    wrong: { AR: 'That is Argentina, on the other side of the Andes.', PE: 'That is Peru. The ribbon lies to the south of it.' },
    explain: 'Chile\'s eastern border is the crest of the Andes; its western border is the ocean. A mountain range makes a clear line, and a hard one to cross.' },
  { id: 'indonesia', view: 'southeast-asia', answer: 'ID', equator: true,
    clue: 'One country on this map has no mainland at all: it is made of more than 17,000 islands, strung along the Equator.',
    wrong: { PH: 'That is the Philippines, which is an island country too, with more than 7,000 islands. Look further south, along the Equator.', MY: 'That is Malaysia, which is partly on the mainland of Asia.' },
    explain: 'Indonesia is the largest island country in the world, and the fourth most populous country of any kind. Its borders are almost all sea.' },
  { id: 'mongolia', view: 'east-asia', answer: 'MN', show: ['RU', 'CN'],
    clue: 'This large landlocked country has only two neighbours, and they are two of the biggest countries on Earth.',
    wrong: { KZ: 'That is Kazakhstan. It is landlocked too, but it has five neighbours.', CN: 'That is China, one of the two neighbours.', RU: 'That is Russia, one of the two neighbours.' },
    explain: 'Mongolia lies between Russia and China and has no other neighbour. It is one of the most thinly peopled countries in the world.' },
  { id: 'namibia', view: 'southern-africa', answer: 'NA',
    clue: 'A long, thin finger of land sticks out from the north-east corner of this country. It was added in 1890, by a treaty between Germany and Britain, so that a German colony could reach the Zambezi River.',
    wrong: { BW: 'That is Botswana. The finger of land runs along its northern edge, but belongs to its western neighbour.', ZM: 'That is Zambia. The finger points towards it.' },
    explain: 'The Caprivi Strip belongs to Namibia. It is a border drawn in Europe, for European reasons, across the lands of people who were not asked.' },
  { id: 'italy', view: 'southern-europe', answer: 'IT',
    clue: 'Two of the smallest countries in the world lie entirely inside this one.',
    wrong: { FR: 'That is France. Tiny Monaco is on its coast, but not surrounded by it: Monaco has the sea on one side.', ES: 'That is Spain. Andorra is on its border with France, not inside it.' },
    explain: 'San Marino and Vatican City are both enclaves inside Italy. Vatican City, at less than half a square kilometre, is the smallest country in the world.' },
  { id: 'algeria', view: 'africa', answer: 'DZ',
    clue: 'Since 2011, when Sudan divided in two, this has been the largest country in Africa. Most of it is Sahara.',
    wrong: { SD: 'That is Sudan, which was the largest until South Sudan separated from it in 2011.', CD: 'That is DR Congo, the second largest.', LY: 'That is Libya. The largest country is its western neighbour.' },
    explain: 'Algeria covers about 2.4 million km². A change of borders elsewhere made it the largest country in Africa overnight.' },
  { id: 'kazakhstan', view: 'asia', answer: 'KZ',
    clue: 'This is the largest landlocked country in the world: bigger than the whole of western Europe, with no coast on any ocean.',
    wrong: { MN: 'That is Mongolia, the second-largest landlocked country.', RU: 'That is Russia, which has very long coasts on the Arctic and Pacific Oceans.', CN: 'That is China, which has a long Pacific coast.' },
    explain: 'Kazakhstan covers about 2.7 million km². It has a shore on the Caspian Sea, but the Caspian is a lake: no ship can sail from it to the ocean except by river and canal.' },
  { id: 'bolivia', view: 'south-america', answer: 'BO',
    clue: 'This country lost its only stretch of coast in a war in the 1880s and has been landlocked ever since. It still keeps a navy, on a lake high in the Andes.',
    wrong: { PY: 'That is Paraguay, the other landlocked country of South America. It never had a sea coast.', PE: 'That is Peru, which fought on the same side in that war and kept most of its coast.' },
    explain: 'Bolivia lost its Pacific coast to Chile in the War of the Pacific (1879 to 1884). Its navy sails on Lake Titicaca.' },
  { id: 'nepal', view: 'south-asia', answer: 'NP', show: ['IN', 'CN', 'BT'],
    clue: 'This country lies between the two most populous countries on Earth. Its northern border follows the crest of the Himalaya, and Mount Everest stands on it.',
    wrong: { BT: 'That is Bhutan, which also lies between India and China. Everest is further west.', IN: 'That is India, one of the two giants.', CN: 'That is China, one of the two giants.' },
    explain: 'Nepal lies between India and China. The summit of Everest is on its border with China.' },
];

/**
 * Countries whose capital is not their largest city. Names are the names the map knows.
 * other: a third well-known city, as a further wrong answer (optional).
 */
export const CAPITALS = [
  { country: 'AU', capital: 'Canberra', largest: 'Sydney', other: 'Melbourne', why: 'Canberra was built from scratch in the early twentieth century, as a compromise between the rivals Sydney and Melbourne.' },
  { country: 'BR', capital: 'Brasília', largest: 'São Paulo', other: 'Rio de Janeiro', why: 'Brasília was built in the empty interior in the late 1950s, to draw people inland. Until 1960 the capital was Rio de Janeiro.' },
  { country: 'CA', capital: 'Ottawa', largest: 'Toronto', other: 'Vancouver', why: 'Ottawa was chosen in 1857 because it stood on the line between English-speaking and French-speaking Canada.' },
  { country: 'US', capital: 'Washington, D.C.', largest: 'New York', other: 'Los Angeles', why: 'Washington was founded in the 1790s to be the capital and nothing else, on a site between the northern and the southern states.' },
  { country: 'TR', capital: 'Ankara', largest: 'Istanbul', other: 'Izmir', why: 'When the Turkish republic was founded in 1923, its capital was placed at Ankara, in the heart of Anatolia, not in the old imperial city of Istanbul.' },
  { country: 'NG', capital: 'Abuja', largest: 'Lagos', other: 'Kano', why: 'Abuja, in the centre of Nigeria, replaced crowded Lagos as capital in 1991.' },
  { country: 'NZ', capital: 'Wellington', largest: 'Auckland', why: 'Wellington, at the southern tip of the North Island, became capital in 1865 because it lies in the middle of the country.' },
  { country: 'CN', capital: 'Beijing', largest: 'Shanghai', other: 'Guangzhou', why: 'Beijing has been the capital of China for most of the last seven centuries. Shanghai, the great port at the mouth of the Yangtze, is larger.' },
  { country: 'PK', capital: 'Islamabad', largest: 'Karachi', other: 'Lahore', why: 'Islamabad was built in the 1960s to replace Karachi, the great port, as capital.' },
  { country: 'VN', capital: 'Hanoi', largest: 'Ho Chi Minh City', other: 'Da Nang', why: 'Hanoi, in the north, is the old capital. Ho Chi Minh City, formerly Saigon, in the south, is larger.' },
  { country: 'MA', capital: 'Rabat', largest: 'Casablanca', other: 'Marrakesh', why: 'Rabat has been the capital of Morocco since 1912. Casablanca, the main port, is several times larger.' },
  { country: 'TZ', capital: 'Dodoma', largest: 'Dar es Salaam', why: 'Tanzania named Dodoma, in the centre of the country, as its capital in the 1970s. Dar es Salaam, on the coast, remains by far the largest city.' },
  { country: 'KZ', capital: 'Astana', largest: 'Almaty', why: 'Kazakhstan moved its capital from Almaty, in the far south-east, to Astana, on the northern steppe, in 1997.' },
  { country: 'MM', capital: 'Naypyidaw', largest: 'Yangon', other: 'Mandalay', why: 'Myanmar moved its capital from Yangon to the newly built city of Naypyidaw in 2005.' },
];

/** The fifteen countries that the Soviet Union became in 1991. */
export const USSR = ['RU', 'UA', 'BY', 'MD', 'EE', 'LV', 'LT', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'KG', 'TJ'];

/** Moments when the political map changed (for the order step). */
export const MAP_CHANGES = [
  { year: 1945, label: 'The United Nations is founded, with 51 members' },
  { year: 1960, label: 'Seventeen African countries become independent in a single year' },
  { year: 1991, label: 'The Soviet Union breaks up into fifteen countries' },
  { year: 2002, label: 'Timor-Leste becomes independent' },
  { year: 2011, label: 'South Sudan becomes the 193rd member of the United Nations' },
];

export { countryName };
