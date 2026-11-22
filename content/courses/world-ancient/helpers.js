// First Worlds: To 500 CE · shared tables and question builders.
//
// Every place and every dated event of the course lives here, once. Maps, timelines and generated
// questions are built from these tables, so a correction is made in one spot. The course test
// (tests/world-ancient-course.test.mjs) keeps its own, independently typed copy of the key facts and
// fails when the two disagree.
//
// Dates. `year` is a calendar year (BCE negative, no year 0). Deep-time entries give `ago` (years
// before NOW) instead. `pm` is how far the mainstream estimates spread around that figure, in years:
// generated "which came first?" questions only ever compare two events whose ranges are clearly apart.
// `when` is the wording shown to learners, hedged the way the evidence requires.
import { distanceKm } from '../../../src/widgets/world-map.js';

export const NOW = 2025;

/* ------------------------------------------------------------------ places */

// id: { name, at: [longitude, latitude], cc: ISO code of the modern country (null: at sea, or a place whose
// status is disputed and which is therefore never the answer to a "which country?" question) }
export const PLACES = {
  // peopling
  'jebel-irhoud': { name: 'Jebel Irhoud', at: [-8.87, 31.85], cc: 'MA' },
  'omo-kibish': { name: 'Omo Kibish', at: [35.9, 5.4], cc: 'ET' },
  'madjedbebe': { name: 'Madjedbebe', at: [132.89, -12.5], cc: 'AU' },
  'sulawesi': { name: 'Sulawesi caves', at: [119.6, -5.0], cc: 'ID' },
  'chauvet': { name: 'Chauvet Cave', at: [4.42, 44.39], cc: 'FR' },
  'beringia': { name: 'Beringia', at: [-169, 65.8], cc: null },
  'white-sands': { name: 'White Sands', at: [-106.3, 32.8], cc: 'US' },
  'monte-verde': { name: 'Monte Verde', at: [-73.2, -41.5], cc: 'CL' },
  'taiwan': { name: 'Taiwan', at: [121, 23.7], cc: null },
  'new-britain': { name: 'Bismarck Archipelago', at: [150.5, -5.6], cc: 'PG' },
  'samoa': { name: 'Samoa', at: [-172.1, -13.8], cc: 'WS' },
  'tonga': { name: 'Tonga', at: [-175.2, -21.1], cc: 'TO' },
  'tahiti': { name: 'Tahiti', at: [-149.5, -17.6], cc: 'PF' },
  'hawaii': { name: 'Hawaii', at: [-155.5, 19.6], cc: 'US' },
  'rapa-nui': { name: 'Rapa Nui', at: [-109.35, -27.12], cc: 'CL' },
  'aotearoa': { name: 'Aotearoa New Zealand', at: [174.0, -41.0], cc: 'NZ' },
  'madagascar': { name: 'Madagascar', at: [47, -19], cc: 'MG' },
  'borneo': { name: 'Borneo', at: [114, 0.5], cc: 'ID' },
  // farming
  'fertile-crescent': { name: 'Fertile Crescent', at: [39.8, 37.6], cc: 'TR' },
  'gobekli-tepe': { name: 'Göbekli Tepe', at: [38.92, 37.22], cc: 'TR' },
  'catalhoyuk': { name: 'Çatalhöyük', at: [32.83, 37.67], cc: 'TR' },
  'yellow-river-millet': { name: 'Yellow River plain', at: [114.1, 36.6], cc: 'CN' },
  'yangtze-rice': { name: 'Lower Yangtze', at: [120.5, 30.0], cc: 'CN' },
  'balsas': { name: 'Balsas valley', at: [-99.6, 18.3], cc: 'MX' },
  'titicaca': { name: 'Andes near Lake Titicaca', at: [-70.5, -15.2], cc: 'PE' },
  'kuk-swamp': { name: 'Kuk Swamp', at: [144.33, -5.78], cc: 'PG' },
  'sahel': { name: 'West African Sahel', at: [0.2, 17.0], cc: 'ML' },
  'eastern-woodlands': { name: 'Eastern North America', at: [-88, 37.5], cc: 'US' },
  // river valleys
  'uruk': { name: 'Uruk', at: [45.64, 31.32], cc: 'IQ' },
  'ur': { name: 'Ur', at: [46.1, 30.96], cc: 'IQ' },
  'giza': { name: 'Giza', at: [31.13, 29.98], cc: 'EG' },
  'mohenjo-daro': { name: 'Mohenjo-daro', at: [68.14, 27.33], cc: 'PK' },
  'harappa': { name: 'Harappa', at: [72.87, 30.63], cc: 'PK' },
  'anyang': { name: 'Anyang', at: [114.31, 36.13], cc: 'CN' },
  'caral': { name: 'Caral', at: [-77.52, -10.89], cc: 'PE' },
  'la-venta': { name: 'La Venta', at: [-94.04, 18.1], cc: 'MX' },
  'wrangel': { name: 'Wrangel Island', at: [-179.4, 71.2], cc: 'RU' },
  // writing
  'abydos': { name: 'Abydos', at: [31.92, 26.18], cc: 'EG' },
  'serabit': { name: 'Serabit el-Khadim', at: [33.46, 29.04], cc: 'EG' },
  'byblos': { name: 'Byblos', at: [35.65, 34.12], cc: 'LB' },
  'san-bartolo': { name: 'San Bartolo', at: [-89.4, 17.5], cc: 'GT' },
  'rosetta': { name: 'Rosetta (Rashid)', at: [30.42, 31.4], cc: 'EG' },
  'babylon': { name: 'Babylon', at: [44.42, 32.54], cc: 'IQ' },
  // Persia and Greece
  'sardis': { name: 'Sardis', at: [28.04, 38.49], cc: 'TR' },
  'susa': { name: 'Susa', at: [48.26, 32.19], cc: 'IR' },
  'persepolis': { name: 'Persepolis', at: [52.89, 29.93], cc: 'IR' },
  'athens': { name: 'Athens', at: [23.73, 37.98], cc: 'GR' },
  'sparta': { name: 'Sparta', at: [22.43, 37.07], cc: 'GR' },
  'pella': { name: 'Pella', at: [22.52, 40.76], cc: 'GR' },
  'alexandria': { name: 'Alexandria', at: [29.92, 31.2], cc: 'EG' },
  'syene': { name: 'Syene (Aswan)', at: [32.9, 24.09], cc: 'EG' },
  'samarkand': { name: 'Samarkand', at: [66.96, 39.65], cc: 'UZ' },
  'taxila': { name: 'Taxila', at: [72.83, 33.75], cc: 'PK' },
  'massalia': { name: 'Massalia (Marseille)', at: [5.37, 43.3], cc: 'FR' },
  'neapolis': { name: 'Neapolis (Naples)', at: [14.25, 40.85], cc: 'IT' },
  'syracuse': { name: 'Syracuse', at: [15.29, 37.07], cc: 'IT' },
  'byzantion': { name: 'Byzantion (Istanbul)', at: [28.98, 41.01], cc: 'TR' },
  'cyrene': { name: 'Cyrene', at: [21.86, 32.82], cc: 'LY' },
  // Rome and Han
  'rome': { name: 'Rome', at: [12.48, 41.9], cc: 'IT' },
  'changan': { name: 'Chang\'an (Xi\'an)', at: [108.9, 34.3], cc: 'CN' },
  'luoyang': { name: 'Luoyang', at: [112.45, 34.62], cc: 'CN' },
  'dunhuang': { name: 'Dunhuang', at: [94.66, 40.14], cc: 'CN' },
  'kashgar': { name: 'Kashgar', at: [75.99, 39.47], cc: 'CN' },
  'merv': { name: 'Merv', at: [62.19, 37.66], cc: 'TM' },
  'ctesiphon': { name: 'Ctesiphon', at: [44.58, 33.09], cc: 'IQ' },
  'antioch': { name: 'Antioch', at: [36.16, 36.2], cc: 'TR' },
  'pataliputra': { name: 'Pataliputra (Patna)', at: [85.14, 25.61], cc: 'IN' },
  'meroe': { name: 'Meroë', at: [33.75, 16.94], cc: 'SD' },
  'aksum': { name: 'Aksum', at: [38.72, 14.13], cc: 'ET' },
  'nimes': { name: 'Nîmes', at: [4.36, 43.84], cc: 'FR' },
  // beliefs
  'lumbini': { name: 'Lumbini', at: [83.28, 27.47], cc: 'NP' },
  'bodh-gaya': { name: 'Bodh Gaya', at: [84.99, 24.7], cc: 'IN' },
  'sarnath': { name: 'Sarnath', at: [83.02, 25.38], cc: 'IN' },
  'qufu': { name: 'Qufu', at: [116.99, 35.6], cc: 'CN' },
  'jerusalem': { name: 'Jerusalem', at: [35.23, 31.78], cc: null },
  'anuradhapura': { name: 'Anuradhapura', at: [80.4, 8.35], cc: 'LK' },
  'etchmiadzin': { name: 'Vagharshapat (Armenia)', at: [44.29, 40.16], cc: 'AM' },
  'yungang': { name: 'Yungang', at: [113.13, 40.11], cc: 'CN' },
  'yazd': { name: 'Yazd', at: [54.37, 31.9], cc: 'IR' },
};

