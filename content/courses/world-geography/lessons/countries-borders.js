// The World at a Glance · Lesson 7 · Lines on the Map
//
// Driving question: who draws the lines on the map, why do some wiggle while others run ruler-straight,
// and why do they keep changing?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-geography/index.js';
import { place, distanceKm } from '../../../../src/widgets/world-map.js';
import {
  UN_MEMBERS, AREAS, LANDLOCKED, LANDLOCKED_ASIA, ISLAND_COUNTRIES, COASTAL_COUNTRIES, BORDER_FEATURES, BORDER_STORIES,
  CAPITALS, USSR, MAP_CHANGES, range, countryName, listText, theName, theCountry, capital,
} from '../helpers.js';

const BIGGEST = ['RU', 'CA', 'CN', 'BR', 'AU', 'IN'];
const REGION_NAME = { africa: 'Africa', 'south-america': 'South America', europe: 'Europe' };
const VIEW_NAME = {
  'southern-africa': 'southern Africa', 'east-africa': 'East Africa', 'south-america': 'South America', 'southeast-asia': 'Southeast Asia',
  'east-asia': 'East Asia', 'southern-europe': 'southern Europe', africa: 'Africa', asia: 'Asia', 'south-asia': 'South Asia',
};
const the = (code) => (['US', 'GB', 'NL', 'PH'].includes(code) ? 'the ' : '');
const pairText = ([a, b]) => `${the(a)}${countryName(a)} and ${the(b)}${countryName(b)}`.replace(/^t/, 'T');
// Every landlocked country in the world, so that none is ever told it has a coast (the last five have only a Caspian shore, or none).
const ALL_LANDLOCKED = [...LANDLOCKED.africa, ...LANDLOCKED['south-america'], ...LANDLOCKED.europe, ...LANDLOCKED_ASIA, 'AM', 'AZ', 'KG', 'TJ', 'TM'];
// The natural borders of BORDER_FEATURES as the teaching map draws them: the rivers by the names the map knows, the
// two mountain borders as lines (the part of the Andes that Chile and Argentina share, and the Pyrenees: approximate, for drawing only).
const BORDER_RIVERS = BORDER_FEATURES.filter((f) => f.kind === 'river').map((f) => f.feature.replace('lower ', ''));
const BORDER_ANDES = range('andes').line.filter(([, lat]) => lat <= -22);
const PYRENEES = [[-1.7, 43.3], [0.7, 42.7], [3.1, 42.4]];
// Where each capital's name goes on the teaching map, so that neighbours do not sit on each other.
const CAPITAL_LABEL_POS = {
  AU: 'left', BR: 'right', CA: 'top', US: 'bottom', TR: 'top', NG: 'bottom', NZ: 'bottom', CN: 'right', PK: 'left', VN: 'right', MA: 'left', TZ: 'right', KZ: 'top', MM: 'bottom',
};

