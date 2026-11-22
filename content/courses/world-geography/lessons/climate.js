// The World at a Glance · Lesson 5 · Why It Is Hot Here and Cold There
//
// Driving question: why is it hot here and cold there, wet here and dry there? Five causes explain almost every climate.
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-geography/index.js';
import {
  SAME_LATITUDE, COOLING_PER_KM, seasonCities, CURRENTS, CURRENT_SPOTS, BIOMES, biome, MONSOON_YEAR, DESERTS, TILT,
  spreadMarkers, countryName, listText,
} from '../helpers.js';

const { sea: SEA, inland: INLAND } = SAME_LATITUDE;
const LETTERS = 'ABCDEFG';
const TRANSECT = BIOMES.filter((b) => b.transect);
// The example places of BIOMES that lie in the Americas, north to south, for the second teaching map. The table has no
// American desert, so the Atacama (from DESERTS) stands in: every one of the nine biomes is then on this map.
const AMERICAS_BIOMES = [
  ...BIOMES.flatMap((b) => b.spots.filter((sp) => sp.at[0] < -30).map((sp) => ({ ...sp, biome: b.short }))),
  { at: DESERTS.find((d) => d.id === 'atacama').cores[0], place: 'The Atacama', biome: biome('desert').short },
].sort((p, q) => q.at[1] - p.at[1]);
// Where each city's name goes on the small map of "season-city", so that neighbours do not sit on each other.
const CITY_LABEL_POS = {
  Sydney: 'top', Perth: 'left', Auckland: 'bottom', 'Cape Town': 'left', Johannesburg: 'right', Santiago: 'left', 'Buenos Aires': 'right',
  Vancouver: 'top', 'Los Angeles': 'bottom', 'New York': 'right', Cairo: 'bottom', Istanbul: 'top', 'Reykjavík': 'top', Moscow: 'right', Beijing: 'top', Tokyo: 'right',
};
// Two equal beams of sunlight meeting a round Earth: square-on near the Equator, at a slant near the pole.
const SUN_BEAMS = {
  type: 'svg', viewBox: '0 0 410 220', maxWidth: 460,
  alt: 'Two equal beams of sunlight arrive from the left and meet the curved surface of the Earth. The beam that strikes near the Equator hits the ground square-on and lights a small patch. The beam that strikes near the North Pole meets the ground at a slant and is spread over a patch almost twice as long.',
  content:
    '<circle class="fill-blue-soft stroke-ink" stroke-width="2.5" cx="300" cy="110" r="100"/>' +
    '<line class="stroke-hair" stroke-width="2" stroke-dasharray="5 5" x1="201" y1="110" x2="360" y2="110"/>' +
    '<polygon class="fill-yellow-soft stroke-yellow" stroke-width="2" points="14,14 272,14 225,44 14,44"/>' +
    '<polygon class="fill-yellow-soft stroke-yellow" stroke-width="2" points="14,95 201,95 201,125 14,125"/>' +
    '<line class="stroke-red" stroke-width="6" stroke-linecap="round" x1="272" y1="14" x2="225" y2="44"/>' +
    '<line class="stroke-red" stroke-width="6" stroke-linecap="round" x1="201" y1="95" x2="201" y2="125"/>' +
    '<text class="fig-label-sm" x="20" y="34">sunlight</text>' +
    '<text class="fig-label-sm" x="20" y="115">sunlight</text>' +
    '<text class="fig-label-sm text-red" x="150" y="64">spread out</text>' +
    '<text class="fig-label-sm text-red" x="92" y="146">concentrated</text>' +
    '<circle class="fill-ink" cx="300" cy="10" r="3.5"/>' +
    '<text class="fig-label-sm" x="300" y="32" text-anchor="middle">North Pole</text>' +
    '<text class="fig-label-sm" x="300" y="104" text-anchor="middle">Equator</text>',
};

