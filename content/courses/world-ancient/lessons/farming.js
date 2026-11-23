// First Worlds: To 500 CE · Lesson 2 · The Seeds of Everything
//
// Driving question: why did people in several far-apart places, who had never met, all begin to farm
// within a few thousand years of each other, and was it a good bargain?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-ancient/index.js';
import { at, markerQuiz, originQuiz, ORIGINS } from '../helpers.js';

// The table of the first teaching screen, built from the list the crop questions are drawn from.
const ORIGIN_ROWS = ORIGINS.map((o) => `| ${o.region.charAt(0).toUpperCase()}${o.region.slice(1)} | ${o.items.join(', ')} |`);

const CENTRES = [
  { place: 'fertile-crescent', ask: 'where wheat and barley were first farmed', about: 'the Fertile Crescent of south-west Asia was the first centre of farming, about 11,500 years ago.', label: 'wheat, barley', pos: 'top' },
  { place: 'yangtze-rice', ask: 'where rice was first farmed', about: 'rice was first grown along the Yangtze in China, about 9,000 years ago.', label: 'rice, millet', pos: 'bottom' },
  { place: 'balsas', ask: 'where maize was first farmed', about: 'maize was bred from a wild grass in southern Mexico, about 9,000 years ago.', label: 'maize', pos: 'left' },
  { place: 'titicaca', ask: 'where potatoes were first farmed', about: 'potatoes come from the high Andes of South America.', label: 'potato', pos: 'left' },
  { place: 'kuk-swamp', ask: 'where bananas and sugar cane were first farmed', about: 'people in the highlands of New Guinea were growing bananas and taro by about 7,000 years ago.', label: 'banana, taro', pos: 'bottom' },
  { place: 'sahel', ask: 'where sorghum and pearl millet were first farmed', about: 'sorghum and pearl millet were first grown in the Sahel, south of the Sahara.', label: 'sorghum, millet', pos: 'bottom' },
  { place: 'eastern-woodlands', ask: 'where sunflowers were first farmed', about: 'sunflowers were first grown in eastern North America, about 4,000 to 5,000 years ago.', label: 'sunflower', pos: 'top' },
];

// An arrow from (x1, y1) to (x2, y2), drawn as three strokes.
function arrow(x1, y1, x2, y2, cls = 'stroke-ink') {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = (da) => `L${(x2 - 9 * Math.cos(a + da)).toFixed(1)} ${(y2 - 9 * Math.sin(a + da)).toFixed(1)}`;
  return `<path class="${cls} fill-none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M${x1} ${y1} L${x2} ${y2} M${x2} ${y2} ${head(0.5)} M${x2} ${y2} ${head(-0.5)}"/>`;
}

// A wild grass (few seeds in hard cases) beside a crop (an ear packed with kernels).
function ears() {
  let out = '<path class="stroke-ink fill-none" stroke-width="2.5" stroke-linecap="round" d="M75 152 Q71 90 75 30"/>';
  [44, 62, 80, 98, 116, 134].forEach((y, i) => {
    const d = i % 2 ? 1 : -1;
    out += `<path class="fill-green-soft stroke-ink" stroke-width="2" stroke-linejoin="round" d="M75 ${y + 6} L${75 + d * 17} ${y - 7} L${75 + d * 5} ${y - 10} Z"/>`;
  });
  out += '<rect class="fill-yellow-soft stroke-ink" stroke-width="2.5" x="255" y="26" width="52" height="124" rx="26"/>';
  out += '<line class="stroke-ink" x1="281" y1="150" x2="281" y2="162" stroke-width="2.5" stroke-linecap="round"/>';
  for (let row = 0; row < 8; row++) for (let col = 0; col < 3; col++) {
    if ((row === 0 || row === 7) && col !== 1) continue;
    out += `<circle class="fill-yellow stroke-ink" stroke-width="1.5" cx="${268 + col * 13}" cy="${42 + row * 13.2}" r="5.4"/>`;
  }
  out += arrow(128, 92, 222, 92, 'stroke-orange');
  out += '<text class="fig-label-sm" x="175" y="78" text-anchor="middle">thousands of seasons</text><text class="fig-label-sm" x="175" y="112" text-anchor="middle">of choosing</text>';
  out += '<text class="fig-label-sm" x="75" y="170" text-anchor="middle">wild grass</text><text class="fig-label-sm text-muted" x="75" y="185" text-anchor="middle">few seeds, hard cases</text>';
  out += '<text class="fig-label-sm" x="281" y="178" text-anchor="middle">crop: many soft kernels</text>';
  return out;
}