export default {
  id: 'countries-borders',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A simple question',
      text: 'The land is divided into countries, each with its borders, its flag and its government. **How many countries are there in the world?**',
      figure: { type: 'world-map', labels: 'all', alt: 'A map of the world showing the borders between countries, with the names of the larger ones.' },
      min: 100, max: 300, step: 1, start: 100,
      answer: 195, tolerance: 12,
      explain: `
        It depends on who is counting, and nobody is in charge of the list.

        - The **United Nations** has **${UN_MEMBERS}** member states, plus two observer states.
        - The Olympic Games have 206 teams and world football has 211, because some places that are not independent, such as Puerto Rico or Hong Kong, compete on their own.
        - A few places, among them Kosovo, Taiwan and Palestine, are treated as states by some governments and not by others.

        About two hundred is a fair answer. **${UN_MEMBERS}** is the number to remember.
      `,
    },
    {
      id: 'what-is-a-state',
      type: 'multi',
      mode: 'predict',
      title: 'What makes a country?',
      text: 'In 1933 a treaty signed in Montevideo, Uruguay, listed what a place needs in order to count as a **state**. It is still the usual checklist. **Which of these do you think are on it?**',
      options: [
        { text: 'A permanent population', correct: true },
        { text: 'A defined territory', correct: true },
        { text: 'A government', correct: true },
        { text: 'The ability to deal with other states', correct: true },
        { text: 'An army' },
        { text: 'A seat at the United Nations' },
      ],
      explain: `
        Four things: **people, territory, a government, and the capacity to enter into relations with other states**. No army is required (Costa Rica abolished its army in 1948), nor a seat at the UN: Switzerland joined only in 2002.

        In practice a fifth thing matters most: **recognition**. A state is fully a state when other states treat it as one, and that is where the arguments are.
      `,
    },
    {
      id: 'teach-coasts',
      type: 'info',
      title: 'Coast, no coast, all coast',
      text: `
        Geography deals every country a different hand.

        - A [landlocked]{.orange} country has no sea coast: everything it trades by ship must first cross a neighbour. There are more than forty of them, sixteen in Africa alone.
        - An [island country]{.teal} has the sea for a border and a moat.
        - Most countries are in between: on a mainland, with a coast of their own.

        **Tap a coloured country** to see its name. Zoom in for the small ones.
      `,
      figure: {
        type: 'world-map', dim: false,
        regions: [
          { ids: ALL_LANDLOCKED, color: 'orange', label: 'Landlocked' },
          { ids: ISLAND_COUNTRIES, color: 'teal', label: 'All islands (ten examples)' },
        ],
        alt: `A world map with every landlocked country in one colour and ten island countries in another. The landlocked countries cluster in the middle of Africa, in central Asia and in the heart of Europe, with two in South America. The island countries shown are ${listText(ISLAND_COUNTRIES.map(theCountry))}.`,
      },
    },
    {
      id: 'landlocked',
      type: 'interact',
      review: true,
      title: 'No way to the sea',
      gen: (rng) => {
        const region = rng.pick(['africa', 'africa', 'south-america', 'europe']);
        const list = LANDLOCKED[region];
        return {
          text: `
            A **landlocked** country has no sea coast: everything it trades by ship must first cross a neighbour. There are more than forty of them.

            **Tap any landlocked country in ${REGION_NAME[region]}.**
          `,
          widget: {
            type: 'world-map', view: region === 'europe' ? [-11, 35, 42, 60] : region, mode: 'pick', answer: list,
            alt: `A map of ${REGION_NAME[region]} without names.`,
          },
          check: (s) => {
            if (!s.picked) return false;
            if (list.includes(s.picked) || ALL_LANDLOCKED.includes(s.picked)) return true;
            return `${capital(theName(s.name))} has a sea coast. Look for a country that touches no sea at all.`;
          },
          solution: { picked: list[0] },
          hints: [region === 'south-america' ? 'There are only two, side by side in the middle of the continent.' : 'Look in the interior, away from every coast.'],
          explain: region === 'south-america'
            ? 'South America has just two landlocked countries: Bolivia and Paraguay.'
            : region === 'africa'
              ? `Africa has sixteen landlocked countries, more than any other continent: ${listText(list.map(countryName))}.`
              : `Europe's landlocked countries include ${listText(['CH', 'AT', 'CZ', 'SK', 'HU', 'RS', 'BY'].map(countryName))}, and several very small ones.`,
        };
      },
    },
    {
      id: 'shapes',
      type: 'bucket',
      gen: (rng) => {
        const picked = [
          ...rng.sample([...LANDLOCKED_ASIA, 'BO', 'PY', 'CH', 'AT', 'ET', 'ML', 'ZM', 'UG'], 3).map((id) => [id, 0]),
          ...rng.sample(ISLAND_COUNTRIES, 3).map((id) => [id, 1]),
          ...rng.sample(COASTAL_COUNTRIES, 2).map((id) => [id, 2]),
        ];
        const codes = picked.map(([id]) => id);
        return {
          text: 'The map shows eight countries. Look at each one: is it shut in by its neighbours, is it all islands, or is it on a mainland with a coast? Zoom in if you need to. **Sort these countries.**',
          // The map supplies where the eight countries are; the step asks the learner to read their situation off it.
          figure: {
            type: 'world-map', legend: false,
            regions: [{ ids: codes, color: 'blue' }],
            labels: codes.slice().sort(),
            alt: `A world map with eight countries highlighted and named: ${listText(codes.map(countryName).sort())}.`,
          },
          buckets: ['Landlocked', 'All islands', 'Mainland with a coast'],
          items: rng.shuffle(picked.map(([id, bucket]) => [countryName(id), bucket])),
          explain: 'An island country has the sea for a border and a moat. A landlocked one depends on its neighbours for every port. Most countries are in between: on a mainland, with a coast of their own.',
        };
      },
    },
    {
      id: 'sizes',
      type: 'order',
      title: 'Giants',
      text: `
        Countries come in every size. Here are the six largest, in alphabetical order.

        | Country | Area, million km² |
        |---|---:|
        ${BIGGEST.slice().sort((a, b) => countryName(a).localeCompare(countryName(b))).map((id) => `| ${countryName(id)} | ${(AREAS[id] / 1000).toFixed(1)} |`).join('\n        ')}

        **Put these six in order of area, largest first.**
      `,
      items: BIGGEST.map(countryName),
      labels: ['Largest', 'Smallest'],
      hints: ['Start with the largest number in the table.', 'Canada and China are close: compare their numbers carefully.'],
      explain: `
        In millions of km²: ${BIGGEST.map((id) => `${countryName(id)} ${(AREAS[id] / 1000).toFixed(1)}`).join(', ')}. Russia alone has about a ninth of all the land on Earth. (The United States is almost exactly the size of China; which of the two is larger depends on what is counted.)

        At the other end is **Vatican City**, in the middle of Rome: under half a square kilometre, which you can walk across in a quarter of an hour.
      `,
    },
    {
      id: 'ruler',
      type: 'choice',
      title: 'Wiggles and rulers',
      text: `
        Look at the border between Canada and the United States. In the east it wanders through lakes and along rivers. In the west it runs dead straight for about 2,000 km, and the map marks the line it follows.

        **Why is the western half straight?**
      `,
      figure: {
        type: 'world-map', view: [-135, 36, -58, 60], projection: 'mercator', zoom: false,
        regions: [{ ids: ['CA'], color: 'red', tone: 'soft', label: 'Canada' }, { ids: ['US'], color: 'yellow', tone: 'soft', label: 'United States' }],
        parallels: [{ lat: 49, label: '49° N', color: 'red', dashed: true }],
        alt: 'A map of the border between Canada and the United States. In the east the border winds through the Great Lakes. From the middle of the continent to the Pacific coast it follows a straight line, marked 49 degrees north.',
      },
      shuffle: false,
      options: [
        { text: 'It follows a long, straight river', why: 'Rivers wander. No river runs dead straight for 2,000 km. Look at the dashed line the border follows.' },
        { text: 'It follows a straight mountain ridge', why: 'Mountain ranges bend and break, and this line crosses flat plains as well as mountains. Look at the dashed line it follows.' },
        { text: 'It was drawn on a map, along a line of latitude', correct: true },
      ],
      explain: 'It is the **49th parallel**, the line of latitude 49° north of the Equator. Britain and the United States agreed on it in treaties of 1818 and 1846, largely before either had surveyed the land, and without asking the many Indigenous nations who lived on it.',
    },
    {
      id: 'teach-borders',
      type: 'info',
      title: 'Two kinds of border',
      text: `
        Some borders are **geometry**: a line of latitude or longitude, or a line ruled between two points. Others follow **nature**: a river, a mountain crest, a lake. Ten natural borders to know (zoom in to find them):

        ${BORDER_FEATURES.map((f) => `**${capital(f.feature)}** (${f.kind}): ${pairText(f.pair).replace(/^The /, 'the ')}`).join('  \n        ')}
      `,
      figure: {
        type: 'world-map', rivers: BORDER_RIVERS,
        lines: [{ points: BORDER_ANDES, curve: 'straight', color: 'red', width: 3 }, { points: PYRENEES, curve: 'straight', color: 'red', width: 3 }],
        labels: [
          { at: [-66, -36], text: 'Andes', style: 'area' },
          { at: [1, 39.5], text: 'Pyrenees', style: 'area' },
          { at: [-84, 49.5], text: 'Great Lakes', style: 'water' },
        ],
        alt: `A world map with ten natural borders drawn and named. Rivers: ${listText(BORDER_FEATURES.filter((f) => f.kind === 'river').map((f) => `the ${f.feature.replace('lower ', '')} between ${pairText(f.pair).replace(/^The /, 'the ')}`))}. Mountains: the Pyrenees between France and Spain, and the Andes between Chile and Argentina. Lakes: the Great Lakes between Canada and the United States.`,
      },
    },
    {
      id: 'natural-borders',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const f = rng.pick(BORDER_FEATURES);
        const others = rng.sample(BORDER_FEATURES.filter((x) => x !== f), 3);
        const verb = f.kind === 'river' ? 'forms' : 'form';
        return {
          text: `The **${f.feature}** ${f.kind === 'river' ? 'is a river that' : f.kind === 'lakes' ? 'are lakes that' : 'are mountains that'} ${verb} a border. **Between which two countries?**`,
          options: [
            { text: pairText(f.pair), correct: true },
            ...others.map((o) => ({ text: pairText(o.pair), why: `Their border follows the ${o.feature}.` })),
          ],
          explain: `${pairText(f.pair)}. ${f.fact}`,
        };
      },
    },
    {
      id: 'berlin',
      type: 'choice',
      title: 'The room where the rules were made',
      text: `
        Many of the straightest borders on the map are in Africa, and their story starts in this room. An artist drew this scene in Berlin in the winter of 1884 to 1885. Diplomats from fourteen governments, nearly all of them European, met there to agree on rules for claiming land in Africa.

        Look at the men round the table, and at what hangs on the wall behind them. **Who is missing from the room?**
      `,
      figure: photo(MEDIA['berlin-conference'], {
        alt: 'An engraving of a meeting room. About fifteen men in dark European suits and uniforms, most of them bearded, sit and stand round a large table covered with papers. On the wall behind them hangs a map of Africa as tall as the room, and one man is pointing up at it.',
        caption: 'The Berlin Conference, 1884 to 1885, drawn by Adalbert von Rößler',
        creditLabel: 'Drawing',
      }),
      options: [
        { text: 'Anyone from Africa', correct: true },
        { text: 'A map of the land under discussion', why: 'It is the largest thing in the room: the map of Africa on the wall.' },
        { text: 'The German hosts', why: 'They are there. The conference met in Berlin at the invitation of the German chancellor, Bismarck.' },
        { text: 'Anyone from outside Germany', why: 'Fourteen governments sent delegates, among them Britain, France, Portugal, Belgium and the United States.' },
      ],
      explain: 'Not one African ruler or envoy was invited. The conference set the rules; the borders themselves were fixed afterwards, treaty by treaty. *The Modern World* tells that story.',
    },
    {
      id: 'teach-scramble',
      type: 'info',
      title: 'The Scramble for Africa',
      text: `
        Between the 1880s and 1914, in the "Scramble for Africa", seven European powers took almost the whole continent. By 1914 only [Ethiopia and Liberia]{.green} were still independent.

        The powers settled the lines between their colonies by treaty, in Europe, often along lines of latitude and longitude across land that none of them had seen.

        Older African states had frontiers of their own, and the new lines often followed them, or a river or a lake. Where there was no such guide, above all in the deserts, the ruler decided.
      `,
      figure: {
        type: 'world-map', view: 'africa', zoom: false, dim: false,
        regions: [{ ids: ['ET', 'LR'], color: 'green', label: 'Still independent in 1914: Ethiopia and Liberia' }],
        labels: ['ET', 'LR'],
        alt: 'A map of Africa showing today\'s borders, many of them long straight lines. Two countries are highlighted and named: Ethiopia, in the east, and Liberia, on the west coast.',
      },
    },
    {
      id: 'africa',
      type: 'choice',
      title: 'Who held the ruler?',
      text: `
        Now look at Africa today. By one often-quoted estimate, nearly half the length of its borders is made of straight lines, a far larger share than in Europe or Asia. Many of them cut straight across deserts and the lands of single peoples.

        **How did that happen?**
      `,
      figure: {
        type: 'world-map', view: 'africa', zoom: false,
        alt: 'A map of Africa showing the borders between its 54 countries. Many borders, above all across the Sahara and in the south-west, are long straight lines.',
      },
      options: [
        { text: 'European governments divided the continent between them on maps, mostly between the 1880s and 1914', correct: true },
        { text: 'African kingdoms agreed on straight borders to avoid disputes', why: 'The older African states had frontiers, but not ruler-straight ones. The straight lines on today\'s map date from the colonial period.' },
        { text: 'The borders follow straight rivers', why: 'Rivers wander. A long straight border is the mark of a ruler on a map.' },
        { text: 'The United Nations drew them in 1945', why: 'They are older than the United Nations, and the UN does not draw borders.' },
      ],
      explain: `
        The straight lines are the mark of the Scramble: borders agreed between European governments, on maps, far from the land itself.

        When the colonies became independent, mostly around 1960, the new governments agreed to keep the borders they had inherited, fearing endless wars if they tried to redraw them. So lines ruled in the 1890s are still on the map, and many peoples live on both sides of one.
      `,
    },
    {
      id: 'baarle',
      type: 'choice',
      title: 'A border in a café',
      text: `
        In the village of Baarle, more than twenty small pieces of Belgium lie scattered inside the Netherlands, the leftovers of land deals between medieval lords. The border runs through streets, gardens and houses.

        Look at the line of crosses in the pavement, with **NL** on one side and **B** on the other. **What does this picture tell you about this border?**
      `,
      figure: photo(MEDIA['baarle-cafe'], {
        alt: 'A street café with wicker chairs and small round tables on a brick pavement. A line of white crosses set into grey paving stones runs from the foreground to the wall of the building, right beside the tables. A stone on one side of the line is marked NL, and a stone on the other side is marked B.',
        caption: 'The border between the Netherlands and Belgium, Baarle',
      }),
      options: [
        { text: 'People cross it freely: there is no fence, gate or guard', correct: true },
        { text: 'It follows a natural feature', why: 'It follows old property lines, straight through buildings. Nothing in nature marks it.' },
        { text: 'It is closely guarded', why: 'Café tables stand right beside it. Nobody checks anything here.' },
        { text: 'It was drawn along a line of latitude', why: 'It zigzags from plot to plot. The pieces of Belgium here are the leftovers of medieval land deals.' },
      ],
      explain: `
        A border is only as hard as the two governments make it. Belgium and the Netherlands let people pass without any check, so here the line is a curiosity, marked in the paving. Elsewhere in the world a border is a wall.

        A piece of one country completely surrounded by another, like the Belgian pieces of Baarle, is called an **enclave**.
      `,
    },
    {
      id: 'border-stories',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const story = rng.pick(BORDER_STORIES);
        return {
          text: `${story.clue}\n\n**Tap that country.**`,
          widget: {
            type: 'world-map', view: story.view, mode: 'pick', answer: story.answer,
            // Where the clue cannot be solved from the shapes alone, the neighbours it mentions are named on the map.
            ...(story.show ? { labels: story.show } : {}),
            ...(story.equator ? { parallels: ['equator'] } : {}),
            alt: `A map of ${VIEW_NAME[story.view]}${story.show ? `. Only ${listText(story.show.map(countryName))} ${story.show.length > 1 ? 'are' : 'is'} named` : ' without names'}${story.equator ? '. The Equator is drawn across it' : ''}.`,
          },
          check: (s) => s.picked === story.answer || (s.picked ? story.wrong[s.picked] || `That is ${theName(s.name)}. Read the clue again and look at the shapes of the countries.` : false),
          solution: { picked: story.answer },
          explain: story.explain,
        };
      },
    },
    {
      id: 'teach-capitals',
      type: 'info',
      title: 'Capital, or just big?',
      text: `
        A country's **capital** is where its government sits. It is often the largest city, but not always. Fourteen capitals that are *not* their country's largest city:

        ${CAPITALS.map((c) => `${countryName(c.country)}: **${c.capital.replace(', D.C.', '')}**, not ${c.largest}`).join('  \n        ')}
      `,
      figure: {
        type: 'world-map', legend: false,
        regions: [{ ids: CAPITALS.map((c) => c.country), color: 'yellow', tone: 'soft', label: 'Fourteen countries' }],
        markers: CAPITALS.map((c) => ({ at: place(c.capital), label: c.capital.replace(', D.C.', ''), shape: 'star', color: 'red', size: 's', labelPos: CAPITAL_LABEL_POS[c.country] })),
        alt: `A world map with fourteen countries highlighted and their capitals marked with stars: ${listText(CAPITALS.map((c) => `${c.capital.replace(', D.C.', '')} in ${theCountry(c.country)}`))}.`,
      },
    },
    {
      id: 'capitals',
      type: 'interact',
      review: true,
      title: 'Find the capital',
      gen: (rng) => {
        const c = rng.pick(CAPITALS);
        let cities = [{ id: 'capital', name: c.capital }, { id: 'largest', name: c.largest }, ...(c.other ? [{ id: 'other', name: c.other }] : [])];
        const short = (name) => name.replace(', D.C.', '');
        // Zoom to the cities, so that two close neighbours (Ottawa and Toronto, Rabat and Casablanca) can be told apart on a
        // phone. The third city is left out when it would force the map too far out for that.
        const window = (list) => {
          const pts = list.map((city) => place(city.name));
          let far = 0;
          let near = Infinity;
          for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) { const d = distanceKm(pts[i], pts[j]) / 111.2; far = Math.max(far, d); near = Math.min(near, d); }
          const span = Math.max(8, Math.ceil(far * 1.6));
          return { center: [pts.reduce((t, p) => t + p[0], 0) / pts.length, pts.reduce((t, p) => t + p[1], 0) / pts.length].map((v) => Math.round(v * 10) / 10), span, tight: near / span < 0.12 };
        };
        let view = window(cities);
        if (cities.length === 3 && view.tight) { cities = cities.slice(0, 2); view = window(cities); }
        const markers = rng.shuffle(cities).map((city) => ({ id: city.id, at: place(city.name), label: short(city.name), color: 'red' }));
        const country = `${the(c.country)}${countryName(c.country)}`;
        return {
          text: `
            A country's **capital** is where its government sits. It is often the largest city, but not always.

            **Tap the capital of ${country}.**
          `,
          widget: {
            type: 'world-map', view: { center: view.center, span: view.span }, mode: 'pickMarker', answer: 'capital', markers,
            regions: [{ ids: [c.country], color: 'yellow', tone: 'soft', label: countryName(c.country) }], legend: false,
            alt: `A map of part of ${country} with ${cities.length === 3 ? 'three' : 'two'} cities marked and named: ${listText(cities.map((city) => short(city.name)).sort())}.`,
          },
          check: (s) => s.picked === 'capital' || (s.picked === 'largest' ? `${short(c.largest)} is the largest city of ${country}, but the government sits elsewhere.` : s.picked === 'other' && c.other ? `${short(c.other)} is a great city, but it is not the capital.` : false),
          solution: { picked: 'capital' },
          explain: `The capital of ${country} is **${short(c.capital)}**; the largest city is ${short(c.largest)}. ${c.why}`,
        };
      },
    },
    {
      id: 'teach-changes',
      type: 'info',
      title: 'The map keeps moving',
      text: `
        The political map is younger than it looks. Five moments that changed it:

        ${MAP_CHANGES.map((e) => `- **${e.year}**: ${e.label}`).join('\n        ')}

        The Soviet Union was the largest country on Earth. The [fifteen countries]{.red} it became are coloured on the map, the largest of them Russia. **Tap them** to see their names.
      `,
      figure: {
        type: 'world-map', view: [19, 34, 130, 74], legend: false,
        regions: [{ ids: USSR, color: 'red', label: 'The fifteen countries that made up the Soviet Union until 1991' }],
        labels: USSR,
        alt: `A map of eastern Europe and northern Asia, from the Baltic Sea to the Pacific. The fifteen countries that made up the Soviet Union are highlighted: ${listText(USSR.map(countryName))}.`,
      },
    },
    {
      id: 'ussr',
      type: 'interact',
      title: 'One becomes fifteen',
      text: `
        Until 1991 the largest country on Earth was the **Soviet Union**. That year it broke up into fifteen independent countries, the largest of them Russia. Here is the same map without colours or names.

        **Tap any three of the fifteen.**
      `,
      widget: {
        type: 'world-map', view: [19, 34, 130, 74], mode: 'pickMany', max: 3, answer: USSR,
        alt: 'A map of eastern Europe and northern Asia without names, from the Baltic Sea to the Pacific.',
      },
      check: (s) => {
        const wrong = s.picked.filter((id) => !USSR.includes(id));
        if (wrong.length) {
          const id = wrong[0];
          const why = {
            PL: 'Poland was an ally of the Soviet Union, but always a separate country.', FI: 'Finland was never part of the Soviet Union.',
            MN: 'Mongolia was a close ally of the Soviet Union, but a separate country.', CN: 'China was never part of the Soviet Union.',
            RO: 'Romania was an ally of the Soviet Union, but a separate country.', TR: 'Turkey was never part of the Soviet Union.',
            IR: 'Iran was never part of the Soviet Union.', AF: 'Afghanistan was never part of the Soviet Union.',
          }[id] || `${capital(theCountry(id))} was not part of the Soviet Union.`;
          return why;
        }
        return s.count === 3 || `Choose three countries: ${3 - s.count} more to go.`;
      },
      solution: { picked: ['KZ', 'RU', 'UA'] },
      hints: ['Russia is one. The others lie along its western and southern edges: around the Baltic Sea, the Caucasus and Central Asia.'],
      explain: `
        The fifteen: ${listText(USSR.map(countryName))}.

        Fifteen new flags, fifteen governments, and thousands of kilometres of new international border, all in a few months. *The Modern World* explains why.
      `,
    },
    {
      id: 'changes',
      type: 'order',
      title: 'Younger than it looks',
      text: 'One last look back at the five moments that changed the political map. **Put them in order, earliest first.**',
      items: MAP_CHANGES.map((e) => e.label),
      labels: ['Earliest', 'Latest'],
      hints: ['The United Nations was founded at the end of the Second World War.', 'Most African countries became independent in the years around 1960; the Soviet Union lasted until the end of the Cold War.'],
      explain: `
        The United Nations was founded in ${MAP_CHANGES[0].year}; seventeen African countries became independent in ${MAP_CHANGES[1].year}, the "Year of Africa"; the Soviet Union broke up in ${MAP_CHANGES[2].year}; Timor-Leste became independent in ${MAP_CHANGES[3].year} and South Sudan in ${MAP_CHANGES[4].year}.

        The United Nations has grown from 51 members to ${UN_MEMBERS}, mostly because empires broke up into independent countries. Well over half of today's countries became independent after 1945.
      `,
    },
  ],
  recap: [
    `A state needs people, territory, a government and dealings with other states; in practice it also needs recognition. The United Nations has **${UN_MEMBERS}** members.`,
    'Some borders follow nature (rivers, mountain crests, lakes); others are straight lines agreed on a map, like the 49th parallel or many borders in Africa, drawn by European powers.',
    'Geography shapes a country\'s chances: more than forty countries are landlocked, others are all islands. A capital is not always the largest city.',
    'Borders change. Most of today\'s countries are younger than the United Nations.',
  ],
  next: 'You now carry a working map of the planet: its continents and oceans, its grid, its mountains, rivers and climates, its people and its borders. The next course, *First Worlds*, starts the story that fills it in: how people spread across every continent, and where the first farms and cities grew.',
};
