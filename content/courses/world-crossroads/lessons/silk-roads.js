// Crossroads: 500 to 1500 · Lesson 1 · Silk Roads and Monsoon Winds
//
// Driving question: how did goods, beliefs and ideas cross Afro-Eurasia a thousand years before
// engines, and which way carried the most?
import { distanceKm } from '../../../../src/widgets/world-map.js';
import {
  pic, mk, at, findOnMap, portOrOasis, TAKLAMAKAN,
  LAND_TRUNK_EAST, LAND_NORTH_BRANCH, LAND_SOUTH_BRANCH, LAND_TRUNK_WEST, LAND_TO_CONSTANTINOPLE, LAND_TO_INDIA,
  SEA_CHINA_INDIA, SEA_INDIA_GULF, SEA_INDIA_ADEN, SEA_RED_SEA, SEA_EAST_AFRICA,
} from '../helpers.js';

const LAND_VIEW = [24, 21, 118, 51];
const SEA_VIEW = [28, -22, 124, 36];
const FIND_VIEW = [14, -24, 122, 48];          // both webs at once: the summary map and the "find it" map

const CARAVAN = ['changan', 'dunhuang', 'kashgar', 'samarkand', 'baghdad'];
const caravanKm = CARAVAN.slice(1).reduce((sum, id, i) => sum + distanceKm(at(CARAVAN[i]), at(id)), 0);
const CARAVAN_KM = Math.round(caravanKm / 100) * 100;            // straight hops between the five cities
const CARAVAN_DAYS = Math.round(caravanKm / 30 / 10) * 10;       // at about 30 km a day

const landLines = (animate) => [
  { points: LAND_TRUNK_EAST, color: 'red', width: 3, animate, label: 'Main caravan roads', labelOn: 'legend' },
  { points: LAND_NORTH_BRANCH, color: 'red', width: 3, animate },
  { points: LAND_SOUTH_BRANCH, color: 'red', width: 3, animate },
  { points: LAND_TRUNK_WEST, color: 'red', width: 3, animate },
  { points: LAND_TO_CONSTANTINOPLE, color: 'red', width: 3, animate },
  { points: LAND_TO_INDIA, color: 'red', width: 3, animate },
];
const seaLines = (extra = {}) => [
  { points: SEA_CHINA_INDIA, color: 'blue', width: 3, label: 'Main sea routes', ...extra },
  { points: SEA_INDIA_GULF, color: 'blue', width: 3, ...extra },
  { points: SEA_INDIA_ADEN, color: 'blue', width: 3, ...extra },
  { points: SEA_RED_SEA, color: 'blue', width: 3, ...extra },
  { points: SEA_EAST_AFRICA, color: 'blue', width: 3, ...extra },
];

