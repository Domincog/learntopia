// The World at a Glance · Lesson 4 · Mountains, Rivers and Deserts
//
// Driving question: what puts the mountains, rivers and deserts where they are, and why do people crowd along the water?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-geography/index.js';
import {
  RANGES, range, RIVERS, OTHER_SEAS, DESERTS, WATERS, water, spreadMarkers, DEEP_TIME, CITY_RIVERS, continent,
  RING_OF_FIRE_WEST, RING_OF_FIRE_EAST, MID_ATLANTIC_RIDGE, GREAT_RIFT, howFarOff, theCountry, listText,
} from '../helpers.js';

const LETTERS = 'ABCDEFG';
const SCHOOL_RANGES = ['himalaya', 'andes', 'rockies', 'alps', 'atlas'].map(range);
const RANGE_LABEL_POS = { himalaya: 'bottom', andes: 'right', rockies: 'right', alps: 'top', atlas: 'left', urals: 'right', dividing: 'left' };
// Where the names of the seas of the river table are printed on its map (a point in open water for each sea of RIVERS).
const SEA_LABEL_AT = { 'Mediterranean Sea': [18, 34.5], 'Atlantic Ocean': [-32, 12], 'East China Sea': [126, 28], 'Gulf of Mexico': [-90, 25], 'Bay of Bengal': [89, 14], 'Black Sea': [34, 43.3] };
const RIVER_SEAS = [...new Set(RIVERS.map((r) => r.into))].map((sea) => [sea, SEA_LABEL_AT[sea]]);
const WATER_LABEL_POS = { mediterranean: 'bottom', 'black-sea': 'top', 'red-sea': 'left', caspian: 'right', 'arabian-sea': 'bottom', bengal: 'top', 'south-china': 'bottom', caribbean: 'bottom', 'gulf-mexico': 'bottom', 'great-lakes': 'right', hudson: 'top', baikal: 'top', victoria: 'bottom' };
/** Labelled markers for some of the seas (dots) and lakes (diamonds). */
const waterMarkers = (ids) => ids.map(water).map((w) => ({ at: w.at, label: w.name.replace(/^(Mediterranean|Caribbean) Sea$/, '$1'), shape: w.kind === 'lake' ? 'diamond' : 'dot', color: w.kind === 'lake' ? 'teal' : 'blue', size: 's', labelPos: WATER_LABEL_POS[w.id] }));