// The Earth on opposite sides of the Sun, its axis pointing the same way both times: towards the Sun in June, away in December.
const SEASONS = {
  type: 'svg', viewBox: '0 0 460 200', maxWidth: 480,
  alt: 'The Sun in the middle, with the Earth drawn on either side of it. The Earth\'s axis is tilted the same way in both places. On the left, in June, the northern end of the axis leans towards the Sun. On the right, in December, it leans away from the Sun.',
  content:
    '<circle class="fill-yellow-soft stroke-yellow" stroke-width="2.5" cx="230" cy="95" r="26"/>' +
    '<text class="fig-label-sm" x="230" y="99" text-anchor="middle">Sun</text>' +
    '<line class="stroke-yellow" stroke-width="2.5" stroke-linecap="round" x1="198" y1="95" x2="146" y2="95"/>' +
    '<polygon class="fill-yellow stroke-yellow" stroke-width="1" points="138,95 148,90 148,100"/>' +
    '<line class="stroke-yellow" stroke-width="2.5" stroke-linecap="round" x1="262" y1="95" x2="314" y2="95"/>' +
    '<polygon class="fill-yellow stroke-yellow" stroke-width="1" points="322,95 312,90 312,100"/>' +
    [95, 365].map((cx) =>
      `<circle class="fill-blue-soft stroke-ink" stroke-width="2.5" cx="${cx}" cy="95" r="38"/>` +
      `<line class="stroke-hair" stroke-width="2" stroke-dasharray="5 5" x1="${cx - 34.9}" y1="79.9" x2="${cx + 34.9}" y2="110.1"/>` +
      `<line class="stroke-red" stroke-width="3" stroke-linecap="round" x1="${cx - 19.9}" y1="140.9" x2="${cx + 19.9}" y2="49.1"/>` +
      `<text class="fig-label-sm text-red" x="${cx + 27}" y="44" text-anchor="middle">N</text>`).join('') +
    '<text class="fig-label" x="95" y="168" text-anchor="middle">June</text>' +
    '<text class="fig-label-sm" x="95" y="186" text-anchor="middle">north leans towards the Sun</text>' +
    '<text class="fig-label" x="365" y="168" text-anchor="middle">December</text>' +
    '<text class="fig-label-sm" x="365" y="186" text-anchor="middle">north leans away</text>',
};

