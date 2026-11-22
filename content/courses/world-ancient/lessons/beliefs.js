// First Worlds: To 500 CE · Lesson 7 · Ideas That Outlived Empires
//
// Driving question: where and when did the great traditions of the classical world begin, and how
// did they travel so far beyond the places and the empires they were born in?
//
// This lesson describes living religions. It says what their followers believe and do, in terms they
// would recognise, and never judges or ranks them.
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-ancient/index.js';
import { at, mark, markerQuiz, traditionQuiz, ROME_LATE } from '../helpers.js';

const BEGAN = [
  { place: 'athens', ask: 'the city where Socrates, Plato and Aristotle taught', about: 'Athens became the centre of Greek philosophy.' },
  { place: 'jerusalem', ask: 'Jerusalem, where the Jewish Temple stood and where the first Christians gathered', about: 'the city is holy to Jews and Christians, and later to Muslims as well.' },
  { place: 'etchmiadzin', ask: 'Armenia, the first kingdom whose ruler adopted Christianity', about: 'Armenia lies in the mountains between the Black Sea and the Caspian Sea.' },
  { place: 'aksum', ask: 'Aksum, the African kingdom whose king became a Christian about 330 CE', about: 'Aksum lay in the highlands of what is now Ethiopia and Eritrea.' },
  { place: 'sarnath', ask: 'the plain of the River Ganges, where the Buddha taught', about: 'the Buddha gave his first sermon at Sarnath, near Varanasi on the Ganges.' },
  { place: 'qufu', ask: 'the home of Confucius', about: 'Confucius was born at Qufu, in what is now Shandong in northern China.' },
];