/** The [lon, lat] of a place in the table (throws on a typo, so a wrong id never becomes a silent "undefined"). */
export function at(id) {
  const p = PLACES[id];
  if (!p) throw new Error(`world-ancient: unknown place "${id}"`);
  return p.at;
}
/** A marker spec for a place: { id, at, label }. */
export const mark = (id, extra = {}) => ({ id, at: at(id), label: PLACES[id].name, ...extra });

/* ------------------------------------------------------------------ events */

// id: { text (reads as an event), when (hedged wording), year | ago, pm }
export const EVENTS = {
  // deep time and the peopling of the planet
  'sapiens': { text: 'The oldest known fossils of our species are laid down in Morocco', when: 'about 300,000 years ago', ago: 300000, pm: 40000 },
  'out-of-africa': { text: 'The main spread of our species out of Africa begins', when: 'roughly 70,000 to 50,000 years ago', ago: 60000, pm: 10000 },
  'australia': { text: 'People reach Australia by sea', when: 'at least 50,000 years ago', ago: 55000, pm: 10000 },
  'europe': { text: 'Our species settles in Europe', when: 'about 45,000 years ago', ago: 45000, pm: 4000 },
  'chauvet': { text: 'Lions are painted in Chauvet Cave, France', when: 'about 36,000 years ago', ago: 36000, pm: 2000 },
  'ice-peak': { text: 'The ice sheets of the last Ice Age reach their greatest size', when: 'about 20,000 years ago', ago: 21000, pm: 3000 },
  'americas': { text: 'People are living in the Americas', when: 'by at least 15,000 years ago, perhaps more than 20,000', ago: 19000, pm: 5000 },
  'austronesian': { text: 'Farmers from Taiwan sail south to the Philippines', when: 'about 4,000 to 5,000 years ago', year: -2500, pm: 600 },
  'lapita': { text: 'Lapita voyagers reach Tonga and Samoa', when: 'about 2,800 years ago', year: -850, pm: 150 },
  'madagascar': { text: 'Sailors from Borneo settle Madagascar', when: 'probably between 500 and 1000 CE', year: 750, pm: 300 },
  'hawaii': { text: 'Polynesians settle Hawaii', when: 'about 1000 to 1200 CE', year: 1100, pm: 150 },
  'rapa-nui': { text: 'Polynesians settle Rapa Nui (Easter Island)', when: 'about 1200 CE', year: 1200, pm: 100 },
  'aotearoa': { text: 'Polynesians settle Aotearoa New Zealand', when: 'about 1250 to 1300 CE', year: 1280, pm: 40 },
  'antarctica-seen': { text: 'Antarctica is seen for the first time', when: 'in 1820', year: 1820, pm: 0 },
  // farming
  'ice-age-ends': { text: 'The last Ice Age ends', when: 'about 11,700 years ago', year: -9700, pm: 100 },
  'gobekli': { text: 'Foragers raise the stone pillars of Göbekli Tepe', when: 'about 9500 BCE', year: -9500, pm: 300 },
  'fertile-crescent': { text: 'Wheat and barley are farmed in the Fertile Crescent', when: 'from about 9500 BCE (11,500 years ago)', year: -9500, pm: 600 },
  'catalhoyuk': { text: 'The farming town of Çatalhöyük is founded', when: 'about 7100 BCE', year: -7100, pm: 350 },
  'rice': { text: 'Rice is farmed along the Yangtze', when: 'about 9,000 years ago', year: -7000, pm: 1200 },
  'maize': { text: 'Maize is bred from wild teosinte in Mexico', when: 'about 9,000 years ago', year: -7000, pm: 1000 },
  'potato': { text: 'Potatoes are farmed in the Andes', when: 'perhaps 8,000 to 7,000 years ago', year: -5500, pm: 1500 },
  'kuk': { text: 'Taro and bananas are grown at Kuk in New Guinea', when: 'by about 7,000 years ago', year: -5000, pm: 1500 },
  'pearl-millet': { text: 'Pearl millet is farmed in the West African Sahel', when: 'about 4,500 years ago', year: -2500, pm: 500 },
  'sunflower': { text: 'Sunflowers are farmed in eastern North America', when: 'about 4,000 to 5,000 years ago', year: -2500, pm: 600 },
  'stonehenge': { text: 'The great stones of Stonehenge are raised', when: 'about 2500 BCE', year: -2500, pm: 200 },
  // river valleys
  'uruk-city': { text: 'Uruk grows into the first big city', when: 'about 3500 to 3100 BCE', year: -3300, pm: 200 },
  'egypt-unified': { text: 'Egypt is united under one king', when: 'about 3100 BCE', year: -3100, pm: 150 },
  'pyramid': { text: 'The Great Pyramid of Giza is built', when: 'about 2560 BCE', year: -2560, pm: 60 },
  'caral': { text: 'The great mounds of Caral are built in Peru', when: 'about 2600 BCE', year: -2600, pm: 300 },
  'indus-peak': { text: 'The Indus cities are at their height', when: 'about 2600 to 1900 BCE', year: -2250, pm: 350 },
  'mammoth': { text: 'The last woolly mammoths die out on Wrangel Island', when: 'about 4,000 years ago (2000 BCE)', year: -2000, pm: 300 },
  'hammurabi': { text: 'Hammurabi of Babylon has his laws carved in stone', when: 'about 1754 BCE', year: -1754, pm: 40 },
  'shang-anyang': { text: 'Shang kings rule from Anyang and consult oracle bones', when: 'from about 1250 BCE', year: -1250, pm: 80 },
  'olmec': { text: 'The Olmec carve colossal stone heads in Mexico', when: 'from about 1200 BCE', year: -1100, pm: 200 },
  'cleopatra': { text: 'Cleopatra, the last pharaoh of Egypt, dies', when: 'in 30 BCE', year: -30, pm: 0 },
  // writing
  'cuneiform': { text: 'Scribes in Uruk keep accounts on clay tablets', when: 'about 3300 BCE', year: -3300, pm: 150 },
  'hieroglyphs': { text: 'The first Egyptian hieroglyphs are written', when: 'about 3200 BCE', year: -3200, pm: 150 },
  'enheduanna': { text: 'Enheduanna, the first author known by name, writes her hymns', when: 'about 2300 BCE', year: -2300, pm: 60 },
  'sinai-alphabet': { text: 'Workers in Sinai scratch the first alphabetic signs', when: 'between about 1900 and 1500 BCE', year: -1700, pm: 200 },
  'oracle-bones': { text: 'Questions are carved on oracle bones in China', when: 'about 1250 BCE', year: -1250, pm: 80 },
  'phoenician': { text: 'Phoenician traders use an alphabet of 22 letters', when: 'about 1050 BCE', year: -1050, pm: 100 },
  'greek-alphabet': { text: 'The Greeks add vowels to the alphabet', when: 'about 800 BCE', year: -800, pm: 60 },
  'maya-writing': { text: 'Maya scribes paint glyphs at San Bartolo', when: 'about 300 BCE', year: -300, pm: 100 },
  'rosetta-carved': { text: 'The decree on the Rosetta Stone is carved', when: 'in 196 BCE', year: -196, pm: 0 },
  'last-hieroglyphs': { text: 'The last known hieroglyphs are carved, at Philae', when: 'in 394 CE', year: 394, pm: 0 },
  'champollion': { text: 'Champollion announces that he can read hieroglyphs', when: 'in 1822', year: 1822, pm: 0 },
  // Persia and Greece
  'olympics': { text: 'The first Olympic Games are held (by tradition)', when: 'in 776 BCE', year: -776, pm: 0 },
  'cyrus-babylon': { text: 'Cyrus of Persia takes Babylon', when: 'in 539 BCE', year: -539, pm: 0 },
  'athens-democracy': { text: 'Athens begins its democracy', when: 'about 508 BCE', year: -508, pm: 2 },
  'marathon': { text: 'Athenians defeat a Persian army at Marathon', when: 'in 490 BCE', year: -490, pm: 0 },
  'salamis': { text: 'A Greek fleet defeats the Persian fleet at Salamis', when: 'in 480 BCE', year: -480, pm: 0 },
  'parthenon': { text: 'The Parthenon is built in Athens', when: '447 to 432 BCE', year: -440, pm: 8 },
  'socrates': { text: 'Socrates is put to death in Athens', when: 'in 399 BCE', year: -399, pm: 0 },
  'alexander-king': { text: 'Alexander becomes king of Macedon', when: 'in 336 BCE', year: -336, pm: 0 },
  'alexander-dies': { text: 'Alexander dies in Babylon', when: 'in 323 BCE', year: -323, pm: 0 },
  'eratosthenes': { text: 'Eratosthenes measures the size of the Earth', when: 'about 240 BCE', year: -240, pm: 15 },
  'gandhara-art': { text: 'Sculptors in Gandhara carve the Buddha in a Greek-influenced style', when: 'in the first to third centuries CE', year: 150, pm: 100 },
  // Rome and Han (and their neighbours)
  'roman-republic': { text: 'Rome becomes a republic (by tradition)', when: 'in 509 BCE', year: -509, pm: 0 },
  'ashoka': { text: 'Ashoka rules the Maurya Empire in India', when: 'about 268 to 232 BCE', year: -250, pm: 18 },
  'qin': { text: 'The First Emperor of Qin unites China', when: 'in 221 BCE', year: -221, pm: 0 },
  'han-begins': { text: 'The Han dynasty begins', when: 'in 206 BCE', year: -206, pm: 4 },
  'zhang-qian': { text: 'The Han envoy Zhang Qian sets out for Central Asia', when: 'about 138 BCE', year: -138, pm: 2 },
  'augustus': { text: 'Augustus becomes the first Roman emperor', when: 'in 27 BCE', year: -27, pm: 0 },
  'cai-lun': { text: 'Cai Lun presents improved paper to the Han court', when: 'in 105 CE', year: 105, pm: 0 },
  'rome-peak': { text: 'The Roman Empire reaches its greatest size, under Trajan', when: 'in 117 CE', year: 117, pm: 0 },
  'han-ends': { text: 'The Han dynasty falls', when: 'in 220 CE', year: 220, pm: 0 },
  'gupta': { text: 'The Gupta Empire is founded in northern India', when: 'about 320 CE', year: 320, pm: 5 },
  'west-rome-ends': { text: 'The last Roman emperor in the west is deposed', when: 'in 476 CE', year: 476, pm: 0 },
  // beliefs
  'rigveda': { text: 'The oldest hymns of the Vedas are composed', when: 'about 1500 to 1200 BCE', year: -1350, pm: 200 },
  'temple-destroyed': { text: 'Babylon destroys the Temple in Jerusalem', when: 'in 586 BCE', year: -586, pm: 1 },
  'confucius': { text: 'Confucius teaches in northern China', when: 'about 500 BCE (he lived 551 to 479 BCE)', year: -500, pm: 25 },
  'buddha': { text: 'The Buddha teaches in northern India', when: 'in the fifth century BCE (the exact dates are uncertain)', year: -450, pm: 60 },
  'jesus': { text: 'Jesus of Nazareth teaches and is crucified', when: 'about 30 CE', year: 30, pm: 3 },
  'buddhism-china': { text: 'Buddhism is first recorded in China', when: 'in the first century CE', year: 65, pm: 40 },
  'armenia': { text: 'The king of Armenia adopts Christianity', when: 'in the early 300s CE (301 by tradition)', year: 308, pm: 8 },
  'constantine': { text: 'Constantine makes Christianity legal in the Roman Empire', when: 'in 313 CE', year: 313, pm: 0 },
  'ezana': { text: 'King Ezana of Aksum becomes a Christian', when: 'about 330 CE', year: 333, pm: 15 },
  'theodosius': { text: 'Christianity becomes the official religion of the Roman Empire', when: 'in 380 CE', year: 380, pm: 0 },
  'yungang': { text: 'Giant Buddhas are carved at Yungang in northern China', when: 'about 460 to 490 CE', year: 475, pm: 20 },
};

