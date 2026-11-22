// First Worlds: To 500 CE · Lesson 6 · Rome and Han
//
// Driving question: two empires of some fifty million people each, at opposite ends of Eurasia at the
// same time. How alike were they, and what did they know of each other?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-ancient/index.js';
import { at, mark, markerQuiz, countryQuiz, ROME_117, EVENTS, yearOf } from '../helpers.js';

// A dot on the lesson's timeline, with its date and wording taken from the course table.
const dot = (id, label, color, short = label) => ({
  id, year: yearOf(id), label, short, color,
  note: `**${EVENTS[id].when.charAt(0).toUpperCase()}${EVENTS[id].when.slice(1)}.** ${EVENTS[id].text}.`,
});

// Rough outlines. The Roman Empire at its greatest extent (117 CE; the outline is shared with the last lesson
// and lives in helpers.js) and the Han Empire about 100 CE.
const ROME = ROME_117;
const HAN = [[127, 39.5], [125, 40.5], [123, 42], [119, 42], [114, 41.5], [110, 41], [106, 40], [103, 39.5], [99, 40.5], [94, 40.8], [94, 39.5], [99, 38], [102, 36.5], [102, 33], [100, 29], [98.5, 25], [100, 22], [103, 21], [105, 18], [107, 16.5], [108.5, 17], [107, 20.5], [110, 20.5], [111, 19.5], [114, 22.3], [117, 23.5], [120, 27], [122, 30.5], [120.5, 34], [119.3, 35.3], [122.5, 37], [121, 37.7], [118, 38.3], [118, 39], [121.5, 40.8], [124.5, 39.9], [125.5, 38]];

const SILK_LAND = [at('changan'), [103.8, 36.1], at('dunhuang'), [83, 41.5], at('kashgar'), [69, 40], at('samarkand'), at('merv'), [51.5, 35.7], at('ctesiphon'), [38.3, 34.6], at('antioch')];
const SEA_WEST = [at('antioch'), [30, 35], [20, 36], [15.7, 37.9], [13.5, 40.5], at('rome')];
const SEA_INDIA = [[32.5, 30], [35, 26], [39, 19], [43.3, 12.6], [51, 12.5], [62, 12], [76.2, 10.2]];

const CITIES = [
  { place: 'rome', ask: 'Rome', about: 'it was the capital of an empire that ringed the whole Mediterranean.' },
  { place: 'antioch', ask: 'Antioch, the Roman city where caravans from Asia reached the Mediterranean', about: 'it stood in what is now southern Turkey.' },
  { place: 'merv', ask: 'Merv, an oasis city of the Parthians on the road between China and Rome', about: 'its ruins lie in what is now Turkmenistan.' },
  { place: 'dunhuang', ask: 'Dunhuang, the oasis where the Han frontier walls ended and the desert road began', about: 'caravans left China here for Central Asia.' },
  { place: 'changan', ask: 'Chang\'an, the first capital of the Han emperors', about: 'the city is now called Xi\'an.' },
  { place: 'pataliputra', ask: 'Pataliputra, capital of the Maurya and Gupta empires on the Ganges', about: 'it is now the Indian city of Patna.' },
  { place: 'meroe', ask: 'Meroë, capital of the kingdom of Kush on the Nile', about: 'its pyramids stand in what is now Sudan.' },
  { place: 'aksum', ask: 'Aksum, the trading kingdom in the highlands beside the Red Sea', about: 'the city of Aksum is in northern Ethiopia.' },
];

