// Around the World: Places and Cultures · Lesson 8 · The United States and Canada
//
// Driving question: who lived here first, who came later, and how did those arrivals make the
// North America of today?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-regions/index.js';
import { FIND, PICKABLE, VIEW, FEATURES, LANDMARKS, NOT_THE_BIGGEST, cityMarker, cityAt, findCountry, placeCity, tapFeature, whichPhoto, inOrder, featuresMap, featureLines, citiesMap, landmarkFigure } from '../helpers.js';

// The six anchors that the opening map does not name (it names the Rockies, the Great Plains, the Appalachians, the Great Lakes and Hudson Bay).
const MORE_ANCHORS = ['Greenland', 'Alaska', 'the Arctic Archipelago', 'Florida', 'the Mississippi Delta', 'the Grand Canyon'];
// The cities of CITIES below that the map of the two capitals has not already named (it names New York, Washington and Toronto).
const TEN_MORE = ['Vancouver', 'Seattle', 'San Francisco', 'Los Angeles', 'Denver', 'Chicago', 'Houston', 'New Orleans', 'Miami', 'Montréal'];

const TOL = 350;                                 // km: how close a pin must be to its city

const CITIES = [
  { name: 'New York', clue: 'the largest city of the United States, on the Atlantic coast', hint: 'It is on the north-east coast, at the mouth of the Hudson River.', fact: NOT_THE_BIGGEST.US[1] },
  { name: 'Los Angeles', clue: 'the largest city of the west coast, home of Hollywood', hint: 'It is on the Pacific, in the far south-west, not far from Mexico.', fact: 'Its name is Spanish: it was founded in 1781, when California belonged to Spain.' },
  { name: 'Chicago', clue: 'the great city of the Midwest, on Lake Michigan', hint: 'It stands at the southern end of one of the Great Lakes.', fact: 'Chicago grew as the place where the railways of the Great Plains met the shipping of the Great Lakes.' },
  { name: 'Toronto', clue: 'the largest city of Canada, on Lake Ontario', hint: 'It is on the north shore of the easternmost Great Lake.', fact: 'Almost half the people of Toronto were born outside Canada.' },
  { name: 'Washington, D.C.', clue: 'the capital of the United States', hint: 'It is near the Atlantic coast, a few hundred kilometres south-west of New York.', fact: NOT_THE_BIGGEST.US[1] },
  { name: 'Vancouver', clue: 'Canada\'s great Pacific port', hint: 'It is on the west coast, just north of the border with the United States.', fact: 'Vancouver is Canada\'s gateway to Asia, and its mildest big city in winter.' },
  { name: 'Montréal', clue: 'the largest city of French-speaking Canada, on the St Lawrence River', hint: 'It is in the east, on the river that drains the Great Lakes to the Atlantic.', fact: 'Montréal is one of the largest French-speaking cities in the world.' },
  { name: 'Houston', clue: 'the largest city of Texas, near the Gulf of Mexico', hint: 'It is close to the coast of the Gulf, in the south.', fact: 'Houston is the centre of the American oil industry, and home to mission control for NASA\'s crewed space flights.' },
  { name: 'Miami', clue: 'the great city at the southern tip of Florida', hint: 'Find the peninsula that points towards Cuba, and go to its end.', fact: 'Most people in Miami speak Spanish at home: it is the meeting point of the United States and Latin America.' },
  { name: 'San Francisco', clue: 'the city of the Golden Gate, in northern California', hint: 'It is on the Pacific coast, about a third of the way from Mexico up to Canada.', fact: 'San Francisco boomed after gold was found in California in 1848. The Golden Gate Bridge has crossed the entrance to its bay since 1937.' },
  { name: 'Seattle', clue: 'the largest city of the north-west corner of the United States', hint: 'It is on the Pacific side, just south of the Canadian border.', fact: 'Seattle is named after Si\'ahl, a leader of the Duwamish and Suquamish peoples.' },
  { name: 'New Orleans', clue: 'the old French port near the mouth of the Mississippi', hint: 'It is on the Gulf of Mexico, where the great river meets the sea.', fact: 'New Orleans was founded by the French in 1718, and is the birthplace of jazz.' },
  { name: 'Denver', clue: 'the "mile-high city" where the Great Plains meet the Rocky Mountains', hint: 'It is deep inland, a little west of the centre of the United States.', fact: 'Denver stands almost exactly one mile, about 1,600 metres, above sea level.' },
];