/** The calendar year of an event (deep-time entries are converted from "years ago"). */
export function yearOf(id) {
  const e = EVENTS[id];
  if (!e) throw new Error(`world-ancient: unknown event "${id}"`);
  return Number.isFinite(e.year) ? e.year : NOW - e.ago;
}
/** The earliest and latest year the mainstream estimates allow for an event. */
export const rangeOf = (id) => [yearOf(id) - EVENTS[id].pm, yearOf(id) + EVENTS[id].pm];

/**
 * Is event `a` earlier than event `b` beyond reasonable dispute? Their ranges of estimates must be at least
 * `gap` years apart, and (for deep time) `a` must lie at least `ratio` times as far back as `b`.
 */
export function clearlyBefore(a, b, { gap = 100, ratio = 1 } = {}) {
  const hiA = rangeOf(a)[1];
  const loB = rangeOf(b)[0];
  return loB - hiA >= gap && (NOW - hiA) >= ratio * (NOW - loB);
}

const upper = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/**
 * An `order` step: `n` events from the pool, each clearly earlier than the next. `fallback` is a chain that is
 * known to work, used if the random search does not find one.
 */
export function orderEvents(rng, pool, { n = 4, gap = 100, ratio = 1, fallback } = {}) {
  let chain = null;
  for (let tries = 0; tries < 60 && !chain; tries++) {
    const pick = rng.sample(pool, n).sort((p, q) => yearOf(p) - yearOf(q));
    if (pick.every((id, i) => i === 0 || clearlyBefore(pick[i - 1], id, { gap, ratio }))) chain = pick;
  }
  if (!chain) chain = fallback.slice();
  return {
    items: chain.map((id) => EVENTS[id].text),
    labels: ['Earliest', 'Latest'],
    explain: chain.map((id) => `- ${EVENTS[id].text}: **${EVENTS[id].when}**`).join('\n'),
    ids: chain,
  };
}

