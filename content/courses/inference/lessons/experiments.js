// Statistical Inference · Lesson 5 · Which Version Wins?
import { r, num, round } from '../../../kit.js';
import { thousands, signedText, STUDENTS } from '../helpers.js';

/** 40 students (20 keen, 20 not) and a revision app whose true effect is zero. */
const school = (extra) => ({
  type: 'assign-lab', units: STUDENTS, effect: 0,
  labels: { treat: 'app', control: 'no app', trait: 'keen', outcome: 'exam score', unit: 'points', people: 'students' },
  ...extra,
});

/** A/B tests: n people per version, percentages for A and B, and the standard error of the difference (points, one decimal). */
const AB_TESTS = [
  { n: 1000, a: 10, b: 13, se: 1.4 },
  { n: 2500, a: 20, b: 24, se: 1.2 },
  { n: 1600, a: 25, b: 30, se: 1.6 },
  { n: 5000, a: 8, b: 10, se: 0.6 },
  { n: 900, a: 30, b: 36, se: 2.2 },
  { n: 500, a: 20, b: 23, se: 2.6 },
  { n: 800, a: 15, b: 17, se: 1.8 },
  { n: 400, a: 40, b: 45, se: 3.5 },
];
const AB_THINGS = [
  { thing: 'a sign-up page', did: 'signed up' },
  { thing: 'a checkout page', did: 'completed a purchase' },
  { thing: 'an email subject line', did: 'opened the email' },
  { thing: 'a welcome screen for an app', did: 'finished setting up' },
];

const DESIGNS = [
  {
    claim: 'drinking green tea prevents colds',
    watch: (n) => `Study A followed ${n} adults for five years. Those who chose to drink green tea every day had fewer colds than those who did not.`,
    assign: (n) => `Study B took ${n} volunteers and decided by coin toss who would drink green tea every day and who a look-alike drink. After a year it compared colds.`,
    chose: 'People who choose to drink green tea every day', other: 'diet, exercise, income',
  },
  {
    claim: 'a meditation app lowers stress',
    watch: (n) => `Study A surveyed ${n} people. Those who used the app reported less stress than those who did not.`,
    assign: (n) => `Study B took ${n} volunteers and gave the app to half of them, chosen at random. Two months later it compared stress levels.`,
    chose: 'People who choose to download a meditation app', other: 'free time, health, how stressed they were to begin with',
  },
  {
    claim: 'a standing desk reduces back pain',
    watch: (n) => `Study A looked at ${n} office workers. Those who had asked for a standing desk reported less back pain.`,
    assign: (n) => `Study B took ${n} office workers and gave standing desks to half of them, chosen by lottery. Six months later it compared back pain.`,
    chose: 'Workers who ask for a standing desk', other: 'age, fitness, how much they move during the day',
  },
  {
    claim: 'extra music lessons improve maths marks',
    watch: (n) => `Study A looked at ${n} pupils. Those whose families paid for music lessons had better maths marks.`,
    assign: (n) => `Study B took ${n} pupils and gave free music lessons to half of them, chosen at random. A year later it compared maths marks.`,
    chose: 'Children whose families pay for music lessons', other: 'family income, parents\' education, support at home',
  },
];

