/**
 * Helpers shared by the lessons of "Crossroads: 500 to 1500".
 *
 * One table of places and one of dated events feed every map, timeline and
 * generated question of the course, so that a correction is made once.
 * tests/world-crossroads-course.test.mjs holds an independent copy of the key
 * facts and checks these tables against it.
 *
 * Coordinates are [longitude, latitude] (east and north positive).
 */

import { photo } from '../../media.js';
import { MEDIA } from '../../media/world-crossroads/index.js';

/* ====================================================================== pictures */

/**
 * A picture of this course as a figure: pic('lalibela', { alt, caption }). The pictures are in
 * content/media/world-crossroads/ (added with tools/fetch-image.mjs); an unknown id throws.
 */
export function pic(id, opts = {}) {
  if (!MEDIA[id]) throw new Error(`helpers: no picture "${id}" in content/media/world-crossroads`);
  return photo(MEDIA[id], opts);
}

/* ====================================================================== places */

/**
 * id: { name (as the lessons call it), at, country (ISO code of the modern state it lies in),
 *       clue (how to find it on a map, without naming it), fact (one sentence for the feedback) }
 */
export const PLACES = {
  // --- the land and sea routes of Afro-Eurasia
  changan: { name: 'Chang\'an', at: [108.94, 34.27], country: 'CN', clue: 'the Tang capital at the eastern end of the land routes, far inland in northern China', fact: 'Chang\'an (today Xi\'an) was the Tang capital and, in the 700s, probably the largest city in the world.' },
  dunhuang: { name: 'Dunhuang', at: [94.66, 40.14], country: 'CN', clue: 'the oasis where the road from China splits to pass the Taklamakan Desert on both sides', fact: 'At Dunhuang the road forked north and south of the Taklamakan Desert. Its cave temples are full of Buddhist paintings.' },
  kashgar: { name: 'Kashgar', at: [75.99, 39.47], country: 'CN', clue: 'the oasis at the western end of the Taklamakan Desert, below the high passes, where the two desert roads meet again', fact: 'At Kashgar the northern and southern desert roads met again before the climb over the mountains to Central Asia.' },
  samarkand: { name: 'Samarkand', at: [66.96, 39.65], country: 'UZ', clue: 'the Sogdian merchants\' great city in Central Asia, between the rivers Amu Darya and Syr Darya', fact: 'Samarkand, in what is now Uzbekistan, was the home city of the Sogdian merchants who ran much of the caravan trade.' },
  bukhara: { name: 'Bukhara', at: [64.42, 39.77], country: 'UZ' },
  merv: { name: 'Merv', at: [62.19, 37.66], country: 'TM' },
  baghdad: { name: 'Baghdad', at: [44.37, 33.31], country: 'IQ', clue: 'the caliphs\' capital on the Tigris, where the Tigris and the Euphrates run closest together', fact: 'Baghdad, founded in 762 on the Tigris in what is now Iraq, linked the land roads to the ships of the Gulf.' },
  constantinople: { name: 'Constantinople', at: [28.98, 41.01], country: 'TR', clue: 'the city on the narrow strait between the Black Sea and the Mediterranean, where Europe and Asia almost touch', fact: 'Constantinople (today Istanbul) guarded the Bosporus, the gate between the Black Sea and the Mediterranean.' },
  antioch: { name: 'Antioch', at: [36.16, 36.2], country: 'TR' },
  guangzhou: { name: 'Guangzhou', at: [113.26, 23.13], country: 'CN', clue: 'China\'s great southern port, on the coast of the South China Sea', fact: 'Guangzhou was China\'s main port for the ships of the "Southern Sea"; Arab and Persian merchants had their own quarter there.' },
  quanzhou: { name: 'Quanzhou', at: [118.68, 24.87], country: 'CN' },
  malacca: { name: 'Malacca', at: [102.25, 2.19], country: 'MY', clue: 'the port on the narrow strait between the Malay Peninsula and Sumatra, which every ship between India and China had to pass', fact: 'Malacca grew rich in the 1400s on the narrow strait that every ship between the Indian Ocean and China had to pass.' },
  calicut: { name: 'Calicut', at: [75.78, 11.26], country: 'IN', clue: 'the pepper port on the south-west coast of India', fact: 'Calicut (today Kozhikode), on India\'s pepper coast, was the meeting point of ships from Arabia and from the east.' },
  hormuz: { name: 'Hormuz', at: [56.46, 27.06], country: 'IR', clue: 'the port at the narrow mouth of the Persian Gulf', fact: 'Hormuz stood at the mouth of the Persian Gulf, the sea road to Baghdad.' },
  aden: { name: 'Aden', at: [45.03, 12.79], country: 'YE', clue: 'the port at the south-western corner of Arabia, by the entrance to the Red Sea', fact: 'Aden, in what is now Yemen, guarded the entrance to the Red Sea, the sea road to Egypt.' },
  kilwa: { name: 'Kilwa', at: [39.51, -8.96], country: 'TZ', clue: 'the Swahili island city on the coast of East Africa, south of the equator', fact: 'Kilwa, on an island off what is now Tanzania, was the richest Swahili city: gold from the south passed through its harbour.' },
  mombasa: { name: 'Mombasa', at: [39.66, -4.04], country: 'KE' },
  mogadishu: { name: 'Mogadishu', at: [45.34, 2.04], country: 'SO' },
  sofala: { name: 'Sofala', at: [34.73, -20.15], country: 'MZ' },
  cairo: { name: 'Cairo', at: [31.24, 30.04], country: 'EG', clue: 'the great city on the Nile, just above its delta', fact: 'Cairo, on the Nile, was the largest city of Africa and the gathering place of pilgrim caravans for Mecca.' },
  venice: { name: 'Venice', at: [12.34, 45.44], country: 'IT', clue: 'the merchant city on islands at the head of the Adriatic Sea, in northern Italy', fact: 'Venice, built on islands at the head of the Adriatic, was Europe\'s chief market for the goods of Asia.' },

  // --- the Islamic world
  mecca: { name: 'Mecca', at: [39.83, 21.42], country: 'SA', clue: 'the pilgrimage city in western Arabia, a little inland from the Red Sea', fact: 'Mecca, where Muhammad was born about 570, lies in western Arabia about 70 km from the Red Sea.' },
  medina: { name: 'Medina', at: [39.61, 24.47], country: 'SA' },
  damascus: { name: 'Damascus', at: [36.29, 33.51], country: 'SY' },
  cordoba: { name: 'Córdoba', at: [-4.78, 37.89], country: 'ES', clue: 'the capital of al-Andalus, in the south of the Iberian Peninsula', fact: 'Córdoba, in southern Spain, was the capital of al-Andalus and about the year 1000 one of the largest cities in Europe.' },
  bejaia: { name: 'Béjaïa', at: [5.08, 36.75], country: 'DZ' },
  pisa: { name: 'Pisa', at: [10.4, 43.72], country: 'IT' },

  // --- Africa
  timbuktu: { name: 'Timbuktu', at: [-3.0, 16.77], country: 'ML', clue: 'the city of scholars where the River Niger bends up to touch the Sahara', fact: 'Timbuktu, in what is now Mali, stood where the Niger meets the desert: boats from the south met camels from the north.' },
  gao: { name: 'Gao', at: [-0.04, 16.27], country: 'ML' },
  koumbi: { name: 'Koumbi Saleh', at: [-7.97, 15.77], country: 'MR' },
  taghaza: { name: 'Taghaza', at: [-5.0, 23.6], country: 'ML', clue: 'the salt mines deep in the Sahara, about halfway between the Niger and Morocco', fact: 'At Taghaza, in the middle of the Sahara, salt was cut from the ground in slabs. Even the houses were built of salt blocks.' },
  sijilmasa: { name: 'Sijilmasa', at: [-4.28, 31.28], country: 'MA' },
  greatzimbabwe: { name: 'Great Zimbabwe', at: [30.93, -20.27], country: 'ZW', clue: 'the stone-walled capital on the high plateau of southern Africa, inland between the Zambezi and the Limpopo', fact: 'Great Zimbabwe stands on the plateau between the Zambezi and the Limpopo, in the country that took its name.' },
  lalibela: { name: 'Lalibela', at: [39.04, 12.03], country: 'ET', clue: 'the town of rock-cut churches in the highlands of the Horn of Africa', fact: 'Lalibela lies about 2,500 metres up in the highlands of Ethiopia.' },
  ife: { name: 'Ife', at: [4.56, 7.47], country: 'NG', clue: 'the Yoruba city of the metal heads, in the forest country near the Gulf of Guinea', fact: 'Ife, in what is now south-western Nigeria, is the sacred city of the Yoruba people.' },

  // --- East Asia
  kaifeng: { name: 'Kaifeng', at: [114.31, 34.8], country: 'CN', clue: 'the Northern Song capital on the plain of the Yellow River', fact: 'Kaifeng, on the Yellow River plain, was the Northern Song capital, a city of about a million people.' },
  hangzhou: { name: 'Hangzhou', at: [120.16, 30.27], country: 'CN', clue: 'the Southern Song capital near the coast, at the southern end of the Grand Canal, a little south of the mouth of the Yangtze', fact: 'Hangzhou, at the southern end of the Grand Canal, became the Song capital after the north was lost in 1127.' },
  beijing: { name: 'Beijing', at: [116.4, 39.9], country: 'CN', clue: 'the city at the northern end of the Grand Canal, near the edge of the steppe', fact: 'Beijing, close to the steppe, became Kublai Khan\'s capital Dadu (also called Khanbaliq) and has been China\'s capital for most of the time since.' },
  yangzhou: { name: 'Yangzhou', at: [119.42, 32.39], country: 'CN' },
  kyoto: { name: 'Kyoto', at: [135.77, 35.01], country: 'JP', clue: 'the capital of Heian Japan, on the largest Japanese island', fact: 'Kyoto (Heian-kyo) was laid out in 794 on a grid copied from Chang\'an, and stayed the emperor\'s home for a thousand years.' },
  kaesong: { name: 'Kaesong', at: [126.55, 37.97], country: 'KP', clue: 'the capital of the Goryeo kingdom, in the middle of the Korean Peninsula', fact: 'Kaesong was the capital of Goryeo, the kingdom whose name became "Korea".' },
  thanglong: { name: 'Thang Long', at: [105.85, 21.03], country: 'VN', clue: 'the capital of independent Vietnam, on the Red River south of China', fact: 'Thang Long ("rising dragon"), today Hanoi, became the capital of independent Vietnam in 1010.' },

  // --- Europe
  rome: { name: 'Rome', at: [12.5, 41.9], country: 'IT', clue: 'the city of the popes, halfway down the Italian peninsula', fact: 'Rome, once the capital of an empire, was in these centuries the seat of the pope, head of the Latin church.' },
  aachen: { name: 'Aachen', at: [6.08, 50.78], country: 'DE', clue: 'Charlemagne\'s capital, near the Rhine in the far west of today\'s Germany', fact: 'Aachen, where Germany, Belgium and the Netherlands meet today, was Charlemagne\'s favourite residence. His palace chapel still stands.' },
  paris: { name: 'Paris', at: [2.35, 48.86], country: 'FR', clue: 'the university city on the Seine, in the north of France', fact: 'Paris, on the Seine, had the most famous university north of the Alps and, by 1300, perhaps 200,000 people.' },
  chartres: { name: 'Chartres', at: [1.49, 48.45], country: 'FR' },
  kyiv: { name: 'Kyiv', at: [30.52, 50.45], country: 'UA', clue: 'the capital of the Rus on the River Dnieper, on the Viking road from the Baltic to the Black Sea', fact: 'Kyiv, on the Dnieper, grew up on the river road between Scandinavia and Constantinople and took its Christianity from the Byzantines in 988.' },
  novgorod: { name: 'Novgorod', at: [31.27, 58.52], country: 'RU' },
  birka: { name: 'Birka', at: [17.55, 59.33], country: 'SE' },
  lindisfarne: { name: 'Lindisfarne', at: [-1.8, 55.67], country: 'GB' },
  dublin: { name: 'Dublin', at: [-6.26, 53.35], country: 'IE' },
  bergen: { name: 'Western Norway', at: [5.32, 60.39], country: 'NO' },
  iceland: { name: 'Iceland', at: [-21.9, 64.15], country: 'IS' },
  greenland: { name: 'Greenland settlements', at: [-45.5, 61.0], country: 'GL' },
  lanse: { name: 'L\'Anse aux Meadows', at: [-55.53, 51.6], country: 'CA' },

  // --- the Mongol world
  karakorum: { name: 'Karakorum', at: [102.83, 47.2], country: 'MN', clue: 'the first capital of the Mongol Empire, on the open steppe north of the Gobi Desert', fact: 'Karakorum, in the grasslands of central Mongolia, was the empire\'s first capital. Envoys from France to Korea met there.' },
  sarai: { name: 'Sarai', at: [47.4, 47.2], country: 'RU' },
  tabriz: { name: 'Tabriz', at: [46.29, 38.08], country: 'IR' },
  kaffa: { name: 'Kaffa', at: [35.38, 45.03], country: null },
  messina: { name: 'Messina', at: [15.55, 38.19], country: 'IT' },
  tangier: { name: 'Tangier', at: [-5.8, 35.77], country: 'MA', clue: 'Ibn Battuta\'s home town, on the African side of the Strait of Gibraltar', fact: 'Tangier, in Morocco, faces Spain across the Strait of Gibraltar. Ibn Battuta set out from here in 1325.' },
  delhi: { name: 'Delhi', at: [77.21, 28.61], country: 'IN', clue: 'the sultans\' capital on the plain of northern India', fact: 'Delhi was the capital of a Muslim sultanate that held off the Mongols. Ibn Battuta worked there as a judge for about eight years.' },
  issykkul: { name: 'Lake Issyk-Kul', at: [77.3, 42.4], country: 'KG' },
  alexandria: { name: 'Alexandria', at: [29.92, 31.2], country: 'EG' },
  marseille: { name: 'Marseille', at: [5.37, 43.3], country: 'FR' },

  // --- the Americas
  tenochtitlan: { name: 'Tenochtitlan', at: [-99.13, 19.43], country: 'MX', clue: 'the Mexica island capital in a high valley in the middle of today\'s Mexico', fact: 'Tenochtitlan stood on an island in Lake Texcoco, 2,240 metres up. Mexico City covers it today.' },
  tikal: { name: 'Tikal', at: [-89.62, 17.22], country: 'GT', clue: 'the Maya city in the lowland rainforest at the base of the Yucatán Peninsula', fact: 'Tikal, in the rainforest of what is now northern Guatemala, was one of the greatest Classic Maya cities.' },
  cusco: { name: 'Cusco', at: [-71.97, -13.53], country: 'PE', clue: 'the Inca capital, high in the Andes of South America, south of the equator', fact: 'Cusco, 3,400 metres up in the Andes of Peru, was the centre from which the four great Inca roads set out.' },
  quito: { name: 'Quito', at: [-78.47, -0.18], country: 'EC' },
  santiago: { name: 'Santiago', at: [-70.67, -33.45], country: 'CL' },
  cahokia: { name: 'Cahokia', at: [-90.06, 38.66], country: 'US', clue: 'the city of earth mounds beside the Mississippi, in the middle of North America', fact: 'Cahokia stood on the Mississippi flood plain, across the river from today\'s St Louis.' },
  mesaverde: { name: 'Mesa Verde', at: [-108.47, 37.18], country: 'US', clue: 'the cliff dwellings of the dry plateau country of the North American south-west', fact: 'Mesa Verde is in the "Four Corners" country of the south-western United States, in today\'s Colorado.' },
};

