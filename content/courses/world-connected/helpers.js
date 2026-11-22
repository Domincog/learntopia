// One World: 1450 to 1800 · shared tables and generators
//
// Every place, date, route and fact that more than one step uses lives here, so that a
// correction is made once. The lessons build their maps, timelines and generated questions
// from these tables; tests/world-connected-course.test.mjs checks them against its own,
// independently typed copy.
//
// Coordinates are [longitude, latitude] (east and north positive), as the world-map widget wants.

/* ------------------------------------------------------------------ places */

/**
 * id → { name, at: [lon, lat], country }. `country` is the ISO code of the modern state the
 * place lies in (the map draws today's borders), or null for a point at sea.
 */
export const PLACES = {
  // Europe
  lisbon: { name: 'Lisbon', at: [-9.14, 38.72], country: 'PT' },
  seville: { name: 'Seville', at: [-5.98, 37.39], country: 'ES' },
  sanlucar: { name: 'Sanlúcar', at: [-6.35, 36.78], country: 'ES' },
  palos: { name: 'Palos', at: [-6.89, 37.23], country: 'ES' },
  venice: { name: 'Venice', at: [12.34, 45.44], country: 'IT' },
  rome: { name: 'Rome', at: [12.5, 41.9], country: 'IT' },
  florence: { name: 'Florence', at: [11.25, 43.77], country: 'IT' },
  padua: { name: 'Padua', at: [11.88, 45.41], country: 'IT' },
  mainz: { name: 'Mainz', at: [8.27, 50.0], country: 'DE' },
  wittenberg: { name: 'Wittenberg', at: [12.65, 51.87], country: 'DE' },
  geneva: { name: 'Geneva', at: [6.14, 46.2], country: 'CH' },
  paris: { name: 'Paris', at: [2.35, 48.86], country: 'FR' },
  london: { name: 'London', at: [-0.12, 51.51], country: 'GB' },
  cambridge: { name: 'Cambridge', at: [0.12, 52.2], country: 'GB' },
  liverpool: { name: 'Liverpool', at: [-2.98, 53.41], country: 'GB' },
  nantes: { name: 'Nantes', at: [-1.55, 47.22], country: 'FR' },
  amsterdam: { name: 'Amsterdam', at: [4.9, 52.37], country: 'NL' },
  delft: { name: 'Delft', at: [4.36, 52.01], country: 'NL' },
  frombork: { name: 'Frombork', at: [19.68, 54.36], country: 'PL' },
  prague: { name: 'Prague', at: [14.42, 50.09], country: 'CZ' },
  hven: { name: 'Hven', at: [12.7, 55.91], country: 'SE' },
  konigsberg: { name: 'Königsberg', at: [20.51, 54.71], country: 'RU' },
  trent: { name: 'Trent', at: [11.12, 46.07], country: 'IT' },
  moscow: { name: 'Moscow', at: [37.62, 55.75], country: 'RU' },
  // Atlantic islands and West and Central Africa
  madeira: { name: 'Madeira', at: [-16.95, 32.75], country: 'PT' },
  canaries: { name: 'Canary Islands', at: [-16.5, 28.3], country: 'ES' },
  azores: { name: 'Azores', at: [-27.2, 38.7], country: 'PT' },
  capeVerde: { name: 'Cape Verde Islands', at: [-23.6, 15.1], country: 'CV' },
  saoTome: { name: 'São Tomé', at: [6.6, 0.25], country: 'ST' },
  goree: { name: 'Gorée', at: [-17.4, 14.67], country: 'SN' },
  elmina: { name: 'Elmina', at: [-1.35, 5.08], country: 'GH' },
  ouidah: { name: 'Ouidah', at: [2.09, 6.36], country: 'BJ' },
  bonny: { name: 'Bonny', at: [7.17, 4.44], country: 'NG' },
  mbanzaKongo: { name: 'Mbanza Kongo', at: [14.25, -6.27], country: 'AO' },
  luanda: { name: 'Luanda', at: [13.23, -8.84], country: 'AO' },
  goodHope: { name: 'Cape of Good Hope', at: [18.47, -34.36], country: 'ZA' },
  // East Africa, Arabia, the Indian Ocean
  mozambique: { name: 'Mozambique Island', at: [40.73, -15.03], country: 'MZ' },
  malindi: { name: 'Malindi', at: [40.12, -3.22], country: 'KE' },
  mogadishu: { name: 'Mogadishu', at: [45.34, 2.05], country: 'SO' },
  aden: { name: 'Aden', at: [45.03, 12.79], country: 'YE' },
  alexandria: { name: 'Alexandria', at: [29.92, 31.2], country: 'EG' },
  hormuz: { name: 'Hormuz', at: [56.46, 27.06], country: 'IR' },
  calicut: { name: 'Calicut', at: [75.78, 11.25], country: 'IN' },
  ceylon: { name: 'Sri Lanka', at: [80.22, 6.03], country: 'LK' },
  malacca: { name: 'Malacca', at: [102.25, 2.19], country: 'MY' },
  moluccas: { name: 'Moluccas', at: [127.4, 0.68], country: 'ID' },
  // Asia: capitals and ports
  istanbul: { name: 'Istanbul', at: [28.98, 41.01], country: 'TR' },
  isfahan: { name: 'Isfahan', at: [51.67, 32.65], country: 'IR' },
  agra: { name: 'Agra', at: [78.01, 27.18], country: 'IN' },
  delhi: { name: 'Delhi', at: [77.23, 28.65], country: 'IN' },
  beijing: { name: 'Beijing', at: [116.4, 39.9], country: 'CN' },
  nanjing: { name: 'Nanjing', at: [118.78, 32.06], country: 'CN' },
  quyNhon: { name: 'Qui Nhon', at: [109.22, 13.77], country: 'VN' },
  edo: { name: 'Edo (Tokyo)', at: [139.75, 35.68], country: 'JP' },
  nagasaki: { name: 'Nagasaki', at: [129.87, 32.75], country: 'JP' },
  kyoto: { name: 'Kyoto', at: [135.77, 35.01], country: 'JP' },
  manila: { name: 'Manila', at: [120.98, 14.6], country: 'PH' },
  cebu: { name: 'Cebu', at: [123.9, 10.31], country: 'PH' },
  guam: { name: 'Guam', at: [144.75, 13.45], country: 'GU' },
  samarkand: { name: 'Samarkand', at: [66.97, 39.65], country: 'UZ' },
  maragha: { name: 'Maragha', at: [46.24, 37.39], country: 'IR' },
  okhotsk: { name: 'Okhotsk', at: [143.3, 59.36], country: 'RU' },
  // The Americas
  sanSalvador: { name: 'San Salvador', at: [-74.5, 24.05], country: 'BS' },
  santoDomingo: { name: 'Santo Domingo', at: [-69.9, 18.47], country: 'DO' },
  havana: { name: 'Havana', at: [-82.37, 23.13], country: 'CU' },
  veracruz: { name: 'Veracruz', at: [-96.13, 19.18], country: 'MX' },
  tenochtitlan: { name: 'Tenochtitlan', at: [-99.13, 19.43], country: 'MX' },
  tlaxcala: { name: 'Tlaxcala', at: [-98.24, 19.32], country: 'MX' },
  acapulco: { name: 'Acapulco', at: [-99.88, 16.86], country: 'MX' },
  cajamarca: { name: 'Cajamarca', at: [-78.52, -7.16], country: 'PE' },
  cusco: { name: 'Cusco', at: [-71.97, -13.53], country: 'PE' },
  lima: { name: 'Lima', at: [-77.04, -12.05], country: 'PE' },
  titicaca: { name: 'Lake Titicaca', at: [-69.4, -15.8], country: 'PE' },
  potosi: { name: 'Potosí', at: [-65.75, -19.58], country: 'BO' },
  magellanStrait: { name: 'Strait of Magellan', at: [-70.9, -53.2], country: 'CL' },
  salvador: { name: 'Salvador', at: [-38.5, -12.97], country: 'BR' },
  rio: { name: 'Rio de Janeiro', at: [-43.2, -22.9], country: 'BR' },
  palmares: { name: 'Palmares', at: [-36.0, -9.17], country: 'BR' },
  barbados: { name: 'Barbados', at: [-59.55, 13.17], country: 'BB' },
  jamaica: { name: 'Jamaica', at: [-77.3, 18.15], country: 'JM' },
  saintDomingue: { name: 'Saint-Domingue', at: [-72.3, 19.0], country: 'HT' },
  suriname: { name: 'Suriname', at: [-55.6, 4.6], country: 'SR' },
  palenque: { name: 'San Basilio de Palenque', at: [-75.2, 10.1], country: 'CO' },
  charleston: { name: 'Charleston', at: [-79.93, 32.78], country: 'US' },
};

