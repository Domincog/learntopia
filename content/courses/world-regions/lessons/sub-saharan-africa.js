// Around the World: Places and Cultures · Lesson 3 · Africa South of the Sahara
//
// Driving question: why is it a mistake to talk about "Africa" as if it were one place?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-regions/index.js';
import { FIND, PICKABLE, VIEW, FEATURES, LANDMARKS, findCountry, tapCapital, tapFeature, whichPhoto, inOrder, countriesMap, featuresMap, landmarkFigure, dateLines } from '../helpers.js';

// The countries of FIND.africa and the capitals of CAPITALS below, in the three groups they are taught in.
const WEST = { ids: ['SN', 'ML', 'NE', 'CI', 'GH', 'NG'], capitals: ['Dakar', 'Bamako', 'Niamey', 'Accra', 'Abuja'] };
const MIDDLE = { ids: ['TD', 'CM', 'CD', 'ET', 'SO', 'KE', 'UG', 'TZ'], capitals: ['N\'Djamena', 'Yaoundé', 'Kinshasa', 'Addis Ababa', 'Mogadishu', 'Nairobi', 'Kampala'] };
const SOUTH = { ids: ['ZA', 'NA', 'AO', 'BW', 'ZM', 'ZW', 'MZ', 'MG'], capitals: ['Windhoek', 'Luanda', 'Gaborone', 'Lusaka', 'Harare', 'Maputo', 'Antananarivo'] };
// The eight anchors that the opening map of the belts does not name (it names the Sahel, the rainforest and the Kalahari).
const MORE_ANCHORS = ['the Ethiopian Highlands', 'Lake Victoria', 'Kilimanjaro', 'Victoria Falls', 'the Namib', 'the Cape of Good Hope', 'Madagascar', 'the Niger Delta'];
const EVENTS = ['great-zimbabwe', 'adwa', 'ghana', 'mandela', 'south-sudan'];

const CAPITALS = ['Abuja', 'Accra', 'Dakar', 'Bamako', 'Niamey', 'Addis Ababa', 'Nairobi', 'Kampala', 'Kinshasa', 'Luanda', 'Lusaka', 'Harare', 'Maputo', 'Windhoek', 'Gaborone', 'Antananarivo', 'Mogadishu', 'N\'Djamena', 'Yaoundé'];

