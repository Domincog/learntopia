// One World: 1450 to 1800 · Lesson 3 · Sultans, Shahs and Emperors
//
// Driving question: around 1600, where did most of the world's people and wealth live, who
// ruled them, and what did gunpowder have to do with it?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-connected/index.js';
import { countryName } from '../../../../src/widgets/world-map.js';
import { EMPIRES, PLACES, at, marker, andList, empireFactStep } from '../helpers.js';

const area = (id, label) => ({ polygon: EMPIRES[id].extent, color: EMPIRES[id].color, label, labelAt: EMPIRES[id].labelAt });

// Where the generated "tap the country" step may be answered: a wide map of Eurasia.
const HOME_VIEW = [18, 2, 150, 66];
const HOME_PICKABLE = ['TR', 'IR', 'IN', 'CN', 'JP', 'RU', 'PK', 'AF', 'SA', 'EG', 'IQ', 'KZ', 'MN', 'UZ', 'TM', 'SY', 'MM', 'TH', 'KR', 'KP', 'UA'];
const HOME_ASK = {
  ottoman: 'the Ottoman sultans ruled from Istanbul',
  safavid: 'the Safavid shahs ruled from Isfahan',
  mughal: 'the Mughal emperors ruled from Agra',
  ming: 'the Ming emperors ruled from Beijing',
  tokugawa: 'the Tokugawa shoguns ruled from Edo',
  russia: 'the tsars ruled from Moscow',
};

// How each state's lands about 1600 compare with the modern country its capital lies in.
const EXTENT_THEN = {
  ottoman: 'a far larger area, on three continents',
  safavid: 'a rather larger area',
  mughal: 'a different area: the north of the subcontinent, with most of what are now Pakistan and Bangladesh',
  ming: 'a smaller area: roughly the south and east of today\'s China',
  tokugawa: 'most of the same islands',
  russia: 'a much smaller area: it had only just begun to cross Siberia',
};

const capFirst = (text) => text[0].toUpperCase() + text.slice(1);
const CAPITAL_LABEL_POS = { ottoman: 'top', safavid: 'bottom', mughal: 'bottom', ming: 'bottom', tokugawa: 'bottom', russia: 'top' };
const DYNASTIES = ['ottoman', 'safavid', 'mughal', 'ming', 'qing', 'tokugawa'];

// One line per state for the last teaching screen: the key words of every fact in EMPIRE_FACTS
// (helpers.js), which the generated "which state?" step draws from. The course test checks that
// each fact's clue appears here.
const STATE_BRIEF = {
  ottoman: 'took Constantinople in 1453 with giant cannon; lands on three continents; Süleyman "the Magnificent"; Sinan\'s domed mosques',
  safavid: 'made Shia Islam the religion of the state; Shah Abbas\'s new capital, Isfahan',
  mughal: 'Babur\'s victory at Panipat, 1526; Akbar\'s debates between religions; the Taj Mahal',
  ming: 'built the Forbidden City in Beijing; rebuilt the Great Wall in brick and stone',
  qing: 'the dynasty of the Manchus, who took Beijing in 1644',
  tokugawa: 'shoguns ruling from Edo; Dutch traders kept to a small island in Nagasaki harbour',
  russia: 'pushed across Siberia to the Pacific in the 1600s, in search of furs',
};