export default {
  id: 'land-and-water',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A river of light',
      text: `
        Astronauts took this photograph at night, looking down on north-east Africa. Every speck of light is a town or a village. The bright fan is the delta of the **Nile**, and the thin bright stem is the river's valley, winding away through the dark Sahara.

        Egypt is a large country, about twice the size of France. **What share of its people do you think live in the valley and delta of the Nile?**
      `,
      figure: photo(MEDIA['nile-night'], {
        alt: 'A night view of the Earth from the window of a space station. A bright triangular fan of lights opens towards a dark sea at the top. From its tip a winding ribbon of light runs down across otherwise dark, empty land. A few scattered lights line the coasts in the distance.',
        caption: 'The Nile delta and valley at night, 2010',
      }),
      min: 0, max: 100, step: 1, start: 50, unit: '%',
      answer: 95, tolerance: 6,
      explain: `
        About **95%**, on about a twentieth of the land. Where the water stops, Egypt stops.

        Mountains, rivers and deserts decide where people can live. This lesson is about where they are, and what puts them there.
      `,
    },
    {
      id: 'fit',
      type: 'info',
      title: 'A suspicious coastline',
      text: `
        A clue sat on every map for centuries. Look at the east coast of [South America]{.yellow} and the west coast of [Africa]{.orange}: they would fit together like two pieces of a puzzle.

        In 1912 the German scientist Alfred Wegener argued that the continents had once been joined and had drifted apart. That single great landmass is now called **Pangaea**; it began to break apart about ${DEEP_TIME[0].ago / 1e6} million years ago. Most geologists scoffed: what could move a continent?

        The answer lay under the sea. In the 1950s the American geologist **Marie Tharp**, mapping the Atlantic floor from ships' depth soundings, found a rift down the middle of it: the seam where the ocean is splitting and new sea floor is made. By the late 1960s the idea had won.
      `,
      figure: {
        type: 'world-map', view: [-95, -48, 45, 32], zoom: false, legend: false,
        // The unlabelled third group colours French Guiana, which the map draws as part of France (mainland France is outside this view).
        regions: [{ ids: 'south-america', color: 'yellow', label: 'South America' }, { ids: 'africa', color: 'orange', label: 'Africa' }, { ids: ['FR'], color: 'yellow' }],
        caption: 'The bulge of Brazil fits the hollow of West Africa',
        alt: 'A map of the South Atlantic with South America on the left and Africa on the right. The bulge of Brazil points at the hollow of the West African coast.',
      },
    },
    {
      id: 'plates',
      type: 'info',
      title: 'A cracked shell',
      text: `
        The Earth's outer shell is broken into about a dozen large **plates**, which creep along at a few centimetres a year, about as fast as your fingernails grow. Most of the action is at their edges.

        - Where plates **pull apart**, the crust splits: the [Mid-Atlantic Ridge]{.blue}, the [Great Rift Valley]{.orange} of East Africa.
        - Where an ocean plate **dives under** its neighbour, volcanoes rise and the ground shakes: the [Ring of Fire]{.red} around the Pacific has most of the world's volcanoes and about nine in ten of its earthquakes.
        - Where two continents **collide**, the crust crumples upwards: [India]{.violet}, pushing north, met Asia about ${DEEP_TIME[2].ago / 1e6} million years ago and raised the Himalaya.
      `,
      figure: {
        type: 'world-map', zoom: false,
        lines: [
          { points: RING_OF_FIRE_EAST, curve: 'straight', color: 'red', width: 3, label: 'Ring of Fire' },
          { points: RING_OF_FIRE_WEST, curve: 'straight', color: 'red', width: 3 },
          { points: MID_ATLANTIC_RIDGE, curve: 'straight', color: 'blue', width: 3, dashed: true, label: 'Mid-Atlantic Ridge' },
          { points: GREAT_RIFT, curve: 'straight', color: 'orange', width: 3, label: 'Great Rift Valley' },
          { points: [[78, 9], [80, 25]], curve: 'straight', color: 'violet', width: 3.5, arrow: true, label: 'India pushing north' },
        ],
        alt: 'A world map with four features drawn on it: a red horseshoe around the rim of the Pacific Ocean, from New Zealand up through Japan and Alaska and down the west coast of the Americas; a dashed blue line down the middle of the Atlantic; an orange line from the Red Sea down through East Africa; and an arrow pointing north through India.',
      },
    },
    {
      id: 'deep-time',
      type: 'order',
      title: 'Slow, but not still',
      text: `
        A few centimetres a year adds up, given time. Two more dates to set beside the ones you have just read: the last dinosaurs died out ${DEEP_TIME[1].ago / 1e6} million years ago, and our own species is about ${(DEEP_TIME[3].ago).toLocaleString('en-US')} years old.

        **Put these in order, earliest first.**
      `,
      items: DEEP_TIME.map((e) => e.label),
      labels: ['Earliest', 'Latest'],
      hints: ['The continents had to separate before India could cross an ocean and hit Asia.', 'The dinosaurs never saw the Himalaya.'],
      explain: `
        Pangaea began to break up about 200 million years ago; the last dinosaurs died out 66 million years ago; India met Asia about 50 million years ago; our species is about 300,000 years old; Everest was first climbed in 1953.

        The Himalaya are young as mountains go, and still growing by a few millimetres a year.
      `,
    },
    {
      id: 'teach-ranges',
      type: 'info',
      title: 'Seven ranges to know',
      text: `
        The great mountain ranges are long, narrow chains: the scars of plates meeting. Find each of these on the map.

        - The **Himalaya**, in Asia: India meeting Asia.
        - The **Andes**, in South America, and the **Rocky Mountains**, in North America: the Pacific floor diving under the Americas.
        - The **Alps**, in Europe, and the **Atlas Mountains**, in Africa: Africa pressing north into Europe.
        - The **Ural Mountains**: the worn-down stump of a collision long ago, far from any plate edge. They are the conventional line between Europe and Asia.
        - The **Great Dividing Range**, along the east coast of Australia.
      `,
      figure: {
        type: 'world-map', legend: false,
        lines: RANGES.map((r) => ({ points: r.line, curve: 'straight', color: 'red', width: 4 })),
        markers: RANGES.map((r) => ({ at: r.at, label: r.name.replace('Rocky Mountains', 'Rockies').replace(' Mountains', '').replace('Ural', 'Urals'), shape: 'triangle', color: 'red', labelPos: RANGE_LABEL_POS[r.id] })),
        alt: `A world map with seven mountain ranges drawn as thick lines and named: ${listText(RANGES.map((r) => `the ${r.name} ${r.id === 'urals' ? 'between Europe and Asia' : `in ${continent(r.continent).name}`}`))}.`,
      },
    },
    {
      id: 'ranges',
      type: 'match',
      title: 'The great ranges',
      text: 'Five of the seven are worth knowing by heart. **Match each range with its continent.**',
      pairs: SCHOOL_RANGES.map((r) => [r.name, continent(r.continent).name]),
      explain: 'The **Himalaya** in Asia, the **Andes** in South America, the **Rockies** in North America, the **Alps** in Europe and the **Atlas** in Africa: each stands where plates meet.',
    },
    {
      id: 'find-range',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const target = rng.pick(RANGES);
        // The Alps and the Atlas stand too close together to share a world map.
        const pool = RANGES.filter((r) => !(r.id === 'alps' && target.id === 'atlas') && !(r.id === 'atlas' && target.id === 'alps'));
        const shown = spreadMarkers(rng, pool, target, { count: 5, gap: 24 });
        const markers = shown.map((r) => ({ id: r.id, at: r.at, label: r.name, shape: 'triangle', color: 'red' }));
        return {
          text: `Each triangle marks a mountain range. **Tap the ${target.name}.**`,
          widget: { type: 'world-map', mode: 'pickMarker', markerLabels: 'after', answer: target.id, markers, alt: 'A world map without names. Lettered triangles mark several mountain ranges.' },
          check: (s) => s.picked === target.id || (s.picked ? `Marker ${LETTERS[markers.findIndex((m) => m.id === s.picked)]} is the ${range(s.picked).name}, ${s.picked === 'urals' ? 'on the line between Europe and Asia' : `in ${continent(range(s.picked).continent).name}`}.` : false),
          solution: { picked: target.id },
          hints: [target.id === 'urals' ? 'They run north to south through Russia, on the line between Europe and Asia.' : `Look in ${continent(target.continent).name}.`],
          explain: target.fact,
        };
      },
    },
    {
      id: 'rivers',
      type: 'info',
      title: 'Water, soil and a highway',
      text: `
        Rain that falls on the mountains has to get back to the sea. On the way a river gives people **water** for drinking and for crops, fresh **soil** from its floods, and a **highway** for boats. That is why so many great cities stand on a river.

        Seven rivers to know. Zoom in to follow each to its sea.

        | River | Flows into | City on it |
        |---|---|---|
        ${RIVERS.map((r) => `| ${r.name} | ${r.into} | ${r.city} |`).join('\n        ')}
      `,
      figure: {
        type: 'world-map', rivers: RIVERS.map((r) => r.name),
        labels: RIVER_SEAS.map(([text, at]) => ({ at, text, style: 'water' })),
        alt: `A world map with seven great rivers drawn bold and named: ${RIVERS.map((r) => `the ${r.name} in ${continent(r.continent).name}, flowing into the ${r.into}`).join('; ')}.`,
      },
    },
    {
      id: 'river-facts',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const r = rng.pick(RIVERS);
        if (rng.bool()) {
          const pool = [...new Set([...RIVERS.map((x) => x.into), ...OTHER_SEAS])].filter((sea) => sea !== r.into && !r.notInto.includes(sea));
          return {
            text: `Where does the **${r.name}** reach the sea?`,
            options: [{ text: r.into, correct: true }, ...rng.sample(pool, 3).map((sea) => ({ text: sea }))],
            explain: `The ${r.name} flows into the ${r.into}. ${r.fact}`,
          };
        }
        const others = rng.sample(['africa', 'asia', 'europe', 'north-america', 'south-america', 'oceania'].filter((id) => id !== r.continent), 3);
        return {
          text: `Through which continent does the **${r.name}** flow?`,
          options: [{ text: continent(r.continent).name, correct: true }, ...others.map((id) => ({ text: continent(id).name }))],
          explain: `The ${r.name} is in ${continent(r.continent).name}. ${r.fact}`,
        };
      },
    },
    {
      id: 'cities',
      type: 'match',
      text: 'Each of these great cities grew up on one of the seven rivers. **Match the city with its river.**',
      pairs: CITY_RIVERS,
      hints: ['Cairo is the capital of Egypt; Kinshasa is the capital of DR Congo; Vienna is in the middle of Europe.'],
      explain: `
        Cairo on the Nile, Shanghai at the mouth of the Yangtze, Kinshasa on the Congo, New Orleans near the mouth of the Mississippi, Vienna on the Danube (which also flows through Budapest and Belgrade). Until railways came, a boat was by far the cheapest way to move anything heavy.

        The very first cities grew beside rivers too. *First Worlds* takes you to them.
      `,
    },
    {
      id: 'deserts',
      type: 'choice',
      mode: 'predict',
      title: 'Where the rain does not come',
      text: `
        A **desert** is a place that gets very little rain or snow: less than about 250 mm in a year. The map shades six famous ones.

        **Which do you think is the largest desert on Earth?**
      `,
      figure: {
        type: 'world-map', zoom: false, legend: false,
        areas: DESERTS.map((d) => ({ polygon: d.area, color: 'orange', label: d.name.replace(' Desert', '').replace(' deserts', ''), labelAt: d.cores[0] })),
        alt: 'A world map with six deserts shaded and named: the Sahara across North Africa, the Arabian Desert, the Gobi in Mongolia and China, the Kalahari in southern Africa, the Atacama on the west coast of South America and the deserts of central Australia.',
      },
      shuffle: false,
      options: [
        { text: 'The Sahara' },
        { text: 'The Arabian Desert' },
        { text: 'The Gobi' },
        { text: 'Antarctica', correct: true },
      ],
      explain: `
        **Antarctica**: about 14 million km², and so cold that hardly any snow falls on it. A desert is defined by dryness, not by heat or sand.

        The Sahara, at about 9 million km², is the largest *hot* desert. Notice how many hot deserts lie in two bands, a little way north and south of the Equator. The next lesson explains that.
      `,
    },
    {
      id: 'place-desert',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const d = rng.pick(DESERTS);
        const name = d.name.startsWith('Australian') ? 'the deserts of central Australia' : `the ${d.name}`;
        return {
          text: `**Place the pin in ${name}.** Anywhere within ${d.within} km of its heart counts.`,
          widget: {
            type: 'world-map', view: d.view, mode: 'place', pin: { label: d.name, color: 'red' },
            targets: d.cores.map((at, i) => ({ id: `core${i}`, at, label: i === 0 ? d.name : '' })),
            alt: `A map of ${{ africa: 'Africa', 'middle-east': 'the Middle East', asia: 'Asia', 'south-america': 'South America', australia: 'Australia' }[d.view]} without names, with a pin to place.`,
          },
          check: (s) => {
            if (!s.placed) return 'Move the pin first: drag it, or tap the map.';
            if (d.outside && d.outside[s.country]) return d.outside[s.country];
            if (s.km <= d.within) return s.country ? true : 'That is out at sea. Move the pin on to the land.';
            const nearest = d.cores[Number(String(s.nearest).replace('core', ''))] || d.cores[0];
            return `Not quite: your pin is ${howFarOff(s.pin, nearest)}${s.country ? `, in ${theCountry(s.country)}` : ''}.`;
          },
          solution: { pin: d.cores[0] },
          hints: [{
            sahara: 'It fills the whole north of Africa, between the Mediterranean coast and the grasslands further south.',
            arabian: 'It covers most of the big peninsula between the Red Sea and the Persian Gulf.',
            gobi: 'It lies in the middle of Asia, far from any sea: in southern Mongolia and northern China.',
            kalahari: 'It is in the south of Africa, inland, north of the country of South Africa.',
            atacama: 'It is a narrow strip on the Pacific coast, about a third of the way down South America.',
            australian: 'They fill the centre and west of the continent, away from the east coast.',
          }[d.id]],
          explain: d.fact,
        };
      },
    },
    {
      id: 'waters',
      type: 'info',
      title: 'Seas and lakes worth knowing',
      text: `
        A few inland waters come up again and again in the story of the world.

        The **Mediterranean**, the **Red Sea**, the **Black Sea** and the **South China Sea** have been highways of trade since ancient times. The **Caribbean** became one after 1492.

        The **Caspian Sea** is really a lake, the largest on Earth. **Lake Baikal** in Siberia is the deepest, **Lake Victoria** the largest in Africa, and North America's **Great Lakes** the largest group of freshwater lakes anywhere.
      `,
      figure: [
        { type: 'world-map', view: [-112, 4, -52, 68], maxWidth: 230, zoom: false, markers: waterMarkers(['hudson', 'great-lakes', 'gulf-mexico', 'caribbean']),
          alt: 'A map of North America and the Caribbean with four waters marked and named: Hudson Bay, the Great Lakes, the Gulf of Mexico and the Caribbean Sea.' },
        { type: 'world-map', view: [-4, -10, 138, 62], maxWidth: 400, zoom: false, markers: waterMarkers(['mediterranean', 'black-sea', 'caspian', 'red-sea', 'arabian-sea', 'bengal', 'south-china', 'baikal', 'victoria']),
          alt: 'A map of Africa and Asia with nine waters marked and named: the Mediterranean, the Black Sea, the Caspian Sea, the Red Sea, the Arabian Sea, the Bay of Bengal, the South China Sea, Lake Baikal and Lake Victoria.' },
      ],
    },
    {
      id: 'find-water',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const target = rng.pick(WATERS);
        const shown = spreadMarkers(rng, WATERS, target, { count: 5, gap: 28 });
        const markers = shown.map((w) => ({ id: w.id, at: w.at, label: w.name, color: 'blue' }));
        return {
          text: `Each marker stands in a sea or a lake. **Tap ${target.name.startsWith('Lake') || target.name === 'Hudson Bay' ? '' : 'the '}${target.name}.**`,
          widget: { type: 'world-map', mode: 'pickMarker', markerLabels: 'after', answer: target.id, markers, alt: 'A world map without names. Lettered markers stand in several seas and lakes.' },
          check: (s) => s.picked === target.id || (s.picked ? `Marker ${LETTERS[markers.findIndex((m) => m.id === s.picked)]} is ${water(s.picked).name.startsWith('Lake') || s.picked === 'hudson' ? '' : 'the '}${water(s.picked).name}.` : false),
          solution: { picked: target.id },
          explain: target.fact,
        };
      },
    },
    {
      id: 'everest',
      type: 'choice',
      title: 'Sea shells on the roof of the world',
      text: `
        The highest peak in this view from an aeroplane is Mount Everest, 8,849 m high. Tibetans call it *Chomolungma* and Nepalis *Sagarmatha*; its English name honours a British surveyor who never saw it. An Indian mathematician, Radhanath Sikdar, is credited with working out in 1852 that it was the highest peak ever measured.

        The rock of its very summit is limestone, and in it climbers have found the fossil shells of small sea creatures. **What is the best explanation?**
      `,
      figure: photo(MEDIA.everest, {
        alt: 'A range of jagged, snow-covered mountains seen from the air, above a layer of cloud. One sharp peak in the middle of the picture stands higher than all the others, against a deep blue sky.',
        caption: 'Mount Everest, on the border of Nepal and China',
      }),
      options: [
        { text: 'The rock formed on a sea floor and was pushed up when India met Asia', correct: true },
        { text: 'The sea once stood nine kilometres higher than it does now', why: 'There is nowhere near enough water on Earth for that. The sea stayed put; the rock moved.' },
        { text: 'Birds carried the shells up there', why: 'The fossils are inside solid rock, in layers hundreds of metres thick. They were buried in mud long before the mountain existed.' },
        { text: 'The creatures lived in mountain lakes', why: 'They were ocean animals, and the same limestone runs through the range for hundreds of kilometres.' },
      ],
      explain: `
        The top of the world was once the bottom of a sea. The limestone was laid down under water about 450 million years ago, and the collision of India with Asia has since lifted it almost nine kilometres into the sky.

        Plates build the mountains; mountains catch the rain; rivers carry it down; and people gather where the water goes.
      `,
    },
  ],
  recap: [
    'The Earth\'s shell is broken into plates that move a few centimetres a year. Mountains rise where they collide, volcanoes where one dives under another (the Pacific **Ring of Fire**), and rifts open where they pull apart.',
    'Five great ranges: the **Himalaya** (Asia), **Andes** (South America), **Rockies** (North America), **Alps** (Europe) and **Atlas** (Africa).',
    'Rivers give water, soil and a highway, which is why great cities stand on them: the Nile, Amazon, Yangtze, Mississippi, Congo, Ganges and Danube.',
    'A desert is defined by dryness. The Sahara is the largest hot desert; the largest of all is Antarctica.',
  ],
  next: 'Next: why is the Sahara dry and the Congo wet? Why is London mild and Moscow freezing, when both are equally far north? A handful of rules explains every climate on Earth.',
};
