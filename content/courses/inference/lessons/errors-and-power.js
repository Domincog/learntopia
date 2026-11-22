// Statistical Inference · Lesson 4 · Two Ways to Be Wrong
import { r } from '../../../kit.js';
import { pct } from '../helpers.js';

/** An experiment on exam scores (SD 10 points): two groups of n students, compared by the difference of their averages. */
const lab = (extra) => ({ type: 'power-lab', sd: 10, unit: 'points', ...extra });

// [ideas tested, how many are real]: 5% of the rest is a whole number
const LABS = [[200, 40], [400, 100], [400, 60], [1000, 200], [1000, 100]];

const TRIALS = [
  { treatment: 'a new physiotherapy routine for back pain', people: 'patients', headline: 'Physio routine does not help back pain', benefit: 'benefit' },
  { treatment: 'a vitamin supplement meant to shorten colds', people: 'volunteers', headline: 'Vitamin supplement has no effect on colds', benefit: 'benefit' },
  { treatment: 'a reading programme for seven-year-olds', people: 'pupils', headline: 'Reading programme makes no difference', benefit: 'improvement' },
  { treatment: 'a sleep app for people with insomnia', people: 'volunteers', headline: 'Sleep app does not work', benefit: 'benefit' },
];

export default {
  id: 'errors-and-power',
  steps: [
    {
      id: 'hook',
      type: 'slider',
      mode: 'predict',
      title: 'A real effect, a small experiment',
      text: `
        Suppose a new revision method **really does** raise exam scores, by 3 points on average. (Scores vary from student to student with an SD of 10 points.)

        A school tests it: 20 students use the method, 20 do not, and the two averages are compared using the 0.05 rule.

        **What is the chance that this experiment comes out "statistically significant"?**
      `,
      min: 0, max: 100, step: 5, answer: 25, tolerance: 10, unit: '%', start: 50,
      explain: `
        Only about **24%**. Three times out of four, an experiment of this size *misses* an effect that is really there.

        A test can go wrong in two different ways, and this is the one people forget.
      `,
    },
    {
      id: 'run-small',
      type: 'interact',
      graded: false,
      title: 'Run it a hundred times',
      text: `
        The [blue]{.blue} bell shows the differences that experiments of this size produce when the method really adds 3 points. The [grey]{.gray} bell shows them when it adds nothing. A result counts as significant if it lands to the right of the vertical line.

        **Run at least 100 experiments** in the world where the effect is real.
      `,
      widget: lab({ effect: 3, n: 20, simulate: [1, 100], alt: 'Two overlapping bell curves, one centred on 0 and one on 3 points, with a threshold line at about 5 points. Simulated experiments drop as dots underneath.' }),
      check: (s) => s.runs >= 100 || `${s.runs} ${s.runs === 1 ? 'experiment' : 'experiments'} so far. Run at least 100.`,
      solution: { runs: 100 },
      explain: `
        Roughly a quarter of the dots land beyond the line: filled, "detected". The rest fall short. Each of those is an experiment that looked at a real effect and reported "not significant".

        With only 20 students in a group the two bells overlap so much that chance can easily hide a 3-point effect.
      `,
    },
    {
      id: 'two-errors',
      type: 'info',
      title: 'Two ways to be wrong',
      text: `
        A test gives one of two verdicts, and the truth is one of two things. That makes four cases.

        | | Verdict: significant | Verdict: not significant |
        |---|---|---|
        | **Nothing is going on** | **False alarm** (type I error) | Correct |
        | **The effect is real** | Correct | **Miss** (type II error) |

        - A **false alarm** announces an effect that is not there. Its rate is set by the threshold: under the 0.05 rule, 5% of experiments on a useless treatment still come out significant.
        - A **miss** overlooks an effect that is there. Its rate depends on the size of the effect and the size of the experiment.
      `,
      figure: lab({ effect: 3, n: 20, caption: 'The first experiment again. The red sliver of the grey bell is the false-alarm rate, and the striped part of the blue bell is the miss rate.', alt: 'The two bells of the first experiment: grey centred on 0, blue centred on 3 points. To the right of the threshold line a small red sliver of the grey bell is the false-alarm rate; the striped three-quarters of the blue bell to its left is the miss rate.' }),
    },
    {
      id: 'classify',
      type: 'bucket',
      review: true,
      text: 'Sort each story. In every one, "nothing is going on" is the default explanation.',
      buckets: ['False alarm (type I)', 'Miss (type II)', 'Correct verdict'],
      items: [
        { text: 'A smoke alarm goes off; someone was only making toast', bucket: 0, why: 'There is no fire, and the alarm says there is: a false alarm.' },
        { text: 'A trial of a drug that really works reports "no significant benefit"', bucket: 1, why: 'The effect is real and the test did not pick it up: a miss.' },
        { text: 'A study declares a lucky charm effective (p = 0.04); the charm does nothing', bucket: 0, why: 'Nothing is going on, yet the result came out significant: a false alarm.' },
        { text: 'A coin that really is biased passes a fairness test', bucket: 1, why: 'There was something to find, and the test did not find it: a miss.' },
        { text: 'A useless supplement is tested and the result is "not significant"', bucket: 2, why: 'Nothing is going on, and the test does not claim otherwise.' },
        { text: 'A large trial finds that a vaccine prevents illness, and it does', bucket: 2, why: 'A real effect, correctly detected.' },
        { text: 'A spam filter lets a scam email through as ordinary mail', bucket: 1, why: 'The default is "ordinary email". This one was not, and the filter failed to flag it: a miss.' },
      ],
      explain: 'A false alarm sees something where there is nothing. A miss sees nothing where there is something. Which one is worse depends on what is at stake.',
    },
    {
      id: 'threshold-drag',
      type: 'interact',
      title: 'Move the line',
      text: `
        A bigger experiment this time: 50 students in each group, and a real effect of 5 points. The line starts where the false-alarm rate is about 5%.

        A journal editor is tired of false alarms. **Drag the line until the false-alarm rate is 1% or less**, and watch what happens to the misses.
      `,
      widget: lab({ effect: 5, n: 50, drag: true, threshold: 3.3, alt: 'Two bell curves, centred on 0 and on 5 points, with a threshold line that can be dragged. Readouts give the false-alarm rate, the miss rate and the power.' }),
      check: (s) => {
        if (s.alpha <= 0.01) return true;
        return s.alpha > 0.05
          ? `That way lies trouble: the false-alarm rate is now ${pct(s.alpha)}%. Drag the line to the right.`
          : `The false-alarm rate is ${pct(s.alpha)}%. Move the line further to the right.`;
      },
      solution: { threshold: 4.7 },
      hints: ['The false-alarm rate is the red area: the part of the grey bell to the right of the line.'],
      explain: `
        With the line at 3.3 points the false-alarm rate was about 5% and the test missed about 20% of the time. With the line at 4.7 the false-alarm rate is below 1%, and the miss rate is up to **44%**.

        For a given experiment the two errors trade against each other. Push one down and the other goes up.
      `,
    },
    {
      id: 'tradeoff',
      type: 'fill',
      text: 'Sum up what you just saw. The experiment itself (its size, and the size of the effect) stays the same.',
      template: `
        Moving the threshold to the right makes false alarms [[*rarer|more common]] and misses [[rarer|*more common]].

        Under the 0.05 rule, about [[5]] in every 100 experiments on a treatment that does **nothing** still come out significant.
      `,
      explain: 'A stricter threshold protects against false alarms and pays for it in misses. And the threshold *is* the false-alarm rate: 0.05 means 5 false alarms per 100 experiments in which nothing is going on.',
    },
    {
      id: 'power-name',
      type: 'info',
      title: 'Power',
      text: `
        The chance that a test **detects** an effect that is really there has a name.

        :::key
        **Power** is the probability of a significant result when the effect is real and has a given size. It is 1 minus the miss rate.
        :::

        The first experiment in this lesson had a power of 24%. Researchers usually aim for at least **80%**.

        Loosening the threshold buys power at the price of more false alarms. There are two better ways to get it, and you can try both.
      `,
    },
    {
      id: 'power-n',
      type: 'interact',
      title: 'More students',
      text: `
        Back to the 3-point effect, with the false-alarm rate held at 5%. The slider sets how many students are in each group.

        **Find the smallest group size on the slider that gives a power of at least 80%.**
      `,
      widget: lab({ effect: 3, n: 20, nRange: [20, 300, 20], nLabel: 'students per group', alt: 'Two bell curves, centred on 0 and on 3 points, that get narrower as a slider raises the number of students per group.' }),
      check: (s) => {
        if (s.n === 140) return true;
        return s.power < 0.8
          ? `With ${s.n} students per group the power is ${pct(s.power)}%. Not 80% yet.`
          : `${s.n} per group gives a power of ${pct(s.power)}%: enough, but a smaller group already reaches 80%.`;
      },
      solution: { n: 140 },
      hints: ['Slide to the right until the green "power" readout first reaches 80%.'],
      explain: `
        With 140 students per group the power is 81%. With 120 it is still only 75%.

        Bigger groups mean smaller standard errors, so both bells get narrower and overlap less. Going from 24% power to 81% took seven times as many students.
      `,
    },
    {
      id: 'effect-size',
      type: 'interact',
      title: 'A bigger effect',
      text: `
        Now keep 50 students per group and change the effect itself.

        **How big must the true effect be before this experiment has 80% power?** Find the smallest such effect on the slider.
      `,
      widget: lab({ effect: 3, n: 50, effectRange: [0, 8, 0.5], alt: 'Two bell curves. A slider moves the blue one, the real effect, away from the grey one centred on 0.' }),
      check: (s) => {
        if (s.effect === 5) return true;
        if (s.effect === 0) return 'With no effect at all there is nothing to detect: the "power" is just the 5% false-alarm rate. Make the effect bigger.';
        return s.power < 0.8
          ? `An effect of ${s.effect} points gives a power of ${pct(s.power)}%. Not 80% yet.`
          : `An effect of ${s.effect} points gives ${pct(s.power)}%: enough, but a smaller effect already reaches 80%.`;
      },
      solution: { effect: 5 },
      explain: `
        An effect of 5 points gives 80% power. One of 4.5 points gives only 73%, and one of 1 point just 13%.

        **Small effects need big experiments.** Before a study starts, a careful researcher asks: how small an effect would still matter, and is my study big enough to see it?
      `,
    },
    {
      id: 'teach-power',
      type: 'info',
      title: 'What gives a test power',
      text: `
        Power grows when the two bells overlap less. Three things do that:

        - **A larger true effect** (a bigger *effect size*) moves the blue bell away from the grey one.
        - **More people in each group** make the standard error smaller, so both bells get narrower.
        - **Less varied measurements** (a smaller SD) make the bells narrower too: less noise, a smaller standard error.

        A stricter threshold does the opposite: fewer false alarms, but more misses and less power.

        :::key
        Low power makes "not significant" tell you little. A test with 24% power misses a real effect 76 times in 100, so that verdict was the likely one whether the effect is there or not.
        :::
      `,
      figure: lab({
        effect: 5, n: 50,
        caption: 'An effect of 5 points with 50 students per group: the bells overlap little, and the power is 80%.',
        alt: 'Two bell curves, centred on 0 and on 5 points, that overlap only a little. The threshold line cuts off a small red sliver of the grey bell and a striped fifth of the blue bell.',
      }),
    },
    {
      id: 'raises-power',
      type: 'multi',
      review: true,
      text: 'Which of these make an experiment **more likely to detect** an effect that really exists?',
      options: [
        { text: 'More people in each group', correct: true },
        { text: 'A larger true effect', correct: true },
        { text: 'Measurements that vary less from person to person', correct: true },
        { text: 'A stricter threshold: 0.01 instead of 0.05', why: 'A stricter threshold cuts false alarms, but it moves the line further from the bell of the real effect: more misses, less power.' },
        { text: 'Smaller groups, so that each person counts for more', why: 'Smaller groups have larger standard errors. The bells get wider and overlap more, and the power falls.' },
      ],
      explain: 'Power grows when the two bells overlap less: a bigger effect moves them apart, and more people or less noisy measurements make them narrower. A stricter threshold does the opposite of helping.',
    },
    {
      id: 'no-evidence',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const t = rng.pick(TRIALS);
        const n = rng.pick([12, 15, 20, 25]);
        const power = rng.pick([15, 20, 25, 30]);
        const p = rng.pick([0.18, 0.24, 0.31, 0.4]);
        return {
          text: `
            A small trial, with ${n} ${t.people} per group, tests ${t.treatment}. The result is not statistically significant (p = ${p}). The trial's power to detect a worthwhile ${t.benefit} was only **${power}%**.

            A headline reads: *"${t.headline}."* **Is the headline justified?**
          `,
          columns: 1,
          options: [
            { text: 'No. A trial this small would probably have missed a real effect, so it settles nothing either way', correct: true },
            { text: 'Yes. A p-value above 0.05 shows that there is no effect', why: `A p-value above 0.05 means the data are consistent with no effect. With ${power}% power they are consistent with a real one too: a trial like this misses a worthwhile ${t.benefit} ${100 - power} times in 100.` },
            { text: `Yes. The probability that the treatment does nothing is ${pct(p, 0)}%`, why: 'A p-value is worked out *assuming* the treatment does nothing. It is not the probability of that assumption.' },
            { text: 'No. A result that is not significant means the trial was badly run', why: `Nothing need have gone wrong. With ${power}% power, a well-run trial of a treatment that works still comes out "not significant" most of the time.` },
          ],
          explain: `
            With a power of ${power}%, this trial would miss a real, worthwhile ${t.benefit} about ${100 - power} times in 100. So "not significant" was the likely result whether the treatment works or not.

            **No evidence of an effect is not evidence of no effect.** The honest headline is "small trial fails to settle the question".
          `,
        };
      },
    },
    {
      id: 'example-count',
      type: 'info',
      title: 'Worked example: counting a lab\'s errors',
      text: r`
        The two error rates turn into head counts, as they did for the 1,000 experiments in the last lesson.

        :::example
        A lab tests **400** ideas. In truth **80** are real effects and the other 320 do nothing. Every experiment uses the 0.05 rule and has a power of **70%**.

        1. False alarms: 5% of the 320 useless ideas, $0.05 \times 320 = 16$.
        2. Real effects detected: 70% of the 80, $0.7 \times 80 = 56$.
        3. Real effects missed: $80 - 56 = 24$.

        The lab sees $16 + 56 = 72$ significant results, and 16 of them are false alarms.
        :::
      `,
      figure: {
        type: 'icon-array', n: 400, base: 0.2, sens: 0.7, fpr: 0.05, stage: 2, stages: false,
        words: {
          people: 'ideas', has: 'real effects', not: 'useless', posVerb: 'come out significant',
          tp: 'real effect, detected', fn: 'real effect, missed', fp: 'no effect, false alarm', tn: 'no effect, not significant',
        },
        caption: 'The 400 ideas after testing: 56 detected, 24 missed, 16 false alarms, and 304 correctly left alone.',
        alt: 'Four hundred dots, one per idea. Of the 80 squares for real effects, 56 are marked as detected and 24 as missed. Of the 320 circles for useless ideas, 16 are marked as false alarms.',
      },
    },
    {
      id: 'count-errors',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const [total, real] = rng.pick(LABS);
        const power = rng.pick([50, 60, 80, 90]);
        const useless = total - real;
        const alarms = (useless * 5) / 100;
        const found = (real * power) / 100;
        return {
          text: `
            A lab tests **${total}** ideas. In truth **${real}** of them are real effects, and the other ${useless} do nothing. Every experiment uses the 0.05 rule and has a power of **${power}%** against the real effects.

            **What should the lab expect, on average?**
          `,
          template: `
            False alarms: 5% of the ${useless} useless ideas = [[${alarms}]].

            Real effects detected: ${power}% of the ${real} = [[${found}]].

            Real effects missed: [[${real - found}]].
          `,
          hints: [`5% of ${useless} is ${useless} ÷ 20.`, `What is not detected is missed: ${real} minus the number detected.`],
          explain: `
            False alarms: 0.05 × ${useless} = ${alarms}. Detected: ${power / 100} × ${real} = ${found}. Missed: ${real} − ${found} = ${real - found}.

            So the lab gets ${alarms + found} significant results, and ${alarms} of them are false alarms.
          `,
        };
      },
    },
    {
      id: 'huge-sample',
      type: 'choice',
      title: 'Significant is not the same as important',
      text: `
        Power has a flip side. Remember that "significant" means *hard to explain by chance alone*: it does not mean large, or important.

        An online shop tests a new button colour on **four million** visitors, half seeing each version: 10.0% buy with the old colour, 10.1% with the new. With samples this huge, even that gap is highly significant: p is below 0.001.

        The 95% confidence interval for the improvement runs from **0.04 to 0.16 percentage points**. **What should the report say?**
      `,
      columns: 1,
      options: [
        { text: 'The evidence that the new colour sells more is strong, but the gain is a sliver: between 0.04 and 0.16 percentage points', correct: true },
        { text: 'p < 0.001: the new colour is a major improvement', why: 'A tiny p-value says that chance alone would almost never produce a gap like this one. It says nothing about the size of the gap, which is a tenth of a percentage point.' },
        { text: 'An effect that small cannot be real', why: 'It is small, but with four million visitors chance alone would almost never produce it. Small but real is what the data point to.' },
        { text: 'Nothing can be said until the test has been repeated', why: 'A repeat is always welcome, but this one experiment already pins the size of the effect down well: about a tenth of a percentage point.' },
      ],
      explain: `
        With enough data, any difference that is not exactly zero becomes statistically significant. So "significant" can never be the whole report.

        **Say how big the effect is, and give its interval.** Here that is about one extra sale per 1,000 visitors. Perhaps worth a line of code; hardly a headline.
      `,
    },
  ],
  recap: [
    'A **false alarm** (type I error) finds an effect that is not there. A **miss** (type II error) overlooks one that is.',
    'For a given experiment, a stricter threshold means fewer false alarms and more misses.',
    '**Power** is the chance of detecting a real effect of a given size. It grows with the size of the sample and the size of the effect. Small studies easily miss real effects.',
    'Significant is not the same as important. Report the size of the effect with its confidence interval.',
  ],
  next: 'Next: where do the two groups in an experiment come from? The answer decides whether you can talk about cause and effect.',
};
