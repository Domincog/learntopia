// How to Learn Anything · Lesson 4 · Know What You Know
import { r } from '../../../kit.js';

export default {
  id: 'know-what-you-know',
  steps: [
    {
      id: 'quiz',
      type: 'interact',
      graded: false,
      title: 'How sure are you?',
      text: `
        A quick experiment. Eight statements, each true or false.

        For each one, give your answer **and say how sure you are**. Be honest: the confidence
        is the interesting part.
      `,
      widget: {
        type: 'calibration',
        alt: 'A confidence quiz of eight true-or-false statements.',
        items: [
          { text: 'A day on Venus is longer than a year on Venus.', answer: true, why: 'Venus takes about 243 Earth days to spin once, but only about 225 to orbit the Sun.' },
          { text: 'Humans use only about 10% of their brains.', answer: false, why: 'Brain scans show activity throughout the brain. The 10% figure is a myth.' },
          { text: 'An octopus has three hearts.', answer: true, why: 'Two pump blood through the gills and one pumps it around the body.' },
          { text: 'Lightning never strikes the same place twice.', answer: false, why: 'Tall buildings are struck many times a year.' },
          { text: 'Botanically speaking, a banana is a berry.', answer: true, why: 'To a botanist, bananas are berries — and strawberries are not.' },
          { text: 'The Great Wall of China is easy to see from the Moon with the naked eye.', answer: false, why: 'From the Moon no individual human structure can be seen with the naked eye.' },
          { text: 'Sound travels faster through water than through air.', answer: true, why: 'Roughly 1,480 metres per second in water, against about 340 in air.' },
          { text: 'Goldfish have a memory of only a few seconds.', answer: false, why: 'Goldfish can be trained and remember what they learned for months.' },
        ],
      },
      check: (s) => s.done || 'Answer all eight statements to see your results.',
      solution: { done: true },
      explain: `
        Look at the bars for the answers you were **almost certain** about. Were you right
        on nearly all of them? Keep your result in mind: the next screen says what it means.
      `,
    },
    {
      id: 'calibration',
      type: 'info',
      title: 'Calibration',
      text: `
        Someone is **well calibrated** when their confidence matches their results:
        of the things they feel 90% sure about, about 90% turn out right.

        When confidence runs ahead of results, that is **overconfidence**: the most common
        pattern in human judgement. If your "almost certain" answers were often wrong, you
        have just met it.

        Why should a learner care? Because your sense of "I know this" decides what you
        study next. If that sense is off, you will skip the things you most need to practise.
      `,
    },
    {
      id: 'zipper-before',
      type: 'choice',
      mode: 'predict',
      title: 'A second experiment',
      text: 'You have used zips thousands of times. **How well do you understand how a zip works?**',
      shuffle: false,
      options: [
        { text: 'Well — I could explain it step by step' },
        { text: 'Roughly — I get the general idea' },
        { text: 'Not really' },
      ],
    },
    {
      id: 'zipper-explain',
      type: 'reflect',
      text: `
        Then explain it. **Exactly what does the slider do to the two rows of teeth**
        to lock them together — and to pull them apart again?
      `,
      placeholder: 'Describe the mechanism step by step…',
      model: `
        Each tooth has a small bump on top and a matching hollow underneath. The slider is a
        Y-shaped channel: the two rows enter the wide end at an angle, and the narrowing channel
        presses each tooth into the gap between two teeth on the other side, so every bump sits
        in the hollow of the tooth above it. Once straight, the teeth cannot separate. Unzipping
        runs a wedge inside the slider between the rows, tilting the teeth apart one at a time.
      `,
    },
    {
      id: 'zipper-after',
      type: 'choice',
      mode: 'predict',
      text: 'Now that you have tried to explain it: **how well do you understand how a zip works?**',
      shuffle: false,
      options: [
        { text: 'Well — I could explain it step by step' },
        { text: 'Roughly — I get the general idea' },
        { text: 'Not really' },
      ],
      explain: `
        Most people rate themselves **lower** the second time. Nothing about the zip changed.
        What changed is that you tested yourself.
      `,
    },
    {
      id: 'teach-depth',
      type: 'info',
      title: 'Familiar is not the same as understood',
      text: `
        Familiar things feel understood until we try to explain them. Psychologists call this
        the **illusion of explanatory depth** (Rozenblit & Keil, 2002).

        It points to a rule. **Recognising** something on the page is easy, and it produces the
        feeling of knowing. **Producing** it yourself, with the page out of sight, is the only
        real test.

        | Only a feeling | Real evidence |
        |---|---|
        | "I have seen this before" | You recall it with your notes closed |
        | "This makes sense as I read it" | You explain it, or use it on a new problem |

        Trying to explain is a test you can run on yourself at any time.
      `,
    },
    {
      id: 'best-test',
      type: 'choice',
      review: true,
      text: 'You have just finished studying a topic. Which is the most trustworthy sign that you really know it?',
      options: [
        { text: 'You can explain it, or solve a new problem, without looking at your notes', correct: true },
        { text: 'Your notes make complete sense when you read them back', why: 'Recognising an explanation is much easier than producing it. That is the trap.' },
        { text: 'You followed every step when the teacher worked through it', why: 'Following someone else’s reasoning is not the same as being able to do it yourself.' },
        { text: 'You spent a long time on it', why: 'Time spent says nothing about what stuck.' },
      ],
      explain: 'Only **producing** the knowledge yourself — recalling, explaining, solving — tells you it is really there.',
    },
    {
      id: 'evidence',
      type: 'bucket',
      review: true,
      text: 'Which of these are real evidence that you know something, and which only feel like it?',
      buckets: ['Real evidence', 'Just a feeling'],
      items: [
        { text: 'You solved a new problem with your notes closed', bucket: 0 },
        { text: 'You explained it to a friend and answered their questions', bucket: 0 },
        { text: 'You still remembered it a week later', bucket: 0 },
        { text: 'The page looks familiar', bucket: 1, why: 'Familiarity comes from seeing something before, not from being able to use it.' },
        { text: 'You have read it three times', bucket: 1 },
        { text: 'The worked example made sense', bucket: 1, why: 'Understanding a solution is easier than finding one.' },
        { text: 'You highlighted the important parts', bucket: 1 },
      ],
      explain: 'Evidence means you **did** something with the knowledge while it was out of sight.',
    },
    {
      id: 'teach-percent',
      type: 'info',
      title: 'Put a number on it',
      text: r`
        You can measure your own calibration. Take the answers you gave at one confidence
        level and work out what share of them were right.

        :::example
        You marked 40 answers "fairly sure", and 24 of them were right.

        $24 \div 40 = 0.6$, which is **60%**.

        "Fairly sure" should mean right about 75 times in 100. You scored 60, so your
        confidence ran ahead of your results: **overconfident**.
        :::

        A score close to the confidence you stated means you are well calibrated.
      `,
      figure: {
        type: 'bars', yMax: 100, yStep: 25, unit: '%', yLabel: 'answers correct',
        data: [
          { label: '"Fairly sure"\nshould mean', value: 75, color: 'gray' },
          { label: 'What you\nscored', value: 60, color: 'orange' },
        ],
        alt: 'Two bars. What fairly sure should mean: 75 percent correct. What you scored: 60 percent correct.',
      },
    },
    {
      id: 'percent',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const total = rng.pick([10, 20, 25]);
        const right = Math.round(total * rng.pick([0.6, 0.64, 0.7, 0.72, 0.8]));
        const pct = Math.round((right / total) * 100);
        return {
          text: `
            Looking back over a week of reviews, you marked **${total}** answers as "almost certain".
            **${right}** of them were right.

            What percentage of your "almost certain" answers were correct?
          `,
          answer: pct,
          unit: '%',
          wrong: [[100 - pct, 'That is the percentage you got *wrong*.']],
          hints: [`Divide the number right by the total, then multiply by 100.`],
          explain: r`$${right} \div ${total} = ${right / total}$, which is ${pct}%. "Almost certain" should mean right about 95 times in 100, so this learner was **overconfident** — and now knows to double-check the things they feel sure about.`,
        };
      },
    },
    {
      id: 'teach-sweet-spot',
      type: 'info',
      title: 'The sweet spot',
      text: `
        Your results also tell you whether your practice is pitched at the right level.

        Learning happens at the edge of what you can do. Researchers who study this find the
        sweet spot is succeeding **most of the time, but not always**: roughly 85% in some
        models of learning.

        | Your results | What they suggest |
        |---|---|
        | Nearly everything wrong | Too hard: take a smaller step |
        | Most right, some wrong | About right |
        | Everything right, with no effort | Too easy to teach you much |

        Some struggle is not a warning sign. It is the target.
      `,
    },
    {
      id: 'sweet-spot',
      type: 'choice',
      text: 'You finish a practice set and get **every single question right, easily**. What is the most likely explanation?',
      options: [
        { text: 'The set was too easy to teach you much', correct: true },
        { text: 'You have completely mastered the topic', why: 'Possibly. But easy success is also what a too-easy set looks like. Harder questions would tell you which.' },
        { text: 'You got lucky', why: 'Luck on every question is unlikely.' },
      ],
      explain: `
        A perfect, effortless score sits above the sweet spot. It feels good and builds little.
        Harder questions will show you where the edge of your knowledge really is.
      `,
    },
    {
      id: 'in-lemma',
      type: 'info',
      title: 'How Learntopia helps with this',
      text: `
        - In **reviews**, you can say how sure you are before checking your answer.
        - Your **Progress** page shows how often you were right at each confidence level.
        - Hints are always available, and nothing is ever lost by getting a question wrong.
          A wrong answer simply brings the idea back sooner.

        :::key
        The goal is not to feel confident. The goal is for your confidence to be **right**.
        :::
      `,
    },
    {
      id: 'habits',
      type: 'multi',
      review: true,
      text: 'Four lessons in, the memory half of the course is complete. **Which habits has it recommended so far?**',
      options: [
        { text: 'Spread reviews out, with gaps that grow', correct: true },
        { text: 'Test yourself instead of re-reading', correct: true },
        { text: 'Mix different topics and problem types', correct: true },
        { text: 'Check your confidence against your actual results', correct: true },
        { text: 'Keep re-reading until the material feels familiar', why: 'Familiarity is the feeling this whole course warns you not to trust.' },
        { text: 'Do all your studying in one long session', why: 'One long session is cramming: it works for tomorrow and fades within days.' },
      ],
      explain: 'Space it, retrieve it, mix it, and check yourself. Four habits, decades of evidence.',
    },
    {
      id: 'plan',
      type: 'reflect',
      text: `
        People are far more likely to follow through on a plan that names a **time and place**.

        Finish this sentence: *"On most days, right after ______, I will do one lesson and my reviews."*
      `,
      placeholder: 'Right after…',
      minChars: 6,
      model: `
        There is no single right answer: *"right after breakfast"*, *"on the bus home"*, *"after I brush
        my teeth at night"*. What matters is tying it to something you already do every day. A small
        habit you keep beats a big plan you do not.
      `,
    },
  ],
  recap: [
    'Feeling sure and being right are different. Calibration is how well they match.',
    'Familiar things feel understood until you try to explain them.',
    'Real evidence of knowing: you can recall it, explain it or use it with the source out of sight.',
    'Aim for practice where you succeed most of the time, but not always.',
  ],
  next: 'Next: remembering is half of learning. The other half is understanding.',
};
