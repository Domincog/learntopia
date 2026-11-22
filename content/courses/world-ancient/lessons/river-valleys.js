// First Worlds: To 500 CE · Lesson 3 · Four Rivers, Four Civilisations
//
// Driving question: why did the first cities all grow beside rivers, and in dry country at that?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-ancient/index.js';
import { at, mark, countryQuiz, orderEvents, EVENTS, yearOf } from '../helpers.js';

const RIVERS = ['Nile', 'Tigris', 'Euphrates', 'Indus', 'Yellow River'];

// A dot on the lesson's timeline, with its date and wording taken from the course table.
// (`year` overrides the table's mid-point where the lesson's wording names a different year: "from about 1200 BCE".)
const dot = (id, label, color, short = label, year = yearOf(id)) => ({
  id, year, label, short, color,
  note: `**${EVENTS[id].when.charAt(0).toUpperCase()}${EVENTS[id].when.slice(1)}.** ${EVENTS[id].text}.`,
});

const COUNTRY = [
  { place: 'uruk', own: 'the land of the Tigris and the Euphrates', ask: 'the ruins of **Uruk and Ur**, the first cities of Mesopotamia', hint: 'look between the Tigris and the Euphrates.', about: 'Mesopotamia, "the land between the rivers" Tigris and Euphrates, lies mostly in modern **Iraq**.' },
  { place: 'giza', own: 'the land of the Nile', ask: 'the **pyramids of Giza**', hint: 'follow the Nile north to its delta.', about: 'the pyramids stand beside the Nile in **Egypt**, at the edge of modern Cairo.' },
  { place: 'mohenjo-daro', own: 'the land of the Indus', ask: '**Mohenjo-daro and Harappa**, the great Indus cities', hint: 'follow the Indus from the mountains to the Arabian Sea.', about: 'most of the Indus flows through modern **Pakistan**. Other Indus towns lie in north-west India.' },
  { place: 'anyang', own: 'the land of the Yellow River', ask: '**Anyang**, the last capital of the Shang kings', hint: 'look for the Yellow River, far to the east.', about: 'Anyang lies on the plain of the Yellow River in northern **China**.' },
];

const ORDER_POOL = ['uruk-city', 'egypt-unified', 'pyramid', 'caral', 'mammoth', 'hammurabi', 'shang-anyang', 'olmec', 'cleopatra'];

