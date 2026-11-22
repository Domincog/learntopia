// The Modern World: 1750 to Today · Lesson 6 · Two Blocs and a Hundred New Flags
import { countryName } from '../../../../src/widgets/world-map.js';
import { PLACES, pic, hasPic, marker, inOrder, timelineEvents, markerQuiz } from '../helpers.js';

// The two alliances in Europe in 1955, on today's borders. Germany, divided between them, is left uncoloured.
const NATO_1955 = ['GB', 'FR', 'BE', 'NL', 'LU', 'IT', 'PT', 'NO', 'DK', 'IS', 'GR', 'TR'];
// The Soviet Union is drawn as today's Russia and the former Soviet republics that the map of Europe shows.
const WARSAW_PACT = ['RU', 'EE', 'LV', 'LT', 'BY', 'UA', 'MD', 'GE', 'AM', 'AZ', 'KZ', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'AL'];
// From the Baltic near Lübeck, down the inner-German border, round Czechoslovakia and Hungary, to Trieste.
const IRON_CURTAIN = [[10.9, 54.0], [10.7, 53.3], [11.0, 52.2], [10.0, 51.4], [10.3, 50.6], [11.9, 50.4], [12.3, 50.2], [12.6, 49.6], [13.6, 48.8], [14.7, 48.7], [15.2, 49.0], [16.9, 48.6], [17.1, 48.0], [16.5, 47.2], [16.1, 46.8], [14.6, 46.5], [13.7, 46.4], [13.6, 45.9], [13.8, 45.6]];

// The fifteen republics of the Soviet Union (Russia is left out of the questions: too easy).
export const SOVIET_REPUBLICS = ['UA', 'BY', 'MD', 'EE', 'LV', 'LT', 'GE', 'AM', 'AZ', 'KZ', 'UZ', 'TM', 'KG', 'TJ'];
// Never part of the Soviet Union, though people often think so.
export const NEVER_SOVIET = [
  { code: 'PL', why: 'Poland was a Soviet ally in the Warsaw Pact, but always a separate state.' },
  { code: 'HU', why: 'Hungary was a Soviet ally in the Warsaw Pact, but always a separate state.' },
  { code: 'RO', why: 'Romania was a Soviet ally in the Warsaw Pact, but always a separate state.' },
  { code: 'BG', why: 'Bulgaria was a close Soviet ally, but always a separate state.' },
  { code: 'CZ', why: 'As part of Czechoslovakia it was in the Warsaw Pact, but never inside the Soviet Union.' },
  { code: 'SK', why: 'As part of Czechoslovakia it was in the Warsaw Pact, but never inside the Soviet Union.' },
  { code: 'RS', why: 'Serbia was part of Yugoslavia, a communist country that broke with Moscow in 1948 and joined neither bloc.' },
  { code: 'HR', why: 'Croatia was part of Yugoslavia, a communist country that broke with Moscow in 1948 and joined neither bloc.' },
  { code: 'FI', why: 'Finland lost land to a Soviet invasion in 1939 to 1940 but kept its independence, and stayed neutral.' },
  { code: 'MN', why: 'Mongolia was a close Soviet ally, but always a separate state.' },
  { code: 'AL', why: 'Albania was communist and for a time in the Warsaw Pact, but never inside the Soviet Union.' },
];
const BALTIC = ['EE', 'LV', 'LT'];
// For the teaching map: the never-Soviet states that were allies of the Soviet Union, and those that stood apart.
const APART = ['RS', 'HR', 'FI'];
// The three Caucasus republics are too small for their names: the names are set beside them.
const CAUCASUS_LABELS = { GE: [40.2, 43.6], AM: [41.6, 38.6], AZ: [51.6, 40.6] };
const ALLIES = NEVER_SOVIET.map((n) => n.code).filter((c) => !APART.includes(c));
const andList = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0]);

