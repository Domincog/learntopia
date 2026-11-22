// Staying Well: Prevention and Everyday Medicine · Lesson 6 · Catching Things Early
//
// Driving question: why can a positive screening test be wrong most of the time, and what follows from that?
// The whole lesson is `tone: 'sober'`: it is about cancer. Sources for the facts are noted in ../helpers.js.
import { r, num } from '../../../kit.js';
import { CANCER, SCREEN_EXAMPLE, MARMOT, SCREEN_RATES, screenCounts, PROGRAMMES, thousands } from '../helpers.js';

const WORDS = {
  people: 'people screened', has: 'affected', not: 'unaffected', posVerb: 'test positive',
  tp: 'cancer, positive test', fn: 'cancer, negative test', fp: 'no cancer, positive test', tn: 'no cancer, negative test',
  stages: ['Everyone', 'Who has cancer?', 'Screen everyone', 'Positives only'],
};
const CROWD = { type: 'icon-array', ...SCREEN_EXAMPLE, words: WORDS };

// The worked example before the counting question: rates that are NOT in SCREEN_RATES, so the question that follows is never this one.
const EXAMPLE_RATES = [30, 90, 90];
const EX = screenCounts(EXAMPLE_RATES);
const EXAMPLE_CROWD = {
  type: 'icon-array', base: EX.ill / 1000, sens: EX.sens / 100, fpr: (100 - EX.spec) / 100, stage: 3,
  words: {
    people: 'people screened', has: 'affected', not: 'unaffected', posVerb: 'test positive',
    tp: 'disease, positive test', fn: 'disease, negative test', fp: 'no disease, positive test', tn: 'no disease, negative test',
    stages: ['Everyone', 'Who has the disease?', 'Screen everyone', 'Positives only'],
  },
  alt: `One thousand dots stand for 1,000 people screened, of whom ${EX.ill} have the disease. The picture opens on the positive results alone: ${EX.truePos} people who have the disease and ${EX.falsePos} who do not. Buttons step back through everyone, who has the disease, and everyone's test result.`,
};

const DISEASES = ['a bowel cancer', 'an eye disease', 'a heart rhythm problem', 'a hidden infection', 'a kidney disease', 'a cancer of the cervix'];

/** Two lifelines: the same cancer found late by symptoms and early by screening, with the same age at death. */
function leadTime(from, found, screened, death) {
  const x = (age) => 30 + ((age - from) / (death + 2 - from)) * 300;
  const line = (y, name, dx, color) =>
    `<text class="fig-label-sm" x="30" y="${y - 14}">${name}</text>`
    + `<line class="stroke-hair" stroke-width="6" stroke-linecap="round" x1="${x(from)}" x2="${x(death)}" y1="${y}" y2="${y}"/>`
    + `<line class="stroke-${color}" stroke-width="6" stroke-linecap="round" x1="${x(dx)}" x2="${x(death)}" y1="${y}" y2="${y}"/>`
    + `<circle class="fill-${color} stroke-ink" stroke-width="2.5" cx="${x(dx)}" cy="${y}" r="7"/>`
    + `<text class="fig-label-sm" x="${x(dx)}" y="${y + 24}" text-anchor="middle">found at ${dx}</text>`
    + `<rect class="fill-ink" x="${x(death) - 3}" y="${y - 10}" width="6" height="20" rx="2"/>`;
  return {
    type: 'svg', viewBox: '0 0 360 150', maxWidth: 520,
    alt: `Two lifelines side by side. Both end at age ${death}. On the first, the cancer is found at ${found}; on the second it is found earlier, at ${screened}. The stretch from finding to death is longer on the second line, although both lines end at the same age.`,
    content: line(40, 'Ana: found by symptoms', found, 'orange') + line(108, 'Bea: found by screening', screened, 'blue')
      + `<text class="fig-label-sm" x="${x(death)}" y="14" text-anchor="middle">both die at ${death}</text>`,
  };
}

