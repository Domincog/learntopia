// Psychology: How Minds Work · Lesson 2 · Seeing Is Guessing
//
// Driving question: do you see the world, or a guess about it?
// Sources for the facts are noted in ../helpers.js.
import { photo } from '../../../media.js';
import { MEDIA } from '../../../media/psychology/index.js';
import { GORILLA, DOOR, STROOP, CHERRY, FIGURES, ATTENTION_EFFECTS, ATTENTION_CASES, PEOPLE } from '../helpers.js';

// The Kanizsa figure: three discs with a wedge cut out of each, the wedges facing one another.
const pac = (cx, cy, from, to, r = 46) => {
  const p = (deg) => `${(cx + r * Math.cos((deg * Math.PI) / 180)).toFixed(1)} ${(cy + r * Math.sin((deg * Math.PI) / 180)).toFixed(1)}`;
  return `<path class="fill-ink" d="M${cx} ${cy}L${p(to)}A${r} ${r} 0 1 1 ${p(from)}Z"/>`;
};
const KANIZSA = {
  type: 'svg', viewBox: '0 0 300 260', maxWidth: 340,
  content: pac(150, 54, 60, 120) + pac(62, 206, -60, 0) + pac(238, 206, 180, 240),
  alt: 'Three black discs arranged at the corners of an invisible triangle. Each disc has a wedge missing, and the three wedges point at one another.',
};

// Bruner and Minturn's figure: the same marks between A and C, and between 12 and 14.
const MIDDLE = '<path class="fill-none stroke-ink" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" d="M132 100V160M146 101q24 0 24 14q0 14 -20 14q22 0 22 16q0 15 -26 15"/>';
const B13 = {
  type: 'svg', viewBox: '0 0 300 260', maxWidth: 340,
  content: MIDDLE
    + '<text class="fig-label-lg" style="font-size:54px" x="62" y="151" text-anchor="middle">A</text>'
    + '<text class="fig-label-lg" style="font-size:54px" x="240" y="151" text-anchor="middle">C</text>'
    + '<text class="fig-label-lg" style="font-size:54px" x="150" y="62" text-anchor="middle">12</text>'
    + '<text class="fig-label-lg" style="font-size:54px" x="150" y="238" text-anchor="middle">14</text>',
  alt: 'A cross of symbols. Reading across: the letter A, an ambiguous mark made of a vertical stroke and two bumps, the letter C. Reading down: the number 12, the same ambiguous mark, the number 14.',
};

// Sensation hands a signal up; perception answers with a best guess, helped by what you already know.
const FLOW = {
  type: 'svg', viewBox: '0 0 360 200', maxWidth: 420,
  content: `
    <rect class="fill-orange-soft stroke-ink" stroke-width="2.5" x="70" y="8" width="220" height="40" rx="10"/>
    <text class="fig-label" x="180" y="33" text-anchor="middle">what you know and expect</text>
    <rect class="fill-blue-soft stroke-ink" stroke-width="2.5" x="70" y="82" width="220" height="40" rx="10"/>
    <text class="fig-label" x="180" y="107" text-anchor="middle">perception: the best guess</text>
    <rect class="fill-surface stroke-ink" stroke-width="2.5" x="70" y="156" width="220" height="40" rx="10"/>
    <text class="fig-label" x="180" y="181" text-anchor="middle">sensation: nerve signals</text>
    <path class="fill-none stroke-ink" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M130 52V76M124 68L130 76L136 68"/>
    <text class="fig-label" x="142" y="69">top-down</text>
    <path class="fill-none stroke-ink" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M130 152V128M124 136L130 128L136 136"/>
    <text class="fig-label" x="142" y="145">bottom-up</text>`,
  alt: 'Three boxes in a column. At the bottom, "sensation: nerve signals", with an arrow labelled bottom-up pointing up to the middle box, "perception: the best guess". At the top, "what you know and expect", with an arrow labelled top-down pointing down to the middle box.',
};

const pctOff = (a, b) => Math.round((Math.abs(a - b) / b) * 1000) / 10;

