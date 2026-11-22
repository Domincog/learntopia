// Around the World: Places and Cultures · Lesson 1 · Europe: The Crowded Peninsula
//
// Driving question: why does one small corner of Eurasia hold nearly fifty countries?
import { FIND, PICKABLE, VIEW, FEATURES, findCountry, tapCapital, tapFeature, whichPhoto, landmarkFigure, inOrder, countriesMap, featuresMap, dateLines } from '../helpers.js';

// The countries of FIND.europe and the capitals of CAPITALS below, in the four groups they are taught in.
const WEST = { ids: ['IS', 'IE', 'GB', 'PT', 'ES', 'FR', 'DE', 'IT'], capitals: ['Reykjavík', 'Dublin', 'London', 'Lisbon', 'Madrid', 'Paris', 'Berlin', 'Rome'] };
const CENTRE = { ids: ['NL', 'BE', 'CH', 'AT', 'CZ', 'SK', 'HU', 'SI', 'PL'], capitals: ['Amsterdam', 'Brussels', 'Vienna', 'Prague', 'Budapest', 'Warsaw'] };
const NORTH = { ids: ['DK', 'NO', 'SE', 'FI', 'EE', 'LV', 'LT'], capitals: ['Copenhagen', 'Oslo', 'Stockholm', 'Helsinki', 'Moscow'] };
const SOUTH_EAST = { ids: ['HR', 'BA', 'AL', 'MK', 'GR', 'BG', 'RO'], capitals: ['Athens', 'Sofia', 'Bucharest', 'Kyiv'] };
const BUILDINGS = ['parthenon', 'colosseum', 'notre-dame', 'st-basils', 'eiffel-tower'];

const EU = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];

const CAPITALS = ['London', 'Paris', 'Berlin', 'Madrid', 'Rome', 'Lisbon', 'Dublin', 'Warsaw', 'Athens', 'Stockholm', 'Oslo', 'Helsinki', 'Vienna', 'Budapest', 'Bucharest', 'Kyiv', 'Moscow', 'Reykjavík', 'Sofia', 'Copenhagen', 'Amsterdam', 'Brussels', 'Prague'];

