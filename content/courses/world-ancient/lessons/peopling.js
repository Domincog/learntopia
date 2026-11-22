// First Worlds: To 500 CE · Lesson 1 · Out of Africa
//
// Driving question: how did one species from Africa come to live on every continent but one,
// and which lands did it reach last?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-ancient/index.js';
import { NOW, at, mark, markerQuiz, orderEvents } from '../helpers.js';

// Routes are drawn through a few waypoints; they show the general direction, not a known path.
const TO_AUSTRALIA = [[38, 8], [33, 22], [34, 30], [40, 32], [50, 29], [59, 26], [67, 25.5], [78, 21], [90, 23], [98, 17], [102, 6], [107, -6.5], [116, -8.5], [124, -9.5], [131, -12]];
const TO_EUROPE = [[34, 30], [35, 36], [29, 41], [20, 45], [6, 45]];
const TO_AMERICAS = [[98, 17], [108, 32], [120, 46], [137, 58], [160, 64], [-170, 65.5], [-150, 62], [-130, 54], [-122, 44], [-108, 33], [-98, 19], [-82, 8], [-76, -8], [-71, -25], [-73, -41]];

// The land that lay dry at the lowest Ice Age sea level, as rough outlines.
const SUNDA = [[95.3, 5.6], [97.5, 2], [100, -1.5], [102.5, -4.5], [105, -6.6], [106.5, -7.6], [110, -8.3], [114.5, -8.8], [115.7, -8.6], [116.3, -4], [117.8, 0.5], [118.8, 1.5], [118, 4.5], [117, 7.2], [113, 6.2], [109.5, 7.8], [107.5, 9.8], [107.5, 11], [103, 13.2], [100.5, 13.6], [99, 10], [98.3, 8]];
const SAHUL = [[113, -22], [114, -27], [115, -34.5], [118, -35.5], [124, -34], [131, -32], [135, -35.5], [140, -38.5], [144, -41], [145.5, -44], [148.5, -43], [148.5, -40], [150, -37.5], [153.5, -29], [153, -25], [146, -19], [145.5, -15], [143.5, -12], [144, -10], [147.5, -10.5], [151, -10.8], [147, -6], [144, -3.8], [141, -2.5], [137, -1.5], [134, -0.8], [131, -0.8], [131.5, -3], [134, -4.5], [134.5, -6.5], [130, -9.5], [127, -12], [123, -15], [121, -18.5], [116, -20]];

const FIND = [
  { place: 'jebel-irhoud', ask: 'where the oldest known fossils of our species were found', about: 'the bones found at this Moroccan cave are about 300,000 years old.' },
  { place: 'madjedbebe', ask: 'the part of Australia with the oldest known traces of people', about: 'tools at Madjedbebe in the far north are at least 50,000 years old.' },
  { place: 'beringia', ask: 'Beringia, the Ice Age land bridge between Asia and America', about: 'today it lies under the shallow Bering Strait.' },
  { place: 'chauvet', ask: 'the French cave where lions were painted about 36,000 years ago', about: 'Chauvet Cave is in the south of France.' },
  { place: 'sulawesi', ask: 'the Indonesian island with some of the oldest cave paintings known', about: 'hand stencils and painted animals on Sulawesi are more than 40,000 years old.' },
  { place: 'madagascar', ask: 'the island off Africa that was settled by sailors from Borneo', about: 'the language of Madagascar is related to languages of Borneo, 7,000 km away.' },
  { place: 'hawaii', ask: 'Hawaii, the northern corner of the Polynesian triangle', about: 'Polynesians reached Hawaii about 1000 to 1200 CE.' },
  { place: 'rapa-nui', ask: 'Rapa Nui (Easter Island), the eastern corner of the Polynesian triangle', about: 'it lies more than 2,000 km from the nearest inhabited island.' },
  { place: 'aotearoa', ask: 'Aotearoa New Zealand, the last large land that people settled', about: 'the ancestors of the Māori arrived about 1250 to 1300 CE.' },
];

const ORDER_POOL = ['sapiens', 'australia', 'chauvet', 'americas', 'austronesian', 'lapita', 'aotearoa', 'antarctica-seen'];

