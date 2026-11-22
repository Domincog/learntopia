// The World at a Glance · Lesson 1 · Seven Continents, Five Oceans
//
// Driving question: seen whole, how much of the planet is land, where is it, and who decided where
// one continent stops and the next begins?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-geography/index.js';
import { countryInfo } from '../../../../src/widgets/world-map.js';
import {
  CONTINENTS, continent, continentsAt, CONTINENT_COUNTRIES, OCEANS, ocean, EQUATOR_AFRICA, EVENTS,
  LAND_SHARE, LAND_AREA, NORTH_LAND_SHARE, countryName, compassOnPage, listText, theName, theCountry, capital,
} from '../helpers.js';

const CONTINENT_MAP = {
  type: 'world-map',
  regions: [
    ...CONTINENTS.map((c) => ({ ids: c.id, color: c.color, label: c.name })),
    { ids: ['RU'], color: 'gray', label: 'Russia (partly in Europe, mostly in Asia)' },
  ],
  lines: [{ points: [[68, 68.5], [60, 65], [59.5, 60], [59, 55], [58.5, 51.5], [55, 51], [51.5, 47]], curve: 'straight', color: 'blue', dashed: true, width: 3 }],
  continents: true,
  legend: false,
};

const eventAt = (key, extra = {}) => ({ year: EVENTS[key].year, label: EVENTS[key].label, ...extra });