/** [lon, lat] of a place in the table. */
export const at = (id) => {
  if (!PLACES[id]) throw new Error(`world-connected helpers: unknown place "${id}"`);
  return PLACES[id].at;
};

/**
 * The compass direction to travel from one point to another, in words: compass([2, 49], [8, 50])
 * is 'east'. For telling a learner which way a misplaced pin should move.
 */
export function compass(from, to) {
  const lat = ((from[1] + to[1]) / 2) * (Math.PI / 180);
  let dLon = to[0] - from[0];
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  const angle = (Math.atan2(dLon * Math.cos(lat), to[1] - from[1]) * 180) / Math.PI;      // 0 = north, 90 = east
  const names = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
  return names[Math.round(((angle + 360) % 360) / 45) % 8];
}

/** A map marker for a place in the table: marker('lisbon', { color: 'blue' }). */
export const marker = (id, extra = {}) => ({ id, at: at(id), label: PLACES[id].name, ...extra });

/* ------------------------------------------------------------------ events */

/**
 * id → { year, label, short }. `label` is written so that it can stand alone as an answer
 * option. Where a process took years, `year` is the conventional landmark (and `to` its end).
 * `circa: true` marks dates that are approximate.
 */
export const EVENTS = {
  diamondSutra: { year: 868, label: 'The Diamond Sutra is block-printed in China', short: 'Diamond Sutra' },
  jikji: { year: 1377, label: 'The *Jikji* is printed with metal type in Korea', short: 'Jikji' },
  zhengHe: { year: 1405, to: 1433, label: 'Zheng He\'s fleets begin to cross the Indian Ocean', short: 'Zheng He' },
  constantinople: { year: 1453, label: 'The Ottomans take Constantinople', short: 'Constantinople falls' },
  gutenberg: { year: 1455, circa: true, label: 'Gutenberg prints his Bible in Mainz', short: 'Gutenberg Bible' },
  elminaFort: { year: 1482, label: 'Portugal builds a fort at Elmina on the Gold Coast', short: 'Elmina fort' },
  dias: { year: 1488, label: 'Bartolomeu Dias rounds the southern tip of Africa', short: 'Dias' },
  columbus: { year: 1492, label: 'Columbus crosses the Atlantic', short: 'Columbus' },
  tordesillas: { year: 1494, label: 'Spain and Portugal sign the Treaty of Tordesillas', short: 'Tordesillas' },
  daGama: { year: 1498, label: 'Vasco da Gama reaches India by sea', short: 'Da Gama' },
  safavids: { year: 1501, label: 'Shah Ismail founds the Safavid state in Iran', short: 'Safavids' },
  luther: { year: 1517, label: 'Luther publishes his Ninety-five Theses', short: 'Luther' },
  magellanSails: { year: 1519, label: 'Magellan\'s fleet leaves Spain', short: 'Magellan sails' },
  tenochtitlanFalls: { year: 1521, label: 'Tenochtitlan falls to Cortés and his allies', short: 'Tenochtitlan falls' },
  victoria: { year: 1522, label: 'The *Victoria* completes the first voyage round the world', short: 'Round the world' },
  babur: { year: 1526, label: 'Babur founds the Mughal empire in India', short: 'Mughals' },
  atahualpa: { year: 1532, label: 'Pizarro captures the Inca ruler Atahualpa', short: 'Atahualpa captured' },
  copernicus: { year: 1543, label: 'Copernicus publishes his Sun-centred system', short: 'Copernicus' },
  potosi: { year: 1545, label: 'Silver is found at Potosí', short: 'Potosí' },
  trent: { year: 1545, to: 1563, label: 'The Council of Trent opens', short: 'Trent' },
  manila: { year: 1571, label: 'Spain founds Manila, and galleons link Asia to America', short: 'Manila' },
  tokugawa: { year: 1603, label: 'Tokugawa Ieyasu becomes shogun of Japan', short: 'Tokugawa' },
  telescope: { year: 1610, label: 'Galileo publishes what his telescope shows', short: 'Galileo\'s telescope' },
  tajMahal: { year: 1632, to: 1653, label: 'Building of the Taj Mahal begins', short: 'Taj Mahal' },
  galileoTrial: { year: 1633, label: 'Galileo is tried in Rome', short: 'Galileo\'s trial' },
  qing: { year: 1644, label: 'The Qing dynasty takes Beijing', short: 'Qing' },
  westphalia: { year: 1648, label: 'The Peace of Westphalia ends the Thirty Years\' War', short: 'Westphalia' },
  royalSociety: { year: 1660, label: 'The Royal Society is founded in London', short: 'Royal Society' },
  principia: { year: 1687, label: 'Newton publishes the *Principia*', short: 'Newton' },
  palmaresFalls: { year: 1694, label: 'Palmares is destroyed after almost a century', short: 'Palmares falls' },
  encyclopedie: { year: 1751, to: 1772, label: 'The first volume of the *Encyclopédie* appears', short: 'Encyclopédie' },
  equiano: { year: 1789, label: 'Olaudah Equiano publishes his life story', short: 'Equiano' },
  haitiRevolt: { year: 1791, label: 'The enslaved people of Saint-Domingue rise in revolt', short: 'Haitian Revolution' },
  wollstonecraft: { year: 1792, label: 'Mary Wollstonecraft publishes *A Vindication of the Rights of Woman*', short: 'Wollstonecraft' },
  britainTradeBan: { year: 1807, label: 'Britain outlaws its slave trade', short: 'Britain bans the trade' },
  britainAbolition: { year: 1833, label: 'Britain passes its Slavery Abolition Act', short: 'British abolition act' },
  franceAbolition: { year: 1848, label: 'France abolishes slavery in its colonies for good', short: 'France' },
  usAbolition: { year: 1865, label: 'The United States abolishes slavery', short: 'United States' },
  brazilAbolition: { year: 1888, label: 'Brazil abolishes slavery', short: 'Brazil' },
};