const STATES = [
  { place: 'rome', own: 'the homeland of the Romans', ask: 'the city of **Rome**', hint: 'look for the boot-shaped peninsula in the middle of the Mediterranean.', about: 'Rome began as a town on the River Tiber in **Italy**.' },
  { place: 'changan', own: 'the land the Han emperors ruled', ask: '**Chang\'an**, the first capital of the Han emperors', hint: 'the Han ruled the eastern end of Eurasia.', about: 'Chang\'an is today\'s Xi\'an, in **China**. Most Chinese still call themselves Han.' },
  { place: 'pataliputra', own: 'the heart of the Maurya and Gupta empires', ask: '**Pataliputra**, capital of the Maurya and Gupta empires', hint: 'it stood on the River Ganges.', about: 'Pataliputra is today\'s Patna, on the Ganges in **India**.' },
  { place: 'meroe', own: 'the land of ancient Kush', ask: '**Meroë**, the capital of Kush, with its fields of small, steep pyramids', hint: 'Kush lay on the Nile, upstream from Egypt.', about: 'Meroë stood beside the Nile in what is now **Sudan**, which has more pyramids than Egypt.' },
  { place: 'aksum', own: 'where the city of Aksum stands', ask: 'the city of **Aksum**, with its tall stone pillars', hint: 'it lies in the highlands at the southern end of the Red Sea.', about: 'the city of Aksum is in northern **Ethiopia**; its kingdom also took in what is now Eritrea.' },
  { place: 'ctesiphon', own: 'where the Parthian kings had their capital', ask: '**Ctesiphon**, the Parthian capital on the River Tigris', hint: 'look between the Tigris and the Euphrates.', about: 'Ctesiphon stood on the Tigris, near modern Baghdad in **Iraq**.' },
];

