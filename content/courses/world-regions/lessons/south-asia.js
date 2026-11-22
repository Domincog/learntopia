// Around the World: Places and Cultures · Lesson 4 · South Asia: Mountains and Monsoon
//
// Driving question: how do a wall of mountains and a seasonal wind feed a quarter of humanity?
import { FIND, PICKABLE, VIEW, FEATURES, LANDMARKS, NOT_THE_BIGGEST, findCountry, tapCity, tapFeature, whichPhoto, landmarkFigure, inOrder, countriesMap, citiesMap, featuresMap } from '../helpers.js';

// How the lesson teaches its tables: the seven countries of FIND.southAsia on one map with their capitals,
// the five anchors the opening map does not name, and the seven big cities that are not capitals.
const COUNTRIES = { ids: ['IN', 'PK', 'AF', 'NP', 'BT', 'BD', 'LK'], capitals: ['New Delhi', 'Islamabad', 'Kabul', 'Kathmandu', 'Thimphu', 'Dhaka'] };
const MORE_ANCHORS = ['the Hindu Kush', 'the Ganges Plain', 'the Ganges Delta', 'the Indus Delta', 'Sri Lanka'];
const BIG_CITIES = ['Mumbai', 'Kolkata', 'Chennai', 'Bengaluru', 'Karachi', 'Lahore', 'Colombo'];

const CITIES = [
  { name: 'New Delhi', clue: 'the capital of India, on the northern plain', hint: 'It stands on a tributary of the Ganges, far inland in the north.', fact: 'New Delhi is one district of the vast city of Delhi, home to more than 30 million people.' },
  { name: 'Mumbai', clue: 'India\'s greatest port and the home of its Hindi film industry, on the west coast', hint: 'It faces the Arabian Sea, about half-way down the west coast.', fact: 'Mumbai was once called Bombay: that is the B in "Bollywood". India makes more films a year than any other country, in more than twenty languages.' },
  { name: 'Kolkata', clue: 'the great city of Bengal, near the mouth of the Ganges', hint: 'Look in the east, just inland from the Bay of Bengal, close to Bangladesh.', fact: 'Kolkata (Calcutta) was the capital of British India until 1911.' },
  { name: 'Chennai', clue: 'the largest city of the Tamil-speaking south, on the east coast', hint: 'It is on the Bay of Bengal, on the south-east coast of India.', fact: 'Chennai, formerly Madras, is the capital of the state of Tamil Nadu.' },
  { name: 'Bengaluru', clue: 'India\'s technology capital, up on the plateau of the inland south', hint: 'It is inland, in the middle of the southern peninsula.', fact: 'Bengaluru (Bangalore) sits about 900 metres up on the Deccan, which keeps it cooler than the coasts.' },
  { name: 'Karachi', clue: 'Pakistan\'s largest city and main port, on the Arabian Sea', hint: 'It lies close to the mouth of the Indus.', fact: 'Karachi was Pakistan\'s first capital, and is still by far its largest city.' },
  { name: 'Lahore', clue: 'the old capital of the Punjab, in Pakistan, close to the Indian border', hint: 'It is in the north, in the plain of the five rivers that feed the Indus.', fact: 'Lahore is only about 50 km from Amritsar and its Golden Temple, on the other side of the border drawn in 1947.' },
  { name: 'Islamabad', clue: 'the capital of Pakistan, at the foot of the northern mountains', hint: 'It is in the far north of the country, where the plain meets the hills.', fact: NOT_THE_BIGGEST.PK[1] },
  { name: 'Dhaka', clue: 'the capital of Bangladesh, in the middle of the great delta', hint: 'Find the delta of the Ganges and Brahmaputra; it is in the middle of it.', fact: 'Dhaka is one of the most densely packed cities on Earth.' },
  { name: 'Kathmandu', clue: 'the capital of Nepal, in a valley of the Himalaya', hint: 'It is in the mountains directly north of the Ganges plain.', fact: 'Kathmandu lies about 1,400 metres above sea level.' },
  { name: 'Colombo', clue: 'the largest city of Sri Lanka, on its west coast', hint: 'It is on the island off India\'s southern tip.', fact: 'Colombo has been a port of call for ships crossing the Indian Ocean for many centuries.' },
  { name: 'Kabul', clue: 'the capital of Afghanistan, high among the mountains of the Hindu Kush', hint: 'It is in the far north-west of the map.', fact: 'Kabul lies about 1,800 metres above sea level.' },
];