export default {
  id: 'continents-oceans',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'The whole Earth in one picture',
      text: `
        On 7 December 1972 the crew of Apollo 17, on their way to the Moon, pointed a camera back at home and took this photograph.
        Africa is in the upper half; the white cap at the bottom is Antarctica.

        Before anyone tells you: **what share of the Earth's surface do you think is land?**
      `,
      figure: photo(MEDIA['blue-marble'], {
        alt: 'The whole Earth as a blue ball against black space. A large tan and green landmass fills the upper half, white clouds swirl over dark blue ocean, and the bottom is covered by a white cap of ice.',
        caption: 'Earth from Apollo 17, about 29,000 km away, 1972',
      }),
      min: 0, max: 100, step: 1, start: 50, unit: '%',
      answer: LAND_SHARE, tolerance: 6,
      explain: `
        About **${LAND_SHARE}%**. Seen whole, Earth is a water planet: ocean covers the other ${100 - LAND_SHARE}%.

        This famous view even flatters the land a little, because Africa, the second-largest continent, happens to sit in the middle of it.
      `,
    },
    {
      id: 'how-many',
      type: 'info',
      title: 'Five, six or seven?',
      text: `
        A **continent** is one of the great landmasses of the Earth. How many are there? That depends on where you went to school.

        - **Seven** in most English-speaking countries, China, India and much of the world.
        - **Six** in much of Latin America and southern Europe (one America), and in Russia and Japan (one Eurasia).
        - **Five** on the Olympic flag: one ring for each inhabited part of the world.

        None of these is a mistake. Nature made the land; **people** drew the lines. This course counts seven, and shows you where the seams are.
      `,
      figure: {
        type: 'world-map', zoom: false, legend: false, maxWidth: 460,
        regions: [
          { ids: ['europe', 'asia'], color: 'green', label: 'Eurasia' },
          ...CONTINENTS.filter((c) => c.id !== 'europe' && c.id !== 'asia').map((c) => ({ ids: c.id, color: c.color, label: c.name })),
        ],
        caption: 'One way of counting six: a single Eurasia',
        alt: 'A world map coloured as six continents: Europe and Asia share one colour, and North America, South America, Africa, Oceania and Antarctica each have their own.',
      },
    },
    {
      id: 'seven',
      type: 'info',
      title: 'Seven continents, by convention',
      text: `
        Here are the usual seven. Tap any country to see its name. (The speck of Europe's colour in South America is French Guiana, a part of France.)

        Look at the seams. **Europe** and **Asia** are one unbroken landmass, **Eurasia**: the dashed line along the Ural Mountains is a convention, not a coast (the habit of counting two continents goes back to the ancient Greeks), and Russia lies on both sides of it.

        The seventh continent is Australia. With New Zealand, New Guinea and the Pacific islands, the wider region is called **Oceania**.
      `,
      figure: { ...CONTINENT_MAP, alt: 'A world map with each continent in its own colour and its name printed on it: North America, South America, Europe, Africa, Asia, Oceania and Antarctica. Russia has a colour of its own, and a dashed line along the Ural Mountains divides Europe from Asia.' },
    },
    {
      id: 'place-continent',
      type: 'interact',
      review: true,
      title: 'Pin it',
      gen: (rng) => {
        const c = rng.pick(CONTINENTS);
        return {
          text: `This map has no names and no borders: only the outlines of the land. **Place the pin anywhere on ${c.name}.** Drag it, or tap the map.`,
          widget: {
            type: 'world-map', mode: 'place', borders: false, pin: { label: c.name, color: 'red' },
            alt: 'A world map without borders or names: only the outlines of the land',
          },
          check: (s) => {
            if (!s.placed) return 'Move the pin first: drag it, or tap the map.';
            if (!s.country) return `That is in the sea. ${c.name} is to the ${compassOnPage(s.pin, c.pin)} of your pin.`;
            const here = continentsAt(s.country, s.pin);
            if (here.includes(c.id)) return true;
            const where = here.length ? ` (${continent(here[0]).name})` : '';
            return `Your pin is in ${theCountry(s.country)}${where}. ${c.name} is to the ${compassOnPage(s.pin, c.pin)} of it.`;
          },
          solution: { pin: c.pin },
          hints: [c.where],
          explain: c.fact,
        };
      },
    },
    {
      id: 'chart',
      type: 'multi',
      title: 'How big are they?',
      text: 'The seven are far from equal. The chart shows the area of each continent in millions of square kilometres, largest first. **Which of these statements are true?**',
      figure: {
        type: 'bars', yMax: 50, yStep: 10, yLabel: 'million km²',
        data: CONTINENTS.map((c) => ({ label: c.name.replace('North ', 'N. ').replace('South ', 'S. '), value: c.area, color: c.color })),
        alt: `A bar chart of continent areas in millions of square kilometres: ${CONTINENTS.map((c) => `${c.name} ${c.area}`).join(', ')}.`,
      },
      options: [
        { text: 'Asia is larger than Africa and Europe put together', correct: true },
        { text: 'Africa is about three times the size of Europe', correct: true },
        { text: 'Antarctica is larger than Europe', correct: true },
        { text: 'South America is larger than North America', why: 'North America, with Greenland and Central America, is about 24.7 million km²; South America is about 17.8.' },
        { text: 'Europe is the smallest continent', why: 'Europe is second smallest. Australia, even with the islands of Oceania added, is smaller.' },
      ],
      explain: 'Asia (44.6) beats Africa plus Europe (30.4 + 10.2 = 40.6). Africa is three Europes, and even icy Antarctica (14.2) is larger than Europe (10.2).',
    },
    {
      id: 'oceans',
      type: 'info',
      title: 'One ocean, five names',
      text: `
        All the sea water on Earth is joined: a ship can sail from any ocean to any other. By convention we divide it into five. Find each name on the map (the Pacific appears twice, because this map cuts it in two).

        | Ocean | Share of all ocean |
        |-------|-------------------:|
        ${OCEANS.map((o) => `| ${o.name.replace(' Ocean', '')} | ${o.share}% |`).join('\n        ')}

        The **Southern Ocean**, the ring of cold water around Antarctica, is the newest name on the list. Many mapmakers began to mark it only in this century.
      `,
      figure: { type: 'world-map', oceans: true, alt: 'A world map with the names of the five oceans printed on the water: the Pacific on both the left and right sides, the Atlantic in the middle, the Indian Ocean below Asia, the Arctic Ocean at the top and the Southern Ocean along the bottom.' },
    },
    {
      id: 'pacific',
      type: 'choice',
      title: 'The other side',
      text: `
        Here is the planet from another side. **Drag the globe** to turn it, then turn it back. This side is almost all one ocean, the **Pacific**.

        Work it out: ocean covers ${100 - LAND_SHARE}% of the planet and land ${LAND_SHARE}%, and the Pacific is nearly half (${ocean('pacific').share}%) of all the ocean. **How does the Pacific compare with all the land on Earth put together?**
      `,
      figure: {
        type: 'world-map', projection: 'orthographic', center: [-160, 0], maxWidth: 400,
        labels: [{ at: [-150, 5], text: 'Pacific Ocean', style: 'water' }],
        alt: 'A globe turned so that the Pacific Ocean fills almost the whole visible side. Only the edges of Asia, Australia and the Americas show around the rim.',
      },
      shuffle: false,
      options: [
        { text: 'It is about a third of the size of the land', why: `The Pacific is about a third of the whole *planet*, and the land is only ${LAND_SHARE}% of the planet.` },
        { text: 'It is about half the size of the land', why: `It is nearly half of the *ocean*. The ocean is ${100 - LAND_SHARE}% of the planet, so that is about a third of the planet: more than the ${LAND_SHARE}% that is land.` },
        { text: 'It is larger than all the land put together', correct: true },
      ],
      hints: [`Half of ${100 - LAND_SHARE}% would be about 35% of the planet. Is the Pacific's share more or less than the land's ${LAND_SHARE}%?`],
      explain: `
        The Pacific covers about ${ocean('pacific').area} million km², a third of the planet. All the land together is about ${LAND_AREA} million.

        Its name is Ferdinand Magellan's: in ${EVENTS.pacificNamed.year}, after a stormy passage round South America, he met calm water and called it *Mar Pacífico*, the peaceful sea. The peoples of the Pacific islands had been sailing it for thousands of years by then. You will meet them in *First Worlds*.
      `,
    },
    {
      id: 'find-ocean',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const target = rng.pick(OCEANS);
        const markers = rng.shuffle(OCEANS).map((o) => ({ id: o.id, at: rng.pick(o.spots), label: o.name, color: 'red' }));
        const letter = (id) => 'ABCDE'[markers.findIndex((m) => m.id === id)];
        return {
          text: `Five markers, five oceans. **Tap the marker in the ${target.name}.**`,
          widget: {
            type: 'world-map', mode: 'pickMarker', markerLabels: 'after', answer: target.id, markers,
            alt: 'A world map without names. Five lettered markers stand in the sea, one in each ocean.',
          },
          check: (s) => s.picked === target.id || (s.picked ? `Marker ${letter(s.picked)} is in the ${ocean(s.picked).name}.` : false),
          solution: { picked: target.id },
          hints: [{
            pacific: 'It is the huge ocean between Asia and the Americas. On this map it is cut in two by the edges.',
            atlantic: 'It lies between the Americas on the west and Europe and Africa on the east.',
            indian: 'It is bounded by Africa, southern Asia and Australia.',
            southern: 'It rings Antarctica, at the very bottom of the map.',
            arctic: 'It surrounds the North Pole, at the very top of the map.',
          }[target.id]],
          explain: target.fact,
        };
      },
    },
    {
      id: 'sizes',
      type: 'order',
      review: true,
      text: 'Put the seven continents in order of area, **largest first**.',
      items: CONTINENTS.map((c) => (c.id === 'oceania' ? 'Australia (with Oceania)' : c.name)),
      labels: ['Largest', 'Smallest'],
      hints: ['Asia is first and Africa second: Africa is larger than many maps make it look.', 'Antarctica is bigger than Europe. The smallest is Australia.'],
      explain: `
        In millions of square kilometres, roughly: ${CONTINENTS.map((c) => `${c.id === 'oceania' ? 'Australia with Oceania' : c.name} ${c.area}`).join(', ')}.

        Europe, which looms so large in many history books, is the second smallest.
      `,
    },
    {
      id: 'equator',
      type: 'interact',
      title: 'The line round the middle',
      text: `
        The **Equator** is an imaginary line around the middle of the Earth, halfway between the poles. It splits the planet into a **Northern** and a **Southern Hemisphere** (a hemisphere is half a ball).

        **Tap any African country that the Equator crosses.**
      `,
      widget: { type: 'world-map', view: 'africa', mode: 'pick', parallels: ['equator'], pickable: ['africa'], answer: EQUATOR_AFRICA, alt: 'A map of Africa without names. The Equator is drawn as a line across the middle of the continent.' },
      check: (s) => {
        if (!s.picked) return false;
        if (EQUATOR_AFRICA.includes(s.picked)) return true;
        const box = countryInfo(s.picked).box;
        return `${capital(theName(s.name))} lies entirely ${box[1] > 0 ? 'north' : 'south'} of the line. Look for a country the line passes through.`;
      },
      solution: { picked: 'KE' },
      hints: ['Follow the line from the Atlantic coast, on the left, to the Indian Ocean.'],
      explain: `
        On the African mainland the Equator crosses ${listText(EQUATOR_AFRICA.filter((id) => id !== 'ST').map(countryName))}.

        Around the whole world it touches the land of only eleven countries: most of the line runs over ocean.
      `,
    },
    {
      id: 'north-heavy',
      type: 'slider',
      mode: 'predict',
      text: `
        Here is the Earth seen from above each pole. Drag the globes to explore.

        The land is not shared out evenly. **What share of all the land lies in the Northern Hemisphere?**
      `,
      figure: [
        { type: 'world-map', projection: 'orthographic', center: [0, 90], maxWidth: 260, zoom: false, caption: 'From above the North Pole', alt: 'A globe seen from above the North Pole: the Arctic Ocean in the middle, ringed by North America, Europe and Asia. Land fills much of the view.' },
        { type: 'world-map', projection: 'orthographic', center: [0, -90], maxWidth: 260, zoom: false, caption: 'From above the South Pole', alt: 'A globe seen from above the South Pole: Antarctica in the middle, surrounded by a wide ring of ocean. Only the tips of South America, Africa and Australia show at the rim.' },
      ],
      min: 0, max: 100, step: 1, start: 50, unit: '%',
      answer: NORTH_LAND_SHARE, tolerance: 7,
      explain: `
        About **two-thirds** (${NORTH_LAND_SHARE}%). The north has all of Europe and North America, nearly all of Asia and two-thirds of Africa. The Southern Hemisphere is about four-fifths water.

        Where the land is, the people are: nearly nine in every ten humans live north of the Equator.
      `,
    },
    {
      id: 'old-map',
      type: 'multi',
      title: 'What a map knows',
      text: `
        This world map was printed in ${EVENTS.america.year} by the German mapmaker Martin Waldseemüller, fifteen years after Columbus first crossed the Atlantic. It used the newest reports from sailors.

        Look at the land it shows. **Which of today's seven continents are missing altogether?**
      `,
      figure: photo(MEDIA.waldseemuller, {
        alt: 'An old printed world map in twelve sheets. Europe, Africa and Asia fill the middle and the right, drawn in recognisable shapes. At the far left a long, thin strip of land runs from top to bottom. Nothing is drawn where Australia or Antarctica lie.',
        caption: 'Martin Waldseemüller, world map, 1507 (Library of Congress)',
        creditLabel: 'Map',
      }),
      options: [
        { text: 'Australia', correct: true },
        { text: 'Antarctica', correct: true },
        { text: 'Africa', why: 'Africa is the large shape in the lower middle, and its outline is good: Portuguese ships had just sailed all the way round it.' },
        { text: 'Asia', why: 'Asia fills the right-hand half of the map, stretched far to the east.' },
        { text: 'The Americas', why: 'They are there: the long thin strip at the far left.' },
      ],
      explain: `
        No European had yet seen Australia or Antarctica, so the map leaves them out, although people had lived in Australia for more than 50,000 years.

        The thin strip on the left carries a new word. Waldseemüller named the land **America**, after the navigator Amerigo Vespucci, who had argued that it was not Asia but a "new world". The name stuck. A map shows what its makers knew, and whom they asked.
      `,
    },
    {
      id: 'when',
      type: 'interact',
      title: 'The last continent',
      text: `
        Two cards wait above the line. One is the first map with the name **America**: the map you have just looked at, printed fifteen years after Columbus's voyage. The other is the day a ship's crew first laid eyes on **Antarctica**, the only continent where nobody lived. That took more than three centuries longer.

        **Drag each card to its place.** Anywhere within 100 years counts.
      `,
      widget: {
        type: 'timeline', from: 1400, to: 2000, step: 100, snap: 10,
        events: [
          eventAt('columbus', { short: 'Columbus', color: 'gray' }),
          eventAt('australia', { short: 'Australia', color: 'gray' }),
          eventAt('blueMarble', { short: 'Blue Marble', color: 'gray' }),
        ],
        place: [
          { id: 'america', label: '"America" on a map', answer: EVENTS.america.year, color: 'red' },
          { id: 'antarctica', label: 'Antarctica first seen', answer: EVENTS.antarctica.year, color: 'teal' },
        ],
        alt: 'A timeline from 1400 to 2000 with three fixed events: Columbus crosses the Atlantic in 1492, a Dutch ship reaches Australia in 1606, and the Blue Marble photograph in 1972. Two cards are to be placed on it.',
      },
      check: (s) => {
        if (!s.complete) return 'Place both cards on the line.';
        const { america, antarctica } = s.placed;
        if (Math.abs(america - EVENTS.america.year) > 100) {
          return america < EVENTS.america.year
            ? 'The name "America" cannot be that old: it was coined only after Columbus crossed the Atlantic in 1492.'
            : 'The name "America" is older than that. It was printed within a few years of the first voyages.';
        }
        if (Math.abs(antarctica - EVENTS.antarctica.year) > 100) {
          return antarctica < EVENTS.antarctica.year
            ? 'Antarctica was seen much later than that: sailing ships had to push through pack ice to get near it.'
            : 'Antarctica was sighted earlier than that, in the age of sailing ships.';
        }
        return true;
      },
      solution: { placed: { america: 1510, antarctica: 1820 } },
      hints: ['The name America was coined soon after Columbus. Antarctica stayed unseen for more than three centuries after that.'],
      explain: `
        The name America dates from **${EVENTS.america.year}**. Antarctica was first sighted only in **${EVENTS.antarctica.year}**, by a Russian naval expedition, and within days by a British one.

        Every other continent had been home to people for many thousands of years. *First Worlds* tells how they got there.
      `,
    },
    {
      id: 'which-continent',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const ids = Object.keys(CONTINENT_COUNTRIES);
        const home = rng.pick(ids);
        const others = rng.sample(ids.filter((id) => id !== home), 3);
        // The map marks the countries in question, so the step asks for what the lesson taught (where each continent is),
        // not for the whereabouts of sixty-odd countries nobody has shown yet.
        const marked = (codes) => ({
          type: 'world-map', zoom: false, legend: false,
          regions: [{ ids: codes, color: 'red' }],
          markers: codes.map((id) => ({ at: countryInfo(id).center, label: countryName(id), color: 'red', size: 's' })),
          alt: `A world map without the names of the continents. ${codes.length > 1 ? `Four countries are marked and named: ${listText(codes.map(countryName).sort())}` : `One country is marked and named: ${countryName(codes[0])}`}.`,
        });
        if (rng.bool()) {
          const right = rng.pick(CONTINENT_COUNTRIES[home]);
          const wrong = others.map((id) => ({ code: rng.pick(CONTINENT_COUNTRIES[id]), id }));
          return {
            text: `Four countries are marked on the map. Which of these countries is in **${continent(home).name}**?`,
            figure: marked(rng.shuffle([right, ...wrong.map((w) => w.code)])),
            options: [
              { text: countryName(right), correct: true },
              ...wrong.map(({ code, id }) => ({ text: countryName(code), why: `${capital(theCountry(code))} is in ${continent(id).name}.` })),
            ],
            explain: `${capital(theCountry(right))} is in ${continent(home).name}. ${continent(home).fact}`,
          };
        }
        const code = rng.pick(CONTINENT_COUNTRIES[home]);
        return {
          text: `Find the marked country on the map. On which continent is **${theCountry(code)}**?`,
          figure: marked([code]),
          options: [{ text: continent(home).name, correct: true }, ...others.map((id) => ({ text: continent(id).name }))],
          explain: `${capital(theCountry(code))} is in ${continent(home).name}. ${continent(home).fact}`,
        };
      },
    },
  ],
  recap: [
    `Only about ${LAND_SHARE}% of the Earth's surface is land. One connected ocean covers the rest, and the Pacific alone is bigger than all the land together.`,
    'By the usual convention there are **seven continents** (from largest to smallest: Asia, Africa, North America, South America, Antarctica, Europe, Australia) and **five oceans** (Pacific, Atlantic, Indian, Southern, Arctic).',
    'The lines are human choices. Europe and Asia are one landmass, and other traditions count five or six continents.',
    'About two-thirds of the land, and nearly nine in ten people, are north of the Equator.',
  ],
  next: 'Next: the world map in this lesson was chosen with care. On many others Greenland looks as large as Africa. Why does every flat map lie?',
};
