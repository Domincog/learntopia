// Crossroads: 500 to 1500 · Lesson 6 · The Largest Land Empire
//
// Driving question: how did herders from the steppe conquer the largest land empire in history,
// and what did joining Eurasia together do, for better and for worse?
import {
  pic, mk, at, EVENTS, findOnMap, pickFromTable, MONGOL_AGE_PEOPLE,
  GOLDEN_HORDE, ILKHANATE, CHAGATAI, YUAN, SEA_EAST_AFRICA, SEA_RED_SEA, SEA_CHINA_INDIA,
} from '../helpers.js';

const EURASIA = [8, 10, 146, 62];
const ORDER = ['chinggis', 'baghdadfalls', 'songfalls', 'blackdeath', 'ming'];

// The belt of grassland from Hungary to Manchuria, very roughly (the mountains that break it are left out).
const STEPPE = [
  [18, 46], [20, 48], [28, 49.5], [36, 51], [45, 52.5], [55, 54], [65, 54.5], [75, 54], [83, 52.5], [90, 51], [98, 50.5], [106, 50.5], [114, 50.5],
  [120, 49.5], [126, 48], [127, 45], [122, 43], [116, 42], [110, 42], [103, 43.5], [96, 45], [90, 46.5], [85, 46], [80, 44.5], [72, 43.5], [64, 44.5],
  [56, 45.5], [50, 45.5], [47, 44.5], [42, 45], [38, 46], [33, 45.8], [29, 45.3], [24, 45], [20, 45],
];

// Ibn Battuta's main journeys, much simplified.
const IB_HAJJ = [at('tangier'), [-1.3, 34.9], [3.0, 36.5], [6.6, 36.3], [10.2, 36.7], [10.1, 33.9], [13.2, 32.8], [16.6, 31.1], [20.1, 30.8], [25, 31.5], at('alexandria'), at('cairo'), [34.5, 31.2], at('damascus'), at('medina'), at('mecca')];
const IB_AFRICA = [at('mecca'), [39.1, 21.4], ...[...SEA_RED_SEA].reverse().slice(6), ...SEA_EAST_AFRICA.slice(1)];
const IB_NORTH = [at('mecca'), at('baghdad'), [40, 37.5], [33, 39.5], at('constantinople'), [33, 44.5], [38, 46.5], at('sarai'), [58, 43.5], at('samarkand'), [68, 35.5], at('delhi')];
const IB_EAST = [at('delhi'), [74, 18], at('calicut'), ...[...SEA_CHINA_INDIA].reverse().slice(1, -1), [116.5, 22.3], at('quanzhou')];
const IB_MALI = [at('tangier'), at('sijilmasa'), at('taghaza'), at('timbuktu')];