/* ------------------------------------------------------- map question builders */

const LETTERS = 'ABCDEF';

/**
 * "Which marker shows …?" on a map. `pool` is a list of { place, ask, about }:
 *   place  id in PLACES        ask    completes "Which marker shows …?"        about  one sentence shown afterwards
 * `n` markers are drawn at least `minKm` apart, and one of them is asked for.
 */
export function markerQuiz(rng, pool, { view, n = 4, minKm = 800, alt, extra = {} } = {}) {
  let chosen = null;
  for (let tries = 0; tries < 80 && !chosen; tries++) {
    const pick = rng.sample(pool, n);
    const ok = pick.every((p, i) => pick.every((q, j) => j <= i || distanceKm(at(p.place), at(q.place)) >= minKm));
    if (ok) chosen = pick;
  }
  if (!chosen) chosen = pool.slice(0, n);
  // west to east, so that the letters A, B, C … read across the map
  chosen = chosen.slice().sort((p, q) => at(p.place)[0] - at(q.place)[0]);
  const target = rng.pick(chosen);
  const letter = (p) => LETTERS[chosen.indexOf(p)];
  return {
    text: `Which marker shows **${target.ask}**?`,
    widget: {
      type: 'world-map', view, mode: 'pickMarker', markerLabels: 'after', answer: target.place,
      markers: chosen.map((p) => ({ id: p.place, at: at(p.place), label: PLACES[p.place].name })),
      alt: alt || 'A map with lettered markers and no names.',
      ...extra,
    },
    check: (s) => {
      if (s.picked === target.place) return true;
      const hit = chosen.find((p) => p.place === s.picked);
      return hit ? `Marker ${letter(hit)} is ${PLACES[hit.place].name}: ${hit.about}` : false;
    },
    solution: { picked: target.place },
    explain: `Marker ${letter(target)} is **${PLACES[target.place].name}**. ${upper(target.about)}`,
    target: target.place,
    shown: chosen.map((p) => p.place),
  };
}