export default {
  id: 'river-valleys',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Where would you build?',
      text: `
        About 5,000 years ago the first cities appeared: tens of thousands of
        people living in one place, fed by farmers outside the walls.

        **Where would you expect to find them?**
      `,
      options: [
        { text: 'In green lands with plenty of rain' },
        { text: 'On coasts with rich fishing' },
        { text: 'Beside rivers that cross dry country', correct: true },
        { text: 'In cool hills, safe from floods' },
      ],
      explain: `
        Beside rivers, and in places where little rain falls: the Tigris and
        Euphrates, the Nile, the Indus. On the Yellow River in northern China
        the rain is unreliable too.

        It seems an odd choice. The reason says a lot about what a city needs.
      `,
    },
    {
      id: 'four-rivers',
      type: 'info',
      title: 'Four valleys',
      text: `
        Four regions are often called the first **civilisations**: societies
        with cities, rulers, specialists and, usually, writing.

        - **Mesopotamia** ("between the rivers"), on the Tigris and Euphrates,
          now mostly in Iraq: the cities of Sumer, such as Uruk and Ur, from
          about 3500 BCE
        - **Egypt**, on the Nile: one kingdom from about 3100 BCE
        - the **Indus valley**, now mostly in Pakistan: Mohenjo-daro and
          Harappa, from about 2600 BCE
        - the **Yellow River**, in northern China: the Shang kings, from
          about 1600 BCE

        Find each river on the map. What is the land around most of them like?
      `,
      figure: {
        type: 'world-map', view: [24, 8, 124, 46], rivers: RIVERS, regions: [{ ids: ['EG', 'IQ', 'PK', 'CN'], color: 'yellow', tone: 'soft' }], dim: false,
        markers: [
          mark('uruk', { color: 'red', labelPos: 'bottom' }),
          mark('giza', { color: 'red', labelPos: 'left' }),
          mark('mohenjo-daro', { color: 'red', labelPos: 'bottom' }),
          mark('anyang', { color: 'red', labelPos: 'right' }),
        ],
        labels: ['EG', 'IQ', 'PK', 'CN', { at: [43, 23], text: 'Arabian Desert', style: 'area' }, { at: [27, 23.5], text: 'Sahara', style: 'area' }],
        alt: 'A map from Egypt to China with five rivers drawn in bold: the Nile in Egypt, the Tigris and Euphrates in Iraq, the Indus in Pakistan and the Yellow River in northern China. A city is marked on each: Giza, Uruk, Mohenjo-daro and Anyang. The four modern countries, Egypt, Iraq, Pakistan and China, are tinted and named. The Sahara and the Arabian Desert lie around the first three.',
      },
    },
    {
      id: 'why-rivers',
      type: 'multi',
      text: `
        You met rivers in *The World at a Glance* as water, soil and highway.
        Now think like a farmer in a land with almost no rain.

        **What does a big river give you?** Choose all that apply.
      `,
      options: [
        { text: 'Water that can be led to the fields through canals', correct: true },
        { text: 'Fresh, fertile mud left behind by each flood', correct: true },
        { text: 'A road for boats carrying grain, stone and timber', correct: true },
        { text: 'Plenty of rain all year round', why: 'Rivers bring water from far away, where the rain or snow falls. Egypt itself gets almost no rain.' },
        { text: 'Safety from every enemy', why: 'A river is a highway for attackers too. Mesopotamian cities built walls and fought each other constantly.' },
      ],
      explain: `
        Water, new soil every year, and transport. With **irrigation** a dry
        valley gives bigger and more dependable harvests than rain-fed fields.
        That is a large **surplus**, enough to feed a city.

        There was a price. Canals and dykes need many hands, someone to
        organise them and someone to keep count. Rivers helped to make rulers and
        record-keepers as well as grain.
      `,
    },
    {
      id: 'pyramids',
      type: 'choice',
      title: 'What a pyramid says',
      text: `
        Every summer the Nile flooded and left a strip of black mud through the
        desert. On that strip Egypt grew its grain. About 2560 BCE King Khufu's
        **Great Pyramid** rose at Giza: 146 metres high, some 2.3 million blocks,
        the tallest building on Earth for the next 3,800 years.

        **What does it tell you about the Egypt that built it?**
      `,
      figure: photo(MEDIA.giza, {
        alt: 'Three huge stone pyramids in a row on a desert plateau, with three much smaller pyramids in front of them. The sky is clear and the sand is bare.',
        caption: 'The pyramids of Giza, Egypt. The Great Pyramid is the farthest, on the right.',
      }),
      options: [
        { text: 'It could feed and organise thousands of workers for many years', correct: true },
        { text: 'It was built by armies of slaves driven with whips', why: 'A popular myth. The builders\' town has been excavated: bakeries, breweries, and the tombs of workers buried with honour beside the pyramids.' },
        { text: 'Egyptians had iron tools and cranes', why: 'They had copper chisels, stone hammers, ropes, sledges and ramps. Iron tools came more than a thousand years later.' },
      ],
      explain: `
        A pyramid is stored grain turned into stone. Skilled crews worked all
        year; farmers joined them in shifts, paid in bread, beer and meat from
        the royal stores. Only a state that collected a huge surplus, and kept
        careful accounts of it, could do that for twenty years.

        The pyramid shows something else as well: one man, the king, at the top
        of everything.
      `,
    },
    {
      id: 'teach-sumer',
      type: 'info',
      title: 'Cities of mud brick',
      text: `
        The cities of Sumer, in the south of Mesopotamia, were built of mud
        brick. Uruk and Ur were two of them. At the heart of each stood a
        **ziggurat**: a stepped temple tower.

        Scribes kept the accounts of grain and animals on **clay tablets**,
        and did their sums in sixties, not tens.

        The cities had walls, and fought each other constantly. Much later,
        about 1754 BCE, **Hammurabi**, king of Babylon, had his laws carved
        in stone for all to see.
      `,
      figure: {
        type: 'world-map', view: [37, 27.5, 53, 38.5], zoom: false, dots: false, rivers: ['Tigris', 'Euphrates'],
        markers: [
          mark('uruk', { color: 'red', labelPos: 'left' }),
          mark('ur', { color: 'red', labelPos: 'right' }),
          mark('babylon', { color: 'orange', shape: 'square', labelPos: 'left' }),
        ],
        labels: [{ at: [41.6, 32.4], text: 'Iraq', style: 'area' }],
        alt: 'A map of Iraq and its neighbours with the Tigris and the Euphrates drawn in bold, flowing south-east to the Persian Gulf. Uruk and Ur, two cities of Sumer, are marked close together in the far south. Babylon is marked further north-west, on the Euphrates.',
      },
    },
    {
      id: 'standard-of-ur',
      type: 'interact',
      title: 'Read the picture',
      text: `
        This box was buried in a royal tomb at **Ur**, in Mesopotamia, about
        2500 BCE. It is made of shell, red limestone and blue lapis lazuli from
        mountains more than 2,000 km away. This side shows a feast.

        Sumerian artists drew the most important person biggest. **Tap the ruler.**
      `,
      widget: photo(MEDIA['standard-of-ur'], {
        alt: 'A long panel of pale shell figures on a dark blue background, in three rows. In the top row a line of seated people hold cups, facing one seated figure at the left who is larger than the rest; at the right a musician holds a lyre. In the middle row men lead bulls, sheep and goats. In the bottom row men carry heavy bundles on their backs and lead donkeys.',
        creditLabel: 'Object',
        hotspots: [
          { id: 'king', x: 0.2, y: 0.19, r: 0.06, label: 'The ruler', alt: 'a large seated figure near the left end of the top row' },
          { id: 'guests', x: 0.55, y: 0.2, r: 0.06, label: 'Guests at the feast', alt: 'seated figures holding cups in the top row' },
          { id: 'musician', x: 0.87, y: 0.19, r: 0.05, label: 'A musician with a lyre', alt: 'a standing figure with a lyre at the right end of the top row' },
          { id: 'herders', x: 0.74, y: 0.5, r: 0.06, label: 'Men bringing animals', alt: 'a man leading an animal in the middle row' },
          { id: 'porters', x: 0.14, y: 0.8, r: 0.06, label: 'Porters with loads', alt: 'men bent under bundles in the bottom row' },
        ],
      }),
      check: (s) => s.picked === 'king' || (s.picked === 'guests' ? 'These are guests. Look for a figure in the same row who is larger than they are.' : s.picked === 'musician' ? 'That is a musician playing for the feast. Look at the other end of the same row.' : s.picked ? 'These people are bringing things *to* the feast. The ruler is the one being served.' : false),
      solution: { picked: 'king' },
      hints: ['Look along the top row for a seated figure who is bigger than the others and wears a skirt of tufts.'],
      explain: `
        The ruler sits at the top, larger than his guests, with a cup in his
        hand, while a musician plays the lyre. Below come the people who make
        the feast possible: herders with their animals, and porters bent under
        their loads.

        It is a picture of the new kind of society: farmers and labourers at the
        bottom, a few specialists and nobles in the middle, a king above all.
        The blue stone shows how far a city's trade already reached.
      `,
    },
    {
      id: 'indus',
      type: 'choice',
      title: 'Cities without names',
      text: `
        At **Mohenjo-daro**, on the Indus, streets ran on a grid, and houses had
        bathrooms draining into covered sewers. Bricks had the same proportions
        in cities 600 km apart, and so did the weights traders used. This
        watertight pool of baked brick is 12 metres long.

        No palace or royal tomb has been found, and nobody can read the Indus
        script. **What is the most careful conclusion?**
      `,
      figure: photo(MEDIA['great-bath'], {
        alt: 'The ruins of a city of pale brown brick under a clear sky. In the foreground is a large rectangular pool sunk into the ground, lined with brick, with a flight of brick steps leading down into it. Low brick walls spread out behind it, up to a mound with a round tower on top.',
        caption: 'The Great Bath, Mohenjo-daro, Pakistan, about 2500 BCE',
      }),
      options: [
        { text: 'The cities shared rules and standards, but we do not know who set them', correct: true },
        { text: 'One all-powerful king ruled, as in Egypt', why: 'Possible, but nothing shows it: no palace, no royal statues, no grand tombs. That absence is the puzzle.' },
        { text: 'Nobody was in charge of anything', why: 'Matching bricks, matching weights and city-wide drains do not happen by accident. Someone planned and enforced them.' },
      ],
      explain: `
        The Indus cities were as large and as well built as any of their time,
        and they traded with Mesopotamia by sea. But with no texts we can read,
        we know them only from what they left in the ground.

        After about 1900 BCE the cities emptied. Why is still debated: a weaker
        monsoon and shifting rivers are the leading explanations. People moved
        to villages; they did not vanish.
      `,
    },
    {
      id: 'shang',
      type: 'info',
      title: 'Bronze on the Yellow River',
      text: `
        In northern China the Yellow River carries so much fine yellow soil that
        it built a vast, fertile plain. There the **Shang** kings ruled from about
        1600 BCE. Their last capital, from about 1250 BCE, was **Anyang**.

        Shang craftsmen cast bronze like no one else. This vessel for offering
        food to the ancestors stands 1.3 metres tall (that is a mobile phone by
        its foot) and weighs more than **800 kg**: the metal had to be poured
        from many furnaces at once. A king had it made in honour of his
        mother, a queen.

        Another royal wife, **Fu Hao**, led armies; the records of her campaigns
        were scratched on *oracle bones*, which you will meet in the next lesson.
      `,
      figure: photo(MEDIA['shang-ding'], {
        alt: 'A massive rectangular bronze vessel, green with age, standing on four thick cylindrical legs, with two upright handles on its rim and bands of decoration around its sides. A mobile phone lying by one leg looks tiny beside it.',
        caption: 'The Houmuwu ding, Anyang, China, about 1200 BCE',
        creditLabel: 'Object',
      }),
    },
    {
      id: 'find-country',
      type: 'interact',
      review: true,
      gen: (rng) => countryQuiz(rng, COUNTRY, {
        view: [24, 8, 124, 46],
        pickable: ['EG', 'IQ', 'PK', 'CN', 'IR', 'IN', 'SA', 'TR', 'SY', 'AF', 'SD', 'LY', 'MN', 'KZ', 'TM', 'UZ'],
        alt: 'A map from north-east Africa to China, without country names. Five rivers are drawn and named: the Nile, the Tigris, the Euphrates, the Indus and the Yellow River.',
        extra: { rivers: RIVERS },
      }),
    },
    {
      id: 'others',
      type: 'interact',
      title: 'Not only four',
      text: `
        "Four river valleys" is a tradition, not a full count. In Peru, at
        **Caral**, people raised great stone platforms about 2600 BCE, when the
        pyramids of Giza were new. They grew cotton for fishing nets and had no
        pottery at all.

        Caral lay in a short river valley that crosses a **coastal desert**.
        **Which marker is it?**
      `,
      widget: {
        type: 'world-map', view: [-112, -42, -34, 30], mode: 'pickMarker', markerLabels: 'after', answer: 'caral', zoom: false,
        markers: [
          { id: 'la-venta', at: at('la-venta'), label: 'La Venta (Olmec)' },
          { id: 'amazon', at: [-62, -3.5], label: 'Amazon rainforest' },
          { id: 'caral', at: at('caral'), label: 'Caral' },
          { id: 'pampas', at: [-62, -35], label: 'Pampas grassland' },
        ],
        alt: 'A map of Central and South America without names. Four lettered markers: one on the southern coast of the Gulf of Mexico, one in the middle of the Amazon basin, one on the Pacific coast of Peru and one on the plains of Argentina.',
      },
      check: (s) => s.picked === 'caral' || (s.picked === 'amazon' ? 'That is the Amazon basin, one of the wettest places on Earth.' : s.picked === 'la-venta' ? 'That is the wet, green Gulf coast of Mexico. Think of the dry Pacific coast below the Andes.' : s.picked === 'pampas' ? 'That is the Pampas, a grassland with steady rain. Think of the dry Pacific coast below the Andes.' : false),
      solution: { picked: 'caral' },
      hints: ['In *The World at a Glance* you saw that cold ocean currents make coastal deserts. Which coast of South America has one?'],
      explain: `
        Marker C: the desert coast of Peru, where rivers from the Andes cross
        sand on their way to the Pacific. Once again: a river, dry land, irrigation.

        Marker A is **La Venta**, a centre of the **Olmec**, who from about 1200 BCE
        built earth mounds and carved colossal stone heads on Mexico's Gulf coast.
        Neither people had any contact with Egypt or Sumer. Cities were invented
        more than once.
      `,
    },
    {
      id: 'teach-timeline',
      type: 'info',
      title: 'All of them on one line',
      text: `
        Here are the peoples of this lesson side by side in time. **Tap a dot
        or the bar** to read its date.

        Notice two things:

        - Mesopotamia and Egypt come first. The Indus cities follow, and the
          Shang kings at Anyang come more than a thousand years after that.
        - Caral, in Peru, is as old as the Great Pyramid.
      `,
      figure: {
        type: 'timeline', from: -3600, to: -800, step: 400, mode: 'explore', showYears: true,
        events: [
          dot('uruk-city', 'Uruk, first big city', 'orange', 'Uruk'),
          dot('egypt-unified', 'Egypt united', 'yellow', 'Egypt'),
          dot('caral', 'Caral', 'green'),
          dot('pyramid', 'Great Pyramid', 'yellow', 'Pyramid'),
          dot('hammurabi', 'Hammurabi\'s laws', 'orange', 'Hammurabi'),
          dot('shang-anyang', 'Shang at Anyang', 'red', 'Anyang'),
          dot('olmec', 'Olmec stone heads', 'green', 'Olmec', -1200),
        ],
        spans: [{ id: 'indus', from: -2600, to: -1900, label: 'Indus cities', color: 'teal', note: `**${EVENTS['indus-peak'].when.charAt(0).toUpperCase()}${EVENTS['indus-peak'].when.slice(1)}.** ${EVENTS['indus-peak'].text}.` }],
        alt: 'A timeline from 3600 BCE to 800 BCE. Uruk grows into the first big city about 3300 BCE; Egypt is united about 3100 BCE; Caral and the Great Pyramid are built about 2600 BCE; the Indus cities are at their height from about 2600 to 1900 BCE; Hammurabi has his laws carved about 1754 BCE; the Shang kings rule from Anyang from about 1250 BCE; the Olmec carve stone heads from about 1200 BCE.',
      },
    },
    {
      id: 'mammoth',
      type: 'choice',
      mode: 'predict',
      title: 'A test of your timeline',
      text: `
        Woolly mammoths belong to the Ice Age, and pyramids to "ancient history".

        **Which came first: the finished Great Pyramid, or the death of the last mammoth?**
      `,
      shuffle: false,
      options: [
        { text: 'The last mammoth died long before the pyramid was built' },
        { text: 'The pyramid was finished first', correct: true },
      ],
      figure: {
        type: 'world-map', view: 'world', center: 100, zoom: false,
        markers: [mark('giza', { color: 'orange', label: 'Great Pyramid' }), mark('wrangel', { color: 'blue', labelPos: 'left' })],
        alt: 'A world map with two markers: the Great Pyramid in Egypt and Wrangel Island in the Arctic Ocean, north of eastern Siberia.',
      },
      explain: `
        **The pyramid.** Mammoths vanished from the continents about 10,000 years
        ago, but a small herd lived on at Wrangel Island in the Arctic until
        about 4,000 years ago. By then the Great Pyramid had been standing for
        some five centuries.

        "Ancient" covers a very long time.
      `,
    },
    {
      id: 'cleopatra',
      type: 'choice',
      text: `
        **Cleopatra**, the last pharaoh of Egypt, died in 30 BCE. Use the line to
        decide: was she nearer in time to the building of the Great Pyramid, or
        to the first Moon landing?
      `,
      figure: {
        type: 'timeline', from: -3000, to: 2000, step: 1000, showYears: true,
        events: [
          { id: 'pyr', year: -2560, label: 'Great Pyramid', short: 'Pyramid', color: 'orange' },
          { id: 'cleo', year: -30, label: 'Cleopatra dies', short: 'Cleopatra', color: 'red' },
          { id: 'moon', year: 1969, label: 'Moon landing', short: 'Moon', color: 'blue' },
        ],
        alt: 'A timeline from 3000 BCE to 2000 CE with three events: the Great Pyramid about 2560 BCE, the death of Cleopatra in 30 BCE and the Moon landing in 1969.',
      },
      shuffle: false,
      options: [
        { text: 'Nearer to the pyramid', why: 'From 2560 BCE to 30 BCE is about 2,530 years. From 30 BCE to 1969 is just under 2,000.' },
        { text: 'Nearer to the Moon landing', correct: true },
        { text: 'Exactly halfway', why: 'Close, but not quite: about 2,530 years on one side and just under 2,000 on the other.' },
      ],
      explain: `
        About 2,530 years separate Cleopatra from the pyramid's builders, and
        just under 2,000 separate her from the Moon landing. To her the pyramids
        were already ancient monuments from a half-forgotten age.

        Egyptian civilisation lasted some 3,000 years: longer than the time from
        Cleopatra to us.
      `,
    },
    {
      id: 'signature',
      type: 'match',
      review: true,
      text: '**Match each early civilisation with what it is known for.**',
      pairs: [
        ['Mesopotamia (Tigris and Euphrates)', 'Stepped temple towers and clay tablets'],
        ['Egypt (Nile)', 'Stone pyramids and hieroglyphs'],
        ['Indus valley', 'Grid-plan cities with covered drains'],
        ['Shang China (Yellow River)', 'Giant bronze vessels and oracle bones'],
        ['Caral (Peru)', 'Stone platforms, cotton nets, no pottery'],
      ],
      explain: `
        Sumerian cities were built around a **ziggurat**, a stepped temple tower of
        mud brick, and kept their accounts on clay. Egypt built in stone. The
        Indus cities were planned and drained. The Shang cast bronze. Caral shows
        that the Americas built monuments just as early, entirely on their own.
      `,
    },
    {
      id: 'order-rivers',
      type: 'order',
      review: true,
      text: '**Put these in order**, from the earliest to the latest.',
      gen: (rng) => orderEvents(rng, ORDER_POOL, { n: 4, gap: 150, fallback: ['uruk-city', 'pyramid', 'shang-anyang', 'cleopatra'] }),
    },
    {
      id: 'echo-sixty',
      type: 'fill',
      review: true,
      title: 'An echo on your wrist',
      text: `
        The scribes of Mesopotamia did their arithmetic in **sixties**, not tens.
        Their way of counting time and angles was never replaced.
      `,
      template: 'That is why an hour still has [[60]] minutes, a minute has [[60]] seconds, and a full circle has [[360]] degrees.',
      explain: `
        Sixty divides evenly by 2, 3, 4, 5 and 6, which makes sharing out grain
        or dividing a circle easy. Babylonian astronomers split the circle into
        360 parts, and Greek astronomers borrowed the scheme. Every clock and
        every map grid still uses it.
      `,
    },
  ],
  recap: [
    'The first cities grew beside **rivers in dry lands**: Tigris and Euphrates, Nile, Indus, Yellow River. Irrigation gave a large, dependable surplus.',
    'Surplus fed **specialists and rulers**: scribes, builders, priests, kings. Pyramids, ziggurats and planned cities are what organised surplus looks like.',
    'Cities also arose independently in the Americas: **Caral** in Peru about 2600 BCE, the **Olmec** in Mexico from about 1200 BCE.',
    '"Ancient" is long: the Great Pyramid (about 2560 BCE) is older than the last mammoths, and Cleopatra lived nearer to us than to its builders.',
  ],
  next: 'Next: all that grain had to be counted. Out of the counting came one of the most powerful inventions of all: writing.',
};
