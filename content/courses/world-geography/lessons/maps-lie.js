// The World at a Glance · Lesson 2 · Every Map Lies
//
// Driving question: why does Greenland look as big as Africa on so many maps, and can any flat map tell the truth?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-geography/index.js';
import { countryInfo } from '../../../../src/widgets/world-map.js';
import { AREAS, SIZE_PAIRS, areaThing, BIG_COUNTRIES, EVENTS, theName, capital, compassOnPage } from '../helpers.js';

const PAIR = [{ ids: ['GL'], color: 'blue', label: 'Greenland' }, { ids: 'africa', color: 'orange', label: 'Africa' }];
const TIMES = Math.round(AREAS.africa / AREAS.GL);          // 14

// The air route of the "rhumb" step. Lengths in km, rounded to the nearest hundred (the test recomputes them).
const ROUTE = { from: 'London', to: 'Los Angeles', greatCircle: 8800, rhumb: 9700 };

// The centre of the Pacific-centred map of the "recentred" step. Its page is cut at 30° W, so on it India lies to the left
// (west) of the United States: directions in the feedback are read off that page (compassOnPage).
const PAGE_CENTRE = 150;

// The big countries of the "recentred" step, grouped by part of the world for the teaching screen in front of it
// (the map's own data counts all of Russia with Europe; most of it lies in Asia).
const BIG_GROUPS = [
  ['North America', 'north-america'], ['South America', 'south-america'], ['Africa', 'africa'],
  ['Europe and Asia', 'europe'], ['Asia', 'asia'], ['Oceania', 'oceania'],
].map(([label, id]) => [label, BIG_COUNTRIES.filter((code) => countryInfo(code).continent === id)]).filter(([, ids]) => ids.length);

