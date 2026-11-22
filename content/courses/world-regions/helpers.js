// Around the World: Places and Cultures · shared tables and question builders
//
// Everything the eight lessons drill lives here once: the countries a learner should be able to
// find (with a clue and a fact each), the cities, the physical anchors, the landmarks with their
// photographs, and the dated events. The lessons build their maps, their order steps and their
// generated practice from these tables, so a correction is made in one place.
//
// Coordinates are [longitude, latitude], east and north positive.
import { countryName, countryInfo, distanceKm } from '../../../src/widgets/world-map.js';
import { photo } from '../../media.js';
import { MEDIA } from '../../media/world-regions/index.js';

/* ------------------------------------------------------------------ names and directions */

const WITH_THE = new Set(['NL', 'GB', 'US', 'PH', 'MV', 'CD', 'GM', 'CF', 'BS', 'AE', 'DO']);
/** "the Netherlands", "France": a country's name as it reads in the middle of a sentence. */
export const theName = (id) => (WITH_THE.has(id) ? `the ${countryName(id)}` : countryName(id));
/** The same at the start of a sentence. */
export const TheName = (id) => (WITH_THE.has(id) ? `The ${countryName(id)}` : countryName(id));

/** Where a country's name sits on the map; a few label points are moved to the part people think of. */
const CENTER_FIX = { RU: [40, 56], US: [-98, 39.5], CA: [-100, 57], NO: [9.5, 61.5], MY: [102.5, 4], ID: [113.5, -1.5], FR: [2.5, 46.6], CL: [-71, -33], NZ: [173, -41.5], PT: [-8, 39.6] };
export const centerOf = (id) => CENTER_FIX[id] || (countryInfo(id) || {}).center || null;

const WINDS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
/**
 * The compass direction (one of eight) in which `to` lies when seen from `from`: the direction you
 * would hold on a compass to get there (a rhumb line), which is what "further west" means on a map.
 * A great-circle bearing would send a learner "north-west" from Greenland to reach Alaska.
 */
export function compass(from, to) {
  const rad = Math.PI / 180;
  const stretch = (lat) => Math.log(Math.tan(Math.PI / 4 + (Math.max(-85, Math.min(85, lat)) * rad) / 2));
  let dLon = to[0] - from[0];
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  const bearing = (Math.atan2(dLon * rad, stretch(to[1]) - stretch(from[1])) / rad + 360) % 360;
  return WINDS[Math.round(bearing / 45) % 8];
}
const slug = (text) => String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ------------------------------------------------------------------ map windows */

export const VIEW = {
  europe: [-25, 34, 45, 72],
  centralEurope: [3, 44.5, 25, 55.5],
  balkans: [12.5, 34.5, 30.5, 48],
  baltic: [12, 52.5, 32, 61.5],
  mena: [-18, 11, 64, 44],
  maghreb: [-14, 29.5, 26, 39],          // cut off near 29° N on purpose: see the note on Western Sahara in the lesson
  middleEast: [24, 11, 64, 43],
  africa: [-20, -36, 53, 38],
  subSahara: [-19, -36, 52, 22],
  westAfrica: [-19, 3, 16, 28],
  eastAfrica: [21, -13, 52, 19],
  southernAfrica: [10, -36, 52, -4],
  centralAfrica: [6, -14, 32, 24],
  southAsia: [60, 4, 98, 38],
  eastAsia: [73, 17, 147, 54],
  southeastAsia: [91, -12, 142, 29],
  australasia: [110, -48, 180, 0],
  seaOceania: [91, -48, 180, 29],
  southAmerica: [-83, -57, -33, 14],
  middleAmerica: [-118, 6, -58, 33],
  latinAmerica: [-118, -57, -33, 33],
  northAmerica: [-168, 8, -38, 78],
  usCanada: [-130, 23, -60, 62],
};

/**
 * What may be tapped on the "find the country" maps: the sovereign states in view, without the
 * places whose status is disputed (Kosovo, Taiwan, Palestine, Western Sahara), so that no tap
 * there is ever marked right or wrong.
 *
 * Two more are left out because of how the map data draws them (see docs/MAPS.md): Russia on the
 * maps of Europe, whose shape includes Crimea, and Morocco on the maps of Africa south of the
 * Sahara, whose shape includes most of Western Sahara. A tap there would otherwise be answered
 * with "That is Russia" or "That is Morocco". Neither is a country to find in those lessons.
 * (The Maghreb map of the Middle East lesson stops north of Western Sahara, so Morocco stays there.)
 */