export const year = (id) => {
  if (!EVENTS[id]) throw new Error(`world-connected helpers: unknown event "${id}"`);
  return EVENTS[id].year;
};

/** A timeline event built from the table: tlEvent('columbus', { color: 'red' }). */
export const tlEvent = (id, extra = {}) => ({ id, year: year(id), label: EVENTS[id].short, ...extra });

/** Plain text of a label (the emphasis markers removed), for use inside a sentence. */
export const plain = (text) => String(text).replace(/\*/g, '');
const lowerFirst = (text) => (/^(The|Building|Silver) /.test(text) ? text[0].toLowerCase() + text.slice(1) : text);

/**
 * "Which of these happened first (or last)?" Three events are drawn from `ids` so that any
 * two of them lie at least `minGap` years apart: the order is then beyond dispute and never
 * turns on an exact year.
 */
export function firstOfThree(rng, ids, { minGap = 25, intro = '' } = {}) {
  let trio = null;
  for (let tries = 0; tries < 400 && !trio; tries++) {
    const pick = rng.sample(ids, 3).sort((a, b) => year(a) - year(b));
    if (year(pick[1]) - year(pick[0]) >= minGap && year(pick[2]) - year(pick[1]) >= minGap) trio = pick;
  }
  if (!trio) throw new Error('firstOfThree: no three events far enough apart');
  const last = rng.bool(0.35);
  const answer = last ? trio[2] : trio[0];
  const when = (id) => (EVENTS[id].circa ? `about ${year(id)}` : `${year(id)}`);
  return {
    text: `${intro ? `${intro}\n\n` : ''}Which of these happened **${last ? 'last' : 'first'}**?`,
    options: rng.shuffle(trio).map((id) => ({ text: EVENTS[id].label, correct: id === answer })),
    explain: `In order: ${trio.map((id) => `${lowerFirst(EVENTS[id].label)} (${when(id)})`).join('; then ')}.`,
  };
}

/* ----------------------------------------------------------------- voyages */

/**
 * The great voyages, as routes for the map. Each `points` list runs through real ports and
 * capes (from PLACES) and through sea waypoints chosen to keep the line off the land and to
 * follow the winds the ships actually used. They are sketches, not logbooks.
 */
export const VOYAGES = {
  zhengHe: {
    who: 'Zheng He',
    label: 'Zheng He, 1405 to 1433',
    years: '1405 to 1433',
    color: 'red',
    from: 'China',
    alt: 'from eastern China south past Vietnam, through the strait at Malacca, round Sri Lanka to south India, and on to the Persian Gulf and the coast of East Africa',
    // down the Yangtze from Nanjing, then by sea
    points: [at('nanjing'), [121.9, 31.4], [123.2, 30.8], [122.6, 28.5], [121, 26.6], [119.6, 24.6], [117.8, 22.6], [114.8, 20.5], [111.8, 17.3], [110.2, 14.5], at('quyNhon'),
      [109.6, 12.5], [109.3, 11.2], [107.8, 9.5], [105.8, 7.2], [104.9, 3.5], [104.6, 1.4], [103.8, 1.15], [103.3, 1.2], [102.6, 1.7], at('malacca'),
      [101.2, 2.8], [100.2, 3.8], [99, 5], [97.6, 5.9], [95.2, 6.6], [88, 6], [82, 5.6], [80.3, 5.7], at('ceylon'),
      [79.3, 6.6], [77.5, 7.5], [76.2, 8.6], [75.6, 10], at('calicut'), [73, 14], [70, 18], [67, 21.5], [64, 23.8], [60.5, 24.6], [57.4, 25.4], [56.8, 26.4], at('hormuz')],
    overland: [0],            // the first leg runs down the Yangtze from Nanjing to the sea
    branch: [at('ceylon'), [79.3, 6.6], [77.5, 6], [73.6, 5.7], [60, 3.5], [50, 2.8], [46.5, 2.2], at('mogadishu'), [44.6, 0.9], [42.9, -1], [41.2, -2.6], at('malindi')],
  },
  dias: {
    who: 'Bartolomeu Dias',
    label: 'Dias, 1487 to 1488',
    years: '1487 to 1488',
    color: 'teal',
    from: 'Portugal',
    alt: 'from Portugal down the whole west coast of Africa and just round its southern tip',
    points: [at('lisbon'), [-13, 33], [-18.5, 21], [-18.5, 13], [-12, 5.5], [-8.5, 3.8], [-2, 3.6], [6.5, 1.5], [8, -5], [11, -12], [11, -18], [13.5, -25], [14, -32], [17, -36.5], [21, -36], [25.5, -34.6]],
  },
  columbus: {
    who: 'Christopher Columbus',
    label: 'Columbus, 1492',
    years: '1492 to 1493',
    color: 'orange',
    from: 'Spain',
    alt: 'from southern Spain to the Canary Islands and then due west across the Atlantic to the Caribbean',
    points: [at('palos'), [-10.5, 34], at('canaries'), [-30, 27.5], [-45, 27], [-60, 26], at('sanSalvador'), [-76.5, 21.5], [-72.5, 20.2]],
    back: [[-72.5, 20.2], [-68, 27], [-60, 35], [-45, 38], at('azores'), [-14, 38.6], at('lisbon')],
  },
  daGama: {
    who: 'Vasco da Gama',
    label: 'Da Gama, 1497 to 1498',
    years: '1497 to 1498',
    color: 'blue',
    from: 'Portugal',
    alt: 'from Portugal in a wide arc through the middle of the South Atlantic, round the southern tip of Africa, up the East African coast and across to south India',
    points: [at('lisbon'), [-14, 33], at('capeVerde'), [-21, 5], [-27, -8], [-28, -20], [-18, -30], [0, -33], [12, -34], [17.5, -35.8], [23, -35.6],
      [27.5, -34.6], [30.5, -32.2], [33.3, -29], [36.2, -24.5], [38.6, -19], [41.4, -15.3], [41.2, -10.5], [40.7, -5.5], at('malindi'), [50, 2], [62, 8], at('calicut')],
  },
  magellan: {
    who: 'Magellan and Elcano',
    label: 'Magellan and Elcano, 1519 to 1522',
    years: '1519 to 1522',
    color: 'violet',
    from: 'Spain',
    alt: 'from Spain down the Atlantic, through a strait at the tip of South America, across the whole Pacific to the Philippines and the Spice Islands, then home across the Indian Ocean and round Africa',
    points: [at('sanlucar'), [-17.5, 27], [-24.5, 14], [-28, 0], [-36, -12], [-41, -23.5], [-54, -36], [-64.5, -45], [-67.6, -51.8],
      // the strait (narrower than the map can show)
      [-68.6, -52.4], [-69.6, -52.6], [-70.6, -53], [-70.95, -53.75], [-71.4, -54], [-72.2, -53.7], [-73.2, -53.2], [-74.2, -52.9], [-74.9, -52.6],
      [-80, -42], [-88, -30], [-110, -20], [-135, -12], [-160, -3], [175, 6], [158, 11], at('guam'),
      // through the Philippines by Surigao Strait to Cebu, then south-west to the Sulu Sea
      [128, 10.7], [125.9, 10.6], [125.5, 10.1], [125.1, 9.75], [124.65, 10.05], [124.3, 10.35], at('cebu'), [123.85, 10], [123.6, 9.6], [123.3, 9.2], [122.9, 8.85], [122.6, 8.6],
      [121.5, 8.4], [120.5, 7.3], [119.6, 5.7], [121.5, 3.5], [124.5, 2.5], [126, 1.8], at('moluccas'),
      // south past Buru to Timor and out into the Indian Ocean
      [126.9, -0.6], [126.7, -2.3], [125.6, -3.6], [125.4, -6.6], [125.25, -8], [125.2, -8.45], [124.6, -8.7], [124, -9], [123.2, -9.9], [122.6, -10.6], [118, -13],
      [105, -20], [80, -32], [50, -38], [25, -39], [15, -34], [2, -20], [-12, -2], [-22, 12], [-30, 28], [-24, 38], [-12, 37.5], [-10, 36.4], [-7, 36.5], at('sanlucar')],
  },
};