export default {
  id: 'maps-lie',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A familiar map',
      text: `
        You have seen this world map a thousand times: on classroom walls, in news reports, on your phone.

        On it, [Greenland]{.blue} looks about as big as [Africa]{.orange}. In reality, **how many Greenlands would fit inside Africa?**
      `,
      figure: { type: 'world-map', projection: 'mercator', regions: PAIR, zoom: false, alt: 'A world map in the Mercator projection. Greenland, near the top, is drawn about as large as Africa.' },
      min: 1, max: 20, step: 1, start: 1,
      answer: TIMES, tolerance: 2,
      explain: `
        About **${TIMES}**. Africa covers about 30.4 million km²; Greenland about 2.2 million.

        Africa is big enough to hold the United States, China and India at the same time, with room to spare. This map is hiding that from you. The question is why.
      `,
    },
    {
      id: 'globe',
      type: 'interact',
      graded: false,          // an exploration: the point is to see Greenland's true size, and the rule is named on the next screen
      title: 'Ask a globe',
      text: `
        A globe is the one honest map: a small copy of the real thing, with nothing stretched. [Africa]{.orange} is facing you.

        **Drag the globe round until you find Greenland, then tap it.**
      `,
      widget: {
        type: 'world-map', projection: 'orthographic', center: [30, -12], mode: 'pick', maxWidth: 440,
        regions: [{ ids: 'africa', color: 'orange', label: 'Africa' }], dim: false, legend: false, answer: 'GL',
        alt: 'A globe that can be turned. Africa is highlighted and faces the viewer; no names are shown.',
      },
      check: (s) => s.picked === 'GL' || (s.picked ? `That is ${theName(s.name)}. Greenland is the big island north-east of Canada: turn the globe towards the North Pole.` : 'Turn the globe by dragging it, then tap Greenland.'),
      solution: { picked: 'GL' },
      hints: ['Drag downwards to bring the far north into view. Greenland lies between Canada and Iceland.'],
      explain: `
        On the globe Greenland is a modest island, roughly the size of Saudi Arabia, and Africa is a giant.

        So the flat map stretched something. But a globe does not fit in a pocket or on a page, so we keep making flat maps.
      `,
    },
    {
      id: 'why',
      type: 'info',
      title: 'You cannot flatten a ball',
      text: `
        Try to press the peel of an orange flat: it tears, or it has to stretch. In the 1820s the mathematician Carl Friedrich Gauss proved that there is no way round this. **Every flat map of a round world distorts something**: sizes, shapes, distances or directions.

        The recipe a mapmaker uses to get from the ball to the page is a **projection**.

        Compare the grid lines. On the globe the north–south lines meet at the poles. This map draws them parallel, so the far north must be pulled wide.
      `,
      figure: [
        { type: 'world-map', projection: 'orthographic', center: [-30, 35], graticule: 30, maxWidth: 250, zoom: false, caption: 'Globe: the lines meet at the pole', alt: 'A globe with grid lines every 30 degrees. The north–south lines come together at the North Pole.' },
        { type: 'world-map', projection: 'mercator', graticule: 30, maxWidth: 330, zoom: false, caption: 'Mercator: the same lines, drawn parallel', alt: 'A Mercator world map with grid lines every 30 degrees. The north–south lines are parallel and never meet; the east–west lines are spaced further and further apart towards the top and bottom.' },
      ],
    },
    {
      id: 'stretch',
      type: 'numeric',
      title: 'The stretch, in numbers',
      text: `
        On the globe, the circle of latitude 60° N (through Oslo, St Petersburg and the southern tip of Greenland) is exactly **half** as long as the Equator.

        Mercator's map draws it just as long as the Equator: everything there is stretched to **twice** its width. To keep shapes right, the map stretches it to twice its height as well.

        **How many times too large do areas at 60° N appear?**
      `,
      answer: 4,
      unit: 'times too large',
      wrong: [[2, 'That is the stretch in one direction. Area is width times height, and both are doubled.']],
      hints: ['A square that becomes twice as wide and twice as tall covers how many of the original squares?'],
      explain: `
        $2 \\times 2 = 4$. And it gets worse fast: in northern Greenland, at 75° N, areas are drawn about 15 times too large. At the poles the stretch would be infinite, which is why this kind of map never shows them.
      `,
    },
    {
      id: 'mercator-map',
      type: 'choice',
      title: 'A map with a job',
      text: `
        This is where the familiar map comes from: the Flemish mapmaker Gerardus Mercator published it in ${EVENTS.mercator.year}. Its title says it is made *ad usum navigantium*.

        Look at the oceans. They are criss-crossed by straight lines fanning out from compass roses. **Who was this map made for?**
      `,
      figure: photo(MEDIA['mercator-1569'], {
        alt: 'A very large old world map on many sheets, crowded with Latin text panels. Straight lines radiate across the seas from star-shaped compass roses. The lands in the far north are drawn enormous.',
        caption: `Gerardus Mercator, world map, ${EVENTS.mercator.year}`,
        creditLabel: 'Map',
      }),
      options: [
        { text: 'Sailors steering by compass', correct: true },
        { text: 'Rulers comparing the sizes of their lands', why: 'It would have served them badly: this map gets sizes wrong, and more wrong the further north you look.' },
        { text: 'Pilgrims travelling overland', why: 'The lines run across the seas, not along roads, and there is no route to any shrine marked.' },
        { text: 'Astronomers charting the stars', why: 'It is a map of the Earth. The star-shaped figures are compass roses.' },
      ],
      explain: `
        *Ad usum navigantium* means "for the use of navigators". The straight lines across the seas are courses for ships. (The ocean voyages the map was made for are the subject of *One World*.)
      `,
    },
    {
      id: 'teach-mercator',
      type: 'info',
      title: 'What Mercator\'s map is good at',
      text: `
        On Mercator's map a course on one steady compass bearing is a **straight line**. A navigator rules a line from port to port, reads off the angle, and steers by it all the way. The map can do this because it keeps **angles and shapes** true at every point.

        The price is paid in **size**, and Mercator knew it: the further from the Equator, the more his map swells the land. For a sailor that did not matter. It began to matter when his sea chart became everybody's picture of the world.
      `,
      figure: {
        type: 'world-map', projection: 'mercator', view: [-100, 5, 10, 55], graticule: 15, zoom: false, legend: false, dots: false,
        markers: [{ at: 'Lisbon', label: 'Lisbon', labelPos: 'top' }, { at: 'Havana', label: 'Havana', labelPos: 'bottom' }],
        lines: [{ points: ['Lisbon', 'Havana'], curve: 'rhumb', color: 'blue', width: 3, arrow: true }],
        caption: 'One bearing all the way: the course crosses every north–south line at the same angle',
        alt: 'A Mercator map of the North Atlantic with a grid of lines. A straight course runs from Lisbon, in Portugal, south-west to Havana, in Cuba, and crosses every north–south grid line at the same angle.',
      },
    },
    {
      id: 'rhumb',
      type: 'choice',
      stretch: true,
      text: `
        Two routes from ${ROUTE.from} to ${ROUTE.to}, drawn on a Mercator map. The [blue]{.blue} one is a straight line on this map: one compass bearing all the way. The [red]{.red} one curves up over Greenland. Remember what this map does to the far north.

        **Which is really the shorter way?**
      `,
      figure: {
        type: 'world-map', projection: 'mercator', view: [-135, 15, 15, 75],
        markers: [{ at: ROUTE.from, label: ROUTE.from, labelPos: 'right' }, { at: ROUTE.to, label: ROUTE.to, labelPos: 'bottom' }],
        lines: [
          { points: [ROUTE.from, ROUTE.to], curve: 'rhumb', color: 'blue', label: 'One steady compass bearing' },
          { points: [ROUTE.from, ROUTE.to], curve: 'great-circle', color: 'red', label: 'The curved route' },
        ],
        alt: `A Mercator map of the North Atlantic and North America with two routes from ${ROUTE.from} to ${ROUTE.to}: a straight one across the ocean and the United States, and one that bends north over Greenland and Canada.`,
      },
      shuffle: false,
      options: [
        { text: 'The straight blue route', why: 'It is straight only on this map, and this map stretches the north. On a globe the blue route is the one that bends.' },
        { text: 'The curved red route', correct: true },
        { text: 'They are the same length', why: `They differ by about ${ROUTE.rhumb - ROUTE.greatCircle} km.` },
      ],
      explain: `
        The red route is about ${ROUTE.greatCircle.toLocaleString('en-US')} km; the blue one about ${ROUTE.rhumb.toLocaleString('en-US')} km. Stretch a string between the two cities on a globe and it follows the red line. That is why airliners from Europe to California fly over Greenland.

        Sailing ships took the longer way on purpose: one bearing is far easier to steer.
      `,
    },
    {
      id: 'recipes',
      type: 'match',
      title: 'Other recipes',
      text: `
        Mercator's is one projection among hundreds. Here are two that keep **areas** true instead. Greenland and Africa are coloured as before.

        **Match each kind of map with what it does.**
      `,
      figure: [
        { type: 'world-map', projection: 'gall-peters', regions: PAIR, legend: false, zoom: false, maxWidth: 230, caption: 'Gall–Peters', alt: 'A world map in the Gall–Peters projection. Africa is long and narrow and far larger than Greenland, which is squashed flat at the top.' },
        { type: 'world-map', projection: 'equal-earth', regions: PAIR, legend: false, zoom: false, maxWidth: 290, caption: 'Equal Earth', alt: 'A world map in the Equal Earth projection, with curved sides. Africa is far larger than Greenland and both keep natural-looking shapes.' },
      ],
      pairs: [
        ['Mercator', 'Directions true, sizes wrong'],
        ['Gall–Peters', 'Sizes true, shapes pulled tall'],
        ['Equal Earth', 'Sizes true, shapes gentler'],
        ['A globe', 'All true, but half is hidden'],
      ],
      explain: 'On both of these maps Africa is plainly far larger than Greenland: they keep sizes honest and pay with shape. Mercator does the opposite, and only a globe gets everything right.',
    },
    {
      id: 'teach-equal-area',
      type: 'info',
      title: 'Equal-area maps',
      text: `
        A map that keeps sizes true is called an **equal-area** map. You have just seen two.

        - **Gall–Peters**: James Gall presented it in ${EVENTS.gall.year}, and Arno Peters made it famous in the 1970s.
        - **Equal Earth**: published in ${EVENTS.equalEarth.year}. Most world maps in this course use it.

        No projection is "the right one". Each is a choice about what matters for the job in hand: true directions for steering, true sizes for comparing.
      `,
      figure: {
        type: 'timeline', from: 1500, to: 2050, step: 100, showYears: true,
        events: [
          { year: EVENTS.mercator.year, label: 'Mercator\'s map for sailors', short: 'Mercator', color: 'blue' },
          { year: EVENTS.gall.year, label: 'Gall\'s equal-area map', short: 'Gall', color: 'orange' },
          { year: EVENTS.equalEarth.year, label: 'Equal Earth', short: 'Equal Earth', color: 'orange' },
        ],
        alt: `A timeline from 1500 to 2050 with three events: Mercator's map for sailors in ${EVENTS.mercator.year}, James Gall's equal-area map in ${EVENTS.gall.year} and the Equal Earth projection in ${EVENTS.equalEarth.year}.`,
      },
    },
    {
      id: 'true-size',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const [polar, tropical] = rng.pick(SIZE_PAIRS);
        const a = areaThing(polar);
        const b = areaThing(tropical);
        const bigger = AREAS[polar] > AREAS[tropical] ? a : b;
        const ratio = Math.max(AREAS[polar], AREAS[tropical]) / Math.min(AREAS[polar], AREAS[tropical]);
        const times = ratio >= 10 ? `about ${Math.round(ratio)} times` : ratio >= 2.25 ? `about ${Math.round(ratio * 2) / 2} times` : ratio >= 1.9 ? 'about twice' : ratio >= 1.65 ? 'nearly twice' : 'about one and a half times';
        const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
        const verb = (thing) => (thing.ids.length > 1 && thing.name.includes('together') ? 'are' : 'is');
        return {
          text: `The first map is Mercator's, which swells everything far from the Equator. The second is Equal Earth, an equal-area map. **Which is really larger: [${a.name}]{.blue} or [${b.name}]{.orange}?**`,
          // Two maps of the same pair: the learner has to know which one to trust for sizes, and read it.
          figure: [
            {
              type: 'world-map', projection: 'mercator', zoom: false, maxWidth: 250, caption: 'Mercator',
              regions: [{ ids: a.ids, color: 'blue', label: cap(a.name) }, { ids: b.ids, color: 'orange', label: cap(b.name) }],
              alt: `A Mercator world map with ${a.name} highlighted in blue and ${b.name} in orange.`,
            },
            {
              type: 'world-map', projection: 'equal-earth', zoom: false, maxWidth: 330, legend: false, caption: 'Equal Earth',
              regions: [{ ids: a.ids, color: 'blue', label: cap(a.name) }, { ids: b.ids, color: 'orange', label: cap(b.name) }],
              alt: `An Equal Earth world map, which keeps sizes true, with ${a.name} highlighted in blue and ${b.name} in orange.`,
            },
          ],
          shuffle: false,
          options: [
            { text: cap(a.name), correct: bigger === a },
            { text: cap(b.name), correct: bigger === b },
            { text: 'They are about the same size', why: `Not close: ${bigger.name} ${verb(bigger)} ${times} as large.` },
          ],
          explain: bigger === b
            ? `${cap(b.name)} ${verb(b)} ${times} as large as ${a.name} (about ${fmtArea(AREAS[tropical])} against ${fmtArea(AREAS[polar])}). ${cap(a.name)} ${verb(a)} much further from the Equator, so Mercator's map inflates ${a.ids.length > 1 ? 'them' : 'it'} far more. The equal-area map shows the true sizes.`
            : `${cap(a.name)} really ${verb(a)} larger: ${times} the size of ${b.name} (about ${fmtArea(AREAS[polar])} against ${fmtArea(AREAS[tropical])}). Mercator's map exaggerates the difference, but it does not always turn the order round. The equal-area map shows the true sizes.`,
        };
      },
    },
    {
      id: 'teach-big-countries',
      type: 'info',
      title: 'Sixteen giants to know',
      text: `
        Maps are easier to read once a few shapes are familiar. Here are sixteen of the largest countries, each big enough to find on any world map. **Tap a country** to check its name. You will keep meeting them.

        | Part of the world | Big countries |
        |---|---|
        ${BIG_GROUPS.map(([label, ids]) => `| ${label} | ${ids.map((id) => countryInfo(id).name).join(', ')} |`).join('\n        ')}
      `,
      figure: {
        type: 'world-map', legend: false,
        regions: [{ ids: BIG_COUNTRIES, color: 'blue', label: 'Sixteen of the largest countries' }],
        labels: BIG_COUNTRIES,
        alt: `A world map with sixteen large countries highlighted and named: ${BIG_COUNTRIES.map((id) => countryInfo(id).name).join(', ')}.`,
      },
    },
    {
      id: 'recentred',
      type: 'interact',
      review: true,
      title: 'Whose middle?',
      gen: (rng) => {
        const id = rng.pick(BIG_COUNTRIES);
        const target = countryInfo(id);
        return {
          text: `
            What sits in the middle of a world map is a choice too. This one is centred on the Pacific, as many maps printed in East Asia and Australia are. It is the same world.

            **Tap ${theName(target.name)}.**
          `,
          widget: { type: 'world-map', center: PAGE_CENTRE, mode: 'pick', answer: id, alt: 'A world map centred on the Pacific Ocean, without names: Asia and Australia are left of the middle, the Americas on the right, Europe and Africa at the far left.' },
          check: (s) => s.picked === id || (s.picked ? `That is ${theName(s.name)}. On this map, ${theName(target.name)} is to the ${compassOnPage(countryInfo(s.picked).center, target.center, PAGE_CENTRE)} of it.` : false),
          solution: { picked: id },
          hints: [`${capital(theName(target.name))} is in ${{ africa: 'Africa: at the far left of this map', asia: 'Asia: left of the middle', europe: 'Europe and northern Asia: along the top left', 'north-america': 'North America: on the right-hand side', 'south-america': 'South America: at the lower right', oceania: 'Oceania: just below and left of the middle' }[target.continent]}.`],
          explain: `No law says the Atlantic must be in the middle. Mapmakers tend to put their own part of the world at the centre: a Pacific-centred map simply stops cutting the Pacific in two.`,
        };
      },
    },
    {
      id: 'which-way-up',
      type: 'choice',
      title: 'Which way is up?',
      text: `
        In ${EVENTS.idrisi.year} the geographer Muhammad al-Idrisi finished a great map of the known world for King Roger II of Sicily, after years of questioning travellers. This is a modern copy, pieced together from the seventy sheets of his atlas.

        The large sea on the right is the Mediterranean. The long river that runs down the page into it, from the mountains at the top, is the Nile, and the Nile flows north. **Which direction is at the top of this map?**
      `,
      figure: photo(MEDIA['tabula-rogeriana'], {
        alt: 'A wide old map with yellow land and dark blue seas, crowded with rivers, mountain chains and tiny labels. A large sea dotted with islands fills the middle of the right-hand half. Above it lies a broad land, crossed by a long river that runs from the top edge down to that sea.',
        caption: `Al-Idrisi's world map of ${EVENTS.idrisi.year}, in a copy made in the 1920s`,
        creditLabel: 'Map',
      }),
      options: [
        { text: 'South', correct: true },
        { text: 'North', why: 'Then the Nile would be flowing south, away from the Mediterranean. It flows north, into it.' },
        { text: 'East', why: 'Then the Nile, which flows north, would run across the page from side to side.' },
        { text: 'West', why: 'Then the Nile, which flows north, would run across the page from side to side.' },
      ],
      explain: `
        The Nile flows north and down the page, so north is at the bottom and **south is at the top**, as on many maps made by Muslim scholars of that age. The land above the Mediterranean is Africa; Europe hangs below it. Turn the map upside down and everything falls into place.

        European maps of the time often put **east** on top. The Latin for east is *oriens*, which is why we still "orient" ourselves. North-up is a habit, not a fact about the planet: in space there is no up.
      `,
    },
    {
      id: 'phone',
      type: 'fill',
      review: true,
      title: 'The map in your pocket',
      text: `Online maps adopted a version of Mercator's projection in ${EVENTS.webMercator.year}, and most still use it, for a good reason. **Complete the explanation.**`,
      template: `
        Zoomed in on a town, a Mercator map keeps [[*shapes and directions|areas|distances between continents]] true, so a square building looks square and north is always up.

        Zoomed out to the whole world, it shows lands near the [[*poles|Equator]] far too [[*large|small]].
      `,
      explain: `
        Mercator's projection keeps angles true at every point, which is what you need to follow streets, as sailors needed it to follow a bearing. Zoomed out, the old flaw returns: Greenland swells.

        Some map apps now switch to a globe when you zoom all the way out.
      `,
    },
    {
      id: 'order',
      type: 'order',
      title: 'Nine centuries of world maps',
      text: `You have met all six of these moments. (The astronauts' photograph is the one that opened lesson 1, taken in ${EVENTS.blueMarble.year}.) Put them in order, **earliest first**.`,
      items: [
        EVENTS.idrisi.label,
        EVENTS.mercator.label,
        EVENTS.gall.label,
        'Astronauts photograph the whole Earth',
        EVENTS.webMercator.label,
        EVENTS.equalEarth.label,
      ],
      labels: ['Earliest', 'Latest'],
      hints: ['Mercator made his map for sailing ships. Equal-area maps were an answer to it.', 'The photograph from space came before online maps.'],
      explain: `
        Al-Idrisi ${EVENTS.idrisi.year}; Mercator ${EVENTS.mercator.year}; James Gall's equal-area map ${EVENTS.gall.year} (Arno Peters made it famous in the 1970s); the Apollo 17 photograph ${EVENTS.blueMarble.year}; online maps on a Mercator grid ${EVENTS.webMercator.year}; Equal Earth ${EVENTS.equalEarth.year}.

        A map made for sailors in the age of sail still shapes the picture of the world in most people's heads.
      `,
    },
    {
      id: 'choose',
      type: 'bucket',
      review: true,
      text: 'Every projection is a choice. **Which kind of map suits each job?**',
      buckets: ['Mercator: true directions', 'Equal-area: true sizes'],
      items: [
        ['Steering a ship on one compass bearing', 0],
        ['Following streets on a phone', 0],
        ['Comparing the sizes of two countries', 1],
        ['Showing how much of the world is desert', 1],
        ['Mapping where the rainforests are shrinking', 1],
        ['Reading the angle of a coastline at sea', 0],
      ],
      explain: 'Use Mercator when angles and directions matter, close up or at sea. Use an equal-area map whenever the map is meant to show *how much* of something there is. And when you see a world map, ask what it was made for.',
    },
  ],
  recap: [
    'A round surface cannot be flattened without distortion: every flat map stretches sizes, shapes, distances or directions.',
    `Mercator's projection (${EVENTS.mercator.year}) keeps compass directions true for sailors and swells everything far from the Equator: Greenland looks as big as Africa, which is really about ${TIMES} times larger.`,
    'Equal-area maps keep sizes true and bend shapes instead. Only a globe gets everything right.',
    'What is in the middle and which way is up are conventions too. Always ask what a map was made for.',
  ],
  next: 'Next: how do you tell someone exactly where a place is? Two numbers will do. One of them was easy to find; the other took a clockmaker forty years.',
};

/** 2166 (thousand km²) → '2.2 million km²'; 587 → '590,000 km²'. */
function fmtArea(thousandKm2) {
  if (thousandKm2 >= 1000) return `${(Math.round(thousandKm2 / 100) / 10).toFixed(1)} million km²`;
  return `${(Math.round(thousandKm2 / 10) * 10).toLocaleString('en-US')},000 km²`;
}
