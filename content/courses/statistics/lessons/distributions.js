// Data & Statistics · Lesson 3 · The Shape of Data
import { r, num } from '../../../kit.js';
import { JOURNEYS, HEIGHTS, INCOMES, QUIZ } from '../helpers.js';

// All four data sets are invented (see helpers.js). Numbers quoted below were computed from them.
const journeys = (extra) => ({ type: 'histogram-lab', data: JOURNEYS, min: 0, max: 45, xStep: 5, unit: 'min', ...extra });
const heights = (extra) => ({ type: 'histogram-lab', data: HEIGHTS, min: 140, max: 190, width: 5, xStep: 10, ...extra });
const incomes = (extra) => ({ type: 'histogram-lab', data: INCOMES, min: 0, max: 160, width: 10, xStep: 20, ...extra });
const quiz = (extra) => ({ type: 'histogram-lab', data: QUIZ, min: 40, max: 100, width: 5, xStep: 10, ...extra });

export default {
  id: 'distributions',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'One question, two pictures',
      text: `
        A school asked 160 students how many minutes their journey took this morning. (The data is invented.)
        Two students each drew a chart of the answers.

        **Could both charts show the same 160 answers?**
      `,
      figure: [
        journeys({ width: 15, height: 190, xStep: 15, caption: 'Ana’s chart', alt: 'A chart with three wide bars: 50, 68 and 42 students. One hump.' }),
        journeys({ width: 3, height: 190, xStep: 15, caption: 'Ben’s chart', alt: 'A chart with fifteen narrow bars forming two separate humps.' }),
      ],
      shuffle: false,
      options: [
        { text: 'Yes', correct: true },
        { text: 'No: one has a single hump, the other has two' },
      ],
      explain: `
        Same 160 journeys, both times. Ana sorted them into three wide groups, each covering 15 minutes. Ben used fifteen narrow groups of 3 minutes.

        Neither chart is wrong. But only one of them shows what is really going on, and you are about to find out why.
      `,
    },
    {
      id: 'explore-bins',
      type: 'interact',
      graded: false,
      title: 'Your turn to draw it',
      text: `
        Here are the same 160 journeys. Each small tick under the axis is one student.
        Right now every student is in a single bar, 45 minutes wide.

        **Drag the bin width from one end to the other.** Then leave it where the two groups of students show most clearly.
      `,
      widget: journeys({
        widths: [1, 3, 5, 9, 15, 45], width: 45, rug: true, show: ['mean'], xLabel: 'journey time (minutes)',
        alt: 'Histogram of 160 journey times with a slider that changes the bin width.',
      }),
      check: (s) => {
        if (s.width === 3 || s.width === 5) return true;
        if (s.width === 1) return 'With bins this narrow, each bar holds only a few students, and chance bumps start to look like peaks. Widen the bins a little.';
        if (s.width === 9) return 'You can just make out two groups, but five bars give a crude picture. Go one notch narrower.';
        return 'With bins this wide, the two groups melt into one. Narrow the bins.';
      },
      solution: { width: 5 },
      explain: `
        Somewhere in the middle, two groups appear: students who walk or cycle (around 14 minutes) and students who come by bus (around 30).
        Too wide, and the groups merge. Too narrow, and the picture dissolves into noise.

        Look where the mean is: about 22 minutes, in the gap *between* the groups. Only 5 of the 160 students took between 21 and 23 minutes. An average can describe nobody at all.
      `,
    },
    {
      id: 'name-it',
      type: 'info',
      title: 'Reading a histogram',
      text: `
        A **histogram** chops the number line into equal intervals called **bins**, and draws a bar over each one.
        The height of a bar is the number of values that fall in that bin.

        :::example Reading one bar
        Here the bins are 5 minutes wide. The tallest bar stands over 10 to 15 and reaches 41 on the side axis: **41 students** took between 10 and 15 minutes.
        :::

        The bin width is the drawer's choice, and it changes the picture:

        - **Too wide:** the shape is hidden inside a few fat bars.
        - **Too narrow:** every bar holds a handful of values, and chance bumps look like features.
        - **In between:** the real shape shows.
      `,
      figure: journeys({
        width: 5, height: 260, xLabel: 'journey time (minutes)',
        alt: 'Histogram of the 160 journey times in bins 5 minutes wide. The bar from 10 to 15 minutes is the tallest, at 41 students; a second, lower hump peaks at 32 students between 30 and 35 minutes.',
        caption: 'The 160 journeys in bins of 5 minutes. Read a bar’s height on the side axis.',
      }),
    },
    {
      id: 'bins-review',
      type: 'choice',
      review: true,
      text: `
        Two histograms of the **same data set** look different. One shows a single broad hump. The other shows two separate peaks.

        What is the most likely reason?
      `,
      options: [
        { text: 'They use different bin widths', correct: true },
        { text: 'One of them contains a mistake', why: 'Both can be drawn correctly. Wide bins can swallow a gap that narrower bins reveal.' },
        { text: 'One shows the mean, the other the median', why: 'A histogram shows how many values fall in each bin. It does not plot averages.' },
        { text: 'The second one has fewer values', why: 'It is the same data set, so both charts contain every value.' },
      ],
      columns: 1,
      explain: 'Wide bins can merge two groups into one hump. The bin width is a choice, so one histogram is never the whole story: try a few widths before you describe the shape.',
    },
    {
      id: 'teach-shapes',
      type: 'info',
      title: 'Shapes have names',
      text: `
        Step back from the bars and look at the outline.

        - **Symmetric:** one hump that falls away evenly on both sides.
        - **Skewed:** one long tail. The skew is named after the side the *tail* is on, not the peak.
        - **Two peaks** (the technical word is **bimodal**): two different groups mixed together, like the walkers and the bus riders.

        A tail grows where the values have room to run. Marks crowded against a maximum can only trail off to the left. Values with a floor near zero and no ceiling trail off to the right.
      `,
      figure: [
        heights({ height: 190, caption: 'Symmetric', alt: 'A symmetric hump: tallest in the middle, falling away evenly on both sides.' }),
        quiz({ height: 190, caption: 'Skewed left: the tail points left', alt: 'Tall bars on the right, with a long tail of low bars stretching to the left.' }),
        journeys({ width: 3, height: 190, xStep: 15, caption: 'Two peaks', alt: 'Two separate humps with a dip between them.' }),
      ],
    },
    {
      id: 'skew-right',
      type: 'choice',
      text: `
        Remember: the skew is named after the side the *tail* is on.

        **Which of these is skewed to the right?**
      `,
      columns: 1,
      options: [
        { text: '', correct: true, figure: incomes({ height: 120, alt: 'Tall bars on the left, then a long tail of low bars stretching to the right.' }) },
        { text: '', figure: quiz({ height: 120, alt: 'Tall bars on the right, with a long tail of low bars stretching to the left.' }), why: 'The name follows the tail, not the peak. This tail points to the left, so it is skewed to the *left*.' },
        { text: '', figure: heights({ height: 120, alt: 'A symmetric hump: tallest in the middle, falling away evenly on both sides.' }), why: 'This one is symmetric: both sides fall away evenly, so there is no skew.' },
      ],
      explain: `
        Skewed **right** means the long tail stretches to the right, towards high values, even though the peak sits on the left.

        The other two shapes are skewed **left** (tail towards low values) and **symmetric** (no tail longer than the other).
      `,
    },
    {
      id: 'shapes-match',
      type: 'match',
      text: 'What shape would you expect? Match each data set with the most likely shape of its histogram.',
      pairs: [
        ['Heights of adult women', 'Symmetric hump'],
        ['Incomes of everyone in a town', 'Skewed right'],
        ['Marks on a very easy quiz', 'Skewed left'],
        ['Journey times of walkers and bus riders together', 'Two peaks'],
      ],
      explain: `
        Incomes have a floor near zero but no ceiling, so the tail runs to the right. On an easy quiz most marks crowd against the maximum, so the tail runs to the left.
        Heights have no such wall on either side, and mixing two different groups gives two peaks.
      `,
    },
    {
      id: 'find-median',
      type: 'interact',
      title: 'Where is the middle?',
      text: `
        Here are the yearly incomes of 300 people in a made-up town, in thousands of dollars.

        **Drag the marker until half of the people are on each side of it.**
      `,
      widget: incomes({
        guess: { value: 70, step: 0.5 }, reveal: ['mean'], xLabel: 'income (thousands of dollars)',
        alt: 'Histogram of 300 incomes, skewed to the right, with a draggable marker on the axis.',
      }),
      check: (s) => {
        if (Math.abs(s.below - 50) <= 2.5) return true;
        return s.below > 50
          ? `${Math.round(s.below)}% of the people are to the left of the marker. That is more than half: move it left.`
          : `Only ${Math.round(s.below)}% of the people are to the left of the marker. Move it right.`;
      },
      solution: { guess: 36.5 },
      hints: ['Forget the height of the bars for a moment and watch the two percentages under the chart. You want them both at 50.'],
      explain: `
        Your marker is at the **median**, about 36.5: half the town earns less, half earns more.

        The orange line that just appeared is the **mean**, about 41. The long tail of high incomes drags it to the right of the median, just as one rich customer drags the mean income of a café.
      `,
    },
    {
      id: 'teach-tail',
      type: 'info',
      title: 'The mean follows the tail',
      text: r`
        In the town, the long tail of high incomes dragged the mean (about 41) above the median (about 36.5). A tail on the other side drags the mean the other way.

        :::example
        Five quiz marks: 2, 8, 9, 9, 10. The one low mark is a tail on the **left**.

        - Median: the middle value, **9**.
        - Mean: $38 \div 5 = 7.6$, which is *below* the median.
        :::

        :::key
        **The mean is dragged towards the tail.** Tail on the right: mean above the median. Tail on the left: mean below it. No tail: the two are about the same.
        :::
      `,
      figure: {
        type: 'dot-plot', min: 0, max: 10, values: [2, 8, 9, 9, 10], rows: 3,
        alt: 'Five draggable dots at 2, 8, 9, 9 and 10. The pivot marking the mean is at 7.6, to the left of the flag marking the median at 9.',
        caption: 'The pivot is the mean, the flag is the median. Drag the dots to build a tail on the right instead, and watch the pivot cross over.',
      },
    },
    {
      id: 'mean-vs-median',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          {
            what: 'the yearly incomes of 300 people in one town', figure: incomes({ height: 200, xLabel: 'income (thousands of dollars)', alt: 'A histogram with its peak on the left and a long tail to the right.' }), answer: 0,
            why: 'The long tail of high values on the right pulls the mean up, but hardly moves the median. Here the mean is about 41 and the median about 36.5.',
          },
          {
            what: 'the marks of 200 students on an easy quiz', figure: quiz({ height: 200, xLabel: 'marks out of 100', alt: 'A histogram with its peak on the right and a long tail to the left.' }), answer: 1,
            why: 'The long tail of low marks on the left pulls the mean down, but hardly moves the median. Here the mean is about 86 and the median about 88.',
          },
          {
            what: 'the heights of 400 adult women', figure: heights({ height: 200, xLabel: 'height (cm)', alt: 'A symmetric, bell-shaped histogram.' }), answer: 2,
            why: 'The shape is symmetric, so there is no long tail to pull the mean to one side. Here both are about 165 cm.',
          },
        ]);
        const wrong = [
          'The mean is pulled towards the long tail, and this tail is on the other side.',
          'The mean is pulled towards the long tail, and this tail is on the other side.',
          'Look for a long tail. The mean follows it; the median stays with the bulk of the data.',
        ];
        const texts = ['The mean is larger than the median', 'The mean is smaller than the median', 'They are about the same'];
        return {
          text: `This histogram shows ${scene.what} (invented data). Without calculating: **how do its mean and median compare?**`,
          figure: scene.figure,
          shuffle: false,
          hints: ['Look for a long tail. If there is one, the extreme values out there pull on the mean, but not on the median.'],
          options: texts.map((text, i) => (i === scene.answer
            ? { text, correct: true }
            : { text, why: scene.answer === 2 ? 'There is no long tail here to pull the mean away from the median.' : wrong[i] })),
          explain: `${scene.why}\n\nThe rule of thumb: **the mean is dragged towards the tail.** No tail, no difference.`,
        };
      },
    },
    {
      id: 'bell',
      type: 'interact',
      title: 'The bell curve',
      text: `
        Many measurements pile up around their mean and thin out evenly on both sides. Adult heights are a classic example.
        Here are the heights of 400 women (invented, but realistic). The smooth line is the **normal curve**, also called the bell curve.

        The shaded band reaches one standard deviation (SD) either side of the mean. **Widen the band until it holds about 95% of the women.**
      `,
      widget: heights({
        width: 2, curve: true, band: 1, bandSlider: true, show: ['mean'], unit: 'cm', xLabel: 'height (cm)',
        alt: 'Bell-shaped histogram of 400 heights with a normal curve drawn over it and a shaded band around the mean.',
      }),
      check: (s) => {
        if (s.band === 2) return true;
        return s.band < 2
          ? `This band holds only about ${Math.round(s.inside)}% of the women. Widen it.`
          : `This band holds ${num(s.inside, 1)}% of the women: nearly everyone. Narrow it a little.`;
      },
      solution: { band: 2 },
      explain: `
        Two standard deviations either side of the mean hold about 95% of these women.
        One SD holds only about two thirds of them, and three SDs hold nearly everyone.
      `,
    },
    {
      id: 'teach-rule',
      type: 'info',
      title: 'The 68–95–99.7 rule',
      text: r`
        What you just found is not special to heights. For bell-shaped data, the same three numbers turn up again and again:

        - about **68%** of the values lie within 1 SD of the mean,
        - about **95%** lie within 2 SDs,
        - about **99.7%** lie within 3 SDs.

        :::example
        Here the mean is about 165.3 cm and the SD about 7.2 cm, so roughly 95% of these women are between 151 and 180 cm tall.
        That is $165.3 - 2 \times 7.2$ and $165.3 + 2 \times 7.2$, rounded to whole centimetres.
        :::
      `,
      figure: heights({
        width: 2, curve: true, band: 2, bandSlider: true, show: ['mean'], unit: 'cm', xLabel: 'height (cm)',
        alt: 'The bell-shaped histogram of 400 heights with the normal curve. The shaded band reaches two standard deviations either side of the mean, from about 151 to 180 cm.',
        caption: 'Step the band through 1, 2 and 3 SDs and read the share of the women inside it.',
      }),
    },
    {
      id: 'rule-apply',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { what: 'The lifetimes of a brand of light bulb', unit: 'hours', means: [900, 1000, 1200], sds: [40, 50, 60] },
          { what: 'The weights of apples from one orchard', unit: 'grams', means: [150, 160, 180], sds: [10, 12, 15] },
          { what: 'The times in which runners finish a 5 km fun run', unit: 'minutes', means: [28, 30, 32], sds: [3, 4] },
          { what: 'The amounts a machine pours into 500 ml bottles', unit: 'ml', means: [500, 502, 505], sds: [2, 3, 4] },
        ]);
        const m = rng.pick(scene.means);
        const sd = rng.pick(scene.sds);
        return {
          text: `
            For bell-shaped data, about 68% of the values lie within 1 standard deviation of the mean, and about 95% within 2.

            ${scene.what} are roughly bell-shaped, with a **mean of ${m}** ${scene.unit} and a **standard deviation of ${sd}** ${scene.unit}.
          `,
          template: `About 68% lie between [[${m - sd}]] and [[${m + sd}]] ${scene.unit}. About 95% lie between [[${m - 2 * sd}]] and [[${m + 2 * sd}]] ${scene.unit}.`,
          hints: [`One standard deviation below the mean is ${m} − ${sd}.`, `For 95%, go two standard deviations each way: ${m} − ${2 * sd} and ${m} + ${2 * sd}.`],
          explain: `
            One SD either side: $${m} - ${sd} = ${m - sd}$ and $${m} + ${sd} = ${m + sd}$.
            Two SDs either side: $${m} - ${2 * sd} = ${m - 2 * sd}$ and $${m} + ${2 * sd} = ${m + 2 * sd}$.
          `,
        };
      },
    },
    {
      id: 'example-tail',
      type: 'info',
      title: 'Worked example: one tail',
      text: r`
        The rule tells you what is *inside* a band. Whatever is outside is split equally between the two tails, because a bell is symmetric.

        :::example
        About what percentage of the women are taller than 187 cm?

        1. 187 cm is 3 SDs above the mean: $165.3 + 3 \times 7.2 \approx 187$.
        2. About 99.7% lie within 3 SDs, so $100 - 99.7 = 0.3$% lie outside.
        3. Half of those are in the upper tail: $0.3 \div 2 = 0.15$%.
        :::
      `,
      figure: heights({
        width: 2, curve: true, band: 3, bandSlider: true, show: ['mean'], unit: 'cm', xLabel: 'height (cm)',
        alt: 'The bell-shaped histogram of heights with a shaded band three standard deviations either side of the mean, from about 144 to 187 cm. Almost nothing lies outside it, and the tiny tails on the left and right are the same size.',
        caption: 'At 3 SDs almost nothing is left outside. Step down to 2 and 1: the two unshaded tails grow, and they always match.',
      }),
    },
    {
      id: 'tail',
      type: 'numeric',
      stretch: true,
      gen: (rng) => {
        const scene = rng.pick([
          { what: 'The marks on a national exam', unit: 'marks', m: 60, sd: 10 },
          { what: 'The heights of the trees in a plantation', unit: 'm', m: 20, sd: 3 },
          { what: 'The lifetimes of a brand of battery', unit: 'hours', m: 40, sd: 4 },
          { what: 'The weights of the eggs from one farm', unit: 'g', m: 60, sd: 5 },
        ]);
        const k = rng.pick([1, 2]);
        const above = rng.bool();
        const cut = scene.m + (above ? 1 : -1) * k * scene.sd;
        const inside = k === 1 ? 68 : 95;
        const answer = (100 - inside) / 2;
        return {
          text: `
            ${scene.what} are bell-shaped, with a mean of ${scene.m} ${scene.unit} and a standard deviation of ${scene.sd} ${scene.unit}.

            Using the 68–95–99.7 rule: **about what percentage are ${above ? 'above' : 'below'} ${cut} ${scene.unit}?**
          `,
          answer,
          unit: '%',
          tolerance: 0.05,
          wrong: [
            [100 - inside, `${100 - inside}% is everything outside the band: both tails together. You only want the ${above ? 'upper' : 'lower'} one.`],
            [inside, `${inside}% is the share *inside* the band. The question asks about one of the tails outside it.`],
            [(100 - inside) / 2 + inside, `That is everything ${above ? 'below' : 'above'} ${cut}. The question asks for the other side.`],
          ],
          hints: [
            `${cut} is ${k === 1 ? 'one standard deviation' : 'two standard deviations'} ${above ? 'above' : 'below'} the mean. What share of the data lies within ${k} SD of the mean?`,
            `${inside}% are inside the band, so ${100 - inside}% are outside it. The bell is symmetric, so the two tails are equal.`,
          ],
          explain: `
            ${cut} is ${k} SD ${above ? 'above' : 'below'} the mean. About ${inside}% of the values lie within ${k} SD, leaving ${100 - inside}% outside.
            A bell is symmetric, so half of that is in each tail: $${100 - inside} \\div 2 = ${num(answer)}$%.
          `,
        };
      },
    },
    {
      id: 'not-normal',
      type: 'choice',
      title: 'Not everything is a bell',
      text: `
        In the made-up town, incomes have a mean of 41 and a standard deviation of 22 (thousand dollars).
        Someone applies the rule:

        > 95% of people earn between 41 − 44 and 41 + 44, so between −3 and 85 thousand.

        **What went wrong?**
      `,
      options: [
        { text: 'The rule is for bell-shaped data, and incomes are skewed', correct: true },
        { text: 'The subtraction is wrong', why: 'The arithmetic is fine: two SDs below the mean really is 41 − 44 = −3. The trouble is using the rule at all.' },
        { text: 'A standard deviation cannot be that large', why: 'It can. A long tail of high incomes makes the spread large, and that is exactly what skewed data does.' },
        { text: 'Nothing: some people do have negative incomes', why: 'Not in this town: the lowest income in the data is about 10 thousand.' },
      ],
      columns: 1,
      explain: `
        The 68–95–99.7 rule describes one particular shape: the symmetric bell. It promises 2.5% of people below −3 and 2.5% above 85.

        In this skewed data, nobody is below the lower limit and about 5% are above the upper one. Incomes, house prices and waiting times are rarely bell-shaped. **Look at the shape before you trust the rule.**
      `,
    },
    {
      id: 'reflect',
      type: 'reflect',
      text: `
        Think of something you could measure about your own life every day for a year: minutes on your phone, time you wake up, money you spend.

        **What shape would its histogram have, and why?**
      `,
      model: `
        For example: money spent per day is probably **skewed right**. Most days are small and similar, a few days (rent, a trip, a big shop) are far larger, and no day can go below zero.

        Wake-up time might have **two peaks**: one for workdays and one for days off. Whatever you chose, the useful habit is to ask about the *shape* and not only the average.
      `,
    },
  ],
  recap: [
    'A histogram shows the **shape** of data. Its bin width is a choice: too wide hides the shape, too narrow shows noise.',
    'Shapes have names: symmetric, skewed left or right (named after the tail), bimodal.',
    'The mean is dragged towards the tail; the median stays with the bulk of the data.',
    'For bell-shaped data, about 68% / 95% / 99.7% of values lie within 1 / 2 / 3 SDs of the mean. Check the shape first.',
  ],
  next: 'Next: two measurements for every dot. Do they move together?',
};