export default {
  id: 'mongols',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Bigger than Rome?',
      text: `
        At its largest, the **Roman Empire** covered about 5 million square kilometres.

        In the 1200s, horsemen from the grasslands north of China built an empire of their own.

        **How many times larger than Rome's do you think it was?**
      `,
      min: 1, max: 10, step: 1, answer: 5, tolerance: 1, start: 1, unit: 'times as large',
      explain: `
        Nearly **five times**: about 24 million km², from the Pacific to the Black Sea. It is the largest empire of connected land in history, and it was built in about seventy years by a people who numbered perhaps a million.

        This lesson asks how they did it, and what it did to the world, for better and for worse.
      `,
    },
    {
      id: 'teach-steppe',
      type: 'info',
      title: 'A sea of grass',
      text: `
        North of China's farms and the deserts of lesson 1 lies the **steppe**: a belt of grassland about 8,000 km long, from Hungary to Manchuria. It is too dry and too cold for crops, but ideal for grazing.

        Its peoples lived from their herds of sheep, goats, cattle, camels and horses, and moved with them to fresh grass several times a year.

        A life like this made every child a rider, and every adult a herder used to moving, scouting and living off the land.
      `,
      figure: {
        type: 'world-map', dots: false, view: EURASIA, dim: false,
        areas: [{ polygon: STEPPE, color: 'green', label: 'The steppe (roughly)' }],
        markers: [mk('karakorum', { shape: 'star', color: 'yellow', size: 'l', labelPos: 'bottom' }), mk('beijing', { labelPos: 'right' }), mk('samarkand', { labelPos: 'bottom' }), mk('kyiv', { labelPos: 'top' })],
        labels: [{ at: [19.5, 44.6], text: 'Hungary', style: 'area' }, { at: [126, 42.3], text: 'Manchuria', style: 'area' }, { at: [108, 33], text: 'China', style: 'area' }],
        alt: 'A map of Europe and Asia. A long green band of grassland, the steppe, runs from Hungary in the west, north of the Black Sea and the Caspian Sea, across Central Asia and Mongolia to Manchuria in the east. Karakorum is marked in Mongolia, in the eastern part of the band; China lies to its south.',
      },
    },
    {
      id: 'steppe',
      type: 'choice',
      title: 'A home for herders',
      text: `
        This is a Mongolian home, a **ger** (the Turkic word is *yurt*): a folding lattice of wood covered with thick felt made from the herd's own wool.

        **What makes it right for the herders' life?**
      `,
      figure: pic('ger', {
        alt: 'A low round tent with a domed roof stands alone on a wide, treeless plain under a big sky. It is covered in grey cloth held down by ropes and weighted with stones, and a painted wooden door frame shows at one side.',
        caption: 'A ger on the Mongolian steppe',
      }),
      options: [
        { text: 'It can be taken down, loaded on animals and put up again in an hour or two', correct: true },
        { text: 'It is built to stand in one place for generations', why: 'The herds must move to fresh grass several times a year, and the home goes with them.' },
        { text: 'It is large enough to shelter the herds in winter', why: 'The animals stay outside. A ger is a family home, a few metres across.' },
      ],
      explain: `
        A ger is warm at −30 °C, and it can be packed in about an hour. Many Mongolian families still live in one.

        Riding, moving, scouting, living off the land: the skills of a herder were also the skills of a soldier.
      `,
    },
    {
      id: 'teach-army',
      type: 'info',
      title: 'Why they won',
      text: `
        Steppe armies were small. The Mongols were usually **outnumbered** by the settled peoples they fought, and they won all the same.

        - **Riders from childhood.** Every soldier was a skilled rider and archer.
        - **Speed.** Each rider brought several spare horses, so armies moved very fast.
        - **Merit.** The army was organised by tens: squads of 10, companies of 100, regiments of 1,000. Officers were promoted for ability and loyalty, not for noble birth.
        - **Borrowed skills.** Horse archers cannot break a city wall, so the Mongols hired Chinese and Persian engineers who could.

        A favourite trick was to pretend to flee, draw the enemy out of formation, then turn. What they did not have was guns: guns barely existed yet.
      `,
    },
    {
      id: 'riders',
      type: 'multi',
      title: 'Outnumbered',
      text: `
        A Mongol army rides against a kingdom that has far more soldiers.

        **Which of these really were Mongol advantages?** Choose every one.
      `,
      options: [
        { text: 'Every soldier was a skilled rider and archer from childhood', correct: true },
        { text: 'Each rider brought several spare horses, so armies moved very fast', correct: true },
        { text: 'Officers were promoted for ability and loyalty, not for noble birth', correct: true },
        { text: 'They hired Chinese and Persian engineers to break city walls', correct: true },
        { text: 'They had guns, and their enemies did not', why: 'Guns barely existed yet. Gunpowder bombs were a Chinese weapon (lesson 4), which the Mongols met in China and then adopted.' },
      ],
      explain: `
        Speed, discipline, merit and a readiness to learn. When horse archers were not enough, as before the walls of a great city, the Mongols recruited the people who knew how.
      `,
    },
    {
      id: 'rise',
      type: 'info',
      tone: 'sober',          // the cost of the conquests
      title: 'From outcast to khan',
      text: `
        About 1162 a boy named **Temüjin** was born into a minor clan. His father was poisoned, his family was cast out, and he grew up hunted and poor. By alliances and war he united the peoples of the Mongolian steppe, and in **1206** they proclaimed him **Chinggis Khan** (also spelled Genghis).

        Then the armies rode out. The dates show when each city fell, to him or to his sons and grandsons.

        Cities that surrendered were usually spared and taxed. Cities that resisted were destroyed and their people killed or enslaved. The numbers in the chronicles cannot be trusted, but the dead ran into millions, and parts of Central Asia and Iran took generations to recover.
      `,
      figure: {
        type: 'world-map', dots: false, view: EURASIA, dim: false,
        lines: [
          { points: [at('karakorum'), [110, 44], at('beijing')], color: 'red', width: 3, arrow: true, animate: 'draw', label: 'Main campaigns' },
          { points: [at('karakorum'), [88, 46.5], [76, 43], at('samarkand')], color: 'red', width: 3, arrow: true, animate: 'draw' },
          { points: [at('samarkand'), [58, 45], [47, 48.5], [38, 50], at('kyiv')], color: 'red', width: 3, arrow: true, animate: 'draw' },
          { points: [at('samarkand'), [58.8, 36.2], [51.4, 35.6], at('baghdad')], color: 'red', width: 3, arrow: true, animate: 'draw' },
          { points: [at('beijing'), [115, 34.5], at('hangzhou')], color: 'red', width: 3, arrow: true, animate: 'draw' },
        ],
        markers: [
          mk('karakorum', { shape: 'star', color: 'yellow', size: 'l', labelPos: 'top' }),
          mk('beijing', { label: 'Beijing 1215', labelPos: 'right' }), mk('samarkand', { label: 'Samarkand 1220', labelPos: 'bottom' }),
          mk('kyiv', { label: 'Kyiv 1240', labelPos: 'top' }), mk('baghdad', { label: 'Baghdad 1258', labelPos: 'bottom' }), mk('hangzhou', { label: 'Hangzhou 1276', labelPos: 'right' }),
        ],
        alt: 'A map of Eurasia. Arrows run from Karakorum in Mongolia to Beijing (taken in 1215), to Samarkand (1220), on from Samarkand to Kyiv (1240) and to Baghdad (1258), and from Beijing south to Hangzhou (1276).',
      },
    },
    {
      id: 'stopped',
      type: 'interact',
      tone: 'sober',          // its replies speak of the sack of Baghdad
      title: 'Not unstoppable',
      text: `
        The Mongols lost too. In **1260** the Mamluk army of Egypt beat a Mongol force at Ain Jalut, south-west of the Sea of Galilee. In **1274** and **1281** storms and samurai wrecked two invasion fleets sent against Japan.

        **Tap the two cities that never fell to the Mongols.**
      `,
      widget: {
        type: 'world-map', dots: false, view: EURASIA, mode: 'pickMarkers', max: 2, dim: false, answer: ['cairo', 'kyoto'],
        markers: [
          mk('kyiv', { labelPos: 'top' }), mk('cairo', { labelPos: 'bottom' }), mk('baghdad', { labelPos: 'right' }), mk('samarkand', { labelPos: 'top' }),
          mk('beijing', { labelPos: 'top' }), mk('kyoto', { labelPos: 'bottom' }),
        ],
        alt: 'A map of Eurasia with six cities marked: Kyiv, Cairo, Baghdad, Samarkand, Beijing and Kyoto.',
      },
      check: (s) => {
        if (s.picked.join() === 'cairo,kyoto') return true;
        if (s.count < 2) return 'Choose two cities.';
        if (s.picked.includes('baghdad')) return 'Baghdad fell in 1258. The last Abbasid caliph was killed and the city of lesson 2 was wrecked.';
        if (s.picked.includes('kyiv')) return 'Kyiv was stormed in 1240, and the Rus princes paid tribute to the Mongols for two centuries.';
        if (s.picked.includes('samarkand')) return 'Samarkand fell to Chinggis Khan himself in 1220.';
        if (s.picked.includes('beijing')) return 'Beijing fell in 1215 and later became the Mongol capital of China.';
        return false;
      },
      solution: { picked: ['cairo', 'kyoto'] },
      hints: ['Which city is in Egypt? Which is in Japan?'],
      explain: `
        **Cairo** and **Kyoto**. The Mongols also failed in Vietnam, in Java and against the sultans of Delhi. At the edges of their reach, forests, seas and heat blunted the advantages of horse and grass.
      `,
    },
    {
      id: 'khanates',
      type: 'info',
      title: 'One family, four realms',
      text: `
        By about 1260 the empire was too big for one ruler. It became four realms, each under a branch of Chinggis Khan's family.

        The greatest was the **Yuan**, ruled by his grandson **Kublai Khan**, who conquered the Song (lesson 4) in 1279 and governed China from a new capital on the site of today's **Beijing**. Korea's kings became his vassals. Another grandson, **Hülegü**, who had destroyed Baghdad in 1258, founded the **Ilkhanate** in Persia.

        The four khans quarrelled, but for about a century roads from the Black Sea to the Pacific lay under one family. Historians call it the **Mongol Peace**.
      `,
      figure: {
        type: 'world-map', dots: false, view: EURASIA, dim: false,
        areas: [
          { polygon: GOLDEN_HORDE, color: 'yellow', label: 'Golden Horde' },
          { polygon: ILKHANATE, color: 'green', label: 'Ilkhanate' },
          { polygon: CHAGATAI, color: 'violet', label: 'Chagatai Khanate' },
          { polygon: YUAN, color: 'red', label: 'Yuan (the Great Khan)' },
        ],
        markers: [mk('beijing', { labelPos: 'right' }), mk('karakorum', { labelPos: 'top' }), mk('sarai', { labelPos: 'top' }), mk('baghdad', { labelPos: 'bottom' }), mk('samarkand', { labelPos: 'top' })],
        caption: 'The four Mongol realms about 1290. Their edges were never sharp lines.',
        alt: 'A map of Eurasia with four shaded areas: the Golden Horde across the western steppe and Russia; the Ilkhanate over Iran, Iraq and Anatolia; the Chagatai Khanate in Central Asia; and the Yuan over Mongolia, China and Tibet.',
      },
    },
    {
      id: 'paiza',
      type: 'choice',
      title: 'A tablet on a chain',
      text: `
        The khans wanted trade, because they taxed it, and news, because they ruled by it. Across the empire they kept a relay service, the **yam**: stations a day's ride or less apart, with fresh horses, food and beds. A rider with urgent news changed horses at each and could cover 200 km or more in a day.

        This metal tablet, a **paiza**, was worn round the neck by a traveller on the khan's roads.

        **What was it for?**
      `,
      figure: pic('paiza', {
        alt: 'A long, narrow tablet of dark silvery metal with rounded ends. Near the top, under an engraved sun, is a raised ring with a hole through it. Faint lines of writing run down its length.',
        caption: 'Silver paiza of Özbeg Khan of the Golden Horde, 1300s',
      }),
      options: [
        { text: 'A passport: it ordered every station to give its bearer horses, food and safe passage', correct: true },
        { text: 'Money: it could be exchanged for goods', why: 'Money in the Mongol lands was silver or, in China, paper (lesson 4). The tablet could not be spent.' },
        { text: 'A medal for bravery in battle', why: 'It gave its bearer rights, not honour. It hung from the ring near the top, to be shown at every station.' },
        { text: 'A charm to keep away evil spirits', why: 'It calls on heaven, but its message is an order to human officials.' },
      ],
      explain: `
        A **passport**. The writing says, in Mongolian, that by the power of heaven this is the khan's order, and that whoever does not respect it will be punished.

        Envoys, officials and favoured merchants carried such tablets. Marco Polo's family was given one for the journey home.
      `,
    },
    {
      id: 'travellers',
      type: 'slider',
      mode: 'predict',
      title: 'The greatest traveller',
      text: `
        **Marco Polo** of Venice set out in 1271, served Kublai Khan, and came home in 1295: perhaps 24,000 km. **Rabban Sauma**, a monk born near Beijing, went the other way and reached Paris in 1287.

        But the champion was a young Moroccan lawyer. In 1325, aged 21, **Ibn Battuta** left Tangier for Mecca, and kept going for almost thirty years. The map shows his main journeys.

        **How many thousand kilometres do you think he travelled?**
      `,
      figure: {
        type: 'world-map', dots: false, view: [-14, -14, 124, 52], dim: false,
        lines: [
          { points: IB_HAJJ, color: 'green', width: 3, animate: 'draw', label: 'Ibn Battuta, 1325 to 1354' },
          { points: IB_AFRICA, color: 'green', width: 3, animate: 'draw' },
          { points: IB_NORTH, color: 'green', width: 3, animate: 'draw' },
          { points: IB_EAST, color: 'green', width: 3, animate: 'draw' },
          { points: IB_MALI, color: 'green', width: 3, animate: 'draw' },
        ],
        markers: [
          mk('tangier', { shape: 'star', color: 'green', size: 'l', labelPos: 'top' }), mk('mecca', { labelPos: 'right' }), mk('kilwa', { labelPos: 'right' }),
          mk('delhi', { labelPos: 'top' }), mk('quanzhou', { labelPos: 'top' }), mk('timbuktu', { labelPos: 'bottom' }), mk('sarai', { labelPos: 'top' }),
          mk('venice', { color: 'gray', shape: 'square', labelPos: 'top' }),
        ],
        alt: 'A map of Africa, Europe and Asia with the journeys of Ibn Battuta: from Tangier across North Africa to Cairo and Mecca; down the coast of East Africa to Kilwa; north to Constantinople and Sarai on the steppe, then through Samarkand to Delhi; by sea round India and through Southeast Asia to Quanzhou in China; and across the Sahara to Timbuktu. Venice, Marco Polo\'s home in northern Italy, is marked with a grey square.',
      },
      min: 0, max: 150, step: 5, answer: 115, tolerance: 15, start: 0, unit: 'thousand km',
      explain: `
        About **117,000 km** is the usual estimate: nearly three times round the Earth, and about five times Marco Polo's distance.

        Look at where he went: Cairo, Mecca, Kilwa, Constantinople, Samarkand, Delhi, Calicut, Quanzhou, Timbuktu. That is almost every city in this course. Nearly everywhere he found mosques, merchants who knew his homeland, and courts glad to hire a trained judge. By 1350 Afro-Eurasia was one connected world.
      `,
    },
    {
      id: 'plague-path',
      type: 'choice',
      tone: 'sober',          // the Black Death
      title: 'What else took the roads',
      text: `
        In 1338 and 1339 an unusual number of people were buried near **Lake Issyk-Kul**, in Central Asia. Their gravestones name the cause: "pestilence". In 2022 scientists found the plague bacterium in their remains.

        In 1346 the disease was in the ports of the Black Sea. In October **1347** it reached Sicily. By 1351 it had swept nearly all of Europe, North Africa and the Middle East. People later named it the **Black Death**.

        **Look at the map. What carried it so far, so fast?**
      `,
      figure: {
        type: 'world-map', dots: false, view: [-8, 26, 84, 58], aspect: 2, dim: false,
        lines: [
          { points: [at('issykkul'), [66, 44], [55, 46.5], at('sarai'), [41, 46.8], at('kaffa')], color: 'violet', width: 3, dashed: true, arrow: true, animate: 'draw', label: 'By land, 1338 to 1346' },
          { points: [at('kaffa'), [33.5, 43.5], [29.6, 41.6], at('constantinople'), [26.6, 39.6], [24.5, 36.3], [20, 36.5], at('messina')], color: 'red', width: 3, arrow: true, animate: 'draw', label: 'By ship, 1347' },
          { points: [[24.5, 36.3], [27, 33.5], at('alexandria')], color: 'red', width: 3, arrow: true, animate: 'draw' },
          { points: [at('messina'), [14.8, 38.8], [12, 40.2], [9.25, 41.3], [6.8, 42.6], at('marseille')], color: 'red', width: 3, arrow: true, animate: 'draw' },
        ],
        markers: [mk('issykkul', { labelPos: 'top' }), mk('kaffa', { labelPos: 'top' }), mk('constantinople', { labelPos: 'bottom' }), mk('alexandria', { labelPos: 'bottom' }), mk('messina', { labelPos: 'bottom' }), mk('marseille', { labelPos: 'top' })],
        alt: 'A map from western Europe to Central Asia. A dashed line runs overland from Lake Issyk-Kul across the steppe to Kaffa on the Black Sea. Solid lines then run by sea from Kaffa to Constantinople and on to Alexandria in Egypt, to Messina in Sicily and to Marseille in France.',
      },
      options: [
        { text: 'The trade routes: caravans, and above all ships, moving from port to port', correct: true },
        { text: 'Mongol armies marching across Europe', why: 'No Mongol army went near Italy or France in the 1340s. Look at how the solid lines travel: across water, between ports.' },
        { text: 'Poisoned wells', why: 'This was a rumour of the time, used to blame innocent people. The cause was a bacterium, carried by fleas, rats and people.' },
        { text: 'The wind', why: 'Many people at the time blamed "bad air". But the disease hopped from harbour to harbour, at the speed of a ship.' },
      ],
      explain: `
        The plague travelled the roads and sea lanes that the Mongol Peace had made busy. Every port was a doorway: the ships that carried silk and grain also carried rats, fleas and sick sailors.

        The same connections that let Ibn Battuta reach China let a bacterium from Central Asia reach Sicily.
      `,
    },
    {
      id: 'teach-aftermath',
      type: 'info',
      tone: 'sober',          // mass death and the murder of Jews
      title: 'After the plague',
      text: `
        Between 1347 and 1351 the Black Death killed perhaps **a third to a half** of the people of Europe. Egypt and Syria suffered as badly. For most other regions the evidence is too thin to say. Nobody knew the cause, and no doctor had a cure: the bacterium was identified only in 1894.

        - **Work.** With so many workers gone, land was cheap and labour dear. Survivors could demand higher wages, and in western Europe many serfs gained their freedom as lords competed for hands.
        - **Blame.** Terror sought someone to blame. Jews were falsely accused of poisoning wells, and in 1348 and 1349 Jewish communities across the German lands were massacred, although popes and many rulers said plainly that the accusation was false.
        - **Trade** slumped, and then recovered.
      `,
    },
    {
      id: 'plague-effects',
      type: 'multi',
      tone: 'sober',          // mass death and the murder of Jews
      title: 'Afterwards',
      text: `
        It is 1360, in a town in western Europe that has lost nearly half its people.

        **Which of these followed the Black Death?** Choose every one that did.
      `,
      options: [
        { text: 'Workers were scarce, so those who survived could demand higher wages', correct: true },
        { text: 'In western Europe, serfdom weakened as lords competed for labour', correct: true },
        { text: 'Jews were falsely accused of poisoning wells, and murdered in many towns', correct: true },
        { text: 'Trade between Europe and Asia ended for good', why: 'Trade slumped and then recovered. Europe\'s hunger for Asian goods is where the next course begins.' },
        { text: 'Doctors of the time found the cause and a cure', why: 'They could not. The bacterium was identified in 1894, and effective medicines came in the twentieth century.' },
      ],
      explain: `
        Scarce labour raised wages and loosened serfdom: survivors ate better. Fear turned on the innocent: among the Jewish communities massacred in 1348 and 1349 were about 2,000 people in Strasbourg.

        One response has lasted. Ports on the Adriatic began to hold arriving ships and travellers apart, in Venice for forty days, *quaranta giorni*: the origin of the word **quarantine**.
      `,
    },
    {
      id: 'after',
      type: 'order',
      tone: 'sober',          // the destruction of Baghdad, the Black Death, Timur
      title: 'The end of the empire',
      text: `
        War among the khans, plague and rebellion pulled the Mongol realms apart. In China a former peasant and monk led a revolt that drove out the Mongol rulers and, in 1368, founded the **Ming** dynasty. Later a conqueror named **Timur** tried to rebuild the empire from Samarkand, with terrible violence, and failed to make it last.

        **Put these events in order, earliest first.**
      `,
      items: ORDER.map((id) => EVENTS[id].text),
      labels: ['Earliest', 'Latest'],
      explain: ORDER.map((id) => `- **${EVENTS[id].year}**: ${EVENTS[id].text}`).join('\n'),
    },
    {
      id: 'find-city',
      type: 'interact',
      review: true,
      gen: (rng) => findOnMap(rng, {
        pool: ['karakorum', 'beijing', 'samarkand', 'baghdad', 'delhi', 'cairo', 'venice', 'tangier'],
        view: [-12, 8, 136, 60],
        alt: 'A map of Europe, North Africa and Asia with five unnamed markers.',
      }),
    },
    {
      id: 'who',
      type: 'choice',
      tone: 'sober',          // some variants ask about the destroyer of Baghdad and about Timur
      review: true,
      gen: (rng) => pickFromTable(rng, { rows: MONGOL_AGE_PEOPLE, ask: (row) => `**Which of these people** ${row.clue}?` }),
    },
    {
      id: 'verdict',
      type: 'reflect',
      tone: 'sober',          // weighs the killing of millions
      title: 'For better and for worse',
      text: `
        Historians still argue about how to weigh the Mongol Empire.

        **Give one piece of evidence that it was good for the world, and one that it was terrible.**
      `,
      model: `
        **For:** for about a century a merchant, an envoy or a scholar could cross Eurasia more safely than ever before. Goods, crops, skills and ideas moved with them: Chinese printing, gunpowder and medicine went west; Persian astronomy went east. The khans protected trade and tolerated every religion.

        **Against:** the conquests killed millions, wiped out great cities such as Baghdad and Merv, and wrecked farmland that had been irrigated for thousands of years. And the roads that carried silk carried the plague.

        Both lists are true. Connection is not the same thing as kindness.
      `,
    },
  ],
  recap: [
    'Chinggis Khan united the horse nomads of the steppe in 1206; within about seventy years his family ruled from the Pacific to the Black Sea.',
    'The conquests were hugely destructive: Baghdad fell in 1258. The empire split into four realms, with Kublai Khan\'s Yuan ruling China.',
    'Under the "Mongol Peace", relay posts and safe roads let travellers such as Marco Polo and Ibn Battuta cross the Old World.',
    'The same routes carried the Black Death (Europe, 1347 to 1351), which killed perhaps a third to a half of Europe\'s people.',
  ],
  next: 'Next: all this time, half the planet knew nothing of any of it. Across the ocean, other peoples were building cities, roads and calendars of their own.',
};
