// One World: 1450 to 1800 · Lesson 5 · A New Way of Knowing
//
// Driving question: how did people come to trust what they could measure over what the old
// books said, and what happened when they turned the same method on society?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-connected/index.js';
import { countryName } from '../../../../src/widgets/world-map.js';
import { PEOPLE, PLACES, SCIENCE_HOMES, at, year, tlEvent, whoStep } from '../helpers.js';

// Where the skies were studied before Copernicus: [lon, lat], label.
const OBSERVERS = [
  { at: [29.92, 31.2], label: 'Alexandria', labelPos: 'left' },
  { at: [44.4, 33.3], label: 'Baghdad', labelPos: 'bottom' },
  { at: [46.24, 37.39], label: 'Maragha', labelPos: 'top' },
  { at: [66.97, 39.65], label: 'Samarkand', labelPos: 'top' },
  { at: [76.3, 10.5], label: 'Kerala', labelPos: 'right' },
  { at: [116.4, 39.9], label: 'Beijing', labelPos: 'top' },
  { at: [19.68, 54.36], label: 'Frombork', labelPos: 'top', color: 'blue', shape: 'star' },
];

const SCIENCE_PICKABLE = ['PL', 'IT', 'CZ', 'GB', 'NL', 'FR', 'DE', 'ES', 'PT', 'AT', 'CH', 'BE', 'DK', 'SE', 'NO', 'IE', 'HU', 'SK', 'UA', 'BY', 'LT', 'RO', 'GR', 'RS', 'HR'];

// A country's name inside a sentence ("That is the Netherlands").
const inSentence = (code) => (['GB', 'NL'].includes(code) ? `the ${countryName(code)}` : countryName(code));

const capFirst = (text) => text[0].toUpperCase() + text.slice(1);

// The drawing for "Two pictures of the sky": Ptolemy's order on the left (Moon, Mercury, Venus, Sun,
// Mars, Jupiter, Saturn), Copernicus's on the right (Mercury, Venus, Earth with Moon, Mars, Jupiter, Saturn).
const CY = 112;
const ring = (cx, r) => `<circle class="fill-none stroke-hair" stroke-width="1.5" cx="${cx}" cy="${CY}" r="${r}"/>`;
const spot = (cx, r, deg) => [Math.round((cx + r * Math.cos((deg * Math.PI) / 180)) * 10) / 10, Math.round((CY - r * Math.sin((deg * Math.PI) / 180)) * 10) / 10];
const body = (cx, r, deg, cls, size) => { const [x, y] = spot(cx, r, deg); return `<circle class="${cls}" cx="${x}" cy="${y}" r="${size}"/>`; };
const PTOLEMY_RINGS = [16, 27, 38, 50, 62, 74, 86];
const COPERNICUS_RINGS = [16, 28, 44, 60, 73, 86];
const [EARTH_X, EARTH_Y] = spot(300, COPERNICUS_RINGS[2], 35);
const TWO_SYSTEMS = [
  '<text class="fig-label" x="100" y="16" text-anchor="middle">Ptolemy</text>',
  '<text class="fig-label" x="300" y="16" text-anchor="middle">Copernicus</text>',
  ...PTOLEMY_RINGS.map((r) => ring(100, r)),
  `<circle class="fill-blue" cx="100" cy="${CY}" r="7"/>`,
  body(100, PTOLEMY_RINGS[0], 60, 'fill-gray', 3.5),
  body(100, PTOLEMY_RINGS[1], 200, 'fill-ink', 3),
  body(100, PTOLEMY_RINGS[2], 320, 'fill-ink', 3),
  body(100, PTOLEMY_RINGS[3], 120, 'fill-orange', 7),
  body(100, PTOLEMY_RINGS[4], 250, 'fill-ink', 3),
  body(100, PTOLEMY_RINGS[5], 20, 'fill-ink', 3),
  body(100, PTOLEMY_RINGS[6], 160, 'fill-ink', 3),
  ...COPERNICUS_RINGS.map((r) => ring(300, r)),
  `<circle class="fill-orange" cx="300" cy="${CY}" r="8"/>`,
  body(300, COPERNICUS_RINGS[0], 200, 'fill-ink', 3),
  body(300, COPERNICUS_RINGS[1], 300, 'fill-ink', 3),
  `<circle class="fill-none stroke-hair" stroke-width="1.5" cx="${EARTH_X}" cy="${EARTH_Y}" r="10"/>`,
  `<circle class="fill-blue" cx="${EARTH_X}" cy="${EARTH_Y}" r="5.5"/>`,
  `<circle class="fill-gray" cx="${EARTH_X + 10}" cy="${EARTH_Y}" r="3"/>`,
  body(300, COPERNICUS_RINGS[3], 150, 'fill-ink', 3),
  body(300, COPERNICUS_RINGS[4], 250, 'fill-ink', 3),
  body(300, COPERNICUS_RINGS[5], 80, 'fill-ink', 3),
  '<circle class="fill-blue" cx="46" cy="230" r="6"/><text class="fig-label" x="57" y="235">Earth</text>',
  '<circle class="fill-orange" cx="128" cy="230" r="7"/><text class="fig-label" x="140" y="235">Sun</text>',
  '<circle class="fill-gray" cx="196" cy="230" r="3.5"/><text class="fig-label" x="205" y="235">Moon</text>',
  '<circle class="fill-ink" cx="276" cy="230" r="3"/><text class="fig-label" x="285" y="235">a planet</text>',
].join('');

