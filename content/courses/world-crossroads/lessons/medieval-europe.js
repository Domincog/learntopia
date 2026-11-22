// Crossroads: 500 to 1500 · Lesson 5 · Castles, Cathedrals and Constantinople
//
// Driving question: when Rome "fell", did the lights go out in Europe for a thousand years?
import { place } from '../../../../src/widgets/world-map.js';
import { pic, mk, at, ev, when, pinCheck, findOnMap, orderEvents, EVENTS, JUSTINIAN_565 } from '../helpers.js';

const EUROPE_VIEW = [-14, 30, 36, 58];          // the map of the two churches and the "find it" map
// The dated events of the "put these in order" step: the closing timeline shows every one of them.
const WHEN_POOL = ['hagiasophia', 'lindisfarne', 'charlemagne', 'schism', 'crusade', 'blackdeath', 'constantinople'];

// A church of the older kind in cross-section: a round stone vault pushing two thick walls apart.
const VAULT_DIAGRAM = {
  type: 'svg', viewBox: '0 0 360 262', maxWidth: 420,
  alt: 'A cross-section of an early stone church. A round stone vault rests on two thick walls, each with one small window. Red arrows at the top of each wall point outward: the vault pushes the walls apart.',
  content:
    '<path class="stroke-ink fill-none" stroke-width="2.5" stroke-linecap="round" d="M14 244H346"/>'
    + '<path class="fill-gray-soft stroke-ink" stroke-width="2.5" stroke-linejoin="round" d="M60 144A120 120 0 0 1 300 144H250A70 70 0 0 0 110 144Z"/>'
    + '<rect class="fill-gray-soft stroke-ink" stroke-width="2.5" x="60" y="144" width="50" height="100"/>'
    + '<rect class="fill-gray-soft stroke-ink" stroke-width="2.5" x="250" y="144" width="50" height="100"/>'
    + '<rect class="fill-surface stroke-ink" stroke-width="2" x="77" y="176" width="16" height="34" rx="8"/>'
    + '<rect class="fill-surface stroke-ink" stroke-width="2" x="267" y="176" width="16" height="34" rx="8"/>'
    + '<path class="stroke-red fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M54 156H16M28 146L16 156L28 166"/>'
    + '<path class="stroke-red fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M306 156H344M332 146L344 156L332 166"/>'
    + '<text class="fig-label" x="180" y="56" text-anchor="middle">stone vault</text>'
    + '<text class="fig-label text-red" x="35" y="136" text-anchor="middle">push</text>'
    + '<text class="fig-label text-red" x="325" y="136" text-anchor="middle">push</text>'
    + '<text class="fig-label-sm text-muted" x="180" y="198" text-anchor="middle">thick walls,</text>'
    + '<text class="fig-label-sm text-muted" x="180" y="216" text-anchor="middle">small windows</text>',
};