/** A marker for the map widget from the places table. */
export function mk(id, opts = {}) {
  const p = PLACES[id];
  if (!p) throw new Error(`helpers: unknown place "${id}"`);
  return { id, at: p.at, label: p.name, ...opts };
}
/** The coordinates of a place. */
export const at = (id) => {
  const p = PLACES[id];
  if (!p) throw new Error(`helpers: unknown place "${id}"`);
  return p.at;
};

/** The compass direction (one of eight) in which `to` lies from `from`, on a small map. */
export function compass(from, to) {
  const dx = (((to[0] - from[0] + 540) % 360) - 180) * Math.cos(((from[1] + to[1]) / 2) * Math.PI / 180);
  const dy = to[1] - from[1];
  const names = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  const angle = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;       // 0 = north, 90 = east
  return names[Math.round(angle / 45) % 8];
}

/**
 * The `check` of a pin-placing step: right within `km` of the place; otherwise a sentence that
 * says how far off the pin is and in which direction (the map widget's state has `pin`, `placed`, `km`).
 */
export function pinCheck(id, km, hint = '') {
  const p = PLACES[id];
  return (s) => {
    if (!s.placed) return 'Move the pin first: drag it, or tap the map.';
    if (s.km <= km) return true;
    const far = s.km >= 1000 ? `${Math.round(s.km / 100) * 100}` : `${Math.round(s.km / 10) * 10}`;
    return `Your pin is about ${far} km too far ${compass(p.at, s.pin)}. ${hint}`.trim();
  };
}

