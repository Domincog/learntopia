// First Worlds: To 500 CE · Lesson 5 · Persians, Greeks and Alexander
//
// Driving question: how do you hold together an empire that takes three months to cross, and how did
// Greek style end up on a statue of the Buddha in what is now Pakistan?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-ancient/index.js';
import { at, mark, markerQuiz, orderEvents, EVENTS, yearOf } from '../helpers.js';

// A rough outline of the Persian (Achaemenid) Empire at its greatest extent, about 500 BCE.
export const PERSIA = [[24, 40.9], [26.5, 42], [29, 41.3], [33, 42], [36, 41.6], [41.5, 41.5], [45, 42.5], [48.5, 42], [49.5, 40.3], [49, 38.3], [50.5, 37], [54, 36.9], [53.8, 39], [53, 41], [58.5, 43.8], [63, 44.5], [68, 42.5], [71.5, 41], [73.5, 39], [73.5, 37], [74, 34.5], [73, 31], [70.5, 27.5], [68, 24.2], [62, 25.2], [57.5, 25.6], [56.5, 27], [52, 27.6], [50, 30], [48.5, 30], [44, 29.5], [40, 31], [36, 29], [34.5, 28], [35, 24], [33, 22.5], [29, 22.5], [25, 28], [20, 30.5], [20, 32.7], [25, 31.7], [31, 31.4], [34, 31.2], [35.8, 35], [36, 36.6], [30, 36.3], [27.5, 36.8], [26.5, 39], [26, 40.3]];
const ROYAL_ROAD = [at('sardis'), [31.99, 39.65], [35, 39], [38.3, 38.4], [43.1, 36.4], [44.4, 34.5], at('susa')];

const GREEK = [
  { place: 'massalia', ask: 'Massalia, the Greek colony that is now Marseille in France', about: 'Greeks from the coast of Asia Minor founded it about 600 BCE.' },
  { place: 'neapolis', ask: 'Neapolis, the Greek "new city" that is now Naples in Italy', about: 'so many Greeks settled in southern Italy that the Romans called it Great Greece.' },
  { place: 'syracuse', ask: 'Syracuse, the greatest Greek city on the island of Sicily', about: 'founded from Corinth about 734 BCE, it grew as large as Athens.' },
  { place: 'byzantion', ask: 'Byzantion, the Greek colony on the strait between Europe and Asia', about: 'it later became Constantinople, and then Istanbul.' },
  { place: 'cyrene', ask: 'Cyrene, a Greek city on the coast of Africa', about: 'it was founded about 630 BCE in what is now Libya.' },
  { place: 'athens', ask: 'Athens', about: 'it was the largest city of mainland Greece.' },
];

// A dot on the lesson's timeline, with its date and wording taken from the course table.
// (`year` overrides the table's mid-point where the label names a different moment: "Parthenon begun".)
const dot = (id, label, color, short = label, year = yearOf(id)) => ({
  id, year, label, short, color,
  note: `**${EVENTS[id].when.charAt(0).toUpperCase()}${EVENTS[id].when.slice(1)}.** ${EVENTS[id].text}.`,
});

const ORDER_POOL = ['olympics', 'cyrus-babylon', 'athens-democracy', 'marathon', 'parthenon', 'socrates', 'alexander-dies', 'eratosthenes', 'gandhara-art'];

