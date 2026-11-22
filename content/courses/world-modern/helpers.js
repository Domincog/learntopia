// The Modern World: 1750 to Today · shared tables and question builders.
//
// One table of places (longitude first!), one of dated events. Maps, timelines,
// "put in order" steps and generated questions are all built from these two
// tables, so a correction is made once. tests/world-modern-course.test.mjs keeps
// its own copy of the key dates and places and checks that the two agree.
import { countryName, distanceKm } from '../../../src/widgets/world-map.js';
import { photo } from '../../media.js';
import { MEDIA } from '../../media/world-modern/index.js';

/* ---------------------------------------------------------------- pictures */

/** A picture of this course as a figure: pic('watt-engine', { alt, caption }). Undefined while a picture has not been fetched yet. */
export const hasPic = (id) => !!MEDIA[id];
export const pic = (id, opts) => (MEDIA[id] ? photo(MEDIA[id], opts) : undefined);

/* ------------------------------------------------------------------ places */

/** name, [longitude, latitude], ISO code of the modern country ('' = open sea). */
export const PLACES = {
  // Britain's industrial towns
  manchester: { name: 'Manchester', at: [-2.24, 53.48], country: 'GB' },
  liverpool: { name: 'Liverpool', at: [-2.98, 53.41], country: 'GB' },
  newcastle: { name: 'Newcastle', at: [-1.61, 54.98], country: 'GB' },
  birmingham: { name: 'Birmingham', at: [-1.9, 52.48], country: 'GB' },
  glasgow: { name: 'Glasgow', at: [-4.25, 55.86], country: 'GB' },
  london: { name: 'London', at: [-0.13, 51.51], country: 'GB' },
  // the Atlantic revolutions
  philadelphia: { name: 'Philadelphia', at: [-75.16, 39.95], country: 'US' },
  paris: { name: 'Paris', at: [2.35, 48.86], country: 'FR' },
  capHaitien: { name: 'Cap-Haïtien', at: [-72.2, 19.76], country: 'HT' },
  caracas: { name: 'Caracas', at: [-66.9, 10.49], country: 'VE' },
  bogota: { name: 'Bogotá', at: [-74.07, 4.71], country: 'CO' },
  quito: { name: 'Quito', at: [-78.47, -0.18], country: 'EC' },
  guayaquil: { name: 'Guayaquil', at: [-79.89, -2.19], country: 'EC' },
  lima: { name: 'Lima', at: [-77.04, -12.05], country: 'PE' },
  buenosAires: { name: 'Buenos Aires', at: [-58.38, -34.6], country: 'AR' },
  mendoza: { name: 'Mendoza', at: [-68.84, -32.89], country: 'AR' },
  santiago: { name: 'Santiago', at: [-70.67, -33.45], country: 'CL' },
  rio: { name: 'Rio de Janeiro', at: [-43.2, -22.91], country: 'BR' },
  dolores: { name: 'Dolores', at: [-100.93, 21.16], country: 'MX' },
  ayacucho: { name: 'Ayacucho', at: [-74.22, -13.16], country: 'PE' },
  // nations and empires
  berlin: { name: 'Berlin', at: [13.4, 52.52], country: 'DE' },
  guangzhou: { name: 'Guangzhou', at: [113.26, 23.13], country: 'CN' },
  nanjing: { name: 'Nanjing', at: [118.8, 32.06], country: 'CN' },
  delhi: { name: 'Delhi', at: [77.21, 28.61], country: 'IN' },
  adwa: { name: 'Adwa', at: [38.9, 14.17], country: 'ET' },
  asmara: { name: 'Asmara', at: [38.93, 15.33], country: 'ER' },
  // the First World War
  sarajevo: { name: 'Sarajevo', at: [18.41, 43.86], country: 'BA' },
  stPetersburg: { name: 'St Petersburg', at: [30.32, 59.94], country: 'RU' },
  ypres: { name: 'Ypres', at: [2.89, 50.85], country: 'BE' },
  gallipoli: { name: 'Gallipoli', at: [26.45, 40.3], country: 'TR' },
  baghdad: { name: 'Baghdad', at: [44.37, 33.31], country: 'IQ' },
  tanga: { name: 'Tanga', at: [39.1, -5.07], country: 'TZ' },
  // the Second World War
  moscow: { name: 'Moscow', at: [37.62, 55.75], country: 'RU' },
  stalingrad: { name: 'Stalingrad', at: [44.52, 48.71], country: 'RU' },
  normandy: { name: 'Normandy', at: [-0.6, 49.35], country: 'FR' },
  elAlamein: { name: 'El Alamein', at: [28.95, 30.83], country: 'EG' },
  midway: { name: 'Midway', at: [-177.37, 28.21], country: '' },
  pearlHarbor: { name: 'Pearl Harbor', at: [-157.95, 21.36], country: 'US' },
  // the Cold War and decolonisation
  havana: { name: 'Havana', at: [-82.37, 23.11], country: 'CU' },
  seoul: { name: 'Seoul', at: [126.98, 37.57], country: 'KR' },
  hanoi: { name: 'Hanoi', at: [105.85, 21.03], country: 'VN' },
  bandung: { name: 'Bandung', at: [107.61, -6.92], country: 'ID' },
  accra: { name: 'Accra', at: [-0.19, 5.56], country: 'GH' },
  beijing: { name: 'Beijing', at: [116.4, 39.9], country: 'CN' },
  // the world since 1950
  suezCanal: { name: 'Suez Canal', at: [32.4, 30.5], country: 'EG' },
  panamaCanal: { name: 'Panama Canal', at: [-79.7, 9.1], country: 'PA' },
  malacca: { name: 'Strait of Malacca', at: [100.6, 3.2], country: '' },
  gibraltar: { name: 'Strait of Gibraltar', at: [-5.6, 35.95], country: '' },
  goodHope: { name: 'Cape of Good Hope', at: [18.47, -34.36], country: 'ZA' },
  shenzhen: { name: 'Shenzhen', at: [114.06, 22.54], country: 'CN' },
  shanghai: { name: 'Shanghai', at: [121.47, 31.23], country: 'CN' },
};