export default {
  id: 'experiments',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'The app that adds nine points',
      text: `
        A company sells a revision app. It points to a school where students were free to use the app or not. The 20 who used it scored **9 points higher** in the exam, on average, than the 20 who did not.

        "Our app adds 9 points to your score," says the advert. **How much of that gap is the app's doing?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: 'All 9 points' },
        { text: 'About half of it' },
        { text: 'None of it' },
        { text: 'It cannot be told from this comparison', correct: true },
      ],
      explain: `
        It cannot be told: not "all", and not "none" either. The students *chose* whether to use the app, so the two groups may have been different long before the exam.

        In the next step you can watch that happen.
      `,
    },
    {
      id: 'self-select',
      type: 'interact',
      graded: false,
      title: 'Let them choose',
      text: `
        Here are 40 students, placed at the exam score each would get **with no app at all**. In this simulation the app is known to do **nothing**: its true effect is 0.

        **Press "Let them choose" at least 5 times** and watch the gap between the groups. Then press **"Show who is keen"**.
      `,
      widget: school({ methods: ['choice'], repeat: 0, reveal: 'toggle', alt: 'Forty students as dots on an exam-score axis. A button lets them choose between the app and no app; the two groups and their averages are shown, and the differences pile up underneath.' }),
      check: (s) => {
        if (s.runs.choice < 5) return `${s.runs.choice} so far. Press "Let them choose" at least 5 times.`;
        return s.revealed || 'Now press "Show who is keen".';
      },
      solution: { runs: { choice: 5 }, revealed: true },
      explain: `
        The app group comes out ahead almost every time, typically by around 9 points, although the app does nothing.

        The reveal shows why. **Keen** students (squares) would have scored well anyway, and they are the ones who mostly choose the app. The two groups were different before anyone opened it.
      `,
    },
    {
      id: 'take-apart',
      type: 'fill',
      title: 'Take the gap apart',
      text: `
        Here is the school from the advert, with the students split by how keen they were the year before.

        | | Used the app | Did not |
        |---|---|---|
        | **Keen students** | 16 students, average 72 | 4 students, average 72 |
        | **Other students** | 4 students, average 57 | 16 students, average 57 |
      `,
      template: r`
        Average of all 20 app users: $(16 \times 72 + 4 \times 57) \div 20 =$ [[69]].

        Average of all 20 non-users: $(4 \times 72 + 16 \times 57) \div 20 =$ [[60]].

        Gap between users and non-users: [[9]] points.

        Gap between users and non-users *within* either row of the table: [[0]] points.
      `,
      hints: [r`$16 \times 72 = 1152$ and $4 \times 57 = 228$.`, 'For the last line, stay inside one row of the table and compare its two averages.'],
      explain: r`
        $(1152 + 228) \div 20 = 69$ and $(288 + 912) \div 20 = 60$: a gap of 9. But compare like with like and it vanishes: keen students score 72 with or without the app, and the others 57.

        The 9 points come entirely from the **mix**. The app group is 80% keen; the other group is 20% keen.
      `,
    },
    {
      id: 'confounding',
      type: 'info',
      title: 'Confounding',
      text: `
        Keenness is a **confounder** here: something that affects both *who gets the treatment* and *the outcome*. You met it in [Do They Move Together?](#/learn/statistics/correlation) as the "third factor".

        When people pick their own treatment it is called **self-selection**, and it is everywhere:

        - people who take vitamins also tend to exercise and eat well;
        - customers who switch on a new feature are already the most active ones;
        - patients who ask for a new operation may be the fittest, or the most desperate.

        A study that only *watches* what people choose is an **observational study**. You can adjust for the confounders you have measured, as you just did for keenness. You can never be sure you have thought of them all.
      `,
    },
    {
      id: 'coin',
      type: 'interact',
      title: 'Let a coin decide',
      text: `
        Same students, same useless app. Now there are two ways to form the groups.

        **Use each method at least 200 times**: press its button once, then "Repeat 200×". Compare the two piles of differences.
      `,
      widget: school({ methods: ['choice', 'coin'], repeat: 200, alt: 'The forty students again, with two buttons: let them choose, or toss a coin for each. Under the picture, the differences between the groups pile up in one strip per method, with a dashed line at the true effect, zero.' }),
      check: (s) => {
        if (s.runs.choice < 200) return `"They choose" has been used ${s.runs.choice} ${s.runs.choice === 1 ? 'time' : 'times'}. Press "Let them choose", then "Repeat 200×".`;
        if (s.runs.coin < 200) return `"Coin toss" has been used ${s.runs.coin} ${s.runs.coin === 1 ? 'time' : 'times'}. Press "Toss a coin for each", then "Repeat 200×".`;
        return true;
      },
      solution: { runs: { choice: 201, coin: 201 } },
      explain: `
        When students choose, the differences pile up around **+9**: wrong every time, and always in the same direction. When a coin decides, they pile up around **0**, the true effect.

        A single coin-toss split can still be off by a few points. That is ordinary sampling variation, and a hypothesis test knows how to deal with it. But nothing *pushes* it one way. The bias is gone; only chance is left.
      `,
    },
    {
      id: 'teach-random',
      type: 'info',
      title: 'Random assignment',
      text: `
        Letting chance form the groups is called **random assignment**.

        :::key
        Random assignment balances **everything** at once: keenness, sleep, family background, and things nobody has thought of. Not perfectly in any one experiment, but without favouring either group.
        :::

        So if the groups differ afterwards by more than chance can explain, the treatment is the only explanation left.

        An experiment built this way is a **randomised controlled trial**. Its **control group** goes without the treatment and shows what would have happened anyway: without one, patients who would have got better on their own look like successes.
      `,
      figure: school({
        methods: ['coin'], repeat: 0, reveal: 'shown',
        caption: 'Toss the coin a few times. The keen students (squares) land in both groups, about evenly.',
        alt: 'The forty students as dots on an exam-score axis, keen students drawn as squares. A button tosses a coin for each student and shows the two groups and their averages.',
      }),
    },
    {
      id: 'why-random',
      type: 'choice',
      review: true,
      text: `
        A coin knows nothing about which students are keen. **So why does tossing it produce groups that are alike in keenness, on average?**
      `,
      columns: 1,
      options: [
        { text: 'Nothing about a student can influence the coin, so every trait is shared out evenly on average, including traits nobody measured', correct: true },
        { text: 'The coin puts exactly the same number of keen students in each group', why: 'Not exactly: one split might have 12 keen students against 8. But 8 against 12 is just as likely, so there is no tilt either way.' },
        { text: 'The researcher can move students around afterwards until the groups look alike', why: 'Hand-picking brings back the very problem the coin removed: the picker\'s choices may be tied to the outcome, even without meaning to.' },
        { text: 'Keen students are a little more likely to get heads', why: 'A coin has no idea who is keen. That ignorance is the whole point.' },
      ],
      explain: `
        Random assignment balances **everything** at once: keenness, sleep, family background, and things nobody has thought of. Not perfectly in any one experiment, but without favouring either group.

        So if the groups differ afterwards by more than chance can explain, the treatment is the only explanation left. That is why a **randomised controlled trial** can show cause and effect, and an observational study on its own cannot.
      `,
    },
    {
      id: 'lind',
      type: 'choice',
      title: 'A fair test, 1747',
      text: `
        By his own account, in May 1747 the naval surgeon James Lind, aboard HMS *Salisbury*, took 12 sailors with scurvy, chosen to be as alike as possible. He kept them together on the same diet and gave each pair a different daily remedy: cider, vinegar, sea water, oranges and lemons, and two more. After six days one of the two men on citrus was fit for duty and the other almost recovered.

        It is often called the first clinical trial. **Which feature of a modern trial did it lack?**
      `,
      columns: 1,
      options: [
        { text: 'Chance did not decide who got which remedy: Lind did', correct: true },
        { text: 'A comparison between treatments', why: 'It had exactly that: six remedies, side by side.' },
        { text: 'Keeping everything else the same for all the patients', why: 'Lind did that too: similar cases, kept together, on the same diet.' },
      ],
      explain: `
        Lind's test was a **controlled comparison**: similar patients, the same conditions, different remedies. That was a great step forward. But he chose who got what, so it was not *randomised*, and with two men per remedy luck could have played a large part.

        Letting chance form the groups became standard practice only in the twentieth century.
      `,
    },
    {
      id: 'salk',
      type: 'info',
      title: 'Placebos and blinding',
      text: `
        Random groups are not quite enough. People who know they are being treated often feel better anyway, and doctors who know may judge unclear cases hopefully. So in a good trial the control group gets a **placebo**, a look-alike with nothing active in it, and neither patients nor doctors know who got which until the end. The trial is **double-blind**.

        A famous example is the 1954 trial of Jonas Salk's polio vaccine in the United States. In the part of it run this way, about 400,000 children were assigned at random to the vaccine or to a placebo injection.

        | | Children | Confirmed polio cases |
        |---|---:|---:|
        | Vaccine | 200,745 | 57 |
        | Placebo | 201,229 | 142 |

        Two groups formed by chance, treated alike in every other way, and a gap far too big for chance. (Counting only the paralytic cases, it was 33 against 115.) The results were announced on 12 April 1955.
      `,
    },
    {
      id: 'safeguards',
      type: 'match',
      review: true,
      text: 'Match each safeguard of a good trial with the problem it removes.',
      pairs: [
        ['A control group', 'Patients who would have got better anyway'],
        ['Random assignment', 'Groups that differ before treatment starts'],
        ['A placebo', 'Feeling better because you expect to'],
        ['Blinding the doctors', 'Hopeful judging of unclear cases'],
      ],
      explain: 'A control group shows what happens without the treatment. Random assignment makes the two groups alike. A placebo and blinding keep expectations, the patients\' and the doctors\', from leaking into the results.',
    },
    {
      id: 'ab-test',
      type: 'interact',
      graded: false,
      title: 'An A/B test, start to finish',
      text: `
        A website wants more visitors to sign up. For a week each visitor is sent, **at random**, to the old page (A) or to a new one (B).

        - Page A: 1,000 visitors, **100** sign-ups (10%).
        - Page B: 1,000 visitors, **130** sign-ups (13%).

        First, the test. If the page made no difference, the 230 sign-ups would be shared out between A and B by chance alone. **Shuffle at least 1,000 times**: how often does chance give B a lead of 3 points or more?
      `,
      widget: {
        type: 'null-sim', kind: 'shuffle', exact: true, buttons: [1, 100, 1000],
        groups: [{ label: 'page B', n: 1000, hits: 130 }, { label: 'page A', n: 1000, hits: 100 }],
        alt: 'Two bars for the sign-up rates of page B and page A, and a histogram of the lead that chance alone gives page B when the 230 sign-ups are dealt out at random.',
      },
      check: (s) => s.trials >= 1000 || `${thousands(s.trials)} ${s.trials === 1 ? 'shuffle' : 'shuffles'} so far. Keep going until you have at least 1,000.`,
      solution: { trials: 1000 },
      explain: `
        Chance alone gives B a lead of 3 points or more in only about **2%** of shuffles (the orange pill has the exact long-run figure: 2.1%). So p ≈ 0.02, below 0.05: the difference is statistically significant.

        And because visitors were assigned at random, the page itself is the only systematic difference between the two groups. If the lead is not luck, it is the page.
      `,
    },
    {
      id: 'ab-interval',
      type: 'fill',
      title: 'How big is the improvement?',
      text: `
        Second, the size. Page B is ahead by 3 percentage points in this sample. The standard error of that difference works out at about **1.4 points**.

        Build the 95% confidence interval for B's true lead: estimate ± 2 standard errors.
      `,
      template: r`
        Margin: $2 \times 1.4 =$ [[2.8]] points.

        Interval: from [[0.2]] to [[5.8]] points.
      `,
      hints: ['Take the margin off 3 for the lower end, and add it on for the upper end.'],
      explain: r`
        $3 - 2.8 = 0.2$ and $3 + 2.8 = 5.8$. The data point to a real gain for page B, of somewhere between 0.2 and 5.8 percentage points.

        That is the whole report: **random assignment** (so a real gap must be the page's doing), **a p-value** (how hard the gap is to explain by luck), and **an interval** (how big, and how uncertain, the gain is). Whether a gain that might be as small as 0.2 points is worth the switch is a business decision.
      `,
    },
    {
      id: 'teach-zero',
      type: 'info',
      title: 'Is zero inside the interval?',
      text: r`
        A confidence interval is the set of values the data leave plausible. For a difference between two groups one value matters most: **0**, which means "no difference at all".

        :::example
        Version A: 600 people, 22% signed up. Version B: 600 people, 26%. B leads by 4 points, with a standard error of about 2.5 points.

        1. Margin: $2 \times 2.5 = 5$ points.
        2. Interval: from $4 - 5 = -1$ to $4 + 5 = 9$ points.
        3. 0 is inside it, so the data **do not** rule out "no difference at all". That is not proof that the versions are equal: the test was too small to tell.

        Had B scored 29%, a lead of 7, the interval would run from 2 to 12 points. Every value in it is above 0, so the data **do** rule out "no difference".
        :::
      `,
      figure: {
        type: 'number-line', min: -4, max: 12, tick: 1, major: 2,
        ranges: [{ from: -1, to: 9, color: 'blue' }],
        marks: [{ value: 4, label: 'lead: 4', color: 'blue' }, { value: 0, label: '0', color: 'red' }],
        caption: 'The interval for B\'s lead, from −1 to 9 points. Zero, "no difference", lies inside it.',
        alt: 'A number line from −4 to 12 with the interval from −1 to 9 shaded. The lead of 4 is marked at its centre, and 0 lies inside the shaded part.',
      },
    },
    {
      id: 'ab-read',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const t = rng.pick(AB_TESTS);
        const c = rng.pick(AB_THINGS);
        const lead = t.b - t.a;
        const margin = round(2 * t.se, 1);
        const lo = round(lead - margin, 1);
        const hi = round(lead + margin, 1);
        const clear = lo > 0;
        return {
          text: `
            Two versions of ${c.thing} are tested on people assigned at random. Version A: ${thousands(t.n)} people, **${t.a}%** ${c.did}. Version B: ${thousands(t.n)} people, **${t.b}%** ${c.did}.

            B leads by ${lead} percentage points, with a standard error of about **${num(t.se)} points**. Build the 95% confidence interval for B's true lead (2 standard errors).
          `,
          template: `
            Margin: [[${num(margin)}]] points.

            Interval: from [[${num(lo)}]] to [[${num(hi)}]] points.

            So the data [[${clear ? '*do|do not' : 'do|*do not'}]] rule out "no difference at all".
          `,
          hints: [
            `The margin is 2 × ${num(t.se)}.`,
            'Is 0 inside the interval? If it is, "no difference" is still one of the plausible values.',
          ],
          explain: `
            The margin is 2 × ${num(t.se)} = ${num(margin)}, so the interval runs from ${lead} − ${num(margin)} = ${signedText(num(lo))} to ${lead} + ${num(margin)} = ${num(hi)} points.
            ${clear
              ? `Every value in it is above 0: "no difference" is not among the plausible values, which run from a lead of ${num(lo)} points to one of ${num(hi)}.`
              : `It includes 0 (and some negative values), so the true difference could be nothing at all, or even in A's favour. That is not proof that the versions are equal: the test was simply too small to tell.`}
          `,
        };
      },
    },
    {
      id: 'which-design',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const d = rng.pick(DESIGNS);
        const big = rng.pick([20000, 30000, 50000]);
        const small = rng.pick([300, 400, 600]);
        return {
          text: `
            Two studies ask whether ${d.claim}.

            - ${d.watch(thousands(big))}
            - ${d.assign(small)}

            Both find a difference. **Which is better evidence of cause and effect?**
          `,
          columns: 1,
          options: [
            { text: 'Study B: random assignment makes the groups alike in everything but the treatment', correct: true },
            { text: `Study A: with ${thousands(big)} people, chance is ruled out`, why: `Size shrinks chance error, not bias. ${d.chose} may differ in other ways (${d.other}), and that problem does not shrink however many people are observed.` },
            { text: 'They are equally good: both compare people who did with people who did not', why: 'The comparison looks the same, but how the groups were formed is everything. In Study A people sorted themselves; in Study B chance did the sorting.' },
            { text: 'Neither: statistics can never show cause and effect', why: 'A randomised experiment can. If chance formed the groups, a difference too big for chance has to come from the treatment.' },
          ],
          explain: `
            ${d.chose} may differ from the rest in many ways: ${d.other}. Any of these could be a confounder, and Study A cannot rule them out, however large it is.

            In Study B a coin, not the people, decided who got the treatment. The groups are alike on average in everything, known and unknown, so a difference between them points to the treatment itself.
          `,
        };
      },
    },
  ],
  recap: [
    'When people choose their own treatment, the groups differ before the treatment starts. A **confounder** can create a gap out of nothing.',
    '**Random assignment** makes the groups alike on average in everything, known and unknown. That is why a randomised trial can show cause.',
    'A control group, a placebo and blinding keep recovery-anyway and wishful thinking out of the result.',
    'A complete report of an experiment: how the groups were formed, a p-value, and the size of the effect with its interval.',
  ],
  next: 'Next: the last lesson. How honest-looking studies find something in nothing, and how to read the news without being fooled.',
};
