// Crossroads: 500 to 1500 · Lesson 7 · Worlds Apart: The Americas Before 1492
//
// Driving question: with no contact with Afro-Eurasia, what did the peoples of the Americas build,
// and how was it alike and different?
import { pic, mk, at, ev, findOnMap, whichPeople, mayaNumber, mayaPrimer, mayaValue, INCA_1525, AMERICAN_PEOPLES } from '../helpers.js';

const WHEN = { cahokia: 1100, tenochtitlan: 1325, inca: 1438 };
const WHEN_TOLERANCE = 75;
const INCA_LANDS = ['EC', 'PE', 'BO', 'CL', 'AR', 'CO'];
const AMERICAS_VIEW = [-125, -38, -34, 52];          // the summary map and the "find it" map

// What to remember each people by, in the order of AMERICAN_PEOPLES (helpers.js): the line of the summary table.
// Every trait that the "which people …?" step can ask about (AMERICAN_TRAITS) is named here.
const PEOPLE_NOTES = [
  'Glyphs; counting in twenties, with a zero; rival rainforest city-states such as Tikal, Palenque and Copán',
  'Tenochtitlan, on an island in a lake; *chinampa* gardens; the Nahuatl language',
  'Cusco; about 40,000 km of roads, with relay runners; accounts kept on knotted quipus',
  'More than a hundred earth mounds beside the Mississippi',
  'The cliff villages of Mesa Verde; the great houses of Chaco Canyon',
];

