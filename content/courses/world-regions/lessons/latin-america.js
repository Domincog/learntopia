// Around the World: Places and Cultures · Lesson 7 · Latin America and the Caribbean
//
// Driving question: how did two languages from one small peninsula of Europe come to be spoken
// from the Rio Grande to Cape Horn, and what else is in the mix?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-regions/index.js';
import { FIND, PICKABLE, VIEW, FEATURES, LANDMARKS, findCountry, tapCapital, tapFeature, whichPhoto, inOrder, countriesMap, featuresMap, featureLines, landmarkFigure } from '../helpers.js';

// The countries of FIND.latinAmerica and the capitals of CAPITALS below, in the three groups they are taught in.
const MIDDLE = { ids: ['MX', 'GT', 'PA', 'CU', 'DO'], capitals: ['Mexico City', 'Guatemala City', 'Panama City', 'Havana', 'Santo Domingo'] };
const ATLANTIC = { ids: ['BR', 'AR', 'UY', 'PY'], capitals: ['Brasília', 'Buenos Aires', 'Montevideo', 'Asunción'] };
const ANDEAN = { ids: ['VE', 'CO', 'EC', 'PE', 'BO', 'CL'], capitals: ['Caracas', 'Bogotá', 'Quito', 'Lima', 'Santiago'] };
// The seven anchors that the opening map does not name (it names the Andes, the Amazon basin, Patagonia and the Caribbean Sea).
const MORE_ANCHORS = ['the Yucatán Peninsula', 'the Isthmus of Panama', 'Lake Titicaca', 'the Atacama Desert', 'the Brazilian Highlands', 'the Pampas', 'Cape Horn'];

const CAPITALS = ['Mexico City', 'Guatemala City', 'Havana', 'Panama City', 'Bogotá', 'Caracas', 'Quito', 'Lima', 'Santiago', 'Buenos Aires', 'Montevideo', 'Asunción', 'Brasília', 'Santo Domingo'];

const ANDES = [[-72, 8], [-75.5, 5], [-78, 0], [-78.5, -5], [-77, -9.5], [-74.5, -13], [-70, -16], [-68.5, -20], [-68.2, -25], [-69.8, -30], [-70, -35], [-71.5, -40], [-72.8, -46], [-73, -50], [-69.5, -54.5]];

const NEW_YORK = [-74, 40.5];
const SAN_FRANCISCO = [-122.6, 37.7];
const ROUND_THE_HORN = [NEW_YORK, [-62, 30], [-45, 10], [-33, -7], [-40, -25], [-55, -42], [-66.5, -56.6], [-78, -46], [-84, -20], [-95, 3], [-108, 17], [-114, 22.5], [-119, 30], SAN_FRANCISCO];
const THROUGH_THE_CANAL = [NEW_YORK, [-74.3, 27], [-74.2, 20], [-79.9, 9.5], [-79.5, 8.8], [-88, 9.5], [-103, 15.5], [-112.5, 22], [-118, 29.5], SAN_FRANCISCO];