export default {
  id: 'medieval-europe',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Ask a scholar',
      text: `
        Paris, about 1250. You stop a university teacher in the street and ask him one question.

        **"Master, what shape is the Earth?"**

        What do you think he says?
      `,
      options: [
        { text: '"A sphere."', correct: true },
        { text: '"A flat disc, with the ocean round its edge."' },
        { text: '"Nobody knows, and it is a sin to ask."' },
      ],
      explain: `
        **"A sphere."** He probably taught it from the standard university textbook of his day, which was called, simply, *On the Sphere*.

        The story that medieval people thought the Earth was flat was spread in the 1800s. It is one of several myths about the "Middle Ages", the thousand years between Rome and Columbus. This lesson asks what really happened in Europe after Rome "fell".
      `,
    },
    {
      id: 'east-rome',
      type: 'info',
      title: 'The Rome that did not fall',
      text: `
        In 476 the last Roman emperor in the **west** lost his throne. But for a long time the empire had been run as two halves, and the richer, **eastern** half carried on from **Constantinople** for almost another thousand years.

        Its people called themselves Romans to the very end. "Byzantine" is a label that historians made up later.

        Under the emperor **Justinian** (527 to 565) it won back Italy and North Africa, and gathered a thousand years of Roman law into one code, which is still the root of the legal systems of much of Europe.
      `,
      figure: {
        type: 'world-map', dots: false, view: [-11, 23, 46, 50], dim: false,
        areas: JUSTINIAN_565.map((polygon, i) => ({ polygon, color: 'violet', ...(i === 0 ? { label: 'Eastern Roman Empire in 565 (roughly)', labelAt: [33, 39] } : {}) })),
        markers: [mk('constantinople', { shape: 'star', color: 'red', size: 'l', labelPos: 'top' }), mk('rome', { labelPos: 'left' })],
        alt: 'A map of the Mediterranean. The Eastern Roman Empire in 565 is shaded: the Balkans, Anatolia, Syria, Egypt, the coast of North Africa, Italy and the south of Spain. Constantinople is marked with a star.',
      },
    },
    {
      id: 'hagia-sophia',
      type: 'interact',
      title: 'Holy Wisdom',
      text: `
        Justinian's cathedral, **Hagia Sophia** ("Holy Wisdom"), was built in under six years and opened in **537**. Its dome is 31 metres across and its top is 55 metres above the floor. For nine centuries it was the chief church of eastern Christianity.

        Not everything in the photograph is that old. In **1453** the Ottoman Turks took Constantinople and turned the church into a mosque. A mosque has **minarets**: tall, slender towers from which the call to prayer is given.

        **Tap something that was added after 1453.**
      `,
      widget: pic('hagia-sophia', {
        alt: 'A huge building of pink and orange-red masonry under a wide, shallow grey dome, with smaller domes and heavy buttresses clustered around it. Four tall, slender towers with pointed tops stand around it, one of red brick and three of pale stone.',
        hotspots: [
          { id: 'dome', x: 0.54, y: 0.33, r: 0.06, label: 'The great dome, 537 (rebuilt 562)', alt: 'the large central dome' },
          { id: 'minaret', x: 0.735, y: 0.27, r: 0.055, label: 'A minaret, added after 1453', alt: 'a tall slender tower of reddish brick with a pointed top' },
          { id: 'wall', x: 0.44, y: 0.56, r: 0.05, label: 'The body of Justinian\'s church', alt: 'the main wall below the dome, with a great arch' },
        ],
      }),
      check: (s) => s.picked === 'minaret'
        || (s.picked === 'dome' ? 'The dome is Justinian\'s (it was rebuilt, slightly higher, after an earthquake in his own lifetime). Look for something a church would not have.'
          : s.picked === 'wall' ? 'The body of the building is the sixth-century church. Look for something a church would not have.' : false),
      solution: { picked: 'minaret' },
      hints: ['From which kind of tower is the Muslim call to prayer given?'],
      explain: `
        The four slender towers are the **minarets**. The Ottomans added them in stages after 1453.

        The building was a church for 916 years and a mosque for 481. It was made a museum in 1934 (opened in 1935) and a mosque again in 2020.
      `,
    },
    {
      id: 'constantinople',
      type: 'interact',
      title: 'Why there?',
      text: `
        Constantinople was the largest and richest city in Europe for most of these thousand years, and attackers failed against it again and again. Its position explains both.

        **Place the pin on Constantinople:** on the narrow strait that joins the Black Sea to the Mediterranean, where Europe and Asia almost touch. Within 250 km counts.
      `,
      widget: {
        type: 'world-map', dots: false, view: [8, 30, 46, 49], mode: 'place', dim: false,
        pin: { label: 'Constantinople', color: 'red', start: [20, 34.5] }, target: at('constantinople'),
        labels: [{ at: [34.5, 43.4], text: 'Black Sea', style: 'water' }, { at: [18.5, 35.8], text: 'Mediterranean Sea', style: 'water' }],
        alt: 'A map of south-eastern Europe and Anatolia without country names, showing the Black Sea and the eastern Mediterranean, with a pin to place.',
      },
      check: pinCheck('constantinople', 250, 'Find the south-western corner of the Black Sea, where a narrow channel leads out of it.'),
      solution: { pin: [29, 41] },
      hints: ['The Black Sea has only one way out, at its south-western corner.'],
      explain: `
        The city (today **Istanbul**) stands on the **Bosporus**. Every ship between the Black Sea and the Mediterranean passed under its walls, and so did the land road between Europe and Asia. With water on three sides and a triple wall on the fourth, it was almost impossible to storm.
      `,
    },
    {
      id: 'west',
      type: 'info',
      title: 'Meanwhile, in the west',
      text: `
        In the west, kings of the Franks, Goths and Anglo-Saxons ruled where Roman governors had. Towns shrank, trade thinned and few people could read. But it was not darkness.

        **Monks** copied the old Latin books by hand: most Roman literature we have survives because of them. In **800** the Frankish king **Charlemagne**, who ruled most of what is now France, western Germany and northern Italy, was crowned emperor by the pope.

        His scribes developed a clear, rounded handwriting. You are looking at its descendant: our **lower-case letters**. Tap the timeline to see the whole thousand years.
      `,
      figure: {
        type: 'timeline', from: 400, to: 1500, step: 100, mode: 'explore',
        spans: [
          { id: 'east', from: 400, to: 1453, label: 'Eastern Roman (Byzantine) Empire', color: 'violet', note: 'From Constantinople, the eastern Roman Empire outlived the western one by almost a thousand years.' },
          { id: 'vikings', from: 793, to: 1066, label: 'Viking age', color: 'blue', note: 'From the raid on Lindisfarne in 793 to the Norman conquest of England in 1066. (The Normans were themselves descended from Vikings.)' },
          { id: 'crusades', from: 1095, to: 1291, label: 'Crusades to the Holy Land', color: 'red', note: 'From the pope\'s call in 1095 to the fall of the last crusader stronghold, Acre, in 1291.' },
        ],
        events: [
          { id: 'west476', year: 476, label: 'Last emperor in the west', color: 'gray', note: 'A general named Odoacer deposed the boy emperor Romulus. Life in most of Italy went on much as before.' },
          ev('hagiasophia', { color: 'violet', note: 'Justinian\'s cathedral in Constantinople.' }),
          ev('charlemagne', { color: 'orange', note: 'Crowned by the pope in Rome on Christmas Day. At the same time Baghdad was the largest city west of China (lesson 2).' }),
          ev('schism', { color: 'gray', note: 'Envoys of the pope and the patriarch of Constantinople declared each other cut off from the church: the usual date for the split into Catholic and Orthodox.' }),
          ev('blackdeath', { color: 'gray', note: 'The plague that killed a third or more of Europe\'s people: next lesson.' }),
          ev('constantinople', { color: 'violet', note: 'The Ottoman sultan Mehmed II took the city with the help of giant cannon.' }),
        ],
        alt: 'A timeline from 400 to 1500. Bars: the Eastern Roman Empire until 1453, the Viking age 793 to 1066, the Crusades 1095 to 1291. Events: last emperor in the west 476, Hagia Sophia 537, Charlemagne crowned 800, the church splits 1054, the Black Death 1347, Constantinople falls 1453.',
      },
    },
    {
      id: 'manor',
      type: 'fill',
      title: 'Nine people in ten',
      text: `
        Kings and monks were few. About nine people in ten worked the land.

        This is the month of **March**, begun about 1415 for a French duke: a calendar page showing a great estate, or **manor**, at the start of the farming year. A manor had a **lord**, who held the land and its law court, and **peasants**, who lived on it.

        **Read the picture.**
      `,
      figure: pic('march', {
        alt: 'A medieval calendar painting. In the foreground a peasant in a patched tunic guides a wheeled wooden plough pulled by two oxen. Behind him, in small walled fields, others prune vines, sow seed and watch sheep. On a hill above them all stands a great pale castle with many towers. Over the scene a blue half-circle shows the days of the month and signs of the zodiac.',
        caption: 'March, from the Très Riches Heures of the Duke of Berry, begun about 1412 to 1416',
        creditLabel: 'Painting',
      }),
      template: 'The castle on the hill belongs to the [[*lord|peasants|village priest]]. The fields below are worked by [[*peasants|knights|monks]], who owe him a share of their crops and their labour. The plough is pulled by [[*oxen|horses|a tractor]].',
      explain: `
        The **lord** lived in the castle; the **peasants** worked his fields behind their **oxen**. Many of them were **serfs**, who could not leave the manor without his leave. In return they had strips of land to feed themselves and, in theory, his protection.

        Historians call the wider web of land-for-service deals between kings, lords and knights **feudalism**. They also warn that it is a tidy modern word for arrangements that varied a great deal from place to place.
      `,
    },
    {
      id: 'vikings',
      type: 'interact',
      mode: 'predict',
      title: 'Raiders, traders, settlers',
      text: `
        From 793, raiders from Scandinavia struck monasteries and towns from Ireland to Spain. The same **Vikings** were farmers and traders. They went **east** down the rivers to Kyiv and Constantinople (tens of thousands of silver coins from the caliphs' lands have been dug up in Sweden) and they went **west** across the Atlantic.

        **Tap the most westerly place where a Norse settlement has been found.**
      `,
      widget: {
        type: 'world-map', dots: false, view: [-72, 34, 46, 72], mode: 'pickMarker', dim: false, answer: 'lanse',
        lines: [
          { points: [at('bergen'), [-8, 62], at('iceland'), [-31, 63.3], [-39.5, 60.4], [-43.8, 59.5], at('greenland')], color: 'blue', width: 3, arrow: true, label: 'West: settlers' },
          { points: [at('birka'), [22, 59.5], [28, 60], at('novgorod'), [31, 55], at('kyiv'), [32.5, 46.5], [31, 43.5], at('constantinople')], color: 'red', width: 3, arrow: true, label: 'East: traders' },
        ],
        markers: [
          mk('lanse', { label: 'Newfoundland', labelPos: 'bottom' }), mk('greenland', { label: 'Greenland', labelPos: 'left' }), mk('iceland', { labelPos: 'top' }), mk('dublin', { labelPos: 'bottom' }),
          mk('kyiv', { color: 'gray', labelPos: 'right' }), mk('constantinople', { color: 'gray', labelPos: 'bottom' }),
        ],
        pickable: ['lanse', 'greenland', 'iceland', 'dublin'],
        alt: 'A map of the North Atlantic and Europe. A western route runs from Norway to Iceland and on to southern Greenland; an eastern route runs from Sweden down the rivers through Novgorod and Kyiv to Constantinople. Markers: Newfoundland, Greenland, Iceland, Dublin, Kyiv and Constantinople.',
      },
      check: (s) => s.picked === 'lanse',
      solution: { picked: 'lanse' },
      explain: `
        **Newfoundland**, in today's Canada. At L'Anse aux Meadows archaeologists found Norse houses and a forge. Wood cut there with metal tools has been dated to the year **1021**: 471 years before Columbus. The Norse probably stayed only a few years.

        Iceland was settled from about 870 and Greenland from about 985. Dublin began as a Viking camp. One thing Vikings did not do is wear horned helmets: those were invented by painters and opera designers in the 1800s.
      `,
    },
    {
      id: 'teach-revival',
      type: 'info',
      title: 'After 1000: towns, schools, towers',
      text: `
        After 1000, better ploughs and new farmland roughly **doubled** Europe's population in three centuries. Towns grew. Craftsmen formed guilds, and so did teachers and students: the first **universities**, at Bologna, Paris and Oxford. The scholar of the first screen taught at one.

        Towns also competed to build the tallest church, and met a problem. A stone vault pushes its walls **outward**. Earlier builders had resisted the push with thick walls and small windows, as in the drawing: strong, but low and dark.
      `,
      figure: VAULT_DIAGRAM,
    },
    {
      id: 'sphere',
      type: 'choice',
      title: 'See for yourself',
      text: `
        What did people outside the universities hear about the shape of the Earth? This picture comes from a French book of popular science written about 1246 and copied for more than a century.

        The green ball is the Earth. At the top, two walkers stand back to back, ready to set off in opposite directions. Follow the man in blue round one side and the man in brown round the other.

        **Where does the artist say they will meet?**
      `,
      figure: pic('round-earth', {
        alt: 'A medieval painting inside a circle. In the centre is a green ball. Two men with walking staffs, one dressed in blue and one in brown, are each shown three times around the ball: standing back to back at the top, lying sideways at the left and the right, and upside down beside each other at the bottom.',
        caption: 'From a copy of L\'Image du monde by Gossuin of Metz, made in the 1300s',
        creditLabel: 'Image',
      }),
      options: [
        { text: 'On the far side of the round Earth', correct: true },
        { text: 'Nowhere: each will fall off an edge', why: 'There is no edge in the picture. The walkers go all the way round the ball.' },
        { text: 'Back where they started, having turned round at the edge', why: 'Nobody turns round: each keeps walking the same way and they meet on the opposite side.' },
      ],
      explain: `
        They meet on the far side. A person could walk right round the Earth, the book says, as a fly walks round an apple. Kings were painted holding an orb, a little model of the world, for the same reason.

        The argument in Columbus's day was never about the Earth's shape. It was about its **size**, and (as you will see in *One World*) Columbus was the one who had it wrong.
      `,
    },
    {
      id: 'gothic',
      type: 'choice',
      title: 'Walls of glass',
      text: `
        This is the east end of **Chartres** cathedral (1194 to about 1220). Its builders wanted height and light, and they had a new answer to the push of the vault.

        Look at the arched stone arms at the top left and right. They carry the push away from the wall, out to massive piers standing clear of it.

        **What do they make possible?**
      `,
      figure: pic('chartres', {
        alt: 'The east end of a great grey stone cathedral, seen from close by. Tall pointed windows fill the upper wall. At the top left and top right, arched stone arms reach out from the wall to massive piers standing clear of it. Below are small chapels with steep slate roofs.',
        caption: 'The east end of Chartres cathedral, France',
      }),
      options: [
        { text: 'Thin, very tall walls that are mostly window', correct: true },
        { text: 'A flat roof that people can walk on', why: 'The roof is steeply pitched. The arms are there because of the stone vault underneath it.' },
        { text: 'Defence: soldiers could stand on them', why: 'A cathedral was not a fort. These arms carry weight, not people.' },
        { text: 'Nothing: they are decoration', why: 'Take them away and the upper walls would be pushed outward and fall.' },
      ],
      explain: `
        The arms are **flying buttresses**. With the push carried away through the air, the wall between the piers no longer has to be thick, and can be opened into huge windows of coloured glass. Inside, the vault at Chartres hangs 37 metres above the floor.

        Engineering like this, the mechanical clock (about 1300), reading glasses (about 1290) and the universities are all "medieval".
      `,
    },
    {
      id: 'teach-crusades',
      type: 'info',
      tone: 'sober',          // massacres in the Rhineland and in Jerusalem, the sack of Constantinople
      title: 'The Crusades',
      text: `
        In **1095** the pope called on western knights to march east and take **Jerusalem**, a city holy to Jews, Christians and Muslims, which had been under Muslim rule for more than four centuries.

        Before they left Europe, crusader mobs massacred Jews in the towns of the Rhineland. The armies marched by way of Constantinople, as uneasy allies of the Byzantines, and took Jerusalem in **1099**, killing many of its Muslim and Jewish inhabitants. To the Muslims of Syria and Egypt the invaders from the far west were all "Franks".

        Saladin won the city back in 1187. In 1204 a later crusade turned on Constantinople itself and sacked it. The last crusader fortress fell in 1291.
      `,
      figure: {
        type: 'world-map', dots: false, view: [-6, 26, 44, 54], dim: false,
        markers: [
          mk('rome', { labelPos: 'left' }), mk('constantinople', { labelPos: 'top' }),
          { id: 'jerusalem', at: place('Jerusalem'), label: 'Jerusalem', shape: 'star', color: 'yellow', size: 'l', labelPos: 'right' },
        ],
        labels: [{ at: [8, 50.3], text: 'Rhineland', style: 'area' }, { at: [37.5, 34.6], text: 'Syria', style: 'area' }, { at: [29.5, 27.5], text: 'Egypt', style: 'area' }],
        alt: 'A map of Europe and the eastern Mediterranean. Rome, the city of the pope, is in Italy. The Rhineland is in the north-west. Constantinople stands on the way east, between Europe and Asia. Jerusalem is marked with a star near the eastern shore of the Mediterranean, between Syria and Egypt.',
      },
    },
    {
      id: 'crusades',
      type: 'match',
      tone: 'sober',          // massacres in Jerusalem and the Rhineland, the sack of Constantinople
      title: 'One war, four views',
      text: `
        The same wars looked very different to the people who lived through them.

        **Match each group with how it saw the Crusades.**
      `,
      pairs: [
        ['Most Latin Christians', 'An armed pilgrimage to free the holy places'],
        ['Muslims of Syria and Egypt', 'An invasion by "Franks" from the far west'],
        ['The Byzantines', 'Dangerous allies, who in 1204 sacked Constantinople'],
        ['Jews of the Rhineland', 'Massacres by crusader mobs before they left Europe'],
      ],
      explain: `
        We can still hear some of these voices. **Anna Komnene**, a Byzantine princess and historian, described the crusaders pouring through her father's empire. **Usama ibn Munqidh**, a Syrian nobleman, wrote about his Frankish neighbours with a mixture of horror and curiosity.

        What Europeans brought home was a taste for sugar, spices, silk and cotton, and the merchant cities of Venice and Genoa grew rich supplying it.
      `,
    },
    {
      id: 'teach-two-churches',
      type: 'info',
      title: 'Latin west, Greek east',
      text: `
        By now Europe's Christians lived in two worlds.

        - **The Latin west** followed the **pope in Rome** and held its services in Latin. Charlemagne's capital at Aachen, the university city of Paris and the Gothic cathedrals belong to it.
        - **The Greek east** followed the **patriarch of Constantinople** and held its services in Greek. Its missionaries **Cyril and Methodius** brought writing to the Slavs, and Kyiv took its Christianity from Constantinople in 988.

        In **1054** the two churches broke with each other: **Catholic** west, **Orthodox** east. (Córdoba, in the far south-west, was under Muslim rule: lesson 2.)
      `,
      figure: {
        type: 'world-map', dots: false, view: EUROPE_VIEW, dim: false,
        markers: [
          mk('rome', { color: 'blue', shape: 'square', labelPos: 'bottom' }), mk('aachen', { color: 'blue', labelPos: 'top' }), mk('paris', { color: 'blue', labelPos: 'left' }),
          mk('constantinople', { color: 'violet', shape: 'square', labelPos: 'bottom' }), mk('kyiv', { color: 'violet', labelPos: 'top' }),
          mk('cordoba', { color: 'gray', labelPos: 'top' }),
        ],
        alt: 'A map of Europe with six cities. Three belong to the Latin west: Rome in Italy, Paris in northern France and Aachen near the Rhine. Two belong to the Greek east: Constantinople on the strait between the Black Sea and the Mediterranean, and Kyiv on the River Dnieper to its north. Córdoba, in the south of Spain, is shown in grey.',
        caption: 'Blue: Latin west. Violet: Greek east. Squares: the seats of the pope and the patriarch.',
      },
    },
    {
      id: 'east-west',
      type: 'bucket',
      review: true,
      title: 'Two Christian worlds',
      text: `
        In **1054** the church of Rome and the church of Constantinople broke with each other. The split into **Catholic** west and **Orthodox** east has never been healed.

        **Sort each item to its side.**
      `,
      buckets: ['Latin west', 'Greek east'],
      items: [
        { text: 'The pope in Rome', bucket: 0 },
        { text: 'Church services in Latin', bucket: 0 },
        { text: 'Gothic cathedrals such as Chartres', bucket: 0 },
        { text: 'Charlemagne', bucket: 0 },
        { text: 'The patriarch of Constantinople', bucket: 1 },
        { text: 'Church services in Greek', bucket: 1 },
        { text: 'Hagia Sophia', bucket: 1 },
        { text: 'The missionaries Cyril and Methodius, who brought writing to the Slavs', bucket: 1, why: 'The brothers came from the Byzantine city of Thessaloniki. The Cyrillic alphabet, created by their followers, is named after Cyril.' },
      ],
      explain: `
        The line still shows on the map. Most Christians in Greece, Serbia, Bulgaria, Romania, Ukraine and Russia are Orthodox, and several of those countries write in the **Cyrillic** alphabet, named after a Byzantine missionary. Kyiv took its Christianity from Constantinople in 988.
      `,
    },
    {
      id: 'find-city',
      type: 'interact',
      review: true,
      gen: (rng) => findOnMap(rng, {
        pool: ['constantinople', 'rome', 'aachen', 'paris', 'kyiv', 'cordoba'],
        view: EUROPE_VIEW,
        alt: 'A map of Europe with five unnamed markers.',
      }),
    },
    {
      id: 'teach-timeline',
      type: 'info',
      title: 'A thousand years on one line',
      text: `
        Here is the lesson in time.

        Justinian's Hagia Sophia opens in ${when('hagiasophia')}. In ${when('lindisfarne')} Vikings raid the island monastery of **Lindisfarne**, off the coast of England: the start of the Viking age. Charlemagne is crowned in ${when('charlemagne')}.

        The churches of Rome and Constantinople break apart in ${when('schism')}, and in ${when('crusade')} the pope calls the First Crusade. In ${when('blackdeath')} the Black Death reaches Europe (next lesson). And in ${when('constantinople')} Constantinople falls to the Ottomans: the end of the eastern Roman Empire.
      `,
      figure: {
        type: 'timeline', from: 400, to: 1500, step: 100, mode: 'static', showYears: true,
        events: WHEN_POOL.map((id) => ev(id, { color: id === 'hagiasophia' || id === 'constantinople' ? 'violet' : id === 'lindisfarne' ? 'blue' : id === 'crusade' ? 'red' : id === 'charlemagne' ? 'orange' : 'gray' })),
        alt: `A timeline from 400 to 1500 with seven events: ${WHEN_POOL.map((id) => `${EVENTS[id].short}, ${when(id)}`).join('; ')}.`,
      },
    },
    {
      id: 'when',
      type: 'order',
      review: true,
      gen: (rng) => orderEvents(rng, { pool: WHEN_POOL, n: 4, minGap: 50 }),
    },
    {
      id: 'myths',
      type: 'multi',
      review: true,
      title: 'True or myth?',
      text: 'Which of these statements about Europe between 500 and 1500 are **true**? Choose every one.',
      options: [
        { text: 'Educated people knew that the Earth is a sphere', correct: true },
        { text: 'A Roman empire, ruled from Constantinople, lasted until 1453', correct: true },
        { text: 'Norse sailors reached North America about the year 1000', correct: true },
        { text: 'Vikings went into battle in horned helmets', why: 'No Viking helmet with horns has ever been found. The horns come from paintings and opera costumes of the 1800s.' },
        { text: 'Learning and invention stopped for a thousand years', why: 'Universities, Gothic cathedrals, mechanical clocks and spectacles are all medieval. That is why historians avoid the label "Dark Ages".' },
      ],
      explain: `
        Europe in these centuries was not the centre of the world: Baghdad, Kaifeng and Constantinople outshone anything in the Latin west. But it was not asleep either. By 1300 it had universities, banks, cathedrals and clocks, and it was hungry for the goods and the knowledge of the east.
      `,
    },
  ],
  recap: [
    'The eastern Roman (Byzantine) Empire lasted from Constantinople until 1453; Hagia Sophia (537) is its monument.',
    'In the west, kingdoms replaced the empire. Most people were peasants on manors; monks kept books alive; Charlemagne was crowned emperor in 800.',
    'After 1000 Europe revived: towns, universities and Gothic cathedrals. Vikings reached North America; crusaders marched east.',
    '"Flat Earth" and "Dark Ages" are later myths. In 1054 Christianity split into Catholic west and Orthodox east.',
  ],
  next: 'Next: riders from the grasslands of Mongolia join China to Persia in one empire. Along its roads travel merchants, envoys and the deadliest disease in history.',
};