/**
 * "Tap the modern country where … stood." `pool` is a list of { place, ask, hint, about, own }; the answer is the
 * place's `cc` (`own` describes that country when it is tapped as a wrong answer: "the land of the Nile"). `pickable` limits what can be tapped (codes or region names).
 */
export function countryQuiz(rng, pool, { view, pickable, alt, extra = {} } = {}) {
  const target = rng.pick(pool);
  const cc = PLACES[target.place].cc;
  const others = pool.filter((p) => PLACES[p.place].cc !== cc);
  return {
    text: `**Tap the modern country** in which you would find ${target.ask}.`,
    widget: { type: 'world-map', view, mode: 'pick', pickable, answer: cc, alt: alt || 'A map without names.', ...extra },
    check: (s) => {
      if (s.picked === cc) return true;
      if (!s.picked) return false;
      const hit = others.find((p) => PLACES[p.place].cc === s.picked);
      return `That is ${s.nameThe || s.name}${hit && hit.own ? `, ${hit.own}` : ''}. ${upper(target.hint)}`;
    },
    solution: { picked: cc },
    explain: upper(target.about),
    target: target.place,
    cc,
  };
}

/* ------------------------------------------------------------ rough outlines */

// The Roman Empire at its greatest extent, under Trajan in 117 CE. A rough outline for shading on a map:
// never ask a question that turns on its exact edge.
export const ROME_117 = [[-9.3, 43.2], [-4.8, 48.5], [-5.5, 50], [-5, 52], [-3.2, 55], [-1.5, 55], [1.7, 52.7], [4.2, 52], [6.8, 51], [8.5, 50], [10.5, 48.8], [13.5, 48.5], [17, 48], [19, 47.8], [22, 48], [26, 47.5], [28, 45.5], [29.7, 45.2], [28, 42], [33, 42], [37, 41.2], [41.5, 41.5], [45, 41], [47, 39.5], [47.5, 31], [48, 30], [44, 31.5], [40, 32], [37, 28.5], [35, 28], [35, 24], [33, 24], [29, 24], [25, 29.5], [20, 30], [15, 30.5], [10, 32], [8, 34], [4, 34.5], [-2, 34], [-6, 33.5], [-7.5, 33.5], [-6, 35.9], [-9, 37], [-9.5, 39]];
// The empire in the fourth century CE: without Trajan's short-lived conquests beyond the Euphrates and
// without Dacia, north of the Danube, which was given up in the 270s.
export const ROME_LATE = [[-9.3, 43.2], [-4.8, 48.5], [-5.5, 50], [-5, 52], [-3.2, 55], [-1.5, 55], [1.7, 52.7], [4.2, 52], [6.8, 51], [8.5, 50], [10.5, 48.8], [13.5, 48.5], [17, 48], [19, 47.8], [19, 45.2], [22.5, 44.6], [25, 43.7], [28, 44.2], [29.7, 45.2], [28, 42], [33, 42], [37, 41.2], [41.2, 41.3], [41.5, 39], [41, 37], [39.5, 34.5], [38.5, 32], [37, 29.5], [35, 28], [35, 24], [33, 24], [29, 24], [25, 29.5], [20, 30], [15, 30.5], [10, 32], [8, 34], [4, 34.5], [-2, 34], [-6, 33.5], [-7.5, 33.5], [-6, 35.9], [-9, 37], [-9.5, 39]];

