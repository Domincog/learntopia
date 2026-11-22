// The Modern World: 1750 to Today · Lesson 7 · The Great Acceleration
//
// Figures for the present (population, cities, internet, carbon dioxide, warming) were checked in
// late 2026 and are phrased to age slowly: rounded, dated, and never the answer to a graded question.
import { PLACES, pic, marker, at, inOrder, timelineEvents, whichFirst, markerQuiz, pinCheck } from '../helpers.js';

const CHOKEPOINTS = [
  { id: 'suezCanal', clue: 'the Suez Canal, the short cut between Europe and Asia', where: 'the narrow neck of land where Africa meets Asia', more: 'Opened in 1869, it carries roughly a tenth of the world\'s sea trade. When one giant container ship ran aground in it in 2021, hundreds of ships queued for six days.' },
  { id: 'panamaCanal', clue: 'the Panama Canal, the short cut between the Atlantic and the Pacific', where: 'the narrowest part of the Americas', more: 'Opened in 1914, it saves ships a voyage of about 13,000 km round South America.' },
  { id: 'malacca', clue: 'the Strait of Malacca, the main sea lane between the Indian Ocean and East Asia', where: 'the gap between the Malay Peninsula and the island of Sumatra', more: 'Monsoon traders sailed it 2,000 years ago, as you saw in *Crossroads*. It is now one of the busiest shipping lanes on Earth.' },
  { id: 'gibraltar', clue: 'the Strait of Gibraltar, the gateway between the Atlantic and the Mediterranean', where: 'the gap between Spain and Morocco', more: 'At its narrowest it is only 14 km wide. Every ship from the Suez Canal to northern Europe passes through it.' },
  { id: 'goodHope', clue: 'the Cape of Good Hope, the long way round between Europe and Asia', where: 'the southern tip of Africa', more: 'Portuguese ships first rounded it in 1488. Ships still go this way when the Suez route is closed or unsafe.' },
];

const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const CHOKE_LABEL_POS = { gibraltar: 'left', suezCanal: 'top', malacca: 'bottom', panamaCanal: 'left' };
// The dated events of the lesson. The "put in order" step, the "which came first?" step and the
// timeline that teaches them are all built from these lists.
const IN_ORDER = ['container', 'earthrise', 'chinaReforms', 'web', 'halfUrban', 'parisAgreement'];
const WHICH_FIRST = ['container', 'earthrise', 'chinaReforms', 'web', 'parisAgreement', 'eightBillion', 'moonLanding', 'wallFalls', 'unCharter', 'montreal'];
const ON_THE_LINE = ['unCharter', 'container', 'earthrise', 'moonLanding', 'chinaReforms', 'montreal', 'web', 'wallFalls', 'halfUrban', 'parisAgreement', 'eightBillion'];

// Carbon dioxide in the air, parts per million: ice cores, then direct measurement from 1958.
const CO2 = [[1750, 278], [1800, 283], [1850, 285], [1900, 296], [1950, 311], [1960, 317], [1970, 326], [1980, 339], [1990, 354], [2000, 369], [2010, 390], [2020, 414], [2025, 427]];

