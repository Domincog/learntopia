// The World at a Glance · Lesson 6 · Eight Billion Neighbours
//
// Driving question: eight billion people share the planet. Why are they crowded on to so little of it?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-geography/index.js';
import { countryInfo } from '../../../../src/widgets/world-map.js';
import {
  POPULATION_SHARE, HALF_CIRCLE, PEOPLE_SPOTS, peopleSpot, DENSITY, MEGACITIES, BILLIONS, spreadMarkers, countryName, listText,
} from '../helpers.js';

const LETTERS = 'ABCDEFG';
const CROWDED = Object.keys(DENSITY.crowded);
const SPARSE = Object.keys(DENSITY.sparse);
const perKm = (code) => DENSITY.crowded[code] || DENSITY.sparse[code];
// The night picture is a plain longitude and latitude grid of the whole Earth, cut down to the box below
// ([left, top, right, bottom] as fractions of the whole). Rings are given as places and turned into fractions of the picture.
const NIGHT = MEDIA['earth-night'];
const NIGHT_BOX = NIGHT.width / NIGHT.height > 1.8 ? [0, 0, 1, 1] : [0.4306, 0.1, 0.9306, 0.75];
const nightSpot = (id, [lon, lat], degrees, label, alt) => ({
  id, label, alt,
  x: Math.round((((lon + 180) / 360 - NIGHT_BOX[0]) / (NIGHT_BOX[2] - NIGHT_BOX[0])) * 1000) / 1000,
  y: Math.round((((90 - lat) / 180 - NIGHT_BOX[1]) / (NIGHT_BOX[3] - NIGHT_BOX[1])) * 1000) / 1000,
  r: Math.round((degrees / 360 / (NIGHT_BOX[2] - NIGHT_BOX[0])) * 1000) / 1000,
});
const NIGHT_SPOTS = [
  nightSpot('nile', [31.5, 27], 10, 'The Nile', 'a thin line of light in north-east Africa'),
  nightSpot('europe', [10, 50], 18, 'Europe', 'a dense web of lights at the upper left'),
  nightSpot('india', [79, 23], 14, 'India', 'a broad field of lights in southern Asia'),
  nightSpot('china', [116, 33], 13, 'Eastern China', 'a dense patch of lights in eastern Asia'),
];
const the = (code) => (['NL', 'PH', 'GB', 'US'].includes(code) ? 'the ' : '');
// Where each country's name goes on the small map of "dense-sparse", so that neighbours do not sit on each other.
const COUNTRY_LABEL_POS = {
  NL: 'top', GB: 'left', DE: 'right', NO: 'left', FI: 'right', IS: 'left', IN: 'bottom', PK: 'left', BD: 'right', KR: 'top', JP: 'right', PH: 'right', VN: 'bottom',
  MN: 'top', KZ: 'left', RU: 'top', NA: 'left', BW: 'right', DZ: 'left', LY: 'right', NG: 'bottom', SA: 'right', BO: 'left', BR: 'right', AR: 'right', CA: 'top', AU: 'bottom',
};
// Megacities by map: seven in South and East Asia, ten elsewhere.
const ASIAN_MEGACITIES = MEGACITIES.filter((c) => c.at[0] > 60);
const OTHER_MEGACITIES = MEGACITIES.filter((c) => c.at[0] <= 60);
const CITY_LABEL_POS = {
  Tokyo: 'right', Delhi: 'top', Shanghai: 'right', Jakarta: 'bottom', Dhaka: 'bottom', Karachi: 'left', Manila: 'right',
  Cairo: 'bottom', Lagos: 'left', Kinshasa: 'right', Istanbul: 'left', Moscow: 'right', 'São Paulo': 'right', 'Buenos Aires': 'left', 'Mexico City': 'bottom', 'New York': 'right', 'Los Angeles': 'left',
};

