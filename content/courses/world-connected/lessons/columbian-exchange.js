// One World: 1450 to 1800 · Lesson 2 · The Great Exchange
//
// Driving question: how did a few ships change what the whole world eats, who lives where
// and who holds power, and what did it cost?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-connected/index.js';
import { EVENTS, GOODS, HOMELANDS, CROP_HOMES, ROUTES, marker, goodsFrom, andList, kitchenStep, dishStep } from '../helpers.js';

const SEA = (text, lon, lat) => ({ at: [lon, lat], text, style: 'water' });

// A crop's name inside a sentence: lower case, except for a proper adjective ("Asian rice").
const cropName = (crop) => (/^Asian /.test(crop) ? crop : crop.toLowerCase());
const capFirst = (text) => text[0].toUpperCase() + text.slice(1);

// The table behind the two generated kitchen questions, split into plants and animals for the teaching screen.
const ANIMALS = ['turkey', 'horse', 'cattle', 'pig', 'donkey', 'goat'];
const cropsOf = (home) => goodsFrom(home).filter((id) => !ANIMALS.includes(id)).map((id) => GOODS[id].name);
const animalsOf = (home) => goodsFrom(home).filter((id) => ANIMALS.includes(id)).map((id) => GOODS[id].name);

const HOMELAND_LABEL_POS = { mexico: 'top', andes: 'left', crescent: 'top', ethiopia: 'left', yangtze: 'top', newGuinea: 'bottom' };

// Where travellers of the exchange put down roots (for the map of "new homes"): [lon, lat].
const NEW_HOMES = [
  { label: 'Potato', at: [-8, 53.2], from: 'americas', labelPos: 'top' },
  { label: 'Cassava', at: [15, -1], from: 'americas', labelPos: 'bottom' },
  { label: 'Chilli', at: [78.5, 19], from: 'americas', labelPos: 'bottom' },
  { label: 'Horse', at: [-101, 40], from: 'afroeurasia', labelPos: 'top' },
  { label: 'Sugar cane', at: [-40, -9], from: 'afroeurasia', labelPos: 'bottom' },
];