export default {
  id: 'sub-saharan-africa',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'How big is Africa?',
      text: `
        This map keeps areas honest. Africa is in orange; the United States,
        China and India are in blue.

        **Which is bigger: Africa, or those three countries put together?**
      `,
      figure: {
        type: 'world-map', static: true,
        regions: [{ ids: 'africa', color: 'orange', label: 'Africa' }, { ids: ['US', 'CN', 'IN'], color: 'blue', label: 'United States, China and India' }],
        alt: 'An equal-area world map with Africa in one colour and the United States, China and India in another',
      },
      shuffle: false,
      options: [
        { text: 'The three countries, easily' },
        { text: 'They are about the same' },
        { text: 'Africa, with room to spare', correct: true },
      ],
      explain: `
        **Africa**: about 30 million km². The three countries together make
        about 23 million, and the space left over would hold most of Europe.
        (In *The World at a Glance* you saw how the Mercator map shrinks
        Africa.)

        A continent that size has 54 countries and about 1.5 billion people.
        This lesson visits the 49 or so that lie south of the Sahara, and
        asks: **why is "Africa" never just one thing?**
      `,
    },
    {
      id: 'belts',
      type: 'info',
      title: 'Belts across a continent',
      text: `
        Africa sits squarely on the equator, so its climates come in belts
        that repeat like a mirror image (you met the reason in
        *The World at a Glance*): **rainforest** on the equator, grassy **savanna** on
        either side, then **desert** near each tropic. The **Sahel** is the
        dry edge where the Sahara fades into savanna.

        The east is different again: a high country of volcanoes, long lakes
        and the **Great Rift Valley**, where the continent is slowly tearing
        apart.

        The savannas hold the greatest herds of wild animals left on Earth.
        More than a million wildebeest cross the Serengeti every year.
      `,
      figure: {
        type: 'world-map', view: VIEW.africa, rivers: ['Niger', 'Congo', 'Zambezi', 'Nile'],
        parallels: ['equator', 'tropics'],
        labels: [
          { at: [10, 23.5], text: 'Sahara', style: 'area' },
          { at: [8, 14.6], text: 'Sahel', style: 'area' },
          { at: [22, -1.2], text: 'Rainforest', style: 'area' },
          { at: [22, -23], text: 'Kalahari', style: 'area' },
          { at: [19, 8.6], text: 'Savanna', style: 'area' },
          { at: [18.5, -11.5], text: 'Savanna', style: 'area' },
          { at: [36.5, 4.5], text: 'Rift Valley', style: 'area' },
        ],
        alt: 'A map of Africa with the equator and both tropics drawn across it. From north to south: the Sahara, the Sahel, the rainforest of the Congo basin on the equator, savanna, and the Kalahari near the southern tropic. The Niger, Congo, Zambezi and Nile rivers are shown, and the Rift Valley in the east.',
      },
    },
    {
      id: 'teach-anchors',
      type: 'info',
      title: 'Eight more places to steer by',
      text: `
        You have the **Sahel**, the **Congo rainforest** and the
        **Kalahari**. Add eight more.

        In the east: the **Ethiopian Highlands**, the high plateau of the
        Horn of Africa; **Lake Victoria**, Africa's largest lake; and
        **Kilimanjaro**, its highest mountain, a snow-capped volcano near the
        equator.

        In the south: **Victoria Falls**, on the Zambezi River; the
        **Namib**, the desert along the Atlantic coast; the
        **Cape of Good Hope**, near the southern tip; and the great island
        of **Madagascar**.

        In the west: the **Niger Delta**, where West Africa's great river
        meets the Gulf of Guinea.
      `,
      figure: featuresMap(FEATURES.africa, { view: 'africa', names: MORE_ANCHORS, pos: { 'Lake Victoria': 'left', Kilimanjaro: 'right', 'the Namib': 'left', 'the Cape of Good Hope': 'bottom', 'the Ethiopian Highlands': 'top' } }),
    },
    {
      id: 'anchors',
      type: 'interact',
      title: 'The lie of the land',
      gen: (rng) => tapFeature(rng, FEATURES.africa, { view: 'africa', minKm: 650 }),
    },
    {
      id: 'teach-west',
      type: 'info',
      title: 'West Africa',
      text: `
        Now the countries. Each has its **capital**, the seat of its
        government, in brackets; a [red star]{.red} shows where the capital
        stands.

        **Senegal** (Dakar) is the westernmost country of the mainland.
        **Mali** (Bamako) and **Niger** (Niamey) are large and landlocked,
        on the edge of the Sahara. On the Gulf of Guinea, from west to east,
        lie **Ivory Coast**, **Ghana** (Accra) and **Nigeria**.

        Nigeria's capital is **Abuja**, in the centre of the country, not
        [Lagos]{.blue}, the far larger city on the coast. And do not mix up
        Nigeria with Niger, the landlocked country directly north of it.
      `,
      figure: countriesMap(WEST.ids, { view: 'westAfrica', capitals: WEST.capitals, cities: ['Lagos'], pos: { Lagos: 'bottom' }, at: { NG: [8.5, 11.2], GH: [-1.2, 8.6], SN: [-14.3, 15.6] } }),
    },
    {
      id: 'teach-middle',
      type: 'info',
      title: 'The centre and the east',
      text: `
        In the heart of the continent is the huge **DR Congo** (Kinshasa),
        with only a sliver of Atlantic coast. Across the Congo River lies
        its small namesake, the **Congo**. **Cameroon** (Yaoundé) sits where
        the west coast turns south, and landlocked **Chad** (N'Djamena)
        reaches north to Libya.

        In the east, **Ethiopia** (Addis Ababa) is a high, landlocked
        plateau, and **Somalia** (Mogadishu) is the tip of the Horn of
        Africa, shaped like a figure 7. South of Ethiopia come **Kenya**
        (Nairobi), landlocked **Uganda** (Kampala) on Lake Victoria, and
        **Tanzania**.
      `,
      figure: countriesMap(MIDDLE.ids, { view: [6, -14, 52, 24], capitals: MIDDLE.capitals, more: ['CG'], at: { CG: [14.2, 1.2], UG: [32.4, 2.4], CM: [12.8, 6.2], CD: [23.5, -1.5] } }),
    },
    {
      id: 'two-congos',
      type: 'interact',
      title: 'Two Congos',
      text: `
        Two countries are named after the Congo River and face each other
        across it. The **Republic of the Congo** has its capital at
        Brazzaville. The **Democratic Republic of the Congo** (DR Congo),
        with its capital at Kinshasa, is about seven times larger.

        **Tap the DR Congo.**
      `,
      widget: {
        type: 'world-map', view: VIEW.centralAfrica, mode: 'pick', pickable: PICKABLE.africa, answer: 'CD', rivers: ['Congo'],
        alt: 'A map of Central Africa without names; the Congo River is drawn',
      },
      check: (s) => {
        if (s.picked === 'CD') return true;
        if (s.picked === 'CG') return 'That is the smaller one, the Republic of the Congo, on the north-west bank. The DR Congo is the giant on the other side of the river.';
        if (s.picked === 'AO') return 'That is Angola, to the south. The DR Congo is the huge country north of it.';
        return s.picked ? `That is ${s.nameThe || s.name}. Look for the largest country in the middle of the continent, wrapped around the great bend of the river.` : 'Tap a country first.';
      },
      solution: { picked: 'CD' },
      hints: ['It is the largest country on this map, and the river\'s great arc lies almost wholly inside it.'],
      explain: `
        Kinshasa and Brazzaville stand on opposite banks of the river, in
        sight of each other: the closest pair of capital cities in the world
        apart from Rome and Vatican City.

        Other names to keep apart: **Niger** and **Nigeria**; **Zambia** and
        **Zimbabwe**; and three separate countries called **Guinea**,
        **Guinea-Bissau** and **Equatorial Guinea**.
      `,
    },
    {
      id: 'teach-south',
      type: 'info',
      title: 'The south',
      text: `
        **South Africa** is the southern tip of the continent. North-west of
        it, on the Atlantic, is **Namibia** (Windhoek), and north again
        **Angola** (Luanda).

        Landlocked **Botswana** (Gaborone) lies directly north of South
        Africa. Beyond it the Zambezi River divides two more landlocked
        countries: **Zambia** (Lusaka) to the north and **Zimbabwe** (Harare)
        to the south.

        **Mozambique** (Maputo) is the long coast on the Indian Ocean. It
        faces the great island of **Madagascar** (Antananarivo).
      `,
      figure: countriesMap(SOUTH.ids, { view: 'southernAfrica', capitals: SOUTH.capitals, at: { BW: [23.2, -21.2], ZW: [29.5, -19.9], ZM: [26.5, -13.6], MZ: [38.3, -14.6] } }),
    },
    {
      id: 'find-country',
      type: 'interact',
      review: true,
      title: 'Find the country',
      gen: (rng) => findCountry(rng, FIND.africa, PICKABLE.africa),
    },
    {
      id: 'languages',
      type: 'info',
      title: 'Two thousand languages',
      text: `
        Africa has about **2,000 languages**: roughly a third of all the
        languages on Earth. Nigeria alone has more than 500. Most Africans
        speak two or three.

        A few are giants. **Swahili** is the shared language of East Africa,
        used by perhaps 100 million people or more, most of them as a second
        language. **Hausa** links the Sahel; **Yoruba** and **Igbo** are
        spoken by tens of millions in southern Nigeria; **Amharic**, in
        Ethiopia, has its own ancient script; **Zulu** and **Xhosa**, in
        South Africa, use click sounds as consonants.
      `,
      figure: {
        type: 'world-map', view: VIEW.subSahara,
        labels: [
          { at: [36, -5.5], text: 'Swahili', style: 'area' },
          { at: [8.5, 12.3], text: 'Hausa', style: 'area' },
          { at: [4.6, 8], text: 'Yoruba', style: 'area' },
          { at: [39.5, 9.5], text: 'Amharic', style: 'area' },
          { at: [28.5, -29], text: 'Zulu, Xhosa', style: 'area' },
          { at: [-14.8, 14.6], text: 'Wolof', style: 'area' },
          { at: [20, -1.5], text: 'Lingala', style: 'area' },
          { at: [46, 5], text: 'Somali', style: 'area' },
        ],
        alt: 'A map of Africa south of the Sahara with the names of eight widely spoken languages written where they are used: Wolof in the far west, Hausa and Yoruba in and around Nigeria, Lingala on the Congo, Amharic and Somali in the Horn, Swahili in East Africa, Zulu and Xhosa in the far south.',
      },
    },
    {
      id: 'kitabu',
      type: 'choice',
      stretch: true,
      title: 'What a word remembers',
      text: `
        Swahili grew up on the East African coast, where African farmers and
        fishers traded for centuries with sailors from Arabia (see
        *Crossroads*).

        Its word for "book" is **kitabu**, from Arabic *kitāb*. But the
        plural is **vitabu**, on the same pattern as *kiti, viti* (chair,
        chairs) and *kisu, visu* (knife, knives). In Arabic the plural is
        *kutub*.

        **What does that tell you about Swahili?**
      `,
      options: [
        { text: 'It borrowed words from Arabic but kept its own African grammar', correct: true },
        { text: 'It is a dialect of Arabic', why: 'Then "books" would be *kutub*. Swahili took the word and fitted it into its own ki-/vi- pattern.' },
        { text: 'It was invented recently so that traders could talk', why: 'Swahili is at least a thousand years old, and is the mother tongue of millions on the coast.' },
        { text: 'It has nothing in common with its neighbours', why: 'The ki-/vi- pairs are typical of the Bantu languages spoken from Cameroon to South Africa.' },
      ],
      explain: `
        Swahili is a **Bantu** language, a member of the huge family spoken
        across central and southern Africa. Trade brought it hundreds of
        Arabic words (even its name comes from the Arabic for "coasts"), but
        it treats them by Bantu rules: *ki-tabu*, *vi-tabu*.

        A language can tell you who met whom.
      `,
    },
    {
      id: 'teach-history',
      type: 'info',
      title: 'Old kingdoms, young states',
      text: [
        'The states on today\'s map are young; the history is not. Five moments to know:',
        '',
        ...dateLines(EVENTS, ['great-zimbabwe']),
        '',
        'Around 1900 nearly all the rest of Africa was ruled from Europe. The map shows who ruled eight of the countries you know. **Britain** held [Nigeria, Ghana and Kenya]{.blue}. **France** held [Senegal and Ivory Coast]{.orange}, and Belgium ran the [DR Congo]{.orange} in French. **Portugal** kept [Angola and Mozambique]{.green} until 1975.',
      ].join('\n'),
      figure: {
        type: 'world-map', view: VIEW.subSahara, dots: false,
        regions: [
          { ids: ['NG', 'GH', 'KE'], color: 'blue', label: 'Ruled by Britain' },
          { ids: ['SN', 'CI', 'CD'], color: 'orange', label: 'Ruled by France, or by Belgium in French' },
          { ids: ['AO', 'MZ'], color: 'green', label: 'Ruled by Portugal' },
        ],
        labels: ['NG', 'KE', 'SN', 'CD', 'AO', 'MZ', { at: [-11.5, 2.8], text: 'Ivory Coast', style: 'name' }, { at: [2.5, 2.8], text: 'Ghana', style: 'name' }],
        alt: 'A map of Africa south of the Sahara with eight countries coloured by the European power that ruled them around 1900: Nigeria, Ghana and Kenya (Britain); Senegal and Ivory Coast (France) and the DR Congo (Belgium, in French); Angola and Mozambique (Portugal).',
      },
    },
    {
      id: 'official',
      type: 'bucket',
      review: true,
      title: 'An echo of empire',
      text: `
        Around 1900 nearly all of Africa was ruled from Europe, inside
        borders that Europeans had drawn (see *The Modern World*). Each
        border bundled together people of many languages, so after
        independence most countries kept the colonial language as a shared
        one for government and school.

        **Which European language is official in each country?**
      `,
      buckets: ['English', 'French', 'Portuguese'],
      items: [
        { text: 'Nigeria', bucket: 0 },
        { text: 'Ghana', bucket: 0 },
        { text: 'Kenya', bucket: 0, why: 'Kenya was a British colony. English and Swahili are both official there.' },
        { text: 'Senegal', bucket: 1 },
        { text: 'Ivory Coast', bucket: 1 },
        { text: 'DR Congo', bucket: 1, why: 'The DR Congo was a Belgian colony, run in French. It is now the most populous country in the world where French is an official language.' },
        { text: 'Angola', bucket: 2 },
        { text: 'Mozambique', bucket: 2 },
      ],
      explain: `
        Britain ruled Nigeria, Ghana and Kenya; France ruled Senegal and
        Ivory Coast, and Belgium the Congo; Portugal held Angola and
        Mozambique until 1975.

        At home, people speak Yoruba or Wolof or Kikongo. The European
        language is the one for parliament, exams and talking to someone
        from the other end of the country.
      `,
    },
    {
      id: 'young',
      type: 'slider',
      mode: 'predict',
      title: 'The youngest place on Earth',
      text: `
        Line up everyone in Europe by age: the person in the middle is about
        **43** years old.

        Now line up everyone in Africa south of the Sahara.
        **How old is the person in the middle?**
      `,
      min: 10, max: 50, step: 1, start: 43, answer: 19, tolerance: 2, unit: 'years',
      explain: `
        About **19**. Six people in every ten are under 25. On present
        trends, by 2050 about one person in four on Earth will be African.

        Young countries move fast. **Nigeria**, with well over 200 million
        people, has a film industry, Nollywood, that by most counts makes more
        films a year than any country but India, and its Afrobeats fills dance floors
        worldwide. In **Kenya**, paying by mobile phone became normal after
        2007, years before it did in most rich countries.
      `,
    },
    {
      id: 'djenne',
      type: 'interact',
      title: 'A building that is rebuilt every year',
      text: `
        This is the **Great Mosque of Djenné**, in Mali: the largest building
        in the world made of mud brick. Each rainy season washes a little of
        it away, so every year the whole town turns out to replaster the
        walls by hand, in a festival that lasts a day.

        One feature of the building is there to make that job possible.
        **Tap it.**
      `,
      widget: photo(MEDIA['djenne-mosque'], {
        alt: `${LANDMARKS['djenne-mosque'].alt}. Four parts are ringed: the beams sticking out of a tower, the pointed top of a tower, the outer wall, and the stairs to the entrance.`,
        hotspots: [
          { id: 'beams', x: 0.19, y: 0.36, r: 0.06, label: 'Palm-wood beams: permanent scaffolding', alt: 'bundles of wooden beams sticking out of a tower' },
          { id: 'spire', x: 0.165, y: 0.19, r: 0.05, label: 'Tower top', alt: 'the pointed top of a tower' },
          { id: 'wall', x: 0.3, y: 0.69, r: 0.06, label: 'Outer wall', alt: 'the smooth outer wall with rounded bumps along its top' },
          { id: 'stairs', x: 0.685, y: 0.675, r: 0.05, label: 'Entrance stairs', alt: 'a flight of stairs leading up to a doorway' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'beams') return true;
        if (s.picked === 'spire') return 'The tower tops are decoration (each is crowned with an ostrich egg). Think about how you would reach the top of a wall this high with a basket of wet mud.';
        if (s.picked === 'wall') return 'That wall keeps the market out of the courtyard. Think about how the plasterers reach the high parts of the building.';
        if (s.picked === 'stairs') return 'The stairs only reach the door. How would you climb the towers themselves?';
        return 'Tap one of the numbered rings.';
      },
      solution: { picked: 'beams' },
      hints: ['To plaster a tall wall you need something to stand on.'],
      explain: `
        The bundles of **palm-wood beams** are scaffolding that is never
        taken down: the plasterers climb them. They also give the building
        its look.

        Djenné was a trading town of the Mali empire, which you met in
        *Crossroads*. A mosque has stood on this spot since the thirteenth
        century; the present one dates from 1907. Islam crossed the Sahara
        with the caravans, and here it was built in the local material and
        style.
      `,
    },
    {
      id: 'teach-landmarks',
      type: 'info',
      title: 'Two wonders nobody built',
      text: `
        You have found both of these on the map. Here is what they look
        like.

        **Kilimanjaro**, in northern Tanzania.
        ${LANDMARKS.kilimanjaro.fact}

        **Victoria Falls**, on the Zambezi between Zambia and Zimbabwe.
        ${LANDMARKS['victoria-falls'].fact}
      `,
      figure: [
        landmarkFigure('kilimanjaro', { aspect: '4:3', fit: 'cover' }),
        landmarkFigure('victoria-falls', { aspect: '4:3', fit: 'cover', focus: [0.5, 0.3] }),
      ],
    },
    {
      id: 'which-landmark',
      type: 'choice',
      review: true,
      gen: (rng) => whichPhoto(rng, ['djenne-mosque', 'kilimanjaro', 'victoria-falls'], ['djenne-mosque', 'kilimanjaro', 'victoria-falls', 'giza-pyramids', 'parthenon', 'hagia-sophia']),
    },
    {
      id: 'faiths',
      type: 'choice',
      title: 'Two roads for two faiths',
      text: `
        Islam reached West Africa **across the Sahara**, with the camel
        caravans, from about the ninth century. Christianity (apart from
        Ethiopia, which has been Christian since the fourth century) came
        mostly **by sea**, with European ships, much later.

        Think of a West African country that runs from the coast to the edge
        of the desert, such as Nigeria or Ghana.
        **Where would you expect to find most of its Muslims?**
      `,
      options: [
        { text: 'In the north, nearest the desert', correct: true },
        { text: 'In the south, on the coast', why: 'The coast is where the ships came in: there you find more Christians.' },
        { text: 'Evenly spread through the country', why: 'Each faith arrived from a different side, and the pattern still shows.' },
      ],
      explain: `
        The **north**. Nigeria is roughly half Muslim and half Christian:
        the north is mostly Muslim, the south mostly Christian. The same
        pattern runs along the whole coast from Ivory Coast to Cameroon.

        Across the continent as a whole, Christianity and Islam are the two
        big faiths, and older African religions live on alongside both.
      `,
    },
    {
      id: 'when',
      type: 'order',
      title: 'What came first?',
      text: 'The states on today\'s map are young; the history is not. **Put these in order, earliest first.**',
      items: inOrder(EVENTS),
      labels: ['Earliest', 'Latest'],
      hints: ['Great Zimbabwe belongs to the Middle Ages. Ethiopia kept its independence in the 1890s, when the rest of the continent was being colonised.', 'Ghana opened the age of independence; South Africa\'s first election open to all came a generation later.'],
      explain: `
        Great Zimbabwe (about 1300), Adwa (1896), Ghana's independence
        (1957), Mandela's election (1994), South Sudan (2011).

        While the stone walls of Great Zimbabwe were rising, Europe was
        building its Gothic cathedrals. And most African states are younger
        than many people's grandparents: seventeen of them became
        independent in the single year 1960.
      `,
    },
    {
      id: 'capitals',
      type: 'interact',
      review: true,
      title: 'Capitals',
      gen: (rng) => tapCapital(rng, CAPITALS, { view: 'subSahara', minKm: 650 }),
    },
  ],
  recap: [
    'Africa is larger than the United States, China and India together. It has 54 countries, about 49 of them south of the Sahara.',
    'Its climates run in belts that mirror each other across the equator: rainforest, savanna, desert, with the Sahel on the Sahara\'s southern edge and the Rift Valley in the east.',
    'About 2,000 languages are spoken here. English, French and Portuguese are official in many countries because of colonial rule; Swahili is the shared language of East Africa.',
    'This is the youngest population on Earth: half the people are under about 19.',
  ],
  next: 'Next: east across the Indian Ocean, on the monsoon wind, to the most crowded corner of the world.',
};
