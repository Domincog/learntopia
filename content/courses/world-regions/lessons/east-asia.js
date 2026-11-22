// Around the World: Places and Cultures · Lesson 5 · East Asia: A Shared Inheritance
//
// Driving question: what did China, Japan, Korea and Mongolia inherit in common, and what did
// each make of it?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-regions/index.js';
import { FIND, PICKABLE, VIEW, FEATURES, LANDMARKS, NOT_THE_BIGGEST, findCountry, tapCity, tapFeature, whichPhoto, inOrder, featuresMap, citiesMap, landmarkFigure, dateLines, datesTimeline } from '../helpers.js';

const HU_LINE = { points: [[127.5, 50.25], [98.5, 25]], color: 'red', dashed: true, width: 3, curve: 'straight' };
// The nine anchors of FEATURES.eastAsia: six are taught on the map of China's two halves, three on the map of its neighbours.
const CHINA_ANCHORS = ['the Tibetan Plateau', 'the Taklamakan Desert', 'the Gobi Desert', 'the North China Plain', 'the Sichuan Basin', 'the Yangtze Delta'];
const ISLANDS = FEATURES.eastAsia.filter((f) => ['Honshu', 'Hokkaido', 'the Korean Peninsula'].includes(f.name));
const EVENTS = ['qin', 'kyoto', 'hangul', 'meiji', 'shinkansen'];

const CITIES = [
  { name: 'Beijing', clue: 'the capital of China, in the north', hint: 'It stands at the northern edge of the North China Plain, not far south of the Great Wall.', fact: `Its name means "north capital". ${NOT_THE_BIGGEST.CN[1]}` },
  { name: 'Shanghai', clue: 'China\'s largest city, at the mouth of the Yangtze', hint: 'It is half-way down the coast, where the longest river reaches the sea.', fact: 'Shanghai has the busiest container port in the world.' },
  { name: 'Guangzhou', clue: 'the great trading city of China\'s far south, on the Pearl River', hint: 'It is near the south coast, close to Hong Kong.', fact: 'Guangzhou, once known in the West as Canton, has traded with the world by sea for more than a thousand years.' },
  { name: 'Chongqing', clue: 'the giant inland city on the upper Yangtze', hint: 'It is deep inland, at the edge of the Sichuan Basin.', fact: 'Downstream from Chongqing the Yangtze runs through the Three Gorges, site of the largest power station in the world.' },
  { name: 'Tokyo', clue: 'the capital of Japan, on the Pacific coast of Honshu', hint: 'It is on the eastern side of Japan\'s largest island.', fact: 'Greater Tokyo, with about 37 million people, is by most counts the largest urban area in the world.' },
  { name: 'Osaka', clue: 'Japan\'s second great urban area, in western Honshu, beside the old capital Kyoto', hint: 'It is on Japan\'s largest island, well to the west of Tokyo.', fact: 'Osaka, Kyoto and Kobe have grown into one continuous urban area of nearly 20 million people.' },
  { name: 'Seoul', clue: 'the capital of South Korea', hint: 'It is in the north-west of South Korea, near the middle of the peninsula.', fact: 'Seoul lies only about 50 km from the border with North Korea.' },
  { name: 'Ulaanbaatar', clue: 'the capital of Mongolia', hint: 'It is far inland, north of the Gobi Desert.', fact: 'Nearly half of all Mongolians live in Ulaanbaatar, the coldest national capital in the world.' },
  { name: 'Sapporo', clue: 'the largest city of Hokkaido, Japan\'s snowy northern island', hint: 'It is on the northernmost of Japan\'s four main islands.', fact: 'Sapporo hosted the Winter Olympics of 1972 and holds a famous snow festival every February.' },
  { name: 'Xi\'an', clue: 'the ancient capital in the middle of China, where the Silk Roads began', hint: 'It is inland, in the valley of a tributary of the Yellow River.', fact: 'Under the name Chang\'an it was the capital of the Han and Tang dynasties (see *Crossroads*). The First Emperor\'s terracotta army is buried nearby.' },
  { name: 'Urumqi', clue: 'the main city of China\'s far north-west', hint: 'It is beyond the deserts, nearer to Kazakhstan than to Beijing.', fact: 'Urumqi is farther from the sea than any other large city in the world: about 2,500 km.' },
  { name: 'Harbin', clue: 'the main city of China\'s cold north-east', hint: 'It is in the far north-east, north of the Korean Peninsula.', fact: 'Every winter Harbin builds a festival city of palaces and towers carved from ice.' },
];