export default {
  id: 'where-people-live',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'One circle',
      text: `
        In November 2022 the number of people alive passed **eight billion**. Imagine them spread evenly over the land: everyone would have a patch about 135 m across.

        They are not spread evenly. Look at the circle on the map (the flat map bends it into an egg shape). It covers about a tenth of the planet's surface, much of it sea. **What share of all the people in the world do you think live inside it?**
      `,
      figure: {
        type: 'world-map', zoom: false, legend: false,
        areas: [{ circle: HALF_CIRCLE.center, km: HALF_CIRCLE.km, color: 'red', label: 'The circle' }],
        alt: 'A world map with one large circle drawn on it, centred on southern China. The circle takes in China, India, Japan and Southeast Asia.',
      },
      min: 0, max: 100, step: 1, start: 20, unit: '%',
      answer: 52, tolerance: 8,
      explain: `
        **More than half.** Inside that circle live most of the people of China, India, Indonesia, Pakistan, Bangladesh and Japan: more people than in all the rest of the world put together.

        Why there? And why is so much of the rest so empty? By now you know enough about rivers, deserts and climate to work it out.
      `,
    },
    {
      id: 'teach-night',
      type: 'info',
      title: 'The planet at night',
      text: `
        Satellites took this picture of the Earth at night, with the clouds removed. Every glow is electric light: towns, cities, roads. Where there are lights, there are people.

        Three of the brightest patches are ringed: **Europe**, **India** and **eastern China**. Japan glows at the far right.

        Now look at the dark: the Sahara across the north of Africa, Arabia, Siberia, Tibet, the heart of Australia. You know from the last two lessons what they have in common.
      `,
      figure: photo(NIGHT, {
        alt: 'Europe, Africa, Asia and Australia at night, seen from space. The land is dark blue-black, sprinkled with points and webs of yellow-white light. Rings mark the three thickest patches of light: Europe, India and eastern China. Most of Africa, Arabia, northern Asia and Australia is dark.',
        caption: 'The Earth at night, 2016',
        creditLabel: 'Image',
        mode: 'label',
        hotspots: NIGHT_SPOTS.filter((sp) => sp.id !== 'nile'),
      }),
    },
    {
      id: 'night',
      type: 'interact',
      title: 'A thread of light',
      text: `
        Here is the picture again, without the rings. You have met one of its lights before: a thin bright thread crossing the dark Sahara to the sea.

        **Tap it.**
      `,
      widget: photo(NIGHT, {
        alt: 'Europe, Africa, Asia and Australia at night, seen from space. The land is dark blue-black, sprinkled with points and webs of yellow-white light. The lights are thickest over Europe, India, eastern China and Japan; most of Africa, Arabia, northern Asia and Australia is dark.',
        caption: 'The Earth at night, 2016',
        creditLabel: 'Image',
        mode: 'point',
        hotspots: NIGHT_SPOTS,
      }),
      check: (s) => s.picked === 'nile' || ({
        europe: 'That is Europe: a whole web of lights. The thread you want is a single line, further south and east.',
        india: 'That is India. Look further west, in the north-east corner of Africa.',
        china: 'That is eastern China. Look much further west, in the north-east corner of Africa.',
      }[s.picked] || (s.point ? 'Not there. Look at the north-east corner of Africa, where a line of light runs north to the Mediterranean.' : 'Tap the picture.')),
      solution: { point: { x: NIGHT_SPOTS[0].x, y: NIGHT_SPOTS[0].y } },
      hints: ['It is the river from the photograph at the start of lesson 4, seen from further away.'],
      explain: `
        The **Nile**: water, so people, so light, with the dark Sahara on either side.

        Keep one warning in mind, though. This is a map of electricity, not quite a map of people.
      `,
    },
    {
      id: 'korea',
      type: 'choice',
      title: 'Lights are not people',
      text: `
        Here is the Korean peninsula at night. About 52 million people live in South Korea, the bright lower half. About 26 million live in North Korea, between it and the lights of China at the top.

        **What does the dark gap tell you?**
      `,
      figure: photo(MEDIA['korea-night'], {
        alt: 'A night view of the Korean peninsula from space. The southern half glows with city lights. The northern half is almost completely dark, apart from one small point of light, and looks like a patch of sea between the bright south and the lit-up land beyond it to the north.',
        caption: 'The Korean peninsula at night',
        creditLabel: 'Image',
      }),
      options: [
        { text: 'People in North Korea have far less electricity, not that nobody lives there', correct: true },
        { text: 'Almost nobody lives in North Korea', why: 'About 26 million people live there: half as many as in South Korea.' },
        { text: 'That part of the peninsula is under the sea', why: 'It is land. The coastline is simply invisible without lights.' },
        { text: 'Clouds were covering the north', why: 'The picture was made from cloud-free nights. The darkness is real.' },
      ],
      explain: `
        Night lights show people **and** wealth. North Korea is dark because very little electric light is used there; the single bright point is the capital, Pyongyang.

        For the same reason the picture of the whole Earth understates Africa and India, where many people still live with little electric light, and overstates rich countries. Evidence always needs a second look.
      `,
    },
    {
      id: 'continents',
      type: 'multi',
      title: 'Count heads instead',
      text: 'So count people directly. The chart shows the share of the world\'s people living in each region. **Which statements are true?**',
      figure: {
        type: 'bars', yMax: 70, yStep: 10, yLabel: '% of all people', unit: '%',
        data: POPULATION_SHARE.map((r) => ({ label: r.short, value: r.share, color: r.color })),
        alt: `A bar chart of the share of the world's population by region: ${POPULATION_SHARE.map((r) => `${r.name} ${r.share}%`).join(', ')}.`,
      },
      options: [
        { text: 'More people live in Asia than in the whole of the rest of the world', correct: true },
        { text: 'Africa has about twice as many people as Europe', correct: true },
        { text: 'Fewer than one person in a hundred lives in Oceania', correct: true },
        { text: 'Northern America has more people than Africa', why: 'Northern America (the United States and Canada) has about 5% of the world\'s people; Africa has about 18%.' },
      ],
      explain: `
        Asia has about six in every ten people on Earth. Africa, with nearly two in ten, is growing fastest. *The Modern World* looks at how these numbers have changed.

        And within each continent, people cluster. Nearly nine in ten live north of the Equator; about four in ten live within 100 km of a sea coast; half of humanity lives less than 200 m above sea level.
      `,
    },
    {
      id: 'crowded-map',
      type: 'info',
      title: 'Where the crowds are',
      text: `
        The most crowded regions on Earth have things in common. Find them on the map:

        - the **river plains** of South and East Asia: monsoon rain, warmth and rich soil give two or three harvests a year, much of it **rice**, which feeds more people from each field than most other grains. These plains have been crowded for at least two thousand years;
        - **Java**, whose volcanic soil is among the most fertile anywhere;
        - the **Nile** valley, a ribbon of water through the desert;
        - **north-west Europe** and the coast of **West Africa**: plenty of rain, old ports, big cities.

        Water, warmth, soil and a way to trade: the things lessons 4 and 5 were about.
      `,
      figure: {
        type: 'world-map', view: [-25, -15, 150, 62],
        markers: PEOPLE_SPOTS.filter((p) => p.dense).map((p) => ({ at: p.at, label: p.label, color: 'red', labelPos: { ganges: 'left', china: 'right', java: 'bottom', nile: 'left', rhine: 'top', nigeria: 'bottom' }[p.id] })),
        rivers: ['Ganges', 'Yangtze', 'Yellow River', 'Nile', 'Rhine', 'Niger'],
        alt: 'A map of Europe, Africa and Asia with six of the most crowded regions on Earth marked: north-west Europe, the Nile delta, southern Nigeria, the plain of the Ganges, the plains of eastern China and the island of Java. The great rivers of those regions are drawn.',
      },
    },
    {
      id: 'teach-empty',
      type: 'info',
      title: 'Where almost nobody lives',
      text: `
        Most of the land has hardly anyone on it. People need crops, and crops need water, warmth and a growing season. Find these seven nearly empty regions on the map.

        | Nearly empty | Main reason |
        |---|---|
        ${PEOPLE_SPOTS.filter((p) => !p.dense).map((p) => `| ${p.label} | ${p.reason} |`).join('\n        ')}

        Rainforest soils are poor, and the forest is hard to clear.
      `,
      figure: {
        type: 'world-map',
        markers: PEOPLE_SPOTS.filter((p) => !p.dense).map((p) => ({ at: p.at, label: p.label, color: 'blue', shape: 'square', labelPos: { sahara: 'bottom', siberia: 'top', amazon: 'bottom', outback: 'bottom', greenland: 'right', tibet: 'bottom', 'arctic-canada': 'bottom' }[p.id] })),
        alt: `A world map with seven nearly empty regions marked and named: ${listText(PEOPLE_SPOTS.filter((p) => !p.dense).map((p) => p.label))}.`,
      },
    },
    {
      id: 'crowded-or-empty',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const wantDense = rng.bool();
        const target = rng.pick(PEOPLE_SPOTS.filter((p) => p.dense === wantDense));
        const shown = spreadMarkers(rng, PEOPLE_SPOTS.filter((p) => p.dense !== wantDense || p === target), target, { count: 5, gap: 24 });
        const markers = shown.map((p) => ({ id: p.id, at: p.at, label: p.label, color: 'red' }));
        return {
          text: wantDense
            ? 'Four of these markers stand in some of the emptiest regions on Earth. **Tap the one that stands in one of the most crowded.**'
            : 'Four of these markers stand in some of the most crowded regions on Earth. **Tap the one that stands in one of the emptiest.**',
          widget: { type: 'world-map', mode: 'pickMarker', markerLabels: 'after', answer: target.id, markers, alt: 'A world map without names, with five lettered markers on the land.' },
          check: (s) => {
            if (s.picked === target.id) return true;
            if (!s.picked) return false;
            const p = peopleSpot(s.picked);
            return `Marker ${LETTERS[markers.findIndex((m) => m.id === s.picked)]} (${p.label}) is ${p.dense ? 'one of the most crowded places on Earth' : `almost empty: ${p.reason}`}.`;
          },
          solution: { picked: target.id },
          hints: [wantDense ? 'Look for a river plain, a fertile island or a busy coast in a warm or mild climate.' : 'Look for a desert, an ice cap, a high plateau, a rainforest or the far north.'],
          explain: target.fact,
        };
      },
    },
    {
      id: 'empty-why',
      type: 'bucket',
      review: true,
      title: 'The empty quarters',
      text: 'Most of the land has hardly anyone on it. **Sort these nearly empty places by the main reason so few people live there.**',
      buckets: ['Too dry', 'Too cold', 'Too high'],
      items: [
        ['The Sahara', 0],
        ['Central Australia', 0],
        ['The south of Arabia', 0],
        ['Siberia', 1],
        ['Northern Canada', 1],
        ['Antarctica', 1],
        ['The Tibetan Plateau', 2],
        ['The high Himalaya', 2],
      ],
      explain: 'Crops need water, warmth and a growing season, and people need crops. Deserts, the far north, ice and high mountains offer too little of one or another. Dense rainforest is thinly peopled as well: its soils are poor and it is hard to clear. Half of all people live on about a hundredth of the land.',
    },
    {
      id: 'density',
      type: 'info',
      title: 'How many, or how crowded?',
      text: `
        Two countries with nearly the same number of people: **Bangladesh**, about 175 million, and **Russia**, about 145 million.

        But Bangladesh would fit into Russia more than a hundred times. To compare crowding, divide the people by the land: **population density**, in people per square kilometre.

        | | People | Area | People per km² |
        |---|---:|---:|---:|
        | Bangladesh | 175 million | 148,000 km² | about ${DENSITY.crowded.BD.toLocaleString('en-US')} |
        | Russia | 145 million | 17 million km² | about ${DENSITY.sparse.RU} |

        A big population does not mean a crowded country, and a small one does not mean an empty country.
      `,
      figure: {
        type: 'world-map', view: 'asia', zoom: false,
        regions: [{ ids: ['BD'], color: 'red', label: 'Bangladesh' }, { ids: ['RU'], color: 'blue', label: 'Russia' }],
        alt: 'A map of Asia with Russia, stretching right across the north, and Bangladesh, a small country at the head of the Bay of Bengal, highlighted.',
      },
    },
    {
      id: 'dense-sparse',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const wantCrowded = rng.bool();
        const right = rng.pick(wantCrowded ? CROWDED : SPARSE);
        const wrong = rng.sample(wantCrowded ? SPARSE : CROWDED, 3);
        const say = (code) => `${the(code) ? 'The ' : ''}${countryName(code)} has about ${perKm(code).toLocaleString('en-US')} people per km²`;
        return {
          text: `The map shows four countries. Think of the crowded and the empty regions you have met. Which of these countries is the **${wantCrowded ? 'most densely populated' : 'most thinly populated'}**: the one with the ${wantCrowded ? 'most' : 'fewest'} people for each square kilometre of land?`,
          // The map supplies where the four countries are; the step asks the learner to reason from what makes a region crowded or empty.
          figure: {
            type: 'world-map', zoom: false, legend: false,
            regions: [{ ids: [right, ...wrong], color: 'red' }],
            markers: [right, ...wrong].sort().map((code) => ({ at: countryInfo(code).center, label: countryName(code), color: 'red', size: 's', labelPos: COUNTRY_LABEL_POS[code] })),
            alt: `A world map with four countries marked and named: ${listText([right, ...wrong].map(countryName).sort())}.`,
          },
          options: [
            { text: countryName(right), correct: true },
            ...wrong.map((code) => ({ text: countryName(code), why: `${say(code)}.` })),
          ],
          explain: `${say(right)}. The others: ${wrong.map((code) => `${the(code)}${countryName(code)} about ${perKm(code).toLocaleString('en-US')}`).join(', ')}. ${wantCrowded ? 'Crowded countries are mostly fertile lowlands with plenty of rain.' : 'Thinly peopled countries are mostly desert, mountain, forest or frozen north.'}`,
        };
      },
    },
    {
      id: 'cities',
      type: 'choice',
      mode: 'predict',
      title: 'A planet of cities',
      text: 'For almost all of history, nearly everyone lived in a village or on a farm. **Where do most people live today?**',
      shuffle: false,
      options: [
        { text: 'Most still live in the countryside' },
        { text: 'It is almost exactly half and half' },
        { text: 'Most live in towns and cities', correct: true },
      ],
      explain: `
        Towns and cities. Adding up each country's own figures, the halfway mark was passed about 2007. By the United Nations' newest count, which measures every country the same way, about 45% of people live in cities and another 36% in towns.

        The giants are the **megacities**, with more than ten million people each. In 1975 there were eight; fifty years later there were more than thirty, over half of them in Asia.
      `,
    },
    {
      id: 'teach-megacities',
      type: 'info',
      title: 'Megacities of Asia',
      text: `
        A **megacity** has more than ten million people. Seven of the biggest stand in South and East Asia, all of them inside the circle from the start of this lesson. Find each one on the map.

        Notice where they stand: on a coast, or on a great river. Shanghai is at the mouth of the Yangtze, and Dhaka in the delta of the Ganges.
      `,
      figure: {
        type: 'world-map', view: [58, -12, 150, 46], dots: false,
        markers: ASIAN_MEGACITIES.map((c) => ({ at: c.at, label: c.name, color: 'red', labelPos: CITY_LABEL_POS[c.name] })),
        alt: `A map of South and East Asia with seven megacities marked and named: ${listText(ASIAN_MEGACITIES.map((c) => c.name))}.`,
      },
    },
    {
      id: 'teach-megacities-world',
      type: 'info',
      title: 'Ten more megacities',
      text: `
        Here are ten more, on the other continents. Find each one.

        Most of these stand on a coast or a great river too: Cairo on the Nile, Kinshasa on the Congo, Lagos and New York on the Atlantic. Mexico City is the great exception: it lies in a high valley, 2,240 m above the sea.
      `,
      figure: {
        type: 'world-map',
        markers: OTHER_MEGACITIES.map((c) => ({ at: c.at, label: c.name, color: 'red', size: 's', labelPos: CITY_LABEL_POS[c.name] })),
        alt: `A world map with ten megacities outside South and East Asia marked and named: ${listText(OTHER_MEGACITIES.map((c) => c.name))}.`,
      },
    },
    {
      id: 'megacities',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const target = rng.pick(MEGACITIES);
        const shown = spreadMarkers(rng, MEGACITIES, target, { count: 5, gap: 26 });
        const markers = shown.map((c) => ({ id: c.name, at: c.at, label: c.name, color: 'red' }));
        return {
          text: `Each marker is a megacity: a city of more than ten million people. **Tap ${target.name}.**`,
          widget: { type: 'world-map', mode: 'pickMarker', markerLabels: 'after', answer: target.name, markers, alt: 'A world map without names. Lettered markers stand on some of the largest cities in the world.' },
          check: (s) => {
            if (s.picked === target.name) return true;
            if (!s.picked) return false;
            const c = MEGACITIES.find((m) => m.name === s.picked);
            return `Marker ${LETTERS[markers.findIndex((m) => m.id === s.picked)]} is ${c.name}, in ${the(c.country)}${countryName(c.country)}.`;
          },
          solution: { picked: target.name },
          hints: [`${target.name} is in ${the(target.country)}${countryName(target.country)}.`],
          explain: `${target.name} is in ${the(target.country)}${countryName(target.country)}, ${target.site}. Most megacities stand on a coast or a great river.`,
        };
      },
    },
    {
      id: 'when',
      type: 'interact',
      title: 'How fast?',
      text: `
        The line shows when the world's population passed one, two and eight billion. Four billion is half of today's number, and the last doubling, from four billion to eight, took a little under fifty years.

        **Drag the card to the year the world passed four billion.** Within 25 years counts.
      `,
      widget: {
        type: 'timeline', from: 1750, to: 2050, step: 50, snap: 5,
        events: [
          { year: BILLIONS[1], label: '1 billion', color: 'gray' },
          { year: BILLIONS[2], label: '2 billion', color: 'gray' },
          { year: BILLIONS[8], label: '8 billion', color: 'gray' },
        ],
        place: [{ id: 'four', label: '4 billion', answer: BILLIONS[4], color: 'red' }],
        alt: `A timeline from 1750 to 2050 with three fixed events: 1 billion people in ${BILLIONS[1]}, 2 billion in ${BILLIONS[2]} and 8 billion in ${BILLIONS[8]}. One card, 4 billion, is to be placed.`,
      },
      check: (s) => {
        if (!s.complete) return 'Drag the card on to the line.';
        const year = s.placed.four;
        if (Math.abs(year - BILLIONS[4]) <= 25) return true;
        return year < BILLIONS[4]
          ? `Later than that. In ${BILLIONS[2]} there were only two billion people.`
          : 'Earlier than that. The world has doubled its numbers since it passed four billion.';
      },
      solution: { placed: { four: 1975 } },
      hints: ['It took all of history to reach one billion, and about 120 years more to reach two. The next doublings came much faster.'],
      explain: `
        Four billion came in **${BILLIONS[4]}**. Going from one billion to two took ${BILLIONS[2] - BILLIONS[1]} years; from two to four, ${BILLIONS[4] - BILLIONS[2]} years; from four to eight, ${BILLIONS[8] - BILLIONS[4]} years.

        The number of people doubled within a single lifetime. Growth is now slowing almost everywhere. Why it rose and why it is slowing is a story for *The Modern World*.
      `,
    },
    {
      id: 'why-asia',
      type: 'multi',
      stretch: true,
      title: 'Why there?',
      text: 'Back to the circle from the start of the lesson. **Which of these help to explain why so many people live in South and East Asia?**',
      figure: {
        type: 'world-map', view: [60, -12, 150, 52], zoom: false, legend: false,
        areas: [{ circle: HALF_CIRCLE.center, km: HALF_CIRCLE.km, color: 'red' }],
        rivers: ['Ganges', 'Brahmaputra', 'Indus', 'Yangtze', 'Yellow River', 'Mekong', 'Irrawaddy'],
        alt: 'A map of South and East Asia with the great rivers drawn: the Indus, the Ganges and the Brahmaputra flowing from the Himalaya, the Irrawaddy and the Mekong in the south-east, and the Yangtze and the Yellow River crossing China to the east.',
      },
      options: [
        { text: 'Great rivers from the Himalaya and Tibet spread rich soil over wide plains', correct: true },
        { text: 'The monsoon brings heavy rain in the warm season, when crops are growing', correct: true },
        { text: 'Rice, the main crop, feeds more people from each field than most other grains', correct: true },
        { text: 'Asia is the largest continent, so its people are no more crowded than anyone else', why: 'Most of Asia is nearly empty: Siberia, Tibet, the Gobi, Arabia. The crowds are in a few plains and deltas.' },
        { text: 'Most of the people moved there in the last hundred years', why: 'These have been among the most populous parts of the world for at least two thousand years.' },
      ],
      explain: 'Mountains make rivers, rivers make plains, the monsoon waters them, and rice turns water and warmth into more food per hectare than almost any other crop. Between them, China and India have held a third or more of humanity for most of the last two thousand years.',
    },
  ],
  recap: [
    'About eight billion people share the Earth, very unevenly: about six in ten live in Asia, and more than half of everyone lives inside one circle around South and East Asia.',
    'People cluster where there is water, warmth, soil and trade: river plains, deltas, fertile islands and coasts. Deserts, ice, high mountains, dense rainforest and the far north are nearly empty.',
    '**Density** (people per km²) is not the same as population: Bangladesh and Russia have similar numbers of people on very different amounts of land.',
    'Most people now live in towns and cities, and there are more than thirty **megacities** of over ten million.',
  ],
  next: 'Next: the last layer of the map. Eight billion people, about two hundred countries. Who drew the lines between them?',
};