/* ------------------------------------------------------------- course tables */

// Where the founding crops and animals were first farmed. Only entries with one clear home are listed
// (beans, squash, chilli peppers, pigs, cattle and cotton were domesticated in more than one of these regions,
// so they are left out).
export const ORIGINS = [
  { id: 'sw-asia', region: 'the Fertile Crescent of south-west Asia', short: 'South-west Asia', place: 'fertile-crescent', items: ['wheat', 'barley', 'lentils', 'sheep', 'goats'] },
  { id: 'china', region: 'China', short: 'China', place: 'yangtze-rice', items: ['rice', 'soybeans', 'foxtail millet'] },
  { id: 'mesoamerica', region: 'Mexico', short: 'Mexico', place: 'balsas', items: ['maize', 'turkeys'] },
  { id: 'andes', region: 'the Andes of South America', short: 'The Andes', place: 'titicaca', items: ['potatoes', 'quinoa', 'llamas'] },
  { id: 'new-guinea', region: 'New Guinea', short: 'New Guinea', place: 'kuk-swamp', items: ['bananas', 'sugar cane'] },
  { id: 'africa', region: 'Africa south of the Sahara', short: 'Africa south of the Sahara', place: 'sahel', items: ['sorghum', 'pearl millet'] },
  { id: 'eastern-na', region: 'eastern North America', short: 'Eastern North America', place: 'eastern-woodlands', items: ['sunflowers'] },
];
const ANIMALS = new Set(['sheep', 'goats', 'turkeys', 'llamas']);

