// Probability & Chance · Lesson 6 · The Base Rate Trap
import { r, frac } from '../../../kit.js';
import { fracText, rawFrac, pct, nearMiss } from '../helpers.js';

/**
 * Count 1000 people through a test. All three rates are given in percent and are chosen
 * so that every count is a whole number.
 */
function crowd([base, sens, fpr]) {
  const ill = (1000 * base) / 100;
  const healthy = 1000 - ill;
  const truePos = (ill * sens) / 100;
  const falsePos = (healthy * fpr) / 100;
  return { base, sens, fpr, ill, healthy, truePos, falsePos, positives: truePos + falsePos };
}

// [base rate %, sensitivity %, false-positive rate %]: every count out of 1000 is whole.
const RATES = [
  [2, 80, 10], [2, 90, 5], [4, 90, 10], [4, 75, 5], [5, 80, 10], [5, 90, 20], [10, 80, 10], [10, 90, 5], [8, 75, 5], [20, 90, 10],
];

export default {
  id: 'bayes',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A positive test',
      text: `
        An illness affects **1%** of people. There is a test for it:

        - If you are ill, the test is positive **90%** of the time.
        - If you are healthy, the test is still positive, wrongly, **9%** of the time.

        You take the test, and it comes back **positive**.
        **How likely is it that you really are ill?**
      `,
      min: 0, max: 100, step: 1, answer: 9, tolerance: 3, unit: '%', start: 50,
      explain: `
        About **9%**. Even with a positive result in your hand, you are far
        more likely to be healthy than ill.

        If you guessed something near 90%, you are in good company: when
        researchers have put questions like this one to doctors, most of
        them have answered 80% or 90% as well. The next step lets you *see*
        where the 9% comes from.
      `,
    },
    {
      id: 'see-it',
      type: 'interact',
      graded: false,
      title: 'Test a thousand people',
      text: `
        Do not think about one person. Think about **1000 people**, and press
        the buttons from left to right.

        Squares are ill, circles are healthy. A filled dot with a dark ring
        has tested positive.
      `,
      widget: { type: 'icon-array', base: 0.01, sens: 0.9, fpr: 0.09 },
      check: (s) => {
        if (s.stage === 3) return true;
        return s.stage === 0 ? 'Press "Who is ill?" to begin.' : 'Keep going: step through to "Positives only".';
      },
      solution: { stage: 3 },
      explain: r`
        **98** people test positive, but only **9** of them are ill. The other
        89 are healthy people with a false alarm.

        A positive result puts you somewhere among those 98. So your chance
        of being ill is $\frac{9}{98}$: about 9%.
      `,
    },
    {
      id: 'why-so-many',
      type: 'choice',
      text: `
        The test goes wrong for a healthy person only 9% of the time.
        **So why do the false alarms outnumber the real cases ten to one?**
      `,
      options: [
        { text: 'Because there are so many healthy people: 9% of 990 is far more than 90% of 10', correct: true },
        { text: 'Because the test misses most of the people who are ill', why: 'It catches 9 of the 10 ill people. Missed cases are not the problem here.' },
        { text: 'Because 9% is a much bigger number than 1%', why: 'Those are shares of different groups: 1% of *everyone* is ill, 9% of the *healthy* get a false alarm. Count people instead of comparing percentages.' },
        { text: 'Because the test is useless', why: 'It is not: a positive result has raised the chance of illness from 1% to about 9%, nine times as high. It just has not raised it to 90%.' },
      ],
      explain: `
        Healthy people outnumber ill people 99 to 1. A small share of a huge
        group (9% of 990 is about 89) easily beats a large share of a tiny
        group (90% of 10 is 9).

        Forgetting how rare the illness was to begin with is the trap this
        lesson is named after.
      `,
    },
    {
      id: 'recipe',
      type: 'info',
      title: 'Count people, not percentages',
      text: r`
        How common something is to begin with is called its **base rate**:
        here, 1% of people are ill. What you just did works for every
        problem of this kind:

        1. Imagine a crowd, say 1000 people.
        2. Split it by the base rate: 1% of 1000 is 10 ill, so 990 are healthy.
        3. Test each group: 90% of the 10 ill is 9 positives, and 9% of the 990 healthy is about 89.
        4. Compare: of the $9 + 89 = 98$ positives, 9 are ill.

        :::key
        $P(\text{ill} \mid \text{positive}) = \dfrac{\text{ill and positive}}{\text{all positive}} = \dfrac{9}{98}$
        :::
      `,
      figure: {
        type: 'icon-array', base: 0.01, sens: 0.9, fpr: 0.09, stage: 3, stages: false,
        alt: 'The 98 people out of 1000 who test positive: 9 squares for people who are ill and 89 circles for healthy people with a false alarm.',
        caption: 'The positives only: 9 ill, 89 healthy.',
      },
    },
    {
      id: 'do-it',
      type: 'fill',
      title: 'Your turn to count',
      gen: (rng) => {
        const c = crowd(rng.pick(RATES));
        return {
          text: `
            A different illness, a different test. **${c.base}%** of people have
            the illness. The test is positive for **${c.sens}%** of the people
            who are ill, and for **${c.fpr}%** of the people who are healthy.

            **Count your way through 1000 people.**
          `,
          template: `
            Of 1000 people, [[${c.ill}]] are ill and [[${c.healthy}]] are healthy.

            Of the ill people, [[${c.truePos}]] test positive.

            Of the healthy people, [[${c.falsePos}]] test positive.

            That makes [[${c.positives}]] positive tests in all.
          `,
          hints: [
            `${c.base}% of 1000 is ${c.ill}.`,
            `Take ${c.sens}% of the ${c.ill} ill people, and ${c.fpr}% of the ${c.healthy} healthy people.`,
          ],
          explain: r`
            ${c.truePos} of the ${c.positives} positives are ill:
            $${rawFrac(c.truePos, c.positives)} \approx ${pct(c.truePos / c.positives, 0)}\%$.
            The test catches ${c.sens}% of the ill, and yet a positive result means
            illness only about ${pct(c.truePos / c.positives, 0)}% of the time.
          `,
        };
      },
    },
    {
      id: 'compute',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const c = crowd(rng.pick(RATES));
        const story = rng.pick([
          {
            text: `A disease affects **${c.base}%** of the people who are screened for it. The test detects **${c.sens}%** of the cases, and it gives a false alarm to **${c.fpr}%** of the people who do not have the disease.\n\nSomeone tests positive. What is the probability that they have the disease?`,
            many: 'people', who: 'who', has: 'have the disease', not: 'do not', flagged: 'test positive', given: 'having the disease', result: 'a positive test',
          },
          {
            text: `**${c.base}%** of the emails arriving at an office are spam. The filter flags **${c.sens}%** of the spam, and it wrongly flags **${c.fpr}%** of the wanted emails.\n\nAn email has been flagged. What is the probability that it really is spam?`,
            many: 'emails', who: 'that', has: 'are spam', not: 'are not', flagged: 'are flagged', given: 'being spam', result: 'a flag',
          },
          {
            text: `**${c.base}%** of the parts coming off a production line are faulty. A scanner flags **${c.sens}%** of the faulty parts, and it wrongly flags **${c.fpr}%** of the good ones.\n\nA part has been flagged. What is the probability that it really is faulty?`,
            many: 'parts', who: 'that', has: 'are faulty', not: 'are not', flagged: 'are flagged', given: 'being faulty', result: 'a flag',
          },
        ]);
        const answer = c.truePos / c.positives;
        return {
          text: `${story.text} Give your answer as a fraction.`,
          answer: `${c.truePos}/${c.positives}`,
          display: fracText(c.truePos, c.positives),
          tolerance: 0.005,
          wrong: [
            [c.sens / 100, `${c.sens}% is the chance of ${story.result} *given* ${story.given}. The question asks for the reverse.`],
            [1 - c.fpr / 100, `${100 - c.fpr}% is how often the check correctly lets the others through. It does not tell you what ${story.result} means.`],
            [c.truePos / 1000, `That is the share of *all* 1000 ${story.many}. Compare only among those ${story.who} ${story.flagged}.`],
            [c.base / 100, `That was the chance before the result came in. The result is evidence: it has to move the chance.`],
          ],
          feedback: nearMiss(answer, 'Give the fraction, or round a little more finely.'),
          hints: [
            `Imagine 1000 ${story.many}. How many ${story.has}? How many of those ${story.flagged}?`,
            `${c.ill} ${story.has}, and ${c.truePos} of those ${story.flagged}. The other ${c.healthy} ${story.not}, and ${c.falsePos} of them ${story.flagged} anyway.`,
            `In all, ${c.truePos} + ${c.falsePos} ${story.flagged}. What share of those really ${story.has}?`,
          ],
          explain: r`
            Of 1000 ${story.many}, ${c.ill} ${story.has} and ${c.truePos} of those ${story.flagged}.
            Of the other ${c.healthy}, ${c.falsePos} ${story.flagged} too. So
            $${rawFrac(c.truePos, c.positives)}${fracText(c.truePos, c.positives) !== `${c.truePos}/${c.positives}` ? ` = ${frac(c.truePos, c.positives)}` : ''} \approx ${pct(answer, 0)}\%$
            of the ones ${story.who} ${story.flagged} really ${story.has}.
          `,
        };
      },
    },
    {
      id: 'base-rate',
      type: 'interact',
      title: 'Same test, different crowd',
      text: `
        Same test as before (90% and 9%), but now **you** decide how common
        the illness is. The picture shows the people who test positive.

        **Find a base rate at which a positive result means the person is
        more likely ill than healthy.**
      `,
      widget: {
        type: 'icon-array', base: 0.01, sens: 0.9, fpr: 0.09, stage: 3, stages: false,
        sliders: ['base'], labels: { base: 'people who are ill' },
      },
      check: (s) => s.ppv > 0.5
        || `At this base rate, ${s.truePos} of the ${s.positives} positives are ill: only ${pct(s.ppv, 0)}%. Make the illness more common.`,
      solution: { base: 0.1 },
      hints: ['Drag the slider to the right, and watch the red squares catch up with the blue circles.'],
      explain: `
        Once about 1 person in 10 is ill, the real cases among the positives
        outnumber the false alarms. At 1 in 100, they were swamped.
      `,
    },
    {
      id: 'teach-base-rate',
      type: 'info',
      title: 'Same result, different meaning',
      text: `
        The test never changed. What a positive result *means* did:

        | People who are ill | Positives who are ill |
        |:---:|:---:|
        | 1 in 100 | 9 of 98: about 9% |
        | 1 in 10 | 90 of 171: about 53% |

        This is why the very same test can be weak evidence when *everyone*
        is screened, yet strong evidence for a patient who already has
        symptoms: among people with symptoms, the base rate is far higher.

        :::key
        Evidence does not replace what you knew before. It **moves** the
        chance on from where it stood, and the new chance is the starting
        point for the next piece of evidence.
        :::
      `,
      figure: {
        type: 'icon-array', base: 0.1, sens: 0.9, fpr: 0.09, stage: 3, stages: false,
        alt: 'With 1 person in 10 ill, 171 of 1000 people test positive: 90 squares for people who are ill and 81 circles for healthy people with a false alarm.',
        caption: 'Base rate 1 in 10. The positives: 90 ill, 81 healthy.',
      },
    },
    {
      id: 'second-test',
      type: 'choice',
      stretch: true,
      title: 'Test again',
      text: `
        Back to the first illness, with its base rate of 1%. Your first test
        was positive, so your chance of being ill is about 9%.

        You take the test **a second time**, and it is positive again. Treat
        the two results as independent. Your new crowd is the 98 people who
        tested positive once: 9 ill and 89 healthy. Test them all again.

        **Roughly how likely is it now that you are ill?**
      `,
      shuffle: false,
      options: [
        { text: 'About 9%: a second test adds nothing', why: 'A second positive result is new evidence, and it does count.' },
        { text: 'About 18%', why: 'Evidence does not simply add up. Run the count again, starting from the people who tested positive once.' },
        { text: 'About 50%', correct: true },
        { text: 'About 99%', why: 'Much closer than after one test, but a false alarm can happen twice.' },
      ],
      hints: [
        'Your starting point is no longer 1%. After one positive result it is about 9%: that is your new base rate.',
        'The test is positive for 90% of the 9 ill people and for 9% of the 89 healthy people. Roughly how many is each?',
      ],
      explain: `
        Start with the 98 people who tested positive once: 9 ill, 89 healthy.
        Test them again. About 90% of the 9 ill people are positive: **8**.
        About 9% of the 89 healthy people are positive too: **8**.

        So of roughly 16 people with two positive results, about 8 are ill:
        **around 50%**. Each piece of evidence moves the chance on from
        where the last one left it. That is why a positive screening result
        leads to more tests rather than to a verdict. (In real life a second
        test of the same kind may repeat the same mistake, so a different
        kind of test is preferred.)
      `,
    },
    {
      id: 'scanner',
      type: 'choice',
      review: true,
      text: `
        An airport scanner flags **99%** of the bags that contain something
        dangerous. It also wrongly flags **2%** of harmless bags. Dangerous
        bags are extremely rare: about **1 in 100,000**.

        The scanner flags a bag. **What is most likely true?**
      `,
      options: [
        { text: 'The bag is harmless: false alarms vastly outnumber real finds', correct: true },
        { text: 'The bag is dangerous, with a probability of about 99%', why: '99% is the chance that a dangerous bag gets flagged. The question is the reverse: how many flagged bags are dangerous?' },
        { text: 'The bag is dangerous, with a probability of about 98%', why: 'A 2% false-alarm rate does not make a flag 98% reliable. Nearly all flagged bags come from the huge harmless group.' },
        { text: 'It is about fifty-fifty', why: 'Count: among 100,000 bags there is about 1 dangerous bag, and about 2,000 harmless ones that get flagged.' },
      ],
      explain: `
        Picture 100,000 bags. About **1** is dangerous, and it is almost
        certainly flagged. Of the 99,999 harmless bags, 2% are flagged as
        well: about **2,000**. So only about one flagged bag in 2,000 is
        dangerous.

        The flag is still useful: it tells the staff which 2% of the bags to open.
      `,
    },
    {
      id: 'teach-names',
      type: 'info',
      title: 'Three numbers in, one out',
      text: r`
        Every problem in this lesson handed you three numbers. Each has a name:

        - **Base rate**: how common the illness is. In the first example, 1%.
        - **Sensitivity**: how often the test is positive for someone who is ill. There, 90%.
        - **False-positive rate**: how often the test is positive for someone who is healthy. There, 9%.

        In the "given" notation of the last lesson, the sensitivity is
        $P(\text{positive} \mid \text{ill})$. It describes the test, *given*
        your health. What you want to know runs the other way round: your
        health, *given* the test. To get from one to the other you need the
        base rate.
      `,
    },
    {
      id: 'terms',
      type: 'match',
      review: true,
      text: 'Match each phrase with the probability it stands for.',
      pairs: [
        ['Base rate', r`$P(\text{ill})$`],
        ['Sensitivity', r`$P(\text{positive} \mid \text{ill})$`],
        ['False-positive rate', r`$P(\text{positive} \mid \text{healthy})$`],
        ['What the patient wants to know', r`$P(\text{ill} \mid \text{positive})$`],
      ],
      explain: `
        A test is described by how it behaves *given* your health: its
        sensitivity and its false-positive rate. You want to know your
        health *given* the test. Getting from one to the other takes the
        base rate.

        Updating a belief with evidence in this way is called **Bayes' rule**,
        after Thomas Bayes, an English minister of the 1700s.
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        A friend is frightened: a screening test that is "90% accurate" has
        come back positive.

        **Which two questions should your friend ask, and why?**
      `,
      model: `
        First: **how common is the condition among people like me?** That is
        the base rate. Second: **how often is the test positive for people
        who do not have the condition?**

        If the condition is rare, even a good test produces more false alarms
        than real cases. A positive screening result then means "take a
        follow-up test", not "you have it".
      `,
    },
  ],
  recap: [
    'A test tells you P(positive | ill). You want P(ill | positive). These can be far apart.',
    'When a condition is rare, false alarms from the many healthy people can swamp the real cases.',
    'To get it right, **count people**: imagine 1000, split them by the base rate, test each group, compare.',
    'The higher the base rate, the more a positive result means.',
  ],
  next: 'Next: is a bet worth taking? A single number, the expected value, helps you decide.',
};