export default {
  id: 'silk-roads',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'A camel in a tomb',
      text: `
        About 1,300 years ago a wealthy family in northern China buried this pottery figure with one of their dead.

        Camels do not live on Chinese farmland: they are animals of the desert roads far to the west. On this one's back, on a platform spread with a patterned rug, a band of musicians is playing.

        **Why would a Chinese family want this in a tomb?**
      `,
      figure: pic('tang-camel', {
        alt: 'A glazed pottery figure of a camel with its head thrown back and its mouth open. On its back is a platform covered with a rug patterned in green, blue and amber diamonds, and on the platform sit several small musicians around a standing figure.',
        caption: 'Camel carrying musicians: tomb figure, Tang China, 700s CE',
      }),
      options: [
        { text: 'Camels stood for the riches and pleasures brought by long-distance trade', correct: true },
        { text: 'The family had conquered a desert kingdom', why: 'A fair guess, but figures like this turn up in hundreds of tombs of officials and merchants, not only of generals.' },
        { text: 'Camels were holy animals in Chinese religion', why: 'They were not. They were the trucks of their day.' },
      ],
      explain: `
        Tombs of the Tang dynasty are full of pottery camels, with their foreign grooms, merchants and musicians. They were the sign of a good life: the caravans brought wealth to the capital, **Chang'an**, and the music and dances of Central Asia were the height of fashion there.

        This lesson asks how goods, beliefs and ideas crossed half the world a thousand years before engines, and **which way carried the most**.
      `,
    },
    {
      id: 'web',
      type: 'info',
      title: 'Not one road but a web',
      text: `
        West of China lies the **Taklamakan**, a desert of shifting sand ringed by high mountains. No caravan crossed its middle. The roads ran round its edges, from one **oasis** to the next, wherever meltwater from the mountains reached the sand.

        Watch the roads draw themselves, then find where they **split** and where they **join** again.

        You met the first of these routes in *First Worlds*, when Han China and Rome traded without ever meeting. By 700 CE, under China's **Tang** dynasty, the web was far busier.
      `,
      figure: {
        type: 'world-map', dots: false, view: LAND_VIEW, dim: false,
        areas: [{ polygon: TAKLAMAKAN, color: 'yellow', label: 'Taklamakan Desert' }],
        lines: landLines('draw'),
        markers: [
          mk('changan', { shape: 'square', color: 'red', labelPos: 'bottom' }), mk('dunhuang', { labelPos: 'top' }), mk('kashgar', { labelPos: 'bottom' }),
          mk('samarkand', { labelPos: 'top' }), mk('baghdad', { labelPos: 'bottom' }), mk('constantinople', { labelPos: 'top' }),
        ],
        labels: [{ at: [88, 32.5], text: 'Tibet', style: 'area' }, { at: [60, 46.5], text: 'Steppe', style: 'area' }, { at: [78, 24], text: 'India', style: 'area' }],
        alt: 'A map of Asia from the Mediterranean to China. Caravan roads run west from Chang\'an to Dunhuang, split to pass north and south of the Taklamakan Desert, join again at Kashgar, and go on through Samarkand and Baghdad to the Mediterranean, with a branch south to India.',
      },
    },
    {
      id: 'caravan',
      type: 'interact',
      title: 'Lead the caravan',
      text: `
        You are taking a caravan from **Chang'an** to **Baghdad**.

        **Tap the five cities in the order you will reach them.**
      `,
      widget: {
        type: 'world-map', dots: false, view: LAND_VIEW, mode: 'trace', dim: false,
        areas: [{ polygon: TAKLAMAKAN, color: 'yellow', label: 'Taklamakan Desert' }],
        markers: [
          mk('baghdad', { labelPos: 'bottom' }), mk('samarkand', { labelPos: 'top' }), mk('kashgar', { labelPos: 'bottom' }),
          mk('dunhuang', { labelPos: 'top' }), mk('changan', { shape: 'square', color: 'red', labelPos: 'bottom' }),
        ],
        answer: CARAVAN,
        alt: 'A map of Asia with five cities marked: Baghdad, Samarkand, Kashgar, Dunhuang and Chang\'an.',
      },
      check: (s) => {
        if (s.route.join() === CARAVAN.join()) return true;
        if (s.route[0] !== 'changan') return 'Start in the east, at Chang\'an (the square).';
        if (s.count < 5) return 'Visit all five cities, ending at Baghdad.';
        return 'Keep heading west. After the desert oases comes Samarkand, and Baghdad is the last stop.';
      },
      solution: { route: CARAVAN },
      hints: ['Chang\'an is the square in the east. The next stop is the oasis where the road forks.', 'Chang\'an, Dunhuang, Kashgar, then Samarkand.'],
      explain: `
        Even in straight hops that is about **${CARAVAN_KM.toLocaleString('en-US')} km**. A loaded camel train covers about 30 km a day, so the walking alone took about ${CARAVAN_DAYS} days, before you add the weeks spent waiting for passes to clear and animals to rest.
      `,
    },
    {
      id: 'teach-relay',
      type: 'info',
      title: 'A relay, not a journey',
      text: `
        Hardly anyone walked the whole road. A merchant knew one stretch, its languages and its rulers. At the end of it he sold his goods on and turned for home. The trade was a **relay**.

        The best-known runners were the **Sogdians**, an Iranian-speaking people from the cities around **Samarkand**. Find it on the map, between Kashgar and the caravan cities of **Bukhara** and **Merv**. The Sogdians' language was the trade language from Persia to China.

        Every hand that passed a bale on added to its price, and a camel can only manage about 200 kg. So caravans carried **light, costly things**.
      `,
      figure: {
        type: 'world-map', dots: false, view: [50, 29, 86, 47], dim: false,
        areas: [{ polygon: TAKLAMAKAN, color: 'yellow', label: 'Taklamakan Desert', labelOn: 'legend' }],
        lines: landLines(),
        markers: [
          mk('merv', { labelPos: 'bottom' }), mk('bukhara', { labelPos: 'top' }), mk('samarkand', { shape: 'square', color: 'red', labelPos: 'right' }),
          mk('kashgar', { labelPos: 'top' }),
        ],
        labels: [{ at: [57, 33], text: 'Persia', style: 'area' }, { at: [76, 30.5], text: 'India', style: 'area' }],
        alt: 'A close-up map of Central Asia. The caravan road runs west from Kashgar, at the western end of the Taklamakan Desert, through Samarkand, Bukhara and Merv towards Persia, with a branch south towards India.',
      },
    },
    {
      id: 'relay',
      type: 'choice',
      text: `
        A bale of silk is sold in Chang'an. A year or two later it is unpacked in Constantinople.

        **How did it most likely get there?**
      `,
      options: [
        { text: 'It changed hands many times, each merchant carrying it one stretch of the way', correct: true },
        { text: 'One caravan carried it the whole way', why: 'Hardly anyone travelled the whole distance. Merchants knew their own stretch, its languages and its rulers, and sold on.' },
        { text: 'Roman buyers came to China to fetch it', why: 'Almost no one from the Mediterranean reached China in these centuries, and almost no Chinese reached the Mediterranean.' },
        { text: 'The Chinese government delivered it', why: 'The Tang state guarded the roads and taxed the trade, but private merchants did the carrying.' },
      ],
      explain: `
        A **relay**: by the time the silk reached Constantinople it had been sold on many times, and its price had risen at every hand.

        Chinese potters often modelled the Sogdian runners of that relay, bearded and in pointed caps, leading camels like the one you saw.
      `,
    },
    {
      id: 'teach-cargo',
      type: 'info',
      title: 'Both ways, and not only silk',
      text: `
        The caravans did not run one way. China sold, and China bought.

        - **Out of China, going west:** silk cloth, porcelain, the craft of making paper and, later, gunpowder.
        - **Into China, going east:** war horses from Central Asia, glassware from Persia and the Mediterranean, Persian silver coins and metalwork, and a religion: Buddhism, from India.

        China's farmland bred few good horses, so its armies bought them from the steppe and paid in silk. Glass-blowing was a western skill.

        Silk was one cargo among many. Even the name is modern: the travellers named each road for where it led, and it was German geographers, in the 1800s, who began to speak of a "Silk Road".
      `,
      figure: {
        type: 'world-map', dots: false, view: LAND_VIEW, dim: false, static: true,
        lines: [
          ...landLines(),
          { points: [[104, 45.5], [84, 47.5], [62, 46.5]], color: 'orange', width: 5, arrow: true, label: 'Out of China: silk, porcelain, paper', labelOn: 'legend' },
          { points: [[62, 43.5], [84, 44.5], [104, 42.5]], color: 'teal', width: 5, arrow: true, dashed: true, label: 'Into China: horses, glass, silver, Buddhism', labelOn: 'legend' },
        ],
        markers: [mk('changan', { shape: 'square', color: 'red', labelPos: 'bottom' }), mk('samarkand', { labelPos: 'bottom' }), mk('baghdad', { labelPos: 'bottom' }), mk('constantinople', { labelPos: 'top' })],
        alt: 'A map of Asia with the caravan roads from Chang\'an through Samarkand and Baghdad to Constantinople. Above the roads, one arrow points west, out of China, for silk, porcelain and paper; a second, dashed arrow points east, into China, for horses, glass, silver and Buddhism.',
      },
    },
    {
      id: 'goods',
      type: 'bucket',
      review: true,
      text: 'The roads carried goods and ideas in **both** directions. Sort these by the way they travelled in the centuries from 500 to 1500.',
      buckets: ['West, out of China', 'East, into China'],
      items: [
        { text: 'Silk cloth', bucket: 0 },
        { text: 'The craft of making paper', bucket: 0 },
        { text: 'Porcelain', bucket: 0 },
        { text: 'Gunpowder', bucket: 0 },
        { text: 'War horses from Central Asia', bucket: 1, why: 'China\'s farmland bred few good horses. Its armies bought them from the steppe and paid in silk.' },
        { text: 'Glassware from Persia and the Mediterranean', bucket: 1, why: 'Glass-blowing was a western skill. Glass cups were treasures in China, Korea and Japan.' },
        { text: 'Buddhism, from India', bucket: 1, why: 'Buddhism began in India and reached China along the caravan roads, as you saw in *First Worlds*.' },
        { text: 'Persian silver coins and metalwork', bucket: 1 },
      ],
      explain: `
        China sent out silk, paper, porcelain and (later) gunpowder. It took in horses, glass, silver and a religion. It was never a one-way "silk" road: silk was one cargo among many.
      `,
    },
    {
      id: 'monsoon',
      type: 'info',
      title: 'The other highway',
      text: `
        South of the deserts lay a second road with no sand in it: the **Indian Ocean**.

        You met the **monsoon** in *The World at a Glance*. From about April to September the wind blows from the [south-west]{.orange}. From about November to March it turns round and blows from the [north-east]{.teal}.

        For a sailing ship that is a free ride out and a free ride home, every year, on a timetable. The map names six of the great **sea ports** the ships sailed between.
      `,
      figure: {
        type: 'world-map', dots: false, view: SEA_VIEW, dim: false,
        lines: [
          ...seaLines(),
          { points: [[49, 2], [58, 8], [67, 15]], color: 'orange', width: 5, arrow: true, animate: 'flow', label: 'Summer wind' },
          { points: [[84, 9], [89, 13], [93, 17.5]], color: 'orange', width: 5, arrow: true, animate: 'flow' },
          { points: [[68, 21], [61, 16.5], [53, 9]], color: 'teal', width: 5, arrow: true, dashed: true, label: 'Winter wind' },
          { points: [[94, 14], [89.5, 10.5], [84.5, 6.5]], color: 'teal', width: 5, arrow: true, dashed: true },
        ],
        markers: [
          mk('kilwa', { labelPos: 'right' }), mk('aden', { labelPos: 'left' }), mk('hormuz', { labelPos: 'top' }), mk('calicut', { labelPos: 'right' }),
          mk('malacca', { labelPos: 'left' }), mk('guangzhou', { labelPos: 'top' }),
        ],
        alt: 'A map of the Indian Ocean. Sea routes join Guangzhou in China to Malacca, Calicut in India, Hormuz on the Persian Gulf, Aden at the mouth of the Red Sea and Kilwa in East Africa. Arrows show the summer wind blowing from the south-west towards India and the winter wind blowing back from the north-east.',
      },
    },
    {
      id: 'when-sail',
      type: 'choice',
      text: `
        A captain has sold his cargo in **Calicut**, on the coast of India. Home is **Aden**, far to the west across the Arabian Sea.

        **When should he sail?**
      `,
      figure: {
        type: 'world-map', dots: false, view: [38, 2, 82, 30], dim: false, static: true,
        markers: [mk('aden', { labelPos: 'top' }), mk('calicut', { labelPos: 'right' })],
        labels: [{ at: [62, 15], text: 'Arabian Sea', style: 'water' }],
        alt: 'A map of the Arabian Sea with Aden on its western side and Calicut, in India, on its eastern side.',
      },
      options: [
        { text: 'In winter, with the wind from the north-east', correct: true },
        { text: 'In summer, with the wind from the south-west', why: 'That wind would blow in his face. It is the wind that *brought* him to India.' },
        { text: 'Whenever the hold is empty: a good ship can sail at any time', why: 'A ship of that time could not beat against a steady monsoon for weeks. Miss the season and you waited months in port.' },
      ],
      explain: `
        The winter wind blows from India towards Arabia and Africa, so he leaves around December and is home in a few weeks.

        Waiting for the wind had a side effect. Merchants spent months in foreign ports, so they rented houses, married, and built mosques, temples and churches there. Port cities from Kilwa to Guangzhou became places where many peoples lived side by side.
      `,
    },
    {
      id: 'belitung',
      type: 'slider',
      mode: 'predict',
      title: 'One ship',
      text: `
        This ship was painted in Iraq in 1237. Look along its hull: the small marks on the seams are **stitches**. Ships of the western Indian Ocean were sewn together with coconut-fibre cord, not nailed.

        In 1998 divers off the island of Belitung, in Indonesia, found the wreck of just such a sewn ship. It had sunk about 830 CE on its way home from China.

        **How many thousand pieces of Chinese pottery do you think it was carrying?**
      `,
      figure: pic('maqamat-ship', {
        alt: 'A medieval painting of a ship at sea, with fish below it. Rows of small stitch marks run along the seams of its brown hull. Merchants in turbans look out of a row of windows, sailors haul on ropes, a lookout sits at the masthead, and two men low in the hull tip water back into the sea.',
        caption: 'A ship of the Gulf, painted in Iraq in 1237 (a copy printed in 1883)',
        creditLabel: 'Painting',
        credit: 'Yaḥyā ibn Maḥmūd al-Wāsiṭī',          // the record's author field also lists the author of the text, cut off in mid-name
      }),
      min: 0, max: 100, step: 5, answer: 60, tolerance: 10, start: 0, unit: 'thousand pieces',
      explain: `
        About **60,000**, most of them bowls from one group of kilns in southern China, packed in straw inside big jars.

        Pottery is heavy and fragile: hopeless freight for a camel, easy freight for a ship. So the caravans carried light luxuries, and the ships carried the **bulk**: pottery, pepper, timber, iron. Over these thousand years far more cargo crossed the sea than the sand.
      `,
    },
    {
      id: 'teach-passengers',
      type: 'info',
      title: 'More than cargo',
      text: `
        Here is the whole web: caravan roads in red, sea lanes in blue. Merchants did not travel them alone, and bales were not all they carried.

        - **Faiths.** Buddhism went from India to China, and on to Korea and Japan. Christians of the Church of the East reached Chang'an in 635. Islam travelled with merchants to East Africa and Southeast Asia.
        - **Skills and stories.** Paper-making left China for the west. Tales first told in India turn up, centuries later, in Persian, Arabic and European books.
        - **Germs.** Diseases, plague among them, took the same roads.

        All of it stayed inside Africa, Europe and Asia. Nobody there had yet seen the Americas or tasted their crops.
      `,
      figure: {
        type: 'world-map', dots: false, view: FIND_VIEW, dim: false,
        lines: [...landLines(), ...seaLines({ labelOn: 'legend' })],
        markers: [
          mk('changan', { shape: 'square', color: 'red', labelPos: 'top' }), mk('dunhuang', { labelPos: 'top' }), mk('kashgar', { labelPos: 'bottom' }),
          mk('samarkand', { labelPos: 'top' }), mk('baghdad', { labelPos: 'top' }),
          mk('guangzhou', { labelPos: 'right' }), mk('malacca', { labelPos: 'bottom' }), mk('calicut', { labelPos: 'bottom' }),
          mk('aden', { labelPos: 'left' }), mk('kilwa', { labelPos: 'left' }),
        ],
        alt: 'A map of Asia and the Indian Ocean with both webs of routes. Caravan roads run from Chang\'an through Dunhuang, Kashgar and Samarkand to Baghdad and the Mediterranean. Sea lanes run from Guangzhou past Malacca to Calicut in India, and on to the Persian Gulf, to Aden and down the African coast to Kilwa.',
      },
    },
    {
      id: 'what-else',
      type: 'multi',
      title: 'Passengers without tickets',
      text: `
        In 629 the Chinese monk **Xuanzang** slipped out of Chang'an with a caravan, studied in India for years, and came home with hundreds of Buddhist books.

        **Which of these also travelled the roads and sea lanes between 500 and 1500?** Choose every one that did.
      `,
      options: [
        { text: 'Buddhism, from India to China, Korea and Japan', correct: true },
        { text: 'Islam, with merchants to East Africa and Southeast Asia', correct: true },
        { text: 'The craft of making paper, from China westward', correct: true },
        { text: 'Diseases, including plague', correct: true },
        { text: 'Maize and potatoes from the Americas', why: 'Nobody in Afro-Eurasia had seen a maize cob or a potato yet. The two halves of the world met after 1492, the subject of *One World*.' },
      ],
      explain: `
        Faiths, skills, stories and germs all moved with the cargo. American crops could not: the two halves of the world had not met.

        Lesson 2 follows Islam and the paper-makers. Lesson 6 follows the plague.
      `,
    },
    {
      id: 'find-city',
      type: 'interact',
      review: true,
      gen: (rng) => findOnMap(rng, {
        pool: ['samarkand', 'kashgar', 'dunhuang', 'changan', 'baghdad', 'guangzhou', 'malacca', 'calicut', 'aden', 'kilwa'],
        view: FIND_VIEW,
        alt: 'A map of Asia and the Indian Ocean with five unnamed markers.',
      }),
    },
    {
      id: 'when',
      type: 'interact',
      title: 'When was all this?',
      text: `
        The pottery camel was made when Chang'an was probably the largest city on Earth and the caravan roads were at their busiest.

        **Tap that period on the timeline.**
      `,
      widget: {
        type: 'timeline', from: -300, to: 1600, step: 300, mode: 'pick',
        spans: [
          { id: 'han', from: -206, to: 220, label: 'Han China', color: 'gray' },
          { id: 'rome', from: -27, to: 476, label: 'Roman Empire in the west', color: 'gray' },
          { id: 'tang', from: 618, to: 907, label: 'Tang China', color: 'orange' },
          { id: 'abbasid', from: 750, to: 1258, label: 'Abbasid caliphs in Baghdad', color: 'green' },
          { id: 'song', from: 960, to: 1279, label: 'Song China', color: 'blue' },
          { id: 'mongol', from: 1206, to: 1368, label: 'Mongol Empire', color: 'violet' },
        ],
        events: [{ id: 'columbus', year: 1492, label: 'Columbus sails', color: 'gray' }],
        alt: 'A timeline from 300 BCE to 1600 CE with bars for Han China, the Roman Empire, Tang China, the Abbasid caliphs, Song China and the Mongol Empire.',
      },
      check: (s) => s.picked === 'tang'
        || (s.picked === 'han' || s.picked === 'rome' ? 'The roads first opened in Han and Roman times, but the camel is about 500 years younger than that.'
          : s.picked === 'mongol' ? 'The Mongols revived the land roads much later (lesson 6). The camel is older.'
            : s.picked === 'song' ? 'Close, but under the Song the land roads to the west were mostly cut off, and trade went by sea. Look one dynasty earlier.'
              : s.picked === 'abbasid' ? 'Baghdad was the western partner in this trade, but the camel was made in China. Which Chinese dynasty overlaps the early caliphs?' : false),
      solution: { picked: 'tang' },
      explain: `
        The **Tang** dynasty (618 to 907). Look at what overlaps it: the caliphs' new capital at Baghdad (lesson 2) was the other great market of the age, and the two were joined by both roads, the sandy one and the wet one.
      `,
    },
    {
      id: 'name',
      type: 'choice',
      text: `
        Sogdian merchants, Arab captains and Chinese monks all used these routes.

        **Who gave them the name "Silk Road"?**
      `,
      options: [
        { text: 'German geographers, in the 1800s', correct: true },
        { text: 'Marco Polo, in his book of travels', why: 'Marco Polo travelled the routes about 1300 but never used the name.' },
        { text: 'The Sogdian merchants who ran the caravans', why: 'They spoke of the road to Samarkand or the road to China: a road was named for where it led.' },
        { text: 'The Tang emperors', why: 'Chinese records speak of the "Western Regions" and of particular roads, not of a silk road.' },
      ],
      explain: `
        Ferdinand von Richthofen made *Seidenstrasse* famous in 1877 (the word had turned up in German books a few decades earlier). The name stuck because it is lovely, but it hides a lot: there were many roads, half of them were sea lanes, and silk was one cargo among hundreds. Many historians now say **Silk Roads**, or simply "the routes".
      `,
    },
    {
      id: 'port-or-oasis',
      type: 'choice',
      review: true,
      gen: (rng) => portOrOasis(rng),
    },
    {
      id: 'words',
      type: 'match',
      title: 'Still in your wardrobe',
      text: `
        Europeans often named a cloth after the market where they bought it. Four of those names are still in the dictionary.

        **Match each cloth with its city.**
      `,
      pairs: [
        ['Calico', 'Calicut, on the pepper coast of India'],
        ['Muslin', 'Mosul, on the Tigris in Iraq'],
        ['Damask', 'Damascus, in Syria'],
        ['Satin', 'Zaitun, the Arabic name for the Chinese port of Quanzhou'],
      ],
      explain: `
        The names record the *market*, not always the maker: the finest muslin was woven in Bengal and sold on through Mosul. ("Satin" from Zaitun is the usual explanation, though dictionaries hedge it with "probably".)
      `,
    },
  ],
  recap: [
    'The "Silk Road" was a web of caravan roads from oasis to oasis, worked as a relay. The name dates only from the 1800s.',
    'Ships sailing with the monsoon between East Africa, Arabia, India, Southeast Asia and China carried far more cargo than the caravans.',
    'Goods moved both ways: silk, paper and porcelain out of China; horses, glass, silver and Buddhism in.',
    'Religions, skills, stories and diseases travelled with the merchants.',
  ],
  next: 'Next: a new faith is born in Arabia, and within a century its scholars are collecting the books of Greece, Persia and India in one city.',
};
