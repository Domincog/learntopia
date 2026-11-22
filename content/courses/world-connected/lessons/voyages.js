// One World: 1450 to 1800 · Lesson 1 · The World Made Round
//
// Driving question: the oceans were already being sailed, so what changed around 1500, and
// why did the wind decide almost all of it?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-connected/index.js';
import { PLACES, VOYAGES, ROUTES, at, marker, year, tlEvent, voyageLines, andList } from '../helpers.js';

const SEA = (text, lon, lat) => ({ at: [lon, lat], text, style: 'water' });

// Arrows for the wind belts of the Atlantic (schematic: the belts shift with the seasons).
const wind = (points, label) => ({ points, color: 'gray', width: 5, arrow: true, curve: 'straight', ...(label ? { label } : {}) });
const NORTH_ATLANTIC_WINDS = [
  wind([[-17, 31], [-25, 22]], 'Prevailing winds'),
  wind([[-27, 25], [-37, 17]]),
  wind([[-19, 20], [-29, 12]]),
  wind([[-47, 41], [-33, 43.5]]),
  wind([[-30, 45], [-16, 44.5]]),
];

const TRADE_WINDS = NORTH_ATLANTIC_WINDS.slice(0, 3).map((line, i) => ({ ...line, label: i === 0 ? 'Trade winds' : undefined }));
const WESTERLIES = NORTH_ATLANTIC_WINDS.slice(3).map((line, i) => ({ ...line, label: i === 0 ? 'Westerlies' : undefined }));

// The four voyages of the generated "whose route?" step, in the order they sailed.
const VOYAGE_IDS = ['zhengHe', 'columbus', 'daGama', 'magellan'];

// Ports for the generated "tap the port" step: all far apart on a map of the Old World's seas.
const PORTS = ['lisbon', 'goodHope', 'malindi', 'hormuz', 'calicut', 'malacca', 'nanjing'];
const PORT_LABEL_POS = { lisbon: 'left', goodHope: 'bottom', malindi: 'left', hormuz: 'top', calicut: 'left', malacca: 'bottom', nanjing: 'top' };
// How a place is named inside a sentence ("Tap the Cape of Good Hope").
const portName = (id) => (id === 'goodHope' ? 'the Cape of Good Hope' : PLACES[id].name);
const capFirst = (text) => text[0].toUpperCase() + text.slice(1);
const PORT_CLUES = {
  lisbon: 'the Portuguese capital from which da Gama sailed in 1497',
  goodHope: 'the cape near the southern tip of Africa that Dias rounded in 1488',
  malindi: 'the Swahili port in East Africa where da Gama took on a pilot who knew the monsoon',
  hormuz: 'the island port at the mouth of the Persian Gulf that Zheng He\'s fleets visited',
  calicut: 'the pepper port in south India that da Gama reached in 1498',
  malacca: 'the port on the narrow strait between the Indian Ocean and the South China Sea',
  nanjing: 'the Ming capital on the Yangtze where Zheng He\'s great ships were built',
};