export default {
  id: 'peopling',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The last place on Earth',
      text: `
        Our species began in Africa. Today there are people on every continent
        and on thousands of islands.

        **Which of these lands do you think people reached last?**
      `,
      options: [
        { text: 'Australia' },
        { text: 'Britain' },
        { text: 'The Americas' },
        { text: 'New Zealand', correct: true },
      ],
      explain: `
        **New Zealand**, and by a huge margin. People were in Australia at least
        50,000 years ago, but the first canoes reached New Zealand only about
        1250 to 1300 CE. By then the pyramids of Egypt were nearly 4,000 years old.

        This lesson follows the journey: how one species from Africa walked,
        paddled and sailed to every continent but one.
      `,
    },
    {
      id: 'origin',
      type: 'info',
      title: 'An African species',
      text: `
        The oldest fossils of ***Homo sapiens***, people with bodies like ours,
        come from Africa. Bones from a cave at Jebel Irhoud in Morocco are about
        **300,000 years old**; others from Omo Kibish in Ethiopia are more than
        230,000.

        The DNA of living people tells the same story: all of us descend from
        populations that lived in Africa. For most of our history, that is the
        only place we were.

        These dates are estimates from fossils and from the chemistry of the
        rock around them. New finds keep revising them.
      `,
      figure: {
        type: 'world-map', view: 'africa',
        markers: [mark('jebel-irhoud', { color: 'red', label: 'Jebel Irhoud, Morocco' }), mark('omo-kibish', { color: 'red' })],
        labels: ['ET'],
        alt: 'A map of Africa. Jebel Irhoud is marked in Morocco in the far north-west, Omo Kibish in the south of Ethiopia in the east.',
      },
    },
    {
      id: 'routes',
      type: 'info',
      title: 'Out of Africa',
      text: `
        Small groups left Africa more than once. The spread that lasted began
        roughly **70,000 to 50,000 years ago**. Nobody set out to cross a
        continent: each generation moved a little further along the coasts and
        river valleys.

        - **Australia** at least 50,000 years ago (some finds suggest 65,000):
          the oldest tools known there lie at Madjedbebe, in the far north
        - **Europe** about 45,000 years ago
        - **the Americas** by at least 15,000 years ago

        Other kinds of human already lived in Europe and Asia, the Neanderthals
        among them. Our ancestors met them and had children with them.
      `,
      figure: {
        type: 'world-map', view: 'world', center: 150, zoom: false,
        lines: [
          { points: TO_AUSTRALIA, color: 'orange', arrow: true, animate: 'draw', label: 'to Australia' },
          { points: TO_EUROPE, color: 'violet', arrow: true, animate: 'draw', label: 'to Europe' },
          { points: TO_AMERICAS, color: 'green', arrow: true, animate: 'draw', label: 'to the Americas' },
        ],
        markers: [mark('madjedbebe', { color: 'orange', labelPos: 'bottom' })],
        alt: 'A world map with the Pacific in the middle. One arrow runs from East Africa through southern Asia to Australia, a second branches off into Europe, and a third runs up through East Asia, across to Alaska and down the Americas to Chile. Madjedbebe is marked on the north coast of Australia, where the first arrow ends.',
        caption: 'General directions, not exact paths.',
      },
    },
    {
      id: 'ice-age',
      type: 'choice',
      title: 'A lower sea',
      text: `
        During the last Ice Age so much water was locked up in ice sheets that
        the sea stood about **120 metres lower** than today. Shallow seabeds
        became dry land: [Sunda]{.orange} joined Java, Sumatra and Borneo to
        Asia, and [Sahul]{.green} joined New Guinea and Tasmania to Australia.

        Look at the gap between them. **How did the first Australians arrive?**
      `,
      figure: {
        type: 'world-map', view: [88, -46, 160, 24], zoom: false,
        areas: [
          { polygon: SUNDA, color: 'orange', label: 'Sunda', labelAt: [108, 3] },
          { polygon: SAHUL, color: 'green', label: 'Sahul', labelAt: [134, -24] },
        ],
        alt: 'South-east Asia and Australia. An orange outline joins the Malay Peninsula, Sumatra, Java and Borneo into one land. A green outline joins Australia, New Guinea and Tasmania into another. Between the two lie islands separated by sea.',
        caption: 'Land that lay dry at the lowest Ice Age sea level (rough outlines).',
      },
      options: [
        { text: 'By boat or raft, across open sea', correct: true },
        { text: 'On foot, over a land bridge', why: 'There never was one. The channels between Sunda and Sahul are deep, and stayed sea even at the lowest water.' },
        { text: 'They were carried there by drifting ice', why: 'These are tropical seas. The ice sheets were far away, near the poles and on high mountains.' },
      ],
      explain: `
        Even at the lowest sea level, deep channels separated Sunda from Sahul.
        Reaching Australia meant several sea crossings, some of them out of sight
        of land, by whole groups of men and women. It is the oldest evidence
        anywhere of people **building boats and planning voyages**.
      `,
    },
    {
      id: 'teach-land-bridges',
      type: 'info',
      title: 'Bridges of land, and seas that stayed',
      text: `
        The lower sea made dry land in other places too.

        - **Beringia** joined Siberia to Alaska: a wide plain, now under the
          Bering Strait.
        - **Britain** was a peninsula of Europe until about 8,000 years ago.

        Deep water stayed water. Madagascar lies behind a deep channel 400 km
        wide, and New Zealand behind some 2,000 km of ocean. Lands like these
        could only be reached by people who built boats.

        On the map: [squares]{.green} for land bridges, [rings]{.blue} for
        lands that stayed cut off.
      `,
      figure: {
        type: 'world-map', view: 'world', center: 150, zoom: false,
        areas: [
          { polygon: SUNDA, color: 'orange', label: 'Sunda', labelOn: 'legend' },
          { polygon: SAHUL, color: 'green', label: 'Sahul', labelOn: 'legend' },
        ],
        markers: [
          mark('beringia', { color: 'green', shape: 'square', labelPos: 'bottom' }),
          { at: [-1.5, 53], label: 'Britain', color: 'green', shape: 'square', labelPos: 'top' },
          mark('madagascar', { color: 'blue', shape: 'ring', labelPos: 'bottom' }),
          mark('aotearoa', { label: 'New Zealand', color: 'blue', shape: 'ring', labelPos: 'bottom' }),
        ],
        alt: 'A world map with the Pacific in the middle. Green squares mark two Ice Age land bridges: Beringia, between Siberia and Alaska, and Britain, joined to Europe. The outlines of Sunda and Sahul are shaded in south-east Asia and Australia. Blue rings mark two lands that stayed cut off by deep sea: Madagascar, off the east coast of Africa, and New Zealand, south-east of Australia.',
      },
    },
    {
      id: 'deep-time',
      type: 'interact',
      title: 'How long ago?',
      text: `
        This line shows **years ago**, and every step to the left is ten times
        further back.

        **Drag each card to its place.** This far back all dates are estimates,
        so anywhere in the right stretch counts.
      `,
      widget: {
        type: 'timeline', scale: 'log-ago', fromAgo: 500000, toAgo: 1000, now: NOW,
        events: [
          { id: 'sapiens', ago: 300000, label: 'Oldest Homo sapiens fossils', short: 'Oldest fossils', color: 'gray' },
          { id: 'farming', ago: 11500, label: 'First farming', short: 'Farming', color: 'gray' },
          { id: 'pyramid', ago: 4600, label: 'Great Pyramid', short: 'Pyramid', color: 'gray' },
        ],
        place: [
          { id: 'australia', label: 'People reach Australia', color: 'orange' },
          { id: 'americas', label: 'People reach the Americas', color: 'green' },
        ],
        alt: 'A timeline of years ago on a scale where each step is ten times longer: the oldest Homo sapiens fossils at 300,000 years, the first farming at 11,500 and the Great Pyramid at 4,600.',
      },
      check: (s) => {
        if (!s.complete) return 'Place both cards on the line.';
        const aus = NOW - s.placed.australia;
        const ame = NOW - s.placed.americas;
        if (aus < 40000) return 'Australia was reached much earlier than that: tens of thousands of years before farming.';
        if (aus > 75000) return 'Too early for Australia. Our species had barely begun to leave Africa then.';
        if (ame > 30000) return 'The Americas were reached well after Australia. Move that card closer to the present.';
        if (ame < 12000) return 'People were in the Americas before farming began anywhere. Move that card further back.';
        return true;
      },
      solution: { placed: { australia: NOW - 55000, americas: NOW - 18000 } },
      hints: [
        'Australia comes first by a long way: at least 50,000 years ago.',
        'The Americas: at least 15,000 years ago, which is still before the first farms.',
      ],
      explain: `
        Australia: **at least 50,000 years ago**. The Americas: **at least 15,000**,
        when hunters crossed from Siberia by way of Beringia, the land bridge that
        is now the Bering Strait. Footprints in New Mexico have been dated to
        about 22,000 years; how early the first arrivals were is still debated.

        Either way, people lived on six continents before anyone planted a field.
      `,
    },
    {
      id: 'teach-evidence',
      type: 'info',
      title: 'How do we know?',
      text: `
        Nobody wrote anything down this far back. What we have is
        **evidence**: bones, stone tools, DNA, and pictures on rock.

        A picture can answer two questions, if you look closely:

        - **How was it made?** See where the colour is, and where it is not.
        - **What had its maker seen?** Nobody draws an animal well without
          having watched it.

        Two famous sets of pictures are marked on the map: hands on the
        island of Sulawesi, in Indonesia, and animals in Chauvet Cave, in
        the south of France. You will read both.
      `,
      figure: {
        type: 'world-map', view: [-20, -25, 150, 62], zoom: false, dots: false,
        markers: [
          mark('chauvet', { color: 'red', labelPos: 'top' }),
          mark('sulawesi', { color: 'red', labelPos: 'top' }),
        ],
        alt: 'A map of Europe, Africa and Asia with two markers: Chauvet Cave in the south of France, and the Sulawesi caves on an island of Indonesia, between Borneo and New Guinea.',
      },
    },
    {
      id: 'hands',
      type: 'choice',
      title: 'A message from the Ice Age',
      text: `
        These hands are on a cave wall on the island of Sulawesi, in Indonesia.
        Look at them closely.

        **How were they made?**
      `,
      figure: photo(MEDIA['sulawesi-hands'], {
        alt: 'A cave wall stained dark red-brown. In the stain are five or six pale outlines of human hands with spread fingers, some with part of the forearm. Each hand is the bare colour of the rock.',
        caption: 'Pettakere Cave, Sulawesi, Indonesia',
      }),
      options: [
        { text: 'By blowing paint around a hand held against the rock', correct: true },
        { text: 'By dipping a hand in paint and pressing it on the wall', why: 'That would leave a painted hand on bare rock. Here it is the other way round: the hand is bare and the rock around it is red.' },
        { text: 'By carving the outline into the stone', why: 'Nothing is cut into the rock. The shapes are made by colour alone.' },
      ],
      explain: `
        Someone pressed a hand to the wall and blew red ochre over it, leaving a
        **stencil**. Hand stencils on Sulawesi and the islands near it are more
        than 40,000 years old, and one, reported in 2026, has been dated to at
        least 67,000 years: the oldest cave art dated so far.

        The same idea turns up in caves in Spain, France, Argentina and
        Australia. Wherever people went, they made pictures.
      `,
    },
    {
      id: 'lions',
      type: 'choice',
      text: `
        These animals were drawn in charcoal about **36,000 years ago** in
        Chauvet Cave, in the south of France.

        **What can a historian safely conclude from this picture?**
      `,
      figure: photo(MEDIA['chauvet-lions'], {
        alt: 'A group of big cats without manes, drawn in black on a rock wall. Their heads are in profile, all facing left, with shaded muzzles and alert eyes, overlapping as if in a pack.',
        caption: 'Lions in Chauvet Cave, France (museum replica)',
      }),
      options: [
        { text: 'Lions lived in Ice Age Europe, and the artist had watched them closely', correct: true },
        { text: 'The artist had travelled to Africa and back', why: 'There is a simpler explanation. A kind of lion, now extinct, lived in Europe during the Ice Age.' },
        { text: 'Early people could only make rough, childlike drawings', why: 'Look again: the shading, the overlapping heads, the sense of movement. This is a skilled artist, not a beginner.' },
      ],
      explain: `
        Cave lions, mammoths and woolly rhinos all lived in Ice Age Europe, and
        all are painted at Chauvet. The artist shows the animals as a hunter
        knows them: the set of the ears, the stare of a pack that has seen prey.

        People 36,000 years ago had the same minds as people today. What they
        lacked was not skill but everything that had not been invented yet.
      `,
    },
    {
      id: 'pacific-story',
      type: 'info',
      title: 'The last great migration',
      text: `
        One third of the planet was still empty of people: the open Pacific.

        Between 5,000 and 4,000 years ago, farming people who spoke
        **Austronesian** languages began sailing south from Taiwan. Their
        descendants, makers of *Lapita* pottery, went on by way of the islands
        off New Guinea and reached Tonga and Samoa by about 800 BCE. Then came
        a pause of well over a thousand years.

        Around 1000 CE **Polynesian** voyagers set out again, in double-hulled
        canoes carrying families, pigs, chickens and plants. Within three
        centuries they had found nearly every island in an ocean larger than all
        the continents together.
      `,
      figure: {
        type: 'timeline', from: -3000, to: 1500, step: 500,
        events: [
          { id: 'tw', year: -2500, label: 'South from Taiwan', short: 'Taiwan', color: 'teal', note: 'Austronesian-speaking farmers sail from Taiwan to the Philippines, about 4,000 to 5,000 years ago.' },
          { id: 'lapita', year: -850, label: 'Tonga and Samoa', short: 'Tonga', color: 'teal', note: 'Lapita voyagers reach Tonga and Samoa, about 2,800 years ago.' },
          { id: 'east', year: 1050, label: 'Tahiti', short: 'Tahiti', color: 'orange', note: 'The islands around Tahiti are settled, about 1000 CE.' },
          { id: 'nz', year: 1280, label: 'New Zealand', short: 'NZ', color: 'orange', note: 'Aotearoa New Zealand is settled, about 1250 to 1300 CE.' },
        ],
        spans: [
          { id: 'pause', from: -800, to: 950, label: 'The long pause', color: 'gray', note: 'For well over a thousand years nobody settled further east than Samoa. Nobody knows quite why.' },
          { id: 'rome', from: -27, to: 476, label: 'Roman Empire', color: 'red', row: 1, note: 'For comparison: the whole Roman Empire, from its first emperor to its end in the west, fits inside the pause.' },
        ],
        alt: 'A timeline from 3000 BCE to 1500 CE: sailing south from Taiwan about 2500 BCE, Tonga and Samoa about 850 BCE, a long pause until about 950 CE, then Tahiti about 1050 CE and New Zealand about 1280 CE. The Roman Empire is shown for comparison, inside the pause.',
      },
    },
    {
      id: 'trace-pacific',
      type: 'interact',
      title: 'Island by island',
      text: `
        The voyagers pushed **east**, one island group at a time, against the
        usual winds, so that a canoe that found nothing could turn and run for
        home. The coldest, most southerly land came last of all.

        **Tap the five places in the order they were settled**, starting from Taiwan.
      `,
      widget: {
        type: 'world-map', view: [100, -52, -135, 34], mode: 'trace', zoom: false,
        answer: ['taiwan', 'new-britain', 'samoa', 'tahiti', 'aotearoa'],
        markers: [
          mark('taiwan', { labelPos: 'top' }),
          mark('new-britain', { labelPos: 'bottom' }),
          mark('samoa', { labelPos: 'top' }),
          mark('tahiti', { labelPos: 'top' }),
          mark('aotearoa', { label: 'New Zealand', labelPos: 'left' }),
        ],
        alt: 'The western and central Pacific with five markers: Taiwan off the coast of China, the Bismarck Archipelago north-east of New Guinea, Samoa in the central Pacific, Tahiti further east, and New Zealand far to the south.',
      },
      check: (s) => {
        if (s.count < 5) return 'Visit all five places.';
        if (s.route[0] !== 'taiwan') return 'Start where the story starts: in Taiwan, off the coast of Asia.';
        if (s.route[4] !== 'aotearoa') return 'The cold land far to the south was the last one found.';
        return s.route.join() === 'taiwan,new-britain,samoa,tahiti,aotearoa' || 'Between Taiwan and New Zealand the route runs steadily east. Which marker is the next one east each time?';
      },
      solution: { route: ['taiwan', 'new-britain', 'samoa', 'tahiti', 'aotearoa'] },
      hints: ['After Taiwan, go to the islands just north-east of New Guinea.', 'Then east to Samoa, east again to Tahiti, and last of all south-west to New Zealand.'],
      explain: `
        Taiwan, the islands off New Guinea, Samoa, Tahiti, and finally Aotearoa
        New Zealand: the last large land on Earth to be settled, about 1250 to
        1300 CE.

        Antarctica alone was never settled. No one even saw it until 1820.
      `,
    },
    {
      id: 'teach-triangle',
      type: 'info',
      title: 'The Polynesian triangle',
      text: `
        From the islands around Tahiti, canoes went on in three directions:

        - north to **Hawaii**, about 1000 to 1200 CE
        - east to **Rapa Nui** (Easter Island), about 1200 CE, more than
          2,000 km from the nearest inhabited island
        - south-west to **Aotearoa New Zealand**, about 1250 to 1300 CE

        Those three corners make the **Polynesian triangle**.

        Other Austronesian sailors had gone the opposite way: from Borneo
        across the Indian Ocean to **Madagascar**, off Africa, probably
        between 500 and 1000 CE.
      `,
      figure: {
        type: 'world-map', view: 'world', center: 150, zoom: false,
        lines: [
          { points: [at('hawaii'), at('rapa-nui'), at('aotearoa'), at('hawaii')], color: 'teal', width: 3, label: 'Polynesian triangle', labelOn: 'legend' },
          { points: [at('borneo'), [95, -8], [70, -14], at('madagascar')], color: 'orange', arrow: true, label: 'Borneo to Madagascar', labelOn: 'legend' },
        ],
        markers: [
          mark('hawaii', { color: 'teal', labelPos: 'top' }),
          mark('rapa-nui', { color: 'teal', labelPos: 'bottom' }),
          mark('aotearoa', { label: 'New Zealand', color: 'teal', labelPos: 'left' }),
          mark('tahiti', { color: 'gray', labelPos: 'left' }),
          mark('madagascar', { color: 'orange', labelPos: 'bottom' }),
          mark('borneo', { color: 'orange', labelPos: 'top' }),
        ],
        alt: 'A world map with the Pacific in the middle. A triangle joins Hawaii in the north, Rapa Nui in the east and New Zealand in the south-west, with Tahiti inside it. An arrow runs west from Borneo across the Indian Ocean to Madagascar, off the coast of Africa.',
      },
    },
    {
      id: 'find-places',
      type: 'interact',
      review: true,
      gen: (rng) => markerQuiz(rng, FIND, {
        view: 'world', minKm: 2500, extra: { center: 150 },
        alt: 'A world map with the Pacific in the middle, without names. Four lettered markers stand in different parts of the world.',
      }),
    },
    {
      id: 'wayfinding',
      type: 'multi',
      title: 'Finding an island',
      text: `
        *Hōkūle‘a* is a voyaging canoe built in Hawaii on the old pattern. In 1976
        the navigator **Mau Piailug**, from Micronesia, guided her more than
        4,000 km to Tahiti with no instruments at all.

        **Which of these could a Polynesian navigator use?**
      `,
      figure: photo(MEDIA.hokulea, {
        alt: 'A sailing canoe near a city shore, seen from the side: two long narrow hulls joined by a deck with people standing on it, and two masts carrying red sails shaped like upturned claws.',
        caption: 'Hōkūle‘a under sail off Honolulu, 2009',
      }),
      options: [
        { text: 'Where known stars rise and set on the horizon', correct: true },
        { text: 'The direction of the long ocean swells', correct: true },
        { text: 'Birds flying home to land at dusk', correct: true },
        { text: 'A magnetic compass', why: 'The compass came into use at sea in China about a thousand years ago, and Pacific navigators never needed it.' },
        { text: 'Charts marked with latitude and longitude', why: 'Nothing was written down. The star paths and island positions were memorised, often as chants.' },
      ],
      explain: `
        Stars, swells and birds, and also clouds that pile up over land and the
        green glow a lagoon throws on them. All of it was held in memory and
        taught from navigator to pupil.

        When Mau Piailug brought *Hōkūle‘a* to Tahiti, he settled an old argument:
        the Pacific was settled by skill, not by canoes drifting off course.
        Voyaging canoes sail again today from Hawaii to New Zealand.
      `,
    },
    {
      id: 'dry-or-sea',
      type: 'bucket',
      review: true,
      text: `
        During the last Ice Age the sea stood about 120 metres lower than today.
        **Sort these journeys:** was there dry land all the way, or open sea to cross?
      `,
      buckets: ['Dry land all the way', 'Open sea to cross'],
      items: [
        { text: 'Siberia to Alaska', bucket: 0, why: 'Beringia, now under the Bering Strait, was a wide plain.' },
        { text: 'Mainland Asia to Java', bucket: 0, why: 'Java was part of Sunda, joined to Asia.' },
        { text: 'France to Britain', bucket: 0, why: 'Britain was a peninsula of Europe until about 8,000 years ago.' },
        { text: 'Australia to Tasmania', bucket: 0, why: 'Tasmania and New Guinea were joined to Australia as Sahul.' },
        { text: 'Java to Australia', bucket: 1, why: 'Deep channels always separated Sunda from Sahul.' },
        { text: 'Africa to Madagascar', bucket: 1, why: 'The channel is deep and 400 km wide. Madagascar was settled by boat, and late.' },
        { text: 'Australia to New Zealand', bucket: 1, why: 'About 2,000 km of deep ocean: New Zealand was reached by Polynesian canoes.' },
        { text: 'Tahiti to Hawaii', bucket: 1, why: 'Some 4,000 km of open Pacific.' },
      ],
      explain: `
        Lower seas turned shallow straits into land: **Beringia**, **Sunda**,
        **Sahul**, and the plain that joined Britain to Europe. Deep water stayed
        water. Australia, Madagascar and the Pacific islands could only be reached
        by people who built boats.
      `,
    },
    {
      id: 'order-arrivals',
      type: 'order',
      review: true,
      text: '**Put these in order**, from the earliest to the latest.',
      gen: (rng) => orderEvents(rng, ORDER_POOL, { n: 4, gap: 300, ratio: 1.4, fallback: ['sapiens', 'australia', 'americas', 'aotearoa'] }),
    },
    {
      id: 'echo-five',
      type: 'choice',
      review: true,
      title: 'An echo in five words',
      text: `
        The word for **five** is *lima* in Malay (Indonesia and Malaysia) and in
        Hawaiian, *rima* in Māori (New Zealand) and on Rapa Nui, and *dimy* in
        Malagasy, the language of Madagascar.

        **What is the best explanation?**
      `,
      figure: {
        type: 'world-map', view: 'world', center: 150, zoom: false,
        markers: [
          { at: at('madagascar'), label: 'dimy', color: 'orange', labelPos: 'bottom' },
          { at: at('borneo'), label: 'lima', color: 'orange', labelPos: 'top' },
          { at: at('hawaii'), label: 'lima', color: 'orange', labelPos: 'top' },
          { at: at('aotearoa'), label: 'rima', color: 'orange', labelPos: 'left' },
          { at: at('rapa-nui'), label: 'rima', color: 'orange', labelPos: 'top' },
        ],
        alt: 'A world map with the Pacific in the middle. The word for five is marked at five places: dimy on Madagascar, lima on Borneo and on Hawaii, rima on New Zealand and on Rapa Nui.',
      },
      options: [
        { text: 'These peoples descend from the same seafaring ancestors', correct: true },
        { text: 'It is a coincidence', why: 'One matching word could be chance. Here hundreds of basic words match, across half the globe.' },
        { text: 'All human languages have similar words for numbers', why: 'Compare *five* (English), *wǔ* (Chinese), *khamsa* (Arabic) and *tano* (Swahili): unrelated languages have quite different number words.' },
        { text: 'Modern trade spread the word in the last century or two', why: 'These islands were almost out of touch with each other when Europeans first wrote the words down.' },
      ],
      explain: `
        All of these are **Austronesian** languages, carried by canoe from one
        homeland in Taiwan. Sailors from Borneo settled Madagascar more than a
        thousand years ago, which is why an island off Africa speaks a language
        from Asia.

        The family stretches more than halfway round the world, from Madagascar
        to Rapa Nui: the widest spread of any language family before 1500.
      `,
    },
  ],
  recap: [
    'Our species arose in **Africa** by about 300,000 years ago and spread across the world from roughly 70,000 to 50,000 years ago.',
    'People reached **Australia** by boat at least 50,000 years ago, Europe about 45,000 and the **Americas** by at least 15,000. Ice Age sea levels made land of Beringia, Sunda and Sahul.',
    'The Pacific came last: **Polynesian** navigators, steering by stars, swells and birds, reached Hawaii, Rapa Nui and finally New Zealand about 1250 to 1300 CE.',
    'The evidence is fossils, DNA, tools, **cave art** and language. This far back every date is an estimate, and new finds keep changing them.',
  ],
  next: 'Next: for almost all of that journey nobody farmed. Then, in several far-apart places, people who had never met each other began to plant.',
};