/**
 * Other routes drawn in the lessons. `overland` lists the legs (by the index of their first
 * point) that really did run over land or up a river; every other leg must stay at sea.
 */
export const ROUTES = {
  // cloves from the Moluccas to Venice in the 1400s
  spice: {
    points: [at('moluccas'), [126.9, -0.6], [126.7, -2.3], [125.6, -3.6], [124, -5.8], [120.8, -6.9], [117, -6.6], [113.5, -6], [109, -5.8], [107.2, -5.1], [107.15, -2.7], [106.6, -0.9], [105.5, 0.3], [104.8, 1.25],
      [103.8, 1.15], [103.3, 1.2], [102.6, 1.7], at('malacca'), [101.2, 2.8], [100.2, 3.8], [99, 5], [97.6, 5.9], [95.2, 6.6], [88, 6], [82, 5.6], [80.3, 5.7], [79.3, 6.6], [77.5, 7.5], [76.2, 8.6], [75.6, 10], at('calicut'),
      [72, 12.5], [65, 13], [55, 13.7], [51, 13], [47, 12.2], at('aden'), [43.9, 12.4], [43.35, 12.6], [42.2, 14.5], [40.3, 17.5], [38.2, 21], [36.3, 24.5], [35.2, 26.3], [34.1, 27.4], [33.65, 28], [33.25, 28.4], [32.95, 28.8], [32.8, 29.2], [32.6, 29.5], [32.55, 29.85],
      at('alexandria'), [27, 33], [22, 35.2], [19.2, 37.5], [18.8, 40.1], [16.5, 42.3], [14, 44.2], [13, 45], at('venice')],
    overland: [50],          // Suez to Alexandria, by caravan and Nile boat
  },
  // silver from Potosí to Seville
  silverAtlantic: {
    points: [at('potosi'), [-70.3, -18.5], [-71.5, -18.3], [-74.5, -16.5], [-77, -13.8], at('lima'), [-78.6, -10], [-81.8, -6], [-81.8, -3.5], [-81.5, -1], [-80.5, 3], [-79.7, 7.2], [-79.52, 8.95],
      [-79.65, 9.55], [-80.5, 11], [-82.5, 15.5], [-84.8, 19.5], [-85.6, 21.8], [-84, 23.5], at('havana'), [-80.6, 23.85], [-79.7, 26.2], [-79.2, 28.5], [-75, 32], [-60, 36], [-40, 37.5], [-25, 36.2], [-10, 36.5], [-6.6, 36.6], at('seville')],
    overland: [0, 12, 28],   // llama and mule trains to the coast; across the isthmus of Panama; up the Guadalquivir
  },
  // the Manila galleon, westbound, and Chinese junks between Manila and Fujian
  galleon: {
    points: [at('acapulco'), [-115, 13], [-150, 12], [175, 12.5], [145, 13.5], [127, 13.2], [125, 12.9], [124.15, 12.6], [123.75, 12.8], [123.3, 12.6], [122.6, 12.75], [122.2, 13], [121.6, 13.2], [121.1, 13.55], [120.5, 13.75], [120.45, 14.2], [120.6, 14.42], at('manila')],
    overland: [],
  },
  manilaChina: {
    points: [[118.1, 24.3], [118.7, 23.5], [119.6, 19.5], [119.6, 16], [120.2, 14.3], [120.6, 14.42], at('manila')],
    overland: [],
  },
  // where sugar planting moved, 1450 to 1700
  sugar: {
    legs: [
      [at('madeira'), [-20, 28], [-19.5, 21], [-18.5, 12], [-12, 5], [-3, 2.5], at('saoTome')],
      [at('saoTome'), [-10, -6], [-30, -11], at('salvador')],
      [at('salvador'), [-36, -11.6], [-34.3, -9], [-33.8, -6], [-35, -4], [-45, 3.5], [-52, 7], at('barbados')],
      [at('barbados'), [-66, 16.3], [-72, 17.6]],
    ],
  },
  // the two ways home from Elmina (the "volta" question)
  elminaCoast: { points: [at('elmina'), [-2.3, 4.4], [-8, 3.8], [-14.5, 7.5], [-18.6, 14], [-18.2, 21], [-15.3, 26], [-13.3, 28.3], [-11, 31], [-10.2, 35], at('lisbon')], overland: [] },
  elminaVolta: { points: [at('elmina'), [-2.5, 4.2], [-8, 1.5], [-20, 4], [-29, 13], [-34.5, 24], [-33, 33], [-27.5, 38.5], [-18, 39.8], at('lisbon')], overland: [] },
};

/** The line (or lines) of one voyage for a map spec. */
export function voyageLines(id, { animate = null, width = 2.5, label = true, color = null } = {}) {
  const v = VOYAGES[id];
  if (!v) throw new Error(`world-connected helpers: unknown voyage "${id}"`);
  const base = { color: color || v.color, width, curve: 'straight', arrow: true, ...(animate ? { animate } : {}) };
  const lines = [{ ...base, points: v.points, ...(label ? { label: v.label } : {}) }];
  if (v.branch) lines.push({ ...base, points: v.branch });
  if (v.back) lines.push({ ...base, points: v.back, dashed: true });
  return lines;
}

/* -------------------------------------------------- the Columbian Exchange */

/**
 * Where each plant or animal lived in 1491. Only clear cases are listed: things that were on
 * both sides (cotton, dogs, gourds), things with close wild or cultivated relatives on the
 * other side (onions: the Mexica grew a native onion, xonacatl; sheep: bighorn sheep are
 * American), and things whose story is disputed (sweet potato and chicken in the Pacific,
 * coconuts) are left out on purpose, so that every generated question has one defensible answer.
 */
