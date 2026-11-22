// Data & Statistics · Lesson 2 · How Spread Out?
import { r, num, sum } from '../../../kit.js';
import { listOf, describe } from '../helpers.js';

const PUZZLE = [3, 3, 4, 4, 5, 5, 18];

export default {
  id: 'spread',
  steps: [
    {
      id: 'hook',
      type: 'choice',
      mode: 'predict',
      title: 'Would you wade across?',
      text: `
        A sign by a river says: *average depth 1 metre*.

        You are 1.7 m tall and cannot swim. **Is it safe to walk across?**
      `,
      shuffle: false,
      options: [
        { text: 'Yes: 1 m is far below my head' },
        { text: 'No: it must be deeper than that somewhere' },
        { text: 'The average alone cannot tell me', correct: true },
      ],
      explain: `
        An average depth of 1 m could be a flat riverbed that is waist-deep all the way.
        It could also be wide, ankle-deep shallows with a 4-metre channel in the middle.

        The mean tells you where the data is centred. It says nothing about how far the values **spread** around it. That is today's question.
      `,
    },
    {
      id: 'same-mean',
      type: 'interact',
      graded: false,
      title: 'Same mean, different data',
      text: `
        These five dots all sit at 5, so their mean is 5.

        **Pull the dots apart, as far as you dare, but finish with the mean still at exactly 5.**
      `,
      widget: {
        type: 'dot-plot', min: 0, max: 10, values: [5, 5, 5, 5, 5], show: ['mean'], rows: 5,
        alt: 'Five draggable dots stacked at 5 on a ruler from 0 to 10, with the mean marked underneath.',
      },
      check: (s) => {
        if (s.mean !== 5) return `The mean has drifted to ${num(s.mean)}. For every step a dot takes to the right, another must take a step to the left.`;
        if (s.range < 6) return 'The mean is right. Now be bolder: spread the dots much further apart.';
        return true;
      },
      solution: { values: [1, 3, 5, 7, 9] },
      explain: `
        You just built a completely different data set with exactly the same mean.
        To keep the balance, every step to the right had to be paid for with a step to the left.

        The mean cannot tell these data sets apart. We need a second number: one that measures **spread**.
      `,
    },
    {
      id: 'teach-range',
      type: 'info',
      title: 'A number for the spread',
      text: r`
        **Spread** is how far apart the values lie. The simplest way to measure it is the **range**: the largest value minus the smallest.

        :::example
        The dots 1, 3, 5, 7, 9 have a mean of 5. Largest: 9. Smallest: 1. Range: $9 - 1 = 8$.

        Five dots that all sit at 5 also have a mean of 5, but their range is $5 - 5 = 0$.
        :::

        A small spread means the values stay close together: the data is **consistent**. A large spread means they stray far apart.
      `,
      figure: {
        type: 'dot-plot', min: 0, max: 10, values: [1, 3, 5, 7, 9], drag: false, show: ['mean', 'range'], rows: 2,
        alt: 'Five dots at 1, 3, 5, 7 and 9 on a ruler, with the mean marked at 5 and a bracket from 1 to 9 showing the range, 8.',
        caption: 'Same mean as five dots at 5, but a range of 8 instead of 0.',
      },
    },
    {
      id: 'range',
      type: 'numeric',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { what: 'A bus was this many minutes late on seven mornings', lo: 0, hi: 16, unit: 'minutes' },
          { what: 'The temperature at noon, in °C, on seven days', lo: 11, hi: 32, unit: '°C' },
          { what: 'Seven parcels took this many days to arrive', lo: 1, hi: 15, unit: 'days' },
          { what: 'A team scored this many points in its last seven games', lo: 48, hi: 96, unit: 'points' },
        ]);
        let values;
        let lo;
        let hi;
        for (let tries = 0; tries < 50; tries++) {
          values = Array.from({ length: 7 }, () => rng.int(scene.lo, scene.hi));
          lo = Math.min(...values);
          hi = Math.max(...values);
          const ends = Math.abs(values[6] - values[0]);
          if (hi - lo >= 5 && ends !== hi - lo) break;
        }
        return {
          text: `The simplest measure of spread is the **range**: the largest value minus the smallest.\n\n${scene.what}: **${listOf(values)}**. What is the range?`,
          answer: hi - lo,
          unit: scene.unit,
          wrong: [
            [hi, 'That is the largest value. Now subtract the smallest from it.'],
            [Math.abs(values[6] - values[0]), 'Use the largest and the smallest values, wherever they are in the list.'],
            [hi + lo, 'Subtract, do not add: the range is the gap between the two extremes.'],
          ],
          hints: [`The largest value is ${hi}. What is the smallest?`],
          explain: `Largest: ${hi}. Smallest: ${lo}. Range: $${hi} - ${lo} = ${hi - lo}$.`,
        };
      },
    },
    {
      id: 'range-flaw',
      type: 'numeric',
      title: 'One slow friend',
      text: `
        Seven friends timed themselves on a puzzle: 3, 3, 4, 4, 5, 5 and 18 minutes.
        The range is $18 - 3 = 15$ minutes.

        **What would the range be if the slowest friend had not taken part?**
      `,
      figure: {
        type: 'dot-plot', min: 0, max: 20, major: 2, values: PUZZLE, drag: false, show: ['range'], rows: 2, unit: 'min',
        alt: 'Dot plot of the seven times: six dots between 3 and 5 minutes and one far away at 18.',
      },
      answer: 2,
      unit: 'minutes',
      wrong: [[15, 'That is the range with all seven friends. Leave out the 18.'], [5, 'That is the new largest value. Subtract the smallest, 3.']],
      explain: `
        Without the 18, the times run from 3 to 5: a range of just **2** minutes.

        One person out of seven moved the range from 2 to 15. The range looks only at the two most extreme values, so a single unusual value can take it over.
      `,
    },
    {
      id: 'iqr-idea',
      type: 'info',
      title: 'Look at the middle half',
      text: `
        To stop one odd value running the show, measure the **middle half** of the data instead.
        Sort the values. The median splits them into a lower half and an upper half.

        :::example The puzzle times
        Sorted: 3, 3, 4, **4**, 5, 5, 18. The median is the 4th value, 4.

        - Lower half: 3, 3, 4. Its middle, 3, is the **lower quartile, Q1**.
        - Upper half: 5, 5, 18. Its middle, 5, is the **upper quartile, Q3**.
        - **Interquartile range:** IQR = Q3 − Q1 = 5 − 3 = 2, the width of the middle half.
        :::

        A **box plot** draws all of this: a box from Q1 to Q3, a line at the median, and whiskers out to the smallest and largest values.
      `,
      figure: {
        type: 'dot-plot', min: 0, max: 20, major: 2, values: PUZZLE, drag: [6], show: ['box'], rows: 3, readouts: ['range', 'iqr'],
        alt: 'The seven puzzle times with a box plot above them. The box spans 3 to 5; the right whisker reaches the slow friend at 18.',
        caption: 'The puzzle times again. Drag the slow friend (orange) anywhere you like: the whisker follows, the box stays put.',
      },
    },
    {
      id: 'iqr-calc',
      type: 'fill',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          'Seven runners finished a lap in these times (seconds)',
          'Seven stalls at a market sold this many melons',
          'Seven students scored these marks on a quiz',
          'Seven flights were delayed by this many minutes',
        ]);
        const sorted = rng.sample(Array.from({ length: 38 }, (_, i) => i + 12), 7).sort((a, b) => a - b);
        const values = rng.shuffle(sorted);
        const d = describe(values);
        return {
          text: `
            ${scene}: **${listOf(values)}**.

            Find the quartiles. Q1 is the median of the values *below* the median; Q3 is the median of the values *above* it.
          `,
          template: `Median = [[${d.median}]], Q1 = [[${d.q1}]], Q3 = [[${d.q3}]], so IQR = [[${d.iqr}]].`,
          hints: [
            `Sort first: ${listOf(sorted)}.`,
            'The median is the 4th of the seven. That leaves three values below it and three above. Take the middle one of each three.',
          ],
          explain: `
            Sorted: ${sorted.slice(0, 3).join(', ')}, **${sorted[3]}**, ${sorted.slice(4).join(', ')}. The median is the 4th value, ${d.median}.

            The lower half is ${sorted.slice(0, 3).join(', ')}, with middle **Q1 = ${d.q1}**. The upper half is ${sorted.slice(4).join(', ')}, with middle **Q3 = ${d.q3}**.
            So IQR $= ${d.q3} - ${d.q1} = ${d.iqr}$.

            (Software uses slightly different recipes for quartiles, so its answers can differ a little on small data sets.)
          `,
        };
      },
    },
    {
      id: 'box-task',
      type: 'interact',
      attempts: 6,
      title: 'Wide whiskers, narrow box',
      text: `
        Range and IQR measure different things, so you can set them separately.

        **Arrange these seven dots so that the range is 10, but the IQR is only 2.**
      `,
      widget: {
        type: 'dot-plot', min: 0, max: 10, values: [2, 3, 4, 5, 6, 7, 8], show: ['box'], rows: 3, readouts: ['range', 'iqr'],
        alt: 'Seven draggable dots on a ruler from 0 to 10 with a box plot above them.',
      },
      check: (s) => {
        if (s.range !== 10 && s.iqr !== 2) return `Range ${num(s.range)}, IQR ${num(s.iqr)}. Start with the range: the whiskers must reach from one end of the ruler to the other.`;
        if (s.range !== 10) return `The IQR is right, but the range is ${num(s.range)}. One dot must sit at 0 and one at 10.`;
        if (s.iqr > 2) return `The range is right, but the box is ${num(s.iqr)} wide. Squeeze the middle dots closer together.`;
        if (s.iqr < 2) return `The range is right, but the box is only ${num(s.iqr)} wide. Let the middle dots spread a little.`;
        return true;
      },
      solution: { values: [0, 4, 4, 5, 6, 6, 10] },
      hints: [
        'With seven dots, Q1 is the 2nd dot from the left and Q3 is the 2nd from the right.',
        'Put one dot at 0 and one at 10. The box then runs from the lowest to the highest of the other five, so make that stretch exactly 2.',
      ],
      explain: `
        For example: 0, 4, 4, 5, 6, 6, 10. The two outer dots set the range. The box only cares about the middle of the pack.

        A wide range with a narrow box means: most values are close together, with a few stragglers.
      `,
    },
    {
      id: 'sd-idea',
      type: 'info',
      title: 'How far is typical?',
      text: `
        Range and IQR each look at just two positions. The **standard deviation (SD)** listens to every value.
        It answers: *how far, typically, is a value from the mean?*

        In the figure, each bar is one value's distance from the mean. Some bars are longer than the SD and some are shorter: the SD is a typical one.
        If every value were exactly 2 away from the mean, the SD would be exactly 2.
      `,
      figure: {
        type: 'dot-plot', min: 0, max: 10, values: [2, 4, 5, 6, 8], layout: 'rows', show: ['mean', 'deviations', 'sd'],
        alt: 'Five dots at 2, 4, 5, 6 and 8, each joined to the mean at 5 by a bar. A bracket shows the standard deviation, 2.',
        caption: 'Drag the dots. Bunch them up and the SD shrinks; fling them apart and it grows.',
      },
    },
    {
      id: 'example-sd',
      type: 'info',
      title: 'Worked example: the standard deviation',
      text: r`
        The exact recipe has three steps: **square** each distance from the mean, **average** the squares, take the **square root**.

        :::example
        Four parcels took 1, 7, 7 and 9 days to arrive. Their mean is $24 \div 4 = 6$ days.

        1. Distances from the mean: 5, 1, 1, 3.
        2. **Square** them: 25, 1, 1, 9.
        3. **Average** the squares: $36 \div 4 = 9$.
        4. Take the **square root**: $\sqrt{9} = 3$. The SD is 3 days.
        :::

        Squaring makes every distance positive and lets far-away values count extra. The square root brings the answer back to days.
      `,
      figure: {
        type: 'dot-plot', min: 0, max: 10, values: [1, 7, 7, 9], drag: false, layout: 'rows', show: ['mean', 'deviations', 'sd'],
        alt: 'Four dots at 1, 7, 7 and 9, each joined to the mean at 6 by a bar. The bars are 5, 1, 1 and 3 long. A bracket shows the standard deviation, 3.',
        caption: 'The four bars are the distances 5, 1, 1 and 3. The SD, 3, is a typical one.',
      },
    },
    {
      id: 'sd-recipe',
      type: 'fill',
      title: 'The recipe, once',
      text: r`
        Now you. Remember the recipe: **square** each distance from the mean, **average** the squares, take the **square root**.

        Try it on 2, 4, 5, 6, 8, whose mean is 5.

        | Value | 2 | 4 | 5 | 6 | 8 |
        |---|---|---|---|---|---|
        | Distance from 5 | 3 | 1 | 0 | 1 | 3 |
        | Squared | 9 | 1 | 0 | 1 | 9 |
      `,
      template: 'The squares add up to [[20]]. Their average is [[4]]. So the standard deviation is [[2]].',
      hints: ['Add the bottom row of the table: 9 + 1 + 0 + 1 + 9.', 'There are five values, so divide the total by 5. Then take the square root.'],
      explain: r`
        $9 + 1 + 0 + 1 + 9 = 20$, then $20 \div 5 = 4$, then $\sqrt{4} = 2$.

        Spreadsheets often divide by one less than the count, a correction for data that is only a sample of something bigger. They would report a slightly larger number here.
      `,
    },
    {
      id: 'max-spread',
      type: 'interact',
      attempts: 6,
      stretch: true,
      title: 'As spread out as possible',
      text: `
        Five dots, and the mean must stay at exactly **5**.

        **Arrange them so the standard deviation is as large as it can possibly be.**
      `,
      widget: {
        type: 'dot-plot', min: 0, max: 10, values: [3, 4, 5, 6, 7], layout: 'rows', show: ['mean', 'deviations', 'sd'],
        alt: 'Five draggable dots, each joined to the mean by a bar, with the standard deviation shown.',
      },
      check: (s) => {
        if (s.mean !== 5) return `The mean is ${num(s.mean)}. It has to stay at exactly 5.`;
        if (s.sd >= 4.47) return true;
        if (s.range < 10) return `SD ${num(s.sd, 2)}. You can do better: the dots do not reach both ends of the ruler yet.`;
        return `SD ${num(s.sd, 2)}. Closer. How many dots can sit at the very ends while the mean stays at 5?`;
      },
      solution: { values: [0, 0, 5, 10, 10] },
      hints: [
        'Distance from the mean is what counts. Where on this ruler is a dot furthest from 5?',
        'Two dots at 0 and two at 10 balance each other. Where must the fifth go to keep the mean at 5?',
      ],
      explain: r`
        The winner is 0, 0, 5, 10, 10. Four dots sit as far from the mean as the ruler allows.
        The fifth has no choice: only 5 keeps the mean at 5.

        That gives SD $= \sqrt{(25 + 25 + 0 + 25 + 25) \div 5} = \sqrt{20} \approx 4.47$.
        Spread is greatest when the data sits in two camps, far from its own mean.
      `,
    },
    {
      id: 'biggest-sd',
      type: 'choice',
      text: 'These three data sets all have a mean of 5 and a range of 10. **Which one has the largest standard deviation?**',
      columns: 1,
      options: [
        {
          text: '',
          figure: { type: 'dot-plot', min: 0, max: 10, values: [0, 4, 5, 5, 5, 5, 6, 10], show: ['mean'], rows: 4, alt: 'Most dots piled up at 4, 5 and 6, with single dots at 0 and 10.' },
          why: 'Most of these dots sit right at the mean, so the typical distance is small. Only two are far out.',
        },
        {
          text: '',
          figure: { type: 'dot-plot', min: 0, max: 10, values: [0, 1, 3, 4, 6, 7, 9, 10], show: ['mean'], rows: 4, alt: 'Eight dots spread evenly from 0 to 10.' },
          why: 'These are spread evenly, so some are close to the mean and some far. Another set keeps *all* its dots far away.',
        },
        {
          text: '',
          figure: { type: 'dot-plot', min: 0, max: 10, values: [0, 0, 1, 1, 9, 9, 10, 10], show: ['mean'], rows: 4, alt: 'Four dots at 0 and 1, four dots at 9 and 10, nothing in between.' },
          correct: true,
        },
      ],
      hints: ['The SD is about the typical distance from the mean (the orange pivot). In which picture are the dots furthest from it, on the whole?'],
      explain: `
        The set with two camps at the ends wins: every one of its dots is 4 or 5 away from the mean, giving an SD of about 4.5.
        The evenly spread set has an SD of about 3.4, and the one piled up in the middle only about 2.5.

        Same mean, same range, three different standard deviations. The SD notices *where the bulk of the data is*.
      `,
    },
    {
      id: 'consistent',
      type: 'choice',
      review: true,
      gen: (rng) => {
        const scene = rng.pick([
          { intro: 'Two machines fill bags that should each hold 500 g of rice. Five bags from each were weighed, in grams', names: ['Machine A', 'Machine B'], centre: 500, q: 'Which machine is more **consistent**?' },
          { intro: 'Two routes to work both take 30 minutes on average. Here are five recent journey times for each, in minutes', names: ['Route A', 'Route B'], centre: 30, small: 1, q: 'You must not be late. Which route is more **reliable**?' },
          { intro: 'Two ovens are both set to 180 °C. Each was measured five times', names: ['Oven A', 'Oven B'], centre: 180, q: 'Which oven holds its temperature more **steadily**?' },
        ]);
        const shape = rng.pick([[-2, -1, 0, 1, 2], [-3, -1, 0, 1, 3], [-2, -2, 0, 2, 2], [-4, -1, 0, 2, 3]]);
        const small = scene.small || rng.pick([1, 2]);
        const large = small * rng.pick([4, 5]);
        const tightFirst = rng.bool();
        const make = (k) => rng.shuffle(shape.map((d) => scene.centre + d * k));
        const a = make(tightFirst ? small : large);
        const b = make(tightFirst ? large : small);
        const range = (v) => Math.max(...v) - Math.min(...v);
        const [tight, wide] = tightFirst ? [0, 1] : [1, 0];
        const sets = [a, b];
        return {
          text: `
            ${scene.intro}.

            - ${scene.names[0]}: **${listOf(a)}**
            - ${scene.names[1]}: **${listOf(b)}**

            ${scene.q}
          `,
          options: [
            { text: `${scene.names[tight]}: its range is ${range(sets[tight])}, against ${range(sets[wide])}`, correct: true },
            { text: `${scene.names[wide]}: its range is ${range(sets[wide])}, against ${range(sets[tight])}`, why: 'A larger range means the values stray further from each other. That is less consistent, not more.' },
            { text: `Neither: both have a mean of ${scene.centre}, so they are the same`, why: 'The means match, but the mean says nothing about spread. Compare how far the values stray from it.' },
          ],
          columns: 1,
          explain: `
            Both sets have a mean of ${sum(a) / 5}. But ${scene.names[tight]} stays within ${range(sets[tight])} from lowest to highest,
            while ${scene.names[wide]} swings across ${range(sets[wide])}. A smaller spread means more consistent.
          `,
        };
      },
    },
    {
      id: 'measures',
      type: 'match',
      review: true,
      text: 'Match each measure with what it tells you.',
      pairs: [
        ['Range', 'Largest value minus smallest'],
        ['Interquartile range', 'Width of the middle half of the data'],
        ['Standard deviation', 'Typical distance from the mean'],
        ['Median', 'The middle value: centre, not spread'],
      ],
      explain: 'The range uses only the two extremes, the IQR ignores the outer quarters, and the standard deviation listens to every value.',
    },
  ],
  recap: [
    'Data sets with the same mean can be completely different. A measure of **spread** tells them apart.',
    '**Range** = largest − smallest. Simple, but one odd value can take it over.',
    '**IQR** = Q3 − Q1, the width of the middle half. A box plot draws it.',
    '**Standard deviation** is the typical distance of the values from their mean.',
  ],
  next: 'Next: from a handful of dots to hundreds. What shape does your data make?',
};