/** A map marker for a place of the table: marker('manchester', { color: 'red' }). */
export const marker = (id, extra = {}) => {
  const p = PLACES[id];
  if (!p) throw new Error(`world-modern: no place "${id}"`);
  return { id, at: p.at, label: p.name, ...extra };
};
export const at = (id) => marker(id).at;

/* ------------------------------------------------------------------ events */

/** year (and month, day where the order inside a year matters), a label for options and cards. */
export const EVENTS = {
  // Coal, Steam and Cotton
  newcomen: { year: 1712, label: 'Newcomen\'s steam engine pumps a mine' },
  wattPatent: { year: 1769, label: 'Watt patents his improved steam engine' },
  cottonGin: { year: 1793, label: 'Whitney\'s cotton gin' },
  stockton: { year: 1825, label: 'Stockton and Darlington Railway opens' },
  lmRailway: { year: 1830, label: 'Liverpool and Manchester Railway opens' },
  factoryAct: { year: 1833, label: 'Factory Act bans mill work by children under nine' },
  greatExhibition: { year: 1851, label: 'Great Exhibition in London' },
  atlanticCable: { year: 1866, label: 'Lasting telegraph cable across the Atlantic' },
  suezOpens: { year: 1869, label: 'Suez Canal opens' },
  japanRailway: { year: 1872, label: 'Japan\'s first railway opens' },
  // Liberty, Equality, Independence
  usDeclaration: { year: 1776, month: 7, day: 4, label: 'American Declaration of Independence' },
  usConstitution: { year: 1787, label: 'United States Constitution written' },
  bastille: { year: 1789, month: 7, day: 14, label: 'Storming of the Bastille' },
  haitiRising: { year: 1791, month: 8, label: 'Enslaved people rise in Saint-Domingue' },
  rightsOfWoman: { year: 1791, month: 9, label: 'Olympe de Gouges\'s Declaration of the Rights of Woman' },
  terror: { year: 1793, label: 'The Terror begins in France' },
  haitiIndependence: { year: 1804, month: 1, day: 1, label: 'Haiti declares independence' },
  napoleonEmperor: { year: 1804, month: 12, label: 'Napoleon crowns himself emperor' },
  napoleonSpain: { year: 1808, label: 'Napoleon occupies Spain' },
  hidalgo: { year: 1810, label: 'Hidalgo\'s call for Mexican independence' },
  andesCrossing: { year: 1817, label: 'San Martín\'s army crosses the Andes' },
  brazilIndependence: { year: 1822, month: 9, label: 'Brazil declares independence' },
  ayacucho: { year: 1824, month: 12, label: 'Battle of Ayacucho: Spain loses South America' },
  brazilAbolition: { year: 1888, label: 'Brazil abolishes slavery' },
  // Flags and Empires
  opiumWar: { year: 1839, label: 'First Opium War begins' },
  nanjingTreaty: { year: 1842, label: 'Treaty of Nanjing' },
  perry: { year: 1853, label: 'Perry\'s warships arrive in Japan' },
  indianUprising: { year: 1857, label: 'Great uprising in India' },
  italyUnified: { year: 1861, label: 'Kingdom of Italy proclaimed' },
  meiji: { year: 1868, label: 'Meiji Restoration in Japan' },
  germanyUnified: { year: 1871, label: 'German Empire proclaimed' },
  berlinConference: { year: 1884, month: 11, label: 'Berlin Conference on Africa opens' },
  adwa: { year: 1896, label: 'Ethiopia defeats Italy at Adwa' },
  japanBeatsRussia: { year: 1905, label: 'Japan defeats Russia' },
  congoAnnexed: { year: 1908, label: 'Belgium takes the Congo from Leopold II' },
  // The War That Ended Four Empires
  nzWomenVote: { year: 1893, label: 'Women win the vote in New Zealand' },
  sarajevo: { year: 1914, month: 6, day: 28, label: 'Archduke Franz Ferdinand shot in Sarajevo' },
  austriaDeclares: { year: 1914, month: 7, day: 28, label: 'Austria-Hungary declares war on Serbia' },
  russiaMobilises: { year: 1914, month: 7, day: 30, label: 'Russia mobilises its army to back Serbia' },
  germanyDeclares: { year: 1914, month: 8, day: 1, label: 'Germany declares war on Russia' },
  belgiumInvaded: { year: 1914, month: 8, day: 4, label: 'Germany invades Belgium; Britain declares war' },
  armenianGenocide: { year: 1915, month: 4, label: 'Armenian genocide begins' },
  somme: { year: 1916, month: 7, label: 'Battle of the Somme begins' },
  tsarAbdicates: { year: 1917, month: 3, label: 'Tsar Nicholas II abdicates' },
  usEntersWar: { year: 1917, month: 4, label: 'United States enters the war' },
  bolsheviks: { year: 1917, month: 11, label: 'Bolsheviks seize power in Russia' },
  armistice: { year: 1918, month: 11, day: 11, label: 'Armistice ends the fighting' },
  versailles: { year: 1919, month: 6, label: 'Treaty of Versailles signed' },
  usWomenVote: { year: 1920, label: 'Women win the vote across the United States' },
  turkeyRepublic: { year: 1923, label: 'Republic of Turkey founded' },
  // A World in Flames
  wallStreet: { year: 1929, month: 10, label: 'Wall Street crash' },
  manchuria: { year: 1931, month: 9, label: 'Japan seizes Manchuria' },
  hitlerChancellor: { year: 1933, month: 1, label: 'Hitler becomes chancellor of Germany' },
  ethiopiaInvaded: { year: 1935, month: 10, label: 'Italy invades Ethiopia' },
  chinaWar: { year: 1937, month: 7, label: 'Japan begins full-scale war in China' },
  munich: { year: 1938, month: 9, label: 'Munich Agreement' },
  polandInvaded: { year: 1939, month: 9, day: 1, label: 'Germany invades Poland' },
  barbarossa: { year: 1941, month: 6, label: 'Germany invades the Soviet Union' },
  pearlHarbor: { year: 1941, month: 12, label: 'Japan attacks Pearl Harbor' },
  midway: { year: 1942, month: 6, label: 'Battle of Midway' },
  stalingradEnds: { year: 1943, month: 2, label: 'German army surrenders at Stalingrad' },
  dDay: { year: 1944, month: 6, day: 6, label: 'D-Day landings in Normandy' },
  germanySurrenders: { year: 1945, month: 5, day: 8, label: 'Germany surrenders' },
  unCharter: { year: 1945, month: 6, day: 26, label: 'United Nations Charter signed' },
  hiroshima: { year: 1945, month: 8, day: 6, label: 'Atomic bomb dropped on Hiroshima' },
  japanSurrenders: { year: 1945, month: 9, day: 2, label: 'Japan signs its surrender' },
  udhr: { year: 1948, month: 12, label: 'Universal Declaration of Human Rights' },
  // the Holocaust (used for a timeline only, never for quiz questions)
  nurembergLaws: { year: 1935, month: 9, label: 'Nuremberg Laws strip German Jews of citizenship' },
  novemberPogrom: { year: 1938, month: 11, label: 'Synagogues burned in the November pogrom' },
  massShootings: { year: 1941, month: 6, label: 'Mass shootings begin in the occupied Soviet Union' },
  deathCamps: { year: 1942, label: 'Death camps in full operation' },
  auschwitzLiberated: { year: 1945, month: 1, day: 27, label: 'Soviet troops reach Auschwitz' },
  // Two Blocs and a Hundred New Flags
  indiaIndependence: { year: 1947, month: 8, label: 'India and Pakistan become independent' },
  nato: { year: 1949, month: 4, label: 'NATO founded' },
  chinaRevolution: { year: 1949, month: 10, label: 'People\'s Republic of China proclaimed' },
  koreanWar: { year: 1950, month: 6, label: 'Korean War begins' },
  bandung: { year: 1955, month: 4, label: 'Bandung Conference' },
  warsawPact: { year: 1955, month: 5, label: 'Warsaw Pact founded' },
  ghana: { year: 1957, month: 3, label: 'Ghana becomes independent' },
  sputnik: { year: 1957, month: 10, label: 'Sputnik, the first satellite' },
  yearOfAfrica: { year: 1960, label: 'The "Year of Africa": 17 new states' },
  berlinWall: { year: 1961, month: 8, label: 'Berlin Wall built' },
  cubanCrisis: { year: 1962, month: 10, label: 'Cuban Missile Crisis' },
  moonLanding: { year: 1969, month: 7, label: 'First people on the Moon' },
  saigonFalls: { year: 1975, month: 4, label: 'Vietnam War ends' },
  wallFalls: { year: 1989, month: 11, label: 'Berlin Wall opens' },
  ussrEnds: { year: 1991, month: 12, label: 'Soviet Union dissolves' },
  mandelaPresident: { year: 1994, month: 5, label: 'Mandela becomes president of South Africa' },
  // The Great Acceleration
  oneBillion: { year: 1804, label: '1 billion people' },
  twoBillion: { year: 1927, label: '2 billion people' },
  fourBillion: { year: 1974, label: '4 billion people' },
  container: { year: 1956, month: 4, label: 'First container ship sails' },
  treatyOfRome: { year: 1957, month: 3, label: 'Treaty of Rome founds the European Economic Community' },
  earthrise: { year: 1968, month: 12, label: '"Earthrise" photographed from lunar orbit' },
  chinaReforms: { year: 1978, month: 12, label: 'China begins its market reforms' },
  montreal: { year: 1987, month: 9, label: 'Montreal Protocol to protect the ozone layer' },
  web: { year: 1989, month: 3, label: 'World Wide Web proposed' },
  halfUrban: { year: 2007, label: 'Half of humanity lives in towns and cities' },
  parisAgreement: { year: 2015, month: 12, label: 'Paris Agreement on climate' },
  eightBillion: { year: 2022, month: 11, label: 'World population reaches 8 billion' },
};