const HOT_SPOTS = [
  { id: 'berlin', clue: 'the city divided by a wall from 1961 to 1989', where: 'the middle of Europe', more: 'West Berlin was an island of the Western bloc deep inside communist East Germany.' },
  { id: 'havana', clue: 'the capital of the island where Soviet missiles brought the world to the edge of nuclear war in 1962', where: 'the Caribbean, just south of the United States', more: 'Cuba lies about 150 km from Florida. For thirteen days in October 1962 the superpowers stood at the brink, until the Soviet missiles were withdrawn.' },
  { id: 'seoul', clue: 'on the peninsula divided in 1945, where war raged from 1950 to 1953', where: 'East Asia, between China and Japan', more: 'The Korean War ended about where it began, with an armistice but no peace treaty. Korea is still divided.' },
  { id: 'hanoi', clue: 'in the country where communist forces fought first France and then the United States', where: 'the eastern edge of mainland Southeast Asia', more: 'Vietnam defeated France in 1954, was divided, and was reunited under the communist north in 1975 after a war that killed well over a million people.' },
  { id: 'bandung', clue: 'the city where 29 Asian and African countries met in 1955, without the great powers, to set a course of their own', where: 'the island of Java, just south of the equator', more: 'The Bandung Conference in Indonesia led to the Non-Aligned Movement.' },
  { id: 'accra', clue: 'the capital of Ghana, independent in 1957, three years before the "Year of Africa"', where: 'the coast of West Africa, on the Gulf of Guinea', more: 'Ghana\'s independence under Kwame Nkrumah set off a wave: 17 African countries followed in 1960 alone.' },
  { id: 'delhi', clue: 'the capital of India, independent in 1947', where: 'the north of the Indian subcontinent', more: 'Britain\'s largest colony became two states, India and Pakistan, in August 1947.' },
];

// The closing step reads a night photograph of Korea. Should the picture be missing, the same question is asked on a map.
const KOREA_PHOTO = () => ({
  id: 'korea-night',
  type: 'interact',
  title: 'An echo today',
  text: `
    A NASA satellite recorded this view of East Asia at night. City lights blaze in South
    Korea, in the lower middle, in China, at the top left, and in Japan, in the bottom corner.

    Korea was divided in 1945 between a Soviet and an American zone. The war of 1950 to 1953
    ended without a peace treaty. **Tap North Korea.**
  `,
  widget: pic('korea-night', {
    alt: 'A satellite image of East Asia at night. A peninsula in the lower middle glows with dense city lights, and more lights are scattered across the land at the upper left. The land between them is almost as dark as the sea, with one small point of light.',
    caption: 'The Korean peninsula at night, from a NASA satellite, 2016',
    hotspots: [
      { id: 'china', x: 0.17, y: 0.18, r: 0.1, label: 'China', alt: 'a region with many scattered city lights at the upper left' },
      { id: 'north', x: 0.47, y: 0.45, r: 0.1, label: 'North Korea', alt: 'a dark region in the middle, with one small point of light' },
      { id: 'south', x: 0.58, y: 0.77, r: 0.1, label: 'South Korea', alt: 'a brightly lit region in the lower middle' },
    ],
  }),
  check: (s) => s.picked === 'north'
    || (s.picked === 'south' ? 'Those lights are South Korea: the brightest patch is the region of Seoul. Look at the dark land just north of it.'
      : s.picked === 'china' ? 'Those lights are cities in north-east China. North Korea lies between them and South Korea.' : false),
  solution: { picked: 'north' },
  hints: ['It is the land that looks like sea. The one point of light in it is the capital, Pyongyang.'],
  explain: `
    The dark land between is **North Korea**; the single dot is its capital, Pyongyang.
    Until 1945 the two halves were one country. One border and two systems made the
    difference you can see from space.

    The Cold War is over. Its lines are still on the map.
  `,
});
const KOREA_MAP = {
  id: 'korea-night',
  type: 'interact',
  title: 'An echo today',
  text: `
    Korea was divided in 1945 between a Soviet and an American zone. The war of 1950 to 1953
    ended without a peace treaty, and the two halves have gone separate ways ever since.

    **Tap North Korea.**
  `,
  widget: { type: 'world-map', view: 'east-asia', mode: 'pick', answer: 'KP', alt: 'A map of East Asia without names.' },
  check: (s) => s.picked === 'KP'
    || (s.picked === 'KR' ? 'That is South Korea, the southern half of the peninsula. Look just north of it.' : s.picked ? `That is ${s.nameThe || s.name}. Look at the peninsula between China and Japan.` : false),
  solution: { picked: 'KP' },
  hints: ['The Korean peninsula points south from the north-east corner of China. Take its northern half.'],
  explain: `
    **North Korea.** Until 1945 the two halves were one country. Seen from space at night, the
    south blazes with city lights and the north is almost dark.

    The Cold War is over. Its lines are still on the map.
  `,
};

