// First Worlds: To 500 CE · Lesson 4 · Marks That Speak
//
// Driving question: why was writing invented, and how did thousands of picture-signs shrink to an
// alphabet of two dozen letters?
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/world-ancient/index.js';
import { at, mark, orderEvents, EVENTS, yearOf } from '../helpers.js';

// Signs for the "what does one sign stand for?" question.
const SIGNS = [
  { sign: '7', kind: 0, note: 'read "seven" in English, "sept" in French and "sieben" in German' },
  { sign: '&', kind: 0, note: 'read "and" in English, "et" in French and "und" in German' },
  { sign: '%', kind: 0, note: 'read "per cent" in English, "pour cent" in French and "Prozent" in German' },
  { sign: '山', kind: 0, note: 'the Chinese character for "mountain", read "shān" in Mandarin and "yama" in Japanese' },
  { sign: '日', kind: 0, note: 'the Chinese character for "sun" or "day", read "rì" in Mandarin and "hi" in Japanese' },
  { sign: 'か', kind: 1, note: 'a sign of the Japanese kana script, always read "ka"' },
  { sign: 'ま', kind: 1, note: 'a sign of the Japanese kana script, always read "ma"' },
  { sign: 'の', kind: 1, note: 'a sign of the Japanese kana script, always read "no"' },
  { sign: 'm', kind: 2, note: 'the sign for the first sound of "map" and the last sound of "team"' },
  { sign: 'λ', kind: 2, note: 'the Greek lambda, which stands for the sound "l" wherever it appears' },
  { sign: 'ب', kind: 2, note: 'the Arabic letter bā’, which stands for the sound "b" wherever it appears' },
];
const KINDS = ['A whole word or idea', 'A syllable', 'A single sound'];
const KIND_WHY = [
  'A **logogram** stands for a whole word or idea, whatever the language. That is why people who speak different languages can read the same sign, each in their own words. Digits and Chinese characters work this way.',
  'A **syllabic** sign stands for a whole syllable, usually a consonant and a vowel together. Such a script needs fifty to a hundred signs.',
  'A **letter** stands for one sound. Because a language has only a few dozen sounds, an alphabet needs only a few dozen signs.',
];

// Three stages of the first letter of the alphabet, drawn with the same pen.
const LETTER_A =
  '<g class="stroke-ink fill-none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M38 44 L60 92 L82 44 Z"/><path d="M38 44 Q24 30 34 16"/><path d="M82 44 Q96 30 86 16"/>' +
  '<path d="M206 40 L160 64 L206 88"/><path d="M190 30 L190 98"/>' +
  '<path d="M278 96 L302 30 L326 96"/><path d="M287 72 L317 72"/></g>' +
  '<g class="stroke-orange fill-none" stroke-width="2.5" stroke-linecap="round"><path d="M104 62 L138 62"/><path d="M130 55 L138 62 L130 69"/><path d="M226 62 L260 62"/><path d="M252 55 L260 62 L252 69"/></g>' +
  '<text class="fig-label-sm" x="60" y="122" text-anchor="middle">ox head</text><text class="fig-label-sm text-muted" x="60" y="139" text-anchor="middle">Sinai, before 1500 BCE</text>' +
  '<text class="fig-label-sm" x="185" y="122" text-anchor="middle">Phoenician ’alep</text><text class="fig-label-sm text-muted" x="185" y="139" text-anchor="middle">about 1000 BCE</text>' +
  '<text class="fig-label-sm" x="302" y="122" text-anchor="middle">Greek alpha</text><text class="fig-label-sm text-muted" x="302" y="139" text-anchor="middle">about 750 BCE</text>';