/* ====================================================================== events */

/**
 * id: { year (CE), circa (true when the date is approximate or traditional), text (a line that
 *       makes sense on its own, without the year), short (for timelines) }
 */
export const EVENTS = {
  hagiasophia: { year: 537, text: 'Hagia Sophia is completed in Constantinople', short: 'Hagia Sophia' },
  tang: { year: 618, text: 'The Tang dynasty begins in China', short: 'Tang dynasty begins' },
  hijra: { year: 622, text: 'The Hijra: Muhammad and his followers move from Mecca to Medina', short: 'The Hijra' },
  iberia: { year: 711, text: 'A Muslim army crosses from North Africa into Spain', short: 'Muslim army enters Spain' },
  abbasids: { year: 750, text: 'The Abbasid caliphs take power from the Umayyads', short: 'Abbasid caliphs' },
  baghdad: { year: 762, text: 'Baghdad is founded as the capital of the Abbasid caliphs', short: 'Baghdad founded' },
  lindisfarne: { year: 793, text: 'Vikings raid the monastery of Lindisfarne', short: 'Viking raid on Lindisfarne' },
  charlemagne: { year: 800, text: 'Charlemagne is crowned emperor in Rome', short: 'Charlemagne crowned' },
  algebra: { year: 820, circa: true, text: 'Al-Khwarizmi writes his book on algebra in Baghdad', short: 'Al-Khwarizmi\'s algebra' },
  diamondsutra: { year: 868, text: 'The Diamond Sutra, the oldest dated printed book, is printed in China', short: 'Diamond Sutra printed' },
  song: { year: 960, text: 'The Song dynasty begins in China', short: 'Song dynasty begins' },
  vinland: { year: 1000, circa: true, text: 'Norse sailors build a camp in Newfoundland, North America', short: 'Norse in North America' },
  genji: { year: 1010, circa: true, text: 'Murasaki Shikibu writes *The Tale of Genji* in Japan', short: 'The Tale of Genji' },
  movabletype: { year: 1040, circa: true, text: 'Bi Sheng invents printing with movable type in China', short: 'Bi Sheng\'s movable type' },
  schism: { year: 1054, text: 'The churches of Rome and Constantinople break apart', short: 'Church splits east and west' },
  crusade: { year: 1095, text: 'The pope calls the First Crusade', short: 'First Crusade called' },
  cahokia: { year: 1100, circa: true, text: 'Cahokia, the city of mounds on the Mississippi, is at its height', short: 'Cahokia at its height' },
  fibonacci: { year: 1202, text: 'Fibonacci\'s book teaches Italian merchants the Hindu-Arabic numerals', short: 'Fibonacci\'s book' },
  chinggis: { year: 1206, text: 'Temüjin is proclaimed Chinggis (Genghis) Khan', short: 'Chinggis Khan proclaimed' },
  sundiata: { year: 1235, circa: true, text: 'Sundiata founds the empire of Mali', short: 'Mali founded' },
  baghdadfalls: { year: 1258, text: 'A Mongol army destroys Baghdad', short: 'Mongols destroy Baghdad' },
  songfalls: { year: 1279, text: 'Kublai Khan completes the conquest of Song China', short: 'Kublai conquers the Song' },
  musa: { year: 1324, text: 'Mansa Musa of Mali makes his pilgrimage to Mecca', short: 'Mansa Musa\'s pilgrimage' },
  tenochtitlan: { year: 1325, circa: true, text: 'The Mexica found Tenochtitlan on an island in a lake', short: 'Tenochtitlan founded' },
  blackdeath: { year: 1347, text: 'The Black Death reaches Europe', short: 'Black Death reaches Europe' },
  ming: { year: 1368, text: 'The Ming dynasty drives the Mongol rulers out of China', short: 'Ming dynasty begins' },
  inca: { year: 1438, circa: true, text: 'Pachacuti begins the great expansion of the Inca state', short: 'Inca expansion begins' },
  hangul: { year: 1443, text: 'King Sejong\'s scholars create hangul, the Korean alphabet', short: 'Hangul created' },
  constantinople: { year: 1453, text: 'Constantinople falls to the Ottomans', short: 'Constantinople falls' },
  columbus: { year: 1492, text: 'Columbus crosses the Atlantic', short: 'Columbus sails' },
};