// What stored grain makes possible: specialists on one side, rulers on the other.
function surplus() {
  const box = (x, y, w, h, hue) => `<rect class="fill-${hue}-soft stroke-ink" stroke-width="2.5" x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/>`;
  const line = (x, y, text, cls = 'fig-label-sm') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="middle">${text}</text>`;
  return box(100, 8, 160, 54, 'orange') + line(180, 31, 'surplus', 'fig-label') + line(180, 50, 'stored grain', 'fig-label-sm text-muted')
    + arrow(140, 64, 98, 106) + arrow(220, 64, 262, 106)
    + box(8, 112, 168, 80, 'blue') + line(92, 134, 'feeds people') + line(92, 150, 'who do not farm') + line(92, 177, 'specialists', 'fig-label')
    + box(184, 112, 168, 80, 'violet') + line(268, 134, 'can be counted,') + line(268, 150, 'taxed and taken') + line(268, 177, 'rulers', 'fig-label');
}

export default {
  id: 'farming',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A very recent habit',
      text: `
        Our species is about 300,000 years old. For most of that time everyone
        lived by **foraging**: hunting, fishing and gathering wild plants.

        **For what share of those 300,000 years has anybody farmed?** Take a guess.
      `,
      min: 0, max: 100, step: 1, answer: 4, tolerance: 3, unit: '%', start: 50,
      explain: `
        About **4%**. The first farms appear roughly 11,500 years ago. If the
        whole story of our species were one day, farming would begin at about
        five past eleven at night.

        And yet almost everything in the rest of this course (cities, kings,
        writing, empires) grows out of that late change.
      `,
    },
    {
      id: 'centres',
      type: 'info',
      title: 'Not once, but many times',
      text: [
        'Farming was not invented in one place and copied. It began **independently** in at least seven regions, among people who had no contact with each other. Each started with the wild plants and animals it had.',
        '',
        '| Region | First farmed there |',
        '|---|---|',
        ...ORIGIN_ROWS,
      ].join('\n'),
      figure: {
        type: 'world-map', view: 'world', zoom: false,
        markers: CENTRES.map((c) => ({ at: at(c.place), label: c.label, color: 'green', shape: 'square', labelPos: c.pos })),
        alt: 'A world map with seven green squares, each labelled with crops: wheat and barley in south-west Asia, rice and millet in China, maize in Mexico, potato in the Andes, banana and taro in New Guinea, sorghum and millet in West Africa, sunflower in eastern North America.',
      },
    },
    {
      id: 'when',
      type: 'interact',
      graded: false,
      title: 'When?',
      text: `
        Here are the same beginnings on a timeline, with the Great Pyramid for
        comparison. The dates are estimates from seeds and bones dug out of
        ancient settlements.

        Tap the events to read about them. Then **tap the place where farming began first** and press Check.
      `,
      widget: {
        type: 'timeline', from: -10000, to: -1000, step: 2000, mode: 'explore',
        events: [
          { id: 'fc', year: -9500, label: 'Fertile Crescent', short: 'Fertile Cr.', color: 'green', note: '**About 9500 BCE:** wheat, barley, peas and lentils; sheep and goats a little later. The earliest farming known.' },
          { id: 'cn', year: -7000, label: 'China', color: 'green', note: '**About 7000 BCE:** rice along the Yangtze and millet along the Yellow River.' },
          { id: 'mx', year: -6800, label: 'Mexico', color: 'green', note: '**About 7000 BCE:** maize and squash. Beans came later.' },
          { id: 'an', year: -5500, label: 'Andes', color: 'green', note: '**Perhaps 6000 to 5000 BCE:** potatoes and quinoa, and later llamas and alpacas.' },
          { id: 'ng', year: -5000, label: 'New Guinea', short: 'N. Guinea', color: 'green', note: '**By about 5000 BCE:** taro and bananas, grown on drained swamp land at Kuk.' },
          { id: 'af', year: -2500, label: 'Sahel', color: 'green', note: '**About 2500 BCE:** pearl millet in West Africa; sorghum further east.' },
          { id: 'na', year: -2300, label: 'Eastern North America', short: 'E. N. America', color: 'green', note: '**About 2500 BCE:** sunflowers, squash and goosefoot.' },
          { id: 'pyr', year: -2560, label: 'Great Pyramid', short: 'Pyramid', color: 'gray', note: '**About 2560 BCE.** By now people in the Fertile Crescent had been farming for 7,000 years.' },
        ],
        spans: [{ id: 'ice', from: -10000, to: -9700, label: 'Ice Age', color: 'blue', note: 'The last Ice Age ended about 9700 BCE (11,700 years ago). Farming begins soon afterwards.' }],
        alt: 'A timeline from 10,000 BCE to 1000 BCE. The Ice Age ends about 9700 BCE. Farming begins in the Fertile Crescent about 9500 BCE, in China and Mexico about 7000 BCE, in the Andes and New Guinea between 6000 and 5000 BCE, and in the Sahel and eastern North America about 2500 BCE, about when the Great Pyramid was built.',
      },
      check: (s) => s.selected === 'fc' || (s.selected === 'ice' ? 'That bar is the end of the Ice Age. Farming begins just after it: tap the first green dot.' : s.selected ? 'Farming had already begun somewhere else by then. Look further left on the line.' : 'Tap an event on the line.'),
      solution: { selected: 'fc' },
      explain: `
        The Fertile Crescent was first, about **9500 BCE**, but China and Mexico
        followed without any help from it. All seven beginnings fall within some
        seven thousand years: an eyeblink after 290,000 years of foraging.

        Look at the blue bar as well. The last Ice Age ended about 9700 BCE,
        just before the first farms.
      `,
    },
    {
      id: 'why-then',
      type: 'choice',
      text: `
        People had been just as clever for 300,000 years. Then farming started in
        seven separate regions, all within the last 12,000 years.

        **What had changed for all of them at once?**
      `,
      options: [
        { text: 'The Ice Age ended, and the climate became warmer, wetter and steadier', correct: true },
        { text: 'One people invented farming and taught it to the rest', why: 'Nobody could carry the idea from Asia to Mexico or the Andes: the Americas were out of contact with the rest of the world.' },
        { text: 'Human brains had grown larger', why: 'Brains had not changed. The people who painted Chauvet Cave 36,000 years ago were as intelligent as any farmer.' },
        { text: 'Wild animals had died out, so there was nothing left to hunt', why: 'Some big animals had gone, but foragers in most regions still ate well, and many went on foraging for thousands of years.' },
      ],
      explain: `
        Only one thing changes everywhere at once: the **climate**. About 11,700
        years ago the last Ice Age ended. The cold, dry and wildly changeable
        weather of the Ice Age gave way to the warmer, steadier world we know.

        A field is a bet on next season's weather. Only now did the bet pay
        off, year after year.
      `,
    },
    {
      id: 'teach-domestication',
      type: 'info',
      title: 'Crops are made, not found',
      text: `
        A wild grass is poor food. It has few seeds, small and locked in hard
        cases, and it scatters them itself as soon as they ripen.

        The first farmers changed that without planning to. Season after
        season they kept seed from the best plants, those with the most and
        the softest kernels, and sowed it. Over thousands of years the plants
        changed.

        This is **domestication**: people and a species changing each other.
        The crop feeds the farmer, and it can no longer sow itself without
        the farmer.
      `,
      figure: {
        type: 'svg', viewBox: '0 0 360 190', maxWidth: 460,
        alt: 'Two drawings joined by an arrow. On the left a wild grass: a thin stalk carrying six small, pointed seed cases. On the right a crop: a thick ear packed with rows of round kernels. The arrow is labelled "thousands of seasons of choosing".',
        content: ears(),
      },
    },
    {
      id: 'teosinte',
      type: 'interact',
      title: 'Nine thousand years of choosing',
      text: `
        Farmers did not find crops ready-made. They made them. One of the three
        ears in this photograph is **teosinte**, a wild grass from Mexico. Another
        is its descendant, maize. The third is a cross between the two.

        **Tap the wild plant.**
      `,
      widget: photo(MEDIA['maize-teosinte'], {
        alt: 'Three ears of grain on a red background, one above the other. The top one is thin and green, a single row of about a dozen small triangular seed cases. The middle one is thicker, with several rows of small pointed kernels. The bottom one is a large cob with many rows of fat, pale kernels.',
        hotspots: [
          { id: 'teosinte', x: 0.33, y: 0.115, r: 0.055, label: 'Teosinte (wild)', alt: 'the thin green ear at the top' },
          { id: 'hybrid', x: 0.2, y: 0.38, r: 0.07, label: 'Cross of the two', alt: 'the middle-sized ear with small pointed kernels' },
          { id: 'maize', x: 0.6, y: 0.74, r: 0.1, label: 'Maize', alt: 'the large cob at the bottom' },
        ],
      }),
      check: (s) => s.picked === 'teosinte' || (s.picked === 'maize' ? 'That is the crop, shaped by farmers. The wild plant is the one nobody would bother to plant today.' : s.picked === 'hybrid' ? 'That is the cross between the two. The wild plant is the smallest of the three.' : false),
      solution: { picked: 'teosinte' },
      explain: `
        Teosinte has a handful of seeds, each locked in a case as hard as a nut.
        Some nine thousand years of choosing by farmers in Mexico turned it
        into **maize**, a plant that cannot even scatter its own seed without
        people.
      `,
    },
    {
      id: 'crop-origin',
      type: 'choice',
      review: true,
      gen: (rng) => originQuiz(rng),
    },
    {
      id: 'gobekli',
      type: 'choice',
      title: 'Who built this?',
      text: `
        On a hilltop at **Göbekli Tepe**, in what is now Turkey, people set
        T-shaped stone pillars in great rings about **9500 BCE**. The tallest stand
        over 5 metres high and weigh many tonnes.

        Archaeologists sifted what the builders threw away. The animal bones
        come from wild gazelle and wild cattle, and the grain from wild grasses.

        **What kind of people built it?**
      `,
      figure: photo(MEDIA['gobekli-tepe'], {
        alt: 'An excavation on a dry hilltop under a blue sky: sunken rings of rough stone wall, with large upright stone slabs, some shaped like a capital T, set into the walls and standing in the middle. Wooden walkways and props surround the dig.',
        caption: 'Göbekli Tepe, south-eastern Turkey',
      }),
      options: [
        { text: 'Farmers from a nearby town', why: 'Farmers leave the bones of herded animals and the grain of crops. Here everything is wild, and there were no towns yet.' },
        { text: 'People who lived by hunting and gathering', correct: true },
        { text: 'The workers of a powerful king', why: 'There were no kings yet. Look at the food: people who ate only wild animals and wild grain.' },
      ],
      explain: `
        **Foragers.** Wild bones and wild grain mean that the builders had no
        domesticated plants or animals. They had no towns and no kings either.
        Some of the pillars are carved with the animals they knew: foxes,
        boars, snakes and birds.

        That surprised archaeologists. They had assumed that only farmers could
        feed the workers for such a project. Göbekli Tepe is about 7,000 years
        older than Stonehenge and the pyramids: big gatherings and shared beliefs
        may have come *before* farming, not after.
      `,
    },
    {
      id: 'catalhoyuk',
      type: 'choice',
      title: 'A town without streets',
      text: `
        Some two thousand years later farming had produced something new: the town.
        At **Çatalhöyük** in Turkey, from about 7100 BCE, hundreds of mud-brick
        houses were built wall to wall, like cells in a honeycomb, with no
        streets between them.

        A museum has rebuilt the inside of one of them. **How did people get home?**
      `,
      figure: photo(MEDIA['catalhoyuk-house'], {
        alt: 'The inside of a rebuilt mud-brick house with smooth white plastered walls; none of the walls in view has a door. In the left corner a wooden ladder leans from beside a domed clay oven up to the timber roof. Low platforms line the floor, and clay bull heads with horns are fixed to the far wall.',
        caption: 'A Çatalhöyük house rebuilt in a museum in Ankara',
      }),
      options: [
        { text: 'Across the roofs, then down a ladder', correct: true },
        { text: 'Through a front door on the street', why: 'There were no streets, and the walls have no doors: every house touched its neighbours.' },
        { text: 'Through tunnels under the floors', why: 'Nothing leads in from below. Look at where the ladder goes.' },
      ],
      explain: `
        The roofs were the streets, and the hole you climbed through also let
        out the smoke of the oven below it. Inside, the houses are much alike:
        no palace, no great temple, no rich quarter. Çatalhöyük seems to have
        been a town of rough equals, with walls painted with hunting scenes and
        set with the horns of wild cattle.

        The grain stores and the crowding were new. So was staying in one place
        for a whole lifetime.
      `,
    },
    {
      id: 'teach-surplus',
      type: 'info',
      title: 'One word explains the rest: surplus',
      text: `
        A good field gives more grain than the family who works it can eat.
        The extra is the **surplus**. Unlike a forager's catch, grain keeps:
        it can be stored.

        Stored grain does two things.

        - It can feed people who do not farm. A village can now keep
          **specialists**: potters, priests, soldiers.
        - It can be counted, taxed and taken. Whoever commands the stores
          commands the village. That makes **rulers**, and **inequality**.
      `,
      figure: {
        type: 'svg', viewBox: '0 0 360 200', maxWidth: 460,
        alt: 'A diagram. A box at the top reads "surplus: stored grain". One arrow leads from it to a box that reads "feeds people who do not farm: specialists". A second arrow leads to a box that reads "can be counted, taxed and taken: rulers".',
        content: surplus(),
      },
    },
    {
      id: 'chain',
      type: 'order',
      title: 'What farming set going',
      text: '**Put the links of the chain in order**, from cause to effect.',
      items: [
        'Farmers grow more food than they eat',
        'The surplus is stored',
        'Villages grow, and not everyone has to farm',
        'Potters, priests and soldiers appear',
        'A few people command the stores and the soldiers',
      ],
      labels: ['First', 'Last'],
      hints: ['Start with the food itself. What must happen before anyone can live without farming?'],
      explain: `
        **Surplus** is the first link, and every later one hangs on it. Only
        stored grain can feed people who do not farm, and only stores that
        somebody commands can make a ruler.

        Foragers owned little and shared most of it. Farming villages had
        something worth guarding.
      `,
    },
    {
      id: 'not-progress',
      type: 'choice',
      mode: 'predict',
      title: 'A better life?',
      text: `
        Archaeologists can read health from skeletons: height, teeth, signs of
        illness.

        **Compared with the foragers before them, what do you expect the skeletons of early farmers to show?**
      `,
      shuffle: false,
      options: [
        { text: 'Taller and healthier' },
        { text: 'About the same' },
        { text: 'Shorter, with worse teeth and more disease', correct: true },
      ],
      explain: `
        In region after region the first farmers were **shorter** than the
        foragers before them, with more tooth decay and more signs of hunger and
        infection. They ate a narrow diet of starchy grain, worked long hours,
        and lived crowded together with their animals and their waste, where
        diseases spread.

        So why did farming win? Because a field feeds far more people than the
        same land feeds foragers. Farmers did not live better. There were simply
        **many more of them**, and no way back.
      `,
    },
    {
      id: 'axis',
      type: 'interact',
      title: 'East and west, north and south',
      text: `
        Crops are tuned to day length and seasons. Those stay the same along a line
        of latitude and change as you go north or south. The [orange band]{.orange}
        marks the latitudes of the Fertile Crescent.

        Wheat spread from there in every direction. **Which marker shows where it would have had the most trouble growing?**
      `,
      widget: {
        type: 'world-map', view: [-20, -30, 125, 58], mode: 'pickMarker', zoom: false, answer: 'c',
        areas: [{ band: [28, 42], color: 'orange', label: 'Latitudes of the Fertile Crescent' }],
        markers: [
          { at: at('fertile-crescent'), label: 'Fertile Crescent', color: 'green', shape: 'square', labelPos: 'top' },
          { id: 'a', at: [-4, 39.5], label: 'Spain', labelPos: 'top' },
          { id: 'b', at: [70.5, 30], label: 'Indus valley', labelPos: 'bottom' },
          { id: 'c', at: [22, -2], label: 'Congo basin' },
          { id: 'd', at: [110, 35], label: 'Northern China', labelPos: 'top' },
        ],
        alt: 'A map of Africa, Europe and Asia. An orange band runs east to west across the latitudes of the Fertile Crescent. Markers stand in Spain, the Indus valley and northern China, all inside the band, and in the Congo basin on the equator, far south of it.',
      },
      check: (s) => s.picked === 'c' || (s.picked ? 'That place lies at nearly the same latitude as the Fertile Crescent, with similar seasons. Wheat was being grown there in ancient times.' : false),
      solution: { picked: 'c' },
      explain: `
        Wheat reached Spain, the Indus and in time northern China, all at similar
        latitudes. It never took hold in the hot, wet Congo basin, on the far
        side of the Sahara.

        Eurasia's long **east–west** shape let crops, animals and ideas travel
        far. In the Americas and Africa, which run **north–south**, each step
        meant a new climate: maize needed thousands of years to adapt its way
        from Mexico to what is now the eastern United States. The geographer
        Jared Diamond made this argument famous. It is one part of the story,
        not the whole of it.
      `,
    },
    {
      id: 'find-centres',
      type: 'interact',
      review: true,
      gen: (rng) => markerQuiz(rng, CENTRES, {
        view: 'world', minKm: 2500,
        alt: 'A world map without names. Four lettered markers stand on different continents.',
      }),
    },
    {
      id: 'sort-crops',
      type: 'bucket',
      review: true,
      text: '**Sort these by where they were first farmed.**',
      buckets: ['South-west Asia', 'East Asia', 'The Americas'],
      items: [
        { text: 'Wheat', bucket: 0 },
        { text: 'Barley', bucket: 0 },
        { text: 'Sheep', bucket: 0 },
        { text: 'Rice', bucket: 1 },
        { text: 'Soybeans', bucket: 1 },
        { text: 'Maize', bucket: 2 },
        { text: 'Potatoes', bucket: 2 },
        { text: 'Llamas', bucket: 2 },
      ],
      explain: `
        Wheat, barley and sheep come from the Fertile Crescent; rice and soybeans
        from China; maize from Mexico; potatoes and llamas from the Andes.

        Three of these first crops, **wheat, rice and maize**, still supply about
        half of all the calories that people eat.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Some writers have called farming humanity's greatest step forward.
        Others have called it our worst mistake.

        **In your own words: what did farming give people, and what did it cost them?**
      `,
      model: `
        It gave **more food from the same land**, and so more people, stored
        surplus, villages and towns, and specialists who could do something other
        than find food. Everything later (cities, writing, science) rests on that.

        It cost the first farmers **health and freedom**: harder work, a poorer
        diet, new diseases, and for the first time rulers and inequality. It was
        less a decision than a slow trap: once there were more mouths than
        foraging could feed, nobody could go back.
      `,
    },
  ],
  recap: [
    'Farming began **independently** in at least seven regions, first in the Fertile Crescent about 11,500 years ago, soon after the Ice Age ended.',
    'Each region domesticated what it had: wheat and sheep, rice and millet, maize, potatoes. **Domestication** changed the plants, the animals and the people.',
    'Stored **surplus** made villages, specialists, rulers and inequality possible. Early farmers were more numerous than foragers, not healthier.',
    'Crops spread most easily **east and west**, along the same latitudes, which gave Eurasia a head start.',
  ],
  next: 'Next: in a few dry valleys, farmers learned to use a river. The surplus that followed built the first cities.',
};