/** A number that sorts events correctly, also inside one year. */
export const when = (e) => e.year + ((e.month || 1) - 1) / 12 + ((e.day || 1) - 1) / 372;
export const event = (id) => {
  const e = EVENTS[id];
  if (!e) throw new Error(`world-modern: no event "${id}"`);
  return { id, ...e, t: when(e) };
};

/** Labels for an `order` step: the given events, earliest first. */
export const inOrder = (ids) => ids.map(event).sort((a, b) => a.t - b.t).map((e) => e.label);

/** Events for a timeline figure: timelineEvents(['meiji', 'adwa'], { meiji: { color: 'red', note: '…' } }). */
export const timelineEvents = (ids, extra = {}) => ids.map((id) => {
  const e = event(id);
  return { id, year: e.year, label: e.label, ...(extra[id] || {}) };
});

const yearList = (events) => events.map((e) => `- **${e.year}**: ${e.label}`).join('\n');

/**
 * "Which of these happened first (or last)?" Three events of the pool; the one asked for is at
 * least `gap` years away from the other two, so that the answer is never a matter of months.
 */
export function whichFirst(rng, pool, { gap = 5 } = {}) {
  for (let guard = 0; guard < 400; guard++) {
    const last = rng.bool(0.4);
    const trio = rng.sample(pool, 3).map(event).sort((a, b) => a.t - b.t);
    const clear = last ? trio[2].year - trio[1].year >= gap : trio[1].year - trio[0].year >= gap;
    if (!clear) continue;
    const answer = last ? trio[2] : trio[0];
    return {
      text: `Which of these happened **${last ? 'last' : 'first'}**?`,
      columns: 1,
      options: rng.shuffle(trio).map((e) => ({
        text: e.label,
        correct: e.id === answer.id,
        ...(e.id === answer.id ? {} : { why: `That was in ${e.year}.` }),
      })),
      explain: `In order:\n\n${yearList(trio)}`,
    };
  }
  throw new Error('world-modern: whichFirst found no clear trio in this pool');
}