export default {
  id: 'voyages',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The biggest fleet of the century',
      text: `
        The year is 1405. A fleet puts to sea with more than 200 ships and about
        27,000 people. Its largest vessels are far bigger than anything afloat
        in Europe.

        **Where do you think it sailed from?**
      `,
      options: [
        { text: 'Portugal' },
        { text: 'Venice' },
        { text: 'China', correct: true },
        { text: 'The Ottoman Empire' },
      ],
      explain: `
        **China.** The Ming emperors sent the admiral **Zheng He** on seven
        expeditions between 1405 and 1433. They reached Arabia and East Africa
        decades before any ship from Europe rounded Africa into the Indian Ocean.

        So the oceans were already being sailed. This lesson asks what changed
        around 1500, and why the **wind** decided almost all of it.
      `,
    },
    {
      id: 'zheng-he',
      type: 'info',
      title: 'An ocean with traffic',
      text: `
        Zheng He was a Muslim from Yunnan, taken captive as a boy, who rose to
        command the emperor's "treasure fleet". It followed sea lanes that Arab,
        Persian, Indian, Malay and Swahili sailors had used for centuries, riding
        the **monsoon** winds you met in *Crossroads*.

        The fleets carried silk and porcelain out, and brought envoys, spices
        and wonders home. Then, after 1433, the court stopped them. The voyages
        cost a fortune, there were enemies on the northern border to pay for,
        and China already made what the rest of the world wanted to buy.
      `,
      figure: {
        type: 'world-map', view: [22, -22, 132, 44],
        lines: voyageLines('zhengHe', { animate: 'draw', label: false }),
        markers: [marker('nanjing', { labelPos: 'top' }), marker('malacca', { labelPos: 'bottom' }), marker('calicut', { labelPos: 'top' }), marker('hormuz', { labelPos: 'top' }), marker('malindi', { labelPos: 'left' })],
        labels: [SEA('Indian Ocean', 75, -10)],
        legend: false,
        alt: 'A map of the Indian Ocean. A route runs from Nanjing in China past Vietnam to Malacca, round Sri Lanka to Calicut in India and on to Hormuz in the Persian Gulf; a branch crosses to Malindi in East Africa.',
        caption: 'Routes of Zheng He\'s fleets, 1405 to 1433 (simplified)',
      },
    },
    {
      id: 'giraffe',
      type: 'choice',
      title: 'A wonder at court',
      text: `
        This painting records a gift that reached the Ming court in 1414: a
        giraffe, an animal that lives wild only in Africa. The Chinese had
        never seen such a beast, and the court hailed it as a *qilin*, a
        mythical creature that appears only under a wise ruler.

        **As evidence for a historian, what does the picture show?**
      `,
      figure: photo(MEDIA.giraffe, {
        alt: 'A Chinese painting on silk: a tall, long-necked animal with a patterned hide, more than twice the height of the man in a red robe who leads it on a green rope. A column of Chinese writing runs down the left edge.',
        caption: 'Tribute giraffe with its keeper (detail): a later copy of a court painting of 1414',
        creditLabel: 'Painting', credit: 'after Shen Du (Ming dynasty)',
      }),
      options: [
        { text: 'That Ming China was in touch, directly or through others, with East Africa', correct: true },
        { text: 'That giraffes once lived wild in China', why: 'They never did. The court\'s astonishment is the point: the animal came from very far away.' },
        { text: 'That European ships were already trading in the Indian Ocean', why: 'In 1414 no ship had yet sailed from Europe into the Indian Ocean. Da Gama arrived 84 years later.' },
        { text: 'That the painter invented the animal', why: 'The neck, the horns and the patterned hide are too accurate for that. He drew it from life.' },
      ],
      explain: `
        This giraffe was sent by the ruler of Bengal, who had it from East
        Africa, and the next year another came straight from Malindi on the
        Swahili coast with Zheng He's ships. One painting ties China, India
        and Africa together.
      `,
    },
    {
      id: 'spice',
      type: 'order',
      title: 'Why Europeans wanted in',
      text: `
        Cloves grew on a few small islands, the **Moluccas**, and nowhere else.
        A clove bound for a kitchen in Europe changed hands again and again along
        the route on the map, and every hand added its profit.

        **Put the hands in order, from the island to the kitchen.**
      `,
      figure: {
        type: 'world-map', view: [5, -14, 135, 50], aspect: 1.9, maxWidth: 460,
        lines: [{ points: ROUTES.spice.points, color: 'orange', width: 2.5, curve: 'straight', arrow: true }],
        markers: [marker('moluccas', { labelPos: 'bottom' }), marker('malacca', { labelPos: 'top' }), marker('calicut', { labelPos: 'right' }), marker('aden', { labelPos: 'bottom' }), marker('alexandria', { labelPos: 'bottom' }), marker('venice', { labelPos: 'top' })],
        legend: false,
        alt: 'A map from Europe to Indonesia. One route runs from the Moluccas through Malacca to Calicut in India, on to Aden, up the Red Sea to Alexandria and across the Mediterranean to Venice.',
      },
      items: [
        'Malay and Javanese traders, from the islands to Malacca',
        'Gujarati and Arab ships, to Calicut and Aden',
        'Egyptian merchants, up the Red Sea to Alexandria',
        'Venetian galleys, across the Mediterranean',
      ],
      labels: ['Island', 'Kitchen'],
      explain: `
        By the time spices reached Venice they cost many times what the grower
        was paid. A kingdom that could sail to the source would keep all those
        profits for itself. Portugal, poor and on the far edge of Europe, had the
        most to gain. Its captains also wanted West African gold and Christian
        allies against Muslim powers, and some were simply curious.
      `,
    },
    {
      id: 'teach-toolkit',
      type: 'info',
      title: 'The toolkit',
      text: `
        To leave the coasts they knew, Portuguese pilots put together a kit of
        tools, most of them borrowed and improved.

        - **The caravel**: small, and shallow enough for unknown coasts. Its
          triangular *lateen* sails, long used by Arab and Mediterranean
          sailors, let it sail closer to the wind.
        - **The magnetic compass**, first used at sea in China, holds a
          heading out of sight of land.
        - **The astrolabe** measures the height of the Sun or the Pole Star,
          which gives your **latitude**.

        No instrument could yet find **longitude** at sea. That had to wait for
        the sea clocks of the 1700s, as you saw in *The World at a Glance*.
      `,
      figure: photo(MEDIA.caravel, {
        alt: 'A small dark wooden ship under way, with two large triangular sails hung from long slanting poles; each sail bears a red cross.',
        caption: 'A replica caravel on the Tagus at Lisbon',
        maxWidth: 300,
      }),
    },
    {
      id: 'tools',
      type: 'fill',
      title: 'A pilot\'s notes',
      text: `
        A young pilot is about to take a caravel south along the coast of
        Africa. Here is what his master has taught him.

        **Complete the pilot's notes.**
      `,
      template: `
        Triangular sails let a ship sail [[*closer to the wind|only straight downwind|without any wind]].
        The magnetic compass, first used at sea in [[Portugal|*China|Egypt]], holds a heading out of sight of land.
        An astrolabe measures the height of the Sun or the Pole Star, which gives your [[*latitude|longitude|speed]].
        No instrument can yet find your [[latitude|*longitude]] at sea.
      `,
      explain: `
        A borrowed kit: the sails came from the Arab and Mediterranean world,
        the compass from China, the astronomy from Greek and Islamic scholars.
        Pilots also drew *portolan* charts of coasts and harbours from their
        own records.
      `,
    },
    {
      id: 'volta',
      type: 'interact',
      review: true,
      title: 'The long way is the fast way',
      text: `
        A Portuguese caravel has traded for gold at **Elmina** and must get home
        to **Lisbon**. The grey arrows show the winds that blow for most of the
        year. A sailing ship cannot sail straight into the wind.

        **Tap the route, A or B, that a pilot of the 1480s would choose.**
      `,
      widget: {
        type: 'world-map', view: [-50, -3, 12, 49], mode: 'pickMarker', answer: 'b',
        lines: [
          ...NORTH_ATLANTIC_WINDS,
          { points: ROUTES.elminaCoast.points, color: 'red', width: 2.5, curve: 'straight', arrow: true },
          { points: ROUTES.elminaVolta.points, color: 'blue', width: 2.5, curve: 'straight', arrow: true },
        ],
        markers: [
          { id: 'a', at: [-18.6, 15.5], label: 'A', color: 'red', shape: 'square', labelPos: 'right' },
          { id: 'b', at: [-34.5, 24], label: 'B', color: 'blue', shape: 'square', labelPos: 'left' },
          { at: at('elmina'), label: 'Elmina', shape: 'ring', labelPos: 'bottom' },
          { at: at('lisbon'), label: 'Lisbon', shape: 'ring', labelPos: 'right' },
        ],
        labels: [SEA('Atlantic Ocean', -40, 6)],
        alt: 'The eastern Atlantic from West Africa to Portugal. Grey arrows show winds blowing south-west along the African coast and, further north, eastwards towards Europe. Route A hugs the African coast northwards. Route B loops far out west into the ocean and then turns east to Lisbon.',
      },
      check: (s) => {
        if (s.picked === 'b') return true;
        if (s.picked === 'a') return 'Shorter on the map, but look at the arrows along that coast: the ship would have to fight the wind (and the current) the whole way.';
        return 'Tap the square marked A or the square marked B.';
      },
      solution: { picked: 'b' },
      hints: ['Follow the arrows. Where does the wind help a ship heading for Portugal?'],
      explain: `
        Route B is about half as long again, and much faster. Along the coast the
        **trade winds** blow from the north-east, dead against a ship going home.
        So pilots swung out into the open ocean until they met the
        **westerlies**, then rode them back to Portugal: the *volta do mar*,
        the "turn of the sea".
      `,
    },
    {
      id: 'teach-winds',
      type: 'info',
      title: 'The turn of the sea',
      text: `
        Tools were half of it. The other half was the wind, and you have just
        found the trick. Portuguese pilots called it the ***volta do mar***,
        the "turn of the sea".

        - The **trade winds** blow from the north-east, down the coast of
          Africa. They carry a ship out, and bar the way home.
        - Further north the **westerlies** blow towards Europe.

        So the way home was a great loop: out to sea across one wind, back on
        the other. Learning to trust it, out of sight of land for weeks, was
        the key that opened the Atlantic.
      `,
      figure: {
        type: 'world-map', view: [-50, -3, 12, 49], dots: false,
        lines: [
          ...TRADE_WINDS,
          ...WESTERLIES,
          { points: ROUTES.elminaVolta.points, color: 'blue', width: 2.5, curve: 'straight', arrow: true, animate: 'draw', label: 'The volta do mar', labelOn: 'legend' },
        ],
        markers: [
          { at: at('elmina'), label: 'Elmina', shape: 'ring', labelPos: 'bottom' },
          { at: at('lisbon'), label: 'Lisbon', shape: 'ring', labelPos: 'right' },
        ],
        labels: [SEA('Atlantic Ocean', -40, 6)],
        alt: 'The eastern Atlantic from West Africa to Portugal. Grey arrows labelled trade winds blow south-west along the African coast; further north, grey arrows labelled westerlies blow east towards Europe. A blue route leaves Elmina, loops far out west into the ocean and turns east to Lisbon on the westerlies.',
        caption: 'Home from Elmina by the volta do mar',
      },
    },
    {
      id: 'da-gama',
      type: 'interact',
      title: 'Round Africa to India',
      text: `
        In 1488 **Bartolomeu Dias** rounded the southern tip of Africa. Almost ten years
        later **Vasco da Gama** used that door. He swung far out through the
        South Atlantic (a giant *volta*), rounded the Cape, and sailed up the
        Swahili coast. At Malindi he took on a pilot who knew the monsoon, and
        less than a month later he was in India.

        **Tap his stops in order, starting from Lisbon.** (Your line simply
        joins the stops; the dashed line is the course he sailed.)
      `,
      widget: {
        type: 'world-map', view: [-52, -42, 92, 46], mode: 'trace',
        answer: ['lisbon', 'capeVerde', 'goodHope', 'malindi', 'calicut'],
        lines: voyageLines('daGama', { label: false, color: 'gray', width: 2 }).map((l) => ({ ...l, arrow: false, dashed: true })),
        markers: [
          marker('lisbon', { labelPos: 'right' }),
          marker('capeVerde', { label: 'Cape Verde Is.', labelPos: 'left' }),
          marker('goodHope', { labelPos: 'bottom' }),
          marker('malindi', { labelPos: 'left' }),
          marker('calicut', { labelPos: 'top' }),
        ],
        alt: 'A map of Africa and the western Indian Ocean with five marked places: Lisbon, the Cape Verde Islands, the Cape of Good Hope, Malindi in East Africa and Calicut in India. A dashed line shows a sea route joining them round Africa.',
      },
      check: (s) => {
        const want = ['lisbon', 'capeVerde', 'goodHope', 'malindi', 'calicut'];
        if (s.route.join() === want.join()) return true;
        if (s.route[0] !== 'lisbon') return 'He set out from Lisbon. Start there.';
        if (s.count < want.length) return 'Visit all five places, ending in India.';
        const firstWrong = s.route.findIndex((id, i) => id !== want[i]);
        return `Stop ${firstWrong + 1} is out of order. Follow the dashed line round Africa from Lisbon.`;
      },
      solution: { route: ['lisbon', 'capeVerde', 'goodHope', 'malindi', 'calicut'] },
      hints: ['From Lisbon he sailed south to the Cape Verde Islands before swinging out into the ocean.', 'After the Cape of Good Hope comes East Africa, and India last.'],
      explain: `
        Da Gama reached Calicut in May 1498. The pilot from Malindi mattered as
        much as the ships: the Portuguese had sailed into an ocean that others
        knew far better than they did. Within a few years they were using cannon
        to force their way into its trade.
      `,
    },
    {
      id: 'columbus',
      type: 'choice',
      title: 'Meanwhile, a short cut west',
      text: `
        In 1492 Christopher Columbus persuaded the rulers of Spain to back a
        different idea: reach Asia by sailing **west**. The king of Portugal
        had already turned him down.

        Scholars had long known that the Earth is a sphere, and the Greeks had
        measured it. Columbus put Japan only about 4,400 km west of the Canary
        Islands. Experts in Portugal and Spain advised against the voyage.

        **What was their objection?**
      `,
      options: [
        { text: 'The Earth is far bigger than he claims, so Asia is much too far away', correct: true },
        { text: 'The Earth is flat, and he would sail off the edge', why: 'A famous myth. Educated Europeans had known for some 1,800 years that the Earth is a sphere (Eratosthenes even measured it, as you saw in *First Worlds*). The story of flat-Earth scholars was made popular in the 1800s.' },
        { text: 'No ship could survive weeks out of sight of land', why: 'Portuguese crews had been doing exactly that for decades on the *volta do mar*.' },
        { text: 'Nobody in Europe wanted Asian goods', why: 'They wanted them badly: that was the whole point of da Gama\'s voyage too.' },
      ],
      explain: `
        The real distance from the Canary Islands to Japan is more than four
        times what Columbus claimed. The experts were right, and his crews
        would have starved, except that two continents nobody in Europe knew
        about lay in the way.
      `,
    },
    {
      id: 'teach-columbus',
      type: 'info',
      title: 'Out on one wind, home on the other',
      text: `
        On 12 October 1492 Columbus landed in the Bahamas, among Taíno people
        whose ancestors had lived there for centuries. He insisted it was
        Asia: that is why the Caribbean islands are still called the West
        **Indies**.

        Look at his course. He dropped south to the **Canary Islands** and
        rode the trade winds west. He came home (the dashed line) further
        north, on the westerlies, past the **Azores**: a *volta* as wide as
        the ocean.
      `,
      figure: {
        type: 'world-map', view: [-100, -5, 10, 55], dots: false,
        lines: voyageLines('columbus', { animate: 'draw', label: false }),
        markers: [
          { at: at('palos'), label: 'Spain', labelPos: 'top' },
          marker('canaries', { labelPos: 'bottom' }),
          { at: at('sanSalvador'), label: 'Bahamas', labelPos: 'top' },
          marker('azores', { labelPos: 'top' }),
        ],
        labels: [SEA('Atlantic Ocean', -45, 12)],
        legend: false,
        alt: 'A map of the North Atlantic. A route leaves southern Spain, drops south to the Canary Islands and runs due west to the Bahamas and the Caribbean. A dashed route returns further north, past the Azores, to the coast of Portugal.',
        caption: 'Columbus\'s first voyage, 1492 to 1493',
      },
    },
    {
      id: 'cantino',
      type: 'interact',
      title: 'A line through the world',
      text: `
        Spain and Portugal now both claimed new lands. In 1494, at
        **Tordesillas**, they agreed on a line down the Atlantic: lands to the
        west of it for Spain, to the east for Portugal. Nobody asked the people
        who lived there.

        This Portuguese chart of 1502 is one of the oldest to show the
        line. **Tap it.**
      `,
      widget: photo(MEDIA.cantino, {
        alt: 'A hand-painted sea chart of 1502. Europe and Africa are drawn in detail in the middle, with part of India and Asia to the right and, on the left, a few islands and a stretch of coast with trees and parrots. Thin straight lines criss-cross the sea; one bold vertical line runs from top to bottom through the western ocean.',
        creditLabel: 'Chart',
        hotspots: [
          { id: 'line', x: 0.199, y: 0.42, r: 0.05, label: 'Tordesillas line', alt: 'a bold line running from the top of the chart to the bottom, in the western ocean' },
          { id: 'equator', x: 0.83, y: 0.615, r: 0.05, label: 'Equator', alt: 'a line running from left to right across the middle of the chart' },
          { id: 'rose', x: 0.497, y: 0.487, r: 0.05, label: 'Compass rose', alt: 'a large many-pointed star in the centre' },
          { id: 'capricorn', x: 0.11, y: 0.775, r: 0.05, label: 'Tropic of Capricorn', alt: 'a line running from left to right near the bottom of the chart' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'line') return true;
        if (s.picked === 'equator') return 'That line runs east to west: it is the equator. The treaty line runs from pole to pole.';
        if (s.picked === 'capricorn') return 'That is the Tropic of Capricorn, another east-west line. The treaty line runs from pole to pole.';
        if (s.picked === 'rose') return 'That is a compass rose, the centre of the chart\'s direction lines. Look further west, out in the ocean.';
        return 'Tap one of the numbered rings.';
      },
      solution: { picked: 'line' },
      hints: ['The treaty line runs from north to south, down the middle of the Atlantic.'],
      explain: `
        The line clipped the eastern bulge of South America, where the chart
        shows trees and parrots. Portugal claimed that coast in 1500. That is
        why **Brazil** speaks Portuguese today while most of its neighbours
        speak Spanish. Look, too, at how exactly Africa is drawn only four
        years after da Gama. Portugal guarded such charts as state secrets;
        this one survives because an Italian agent had it smuggled out.
      `,
    },
    {
      id: 'magellan',
      type: 'info',
      title: 'All the way round',
      text: `
        In 1519 **Ferdinand Magellan**, a Portuguese captain sailing for
        Spain, left with five ships and about 270 men to reach the Moluccas
        by sailing west. He found a strait at the tip
        of South America and crossed an ocean far wider than anyone had guessed.
        Polynesian navigators had been crossing it for centuries.

        Magellan was killed in the Philippines in 1521, fighting the forces of
        the chief Lapulapu. **Juan Sebastián Elcano** brought the last ship, the
        *Victoria*, home in 1522 with 18 men. Their log was one day behind the
        calendar on shore: sailing west with the Sun, they had seen one sunrise
        fewer. That is why there is an International Date Line.
      `,
      figure: {
        type: 'world-map', view: 'world', center: -150,
        lines: voyageLines('magellan', { animate: 'draw', label: false }),
        markers: [
          { at: at('sanlucar'), label: 'Spain', labelPos: 'top' },
          marker('magellanStrait', { labelPos: 'left' }),
          { at: at('cebu'), label: 'Philippines', labelPos: 'top' },
          marker('moluccas', { labelPos: 'bottom' }),
        ],
        oceans: true, legend: false,
        alt: 'A world map centred on the Pacific. A route leaves Spain, runs down the Atlantic, passes through a strait at the tip of South America, crosses the whole Pacific to the Philippines and the Moluccas, then returns across the Indian Ocean and round Africa to Spain.',
        caption: 'The first voyage round the world, 1519 to 1522',
      },
    },
    {
      id: 'timeline',
      type: 'interact',
      title: 'When was all this?',
      text: `
        Two landmarks are fixed on the line.
        **Drag the three cards to their places.** Anywhere within 30 years counts.
      `,
      widget: {
        type: 'timeline', from: 1380, to: 1560, step: 20, snap: 5,
        events: [tlEvent('constantinople', { color: 'gray' }), tlEvent('luther', { color: 'gray' })],
        place: [
          { id: 'zhengHe', label: 'Zheng He\'s first voyage', color: 'red', answer: year('zhengHe') },
          { id: 'columbus', label: 'Columbus crosses the Atlantic', color: 'orange', answer: year('columbus') },
          { id: 'victoria', label: 'First voyage round the world ends', color: 'violet', answer: year('victoria') },
        ],
        alt: 'A timeline from 1380 to 1560 with two fixed events, the fall of Constantinople in 1453 and Luther in 1517, and three cards to place.',
      },
      check: (s) => {
        if (!s.complete) return 'Place all three cards on the line.';
        const off = (id) => Math.abs(s.placed[id] - year(id));
        if (s.placed.zhengHe > s.placed.columbus) return 'Zheng He sailed first: his voyages ended decades before Columbus set out.';
        if (s.placed.columbus > s.placed.victoria) return 'Columbus came first. The voyage round the world followed a generation later.';
        if (off('zhengHe') > 30) return s.placed.zhengHe > year('zhengHe') ? 'Zheng He sailed earlier than that, well before Constantinople fell.' : 'Zheng He sailed a little later than that: early in the 1400s.';
        if (off('columbus') > 30) return 'Columbus sailed in 1492: between the two fixed landmarks.';
        if (off('victoria') > 30) return 'The *Victoria* came home soon after Luther\'s theses, not long after 1520.';
        return true;
      },
      solution: { placed: { zhengHe: 1405, columbus: 1490, victoria: 1520 } },
      hints: ["Zheng He's first fleet sailed half a century before Constantinople fell.", 'Columbus sailed in 1492, and the *Victoria* came home thirty years after that.'],
      explain: `
        Zheng He's fleets sailed from 1405 to 1433. Then, within one lifetime:
        Dias rounded Africa (1488), Columbus crossed the Atlantic (**1492**), da
        Gama reached India (1498) and the *Victoria* circled the globe (1522).
        In the same decades the Ottomans took Constantinople and Luther split
        the western Church.
      `,
    },
    {
      id: 'why-portugal',
      type: 'choice',
      stretch: true,
      title: 'The giant stops, the small state keeps going',
      text: `
        Ming China had far bigger ships, more money and a head start of ninety
        years. Yet it was Portugal and Spain that went on to tie the oceans
        together. **Which explanation fits the evidence best?**
      `,
      options: [
        { text: 'China had little to gain and one court could end the voyages; Europe\'s rival kingdoms had much to gain, and a captain refused by one king could ask another', correct: true },
        { text: 'Chinese ships could not cross open ocean', why: 'They crossed the Indian Ocean seven times, to Arabia and Africa.' },
        { text: 'Chinese sailors had no compass', why: 'The magnetic compass was a Chinese invention, used at sea since about the eleventh century.' },
        { text: 'Europeans were simply braver and more curious', why: 'Curiosity was everywhere. What differed was who paid, and what they hoped to gain.' },
      ],
      explain: `
        China was the rich centre of the trade: the world came to it. When one
        court lost interest, the voyages ended. Europe was a set of rivals on
        the poor edge of the same trade. Columbus was turned down in Portugal
        and funded in Spain, and Magellan, a Portuguese, sailed for Spain too.
        Geography and politics, not courage, made the difference.
      `,
    },
    {
      id: 'teach-voyages',
      type: 'info',
      title: 'Four voyages, seven landmarks',
      text: `
        Here are the lesson's four great voyages on one map. Magellan's line
        leaves the left edge in the Pacific and comes back in on the right.

        | Voyage | Sailed from | Years |
        |---|---|---|
        ${VOYAGE_IDS.map((id) => `| **${VOYAGES[id].who}** | ${VOYAGES[id].from} | ${VOYAGES[id].years} |`).join('\n        ')}

        The dots are seven landmarks of the old sea routes. Find each one:
        ${andList(PORTS.map((id) => (id === 'goodHope' ? 'the Cape of Good Hope' : PLACES[id].name)))}.
      `,
      figure: {
        type: 'world-map', view: 'world', center: 40, dots: false,
        lines: VOYAGE_IDS.flatMap((id) => voyageLines(id, { label: false, width: 2 }).map((line, i) => (i === 0 ? { ...line, label: VOYAGES[id].who, labelOn: 'legend' } : line))),
        markers: PORTS.map((id) => marker(id, { labelPos: PORT_LABEL_POS[id], color: 'gray' })),
        alt: `A world map with four sea routes. Zheng He: ${VOYAGES.zhengHe.alt}. Columbus: ${VOYAGES.columbus.alt}. Da Gama: ${VOYAGES.daGama.alt}. Magellan and Elcano: ${VOYAGES.magellan.alt}. Seven places are marked: Lisbon, the Cape of Good Hope, Malindi, Hormuz, Calicut, Malacca and Nanjing.`,
        caption: 'The great voyages, 1405 to 1522 (dashed: Columbus\'s way home)',
      },
    },
    {
      id: 'whose-route',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const ids = VOYAGE_IDS;
        const id = rng.pick(ids);
        const v = VOYAGES[id];
        const views = { zhengHe: { view: [10, -30, 140, 50] }, columbus: { view: [-100, -5, 10, 55] }, daGama: { view: [-50, -45, 100, 50] }, magellan: { view: 'world', center: -150 } };
        return {
          text: 'One of the great voyages of the years 1400 to 1525 is drawn on this map. **Whose was it?**',
          figure: {
            type: 'world-map', ...views[id], names: false,
            lines: voyageLines(id, { label: false, color: 'red' }),
            legend: false,
            alt: `A map with one sea route drawn on it: ${v.alt}.`,
          },
          options: ids.map((other) => ({ text: `${VOYAGES[other].who}, sailing from ${VOYAGES[other].from}`, correct: other === id })),
          explain: {
            zhengHe: 'Zheng He\'s Ming fleets (1405 to 1433) followed the monsoon sea lanes from China to India, Arabia and East Africa.',
            columbus: 'Columbus (1492) dropped south to the Canary Islands, rode the trade winds west to the Caribbean and came home further north on the westerlies.',
            daGama: 'Da Gama (1497 to 1498) looped through the South Atlantic, rounded Africa and crossed from Malindi to Calicut with a local pilot.',
            magellan: 'Magellan\'s fleet (1519 to 1522) passed the tip of South America and crossed the Pacific. Elcano completed the circle after Magellan\'s death.',
          }[id],
        };
      },
    },
    {
      id: 'port-pick',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const shown = rng.sample(PORTS, 4);
        const target = rng.pick(shown);
        const letters = 'ABCD';
        const names = shown.map((id, i) => `${letters[i]} is ${portName(id)}`).join(', ');
        return {
          text: `Four landmarks of the old sea routes are marked. **Tap ${portName(target)}**, ${PORT_CLUES[target]}.`,
          widget: {
            type: 'world-map', view: [-28, -44, 132, 52], mode: 'pickMarker', markerLabels: 'after', answer: target,
            markers: shown.map((id) => marker(id)),
            alt: 'A map of Africa, Europe and southern Asia with four places on the coast marked by letters.',
          },
          check: (s) => {
            if (s.picked === target) return true;
            if (!s.picked) return 'Tap one of the four markers.';
            return `That is ${portName(s.picked)}, ${PORT_CLUES[s.picked]}.`;
          },
          solution: { picked: target },
          explain: `${names}. ${capFirst(portName(target))} was ${PORT_CLUES[target]}.`,
        };
      },
    },
  ],
  recap: [
    'Before 1490 the oceans were already busy: Polynesian, Arab, Indian, Malay, Swahili and Chinese sailors crossed them, and Zheng He\'s fleets were the largest of all.',
    'Winds made the routes. The *volta do mar* took ships far out to sea to find a wind that would carry them home.',
    'Between 1488 and 1522, Dias, Columbus, da Gama and Magellan\'s crews joined the Atlantic, Indian and Pacific oceans into one network.',
    'Europe\'s rival kingdoms wanted direct access to Asian trade. "Discovery" was really an encounter between peoples who had not known of each other.',
  ],
  next: 'Next: once ships crossed the Atlantic, so did potatoes, horses, silver and smallpox. Dinner, and the world, were never the same.',
};