/** "762" or "about 820": the year of an event as the lessons write it. */
export const when = (id) => {
  const e = EVENTS[id];
  if (!e) throw new Error(`helpers: unknown event "${id}"`);
  return `${e.circa ? 'about ' : ''}${e.year}`;
};
/** An event for the timeline widget. */
export function ev(id, opts = {}) {
  const e = EVENTS[id];
  if (!e) throw new Error(`helpers: unknown event "${id}"`);
  return { id, year: e.year, label: e.short, ...opts };
}
/** Upper-case the first letter (event lines start with a capital already; place clues do not). */
export const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/* ====================================================================== routes and outlines */

const P = (id) => PLACES[id].at;

/** The land roads from Chang'an to the Mediterranean, as the map widget's `points`. */
export const LAND_TRUNK_EAST = [P('changan'), [103.83, 36.06], [102.64, 37.93], [100.45, 38.93], [98.29, 39.77], P('dunhuang')];
export const LAND_NORTH_BRANCH = [P('dunhuang'), [93.51, 42.83], [89.18, 42.95], [82.96, 41.72], [80.26, 41.17], P('kashgar')];
export const LAND_SOUTH_BRANCH = [P('dunhuang'), [88.97, 39.23], [82.69, 37.07], [79.93, 37.11], [77.24, 38.41], P('kashgar')];
export const LAND_TRUNK_WEST = [P('kashgar'), [72.8, 40.53], [70.94, 40.53], P('samarkand'), P('bukhara'), P('merv'), [58.8, 36.21], [51.44, 35.6], [48.51, 34.8], P('baghdad'), [40.0, 35.0], [37.16, 36.2], P('antioch')];
export const LAND_TO_CONSTANTINOPLE = [P('antioch'), [34.6, 37.0], [32.48, 37.87], [30.5, 39.8], P('constantinople')];
export const LAND_TO_INDIA = [P('merv'), [66.9, 36.76], [69.17, 34.53], [72.8, 33.75], [77.21, 28.61]];

/** The sea road from south China to the Gulf, the Red Sea and East Africa (points kept offshore). */
export const SEA_CHINA_INDIA = [P('guangzhou'), [113.6, 21.6], [111.8, 17.5], [110.2, 12.5], [107.5, 7.5], [104.8, 1.6], [103.4, 1.1], P('malacca'), [100.2, 3.6], [97.6, 5.6], [95.0, 6.2], [88.0, 6.0], [81.8, 5.4], [77.4, 7.4], [75.9, 9.6], P('calicut')];
export const SEA_INDIA_GULF = [P('calicut'), [72.0, 14.5], [66.0, 19.5], [61.0, 23.6], [58.2, 25.2], [56.6, 26.4], P('hormuz'), [54.2, 26.0], [52.0, 26.9], [50.3, 28.6], [48.9, 29.8], [47.9, 30.4]];
export const SEA_INDIA_ADEN = [P('calicut'), [70.0, 12.3], [60.0, 13.0], [52.0, 12.9], [47.0, 12.4], P('aden')];
export const SEA_RED_SEA = [P('aden'), [43.4, 12.5], [42.2, 15.0], [39.8, 18.5], [37.6, 22.5], [35.3, 26.0], [34.0, 27.5], [33.25, 28.4], [32.75, 29.3], [32.56, 29.9]];
export const SEA_EAST_AFRICA = [P('aden'), [48.0, 12.3], [52.3, 12.4], [52.1, 10.0], [50.4, 6.0], [47.4, 2.8], P('mogadishu'), [43.7, -0.9], [41.3, -3.1], P('mombasa'), [40.0, -6.4], P('kilwa')];
export const SEA_KILWA_SOFALA = [P('kilwa'), [40.3, -9.4], [41.1, -10.9], [41.4, -12.8], [40.9, -16.2], [37.8, -18.9], P('sofala')];

/** The Taklamakan Desert, roughly (the basin between the Tian Shan and the Kunlun mountains). */
export const TAKLAMAKAN = [[77.5, 39.6], [81, 40.6], [85, 40.9], [88.5, 40.2], [88.2, 38.8], [84, 37.8], [80.5, 37.6], [78, 38.2]];