export const GOODS = {
  // the Americas
  maize: { name: 'maize (corn)', home: 'americas' },
  potato: { name: 'potatoes', home: 'americas' },
  tomato: { name: 'tomatoes', home: 'americas' },
  chilli: { name: 'chilli peppers', home: 'americas' },
  cacao: { name: 'cacao (chocolate)', home: 'americas' },
  cassava: { name: 'cassava (manioc)', home: 'americas' },
  tobacco: { name: 'tobacco', home: 'americas' },
  peanut: { name: 'peanuts', home: 'americas' },
  pineapple: { name: 'pineapples', home: 'americas' },
  vanilla: { name: 'vanilla', home: 'americas' },
  turkey: { name: 'turkeys', home: 'americas' },
  avocado: { name: 'avocados', home: 'americas' },
  squash: { name: 'pumpkins and squash', home: 'americas' },
  // Africa, Asia and Europe
  wheat: { name: 'wheat', home: 'afroeurasia' },
  rice: { name: 'rice', home: 'afroeurasia' },
  barley: { name: 'barley', home: 'afroeurasia' },
  sugar: { name: 'sugar cane', home: 'afroeurasia' },
  coffee: { name: 'coffee', home: 'afroeurasia' },
  tea: { name: 'tea', home: 'afroeurasia' },
  banana: { name: 'bananas', home: 'afroeurasia' },
  lentil: { name: 'lentils', home: 'afroeurasia' },
  orange: { name: 'oranges', home: 'afroeurasia' },
  olive: { name: 'olives', home: 'afroeurasia' },
  pepper: { name: 'black pepper', home: 'afroeurasia' },
  horse: { name: 'horses', home: 'afroeurasia' },
  cattle: { name: 'cattle', home: 'afroeurasia' },
  pig: { name: 'pigs', home: 'afroeurasia' },
  donkey: { name: 'donkeys', home: 'afroeurasia' },
  goat: { name: 'goats', home: 'afroeurasia' },
};

/** "a, b and c" */
export const andList = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : String(items[0]));

export const goodsFrom = (home) => Object.keys(GOODS).filter((id) => GOODS[id].home === home);

/** Kitchens for the "what could a cook not have had in 1450?" question. */
export const KITCHENS = {
  afroeurasia: ['Venice', 'Cairo', 'Calicut', 'Malacca', 'Hangzhou', 'Timbuktu', 'Samarkand', 'Kilwa'],
  americas: ['Tenochtitlan', 'Cusco'],
};

/**
 * "Which of these is completely unknown to a cook in Calicut in 1450?" One item from the other
 * side of the Atlantic among three from the cook's own side. (The question is about the two
 * halves of the world, not about what a particular city could buy: tea was as strange as
 * tomatoes in the Paris of 1450, so no claim is made about single cities.)
 */
export function kitchenStep(rng) {
  const side = rng.bool(0.7) ? 'afroeurasia' : 'americas';
  const other = side === 'afroeurasia' ? 'americas' : 'afroeurasia';
  const city = rng.pick(KITCHENS[side]);
  const odd = rng.pick(goodsFrom(other));
  const own = rng.sample(goodsFrom(side), 3);
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
  const home = { americas: 'the Americas', afroeurasia: 'Africa, Asia and Europe' };
  return {
    text: side === 'afroeurasia'
      ? `It is 1450. Three of these can be found somewhere in Africa, Asia or Europe. The fourth is found only in the Americas. **Which one is completely unknown to a cook in ${city}?**`
      : `It is 1450. Three of these can be found somewhere in the Americas. The fourth is found only across the ocean, in Africa, Asia and Europe. **Which one is completely unknown to a cook in ${city}?**`,
    options: rng.shuffle([odd, ...own]).map((id) => ({ text: cap(GOODS[id].name), correct: id === odd })),
    explain: `${cap(GOODS[odd].name)} came from ${home[other]} and crossed the Atlantic only after 1492. ${cap(andList(own.map((id) => GOODS[id].name)))} were all at home in ${home[side]}.`,
  };
}

/**
 * Dishes that feel timeless and are not. `late` is the ingredient that arrived only after
 * 1492; `old` are ingredients the region already had. Dishes with several newcomers list
 * only one, and the others never appear among the options.
 */
export const DISHES = [
  { dish: 'pizza Margherita', where: 'Naples', late: 'tomato', old: ['wheat flour', 'olive oil', 'basil', 'cheese'] },
  { dish: 'a chilli-hot curry', where: 'south India', late: 'chilli', old: ['black pepper', 'ginger', 'turmeric', 'garlic'] },
  { dish: 'mapo tofu', where: 'Sichuan, in China', late: 'chilli', old: ['tofu', 'Sichuan pepper', 'garlic', 'ginger'] },
  { dish: 'Irish stew', where: 'Ireland', late: 'potato', old: ['mutton', 'onion', 'barley', 'carrot'] },
  { dish: 'red, chilli-hot kimchi', where: 'Korea', late: 'chilli', old: ['radish', 'garlic', 'ginger', 'salt'] },
  { dish: 'goulash with paprika', where: 'Hungary', late: 'paprika (ground chilli)', old: ['beef', 'onion', 'caraway', 'lard'] },
  { dish: 'a green curry', where: 'Thailand', late: 'chilli', old: ['lemongrass', 'fish sauce', 'rice', 'lime leaves'] },
  { dish: 'a bar of milk chocolate', where: 'Switzerland', late: 'cacao', old: ['milk', 'cane sugar'] },
  { dish: 'a Spanish potato omelette', where: 'Spain', late: 'potato', old: ['egg', 'onion', 'olive oil', 'salt'] },
  { dish: 'fish and chips', where: 'England', late: 'potato', old: ['cod', 'wheat flour', 'vinegar'] },
  { dish: 'jollof rice', where: 'West Africa', late: 'tomato', old: ['rice', 'onion', 'salt'] },
  { dish: 'satay with peanut sauce', where: 'Indonesia', late: 'peanut', old: ['coconut milk', 'garlic', 'palm sugar', 'turmeric'] },
  { dish: 'tacos al pastor', where: 'Mexico', late: 'pork', old: ['maize tortilla', 'chilli', 'pineapple'] },
  { dish: 'a quesadilla', where: 'Mexico', late: 'cheese', old: ['maize tortilla', 'chilli', 'squash flowers'] },
  { dish: 'feijoada', where: 'Brazil', late: 'pork', old: ['black beans', 'cassava flour', 'chilli'] },
  { dish: 'rice and beans', where: 'the Caribbean', late: 'rice', old: ['beans', 'chilli', 'allspice'] },
];

/** Which side of the Atlantic each ingredient in DISHES was on in 1491. */
export const INGREDIENT_HOME = {
  tomato: 'americas', chilli: 'americas', potato: 'americas', 'paprika (ground chilli)': 'americas', cacao: 'americas', peanut: 'americas',
  'maize tortilla': 'americas', pineapple: 'americas', 'squash flowers': 'americas', beans: 'americas', 'black beans': 'americas',
  'cassava flour': 'americas', allspice: 'americas',
  'wheat flour': 'afroeurasia', 'olive oil': 'afroeurasia', basil: 'afroeurasia', cheese: 'afroeurasia', 'black pepper': 'afroeurasia', ginger: 'afroeurasia',
  turmeric: 'afroeurasia', garlic: 'afroeurasia', tofu: 'afroeurasia', 'Sichuan pepper': 'afroeurasia', mutton: 'afroeurasia', onion: 'afroeurasia',
  barley: 'afroeurasia', carrot: 'afroeurasia', radish: 'afroeurasia', salt: 'afroeurasia', beef: 'afroeurasia', caraway: 'afroeurasia', lard: 'afroeurasia',
  lemongrass: 'afroeurasia', 'fish sauce': 'afroeurasia', rice: 'afroeurasia', 'lime leaves': 'afroeurasia', milk: 'afroeurasia', 'cane sugar': 'afroeurasia',
  egg: 'afroeurasia', cod: 'afroeurasia', vinegar: 'afroeurasia', 'coconut milk': 'afroeurasia', 'palm sugar': 'afroeurasia', pork: 'afroeurasia',
};