export default {
  id: 'cold-war-decolonisation',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Count the flags',
      text: `
        Since 2011, 193 countries have had a seat and a flag at the United Nations.

        **How many do you think there were when it was founded in 1945?**
      `,
      min: 0, max: 193, step: 1, start: 150, answer: 51, tolerance: 12, unit: 'members',
      explain: `
        Only **51**. Most of today's countries were then colonies, or parts of larger states.

        This lesson follows two stories that ran side by side for forty-five years: the **end of
        the empires**, and a contest between two superpowers that pulled almost every new country
        into its orbit. It asks **where all the new flags came from**.
      `,
    },
    {
      id: 'teach-two-stories',
      type: 'info',
      title: 'Two stories, side by side',
      text: `
        [**The empires end.**]{.orange} In 1945 most of Africa and much of Asia were colonies.
        India and Pakistan became independent in 1947 and Ghana in 1957. In 1960, the "Year of
        Africa", 17 African countries followed in a single year.

        [**The Cold War.**]{.blue} The two strongest victors of 1945, the United States and the
        Soviet Union, led rival armed blocs for forty-five years. It ended when the Berlin Wall
        opened in 1989 and the Soviet Union broke apart, in December 1991, into 15 countries.
      `,
      figure: {
        type: 'timeline', from: 1945, to: 1995, step: 10, showYears: true, mode: 'static',
        events: timelineEvents(['indiaIndependence', 'ghana', 'yearOfAfrica', 'berlinWall', 'wallFalls', 'ussrEnds'], {
          indiaIndependence: { label: 'India and Pakistan', short: 'India', color: 'orange' },
          ghana: { label: 'Ghana', short: 'Ghana', color: 'orange' },
          yearOfAfrica: { label: 'Year of Africa', short: 'Africa', color: 'orange' },
          berlinWall: { label: 'Berlin Wall built', short: 'Wall', color: 'blue' },
          wallFalls: { label: 'Berlin Wall opens', short: 'Wall opens', color: 'blue' },
          ussrEnds: { label: 'Soviet Union dissolves', short: 'USSR ends', color: 'blue' },
        }),
        alt: 'A timeline from 1945 to 1995. The end of the empires: India and Pakistan independent in 1947, Ghana in 1957, the Year of Africa in 1960. The Cold War: the Berlin Wall built in 1961 and opened in 1989, and the Soviet Union dissolved in 1991.',
      },
    },
    {
      id: 'un-growth',
      type: 'fill',
      title: 'Two great waves',
      text: 'The chart counts the member states of the United Nations. **Read it, and complete the sentences.**',
      figure: {
        type: 'bars',
        data: [
          { label: '1945', value: 51, color: 'gray' },
          { label: '1955', value: 76, color: 'gray' },
          { label: '1965', value: 117, color: 'orange' },
          { label: '1975', value: 144, color: 'gray' },
          { label: '1985', value: 159, color: 'gray' },
          { label: '1995', value: 185, color: 'orange' },
          { label: '2005', value: 191, color: 'gray' },
          { label: '2015', value: 193, color: 'gray' },
        ],
        yMax: 200, yStep: 50, yLabel: 'UN member states',
        alt: 'Bar chart of United Nations membership: 51 in 1945, 76 in 1955, 117 in 1965, 144 in 1975, 159 in 1985, 185 in 1995, 191 in 2005 and 193 in 2015.',
      },
      template: `
        The steepest climb came around [[*1960|1980|2000]], when most of [[Europe|South America|*Africa]] won its independence.
        A second jump came just after [[1950|1970|*1990]], when the [[British Empire|*Soviet Union|Roman Empire]] broke apart.
      `,
      explain: `
        Between 1945 and 1975 membership almost tripled, mostly through **decolonisation**. The
        end of the **Cold War** added more than twenty states in the early 1990s, as the Soviet
        Union and Yugoslavia dissolved. The rest of this lesson is those two stories.
      `,
    },
    {
      id: 'iron-curtain',
      type: 'interact',
      title: 'A continent cut in two',
      text: `
        The two strongest victors of 1945 had opposite systems: the **United States**, capitalist
        and democratic, and the **Soviet Union**, communist and ruled by one party. Each feared the
        other. By 1955 Europe was split between [NATO]{.blue} and the [Warsaw Pact]{.red}.

        The thick line marks the frontier between them, roughly. One country was itself cut
        in two by it, for forty years. **Tap it.**
      `,
      widget: {
        type: 'world-map', view: 'europe', mode: 'pick', answer: 'DE', dim: false,
        regions: [
          { ids: NATO_1955, color: 'blue', label: 'NATO members in Europe, 1955' },
          { ids: WARSAW_PACT, color: 'red', label: 'Warsaw Pact, 1955' },
        ],
        lines: [{ points: IRON_CURTAIN, color: 'ink', width: 3.5, curve: 'straight' }],
        alt: 'A map of Europe in 1955 on today\'s borders. Western countries from Norway and Britain to Italy, Greece and Turkey are shaded as NATO members; the Soviet Union and its allies from Poland to Bulgaria as the Warsaw Pact. A thick line runs from the Baltic Sea south to the Adriatic, passing through the middle of one unshaded country.',
      },
      check: (s) => s.picked === 'DE'
        || (s.picked === 'AT' ? 'That is Austria: occupied by the four victors until 1955, then neutral. The line runs along its edge, not through it.'
          : s.picked === 'PL' ? 'Poland lay wholly on the eastern side. Follow the thick line north from the Alps.'
            : s.picked ? `That is ${s.nameThe || s.name}. Find the country that the thick line runs through.` : false),
      solution: { picked: 'DE' },
      hints: ['Follow the thick line down from the Baltic Sea. It passes through the middle of one country.'],
      explain: `
        **Germany.** The western zones became one state, in NATO (founded 1949); the Soviet zone
        became another, in the Warsaw Pact (1955). In 1946 Winston Churchill had put the new map into one sentence:
        "From Stettin in the Baltic to Trieste in the Adriatic, an iron curtain has descended
        across the Continent."
      `,
    },
    {
      id: 'berlin-wall',
      type: 'choice',
      tone: 'sober',
      title: 'The wall',
      text: `
        Berlin, the old capital, lay deep inside East Germany, but its western half belonged to
        the West. Since 1949 about three million people had left East Germany for the West. In
        August 1961 East Germany sealed West Berlin off with a wall.

        For 28 years, anyone who climbed where these people are standing risked being shot.
        **Why was the wall built?**
      `,
      figure: pic('berlin-wall-1989', {
        alt: 'A crowd of people in jackets and jeans standing shoulder to shoulder along the top of a thick concrete wall covered in graffiti. One man is climbing up, pulled by another. Behind them rise the stone columns of a great gate. A sign fixed to the wall begins with the word ACHTUNG.',
        caption: 'People on the Berlin Wall at the Brandenburg Gate, November 1989',
      }),
      columns: 1,
      options: [
        { text: 'To stop East Germans leaving for the West', correct: true },
        { text: 'To stop Western armies invading the East', why: 'A wall round a city would not stop an army. Its guns and watchtowers faced inwards.' },
        { text: 'To keep West Berliners out of East Germany', why: 'The flow went the other way: the three million had left East Germany, not entered it.' },
      ],
      explain: `
        East Germany's government called the wall a defence against the West, but it was built to
        keep its own citizens in. At least 140 people died trying to cross.

        The photograph shows the end. In 1989 the Soviet leader Mikhail Gorbachev, who was trying to
        reform a stagnant system, refused to send tanks against protesters in Eastern Europe. One
        communist government after another fell. On **9 November 1989** the wall was opened; in
        December 1991 the Soviet Union itself dissolved.
      `,
    },
    {
      id: 'teach-soviet',
      type: 'info',
      title: 'A union and its allies',
      text: `
        The **Soviet Union** was one state made of 15 republics: Russia and the fourteen others
        named on the map. Three of them, the Baltic states of Estonia, Latvia and Lithuania,
        were annexed in 1940.

        Its **allies** were always separate countries: ${ALLIES.filter((c) => !['CZ', 'SK', 'AL', 'MN'].includes(c)).map((c) => countryName(c)).join(', ')}
        and Czechoslovakia (today's Czechia and Slovakia) in the Warsaw Pact, with Albania for a
        time, and Mongolia in Asia.

        Two neighbours stood apart. Yugoslavia, which included today's Serbia and Croatia, was
        communist but broke with Moscow in 1948. Finland stayed neutral.
      `,
      figure: {
        type: 'world-map', view: [14, 34, 90, 70], aspect: 1.5, dots: false,
        regions: [
          { ids: ['RU', ...SOVIET_REPUBLICS], color: 'red', label: 'The Soviet Union: 15 republics' },
          { ids: ALLIES, color: 'orange', label: 'Allies of the Soviet Union: separate states' },
          { ids: APART, color: 'teal', label: 'Yugoslavia and Finland: in neither bloc' },
        ],
        labels: [{ id: 'RU', text: 'Russia' }, ...SOVIET_REPUBLICS.filter((c) => !CAUCASUS_LABELS[c]), ...Object.entries(CAUCASUS_LABELS).map(([c, at]) => ({ at, text: countryName(c) }))],
        alt: `A map from central Europe to Central Asia. The Soviet Union is one colour, with its republics named: Russia, ${andList(SOVIET_REPUBLICS.map((c) => countryName(c)))}. Its allies in eastern Europe are a second colour. Finland and the lands of Yugoslavia are a third.`,
      },
    },
    {
      id: 'soviet-or-ally',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const answer = rng.pick(SOVIET_REPUBLICS);
        const others = rng.sample(NEVER_SOVIET, 3);
        const name = countryName(answer);
        return {
          text: `
            The Soviet Union was a union of 15 republics. When it dissolved in December 1991, each
            became an independent country. Its allies in Eastern Europe had always been separate states.

            **Which of these was inside the Soviet Union itself?**
          `,
          options: rng.shuffle([
            { text: name, correct: true },
            ...others.map((o) => ({ text: countryName(o.code), why: o.why })),
          ]),
          explain: BALTIC.includes(answer)
            ? `**${name}.** The Soviet Union annexed the three Baltic states, Estonia, Latvia and Lithuania, in 1940. They were the first to break away, in 1990 and 1991.`
            : `**${name}** was one of the 15 Soviet republics, with Russia, Ukraine, Belarus, Moldova, the three Baltic states, three in the Caucasus and five in Central Asia. All became independent in 1991.`,
        };
      },
    },
    {
      id: 'arms-race',
      type: 'choice',
      tone: 'sober',
      title: 'A cold war',
      text: `
        The Soviet Union tested its own atomic bomb in 1949. Both sides then built thousands,
        each many times more powerful than the bomb that destroyed Hiroshima.

        Yet in 45 years of hostility the two superpowers never fought each other directly.
        **Why not?**
      `,
      figure: {
        type: 'bars',
        data: [
          { label: '1945', value: 0, color: 'gray' },
          { label: '1955', value: 3, color: 'gray' },
          { label: '1965', value: 37, color: 'gray' },
          { label: '1975', value: 47, color: 'gray' },
          { label: '1986', value: 64, color: 'red' },
          { label: '2025', value: 9.6, color: 'gray' },
        ],
        yMax: 80, yStep: 20, yLabel: 'thousand warheads',
        alt: 'Bar chart of the estimated number of nuclear warheads in the world: a handful in 1945, about 3,000 in 1955, 37,000 in 1965, 47,000 in 1975, a peak of more than 60,000 in 1986 and about 9,600 in 2025. Warheads retired and waiting to be taken apart are not counted.',
        caption: 'Nuclear warheads in military stockpiles, worldwide (estimates, in thousands)',
      },
      columns: 1,
      options: [
        { text: 'Each could still destroy the other after being attacked, so neither dared to start', correct: true },
        { text: 'The United Nations had the power to stop them', why: 'Both held a veto in the UN Security Council, so it could never act against either.' },
        { text: 'They agreed on most questions', why: 'They disagreed about almost everything, from elections to who should own factories.' },
      ],
      explain: `
        Strategists called it **mutually assured destruction**. So the war stayed "cold": an arms
        race, spies, propaganda, and a race into space (the Soviet *Sputnik* in 1957, Americans on
        the Moon in 1969).

        It turned hot in other people's countries, such as Korea, Vietnam and Afghanistan. The
        closest call came in October 1962, when Soviet missiles were found in Cuba.
      `,
    },
    {
      id: 'gandhi',
      type: 'choice',
      title: 'The other story: empires end',
      text: `
        Colonised peoples had not waited for 1945. The photograph shows **Mohandas Gandhi** in
        1930, aged 60, in cloth spun and woven by hand in India: a protest in itself against
        the mills of Manchester. He is leading marchers 390 km to the sea to make a handful of
        salt, breaking a British law that taxed it. Tens of thousands were jailed for copying him.

        **Why did he choose salt?**
      `,
      figure: pic('salt-march', {
        alt: 'A black-and-white photograph of a thin, bald man with glasses, in a white loincloth and shawl, striding along a road with a long walking stick. Men in white clothes and caps walk beside and behind him.',
        caption: 'Gandhi on the Salt March, 1930',
      }),
      columns: 1,
      options: [
        { text: 'Everyone needs salt, so it was a law every Indian understood and could break', correct: true },
        { text: 'Salt was India\'s most valuable export', why: 'It was an everyday necessity, not a rich trade. That was the point: the tax touched the poorest.' },
        { text: 'British soldiers could not fight without Indian salt', why: 'The march was not aimed at the army. It was aimed at opinion, in India, Britain and the world.' },
      ],
      explain: `
        Gandhi's method was **non-violent resistance**: break an unjust law openly, accept the
        punishment, and make the ruler's violence visible. It could not be answered with a
        machine gun without shaming the empire that used one.

        After the Second World War, Britain was too weakened to hold India. The method went on
        to inspire Martin Luther King and many others.
      `,
    },
    {
      id: 'partition',
      type: 'info',
      tone: 'sober',
      title: 'Independence, and Partition',
      text: `
        In August 1947 British India became two states: [India]{.orange}, and [Pakistan]{.green}
        for the regions with Muslim majorities, in two wings some 1,500 km apart. The border was
        drawn in five weeks by a British lawyer who had never been to India before.

        Between 10 and 20 million people fled across the new lines, Hindus and Sikhs one way and
        Muslims the other, in one of the largest migrations in history. Estimates of those
        killed range from several hundred thousand to two million. Gandhi, who had opposed the
        division, was murdered by a Hindu extremist in January 1948.

        The eastern wing broke away in 1971 as **Bangladesh**. India and Pakistan both claim
        Kashmir, in the far north, and each holds part of it.
      `,
      figure: {
        type: 'world-map', view: 'south-asia',
        regions: [
          { ids: ['IN'], color: 'orange', label: 'India' },
          { ids: ['PK', 'BD'], color: 'green', label: 'Pakistan in 1947 (the eastern wing is now Bangladesh)' },
        ],
        labels: ['IN', 'PK', 'BD'],
        alt: 'A map of South Asia. India is highlighted in one colour; Pakistan, to its north-west, and Bangladesh, to its east, in another, as the two wings of Pakistan in 1947.',
      },
    },
    {
      id: 'ghana',
      type: 'interact',
      title: 'Africa\'s turn',
      text: `
        In 1957 the British colony of the Gold Coast became **Ghana**, widely counted as the first
        colony south of the Sahara to win its independence. Its leader, Kwame Nkrumah, declared
        that it would mean little unless the whole continent was freed.

        Ghana lies on the south-facing coast of West Africa, between Ivory Coast and Togo. **Tap it.**
      `,
      widget: {
        type: 'world-map', view: 'west-africa', mode: 'pick', answer: 'GH',
        alt: 'A map of West Africa without names.',
      },
      check: (s) => s.picked === 'GH'
        || (s.picked === 'CI' ? 'That is Ivory Coast, Ghana\'s western neighbour. Go one country east.'
          : s.picked === 'TG' ? 'That narrow strip is Togo. Ghana is the larger country just west of it.'
            : s.picked === 'NG' ? 'That is Nigeria, independent in 1960. Ghana is smaller and lies further west along the same coast.'
              : s.picked ? `That is ${s.nameThe || s.name}. Look along the coast that faces south.` : false),
      solution: { picked: 'GH' },
      hints: ['Find the stretch of coast that runs east to west. Ghana is in the middle of it, a little west of the two narrow strips of Togo and Benin.'],
      explain: `
        Three years later came the **"Year of Africa"**: 17 countries became independent in 1960
        alone. Many transfers were negotiated. Others were fought for, at great cost: Algeria's
        war against France lasted from 1954 to 1962, and Portugal held on to Angola and
        Mozambique until 1975.

        The new states kept the borders drawn in the Scramble, and often the colonial language.
      `,
    },
    {
      id: 'teach-asia',
      type: 'info',
      title: 'Asia remade',
      text: `
        In Asia both stories, the end of empire and the Cold War, ran together.

        - **Indonesia** declared independence in 1945. The Dutch accepted it in 1949, after
          four years of fighting.
        - **China.** Communists led by Mao Zedong won a long civil war in 1949.
        - **Korea** was divided in 1945 between a Soviet and an American zone. War raged there
          from 1950 to 1953.
        - **Vietnam** won independence from France in 1954, and then fought a war with the
          United States that lasted until 1975.
        - At **Bandung**, in Indonesia, 29 Asian and African states met in 1955, without the
          great powers, to set a course of their own.
      `,
      figure: {
        type: 'world-map', view: [66, -12, 146, 50], zoom: false, dots: false,
        regions: [
          { ids: ['ID', 'VN'], color: 'orange', label: 'Won independence: Indonesia (from the Netherlands), Vietnam (from France)' },
          { ids: ['CN'], color: 'red', label: 'China: communist government from 1949' },
          { ids: ['KP', 'KR'], color: 'blue', label: 'Korea: divided in 1945' },
        ],
        markers: ['beijing', 'seoul', 'hanoi', 'bandung'].map((id) => marker(id, { color: 'ink' })),
        alt: 'A map of South, East and Southeast Asia. Indonesia and Vietnam are coloured as countries that won independence, China as communist from 1949, and North and South Korea as a country divided in 1945. Beijing, Seoul, Hanoi and Bandung are marked.',
      },
    },
    {
      id: 'asia',
      type: 'match',
      title: 'Who, where, when',
      text: `
        **Match each place with what happened there.**
      `,
      pairs: [
        ['Indonesia, 1945 to 1949', 'Four years of fighting before the Dutch accept independence'],
        ['China, 1949', 'Communists led by Mao Zedong win a long civil war'],
        ['Bandung, 1955', '29 Asian and African states meet, without the great powers'],
        ['Vietnam, 1954 to 1975', 'Independence from France, then war with the United States'],
      ],
      explain: `
        The superpowers courted every new state with money and weapons, and backed rival sides
        in its quarrels. At **Bandung**, leaders such as Sukarno of Indonesia, Nehru of India and
        Nasser of Egypt argued for a third way, which grew into the **Non-Aligned Movement** (1961).

        In China the defeated Nationalist government withdrew to the island of Taiwan in 1949.
        The status of Taiwan has been disputed ever since.
      `,
    },
    {
      id: 'apartheid',
      type: 'choice',
      tone: 'sober',
      title: 'The last white-minority state',
      text: `
        In South Africa the descendants of European settlers kept power, and from 1948 made
        racial separation the law. They called it **apartheid**, "apartness". This sign stood on a
        beach in the city of Durban in 1989. Under a city by-law, it says, the bathing area is
        "reserved for the sole use of members of the white race group".

        **What does it tell you about how apartheid worked?**
      `,
      figure: pic('apartheid-sign', {
        alt: 'A large sign on a post on a beach, with the sea behind it and a child playing nearby. In English it reads: "City of Durban. Under section 37 of the Durban beach by-laws, this bathing area is reserved for the sole use of members of the white race group." The same notice follows in Afrikaans and in Zulu.',
        caption: 'A beach sign in Durban, South Africa, 1989',
      }),
      columns: 1,
      options: [
        { text: 'Separation was written into law and reached into everyday life', correct: true },
        { text: 'It was a private custom that the government discouraged', why: 'Read the first lines: the sign was put up by the city, and it cites a by-law.' },
        { text: 'It applied only to voting', why: 'The Black majority was indeed denied the vote, but this sign is about a beach. Benches, buses, schools and hospitals were divided too.' },
      ],
      explain: `
        The law decided where people could live, work, study and whom they could marry. Protest
        was met with bullets and prison: **Nelson Mandela** spent 27 years in jail.

        Resistance inside the country and boycotts abroad wore the system down. Mandela was
        freed in 1990, and in 1994, in the first election open to all, he became president.
      `,
    },
    {
      id: 'teach-places',
      type: 'info',
      tone: 'sober',
      title: 'Seven places, two stories',
      text: `
        Seven places sum up the lesson. Find each one on the map.

        - **Berlin**: divided by a wall from 1961 to 1989.
        - **Havana**, capital of Cuba: Soviet missiles on the island brought the world to the
          edge of nuclear war in 1962.
        - **Seoul**: Korea, divided in 1945 and at war from 1950 to 1953.
        - **Hanoi**: Vietnam, where communist forces fought first France and then the United States.
        - **Bandung**: where 29 Asian and African countries met in 1955.
        - **Accra**: capital of Ghana, independent in 1957.
        - **Delhi**: capital of India, independent in 1947.
      `,
      figure: {
        type: 'world-map', zoom: false, dots: false,
        markers: HOT_SPOTS.map((t) => marker(t.id, { color: 'red' })),
        alt: `A world map with seven places named: ${andList(HOT_SPOTS.map((t) => PLACES[t.id].name))}.`,
      },
    },
    {
      id: 'hot-spots',
      type: 'interact',
      tone: 'sober',
      review: true,
      gen: (rng) => markerQuiz(rng, {
        items: HOT_SPOTS,
        lead: 'Seven places from the years 1945 to 1990.',
        alt: 'A world map with seven lettered markers: one in central Europe, one in the Caribbean, one in West Africa, one in northern India, one in Korea, one in Vietnam and one on the island of Java.',
      }),
    },
    {
      id: 'order',
      type: 'order',
      review: true,
      text: 'Two stories, one timeline. **Put these in order, earliest first.**',
      items: inOrder(['indiaIndependence', 'chinaRevolution', 'ghana', 'cubanCrisis', 'wallFalls', 'mandelaPresident']),
      labels: ['Earliest', 'Latest'],
      explain: `
        **1947**, **1949**, **1957**, **1962**, **1989**, **1994**. Empires ended first in Asia, then in
        Africa. The Cold War outlasted them both, and ended with hardly a shot fired.
      `,
    },
    hasPic('korea-night') ? KOREA_PHOTO() : KOREA_MAP,
  ],
  recap: [
    'After 1945 the **United States** and the **Soviet Union** led two armed blocs. Nuclear weapons kept their rivalry "cold" in Europe and made it deadly elsewhere: Korea, Vietnam, Afghanistan.',
    'Meanwhile the empires dissolved: **India and Pakistan** in 1947, most of **Africa** around 1960. UN membership grew from 51 to 193.',
    'Independence came by negotiation, by non-violent pressure (Gandhi) and by war (Algeria, Vietnam). Partition, colonial borders and Cold War meddling left lasting wounds.',
    'The Berlin Wall opened in **1989**, the Soviet Union dissolved in **1991**, and apartheid ended in **1994**.',
  ],
  next: 'Next: the world since 1950, in which the number of people triples, most of them move to cities, and humanity discovers that it shares one atmosphere.',
};