export default {
  id: 'south-asia',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A crowded corner',
      text: `
        The coloured countries make up **South Asia**. Together they cover
        less than 4% of the world's land.

        **What share of the world's people do you think live there?**
      `,
      figure: {
        type: 'world-map', static: true,
        regions: [{ ids: ['IN', 'PK', 'BD', 'NP', 'BT', 'LK', 'AF', 'MV'], color: 'orange', label: 'South Asia' }], legend: false,
        alt: 'A world map with South Asia highlighted: India, Pakistan, Bangladesh, Nepal, Bhutan, Sri Lanka, Afghanistan and the Maldives, a small part of the world\'s land',
      },
      min: 0, max: 50, step: 1, start: 4, answer: 25, tolerance: 3, unit: '%',
      explain: `
        About **a quarter**: two billion people. India alone, since 2023 the
        most populous country on Earth, has more than 1.4 billion.

        Feeding that many people takes a great deal of water and good soil.
        The question for this lesson:
        **how do a wall of mountains and a seasonal wind feed a quarter of humanity?**
      `,
    },
    {
      id: 'land',
      type: 'info',
      title: 'A wall, three rivers and a wind',
      text: `
        The **Himalaya**, the highest mountains on Earth, wall the region
        off from the rest of Asia. Their snow and ice feed three great
        rivers: the **Indus**, the **Ganges** and the **Brahmaputra**.

        Each summer the **monsoon** (you met it in *The World at a Glance*)
        blows wet air in from the ocean. The mountains force it to rise, and
        it drops its rain. One village in the hills of north-east India gets
        nearly twelve metres of rain a year; the **Thar Desert**, in the
        west, gets very little.

        Between mountains and sea, the rivers have laid down some of the
        most fertile, most crowded farmland in the world.
      `,
      figure: {
        type: 'world-map', view: VIEW.southAsia, rivers: ['Indus', 'Ganges', 'Brahmaputra'],
        labels: [
          { at: [80.2, 30.6], text: 'Himalaya', style: 'area' },
          { at: [77.5, 17.5], text: 'Deccan', style: 'area' },
          { at: [71.3, 27], text: 'Thar Desert', style: 'area' },
          { at: [64.5, 16], text: 'Arabian Sea', style: 'water' },
          { at: [89, 14.5], text: 'Bay of Bengal', style: 'water' },
          'IN',
        ],
        lines: [
          { points: [[62, 10], [68, 15], [72.5, 18.5]], color: 'teal', arrow: true, width: 3, label: 'Summer monsoon winds' },
          { points: [[84, 8], [88.5, 15], [90, 21]], color: 'teal', arrow: true, width: 3 },
        ],
        alt: 'South Asia: the Himalaya along the north, the Indus flowing south-west through Pakistan, the Ganges flowing east across northern India, the Brahmaputra joining it in Bangladesh. Arrows show the summer monsoon blowing from the Arabian Sea and the Bay of Bengal onto the land.',
      },
    },
    {
      id: 'teach-anchors',
      type: 'info',
      title: 'Five more places to steer by',
      text: `
        You have the **Himalaya**, the **Thar Desert**, the
        **Bay of Bengal** and the **Deccan Plateau**, the raised triangle
        that fills the south of the peninsula. Add five more.

        - The **Hindu Kush** is the range that crosses Afghanistan, west of
          the Himalaya.
        - The **Ganges Plain** is the flat, fertile, crowded lowland below
          the mountains.
        - A **delta** is the low land a river builds where it meets the sea.
          The **Ganges Delta**, shared with the Brahmaputra, is the largest
          in the world. The **Indus Delta** is on the Arabian Sea.
        - **Sri Lanka** is the island off the southern tip of India.
      `,
      figure: featuresMap(FEATURES.southAsia, {
        view: 'southAsia', names: MORE_ANCHORS, pos: { 'the Ganges Plain': 'left', 'the Ganges Delta': 'right', 'the Indus Delta': 'left', 'the Hindu Kush': 'top' },
        extra: { rivers: ['Indus', 'Ganges', 'Brahmaputra'] },
      }),
    },
    {
      id: 'anchors',
      type: 'interact',
      title: 'The lie of the land',
      gen: (rng) => tapFeature(rng, FEATURES.southAsia, { view: 'southAsia', minKm: 400 }),
    },
    {
      id: 'teach-countries',
      type: 'info',
      title: 'Seven countries',
      text: `
        Each country has its **capital**, the seat of its government, in
        brackets; a [red star]{.red} shows where the capital stands.

        **India** (New Delhi) is the great triangle that points into the
        Indian Ocean. **Pakistan** (Islamabad) lies north-west of it, along
        the Indus, and mountainous **Afghanistan** (Kabul) beyond Pakistan.

        **Nepal** (Kathmandu) is the long rectangle along the Himalaya, with
        the small kingdom of **Bhutan** (Thimphu) to the east of it.
        **Bangladesh** (Dhaka) sits on the great delta, almost surrounded by
        India. **Sri Lanka** is the teardrop-shaped island in the south.
      `,
      figure: countriesMap(COUNTRIES.ids, { view: 'southAsia', capitals: COUNTRIES.capitals, at: { IN: [78.5, 21.5], NP: [83.2, 29.9], BT: [92.6, 28.9], BD: [91.8, 21.2], PK: [67.5, 28.8], AF: [65.5, 32.8], LK: [84.2, 7.6] } }),
    },
    {
      id: 'find-country',
      type: 'interact',
      review: true,
      title: 'Find the country',
      gen: (rng) => findCountry(rng, FIND.southAsia, PICKABLE.southAsia),
    },
    {
      id: 'rice-or-wheat',
      type: 'choice',
      title: 'Rain on the plate',
      text: `
        Rice grows standing in water. Wheat needs far less.

        The monsoon soaks the east and the south of the region, and leaves
        the north-west fairly dry.
        **Where would you expect rice, rather than bread, to be the everyday food?**
      `,
      options: [
        { text: 'In the east and the south: Bengal, the coasts, Sri Lanka', correct: true },
        { text: 'In the north-west: Punjab and Pakistan', why: 'That is the drier side. There the staple is wheat, baked into flat breads such as roti and naan.' },
        { text: 'High in the Himalaya', why: 'Too cold and too steep for much rice: mountain farmers grow barley, millet and potatoes.' },
      ],
      explain: `
        **Rice** in the wet east and south; **wheat breads** in the drier
        north-west. Geography reaches all the way to the dinner plate.

        Outsiders call it all "curry", but the region has hundreds of
        cuisines. And one thing they share is quite new: the chilli came
        from the Americas, only after 1500 (see *One World*).
      `,
    },
    {
      id: 'languages',
      type: 'info',
      title: 'Two families, twenty scripts',
      text: `
        There is no language called "Indian". India's constitution lists
        **22 languages**, and a rupee banknote states its value in 17.

        Most languages of the north, such as **Hindi**, **Bengali** and
        **Punjabi**, belong to the **Indo-Aryan** family: distant cousins of
        Persian and English. The four great languages of the far south,
        **Tamil**, **Telugu**, **Kannada** and **Malayalam**, are
        **Dravidian**, a family found almost nowhere else.

        Many have a script of their own. Hindi and **Urdu**, the national
        language of Pakistan, are so close that speakers understand each
        other, but they are written in two quite different scripts.
      `,
      figure: {
        type: 'world-map', view: VIEW.southAsia,
        areas: [{ polygon: [[74.2, 15], [77.5, 18.5], [80.5, 19.6], [84.6, 19], [80.3, 13.2], [80, 10], [77.6, 8], [76.3, 9.5], [74.8, 12.5]], color: 'violet', label: 'Dravidian languages (roughly)', labelAt: [70, 9] }],
        labels: [
          { at: [79.5, 26], text: 'Hindi', style: 'area' },
          { at: [89.5, 24.2], text: 'Bengali', style: 'area' },
          { at: [74.3, 31], text: 'Punjabi', style: 'area' },
          { at: [68.5, 28], text: 'Urdu', style: 'area' },
          { at: [75.8, 19.8], text: 'Marathi', style: 'area' },
          { at: [84, 28], text: 'Nepali', style: 'area' },
          { at: [78.5, 11], text: 'Tamil', style: 'area' },
          { at: [79.3, 16.6], text: 'Telugu', style: 'area' },
          { at: [80.8, 7], text: 'Sinhala', style: 'area' },
        ],
        alt: 'South Asia with language names written where they are spoken: Punjabi, Urdu, Hindi, Nepali, Bengali and Marathi across the north and centre, Sinhala in Sri Lanka, and Tamil and Telugu inside a shaded area covering the southern tip of India, labelled Dravidian languages.',
      },
    },
    {
      id: 'family-sort',
      type: 'bucket',
      review: true,
      text: 'Sort these South Asian languages into their two families.',
      buckets: ['Indo-Aryan (mostly northern)', 'Dravidian (southern)'],
      items: [
        { text: 'Hindi', bucket: 0 },
        { text: 'Bengali', bucket: 0 },
        { text: 'Punjabi', bucket: 0 },
        { text: 'Urdu', bucket: 0, why: 'Urdu is written in an Arabic-based script, but its grammar and everyday words are almost the same as Hindi\'s.' },
        { text: 'Nepali', bucket: 0 },
        { text: 'Tamil', bucket: 1 },
        { text: 'Telugu', bucket: 1 },
        { text: 'Kannada', bucket: 1 },
        { text: 'Malayalam', bucket: 1 },
      ],
      explain: `
        **Indo-Aryan**: Hindi, Urdu, Bengali, Punjabi, Marathi, Nepali, and
        also Sinhala, far away in Sri Lanka. **Dravidian**: the four great
        languages of southern India, Tamil, Telugu, Kannada and Malayalam.
        Tamil has a written literature more than 2,000 years old.
      `,
    },
    {
      id: 'teach-faiths',
      type: 'info',
      title: 'Birthplace of four religions',
      text: `
        **Hinduism**, **Buddhism**, **Jainism** and **Sikhism** all began in
        South Asia (see *First Worlds*). **Islam** arrived later, with
        traders and conquerors, and today about a third of the world's
        Muslims live here.

        Most people in [India and Nepal]{.orange} are **Hindu**. Most people
        in [Pakistan and Bangladesh]{.green} are **Muslim**.

        Buddhism was born in the Ganges plain, but it faded in India itself
        and lives on at the edges: most people in
        [Sri Lanka and Bhutan]{.violet} are **Buddhist**.
      `,
      figure: {
        type: 'world-map', view: VIEW.southAsia, dots: false,
        regions: [
          { ids: ['IN', 'NP'], color: 'orange', label: 'Mostly Hindu' },
          { ids: ['PK', 'BD'], color: 'green', label: 'Mostly Muslim' },
          { ids: ['LK', 'BT'], color: 'violet', label: 'Mostly Buddhist' },
        ],
        labels: [{ at: [78.5, 21.5], text: 'India', style: 'name' }, 'PK', { at: [83.2, 29.9], text: 'Nepal', style: 'name' }, { at: [92.6, 28.9], text: 'Bhutan', style: 'name' }, { at: [91.8, 21.2], text: 'Bangladesh', style: 'name' }, { at: [84.2, 7.6], text: 'Sri Lanka', style: 'name' }],
        alt: 'South Asia coloured by the faith most people follow: India and Nepal mostly Hindu, Pakistan and Bangladesh mostly Muslim, Sri Lanka and Bhutan mostly Buddhist.',
      },
    },
    {
      id: 'faiths',
      type: 'fill',
      title: 'Who follows what?',
      text: `
        Complete the summary of which faith most people follow in each
        country.
      `,
      template: `
        In India and Nepal, most people are [[*Hindu|Muslim|Buddhist]].

        In Pakistan and Bangladesh, most people are [[Hindu|*Muslim|Buddhist]].

        In Sri Lanka and Bhutan, most people are [[Hindu|Muslim|*Buddhist]].
      `,
      explain: `
        India is about four-fifths Hindu, but it is so large that its Muslim
        minority, about 200 million people, is one of the three largest
        Muslim populations in the world.

        The calendar is full of festivals: Diwali, the Hindu festival of
        lights; Holi, with its clouds of colour; Eid, at the end of Ramadan;
        Vesak, the Buddha's birthday; Vaisakhi, sacred to Sikhs.
      `,
    },
    {
      id: 'partition',
      type: 'interact',
      title: 'Why the borders are where they are',
      text: `
        Until 1947 most of this region was ruled by Britain as one
        territory. At independence it was **partitioned** (see
        *The Modern World*): the mainly Muslim north-west and north-east became
        **Pakistan**, in two parts 1,600 km apart, and the rest became
        **India**.

        In 1971 the eastern part broke away as a country of its own.
        **Tap it.**
      `,
      widget: {
        type: 'world-map', view: VIEW.southAsia, mode: 'pick', pickable: PICKABLE.southAsia, answer: 'BD',
        alt: 'A map of South Asia without names',
      },
      check: (s) => {
        if (s.picked === 'BD') return true;
        if (s.picked === 'PK') return 'That is today\'s Pakistan, which was the western part. The eastern part lay on the far side of India.';
        if (s.picked === 'IN') return 'That is India. The country you want is small, on India\'s eastern side, on the great delta.';
        if (s.picked === 'MM') return 'That is Myanmar, which was never part of Pakistan. Look just west of it, on the delta.';
        return s.picked ? `That is ${s.nameThe || s.name}. Look in the east, where the Ganges and the Brahmaputra reach the sea.` : 'Tap a country first.';
      },
      solution: { picked: 'BD' },
      hints: ['It lies on the delta of the Ganges and the Brahmaputra, almost surrounded by India.'],
      explain: `
        **Bangladesh**, "the land of Bengal", was East Pakistan until 1971.

        Partition was one of the largest forced migrations in history. About
        15 million people fled across the new borders, Hindus and Sikhs one
        way, Muslims the other, and several hundred thousand, perhaps more
        than a million, were killed. Its marks are still on the map:
        **Kashmir**, in the far north, is claimed by both India and
        Pakistan, and each controls a part of it (the dashed lines).
      `,
    },
    {
      id: 'taj',
      type: 'choice',
      mode: 'predict',
      title: 'What is it for?',
      text: `
        You may know this building's name. But do you know what it is?

        **What do you think it was built to be?**
      `,
      figure: landmarkFigure('taj-mahal', { caption: 'Agra, northern India, built from 1632 to 1653' }),
      options: [
        { text: 'A palace for an emperor' },
        { text: 'A mosque' },
        { text: 'A tomb', correct: true },
        { text: 'A Hindu temple' },
      ],
      explain: `
        The **Taj Mahal** is a **tomb**. The Mughal emperor Shah Jahan built
        it for his wife Mumtaz Mahal, who died in 1631 giving birth to their
        fourteenth child.

        The Mughals (see *One World*) were Muslim rulers of a mostly Hindu
        land, with roots in Central Asia. Their building shows it: a dome
        and four minarets in the Persian manner, set in a garden, and made
        by Indian craftsmen in white marble inlaid with coloured stones.
      `,
    },
    {
      id: 'teach-landmarks',
      type: 'info',
      title: 'A shrine and a rock',
      text: `
        Two more sights to know beside the Taj Mahal.

        The **Golden Temple** stands in a pool at Amritsar, in the north of
        India. ${LANDMARKS['golden-temple'].fact}

        **Sigiriya** rises out of the forest of central Sri Lanka.
        ${LANDMARKS.sigiriya.fact}
      `,
      figure: [
        landmarkFigure('golden-temple', { aspect: '4:3', fit: 'cover' }),
        landmarkFigure('sigiriya', { aspect: '4:3', fit: 'cover', focus: [0.28, 0.5] }),
      ],
    },
    {
      id: 'which-landmark',
      type: 'choice',
      review: true,
      gen: (rng) => whichPhoto(rng, ['taj-mahal', 'golden-temple', 'sigiriya'], ['taj-mahal', 'golden-temple', 'sigiriya', 'hagia-sophia', 'djenne-mosque', 'angkor-wat']),
    },
    {
      id: 'when',
      type: 'order',
      title: 'Forty-five centuries',
      text: `
        The cities of the Indus valley, among the first cities anywhere,
        were at their height about 2500 BCE. The Buddha taught about 2,000
        years after that. The rest you have met in this lesson.

        **Put these in order, earliest first.**
      `,
      items: inOrder(['indus', 'buddha', 'taj-mahal', 'partition', 'bangladesh']),
      labels: ['Earliest', 'Latest'],
      hints: ['The Taj Mahal was built for a Mughal emperor in the seventeenth century, long after the Buddha.', 'The last two events are both within living memory: Partition came first, and the eastern part of Pakistan broke away later.'],
      explain: `
        The Indus cities (about 2500 BCE), the Buddha (about the fifth
        century BCE), the Taj Mahal (finished 1653), independence and
        Partition (1947), Bangladesh (1971).

        The Indus cities were at their height while Egypt's pyramids were
        being built. And while the Taj Mahal was rising, Galileo was on
        trial in Rome.
      `,
    },
    {
      id: 'teach-cities',
      type: 'info',
      title: 'Seven great cities',
      text: [
        'Many of the region\'s biggest cities are not capitals. The [red stars]{.red} are the six capitals you know; the [blue dots]{.blue} are seven more cities to learn.',
        '',
        ...BIG_CITIES.map((name) => `- **${name}**: ${CITIES.find((c) => c.name === name).clue}`),
      ].join('\n'),
      figure: citiesMap(BIG_CITIES, { view: 'southAsia', unnamed: COUNTRIES.capitals, pos: { Mumbai: 'left', Karachi: 'left', Bengaluru: 'left', Colombo: 'left', Lahore: 'left' } }),
    },
    {
      id: 'cities',
      type: 'interact',
      review: true,
      title: 'Great cities',
      gen: (rng) => tapCity(rng, CITIES, { view: 'southAsia', minKm: 400 }),
    },
    {
      id: 'echoes',
      type: 'match',
      title: 'Why is it like this?',
      text: 'Much of everyday life in South Asia is an echo of its past. **Match each thing you can see today to where it came from.**',
      pairs: [
        ['Cricket, followed by hundreds of millions', 'British rule'],
        ['Chillies in almost every kitchen', 'Trade with the Americas after 1500'],
        ['The border between India and Pakistan', 'The Partition of 1947'],
        ['Domes and minarets like the Taj Mahal\'s', 'The Mughal emperors'],
      ],
      explain: `
        Cricket arrived with the British and stayed; today India, Pakistan,
        Sri Lanka and Bangladesh are among the strongest teams in the world.

        And the lesson's question? The Himalaya store water as snow and ice
        and wring rain from the monsoon; the rivers spread that water and
        fresh soil across the plains. Mountains, wind and rivers together
        feed two billion people.
      `,
    },
  ],
  recap: [
    'South Asia holds about a quarter of the world\'s people on less than 4% of its land. India has been the most populous country since 2023.',
    'The Himalaya and the summer monsoon supply the water; the Indus, Ganges and Brahmaputra spread it over crowded, fertile plains.',
    'Northern languages (Hindi, Urdu, Bengali, Punjabi) are Indo-Aryan; southern ones (Tamil, Telugu, Kannada, Malayalam) are Dravidian.',
    'Hinduism, Buddhism, Jainism and Sikhism began here. The Partition of 1947 created India and Pakistan; Bangladesh followed in 1971.',
  ],
  next: 'Next: over the Himalaya to East Asia, where one writing system shaped a whole region.',
};