export default {
  id: 'east-asia',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A line across China',
      text: `
        In 1935 the geographer Hu Huanyong drew a straight line across a map
        of China. The part to the **east** of it is 43% of the country's
        land.

        **What share of China's 1.4 billion people do you think live east of the line?**
      `,
      figure: {
        type: 'world-map', view: VIEW.eastAsia, static: true,
        regions: [{ ids: ['CN'], color: 'yellow', tone: 'soft' }], legend: false,
        lines: [HU_LINE],
        alt: 'A map of East Asia with China tinted. A dashed straight line crosses China from the far north-east to the south-west, cutting it into a smaller eastern part and a larger western part.',
      },
      min: 40, max: 100, step: 1, start: 43, answer: 94, tolerance: 2, unit: '%',
      explain: `
        About **94%**. The line has hardly shifted in ninety years.

        The crowded eastern side is the home of one of the oldest continuous
        civilisations on Earth, and for 2,000 years its neighbours borrowed
        from it: writing, philosophy, ways of running a state. This lesson
        asks
        **what East Asia inherited in common, and what each country made of it.**
      `,
    },
    {
      id: 'teach-china',
      type: 'info',
      title: 'Two Chinas, either side of the line',
      text: `
        **West** of Hu's line:

        - the **Tibetan Plateau**, the "roof of the world", averaging more
          than 4,000 metres above the sea;
        - the **Taklamakan Desert**, sand ringed by Silk Road oases;
        - the **Gobi Desert**, cold and dry, shared with Mongolia.

        **East** of it:

        - the **North China Plain**, the flat, densely farmed lowland built
          by the Yellow River;
        - the **Sichuan Basin**, a fertile bowl walled in by mountains;
        - the **Yangtze Delta**, where China's longest river reaches the
          sea.
      `,
      figure: featuresMap(FEATURES.eastAsia, {
        view: 'eastAsia', names: CHINA_ANCHORS,
        pos: { 'the Tibetan Plateau': 'bottom', 'the Taklamakan Desert': 'top', 'the Gobi Desert': 'right', 'the North China Plain': 'right', 'the Sichuan Basin': 'bottom', 'the Yangtze Delta': 'right' },
        extra: { rivers: ['Yangtze', 'Yellow River'], lines: [HU_LINE] },
      }),
    },
    {
      id: 'why-empty',
      type: 'choice',
      title: 'Why so empty?',
      text: `
        West of the line lie the **Tibetan Plateau** and the **Gobi** and
        Taklamakan deserts. China's two great rivers both run from west to
        east.

        **What is the best explanation for how few people live in the west?**
      `,
      figure: {
        type: 'world-map', view: VIEW.eastAsia, static: true, rivers: ['Yangtze', 'Yellow River'],
        lines: [HU_LINE],
        labels: [
          { at: [88, 33], text: 'Tibetan Plateau', style: 'area' },
          { at: [104, 43], text: 'Gobi', style: 'area' },
          { at: [82, 39], text: 'Taklamakan', style: 'area' },
        ],
        alt: 'East Asia with the dashed line across China. West of it are the Tibetan Plateau, the Taklamakan and the Gobi; the Yellow River and the Yangtze both flow from the plateau eastwards to the sea.',
      },
      options: [
        { text: 'It is too high or too dry to farm: rain from the Pacific rarely reaches it', correct: true },
        { text: 'The government does not allow people to live there', why: 'Millions of people do live there, in oases and valleys, and the pattern is far older than any modern government.' },
        { text: 'The soil in the east is volcanic and the soil in the west is not', why: 'The eastern plains are fertile because rivers spread silt over them, not because of volcanoes.' },
        { text: 'The west was explored only recently', why: 'The Silk Roads crossed the west 2,000 years ago. People knew it well; it simply could not feed many.' },
      ],
      explain: `
        **Water and height.** The summer monsoon brings rain to the east;
        the plateau, averaging more than 4,000 metres, and the deserts
        behind it get little. It is the same rule you met in
        *The World at a Glance*: people live where crops will grow.
      `,
    },
    {
      id: 'land',
      type: 'info',
      title: 'Peninsula, islands, steppe',
      text: `
        China's neighbours are shaped by their land too.

        - **Japan** is an arc of volcanic islands, about three-quarters
          mountain, so its people crowd onto small coastal plains.
          **Honshu** is the largest island, **Hokkaido** the northernmost.
        - **Korea** is a mountainous peninsula between China and Japan,
          divided since 1945 into North Korea and South Korea.
        - **Mongolia** is high, dry grassland: the steppe of the horse
          nomads you met in *Crossroads*.

        **Taiwan** has been governed separately from the Chinese mainland
        since 1949. The People's Republic of China claims it; Taiwan has its
        own elected government; and most countries have formal relations
        only with Beijing.
      `,
      figure: {
        type: 'world-map', view: VIEW.eastAsia,
        regions: [
          { ids: ['CN'], color: 'red', tone: 'soft' }, { ids: ['MN'], color: 'green', tone: 'soft' }, { ids: ['JP'], color: 'violet', tone: 'soft' },
          { ids: ['KP'], color: 'orange', tone: 'soft' }, { ids: ['KR'], color: 'blue', tone: 'soft' },
        ],
        legend: false, dim: false,
        labels: ['CN', 'MN', { at: [136.5, 32], text: 'Japan', style: 'name' }, 'KP', 'KR', { id: 'TW', text: 'Taiwan' }],
        markers: ISLANDS.filter((f) => f.name !== 'the Korean Peninsula').map((f) => ({ at: f.at, label: f.name, color: 'orange', shape: 'square', size: 's', labelPos: 'right' })),
        alt: 'A map of East Asia naming China, Mongolia to its north, North and South Korea on the peninsula to its east, Japan as an arc of islands offshore, and the island of Taiwan off the south-east coast. Two of Japan\'s islands are marked: Honshu, the largest, and Hokkaido, north of it.',
      },
    },
    {
      id: 'anchors',
      type: 'interact',
      title: 'The lie of the land',
      gen: (rng) => tapFeature(rng, FEATURES.eastAsia, { view: 'eastAsia', minKm: 600 }),
    },
    {
      id: 'find-country',
      type: 'interact',
      review: true,
      title: 'Find the country',
      gen: (rng) => findCountry(rng, FIND.eastAsia, PICKABLE.eastAsia),
    },
    {
      id: 'scripts',
      type: 'info',
      title: 'One script, then four',
      text: `
        **Chinese characters** stand for words, not sounds (you met them in
        *First Worlds*). So people who cannot understand each other's speech
        can read the same page. For centuries educated Koreans, Japanese and
        Vietnamese all wrote in Chinese characters.

        Then each country made something of its own:

        - **Japan** kept the characters and added two sets of simple signs
          for syllables, the *kana*. All three are mixed in every sentence.
        - **Korea** invented an alphabet, *hangul*, in 1443. Its letters
          are stacked into square blocks, one block per syllable.
        - **Vietnam** switched to Latin letters; **Mongolia** uses the
          Cyrillic alphabet, as Russian does, beside its own older script.
      `,
      figure: {
        type: 'svg', viewBox: '0 0 360 210', maxWidth: 420,
        alt: 'Four lines of writing. Chinese: dense square characters. Japanese: a few such characters mixed with simpler, rounder signs. Korean: blocks built from circles and short straight strokes. Mongolian: letters like those of Russian.',
        content:
          '<text class="fig-label-sm text-muted" x="12" y="30">Chinese</text><text class="fig-label-lg" x="110" y="34" font-size="26">我喜欢喝茶</text>' +
          '<text class="fig-label-sm text-muted" x="12" y="82">Japanese</text><text class="fig-label-lg" x="110" y="86" font-size="26">私はお茶が好きです</text>' +
          '<text class="fig-label-sm text-muted" x="12" y="134">Korean</text><text class="fig-label-lg" x="110" y="138" font-size="26">저는 차를 좋아해요</text>' +
          '<text class="fig-label-sm text-muted" x="12" y="186">Mongolian</text><text class="fig-label-lg" x="110" y="190" font-size="22">Би цайнд дуртай</text>',
        caption: '"I like tea" in four languages',
      },
    },
    {
      id: 'read-characters',
      type: 'choice',
      stretch: true,
      title: 'Read some Chinese',
      text: `
        Three city names. The first two are in China; the third is how
        Japan writes the name of its own capital.

        | Written | City | Meaning |
        |---|---|---|
        | 北京 | Beijing | "north capital" |
        | 南京 | Nanjing | "south capital" |
        | 東京 | Tokyo | ? |

        **What do the two characters of Tokyo's name mean?**
      `,
      options: [
        { text: '京 is "capital", so 東 is probably a direction: "east capital"', correct: true },
        { text: '京 is "north", and 東 is "Japan"', why: '京 is also in Nanjing, the *south* capital, so it cannot mean "north".' },
        { text: 'Nothing: the characters only spell out the sound "Tokyo"', why: 'A Chinese reader says *Dōngjīng* and a Japanese reader *Tōkyō* for the same two characters. What they share is the meaning, not the sound.' },
      ],
      explain: `
        京 means **capital** and 東 means **east**: Tokyo is the "eastern
        capital". It got that name in 1868, when the emperor moved there
        from Kyoto (京都, "capital city").

        You have just read a little Chinese and a little Japanese without
        knowing how to pronounce either. That is exactly how one script
        could serve a whole region.
      `,
    },
    {
      id: 'whose-script',
      type: 'match',
      review: true,
      title: 'Whose writing?',
      text: `
        Each of these says "hello". **Match each to its language.**

        Clues: Chinese uses only dense, square characters. Japanese mixes a
        few of them with simpler, rounder signs. Korean builds blocks out of
        circles and short straight strokes. Mongolian is written in the
        same letters as Russian.
      `,
      pairs: [
        ['你好', 'Chinese'],
        ['こんにちは', 'Japanese'],
        ['안녕하세요', 'Korean'],
        ['Сайн байна уу', 'Mongolian'],
      ],
      explain: `
        你好 (*nǐ hǎo*) is Chinese; こんにちは (*konnichiwa*) is Japanese,
        here written entirely in kana; 안녕하세요 (*annyeonghaseyo*) is
        Korean hangul, invented in 1443 so that ordinary people could learn
        to read; Сайн байна уу is Mongolian in Cyrillic letters.
      `,
    },
    {
      id: 'teach-beliefs',
      type: 'info',
      title: 'Four traditions',
      text: `
        Most East Asians do not belong to one religion alone. Four
        traditions overlap, and people draw on more than one.

        - **Confucianism**, from China: a philosophy of family duty, respect
          for learning and good government. Confucius taught about 2,500
          years ago.
        - **Daoism**, also from China: living in harmony with the "Way" of
          nature.
        - **Buddhism**, from India: it reached East Asia along the Silk
          Roads.
        - **Shinto**, Japan's own tradition: reverence for the spirits of
          nature and of ancestors. A simple gate called a *torii* marks its
          shrines.
      `,
    },
    {
      id: 'beliefs',
      type: 'match',
      title: 'Which tradition?',
      text: `
        In Japan, a baby may be blessed at a Shinto shrine and a grandparent
        mourned at a Buddhist temple: the traditions sit side by side.

        **Match each tradition to its description.**
      `,
      pairs: [
        ['Confucianism', 'From China: a philosophy of family duty, respect for learning and good government'],
        ['Daoism', 'From China: living in harmony with the "Way" of nature'],
        ['Buddhism', 'From India: it reached East Asia along the Silk Roads'],
        ['Shinto', 'From Japan: reverence for the spirits of nature and of ancestors'],
      ],
      explain: `
        The ideas of **Confucius** (see *First Worlds*) shaped family life
        and schooling in China, Korea, Japan and Vietnam: the fierce
        university entrance exams of East Asia today descend from the
        examinations that once chose China's officials.

        **Buddhism** came from India by way of Central Asia; **Daoism** is
        Chinese; **Shinto** is Japan's own.
      `,
    },
    {
      id: 'great-wall',
      type: 'interact',
      title: 'How does a wall send a message?',
      text: `
        This is the **Great Wall of China**, north of Beijing. It was a
        barrier against raiders from the steppe, and also a road along the
        mountain tops for the soldiers who guarded it.

        It was a signalling system too: a warning could travel hundreds of
        kilometres in a few hours, with no rider carrying it.
        **Tap the part of the wall that made that possible.**
      `,
      widget: photo(MEDIA['great-wall'], {
        alt: `${LANDMARKS['great-wall'].alt}. Four parts are ringed: a tower, the walkway on top of the wall, the wall on a distant ridge, and a wooded hillside.`,
        hotspots: [
          { id: 'tower', x: 0.76, y: 0.62, r: 0.055, label: 'Watchtower: a beacon was lit here', alt: 'a square tower built into the wall' },
          { id: 'walkway', x: 0.745, y: 0.41, r: 0.05, label: 'Walkway: a road for troops', alt: 'the stepped walkway along the top of the wall' },
          { id: 'far-wall', x: 0.68, y: 0.26, r: 0.05, label: 'The wall runs on over the next ridge', alt: 'the wall crossing a distant ridge' },
          { id: 'hillside', x: 0.44, y: 0.72, r: 0.07, label: 'Hillside', alt: 'a steep wooded hillside below the wall' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'tower') return true;
        if (s.picked === 'walkway') return 'The walkway let soldiers march along the wall, but a marching soldier is slow. What could be seen from far away?';
        if (s.picked === 'far-wall') return 'The wall does run on for thousands of kilometres, but stone carries no message. What on the wall could show a light?';
        if (s.picked === 'hillside') return 'The hills are why the wall is here, but they send no messages. Look at the wall itself.';
        return 'Tap one of the numbered rings.';
      },
      solution: { picked: 'tower' },
      hints: ['Each one was built within sight of the next.'],
      explain: `
        The **watchtowers** stand within sight of one another. Guards lit
        fires by night and made smoke by day, and the signal leapt from
        tower to tower.

        Walls were built along this frontier for 2,000 years; most of what
        stands today is the work of the Ming dynasty (1368 to 1644). One
        thing the wall is not: visible from the Moon. It is very long, but
        no wider than a road.
      `,
    },
    {
      id: 'teach-landmarks',
      type: 'info',
      title: 'A mountain and a palace',
      text: `
        Two more sights to know beside the Great Wall.

        **Mount Fuji** stands on the island of Honshu.
        ${LANDMARKS['mount-fuji'].fact}

        **Gyeongbokgung Palace** is in Seoul.
        ${LANDMARKS.gyeongbokgung.fact}
      `,
      figure: [
        landmarkFigure('mount-fuji', { aspect: '4:3', fit: 'cover' }),
        landmarkFigure('gyeongbokgung', { aspect: '4:3', fit: 'cover' }),
      ],
    },
    {
      id: 'which-landmark',
      type: 'choice',
      review: true,
      gen: (rng) => whichPhoto(rng, ['great-wall', 'mount-fuji', 'gyeongbokgung'], ['great-wall', 'mount-fuji', 'gyeongbokgung', 'taj-mahal', 'kilimanjaro', 'angkor-wat']),
    },
    {
      id: 'teach-history',
      type: 'info',
      title: 'From the First Emperor to the bullet train',
      text: [
        'Five moments to hang East Asia\'s history on:',
        '',
        ...dateLines(EVENTS),
        '',
        'China was united long before Japan had a permanent capital. The Korean alphabet is older than Columbus\'s voyage. Japan\'s rush to modernise came in the age of steam.',
      ].join('\n'),
      figure: datesTimeline(EVENTS, { qin: 'China united', kyoto: 'Kyoto', hangul: 'Korean alphabet', meiji: 'Meiji era', shinkansen: 'Bullet train' }, { from: -500, to: 2100, step: 500 }),
    },
    {
      id: 'when',
      type: 'order',
      title: 'What came first?',
      text: '**Put these in order, earliest first.**',
      items: inOrder(EVENTS),
      labels: ['Earliest', 'Latest'],
      hints: ['China was united long before Japan had a permanent capital.', 'The Korean alphabet is older than Columbus\'s voyage; Japan\'s rush to modernise came in the age of steam.'],
      explain: `
        The First Emperor (221 BCE), Kyoto (794), the Korean alphabet
        (1443), the Meiji era (from 1868), the first bullet train (1964).

        When China was first united, Rome was still fighting Carthage for
        the western Mediterranean. Today East Asia leads the way in fast
        trains: China, which opened its first high-speed line in 2008, now
        has more such track than the rest of the world put together.
      `,
    },
    {
      id: 'teach-cities',
      type: 'info',
      title: 'Twelve great cities',
      text: `
        [Red stars]{.red} are capitals; [blue dots]{.blue} are other great
        cities.

        **China**: **Beijing**, the capital, in the north. **Shanghai**, the
        largest city, at the mouth of the Yangtze. **Guangzhou**, the
        trading city of the far south. **Chongqing**, deep inland on the
        upper Yangtze. **Xi'an**, the ancient capital in the middle.
        **Harbin** in the cold north-east, and **Urumqi** in the far
        north-west.

        **Japan**: **Tokyo**, the capital, on the Pacific coast of Honshu.
        **Osaka**, in western Honshu. **Sapporo**, on snowy Hokkaido.

        **Seoul** is the capital of South Korea, and **Ulaanbaatar** of
        Mongolia.
      `,
      figure: citiesMap(CITIES.map((c) => c.name), { view: 'eastAsia', pos: { Osaka: 'bottom', Tokyo: 'right', Seoul: 'bottom', Beijing: 'left', Shanghai: 'right', Guangzhou: 'bottom', Chongqing: 'left', 'Xi\'an': 'top', Harbin: 'top', Sapporo: 'top' } }),
    },
    {
      id: 'cities',
      type: 'interact',
      review: true,
      title: 'Great cities',
      gen: (rng) => tapCity(rng, CITIES, { view: 'eastAsia', minKm: 500 }),
    },
    {
      id: 'teach-culture',
      type: 'info',
      title: 'Shared roots, different branches',
      text: `
        Rice, tea, chopsticks and written characters are shared across the
        region. But each thing began somewhere.

        - **China** gave the region the teachings of Confucius, paper and
          printing, and the habit of drinking tea.
        - **Japan** made the kana signs and Shinto, and in our own time
          **manga** (comics) and **anime** (animated films).
        - **Korea** made the hangul alphabet, **kimchi** (spicy fermented
          cabbage) and the pop music known as **K-pop**.
      `,
    },
    {
      id: 'sort',
      type: 'bucket',
      title: 'Where did it begin?',
      text: '**Sort these by where they began.**',
      buckets: ['China', 'Japan', 'Korea'],
      items: [
        { text: 'The teachings of Confucius', bucket: 0 },
        { text: 'Paper and printing', bucket: 0, why: 'Both were invented in China (see *Crossroads*) and spread from there to the rest of the world.' },
        { text: 'Tea drinking', bucket: 0, why: 'Tea was first drunk in China. Japan later turned serving it into an art, the tea ceremony.' },
        { text: 'Kana syllable signs', bucket: 1 },
        { text: 'Manga and anime', bucket: 1 },
        { text: 'Shinto shrines', bucket: 1 },
        { text: 'The hangul alphabet', bucket: 2 },
        { text: 'Kimchi', bucket: 2 },
        { text: 'K-pop', bucket: 2 },
      ],
      explain: `
        East Asia shares a deep inheritance from China: characters,
        Confucian ideas, Buddhism passed on along the Silk Roads, tea and
        rice. But Japan, Korea and Mongolia each turned it into something
        of their own, and today their own inventions, from manga to K-pop,
        travel the world.
      `,
    },
  ],
  recap: [
    'About 94% of China\'s people live in the wetter, lower eastern half; the high, dry west is almost empty.',
    'Chinese characters stand for meanings, so they once served all of East Asia. Japan added kana, Korea invented hangul (1443), and Mongolia writes in Cyrillic.',
    'Confucianism and Daoism (from China), Buddhism (from India) and Shinto (in Japan) overlap: many people draw on more than one.',
    'Korea has been divided since 1945, and Taiwan governed separately from mainland China since 1949.',
  ],
  next: 'Next: south to the islands and straits of Southeast Asia, and out across the Pacific.',
};