export default {
  id: 'europe',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A small place, cut into many pieces',
      text: `
        Europe is the second-smallest continent. All of it together is about
        the size of Canada, or of the United States.

        Canada is one country. **How many countries share Europe?** Slide to
        your guess.
      `,
      figure: {
        type: 'world-map', view: VIEW.europe, static: true,
        regions: [{ ids: 'europe', color: 'green', tone: 'soft' }], legend: false,
        alt: 'A map of Europe with every country outlined: a dense patchwork of several dozen countries, most of them small',
      },
      min: 5, max: 80, step: 1, start: 5, answer: 47, tolerance: 3,
      explain: `
        Between **44 and about 50**, depending on who is counting. Do you
        count Turkey, which is mostly in Asia? Kosovo, which about half the
        world's governments recognise as a country?

        Either way, that is a quarter of all the countries on Earth, on about
        7% of its land. This lesson asks
        **why Europe is cut into so many pieces**, and what holds the pieces together.
      `,
    },
    {
      id: 'peninsula',
      type: 'info',
      title: 'A peninsula made of peninsulas',
      text: `
        In *The World at a Glance* you saw that Europe and Asia are one
        landmass. Europe is its ragged western end: seas reach deep into it,
        and mountain ranges such as the **Alps** fence off one pocket of land
        from the next. Each pocket had room to grow its own language and its
        own state.

        Rivers tie the pockets together. The **Danube** touches ten countries
        on its way to the Black Sea, more than any other river on Earth.

        The eastern edge is only an agreement: the dashed line along the Ural
        Mountains and the Caucasus. Most of Russia's land lies beyond it, in
        Asia; most of its people live on this side.
      `,
      figure: {
        type: 'world-map', view: [-25, 34, 66, 72], rivers: ['Danube', 'Rhine'],
        labels: [
          { at: [17.5, 35], text: 'Mediterranean Sea', style: 'water' },
          { at: [19.8, 57.4], text: 'Baltic Sea', style: 'water' },
          { at: [3, 56.4], text: 'North Sea', style: 'water' },
          { at: [34.5, 43.2], text: 'Black Sea', style: 'water' },
          { at: [10, 46.7], text: 'Alps', style: 'area' },
          { at: [64, 59], text: 'Urals', style: 'area' },
          { at: [44, 44.6], text: 'Caucasus', style: 'area' },
        ],
        lines: [
          { points: [[66, 68.3], [60.5, 65], [59.3, 61], [59.5, 56], [58.8, 52.5], [58.5, 51.1], [54.5, 51], [51.4, 51.2], [51.9, 47.1]], curve: 'straight', dashed: true, color: 'red' },
          { points: [[49.2, 41.2], [46, 42.2], [43, 43.2], [40, 43.9], [37.5, 44.9]], curve: 'straight', dashed: true, color: 'red' },
        ],
        alt: 'Europe from the Atlantic to the Ural Mountains. The Mediterranean, Baltic, North and Black seas reach deep into the land; the Alps, the Rhine and the Danube are marked; a dashed line along the Urals and the Caucasus marks the conventional eastern edge.',
      },
    },
    {
      id: 'teach-anchors',
      type: 'info',
      title: 'Nine places to steer by',
      text: `
        Learn the outline first; the countries hang on it.

        A **peninsula** is land with sea on three sides. Four big ones
        make up most of Europe's coast: the square **Iberian** Peninsula in
        the south-west, the **Italian** boot, the mountainous **Balkan**
        Peninsula in the south-east, and the long **Scandinavian** arm in the
        far north. The **British Isles** lie off the north-west coast.

        Three seas reach in between them: the **North Sea**, the almost
        closed **Baltic**, and the **Black Sea**. The **Alps** arc across the
        top of Italy.
      `,
      figure: featuresMap(FEATURES.europe, { view: 'europe' }),
    },
    {
      id: 'anchors',
      type: 'interact',
      title: 'Seas and peninsulas',
      gen: (rng) => tapFeature(rng, FEATURES.europe, { view: 'europe', minKm: 450 }),
    },
    {
      id: 'teach-west',
      type: 'info',
      title: 'The Atlantic west',
      text: `
        Now the countries, a few at a time. Each has its **capital**, the
        seat of its government, in brackets; a [red star]{.red} shows where
        the capital stands.

        **Iceland** (Reykjavík) lies far out in the north. **Ireland**
        (Dublin) and the **United Kingdom** (London) are the two countries of
        the British Isles. **Portugal** (Lisbon) and **Spain** (Madrid) share
        the Iberian Peninsula. **France** (Paris) has a coast on the Atlantic
        and another on the Mediterranean, **Germany** (Berlin) fills the
        centre, and **Italy** (Rome) is the boot.
      `,
      figure: countriesMap(WEST.ids, { view: [-25, 35, 22, 67.5], capitals: WEST.capitals, at: { IS: [-18.5, 62.4], IE: [-12.5, 53.3], ES: [-4, 38.2], PT: [-13, 40.5] } }),
    },
    {
      id: 'teach-centre',
      type: 'info',
      title: 'The crowded centre',
      text: `
        Between France, Germany and Italy the countries get small.

        The **Netherlands** (Amsterdam) and **Belgium** (Brussels) sit on the
        North Sea. **Switzerland** and **Austria** (Vienna) are landlocked in
        the Alps. East of Germany comes **Poland** (Warsaw), on the Baltic.
        South of Poland are **Czechia** (Prague), **Slovakia** and
        **Hungary** (Budapest), all three landlocked. Little **Slovenia**
        touches the Adriatic Sea, next to Italy.

        Two of these names are easy to mix up. Find them both before you go
        on.
      `,
      figure: countriesMap(CENTRE.ids, { view: [2.5, 44.5, 25, 55.5], capitals: CENTRE.capitals, more: ['DE'], at: { NL: [5.6, 53.9], BE: [4.2, 49.9] } }),
    },
    {
      id: 'slovenia',
      type: 'interact',
      title: 'One letter apart',
      text: `
        **Slovakia** and **Slovenia** both became independent in the early
        1990s. Their names differ by a few letters, and their flags are both
        white, blue and red stripes with a shield.

        One of them has a short coast on the Adriatic Sea, next to Italy. The
        other is landlocked, further north-east. **Tap Slovenia.**
      `,
      widget: {
        type: 'world-map', view: VIEW.centralEurope, mode: 'pick', pickable: PICKABLE.europe, answer: 'SI',
        alt: 'A map of central Europe, from the North Sea to the Adriatic, without names',
      },
      check: (s) => {
        if (s.picked === 'SI') return true;
        if (s.picked === 'SK') return 'That is Slovakia: landlocked, between Poland and Hungary. Slovenia is the one that reaches the sea.';
        if (s.picked === 'HR') return 'That is Croatia, the long crescent on the Adriatic. Slovenia is its small neighbour to the north-west.';
        if (s.picked === 'AT') return 'That is Austria. Slovenia is directly south of it.';
        return s.picked ? `That is ${s.nameThe || s.name}. Look where Italy, Austria and Croatia meet, at the top of the Adriatic.` : 'Tap a country first.';
      },
      solution: { picked: 'SI' },
      hints: ['Find the top of the Adriatic Sea, east of the Italian "boot". The small country there is the one you want.'],
      explain: `
        **Slovenia** (capital Ljubljana) was part of Yugoslavia until 1991.
        **Slovakia** (capital Bratislava) was the eastern half of
        Czechoslovakia until 1993. A trick: Slo-**ven**-ia is the one near
        **Ven**-ice.
      `,
    },
    {
      id: 'teach-north',
      type: 'info',
      title: 'The north',
      text: `
        North of Germany, **Denmark** (Copenhagen) is a peninsula and islands
        between the North Sea and the Baltic.

        **Norway** (Oslo) and **Sweden** (Stockholm) share the Scandinavian
        Peninsula: Norway on the Atlantic side, Sweden facing the Baltic.
        **Finland** (Helsinki) lies east of Sweden.

        South of Finland, across a narrow gulf, are the three small
        **Baltic states**. From north to south: **Estonia**, **Latvia**,
        **Lithuania**. Beyond them lies **Russia** (Moscow), which you know
        as the largest country on Earth.
      `,
      figure: countriesMap(NORTH.ids, { view: [2, 50.5, 41, 71.5], capitals: NORTH.capitals, more: ['RU'], at: { RU: [36, 59] } }),
    },
    {
      id: 'teach-south-east',
      type: 'info',
      title: 'The south-east',
      text: `
        The Balkan Peninsula is a patchwork of small countries.

        **Croatia** is the crescent along the Adriatic Sea, with
        **Bosnia and Herzegovina** tucked inside it. Further down the coast
        is **Albania**, with landlocked **North Macedonia** beside it. Both
        lie just north of **Greece** (Athens), the tip of the peninsula.

        **Romania** (Bucharest) and **Bulgaria** (Sofia) face the Black Sea,
        with the Danube between them. North of Romania is **Ukraine**
        (Kyiv).
      `,
      figure: countriesMap(SOUTH_EAST.ids, { view: [12.5, 34.5, 36, 52.5], capitals: SOUTH_EAST.capitals, more: ['UA'], at: { BG: [26.2, 42.9], MK: [21.7, 41.1] } }),
    },
    {
      id: 'find-country',
      type: 'interact',
      review: true,
      title: 'Find the country',
      gen: (rng) => findCountry(rng, FIND.europe, PICKABLE.europe),
    },
    {
      id: 'families',
      type: 'info',
      title: 'Three big families',
      text: `
        Europe has dozens of languages, but most belong to three families,
        each descended from one older language:

        - [**Romance**]{.orange}, in the south-west: the daughters of the
          Latin of the Roman Empire (you met it in *First Worlds*).
        - [**Germanic**]{.blue}, in the north-west.
        - [**Slavic**]{.green}, in the east.

        A few languages belong to none of the three. The
        [violet]{.violet} countries speak **Uralic** languages. Grey countries
        are mixed (Belgium, Switzerland, Ireland) or speak a branch of their
        own, such as Greek, Albanian or the Baltic languages.
      `,
      figure: {
        type: 'world-map', view: VIEW.europe,
        regions: [
          { ids: ['PT', 'ES', 'FR', 'IT', 'RO', 'MD'], color: 'orange', label: 'Romance' },
          { ids: ['DE', 'AT', 'NL', 'GB', 'SE', 'NO', 'DK', 'IS'], color: 'blue', label: 'Germanic' },
          { ids: ['PL', 'CZ', 'SK', 'UA', 'BY', 'RU', 'BG', 'RS', 'HR', 'SI', 'BA', 'ME', 'MK'], color: 'green', label: 'Slavic' },
          { ids: ['FI', 'EE', 'HU'], color: 'violet', label: 'Uralic' },
        ],
        alt: 'Europe coloured by language family: Romance in the south-west (Portugal, Spain, France, Italy, and Romania far to the east), Germanic in the north-west and Scandinavia, Slavic in the east, and three Uralic countries: Finland, Estonia and Hungary.',
      },
    },
    {
      id: 'numbers',
      type: 'choice',
      stretch: true,
      title: 'Read the evidence',
      text: `
        Relatives look alike. Here is how six languages count to three.

        | | 1 | 2 | 3 |
        |---|---|---|---|
        | Spanish | uno | dos | tres |
        | Italian | uno | due | tre |
        | German | eins | zwei | drei |
        | Swedish | ett | två | tre |
        | Polish | jeden | dwa | trzy |
        | Hungarian | egy | kettő | három |

        Hungary is surrounded by Slavic, Germanic and Romance speakers.
        **What do its numbers tell you?**
      `,
      options: [
        { text: 'Hungarian comes from a different family than its neighbours', correct: true },
        { text: 'Hungarian is a Slavic language, like Polish', why: 'Compare the rows: Polish *dwa, trzy* still look like *dos, tres* and *zwei, drei*. Hungarian *kettő, három* look like none of them.' },
        { text: 'Hungarian is a kind of German', why: 'Hungary was long ruled together with Austria, but ruling a place does not change which family its language belongs to.' },
        { text: 'The six languages are unrelated to one another', why: 'Five of them clearly share their words for 2 and 3: they all descend from one ancestor, called Indo-European.' },
      ],
      explain: `
        Five rows share a family likeness: they all descend from one ancient
        language, **Indo-European**. Hungarian does not. It is a **Uralic**
        language, brought by the Magyars, horsemen who rode in from the east
        around 900 CE. Its distant cousins are Finnish and Estonian.

        Basque, spoken where Spain meets France, is stranger still: it is
        related to no other known language.
      `,
    },
    {
      id: 'language-sort',
      type: 'bucket',
      review: true,
      text: 'Sort these European languages into their families.',
      buckets: ['Romance', 'Germanic', 'Slavic'],
      items: [
        { text: 'Portuguese', bucket: 0 },
        { text: 'Italian', bucket: 0 },
        { text: 'Romanian', bucket: 0, why: 'The name says it: the language of the Romans. Romanian is a daughter of Latin, far from its sisters.' },
        { text: 'Dutch', bucket: 1 },
        { text: 'Swedish', bucket: 1 },
        { text: 'English', bucket: 1, why: 'English borrowed thousands of words from French and Latin, but its grammar and its everyday words (*water, house, mother, three*) are Germanic.' },
        { text: 'Polish', bucket: 2 },
        { text: 'Czech', bucket: 2 },
        { text: 'Bulgarian', bucket: 2 },
      ],
      explain: `
        **Romance** languages descend from Latin (Portuguese, Spanish, French,
        Italian, Romanian). **Germanic** languages fill the north-west
        (English, German, Dutch, and the Scandinavian languages). **Slavic**
        languages fill the east (Polish, Czech, Russian, Ukrainian, Bulgarian,
        Serbian and more).
      `,
    },
    {
      id: 'faiths',
      type: 'match',
      title: 'Read the skyline',
      text: `
        Europe's skylines record a second old division, inside Christianity.
        Onion domes like these are the mark of Russian **Orthodox** churches.
        Orthodoxy shaped the east and south-east, the **Catholic** church the
        south and centre, and after 1517 most of the north became
        **Protestant** (you met the Reformation in *One World*). Islam has
        been part of Europe for centuries too, above all in the Balkans.

        **Match each tradition to a country it shaped.**
      `,
      figure: landmarkFigure('st-basils', { aspect: '3:2', fit: 'cover', focus: [0.5, 0.42], maxWidth: 380 }),
      pairs: [
        ['Orthodox Christianity', 'Greece'],
        ['Catholic Christianity', 'Poland'],
        ['Protestant (Lutheran) Christianity', 'Sweden'],
        ['Islam', 'Albania'],
      ],
      explain: `
        Greece, like Russia, Serbia, Romania and Bulgaria, is Orthodox by
        tradition; Poland, like Italy, Spain and Ireland, is Catholic; Sweden
        and the rest of Scandinavia became Lutheran; and Islam is the largest
        religion in Albania, Kosovo and Bosnia. Millions of Muslims also live
        in France, Germany and Britain.

        Today many Europeans follow no religion at all. Czechia and Estonia
        are among the least religious countries in the world.
      `,
    },
    {
      id: 'parthenon',
      type: 'choice',
      mode: 'predict',
      title: 'One building, four lives',
      text: `
        This temple in Athens stood almost whole for more than 2,000 years.
        Look at it now: no roof, and no walls inside the columns.

        **What do you think wrecked it?**
      `,
      figure: landmarkFigure('parthenon'),
      options: [
        { text: 'An explosion: it was being used to store gunpowder', correct: true },
        { text: 'An earthquake' },
        { text: 'Its stone was carried off, bit by bit, for other buildings' },
        { text: 'It was never finished' },
      ],
      explain: `
        The **Parthenon** was built for the goddess Athena. Then it became a
        Christian church, for about 900 years, and under the Ottoman Turks a
        mosque. In 1687 the Ottomans were storing gunpowder in it when a
        shell from a besieging Venetian army set it off.

        Greek temple, church, mosque, ruin: four layers of Europe's history
        in one building.
      `,
    },
    {
      id: 'teach-landmarks',
      type: 'info',
      title: 'Five buildings, five ages',
      text: [
        'Europe keeps its past standing in its city centres. Five buildings to know, each from a different age:',
        '',
        ...dateLines(BUILDINGS),
        '',
        'The Parthenon is ancient Greece, which came before the Roman Empire and its Colosseum. The great cathedrals belong to the Middle Ages. You have seen the onion domes of St Basil\'s. The **Eiffel Tower**, in the picture, is iron: it had to wait for the Industrial Revolution.',
      ].join('\n'),
      figure: landmarkFigure('eiffel-tower', { aspect: '4:5', fit: 'cover', focus: [0.5, 0.3], maxWidth: 340 }),
    },
    {
      id: 'which-landmark',
      type: 'choice',
      review: true,
      gen: (rng) => whichPhoto(rng, ['parthenon', 'eiffel-tower', 'st-basils'], ['parthenon', 'eiffel-tower', 'st-basils', 'hagia-sophia', 'taj-mahal', 'giza-pyramids']),
    },
    {
      id: 'when',
      type: 'order',
      title: 'Twenty-three centuries of building',
      text: 'Europe keeps its past standing in its city centres. **Put these in order, oldest first.**',
      items: inOrder(BUILDINGS),
      labels: ['Oldest', 'Newest'],
      hints: ['Ancient Greece came before the Roman Empire; the great cathedrals belong to the Middle Ages.', 'Iron towers had to wait for the Industrial Revolution.'],
      explain: `
        The Parthenon (finished 432 BCE), the Colosseum (80 CE), Notre-Dame
        (begun 1163), St Basil's (1561), the Eiffel Tower (1889).

        When the Parthenon was new, Confucius, in China, had been dead for
        less than fifty years. When the Eiffel Tower opened, the Parthenon
        was already 2,300 years old.
      `,
    },
    {
      id: 'capitals',
      type: 'interact',
      review: true,
      title: 'Capitals',
      gen: (rng) => tapCapital(rng, CAPITALS, { view: 'europe', minKm: 450 }),
    },
    {
      id: 'union',
      type: 'multi',
      title: 'Putting the pieces together',
      text: `
        After two world wars that began in Europe (see *The Modern World*),
        six countries decided to pool their coal and steel so that they could
        not arm against each other. That pact grew into the
        **European Union**: [27 countries]{.blue} with shared laws and open borders,
        most of which also share a currency, the euro.

        The EU is not the same thing as Europe.
        **Which of these countries are *not* members?**
      `,
      figure: {
        type: 'world-map', view: VIEW.europe,
        regions: [{ ids: EU, color: 'blue', label: 'Members of the European Union' }],
        labels: ['NO', 'CH', 'GB', 'PL', 'IE', 'GR'],
        alt: 'A map of Europe with the 27 members of the European Union coloured. Norway, Switzerland and the United Kingdom are among the countries left grey; Poland, Ireland and Greece are coloured.',
      },
      options: [
        { text: 'Norway', correct: true },
        { text: 'Switzerland', correct: true },
        { text: 'United Kingdom', correct: true },
        { text: 'Poland' },
        { text: 'Ireland' },
        { text: 'Greece' },
      ],
      explain: `
        **Norway** and **Switzerland** never joined; the **United Kingdom**
        was a member for 47 years and left in 2020. Poland, Ireland and
        Greece are members.

        So the answer to this lesson's question has two halves. Seas and
        mountains cut Europe into many small homelands; since 1950 most of
        them have chosen to tie themselves together again.
      `,
    },
  ],
  recap: [
    'Europe is the ragged western end of Eurasia: seas and mountains divide it into pockets, and it holds between 44 and about 50 countries.',
    'Most European languages belong to three families: **Romance** (south-west), **Germanic** (north-west) and **Slavic** (east). Hungarian, Finnish, Estonian and Basque are outsiders.',
    'Its landmarks stack up 2,400 years: the Parthenon, the Colosseum, Gothic cathedrals, St Basil\'s, the Eiffel Tower.',
    'The **European Union** (27 members) is not all of Europe: Norway, Switzerland and the United Kingdom are outside it.',
  ],
  next: 'Next: cross the Mediterranean to a region where three continents meet, and where the map is drawn by water.',
};
