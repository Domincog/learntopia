// Around the World: Places and Cultures · Lesson 2 · Where Three Continents Meet
//
// Driving question: this region is mostly desert, so why has it been one of the world's great
// crossroads for five thousand years?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-regions/index.js';
import { FIND, PICKABLE, VIEW, FEATURES, LANDMARKS, findCountry, tapCapital, tapFeature, whichPhoto, cityMarker, yearOf, countriesMap, featuresMap, featureLines, landmarkFigure } from '../helpers.js';

// The countries of FIND.mena and the capitals of CAPITALS below, in the three groups they are taught in.
const MAGHREB = { ids: ['MA', 'DZ', 'TN', 'LY'], capitals: ['Rabat', 'Algiers', 'Tunis', 'Tripoli'] };
const ARABIA = { ids: ['SA', 'YE', 'OM', 'AE', 'QA', 'KW'], capitals: ['Riyadh', 'Muscat', 'Abu Dhabi', 'Doha', 'Kuwait City'] };
const HEART = { ids: ['EG', 'TR', 'SY', 'JO', 'IQ', 'IR'], capitals: ['Cairo', 'Ankara', 'Damascus', 'Amman', 'Baghdad', 'Tehran'] };
const GATES = ['the Strait of Gibraltar', 'the Bosphorus', 'the Suez Canal', 'the Bab-el-Mandeb', 'the Strait of Hormuz'];      // west to east, as the text lists them

const ARABIC = ['MA', 'EH', 'DZ', 'TN', 'LY', 'EG', 'SD', 'SA', 'YE', 'OM', 'AE', 'QA', 'BH', 'KW', 'IQ', 'SY', 'JO', 'LB', 'PS', 'MR'];
const CAPITALS = ['Rabat', 'Algiers', 'Tunis', 'Tripoli', 'Cairo', 'Riyadh', 'Muscat', 'Baghdad', 'Tehran', 'Ankara', 'Damascus', 'Amman', 'Abu Dhabi', 'Doha', 'Kuwait City'];

const TOL = 250;                                 // years: how close a card must be on the timeline
const CARDS = [
  { id: 'pyramids', label: 'Great Pyramid', answer: yearOf('giza-pyramids'), near: 'The pyramids are far older than that: they were already ancient when Petra was carved.' },
  { id: 'hagia', label: 'Hagia Sophia', answer: yearOf('hagia-sophia'), near: 'Hagia Sophia was finished less than a century before the fixed marker for the start of the Islamic calendar.' },
  { id: 'suez', label: 'Suez Canal', answer: yearOf('suez'), near: 'The canal belongs to the age of steamships: the nineteenth century.' },
];