/* ----------------------------------------------------------- map questions */

/**
 * "Which marker is …?" on a map whose markers carry letters until the step is answered.
 * items: [{ id (a place id), clue, more }]. One is drawn; all of them are shown.
 */
export function markerQuiz(rng, { items, view, aspect, lead = '', alt, extra = {} }) {
  const target = rng.pick(items);
  const letter = (id) => 'ABCDEFGH'[items.findIndex((it) => it.id === id)];
  return {
    text: `${lead ? `${lead}\n\n` : ''}**Which marker is ${target.clue}?**`,
    widget: {
      type: 'world-map', view, ...(aspect ? { aspect } : {}), mode: 'pickMarker', markerLabels: 'after', answer: target.id,
      markers: items.map((it) => marker(it.id, { color: 'red' })),
      alt, ...extra,
    },
    check: (s) => s.picked === target.id
      || (s.picked && PLACES[s.picked] ? `Marker ${letter(s.picked)} is ${PLACES[s.picked].name}. Look for ${target.where}.` : false),
    solution: { picked: target.id },
    hints: [`Look for ${target.where}.`],
    explain: `Marker ${letter(target.id)} is **${PLACES[target.id].name}**. ${target.more}`,
  };
}

/**
 * "Tap the country …" items: [{ code, clue, view, more, pickable }]. Names stay hidden until the answer.
 */