export default {
  id: 'beliefs',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'What lasts?',
      text: `
        The Persian, Roman and Han empires are long gone. Seven great traditions
        of belief and thought also took shape before 500 CE: Hinduism, Buddhism,
        Confucianism, Daoism, Zoroastrianism, Judaism and Christianity.

        **How many of the seven do you think still have followers today?**
      `,
      shuffle: false,
      options: [
        { text: 'Two or three' },
        { text: 'About half' },
        { text: 'All seven', correct: true },
      ],
      explain: `
        **All seven.** Christianity, Hinduism and Buddhism alone have more than
        three billion followers between them. Not one of the empires that ruled
        when they began has survived.

        This lesson asks where these traditions started, and how they
        travelled so far from home.
      `,
    },
    {
      id: 'where',
      type: 'info',
      title: 'Where they began',
      text: `
        Each of these traditions grew up in one of the regions of cities and
        writing that you have met in this course:

        - on the plain of the **Ganges**: the Hindu traditions and Buddhism
        - in **northern China**: the teachings of Confucius, and Daoism
        - among the **ancient Iranians**: Zoroastrianism, which follows the prophet Zarathustra and worships one supreme God, Ahura Mazda
        - in and around **Jerusalem**: Judaism, and later Christianity, which began among Jews
        - in **Athens**: Greek philosophy, a way of seeking truth by argument

        They knew little or nothing of each other at first. Trade routes and
        empires would change that.
      `,
      figure: {
        type: 'world-map', view: [12, 4, 126, 50], zoom: false,
        markers: [
          { at: at('athens'), label: 'Greek philosophy', color: 'blue', labelPos: 'top' },
          { at: at('jerusalem'), label: 'Judaism, Christianity', color: 'violet', labelPos: 'bottom' },
          { at: at('sarnath'), label: 'Hinduism, Buddhism', color: 'orange', labelPos: 'bottom' },
          { at: at('qufu'), label: 'Confucius, Daoism', color: 'red', labelPos: 'top' },
        ],
        labels: [{ at: [58, 33.5], text: 'Zoroastrianism', style: 'area' }],
        alt: 'A map from Greece to China. Markers: Greek philosophy at Athens; Judaism and Christianity at Jerusalem; Hinduism and Buddhism on the Ganges plain in northern India; Confucius and Daoism in northern China. Zoroastrianism is written across Iran.',
      },
    },
    {
      id: 'when',
      type: 'interact',
      graded: false,
      title: 'When they began',
      text: `
        Some of these teachers were near neighbours in time, though they lived
        thousands of kilometres apart and never heard of each other.

        Tap the bars and dots to read about them. Three of the teachers were
        alive within a single century: **tap any one of those three** and press
        Check.
      `,
      widget: {
        type: 'timeline', from: -1600, to: 500, step: 500, mode: 'explore',
        spans: [
          { id: 'vedas', from: -1500, to: -500, label: 'The Vedas are composed', color: 'orange', note: '**India, about 1500 to 500 BCE.** The hymns and teachings of the Vedas were composed over about a thousand years and passed on by memory. The Hindu traditions grew from them.' },
          { id: 'zoroaster', from: -1500, to: -600, label: 'Zoroaster (date unknown)', color: 'gray', note: '**Zarathustra (Zoroaster)** taught among the ancient Iranians. Nobody knows when: estimates run from before 1200 BCE to about 600 BCE.' },
          { id: 'confucius', from: -551, to: -479, label: 'Confucius', color: 'red', note: '**Kong Qiu (Confucius), 551 to 479 BCE,** taught in northern China in an age of warring states.' },
          { id: 'buddha', from: -480, to: -400, label: 'The Buddha', color: 'orange', note: '**Siddhartha Gautama, the Buddha,** taught in northern India, probably in the fifth century BCE. An older tradition gives 563 to 483 BCE; many scholars now think he died nearer 400 BCE.' },
          { id: 'socrates', from: -470, to: -399, label: 'Socrates', color: 'blue', note: '**Socrates, about 470 to 399 BCE,** questioned his fellow citizens in Athens.' },
        ],
        events: [
          { id: 'temple', year: -586, label: 'Temple destroyed', short: 'Temple', color: 'violet', note: '**586 BCE.** Babylon destroys the Temple in Jerusalem and deports many of the people of Judah. In exile their scriptures take lasting shape.' },
          { id: 'ashoka', year: -250, label: 'Ashoka', color: 'orange', note: '**About 250 BCE.** The Indian emperor Ashoka supports Buddhism and has its values carved on pillars and rocks.' },
          { id: 'jesus', year: 30, label: 'Jesus', color: 'violet', note: '**About 30 CE.** Jesus of Nazareth is crucified in Jerusalem. His followers become the first Christians.' },
          { id: 'legal', year: 313, label: 'Constantine', color: 'violet', note: '**313 CE.** The emperor Constantine makes Christianity legal in the Roman Empire.' },
        ],
        alt: 'A timeline from 1600 BCE to 500 CE. The Vedas are composed from about 1500 to 500 BCE. Zoroaster lived at an unknown date between about 1500 and 600 BCE. Confucius (551 to 479 BCE), the Buddha (fifth century BCE) and Socrates (about 470 to 399 BCE) lived close together in time. The Temple in Jerusalem was destroyed in 586 BCE, Ashoka ruled about 250 BCE, Jesus was crucified about 30 CE, and Constantine made Christianity legal in 313 CE.',
      },
      check: (s) => ['confucius', 'buddha', 'socrates'].includes(s.selected) || (s.selected === 'zoroaster' ? 'Nobody knows when Zoroaster lived. Look for three short bars close together.' : s.selected ? 'That one stands apart in time. Look for three short bars close together, around 500 BCE.' : 'Tap a bar or a dot on the line.'),
      solution: { selected: 'buddha' },
      explain: `
        **Confucius, the Buddha and Socrates** lived within about a century of
        one another, in China, India and Greece. The philosopher Karl Jaspers
        called these centuries the "Axial Age", a turning point in human
        thought.

        Historians treat that label with care. The dates fit loosely
        (Zoroaster may be far earlier, Jesus is later), and the teachings
        differ a great deal.
      `,
    },
    {
      id: 'hindu-roots',
      type: 'info',
      title: 'A tradition without a founder',
      text: `
        One of the seven, among the oldest, has no single founder and no starting date. Its
        earliest texts, the **Vedas**, are hymns in Sanskrit, memorised word for
        word by generations of priests. Later teachers asked what lies behind
        the many gods and the changing world.

        From these roots grew the family of traditions now called **Hinduism**.
        Ideas that most Hindus share:

        - **dharma**: right conduct, the duties that hold the world together
        - **karma**: every action has consequences, in this life or another
        - the soul is reborn, and can win **moksha**, release from that cycle

        Hindus worship in many ways. Many understand the gods and goddesses,
        such as Vishnu, Shiva and Devi, as forms of one ultimate reality.
      `,
    },
    {
      id: 'buddha',
      type: 'choice',
      title: 'The Middle Way',
      text: `
        **Siddhartha Gautama** was born at Lumbini, in what is now Nepal, into a
        ruling family. Tradition says he gave up a life of comfort to seek the
        cause of suffering, and for years nearly starved himself as a wandering
        holy man. Neither life brought him the answer. At Bodh Gaya, Buddhists
        believe, he reached awakening and became the **Buddha**, "the awakened one".

        He called his teaching the **Middle Way**. **Between which two extremes?**
      `,
      options: [
        { text: 'A life of luxury and a life of harsh self-denial', correct: true },
        { text: 'The teachings of India and the teachings of Greece', why: 'He knew nothing of Greece. Think of the two ways of life he had tried himself.' },
        { text: 'Ruling as a king and serving as a soldier', why: 'He had left the ruling class behind altogether. Think of the two ways of life he had tried.' },
      ],
      explain: `
        Having tried both comfort and starvation, the Buddha taught a path
        between them.
      `,
    },
    {
      id: 'teach-buddhism',
      type: 'info',
      title: 'What the Buddha taught',
      text: `
        At the heart of the Buddha's teaching are the **Four Noble Truths**:
        life involves suffering; suffering comes from craving; it can end;
        and the way to end it is the **Eightfold Path** of right
        understanding, conduct and meditation.

        He taught anyone who would listen, whatever their birth, and founded
        communities of monks and of nuns.

        Buddhists say that with his first sermon, at Sarnath, he set the
        **wheel** of the teaching rolling. A wheel has been the sign of the
        Buddha's teaching ever since.
      `,
      figure: {
        type: 'world-map', view: [75, 19.5, 93, 31.5], zoom: false, dots: false, rivers: ['Ganges'],
        markers: [
          mark('lumbini', { label: 'Lumbini: born', color: 'orange', labelPos: 'top' }),
          mark('sarnath', { label: 'Sarnath: first sermon', color: 'orange', labelPos: 'left' }),
          mark('bodh-gaya', { label: 'Bodh Gaya: awakening', color: 'orange', labelPos: 'bottom' }),
        ],
        labels: ['NP', 'IN'],
        alt: 'A map of northern India and Nepal with the River Ganges drawn in bold. Three places in the life of the Buddha are marked: Lumbini in Nepal, where he was born; Bodh Gaya, south of the Ganges, where Buddhists believe he reached awakening; and Sarnath, on the Ganges, where he gave his first sermon.',
      },
    },
    {
      id: 'ashoka',
      type: 'interact',
      tone: 'sober',
      title: 'An emperor changes course',
      text: `
        About 260 BCE the emperor **Ashoka** conquered the kingdom of Kalinga.
        The slaughter horrified him. He turned to the Buddha's teaching and had
        messages carved on rocks and pillars across India: against cruelty, for
        respect between all religions. This carving once crowned one of his
        pillars, at Sarnath.

        One detail of it, the sign of the Buddha's teaching, is at the centre
        of India's flag today. **Tap that detail.**
      `,
      widget: photo(MEDIA['lion-capital'], {
        alt: 'A polished stone carving, taller than it is wide. Lions sit back to back on a round drum; three of them can be seen. On the side of the drum a wheel with many spokes is carved, with a bull on one side of it and an elephant on the other. The drum rests on a bell-shaped base carved like petals.',
        creditLabel: 'Sculpture',
        hotspots: [
          { id: 'lions', x: 0.5, y: 0.17, r: 0.16, label: 'Four lions, back to back', alt: 'the heads of the lions at the top' },
          { id: 'wheel', x: 0.5, y: 0.617, r: 0.13, label: 'The wheel of the teaching', alt: 'a wheel with many spokes on the side of the drum' },
          { id: 'base', x: 0.5, y: 0.9, r: 0.09, label: 'A base shaped like a lotus', alt: 'the bell-shaped base carved like petals' },
        ],
      }),
      check: (s) => s.picked === 'wheel' || (s.picked === 'lions' ? 'The lions are India\'s national emblem, on its coins and passports. The flag carries something simpler.' : s.picked === 'base' ? 'Not the base. Look for a shape that could sit in the middle of a flag.' : false),
      solution: { picked: 'wheel' },
      explain: `
        The **wheel** of the teaching, carved where Buddhists say the Buddha
        first set it rolling. Today it is at the centre of India's flag, and
        the four lions are the national emblem.

        Ashoka's edicts were written in local languages. At Kandahar, in the
        lands Alexander had conquered, they were carved in Greek.
      `,
    },
    {
      id: 'travels',
      type: 'interact',
      title: 'The long way round',
      text: `
        Buddhist monks travelled with merchants. The direct way from the Ganges
        to China is blocked by the Himalaya and the high Tibetan Plateau, so the
        teaching went **round**: north-west through the passes to Gandhara, over
        the mountains to the oasis towns of Central Asia, then east along the
        Silk Road.

        **Tap the five places in order**, from Bodh Gaya to Luoyang.
      `,
      widget: {
        type: 'world-map', view: [60, 14, 122, 47], mode: 'trace', zoom: false,
        answer: ['bodh-gaya', 'taxila', 'kashgar', 'dunhuang', 'luoyang'],
        markers: [
          mark('bodh-gaya', { labelPos: 'bottom' }),
          mark('taxila', { label: 'Gandhara', labelPos: 'left' }),
          mark('kashgar', { labelPos: 'top' }),
          mark('dunhuang', { labelPos: 'top' }),
          mark('luoyang', { labelPos: 'bottom' }),
        ],
        labels: [{ at: [88, 32.5], text: 'Tibetan Plateau', style: 'area' }, { at: [83, 28.9], text: 'Himalaya', style: 'area' }],
        alt: 'A map of India, Central Asia and China. Bodh Gaya is marked on the Ganges plain, Gandhara in the north-west, Kashgar and Dunhuang north of the Tibetan Plateau, and Luoyang in northern China. The Himalaya and the Tibetan Plateau lie between India and China.',
      },
      check: (s) => {
        if (s.count < 5) return 'Visit all five places.';
        if (s.route[0] !== 'bodh-gaya') return 'Start at Bodh Gaya, on the Ganges plain.';
        if (s.route[1] !== 'taxila') return 'Not straight over the mountains: first north-west, to Gandhara.';
        return s.route.join() === 'bodh-gaya,taxila,kashgar,dunhuang,luoyang' || 'From Gandhara the road runs to Kashgar, then east through Dunhuang into China.';
      },
      solution: { route: ['bodh-gaya', 'taxila', 'kashgar', 'dunhuang', 'luoyang'] },
      explain: `
        Buddhism was known in China by the first century CE and had spread widely
        by 500 CE, carried along the very routes that carried silk. It also
        went south by sea to Sri Lanka, where it has been followed since the
        third century BCE.

        Geography shaped the journey: the mountains that turned traders aside
        turned the monks aside as well.
      `,
    },
    {
      id: 'teach-china',
      type: 'info',
      title: 'China: three schools for a time of war',
      text: `
        In China, from about 500 BCE, rival states fought for centuries.
        Thinkers argued about how order could be restored.

        | School | Its answer |
        |---|---|
        | **Confucius** (Kong Qiu, 551 to 479 BCE), a teacher from the state of Lu | Order begins with character: humaneness, respect within the family, ritual and learning. His students collected his sayings in the *Analects*. |
        | **Daoism**, whose classic, the *Daodejing*, is linked by tradition to Laozi | Live in harmony with the *Dao*, the Way of nature: simply, and without forcing things (*wu wei*). |
        | **Legalism**, the school the Qin state followed | Strict laws and harsh punishments. |

        Many people in China have drawn on the first two together.
      `,
    },
    {
      id: 'china',
      type: 'choice',
      title: 'Three answers to chaos',
      text: `
        The ruler of one of China's warring states asks three advisers how
        to restore order.

        - *"Make strict laws, and punish without mercy."*
        - *"Do less. Rule a great state as you would cook a small fish: gently."*
        - *"Set an example. If the ruler is just and humane, and children honour their parents, the people will follow."*

        **Which is the advice of Confucius?**
      `,
      shuffle: false,
      options: [
        { text: 'Strict laws and harsh punishments', why: 'That is the school called Legalism, which the Qin state followed. Confucius distrusted rule by fear.' },
        { text: 'Do less, and rule gently', why: 'That is from the Daodejing, the classic of Daoism: follow the Way of nature and do not force things.' },
        { text: 'Lead by example, with humaneness and respect', correct: true },
      ],
      explain: `
        For **Confucius** order begins with character, and with the ruler's
        character first of all. He also taught that you should not do to
        others what you would not want done to yourself. The Han emperors
        made his teaching the schooling of their officials.
      `,
    },
    {
      id: 'scroll',
      type: 'choice',
      tone: 'sober',
      title: 'A people of the book',
      text: `
        Jews believe in **one God**, who made a covenant with the people of
        Israel and gave them the **Torah**. When Babylon destroyed the Temple in
        Jerusalem in 586 BCE, the exiles held on to their faith through its
        writings.

        This scroll, 7 metres long, holds the whole book of Isaiah. It was copied
        about 125 BCE and found in 1947 in a cave near the Dead Sea. The next-oldest complete copies in
        Hebrew are 1,000 years younger. They differ from it mostly in spelling.
        **What does that show?**
      `,
      figure: photo(MEDIA['isaiah-scroll'], {
        alt: 'A very long, narrow strip of yellowed parchment, shown in three sections one above the other. It is made of sheets sewn edge to edge and is covered from end to end with narrow columns of small, neat handwriting.',
        caption: 'The Great Isaiah Scroll, about 125 BCE',
        creditLabel: 'Manuscript',
      }),
      options: [
        { text: 'Scribes copied the text with great care, generation after generation', correct: true },
        { text: 'The text was written in the Middle Ages', why: 'The scroll proves the opposite: it is a thousand years older than the medieval copies.' },
        { text: 'Not one letter ever changed', why: 'There are more than two thousand small differences, mostly spellings and slips. What is striking is how small they are.' },
      ],
      explain: `
        For a thousand years, by hand, the text was passed on with only small
        changes. After the Romans destroyed the rebuilt Temple in 70 CE, Jewish
        life centred on the synagogue, the teacher (rabbi) and the study of the
        Torah, in communities scattered from Spain to Persia.

        **Zoroastrians**, whose faith began in Iran, also worship one supreme God,
        Ahura Mazda, and teach that each person must choose between truth and falsehood.
      `,
    },
    {
      id: 'teach-philosophers',
      type: 'info',
      title: 'Athens: seeking truth by argument',
      text: `
        In Athens a different kind of teaching began: **philosophy**, "love
        of wisdom". It tests every belief by argument and evidence.

        - **Socrates** wrote nothing. He asked questions: *What is justice?
          How do you know?* In 399 BCE an Athenian jury condemned him to death
          for unsettling the young.
        - **Plato**, his pupil, founded a school, the Academy.
        - **Aristotle**, Plato's pupil, studied everything from logic to
          animals. Then he became tutor to a young prince of Macedon:
          the future Alexander the Great.

        Later Jewish, Christian and Muslim thinkers all wrestled with Plato
        and Aristotle, and so did the first scientists.
      `,
      figure: {
        type: 'world-map', view: [17.5, 34.5, 30.5, 42.5], zoom: false, dots: false,
        markers: [
          mark('athens', { color: 'blue', labelPos: 'right' }),
          mark('pella', { label: 'Macedon', color: 'red', labelPos: 'top' }),
        ],
        alt: 'A map of Greece and the Aegean Sea. Athens is marked in the south-east of the mainland. Macedon is marked in the north.',
      },
    },
    {
      id: 'philosophers',
      type: 'order',
      review: true,
      title: 'Teacher and pupil',
      text: `
        In Athens **Socrates** wrote nothing: he asked questions. *What is justice? How do you know?* His pupil founded a school, the Academy. That
        pupil's own student studied everything from logic to animals, and then
        became tutor to a young prince of Macedon.

        **Put the four in order, from teacher to pupil.**
      `,
      items: ['Socrates', 'Plato', 'Aristotle', 'Alexander the Great'],
      labels: ['First teacher', 'Last pupil'],
      explain: `
        Socrates taught Plato, Plato taught Aristotle, and Aristotle taught
        Alexander.

        Their method, testing every belief by **argument and evidence**, is
        called philosophy: "love of wisdom".
      `,
    },
    {
      id: 'christianity',
      type: 'interact',
      tone: 'sober',
      title: 'From Judaea to three continents',
      text: `
        **Jesus of Nazareth**, a Jewish teacher, was crucified by the Roman
        governor of Judaea about 30 CE. Christians believe that God raised him
        from the dead and that he is the Messiah (in Greek, *Christos*), the Son
        of God. Followers such as Paul carried the message along Roman roads and
        sea lanes. In 313 the emperor Constantine made it legal; in 380 it
        became the empire's official religion.

        Two kingdoms **outside** the empire adopted it in the same century: one
        in the mountains of the Caucasus, between the Black Sea and the
        Caspian Sea, and one in the highlands of East Africa. **Tap both.**
      `,
      widget: {
        type: 'world-map', view: [-2, 2, 62, 50], mode: 'pickMarkers', max: 2, markerLabels: 'after', zoom: false,
        answer: ['aksum', 'etchmiadzin'],
        markers: [
          { id: 'rome', at: at('rome'), label: 'Rome' },
          { id: 'etchmiadzin', at: at('etchmiadzin'), label: 'Armenia' },
          { id: 'jerusalem', at: at('jerusalem'), label: 'Jerusalem' },
          { id: 'ctesiphon', at: at('ctesiphon'), label: 'Persian capital' },
          { id: 'aksum', at: at('aksum'), label: 'Aksum' },
        ],
        areas: [{ polygon: ROME_LATE, color: 'red', label: 'Roman Empire, about 350 CE (roughly)', labelAt: [18, 36] }],
        alt: 'A map from France to Iran and south to Ethiopia, with the Roman Empire shaded around the Mediterranean. Five lettered markers: one in Italy, one in the mountains south of the Caucasus, one on the eastern shore of the Mediterranean, one in Iraq and one in the highlands of northern Ethiopia.',
      },
      check: (s) => {
        if (s.picked.join() === 'aksum,etchmiadzin') return true;
        if (s.count < 2) return 'Choose two markers.';
        if (s.picked.includes('rome') || s.picked.includes('jerusalem')) return 'Rome and Jerusalem lay inside the Roman Empire. Look outside the shaded area.';
        if (s.picked.includes('ctesiphon')) return 'The Persian kings were Zoroastrians. Christians lived in their empire, but as a minority.';
        return false;
      },
      solution: { picked: ['aksum', 'etchmiadzin'] },
      hints: ['The Caucasus mountains lie between the Black Sea and the Caspian Sea.', 'The other kingdom lay beside the Red Sea, in what is now Ethiopia and Eritrea.'],
      explain: `
        **Armenia** (marker B) adopted Christianity in the early 300s, by
        tradition in 301, before Rome did. King Ezana of **Aksum** (marker E), in
        what is now Ethiopia and Eritrea, followed about 330. Both churches are
        still alive today.

        By 500 CE there were Christians from Ireland to India: a faith born in
        one small Roman province had outgrown the empire.
      `,
    },
    {
      id: 'which-tradition',
      type: 'choice',
      review: true,
      gen: (rng) => traditionQuiz(rng),
    },
    {
      id: 'where-began',
      type: 'interact',
      review: true,
      gen: (rng) => markerQuiz(rng, BEGAN, {
        view: [12, 2, 126, 50], minKm: 1000,
        alt: 'A map from the Mediterranean to China without names. Four lettered markers.',
      }),
    },
    {
      id: 'reflect',
      type: 'reflect',
      title: 'Why then, why there?',
      text: `
        Confucius, the Buddha, the Hebrew prophets and the Greek philosophers
        taught within a few centuries of one another, in lands that barely
        knew each other existed.

        **In your own words: what did those societies have in common that might help to explain it?** Think back over this course.
      `,
      model: `
        All were lands of **cities, states and trade**, with **writing** to carry
        a teaching beyond one lifetime. All were living through upheaval: warring
        states in China, new kingdoms on the Ganges, exile for the people of
        Judah, war between Greek cities. Old answers no longer satisfied, and
        teachers asked afresh how a person should live and what makes a ruler just.

        Afterwards the roads and sea routes of the great empires, Persian,
        Mauryan, Han and Roman, carried those teachings far from home. The
        empires fell. The ideas kept travelling.
      `,
    },
  ],
  recap: [
    'The **Hindu traditions** grew from the Vedas in India; the **Buddha** taught there in the fifth century BCE, and Buddhism travelled the trade routes to Central Asia and China.',
    'In China **Confucius** taught humane conduct and learning, and **Daoism** harmony with the Way. In Athens, **Socrates, Plato and Aristotle** sought truth by argument.',
    '**Judaism** held to one God and the Torah through exile and dispersal. **Christianity** began among Jews and became the religion of the Roman Empire, of Armenia and of Aksum in the fourth century.',
    'Empires fell, but these ideas travelled on along roads and sea lanes. All of them are followed today.',
  ],
  next: 'You have followed our species from Africa to every continent, through the first farms, cities, scripts and empires. In **Crossroads: 500 to 1500** the regions of the world start to trade, borrow and collide: along the Silk Roads, across the Sahara and the Indian Ocean.',
};
