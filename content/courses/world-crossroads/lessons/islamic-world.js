// Crossroads: 500 to 1500 · Lesson 2 · The House of Wisdom
//
// Driving question: why do we do "algebra" with "Arabic" numerals? How a faith born in Arabia
// came to join Spain to the Indus, and what its scholars gathered, added and passed on.
// This lesson describes a living religion: it says what Muslims believe and do, in terms they
// would recognise, and shows no image of the Prophet Muhammad.
import { pic, mk, at, ev, when, pinCheck, orderEvents, pickFromTable, SCHOLARS, EVENTS, CALIPHATE_750 } from '../helpers.js';

const WIDE_VIEW = [-12, 9, 78, 49];

// The Five Pillars: the teaching table and the closing match are built from this one list.
const PILLARS = [
  ['*Shahada* (witness)', 'Declaring that there is no god but God, and that Muhammad is God\'s messenger'],
  ['*Salat* (prayer)', 'Praying five times a day, facing Mecca'],
  ['*Zakat* (alms)', 'Giving a share of one\'s wealth to people in need'],
  ['*Sawm* (fasting)', 'Going without food and drink from dawn to sunset in the month of Ramadan'],
  ['*Hajj* (pilgrimage)', 'Travelling to Mecca once in a lifetime, if one is able'],
];

// The dated events of the lesson: the closing timeline shows every one that the "put these in order" step can draw.
const WHEN_POOL = ['hijra', 'iberia', 'baghdad', 'algebra', 'fibonacci', 'baghdadfalls'];

