// The World at a Glance · Lesson 3 · An Address for Every Place
//
// Driving question: how can two numbers pin down any spot on Earth, and why was one of them so much
// harder to find than the other?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-geography/index.js';
import { CITIES, CLOCKS, MEGACITIES, EVENTS, TILT, POLAR_CIRCLE, KM_PER_DEGREE, latText, lonText, coordText, howFarOff, countryName, theName } from '../helpers.js';

const GRID = {
  graticule: 30,
  parallels: ['equator', ...[60, 30, -30, -60].map((lat) => ({ lat, label: `${Math.abs(lat)}° ${lat > 0 ? 'N' : 'S'}`, dashed: true, color: 'gray' }))],
  meridians: ['prime', ...[-120, -60, 60, 120].map((lon) => ({ lon, label: `${Math.abs(lon)}° ${lon > 0 ? 'E' : 'W'}`, dashed: true, color: 'gray' }))],
};
const flip = (text, a, b) => (text.endsWith(a) ? text.replace(new RegExp(`${a}$`), b) : text.replace(new RegExp(`${b}$`), a));
const clock = (h) => `${String(h).padStart(2, '0')}:00`;
const eventAt = (key, extra = {}) => ({ year: EVENTS[key].year, label: EVENTS[key].label, ...extra });
// The city of the worked example: not one of CITIES, so that no generated question can repeat it.
const EXAMPLE_CITY = MEGACITIES.find((c) => c.name === 'São Paulo');