export default {
  id: 'persia-greece',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'The king\'s post',
      text: `
        About 500 BCE the Persian king Darius ruled from the Aegean Sea to the
        Indus. His **Royal Road** ran some 2,700 km from Sardis, near the Aegean,
        to his court at Susa. A traveller on foot needed about **90 days**.

        **How many days do you think the king's messengers needed?**
      `,
      min: 1, max: 90, step: 1, answer: 8, tolerance: 2, unit: 'days', start: 45,
      explain: `
        About **seven to nine days**. Every day's ride along the road stood a
        station with fresh horses and a fresh rider, and the message was handed
        on like a baton. The Greek historian Herodotus wrote that nothing stopped
        these riders: not snow, rain, heat or darkness.

        News that travels ten times faster than an army is how one king could
        rule the largest empire the world had yet seen.
      `,
    },
    {
      id: 'empire',
      type: 'info',
      title: 'The Persian way to rule',
      text: `
        **Cyrus** of Persia, from what is now Iran, founded the empire about
        550 BCE. When he took Babylon in 539 BCE he let the peoples deported there
        go home, the Jews among them, and rebuild their temples.

        **Darius** (ruled 522 to 486 BCE) gave the empire its shape:

        - about twenty provinces, each under a governor called a **satrap**
        - royal roads, standard coins and fixed taxes
        - no attempt to make everyone Persian: each people kept its own
          language, laws and gods

        It stretched across what are now more than a dozen countries, from Turkey
        and Egypt to Pakistan.
      `,
      figure: {
        type: 'world-map', view: [16, 16, 80, 48],
        areas: [{ polygon: PERSIA, color: 'orange', label: 'Persian Empire, about 500 BCE (roughly)', labelAt: [62, 37] }],
        lines: [{ points: ROYAL_ROAD, color: 'red', width: 3, label: 'Royal Road' }],
        markers: [
          mark('sardis', { labelPos: 'left' }), mark('susa', { labelPos: 'bottom' }),
          mark('persepolis', { labelPos: 'right' }), mark('babylon', { labelPos: 'left' }),
        ],
        alt: 'A map from Greece to India. A shaded area covers Turkey, Egypt, the Levant, Iraq, Iran, Afghanistan and Pakistan as far as the Indus. A red line, the Royal Road, runs from Sardis in western Turkey to Susa in south-west Iran. Babylon and Persepolis are also marked.',
      },
    },
    {
      id: 'persepolis',
      type: 'choice',
      title: 'A message in stone',
      text: `
        Darius built a ceremonial capital at **Persepolis**. Carved along its great
        stairway, delegations from 23 peoples of the empire climb towards the
        king, each in its own dress, each bringing gifts from home. These three
        men, thought to be Lydians from what is now western Turkey, carry bowls
        and fine metal jars.

        **How has the king chosen to show his subjects?**
      `,
      figure: photo(MEDIA['persepolis-relief'], {
        alt: 'A stone relief of three bearded men in profile, walking in line. They wear tall fluted caps, earrings and long pleated robes. One holds out a pair of bowls, one lifts two jars with handles shaped like animals.',
        caption: 'Gift-bearers on the Apadana stairway, Persepolis, Iran, about 500 BCE',
        creditLabel: 'Relief',
      }),
      options: [
        { text: 'As dignified guests bringing gifts', correct: true },
        { text: 'As beaten enemies, bound and kneeling', why: 'Look again: nobody is bound, nobody kneels, nobody is hurt. They walk upright and carry their gifts with care.' },
        { text: 'As labourers building his palace', why: 'They carry bowls and jars of precious metal, not tools or stone.' },
      ],
      explain: `
        Many ancient kings liked to be shown trampling their enemies. Here the
        Persian kings chose to be shown **receiving** their subjects, and the
        sculptors took care over each people's clothes, hair and gifts.

        It was a policy as much as a picture: an empire of many peoples, each
        keeping its own ways. People who are left their customs have less
        reason to rebel.

        Around their palaces the kings laid out walled gardens full of trees
        and running water. The Greeks borrowed the Persian word for such a
        garden, and we still use it: *paradise*.
      `,
    },
    {
      id: 'greek-world',
      type: 'info',
      title: 'Frogs around a pond',
      text: `
        On the empire's western edge lived the **Greeks**. Mountains and sea cut
        their land into small pockets, and each pocket was its own tiny state: a
        ***polis***, a city with its farmland. There were about a thousand.

        When a polis outgrew its land, it sent out a shipload of settlers to
        found a new one overseas. The philosopher Plato said the Greeks lived
        around their sea like frogs around a pond.

        The Greeks shared a language, gods and festivals, such as the games at
        Olympia, held by tradition from 776 BCE. They never shared a government.
      `,
      figure: {
        type: 'world-map', view: 'mediterranean', zoom: false,
        markers: [
          { at: at('massalia'), label: 'Massalia', color: 'blue', labelPos: 'top' },
          { at: at('neapolis'), label: 'Neapolis', color: 'blue', labelPos: 'top' },
          { at: at('syracuse'), label: 'Syracuse', color: 'blue', labelPos: 'bottom' },
          { at: at('cyrene'), label: 'Cyrene', color: 'blue', labelPos: 'bottom' },
          { at: at('byzantion'), label: 'Byzantion', color: 'blue', labelPos: 'top' },
          { at: at('athens'), label: 'Athens', color: 'red', labelPos: 'right' },
          { at: at('sparta'), label: 'Sparta', color: 'red', labelPos: 'left' },
        ],
        alt: 'A map of the Mediterranean. Athens and Sparta are marked in Greece. Greek colonies are marked on coasts far away: Massalia in southern France, Neapolis in Italy, Syracuse in Sicily, Cyrene in Libya and Byzantion on the strait leading to the Black Sea.',
      },
    },
    {
      id: 'find-greek',
      type: 'interact',
      review: true,
      gen: (rng) => markerQuiz(rng, GREEK, {
        view: 'mediterranean', minKm: 500,
        alt: 'A map of the Mediterranean without names. Four lettered markers stand on its coasts.',
      }),
    },
    {
      id: 'athens-vote',
      type: 'slider',
      mode: 'predict',
      title: 'People power, for some',
      text: `
        About 508 BCE Athens began an experiment: ***demokratia***, "power of the
        people". Laws, taxes and wars were decided by citizens voting in an
        open-air assembly.

        About 430 BCE some 250,000 to 300,000 people lived in Athens and its
        countryside. **What share of them do you think could vote?**
      `,
      min: 0, max: 100, step: 1, answer: 15, tolerance: 7, unit: '%', start: 50,
      explain: `
        Perhaps **10 to 20%**; the numbers are estimates. Only adult male
        citizens could vote: some 30,000 to 60,000 men. Women, foreigners living
        in the city and enslaved people, who may have been a third of the
        population or more, had no say.

        For those citizens, though, it was more direct than any democracy today.
        Any of them could speak in the assembly, most officials were chosen by
        lottery, and juries had hundreds of members.
      `,
    },
    {
      id: 'teach-two-cities',
      type: 'info',
      title: 'Two cities, two ways to live',
      text: `
        Two cities led the Greeks, and they could hardly have been less alike.

        **Athens** was a sea power with a great fleet. Its citizens ran the
        city themselves, in the assembly and the law courts, and it loved
        talk, theatre and fine building. The **Parthenon** in the picture, a
        temple on the rock above the city, went up in the fifth century BCE.

        **Sparta** was a land power organised for war. Two kings ruled
        together, with a council of elders. Citizen men were full-time
        soldiers, trained from boyhood, while a conquered people, the
        *helots*, farmed for them. Spartan women had more freedom than
        Athenian women, and could own land.
      `,
      figure: photo(MEDIA.parthenon, {
        alt: 'A ruined building of pale stone on a rocky height, seen from one corner: a rectangle of tall fluted columns that still carry part of the roof beam and of a triangular gable.',
        caption: 'The Parthenon, temple of the goddess Athena, Athens',
      }),
    },
    {
      id: 'sparta-athens',
      type: 'bucket',
      title: 'Two very different cities',
      text: `
        One city of ships and talk, one of soldiers.

        **Sort these: Athens or Sparta?**
      `,
      buckets: ['Athens', 'Sparta'],
      items: [
        { text: 'Most officials are chosen by lottery', bucket: 0 },
        { text: 'Plays are staged at a festival in an open-air theatre', bucket: 0 },
        { text: 'Poorer citizens row the warships of a great fleet', bucket: 0 },
        { text: 'The Parthenon is built on a rock above the city', bucket: 0 },
        { text: 'Two kings rule at the same time', bucket: 1 },
        { text: 'Boys leave home at seven for army training', bucket: 1 },
        { text: 'Women own land and train as athletes', bucket: 1, why: 'Spartan women had more freedom and more property than women in Athens, who could not own land.' },
        { text: 'A conquered people farms the land', bucket: 1 },
      ],
      explain: `
        Athens: a sea power, a talking city of assemblies, law courts and
        theatre. Sparta: a land power ruled by two kings and a council of elders,
        where citizens were full-time soldiers.

        Neither was free in our sense. Athens ran on enslaved labour; Sparta
        on the helots. And Spartan women owned land when Athenian women could not.
      `,
    },
    {
      id: 'wars',
      type: 'choice',
      title: 'Whose story?',
      text: `
        In 490 BCE Athenians beat a Persian force at **Marathon**. Ten years later
        King Xerxes came with a great army. Athens was burned, but the Greek
        fleet won in the strait of **Salamis** (where Queen Artemisia commanded
        ships for Xerxes), and within a year the Persians had withdrawn.

        Nearly all we know of this comes from Greek writers, above all
        **Herodotus**. **What should a careful reader keep in mind?**
      `,
      options: [
        { text: 'We hear one side. For Persia this was a setback on a far frontier', correct: true },
        { text: 'Herodotus cannot be trusted about anything', why: 'Too harsh. Much of what he reports fits inscriptions and archaeology, and he asked people on both sides. One-sided is not the same as worthless.' },
        { text: 'Free men will always defeat the subjects of a king', why: 'That is the story the winners told. Many Greek cities fought for Xerxes, and ships, supplies and narrow waters decided the battles.' },
      ],
      explain: `
        The wars mattered enormously to the Greeks, and their accounts are
        vivid. The Persian Empire lost a campaign, not its power: it remained
        the great state of the region for another 150 years, and often decided
        Greek quarrels with its gold.

        Herodotus was himself born a Persian subject. He called his work
        *historiai*, "inquiries": the origin of our word **history**.
      `,
    },
    {
      id: 'which-building',
      type: 'choice',
      review: true,
      text: 'With the Persians gone, Athens rebuilt its burned temples in marble. **Which of these did Athenians build, in the fifth century BCE?**',
      options: [
        { figure: photo(MEDIA.parthenon, { alt: 'A ruined building of pale stone on a rocky height: a rectangle of tall fluted columns carrying the remains of a roof beam.' }), correct: true },
        { figure: photo(MEDIA.giza, { alt: 'Three huge pyramids of stone blocks in a desert, with three small ones in front.' }), why: 'These are the pyramids of Giza in Egypt, about 2,000 years older.' },
        { figure: photo(MEDIA['pont-du-gard'], { alt: 'A tall bridge of three rows of stone arches, one above the other, crossing a river valley.' }), why: 'This is a Roman aqueduct in France, built some five centuries later.' },
        { figure: photo(MEDIA['great-bath'], { alt: 'Low walls of red-brown brick around a rectangular sunken pool with steps.' }), why: 'This is the Great Bath of Mohenjo-daro in the Indus valley, about 2,000 years older.' },
      ],
      explain: `
        The **Parthenon**, temple of the goddess Athena, was built on the
        Acropolis between 447 and 432 BCE, partly with money that Athens' allies
        had paid for the common defence. Its columns and triangular gable have
        been copied on banks, museums and parliaments ever since.
      `,
    },
    {
      id: 'teach-timeline',
      type: 'info',
      title: 'Greeks and Persians on one line',
      text: `
        Here is the lesson so far, in time. **Tap a dot or the bar** to read
        about it.

        The Persian Empire outlasted its defeat in Greece by a century and a
        half. In those years Athens built the Parthenon and went on arguing,
        in its assembly and in its streets. The philosopher **Socrates**, who
        questioned everyone he met, was put to death there in 399 BCE.

        Then, in 336 BCE, a twenty-year-old became king of Macedon, north
        of Greece.
      `,
      figure: {
        type: 'timeline', from: -800, to: -300, step: 100, mode: 'explore', showYears: true,
        events: [
          dot('olympics', 'First Olympic Games', 'blue', 'Olympics'),
          dot('cyrus-babylon', 'Cyrus takes Babylon', 'orange', 'Cyrus'),
          dot('athens-democracy', 'Athenian democracy', 'blue', 'Democracy'),
          dot('marathon', 'Marathon', 'blue'),
          dot('parthenon', 'Parthenon begun', 'blue', 'Parthenon', -447),
          dot('socrates', 'Socrates put to death', 'blue', 'Socrates'),
          dot('alexander-king', 'Alexander king', 'red', 'Alexander'),
        ],
        spans: [{ id: 'persia', from: -550, to: -330, label: 'Persian Empire', color: 'orange', note: '**From about 550 BCE to the 330s BCE.** The Persian Empire, from Cyrus to its conquest by Alexander.' }],
        alt: 'A timeline from 800 BCE to 300 BCE. The first Olympic Games in 776 BCE; Cyrus takes Babylon in 539 BCE; Athens begins its democracy about 508 BCE; the battle of Marathon in 490 BCE; the Parthenon is begun in 447 BCE; Socrates is put to death in 399 BCE; Alexander becomes king in 336 BCE. A bar shows the Persian Empire from about 550 BCE to the 330s BCE.',
      },
    },
    {
      id: 'alexander',
      type: 'interact',
      tone: 'sober',
      title: 'Eleven years',
      text: `
        In 336 BCE **Alexander**, aged twenty, became king of Macedon, north of
        Greece. In 334 he invaded the Persian Empire. He took Egypt and founded
        **Alexandria** (331), captured **Babylon** the same year, fought his way
        to **Samarkand** (329) and crossed the **Indus** (326). A little beyond it
        his army refused to go further. He died in Babylon in 323, aged 32.

        **Tap the five places in the order he reached them.**
      `,
      widget: {
        type: 'world-map', view: [16, 18, 80, 47], mode: 'trace', zoom: false,
        answer: ['pella', 'alexandria', 'babylon', 'samarkand', 'taxila'],
        areas: [{ polygon: PERSIA, color: 'orange', label: 'Persian Empire (roughly)', labelAt: [58, 33.5] }],
        markers: [
          mark('pella', { label: 'Macedon', labelPos: 'top' }),
          mark('alexandria', { labelPos: 'bottom' }),
          mark('babylon', { labelPos: 'bottom' }),
          mark('samarkand', { labelPos: 'top' }),
          mark('taxila', { label: 'The Indus', labelPos: 'right' }),
        ],
        alt: 'A map from Greece to India with the Persian Empire shaded. Five markers: Macedon in northern Greece, Alexandria on the coast of Egypt, Babylon in Iraq, Samarkand in Central Asia and the Indus in northern Pakistan.',
      },
      check: (s) => {
        if (s.count < 5) return 'Visit all five places.';
        if (s.route[0] !== 'pella') return 'He set out from his own kingdom, Macedon.';
        return s.route.join() === 'pella,alexandria,babylon,samarkand,taxila' || 'Check the dates in the text: Egypt first, then Babylon, then Samarkand, and the Indus last.';
      },
      solution: { route: ['pella', 'alexandria', 'babylon', 'samarkand', 'taxila'] },
      explain: `
        Macedon, Egypt, Babylon, Samarkand, the Indus: Alexander took over the
        whole Persian Empire, and its roads and satraps with it. He married
        Roxana, a princess from Central Asia, and wore Persian dress, to the
        disgust of some of his officers.

        His conquests were also brutal. Cities that resisted, such as Tyre and
        Thebes, were destroyed and their people sold into slavery.
      `,
    },
    {
      id: 'eratosthenes',
      type: 'fill',
      title: 'Measuring the world from a library',
      text: `
        Alexander's generals divided his empire. In Egypt the Ptolemies made
        **Alexandria** a Greek-speaking city of learning, with a library that
        aimed to hold every book in the world.

        About 240 BCE its librarian **Eratosthenes** used the idea of latitude
        that you met in *The World at a Glance*. At noon on midsummer's day the
        Sun stood overhead at Syene. In Alexandria, about 800 km north, it stood
        **7.2°** away from overhead. So the two cities lie 7.2° apart on the
        Earth's full circle of 360°.
      `,
      figure: {
        type: 'world-map', view: [24, 21, 37, 33], zoom: false, rivers: ['Nile'],
        lines: [{ points: [at('alexandria'), at('syene')], color: 'red', dashed: true, label: 'about 800 km' }],
        markers: [mark('alexandria', { labelPos: 'left' }), mark('syene', { label: 'Syene', labelPos: 'left' })],
        alt: 'A map of Egypt with the Nile. Alexandria is marked on the Mediterranean coast and Syene far to the south on the Nile; a dashed line about 800 km long joins them.',
      },
      template: '360° ÷ 7.2° = [[50]], so the distance all the way round the Earth is that many times 800 km: about [[40000]] km.',
      hints: ['7.2 goes into 360 exactly fifty times.', 'Fifty lots of 800 km.'],
      explain: `
        Fifty times 800 km is **40,000 km**: the true figure is about 40,008 km
        through the poles. We do not know the exact length of the unit
        Eratosthenes used, but his answer was right to within a few per cent, or
        at worst about 15.

        Educated people knew the Earth was a sphere, and roughly how big it was,
        1,700 years before Columbus sailed.
      `,
    },
    {
      id: 'gandhara',
      type: 'interact',
      title: 'Where two worlds met',
      text: `
        After Alexander, Greek-speaking kings ruled for two centuries in
        **Gandhara**, now north-west Pakistan and eastern Afghanistan. Long after
        they had gone, about the second century CE, Buddhist sculptors there
        carved this figure of the Buddha.

        Greek sculptors gave their gods wavy hair, and cloaks that hang in
        heavy, natural folds. **Tap one detail that would look at home on a Greek statue.**
      `,
      widget: photo(MEDIA['gandhara-buddha'], {
        alt: 'The upper part of a grey stone statue of a man with a calm face and long earlobes. His wavy hair is gathered in a knot on top of his head, and a large round disc stands behind his head. He wears a heavy robe that falls from both shoulders in deep, curving folds.',
        creditLabel: 'Sculpture',
        hotspots: [
          { id: 'hair', x: 0.5, y: 0.145, r: 0.13, label: 'Wavy hair', alt: 'the wavy hair and topknot' },
          { id: 'halo', x: 0.2, y: 0.15, r: 0.1, label: 'A halo', alt: 'the round disc behind the head' },
          { id: 'ears', x: 0.66, y: 0.29, r: 0.07, label: 'Long earlobes', alt: 'a long earlobe' },
          { id: 'robe', x: 0.47, y: 0.575, r: 0.2, label: 'Deep, natural folds', alt: 'the folds of the robe across the body' },
        ],
      }),
      check: (s) => ['hair', 'robe'].includes(s.picked) || (s.picked === 'halo' ? 'The disc is a halo, the sign of a holy person. It tells you who this is, not how the carver was trained. Look at the hair or the cloth.' : s.picked === 'ears' ? 'The long earlobes belong to the Indian tradition: they are said to have been stretched by the heavy earrings the Buddha wore as a prince. Look at the hair or the cloth.' : false),
      solution: { picked: 'robe' },
      explain: `
        The hair falls in waves like a Greek god's, and the robe hangs in heavy
        folds like a Greek or Roman cloak. The subject and the meaning are
        wholly Buddhist: the halo, the long earlobes, the calm of awakening.

        Earlier Buddhist art had shown the Buddha only through symbols: a
        footprint, an empty seat, a wheel. The first images of him in human form
        were made in Gandhara and at Mathura in India at about the same time.
        Neither "East" nor "West" made this statue alone.
      `,
    },
    {
      id: 'order-classical',
      type: 'order',
      review: true,
      text: '**Put these in order**, from the earliest to the latest.',
      gen: (rng) => orderEvents(rng, ORDER_POOL, { n: 4, gap: 40, fallback: ['olympics', 'cyrus-babylon', 'marathon', 'alexander-dies'] }),
    },
    {
      id: 'echo-words',
      type: 'match',
      review: true,
      title: 'Echoes in your own words',
      text: '**Match each English word with where it comes from.**',
      pairs: [
        ['democracy', 'Greek: "power of the people"'],
        ['politics', 'Greek *polis*: a city and its citizens'],
        ['paradise', 'Old Persian: a walled garden'],
        ['marathon', 'A battlefield near Athens, 490 BCE'],
        ['history', 'Greek: "inquiries", the title Herodotus used'],
      ],
      explain: `
        Greek gave us *democracy*, *politics*, *theatre*, *philosophy* and
        *history*. **Paradise** is Persian: the word for the walled gardens of
        the kings. The marathon race was invented in 1896, named after the
        battle.
      `,
    },
  ],
  recap: [
    'The **Persian Empire** (from about 550 BCE) ruled from Egypt to the Indus through satraps, royal roads and coins, and let its many peoples keep their own ways.',
    'The **Greeks** lived in about a thousand independent city-states around the Mediterranean and Black Sea. Athens tried direct democracy, for adult male citizens only.',
    '**Alexander** of Macedon conquered the Persian Empire between 334 and 323 BCE, as far as the Indus.',
    'Afterwards Greek language and learning mixed with older traditions from Egypt to India: Alexandria\'s library, Eratosthenes measuring the Earth, the Buddhas of Gandhara.',
  ],
  next: 'Next: while Alexander\'s heirs quarrelled, two new powers were growing at the far ends of Eurasia. One was a city in Italy. The other was about to unite China.',
};