/** The lands under the caliphs about 750, roughly. One outline, clockwise from north-western Iberia. */
export const CALIPHATE_750 = [
  [-9, 42], [-3, 42.6], [3, 42.6], [0.6, 40], [-0.4, 38], [-2, 36.7], [-5.3, 36.1], [-5.3, 35.8], [-2, 35.3], [3, 37], [10, 37.5], [11.2, 33.5],
  [15, 32.5], [20, 32.9], [25, 32], [30, 31.6], [34.2, 31.3], [35.5, 34], [36, 36.9], [38, 37.8], [41, 38.8], [44.5, 41.5], [48.5, 42], [49.5, 40.3],
  [49, 37.6], [54, 37], [55, 40], [59, 42.8], [68, 43], [73, 41], [72, 37], [68, 34], [72.5, 31], [71, 26], [68.5, 23.6], [62, 25], [57.5, 25.5],
  [59.8, 22.5], [58, 19], [55, 17], [52, 15.5], [45, 12.6], [43.2, 13], [42, 16.5], [39, 21], [36.5, 25.5], [34.8, 28.4], [33.4, 28], [35.5, 23.5],
  [32.9, 24], [30, 24.5], [29.5, 29], [24.5, 29.5], [19, 29.5], [14, 30], [9, 30.5], [4, 31.5], [-2, 31.5], [-6, 30], [-9.8, 29.5], [-9.8, 31.5],
  [-6.8, 34], [-6, 35.7], [-6, 36.2], [-9, 37],
];

/** The eastern Roman (Byzantine) empire at the death of Justinian in 565, roughly, in four pieces. */
export const JUSTINIAN_565 = [
  // the Balkans, Anatolia, Syria and Egypt
  [[19.3, 41.9], [19, 44.8], [22.5, 44.7], [28.5, 45.3], [29.6, 45], [28, 43.5], [27.5, 42.5], [29, 41.3], [33, 42.1], [38, 41.2], [41.6, 41.6], [42.5, 40], [42, 37.5], [40.5, 37], [41, 35], [38.5, 33], [36.5, 30], [35, 29.5], [34.8, 28], [33.5, 28], [35.3, 24.2], [33, 24], [30.5, 24.2], [28, 28.5], [24.5, 30.5], [20.5, 30.3], [19.8, 31.8], [21, 33], [25, 32], [30, 31.6], [34.2, 31.3], [35.7, 35.3], [36, 36.6], [33, 36], [30.5, 36.2], [27.8, 36.6], [26.2, 39.3], [26.5, 40.4], [23.9, 39.9], [24, 38], [22.9, 36.4], [21.5, 37], [20, 39.6]],
  // Italy and the islands
  [[7.5, 43.9], [7, 45.5], [10, 46.3], [13.5, 46.3], [13.8, 45.6], [12.3, 44.8], [13.6, 43.5], [16.2, 41.8], [18.5, 40.2], [17, 40.4], [16.6, 38.8], [15.6, 37.9], [15.3, 36.7], [12.4, 37.7], [13.3, 38.3], [15.6, 38.3], [15.6, 40], [12.5, 41.4], [10.5, 42.9], [10.2, 43.9]],
  [[8.2, 39], [8.3, 41.2], [9.8, 41.2], [9.6, 39.1]],
  // Africa and the south of Spain
  [[-5.8, 35.9], [-2, 35.3], [3, 37], [10, 37.5], [11.2, 33.5], [15, 32.5], [19.8, 30.8], [15, 31], [10.5, 32.5], [9, 34.5], [5, 35], [-2, 34.3], [-5.5, 35.2]],
  [[-7.2, 37.1], [-5.3, 36.1], [-2, 36.7], [-0.6, 38.2], [-1.2, 38.4], [-3, 37.4], [-5.5, 37], [-7, 37.6]],
];

/** The four Mongol states about 1294, roughly. Their edges were never sharp lines. */
export const GOLDEN_HORDE = [[29, 45.5], [26, 49], [31, 53], [38, 57.5], [50, 59], [65, 60], [75, 58], [75, 48], [62, 44], [58, 45.5], [53, 45], [50, 43.5], [47.5, 42], [44, 43.5], [39.5, 43.6], [37, 45.2], [33.5, 46], [30.5, 46.5]];
export const ILKHANATE = [[41.5, 41.6], [45, 41.3], [47.5, 42], [49.5, 40.3], [49, 37.6], [54, 37], [54.5, 40], [58.5, 42], [62.5, 39.5], [66, 37.3], [69, 35], [68, 30.5], [66.5, 25.5], [61, 25.2], [57, 26.8], [51.5, 27.8], [48.8, 30.3], [45.5, 30.5], [41.5, 34.5], [38.5, 36.8], [36, 36.6], [32, 36.3], [31, 39.5], [31, 41.3], [36, 41.7]];
export const CHAGATAI = [[62, 44], [75, 48], [83, 49], [90, 46], [92, 42], [88, 38.5], [80, 36], [76, 36.5], [74, 36.5], [71.5, 34], [69, 35], [66, 37.3], [62.5, 39.5], [58.5, 42]];
export const YUAN = [[83, 49], [88, 52], [95, 56], [108, 56], [120, 54], [133, 53], [140, 52.5], [138, 47], [132.5, 43], [130.5, 42.5], [128, 41.7], [124.4, 40], [121.5, 39], [122, 37], [120.5, 34], [122, 30.5], [120, 26.5], [116.5, 23], [110.5, 21], [108, 21.7], [105.5, 23], [100, 22], [98, 25], [97.5, 28], [92, 27.5], [86, 28], [80, 30.5], [78.5, 34.5], [80, 36], [88, 38.5], [92, 42], [90, 46]];

/** The Inca state (Tawantinsuyu) about 1525, roughly: the Andes and the Pacific coast. */
export const INCA_1525 = [[-78.5, 1.3], [-80.3, 0.2], [-80.8, -2.2], [-81.2, -4.6], [-79.7, -7.4], [-77.3, -12], [-76.2, -14.2], [-72.6, -16.9], [-70.5, -18.4], [-70.2, -23], [-70.9, -28], [-71.6, -32], [-72.4, -35.5], [-69.8, -35.3], [-68.2, -32.5], [-66.3, -28], [-64.6, -24.5], [-64.6, -20.5], [-65.6, -18], [-67.8, -15], [-70.3, -13.2], [-73, -10], [-75.6, -7.3], [-77.5, -4], [-77.2, -0.5], [-77, 1]];

/* ====================================================================== generated questions */

/**
 * "Which marker is …?" on a map: the target and some other places of the pool, with the names
 * hidden until the step is answered. Returns the fields of an `interact` step.
 *
 * pool: place ids that all have a `clue` and a `fact`, and that lie far enough apart on `view`.
 */