const MUSIC = [
  { id: 'new-orleans', name: 'New Orleans', why: null },
  { id: 'chicago', name: 'Chicago', why: 'That is Chicago. Jazz and blues travelled north to it later, with the African Americans who left the South in the twentieth century.' },
  { id: 'new-york', name: 'New York', why: 'That is New York, where hip-hop was born in the 1970s. Jazz began two generations earlier, far to the south.' },
  { id: 'nashville', name: 'Nashville', why: 'That is Nashville, the home of country music. Jazz began at the mouth of the Mississippi.' },
  { id: 'detroit', name: 'Detroit', why: 'That is Detroit, the home of the Motown sound of the 1960s. Jazz began at the mouth of the Mississippi.' },
  { id: 'los-angeles', name: 'Los Angeles', why: 'That is Los Angeles, the home of Hollywood. Jazz began on the other side of the country, at the mouth of the Mississippi.' },
];

const NAMED_PLACES = [
  ['Los Angeles', cityAt('Los Angeles'), 'bottom'], ['San Francisco', cityAt('San Francisco'), 'right'], ['Santa Fe', [-105.94, 35.69], 'right'],
  ['Montréal', cityAt('Montréal'), 'left'], ['Detroit', cityAt('Detroit'), 'left'], ['New Orleans', cityAt('New Orleans'), 'right'],
  ['New York', cityAt('New York'), 'right'], ['Boston', [-71.07, 42.33], 'right'], ['Vancouver', cityAt('Vancouver'), 'right'],
];

