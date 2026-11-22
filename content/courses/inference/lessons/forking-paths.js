// Statistical Inference · Lesson 6 · How to Find Something in Nothing
import { r, num, round } from '../../../kit.js';
import { HACK, DRAWER, FLAVOURS } from '../helpers.js';

/** Twenty studies, one per flavour of chewing gum. No flavour does anything. */
const wall = (extra) => ({ type: 'many-tests', tests: 20, labels: FLAVOURS, batches: [1, 20], ...extra });

const SCREENS = [
  { who: 'A genetics team', what: (n) => `tests **${n} genes** for a link with a person's height` },
  { who: 'A marketing team', what: (n) => `tries **${n} versions** of an advert against the current one` },
  { who: 'A drug company', what: (n) => `screens **${n} compounds** for an effect on blood pressure` },
  { who: 'A nutrition lab', what: (n) => `tests **${n} foods** for a link with headaches` },
];

const OUTCOME_STUDIES = [
  'A study of a new diet',
  'A trial of a herbal tea',
  'An experiment on background music in classrooms',
  'A study of a fitness tracker',
];

export default {
  id: 'forking-paths',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Twenty flavours of chewing gum',
      text: `
        A lab wonders whether chewing gum improves memory. It finds nothing. So it tests each of **20 flavours** separately, each in its own experiment, each with the usual 0.05 rule.

        Suppose the truth is that **no flavour has any effect**. **How likely is it that at least one of the 20 tests comes out "significant" anyway?**
      `,
      shuffle: false,
      options: [
        { text: 'About 5%' },
        { text: 'About 25%' },
        { text: 'About 64%', correct: true },
        { text: 'Nearly 100%' },
      ],
      explain: r`
        About **64%**: more likely than not. Each test has a 95% chance of *not* raising a false alarm, so all twenty stay quiet with probability $0.95^{20} \approx 0.36$. That leaves a 64% chance of at least one "discovery" about nothing.

        This lesson is about the many ways of running twenty tests without noticing.
      `,
    },
    {
      id: 'wall',
      type: 'interact',
      graded: false,
      title: 'Run the twenty tests',
      text: `
        Each tile is one experiment on one flavour, and shows its p-value. No flavour does anything, so every starred tile is a false alarm.

        **Run the 20 studies. Then run at least 20 batches in all**, and watch how many batches contain at least one "discovery".
      `,
      widget: wall({ alt: 'A wall of twenty tiles, one study per flavour of chewing gum. Tiles whose p-value is below 0.05 are starred.' }),
      check: (s) => s.batches >= 20 || `${s.batches} ${s.batches === 1 ? 'batch' : 'batches'} so far. Run at least 20.`,
      solution: { batches: 20 },
      explain: `
        Some batches are clean; most are not. In the long run 64% of batches contain at least one starred tile, and the average is **one false alarm per batch**: 20 tests × 0.05.

        A lab that reports only the starred flavour ("Lemon gum boosts memory, p = 0.03!") is reporting noise.
      `,
    },
    {
      id: 'teach-many',
      type: 'info',
      title: 'Many tests, many false alarms',
      text: r`
        A test of something that does nothing still comes out "significant" with probability 0.05: the false-alarm rate from [Two Ways to Be Wrong](#/learn/inference/errors-and-power). Run many such tests, and two sums tell you what to expect.

        :::example
        **How many false alarms?** A team runs **300** tests at 0.05, and none of the 300 things has any effect. It should expect $300 \times 0.05 = 15$ "significant" results on average. With a threshold of 0.01 it would be $300 \times 0.01 = 3$.

        **At least one?** Another team runs **8** such tests at 0.05. One test stays quiet with probability 0.95, so all eight stay quiet with probability $0.95^{8} \approx 0.66$. The chance of at least one false alarm is $1 - 0.66 = 0.34$, or 34%.
        :::
      `,
    },
    {
      id: 'expected',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick(SCREENS);
        const alpha = rng.pick([0.05, 0.05, 0.01]);
        const n = alpha === 0.05 ? rng.pick([20, 40, 60, 100, 200, 500]) : rng.pick([100, 200, 500, 1000]);
        const answer = round(n * alpha, 2);
        const rate = round(alpha * 100, 2);
        return {
          text: `
            ${scene.who} ${scene.what(n)}, one test each, with a threshold of **${alpha}**. In truth, none of them has any effect.

            **How many "significant" results should the team expect, on average?**
          `,
          answer,
          wrong: [
            [n - answer, 'That is how many tests should stay quiet. The question asks for the ones that raise a false alarm.'],
            [0, `Zero would be right if tests never raised false alarms. Each one does so with probability ${alpha}.`],
            [rate, `${rate}% is the false-alarm rate of one test. Take ${rate}% of the ${n} tests.`],
          ].filter(([v]) => v !== answer),
          hints: [`Each test has a ${rate}% chance of a false alarm. What is ${rate}% of ${n}?`],
          explain: r`$${n} \times ${alpha} = ${num(answer)}$. With ${n} tests of nothing, about ${num(answer)} will cross the line by chance alone. Every one of them will look like a finding.`,
        };
      },
    },
    {
      id: 'at-least-one',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const k = rng.pick([2, 3, 4, 5, 10]);
        const study = rng.pick(OUTCOME_STUDIES);
        const quiet = 0.95 ** k;
        const answer = 100 * (1 - quiet);
        return {
          text: r`
            In [And, Or, Not](#/learn/probability/and-or) you found the chance of "at least one" by turning it inside out: 1 minus the chance of none.

            ${study} measures **${k} different outcomes**. In truth the treatment affects none of them. Each outcome is tested at 0.05; treat the tests as independent.

            **What is the chance that at least one outcome comes out significant?** Give a percentage, to the nearest whole number.
          `,
          answer,
          display: String(Math.round(answer)),
          unit: '%',
          tolerance: 0.6,
          wrong: [
            [5, `That is the chance for a single test. With ${k} tests there are ${k} chances of a false alarm.`],
            [100 * quiet, 'That is the chance that *none* comes out significant. Take it away from 100%.'],
            ...(k >= 4 ? [[5 * k, `Adding 5% per test overshoots, because it counts the cases with two false alarms twice. Use 1 minus the chance that all ${k} stay quiet.`]] : []),
          ],
          hints: [
            r`One test stays quiet with probability 0.95. All ${k} stay quiet with probability $0.95^{${k}}$.`,
            r`$0.95^{${k}} \approx ${num(quiet, 3)}$. Subtract from 1.`,
          ],
          explain: r`$1 - 0.95^{${k}} = 1 - ${num(quiet, 3)} \approx ${num(answer, 0)}\%$. Measuring ${k} outcomes instead of one turns a 5% risk of a false alarm into ${num(answer, 0)}%.`,
        };
      },
    },
    {
      id: 'p-hack',
      type: 'interact',
      title: 'Your turn to cheat',
      text: `
        You have run a trial of a herbal supplement: 240 volunteers, half on the supplement, half on a placebo. Your plan was to compare **weight** in **everyone**. Result: p = 0.39. Nothing.

        But you also recorded four other outcomes, and you could look at women, men or the over-50s separately. (The truth: the supplement does nothing, and all the data are noise.)

        **Tap tiles to run other analyses until you find one with p < 0.05.**
      `,
      widget: { type: 'many-tests', mode: 'paths', rows: HACK.rows, cols: HACK.cols, p: HACK.p, open: [[0, 0]], alt: 'A grid of twenty possible analyses: four groups of people by five outcomes. Tapping a tile runs that analysis and shows its p-value.' },
      check: (s) => {
        if (s.found) return true;
        return s.tried < 20
          ? `Nothing below 0.05 yet: the smallest p-value so far is ${s.bestText}. Try other tiles (${s.tried} of 20 run).`
          : false;
      },
      solution: { opened: [[0, 0], [1, 2]] },
      hints: ['Keep tapping. With twenty analyses of pure noise, one or two will cross the line.', 'Try the row for women, or the row for the over-50s.'],
      explain: `
        There are two: **mood in women** (p = 0.026) and **energy in the over-50s** (p = 0.039). Write up either one on its own ("Supplement lifts mood in women, p = 0.03") and it reads like a discovery.

        But it was found by trying up to twenty analyses of pure noise, and one or two "hits" in twenty is exactly what chance delivers.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'P-hacking and the garden of forking paths',
      text: `
        Hunting through analyses until something crosses 0.05 is called **p-hacking**. It rarely feels like cheating, because each choice sounds reasonable on its own:

        - **Which outcome?** Weight, mood, sleep…
        - **Which people?** Everyone, or a subgroup where "it seems to work".
        - **Which data to drop?** "Outliers", dropouts, a bad day in the lab.
        - **When to stop?** Add a few more people and test again, until p dips below 0.05.

        Each fork multiplies the number of results that *could* have been reported. Statisticians call it the **garden of forking paths**.

        :::key
        The 0.05 rule promises a 5% false-alarm rate for **one** test, planned in advance. It promises nothing about the best of twenty.
        :::
      `,
    },
    {
      id: 'peeking',
      type: 'choice',
      title: 'Just a quick look',
      text: r`
        "When to stop?" is the fork that is easiest to miss. A researcher tests a treatment that does nothing. She plans for 100 volunteers, but she is impatient: she runs the test after every 20, five looks in all, and will stop and publish the moment p drops below 0.05.

        Five *separate* experiments would give at least one false alarm with probability $1 - 0.95^{5} \approx 23\%$. Her five looks are not separate: each one uses the data of the looks before it again, so they tend to agree with one another.

        **What is her chance of "finding" an effect?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: 'Still 5%: every look uses the 0.05 rule', why: 'Each look does have a 5% false-alarm rate of its own. But she stops at the first look that crosses the line, so she has five chances, and needs only one.' },
        { text: 'About 14%, roughly one in seven', correct: true },
        { text: 'About 25%: five looks at 5% each', why: 'Even five separate experiments give only 23%, and her looks share most of their data, which makes a false alarm less likely than that.' },
        { text: 'Nearly 100%', why: 'Five looks cannot do more harm than five separate experiments would, and those give 23%.' },
      ],
      hints: ['More than the 5% of a single look, and less than the 23% of five separate experiments.'],
      explain: `
        About **14%**: nearly three times the advertised 5%. Every look is another chance for noise to cross the line, and she needs it to happen only once. (It is less than the 23% that five separate experiments would give, because her five looks share most of their data.)

        That figure counts a "finding" in either direction, as most published tests do; if only the hoped-for direction counts, it is about 13%. With ten looks, one after every 10 volunteers, the two figures rise to nearly 20% and about 17%, and every further look adds to them. Honest trials fix their stopping rule before they start.
      `,
    },
    {
      id: 'file-drawer',
      type: 'choice',
      title: 'The file drawer',
      text: `
        Forking paths run through whole fields of research too. Here **100 labs** each test the same idea, which is false: say, that a lucky charm improves exam scores. Six labs happen to get p < 0.05.

        Journals prefer "positive" findings, so those six are published. The other 94 results go into a drawer. Switch the view to **published only**.

        **What does someone who reads the journals conclude?**
      `,
      figure: { type: 'many-tests', p: DRAWER, drawer: true, noun: 'labs', alt: 'A wall of one hundred tiles, one per lab. Six are highlighted as significant. A switch hides the other ninety-four, leaving only the six published results.' },
      columns: 1,
      options: [
        { text: 'That the charm works: every published study found an effect', correct: true },
        { text: 'That the charm does nothing, as most labs found', why: 'Most labs did find nothing, but their results were never printed. The reader cannot see into the drawer.' },
        { text: 'That the evidence is mixed', why: 'It would look mixed if all 100 results were on show. In print there are six successes and no failures.' },
      ],
      explain: `
        Six significant results in 100 is just what chance produces when there is nothing to find: 5 are expected. But the published record shows six out of six.

        This is **publication bias**, or the *file-drawer problem*. When only significant results get printed, the journals fill up with flukes, and each one looks solid on its own.
      `,
    },
    {
      id: 'replication',
      type: 'info',
      title: 'The replication crisis',
      text: `
        How bad is it? In 2015 a group of about 270 researchers, the Open Science Collaboration, reported what happened when they repeated **100 studies** from three psychology journals, keeping as close to the original methods as they could.

        | | Original studies | Replications |
        |---|:---:|:---:|
        | Statistically significant | 97% | 36% |

        On average, the effects found in the replications were about **half the size** of the original ones.

        This does not mean that two-thirds of the original findings were false: a replication can miss a real effect too (remember power). But it showed that a published "p < 0.05" is much weaker evidence than it looks.
      `,
    },
    {
      id: 'why-shrink',
      type: 'choice',
      text: `
        The replications found effects only about half as big as the originals. **Why would published effects tend to be too big, even when the effect is real?**
      `,
      columns: 1,
      options: [
        { text: 'The studies that happened to overestimate the effect were the ones most likely to reach p < 0.05 and be published', correct: true },
        { text: 'Effects wear off as the years go by', why: 'Nothing about a real effect changes because somebody measured it once. What changes is *which* measurements we get to see.' },
        { text: 'The replication teams were less careful than the original researchers', why: 'There is no reason to think so. A replication is planned in advance, which leaves fewer forking paths to wander down, not more.' },
      ],
      hints: ['Think of the file drawer. Which studies get printed, and what did luck have to do to their estimates to get them there?'],
      explain: `
        A small study of a modest effect only crosses the line when luck pushes its estimate *up*. Print only the ones that cross, and the printed estimates are too big on average. It is the low-power experiment from *Two Ways to Be Wrong*, seen from the other side.

        The honest size shows up when somebody repeats the study without that filter.
      `,
    },
    {
      id: 'bonferroni',
      type: 'interact',
      title: 'Defence 1: pay for every test',
      text: r`
        If you run 20 tests, the simplest fix is to make each one 20 times stricter: demand $p < 0.05 \div 20 = 0.0025$. This is the **Bonferroni correction**.

        Here is the chewing-gum wall again. **Switch the threshold to 0.05 ÷ 20, then run at least 40 batches.** How often does a batch contain a false alarm now?
      `,
      widget: wall({ alphas: [0.05, 0.0025], alphaLabels: ['0.05', '0.05 ÷ 20'], alt: 'The wall of twenty chewing-gum studies, with a switch between the usual threshold of 0.05 and the stricter 0.05 divided by 20.' }),
      check: (s) => {
        if (s.alpha !== 0.0025) return 'Switch the threshold to 0.05 ÷ 20 first.';
        return s.batches >= 40 || `${s.batches} ${s.batches === 1 ? 'batch' : 'batches'} so far. Run at least 40.`;
      },
      solution: { alpha: 0.0025, batches: 40 },
      explain: r`
        Now only about 1 batch in 20 contains a false alarm (in the long run, $1 - 0.9975^{20} \approx 4.9\%$). The 5% promise holds again, this time for the whole family of tests.

        The price is power: a real effect has to clear a much higher bar. There is no free lunch, which is why it pays to test *few* things, chosen in advance.
      `,
    },
    {
      id: 'prereg',
      type: 'choice',
      mode: 'predict',
      title: 'Defence 2: call your shot',
      text: `
        **Pre-registration** means writing down in public, *before* collecting any data, what you will measure, in whom, and how you will analyse it. That leaves no forks to wander down.

        Around 2000 it became the rule for large clinical trials in the United States to declare their main outcome in a public registry before they began. A 2015 study looked at 55 big trials of treatments for heart disease, all funded by one US agency. Before 2000, **17 of 30** (57%) reported a significant benefit.

        **What happened after 2000?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: 'About the same: 14 of 25' },
        { text: 'Somewhat fewer: 9 of 25' },
        { text: 'Far fewer: 2 of 25', correct: true },
      ],
      explain: `
        **2 of 25**: just 8%. The treatments did not suddenly get worse. More likely, having to name the outcome in advance closed the forking paths that had been turning "nothing" into "something".

        (A before-and-after comparison is observational, so it cannot prove that. The authors of the study said so themselves.)
      `,
    },
    {
      id: 'defences',
      type: 'match',
      review: true,
      text: 'Match each defence with the problem it is aimed at. (An *effect size* says how big an effect is. A *null result* is a study that found nothing.)',
      pairs: [
        ['Pre-registration', 'Choosing the outcome after seeing the data'],
        ['A stricter threshold for many tests', 'One-in-twenty flukes among many comparisons'],
        ['Replication', 'One lucky result treated as established'],
        ['Reporting effect sizes with intervals', 'A trivial effect dressed up as "significant"'],
        ['Publishing null results', 'The file drawer'],
      ],
      explain: 'Decide the analysis in advance, pay for every extra test, repeat what matters, say how big the effect is, and let the "nothing found" results be seen. None of these needs new mathematics: only honesty about how many paths there were.',
    },
    {
      id: 'checklist',
      type: 'bucket',
      review: true,
      title: 'Reading a study in the news',
      text: 'A headline says that a study has "found a link". Sort these details from the article: **reassuring**, or a **warning sign**?',
      buckets: ['Reassuring', 'Warning sign'],
      items: [
        { text: 'People were assigned to the groups at random', bucket: 0, why: 'Random assignment rules out confounding: the groups differ only in the treatment.' },
        { text: 'The analysis plan was registered before the study began', bucket: 0, why: 'With the plan fixed in advance there were no forking paths to choose from.' },
        { text: 'An independent team repeated the study and found the same', bucket: 0, why: 'A fluke rarely happens twice. Replication is the strongest check there is.' },
        { text: 'The effect is reported with a confidence interval', bucket: 0, why: 'An interval says how big the effect may be and how uncertain it is: far more than "significant".' },
        { text: 'The effect shows up only in a subgroup, found after the data were in', bucket: 1, why: 'Slice the data enough ways and some subgroup will cross 0.05 by chance.' },
        { text: 'Dozens of outcomes were measured; one reached p = 0.04', bucket: 1, why: 'With dozens of tests, a p-value of 0.04 somewhere is what chance alone would deliver.' },
        { text: 'It says "significant" but never how big the effect is', bucket: 1, why: 'Significant is not the same as important. Without the size you cannot judge whether it matters.' },
        { text: 'Forty volunteers, and a surprisingly large effect', bucket: 1, why: 'Small studies have low power, and the ones that do reach significance tend to overstate the effect.' },
      ],
      explain: 'Ask of any study: how were the groups formed, was the analysis decided in advance, how many things were tested, how big is the effect, and has anyone repeated it?',
    },
  ],
  recap: [
    'Test twenty true-null hypotheses at 0.05 and expect one "significant" result. The 5% promise covers one test, planned in advance.',
    '**P-hacking** (trying outcomes, subgroups and stopping points) and **publication bias** fill the record with flukes and inflated effects.',
    'Defences: pre-register, correct for multiple tests, replicate, and report effect sizes with intervals.',
    'Reading a study: Random groups? Plan fixed in advance? How many things tested? How big is the effect? Has it been repeated?',
  ],
  next: 'That completes Statistical Inference. You can now say how far an estimate can be trusted, what a p-value does and does not claim, why coin tosses reveal causes, and how to tell a finding from a fluke.',
};
