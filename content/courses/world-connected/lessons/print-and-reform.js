// One World: 1450 to 1800 · Lesson 4 · The Printing Revolution
//
// Driving question: how did a machine for making books change what Europeans read, spoke
// and believed?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-connected/index.js';
import { distanceKm } from '../../../../src/widgets/world-map.js';
import { EVENTS, PEOPLE, PLACES, PRINT_TOWNS, RELIGION_1600, at, compass, marker, whoStep } from '../helpers.js';

const TOWN_VIEW = [-7, 39.5, 21, 56.5];

// Six early printing towns and the decade or year the first press arrived (the "spread" step and its teaching map).
const PRESS_TOWNS = [
  { id: 'mainz', at: at('mainz'), label: 'Mainz, 1450s' },
  { id: 'rome', at: at('rome'), label: 'Rome, 1467' },
  { id: 'venice', at: at('venice'), label: 'Venice, 1469' },
  { id: 'paris', at: at('paris'), label: 'Paris, 1470' },
  { id: 'krakow', at: [19.94, 50.06], label: 'Kraków, 1473' },
  { id: 'london', at: at('london'), label: 'London, 1476' },
];
const PRESS_LABEL_POS = { mainz: 'top', rome: 'bottom', venice: 'right', paris: 'left', krakow: 'top', london: 'top' };

// The four artists of the Renaissance screen, from the table the "who?" question draws on.
const ARTISTS = ['brunelleschi', 'leonardo', 'michelangelo', 'raphael'];

