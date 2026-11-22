// Statistical Inference · Lesson 2 · A Range You Can Trust
import { r, num, round } from '../../../kit.js';
import { thousands, unitFor, RAIN } from '../helpers.js';

/** Another city: the true mean commute is 40 minutes, and commutes vary with an SD of 12. */
const rain = (extra) => ({ type: 'interval-rain', mean: 40, sd: 12, n: 64, unit: 'min', ...extra });

/** Samples for interval practice: each has whole-number or tidy standard errors. [SD, √n] pairs. */
const CI_SCENES = [
  { items: 'apples', measure: 'weight', unit: 'g', means: [148, 152, 160], combos: [[10, 5], [20, 5], [30, 5], [20, 10], [30, 10], [15, 10]] },
  { items: 'adults', measure: 'night\'s sleep', unit: 'hours', means: [6.8, 7.1, 7.4], combos: [[1.2, 6], [1, 10], [1.5, 5], [1.6, 8]] },
  { items: 'pizza deliveries', measure: 'delivery time', unit: 'minutes', means: [32, 35, 38], combos: [[10, 5], [9, 6], [10, 10], [12, 8]] },
  { items: 'exam scripts', measure: 'mark', unit: 'marks', means: [58, 62, 66], combos: [[12, 6], [15, 10], [10, 5], [16, 8]] },
];

/** One sample and its 95% interval. */
function sampleOf(rng) {
  const scene = rng.pick(CI_SCENES);
  const [sd, root] = rng.pick(scene.combos);
  const m = rng.pick(scene.means);
  const se = round(sd / root, 2);
  return { ...scene, sd, root, n: root * root, m, se, lo: round(m - 2 * se, 2), hi: round(m + 2 * se, 2) };
}

const POLLS = [
  { n: 400, m: 5, above: [56, 57, 58], straddle: [47, 48, 52, 53, 54], below: [42, 43, 44] },
  { n: 625, m: 4, above: [55, 56, 57], straddle: [47, 48, 52, 53], below: [43, 44, 45] },
  { n: 1600, m: 2.5, above: [53, 54, 55], straddle: [48, 49, 51, 52], below: [45, 46, 47] },
  { n: 2500, m: 2, above: [53, 54, 55], straddle: [49, 51], below: [45, 46, 47] },
];
const PLANS = ['a new cycle lane through the centre', 'closing the high street to cars', 'a later start to the school day', 'building a new swimming pool'];