export default {
  id: 'middle-east-north-africa',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A country that is a river',
      text: `
        Egypt is a big country: a million square kilometres, and more than
        110 million people. On the map, the green strip is the Nile.

        **What share of Egyptians do you think live within 20 km of the Nile and its delta?**
      `,
      figure: {
        type: 'world-map', view: { ids: ['EG'], pad: 0.15 }, static: true, rivers: ['Nile'],
        regions: [{ ids: ['EG'], color: 'yellow', tone: 'soft' }], legend: false,
        areas: [{ polygon: [[29.6, 31.2], [31, 31.7], [32.6, 31.2], [31.5, 30], [31.4, 28], [32.9, 25.9], [33.2, 24], [32.6, 24], [32.4, 25.8], [30.7, 28], [30.9, 30]], color: 'green' }],
        markers: [cityMarker('Cairo', { labelPos: 'right' })],
        alt: 'A map of Egypt: a narrow green strip follows the Nile from south to north and widens into a triangular delta at the Mediterranean; Cairo sits where the delta begins. Everything else is desert.',
      },
      min: 0, max: 100, step: 5, start: 0, answer: 95, tolerance: 5, unit: '%',
      explain: `
        About **95%**, on about 5% of the land. The rest of Egypt is almost
        empty desert.

        That is this whole region in miniature: from Morocco to Iran it is
        mostly dry. So here is the puzzle for this lesson.
        **Why has so dry a place been one of the world's great crossroads for 5,000 years?**
      `,
    },
    {
      id: 'land',
      type: 'info',
      title: 'Water draws the map',
      text: `
        The largest belt of desert on Earth runs through this region: the
        **Sahara**, then the deserts of Arabia and Iran. People gather where
        there is water:

        - along the **Nile**, and the **Tigris** and **Euphrates** (the lands
          of the first cities, which you met in *First Worlds*);
        - on the rainy coasts and mountains of the north: the Maghreb, the
          eastern Mediterranean, Turkey and northern Iran.

        The name "Middle East" was coined by outsiders around 1900: midway
        between Europe and East Asia. In Arabic the two halves have their own
        names: the *Maghreb* ("the west") and the *Mashriq* ("the east").
      `,
      figure: {
        type: 'world-map', view: VIEW.mena, rivers: ['Nile', 'Tigris', 'Euphrates'],
        labels: [
          { at: [8, 24], text: 'Sahara', style: 'area' },
          { at: [46, 21.5], text: 'Arabian Peninsula', style: 'area' },
          { at: [-3, 32.5], text: 'Maghreb', style: 'area' },
          { at: [18, 35], text: 'Mediterranean Sea', style: 'water' },
          { at: [37.5, 21.5], text: 'Red Sea', style: 'water' },
          { at: [51.5, 26.8], text: 'Persian Gulf', style: 'water' },
          'TR', 'IR', 'EG',
        ],
        alt: 'North Africa and the Middle East from Morocco to Iran. The Sahara fills North Africa and desert covers the Arabian Peninsula; the Nile runs north through Egypt, and the Tigris and Euphrates run south-east through Iraq to the Persian Gulf.',
      },
    },
    {
      id: 'teach-gates',
      type: 'info',
      title: 'Five narrow gates',
      text: [
        'Here three continents meet, and the seas between them squeeze through five narrow passages. Every ship that sails between Europe, Asia and East Africa must use one of them. From west to east:',
        '',
        ...featureLines(FEATURES.mena, GATES),
      ].join('\n'),
      figure: featuresMap(FEATURES.mena, { view: 'mena', names: GATES, pos: { 'the Bosphorus': 'top', 'the Suez Canal': 'bottom', 'the Strait of Hormuz': 'left', 'the Bab-el-Mandeb': 'left' } }),
    },
    {
      id: 'gates',
      type: 'interact',
      title: 'Find the gate',
      gen: (rng) => {
        const step = tapFeature(rng, FEATURES.mena, { view: 'mena', minKm: 550 });
        return { ...step, text: `Here three continents meet, and the seas between them squeeze through five narrow passages. ${step.text}` };
      },
    },
    {
      id: 'teach-maghreb',
      type: 'info',
      title: 'The Maghreb',
      text: `
        Now the countries. Each has its **capital**, the seat of its
        government, in brackets; a [red star]{.red} shows where the capital
        stands.

        Four countries line the south shore of the Mediterranean.
        **Morocco** (Rabat) is the north-west corner of Africa, facing
        Spain. **Algeria** (Algiers) is the giant next to it. Small
        **Tunisia** (Tunis) sits at Africa's northern tip, and **Libya**
        (Tripoli) lies between Tunisia and Egypt.

        The map shows only their northern edge. Algeria and Libya stretch
        far south into the Sahara.
      `,
      figure: countriesMap(MAGHREB.ids, { view: 'maghreb', capitals: MAGHREB.capitals, at: { MA: [-6.5, 31.6], DZ: [3, 32], TN: [9.6, 33.6], LY: [17.5, 30.6] } }),
    },
    {
      id: 'teach-arabia',
      type: 'info',
      title: 'The Arabian Peninsula',
      text: `
        Far to the east, **Saudi Arabia** (Riyadh) covers most of the Arabian
        Peninsula. **Yemen** is the peninsula's south-west corner, at the
        mouth of the Red Sea. **Oman** (Muscat) is its south-east corner,
        facing the Arabian Sea.

        Three small states sit on the Persian Gulf: **Kuwait** (Kuwait City)
        at its head, **Qatar** (Doha) on a thumb of land half-way down, and
        the **United Arab Emirates** (Abu Dhabi) near its narrow exit.
      `,
      figure: countriesMap(ARABIA.ids, { view: [33, 11, 61, 33], capitals: ARABIA.capitals, at: { KW: [44.6, 29.9], QA: [51.6, 27.2], AE: [54.3, 22.9] } }),
    },
    {
      id: 'oil-and-water',
      type: 'choice',
      stretch: true,
      title: 'Oil and water',
      text: `
        The countries around the Persian Gulf hold nearly half of the world's
        known oil. Most of them have almost no rivers.

        Kuwait, Qatar and Bahrain get most of their drinking water from the
        sea, by removing the salt, which uses a great deal of energy.
        **Why is that possible here in particular?**
      `,
      options: [
        { text: 'Removing salt takes a great deal of energy, and they have plenty of cheap energy', correct: true },
        { text: 'The Gulf is less salty than other seas', why: 'The opposite: the Gulf is shallow and hot, water evaporates fast, and it is saltier than the open ocean.' },
        { text: 'The coast gets plenty of rain to mix with the seawater', why: 'These are among the driest inhabited places on Earth.' },
        { text: 'Canals bring them fresh water from the Tigris and Euphrates', why: 'No such canals exist; Iraq needs all the water those rivers carry.' },
      ],
      explain: `
        Turning seawater into drinking water is costly in energy, and oil and
        gas are what the Gulf has. Saudi Arabia, the largest country in the
        world without a permanent river, makes more desalinated water than
        any other country.

        Oil money also built the Gulf's new skylines: when Dubai's Burj
        Khalifa (828 metres) opened in 2010, it became the tallest building
        in the world.
      `,
    },
    {
      id: 'teach-heart',
      type: 'info',
      title: 'From the Nile to Iran',
      text: `
        Between the Maghreb and Arabia lies the old heart of the region.

        **Egypt** (Cairo) is the north-east corner of Africa, on the Nile.
        **Turkey** (Ankara) is the broad peninsula between the Black Sea and
        the Mediterranean. South of Turkey come **Syria** (Damascus), on the
        Mediterranean, and **Jordan** (Amman), east of the Jordan River.

        **Iraq** (Baghdad) is the land of the Tigris and the Euphrates.
        Beyond it lies big **Iran** (Tehran), between the Caspian Sea and the
        Persian Gulf.
      `,
      figure: countriesMap(HEART.ids, { view: [24, 21, 64, 43], capitals: HEART.capitals, at: { IQ: [42.6, 31.6], JO: [37.4, 30.4], SY: [38.6, 35.2] } }),
    },
    {
      id: 'find-country',
      type: 'interact',
      review: true,
      title: 'Find the country',
      gen: (rng) => findCountry(rng, FIND.mena, PICKABLE.mena),
    },
    {
      id: 'languages',
      type: 'info',
      title: 'Not everyone here is an Arab',
      text: `
        **Arabic** is the main language from Morocco to Iraq: more than twenty
        countries. But several of the region's peoples speak something
        else:

        - **Persian** in Iran. It is written in Arabic letters, but it is a
          distant cousin of English: *mādar, pedar, barādar, dokhtar* mean
          mother, father, brother, daughter.
        - **Turkish** in Turkey, written in Latin letters since 1928.
        - **Hebrew** in Israel.

        The **Kurds**, 30 million people or more, have their own language and
        no state of their own. And across the Maghreb millions speak
        **Amazigh** (Berber) languages, which were there long before Arabic.
      `,
      figure: {
        type: 'world-map', view: VIEW.mena,
        regions: [
          { ids: ARABIC, color: 'green', label: 'Arabic' },
          { ids: ['IR'], color: 'violet', label: 'Persian' },
          { ids: ['TR'], color: 'red', label: 'Turkish' },
          { ids: ['IL'], color: 'blue', label: 'Hebrew' },
        ],
        areas: [{ polygon: [[37, 37.4], [39, 39.4], [43, 40], [45.5, 38.5], [47.5, 35.6], [46, 33.9], [44, 35], [42, 36.5], [40, 36.7], [38, 36.7]], color: 'orange', dashed: true, label: 'Kurdish (roughly)', labelAt: [43.5, 37.3] }],
        labels: ['IR', 'TR', 'EG', 'SA'],
        alt: 'The region coloured by main language: Arabic from Morocco and Mauritania across North Africa and the Arabian Peninsula to Iraq; Turkish in Turkey; Persian in Iran; Hebrew in Israel. A dashed outline where Turkey, Syria, Iraq and Iran meet shows roughly where most Kurds live.',
      },
    },
    {
      id: 'not-arabic',
      type: 'multi',
      review: true,
      text: 'In which of these countries is Arabic **not** the main language?',
      options: [
        { text: 'Iran', correct: true },
        { text: 'Turkey', correct: true },
        { text: 'Israel', correct: true },
        { text: 'Egypt' },
        { text: 'Iraq' },
        { text: 'Morocco' },
      ],
      explain: `
        Iranians speak **Persian**, Turks speak **Turkish**, and most Israelis
        speak **Hebrew**. Egypt, Iraq and Morocco are Arabic-speaking.

        Keep three words apart. *Arab* is about language and culture.
        *Muslim* is about religion: most of the world's Muslims are not Arabs
        (the largest Muslim populations are in Indonesia, Pakistan, India and
        Bangladesh), and there are Arab Christians in Egypt, Lebanon and
        beyond. *Middle Eastern* is only geography.
      `,
    },
    {
      id: 'teach-holy-cities',
      type: 'info',
      title: 'Three faiths, one small corner',
      text: `
        Judaism, Christianity and Islam all began here, and all three honour
        Abraham and worship one God.

        [**Jerusalem**]{.green} is holy to all three: the Western Wall, the
        Church of the Holy Sepulchre and the Dome of the Rock stand within a
        short walk of one another.

        Islam began in the seventh century in [**Mecca**]{.green}, the
        birthplace of Muhammad, in western Arabia near the Red Sea. Muslims
        everywhere turn towards Mecca to pray. [**Medina**]{.green}, about
        350 km further north, is where Muhammad is buried: the second
        holiest city of Islam.
      `,
      figure: {
        type: 'world-map', view: [26, 15, 54, 43], dots: false,
        markers: [
          { at: [29.01, 41.11], label: 'Istanbul', color: 'gray', size: 's' },
          { at: [31.25, 30.05], label: 'Cairo', color: 'gray', size: 's', labelPos: 'left' },
          { at: [44.39, 33.34], label: 'Baghdad', color: 'gray', size: 's' },
          { at: [35.21, 31.78], label: 'Jerusalem', color: 'green', shape: 'star' },
          { at: [39.58, 24.5], label: 'Medina', color: 'green', shape: 'star' },
          { at: [39.82, 21.43], label: 'Mecca', color: 'green', shape: 'star' },
        ],
        alt: 'A map from Turkey to the south of the Arabian Peninsula. Green stars mark three holy cities: Jerusalem near the eastern Mediterranean, and Medina and Mecca in western Arabia, a short way inland from the Red Sea, Mecca the further south. Grey dots mark Istanbul, Cairo and Baghdad.',
      },
    },
    {
      id: 'holy-cities',
      type: 'interact',
      title: 'The city of the hajj',
      text: `
        Five times a day, Muslims everywhere turn to face one city, and each
        year about two million travel to it on the pilgrimage called the
        *hajj*. Here is the same map without names. **Tap that city.**
      `,
      widget: {
        type: 'world-map', view: [26, 15, 54, 43], mode: 'pickMarker', markerLabels: 'after', answer: 'mecca',
        markers: [
          { id: 'istanbul', at: [29.01, 41.11], label: 'Istanbul' },
          { id: 'cairo', at: [31.25, 30.05], label: 'Cairo' },
          { id: 'jerusalem', at: [35.21, 31.78], label: 'Jerusalem' },
          { id: 'medina', at: [39.58, 24.5], label: 'Medina' },
          { id: 'mecca', at: [39.82, 21.43], label: 'Mecca' },
          { id: 'baghdad', at: [44.39, 33.34], label: 'Baghdad' },
        ],
        alt: 'A map from Turkey to the south of the Arabian Peninsula with six unnamed city markers',
      },
      check: (s) => {
        if (s.picked === 'mecca') return true;
        if (s.picked === 'medina') return 'Close. That is Medina, where Muhammad is buried: the second holiest city of Islam. The city of the hajj lies about 350 km further south.';
        if (s.picked === 'jerusalem') return 'That is Jerusalem, a holy city for Jews, Christians and Muslims alike. But the hajj goes to a city in western Arabia.';
        if (s.picked === 'cairo') return 'That is Cairo, the largest city of the Arab world. The city of the hajj is in western Arabia, near the Red Sea.';
        if (s.picked === 'istanbul') return 'That is Istanbul. Look far to the south-east, in western Arabia.';
        if (s.picked === 'baghdad') return 'That is Baghdad, on the Tigris. Look south-west, near the Red Sea coast of Arabia.';
        return 'Tap one of the markers.';
      },
      solution: { picked: 'mecca' },
      hints: ['It is in Saudi Arabia, a short way inland from the Red Sea.', 'Two markers are in western Arabia. It is the southern one.'],
      explain: `
        **Mecca**, the southern of the two holy cities of western Arabia
        (*Crossroads* tells how Islam began there). Most Muslims are
        **Sunni**; the **Shia**, who differ over who should have led the
        community after Muhammad, are the majority in Iran, Iraq and Bahrain.

        Who should govern **Jerusalem**, holy to all three faiths, is among
        the most disputed questions in world politics.
      `,
    },
    {
      id: 'hagia-sophia',
      type: 'interact',
      title: 'A building that changed religion',
      text: `
        This is **Hagia Sophia** in Istanbul. It was finished in 537 as the
        greatest church of the Christian eastern Roman empire. In 1453 the
        Ottoman Turks took the city and made the church a mosque.

        Mosques have towers from which the call to prayer is given.
        **Tap a part of the building that was added after 1453.**
      `,
      widget: photo(MEDIA['hagia-sophia'], {
        alt: `${LANDMARKS['hagia-sophia'].alt}. Four parts are ringed: the central dome, the main walls with a great arch, and two of the towers.`,
        hotspots: [
          { id: 'dome', x: 0.54, y: 0.36, r: 0.07, label: 'Dome, 537 (rebuilt 562)', alt: 'the wide central dome' },
          { id: 'walls', x: 0.47, y: 0.53, r: 0.06, label: 'The church walls, 537', alt: 'the main walls, with a great arch' },
          { id: 'minaret-left', x: 0.2, y: 0.4, r: 0.055, label: 'Ottoman minaret', alt: 'a slender white tower with a pointed top, on the left' },
          { id: 'minaret-right', x: 0.735, y: 0.36, r: 0.055, label: 'Ottoman minaret', alt: 'a slender red-brick tower with a pointed top, on the right' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'minaret-left' || s.picked === 'minaret-right') return true;
        if (s.picked === 'dome') return 'The dome is the heart of the original church: 31 metres across and 55 metres above the floor. Which parts would a church not need?';
        if (s.picked === 'walls') return 'Those walls and the great arch belong to the church of 537. Which parts would a church not need?';
        return 'Tap one of the numbered rings.';
      },
      solution: { picked: 'minaret-right' },
      hints: ['The call to prayer is given from a tall, thin tower called a minaret.'],
      explain: `
        The four **minarets** are Ottoman additions; the dome and the walls
        are the church of 537. The building was a church for nine centuries
        and a mosque for nearly five; it was a museum from 1935, and has been
        a mosque again since 2020.

        Its dome became the model for the great Ottoman mosques, so a
        Christian church shaped the skyline of a Muslim city.
      `,
    },
    {
      id: 'teach-landmarks',
      type: 'info',
      title: 'Built, and carved',
      text: `
        Two more monuments to know, both older than Hagia Sophia.

        The **pyramids of Giza** stand beside Cairo.
        ${LANDMARKS['giza-pyramids'].fact}

        The **Treasury at Petra**, in Jordan, was not built but carved, about
        2,000 years ago. ${LANDMARKS['petra-treasury'].fact}
      `,
      figure: [
        landmarkFigure('giza-pyramids', { aspect: '4:3', fit: 'cover' }),
        landmarkFigure('petra-treasury', { aspect: '4:3', fit: 'cover', focus: [0.5, 0.45] }),
      ],
    },
    {
      id: 'which-landmark',
      type: 'choice',
      review: true,
      gen: (rng) => whichPhoto(rng, ['giza-pyramids', 'petra-treasury', 'hagia-sophia'], ['giza-pyramids', 'petra-treasury', 'hagia-sophia', 'parthenon', 'taj-mahal', 'st-basils']),
    },
    {
      id: 'when',
      type: 'interact',
      title: 'Forty-five centuries on one line',
      text: `
        **Drag each card to its place.** Two markers are fixed to help you.

        - The Great Pyramid was already 2,500 years old when Petra was carved.
        - Hagia Sophia was finished less than a century before Islam began.
        - The Suez Canal belongs to the age of steamships.

        Anywhere within ${TOL} years counts.
      `,
      widget: {
        type: 'timeline', from: -3000, to: 2100, step: 500, snap: 50,
        events: [
          { year: yearOf('petra-treasury'), label: 'Petra\'s Treasury carved', short: 'Petra', color: 'gray' },
          { year: yearOf('hijra'), label: 'Islamic calendar begins (622)', short: '622', color: 'gray' },
        ],
        place: CARDS.map(({ id, label, answer }) => ({ id, label, answer })),
        alt: 'A timeline from 3000 BCE to today with two fixed markers, Petra about 2,000 years ago and the year 622, and three cards to place: the Great Pyramid, Hagia Sophia and the Suez Canal',
      },
      check: (s) => {
        if (!s.complete) return 'Place all three cards on the line.';
        for (const card of CARDS) if (Math.abs(s.placed[card.id] - card.answer) > TOL) return card.near;
        return true;
      },
      solution: { placed: { pyramids: -2550, hagia: 550, suez: 1850 } },
      explain: `
        The Great Pyramid: about 2560 BCE. Hagia Sophia: 537 CE. The Suez
        Canal: 1869.

        The gaps are the surprise. More time separates the pyramids from
        Hagia Sophia (about 3,100 years) than separates Hagia Sophia from
        you. This region has been building in stone for a very long time.
      `,
    },
    {
      id: 'capitals',
      type: 'interact',
      review: true,
      title: 'Capitals',
      gen: (rng) => tapCapital(rng, CAPITALS, { view: 'mena', minKm: 550 }),
    },
    {
      id: 'teach-customs',
      type: 'info',
      title: 'One region, many ways of life',
      text: `
        The region shares a great deal, and differs just as much. Four
        customs to know:

        - **Ramadan** is a month of fasting from dawn to sunset, kept by
          Muslims across the whole region.
        - **Nowruz**, the New Year on the first day of spring, is the great
          festival of Iran.
        - **Couscous**, steamed over a stew, is the dish of the Maghreb:
          Morocco, Algeria and Tunisia.
        - In Turkey, **tea** is brewed in a double pot and drunk from
          tulip-shaped glasses.
      `,
    },
    {
      id: 'everyday',
      type: 'match',
      title: 'Whose custom?',
      text: '**Match each custom to where you would find it.**',
      pairs: [
        ['Ramadan: a month of fasting from dawn to sunset', 'Among Muslims across the whole region'],
        ['Nowruz: New Year on the first day of spring', 'Iran'],
        ['Couscous, steamed over a stew', 'Morocco, Algeria and Tunisia'],
        ['Tea brewed in a double pot, drunk from tulip-shaped glasses', 'Turkey'],
      ],
      explain: `
        Two calendars are at work. Ramadan follows the Moon, so it comes
        about eleven days earlier each year and travels through all the
        seasons. Nowruz follows the Sun, so it always falls at the spring
        equinox. Both calendars count their years from the same event: the
        year 622.

        So, why a crossroads? The few well-watered strips are fertile; they
        sit where Africa, Asia and Europe touch; and the sea routes between
        them pass through gates you can now find on the map.
      `,
    },
  ],
  recap: [
    'People here live where the water is: along the Nile, the Tigris and the Euphrates, and on the rainier coasts. About 95% of Egyptians live beside the Nile.',
    'Five narrow passages (Gibraltar, the Bosphorus, Suez, the Bab-el-Mandeb and Hormuz) make this the meeting point of three continents.',
    'Arabic is the main language from Morocco to Iraq, but Iranians speak Persian, Turks speak Turkish and most Israelis speak Hebrew.',
    'Judaism, Christianity and Islam all began here. Muslims pray towards Mecca; Jerusalem is holy to all three faiths.',
  ],
  next: 'Next: south across the Sahara, to a part of the world that is far bigger, and far more varied, than most maps suggest.',
};
