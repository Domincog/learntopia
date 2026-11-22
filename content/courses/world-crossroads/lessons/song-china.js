// Crossroads: 500 to 1500 · Lesson 4 · Paper, Print, Compass, Powder
//
// Driving question: why did China, about 1100, have paper money, printed books and cities of a
// million when nowhere else did, and what did its neighbours make of it?
import { pic, mk, at, ev, when, findOnMap, whichFirst, EVENTS } from '../helpers.js';

const CANAL = [at('hangzhou'), [120.6, 31.3], [119.45, 32.2], at('yangzhou'), [119.02, 33.6], [117.2, 34.2], [115.6, 34.5], at('kaifeng'), [113.6, 34.95]];
const CANAL_NORTH = [[113.6, 34.95], [114.4, 35.8], [115.7, 36.8], [116.3, 37.5], [117.1, 39.0], at('beijing')];

const WHEN = { sutra: 868, type: 1040, hangul: 1443 };
const WHEN_TOLERANCE = 100;

const EAST_ASIA = [98, 10, 143, 46];          // the neighbours map and the "find it" map
// The dated events of the "which came first?" step: the closing timeline shows every one of them.
const WHICH_POOL = ['tang', 'baghdad', 'charlemagne', 'diamondsutra', 'song', 'movabletype', 'chinggis', 'songfalls', 'hangul'];