export default {
  id: 'latin-america',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Whose language is it?',
      text: `
        About half a billion people speak Spanish as their first language.

        **Which country do you think has the most of them?**
      `,
      shuffle: false,
      options: [
        { text: 'Spain' },
        { text: 'Mexico', correct: true },
        { text: 'Argentina' },
        { text: 'Colombia' },
      ],
      explain: `
        **Mexico**, with about 130 million. Spain, where the language was
        born, has fewer than 50 million: about nine in ten Spanish speakers
        live in the Americas. The same goes for Portuguese: Brazil has
        twenty times as many speakers as Portugal.

        This lesson asks
        **how two languages from one small peninsula of Europe came to fill a continent and a half, and what else is in the mix.**
      `,
    },
    {
      id: 'land',
      type: 'info',
      title: 'Mountains, forest and islands',
      text: `
        "Latin America" is a label of language, not a continent: it means
        the lands from Mexico to Cape Horn where Spanish or Portuguese, both
        daughters of Latin, are spoken. Mexico belongs to North America on
        the map and to Latin America by culture, and both are right.

        Three features shape it. The [**Andes**]{.red}, the longest mountain
        range on land, run 7,000 km down the Pacific side. East of them the
        **Amazon** drains the largest rainforest on Earth and carries about
        a fifth of all the river water that reaches the oceans. And to the
        north the **Caribbean Sea** is ringed by hundreds of islands.
      `,
      figure: {
        type: 'world-map', view: VIEW.latinAmerica, rivers: ['Amazon'],
        lines: [{ points: ANDES, curve: 'straight', color: 'red', width: 4, label: 'The Andes' }],
        labels: [
          { at: [-61, -5.5], text: 'Amazon basin', style: 'area' },
          { at: [-68, -44], text: 'Patagonia', style: 'area' },
          { at: [-75, 15], text: 'Caribbean Sea', style: 'water' },
          { at: [-102, 24], text: 'Mexico', style: 'area' },
          { at: [-48, -13], text: 'Brazil', style: 'area' },
        ],
        alt: 'Latin America from Mexico to Cape Horn. A line marks the Andes all the way down the western edge of South America; the Amazon flows east across the north of the continent; the Caribbean Sea lies between the islands and the mainland.',
      },
    },
    {
      id: 'teach-anchors',
      type: 'info',
      title: 'Seven more places to steer by',
      text: [
        'You have the **Andes**, the **Amazon Basin**, the **Caribbean Sea** and **Patagonia**, the cold, windy far south. Add seven more, from north to south:',
        '',
        ...featureLines(FEATURES.latinAmerica, MORE_ANCHORS),
      ].join('\n'),
      figure: featuresMap(FEATURES.latinAmerica, { view: 'latinAmerica', names: MORE_ANCHORS, pos: { 'the Yucatán Peninsula': 'top', 'the Isthmus of Panama': 'left', 'Lake Titicaca': 'right', 'the Atacama Desert': 'left', 'the Brazilian Highlands': 'top', 'the Pampas': 'right', 'Cape Horn': 'left' } }),
    },
    {
      id: 'anchors',
      type: 'interact',
      title: 'The lie of the land',
      gen: (rng) => tapFeature(rng, FEATURES.latinAmerica, { view: 'latinAmerica', minKm: 900 }),
    },
    {
      id: 'teach-middle',
      type: 'info',
      title: 'Mexico, Central America, the Caribbean',
      text: `
        Now the countries. Each has its **capital**, the seat of its
        government, in brackets; a [red star]{.red} shows where the capital
        stands.

        **Mexico** (Mexico City) lies south of the United States, between
        the Pacific and the Gulf of Mexico. Directly south-east of it is
        **Guatemala** (Guatemala City), one of the small countries of
        Central America. The last of them is **Panama** (Panama City), on
        the narrow isthmus that joins the two Americas.

        In the Caribbean, **Cuba** (Havana) is the long island south of
        Florida. The next island, Hispaniola, is shared: the
        **Dominican Republic** (Santo Domingo) has the eastern two-thirds,
        and Haiti the rest.
      `,
      figure: countriesMap(MIDDLE.ids, { view: 'middleAmerica', capitals: MIDDLE.capitals, at: { MX: [-103.5, 24.5], GT: [-93.6, 13.2], PA: [-80.5, 6.9], CU: [-79, 23.9], DO: [-67.5, 20.7] } }),
    },
    {
      id: 'teach-atlantic',
      type: 'info',
      title: 'South America: the Atlantic side',
      text: `
        **Brazil** is the giant that fills the eastern half of South
        America. Its capital is **Brasília**, built in the interior;
        [São Paulo]{.blue}, near the coast, is far larger.

        **Argentina** (Buenos Aires) is the wide southern cone east of the
        Andes.

        Between the two giants sit two small countries whose names rhyme:
        **Uruguay** (Montevideo), on the Atlantic, and **Paraguay**
        (Asunción), landlocked, further inland.
      `,
      figure: countriesMap(ATLANTIC.ids, { view: 'southAmerica', capitals: ATLANTIC.capitals, cities: ['São Paulo'], pos: { 'São Paulo': 'right' }, at: { BR: [-52, -9], AR: [-66, -39], UY: [-50.5, -34.6], PY: [-59.5, -21.2] } }),
    },
    {
      id: 'paraguay',
      type: 'interact',
      title: 'Two that rhyme',
      text: `
        **Uruguay** and **Paraguay** are both small, both next to Argentina,
        and both named after rivers. One lies on the Atlantic coast. The
        other is landlocked, deep in the middle of the continent.

        **Tap Paraguay.**
      `,
      widget: {
        type: 'world-map', view: [-76, -41, -42, -13], mode: 'pick', pickable: PICKABLE.latinAmerica, answer: 'PY',
        alt: 'A map of the southern half of South America without names',
      },
      check: (s) => {
        if (s.picked === 'PY') return true;
        if (s.picked === 'UY') return 'That is Uruguay, the one on the coast. Paraguay has no coast: look inland, to the north-west.';
        if (s.picked === 'BO') return 'That is Bolivia, the other landlocked country of South America. Paraguay is the smaller one to its south-east.';
        return s.picked ? `That is ${s.nameThe || s.name}. Look for a small country with no coast, between Argentina, Brazil and Bolivia.` : 'Tap a country first.';
      },
      solution: { picked: 'PY' },
      hints: ['Only two countries in South America have no coast. Paraguay is the smaller of them.'],
      explain: `
        **Paraguay** is landlocked; **Uruguay** sits on the Atlantic, across
        a wide river mouth from Buenos Aires.

        Paraguay is unusual in another way. Most of its people, whatever
        their ancestry, speak **Guaraní**, an Indigenous language, as well
        as Spanish.
      `,
    },
    {
      id: 'teach-andean',
      type: 'info',
      title: 'South America: the Andean side',
      text: `
        Six countries share the Andes.

        **Venezuela** (Caracas) and **Colombia** (Bogotá) face the
        Caribbean. Colombia, next to Panama, has a Pacific coast as well.

        South of Colombia, on the Pacific, come **Ecuador** (Quito), named
        after the equator, and **Peru** (Lima). **Chile** (Santiago) is the
        ribbon between the Andes and the Pacific.

        **Bolivia** is landlocked in the mountains, between Peru and Brazil.
      `,
      figure: countriesMap(ANDEAN.ids, { view: 'southAmerica', capitals: ANDEAN.capitals, at: { CL: [-78.5, -30], EC: [-83.5, -1.8], CO: [-72.5, 2.2], VE: [-65.5, 6.5], PE: [-74.5, -8.5], BO: [-64.5, -17.5] } }),
    },
    {
      id: 'find-country',
      type: 'interact',
      review: true,
      title: 'Find the country',
      gen: (rng) => findCountry(rng, FIND.latinAmerica, PICKABLE.latinAmerica),
    },
    {
      id: 'treaty',
      type: 'interact',
      title: 'A line drawn in 1494',
      text: `
        Two years after Columbus first crossed the Atlantic, Spain and
        Portugal divided the world between them with a line down the ocean
        (see *One World*). New lands west of it would be Spain's; lands east
        of it, Portugal's. Nobody asked the people who lived there.

        The dashed line shows roughly where it fell.
        **Tap the country that grew out of Portugal's share.**
      `,
      widget: {
        type: 'world-map', view: [-95, -57, -28, 14], mode: 'pick', pickable: PICKABLE.latinAmerica, answer: 'BR',
        meridians: [{ lon: -46.5, label: 'Treaty line, 1494', color: 'red', dashed: true }],
        alt: 'A map of South America without names. A dashed line runs from north to south through the eastern bulge of the continent.',
      },
      check: (s) => {
        if (s.picked === 'BR') return true;
        if (s.picked === 'AR') return 'That is Argentina, which lay on Spain\'s side and speaks Spanish. Which country does the line itself pass through?';
        return s.picked ? `That is ${s.nameThe || s.name}, on Spain's side of the line. Which country does the line itself pass through?` : 'Tap a country first.';
      },
      solution: { picked: 'BR' },
      hints: ['Only one country in the Americas speaks Portuguese.'],
      explain: `
        **Brazil.** Portuguese settlers later pushed far to the west of the
        line, which is why Brazil is so large, but the treaty is the reason
        it speaks Portuguese while its neighbours speak Spanish.

        Other empires took smaller pieces, and their languages remain too:
        French in Haiti (beside Haitian Creole), English in Jamaica, Belize
        and Guyana, Dutch in Suriname.
      `,
    },
    {
      id: 'words',
      type: 'bucket',
      review: true,
      title: 'Words that crossed the ocean',
      text: `
        The older languages of the Americas are alive: millions of people
        speak **Quechua** in the Andes, **Nahuatl** and **Maya** languages
        in Mexico and Guatemala, and **Guaraní** in Paraguay. They have also
        given words to the whole world.

        **Sort these English words by the language they came from.** Think
        about where each thing is from: foods first grown in Mexico, animals
        of the high Andes, and things Columbus's crews first met in the
        Caribbean.
      `,
      buckets: ['Nahuatl (Mexico)', 'Quechua (the Andes)', 'Taíno (the Caribbean)'],
      items: [
        { text: 'chocolate', bucket: 0 },
        { text: 'tomato', bucket: 0 },
        { text: 'avocado', bucket: 0 },
        { text: 'llama', bucket: 1 },
        { text: 'puma', bucket: 1 },
        { text: 'condor', bucket: 1 },
        { text: 'hurricane', bucket: 2 },
        { text: 'canoe', bucket: 2 },
        { text: 'hammock', bucket: 2 },
      ],
      explain: `
        **Nahuatl**, the language of the Aztecs, gave us *chocolate*,
        *tomato* and *avocado*. **Quechua**, the language of the Incas, gave
        *llama*, *puma* and *condor*. **Taíno**, spoken on the islands where
        Columbus landed, gave *hurricane*, *canoe* and *hammock*.

        Every one of them reached English by way of Spanish: a small record
        of who met whom, and where.
      `,
    },
    {
      id: 'teach-heritage',
      type: 'info',
      title: 'Three heritages',
      text: `
        Latin America's people descend from three great groups: its
        **Indigenous** peoples, **Europeans**, and **Africans**, most of
        whose ancestors were brought across the Atlantic enslaved, nearly
        half of them to Brazil (see *One World*). Its music is where you
        can hear all three at once.

        - **Samba** grew among Afro-Brazilians in Rio de Janeiro.
        - **Tango** grew in the ports of Buenos Aires and Montevideo, in
          Argentina and Uruguay.
        - **Reggae** comes from Jamaica, and **son** and **rumba**, the
          roots of salsa, from Cuba.
        - **Mariachi** is the music of Mexico.
      `,
      figure: {
        type: 'world-map', view: VIEW.latinAmerica, dots: false, legend: false, dim: false,
        regions: [{ ids: ['BR', 'AR', 'UY', 'JM', 'CU', 'MX'], color: 'orange', tone: 'soft' }],
        labels: [
          { at: [-50, -11], text: 'Samba', style: 'area' },
          { at: [-64, -35], text: 'Tango', style: 'area' },
          { at: [-102.5, 24], text: 'Mariachi', style: 'area' },
          { at: [-79, 25.2], text: 'Son, rumba', style: 'area' },
          { at: [-77.3, 15], text: 'Reggae', style: 'area' },
        ],
        alt: 'A map of Latin America with the home of each music named: mariachi in Mexico, son and rumba in Cuba, reggae in Jamaica, samba in Brazil, tango in Argentina and Uruguay.',
      },
    },
    {
      id: 'blend',
      type: 'match',
      title: 'Whose music?',
      text: '**Match each music to its home.**',
      pairs: [
        ['Samba', 'Brazil'],
        ['Tango', 'Argentina and Uruguay'],
        ['Reggae', 'Jamaica'],
        ['Mariachi', 'Mexico'],
        ['Son and rumba, the roots of salsa', 'Cuba'],
      ],
      explain: `
        Samba is Brazil's, tango belongs to Argentina and Uruguay, reggae to
        Jamaica, mariachi to Mexico, son and rumba to Cuba. African rhythms,
        European instruments and Indigenous traditions run through all of
        them.

        Festivals blend in the same way. Carnival joins the Catholic
        calendar to African music and dance. Mexico's Day of the Dead joins
        Catholic All Souls' Day to far older Indigenous ways of honouring
        ancestors.
      `,
    },
    {
      id: 'machu-picchu',
      type: 'interact',
      title: 'Farming a mountainside',
      text: `
        The Incas built **Machu Picchu** about 1450, on a ridge 2,400 metres
        up in the Andes of Peru. There is hardly a flat patch of ground for
        kilometres around.

        So how did its people grow maize and potatoes?
        **Tap the feature that made farming possible.**
      `,
      widget: photo(MEDIA['machu-picchu'], {
        alt: `${LANDMARKS['machu-picchu'].alt}. Four parts are ringed: the grassy steps in the foreground, the row of stone houses, a stone staircase, and the steep peak behind.`,
        hotspots: [
          { id: 'terraces', x: 0.27, y: 0.78, r: 0.07, label: 'Terraces: level fields held up by stone walls', alt: 'broad grassy steps held up by stone walls' },
          { id: 'houses', x: 0.79, y: 0.53, r: 0.06, label: 'Houses: the thatched roofs are gone', alt: 'a row of roofless stone houses with pointed gables' },
          { id: 'stairs', x: 0.87, y: 0.8, r: 0.05, label: 'Stairway', alt: 'a long stone staircase' },
          { id: 'peak', x: 0.23, y: 0.3, r: 0.07, label: 'Huayna Picchu', alt: 'a steep green peak behind the ruins' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'terraces') return true;
        if (s.picked === 'houses') return 'Those are houses and storerooms. Crops need level, well-drained soil: where has some been made?';
        if (s.picked === 'stairs') return 'The stairs link one level to the next. What are the levels themselves?';
        if (s.picked === 'peak') return 'Far too steep to farm. Look at what the builders did to the slope in the foreground.';
        return 'Tap one of the numbered rings.';
      },
      solution: { picked: 'terraces' },
      hints: ['Look for something that turns a slope into a staircase of small level fields.'],
      explain: `
        **Terraces**: stone walls holding up strips of level soil, with
        gravel underneath to drain the heavy rain. The Incas (see
        *Crossroads*) built them across the Andes, without iron tools,
        wheeled carts or draught animals, and many are still farmed.

        Machu Picchu was never really "lost". Farming families were living
        on its terraces in 1911, when a local guide led the American
        explorer Hiram Bingham up to it.
      `,
    },
    {
      id: 'teach-landmarks',
      type: 'info',
      title: 'A pyramid and a statue',
      text: `
        Two more sights to know beside Machu Picchu.

        The **pyramid of Chichén Itzá** stands on the Yucatán Peninsula, in
        Mexico. ${LANDMARKS['chichen-itza'].fact}

        **Christ the Redeemer** looks down on Rio de Janeiro, in Brazil.
        ${LANDMARKS['christ-the-redeemer'].fact}
      `,
      figure: [
        landmarkFigure('chichen-itza', { aspect: '4:3', fit: 'cover' }),
        landmarkFigure('christ-the-redeemer', { aspect: '4:3', fit: 'cover', focus: [0.5, 0.2] }),
      ],
    },
    {
      id: 'which-landmark',
      type: 'choice',
      review: true,
      gen: (rng) => whichPhoto(rng, ['machu-picchu', 'chichen-itza', 'christ-the-redeemer'], ['machu-picchu', 'chichen-itza', 'christ-the-redeemer', 'borobudur', 'giza-pyramids', 'angkor-wat']),
    },
    {
      id: 'when',
      type: 'order',
      title: 'Before and after 1492',
      text: `
        Columbus crossed the Atlantic in 1492. Spain then ruled most of the
        region for about three centuries, until Mexico and Peru broke away
        in 1821. The Panama Canal opened in 1914.

        **Put these in order, earliest first.**
      `,
      items: inOrder(['chichen-itza', 'machu-picchu', 'columbus', 'latin-independence', 'panama-canal']),
      labels: ['Earliest', 'Latest'],
      hints: ['Two of these were built before Columbus sailed; the Maya pyramid, about 1,000 years old, is the older.', 'The Incas built Machu Picchu about 1450, only a few decades before Columbus.'],
      explain: `
        Chichén Itzá (about 1000), Machu Picchu (about 1450), Columbus
        (1492), independence for Mexico and Peru (1821), the Panama Canal
        (1914).

        Machu Picchu was only a few decades old when Columbus sailed.
        And Mexico City, today one of the largest cities in the world,
        stands on top of Tenochtitlan, the Aztec capital (see *Crossroads*).
      `,
    },
    {
      id: 'capitals',
      type: 'interact',
      review: true,
      title: 'Capitals',
      gen: (rng) => tapCapital(rng, CAPITALS, { view: 'latinAmerica', minKm: 800 }),
    },
    {
      id: 'canal',
      type: 'choice',
      stretch: true,
      title: 'The short cut',
      text: `
        Until 1914 a ship sailing from New York to San Francisco had to go
        all the way round Cape Horn, at the stormy tip of South America
        ([red]{.red}). Then a canal 80 km long was cut through Panama
        ([blue]{.blue}).

        **Roughly how much shorter did the voyage become?**
      `,
      figure: {
        type: 'world-map', view: [-140, -60, -25, 45],
        lines: [
          { points: ROUND_THE_HORN, color: 'red', width: 3, label: 'Round Cape Horn' },
          { points: THROUGH_THE_CANAL, color: 'blue', width: 3, label: 'Through the Panama Canal' },
        ],
        markers: [{ at: NEW_YORK, label: 'New York', labelPos: 'right' }, { at: SAN_FRANCISCO, label: 'San Francisco', labelPos: 'left' }, { at: [-79.7, 9.1], label: 'Panama', shape: 'square', labelPos: 'right' }],
        alt: 'The Americas with two sea routes from New York to San Francisco. One runs all the way down the Atlantic, round the southern tip of South America and back up the Pacific. The other cuts through the narrow isthmus of Panama.',
      },
      shuffle: false,
      options: [
        { text: 'About a tenth shorter' },
        { text: 'About a quarter shorter' },
        { text: 'More than half shorter', correct: true },
      ],
      explain: `
        **More than half.** Round the Horn the voyage was about 22,500 km;
        through the canal it is about 9,500 km.

        That is why a narrow strip of Central America matters to the whole
        world, just as Suez and the Strait of Malacca do.
      `,
    },
    {
      id: 'amazon',
      type: 'multi',
      mode: 'predict',
      title: 'Why the forest matters',
      text: `
        The Amazon rainforest is often called "the lungs of the Earth". That
        is a myth: a mature forest uses up about as much oxygen as it makes.

        **Which of these do you think are real reasons why the forest matters to the whole world?**
      `,
      options: [
        { text: 'Its trees hold a vast store of carbon', correct: true },
        { text: 'It is home to perhaps a tenth of all known species', correct: true },
        { text: 'It makes much of its own rain, which also waters farms far to the south', correct: true },
        { text: 'Without it, the world would run short of oxygen within a few years', why: 'The air holds an enormous reserve of oxygen, built up over hundreds of millions of years. Losing the forest would not change that noticeably.' },
      ],
      explain: `
        **Carbon, species and rain.** Burning or clearing the forest
        releases its carbon and adds to global warming (see
        *The Modern World*). No other place on land has so many kinds of plants and
        animals. And moisture breathed out by the trees falls again as rain,
        some of it on the farms of southern Brazil and Argentina.
      `,
    },
  ],
  recap: [
    'Latin America runs from Mexico to Cape Horn. Its spine is the Andes, its heart the Amazon basin, its northern edge the Caribbean.',
    'Spanish is spoken almost everywhere, Portuguese in Brazil: a division that goes back to a treaty line of 1494. Quechua, Guaraní, Nahuatl and Maya languages are alive too.',
    'Its people and its music blend Indigenous, European and African heritage.',
    'Machu Picchu (Inca), Chichén Itzá (Maya) and the Panama Canal mark three ages: before 1492, and the modern world.',
  ],
  next: 'Next, the last stop: north to the United States and Canada, and then a look back over the whole journey.',
};