export default {
  id: 'climate',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Same latitude, different worlds',
      text: `
        ${SEA.name} and ${INLAND.name} are almost exactly as far north as each other: both lie at ${SAME_LATITUDE.latitude}° N, and both get the same hours of daylight.

        In ${SEA.name} the average temperature in January is about **${SEA.jan}°C**. **What do you think it is in ${INLAND.name}?**
      `,
      figure: {
        type: 'world-map', view: [-14, 44, 48, 66], zoom: false,
        parallels: [{ lat: SAME_LATITUDE.latitude, label: `${SAME_LATITUDE.latitude}° N`, color: 'red', dashed: true }],
        markers: [{ at: SEA.at, label: SEA.name, color: 'red', labelPos: 'bottom' }, { at: INLAND.at, label: INLAND.name, color: 'red', labelPos: 'bottom' }],
        alt: `A map of northern Europe. ${SEA.name}, on the island of Great Britain, and ${INLAND.name}, deep inside Russia, are both marked on the same line of latitude, ${SAME_LATITUDE.latitude} degrees north.`,
      },
      shuffle: false,
      options: [
        { text: `About the same: ${SEA.jan}°C` },
        { text: 'A little colder: about 0°C' },
        { text: `Much colder: about ${INLAND.jan}°C`.replace('-', '−'), correct: true },
        { text: 'Warmer: about 8°C' },
      ],
      explain: `
        About **${String(INLAND.jan).replace('-', '−')}°C**: ten degrees colder, at the same distance from the Equator.

        Latitude matters most, but it is not the whole story. This lesson collects the handful of causes that, between them, explain almost every climate on Earth.
      `,
    },
    {
      id: 'teach-climate',
      type: 'info',
      title: 'Weather today, climate every year',
      text: `
        **Weather** is what the sky does today. **Climate** is the weather a place can expect year after year: how hot its summers are, how cold its winters, how much rain falls.

        Five causes explain almost every climate, and the first is **latitude**. In [the tropics]{.orange} the midday Sun climbs high, close to straight overhead. The further you go towards a pole, the lower it stands, even in summer.

        Why should a lower Sun mean colder ground? The next picture shows it.
      `,
      figure: {
        type: 'world-map', zoom: false, parallels: ['equator', 'tropics', 'polar-circles'],
        areas: [{ band: [-23.44, 23.44], color: 'orange', label: 'The tropics: the midday Sun stands high', labelOn: 'legend' }],
        alt: 'A world map with the Equator, the two tropics and the two polar circles drawn across it. The band between the tropics is shaded.',
      },
    },
    {
      id: 'sun-angle',
      type: 'fill',
      title: 'Cause 1: latitude',
      text: 'Here are two equal beams of sunlight arriving at the Earth. **Look where each one lands, then complete the sentences.**',
      figure: SUN_BEAMS,
      template: `
        Near the Equator the midday Sun stands [[*high|low]] in the sky, so a beam of sunlight is [[*concentrated on a small patch|spread over a large patch]] of ground.

        Near the poles the same beam arrives at a slant and heats each square metre [[*less|more]].
      `,
      explain: 'The Sun is no closer to the Equator than to the poles in any way that matters. The difference is the **angle**: slanting light is spread thin. That is why it is hot in the tropics and cold at the poles.',
    },
    {
      id: 'teach-seasons',
      type: 'info',
      title: 'The tilt makes the seasons',
      text: `
        Slanting light is spread thin: that one rule makes the tropics hot and the poles cold. It makes the seasons too.

        The Earth's axis is tilted by ${TILT}°, and it keeps pointing the same way as the planet circles the Sun.

        - **June to August**: the north leans towards the Sun. There the Sun climbs higher and the days are longer. Summer in the north, winter in the south.
        - **December to February**: it is the south's turn. Summer in the south, winter in the north.

        So the seasons are **opposite** in the two hemispheres.
      `,
      figure: SEASONS,
    },
    {
      id: 'seasons',
      type: 'choice',
      title: 'Summer and winter',
      text: 'In July it is summer in Chicago, Rome and Beijing, all three north of the Equator. **Why?**',
      options: [
        { text: 'The northern half of the Earth is tilted towards the Sun', correct: true },
        { text: 'The Earth is closer to the Sun in July', why: 'A very common idea, but the Earth is actually *farthest* from the Sun in early July, and closest in early January.' },
        { text: 'The Sun gives out more heat in July', why: 'The Sun\'s output hardly changes through the year. And in July it is winter in Australia.' },
        { text: 'The Earth turns more slowly in July, so days are longer', why: 'The Earth spins at the same rate all year. Days are longer in summer because of the tilt.' },
      ],
      explain: 'The tilt, not the distance: from June to August the northern half of the Earth leans towards the Sun, so the Sun climbs higher there and the days are longer. In Sydney, south of the Equator, Christmas falls at the height of summer.',
    },
    {
      id: 'season-city',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const month = rng.pick(['January', 'July']);
        const season = rng.pick(['summer', 'winter']);
        const wantNorth = (month === 'July') === (season === 'summer');
        const pool = seasonCities();
        const right = rng.pick(pool.filter((c) => (c.at[1] > 0) === wantNorth));
        const wrong = rng.sample(pool.filter((c) => (c.at[1] > 0) !== wantNorth), 3);
        const half = (c) => (c.at[1] > 0 ? 'Northern' : 'Southern');
        return {
          text: `It is **${month}**. In which of these cities is it **${season}**? The map shows where the four are.`,
          // The map supplies where the cities are; the step asks for the rule (which hemisphere has which season).
          figure: {
            type: 'world-map', zoom: false, parallels: ['equator'],
            markers: [right, ...wrong].sort((p, q) => p.at[0] - q.at[0]).map((c) => ({ at: c.at, label: c.name, color: 'red', size: 's', labelPos: CITY_LABEL_POS[c.name] })),
            alt: `A world map with the Equator drawn across it and four cities marked and named: ${listText([right, ...wrong].map((c) => c.name).sort())}.`,
          },
          options: [
            { text: right.name, correct: true },
            ...wrong.map((c) => ({ text: c.name, why: `${c.name} is in the ${half(c)} Hemisphere, where ${month} is a ${season === 'summer' ? 'winter' : 'summer'} month.` })),
          ],
          explain: `${right.name}, in ${right.country === 'US' ? 'the ' : ''}${countryName(right.country)}, is in the ${half(right)} Hemisphere, which is tilted ${season === 'summer' ? 'towards' : 'away from'} the Sun in ${month}. The other three are in the ${half(wrong[0])} Hemisphere, where the seasons are the other way round.`,
        };
      },
    },
    {
      id: 'altitude',
      type: 'numeric',
      review: true,
      title: 'Cause 2: height',
      gen: (rng) => {
        const base = rng.int(24, 30);
        const km = rng.int(1, 3);
        const scene = rng.pick([
          { low: 'A town on the coast', high: 'a village in the mountains behind it' },
          { low: 'A port at the foot of the Andes', high: 'a mining town high above it' },
          { low: 'A plantation on a tropical plain', high: 'a tea garden on the hills above' },
        ]);
        return {
          text: `
            Climb a mountain and the air gets thinner and colder: by about **${COOLING_PER_KM}°C for every 1,000 m**. So 500 m up it is about ${COOLING_PER_KM / 2}°C cooler, and 5,000 m up about ${COOLING_PER_KM * 5}°C cooler. That is why Quito, on the Equator but 2,850 m up, feels like spring all year, and why Kilimanjaro, also near the Equator, has ice on top.

            ${scene.low} has an average temperature of **${base}°C**. What would you expect in ${scene.high}, **${(km * 1000).toLocaleString('en-US')} m** higher?
          `,
          answer: base - COOLING_PER_KM * km,
          unit: '°C',
          wrong: [
            [base - km, `That takes off 1°C per 1,000 m. The air cools by about ${COOLING_PER_KM}°C per 1,000 m.`],
            [base + COOLING_PER_KM * km, 'Higher means colder, not warmer: subtract.'],
          ],
          hints: [`${km} × ${COOLING_PER_KM} degrees colder than ${base}°C.`],
          explain: `Climbing ${km},000 m costs ${km} × ${COOLING_PER_KM} = ${COOLING_PER_KM * km}°C, and ${base} − ${COOLING_PER_KM * km} = **${base - COOLING_PER_KM * km}°C**. Height can matter as much as latitude: many of the great cities of the tropics, from Mexico City to Addis Ababa, were built in the cool highlands.`,
        };
      },
    },
    {
      id: 'sea',
      type: 'multi',
      title: 'Cause 3: the sea',
      text: `Back to ${SEA.name}, beside the sea, and ${INLAND.name}, far inland, at the same latitude. The chart shows their average temperatures in January and in July. **Which statements are true?**`,
      figure: {
        type: 'bars', categories: ['January', 'July'], yMin: -10, yMax: 25, yStep: 5, yLabel: 'average °C', unit: '°C',
        series: [
          { name: `${SEA.name} (by the sea)`, color: 'blue', values: [SEA.jan, SEA.jul] },
          { name: `${INLAND.name} (far inland)`, color: 'orange', values: [INLAND.jan, INLAND.jul] },
        ],
        alt: `A bar chart of average temperatures. ${SEA.name}: ${SEA.jan} degrees in January and ${SEA.jul} in July. ${INLAND.name}: ${String(INLAND.jan).replace('-', 'minus ')} degrees in January and ${INLAND.jul} in July.`,
      },
      options: [
        { text: `${INLAND.name} has the colder winter`, correct: true },
        { text: `${INLAND.name} has the warmer summer`, correct: true },
        { text: `The gap between winter and summer is bigger in ${INLAND.name}`, correct: true },
        { text: `${SEA.name} is warmer all year round`, why: `Only in winter. In July ${INLAND.name} is about ${INLAND.jul - SEA.jul}°C warmer.` },
      ],
      explain: `
        ${SEA.name} swings ${SEA.jul - SEA.jan}°C between January and July; ${INLAND.name} swings ${INLAND.jul - INLAND.jan}°C. Water warms up and cools down far more slowly than land, so the sea keeps its coasts mild in winter and cool in summer.

        Far from the sea, in the heart of a continent, summers are hot and winters brutal.
      `,
    },
    {
      id: 'currents',
      type: 'interact',
      title: 'Cause 4: ocean currents',
      text: `
        The sea also *moves* heat. [Warm currents]{.red} carry tropical water towards the poles: the Gulf Stream and its continuation warm the winds that blow over north-west Europe. [Cold currents]{.blue} bring polar water towards the Equator along the west coasts of the continents.

        Air chilled by a cold current makes fog but hardly any rain. **Tap the two markers that stand in coastal deserts.**
      `,
      widget: {
        type: 'world-map', view: [-140, -55, 45, 72], mode: 'pickMarkers', max: 2, markerLabels: 'after', legend: false,
        answer: CURRENT_SPOTS.filter((p) => p.dry).map((p) => p.id),
        lines: CURRENTS.map((c) => ({ points: c.path, curve: 'straight', color: c.warm ? 'red' : 'blue', arrow: true, width: 3.5, animate: 'flow', label: c.name })),
        markers: CURRENT_SPOTS.map((p) => ({ id: p.id, at: p.at, label: p.label, color: 'violet' })),
        alt: 'A map of the Atlantic Ocean and the lands around it, with ocean currents drawn as arrows. A red arrow runs from Florida across the North Atlantic to Norway. Blue arrows run towards the Equator along the west coasts of North America, South America, North Africa and southern Africa. Five lettered markers stand on the coasts.',
      },
      check: (s) => {
        const want = CURRENT_SPOTS.filter((p) => p.dry).map((p) => p.id).sort();
        if (s.picked.join() === want.join()) return true;
        if (s.count < 2) return 'Choose two markers.';
        const bad = s.picked.find((id) => !want.includes(id));
        return {
          norway: 'One of your markers is at the end of the red arrow: a coast warmed by a warm current, mild and very rainy.',
          amazon: 'One of your markers is at the mouth of the Amazon, on the Equator, where no cold current reaches. It is hot and rainy all year.',
          florida: 'One of your markers is where the red arrow starts: Florida is bathed in warm water, and humid.',
        }[bad];
      },
      solution: { picked: CURRENT_SPOTS.filter((p) => p.dry).map((p) => p.id) },
      hints: ['Look for markers that sit right beside a blue arrow.'],
      explain: `
        The **Atacama** lies beside the cold Humboldt Current and the **Namib** beside the cold Benguela Current: two of the driest places on Earth, with the sea in plain sight.

        At the other end of the red arrow, the harbours of northern Norway stay free of ice all winter, deep inside the Arctic Circle.
      `,
    },
    {
      id: 'belts',
      type: 'info',
      title: 'Cause 5: the winds',
      text: `
        Air moves heat and water too, in a pattern set by the Sun.

        At the Equator, hot damp air **rises**, cools and drops its water as rain almost every day. The dried-out air then flows away high up and **sinks** again around 20° to 30° north and south. Sinking air brings clear skies and no rain.

        That is the answer to the puzzle from the last lesson: the [green]{.green} belt is where the rainforests are, and most hot [deserts]{.red} sit in the two [orange]{.orange} belts.
      `,
      figure: {
        type: 'world-map', zoom: false,
        areas: [
          { band: [-8, 8], color: 'green', label: 'Rising air: rain' },
          { band: [17, 32], color: 'orange', label: 'Sinking air: dry' },
          { band: [-32, -17], color: 'orange' },
          ...DESERTS.map((d) => ({ polygon: d.area, color: 'red' })),
        ],
        alt: 'A world map with three belts of latitude shaded: a green belt along the Equator and an orange belt on each side of it, around 20 to 30 degrees north and south. Outlines of the great deserts are drawn in red. The Sahara, the Arabian Desert, the Kalahari, the Atacama and the Australian deserts all lie inside the orange belts; only the Gobi, in the middle of Asia, lies outside them.',
      },
    },
    {
      id: 'rain-shadow',
      type: 'choice',
      title: 'Mountains in the way',
      text: `
        Winds carry water from the sea, and mountains wring it out of them: as air is forced to climb, it cools and its moisture falls as rain or snow. The far side is left dry, in a **rain shadow**.

        This view from space looks down on the Himalaya, the white band of snow. North is at the top. **From which side do the wet winds come?**
      `,
      figure: photo(MEDIA['himalaya-space'], {
        alt: 'A view from space. A white band of snowy mountains curves across the upper part of the picture. Below it the land is green and hazy, crossed by pale rivers that run down to a dark sea at the bottom. Above it the land is bare and brown, dotted with small blue lakes and streaks of cloud.',
        caption: 'The Himalaya from space: India and Bangladesh below, Tibet above',
        creditLabel: 'Image',
      }),
      options: [
        { text: 'From the south', correct: true },
        { text: 'From the north', why: 'Then the northern side would be the green one. It is bare and brown.' },
        { text: 'From both sides equally', why: 'Then both sides would look alike. One is green and the other brown.' },
      ],
      explain: `
        The green side is the wet side. Winds from the Indian Ocean drop their rain as they climb the southern slopes. Where they first meet high ground, in the Khasi Hills of north-east India, some villages get more than 11 metres of rain a year. Tibet, behind the wall, is high, cold and dry.

        The Gobi, far from any sea and walled off by mountains, is dry for the same reason.
      `,
    },
    {
      id: 'monsoon',
      type: 'order',
      title: 'The monsoon year',
      text: `
        Over South Asia the wind reverses with the seasons. In summer the land heats up faster than the sea, the hot air over it rises, and wet air from the Indian Ocean is drawn in to replace it. In winter the flow turns round. This is the **monsoon**, from the Arabic *mawsim*, "season".

        **Put the monsoon year in order, starting in spring.**
      `,
      figure: {
        type: 'world-map', view: [58, 4, 98, 31], aspect: 1.75, maxWidth: 310, zoom: false, legend: false,
        lines: [
          { points: [[58, 6], [66, 10], [73, 15]], curve: 'straight', color: 'blue', arrow: true, width: 3.5, animate: 'flow', label: 'Summer: wet winds from the sea' },
          { points: [[66, 3], [74, 6], [80, 12]], curve: 'straight', color: 'blue', arrow: true, width: 3.5, animate: 'flow' },
          { points: [[84, 9], [88, 15], [89.5, 21.5]], curve: 'straight', color: 'blue', arrow: true, width: 3.5, animate: 'flow' },
        ],
        labels: ['IN'],
        alt: 'A map of South Asia in summer. Three arrows show winds blowing from the south-west, off the Indian Ocean, on to the west coast of India and up the Bay of Bengal towards Bangladesh.',
      },
      items: MONSOON_YEAR,
      labels: ['Spring', 'Winter'],
      hints: ['The rains arrive at the coast first, then spread inland.', 'The heat comes before the rain: it is the hot land that pulls the wet air in.'],
      explain: `
        The rains normally reach the south-west coast of India around the start of June and cover the country within about five weeks. India gets about three-quarters of its whole year's rain between June and September, and the harvest of more than a billion people depends on it.

        Sailors learned to ride these winds across the Indian Ocean and back. You will meet them in *Crossroads*.
      `,
    },
    {
      id: 'biomes',
      type: 'info',
      title: 'Climate you can see',
      text: `
        Each climate grows its own kind of landscape: a **biome**. North from the Congo you cross most of them in order.

        | Biome | In a few words |
        |-------|----------------|
        ${BIOMES.map((b) => `| ${b.short} | ${b.brief} |`).join('\n        ')}
      `,
      figure: {
        type: 'world-map', view: [-22, -10, 80, 82], aspect: 0.82, zoom: false,
        markers: [
          ...TRANSECT.map((b) => ({ at: b.transect, label: b.short, color: 'green', labelPos: 'left' })),
          { at: [62, 49], label: 'Steppe', color: 'green', labelPos: 'bottom' },
        ],
        lines: [{ points: TRANSECT.map((b) => b.transect), curve: 'straight', color: 'green', dashed: true, width: 2 }],
        alt: `A map of Africa and Europe from the Equator to the Arctic, with a line of markers running north: ${listText(TRANSECT.map((b) => b.short.toLowerCase()))}. A marker for steppe stands further east, in the middle of Asia.`,
      },
    },
    {
      id: 'teach-biome-world',
      type: 'info',
      title: 'The same belts on every continent',
      text: `
        The belts you crossed in Africa and Europe run right round the world, and they repeat south of the Equator. Here they are again in the Americas: find the southern savanna, desert and Mediterranean.

        In the middle latitudes three biomes lie side by side:

        - **Mediterranean** on the west side of a continent, about 30° to 40° from the Equator;
        - **temperate forest** where rain from the sea reaches;
        - **steppe** deep inside a continent, where little rain arrives.

        Taiga and tundra ring the far north, and ice caps cover Greenland and Antarctica.
      `,
      figure: {
        type: 'world-map', view: [-135, -58, -28, 84], zoom: false, dots: false, parallels: ['equator', 'tropics', 'polar-circles'],
        markers: AMERICAS_BIOMES.map((sp) => ({ at: sp.at, label: sp.biome, color: 'green', labelPos: sp.at[0] < -90 ? 'right' : undefined })),
        alt: `A map of the Americas from the Arctic to the tip of South America, with the Equator, the tropics and the polar circles drawn across it. Places are marked with their biome: ${listText(AMERICAS_BIOMES.map((sp) => `${sp.place.replace(/^The /, 'the ')}, ${sp.biome.toLowerCase()}`))}.`,
      },
    },
    {
      id: 'find-biome',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const target = rng.pick(BIOMES);
        const spots = BIOMES.map((b) => ({ id: b.id, ...rng.pick(b.spots) }));
        const shown = spreadMarkers(rng, spots, spots.find((sp) => sp.id === target.id), { count: 5, gap: 26 });
        const markers = shown.map((sp) => ({ id: sp.id, at: sp.at, label: `${sp.place}: ${biome(sp.id).short.toLowerCase()}`, color: 'green' }));
        return {
          text: `
            Each marker stands in a different biome. The Equator, the tropics and the polar circles are drawn in. **Tap the marker that stands ${target.where}.**

            (${target.short}: ${target.sketch}.)
          `,
          widget: {
            type: 'world-map', mode: 'pickMarker', markerLabels: 'after', answer: target.id, markers, parallels: ['equator', 'tropics', 'polar-circles'],
            alt: 'A world map without country names, with the Equator, the tropics and the polar circles drawn across it. Lettered markers stand on the land, each in a different biome.',
          },
          check: (s) => {
            if (s.picked === target.id) return true;
            if (!s.picked) return false;
            const at = shown.find((sp) => sp.id === s.picked);
            return `Marker ${LETTERS[markers.findIndex((m) => m.id === s.picked)]} is ${at.place.replace(/^The /, 'the ')}: ${biome(s.picked).name} (${biome(s.picked).sketch.split(':')[0]}).`;
          },
          solution: { picked: target.id },
          hints: [{
            rainforest: 'Look along the Equator, where hot damp air rises every day.',
            savanna: 'Look in the tropics, a little way north or south of the rainforest belt.',
            desert: 'Look in the dry belts around 20° to 30° from the Equator.',
            mediterranean: 'Look on the western side of a continent, between about 30° and 40° from the Equator.',
            'temperate-forest': 'Look in the middle latitudes, within reach of rain from the sea.',
            steppe: 'Look in the middle latitudes, but deep inside a continent, where little rain arrives.',
            taiga: 'Look in the far north of the northern continents, below the treeless Arctic fringe.',
            tundra: 'Look on the Arctic edge of the northern continents.',
            ice: 'Look for land near a pole, or under a permanent ice sheet.',
          }[target.id]],
          explain: `${shown.find((sp) => sp.id === target.id).place}: ${target.name}. ${target.sketch.charAt(0).toUpperCase()}${target.sketch.slice(1)}.`,
        };
      },
    },
    {
      id: 'windcatchers',
      type: 'choice',
      title: 'Read the buildings',
      text: `
        People build for their climate, so buildings are evidence. This tower rises from the roof of a house in the old town of Yazd, in Iran. It is hollow, its sides are slotted with tall openings, and its shafts lead down into the rooms below.

        Look at the wall beneath it as well: thick, plastered with mud, almost without windows. **What kind of climate was this house built for?**
      `,
      figure: photo(MEDIA.windcatchers, {
        alt: 'A tall square tower plastered in pale brown mud rises above a plain, thick wall of the same colour, under a clear deep-blue sky. Each side of the tower is cut by a row of tall, narrow vertical openings.',
        caption: 'A wind tower in Yazd, Iran',
      }),
      options: [
        { text: 'Hot and very dry', correct: true },
        { text: 'Hot and very rainy', why: 'Mud plaster would soon wash away in heavy rain. Houses in the wet tropics have steep roofs with wide eaves, and are often raised on stilts.' },
        { text: 'Cold and snowy', why: 'In cold places people keep openings small and shut the wind out. This tower is made to let moving air in.' },
        { text: 'Mild and damp all year', why: 'A damp climate is hard on mud walls, and a mild one has no need of a tower to catch the breeze.' },
      ],
      explain: `
        Yazd stands in the desert of central Iran and gets only about 50 to 60 mm of rain a year. The tower is a **wind-catcher**: it scoops passing breezes down into the house and lets hot air escape, a way of cooling rooms that is many centuries old. Thick mud walls keep out the midday heat, and they last because it hardly ever rains.

        Steep roofs, stilts, thick walls, wind towers: once you know the causes of climate, you can read them in a street.
      `,
    },
    {
      id: 'transect',
      type: 'order',
      review: true,
      text: 'You set out from the Congo, on the Equator, and travel north through Africa and Europe to the Arctic Ocean. **In what order do you cross these landscapes?**',
      items: TRANSECT.filter((b) => b.id !== 'ice').map((b) => `${b.short}: ${b.sketch.split(':')[0]}`),
      labels: ['At the Equator', 'In the Arctic'],
      hints: ['Start hot and wet. The dry belt of sinking air comes at about 20° to 30° N.', 'In the far north: forest first, then the treeless tundra.'],
      explain: 'Rainforest under the rising air of the Equator; savanna where the rains become seasonal; desert under the sinking air; Mediterranean scrub; temperate forest; the conifers of the taiga; and at last the treeless tundra. Latitude draws the belts; height, the sea, currents and winds bend them.',
    },
  ],
  recap: [
    '**Latitude** comes first: sunlight strikes the tropics square-on and the poles at a slant. The tilt of the Earth\'s axis, not its distance from the Sun, makes the seasons, which are opposite in the two hemispheres.',
    `**Height** cools: about ${COOLING_PER_KM}°C for every 1,000 m. The **sea** makes climates mild; the hearts of continents have hot summers and bitter winters.`,
    '**Ocean currents** and **winds** move heat and water: warm currents warm the coasts they reach, cold currents dry them out, rising air at the Equator brings rain, sinking air near 20° to 30° makes deserts, and mountains cast rain shadows.',
    'Each climate has its **biome**: from the Equator, rainforest, savanna, desert, Mediterranean, temperate forest and steppe, taiga, tundra, ice.',
  ],
  next: 'Next: put eight billion people on this map. They are not spread evenly, and by now you can guess where they are not.',
};