export function findOnMap(rng, { pool, view, count = 5, alt, extra = {} }) {
  const target = rng.pick(pool);
  const others = rng.sample(pool.filter((id) => id !== target), count - 1);
  const ids = [target, ...others].sort((a, b) => PLACES[a].at[0] - PLACES[b].at[0]);   // west to east: the letters A, B, C …
  const p = PLACES[target];
  const letter = (id) => String.fromCharCode(65 + ids.indexOf(id));
  return {
    text: `Find **${p.name}**: ${p.clue}. **Tap its marker.**`,
    widget: {
      type: 'world-map', dots: false, view, mode: 'pickMarker', markerLabels: 'after', answer: target,
      markers: ids.map((id) => mk(id, { color: 'orange' })),
      alt: alt || 'A map with unnamed markers',
      ...extra,
    },
    check: (s) => s.picked === target || (s.picked && PLACES[s.picked] ? `Marker ${letter(s.picked)} is ${PLACES[s.picked].name}. Read the clue again: ${p.clue}.` : false),
    solution: { picked: target },
    hints: [`${cap(p.clue)}.`],
    explain: `Marker ${letter(target)}. ${p.fact}`,
    target,          // for the tests
    ids,
  };
}

/** Ids from `pool` in order of date, each at least `minGap` years after the one before. */
function spacedEvents(rng, pool, n, minGap) {
  for (let tries = 0; tries < 200; tries++) {
    const ids = rng.sample(pool, n).sort((a, b) => EVENTS[a].year - EVENTS[b].year);
    if (ids.every((id, i) => i === 0 || EVENTS[id].year - EVENTS[ids[i - 1]].year >= minGap)) return ids;
  }
  throw new Error('helpers: no spaced set of events in this pool');
}

/** An `order` step: n events of the pool, at least minGap years apart, earliest first. */
export function orderEvents(rng, { pool, n = 4, minGap = 50 }) {
  const ids = spacedEvents(rng, pool, n, minGap);
  return {
    text: 'Put these in order, **earliest first**.',
    items: ids.map((id) => EVENTS[id].text),
    labels: ['Earliest', 'Latest'],
    explain: ids.map((id) => `- **${cap(when(id))}**: ${EVENTS[id].text}`).join('\n'),
    ids,
  };
}

/** A two-option `choice` step: which of two events, at least minGap years apart, came first? */
export function whichFirst(rng, { pool, minGap = 100 }) {
  const [first, second] = spacedEvents(rng, pool, 2, minGap);
  const gap = EVENTS[second].year - EVENTS[first].year;
  const options = [
    { text: EVENTS[first].text, correct: true },
    { text: EVENTS[second].text, why: `That was ${when(second)}, about ${Math.round(gap / 10) * 10} years after the other.` },
  ];
  return {
    text: '**Which came first?**',
    options: rng.shuffle(options),
    shuffle: false,
    columns: 1,
    explain: `**First** (${when(first)}): ${EVENTS[first].text}.\n\n**About ${Math.round(gap / 10) * 10} years later** (${when(second)}): ${EVENTS[second].text}.`,
    first,
    second,
  };
}

/**
 * A `choice` step drawn from a table of rows { name, clue, more }: "Who / which …?" with the
 * row's clue as the question and the names of other rows as the wrong options. Every clue must
 * be true of its own row only.
 */
export function pickFromTable(rng, { rows, ask, count = 4 }) {
  const row = rng.pick(rows);
  const others = rng.sample(rows.filter((x) => x !== row && x.name !== row.name), count - 1);
  return {
    text: ask(row),
    options: rng.shuffle([
      { text: row.name, correct: true },
      ...others.map((o) => ({ text: o.name, why: o.more })),
    ]),
    shuffle: false,
    explain: row.more,
    row,
  };
}

/* ---- lesson 1: caravan cities and sea ports */

export const OASES = ['samarkand', 'kashgar', 'dunhuang', 'bukhara', 'merv'];
export const PORTS = ['calicut', 'malacca', 'kilwa', 'guangzhou', 'aden', 'hormuz'];

/** "Which of these four was a sea port / a caravan city?": three of one kind and one of the other. */
export function portOrOasis(rng) {
  const wantPort = rng.bool();
  const right = rng.pick(wantPort ? PORTS : OASES);
  const wrong = rng.sample(wantPort ? OASES : PORTS, 3);
  const land = (id) => `${PLACES[id].name} was a caravan city of the land routes, far from any sea.`;
  const sea = (id) => `${PLACES[id].name} was a sea port of the monsoon routes.`;
  return {
    text: wantPort
      ? 'Three of these were caravan cities on the land routes across Central Asia. **Which one was a sea port** of the Indian Ocean trade?'
      : 'Three of these were sea ports of the Indian Ocean trade. **Which one was a caravan city** on the land routes across Central Asia?',
    options: rng.shuffle([
      { text: PLACES[right].name, correct: true },
      ...wrong.map((id) => ({ text: PLACES[id].name, why: wantPort ? land(id) : sea(id) })),
    ]),
    shuffle: false,
    explain: `${wantPort ? sea(right) : land(right)} ${wantPort ? 'Ships sailed with the monsoon winds between ports such as Kilwa, Aden, Hormuz, Calicut, Malacca and Guangzhou.' : 'Caravans crossed the deserts from oasis to oasis: Dunhuang, Kashgar, Samarkand, Bukhara, Merv.'}`,
    wantPort,
    right,
  };
}

/* ---- lesson 2: scholars of the Islamic world */

// `brief` is the line of the lesson's teaching table; `clue` is the question; `more` the feedback.