// Galileo's Italy, for the screen about his trial.
const GALILEO_PLACES = [
  { id: 'padua', label: 'Padua', labelPos: 'right' },
  { id: 'florence', label: 'Florence', labelPos: 'left' },
  { id: 'rome', label: 'Rome', labelPos: 'left', color: 'red', shape: 'square' },
];

// The five writers of the Enlightenment screen, from the table the "who?" question draws on.
const THINKERS = ['locke', 'montesquieu', 'voltaire', 'diderot', 'kant'];

const SCIENCE_LABEL_POS = { frombork: 'top', padua: 'bottom', prague: 'right', cambridge: 'top', delft: 'right', paris: 'left' };

export default {
  id: 'new-science',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The Earth moves. Does that help?',
      text: `
        The Sun rises, crosses the sky and sets, and the ground feels perfectly
        still. For 1,400 years astronomers followed **Ptolemy** of Alexandria,
        who put a motionless Earth at the centre of everything.

        In 1543 **Nicolaus Copernicus** published a rival system: the Earth is
        a planet, circling the Sun.
        **How much better did it predict where the planets would appear?**
      `,
      shuffle: false,
      options: [
        { text: 'Far better' },
        { text: 'About the same', correct: true },
        { text: 'Far worse' },
      ],
      explain: `
        **About the same.** Copernicus still used perfect circles, and his
        tables were no more accurate than the old ones. What he offered was a
        simpler picture, and it was not enough to convince many people.

        The proof took 150 years, new instruments and a new way of arguing.
        This lesson is about that new way of knowing.
      `,
    },
    {
      id: 'teach-two-systems',
      type: 'info',
      title: 'Two pictures of the sky',
      text: `
        **${PEOPLE.ptolemy.name}** ${PEOPLE.ptolemy.did}. In it the Earth
        stands still in the middle. The Moon, the Sun, the planets and the
        stars all circle it.

        **Copernicus** made one swap. He put the Sun in the middle and made
        the Earth a planet, the third one out. Only the Moon still circles
        the Earth.

        Both men built their systems out of perfect circles.
      `,
      figure: {
        type: 'svg', viewBox: '0 0 400 250', maxWidth: 460,
        alt: 'Two diagrams of circles side by side. In the first, headed Ptolemy, the Earth is at the centre; the Moon is on the nearest circle, the Sun on the fourth, and five planets on the other circles. In the second, headed Copernicus, the Sun is at the centre; the Earth is on the third circle with the Moon circling it, and five planets are on the other circles.',
        caption: 'Earth-centred and Sun-centred (not to scale)',
        content: TWO_SYSTEMS,
      },
    },
    {
      id: 'diagram',
      type: 'interact',
      title: 'Read his diagram',
      text: `
        This is the page from Copernicus's book that changed the picture. The
        labels are in Latin: *Sol*, the Sun, sits in the middle, and each ring
        carries one planet. Thanks to printing, every astronomer in Europe saw
        exactly the same drawing.

        **Tap the ring that carries the Earth.** Clue: it is the only planet
        drawn with its Moon.
      `,
      widget: photo(MEDIA['copernicus-diagram'], {
        alt: 'A page from a printed book of 1543: a diagram of circles one inside another, each labelled in Latin. A small circle marked Sol sits at the centre. On the fifth ring from the outside a small circle marked Terra has a crescent beside it.',
        creditLabel: 'Print', credit: 'Nicolaus Copernicus, De revolutionibus (1543)',
        hotspots: [
          { id: 'stars', x: 0.227, y: 0.197, r: 0.045, label: 'The fixed stars', alt: 'the outermost circle' },
          { id: 'saturn', x: 0.5, y: 0.886, r: 0.045, label: 'Saturn', alt: 'the second circle from the outside' },
          { id: 'jupiter', x: 0.751, y: 0.515, r: 0.045, label: 'Jupiter', alt: 'the third circle from the outside' },
          { id: 'mars', x: 0.306, y: 0.515, r: 0.045, label: 'Mars', alt: 'the fourth circle from the outside' },
          { id: 'earth', x: 0.513, y: 0.36, r: 0.045, label: 'The Earth, with its Moon', alt: 'a small circle with a crescent beside it, on the fifth circle from the outside' },
          { id: 'sun', x: 0.5, y: 0.515, r: 0.04, label: 'The Sun', alt: 'the small circle at the very centre' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'earth') return true;
        if (s.picked === 'sun') return 'That is *Sol*, the Sun, at the centre. The Earth is on one of the rings.';
        if (s.picked === 'stars') return 'That outermost ring is the sphere of the fixed stars.';
        return 'That ring carries another planet. Look for the small circle with a crescent beside it: the Earth and its Moon.';
      },
      solution: { picked: 'earth' },
      hints: ['Look for the small circle labelled *Terra*, with a crescent beside it.'],
      explain: `
        From the outside in: the stars, Saturn, Jupiter, Mars, then the
        **Earth with its Moon**, Venus, Mercury, and the Sun. The Earth has
        become just one planet among the others, the third from the Sun.
      `,
    },
    {
      id: 'debts',
      type: 'info',
      title: 'On many shoulders',
      text: `
        Copernicus, working at **Frombork** on the Baltic, did not start from
        nothing. He used the Greek geometry of Ptolemy of **Alexandria**, the
        Indian numerals and trigonometry that had reached Europe in Arabic
        books, and the observations of astronomers of the Islamic world, whom
        he cites by name.

        Some of the mathematical devices in his book had been invented two or
        three centuries earlier at the observatory of **Maragha**, in Iran,
        and in Damascus. Nobody knows how they reached him. Astronomers at
        Samarkand, in Kerala, in Beijing and in the Maya world kept precise
        records of the sky too.
      `,
      figure: {
        type: 'world-map', view: [-12, 0, 128, 60],
        markers: OBSERVERS.map((m) => ({ shape: 'dot', ...m })),
        legend: false,
        alt: 'A map from Europe to China marking places where astronomers worked before Copernicus: Alexandria, Baghdad, Maragha in Iran, Samarkand, Kerala in south India and Beijing, with Frombork in Poland, where Copernicus worked, marked by a star.',
        caption: 'Some centres of astronomy before 1543',
      },
    },
    {
      id: 'kepler',
      type: 'choice',
      title: 'Eight minutes of arc',
      text: `
        The Danish nobleman **Tycho Brahe** spent twenty years measuring the
        positions of the planets, night after night, far more exactly than
        anyone before him. He had no telescope: only huge instruments and
        great care.

        His assistant **Johannes Kepler** tried to fit a circle to Tycho's
        figures for Mars. The best circle missed them by a tiny amount: about a
        quarter of the width of the full Moon. Kepler wrote that this small
        gap pointed the way to a complete reform of astronomy.

        **What did he do about it?**
      `,
      options: [
        { text: 'He gave up circles, and after years of work found that the orbit is an ellipse', correct: true },
        { text: 'He decided Tycho must have measured badly', why: 'He trusted the measurements more than his own theory. That was the new attitude.' },
        { text: 'He ignored such a small difference', why: 'An older astronomer might have. Kepler trusted Tycho\'s figures too much to let eight minutes of arc go.' },
        { text: 'He went back to Ptolemy\'s Earth-centred system', why: 'Ptolemy\'s circles fitted Tycho\'s data no better.' },
      ],
      explain: `
        In 1609 Kepler showed that planets move in **ellipses**, slightly
        squashed circles, with the Sun off-centre, speeding up as they come
        near it. Circles had seemed perfect since the ancient Greeks. Kepler let
        a small, stubborn fact overrule a beautiful idea.
      `,
    },
    {
      id: 'galileo',
      type: 'choice',
      title: 'A tube with two lenses',
      text: `
        In 1609 the Italian professor **Galileo Galilei** heard of a Dutch
        invention, the spyglass, built a better one and pointed it at the sky.
        Near Jupiter he saw small "stars" in a row, and drew them night after
        night. This page of his book shows four of those drawings: the circle is Jupiter.

        **What explains the way the little stars shift from one night to the next?**
      `,
      figure: photo(MEDIA['medicean-stars'], {
        alt: 'A page of an old printed book in Latin. Between the paragraphs are four small diagrams. Each shows a circle with two, three or four star symbols in a row beside it, and the stars stand in different places in each diagram.',
        caption: 'A page of Galileo\'s Starry Messenger, 1610. "Ori." marks east and "Occ." west',
        creditLabel: 'Print', credit: 'Galileo Galilei, 1610 (scan: University of Oklahoma Libraries)', maxWidth: 340,
      }),
      options: [
        { text: 'They are moons, circling Jupiter', correct: true },
        { text: 'They are distant stars that Jupiter happens to be passing', why: 'Then Jupiter would leave them behind. Instead they stay with it, swapping from side to side.' },
        { text: 'They are flaws in the lens', why: 'Flaws would not move in step from night to night, or follow one planet across the sky.' },
        { text: 'They are comets', why: 'Comets do not stay in a neat line beside one planet for weeks.' },
      ],
      explain: `
        Galileo had found **four moons of Jupiter**: proof that not everything
        in the heavens circles the Earth. He also saw mountains on the Moon and
        watched Venus go through phases like the Moon's, which fits
        Copernicus's system and not Ptolemy's. He published his first
        discoveries within about two months, and anyone with a telescope could check.
      `,
    },
    {
      id: 'teach-trial',
      type: 'info',
      title: 'Galileo and the Church',
      text: `
        Galileo built his telescopes at **Padua** and argued for the moving
        Earth in **Florence**. In 1633 the Roman Inquisition, a court of the
        Catholic Church, tried him in **Rome** for teaching that the Earth
        moves.

        He was 69, and he gave way. He was made to declare that the Earth
        does not move, and he lived under house arrest, still writing, until
        he died in 1642. He was not burned at the stake: that was Giordano
        Bruno, in 1600, condemned for a range of beliefs.

        The new astronomy went on in France, the Netherlands and England. In
        1992 the Church stated that Galileo's judges had been wrong.
      `,
      figure: {
        type: 'world-map', view: [5.5, 36, 19.5, 47.5], dots: false,
        markers: GALILEO_PLACES.map((m) => ({ at: at(m.id), label: m.label, labelPos: m.labelPos, ...(m.color ? { color: m.color, shape: m.shape } : {}) })),
        legend: false,
        alt: 'A map of Italy with three cities marked: Padua in the north-east, near Venice; Florence in the north of the peninsula; and Rome half-way down its west side.',
        caption: 'Galileo\'s Italy: Padua, Florence and Rome',
      },
    },
    {
      id: 'trial',
      type: 'multi',
      review: true,
      title: 'Galileo on trial',
      text: `
        In 1633 the Roman Inquisition, a court of the Catholic Church, put
        Galileo on trial for teaching that the Earth moves. The story has
        gathered many legends. **Which of these statements are true?**
      `,
      options: [
        { text: 'He was made to declare that the Earth does not move', correct: true },
        { text: 'He spent the rest of his life under house arrest', correct: true },
        { text: 'In 1992 the Church stated that his judges had been wrong', correct: true },
        { text: 'He was burned at the stake', why: 'That was Giordano Bruno, in 1600, condemned for a range of beliefs. Galileo died at home in 1642.' },
        { text: 'Until Columbus, the Church had taught that the Earth is flat', why: 'A myth. Educated Europeans had known since ancient times that the Earth is a sphere. The dispute was about whether it moves.' },
      ],
      explain: `
        Galileo, aged 69, gave way, and lived under house arrest until his
        death in 1642. (The famous muttered reply "and yet it moves" is
        probably a later legend.) The trial did not stop the new astronomy.
      `,
    },
    {
      id: 'newton',
      type: 'interact',
      review: true,
      title: 'One law for apple and Moon',
      text: `
        In 1687 **Isaac Newton** tied it all together in a book, the
        *Principia*: the pull that makes an apple fall is the same pull that
        holds the Moon in its orbit. He pictured a cannon on a mountain above
        the air, firing level.

        **Raise the speed and fire, until the ball never lands.**
      `,
      widget: { type: 'orbit-cannon', speed: 3, speedRange: [1, 8, 0.5], alt: 'The Earth with a cannon on a very high mountain. A slider sets the launch speed.' },
      check: (s) => {
        if (!s.launched) return 'Press **Fire** to test this speed.';
        if (s.lands) return 'The ball curves down and lands. Fire it faster.';
        return true;
      },
      solution: { speed: 7.5 },
      hints: ['Each faster shot lands further round the planet. Keep going.'],
      explain: `
        Fast enough, and the ball falls *around* the Earth for ever: an orbit.
        The Moon is such a cannonball. Newton's law of gravity explained
        Kepler's ellipses, the tides and the paths of comets with the same
        mathematics. (If you have taken *Physics II: Orbits & Waves*, you have
        fired this cannon before.) His friend Edmond Halley used the law to
        predict that a comet would return in 1758. It did.
      `,
    },
    {
      id: 'method',
      type: 'bucket',
      title: 'What changed was the method',
      text: `
        Historians call these 150 years the **Scientific Revolution**. The
        discoveries mattered less than the new rules for deciding what is true.
        **Sort these habits of mind.**
      `,
      buckets: ['The old way', 'The new way'],
      items: [
        { text: 'Aristotle wrote it, so it is so', bucket: 0 },
        { text: 'A perfect shape must be right, whatever the figures say', bucket: 0, why: 'This is the belief in circles that Kepler gave up.' },
        { text: 'Keep your findings secret from rivals', bucket: 0, why: 'Secrecy was the habit of the alchemists. The new science lived by publishing.' },
        { text: 'Measure, and let the numbers decide', bucket: 1 },
        { text: 'Build instruments to see what eyes cannot', bucket: 1 },
        { text: 'Publish, so that others can check and repeat', bucket: 1 },
      ],
      explain: `
        Observation, experiment, mathematics and **publication**. In 1660 the
        Royal Society was founded in London under the motto *Nullius in verba*:
        "take nobody's word for it". Societies and printed journals joined
        scholars across Europe into one arguing, checking community.
      `,
    },
    {
      id: 'merian',
      type: 'interact',
      title: 'Looking closely at life',
      text: `
        The same habit turned on living things. In 1543, the year of
        Copernicus's book, Andreas Vesalius published an atlas of the human
        body from his own dissections. William Harvey showed that the heart
        pumps the blood round the body. In Delft the cloth merchant Antonie
        van Leeuwenhoek ground tiny lenses and found "little animals" in a
        drop of water.

        In 1699 the artist **Maria Sibylla Merian** sailed to Suriname, in
        South America, to paint insects from life. Here she shows one insect
        at three stages of its life: a caterpillar, the case it rests in
        while it changes, and a butterfly.
        **Tap the stage that comes between the caterpillar and the butterfly.**
      `,
      widget: photo(MEDIA.merian, {
        alt: 'A coloured engraving of a ripe pineapple with its crown of leaves. A striped caterpillar climbs its left side, and below that hangs a small brown case. On the right are two butterflies with black and pale green wings, one open and one closed. Small red beetles sit on the leaves.',
        creditLabel: 'Print',
        hotspots: [
          { id: 'beetle', x: 0.17, y: 0.3, r: 0.05, label: 'A beetle', alt: 'a small red and black insect in flight, upper left' },
          { id: 'caterpillar', x: 0.293, y: 0.555, r: 0.05, label: 'Caterpillar', alt: 'a striped, worm-like animal on the left of the fruit' },
          { id: 'chrysalis', x: 0.276, y: 0.715, r: 0.05, label: 'Chrysalis', alt: 'a small brown case hanging at the lower left of the fruit' },
          { id: 'butterfly', x: 0.775, y: 0.49, r: 0.075, label: 'Butterfly', alt: 'a large winged insect, wings spread, on the right' },
          { id: 'butterfly2', x: 0.755, y: 0.73, r: 0.07, label: 'Butterfly, wings closed', alt: 'a winged insect with folded wings, lower right' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'chrysalis') return true;
        if (s.picked === 'caterpillar') return 'That is the caterpillar, the first stage. What does it turn into before it can fly?';
        if (s.picked === 'butterfly' || s.picked === 'butterfly2') return 'That is the butterfly, the last stage. Look for what the caterpillar becomes first.';
        if (s.picked === 'beetle') return 'That is a beetle, a different insect that also lives on the plant.';
        return 'Tap one of the numbered rings.';
      },
      solution: { picked: 'chrysalis' },
      hints: ['It does not move or feed, and it hangs from the fruit like a small brown parcel.'],
      explain: `
        The brown case is the **chrysalis**, in which the caterpillar turns
        into a butterfly. Many scholars still thought insects grew out of mud
        or rotting meat. By drawing all three stages on the plant the
        caterpillar eats, Merian showed that they are one animal with one
        life. She learned much from Indigenous and enslaved African people in
        Suriname, a sugar colony of the kind you will meet in the next lesson.
      `,
    },
    {
      id: 'teach-enlightenment',
      type: 'info',
      title: 'Reason, applied to society',
      text: `
        If reason could find the laws of the heavens, why not the laws of
        government, wealth and justice? From the late 1600s writers across
        Europe and its colonies took up that question. Their movement is
        called the **Enlightenment**.

        ${THINKERS.map((id) => `- **${PEOPLE[id].name}** ${PEOPLE[id].did}${/[!?]"$/.test(PEOPLE[id].did) ? '' : '.'}`).join('\n        ')}
      `,
    },
    {
      id: 'enlightenment',
      type: 'match',
      title: 'Whose idea?',
      text: `
        Five writers of the Enlightenment, five ideas.
        **Match each thinker to the idea.**
      `,
      pairs: [
        ['John Locke', 'Governments rest on the consent of the governed'],
        ['Montesquieu', 'Divide power among separate branches'],
        ['Voltaire', 'Tolerate other religions; let people speak freely'],
        ['Diderot', 'Put all knowledge, crafts included, in one encyclopedia'],
        ['Immanuel Kant', '"Dare to know!" Think for yourself'],
      ],
      explain: `
        These ideas were soon tested in revolutions, as you will see in
        *The Modern World*. They are still at work: most constitutions today divide
        power among a parliament, a government and independent courts, much as
        Montesquieu proposed in 1748.
      `,
    },
    {
      id: 'blind-spots',
      type: 'choice',
      title: 'Whose reason? Whose rights?',
      text: `
        Most Enlightenment writers said "mankind" and meant men like
        themselves. Women were shut out of the universities, some famous
        philosophers ranked peoples by "race", and great fortunes rested on
        slavery.

        In 1792 **Mary Wollstonecraft** turned the Enlightenment's own logic
        against this. She had herself painted without jewels or powdered wig:
        a thinker, not an ornament. **What was her argument?**
      `,
      figure: photo(MEDIA.wollstonecraft, {
        alt: 'A painted portrait of a woman in her thirties in a plain white dress and a dark cap, with loose brown hair and no jewellery. She looks thoughtfully to one side, against a dark background.',
        caption: 'Mary Wollstonecraft, painted by John Opie about 1797',
        creditLabel: 'Painting',
      }),
      options: [
        { text: 'Women seem less rational only because they are denied education: teach girls as boys are taught', correct: true },
        { text: 'Women are wiser than men by nature and should govern', why: 'She argued for equality, not for reversing the ranking.' },
        { text: 'Reason is overrated; feeling matters more', why: 'She made her case in the name of reason.' },
        { text: 'Women should have their own separate laws', why: 'She wanted the same rights and the same schooling for both.' },
      ],
      explain: `
        Her book *A Vindication of the Rights of Woman* argued that reason has
        no sex. Three years earlier **Olaudah Equiano**, who had been enslaved
        as a child, published his life story and used the language of shared
        humanity against the slave trade. You will meet him in the next lesson.
      `,
    },
    {
      id: 'timeline',
      type: 'interact',
      title: 'A slow revolution',
      text: `
        Three landmarks are fixed. **Drag the three cards to their places.**
        Anywhere within 30 years counts.
      `,
      widget: {
        type: 'timeline', from: 1500, to: 1800, step: 50, snap: 5,
        events: [tlEvent('luther', { color: 'gray' }), tlEvent('westphalia', { color: 'gray' }), { year: 1789, label: 'French Revolution', color: 'gray' }],
        place: [
          { id: 'copernicus', label: 'Copernicus\'s book', color: 'blue', answer: year('copernicus') },
          { id: 'telescope', label: 'Galileo\'s telescope', color: 'orange', answer: year('telescope') },
          { id: 'principia', label: 'Newton\'s Principia', color: 'violet', answer: year('principia') },
        ],
        alt: 'A timeline from 1500 to 1800 with three fixed events (Luther 1517, Westphalia 1648, the French Revolution 1789) and three cards to place.',
      },
      check: (s) => {
        if (!s.complete) return 'Place all three cards on the line.';
        const off = (id) => Math.abs(s.placed[id] - year(id));
        if (!(s.placed.copernicus < s.placed.telescope && s.placed.telescope < s.placed.principia)) return 'The order is Copernicus, then Galileo, then Newton: each built on the one before.';
        if (off('copernicus') > 30) return 'Copernicus published a generation after Luther\'s theses, in the 1540s.';
        if (off('telescope') > 30) return 'Galileo looked through his telescope early in the 1600s, before the Thirty Years\' War.';
        if (off('principia') > 30) return 'Newton\'s book came late in the 1600s, a generation after the Peace of Westphalia.';
        return true;
      },
      solution: { placed: { copernicus: 1545, telescope: 1610, principia: 1685 } },
      hints: ["Copernicus published a generation after Luther's theses.", "Galileo used his telescope just before the Thirty Years' War; Newton published a generation after it ended."],
      explain: `
        Copernicus, **1543**. Galileo's telescope, 1610. Newton's
        *Principia*, **1687**. Almost 150 years separate the first from the
        last: about as long as from Columbus to the Taj Mahal.
      `,
    },
    {
      id: 'teach-science-map',
      type: 'info',
      title: 'No single home',
      text: `
        The new science had no single home. Its makers lived in half a dozen
        countries and wrote to one another across the whole continent. The
        map shows today's borders.

        | Who | Worked at | Today in |
        |---|---|---|
        ${SCIENCE_HOMES.map((item) => `| ${item.who} | **${PLACES[item.place].name}** | ${capFirst(inSentence(item.country))} |`).join('\n        ')}
      `,
      figure: {
        type: 'world-map', view: [-11, 36, 30, 60],
        regions: [{ ids: SCIENCE_HOMES.map((item) => item.country), color: 'orange', tone: 'soft' }],
        markers: SCIENCE_HOMES.map((item) => ({ at: at(item.place), label: `${PLACES[item.place].name}, ${item.country === 'GB' ? 'UK' : countryName(item.country)}`, labelPos: SCIENCE_LABEL_POS[item.place], color: 'blue' })),
        legend: false,
        alt: `A map of Europe with six countries coloured, and one town marked and named in each: ${SCIENCE_HOMES.map((item) => `${PLACES[item.place].name} in ${inSentence(item.country)}`).join(', ')}.`,
      },
    },
    {
      id: 'science-home',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const item = rng.pick(SCIENCE_HOMES);
        return {
          text: `${item.who} ${item.did}. **Tap the present-day country where that is.**`,
          widget: {
            type: 'world-map', view: [-11, 36, 30, 60], mode: 'pick', answer: item.country, pickable: SCIENCE_PICKABLE,
            alt: 'A map of Europe from Portugal to Ukraine, without names.',
          },
          check: (s) => {
            if (s.picked === item.country) return true;
            if (!s.picked) return 'Tap a country.';
            const other = SCIENCE_HOMES.find((o) => o.country === s.picked);
            return other ? `That is ${inSentence(s.picked)}, where ${other.who} worked.` : `That is ${inSentence(s.picked)}. Try again.`;
          },
          solution: { picked: item.country },
          explain: `${PLACES[item.place].name} is in ${['GB', 'NL'].includes(item.country) ? inSentence(item.country) : `today's ${countryName(item.country)}`}. The new science had no single home: its makers wrote to one another across the whole continent.`,
        };
      },
    },
    {
      id: 'who-science',
      type: 'choice',
      review: true,
      gen: (rng) => whoStep(rng, 'science'),
    },
  ],
  recap: [
    'Copernicus (1543) put the Sun at the centre; Kepler\'s ellipses, Galileo\'s telescope and Newton\'s law of gravity (1687) made the case.',
    'The lasting change was a method: observe, measure, experiment, publish, and let others check.',
    'The new science drew on Greek, Indian, Islamic and Chinese knowledge, and spread through print and learned societies.',
    'The Enlightenment turned reason on society: rights, toleration, divided power. Wollstonecraft and Equiano showed whom it was leaving out.',
  ],
  next: 'Next: the hardest chapter of this course. The sugar in Europe\'s cups was grown by millions of enslaved Africans.',
};
