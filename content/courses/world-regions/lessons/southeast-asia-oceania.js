// Around the World: Places and Cultures · Lesson 6 · Islands, Straits and the Great Ocean
//
// Driving question: how did people make a home of so much water, and why does so much of the
// world's trade pass through it?
import { distanceKm } from '../../../../src/widgets/world-map.js';
import { FIND, PICKABLE, VIEW, FEATURES, LANDMARKS, NOT_THE_BIGGEST, theName, compass, findCountry, tapCity, tapFeature, whichPhoto, landmarkFigure, inOrder, countriesMap, featuresMap } from '../helpers.js';

const MAINLAND = ['MM', 'TH', 'LA', 'KH', 'VN'];
const ISLANDS = ['MY', 'ID', 'PH', 'SG', 'BN', 'TL'];
// The countries of FIND.seaOceania and the cities of CITIES below, in the two groups they are taught in:
// capitals as stars (named in the text), the other great cities as named dots.
const ASIA = { ids: ['MM', 'TH', 'LA', 'KH', 'VN', 'MY', 'ID', 'PH'], capitals: ['Bangkok', 'Hanoi', 'Manila', 'Singapore'], cities: ['Yangon', 'Ho Chi Minh City', 'Jakarta'] };
const OCEANIA = { ids: ['AU', 'PG', 'NZ'], capitals: ['Canberra', 'Port Moresby', 'Wellington'], cities: ['Sydney', 'Melbourne', 'Perth', 'Auckland'] };

const ULURU = [131.04, -25.34];
const ULURU_TOL = 500;                           // km

const TRIANGLE = ['aotearoa', 'hawaii', 'rapa-nui'];   // sorted, as the widget reports its picks

const CITIES = [
  { name: 'Bangkok', clue: 'the capital of Thailand, at the head of its gulf', hint: 'It is in the middle of the mainland, where the coast makes a deep notch.', fact: 'Thais call their capital Krung Thep; its full ceremonial name is one of the longest place names in the world.' },
  { name: 'Hanoi', clue: 'the capital of Vietnam, in the north', hint: 'It is on the Red River, not far from the Chinese border.', fact: NOT_THE_BIGGEST.VN[1] },
  { name: 'Ho Chi Minh City', clue: 'Vietnam\'s largest city, in the south', hint: 'It is beside the Mekong Delta, near the southern end of the country.', fact: 'It was called Saigon until 1976, and many people still use the old name.' },
  { name: 'Manila', clue: 'the capital of the Philippines', hint: 'It is on Luzon, the big northern island of the group.', fact: 'For 250 years Spanish galleons sailed between Manila and Mexico, carrying American silver to Asia (see *One World*).' },
  { name: 'Jakarta', clue: 'Indonesia\'s largest city, on the island of Java', hint: 'It is on the north-west coast of the long, narrow island south of Borneo.', fact: 'Jakarta is slowly sinking as water is pumped from the ground beneath it. That is one reason why Indonesia is building a new capital city, Nusantara, on Borneo.' },
  { name: 'Singapore', clue: 'the city-state at the tip of the Malay Peninsula', hint: 'Follow the long, thin peninsula south until it ends.', fact: 'Singapore is a city, an island and a country all at once, with four official languages: English, Malay, Mandarin and Tamil.' },
  { name: 'Yangon', clue: 'the largest city of Myanmar, near the mouth of the Irrawaddy', hint: 'It is on the western side of the mainland, on the Bay of Bengal.', fact: 'Yangon (Rangoon) was Myanmar\'s capital until 2006, when the government moved to a new city, Naypyidaw.' },
  { name: 'Sydney', clue: 'Australia\'s best-known city, on the south-east coast', hint: 'It is on the Pacific side, about a third of the way up from the south-east corner.', fact: NOT_THE_BIGGEST.AU[1] },
  { name: 'Melbourne', clue: 'the great city of Australia\'s south coast', hint: 'It is at the bottom of the mainland, facing Tasmania.', fact: 'Melbourne and Sydney are almost the same size: about five million people each.' },
  { name: 'Canberra', clue: 'the capital of Australia', hint: 'It is a little way inland, in the south-east.', fact: NOT_THE_BIGGEST.AU[1] },
  { name: 'Perth', clue: 'the only big city on Australia\'s west coast', hint: 'It is in the south-west corner of the continent.', fact: 'Perth is one of the most isolated big cities in the world: the nearest other city of a million people, Adelaide, is more than 2,000 km away.' },
  { name: 'Auckland', clue: 'New Zealand\'s largest city, on the North Island', hint: 'It is on the narrow northern part of the more northerly island.', fact: `About a third of all New Zealanders live in Auckland. ${NOT_THE_BIGGEST.NZ[1]}` },
  { name: 'Wellington', clue: 'the capital of New Zealand', hint: 'It is at the southern tip of the North Island, on the strait between the two islands.', fact: NOT_THE_BIGGEST.NZ[1] },
  { name: 'Port Moresby', clue: 'the capital of Papua New Guinea', hint: 'It is on the south coast of New Guinea, facing Australia.', fact: 'No road links Port Moresby to most of the rest of the country: the mountains are too steep, so people fly.' },
];

