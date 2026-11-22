// Crossroads: 500 to 1500 · Lesson 3 · Gold, Salt and Stone
//
// Driving question: where did the wealth of Africa's kingdoms come from, and how were they tied
// to the rest of the world?
import { pic, mk, at, ev, pinCheck, findOnMap, africaMatch, SEA_EAST_AFRICA, SEA_KILWA_SOFALA } from '../helpers.js';

const SAHARA_VIEW = [-19, 4, 18, 38];

const PEAKS = { ghana: 1050, mali: 1325, songhai: 1500 };
const PEAK_TOLERANCE = 100;

export default {
  id: 'african-kingdoms',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Where the gold came from',
      text: `
        In the 1300s the mints of Cairo, Venice and Florence were striking gold coins in huge numbers.

        **Where do you think the largest share of that gold was dug?**
      `,
      options: [
        { text: 'West Africa', correct: true },
        { text: 'The Alps' },
        { text: 'India' },
        { text: 'The Americas', why: 'Nobody in Europe or Africa knew the Americas existed yet.' },
      ],
      explain: `
        **West Africa**, south of the Sahara. Its goldfields were the largest single source of gold for the whole Mediterranean world.

        This lesson asks where the wealth of Africa's kingdoms came from, and how they were tied to the rest of the world.
      `,
    },
    {
      id: 'gold-salt',
      type: 'info',
      title: 'Gold north, salt south',
      text: `
        People who work in the heat need **salt**, and the savanna south of the Sahara has almost none. The desert has plenty: at Taghaza it was cut from the ground in slabs.

        The savanna and the forest edge had **gold**, washed from rivers by thousands of small-scale miners. North Africa and Europe had almost none.

        Once the **camel** was in common use in the Sahara (from about 300 CE), each side could reach the other. A crossing took about two months. Watch the caravan roads draw themselves.

        They end at trading cities on the desert's southern edge, the **Sahel** (from the Arabic for "shore"): Koumbi Saleh, Timbuktu, Gao. There the camels from the north handed over to donkeys, porters and river boats from the south.
      `,
      figure: {
        type: 'world-map', dots: false, view: SAHARA_VIEW, dim: false,
        rivers: ['Niger'],
        lines: [
          { points: [at('sijilmasa'), at('taghaza'), at('timbuktu')], color: 'red', width: 3, animate: 'draw', label: 'Caravan roads' },
          { points: [at('sijilmasa'), [-8.5, 26], [-10.4, 17.4], at('koumbi')], color: 'red', width: 3, animate: 'draw' },
          { points: [at('gao'), [0.3, 27.2], [1.5, 32.5], [-1.3, 34.9]], color: 'red', width: 3, animate: 'draw' },
          { points: [[-10.2, 12.2], [-8, 12.6], [-5.4, 13.8], at('timbuktu')], color: 'yellow', width: 4, arrow: true, animate: 'draw', label: 'Gold moving north' },
        ],
        markers: [
          mk('sijilmasa', { labelPos: 'right' }), mk('taghaza', { shape: 'square', color: 'gray', label: 'Taghaza (salt)', labelPos: 'right' }), mk('timbuktu', { labelPos: 'left' }),
          mk('koumbi', { labelPos: 'left' }), mk('gao', { labelPos: 'right' }),
          { id: 'gold', at: [-10.2, 12.2], label: 'Goldfields', shape: 'diamond', color: 'yellow', labelPos: 'bottom' },
        ],
        labels: [{ at: [6, 24], text: 'Sahara', style: 'area' }, { at: [9, 14.2], text: 'Sahel', style: 'area' }],
        alt: 'A map of north-west Africa. Caravan roads cross the Sahara from Sijilmasa in Morocco south through the salt mines of Taghaza to Timbuktu on the River Niger, and to Koumbi Saleh further west; another runs north from Gao. An arrow shows gold moving north from the goldfields near the upper Niger to Timbuktu.',
      },
    },
    {
      id: 'middlemen',
      type: 'choice',
      tone: 'sober',          // the explanation speaks of the trans-Saharan slave trade
      text: `
        The kings of **Ghana** and later **Mali** owned neither the salt mines in the desert nor, for the most part, the goldfields in the south.

        **So how did they become so rich?**
      `,
      options: [
        { text: 'Their lands lay between the two, and they taxed and protected the trade', correct: true },
        { text: 'They conquered North Africa and seized its treasure', why: 'No West African army crossed the desert. The traffic came to them.' },
        { text: 'They sold gold directly to Europe by ship', why: 'Sea trade down the Atlantic coast began only after 1440, with the Portuguese. Until then everything crossed the sand.' },
        { text: 'They mined the salt themselves', why: 'Taghaza lay far out in the desert and was worked by desert peoples, not by the kings\' own subjects.' },
      ],
      explain: `
        Their cities stood exactly where the camels had to hand over. Whoever kept that meeting place safe could tax everything that passed.

        The traveller Ibn Battuta, who crossed Mali in 1352, wrote that a person could travel there without fear of robbers. The same caravans also took enslaved people north across the desert, a trade that went on for more than a thousand years.
      `,
    },
    {
      id: 'musa',
      type: 'interact',
      title: 'A king on a map',
      text: `
        In **1324 Mansa Musa**, ruler of Mali, crossed the Sahara on pilgrimage to Mecca with a caravan of thousands. In Cairo he gave away so much gold that, according to a writer who visited twelve years later, its price had still not recovered.

        News travelled. In 1375 a Jewish mapmaker on the island of Majorca, probably Abraham Cresques, drew a great atlas of the known world, and put this figure in the middle of West Africa.

        **Tap the detail that shows what Europe had heard about Mali.**
      `,
      widget: pic('mansa-musa', {
        alt: 'A detail of a medieval map on parchment, crossed by straight ruled lines. A Black king with a gold crown sits on a throne, holding a sceptre in one hand and holding up a round gold object in the other. Small drawings of towns with their names are scattered around him, and a note in Catalan is written beside his head.',
        creditLabel: 'Map',
        hotspots: [
          { id: 'gold', x: 0.378, y: 0.3, r: 0.055, label: 'A nugget of gold', alt: 'a round yellow object held up in the king\'s hand' },
          { id: 'crown', x: 0.56, y: 0.21, r: 0.065, label: 'A crown in the European style', alt: 'the crown on the king\'s head' },
          { id: 'town', x: 0.3, y: 0.75, r: 0.065, label: 'A town labelled "tenbuch": Timbuktu', alt: 'a small drawing of a building with a name written above it' },
        ],
      }),
      check: (s) => s.picked === 'gold'
        || (s.picked === 'crown' ? 'The mapmaker gave him the crown and sceptre of a European king, because that is what kings looked like to him. Look for what is special about *this* king.'
          : s.picked === 'town' ? 'That little building is labelled *tenbuch*: Timbuktu. The mapmaker knew the towns, but what is the king himself showing you?' : false),
      solution: { picked: 'gold' },
      explain: `
        He holds up a **nugget of gold**. The note beside his head says, in Catalan, that this king is the richest and noblest lord of all the region, because of the abundance of gold gathered in his land.

        Read the names by the little towns: *tagaza*, *tenbuch*, *geugeu*, *ciutat de melly*. A mapmaker in Spain knew Taghaza, Timbuktu, Gao and the "city of Mali".
      `,
    },
    {
      id: 'ghana-where',
      type: 'interact',
      mode: 'predict',
      title: 'A trick of names',
      text: `
        The first of the gold kingdoms was **Ghana**. (Its own people called it Wagadu; *ghana* was the title of its king.)

        **Tap the modern country where you think its capital stood.**
      `,
      widget: {
        type: 'world-map', view: 'west-africa', mode: 'pick', answer: 'MR', pickable: ['west-africa'],
        alt: 'A map of West Africa without names.',
      },
      check: (s) => s.picked === 'MR',
      solution: { picked: 'MR' },
      explain: `
        Its capital was probably **Koumbi Saleh**, in the far south-east of today's **Mauritania**, close to the border of Mali.

        Modern Ghana lies hundreds of kilometres away to the south-east and was never part of it. When the British colony of the Gold Coast became independent in 1957, its leaders chose the name to honour the ancient kingdom. Modern **Mali** took its name in the same spirit in 1960.
      `,
    },
    {
      id: 'three-empires',
      type: 'interact',
      title: 'Three empires in turn',
      text: `
        Three states in turn controlled the Sahel trade, each larger than the last.

        - **Ghana** was described at its height by a geographer writing in Córdoba in 1068.
        - **Mali** was founded about 1235 by Sundiata Keita; his great-nephew Mansa Musa made his pilgrimage in 1324.
        - **Songhai**, with its capital at Gao, was at its largest about 1500.

        **Drag each card to the time of that empire's height.** Within ${PEAK_TOLERANCE} years counts.
      `,
      widget: {
        type: 'timeline', from: 700, to: 1600, step: 100, snap: 25,
        events: [ev('baghdad', { color: 'gray' }), ev('chinggis', { color: 'gray' }), ev('columbus', { color: 'gray' })],
        place: [
          { id: 'ghana', label: 'Ghana', color: 'orange', answer: PEAKS.ghana },
          { id: 'mali', label: 'Mali', color: 'green', answer: PEAKS.mali },
          { id: 'songhai', label: 'Songhai', color: 'violet', answer: PEAKS.songhai },
        ],
        alt: 'A timeline from 700 to 1600 with three landmarks (Baghdad founded 762, Chinggis Khan proclaimed 1206, Columbus sails 1492) and three cards to place: Ghana, Mali and Songhai.',
      },
      check: (s) => {
        if (!s.complete) return 'Place all three cards on the line.';
        for (const [id, name] of [['ghana', 'Ghana'], ['mali', 'Mali'], ['songhai', 'Songhai']]) {
          const off = s.placed[id] - PEAKS[id];
          if (Math.abs(off) > PEAK_TOLERANCE) return `${name} is more than ${PEAK_TOLERANCE} years too ${off > 0 ? 'late' : 'early'}. Read its line in the text again.`;
        }
        return true;
      },
      solution: { placed: { ghana: 1050, mali: 1325, songhai: 1500 } },
      explain: `
        Ghana about 1050, Mali about 1325, Songhai about 1500. Songhai fell in 1591 to an army from Morocco that crossed the desert with guns.

        Sundiata's story has been passed down for nearly 800 years by **griots**, the singer-historians of West Africa, and is still performed today.
      `,
    },
    {
      id: 'timbuktu',
      type: 'interact',
      title: 'A city of books',
      text: `
        Mali's most famous city grew where the **River Niger** bends north to touch the desert: boats from the south met camels from the north. By 1500 **Timbuktu** was a city of mosques, schools and libraries. A visitor of that time reported that hand-written books were sold there for more profit than any other goods.

        **Place the pin on Timbuktu.** Within 300 km counts.
      `,
      widget: {
        type: 'world-map', dots: false, view: 'west-africa', mode: 'place', dim: false,
        rivers: ['Niger'],
        pin: { label: 'Timbuktu', color: 'red', start: [4, 22] }, target: at('timbuktu'),
        labels: [{ at: [9, 23.5], text: 'Sahara', style: 'area' }],
        alt: 'A map of West Africa without country names. The River Niger is drawn: it rises near the Atlantic coast, flows north-east to the edge of the Sahara, then bends south-east to the Gulf of Guinea.',
      },
      check: pinCheck('timbuktu', 300, 'Follow the Niger to the top of its great bend.'),
      solution: { pin: [-3, 16.8] },
      hints: ['The Niger makes an arch. Timbuktu is at the top of the arch.'],
      explain: `
        Timbuktu stands just north of the top of the Niger's bend, in what is now Mali. Djenné, further up the river, was its twin in trade and scholarship. Their scholars wrote on law, astronomy, medicine and history, in Arabic and in African languages written with Arabic letters. Hundreds of thousands of their manuscripts survive in family libraries.
      `,
    },
    {
      id: 'teach-swahili',
      type: 'info',
      tone: 'sober',          // the cargo list includes enslaved people
      title: 'The other coast',
      text: `
        Africa had a second front door. Along the east coast a chain of stone-built port cities grew rich on the monsoon trade of lesson 1: gold, ivory, iron and enslaved people went out; cloth, beads and Chinese porcelain came in.

        Their people were Africans who became Muslims and spoke **Swahili**. Its grammar is **Bantu**: it is one of hundreds of related languages that Bantu-speaking farmers and ironworkers had carried across most of Africa south of the equator over the previous two to three thousand years.

        Centuries of trade with Arabia added many words borrowed from **Arabic**. Even the name comes from the Arabic for "coasts".
      `,
      figure: {
        type: 'world-map', dots: false, view: [16, -28, 62, 18], dim: false,
        lines: [
          { points: SEA_EAST_AFRICA, color: 'blue', width: 3, label: 'Sea routes' },
          { points: SEA_KILWA_SOFALA, color: 'blue', width: 3 },
          { points: [at('greatzimbabwe'), [33, -20.2], at('sofala')], color: 'yellow', width: 4, arrow: true, label: 'Gold to the coast' },
        ],
        markers: [mk('mogadishu', { labelPos: 'left' }), mk('mombasa', { labelPos: 'left' }), mk('kilwa', { labelPos: 'left' }), mk('sofala', { labelPos: 'right' }), mk('greatzimbabwe', { shape: 'square', color: 'yellow', labelPos: 'top' }), mk('aden', { labelPos: 'top' })],
        labels: [{ at: [54, -6], text: 'Indian Ocean', style: 'water' }],
        alt: 'A map of East Africa. Sea routes run from Aden down the coast past Mogadishu, Mombasa and Kilwa to Sofala. An arrow shows gold moving from Great Zimbabwe, inland, to the coast at Sofala.',
      },
    },
    {
      id: 'swahili',
      type: 'fill',
      tone: 'sober',          // follows the screen on the east-coast trade, whose cargo list includes enslaved people
      title: 'A language of the coast',
      text: `
        The merchants of Kilwa, Mombasa and the other east-coast ports spoke Swahili.

        **Complete the description of their language.**
      `,
      template: 'Swahili is a [[*Bantu|Semitic|Persian]] language, a cousin of hundreds of others spoken across central and southern Africa, with many words borrowed from [[*Arabic|Chinese|Greek]]. The winds that carried its merchants were the [[*monsoon|westerlies|polar winds]].',
      explain: `
        Swahili's grammar is **Bantu**; a good part of its vocabulary is **Arabic**, picked up over centuries of **monsoon** trade.

        Today Swahili is spoken, as a first or second language, by perhaps 100 million people or more (estimates vary widely). *Safari* is a Swahili word, from the Arabic for "journey".
      `,
    },
    {
      id: 'zimbabwe',
      type: 'choice',
      title: 'Houses of stone',
      text: `
        Much of Kilwa's gold came from a kingdom on the plateau far inland. Its capital, **Great Zimbabwe**, was built between about 1100 and 1450. This wall, up to 11 metres high and about 250 metres round, is of granite blocks fitted **without mortar**.

        Many European colonists of the 1870s insisted that Africans could not have built it. Then archaeologists dug. Everything they found was of local African make and of the right age.

        **So who built it?**
      `,
      figure: pic('great-zimbabwe', {
        alt: 'A high wall built of thousands of small, evenly laid stone blocks curves away to the right, several times the height of the doorway that pierces it. Through the doorway a second stone wall can be seen. There is no mortar between the stones.',
        caption: 'The Great Enclosure at Great Zimbabwe',
      }),
      options: [
        { text: 'It was built by local Africans, ancestors of the Shona', correct: true },
        { text: 'It was built by Phoenician sailors', why: 'This was a favourite colonial theory. Nothing Phoenician has ever been found there, and the site is about 2,000 years too young.' },
        { text: 'It was the palace of the Queen of Sheba', why: 'Another colonial-era legend. The buildings date from about 1100 to 1450 CE, some two thousand years after her time.' },
        { text: 'It was built by Arab merchants from the coast', why: 'Trade goods did arrive from the coast (Chinese pottery, glass beads and a coin from Kilwa were found there), but the building style and the everyday objects are local.' },
      ],
      explain: `
        The evidence in the ground, from pottery to tools, points one way: local builders. The archaeologist **Gertrude Caton-Thompson** proved it beyond reasonable doubt in 1929, as David Randall-MacIver had argued in 1905.

        The white-minority government of Rhodesia went on denying it, and pressed museums and guidebooks to say otherwise, into the 1970s. At independence in 1980 the country renamed itself after the site: **Zimbabwe**, usually explained as "houses of stone".
      `,
    },
    {
      id: 'lalibela',
      type: 'choice',
      title: 'A church you look down on',
      text: `
        The highlands of **Ethiopia** have been Christian since the 300s, when the kings of Aksum adopted the faith (you met Aksum in *First Worlds*).

        About 1200, at a place now called **Lalibela** after the king said to have ordered them, eleven churches were made. This is one, the church of St George. The photographer is standing on the ground: the grass at the top of the picture is at the same level. And look at the walls: there is not a block or a joint in them.

        **How was it made?**
      `,
      figure: pic('lalibela', {
        alt: 'A view from the rim of a deep pit cut into reddish rock. A tall block-like building with doors and small windows stands in the pit. Its flat roof is level with the ground around the pit, where grass and trees grow.',
        caption: 'Bete Giyorgis (the church of St George), Lalibela, Ethiopia',
      }),
      options: [
        { text: 'It was carved downward out of solid rock, in one piece', correct: true },
        { text: 'It was built of blocks in a pit dug for it', why: 'There are no blocks and no joints: walls, roof, pillars and windows are one piece of stone.' },
        { text: 'It was built on the surface, and the ground has risen around it', why: 'The roof was the starting point. Masons cut a trench around a block of rock, then hollowed the block out.' },
      ],
      explain: `
        Masons cut a trench about 12 metres deep around a block of living rock, then carved the block into a church, inside and out, working from the roof down. Nothing could be added afterwards: every mistake was permanent.

        The churches have been in use ever since, and are still a place of pilgrimage for Ethiopian Orthodox Christians.
      `,
    },
    {
      id: 'ife',
      type: 'multi',
      title: 'A face from Ife',
      text: `
        This head was cast in a copper alloy at **Ife**, a city of the Yoruba people in what is now Nigeria, probably in the 1300s or early 1400s. It was made by the **lost-wax** method: model the head in wax over a clay core, coat it in clay, melt the wax out and pour metal into the gap.

        **What can you fairly conclude from an object like this?** Choose every one that follows.
      `,
      figure: pic('ife-head', {
        alt: 'A life-like head of a calm young adult, cast in dark metal. Fine parallel lines run down the whole face, and the head wears a tall crown of beads with a crest at the front.',
        caption: 'Crowned head from Ife, Nigeria, probably 1300s or early 1400s',
      }),
      options: [
        { text: 'Ife had highly trained, full-time artists', correct: true },
        { text: 'Someone there was rich enough to pay for costly metal and months of skilled work', correct: true },
        { text: 'Ife was linked to long-distance trade, since copper had to be brought from far away', correct: true },
        { text: 'It must have been made by visiting Greeks or Romans', why: 'That is what the first European to publish such heads claimed after visiting Ife in 1910: he imagined the lost Atlantis of Greek legend. They are Yoruba work, made many centuries after the Roman Empire.' },
      ],
      explain: `
        Art like this needs specialists, patrons and trade. The same refusal to believe met Ife as met Great Zimbabwe, and was just as wrong.

        The neighbouring kingdom of **Benin** (by its own tradition, taught by a master from Ife) cast thousands of brass plaques and heads for its royal palace.
      `,
    },
    {
      id: 'teach-africa-map',
      type: 'info',
      title: 'All of it on one map',
      text: `
        Here is the lesson on one map of Africa.

        - **Facing the Sahara:** Koumbi Saleh, capital of ancient Ghana; the salt mines of Taghaza; Timbuktu, the city of books on the Niger.
        - **Facing the Indian Ocean:** the Swahili island port of Kilwa, and inland Great Zimbabwe, whose gold it shipped.
        - **In the highlands of Ethiopia:** the rock-cut churches of Lalibela.
        - **In the forest country near the Gulf of Guinea:** Ife, city of the metal heads.

        And on the Nile, **Cairo**: Africa's largest city, where Mansa Musa gave away his gold.
      `,
      figure: {
        type: 'world-map', dots: false, view: 'africa', dim: false,
        rivers: ['Niger', 'Nile'],
        markers: [
          mk('koumbi', { labelPos: 'left' }), mk('taghaza', { shape: 'square', color: 'gray', labelPos: 'top' }), mk('timbuktu', { labelPos: 'right' }),
          mk('ife', { labelPos: 'bottom' }), mk('cairo', { labelPos: 'top' }), mk('lalibela', { labelPos: 'right' }),
          mk('kilwa', { labelPos: 'right' }), mk('greatzimbabwe', { shape: 'square', color: 'yellow', labelPos: 'bottom' }),
        ],
        labels: [{ at: [12, 23.5], text: 'Sahara', style: 'area' }, { at: [52, -8], text: 'Indian Ocean', style: 'water' }],
        alt: 'A map of Africa with eight places named. In the west: Koumbi Saleh and Timbuktu on the southern edge of the Sahara, Taghaza in the desert to their north, and Ife near the Gulf of Guinea. In the north-east: Cairo on the Nile. In the east: Lalibela in the highlands of Ethiopia, Kilwa on the coast south of the equator, and Great Zimbabwe inland in the south.',
      },
    },
    {
      id: 'find-site',
      type: 'interact',
      review: true,
      gen: (rng) => findOnMap(rng, {
        pool: ['timbuktu', 'taghaza', 'cairo', 'kilwa', 'greatzimbabwe', 'lalibela', 'ife'],
        view: 'africa',
        alt: 'A map of Africa with five unnamed markers.',
      }),
    },
    {
      id: 'match-sites',
      type: 'match',
      review: true,
      gen: (rng) => africaMatch(rng),
    },
    {
      id: 'two-doors',
      type: 'bucket',
      review: true,
      title: 'Two front doors',
      text: 'Africa south of the Sahara traded with the wider world across a sea of sand and a sea of water. **Sort each place by the door it used.**',
      buckets: ['Across the Sahara', 'Across the Indian Ocean'],
      items: [
        { text: 'Timbuktu', bucket: 0 },
        { text: 'Gao, capital of Songhai', bucket: 0 },
        { text: 'Koumbi Saleh, capital of Ghana', bucket: 0 },
        { text: 'The salt mines of Taghaza', bucket: 0 },
        { text: 'Kilwa', bucket: 1 },
        { text: 'Mombasa', bucket: 1 },
        { text: 'Sofala', bucket: 1 },
        { text: 'Great Zimbabwe', bucket: 1, why: 'It lay inland, but its gold went out through Sofala and Kilwa, and Chinese porcelain came back.' },
      ],
      explain: 'West Africa faced the desert and its camel caravans. East and southern Africa faced the ocean and its monsoon ships. Neither was cut off from the world.',
    },
  ],
  recap: [
    'West Africa\'s gold crossed the Sahara by camel in exchange for salt. Ghana, then Mali, then Songhai grew rich by controlling the meeting place.',
    'Mansa Musa\'s pilgrimage of 1324 made Mali famous from Cairo to Majorca. Timbuktu became a city of scholars and books.',
    'On the east coast, Swahili cities such as Kilwa joined Africa to the monsoon trade. Much of their gold came from Great Zimbabwe.',
    'Ethiopia carved churches from solid rock, and Ife cast lifelike heads in metal. Outsiders who doubted that Africans made these things were wrong.',
  ],
  next: 'Next: the richest and most inventive society of the age, where people paid with paper and read printed books 400 years before Gutenberg.',
};