export function countryQuiz(rng, items, { alt = 'A map of the region, without the names of the countries.' } = {}) {
  const target = rng.pick(items);
  return {
    text: `**Tap ${target.clue}.**`,
    widget: {
      type: 'world-map', view: target.view, ...(target.aspect ? { aspect: target.aspect } : {}), mode: 'pick', answer: target.code,
      ...(target.pickable ? { pickable: target.pickable } : {}), alt,
    },
    check: (s) => s.picked === target.code || (s.picked ? `That is ${s.nameThe || s.name || countryName(s.picked)}. ${target.hint}` : false),
    solution: { picked: target.code },
    hints: [target.hint],
    explain: `**${countryName(target.code)}**. ${target.more}`,
  };
}

/** The compass direction from one point to another, in words ("north-east"). */
export function compass(from, to) {
  const mid = ((from[1] + to[1]) / 2) * Math.PI / 180;
  let dx = to[0] - from[0];
  if (dx > 180) dx -= 360;
  if (dx < -180) dx += 360;
  const angle = Math.atan2(dx * Math.cos(mid), to[1] - from[1]) * 180 / Math.PI;      // 0 = north, 90 = east
  return ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(((angle + 360) % 360) / 45) % 8];
}

/**
 * A check for a pin-placing step: right within `km` of the place, otherwise a message that says
 * how far away the pin is and in which direction the place lies.
 */
export function pinCheck(placeId, km) {
  const p = PLACES[placeId];
  return (s) => {
    if (!s.placed) return 'Move the pin first: drag it, or tap the map.';
    const d = Math.round(distanceKm(s.pin, p.at));
    if (d <= km) return true;
    const far = Math.round(d / 10) * 10;
    return `Your pin is about ${far} km away. ${p.name} lies to the ${compass(s.pin, p.at)} of it.`;
  };
}