/** "Which ingredient of pizza Margherita could not have been found in Naples in 1450?" */
export function dishStep(rng) {
  const d = rng.pick(DISHES);
  const old = rng.sample(d.old, Math.min(3, d.old.length));
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
  const from = INGREDIENT_HOME[d.late] === 'americas' ? 'the Americas' : 'Africa, Asia and Europe';
  return {
    text: `${cap(d.dish)} could hardly be more at home in ${d.where}. Yet one of these ingredients could not have been found there in 1450. **Which?**`,
    options: rng.shuffle([d.late, ...old]).map((name) => ({ text: cap(name), correct: name === d.late })),
    explain: `${cap(d.late)} came from ${from}, on the other side of the Atlantic, and arrived only after 1492. ${cap(andList(old))} had been there long before.`,
  };
}

/**
 * Homelands of crops, as points on a world map far enough apart to tap on a phone.
 * `spot` is the id of the marker; several crops can share one homeland.
 */
export const HOMELANDS = {
  mexico: { name: 'Mexico', at: [-99, 18.5], hint: 'in the south of North America' },
  andes: { name: 'the Andes', at: [-70.5, -15], hint: 'high in the mountains of South America' },
  crescent: { name: 'the Fertile Crescent', at: [40, 36], hint: 'in the Middle East' },
  ethiopia: { name: 'Ethiopia', at: [38, 8], hint: 'in the highlands of East Africa' },
  yangtze: { name: 'the Yangtze valley', at: [115, 30], hint: 'in central China' },
  newGuinea: { name: 'New Guinea', at: [143, -6], hint: 'on the large island north of Australia' },
};
export const CROP_HOMES = [
  { crop: 'Maize (corn)', spot: 'mexico', note: 'Farmers in southern Mexico bred maize from a wild grass called teosinte about 9,000 years ago.' },
  { crop: 'The chilli pepper', spot: 'mexico', note: 'Chillies were domesticated in Mexico at least 6,000 years ago.' },
  { crop: 'The potato', spot: 'andes', note: 'Potatoes were domesticated high in the Andes, near Lake Titicaca, at least 7,000 years ago. Peru still grows thousands of varieties.' },
  { crop: 'Wheat', spot: 'crescent', note: 'Wheat was among the first crops of all, grown in the Fertile Crescent more than 10,000 years ago.' },
  { crop: 'Coffee', spot: 'ethiopia', note: 'The coffee bush grows wild in the highlands of Ethiopia, where people first used it; it was first planted on a large scale across the Red Sea, in Yemen. Brazil is now the world\'s largest grower.' },
  { crop: 'Asian rice', spot: 'yangtze', note: 'Rice was domesticated along the Yangtze about 9,000 years ago.' },
  { crop: 'Sugar cane', spot: 'newGuinea', note: 'Sugar cane was first grown in New Guinea, spread to India and the Mediterranean, and crossed the Atlantic with Columbus in 1493.' },
];

/* ------------------------------------------------- the great Asian empires */

/**
 * The land empires of lesson 3. `home` is the modern country in which the capital lies;
 * `extent` is a rough outline at about the date given, for shading on a map (never for
 * grading: early-modern frontiers were zones, not lines).
 */
export const EMPIRES = {
  ottoman: {
    name: 'the Ottoman Empire', short: 'Ottoman', capital: 'istanbul', home: 'TR', color: 'red', from: 1299, to: 1922, about: 1600,
    extent: [
      // Hungary and the Balkans, Anatolia, Syria and Iraq
      [16.5, 45.5], [17.5, 47.5], [21, 48.2], [24.5, 47.8], [27, 48.3], [30, 46.5], [30.3, 45.2], [28.8, 43.5], [28.2, 41.6], [29.5, 41.2], [31.5, 41.4], [35, 42], [38, 41], [41.5, 41.5], [43.5, 41],
      [45, 39.6], [44.5, 37.6], [46, 35.2], [46.3, 33.3], [47.9, 31], [48.5, 30], [47.8, 29.4], [46.5, 29.2], [44.5, 29.3], [42, 31.3], [39, 32.2], [37.5, 31.5], [36.5, 29.5], [35, 29.4],
      [34.3, 31.2], [34.9, 32.8], [35.6, 34.5], [35.9, 36.2], [34.6, 36.7], [32.2, 36.1], [30.5, 36.3], [29, 36.5], [27.4, 36.8], [26.5, 38.4], [26.2, 39.5], [26.2, 40.1],
      [24.2, 40.8], [23, 40.3], [23.4, 39.1], [24, 38.1], [23, 36.5], [21.7, 36.8], [21.1, 38.3], [19.9, 39.8], [19.4, 41.5], [18.6, 42.4], [17.2, 43.1], [16.2, 44.2],
    ],
    // Egypt with the Red Sea coast of Arabia, and the North African coast: drawn as separate shapes
    more: [
      [[25, 31.6], [29, 30.9], [31, 31.5], [32.3, 31.2], [34.2, 31.2], [34.95, 29.5], [36.5, 28], [38.5, 25], [40, 22.5], [41.5, 19.5], [43.3, 16.5], [44.8, 13.5], [45.2, 12.8], [43.5, 12.7], [42.8, 14.5], [42.3, 16.5],
        [40.5, 19.5], [39.1, 21.5], [37.5, 24.2], [35.5, 27.8], [34.3, 27.8], [33.2, 28.8], [32.6, 29.9], [32.9, 28.6], [33.9, 26.9], [35.3, 24.2], [36.6, 22.3], [33.5, 21.8], [31, 22], [30, 25], [28.5, 28.5], [25, 29.5]],
      [[25, 31.7], [22, 32.9], [20, 32.6], [20, 31], [19, 30.4], [16.5, 31.2], [15.3, 32.4], [13.2, 32.9], [11.5, 33.2], [10.2, 34], [11.2, 36.9], [10, 37.4], [7, 37.1], [3, 36.9], [0, 36], [-1.8, 35.2],
        [-1.5, 34.3], [2, 34], [6, 34.2], [8.5, 33], [10.5, 31.2], [14, 30.3], [18, 29.5], [22, 29.5], [25, 29.8]],
    ],
    labelAt: [35.5, 39],
  },
  safavid: {
    name: 'Safavid Iran', short: 'Safavid', capital: 'isfahan', home: 'IR', color: 'green', from: 1501, to: 1736, about: 1600,
    extent: [[45, 39.5], [46.5, 41.5], [49.5, 41.5], [49.5, 37.5], [52, 36.8], [54, 37.2], [57, 38.2], [61, 36.8], [63.5, 35.5], [66, 32], [64, 29.5], [61.5, 28.5], [61.5, 25.2], [57.5, 25.6], [56.5, 27], [52, 27.5], [50.2, 29.9], [48.8, 30.3], [46.5, 33.5], [45.6, 36.5], [44.2, 38.5]],
    labelAt: [56.5, 30.2],
  },
  mughal: {
    name: 'the Mughal Empire', short: 'Mughal', capital: 'agra', home: 'IN', color: 'orange', from: 1526, to: 1857, about: 1700,
    extent: [[66.5, 24.5], [67, 28], [66, 31], [67, 34.5], [70.5, 36], [74, 35.5], [76, 33], [79, 31], [81, 28.5], [84.5, 27.2], [88, 26.6], [92.5, 26.5], [92.5, 22.5], [91.5, 22.3], [89, 21.7], [87, 21.3], [85, 19.5], [82.5, 16.5], [80.3, 15], [80.3, 12.5], [79, 11], [77, 12], [75, 13], [74.2, 15], [73, 18], [72.7, 21], [70, 20.8], [69, 22.3], [68.5, 23.6]],
    labelAt: [79, 20],
  },
  ming: {
    name: 'Ming China', short: 'Ming', capital: 'beijing', home: 'CN', color: 'blue', from: 1368, to: 1644, about: 1600,
    extent: [[98.5, 24.5], [99, 28], [102, 31], [102.5, 35], [100.5, 37], [98, 39.5], [103, 38], [107, 39.5], [111, 40.5], [115, 41], [119, 41], [121.5, 41.5], [124, 41.5], [124, 40], [121.5, 40.5], [121, 39], [118, 39], [118.8, 37.7], [122.4, 37.4], [120.3, 36], [119.3, 35], [121.8, 31.2], [122, 29.5], [120, 26], [118, 24.3], [116, 22.8], [113.5, 22], [110.3, 21], [108.2, 21.6], [106.7, 22], [105, 23], [102, 22.4], [101, 21.5], [99.3, 22.2]],
    labelAt: [110, 29.5],
  },
  qing: {
    name: 'Qing China', short: 'Qing', capital: 'beijing', home: 'CN', color: 'blue', from: 1644, to: 1912, about: 1760,
    extent: [],
  },
  tokugawa: {
    name: 'Tokugawa Japan', short: 'Tokugawa', capital: 'edo', home: 'JP', color: 'violet', from: 1603, to: 1868, about: 1700,
    extent: [],
  },
  russia: {
    name: 'Russia', short: 'Russian', capital: 'moscow', home: 'RU', color: 'teal', from: 1547, to: 1917, about: 1700,
    extent: [],
  },
};