export default {
  id: 'globalisation',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Better or worse?',
      text: `
        "Extreme poverty" means living on less than about three dollars a day: not enough for
        secure food, shelter and clean water.

        **Since 1990, what has happened to the share of the world's people who live like that?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: 'It has almost doubled' },
        { text: 'It has stayed about the same' },
        { text: 'It has fallen by more than half', correct: true },
      ],
      explain: `
        It has fallen from **more than a third** of humanity in 1990 to about **a tenth** in the
        2020s, although the world gained almost three billion people in the same years. Most
        people guess the opposite.

        This last lesson asks **what has changed faster since 1950 than in all of history
        before, and what that speed costs**.
      `,
    },
    {
      id: 'acceleration',
      type: 'info',
      title: 'The Great Acceleration',
      text: `
        Around 1950, when there were 2.5 billion people, almost every measure of human activity
        bent upwards together. Scientists call it the **Great Acceleration**.

        People live differently, too. A baby born in 1950 could expect, on the world average, to
        live less than 50 years; one born in the mid-2020s about **73**. A little over half of adults could
        read then; nearly nine in ten can now.

        Not equally: where lives are shortest, a newborn can still expect about thirty years
        less than where they are longest.
      `,
      figure: {
        type: 'bars',
        data: [
          { label: 'People', value: 3.2, color: 'blue' },
          { label: 'People in cities', value: 6, color: 'violet' },
          { label: 'Energy used', value: 6, color: 'orange' },
        ],
        yMax: 8, yStep: 2, yLabel: 'times the level of 1950',
        alt: 'Bar chart comparing the mid-2020s with 1950: about 3 times as many people, about 6 times as many people living in cities, and about 6 times as much energy used.',
        caption: 'The mid-2020s compared with 1950 (rounded)',
      },
    },
    {
      id: 'billions',
      type: 'interact',
      title: 'Eight billion',
      text: `
        It took all of human history until about 1804 to reach **1 billion** people. In 2022 the
        world passed **8 billion**.

        **Drag the two cards to where they belong.** Within 20 years counts. A clue: each of the
        last two doublings took a little under fifty years.
      `,
      widget: {
        type: 'timeline', from: 1750, to: 2050, step: 50, snap: 5, showYears: true,
        events: timelineEvents(['oneBillion', 'eightBillion'], { oneBillion: { color: 'gray', label: '1 billion' }, eightBillion: { color: 'gray', label: '8 billion' } }),
        place: [
          { id: 'twoBillion', label: '2 billion', answer: 1927 },
          { id: 'fourBillion', label: '4 billion', answer: 1974 },
        ],
        alt: 'A timeline from 1750 to 2050 with two fixed events, 1 billion people in 1804 and 8 billion in 2022, and two cards to place: 2 billion and 4 billion.',
      },
      check: (s) => {
        if (!s.complete) return 'Place both cards on the line.';
        const p = s.placed;
        if (p.twoBillion >= p.fourBillion) return 'Two billion has to come before four billion.';
        if (Math.abs(p.fourBillion - 1974) > 20) return p.fourBillion < 1974 ? 'Four billion came later than that: only about fifty years before eight billion.' : 'Four billion came earlier than that: about fifty years before eight billion.';
        return Math.abs(p.twoBillion - 1927) <= 20 || (p.twoBillion < 1927 ? 'Two billion came later than that: a little under fifty years before four billion.' : 'Two billion came earlier than that: a little under fifty years before four billion.');
      },
      solution: { placed: { twoBillion: 1925, fourBillion: 1975 } },
      hints: ['Work backwards from 2022: take off about 48 years for four billion, then about 47 more for two billion.'],
      explain: `
        **1927** and **1974**. The first doubling took 123 years, the next two took 47 and 48.
        Vaccines, clean water and more food let far more children survive.

        The pace is now slowing: families are smaller almost everywhere, and the United Nations
        expects the total to level off later this century.
      `,
    },
    {
      id: 'cities',
      type: 'slider',
      mode: 'predict',
      title: 'A species of city-dwellers',
      text: `
        For nearly all of history most people were farmers. In 1950 about **30%** of humanity
        lived in towns and cities.

        **What do you think the share is today?**
      `,
      min: 0, max: 100, step: 1, start: 30, answer: 58, tolerance: 8, unit: '%',
      explain: `
        Close to **six in ten** in 2025, by each country's own definition of a town. The halfway mark
        was passed in about 2007. A newer United Nations measure, which counts small towns the
        same way everywhere, puts the figure nearer eight in ten.

        Either way, the typical human being now lives in a town, for the first time ever.
        *Around the World*, the next course, visits the largest cities.
      `,
    },
    {
      id: 'container',
      type: 'choice',
      title: 'The box',
      text: `
        In 1956 an American trucking businessman, Malcolm McLean, loaded 58 metal boxes onto an
        old tanker and sailed them from Newark to Houston. Ships like this one are the result.

        **Look at the cargo. What is the one feature that changed world trade?**
      `,
      figure: pic('container-ship', {
        alt: 'A very long cargo ship in a harbour, with a tugboat at its stern. Its deck is stacked several layers high, from end to end, with rectangular metal boxes of identical shape in different colours.',
        caption: 'The container ship Colombo Express in the port of Hamburg, 2005',
      }),
      columns: 1,
      options: [
        { text: 'Every box is the same size and shape', correct: true },
        { text: 'The boxes are made of metal', why: 'Metal keeps the rain out, but barrels and crates did that too. Look at how neatly the boxes stack.' },
        { text: 'The ship is faster than older ships', why: 'Speed at sea has changed little since 1950. The time is saved in port.' },
      ],
      explain: `
        A standard box fits every crane, ship, train and lorry on Earth, and is never unpacked on
        the way. Loading a ship used to take gangs of dockers a week; now it takes less than a day. By one
        estimate the cost of loading a tonne fell from nearly six dollars to 16 cents.

        More than 80% of traded goods now travel by sea. Read the labels in your clothes: the
        cotton, the cloth and the sewing may come from three different countries.
      `,
    },
    {
      id: 'teach-chokepoints',
      type: 'info',
      title: 'The narrow places',
      text: `
        Follow one box from Shanghai to Hamburg, the port in the last picture. The sea lanes
        of the world squeeze through a few narrow passages, and it uses three of them.

        ${CHOKEPOINTS.map((t) => `- ${capFirst(t.clue.replace(PLACES[t.id].name, `**${PLACES[t.id].name}**`))}.`).join('\n        ')}
      `,
      figure: {
        type: 'world-map', zoom: false, dots: false,
        markers: CHOKEPOINTS.map((t) => marker(t.id, { color: 'red', ...(CHOKE_LABEL_POS[t.id] ? { labelPos: CHOKE_LABEL_POS[t.id] } : {}) })),
        lines: [{
          points: [at('shanghai'), [123, 27], [115, 12], [105, 2.5], at('malacca'), [94, 6.5], [80, 5], [58, 12], [45, 12], [43.3, 12.6], [38.5, 20], at('suezCanal'), [28, 33.5], [12, 37.5], at('gibraltar'), [-10.5, 39], [-7, 48], [2, 51], 'Hamburg'],
          color: 'blue', arrow: true, label: 'A container ship\'s route from Shanghai to Hamburg', labelOn: 'legend',
        }],
        alt: `A world map with five passages named: ${CHOKEPOINTS.map((t) => PLACES[t.id].name).join(', ')}. A line shows a ship's route from Shanghai through the Strait of Malacca, the Suez Canal and the Strait of Gibraltar to Hamburg.`,
      },
    },
    {
      id: 'chokepoints',
      type: 'interact',
      review: true,
      gen: (rng) => markerQuiz(rng, {
        items: CHOKEPOINTS,
        lead: 'The world\'s shipping squeezes through a few narrow passages.',
        alt: 'A world map with five lettered markers: one in Central America, one between Spain and Morocco, one at the north-east corner of Africa, one at the southern tip of Africa and one beside the Malay Peninsula.',
      }),
    },
    {
      id: 'shenzhen',
      type: 'interact',
      tone: 'sober',
      title: 'The workshop moves east',
      text: `
        In 1978 China was one of the poorest countries on Earth. Under Mao Zedong it had lived
        through the famine of the Great Leap Forward (1959 to 1961), in which tens of millions
        died, and the turmoil of the Cultural Revolution. His successors now began to open farms
        and factories to markets and foreign trade. Their first experimental zone was a small border
        town on the **south coast**, at the mouth of the Pearl River, right beside Hong Kong.

        **Place the pin on that town, Shenzhen.** Anywhere within 400 km counts.
      `,
      widget: {
        type: 'world-map', view: [98, 14, 132, 44], mode: 'place',
        markers: [marker('beijing', { color: 'ink' }), marker('shanghai', { color: 'ink' })],
        pin: { label: 'Shenzhen', color: 'red', start: [104, 40] }, target: marker('shenzhen').at,
        alt: 'A map of eastern China and its neighbours without country names. Beijing is marked in the north and Shanghai halfway down the coast.',
      },
      check: pinCheck('shenzhen', 400),
      solution: { pin: [114.0, 22.75] },
      hints: ['Follow the coast south-west from Shanghai, past the island of Taiwan, to where the coast turns west.'],
      explain: `
        Shenzhen grew from a town of a few tens of thousands into a city of more than 17 million
        people within forty years.

        Japan, South Korea, Taiwan and Singapore had already grown rich by exporting. China
        followed on a vaster scale: its economy grew about 10% a year for three decades, some
        800 million people left extreme poverty, and it became the world's largest manufacturer,
        the place Britain held in 1850. The Communist Party kept its monopoly of power.
      `,
    },
    {
      id: 'teach-globalisation',
      type: 'info',
      title: 'Tied together',
      text: `
        Trade, cheap flights and the internet have tied the world together, a process called
        **globalisation**. People argue about it, with facts on both sides.

        - Poverty fell fastest in countries that joined world trade, above all in East Asia.
        - Many factory jobs left the older industrial regions of Europe and North America.
        - The gains were very uneven: large for many Asian workers and for the wealthy
          everywhere, small or negative for many workers in older industrial towns. The gap
          between the world's richest and poorest people is still very wide.
        - Borders and cultures still matter. Languages, religions and loyalties endure, and
          many voters have pushed back with trade barriers and limits on migration.
      `,
    },
    {
      id: 'two-sides',
      type: 'multi',
      title: 'Winners and losers',
      text: `
        People argue fiercely about globalisation.

        **Which of these statements does the evidence support?**
      `,
      columns: 1,
      options: [
        { text: 'Poverty fell fastest in countries that joined world trade, above all in East Asia', correct: true },
        { text: 'Many factory jobs left older industrial regions of Europe and North America', correct: true },
        { text: 'The gap between the world\'s richest and poorest people is still very wide', correct: true },
        { text: 'Every country and every worker has gained equally', why: 'Gains were very uneven: large for many Asian workers and for the wealthy everywhere, small or negative for many workers in older industrial towns.' },
        { text: 'National borders and cultures have stopped mattering', why: 'Languages, religions and loyalties endure, and many voters have pushed back with trade barriers and limits on migration.' },
      ],
      explain: `
        Both the celebration and the criticism have facts behind them. The same forces that
        emptied some factory towns filled others, and the same phone carries a village's music to
        the world and the world's advertising to the village.

        About three-quarters of humanity was online by 2025, a share that was close to zero in 1990.
      `,
    },
    {
      id: 'co2',
      type: 'choice',
      review: true,
      title: 'One atmosphere',
      text: `
        The first lesson ended with coal smoke over Manchester. Burning coal, oil and gas releases
        **carbon dioxide** (CO₂), a gas that traps heat. The graph shows how much of it is in the air.
        For 10,000 years before 1750 the level had stayed close to 280.

        **What does the shape of the curve tell you?**
      `,
      figure: {
        type: 'plot', x: [1740, 2035], y: [260, 440], xStep: 50, yStep: 40, xLabel: 'year', yLabel: 'CO₂ (parts per million)',
        xFormat: (v) => String(Math.round(v)), yFormat: (v) => String(Math.round(v)),
        segments: CO2.slice(1).map((p, i) => ({ from: CO2[i], to: p, color: 'red' })),
        hlines: [{ y: 280, color: 'gray', dashed: true }],
        labels: [{ x: 1800, y: 268, text: 'level before 1750', color: 'gray' }, { x: 1950, y: 430, text: 'about 427 in 2025', color: 'red' }],
        alt: 'A line graph of carbon dioxide in the atmosphere from 1750 to 2025. The line starts near 280 parts per million, climbs slowly to about 311 by 1950, then bends sharply upwards to about 427 in 2025.',
      },
      columns: 1,
      options: [
        { text: 'Most of the rise has come since 1950', correct: true },
        { text: 'It has risen at the same steady pace since 1750', why: 'Compare the slopes: about 30 parts per million in the two centuries before 1950, well over 100 in the 75 years since.' },
        { text: 'It rose during the Industrial Revolution and then levelled off', why: 'The line is steepest at its right-hand end.' },
      ],
      explain: `
        The curve bends with the Great Acceleration. CO₂ is now about half as high again as before
        the Industrial Revolution, and the world has warmed by roughly **1.4 °C** since the late
        1800s; 2024 was the first single year measured above 1.5 °C.

        Fossil fuels still supply about four-fifths of the world's energy. The countries that
        industrialised first have emitted the most over time, the largest emitters today include
        China, the United States and India, and the poorest countries, which emitted least, are
        often the most exposed to heat, drought and rising seas.
      `,
    },
    {
      id: 'teach-rules',
      type: 'info',
      title: 'Shared problems, shared rules',
      text: `
        Smoke, viruses and money cross borders without a passport. Since 1945 countries have
        tried, with mixed results, to make rules together.

        - **World Health Organization**, 1948: countries work together against disease.
        - **Treaty of Rome**, 1957: six European countries merged their markets. It grew into
          the European Union.
        - **Montreal Protocol**, 1987: phase out the chemicals that destroy the ozone layer.
          Every country joined, and the ozone layer is healing.
        - **Paris Agreement**, 2015: hold global warming well below 2 °C.
      `,
      figure: {
        type: 'timeline', from: 1940, to: 2020, step: 10, showYears: true, mode: 'static',
        events: timelineEvents(['unCharter', 'treatyOfRome', 'montreal', 'parisAgreement'], {
          unCharter: { label: 'United Nations', short: 'UN', color: 'gray' },
          treatyOfRome: { label: 'Treaty of Rome', short: 'Rome' },
          montreal: { label: 'Montreal Protocol', short: 'Montreal' },
          parisAgreement: { label: 'Paris Agreement', short: 'Paris' },
        }),
        alt: 'A timeline from 1940 to 2020: the United Nations in 1945, the Treaty of Rome in 1957, the Montreal Protocol in 1987 and the Paris Agreement in 2015.',
      },
    },
    {
      id: 'agreements',
      type: 'match',
      title: 'Which rule for which problem?',
      text: `
        **Match each agreement with its aim.**
      `,
      pairs: [
        ['World Health Organization, 1948', 'Countries work together against disease'],
        ['Treaty of Rome, 1957', 'Six European countries merge their markets'],
        ['Montreal Protocol, 1987', 'Phase out the chemicals that destroy the ozone layer'],
        ['Paris Agreement, 2015', 'Hold global warming well below 2 °C'],
      ],
      explain: `
        The **Treaty of Rome** grew into the European Union, 27 countries in the mid-2020s, built
        so that war between France and Germany would be, as its founders put it, "not merely
        unthinkable, but materially impossible".

        The **Montreal Protocol** is the clearest success. Climate is harder, because fossil fuels power almost everything, and
        wild nature is under pressure too: about a million species are thought to be at risk of
        extinction. When COVID-19 circled the world within weeks in 2020, it showed how fast a
        shared problem now travels.
      `,
    },
    {
      id: 'teach-timeline',
      type: 'info',
      title: 'Seventy years on one line',
      text: `
        Put the lesson on one line.

        - **1956**: the first container ship sails.
        - **1968**: the crew of *Apollo 8* photograph the Earth from lunar orbit: "Earthrise".
        - **1978**: China begins its market reforms.
        - **1987** and **2015**: the Montreal Protocol and the Paris Agreement.
        - **1989**: Tim Berners-Lee proposes the World Wide Web.
        - **2007**: half of humanity lives in towns and cities.
        - **2022**: 8 billion people.

        Three dates from earlier lessons are on it in grey: the United Nations (1945), the
        first people on the Moon (1969) and the opening of the Berlin Wall (1989).
      `,
      figure: {
        type: 'timeline', from: 1940, to: 2030, step: 10, showYears: true, mode: 'static',
        events: timelineEvents(ON_THE_LINE, {
          unCharter: { label: 'United Nations', short: 'UN', color: 'gray' },
          container: { label: 'Container ship', short: 'Containers' },
          earthrise: { label: 'Earthrise', short: 'Earthrise' },
          moonLanding: { label: 'Moon landing', short: 'Moon', color: 'gray' },
          chinaReforms: { label: 'China\'s reforms', short: 'China reforms' },
          montreal: { label: 'Montreal Protocol', short: 'Montreal' },
          web: { label: 'World Wide Web', short: 'Web' },
          wallFalls: { label: 'Berlin Wall opens', short: 'Berlin Wall', color: 'gray' },
          halfUrban: { label: 'Half in cities', short: 'Half in cities' },
          parisAgreement: { label: 'Paris Agreement', short: 'Paris' },
          eightBillion: { label: '8 billion', short: '8 billion' },
        }),
        alt: 'A timeline from 1940 to 2030: the United Nations in 1945, the first container ship in 1956, Earthrise in 1968, the Moon landing in 1969, China\'s reforms in 1978, the Montreal Protocol in 1987, the World Wide Web and the opening of the Berlin Wall in 1989, half of humanity in cities in 2007, the Paris Agreement in 2015 and 8 billion people in 2022.',
      },
    },
    {
      id: 'order',
      type: 'order',
      review: true,
      text: '**Put these in order, earliest first.**',
      items: inOrder(IN_ORDER),
      labels: ['Earliest', 'Latest'],
      explain: `
        **1956**, **1968**, **1978**, **1989**, **2007**, **2015**. The World Wide Web was proposed by
        Tim Berners-Lee in 1989; the smartphone spread from 2007. Each step made the world smaller,
        as the railway and the telegraph did in the first lesson.
      `,
    },
    {
      id: 'which-first',
      type: 'choice',
      review: true,
      gen: (rng) => whichFirst(rng, WHICH_FIRST, { gap: 5 }),
    },
    {
      id: 'earthrise',
      type: 'reflect',
      title: 'Your place in it',
      text: `
        On 24 December 1968 the crew of *Apollo 8*, the first people to travel round the Moon,
        looked back and took this photograph. Everything in this course, and in this whole path,
        happened on that small blue disc.

        Pick up one ordinary object within your reach. **Name three things from this course that
        had to happen for it to be in your hand.**
      `,
      figure: pic('earthrise', {
        alt: 'The Earth, half in shadow, blue and white against black space, rising above the grey, cratered horizon of the Moon.',
        caption: 'Earthrise, photographed by William Anders, Apollo 8, 1968',
      }),
      model: `
        A cotton T-shirt, for example: the **factory system** that began with cotton in Manchester;
        the **container ship** that carried it for a few cents; the **shift of manufacturing to Asia**
        that decided where it was sewn. Behind those stand the plantations, empires and
        independence struggles of the earlier lessons.

        You are the latest link in every one of those chains. What happens next on the blue disc
        is the part of the story still being written.
      `,
    },
  ],
  recap: [
    'Since 1950 the world\'s population has more than tripled to **8 billion**, most people have moved to **cities**, and life expectancy, literacy and incomes have risen while extreme poverty has fallen.',
    'The **shipping container**, cheap flights and the **internet** tied the world into one market. Manufacturing shifted to **East Asia**, with China\'s reforms from 1978 the largest change of all.',
    'The gains are real and unevenly shared, and globalisation has critics as well as champions.',
    'Burning fossil fuels has raised CO₂ from about 280 to over 420 parts per million and warmed the planet. Shared problems need shared rules: the **Montreal Protocol** shows it can be done.',
  ],
  next: 'You have followed the story from the first steam engines to a planet of eight billion. The last course of the path, *Around the World: Places and Cultures*, visits that planet region by region, as it is today.',
};