export default {
  id: 'perception',
  steps: [
    {
      id: 'hook',
      type: 'interact',
      graded: false,
      title: 'Trust your eyes?',
      text: `
        A measurement to begin with, taken on you.

        **Move the slider until the [blue line]{.blue} looks exactly as long as the line above it.** Judge by eye, and take your time. When they look equal, press **Reveal**.
      `,
      widget: { type: 'illusion-match', kind: 'muller-lyer', alt: 'Two horizontal lines, one above the other. The upper line ends in arrowheads. The lower, blue line ends in fins that point outwards, and its length can be changed with a slider.' },
      check: (s) => s.revealed || (s.moved ? 'When the two lines look equal to you, press Reveal.' : 'Move the slider until the lines look equal, then press Reveal.'),
      solution: { value: 176, revealed: true },
      explain: `
        This is the **Müller-Lyer illusion** (${FIGURES.mullerLyer}). Outward fins make a line look longer and arrowheads make it look shorter, so most people leave the blue line clearly too short: often by a tenth to a quarter of its length.

        Whatever your number was, notice what you just did: you turned "it looks longer" into a **measurement**. That is how illusions are studied.
      `,
    },
    {
      id: 'still-there',
      type: 'choice',
      review: true,
      text: `
        Here the two lines are **exactly** the same length. The dashed guides prove it.

        People who have measured the lines for themselves are asked how the figure looks now. What do they report?
      `,
      figure: { type: 'illusion-match', kind: 'muller-lyer', static: true, guides: true, alt: 'Two horizontal lines of equal length, one with arrowheads and one with outward fins. Dashed vertical guides run through the ends of both.' },
      columns: 1,
      options: [
        { text: 'The lower line still looks longer, even though they know it is not', correct: true },
        { text: 'The lines now look equal, because they know the truth', why: 'It would be convenient, but knowledge does not reach down and correct the picture. Look at the figure: does it look equal to you?' },
        { text: 'The upper line now looks longer', why: 'The illusion does not reverse. It simply carries on as before.' },
      ],
      explain: `
        **Knowing does not make it go away.** The length you see is worked out by fast, automatic machinery that your beliefs cannot overrule.

        That is useful to remember: feeling certain about what you saw is not proof of what was there.
      `,
    },
    {
      id: 'teach-illusion',
      type: 'info',
      title: 'An illusion you can measure',
      text: `
        An **illusion** is a steady gap between what is there and what you see. It stays even when you know the truth, and it can be measured: adjust one line until the two **look** equal, then use a ruler.

        :::example
        The upper line is 200 units long. Someone leaves the [blue line]{.blue} at 170, as drawn here.

        - It is 200 − 170 = **30 units** short.
        - As a share of the true length: 30 ÷ 200 = **15%**.

        For this person the illusion is 15%.
        :::
      `,
      figure: { type: 'illusion-match', kind: 'muller-lyer', static: true, value: 170, guides: true, alt: 'Two horizontal lines, one with arrowheads and one, in blue, with outward fins. Dashed guides through the ends of the upper line show that the blue line stops short of them on both sides.' },
    },
    {
      id: 'illusion-size',
      type: 'numeric',
      review: true,
      title: 'Putting a number on it',
      gen: (rng) => {
        const who = rng.pick(PEOPLE);
        const truth = rng.pick([100, 150, 200, 250, 300, 400]);
        const off = rng.pick([8, 10, 12, 14, 16, 18, 20, 22, 24]);
        const setting = truth - (truth * off) / 100;
        const bySetting = pctOff(truth, setting);
        return {
          text: `
            In the Müller-Lyer figure, a line with outward fins looks longer than it is. ${who} adjusts such a line until it **looks** equal to a plain line of ${truth} mm. Measured with a ruler, ${who}'s line is ${setting} mm long.

            **How big is the illusion for ${who}, as a percentage of the true ${truth} mm?**

            (A setting 75 mm short of a true 500 mm would be 75 ÷ 500 = 15%.)
          `,
          answer: off,
          unit: '%',
          wrong: [
            ...(truth - setting !== off ? [[truth - setting, `That is the difference in millimetres. Turn it into a percentage of ${truth} mm.`]] : []),
            ...(Math.abs(bySetting - off) > 0.05 ? [[bySetting, `You divided by ${who}'s setting. Compare the difference with the true length, ${truth} mm.`]] : []),
          ],
          hints: [`How many millimetres short is the line? Then: what fraction of ${truth} is that?`],
          explain: `The line is ${truth} − ${setting} = ${truth - setting} mm short, and ${truth - setting} ÷ ${truth} = ${off}%. Measuring an illusion by adjustment turns "it looks longer" into a number that can be compared between people and between figures.`,
        };
      },
    },
    {
      id: 'contrast',
      type: 'interact',
      graded: false,
      title: 'The same grey?',
      text: `
        One more measurement. Each large square has a small patch in its centre.

        **Move the slider until the right-hand patch looks the same shade as the left-hand one.** Then press **Reveal**.
      `,
      widget: { type: 'illusion-match', kind: 'contrast', alt: 'Two large squares side by side, one nearly black and one nearly white, each with a small grey patch in the middle. The shade of the right-hand patch can be changed with a slider.' },
      check: (s) => s.revealed || (s.moved ? 'When the two patches look the same to you, press Reveal.' : 'Move the slider until the patches match, then press Reveal.'),
      solution: { value: 58, revealed: true },
      explain: `
        A grey patch looks lighter on a dark surround and darker on a light one, so most people set the right-hand patch lighter than the left. Side by side on one background, the difference shows.

        Your eye is not a light meter. The brain judges every patch **against its surroundings**, which is usually what you want: a white page still looks white in dim light.
      `,
    },
    {
      id: 'kanizsa',
      type: 'choice',
      title: 'What is on the page?',
      text: 'Look at the figure. **How many triangles are actually drawn in it?**',
      figure: KANIZSA,
      options: [
        { text: 'None', correct: true },
        { text: 'One', why: 'You see one, and so does nearly everyone. But no line of it is drawn: there are only three discs with wedges missing.' },
        { text: 'Two', why: 'There are no outlines at all on the page, only three discs with wedges cut out.' },
      ],
      explain: `
        Three notched discs are all that is there. The bright triangle, with edges that seem to cross empty paper, is **made by your brain** as the most likely explanation: "a white triangle is lying on top of three discs" (the Kanizsa triangle, ${FIGURES.kanizsa}).

        The triangle is your brain's best guess, and you see the guess.
      `,
    },
    {
      id: 'teach-perception',
      type: 'info',
      title: 'Two jobs that feel like one',
      text: `
        Psychologists separate two steps.

        - **Sensation**: eyes and ears turn light and sound into nerve signals.
        - **Perception**: the brain works out what in the world most likely caused those signals.

        Perception works in two directions. Building up from the signal is **bottom-up** processing. Using what you know and expect to interpret it is **top-down** processing.

        :::example
        Three notched discs reach your eyes: sensation. "A white triangle is lying on three discs": perception. Knowing what triangles and discs look like helped: top-down.
        :::
      `,
      figure: FLOW,
    },
    {
      id: 'name-it',
      type: 'fill',
      title: 'Two jobs',
      text: 'Three everyday cases. **Complete the sentences.**',
      template: `
        Light from a page lands on the back of your eye and becomes nerve signals: that is [[perception|*sensation|attention]].

        From a few grey smudges in the dusk, your brain concludes "a cat on the wall": that is [[sensation|memory|*perception]].

        You read a friend's untidy handwriting easily because you know what the sentence must say: that is [[bottom-up|*top-down|side-on]] processing.
      `,
      explain: `
        **Sensation** delivers the raw signal; **perception** interprets it. Building up from the signal is called bottom-up processing; using knowledge and expectation to interpret it is **top-down** processing.

        (How eyes and ears do the first job is in *The Body II*.)
      `,
    },
    {
      id: 'context',
      type: 'choice',
      text: 'Read the figure **across**, then read it **down**. What is the mark in the middle?',
      figure: B13,
      columns: 1,
      options: [
        { text: 'A "B" when read across and a "13" when read down, though the marks are the same', correct: true },
        { text: 'It is a B; reading it as 13 is a mistake', why: 'Between 12 and 14, "13" is every bit as good a reading. The ink does not settle it.' },
        { text: 'It is a 13; reading it as B is a mistake', why: 'Between A and C, "B" is every bit as good a reading. The ink does not settle it.' },
      ],
      explain: `
        The same marks become a letter among letters and a number among numbers. Your brain uses the **context** to decide, before you are aware of any choice. That is top-down processing at work, and it is why you can read bad handwriting, and why proof-reading your own writing is so hard.
      `,
    },
    {
      id: 'duck',
      type: 'choice',
      title: 'One drawing, two animals',
      text: `
        This drawing was printed in a German magazine in ${FIGURES.duckRabbit}. Most people can see a duck (looking left) and a rabbit (looking right).

        **When the picture "flips" for you, what has changed?**
      `,
      figure: photo(MEDIA['duck-rabbit'], {
        alt: 'An old engraving of an animal\'s head. Two long shapes on the left can be seen as a duck\'s bill or as a rabbit\'s ears.',
        caption: '"Rabbit and duck", *Fliegende Blätter*, 1892', creditLabel: 'Image', maxWidth: 420,
      }),
      columns: 1,
      options: [
        { text: 'Only your brain\'s interpretation: the ink is the same', correct: true },
        { text: 'Which part of the drawing your eyes receive', why: 'The same light reaches your eyes throughout. People can flip the picture while staring at one spot.' },
        { text: 'Nothing: you see both animals at once', why: 'Try it. Most people find that it is one or the other, never both together.' },
      ],
      explain: `
        Identical sensation, two perceptions. And you get one at a time: perception commits to a single answer and shows you that.

        What you expect matters too. In one study, visitors to a zoo at Easter were far more likely to see a rabbit first than visitors in the autumn.
      `,
    },
    {
      id: 'gorilla',
      type: 'slider',
      mode: 'predict',
      title: 'The gorilla',
      text: `
        In ${GORILLA.year} students watched a short film of six people passing basketballs and had to **count the passes** made by the players in white.

        Half-way through, a person in a gorilla suit walked into the middle of the game, faced the camera, thumped their chest and walked off: about nine seconds in full view.

        **What share of viewers did not notice the gorilla?**
      `,
      min: 0, max: 100, step: 1, answer: GORILLA.thumpMissed, tolerance: 12, start: 10, unit: '%',
      explain: `
        About **half**. (This chest-thumping version was shown to only ${GORILLA.thumpObservers} viewers; across all ${GORILLA.observers} viewers and every version of the film, ${GORILLA.missed}% missed the unexpected visitor.) Their eyes were pointing at it; in a later study with eye-tracking, people who missed the gorilla had looked straight at it for about a second.

        This is **inattentional blindness**. Attention is a narrow gate, and what does not get through it can go unseen. The other half did notice, and neither group was "better at looking": it depended on where attention happened to be. Stage magicians rely on it: they steer your attention, and the move happens in plain sight. It is also one reason an honest witness can miss what happened in front of them.
      `,
    },
    {
      id: 'change',
      type: 'interact',
      graded: false,
      title: 'Spot the change',
      text: `
        Two pictures of twelve objects will take turns, with a brief blank between them. **One object is different in the two pictures.** Press **Start**, then tap the object that changes.

        There is no time limit, and "Show me" is there if you would like the answer.
      `,
      widget: { type: 'change-spot', alt: 'Twelve coloured shapes in three rows of four. Two versions of the picture alternate with a blank in between; one shape differs between them.' },
      check: (s) => s.done || (s.started ? 'Tap the object that changes, or press "Show me".' : 'Press Start to begin.'),
      solution: { revealed: true },
      explain: `
        The change is large, yet finding it usually takes a slow search, object by object. Without the blank, the change makes a flash of motion that grabs attention by itself. The blank hides that flash, and you discover how little of a scene you were holding in mind: **change blindness**.
      `,
    },
    {
      id: 'stroop',
      type: 'interact',
      graded: false,
      title: 'Read this, if you can stop yourself',
      text: `
        A classic from ${STROOP.year}. You will name the **ink colour** of some words, in two short blocks, and the widget will time you.

        If telling red from green is hard for you, or you use a screen reader, choose the **number version**: it shows the same effect without colour. The clock only measures; nothing runs out.
      `,
      widget: { type: 'stroop-task', items: 8 },
      check: (s) => s.done || `Finish both blocks (${s.block} of 2 done).`,
      solution: { done: true, times: [6.2, 9.4] },
      explain: `
        Most people are slower, and make more slips, when the word and the answer clash. Reading is so practised that it runs **automatically**: you cannot switch it off, and the unwanted answer has to be held back each time.

        J. Ridley Stroop's volunteers took ${STROOP.plain} seconds to name the colours of ${STROOP.items} coloured squares and ${STROOP.clash} seconds for ${STROOP.items} clashing words: 74% longer. It has been repeated many hundreds of times.
      `,
    },
    {
      id: 'teach-attention',
      type: 'info',
      title: 'A narrow gate',
      text: `
        Perception works on what **attention** lets through, and attention is a narrow gate. The gorilla, the flickering picture and the colour words each showed one of its effects. A fourth comes from a noisy room, and was first studied in ${CHERRY.year}.

        ${Object.values(ATTENTION_EFFECTS).map((e) => `- **${e.name}**: ${e.what}.`).join('\n        ')}

        In ${DOOR.year} an experimenter asking passers-by for directions was swapped for a different person while a door was carried between them. Only ${DOOR.noticed} of ${DOOR.of} people noticed: change blindness in the street.
      `,
    },
    {
      id: 'which-effect',
      type: 'choice',
      review: true,
      columns: 1,
      gen: (rng) => {
        const c = rng.pick(ATTENTION_CASES);
        const e = ATTENTION_EFFECTS[c.effect];
        return {
          text: `
            ${c.text}

            **Which effect is this?**
          `,
          options: Object.keys(ATTENTION_EFFECTS).map((k) => ({
            text: ATTENTION_EFFECTS[k].name, correct: k === c.effect,
            why: k === c.effect ? undefined : `${ATTENTION_EFFECTS[k].name} is ${ATTENTION_EFFECTS[k].what}. That is not what happens here.`,
          })),
          explain: `**${e.name}**: ${e.what}.`,
        };
      },
    },
    {
      id: 'driving',
      type: 'multi',
      title: 'Hands free, mind busy',
      text: `
        In driving-simulator studies, drivers on **hands-free** calls miss signs and brake later, much like drivers holding the phone.

        A driver is deep in a hands-free conversation. **Which statements fit that evidence?**
      `,
      columns: 1,
      options: [
        { text: 'Their hands are free, but the conversation still takes attention away from the road', correct: true },
        { text: 'They are more likely to look at a hazard and fail to see it', correct: true },
        { text: 'Because both hands are on the wheel, the call is as safe as no call', why: 'Driving-simulator studies find that hands-free and hand-held calls slow reactions about equally. The cost is in attention, not in the hands.' },
        { text: 'A practised driver can attend fully to both at once', why: 'What feels like doing two things at once is rapid switching between them, and each switch has a cost. Practice makes driving more automatic; it does not widen attention.' },
      ],
      explain: `
        Attention is the bottleneck, and a conversation uses it, whatever the hands are doing. (A passenger is less of a problem: they can see the traffic and tend to fall silent when it gets tricky.)

        *How to Learn Anything* has a lesson on why "multitasking" is really switching.
      `,
    },
    {
      id: 'try',
      type: 'info',
      title: 'Something to notice',
      text: `
        You do not see the world. You see your brain's best guess about it, built from the signals that attention lets through. In a noisy room you can follow one voice among many for the same reason that a gorilla can walk past you unseen.

        One more guess to watch yourself make: this drawing from ${FIGURES.hill} holds a **young woman** turning away and an **old woman** in profile. The young woman's chin is the old woman's nose.

        :::tip Optional, this week
        The next time you hunt for something that turns out to be right in front of you, notice what happened: your eyes were working. Your attention was elsewhere.
        :::
      `,
      figure: photo(MEDIA['wife-mother'], {
        alt: 'A drawing of a woman in a fur coat with a feather in her dark hair. It can be seen as a young woman with her face turned away, or as an old woman with a large nose and chin, looking down to the left.',
        caption: '"My Wife and My Mother-in-Law", W. E. Hill, 1915', creditLabel: 'Drawing', maxWidth: 300,
      }),
    },
  ],
  recap: [
    'Sensation delivers signals; perception is the brain\'s best guess at what caused them.',
    'Illusions can be measured, and they persist even when you know the truth.',
    'Context and expectation shape what you see (top-down processing).',
    'Attention is a narrow gate: about half of viewers miss a gorilla in plain sight, and a phone call uses the same gate as the road.',
  ],
  next: 'Next: a bell, a lever and a slot machine. How habits are built, and why some refuse to die.',
};