export default {
  id: 'columbian-exchange',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Dinner in 1450',
      text: `
        Travel back to the year 1450 and look into three kitchens.
        **Which of these would you find?**
      `,
      options: [
        { text: 'Tomato sauce in Naples' },
        { text: 'Chilli peppers in Sichuan' },
        { text: 'Potatoes in Ireland' },
        { text: 'None of them', correct: true },
      ],
      explain: `
        **None of them.** Tomatoes, chillies and potatoes all grew in the
        Americas, and in 1450 no one in Europe, Asia or Africa had ever seen one.

        This lesson follows what crossed the oceans once ships did: how it
        changed dinner everywhere, and what it cost.
      `,
    },
    {
      id: 'teach-two-worlds',
      type: 'info',
      title: 'Two worlds of living things',
      text: `
        For thousands of years the Americas had been cut off from Africa,
        Asia and Europe, and farmers on each side had tamed different plants
        and animals. Europeans came to call their side the **Old World** and
        the Americas the **New World**. In 1491:

        - **Only in the Americas:** ${cropsOf('americas').join(', ')}. Farm
          animals were few, among them ${andList([...animalsOf('americas'), 'llamas'])}.
        - **Only in Africa, Asia and Europe:** ${cropsOf('afroeurasia').join(', ')},
          and the big farm animals: ${andList(animalsOf('afroeurasia'))}.

        So nobody in the Americas had tasted pork, beef or cheese, and nobody
        across the ocean had tasted a tomato.
      `,
      figure: {
        type: 'world-map', view: 'world', zoom: false,
        regions: [
          { ids: 'americas', color: 'green', tone: 'soft', label: 'The Americas (the "New World")' },
          { ids: ['europe', 'africa', 'asia'], color: 'orange', tone: 'soft', label: 'Africa, Asia and Europe (the "Old World")' },
        ],
        alt: 'A world map in two colours: the Americas in one, and Africa, Asia and Europe in the other, with the Atlantic Ocean between them.',
      },
    },
    {
      id: 'sort',
      type: 'bucket',
      title: 'Which side of the ocean?',
      text: `
        It is 1491, the year before Columbus sails.
        **Sort these by where they lived.**
      `,
      buckets: ['Only in the Americas', 'Only in Africa, Asia and Europe'],
      items: [
        { text: 'Maize (corn)', bucket: 0 },
        { text: 'Potatoes', bucket: 0 },
        { text: 'Tomatoes', bucket: 0 },
        { text: 'Cacao (chocolate)', bucket: 0, why: 'Cacao comes from the tropical Americas. The Maya and the Mexica drank it; most of it is grown in West Africa today.' },
        { text: 'Wheat', bucket: 1 },
        { text: 'Horses', bucket: 1, why: 'Horses did evolve in North America, but they died out there about 10,000 years ago. In 1491 no one in the Americas had ever seen one.' },
        { text: 'Sugar cane', bucket: 1, why: 'Sugar cane is from New Guinea and southern Asia. Columbus carried it to the Caribbean in 1493.' },
        { text: 'Coffee', bucket: 1, why: 'Coffee is from Ethiopia. It reached the Americas in the 1700s.' },
      ],
      explain: `
        The Americas had many crops but few farm animals: llamas, alpacas,
        turkeys, guinea pigs. The other side had the horses, cattle, pigs and
        sheep, and that difference was about to matter.
      `,
    },
    {
      id: 'teach-homelands',
      type: 'info',
      title: 'Every crop has a homeland',
      text: `
        Each crop was first bred from a wild plant in one part of the world:
        its homeland. Here are seven crops and their six homelands. Find each
        homeland on the map.

        | Crop | First grown in |
        |---|---|
        ${CROP_HOMES.map((c) => `| ${c.crop} | **${capFirst(HOMELANDS[c.spot].name)}** |`).join('\n        ')}
      `,
      figure: {
        type: 'world-map', view: 'world', zoom: false,
        markers: Object.keys(HOMELANDS).map((id) => ({ at: HOMELANDS[id].at, label: HOMELANDS[id].name.replace(/^the /, ''), labelPos: HOMELAND_LABEL_POS[id], color: ['mexico', 'andes'].includes(id) ? 'green' : 'orange', shape: ['mexico', 'andes'].includes(id) ? 'dot' : 'square' })),
        alt: `A world map with six homelands of crops marked: ${andList(Object.values(HOMELANDS).map((h) => `${h.name}, ${h.hint}`))}.`,
        caption: 'Dots: homelands in the Americas. Squares: the other four',
      },
    },
    {
      id: 'homelands',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const item = rng.pick(CROP_HOMES);
        const ids = Object.keys(HOMELANDS);
        const letters = 'ABCDEF';
        return {
          text: `Six homelands of the world's crops are marked. **Tap the one where ${cropName(item.crop)} was first grown.**`,
          widget: {
            type: 'world-map', view: 'world', mode: 'pickMarker', markerLabels: 'after', answer: item.spot,
            markers: ids.map((id) => ({ id, at: HOMELANDS[id].at, label: HOMELANDS[id].name.replace(/^the /, '') })),
            alt: 'A world map with six lettered markers: in Mexico, in the Andes, in the Middle East, in Ethiopia, in central China and in New Guinea.',
          },
          check: (s) => {
            if (s.picked === item.spot) return true;
            if (!s.picked) return 'Tap one of the six markers.';
            const others = CROP_HOMES.filter((c) => c.spot === s.picked).map((c) => cropName(c.crop));
            return `That is ${HOMELANDS[s.picked].name}, the homeland of ${others.join(' and ')}. For ${cropName(item.crop)}, look ${HOMELANDS[item.spot].hint}.`;
          },
          solution: { picked: item.spot },
          explain: `${item.note} Marker ${letters[ids.indexOf(item.spot)]} is ${HOMELANDS[item.spot].name}.`,
        };
      },
    },
    {
      id: 'name',
      type: 'info',
      title: 'The Columbian Exchange',
      text: `
        After 1492 ships carried living things both ways across the Atlantic,
        on purpose and by accident. In 1972 the historian Alfred Crosby gave
        this a name: the **Columbian Exchange**.

        - **To the Americas:** horses, cattle, pigs, wheat, sugar cane, and
          diseases such as smallpox and measles.
        - **From the Americas:** maize, potatoes, cassava, tomatoes, chillies,
          cacao, tobacco.

        It was the biggest reshuffling of life on Earth since the Ice Age, and
        it was not an even trade.
      `,
      figure: {
        type: 'world-map', view: [-125, -42, 60, 62],
        regions: [
          { ids: 'americas', color: 'green', tone: 'soft' },
          { ids: ['europe', 'africa', 'asia'], color: 'orange', tone: 'soft' },
        ],
        lines: [
          { points: [[-8, 36], [-20, 27], [-45, 20], [-66, 19]], color: 'orange', width: 4, curve: 'straight', arrow: true, animate: 'draw', label: 'To the Americas' },
          { points: [[-76, 27], [-62, 36], [-36, 42], [-11, 43.5]], color: 'green', width: 4, curve: 'straight', arrow: true, animate: 'draw', label: 'From the Americas' },
        ],
        labels: [SEA('Atlantic Ocean', -32, -18)],
        zoom: false,
        alt: 'A map of the Atlantic with the Americas on one side and Europe and Africa on the other. One arrow runs from Spain to the Caribbean, another from North America back to Europe.',
      },
    },
    {
      id: 'disease',
      type: 'choice',
      tone: 'sober',
      title: 'The deadliest passengers',
      text: `
        The worst of the exchange could not be seen. Smallpox, measles and
        influenza crossed with the first ships. Many of these diseases had
        jumped to humans from the herd animals of Africa, Asia and Europe, and
        people there had lived with them for centuries. The Americas had
        almost no herd animals, and had never known these diseases.

        Smallpox reached the Caribbean by 1518 and the mainland by 1520, and
        it ran ahead of the Europeans themselves.

        **Why did these diseases kill so many more people in the Americas?**
      `,
      options: [
        { text: 'They were new there: nobody had met them before, so nobody had any immunity', correct: true },
        { text: 'Medicine in the Americas was more backward', why: 'Mexica and Inca healers were skilled, and European doctors of 1520 could do nothing against smallpox either.' },
        { text: 'American cities were dirtier', why: 'Tenochtitlan, with its aqueducts and daily street cleaning, amazed the Spaniards by its cleanliness.' },
        { text: 'Europeans released them on purpose everywhere', why: 'The great epidemics of the 1500s spread with no plan behind them. But conquest made them far deadlier: war, enslavement, forced labour and hunger left the sick with no one to nurse them.' },
      ],
      explain: `
        Across the ocean, people had lived with these diseases for centuries.
        In the Americas they were new, and nobody had any defence against them.

        Nobody knows the numbers for certain. Many historians think 50 to 60
        million people lived in the Americas in 1492. Within about a century, in
        many regions, as many as nine in ten had died, of disease together with
        war, forced labour and hunger. It is one of the greatest losses of life
        in human history.
      `,
    },
    {
      id: 'malintzin',
      type: 'interact',
      title: 'A meeting, as Tlaxcala remembered it',
      text: `
        In 1519 Hernán Cortés landed in Mexico with a few hundred Spaniards.
        This scene is from a history painted about 1550 by artists of
        **Tlaxcala**, a state that had long resisted the Mexica (Aztec)
        empire. Local lords bring baskets of food and turkeys to the seated
        Cortés.

        Neither side speaks the other's language.
        **Tap the person who makes the meeting possible.**
      `,
      widget: photo(MEDIA.lienzo, {
        credit: 'after the Lienzo de Tlaxcala (Tlaxcalan artists, about 1550; later copy)',
        alt: 'A line drawing in the style of a Mexican painted manuscript. On the left stand soldiers with lances, round shields and feathered helmets. A bearded man in a hat sits on a chair. Beside him stands a woman with long hair, pointing with both hands. On the right three men in cloaks approach with a basket of food; more baskets and three turkeys lie in front.',
        creditLabel: 'Drawing',
        hotspots: [
          { id: 'soldiers', x: 0.16, y: 0.38, r: 0.07, label: 'Spanish soldiers', alt: 'men with lances and shields on the left' },
          { id: 'cortes', x: 0.345, y: 0.43, r: 0.055, label: 'Cortés', alt: 'a bearded man in a hat, seated on a chair' },
          { id: 'malintzin', x: 0.465, y: 0.4, r: 0.055, label: 'Malintzin, the interpreter', alt: 'a woman with long hair standing in the middle, pointing' },
          { id: 'lords', x: 0.66, y: 0.5, r: 0.065, label: 'Local lords', alt: 'a man in a cloak, hands raised, at the head of a group' },
          { id: 'gifts', x: 0.58, y: 0.86, r: 0.06, label: 'Gifts of food', alt: 'baskets on the ground' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'malintzin') return true;
        if (s.picked === 'cortes') return 'That is Cortés. He speaks only Spanish. Who stands between him and the lords, pointing both ways?';
        if (s.picked === 'lords') return 'These lords speak Nahuatl, which no Spaniard understands. Someone has to carry the words across.';
        if (s.picked === 'soldiers') return 'The soldiers stand back. Look at the middle of the scene, between the two sides.';
        if (s.picked === 'gifts') return 'The food is a welcome, but it cannot talk. Look for the person standing between the two sides.';
        return 'Tap one of the numbered rings.';
      },
      solution: { picked: 'malintzin' },
      hints: ['Look between the seated man and the visitors: who is pointing both ways?'],
      explain: `
        **Malintzin** (the Spaniards called her Doña Marina) was a Nahua woman
        who had been sold into slavery as a girl and was given to Cortés
        in 1519. She spoke Nahuatl and Maya and soon learned Spanish. The
        Tlaxcalan artists drew her at the centre, as large as Cortés himself:
        without her, no alliance could have been made.
      `,
    },
    {
      id: 'teach-conquest',
      type: 'info',
      tone: 'sober',
      title: 'The fall of Tenochtitlan',
      text: `
        With Malintzin's help the Tlaxcalans and Cortés made an alliance
        against their common enemy: the Mexica, in their island capital
        **Tenochtitlan**.

        The Mexica fought hard. In 1520 they drove the Spaniards out of the
        city with heavy losses. Then smallpox reached it. It killed great
        numbers of people, among them the emperor Cuitláhuac.

        In 1521 Cortés came back with steel weapons, horses and guns, and
        with tens of thousands of Tlaxcalan and other local allies. The city
        fell.
      `,
      figure: {
        type: 'world-map', view: [-107, 13.5, -87, 24], dots: false,
        markers: [
          marker('tenochtitlan', { labelPos: 'left', color: 'red', shape: 'square' }),
          marker('tlaxcala', { labelPos: 'right', color: 'blue' }),
        ],
        labels: [SEA('Gulf of Mexico', -93.5, 21.5), SEA('Pacific Ocean', -102, 15)],
        legend: false,
        alt: 'A map of central and southern Mexico between the Gulf of Mexico and the Pacific. Tenochtitlan is marked in the middle of the highlands; Tlaxcala lies about 100 km to its east.',
        caption: 'Tlaxcala lay about 100 km east of the Mexica capital',
      },
    },
    {
      id: 'conquest',
      type: 'multi',
      tone: 'sober',
      title: 'How a few hundred men took an empire',
      text: `
        Two years after Cortés landed, the great Mexica capital Tenochtitlan,
        a city of perhaps 200,000 people, had fallen.
        **Which of these really helped the Spaniards win?**
      `,
      options: [
        { text: 'Tens of thousands of Tlaxcalan and other local allies', correct: true },
        { text: 'A smallpox epidemic inside the city', correct: true },
        { text: 'Steel weapons, horses and guns', correct: true },
        { text: 'The Mexica took Cortés for a god and did not fight', why: 'That story comes from accounts written decades later, and many historians now doubt it. The Mexica fought hard: in 1520 they drove the Spaniards out of the city with heavy losses.' },
      ],
      explain: `
        Most of the army that took Tenochtitlan in 1521 was indigenous: for
        the Tlaxcalans this was their war against an old enemy. Allies, an
        epidemic and weapons together did what a few hundred men could not.

        In 1532 Francisco Pizarro seized the Inca ruler Atahualpa, whose
        empire had just been shaken by an epidemic and by a war between two
        brothers.
      `,
    },
    {
      id: 'teach-new-homes',
      type: 'info',
      title: 'New homes',
      text: `
        Crops and animals soon put down roots far from where they began.

        - **Potatoes** and maize feed more people than the same field of
          wheat, and grow on poor, hilly ground. The potato became the daily
          food of Ireland and northern Europe.
        - **Cassava** fed West and Central Africa, and **chillies** went into
          the cooking of India, Thailand and Sichuan.
        - **Horses** reached the Great Plains of North America, where nations
          such as the Comanche and Lakota rebuilt their whole way of life
          around them within a few generations.
        - **Sugar cane** was planted in Brazil and the Caribbean.
      `,
      figure: {
        type: 'world-map', view: 'world', zoom: false,
        markers: NEW_HOMES.map((m) => ({ at: m.at, label: m.label, labelPos: m.labelPos, color: m.from === 'americas' ? 'green' : 'orange', shape: m.from === 'americas' ? 'dot' : 'square' })),
        alt: 'A world map marking where five travellers of the exchange took root: the potato in Ireland, cassava in Central Africa, the chilli in India, the horse on the Great Plains of North America and sugar cane in Brazil.',
        caption: 'Dots: arrived from the Americas. Squares: arrived in the Americas',
      },
    },
    {
      id: 'spread',
      type: 'match',
      title: 'Who settled where?',
      text: `
        **Match each traveller with a place that made it its own.**
      `,
      pairs: [
        ['Potato, from the Andes', 'Ireland and northern Europe'],
        ['Cassava, from South America', 'West and Central Africa'],
        ['Chilli, from Mexico', 'India, Thailand and Sichuan'],
        ['Horse, from Europe', 'The Great Plains of North America'],
        ['Sugar cane, from Asia', 'Brazil and the Caribbean'],
      ],
      explain: `
        The new food crops helped populations grow in Europe, in Africa and in
        China, which roughly doubled in the 1700s. Sugar has a darker story:
        it is the subject of the last lesson of this course.
      `,
    },
    {
      id: 'silver',
      type: 'info',
      tone: 'sober',
      title: 'A mountain of silver',
      text: `
        Spain's greatest prize was not gold. In 1545 silver was found in the
        **Cerro Rico**, the "rich hill" above Potosí in the Andes, 4,000 metres
        up. Within a lifetime more than 100,000 people lived there, as many as
        in the great cities of Europe.

        Andean villagers were forced to work the mines in turns, under a labour
        draft the Spanish adapted from the Incas. Many died, of rockfalls, lung
        disease and the mercury used to refine the ore.
      `,
      figure: photo(MEDIA.potosi, {
        alt: 'An old woodcut. A steep, cone-shaped mountain under the heading "Cero del Potosi" has dark veins and tunnels near its peak and tiny figures climbing its paths. A town of low houses and two churches spreads at its foot.',
        caption: 'Potosí and its silver mountain: the first picture of it printed in Europe, 1553',
        creditLabel: 'Print', credit: 'from Pedro Cieza de León, Crónica del Perú (1553)',
      }),
    },
    {
      id: 'loop',
      type: 'interact',
      review: true,
      title: 'Where the world closed its circle',
      text: `
        Silver left the Americas in two directions. Fleets carried most of it
        to Spain. But from 1571 a galleon also sailed west each year from
        Mexico, to a new Spanish port where Chinese merchants sold silk and
        porcelain for silver.

        **Tap that port.**
      `,
      widget: {
        type: 'world-map', view: 'world', center: -150, mode: 'pickMarker', markerLabels: 'after', answer: 'manila',
        lines: [
          { points: ROUTES.silverAtlantic.points, color: 'gray', width: 2.5, curve: 'straight', arrow: true },
          { points: ROUTES.galleon.points, color: 'gray', width: 2.5, curve: 'straight', arrow: true },
          { points: ROUTES.manilaChina.points, color: 'gray', width: 2.5, curve: 'straight', arrow: 'both' },
        ],
        markers: [marker('seville'), marker('potosi'), marker('acapulco'), marker('manila')],
        alt: 'A world map centred on the Pacific with four lettered markers: in southern Spain, in the Andes of South America, on the Pacific coast of Mexico and in the Philippines. Arrows run from the Andes to Spain and from Mexico across the Pacific to the Philippines and on to China.',
      },
      check: (s) => {
        if (s.picked === 'manila') return true;
        if (s.picked === 'seville') return 'That is Seville, where the Atlantic fleets unloaded. The galleon from Mexico sailed the other way, west across the Pacific.';
        if (s.picked === 'acapulco') return 'That is Acapulco, where the galleon set out. Follow its arrow across the Pacific.';
        if (s.picked === 'potosi') return 'That is Potosí, where the silver was mined. Look for the port at the Asian end of the Pacific arrow.';
        return 'Tap one of the four markers.';
      },
      solution: { picked: 'manila' },
      hints: ['The galleon left Mexico and crossed the Pacific. Which marker is at the Asian end of that arrow?'],
      explain: `
        **Manila**, in the Philippines. China had the largest economy on Earth
        and collected its taxes in silver, so silver bought about twice as much
        there as in Spain. Perhaps a third of all American silver ended up in
        China.

        With the Manila galleons, goods could for the first time travel all the
        way round the planet. Some historians date the birth of world trade to
        that year, 1571.
      `,
    },
    {
      id: 'coin',
      type: 'choice',
      title: 'One world, on a coin',
      text: `
        Mexican and Andean silver was struck into coins like this one, worth
        eight *reales*: the "piece of eight". For three centuries they were
        accepted from Boston to Canton.

        Look at the design: two globes side by side under one crown, between two
        pillars. **What do the two globes stand for?**
      `,
      figure: photo(MEDIA.coin, {
        alt: 'Both faces of a worn silver coin. On one, two overlapping globes sit under a crown between two pillars, above waves, with the date 1739. On the other is a crowned coat of arms with castles and lions.',
        caption: 'Silver coin of eight reales, struck in Mexico City in 1739',
        maxWidth: 480,
      }),
      options: [
        { text: 'The Old World and the New, joined under the Spanish crown', correct: true },
        { text: 'The Sun and the Moon', why: 'They are maps, not heavenly bodies: look for the outlines of land on them.' },
        { text: 'Spain and Portugal', why: 'The two kingdoms were separate when these coins were struck. The pillars stand for the Strait of Gibraltar, the old edge of the known world.' },
        { text: 'Silver and gold', why: 'The coin is silver, but the globes are two halves of the Earth.' },
      ],
      explain: `
        The motto round the globes reads *utraque unum*: "both are one". This
        coin was the first money used all over the world, and it left traces.
        The words *peso* and *dollar* were both names for it, and the \\$ sign
        most likely began as a clerk's shorthand for "pesos".
      `,
    },
    {
      id: 'order',
      type: 'order',
      title: 'Eighty years',
      text: '**Put these in order, earliest first.** Each made the next one possible.',
      items: [
        EVENTS.columbus.label,
        EVENTS.tenochtitlanFalls.label,
        EVENTS.atahualpa.label,
        EVENTS.potosi.label,
        EVENTS.manila.label,
      ],
      labels: ['Earliest', 'Latest'],
      explain: `
        Columbus crossed in **1492**. Tenochtitlan fell in 1521 and Atahualpa
        was seized in 1532; silver was found at Potosí in 1545, and Manila was
        founded in 1571. In those same eighty years Luther began the
        Reformation, Babur founded the Mughal empire and Copernicus moved the
        Earth: all later in this course.
      `,
    },
    {
      id: 'dish',
      type: 'choice',
      review: true,
      gen: (rng) => dishStep(rng),
    },
    {
      id: 'kitchen',
      type: 'choice',
      review: true,
      gen: (rng) => kitchenStep(rng),
    },
  ],
  recap: [
    'After 1492, plants, animals and germs crossed the Atlantic in both directions: the **Columbian Exchange**.',
    'Old World diseases, with war and forced labour, killed a very large share of the peoples of the Americas within about a century.',
    'American crops (maize, potatoes, cassava, tomatoes, chillies, cacao) changed farming and cooking on every continent.',
    'Andean and Mexican silver flowed to Spain and, through Manila, to China: the first trade to circle the globe.',
  ],
  next: 'Next: where most of the world\'s people and wealth actually were in 1600. Five great empires, from Istanbul to Beijing.',
};