export default {
  id: 'rome-han',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Two emperors',
      text: `
        About 100 CE two emperors, 8,000 km apart, each believed he ruled the
        centre of the civilised world. One sat in **Rome**, the other in
        **Luoyang** in China.

        **What share of all the people on Earth do you think lived under one or the other?**
      `,
      min: 0, max: 100, step: 5, answer: 45, tolerance: 10, unit: '%', start: 10,
      explain: `
        Perhaps **nearly half**. A Han census of the year 2 CE counted about 58
        million people. No such count survives for Rome, but historians put its
        population at 45 to 60 million or more. The whole world then held perhaps
        250 million.

        Two states, the same size, at the same time, facing the same problems.
        How alike were their answers?
      `,
    },
    {
      id: 'two-empires',
      type: 'info',
      title: 'The two ends of Eurasia',
      text: `
        The **Roman Empire** ringed the Mediterranean, which Romans called simply
        "our sea". At its greatest extent, in 117 CE, it reached from Britain to
        Egypt and Mesopotamia.

        The **Han Empire** (206 BCE to 220 CE) covered the plains of the Yellow
        River and the Yangtze, and pushed a long arm west along the edge of the
        deserts towards Central Asia.

        Between them lay thousands of kilometres of mountain, steppe and desert,
        and two more empires: the **Parthians** in Iran, whose capital
        Ctesiphon stood on the Tigris, and the **Kushans** in Central Asia
        and northern India.

        Both empires built roads, counted their people and taxed them. Both
        guarded a long northern frontier with walls: Hadrian's Wall across
        Britain, the Han walls in the north-west.
      `,
      figure: {
        type: 'world-map', view: [-12, 8, 132, 58], zoom: false,
        areas: [
          { polygon: ROME, color: 'red', label: 'Roman Empire', labelAt: [3, 45.5] },
          { polygon: HAN, color: 'teal', label: 'Han Empire', labelAt: [112, 25.5] },
        ],
        markers: [mark('rome', { labelPos: 'bottom' }), mark('changan', { label: 'Chang\'an', labelPos: 'bottom' }), mark('luoyang', { labelPos: 'top' })],
        labels: [{ at: [55, 33], text: 'Parthians', style: 'area' }, { at: [70, 35.5], text: 'Kushans', style: 'area' }],
        alt: 'A map of Europe and Asia. A red area covers the lands around the Mediterranean from Britain and Spain to Egypt and Iraq, with Rome marked. A teal area covers eastern China with an arm reaching north-west, with Chang\'an and Luoyang marked. Between them the Parthians are named in Iran and the Kushans in Central Asia.',
        caption: 'Rough outlines: Rome in 117 CE, the Han about 100 CE.',
      },
    },
    {
      id: 'teach-rome-rise',
      type: 'info',
      title: 'Rome: from a village to an empire',
      text: `
        Rome began as a village of huts on hills beside the River Tiber.
        Legend dates its founding to 753 BCE.

        - **509 BCE** (by tradition): the kings are driven out. In the
          **Republic**, citizens elect their leaders, the consuls, who govern
          with the Senate.
        - **146 BCE**: Rome destroys Carthage, its great rival in North
          Africa, and rules the western Mediterranean.
        - **44 BCE**: the Republic's own generals fight civil wars. One of
          them, Julius Caesar, is murdered.
        - **27 BCE**: his heir **Augustus** rules alone, emperor in all but name.

        Wherever Rome ruled, **Latin** was the language of its law and its army.
      `,
      figure: {
        type: 'timeline', from: -800, to: 500, step: 100, mode: 'explore', showYears: true,
        spans: [
          { id: 'rep', from: -509, to: -27, label: 'Roman Republic', color: 'orange', note: '**509 BCE to 27 BCE.** The Republic: citizens elect their leaders, and Rome conquers the Mediterranean.' },
          { id: 'emp', from: -27, to: 476, label: 'Roman Empire (west)', color: 'red', note: '**27 BCE to 476 CE.** The Empire: one man rules, from Augustus to the last emperor in the west.' },
        ],
        events: [
          { id: 'founding', year: -753, label: 'Rome founded (legend)', short: 'Founding', color: 'gray', note: '**753 BCE, by legend.** The real beginnings of the village on the Tiber were gradual.' },
          { id: 'carthage', year: -146, label: 'Carthage destroyed', short: 'Carthage', color: 'orange', note: '**146 BCE.** Rome destroys Carthage, its great rival in North Africa.' },
          { id: 'caesar', year: -44, label: 'Caesar murdered', short: 'Caesar', color: 'orange', note: '**44 BCE.** Julius Caesar is killed during the civil wars that end the Republic.' },
          dot('rome-peak', 'Greatest size', 'red'),
        ],
        alt: 'A timeline from 800 BCE to 500 CE. Rome is founded, by legend, in 753 BCE. A bar shows the Roman Republic from 509 BCE to 27 BCE, with Carthage destroyed in 146 BCE and Caesar murdered in 44 BCE. A second bar shows the Roman Empire in the west from 27 BCE to 476 CE, at its greatest size in 117 CE.',
      },
    },
    {
      id: 'rome-order',
      type: 'order',
      title: 'From a village to an empire',
      text: `
        Rome took about 700 years to grow from a village to the ruler of the
        Mediterranean. **Put the stages in order.**
      `,
      items: [
        'A village of huts on hills beside the River Tiber',
        'The kings are driven out; citizens elect their leaders',
        'Rome destroys Carthage and rules the western sea',
        'Generals fight civil wars; Julius Caesar is murdered',
        'Augustus rules alone, as the first emperor',
      ],
      labels: ['First', 'Last'],
      hints: ['Rome was ruled by kings, then by elected officials (the Republic), then by emperors.', 'The Republic conquered the Mediterranean. Its own victorious generals then tore it apart.'],
      explain: `
        Kings, then the **Republic**, then emperors. The Republic conquered
        the Mediterranean, and its own victorious generals then tore it apart.

        Under Augustus, Rome's citizens kept voting for a while. The power
        had moved to one man and his army.
      `,
    },
    {
      id: 'qin',
      type: 'choice',
      title: 'China is made one',
      text: `
        In 221 BCE the king of **Qin** conquered the last of his rivals and took a
        new title: First Emperor. He gave China one script, one coinage, one set
        of weights, even one width of cart axle, and joined older frontier walls
        into the first Great Wall.

        In 1974 farmers digging a well found the army buried beside his tomb:
        about 8,000 life-size soldiers of baked clay, no two faces alike.
        **What does it tell you about his state?**
      `,
      figure: photo(MEDIA['terracotta-army'], {
        alt: 'A vast pit under a hangar roof, filled with rows of life-size clay figures of soldiers standing in long columns between earth walls, all facing the same way.',
        caption: 'The Terracotta Army, near Xi\'an, China, about 210 BCE',
      }),
      options: [
        { text: 'It could command huge workforces and make them work to a standard', correct: true },
        { text: 'Real soldiers were turned to clay and buried with the emperor', why: 'The figures are pottery, made in workshops from moulded parts and finished by hand. Many are stamped with the name of the foreman responsible.' },
        { text: 'Qin was a small state with few resources', why: 'A small state could not have spared the labour: thousands of potters, kilns and tonnes of clay, besides the tomb itself.' },
      ],
      explain: `
        Standard parts, named foremen, quality control: the army was made the way
        Qin made everything, by rule. The same harsh discipline built the roads
        and walls, and made Qin hated. The dynasty collapsed in 206 BCE, four
        years after the First Emperor died.

        The Great Wall that visitors walk on today is mostly much later: you
        will meet its builders, the Ming, in *One World*.
      `,
    },
    {
      id: 'teach-han',
      type: 'info',
      title: 'The Han: rule by the educated',
      text: `
        The **Han** kept Qin's unified state and softened it. Officials were
        chosen for their learning, above all in the teachings of Confucius, and
        from 124 BCE an imperial academy trained them. They ran the empire on
        written reports. So it mattered what there was to write on:

        | Material | Made from | Where |
        |---|---|---|
        | Papyrus | an Egyptian reed | around the Mediterranean |
        | Parchment | animal skin | around the Mediterranean |
        | Bamboo strips | bamboo | China |
        | **Paper** | hemp, bark and old rags, pulped in water and dried in a thin sheet | first made in Han China |

        China's other speciality was **silk**, the thread of the silkworm.
        Romans paid enormous prices for it without knowing how it was made.
      `,
    },
    {
      id: 'han-paper',
      type: 'choice',
      title: 'An empire run on reports',
      text: `
        At first a Han official wrote his reports on strips of bamboo, tied
        together: a long text made a cartload.

        **What did Han craftsmen invent that changed this?**
      `,
      options: [
        { text: 'Paper', correct: true },
        { text: 'The printing press', why: 'Printing from carved woodblocks came some 500 years after the Han. You will meet it in *Crossroads*.' },
        { text: 'Papyrus', why: 'Papyrus is an Egyptian reed, used around the Mediterranean. It was never made in China.' },
        { text: 'Parchment', why: 'Parchment, made from animal skin, was used around the Mediterranean, not in China.' },
      ],
      explain: `
        **Paper.** Scraps survive from before 100 BCE, and in 105 CE the court
        official Cai Lun presented an improved method to the emperor.

        Light and cheap, paper suited a state run by scholars. Among them was
        **Ban Zhao**, the woman who completed the official history of the early
        Han. Paper took a thousand years to reach Europe.
      `,
    },
    {
      id: 'aqueduct',
      type: 'choice',
      title: 'Built to last',
      text: `
        Roman engineers built this in southern France in the first century CE:
        three tiers of arches, 49 metres high, with a covered channel running
        along the very top.

        **What was it for?**
      `,
      figure: photo(MEDIA['pont-du-gard'], {
        alt: 'A tall stone bridge across a river valley, made of three rows of arches stacked one above another: large arches at the bottom and in the middle, and a row of many small arches on top.',
        caption: 'The Pont du Gard, near Nîmes, France, first century CE',
      }),
      options: [
        { text: 'Carrying water to a city', correct: true },
        { text: 'Carrying a road for the army', why: 'A road needs only one deck. The top tier here is too narrow for carts and carries a water channel.' },
        { text: 'Defending the river crossing', why: 'A wall full of open arches keeps nobody out. Think about why the channel has to be so high.' },
      ],
      explain: `
        It is part of an **aqueduct**: a channel 50 km long that brought spring
        water to the city of Nîmes, dropping only about one metre in every three
        kilometres so that the water kept flowing downhill all the way.

        Rome bound its empire with engineering: 80,000 km of paved roads,
        harbours, aqueducts, and concrete domes such as the Pantheon in Rome,
        still standing after 1,900 years. Its other lasting structure was
        **law**: written, public, and argued over by trained lawyers.
      `,
    },
    {
      id: 'when',
      type: 'interact',
      title: 'Side by side in time',
      text: `
        The line shows Rome. The **Han dynasty** began just as Hannibal of
        Carthage was invading Italy, and it fell about 250 years before the
        last emperor in the west.

        **Drag both cards into place.** Within 60 years counts.
      `,
      widget: {
        type: 'timeline', from: -600, to: 600, step: 200, snap: 10,
        spans: [
          { id: 'rep', from: -509, to: -27, label: 'Roman Republic', color: 'orange' },
          { id: 'emp', from: -27, to: 476, label: 'Roman Empire (west)', color: 'red' },
        ],
        events: [
          { id: 'hannibal', year: -218, label: 'Hannibal invades Italy', short: 'Hannibal', color: 'gray' },
          { id: 'last-west', year: 476, label: 'Last western emperor', short: 'West ends', color: 'gray' },
        ],
        place: [
          { id: 'start', label: 'Han begins', color: 'teal', answer: -206 },
          { id: 'end', label: 'Han falls', color: 'teal', answer: 220 },
        ],
        alt: 'A timeline from 600 BCE to 600 CE. The Roman Republic runs from 509 BCE to 27 BCE and the Roman Empire in the west from 27 BCE to 476 CE. Hannibal invades Italy in 218 BCE.',
      },
      check: (s) => {
        if (!s.complete) return 'Place both cards on the line.';
        if (s.placed.start > s.placed.end) return 'The beginning has to come before the end. Swap the two cards.';
        if (Math.abs(s.placed.start + 206) > 60) return s.placed.start < -206 ? 'The Han began later than that: at about the time Hannibal invaded Italy.' : 'The Han began earlier than that: at about the time Hannibal invaded Italy.';
        if (Math.abs(s.placed.end - 220) > 60) return s.placed.end < 220 ? 'The Han lasted longer: count back about 250 years from the last western emperor.' : 'The Han fell earlier: about 250 years before the last western emperor.';
        return true;
      },
      solution: { placed: { start: -210, end: 220 } },
      explain: `
        The Han ruled from **206 BCE to 220 CE**: more than four centuries, half
        alongside the Roman Republic and half alongside the Empire. Augustus and
        the Han emperors were contemporaries who probably never heard each other's names.
      `,
    },
    {
      id: 'compare',
      type: 'bucket',
      review: true,
      text: '**Rome, Han China, or both?** Sort these features of the two empires at their height.',
      buckets: ['Rome', 'Han China', 'Both'],
      items: [
        { text: 'Latin as the language of law and army', bucket: 0 },
        { text: 'Stone aqueducts and concrete domes', bucket: 0 },
        { text: 'Officials trained in the teachings of Confucius', bucket: 1 },
        { text: 'Paper', bucket: 1 },
        { text: 'Raising silkworms', bucket: 1, why: 'Silk was China\'s speciality. Romans bought it at enormous prices without knowing how it was made.' },
        { text: 'An emperor ruling some 50 to 60 million people', bucket: 2 },
        { text: 'Long frontier walls against peoples to the north', bucket: 2, why: 'Hadrian\'s Wall in Britain and the Han walls in the north-west were built for the same reason.' },
        { text: 'Roads, taxes and a count of the population', bucket: 2 },
      ],
      explain: `
        Alike in scale and in their problems: feeding great cities, paying
        armies, guarding long frontiers, taxing farmers. Different in their
        tools: Rome relied on law, citizenship and stone; the Han on a trained
        civil service, a shared script and paper.
      `,
    },
    {
      id: 'silk-road',
      type: 'choice',
      title: 'What linked them',
      text: `
        Chinese silk reached Rome, and Roman glass reached China, but
        hardly any merchant made the whole journey. Goods passed from hand to hand, and
        every hand took a profit.

        In 97 CE the Han envoy **Gan Ying** set out for Rome. On the far side of
        Parthia, sailors told him the sea crossing ahead could take two years,
        and he turned back. **Who gained most from the two empires never meeting?**
      `,
      figure: {
        type: 'world-map', view: [8, 2, 118, 50], zoom: false,
        lines: [
          { points: SILK_LAND, color: 'orange', width: 3, label: 'Caravan routes' },
          { points: SEA_WEST, color: 'blue', dashed: true },
          { points: SEA_INDIA, color: 'blue', dashed: true, label: 'Sea routes' },
        ],
        markers: [
          mark('rome', { labelPos: 'top' }), mark('antioch', { labelPos: 'top' }), mark('ctesiphon', { labelPos: 'bottom' }), mark('merv', { labelPos: 'top' }),
          mark('dunhuang', { labelPos: 'top' }), mark('changan', { label: 'Chang\'an', labelPos: 'bottom' }),
        ],
        labels: [{ at: [55, 31.5], text: 'Parthians', style: 'area' }, { at: [71, 33], text: 'Kushans', style: 'area' }],
        alt: 'A map from Italy to China. An orange caravan route runs from Chang\'an through Dunhuang, round the desert to Central Asia, through Merv and Parthian Iran, past the Parthian capital Ctesiphon on the Tigris, to Antioch on the Mediterranean. Dashed blue sea routes continue from Antioch to Rome, and from Egypt down the Red Sea and across the ocean to southern India.',
      },
      options: [
        { text: 'The traders in between, who bought cheap and sold dear', correct: true },
        { text: 'The Roman emperors, who wanted no foreign goods', why: 'Roman writers grumbled about gold flowing east to pay for silk, but nobody stopped the trade, and the state taxed it.' },
        { text: 'The Han emperors, who wanted no contact with outsiders', why: 'The opposite: the Han court sent Gan Ying, and before him Zhang Qian, precisely to find out about the west.' },
      ],
      explain: `
        Whether or not the sailors meant to mislead him, **Parthian and Kushan middlemen** had every reason to keep buyer and seller apart. Rome and
        Han knew each other only by rumour: Romans spoke of the *Seres*, "the
        silk people", and Chinese records describe a great western realm, Da Qin.

        Ships also carried the trade, sailing with the **monsoon** between Egypt
        and India. In 166 CE travellers reached China by sea claiming to come from
        the Roman emperor; they were probably merchants. You will follow these
        routes in *Crossroads*.
      `,
    },
    {
      id: 'not-two',
      type: 'info',
      title: 'Not only two',
      text: `
        Rome and Han were the largest states of their age, not the only great ones.

        - **India.** The Maurya emperors united most of the subcontinent in the
          third century BCE, ruling from Pataliputra on the Ganges. Under the
          Guptas, from about 320 CE, and after them, Indian mathematicians
          developed the place-value numerals with zero that the whole world
          uses now.
        - **Kush**, on the Nile in what is now Sudan, with its capital at
          Meroë, smelted iron, wrote in its own script and built more
          pyramids than Egypt. About 25 BCE its queen
          **Amanirenas** fought the Romans in Egypt and won a peace that lasted
          three centuries.
        - **Aksum**, in Ethiopia and Eritrea, struck gold coins and grew rich on
          the sea trade between Rome and India.
      `,
      figure: {
        type: 'world-map', view: [8, 2, 100, 46], zoom: false,
        markers: [
          mark('pataliputra', { label: 'Pataliputra', color: 'violet', labelPos: 'top' }),
          mark('meroe', { color: 'violet', labelPos: 'left' }),
          mark('aksum', { color: 'violet', labelPos: 'right' }),
          mark('rome', { color: 'gray', labelPos: 'top' }),
        ],
        rivers: ['Nile', 'Ganges'],
        alt: 'A map from Italy to India. Pataliputra is marked on the Ganges in northern India, Meroë on the Nile in Sudan and Aksum in the highlands of northern Ethiopia. Rome is shown for comparison.',
      },
    },
    {
      id: 'find-cities',
      type: 'interact',
      review: true,
      gen: (rng) => markerQuiz(rng, CITIES, {
        view: [-12, 2, 125, 55], minKm: 1300,
        alt: 'A map of Europe, northern Africa and Asia without names. Four lettered markers.',
      }),
    },
    {
      id: 'find-state',
      type: 'interact',
      review: true,
      gen: (rng) => countryQuiz(rng, STATES, {
        view: [-12, 2, 125, 55],
        pickable: ['IT', 'CN', 'IN', 'SD', 'ET', 'IQ', 'EG', 'IR', 'TR', 'SA', 'PK', 'KZ', 'LY', 'DZ', 'FR', 'ES', 'MN', 'AF', 'GR'],
        alt: 'A map of Europe, northern Africa and Asia without country names. Four rivers are drawn and named: the Nile, the Tigris, the Euphrates and the Ganges.',
        extra: { rivers: ['Nile', 'Tigris', 'Euphrates', 'Ganges'] },
      }),
    },
    {
      id: 'teach-after',
      type: 'info',
      title: 'What the empires left behind',
      text: `
        Empires end. Habits of speech and writing last longer.

        Roman soldiers and settlers had carried **Latin** across the western
        empire. People went on speaking it, and it slowly changed into
        Spanish, Portuguese, French, Italian and Romanian: the **Romance**
        languages. German and English are not among them: they are Germanic
        languages. Nor is Greek, which is older than Latin and stayed the
        speech of the eastern half.

        In China the shared script and the Confucian schooling of officials
        outlived the Han in the same way.
      `,
      figure: {
        type: 'world-map', view: [-12, 29, 46, 58], zoom: false, dots: false,
        regions: [{ ids: ['PT', 'ES', 'FR', 'IT', 'RO'], color: 'orange', label: 'Portuguese, Spanish, French, Italian and Romanian are spoken here', mainBodyOnly: true }],
        dim: false,
        areas: [{ polygon: ROME, color: 'red', label: 'Roman Empire, 117 CE (roughly)', labelOn: 'legend' }],
        labels: ['PT', 'ES', 'FR', 'IT', 'RO', 'DE', 'GB', 'GR'],
        alt: 'A map of Europe and the Mediterranean with the Roman Empire of 117 CE outlined. Portugal, Spain, France, Italy and Romania, all inside the outline, are coloured: Romance languages are spoken there. Most of Germany lies outside the outline. Britain and Greece lie inside it but are not coloured.',
      },
    },
    {
      id: 'fall',
      type: 'choice',
      title: 'Two endings',
      text: `
        Both empires broke up under similar strains: civil wars between
        generals, epidemics, and the cost of defending long frontiers.

        The Han split into three kingdoms in **220 CE**; China was united
        again in 589. The last Roman emperor in the west was deposed in
        **476 CE**; his lands became separate kingdoms, the ancestors of
        France, Spain, Italy and the rest.

        **What was the great difference in what came afterwards?**
      `,
      options: [
        { text: 'China was reunited as one empire, again and again; western Europe never was', correct: true },
        { text: 'Roman civilisation vanished without trace', why: 'Latin, Roman law and Christianity all lived on, and the eastern half of the empire, ruled from Constantinople, lasted almost another thousand years.' },
        { text: 'China gave up its writing and its Confucian learning', why: 'It kept both through centuries of division. That shared script and schooling made reunion easier.' },
      ],
      explain: `
        Between 220 and 589 China was divided most of the time, but the idea
        that it *should* be one state never died. The western Roman lands
        stayed separate.

        The eastern Roman Empire carried on until 1453. Its story continues in
        *Crossroads*.
      `,
    },
    {
      id: 'echo-latin',
      type: 'multi',
      review: true,
      title: 'Echoes you can hear',
      text: `
        Roman soldiers and settlers carried Latin across the western empire,
        where it slowly changed into new languages.

        **Which of these languages grew out of Latin?** Choose all that apply.
      `,
      options: [
        { text: 'Spanish', correct: true },
        { text: 'French', correct: true },
        { text: 'Portuguese', correct: true },
        { text: 'Romanian', correct: true },
        { text: 'German', why: 'German is a Germanic language. Most German-speaking lands lay beyond the Roman frontier on the Rhine and Danube.' },
        { text: 'English', why: 'English is Germanic at its core, though more than half its vocabulary was borrowed from Latin and French.' },
        { text: 'Greek', why: 'Greek is older than Latin, and the eastern half of the empire went on speaking it.' },
      ],
      explain: `
        Spanish, Portuguese, French, Italian and Romanian are the **Romance**
        languages: "Roman" speech. Romania even keeps the name.

        The Han left an echo just as large. Most people in China call
        themselves **Han**, and the Chinese word for their written characters,
        *hànzì*, means "Han characters".
      `,
    },
  ],
  recap: [
    '**Rome** grew from a city-state to a republic and then, under Augustus (27 BCE), an empire around the Mediterranean, bound by roads, law, Latin and engineering.',
    'The **Qin** united China in 221 BCE; the **Han** (206 BCE to 220 CE) ruled it through educated officials, a shared script and paper.',
    'Each empire held some 50 to 60 million people. Silk and glass passed between them along the early **Silk Road** and by sea, through Parthian and Kushan middlemen. They never met.',
    'Both broke up (Han 220, western Rome 476). China was reunited; western Europe was not. India, Kush and Aksum were great powers of the same age.',
  ],
  next: 'Next: the empires are gone, but some ideas born under them are followed by billions today. Where did they begin, and how did they travel?',
};