/** A choice about where a crop or an animal was first farmed, in one of two forms. Returns step fields. */
export function originQuiz(rng) {
  const home = rng.pick(ORIGINS);
  const item = rng.pick(home.items);
  const away = rng.sample(ORIGINS.filter((o) => o.id !== home.id), 3);
  const verb = item === 'turkeys' ? 'kept' : ANIMALS.has(item) ? 'herded' : 'grown';
  const line = `${upper(item)}: first ${verb} in ${home.region}.`;
  if (rng.bool()) {
    return {
      text: `Which of these was first farmed in **${home.region}**?`,
      options: rng.shuffle([
        { text: upper(item), correct: true },
        ...away.map((o) => { const it = rng.pick(o.items); return { text: upper(it), why: `${upper(it)}: first ${it === 'turkeys' ? 'kept' : ANIMALS.has(it) ? 'herded' : 'grown'} in ${o.region}.` }; }),
      ]),
      explain: `${line} Farming began independently in at least seven regions, each with its own plants and animals.`,
      item, home: home.id,
    };
  }
  return {
    text: ANIMALS.has(item) ? `Where did people first keep ${item === 'turkeys' ? 'flocks' : 'herds'} of **${item}**?` : `Where did farmers first grow **${item}**?`,
    options: rng.shuffle([
      { text: home.short, correct: true },
      ...away.map((o) => ({ text: o.short, why: `Farmers in ${o.region} began with other species: ${o.items.join(', ')}.` })),
    ]),
    explain: `${line} Farming began independently in at least seven regions, each with its own plants and animals.`,
    item, home: home.id,
  };
}