export const SCHOLARS = [
  { name: 'Al-Khwarizmi', brief: 'Algebra, and the word "algorithm" (Baghdad, about 820)', clue: 'wrote, in Baghdad about 820, the book that gave algebra its name, and whose own name became the word "algorithm"', more: 'Al-Khwarizmi worked in Baghdad about 820. *Al-jabr* in the title of his book became "algebra", and the Latin form of his name became "algorithm".' },
  { name: 'Ibn al-Haytham', brief: 'Experiments on light and sight (Cairo, about 1020)', clue: 'showed by experiment, in Cairo about 1020, that we see because light travels from objects into the eye', more: 'Ibn al-Haytham (Latin: Alhazen) wrote his *Book of Optics* in Cairo about 1020. He tested ideas about light with experiments in a darkened room.' },
  { name: 'Ibn Sina', brief: 'The *Canon of Medicine*, taught in Europe for five centuries', clue: 'wrote the *Canon of Medicine*, which was still a textbook in European universities five hundred years later', more: 'Ibn Sina (Latin: Avicenna), born near Bukhara, finished his *Canon of Medicine* in 1025. It was taught in Europe into the 1600s.' },
  { name: 'Hunayn ibn Ishaq', brief: 'A Christian physician; translator of Greek science in Baghdad', clue: 'was a Christian physician in Baghdad who translated Greek medical and scientific books into Arabic and Syriac', more: 'Hunayn ibn Ishaq, a Christian from Iraq, was the most famous translator of ninth-century Baghdad. He hunted for the best Greek manuscripts before translating.' },
  { name: 'Al-Idrisi', brief: 'The most detailed world map of its time (Sicily, 1154)', clue: 'drew, for the Christian king of Sicily in 1154, the most detailed world map of its time', more: 'Al-Idrisi, born in Ceuta, made his world map and geography for King Roger II of Sicily in 1154. His maps put south at the top.' },
  { name: 'Fatima al-Fihri', brief: 'By tradition, founder of the mosque-university of Fez (859)', clue: 'is remembered as the woman who, in 859, paid for the mosque at Fez that grew into the university of al-Qarawiyyin', more: 'Fatima al-Fihri, a merchant\'s daughter, is said to have founded the Qarawiyyin mosque at Fez, in Morocco, in 859. It grew into one of the oldest places of higher learning still at work.' },
];

/* ---- lesson 3: places of medieval Africa */

export const AFRICA_SITES = [
  { name: 'Timbuktu', what: 'A city of scholars and books where the Niger meets the Sahara' },
  { name: 'Taghaza', what: 'Salt mines in the middle of the desert' },
  { name: 'Kilwa', what: 'A Swahili island port that shipped gold across the Indian Ocean' },
  { name: 'Great Zimbabwe', what: 'A capital with huge curving walls of stone laid without mortar' },
  { name: 'Lalibela', what: 'Churches cut downward out of solid rock' },
  { name: 'Ife', what: 'Lifelike heads cast in copper alloy' },
  { name: 'Koumbi Saleh', what: 'The capital of ancient Ghana (Wagadu)' },
];

/** A `match` step: four of the African sites with what each is known for. */
export function africaMatch(rng) {
  const rows = rng.sample(AFRICA_SITES, 4);
  return {
    text: 'Match each place with what it is known for.',
    pairs: rows.map((row) => [row.name, row.what]),
    explain: 'West Africa\'s trading cities faced the Sahara, the Swahili ports faced the Indian Ocean, and the highlands of Ethiopia and the plateau of Zimbabwe built in stone.',
    rows,
  };
}

/* ---- lesson 6: people of the Mongol age */

export const MONGOL_AGE_PEOPLE = [
  { name: 'Chinggis Khan', clue: 'united the peoples of the Mongolian steppe and was proclaimed their ruler in 1206', more: 'Temüjin united the steppe peoples and in 1206 was proclaimed Chinggis (Genghis) Khan.' },
  { name: 'Kublai Khan', clue: 'was the grandson of the empire\'s founder who completed the conquest of China and ruled it from Dadu, today\'s Beijing', more: 'Kublai, a grandson of Chinggis, founded the Yuan dynasty and finished the conquest of Song China in 1279.' },
  { name: 'Hülegü', clue: 'led the Mongol army that destroyed Baghdad in 1258', more: 'Hülegü, another grandson of Chinggis, destroyed Baghdad in 1258 and founded the Ilkhanate in Persia.' },
  { name: 'Marco Polo', clue: 'was a merchant\'s son from Venice who spent about seventeen years in Kublai Khan\'s China', more: 'Marco Polo left Venice in 1271 and came home in 1295. His book made China famous in Europe.' },
  { name: 'Ibn Battuta', clue: 'left Tangier in 1325 and travelled about 117,000 km, from West Africa to China', more: 'Ibn Battuta of Tangier travelled for almost thirty years through nearly the whole Islamic world and beyond.' },
  { name: 'Rabban Sauma', clue: 'was a Christian monk from near Beijing who travelled west and met the kings of France and England in 1287 and 1288', more: 'Rabban Sauma, a monk of the Church of the East born near Beijing, went to Europe as an envoy of the Mongol ruler of Persia.' },
  { name: 'Timur', clue: 'built a new empire from Samarkand between 1370 and 1405, long after the united Mongol Empire had broken up', more: 'Timur (Tamerlane), a Turkic-speaking Muslim ruler who claimed the Mongol inheritance, conquered from Delhi to Ankara and made Samarkand his splendid capital.' },
];

/* ---- lesson 7: the Americas */

export const AMERICAN_PEOPLES = ['The Maya', 'The Mexica (Aztecs)', 'The Inca', 'The people of Cahokia', 'The Ancestral Puebloans'];
export const AMERICAN_TRAITS = [
  { people: 0, clue: 'wrote in glyphs and counted in twenties, with a sign for zero', more: 'The Maya had a full writing system and a base-20 place-value system with a zero.' },
  { people: 0, clue: 'built Tikal, Palenque and Copán, rival city-states in the rainforest', more: 'Tikal, Palenque and Copán were Classic Maya city-states, each with its own king.' },
  { people: 1, clue: 'built their capital on an island in a lake and grew food on *chinampas*, garden plots built up from the lake bed', more: 'The Mexica built Tenochtitlan on an island in Lake Texcoco and farmed chinampas around it.' },
  { people: 1, clue: 'spoke Nahuatl, the language that gave us the words "tomato", "chocolate" and "avocado"', more: 'Nahuatl was the language of the Mexica: *tomatl*, *chocolatl* and *ahuacatl* came into Spanish and then English.' },
  { people: 2, clue: 'kept the accounts of a huge state on knotted cords called quipus', more: 'Inca officials recorded numbers, and perhaps more, with knots on the cords of a quipu.' },
  { people: 2, clue: 'tied the Andes together with about 40,000 km of roads, crossed by relay runners', more: 'The Inca road system, the Qhapaq Ñan, ran for about 40,000 km. Relay runners called *chaskis* carried messages along it.' },
  { people: 3, clue: 'raised more than a hundred earth mounds beside the Mississippi, the largest with a base bigger than the Great Pyramid\'s', more: 'Cahokia, at its height about 1100, had more than a hundred mounds. Monks Mound covers about 6 hectares.' },
  { people: 4, clue: 'built stone villages into the cliffs of Mesa Verde and great houses in Chaco Canyon', more: 'The Ancestral Puebloans built the great houses of Chaco Canyon and, later, the cliff dwellings of Mesa Verde. Today\'s Pueblo peoples are their descendants.' },
];