export default {
  id: 'north-america',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A very large, very empty country',
      text: `
        **Canada** is the second-largest country on Earth, and stretches
        4,600 km from its southern border to the Arctic Ocean.

        **What share of Canadians do you think live within 160 km of the border with the United States?**
      `,
      figure: {
        type: 'world-map', view: [-141, 41, -52, 75], static: true,
        regions: [{ ids: ['CA'], color: 'red', tone: 'soft' }], legend: false,
        markers: [cityMarker('Vancouver', { labelPos: 'top' }), cityMarker('Calgary', { labelPos: 'top' }), cityMarker('Toronto', { labelPos: 'top' }), cityMarker('Montréal', { labelPos: 'top' })],
        alt: 'A map of Canada, reaching from the United States border far up into the Arctic. Four of its largest cities, Vancouver, Calgary, Toronto and Montréal, all lie in a thin strip along the southern edge.',
      },
      min: 0, max: 100, step: 5, start: 0, answer: 75, tolerance: 5, unit: '%',
      explain: `
        About **three-quarters**. Most of Canada is too cold to farm, so its
        people live along its warmest edge.

        The United States and Canada share the longest border in the world,
        and a history with the same three chapters. This lesson asks:
        **who lived here first, who came later, and how did those arrivals make the North America of today?**
      `,
    },
    {
      id: 'land',
      type: 'info',
      title: 'Mountains on the sides, plains in the middle',
      text: `
        North America is built like a shallow bowl. The young, high
        **Rocky Mountains** run down the west; the old, worn **Appalachians**
        down the east; and between them lie the **Great Plains**, drained
        by the **Mississippi** and its branches.

        North of the plains is the **Canadian Shield**, a vast slab of
        ancient rock scraped bare by Ice Age glaciers, which left behind
        the **Great Lakes**: about a fifth of all the fresh surface water
        on Earth.

        Because no mountains run east to west, Arctic air can sweep south
        and tropical air north. The continent's weather is famously violent.
      `,
      figure: {
        type: 'world-map', view: [-135, 22, -55, 66], rivers: ['Mississippi', 'Missouri'],
        labels: [
          { at: [-110.5, 45], text: 'Rocky Mts', style: 'area' },
          { at: [-100, 40.5], text: 'Great Plains', style: 'area' },
          { at: [-82, 54], text: 'Canadian Shield', style: 'area' },
          { at: [-80.5, 36.8], text: 'Appalachians', style: 'area' },
          { at: [-80.5, 48.8], text: 'Great Lakes', style: 'water' },
          { at: [-90, 25], text: 'Gulf of Mexico', style: 'water' },
          { at: [-85, 60], text: 'Hudson Bay', style: 'water' },
        ],
        alt: 'North America: the Rocky Mountains down the west, the Appalachians down the east, the Great Plains between them drained by the Mississippi and Missouri to the Gulf of Mexico, the Great Lakes on the border, and the Canadian Shield around Hudson Bay.',
      },
    },
    {
      id: 'teach-anchors',
      type: 'info',
      title: 'Four neighbours, six more places',
      text: [
        'Three big countries share the continent: **Canada** in the north, the **United States** between Canada and Mexico, and **Mexico** in the south, narrowing towards Central America. To the north-east lies **Greenland**, the largest island in the world, under a sheet of ice: a self-governing territory of Denmark.',
        '',
        'Five more places to know:',
        '',
        ...featureLines(FEATURES.northAmerica, MORE_ANCHORS.filter((name) => name !== 'Greenland')),
      ].join('\n'),
      figure: featuresMap(FEATURES.northAmerica, {
        view: 'northAmerica', names: MORE_ANCHORS,
        pos: { Greenland: 'bottom', Alaska: 'bottom', 'the Arctic Archipelago': 'left', Florida: 'right', 'the Mississippi Delta': 'bottom', 'the Grand Canyon': 'left' },
        extra: { labels: [{ at: [-100, 39.5], text: 'United States', style: 'name' }, { at: [-104, 56], text: 'Canada', style: 'name' }, { at: [-102.5, 24], text: 'Mexico', style: 'name' }] },
      }),
    },
    {
      id: 'anchors',
      type: 'interact',
      title: 'The lie of the land',
      gen: (rng) => tapFeature(rng, FEATURES.northAmerica, { view: 'northAmerica', minKm: 900 }),
    },
    {
      id: 'find-country',
      type: 'interact',
      title: 'Four neighbours',
      gen: (rng) => findCountry(rng, FIND.northAmerica, PICKABLE.northAmerica),
    },
    {
      id: 'teach-federations',
      type: 'info',
      title: 'Two federations',
      text: `
        Both countries are **federations**: unions of states or provinces
        that each run many of their own affairs. And in both, the capital
        (the [star]{.red}) is not the biggest city.

        The **United States** declared its independence in 1776. It has
        **50 states**: 48 in one block, plus Alaska and Hawaii. Its capital,
        **Washington, D.C.**, is a district that belongs to no state.

        **Canada** became a self-governing confederation in 1867. It has
        **10 provinces** and three northern territories. The newest
        territory, Nunavut, was created in 1999 as a homeland governed
        largely by Inuit. The capital, **Ottawa**, sits on the border
        between Ontario and Québec.
      `,
      figure: citiesMap(['Washington, D.C.', 'New York', 'Ottawa', 'Toronto'], {
        view: 'usCanada', pos: { 'Washington, D.C.': 'bottom', 'New York': 'right', Ottawa: 'top', Toronto: 'left' },
        extra: { labels: [{ at: [-100, 39.5], text: 'United States', style: 'name' }, { at: [-100, 55], text: 'Canada', style: 'name' }] },
      }),
    },
    {
      id: 'states',
      type: 'fill',
      title: 'Count them',
      text: 'Complete the summary of the two federations.',
      template: `
        The United States has [[50]] states. Its capital is [[New York|*Washington, D.C.|Los Angeles|Chicago]].

        Canada has [[10]] provinces and three territories. Its capital is [[Toronto|Montréal|*Ottawa|Vancouver]].
      `,
      hints: ['There is one star on the United States flag for each state.', 'Canada has ten provinces. Its capital lies on the river that separates English-speaking Ontario from French-speaking Québec.'],
      explain: `
        **Fifty states**, counting Alaska and Hawaii, with the capital at
        **Washington, D.C.** **Ten provinces** and three territories, with the capital at
        **Ottawa**.

        Neither capital is its country's largest city: those are New York
        and Toronto. In Nunavut, Inuit are most of the people.
      `,
    },
    {
      id: 'teach-first-peoples',
      type: 'info',
      title: 'Who named the land?',
      text: `
        People have lived in North America for at least 15,000 years, in
        hundreds of nations. About 1100, [**Cahokia**]{.orange}, a city of
        great earth mounds beside the Mississippi, was the largest city
        north of Mexico.

        Their descendants are here today, and their languages named the
        land:

        - *Mississippi* is "great river" in Ojibwe.
        - *Chicago* comes from a Miami-Illinois word for a wild onion.
        - *Ottawa* is the name of an Algonquian-speaking people.
        - *Dakota* means "allies" in the language of the Dakota people.
        - *Canada* itself comes from *kanata*, an Iroquoian word for
          "village".
      `,
      figure: {
        type: 'world-map', view: VIEW.usCanada, dots: false, rivers: ['Mississippi'],
        markers: [
          { at: [-90.06, 38.66], label: 'Cahokia', color: 'orange', shape: 'square', labelPos: 'left' },
          { at: cityAt('Chicago'), label: 'Chicago', color: 'blue', size: 's', labelPos: 'right' },
          { at: cityAt('Ottawa'), label: 'Ottawa', color: 'blue', size: 's', labelPos: 'top' },
        ],
        labels: [{ at: [-100.5, 44.3], text: 'Dakota', style: 'area' }, { at: [-100, 56], text: 'Canada', style: 'area' }],
        alt: 'A map of the United States and southern Canada. The Mississippi River runs from north to south down the middle; Cahokia is marked beside it, about half-way along. Chicago, Ottawa, Dakota and Canada, all names from Indigenous languages, are written where they lie.',
      },
    },
    {
      id: 'first-peoples',
      type: 'multi',
      review: true,
      title: 'The first names on the map',
      text: `
        People have lived in North America for at least 15,000 years (see
        *First Worlds*), in hundreds of nations. They are here today: the
        United States recognises more than 570 Native American nations, and
        in Canada the First Nations, Inuit and Métis are about one person
        in twenty.

        Their languages named the land.
        **Which of these place names come from Indigenous languages?**
      `,
      options: [
        { text: 'Mississippi', correct: true },
        { text: 'Chicago', correct: true },
        { text: 'Ottawa', correct: true },
        { text: 'Dakota', correct: true },
        { text: 'Los Angeles', why: 'That is Spanish: "the angels".' },
        { text: 'Vermont', why: 'That is French: "green mountain".' },
      ],
      explain: `
        *Mississippi* is "great river" in Ojibwe. *Chicago* comes from a
        Miami-Illinois word for a wild onion that grew there. *Ottawa* is
        the name of an Algonquian-speaking people. *Dakota* means "allies"
        in the language of the people who bear that name.

        About half of the fifty states have names from Indigenous
        languages. So does a whole country: *Canada* comes from *kanata*,
        an Iroquoian word for "village".
      `,
    },
    {
      id: 'empires',
      type: 'bucket',
      review: true,
      title: 'Three empires on one map',
      text: `
        From about 1500, three European powers planted colonies here:
        **Spain** came up from Mexico into the south and west, **France**
        founded Québec in 1608 and travelled the St Lawrence, the Great
        Lakes and the Mississippi, and
        **England** settled the Atlantic coast and later sent its navy to
        the Pacific.

        **Sort these places by the language their names come from.** Their
        positions on the map are a clue.
      `,
      figure: {
        type: 'world-map', view: VIEW.usCanada, static: true, rivers: ['Mississippi'],
        markers: NAMED_PLACES.map(([label, at, labelPos]) => ({ at, label, labelPos })),
        alt: 'A map of the United States and southern Canada with nine named places: Los Angeles, San Francisco and Santa Fe in the south-west; Montréal, Detroit and New Orleans along the St Lawrence, the Great Lakes and the Mississippi; New York and Boston on the Atlantic coast; Vancouver on the Pacific.',
      },
      buckets: ['Spanish', 'French', 'English'],
      items: [
        { text: 'Los Angeles', bucket: 0 },
        { text: 'San Francisco', bucket: 0 },
        { text: 'Santa Fe', bucket: 0 },
        { text: 'Montréal', bucket: 1, why: '"Mont Royal": the royal mountain, the hill in the middle of the city.' },
        { text: 'Detroit', bucket: 1, why: 'From the French *détroit*, a strait: the city stands on the narrow water between two of the Great Lakes.' },
        { text: 'New Orleans', bucket: 1, why: 'Named in honour of a French prince, the Duke of Orléans.' },
        { text: 'New York', bucket: 2 },
        { text: 'Boston', bucket: 2, why: 'Named by English settlers after the town of Boston in England.' },
        { text: 'Vancouver', bucket: 2, why: 'Named after George Vancouver, an English naval officer who charted this coast in the 1790s.' },
      ],
      explain: `
        Spanish names in the south-west, French names along the rivers and
        lakes, English names on the coasts.

        France lost its mainland colonies in 1763, but French is still the
        language of **Québec**. The south-west belonged to Mexico until
        1848, and Spanish never left it: today more than 40 million people
        in the United States speak Spanish at home.
      `,
    },
    {
      id: 'arrivals',
      type: 'info',
      title: 'Arrivals, forced and free',
      text: `
        After the colonists came many others, and not all by choice.

        About **400,000 Africans** were carried to North America in chains
        (see *One World*). By 1860 nearly four million people were enslaved
        in the United States. Their descendants shaped much of what the
        world thinks of as American culture.

        From the nineteenth century, **tens of millions of immigrants**
        arrived: first from Europe, then from Asia, Latin America and
        everywhere else. Today these are two of the most mixed societies on
        Earth.
      `,
      figure: {
        type: 'bars', yMax: 30, yStep: 10, unit: '%', yLabel: 'people born in another country',
        data: [
          { label: 'World as a whole', value: 4, color: 'gray' },
          { label: 'United States', value: 15, color: 'blue' },
          { label: 'Canada', value: 23, color: 'red' },
        ],
        alt: 'A bar chart of the share of people who were born in another country: about 4 percent for the world as a whole, about 15 percent in the United States and about 23 percent in Canada.',
        caption: 'Approximate shares in the early 2020s',
      },
    },
    {
      id: 'music',
      type: 'interact',
      title: 'Where the music came from',
      text: `
        **Jazz** was born around 1900 in a port city near the mouth of the
        Mississippi, where African American, Caribbean, French and Spanish
        traditions met in the same streets.

        **Tap that city.**
      `,
      widget: {
        type: 'world-map', view: VIEW.usCanada, mode: 'pickMarker', markerLabels: 'after', answer: 'new-orleans', rivers: ['Mississippi'],
        markers: MUSIC.map((m) => ({ id: m.id, at: cityAt(m.name), label: m.name })),
        alt: 'A map of the United States and southern Canada with six unnamed city markers; the Mississippi River is drawn',
      },
      check: (s) => {
        if (s.picked === 'new-orleans') return true;
        const hit = MUSIC.find((m) => m.id === s.picked);
        return hit ? hit.why : 'Tap one of the markers.';
      },
      solution: { picked: 'new-orleans' },
      hints: ['Follow the Mississippi down to the Gulf of Mexico.'],
      explain: `
        **New Orleans.** Jazz, and the **blues** of the Mississippi Delta
        just upriver, were made by African Americans, and from them grew
        rock and roll, soul and, in New York in the 1970s, **hip-hop**:
        music now heard in every country.

        The sports travelled too. **Basketball** was invented in 1891 by
        James Naismith, a Canadian teaching in Massachusetts. **Lacrosse**
        is far older: it was first played by the Haudenosaunee and other
        Indigenous nations.
      `,
    },
    {
      id: 'liberty',
      type: 'interact',
      title: 'Read the statue',
      text: `
        The **Statue of Liberty** has stood in New York Harbor since 1886.
        It was a gift from the people of France, and for millions of
        immigrants arriving by ship it was their first sight of America.

        The statue carries a date: 4 July 1776, the day the United States
        declared its independence.
        **Tap the part where the date is written.**
      `,
      widget: photo(MEDIA['statue-of-liberty'], {
        alt: `${LANDMARKS['statue-of-liberty'].alt}. Four parts are ringed: the torch, the crown, the tablet and the pedestal.`,
        hotspots: [
          { id: 'torch', x: 0.38, y: 0.13, r: 0.07, label: 'Torch: "Liberty Enlightening the World"', alt: 'the torch held up in the right hand' },
          { id: 'crown', x: 0.49, y: 0.29, r: 0.07, label: 'Crown with seven rays', alt: 'the crown of spikes on the head' },
          { id: 'tablet', x: 0.625, y: 0.455, r: 0.07, label: 'Tablet: July 4, 1776, in Roman numerals', alt: 'the flat tablet held in the left arm' },
          { id: 'pedestal', x: 0.48, y: 0.9, r: 0.07, label: 'Pedestal', alt: 'the stone pedestal under the statue' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'tablet') return true;
        if (s.picked === 'torch') return 'The torch gives the statue its full name, "Liberty Enlightening the World". The date is on something she carries in her other arm.';
        if (s.picked === 'crown') return 'The crown has seven rays and no writing. Look at what she holds against her side.';
        if (s.picked === 'pedestal') return 'The pedestal carries a poem inside, but not this date. Look at what the figure holds in her left arm.';
        return 'Tap one of the numbered rings.';
      },
      solution: { picked: 'tablet' },
      hints: ['One hand holds the torch. What is in the other?'],
      explain: `
        The **tablet** in her left arm reads JULY IV MDCCLXXVI: 4 July 1776
        in Roman numerals.

        A statue made in Paris, holding the date of a revolution, greeting
        ships full of newcomers: it is a fair summary of the country behind
        it. (You met the revolutions of 1776 and 1789 in
        *The Modern World*.)
      `,
    },
    {
      id: 'teach-landmarks',
      type: 'info',
      title: 'A canyon and a tower',
      text: `
        Two more sights to know beside the Statue of Liberty.

        The **Grand Canyon** is in Arizona, in the dry south-west of the
        United States. ${LANDMARKS['grand-canyon'].fact}

        The **CN Tower** rises over Toronto, Canada's largest city.
        ${LANDMARKS['toronto-skyline'].fact}
      `,
      figure: [
        landmarkFigure('grand-canyon', { aspect: '3:4', fit: 'cover', focus: [0.5, 0.62] }),
        landmarkFigure('toronto-skyline', { aspect: '3:4', fit: 'cover', focus: [0.5, 0.45] }),
      ],
    },
    {
      id: 'which-landmark',
      type: 'choice',
      review: true,
      gen: (rng) => whichPhoto(rng, ['statue-of-liberty', 'grand-canyon', 'toronto-skyline'], ['statue-of-liberty', 'grand-canyon', 'toronto-skyline', 'eiffel-tower', 'christ-the-redeemer', 'victoria-falls']),
    },
    {
      id: 'when',
      type: 'order',
      title: 'Nine centuries',
      text: `
        You have met all five of these in this lesson: the mound city on
        the Mississippi, the French on the St Lawrence, the birthdays of
        two countries, and a new territory in the Arctic.

        **Put these in order, earliest first.**
      `,
      items: inOrder(['cahokia', 'quebec', 'us-independence', 'canada-confederation', 'nunavut']),
      labels: ['Earliest', 'Latest'],
      hints: ['One of these happened centuries before Columbus crossed the Atlantic.', 'The United States became independent by revolution; Canada took a slower road, about ninety years later.'],
      explain: `
        Cahokia (about 1100), Québec (1608), the Declaration of
        Independence (1776), Canadian Confederation (1867), Nunavut (1999).

        Cahokia, a city of great earth mounds beside the Mississippi, was
        at its height when Notre-Dame in Paris had not yet been begun. The
        history of this continent did not start in 1492.
      `,
    },
    {
      id: 'teach-cities',
      type: 'info',
      title: 'Thirteen great cities',
      text: `
        You know **New York**, **Washington** and **Toronto**. Ten more:

        - On the Pacific, from north to south: **Vancouver**, Canada's
          great port; **Seattle**, just across the border;
          **San Francisco**, in northern California; and **Los Angeles**,
          not far from Mexico.
        - Inland: **Denver**, where the Great Plains meet the Rockies, and
          **Chicago**, on Lake Michigan.
        - In the south: **Houston**, in Texas, near the Gulf of Mexico;
          **New Orleans**, near the mouth of the Mississippi; and **Miami**,
          at the tip of Florida.
        - In the east: **Montréal**, the largest city of French-speaking
          Canada, on the St Lawrence River.
      `,
      figure: citiesMap(TEN_MORE, {
        view: [-134, 23, -60, 62],
        pos: { Vancouver: 'top', Seattle: 'right', 'San Francisco': 'top', 'Los Angeles': 'right', Denver: 'right', Chicago: 'right', Houston: 'left', 'New Orleans': 'top', Miami: 'left', 'Montréal': 'top' },
      }),
    },
    {
      id: 'cities',
      type: 'interact',
      review: true,
      title: 'Great cities',
      gen: (rng) => placeCity(rng, CITIES, { view: 'usCanada', tolKm: TOL }),
    },
    {
      id: 'look-back',
      type: 'reflect',
      title: 'Your map of the world',
      text: `
        You have now been right round the world. Think of a place that was
        in the news lately, far from where you live.

        **In your own words: where is it, what do people speak there, and what is one thing in its geography or its history that helps to explain it?**
      `,
      model: `
        There is no single right answer. A good one names the place and
        puts it on the map ("in the Sahel, on the southern edge of the
        Sahara"), says something about its people ("mostly Muslim; they
        speak Hausa, and French in school"), and gives a reason that
        reaches back ("the borders were drawn by France around 1900, and
        the rains have always been unreliable").

        Place, people, and a "because": that is the habit this path was
        built to give you.
      `,
    },
  ],
  recap: [
    'North America is a bowl: Rockies in the west, Appalachians in the east, the Great Plains and the Mississippi between, the Canadian Shield and the Great Lakes to the north.',
    'The United States has 50 states (capital Washington, D.C.); Canada has 10 provinces and 3 territories (capital Ottawa). Three-quarters of Canadians live near the southern border.',
    'Indigenous nations were here first and are here still; half the states, and Canada itself, carry Indigenous names.',
    'Spanish, French and English names mark three empires. Later arrivals, forced and free, made two of the most mixed societies on Earth.',
  ],
  next: 'That completes the World path. You began with a blank map in *The World at a Glance*, followed people out of Africa in *First Worlds*, along the trade routes of *Crossroads*, across the oceans in *One World* and through the upheavals of *The Modern World*, and you have now walked round the planet as it is today. Every place you can find has a story you can tell: keep both alive with your reviews.',
};