// From counting to writing in three pictures: loose tokens, tokens sealed in a marked ball, marks alone on a tablet.
function tokens() {
  const clay = 'class="fill-orange-soft stroke-ink" stroke-width="2.5" stroke-linejoin="round"';
  const dent = (x, y, r = 4) => `<circle class="fill-none stroke-ink" stroke-width="2" cx="${x}" cy="${y}" r="${r}"/>`;
  const arrow = (x) => `<g class="stroke-orange fill-none" stroke-width="2.5" stroke-linecap="round"><path d="M${x} 58 L${x + 30} 58"/><path d="M${x + 22} 51 L${x + 30} 58 L${x + 22} 65"/></g>`;
  const label = (x, a, b) => `<text class="fig-label-sm" x="${x}" y="118" text-anchor="middle">${a}</text><text class="fig-label-sm text-muted" x="${x}" y="135" text-anchor="middle">${b}</text>`;
  return `<path ${clay} d="M30 76 L42 48 L54 76 Z"/><circle ${clay} cx="74" cy="50" r="11"/><rect ${clay} x="62" y="68" width="26" height="13" rx="6.5"/>`
    + arrow(104)
    + `<circle ${clay} cx="182" cy="58" r="36"/>` + dent(168, 46) + dent(184, 40) + dent(198, 52) + '<path class="stroke-ink fill-none" stroke-width="2" stroke-linecap="round" d="M166 68 L174 78 M178 66 L186 76"/>'
    + arrow(232)
    + `<rect ${clay} x="276" y="28" width="62" height="60" rx="9"/>` + dent(292, 44) + dent(306, 44) + dent(320, 44) + '<path class="stroke-ink fill-none" stroke-width="2" stroke-linecap="round" d="M290 62 L298 74 M304 62 L312 74"/>'
    + label(58, 'tokens', 'one each') + label(182, 'sealed in a ball', 'marked outside') + label(307, 'a flat tablet', 'the marks alone');
}

// A dot on the lesson's timeline, with its date and wording taken from the course table.
const dot = (id, label, color, short = label) => ({
  id, year: yearOf(id), label, short, color,
  note: `**${EVENTS[id].when.charAt(0).toUpperCase()}${EVENTS[id].when.slice(1)}.** ${EVENTS[id].text}.`,
});

const ORDER_POOL = ['cuneiform', 'enheduanna', 'sinai-alphabet', 'oracle-bones', 'greek-alphabet', 'maya-writing', 'rosetta-carved', 'last-hieroglyphs', 'champollion'];