export default {
  id: 'gunpowder-empires',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Where was everybody?',
      text: `
        The last two lessons followed European ships. Now step back and count
        heads. Around 1600 there were roughly 550 million people on Earth.

        **About what share of them lived in Asia?**
      `,
      min: 0, max: 100, step: 5, answer: 60, tolerance: 10, unit: '%', start: 20,
      explain: `
        About **three in five**, and by some estimates two in three. China and
        India alone held about half of humanity, and made most of the things
        the rest of the world wanted to buy.

        So who ruled all these people, and how? That is the question of this lesson.
      `,
    },
    {
      id: 'overview',
      type: 'info',
      title: 'A belt of empires',
      text: `
        From the Mediterranean to the Pacific stretched a chain of great
        states. Three were ruled by Muslim dynasties: the **Ottomans**, the
        **Safavids** of Iran and the **Mughals** of India. Beyond them lay
        **China**, under the Ming and then the Qing, and **Japan** under the
        Tokugawa shoguns.

        To the north, **Russia** was pushing east across Siberia in search of
        furs. A party of its Cossacks reached the Pacific in 1639.
      `,
      figure: {
        type: 'world-map', view: [8, 4, 150, 64],
        areas: [
          ...EMPIRES.ottoman.more.map((polygon) => ({ polygon, color: EMPIRES.ottoman.color })),
          area('ottoman', 'Ottoman Empire'),
          area('safavid', 'Safavid Iran'),
          area('mughal', 'Mughal Empire'),
          area('ming', 'China'),
        ],
        regions: [{ ids: ['JP'], color: 'violet', label: 'Tokugawa Japan' }],
        dim: false,
        lines: [{ points: [at('moscow'), [50, 57.5], [68.2, 58.2], [92, 57], [113, 59], [129.7, 62], at('okhotsk')], color: 'teal', width: 3, arrow: true, label: 'Russia expands, 1580s to 1639' }],
        markers: [marker('istanbul', { labelPos: 'top' }), marker('isfahan', { labelPos: 'right' }), marker('agra', { labelPos: 'bottom' }), marker('beijing', { labelPos: 'top' }), marker('edo', { label: 'Edo', labelPos: 'right' }), marker('moscow', { labelPos: 'top' })],
        alt: 'A map of Asia with shaded areas for four empires: the Ottoman Empire round the eastern Mediterranean, Safavid Iran, the Mughal Empire across northern and central India, and China. Japan is highlighted. An arrow runs from Moscow east across Siberia to the Pacific.',
        caption: 'Rough extents around 1600 (the Mughal Empire around 1700)',
      },
    },
    {
      id: 'teach-ottoman',
      type: 'info',
      title: 'The Ottomans: an empire on three continents',
      text: `
        In 1453 Ottoman cannon broke the walls of Constantinople, which had
        stood for a thousand years. The city, which Turks called Istanbul,
        became the capital of an empire in Europe, Asia and Africa, home to
        Muslims, Christians and Jews.

        It stood at its height under Sultan **Süleyman** (1520 to 1566), whom
        Europeans called "the Magnificent". His lands reached from Algiers to
        Baghdad to Budapest, and his armies to the gates of Vienna.
      `,
      figure: {
        type: 'world-map', view: [-4, 11, 52, 51], dots: false,
        areas: [
          ...EMPIRES.ottoman.more.map((polygon) => ({ polygon, color: EMPIRES.ottoman.color })),
          { polygon: EMPIRES.ottoman.extent, color: EMPIRES.ottoman.color, label: 'Ottoman lands, about 1600', labelOn: 'legend' },
        ],
        markers: [
          marker('istanbul', { labelPos: 'top', shape: 'star', color: 'red' }),
          { at: 'Algiers', label: 'Algiers', labelPos: 'bottom' },
          { at: 'Baghdad', label: 'Baghdad', labelPos: 'right' },
          { at: 'Budapest', label: 'Budapest', labelPos: 'right' },
          { at: 'Vienna', label: 'Vienna', labelPos: 'top', shape: 'ring' },
        ],
        alt: 'A map of the Mediterranean and the Middle East. The shaded Ottoman lands run from Hungary through the Balkans and Turkey to Iraq, down both shores of the Red Sea, and along the coast of North Africa as far as Algiers. Istanbul is marked with a star; Budapest, Baghdad and Algiers lie inside the shaded lands, Vienna just outside them.',
        caption: 'Rough extent about 1600 (the star is the capital)',
      },
    },
    {
      id: 'ottoman',
      type: 'choice',
      title: 'A dome to rival a dome',
      text: `
        A century after the conquest, the architect **Sinan** built this
        mosque in Istanbul for Sultan Süleyman. Look at the great dome and the
        half-domes stepping down from it.

        **Which much older building in the same city was his model and rival?**
        You met it in *Crossroads*, when the city was still Constantinople.
      `,
      figure: photo(MEDIA.suleymaniye, {
        alt: 'A large stone mosque on a hilltop above a crowded city, lit up at dusk. One great dome rises above a cascade of half-domes and small domes; four slender, pointed towers stand at the corners of its courtyard.',
        caption: 'The Süleymaniye Mosque, Istanbul, completed in 1557',
      }),
      options: [
        { text: 'Hagia Sophia', correct: true },
        { text: 'The Parthenon', why: 'The Parthenon is in Athens, and it has columns and a flat-pitched roof, not a dome.' },
        { text: 'The Dome of the Rock', why: 'That shrine, with a single dome on an eight-sided base, is in Jerusalem.' },
        { text: 'St Peter\'s Basilica', why: 'St Peter\'s is in Rome. Its dome was being designed in those very years, by Michelangelo.' },
      ],
      explain: `
        **Hagia Sophia**, the Byzantine church of 537 that you met in
        *Crossroads*. The conquerors made it a mosque and spent a century
        learning to surpass it. Sinan himself had been a Christian youth taken
        by the state to be trained as a soldier and official, as thousands were.
      `,
    },
    {
      id: 'safavid',
      type: 'interact',
      title: 'The Safavids: a choice that still shows',
      text: `
        In 1501 a teenage conqueror, **Shah Ismail**, made Shia Islam the
        religion of his new state. It set his people apart from their Sunni
        neighbours, the Ottomans to the west and the Uzbeks and Mughals to the
        east, and it stuck. A century later Shah Abbas built the Safavids a
        splendid new capital at **Isfahan**.

        **Tap the Safavids' homeland**, which is still the largest country
        with a Shia majority.
      `,
      widget: {
        type: 'world-map', view: [24, 11, 78, 45], mode: 'pick', answer: 'IR',
        pickable: ['middle-east', 'AF', 'PK', 'TM', 'UZ', 'AZ', 'AM', 'GE'],
        alt: 'A map of the Middle East from Egypt and Turkey to Pakistan, without names.',
      },
      check: (s) => {
        if (s.picked === 'IR') return true;
        if (!s.picked) return 'Tap a country.';
        if (s.picked === 'IQ') return 'That is Iraq. It has a Shia majority too, and the Safavids and Ottomans fought over it. The Safavid homeland is its larger neighbour to the east.';
        if (s.picked === 'TR') return 'That is Turkey, the heart of the Sunni Ottoman Empire, the Safavids\' great rival.';
        if (s.picked === 'SA') return 'That is Saudi Arabia, which has a Sunni majority. Look north-east, across the Gulf.';
        return `That is ${s.nameThe || s.name}. Look for the large country between the Caspian Sea and the Persian Gulf.`;
      },
      solution: { picked: 'IR' },
      hints: ['The Safavid capital was Isfahan, between the Caspian Sea and the Persian Gulf.'],
      explain: `
        **Iran.** The Isfahan of Shah Abbas (1588 to 1629) was so splendid
        that a Persian saying called it "half the world". Its silks and
        carpets went west to Europe and east to India.
        (You met the split between Sunni and Shia Muslims in *Crossroads*.)
      `,
    },
    {
      id: 'mughal',
      type: 'choice',
      title: 'The Mughals: ruling a different majority',
      text: `
        In 1526 **Babur**, a prince from Central Asia, won north India at the
        battle of Panipat, with cannon and muskets. His grandson **Akbar** (1556 to 1605) inherited a
        hard problem: a Muslim dynasty ruling perhaps 100 million people, most
        of them Hindu.

        At Akbar's court, scholars of Islam, Hinduism, Jainism, Zoroastrianism
        and Christianity debated in front of him, and Hindu Rajput princes
        were among his generals. **Which of these fits a ruler like that?**
      `,
      options: [
        { text: 'Ended the tax on non-Muslims and brought Hindu princes into his government and his family', correct: true },
        { text: 'Forced his subjects to convert to Islam', why: 'He did the opposite. A later emperor, Aurangzeb, brought the tax back in 1679, and faced revolts.' },
        { text: 'Split the empire into a Muslim half and a Hindu half', why: 'He kept it together and made it larger.' },
        { text: 'Ruled through soldiers from Central Asia only', why: 'He relied heavily on Hindu Rajput generals and Persian officials too.' },
      ],
      explain: `
        Akbar abolished the tax on non-Muslims in 1564, married Rajput
        princesses and made their kinsmen his generals. An empire of many
        faiths could be held by sharing power as well as by force.
      `,
    },
    {
      id: 'buildings',
      type: 'choice',
      review: true,
      title: 'Power in stone',
      text: `
        Four buildings, four empires. One is the **Taj Mahal** at Agra, which
        the Mughal emperor Shah Jahan built as a tomb for his wife: a dome of
        white marble at the end of a long garden pool.

        **Which picture shows it?**
      `,
      options: [
        { figure: photo(MEDIA.suleymaniye, { alt: 'A grey stone building on a hill, lit at dusk: one large dome above smaller half-domes, and four slender pointed towers', focus: [0.45, 0.4] }), why: 'This is the Süleymaniye Mosque in Istanbul: Ottoman.' },
        { figure: photo(MEDIA.isfahan, { alt: 'A long garden square with a fountain, lined with rows of arcades; at the far end stand a tall gateway with twin towers and a blue-tiled dome, with bare mountains behind' }), why: 'This is the royal square of Isfahan: Safavid Iran.' },
        { figure: photo(MEDIA['taj-mahal'], { alt: 'A white marble building with a large onion-shaped dome and four slender towers, at the end of a long pool' }), correct: true },
        { figure: photo(MEDIA['forbidden-city'], { alt: 'A vast walled compound of halls with curved golden-brown roofs, in rows behind a red gate tower, seen from above at sunset', focus: [0.5, 0.7] }), why: 'This is the Forbidden City in Beijing, the palace of the Ming and Qing emperors.' },
      ],
      explain: `
        The **Taj Mahal** at Agra was built between 1632 and 1653 by Shah
        Jahan for his wife Mumtaz Mahal, who died giving birth to their
        fourteenth child. Its white marble dome and Persian-style garden blend
        Central Asian, Persian and Indian ideas: a portrait of the empire itself.
      `,
    },
    {
      id: 'teach-china',
      type: 'info',
      title: 'China: the centre of the world\'s trade',
      text: `
        The **Ming** (1368 to 1644) built the Forbidden City in Beijing, the
        palace in the photograph, and rebuilt the Great Wall in brick and
        stone.

        In 1644, as rebels took Beijing, an army of **Manchus** from the
        north-east swept in and put their own **Qing** dynasty on the throne.
        They kept the palace and the Chinese system of scholar-officials, and
        pushed the empire's borders out over Mongolia, Tibet and Central Asia,
        further than China reaches today.

        China made what the world wanted to buy: tea, silk and porcelain. As
        you saw in the last lesson, it collected its taxes in silver, and
        silver is what it took in return.
      `,
      figure: photo(MEDIA['forbidden-city'], {
        alt: 'A vast walled compound seen from above at sunset: row behind row of halls with curved golden-brown roofs, set round wide courtyards behind a red gate tower.',
        caption: 'The Forbidden City, Beijing: palace of the Ming and Qing emperors',
      }),
    },
    {
      id: 'china',
      type: 'fill',
      title: 'Two dynasties, one palace',
      text: `
        A visitor reaches Beijing in 1700, under the Qing.
        **Complete the summary.**
      `,
      template: `
        The palace of the Ming and Qing emperors was the [[*Forbidden City|Taj Mahal|Süleymaniye]].
        The Qing rulers were [[Mongols|*Manchus|Japanese]] who governed a far larger Chinese population.
        Foreigners who wanted China's tea, silk and porcelain mostly had to pay in [[wool|guns|*silver]].
      `,
      explain: `
        China's population doubled in the 1700s, to more than 300 million,
        helped by the American crops of the last lesson. It was the world's
        largest economy, and so much of its fine pottery was sold abroad that
        English simply calls the stuff "china".
      `,
    },
    {
      id: 'japan',
      type: 'interact',
      title: 'Japan: one door left open',
      text: `
        In 1603 **Tokugawa Ieyasu** became shogun, ending a century of civil
        war. The shoguns ruled from **Edo**, today's Tokyo. Fearing that
        foreign missionaries would bring foreign armies, Ieyasu's heirs banned
        Christianity, expelled the Portuguese and forbade Japanese to sail
        abroad.

        One door stayed open: Dutch and Chinese ships could still call at a
        single port in the far south-west. **Tap it.**
      `,
      widget: {
        type: 'world-map', view: [126, 30, 146, 42.5], mode: 'pickMarker', markerLabels: 'after', answer: 'nagasaki',
        markers: [marker('nagasaki'), marker('kyoto'), marker('edo')],
        alt: 'A map of Japan with three lettered markers: one in the far south-west on the island of Kyushu, one in the centre of the main island, and one on the east coast.',
      },
      check: (s) => {
        if (s.picked === 'nagasaki') return true;
        if (s.picked === 'edo') return 'That is Edo, the shogun\'s capital (today\'s Tokyo), on the east coast. The open port lay far to the south-west.';
        if (s.picked === 'kyoto') return 'That is Kyoto, where the emperor lived. The open port lay on the island of Kyushu, far to the south-west.';
        return 'Tap one of the three markers.';
      },
      solution: { picked: 'nagasaki' },
      hints: ['South-west is the lower left of this map: the island of Kyushu, nearest to China.'],
      explain: `
        **Nagasaki.** The Dutch were kept on Dejima, a man-made island the
        size of a city block. Japan also traded with Korea and China, so it was
        never truly "closed". It had 250 years of peace, and Edo grew to about
        a million people, one of the largest cities on Earth, with a lively
        world of theatre, poetry and colour prints.
      `,
    },
    {
      id: 'term',
      type: 'choice',
      title: 'Why "gunpowder empires"?',
      text: `
        Historians often call the Ottoman, Safavid and Mughal states the
        **gunpowder empires**. Cannon that could batter down a fortress were
        hugely expensive: they needed foundries, powder mills and paid
        specialists.

        **What did that do to the balance of power inside a country?**
      `,
      options: [
        { text: 'It favoured rulers rich enough to afford cannon, over local lords behind castle walls', correct: true },
        { text: 'It let every village defend itself', why: 'Siege guns were far beyond the means of a village, or of most nobles.' },
        { text: 'It made armies smaller and cheaper', why: 'Armies grew larger and much more expensive, which is why states needed more tax.' },
        { text: 'It ended the use of cavalry at once', why: 'Horsemen stayed important for centuries, especially in Iran and on the steppe.' },
      ],
      explain: `
        Guns helped big states swallow small ones, in Asia and in Europe
        alike. But the label has limits. Gunpowder was a Chinese invention, as
        you saw in *Crossroads*, and Japan and Europe used it just as much. And
        no empire lasts on guns alone: these ones also ran on tax records,
        trade and rulers who claimed to protect the faith.
      `,
    },
    {
      id: 'timeline',
      type: 'interact',
      review: true,
      title: 'Who ruled when?',
      text: `
        Each bar is a dynasty. Around **1600** Akbar ruled India and Shah Abbas
        ruled Iran. **Tap the dynasty that ruled China at that moment.**
      `,
      widget: {
        type: 'timeline', from: 1350, to: 1950, step: 100, mode: 'pick',
        spans: DYNASTIES.map((id) => ({ id, from: Math.max(EMPIRES[id].from, 1350), to: EMPIRES[id].to, label: EMPIRES[id].short, color: EMPIRES[id].color })),
        events: [{ year: 1600, label: '1600', color: 'gray' }],
        alt: 'A timeline from 1350 to 1950 with six bars: Ottoman (from before 1350 to 1922), Safavid (1501 to 1736), Mughal (1526 to 1857), Ming (1368 to 1644), Qing (1644 to 1912) and Tokugawa (1603 to 1868).',
      },
      check: (s) => {
        if (s.picked === 'ming') return true;
        if (s.picked === 'qing') return 'The Qing took Beijing in 1644. Who was there before them?';
        if (s.picked === 'tokugawa') return 'The Tokugawa ruled Japan, and only from 1603.';
        if (s.picked) return `The ${EMPIRES[s.picked].short} dynasty did not rule China. Look for the two bars that follow one another.`;
        return 'Tap one of the bars.';
      },
      solution: { picked: 'ming' },
      hints: ['Two of the bars are dynasties of China: Ming and Qing. Which one covers 1600?'],
      explain: `
        The **Ming** ruled until 1644, when the Qing replaced them. Notice how
        long these states lasted: the Ottomans for six centuries, until 1922,
        and the Qing until 1912. In 1600 nobody would have guessed that small
        kingdoms on Europe's Atlantic edge would one day overshadow them.
      `,
    },
    {
      id: 'size',
      type: 'slider',
      stretch: true,
      title: 'Guests at the gate',
      text: `
        In 1615 an English ambassador, Sir Thomas Roe, arrived at the Mughal
        court. He spent three years asking the emperor Jahangir for permission
        to trade. England had about 4 million people at the time.

        **Roughly how many lived in the Mughal Empire?**
      `,
      min: 0, max: 200, step: 10, answer: 120, tolerance: 30, unit: ' million', start: 10,
      explain: `
        Somewhere between 100 and 150 million: at least twenty-five times as
        many as England. In the 1600s Europeans came to Asia's great courts as
        petitioners, buying cloth, spices, tea and porcelain with American
        silver, because they made little that Asia wanted. How that balance
        tipped is a story for *The Modern World*.
      `,
    },
    {
      id: 'teach-capitals',
      type: 'info',
      title: 'Six capitals, six countries of today',
      text: `
        The dynasties are gone, but their capitals are still great cities. The
        map shows **today's** borders, with the country in which each capital
        now lies.

        | About 1600 | Ruled from | Today in |
        |---|---|---|
        ${Object.keys(HOME_ASK).map((id) => `| ${capFirst(HOME_ASK[id].split(' ruled from ')[0])} | **${PLACES[EMPIRES[id].capital].name.replace(' (Tokyo)', '')}** | ${countryName(EMPIRES[id].home)} |`).join('\n        ')}

        Edo is today's Tokyo. The Qing, who replaced the Ming in 1644, kept
        Beijing as their capital.
      `,
      figure: {
        type: 'world-map', view: HOME_VIEW,
        regions: Object.keys(HOME_ASK).map((id) => ({ ids: [EMPIRES[id].home], color: EMPIRES[id].color, tone: 'soft' })),
        markers: Object.keys(HOME_ASK).map((id) => marker(EMPIRES[id].capital, { label: `${PLACES[EMPIRES[id].capital].name.replace(' (Tokyo)', '')}, ${countryName(EMPIRES[id].home)}`, labelPos: CAPITAL_LABEL_POS[id] })),
        legend: false,
        alt: `A map of Europe and Asia with today's borders. Six countries are coloured and named, each with its old capital marked: ${andList(Object.keys(HOME_ASK).map((id) => `${PLACES[EMPIRES[id].capital].name.replace(' (Tokyo)', '')} in ${countryName(EMPIRES[id].home)}`))}.`,
      },
    },
    {
      id: 'empire-home',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const id = rng.pick(Object.keys(HOME_ASK));
        const e = EMPIRES[id];
        const cap = PLACES[e.capital];
        return {
          text: `About 1600, ${HOME_ASK[id]}. **Tap the present-day country in which that capital lies.**`,
          widget: {
            type: 'world-map', view: HOME_VIEW, mode: 'pick', answer: e.home, pickable: HOME_PICKABLE,
            alt: 'A map of Europe and Asia from the Mediterranean to Japan, without names.',
          },
          check: (s) => {
            if (s.picked === e.home) return true;
            if (!s.picked) return 'Tap a country.';
            const other = Object.keys(HOME_ASK).find((k) => EMPIRES[k].home === s.picked);
            if (other) return `That is ${s.nameThe || countryName(s.picked)}, where ${HOME_ASK[other]}.`;
            return `That is ${s.nameThe || countryName(s.picked)}. ${cap.name.replace(' (Tokyo)', '')} lies elsewhere.`;
          },
          solution: { picked: e.home },
          explain: `${cap.name.replace(' (Tokyo)', ' (today\'s Tokyo)')} is in ${countryName(e.home)}. The map shows today's borders; ${e.name} covered ${EXTENT_THEN[id]}.`,
        };
      },
    },
    {
      id: 'teach-states',
      type: 'info',
      title: 'Seven states, and what to remember them by',
      text: `
        ${Object.keys(STATE_BRIEF).map((id) => `- **${capFirst(EMPIRES[id].name)}**: ${STATE_BRIEF[id]}.`).join('\n        ')}
      `,
      figure: {
        type: 'timeline', from: 1350, to: 1950, step: 100, mode: 'static',
        spans: DYNASTIES.map((id) => ({ id, from: Math.max(EMPIRES[id].from, 1350), to: EMPIRES[id].to, label: EMPIRES[id].short, color: EMPIRES[id].color })),
        events: [{ year: 1600, label: '1600', color: 'gray' }],
        alt: 'A timeline from 1350 to 1950 with six bars: Ottoman (from before 1350 to 1922), Safavid (1501 to 1736), Mughal (1526 to 1857), Ming (1368 to 1644), Qing (1644 to 1912) and Tokugawa (1603 to 1868).',
      },
    },
    {
      id: 'which-empire',
      type: 'choice',
      review: true,
      gen: (rng) => empireFactStep(rng),
    },
  ],
  recap: [
    'Around 1600 about three in five people lived in Asia, most of them under a handful of great empires.',
    'Ottomans (Istanbul), Safavids (Isfahan) and Mughals (Agra and Delhi) were Muslim dynasties ruling peoples of many faiths; the Safavids made Iran Shia.',
    'Ming and then Qing China was the world\'s largest economy; Tokugawa Japan kept peace for 250 years and limited contact with Europeans to Nagasaki.',
    'Costly cannon favoured big, centralised states, but these empires lasted through administration, trade and belief as much as through guns.',
  ],
  next: 'Next: back to Europe, where a goldsmith\'s machine is about to make books cheap, and split a church.',
};