/** A fact that is true of exactly one of the empires, for "which empire?" questions. */
export const EMPIRE_FACTS = [
  { fact: 'took Constantinople in 1453 with the help of giant cannon', empire: 'ottoman' },
  { fact: 'ruled lands on three continents, from Algiers to Baghdad to Budapest', empire: 'ottoman' },
  { fact: 'was ruled at its height by Süleyman, whom Europeans called "the Magnificent"', empire: 'ottoman' },
  { fact: 'employed the architect Sinan, builder of great domed mosques', empire: 'ottoman' },
  { fact: 'made Shia Islam the religion of the state', empire: 'safavid' },
  { fact: 'built a new capital at Isfahan under Shah Abbas', empire: 'safavid' },
  { fact: 'was founded when Babur won the battle of Panipat in 1526', empire: 'mughal' },
  { fact: 'was ruled by Akbar, who invited scholars of many religions to debate at his court', empire: 'mughal' },
  { fact: 'built the Taj Mahal', empire: 'mughal' },
  { fact: 'built the Forbidden City in Beijing', empire: 'ming' },
  { fact: 'rebuilt the Great Wall in brick and stone', empire: 'ming' },
  { fact: 'was the dynasty of the Manchus, who took Beijing in 1644', empire: 'qing' },
  { fact: 'was ruled by shoguns from the city of Edo', empire: 'tokugawa' },
  { fact: 'allowed Dutch traders only on a small island in Nagasaki harbour', empire: 'tokugawa' },
  { fact: 'expanded across Siberia to the Pacific in the 1600s, in search of furs', empire: 'russia' },
];

/** "Which of these states …?" One fact, the state it belongs to and three others. */
export function empireFactStep(rng) {
  const item = rng.pick(EMPIRE_FACTS);
  const others = rng.sample(Object.keys(EMPIRES).filter((id) => id !== item.empire), 3);
  const cap = (t) => t[0].toUpperCase() + t.slice(1);
  const e = EMPIRES[item.empire];
  return {
    text: `Which of these states **${item.fact}**?`,
    options: rng.shuffle([item.empire, ...others]).map((id) => ({ text: cap(EMPIRES[id].name), correct: id === item.empire })),
    explain: `${cap(e.name)}, whose capital was ${PLACES[e.capital].name.replace(' (Tokyo)', ', today\'s Tokyo')}.`,
  };
}

/* ---------------------------------------------- people: "who did what?" */

/**
 * id → { name, did }. `did` completes "Who …?" and is true of that person alone within its
 * group, so any three others make safe wrong answers.
 */
export const PEOPLE = {
  // lesson 4: print, Renaissance, Reformation
  gutenberg: { group: 'print', name: 'Johannes Gutenberg', did: 'printed a Bible with movable metal type in Mainz about 1455' },
  biSheng: { group: 'print', name: 'Bi Sheng', did: 'made movable type from baked clay in Song China, about 1040' },
  caxton: { group: 'print', name: 'William Caxton', did: 'set up the first printing press in England, in 1476' },
  luther: { group: 'print', name: 'Martin Luther', did: 'wrote the Ninety-five Theses and translated the Bible into German' },
  calvin: { group: 'print', name: 'John Calvin', did: 'led the Reformation in Geneva' },
  loyola: { group: 'print', name: 'Ignatius of Loyola', did: 'founded the Jesuit order in 1540' },
  erasmus: { group: 'print', name: 'Erasmus of Rotterdam', did: 'was the most famous humanist scholar of his day and published the New Testament in Greek' },
  tyndale: { group: 'print', name: 'William Tyndale', did: 'translated the New Testament into English and was executed for it' },
  leonardo: { group: 'print', name: 'Leonardo da Vinci', did: 'painted the *Mona Lisa* and filled notebooks with studies of anatomy and machines' },
  michelangelo: { group: 'print', name: 'Michelangelo', did: 'painted the ceiling of the Sistine Chapel and carved the marble *David*' },
  raphael: { group: 'print', name: 'Raphael', did: 'painted *The School of Athens* in the Vatican' },
  brunelleschi: { group: 'print', name: 'Filippo Brunelleschi', did: 'worked out the rules of perspective and built the dome of Florence cathedral' },
  // lesson 5: science and Enlightenment
  ptolemy: { group: 'science', name: 'Ptolemy', did: 'set out the Earth-centred system of the heavens, in Alexandria about 150 CE' },
  copernicus: { group: 'science', name: 'Nicolaus Copernicus', did: 'published a system with the Sun, not the Earth, at the centre, in 1543' },
  tycho: { group: 'science', name: 'Tycho Brahe', did: 'measured the positions of the planets for twenty years, more exactly than anyone before, without a telescope' },
  kepler: { group: 'science', name: 'Johannes Kepler', did: 'showed that the planets move in ellipses, not circles' },
  galileo: { group: 'science', name: 'Galileo Galilei', did: 'turned a telescope on the sky and found four moons circling Jupiter' },
  newton: { group: 'science', name: 'Isaac Newton', did: 'explained falling apples and orbiting moons with one law of gravity, in the *Principia* of 1687' },
  vesalius: { group: 'science', name: 'Andreas Vesalius', did: 'published an atlas of the human body in 1543, drawn from his own dissections' },
  harvey: { group: 'science', name: 'William Harvey', did: 'showed that the heart pumps the blood round the body in a circuit' },
  leeuwenhoek: { group: 'science', name: 'Antonie van Leeuwenhoek', did: 'saw bacteria and other single-celled life through microscopes he made himself' },
  merian: { group: 'science', name: 'Maria Sibylla Merian', did: 'sailed to Suriname to paint the life cycles of insects from life' },
  locke: { group: 'science', name: 'John Locke', did: 'argued that governments exist to protect people\'s natural rights and rule by their consent' },
  montesquieu: { group: 'science', name: 'Montesquieu', did: 'argued that power should be split between separate branches of government' },
  voltaire: { group: 'science', name: 'Voltaire', did: 'campaigned in witty French prose for religious toleration and free speech' },
  diderot: { group: 'science', name: 'Denis Diderot', did: 'edited the *Encyclopédie*, 28 volumes of knowledge and crafts' },
  kant: { group: 'science', name: 'Immanuel Kant', did: 'summed up the Enlightenment in the motto "Dare to know!"' },
  wollstonecraft: { group: 'science', name: 'Mary Wollstonecraft', did: 'argued in 1792 that women should have the same education and rights as men' },
  equiano: { group: 'science', name: 'Olaudah Equiano', did: 'published the story of his own enslavement in 1789 and campaigned against the slave trade' },
};