export default {
  id: 'print-and-reform',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'Counting books',
      text: `
        In 1450 every book in Europe was copied by hand. A scribe needed many
        months for one Bible. Then, about 1455, a workshop in the German town
        of Mainz **printed** some 180 Bibles in one go.

        Forty-five years later, in 1500,
        **about how many printed books do you think existed in Europe?**
      `,
      min: 0, max: 20, step: 1, answer: 12, tolerance: 8, unit: ' million', start: 0,
      explain: `
        Historians' estimates run from about **8 million to 20 million**
        copies, from presses in more than 250 towns. That is probably more
        books than all the scribes of Europe had produced in the thousand years
        before.

        This lesson asks what all that paper did to what Europeans read, spoke
        and believed.
      `,
    },
    {
      id: 'teach-type',
      type: 'info',
      title: 'Two ways to print',
      text: `
        Printing was old before it reached Europe, and there were two ways to
        do it.

        - **Block printing.** Carve a whole page into one block of wood, ink
          it and press paper on it. The Diamond Sutra was printed this way in
          China in ${EVENTS.diamondSutra.year}.
        - **Movable type.** Make a small stamp for every sign. Set the stamps
          in rows to build a page, print it, then take the page apart and use
          the stamps again. Bi Sheng made such type from baked clay in China
          about 1040, as you saw in *Crossroads*.

        The pages in the photograph were printed in Korea with movable type
        cast in **metal**.
      `,
      figure: photo(MEDIA.jikji, {
        alt: 'Two facing pages of an old book on yellowed paper, printed in black with neat columns of Chinese characters that run from top to bottom.',
        caption: 'The Jikji, Korea, 1377: the oldest surviving book printed with movable metal type',
        creditLabel: 'Book', credit: 'printed at Heungdeok Temple, Korea, 1377', maxWidth: 400,
      }),
    },
    {
      id: 'not-first',
      type: 'choice',
      title: 'Not the first',
      text: `
        So movable type was an East Asian invention. The Korean *Jikji* was
        printed with metal type in 1377, about eighty years before Gutenberg.

        Yet in East Asia most printers stayed with carved blocks, while in
        Europe movable type swept all before it. **Why the difference?**
      `,
      options: [
        { text: 'An alphabet needs a few dozen different letters; Chinese writing needs thousands of different characters', correct: true },
        { text: 'Only Europe had paper', why: 'Paper was invented in China and reached Europe through the Islamic world, centuries after East Asia had it.' },
        { text: 'Asian rulers banned printing', why: 'Korean kings paid for metal type, and block printing flourished in China, Korea and Japan.' },
        { text: 'Europeans had more to read', why: 'China had by far the larger book trade at the time.' },
      ],
      explain: `
        A printer of Latin needs only a few dozen letters, cast over and
        over. A printer of Chinese needs thousands of different characters, so
        carving a whole page on one block was often cheaper. The idea was not
        new in Europe; it was the fit between movable type and the **alphabet**
        that was explosive.
      `,
    },
    {
      id: 'gutenberg',
      type: 'choice',
      title: 'Gutenberg\'s machine',
      text: `
        **Johannes Gutenberg** was a goldsmith. His invention was really four
        things at once: a mould for casting identical metal letters quickly,
        an oily ink that stuck to them, a press borrowed from wine-making, and
        paper.

        This is one of his Bibles. The black text is printed. The coloured
        letters and the decoration were added afterwards **by hand**.
        **Why would a printer do that?**
      `,
      figure: photo(MEDIA['gutenberg-bible'], {
        alt: 'A large open book on a stand in a glass case. Each page has two tall columns of dense black lettering; a few big initial letters are painted in red and blue, and some headings are in red.',
        caption: 'Gutenberg Bible, Mainz, about 1455',
      }),
      options: [
        { text: 'Buyers expected a fine book to look like a manuscript, so the new product copied the old one', correct: true },
        { text: 'The press could not print black', why: 'The black text is exactly what the press printed.' },
        { text: 'It was a way to hide that the book was printed, because printing was illegal', why: 'Printing was not illegal. Churchmen were among Gutenberg\'s best customers.' },
        { text: 'The colours made the book cheaper', why: 'Hand decoration cost extra: buyers paid an artist for it separately.' },
      ],
      explain: `
        New technology often dresses up as the thing it replaces. The first
        printed books imitated handwriting, columns and all. About 180 copies
        of this Bible were made, and 49 survive. Within fifty years printers
        had dropped the disguise and invented title pages, page numbers and
        small, cheap formats.
      `,
    },
    {
      id: 'mainz',
      type: 'interact',
      title: 'Where it began',
      text: `
        Gutenberg's workshop stood in **Mainz**, about half-way along the
        River Rhine, in the west of what is now Germany. The Rhine was the
        great trade road of the region, and the new craft travelled along it.

        **Place the pin on Mainz.** Anywhere within 200 km counts.
      `,
      widget: {
        type: 'world-map', view: [-6, 41, 22, 57], mode: 'place', rivers: ['Rhine'],
        pin: { label: 'Mainz', color: 'red', start: [8, 46] }, target: at('mainz'),
        alt: 'A map of western and central Europe without names. The River Rhine is drawn, from the Alps to the North Sea.',
      },
      check: (s) => {
        if (!s.placed) return 'Drag the pin to where you think Mainz is, or tap the map.';
        if (s.km <= 200) return true;
        return `That is ${s.km} km away. Mainz lies to the ${compass(s.pin, at('mainz'))} of your pin, about half-way along the Rhine.`;
      },
      solution: { pin: [8.3, 50] },
      hints: ['Follow the Rhine from the Alps towards the North Sea. Mainz is about half-way, where the river bends west.'],
      explain: `
        Mainz stands where the River Main joins the Rhine. Within fifteen
        years of the Bible, printers trained there had set up presses up and
        down the river, at Strasbourg, Cologne and Basel.
      `,
    },
    {
      id: 'spread',
      type: 'interact',
      title: 'Presses on the move',
      text: `
        From the Rhine, printers carried the craft over the Alps and across
        Europe. By 1500 one city printed more books than any other: a great
        **port**, with paper mills nearby and merchants who shipped goods
        everywhere. You met it in the first lesson, at the European end of the
        spice route.

        Six early printing towns are marked. **Tap the one that fits.**
      `,
      widget: {
        type: 'world-map', view: [-9, 39.5, 25, 56.5], mode: 'pickMarker', markerLabels: 'after', answer: 'venice',
        markers: PRESS_TOWNS,
        alt: 'A map of western and central Europe with six lettered markers: on the Rhine in Germany, in central Italy, at the head of the Adriatic Sea, in northern France, in southern Poland and in south-east England.',
      },
      check: (s) => {
        if (s.picked === 'venice') return true;
        if (!s.picked) return 'Tap one of the six markers.';
        if (s.picked === 'mainz') return 'That is Mainz, where printing began. But it lies far inland on the Rhine. Look for a seaport.';
        if (s.picked === 'london') return 'That is London, a port, but a latecomer to printing with only a handful of presses by 1500.';
        if (s.picked === 'rome') return 'That is Rome: an early printing town, but not a trading port.';
        return 'That town lies inland. Look for a great seaport on the Mediterranean side of the Alps.';
      },
      solution: { picked: 'venice' },
      hints: ['Which of these cities sits on the sea, at the top of the Adriatic? It was Marco Polo\'s home town.'],
      explain: `
        **Venice.** Its presses turned out pocket-sized classics for readers
        all over Europe. Printing followed trade: it reached Paris in 1470 and
        Kraków in 1473; William Caxton set up England's first press in 1476.
        Mexico City had one by 1539, and Goa in India by 1556.
      `,
    },
    {
      id: 'teach-effects',
      type: 'info',
      title: 'What cheap books did',
      text: `
        Printing followed trade. The map shows when it reached six towns;
        ${PEOPLE.caxton.name} ${PEOPLE.caxton.did}, beside London.

        - **Everyday languages.** Print rewarded writing in the languages
          people spoke, not only in Latin, and a bestseller could fix how a
          language was written. Martin Luther's Bible did that for German.
          William Tyndale's New Testament, for which he was executed, did
          much the same for English.
        - **Identical copies.** Scholars in different cities could work from
          the same page. Erasmus of Rotterdam published a corrected Greek New
          Testament for all of Europe at once.
        - **Lies too.** Rumours and insults spread faster, and a manual for
          hunting witches was reprinted again and again.

        Reading spread slowly: in 1600 most Europeans still could not read.
      `,
      figure: {
        type: 'world-map', view: [-9, 39.5, 25, 56.5], dots: false,
        markers: PRESS_TOWNS.map((m) => ({ at: m.at, label: m.label, labelPos: PRESS_LABEL_POS[m.id] })),
        legend: false,
        alt: 'A map of western and central Europe with six early printing towns and the dates their first presses arrived: Mainz in the 1450s, Rome 1467, Venice 1469, Paris 1470, Kraków 1473 and London 1476.',
        caption: 'First presses in six towns',
      },
    },
    {
      id: 'effects',
      type: 'multi',
      review: true,
      title: 'True or false of the 1500s?',
      text: 'Which of these were **real effects** of printing in Europe in the 1500s?',
      options: [
        { text: 'More books appeared in everyday languages such as German, French and English, not only in Latin', correct: true },
        { text: 'Spelling and grammar slowly became more standard within each language', correct: true },
        { text: 'Scholars in different cities could work from identical copies, page for page', correct: true },
        { text: 'Rumours, insults and false stories spread faster too', correct: true },
        { text: 'Within a generation nearly everyone in Europe could read', why: 'Literacy rose, but slowly. In 1600 most Europeans, and most women above all, still could not read.' },
      ],
      explain: `
        Print rewarded writing in the languages people spoke, and a
        bestseller such as Luther's Bible could fix how a language was
        written. Identical copies let scholars in different cities check one
        another's work. Presses soon turned out maps, star tables and, from
        1605, weekly newspapers too. But a press prints lies as easily as
        truths.
      `,
    },
    {
      id: 'teach-renaissance',
      type: 'info',
      title: 'A rebirth',
      text: `
        Printing arrived in the middle of the **Renaissance**, the "rebirth"
        of ancient learning. It began in rich Italian cities such as
        **Florence**, a city of bankers. Scholars called **humanists**, of
        whom Erasmus was the most famous, hunted for the books of ancient
        Greece and Rome, many of them kept alive by Byzantine and Muslim
        scholars. Artists studied the ancient world and nature just as closely:

        ${ARTISTS.map((id) => `- **${PEOPLE[id].name}** ${PEOPLE[id].did}.`).join('\n        ')}

        The Sistine Chapel and the Vatican are in **Rome**, the city of the
        popes.
      `,
      figure: {
        type: 'world-map', view: [5.5, 36, 19.5, 47.5], dots: false,
        markers: [marker('florence', { labelPos: 'left', color: 'orange', shape: 'star' }), marker('rome', { labelPos: 'left' }), marker('venice', { labelPos: 'right' })],
        legend: false,
        alt: 'A map of Italy with three cities marked: Venice at the head of the Adriatic Sea, Florence (with a star) in the north of the peninsula, and Rome half-way down its west side.',
        caption: 'Florence, where the Renaissance began, with Rome and Venice',
      },
    },
    {
      id: 'renaissance',
      type: 'interact',
      title: 'Perspective at work',
      text: `
        Brunelleschi's rule of **perspective**: to paint depth, make every
        line that leads away from the viewer run to one spot, the
        **vanishing point**.

        This is Raphael's *School of Athens*. He has painted the ancient
        philosophers in one grand hall.
        **Tap the spot where the lines of the building meet.**
      `,
      widget: photo(MEDIA['school-of-athens'], {
        alt: 'A wall painting inside a painted arch. Dozens of men in coloured robes stand, sit and talk on the steps of a vast hall, whose arches recede one behind another towards open sky. Two men walk side by side at the centre of the group.',
        creditLabel: 'Painting',
        mode: 'point',
        hotspots: [
          { id: 'vanish', x: 0.515, y: 0.49, r: 0.06, label: 'Vanishing point, between Plato and Aristotle', alt: 'the two men at the centre, under the last arch' },
          { id: 'left', x: 0.25, y: 0.66, r: 0.08, label: 'Pythagoras, with Ibn Rushd behind him', alt: 'a group round a man writing in a book, lower left' },
          { id: 'right', x: 0.75, y: 0.72, r: 0.08, label: 'Euclid with his compasses', alt: 'a group bending over a slate, lower right' },
          { id: 'arch', x: 0.52, y: 0.11, r: 0.08, label: 'The vault', alt: 'the top of the great arch' },
        ],
      }),
      check: (s) => {
        if (s.picked === 'vanish') return true;
        if (s.picked === 'arch') return 'That is the top of the arch. Follow its edges, and the lines of the floor tiles, into the distance: where would they cross?';
        if (s.picked === 'left' || s.picked === 'right') return 'Those figures are in the foreground. Follow the lines of the floor and the walls back into the picture.';
        return 'Not quite. Follow the edges of the floor tiles and the arches into the distance: they all aim at one spot in the middle.';
      },
      solution: { picked: 'vanish', point: { x: 0.515, y: 0.49 } },
      hints: ['The painter put his two most important figures exactly there.'],
      explain: `
        The lines meet between **Plato and Aristotle**, so your eye goes
        straight to them. The man in the turban on the left is thought to be
        Ibn Rushd of Córdoba, whose commentaries taught Europe to read
        Aristotle. Raphael painted this about 1510, while Michelangelo was at
        work on the Sistine ceiling a few rooms away.
      `,
    },
    {
      id: 'luther',
      type: 'choice',
      title: 'A monk and a printing press',
      text: `
        In 1517 **Martin Luther**, a monk and professor at Wittenberg, wrote
        ninety-five theses against the sale of *indulgences*: printed
        certificates which, buyers were told, shortened a soul's punishment
        after death. A century earlier, before Gutenberg, the Czech priest Jan
        Hus had made similar protests, and was burned at the stake.

        **Why did Luther's protest survive and spread?**
      `,
      figure: photo(MEDIA.luther, {
        alt: 'A painted portrait of a stout man in a black cap and a black gown against a blue-green background, looking calmly out of the picture.',
        caption: 'Martin Luther in 1528, from the workshop of his friend Lucas Cranach',
        creditLabel: 'Painting',
      }),
      options: [
        { text: 'Printers spread his words across Germany within weeks, and a prince protected him', correct: true },
        { text: 'The pope agreed with him', why: 'The pope expelled him from the Church in 1521.' },
        { text: 'He kept his ideas among scholars', why: 'The opposite: he wrote short, punchy pamphlets in German for ordinary readers.' },
        { text: 'He raised an army', why: 'Luther never led soldiers. His weapons were pamphlets, hymns and a Bible in German.' },
      ],
      explain: `
        Luther sent his theses to his archbishop on 31 October 1517 (whether he
        also nailed them to a church door is uncertain). Printers did the
        rest. In the next years German presses printed more of his writings
        than of all other reformers together, and Cranach's workshop turned
        out portraits like this one by the hundred. Hidden in a castle by the
        ruler of Saxony, Luther translated the New Testament into German.
      `,
    },
    {
      id: 'split',
      type: 'info',
      title: 'One Church becomes several',
      text: `
        Luther wanted to reform the Church, not to split it. But rulers and
        cities took sides, other reformers such as John Calvin in Geneva went further,
        and by 1600 western Christianity was divided between **Protestant**
        churches and the **Catholic** Church. This split is called the
        **Reformation**.

        The Catholic Church reformed itself too, at the Council of Trent
        (${EVENTS.trent.year} to ${EVENTS.trent.to}). New
        orders such as the Jesuits, founded by Ignatius of Loyola, opened
        schools and sent missionaries as far as Japan and China.
      `,
      figure: {
        type: 'world-map', view: [-11, 35, 42, 66],
        regions: [
          { ids: RELIGION_1600.protestant, color: 'blue', label: 'Mostly Protestant' },
          { ids: RELIGION_1600.catholic, color: 'orange', label: 'Mostly Catholic' },
          { ids: RELIGION_1600.mixed, color: 'violet', label: 'Divided' },
          { ids: RELIGION_1600.orthodox, color: 'green', tone: 'soft', label: 'Mostly Orthodox' },
        ],
        markers: [marker('wittenberg', { labelPos: 'top' }), marker('rome', { labelPos: 'bottom' }), marker('geneva', { labelPos: 'left' })],
        alt: 'A map of Europe. Scandinavia, Britain and the Netherlands are marked mostly Protestant; Spain, Portugal, France, Italy, Ireland, Austria and Poland mostly Catholic; Germany, Switzerland, Czechia and Hungary divided; Russia and the Balkans mostly Orthodox.',
        caption: 'Christian traditions about 1600, very roughly, on today\'s borders',
      },
    },
    {
      id: 'north-south',
      type: 'bucket',
      title: 'North and south',
      text: 'From memory of the map: **where did each of these stand by 1600?**',
      buckets: ['Protestant rulers', 'Catholic rulers'],
      items: [
        { text: 'Sweden', bucket: 0 },
        { text: 'England', bucket: 0, why: 'Henry VIII broke with the pope in the 1530s; under Elizabeth I England was firmly Protestant.' },
        { text: 'Denmark', bucket: 0 },
        { text: 'Scotland', bucket: 0 },
        { text: 'Spain', bucket: 1 },
        { text: 'Portugal', bucket: 1 },
        { text: 'Poland', bucket: 1 },
        { text: 'The states of Italy', bucket: 1 },
      ],
      explain: `
        Roughly, the north turned Protestant and the south stayed Catholic,
        with Germany split down the middle. The quarrel fed a century of wars,
        ending with the Thirty Years' War, which killed millions. The Peace of
        Westphalia in 1648 accepted the split: Catholic, Lutheran and Calvinist
        states would have to live side by side. The pattern can still be traced on Europe's map today.
      `,
    },
    {
      id: 'order',
      type: 'order',
      title: 'From type to treaty',
      text: '**Put these in order, earliest first.**',
      items: [
        EVENTS.jikji.label,
        EVENTS.gutenberg.label,
        EVENTS.luther.label,
        EVENTS.trent.label,
        EVENTS.westphalia.label,
      ],
      labels: ['Earliest', 'Latest'],
      explain: `
        The *Jikji* (1377); Gutenberg's Bible (about 1455); Luther's theses
        (**1517**); the Council of Trent (from 1545); the Peace of Westphalia
        (1648). Luther's protest came 25 years after Columbus sailed, and four
        years before Tenochtitlan fell.
      `,
    },
    {
      id: 'print-towns',
      type: 'interact',
      review: true,
      gen: (rng) => {
        const ids = Object.keys(PRINT_TOWNS);
        let shown = null;
        for (let tries = 0; tries < 200 && !shown; tries++) {
          const pick = rng.sample(ids, 4);
          const apart = pick.every((a, i) => pick.every((b, j) => i >= j || distanceKm(at(a), at(b)) >= 280));
          if (apart) shown = pick;
        }
        const target = rng.pick(shown);
        return {
          text: `Four towns are marked. **Tap ${PLACES[target].name}**, ${PRINT_TOWNS[target]}.`,
          widget: {
            type: 'world-map', view: TOWN_VIEW, mode: 'pickMarker', markerLabels: 'after', answer: target,
            markers: shown.map((id) => marker(id)),
            alt: 'A map of western Europe from Spain to Poland with four towns marked by letters.',
          },
          check: (s) => {
            if (s.picked === target) return true;
            if (!s.picked) return 'Tap one of the four markers.';
            return `That is ${PLACES[s.picked].name}, ${PRINT_TOWNS[s.picked]}.`;
          },
          solution: { picked: target },
          explain: `${PLACES[target].name}, in today's ${{ DE: 'Germany', IT: 'Italy', CH: 'Switzerland', FR: 'France', GB: 'United Kingdom' }[PLACES[target].country]}, was ${PRINT_TOWNS[target]}.`,
        };
      },
    },
    {
      id: 'who-print',
      type: 'choice',
      review: true,
      gen: (rng) => whoStep(rng, 'print'),
    },
    {
      id: 'reflect',
      type: 'reflect',
      title: 'Then and now',
      text: `
        Printing let one person reach thousands of readers without asking
        anyone's permission. The internet did something similar in our own time.

        **Name one way the two are alike, and one way they differ.**
      `,
      model: `
        Alike: both made it far cheaper to publish, so new voices were heard
        (Luther then, anyone with a phone now); both spread news and learning
        quickly, and rumours and hatred along with them; both alarmed the
        authorities, who tried to control them with lists of banned books or
        with filters. Different: print took weeks to travel and reached only
        people who could read and pay, while the internet is instant, nearly
        free and worldwide; and a printed page stays the same, while a web page
        can change or vanish.
      `,
    },
  ],
  recap: [
    'Printing was invented in East Asia; movable metal type was used in Korea by 1377. In Europe it met an alphabet of a few dozen letters, and took off.',
    'From Gutenberg\'s Bible (about 1455) to 1500, presses in over 250 towns printed millions of books, more and more of them in everyday languages.',
    'The Renaissance revived ancient learning and invented perspective; print spread both.',
    'Luther\'s protest of 1517, carried by print, split western Christianity into Protestant and Catholic: the Reformation.',
  ],
  next: 'Next: printed star tables and a new instrument, the telescope, are about to move the Earth from the centre of the universe.',
};