export default {
  id: 'latitude-longitude',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Lost at sea',
      text: `
        It is the year 1700. You are the navigator of a sailing ship in the middle of the Atlantic, weeks from land. The sky is clear, and you have good instruments for measuring the height of the Sun and the stars.

        **What can you work out about where you are?**
      `,
      shuffle: false,
      options: [
        { text: 'How far north or south I am, but not how far east or west', correct: true },
        { text: 'How far east or west I am, but not how far north or south' },
        { text: 'Both: my exact position' },
        { text: 'Neither: only a rough guess' },
      ],
      explain: `
        North–south was easy, and sailors had been measuring it for centuries. East–west was a guess, and a wrong guess could put a ship on the rocks.

        To see why, you first need the two numbers that give every place on Earth its address.
      `,
    },
    {
      id: 'grid',
      type: 'info',
      title: 'Two numbers',
      text: `
        **Latitude** says how far north or south of the Equator you are: from 0° at the Equator to 90° at each pole. Lines of equal latitude are circles that never meet, so they are called **parallels**.

        **Longitude** says how far east or west you are of the **prime meridian**, a line from pole to pole through Greenwich in London: from 0° to 180° each way. Lines of equal longitude are **meridians**.

        Latitude first, then longitude: Cairo is at **30° N, 31° E**. Turn the globe and find it.
      `,
      figure: {
        type: 'world-map', projection: 'orthographic', center: [15, 25], graticule: 15, maxWidth: 420,
        parallels: ['equator'], meridians: ['prime'],
        markers: [{ at: 'Cairo', label: 'Cairo', color: 'red' }],
        alt: 'A globe with a grid of lines every 15 degrees. The Equator and the prime meridian are drawn bold and cross in the Gulf of Guinea, off West Africa. Cairo is marked, two grid squares north and two squares east of that crossing.',
      },
    },
    {
      id: 'example-coords',
      type: 'info',
      title: 'Reading an address off a flat map',
      text: `
        On a flat map the same grid looks like squared paper. The Equator and the prime meridian are drawn bold; here the other lines are 30° apart.

        :::example Where is the red marker?
        1. It is **below** the Equator, so its latitude is **S**. It lies a little short of the 30° S line: about ${latText(EXAMPLE_CITY.at[1])}.
        2. It is **left** of the prime meridian, so its longitude is **W**. It lies between the 30° and 60° lines: about ${lonText(EXAMPLE_CITY.at[0])}.
        3. Latitude first: **${coordText(EXAMPLE_CITY.at)}**. That is ${EXAMPLE_CITY.name}, in ${countryName(EXAMPLE_CITY.country)}.
        :::
      `,
      figure: {
        type: 'world-map', ...GRID, zoom: false,
        markers: [{ at: EXAMPLE_CITY.at, color: 'red', size: 'l' }],
        alt: 'A world map with grid lines every 30 degrees, the Equator and the prime meridian drawn bold. A red marker stands in South America, a little north of the line 30 degrees south and between the lines 30 and 60 degrees west.',
      },
    },
    {
      id: 'read-coords',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const city = rng.pick(CITIES);
        const lat = latText(city.at[1]);
        const lon = lonText(city.at[0]);
        const ns = city.at[1] > 0 ? 'north' : 'south';
        const ew = city.at[0] > 0 ? 'east' : 'west';
        return {
          text: 'The grid lines on this map are 30° apart, and some are labelled. The Equator and the prime meridian are drawn bold. **Which are the coordinates of the red marker?**',
          figure: {
            type: 'world-map', ...GRID, zoom: false,
            markers: [{ at: city.at, color: 'red', size: 'l' }],
            alt: `A world map with grid lines every 30 degrees. A red marker stands ${ns} of the Equator and ${ew} of the prime meridian.`,
          },
          options: [
            { text: `${lat}, ${lon}`, correct: true },
            { text: `${flip(lat, 'N', 'S')}, ${lon}`, why: `The marker is ${ns} of the Equator, so its latitude is ${ns === 'north' ? 'N' : 'S'}.` },
            { text: `${lat}, ${flip(lon, 'E', 'W')}`, why: `The marker is ${ew} of the prime meridian, so its longitude is ${ew === 'east' ? 'E' : 'W'}.` },
            { text: `${flip(lat, 'N', 'S')}, ${flip(lon, 'E', 'W')}`, why: 'That point is on the opposite side of both bold lines.' },
          ],
          explain: `The marker is ${ns} of the Equator and ${ew} of the prime meridian: **${lat}, ${lon}**. That is ${city.name}, ${countryName(city.country)}.`,
        };
      },
    },
    {
      id: 'place-coords',
      type: 'interact',
      title: 'Steer by the numbers',
      gen: (rng) => {
        // Not Auckland: it lies so near the 180° line that the same numbers with E and W swapped are within the tolerance.
        const city = rng.pick(CITIES.filter((c) => Math.abs(c.at[0]) <= 160));
        const [lon, lat] = city.at;
        return {
          text: `
            Now the other way round. The line under the map reports where the pin is, like the screen of a satellite navigator.

            **Move the pin to ${coordText(city.at)}** and see which city you have found. Within 1,000 km counts.
          `,
          widget: {
            type: 'world-map', mode: 'place', ...GRID, pin: { color: 'red' },
            targets: [{ id: 'city', at: city.at, label: city.name }],
            alt: 'A world map with grid lines every 30 degrees, the Equator and the prime meridian drawn bold, and a pin to place.',
          },
          check: (s) => {
            if (!s.placed) return 'Move the pin first: drag it, or tap the map.';
            if (s.km <= 1000) return true;
            if (s.pin[1] * lat < 0) return `Your pin is ${s.pin[1] > 0 ? 'north' : 'south'} of the Equator. ${lat > 0 ? 'N' : 'S'} means ${lat > 0 ? 'north' : 'south'} of it.`;
            if (s.pin[0] * lon < 0) return `Your pin is ${s.pin[0] > 0 ? 'east' : 'west'} of the prime meridian. ${lon > 0 ? 'E' : 'W'} means ${lon > 0 ? 'east' : 'west'} of it.`;
            return `Right quarter of the map, but ${howFarOff(s.pin, city.at)}. Watch the numbers under the map as you move the pin.`;
          },
          solution: { pin: city.at },
          hints: [
            `${lat > 0 ? 'N' : 'S'} puts you ${lat > 0 ? 'above' : 'below'} the Equator; ${lon > 0 ? 'E' : 'W'} puts you to the ${lon > 0 ? 'right' : 'left'} of the prime meridian.`,
            `Find ${latText(lat)} between the labelled lines first, then slide along to ${lonText(lon)}.`,
          ],
          explain: `${coordText(city.at)} is the address of **${city.name}**, ${countryName(city.country)}. Every place on Earth has one, and no two places share it.`,
        };
      },
    },
    {
      id: 'special-lines',
      type: 'info',
      title: 'Four lines the Sun draws',
      text: `
        Four parallels have names, and all four come from one fact: the Earth's axis is **tilted by ${TILT}°**.

        Because of the tilt, the Sun can stand straight overhead only between ${TILT}° N, the **Tropic of Cancer**, and ${TILT}° S, the **Tropic of Capricorn**. The zone between them is [the tropics]{.orange}.

        And beyond ${POLAR_CIRCLE}° (that is 90° minus ${TILT}°), inside the **Arctic** and **Antarctic Circles**, there is at least one day a year when the Sun never sets and one when it never rises.
      `,
      figure: {
        type: 'world-map', parallels: ['equator', 'tropics', 'polar-circles'], areas: [{ band: [-23.44, 23.44], color: 'orange', label: 'The tropics' }], zoom: false,
        alt: 'A world map with five lines of latitude: the Arctic Circle near the top, the Tropic of Cancer, the Equator, the Tropic of Capricorn and the Antarctic Circle near the bottom. The band between the two tropics is shaded.',
      },
    },
    {
      id: 'zones',
      type: 'bucket',
      text: `The tropics end at ${TILT}° and the polar circles lie at ${POLAR_CIRCLE}°. **Sort these places by their latitude.**`,
      buckets: ['In the tropics', 'In the middle latitudes', 'Inside a polar circle'],
      items: [
        ['Mumbai, India: 19° N', 0],
        ['Lima, Peru: 12° S', 0],
        ['Singapore: 1° N', 0],
        ['Cairo, Egypt: 30° N', 1],
        ['Sydney, Australia: 34° S', 1],
        ['London, England: 51° N', 1],
        ['Tromsø, Norway: 70° N', 2],
        ['The South Pole: 90° S', 2],
      ],
      explain: `Anything from 0° to ${TILT}° is tropical, north or south. From there to ${POLAR_CIRCLE}° are the middle latitudes, where most people live. Tromsø, at 70° N, has about two months of midnight sun each summer, and in midwinter the Sun stays below the horizon for weeks.`,
    },
    {
      id: 'pole-star',
      type: 'numeric',
      title: 'Latitude from a star',
      gen: (rng) => {
        const a = rng.pick([12, 18, 25, 32, 36, 41, 48, 52, 57]);
        return {
          text: `
            One star, the **Pole Star**, sits almost exactly above the North Pole. Stand at the pole and it is straight overhead, 90° up. Stand on the Equator and it rests on the horizon, 0° up.

            Through a gap in the clouds a navigator measures the Pole Star **${a}°** above the horizon. **What is the ship's latitude?**
          `,
          answer: a,
          unit: '° N',
          wrong: [[90 - a, 'That is the angle from straight overhead. The height above the horizon is the latitude itself.']],
          hints: ['90° up at the pole (latitude 90°), 0° up at the Equator (latitude 0°). In between it works the same way.'],
          explain: `
            The height of the Pole Star above the horizon **is** your latitude: ${a}° N, about ${(Math.round((a * KM_PER_DEGREE) / 100) * 100).toLocaleString('en-US')} km north of the Equator (each degree is about ${KM_PER_DEGREE} km).

            Arab pilots in the Indian Ocean measured it with a knotted cord and a small wooden board, the *kamal*; later sailors used the astrolabe and, from the eighteenth century, the sextant. *One World* follows them across the oceans. South of the Equator, where the Pole Star is out of sight, the height of the Sun at noon does the same job.
          `,
        };
      },
    },
    {
      id: 'teach-longitude-time',
      type: 'info',
      title: 'Longitude is a difference in time',
      text: `
        Nothing in the sky marks longitude. But the Earth spins: once round, 360°, every 24 hours. That is **15° every hour**. The Sun reaches places to the east first, so noon arrives one hour later for every 15° you go west.

        :::example A ship's noon
        A ship's clock keeps Greenwich time. When the Sun is highest over the ship, the clock reads 22:00.

        1. Noon at Greenwich was 10 hours ago. The Sun got there first, so the ship is to the **west**.
        2. 10 hours × 15° = 150°. The ship is at **150° W**.

        Had the clock read 02:00, ten hours *before* noon at Greenwich, the ship would be at 150° E.
        :::
      `,
      figure: {
        type: 'world-map', graticule: 15, zoom: false,
        meridians: ['prime', { lon: -150, label: '150° W', color: 'red' }, { lon: 150, label: '150° E', color: 'blue' }],
        caption: 'The north–south lines are 15° apart: one hour of the Earth\'s spin',
        alt: 'A world map with a grid of lines every 15 degrees. Three north–south lines are marked: the prime meridian through Greenwich, the line 150 degrees west, in the Pacific near Alaska, and the line 150 degrees east, through eastern Australia.',
      },
    },
    {
      id: 'noon',
      type: 'fill',
      review: true,
      title: 'Longitude is time',
      gen: (rng) => {
        const hours = rng.int(1, 9);
        const west = rng.bool();
        const reads = west ? 12 + hours : 12 - hours;
        return {
          text: `
            Nothing in the sky marks longitude, because the Earth spins: it turns through 360° every 24 hours, which is **15° every hour**. But that gives another way in. Noon, when the Sun is highest, arrives one hour later for every 15° you go west.

            A ship carries a clock set to Greenwich time. At the ship's own noon, the clock reads **${clock(reads)}**.
          `,
          template: `The ship is [[${hours * 15}]]° [[${west ? 'east|*west' : '*east|west'}]] of Greenwich.`,
          hints: [`The clock and the Sun disagree by ${hours} ${hours === 1 ? 'hour' : 'hours'}. Each hour is 15°.`, west ? 'Greenwich had its noon first, so the ship is further along the Sun\'s westward path.' : 'It is not yet noon at Greenwich, so the Sun reached the ship first: the ship is to the east.'],
          explain: `The clock shows ${hours} ${hours === 1 ? 'hour' : 'hours'} ${west ? 'after' : 'before'} noon at Greenwich, and $${hours} \\times 15 = ${hours * 15}$. The Sun reaches places to the east first, so the ship is at **${hours * 15}° ${west ? 'W' : 'E'}**. Know the time at Greenwich, and you know your longitude.`,
        };
      },
    },
    {
      id: 'prize',
      type: 'numeric',
      title: 'The catch',
      text: `
        So longitude needs only a clock that keeps Greenwich time through a whole voyage. In ${EVENTS.longitudeAct.year} no such clock existed: pendulums go wild on a rolling ship. That year the British Parliament offered a fortune, 20,000 pounds, for a way to find longitude to within **half a degree** after sailing to the Caribbean.

        The Earth turns 15° in an hour, so 1° in 4 minutes. **How many minutes may the clock be wrong, at most, for half a degree?**
      `,
      answer: 2,
      unit: 'minutes',
      wrong: [[8, 'That is the time for 2°. Half a degree takes half as long as one degree.'], [4, 'Four minutes is a whole degree. The prize asked for half of that.'], [30, 'Half a degree is 30 minutes of *arc*, a measure of angle. The question is about minutes of time.']],
      hints: ['One degree takes 4 minutes. Half a degree takes…'],
      explain: 'Two minutes, after six weeks of heat, cold, damp and a pitching deck: about three seconds a day. The best clocks on land could not do that. Most experts expected the answer to come from astronomy instead.',
    },
    {
      id: 'harrison',
      type: 'choice',
      mode: 'predict',
      title: 'The clockmaker',
      text: `
        John Harrison, a carpenter's son from the north of England who had taught himself clockmaking, gave forty years of his life to that prize. Here are his first sea clock, finished in 1735, and the works of his fourth, finished in 1759: no longer a clock at all, but a large watch.

        **Which one do you think kept better time at sea?**
      `,
      figure: [
        photo(MEDIA['harrison-h1'], { alt: 'A large machine of polished brass in a museum case: a heavy frame of plates, rods and wheels, with four separate dials set in an ornate oval face.', caption: 'H1: 34 kg, over 60 cm tall', maxWidth: 300 }),
        photo(MEDIA['harrison-h4'], { alt: 'The round, gilded mechanism of a watch, lying on a stand. Its flat back plate is covered with finely engraved scrollwork, with a few small blue screws.', caption: 'H4, seen from the back: 13 cm across', maxWidth: 300 }),
      ],
      shuffle: false,
      options: [
        { text: 'The big brass machine, H1' },
        { text: 'The oversized watch, H4', correct: true },
      ],
      explain: `
        The watch. Harrison spent decades taming big, slow machines before he saw that a small balance beating fast is hardly disturbed by a ship's motion. On a voyage to Jamaica in ${EVENTS.harrisonH4.year} and 1762, H4 lost about **five seconds in 81 days**.

        The authorities were slow to believe a clockmaker had beaten the astronomers. Harrison was 80 when Parliament finally settled with him, in 1773. By then Captain Cook was carrying a copy of H4 round the world.
      `,
    },
    {
      id: 'when',
      type: 'interact',
      title: 'Why Greenwich?',
      text: `
        A clock tells you the time *somewhere*; many countries used their own capital as zero. As railways and telegraph cables tied the world together, that became a nuisance, and in ${EVENTS.greenwich.year} delegates from about 25 countries met to pick one line.

        **Drag the two cards to their places.** Within 50 years counts.
      `,
      widget: {
        type: 'timeline', from: 1450, to: 2000, step: 50, snap: 5,
        events: [
          eventAt('columbus', { short: 'Columbus', color: 'gray' }),
          eventAt('frenchRevolution', { short: '1789', color: 'gray' }),
          eventAt('moonLanding', { short: 'Moon', color: 'gray' }),
        ],
        place: [
          { id: 'watch', label: 'Harrison\'s watch at sea', answer: EVENTS.harrisonH4.year, color: 'orange' },
          { id: 'greenwich', label: 'Greenwich chosen as zero', answer: EVENTS.greenwich.year, color: 'blue' },
        ],
        alt: 'A timeline from 1450 to 2000 with three fixed events: Columbus crosses the Atlantic in 1492, the French Revolution in 1789 and the first Moon landing in 1969. Two cards are to be placed on it.',
      },
      check: (s) => {
        if (!s.complete) return 'Place both cards on the line.';
        const { watch, greenwich } = s.placed;
        if (Math.abs(watch - EVENTS.harrisonH4.year) > 50) {
          return watch < EVENTS.harrisonH4.year
            ? 'Harrison\'s watch is later than that. The prize it answered was offered in 1714.'
            : 'Harrison\'s watch is earlier than that: it sailed a generation before the French Revolution.';
        }
        if (Math.abs(greenwich - EVENTS.greenwich.year) > 50) {
          return greenwich < EVENTS.greenwich.year
            ? 'The world agreed on Greenwich later than that: in the age of railways and the telegraph.'
            : 'Greenwich was chosen earlier than that: before aeroplanes, in the age of railways and the telegraph.';
        }
        return true;
      },
      solution: { placed: { watch: 1760, greenwich: 1885 } },
      hints: ['The watch sailed about a generation before the French Revolution. The meridian was agreed about a century after it.'],
      explain: `
        H4 crossed the Atlantic in ${EVENTS.harrisonH4.year}. The conference of ${EVENTS.greenwich.year}, held in Washington, chose Greenwich by 22 votes to 1, mostly because most of the world's sea charts already used it. France abstained, and kept Paris as its zero for decades.

        The zero of longitude is a human agreement. The Equator is not: the planet's spin fixes it.
      `,
    },
    {
      id: 'teach-zones',
      type: 'info',
      title: 'Time zones',
      text: `
        If every town kept its own Sun time, no two towns' clocks would agree. So since the late 1800s the world's clocks have been set by **time zones**: bands about 15° wide, each a whole number of hours from Greenwich time (mostly). East of Greenwich the clocks are **ahead**; west of it they are **behind**.

        :::example
        Two zones east of Greenwich the clocks are 2 hours ahead: when it is 09:00 in Greenwich, it is 11:00 there. Two zones west, it is 07:00.
        :::

        Zones follow borders and politics as much as the Sun. Russia has eleven. [China]{.orange}, wide enough for five, keeps a single one: the time of its capital, Beijing.
      `,
      figure: {
        type: 'world-map', view: [66, 12, 146, 56], projection: 'mercator', zoom: false, legend: false, dots: false,
        regions: [{ ids: ['CN'], color: 'orange', label: 'China' }], dim: false,
        labels: ['CN', 'RU', 'IN', 'KZ', 'MN'],
        meridians: [75, 90, 105, 120, 135].map((lon) => ({ lon, label: `${lon}° E`, dashed: true, color: 'gray' })),
        markers: [{ at: 'Beijing', label: 'Beijing', color: 'red', labelPos: 'right' }],
        caption: 'China spans about 60° of longitude: four steps of 15°',
        alt: 'A map of China and its neighbours Russia, Mongolia, Kazakhstan and India. North–south lines are drawn every 15 degrees, from 75 to 135 degrees east: China stretches across four of the gaps between them. Beijing is marked, far in the east of the country.',
      },
    },
    {
      id: 'clock-time',
      type: 'choice',
      review: true,
      title: 'Time zones',
      gen: (rng) => {
        const city = rng.pick(CLOCKS);
        const k = Math.abs(city.offset);
        const ahead = city.offset > 0;
        const utc = ahead ? rng.int(1, 23 - k) : rng.int(k + 1, 23);          // the answer stays on the same day, and is never midnight
        const local = utc + city.offset;
        const wrongWay = utc - city.offset;
        const options = [
          { text: clock(local), correct: true },
          { text: clock(utc), why: 'That is Greenwich time itself. Only places near the prime meridian share it.' },
        ];
        if (wrongWay >= 0 && wrongWay <= 23) options.push({ text: clock(wrongWay), why: `That goes ${k} ${k === 1 ? 'hour' : 'hours'} the wrong way. ${city.name} is ${ahead ? 'east of Greenwich, so its day is further along' : 'west of Greenwich, so its day has not got as far'}.` });
        for (const d of [1, -1, 2, -2]) {
          const t = local + d;
          if (options.length < 4 && t >= 0 && t <= 23 && !options.some((o) => o.text === clock(t))) options.push({ text: clock(t) });
        }
        return {
          text: `
            Since the late 1800s the world's clocks have come to be set by zones, each a whole number of hours from Greenwich time (mostly). Go east and the clocks are ahead; go west and they are behind.

            Clocks in **${city.name}** are **${k} ${k === 1 ? 'hour' : 'hours'} ${ahead ? 'ahead of' : 'behind'}** Greenwich. When it is **${clock(utc)}** in Greenwich, what time is it in ${city.name}?
          `,
          figure: {
            type: 'world-map', meridians: ['prime'], zoom: false,
            areas: [{ lons: [city.offset * 15 - 7.5, city.offset * 15 + 7.5], color: 'orange', label: `Where the Sun is ${k} ${k === 1 ? 'hour' : 'hours'} ${ahead ? 'ahead' : 'behind'}` }],
            markers: [{ at: city.at, label: city.name, color: 'red' }, { at: [-0.0, 51.48], label: 'Greenwich', color: 'blue', labelPos: 'left' }],
            alt: `A world map with the prime meridian, Greenwich and ${city.name} marked. A band of longitude 15 degrees wide, ${k * 15} degrees ${ahead ? 'east' : 'west'} of Greenwich, is shaded.`,
          },
          options,
          explain: `${clock(utc)} ${ahead ? 'plus' : 'minus'} ${k} ${k === 1 ? 'hour' : 'hours'} is **${clock(local)}**. ${city.name} lies about ${Math.abs(Math.round(city.at[0]))}° ${city.at[0] > 0 ? 'east' : 'west'} of Greenwich, and each 15° is worth an hour.`,
        };
      },
    },
    {
      id: 'one-zone',
      type: 'interact',
      title: 'Bending the rules',
      text: `
        Remember the giant country that is wide enough for **five** zones, yet shows the time of its capital, far in the east, on every clock? In its western towns the Sun is highest at about three in the afternoon. Here is Asia without names.

        **Tap that country.**
      `,
      widget: { type: 'world-map', view: 'asia', mode: 'pick', answer: 'CN', alt: 'A map of Asia without names.' },
      check: (s) => s.picked === 'CN' || ({
        RU: 'That is Russia, which does the opposite: it has eleven time zones.',
        IN: 'That is India. It too keeps a single time, but it is only wide enough for two zones. Look for a wider country to its north-east.',
        KZ: 'That is Kazakhstan. The country in question is larger, and lies to the east.',
        MN: 'That is Mongolia. Its giant neighbour to the south is the one.',
      }[s.picked] || (s.picked ? `That is ${theName(s.name)}. Look for the widest country in the east of Asia.` : false)),
      solution: { picked: 'CN' },
      hints: ['Its capital is Beijing.'],
      explain: `
        **China** stretches across about 60° of longitude, yet since 1949 the whole country has kept Beijing time.

        Others split the difference instead: India's clocks are 5½ hours ahead of Greenwich, and Nepal's 5¾. A time zone is a decision.
      `,
    },
    {
      id: 'date-line',
      type: 'choice',
      title: 'Where the day begins',
      text: `
        Go east from Greenwich and clocks run ahead; go west and they run behind. Halfway round the world, at 180°, the two meet. Just west of that line, on the Asian side, clocks are twelve hours **ahead** of Greenwich; just east of it, on the American side, twelve hours **behind**: a whole day apart. That seam is the **International Date Line**.

        A ship sails **west** across it, from Hawaii towards Japan, on a Monday afternoon. **What day is it on the other side?**
      `,
      figure: {
        type: 'world-map', view: 'pacific', meridians: ['date-line'], zoom: false,
        markers: [{ at: 'Honolulu', label: 'Hawaii', color: 'red', labelPos: 'right' }, { at: 'Tokyo', label: 'Japan', color: 'red', labelPos: 'left' }],
        lines: [{ points: ['Honolulu', 'Tokyo'], color: 'red', arrow: true, dashed: true }],
        alt: 'A map of the Pacific Ocean with the 180° meridian drawn down the middle. An arrow runs west from Hawaii, on the right of the line, to Japan, on the left.',
      },
      shuffle: false,
      options: [
        { text: 'Sunday afternoon', why: 'That is what happens going the other way, eastwards: you live the same date twice.' },
        { text: 'Still Monday afternoon', why: 'The time of day stays the same, but the date has to change somewhere, and this is the place.' },
        { text: 'Tuesday afternoon', correct: true },
      ],
      explain: `
        Crossing westwards, the calendar jumps forward a day. The line was put in the middle of the Pacific because so few people live there, and it zigzags to keep countries whole.

        Countries can even move it. Kiribati shifted the line in 1995 so that all its islands share one date, and Samoa hopped across at the end of 2011: that year it had no 30 December.
      `,
    },
  ],
  recap: [
    '**Latitude** counts degrees north or south of the Equator (0° to 90°); **longitude** counts degrees east or west of the prime meridian through Greenwich (0° to 180°). Latitude is given first.',
    `The Earth's ${TILT}° tilt fixes the tropics (${TILT}° N and S) and the polar circles (${POLAR_CIRCLE}° N and S).`,
    'Latitude can be read from the Sun and stars. Longitude is a difference in time, 15° for every hour, and needed a clock that worked at sea: John Harrison\'s, in the 1760s.',
    'Greenwich as zero (agreed in 1884), time zones and the date line are human agreements. Your phone still finds its position with clocks: the very precise ones aboard navigation satellites.',
  ],
  next: 'Next: the grid is empty. Time to fill it with mountains, rivers and deserts, and to see what builds them.',
};