export default {
  id: 'americas',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Which is older?',
      text: `
        When Spanish soldiers first saw the Aztec capital, **Tenochtitlan**, in 1519, they compared it to an enchanted city from a storybook.

        The **University of Oxford**, in England, is still open today.

        **Which do you think is older?**
      `,
      shuffle: false,
      options: [
        { text: 'The University of Oxford', correct: true },
        { text: 'Tenochtitlan' },
        { text: 'They are about the same age' },
      ],
      explain: `
        **Oxford**, by more than two centuries: people were teaching there by 1096, and Tenochtitlan was founded about 1325.

        The empires the Spaniards met were young. But they stood on thousands of years of American city-building, done with **no contact** with Africa, Europe or Asia. This lesson asks what people built on the other half of the planet, and how it was alike and different.
      `,
    },
    {
      id: 'apart',
      type: 'info',
      title: 'Two worlds',
      text: `
        People reached the Americas during the Ice Age (*First Worlds*). Then the seas rose, and for more than 10,000 years the two halves of humanity went their own ways. Apart from a short-lived Norse camp (lesson 5) and a meeting of Polynesian sailors with South Americans about 1200, nobody crossed.

        Americans invented farming for themselves, with their own crops, and then cities, states and writing. By 500 CE the city of Teotihuacan, in central Mexico, already had about 100,000 people. The map shows three of the regions where cities grew.
      `,
      figure: {
        type: 'world-map', dots: false, view: [-125, -40, -34, 52], dim: false,
        areas: [
          { circle: [-93.5, 18], km: 750, color: 'green', label: 'Mesoamerica' },
          { polygon: INCA_1525, color: 'orange', label: 'The Andes' },
          { circle: [-99, 37.5], km: 1050, color: 'violet', label: 'Mississippi and the south-west' },
        ],
        markers: [mk('tenochtitlan', { labelPos: 'left' }), mk('tikal', { labelPos: 'right' }), mk('cusco', { labelPos: 'right' }), mk('cahokia', { labelPos: 'right' }), mk('mesaverde', { labelPos: 'left' })],
        alt: 'A map of the Americas with three shaded regions: Mesoamerica (central and southern Mexico and Guatemala) with Tenochtitlan and Tikal; the Andes along the west of South America with Cusco; and the middle of North America with Cahokia and Mesa Verde.',
      },
    },
    {
      id: 'maya-numbers',
      type: 'info',
      title: 'Counting with the Maya',
      text: `
        In the rainforest of what is now Guatemala and southern Mexico, **Maya** city-states such as Tikal, Palenque and Copán were at their height between about 250 and 900. Their scribes wrote in glyphs (*First Worlds*) and tracked the Sun, the Moon and Venus over centuries.

        Their numbers need only three signs: a [dot]{.blue} for **one**, a [bar]{.orange} for **five** and a [shell]{.yellow} for **zero**. That takes you to 19.

        For bigger numbers they did what we do and started a new **place**. Our places go up in tens, from right to left. Theirs go up in **twenties**, from bottom to top. The last figure shows 2 twenties and 8 ones: 48.
      `,
      figure: mayaPrimer(),
    },
    {
      id: 'read-number',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const top = rng.int(1, 4);
        let bottom = rng.pick([0, 0, ...Array.from({ length: 19 }, (_, i) => i + 1)]);
        if (top === 2 && bottom === 8) bottom = 9;          // 2 twenties and 8 ones is the worked example of the screen before
        const value = mayaValue([top, bottom]);
        return {
          text: `
            A Maya scribe has written this number. A dot is 1, a bar is 5 and a shell is 0. The lower level counts **ones**, the upper level counts **twenties**.

            **What number is it?**
          `,
          figure: mayaNumber([top, bottom]),
          answer: value,
          wrong: [
            [top + bottom, 'You added the two levels together. The upper level counts twenties, not ones.'],
            [top * 10 + bottom, 'You read the upper level as tens. The Maya counted in twenties.'],
            [bottom * 20 + top, 'The other way up: the *lower* level is the ones.'],
          ],
          hints: ['Work out each level first: count 5 for every bar and 1 for every dot.', `The upper level shows ${top}, so it is worth ${top} × 20.`],
          explain: `Upper level: ${top} × 20 = ${top * 20}. Lower level: ${bottom}${bottom === 0 ? ' (the shell: nothing in this place)' : ''}. Together: **${value}**. This is place value with a zero, the same idea as our Hindu-Arabic numerals (lesson 2), invented independently on the other side of the world.`,
        };
      },
    },
    {
      id: 'maya-fate',
      type: 'choice',
      text: `
        Between about 800 and 900, one after another, the great Maya cities of the southern rainforest stopped putting up monuments and emptied.

        Cities further north, such as Chichén Itzá, flourished afterwards. And today several million people in Guatemala, Mexico and Belize speak Mayan languages.

        **So what happened to the Maya?**
      `,
      options: [
        { text: 'Many southern cities were abandoned, but the Maya people carried on and are still there', correct: true },
        { text: 'They vanished, and nobody knows where they went', why: 'A popular mystery, but nobody vanished. People moved away from failing cities, many of them north into Yucatán.' },
        { text: 'They were conquered by the Aztecs', why: 'The Aztec empire rose five centuries later, far to the west.' },
        { text: 'They were wiped out by a single earthquake', why: 'The cities emptied one by one over more than a century, not in a day.' },
      ],
      explain: `
        "Collapse" describes the cities and their kings, not the people: the Maya of today speak about thirty Mayan languages.

        Why did the southern cities fail? Historians point to a mix of causes: long droughts, worn-out farmland and constant war between the cities. They disagree about which mattered most.
      `,
    },
    {
      id: 'tenochtitlan',
      type: 'interact',
      tone: 'sober',          // the explanation speaks of human sacrifice
      title: 'A city on a lake',
      text: `
        About 1325 the **Mexica** (whom we often call Aztecs) founded **Tenochtitlan** on an island in a lake, 2,240 metres up in the Valley of Mexico. Two centuries later it held perhaps 200,000 people, more than any city in Spain, and ruled an empire of millions.

        This map was printed in Germany in 1524, based (it is thought) on a drawing sent home by the Spanish commander.

        Three **causeways**, raised roads of earth and stone several kilometres long, tied the island city to the shore. **Tap one of them.**
      `,
      widget: pic('tenochtitlan-map', {
        alt: 'A hand-coloured woodcut map, nearly round. A city of small red-roofed houses fills an island in a blue lake. In the middle of the city is a large walled square with temples. Straight roads run from the city across the water to towns on the green shore all around, and small boats dot the lake.',
        creditLabel: 'Map',
        credit: 'Friedrich Peypus (printer), Nuremberg, 1524',          // the record's author field is a whole sentence
        hotspots: [
          { id: 'causeway', x: 0.17, y: 0.49, r: 0.06, label: 'A causeway', alt: 'a straight pale band running from the city to the left-hand shore' },
          { id: 'precinct', x: 0.49, y: 0.47, r: 0.08, label: 'The sacred precinct, with the Great Temple', alt: 'the large walled square at the centre of the city' },
          { id: 'lake', x: 0.73, y: 0.75, r: 0.06, label: 'Lake Texcoco', alt: 'open blue water with a small boat' },
        ],
      }),
      check: (s) => s.picked === 'causeway'
        || (s.picked === 'precinct' ? 'That square is the sacred precinct in the middle of the city. Look for a straight road crossing the water.'
          : s.picked === 'lake' ? 'That is the lake itself. A causeway is a raised road built across it.' : false),
      solution: { picked: 'causeway' },
      explain: `
        The straight bands across the water are the causeways; an aqueduct brought fresh water. Around the island farmers built up plots of lake mud called **chinampas**, some of the most productive farmland ever made.

        In the central square stood the Great Temple, where priests offered human sacrifices, many of them prisoners of war. How many is still debated.

        Mexico City stands on the spot today, and the lake is almost gone. The eagle on a cactus on Mexico's flag is the sign that, in Mexica tradition, showed their ancestors where to build.
      `,
    },
    {
      id: 'inca',
      type: 'interact',
      title: 'The long empire',
      text: `
        In South America the **Inca** built the largest state in the Americas in less than a century, beginning about 1438 under the ruler **Pachacuti**. They called it **Tawantinsuyu**, "the four parts together". It ran for 4,000 km down the Andes (the shaded strip), with perhaps 10 to 12 million people and about 40,000 km of roads. The red line is the main highland road.

        The four great roads met at the capital, **Cusco**.

        **Tap the modern country where Cusco stands.**
      `,
      widget: {
        type: 'world-map', view: [-88, -40, -52, 6], aspect: 1.05, mode: 'pick', answer: 'PE', pickable: ['south-america'],
        areas: [{ polygon: INCA_1525, color: 'orange', label: 'Inca state about 1525 (roughly)' }],
        markers: [mk('cusco', { shape: 'star', color: 'red', size: 'l', labelPos: 'right' })],
        lines: [{ points: [at('quito'), [-79, -3], [-78.5, -7.2], [-75.2, -12], [-72.9, -13.6], at('cusco'), [-70, -15.8], [-68.1, -16.5], [-66.2, -19.6], [-65.4, -24.8], [-68.8, -32.9], at('santiago')], color: 'red', width: 2.5 }],
        alt: 'A map of South America without names. A shaded strip follows the Andes down the western side of the continent, from just north of the equator far into the south, with a road running along it. A star on the road marks Cusco.',
      },
      check: (s) => s.picked === 'PE'
        || (INCA_LANDS.includes(s.picked) ? `The Inca state reached into what is now ${s.nameThe || s.name}, but its capital lay further ${s.picked === 'EC' || s.picked === 'CO' ? 'south' : 'north'}.` : s.picked ? `${s.name} lay outside the Inca state. Stay on the shaded strip.` : false),
      solution: { picked: 'PE' },
      hints: ['Find the star on the red road. Which country\'s outline is it inside?'],
      explain: `
        **Peru.** Cusco lies 3,400 metres up in the southern Peruvian Andes. From it the Inca state reached north into Ecuador and south through Bolivia into Chile and Argentina.

        Relay runners called *chaskis*, posted every few kilometres, could pass a message about 240 km in a day: the same idea as the Mongol relay of lesson 6, but on foot.
      `,
    },
    {
      id: 'quipu',
      type: 'choice',
      mode: 'predict',
      title: 'What is this?',
      text: `
        The Inca ran their state without writing as the rest of this course has known it: no glyphs, no alphabet.

        About a thousand objects like this one survive.

        **What do you think it was for?**
      `,
      figure: pic('quipu', {
        alt: 'Dozens of thin orange and cream cords fan out like a fringe from a thicker cord laid in a curve, against a black background. Small knots can be seen along the hanging cords.',
        caption: 'An Inca quipu, Larco Museum, Lima',
        credit: 'Lyndsaruell, English Wikipedia',          // the record's author field names the person who only copied the file to Commons
      }),
      options: [
        { text: 'Keeping records', correct: true },
        { text: 'Fishing' },
        { text: 'Wearing as a necklace' },
        { text: 'Making music' },
      ],
      explain: `
        It is a **quipu**, a record made of knots. The kind of knot and its height on the cord give a number, in base **ten**. Trained officials used quipus to keep the census, the taxes (paid in labour) and the contents of thousands of state storehouses.

        The numbers were worked out in 1912. Some quipus seem to hold more than numbers, perhaps names or stories, and nobody can read those yet.
      `,
    },
    {
      id: 'teach-toolkit',
      type: 'info',
      title: 'A different toolkit',
      text: `
        The builders of the Americas worked with a different toolkit from the builders of Europe, Africa and Asia.

        | | In the Americas |
        |---|---|
        | **Metal** | The Inca were skilled workers of gold, silver and bronze. They had no iron. |
        | **Animals** | No horses and no oxen. The llama of the Andes carries only about 30 to 45 kg, and cannot pull a plough or a loaded cart. |
        | **Wheels** | People in Mexico knew the wheel: they put it on toys. But a cart is little use without a strong animal to pull it. |

        So stone was shaped with harder stones and bronze tools, and moved by teams of people with ropes and ramps.
      `,
    },
    {
      id: 'without',
      type: 'multi',
      title: 'Built without',
      text: `
        This is **Machu Picchu**, a royal estate built in the mid-1400s. Its walls are of stone blocks cut to fit each other so closely that they need no mortar, and they have ridden out five centuries of earthquakes.

        **Which of these did its builders do without?** Choose every one.
      `,
      figure: pic('machu-picchu', {
        alt: 'Stone buildings and green terraces cover a narrow ridge high in the mountains, with a steep, pointed peak rising behind them and deep valleys on both sides.',
        caption: 'Machu Picchu, Peru, built in the mid-1400s',
        credit: 'Pedro Szekely',            // the record's author field also carries the address of his Flickr page
      }),
      options: [
        { text: 'Iron tools', correct: true },
        { text: 'Wheeled carts', correct: true },
        { text: 'Horses or oxen', correct: true },
        { text: 'Bronze', why: 'The Inca were skilled workers of bronze, as well as gold and silver. What they did not have was iron.' },
        { text: 'Pack animals of any kind', why: 'They had the llama, which carries only about 30 to 45 kg. It cannot pull a plough or a loaded cart.' },
      ],
      explain: `
        No iron, no carts, no draught animals: only bronze, llamas and many hands.

        Different materials, the same human skill: terraces, roads, storehouses and a state that fed millions.
      `,
    },
    {
      id: 'north',
      type: 'choice',
      title: 'North of Mexico',
      text: `
        North America had towns too. About 1100, **Cahokia**, beside the Mississippi, had perhaps 10,000 to 20,000 people and more than a hundred great mounds of earth.

        In the dry south-west, farmers built multi-storey towns of stone. This one, at **Mesa Verde**, was built into a cliff in the 1200s and left before 1300, during a long drought. Its people moved, mostly south and east, to places with more reliable water. Some of the towns they built there have been lived in ever since.

        **Who are the descendants of its builders?**
      `,
      figure: pic('cliff-palace', {
        alt: 'A village of pale stone buildings, with square and round towers and circular sunken rooms, fills a long, shallow cave under an overhanging cliff. A group of visitors standing in front of it looks tiny.',
        caption: 'Cliff Palace, Mesa Verde, Colorado, built in the 1200s',
      }),
      options: [
        { text: 'The Pueblo peoples of the south-western United States', correct: true },
        { text: 'Nobody: they disappeared without trace', why: 'They moved, mostly south and east to places with more reliable water. Their descendants say so, and so does the archaeology.' },
        { text: 'The Aztecs', why: 'The Mexica built their empire about 2,000 km to the south, two centuries later.' },
        { text: 'The Inuit', why: 'The Inuit are peoples of the Arctic, thousands of kilometres to the north.' },
      ],
      explain: `
        The **Pueblo peoples**, among them the Hopi and the Zuni, are their descendants, and some of their towns are close to a thousand years old. Archaeologists call the builders **Ancestral Puebloans**. Before Mesa Verde, they had built the great houses of Chaco Canyon.

        As with the Maya, people left particular places. They did not vanish.
      `,
    },
    {
      id: 'teach-crops',
      type: 'info',
      title: 'Two sets of crops',
      text: `
        American farmers bred their own crops from wild plants. In 1491 nobody in Europe, Africa or Asia had ever tasted them.

        - **First farmed in the Americas:** maize (corn), potatoes (from the Andes), tomatoes, chilli peppers, and cacao, the bean of chocolate.
        - **First farmed in Africa, Europe or Asia:** wheat, rice, sugar cane (from New Guinea and South-east Asia) and coffee (from Ethiopia and Yemen).

        The words came with the plants: *tomato*, *chocolate*, *avocado* and *chilli* are from **Nahuatl**, the language of the Mexica, which more than a million people still speak.
      `,
    },
    {
      id: 'crops',
      type: 'bucket',
      review: true,
      title: 'Whose dinner?',
      text: `
        American farmers bred their own crops from wild plants. In 1491 nobody in Europe, Africa or Asia had ever tasted them.

        **Sort each food by where it was first farmed.**
      `,
      buckets: ['The Americas', 'Africa, Europe or Asia'],
      items: [
        { text: 'Maize (corn)', bucket: 0 },
        { text: 'Potatoes', bucket: 0, why: 'Potatoes come from the Andes, where farmers grew hundreds of kinds.' },
        { text: 'Tomatoes', bucket: 0, why: 'No tomato sauce in Italy before the 1500s: the tomato is American.' },
        { text: 'Chocolate (cacao)', bucket: 0 },
        { text: 'Chilli peppers', bucket: 0, why: 'Chillies reached India, Thailand and China only after 1492.' },
        { text: 'Wheat', bucket: 1 },
        { text: 'Rice', bucket: 1 },
        { text: 'Sugar cane', bucket: 1, why: 'Sugar cane comes from New Guinea and South-east Asia. Its later history in the Americas is a grim one, told in *One World*.' },
        { text: 'Coffee', bucket: 1, why: 'Coffee comes from Ethiopia and Yemen.' },
      ],
      explain: `
        Maize, potatoes, tomatoes, cacao and chillies are all American, and so are beans, squash, peanuts, vanilla and cassava. Today maize and potatoes are among the most important food crops on Earth.

        The words came with the plants: *tomato*, *chocolate*, *avocado* and *chilli* are from Nahuatl, the language of the Mexica, which more than a million people still speak.
      `,
    },
    {
      id: 'when',
      type: 'interact',
      title: 'Meanwhile, on the other side',
      text: `
        Use what you know from the rest of this course.

        - **Cahokia** was at its height when the pope called the First Crusade.
        - **Tenochtitlan** was founded when Mansa Musa went to Mecca.
        - The **Inca** began their expansion shortly before Constantinople fell.

        **Drag each card to its date.** Within ${WHEN_TOLERANCE} years counts.
      `,
      widget: {
        type: 'timeline', from: 200, to: 1600, step: 200, snap: 25,
        spans: [{ id: 'maya', from: 250, to: 900, label: 'Classic Maya cities', color: 'green' }],
        events: [ev('chinggis', { color: 'gray' }), ev('columbus', { color: 'gray' })],
        place: [
          { id: 'cahokia', label: 'Cahokia', color: 'violet', answer: WHEN.cahokia },
          { id: 'tenochtitlan', label: 'Tenochtitlan', color: 'red', answer: WHEN.tenochtitlan },
          { id: 'inca', label: 'Inca expansion', color: 'orange', answer: WHEN.inca },
        ],
        alt: 'A timeline from 200 to 1600 with a bar for the Classic Maya cities (250 to 900), two landmarks (Chinggis Khan proclaimed 1206, Columbus sails 1492) and three cards to place: Cahokia, Tenochtitlan and Inca expansion.',
      },
      check: (s) => {
        if (!s.complete) return 'Place all three cards on the line.';
        for (const [id, name] of [['cahokia', 'Cahokia'], ['tenochtitlan', 'Tenochtitlan'], ['inca', 'The Inca expansion']]) {
          const off = s.placed[id] - WHEN[id];
          if (Math.abs(off) > WHEN_TOLERANCE) return `${name} is more than ${WHEN_TOLERANCE} years too ${off > 0 ? 'late' : 'early'}.`;
        }
        return true;
      },
      solution: { placed: { cahokia: 1100, tenochtitlan: 1325, inca: 1450 } },
      hints: ['The First Crusade was called in 1095, Mansa Musa travelled in 1324, and Constantinople fell in 1453.'],
      explain: `
        About 1100, about 1325 and about 1438. When Columbus sailed, the Aztec empire was younger than many European universities, and the Inca empire was younger than some of the people living in it.
      `,
    },
    {
      id: 'teach-peoples',
      type: 'info',
      title: 'Five peoples, one map',
      text: `
        Here are the five peoples of this lesson together. Find the place of each on the map.

        | People | Remember them by |
        |---|---|
        ${AMERICAN_PEOPLES.map((name, i) => `| **${name}** | ${PEOPLE_NOTES[i]} |`).join('\n        ')}
      `,
      figure: {
        type: 'world-map', dots: false, view: AMERICAS_VIEW, dim: false,
        markers: [
          mk('tikal', { color: 'green', label: 'Tikal (Maya)', labelPos: 'right' }), mk('tenochtitlan', { color: 'green', labelPos: 'left' }),
          mk('cusco', { color: 'orange', label: 'Cusco (Inca)', labelPos: 'right' }),
          mk('cahokia', { color: 'violet', labelPos: 'right' }), mk('mesaverde', { color: 'violet', labelPos: 'left' }),
        ],
        alt: 'A map of the Americas with five places named: Mesa Verde in the dry south-west of North America, Cahokia beside the Mississippi, Tenochtitlan in the middle of Mexico, the Maya city of Tikal at the base of the Yucatán Peninsula, and the Inca capital Cusco in the Andes of South America.',
      },
    },
    {
      id: 'find-site',
      type: 'interact',
      review: true,
      gen: (rng) => findOnMap(rng, {
        pool: ['cahokia', 'mesaverde', 'tenochtitlan', 'tikal', 'cusco'],
        view: AMERICAS_VIEW,
        count: 4,
        alt: 'A map of the Americas with four unnamed markers.',
      }),
    },
    {
      id: 'which-people',
      type: 'choice',
      review: true,
      gen: (rng) => whichPeople(rng),
    },
  ],
  recap: [
    'The Americas developed for more than 10,000 years without contact with Afro-Eurasia, and still produced farming, cities, states and writing.',
    'The Maya wrote in glyphs and counted in twenties with a zero. Their southern cities emptied about 800 to 900, but several million Maya live there today.',
    'Tenochtitlan (founded about 1325) was an island city of perhaps 200,000. The Inca (from about 1438) ruled the Andes with roads, runners and knotted quipus.',
    'American farmers gave the world maize, potatoes, tomatoes, cacao and chillies.',
  ],
  next: 'In 1491 the two halves of the world still did not know each other. How many people lived in the Americas is uncertain: estimates run from under ten million to over a hundred million, and many historians now say about fifty or sixty. What happened when the ships arrived is the story of the next course, *One World: 1450 to 1800*.',
};