export default {
  id: 'southeast-asia-oceania',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'One country, how many islands?',
      text: `
        **Indonesia** is strung along the equator for about 5,000 km: as far
        as from London to the middle of Asia. It is a single country made
        entirely of islands.

        **How many islands do you think it has?**
      `,
      figure: {
        type: 'world-map', view: VIEW.southeastAsia, static: true,
        regions: [{ ids: ['ID'], color: 'orange', label: 'Indonesia' }], legend: false,
        alt: 'A map of Southeast Asia with Indonesia highlighted: a chain of large and small islands running east to west along the equator, from Sumatra to the western half of New Guinea',
      },
      min: 0, max: 20000, step: 500, start: 0, answer: 17000, tolerance: 1500,
      explain: `
        More than **17,000**, about 6,000 of them inhabited. Add the 7,000
        islands of the Philippines and you have some 25,000 islands between
        Asia and Australia, and thousands more scattered across the Pacific
        beyond.

        This lesson asks:
        **how did people make a home of so much water, and why does so much of the world's trade pass through it?**
      `,
    },
    {
      id: 'two-halves',
      type: 'info',
      title: 'Mainland and islands',
      text: `
        **Southeast Asia** has eleven countries, in two halves.

        The [mainland]{.green} is a land of long rivers, above all the
        **Mekong**, whose valleys and deltas grow much of the region's rice.

        The [island]{.orange} half lies on the **Ring of Fire** that you met
        in *The World at a Glance*: Indonesia has more active volcanoes than
        any other country. Volcanic ash makes rich soil, which is why Java,
        one of the most volcanic islands of all, is also one of the most
        crowded places on Earth.
      `,
      figure: {
        type: 'world-map', view: VIEW.southeastAsia, rivers: ['Mekong'],
        regions: [{ ids: MAINLAND, color: 'green', label: 'Mainland Southeast Asia' }, { ids: ISLANDS, color: 'orange', label: 'Island Southeast Asia' }],
        labels: ['TH', 'VN', 'MM', 'ID', 'PH', { id: 'MY', text: 'Malaysia' }],
        alt: 'Southeast Asia in two colours. Mainland: Myanmar, Thailand, Laos, Cambodia and Vietnam, with the Mekong running south through them. Islands: Malaysia, Indonesia, the Philippines, Singapore, Brunei and Timor-Leste.',
      },
    },
    {
      id: 'teach-anchors',
      type: 'info',
      title: 'Ten places to steer by',
      text: `
        Learn the big pieces first; the countries hang on them.

        Among the islands of Southeast Asia: **Sumatra**, the long island at
        the western end of Indonesia; narrow **Java**, just south-east of
        it; huge **Borneo**; **Luzon**, the largest island of the
        Philippines; and **New Guinea**, the second-largest island in the
        world. On the mainland, the **Mekong Delta** is where the great
        river reaches the sea.

        Around Australia: the **Great Barrier Reef** off its north-east
        coast, **Uluru**, a great rock near its centre, and the island of
        **Tasmania** to the south. Further east is the **South Island** of
        New Zealand.
      `,
      figure: featuresMap(FEATURES.seaOceania, { view: 'seaOceania', pos: { Sumatra: 'left', Java: 'bottom', Borneo: 'top', Luzon: 'right', 'New Guinea': 'top', 'the Mekong Delta': 'left', 'the Great Barrier Reef': 'right', Tasmania: 'left', Uluru: 'left', 'the South Island': 'left' } }),
    },
    {
      id: 'anchors',
      type: 'interact',
      title: 'The lie of the land',
      gen: (rng) => tapFeature(rng, FEATURES.seaOceania, { view: 'seaOceania', minKm: 900 }),
    },
    {
      id: 'teach-countries',
      type: 'info',
      title: 'Eight countries of Southeast Asia',
      text: `
        [Red stars]{.red} are capitals; [blue dots]{.blue} are great cities
        that are not.

        On the mainland, **Myanmar** is the westernmost country; its largest
        city is Yangon. **Thailand** (capital Bangkok) is in the middle,
        with a long tail down the Malay Peninsula. **Laos** has no coast.
        **Cambodia** lies on the lower Mekong. **Vietnam** is the long,
        S-shaped coast: its capital, Hanoi, is in the north, and its largest
        city, Ho Chi Minh City, in the south.

        **Malaysia** is in two parts: the end of the Malay Peninsula, with
        the city-state of Singapore at its tip, and the north of Borneo.
        **Indonesia** is the arc of islands along the equator; its largest
        city, Jakarta, is on Java. The **Philippines** (Manila) lie to the
        north-east.
      `,
      figure: countriesMap(ASIA.ids, {
        view: 'southeastAsia', capitals: ASIA.capitals, cities: ASIA.cities,
        pos: { Yangon: 'bottom', 'Ho Chi Minh City': 'right', Jakarta: 'bottom' },
        at: { TH: [101.6, 16.4], VN: [110.5, 15.5], KH: [104.8, 12.9], MY: [113.5, 4.6], PH: [126.8, 12], MM: [95.5, 21.8], LA: [102.6, 20.3] },
      }),
    },
    {
      id: 'teach-oceania',
      type: 'info',
      title: 'Australia and its neighbours',
      text: `
        South-east of Indonesia lies **Australia**, the island continent.
        Its capital is little Canberra (the [star]{.red}), but its big
        cities are on the coast: **Sydney** and **Melbourne** in the
        south-east, and **Perth**, alone in the far west.

        **Papua New Guinea** is the eastern half of the island of New
        Guinea, just north of Australia. Its capital is Port Moresby.

        **New Zealand** is two main islands far to the south-east. Its
        capital, Wellington, is at the southern tip of the North Island; its
        largest city, **Auckland**, is further north.
      `,
      figure: countriesMap(OCEANIA.ids, {
        view: 'australasia', capitals: OCEANIA.capitals, cities: OCEANIA.cities,
        pos: { Sydney: 'right', Melbourne: 'bottom', Perth: 'right', Auckland: 'right' },
        at: { AU: [133, -24.5], NZ: [166.5, -42.5], PG: [146, -3.4] },
      }),
    },
    {
      id: 'find-country',
      type: 'interact',
      review: true,
      title: 'Find the country',
      gen: (rng) => findCountry(rng, FIND.seaOceania, PICKABLE.seaOceania),
    },
    {
      id: 'malacca',
      type: 'interact',
      title: 'The short cut',
      text: `
        Ships sailing between the Indian Ocean and the ports of China, Japan
        and Korea must get past a wall of islands. The shortest way through
        is a strait between the Malay Peninsula and the island of Sumatra.
        Sailors have used it for 2,000 years (you met it in *Crossroads*).

        **Tap the marker on the Strait of Malacca.**
      `,
      widget: {
        type: 'world-map', view: [88, -14, 150, 26], mode: 'pickMarker', markerLabels: 'after', answer: 'malacca',
        markers: [
          { id: 'malacca', at: [100.3, 3.4], label: 'Strait of Malacca' },
          { id: 'sunda', at: [105.8, -6], label: 'Sunda Strait' },
          { id: 'makassar', at: [118.3, -1.5], label: 'Makassar Strait' },
          { id: 'luzon', at: [121.3, 20.3], label: 'Luzon Strait' },
          { id: 'torres', at: [142.2, -10.2], label: 'Torres Strait' },
        ],
        alt: 'A map of Southeast Asia with five unnamed markers, each on a strait between two pieces of land',
      },
      check: (s) => {
        if (s.picked === 'malacca') return true;
        if (s.picked === 'sunda') return 'That is the Sunda Strait, between Sumatra and Java: a real way through, but narrow, shallow and further round. The main road is at the other end of Sumatra.';
        if (s.picked === 'makassar') return 'That is the Makassar Strait, between Borneo and Sulawesi: deep, but a long way round. Look for the gap between the mainland\'s long peninsula and Sumatra.';
        if (s.picked === 'luzon') return 'That is the Luzon Strait, north of the Philippines, on the Pacific side. The short cut from the Indian Ocean is further south-west.';
        if (s.picked === 'torres') return 'That is the Torres Strait, between Australia and New Guinea. Look far to the west, beside the Malay Peninsula.';
        return 'Tap one of the markers.';
      },
      solution: { picked: 'malacca' },
      hints: ['Find the long, thin peninsula that hangs down from the mainland. The strait runs along its western side.'],
      explain: `
        Roughly **a quarter of everything traded by sea** squeezes through
        the Strait of Malacca: about 100,000 ships a year.

        At its southern end stands **Singapore**: a city-state smaller than
        many cities, with one of the busiest ports in the world. The
        British founded it as a trading post in 1819 for exactly this
        reason, and it has been an independent country since 1965.
      `,
    },
    {
      id: 'borobudur',
      type: 'choice',
      title: 'Layers of belief',
      text: `
        This is **Borobudur**, on the island of Java: the largest Buddhist
        monument in the world. Yet almost nine in ten Indonesians today are
        Muslim.

        **What does that tell you about Java's past?**
      `,
      figure: landmarkFigure('borobudur'),
      options: [
        { text: 'Its religion changed: Buddhism came first, and Islam arrived later', correct: true },
        { text: 'It was built by pilgrims from another country, who then went home', why: 'It was built by a Javanese dynasty, with Javanese labour, when Buddhism and Hinduism were the religions of the island\'s courts.' },
        { text: 'Indonesia\'s census must be wrong', why: 'The figures are sound. Buildings outlast the beliefs of the people who built them.' },
        { text: 'Buddhism and Islam are the same religion under two names', why: 'They are quite different faiths, which reached Java about a thousand years apart.' },
      ],
      explain: `
        Borobudur was built about 1,200 years ago, when Buddhism and
        Hinduism were the religions of Java's courts. Islam reached the
        island centuries later. Buildings outlast the beliefs of the people
        who built them.
      `,
    },
    {
      id: 'teach-faiths',
      type: 'info',
      title: 'Three layers of belief',
      text: `
        Southeast Asia sits on the sea road between India and China, and
        each age of trade left a layer.

        - Traders and priests from India brought **Hinduism** and
          **Buddhism** from about 2,000 years ago. The mainland
          ([Myanmar, Thailand, Laos, Cambodia]{.orange}) is Buddhist today.
        - **Islam** came with Indian Ocean merchants from about the
          thirteenth century. [Indonesia, Malaysia and Brunei]{.green} are
          mostly Muslim.
        - **Christianity** came with the Spanish and Portuguese in the
          sixteenth century. The two countries they colonised, the
          [Philippines and Timor-Leste]{.violet}, are mostly Christian.
      `,
      figure: {
        type: 'world-map', view: VIEW.southeastAsia, dots: false,
        regions: [
          { ids: ['MM', 'TH', 'LA', 'KH'], color: 'orange', label: 'Mostly Buddhist' },
          { ids: ['ID', 'MY', 'BN'], color: 'green', label: 'Mostly Muslim' },
          { ids: ['PH', 'TL'], color: 'violet', label: 'Mostly Christian' },
        ],
        labels: ['MM', 'TH', 'KH', 'ID', { at: [126.8, 12], text: 'Philippines', style: 'name' }, { at: [113.5, 4.6], text: 'Malaysia', style: 'name' }, { at: [116.6, 7.6], text: 'Brunei', style: 'name' }, { at: [128.5, -10.6], text: 'Timor-Leste', style: 'name' }],
        alt: 'Southeast Asia coloured by the faith most people follow: Myanmar, Thailand, Laos and Cambodia mostly Buddhist; Indonesia, Malaysia and Brunei mostly Muslim; the Philippines and Timor-Leste mostly Christian.',
      },
    },
    {
      id: 'faith-sort',
      type: 'bucket',
      review: true,
      text: `
        The layers of trade and conquest left Southeast Asia with three
        large faiths.
        **Sort the countries by the religion most of their people follow.**
      `,
      buckets: ['Buddhist', 'Muslim', 'Christian'],
      items: [
        { text: 'Thailand', bucket: 0 },
        { text: 'Myanmar', bucket: 0 },
        { text: 'Cambodia', bucket: 0 },
        { text: 'Indonesia', bucket: 1, why: 'Indonesia is the most populous Muslim-majority country in the world.' },
        { text: 'Malaysia', bucket: 1 },
        { text: 'Brunei', bucket: 1 },
        { text: 'Philippines', bucket: 2, why: 'More than three centuries of Spanish rule left the Philippines mostly Catholic.' },
        { text: 'Timor-Leste', bucket: 2, why: 'Timor-Leste was a Portuguese colony for four centuries and is mostly Catholic.' },
      ],
      explain: `
        The mainland (Thailand, Myanmar, Cambodia, Laos) is **Buddhist**;
        the Malay world of the islands and the peninsula (Indonesia,
        Malaysia, Brunei) is mostly **Muslim**; and the two countries
        colonised by Spain and Portugal, the Philippines and Timor-Leste,
        are mostly **Christian**.
      `,
    },
    {
      id: 'teach-landmarks',
      type: 'info',
      title: 'A temple and a roof of sails',
      text: `
        Two more sights to know beside Borobudur.

        **Angkor Wat**, in Cambodia, belongs to the same Indian layer.
        ${LANDMARKS['angkor-wat'].fact}

        The **Sydney Opera House** stands on the harbour of Australia's
        best-known city. ${LANDMARKS['sydney-opera-house'].fact}
      `,
      figure: [
        landmarkFigure('angkor-wat', { aspect: '4:3', fit: 'cover' }),
        landmarkFigure('sydney-opera-house', { aspect: '4:3', fit: 'cover' }),
      ],
    },
    {
      id: 'which-landmark',
      type: 'choice',
      review: true,
      gen: (rng) => whichPhoto(rng, ['angkor-wat', 'borobudur', 'sydney-opera-house'], ['angkor-wat', 'borobudur', 'sydney-opera-house', 'taj-mahal', 'great-wall', 'chichen-itza']),
    },
    {
      id: 'australia',
      type: 'interact',
      title: 'The island continent',
      text: `
        **Australia** is almost as large as the United States without
        Alaska, but has only about 27 million people, and more than four in
        five of them live within 50 km of the sea. The dry interior is
        nearly empty.

        Near its very centre stands **Uluru**, a rock of red sandstone
        higher than the Eiffel Tower. **Place the pin on Uluru.** Anywhere
        within ${ULURU_TOL} km counts.
      `,
      widget: {
        type: 'world-map', view: [111, -45, 156, -9], mode: 'place', pin: { label: 'Uluru', color: 'red' }, target: ULURU,
        alt: 'A map of Australia without names, with a pin to place',
      },
      check: (s) => {
        if (!s.placed) return 'Move the pin first: drag it, or tap the map.';
        const km = Math.round(distanceKm(s.pin, ULURU));
        if (km <= ULURU_TOL) return true;
        const where = s.country && s.country !== 'AU' ? `in ${theName(s.country)}` : s.country ? 'in Australia' : 'out at sea';
        return `Your pin is ${where}, about ${Math.round(km / 50) * 50} km from Uluru. Move it ${compass(s.pin, ULURU)}, towards the middle of the continent.`;
      },
      solution: { pin: ULURU },
      hints: ['Uluru is almost exactly in the middle of the continent, a little south of centre.'],
      explain: `
        Uluru stands in the heart of the "outback", 350 metres high, and is
        sacred to the Anangu people, its owners. The land was handed back to
        them in 1985, and in 2019, at their request, climbing the rock
        ended.

        Australia's **First Nations** peoples have lived on the continent
        for more than 50,000 years (see *First Worlds*): theirs are the
        oldest continuing cultures on Earth. The big cities, Sydney,
        Melbourne, Brisbane, Perth and Adelaide, are all on the coast.
      `,
    },
    {
      id: 'pacific',
      type: 'interact',
      title: 'The greatest voyages',
      text: `
        East of Australia the Pacific covers a third of the planet. Its
        islands were found and settled by canoe, without compass or chart
        (see *First Worlds*). The last and boldest voyagers, the
        **Polynesians**, reached three far corners of the ocean: one far to
        the north, one far to the east, and one in the cold south-west.

        **Tap the three corners of the "Polynesian triangle".**
      `,
      widget: {
        type: 'world-map', view: 'pacific', mode: 'pickMarkers', max: 3, answer: TRIANGLE,
        markers: [
          { id: 'hawaii', at: [-157.8, 21.3], label: 'Hawaii', labelPos: 'top' },
          { id: 'aotearoa', at: [174.5, -40.5], label: 'Aotearoa New Zealand', labelPos: 'bottom' },
          { id: 'rapa-nui', at: [-109.35, -27.1], label: 'Rapa Nui (Easter Island)', labelPos: 'bottom' },
          { id: 'fiji', at: [178, -17.7], label: 'Fiji', labelPos: 'left' },
          { id: 'tahiti', at: [-149.4, -17.6], label: 'Tahiti' },
          { id: 'guam', at: [144.8, 13.5], label: 'Guam', labelPos: 'top' },
          { id: 'samoa', at: [-172, -13.8], label: 'Samoa', labelPos: 'top' },
        ],
        labels: [
          { at: [158, -6.5], text: 'Melanesia', style: 'area' },
          { at: [160, 8], text: 'Micronesia', style: 'area' },
          { at: [-140, -4], text: 'Polynesia', style: 'area' },
        ],
        alt: 'A map of the Pacific Ocean with seven named island markers: Guam, Fiji, Samoa, Tahiti, Hawaii, Aotearoa New Zealand and Rapa Nui. The regions Melanesia, Micronesia and Polynesia are labelled.',
      },
      check: (s) => {
        if (s.count < 3) return 'Choose three islands.';
        if (s.picked.join() === TRIANGLE.join()) return true;
        const right = s.picked.filter((id) => TRIANGLE.includes(id)).length;
        const inside = s.picked.filter((id) => id === 'tahiti' || id === 'samoa').length;
        if (inside) return `${right} of 3. Tahiti and Samoa are in the middle of Polynesia: the voyagers set out from there. Pick the three furthest points they reached.`;
        return `${right} of 3. Guam and Fiji lie to the west, in Micronesia and Melanesia. The corners are the three outermost points: north, east and south-west.`;
      },
      solution: { picked: TRIANGLE },
      hints: ['One corner is the northernmost marker, one the easternmost, and one the southernmost.'],
      explain: `
        **Hawaii**, **Rapa Nui** and **Aotearoa New Zealand**: thousands of
        kilometres apart, yet their peoples speak closely related languages.
        In New Zealand, reached about 1300 CE, the language of the Māori,
        *te reo Māori*, is an official language today.

        Many Pacific nations are rings of coral only a few metres high. For
        them, a rising sea is the most urgent question there is.
      `,
    },
    {
      id: 'png',
      type: 'choice',
      stretch: true,
      title: 'Eight hundred languages',
      text: `
        **Papua New Guinea** has roughly ten million people and about 840
        languages: more than any other country, and more than all of Europe.
        Its land is a maze of steep ridges, deep valleys, forest and swamp.

        **What is the most likely reason for so many languages?**
      `,
      options: [
        { text: 'Steep mountains, swamps and forests kept small communities apart for thousands of years', correct: true },
        { text: 'Many colonial powers ruled it, and each left a language', why: 'Colonial rule added only a handful: English, and trade languages that grew up around it. The 840 are far older.' },
        { text: 'It has more people than its neighbours', why: 'Indonesia has almost thirty times as many people, and fewer languages.' },
        { text: 'The islanders arrived only recently, from many different places', why: 'People have lived on New Guinea for about 50,000 years: time enough for one language to become hundreds.' },
      ],
      explain: `
        **Isolation.** New Guinea is a maze of knife-edged ridges and deep
        valleys. A village could be within sight of its neighbour and a
        hard day's walk away, and over tens of thousands of years each
        valley's speech drifted apart from the next.

        The same reasoning explains Europe's many languages, on a far
        larger scale: barriers make differences.
      `,
    },
    {
      id: 'when',
      type: 'order',
      title: 'Sixty thousand years of arrivals',
      text: 'You have met all five of these in this lesson. Think back to the First Nations of Australia, the Polynesian voyagers and the Strait of Malacca. **Put these in order, earliest first.**',
      items: inOrder(['first-australians', 'borobudur', 'aotearoa', 'singapore-founded', 'sydney-opera-house']),
      labels: ['Earliest', 'Latest'],
      hints: ['Australia was one of the first places modern humans reached outside Africa and Asia; New Zealand was one of the very last.'],
      explain: `
        Australia (more than 50,000 years ago), Borobudur (about 800 CE),
        Aotearoa New Zealand (about 1300), Singapore (1819), the Sydney
        Opera House (1973).

        The span is astonishing: people reached Australia tens of thousands
        of years before anyone farmed, and New Zealand only a couple of
        centuries before Columbus sailed.
      `,
    },
    {
      id: 'cities',
      type: 'interact',
      review: true,
      title: 'Great cities',
      gen: (rng) => tapCity(rng, CITIES, { view: 'seaOceania', minKm: 700 }),
    },
    {
      id: 'antarctica',
      type: 'choice',
      mode: 'predict',
      title: 'The continent with no countries',
      text: `
        Further south still lies **Antarctica**: almost twice the size of
        Australia, buried under ice, with no countries and no permanent
        inhabitants. In 1959 twelve governments signed the
        **Antarctic Treaty**; more than fifty countries are party to it today.

        **What do you think the treaty says the continent is for?**
      `,
      figure: {
        type: 'world-map', view: 'antarctica', static: true,
        labels: [{ at: [0, -90], text: 'South Pole', style: 'area' }, { id: 'AQ', text: 'Antarctica' }],
        alt: 'A map centred on the South Pole: the round continent of Antarctica alone in the Southern Ocean, with the tip of South America just visible at one edge',
      },
      options: [
        { text: 'Peace and science: no armies, and research open to all', correct: true },
        { text: 'It is divided among seven countries, each governing a slice', why: 'Seven countries do claim slices, but the treaty puts all claims on hold: nobody governs Antarctica.' },
        { text: 'It is a reserve of coal and oil for the future', why: 'Mining there has been banned since the 1990s.' },
        { text: 'It is closed to all human beings', why: 'A few thousand scientists live at research stations, and tourists visit every summer.' },
      ],
      explain: `
        **Peace and science.** The treaty bans military bases and weapons
        tests, freezes all territorial claims, and requires scientists to
        share what they find. A later agreement banned mining.

        It was signed at the height of the Cold War (see
        *The Modern World*), and it has held ever since: a whole continent that
        belongs to no one.
      `,
    },
  ],
  recap: [
    'Southeast Asia has eleven countries: a mainland of great rivers and a world of some 25,000 islands. The Strait of Malacca, with Singapore at its end, is one of the busiest sea lanes on Earth.',
    'Trade left layers of religion: Buddhism on the mainland, Islam in Indonesia and Malaysia, Christianity in the Philippines.',
    'Australia\'s First Nations have been there for more than 50,000 years. Most Australians live on the coast; Uluru stands near the centre.',
    'Polynesian voyagers settled a triangle from Hawaii to Rapa Nui to Aotearoa New Zealand. Antarctica has no countries: a treaty keeps it for peace and science.',
  ],
  next: 'Next: across the Pacific to the Americas, starting with the lands where Spanish and Portuguese are spoken.',
};