export default {
  id: 'song-china',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'How big is big?',
      text: `
        About the year 1100, **London** had perhaps 15,000 people.

        At the same moment **Kaifeng** was the capital of China under the Song dynasty.

        **How many thousand people do you think lived in Kaifeng?**
      `,
      min: 0, max: 1500, step: 50, answer: 1000, tolerance: 250, start: 0, unit: 'thousand people',
      explain: `
        About **a million**, by most estimates: some sixty Londons. (Counts from the time are rough, but nothing in Europe came close.)

        This lesson asks how China came to be so rich and so inventive in these centuries, and what its neighbours made of it.
      `,
    },
    {
      id: 'dynasties',
      type: 'info',
      title: 'Tang, then Song',
      text: `
        You met **Tang** China in lesson 1: the camel in the tomb, and Chang'an, the capital where the caravan roads ended. The Tang age is remembered for its poets, and for **Wu Zetian**, the only woman to rule China as emperor in her own name.

        After the Tang fell, China broke apart for half a century. The **Song** put most of it together again in 960.

        **Tap the bars and dots** to see who else was around.
      `,
      figure: {
        type: 'timeline', from: 550, to: 1500, step: 150, mode: 'explore',
        spans: [
          { id: 'tang', from: 618, to: 907, label: 'Tang China', color: 'orange', note: '**618 to 907.** A huge, outward-looking empire. Its capital Chang\'an had Persian, Sogdian, Korean and Japanese residents. Wu Zetian ruled as emperor from 690 to 705.' },
          { id: 'song', from: 960, to: 1279, label: 'Song China', color: 'blue', note: '**960 to 1279.** Smaller than the Tang, but far richer. In 1127 invaders from the north took Kaifeng, and the court moved south to Hangzhou.' },
          { id: 'heian', from: 794, to: 1185, label: 'Heian Japan', color: 'pink', note: '**794 to 1185.** The age of the court at Kyoto (Heian-kyo), a city laid out on the plan of Chang\'an.' },
          { id: 'goryeo', from: 918, to: 1392, label: 'Goryeo Korea', color: 'green', note: '**918 to 1392.** The kingdom whose name gives us the word "Korea".' },
        ],
        events: [
          ev('baghdad', { color: 'gray', note: 'The Abbasid capital of lesson 2. Tang China and the caliphs were the two great powers of the 700s.' }),
          ev('chinggis', { color: 'gray', note: 'The Mongols (lesson 6) conquered all of China by 1279 and ended the Song.' }),
        ],
        alt: 'A timeline from 550 to 1500. Bars: Tang China 618 to 907, Song China 960 to 1279, Heian Japan 794 to 1185, Goryeo Korea 918 to 1392. Events: Baghdad founded 762, Chinggis Khan proclaimed 1206.',
      },
    },
    {
      id: 'qingming',
      type: 'choice',
      title: 'A morning in the capital',
      text: `
        In the early 1100s the court painter Zhang Zeduan painted a scroll more than five metres long that walks the viewer through a city, almost certainly Kaifeng. This is the bridge at its centre.

        **Look closely. What kind of city is this?**
      `,
      figure: pic('qingming-bridge', {
        alt: 'A detail of a Chinese scroll painting in ink on brown silk. A wooden bridge arches over a river and is packed with people, porters with shoulder poles, donkeys and stalls under big umbrellas. A large boat with its mast lowered is steering towards the arch while its crew and people on the bridge wave and shout. Tiled roofs of shops line the banks.',
        caption: 'Zhang Zeduan, Along the River During the Qingming Festival (detail), early 1100s, shown here in a modern reproduction',
        creditLabel: 'Painting',
      }),
      options: [
        { text: 'A trading city: shops, stalls, cargo boats and crowds of ordinary people', correct: true },
        { text: 'A fortress city: soldiers, walls and weapons everywhere', why: 'Look for soldiers: there are hardly any. The crowd is busy buying, selling and carrying.' },
        { text: 'A holy city: temples and pilgrims fill the picture', why: 'There are a few monks in the scroll, but the painter\'s eye is on commerce.' },
      ],
      explain: `
        Stalls spill onto the bridge itself. Along the scroll there are eating houses, wine shops, a pharmacy, a storyteller with his audience, and boats bringing in grain. Earlier Chinese capitals had locked their markets inside walled wards and shut them at dusk. In Song cities, business ran along every street and late into the night.
      `,
    },
    {
      id: 'rice-canal',
      type: 'info',
      title: 'What fed a million people',
      text: `
        Two things, both visible on the map.

        **A new rice.** From **Champa**, in what is now central Vietnam, came a rice that ripened so fast that farmers in the warm south could harvest twice a year. In 1012 the government handed out its seed. China's population roughly doubled, to perhaps 100 million by 1100.

        **A canal.** China's two great rivers both flow from west to east. The **Grand Canal**, dug mainly between 605 and 610, cut across them from south to north.
      `,
      figure: {
        type: 'world-map', dots: false, view: [100, 13, 127, 42], dim: false,
        rivers: ['Yellow River', 'Yangtze'],
        lines: [
          { points: CANAL, color: 'red', width: 3.5, curve: 'straight', animate: 'draw', label: 'Grand Canal' },
          { points: CANAL_NORTH, color: 'red', width: 3.5, curve: 'straight', animate: 'draw' },
          { points: [[108.8, 15.2], [111.5, 20], [114.5, 25.5]], color: 'green', width: 4, arrow: true, animate: 'draw', label: 'Champa rice' },
        ],
        markers: [mk('kaifeng', { shape: 'star', color: 'red', labelPos: 'left' }), mk('hangzhou', { labelPos: 'right' }), mk('beijing', { labelPos: 'right' }), mk('changan', { labelPos: 'bottom' })],
        labels: [{ at: [107.6, 14.6], text: 'Champa', style: 'area' }],
        alt: 'A map of eastern China. The Yellow River in the north and the Yangtze further south both flow east to the sea. The Grand Canal runs from Hangzhou, south of the Yangtze, north-west across both rivers to Kaifeng, with a branch on to Beijing. An arrow shows Champa rice arriving from Vietnam in the south.',
      },
    },
    {
      id: 'canal',
      type: 'choice',
      text: `
        The rice grew best in the wet south, around the Yangtze. The capital, the court and most of the army were in the dry north.

        **What did the Grand Canal make possible?**
      `,
      options: [
        { text: 'Barges could carry southern grain to the northern capital, cheaply and in bulk', correct: true },
        { text: 'Ships from the Indian Ocean could sail directly to the capital', why: 'Ocean ships stopped at ports such as Guangzhou and Quanzhou. The canal was for flat-bottomed barges.' },
        { text: 'The south could be defended against invaders from the north', why: 'A canal is a road, not a wall. If anything it helped northern armies move south.' },
        { text: 'The Yellow River stopped flooding', why: 'It did not: the Yellow River went on flooding and changing its course, and often silted up the canal.' },
      ],
      explain: `
        A barge on still water carries what would need dozens of carts. The canal tied the rice bowl of the south to the capital in the north, and the country into one market.

        Industry grew too. Song ironworks burned coal and, by one much-quoted (and debated) estimate, made about as much iron in 1078 as all of England did seven centuries later.
      `,
    },
    {
      id: 'money',
      type: 'choice',
      title: 'Lighter money',
      text: `
        In Sichuan, in western Song China, coins were made of **iron**: a roll of silk cost more than its own weight in coins. About 1000, merchants began leaving their coins with trusted shops and paying with the shops' printed receipts. In **1024** the government took the business over.

        No Song note is known to survive. This one was printed the same way in 1287; its plate is on the left.

        **Why would anyone accept paper for a cartload of coins?**
      `,
      figure: pic('banknote', {
        alt: 'On the left, a dark metal printing plate; on the right, a banknote printed from it in black on pale paper. Both show the same design: a line of large Chinese characters at the top, two strings of coins in the middle and a block of small writing below, inside a patterned border.',
        caption: 'Banknote of 1287 and its printing plate, Yuan China',
      }),
      options: [
        { text: 'Because the issuer promised to honour it, and people trusted the promise', correct: true },
        { text: 'Because paper was rare and valuable in itself', why: 'Paper was cheap in China. The note is worth only what its issuer will give or accept for it.' },
        { text: 'Because the notes were made of silk', why: 'They were printed on paper. Their value came from a promise, not from the material.' },
        { text: 'Because the law forbade the use of coins', why: 'Coins stayed in use everywhere. Notes won because they were easier to carry.' },
      ],
      explain: `
        Paper money is a **promise**, and it works as long as the promise is believed. When later governments printed notes to pay for wars, prices soared and the trust drained away: China also had the world's first paper-money **inflation**.

        The idea did not reach Europe until the 1600s. Every banknote in your pocket is a descendant of these.
      `,
    },
    {
      id: 'printing',
      type: 'choice',
      title: 'A book from one piece of wood',
      text: `
        This is the opening of the **Diamond Sutra**, a Buddhist text printed in **868**: the oldest dated printed book in the world. It was found in a sealed cave at **Dunhuang**, the oasis of lesson 1.

        Each sheet, picture and text together, was carved in mirror image on one wooden block. About **1040** a craftsman named **Bi Sheng** invented separate clay characters that could be set, printed and reused. Yet most Chinese printers stayed with whole blocks. (Recall from *First Worlds*: a Chinese character stands for a whole word.) **Why?**
      `,
      figure: pic('diamond-sutra', {
        alt: 'A printed sheet in black ink on greyish paper. Most of it is a finely detailed line drawing of the Buddha seated behind a small table, surrounded by monks and attendants, with two lions at his feet and an old man kneeling before him. At the left edge, columns of Chinese characters begin.',
        caption: 'The Diamond Sutra, printed in China in 868',
        creditLabel: 'Image',
        credit: 'British Library',           // the record's author field holds a description of the colophon, not a name
      }),
      options: [
        { text: 'Chinese is written with thousands of different characters', correct: true },
        { text: 'Movable type was banned by the emperor', why: 'It was never banned. Printers tried clay, wood and metal type, and found blocks more practical for most jobs.' },
        { text: 'Wood was cheaper than paper', why: 'Both were cheap. The question is how much work it takes to prepare a page.' },
        { text: 'Bi Sheng kept his method secret', why: 'His method was written up in detail by the scholar Shen Kuo in 1088, which is how we know about it.' },
      ],
      explain: `
        A printer of Chinese needs many thousands of different characters, and several copies of the common ones. Sorting and setting them is slow; carving a whole page is fast for a skilled cutter, and the block can be stored and reprinted for decades.

        With an alphabet of a couple of dozen letters the sums come out the other way, as you will see with Gutenberg in *One World*. Korean printers were casting **metal** type by the 1200s.
      `,
    },
    {
      id: 'teach-inventions',
      type: 'info',
      title: 'Four inventions, four odd beginnings',
      text: `
        Printing is one of four Chinese inventions that changed the world. None began as what it became.

        - **Paper**, known since Han times (*First Worlds*), was first used for wrapping and padding. Only later did anyone write on it.
        - **Woodblock printing** began as a way to make many copies of Buddhist prayers and texts, such as the Diamond Sutra.
        - **Gunpowder** was stumbled on in the 800s by Daoist alchemists searching for a medicine for long life. Song armies made bombs and fire-arrows with it.
        - The **magnetic compass** was first a tool for fortune-telling, and for lining up houses and graves. By about 1100 ships' pilots steered by its "south-pointing needle".
      `,
    },
    {
      id: 'first-use',
      type: 'match',
      title: 'What were they for, at first?',
      text: `
        Paper, printing, gunpowder, the compass: none began as what it became.

        **Match each invention with its first use.**
      `,
      pairs: [
        ['Gunpowder', 'Alchemists\' experiments in search of a medicine for long life'],
        ['The magnetic compass', 'Fortune-telling, and lining up houses and graves'],
        ['Paper', 'Wrapping and padding, before anyone wrote on it'],
        ['Woodblock printing', 'Making many copies of Buddhist prayers and texts'],
      ],
      explain: `
        The alchemists' search for long life ended in a weapon (Song soldiers wrote down the recipe for gunpowder in 1044), and a fortune-teller's needle came to steer ships.

        Paper, printing, compass and powder are often called China's "Four Great Inventions". That label is modern. Nobody in Song China would have picked these four out of hundreds, among them porcelain, the canal lock and the sternpost rudder.
      `,
    },
    {
      id: 'teach-exams',
      type: 'info',
      title: 'Rule by exam',
      text: `
        Who should run a country: the sons of great families, or the people who know most?

        Song China chose its officials mainly by **written examinations** on the Confucian classics (you met Confucius in *First Worlds*). Printing made the set books cheap enough for thousands to try.

        - Papers were numbered, and even recopied by clerks, so that no marker could recognise a name or a friend's handwriting.
        - In principle a farmer's son could sit them. In practice it took years of study that poor families could rarely afford. Women could not sit them at all.
        - At the top level only a few hundred passed, out of many thousands.
      `,
    },
    {
      id: 'exams',
      type: 'multi',
      title: 'How fair was it?',
      text: `
        A village schoolmaster in Song China tells his pupils what to expect of the examinations.

        **Which of these could he truthfully say?** Choose every one.
      `,
      options: [
        { text: 'Candidates\' names were hidden from the markers', correct: true },
        { text: 'In principle, a farmer\'s son could sit them', correct: true },
        { text: 'Only a tiny share of candidates passed the highest level', correct: true },
        { text: 'Women could sit them', why: 'They could not, though many daughters of scholar families were highly educated. Li Qingzhao, one of China\'s greatest poets, lived under the Song.' },
      ],
      explain: `
        Hidden names kept the marking fair. The years of study it took kept most poor families out all the same.

        The men who passed, the **scholar-officials**, set the tone of Chinese culture: they wrote poetry, practised calligraphy and painted misty mountain landscapes. Korea and Vietnam adopted the system. So, much later and in their own way, did the civil services of Europe: every anonymous written exam you have sat has a Chinese ancestor.
      `,
    },
    {
      id: 'teach-neighbours',
      type: 'info',
      title: 'Three neighbours',
      text: `
        Korea, Japan and Vietnam all took Chinese characters, Buddhism and Chinese ideas of government. Then each built something of its own on top.

        | Country | What it made its own |
        |---|---|
        | **Korea** | The kingdom of Goryeo (capital: Kaesong), famous for grey-green celadon pottery. **Hangul**, an alphabet designed at the king's order in 1443. |
        | **Japan** | The emperor's court at Kyoto. **Kana**, signs for syllables simplified from Chinese characters. *The Tale of Genji*, a novel written about 1010 by the court lady Murasaki Shikibu. |
        | **Vietnam** | Independence in 938, after about a thousand years of Chinese rule. A capital at Thang Long, today's Hanoi. |
      `,
      figure: {
        type: 'world-map', dots: false, view: EAST_ASIA, dim: false,
        markers: [
          mk('kaesong', { color: 'green', shape: 'square', labelPos: 'top' }), mk('kyoto', { color: 'green', shape: 'square', labelPos: 'bottom' }), mk('thanglong', { color: 'green', shape: 'square', labelPos: 'left' }),
          mk('changan', { labelPos: 'left' }), mk('kaifeng', { labelPos: 'top' }), mk('beijing', { labelPos: 'left' }), mk('hangzhou', { labelPos: 'right' }), mk('guangzhou', { labelPos: 'bottom' }),
        ],
        labels: [{ at: [108, 29.5], text: 'China', style: 'area' }, { at: [139.5, 38.5], text: 'Japan', style: 'area' }, { at: [129.3, 40.3], text: 'Korea', style: 'area' }, { at: [106.2, 18.6], text: 'Vietnam', style: 'area' }],
        alt: 'A map of East Asia. Five cities of China are marked with dots: Beijing in the north, Chang\'an and Kaifeng on the Yellow River plain, Hangzhou near the coast and Guangzhou in the far south. Three capitals of its neighbours are marked with squares: Kaesong in Korea, Kyoto in Japan and Thang Long in northern Vietnam.',
      },
    },
    {
      id: 'find-city',
      type: 'interact',
      review: true,
      gen: (rng) => findOnMap(rng, {
        pool: ['changan', 'kaifeng', 'hangzhou', 'guangzhou', 'beijing', 'kyoto', 'kaesong', 'thanglong'],
        view: EAST_ASIA,
        alt: 'A map of East Asia with five unnamed markers.',
      }),
    },
    {
      id: 'neighbours',
      type: 'bucket',
      review: true,
      title: 'Borrowed, then made their own',
      text: `
        Korea, Japan and Vietnam all took Chinese characters, Buddhism and Chinese ideas of government. Then each built something of its own on top.

        **Sort each item to its country.**
      `,
      buckets: ['Korea', 'Japan', 'Vietnam'],
      items: [
        { text: 'Hangul, an alphabet designed at the king\'s order in 1443', bucket: 0, why: 'King Sejong had hangul created so that ordinary Koreans could read and write their own language.' },
        { text: 'The kingdom of Goryeo, famous for grey-green celadon pottery', bucket: 0 },
        { text: 'Kana, two sets of signs for syllables, simplified from Chinese characters', bucket: 1 },
        { text: '*The Tale of Genji*, a novel written about 1010 by the court lady Murasaki Shikibu', bucket: 1, why: 'Murasaki Shikibu wrote at the court in Kyoto, in Japanese, using kana.' },
        { text: 'The court at Kyoto, with the emperor at its centre and warrior families gaining power', bucket: 1 },
        { text: 'Independence in 938, after about a thousand years of Chinese rule', bucket: 2, why: 'Northern Vietnam was ruled from China from 111 BCE. It broke free in 938 and later fought off Song and Mongol invasions.' },
        { text: 'A capital at Thang Long, today\'s Hanoi', bucket: 2 },
      ],
      explain: `
        Korea gave itself an alphabet; Japan grew a court literature written largely by women; Vietnam took Chinese statecraft and used it to stay independent of China. None was a copy.
      `,
    },
    {
      id: 'when',
      type: 'interact',
      title: 'Four centuries early',
      text: `
        Three moments from this lesson: the **Diamond Sutra** is printed; **Bi Sheng** invents movable type; Korea gets its alphabet, **hangul**.

        **Drag each card to its date.** Within ${WHEN_TOLERANCE} years counts.
      `,
      widget: {
        type: 'timeline', from: 700, to: 1500, step: 100, snap: 10,
        events: [ev('charlemagne', { color: 'gray' }), ev('chinggis', { color: 'gray' }), ev('columbus', { color: 'gray' })],
        place: [
          { id: 'sutra', label: 'Diamond Sutra', color: 'orange', answer: WHEN.sutra },
          { id: 'type', label: 'Movable type', color: 'blue', answer: WHEN.type },
          { id: 'hangul', label: 'Hangul', color: 'green', answer: WHEN.hangul },
        ],
        alt: 'A timeline from 700 to 1500 with three landmarks (Charlemagne crowned 800, Chinggis Khan proclaimed 1206, Columbus sails 1492) and three cards to place: Diamond Sutra, movable type and hangul.',
      },
      check: (s) => {
        if (!s.complete) return 'Place all three cards on the line.';
        for (const [id, name] of [['sutra', 'The Diamond Sutra'], ['type', 'Movable type'], ['hangul', 'Hangul']]) {
          const off = s.placed[id] - WHEN[id];
          if (Math.abs(off) > WHEN_TOLERANCE) return `${name} is more than ${WHEN_TOLERANCE} years too ${off > 0 ? 'late' : 'early'}.`;
        }
        return true;
      },
      solution: { placed: { sutra: 870, type: 1040, hangul: 1440 } },
      hints: ['The Diamond Sutra is a Tang book, from soon after Charlemagne. Bi Sheng worked under the Song, before the Mongols.', 'About 870, about 1040, and the 1440s.'],
      explain: `
        868, about 1040 and 1443. Gutenberg printed his Bible in Germany in the 1450s: about **four centuries after Bi Sheng**, and nearly six after the Diamond Sutra.
      `,
    },
    {
      id: 'teach-timeline',
      type: 'info',
      title: 'China and the world on one line',
      text: `
        Here are the lesson's dates on one line, beside two you know from other lessons: Baghdad was founded in ${when('baghdad')}, and Charlemagne was crowned in ${when('charlemagne')}.

        The **Tang** dynasty begins in ${when('tang')} and prints the Diamond Sutra in ${when('diamondsutra')}. The **Song** begins in ${when('song')}, and Bi Sheng's movable type follows ${when('movabletype')}.

        In ${when('chinggis')} the Mongols proclaim Chinggis Khan, and in ${when('songfalls')} his grandson **Kublai Khan** completes the conquest of Song China: the story of lesson 6. Korea's hangul comes last, in ${when('hangul')}.
      `,
      figure: {
        type: 'timeline', from: 550, to: 1500, step: 150, mode: 'static', showYears: true,
        events: WHICH_POOL.map((id) => ev(id, { color: ['baghdad', 'charlemagne', 'chinggis'].includes(id) ? 'gray' : id === 'hangul' ? 'green' : id === 'tang' || id === 'diamondsutra' ? 'orange' : 'blue' })),
        alt: `A timeline from 550 to 1500 with nine events: ${WHICH_POOL.map((id) => `${EVENTS[id].short}, ${when(id)}`).join('; ')}.`,
      },
    },
    {
      id: 'which-first',
      type: 'choice',
      review: true,
      gen: (rng) => whichFirst(rng, { pool: WHICH_POOL, minGap: 100 }),
    },
  ],
  recap: [
    'Song China (960 to 1279) had cities of a million, fed by fast-ripening rice and tied together by the Grand Canal.',
    'It printed books (Diamond Sutra, 868; movable type about 1040), issued paper money (1024), steered ships by compass and made gunpowder.',
    'Officials were chosen by anonymous written exams, which made learning the road to power.',
    'Korea, Japan and Vietnam borrowed Chinese writing, Buddhism and statecraft and turned them into cultures of their own.',
  ],
  next: 'Next: the far western end of Eurasia. Was Europe after Rome really a "dark age"?',
};