export default {
  id: 'islamic-world',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Four words',
      text: `
        **Algebra. Algorithm. Zero. Zenith.**

        All four words reached English, by way of Latin, from a single language.

        **Which one?**
      `,
      options: [
        { text: 'Arabic', correct: true },
        { text: 'Greek' },
        { text: 'Sanskrit' },
        { text: 'Chinese' },
      ],
      explain: `
        **Arabic.** So did *cipher*, *alkali*, *azimuth* and the names of bright stars such as Aldebaran, Altair and Vega.

        Between about 800 and 1200, Arabic was the main language of science from Spain to Central Asia. This lesson asks how that came about, and what we still owe to it.
      `,
    },
    {
      id: 'arabia',
      type: 'info',
      title: 'Arabia, about 600',
      text: `
        **Mecca** was a town of merchants on the caravan road along the western edge of Arabia. People also came there as pilgrims, to a shrine called the Kaaba.

        About 570 a boy named **Muhammad** was born there. He became a merchant. Muslims believe that when he was about forty, God began to reveal messages to him through the angel Gabriel, and that these revelations continued for the rest of his life.

        Their core was that there is **one God** (in Arabic, *Allah*), the God of Abraham, Moses and Jesus, and that people should worship God alone and care for the poor. Muslims honour Muhammad as the last of God's prophets.
      `,
      figure: {
        type: 'world-map', dots: false, view: [22, 9, 66, 44], dim: false,
        areas: [
          { polygon: [[22, 37], [22, 43.5], [29, 45], [41, 41.6], [42.5, 38], [41, 35.5], [38.5, 33], [36, 29.5], [34.5, 28.5], [33.5, 28], [35.2, 24.2], [32.8, 24], [30, 25], [26, 30.5], [22, 31.5]], color: 'violet', label: 'Eastern Roman (Byzantine) Empire' },
          { polygon: [[42.5, 38], [41, 35.5], [41.5, 33.5], [44.5, 30.5], [47.8, 30], [50.5, 28.6], [53, 26.6], [57, 26.6], [61.5, 25.2], [66, 25.5], [66, 37.5], [61, 37], [54, 38], [49.2, 37.6], [49.6, 40.4], [47.5, 41.8], [45, 41.3]], color: 'orange', label: 'Sasanian Persian Empire' },
        ],
        markers: [mk('mecca', { shape: 'star', color: 'green', size: 'l', labelPos: 'right' }), mk('medina', { labelPos: 'right' }), mk('constantinople', { labelPos: 'top' })],
        labels: [{ at: [47, 22], text: 'Arabia', style: 'area' }, { at: [38.2, 19.2], text: 'Red Sea', style: 'water' }],
        alt: 'A map of the Middle East about 600. The Eastern Roman Empire covers Anatolia, Syria and Egypt; the Sasanian Persian Empire covers Iraq and Iran. Mecca and Medina lie in western Arabia, outside both empires.',
        caption: 'The two empires about 600 (roughly). Arabia lay outside both.',
      },
    },
    {
      id: 'faith',
      type: 'info',
      title: 'A book and a calendar',
      text: `
        Muhammad's followers memorised the words he recited and wrote them down. Soon after his death they were gathered into one book, the **Qur'an**, which Muslims regard as the word of God. "Islam" means *submission* (to God); a **Muslim** is one who submits.

        Mecca's leading families turned against the new community. In **622** Muhammad and his followers moved north to the town of **Medina**. This move, the **Hijra**, is year 1 of the Islamic calendar, which counts in years of twelve lunar months.

        Look at the page. Because Muslims hold the Qur'an to be God's own words, copying it beautifully became the highest of arts. Mosques and Qur'ans are decorated with **writing and pattern**, not with pictures of people.
      `,
      figure: pic('quran-folio', {
        alt: 'A page of deep blue parchment with fifteen lines of angular Arabic writing in gold ink, running from edge to edge.',
        caption: 'A page of the "Blue Qur\'an", made about 850 to 950, probably in Tunisia',
        creditLabel: 'Photo',
        credit: 'Marie-Lan Nguyen',          // the record's author field reads "Unknown author" (the scribe); the CC BY photograph is hers
      }),
    },
    {
      id: 'find-mecca',
      type: 'interact',
      text: `
        By the time Muhammad died in **632**, most of Arabia had joined the new community, and Mecca was its holy city. Muslims everywhere still turn towards it when they pray.

        **Place the pin on Mecca.** It lies in western Arabia, a little inland from the Red Sea, about halfway down the coast. Within 350 km counts.
      `,
      widget: {
        type: 'world-map', dots: false, view: [24, 10, 62, 40], mode: 'place', dim: false,
        pin: { label: 'Mecca', color: 'green', start: [48, 27] }, target: at('mecca'),
        labels: [{ at: [38.4, 19], text: 'Red Sea', style: 'water' }, { at: [51.5, 26.8], text: 'Persian Gulf', style: 'water' }],
        alt: 'A map of Arabia and its neighbours without country names, with a pin to place.',
      },
      check: pinCheck('mecca', 350, 'Mecca is close to the Red Sea coast, about halfway between its two ends.'),
      solution: { pin: [39.9, 21.5] },
      hints: ['The Red Sea is the long, narrow sea on the left of Arabia.', 'Go halfway down its eastern shore, then a short step inland.'],
      explain: `
        Mecca lies about 70 km inland from the Red Sea port of Jeddah, in what is now Saudi Arabia. Medina is about 340 km to its north.
      `,
    },
    {
      id: 'teach-pillars',
      type: 'info',
      title: 'Five pillars',
      text: `
        Muslims share a set of core duties. Sunni Muslims call them the **Five Pillars**.

        | Pillar | What it asks |
        |---|---|
        ${PILLARS.map(([pillar, asks]) => `| ${pillar} | ${asks} |`).join('\n        ')}

        After Muhammad's death, Muslims disagreed about who should lead the community. From that dispute grew the two main branches of Islam, **Sunni** and **Shia**. Both keep the Qur'an and these duties.
      `,
    },
    {
      id: 'expansion',
      type: 'interact',
      mode: 'predict',
      title: 'A hundred years later',
      text: `
        After 632 the leaders of the community took the title **caliph** ("successor"). Their armies moved out of Arabia in every direction.

        By 750 three of these four cities were ruled by the caliphs. **Tap the one you think was not.**
      `,
      widget: {
        type: 'world-map', dots: false, view: WIDE_VIEW, mode: 'pickMarker', dim: false, answer: 'constantinople',
        markers: [
          mk('cordoba', { labelPos: 'top' }), mk('constantinople', { labelPos: 'top' }), mk('damascus', { labelPos: 'bottom' }), mk('samarkand', { labelPos: 'top' }),
          mk('mecca', { shape: 'star', color: 'green', labelPos: 'right' }),
        ],
        pickable: ['cordoba', 'constantinople', 'damascus', 'samarkand'],
        alt: 'A map from Spain to Central Asia with four cities marked: Córdoba in Spain, Constantinople, Damascus in Syria and Samarkand in Central Asia. Mecca is marked with a star.',
      },
      check: (s) => s.picked === 'constantinople',
      solution: { picked: 'constantinople' },
      explain: `
        **Constantinople.** Its walls beat off two great sieges, and the eastern Roman Empire lived on (lesson 5).

        Everything else fell fast: Syria and Egypt in the 630s and 640s, Persia by 651, Spain from 711, Samarkand in 712. One reason is that the two old empires had just fought each other to exhaustion.

        Rule changed quickly; religion changed slowly. Christians, Jews and Zoroastrians kept their faiths and paid a tax, and it took centuries before most people in these lands were Muslims.
      `,
    },
    {
      id: 'baghdad-why',
      type: 'choice',
      title: 'A new capital',
      text: `
        The map shows the caliphs' lands about 750 (roughly). In that year a new family, the **Abbasids**, took power, and in **762** they founded a new capital: **Baghdad**.

        Look at the two rivers on the map, and think back to the caravan roads and sea lanes of lesson 1. **Why build it there?**
      `,
      figure: {
        type: 'world-map', dots: false, view: WIDE_VIEW, dim: false,
        areas: [{ polygon: CALIPHATE_750, color: 'green', label: 'The caliphs\' lands about 750' }],
        rivers: ['Tigris', 'Euphrates'],
        markers: [mk('baghdad', { shape: 'star', color: 'red', size: 'l', labelPos: 'right' }), mk('damascus', { labelPos: 'left' }), mk('mecca', { labelPos: 'right' }), mk('cordoba', { labelPos: 'top' }), mk('samarkand', { labelPos: 'top' })],
        alt: 'A map showing the lands under the caliphs about 750 as one shaded area from Spain and Morocco across North Africa, Egypt, Arabia, Syria, Iraq and Iran to Central Asia and the Indus. Baghdad is marked on the Tigris near the middle, where the Tigris and the Euphrates run close together.',
      },
      options: [
        { text: 'Two rivers, a road east and a short sail to the ocean meet there', correct: true },
        { text: 'It was the birthplace of Muhammad', why: 'That is Mecca, 1,400 km to the south.' },
        { text: 'It was the old capital of the caliphs', why: 'The earlier caliphs, the Umayyads, had ruled from Damascus. The Abbasids wanted a fresh start further east.' },
        { text: 'It stood on the Mediterranean coast', why: 'Baghdad is far inland, on the Tigris.' },
      ],
      explain: `
        At Baghdad the **Tigris** and the **Euphrates** run only about 40 km apart. Boats came down both; the Tigris led to the Gulf and the monsoon ships of lesson 1; the caravan road to Persia, Samarkand and China started at its gates.

        Within a century it was probably the largest city in the world outside China.
      `,
    },
    {
      id: 'translation',
      type: 'info',
      title: 'Collecting the world\'s books',
      text: `
        The caliphs of Baghdad paid scholars to find the best books of older civilisations and turn them into Arabic: Greek medicine, geometry and philosophy, Persian statecraft, Indian mathematics and astronomy. The translators were Muslims, Christians and Jews.

        A new material made it affordable. **Paper**, a Chinese invention, was being made in Samarkand by the mid-700s and in Baghdad before 800. A book on paper cost a fraction of one on parchment.

        Tradition calls the centre of this work the **House of Wisdom**. Historians debate what it really was (a grand academy, or mainly the caliphs' library), but not the result: for centuries, to study science was to read Arabic. **Tap the timeline** to see what else was happening.
      `,
      figure: {
        type: 'timeline', from: 550, to: 1300, step: 150, mode: 'explore',
        spans: [
          { id: 'umayyad', from: 661, to: 750, label: 'Umayyad caliphs', color: 'gray', note: 'The Umayyad family ruled from **Damascus**. Under them the caliphs\' lands reached Spain and the Indus.' },
          { id: 'abbasid', from: 750, to: 1258, label: 'Abbasid caliphs', color: 'green', note: 'The Abbasids ruled from **Baghdad**. Their real power shrank after about 900, but the city stayed a capital of learning until the Mongols destroyed it in 1258.' },
          { id: 'andalus', from: 756, to: 1031, label: 'Umayyads of Córdoba', color: 'orange', note: 'A surviving Umayyad prince fled to Spain and founded a rival court at **Córdoba**, the capital of al-Andalus.' },
        ],
        events: [
          ev('hijra', { color: 'green', note: 'The move from Mecca to Medina: year 1 of the Islamic calendar.' }),
          ev('baghdad', { color: 'green', note: 'Founded by the caliph al-Mansur as a round city on the Tigris.' }),
          ev('charlemagne', { color: 'gray', note: 'While Baghdad had perhaps half a million people, no town in Charlemagne\'s empire (lesson 5) came anywhere near that size. The two courts exchanged gifts: Frankish chronicles proudly record the arrival of an elephant from the caliph.' }),
          ev('algebra', { color: 'blue', note: 'The book that gave algebra its name: next screen.' }),
          ev('fibonacci', { color: 'blue', note: 'Four centuries later, an Italian who grew up in North Africa explains "the Indian method" of numbers to Europe.' }),
        ],
        alt: 'A timeline from 550 to 1300. Bars: Umayyad caliphs 661 to 750, Abbasid caliphs 750 to 1258, Umayyads of Córdoba 756 to 1031. Events: the Hijra 622, Baghdad founded 762, Charlemagne crowned 800, al-Khwarizmi\'s algebra about 820, Fibonacci\'s book 1202.',
      },
    },
    {
      id: 'khwarizmi',
      type: 'fill',
      title: 'The man in two words',
      text: `
        About 820, in Baghdad, **Muhammad ibn Musa al-Khwarizmi** wrote a short handbook for solving the equations that come up in trade, land surveys and inheritance. Its title speaks of ***al-jabr***, "restoring": moving a term to the other side of an equation.

        These are two pages of it. There is not one symbol: every equation is written out in words, and proved with a drawing of squares and rectangles, like those at the foot of each page. (If you have taken *Algebra Foundations*, you have done *al-jabr* on a balance.)

        Latin translators could not manage his name and wrote it *Algoritmi*.
      `,
      figure: pic('algebra-page', {
        alt: 'An open manuscript book: two pages closely written in Arabic in black ink. At the foot of each page is a diagram drawn in red: a large square divided into smaller squares and rectangles, with letters written in its parts.',
        caption: 'Two pages of al-Khwarizmi\'s algebra, from a copy made in the 1300s',
        creditLabel: 'Image',
      }),
      template: 'From the title of his book comes the word [[*algebra|alchemy|almanac]]. From the Latin form of his name comes the word [[*algorithm|alphabet|arithmetic]], a step-by-step method.',
      explain: `
        **Algebra** and **algorithm**. Every program you write in the computing courses on this site is, by name, "a thing in the manner of al-Khwarizmi". He came from Khwarazm, south of the Aral Sea, which is all his name means: "the man from Khwarazm".
      `,
    },
    {
      id: 'numerals',
      type: 'order',
      title: 'The journey of 0 to 9',
      text: `
        Try adding MCMXLVII and DCCCLXXXVIII in your head. Roman numerals have no **place value** and no **zero**, so sums need a counting board.

        Our ten digits were worked out in **India**. Europeans call them "Arabic" because they learned them from books in Arabic.

        **Put their journey in order, earliest first.**
      `,
      figure: {
        type: 'world-map', dots: false, view: [-12, 14, 86, 48], aspect: 2.4, dim: false,
        lines: [{ points: [[76, 23.5], [66, 27.5], at('baghdad')], color: 'blue', width: 3, arrow: true, animate: 'draw', label: 'Route of the numerals' },
          { points: [at('baghdad'), [36.5, 33.5], [31.2, 30.1], [20, 31.8], [10.2, 36.2], at('bejaia')], color: 'blue', width: 3, arrow: true, animate: 'draw' },
          { points: [at('bejaia'), [7.5, 40], at('pisa')], color: 'blue', width: 3, arrow: true, animate: 'draw' }],
        markers: [{ id: 'india', at: [76, 23.5], label: 'India', labelPos: 'right' }, mk('baghdad', { labelPos: 'top' }), mk('bejaia', { labelPos: 'bottom' }), mk('pisa', { labelPos: 'top' }), mk('cordoba', { labelPos: 'left' })],
        alt: 'A map from Spain to India. A line runs from India to Baghdad, then west along North Africa to Béjaïa in Algeria, and across the sea to Pisa in Italy. Córdoba in Spain is also marked.',
      },
      items: [
        'India: nine digits, a zero and place value',
        'Baghdad: al-Khwarizmi explains "the Indian way"',
        'North Africa and al-Andalus adopt the digits',
        'Pisa: Fibonacci teaches Italian merchants',
      ],
      labels: ['Earliest', 'Latest'],
      explain: `
        India first: the mathematician Brahmagupta set out rules for calculating with zero in 628. Al-Khwarizmi's guide dates from about 825, and Fibonacci's book from 1202. Fibonacci had learned the digits as a boy in the Algerian port of Béjaïa, where his father was a trade official.

        That is why this system is properly called **Hindu-Arabic**. It took Europe another three hundred years to give up Roman numerals for everyday sums.
      `,
    },
    {
      id: 'teach-scholars',
      type: 'info',
      title: 'Six scholars',
      text: `
        Scholars in the lands of Islam did far more than pass old books on. Al-Khwarizmi you have met. Here he is with five others, from Central Asia to Morocco.

        | Scholar | Remembered for |
        |---|---|
        ${SCHOLARS.map((row) => `| **${row.name}** | ${row.brief} |`).join('\n        ')}

        Not all of them were Muslims, and not all were men.
      `,
    },
    {
      id: 'scholars',
      type: 'choice',
      review: true,
      gen: (rng) => pickFromTable(rng, { rows: SCHOLARS, ask: (row) => `Scholars in the lands of Islam did far more than pass old books on. **Which of these people** ${row.clue}?` }),
    },
    {
      id: 'cordoba',
      type: 'choice',
      title: 'The far west: al-Andalus',
      text: `
        At the other end of this world stood **Córdoba**, capital of **al-Andalus** (Muslim Spain) and, about the year 1000, one of the largest cities in Europe.

        Its great mosque was begun in 785. The builders reused hundreds of columns from Roman and Visigothic ruins, and the columns were **too short** for the high, airy hall they wanted.

        **Look at the photograph. How did they solve it?**
      `,
      figure: pic('cordoba-mosque', {
        alt: 'The inside of a vast hall. Rows of slim stone columns carry arches striped in red and white, and above each arch sits a second, higher arch. The rows recede into the distance in every direction.',
        caption: 'The prayer hall of the Great Mosque of Córdoba, Spain',
      }),
      options: [
        { text: 'They stacked a second tier of arches on top of the first', correct: true },
        { text: 'They cut each column in half and joined the pieces', why: 'That would make them shorter still. Look above the lower arches.' },
        { text: 'They hung the roof from chains', why: 'Nothing hangs here: every stone rests on the one below. Count the arches above each column.' },
        { text: 'They sank the floor below ground level', why: 'The floor is level with the courtyard outside. The extra height is gained above the columns.' },
      ],
      explain: `
        Two tiers of arches, one above the other, lift the ceiling far above the old columns, and the red brick and pale stone make the stripes. Recycling became a style.

        In al-Andalus Muslims, Christians and Jews lived under Muslim rule, not always peacefully, and when Christian kings took **Toledo** in 1085, scholars from all over Europe came there to translate Arabic books into Latin. That is the road by which algebra, Aristotle and the astrolabe reached the universities of lesson 5.
      `,
    },
    {
      id: 'astrolabe',
      type: 'multi',
      title: 'The sky in your hand',
      text: `
        This brass instrument was made in Yemen in 1291 by a prince, later sultan, who was known for his writings on science. It is an **astrolabe**: a flat model of the sky. You hang it from the ring, sight a star or the Sun along the bar on its back to measure its height, and turn the pierced plate (each point is a named star) to match. The plate then shows the hour.

        **Which of these could its owner do with it?** Choose every one.
      `,
      figure: pic('astrolabe', {
        alt: 'A round instrument of golden brass, standing on its edge, with a ring at the top for hanging it. Its face is a pierced plate with curved, hooked pointers, lying over a disc engraved with a net of curved lines. Arabic letters and numbers run round the rim.',
        caption: 'Astrolabe made by the prince Umar ibn Yusuf, Yemen, 1291',
        creditLabel: 'Image',
        credit: 'The Metropolitan Museum of Art',          // the record's author field reads "Creator:" plus the maker's full name
      }),
      options: [
        { text: 'Tell the time, by day or by night', correct: true },
        { text: 'Work out the hours of the five daily prayers', correct: true },
        { text: 'Measure how high a star stands above the horizon', correct: true },
        { text: 'See the moons of Jupiter', why: 'For that you need lenses. The telescope was invented about 1608 (you will meet Galileo in *One World*). An astrolabe has no glass in it.' },
      ],
      explain: `
        The astrolabe was a Greek idea that scholars writing in Arabic turned into the pocket computer of the Middle Ages: clock, calendar, star map and surveying tool in one. Prayer times and the direction of Mecca gave astronomy a daily use in every town.

        European sailors later used a stripped-down version to find their latitude at sea. And most bright stars still carry the Arabic names from plates like this one.
      `,
    },
    {
      id: 'teach-timeline',
      type: 'info',
      title: 'Six centuries on one line',
      text: `
        Here is the lesson in time.

        The **Hijra** of ${when('hijra')} opens the Islamic calendar. Within a century, in ${when('iberia')}, a Muslim army crosses from North Africa into Spain. The Abbasids found **Baghdad** in ${when('baghdad')}, and ${when('algebra')} al-Khwarizmi writes his algebra there.

        Four centuries later, in ${when('fibonacci')}, Fibonacci's book teaches Italian merchants the new numerals. And in ${when('baghdadfalls')} a Mongol army destroys Baghdad and ends the rule of the Abbasid caliphs there. You will meet the Mongols in lesson 6.
      `,
      figure: {
        type: 'timeline', from: 550, to: 1300, step: 150, mode: 'static', showYears: true,
        events: WHEN_POOL.map((id) => ev(id, { color: id === 'algebra' || id === 'fibonacci' ? 'blue' : id === 'baghdadfalls' ? 'gray' : 'green' })),
        alt: `A timeline from 550 to 1300 with six events: ${WHEN_POOL.map((id) => `${EVENTS[id].short}, ${when(id)}`).join('; ')}.`,
      },
    },
    {
      id: 'when',
      type: 'order',
      review: true,
      gen: (rng) => orderEvents(rng, { pool: WHEN_POOL, n: 4, minGap: 50 }),
    },
    {
      id: 'pillars',
      type: 'match',
      review: true,
      title: 'Five pillars',
      text: `
        After Muhammad's death, Muslims disagreed about who should lead the community. From that dispute grew the two main branches of Islam, **Sunni** and **Shia**. Both share the Qur'an and the core duties that Sunni Muslims call the **Five Pillars**.

        **Match each pillar with what it asks.**
      `,
      pairs: PILLARS,
      explain: `
        Witness, prayer, alms, fasting, pilgrimage. Today about a quarter of the world's people are Muslims, and the Hajj still brings pilgrims from every continent to Mecca each year, as it brought Mansa Musa from Mali in 1324 (next lesson).
      `,
    },
  ],
  recap: [
    'Islam began in Arabia with Muhammad (about 570 to 632). The Hijra to Medina in 622 is year 1 of the Islamic calendar.',
    'Within about a century the caliphs ruled from Spain to the Indus; Baghdad, founded in 762, sat where rivers, roads and sea lanes met.',
    'Scholars writing in Arabic gathered Greek, Persian and Indian knowledge on paper and added to it: algebra, optics, medicine, astronomy.',
    'Our digits are Hindu-Arabic: worked out in India, explained by al-Khwarizmi in Baghdad, brought to Europe through North Africa and Spain.',
  ],
  next: 'Next: follow the pilgrim road back from Mecca, across the Sahara, to a king so rich that his spending shook the price of gold.',
};