export default {
  id: 'screening',
  tone: 'sober',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A letter in the post',
      text: `
        A screening programme for breast cancer invites women who feel perfectly well. Suppose that:

        - of every 1,000 women screened, **8** have a cancer;
        - the test finds **7 of those 8**;
        - it also comes back positive for **1 in 10** of the women who have no cancer.

        One woman's result is positive. **How likely is it that she has cancer?**
      `,
      min: 0, max: 100, step: 1, answer: 7, tolerance: 3, start: 50, unit: '%',
      explain: `
        About **7%**. Roughly 93 of every 100 women with a positive result do **not** have cancer.

        That is not a fault in this one test. It is what happens whenever people without symptoms are tested for something uncommon, and it changes what a positive result means. First, though: what is being looked for?
      `,
    },
    {
      id: 'teach-cancer',
      type: 'info',
      title: 'Cells that ignore the signals',
      text: `
        Your body makes billions of new cells every day, each one by copying billions of letters of DNA. A few copying mistakes always slip through, and they add up over a lifetime.

        Almost all of those mistakes do nothing. A **cancer** begins when one cell has collected several particular ones: enough to keep dividing when it should stop, to ignore the signals and checks that would halt it, and in time to spread to other organs.

        Cancer is not an infection, and it cannot be caught from another person. The word covers more than 200 different diseases, depending on which cell and which mistakes.
      `,
    },
    {
      id: 'what-cancer',
      type: 'choice',
      title: 'Which mistakes matter',
      text: `
        Mistakes in copying DNA add up in every cell over a lifetime.

        **What kind of mistakes turn a cell into the start of a cancer?**
      `,
      columns: 1,
      options: [
        { text: 'Ones that let it keep dividing when it should stop, and slip past the body\'s checks', correct: true },
        { text: 'Ones that make the cell die too early', why: 'Cells that die are simply replaced. The danger is the opposite: a cell that will not stop.' },
        { text: 'Ones that let germs get into the cell', why: 'Cancer is not an infection and cannot be caught from another person. A few infections, such as HPV, do raise the risk by damaging cells.' },
        { text: 'Any mistake at all: every one is dangerous', why: 'Almost all copying mistakes do nothing. It takes several particular ones, in the same cell, to remove its brakes.' },
      ],
      explain: `
        A cancer begins with **one cell** that will not stop: a cell that dies is simply replaced, and a cell with a harmless mistake carries on as before.

        Mistakes build up with every division, which is why age is the biggest risk factor, and why chance plays a large part.
      `,
    },
    {
      id: 'teach-prevention',
      type: 'info',
      title: 'What adds mistakes',
      text: `
        Age and chance account for many of the mistakes. Some things add more on top, and for each of them something is known to lower the risk.

        | Adds to the risk | What lowers it |
        |---|---|
        | Tobacco: ${CANCER.tobaccoShare} of all cancer deaths | Not smoking |
        | HPV, a virus: almost all cervical cancer | The HPV vaccine |
        | Long-lasting hepatitis B: liver cancer | The hepatitis B vaccine |
        | Alcohol: several cancers, more with more | Drinking less |
        | Ultraviolet light: skin cancer | Protecting skin from strong sun |

        No "detox" product and no vitamin pill has been shown to prevent cancer.
      `,
    },
    {
      id: 'lower-risk',
      type: 'bucket',
      title: 'Shifting the odds',
      text: 'Nobody can bring their risk of cancer to zero. Some things do lower it. **Which of these have good evidence behind them?**',
      buckets: ['Good evidence', 'No good evidence'],
      items: [
        { text: 'Not smoking', bucket: 0, why: `Tobacco causes ${CANCER.tobaccoShare} of all cancer deaths: more than any other single cause.` },
        { text: 'The HPV vaccine', bucket: 0, why: `HPV causes almost all cervical cancer. In Sweden, women vaccinated before 17 had about ${CANCER.hpvReduction}% fewer cases.` },
        { text: 'The hepatitis B vaccine', bucket: 0, why: 'Long-lasting hepatitis B infection is a leading cause of liver cancer.' },
        { text: 'Drinking less alcohol', bucket: 0, why: 'Alcohol raises the risk of several cancers, and the risk rises with the amount.' },
        { text: 'Protecting skin from strong sun', bucket: 0, why: 'Ultraviolet light is the main cause of skin cancer.' },
        { text: 'A "detox" juice diet', bucket: 1, why: 'The liver and kidneys clear waste products without help. No "detox" product has been shown to prevent cancer.' },
        { text: 'High-dose vitamin pills', bucket: 1, why: 'Trials of vitamin supplements have not shown fewer cancers, and in smokers high doses of beta-carotene led to more lung cancer.' },
      ],
      explain: `
        The World Health Organization estimates that between a third and a half of cancers could be prevented, tobacco first of all. Being physically active lowers the risk of several cancers too, and a higher body weight is linked to a higher risk of some.

        The rest is age and chance. Many people who do everything "right" get cancer, and it is never a verdict on how someone lived.
      `,
    },
    {
      id: 'count-it',
      type: 'interact',
      graded: false,
      title: 'Screen a thousand people',
      text: `
        **Screening** means testing people who have no symptoms, to find a disease early, when treatment works best.

        Here are the 1,000 women from the first question. **Press the buttons from left to right** and count who ends up with a positive result. Squares have cancer; circles do not.
      `,
      widget: { ...CROWD, alt: 'One thousand dots stand for 1,000 women being screened. Buttons reveal who has cancer, who tests positive, and then the positive results alone.' },
      check: (s) => s.stage === 3 || (s.stage === 0 ? 'Press "Who has cancer?" to begin.' : 'Keep going, to "Positives only".'),
      solution: { stage: 3 },
      explain: r`
        **106** women have a positive test. **7** of them have cancer, and **99** do not: $\frac{7}{106} \approx 7\%$.

        The test is wrong about only 1 in 10 of the women without cancer. But there are 992 of them, and 10% of 992 is far more than 7. A positive screening test therefore means "more tests are needed", and for most people those tests bring good news.
      `,
    },
    {
      id: 'teach-terms',
      type: 'info',
      title: 'The vocabulary of tests',
      text: `
        Five terms describe how any medical test behaves. Here they are, with the numbers you just counted.

        - **Sensitivity**: of the people who have the disease, the share the test catches. Here, 7 of 8.
        - **Specificity**: of the people who do not have it, the share the test correctly clears. Here, 893 of 992, or 90%.
        - **False positive**: a positive result for someone who does not have the disease. Here, 99 women.
        - **False negative**: a negative result for someone who has it. Here, 1 woman.
        - **Predictive value of a positive result**: of the people who test positive, the share who have the disease. Here, 7 of 106.
      `,
      figure: { ...CROWD, stage: 2, stages: false, alt: 'One thousand dots stand for 1,000 women after screening. Of the 8 who have cancer, 7 tested positive and 1 tested negative. Of the 992 who do not, 99 tested positive and 893 tested negative.' },
    },
    {
      id: 'terms',
      type: 'match',
      review: true,
      title: 'The vocabulary of tests',
      text: 'Five terms describe how any medical test behaves. **Match each with its meaning.**',
      pairs: [
        ['Sensitivity', 'Of the people who have the disease, the share the test catches'],
        ['Specificity', 'Of the people who do not have it, the share the test correctly clears'],
        ['False positive', 'A positive result for someone who does not have the disease'],
        ['False negative', 'A negative result for someone who has it'],
        ['Predictive value of a positive result', 'Of the people who test positive, the share who have the disease'],
      ],
      explain: `
        **Sensitivity** and **specificity** describe the test. What a person with a result in their hand wants is the last one, the **predictive value**.

        It depends on a third number that has nothing to do with the test: how common the disease is among the people tested.
      `,
    },
    {
      id: 'example-count',
      type: 'info',
      title: 'Counting through a thousand',
      text: `
        Given how common a disease is, and a test's sensitivity and specificity, you can count out what a positive result means. Always start from 1,000 people.

        :::example Worked example: ${EX.ill} in every 1,000 have the disease; sensitivity ${EX.sens}%, specificity ${EX.spec}%
        1. **${EX.ill}** have the disease. The test catches ${EX.sens}% of them: **${EX.truePos}**.
        2. **${EX.well}** do not have it. A specificity of ${EX.spec}% clears ${EX.spec}% of them, so ${100 - EX.spec}% are wrongly flagged: **${EX.falsePos}**.
        3. Positive results: ${EX.truePos} + ${EX.falsePos} = **${EX.positives}**. Of those, **${EX.truePos}** are right: about ${num(EX.ppv * 100, 0)}%.
        :::

        The picture shows the ${EX.positives} positive results. Step back through the buttons to see where they came from.
      `,
      figure: EXAMPLE_CROWD,
    },
    {
      id: 'ppv-count',
      type: 'fill',
      review: true,
      title: 'Your turn to count',
      gen: (rng) => {
        const c = screenCounts(rng.pick(SCREEN_RATES));
        const what = rng.pick(DISEASES);
        return {
          text: `
            Imagine a screening test for ${what}, offered to people with no symptoms. Suppose that among them **${c.ill} in every 1,000** have the disease. The test has a sensitivity of **${c.sens}%** and a specificity of **${c.spec}%**.

            **Count your way through 1,000 people.**
          `,
          template: `
            [[${c.ill}]] have the disease, and the test catches [[${c.truePos}]] of them.

            [[${c.well}]] do not have it, and the test wrongly flags [[${c.falsePos}]] of them.

            So of [[${c.positives}]] positive results, [[${c.truePos}]] are right.
          `,
          hints: [
            `Sensitivity ${c.sens}%: take ${c.sens}% of the ${c.ill} people who have the disease.`,
            `Specificity ${c.spec}% means ${100 - c.spec}% of the ${c.well} people without the disease are flagged by mistake.`,
          ],
          explain: r`
            ${c.sens}% of ${c.ill} is ${c.truePos}, and ${100 - c.spec}% of ${c.well} is ${c.falsePos}. That makes ${c.positives} positive results, of which ${c.truePos} are right: $\frac{${c.truePos}}{${c.positives}} \approx ${num(c.ppv * 100, 0)}\%$.${c.missed ? ` The test also misses ${c.missed} of the people who have the disease: a negative result is reassuring, never a guarantee.` : ''}
          `,
        };
      },
    },
    {
      id: 'base-rate',
      type: 'interact',
      title: 'Same test, different people',
      text: `
        The same test is also used in hospital clinics, for people who have found a lump. Among them, cancer is far more common than 8 in 1,000.

        **Move the slider until a positive result is more likely to be right than wrong.**
      `,
      widget: {
        ...CROWD, stage: 3, stages: false, sliders: ['base'], ranges: { base: [0.008, 0.3, 0.002] }, labels: { base: 'have cancer' },
        alt: 'The people with a positive test, out of 1,000 tested. A slider sets how many of the 1,000 have cancer.',
      },
      check: (s) => s.ppv > 0.5 || `With ${num(s.base * 100, 1)}% affected, ${s.truePos} of the ${s.positives} positive results are right: ${num(s.ppv * 100, 0)}%. Make the disease more common.`,
      solution: { base: 0.12 },
      hints: ['Drag to the right and watch the squares catch up with the circles.'],
      explain: `
        Once a little over 1 person in 10 of those tested has the disease, most positive results are right. Nothing about the test has changed.

        This is why the same test can be a strong clue for someone with symptoms and a weak one in screening. It is also one reason why healthy people are not screened for everything: for a rare disease, even a good test produces mostly false alarms.
      `,
    },
    {
      id: 'better-test',
      type: 'interact',
      attempts: 6,
      title: 'Build a better test',
      text: `
        Back to screening, with 8 in 1,000 affected. Engineers can improve the test in two ways: catch more of the cancers (sensitivity), or flag fewer healthy people (specificity).

        **Try both sliders. Get the share of positive results that are right up to at least 25%.**
      `,
      widget: {
        ...CROWD, stage: 3, stages: false, sliders: ['sens', 'fpr'], ranges: { sens: [0.5, 1, 0.125], fpr: [0, 0.2, 0.01] },
        labels: { sens: 'cancers caught (sensitivity)', fpr: 'healthy people flagged (100% − specificity)' },
        alt: 'The people with a positive test, out of 1,000 screened. Two sliders set the sensitivity of the test and the share of healthy people it flags.',
      },
      check: (s) => {
        if (s.ppv >= 0.25) return true;
        if (s.fpr >= SCREEN_EXAMPLE.fpr) return `${s.truePos} of ${s.positives} positive results are right: ${num(s.ppv * 100, 0)}%. Catching every cancer adds one person at most. Try the other slider.`;
        return `${s.truePos} of ${s.positives} positive results are right: ${num(s.ppv * 100, 0)}%. Flag fewer healthy people still.`;
      },
      solution: { sens: 0.875, fpr: 0.02 },
      hints: ['Which group is bigger: the 8 who have cancer, or the 992 who do not? A change of one percentage point means more people in the bigger group.'],
      explain: `
        Raising the sensitivity to 100% adds one true positive and changes almost nothing. Cutting the false alarms from 10% of healthy people to 2% takes the positives from 106 down to about 27, of whom 7 are real.

        When a disease is uncommon, **specificity** is what counts. Programmes get it by following a positive screening test with a second, different test before anything is decided.
      `,
    },
    {
      id: 'lead-time',
      type: 'numeric',
      title: 'Living longer, or knowing longer?',
      gen: (rng) => {
        const found = rng.pick([62, 65, 67, 70]);
        const after = rng.pick([2, 3, 4]);
        const earlier = rng.pick([2, 3, 4, 5]);
        const death = found + after;
        const screened = found - earlier;
        return {
          text: `
            Ana and Bea have exactly the same cancer, starting at the same age. Ana's is found when symptoms appear, at **${found}**. Bea's is found by screening at **${screened}**. In this case earlier treatment makes no difference, and both die at **${death}**.

            Doctors record "years survived after diagnosis". **What is that figure for Bea?**
          `,
          figure: leadTime(screened - 3, found, screened, death),
          answer: death - screened,
          unit: 'years',
          wrong: [
            [after, 'That is Ana\'s figure. Bea\'s cancer was found earlier.'],
            [earlier, 'That is how much earlier Bea\'s cancer was found. Count from when it was found to her death.'],
            [0, 'She gained no extra life, true. But the question asks what is recorded: the years from diagnosis to death.'],
          ].filter(([v], i, all) => v !== death - screened && all.findIndex(([w]) => w === v) === i),
          hints: [`Bea's cancer is found at ${screened}, and she dies at ${death}.`],
          explain: `
            Bea "survives" **${death - screened} years** after diagnosis, and Ana only ${after}. Yet both died at ${death}: screening gave Bea ${earlier} more years of *knowing*, and not one more day of life.

            This is **lead-time bias**. It is why longer survival after diagnosis does not show that a screening programme works. The fair test is a trial that compares how many people **die** of the disease among those invited to screening and those not invited. Bowel and breast screening have passed that test in large trials, and deaths from cervical cancer have fallen wherever screening for it was introduced.
          `,
        };
      },
    },
    {
      id: 'harms',
      type: 'choice',
      review: true,
      title: 'The other side of the ledger',
      text: `
        Screening also finds some cancers that grow so slowly they would never have caused any trouble in the person's lifetime. Nobody can tell which ones they are, so all are treated.

        One careful estimate for breast screening: of ${thousands(MARMOT.invited)} women invited for 20 years, about **${MARMOT.deathsPrevented}** are saved from dying of breast cancer, and about **${MARMOT.overdiagnosed}** are treated for a cancer that would never have harmed them.

        **What is the fairest summary?**
      `,
      columns: 1,
      options: [
        { text: 'Screening saves lives and also causes some harm, so people deserve the numbers to decide for themselves', correct: true },
        { text: 'Screening does more harm than good and should be stopped', why: 'Forty-three lives saved is a large benefit. Whether it outweighs the harm is a judgement about values, and the expert panel that made this estimate judged that it does.' },
        { text: 'There is no real downside: finding any cancer early is always good', why: 'Surgery, radiotherapy and years of worry are real harms when the cancer would never have caused trouble. This is called **overdiagnosis**.' },
        { text: 'The estimate shows that the test is inaccurate', why: 'Overdiagnosis is not a mistake by the test. The cancers are real; they are simply of a kind that would not have gone on to cause harm.' },
      ],
      explain: `
        Both numbers are real, and both are uncertain (the panel called them best estimates). Finding harmless disease, **overdiagnosis**, is the hardest cost of screening to see, because everyone treated believes that they were saved.

        So invitations to breast screening increasingly come with numbers like these, and the choice is the person's own: taking part and declining are both reasonable, and a doctor or nurse can talk it through. Cervical and bowel screening can also find changes *before* they turn into cancer, and there the balance leans more clearly towards taking part.
      `,
    },
    {
      id: 'programmes',
      type: 'info',
      title: 'What is screened for, and why not more',
      text: `
        Three cancer screening programmes are offered in many countries. Ages and intervals differ:

        | | England | United States |
        |---|---|---|
        ${PROGRAMMES.map((p) => `| **${p.cancer}** | ${p.england} | ${p.us} |`).join('\n        ')}

        A disease earns a programme only if it is serious, can be found before symptoms, is easier to treat when found early, and has a test good enough that the benefit outweighs the false alarms and the overdiagnosis. Few diseases pass, which is why "a full-body scan, just in case" is not recommended for healthy people.
      `,
      figure: {
        type: 'body-map', view: 'torso', show: ['large-intestine', 'rectum', 'uterus'], ghost: ['large-intestine'], zoom: false,
        groups: [
          { ids: ['large-intestine', 'rectum'], color: 'orange', label: 'Bowel' },
          { ids: ['uterus'], color: 'violet', label: 'Womb: the cervix is its lower end' },
        ],
        markers: [{ at: [236, 258], label: 'Breast', color: 'pink', shape: 'ring', size: 'l' }],
        alt: 'The trunk of a figure with three places marked: a ring on the chest for the breast, the large intestine and rectum highlighted as the bowel, and the womb low in the pelvis, whose lower end is the cervix.',
      },
    },
    {
      id: 'symptoms',
      type: 'multi',
      review: true,
      title: 'Screening is not for symptoms',
      text: `
        Screening is for people who feel well. A symptom is different: it should be checked now, not left for the next screening invitation. What marks a symptom out is that it has no obvious cause, or that it does not go away.

        **Which of these are worth showing to a doctor without waiting?** Choose all that apply.
      `,
      columns: 1,
      options: [
        { text: 'A new lump that does not go away', correct: true },
        { text: 'Bleeding with no obvious cause', correct: true },
        { text: 'Losing weight without trying', correct: true },
        { text: 'A cough, a hoarse voice or a change in bowel habit that lasts more than three weeks', correct: true },
        { text: 'A cold that clears up within a week', why: 'An illness that comes and goes in a few days is the body dealing with an infection.' },
        { text: 'Aching legs for two days after a long walk', why: 'Soreness that has an obvious cause and fades in a few days is normal.' },
      ],
      explain: `
        A lump, unexplained bleeding, unexplained weight loss, or any change that **persists**: each is a reason to be seen. Most of the time the cause is not cancer, and being checked is how you find that out.

        A recent normal screening test is no reason to ignore a symptom. Tests miss some cancers, and new ones can appear between screens.
      `,
    },
    {
      id: 'try-it',
      type: 'info',
      title: 'Something to try this week',
      text: `
        If you are curious, look up which screening programmes exist where you live, and at what ages. Your national health service or health ministry will have a page.

        And a question worth keeping for any test offered to you when you feel well:

        > Out of 1,000 people like me who take this test, how many are helped, how many get a false alarm, and how many are treated for something that would never have harmed them?

        A good programme can answer it.
      `,
      cta: 'Finish',
    },
  ],
  recap: [
    'Cancer starts when one cell collects enough DNA mistakes to divide without stopping. Tobacco, alcohol, strong sun and some infections add mistakes; age and chance do the rest.',
    'Screening tests people with no symptoms. Because few of them have the disease, most positive results are false alarms: a positive screen means "more tests", not "cancer".',
    'A test has a **sensitivity** and a **specificity**. What a positive result means also depends on how common the disease is among the people tested.',
    'Screening saves lives and has costs: false alarms and overdiagnosis. Symptoms such as a lump, unexplained bleeding or a change that persists should be checked without waiting.',
  ],
  next: 'Next: tobacco, alcohol and other drugs. What they do in the body, and what stopping gives back.',
};