export const PICKABLE = {
  europe: ['AL', 'AT', 'BA', 'BE', 'BG', 'BY', 'CH', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LT', 'LV', 'MD', 'ME', 'MK', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'SE', 'SI', 'SK', 'UA', 'TR'],
  mena: ['MA', 'DZ', 'TN', 'LY', 'EG', 'SD', 'SA', 'YE', 'OM', 'AE', 'QA', 'KW', 'IQ', 'IR', 'TR', 'SY', 'JO', 'LB', 'IL', 'ML', 'NE', 'TD', 'MR', 'ES', 'IT', 'GR', 'AF', 'PK', 'TM', 'ET', 'ER'],
  africa: ['AO', 'BF', 'BJ', 'BW', 'CD', 'CF', 'CG', 'CI', 'CM', 'DZ', 'EG', 'ER', 'ET', 'GA', 'GH', 'GN', 'KE', 'LR', 'LY', 'MG', 'ML', 'MR', 'MW', 'MZ', 'NA', 'NE', 'NG', 'RW', 'BI', 'SD', 'SL', 'SN', 'SO', 'SS', 'TD', 'TG', 'TN', 'TZ', 'UG', 'ZA', 'ZM', 'ZW', 'LS', 'SZ', 'GQ', 'GM', 'GW', 'DJ'],
  southAsia: ['IN', 'PK', 'BD', 'NP', 'BT', 'LK', 'AF', 'IR', 'CN', 'MM', 'TJ', 'TM', 'UZ', 'MV'],
  eastAsia: ['CN', 'MN', 'JP', 'KR', 'KP', 'RU', 'KZ', 'IN', 'VN', 'MM', 'NP', 'KG', 'LA', 'TH', 'PH'],
  seaOceania: ['MM', 'TH', 'LA', 'VN', 'KH', 'MY', 'ID', 'PH', 'BN', 'TL', 'SG', 'AU', 'NZ', 'PG', 'CN', 'IN', 'BD', 'SB', 'FJ', 'VU'],
  latinAmerica: ['MX', 'GT', 'BZ', 'HN', 'SV', 'NI', 'CR', 'PA', 'CU', 'HT', 'DO', 'JM', 'CO', 'VE', 'GY', 'SR', 'EC', 'PE', 'BR', 'BO', 'PY', 'UY', 'AR', 'CL', 'US', 'BS', 'TT'],
  northAmerica: ['US', 'CA', 'MX', 'GL', 'CU', 'GT', 'BS', 'IS', 'RU', 'HT', 'DO', 'BZ', 'HN'],
};

/* ------------------------------------------------------------------ countries to find */
// id, the window that makes it a comfortable tap, a clue to its position, and one fact worth keeping.

const C = (id, view, where, fact) => ({ id, view, where, fact });

export const FIND = {
  europe: [
    C('IS', 'europe', 'The island far out in the North Atlantic, just below the Arctic Circle.', 'Iceland sits on the Mid-Atlantic Ridge, where two plates pull apart: hence its volcanoes and hot springs.'),
    C('IE', 'europe', 'The island west of Great Britain.', 'The island of Ireland holds the Republic of Ireland and, in its north-east corner, Northern Ireland, which is part of the United Kingdom.'),
    C('GB', 'europe', 'The large island off the north-west coast of the mainland.', 'The United Kingdom is four nations in one state: England, Scotland, Wales and Northern Ireland.'),
    C('PT', 'europe', 'The strip on the Atlantic edge of the Iberian Peninsula.', 'Portugal\'s land border has hardly moved since the thirteenth century: it is among the oldest in Europe.'),
    C('ES', 'europe', 'It fills most of the Iberian Peninsula, in the south-west corner of Europe.', 'At the Strait of Gibraltar, Spain is only about 14 km from Africa.'),
    C('FR', 'europe', 'Between Spain and Germany, with coasts on both the Atlantic and the Mediterranean.', 'France is the largest country of the European Union by area.'),
    C('DE', 'europe', 'In the centre, between France and Poland, with short coasts on the North Sea and the Baltic.', 'Germany has nine neighbours and the largest population in the European Union, about 84 million.'),
    C('IT', 'europe', 'The boot-shaped peninsula in the middle of the Mediterranean.', 'Italy surrounds two tiny independent states: Vatican City and San Marino.'),
    C('PL', 'europe', 'East of Germany, on the Baltic Sea.', 'Poland vanished from the map from 1795 to 1918, divided among its neighbours, and then returned.'),
    C('SE', 'europe', 'The long country on the eastern side of the Scandinavian Peninsula, facing the Baltic.', 'More than half of Sweden is forest.'),
    C('NO', 'europe', 'The long Atlantic edge of the Scandinavian Peninsula, cut by fjords.', 'Norway\'s fjords are valleys carved by Ice Age glaciers and then flooded by the sea.'),
    C('FI', 'europe', 'East of Sweden, between the Baltic and Russia.', 'Finnish is not related to Swedish or Russian: it belongs to the Uralic family, with Estonian and, more distantly, Hungarian.'),
    C('GR', 'europe', 'The southern tip of the Balkan Peninsula, with islands scattered across the Aegean.', 'Greece has thousands of islands, of which a couple of hundred are inhabited.'),
    C('RO', 'europe', 'On the Black Sea, north of Bulgaria; the Danube ends here in a great delta.', 'Romanian is a Romance language: a descendant of Latin surrounded by Slavic and Hungarian speakers.'),
    C('NL', 'centralEurope', 'On the North Sea, where the Rhine reaches the coast, north of Belgium.', 'About a quarter of the Netherlands lies below sea level, kept dry by dikes and pumps.'),
    C('BE', 'centralEurope', 'Between France and the Netherlands, on the North Sea.', 'Belgium has three official languages (Dutch, French and German), and its capital Brussels hosts the main institutions of the European Union.'),
    C('CH', 'centralEurope', 'Landlocked in the Alps, between France, Germany, Italy and Austria.', 'Switzerland has four national languages (German, French, Italian and Romansh) and is not a member of the European Union.'),
    C('AT', 'centralEurope', 'East of Switzerland, in the Alps; the Danube crosses its north.', 'Vienna was for centuries the seat of the Habsburg empire, which is why a small country has so grand a capital.'),
    C('CZ', 'centralEurope', 'Landlocked, tucked between Germany, Poland, Slovakia and Austria.', 'Czechia and Slovakia were one country, Czechoslovakia, until they separated peacefully at the start of 1993.'),
    C('DK', 'centralEurope', 'The peninsula and islands pointing north from Germany, between the North Sea and the Baltic.', 'Denmark is small, but Greenland, the world\'s largest island, is a self-governing part of the Danish kingdom.'),
    C('HU', 'centralEurope', 'Landlocked on the plain where the Danube turns south, east of Austria.', 'Hungarian is a Uralic language, brought by the Magyars, who arrived from the east around 900 CE.'),
    C('SK', 'centralEurope', 'Landlocked, south of Poland and east of Czechia.', 'Slovakia (capital Bratislava) is often confused with Slovenia (capital Ljubljana), which lies further south-west and touches the Adriatic Sea.'),
    C('SI', 'centralEurope', 'At the head of the Adriatic Sea, between Italy, Austria and Croatia.', 'Slovenia (capital Ljubljana) is often confused with Slovakia (capital Bratislava), which lies further north-east and has no coast.'),
    C('HR', 'balkans', 'The crescent along the eastern shore of the Adriatic Sea.', 'Croatia\'s long Adriatic coast has more than a thousand islands.'),
    C('BA', 'balkans', 'Inland from Croatia\'s coast, almost landlocked.', 'Bosnia and Herzegovina has only about 20 km of coast. Its people are mainly Bosniak Muslims, Orthodox Serbs and Catholic Croats.'),
    C('BG', 'balkans', 'On the Black Sea, south of Romania across the Danube.', 'The Cyrillic alphabet took shape in Bulgaria around 900 CE, and spread from there to Serbia and Russia.'),
    C('AL', 'balkans', 'On the Adriatic coast, north-west of Greece.', 'Albanian forms a branch of the Indo-European family all by itself, with no close relatives.'),
    C('MK', 'balkans', 'Landlocked, directly north of Greece.', 'North Macedonia took its present name in 2019, settling a long dispute with Greece over the name Macedonia.'),
    C('EE', 'baltic', 'The northernmost of the three Baltic states, facing Finland across a narrow gulf.', 'Estonian is a close cousin of Finnish. From north to south the Baltic states run Estonia, Latvia, Lithuania.'),
    C('LV', 'baltic', 'The middle one of the three Baltic states.', 'From north to south the Baltic states run Estonia, Latvia, Lithuania. All three regained independence from the Soviet Union in 1991.'),
    C('LT', 'baltic', 'The southernmost and largest of the three Baltic states, bordering Poland.', 'In the fourteenth and fifteenth centuries the Grand Duchy of Lithuania was one of the largest states in Europe, reaching almost to the Black Sea.'),
  ],
  mena: [
    C('MA', 'maghreb', 'The north-west corner of Africa, facing Spain across the Strait of Gibraltar.', 'Morocco has both an Atlantic and a Mediterranean coast, and the Atlas Mountains wall its farmland off from the Sahara. (This map stops short of Western Sahara, to the south: Morocco controls most of that territory and claims it, but its status is disputed.)'),
    C('DZ', 'maghreb', 'The giant between Morocco and Tunisia, stretching deep into the Sahara.', 'Algeria is the largest country in Africa by area, and more than four-fifths of it is desert.'),
    C('TN', 'maghreb', 'The small country at Africa\'s northern tip, between Algeria and Libya.', 'Tunisia\'s capital, Tunis, stands beside the ruins of ancient Carthage.'),
    C('LY', 'maghreb', 'On the Mediterranean, between Tunisia and Egypt.', 'Libya is almost all desert: nearly everyone lives along the narrow Mediterranean coast.'),
    C('EG', 'middleEast', 'The north-east corner of Africa, where the Nile reaches the Mediterranean.', 'Egypt spans two continents: the Sinai Peninsula, east of the Suez Canal, is in Asia.'),
    C('SA', 'middleEast', 'It covers most of the Arabian Peninsula.', 'Saudi Arabia is the largest country in the world with no permanent river. It holds Islam\'s two holiest cities, Mecca and Medina.'),
    C('YE', 'middleEast', 'The south-west corner of the Arabian Peninsula, at the mouth of the Red Sea.', 'Yemen\'s highlands catch summer rain, which makes it the green corner of Arabia. The first great coffee trade ran through its port of Mocha.'),
    C('OM', 'middleEast', 'The south-east corner of the Arabian Peninsula, facing the Arabian Sea.', 'Oman\'s sailors traded for centuries with India and East Africa; in the nineteenth century its sultans ruled Zanzibar.'),
    C('IQ', 'middleEast', 'The land of the Tigris and the Euphrates, between Syria and Iran.', 'Iraq covers most of ancient Mesopotamia, "the land between the rivers", where the first cities grew.'),
    C('IR', 'middleEast', 'The large country east of Iraq, between the Caspian Sea and the Persian Gulf.', 'Iran was known in the West as Persia until 1935. Its main language is Persian (Farsi), not Arabic.'),
    C('TR', 'middleEast', 'The broad peninsula between the Black Sea and the Mediterranean.', 'About 3% of Turkey, including part of Istanbul, lies in Europe; the rest, Anatolia, is in Asia.'),
    C('SY', 'middleEast', 'On the eastern Mediterranean, south of Turkey and west of Iraq.', 'Syria\'s capital, Damascus, is among the oldest continuously inhabited cities in the world.'),
    C('JO', 'middleEast', 'East of the Jordan River, north-west of Saudi Arabia.', 'Jordan holds Petra, a city carved into rose-red sandstone about 2,000 years ago.'),
    C('AE', 'middleEast', 'On the southern shore of the Persian Gulf, near its narrow exit.', 'The United Arab Emirates is a federation of seven emirates, formed in 1971. Abu Dhabi is its capital; Dubai is its largest city.'),
  ],
  africa: [
    C('NG', 'westAfrica', 'On the Gulf of Guinea, where the Niger River reaches the sea.', 'Nigeria is Africa\'s most populous country: roughly one African in six is Nigerian.'),
    C('GH', 'westAfrica', 'On the Gulf of Guinea, between Ivory Coast and Togo.', 'Ghana took its name from a medieval empire that lay far to the north-west. In 1957 it led the wave of independence south of the Sahara.'),
    C('SN', 'westAfrica', 'The westernmost country of mainland Africa; it almost surrounds the Gambia.', 'Dakar, Senegal\'s capital, stands on the westernmost point of the African mainland.'),
    C('ML', 'westAfrica', 'Large and landlocked; the Niger River makes its great bend here.', 'Mali is named after the medieval empire of Mansa Musa. Timbuktu and Djenné are both here.'),
    C('NE', 'westAfrica', 'Landlocked, directly north of Nigeria.', 'Niger and Nigeria are both named after the Niger River, but Niger was a French colony and Nigeria a British one, and they became separate countries.'),
    C('CI', 'westAfrica', 'On the Gulf of Guinea, west of Ghana.', 'Ivory Coast (Côte d\'Ivoire) grows more cocoa than any other country: around two-fifths of the world\'s supply.'),
    C('ET', 'eastAfrica', 'Landlocked on a high plateau in the Horn of Africa, west of Somalia.', 'Apart from a five-year Italian occupation (1936 to 1941), Ethiopia was never colonised. It has its own script and its own calendar.'),
    C('KE', 'eastAfrica', 'On the equator and the Indian Ocean, south of Ethiopia.', 'Kenya straddles the equator, and the Great Rift Valley runs through it from north to south.'),
    C('TZ', 'eastAfrica', 'On the Indian Ocean, south of Kenya.', 'Tanzania was formed in 1964, when Tanganyika united with the islands of Zanzibar: the name blends the two.'),
    C('UG', 'eastAfrica', 'Landlocked, on the northern shore of Lake Victoria.', 'In Uganda the White Nile begins its journey north, flowing out of Lake Victoria.'),
    C('SO', 'eastAfrica', 'The tip of the Horn of Africa, shaped like a figure 7.', 'Somalia has the longest coastline of any country on the African mainland.'),
    C('ZA', 'southernAfrica', 'The southern tip of the continent.', 'South Africa spreads its government over three capital cities: Pretoria, Cape Town and Bloemfontein.'),
    C('NA', 'southernAfrica', 'On the Atlantic coast, north-west of South Africa.', 'Namibia is named after the Namib, a coastal desert often called the oldest in the world.'),
    C('BW', 'southernAfrica', 'Landlocked, directly north of South Africa.', 'Botswana is mostly Kalahari, yet the Okavango River spreads into a vast inland delta here instead of reaching the sea.'),
    C('ZW', 'southernAfrica', 'Landlocked, between the Zambezi and the Limpopo rivers.', 'Zimbabwe is named after Great Zimbabwe, the stone city built here between the eleventh and fifteenth centuries.'),
    C('ZM', 'southernAfrica', 'Landlocked, north of Zimbabwe across the Zambezi.', 'Zambia takes its name from the Zambezi. Victoria Falls lies on its border with Zimbabwe.'),
    C('MZ', 'southernAfrica', 'The long Indian Ocean coast that faces Madagascar.', 'Mozambique was a Portuguese colony until 1975, and Portuguese is still its official language.'),
    C('AO', 'southernAfrica', 'On the Atlantic coast, south of the mouth of the Congo River.', 'Angola is one of Africa\'s Portuguese-speaking countries and one of its largest oil producers.'),
    C('MG', 'southernAfrica', 'The great island off the south-east coast.', 'Madagascar was first settled by seafarers from Borneo, on the far side of the Indian Ocean: Malagasy is related to the languages of Indonesia.'),
    C('CD', 'centralAfrica', 'The huge country in the heart of the continent, with only a sliver of Atlantic coast.', 'The DR Congo is the largest country south of the Sahara. Its capital, Kinshasa, faces Brazzaville, capital of the other Congo, across the river.'),
    C('CM', 'centralAfrica', 'Where the west coast of Africa turns south, east of Nigeria.', 'Cameroon uses both French and English officially: after 1919 it was split between France and Britain.'),
    C('TD', 'centralAfrica', 'Landlocked, directly south of Libya.', 'Chad is named after Lake Chad, which has shrunk to a fraction of the size it had in the 1960s.'),
  ],
  southAsia: [
    C('IN', 'southAsia', 'The great triangle that points into the Indian Ocean.', 'In 2023 India passed China to become the most populous country in the world.'),
    C('PK', 'southAsia', 'North-west of India, along the Indus River.', 'Nearly all of Pakistan\'s farmland depends on one river system, the Indus.'),
    C('BD', 'southAsia', 'On the delta of the Ganges and the Brahmaputra, almost surrounded by India.', 'Bangladesh has about 170 million people on a low river delta: it is one of the most crowded places on Earth.'),
    C('NP', 'southAsia', 'The long rectangle along the Himalaya, between India and China.', 'Nepal has eight of the world\'s ten highest peaks, and the only national flag that is not a rectangle.'),
    C('BT', 'southAsia', 'The small Himalayan kingdom east of Nepal.', 'Bhutan\'s constitution requires that at least 60% of the country stay under forest.'),
    C('LK', 'southAsia', 'The teardrop-shaped island off India\'s southern tip.', 'Sri Lanka was called Ceylon until 1972, a name that survives on tea packets around the world.'),
    C('AF', 'southAsia', 'Landlocked and mountainous, north-west of Pakistan.', 'Afghanistan is a hinge between South Asia, Central Asia and the Middle East; the Hindu Kush range crosses it.'),
  ],
  eastAsia: [
    C('CN', 'eastAsia', 'The largest country of the region, from the Pacific coast to the heart of Asia.', 'China has land borders with fourteen countries, as many as Russia and more than any other.'),
    C('MN', 'eastAsia', 'Landlocked between Russia and China.', 'Mongolia is the most thinly peopled country in the world: about two people per square kilometre.'),
    C('JP', 'eastAsia', 'The arc of islands off the east coast of Asia.', 'Japan has four main islands (Hokkaido, Honshu, Shikoku and Kyushu) and thousands of small ones.'),
    C('KR', 'eastAsia', 'The southern half of the Korean Peninsula.', 'About half of all South Koreans live in and around the capital, Seoul.'),
    C('KP', 'eastAsia', 'The northern half of the Korean Peninsula, bordering China.', 'Korea has been divided since 1945. The war of 1950 to 1953 ended in an armistice, not a peace treaty.'),
  ],
  seaOceania: [
    C('MM', 'southeastAsia', 'The westernmost country of mainland Southeast Asia, on the Bay of Bengal.', 'Myanmar was known as Burma until 1989; the Irrawaddy River runs almost its whole length.'),
    C('TH', 'southeastAsia', 'In the middle of the mainland, with a long tail down the Malay Peninsula.', 'Thailand is the only country of Southeast Asia that was never colonised by a European power.'),
    C('LA', 'southeastAsia', 'The only landlocked country of Southeast Asia, along the Mekong.', 'Laos is the only country of Southeast Asia without a coast; the Mekong is its main highway.'),
    C('VN', 'southeastAsia', 'The long S-shaped coast on the South China Sea.', 'Vietnam is about 1,650 km long but, at its waist, only about 50 km wide.'),
    C('KH', 'southeastAsia', 'Between Thailand and southern Vietnam, on the lower Mekong.', 'Cambodia\'s flag shows Angkor Wat, the temple at the heart of the medieval Khmer empire.'),
    C('MY', 'southeastAsia', 'In two parts: the southern Malay Peninsula and the north of the island of Borneo.', 'The two halves of Malaysia are separated by about 600 km of the South China Sea.'),
    C('ID', 'southeastAsia', 'The great arc of islands along the equator, from Sumatra to New Guinea.', 'Indonesia has more than 17,000 islands, yet more than half of its people live on just one of them, Java.'),
    C('PH', 'southeastAsia', 'The island group east of Vietnam, across the South China Sea.', 'The Philippines has more than 7,000 islands. More than three centuries of Spanish rule left it mostly Catholic.'),
    C('AU', 'australasia', 'The island continent.', 'Australia is the only country that covers a whole continent: the flattest one and, apart from Antarctica, the driest.'),
    C('NZ', 'australasia', 'Two main islands far to the south-east of Australia, across the Tasman Sea.', 'Aotearoa New Zealand was the last large landmass that people settled: Polynesian voyagers arrived around 1300 CE.'),
    C('PG', 'australasia', 'The eastern half of the island of New Guinea, just north of Australia.', 'Papua New Guinea has more languages than any other country: about 840.'),
  ],
  latinAmerica: [
    C('MX', 'middleAmerica', 'South of the United States, between the Pacific and the Gulf of Mexico.', 'Mexico has more Spanish speakers than any other country: about 130 million.'),
    C('GT', 'middleAmerica', 'Directly south-east of Mexico.', 'Roughly four in ten Guatemalans are Maya, speaking more than twenty Maya languages.'),
    C('CU', 'middleAmerica', 'The long island south of Florida.', 'Cuba is the largest island of the Caribbean, and the home of son and rumba, two of the roots of salsa.'),
    C('DO', 'middleAmerica', 'The eastern two-thirds of the island of Hispaniola.', 'The Dominican Republic shares Hispaniola with Haiti. Its capital, Santo Domingo, founded in 1496, is the oldest European-founded city in the Americas that is still lived in.'),
    C('PA', 'middleAmerica', 'The narrow S-shaped isthmus that joins Central and South America.', 'The Panama Canal, opened in 1914, cuts across Panama to join the Atlantic and the Pacific.'),
    C('BR', 'southAmerica', 'The giant that fills the eastern half of South America.', 'Brazil borders every South American country except Chile and Ecuador, and is the only Portuguese-speaking country in the Americas.'),
    C('AR', 'southAmerica', 'The wide southern cone east of the Andes.', 'Argentina is the largest Spanish-speaking country by area; the grasslands of the Pampas are its farming heart.'),
    C('CL', 'southAmerica', 'The ribbon between the Andes and the Pacific.', 'Chile is about 4,300 km long but on average less than 200 km wide.'),
    C('PE', 'southAmerica', 'On the Pacific, south of Ecuador; the Andes run down its middle.', 'Peru was the heart of the Inca empire. Quechua, the language of the Incas, is still spoken by millions.'),
    C('CO', 'southAmerica', 'The north-west corner of South America, next to Panama.', 'Colombia is the only South American country with coasts on both the Pacific Ocean and the Caribbean Sea.'),
    C('VE', 'southAmerica', 'On the Caribbean coast, east of Colombia.', 'Venezuela has Angel Falls, the highest waterfall in the world: the water drops almost a kilometre.'),
    C('BO', 'southAmerica', 'Landlocked in the Andes, between Peru and Brazil.', 'Bolivia lost its coast to Chile in the 1880s. La Paz, its seat of government, lies about 3,600 metres above sea level.'),
    C('EC', 'southAmerica', 'On the Pacific, between Colombia and Peru.', 'Ecuador is named after the equator, which crosses it just north of the capital, Quito. The Galápagos Islands belong to it.'),
    C('PY', 'southAmerica', 'Landlocked, between Argentina, Brazil and Bolivia.', 'In Paraguay most people speak Guaraní, an Indigenous language, alongside Spanish.'),
    C('UY', 'southAmerica', 'The small country on the Atlantic between Argentina and Brazil.', 'Uruguay hosted, and won, the first football World Cup, in 1930.'),
  ],
  northAmerica: [
    C('US', 'northAmerica', 'Between Canada and Mexico, plus Alaska in the far north-west.', 'The United States has 50 states: 48 in one block, plus Alaska and Hawaii.'),
    C('CA', 'northAmerica', 'The northern half of the continent, from the Atlantic to the Pacific and up into the Arctic.', 'Canada is the second-largest country in the world by area, yet it has only about 40 million people.'),
    C('MX', 'northAmerica', 'South of the United States, narrowing towards Central America.', 'Mexico is part of North America by geography and of Latin America by language and history: both labels are right.'),
    C('GL', 'northAmerica', 'The huge ice-covered island to the north-east of Canada.', 'Greenland is the world\'s largest island: a self-governing territory within the Kingdom of Denmark, whose people are mostly Inuit.'),
  ],
};

const VIEW_WORDS = {
  europe: 'Europe', centralEurope: 'central Europe', balkans: 'south-eastern Europe', baltic: 'the lands around the Baltic Sea',
  maghreb: 'north-west Africa', middleEast: 'the Middle East', westAfrica: 'West Africa', eastAfrica: 'East Africa',
  southernAfrica: 'southern Africa', centralAfrica: 'Central Africa', southAsia: 'South Asia', eastAsia: 'East Asia',
  southeastAsia: 'Southeast Asia', australasia: 'the south-west Pacific', middleAmerica: 'Middle America and the Caribbean',
  southAmerica: 'South America', northAmerica: 'North America', mena: 'North Africa and the Middle East', subSahara: 'Africa south of the Sahara',
  latinAmerica: 'Latin America', usCanada: 'the United States and southern Canada', seaOceania: 'Southeast Asia and Australia', africa: 'Africa',
};

/**
 * "Find France on the map": a tap-the-country step drawn from a pool of FIND entries.
 * Returns the fields of an `interact` step.
 */
export function findCountry(rng, pool, pickable) {
  const t = rng.pick(pool);
  const name = theName(t.id);
  return {
    text: `Find **${name}** on the map and tap it.`,
    widget: {
      type: 'world-map', view: VIEW[t.view], mode: 'pick', pickable, answer: t.id,
      alt: `A map of ${VIEW_WORDS[t.view]} without names`,
    },
    check: (s) => {
      if (s.picked === t.id) return true;
      if (!s.picked) return 'Tap a country first.';
      const from = centerOf(s.picked);
      const to = centerOf(t.id);
      return `That is ${theName(s.picked)}. ${TheName(t.id)} lies to the ${compass(from, to)} of it.`;
    },
    solution: { picked: t.id },
    hints: [t.where],
    explain: `${t.where} ${t.fact}`,
  };
}

/* ------------------------------------------------------------------ cities */
// name: [lon, lat, country, capital of that country (1) or not (0)]

export const CITIES = {
  // Europe
  London: [-0.12, 51.5, 'GB', 1], Paris: [2.33, 48.87, 'FR', 1], Berlin: [13.4, 52.52, 'DE', 1], Madrid: [-3.69, 40.4, 'ES', 1],
  Rome: [12.48, 41.9, 'IT', 1], Lisbon: [-9.15, 38.72, 'PT', 1], Dublin: [-6.25, 53.34, 'IE', 1], Warsaw: [21, 52.25, 'PL', 1],
  Athens: [23.73, 37.99, 'GR', 1], Stockholm: [18.1, 59.35, 'SE', 1], Oslo: [10.75, 59.92, 'NO', 1], Helsinki: [24.93, 60.18, 'FI', 1],
  Vienna: [16.36, 48.2, 'AT', 1], Budapest: [19.08, 47.5, 'HU', 1], Bucharest: [26.1, 44.44, 'RO', 1], Kyiv: [30.51, 50.44, 'UA', 1],
  Moscow: [37.61, 55.75, 'RU', 1], 'Reykjavík': [-21.95, 64.15, 'IS', 1], Sofia: [23.31, 42.69, 'BG', 1], Copenhagen: [12.56, 55.68, 'DK', 1],
  Amsterdam: [4.91, 52.35, 'NL', 1], Brussels: [4.33, 50.84, 'BE', 1], Prague: [14.46, 50.09, 'CZ', 1],
  Barcelona: [2.18, 41.39, 'ES', 0], Milan: [9.2, 45.47, 'IT', 0], 'Saint Petersburg': [30.31, 59.94, 'RU', 0], Istanbul: [29.01, 41.11, 'TR', 0],
  // North Africa and the Middle East
  Rabat: [-6.84, 34.03, 'MA', 1], Casablanca: [-7.62, 33.6, 'MA', 0], Algiers: [3.05, 36.77, 'DZ', 1], Tunis: [10.18, 36.8, 'TN', 1],
  Tripoli: [13.18, 32.89, 'LY', 1], Cairo: [31.25, 30.05, 'EG', 1], Riyadh: [46.77, 24.64, 'SA', 1], Muscat: [58.59, 23.61, 'OM', 1],
  Baghdad: [44.39, 33.34, 'IQ', 1], Tehran: [51.42, 35.67, 'IR', 1], Ankara: [32.86, 39.93, 'TR', 1], Damascus: [36.3, 33.5, 'SY', 1],
  Amman: [35.93, 31.95, 'JO', 1], 'Abu Dhabi': [54.37, 24.47, 'AE', 1], Dubai: [55.28, 25.23, 'AE', 0], Doha: [51.53, 25.29, 'QA', 1],
  'Kuwait City': [47.98, 29.37, 'KW', 1], Mecca: [39.82, 21.43, 'SA', 0], Medina: [39.58, 24.5, 'SA', 0], Fez: [-5, 34.06, 'MA', 0],
  Isfahan: [51.7, 32.7, 'IR', 0], Alexandria: [29.95, 31.2, 'EG', 0],
  // Africa south of the Sahara
  Abuja: [7.53, 9.09, 'NG', 1], Lagos: [3.39, 6.45, 'NG', 0], Accra: [-0.22, 5.55, 'GH', 1], Dakar: [-17.48, 14.72, 'SN', 1],
  Bamako: [-8, 12.65, 'ML', 1], Niamey: [2.11, 13.52, 'NE', 1], 'Addis Ababa': [38.7, 9.04, 'ET', 1], Nairobi: [36.81, -1.28, 'KE', 1],
  Kampala: [32.58, 0.32, 'UG', 1], Kinshasa: [15.31, -4.33, 'CD', 1], Luanda: [13.23, -8.84, 'AO', 1], Lusaka: [28.28, -15.41, 'ZM', 1],
  Harare: [31.04, -17.82, 'ZW', 1], Maputo: [32.59, -25.95, 'MZ', 1], Windhoek: [17.08, -22.57, 'NA', 1], Gaborone: [25.91, -24.65, 'BW', 1],
  Antananarivo: [47.51, -18.91, 'MG', 1], Mogadishu: [45.36, 2.07, 'SO', 1], 'N\'Djamena': [15.05, 12.12, 'TD', 1], 'Yaoundé': [11.51, 3.87, 'CM', 1],
  Johannesburg: [28.03, -26.17, 'ZA', 0], 'Cape Town': [18.43, -33.92, 'ZA', 0], 'Dar es Salaam': [39.27, -6.8, 'TZ', 0], Timbuktu: [-3.02, 16.77, 'ML', 0],
  // South Asia
  'New Delhi': [77.2, 28.6, 'IN', 1], Mumbai: [72.86, 19.02, 'IN', 0], Kolkata: [88.32, 22.5, 'IN', 0], Chennai: [80.28, 13.09, 'IN', 0],
  Bengaluru: [77.56, 12.97, 'IN', 0], Karachi: [66.99, 24.87, 'PK', 0], Lahore: [74.35, 31.56, 'PK', 0], Islamabad: [73.16, 33.7, 'PK', 1],
  Dhaka: [90.41, 23.73, 'BD', 1], Kathmandu: [85.31, 27.72, 'NP', 1], Colombo: [79.86, 6.93, 'LK', 0], Kabul: [69.18, 34.52, 'AF', 1],
  Thimphu: [89.64, 27.47, 'BT', 1],
  // East Asia
  Beijing: [116.39, 39.93, 'CN', 1], Shanghai: [121.43, 31.22, 'CN', 0], Guangzhou: [113.32, 23.15, 'CN', 0], Chongqing: [106.59, 29.57, 'CN', 0],
  'Hong Kong': [114.18, 22.31, 'HK', 0], Tokyo: [139.75, 35.69, 'JP', 1], Osaka: [135.46, 34.75, 'JP', 0], Seoul: [127, 37.57, 'KR', 1],
  Pyongyang: [125.75, 39.02, 'KP', 1], Ulaanbaatar: [106.91, 47.92, 'MN', 1], Sapporo: [141.34, 43.08, 'JP', 0], 'Xi\'an': [108.89, 34.28, 'CN', 0],
  Urumqi: [87.57, 43.81, 'CN', 0], Harbin: [126.65, 45.75, 'CN', 0],
  // Southeast Asia and Oceania
  Bangkok: [100.51, 13.75, 'TH', 1], Hanoi: [105.85, 21.04, 'VN', 1], 'Ho Chi Minh City': [106.69, 10.78, 'VN', 0], Manila: [120.98, 14.61, 'PH', 1],
  Jakarta: [106.83, -6.17, 'ID', 0], Singapore: [103.85, 1.29, 'SG', 1], Yangon: [96.16, 16.79, 'MM', 0], 'Phnom Penh': [104.91, 11.55, 'KH', 1],
  Sydney: [151.18, -33.92, 'AU', 0], Melbourne: [144.97, -37.82, 'AU', 0], Canberra: [149.13, -35.28, 'AU', 1], Perth: [115.84, -31.95, 'AU', 0],
  Auckland: [174.76, -36.85, 'NZ', 0], Wellington: [174.78, -41.3, 'NZ', 1], 'Port Moresby': [147.19, -9.46, 'PG', 1],
  // Latin America and the Caribbean
  'Mexico City': [-99.13, 19.44, 'MX', 1], 'Guatemala City': [-90.53, 14.62, 'GT', 1], Havana: [-82.37, 23.13, 'CU', 1], 'Panama City': [-79.53, 8.97, 'PA', 1],
  'Bogotá': [-74.09, 4.6, 'CO', 1], Caracas: [-66.92, 10.5, 'VE', 1], Quito: [-78.5, -0.21, 'EC', 1], Lima: [-77.05, -12.05, 'PE', 1],
  Santiago: [-70.67, -33.45, 'CL', 1], 'Buenos Aires': [-58.4, -34.6, 'AR', 1], Montevideo: [-56.17, -34.86, 'UY', 1], 'Asunción': [-57.64, -25.29, 'PY', 1],
  'Brasília': [-47.92, -15.78, 'BR', 1], 'Santo Domingo': [-69.9, 18.47, 'DO', 1], 'São Paulo': [-46.63, -23.56, 'BR', 0], 'Rio de Janeiro': [-43.23, -22.92, 'BR', 0],
  Manaus: [-60, -3.1, 'BR', 0],
  // The United States and Canada
  'New York': [-73.98, 40.75, 'US', 0], 'Los Angeles': [-118.18, 33.99, 'US', 0], Chicago: [-87.75, 41.83, 'US', 0], Toronto: [-79.42, 43.7, 'CA', 0],
  'Washington, D.C.': [-77.01, 38.9, 'US', 1], Ottawa: [-75.7, 45.42, 'CA', 1], Vancouver: [-123.12, 49.28, 'CA', 0], 'Montréal': [-73.59, 45.5, 'CA', 0],
  Houston: [-95.34, 29.82, 'US', 0], Miami: [-80.23, 25.79, 'US', 0], 'San Francisco': [-122.42, 37.77, 'US', 0], Seattle: [-122.34, 47.57, 'US', 0],
  'New Orleans': [-90.04, 30, 'US', 0], Denver: [-104.99, 39.74, 'US', 0], Calgary: [-114.08, 51.08, 'CA', 0], Nashville: [-86.78, 36.17, 'US', 0],
  Detroit: [-83.08, 42.33, 'US', 0], Anchorage: [-149.9, 61.22, 'US', 0],
};
export const cityAt = (name) => { const c = CITIES[name]; if (!c) throw new Error(`helpers: no city "${name}"`); return [c[0], c[1]]; };
export const cityCountry = (name) => CITIES[name][2];
/** A marker for a city of the table. */
export const cityMarker = (name, extra = {}) => ({ at: cityAt(name), label: name, ...extra });

/** Capitals that are not the country's largest city: the bigger city, and why the capital is where it is. */
export const NOT_THE_BIGGEST = {
  TR: ['Istanbul', 'Istanbul is far larger, but in 1923 the new Turkish republic chose Ankara, in the middle of Anatolia, as its capital.'],
  MA: ['Casablanca', 'Casablanca is Morocco\'s largest city and main port; the king and the government sit in Rabat.'],
  AE: ['Dubai', 'Dubai is the largest and best-known city of the Emirates, but Abu Dhabi is the capital.'],
  NG: ['Lagos', 'Lagos is far larger, but in 1991 Nigeria moved its capital to Abuja, a new city built in the centre of the country.'],
  PK: ['Karachi', 'Karachi is Pakistan\'s largest city and was its first capital; Islamabad was built as a new capital in the 1960s.'],
  AU: ['Sydney', 'Sydney and Melbourne both wanted to be the capital, so Canberra was built between them as a compromise.'],
  NZ: ['Auckland', 'Auckland is the largest city, but Wellington, at the centre of the country, has been the capital since 1865.'],
  BR: ['São Paulo', 'São Paulo and Rio de Janeiro are far larger; Brasília was built in the interior and became the capital in 1960.'],
  US: ['New York', 'New York is the largest city, but the capital is Washington, D.C., a district created for the purpose that belongs to no state.'],
  CA: ['Toronto', 'Toronto is Canada\'s largest city; Ottawa was chosen in 1857, partly because it sits on the line between English-speaking and French-speaking Canada.'],
  VN: ['Ho Chi Minh City', 'Ho Chi Minh City, in the south, is larger, but the capital is Hanoi, in the north.'],
  CN: ['Shanghai', 'Shanghai is China\'s largest city; Beijing has been the capital for most of the last 600 years.'],
};

/** Markers far enough apart to tell (and tap) on a small screen: the target first, then others from the pool. */
function spread(rng, target, pool, n, minKm, at, must = []) {
  const chosen = [target, ...must];
  for (const item of rng.shuffle(pool)) {
    if (chosen.length >= n) break;
    if (chosen.includes(item)) continue;
    if (chosen.every((other) => distanceKm(at(item), at(other)) >= minKm)) chosen.push(item);
  }
  // letters A, B, C … run from west to east, so that their order says nothing about the answer
  return chosen.sort((a, b) => at(a)[0] - at(b)[0]);
}

/**
 * "Which marker is the capital of Turkey?": unlabelled city markers on a regional map.
 * `capitals` are city names of CITIES that are capitals; the largest city of the same country is
 * added as a marker when it is far enough away to be told apart.
 */
export function tapCapital(rng, capitals, { view, minKm, n = 5, words }) {
  const target = rng.pick(capitals);
  const country = cityCountry(target);
  const trap = NOT_THE_BIGGEST[country];
  // the big city that people take for the capital goes on the map too, when it is far enough away to be told apart
  const must = trap && distanceKm(cityAt(trap[0]), cityAt(target)) >= 0.75 * minKm ? [trap[0]] : [];
  const others = capitals.filter((c) => c !== target);
  const shown = spread(rng, target, others, n, minKm, cityAt, must);
  const id = slug(target);
  return {
    text: `Which marker is the capital of **${theName(country)}**?`,
    widget: {
      type: 'world-map', view: VIEW[view], mode: 'pickMarker', markerLabels: 'after', answer: id,
      markers: shown.map((name) => ({ id: slug(name), at: cityAt(name), label: name })),
      alt: `A map of ${words || VIEW_WORDS[view]} with ${shown.length} unnamed city markers`,
    },
    check: (s) => {
      if (s.picked === id) return true;
      const name = shown.find((c) => slug(c) === s.picked);
      if (!name) return 'Tap one of the markers.';
      if (trap && name === trap[0]) return `That is ${name}: a bigger and better-known city, but not the capital of ${theName(country)}.`;
      return `That is ${name}, in ${theName(cityCountry(name))}. Look further ${compass(cityAt(name), cityAt(target))}.`;
    },
    solution: { picked: id },
    hints: [(FIND_INDEX[country] || {}).where ? `First find the country. ${FIND_INDEX[country].where}` : `First find ${theName(country)} itself.`],
    explain: `The capital of ${theName(country)} is **${target}**.${trap ? ` ${trap[1]}` : ''}`,
  };
}

/** "Which marker is Mumbai?": the same for cities that are named in the question, each with a clue. */
export function tapCity(rng, pool, { view, minKm, n = 5, words }) {
  const target = rng.pick(pool);
  const others = pool.filter((c) => c !== target);
  const at = (c) => cityAt(c.name);
  const shown = spread(rng, target, others, n, minKm, at);
  const id = slug(target.name);
  return {
    text: `Which marker is **${target.name}**, ${target.clue}?`,
    widget: {
      type: 'world-map', view: VIEW[view], mode: 'pickMarker', markerLabels: 'after', answer: id,
      markers: shown.map((c) => ({ id: slug(c.name), at: at(c), label: c.name })),
      alt: `A map of ${words || VIEW_WORDS[view]} with ${shown.length} unnamed city markers`,
    },
    check: (s) => {
      if (s.picked === id) return true;
      const c = shown.find((x) => slug(x.name) === s.picked);
      if (!c) return 'Tap one of the markers.';
      return `That is ${c.name}, ${c.clue}. ${target.name} is further ${compass(at(c), at(target))}.`;
    },
    solution: { picked: id },
    hints: [target.hint],
    explain: `**${target.name}** is ${target.clue}. ${target.fact}`,
  };
}

/* ------------------------------------------------------------------ physical anchors */

// notWith: features that must never be on the map when this one is asked for (or the other way round),
// because a marker on one could fairly be said to be on the other too.
const F = (name, at, clue, kind = 'land', notWith = []) => ({ name, at, clue, kind, notWith });
const overlap = (a, b) => a.notWith.includes(b.name) || b.notWith.includes(a.name);

export const FEATURES = {
  europe: [
    F('the Iberian Peninsula', [-4, 40], 'the square block in the south-west that holds Spain and Portugal'),
    F('the Italian Peninsula', [13.2, 42.4], 'the boot that kicks into the middle of the Mediterranean'),
    F('the Balkan Peninsula', [22, 42.2], 'the broad, mountainous south-east, ending in Greece'),
    F('the Scandinavian Peninsula', [15, 63.5], 'the long arm of the far north that holds Norway and Sweden'),
    F('the Alps', [10, 46.6], 'the arc of high mountains across the top of Italy'),
    F('the British Isles', [-2.4, 54], 'the group of islands off the north-west coast'),
    F('the Baltic Sea', [19.5, 57.3], 'the almost closed sea of the north, between Sweden and the Baltic states', 'water'),
    F('the Black Sea', [34, 43.3], 'the sea in the south-east into which the Danube flows', 'water'),
    F('the North Sea', [3, 56.3], 'the sea between Great Britain and Scandinavia', 'water'),
  ],
  mena: [
    F('the Suez Canal', [32.4, 30.5], 'the cut between the Mediterranean and the Red Sea, opened in 1869', 'water'),
    F('the Strait of Hormuz', [56.4, 26.6], 'the narrow exit of the Persian Gulf, between Iran and Oman', 'water'),
    F('the Bosphorus', [29.05, 41.1], 'the channel through Istanbul on the way from the Black Sea to the Mediterranean', 'water'),
    F('the Strait of Gibraltar', [-5.6, 35.95], 'the gap between Spain and Morocco where the Mediterranean meets the Atlantic', 'water'),
    F('the Bab-el-Mandeb', [43.3, 12.6], 'the southern gate of the Red Sea, between Yemen and the Horn of Africa', 'water'),
  ],
  africa: [
    F('the Sahel', [9, 15], 'the dry belt of grass and thorn scrub along the southern edge of the Sahara'),
    F('the Congo rainforest', [22, 0], 'the great forest on the equator, second in size only to the Amazon'),
    F('the Kalahari', [22, -23.5], 'the dry sandy basin of the south, mostly in Botswana'),
    F('the Ethiopian Highlands', [39, 10.5], 'the high plateau of the Horn of Africa, source of the Blue Nile'),
    F('Lake Victoria', [33, -1], 'Africa\'s largest lake, shared by Uganda, Kenya and Tanzania', 'water'),
    F('Kilimanjaro', [37.35, -3.07], 'Africa\'s highest mountain, a snow-capped volcano near the equator'),
    F('Victoria Falls', [25.86, -17.92], 'the great waterfall on the Zambezi, between Zambia and Zimbabwe', 'water'),
    F('Madagascar', [47, -19.5], 'the fourth-largest island in the world, off the south-east coast'),
    F('the Namib', [14.8, -23.2], 'the desert that runs along the Atlantic coast of the south-west'),
    F('the Niger Delta', [6, 4.8], 'the swampy mouth of West Africa\'s great river, on the Gulf of Guinea', 'water'),
    F('the Cape of Good Hope', [18.47, -34.36], 'the headland near the continent\'s southern tip that ships round on the way to Asia'),
  ],
  southAsia: [
    F('the Himalaya', [84, 28.6], 'the highest mountain range on Earth, along the northern edge'),
    F('the Deccan Plateau', [77, 17.5], 'the raised triangle that fills the south of the peninsula'),
    F('the Thar Desert', [71.3, 27], 'the desert on the border between India and Pakistan'),
    F('the Ganges Delta', [89.6, 22.6], 'the largest delta in the world, where the Ganges and Brahmaputra meet the sea', 'water', ['the Ganges Plain']),
    F('the Indus Delta', [67.7, 24.2], 'where Pakistan\'s great river reaches the Arabian Sea', 'water'),
    F('the Hindu Kush', [70.5, 35.6], 'the range that crosses Afghanistan, west of the Himalaya'),
    F('Sri Lanka', [80.7, 7.8], 'the island off the southern tip of India'),
    F('the Ganges Plain', [81, 26], 'the flat, fertile, crowded lowland below the mountains'),
    F('the Bay of Bengal', [88, 14.5], 'the sea east of India, where the summer monsoon gathers its rain', 'water'),
  ],
  eastAsia: [
    F('the Tibetan Plateau', [88, 33], 'the "roof of the world", averaging more than 4,000 metres above the sea'),
    F('the Gobi Desert', [104, 43], 'the cold desert shared by Mongolia and northern China'),
    F('the North China Plain', [116, 36], 'the flat, densely farmed lowland built by the Yellow River'),
    F('the Korean Peninsula', [127.5, 37.6], 'the peninsula that points south from the mainland towards Japan'),
    F('Honshu', [138.5, 36.2], 'the largest of Japan\'s islands, home of Tokyo and Osaka'),
    F('Hokkaido', [142.8, 43.4], 'the northernmost of Japan\'s four main islands'),
    F('the Taklamakan Desert', [82, 39], 'the sand desert of the far west, ringed by Silk Road oases'),
    F('the Sichuan Basin', [105.5, 30.3], 'the fertile bowl in the middle of China, walled in by mountains'),
    F('the Yangtze Delta', [121.2, 31.3], 'the mouth of China\'s longest river, where Shanghai stands', 'water'),
  ],
  seaOceania: [
    F('Sumatra', [101.5, 0], 'the long island that forms the western end of Indonesia'),
    F('Borneo', [114, 1], 'the huge island shared by Indonesia, Malaysia and Brunei'),
    F('Java', [110.5, -7.4], 'the narrow island where more than half of all Indonesians live'),
    F('New Guinea', [141, -5.5], 'the second-largest island in the world, north of Australia'),
    F('the Mekong Delta', [105.8, 10], 'the mouth of Southeast Asia\'s longest river, in southern Vietnam', 'water'),
    F('Luzon', [121, 16.5], 'the largest island of the Philippines'),
    F('the Great Barrier Reef', [146.5, -17.5], 'the largest coral reef system in the world, off north-east Australia', 'water'),
    F('Tasmania', [146.5, -42], 'the island state south of the Australian mainland'),
    F('Uluru', [131.04, -25.34], 'the great sandstone rock near the centre of Australia'),
    F('the South Island', [170.5, -44], 'the larger and more mountainous of New Zealand\'s two main islands'),
  ],
  latinAmerica: [
    F('the Andes', [-76, -10], 'the longest mountain range on land, along the whole Pacific side', 'land', ['Lake Titicaca', 'the Atacama Desert']),
    F('the Amazon Basin', [-62, -4], 'the largest rainforest and river system on Earth'),
    F('Patagonia', [-69, -45], 'the cold, windy, thinly peopled far south', 'land', ['Cape Horn']),
    F('the Atacama Desert', [-69.3, -24], 'the driest desert in the world outside the poles, in northern Chile'),
    F('the Pampas', [-62, -35], 'the fertile grasslands around Buenos Aires'),
    F('the Yucatán Peninsula', [-89, 19.5], 'the flat limestone thumb of Mexico, heartland of the Maya'),
    F('the Isthmus of Panama', [-80, 9], 'the narrow neck of land that joins the two Americas'),
    F('the Caribbean Sea', [-75, 15], 'the warm sea ringed by islands, north of South America', 'water'),
    F('Lake Titicaca', [-69.4, -15.8], 'the high lake on the border of Peru and Bolivia, 3,800 metres up', 'water'),
    F('Cape Horn', [-67.3, -55.9], 'the stormy southern tip of the Americas'),
    F('the Brazilian Highlands', [-45, -17], 'the plateau that fills eastern Brazil'),
  ],
  northAmerica: [
    F('the Rocky Mountains', [-110.5, 45], 'the great range of the west, from Canada down to New Mexico'),
    F('the Great Plains', [-100, 40.5], 'the grasslands in the middle of the continent, now wheat and cattle country'),
    F('the Great Lakes', [-85, 45], 'five linked lakes on the border, holding about a fifth of the world\'s fresh surface water', 'water'),
    F('the Mississippi Delta', [-89.5, 29.3], 'where the continent\'s greatest river reaches the Gulf of Mexico', 'water'),
    F('Hudson Bay', [-85, 60], 'the vast inland sea in the middle of the Canadian Shield', 'water'),
    F('the Appalachians', [-80.5, 37.8], 'the old, worn-down mountains of the east'),
    F('Alaska', [-152, 64], 'the largest US state, in the far north-west'),
    F('Florida', [-81.5, 27.7], 'the low peninsula pointing towards Cuba'),
    F('the Grand Canyon', [-112.1, 36.1], 'the gorge cut by the Colorado River through the dry south-west'),
    F('the Arctic Archipelago', [-95, 72.5], 'the maze of islands between the Canadian mainland and the North Pole'),
    F('Greenland', [-42, 72], 'the largest island in the world, under a sheet of ice'),
  ],
};

/** "Which marker is on the Alps?": physical features as unlabelled markers. */
export function tapFeature(rng, features, { view, minKm, n = 5, words, targets }) {
  const target = rng.pick(targets ? features.filter((f) => targets.includes(f.name)) : features);
  const at = (f) => f.at;
  const shown = spread(rng, target, features.filter((f) => f !== target && !overlap(f, target)), n, minKm, at);
  const id = slug(target.name);
  const cap = (text) => text[0].toUpperCase() + text.slice(1);
  return {
    text: `Which marker is on **${target.name}**?`,
    widget: {
      type: 'world-map', view: VIEW[view], mode: 'pickMarker', markerLabels: 'after', answer: id,
      markers: shown.map((f) => ({ id: slug(f.name), at: f.at, label: cap(f.name.replace(/^the /, '')) })),
      alt: `A map of ${words || VIEW_WORDS[view]} with ${shown.length} unnamed markers on seas, mountains and other features`,
    },
    check: (s) => {
      if (s.picked === id) return true;
      const f = shown.find((x) => slug(x.name) === s.picked);
      if (!f) return 'Tap one of the markers.';
      return `That is ${f.name}: ${f.clue}. Look further ${compass(f.at, target.at)}.`;
    },
    solution: { picked: id },
    hints: [`You are looking for ${target.clue}.`],
    explain: `${cap(target.name)}: ${target.clue}.`,
  };
}

/* ------------------------------------------------------------------ placing a pin */

/**
 * "Place the pin on Chicago." Feedback says how far off the pin is and which way to move it.
 * pool: [{ name, clue, fact }] with names from CITIES.
 */
export function placeCity(rng, pool, { view, tolKm, words }) {
  const target = rng.pick(pool);
  const at = cityAt(target.name);
  return {
    text: `**Place the pin on ${target.name}**, ${target.clue}. Anywhere within ${tolKm} km counts.`,
    widget: {
      type: 'world-map', view: VIEW[view], mode: 'place', pin: { label: target.name, color: 'red' }, target: at,
      alt: `A map of ${words || VIEW_WORDS[view]} without names, with a pin to place`,
    },
    check: (s) => {
      if (!s.placed) return 'Move the pin first: drag it, or tap the map.';
      if (s.km <= tolKm) return true;
      const move = compass(s.pin, at);
      const here = s.country ? `in ${theName(s.country)}` : 'out at sea';
      const stop = /\.$/.test(target.name) ? '' : '.';      // "Washington, D.C." already ends with one
      return `Your pin is ${here}, about ${Math.round(s.km / 10) * 10} km from ${target.name}${stop} Move it ${move}.`;
    },
    solution: { pin: at },
    hints: [target.hint],
    explain: `**${target.name}** is ${target.clue}. ${target.fact}`,
  };
}

/* ------------------------------------------------------------------ landmarks */
// year: when it was built or finished (negative = BCE); for natural wonders, null.

export const LANDMARKS = {
  parthenon: {
    name: 'the Parthenon', place: 'Athens', country: 'GR', at: [23.727, 37.971], year: -432, when: 'finished in 432 BCE',
    alt: 'A ruined temple of pale marble on a rocky hilltop: rows of tall fluted columns carry what is left of a roof, with no arches and no dome',
    fact: 'It was built for the goddess Athena on the Acropolis, the rock above the city.',
  },
  'eiffel-tower': {
    name: 'the Eiffel Tower', place: 'Paris', country: 'FR', at: [2.2945, 48.8584], year: 1889, when: 'opened in 1889', focus: [0.5, 0.16],
    alt: 'A tall tower of open iron latticework, wide at the base and tapering to a point, standing over a city at sunrise',
    fact: 'It was put up for the World\'s Fair of 1889 and was the tallest structure on Earth for the next forty years.',
  },
  'st-basils': {
    name: 'St Basil\'s Cathedral', place: 'Moscow', country: 'RU', at: [37.623, 55.7525], year: 1561, when: 'finished in 1561', focus: [0.5, 0.42],
    alt: 'A church of red brick crowned by a cluster of onion-shaped domes, each one patterned in different bright colours: stripes, swirls and diamonds',
    fact: 'Ivan IV, the first tsar, had it built on Red Square to mark his conquest of Kazan.',
  },
  'giza-pyramids': {
    name: 'the pyramids of Giza', plural: true, place: 'Giza, beside Cairo', country: 'EG', at: [31.134, 29.979], year: -2560, when: 'built about 2600 to 2500 BCE',
    alt: 'Three huge stone pyramids and several small ones in a row on a bare desert plateau, under a clear sky',
    fact: 'They are royal tombs, raised about 4,500 years ago on the desert edge above the Nile.',
  },
  'petra-treasury': {
    name: 'the Treasury at Petra', place: 'Petra', country: 'JO', at: [35.4513, 30.3222], year: 50, when: 'carved about 2,000 years ago', fit: 'contain',
    alt: 'The front of a building, with columns, a triangular gable and a round turret, carved straight into a cliff of rose-red sandstone',
    fact: 'The Nabataeans, Arab traders grown rich on the caravan routes, cut it out of the living rock, probably as a royal tomb.',
  },
  'hagia-sophia': {
    name: 'Hagia Sophia', place: 'Istanbul', country: 'TR', at: [28.98, 41.0086], year: 537, when: 'finished in 537 CE',
    alt: 'A massive building of faded red and grey stone under a wide, shallow central dome, with a slender pointed tower at each corner',
    fact: 'It was the greatest church of the eastern Roman empire for nine centuries, then a mosque, then a museum, and since 2020 a mosque again.',
  },
  'djenne-mosque': {
    name: 'the Great Mosque of Djenné', place: 'Djenné', country: 'ML', at: [-4.555, 13.905], year: 1907, when: 'rebuilt in 1907 on a site used since the thirteenth century',
    alt: 'A large building of smooth brown mud brick with three tall towers; bundles of wooden beams stick out of the walls in rows',
    fact: 'It is the largest mud-brick building in the world, and the whole town replasters it by hand every year.',
  },
  kilimanjaro: {
    name: 'Kilimanjaro', place: 'northern Tanzania', country: 'TZ', at: [37.355, -3.067], year: null, when: '',
    alt: 'A broad, flat-topped mountain with snow on its summit, rising alone above a plain of dry grass and scattered trees',
    fact: 'At 5,895 metres it is the highest mountain in Africa, a volcano standing alone only three degrees south of the equator.',
  },
  'victoria-falls': {
    name: 'Victoria Falls', place: 'the Zambezi River', country: 'ZM', also: 'ZW', at: [25.857, -17.924], year: null, when: '', focus: [0.5, 0.3],
    alt: 'Seen from the air: a wide blue river dotted with islands pours over the edge of a long, straight cliff into a narrow gorge, throwing up a wall of white spray',
    fact: 'Its older name is Mosi-oa-Tunya, "the smoke that thunders". The falls are more than 1.7 km wide.',
  },
  'taj-mahal': {
    name: 'the Taj Mahal', place: 'Agra', country: 'IN', at: [78.042, 27.175], year: 1653, when: 'built from 1632 to 1653',
    alt: 'A white marble building with a large onion-shaped dome and four slender towers, at the end of a long pool lined with trees',
    fact: 'The Mughal emperor Shah Jahan built it as a tomb for his wife Mumtaz Mahal.',
  },
  'golden-temple': {
    name: 'the Golden Temple', place: 'Amritsar', country: 'IN', at: [74.8765, 31.62], year: 1604, when: 'finished in 1604, and gilded in the early nineteenth century',
    alt: 'A square building covered in gold, standing in the middle of a large pool and joined to the shore by a causeway',
    fact: 'It is the holiest shrine of the Sikhs. Its kitchen gives a free meal to everyone who comes, whatever their religion.',
  },
  sigiriya: {
    name: 'Sigiriya', place: 'central Sri Lanka', country: 'LK', at: [80.76, 7.957], year: 480, when: 'fortified about 480 CE', focus: [0.28, 0.5],
    alt: 'A huge flat-topped rock with sheer sides rising straight out of thick green forest, with hazy hills in the distance',
    fact: 'A king built his palace on top of this 180-metre rock in the fifth century, with gardens and pools at its foot.',
  },
  'great-wall': {
    name: 'the Great Wall of China', place: 'the hills north of Beijing', country: 'CN', at: [117.24, 40.68], year: 1570, when: 'this stretch built in the sixteenth century',
    alt: 'A stone wall with a walkway on top, running along the crest of steep green hills into the distance, with square towers at intervals',
    fact: 'Walls were built along this frontier for 2,000 years; most of what stands today dates from the Ming dynasty (1368 to 1644).',
  },
  gyeongbokgung: {
    name: 'Gyeongbokgung Palace', place: 'Seoul', country: 'KR', at: [126.977, 37.5796], year: 1395, when: 'first built in 1395',
    alt: 'A wide wooden hall with two tiers of sweeping tiled roofs, painted red and green under the eaves, on a stone terrace at the end of a paved courtyard',
    fact: 'It was the chief palace of the Joseon kings, who ruled Korea for five centuries. Burned in 1592, it was rebuilt in the 1860s.',
  },
  'mount-fuji': {
    name: 'Mount Fuji', place: 'the island of Honshu', country: 'JP', at: [138.727, 35.361], year: null, when: '',
    alt: 'A perfectly cone-shaped mountain with a cap of snow, seen across a lake, with cherry trees in blossom in front',
    fact: 'At 3,776 metres it is Japan\'s highest mountain: a volcano that last erupted in 1707.',
  },
  borobudur: {
    name: 'Borobudur', place: 'the island of Java', country: 'ID', at: [110.204, -7.608], year: 825, when: 'built about 800 CE',
    alt: 'A vast, low, stepped pyramid of dark grey stone, its terraces crowded with small spires, with one large bell-shaped dome at the very top',
    fact: 'It is the largest Buddhist monument in the world, built on Java about 1,200 years ago.',
  },
  'angkor-wat': {
    name: 'Angkor Wat', place: 'near Siem Reap', country: 'KH', at: [103.867, 13.4125], year: 1150, when: 'built in the first half of the twelfth century',
    alt: 'A wide temple of dark stone with five towers shaped like lotus buds, seen across a pond that mirrors it, with palm trees in front',
    fact: 'King Suryavarman II built it as a temple to the Hindu god Vishnu; it later became a Buddhist temple, and still is.',
  },
  'sydney-opera-house': {
    name: 'the Sydney Opera House', place: 'Sydney', country: 'AU', at: [151.2153, -33.8568], year: 1973, when: 'opened in 1973',
    alt: 'A building on a harbour at night whose roof is a row of tall white shells, like sails or the segments of an orange, with a city skyline behind',
    fact: 'Designed by the Danish architect Jørn Utzon, it took fourteen years to build.',
  },
  'machu-picchu': {
    name: 'Machu Picchu', place: 'the Andes above the Urubamba valley', country: 'PE', at: [-72.545, -13.163], year: 1450, when: 'built about 1450',
    alt: 'Stone walls, roofless houses with pointed gables and grassy terraces on a ridge, with a steep green peak and misty mountains behind',
    fact: 'The Incas built it about 1450, some 2,400 metres up, without mortar, iron tools or wheeled carts.',
  },
  'chichen-itza': {
    name: 'the pyramid of Chichén Itzá', place: 'the Yucatán Peninsula', country: 'MX', at: [-88.5686, 20.683], year: 1000, when: 'built about 1,000 years ago',
    alt: 'A grey stone pyramid of nine square steps with a staircase up the middle of each side and a small temple on top, standing on a lawn',
    fact: 'The Maya built it about 1,000 years ago. Each of its four stairways has 91 steps; with the platform on top that makes 365, one for each day of the year.',
  },
  'christ-the-redeemer': {
    name: 'Christ the Redeemer', place: 'Rio de Janeiro', country: 'BR', at: [-43.2105, -22.9519], year: 1931, when: 'finished in 1931', focus: [0.5, 0.12],
    alt: 'A giant pale statue of a robed figure with arms stretched wide, seen from below on a dark pedestal against a blue sky',
    fact: 'The statue, 30 metres tall, has stood on Corcovado mountain above Rio since 1931.',
  },
  'statue-of-liberty': {
    name: 'the Statue of Liberty', place: 'New York Harbor', country: 'US', at: [-74.0445, 40.6892], year: 1886, when: 'unveiled in 1886', focus: [0.5, 0.18],
    alt: 'A green statue of a robed woman wearing a crown of spikes, holding a torch high in one hand and a tablet in the other, on a stone pedestal',
    fact: 'It was a gift from the people of France, unveiled in 1886; for millions of immigrants arriving by ship it was the first sight of America.',
  },
  'grand-canyon': {
    name: 'the Grand Canyon', place: 'Arizona', country: 'US', at: [-112.11, 36.1], year: null, when: '', focus: [0.5, 0.62],
    alt: 'An immense gorge whose layered walls of red and brown rock step down, terrace after terrace, to a muddy river far below',
    fact: 'The Colorado River has cut it about 1.6 km deep; the rocks at the bottom are more than 1.7 billion years old.',
  },
  'toronto-skyline': {
    name: 'the CN Tower', place: 'Toronto', country: 'CA', at: [-79.3871, 43.6426], year: 1976, when: 'opened in 1976', focus: [0.5, 0.45],
    alt: 'A very tall, thin concrete tower with a round pod two-thirds of the way up and a long spire above it, rising far above the glass towers of a city on the water',
    fact: 'At 553 metres it was the tallest free-standing structure in the world from 1976 until 2007.',
  },
};

const NAME_CAP = (id) => { const n = LANDMARKS[id].name; return n[0].toUpperCase() + n.slice(1); };
/** The photograph of a landmark as an answer option: described, never named. */
export function landmarkOption(id) {
  const lm = LANDMARKS[id];
  if (!MEDIA[id]) throw new Error(`helpers: no picture "${id}" in the media index`);
  return photo(MEDIA[id], { alt: lm.alt, ...(lm.focus ? { focus: lm.focus } : {}), ...(lm.fit ? { aspect: '4:3', fit: lm.fit } : {}) });
}
/** The photograph as a figure, with its name in the caption (for steps where the name is not the question). */
export function landmarkFigure(id, extra = {}) {
  const lm = LANDMARKS[id];
  return photo(MEDIA[id], { alt: lm.alt, caption: `${NAME_CAP(id)}, ${lm.place}${lm.when ? `, ${lm.when}` : ''}`, ...extra });
}
const whereText = (id) => {
  const lm = LANDMARKS[id];
  return lm.also ? `on the border of ${theName(lm.country)} and ${theName(lm.also)}` : `in ${theName(lm.country)}`;
};

/**
 * "Which of these is the Taj Mahal?": four photographs as options.
 * targets: ids that may be asked for; pool: every id that may appear (targets included).
 */
export function whichPhoto(rng, targets, pool) {
  const target = rng.pick(targets);
  const others = rng.sample(pool.filter((id) => id !== target), 3);
  const options = rng.shuffle([target, ...others]).map((id) => ({
    figure: landmarkOption(id),
    correct: id === target,
    why: id === target ? `${NAME_CAP(id)}, ${whereText(id)}.` : `${LANDMARKS[id].plural ? 'These are' : 'This is'} ${LANDMARKS[id].name}, ${whereText(id)}.`,
  }));
  const lm = LANDMARKS[target];
  return {
    text: `Which of these ${lm.plural ? 'shows' : 'is'} **${lm.name}**?`,
    options,
    shuffle: false,
    explain: `**${NAME_CAP(target)}** ${lm.plural ? 'are' : 'is'} ${whereText(target)} (${lm.place}). ${lm.fact}`,
  };
}

/* ------------------------------------------------------------------ dates */
// The dated events that the order steps and the timeline are built from.
// year: negative = BCE. Labels are what the learner sees.

export const DATES = {
  // Europe
  parthenon: [-432, 'The Parthenon is finished in Athens'],
  colosseum: [80, 'The Colosseum opens in Rome'],
  'notre-dame': [1163, 'Work begins on Notre-Dame in Paris'],
  'st-basils': [1561, 'St Basil\'s Cathedral is finished in Moscow'],
  'eiffel-tower': [1889, 'The Eiffel Tower opens in Paris'],
  eu: [1993, 'The European Union is founded'],
  // North Africa and the Middle East
  'giza-pyramids': [-2560, 'The Great Pyramid is built at Giza'],
  'petra-treasury': [50, 'The Treasury is carved at Petra'],
  'hagia-sophia': [537, 'Hagia Sophia is finished in Constantinople'],
  hijra: [622, 'Muhammad moves from Mecca to Medina: year 1 of the Islamic calendar'],
  suez: [1869, 'The Suez Canal opens'],
  'burj-khalifa': [2010, 'The Burj Khalifa opens in Dubai'],
  // Africa south of the Sahara
  'great-zimbabwe': [1300, 'Great Zimbabwe is at its height'],
  adwa: [1896, 'Ethiopia defeats an Italian invasion at Adwa'],
  ghana: [1957, 'Ghana becomes independent'],
  'year-of-africa': [1960, 'Seventeen African countries become independent in one year'],
  mandela: [1994, 'Nelson Mandela is elected president of South Africa'],
  'south-sudan': [2011, 'South Sudan becomes the newest country in Africa'],
  // South Asia
  indus: [-2500, 'The Indus cities are at their height'],
  buddha: [-450, 'The Buddha teaches in the Ganges plain'],
  sigiriya: [480, 'A king builds his palace on the rock of Sigiriya'],
  'taj-mahal': [1653, 'The Taj Mahal is completed'],
  partition: [1947, 'India and Pakistan become independent'],
  bangladesh: [1971, 'Bangladesh becomes independent'],
  // East Asia
  qin: [-221, 'The First Emperor unites China'],
  kyoto: [794, 'Kyoto becomes the capital of Japan'],
  hangul: [1443, 'King Sejong\'s scholars create the Korean alphabet'],
  meiji: [1868, 'Japan begins its rapid modernisation under the Meiji emperor'],
  'korea-divided': [1945, 'Korea is divided'],
  shinkansen: [1964, 'The first high-speed "bullet train" runs in Japan'],
  // Southeast Asia and Oceania
  'first-australians': [-50000, 'People first reach Australia'],
  borobudur: [825, 'Borobudur is built on Java'],
  'angkor-wat': [1150, 'Angkor Wat is built in Cambodia'],
  aotearoa: [1300, 'Polynesian voyagers settle Aotearoa New Zealand'],
  'singapore-founded': [1819, 'The British found a trading port at Singapore'],
  'sydney-opera-house': [1973, 'The Sydney Opera House opens'],
  // Latin America
  'chichen-itza': [1000, 'The Maya build the great pyramid of Chichén Itzá'],
  'machu-picchu': [1450, 'The Incas build Machu Picchu'],
  columbus: [1492, 'Columbus crosses the Atlantic'],
  'latin-independence': [1821, 'Mexico and Peru break away from Spain'],
  'panama-canal': [1914, 'The Panama Canal opens'],
  'christ-the-redeemer': [1931, 'Christ the Redeemer is finished in Rio de Janeiro'],
  // North America
  cahokia: [1100, 'Cahokia, on the Mississippi, is the largest city north of Mexico'],
  quebec: [1608, 'The French found Québec'],
  'us-independence': [1776, 'The United States declares independence'],
  'canada-confederation': [1867, 'Canada becomes a self-governing confederation'],
  'statue-of-liberty': [1886, 'The Statue of Liberty is unveiled'],
  nunavut: [1999, 'Nunavut becomes a territory of Canada'],
};
export const yearOf = (id) => { if (!DATES[id]) throw new Error(`helpers: no date "${id}"`); return DATES[id][0]; };
export const eventLabel = (id) => { if (!DATES[id]) throw new Error(`helpers: no date "${id}"`); return DATES[id][1]; };
/** The labels of some events, sorted from earliest to latest: the `items` of an order step. */
export const inOrder = (ids) => ids.slice().sort((a, b) => yearOf(a) - yearOf(b)).map(eventLabel);

/* ------------------------------------------------------------------ teaching screens */
// The labelled maps and short lists the lessons teach from, before the unlabelled questions.
// They are built from the same tables as the questions (FIND, CITIES, FEATURES, LANDMARKS, DATES),
// so a place cannot be asked for that no screen has shown.

const listWords = (items) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
const capFirst = (text) => text[0].toUpperCase() + text.slice(1);

/**
 * A map to explore with these countries tinted and named. `capitals` (names from CITIES) are
 * marked with red stars. The stars carry no names, because a capital's name beside its country's
 * name is more than a phone-sized map can hold: the lesson gives each capital in its text, next
 * to its country. `cities` are other cities, drawn as named blue dots (the big city that is not
 * the capital). `more` are countries that are named but not tinted (context, or a country
 * whose outline in the map data includes a disputed area). `at` moves a country's name to a
 * point of your choosing: { NO: [9.5, 61.5] }.
 */
export function countriesMap(ids, { view, capitals = [], cities = [], more = [], at = {}, pos = {}, color = 'green', extra = {} } = {}) {
  for (const name of capitals) if (!CITIES[name] || !CITIES[name][3]) throw new Error(`helpers: "${name}" is not a capital of the table`);
  const named = [...ids, ...more];
  let alt = `A map with ${listWords(named.map(countryName))} named.`;
  if (capitals.length) alt += ` Stars mark capitals: ${listWords(capitals.map((c) => `${c} in ${theName(cityCountry(c))}`))}.`;
  if (cities.length) alt += ` A dot marks ${listWords(cities.map((c) => `${c}, in ${theName(cityCountry(c))}`))}.`;
  return {
    type: 'world-map', view: Array.isArray(view) ? view : VIEW[view], legend: false, dim: false, dots: false,
    regions: ids.length ? [{ ids, color, tone: 'soft' }] : [],
    labels: named.map((id) => (at[id] ? { at: at[id], text: countryName(id), style: 'name' } : id)),
    markers: [
      ...capitals.map((name) => ({ at: cityAt(name), shape: 'star', color: 'red', size: 's' })),
      // the big city that is taken for the capital: named, so that it can be told from the star
      ...cities.map((name) => ({ at: cityAt(name), label: name, color: 'blue', size: 's', ...(pos[name] ? { labelPos: pos[name] } : {}) })),
    ],
    alt,
    ...extra,
  };
}

/**
 * A map to explore with cities of CITIES marked and named. Capitals are drawn as red stars, the
 * rest as blue dots. `unnamed` are capitals shown as stars without a name (taught on an earlier
 * screen; here only for orientation). `countries` are country names to print as well.
 */
export function citiesMap(names, { view, unnamed = [], countries = [], pos = {}, extra = {} } = {}) {
  const where = (n) => (CITIES[n][2] === 'HK' ? n : `${n} in ${theName(cityCountry(n))}`);
  return {
    type: 'world-map', view: Array.isArray(view) ? view : VIEW[view], dots: false, legend: false,
    ...(countries.length ? { labels: countries } : {}),
    markers: [
      ...unnamed.map((name) => ({ at: cityAt(name), shape: 'star', color: 'red', size: 's' })),
      ...names.map((name) => ({
        at: cityAt(name), label: name, size: 's',
        ...(CITIES[name][3] ? { shape: 'star', color: 'red' } : { color: 'blue' }),
        ...(pos[name] ? { labelPos: pos[name] } : {}),
      })),
    ],
    alt: `A map with ${names.length} cities marked and named: ${listWords(names.map(where))}.${unnamed.length ? ` Stars without names mark the capitals ${listWords(unnamed)}.` : ''}`,
    ...extra,
  };
}

/** A map to explore with physical features of a FEATURES list marked and named (all of them, or those in `names`). */
export function featuresMap(features, { view, names, pos = {}, extra = {} } = {}) {
  const shown = names ? names.map((n) => { const f = features.find((x) => x.name === n); if (!f) throw new Error(`helpers: no feature "${n}"`); return f; }) : features;
  const short = (f) => capFirst(f.name.replace(/^the /, ''));
  return {
    type: 'world-map', view: Array.isArray(view) ? view : VIEW[view], dots: false,
    markers: shown.map((f) => ({
      at: f.at, label: short(f), size: 's',
      ...(f.kind === 'water' ? { color: 'blue', shape: 'diamond' } : { color: 'orange', shape: 'square' }),
      ...(pos[f.name] ? { labelPos: pos[f.name] } : {}),
    })),
    alt: `A map with ${shown.length} places marked and named: ${listWords(shown.map(short))}.`,
    ...extra,
  };
}

/** "the Alps: the arc of high mountains across the top of Italy" lines for a list of features. */
export const featureLines = (features, names) => (names || features.map((f) => f.name))
  .map((n) => { const f = features.find((x) => x.name === n); if (!f) throw new Error(`helpers: no feature "${n}"`); return `- **${capFirst(f.name.replace(/^the /, ''))}**: ${f.clue}`; });

const yearText = (y) => (y <= -10000 ? `about ${(-y).toLocaleString('en-US')} years ago` : y < 0 ? `${-y} BCE` : y < 1000 ? `${y} CE` : String(y));
/** "- **1889**: The Eiffel Tower opens in Paris" lines, earliest first, for a list of DATES ids. `about` marks rounded years. */
export const dateLines = (ids, about = []) => ids.slice().sort((a, b) => yearOf(a) - yearOf(b))
  .map((id) => `- **${about.includes(id) && yearOf(id) > -10000 ? 'About ' : ''}${yearText(yearOf(id))}**: ${eventLabel(id)}`);

/**
 * A timeline (a picture) of some DATES events, each under a short name: { qin: 'China united' }.
 * The full sentences belong in the text beside it (dateLines).
 */
export function datesTimeline(ids, short, { from, to, step } = {}) {
  const sorted = ids.slice().sort((a, b) => yearOf(a) - yearOf(b));
  for (const id of sorted) if (!short[id]) throw new Error(`helpers: no short name for the event "${id}"`);
  return {
    type: 'timeline', from, to, step, showYears: true, mode: 'static',
    events: sorted.map((id) => ({ id, year: yearOf(id), label: short[id], short: short[id], color: 'orange' })),
    alt: `A timeline. ${sorted.map((id) => `${yearText(yearOf(id))}: ${eventLabel(id)}`).join('; ')}.`,
  };
}

/* ------------------------------------------------------------------ the index used by hints */
const FIND_INDEX = {};
for (const list of Object.values(FIND)) for (const c of list) if (!FIND_INDEX[c.id]) FIND_INDEX[c.id] = c;
export const findEntry = (id) => FIND_INDEX[id] || null;