/** "Who …?" with four names from one group. */
export function whoStep(rng, group) {
  const ids = Object.keys(PEOPLE).filter((id) => PEOPLE[id].group === group);
  const id = rng.pick(ids);
  const others = rng.sample(ids.filter((other) => other !== id), 3);
  return {
    text: `Who **${PEOPLE[id].did}**?`,
    options: rng.shuffle([id, ...others]).map((other) => ({ text: PEOPLE[other].name, correct: other === id })),
    explain: `${PEOPLE[id].name} ${PEOPLE[id].did}.`,
  };
}

/* ------------------------------------------------------- print and reform */

/** Towns for "tap the town" on a map of western Europe, each with the clue that asks for it. */
export const PRINT_TOWNS = {
  mainz: 'where Gutenberg printed his Bible about 1455',
  venice: 'the port that printed more books than any other city by 1500',
  wittenberg: 'the university town where Luther published his theses in 1517',
  rome: 'the city of the popes, where Raphael and Michelangelo painted',
  florence: 'the banking city where the Renaissance began',
  geneva: 'the city where John Calvin led the Reformation',
  paris: 'the French capital, with presses from 1470',
  london: 'the English capital, beside which William Caxton set up England\'s first press in 1476',
};

/**
 * The main Christian traditions of Europe about 1600, very roughly, on today's borders
 * (for colouring a map; never for grading a single country).
 */
export const RELIGION_1600 = {
  protestant: ['SE', 'NO', 'DK', 'FI', 'IS', 'EE', 'LV', 'GB', 'NL'],
  catholic: ['ES', 'PT', 'IT', 'FR', 'BE', 'LU', 'AT', 'PL', 'LT', 'IE', 'HR', 'SI', 'MT'],
  mixed: ['DE', 'CH', 'HU', 'CZ', 'SK'],
  orthodox: ['RU', 'UA', 'BY', 'GR', 'RS', 'BG', 'RO', 'MD', 'MK', 'ME', 'CY'],
};

/* ---------------------------------------------------- science: where it happened */

/** Who worked where, for "tap the country" on a map of Europe (today's borders). */
export const SCIENCE_HOMES = [
  { who: 'Copernicus', did: 'worked out his Sun-centred system at Frombork, on the Baltic coast', place: 'frombork', country: 'PL' },
  { who: 'Galileo', did: 'built his telescopes at Padua and argued for the moving Earth in Florence', place: 'padua', country: 'IT' },
  { who: 'Kepler', did: 'found that the planets move in ellipses while he lived in Prague', place: 'prague', country: 'CZ' },
  { who: 'Newton', did: 'wrote the *Principia* at Cambridge', place: 'cambridge', country: 'GB' },
  { who: 'Leeuwenhoek', did: 'made his microscopes in Delft', place: 'delft', country: 'NL' },
  { who: 'Diderot', did: 'edited the *Encyclopédie* in Paris', place: 'paris', country: 'FR' },
];

/* ------------------------------------------------------ the Atlantic slave trade */

/**
 * Where the survivors of the Middle Passage were landed, 1501 to 1867: estimates from the
 * SlaveVoyages database (Eltis and Richardson), rounded to the nearest 100,000. `exact` keeps
 * the published estimate. Altogether about 12.5 million people were embarked and about 10.7
 * million landed alive.
 */
export const EMBARKED = 12.5;
export const LANDED = 10.7;
export const DESTINATIONS = [
  { id: 'brazil', name: 'Brazil', millions: 4.9, exact: 4864374 },
  { id: 'britishCaribbean', name: 'The British Caribbean', short: 'British\nCaribbean', millions: 2.3, exact: 2318252 },
  { id: 'spanishAmericas', name: 'Spanish America', short: 'Spanish\nAmerica', millions: 1.3, exact: 1292912 },
  { id: 'frenchCaribbean', name: 'The French Caribbean', short: 'French\nCaribbean', millions: 1.1, exact: 1120216 },
  { id: 'dutchAmericas', name: 'The Dutch colonies', short: 'Dutch\ncolonies', millions: 0.4, exact: 444728 },
  { id: 'northAmerica', name: 'Mainland North America', short: 'North\nAmerica', millions: 0.4, exact: 388747 },
];

/**
 * "Which of these received the most?" Three destinations whose estimates are far enough
 * apart (the largest at least one and a half times the next) for the answer to be safe.
 */
export function whereMostStep(rng) {
  let trio = null;
  for (let tries = 0; tries < 300 && !trio; tries++) {
    const pick = rng.sample(DESTINATIONS, 3).sort((a, b) => b.exact - a.exact);
    if (pick[0].exact >= 1.5 * pick[1].exact) trio = pick;
  }
  const lower = (name) => name.replace(/^The /, 'the ').replace(/^Mainland /, 'mainland ');
  const fmt = (d) => (d.exact >= 950000 ? `about ${d.millions} million` : `about ${Math.round(d.exact / 10000) * 10},000`);
  return {
    text: 'About 10.7 million enslaved Africans survived the Atlantic crossing between 1501 and 1867. **Which of these three regions received the most of them?**',
    options: rng.shuffle(trio).map((d) => ({ text: d.name, correct: d === trio[0] })),
    explain: `${trio[0].name}: ${fmt(trio[0])}. By the same estimates, ${lower(trio[1].name)} received ${fmt(trio[1])} and ${lower(trio[2].name)} ${fmt(trio[2])}. Brazil alone took nearly half of all those who survived the crossing, and mainland North America fewer than one in twenty-five.`,
  };
}

/** Events for "which came first?" in the last lesson. */
export const ABOLITION_EVENTS = ['equiano', 'haitiRevolt', 'britainTradeBan', 'britainAbolition', 'franceAbolition', 'usAbolition', 'brazilAbolition'];