// The traditions of the last lesson, each with clues that fit it and no other in the list.
export const TRADITIONS = [
  { id: 'hinduism', name: 'Hinduism', place: 'sarnath', about: 'Hinduism has no single founder. It grew over many centuries from the Vedas and later teachings in India.', clues: [
    'It grew out of the Vedas, the oldest sacred texts of India, and has no single founder.',
    'Its teachings include dharma (right conduct) and moksha, release from the cycle of rebirth, and its oldest texts are the Vedas.',
  ] },
  { id: 'buddhism', name: 'Buddhism', place: 'bodh-gaya', about: 'Buddhism follows the teaching of Siddhartha Gautama, the Buddha, who lived in northern India, probably in the fifth century BCE.', clues: [
    'Its followers seek to end suffering by following the Eightfold Path taught by Siddhartha Gautama.',
    'It began with a teacher in northern India whose title means "the awakened one", and it was carried along trade routes to Central Asia and China.',
  ] },
  { id: 'confucianism', name: 'Confucianism', place: 'qufu', about: 'Confucianism follows Kong Qiu (Confucius, 551 to 479 BCE), who taught in northern China.', clues: [
    'It follows a teacher from the state of Lu who taught humaneness, respect within the family, ritual and learning.',
    'Its sayings were collected by students in the Analects, and Han emperors made it the training of their officials.',
  ] },
  { id: 'daoism', name: 'Daoism', place: 'luoyang', about: 'Daoism grew from Chinese texts of about the fourth and third centuries BCE, above all the Daodejing.', clues: [
    'Its best-known text, the Daodejing, teaches living in harmony with the Way.',
    'It values simplicity and "not forcing" (wu wei), and its classic text is linked by tradition to Laozi.',
  ] },
  { id: 'zoroastrianism', name: 'Zoroastrianism', place: 'yazd', about: 'Zoroastrianism follows the prophet Zarathustra (Zoroaster), who taught among the ancient Iranians, perhaps before 1000 BCE.', clues: [
    'Its followers worship Ahura Mazda and follow the teachings of the prophet Zarathustra.',
    'It began among the ancient Iranians and asks its followers for "good thoughts, good words, good deeds".',
  ] },
  { id: 'judaism', name: 'Judaism', place: 'jerusalem', about: 'Judaism is the religion of the Jewish people, who trace their covenant with one God back to Abraham and Moses.', clues: [
    'Its followers hold to a covenant between one God and the people of Israel, with the Torah at its centre.',
    'After its Temple in Jerusalem was destroyed, its communities gathered around synagogues, rabbis and the study of the Torah.',
  ] },
  { id: 'christianity', name: 'Christianity', place: 'jerusalem', about: 'Christianity began among the followers of Jesus of Nazareth in the first century CE.', clues: [
    'Its followers believe that Jesus of Nazareth is the Christ (the Messiah) and the Son of God.',
    'It began as a movement among Jews in Roman-ruled Judaea and became the official religion of the Roman Empire in 380 CE.',
  ] },
];

/** "Which tradition is this?" from one clue. Returns step fields. */
export function traditionQuiz(rng) {
  const t = rng.pick(TRADITIONS);
  const clue = rng.pick(t.clues);
  const others = rng.sample(TRADITIONS.filter((o) => o.id !== t.id), 3);
  return {
    text: `**Which tradition is this?**\n\n> ${clue}`,
    options: rng.shuffle([{ text: t.name, correct: true }, ...others.map((o) => ({ text: o.name, why: o.about }))]),
    explain: t.about,
    tradition: t.id,
  };
}