export default {
  id: 'confidence-intervals',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'How should she report it?',
      text: `
        A researcher asks **64 commuters**, picked at random, how long their journey to work takes. Her sample has an average of **41 minutes** and a standard deviation of **12 minutes**.

        She wants to report the average commute of the *whole city*. **Which report is the most honest?**
      `,
      shuffle: false,
      columns: 1,
      options: [
        { text: '"The average commute is 41 minutes."' },
        { text: '"The average commute is 41 minutes, give or take about 3."', correct: true },
        { text: '"The average commute is 41 minutes, give or take about 12."' },
      ],
      explain: r`
        A bare 41 hides the fact that another sample would have given another number. And 12 minutes is how much *individual commuters* vary, not how far her average might be off.

        Her average has a standard error of $12 \div \sqrt{64} = 1.5$ minutes, and averages rarely stray more than two standard errors from the truth. "Give or take 3" is about right. This lesson makes that precise.
      `,
    },
    {
      id: 'teach-interval',
      type: 'info',
      title: 'Estimate, plus or minus a margin',
      text: r`
        An **interval estimate** is a range instead of a single number:

        $$ \text{estimate} \pm \text{margin} $$

        In the last lesson, about 95% of sample averages landed within **2 standard errors** of the true mean. So use 2 standard errors as the margin. (The standard error is the SD divided by $\sqrt{n}$.)

        :::example
        A baker weighs a random sample of **81 loaves**: average **400 g**, SD **18 g**.

        1. Standard error: $18 \div \sqrt{81} = 18 \div 9 = 2$ g.
        2. Margin: $2 \times 2 = 4$ g.
        3. Interval: from $400 - 4 = 396$ g to $400 + 4 = 404$ g.
        :::
      `,
      figure: rain({
        mean: 400, sd: 18, n: 81, unit: 'g', fixed: [[400, 2]], truth: false, y: [392, 408],
        caption: 'The baker\'s interval: the dot is the estimate, 400 g, and the bar reaches one margin, 4 g, either side.',
        alt: 'A single vertical interval from 396 to 404 grams, with a dot at the sample average of 400 grams.',
      }),
    },
    {
      id: 'build-one',
      type: 'fill',
      title: 'Your turn: her interval',
      text: `
        Now build the interval for the researcher's sample: **64 commuters**, average **41 minutes**, SD **12 minutes**. Use 2 standard errors as the margin.
      `,
      template: r`
        Standard error: $12 \div \sqrt{64} =$ [[1.5]] minutes.

        Margin: $2 \times 1.5 =$ [[3]] minutes.

        Interval: from [[38]] to [[44]] minutes.
      `,
      hints: [r`$\sqrt{64} = 8$.`, 'Subtract the margin from 41 for the lower end, and add it for the upper end.'],
      explain: r`
        $\text{SE} = 12 \div 8 = 1.5$. The margin is $2 \times 1.5 = 3$, so the interval runs from $41 - 3 = 38$ to $41 + 3 = 44$ minutes. (The 2 is a rule of thumb for samples of about 30 or more. Small samples need a slightly bigger multiplier.)

        How far can a range like this be trusted? Try it and see.
      `,
    },
    {
      id: 'rain',
      type: 'interact',
      graded: false,
      title: 'A hundred researchers',
      text: `
        Suppose you could see the truth: this city's real average is **40 minutes**, the dashed line. Each press sends out a new researcher, who asks 64 random commuters and builds her interval exactly as you just did.

        **Draw 100 intervals.** How many of them catch the true mean?
      `,
      widget: rain({ buttons: [1, 10, 100], alt: 'An empty chart with a dashed line at 40 minutes. Each sample adds a vertical interval; intervals that miss the line are red and flagged under the axis.' }),
      check: (s) => s.count >= 100 || `${s.count} ${s.count === 1 ? 'interval' : 'intervals'} so far. Draw until the picture is full: 100.`,
      solution: { count: 100 },
      explain: `
        Most intervals cross the dashed line. A few, drawn in red and flagged under the axis, miss it completely. Press Reset and run it again: the count changes a little, but it stays **close to 95 out of 100**.

        The researchers who missed did nothing wrong. They simply drew an unlucky sample.
      `,
    },
    {
      id: 'meaning',
      type: 'info',
      title: 'What "95% confident" means',
      text: `
        An interval built as *estimate ± 2 standard errors* is called a **95% confidence interval**.

        :::key
        "95% confident" describes the **method**: used on sample after sample, it produces intervals that contain the true value about 95% of the time.
        :::

        In real life there is no dashed line. You get **one** sample and **one** interval, and you cannot tell whether yours is one of the 95 hits or one of the 5 misses. The true mean is one fixed number: your interval either contains it or does not. What you know is the method's track record.

        "95% confident" is easily bent into things it does not say. The next three questions are about the three most common ways.
      `,
      figure: rain({
        fixed: RAIN,
        caption: 'One hundred intervals from the same method. Here 94 caught the true mean and 6, in red, missed it.',
        alt: 'One hundred intervals around a dashed line at 40 minutes. Ninety-four cross the line; six, drawn in red and flagged under the axis, miss it.',
      }),
    },
    {
      id: 'not-the-data',
      type: 'choice',
      title: 'Misreading 1',
      text: `
        Her sample of 64 commuters had an average of 41 minutes and an SD of 12 minutes. Her 95% confidence interval is **38 to 44 minutes**.

        A colleague reads the report and says: *"So 95% of commuters take between 38 and 44 minutes."* **Is that right?**
      `,
      columns: 1,
      options: [
        { text: 'No: the interval is about the city\'s average, not about individual commuters', correct: true },
        { text: 'Yes: that is what a 95% interval means', why: 'Commute times have an SD of about 12 minutes, so individual commuters are spread over something like 17 to 65 minutes. The interval 38 to 44 says where the city\'s *average* lies.' },
        { text: 'It is true of the 64 people in the sample, though not of the city', why: 'Not even of them. Their 64 times have an SD of 12 minutes, so most of them lie *outside* 38 to 44.' },
      ],
      explain: r`
        This is the two spreads again. The range that holds about 95% of *commuters* is $41 \pm 2 \times 12$: from 17 to 65 minutes. The confidence interval is $41 \pm 2 \times 1.5$, and it says where the *mean* is. In fact only about one commuter in five takes between 38 and 44 minutes.

        Ask four times as many people and the interval halves in width. The spread of commuters stays as it is.
      `,
    },
    {
      id: 'not-the-next',
      type: 'choice',
      title: 'Misreading 2',
      text: `
        A hundred researchers again. The first one got the interval **39.1 to 45.5** (violet), stretched across the picture as a band. It does contain the true mean, 40.

        *"So there is a 95% chance that the next sample's average falls inside my interval,"* she says. The dots show where the other 99 averages landed. **Was she right?**
      `,
      figure: rain({ fixed: RAIN, band: 0, alt: 'One hundred intervals. The first, from 39.1 to 45.5, is stretched into a band across the chart. 73 of the other 99 sample averages lie inside the band; the rest lie below it.' }),
      columns: 1,
      options: [
        { text: 'No: only 73 of the other 99 averages fell inside her interval', correct: true },
        { text: 'Yes: about 95 of the 99 dots are inside the band', why: 'Look again, or read the tally above the picture: 73 of the other 99. A good many dots lie below the band.' },
        { text: 'Yes: her interval caught the true mean, so it will catch 95% of future averages too', why: 'Catching the true mean is one thing; catching other samples\' averages is another. Her interval sits off-centre, so many of the other averages fall below it.' },
      ],
      explain: `
        Her interval is centred on *her* average, 42.3, which happened to come out a little high. Other samples' averages scatter around the true mean, 40, and many land below her band.

        A confidence interval is built to catch the **true value**. It promises nothing about the next sample's average. (Taken over all the first samples she might have drawn, the next average lands inside a 95% interval only about 84% of the time.)
      `,
    },
    {
      id: 'careful-statement',
      type: 'choice',
      title: 'Misreading 3: the subtle one',
      text: `
        Twenty researchers, twenty intervals. Researcher 14 (red) can no more see the dashed line than the others can. She announces: *"There is a 95% probability that the true mean lies in my interval."*

        **What is the trouble with that sentence?**
      `,
      figure: rain({ fixed: RAIN.slice(0, 20), alt: 'Twenty intervals around a dashed line at 40. Nineteen contain the line. Interval 14, in red, runs from about 32 to 38 and misses it.' }),
      columns: 1,
      options: [
        { text: 'The true mean is one fixed number: her interval either contains it or does not. The 95% is the success rate of the method', correct: true },
        { text: 'Nothing: each of the twenty intervals has a 95% chance of containing the true mean', why: 'Look at interval 14: the true mean is plainly outside it. *Before* the samples were drawn, each researcher had a 95% chance of ending up with an interval that works. Afterwards, each interval simply does or does not.' },
        { text: 'She should say 5%, because her interval missed', why: 'She cannot see the dashed line, so she does not know that she missed, and the other nineteen do not know that they hit. From the sample alone, nobody can name the probability for one particular interval.' },
      ],
      explain: `
        Once the sample is in, nothing is random any more. Nineteen of these intervals contain the truth and one does not, and from the inside they all look alike. So statisticians say "I am 95% **confident**", meaning: *I used a method that works 95% of the time.*

        Hair-splitting? Often "probably in there" does no harm. It matters when you know something else. If ten earlier surveys all found about 40 minutes and a new one reports 32 to 38, you would not believe it 95%: you would suspect an unlucky sample. To put a probability on a claim you also need what was known beforehand: the base rate from *The Base Rate Trap*. It returns in the next lesson.
      `,
    },
    {
      id: 'width-explore',
      type: 'interact',
      title: 'Wider or narrower?',
      text: `
        Two dials set the width of an interval. **Confidence** decides how many standard errors go into the margin: 1 for 68%, 2 for 95%, 3 for 99.7%. **Sample size** decides how big a standard error is.

        The researcher wants margins of **± 1.5 minutes or less**, from a method that still catches the truth about **95%** of the time. **Find the settings, then draw 100 intervals.**
      `,
      widget: rain({ sizes: [16, 64, 256], levels: [68, 95, 99.7], buttons: [10, 100], y: [30, 50], alt: 'The interval chart with buttons for the confidence level (68, 95 or 99.7 percent) and the sample size (16, 64 or 256).' }),
      check: (s) => {
        if (s.level === 68 && s.margin <= 1.5) return 'Narrow enough, but at 68% confidence about a third of the intervals miss. Go back to 95% and find another way to shrink them.';
        if (s.level === 68) return 'At 68% confidence about a third of the intervals miss. The task asks for 95%.';
        if (s.level > 95) return 'At 99.7% almost nothing misses, but the margin is 3 standard errors: wider, not narrower. The task asks for 95%.';
        if (s.margin > 1.5) return `At 95% with samples of ${s.n}, a typical margin is ± ${num(s.margin)} minutes. Too wide: what else can you change?`;
        if (s.count < 100) return `Those are the right settings. Now draw 100 intervals to see them at work (${s.count} so far).`;
        return true;
      },
      solution: { n: 256, level: 95, count: 100 },
      hints: ['The margin is 2 standard errors at 95%. Which dial makes a standard error smaller?', r`With samples of 256 the standard error is $12 \div \sqrt{256} = 0.75$ minutes.`],
      explain: r`
        Samples of 256 at 95%: the standard error is $12 \div \sqrt{256} = 0.75$, so the margin is $2 \times 0.75 = 1.5$ minutes.

        Dropping to 68% with samples of 64 also gives ± 1.5, but then about one interval in three misses. **More confidence costs width. More data buys it back**, at the usual price: four times the sample for half the width.
      `,
    },
    {
      id: 'teach-width',
      type: 'info',
      title: 'What sets the width',
      text: `
        Both dials sit in one formula.

        :::key
        margin = (number of standard errors) × SD ÷ √n
        :::

        | Confidence | Standard errors | Margin if the SE is 1.5 min |
        |---|:---:|:---:|
        | 68% | 1 | ± 1.5 min |
        | 95% | 2 | ± 3 min |
        | 99.7% | 3 | ± 4.5 min |

        - **More confidence** takes more standard errors: a wider net.
        - **More data** shrinks each standard error: four times the sample, half the width. More varied data (a larger SD) does the opposite.
        - The size of the *population* is not in the formula at all. It is the spoonful and the cauldron from [A Spoonful of Soup](#/learn/statistics/sampling): what counts is the size of the sample.
      `,
    },
    {
      id: 'tradeoff',
      type: 'bucket',
      text: 'A 95% confidence interval for an average has been worked out. **What would each change do to its width?**',
      buckets: ['Wider', 'Narrower', 'About the same'],
      items: [
        { text: 'Ask for 99.7% confidence instead of 95%', bucket: 0, why: 'Three standard errors either side instead of two. To be surer of catching the truth, you cast a wider net.' },
        { text: 'Settle for 68% confidence', bucket: 1, why: 'One standard error either side: narrower, but it misses about a third of the time.' },
        { text: 'Use a sample four times as large', bucket: 1, why: 'The standard error halves, and the width with it.' },
        { text: 'The measurements turn out more varied (a larger SD)', bucket: 0, why: 'The standard error is the SD divided by √n: more varied data, wider interval.' },
        { text: 'Same sample size, drawn from a country ten times as big', bucket: 2, why: 'The spoonful and the cauldron: the size of the population hardly matters. What counts is the size of the sample.' },
        { text: 'Use a smaller sample', bucket: 0, why: 'Less data, a larger standard error, a wider interval.' },
      ],
      explain: 'More confidence raises the number of standard errors, more varied data raises the SD, and a bigger sample shrinks the whole margin. The size of the population does not appear in the formula at all.',
    },
    {
      id: 'ci-calc',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const c = sampleOf(rng);
        return {
          text: `
            A random sample of **${c.n} ${c.items}** has an average ${c.measure} of **${num(c.m)} ${c.unit}** and a standard deviation of **${num(c.sd)} ${unitFor(c.sd, c.unit)}**.

            Build the 95% confidence interval for the true average: estimate ± 2 standard errors, where a standard error is the SD divided by √n.
          `,
          template: `
            Standard error: [[${num(c.se)}]] ${c.unit}.

            95% confidence interval: from [[${num(c.lo)}]] to [[${num(c.hi)}]] ${c.unit}.
          `,
          hints: [
            r`$\text{SE} = \text{SD} \div \sqrt{n} = ${num(c.sd)} \div ${c.root}$.`,
            `The margin is 2 × ${num(c.se)} = ${num(2 * c.se)}. Take it off ${num(c.m)}, then add it on.`,
          ],
          explain: r`
            $\text{SE} = ${num(c.sd)} \div \sqrt{${c.n}} = ${num(c.se)}$ ${unitFor(c.se, c.unit)}, so the margin is $2 \times ${num(c.se)} = ${num(2 * c.se)}$.
            The interval runs from $${num(c.m)} - ${num(2 * c.se)} = ${num(c.lo)}$ to $${num(c.m)} + ${num(2 * c.se)} = ${num(c.hi)}$ ${c.unit}.
          `,
        };
      },
    },
    {
      id: 'teach-polls',
      type: 'info',
      title: 'Polls: an interval for a percentage',
      text: r`
        A poll estimates a **percentage**, and that too comes with a 95% margin. For a result not too far from 50% there is a shortcut: the margin is about $1 \div \sqrt{n}$ as a fraction, where $n$ is the number of people asked. It is where the table in [A Spoonful of Soup](#/learn/statistics/sampling) came from.

        :::example
        A poll of **900** people finds **56%** in favour of a plan.

        1. Margin: $1 \div \sqrt{900} = 1 \div 30 \approx 0.033$, or about 3.3 percentage points.
        2. Interval: from $56 - 3.3 = 52.7\%$ to $56 + 3.3 = 59.3\%$.
        3. Reading: the whole interval lies above 50%, so the poll backs "most people are in favour". An interval that reached both sides of 50% would be too close to call, and one wholly below 50% would speak against the claim.
        :::

        A confidence interval is the set of values the data leave plausible.
      `,
    },
    {
      id: 'poll-margin',
      type: 'numeric',
      review: true,
      title: 'Polls',
      gen: (rng) => {
        const root = rng.pick([20, 25, 40, 50, 100]);
        const n = root * root;
        const answer = round(100 / root, 2);
        return {
          text: r`
            A poll estimates a **percentage**, and that too comes with a 95% margin. For a result not too far from 50% there is a shortcut:

            $$ \text{margin} \approx \frac{1}{\sqrt{n}} $$

            as a fraction, where $n$ is the number of people asked. With 100 people that is $\frac{1}{10}$, or 10 percentage points.

            A poll asks **${thousands(n)}** people chosen at random. **About how big is its margin of error, in percentage points?**
          `,
          answer,
          unit: 'points',
          tolerance: 0.05,
          wrong: [
            [round(1 / root, 4), `As a fraction, yes. In percentage points that is ${num(answer)}.`],
            [root, r`That is $\sqrt{n}$ itself. Take 1 divided by it, then turn the fraction into percentage points.`],
          ],
          hints: [r`$\sqrt{${n}} = ${root}$.`, r`$1 \div ${root} = ${num(1 / root)}$. As a percentage?`],
          explain: r`
            $\sqrt{${n}} = ${root}$, so the margin is about $\frac{1}{${root}} = ${num(1 / root)}$: **${num(answer)} percentage ${answer === 1 ? 'point' : 'points'}**.

            This is where the table in *A Spoonful of Soup* came from. A typical national poll asks about 1,000 people, and $1 \div \sqrt{1000} \approx 0.03$: the familiar "± 3 points".
          `,
        };
      },
    },
    {
      id: 'poll-read',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const poll = rng.pick(POLLS);
        const kind = rng.pick(['above', 'straddle', 'below']);
        const e = rng.pick(poll[kind]);
        const plan = rng.pick(PLANS);
        const lo = num(e - poll.m);
        const hi = num(e + poll.m);
        const range = `The interval runs from ${lo}% to ${hi}%.`;
        const option = (key, text, why) => (key === kind ? { text, correct: true } : { text, why });
        return {
          text: `
            A poll of ${thousands(poll.n)} randomly chosen residents finds that **${e}%** support ${plan}. Its margin of error is ± ${num(poll.m)} points, at 95% confidence.

            A councillor claims: *"Most residents support it."* **What does the poll say about that claim?**
          `,
          shuffle: false,
          columns: 1,
          options: [
            option('above', 'It backs the claim: the whole interval lies above 50%', `${range} ${kind === 'below' ? 'All of it is below 50%.' : 'Part of it is below 50%, so support from fewer than half the residents is still a plausible reading.'}`),
            option('straddle', 'Too close to call: the interval reaches both sides of 50%', `${range} All of it lies ${kind === 'above' ? 'above' : 'below'} 50%, so the poll does point one way.`),
            option('below', 'It contradicts the claim: the whole interval lies below 50%', `${range} ${kind === 'above' ? 'All of it is above 50%.' : 'Part of it is above 50%, so a majority is still a plausible reading.'}`),
            { text: `Nothing: ${thousands(poll.n)} people cannot speak for a whole town`, why: `A random sample of ${thousands(poll.n)} pins the figure down to within about ${num(poll.m)} points. That is enough to say something.` },
          ],
          hints: [`Work out the two ends of the interval: ${e} − ${num(poll.m)} and ${e} + ${num(poll.m)}. Where is 50%?`],
          explain: `
            ${range} A confidence interval is the set of values the data leave plausible.
            ${kind === 'above' ? 'Every one of them is above 50%, so the poll supports the councillor.' : kind === 'below' ? 'Every one of them is below 50%, so the poll speaks against the councillor.' : 'Some are below 50% and some above, so this poll cannot settle whether a majority is in favour.'}
          `,
        };
      },
    },
    {
      id: 'meaning-review',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const c = sampleOf(rng);
        const range = `${num(c.lo)} and ${num(c.hi)} ${c.unit}`;
        return {
          text: `
            A study of ${c.n} ${c.items} reports: *"average ${c.measure} ${num(c.m)} ${c.unit}; 95% confidence interval ${num(c.lo)} to ${num(c.hi)}."*

            **Which is a correct reading of that interval?**
          `,
          columns: 1,
          options: [
            { text: 'It was made by a method that captures the true average in about 95% of samples', correct: true },
            { text: `About 95% of ${c.items} have a ${c.measure} between ${range}`, why: `That would be a statement about individual ${c.items}, and they vary far more than this. The interval is about their *average*.` },
            { text: `If the study were repeated, there is a 95% chance that the new average would fall between ${range}`, why: 'The interval is built to catch the *true* average. A new sample\'s average lands inside an earlier interval noticeably less often than 95% of the time.' },
            { text: `The true average moves about, and 95% of the time it is between ${range}`, why: 'The true average is one fixed number. It is the *interval* that changes from sample to sample.' },
          ],
          explain: `
            The 95% belongs to the method: over many samples, about 95% of the intervals it produces contain the true average. This particular interval, ${num(c.lo)} to ${num(c.hi)}, either does or does not.
            It says nothing direct about individual ${c.items}, nor about where the next sample's average will fall.
          `,
        };
      },
    },
  ],
  recap: [
    'An **interval estimate** is *estimate ± margin*. For 95% confidence the margin is about 2 standard errors.',
    '"95% confident" is about the **method**: it catches the true value in about 95% of samples. One given interval either contains the truth or does not.',
    'It is not the range of the data, and not a prediction of the next sample\'s average.',
    'More confidence makes an interval wider; more data makes it narrower. A poll of $n$ people has a margin of roughly $1 \\div \\sqrt{n}$.',
  ],
  next: 'Next: someone makes a claim. How do you decide whether the data back it, or whether it could just be chance?',
};