export default {
  id: 'writing',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The first thing ever written',
      text: `
        The oldest writing we know comes from the city of Uruk in Mesopotamia,
        about 3300 BCE: thousands of small clay tablets.

        **What do you think most of them say?**
      `,
      options: [
        { text: 'Prayers to the gods' },
        { text: 'Stories about heroes and kings' },
        { text: 'Lists of grain, sheep and beer', correct: true },
        { text: 'Laws and punishments' },
      ],
      explain: `
        **Accounts.** About five in six of the earliest tablets are records of
        goods: grain received, sheep counted, beer handed out. The rest are word
        lists for training scribes. Stories, prayers and laws were written down
        only centuries later.

        Writing was invented by bookkeepers. The cities of the last lesson stored
        more than anyone could keep in their head.
      `,
    },
    {
      id: 'teach-tokens',
      type: 'info',
      title: 'Before writing: counting with clay',
      text: `
        Long before anyone wrote, people in Mesopotamia kept count with small
        clay **tokens**: one token for one sheep, or for one jar.

        Many scholars think writing grew out of them, a step at a time.

        1. Loose tokens: one for each thing counted.
        2. To keep a count safe, the tokens are sealed inside a clay ball.
           Marks pressed on the outside show what is inside.
        3. Then somebody sees that the marks are enough. They are pressed on
           a flat tablet, and the tokens are left out.

        Each step drops something that is no longer needed.
      `,
      figure: {
        type: 'svg', viewBox: '0 0 364 146', maxWidth: 520,
        alt: 'Three drawings in a row joined by arrows. First, three loose clay tokens of different shapes. Then a clay ball with marks pressed into its surface. Then a flat clay tablet carrying the same kinds of marks.',
        content: tokens(),
      },
    },
    {
      id: 'beer-tablet',
      type: 'interact',
      title: 'Read a 5,000-year-old receipt',
      text: `
        This tablet from Mesopotamia, about 3100 BCE, records beer given out to
        workers. The scribe scored the clay into boxes and drew signs with a reed.
        Amounts are not drawn at all: they are round and curved dents, pressed in
        with the end of the reed. The thing being counted is drawn beside them:
        a jar standing on its pointed base.

        **Tap the sign for beer.**
      `,
      widget: photo(MEDIA['beer-tablet'], {
        alt: 'A small clay tablet, rounded at the corners, divided into boxes by scored lines. The boxes hold signs drawn with straight strokes, among them a cross-hatched triangle standing on its point, next to round and crescent-shaped dents pressed deep into the clay.',
        creditLabel: 'Object',
        hotspots: [
          { id: 'dent', x: 0.67, y: 0.11, r: 0.05, label: 'A number', alt: 'a single deep round dent near the top edge' },
          { id: 'arcs', x: 0.555, y: 0.81, r: 0.055, label: 'A number', alt: 'a row of crescent-shaped dents near the bottom edge' },
          { id: 'jar', x: 0.6, y: 0.535, r: 0.055, label: 'Beer: a pointed jar', alt: 'a cross-hatched triangle standing on its point' },
        ],
      }),
      check: (s) => s.picked === 'jar' || (s.picked ? 'Those are dents pressed into the clay, not a drawing: that is a number. Look for a drawn jar, wide at the top and pointed at the bottom.' : false),
      solution: { picked: 'jar' },
      hints: ['The jar is drawn with straight strokes and filled with criss-cross lines.'],
      explain: `
        Dents for *how many*, a jar for *of what*. Elsewhere on the tablet a head
        beside a bowl means *rations*. There are no verbs and no grammar here,
        and no need of them: it is a receipt.

        Over the next centuries scribes began to press every sign with a cut
        reed, leaving wedge-shaped marks. We call the script **cuneiform**,
        "wedge-shaped". It was used for 3,000 years and for a dozen languages.
      `,
    },
    {
      id: 'tokens-order',
      type: 'order',
      title: 'From counting to writing',
      text: `
        Many scholars think writing grew, step by step, out of a much older way
        of counting with small clay tokens.

        **Put the steps in the order that makes sense.**
      `,
      items: [
        'A clay token stands for one sheep or one jar',
        'Tokens are sealed in a clay ball, marked outside',
        'The marks alone are pressed on a flat tablet',
        'Drawn signs show what is being counted',
        'Signs stand for sounds: now names can be spelled',
      ],
      labels: ['First', 'Last'],
      hints: ['Each step makes the one before it unnecessary. Once the marks are on the outside, who needs the tokens inside?'],
      explain: `
        First the tokens went, then the ball; then drawn signs joined the
        number marks, as on the beer tablet. The last step was the great one. Once a sign could stand for a
        **sound** as well as a thing, scribes could spell a person's name, and
        then anything that can be said.

        About 2300 BCE the priestess **Enheduanna** of Ur signed her hymns: she is
        the first author in history whose name we know.
      `,
    },
    {
      id: 'invented-where',
      type: 'interact',
      title: 'Invented more than once',
      text: `
        Writing appears in four early centres: Mesopotamia (about 3300 BCE), Egypt
        (about 3200 BCE), China (by 1250 BCE) and Mexico and Central America (by
        about 500 BCE). Egypt and Mesopotamia traded with each other, and China was
        linked to both by land, however loosely.

        **Tap the script that cannot have borrowed the idea from any of the others.**
      `,
      widget: {
        type: 'world-map', view: 'world', mode: 'pickMarker', answer: 'san-bartolo', zoom: false,
        markers: [
          { id: 'san-bartolo', at: at('san-bartolo'), label: 'Maya glyphs', labelPos: 'top' },
          { id: 'abydos', at: at('abydos'), label: 'Hieroglyphs', labelPos: 'left' },
          { id: 'uruk', at: at('uruk'), label: 'Cuneiform', labelPos: 'top' },
          { id: 'anyang', at: at('anyang'), label: 'Chinese', labelPos: 'top' },
        ],
        alt: 'A world map with four labelled markers: Maya glyphs in Central America, hieroglyphs in Egypt, cuneiform in Iraq and Chinese writing in northern China.',
      },
      check: (s) => s.picked === 'san-bartolo' || (s.picked === 'anyang' ? 'Chinese writing was almost certainly a separate invention, but a land route did link China to western Asia. One of the four was cut off by oceans.' : s.picked ? 'Egypt and Mesopotamia were in contact, so the idea may have passed between them; scholars disagree. One of the four was cut off by oceans.' : false),
      solution: { picked: 'san-bartolo' },
      explain: `
        The peoples of **Mexico and Central America** had no contact with Africa or Asia,
        yet they too invented writing; the Maya made it one of the most
        beautiful scripts ever devised. Chinese writing is almost certainly an
        independent invention as well.

        So writing is not one lucky accident. Where cities and states grew up,
        people found the same answer to the same problem.
      `,
    },
    {
      id: 'kinds',
      type: 'info',
      title: 'What can one sign stand for?',
      text: `
        | Kind of sign | Stands for | Signs needed |
        |---|---|---|
        | **Logogram** | a whole word | thousands |
        | **Syllable sign** | a syllable, such as *ka* | 50 to 100 |
        | **Letter** | a single sound | 20 to 40 |

        Most early scripts mixed the first two. These glyphs are Maya, from
        Palenque in Mexico. A scribe could write *balam*, "jaguar", as a jaguar's
        head (a logogram), or spell it out with three syllable signs, *ba-la-ma*,
        or combine both in one block.
      `,
      figure: photo(MEDIA['maya-glyphs'], {
        alt: 'Rows of square glyph blocks modelled in pale plaster on a wall. Each block packs together several rounded signs, and some of the signs are faces in profile.',
        caption: 'Maya glyphs modelled in plaster, Palenque, Mexico',
      }),
    },
    {
      id: 'kind-of-sign',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const s = rng.pick(SIGNS);
        return {
          text: `The sign **${s.sign}** is ${s.note}.\n\n**What does this one sign stand for?**`,
          shuffle: false,
          options: KINDS.map((text, k) => ({ text, correct: k === s.kind })),
          explain: KIND_WHY[s.kind],
        };
      },
    },
    {
      id: 'alphabet',
      type: 'info',
      title: 'The idea that needed only two dozen signs',
      text: `
        Some time between 1900 and 1500 BCE, people who spoke a Semitic language
        were working for Egypt, some of them in the turquoise mines of Sinai. They borrowed a
        few Egyptian pictures and gave each **one sound**: the first sound of its
        name in their own language.

        An ox was *’alp*, so the ox head stood for the first sound of that word.
        A house was *bet*, so the house sign stood for *b*.

        Phoenician sea traders spread this short, easy script. The Greeks turned
        ’alep into the vowel **alpha**, and the Romans passed it to us as **A**.
        Turn an A upside down: the horns are still there.
      `,
      figure: {
        type: 'svg', viewBox: '0 0 364 146', maxWidth: 520,
        alt: 'Three drawings in a row joined by arrows. First an ox head with two horns. Then the Phoenician letter alep: the same shape turned on its side and reduced to three strokes. Then the Greek letter alpha, which looks like our capital A.',
        content: LETTER_A,
      },
    },
    {
      id: 'letter-m',
      type: 'choice',
      text: `
        The same trick made the other letters. The Egyptian sign for **water** was
        a zigzag line, like ripples. In the workers' language water was ***mem***.

        **Which letter of our alphabet did the water sign become?**
      `,
      figure: {
        type: 'svg', viewBox: '0 0 240 70', maxWidth: 300,
        alt: 'A zigzag line with four peaks, like a row of small waves.',
        content: '<path class="stroke-blue fill-none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M24 46 L48 24 L72 46 L96 24 L120 46 L144 24 L168 46 L192 24 L216 46"/>',
      },
      options: [
        { text: 'M', correct: true },
        { text: 'W', why: 'The shape is tempting, but the rule is the *first sound* of the word, and "mem" does not begin with a w-sound. W is a medieval invention: a doubled U.' },
        { text: 'S', why: 'S comes from a different sign. The rule is the first sound of the word: *mem*.' },
        { text: 'Z', why: 'Z comes from a different sign. The rule is the first sound of the word: *mem*.' },
      ],
      explain: `
        *Mem* begins with **m**, and our M still looks like waves. In the same
        way an eye, *‘ayin*, became O, and a head, *resh*, became R.

        The word **alphabet** itself is just the first two letters, alpha and
        beta: the ox and the house.
      `,
    },
    {
      id: 'alphabet-route',
      type: 'interact',
      title: 'How the alphabet reached Rome',
      text: `
        From the mines of **Sinai** the letters passed to the **Phoenicians**,
        traders from the coast of what is now Lebanon. The **Greeks** learned them
        from Phoenician merchants about 800 BCE, and Greek settlers took them to
        **Italy**.

        **Tap the four places in that order.**
      `,
      widget: {
        type: 'world-map', view: [6, 25, 42, 46], mode: 'trace', zoom: false,
        answer: ['serabit', 'byblos', 'athens', 'rome'],
        markers: [
          mark('rome', { labelPos: 'top' }),
          mark('athens', { labelPos: 'top' }),
          mark('byblos', { labelPos: 'right' }),
          mark('serabit', { label: 'Sinai mines', labelPos: 'bottom' }),
        ],
        alt: 'The eastern Mediterranean with four markers: Rome in Italy, Athens in Greece, Byblos on the coast of Lebanon and the Sinai mines between Egypt and Arabia.',
      },
      check: (s) => {
        if (s.count < 4) return 'Visit all four places.';
        if (s.route[0] !== 'serabit') return 'Start in the mines of Sinai, the southernmost marker.';
        if (s.route[1] !== 'byblos') return 'From Sinai the letters went north along the coast to the Phoenician ports, such as Byblos.';
        return s.route.join() === 'serabit,byblos,athens,rome' || 'The Greeks had the alphabet before the Romans did.';
      },
      solution: { route: ['serabit', 'byblos', 'athens', 'rome'] },
      explain: `
        Sinai, Phoenicia, Greece, Italy: more than a thousand years from the first
        scratched signs to the Latin alphabet. Another branch ran east through
        the Aramaic script to **Hebrew** and **Arabic**, and probably on to the
        scripts of India, though scholars still argue about that last link.

        Almost every alphabet in use today descends from those workers' signs.
      `,
    },
    {
      id: 'rosetta',
      type: 'choice',
      title: 'A key in three scripts',
      text: `
        The last hieroglyphs were carved in 394 CE. After that nobody could read
        them for 1,400 years. Then in 1799 French soldiers in Egypt found this
        slab, cut in 196 BCE. Look at its three bands of writing: hieroglyphs at
        the top, an everyday Egyptian script in the middle, Greek at the bottom.
        Greek had never been forgotten.

        **Why did it unlock the hieroglyphs?**
      `,
      figure: photo(MEDIA['rosetta-stone'], {
        alt: 'A dark stone slab with a broken top, covered in fine carved writing arranged in three bands. Each band uses visibly different signs: small pictures at the top, flowing strokes in the middle, and neat letters at the bottom.',
        caption: 'The Rosetta Stone, 196 BCE, now in the British Museum',
      }),
      options: [
        { text: 'It gives the same text three times, and scholars could read the Greek', correct: true },
        { text: 'It is the oldest Egyptian text ever found', why: 'It is a late one. By 196 BCE hieroglyphs had been in use for 3,000 years.' },
        { text: 'It has a picture beside each hieroglyph to explain it', why: 'There are no pictures on it, only three bands of text.' },
      ],
      explain: `
        A decree of the priests for King Ptolemy V, published in three scripts so
        that everyone who mattered could read it. Knowing what the text said, the
        English scholar Thomas Young and the Frenchman **Jean-François Champollion** matched royal names to signs. In 1822 Champollion showed
        that hieroglyphs record the sounds of Egyptian, a language whose late
        form, Coptic, he had learned.

        Three thousand years of Egyptian voices could be heard again.
      `,
    },
    {
      id: 'oracle-bone',
      type: 'choice',
      title: 'Questions for the ancestors',
      text: `
        About 1250 BCE the Shang kings of China put questions to their ancestors:
        *Will the harvest be good? Will the queen's child be born safely?* A
        diviner heated an ox's shoulder blade or a turtle shell until it cracked,
        read the cracks, and had the question carved on the bone.

        Many of the signs can still be recognised today: 日 for sun, 月 for
        moon, 山 for mountain.

        **What sets this script apart from cuneiform and hieroglyphs?**
      `,
      figure: photo(MEDIA['oracle-bone'], {
        alt: 'A flat, pale piece of animal bone, cracked and pieced together, covered with columns of small angular characters. The cuts are filled with red colour.',
        caption: 'An inscribed ox shoulder blade, Shang dynasty, China',
        creditLabel: 'Object',
      }),
      options: [
        { text: 'It never died out: today\'s Chinese characters descend from it', correct: true },
        { text: 'It is the oldest writing in the world', why: 'Cuneiform is about 2,000 years older.' },
        { text: 'It was an alphabet', why: 'Each character stands for a word or part of a word, and there are thousands of them.' },
      ],
      explain: `
        The last known cuneiform tablet was written about 80 CE and the last
        hieroglyphs in 394 CE. Chinese writing has been in use without a break for
        more than 3,000 years.

        Because characters stand for words, not sounds, people who pronounce
        them quite differently can read the same text. That helped to hold China
        together.
      `,
    },
    {
      id: 'teach-beyond-accounts',
      type: 'info',
      title: 'From receipts to laws and poems',
      text: `
        Writing began as bookkeeping and became far more. Once signs could
        spell out speech, anything that was said could be kept.

        - **Law.** About 1754 BCE King Hammurabi of Babylon had 282 laws
          carved on a stone taller than a man, so that the rules were fixed
          and could be read out to anyone.
        - **Literature.** The *Epic of Gilgamesh*, from Mesopotamia, is among
          the oldest long poems that survive. Its hero is a king who fears
          death.

        The line shows this lesson's scripts in time. **Tap a dot or a bar**
        to read about it.
      `,
      figure: {
        type: 'timeline', from: -3500, to: 500, step: 500, mode: 'explore', showYears: true,
        events: [
          dot('enheduanna', 'Enheduanna', 'orange'),
          dot('hammurabi', 'Hammurabi\'s laws', 'orange', 'Hammurabi'),
          dot('sinai-alphabet', 'First alphabet', 'violet', 'Alphabet'),
          dot('greek-alphabet', 'Greek alphabet', 'violet', 'Greek'),
          dot('maya-writing', 'Maya glyphs', 'green', 'Maya'),
          dot('rosetta-carved', 'Rosetta Stone', 'blue', 'Rosetta'),
        ],
        spans: [
          { id: 'cuneiform', from: -3300, to: 80, label: 'Cuneiform', color: 'orange', row: 0, note: '**About 3300 BCE to about 80 CE.** Cuneiform, from the first accounts at Uruk to the last known tablet: used for 3,000 years and for a dozen languages.' },
          { id: 'hieroglyphs', from: -3200, to: 394, label: 'Egyptian hieroglyphs', color: 'blue', row: 1, note: '**About 3200 BCE to 394 CE.** Egyptian hieroglyphs. The last known ones were carved at Philae in 394 CE.' },
          { id: 'chinese', from: -1250, to: 500, label: 'Chinese characters', color: 'red', row: 2, note: '**From about 1250 BCE.** Chinese characters, first known from the oracle bones. The bar runs off the line because they have been in use ever since.' },
        ],
        alt: 'A timeline from 3500 BCE to 500 CE. Three bars: cuneiform from about 3300 BCE to about 80 CE, Egyptian hieroglyphs from about 3200 BCE to 394 CE, and Chinese characters from about 1250 BCE to the end of the line and beyond. Dots: Enheduanna about 2300 BCE, the laws of Hammurabi about 1754 BCE, the first alphabet about 1700 BCE, the Greek alphabet about 800 BCE, Maya glyphs about 300 BCE and the Rosetta Stone in 196 BCE.',
      },
    },
    {
      id: 'what-changed',
      type: 'match',
      review: true,
      text: '**Match each piece of early writing with what it is.**',
      pairs: [
        ['Tablets from Uruk, about 3300 BCE', 'Accounts of grain, sheep and beer'],
        ['Hammurabi\'s stone, Babylon, about 1754 BCE', 'Laws set up in public'],
        ['The Epic of Gilgamesh', 'A poem about a king who fears death'],
        ['Shang oracle bones', 'Questions put to royal ancestors'],
        ['The Rosetta Stone', 'One decree in three scripts'],
      ],
      explain: `
        Accounts at Uruk, public law on Hammurabi's stone, a long poem in
        *Gilgamesh*, questions to the ancestors on the Shang bones, a royal
        decree on the Rosetta Stone. Records, law, literature, history: each
        needs words that stay put.
      `,
    },
    {
      id: 'memory-vs-writing',
      type: 'multi',
      title: 'What writing was really for',
      text: `
        Peoples without writing were not peoples without knowledge. Trained
        memories carried long poems, sacred hymns and whole star maps, word
        for word, down many generations. So what did writing add?

        **Which of these jobs really needed writing, because memory alone could not do them reliably?** Choose all
        that apply.
      `,
      options: [
        { text: 'Fix an agreement so that it can be checked years later', correct: true },
        { text: 'Carry an exact message to someone far away', correct: true },
        { text: 'Keep track of thousands of debts and deliveries', correct: true },
        { text: 'Preserve long poems and sacred texts over centuries', why: 'Trained memories did this superbly. The hymns of the Vedas in India were passed on word-perfect for many centuries before anyone wrote them down.' },
        { text: 'Teach a difficult skill such as navigation', why: 'The Polynesian navigators of lesson 1 learned whole star maps by heart, with no writing at all.' },
      ],
      explain: `
        Writing is best at what memory is worst at: **exact detail, in bulk, across distance and time**. That is why states, traders and tax
        collectors took to it first.

        Poetry, law, religion and science were kept alive by word of mouth long
        before writing, and in many places long after. The Inca would later run a
        whole empire with knotted cords instead of script, as you will see in
        *Crossroads*.
      `,
    },
    {
      id: 'order-scripts',
      type: 'order',
      review: true,
      text: '**Put these in order**, from the earliest to the latest.',
      gen: (rng) => orderEvents(rng, ORDER_POOL, { n: 4, gap: 150, fallback: ['cuneiform', 'sinai-alphabet', 'greek-alphabet', 'champollion'] }),
    },
  ],
  recap: [
    'Writing began in Mesopotamia about 3300 BCE as **bookkeeping**: numbers and signs for goods, pressed into clay.',
    'It was invented **independently** more than once: certainly in Mexico and Central America, almost certainly in China. Chinese characters have been in use ever since.',
    'Scripts use signs for **words, syllables or single sounds**. The alphabet, begun by Semitic-speaking workers before 1500 BCE and spread by Phoenicians and Greeks, needs only two dozen signs.',
    'Writing fixed **laws, records and literature**. Oral tradition went on carrying knowledge alongside it.',
  ],
  next: 'Next: with roads, coins and writing, a single king could now rule from the Mediterranean to the Indus. Meet the Persians, and the Greek cities that defied them.',
};