/** "Which people …?": one trait, its people as the right answer, three other peoples as wrong ones. */
export function whichPeople(rng) {
  const trait = rng.pick(AMERICAN_TRAITS);
  const others = rng.sample(AMERICAN_PEOPLES.map((_, i) => i).filter((i) => i !== trait.people), 3);
  return {
    text: `Which people ${trait.clue}?`,
    options: rng.shuffle([
      { text: AMERICAN_PEOPLES[trait.people], correct: true },
      ...others.map((i) => ({ text: AMERICAN_PEOPLES[i] })),
    ]),
    shuffle: false,
    columns: 1,
    explain: trait.more,
    trait,
  };
}

/* ====================================================================== Maya numerals */

/** One Maya digit (0 to 19) as SVG, centred on cx with its baseline at `bottom`. */
function mayaDigit(n, cx, bottom) {
  if (!Number.isInteger(n) || n < 0 || n > 19) throw new Error(`helpers: a Maya digit is 0 to 19, got ${n}`);
  let out = '';
  if (n === 0) {
    // the shell that stands for "nothing here"
    const cy = bottom - 20;
    out += `<path class="fill-yellow-soft stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M${cx - 34} ${cy}Q${cx} ${cy - 30} ${cx + 34} ${cy}Q${cx} ${cy + 30} ${cx - 34} ${cy}Z"/>`;
    out += `<path class="stroke-ink fill-none" stroke-width="2" stroke-linecap="round" d="M${cx - 14} ${cy - 11}V${cy + 11}M${cx} ${cy - 14}V${cy + 14}M${cx + 14} ${cy - 11}V${cy + 11}"/>`;
    return out;
  }
  const bars = Math.floor(n / 5);
  const dots = n % 5;
  let y = bottom;
  for (let b = 0; b < bars; b++) {
    out += `<rect class="fill-orange stroke-ink" stroke-width="2.5" x="${cx - 40}" y="${y - 10}" width="80" height="10" rx="5"/>`;
    y -= 15;
  }
  if (dots) {
    const gap = 22;
    const x0 = cx - ((dots - 1) * gap) / 2;
    for (let d = 0; d < dots; d++) out += `<circle class="fill-blue stroke-ink" stroke-width="2.5" cx="${x0 + d * gap}" cy="${y - 9}" r="6.5"/>`;
  }
  return out;
}

/**
 * A Maya number as a figure for the `svg` widget: `digits` from the top level down, for example
 * [2, 8] is 2 twenties and 8 ones (48). One or two levels only: the third level of the Maya
 * calendar count was 18 x 20, not 20 x 20, and the lessons do not go there.
 */
export function mayaNumber(digits, { labels = true, alt } = {}) {
  if (!Array.isArray(digits) || digits.length < 1 || digits.length > 2) throw new Error('helpers: mayaNumber takes one or two levels');
  const levelH = 84;
  const width = labels ? 250 : 130;
  const height = digits.length * levelH + 12;
  const cx = 66;
  let content = '';
  digits.forEach((d, i) => {
    const top = 6 + i * levelH;
    content += `<rect class="fill-surface stroke-hair" stroke-width="2" x="6" y="${top}" width="120" height="${levelH - 6}" rx="12"/>`;
    content += mayaDigit(d, cx, top + levelH - 16);
    if (labels) content += `<text class="fig-label text-muted" x="140" y="${top + levelH / 2 + 2}">${i === digits.length - 1 ? 'ones' : 'twenties'}</text>`;
  });
  return {
    type: 'svg', viewBox: `0 0 ${width} ${height}`, maxWidth: labels ? 300 : 160,
    alt: alt || `A Maya number written in ${digits.length} level${digits.length > 1 ? 's' : ''}, from the top: ${digits.map(mayaWords).join('; ')}.`,
    content,
  };
}

/** A Maya digit in words: "2 bars and 3 dots", "a shell". */
export const mayaWords = (d) => (d === 0 ? 'a shell' : [d >= 5 ? `${Math.floor(d / 5)} bar${d >= 10 ? 's' : ''}` : '', d % 5 ? `${d % 5} dot${d % 5 > 1 ? 's' : ''}` : ''].filter(Boolean).join(' and '));

/**
 * The figure that introduces Maya numbers: seven single signs with our numerals under them, and
 * below them one two-level number (2 twenties and 8 ones) worked out.
 */
export function mayaPrimer() {
  const cell = 104;
  const rows = [[1, 4, 5, 7], [13, 19, 0]];
  let content = '';
  rows.forEach((row, r) => row.forEach((v, i) => {
    const x = 4 + i * cell;
    const y = 4 + r * 122;
    content += `<rect class="fill-surface stroke-hair" stroke-width="2" x="${x + 2}" y="${y}" width="${cell - 8}" height="82" rx="12"/>`;
    content += mayaDigit(v, x + cell / 2 - 2, y + 68);
    content += `<text class="fig-label" x="${x + cell / 2 - 2}" y="${y + 106}" text-anchor="middle">${v}</text>`;
  }));
  // the worked example: 2 twenties over 8 ones
  const ox = 70;
  const oy = 262;
  [[2, 'twenties: 2 × 20 = 40'], [8, 'ones: 8']].forEach(([d, label], i) => {
    const top = oy + i * 84;
    content += `<rect class="fill-surface stroke-hair" stroke-width="2" x="${ox}" y="${top}" width="120" height="78" rx="12"/>`;
    content += mayaDigit(d, ox + 60, top + 68);
    content += `<text class="fig-label text-muted" x="${ox + 134}" y="${top + 44}">${label}</text>`;
  });
  content += `<text class="fig-label-lg" x="${ox + 134}" y="${oy + 84 * 2 + 22}">40 + 8 = 48</text>`;
  return {
    type: 'svg', viewBox: `0 0 ${4 * cell + 8} ${oy + 84 * 2 + 36}`, maxWidth: 440,
    alt: `Maya number signs. ${rows.flat().map((v) => `${v}: ${mayaWords(v)}`).join('. ')}. Below them, a number in two levels: 2 dots in the upper level, which counts twenties, and 1 bar and 3 dots in the lower level, which counts ones: 40 + 8 = 48.`,
    content,
  };
}

/** The value of a Maya number given as digits from the top level down (base 20). */
export const mayaValue = (digits) => digits.reduce((total, d) => total * 20 + d, 0);
